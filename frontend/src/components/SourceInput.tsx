import { useRef, useState } from "react";
import Waveform from "./Waveform";

interface Props {
  onSubmitUrl: (url: string) => void;
  onSubmitFile: (file: File) => void;
  disabled: boolean;
}

export default function SourceInput({ onSubmitUrl, onSubmitFile, disabled }: Props) {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "url" && url.trim()) onSubmitUrl(url.trim());
    if (mode === "file" && file) onSubmitFile(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-1 mb-6 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] p-1 w-fit mx-auto">
        {(["url", "file"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? "bg-[var(--color-signal)] text-black"
                : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            }`}
          >
            {m === "url" ? "YouTube URL" : "Upload file"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "url" ? (
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={disabled}
              className="w-full rounded-2xl bg-[var(--color-panel)] border border-[var(--color-border)] px-5 py-4 pr-32 text-base font-mono placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-signal)]/60 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className="absolute right-2 top-2 bottom-2 rounded-xl bg-[var(--color-signal)] text-black font-display font-semibold px-5 text-sm disabled:opacity-30 transition-opacity hover:bg-[var(--color-signal-dim)]"
            >
              Analyze →
            </button>
          </div>
        ) : (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragOver
                  ? "border-[var(--color-signal)] bg-[var(--color-signal)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-panel)]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="font-display text-sm text-[var(--color-text)]">
                {file ? file.name : "Drop an audio or video file, or click to browse"}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1 font-mono">
                MP3, WAV, MP4, MOV, M4A, WEBM
              </p>
            </div>
            <button
              type="submit"
              disabled={disabled || !file}
              className="mt-3 w-full rounded-xl bg-[var(--color-signal)] text-black font-display font-semibold py-3 text-sm disabled:opacity-30 transition-opacity hover:bg-[var(--color-signal-dim)]"
            >
              Analyze →
            </button>
          </div>
        )}
      </form>

      <div className="mt-10 flex items-center justify-center gap-4 text-[var(--color-text-dim)]">
        <Waveform />
        <span className="text-xs font-mono">transcribe · summarize · chat</span>
      </div>
    </div>
  );
}
