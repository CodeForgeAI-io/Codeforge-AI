/**
 * React-topic questions, part 1 (30). All are runnable JavaScript exercises
 * that implement/simulate the React concept — no JSX transpiler needed.
 */

const q = (title, category, difficulty, tags, statement, inputs, solve, hints, explanation) => ({
  title, category, difficulty, tags, statement, inputs, solve, hints, explanation,
});

const J = JSON.stringify;

export const REACT_SPECS_1 = [
  /* ── React Components ─────────────────────────────────────────── */
  q("Render a Functional Component", "React Components", "Easy", ["React", "Components"],
    "A functional component is a function of props returning markup. Implement `Greeting(props)` that returns `<h1>Hello, NAME!</h1>`. Input is a JSON props object `{\"name\": string}` — print the returned markup string.\n\n**Input:** one JSON props object.\n**Output:** the markup string.",
    ['{"name":"Ada"}', '{"name":"World"}', '{"name":"React"}'],
    (input) => { const Greeting = (props) => `<h1>Hello, ${props.name}!</h1>`; return Greeting(JSON.parse(input)); },
    ["A component is just a function.", "Read name from the props object.", "Return the full tag string."],
    "Functional components are plain functions: props in, UI description out. No classes, no magic."),

  q("Class vs Functional Output", "React Components", "Easy", ["React", "Components", "Classes"],
    "The same UI written two ways must render identically. Implement functional `Badge(props)` and class-style `BadgeClass` (with a render() method) that both return `<span class=\"badge\">TEXT</span>`. Input: JSON `{\"text\": string}`. Print both outputs on two lines (they must match).\n\n**Input:** one JSON props object.\n**Output:** two identical lines.",
    ['{"text":"new"}', '{"text":"42"}'],
    (input) => { const props = JSON.parse(input); const Badge = (p) => `<span class="badge">${p.text}</span>`; class BadgeClass { constructor(p) { this.props = p; } render() { return `<span class="badge">${this.props.text}</span>`; } } return `${Badge(props)}\n${new BadgeClass(props).render()}`; },
    ["Class components read this.props inside render().", "Functional components take props as the argument.", "Both produce the same description."],
    "Classes hold props on `this.props` and describe UI in `render()`; functions just return it. Same output, different ergonomics."),

  q("Component Composition", "React Components", "Medium", ["React", "Components", "Composition"],
    "Components wrap children. `Card(content)` returns `<div class=\"card\">CONTENT</div>`; `Page(content)` returns `<main>CONTENT</main>`. Input: line 1 — the inner text; line 2 — a JSON array of wrapper names applied inside-out (e.g. `[\"Card\",\"Page\"]` means Page(Card(text))). Print the final markup.\n\n**Input:** two lines.\n**Output:** composed markup.",
    ['hello\n["Card","Page"]', 'x\n["Card"]', 'deep\n["Card","Card","Page"]'],
    (input) => { const nl = input.indexOf("\n"); const text = input.slice(0, nl); const wrappers = JSON.parse(input.slice(nl + 1)); const components = { Card: (c) => `<div class="card">${c}</div>`, Page: (c) => `<main>${c}</main>` }; return wrappers.reduce((content, name) => components[name](content), text); },
    ["Apply wrappers left to right with reduce.", "Each component receives the previous output as children.", "Composition replaces inheritance in React."],
    "Composition is function application: `Page(Card(text))`. `reduce` folds the wrapper list around the content."),

  q("Pure Component Skip Count", "React Components", "Medium", ["React", "Components", "Memo"],
    "A memoized component re-renders only when props change (shallow equality on a single value). Input: a JSON array of successive prop values. Print two lines: the number of renders and the number of skips.\n\n**Input:** JSON array of primitive prop values.\n**Output:** renders, then skips.",
    ['[1,1,2,2,2,3]', '["a","a","a"]', "[5]", "[1,2,3,4]"],
    (input) => { const values = JSON.parse(input); let renders = 0, skips = 0, prev; let first = true; for (const v of values) { if (first || v !== prev) { renders++; first = false; } else skips++; prev = v; } return `${renders}\n${skips}`; },
    ["The first value always renders.", "Equal consecutive props skip.", "React.memo does shallow comparison."],
    "`React.memo` bails out when props are shallow-equal to the previous render — consecutive duplicates cost nothing."),

  q("Flatten Children", "React Components", "Medium", ["React", "Components", "Children"],
    "React flattens nested children arrays and drops null/false. Input: a JSON array that may contain strings, numbers, nulls, booleans, and nested arrays. Print the flattened render list as a JSON array of strings (numbers stringified, null/false/true removed).\n\n**Input:** one JSON array.\n**Output:** flat JSON array of strings.",
    ['["a",["b",null,["c"]],false,1]', '[null,true,false]', '[["x"],"y"]'],
    (input) => { const out = []; const walk = (node) => { if (Array.isArray(node)) return node.forEach(walk); if (node === null || typeof node === "boolean") return; out.push(String(node)); }; walk(JSON.parse(input)); return J(out); },
    ["Recurse into arrays.", "null and booleans render nothing.", "Numbers render as text."],
    "React.Children flattening: arrays expand in place, null/boolean children are skipped, primitives become text nodes."),

  /* ── JSX & Rendering ──────────────────────────────────────────── */
  q("Implement createElement", "JSX & Rendering", "Easy", ["React", "JSX", "createElement"],
    "JSX compiles to `createElement(type, props, ...children)`. Implement it to return `{\"type\", \"props\", \"children\"}`. Input: line 1 — type; line 2 — props JSON; line 3 — children JSON array. Print the element JSON.\n\n**Input:** three lines.\n**Output:** the element object as JSON.",
    ['div\n{"id":"app"}\n["hi"]', 'button\n{}\n["click","me"]', 'img\n{"src":"a.png"}\n[]'],
    (input) => { const [type, propsLine, childrenLine] = input.split("\n"); const createElement = (t, props, ...children) => ({ type: t, props, children }); return J(createElement(type, JSON.parse(propsLine), ...JSON.parse(childrenLine))); },
    ["JSX is sugar for this call.", "Children arrive as rest arguments.", "The result is a plain object — the virtual DOM node."],
    "`<div id=\"app\">hi</div>` compiles to `createElement('div', {id:'app'}, 'hi')` — elements are cheap descriptions, not DOM."),

  q("Interpolate the Template", "JSX & Rendering", "Easy", ["React", "JSX", "Interpolation"],
    "JSX interpolates expressions in braces. Input: line 1 — a template containing `{name}` and `{count}` placeholders; line 2 — values JSON `{\"name\":..., \"count\":...}`. Print the template with placeholders replaced.\n\n**Input:** two lines.\n**Output:** the rendered string.",
    ['Hello {name}, you have {count} messages\n{"name":"Ada","count":3}', '{count} items for {name}\n{"name":"Bo","count":0}'],
    (input) => { const nl = input.indexOf("\n"); const template = input.slice(0, nl); const values = JSON.parse(input.slice(nl + 1)); return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key])); },
    ["Replace {key} with values[key].", "A regex with a capture group finds placeholders.", "JSX braces evaluate any expression."],
    "JSX's `{expr}` is expression interpolation — here simulated with a regex replace over named slots."),

  q("Render a List to HTML", "JSX & Rendering", "Easy", ["React", "JSX", "Lists"],
    "Render an array to markup. Input: a JSON array of strings. Print `<ul>` + one `<li>item</li>` per entry + `</ul>` (no whitespace).\n\n**Input:** one JSON array.\n**Output:** the HTML string.",
    ['["a","b"]', '["only"]', "[]"],
    (input) => `<ul>${JSON.parse(input).map((item) => `<li>${item}</li>`).join("")}</ul>`,
    ["map each item to an <li> string.", "join with empty string.", "In real JSX this is {items.map(...)}."],
    "`{items.map(item => <li>{item}</li>)}` is the JSX idiom; string concatenation shows exactly what it produces."),

  q("Fragment Flattening", "JSX & Rendering", "Medium", ["React", "JSX", "Fragments"],
    "Fragments group children without a wrapper node. Element JSON: `{\"type\": string, \"children\": [...]}`; type `\"<>\"` is a fragment. Print the rendered HTML where fragments contribute only their children.\n\n**Input:** one element JSON.\n**Output:** HTML string.",
    ['{"type":"div","children":[{"type":"<>","children":[{"type":"span","children":["a"]},{"type":"span","children":["b"]}]}]}', '{"type":"<>","children":[{"type":"p","children":["x"]}]}'],
    (input) => { const render = (node) => { if (typeof node === "string") return node; const inner = (node.children ?? []).map(render).join(""); return node.type === "<>" ? inner : `<${node.type}>${inner}</${node.type}>`; }; return render(JSON.parse(input)); },
    ["Fragments render children with no tags.", "Recurse normally otherwise.", "<></> avoids div-soup."],
    "A fragment is an invisible container: it renders its children's markup and nothing else."),

  q("Conditional Attribute Render", "JSX & Rendering", "Medium", ["React", "JSX", "Attributes"],
    "Render `<button>` with conditional attributes. Input JSON: `{\"label\": string, \"disabled\": boolean, \"variant\": string|null}`. Output `<button class=\"btn btn-VARIANT\" disabled>LABEL</button>` — omit ` btn-VARIANT` when variant is null and ` disabled` when false.\n\n**Input:** one JSON object.\n**Output:** the markup.",
    ['{"label":"Save","disabled":false,"variant":"primary"}', '{"label":"Stop","disabled":true,"variant":null}', '{"label":"Go","disabled":true,"variant":"danger"}'],
    (input) => { const { label, disabled, variant } = JSON.parse(input); const cls = `btn${variant ? ` btn-${variant}` : ""}`; return `<button class="${cls}"${disabled ? " disabled" : ""}>${label}</button>`; },
    ["Build the class string conditionally.", "Boolean attributes appear or vanish entirely.", "Template literals keep it readable."],
    "In JSX, `disabled={false}` omits the attribute and class names are computed strings — both modeled here explicitly."),

  /* ── Props & State ───────────────────────────────────────────── */
  q("Default Props Merge", "Props & State", "Easy", ["React", "Props"],
    "Merge incoming props over defaults. Defaults: `{\"size\":\"md\",\"color\":\"black\",\"rounded\":false}`. Input: a JSON props object. Print the merged props as JSON with keys sorted.\n\n**Input:** one JSON object.\n**Output:** merged JSON, keys sorted.",
    ['{"color":"orange"}', "{}", '{"size":"lg","rounded":true}'],
    (input) => { const merged = { size: "md", color: "black", rounded: false, ...JSON.parse(input) }; return J(Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]))); },
    ["Spread defaults first, then incoming props.", "Later spreads win.", "Sort keys for stable output."],
    "`{...defaults, ...props}` — order encodes precedence, the incoming props shadow the defaults."),

  q("setState Batch Reducer", "Props & State", "Medium", ["React", "State", "setState"],
    "State starts as a JSON object. Each following line is a partial update (JSON) that shallow-merges into state, like setState. Print the final state as JSON with keys sorted.\n\n**Input:** line 1 — initial state; following lines — patches.\n**Output:** final state JSON, keys sorted.",
    ['{"count":0,"name":"x"}\n{"count":1}\n{"count":2,"flag":true}', '{"a":1}\n{}', '{"v":1}\n{"v":2}\n{"v":3}'],
    (input) => { const lines = input.split("\n"); const state = lines.slice(1).reduce((acc, line) => ({ ...acc, ...JSON.parse(line) }), JSON.parse(lines[0])); return J(Object.fromEntries(Object.keys(state).sort().map((k) => [k, state[k]]))); },
    ["setState shallow-merges patches.", "reduce over the patch list.", "Unmentioned keys survive."],
    "Class setState merges (unlike useState which replaces) — successive patches fold into the object left to right."),

  q("Updater Function Order", "Props & State", "Medium", ["React", "State", "Updaters"],
    "Counter state starts at an integer. Each following line is either a number (set to that value) or `inc N` (functional updater: previous + N). Updaters see the LATEST value. Print the final count.\n\n**Input:** initial value, then operations.\n**Output:** final count.",
    ["0\ninc 1\ninc 1\ninc 1", "5\n10\ninc 2", "3\ninc -3\ninc 10"],
    (input) => { const lines = input.split("\n"); let count = Number(lines[0]); for (const line of lines.slice(1)) { if (line.startsWith("inc ")) count += Number(line.slice(4)); else count = Number(line); } return String(count); },
    ["Functional updaters receive the current value.", "Direct sets replace it.", "Three inc 1 in a row really add 3 — that's why updaters exist."],
    "`setCount(c => c + 1)` queues a function that reads the freshest state — the fix for the classic stale-closure triple-increment bug."),

  q("Immutable Nested Update", "Props & State", "Hard", ["React", "State", "Immutability"],
    "Update nested state without mutation. Input: line 1 — state JSON; line 2 — a dot path like `user.address.city`; line 3 — new value (JSON). Print the NEW state JSON; every object on the path must be a new reference (deep-set immutably).\n\n**Input:** three lines.\n**Output:** updated state JSON.",
    ['{"user":{"address":{"city":"NYC","zip":"1"},"age":30}}\nuser.address.city\n"LA"', '{"a":{"b":1},"c":2}\na.b\n42', '{"x":{}}\nx.y\n"new"'],
    (input) => { const lines = input.split("\n"); const state = JSON.parse(lines[0]); const path = lines[1].split("."); const value = JSON.parse(lines[2]); const setIn = (obj, [head, ...rest]) => ({ ...obj, [head]: rest.length === 0 ? value : setIn(obj[head] ?? {}, rest) }); return J(setIn(state, path)); },
    ["Spread each level you descend through.", "Recursion handles arbitrary depth.", "Sibling keys are preserved by the spread."],
    "Immutable updates copy the spine of the path (`{...obj, key: updatedChild}`) so React's reference checks detect the change."),

  q("Props Drill Finder", "Props & State", "Medium", ["React", "Props", "Drilling"],
    "A component tree passes a prop downward. Tree JSON: `{\"name\": string, \"receivesProp\": boolean, \"children\": [...]}`. Print the names of all components that receive the prop, depth-first, comma-separated (or `none`).\n\n**Input:** one tree JSON.\n**Output:** comma-separated names or `none`.",
    ['{"name":"App","receivesProp":true,"children":[{"name":"Header","receivesProp":false,"children":[]},{"name":"Body","receivesProp":true,"children":[{"name":"Item","receivesProp":true,"children":[]}]}]}', '{"name":"Solo","receivesProp":false,"children":[]}'],
    (input) => { const out = []; const walk = (node) => { if (node.receivesProp) out.push(node.name); (node.children ?? []).forEach(walk); }; walk(JSON.parse(input)); return out.length ? out.join(",") : "none"; },
    ["Depth-first traversal.", "Collect names where the flag is true.", "Long chains like this motivate Context."],
    "Prop drilling threads data through intermediate components — a DFS makes the drill path visible (and is the case for Context)."),

  /* ── React Events ─────────────────────────────────────────────── */
  q("Click Counter Events", "React Events", "Easy", ["React", "Events", "State"],
    "A button's onClick increments a counter; a reset button sets it to 0. Input: one event per line: `click` or `reset`. Print the counter after every event, one value per line.\n\n**Input:** event lines.\n**Output:** counter value per event.",
    ["click\nclick\nreset\nclick", "click", "reset\nreset"],
    (input) => { let count = 0; return input.split("\n").map((event) => { if (event === "click") count++; else count = 0; return String(count); }).join("\n"); },
    ["Each handler updates state.", "Render (print) after every event.", "Reset writes 0 regardless of current value."],
    "Event handlers translate user actions into state updates; each update triggers a re-render — printed here as one line per event."),

  q("Synthetic Event Phases", "React Events", "Medium", ["React", "Events", "Propagation"],
    "Handlers fire capture-phase root→target, then bubble-phase target→root. Input: line 1 — JSON array path from root to target (e.g. `[\"div\",\"form\",\"button\"]`); line 2 — JSON array of nodes that have BOTH capture and bubble handlers. Print fired handlers in order, one per line, as `NODE capture` / `NODE bubble`.\n\n**Input:** two lines.\n**Output:** handler firings in order.",
    ['["div","form","button"]\n["div","button"]', '["root","leaf"]\n["leaf"]', '["a","b","c"]\n["a","b","c"]'],
    (input) => { const [pathLine, handlersLine] = input.split("\n"); const path = JSON.parse(pathLine); const handlers = new Set(JSON.parse(handlersLine)); const out = []; for (const node of path) if (handlers.has(node)) out.push(`${node} capture`); for (const node of [...path].reverse()) if (handlers.has(node)) out.push(`${node} bubble`); return out.join("\n"); },
    ["Capture goes down, bubble comes back up.", "The target fires in both phases.", "onClickCapture vs onClick in React."],
    "DOM (and React synthetic) events run two passes: capture root→target, then bubble target→root — interleaving follows from the path."),

  q("stopPropagation Gate", "React Events", "Medium", ["React", "Events", "Propagation"],
    "Bubbling stops at a node that calls stopPropagation. Input: line 1 — bubble path target→root as JSON array; line 2 — the node that stops propagation (or `none`). Print the nodes whose handlers actually fire, one per line.\n\n**Input:** two lines.\n**Output:** fired nodes in order.",
    ['["button","form","body"]\nform', '["a","b","c"]\nnone', '["x","y"]\nx'],
    (input) => { const [pathLine, stopper] = input.split("\n"); const path = JSON.parse(pathLine); const out = []; for (const node of path) { out.push(node); if (node === stopper) break; } return out.join("\n"); },
    ["Walk the bubble path in order.", "Include the stopping node, then break.", "Ancestors above the stopper never hear the event."],
    "`e.stopPropagation()` lets the current handler run but cancels delivery to the rest of the path."),

  q("Controlled Input Value", "React Events", "Easy", ["React", "Events", "Controlled"],
    "A controlled input's value lives in state. Events, one per line: `type X` (append X), `backspace` (remove last char), `clear`. Print the input value after all events (or `(empty)`).\n\n**Input:** event lines.\n**Output:** final value.",
    ["type h\ntype i\ntype !", "type a\nbackspace\nbackspace", "type x\nclear\ntype y"],
    (input) => { let value = ""; for (const line of input.split("\n")) { if (line.startsWith("type ")) value += line.slice(5); else if (line === "backspace") value = value.slice(0, -1); else if (line === "clear") value = ""; } return value || "(empty)"; },
    ["onChange writes to state; value reads from it.", "backspace on empty stays empty.", "The DOM never owns the value."],
    "Controlled components make state the single source of truth: every keystroke round-trips through setState."),

  q("Debounced Click Handler", "React Events", "Hard", ["React", "Events", "Debounce"],
    "A debounced handler (delay d) runs only if no further click arrives within d ms. Input: line 1 — d; line 2 — JSON array of click timestamps (ascending). Print how many times the handler actually runs.\n\n**Input:** two lines.\n**Output:** run count.",
    ["100\n[0,50,90,300]", "100\n[0,200,400]", "50\n[0,10,20,30]", "100\n[]"],
    (input) => { const [dLine, timesLine] = input.split("\n"); const d = Number(dLine); const times = JSON.parse(timesLine); if (times.length === 0) return "0"; let runs = 0; for (let i = 0; i < times.length; i++) { const gap = i + 1 < times.length ? times[i + 1] - times[i] : Infinity; if (gap >= d) runs++; } return String(runs); },
    ["Each click cancels the pending timer.", "A run happens when the next click is ≥ d away.", "The final click always eventually runs."],
    "Debouncing fires only after a quiet period: a click survives if the next one arrives at least `d` ms later (the last always survives)."),

  /* ── Conditional Rendering ────────────────────────────────────── */
  q("Ternary View Picker", "Conditional Rendering", "Easy", ["React", "Conditional"],
    "Render `<Dashboard/>` when logged in, else `<Login/>`. Input: `true` or `false`. Print the rendered tag name.\n\n**Input:** a boolean literal.\n**Output:** `Dashboard` or `Login`.",
    ["true", "false"],
    (input) => (input.trim() === "true" ? "Dashboard" : "Login"),
    ["A ternary in JSX picks between two trees.", "Parse the boolean first.", "isLoggedIn ? <Dashboard/> : <Login/>."],
    "The ternary is JSX's if/else expression — both branches are values, so it slots inline."),

  q("Logical AND Rendering", "Conditional Rendering", "Easy", ["React", "Conditional", "Gotchas"],
    "`{value && <Badge/>}` renders Badge only for truthy values — but 0 leaks as text! For each input line (a JSON value), print what renders: `Badge` for truthy, `(nothing)` for false/null/\"\"/undefined, or the leaked value for 0 and NaN.\n\n**Input:** one JSON value per line.\n**Output:** one render result per line.",
    ['true\n0\n""', "5\nfalse\nnull", '"hi"\n0'],
    (input) => input.split("\n").map((line) => { const v = JSON.parse(line); if (v) return "Badge"; if (v === 0) return "0"; return "(nothing)"; }).join("\n"),
    ["&& returns the left side when falsy.", "React skips false/null/'' but renders 0.", "Prefer `count > 0 &&` over `count &&`."],
    "React renders falsy `0` as the text \"0\" — the classic `&&` footgun. Guard with an explicit comparison."),

  q("Loading-Error-Data Machine", "Conditional Rendering", "Medium", ["React", "Conditional", "State Machine"],
    "Render by request state. Input JSON: `{\"loading\": boolean, \"error\": string|null, \"data\": array|null}`. Rules in priority: loading → `Spinner`; error → `Error: MESSAGE`; empty data array → `Empty list`; else → `N items`.\n\n**Input:** one JSON object.\n**Output:** one render line.",
    ['{"loading":true,"error":null,"data":null}', '{"loading":false,"error":"timeout","data":null}', '{"loading":false,"error":null,"data":[]}', '{"loading":false,"error":null,"data":[1,2,3]}'],
    (input) => { const s = JSON.parse(input); if (s.loading) return "Spinner"; if (s.error) return `Error: ${s.error}`; if (s.data && s.data.length === 0) return "Empty list"; return `${s.data.length} items`; },
    ["Order the guards by priority.", "Early returns keep it flat.", "Loading wins even if stale data exists."],
    "Async UIs are tiny state machines; guard-ordered early returns are the cleanest conditional-render shape."),

  q("Switch Case Router View", "Conditional Rendering", "Easy", ["React", "Conditional", "Views"],
    "Pick a view by tab name: `home`→`HomeView`, `profile`→`ProfileView`, `settings`→`SettingsView`, anything else→`NotFound`. Input: one tab name per line; print one view per line.\n\n**Input:** tab names.\n**Output:** view names.",
    ["home\nprofile", "settings\nbogus\nhome", "x"],
    (input) => { const views = { home: "HomeView", profile: "ProfileView", settings: "SettingsView" }; return input.split("\n").map((tab) => views[tab] ?? "NotFound").join("\n"); },
    ["A lookup object beats a switch here.", "?? supplies the default branch.", "Each view is just a value."],
    "An object map is the declarative switch: `views[tab] ?? <NotFound/>` — easy to extend, no fallthrough bugs."),

  q("Permission Gate", "Conditional Rendering", "Medium", ["React", "Conditional", "Auth"],
    "A `<Gate requires={...}>` renders children only when the user has every required permission. Input: line 1 — user permissions JSON array; line 2 — required permissions JSON array; line 3 — the children text. Print the children if allowed, else `403`.\n\n**Input:** three lines.\n**Output:** children or `403`.",
    ['["read","write"]\n["read"]\nSecret panel', '["read"]\n["read","admin"]\nAdmin page', '[]\n[]\nPublic'],
    (input) => { const [userLine, requiredLine, children] = input.split("\n"); const userPerms = new Set(JSON.parse(userLine)); const required = JSON.parse(requiredLine); return required.every((p) => userPerms.has(p)) ? children : "403"; },
    ["every() checks the full requirement list.", "A Set makes membership O(1).", "Empty requirements always pass."],
    "Authorization gates are conditional rendering with a predicate: `required.every(p => user.has(p))` guards the subtree."),

  /* ── Lists & Keys ─────────────────────────────────────────────── */
  q("Key Reconciliation Diff", "Lists & Keys", "Medium", ["React", "Keys", "Reconciliation"],
    "React diffs keyed lists. Input: two lines, old keys and new keys (JSON arrays of strings). Print three lines: `mounted: N` (keys only in new), `unmounted: N` (keys only in old), `kept: N` (keys in both).\n\n**Input:** two JSON arrays.\n**Output:** three labeled counts.",
    ['["a","b","c"]\n["b","c","d"]', '["x"]\n["x"]', '["a","b"]\n["c","d"]'],
    (input) => { const [oldLine, newLine] = input.split("\n"); const oldKeys = new Set(JSON.parse(oldLine)); const newKeys = new Set(JSON.parse(newLine)); let mounted = 0, unmounted = 0, kept = 0; for (const k of newKeys) { if (oldKeys.has(k)) kept++; else mounted++; } for (const k of oldKeys) if (!newKeys.has(k)) unmounted++; return `mounted: ${mounted}\nunmounted: ${unmounted}\nkept: ${kept}`; },
    ["Compare the key sets, not positions.", "Keys in both are reused (state survives).", "That reuse is why keys must be stable."],
    "Stable keys let React match elements across renders: matched keys keep their component instance and state; the rest mount/unmount."),

  q("Duplicate Key Detector", "Lists & Keys", "Easy", ["React", "Keys"],
    "Duplicate keys break reconciliation. Input: a JSON array of keys. Print `ok` if all unique, otherwise print the duplicated keys (first-seen order of duplication), comma-separated.\n\n**Input:** one JSON array.\n**Output:** `ok` or duplicate list.",
    ['["a","b","c"]', '["a","b","a","c","b"]', '["x","x","x"]'],
    (input) => { const seen = new Set(); const dups = []; for (const k of JSON.parse(input)) { if (seen.has(k) && !dups.includes(k)) dups.push(k); seen.add(k); } return dups.length ? dups.join(",") : "ok"; },
    ["Track seen keys in a Set.", "Record each duplicate once.", "React warns about exactly this in the console."],
    "Duplicate keys make React reuse the wrong instances — detecting them is a single pass with a Set."),

  q("Index-as-Key Bug", "Lists & Keys", "Medium", ["React", "Keys", "Bugs"],
    "Using array index as key breaks when prepending. Items carry editable state. Input: line 1 — JSON array of item names with state `{\"name\":..., \"draft\":...}`; line 2 — a new item name prepended with empty draft. With index keys, state sticks to positions! Print the resulting (name, draft) pairs as JSON after prepending with index keys.\n\n**Input:** two lines.\n**Output:** JSON array of `{name, draft}` showing the misalignment.",
    ['[{"name":"a","draft":"typing-a"},{"name":"b","draft":"typing-b"}]\nnew', '[{"name":"x","draft":"d1"}]\nfront'],
    (input) => { const nl = input.indexOf("\n"); const items = JSON.parse(input.slice(0, nl)); const newName = input.slice(nl + 1).trim(); const names = [newName, ...items.map((i) => i.name)]; const drafts = [...items.map((i) => i.draft), ""]; return J(names.map((name, idx) => ({ name, draft: drafts[idx] }))); },
    ["With index keys, state stays at its index.", "Prepending shifts names but not state.", "Stable ids as keys avoid the whole class of bug."],
    "Index keys bind state to positions: after a prepend, item 0's old draft appears under the NEW first item. That's the bug this exercise makes visible."),

  q("Stable Sort with Keys", "Lists & Keys", "Medium", ["React", "Keys", "Sorting"],
    "Sort a keyed list by value descending, preserving relative order of equal values (stable). Input: JSON array of `{\"key\": string, \"value\": number}`. Print the keys in render order as a JSON array.\n\n**Input:** one JSON array.\n**Output:** JSON array of keys.",
    ['[{"key":"a","value":2},{"key":"b","value":5},{"key":"c","value":2}]', '[{"key":"x","value":1},{"key":"y","value":1}]'],
    (input) => J(JSON.parse(input).sort((a, b) => b.value - a.value).map((item) => item.key)),
    ["Array.prototype.sort is stable in modern JS.", "Compare values descending.", "Equal items keep their input order."],
    "Since ES2019 `sort` is guaranteed stable — ties keep source order, so keyed rows don't swap unexpectedly."),

  q("Chunked Rows Renderer", "Lists & Keys", "Easy", ["React", "Lists"],
    "Render a flat list into rows of size k (last row may be short). Input: line 1 — k; line 2 — JSON array. Print one row per line: items joined by `|`.\n\n**Input:** two lines.\n**Output:** one row per line.",
    ['2\n["a","b","c","d","e"]', '3\n["x","y"]', '1\n["q","r"]'],
    (input) => { const nl = input.indexOf("\n"); const k = Number(input.slice(0, nl)); const items = JSON.parse(input.slice(nl + 1)); const rows = []; for (let i = 0; i < items.length; i += k) rows.push(items.slice(i, i + k).join("|")); return rows.join("\n"); },
    ["Slice in steps of k.", "The last slice can be shorter.", "Grids render exactly like this."],
    "Chunking with a stride-k loop turns a flat array into grid rows — the prep step before mapping rows to keyed components."),
];
