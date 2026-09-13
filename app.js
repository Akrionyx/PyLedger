/* ============================================================
   PyLedger app engine — v2

   What changed in this version (all self-contained in this file):
    1.  Resume now jumps to the first unfinished lesson, always.
    2.  Every run/check gets a fresh Python namespace (no leftovers).
    3.  Python runs in a background worker + a Stop button, so an
        infinite loop can no longer freeze the page.
    4.  A lesson can go back to "not done" if the answer stops passing.
    5.  Typed code is saved per lesson and restored.
    6.  Python engine preloads quietly in the background.
    7.  Hint + Show solution (after 3 failed checks).
    8.  Ctrl/Cmd+Enter = Run, Ctrl/Cmd+Shift+Enter = Check.
    9.  Quiz answers are restored when you revisit a lesson.
    10. Sidebar updates in place instead of rebuilding (no flicker).
    11. Export / Import progress as a file.
    12. Lesson search, per-lesson time estimate, per-module counts.
    13. Symbol toolbar above the editor on phones.
    14. Module review + "Practice your mistakes" mode.
   ============================================================ */

const STORAGE_KEY = 'pyledger_progress_v1';
const OPEN_MODULES_KEY = 'pyledger_open_modules_v1';
const CODE_KEY = 'pyledger_code_v1';

let currentEditor = null;
let flatLessons = [];   // [{ moduleIndex, moduleTitle, lessonIndex, lesson, globalIndex }]
let currentLessonId = null;
let sidebarFilter = '';
let lessonNodes = {};   // lessonId -> sidebar button element
let moduleNodes = {};   // moduleIndex -> { block, count }

/* ---------------- small helpers ---------------- */

function $id(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]*>/g, ' ');
}

