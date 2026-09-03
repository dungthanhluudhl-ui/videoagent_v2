---
name: vox-collage-video
description: V18-rebuilt semantic editorial, evidence-integrity, PREVIS-in-place workflow for narrated Remotion videos.
---

# VideoAgent 2

## Product contract

Lifecycle: **INGEST → PLAN → ASSET LOCK → PREVIS → HUMAN PREVIS APPROVAL → PROMOTE → REVIEW + FINAL**.

PREVIS is production source, not a storyboard implementation. Human approval is
of actual selected media, crop, typography, composition, layers and pixels. PROMOTE
modifies that same scene JSX only to add temporal behavior. Remotion registers,
renders and proves the actual source; it is not a scene generator or replacement DSL.

The creative policy is **SEMANTIC TREATMENT / GRAPHICS-BY-EXCEPTION**. Preserve
meaningful editorial scene boundaries and decide each scene's treatment from its
`narrativeFunction`, `viewerQuestion`, and what its `visualTransformation` must make
visible. Source authority and visual treatment are separate decisions. An official
PDF may be the best factual authority without being the best visual plate for a
location, action, detention, phone call, family pressure, transfer, chronology, or
spatial beat. For those beats first consider truthful authentic/contextual material,
a clearly labelled photographic reconstruction, map, contextual timeline, or another
honest real-world treatment. Exact wording, quoted holdings, paragraph identity,
statutory language, evidence statements, and source identity may be strongest as
document evidence. A document-only recount needs a concrete approved reason why a
depiction would mislead or fabricate.

Ask: **What must become visible or understandable for this narration beat?** Category
filler is not an answer. There is no media, document, reconstruction, map, chart,
diagram, layer, motion, transition, icon, or text percentage quota. Relation diagrams
remain an approved exception; they are not the default for abstract narration.

## Canonical paths

`stage_state.video_paths()` is the sole path authority:

```text
input/V<N>/scene_plan.json          public/V<N>/audio.mp3
input/V<N>/transcript.json          public/V<N>/assets/<selected files>
input/V<N>/words_aligned.json       src/videos/V<N>/scenes/Sxx.jsx
input/V<N>/asset_manifest.json      src/videos/V<N>/timing.js (generated)
input/V<N>/previs/frames/           src/videos/V<N>/Master.jsx
input/V<N>/previs/review_pages/     out/V<N>/draft/master.mp4
input/V<N>/review.json              out/V<N>/review/pages/
input/.videoagent/V<N>/             out/V<N>/final/master.mp4
```

Fresh scene source may import only canonical `src/primitives/`, Remotion/normal
external package libraries, and generated `timing.js`. Arbitrary per-video visual
or helper modules are outside the fresh production boundary. Historical V3–V17
files remain in place but are not a reusable production kit.

## 1. INGEST

```powershell
py -3 .claude/skills/vox-collage-video/scripts/start_video.py <N> --audio <audio> --script <script>
```

This one entry checks the environment, copies audio, transcribes, aligns script
words to speech, initializes canonical directories, and writes an incomplete
semantic plan skeleton. Script text is WHAT; aligned words supply WHEN.

## 2. PLAN

Each fresh scene contains only editorial intent:

- `id`, `startSec`, `endSec`;
- `narrativeFunction`, `viewerQuestion`, `visualTransformation`;
- `contrastWithPrevious`, `comprehensionLoad`, `visualTreatment`;
- `materials[]`: `id`, `anchorPhrase`, `mediaBrief`, `materialIntent`;
- source/evidence identity/regions where applicable;
- `diagramJustification` only for `diagram-exception`.

`visualTreatment` is compact free editorial wording such as authentic, contextual,
document, reconstruction, map, timeline, chart, relation, or genuinely textual/quote
treatment. It is not a component selector or closed JSX taxonomy. PLAN deliberately
checks scene-to-scene contrast and advises on suspicious near-equal duration runs,
consecutive high-comprehension load, implausibly short complex scenes, insufficient
post-anchor legibility, repeated treatment families, and transformation wording that
only repeats crop/zoom/shift/center/reframe. Pacing and modality monotony are normally
editorial advisories; dishonest treatment or non-semantic transformation claims fail.

Do not put template/backdrop/variant/component/geometry/delay/visibleFor/frame or
`durationInFrames` in a fresh plan. Duration is mechanically derived from
start/end/fps. Run `plan_gate.py`, obtain human shot-list approval, set
`shotlistApproved: true`, then record `approve-plan`.

## 3. ASSET LOCK

Real-media intents must bind to real files in `public/V<N>/assets/`. CSS gradients
and SVG drawings cannot satisfy authentic/contextual/document/reconstruction.
Selected bytes require `lockedSha256`; non-PDF external media adds compact
`provenance`, `license`, and `retrievedAt`. `official:` or
`local-authoritative:` provenance may truthfully omit URL-style metadata.

