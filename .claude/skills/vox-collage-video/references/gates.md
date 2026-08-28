# Gates — troubleshooting index

Code under `scripts/` is the source of truth for schemas, thresholds, exit codes
and CLI options. This file says where to look; it does not reimplement gates.

## Policy

**Integrity is hard; quality/aesthetics are advisory in production hooks.**
Standalone diagnostics may return non-zero for quality findings so they remain
useful when deliberately invoked. Use `--hook` where supported to see production
semantics.

## Automatic hooks

- **PreRead:** image-context budget only.
- **PostEdit on an active scene:** approval guard, then one scene-scoped
  `build_gate.py` subprocess. Text/icon/style scans are batch work.
- **Stop:** phase is inferred from scene statuses and existing review evidence.
  - planning: plan integrity;
  - building: plan + build integrity;
  - build complete: batch text, icon, cutout, asset, optional-block, assembly,
    and baseline diagnostics;
  - review exists: review evidence + pixel checks; Stop only checks the explicit
    per-video `review_vision.py` receipt and never invokes cheap vision.
- Each deterministic gate has a receipt over its true dependencies. Unchanged
  gates skip their subprocess; a cached hard result still blocks and identifies
  its details artifact. Unrelated file edits do not invalidate a gate.
- Asset and frame vision cache per item using file bytes + semantic brief +
  prompt/version + model. A changed item does not repay unchanged calls.
- One draft-extraction artifact supplies two views of actual-master evidence: temporal
  `frames[]` for transformation and one representative `frame` per scene in the
  scene-summary sheet for advisory cross-scene repetition. `vision_check --plan`
  follows those artifact paths instead of assuming a review directory.
- Gate file presence is always checked. `selftest.py` runs only when its existing
  source fingerprint is stale.

## Mechanisms

| Script | Protects | Production intent |
|---|---|---|
| `plan_gate.py` | readable schema, required meaning/structure, possible timing, valid anchors/assets, backed visual events | contract hard; pacing/coverage/density heuristics warn with `--hook` |
| `build_gate.py` | approved plan ↔ JSX contract | hard |
| `text_gate.py` | readable/importable text implementation | mechanical failures hard; style warns with `--hook` |
| `icon_gate.py` | registry/import integrity when icons are used | hard; zero icons valid |
| `asset_gate.py` | source file integrity and measurements | missing/unreadable hard; resolution/slot quality warns with `--hook` |
| `cutout_gate.py` | alpha/cutout mechanical measurements | missing/invalid hard in hook mode; quality findings remain visible |
| `block_gate.py` | declarations for optional blocks | invalid declaration hard; bespoke default and repetition advisory |
| `assemble.py --check` | generated captions/master/registration | hard when build is ready |
| `review_gate.py` | review artifact and rendered evidence | missing/stale/unreadable/blank hard; quality verdicts warn with `--hook` |
| `pixel_gate.py` | rendered text pixels vs implementation | hard when review evidence exists |
| `baseline_gate.py` | comparison metrics | advisory in Stop |
| cheap vision / `sheet_vision.py` | likely asset/frame/repetition issues | review-stage advisory only |

Normal review no longer launches one Remotion still process per sample. One
medium-resolution actual-master draft supplies incrementally extracted temporal
frames; a separate targeted full-resolution manifest protects document text,
small typography, crops, collisions and cutout/watermark edges.

`fail + resolved` means **acknowledged / accepted quality debt**. It remains a
visible warning and never becomes `pass`.

During the single broad correction pass, consider rendered flags, temporal and
scene-summary evidence, plan pacing/comprehension warnings, and resolved debt
together. Fix comprehension/evidence/transformation debt before cosmetics; this
is editorial ordering, not a severity taxonomy or a quality blocker.

## Invocation

```powershell
py -3 .claude/skills/vox-collage-video/scripts/<gate>.py --help
py -3 .claude/skills/vox-collage-video/scripts/plan_gate.py input/scene_plan<N>.json --hook
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/scene_plan<N>.json --scene S1
py -3 .claude/skills/vox-collage-video/scripts/review_gate.py input/scene_plan<N>.json --hook
py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/scene_plan<N>.json --check
```

When a check reports a problem, inspect its output and `--help`, then inspect the
corresponding script only if necessary. Do not weaken an integrity contract to
silence a quality preference, and do not add filler to satisfy a measurement.