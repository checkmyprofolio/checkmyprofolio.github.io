# MeeraAI portfolio content evidence

Reviewed 15 September 2026, using the owner-authorized local checkout at
`C:/Coding/MeeraAI---The-Ultimate-Personal-AI-Assistant`.
The app checkout was not modified. No credentials, user databases, or model weights were copied.

The portfolio source of truth is `src/lib/meeraai-content.ts`. It supplies the dedicated
MeeraAI page, the Projects details, and portfolio chat knowledge.

## Current model mappings

- `Meera.py`, `MEERAAI_LOCAL_CATALOG`: seven canonical IDs, families, parameter labels,
  quantization policy, intended roles, and configured capability flags.
- `Meera.py`, `meera_production_profile`: configured context defaults (Edge 12,288;
  other tiers 16,384), not measured hardware guarantees.
- `desktop_frontend/src/App.tsx`, `MODEL_OPTIONS`: current chat labels match the backend.
- `desktop_frontend/src/services/curatedModels.ts`: Model Studio calls `meera` Pro and
  `meera-vision` Max. Its Max entry specifies IQ3_M / IQ2_M, while the backend prefers
  IQ4_XS for tier 5. These inconsistencies are explicitly described on the portfolio.
- `config/models.json` contains legacy IDs, misleading precision labels, and local
  selections. It was not treated as the current canonical seven-tier lineup.

## Implementation evidence

- `desktop_frontend/src/browser/MeeraBrowserShell.tsx`: Electron webviews, page extraction,
  summary/explanation/takeaway quick actions, tabs, history, bookmarks, reader, zoom, find,
  and export paths. Extension-store preview UI does not establish real extension support.
- `desktop_frontend/electron/main.ts`: browser window/webview setup, browser-tab IPC,
  native file saving, and backend/model integration.
- `Meera.py`: native GGUF runtime and llama-server selection, FastAPI chat and tool paths,
  document RAG, MCP manager, and separate Playwright browser automation. The Playwright
  session is not the visible Electron webview session.
- `document_generator.py` and `generated_documents/`: implemented export formats and
  existing artifacts, not a document-answer quality evaluation.
- `agent_runtime.py`, `workspace_manager.py`, `workspace_security.py`, `process_manager.py`:
  task events, edit acceptance/rejection, snapshots/diffs, scoped files, command risk,
  process output, and stop behavior.
- `meera_memory.py`, `personality_runtime.py`, `knowledge_store.py`, `agent_planner.py`:
  selective facts, roles, versioned knowledge, classification, task dependencies/retries.

## Checks actually rerun

```powershell
python -m unittest test_local_inference_policy test_agent_runtime test_workspace_manager test_workspace_security test_process_manager test_content_scanner test_knowledge_store -q
```

Result: **22 tests passed**, 30.388 seconds. Agent execution callbacks are mocked;
process tests launch real commands in temporary workspaces. No live inference or
external provider was called by this suite.

The function-based memory/personality tests were invoked directly using Python with
UTF-8 output because pytest was not installed:

- Memory: 3 passed, 6 failed during Windows SQLite temporary-file cleanup. Assertions
  print success before cleanup, but the full test is still counted as failed.
- Personality: 3 passed, 1 failed (`test_activation_detection_and_exit_are_natural`).

## Recorded runs, not rerun claims

- `llama-server-qwen35.log`: Qwen3.5 0.8B, 2B, and 4B IQ4_NL loads and generation timings.
  These do not prove answer quality or browser-task completion, and are not seven-tier benchmarks.
- `local_smoke.log`, `test_local_gguf_live.py`: older 0.8B BF16 run generates repetitive
  text and fails the HTTP smoke test on a 4,096-token context overflow; cloud was not used.
- Old benchmark prose reports 120ms planner latency, 99.4% memory recall, and 100% suites
  without reproducible support. Those figures were excluded.
- Browser end-to-end tasks, visual inputs, every model tier, GPU capacity, packaged
  launches, and signed/notarized macOS distribution were not validated in this review.

## Current screenshots

Nine owner-supplied screenshots in `Screenshots/` were visually inspected on 15 September
2026 and copied unchanged to `public/meeraai/screenshots/`. Their gallery metadata is in
`src/lib/meeraai-screenshots.ts`.

- 194113: startup splash -> `startup.png`
- 194119: main prompt workspace -> `workspace.png`
- 194126: Control Center About page -> `control-center.png` (not runtime configuration)
- 194138: empty agentic terminal -> `terminal.png` (not proof of task completion)
- 194157: loaded Lamborghini history webpage -> `browser-page.png`
- 194210: the article in reader mode -> `reader-mode.png`
- 194226: compact new-tab view -> `browser-new-tab.png`
- 194319: wider new-tab dashboard -> `browser-dashboard.png`
- 194426: conversation/project sidebar -> `session-sidebar.png`

All nine are in the selectable gallery. The workspace and browser are also used in the
hero and Projects details. The workflow section uses workspace/browser/terminal/Control
Center images. Preview frames preserve the full image, and popup viewers show the originals.
No model-library, loaded-model settings, generated-answer, or reviewed-diff screenshot
was supplied in this batch; these capabilities were not illustrated with unrelated images.
