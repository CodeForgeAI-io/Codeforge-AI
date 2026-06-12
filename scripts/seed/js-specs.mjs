/**
 * 40 JavaScript-topic questions. Each spec's `solve` is the reference
 * solution — the seeder runs it over `inputs` to produce the expected
 * outputs, so test cases are correct by construction.
 *
 * Contract: programs read stdin and print to stdout.
 */

const q = (title, category, difficulty, tags, statement, inputs, solve, hints, explanation) => ({
  title, category, difficulty, tags, statement, inputs, solve, hints, explanation,
});

const J = JSON.stringify;

export const JS_SPECS = [
  /* ── JavaScript Basics ─────────────────────────────────────────── */
  q("Sum of Two Numbers", "JavaScript Basics", "Easy", ["JavaScript", "Numbers"],
    "Read two integers, one per line, and print their sum.\n\n**Input:** two lines, each an integer.\n**Output:** a single integer — the sum.",
    ["2\n3", "10\n-4", "0\n0", "999\n1", "-50\n-50"],
    (input) => { const [a, b] = input.split("\n").map(Number); return String(a + b); },
    ["Split the input by newline.", "Convert both lines with Number().", "Print a + b with console.log."],
    "Parse both lines to numbers and add them. Watch out: without Number(), `'2' + '3'` is string concatenation."),

  q("Type Detective", "JavaScript Basics", "Easy", ["JavaScript", "Types"],
    "Each line of input is a JSON value (e.g. `42`, `\"hi\"`, `true`, `null`, `[1,2]`, `{\"a\":1}`). For each line print one of: `number`, `string`, `boolean`, `null`, `array`, `object`.\n\n**Input:** one JSON value per line.\n**Output:** the value's type, one per line.",
    ['42\n"hi"\ntrue', 'null\n[1,2]\n{"a":1}', '3.14\nfalse', '"42"\n[]'],
    (input) => input.split("\n").map((line) => {
      const v = JSON.parse(line);
      if (v === null) return "null";
      if (Array.isArray(v)) return "array";
      return typeof v;
    }).join("\n"),
    ["JSON.parse each line.", "typeof null is 'object' — handle null first.", "Array.isArray distinguishes arrays from objects."],
    "The classic gotchas: `typeof null === 'object'` and arrays are objects too. Check null, then Array.isArray, then fall back to typeof."),

  q("FizzBuzz Classic", "JavaScript Basics", "Easy", ["JavaScript", "Loops"],
    "Read an integer n. Print numbers 1..n, one per line, but print `Fizz` for multiples of 3, `Buzz` for multiples of 5, and `FizzBuzz` for multiples of both.\n\n**Input:** one integer n (1 ≤ n ≤ 100).\n**Output:** n lines.",
    ["5", "15", "1", "3"],
    (input) => {
      const n = Number(input); const out = [];
      for (let i = 1; i <= n; i++) out.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i));
      return out.join("\n");
    },
    ["Loop from 1 to n.", "Check divisibility by 15 first.", "Use the modulo operator %."],
    "Check the combined condition (divisible by 15) before the individual ones, otherwise `Fizz` wins on 15."),

  q("Temperature Converter", "JavaScript Basics", "Easy", ["JavaScript", "Numbers"],
    "Read a temperature in Celsius (may be decimal) and print it in Fahrenheit, rounded to 1 decimal place. Formula: F = C × 9/5 + 32.\n\n**Input:** one number.\n**Output:** the Fahrenheit value with exactly 1 decimal (use toFixed(1)).",
    ["0", "100", "-40", "36.6"],
    (input) => (Number(input) * 9 / 5 + 32).toFixed(1),
    ["Apply the formula directly.", "toFixed(1) returns a string with one decimal.", "-40 is the same in both scales — a free test."],
    "Direct formula application; `toFixed(1)` handles the formatting requirement."),

  q("Largest of Three", "JavaScript Basics", "Easy", ["JavaScript", "Conditionals"],
    "Read three integers, one per line, and print the largest.\n\n**Input:** three lines, each an integer.\n**Output:** the maximum value.",
    ["1\n2\n3", "9\n4\n7", "-1\n-5\n-3", "5\n5\n5"],
    (input) => String(Math.max(...input.split("\n").map(Number))),
    ["Math.max takes multiple arguments.", "Spread the parsed array into Math.max.", "Negative numbers work the same way."],
    "Parse the three lines and spread them into `Math.max(...nums)`."),

  /* ── ES6+ Features ─────────────────────────────────────────────── */
  q("Destructure and Swap", "ES6+ Features", "Easy", ["JavaScript", "ES6", "Destructuring"],
    "Read two values separated by a space and print them swapped (still space-separated). Solve it with array destructuring — no temp variable.\n\n**Input:** one line: `a b`.\n**Output:** `b a`.",
    ["1 2", "hello world", "x y", "10 -10"],
    (input) => { let [a, b] = input.split(" "); [a, b] = [b, a]; return `${a} ${b}`; },
    ["Destructure the split result.", "[a, b] = [b, a] swaps without a temp.", "Join with a space for output."],
    "`[a, b] = [b, a]` is the idiomatic ES6 swap — the right side builds an array, the left destructures it."),

  q("Rest Parameter Sum", "ES6+ Features", "Easy", ["JavaScript", "ES6", "Rest"],
    "Read a single line of space-separated integers (any count) and print their sum. Use a rest-parameter style function `sum(...nums)`.\n\n**Input:** one line of integers.\n**Output:** the sum.",
    ["1 2 3", "10", "5 5 5 5 5 5", "-1 1 -2 2"],
    (input) => { const sum = (...nums) => nums.reduce((acc, n) => acc + n, 0); return String(sum(...input.split(" ").map(Number))); },
    ["Split and map to numbers.", "A rest parameter collects arguments into an array.", "reduce with initial value 0 handles any count."],
    "Rest parameters (`...nums`) collect all arguments into a real array, which `reduce` then folds into a sum."),

  q("Spread Merge Unique", "ES6+ Features", "Easy", ["JavaScript", "ES6", "Spread", "Set"],
    "Read two lines, each a JSON array of integers. Merge them with spread syntax, remove duplicates with a Set, and print the result as a JSON array preserving first-seen order.\n\n**Input:** two lines, each a JSON array.\n**Output:** one JSON array.",
    ["[1,2,3]\n[3,4,5]", "[1,1,1]\n[1,1]", "[]\n[7,8]", "[5,4]\n[4,5,6]"],
    (input) => { const [a, b] = input.split("\n").map((l) => JSON.parse(l)); return J([...new Set([...a, ...b])]); },
    ["Spread both arrays into one.", "new Set(...) removes duplicates.", "Spread the Set back into an array for JSON output."],
    "`[...new Set([...a, ...b])]` — Sets keep insertion order, so first occurrences win."),

  q("Template Label Maker", "ES6+ Features", "Easy", ["JavaScript", "ES6", "Template Literals"],
    "Read three lines: a name, a role, and a year. Print exactly: `NAME (ROLE) joined in YEAR` using a template literal, with NAME uppercased.\n\n**Input:** three lines.\n**Output:** one formatted line.",
    ["ada\nengineer\n1843", "grace\nadmiral\n1944", "alan\nmathematician\n1936"],
    (input) => { const [name, role, year] = input.split("\n"); return `${name.toUpperCase()} (${role}) joined in ${year}`; },
    ["Destructure the three lines.", "Template literals interpolate with ${}.", "Uppercase only the name."],
    "Template literals make multi-part string assembly readable: `${name.toUpperCase()} (${role}) joined in ${year}`."),

  q("Arrow Function Pipeline", "ES6+ Features", "Medium", ["JavaScript", "ES6", "Arrow Functions"],
    "Read a JSON array of integers. Apply this pipeline using arrow functions: double every number → keep values greater than 5 → sum the remainder. Print the sum.\n\n**Input:** one JSON array.\n**Output:** the final number.",
    ["[1,2,3,4]", "[5,5,5]", "[0,1]", "[10,-3,2]", "[3]"],
    (input) => String(JSON.parse(input).map((n) => n * 2).filter((n) => n > 5).reduce((a, n) => a + n, 0)),
    ["Chain map → filter → reduce.", "Double first, then filter > 5.", "reduce needs an initial value of 0 for empty results."],
    "Classic pipeline: `arr.map(n => n*2).filter(n => n > 5).reduce((a,n) => a+n, 0)`. Order matters — filtering happens on doubled values."),

  /* ── Closures & Scope ──────────────────────────────────────────── */
  q("Counter Factory", "Closures & Scope", "Easy", ["JavaScript", "Closures"],
    "Implement `makeCounter()` returning a function that returns 1, 2, 3... on successive calls. The input is a single integer n — create ONE counter and call it n times, printing each result on its own line.\n\n**Input:** one integer n.\n**Output:** n lines: 1..n.",
    ["3", "1", "5"],
    (input) => { const makeCounter = () => { let c = 0; return () => ++c; }; const counter = makeCounter(); const n = Number(input); const out = []; for (let i = 0; i < n; i++) out.push(String(counter())); return out.join("\n"); },
    ["The returned function closes over a variable.", "Increment before returning.", "Each makeCounter() call gets its own count."],
    "The inner function keeps a live reference to `c` in the factory's scope — that captured variable IS the closure."),

  q("Make Adder", "Closures & Scope", "Easy", ["JavaScript", "Closures", "Currying"],
    "Implement `makeAdder(x)` returning a function that adds x to its argument. Input: line 1 is x; line 2 is a JSON array of numbers. Print the array with the adder applied, as JSON.\n\n**Input:** two lines.\n**Output:** one JSON array.",
    ["5\n[1,2,3]", "-2\n[10,20]", "0\n[0]"],
    (input) => { const [first, second] = input.split("\n"); const makeAdder = (x) => (y) => x + y; const add = makeAdder(Number(first)); return J(JSON.parse(second).map(add)); },
    ["makeAdder returns a new function.", "The returned function remembers x.", "map accepts the adder directly."],
    "Currying via closure: `x` lives on in the returned function's scope, so `makeAdder(5)(3)` is 8."),

  q("Memoize Call Counter", "Closures & Scope", "Medium", ["JavaScript", "Closures", "Memoization"],
    "Implement `memoize(fn)` that caches results by argument. Input: a JSON array of integers representing successive calls to a memoized `square` function. Print two lines: the JSON array of results, and the number of ACTUAL (non-cached) computations.\n\n**Input:** one JSON array of call arguments.\n**Output:** line 1 — JSON results; line 2 — computation count.",
    ["[2,3,2,2]", "[1,1,1,1,1]", "[4,5,6]", "[7]"],
    (input) => { let computes = 0; const memoize = (fn) => { const cache = new Map(); return (x) => { if (cache.has(x)) return cache.get(x); const r = fn(x); cache.set(x, r); return r; }; }; const sq = memoize((x) => { computes++; return x * x; }); const results = JSON.parse(input).map(sq); return `${J(results)}\n${computes}`; },
    ["Keep a Map in the closure.", "Check cache.has before computing.", "Count only real computations."],
    "The cache Map lives in the closure between calls. Repeated arguments hit the cache, so 4 calls with [2,3,2,2] compute only twice."),

  q("Call Me Once", "Closures & Scope", "Medium", ["JavaScript", "Closures"],
    "Implement `once(fn)` — the wrapped function runs only on the first call; later calls return the first result. Input: a JSON array of numbers passed to a once-wrapped `triple`. Print the JSON array of returned values.\n\n**Input:** one JSON array.\n**Output:** one JSON array (every entry equals triple of the FIRST input).",
    ["[2,5,9]", "[4]", "[1,2,3,4,5]"],
    (input) => { const once = (fn) => { let called = false, result; return (x) => { if (!called) { called = true; result = fn(x); } return result; }; }; const t = once((x) => x * 3); return J(JSON.parse(input).map(t)); },
    ["Track a called flag in the closure.", "Store the first result.", "Return the stored result on later calls."],
    "A boolean flag plus a stored result in the closure makes the function idempotent after the first call — a common pattern for init code."),

  q("Private Bank Account", "Closures & Scope", "Medium", ["JavaScript", "Closures", "Encapsulation"],
    "Build `createAccount(initial)` exposing deposit(n), withdraw(n) (rejected silently if insufficient), and balance(). Input: line 1 — initial balance; following lines — operations like `deposit 50` or `withdraw 30`. Print the final balance.\n\n**Input:** initial balance then operations.\n**Output:** final balance.",
    ["100\ndeposit 50\nwithdraw 30", "10\nwithdraw 50\ndeposit 5", "0\ndeposit 1\ndeposit 2\nwithdraw 3"],
    (input) => { const lines = input.split("\n"); const createAccount = (initial) => { let bal = initial; return { deposit: (n) => { bal += n; }, withdraw: (n) => { if (n <= bal) bal -= n; }, balance: () => bal }; }; const acct = createAccount(Number(lines[0])); for (const line of lines.slice(1)) { const [op, amt] = line.split(" "); acct[op](Number(amt)); } return String(acct.balance()); },
    ["Keep balance as a closure variable, not a property.", "Withdraw checks funds first.", "Only the returned methods can touch the balance."],
    "True privacy without classes: `bal` is unreachable from outside — only the closure's methods can read or change it."),

  /* ── Arrays & Objects ──────────────────────────────────────────── */
  q("Square Them All", "Arrays & Objects", "Easy", ["JavaScript", "Array Methods", "map"],
    "Read a JSON array of integers and print a JSON array of their squares (use map).\n\n**Input:** one JSON array.\n**Output:** one JSON array.",
    ["[1,2,3]", "[-2,0,2]", "[10]", "[]"],
    (input) => J(JSON.parse(input).map((n) => n * n)),
    ["map transforms every element.", "Square is n * n.", "An empty array maps to an empty array."],
    "`map` is the go-to for 1:1 transforms — same length out as in."),

  q("Evens Only", "Arrays & Objects", "Easy", ["JavaScript", "Array Methods", "filter"],
    "Read a JSON array of integers and print only the even values as a JSON array (use filter).\n\n**Input:** one JSON array.\n**Output:** one JSON array.",
    ["[1,2,3,4]", "[1,3,5]", "[0,-2,7]", "[2,2,2]"],
    (input) => J(JSON.parse(input).filter((n) => n % 2 === 0)),
    ["filter keeps elements where the callback is true.", "Even means n % 2 === 0.", "Negative evens count too."],
    "`filter` selects a subset; `n % 2 === 0` correctly classifies negatives and zero as even."),

  q("Cart Total", "Arrays & Objects", "Easy", ["JavaScript", "Array Methods", "reduce"],
    "Read a JSON array of items `{\"name\": string, \"price\": number, \"qty\": number}` and print the cart total (price × qty summed), with 2 decimals.\n\n**Input:** one JSON array of items.\n**Output:** total with toFixed(2).",
    ['[{"name":"pen","price":1.5,"qty":2}]', '[{"name":"a","price":10,"qty":1},{"name":"b","price":2.25,"qty":4}]', "[]"],
    (input) => JSON.parse(input).reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2),
    ["reduce folds the array into one value.", "Each item contributes price * qty.", "Start the accumulator at 0."],
    "`reduce` with a 0 seed handles the empty cart; multiply inside the reducer."),

  q("Group by First Letter", "Arrays & Objects", "Medium", ["JavaScript", "Objects", "reduce"],
    "Read a JSON array of lowercase words. Group them by first letter into an object whose keys appear in alphabetical order, and print it as JSON.\n\n**Input:** one JSON array of words.\n**Output:** JSON object: letter → array of words (original order within groups, keys sorted).",
    ['["apple","banana","avocado","cherry"]', '["dog","deer"]', '["zebra","ant"]'],
    (input) => { const groups = JSON.parse(input).reduce((acc, w) => { (acc[w[0]] ??= []).push(w); return acc; }, {}); return J(Object.fromEntries(Object.keys(groups).sort().map((k) => [k, groups[k]]))); },
    ["Use the first character as the key.", "??= initializes the bucket once.", "Sort the keys before printing."],
    "Group with `reduce` + `??=`, then rebuild the object with sorted keys — JSON.stringify preserves insertion order for string keys."),

  q("Sort Players by Score", "Arrays & Objects", "Medium", ["JavaScript", "Sorting", "Objects"],
    "Read a JSON array of players `{\"name\": string, \"score\": number}`. Sort by score descending; ties break alphabetically by name. Print the sorted names as a JSON array.\n\n**Input:** one JSON array.\n**Output:** JSON array of names.",
    ['[{"name":"bo","score":5},{"name":"al","score":9}]', '[{"name":"cy","score":3},{"name":"ab","score":3},{"name":"zed","score":3}]', '[{"name":"solo","score":1}]'],
    (input) => J(JSON.parse(input).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((p) => p.name)),
    ["sort with a comparator: b.score - a.score for descending.", "Use || to chain the tiebreaker.", "localeCompare orders strings."],
    "Comparator chaining via `||`: when the score difference is 0 (falsy), the name comparison decides."),

  /* ── Async & Promises ──────────────────────────────────────────── */
  q("Promise.all Sum", "Async & Promises", "Easy", ["JavaScript", "Promises", "Async"],
    "Read a JSON array of integers. Wrap each in `Promise.resolve`, await them all with `Promise.all`, and print the sum of the resolved values.\n\n**Input:** one JSON array.\n**Output:** the sum.",
    ["[1,2,3]", "[10,20]", "[0]", "[-5,5]"],
    (input) => { const nums = JSON.parse(input); return String(nums.reduce((a, n) => a + n, 0)); },
    ["Promise.resolve wraps a plain value.", "Promise.all resolves to an array of values.", "Sum the awaited array with reduce."],
    "`Promise.all` turns an array of promises into a promise of an array — await it, then reduce. (The reference output equals the plain sum.)"),

  q("Sequential vs Parallel Order", "Async & Promises", "Medium", ["JavaScript", "Async", "Event Loop"],
    "Given this program, print its exact console output (one token per line):\n```js\nconsole.log('A');\nPromise.resolve().then(() => console.log('C'));\nconsole.log('B');\nsetTimeout(() => console.log('E'));\nPromise.resolve().then(() => console.log('D'));\n```\nThe input is the number of times to repeat that prediction, separated by a blank line between repeats.\n\n**Input:** one integer k.\n**Output:** the 5-line sequence, repeated k times, with a blank line between repeats.",
    ["1", "2"],
    (input) => { const k = Number(input); const block = ["A", "B", "C", "D", "E"].join("\n"); return Array.from({ length: k }, () => block).join("\n\n"); },
    ["Synchronous logs run first.", "Microtasks (then) run before macrotasks (setTimeout).", "Multiple thens run in registration order."],
    "Sync code → microtask queue (promise callbacks, in order) → macrotask queue (timers). Hence A, B, C, D, E."),

  q("Retry Until Success", "Async & Promises", "Medium", ["JavaScript", "Async", "Retry"],
    "An async operation fails until a known attempt number. Input: line 1 — the attempt on which it succeeds (s); line 2 — max retries allowed (m). Implement retry logic and print `success after N attempts` if N ≤ m, otherwise `failed after m attempts`.\n\n**Input:** two integers.\n**Output:** one status line.",
    ["3\n5", "4\n3", "1\n1", "2\n2"],
    (input) => { const [s, m] = input.split("\n").map(Number); return s <= m ? `success after ${s} attempts` : `failed after ${m} attempts`; },
    ["Loop attempts up to the max.", "try/catch inside the loop, return on success.", "After the loop, report failure."],
    "A retry wrapper loops with try/catch and stops at first success — the result depends only on whether the success attempt fits in the budget."),

  q("Async Pipeline", "Async & Promises", "Medium", ["JavaScript", "Async", "Chaining"],
    "Read an integer seed. Run it through three async steps in order: add 10, double, subtract 3 — each step awaited. Print each intermediate value on its own line (3 lines total).\n\n**Input:** one integer.\n**Output:** three lines: after add, after double, after subtract.",
    ["5", "0", "-4"],
    (input) => { let v = Number(input); const out = []; v = v + 10; out.push(String(v)); v = v * 2; out.push(String(v)); v = v - 3; out.push(String(v)); return out.join("\n"); },
    ["await each step before the next.", "Log after each await.", "Order is guaranteed by sequential awaits."],
    "Sequential `await`s create a deterministic pipeline — each step sees the previous step's settled value."),

  q("Settle Them All", "Async & Promises", "Hard", ["JavaScript", "Promises", "allSettled"],
    "Read a JSON array where each element is `{\"ok\": boolean, \"value\": number}`. Treat each as a promise that fulfills with value (ok=true) or rejects with value (ok=false). Using Promise.allSettled semantics, print two lines: the sum of fulfilled values, then the count of rejections.\n\n**Input:** one JSON array.\n**Output:** two lines.",
    ['[{"ok":true,"value":5},{"ok":false,"value":9},{"ok":true,"value":1}]', '[{"ok":false,"value":1}]', '[{"ok":true,"value":10}]'],
    (input) => { const items = JSON.parse(input); const fulfilled = items.filter((i) => i.ok).reduce((a, i) => a + i.value, 0); const rejected = items.filter((i) => !i.ok).length; return `${fulfilled}\n${rejected}`; },
    ["allSettled never rejects — it reports per-promise status.", "Filter results by status === 'fulfilled'.", "Rejections carry a reason instead of a value."],
    "`Promise.allSettled` yields `{status, value|reason}` for every promise, letting you aggregate successes while counting failures."),

  /* ── DOM & Events ──────────────────────────────────────────────── */
  q("Event Bubbling Path", "DOM & Events", "Easy", ["JavaScript", "DOM", "Events"],
    "The DOM tree is given as nested JSON: `{\"id\": string, \"children\": [...]}`. Given a target id, print the bubbling path from the target up to the root, ids separated by ` > `.\n\n**Input:** line 1 — tree JSON; line 2 — target id.\n**Output:** path like `button > form > body`.",
    ['{"id":"body","children":[{"id":"form","children":[{"id":"button","children":[]}]}]}\nbutton', '{"id":"root","children":[{"id":"a","children":[]},{"id":"b","children":[]}]}\nb', '{"id":"solo","children":[]}\nsolo'],
    (input) => { const nl = input.indexOf("\n"); const tree = JSON.parse(input.slice(0, nl)); const target = input.slice(nl + 1).trim(); const path = []; const find = (node, trail) => { const next = [...trail, node.id]; if (node.id === target) { path.push(...next.reverse()); return true; } return node.children.some((c) => find(c, next)); }; find(tree, []); return path.join(" > "); },
    ["Walk the tree keeping the ancestor trail.", "When you hit the target, reverse the trail.", "Bubbling goes child → root."],
    "Events bubble from the target up through its ancestors — a DFS that records the trail gives the exact path."),

  q("classList Simulator", "DOM & Events", "Easy", ["JavaScript", "DOM"],
    "Simulate `element.classList`. Input: line 1 — initial space-separated class list (may be empty); following lines — operations: `add x`, `remove x`, `toggle x`. Print the final class list space-separated (insertion order, no duplicates), or `(empty)`.\n\n**Input:** initial classes then operations.\n**Output:** final class list.",
    ["btn primary\nadd active\nremove primary", "\nadd a\ntoggle a\ntoggle b", "card\nadd card\nadd card"],
    (input) => { const lines = input.split("\n"); const classes = new Set(lines[0].split(" ").filter(Boolean)); for (const line of lines.slice(1)) { const [op, name] = line.split(" "); if (op === "add") classes.add(name); else if (op === "remove") classes.delete(name); else if (op === "toggle") { if (classes.has(name)) classes.delete(name); else classes.add(name); } } const out = [...classes].join(" "); return out || "(empty)"; },
    ["A Set models classList: unique, ordered.", "toggle = delete if present, add otherwise.", "add on an existing class is a no-op."],
    "`classList` is set-like — a JS `Set` reproduces add/remove/toggle semantics including duplicate-add being ignored."),

  q("Event Delegation Matcher", "DOM & Events", "Medium", ["JavaScript", "DOM", "Delegation"],
    "A list container delegates clicks. Input: line 1 — JSON array of item objects `{\"id\": string, \"cls\": string[]}`; line 2 — a CSS-ish selector: either `.className` or `#id`; line 3 — clicked item id. Print `handled` if the clicked item matches the selector, else `ignored`.\n\n**Input:** three lines.\n**Output:** `handled` or `ignored`.",
    ['[{"id":"a","cls":["item"]},{"id":"b","cls":["item","active"]}]\n.active\nb', '[{"id":"a","cls":["item"]}]\n.missing\na', '[{"id":"x","cls":[]}]\n#x\nx'],
    (input) => { const [itemsLine, selector, clicked] = input.split("\n"); const item = JSON.parse(itemsLine).find((i) => i.id === clicked); if (!item) return "ignored"; const match = selector.startsWith("#") ? item.id === selector.slice(1) : item.cls.includes(selector.slice(1)); return match ? "handled" : "ignored"; },
    ["Find the clicked item first.", "# selects by id, . by class.", "Delegation = one parent listener filtering by matches()."],
    "Delegation attaches one listener to a parent and tests `event.target` against a selector — here reproduced with id/class matching."),

  q("Build the DOM String", "DOM & Events", "Medium", ["JavaScript", "DOM", "Rendering"],
    "Render a node spec to an HTML string. Spec: `{\"tag\": string, \"text\": string?, \"children\": [...]}`. Text renders inside the tag before children.\n\n**Input:** one JSON spec.\n**Output:** the HTML string, no whitespace between tags.",
    ['{"tag":"div","text":"hi","children":[]}', '{"tag":"ul","children":[{"tag":"li","text":"a","children":[]},{"tag":"li","text":"b","children":[]}]}', '{"tag":"p","children":[{"tag":"b","text":"x","children":[]}]}'],
    (input) => { const render = (n) => `<${n.tag}>${n.text ?? ""}${(n.children ?? []).map(render).join("")}</${n.tag}>`; return render(JSON.parse(input)); },
    ["Recursion mirrors the tree shape.", "Render text, then children, inside the tags.", "Join children with no separator."],
    "Recursive descent: each node renders `<tag>` + text + rendered children + `</tag>` — exactly how server-side renderers build markup."),

  /* ── Error Handling ───────────────────────────────────────────── */
  q("Safe Division", "Error Handling", "Easy", ["JavaScript", "try-catch"],
    "Read two numbers a and b (one per line). Implement `divide(a, b)` that THROWS an Error with message `division by zero` when b is 0. Catch it and print the error message; otherwise print the quotient.\n\n**Input:** two lines.\n**Output:** quotient or the error message.",
    ["10\n2", "7\n0", "9\n3", "-8\n4"],
    (input) => { const [a, b] = input.split("\n").map(Number); try { if (b === 0) throw new Error("division by zero"); return String(a / b); } catch (e) { return e.message; } },
    ["throw new Error('...') with the exact message.", "Wrap the call in try/catch.", "err.message holds the text."],
    "Throwing turns an invalid state into a control-flow event the caller must handle — the catch block owns the fallback."),

  q("JSON Parse or Default", "Error Handling", "Easy", ["JavaScript", "try-catch", "JSON"],
    "Each input line is supposed to be JSON. Print the parsed value re-stringified; if parsing throws, print `INVALID` for that line.\n\n**Input:** one or more lines.\n**Output:** one result per line.",
    ['{"a":1}\nnot json\n[1,2]', "42\n{bad", '"ok"'],
    (input) => input.split("\n").map((line) => { try { return J(JSON.parse(line)); } catch { return "INVALID"; } }).join("\n"),
    ["try/catch around JSON.parse.", "Catch without binding is fine when unused.", "Re-stringify for canonical output."],
    "JSON.parse throws SyntaxError on bad input — a try/catch per line localizes the failure instead of killing the whole run."),

  q("Validate User Record", "Error Handling", "Medium", ["JavaScript", "Validation", "Custom Errors"],
    "Validate a user JSON: must have string `name` (non-empty) and numeric `age` 0–150. Throw `ValidationError` with messages `name required` or `invalid age` (check name first). Print `valid` or the caught error message.\n\n**Input:** one JSON object.\n**Output:** `valid` or the message.",
    ['{"name":"Ada","age":36}', '{"name":"","age":30}', '{"name":"Bob","age":200}', '{"age":5}'],
    (input) => { class ValidationError extends Error {} const u = JSON.parse(input); try { if (typeof u.name !== "string" || u.name.length === 0) throw new ValidationError("name required"); if (typeof u.age !== "number" || u.age < 0 || u.age > 150) throw new ValidationError("invalid age"); return "valid"; } catch (e) { return e.message; } },
    ["Extend Error for custom types.", "Check name before age.", "instanceof distinguishes error kinds when needed."],
    "Custom error classes carry intent; sequential guards with early throws keep validation readable."),

  q("Finally Runs Last", "Error Handling", "Medium", ["JavaScript", "try-catch-finally"],
    "Predict try/catch/finally output. The function: try { log `try`; if flag throw } catch { log `catch` } finally { log `finally` } then log `after`. Input is `0` (no throw) or `1` (throw). Print the logged lines.\n\n**Input:** 0 or 1.\n**Output:** the log lines in order.",
    ["0", "1"],
    (input) => (input.trim() === "1" ? ["try", "catch", "finally", "after"] : ["try", "finally", "after"]).join("\n"),
    ["finally runs whether or not it threw.", "catch only runs on a throw.", "Code after the block still runs when the error was caught."],
    "`finally` is unconditional cleanup; `catch` absorbs the throw so execution continues after the block."),

  /* ── Modules ───────────────────────────────────────────────────── */
  q("Import Order Resolver", "Modules", "Medium", ["JavaScript", "Modules", "Graphs"],
    "Modules import each other. Input: a JSON object mapping module → array of modules it imports. A module loads only after its imports. Print a valid load order, choosing alphabetically among ready modules, comma-separated.\n\n**Input:** one JSON object (the graph is acyclic).\n**Output:** load order like `a,b,c`.",
    ['{"app":["utils","api"],"api":["utils"],"utils":[]}', '{"a":[],"b":["a"]}', '{"x":["y"],"y":["z"],"z":[]}'],
    (input) => { const graph = JSON.parse(input); const loaded = new Set(); const order = []; const names = Object.keys(graph).sort(); while (order.length < names.length) { for (const name of names) { if (!loaded.has(name) && graph[name].every((d) => loaded.has(d))) { loaded.add(name); order.push(name); break; } } } return order.join(","); },
    ["A module is ready when all its imports loaded.", "Pick the alphabetically first ready module.", "This is topological sorting."],
    "ES module evaluation is a topological order of the dependency graph — dependencies always evaluate before importers."),

  q("Named vs Default Exports", "Modules", "Easy", ["JavaScript", "Modules", "Imports"],
    "A module's exports are given as JSON: `{\"default\": value?, \"named\": {name: value}}`. Import statements follow, one per line: `import X from 'm'` (default) or `import {a} from 'm'` (named, single name). Print each imported value (or `undefined` if missing).\n\n**Input:** line 1 — exports JSON; then import lines.\n**Output:** one value per import line.",
    ['{"default":42,"named":{"helper":7}}\nimport X from \'m\'\nimport {helper} from \'m\'', '{"named":{"a":1}}\nimport Y from \'m\'\nimport {a} from \'m\'\nimport {b} from \'m\''],
    (input) => { const lines = input.split("\n"); const mod = JSON.parse(lines[0]); return lines.slice(1).map((line) => { const named = line.match(/import \{(\w+)\}/); if (named) return String(mod.named?.[named[1]] ?? "undefined"); return String(mod.default ?? "undefined"); }).join("\n"); },
    ["Braces mean a named import.", "No braces means the default export.", "Missing bindings are undefined, not errors (here)."],
    "Default and named exports live in different slots — `import X` reads `default`, `import {a}` reads the named map."),

  q("Circular Import Detector", "Modules", "Hard", ["JavaScript", "Modules", "Graphs"],
    "Given the same module→imports JSON graph, print `cycle` if any circular import exists, otherwise `ok`.\n\n**Input:** one JSON object.\n**Output:** `cycle` or `ok`.",
    ['{"a":["b"],"b":["a"]}', '{"a":["b"],"b":["c"],"c":[]}', '{"m":["m"]}', '{"x":[],"y":[]}'],
    (input) => { const graph = JSON.parse(input); const WHITE = 0, GRAY = 1, BLACK = 2; const color = {}; const visit = (n) => { color[n] = GRAY; for (const d of graph[n] ?? []) { if (color[d] === GRAY) return true; if ((color[d] ?? WHITE) === WHITE && visit(d)) return true; } color[n] = BLACK; return false; }; for (const n of Object.keys(graph)) { if ((color[n] ?? WHITE) === WHITE && visit(n)) return "cycle"; } return "ok"; },
    ["DFS with three colors: unvisited, in-progress, done.", "Reaching an in-progress node means a cycle.", "Self-imports are 1-node cycles."],
    "Cycle detection = finding a back edge during DFS. The gray state marks nodes on the current recursion stack."),

  q("Module Cache Hits", "Modules", "Easy", ["JavaScript", "Modules", "Caching"],
    "Node caches modules after first require. Input: one require'd module name per line. Print two lines: the number of actual loads (unique names) and the number of cache hits.\n\n**Input:** module names, one per line.\n**Output:** loads, then hits.",
    ["fs\npath\nfs\nfs", "a\nb\nc", "x\nx\nx\nx\nx"],
    (input) => { const names = input.split("\n"); const unique = new Set(names).size; return `${unique}\n${names.length - unique}`; },
    ["First require loads; repeats hit the cache.", "Unique names = real loads.", "Total minus unique = hits."],
    "`require` evaluates a module once and serves the cached `module.exports` afterwards — that's why singletons work."),

  q("Re-export Aggregator", "Modules", "Medium", ["JavaScript", "Modules", "Barrel Files"],
    "A barrel file re-exports several modules in order; later exports shadow earlier ones with the same name. Input: a JSON array of objects (each module's named exports, in re-export order). Print the final merged export map as JSON with keys sorted.\n\n**Input:** one JSON array of objects.\n**Output:** merged JSON object, keys sorted.",
    ['[{"a":1,"b":2},{"b":9,"c":3}]', '[{"x":1}]', '[{"k":1},{"k":2},{"k":3}]'],
    (input) => { const merged = Object.assign({}, ...JSON.parse(input)); return J(Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]))); },
    ["Object.assign merges left to right.", "Later sources overwrite earlier keys.", "Sort keys for stable output."],
    "Barrel files (`export * from`) merge namespaces where the last re-export wins on conflicts — modeled exactly by `Object.assign` order."),
];
