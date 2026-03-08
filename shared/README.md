# `shared/` — Shared Utilities

## What This Module Does

`shared/` contains everything that multiple modules need but doesn't belong to any one of them — logging setup, app config, shared types, constants, and custom exceptions.

Any module can import from `shared/` freely. Nothing in `shared/` imports from other ArchAgent modules — it sits at the bottom of the dependency tree.

---

## Files

```
shared/
├── logger.py      ← Structured logger setup
├── config.py      ← AppConfig dataclass + env loading
├── types.py       ← Shared type aliases
├── constants.py   ← VALID_DOMAINS, VALID_COMPLEXITY, OUTPUT_FORMATS
└── errors.py      ← Custom exception classes
```

---

## Responsibilities

| File | What it provides |
|---|---|
| `logger.py` | A configured logger instance any module can import and use |
| `config.py` | `AppConfig` dataclass loaded once from env or defaults |
| `types.py` | Type aliases used across multiple modules |
| `constants.py` | Shared constant values (valid domains, valid complexity levels, etc.) |
| `errors.py` | Custom exceptions for clean error handling across the pipeline |

---

## What It Does NOT Do

- It does not import from any other ArchAgent module
- It does not contain any business logic
- It does not call the LLM or touch the pipeline

---

## `logger.py`

```python
import logging
from shared.logger import get_logger

logger = get_logger(__name__)
logger.info("Stage started")
logger.debug("Detailed trace info")
```

Log level is controlled by `AppConfig.verbose` — `DEBUG` when verbose, `INFO` otherwise.

---

## `config.py`

```python
@dataclass
class AppConfig:
    model_name: str = "qwen2.5:7b"
    ollama_base_url: str = "http://localhost:11434"
    output_dir: str = "./outputs"
    max_retries: int = 3
    verbose: bool = False
```

Loaded from environment variables if set, otherwise falls back to defaults:

| Env Variable | Config Field |
|---|---|
| `ARCHAGENT_MODEL` | `model_name` |
| `ARCHAGENT_OLLAMA_URL` | `ollama_base_url` |
| `ARCHAGENT_OUTPUT_DIR` | `output_dir` |
| `ARCHAGENT_MAX_RETRIES` | `max_retries` |
| `ARCHAGENT_VERBOSE` | `verbose` |

---

## `types.py`

```python
from typing import TypeAlias

PlanDict: TypeAlias = dict[str, Any]
ArtifactMap: TypeAlias = dict[str, str]
ComponentList: TypeAlias = list[dict[str, Any]]
```

---

## `constants.py`

```python
VALID_DOMAINS = {
    "web-app", "mobile-app", "cli-tool",
    "api-service", "ml-system", "desktop-app"
}

VALID_COMPLEXITY = {"low", "medium", "high"}

OUTPUT_FORMATS = {"markdown", "json", "mermaid"}

COMPONENT_TYPES = {
    "service", "database", "queue",
    "cache", "gateway", "client"
}
```

---

## `errors.py`

```python
class OllamaError(Exception):
    """Raised when Ollama is unreachable or returns an error."""

class ValidationError(Exception):
    """Raised when a plan fails schema validation after max retries."""

class PipelineError(Exception):
    """Raised when the pipeline fails at a stage and cannot recover."""

class ExportError(Exception):
    """Raised when file saving fails."""
```

---

## Imports From

```
(none)
```

Zero dependencies on other ArchAgent modules. Python stdlib only.

---

## Tasks

- [ ] `shared/logger.py` — Structured logger setup (level from config)
- [ ] `shared/config.py` — `AppConfig` dataclass + load from env/file
- [ ] `shared/types.py` — Shared type aliases (`PlanDict`, `ArtifactMap`, etc.)
- [ ] `shared/constants.py` — `VALID_DOMAINS`, `VALID_COMPLEXITY`, `OUTPUT_FORMATS`
- [ ] `shared/errors.py` — Custom exception classes (`OllamaError`, `ValidationError`, `PipelineError`)

---

## Notes

- `AppConfig` should be a singleton — load it once at startup, pass it in or import it
- Logger format: `%(asctime)s [%(levelname)s] %(name)s: %(message)s` — consistent across all modules
- Keep `errors.py` lean — one exception per failure mode, no over-engineering
- `constants.py` is the single source of truth for valid values — `validator/schema.py` should import from here, not hardcode its own lists