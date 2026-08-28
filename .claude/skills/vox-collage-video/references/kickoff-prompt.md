# Minimal kickoff launcher

Use this to start the normal continuous production task or an optional recovery /
continuation. Do not paste a second copy of the workflow.

```text
Use the current `vox-collage-video` workflow.

Project/video identifier: <N or name>
Audio: <path>
Authoritative script: <path or pasted text>
Requested output: <end-to-end production / plan / continued build / reviewed stills / final requested file>

Reuse valid existing artifacts when continuing. Use manual image mode unless I
explicitly request live generation. Follow the workflow's current integrity-hard,
quality-advisory policy. Do not commit or push unless I explicitly approve it.
Treat receipts/contracts on disk as memory: return compact stage summaries and
load only unresolved exceptions plus artifacts required for the requested stage.
```

Normal end-to-end production continues in this Codex task through PLAN → SOURCE →
BUILD → actual-master REVIEW → one targeted editorial CORRECTION → delta REVIEW
as required → FINAL. Do not restart Codex between stages. Let the runtime's native
context management or compaction manage the continuous task when available.

For an optional continuation after a real session boundary, identify the existing
`scene_plan<N>.json` and requested next output; do not regenerate completed timing,
assets, scenes, or review evidence. Do not paste prior logs, prompt packs, clean
item reports, or unrelated scene history into the continuation.

When recovery, deliberate stage separation, or another actual continuation
boundary needs a checkpoint, the deterministic handoff form is available:

```text
Use the current `vox-collage-video` workflow.
Continue <V> from <absolute handoff artifact path>.
Perform <BUILD / REVIEW / CORRECTION / FINAL>.
Load only artifacts named by the handoff plus directly required dependencies.
```

Receipts, manifests, plans and handoffs are persistent pipeline state; they reduce
what must be reloaded but do not shrink an already-open model context. A handoff
does not itself require another session. Bounded worker packets also reduce input
material, but do not create an isolated LLM context unless the runtime supplies
an actually isolated worker.