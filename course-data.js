/* ============================================================
   PyLedger course content
   Each module has: id, title, shortTitle, lessons[]
   Each lesson has: id, title, body (HTML), example (python, optional),
   exercise (optional: prompt, starterCode, testCode, successMessage),
   quiz (optional: question, options[], correctIndex, explanation)
   ============================================================ */

const COURSE = [

// ---------------------------------------------------------------
{
  id: 'getting-started',
  title: 'Module 1 — Getting Started',
  shortTitle: 'Getting Started',
  lessons: [
    {
      id: 'gs-1',
      title: 'Hello, Python',
      body: `<p>Python code runs top to bottom, one line at a time. The most basic instruction is <code>print()</code>, which displays a value on the screen. Text needs to be wrapped in quotes; numbers don't.</p>
<p>This app runs a real Python interpreter directly in your browser — nothing is simulated. The first time you click <strong>Run</strong>, it may take a few seconds to load the engine; after that it's instant.</p>
<p>Try changing the example below and running it. You can't break anything — just experiment.</p>`,
      example: `print("Hello, world!")
print(2 + 2)
print("Python" + " " + "is fun")`,
      exercise: {
        prompt: `Use <code>print()</code> to display exactly this line: <code>I'm learning Python</code>`,
        starterCode: `# Write your print statement below\n`,
        testCode: `assert "I'm learning Python" in __pyledger_stdout__, "Print the exact phrase: I'm learning Python"`,
        successMessage: `Your first line of Python, printed and checked.`
      }
    },
    {
      id: 'gs-2',
      title: 'Comments & reading errors',
      body: `<p>A comment starts with <code>#</code> and is ignored when the code runs — use it to leave notes for yourself.</p>
<p>Errors are normal and useful. When Python can't run a line, it stops and shows a <strong>traceback</strong> ending in the real problem, like <code>SyntaxError</code> or <code>NameError</code>. Read the last line first — it usually tells you exactly what went wrong.</p>
<p>Run the broken example below to see what an error looks like, then read the message carefully.</p>`,
      example: `# This line has a mistake — run it to see the error
print("missing a closing quote)`,
      quiz: {
        question: `You run <code>prin("hello")</code> and Python stops with an error. What's the most likely cause?`,
        options: [
          `prin is misspelled — it should be print`,
          `The string is too short`,
          `Python doesn't support the word hello`,
          `The line needs a semicolon at the end`
        ],
        correctIndex: 0,
        explanation: `Python raises a NameError because prin isn't a defined function — a simple typo for print.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'variables',
  title: 'Module 2 — Variables & Types',
  shortTitle: 'Variables & Types',
  lessons: [
    {
      id: 'var-1',
      title: 'Variables & assignment',
      body: `<p>A variable is a name that points to a value. You create one with <code>=</code> — assignment, not mathematical equality. Once assigned, use the name anywhere in place of the value.</p>
<p>Python figures out the type automatically; you never declare it up front. Names are conventionally lowercase with underscores between words — this style is called <code>snake_case</code>.</p>`,
      example: `age = 23
city = "Mumbai"
print(age)
print(city)
age = age + 1
print(age)`,
      exercise: {
        prompt: `Create a variable called <code>salary</code> set to <code>75000</code>, then <code>bonus</code> set to <code>5000</code>. Print their total.`,
        starterCode: `salary = 0
bonus = 0

print(salary + bonus)`,
        testCode: `assert salary == 75000, "salary should be 75000"
assert bonus == 5000, "bonus should be 5000"
assert "80000" in __pyledger_stdout__, "Print the total of salary and bonus"`,
        successMessage: `Two variables, one clean total.`
      }
    },
    {
      id: 'var-2',
      title: 'Numbers, strings, booleans & type()',
      body: `<p>Python has a few core built-in types you'll use constantly: <code>int</code> (whole numbers), <code>float</code> (decimals), <code>str</code> (text), and <code>bool</code> (<code>True</code>/<code>False</code>). Use <code>type()</code> to check what something is.</p>
<p>Mixing types can cause errors — <code>"5" + 3</code> fails because one side is text and the other a number. Convert explicitly with <code>int()</code>, <code>float()</code>, or <code>str()</code> when you need to.</p>`,
      example: `print(type(23))
print(type(23.5))
print(type("hello"))
print(type(True))
print(int("10") + 5)
print(str(10) + " items")`,
      exercise: {
        prompt: `Combine the number <code>price</code> with the text <code>" rupees"</code> using <code>str()</code>, storing the result in <code>label</code>. Print <code>label</code>.`,
        starterCode: `price = 499
label = ""  # build this from price and " rupees" using str()
print(label)`,
        testCode: `assert label == "499 rupees", 'label should read exactly "499 rupees"'`,
        successMessage: `Type conversion handled cleanly.`
      },
      quiz: {
        question: `What does <code>type("23")</code> return?`,
        options: [`&lt;class 'str'&gt; — it's text, even though it looks like a number`, `&lt;class 'int'&gt;`, `23`, `An error, because "23" looks numeric`],
        correctIndex: 0,
        explanation: `Anything inside quotes is a string, regardless of what it looks like.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'operators',
  title: 'Module 3 — Operators',
  shortTitle: 'Operators',
  lessons: [
    {
      id: 'op-1',
      title: 'Arithmetic, comparison & precedence',
      body: `<p>Arithmetic operators: <code>+ - * /</code> for regular math, <code>//</code> for floor (integer) division, <code>%</code> for remainder, and <code>**</code> for exponents. Comparisons (<code>== != &lt; &gt; &lt;= &gt;=</code>) return a boolean. <code>and</code>, <code>or</code>, and <code>not</code> combine booleans.</p>
<p>Python follows standard order of operations — multiplication before addition, parentheses override everything. When in doubt, add parentheses for clarity, not just correctness.</p>`,
      example: `print(17 // 5)
print(17 % 5)
print(2 ** 10)
print(5 > 3 and 2 < 1)
print(not False)`,
      exercise: {
        prompt: `A cinema splits 100 tickets into rows of 8. Compute <code>full_rows</code> and <code>leftover</code> tickets using <code>//</code> and <code>%</code>.`,
        starterCode: `total_tickets = 100
row_size = 8
full_rows = 0
leftover = 0`,
        testCode: `assert full_rows == 12, "full_rows should be 12"
assert leftover == 4, "leftover should be 4"`,
        successMessage: `Floor division and modulo, nailed.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'strings',
  title: 'Module 4 — Strings',
  shortTitle: 'Strings',
  lessons: [
    {
      id: 'str-1',
      title: 'Indexing & slicing',
      body: `<p>Strings are sequences of characters, and every character has a position starting at <code>0</code>. Use square brackets to grab one character (<code>name[0]</code>) or a range with slicing (<code>name[0:3]</code>). Negative indexes count from the end — <code>name[-1]</code> is the last character.</p>
<p>Slicing never raises an error for out-of-range ends, which makes it forgiving to work with.</p>`,
      example: `name = "Bhayandar"
print(name[0])
print(name[-1])
print(name[0:4])
print(name[:3])
print(name[3:])
print(len(name))`,
      exercise: {
        prompt: `Given <code>ticker = "NIFTY50"</code>, store the first 5 characters in <code>base</code> and the last 2 characters in <code>suffix</code>.`,
        starterCode: `ticker = "NIFTY50"
base = ""
suffix = ""`,
        testCode: `assert base == "NIFTY", "base should be NIFTY"
assert suffix == "50", "suffix should be 50"`,
        successMessage: `Slicing under control.`
      }
    },
    {
      id: 'str-2',
      title: 'String methods & f-strings',
      body: `<p>Strings come with built-in methods: <code>.upper()</code>, <code>.lower()</code>, <code>.strip()</code> (removes surrounding whitespace), <code>.replace(old, new)</code>, and <code>.split()</code> (breaks a string into a list). None of these change the original — strings are immutable, so methods always return a new string.</p>
<p>For building strings from variables, f-strings are the cleanest way: put <code>f</code> before the quotes and drop variables inside <code>{ }</code>.</p>`,
      example: `name = "kunal"
print(name.upper())
score = 87
print(f"{name.title()} scored {score}%")
sentence = "  finance, compliance, python  "
print(sentence.strip().split(", "))`,
      exercise: {
        prompt: `Using an f-string, and given <code>role = "analyst"</code> and <code>years = 2</code>, build <code>summary</code> reading exactly <code>2 years as an analyst</code>.`,
        starterCode: `role = "analyst"
years = 2
summary = ""`,
        testCode: `assert summary == "2 years as an analyst", "summary should read exactly: 2 years as an analyst"`,
        successMessage: `f-strings, mastered.`
      },
      quiz: {
        question: `Which statement about strings is true?`,
        options: [
          `Strings are immutable — methods like .upper() return a new string`,
          `Calling .upper() changes the original string in place`,
          `f-strings can only contain numbers`,
          `.split() joins a list back into a string`
        ],
        correctIndex: 0,
        explanation: `Every string method returns a brand-new string; the original never changes.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'control-flow',
  title: 'Module 5 — Control Flow',
  shortTitle: 'Control Flow',
  lessons: [
    {
      id: 'cf-1',
      title: 'if / elif / else',
      body: `<p>An <code>if</code> statement runs a block only when its condition is <code>True</code>. Add <code>elif</code> for additional conditions, and <code>else</code> as a catch-all. Python uses indentation — 4 spaces, consistently — instead of curly braces to mark what belongs inside a block. This isn't a style choice; it's the syntax.</p>`,
      example: `score = 72
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"
print(grade)`,
      exercise: {
        prompt: `Given <code>balance</code>, set <code>status</code> to <code>"overdrawn"</code> if negative, <code>"empty"</code> if exactly zero, or <code>"active"</code> otherwise.`,
        starterCode: `balance = -150
status = ""`,
        testCode: `assert status == "overdrawn", "A balance of -150 should be overdrawn"`,
        successMessage: `Branching logic, correctly wired.`
      }
    },
    {
      id: 'cf-2',
      title: 'Truthiness & boolean logic',
      body: `<p>Every value in Python is truthy or falsy in a boolean context. <code>0</code>, <code>0.0</code>, <code>""</code> (empty string), <code>[]</code> (empty list), and <code>None</code> are all falsy; nearly everything else is truthy. This lets you write <code>if my_list:</code> instead of <code>if len(my_list) > 0:</code>.</p>
<p><code>and</code> / <code>or</code> short-circuit: <code>a or b</code> stops and returns <code>a</code> if it's already truthy, without even evaluating <code>b</code>.</p>`,
      example: `items = []
if items:
    print("has items")
else:
    print("empty")

name = ""
display_name = name or "Guest"
print(display_name)`,
      quiz: {
        question: `What does <code>display_name = name or "Guest"</code> do when <code>name</code> is an empty string?`,
        options: [
          `Sets display_name to "Guest", because an empty string is falsy`,
          `Raises an error`,
          `Sets display_name to an empty string`,
          `Sets display_name to True`
        ],
        correctIndex: 0,
        explanation: `Empty strings are falsy, so "or" moves on and evaluates to "Guest".`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'loops',
  title: 'Module 6 — Loops',
  shortTitle: 'Loops',
  lessons: [
    {
      id: 'loop-1',
      title: 'for loops & range',
      body: `<p>A <code>for</code> loop runs a block once per item in a sequence. <code>range(n)</code> generates numbers <code>0</code> up to (not including) <code>n</code>; <code>range(start, stop, step)</code> gives full control. Looping directly over a list or string is usually cleaner than looping over indexes.</p>`,
      example: `for i in range(5):
    print(i)

for letter in "abc":
    print(letter.upper())

total = 0
for n in [10, 20, 30]:
    total += n
print(total)`,
      exercise: {
        prompt: `Use a for loop over <code>range(1, 11)</code> to add the numbers 1 through 10 into a variable called <code>total</code>.`,
        starterCode: `total = 0
for n in range(1, 11):
    pass
print(total)`,
        testCode: `assert total == 55, "total should be 55"`,
        successMessage: `Accumulator pattern, done right.`
      }
    },
    {
      id: 'loop-2',
      title: 'while, break & continue',
      body: `<p>A <code>while</code> loop keeps running as long as its condition stays <code>True</code> — you're responsible for making sure it eventually becomes false, or the loop never ends. <code>break</code> exits a loop immediately; <code>continue</code> skips to the next iteration without finishing the current one.</p>`,
      example: `count = 0
while count < 3:
    print("counting", count)
    count += 1

for n in range(10):
    if n == 3:
        continue
    if n == 6:
        break
    print(n)`,
      exercise: {
        prompt: `Write a while loop that doubles <code>value</code>, starting from <code>1</code>, until it exceeds <code>100</code>. Store the final value in <code>value</code>.`,
        starterCode: `value = 1`,
        testCode: `assert value == 128, "value should end at 128 (1,2,4,...,128)"`,
        successMessage: `Loop condition managed correctly — it terminated cleanly.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'data-structures',
  title: 'Module 7 — Data Structures',
  shortTitle: 'Data Structures',
  lessons: [
    {
      id: 'ds-1',
      title: 'Lists',
      body: `<p>A list is an ordered, changeable collection written with square brackets. Add with <code>.append()</code>, remove with <code>.remove(value)</code> or <code>.pop(index)</code>, and check membership with <code>in</code>. Lists can mix types, though in practice most lists hold one kind of thing.</p>`,
      example: `cards = ["HDFC", "SBI", "ICICI"]
cards.append("Axis")
cards.remove("SBI")
print(cards)
print("Axis" in cards)
print(len(cards))
print(cards[1])`,
      exercise: {
        prompt: `Start with <code>expenses = [1200, 450, 3000]</code>. Append <code>800</code>, then remove <code>450</code>. Store the sum in <code>total</code>.`,
        starterCode: `expenses = [1200, 450, 3000]
total = 0`,
        testCode: `assert expenses == [1200, 3000, 800], "expenses should be [1200, 3000, 800] after the append/remove"
assert total == 5000, "total should be 5000"`,
        successMessage: `List mutated and summed correctly.`
      }
    },
    {
      id: 'ds-2',
      title: 'Dictionaries & tuples',
      body: `<p>A dictionary stores key-value pairs — look up a value instantly by its key instead of a position. Use <code>.get(key, default)</code> to avoid errors on missing keys. A tuple is like a list but immutable, useful for fixed groupings like coordinates.</p>`,
      example: `profile = {"name": "Kunal", "role": "FLS", "grade": 5}
print(profile["role"])
print(profile.get("bonus", "not set"))
profile["grade"] = 6
print(profile)

point = (19.07, 72.87)
lat, lon = point
print(lat, lon)`,
      exercise: {
        prompt: `Given <code>prices = {"HDFC": 1650, "SBI": 810}</code>, add a key <code>"ICICI"</code> with value <code>1190</code>, then look up <code>"SBI"</code>'s price into <code>sbi_price</code>.`,
        starterCode: `prices = {"HDFC": 1650, "SBI": 810}
sbi_price = 0`,
        testCode: `assert prices.get("ICICI") == 1190, "ICICI should be added with value 1190"
assert sbi_price == 810, "sbi_price should be 810"`,
        successMessage: `Dictionary read and write, both correct.`
      },
      quiz: {
        question: `What's the key difference between a list and a tuple?`,
        options: [
          `Tuples are immutable; lists can be changed after creation`,
          `Lists can only hold numbers`,
          `Tuples must contain exactly two items`,
          `There's no real difference`
        ],
        correctIndex: 0,
        explanation: `Once created, a tuple's contents can't change — that immutability is the whole point.`
      }
    },
    {
      id: 'ds-3',
      title: 'Sets & comprehensions',
      body: `<p>A set is an unordered collection of unique values — duplicates are dropped automatically, and it's fast for membership checks. A list comprehension builds a new list in one line: <code>[expression for item in iterable if condition]</code> — the same as a for loop with an append, written more compactly.</p>`,
      example: `codes = {"BSE", "NSE", "BSE", "MCX"}
print(codes)

numbers = [1, 2, 3, 4, 5, 6]
evens = [n for n in numbers if n % 2 == 0]
squares = [n ** 2 for n in numbers]
print(evens)
print(squares)`,
      exercise: {
        prompt: `Given <code>numbers = [4, 15, 22, 8, 30, 5]</code>, use a list comprehension to build <code>big_numbers</code>, containing only values greater than 10.`,
        starterCode: `numbers = [4, 15, 22, 8, 30, 5]
big_numbers = []`,
        testCode: `assert big_numbers == [15, 22, 30], "big_numbers should be [15, 22, 30]"`,
        successMessage: `Comprehension written cleanly, in one line.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'functions',
  title: 'Module 8 — Functions',
  shortTitle: 'Functions',
  lessons: [
    {
      id: 'fn-1',
      title: 'Defining functions',
      body: `<p>A function packages up reusable logic. Define one with <code>def name(parameters):</code>, and send a value back to the caller with <code>return</code> — without it, the function returns <code>None</code>. Parameters are local variable names that receive whatever's passed in when the function is called.</p>`,
      example: `def convert_to_usd(inr_amount, rate=83.0):
    return round(inr_amount / rate, 2)

print(convert_to_usd(10000))
print(convert_to_usd(10000, rate=85.5))`,
      exercise: {
        prompt: `Write a function <code>compound(principal, rate, years)</code> that returns <code>principal * (1 + rate) ** years</code>. Call it with <code>10000, 0.08, 3</code> and store the result in <code>result</code>.`,
        starterCode: `def compound(principal, rate, years):
    pass

result = 0`,
        testCode: `assert round(result, 2) == round(10000 * 1.08 ** 3, 2), "result should equal principal * (1+rate)**years"`,
        successMessage: `Function defined, called, and returning the right value.`
      }
    },
    {
      id: 'fn-2',
      title: 'Default args, *args, **kwargs & scope',
      body: `<p>Parameters can have default values, used when the caller doesn't supply that argument. <code>*args</code> collects extra positional arguments into a tuple; <code>**kwargs</code> collects extra keyword arguments into a dictionary — useful when you don't know in advance how many values will come in.</p>
<p>A variable created inside a function only exists inside that function (local scope) unless declared <code>global</code>. This is usually a feature: it stops functions from silently interfering with each other.</p>`,
      example: `def total_spend(*amounts, **tags):
    print("amounts:", amounts)
    print("tags:", tags)
    return sum(amounts)

print(total_spend(100, 250, 75, category="food"))`,
      exercise: {
        prompt: `Write <code>describe(name, **details)</code> returning a string like <code>"Kunal: role=FLS, city=Mumbai"</code>, built from the keyword arguments joined with commas. Call it with <code>describe("Kunal", role="FLS", city="Mumbai")</code> and store the result in <code>result</code>.`,
        starterCode: `def describe(name, **details):
    pass

result = ""`,
        testCode: `assert result == "Kunal: role=FLS, city=Mumbai", "Check the exact formatting: Name: key=value, key=value"`,
        successMessage: `**kwargs handled and formatted correctly.`
      },
      quiz: {
        question: `Inside a function, you assign x = 5. What happens to a variable named x that already exists outside the function?`,
        options: [
          `Nothing — the function's x is local and separate unless declared global`,
          `The outer x is immediately overwritten`,
          `Python raises an error for the name clash`,
          `Both variables merge into one`
        ],
        correctIndex: 0,
        explanation: `Function-local variables are isolated by default — this is called scope.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'modules',
  title: 'Module 9 — Modules & Standard Library',
  shortTitle: 'Modules & Library',
  lessons: [
    {
      id: 'mod-1',
      title: 'import & the standard library',
      body: `<p>Python ships with a large standard library you access via <code>import</code>. Common ones: <code>math</code> for numeric functions, <code>random</code> for randomness, <code>datetime</code> for dates and times. Outside the standard library, third-party packages are installed with <code>pip install package_name</code> in a real environment — this browser playground has a handful preloaded, but not full pip access.</p>`,
      example: `import math
import random

print(math.sqrt(144))
print(math.pi)
print(random.randint(1, 6))

from datetime import date
print(date.today())`,
      exercise: {
        prompt: `Import <code>math</code> and store the ceiling of <code>47 / 5</code> in a variable called <code>rows_needed</code>.`,
        starterCode: `import math
rows_needed = 0`,
        testCode: `assert rows_needed == 10, "rows_needed should be 10 (ceiling of 9.4)"`,
        successMessage: `Standard library, put to work.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'files-exceptions',
  title: 'Module 10 — Files & Exceptions',
  shortTitle: 'Files & Exceptions',
  lessons: [
    {
      id: 'fx-1',
      title: 'Reading & writing files',
      body: `<p>Use <code>open(path, mode)</code> to work with files — <code>"r"</code> to read, <code>"w"</code> to write (overwriting), <code>"a"</code> to append. Always use a <code>with</code> block: it closes the file automatically, even if an error happens partway through.</p>
<p>This browser playground has an in-memory filesystem, so writes here don't touch your real computer — the pattern is identical to a real script, though.</p>`,
      example: `with open("notes.txt", "w") as f:
    f.write("Line one\\n")
    f.write("Line two\\n")

with open("notes.txt", "r") as f:
    content = f.read()
print(content)`,
      exercise: {
        prompt: `Write the text <code>"budget: 50000"</code> to a file called <code>ledger.txt</code>, then read it back into a variable called <code>readback</code>.`,
        starterCode: `readback = ""`,
        testCode: `assert readback == "budget: 50000", "readback should exactly match what you wrote"`,
        successMessage: `File written and read back correctly.`
      }
    },
    {
      id: 'fx-2',
      title: 'try / except & raising exceptions',
      body: `<p>Wrap risky code in <code>try:</code>, and handle specific failure types in <code>except ErrorType:</code> — catching the exact error you expect is better than a bare <code>except:</code>, which can hide real bugs. <code>finally:</code> always runs, whether or not an error happened. You can raise your own errors with <code>raise ValueError("message")</code> when input doesn't make sense.</p>`,
      example: `def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

print(safe_divide(10, 2))
print(safe_divide(10, 0))

def set_age(age):
    if age < 0:
        raise ValueError("age can't be negative")
    return age

try:
    set_age(-5)
except ValueError as e:
    print("caught:", e)`,
      exercise: {
        prompt: `Write <code>parse_amount(text)</code> that returns <code>int(text)</code>, but returns <code>-1</code> if <code>text</code> can't be converted (catch <code>ValueError</code>). Call it with <code>"abc"</code> and store the result in <code>result</code>.`,
        starterCode: `def parse_amount(text):
    pass

result = parse_amount("abc")`,
        testCode: `assert result == -1, "Non-numeric input should return -1"`,
        successMessage: `Exception handled gracefully, no crash.`
      },
      quiz: {
        question: `Why is <code>except ValueError:</code> usually better than a bare <code>except:</code>?`,
        options: [
          `A bare except also catches errors you didn't anticipate, hiding real bugs`,
          `except ValueError runs faster`,
          `Bare except is not valid Python syntax`,
          `There's no difference`
        ],
        correctIndex: 0,
        explanation: `Catching only what you expect lets genuinely unexpected errors surface instead of being silently swallowed.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'oop',
  title: 'Module 11 — Object-Oriented Programming',
  shortTitle: 'OOP',
  lessons: [
    {
      id: 'oop-1',
      title: 'Classes & objects',
      body: `<p>A class is a blueprint for creating objects that bundle data (attributes) and behavior (methods) together. <code>__init__</code> runs automatically when you create an object, setting up its starting attributes. <code>self</code> refers to the specific object a method was called on.</p>`,
      example: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

acc = Account("Kunal", 1000)
acc.deposit(500)
print(acc.owner, acc.balance)`,
      exercise: {
        prompt: `Add a <code>withdraw(self, amount)</code> method to <code>Account</code> that subtracts <code>amount</code> from <code>self.balance</code>. Create an account with balance <code>2000</code>, withdraw <code>750</code>, and store the final balance in <code>final_balance</code>.`,
        starterCode: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def withdraw(self, amount):
        pass

acc = Account("Kunal", 2000)
acc.withdraw(750)
final_balance = acc.balance`,
        testCode: `assert final_balance == 1250, "final_balance should be 1250"`,
        successMessage: `Your first working class.`
      }
    },
    {
      id: 'oop-2',
      title: 'Inheritance & polymorphism',
      body: `<p>A class can inherit from another, reusing its attributes and methods while adding or overriding its own — modelling an "is-a" relationship. Call <code>super().__init__(...)</code> to run the parent's setup before adding anything new. Polymorphism just means different classes can respond to the same method name in their own way.</p>`,
      example: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
    def describe(self):
        return f"{self.owner}: {self.balance}"

class SavingsAccount(Account):
    def __init__(self, owner, balance, rate):
        super().__init__(owner, balance)
        self.rate = rate
    def describe(self):
        return f"{self.owner}: {self.balance} @ {self.rate}% interest"

acc = SavingsAccount("Kunal", 5000, 4.5)
print(acc.describe())`,
      exercise: {
        prompt: `Create <code>CurrentAccount</code>, inheriting from <code>Account</code>, adding an <code>overdraft_limit</code> attribute set via <code>__init__</code>. Create one with owner <code>"Kunal"</code>, balance <code>1000</code>, overdraft_limit <code>500</code>, and store its <code>overdraft_limit</code> in <code>limit</code>.`,
        starterCode: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

class CurrentAccount(Account):
    def __init__(self, owner, balance, overdraft_limit):
        pass

acc = CurrentAccount("Kunal", 1000, 500)
limit = 0`,
        testCode: `assert limit == 500, "limit should be 500 — read from the created object"`,
        successMessage: `Inheritance wired up with super().`
      },
      quiz: {
        question: `What does calling <code>super().__init__(...)</code> inside a subclass's __init__ do?`,
        options: [
          `Runs the parent class's setup logic before the subclass adds its own`,
          `Deletes the parent class`,
          `Is only needed if the subclass has no attributes`,
          `Automatically makes all attributes private`
        ],
        correctIndex: 0,
        explanation: `super() gives you a handle to the parent class so you can reuse its __init__ instead of rewriting it.`
      }
    },
    {
      id: 'oop-3',
      title: 'Dunder methods & properties',
      body: `<p>Methods surrounded by double underscores ("dunder") let your objects work with Python's built-in syntax. <code>__str__</code> controls what <code>print(obj)</code> shows; <code>__eq__</code> controls <code>==</code>; <code>__len__</code> controls <code>len(obj)</code>. A <code>@property</code> lets a method be accessed like an attribute — useful for values computed from other attributes.</p>`,
      example: `class Portfolio:
    def __init__(self, holdings):
        self.holdings = holdings

    def __len__(self):
        return len(self.holdings)

    def __str__(self):
        return f"Portfolio with {len(self)} holdings"

    @property
    def total_value(self):
        return sum(self.holdings.values())

p = Portfolio({"HDFC": 16500, "SBI": 8100})
print(p)
print(len(p))
print(p.total_value)`,
      exercise: {
        prompt: `Add a <code>@property</code> called <code>average_value</code> to <code>Portfolio</code>, returning <code>total_value / len(self)</code>. Create a portfolio with <code>{"A": 100, "B": 300}</code> and store its <code>average_value</code> in <code>avg</code>.`,
        starterCode: `class Portfolio:
    def __init__(self, holdings):
        self.holdings = holdings

    def __len__(self):
        return len(self.holdings)

    @property
    def total_value(self):
        return sum(self.holdings.values())

    # add average_value here

p = Portfolio({"A": 100, "B": 300})
avg = 0`,
        testCode: `assert avg == 200, "avg should be 200"`,
        successMessage: `A computed property, done the Pythonic way.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'iterators',
  title: 'Module 12 — Iterators & Generators',
  shortTitle: 'Iterators & Generators',
  lessons: [
    {
      id: 'iter-1',
      title: 'Iterables & iterators',
      body: `<p>Anything you can loop over with <code>for</code> is an iterable — lists, strings, dicts, files. Under the hood, <code>for</code> calls <code>iter()</code> to get an iterator, then repeatedly calls <code>next()</code> until it runs out and raises <code>StopIteration</code>, which the loop catches silently. You rarely call these directly, but understanding them explains why generators (next lesson) work.</p>`,
      example: `numbers = [10, 20, 30]
it = iter(numbers)
print(next(it))
print(next(it))
print(next(it))`,
      exercise: {
        prompt: `Using <code>iter()</code> and <code>next()</code> manually (no for loop), pull the first two characters of <code>word = "python"</code> into <code>first</code> and <code>second</code>.`,
        starterCode: `word = "python"
first = ""
second = ""`,
        testCode: `assert first == "p" and second == "y", "first should be p, second should be y"`,
        successMessage: `Manual iteration, understood.`
      }
    },
    {
      id: 'iter-2',
      title: 'Generators & yield',
      body: `<p>A generator function looks like a normal function but uses <code>yield</code> instead of <code>return</code>. Each call to <code>next()</code> resumes right where it left off, rather than starting over — this makes generators memory-efficient for large or infinite sequences, since values are produced one at a time instead of all at once.</p>`,
      example: `def countdown(n):
    while n > 0:
        yield n
        n -= 1

for number in countdown(3):
    print(number)

squares = (n ** 2 for n in range(5))
print(list(squares))`,
      exercise: {
        prompt: `Write a generator <code>even_numbers(limit)</code> that yields even numbers from 0 up to (not including) <code>limit</code>. Store <code>list(even_numbers(10))</code> in <code>result</code>.`,
        starterCode: `def even_numbers(limit):
    pass

result = []`,
        testCode: `assert result == [0, 2, 4, 6, 8], "result should be [0, 2, 4, 6, 8]"`,
        successMessage: `Your first generator, yielding correctly.`
      },
      quiz: {
        question: `What's the main practical benefit of a generator over building a full list upfront?`,
        options: [
          `It produces values one at a time, saving memory for large sequences`,
          `It runs faster for every possible task`,
          `It can hold more data types than a list`,
          `Generators are required for all loops`
        ],
        correctIndex: 0,
        explanation: `Generators compute lazily — nothing is stored until you ask for the next value.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'decorators',
  title: 'Module 13 — Decorators & Context Managers',
  shortTitle: 'Decorators & Context',
  lessons: [
    {
      id: 'dec-1',
      title: 'Functions as objects & decorators',
      body: `<p>In Python, functions are values — you can assign them to variables, pass them as arguments, and return them from other functions. A decorator is a function that takes a function and returns a wrapped version of it, adding behavior without changing the original code. <code>@decorator_name</code> above a function is shorthand for <code>func = decorator_name(func)</code>.</p>`,
      example: `def log_calls(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@log_calls
def add(a, b):
    return a + b

add(3, 4)`,
      exercise: {
        prompt: `Write a decorator <code>double_result</code> that doubles whatever the wrapped function returns. Apply it to <code>get_five()</code>, which returns <code>5</code>, then call it and store the result in <code>result</code>.`,
        starterCode: `def double_result(func):
    pass

@double_result
def get_five():
    return 5

result = get_five()`,
        testCode: `assert result == 10, "result should be 10 (5 doubled)"`,
        successMessage: `Decorator built from scratch.`
      }
    },
    {
      id: 'dec-2',
      title: 'Context managers & with',
      body: `<p>You've already used <code>with open(...) as f:</code> — that's a context manager, guaranteeing setup and cleanup happen even if an error occurs in between. Build your own with a class defining <code>__enter__</code>/<code>__exit__</code>, or more simply with <code>@contextmanager</code> from the <code>contextlib</code> module.</p>`,
      example: `from contextlib import contextmanager

@contextmanager
def timer_block(label):
    print(f"starting {label}")
    yield
    print(f"finished {label}")

with timer_block("calculation"):
    total = sum(range(1000))
    print(total)`,
      exercise: {
        prompt: `Using <code>@contextmanager</code>, write <code>silence_errors()</code> that catches any exception inside its <code>with</code> block and sets a global <code>outcome</code> to <code>"caught"</code> instead of crashing. Test it by dividing by zero inside the block.`,
        starterCode: `from contextlib import contextmanager

outcome = ""

@contextmanager
def silence_errors():
    global outcome
    try:
        yield
    except Exception:
        pass

with silence_errors():
    1 / 0`,
        testCode: `assert outcome == "caught", "outcome should be set to caught inside the except block"`,
        successMessage: `A working custom context manager.`
      },
      quiz: {
        question: `What must a with-block context manager guarantee?`,
        options: [
          `Its cleanup code runs even if an error happens inside the block`,
          `The code inside it runs twice`,
          `It can only be used with files`,
          `It disables all exceptions permanently`
        ],
        correctIndex: 0,
        explanation: `That guaranteed cleanup — closing a file, releasing a lock — is the entire reason context managers exist.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'functional',
  title: 'Module 14 — Functional Tools',
  shortTitle: 'Functional Tools',
  lessons: [
    {
      id: 'func-1',
      title: 'map, filter, lambda & functools',
      body: `<p><code>lambda</code> creates a small, unnamed function inline — useful for a quick one-off. <code>map(func, iterable)</code> applies a function to every item; <code>filter(func, iterable)</code> keeps only items where the function returns <code>True</code>. Both return lazy iterators, so wrap them in <code>list()</code> to see results. <code>functools.reduce</code> collapses a sequence into a single value by repeatedly combining pairs.</p>`,
      example: `from functools import reduce

nums = [1, 2, 3, 4, 5]
doubled = list(map(lambda n: n * 2, nums))
evens = list(filter(lambda n: n % 2 == 0, nums))
product = reduce(lambda a, b: a * b, nums)

print(doubled)
print(evens)
print(product)`,
      exercise: {
        prompt: `Given <code>prices = [199, 450, 89, 999, 25]</code>, use <code>filter</code> and <code>lambda</code> to build <code>affordable</code>, containing only prices under 200.`,
        starterCode: `prices = [199, 450, 89, 999, 25]
affordable = []`,
        testCode: `assert affordable == [199, 89, 25], "affordable should be [199, 89, 25]"`,
        successMessage: `filter + lambda, applied correctly.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'testing',
  title: 'Module 15 — Testing & Debugging',
  shortTitle: 'Testing & Debugging',
  lessons: [
    {
      id: 'test-1',
      title: 'assert, unittest & reading tracebacks',
      body: `<p><code>assert condition, "message"</code> is the simplest test — it raises <code>AssertionError</code> if the condition is false, exactly how this app checks your exercises behind the scenes. For real projects, Python's built-in <code>unittest</code> module organizes many checks into a suite you can rerun any time you change code.</p>
<p>When something breaks, read the traceback from the bottom up: the last line names the error type and message, and the lines above trace exactly which function calls led there.</p>`,
      example: `import unittest

def add(a, b):
    return a + b

class TestAdd(unittest.TestCase):
    def test_positive(self):
        self.assertEqual(add(2, 3), 5)

result = unittest.main(argv=[''], exit=False, verbosity=0)
print("Tests passed:", result.result.wasSuccessful())`,
      exercise: {
        prompt: `Write <code>is_valid_pan(pan)</code> returning <code>True</code> only if <code>len(pan) == 10</code>. Write an <code>assert</code> checking <code>is_valid_pan("ABCDE1234F")</code> is <code>True</code>, then set <code>checks_passed = True</code> once it runs without error.`,
        starterCode: `def is_valid_pan(pan):
    pass

assert is_valid_pan("ABCDE1234F") == True
checks_passed = True`,
        testCode: `assert checks_passed == True, "checks_passed should be True after your assert runs without error"`,
        successMessage: `Your own test, written and passing.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'async',
  title: 'Module 16 — Concurrency & Async',
  shortTitle: 'Concurrency & Async',
  lessons: [
    {
      id: 'async-1',
      title: 'Threading basics',
      body: `<p>Threading lets multiple pieces of code make progress concurrently — useful when a task spends time waiting (like a network request) rather than using the CPU. Python's <code>threading</code> module runs functions on separate threads with <code>Thread(target=func).start()</code>, and <code>.join()</code> waits for a thread to finish.</p>
<p>Because of Python's Global Interpreter Lock (GIL), threads don't give true parallel CPU computation — for that you'd reach for <code>multiprocessing</code> instead. Threads shine specifically for I/O-bound waiting.</p>`,
      example: `import threading
import time

def worker(name):
    time.sleep(0.1)
    print(f"{name} done")

t1 = threading.Thread(target=worker, args=("Task A",))
t2 = threading.Thread(target=worker, args=("Task B",))
t1.start()
t2.start()
t1.join()
t2.join()
print("all threads finished")`,
      exercise: {
        prompt: `Create two threads that each append their name to a shared list <code>results</code> (<code>"first"</code> and <code>"second"</code>), join both, and store whether <code>len(results) == 2</code> in <code>both_ran</code>.`,
        starterCode: `import threading

results = []

def add_result(name):
    pass  # append name to results here

t1 = threading.Thread(target=add_result, args=("first",))
t2 = threading.Thread(target=add_result, args=("second",))
t1.start()
t2.start()
t1.join()
t2.join()

both_ran = len(results) == 2`,
        testCode: `assert both_ran == True, "both_ran should be True once both threads have finished"`,
        successMessage: `Two threads, started and joined correctly.`
      }
    },
    {
      id: 'async-2',
      title: 'asyncio & async/await',
      body: `<p><code>async def</code> defines a coroutine — a function that can pause and resume. Inside one, <code>await</code> hands control back until whatever you're waiting on completes, letting other coroutines run meanwhile, all on a single thread. This is cooperative, not preemptive, and is the standard approach for high-volume I/O like network calls in modern Python.</p>
<p><code>asyncio.gather()</code> runs multiple coroutines concurrently and waits for all of them.</p>`,
      example: `import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} loaded"

async def main():
    results = await asyncio.gather(fetch("A", 0.1), fetch("B", 0.05))
    print(results)

await main()`,
      exercise: {
        prompt: `Write an async function <code>double_later(n)</code> that awaits <code>asyncio.sleep(0.01)</code> then returns <code>n * 2</code>. Use <code>asyncio.gather</code> to run it for <code>3</code> and <code>4</code> at once, storing the combined results in <code>outcomes</code>.`,
        starterCode: `import asyncio

async def double_later(n):
    pass

async def main():
    global outcomes
    outcomes = await asyncio.gather(double_later(3), double_later(4))

outcomes = []
await main()`,
        testCode: `assert outcomes == [6, 8], "outcomes should be [6, 8]"`,
        successMessage: `Concurrent coroutines, gathered correctly.`
      },
      quiz: {
        question: `How is asyncio's concurrency different from using threads?`,
        options: [
          `Coroutines cooperatively pause at await points on a single thread, rather than the OS switching between threads`,
          `asyncio is just another name for threading`,
          `asyncio always runs slower than threading`,
          `await blocks every other coroutine from running until it finishes`
        ],
        correctIndex: 0,
        explanation: `await is a deliberate handoff point — nothing else happens in between unless a coroutine chooses to pause there.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'advanced',
  title: 'Module 17 — Advanced & Best Practices',
  shortTitle: 'Advanced & Best Practices',
  lessons: [
    {
      id: 'adv-1',
      title: 'Type hints & dataclasses',
      body: `<p>Type hints (<code>def greet(name: str) -> str:</code>) document what a function expects and returns. Python doesn't enforce them at runtime — they're for humans and tools like linters and IDEs — but they make larger codebases dramatically easier to navigate. <code>@dataclass</code> auto-generates <code>__init__</code>, <code>__repr__</code>, and <code>__eq__</code> for classes that are mostly data containers, cutting out boilerplate.</p>`,
      example: `from dataclasses import dataclass

@dataclass
class Trade:
    symbol: str
    quantity: int
    price: float

    def value(self) -> float:
        return self.quantity * self.price

t = Trade("NIFTY", 50, 220.5)
print(t)
print(t.value())`,
      exercise: {
        prompt: `Create a <code>@dataclass</code> called <code>Holding</code> with fields <code>ticker: str</code> and <code>units: int</code>. Create one with <code>"TCS"</code>, <code>10</code>, store it in <code>h</code>, then store <code>h.units</code> in <code>units_held</code>.`,
        starterCode: `from dataclasses import dataclass

@dataclass
class Holding:
    pass

h = Holding("TCS", 10)
units_held = 0`,
        testCode: `assert units_held == 10, "units_held should be 10"
assert h.ticker == "TCS", "h.ticker should be TCS"`,
        successMessage: `A dataclass, defined and used.`
      }
    },
    {
      id: 'adv-2',
      title: 'Walrus operator, PEP 8 & structuring a project',
      body: `<p>The walrus operator <code>:=</code> assigns a value as part of a larger expression, saving a separate line — handy inside <code>while</code> loops or comprehensions. PEP 8 is Python's official style guide: 4-space indents, <code>snake_case</code> names, a blank line between functions — following it makes your code readable to any other Python developer, including future you.</p>
<p>As projects grow past a single file, split code into modules grouped by responsibility, keep a <code>main.py</code> entry point, and consider a <code>requirements.txt</code> listing dependencies.</p>`,
      example: `data = [1, 2, 3, 4, 5, 6, 7, 8]
results = [y for x in data if (y := x * 2) > 8]
print(results)

readings = iter([12, 45, 3, 99, 0])
while (value := next(readings, None)) is not None:
    print("reading:", value)`,
      exercise: {
        prompt: `Using the walrus operator, build <code>big_squares</code>: a comprehension over <code>range(1, 8)</code> keeping <code>square</code> (the value squared) only when it's greater than 20.`,
        starterCode: `# build big_squares using a comprehension with the walrus operator
big_squares = []`,
        testCode: `assert big_squares == [25, 36, 49], "big_squares should be [25, 36, 49]"`,
        successMessage: `Walrus operator, used exactly where it helps.`
      },
      quiz: {
        question: `What's the main purpose of PEP 8?`,
        options: [
          `It's Python's official style guide for consistent, readable code`,
          `It's a required security scanner`,
          `It's a testing framework`,
          `It's the license Python is released under`
        ],
        correctIndex: 0,
        explanation: `PEP 8 standardizes formatting and naming so any Python codebase feels familiar.`
      }
    }
  ]
},

// ---------------------------------------------------------------
{
  id: 'capstone',
  title: 'Module 18 — Capstone Projects',
  shortTitle: 'Capstone Projects',
  lessons: [
    {
      id: 'cap-1',
      title: 'Project: command-line to-do list',
      body: `<p>Time to combine what you've learned. Below is the skeleton of a to-do list backed by a list of dictionaries. Complete the functions using variables, lists, dictionaries, and functions from earlier modules — no new syntax here, just putting it together.</p>`,
      example: `tasks = []

def add_task(title):
    tasks.append({"title": title, "done": False})

def complete_task(index):
    tasks[index]["done"] = True

add_task("Review AML alerts")
add_task("Submit FCC report")
complete_task(0)
print(tasks)`,
      exercise: {
        prompt: `Complete <code>add_task</code> and <code>complete_task</code> as in the example, add three tasks, and mark the second one done. Store the number of completed tasks in <code>completed_count</code>.`,
        starterCode: `tasks = []

def add_task(title):
    pass

def complete_task(index):
    pass

add_task("Task A")
add_task("Task B")
add_task("Task C")
complete_task(1)

completed_count = sum(1 for t in tasks if t["done"])`,
        testCode: `assert completed_count == 1, "completed_count should be 1"
assert tasks[1]["done"] == True, "Task B should be marked done"`,
        successMessage: `A working to-do list, built from scratch.`
      }
    },
    {
      id: 'cap-2',
      title: 'Project: word-frequency analyzer',
      body: `<p>A classic small project: given a block of text, count how often each word appears. This combines string methods, dictionaries, and loops — exactly the kind of task Python is used for daily in real data work. You've come a long way from <code>print("Hello, world!")</code> on lesson one — this is that same toolkit, just applied together.</p>`,
      example: `text = "risk risk compliance audit risk audit"
words = text.split()
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
print(counts)

most_common = max(counts, key=counts.get)
print(most_common)`,
      exercise: {
        prompt: `Given <code>text = "nifty sensex nifty bank nifty sensex nifty"</code>, build a dictionary <code>counts</code> mapping each word to its frequency, and store the most frequent word in <code>top_word</code>.`,
        starterCode: `text = "nifty sensex nifty bank nifty sensex nifty"
counts = {}
top_word = ""`,
        testCode: `assert counts.get("nifty") == 4, "nifty should appear 4 times"
assert top_word == "nifty", "top_word should be nifty"`,
        successMessage: `You built a real text-analysis tool — from your first print() statement to this. That's the whole path, start to finish.`
      }
    }
  ]
}

];
