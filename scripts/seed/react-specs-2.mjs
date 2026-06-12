/**
 * React-topic questions, part 2 (32): forms, hooks, lifecycle, router,
 * API integration, context/state management, best practices, performance.
 */

const q = (title, category, difficulty, tags, statement, inputs, solve, hints, explanation) => ({
  title, category, difficulty, tags, statement, inputs, solve, hints, explanation,
});

const J = JSON.stringify;

export const REACT_SPECS_2 = [
  /* ── Forms & Controlled Components ────────────────────────────── */
  q("Form State Snapshot", "Forms & Controlled Components", "Easy", ["React", "Forms", "Controlled"],
    "A form holds field state. Events, one per line: `set FIELD VALUE`. Print the final form state as JSON with keys sorted.\n\n**Input:** event lines.\n**Output:** form state JSON.",
    ["set email a@b.c\nset name Ada\nset email x@y.z", "set q hello"],
    (input) => { const state = {}; for (const line of input.split("\n")) { const [, field, ...rest] = line.split(" "); state[field] = rest.join(" "); } return J(Object.fromEntries(Object.keys(state).sort().map((k) => [k, state[k]]))); },
    ["One state object, one onChange.", "Later sets overwrite earlier ones.", "Computed property names: {[field]: value}."],
    "The generic-handler pattern: `setForm(f => ({...f, [e.target.name]: e.target.value}))` — one handler for every field."),

  q("Form Validator", "Forms & Controlled Components", "Medium", ["React", "Forms", "Validation"],
    "Validate on submit. Input JSON: `{\"email\": string, \"password\": string}`. Rules: email must contain `@` and `.` → else `email invalid`; password length ≥ 8 → else `password too short`. Print each error on its own line (email first), or `submitted` when valid.\n\n**Input:** one JSON object.\n**Output:** errors or `submitted`.",
    ['{"email":"a@b.com","password":"longenough"}', '{"email":"nope","password":"longenough"}', '{"email":"bad","password":"short"}', '{"email":"a@b.c","password":"tiny"}'],
    (input) => { const { email, password } = JSON.parse(input); const errors = []; if (!email.includes("@") || !email.includes(".")) errors.push("email invalid"); if (password.length < 8) errors.push("password too short"); return errors.length ? errors.join("\n") : "submitted"; },
    ["Collect errors instead of returning at the first one.", "Order errors by field order.", "Submit only with an empty error list."],
    "Real forms report ALL problems at once — accumulate into an errors array and gate submission on its emptiness."),

  q("Checkbox Group State", "Forms & Controlled Components", "Easy", ["React", "Forms", "Checkboxes"],
    "A checkbox group toggles membership in a selection set. Input: one toggle per line (the option name). Print the final selection as a sorted JSON array.\n\n**Input:** toggle lines.\n**Output:** sorted JSON array.",
    ["red\nblue\nred", "a\nb\nc", "x\nx\nx"],
    (input) => { const selected = new Set(); for (const option of input.split("\n")) { if (selected.has(option)) selected.delete(option); else selected.add(option); } return J([...selected].sort()); },
    ["Toggling = add if absent, remove if present.", "A Set models the checked group.", "Odd toggle count = checked."],
    "Checkbox groups are set membership: each change event flips one element in/out of the selected set."),

  q("Serialize Form Data", "Forms & Controlled Components", "Medium", ["React", "Forms", "Submission"],
    "Build the submit payload. Input: line 1 — form state JSON; line 2 — JSON array of fields to include (in order). Print `field=value` pairs joined by `&` (URL-encode values with encodeURIComponent).\n\n**Input:** two lines.\n**Output:** the query string.",
    ['{"name":"Ada Lovelace","role":"eng","secret":"x"}\n["name","role"]', '{"q":"a&b=c"}\n["q"]'],
    (input) => { const nl = input.indexOf("\n"); const state = JSON.parse(input.slice(0, nl)); const fields = JSON.parse(input.slice(nl + 1)); return fields.map((f) => `${f}=${encodeURIComponent(state[f])}`).join("&"); },
    ["Only listed fields go out.", "encodeURIComponent protects & and =.", "Order comes from the field list."],
    "Submission is projection + encoding: pick the whitelisted fields and URL-encode each value so delimiters survive."),

  /* ── React Hooks ──────────────────────────────────────────────── */
  q("useState Simulator", "React Hooks", "Medium", ["React", "Hooks", "useState"],
    "Simulate useState across renders. Input: line 1 — initial value (number); following lines: `set N` (replace) or `fn +N`/`fn -N` (functional update). Print the state after EACH update, one per line.\n\n**Input:** initial then updates.\n**Output:** state after each update.",
    ["0\nset 5\nfn +3\nfn -2", "10\nfn +1\nfn +1", "7\nset 0"],
    (input) => { const lines = input.split("\n"); let state = Number(lines[0]); const out = []; for (const line of lines.slice(1)) { if (line.startsWith("set ")) state = Number(line.slice(4)); else { const delta = Number(line.slice(3)); state += delta; } out.push(String(state)); } return out.join("\n"); },
    ["set replaces; fn computes from previous.", "Print after every update (each causes a render).", "useState replaces — it doesn't merge objects."],
    "Unlike class setState, the useState setter REPLACES the value; functional form covers updates derived from the previous state."),

  q("useEffect Dependency Diff", "React Hooks", "Medium", ["React", "Hooks", "useEffect"],
    "An effect re-runs when any dependency changed (Object.is). Input: each line is a render's dependency array as JSON. Print `run` or `skip` per render (first render always runs).\n\n**Input:** one deps array per line.\n**Output:** run/skip per line.",
    ['[1,"a"]\n[1,"a"]\n[2,"a"]', "[5]\n[5]\n[5]", "[]\n[]\n[]", '[1]\n[2]\n[2]\n[1]'],
    (input) => { let prev = null; return input.split("\n").map((line) => { const deps = JSON.parse(line); const changed = prev === null || deps.length !== prev.length || deps.some((d, i) => !Object.is(d, prev[i])); prev = deps; return changed ? "run" : "skip"; }).join("\n"); },
    ["First render always runs the effect.", "Compare element-wise with Object.is.", "[] means run exactly once."],
    "React shallow-compares the deps array between renders; any `Object.is` mismatch schedules the effect. Empty deps → mount-only."),

  q("useMemo Cache Hits", "React Hooks", "Medium", ["React", "Hooks", "useMemo"],
    "useMemo recomputes only when deps change. Input: one line per render with the dep value (a single number). Print two lines: total computations, total cache hits.\n\n**Input:** one dep per line.\n**Output:** computations, then hits.",
    ["1\n1\n2\n2\n2", "3\n3\n3\n3", "1\n2\n3"],
    (input) => { let computes = 0, hits = 0, prev = null; for (const line of input.split("\n")) { const dep = Number(line); if (prev === null || dep !== prev) computes++; else hits++; prev = dep; } return `${computes}\n${hits}`; },
    ["Recompute on dep change, reuse otherwise.", "The first render always computes.", "useMemo trades memory for repeated work."],
    "`useMemo(fn, [dep])` caches one value keyed by the last deps — consecutive equal deps are pure cache hits."),

  q("Nearest Context Provider", "React Hooks", "Medium", ["React", "Hooks", "useContext"],
    "useContext reads the NEAREST provider above. Input: line 1 — JSON array of providers from root to the component, each `{\"value\": string}` (may be empty); line 2 — the default context value. Print what useContext returns.\n\n**Input:** two lines.\n**Output:** the context value.",
    ['[{"value":"dark"},{"value":"light"}]\nsystem', '[]\nsystem', '[{"value":"compact"}]\nfull'],
    (input) => { const nl = input.indexOf("\n"); const providers = JSON.parse(input.slice(0, nl)); const fallback = input.slice(nl + 1).trim(); return providers.length ? providers[providers.length - 1].value : fallback; },
    ["The last provider in the path is the nearest.", "No provider → the createContext default.", "Inner providers shadow outer ones."],
    "Context lookup walks up the tree and stops at the first provider — i.e. the LAST one on the root→component path."),

  q("Custom Hook: useToggleHistory", "React Hooks", "Hard", ["React", "Hooks", "Custom Hooks"],
    "Implement the logic of `useToggle(initial)` that also records history. Input: line 1 — initial boolean; line 2 — number of toggle calls. Print the full history as a JSON array of booleans (initial value included).\n\n**Input:** two lines.\n**Output:** JSON history array (length = toggles + 1).",
    ["false\n3", "true\n1", "false\n0"],
    (input) => { const [first, second] = input.split("\n"); let value = first.trim() === "true"; const history = [value]; const toggles = Number(second); for (let i = 0; i < toggles; i++) { value = !value; history.push(value); } return J(history); },
    ["Custom hooks are functions composing useState.", "Each toggle flips and appends.", "History length is toggles + 1."],
    "Custom hooks package state + transitions for reuse: this one wraps a boolean useState with a flip operation and an audit trail."),

  /* ── Component Lifecycle ──────────────────────────────────────── */
  q("Lifecycle Call Order", "Component Lifecycle", "Easy", ["React", "Lifecycle"],
    "Print the classic lifecycle for a sequence. Input: a JSON array of phases from `mount`, `update`, `unmount`. mount → `constructor`, `render`, `componentDidMount`; update → `render`, `componentDidUpdate`; unmount → `componentWillUnmount`. One method per line.\n\n**Input:** one JSON array.\n**Output:** method names in order.",
    ['["mount","update","unmount"]', '["mount"]', '["mount","update","update"]'],
    (input) => { const methods = { mount: ["constructor", "render", "componentDidMount"], update: ["render", "componentDidUpdate"], unmount: ["componentWillUnmount"] }; return JSON.parse(input).flatMap((phase) => methods[phase]).join("\n"); },
    ["Each phase expands to fixed methods.", "render runs on mount AND update.", "flatMap keeps it one-liner."],
    "Mount: constructor → render → componentDidMount. Updates re-render then notify. Unmount only cleans up."),

  q("Effect Cleanup Order", "Component Lifecycle", "Medium", ["React", "Lifecycle", "useEffect"],
    "An effect with a dep re-runs as: cleanup(old) THEN effect(new). Input: one dep value per line (first line mounts). Print the log: `effect V` on each run and `cleanup V` (previous value) before each re-run; end with `cleanup LAST` for unmount.\n\n**Input:** dep values, one per line.\n**Output:** the full log.",
    ["1\n2\n3", "7", "a\na\nb"],
    (input) => { const deps = input.split("\n"); const log = []; let prev = null; for (const dep of deps) { if (prev !== null && dep !== prev) { log.push(`cleanup ${prev}`); log.push(`effect ${dep}`); prev = dep; } else if (prev === null) { log.push(`effect ${dep}`); prev = dep; } } log.push(`cleanup ${prev}`); return log.join("\n"); },
    ["Cleanup always sees the OLD value.", "Unchanged deps skip both cleanup and effect.", "Unmount runs one final cleanup."],
    "Effects sandwich: old cleanup → new effect. The closure captured in the cleanup belongs to the previous render — hence `cleanup old, effect new`."),

  q("shouldComponentUpdate Gate", "Component Lifecycle", "Medium", ["React", "Lifecycle", "Performance"],
    "shouldComponentUpdate(next) returns whether to re-render — here: only when `next.value` differs from current. Input: a JSON array of incoming prop values over time (first is the mount value). Print the number of renders (mount included).\n\n**Input:** one JSON array.\n**Output:** render count.",
    ["[1,1,2,2,3]", '["a","a"]', "[9]"],
    (input) => { const values = JSON.parse(input); let renders = 0, current = null, first = true; for (const v of values) { if (first || v !== current) { renders++; current = v; first = false; } } return String(renders); },
    ["Mount always renders.", "Return false → skip the render.", "Same idea as React.memo for classes."],
    "`shouldComponentUpdate` is a manual bailout valve — returning false skips render & commit for that update entirely."),

  q("Batched State Updates", "Component Lifecycle", "Medium", ["React", "Lifecycle", "Batching"],
    "Inside one event handler, multiple setState calls batch into ONE render. Input: each line is one event handler containing space-separated deltas (e.g. `+1 +1 -2`). State starts at 0. Print two lines: final state and total render count (one per event line).\n\n**Input:** one handler per line.\n**Output:** final state, then render count.",
    ["+1 +1 +1", "+5 -2\n+1", "+1\n+1\n+1"],
    (input) => { const lines = input.split("\n"); let state = 0; for (const line of lines) for (const tok of line.split(" ")) state += Number(tok); return `${state}\n${lines.length}`; },
    ["All updates in one handler flush together.", "Renders count events, not setState calls.", "React 18 batches everywhere automatically."],
    "Batching coalesces every state update in a tick into a single render — three setStates in one click is still one paint."),

  /* ── React Router ─────────────────────────────────────────────── */
  q("Route Param Matcher", "React Router", "Medium", ["React", "Router", "Routing"],
    "Match a URL against a route pattern with `:params`. Input: line 1 — pattern (e.g. `/users/:id/posts/:postId`); line 2 — URL path. Print the params object as JSON if it matches (same segment count, literals equal), else `no match`.\n\n**Input:** two lines.\n**Output:** params JSON or `no match`.",
    ["/users/:id\n/users/42", "/users/:id/posts/:postId\n/users/7/posts/99", "/users/:id\n/products/3", "/a/:x\n/a/1/extra"],
    (input) => { const [pattern, url] = input.split("\n"); const pSegments = pattern.split("/").filter(Boolean); const uSegments = url.split("/").filter(Boolean); if (pSegments.length !== uSegments.length) return "no match"; const params = {}; for (let i = 0; i < pSegments.length; i++) { if (pSegments[i].startsWith(":")) params[pSegments[i].slice(1)] = uSegments[i]; else if (pSegments[i] !== uSegments[i]) return "no match"; } return J(params); },
    ["Split both paths into segments.", "`:name` captures; literals must equal.", "Different lengths can never match."],
    "Routers tokenize pattern and path: literal segments must match exactly, `:param` segments capture — exactly what useParams returns."),

  q("Best Route Wins", "React Router", "Medium", ["React", "Router", "Ranking"],
    "Pick the most specific matching route. Input: line 1 — JSON array of route patterns; line 2 — the URL. Among patterns that match (per the param rules), more literal segments = more specific; tie → earlier in the list. Print the winning pattern or `404`.\n\n**Input:** two lines.\n**Output:** a pattern or `404`.",
    ['["/users/:id","/users/new"]\n/users/new', '["/a/:x","/:y/b"]\n/a/b', '["/only"]\n/other'],
    (input) => { const nl = input.indexOf("\n"); const patterns = JSON.parse(input.slice(0, nl)); const url = input.slice(nl + 1).trim(); const uSegments = url.split("/").filter(Boolean); const matches = (pattern) => { const p = pattern.split("/").filter(Boolean); if (p.length !== uSegments.length) return -1; let score = 0; for (let i = 0; i < p.length; i++) { if (p[i].startsWith(":")) continue; if (p[i] !== uSegments[i]) return -1; score++; } return score; }; let best = null, bestScore = -1; for (const pattern of patterns) { const score = matches(pattern); if (score > bestScore) { bestScore = score; best = pattern; } } return bestScore >= 0 ? best : "404"; },
    ["Score matches by literal segment count.", "Static routes beat dynamic ones.", "Keep the first best on ties."],
    "Route ranking: `/users/new` (2 literals) outranks `/users/:id` (1) for `/users/new` — specificity beats listing order."),

  q("Query String Parser", "React Router", "Easy", ["React", "Router", "Search Params"],
    "Parse `useSearchParams` style queries. Input: a URL query string (no leading `?`), e.g. `a=1&b=hello&a=2` — repeated keys keep the LAST value; values are URL-decoded. Print the result as JSON with keys sorted.\n\n**Input:** one query string.\n**Output:** JSON object.",
    ["a=1&b=hello", "q=react%20router&page=2", "x=1&x=2&x=3", "single="],
    (input) => { const params = {}; for (const pair of input.trim().split("&")) { const eq = pair.indexOf("="); const key = pair.slice(0, eq); params[key] = decodeURIComponent(pair.slice(eq + 1)); } return J(Object.fromEntries(Object.keys(params).sort().map((k) => [k, params[k]]))); },
    ["Split on & then on the first =.", "decodeURIComponent handles %20.", "Later duplicates overwrite earlier ones."],
    "Query parsing is split-and-decode; defining last-wins for duplicates matches `Object.fromEntries(new URLSearchParams(s))`."),

  q("Nested Route Resolution", "React Router", "Medium", ["React", "Router", "Nesting"],
    "Nested routes render parent layouts around the child. Input: line 1 — JSON object mapping path → component for nested levels (e.g. `{\"/\": \"Root\", \"/shop\": \"ShopLayout\", \"/shop/items\": \"ItemList\"}`); line 2 — the URL. Print the render chain for every prefix that exists, outermost first, joined by ` > `.\n\n**Input:** two lines.\n**Output:** chain like `Root > ShopLayout > ItemList`.",
    ['{"/":"Root","/shop":"ShopLayout","/shop/items":"ItemList"}\n/shop/items', '{"/":"Root","/about":"About"}\n/about', '{"/":"Root"}\n/'],
    (input) => { const nl = input.indexOf("\n"); const routes = JSON.parse(input.slice(0, nl)); const url = input.slice(nl + 1).trim(); const segments = url.split("/").filter(Boolean); const prefixes = ["/"]; let acc = ""; for (const segment of segments) { acc += `/${segment}`; prefixes.push(acc); } return prefixes.filter((p) => routes[p]).map((p) => routes[p]).join(" > "); },
    ["Build every prefix of the URL.", "Each matching prefix contributes its component.", "That's <Outlet/> nesting."],
    "Nested routing renders one component per matched prefix — layouts wrap children exactly like the prefix chain of the URL."),

  /* ── API Integration ──────────────────────────────────────────── */
  q("Build the Request URL", "API Integration", "Easy", ["React", "API", "Fetch"],
    "Compose a GET URL. Input: line 1 — base URL; line 2 — params JSON object (skip null values; encode the rest; keys in JSON order). Print the final URL (no `?` if nothing survives).\n\n**Input:** two lines.\n**Output:** the URL.",
    ['https://api.dev/search\n{"q":"react hooks","page":2}', 'https://api.dev/all\n{"filter":null}', 'https://api.dev/x\n{}'],
    (input) => { const nl = input.indexOf("\n"); const base = input.slice(0, nl); const params = JSON.parse(input.slice(nl + 1)); const pairs = Object.entries(params).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`); return pairs.length ? `${base}?${pairs.join("&")}` : base; },
    ["Filter nulls before encoding.", "encodeURIComponent every value.", "No params → no question mark."],
    "URL building = filter → encode → join. Skipping null params avoids `?filter=null` style server confusion."),

  q("Paginated Response Walker", "API Integration", "Medium", ["React", "API", "Pagination"],
    "Sum items across pages. Input: a JSON array of page responses, each `{\"items\": number[], \"nextPage\": number|null}`. Follow pages in array order until nextPage is null (stop there — later array entries are unreachable). Print two lines: count of items consumed, and their sum.\n\n**Input:** one JSON array of pages.\n**Output:** count, then sum.",
    ['[{"items":[1,2],"nextPage":2},{"items":[3],"nextPage":null},{"items":[99],"nextPage":null}]', '[{"items":[5],"nextPage":null}]', '[{"items":[],"nextPage":null}]'],
    (input) => { const pages = JSON.parse(input); let count = 0, sum = 0; for (const page of pages) { count += page.items.length; sum += page.items.reduce((a, n) => a + n, 0); if (page.nextPage === null) break; } return `${count}\n${sum}`; },
    ["Stop at the first null nextPage.", "Accumulate while walking.", "Cursor pagination works the same way."],
    "Cursor/page walking: consume, check the continuation token, stop when it's null — items after the stop never load."),

  q("Stale Response Guard", "API Integration", "Hard", ["React", "API", "Race Conditions"],
    "Out-of-order responses cause stale UI. Requests get increasing ids; only the LATEST issued request may update state. Input: each line is `issue N` or `resolve N`. Print state changes: on each resolve, print `render N` if N is the latest issued id, else `ignore N`.\n\n**Input:** event lines.\n**Output:** one line per resolve.",
    ["issue 1\nissue 2\nresolve 1\nresolve 2", "issue 1\nresolve 1", "issue 1\nissue 2\nissue 3\nresolve 3\nresolve 2"],
    (input) => { let latest = 0; const out = []; for (const line of input.split("\n")) { const [op, idStr] = line.split(" "); const id = Number(idStr); if (op === "issue") latest = id; else out.push(id === latest ? `render ${id}` : `ignore ${id}`); } return out.join("\n"); },
    ["Track the latest request id.", "A resolve only renders if it IS the latest.", "In React: a cleanup flag or AbortController."],
    "The classic fetch race: slow request 1 resolving after request 2 must be dropped. Tagging requests and comparing on arrival is the guard."),

  q("Merge Cache and Fresh Data", "API Integration", "Medium", ["React", "API", "Caching"],
    "Merge cached items with a fresh response by id — fresh wins, order: all cached (updated in place), then new fresh items in response order. Input: two lines — cached JSON array and fresh JSON array of `{\"id\", \"v\"}`. Print the merged JSON array.\n\n**Input:** two JSON arrays.\n**Output:** merged JSON array.",
    ['[{"id":1,"v":"old"},{"id":2,"v":"keep"}]\n[{"id":1,"v":"new"},{"id":3,"v":"add"}]', '[]\n[{"id":9,"v":"x"}]', '[{"id":5,"v":"a"}]\n[]'],
    (input) => { const [cachedLine, freshLine] = input.split("\n"); const cached = JSON.parse(cachedLine); const fresh = JSON.parse(freshLine); const freshById = new Map(fresh.map((item) => [item.id, item])); const merged = cached.map((item) => freshById.get(item.id) ?? item); const cachedIds = new Set(cached.map((item) => item.id)); for (const item of fresh) if (!cachedIds.has(item.id)) merged.push(item); return J(merged); },
    ["Index fresh items by id.", "Update in place, append the rest.", "This is stale-while-revalidate's merge step."],
    "SWR-style merging keeps the UI stable: cached order is preserved with refreshed values, genuinely new entries append."),

  /* ── Context & State Management ───────────────────────────────── */
  q("Todo Reducer", "Context & State Management", "Medium", ["React", "Reducers", "useReducer"],
    "Implement a todo reducer. Actions, one JSON per line: `{\"type\":\"add\",\"text\":...}`, `{\"type\":\"toggle\",\"index\":N}`, `{\"type\":\"remove\",\"index\":N}`. State starts empty; ids are assigned 1,2,3... Print the final state as JSON array of `{id,text,done}`.\n\n**Input:** one action per line.\n**Output:** final todos JSON.",
    ['{"type":"add","text":"a"}\n{"type":"add","text":"b"}\n{"type":"toggle","index":0}', '{"type":"add","text":"x"}\n{"type":"remove","index":0}', '{"type":"add","text":"only"}'],
    (input) => { let todos = []; let nextId = 1; for (const line of input.split("\n")) { const action = JSON.parse(line); if (action.type === "add") todos = [...todos, { id: nextId++, text: action.text, done: false }]; else if (action.type === "toggle") todos = todos.map((t, i) => i === action.index ? { ...t, done: !t.done } : t); else if (action.type === "remove") todos = todos.filter((_, i) => i !== action.index); } return J(todos); },
    ["Each action returns NEW state.", "map/filter/spread keep it immutable.", "useReducer dispatches exactly these objects."],
    "Reducers are pure: (state, action) → new state. Immutable list ops (spread/map/filter) make every transition a fresh array."),

  q("Selector Recompute Count", "Context & State Management", "Medium", ["React", "Selectors", "Memoization"],
    "A memoized selector recomputes only when its input slice changes. Input: each line is a store snapshot JSON `{\"items\": number[], \"theme\": string}`; the selector depends ONLY on `items` (deep-equal by JSON). Print the recompute count.\n\n**Input:** one snapshot per line.\n**Output:** number of recomputes.",
    ['{"items":[1],"theme":"a"}\n{"items":[1],"theme":"b"}\n{"items":[1,2],"theme":"b"}', '{"items":[],"theme":"x"}\n{"items":[],"theme":"y"}\n{"items":[],"theme":"z"}'],
    (input) => { let computes = 0, prev = null; for (const line of input.split("\n")) { const slice = J(JSON.parse(line).items); if (slice !== prev) { computes++; prev = slice; } } return String(computes); },
    ["Compare only the selected slice.", "Theme changes must not recompute.", "createSelector in Redux works like this."],
    "Selectors decouple derived data from unrelated state: memoizing on the input slice means theme churn costs nothing."),

  q("Provider Override Chain", "Context & State Management", "Easy", ["React", "Context", "Providers"],
    "Multiple providers of the same context nest; the innermost wins per subtree. Input: a JSON array of `{\"depth\": number, \"value\": string}` providers on the path to a consumer (depth ascending). Print the value the consumer reads (or `default` if the array is empty).\n\n**Input:** one JSON array.\n**Output:** the winning value.",
    ['[{"depth":1,"value":"red"},{"depth":3,"value":"blue"}]', "[]", '[{"depth":2,"value":"solo"}]'],
    (input) => { const providers = JSON.parse(input); return providers.length ? providers[providers.length - 1].value : "default"; },
    ["Deepest provider wins.", "Empty path → createContext default.", "Sorted input means last element."],
    "Nested providers shadow outward ones — consumers always read the closest ancestor's value."),

  q("Action Log Auditor", "Context & State Management", "Medium", ["React", "Redux", "Middleware"],
    "A logging middleware records `TYPE: before -> after` for a counter store (actions: `increment`, `decrement`, `reset`). Input: one action type per line, counter starts at 0. Print the log lines.\n\n**Input:** action types.\n**Output:** one log line per action.",
    ["increment\nincrement\ndecrement", "reset", "increment\nreset\ndecrement"],
    (input) => { let state = 0; const out = []; for (const type of input.split("\n")) { const before = state; if (type === "increment") state++; else if (type === "decrement") state--; else if (type === "reset") state = 0; out.push(`${type}: ${before} -> ${state}`); } return out.join("\n"); },
    ["Capture state before dispatching.", "Apply the reducer, then log both.", "Middleware wraps dispatch exactly like this."],
    "Middleware sees each action with the state before and after the reducer — the foundation of redux-logger and the devtools."),

  /* ── React Best Practices ─────────────────────────────────────── */
  q("PropTypes Checker", "React Best Practices", "Medium", ["React", "Props", "Validation"],
    "Validate props against a type spec. Input: line 1 — spec JSON mapping prop → expected type (`\"string\"|\"number\"|\"boolean\"|\"array\"`); line 2 — props JSON. For each spec key (JSON order) with a wrong or missing prop, print `Warning: PROP expected TYPE`. Print `ok` if all pass.\n\n**Input:** two lines.\n**Output:** warnings or `ok`.",
    ['{"name":"string","count":"number"}\n{"name":"Ada","count":3}', '{"name":"string","tags":"array"}\n{"name":42,"tags":[]}', '{"on":"boolean"}\n{}'],
    (input) => { const nl = input.indexOf("\n"); const spec = JSON.parse(input.slice(0, nl)); const props = JSON.parse(input.slice(nl + 1)); const typeOf = (v) => Array.isArray(v) ? "array" : typeof v; const warnings = Object.entries(spec).filter(([key, type]) => !(key in props) || typeOf(props[key]) !== type).map(([key, type]) => `Warning: ${key} expected ${type}`); return warnings.length ? warnings.join("\n") : "ok"; },
    ["Check presence first, then type.", "Arrays need Array.isArray, not typeof.", "This is what prop-types does in dev mode."],
    "Runtime prop validation catches integration bugs early — TypeScript replaces it statically, but the checking logic is identical."),

  q("Lift State Up", "React Best Practices", "Easy", ["React", "State", "Architecture"],
    "Two sibling inputs must stay in sync — so state lives in the parent. Input: events `left V` or `right V` (one per line) each setting the shared value. Print the value BOTH siblings display after all events, as `left=V right=V`.\n\n**Input:** event lines.\n**Output:** one line: `left=V right=V`.",
    ["left 5\nright 9", "left hello", "right 1\nleft 2\nright 3"],
    (input) => { let shared = ""; for (const line of input.split("\n")) { const space = line.indexOf(" "); shared = line.slice(space + 1); } return `left=${shared} right=${shared}`; },
    ["One owner, two readers.", "Either child can update via a callback.", "Both always render the same value."],
    "Lifting state to the closest common ancestor is THE React data-flow move: one source of truth, props down, callbacks up."),

  q("Find the Impure Component", "React Best Practices", "Medium", ["React", "Purity"],
    "Pure components return identical output for identical props. Input: a JSON array of render records `{\"component\": string, \"props\": string, \"output\": string}`. Print components that returned DIFFERENT outputs for the same props (sorted, unique), or `all pure`.\n\n**Input:** one JSON array.\n**Output:** offender names or `all pure`.",
    ['[{"component":"A","props":"x","output":"1"},{"component":"A","props":"x","output":"2"},{"component":"B","props":"y","output":"3"}]', '[{"component":"C","props":"p","output":"same"},{"component":"C","props":"p","output":"same"}]'],
    (input) => { const seen = new Map(); const impure = new Set(); for (const r of JSON.parse(input)) { const key = `${r.component} ${r.props}`; if (seen.has(key) && seen.get(key) !== r.output) impure.add(r.component); seen.set(key, seen.get(key) ?? r.output); } return impure.size ? [...impure].sort().join(",") : "all pure"; },
    ["Group records by component + props.", "Differing outputs for one group = impurity.", "Purity is what makes memoization safe."],
    "Same props → same output is the contract that enables memo, concurrent rendering and time-slicing; violations show up as flaky UI."),

  /* ── Debugging & Performance ──────────────────────────────────── */
  q("Wasted Render Detector", "Debugging & Performance", "Medium", ["React", "Performance", "Profiling"],
    "A render is WASTED when a component re-renders with identical props (JSON-equal). Input: a JSON array of render events `{\"component\": string, \"props\": object}` in time order. Print the number of wasted renders.\n\n**Input:** one JSON array.\n**Output:** wasted count.",
    ['[{"component":"List","props":{"n":1}},{"component":"List","props":{"n":1}},{"component":"List","props":{"n":2}}]', '[{"component":"A","props":{}},{"component":"B","props":{}},{"component":"A","props":{}}]', '[{"component":"X","props":{"v":1}}]'],
    (input) => { const lastProps = new Map(); let wasted = 0; for (const event of JSON.parse(input)) { const propsJson = J(event.props); if (lastProps.get(event.component) === propsJson) wasted++; lastProps.set(event.component, propsJson); } return String(wasted); },
    ["Track each component's previous props.", "Identical consecutive props = wasted.", "React DevTools Profiler highlights these."],
    "Wasted renders do work without changing output — finding repeat-prop renders is exactly what the Profiler's 'why did this render' answers."),

  q("Virtual List Window", "Debugging & Performance", "Medium", ["React", "Performance", "Virtualization"],
    "Windowing renders only visible rows plus overscan. Input: one line of 5 space-separated integers: totalItems rowHeight viewportHeight scrollTop overscan. Print `start..end` (inclusive 0-based indexes of rendered rows, clamped to the list).\n\n**Input:** five integers.\n**Output:** `start..end`.",
    ["1000 20 100 0 2", "1000 20 100 400 2", "10 20 100 0 3", "50 25 100 1200 1"],
    (input) => { const [total, rowH, viewH, scrollTop, overscan] = input.split(" ").map(Number); const first = Math.floor(scrollTop / rowH); const visible = Math.ceil(viewH / rowH); const start = Math.max(0, first - overscan); const end = Math.min(total - 1, first + visible - 1 + overscan); return `${start}..${end}`; },
    ["First visible = floor(scrollTop / rowHeight).", "Visible count = ceil(viewport / rowHeight).", "Clamp both ends and add overscan."],
    "Virtualization math: from scroll position derive the visible index range, pad with overscan, clamp — 1000 rows become ~10 DOM nodes."),

  q("Memo Boundary Render Count", "Debugging & Performance", "Hard", ["React", "Performance", "Memo"],
    "App → Header(memo, props: title) and List(props: items). Each input line is a state change with the props it produces: `TITLE ITEMS_JSON`. App re-renders every line; Header re-renders only when title changes; List re-renders every time (no memo). After all lines print three lines: `App: N`, `Header: N`, `List: N`.\n\n**Input:** one `title itemsJson` per line.\n**Output:** three render counts.",
    ['home [1]\nhome [1,2]\nabout [1,2]', 'a []\na []\na []', 'x [9]'],
    (input) => { const lines = input.split("\n"); let header = 0; let prevTitle = null; for (const line of lines) { const title = line.split(" ")[0]; if (title !== prevTitle) { header++; prevTitle = title; } } return `App: ${lines.length}\nHeader: ${header}\nList: ${lines.length}`; },
    ["Unmemoized children render with their parent.", "memo gates on changed props only.", "Count title transitions for Header."],
    "memo creates a render boundary: parent churn passes through to unmemoized children but stops at memoized ones with stable props."),

  q("Expensive Calc Budget", "Debugging & Performance", "Easy", ["React", "Performance"],
    "Each render either recomputes an expensive value (cost c ms) or reuses a memo (cost 0). Input: line 1 — c; line 2 — JSON array of dep values per render. Print total ms spent with memoization, then ms WITHOUT memoization (recompute every render), as two lines.\n\n**Input:** two lines.\n**Output:** memoized total, unmemoized total.",
    ["10\n[1,1,1,2]", "5\n[1,2,3]", "100\n[7,7,7,7,7]"],
    (input) => { const nl = input.indexOf("\n"); const cost = Number(input.slice(0, nl)); const deps = JSON.parse(input.slice(nl + 1)); let computes = 0, prev = null; for (const dep of deps) { if (prev === null || dep !== prev) computes++; prev = dep; } return `${computes * cost}\n${deps.length * cost}`; },
    ["Count dep transitions for the memo cost.", "Unmemoized cost is renders × c.", "The gap is what useMemo buys you."],
    "Quantifying memoization: cost scales with dep CHANGES instead of renders — the difference is the saved main-thread time."),
];
