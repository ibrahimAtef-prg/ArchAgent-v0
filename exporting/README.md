# `exporter/` — File Exporter

## What This Module Does

`exporter/` is Stage 6 and the final stage of the pipeline. It takes the complete `PipelineResult` and writes every artifact to a timestamped directory on disk. It also assembles one combined `FULL_REPORT.md` that contains everything in a single file.

After the exporter runs, the pipeline is done. The output path is returned to the interface layer (CLI/API) so it can tell the user where to find their files.

---

## Files

```
exporter/
└── saver.py       ← OutputSaver class — all file saving logic
```

---

## Responsibilities

- Create a timestamped subdirectory under `./outputs/` per run
- Save each artifact as its own file
- Assemble a combined `FULL_REPORT.md`
- Return the path to the output directory

---

## What It Does NOT Do

- It does not generate any content — everything it saves was produced by earlier stages
- It does not validate anything — that's `validator/`
- It does not display output — that's the CLI or Web UI

---

## Output Files Per Run

Every run produces a folder like `outputs/taskflow_20250308_142301/` containing:

| File | Format | Contents |
|---|---|---|
| `plan.json` | JSON | Full raw plan dict from the LLM |
| `PLAN.md` | Markdown | Written plan document |
| `architecture.mmd` | Mermaid | Architecture diagram (renderable on GitHub) |
| `folder_structure.json` | JSON | Nested folder structure dict |
| `milestones.json` | JSON | Milestone roadmap array |
| `tech_stack.json` | JSON | Tech stack dict |
| `FULL_REPORT.md` | Markdown | All of the above combined into one file |

---

## Directory Naming

```
outputs/
└── {project_name}_{YYYYMMDD}_{HHMMSS}/
    ├── plan.json
    ├── PLAN.md
    ├── architecture.mmd
    ├── folder_structure.json
    ├── milestones.json
    ├── tech_stack.json
    └── FULL_REPORT.md
```

Project name is sanitized: lowercase, spaces replaced with underscores.

---

## Exporter Interface

```python
saver = OutputSaver(output_dir="./outputs")

# Save everything and get back the path
output_path: str = await saver.save_all(pipeline_result)
# → "outputs/taskflow_20250308_142301"
```

---

## `FULL_REPORT.md` Structure

```markdown
# {project_name} — Full ArchAgent Report
*Generated on {date}*

---

## Architecture Diagram
```mermaid
...
```

---

{written_plan content}

---

## Tech Stack
{tech_table}

---

## Folder Structure
{ascii_tree}

---

## Milestones
{milestones formatted}
```

---

## Imports From

```
(none)
```

Zero dependencies on other ArchAgent modules. Pure Python stdlib — just `pathlib`, `json`, `datetime`.

---

## Tasks

- [ ] `exporter/saver.py` — `OutputSaver` class
- [ ] `exporter/saver.py` — `.save_all(result, output_dir)` → path
- [ ] `exporter/saver.py` — Save: `plan.json`, `PLAN.md`, `architecture.mmd`
- [ ] `exporter/saver.py` — Save: `folder_structure.json`, `milestones.json`, `tech_stack.json`
- [ ] `exporter/saver.py` — Save: `FULL_REPORT.md` (combined everything)
- [ ] `exporter/saver.py` — Create timestamped run subdirectory

---

## Notes

- Always create the output directory if it doesn't exist — never fail because `./outputs/` is missing
- Use `pathlib.Path` over `os.path` — cleaner and safer
- The `.mmd` file is valid Mermaid and will render directly on GitHub in a `README.md` with a mermaid block
- `FULL_REPORT.md` should be self-contained — someone should be able to read just this file and get everything
- Sanitize the project name for the directory: `"My Cool App"` → `"my_cool_app"`