"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal rich-text editor for the newsletter composer. Produces a small,
 * email-safe subset of HTML (bold/italic/underline, H2/H3, lists, quote,
 * links) via the browser's editing commands. The server re-sanitizes the
 * output with an allowlist before sending, so this is a convenience layer only.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your newsletter…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external changes (e.g. AI-generated draft) into the DOM without
  // clobbering the caret while the admin is typing.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (url && /^https?:\/\//i.test(url)) exec("createLink", url);
  }

  const tools: { label: string; title: string; run: () => void; className?: string }[] = [
    { label: "B", title: "Bold", run: () => exec("bold"), className: "font-bold" },
    { label: "I", title: "Italic", run: () => exec("italic"), className: "italic" },
    { label: "U", title: "Underline", run: () => exec("underline"), className: "underline" },
    { label: "H2", title: "Heading", run: () => exec("formatBlock", "h2") },
    { label: "H3", title: "Subheading", run: () => exec("formatBlock", "h3") },
    { label: "❝", title: "Quote", run: () => exec("formatBlock", "blockquote") },
    { label: "• List", title: "Bullet list", run: () => exec("insertUnorderedList") },
    { label: "1. List", title: "Numbered list", run: () => exec("insertOrderedList") },
    { label: "Link", title: "Insert link", run: addLink },
    { label: "Clear", title: "Clear formatting", run: () => exec("removeFormat") },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className={cn(
              "rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
              t.className,
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Newsletter body"
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="rte-body min-h-52 max-h-[28rem] overflow-y-auto px-4 py-3 text-sm leading-relaxed outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
      />
      <style>{`.rte-body:empty:before{content:attr(data-placeholder);color:#9ca3af;}`}</style>
    </div>
  );
}
