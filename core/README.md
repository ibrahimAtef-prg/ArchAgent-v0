# `core/` — Pipeline Orchestrator

## What This Module Does

`core/` is the spine of the entire system. It defines the `Pipeline` class that runs all 6 stages in order, passes state between them, handles errors, and returns a single `PipelineResult` object that every interface (CLI, API, Web UI) consumes.

Nothing in the interface layer knows about individual stages. Nothing in the stages knows about each other. Everything flows through here.

---

## Files

```
core/
├── pipeline.py    ← Pipeline class + PipelineResult dataclass
└── config.py      ← AppConfig dataclass (model URL, output dir, flags)
```

---

## Responsibilities

- Accept a raw input string from any interface (CLI, API)
- Run all 6 pipeline stages in order
- Pass state from one stage to the next via `PipelineResult`
- Handle errors at each stage without crashing the whole run
- Retry LLM failures up to a configurable limit
- Return a complete `PipelineResult` to the caller

---

## What It Does NOT Do

- It does not parse user input — that's `input/parser.py`
- It does not call the LLM — that's `llm/client.py`
- It does not format output — that's `formatter/`
- It does not save files — that's `exporter/`
- It does not validate schemas — that's `validator/`

---

## Pipeline Execution Order

```
raw_input (str)
    │
    ▼
[Stage 1]  input/parser.py      → IdeaContext
    │
    ▼
[Stage 2]  llm/client.py        → (used by planner)
    │
    ▼
[Stage 3]  planner/planner.py   → plan dict (JSON)
    │
    ▼
[Stage 4a] validator/schema.py  → ValidationResult
    │         (if errors → planner.repair())
    ▼
[Stage 4b] formatter/*          → diagram, markdown, tree, tech table
    │
    ▼
[Stage 5]  validator/output.py  → ValidationResult
    │
    ▼
[Stage 6]  exporter/saver.py    → saved files on disk
    │
    ▼
PipelineResult (returned to CLI / API)
```

---

## `PipelineResult` Shape

The dataclass that carries all state through the pipeline and is returned to the caller:

```python
@dataclass
class PipelineResult:
    idea: IdeaContext           # parsed input
    plan: dict                  # structured project plan
    diagram: str                # Mermaid string
    markdown: str               # full written plan
    tree: str                   # ASCII folder tree
    tech_table: str             # Markdown tech stack table
    output_path: str            # where files were saved
    validation_passed: bool
    validation_errors: list[str]
    stage_timings: dict[str, float]   # how long each stage took
```

---

## `AppConfig` Shape

```python
@dataclass
class AppConfig:
    model_name: str = "qwen2.5:7b"
    ollama_base_url: str = "http://localhost:11434"
    output_dir: str = "./outputs"
    max_retries: int = 3
    verbose: bool = False
```

---

## Imports From

```
input/parser.py
llm/client.py
planner/planner.py
formatter/diagram.py
formatter/markdown.py
formatter/tree.py
formatter/tech_table.py
validator/schema.py
validator/output.py
exporter/saver.py
shared/config.py
shared/errors.py
```

---

## Tasks

- [ ] `core/pipeline.py` — Main `Pipeline` class with `.run(raw_input)` method
- [ ] `core/pipeline.py` — Stage runner with error handling per stage
- [ ] `core/pipeline.py` — `PipelineResult` dataclass (carries state through all stages)
- [ ] `core/pipeline.py` — Retry logic for LLM failures
- [ ] `core/config.py` — Global config dataclass (model URL, output dir, flags)

---

## Notes

- Each stage should be wrapped in a `try/except` — a failure in formatting should not kill the whole run
- Log the start and duration of each stage when `verbose=True`
- `PipelineResult` should always be returned even on partial failure — populate what succeeded, mark what failed
- Config should be a singleton loaded once at startup — don't re-read from env on every call