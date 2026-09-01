---
name: vox-collage-video
description: PREVIS-in-place workflow for narrated legal and investigative Remotion videos. Human art direction approves actual pixels; deterministic gates protect integrity.
---

# Videoagent 2 — PREVIS in place

## Authority and policy

This file is the runtime orchestration authority. Script `--help` and current
code are mechanical truth. Load `references/visual-language.md`,
`references/primitives.md`, or `references/gates.md` only for the current task.
Search `worked-examples.md` or `lessons.md` only when precedent is needed; never
read the lesson archive end-to-end as a production ritual.

**Integrity is HARD. Quality and aesthetics are ADVISORY.** Human approval of
the whole-video PREVIS contact sheet owns art direction. Gates own mechanical
truth: plan validity, locked bytes, actual evidence, same-source promotion,
approved-pixel conformance, text safety, assembly, and review currentness.

The default lifecycle is exactly:

1. **INGEST**
2. **PLAN**
3. **ASSET LOCK**
4. **PREVIS**
5. **PROMOTE**
6. **REVIEW + FINAL**

PREVIS uses actual production source. It is not a storyboard implementation,
template pass, generic renderer, or alternative scene representation. The same
bespoke JSX is promoted. No layout DSL, block library, archetype, template
system, database, scheduler, or orchestrator is required. The generic renderer
and layout/template production route are retired.

## Canonical video layout

New `V<N>` work lives here; `stage_state.video_paths()` is the only path authority:

```text
input/V<N>/                       public/V<N>/
  scene_plan.json                   audio.mp3
  transcript.json                   assets/
  words_aligned.json
  asset_manifest.json             src/videos/V<N>/
  review.json                       Master.jsx
  previs/                           captions.js
    contact_sheet.png               shared.jsx
    frames_manifest.json            scenes/S01.jsx ...
    frames/

out/V<N>/draft/master.mp4         input/.videoagent/V<N>/
out/V<N>/review/                    receipts/ cache/ logs/
out/V<N>/final/master.mp4           economics.jsonl
```

Do not migrate historical V3–V17 trees while producing a new video. Generated
`src/index.ts` registers only `PrevisRoot`; production roots are not operational
dependencies.

## 1. INGEST

Start from the user's script and audio:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/init_video.py <N> --audio <audio> --script <script>
```

Script text is authoritative; Whisper supplies timing. Inspect alignment before
accepting a preserved hand edit. Do not overwrite accepted alignment casually.
Then scaffold canonical state:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/new_video.py <N> --words input/V<N>/words_aligned.json
```

## 2. PLAN

Write semantic intent before components. Every scene answers:

- `narrativeFunction`: what the scene does in the argument;
- `viewerQuestion`: the one question raised or answered;
- `visualTransformation`: what relationship/state the viewer watches change;
- `contrastWithPrevious`: why this scene is not the previous treatment again;
- `visualLanguage`, backdrop, density, comprehension intent;
- authentic evidence/asset need and `evidenceRegions` where a source claim is cited.

Meaning order is **narration → treatment → evidence/asset → component**. Show the
relationship, not merely the topic. Do not add symbols, diagrams, labels, lines,
layers, or motion as filler.

Run `plan_gate.py input/V<N>/scene_plan.json`. Present the semantic plan to the
user, set `shotlistApproved: true` only after approval, then run:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py approve-plan input/V<N>/scene_plan.json
```

PLAN is valid before any PREVIS frame or source exists.

## 3. ASSET LOCK

Select authentic meaning-bearing assets and store them under
`public/V<N>/assets/`. For each meaning-bearing plan asset:

- record semantic identity, role, rationale, and evidence identity/regions;
- set `locked: true` and `lockedSha256` to the actual byte hash;
- sync/accept `input/V<N>/asset_manifest.json` where applicable;
- never let a same-name replacement inherit stale acceptance.

`build_gate.py` checks existence, readability, locked bytes, and actual use. A
direct bespoke `<Img src={staticFile("V<N>/assets/doc.png")} />` is first-class;
no named component, template, or generic renderer is mandatory.

## 4. PREVIS

Author bespoke production-compatible scenes directly in
`src/videos/V<N>/scenes/S01.jsx`, `S02.jsx`, and so on. PREVIS authoring is legal
before PREVIS approval. Use final assets, real evidence crops, real typography,
and the intended composition. Rough motion is optional; pixels are not fake.

Generate captions/registration as needed and check rough source:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/V<N>/scene_plan.json --previs
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs
```

