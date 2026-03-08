# `web/` — React Web UI

## What This Module Does

The Web UI is the primary way users interact with ArchAgent. It's a React + Vite single-page app that runs on `localhost:5173`. Users type their idea, watch live progress as the pipeline runs, and explore the full output in a tabbed viewer.

It talks to the local FastAPI server (`localhost:8000`) — never to Ollama directly.

---

## Files

```
web/
└── src/
    ├── App.jsx                          ← Root layout + routing
    ├── api/
    │   └── client.js                    ← Fetch wrapper for REST API
    ├── hooks/
    │   └── useGenerate.js               ← Polling hook for job status
    └── components/
        ├── PromptInput.jsx              ← Idea textarea + submit button
        ├── ProgressTracker.jsx          ← Live pipeline stage display
        ├── OutputViewer.jsx             ← Tabbed result viewer
        └── DiagramRenderer.jsx          ← Mermaid diagram embed
```

---

## Responsibilities

- Accept a project idea from the user via `PromptInput`
- Submit it to `POST /generate` and receive a `job_id`
- Poll `GET /result/:id` every 2 seconds via `useGenerate` hook
- Show live pipeline stage progress via `ProgressTracker`
- Display the full result across tabs when complete via `OutputViewer`
- Render the Mermaid architecture diagram via `DiagramRenderer`

---

## What It Does NOT Do

- It does not run any pipeline logic — that's the Python backend
- It does not talk to Ollama — all AI work happens server-side
- It does not store any state beyond the current session

---

## Component Breakdown

### `PromptInput.jsx`
Text area for the project idea + optional project name field. Submit button triggers the API call. Shows a loading state while waiting.

### `ProgressTracker.jsx`
Displays the 6 pipeline stages (Input → LLM → Planner → Formatter → Validator → Exporter) and highlights which one is currently running. Polls from the job status response.

### `OutputViewer.jsx`
Tabbed panel showing all outputs once the job is complete:
- **Plan** — written plan document
- **Diagram** — architecture diagram (rendered via Mermaid)
- **Stack** — tech stack table
- **Files** — folder structure tree
- **Milestones** — roadmap with phases and tasks

### `DiagramRenderer.jsx`
Takes a raw Mermaid string and renders it as an interactive SVG diagram. Uses the `mermaid` npm package.

### `api/client.js`
Thin fetch wrapper. Two functions: `submitIdea(prompt, name)` and `pollResult(jobId)`. Everything goes through here — no raw `fetch()` calls in components.

### `hooks/useGenerate.js`
Custom React hook. Manages the full generate → poll → complete flow. Returns `{ status, result, error, isLoading }` to components.

---

## Running the Frontend

```bash
cd web
npm install
npm run dev

# Opens at: http://localhost:5173
# Requires API running at: http://localhost:8000
```

---

## Imports From

```
api/     ← all data comes from the REST API at localhost:8000
```

---

## Tasks

- [ ] `web/src/App.jsx` — Root layout + routing
- [ ] `web/src/components/PromptInput.jsx` — Idea textarea + submit
- [ ] `web/src/components/ProgressTracker.jsx` — Live pipeline stages
- [ ] `web/src/components/OutputViewer.jsx` — Tabs: Plan / Diagram / Stack / Files / Milestones
- [ ] `web/src/components/DiagramRenderer.jsx` — Mermaid diagram embed
- [ ] `web/src/api/client.js` — Fetch wrapper for REST API
- [ ] `web/src/hooks/useGenerate.js` — Polling hook for job status

---

## Notes

- Poll interval: 2 seconds is a good default — adjust based on typical generation time
- Use `mermaid` npm package for diagram rendering (import and call `mermaid.render()`)
- Keep all API calls in `client.js` — components should never call `fetch()` directly
- `useGenerate` should clear the polling interval when the component unmounts
- Point API base URL at an env variable (`VITE_API_URL`) so it's easy to change