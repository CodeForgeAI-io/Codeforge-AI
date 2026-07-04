"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer,
  useSandpackShellStdout,
} from "@codesandbox/sandpack-react";
import { Layers, Plus, Terminal, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type WebTemplate = "static" | "react" | "react-tailwind" | "nextjs";

const META: Record<WebTemplate, {
  label: string;
  sandpack: "static" | "react" | "nextjs";
  deps: boolean;
  node: boolean;
  tailwind?: boolean;
}> = {
  static: { label: "HTML / CSS / JS", sandpack: "static", deps: false, node: false },
  react: { label: "React", sandpack: "react", deps: true, node: false },
  "react-tailwind": { label: "React + Tailwind", sandpack: "react", deps: true, node: false, tailwind: true },
  nextjs: { label: "Next.js", sandpack: "nextjs", deps: true, node: true },
};

/** Starter files per template. Sandpack fills the rest from its template. */
const STARTERS: Record<WebTemplate, Record<string, string>> = {
  static: {
    "/index.html": `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Playground</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1 id="title">Hello, web!</h1>
    <button id="btn">Click me</button>
    <script src="script.js"></script>
  </body>
</html>
`,
    "/styles.css": `body { font-family: system-ui, sans-serif; display: grid; place-items: center; height: 100vh; margin: 0; gap: 1rem; }
button { padding: .6rem 1.2rem; border: 0; border-radius: 8px; background: #006bff; color: #fff; font-size: 1rem; cursor: pointer; }
`,
    "/script.js": `let n = 0;
document.getElementById("btn").addEventListener("click", () => {
  n++;
  document.getElementById("title").textContent = "Clicked " + n + " times";
});
`,
  },
  react: {
    "/App.js": `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", height: "100vh", gap: "1rem" }}>
      <h1>React count: {count}</h1>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
`,
  },
  "react-tailwind": {
    "/App.js": `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="grid h-screen place-items-center gap-4 font-sans">
      <h1 className="text-3xl font-bold">Tailwind count: {count}</h1>
      <button
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={() => setCount((c) => c + 1)}
      >
        Increment
      </button>
    </div>
  );
}
`,
  },
  nextjs: {
    "/pages/index.js": `import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);
  return (
    <main style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", height: "100vh", gap: "1rem" }}>
      <h1>Next.js count: {count}</h1>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <p style={{ color: "#888" }}>Edit pages/index.js and save — the dev server hot-reloads.</p>
    </main>
  );
}
`,
  },
};

export function WebCompiler() {
  const { resolvedTheme } = useTheme();
  const [template, setTemplate] = useState<WebTemplate>("static");
  const [deps, setDeps] = useState<Record<string, string>>({});
  const [depInput, setDepInput] = useState("");
  const meta = META[template];

  function changeTemplate(next: string) {
    setTemplate(next as WebTemplate);
    setDeps({});
    setDepInput("");
  }

  function addDep() {
    const raw = depInput.trim().replace(/\s+/g, "");
    if (!raw) return;
    // support "name" or "name@version"; scoped packages keep their leading @
    const at = raw.lastIndexOf("@");
    const hasVersion = at > 0;
    const name = hasVersion ? raw.slice(0, at) : raw;
    const version = hasVersion ? raw.slice(at + 1) : "latest";
    if (!name) return;
    setDeps((d) => ({ ...d, [name]: version }));
    setDepInput("");
  }

  function removeDep(name: string) {
    setDeps((d) => {
      const next = { ...d };
      delete next[name];
      return next;
    });
  }

  // Remount Sandpack when the template or dependency set changes so it
  // re-installs and re-bundles from a clean slate.
  const providerKey = `${template}:${Object.entries(deps).sort().map(([k, v]) => `${k}@${v}`).join(",")}`;

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <Terminal className="size-4 shrink-0 text-muted-foreground" />
        <Select value={template} onValueChange={changeTemplate}>
          <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(META) as WebTemplate[]).map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{META[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {meta.deps && (
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <Layers className="size-3.5 shrink-0 text-muted-foreground" />
            <form
              onSubmit={(e) => { e.preventDefault(); addDep(); }}
              className="flex items-center gap-1"
            >
              <Input
                value={depInput}
                onChange={(e) => setDepInput(e.target.value)}
                placeholder="add npm package (e.g. axios or axios@1.7)"
                className="h-7 w-64 text-xs"
                spellCheck={false}
              />
              <Button type="submit" size="icon" variant="outline" className="size-7" title="Add dependency">
                <Plus className="size-3.5" />
              </Button>
            </form>
            {Object.entries(deps).map(([name, version]) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] font-mono">
                {name}@{version}
                <button type="button" onClick={() => removeDep(name)} className="text-muted-foreground hover:text-destructive">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
          {meta.node ? "Runs on an in-browser Node server" : "Live preview · auto-refresh"}
        </span>
      </div>

      {/* sandpack workspace */}
      <div className="min-h-0 flex-1">
        <SandpackProvider
          key={providerKey}
          template={meta.sandpack}
          files={STARTERS[template]}
          customSetup={meta.deps ? { dependencies: deps } : undefined}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          options={{
            externalResources: meta.tailwind ? ["https://cdn.tailwindcss.com"] : [],
            autorun: true,
            recompileMode: "delayed",
            recompileDelay: 600,
          }}
        >
          <SandpackLayout style={{ height: "100%", borderRadius: 0, border: 0 }}>
            {meta.node && (
              <SandpackFileExplorer style={{ height: "100%", minWidth: 170, maxWidth: 220 }} />
            )}
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
              closableTabs={meta.node}
              style={{ height: "100%", minWidth: "38%" }}
            />
            <div style={{ height: "100%", minWidth: "34%" }} className="flex flex-col">
              <SandpackPreview
                style={{ flex: 7, minHeight: 0 }}
                showOpenInCodeSandbox={false}
                showNavigator={meta.node}
              />
              {meta.node ? <ShellTerminal /> : (
                <SandpackConsole
                  style={{ flex: 3, minHeight: 0 }}
                  resetOnPreviewRestart
                />
              )}
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}

/** A terminal-style panel that streams the in-browser Node dev server output
 *  (used for the Next.js template). */
function ShellTerminal() {
  const { logs } = useSandpackShellStdout({ maxMessageCount: 400, resetOnPreviewRestart: true });
  const text = logs.map((l) => l.data).join("");
  return (
    <div style={{ flex: 3, minHeight: 0 }} className="flex flex-col border-t bg-[#0a0a0f]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
        <Terminal className="size-3.5 text-white/60" />
        <span className="text-[11px] font-medium text-white/70">Terminal</span>
      </div>
      <pre className={cn(
        "flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-green-300 whitespace-pre-wrap break-all",
      )}>
        {text || "Starting the Node dev server…"}
      </pre>
    </div>
  );
}
