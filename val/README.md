# `validator/` — Validator

## What This Module Does

`validator/` is Stage 5 of the pipeline and runs twice: once to check the plan structure before formatting, and once to check the final output artifacts after formatting.

It acts as a quality gate — nothing moves forward unless the data is in the expected shape.

---

## Files

```
validator/
├── schema.py      ← Validates the raw plan dict from the LLM
├── output.py      ← Validates the final formatted artifacts
└── models.py      ← ValidationResult dataclass
```

---

## Responsibilities

**`schema.py` — Plan Schema Validator:**
- Check that all required top-level keys are present
- Check that `milestones`, `architecture`, `tech_stack` are the right shape
- Return a list of errors and warnings

**`output.py` — Output Artifact Validator:**
- Check that all output artifacts were generated
- Check that none are empty strings or empty lists
- Return a list of errors and warnings

**`models.py`:**
- Define the `ValidationResult` dataclass returned by both validators

---

## What It Does NOT Do

- It does not fix problems — that's `planner/planner.py .repair()`
- It does not generate anything — it only inspects
- It does not format output — that's `formatter/`

---

## `ValidationResult` Shape

```python
@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str]     # things that must be fixed before continuing
    warnings: list[str]   # things that are suspicious but non-blocking
```

---

## Schema Validation Rules (`schema.py`)

### Required Top-Level Keys
```
project_name, project_summary, domain, complexity,
estimated_timeline, tech_stack, folder_structure,
milestones, architecture, execution_flow, key_considerations
```

### Field Rules

| Field | Rule |
|---|---|
| `project_name` | Non-empty string |
| `complexity` | Must be `"low"`, `"medium"`, or `"high"` |
| `tech_stack` | Dict with at least: Frontend, Backend, Database |
| `milestones` | Non-empty list; each item has title, duration, goal, tasks, deliverables |
| `architecture.components` | List; each item has name, type, description, connects_to |
| `execution_flow` | List; each item has step, description, actor |

### Warnings (non-blocking)
- `milestones` list is empty
- `key_considerations` missing a section
- `tech_stack` missing optional categories (AI/ML, DevOps)

---

## Output Validation Rules (`output.py`)

Checks the dict returned by `formatter/`:

| Artifact | Rule |
|---|---|
| `diagram` | Non-empty string, contains `"flowchart"` |
| `markdown` | Non-empty string, at least 100 chars |
| `tree` | Non-empty string |
| `tech_table` | Non-empty string |
| `milestones` | Non-empty list |

---

## Where Each Validator Runs

```
core/pipeline.py
    │
    ├── planner.generate()  →  validator/schema.py  →  errors?  →  planner.repair()
    │
    └── formatter/*         →  validator/output.py  →  warnings logged, continues
```

Schema validation is blocking (errors stop the pipeline and trigger repair).
Output validation is informational (warnings logged, pipeline continues).

---

## Imports From

```
(none)
```

Zero dependencies on other ArchAgent modules. Pure Python stdlib only.

---

## Tasks

- [ ] `validator/schema.py` — `SchemaValidator.validate(plan)` → `ValidationResult`
- [ ] `validator/schema.py` — Check all required top-level keys
- [ ] `validator/schema.py` — Check milestones, architecture, tech_stack shapes
- [ ] `validator/schema.py` — Return `errors[]` + `warnings[]`
- [ ] `validator/output.py` — `OutputValidator.validate(outputs)` → `ValidationResult`
- [ ] `validator/output.py` — Check all artifacts are non-empty
- [ ] `validator/models.py` — `ValidationResult` dataclass

---

## Notes

- Errors = pipeline cannot continue without fixing this
- Warnings = something looks off but we can still produce output
- Keep error messages specific: `"milestones[2] missing key 'deliverables'"` not `"bad milestones"`
- The schema in `schema.py` must stay in sync with `planner/models.py` — they describe the same shape
- Never raise exceptions — always return a `ValidationResult` even on catastrophic input