function debounce(fn, ms) {
  let t = null;
  return function () {
    const args = arguments;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}

/* ---------------- progress storage ---------------- */

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
}
function loadOpenModules() {
  try { return new Set(JSON.parse(localStorage.getItem(OPEN_MODULES_KEY)) || []); }
  catch (e) { return new Set(); }
}
function saveOpenModules(set) {
  try { localStorage.setItem(OPEN_MODULES_KEY, JSON.stringify([...set])); } catch (e) {}
}
function loadSavedCode() {
  try { return JSON.parse(localStorage.getItem(CODE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveSavedCode(obj) {
  try { localStorage.setItem(CODE_KEY, JSON.stringify(obj)); } catch (e) {}
}

let progress = loadProgress();
let openModules = loadOpenModules();
let savedCode = loadSavedCode();

function isLessonDone(lessonId) {
  return !!(progress[lessonId] && progress[lessonId].done);
}

/* POINT 4: "done" is recalculated every time instead of being sticky,
   so a lesson can drop back to incomplete if the answer stops passing. */
function setLessonProgress(lessonId, patch) {
  const existing = progress[lessonId] || {};
  const merged = Object.assign({}, existing, patch);
  const entry = flatLessons.find(f => f.lesson.id === lessonId);
  const lesson = entry ? entry.lesson : null;
  const needsExercise = !!(lesson && lesson.exercise);
  const needsQuiz = !!(lesson && lesson.quiz);

  if (needsExercise || needsQuiz) {
    const exerciseOk = !needsExercise || !!merged.exercisePassed;
    const quizOk = !needsQuiz || !!merged.quizPassed;
    merged.done = exerciseOk && quizOk;
  } else {
    merged.done = !!merged.manuallyMarked;
  }

  progress[lessonId] = merged;
  saveProgress(progress);
  renderProgressSummary();
  updateSidebarStates();
}

/* The old version could mark a lesson done without recording which part
   was passed. Because "done" is now recalculated, those records would
   quietly go back to incomplete — so fill in the missing flags once. */
function migrateProgress() {
  let changed = false;
  flatLessons.forEach(f => {
    const rec = progress[f.lesson.id];
    if (!rec || !rec.done) return;
    if (f.lesson.exercise && rec.exercisePassed === undefined) { rec.exercisePassed = true; changed = true; }
    if (f.lesson.quiz && rec.quizPassed === undefined) { rec.quizPassed = true; changed = true; }
    if (!f.lesson.exercise && !f.lesson.quiz && !rec.manuallyMarked) { rec.manuallyMarked = true; changed = true; }
  });
  if (changed) saveProgress(progress);
}

function saveCodeFor(lessonId, code) {
  savedCode[lessonId] = code;
  saveSavedCode(savedCode);
}

/* ---------------- flatten course + time estimates ---------------- */

function estimateMinutes(lesson) {
  const words = stripHtml(lesson.body).split(/\s+/).filter(Boolean).length;
  let mins = Math.ceil(words / 180);
  if (lesson.example) mins += 1;
  if (lesson.exercise) mins += 4;
  if (lesson.quiz) mins += 1;
  return Math.max(1, mins);
}

function flattenCourse() {
  flatLessons = [];
  COURSE.forEach((mod, mi) => {
    mod.lessons.forEach((lesson, li) => {
      flatLessons.push({
        moduleIndex: mi,
        moduleTitle: mod.title,
        lessonIndex: li,
        lesson,
        minutes: estimateMinutes(lesson)
      });
    });
  });
  flatLessons.forEach((f, i) => { f.globalIndex = i; });
}

function moduleStats(mi) {
  const items = flatLessons.filter(f => f.moduleIndex === mi);
  const done = items.filter(f => isLessonDone(f.lesson.id)).length;
  const minutes = items.reduce((sum, f) => sum + f.minutes, 0);
  return { total: items.length, done, minutes };
}

/* ============================================================
   POINT 3 + POINT 2: Python runs in a background worker.
   - A runaway loop can be stopped without killing the page.
   - Every run gets a brand new namespace, so variables from an
     earlier lesson can never make a later answer pass by accident.
   ============================================================ */

const WORKER_SRC = [
  "let pyodide = null, ready = null;",
  "function post(m){ self.postMessage(m); }",
  "async function boot(indexURL){",
  "  if (!ready) {",
  "    ready = (async function(){",
  "      importScripts(indexURL + 'pyodide.js');",
  "      pyodide = await loadPyodide({ indexURL: indexURL });",
  "      return pyodide;",
  "    })();",
  "  }",
  "  return ready;",
  "}",
  "self.onmessage = async function(e){",
  "  var d = e.data, id = d.id;",
  "  if (d.type === 'boot') {",
  "    try { await boot(d.indexURL); post({ id: id, type: 'ready' }); }",
  "    catch (err) { post({ id: id, type: 'bootfail', error: String(err) }); }",
  "    return;",
  "  }",
  "  var ns = null, captured = '';",
  "  try {",
  "    var py = await boot(d.indexURL);",
  "    py.setStdout({ batched: function(s){ captured += s + '\\n'; post({ id: id, type: 'stdout', chunk: s + '\\n' }); } });",
  "    py.setStderr({ batched: function(s){ captured += s + '\\n'; post({ id: id, type: 'stdout', chunk: s + '\\n' }); } });",
  "    ns = py.toPy({});",
  "    // run the learner's code as-is: this keeps top-level await working",
  "    await py.runPythonAsync(d.code, { globals: ns });",
  "    if (d.type === 'check' && d.testCode) {",
  "      try { ns.set('__pyledger_stdout__', captured); }",
  "      catch (e3) { await py.runPythonAsync('__pyledger_stdout__ = ' + JSON.stringify(captured), { globals: ns }); }",
  "      await py.runPythonAsync(d.testCode, { globals: ns });",
  "    }",
  "    post({ id: id, type: 'done', stdout: captured });",
  "  } catch (err) {",
  "    post({ id: id, type: 'error', error: (err && err.message) ? err.message : String(err) });",
  "  } finally {",
  "    if (ns) { try { ns.destroy(); } catch (e2) {} }",
  "  }",
  "};"
].join('\n');

const PyEngine = {
  worker: null,
  seq: 0,
  pending: new Map(),
  indexURL: null,
  state: 'idle',       // idle | booting | ready | failed
  busy: false,
  mainPy: null,        // fallback if workers are unavailable
  mainPyLoading: null,
  useWorker: true,

  detectIndexURL() {
    if (this.indexURL) return this.indexURL;
    if (window.__PYODIDE_INDEX_URL__) { this.indexURL = window.__PYODIDE_INDEX_URL__; return this.indexURL; }
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const hit = scripts.map(s => s.src).find(src => /pyodide/i.test(src));
    if (hit) this.indexURL = hit.slice(0, hit.lastIndexOf('/') + 1);
    else this.indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
    return this.indexURL;
  },

  createWorker() {
    const blob = new Blob([WORKER_SRC], { type: 'text/javascript' });
    const w = new Worker(URL.createObjectURL(blob));
    w.onmessage = (e) => {
      const d = e.data;
      const job = this.pending.get(d.id);
      if (!job) return;
      if (d.type === 'stdout') { if (job.onStdout) job.onStdout(d.chunk); return; }
      this.pending.delete(d.id);
      this.busy = this.pending.size > 0;
      if (d.type === 'ready') { this.state = 'ready'; job.resolve({ ok: true }); }
      else if (d.type === 'bootfail') { this.state = 'failed'; job.reject(new Error(d.error)); }
      else if (d.type === 'done') { job.resolve({ ok: true, stdout: d.stdout }); }
      else if (d.type === 'error') { job.resolve({ ok: false, error: d.error }); }
    };
    w.onerror = () => {
      this.useWorker = false;
      this.state = 'idle';
      this.pending.forEach(job => job.reject(new Error('worker-failed')));
      this.pending.clear();
      this.busy = false;
    };
    return w;
  },

  ensureWorker() {
    if (!this.worker) {
      try { this.worker = this.createWorker(); }
      catch (e) { this.useWorker = false; }
    }
    return this.worker;
  },

  send(msg, onStdout) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending.set(id, { resolve, reject, onStdout });
      this.busy = true;
      const w = this.ensureWorker();
      if (!w) { this.pending.delete(id); this.busy = false; reject(new Error('no-worker')); return; }
      w.postMessage(Object.assign({ id, indexURL: this.detectIndexURL() }, msg));
    });
  },

  /* POINT 6: start downloading Python quietly right after page load */
  preload() {
    if (!this.useWorker || this.state !== 'idle') return;
    this.state = 'booting';
    updateEngineBadge();
    this.send({ type: 'boot' })
      .then(() => { this.state = 'ready'; updateEngineBadge(); })
      .catch(() => { this.state = 'idle'; updateEngineBadge(); });
  },

  /* POINT 3: hard stop. The worker is killed and replaced. */
  stop() {
    if (this.worker) { try { this.worker.terminate(); } catch (e) {} }
    this.worker = null;
    this.state = 'idle';
    this.busy = false;
    this.pending.forEach(job => job.resolve({ ok: false, stopped: true }));
    this.pending.clear();
    updateEngineBadge();
  },

  async execute(code, testCode, onStdout) {
    if (this.useWorker) {
      try {
        if (this.state === 'idle') this.state = 'booting';
        updateEngineBadge();
        const res = await this.send({ type: testCode ? 'check' : 'run', code, testCode }, onStdout);
        this.state = 'ready';
        updateEngineBadge();
        return res;
      } catch (e) {
        this.useWorker = false;   // fall through to the main-thread version
      }
    }
    return this.executeOnMainThread(code, testCode, onStdout);
  },

  async ensureMainPy() {
    if (this.mainPy) return this.mainPy;
    if (!this.mainPyLoading) {
      this.mainPyLoading = loadPyodide().then(py => { this.mainPy = py; return py; });
    }
    return this.mainPyLoading;
  },

  async executeOnMainThread(code, testCode, onStdout) {
    const py = await this.ensureMainPy();
    let buffered = '';
    py.setStdout({ batched: s => { buffered += s + '\n'; if (onStdout) onStdout(s + '\n'); } });
    py.setStderr({ batched: s => { buffered += s + '\n'; if (onStdout) onStdout(s + '\n'); } });
    let ns = null;
    try {
      ns = py.toPy({});
      await py.runPythonAsync(code, { globals: ns });
      if (testCode) {
        try { ns.set('__pyledger_stdout__', buffered); }
        catch (e3) { await py.runPythonAsync('__pyledger_stdout__ = ' + JSON.stringify(buffered), { globals: ns }); }
        await py.runPythonAsync(testCode, { globals: ns });
      }
      return { ok: true, stdout: buffered };
    } catch (err) {
      return { ok: false, error: (err && err.message) ? err.message : String(err) };
    } finally {
      if (ns) { try { ns.destroy(); } catch (e) {} }
      this.state = 'ready';
      updateEngineBadge();
    }
  }
};

function formatPyError(msg) {
  const text = String(msg || '');
  const lines = text.split('\n').filter(Boolean);
  return lines[lines.length - 1] || text;
}

function updateEngineBadge() {
  const el = $id('engineBadge');
  if (!el) return;
  const map = {
    idle: 'Python: not started',
    booting: 'Python: starting…',
    ready: 'Python: ready',
    failed: 'Python: unavailable'
  };
  el.textContent = map[PyEngine.state] || '';
  el.dataset.state = PyEngine.state;
}

/* ---------------- running + checking ---------------- */

function setRunningUI(on) {
  const stopBtn = $id('stopBtn');
  const runBtn = $id('runBtn');
  const checkBtn = $id('checkBtn');
  if (stopBtn) stopBtn.style.display = on ? 'inline-flex' : 'none';
  if (runBtn) runBtn.disabled = on;
  if (checkBtn) checkBtn.disabled = on;
}

async function runPython(code, outEl) {
  outEl.classList.remove('empty', 'err', 'ok');
  outEl.textContent = PyEngine.state === 'ready' ? 'Running…' : 'Starting Python (one-time setup, this can take a few seconds)…';
  setRunningUI(true);
  let streamed = '';
  const res = await PyEngine.execute(code, null, chunk => {
    streamed += chunk;
    outEl.textContent = streamed;
  });
  setRunningUI(false);
  if (res.stopped) {
    outEl.textContent = (streamed ? streamed + '\n' : '') + 'Stopped. Python has been restarted.';
    outEl.classList.add('err');
    return;
  }
  if (res.ok) {
    const text = (res.stdout || streamed).trim();
    outEl.textContent = text || '(no output — the code ran fine, but nothing was printed)';
    outEl.classList.add('ok');
  } else {
    outEl.textContent = (streamed ? streamed + '\n' : '') + formatPyError(res.error);
    outEl.classList.add('err');
  }
}

async function runCheck(lesson, editor, resultEl) {
  resultEl.textContent = PyEngine.state === 'ready' ? 'Checking…' : 'Starting Python…';
  resultEl.className = 'check-result';
  setRunningUI(true);
  const res = await PyEngine.execute(editor.getValue(), lesson.exercise.testCode || '', null);
  setRunningUI(false);

  if (res.stopped) {
    resultEl.textContent = 'Stopped before finishing.';
    resultEl.classList.add('fail');
    return;
  }
  if (res.ok) {
    resultEl.textContent = '✓ ' + (lesson.exercise.successMessage || 'Correct — nice work.');
    resultEl.classList.add('pass');
    setLessonProgress(lesson.id, { exercisePassed: true });
  } else {
    const attempts = ((progress[lesson.id] || {}).attempts || 0) + 1;
    resultEl.textContent = '✗ Not quite: ' + formatPyError(res.error);
    resultEl.classList.add('fail');
    setLessonProgress(lesson.id, { exercisePassed: false, attempts });
    maybeOfferSolution(lesson);
  }
  renderMarkCompleteRow(lesson);
}

/* POINT 7: hint always available, solution unlocks after 3 misses */
function maybeOfferSolution(lesson) {
  const btn = $id('solutionBtn');
  if (!btn) return;
  const attempts = (progress[lesson.id] || {}).attempts || 0;
  if (attempts >= 3) {
    btn.style.display = 'inline-flex';
    btn.textContent = 'Show solution';
  }
}

/* ---------------- sidebar ---------------- */

function buildSidebar() {
  const container = $id('moduleList');
  if (!container) return;
  container.innerHTML = '';
  lessonNodes = {};
  moduleNodes = {};

  const term = sidebarFilter.trim().toLowerCase();

  COURSE.forEach((mod, mi) => {
    const lessons = mod.lessons.filter(lesson => {
      if (!term) return true;
      const hay = (lesson.title + ' ' + stripHtml(lesson.body) + ' ' + (mod.title || '')).toLowerCase();
      return hay.indexOf(term) !== -1;
    });
    if (term && lessons.length === 0) return;

    const block = document.createElement('div');
    block.className = 'module-block' + ((openModules.has(mi) || term) ? ' open' : '');
    block.dataset.mi = mi;

    const stats = moduleStats(mi);
    const header = document.createElement('button');
    header.className = 'module-header';
    header.innerHTML =
      '<span class="num">' + (mi + 1) + '</span>' +
      '<span>' + escapeHtml(mod.shortTitle || mod.title) + '</span>' +
      '<span class="mod-count" data-mi="' + mi + '">' + stats.done + '/' + stats.total + '</span>' +
      '<span class="chev">▸</span>';
    header.addEventListener('click', () => {
      if (openModules.has(mi)) openModules.delete(mi); else openModules.add(mi);
      saveOpenModules(openModules);
      block.classList.toggle('open', openModules.has(mi));
    });
    block.appendChild(header);

    const list = document.createElement('div');
    list.className = 'lesson-list';
    lessons.forEach(lesson => {
      const item = document.createElement('button');
      item.className = 'lesson-item' +
        (isLessonDone(lesson.id) ? ' done' : '') +
        (lesson.id === currentLessonId ? ' active' : '');
      const entry = flatLessons.find(f => f.lesson.id === lesson.id);
      const mins = entry ? entry.minutes : 1;
      item.innerHTML =
        '<span class="lesson-check">' + (isLessonDone(lesson.id) ? '✓' : '') + '</span>' +
        '<span>' + escapeHtml(lesson.title) + '</span>' +
        '<span class="lesson-mins">' + mins + 'm</span>';
      item.addEventListener('click', () => goToLesson(lesson.id));
      lessonNodes[lesson.id] = item;
      list.appendChild(item);
    });
    block.appendChild(list);
    moduleNodes[mi] = { block, count: header.querySelector('.mod-count') };
    container.appendChild(block);
  });

  if (term && container.children.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sidebar-empty';
    empty.textContent = 'No lessons match that search. Try a different word.';
    container.appendChild(empty);
  }
}

/* POINT 10: update ticks and counts in place — no rebuild, no flicker */
function updateSidebarStates() {
  Object.keys(lessonNodes).forEach(id => {
    const node = lessonNodes[id];
    if (!node) return;
    const done = isLessonDone(id);
    node.classList.toggle('done', done);
    node.classList.toggle('active', id === currentLessonId);
    const check = node.querySelector('.lesson-check');
    if (check) check.textContent = done ? '✓' : '';
  });
  Object.keys(moduleNodes).forEach(mi => {
    const ref = moduleNodes[mi];
    if (!ref || !ref.count) return;
    const stats = moduleStats(Number(mi));
    ref.count.textContent = stats.done + '/' + stats.total;
  });
  updateMistakesButton();
}

function renderProgressSummary() {
  const total = flatLessons.length;
  const done = flatLessons.filter(f => isLessonDone(f.lesson.id)).length;
  const pc = $id('progressCount');
  const tb = $id('topbarProgress');
  const bar = $id('ledgerBarFill');
  if (pc) pc.textContent = done + ' / ' + total;
  if (tb) tb.textContent = done + ' / ' + total;
  if (bar) bar.style.width = (total ? Math.round((done / total) * 100) : 0) + '%';
}

/* ---------------- lesson rendering ---------------- */

function goToLesson(lessonId) {
  currentLessonId = lessonId;
  const entry = flatLessons.find(f => f.lesson.id === lessonId);
  if (entry && !openModules.has(entry.moduleIndex)) {
    openModules.add(entry.moduleIndex);
    saveOpenModules(openModules);
    const ref = moduleNodes[entry.moduleIndex];
    if (ref) ref.block.classList.add('open');
  }
  renderLesson();
  updateSidebarStates();
  window.scrollTo(0, 0);
  const main = $id('main');
  if (main) main.scrollTo(0, 0);
  closeMobileSidebar();
}

function renderLesson() {
  const entry = flatLessons.find(f => f.lesson.id === currentLessonId);
  if (!entry) return;
  const { lesson, moduleTitle, moduleIndex, lessonIndex, globalIndex, minutes } = entry;
  const root = $id('lessonRoot');
  if (!root) return;

  const ex = lesson.exercise;
  let html = '';
  html += '<div class="lesson-eyebrow">' + escapeHtml(moduleTitle) + ' · Lesson ' + (lessonIndex + 1) +
          ' · about ' + minutes + ' min</div>';
  html += '<h1>' + escapeHtml(lesson.title) + '</h1>';
  html += '<div class="lesson-body">' + lesson.body + '</div>';

  if (lesson.example) {
    html += '<div class="panel-label">Example</div>';
    html += '<div class="terminal"><div class="terminal-dots"><span></span><span></span><span></span></div>' +
            '<div class="terminal-inner"><pre class="example-code">' + escapeHtml(lesson.example) + '</pre></div></div>';
  }

  if (ex) {
    html += '<div class="panel-label">Your turn</div>';
    html += '<div class="lesson-body"><p>' + ex.prompt + '</p></div>';
    html += '<div class="terminal">' +
      '<div class="sym-bar" id="symBar"></div>' +
      '<div class="editor-wrap" id="editorWrap"></div>' +
      '<div class="run-row">' +
        '<button class="btn btn-primary" id="runBtn">Run code</button>' +
        '<button class="btn btn-ghost" id="checkBtn">Check my answer</button>' +
        '<button class="btn btn-stop" id="stopBtn" style="display:none">Stop</button>' +
        (ex.hint ? '<button class="btn btn-ghost" id="hintBtn">Hint</button>' : '') +
        (ex.solution ? '<button class="btn btn-ghost" id="solutionBtn" style="display:none">Show solution</button>' : '') +
        '<button class="btn btn-ghost" id="resetCodeBtn">Reset code</button>' +
        '<span class="engine-badge" id="engineBadge"></span>' +
        '<span class="check-result" id="checkResult"></span>' +
      '</div>' +
      '<div class="hint-box" id="hintBox" style="display:none"></div>' +
      '<div class="output empty" id="outputEl"></div>' +
    '</div>';
  }

  if (lesson.quiz) html += renderQuizHtml(lesson.quiz);

  const isDone = isLessonDone(lesson.id);
  html += '<div class="mark-complete-row">';
  if (!ex && !lesson.quiz) {
    html += '<button class="btn btn-primary" id="markReadBtn">' + (isDone ? 'Marked as read ✓' : 'Mark as read') + '</button>';
  } else {
    html += '<span class="status-pill ' + (isDone ? '' : 'pending') + '">' +
            (isDone ? '✓ Lesson complete' : 'Complete the steps above to finish this lesson') + '</span>';
  }
  html += '</div>';

  /* POINT 14: checkpoint review at the end of a module.
     Your modules have at most one quiz each, so a single-module review
     would be one question. This reviews every question up to here. */
  const reviewPool = flatLessons.filter(f => f.globalIndex <= globalIndex && f.lesson.quiz);
  const isLastOfModule = !flatLessons[globalIndex + 1] || flatLessons[globalIndex + 1].moduleIndex !== moduleIndex;
  if (isLastOfModule && reviewPool.length >= 3) {
    html += '<div class="review-offer"><div><strong>Checkpoint.</strong> ' +
            'Run through all ' + reviewPool.length + ' questions from the modules you have covered so far.</div>' +
            '<button class="btn btn-primary" id="moduleReviewBtn">Start checkpoint</button></div>';
  }

  const prev = flatLessons[globalIndex - 1];
  const next = flatLessons[globalIndex + 1];
  html += '<div class="lesson-nav">' +
    '<button class="nav-btn" id="prevBtn" ' + (prev ? '' : 'disabled') + '>' +
      (prev ? '<span>← Previous</span>' + escapeHtml(prev.lesson.title) : '') + '</button>' +
    '<button class="nav-btn" id="nextBtn" style="text-align:right" ' + (next ? '' : 'disabled') + '>' +
      (next ? '<span>Next →</span>' + escapeHtml(next.lesson.title) : '') + '</button>' +
  '</div>';

  root.innerHTML = html;

  if (ex) wireEditor(lesson);
  if (lesson.quiz) wireQuiz(lesson);

  if (!ex && !lesson.quiz) {
    const btn = $id('markReadBtn');
    if (btn) btn.addEventListener('click', () => {
      setLessonProgress(lesson.id, { manuallyMarked: true });
      renderLesson();
    });
  }

  const mrBtn = $id('moduleReviewBtn');
  if (mrBtn) mrBtn.addEventListener('click', () => openReview(reviewPool, 'Checkpoint'));

  if (prev) $id('prevBtn').addEventListener('click', () => goToLesson(prev.lesson.id));
  if (next) $id('nextBtn').addEventListener('click', () => goToLesson(next.lesson.id));

  updateEngineBadge();
}

/* ---------------- editor ---------------- */

const SYMBOLS = ['    ', ':', '(', ')', '[', ']', '"', "'", '_', '=', '#', '.'];

function wireEditor(lesson) {
  const ex = lesson.exercise;
  const wrap = $id('editorWrap');
  if (!wrap) return;

  // POINT 5: restore whatever the learner typed last time
  const startValue = (savedCode[lesson.id] !== undefined && savedCode[lesson.id] !== null)
    ? savedCode[lesson.id]
    : (ex.starterCode || '');

  currentEditor = CodeMirror(wrap, {
    value: startValue,
    mode: 'python',
    theme: 'dracula',
    lineNumbers: true,
    indentUnit: 4,
    viewportMargin: Infinity,
    extraKeys: {
      // POINT 8: keyboard shortcuts
      'Ctrl-Enter': () => doRun(),
      'Cmd-Enter': () => doRun(),
      'Shift-Ctrl-Enter': () => doCheck(lesson),
      'Shift-Cmd-Enter': () => doCheck(lesson)
    }
  });

  const persist = debounce(() => saveCodeFor(lesson.id, currentEditor.getValue()), 400);
  currentEditor.on('change', persist);

  // POINT 13: symbol row for phone keyboards
  const symBar = $id('symBar');
  if (symBar) {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      SYMBOLS.forEach(sym => {
        const b = document.createElement('button');
        b.className = 'sym-key';
        b.type = 'button';
        b.textContent = sym === '    ' ? 'Tab' : sym;
        b.addEventListener('click', () => {
          currentEditor.replaceSelection(sym);
          currentEditor.focus();
        });
        symBar.appendChild(b);
      });
    } else {
      symBar.style.display = 'none';
    }
  }

  const outputEl = $id('outputEl');
  $id('runBtn').addEventListener('click', () => doRun());
  $id('checkBtn').addEventListener('click', () => doCheck(lesson));
  $id('stopBtn').addEventListener('click', () => {
    PyEngine.stop();
    setRunningUI(false);
    if (outputEl) {
      outputEl.textContent = 'Stopped. Python has been restarted — press Run when you are ready.';
      outputEl.classList.remove('empty', 'ok');
      outputEl.classList.add('err');
    }
  });

  const resetBtn = $id('resetCodeBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    currentEditor.setValue(ex.starterCode || '');
    saveCodeFor(lesson.id, ex.starterCode || '');
  });

  const hintBtn = $id('hintBtn');
  const hintBox = $id('hintBox');
  if (hintBtn && hintBox) hintBtn.addEventListener('click', () => {
    hintBox.style.display = 'block';
    hintBox.innerHTML = '<strong>Hint.</strong> ' + ex.hint;
  });

  const solBtn = $id('solutionBtn');
  if (solBtn && hintBox) {
    maybeOfferSolution(lesson);
    solBtn.addEventListener('click', () => {
      hintBox.style.display = 'block';
      hintBox.innerHTML = '<strong>One way to write it:</strong><pre class="hint-code">' + escapeHtml(ex.solution) + '</pre>' +
        '<button class="btn btn-ghost" id="useSolutionBtn">Put this in the editor</button>';
      const use = $id('useSolutionBtn');
      if (use) use.addEventListener('click', () => {
        currentEditor.setValue(ex.solution);
        saveCodeFor(lesson.id, ex.solution);
      });
    });
  }

  function doRun() {
    if (!outputEl) return;
    outputEl.classList.remove('empty');
    runPython(currentEditor.getValue(), outputEl);
  }
  function doCheck(les) {
    runCheck(les, currentEditor, $id('checkResult'));
  }
}

