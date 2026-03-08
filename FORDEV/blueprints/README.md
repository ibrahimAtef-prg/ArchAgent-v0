# ArchAgent — Module Map

> Complete blueprint of all modules, files, tasks, and data flow.
> Stack: Python + FastAPI (backend) · React + Vite (frontend) · Qwen2.5-7B via Ollama (LLM)

---

## How It Runs Locally

```
Browser (localhost:5173)
        ↓
FastAPI (localhost:8000)   ← local API
        ↓
Ollama  (localhost:11434)  ← local LLM
        Model: qwen2.5:7b
```

---

## System Overview

| Layer | Modules | Responsibility |
|---|---|---|
| 01 Interface | `cli/` `api/` `web/` | How users trigger the system |
| 02 Core | `core/` | Orchestrates all 6 pipeline stages |
| 03 Stages | `input/` `llm/` `planner/` `formatter/` `validator/` `exporter/` | One job each, no overlap |
| 04 Shared | `shared/` | Logger, config, types, errors |
| 05 Tests | `tests/` | One test file per module |

**Rule:** No stage module imports from another stage. Everything flows through `core/pipeline.py`.

---

## 01 — Interface Layer

### `cli/` · Terminal Entry Point
**File:** `cli/main.py`

Accepts raw prompt, project name, and flags. Passes clean input to the pipeline.

**Tasks:**
- [ ] Parse CLI args (argparse or Typer)
- [ ] Prompt user for idea if not passed as arg
- [ ] Support `--verbose`, `--output-dir`, `--name` flags
- [ ] Print progress stages to terminal with color
- [ ] Render final output as formatted tree in terminal

**Imports from:** `core/pipeline.py`

---

### `api/` · REST API Server
**File:** `api/server.py` + `api/routes.py`

FastAPI server. Exposes `/generate`, `/result/:id`, `/health` endpoints. Async job queue.

**Tasks:**
- [ ] `api/server.py` — FastAPI app setup + CORS
- [ ] `api/routes.py` — POST `/generate`, GET `/result/:id`, GET `/jobs`
- [ ] `api/models.py` — Pydantic request/response models
- [ ] `api/job_store.py` — In-memory job store (dict, replaceable with Redis)
- [ ] Background task runner per job

**Imports from:** `core/pipeline.py`, `api/job_store.py`

---

### `web/` · React Web UI
**File:** `web/src/` (React + Vite)

Main user-facing interface. Prompt input, live generation progress, tabbed output viewer.

**Tasks:**
- [ ] `web/src/App.jsx` — Root layout + routing
- [ ] `web/src/components/PromptInput.jsx` — Idea textarea + submit
- [ ] `web/src/components/ProgressTracker.jsx` — Live pipeline stages
- [ ] `web/src/components/OutputViewer.jsx` — Tabs: Plan / Diagram / Stack / Files / Milestones
- [ ] `web/src/components/DiagramRenderer.jsx` — Mermaid diagram embed
- [ ] `web/src/api/client.js` — Fetch wrapper for REST API
- [ ] `web/src/hooks/useGenerate.js` — Polling hook for job status

**Imports from:** `api/`

---

## 02 — Core Pipeline

### `core/` · Orchestrator
**File:** `core/pipeline.py`

The spine of the system. Runs all 6 stages in sequence. Handles errors, retries, and state passing between stages.

**Tasks:**
- [ ] `core/pipeline.py` — Main `Pipeline` class with `.run(raw_input)` method
- [ ] `core/pipeline.py` — Stage runner with error handling per stage
- [ ] `core/pipeline.py` — `PipelineResult` dataclass (carries state through all stages)
- [ ] `core/pipeline.py` — Retry logic for LLM failures
- [ ] `core/config.py` — Global config dataclass (model URL, output dir, flags)

**Imports from:** `input/`, `llm/`, `planner/`, `formatter/`, `validator/`, `exporter/`

---

## 03 — Pipeline Stages

### `input/` · Stage 1 — Input Parser
**File:** `input/parser.py`

Receives raw user text. Cleans it, extracts intent, detects domain, fills gaps. Outputs a structured `IdeaContext` object.

**Tasks:**
- [ ] `input/parser.py` — `InputParser` class
- [ ] `input/parser.py` — Strip noise, normalize whitespace
- [ ] `input/parser.py` — Extract: `project_name`, domain hint, constraint keywords
- [ ] `input/models.py` — `IdeaContext` dataclass (raw, cleaned, name, domain, constraints)
- [ ] `input/parser.py` — Fallback defaults when fields are missing

**Imports from:** *(none)*

---

### `llm/` · Stage 2 — LLM Client
**File:** `llm/client.py` + `llm/prompts.py`

All Ollama communication lives here. No other module talks to Ollama directly. Supports JSON mode, streaming, retries.