`--previs` renders the real scene compositions to:

- one OPEN PNG per scene;
- one KEY PNG per scene;
- MID only when explicitly declared;
- `previs/frames_manifest.json` with frame roles/paths/hashes;
- one whole-video `previs/contact_sheet.png`.

Show that one contact sheet to the user. Ask for art-direction approval. Do not
infer approval from a gate or from the existence of files. Record the human note:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py approve-previs input/V<N>/scene_plan.json --art-direction "<human note>"
```

Creative approval binds semantic/treatment/evidence intent, locked asset bytes,
approved OPEN/KEY/MID pixels, contact sheet, and the human note. Source SHA is
provenance only. Timing, transitions, easing, statuses, receipt IDs, and JSX byte
changes alone do not stale creative approval.

## 5. PROMOTE

Promote the **same JSX** by adding motion, timing, captions, and transitions in
place. Do not redraw approved scenes in a second implementation. An approved
meaning-bearing element must remain mounted at its approved state: animate
opacity/transform/reveal, but do not move it behind a late `Sequence` that makes
it absent at approved OPEN/KEY.

Regenerate canonical assembly, render the approved roles from promoted source,
and enforce conformance:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/V<N>/scene_plan.json
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs --promoted
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/V<N>/scene_plan.json --previs-baseline
```

Material approved-pixel drift, locked asset changes, missing approved elements,
or stale approval are hard failures. Resolve them before draft command creation.

## 6. REVIEW + FINAL

After current approval and conformance, create exactly one draft:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/render_video.py input/V<N>/scene_plan.json --mode draft
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json
```

The temporal review is separate from PREVIS. Review the actual master for motion,
timing, captions, transitions, evidence readability, and new temporal defects.
Fill `input/V<N>/review.json`; run `review_gate.py`. `review_vision.py` is an
explicit advisory tool and Stop never invokes a model.

Make **at most one local correction** to one scene when needed. Do not regenerate
unrelated scenes. Recheck the affected evidence and close it:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py close-correction input/V<N>/scene_plan.json --changed-scenes Sxx --note "<local correction>"
```

Then run `assemble.py --check` and render exactly one full-resolution final:

```powershell
py -3 .claude/skills/vox-collage-video/scripts/render_video.py input/V<N>/scene_plan.json --mode final
```

Final rendering requires current review/correction state. Mark `status: shipped`
only after PREVIS approval, promoted conformance, draft review, correction closure,
and final integrity are current. Shipping status is not aesthetic approval.

## Enforcement surface

The unconditional Stop installation is exactly:

`plan_gate.py`, `build_gate.py`, `text_gate.py`, `assemble.py`,
`review_gate.py`, `selftest.py`.

`icon_gate.py` and `cutout_gate.py` are conditional only when applicable.
Initial planning and PREVIS authoring do not require PREVIS pixels/approval.
Once promoted, draft, review, or final state exists, Stop requires current real
PREVIS approval, promoted baseline conformance, and downstream integrity. Stop is
a consistency guard, not an orchestrator.

## Correction and context discipline

Repair hard integrity defects until mechanically valid. Do not optimize toward
quality metrics; quality remains rendered editorial judgment. Persist state in
plans, manifests, receipts, review artifacts, and optional handoffs. Do not build
a custom scheduler or packet system. Do not ask for a fresh session between
stages unless the user requests a real continuation boundary.