/* ---------------- quiz ---------------- */

function renderQuizHtml(quiz) {
  let html = '<div class="quiz"><div class="quiz-q">' + quiz.question + '</div><div class="quiz-options">';
  quiz.options.forEach((opt, i) => {
    html += '<button class="quiz-option" data-i="' + i + '">' + opt + '</button>';
  });
  html += '</div><div class="quiz-feedback" id="quizFeedback"></div></div>';
  return html;
}

/* POINT 9: a passed quiz comes back answered, with the right option marked */
function wireQuiz(lesson) {
  const options = Array.from(document.querySelectorAll('.quiz-option'));
  const feedback = $id('quizFeedback');
  const record = progress[lesson.id] || {};

  function lockAsPassed() {
    options.forEach((b, i) => {
      b.classList.remove('incorrect');
      b.classList.toggle('correct', i === lesson.quiz.correctIndex);
      b.disabled = true;
    });
    if (feedback) feedback.textContent = lesson.quiz.explanation || 'Correct.';
  }

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      options.forEach(b => b.classList.remove('correct', 'incorrect'));
      if (i === lesson.quiz.correctIndex) {
        setLessonProgress(lesson.id, { quizPassed: true });
        lockAsPassed();
        renderMarkCompleteRow(lesson);
      } else {
        btn.classList.add('incorrect');
        if (feedback) feedback.textContent = 'Not quite — try another option.';
        const wrong = (progress[lesson.id] || {}).quizWrong || 0;
        setLessonProgress(lesson.id, { quizWrong: wrong + 1, quizPassed: false });
      }
    });
  });

  if (record.quizPassed) lockAsPassed();
}

