# Gates — what each one checks, and how to fix a failure

Gates exist because prose rules in this skill demonstrably do not hold. During
the V10 build, three rules already written plainly in SKILL.md were ignored:
no universal-symbol imagery, place the headline against the real hero cluster,
never silently drop a planned asset. One of the violations was even explained
in a code comment (*"keeps sourcing cost down"*). Nothing caught any of it,
because nothing could.

The gates below can. Two of them run automatically via hooks, so they are not
optional.

## Enforcement layers, strongest first

| Layer | Can the model skip it? |
|---|---|
| Hooks (`.claude/settings.json` → `hook_gate.py`) | **No** — the harness runs them |
| Gate scripts (non-zero exit) | Only by not running them; the Stop hook runs them anyway |
| `scene_plan.json` as a contract | Drift is detectable by `build_gate.py` |
| Prose in SKILL.md | Yes — which is why the rules that matter became gates |

### Hook behaviour

- `PostToolUse` on Write/Edit → if the edited file is a scene of the **active**
  plan, runs `build_gate.py` for that scene. Blocks on drift.
- `Stop` → runs `plan_gate.py`, `build_gate.py`, `review_gate.py`. Blocks the
  turn from ending while any fail.

Both are **scoped** (nothing happens unless a plan has `"status": "active"`)
and **fail-open** (any internal error warns and exits 0, so a bug in the gate
can never brick the repo). Set the plan's status to `"shipped"` when the video
is finished and the gates go quiet.

---

## plan_gate.py — is the plan good?

```bash
py -3 .claude/skills/vox-collage-video/scripts/plan_gate.py input/scene_plan10.json
```

| Failure | What it means | Fix |
|---|---|---|
| `field '<x>' is empty` | A 2a/2b field was left blank | Fill it. An empty `visualTransformation` reliably produces a background+text scene |
| `no illustrative asset` | Scene declares a visual language but has nothing to show | Add the asset, or declare `text-only` (capped) |
| `text-only scenes = N (x%) > 15%` | Too much of the video is a blank page | Give those scenes a `background-photo`, `diagram`, or `map` |
| `<field> repeats on consecutive scenes` | Two neighbours look the same | Change one — see `visual-language.md` |
| `<x> on N/M scenes (>50%)` | One formula dominates the video | Diversify the languages |
| `N/M scenes use a stock template (>60% cap)` | The plan was assembled off the menu | Compose bespoke arrangements from the primitives for the scenes none of the seven actually fits |
| `'bespoke' must describe the arrangement` | `bespoke:TitleStamp` is a label, not a decision | Say what is being built: `bespoke: alley cross-section over a night background photo` |
| `dead air Xs` | Nothing new appears while narration continues | Add a beat, or split the scene |
| `only X% of runtime has a visual tied to what is being said` | The viewer hears claims with nothing on screen showing them | Add assets with `describes`, anchored near when the phrase is spoken |
| `declares no describes` | An asset can't say what it illustrates | Either name the phrase it illustrates, or remove it — it's filler |
| `visualEvent … is not backed by anything in the plan` | An event was typed with no asset entrance/exit or punch behind it | Add the beat it describes, or drop the event. `visualEvents` is authored by the same model the pacing gate constrains, so it is only worth anything cross-checked |
| `describes '<p>', which is never spoken in this scene` | Anchor points at the wrong scene | Re-check with `beat_sync.py frame --scene-start --scene-end` |

**Coverage is measured in seconds of runtime, not keyword hits.** A second
counts as covered when a visual is on screen AND declares a phrase spoken
within ±2s. Keyword stuffing earns nothing, because credit is only granted
near the moment the phrase is actually said.

### The pacing gate — does each scene get the time its content needs?

Cutting more often does not make a video better. It gets better when screen
time **matches how hard a scene is to take in**. Measured on the first rebuild
of V10, before this gate existed:

```
alley cross-section    2.8s   1.38s/beat   \  the three things the viewer has
density grid           2.6s   0.88s/beat    >  never seen before were the
force diagram          2.9s   0.97s/beat   /   three SHORTEST scenes
neon nightlife photo   5.3s   2.66s/beat   <- nothing to decode, most time
```

The whole mechanical explanation got 8.3 seconds; two mood shots got 9.6. The
plan passed every other gate. Root cause: scene boundaries were allowed to
follow the narration's segments mechanically. **Screen time does not have to
equal speaking time** — a drawing may hold past the sentence that introduced
it, and an easy mood shot may be cut short to pay for it.

`comprehensionLoad` (`simple` / `moderate` / `complex`) is a required field,
but it is **derived, not trusted**. `derive_load()` computes a floor from
three signals and the planner may raise a load, never lower it:

| Signal | Floor |
|---|---|
| A number spoken inside the window (`158`, `1,37 km2`, `2014`, `cấp 3`) | complex |
| `visualLanguage` ∈ diagram / data / timeline / flow | complex |
| `visualLanguage` ∈ map / annotated / split / mockup / document | moderate |
| `narrativeFunction` ∈ mechanism / causal-chain | complex |
| `narrativeFunction` ∈ cause / paradox / definition / list / evidence | moderate |

