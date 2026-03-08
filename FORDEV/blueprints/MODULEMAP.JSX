import { useState } from "react";

const LAYERS = [
  {
    id: "interface",
    label: "01 — INTERFACE LAYER",
    color: "#C8F04A",
    description: "How users interact with the system",
    modules: [
      {
        id: "cli",
        name: "cli/",
        file: "cli/main.py",
        tag: "CLI",
        summary: "Terminal entry point. Accepts raw prompt, project name, flags. Passes clean input to the pipeline.",
        tasks: [
          "Parse CLI args (argparse or Typer)",
          "Prompt user for idea if not passed as arg",
          "Support --verbose, --output-dir, --name flags",
          "Print progress stages to terminal with color",
          "Render final output as formatted tree in terminal",
        ],
        deps: ["core/pipeline.py"],
        status: "todo",
      },
      {
        id: "api",
        name: "api/",
        file: "api/server.py + api/routes.py",
        tag: "REST API",
        summary: "FastAPI server. Exposes /generate, /result/:id, /health endpoints. Async job queue.",
        tasks: [
          "api/server.py — FastAPI app setup + CORS",
          "api/routes.py — POST /generate, GET /result/:id, GET /jobs",
          "api/models.py — Pydantic request/response models",
          "api/job_store.py — In-memory job store (dict, replaceable with Redis)",
          "Background task runner per job",
        ],
        deps: ["core/pipeline.py", "api/job_store.py"],
        status: "todo",
      },
      {
        id: "webui",
        name: "web/",
        file: "web/ (React + Vite)",
        tag: "Web UI",
        summary: "Main user-facing interface. Prompt input, live generation progress, tabbed output viewer.",
        tasks: [
          "web/src/App.jsx — Root layout + routing",
          "web/src/components/PromptInput.jsx — Idea textarea + submit",
          "web/src/components/ProgressTracker.jsx — Live pipeline stages",
          "web/src/components/OutputViewer.jsx — Tabs: Plan / Diagram / Stack / Files / Milestones",
          "web/src/components/DiagramRenderer.jsx — Mermaid diagram embed",
          "web/src/api/client.js — Fetch wrapper for REST API",
          "web/src/hooks/useGenerate.js — Polling hook for job status",
        ],
        deps: ["api/"],
        status: "todo",
      },
    ],
  },
  {
    id: "core",
    label: "02 — CORE PIPELINE",
    color: "#4AF0C8",
    description: "The central orchestration layer — runs stages in order",
    modules: [
      {
        id: "pipeline",
        name: "core/",
        file: "core/pipeline.py",
        tag: "Orchestrator",
        summary: "The spine of the system. Runs all 6 stages in sequence. Handles errors, retries, and state passing between stages.",
        tasks: [
          "core/pipeline.py — Main Pipeline class with .run(raw_input) method",
          "core/pipeline.py — Stage runner with error handling per stage",
          "core/pipeline.py — PipelineResult dataclass (carries state through all stages)",
          "core/pipeline.py — Retry logic for LLM failures",
          "core/config.py — Global config dataclass (model URL, output dir, flags)",
        ],
        deps: ["input/", "llm/", "planner/", "formatter/", "validator/", "exporter/"],
        status: "todo",
      },
    ],
  },
  {
    id: "stages",
    label: "03 — PIPELINE STAGES",
    color: "#F0A84A",
    description: "Six isolated, single-responsibility modules",
    modules: [
      {
        id: "input",
        name: "input/",
        file: "input/parser.py",
        tag: "Stage 1 — Input",
        summary: "Receives raw user text. Cleans it, extracts intent, detects domain, fills gaps. Outputs a structured IdeaContext object.",
        tasks: [
          "input/parser.py — InputParser class",
          "input/parser.py — Strip noise, normalize whitespace",
          "input/parser.py — Extract: project_name, domain hint, constraint keywords",
          "input/models.py — IdeaContext dataclass (raw, cleaned, name, domain, constraints)",
          "input/parser.py — Fallback defaults when fields are missing",
        ],
        deps: [],
        status: "todo",
      },
      {
        id: "llm",
        name: "llm/",
        file: "llm/client.py + llm/prompts.py",
        tag: "Stage 2 — LLM",
        summary: "All Ollama communication lives here. No other module talks to Ollama directly. Supports JSON mode, streaming, retries.",
        tasks: [
          "llm/client.py — OllamaClient async class",
          "llm/client.py — .complete(prompt, system, temp) → str",
          "llm/client.py — .complete_json(prompt, system) → dict",
          "llm/client.py — .stream(prompt) → AsyncGenerator",
          "llm/client.py — Retry with exponential backoff (max 3)",
          "llm/client.py — .health_check() → bool",
          "llm/prompts.py — SYSTEM_PROMPT constant",
          "llm/prompts.py — PLAN_PROMPT template",
          "llm/prompts.py — REPAIR_PROMPT template",
          "llm/prompts.py — WRITTEN_PLAN_PROMPT template",
        ],
        deps: [],
        status: "todo",
      },
      {
        id: "planner",
        name: "planner/",
        file: "planner/planner.py",
        tag: "Stage 3 — Planner",
        summary: "Uses LLM to generate the full structured plan. Handles plan repair if schema fails. Returns a validated ProjectPlan dict.",
        tasks: [
          "planner/planner.py — ProjectPlanner class",
          "planner/planner.py — .generate(idea_context) → dict",
          "planner/planner.py — .repair(bad_plan, errors) → dict",
          "planner/models.py — ProjectPlan dataclass (all expected fields typed)",
          "planner/planner.py — Written plan generation (.generate_doc(plan) → str)",
        ],
        deps: ["llm/"],
        status: "todo",
      },
      {
        id: "formatter",
        name: "formatter/",
        file: "formatter/",
        tag: "Stage 4 — Formatter",
        summary: "Converts a raw plan dict into every output format: Mermaid diagram, Markdown doc, folder tree, tech table.",
        tasks: [
          "formatter/diagram.py — DiagramBuilder → Mermaid string",
          "formatter/diagram.py — Component type → node shape mapping",
          "formatter/diagram.py — Component type → CSS style mapping",
          "formatter/markdown.py — MarkdownFormatter → full .md document",
          "formatter/tree.py — FolderTreeRenderer → terminal ASCII tree",
          "formatter/tree.py — FolderTreeRenderer → nested dict → HTML tree",
          "formatter/tech_table.py — TechTableFormatter → Markdown table",
        ],
        deps: [],
        status: "todo",
      },
      {
        id: "validator",
        name: "validator/",
        file: "validator/schema.py + validator/output.py",
        tag: "Stage 5 — Validator",
        summary: "Two validators: one checks the plan structure (schema), one checks the final output artifacts (completeness).",
        tasks: [
          "validator/schema.py — SchemaValidator.validate(plan) → ValidationResult",
          "validator/schema.py — Check all required top-level keys",
          "validator/schema.py — Check milestones, architecture, tech_stack shapes",
          "validator/schema.py — Return errors[] + warnings[]",
          "validator/output.py — OutputValidator.validate(outputs) → ValidationResult",
          "validator/output.py — Check all artifacts are non-empty",
          "validator/models.py — ValidationResult dataclass",
        ],
        deps: [],
        status: "todo",
      },
      {
        id: "exporter",
        name: "exporter/",
        file: "exporter/saver.py",
        tag: "Stage 6 — Exporter",
        summary: "Saves all artifacts to a timestamped output directory. Supports Markdown, JSON, Mermaid. Builds a combined full report.",
        tasks: [
          "exporter/saver.py — OutputSaver class",
          "exporter/saver.py — .save_all(result, output_dir) → path",
          "exporter/saver.py — Save: plan.json, PLAN.md, architecture.mmd",
          "exporter/saver.py — Save: folder_structure.json, milestones.json, tech_stack.json",
          "exporter/saver.py — Save: FULL_REPORT.md (combined everything)",
          "exporter/saver.py — Create timestamped run subdirectory",
        ],
        deps: [],
        status: "todo",
      },
    ],
  },
  {
    id: "shared",
    label: "04 — SHARED UTILITIES",
    color: "#A84AF0",
    description: "Cross-cutting concerns used by multiple layers",
    modules: [
      {
        id: "shared",
        name: "shared/",
        file: "shared/",
        tag: "Utilities",
        summary: "Logging, config loader, common types, constants. Importable by any layer without creating circular deps.",
        tasks: [
          "shared/logger.py — Structured logger setup (level from config)",
          "shared/config.py — AppConfig dataclass + load from env/file",
          "shared/types.py — Shared type aliases (PlanDict, ArtifactMap, etc.)",
          "shared/constants.py — VALID_DOMAINS, VALID_COMPLEXITY, OUTPUT_FORMATS",
          "shared/errors.py — Custom exception classes (OllamaError, ValidationError, PipelineError)",
        ],
        deps: [],
        status: "todo",
      },
    ],
  },
  {
    id: "tests",
    label: "05 — TESTS",
    color: "#F04A7A",
    description: "One test file per module. No module ships without tests.",
    modules: [
      {
        id: "tests",
        name: "tests/",
        file: "tests/",
        tag: "Testing",
        summary: "Unit tests per stage. Integration test for full pipeline. All LLM calls mocked. Run with pytest.",
        tasks: [
          "tests/test_input_parser.py — Test cleaning, extraction, defaults",
          "tests/test_llm_client.py — Mock HTTP, test retry logic, JSON parsing",
          "tests/test_planner.py — Mock LLM, test plan generation + repair",
          "tests/test_formatter_diagram.py — Test Mermaid output structure",
          "tests/test_formatter_markdown.py — Test Markdown doc generation",
          "tests/test_schema_validator.py — Test all schema rules",
          "tests/test_output_validator.py — Test artifact completeness checks",
          "tests/test_exporter.py — Test file saving with temp dirs",
          "tests/test_pipeline_integration.py — Full pipeline with all LLM calls mocked",
        ],
        deps: [],
        status: "todo",
      },
    ],
  },
];

