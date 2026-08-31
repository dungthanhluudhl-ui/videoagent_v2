# PREVIS-IN-PLACE V18 validation failure

## Result

The milestone stopped after Human Checkpoint 2 and before any full V18 draft.
Hard stop 14 was triggered: the benchmark required a gate/framework repair after
full-production approval had begun.

## Factual trigger

After the user returned `APPROVE PREVIS`, the existing full `build_gate.py` could
not read direct bespoke `src={staticFile("...")}` image JSX and could not recognize
an explicit direct-bespoke code-drawn treatment. The gate was changed to recognize
file identity and an explicit `data-visual-treatment` declaration without parsing
layout. Focused synthetic tests passed, but making that gate repair after approval
violates the benchmark's no-architecture/gate-repair condition.

After task resumption, the working tree also accumulated bounded same-source
promotion timing/easing and source/plan synchronization needed to validate the
stopped candidate. Those changes are preserved for audit rather than discarded.
They do not change the failure classification. No full master, full draft,
correction, or final render was produced.

Final stopped-candidate still validation also found a second falsification:
S10 OPEN materially drifted after the conclusion evidence was moved into a
narration-timed `Sequence`. The approved OPEN frame had visible conclusion-page
mass near the lower frame; the promoted OPEN removed it. The actual-pixel guard
failed with `blockMae=0.91567` and centroid displacement `0.23381`. This triggers
hard stop 7 (motion/promotion damaged approved composition). It was not repaired.

## State at stop

- V17 archive: `1ed1bc7099fa6e9021cebb44c504107dbf0e32b9`, tag `v17-benchmark`, pushed.
- Feature branch: `videoagent2/previs-in-place`.
- Checkpoint 1 verdict: `APPROVE TEMPORAL`.
- Checkpoint 2 verdict: `APPROVE PREVIS`.
- Approved scenes rebuilt from scratch: 0.
- Initial weak full-previs scenes: 0.
- Internal full-previs revision passes: 0.
- Full medium V18 drafts: 0.
- Final V18 renders: 0.
- Broad corrections: 0.
- Failure classification: `FAILED-VALIDATION` / hard stop 14.
- Additional falsification: hard stop 7, S10 OPEN visual drift.
- Frozen approval receipt: `input/.videoagent/V18/receipts/previs-approved.json`
  (runtime/ignored). It was current immediately after approval, but became stale
  after post-approval plan timing synchronization refreshed `plan-approved`.
  The tracked approved pixels/manifest remain intact; currentness was not repaired
  after the stop.

## Evidence

- Four-scene temporal MP4:
  `out/v18-checkpoint1/V18_S3_S4_S8_S9_temporal.mp4`
- Approved full V18 contact sheet:
  `input/previs_approved18/previs_contact_sheet.png`
- Approved full V18 frame manifest:
  `input/previs_approved18/previs_frame_manifest.json`
- Donor Phase-A baseline:
  `input/previs_baseline18/`
- Checkpoint telemetry:
  `out/v18-checkpoint1/telemetry_checkpoint1.json`
- Stopped promoted-frame drift report:
  `out/v18-promoted-stopped/drift_validation.json`

No full V18 draft or final MP4 was rendered after this stop condition.