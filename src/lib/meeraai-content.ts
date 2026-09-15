// Checked against the local MeeraAI source on 2026-09-15. These are app profiles, not independently trained Meera models.
export const meeraModels = [
  {
    "id": "meera-nano",
    "name": "Meera Nano",
    "model": "Qwen3.5",
    "parameters": "0.8B",
    "quantization": "IQ4_XS",
    "role": "fast local assistant",
    "capabilities": [
      "chat",
      "tools",
      "web",
      "coding"
    ],
    "context": 16384,
    "studioAlias": null
  },
  {
    "id": "meera-mini",
    "name": "Meera Mini",
    "model": "Qwen3.5",
    "parameters": "2B",
    "quantization": "IQ4_XS",
    "role": "balanced lightweight assistant",
    "capabilities": [
      "chat",
      "tools",
      "web",
      "coding"
    ],
    "context": 16384,
    "studioAlias": null
  },
  {
    "id": "meera-edge",
    "name": "Meera Edge",
    "model": "Ministral 3",
    "parameters": "3B",
    "quantization": "IQ4_XS",
    "role": "compact productive agent",
    "capabilities": [
      "chat",
      "tools",
      "web",
      "coding",
      "vision"
    ],
    "context": 12288,
    "studioAlias": null
  },
  {
    "id": "meera",
    "name": "Meera",
    "model": "Qwen3.5",
    "parameters": "4B",
    "quantization": "IQ4_XS",
    "role": "default productive local model",
    "capabilities": [
      "chat",
      "tools",
      "web",
      "coding",
      "vision"
    ],
    "context": 16384,
    "studioAlias": "Meera Pro"
  },
  {
    "id": "meera-vision",
    "name": "Meera Vision",
    "model": "Gemma 4 E4B",
    "parameters": "E4B / 8B total",
    "quantization": "IQ4_XS",
    "role": "vision and multimodal local model",
    "capabilities": [
      "chat",
      "tools",
      "vision",
      "web"
    ],
    "context": 16384,
    "studioAlias": "Meera Max"
  },
  {
    "id": "meera-deep",
    "name": "Meera Deep",
    "model": "Ministral 3 Reasoning",
    "parameters": "8B",
    "quantization": "IQ3_M",
    "role": "deep reasoning and coding",
    "capabilities": [
      "chat",
      "tools",
      "reasoning",
      "coding",
      "vision"
    ],
    "context": 16384,
    "studioAlias": null
  },
  {
    "id": "meera-ultra",
    "name": "Meera Ultra",
    "model": "Qwen3.5",
    "parameters": "9B",
    "quantization": "IQ3_M",
    "role": "highest-quality local general model",
    "capabilities": [
      "chat",
      "tools",
      "reasoning",
      "web",
      "coding",
      "vision"
    ],
    "context": 16384,
    "studioAlias": null
  }
] as const;