const TAG_COLORS = {
  "CLI": "#C8F04A",
  "REST API": "#4AF0C8",
  "Web UI": "#4A8AF0",
  "Orchestrator": "#F0C84A",
  "Stage 1 — Input": "#F0A84A",
  "Stage 2 — LLM": "#F0A84A",
  "Stage 3 — Planner": "#F0A84A",
  "Stage 4 — Formatter": "#F0A84A",
  "Stage 5 — Validator": "#F0A84A",
  "Stage 6 — Exporter": "#F0A84A",
  "Utilities": "#A84AF0",
  "Testing": "#F04A7A",
};

const FILE_TREE = `ArchAgent/
├── cli/
│   └── main.py
├── api/
│   ├── server.py
│   ├── routes.py
│   ├── models.py
│   └── job_store.py
├── web/                        ← React + Vite
│   └── src/
│       ├── App.jsx
│       ├── api/client.js
│       ├── hooks/useGenerate.js
│       └── components/
│           ├── PromptInput.jsx
│           ├── ProgressTracker.jsx
│           ├── OutputViewer.jsx
│           └── DiagramRenderer.jsx
├── core/
│   ├── pipeline.py
│   └── config.py
├── input/
│   ├── parser.py
│   └── models.py
├── llm/
│   ├── client.py
│   └── prompts.py
├── planner/
│   ├── planner.py
│   └── models.py
├── formatter/
│   ├── diagram.py
│   ├── markdown.py
│   ├── tree.py
│   └── tech_table.py
├── validator/
│   ├── schema.py
│   ├── output.py
│   └── models.py
├── exporter/
│   └── saver.py
├── shared/
│   ├── logger.py
│   ├── config.py
│   ├── types.py
│   ├── constants.py
│   └── errors.py
├── tests/
│   ├── test_input_parser.py
│   ├── test_llm_client.py
│   ├── test_planner.py
│   ├── test_formatter_diagram.py
│   ├── test_formatter_markdown.py
│   ├── test_schema_validator.py
│   ├── test_output_validator.py
│   ├── test_exporter.py
│   └── test_pipeline_integration.py
├── outputs/                    ← gitignored, runtime
├── requirements.txt
├── pyproject.toml
└── README.md`;

