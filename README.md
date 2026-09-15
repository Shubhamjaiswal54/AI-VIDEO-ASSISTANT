# Alex

Alex is an AI meeting assistant that turns a YouTube link or a local audio/video file into a structured meeting summary. It downloads or ingests the audio, transcribes it locally with Whisper, summarizes it in chunks with an LLM, and extracts action items, key decisions, and open questions.

## Features

- Accepts a YouTube URL or a local audio file as input
- Downloads and normalizes audio (mono, 16kHz WAV) and splits it into fixed-length chunks
- Transcribes each chunk locally using OpenAI Whisper (no audio leaves the machine)
- Summarizes long transcripts with a map-reduce style chunked summarization pipeline
- Generates a short meeting title from the transcript
- Extracts action items (with owner and deadline), key decisions, and unresolved questions
- Built on LangChain (LCEL) with a Google Gemini chat model

## Architecture

```mermaid
flowchart TD
    A[Input: YouTube URL or local file] --> B[audio_preprocessing]
    B -->|download_audio_from_youtube| B
    B -->|convert_audio_to_wav mono 16kHz| C[WAV file]
    C -->|chunk_audio| D[Audio chunks]

    D --> E[transcriber: Whisper]
    E --> F[Transcript text]

    F --> G[summarize]
    G -->|split_transcript| G1[Text chunks]
    G1 -->|summarize each chunk| G2[Partial summaries]
    G2 -->|combine| G3[Final meeting summary]
    F -->|generate_title| H[Meeting title]

    F --> I[extractor]
    I --> I1[Action items]
    I --> I2[Key decisions]
    I --> I3[Open questions]

    G3 --> J[Final output]
    H --> J
    I1 --> J
    I2 --> J
    I3 --> J
```

The pipeline has four stages, each in its own module:

1. **Audio ingestion** (`util/audio_preprocessing.py`) - downloads audio from a YouTube URL with `yt-dlp`, or accepts a local file, converts it to mono 16kHz WAV with `pydub`, and splits it into fixed-length chunks.
2. **Transcription** (`core/transcriber.py`) - runs each chunk through a local Whisper model and returns the transcribed text.
3. **Summarization** (`core/summarize.py`) - splits the transcript into text chunks, summarizes each chunk with an LLM, combines the partial summaries into one final summary, and generates a short meeting title.
4. **Extraction** (`main.py`) - runs three separate LLM chains over the full transcript to pull out action items, key decisions, and open questions.

All LLM calls go through LangChain LCEL chains backed by `ChatGoogleGenerativeAI` (Gemini).

## Project structure

```
src/alex/
├── main.py                       # LLM chains: action items, key decisions, open questions
├── core/
│   ├── extractor.py               # (in progress)
│   ├── summarize.py               # Chunked summarization + title generation
│   └── transcriber.py             # Whisper-based transcription
└── util/
    └── audio_preprocessing.py     # Download, convert, and chunk audio
```

## Requirements

- Python >= 3.12
- [FFmpeg](https://ffmpeg.org/) installed and available on PATH (required by `pydub` and `yt-dlp`)
- A Google API key with access to the Gemini API

## Installation

This project uses [uv](https://docs.astral.sh/uv/) for dependency management.

```bash
uv sync
```

Alternatively, with pip:

```bash
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the project root:

```
GOOGLE_API_KEY=your_google_api_key_here
```

## Usage

Process a YouTube URL or a local audio file into chunks ready for transcription:

```python
from alex.util.audio_preprocessing import process_input

chunks = process_input("https://youtu.be/your-video-id")
# or
chunks = process_input("path/to/local/audio.mp3")
```

Transcribe a chunk:

```python
from alex.core.transcriber import transcribe_chunk_whisper

text = transcribe_chunk_whisper("path/to/chunk.wav")
```

Summarize a transcript and generate a title:

```python
from alex.core.summarize import summarize, generate_title

summary = summarize(transcript_text)
title = generate_title(transcript_text)
```

Extract action items, decisions, and open questions:

```python
from alex.main import extract_action_items, extract_key_decisions, extract_questions

action_items = extract_action_items(transcript_text)
decisions = extract_key_decisions(transcript_text)
questions = extract_questions(transcript_text)
```

## Tech stack

- **LangChain (LCEL)** - LLM orchestration
- **Google Gemini** (`langchain-google-genai`) - chat model for summarization and extraction
- **OpenAI Whisper** - local speech-to-text
- **yt-dlp** - YouTube audio downloading
- **pydub** - audio format conversion and chunking
- **PyTorch / torchaudio** - Whisper backend