function renderMarkCompleteRow(lesson) {
  const isDone = isLessonDone(lesson.id);
  const row = document.querySelector('.mark-complete-row');
  if (row && (lesson.exercise || lesson.quiz)) {
    row.innerHTML = '<span class="status-pill ' + (isDone ? '' : 'pending') + '">' +
      (isDone ? '✓ Lesson complete' : 'Complete the steps above to finish this lesson') + '</span>';
  }
}

/* ============================================================
   POINT 14: review mode — module review and practice-your-mistakes
   ============================================================ */

let reviewQueue = [];
let reviewIndex = 0;
let reviewTitle = '';

function mistakeLessons() {
  return flatLessons.filter(f => f.lesson.quiz && (progress[f.lesson.id] || {}).quizWrong > 0);
}

function updateMistakesButton() {
  const btn = $id('practiceMistakesBtn');
  if (!btn) return;
  const n = mistakeLessons().length;
  btn.style.display = n ? 'block' : 'none';
  btn.textContent = 'Practice your mistakes (' + n + ')';
}

function openReview(entries, title) {
  if (!entries || !entries.length) return;
  reviewQueue = entries.slice();
  reviewIndex = 0;
  reviewTitle = title;
  const overlay = $id('reviewOverlay');
  if (overlay) { overlay.style.display = 'flex'; renderReviewCard(); }
}

