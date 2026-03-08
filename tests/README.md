# `tests/` — Test Suite

## What This Module Does

`tests/` contains one test file per module. Every module ships with tests — no exceptions. All LLM calls are mocked so tests run instantly without Ollama running.

Tests are the safety net that lets you change any module with confidence.

---

## Files

```
tests/
├── test_input_parser.py          ← Unit tests for input/parser.py
├── test_llm_client.py            ← Unit tests for llm/client.py
├── test_planner.py               ← Unit tests for planner/planner.py
├── test_formatter_diagram.py     ← Unit tests for formatter/diagram.py
├── test_formatter_markdown.py    ← Unit tests for formatter/markdown.py
├── test_schema_validator.py      ← Unit tests for validator/schema.py
├── test_output_validator.py      ← Unit tests for validator/output.py
├── test_exporter.py              ← Unit tests for exporter/saver.py
└── test_pipeline_integration.py  ← Full pipeline end-to-end (all LLM mocked)
```

---

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run a specific test file
pytest tests/test_schema_validator.py -v

# Run with coverage report
pytest tests/ --cov=. --cov-report=term-missing
```

---

## What Each Test File Covers

### `test_input_parser.py`
- Whitespace and noise stripping
- Domain detection from keywords
- Project name extraction
- Constraint keyword extraction
- Fallback defaults when fields are missing

### `test_llm_client.py`
- Mock HTTP responses → correct return values
- JSON parsing from LLM response
- Retry logic fires on connection error
- Exponential backoff timing
- Health check returns True/False correctly

### `test_planner.py`
- `.generate()` calls LLM with correct prompt template
- `.repair()` includes errors in the repair prompt
- `.generate_doc()` returns non-empty Markdown string
- Handles LLM returning malformed JSON gracefully

### `test_formatter_diagram.py`
- Mermaid output contains `flowchart` directive
- Component names are sanitized (no spaces)
- Connections (`-->`) are present for linked components
- Handles empty component list gracefully

### `test_formatter_markdown.py`
- Output contains expected section headers
- Milestones are present and formatted
- Tech stack section is present
- Handles missing optional fields without crashing

### `test_schema_validator.py`
- Valid plan passes with no errors
- Missing required key produces specific error message
- Invalid `complexity` value produces error
- Empty `milestones` produces warning (not error)
- Missing `architecture.components` produces error

### `test_output_validator.py`
- All artifacts present → passes
- Missing artifact key → error
- Empty diagram string → warning
- Empty milestones list → warning

### `test_exporter.py`
- Output directory is created if missing
- All 7 expected files are written
- Timestamped subdirectory is created with correct format
- `FULL_REPORT.md` contains content from all other files
- Uses `tmp_path` fixture (no leftover files after test)

### `test_pipeline_integration.py`
- Full pipeline runs start to finish with all LLM calls mocked
- `PipelineResult` is returned with all fields populated
- Pipeline handles LLM failure → repair loop correctly
- Pipeline returns partial result on stage failure (doesn't crash)

---

## Mocking Pattern

All LLM calls are mocked with `unittest.mock.AsyncMock`:

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_planner_generate():
    mock_plan = { ... }  # valid plan dict

    with patch("llm.client.OllamaClient.complete_json", new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_plan

        planner = ProjectPlanner(llm_client=OllamaClient())
        result = await planner.generate(idea_context)

        assert result["project_name"] == mock_plan["project_name"]
        mock_llm.assert_called_once()
```

---

## Shared Fixtures

Define common test data in `conftest.py` (create this at the root of `tests/`):

```python
# tests/conftest.py
import pytest
from input.models import IdeaContext

@pytest.fixture
def sample_idea():
    return IdeaContext(
        raw="A task management SaaS for remote teams",
        cleaned="A task management SaaS for remote teams",
        project_name="TaskFlow",
        domain="web-app",
        constraints=[],
        word_count=8,
    )

@pytest.fixture
def sample_plan():
    return { ... }  # full valid plan dict
```

---

## Imports From

```
(none — tests import from the modules they test)
```

---

## Tasks

- [ ] `tests/test_input_parser.py` — Test cleaning, extraction, defaults
- [ ] `tests/test_llm_client.py` — Mock HTTP, test retry logic, JSON parsing
- [ ] `tests/test_planner.py` — Mock LLM, test plan generation + repair
- [ ] `tests/test_formatter_diagram.py` — Test Mermaid output structure
- [ ] `tests/test_formatter_markdown.py` — Test Markdown doc generation
- [ ] `tests/test_schema_validator.py` — Test all schema rules
- [ ] `tests/test_output_validator.py` — Test artifact completeness checks
- [ ] `tests/test_exporter.py` — Test file saving with temp dirs
- [ ] `tests/test_pipeline_integration.py` — Full pipeline with all LLM calls mocked

---

## Notes

- Use `pytest-asyncio` for all async tests — mark them with `@pytest.mark.asyncio`
- Use `tmp_path` (built into pytest) for file I/O tests — never write to real directories
- Never test the LLM output quality — only test that your code handles responses correctly
- Write tests alongside the module, not after — it forces cleaner interfaces
- Aim for each test to test exactly one thing — short, named, focused