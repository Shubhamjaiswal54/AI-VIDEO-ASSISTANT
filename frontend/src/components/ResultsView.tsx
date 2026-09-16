import { useState } from "react";
import type { PipelineResult } from "../api";
import ChatPanel from "./ChatPanel";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "actions", label: "Action Items" },
  { id: "decisions", label: "Key Decisions" },
  { id: "questions", label: "Open Questions" },
  { id: "transcript", label: "Transcript" },
  { id: "chat", label: "Chat" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ListBlock({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return <p className="text-sm italic text-[var(--color-text-dim)]">{empty}</p>;
  }
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="font-mono text-[var(--color-signal)] shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-[var(--color-text)]">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ResultsView({ result, jobId, onReset }: { result: PipelineResult; jobId: string; onReset: () => void }) {
  const [tab, setTab] = useState<TabId>("summary");

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-signal)] mb-2">
            Analysis complete
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold leading-tight max-w-xl">
            {result.title}
          </h1>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 text-xs font-mono text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-full px-4 py-2 hover:text-[var(--color-text)] hover:border-[var(--color-signal)]/40 transition-colors"
        >
          New analysis
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-[var(--color-signal)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 min-h-[280px]">
        {tab === "summary" && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-text)]">{result.summary}</p>
        )}
        {tab === "actions" && <ListBlock items={result.action_items} empty="No action items found." />}
        {tab === "decisions" && <ListBlock items={result.key_decisions} empty="No key decisions found." />}
        {tab === "questions" && <ListBlock items={result.open_questions} empty="No open questions found." />}
        {tab === "transcript" && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--color-text-dim)] max-h-[420px] overflow-y-auto leading-relaxed">
            {result.transcript}
          </pre>
        )}
        {tab === "chat" && <ChatPanel jobId={jobId} />}
      </div>
    </div>
  );
}
