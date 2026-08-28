---
name: vox-collage-video
description: Videoagent 2 workflow for narrated legal and investigative documentary videos in Remotion. Meaning and authentic evidence lead; integrity is hard, quality is advisory.
---

# Videoagent 2

## Authority

This file orchestrates the workflow. Current scripts and component code are the
mechanical truth. References are lazy-loaded by topic; they are not a mandatory
reading bundle.

Final accepted V10/V11 output is the product-quality reference, never a literal
template. Do not edit shipped V10/V11 sources or golden media to make new work
pass. Build new scenes bespoke by default; the parked block library is optional.

**Policy: integrity is HARD. Quality and aesthetics are ADVISORY.** A gate may
block broken plans, missing assets, plan/build drift, invalid imports, malformed
assembly, or missing/stale/blank review evidence. Pacing, density, repetition,
composition and other quality signals remain visible but rendered evidence and
editorial judgment decide them.

## Core editorial order

**NARRATION MEANING → VISUAL TREATMENT → EVIDENCE/ASSET NEED → COMPONENT.**

### Compact director contract

Show the **relationship**, not merely the topic. Mechanism means setup/attempt →
consequence/failure; reversal means one state visibly gives way; “not X but Y”
must show X before negation/replacement. Quantity must be perceived, not merely
read as a numeral, and comparison must create a real spatial relation.
`visualTransformation` promises a visible state change, not prose metadata.
Authentic evidence should support the claim, but document evidence does not imply
one centered document-card composition. Add a second treatment only when it adds
meaning. Use `worked-examples.md` lazily when a difficult decision needs precedent.

Prefer authentic, relevant visuals: source documents, real places, specific
people/objects, maps, and source-preserving crops. Generated imagery must still
be relevant and honest. Do not use generic symbols, decorative diagrams, icons,
lines, grids, labels, or extra layers as filler. Zero-icon videos are valid.

Write each scene's `visualTransformation`: what the viewer watches change or
become clear. Then select a visual language. Use a diagram only when a relation,
process, geography, quantity, or legal structure is clearer drawn than shown.

New cutouts use `EditorialHero` / `EditorialSupport`: entrance, settle, hold.
Continuous sway/tremble/bob is explicit opt-in for an editorial reason. Legacy
`Hero` / `Support` remain available for shipped composition compatibility.
The camera is also stable by default: no automatic Ken Burns drift or slow zoom.
Move it only for a semantic event such as context → detail/evidence, reveal,
authority takeover, or spatial displacement.

## Pipeline and state

Disk is authoritative pipeline memory. Receipts under `input/.videoagent/<V>/`
bind true inputs/tool/config to outputs. After closure, load only the compact
contract, required artifacts and editorial exceptions—not prior logs, prompt
packs, clean reports, unrelated code or reasoning. Changed inputs reopen only
their stage.

1. **Initialize timing**
   - New work: `init_video.py <N> --audio <file> --script <file>`.
   - Script-authoritative alignment supplies timing. Content receipts close
     audio/transcription/alignment; script-only changes reuse transcription and
     reopen alignment. Never overwrite/rebind manual alignment without acceptance.

2. **Plan**
   - Scaffold with `new_video.py <N> --words input/words<N>_aligned.json`.
   - Fill editorial meaning, timing, visual language, assets/anchors, real
     `visualEvents`, and implementation intent.
   - A document used only for context/authority may stay whole or cropped. A
     document cited as proof should normally map exact narrated phrases to
     normalized source `evidenceRegions`; timing comes from aligned words.
   - Run `plan_gate.py input/scene_plan<N>.json --hook`: integrity failures
     block; quality/editorial heuristics warn. Use strict standalone mode only
     for deliberate diagnostics.
   - Before sourcing/build, perform one whole-plan treatment preflight. Review
      exact advisory clusters and shared planned grammar; preserve authentic
      evidence and change spatial treatment only when meaning benefits. This is
      one director pass, not a quota, blocker, or automatic rewrite.
   - Present the shot list before sourcing unless the user explicitly requested
     end-to-end execution. Set `shotlistApproved` only after approval.
   - `pipeline_contracts.py approve-plan <plan>` closes a valid approved plan
     against narration/timing, sources, style and content. Advisories do not loop.

3. **Source**
   - Manual image mode is default: `generate_board.py` prepares prompts/crops;
   - Lineage connects brief → generation/prompt → expected/returned file.
     `asset_manifest.py` carries processing, QA, acceptance and replacements;
     same-name byte changes invalidate. Batch cutouts skip unchanged source/config;
     cheap vision caches each file+brief+prompt/model independently.
   - Reuse valid artifacts. Record source and preserve authentic document text.
   - Process only assets that actually need cutouts.

