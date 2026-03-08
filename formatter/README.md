# `formatter/` — Output Formatter

## What This Module Does

`formatter/` is Stage 4 of the pipeline. It takes the validated `ProjectPlan` dict and converts it into every human-readable output format: a Mermaid architecture diagram, a Markdown document, an ASCII folder tree, and a tech stack table.

Each formatter is a separate file with a single responsibility. None of them call the LLM — all transformation here is pure logic.

---

## Files

```
formatter/
├── diagram.py       ← Mermaid architecture diagram
├── markdown.py      ← Full written plan as Markdown
├── tree.py          ← Folder structure as ASCII tree + HTML tree
└── tech_table.py    ← Tech stack as Markdown table
```

---

## Responsibilities

| File | Input | Output |
|---|---|---|
| `diagram.py` | `plan["architecture"]` | Mermaid `.mmd` string |
| `markdown.py` | full `plan` dict | Complete `.md` document |
| `tree.py` | `plan["folder_structure"]` | ASCII tree string + HTML tree string |
| `tech_table.py` | `plan["tech_stack"]` | Markdown table string |

---

## What It Does NOT Do

- It does not call the LLM — all transformation is pure Python
- It does not save files — that's `exporter/`
- It does not validate the plan — that's `validator/`

---

## `diagram.py` — Mermaid Diagram

Converts architecture components and their connections into a Mermaid flowchart.

Component types map to Mermaid node shapes:

| Type | Shape | Example |
|---|---|---|
| `service` | Rectangle `[ ]` | `api_server["API Server"]` |
| `database` | Cylinder `[( )]` | `postgres[("PostgreSQL")]` |
| `queue` | Asymmetric `> ]` | `redis_queue>"Job Queue"]` |
| `cache` | Circle `(( ))` | `redis_cache(("Redis"))` |
| `gateway` | Rhombus `{ }` | `nginx{"Nginx"}` |
| `client` | Stadium `([ ])` | `browser(["Browser"])` |

Output example:
```
flowchart LR
    browser(["Browser"]) --> nginx{"Nginx"}
    nginx --> api_server["API Server"]
    api_server --> postgres[("PostgreSQL")]
```

---

## `markdown.py` — Markdown Document

Produces a structured Markdown document with:
- Project summary and metadata
- Tech stack section
- Architecture overview
- Milestone roadmap
- Execution flow
- Key considerations (security, risks, assumptions)

---

## `tree.py` — Folder Structure

Two renderers:
- **ASCII tree** — for terminal display and the CLI
- **HTML tree** — for the Web UI (collapsible nodes)

Input is a nested dict from `plan["folder_structure"]`. Output is a string in each format.

---

## `tech_table.py` — Tech Stack Table

Converts the tech stack dict into a clean Markdown table:

```markdown
| Category       | Technologies              |
|----------------|---------------------------|
| Frontend       | React, TypeScript, Vite   |
| Backend        | FastAPI, Python 3.11      |
| Database       | PostgreSQL, Redis         |
```

---

## Imports From

```
(none)
```

Zero dependencies on other ArchAgent modules. Pure Python — only stdlib.

---

## Tasks

- [ ] `formatter/diagram.py` — `DiagramBuilder` → Mermaid string
- [ ] `formatter/diagram.py` — Component type → node shape mapping
- [ ] `formatter/diagram.py` — Component type → CSS style mapping
- [ ] `formatter/markdown.py` — `MarkdownFormatter` → full `.md` document
- [ ] `formatter/tree.py` — `FolderTreeRenderer` → terminal ASCII tree
- [ ] `formatter/tree.py` — `FolderTreeRenderer` → nested dict → HTML tree
- [ ] `formatter/tech_table.py` — `TechTableFormatter` → Markdown table

---

## Notes

- Each formatter should be a class with a single `.build(data)` or `.render(data)` method
- Mermaid node IDs must be sanitized — replace spaces and special chars with underscores
- The ASCII tree should use `├──`, `└──`, `│` characters — not ASCII fallbacks
- `markdown.py` renders prose, not bullet dumps — write it like a real document
- All formatters should handle empty/missing fields gracefully — never raise on missing keys