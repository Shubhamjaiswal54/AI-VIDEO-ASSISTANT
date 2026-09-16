import { useState, useRef, useEffect } from "react";
import { askQuestion } from "../api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({ jobId }: { jobId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const { answer } = await askQuestion(jobId, question);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[420px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.length === 0 && (
          <p className="text-sm italic text-[var(--color-text-dim)]">
            Ask anything about the content — e.g. "What did we decide about the launch date?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--color-signal)] text-black"
                  : "bg-[var(--color-panel-soft)] border border-[var(--color-border)] text-[var(--color-text)]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2.5 bg-[var(--color-panel-soft)] border border-[var(--color-border)] text-sm text-[var(--color-text-dim)]">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-xl bg-[var(--color-panel-soft)] border border-[var(--color-border)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-signal)]/60 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[var(--color-signal)] text-black font-medium px-4 text-sm disabled:opacity-30 hover:bg-[var(--color-signal-dim)] transition-opacity"
        >
          Send
        </button>
      </form>
    </div>
  );
}