The spoken digits are the anchor that cannot be gamed — you cannot delete
"158" from what the voice actually says.

| Failure | Fix |
|---|---|
| `declared X but the content derives Y` | Raise the load, then give the scene the time that load requires |
| `Xs per visual beat, under the Ys floor` | Fewer beats in the scene, or a longer scene — move a beat into a neighbour |
| `Xs is under the Ys minimum for a 'complex' scene` | Borrow seconds from an adjacent easy scene |
| `a complex scene is SHORTER than the median scene` | The video is spending time on what is easy to look at instead of what is hard to understand |
| `N consecutive scenes within ±15% of the same length` | Cutting on a metronome. Rhythm has to come from the content |
| `N consecutive high-density scenes` | Give the viewer a breath |
| `N consecutive scenes with no low-density beat` | The video never pauses for thought |

Two elements landing on the **same frame** are one moment, not two — the plan
generator merges them before counting beats, otherwise the dwell floor demands
padding that changes nothing on screen.

## build_gate.py — is the build the plan?

```bash
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/scene_plan10.json
py -3 .claude/skills/vox-collage-video/scripts/build_gate.py input/scene_plan10.json --scene S13
```

| Failure | Fix |
|---|---|
| `plan promises N illustration(s) … but renders NO image at all` | The "scene silently simplified" defect. Source the asset, or change the plan deliberately |
| `planned asset … is MISSING` | Same, for one element |
| `uses <src> which is NOT in the plan` | Add it to the plan with a `describes`, or remove it |
| `entrance frame X in the build vs Y in the plan` | Re-derive with `beat_sync.py`, or update the plan |
| `punch text differs` | Plan and build disagree on the headline |
| `parser could not read it` | **Do not assume the scene is fine** — build_gate needs fixing |

Template defaults are resolved from `SceneTemplates.jsx`, so a punch frame
that lives inside a template (e.g. `MapLocationScene`'s hardcoded `from={45}`)
is compared correctly rather than raising a false alarm.

## check_overlap.py — does it look right on screen?

```bash
py -3 .claude/skills/vox-collage-video/scripts/check_overlap.py \
  --elem "Hero-X=public/el10_x.png,x=50%,y=420,width=700,from=0,visibleFor=200" \
  --elem "Support-Y=public/el10_y.png,x=140,y=1020,width=300,from=50,visibleFor=120"
```

Five checks: pairwise alpha overlap, safe zone, support/hero proportion,
**frame coverage**, and **balance**.

Pass anything that occupies space but has no PNG — a headline block, a
diagram, a map panel — as `box:WxH`:

```bash
--elem "Punch=box:900x260,x=50%,y=200,width=900,from=45,visibleFor=200"
```

Without it the balance check sees only cutouts and judges the frame on part of
its mass.

Coverage floor `0.12` is calibrated, not guessed — against scenes the user had
already judged:

```
flagged as too empty:  S13 6.8%   S17 3.8%   S5 11.2%
not flagged:           S4 13.6%   S8 15.0%
```

Below 12% reads as a bug; 25% is the advisory target. Fix by sizing the hero
from its **rendered height** (a landscape-crop asset at `width=560` can be
only ~310px tall), adding a `BackgroundPhoto`, or adding a real second beat.

**Balance** is a separate question from coverage: not how much is filled, but
*where* it sits. It takes the centroid of the real opaque mass inside the
usable band and fails when it drifts past `--balance-dx` (0.16 × width) or
`--balance-dy` (0.18 × band height) — the user's "lệch lên mép trên / lệch
sang bên phải" complaint. A top-heavy frame and a centred frame score
identical coverage and neither trips the safe-zone check, so nothing else
catches it.

These two tolerances are geometric, **not** calibrated against judged scenes
(unlike the coverage floor) — the V10 plan was reconstructed without
per-asset coordinates. Re-calibrate them the first time a batch of real scenes
is judged by eye. Fix a failure by moving the cluster toward the band centre
or adding a counterweight beat on the empty side — not by nudging the headline
alone.

## review_gate.py — has anyone looked at it?

```bash
py -3 .claude/skills/vox-collage-video/scripts/render_review_sheet.py input/scene_plan10.json
# look at the contact sheet, fill in input/review10.json
py -3 .claude/skills/vox-collage-video/scripts/review_gate.py input/scene_plan10.json
```

Every scene needs a verdict (`pass` / `fail` / `n/a`) on the user's four
criteria, with a frame path as evidence:

- **illustrated** — narration is shown, not left to the viewer's imagination
- **composed** — balanced, everything inside the frame and legible
- **varied** — not the same visual formula as its neighbours
- **purposeful** — every element is there for a reason, not filler

A `fail` blocks until fixed, or until `"resolved": true` is set with a note
saying why it is acceptable. This gate cannot judge quality — it makes
*skipping the look* impossible, which is the failure that actually happened:
V10 passed every automated check and the first person to watch it found four
defects in the first minute.

## Adjusting a threshold

Thresholds are CLI flags, deliberately. If one is genuinely wrong for a
video, change it explicitly and say why. What must not happen is thinning the
plan until a gate goes quiet — that is the failure mode the gates exist to
prevent, and it will look identical to progress.