4. **Build**
   - Freeze global plan/visual/authenticity, then emit bounded adjacent-scene
     `worker-packet`s. Native subagents may own non-overlapping chunks; otherwise
     use packets sequentially—no custom scheduler. Bespoke JSX stays first-class;
     the main agent retains global summary/rhythm/repetition/final judgment.
   - Build bespoke scene compositions from current primitives.
   - Anchor entrances to aligned narration using `beat_sync.py frame`.
   - Keep plan and source synchronized; PostEdit runs immediate build/contract
     integrity only. Text/icon/asset/cutout checks run later as a batch.
   - Use `assemble.py input/scene_plan<N>.json`; generated master/captions remain
     plan-derived and script-authoritative.
   - Omitted `transitionIn` means an editorial hard cut. Request the existing
     `fade` only when continuity/passage of time benefits; other meaning-driven
     transitions belong in a deliberate handwritten master, not a variety quota.

5. **Review rendered evidence**
   - `render_video.py --mode draft` makes one medium-resolution actual-master
     draft at normal FPS. `render_review_sheet.py` maps event samples to master
     frames, extracts stale items in one ffmpeg process, then derives temporal +
     summary sheets. No normal per-frame Remotion still fan-out.
   - Targeted full-res evidence selects document/text/pixel-sensitive declarations
     and manual escalations; draft pixels never replace source/text/edge inspection.
   - Inspect temporal evidence against `visualTransformation` and the summary
     sheet for cross-scene composition. In the one broad correction pass, read
     these pixel findings together with outstanding plan pacing/comprehension/
     dead-air advisories and acknowledged quality debt. Warnings are clues, not
     score targets, and may remain when narrative/rendered evidence supports it.
   - Prioritize defects that materially affect comprehension, evidence location,
     source honesty, visible transformation, legal-conclusion timing, or major
     composition repetition before minor cosmetic debt.
   - A resolved quality fail is acknowledged/accepted debt, not a pass. Missing,
     stale, unreadable, or blank evidence is hard failure.
   - Cheap vision is an explicit review action: `review_vision.py <plan>`. Its
      per-item/per-sheet caches make unchanged work free and its per-video receipt
      records current completion. Stop checks that receipt and never calls a model.
      Open only flagged images; the pre-read image-context budget remains hard.

6. **Finish**
   - `assemble.py --check` must pass.
   - Close the one broad correction with `pipeline_contracts.py close-correction`.
     Render exactly one final full-resolution MP4 with `render_video.py --mode final`
     when requested; final scale remains 1.0 and normal production quality.
   - Mark `status: "shipped"` only after mandatory mechanical artifacts are
     complete and review evidence exists. It records pipeline/build completion;
     it is not by itself user or product-quality approval.
   - Never commit or push unless explicitly approved.

Scene state progresses `planned → built → reviewed`; top-level workflow state is
`active → shipped`. Existing artifacts infer the hook phase; do not add a second
phase system.

Scripts/workers return `STATUS`, `HARD`, `ADVISORY`, changed artifacts, unresolved
questions, details and receipt; hard issues stay explicit, successful logs/reasoning
stay on disk. `economics.jsonl` records timing/cache/subprocess/vision/render facts;
unavailable main-token usage is `UNKNOWN`.

## Correction policy

**HARD INTEGRITY:** repair the objective local defect, rerun only affected
dependencies/gates, and repeat only until mechanically valid. **EDITORIAL
QUALITY:** director/plan → early preflight → build → actual-master review → one
targeted correction → delta review → final. Do not optimize until a metric turns
green. After the intended correction, report remaining aesthetic debt explicitly;
do not rewrite unrelated scenes to silence an advisory. A local S5 repair normally
reopens S5 evidence/review and only genuinely affected neighbor/global summaries.

## Execution and context management

Normal end-to-end production is one continuous Codex task: **PLAN → SOURCE →
BUILD → actual-master REVIEW → one targeted editorial CORRECTION → delta REVIEW
as required → FINAL**. Do not ask the user to restart Codex between stages. Use
the runtime's native context management or compaction for a long continuous task
when available; do not build a custom compaction or orchestration system.

Disk receipts, manifests, plans and handoff artifacts are authoritative persistent
pipeline state. They reduce what a task needs to reload, but do not shrink an
already-open model context. Existing bounded worker packets likewise narrow the
material a task needs to read; unless the runtime actually provides isolated
workers, a packet is not a new LLM context or a context reset.

`pipeline_contracts.py handoff` remains an optional checkpoint for a real
continuation boundary: recovery after interruption, an intentionally separate
session, user-requested stage separation, or explicit delegation where the
environment provides isolation. Creating a handoff does not require another
session and is not part of the default continuous production path.

## Reference routing

Read `.claude/skills/vox-collage-video/references/README.md` for the existing
index. Load only the topic that applies: visual language while choosing a
treatment, primitives while implementing, animation variants while designing
motion, gates while troubleshooting enforcement, and lessons by searching for a
relevant known defect. Official Remotion skills under `.agents/skills/` apply to
their specific topics and must match the installed Remotion version.

Use each script's `--help` for current commands/options. Do not duplicate its
thresholds or turn this file back into a procedural manual.