function closeReview() {
  const overlay = $id('reviewOverlay');
  if (overlay) overlay.style.display = 'none';
  reviewQueue = [];
}

function renderReviewCard() {
  const body = $id('reviewBody');
  if (!body) return;

  if (reviewIndex >= reviewQueue.length) {
    body.innerHTML = '<h2>All done</h2><p class="review-sub">You worked through ' + reviewQueue.length +
      ' question' + (reviewQueue.length === 1 ? '' : 's') + '.</p>' +
      '<button class="btn btn-primary" id="reviewDoneBtn">Back to the lesson</button>';
    const d = $id('reviewDoneBtn');
    if (d) d.addEventListener('click', closeReview);
    return;
  }

  const entry = reviewQueue[reviewIndex];
  const quiz = entry.lesson.quiz;
  let html = '<div class="review-head">' + escapeHtml(reviewTitle) + ' · question ' + (reviewIndex + 1) +
             ' of ' + reviewQueue.length + '</div>';
  html += '<div class="quiz-q">' + quiz.question + '</div><div class="quiz-options">';
  quiz.options.forEach((opt, i) => {
    html += '<button class="quiz-option" data-i="' + i + '">' + opt + '</button>';
  });
  html += '</div><div class="quiz-feedback" id="reviewFeedback"></div>';
  html += '<div class="review-actions">' +
          '<button class="btn btn-ghost" id="reviewSkipBtn">Skip</button>' +
          '<button class="btn btn-ghost" id="reviewOpenLessonBtn">Open this lesson</button>' +
          '</div>';
  body.innerHTML = html;

  const feedback = $id('reviewFeedback');
  Array.from(body.querySelectorAll('.quiz-option')).forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      if (i === quiz.correctIndex) {
        btn.classList.add('correct');
        if (feedback) feedback.textContent = quiz.explanation || 'Correct.';
        // clearing the mistake once they get it right in review
        setLessonProgress(entry.lesson.id, { quizPassed: true, quizWrong: 0 });
        setTimeout(() => { reviewIndex++; renderReviewCard(); }, 900);
      } else {
        btn.classList.add('incorrect');
        if (feedback) feedback.textContent = 'Not quite — try another option.';
      }
    });
  });

  const skip = $id('reviewSkipBtn');
  if (skip) skip.addEventListener('click', () => { reviewIndex++; renderReviewCard(); });
  const open = $id('reviewOpenLessonBtn');
  if (open) open.addEventListener('click', () => { closeReview(); goToLesson(entry.lesson.id); });
}

