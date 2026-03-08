# `planner/` — Project Planner

## What This Module Does

`planner/` is Stage 3 of the pipeline and the core intelligence of ArchAgent. It takes a clean `IdeaContext` object, constructs the right prompts, calls the LLM, and returns a fully structured `ProjectPlan` dict.

If the LLM response fails schema validation, the planner also handles the repair loop — sending the broken plan back to the LLM with a list of errors and asking it to fix them.

---

## Files

```
planner/
├── planner.py     ← ProjectPlanner class
└── models.py      ← ProjectPlan dataclass + field definitions
```

---

## Responsibilities

- Take an `IdeaContext` and produce a structured `ProjectPlan` dict
- Build the correct prompt from `llm/prompts.py` templates
- Call `llm/client.py` for the LLM response
- Repair a plan that failed schema validation (send errors back to LLM)
- Generate the full written Markdown plan document from a validated plan

---

## What It Does NOT Do

- It does not validate the plan structure — that's `validator/schema.py`
- It does not format output files — that's `formatter/`
- It does not talk to Ollama directly — that's `llm/client.py`
- It does not decide when to retry — `core/pipeline.py` orchestrates the repair loop

---

## Planner Interface

```python
planner = ProjectPlanner(llm_client=ollama_client)

# Generate a plan from user idea
plan: dict = await planner.generate(idea_context)

# Repair a plan that failed schema validation
plan: dict = await planner.repair(bad_plan, errors=["missing 'milestones'", ...])

# Generate the full written Markdown document
doc: str = await planner.generate_doc(validated_plan)
```

---

## `ProjectPlan` Shape

Defined in `models.py` — this is the expected shape of everything the LLM returns:

```python
{
  "project_name": str,
  "project_summary": str,
  "domain": str,
  "complexity": "low" | "medium" | "high",
  "estimated_timeline": str,

  "tech_stack": {
    "Frontend": [...],
    "Backend": [...],
    "Database": [...],
    "Infrastructure": [...],
    "DevOps": [...],
    "Testing": [...]
  },

  "folder_structure": { ... },   # nested dict

  "milestones": [
    {
      "title": str,
      "duration": str,
      "goal": str,
      "tasks": [...],
      "deliverables": [...]
    }
  ],

  "architecture": {
    "pattern": str,
    "components": [
      {
        "name": str,
        "type": "service" | "database" | "queue" | "cache" | "gateway" | "client",
        "description": str,
        "connects_to": [...]
      }
    ]
  },

  "execution_flow": [
    { "step": str, "description": str, "actor": str }
  ],

  "key_considerations": {
    "security": [...],
    "scalability": [...],
    "risks": [...],
    "assumptions": [...]
  }
}
```

---

## Repair Loop (handled by `core/pipeline.py`)

```
planner.generate(idea)
    ↓
validator.validate(plan)
    ↓ (if errors)
planner.repair(plan, errors)    ← sends errors back to LLM
    ↓
validator.validate(repaired_plan)
    ↓ (if still errors after max retries → fail gracefully)
```

---

## Imports From

```
llm/client.py      ← OllamaClient for all LLM calls
llm/prompts.py     ← PLAN_PROMPT, REPAIR_PROMPT, WRITTEN_PLAN_PROMPT
input/models.py    ← IdeaContext (input type)
```

---

## Tasks

- [ ] `planner/planner.py` — `ProjectPlanner` class
- [ ] `planner/planner.py` — `.generate(idea_context)` → dict
- [ ] `planner/planner.py` — `.repair(bad_plan, errors)` → dict
- [ ] `planner/models.py` — `ProjectPlan` dataclass (all expected fields typed)
- [ ] `planner/planner.py` — `.generate_doc(plan)` → str (written Markdown plan)

---

## Notes

- The plan prompt must explicitly instruct the LLM to return raw JSON only — no markdown fences, no explanation
- Temperature for `.generate()`: `0.25` (structured JSON needs to be deterministic)
- Temperature for `.generate_doc()`: `0.45` (prose benefits from slight variation)
- `ProjectPlan` in `models.py` is the source of truth for expected shape — keep it in sync with `validator/schema.py`
- The repair prompt should include the specific errors, not just "fix this" — specificity gets better results from Qwen2.5