# `cli/` — Terminal Entry Point

## What This Module Does

The CLI is one of three ways to trigger ArchAgent (alongside the REST API and Web UI). It provides a direct terminal interface — type your idea, get a full architecture plan printed to the terminal and saved to disk.

No server needed. Run it, describe your idea, get output.

---

## Files

```
cli/
└── main.py        ← everything lives here
```

---

## Responsibilities

- Parse command-line arguments (`--name`, `--verbose`, `--output-dir`)
- Prompt the user interactively if no idea is passed as an argument
- Pass the raw input cleanly into `core/pipeline.py`
- Print live stage progress as the pipeline runs
- Render the final result as a formatted tree in the terminal

---

## What It Does NOT Do

- It does not parse or clean the idea — that's `input/parser.py`
- It does not call the LLM — that's `llm/client.py`
- It does not format output files — that's `formatter/` and `exporter/`
- It is not the web interface — that's `web/`

---

## Usage

```bash
# Interactive mode — prompts you for input
python -m cli.main

# Pass idea directly
python -m cli.main --name "TaskFlow" "A project management tool for remote teams"

# With flags
python -m cli.main --verbose --output-dir ./my-outputs "A real-time chat app"
```

---

## CLI Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `idea` | positional (optional) | prompted | The raw project idea string |
| `--name` | str | auto-generated | Project name |
| `--output-dir` | str | `./outputs` | Where to save generated files |
| `--verbose` | flag | off | Show detailed pipeline logs |

---

## Imports From

```
core/pipeline.py    ← runs the full pipeline
```

The CLI only touches the pipeline. It hands off input and receives a `PipelineResult` back — nothing else.

---

## Tasks

- [ ] Parse CLI args (argparse or Typer)
- [ ] Prompt user for idea if not passed as arg
- [ ] Support `--verbose`, `--output-dir`, `--name` flags
- [ ] Print progress stages to terminal with color
- [ ] Render final output as formatted tree in terminal

---

## Notes

- Use `Typer` over `argparse` — cleaner API, automatic `--help` generation
- Use ANSI color codes for progress output (no external deps needed)
- Multi-line input should be supported (press Enter twice to submit)
- On error, print a clean message — never a raw Python traceback to the user