**Tasks:**
- [ ] `llm/client.py` — `OllamaClient` async class
- [ ] `llm/client.py` — `.complete(prompt, system, temp)` → str
- [ ] `llm/client.py` — `.complete_json(prompt, system)` → dict
- [ ] `llm/client.py` — `.stream(prompt)` → AsyncGenerator
- [ ] `llm/client.py` — Retry with exponential backoff (max 3)
- [ ] `llm/client.py` — `.health_check()` → bool
- [ ] `llm/prompts.py` — `SYSTEM_PROMPT` constant
- [ ] `llm/prompts.py` — `PLAN_PROMPT` template
- [ ] `llm/prompts.py` — `REPAIR_PROMPT` template
- [ ] `llm/prompts.py` — `WRITTEN_PLAN_PROMPT` template

**Imports from:** *(none)*

---

### `planner/` · Stage 3 — Project Planner
**File:** `planner/planner.py`

Uses LLM to generate the full structured plan. Handles plan repair if schema fails. Returns a validated `ProjectPlan` dict.

**Tasks:**
- [ ] `planner/planner.py` — `ProjectPlanner` class
- [ ] `planner/planner.py` — `.generate(idea_context)` → dict
- [ ] `planner/planner.py` — `.repair(bad_plan, errors)` → dict
- [ ] `planner/models.py` — `ProjectPlan` dataclass (all expected fields typed)
- [ ] `planner/planner.py` — Written plan generation (`.generate_doc(plan)` → str)

**Imports from:** `llm/`

---

### `formatter/` · Stage 4 — Formatter
**File:** `formatter/`

Converts a raw plan dict into every output format: Mermaid diagram, Markdown doc, folder tree, tech table.

**Tasks:**
- [ ] `formatter/diagram.py` — `DiagramBuilder` → Mermaid string
- [ ] `formatter/diagram.py` — Component type → node shape mapping
- [ ] `formatter/diagram.py` — Component type → CSS style mapping
- [ ] `formatter/markdown.py` — `MarkdownFormatter` → full `.md` document
- [ ] `formatter/tree.py` — `FolderTreeRenderer` → terminal ASCII tree
- [ ] `formatter/tree.py` — `FolderTreeRenderer` → nested dict → HTML tree
- [ ] `formatter/tech_table.py` — `TechTableFormatter` → Markdown table

**Imports from:** *(none)*

---

### `validator/` · Stage 5 — Validator
**File:** `validator/schema.py` + `validator/output.py`

Two validators: one checks the plan structure (schema), one checks the final output artifacts (completeness).

**Tasks:**
- [ ] `validator/schema.py` — `SchemaValidator.validate(plan)` → `ValidationResult`
- [ ] `validator/schema.py` — Check all required top-level keys
- [ ] `validator/schema.py` — Check milestones, architecture, tech_stack shapes
- [ ] `validator/schema.py` — Return `errors[]` + `warnings[]`
- [ ] `validator/output.py` — `OutputValidator.validate(outputs)` → `ValidationResult`
- [ ] `validator/output.py` — Check all artifacts are non-empty
- [ ] `validator/models.py` — `ValidationResult` dataclass

**Imports from:** *(none)*

---

### `exporter/` · Stage 6 — Exporter
**File:** `exporter/saver.py`

Saves all artifacts to a timestamped output directory. Supports Markdown, JSON, Mermaid. Builds a combined full report.

**Tasks:**
- [ ] `exporter/saver.py` — `OutputSaver` class
- [ ] `exporter/saver.py` — `.save_all(result, output_dir)` → path
- [ ] `exporter/saver.py` — Save: `plan.json`, `PLAN.md`, `architecture.mmd`
- [ ] `exporter/saver.py` — Save: `folder_structure.json`, `milestones.json`, `tech_stack.json`
- [ ] `exporter/saver.py` — Save: `FULL_REPORT.md` (combined everything)
- [ ] `exporter/saver.py` — Create timestamped run subdirectory

**Imports from:** *(none)*

---

## 04 — Shared Utilities

### `shared/` · Utilities
**File:** `shared/`

Logging, config loader, common types, constants. Importable by any layer without creating circular deps.

**Tasks:**
- [ ] `shared/logger.py` — Structured logger setup (level from config)
- [ ] `shared/config.py` — `AppConfig` dataclass + load from env/file
- [ ] `shared/types.py` — Shared type aliases (`PlanDict`, `ArtifactMap`, etc.)
- [ ] `shared/constants.py` — `VALID_DOMAINS`, `VALID_COMPLEXITY`, `OUTPUT_FORMATS`
- [ ] `shared/errors.py` — Custom exception classes (`OllamaError`, `ValidationError`, `PipelineError`)

**Imports from:** *(none)*

---

## 05 — Tests

### `tests/` · Test Suite
**File:** `tests/`

Unit tests per stage. Integration test for full pipeline. All LLM calls mocked. Run with `pytest`.