/* ============================================================
   POINT 11: export / import progress
   ============================================================ */

function exportProgress() {
  const payload = {
    app: 'pyledger',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: progress,
    code: savedCode
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = 'pyledger-progress-' + stamp + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); }
    catch (e) { alert('That file could not be read. Pick the .json file that PyLedger exported.'); return; }
    if (!data || data.app !== 'pyledger' || typeof data.progress !== 'object') {
      alert('That does not look like a PyLedger progress file.');
      return;
    }
    const incoming = Object.keys(data.progress).length;
    if (!confirm('Import ' + incoming + ' lesson records? Anything further along on this device is kept.')) return;

    Object.keys(data.progress).forEach(id => {
      const mine = progress[id] || {};
      const theirs = data.progress[id] || {};
      progress[id] = Object.assign({}, theirs, {
        done: mine.done || theirs.done,
        exercisePassed: mine.exercisePassed || theirs.exercisePassed,
        quizPassed: mine.quizPassed || theirs.quizPassed
      });
    });
    if (data.code && typeof data.code === 'object') {
      Object.keys(data.code).forEach(id => {
        if (savedCode[id] === undefined) savedCode[id] = data.code[id];
      });
      saveSavedCode(savedCode);
    }
    saveProgress(progress);
    buildSidebar();
    renderProgressSummary();
    renderLesson();
    alert('Progress imported.');
  };
  reader.readAsText(file);
}