export default function ArchAgentModuleMap() {
  const [activeModule, setActiveModule] = useState(null);
  const [activeTab, setActiveTab] = useState("modules");
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (moduleId, taskIdx) => {
    const key = `${moduleId}-${taskIdx}`;
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalTasks = LAYERS.flatMap(l => l.modules).flatMap(m => m.tasks).length;
  const doneTasks = Object.values(completedTasks).filter(Boolean).length;
  const progress = Math.round((doneTasks / totalTasks) * 100);

  const active = activeModule
    ? LAYERS.flatMap(l => l.modules).find(m => m.id === activeModule)
    : null;

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      background: "#0D0D0D",
      color: "#E8E8E8",
      minHeight: "100vh",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1E1E1E",
        padding: "28px 40px 20px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.2em", marginBottom: 6 }}>
            PROJECT BLUEPRINT
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>
            ArchAgent
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
            {LAYERS.flatMap(l => l.modules).length} modules · {totalTasks} tasks · 5 layers
          </div>
        </div>

        {/* Progress */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8, letterSpacing: "0.1em" }}>
            OVERALL PROGRESS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 180,
              height: 4,
              background: "#1A1A1A",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "#C8F04A",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C8F04A", minWidth: 36 }}>
              {progress}%
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
            {doneTasks} / {totalTasks} tasks done
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid #1E1E1E",
        padding: "0 40px",
      }}>
        {[
          { id: "modules", label: "Module Map" },
          { id: "tree", label: "File Tree" },
          { id: "flow", label: "Data Flow" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #C8F04A" : "2px solid transparent",
              color: activeTab === tab.id ? "#C8F04A" : "#555",
              fontSize: 12,
              letterSpacing: "0.1em",
              padding: "14px 20px 12px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color 0.15s",
            }}
          >
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Module Map Tab */}
      {activeTab === "modules" && (
        <div style={{ display: "flex", height: "calc(100vh - 140px)" }}>

          {/* Left — Layer + Module List */}
          <div style={{
            width: 320,
            borderRight: "1px solid #1A1A1A",
            overflowY: "auto",
            padding: "24px 0",
          }}>
            {LAYERS.map(layer => (
              <div key={layer.id} style={{ marginBottom: 8 }}>
                {/* Layer header */}
                <div style={{
                  padding: "8px 24px",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: layer.color,
                  fontWeight: 700,
                }}>
                  {layer.label}
                </div>

                {layer.modules.map(mod => {
                  const modTaskCount = mod.tasks.length;
                  const modDone = mod.tasks.filter((_, i) => completedTasks[`${mod.id}-${i}`]).length;
                  const isActive = activeModule === mod.id;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id === activeModule ? null : mod.id)}
                      style={{
                        padding: "12px 24px",
                        cursor: "pointer",
                        background: isActive ? "#141414" : "transparent",
                        borderLeft: isActive ? `2px solid ${layer.color}` : "2px solid transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{
                            fontSize: 13,
                            color: isActive ? "#fff" : "#BBB",
                            fontWeight: isActive ? 600 : 400,
                          }}>
                            {mod.name}
                          </div>
                          <div style={{
                            fontSize: 10,
                            color: TAG_COLORS[mod.tag] || "#555",
                            marginTop: 2,
                            letterSpacing: "0.08em",
                          }}>
                            {mod.tag}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#444" }}>
                            {modDone}/{modTaskCount}
                          </div>
                          <div style={{
                            width: 40,
                            height: 2,
                            background: "#1A1A1A",
                            marginTop: 4,
                            borderRadius: 1,
                          }}>
                            <div style={{
                              width: `${(modDone / modTaskCount) * 100}%`,
                              height: "100%",
                              background: layer.color,
                              borderRadius: 1,
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Right — Module Detail */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
            {!active ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#333",
                gap: 12,
              }}>
                <div style={{ fontSize: 48 }}>←</div>
                <div style={{ fontSize: 13, letterSpacing: "0.1em" }}>SELECT A MODULE</div>
              </div>
            ) : (
              <div>
                {/* Module header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <div style={{
                      display: "inline-block",
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      color: TAG_COLORS[active.tag] || "#888",
                      background: `${TAG_COLORS[active.tag]}18`,
                      border: `1px solid ${TAG_COLORS[active.tag]}44`,
                      padding: "3px 10px",
                      borderRadius: 3,
                      marginBottom: 12,
                    }}>
                      {active.tag}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                      {active.name}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: "#555",
                      marginTop: 6,
                      fontFamily: "monospace",
                    }}>
                      {active.file}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{
                  background: "#111",
                  border: "1px solid #1E1E1E",
                  borderRadius: 6,
                  padding: "16px 20px",
                  fontSize: 13,
                  color: "#AAA",
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}>
                  {active.summary}
                </div>

                {/* Dependencies */}
                {active.deps.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#444", marginBottom: 10 }}>
                      IMPORTS FROM
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {active.deps.map(dep => (
                        <span key={dep} style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          background: "#151515",
                          border: "1px solid #2A2A2A",
                          borderRadius: 3,
                          color: "#777",
                          fontFamily: "monospace",
                        }}>
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                <div>
                  <div style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    color: "#444",
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span>TASKS</span>
                    <span style={{ color: "#333" }}>
                      {active.tasks.filter((_, i) => completedTasks[`${active.id}-${i}`]).length} / {active.tasks.length} done
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {active.tasks.map((task, i) => {
                      const key = `${active.id}-${i}`;
                      const done = !!completedTasks[key];
                      // Split "file.py — description" for formatting
                      const parts = task.split(" — ");
                      const fileName = parts.length > 1 ? parts[0] : null;
                      const desc = parts.length > 1 ? parts[1] : task;

                      return (
                        <div
                          key={i}
                          onClick={() => toggleTask(active.id, i)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            padding: "10px 14px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: done ? "#0F1A0A" : "#0D0D0D",
                            border: done ? "1px solid #1E3A10" : "1px solid #181818",
                            transition: "all 0.15s",
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            border: done ? "1px solid #4AF04A" : "1px solid #333",
                            background: done ? "#4AF04A22" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1,
                          }}>
                            {done && <span style={{ fontSize: 10, color: "#4AF04A" }}>✓</span>}
                          </div>

                          {/* Task text */}
                          <div>
                            {fileName && (
                              <span style={{
                                fontSize: 11,
                                color: done ? "#4A7A4A" : "#4A8AF0",
                                fontFamily: "monospace",
                                marginRight: 8,
                              }}>
                                {fileName}
                              </span>
                            )}
                            <span style={{
                              fontSize: 12,
                              color: done ? "#3A5A3A" : "#888",
                              textDecoration: done ? "line-through" : "none",
                              lineHeight: 1.5,
                            }}>
                              {desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Tree Tab */}
      {activeTab === "tree" && (
        <div style={{ padding: "40px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#444", marginBottom: 20 }}>
            COMPLETE FILE STRUCTURE
          </div>
          <pre style={{
            fontFamily: "'DM Mono', 'Fira Mono', monospace",
            fontSize: 13,
            lineHeight: 1.9,
            color: "#777",
            margin: 0,
          }}>
            {FILE_TREE.split("\n").map((line, i) => {
              const isDir = line.includes("/") && !line.includes("←") && !line.trim().startsWith("└── R") && !line.trim().startsWith("└── p");
              const isComment = line.includes("←");
              const isFile = line.includes(".") && !isComment;
              return (
                <div key={i} style={{
                  color: isComment ? "#444" : isFile ? "#AAA" : "#C8F04A",
                  display: "block",
                }}>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* Data Flow Tab */}
      {activeTab === "flow" && (
        <div style={{ padding: "40px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#444", marginBottom: 28 }}>
            DATA FLOW THROUGH PIPELINE
          </div>

          {[
            { from: "User", to: "cli/ or api/ or web/", data: "raw text prompt", color: "#C8F04A" },
            { from: "Interface Layer", to: "core/pipeline.py", data: "raw_input string", color: "#4AF0C8" },
            { from: "pipeline.py", to: "input/parser.py", data: "raw_input string", color: "#F0A84A" },
            { from: "input/parser.py", to: "pipeline.py", data: "IdeaContext object", color: "#F0A84A" },
            { from: "pipeline.py", to: "llm/client.py + planner/planner.py", data: "IdeaContext → PLAN_PROMPT", color: "#F0A84A" },
            { from: "planner/planner.py", to: "pipeline.py", data: "raw plan dict (JSON)", color: "#F0A84A" },
            { from: "pipeline.py", to: "validator/schema.py", data: "plan dict", color: "#F0A84A" },
            { from: "validator/schema.py", to: "pipeline.py", data: "ValidationResult (pass / errors[])", color: "#F0A84A" },
            { from: "pipeline.py → (if errors)", to: "planner/planner.py .repair()", data: "plan + error list", color: "#F04A4A" },
            { from: "pipeline.py", to: "formatter/diagram.py", data: "plan dict", color: "#F0A84A" },
            { from: "pipeline.py", to: "formatter/markdown.py", data: "plan dict", color: "#F0A84A" },
            { from: "pipeline.py", to: "formatter/tree.py", data: "folder_structure dict", color: "#F0A84A" },
            { from: "formatter/*", to: "pipeline.py", data: "diagram str, markdown str, tree str", color: "#F0A84A" },
            { from: "pipeline.py", to: "validator/output.py", data: "all formatted artifacts", color: "#F0A84A" },
            { from: "pipeline.py", to: "exporter/saver.py", data: "PipelineResult (all artifacts)", color: "#A84AF0" },
            { from: "exporter/saver.py", to: "disk / outputs/", data: "7 output files + FULL_REPORT.md", color: "#A84AF0" },
            { from: "pipeline.py", to: "Interface Layer (CLI/API/Web)", data: "PipelineResult for display", color: "#4AF0C8" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              marginBottom: 2,
              padding: "10px 16px",
              background: "#0D0D0D",
              border: "1px solid #141414",
              borderRadius: 4,
            }}>
              <div style={{
                fontSize: 10,
                color: "#333",
                minWidth: 24,
                paddingTop: 2,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{step.from}</span>
                  <span style={{ color: step.color, fontSize: 14 }}>→</span>
                  <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{step.to}</span>
                </div>
                <div style={{
                  fontSize: 11,
                  color: "#444",
                  marginTop: 4,
                  fontFamily: "monospace",
                  paddingLeft: 8,
                  borderLeft: `2px solid ${step.color}33`,
                }}>
                  {step.data}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}