**Tasks:**
- [ ] `tests/test_input_parser.py` — Test cleaning, extraction, defaults
- [ ] `tests/test_llm_client.py` — Mock HTTP, test retry logic, JSON parsing
- [ ] `tests/test_planner.py` — Mock LLM, test plan generation + repair
- [ ] `tests/test_formatter_diagram.py` — Test Mermaid output structure
- [ ] `tests/test_formatter_markdown.py` — Test Markdown doc generation
- [ ] `tests/test_schema_validator.py` — Test all schema rules
- [ ] `tests/test_output_validator.py` — Test artifact completeness checks
- [ ] `tests/test_exporter.py` — Test file saving with temp dirs
- [ ] `tests/test_pipeline_integration.py` — Full pipeline with all LLM calls mocked

**Imports from:** *(none)*

---

## File Tree

```
ArchAgent/
├── cli/
│   └── main.py
├── api/
│   ├── server.py
│   ├── routes.py
│   ├── models.py
│   └── job_store.py
├── web/                          ← React + Vite
│   └── src/
│       ├── App.jsx
│       ├── api/client.js
│       ├── hooks/useGenerate.js
│       └── components/
│           ├── PromptInput.jsx
│           ├── ProgressTracker.jsx
│           ├── OutputViewer.jsx
│           └── DiagramRenderer.jsx
├── core/
│   ├── pipeline.py
│   └── config.py
├── input/
│   ├── parser.py
│   └── models.py
├── llm/
│   ├── client.py
│   └── prompts.py
├── planner/
│   ├── planner.py
│   └── models.py
├── formatter/
│   ├── diagram.py
│   ├── markdown.py
│   ├── tree.py
│   └── tech_table.py
├── validator/
│   ├── schema.py
│   ├── output.py
│   └── models.py
├── exporter/
│   └── saver.py
├── shared/
│   ├── logger.py
│   ├── config.py
│   ├── types.py
│   ├── constants.py
│   └── errors.py
├── tests/
│   ├── test_input_parser.py
│   ├── test_llm_client.py
│   ├── test_planner.py
│   ├── test_formatter_diagram.py
│   ├── test_formatter_markdown.py
│   ├── test_schema_validator.py
│   ├── test_output_validator.py
│   ├── test_exporter.py
│   └── test_pipeline_integration.py
├── outputs/                      ← gitignored, runtime
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## Data Flow Through Pipeline

| # | From | To | Data |
|---|---|---|---|
| 01 | User | `cli/` or `api/` or `web/` | raw text prompt |
| 02 | Interface Layer | `core/pipeline.py` | raw_input string |
| 03 | `pipeline.py` | `input/parser.py` | raw_input string |
| 04 | `input/parser.py` | `pipeline.py` | IdeaContext object |
| 05 | `pipeline.py` | `llm/client.py` + `planner/planner.py` | IdeaContext → PLAN_PROMPT |
| 06 | `planner/planner.py` | `pipeline.py` | raw plan dict (JSON) |
| 07 | `pipeline.py` | `validator/schema.py` | plan dict |
| 08 | `validator/schema.py` | `pipeline.py` | ValidationResult (pass / errors[]) |
| 09 | `pipeline.py` (if errors) | `planner/planner.py .repair()` | plan + error list |
| 10 | `pipeline.py` | `formatter/diagram.py` | plan dict |
| 11 | `pipeline.py` | `formatter/markdown.py` | plan dict |
| 12 | `pipeline.py` | `formatter/tree.py` | folder_structure dict |
| 13 | `formatter/*` | `pipeline.py` | diagram str, markdown str, tree str |
| 14 | `pipeline.py` | `validator/output.py` | all formatted artifacts |
| 15 | `pipeline.py` | `exporter/saver.py` | PipelineResult (all artifacts) |
| 16 | `exporter/saver.py` | `disk / outputs/` | 7 output files + FULL_REPORT.md |
| 17 | `pipeline.py` | Interface Layer (CLI/API/Web) | PipelineResult for display |

---

## Task Summary

| Module | Tasks | Priority |
|---|---|---|
| `llm/` | 10 | 🔴 First — everything depends on it |
| `input/` | 5 | 🔴 First — feeds the whole pipeline |
| `shared/` | 5 | 🔴 First — needed by all modules |
| `core/` | 5 | 🟠 Second — orchestrates everything |
| `planner/` | 5 | 🟠 Second — core intelligence |
| `validator/` | 7 | 🟡 Third — after planner works |
| `formatter/` | 7 | 🟡 Third — after plan shape is stable |
| `exporter/` | 6 | 🟡 Third — after formatter works |
| `api/` | 5 | 🟢 Fourth — wraps the pipeline |
| `cli/` | 5 | 🟢 Fourth — wraps the pipeline |
| `web/` | 7 | 🔵 Last — frontend on top of API |
| `tests/` | 9 | ⚪ Alongside each module |

**Total: 57 tasks across 12 modules**