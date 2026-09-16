import { useEffect, useRef, useState } from "react";
import SourceInput from "./components/SourceInput";
import ProcessingScreen from "./components/ProcessingScreen";
import ResultsView from "./components/ResultsView";
import { createJob, getJob, uploadFile, type PipelineResult } from "./api";

type Phase = "input" | "processing" | "done" | "error";

function App() {
  const [phase, setPhase] = useState<Phase>("input");
  const [jobId, setJobId] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (id: string) => {
    pollRef.current = window.setInterval(async () => {
      try {
        const job = await getJob(id);
        setStep(job.step);
        if (job.status === "done" && job.result) {
          setResult(job.result);
          setPhase("done");
          if (pollRef.current) window.clearInterval(pollRef.current);
        } else if (job.status === "error") {
          setError(job.error ?? "Something went wrong.");
          setPhase("error");
          if (pollRef.current) window.clearInterval(pollRef.current);
        }
      } catch (e) {
        setError((e as Error).message);
        setPhase("error");
        if (pollRef.current) window.clearInterval(pollRef.current);
      }
    }, 2500);
  };

  const beginJob = async (source: string) => {
    setPhase("processing");
    setError(null);
    try {
      const { job_id } = await createJob(source);
      setJobId(job_id);
      startPolling(job_id);
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  const handleUrl = (url: string) => beginJob(url);

  const handleFile = async (file: File) => {
    setPhase("processing");
    setError(null);
    try {
      const { path } = await uploadFile(file);
      await beginJob(path);
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("input");
    setJobId(null);
    setStep(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[640px] rounded-full bg-[var(--color-signal)]/10 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-[var(--color-signal)] grid place-items-center font-display font-bold text-black text-sm">
            A
          </span>
          <span className="font-display font-semibold text-lg tracking-tight">Alex</span>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-dim)] hidden sm:block">
          meeting &amp; video intelligence
        </span>
      </header>

      <main className="relative z-10 px-6 md:px-10 pb-20 pt-8 md:pt-16">
        {phase === "input" && (
          <div>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-glow">
                Turn any recording into a{" "}
                <span className="text-[var(--color-signal)]">searchable brief</span>
              </h1>
              <p className="text-[var(--color-text-dim)] mt-4 text-sm md:text-base">
                Drop in a YouTube link or a local recording. Get a transcript, summary, action
                items, and a chat assistant that actually knows the content.
              </p>
            </div>
            <SourceInput onSubmitUrl={handleUrl} onSubmitFile={handleFile} disabled={false} />
          </div>
        )}

        {phase === "processing" && <ProcessingScreen step={step} />}

        {phase === "error" && (
          <div className="max-w-md mx-auto text-center py-10">
            <p className="text-red-400 font-mono text-sm mb-4">{error}</p>
            <button
              onClick={reset}
              className="rounded-full border border-[var(--color-border)] px-5 py-2 text-sm hover:border-[var(--color-signal)]/50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {phase === "done" && result && jobId && (
          <ResultsView result={result} jobId={jobId} onReset={reset} />
        )}
      </main>
    </div>
  );
}

export default App;
