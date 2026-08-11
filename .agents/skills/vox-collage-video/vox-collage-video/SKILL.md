---
name: vox-collage-video
description: Build a Vox-style grayscale-collage motion-graphics short in this Remotion project from just an audio file + script — no further style questions needed. Use this whenever the user hands over a voiceover/narration audio file (mp3/wav) plus its script and asks for a video, or says things like "make me a video from this audio", "dựng video từ audio này", "same style as before", "another Vox-style clip", or references a prior grayscale/collage video in this project. Covers the full pipeline end to end: Whisper transcription, scene segmentation, sourcing images via AI generation (Gemini through OpenRouter, with the Pexels API as a fallback for real-world-specific photos), turning them into grayscale/color cutouts with a pixel-verified layout, a multi-scene Remotion build with TransitionSeries transitions, word-synced burned-in captions, and registering + previewing it.
---

# Vox-collage video pipeline (grayscale + orange, 9:16)

This is a Windows project with no browser-automation tool and no Remotion
MCP connection — everything runs through the Bash tool (Node/npm/npx are
available) and Python via the `py -3` launcher (not `python3`). Whisper,
rembg, scipy, and Pillow are already installed for this Python.

**Always build the Remotion side using the official `remotion-dev/skills`
package patterns** (`npx skills add remotion-dev/skills` — installs into
`.agents/skills/`, symlinked into `.claude/skills/remotion-*`). This
skill (`vox-collage-video`) only owns the parts official Remotion skills
don't cover: the image-sourcing/cutout pipeline, the visual style rules,
and the caption-timing pipeline. For markup, transitions, sfx, fonts,
etc., defer to `remotion-markup` and its linked references — verify
against the actually-installed package output before trusting an
example in those docs (found one real doc/package mismatch already: see
the sfx note in step 6).

The visual target is the grayscale-collage look from
`docs/Vox-Style_Motion_Graphics_Using_Only_Claude_Code___Remotion_frames/`:
real stock photos, background removed, PERSON subjects desaturated to
plain contrast-boosted grayscale (NO halftone dot-screen pattern — that
was tried, technically confirmed as present in the source, and still
explicitly rejected for this project; don't reintroduce it without being
asked again) with a baked-in offset solid-orange drop shadow. OBJECT/prop
cutouts (a flag, a scale statuette, a stack of books, an envelope) stay
in full original color and get NO drop shadow by default — the shadow is
a person-only treatment, confirmed the hard way after shipping a version
where every cutout had one and it read as visually wrong. Pale
graph-paper-grid background (grid line `rgba(20,20,20,0.32)`, ~84px
cells — an earlier 0.07-alpha version was nearly invisible, don't
undershoot contrast there again). Bold black punch-phrase text for one
timed highlight per scene (no highlighter-yellow, no persistent tag
chip — a chip was in an earlier draft of this skill and does NOT exist
in the reference, confirmed by frame-by-frame review; don't reintroduce
it). Canvas is 1080x1920 @ 30fps (9:16) unless the user asks for 16:9.

Work through the steps below in order. Visual style is already decided —
don't re-ask about it. The one thing worth pausing for, per video, is a
checkpoint after step 2: show the user the scene-by-scene shot list
before spending effort sourcing images and building.

## 0. Before you start

