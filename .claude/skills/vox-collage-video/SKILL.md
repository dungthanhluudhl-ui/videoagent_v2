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

Exactly one plan may be `active`; set a finished video to `shipped` in the same
workflow that ships it.

Canonical lifecycle: **SCRIPT/AUDIO → ALIGNMENT → SEMANTIC PLAN → ASSET DISCOVERY
+ LOCK → PREVIS-IN-PLACE → GLOBAL CONTACT SHEET → HUMAN APPROVAL → PROMOTE THE
SAME SOURCE → CONFORMANCE → ONE DRAFT → ONE TEMPORAL REVIEW → AT MOST ONE LOCAL
CORRECTION → FINAL.** No current `previs-approved` receipt means visual-previs;
a current receipt means promotion/build. Do not add another phase system.

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

3. **Discover and lock assets**
   - Manual image mode is default: `generate_board.py` prepares prompts/crops;
   - Lineage connects brief → generation/prompt → expected/returned file.
     `asset_manifest.py` carries processing, QA, acceptance and replacements;
     same-name byte changes invalidate. Batch cutouts skip unchanged source/config;
     cheap vision caches each file+brief+prompt/model independently.
   - Reuse valid artifacts. Record source and preserve authentic document text.
     Before previs, each scene records the chosen meaning-bearing asset(s) and one
     sentence saying why they carry the meaning, or why a code-drawn relationship
     is clearer than available authentic/context imagery. There is no photo quota.
   - Process only assets that actually need cutouts.

4. **Previs in production source, then promote that source**
   - Build bespoke production-compatible scene JSX with real locked assets. Design
     hierarchy, composition, source emphasis and OPEN/KEY actual pixels now; add MID
     only for a genuine three-state transformation. Defer motion, captions and final
     gate polish. `build_gate.py --previs` runs only reduced integrity appropriate
     to this phase.
   - `render_review_sheet.py <plan> --previs` renders the actual scene compositions,
     not a storyboard renderer. The whole-video contact sheet is where visual
     treatment is judged after contact with the real assets. A diagram chosen only
     because it was easier to code than an available meaning-bearing photo/context
     asset is the V17 failure pattern.
   - `pipeline_contracts.py approve-previs` freezes approved actual pixels, locked
     assets, evidence identity, semantic intent and the human art-direction note.
     Source hashes are provenance only. Changing a locked primary asset, dominant
     relationship, major composition, evidence region or visual mode reopens approval.
   - Promote the same scene source additively: narration anchors, purposeful motion,
     captions/master integration and readability polish. Do not throw approved JSX
     away and rebuild a production scene. `build_gate.py --previs-baseline` compares
     promoted OPEN/KEY pixels coarsely; easing, micro-position and polish may pass,
     material redesign may not.
   - Stable typography, safe zones, captions and evidence helpers are a compatibility
     layer, not a layout system. Direct bespoke JSX/CSS/Img/SVG remains first-class.
     Build bespoke first; distill a reusable primitive only after 2–3 shipped successes.
   - Anchor entrances to aligned narration using `beat_sync.py frame`; after approval,
     existing full gates and assembly remain authoritative.
   - Use `assemble.py input/scene_plan<N>.json`; generated master/captions remain
     plan-derived and script-authoritative.
   - Omitted `transitionIn` means an editorial hard cut. Request the existing
     `fade` only when continuity/passage of time benefits; other meaning-driven
     transitions belong in a deliberate handwritten master, not a variety quota.

5. **Review one temporal draft**
   - `render_video.py --mode draft` makes exactly one medium-resolution actual-master
     draft at normal FPS. `render_review_sheet.py` maps event samples to master
     frames, extracts stale items in one ffmpeg process, then derives temporal +
     summary sheets. No normal per-frame Remotion still fan-out.
   - Targeted full-res evidence selects document/text/pixel-sensitive declarations
     and manual escalations; draft pixels never replace source/text/edge inspection.
   - Compare the draft with approved previs only for motion fidelity, evidence
     readability, purposeful camera, narration sync, pacing/transition rhythm and
     motion-created defects. Do not rescore art direction unless drift is found.
   - A resolved quality fail is acknowledged/accepted debt, not a pass. Missing,
     stale, unreadable, or blank evidence is hard failure.
   - Cheap vision is an explicit review action: `review_vision.py <plan>`. Its
      per-item/per-sheet caches make unchanged work free and its per-video receipt
      records current completion. Stop checks that receipt and never calls a model.
      Open only flagged images; the pre-read image-context budget remains hard.

6. **Finish**
   - `assemble.py --check` must pass.
   - If needed, close one scene-local correction with
     `pipeline_contracts.py close-correction --changed-scenes S<ids>`; do not
     regenerate unrelated scene source.
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

**HARD INTEGRITY:** repair the objective local defect and rerun only affected
dependencies/gates. **EDITORIAL QUALITY:** semantic plan → actual-pixel previs →
approval → same-source promotion → one temporal review → at most one local correction
→ final. After the intended correction, report remaining debt explicitly; do not
rewrite unrelated scenes. A local S5 repair normally reopens S5 evidence/review and
only genuinely affected neighbor/global summaries.

## Execution and context management

Normal end-to-end production is one continuous Codex task following the canonical
lifecycle above. Do not ask the user to restart Codex between stages. Use
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