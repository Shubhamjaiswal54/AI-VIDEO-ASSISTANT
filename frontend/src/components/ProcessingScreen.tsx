import Waveform from "./Waveform";

const STEP_LABELS: Record<string, string> = {
  queued: "Queued",
  preparing: "Downloading & preparing audio",
  transcribing: "Transcribing speech to text",
  extracting: "Extracting insights",
  indexing: "Building chat index",
  done: "Done",
};

const ORDER = ["queued", "preparing", "transcribing", "extracting", "indexing"];

export default function ProcessingScreen({ step }: { step: string | null }) {
  const currentIndex = Math.max(0, ORDER.indexOf(step ?? "queued"));

  return (
    <div className="w-full max-w-md mx-auto text-center py-10">
      <Waveform className="mx-auto mb-8" />
      <h2 className="font-display text-xl font-semibold mb-1">Processing your content</h2>
      <p className="text-sm text-[var(--color-text-dim)] mb-8">
        This can take a few minutes depending on length.
      </p>

      <div className="space-y-3 text-left">
        {ORDER.slice(1).map((s, i) => {
          const stepIdx = i + 1;
          const active = stepIdx === currentIndex;
          const complete = stepIdx < currentIndex;
          return (
            <div
              key={s}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                active
                  ? "border-[var(--color-signal)]/50 bg-[var(--color-signal)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-panel)]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  complete
                    ? "bg-[var(--color-signal)]"
                    : active
                      ? "bg-[var(--color-signal)] animate-pulse"
                      : "bg-[var(--color-border)]"
                }`}
              />
              <span
                className={`text-sm font-mono ${
                  active || complete ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
              {complete && <span className="ml-auto text-[var(--color-signal)] text-xs">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
