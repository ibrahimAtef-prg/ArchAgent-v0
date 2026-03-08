# `llm/` — LLM Client

## What This Module Does

`llm/` is Stage 2 of the pipeline and the only module that talks to Ollama. Every other module that needs an LLM response goes through here — no other file in the project should make direct HTTP calls to Ollama.

It provides a clean async interface for completions, JSON-mode responses, streaming, and health checks — with automatic retry and exponential backoff built in.

---

## Files

```
llm/
├── client.py      ← OllamaClient async class
└── prompts.py     ← All prompt templates (centralized here)
```

---

## Responsibilities

**`client.py`:**
- Send prompts to Ollama at `http://localhost:11434`
- Return raw text completions
- Return parsed JSON when JSON mode is requested
- Stream tokens for real-time output
- Retry on failure with exponential backoff (max 3 attempts)
- Check if Ollama is reachable via health check

**`prompts.py`:**
- Store all prompt templates as constants
- Keep prompts versioned and easy to tune in one place

---

## What It Does NOT Do

- It does not decide what to ask the LLM — that's `planner/`
- It does not validate the LLM's response content — that's `validator/`
- It does not format output — that's `formatter/`

---

## Client Interface

```python
client = OllamaClient(base_url="http://localhost:11434", model="qwen2.5:7b")

# Single completion → str
response = await client.complete(prompt, system_prompt, temperature=0.3)

# JSON mode → dict
plan = await client.complete_json(prompt, system_prompt)

# Streaming → AsyncGenerator[str]
async for token in client.stream(prompt):
    print(token, end="", flush=True)

# Health check → bool
is_up = await client.health_check()
```

---

## Retry Behavior

| Attempt | Wait before retry |
|---|---|
| 1st failure | 2 seconds |
| 2nd failure | 4 seconds |
| 3rd failure | raises `OllamaError` |

---

## Prompts in `prompts.py`

| Constant | Used by | Purpose |
|---|---|---|
| `SYSTEM_PROMPT` | All calls | Sets the agent persona and output rules |
| `PLAN_PROMPT` | `planner/planner.py` | Generates the full structured plan |
| `REPAIR_PROMPT` | `planner/planner.py` | Fixes a plan that failed schema validation |
| `WRITTEN_PLAN_PROMPT` | `planner/planner.py` | Generates the full Markdown written plan |

---

## Model

```
Model:    qwen2.5:7b
Endpoint: http://localhost:11434/api/generate
Mode:     Local via Ollama (no internet, no API key)
```

---

## Imports From

```
(none)
```

This module has zero dependencies on other ArchAgent modules. It only uses `aiohttp` and Python stdlib.

---

## Tasks

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

---

## Notes

- Use `aiohttp` for async HTTP — do not use `requests` (it's blocking)
- JSON mode: set `"format": "json"` in the Ollama payload, then parse and strip any markdown fences the model adds anyway
- Temperature: use `0.2–0.3` for JSON generation (more deterministic), `0.4–0.5` for written prose
- All prompts live in `prompts.py` — never hardcode a prompt string inside `client.py`
- `OllamaClient` should be instantiated once and reused — don't create a new session per call