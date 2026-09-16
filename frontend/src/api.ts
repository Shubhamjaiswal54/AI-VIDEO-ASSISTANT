const BASE_URL = "http://localhost:8000";

export type JobStatus = "queued" | "processing" | "done" | "error";

export interface PipelineResult {
  title: string;
  transcript: string;
  summary: string;
  action_items: string[];
  key_decisions: string[];
  open_questions: string[];
}

export interface JobState {
  status: JobStatus;
  step: string | null;
  result: PipelineResult | null;
  error: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function createJob(source: string): Promise<{ job_id: string }> {
  return request("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
}

export function getJob(jobId: string): Promise<JobState> {
  return request(`/api/jobs/${jobId}`);
}

export async function uploadFile(file: File): Promise<{ path: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export function askQuestion(jobId: string, question: string): Promise<{ answer: string }> {
  return request(`/api/jobs/${jobId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}
