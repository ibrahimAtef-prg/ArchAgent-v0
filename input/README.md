# `input/` — Input Parser

## What This Module Does

`input/` is Stage 1 of the pipeline. It takes the raw text a user typed and turns it into a clean, structured `IdeaContext` object that every downstream stage can rely on.

Its job is to make the rest of the pipeline's life easier — normalizing messy input, extracting useful signals, and filling in sensible defaults when things are missing.

---

## Files

```
input/
├── parser.py      ← InputParser class — does the actual work
└── models.py      ← IdeaContext dataclass — the output shape
```

---

## Responsibilities

- Strip noise from raw input (extra whitespace, repeated punctuation, etc.)
- Extract a project name if the user mentioned one
- Detect the likely domain (web app, mobile app, CLI tool, ML system, etc.)
- Pull out constraint keywords (e.g. "no backend", "mobile only", "must use PostgreSQL")
- Fill in defaults for anything missing
- Output a clean `IdeaContext` object

---

## What It Does NOT Do

- It does not call the LLM — all extraction here is rule-based / regex
- It does not validate the plan — that's `validator/`
- It does not generate anything — that's `planner/`

---

## `IdeaContext` Shape

Defined in `models.py`:

```python
@dataclass
class IdeaContext:
    raw: str                    # original unmodified input
    cleaned: str                # normalized, stripped version
    project_name: str           # extracted or auto-generated
    domain: str                 # e.g. "web-app", "cli-tool", "ml-system"
    constraints: list[str]      # e.g. ["no authentication", "Python only"]
    word_count: int             # rough complexity signal
```

---

## Domain Detection

Rule-based detection from keywords in the prompt:

| Keywords found | Domain assigned |
|---|---|
| "mobile", "iOS", "Android", "React Native" | `mobile-app` |
| "CLI", "terminal", "command line", "script" | `cli-tool` |
| "ML", "model", "training", "dataset", "AI" | `ml-system` |
| "API", "REST", "GraphQL", "microservice" | `api-service` |
| "dashboard", "web", "SaaS", "frontend" | `web-app` |
| *(none matched)* | `web-app` (default) |

---

## Imports From

```
(none)
```

This module has zero dependencies on other ArchAgent modules. It only uses Python stdlib.

---

## Tasks

- [ ] `input/parser.py` — `InputParser` class
- [ ] `input/parser.py` — Strip noise, normalize whitespace
- [ ] `input/parser.py` — Extract: `project_name`, domain hint, constraint keywords
- [ ] `input/models.py` — `IdeaContext` dataclass (raw, cleaned, name, domain, constraints)
- [ ] `input/parser.py` — Fallback defaults when fields are missing

---

## Notes

- Keep all extraction rule-based — do not call the LLM here
- Project name extraction: look for patterns like "called X", "named X", "for X"
- Constraint extraction: look for "must", "only", "no X", "without X", "using X"
- `cleaned` should be the version that gets sent to the LLM prompt — trim aggressively
- Word count is a useful proxy for idea complexity — feed it into the planner prompt