export const meeraCapabilities = [
 { title: 'Chat with a local model', text: 'Choose an installed GGUF, load it, and stream replies in the desktop app. Local mode explicitly selects the native runtime; a matching cloud model name cannot silently switch the request to cloud inference.', status: 'Routing tested' },
 { title: 'Manage and tune models', text: 'Model Studio includes Hugging Face search, file selection, download controls, installed-model discovery, and runtime settings. Context length, CPU threads, GPU offload, batch sizes, and KV-cache options are adjustable.', status: 'Implemented in source' },
 { title: 'Browse alongside your assistant', text: 'Meera Browser uses Electron webviews with tabs, history, bookmarks, navigation, zoom, find-in-page, and reader mode. Its assistant can receive the current page text and links for summaries, explanations, and takeaways.', status: 'Implemented in source' },
 { title: 'Use browser tools for a task', text: 'The backend has separate Playwright tools for navigation, clicks, typing, selection, scrolling, extraction, and screenshots. Form-filling and booking flows include checkout handoff. They require Playwright and its browser runtime.', status: 'End-to-end testing pending' },
 { title: 'Work with files and documents', text: 'The app has document ingestion and page-indexing RAG, plus Markdown, HTML, PDF, and Word generation. Some indexing paths use optional services. Exported files are present in the project; answer quality across document types has not been benchmarked.', status: 'Source and export artifacts' },
 { title: 'Review changes before accepting them', text: 'The coding runtime opens a project workspace, tracks task events, builds structured edit plans, and shows diffs for acceptance or rejection. Workspace snapshots, restoration, change tracking, and path restrictions passed regression tests.', status: 'Workspace and task tests passed' },
 { title: 'Run and monitor commands', text: 'The process manager streams command output, tracks exit state, stops running processes, and requires confirmation for medium-risk commands. The tests exercised these behaviors using temporary workspaces.', status: 'Process tests passed' },
 { title: 'Keep useful context', text: 'A SQLite memory layer supports selective facts, scoped retrieval, remember/forget commands, and contradiction handling. Role contexts and versioned knowledge are also implemented. Memory-test cleanup fails on Windows, and one role-activation test fails.', status: 'Implemented; known test failures' },
 { title: 'Plan tasks and connect tools', text: 'The planner classifies requests and represents multi-step tasks with dependencies, retries, and replanning. MCP integration exposes configured tools to chat. These paths exist in source; reliable completion of arbitrary real-world tasks is not established.', status: 'Implemented in source' },
 { title: 'Choose local, hybrid, or cloud paths', text: 'The interface offers inference modes and provider configuration. Web research, external models, optional indexing, and online browsing can use the network even when the core model runs locally. Voice and visual workflows depend on the selected model and available runtime.', status: 'Configuration dependent' },
] as const;

export const meeraValidation = [
 { title: '22 regression tests passed', text: 'Rerun on 15 September 2026: local inference policy, agent runtime, workspace manager/security, process manager, content scanner, and knowledge store. Task execution uses a mocked runner; process tests launch real temporary commands.' },
 { title: 'Local generation is recorded', text: 'The llama-server log records loading and generation with Qwen3.5 0.8B, 2B, and 4B IQ4_NL files. These are recorded runtime runs, not a seven-tier quality benchmark or proof of successful browser tasks.' },
 { title: 'A live smoke test failed', text: 'The older Qwen3.5 0.8B BF16 smoke run produced repetitive text and then exceeded its 4,096-token context during the HTTP test. It reported that cloud inference was not used. That run is not counted as a pass.' },
 { title: 'Remaining checks are explicit', text: 'Memory tests encounter Windows SQLite cleanup errors; one role-activation test fails. Browser workflows, vision, all seven tiers, hardware memory limits, and packaged Windows/macOS launches still need end-to-end validation.' },
] as const;

export const meeraSummary = {
 problem: 'Bring local AI chat, model management, documents, coding tasks, and an integrated browser into one desktop application.',
 approach: 'I built a React and Electron desktop app around a Python/FastAPI backend, with seven curated GGUF profiles and separate services for chat, documents, memory, tools, and controlled coding tasks.',
 architecture: 'React/TypeScript UI -> Electron IPC and FastAPI -> chat/tool services -> native GGUF runtime. Qwen3.5 and reasoning profiles use llama-server; other profiles can use llama-cpp-python. Electron webviews power Meera Browser, while a separate Playwright service handles backend browser automation.',
 decisions: 'Keep local inference routing explicit, expose runtime controls, separate browsing from automation, and require review of structured code edits. The current backend tier policy uses IQ4_XS for tiers 1-5 and IQ3_M for tiers 6-7; recorded Qwen runs use IQ4_NL.',
 evidence: 'Local source reviewed on 15 September 2026. All 22 routing/workspace/task/process/scanner/knowledge regression tests passed. Logs record Qwen3.5 local generation, and generated document artifacts are present. Browser and vision behavior has not been validated end to end in this review.',
 limitations: 'Seven profiles are configured, not seven independently evaluated model releases. Model Studio uses Pro/Max aliases for Meera/Vision and lists different Max quantizations from the backend policy. The live BF16 smoke run failed; memory cleanup and one role test also fail. No universal VRAM, speed, privacy, autonomous-task success, or signed macOS release guarantee is established.',
 nextStep: 'Unify model labels and quantization metadata, resolve the failing checks, and publish repeatable tests for the browser, visual inputs, document answers, and every model tier. Current app and browser screenshots are included; model configuration and completed-task examples can be added as they are documented.',
} as const;