/* ---------------- mobile sidebar ---------------- */

function openMobileSidebar() {
  const s = $id('sidebar'), sc = $id('sidebarScrim');
  if (s) s.classList.add('open');
  if (sc) sc.classList.add('open');
}
function closeMobileSidebar() {
  const s = $id('sidebar'), sc = $id('sidebarScrim');
  if (s) s.classList.remove('open');
  if (sc) sc.classList.remove('open');
}

/* ---------------- extra UI injected by this file ---------------- */

function injectStyles() {
  if ($id('pyledgerV2Styles')) return;
  const css = [
    /* sidebar tools — ink-navy panel, gold accents */
    '.pl-tools{display:flex;flex-direction:column;gap:8px;padding:0 24px 14px;margin-bottom:4px;',
    'border-bottom:1px solid rgba(255,255,255,0.1)}',
    '.pl-search{width:100%;padding:8px 10px;border-radius:var(--radius);',
    'border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);',
    'color:var(--terminal-text);font-family:var(--font-body);font-size:13px}',
    '.pl-search::placeholder{color:rgba(220,230,220,0.4)}',
    '.pl-search:focus-visible{outline:2px solid var(--gold);outline-offset:1px}',
    '.pl-tool-row{display:flex;gap:8px}',
    '.pl-mini{flex:1;min-width:0;padding:7px 8px;border-radius:var(--radius);',
    'font-family:var(--font-body);font-size:12px;',
    'border:1px solid rgba(255,255,255,0.12);background:none;color:rgba(220,230,220,0.6)}',
    '.pl-mini:hover{color:#fff;border-color:rgba(255,255,255,0.3)}',
    '#practiceMistakesBtn{color:var(--gold);border-color:rgba(201,162,39,0.4)}',
    /* module counts sit right of the title, chevron stays pinned right */
    '.module-header .mod-count{margin-left:auto;font-family:var(--font-mono);font-size:11px;',
    'color:rgba(220,230,220,0.45)}',
    '.module-header .chev{margin-left:8px}',
    '.lesson-item .lesson-mins{margin-left:auto;font-family:var(--font-mono);font-size:10.5px;',
    'color:rgba(220,230,220,0.35);flex-shrink:0}',
    '.sidebar-empty{padding:14px 12px;font-size:13px;color:rgba(220,230,220,0.5)}',
    /* terminal-side controls */
    '.run-row{flex-wrap:wrap;row-gap:8px}',
    '.sym-bar{display:flex;gap:6px;flex-wrap:wrap;padding:8px 8px 2px}',
    '.sym-key{min-width:36px;padding:8px 10px;border-radius:var(--radius);',
    'font-family:var(--font-mono);font-size:13px;',
    'border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.06);color:var(--terminal-text)}',
    '.btn-stop{background:var(--red);color:#fff}',
    '.btn-stop:hover{background:#c84353}',
    '.btn:disabled{opacity:0.5}',
    '.engine-badge{font-family:var(--font-mono);font-size:11px;color:rgba(220,230,220,0.4)}',
    '.hint-box{margin:4px 12px 10px;padding:12px 14px;border-radius:var(--radius);',
    'font-size:14px;line-height:1.65;color:var(--terminal-text);',
    'background:rgba(255,255,255,0.05);border-left:2px solid var(--gold)}',
    '.hint-box .btn-ghost{margin-top:10px}',
    '.hint-code{margin:10px 0 0;padding:10px 12px;border-radius:var(--radius);background:rgba(0,0,0,0.35);',
    'font-family:var(--font-mono);font-size:13px;white-space:pre;overflow-x:auto}',
    /* checkpoint banner sits on the paper page */
    '.review-offer{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;',
    'margin:32px 0 0;padding:16px 18px;border:1px solid var(--paper-line);border-left:3px solid var(--gold);',
    'border-radius:var(--radius);font-size:14.5px;line-height:1.5;color:var(--paper-ink)}',
    /* review overlay — paper card, matching the lesson page */
    '#reviewOverlay{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;',
    'background:rgba(10,15,10,0.6);padding:20px}',
    '.review-card{position:relative;width:min(640px,100%);max-height:86vh;overflow-y:auto;',
    'background:var(--paper);color:var(--paper-ink);border-radius:var(--radius);padding:28px 30px;',
    'box-shadow:0 18px 50px rgba(10,15,10,0.45)}',
    '.review-card h2{font-family:var(--font-head);font-weight:600;margin:0 0 8px}',
    '.review-card .quiz-options{margin-top:4px}',
    '.review-head{font-family:var(--font-mono);font-size:12px;color:var(--paper-ink-dim);margin-bottom:12px}',
    '.review-sub{color:var(--paper-ink-dim);margin:0 0 18px}',
    '.review-actions{display:flex;gap:10px;margin-top:18px}',
    '.review-actions .btn-ghost{color:var(--paper-ink-dim);border-color:var(--paper-line)}',
    '.review-actions .btn-ghost:hover{color:var(--paper-ink);border-color:var(--gold-dim)}',
    '.review-close{position:absolute;top:14px;right:18px;background:none;border:0;',
    'color:var(--paper-ink-dim);font-size:24px;line-height:1;padding:4px}',
    '.review-close:hover{color:var(--red)}',
    '@media (max-width:860px){.pl-tools{padding:0 16px 14px}}'
  ].join('');
  const style = document.createElement('style');
  style.id = 'pyledgerV2Styles';
  style.textContent = css;
  document.head.appendChild(style);
}

