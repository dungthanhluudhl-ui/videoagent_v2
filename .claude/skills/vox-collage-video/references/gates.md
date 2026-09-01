# Gates — PREVIS-in-place troubleshooting

Code and each script's `--help` are mechanical truth. Integrity is hard;
quality/aesthetics are advisory.

## Unconditional Stop installation — exactly six

| Script | Hard truth protected |
|---|---|
| `plan_gate.py` | semantic plan schema, meaning, evidence anchors, coherent timing |
| `build_gate.py` | locked assets are present/readable/used; bespoke PREVIS matches intent; promoted OPEN/KEY pixels conform |
| `text_gate.py` | source geometry plus rendered clipping, absence, overflow, and unsafe visible-text contrast when review pixels exist |
| `assemble.py` | canonical captions/master and isolated `PrevisRoot` registration |
| `review_gate.py` | one current temporal review generation with actual-master evidence |
| `selftest.py` | deterministic specification of the gates and lifecycle boundaries |

Conditional only when applicable:

- `icon_gate.py`: source actually uses registered icon components;
- `cutout_gate.py`: the plan actually uses hero/support cutouts.

`review_vision.py` is an explicit advisory review tool. Stop never invokes a
model. There is no unconditional baseline, asset, block, or separate pixel gate.

## Phase behavior

- PLAN is legal with no scene JSX or PREVIS pixels.
- PREVIS authoring is legal after the semantic plan is approved and before human
  PREVIS approval.
- `render_review_sheet.py --previs` creates actual OPEN/KEY evidence and one
  whole-video contact sheet from production scene source.
- `approve-previs` requires current plan approval, locked meaning-bearing bytes,
  required frame hashes, contact sheet, and a non-empty human note.
- `--previs-baseline` compares promoted actual pixels to approved actual pixels
  and rejects approved elements that are no longer mounted at approved frames.
- Draft command construction is impossible without current approval and current
  promoted conformance.
- Once promoted/draft/review/final state exists, Stop requires those receipts and
  relevant downstream integrity. Stop does not create them.
- Final also requires canonical review and the at-most-one-local-correction closure.

## Normal invocation

```powershell
py -3 .claude/skills/vox-collage-video/scripts/plan_gate.py input/V<N>/scene_plan.json --hook
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/V<N>/scene_plan.json --previs
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs
py -3 .claude/skills/vox-collage-video/scripts/pipeline_contracts.py approve-previs input/V<N>/scene_plan.json --art-direction "human note"
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/V<N>/scene_plan.json --previs --promoted
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/V<N>/scene_plan.json --previs-baseline
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/V<N>/scene_plan.json --check
```

Do not weaken an integrity rule to accommodate a quality preference. Do not add
decoration to satisfy a metric. Fix missing evidence/bytes/pixels/currentness;
judge art direction from the human-approved contact sheet and actual draft.