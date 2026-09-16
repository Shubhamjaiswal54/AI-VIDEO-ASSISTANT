"""FastAPI backend for the Alex frontend.

Run with: uv run uvicorn alex.server:app --reload --port 8000
"""
import os
import tempfile
import threading
import uuid
from typing import Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from .util.audio_preprocessing import process_input
from .core.transcriber import transcribe_all
from .core.extractor import extract_all_insights
from .core.rag_engine import build_rag_chain, ask_question

app = FastAPI(title="Alex API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory job store (single-process, single-machine — fine for local use)
# ---------------------------------------------------------------------------
STEPS = ["preparing", "transcribing", "extracting", "indexing"]

jobs: Dict[str, dict] = {}
jobs_lock = threading.Lock()


class CreateJobRequest(BaseModel):
    source: str


class ChatRequest(BaseModel):
    question: str


def _set_job(job_id: str, **fields):
    with jobs_lock:
        jobs[job_id].update(fields)


def _process_job(job_id: str, source: str):
    try:
        _set_job(job_id, status="processing", step="preparing")
        chunks = process_input(source)

        _set_job(job_id, step="transcribing")
        transcript = transcribe_all(chunks)

        _set_job(job_id, step="extracting")
        insights = extract_all_insights(transcript)

        _set_job(job_id, step="indexing")
        rag_chain = build_rag_chain(transcript)

        result = {
            "title": insights["title"],
            "transcript": transcript,
            "summary": insights["summary"],
            "action_items": insights["action_items"],
            "key_decisions": insights["key_decisions"],
            "open_questions": insights["open_questions"],
        }

        with jobs_lock:
            jobs[job_id]["rag_chain"] = rag_chain
        _set_job(job_id, status="done", step="done", result=result)
    except Exception as e:  # noqa: BLE001
        _set_job(job_id, status="error", error=str(e))


@app.post("/api/jobs")
def create_job(req: CreateJobRequest):
    job_id = str(uuid.uuid4())
    with jobs_lock:
        jobs[job_id] = {"status": "queued", "step": "queued", "result": None, "error": None, "rag_chain": None}

    thread = threading.Thread(target=_process_job, args=(job_id, req.source), daemon=True)
    thread.start()
    return {"job_id": job_id}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    tmp_dir = os.path.join(tempfile.gettempdir(), "alex_uploads")
    os.makedirs(tmp_dir, exist_ok=True)
    dest_path = os.path.join(tmp_dir, file.filename)
    with open(dest_path, "wb") as f:
        f.write(await file.read())
    return {"path": dest_path}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return {
            "status": job["status"],
            "step": job.get("step"),
            "result": job.get("result"),
            "error": job.get("error"),
        }


@app.post("/api/jobs/{job_id}/chat")
def chat(job_id: str, req: ChatRequest):
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        rag_chain = job.get("rag_chain")

    if job["status"] != "done" or rag_chain is None:
        raise HTTPException(status_code=409, detail="Job is not ready for chat yet")

    try:
        answer = ask_question(rag_chain, req.question)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e)) from e

    return {"answer": answer}


@app.get("/api/health")
def health():
    return {"ok": True}
