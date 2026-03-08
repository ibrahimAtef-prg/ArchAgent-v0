# `api/` — REST API Server

## What This Module Does

The API is the main bridge between the Web UI and the ArchAgent pipeline. It runs as a local FastAPI server on `localhost:8000`, accepts project idea submissions, queues them as async jobs, and serves results back when ready.

The Web UI talks exclusively to this API — it never touches the pipeline directly.

---

## Files

```
api/
├── server.py      ← FastAPI app setup, CORS, startup
├── routes.py      ← All endpoint definitions
├── models.py      ← Pydantic request/response schemas
└── job_store.py   ← In-memory job store
```

---

## Responsibilities

- Expose HTTP endpoints for the Web UI and any external clients
- Accept a project idea and return a `job_id` immediately (non-blocking)
- Run the pipeline in the background per job
- Serve job status and results when polled
- Handle CORS so the React frontend can talk to it

---

## What It Does NOT Do

- It does not run pipeline logic itself — it delegates to `core/pipeline.py`
- It does not serve the frontend files — Vite handles that separately
- It is not a production-grade job queue — `job_store.py` is in-memory (Redis can replace it later)

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate` | Submit a project idea. Returns `job_id`. |
| `GET` | `/result/:id` | Poll job status and get result when done. |
| `GET` | `/jobs` | List all jobs and their statuses. |
| `GET` | `/health` | Check if API + Ollama are reachable. |

---

## Job Lifecycle

```
POST /generate
    → job created with status: "queued"
    → pipeline starts in background

GET /result/:id
    → status: "queued"     (not started yet)
    → status: "processing" (pipeline running)
    → status: "complete"   (result ready)
    → status: "failed"     (error, includes message)
```

---

## Running the Server

```bash
# From project root
uvicorn api.server:app --reload --port 8000

# API docs auto-generated at:
http://localhost:8000/docs
```

---

## Imports From

```
core/pipeline.py    ← runs the pipeline per job
api/job_store.py    ← reads/writes job state
```

---

## Tasks

- [ ] `api/server.py` — FastAPI app setup + CORS
- [ ] `api/routes.py` — POST `/generate`, GET `/result/:id`, GET `/jobs`
- [ ] `api/models.py` — Pydantic request/response models
- [ ] `api/job_store.py` — In-memory job store (dict, replaceable with Redis)
- [ ] Background task runner per job

---

## Notes

- Use `BackgroundTasks` from FastAPI for async job execution
- `job_store.py` should be a simple dict wrapped in a class — easy to swap for Redis later
- Always return `job_id` immediately on `/generate` — never block waiting for the LLM
- Include `job_id` as a UUID so results can't be guessed
- Pydantic models in `models.py` should match exactly what the Web UI expects