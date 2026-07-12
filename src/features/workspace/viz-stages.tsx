"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  ArrayVisualization,
  ArrayStep,
  CellState,
  GridVisualization,
  ListVisualization,
  GraphVisualization,
} from "@/lib/visualization";

// State → colours. Div-based structures use classes; SVG nodes use fill classes.
const CELL_CLASS: Record<CellState, string> = {
  default: "bg-primary/10 text-foreground",
  active: "bg-primary text-primary-foreground",
  compare: "bg-amber-400 text-amber-950",
  swap: "bg-violet-500 text-white",
  visited: "bg-sky-400 text-sky-950",
  done: "bg-emerald-500 text-white",
};
const NODE_FILL: Record<CellState, string> = {
  default: "fill-primary/15",
  active: "fill-primary",
  compare: "fill-amber-400",
  swap: "fill-violet-500",
  visited: "fill-sky-400",
  done: "fill-emerald-500",
};
const STATE_LABEL: Record<CellState, string> = {
  default: "idle",
  active: "current",
  compare: "comparing",
  swap: "swapping",
  visited: "visited",
  done: "done",
};

/** Legend of the states actually used across the frames. */
export function Legend({ states }: { states: Set<CellState> }) {
  const used = (["active", "compare", "swap", "visited", "done"] as CellState[]).filter((s) => states.has(s));
  if (!used.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-2 text-[10px] text-muted-foreground">
      {used.map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className={cn("size-2.5 rounded-sm", CELL_CLASS[s].split(" ")[0])} />
          {STATE_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

function arrayCellState(step: ArrayStep, i: number): CellState {
  if (step.states && step.states[i]) return step.states[i];
  return step.highlight.includes(i) ? "compare" : "default";
}

export function ArrayStage({ viz, cur }: { viz: ArrayVisualization; cur: number }) {
  const step = viz.steps[Math.min(cur, viz.steps.length - 1)];
  const numeric = step.array.every((v) => typeof v === "number");
  const maxAbs = Math.max(1, ...step.array.map((v) => (typeof v === "number" ? Math.abs(v) : 0)));
  return (
    <div className="flex min-h-44 items-end justify-center gap-1.5 overflow-x-auto rounded-md bg-muted/20 p-3">
      {step.array.map((val, i) => {
        const state = arrayCellState(step, i);
        const ptrs = step.pointers.filter((p) => p.index === i);
        const h = numeric ? 24 + (Math.abs(Number(val)) / maxAbs) * 110 : 44;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex h-4 items-end gap-0.5">
              {ptrs.map((p) => (
                <span key={p.label} className="rounded bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
                  {p.label}
                </span>
              ))}
            </div>
            <motion.div
              layout
              animate={{ height: h }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={cn("flex w-8 items-start justify-center rounded-md pt-1 text-[11px] font-semibold tabular-nums", CELL_CLASS[state])}
              style={{ height: h }}
            >
              {String(val)}
            </motion.div>
            <span className="text-[9px] text-muted-foreground">{i}</span>
          </div>
        );
      })}
    </div>
  );
}

export function GridStage({ viz, cur }: { viz: GridVisualization; cur: number }) {
  const step = viz.steps[Math.min(cur, viz.steps.length - 1)];
  const cols = Math.max(...step.grid.map((r) => r.length));
  return (
    <div className="flex min-h-44 items-center justify-center overflow-auto rounded-md bg-muted/20 p-3">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 2rem))` }}>
        {step.grid.flatMap((row, r) =>
          row.map((val, c) => {
            const state = step.states?.[r]?.[c] ?? "default";
            return (
              <motion.div
                key={`${r}-${c}`}
                layout
                className={cn("flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold tabular-nums transition-colors", CELL_CLASS[state])}
              >
                {String(val)}
              </motion.div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ListStage({ viz, cur }: { viz: ListVisualization; cur: number }) {
  const step = viz.steps[Math.min(cur, viz.steps.length - 1)];
  return (
    <div className="flex min-h-44 items-center overflow-x-auto rounded-md bg-muted/20 p-3">
      <div className="flex items-center gap-0.5">
        {step.values.map((val, i) => {
          const state = step.states?.[i] ?? "default";
          const ptrs = step.pointers.filter((p) => p.index === i);
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-4 items-end gap-0.5">
                  {ptrs.map((p) => (
                    <span key={p.label} className="rounded bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">{p.label}</span>
                  ))}
                </div>
                <motion.div
                  layout
                  className={cn("flex size-10 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-colors", CELL_CLASS[state])}
                >
                  {String(val)}
                </motion.div>
                <span className="h-2" />
              </div>
              {i < step.values.length - 1 && <span className="mx-0.5 text-muted-foreground">→</span>}
            </div>
          );
        })}
        <span className="ml-1 text-[10px] text-muted-foreground">∅</span>
      </div>
    </div>
  );
}

/** Compute node positions in [0,1]² for either a circle or a top-down tree. */
function layoutGraph(viz: GraphVisualization): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const n = viz.nodes.length;
  if (viz.layout === "circle") {
    viz.nodes.forEach((node, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pos.set(node.id, { x: 0.5 + 0.4 * Math.cos(a), y: 0.5 + 0.42 * Math.sin(a) });
    });
    return pos;
  }
  // tree: BFS levels from a root (a node with no incoming edge, else the first).
  const adj = new Map<string, string[]>();
  viz.nodes.forEach((nd) => adj.set(nd.id, []));
  const indeg = new Map<string, number>(viz.nodes.map((nd) => [nd.id, 0]));
  for (const e of viz.edges) {
    adj.get(e.from)?.push(e.to);
    if (!viz.directed) adj.get(e.to)?.push(e.from);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const root = viz.nodes.find((nd) => (indeg.get(nd.id) ?? 0) === 0)?.id ?? viz.nodes[0].id;
  const level = new Map<string, number>();
  const q = [root];
  level.set(root, 0);
  while (q.length) {
    const id = q.shift()!;
    for (const nb of adj.get(id) ?? []) {
      if (!level.has(nb)) { level.set(nb, (level.get(id) ?? 0) + 1); q.push(nb); }
    }
  }
  let maxLvl = 0;
  const byLevel = new Map<number, string[]>();
  for (const nd of viz.nodes) {
    const lv = level.get(nd.id) ?? Infinity;
    maxLvl = Math.max(maxLvl, Number.isFinite(lv) ? lv : 0);
  }
  // unreached nodes go on their own bottom row
  const orphanLvl = maxLvl + 1;
  for (const nd of viz.nodes) {
    const lv = Number.isFinite(level.get(nd.id)) ? (level.get(nd.id) as number) : orphanLvl;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(nd.id);
  }
  const depth = Math.max(maxLvl, ...byLevel.keys());
  for (const [lv, ids] of byLevel) {
    ids.forEach((id, i) => {
      pos.set(id, { x: (i + 1) / (ids.length + 1), y: (lv + 1) / (depth + 2) });
    });
  }
  return pos;
}

export function GraphStage({ viz, cur }: { viz: GraphVisualization; cur: number }) {
  const step = viz.steps[Math.min(cur, viz.steps.length - 1)];
  const pos = layoutGraph(viz);
  const W = 340, H = 200, R = 15;
  const px = (x: number) => 16 + x * (W - 32);
  const py = (y: number) => 16 + y * (H - 32);
  const activeSet = new Set((step.activeEdges ?? []).map(([a, b]) => `${a}::${b}`));
  const isActive = (a: string, b: string) => activeSet.has(`${a}::${b}`) || (!viz.directed && activeSet.has(`${b}::${a}`));

  return (
    <div className="flex min-h-44 items-center justify-center rounded-md bg-muted/20 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full max-h-56 w-full">
        <defs>
          <marker id="viz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
        </defs>
        {viz.edges.map((e, i) => {
          const a = pos.get(e.from), b = pos.get(e.to);
          if (!a || !b) return null;
          const on = isActive(e.from, e.to);
          return (
            <line
              key={i}
              x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
              className={cn(on ? "stroke-primary" : "stroke-border")}
              strokeWidth={on ? 2.5 : 1.5}
              markerEnd={viz.directed ? "url(#viz-arrow)" : undefined}
            />
          );
        })}
        {viz.nodes.map((nd) => {
          const p = pos.get(nd.id);
          if (!p) return null;
          const state = step.states?.[nd.id] ?? "default";
          return (
            <g key={nd.id}>
              <motion.circle
                cx={px(p.x)} cy={py(p.y)} r={R}
                className={cn(NODE_FILL[state], "stroke-background")} strokeWidth={2}
                initial={false}
                animate={{ scale: state === "active" ? 1.12 : 1 }}
                style={{ transformOrigin: `${px(p.x)}px ${py(p.y)}px` }}
              />
              <text x={px(p.x)} y={py(p.y) + 3.5} textAnchor="middle" className={cn("text-[10px] font-semibold", state === "default" ? "fill-foreground" : "fill-white")}>
                {nd.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