```powershell
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py sync-assets input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py accept-asset input/V<N>/scene_plan.json Sxx:<materialId>
```

A same-name byte or brief replacement resets acceptance. If ASSET LOCK needs a
Pexels photo, use **NATIVE-FIRST + BOUNDED FALLBACK-MAIN** sourcing. When the
runtime exposes native delegation, attempt Source Scout delegation exactly once.
Set `sourceScoutMode` to `native` only if that child starts; if delegation is
unavailable or that one spawn fails, do not retry it: set `sourceScoutMode` to
`fallback-main` and have the main agent execute the identical bounded contract.

The contract is one approximately ≤2 KB need brief (`sceneId` or compact related
`needId`, `anchorPhrase`, `mediaBrief`, `materialIntent`, `shortCaseFacts`, and
`styleContract`), ≤8 candidates, and ≤1 sourcing refinement total. It excludes
whole transcripts/plans and unrelated repository context, forbids recursive
agents, and permits discovery writes only under
`input/.videoagent/V<N>/candidates/<needId>/` — never `src/`, `input/V<N>/`, or
`public/V<N>/`. The main agent selects and locks the final asset and owns material
intent/art direction. `.claude/agents/source-scout.md` is a retained
Claude-compatible role description, not proof of Codex-native delegation.

When `sourceScoutMode` is `fallback-main`, product/workflow/wall-time/Pexels and
PREVIS/PROMOTE results remain evaluable, but subagent economics, main-context
savings, and worker-token savings must be recorded as **NOT PROVEN — native Codex
delegation unavailable/failed**, never PASS.

## 4. PREVIS

Compose actual material in `src/videos/V<N>/scenes/Sxx.jsx`. Use the compact
`src/primitives/` surface or direct Remotion JSX. Default primitives are static:
no hidden reveal, camera drift or decorative motion during PREVIS.

```powershell
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py approve-previs input/V<N>/scene_plan.json --art-direction "<human note>"
```

PREVIS keeps high-resolution frame/hash evidence and creates compact JPEG review
pages ≤4 MP. Inspect one page at a time. `LayoutSafety` measures actual browser DOM
geometry for direct bespoke JSX; source parsing remains only a historical fast check.

## 5. PROMOTE

Edit the approved scene files in place. Add only meaning-bearing reveals, timing,
easing, camera travel, parallax, document focus, map/chart reveal, transitions,
caption integration and polish. A genuinely static scene may remain unchanged.

For each meaning-bearing `Reveal`, use a plan `anchorPhrase` and generated
`PROMOTION_TIMING["Sxx:<materialId>"]`. Resolve/check it with:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/beat_sync.py resolve-plan input/V<N>/scene_plan.json
```

Manual timing requires `anchorPhrase: "manual — <specific reason>"` and matching
`manualReason` in source. Ambient camera motion does not require a speech anchor.

```powershell
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs --promoted
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/V<N>/scene_plan.json --previs-baseline
```

Approval stores each scene's source/helper/primitive/asset/render/font/tool
fingerprint. Unchanged scenes explicitly reuse approved baseline identity with no
Remotion still. Changed dependencies render only affected approved roles; global
font/config/tool changes invalidate every affected scene.

A first global PROMOTE run cannot close as useful when every promotable scene is
dependency-identical to its approval baseline. An individual scene may remain static.
A wholly static treatment is also legal only when every scene records a specific
`intentionalStaticRationale`; subsequent zero-change conformance checks still reuse
all approved identities with zero Remotion subprocesses.

## 6. REVIEW + FINAL

After conformance, render one medium-resolution master draft. Temporal extraction
uses bounded ffmpeg batches (≤40 unique master frames), verifies every requested
identity/count, preserves manifest ordering, and paginates review proxies ≤4 MP.
Canonical high-resolution evidence remains separate.

```powershell
py -3 .claude/skills/vox-collage-video/scripts/render_video.py input/V<N>/scene_plan.json --mode draft
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/review_gate.py input/V<N>/scene_plan.json
```

Cheap vision scripts are advisory and Stop invokes no model. Make at most one local
correction decision, close it with `pipeline_contracts.py close-correction`, then
render the single full-resolution final. Cleanup is always explicit and dry-run by
default:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/cleanup.py input/V<N>/scene_plan.json
```

Never auto-delete selected assets, plan/transcript/alignment/manifest, production
source, essential receipts, canonical PREVIS baseline evidence, or final delivery.

## Truth and enforcement

Integrity gates are `plan_gate.py`, `build_gate.py`, `text_gate.py`, `assemble.py`,
`review_gate.py`, and `selftest.py`. `icon_gate.py` and `cutout_gate.py` are
conditional historical capabilities. Stop is a currentness guard, not an
orchestrator, model caller, renderer, cleanup trigger, or aesthetic scorer.

`economics.jsonl` stores factual stage metrics. Main-agent token/context values are
`UNKNOWN` because this harness exposes no trustworthy counters; never estimate them.