Confirm `py -3 -c "import whisper, rembg, scipy, PIL, numpy, requests"`
succeeds; if anything's missing, `py -3 -m pip install rembg onnxruntime
scipy openai-whisper pillow numpy requests`.

Neither sourcing path needs a browser: `OPENROUTER_API_KEY` and
`PEXELS_API_KEY` live in the project's `.env` file (already gitignored).
`scripts/generate_image.py` and `scripts/fetch_pexels.py` read them
automatically.

## 1. Transcribe the audio

Copy the provided audio into `public/` under a short name (e.g.
`audio.wav`). Transcribe with Whisper for word-level timestamps — these
drive scene cuts, punch-phrase timing, SFX cues, AND captions (step 8):

```bash
py -3 -c "
import whisper, json
model = whisper.load_model('base')
result = model.transcribe('public/audio.wav', word_timestamps=True, language='vi')
json.dump(result, open('input/transcript.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
"
```

Use `language='vi'` for Vietnamese scripts (or whatever language the
script is actually in — don't default to English). The `base` model
sometimes mis-hears specific words even with word_timestamps on; trust
the user-provided script text for what a word *says*, trust Whisper's
timing for *when* it's said. **Before pairing them up, verify the word
COUNT matches 1:1 between Whisper's segment and the corresponding chunk
of the real script** — if it doesn't, the position-matching breaks and
timestamps land on the wrong words. It matched cleanly on every segment
last time; if it doesn't this time, fall back to matching sentence-by-
sentence instead of word-by-word rather than guessing an offset.

## 2. Segment the script into scenes, draft the shot list, checkpoint

Use Whisper's segment boundaries as scene boundaries — they already
follow natural breath/sentence groups. Group adjacent segments that
belong to the same sentence/idea into one scene; split out a quoted or
emotionally-loaded line into its own scene even if short. Don't force a
minimum or maximum scene count — let the sentences decide.

For each scene decide:
- **punch phrase** — ONE short catchy highlight, timed to appear with
  real dwell time before the NEXT scene's cut — not pinned to the exact
  last word of the line. If the phrase's natural cue point is within
  ~1.5s of the scene's end, move its `from` earlier so it's fully
  settled and readable for at least ~45 frames before the cut; caught a
  real case where a phrase appeared and got cut mid-read 20 frames
  later and it read as a broken edit.
- **hero image** — the single most visually central subject of the
  sentence.
- **2-3 support elements** — smaller cutouts reinforcing the sentence's
  specific content. In the reference, a support is almost always
  touching/overlapping the hero (at its feet, on its shoulder, stacked
  on top) forming ONE cluster — never floated off in a far corner with
  the hero isolated in the middle. See step 4's placement-verification
  step; this is checked with real numbers now, not eyeballed.
- **variant** — an entrance animation (see `references/animation-
  variants.md`); no two consecutive scenes repeat one.

If the sentence's core action has a real cause→effect chain worth
diagramming (money → influence → verdict, cause → consequence), that's
a good candidate for the `FlowArrow` connecting-line technique (step 6)
instead of forcing in a literal chart/map that doesn't match a non-data
script — see step 6's note on translating reference techniques to
content that doesn't have the same kind of content (no numbers, no
geography) as the original reference video.

**Present this shot list to the user as text before moving on** — punch
phrase + which word it's keyed to, hero + supports (named, not yet
sourced), variant. Only proceed to sourcing/building after they approve
or adjust it. Skip this checkpoint only if the user has explicitly said
to run a video end-to-end without review.

For topics with culturally-specific subject matter generic Western
stock imagery wouldn't capture (a specific country's court system, a
local slang term, a specific institution), lean on AI generation's
strength here — the step-3 prompt can specify the exact cultural detail
directly (e.g. "a Vietnamese courtroom nameplate", "an áo dài") instead
of settling for a universal symbol (scales of justice, a gavel, a
handshake in shadow) the way Pexels sourcing had to.

## 3. Source the photos

**Default to AI-generated images** — `scripts/generate_image.py` calls
Gemini (`google/gemini-3.1-flash-lite-image`) via the OpenRouter API, no
browser needed. This replaced Pexels as the primary source: Pexels'
generic stock library was too low-quality/limited/inconsistent for
subject-specific scenes, and a generated image can be tailored exactly
to what the scene needs (right subject, right pose, right prop) instead
of settling for whatever stock happens to exist.

```bash
py -3 .claude/skills/vox-collage-video/scripts/generate_image.py gen \
  "a gavel, studio product photo on a solid plain white background, sharp focus, high detail" \
  input/raw_cache/gavel.png
```

Always prompt for **"studio product photo on a solid plain white
background"** (or equivalent) regardless of the subject — that's what
gives rembg a clean, crisp cutout edge. Describe the subject specifically
enough to match the scene's exact content (a specific prop, a specific
pose/angle, a specific cultural context) — this is the actual advantage
over stock: don't settle for a generic result when the prompt can be
made precise. Save outputs under `input/raw_cache/` like any other raw
source image (keeping them means a later re-process doesn't need a
fresh API round-trip), then run them through step 4's cutout pipeline
exactly like a Pexels download — `generate_image.py` output is a
drop-in replacement, not a separate pipeline.

**Preview before committing** — Read the generated PNG at thumbnail
scale before running it through rembg, same discipline as screening a
Pexels candidate. If a generation comes out with a cluttered scene, a
non-white background, or the wrong subject, regenerate with a more
specific prompt rather than fighting it in the cutout step.

`scripts/fetch_pexels.py` (Pexels REST API) is kept as a fallback for
when a specific real-world photo (an actual news photo, a real
recognizable place) is genuinely what the scene needs instead of a
generated image:

```bash
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py list "gavel" --orientation portrait
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py get "gavel" input/raw_cache/gavel.jpg --orientation portrait --index 0
```

If using the Pexels path, the same rembg failure modes apply: it does
badly on a busy/cluttered composition, a subject resting ON or AMONG a
similarly-detailed surface (money on top of a pile of money — the
classic failure, confirmed twice), large-scale architecture/building
photos, and flat-lay top-down document shots — route around those at
the sourcing stage rather than fighting the mask after the fact.

## 4. Turn photos into cutouts, then verify placement with real pixels

```bash
py -3 .claude/skills/vox-collage-video/scripts/process_cutout.py \
  input/raw_cache/gavel.jpg public/el_gavel.png \
  input/raw_cache/envelope.jpg public/el_envelope.png \
  --color
# (run person/hero subjects in a separate call WITHOUT --color — that's
# the grayscale + drop-shadow path, the default when --color is omitted)
```

rembg (`isnet-general-use` model — checked head-to-head against the
default `u2net`, isnet gives a visibly crisper edge), a connected-
component mask cleanup, an alpha-curve edge-tightening pass (kills the
soft "smoke" fringe rembg leaves on a blurred/shadowed edge — this was a
real visible defect in an earlier pass, fixed by steepening the alpha
curve, not by re-picking photos), a tight content crop, then either
grayscale+shadow or `--color` (no shadow unless `--shadow` is also
passed).

**Don't place hero/support x/y coordinates by eye.** Write (or reuse) a
small script that reads each PNG's real pixel dimensions, computes its
actual rendered bounding box at the configured width/x/y, and — ideally
— composites the REAL alpha channels to measure what % of the hero's
opaque pixels a support actually covers at those coordinates. Iterate
coordinates until occlusion is ~0% and the support's box still overlaps
the hero's outer bbox (so it reads as touching, not isolated in a
corner). A synthetic "keep-clear center rectangle" heuristic is a decent
first pass but overestimates the clash for thin/irregular silhouettes
(a tall statue) — the real alpha-composite check is what actually
answers "does this cover something that matters."

**Preview outputs before wiring up the scene** — composite over the pale
background color, downscale, and view a combined contact sheet of
several at once rather than one Read call per image (this is the
single biggest token sink in this pipeline if skipped):

```bash
py -3 -c "
from PIL import Image
im = Image.open('public/el_gavel.png')
bg = Image.new('RGBA', im.size, (231,227,217,255))
bg.alpha_composite(im)
bg.convert('RGB').thumbnail((350,350))
bg.save('/tmp/check_gavel.jpg', quality=88)
"
```

## 5. SFX

Use the official `@remotion/sfx` package, not a locally-synthesized set
(`scripts/generate_sfx.py` exists from an earlier approach but is
unused now — the official package has a real one-shot library and
that's what shipped). **Note a real doc/package mismatch**: the
`remotion-markup/sfx.md` example shows `import { Audio } from
"@remotion/sfx"` — the installed package only exports plain URL string
constants, no `Audio` component. Correct usage: `import * as sfx from
"@remotion/sfx"` then play with remotion's own `<Audio src={sfx.whoosh}
/>`. Verify against the installed package's actual `dist` output before
trusting a skill doc's example code again.

Wire SFX at the actual beat each belongs to (an entrance landing, an
impact frame), not bunched at frame 0 every time. Keep volumes 0.3-0.5.

## 6. Build the scenes

Use a **separate file per scene** (`src/scenes/Scene1.jsx`, `Scene2.jsx`,
...) plus one `src/scenes/shared.jsx` holding the reusable pieces, per
`remotion-markup/multi-scene-video.md`. Treat the current project's
`src/scenes/shared.jsx` and `src/scenes/Scene*.jsx` as the canonical
reference to copy patterns from for the next video — it's proven,
working code, not a synthetic example that drifts out of sync (an
earlier `references/example-scene.jsx` in this skill did exactly that
and was removed; see `references/README.md`). It currently has:

- `SceneBackground` / `BottomBar` — identical grid+grain background and
  the one always-present orange bottom bar (rendered OUTSIDE any zoom/
  pan wrapper — a zoom scale >1 will push a bottom-anchored bar out of
  frame if it's nested inside the zoom group, caught via pixel-sampling
  a render).
- `CameraGroup` — zoom AND/OR pan (translate), plus an optional `shake`
  (brief decaying jitter at a specific frame, e.g. an impact landing).
- `Hero` / `Support` — entrance variants (`rise`/`grow`/`punch`/`flip`/
  `dropSpin`/`strike`, see `references/animation-variants.md`), an
  `idle` secondary-motion mode (`sway`/`tremble`/`bob` — vary this
  across elements, don't let everything wiggle identically), and a
  `visibleFor` prop that fades+shrinks the element out before its scene
  ends instead of letting it hard-vanish when the Sequence unmounts.
- `ImpactFlash`, `FlowArrow`, `Shimmer`, `DocumentStamp`, `VoxMapPin` — punctuation & spotlight effects: a radial flash at a strike/landing frame, a self-drawing curved arrow connecting two elements, a light-sweep masked to an element's alpha shape, a vintage ink stamp ("ĐÃ THẨM ĐỊNH" / "CONFIDENTIAL") with spring slam landing, and a minimalist geographic location pin with pulsing radar ripple ("📍 VIỆT NAM").
- `PunchPhrase` / `SpeechBubbleQuote` — both support a `stagger` prop for a word-by-word kinetic-text reveal with orange highlight keywords instead of the whole block popping at once; vary which ones use it.
- **7 Modular Scene Templates (`SceneTemplates.jsx`)**:
  1. `CollageScene`: Standard 1 Hero + 2 Supports layout.
  2. `SplitCompareScene`: 50/50 dual column comparison with centered percentage coordinates (`x="25%"`, `x="75%"`).
  3. `StatCalloutScene`: Animated stat counter (`StatCounter` from 0 -> N).
  4. `NewspaperSpotlightScene`: Document/newspaper spotlight with animated orange highlighter stroke & vintage stamp (`DocumentStamp`).
  5. `QuoteBubbleScene`: Vintage speech quote card (`SpeechBubbleQuote`) with word-by-word reveal.
  6. `FlowDiagramScene`: Arrow-connected workflow cause-and-effect diagram (`FlowArrow`).
  7. `MapLocationScene`: Geographic location pin callout (`VoxMapPin`) + hero element.
- `Captions` — see step 8.

## 7. Assemble the master timeline with real transitions

Don't just stack scenes with plain back-to-back `<Sequence>`s — use
`@remotion/transitions`' `TransitionSeries` (per `remotion-markup/
transitions.md`) so cuts fade/slide instead of hard-switching. **The
tricky part: scene start times are locked to real Whisper-derived
narration timestamps (silence pauses between lines), and
`TransitionSeries` shortens the total timeline by however much adjacent
sequences overlap** — used naively, every scene after the first
transition drifts earlier than its real audio cue, and the drift
compounds scene over scene.

The fix that keeps every scene's arrival frame exactly on its original
timestamp despite the transitions: for each rail (each `TransitionSeries
.Sequence`), pad its `durationInFrames` by the transition duration that
comes immediately BEFORE it —

```
rail_i = (original_gap_to_next_scene) + (transition_duration_before_this_rail)
```

(gap = the real silence between this scene's start and the next scene's
start from the timestamps; first scene's padding is 0; last scene pads
by its own trailing transition instead of a gap-to-next). Verify by
rendering the composition's very last valid frame and confirming it
doesn't error — that's the total-duration math checking out — and spot-
check a few frames straddling each transition to see the actual
fade/slide blend, not just that it builds.

## 8. Word-synced captions

Burn in captions instead of leaving the video with only occasional
punch-phrases/speech-bubbles — the reference-level "feel complete" gap
was mostly this. Source of truth: Whisper's word-level timestamps
(step 1) for WHEN, the real script text for WHAT (matched positionally,
same 1:1-word-count caveat as step 1). Group words into short lines
(~4 words; fold a 1-word remainder into the previous line instead of
flashing it alone) and reset the grouping at each Whisper segment
boundary — don't chunk mechanically across a real pause, it reads as
two unrelated clauses glued into one line. Highlight the currently-
speaking word (karaoke-style) against the rest of the line. Mount the
captions component ONCE at the master-timeline level, as a sibling
AFTER the `TransitionSeries` (not inside any one scene) so it reads off
absolute frame numbers and isn't affected by scene fades/transitions.
Position it low but clear of the bottom bar, with a translucent dark
backing box — legible over any photo/color underneath it.

## 9. Register and preview

Add a `<Folder>` of individually-playable scene `<Composition>`s plus
one master `<Composition>` to `src/Root.jsx`, matching the pattern
already there.

There's no browser tool in this environment, so preview by starting
Remotion Studio in the background and pulling still frames instead of
scrubbing live:

```bash
npx remotion studio --no-open   # run with run_in_background: true, redirect
                                 # output to a log file — piping through
                                 # `head` sends SIGPIPE and kills the
                                 # install/server process early
```

Once it's up, render representative frames at **`--scale=0.25`** (a
full-res still burns far more vision tokens for the same check) and
combine several into ONE contact-sheet image with PIL before reading it
— this is the single biggest token-saving habit in this whole pipeline,
apply it every time, not just when token usage is already a problem:

```bash
npx remotion still <CompositionId> --scale=0.25 --frame=90 /tmp/f.png
```

Only fall back to a full `npx remotion render <CompositionId>
out/<name>.mp4 --overwrite` if the user specifically asks for an
exported file, or stills genuinely can't show what's being debugged
(e.g. audio sync).

## Things earlier attempts got wrong (so you don't repeat them)

- `Hero` / `Support` percentage coordinates (`x="25%"`, `x="75%"`) failing to center — earlier code only calculated `marginLeft = -width / 2` for `x === "50%"`, leaving other percentage values using top-left anchor (`marginLeft = 0`). This pushed the right column cutout out of the 1080px canvas by ~78px, cutting off the right elbow/arm. ALWAYS use `marginLeft = (typeof x === "string" && x.endsWith("%")) || x === "50%" ? -width / 2 : 0` to center percentage coordinates.
- PunchPhrase line breaks letting a single word fall alone on a 2nd line (e.g. "BÓC TÁCH NGHỀ LUẬT \n SƯ"). ALWAYS enforce `whiteSpace: "nowrap"` & `flexWrap: "nowrap"` on line containers, use explicit `lines` array, and auto-scale `fontSize` with `maxCharCount` so lines never break mid-sentence.
- `SplitCompareScene` column width & positioning — place Left Column at `x="25%"` and Right Column at `x="75%"` with `width <= 360px` to guarantee 90px symmetrical safety margins on both left and right canvas edges.
- Sourcing complex Pexels photos with messy backgrounds — led to fuzzy, glitchy rembg cutouts. Always use Gemini AI `generate_image` on solid white background for 100% crisp studio cutouts.
- Captions placed too low near the bottom margin (`bottom: 58`), getting covered by TikTok/Reels UI. Always position `Captions` at `bottom: 440` (~1/3 from bottom) and elevate hero elements (`y: 340-350`) so they never overlap.
- Placing hero/support coordinates by eye instead of measuring real
  pixel overlap — led to a support visibly covering part of a hero (a
  gavel drawn over a hand) that read as a real editing bug, not style.
  Always run the alpha-overlap check from step 4 now.
- Applying the orange drop-shadow to every cutout regardless of subject
  — it's a person/grayscale-only treatment; object/color cutouts get
  none by default.
- A punch-phrase timed to appear right as the line ends, with the next
  scene's cut only ~20 frames later — reads as the text being cut off
  mid-read. Give it real dwell time before the cut (step 2).
- Background grid contrast too subtle (0.07 alpha) to actually read —
  needs real contrast (0.32-ish), verified against a zoomed reference
  crop, not asserted.
- Reusing one entrance animation for every scene, or the same 1-2 SFX
  everywhere, reads as flat — vary both deliberately scene to scene.
- A cutout that's static after its entrance finishes looks frozen/dead —
  layer continuous low-amplitude idle motion (vary the TYPE — sway vs.
  tremble vs. bob — not just the phase).
- rembg does badly on busy/complex-background photos, large architecture,
  and flat-lay documents — route around this at the sourcing stage
  (step 3), not by fighting the mask after the fact.
- Trusting a "official skill doc" code example without checking it
  against the actually-installed package — caught a real
  doc/package mismatch (step 5's sfx note). Verify, don't assume
  "official" means "currently accurate."
- Copying a reference video's literal content-specific effects (a
  numeric counter, an economic line chart, a geographic map) onto a
  script that has no numbers/data/geography — translate the underlying
  TECHNIQUE (kinetic emphasis, a self-drawing diagram) to content the
  new script actually has, don't force in mismatched content.
- Don't skip the step-2 checkpoint on a first video for a new script/
  topic — sourcing and building is the expensive part of this pipeline;
  catching a wrong creative direction in a text shot-list is cheap,
  catching it after building a scene isn't.
- No git repo under the project meant no way to roll back a bad edit.
  `git init` + commit once a version is genuinely approved, before
  continuing to iterate — cheap insurance, and the natural checkpoint to
  do it at is right after a user confirms a version is good.
