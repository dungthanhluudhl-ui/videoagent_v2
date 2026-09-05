# Bounded Pexels PHOTO Source Worker

This is the canonical contract for VideoAgent 2's external Gemini/Pexels Source
Scout. It is an internal **ASSET LOCK** activity, not a lifecycle stage or
scene-planning role.

## Input and runtime

Accept one compact JSON object, at most 2,048 UTF-8 bytes, containing exactly:

`needId`, `sceneId`, `anchorPhrase`, `mediaBrief`, `materialIntent`,
`shortCaseFacts`, `styleContract`, `orientation`.

Reject a transcript, whole PLAN, unrelated scenes, source trees, workflow history,
conversation history, giant skill text, and credentials. `fetch_pexels.py` reads the
Pexels key independently. The worker reuses `vision_check.py`'s existing hidden
`VOX_VISION_KEY`/ignored local-key mechanism. Never copy either key into a packet,
file, telemetry, log, prompt, or error.

Canonical mode is `gemini-api` using the OpenAI-compatible router configured by
`VOX_VISION_BASE` (default `http://localhost:20128/v1`) and model configured by
`VOX_VISION_MODEL`/`--model` (default `ag/gemini-3.7-flash-high`). Python explicitly
constructs each external request from only the compact task prompt and optional local
image, so record `parentContextInherited = NO`. No Codex/Claude child, collaboration
tool, native model routing, or Luna capability is required.

For V20, `gemini-api` is required. Router, credential, model, multimodal, or strict
JSON failure must stop with `BLOCKED — GEMINI_CHEAP_WORKER_NOT_AVAILABLE`; MAIN must
not source or inspect every candidate as fallback. An explicitly labelled ordinary
`fallback-main` compatibility path may exist, but it is not V20 and proves no cheap-
worker economics. Check a current disk result before any new sourcing.

## Bounded operation

Use `.claude/skills/vox-collage-video/scripts/fetch_pexels.py scout <video> <packet>
--phase run` and Pexels PHOTO search only. Gemini first receives only the compact need
and returns strict `{"query":"..."}` optimized for the requested visual meaning.
Python performs the Pexels request, normalizes metadata, and downloads at most eight
medium/preview thumbnails.

Send each candidate image directly from disk to Gemini with only the compact semantic
need. Judge mediaBrief/subject/place/object specificity, generic filler risk,
composition, framing, orientation/9:16 crop usefulness, apparent source quality,
styleContract and visual-treatment usefulness, and obvious unwanted text/watermark
contamination. Require strict compact JSON containing `pexelsId`, boolean `useful`,
integer `fitScore` from 0–100, and short `briefMatchNote`; no chain-of-thought. Bind
the judgment cache to candidate bytes, compact semantic need including styleContract,
model, prompt version, and vision implementation version. Malformed output cannot make
a candidate useful.

If and only if the initial judgments retain no useful candidate, Gemini receives the
original compact need plus only “initial search produced no sufficiently relevant
candidate” and may return exactly one refined query. Python performs one final search
and Gemini judges its thumbnails. There is no third search, recursive loop, second
worker, Pexels Video, other provider, or AI image handoff.

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

Gemini is the semantic brain. Python owns Pexels HTTP, candidate normalization,
thumbnail/original downloads, hashes, paths, retries, cache/receipts, provenance,
retrieval timestamps, and serialization. MAIN receives `worker_return.json` and at
most the 1–3 shortlist images if needed; rejected thumbnails do not enter MAIN context.

## Compact return

Write `worker_return.json` with exactly:

`needId`, `sceneId`, `workerMode`, `actualWorkerModel`, `parentContextInherited`,
`router`, `geminiModel`, `geminiCallCount`, `geminiQueryCalls`, `geminiVisionCalls`,
`geminiInputTokens`, `geminiOutputTokens`, `geminiTotalTokens`, `geminiWallSec`,
`pexelsQueryCount`, `candidateCount`, `thumbnailDownloads`, `originalDownloads`,
`shortlistCount`, `rejectedCount`, `visualTriage`, `refinementCount`, `workerWallSec`,
`shortlist`.

Each shortlist item contains exactly:

`pexelsId`, `localOriginalPath`, `localThumbPath`, `pageUrl`, `photographer`,
`width`, `height`, `briefMatchNote`, `provenance`, `license`, `retrievedAt`.

Use the real Pexels page for `provenance`, factual retrieval time, and the compact
truthful provider value `Pexels License`. Omit raw API payloads, rejected-candidate
reasoning/details, headers, secrets, transcript/PLAN, and large vision reasoning.
Gemini call counts are factual. Token fields use router-reported usage only and remain
`UNKNOWN` when absent; never estimate. MAIN tokens/context remain `UNKNOWN` unless a
trustworthy harness supplies counters, and no savings claim is made before V20.

The main agent owns final inspection, selection, art direction, copying one selected
file into `public/V<N>/assets/`, normal provenance/selection/hash fields,
`sync-assets`, and `accept-asset`. Shortlist rank is never acceptance.