function injectSidebarTools() {
  const list = $id('moduleList');
  if (!list || !list.parentNode || $id('lessonSearch')) return;

  const tools = document.createElement('div');
  tools.className = 'pl-tools';
  tools.innerHTML =
    '<input type="search" id="lessonSearch" class="pl-search" placeholder="Search lessons" autocomplete="off">' +
    '<button class="pl-mini" id="practiceMistakesBtn" style="display:none"></button>' +
    '<div class="pl-tool-row">' +
      '<button class="pl-mini" id="exportProgressBtn">Export progress</button>' +
      '<button class="pl-mini" id="importProgressBtn">Import progress</button>' +
    '</div>' +
    '<input type="file" id="importFileInput" accept="application/json,.json" style="display:none">';
  list.parentNode.insertBefore(tools, list);

  // POINT 12: search
  $id('lessonSearch').addEventListener('input', debounce(e => {
    sidebarFilter = e.target.value || '';
    buildSidebar();
  }, 180));

  $id('exportProgressBtn').addEventListener('click', exportProgress);
  $id('importProgressBtn').addEventListener('click', () => $id('importFileInput').click());
  $id('importFileInput').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (file) importProgress(file);
    e.target.value = '';
  });
  $id('practiceMistakesBtn').addEventListener('click', () => {
    openReview(mistakeLessons(), 'Your missed questions');
  });
}

function injectReviewOverlay() {
  if ($id('reviewOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'reviewOverlay';
  overlay.innerHTML = '<div class="review-card" style="position:relative">' +
    '<button class="review-close" id="reviewCloseBtn" aria-label="Close review">×</button>' +
    '<div id="reviewBody"></div></div>';
  document.body.appendChild(overlay);
  $id('reviewCloseBtn').addEventListener('click', closeReview);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeReview(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeReview(); closeMobileSidebar(); }
  });
}

/* ---------------- init ---------------- */

function init() {
  if (typeof COURSE === 'undefined' || !COURSE.length) {
    const root = $id('lessonRoot');
    if (root) root.innerHTML = '<h1>No lessons loaded</h1><p>The course file did not load. Check that course.js is included before app.js.</p>';
    return;
  }

  flattenCourse();
  if (!flatLessons.length) return;
  migrateProgress();
  injectStyles();
  injectSidebarTools();
  injectReviewOverlay();

  if (openModules.size === 0) openModules.add(0);

  /* POINT 1: resume at the first lesson that is not finished,
     whether or not it has been opened before. */
  const firstUnfinished = flatLessons.find(f => !isLessonDone(f.lesson.id));
  currentLessonId = firstUnfinished ? firstUnfinished.lesson.id : flatLessons[0].lesson.id;
  const startEntry = flatLessons.find(f => f.lesson.id === currentLessonId);
  if (startEntry) openModules.add(startEntry.moduleIndex);
  saveOpenModules(openModules);

  buildSidebar();
  renderProgressSummary();
  renderLesson();
  updateSidebarStates();

  const menuBtn = $id('menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileSidebar);
  const scrim = $id('sidebarScrim');
  if (scrim) scrim.addEventListener('click', closeMobileSidebar);

  const resetBtn = $id('resetProgressBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm('Reset all progress? This clears every completed lesson and every saved answer on this device. Export first if you want a backup.')) {
      progress = {};
      savedCode = {};
      saveProgress(progress);
      saveSavedCode(savedCode);
      buildSidebar();
      renderProgressSummary();
      renderLesson();
    }
  });

  // POINT 6: warm up Python in the background so the first Run is quick
  setTimeout(() => PyEngine.preload(), 1200);
}

document.addEventListener('DOMContentLoaded', init);
