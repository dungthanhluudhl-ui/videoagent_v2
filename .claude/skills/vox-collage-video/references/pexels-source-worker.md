# Bounded Pexels PHOTO Source Worker

This is the canonical contract for VideoAgent 2's one Source Scout role. It is an
internal **ASSET LOCK** activity, not a lifecycle stage or scene-planning role.

## Input and runtime

Accept one compact JSON object, at most 2,048 UTF-8 bytes, containing exactly:

`needId`, `sceneId`, `anchorPhrase`, `mediaBrief`, `materialIntent`,
`shortCaseFacts`, `styleContract`, `orientation`.

Reject a transcript, whole PLAN, unrelated scenes, source trees, workflow history,
conversation history, giant skill text, and credentials. Read the API key only
through `fetch_pexels.py`; never copy it into any packet, file, telemetry, log, or
error. Do not delegate or spawn another agent.

Use a cheap/fast native worker model only when the host runtime actually exposes and
starts it. Prefer a fresh/isolated task when supported. Record only the observed
model and parent-context behavior; otherwise use `UNKNOWN`. Ordinary execution may
use `fallback-main`. `native-cheap-worker-required` must stop with
`BLOCKED — PEXELS_CHEAP_WORKER_NOT_AVAILABLE` before sourcing when no child actually
starts. Check a current disk result before spawning.

## Bounded operation

Use `.claude/skills/vox-collage-video/scripts/fetch_pexels.py scout` and Pexels PHOTO
search only. Initial search uses one compact query and at most eight results. Download
only medium/preview thumbnails for triage. If proven visual inspection finds no useful
candidate, exactly one refined query/search is allowed. There is no third search,
recursive loop, second worker, Pexels Video, other provider, or AI image handoff.

Inspect local thumbnails only when the actual runtime supports image inspection.
Judge semantic/mediaBrief match, requested subject/place/object specificity,
composition, framing, apparent quality, orientation, 9:16 crop potential,
styleContract compatibility, treatment usefulness, and obvious unwanted text or
watermark contamination. Record a thumbnail SHA-256 with every visual judgment.
Set `visualTriage` to `PASS` only with this actual inspection evidence; otherwise use
`NOT_PROVEN`. When real visual triage is required but unavailable, stop with
`BLOCKED — PEXELS_VISUAL_TRIAGE_NOT_AVAILABLE`.

This role is not a legal/content classifier. It does not perform face detection or
recognition, identity analysis, morality/legal-risk scoring, or automated restrictions
for investigative, legal, criminal, suspect, victim, or recognizable-person subject
matter. It does not reinterpret provider license metadata as a visual-quality gate.

Return zero to three candidates; do not pad the result. Download original/full files
only for those shortlisted candidates, using URL metadata retained from the existing
search. All files remain under:

`input/.videoagent/V<N>/candidates/<needId>/`

Never write/copy a final public asset, modify PLAN/JSX, lock or accept an asset, run
PREVIS, PROMOTE, review, render, or cleanup.

## Compact return

Write `worker_return.json` with exactly:

`needId`, `sceneId`, `workerMode`, `actualWorkerModel`,
`parentContextInherited`, `queryCount`, `candidateCount`, `rejectedCount`,
`visualTriage`, `refinementCount`, `workerWallSec`, `shortlist`.

Each shortlist item contains exactly:

`pexelsId`, `localOriginalPath`, `localThumbPath`, `pageUrl`, `photographer`,
`width`, `height`, `briefMatchNote`, `provenance`, `license`, `retrievedAt`.

Use the real Pexels page for `provenance`, factual retrieval time, and the compact
truthful provider value `Pexels License`. Omit raw API payloads, rejected-candidate
reasoning/details, headers, secrets, transcript/PLAN, and large vision reasoning.

The main agent owns final inspection, selection, art direction, copying one selected
file into `public/V<N>/assets/`, normal provenance/selection/hash fields,
`sync-assets`, and `accept-asset`. Shortlist rank is never acceptance.