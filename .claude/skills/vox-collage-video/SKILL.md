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
`scripts/generate_board.py` and `scripts/fetch_pexels.py` read them
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
- **2-3+ support elements, each pinned to the exact word/phrase it
  illustrates** — don't just list "2-3 supports" for the scene as a
  whole and space their entrances out for pacing. If a scene's narration
  covers more than one idea (very common — a scene is often 2 sentences
  long), a support illustrating the SECOND idea must not appear until
  that idea is actually being spoken. Write down, per support, the exact
  phrase (verbatim from the aligned transcript) it's keyed to — this is
  what `scripts/beat_sync.py` will look up in step 6 to compute its real
  entrance frame. A scene with 3 distinct emphasis points in its
  narration should have 3 supports timed to those 3 points, not 2
  supports both front-loaded into the first 2 seconds while the scene's
  back half plays out with nothing new happening on screen. Caught a
  real case (`VayTinChap` Scene1): a support illustrating "sập bẫy" (the
  trap) was set to appear at frame 55 while the words "sập bẫy" aren't
  spoken until frame ~224 — nearly 6s of the wrong picture on screen
  before the narration caught up to it. A support that never gets a
  real semantic hook to its own phrase (pure mood/texture, nothing the
  narration specifically names) can stay on the hero's own entrance
  timing — don't force a fake phrase-match for it.
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
phrase + which word it's keyed to, hero + each support (named, not yet
sourced, each with its anchor phrase), variant. Only proceed to
sourcing/building after they approve or adjust it. Skip this checkpoint
only if the user has explicitly said to run a video end-to-end without
review.

For topics with culturally-specific subject matter generic Western
stock imagery wouldn't capture (a specific country's court system, a
local slang term, a specific institution), lean on AI generation's
strength here — the step-3 prompt can specify the exact cultural detail
directly (e.g. "a Vietnamese courtroom nameplate", "an áo dài") instead
of settling for a universal symbol (scales of justice, a gavel, a
handshake in shadow) the way Pexels sourcing had to.

## 3. Source the photos

**Default to AI-generated images via `scripts/generate_board.py`** — it
calls Gemini (`google/gemini-3.1-flash-lite-image`) via the OpenRouter
API, no browser needed. This replaced Pexels as the primary source:
Pexels' generic stock library was too low-quality/limited/inconsistent
for subject-specific scenes, and a generated image can be tailored
exactly to what the scene needs (right subject, right pose, right prop)
instead of settling for whatever stock happens to exist.

**One script, one command, for both a single image and a "board" of
several at once** — pass one `--cell name=prompt` for a single bespoke
image (behaves exactly like the old one-image-per-call approach, no
grid overhead), or several `--cell` for a batch:

```bash
# single image
py -3 .claude/skills/vox-collage-video/scripts/generate_board.py board \
  --cell "gavel=a gavel, sharp focus, high detail" \
  --out-dir input/raw_cache

# object board: several distinct small props for one video in ONE API call
py -3 .claude/skills/vox-collage-video/scripts/generate_board.py board \
  --cell "shield=a glossy blue shield icon with a checkmark" \
  --cell "calculator=a handheld electronic calculator" \
  --cell "cash=a stack of banknotes" \
  --out-dir input/raw_cache --bg magenta

# character sheet: the SAME recurring hero, several poses, guaranteed-consistent face/outfit
py -3 .claude/skills/vox-collage-video/scripts/generate_board.py board \
  --consistent-subject "a young Vietnamese male office worker in his mid-20s, short black hair, light blue collared shirt" \
  --cell "shocked=wide-eyed shocked expression, looking down at a phone in his hand" \
  --cell "mathcalc=smiling, one hand raised doing a finger-counting mental math gesture" \
  --cell "advice=looking straight at camera, one hand raised pointing forward giving friendly advice" \
  --out-dir input/raw_cache --cols 2
```

Note what's NOT in these prompts anymore: no "studio product photo on a solid plain white background" wording. **Background is a chroma-key screen color, injected automatically by the script** (see the next section) — only describe the SUBJECT in `--cell`/`--consistent-subject`. Typing background wording by hand into prompts is exactly the kind of prose convention that drifts across sessions; it's now enforced in code instead.

Use the board (2+ cells) form by default whenever a video needs 2+ small
object/prop cutouts, or a recurring hero character needs multiple
poses/expressions across scenes — it costs one API round-trip instead of
N, and for a recurring character it gives real face/outfit consistency
across scenes instead of hoping N independent generations happen to
match (checked head-to-head: 3 independent single-image hero calls in an
earlier video came out only "close enough" by luck of a very detailed
shared prompt; a character sheet guarantees it because the model sees
every pose together in one generation). Fall back to a single cell only
for one genuinely bespoke image that has no other cells to batch with.

**Cropping does not trust the requested grid as pixel math.** Checked
head-to-head on a real 4-cell character-sheet request: the model
rendered 6 uneven panels (4 across the top row, 2 wider ones on the
bottom) instead of the requested clean 2x2 — blind proportional cropping
sliced straight across a panel boundary as a result. The script instead
auto-detects real panel boundaries via connected-component analysis on
non-white pixels (the white gaps between panels are what separates
them) and sorts them into reading order. When the detected panel count
matches the requested cell count, it maps 1:1 onto your `--cell` names
automatically. **When it doesn't match** (the model added/merged a
pose), it saves every detected panel under a generic `panel_N.png` name
and prints a warning instead of guessing a mapping — inspect the raw
`_board_*.png` it also saves and rename the panels you actually want by
hand. Real cost from that same test: a 4-cell request landed at 1,726
total tokens (240 prompt + 1,486 completion) for 6 usable panels — the
main win is round-trips + consistency, not a dramatic raw token savings,
so don't over-batch a board just to save a few hundred tokens at the
cost of a messier count-mismatch to sort out.

**Background is always a chroma-key screen, chosen per subject — pick the
`--bg` color, don't describe background in the prompt text.**
`generate_board.py` appends the actual background wording itself (see
`CHROMA_SPECS` in that script); typing your own background phrase into
`--cell` text is redundant at best and conflicting at worst. Pick `--bg`
using this rule, in order:

1. `--bg green` (the default, omit the flag) — safe for most objects,
   documents, and people.
2. `--bg magenta` — use whenever the SUBJECT ITSELF contains green:
   cash/banknotes (VND and USD notes both read as green-toned), plants,
   herbs/vegetables (rau thơm, basil), green branding/packaging. A green
   screen behind a green subject keys out part of the subject — the
   exact failure mode this whole scheme exists to avoid, just recolored.
3. `--bg white` — legacy plain white, only when a subject conflicts with
   BOTH chroma colors at once (rare — e.g. something magenta AND green,
   like a watermelon slice).

Root cause this replaces: `process_cutout.py`'s removal isn't a literal
"erase white pixels" operation — the rembg fallback path is an ML
salient-object segmentation model that finds the subject by CONTRAST
against the background, regardless of color. A plain white background
gives near-zero contrast against a pale/white/cream subject, so the
model can't find a boundary and erases the subject along with the
background (confirmed case: "a sealed **white** envelope" prompted on
the old mandatory white background came back with the whole envelope
stripped out, keeping only its small red wax seal). A saturated chroma
color that doesn't appear in the subject restores real contrast for ANY
subject color, white included — and pairs with step 4's real chroma-key
algorithm to remove the model's confidence-based failure mode entirely
for every image this script generates. You can still describe a subject
as white/cream/pale in the prompt now (an earlier version of this rule
said not to, back when white was the only background option) — the
chroma screen makes that safe again.

Describe each cell specifically enough to match the scene's exact
content (a specific prop, a specific pose/angle, a specific cultural
context) — this is the actual advantage over stock: don't settle for a
generic result when the prompt can be made precise. Save outputs under
`input/raw_cache/` like any other raw source image (keeping them means a
later re-process doesn't need a fresh API round-trip), then run them
through step 4's cutout pipeline exactly like a Pexels download —
`generate_board.py` output is a drop-in replacement, not a separate
pipeline.

**A clean "detected count matches requested count" result can still be
silently WRONG** — caught a real case where a 3-cell board with a
top-row/bottom-row layout printed no warning at all, but two of the
three saved files had their names swapped (the credit-card photo landed
in the file meant for the rejected-loan-document photo). The bug was in
the script's row-banding logic (fixed — see `generate_board.py`'s
`detect_panels` docstring for the real cause), but the lesson for using
it stands regardless of the current code: a mismatch warning is not the
only failure mode to watch for. Always open each individual cropped
file (not just the raw board) before wiring it into a scene — a correct
panel count proves nothing about the name<->image mapping being right.

**Preview before committing** — Read both the raw board (to confirm the
model actually followed the layout) and each cropped cell at thumbnail
scale before running anything through step 4, same discipline as
screening a Pexels candidate. Specifically check the background is
actually a clean flat chroma color edge-to-edge, not just present —
Gemini has ignored background instructions before (a stray border/frame
rendered around a whole cell despite no border being requested). If a
generation comes out with a cluttered scene, a background that isn't
flat/uniform, the wrong subject, or a panel count that doesn't map
cleanly, regenerate with a more specific prompt (or fewer cells) rather
than fighting it in the cutout step — `process_cutout.py` will silently
fall back to the (weaker) rembg path for any image whose corners don't
sample as a clean match anyway, so a bad screen just quietly loses the
chroma-key advantage instead of erroring, and it's easy to miss unless
you look at the "removal:" line it prints per image.

`scripts/fetch_pexels.py` (Pexels REST API) is kept as a fallback for
when a specific real-world photo (an actual news photo, a real
recognizable place) is genuinely what the scene needs instead of a
generated image:

```bash
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py list "gavel" --orientation portrait
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py get "gavel" input/raw_cache/gavel.jpg --orientation portrait --index 0
```

Pexels photos are real, uncontrolled photography — you can't re-shoot
them on a chroma screen, so **this path always uses the rembg fallback**
(pass `--bg-mode rembg` explicitly in step 4 to skip auto-detection's
sampling step for these — it would correctly fall back on its own, but
being explicit documents intent and saves a wasted sampling pass). The
same rembg failure modes apply: it does badly on a busy/cluttered
composition, a subject resting ON or AMONG a similarly-detailed surface
(money on top of a pile of money — the classic failure, confirmed
twice), large-scale architecture/building photos, and flat-lay top-down
document shots — route around those at the sourcing stage rather than
fighting the mask after the fact.

## 4. Turn photos into cutouts, then verify placement with real pixels

```bash
py -3 .claude/skills/vox-collage-video/scripts/process_cutout.py \
  input/raw_cache/gavel.png public/el_gavel.png \
  input/raw_cache/envelope.png public/el_envelope.png \
  --color
# (run person/hero subjects in a separate call WITHOUT --color — that's
# the grayscale + drop-shadow path, the default when --color is omitted)

# a real photo from fetch_pexels.py: force the rembg path explicitly
py -3 .claude/skills/vox-collage-video/scripts/process_cutout.py \
  input/raw_cache/gavel.jpg public/el_gavel.png \
  --color --bg-mode rembg
```

Two removal methods, picked **automatically per image** (`--bg-mode
auto`, the default) by sampling each source's corner pixels:

1. **Chroma-key removal** (color-distance threshold + spill suppression)
   — used when the corners cleanly match the green/magenta screen step 3
   generates. This is deterministic color math, not a model, so it
   doesn't have rembg's contrast-confidence failure mode at all — this
   is the path that actually fixes the white-envelope-style failure
   documented in step 3, not just a background-color change on top of
   the same weak method.
2. **rembg fallback** (`isnet-general-use` model — checked head-to-head
   against the default `u2net`, isnet gives a visibly crisper edge) —
   used for Pexels photos, or any generated image whose corners DON'T
   sample as a clean flat chroma color (the model ignored the background
   instruction — see step 3's preview note). The script prints which
   method it used for every image (`removal: chroma-key (...)` or
   `removal: rembg ...`) — actually read that line, don't assume.

Force a method with `--bg-mode {green,magenta,rembg}` if auto-detection
ever picks wrong for a specific source (e.g. a subject that fills the
entire frame with no visible background corner to sample).

Both paths feed the same rest of the pipeline: a connected-component
mask cleanup, an alpha-curve edge-tightening pass (kills the soft
"smoke" fringe a soft/blurred source edge leaves behind — this was a
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

**Compute each support's `delay` / `Sequence from`, don't type a round
number by feel.** For every support with a phrase anchor from step 2,
run:

```bash
py -3 .claude/skills/vox-collage-video/scripts/beat_sync.py frame \
  input/words6_aligned.json --scene-start <this scene's real Whisper \
  start time in seconds, same number used for the master-timeline gap> \
  --scene-end <this scene's end time> --phrase "sập bẫy"
```

**Always pass `--scene-end` too** — a short phrase (or even a single word
like "trả chậm") often repeats verbatim at an unrelated point elsewhere
in the transcript; without a bound, the lookup silently returns the
FIRST occurrence anywhere, which can belong to an earlier scene entirely
(caught live while building this exact anchor set: "trả chậm" matched a
mention 5 scenes earlier before `--scene-end` was added). Use the printed local frame as that support's `delay` (add ~4-6
frames of lead-in if you want the pop-in to *land* right on the word
rather than *begin* on it — a purely visual judgment call, the anchor
frame is the floor, not something to override by more than that). The
hero and the scene's first support can still default to an early
in/near-0 delay (they're establishing the scene, not illustrating a
specific later word). After wiring up a scene, run `beat_sync.py verify`
once with every support's name/phrase/assigned-delay to catch a
mismatch before rendering:

```bash
py -3 .claude/skills/vox-collage-video/scripts/beat_sync.py verify \
  input/words6_aligned.json --scene-start 0.0 \
  --anchor "Hero-Worried=Mượn tiền ngân hàng=0" \
  --anchor "Support-Warning=sập bẫy=224"
```

A support with no real phrase anchor (pure mood/texture) is exempt —
don't force one through this check just to make the table look
complete.

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
- PunchPhrase line breaks letting a single word fall alone on a 2nd line (e.g. "BÓC TÁCH NGHỀ LUẬT \n SƯ"). ALWAYS enforce `whiteSpace: "nowrap"` & `flexWrap: "nowrap"` on line containers, and auto-scale `fontSize` with `maxCharCount` so lines never break mid-sentence.
- **This rule used to end with "...and use explicit `lines` array" — that clause was itself a bug, and it silently reproduced the exact defect it was meant to fix, across multiple later videos.** `PunchPhrase` already auto-splits a line only when it's genuinely >15 chars (see `shared.jsx`'s `finalLines` logic). But every `SceneTemplates.jsx` template only forwards a `punchLines` array straight into that `lines` prop — there's no separate "let it decide" passthrough — so a later video (`VayTinChap`) hand-split short headlines into 2-entry arrays (e.g. `["CƠ HỘI HAY", "BẪY?"]` — 15 chars combined, fits ONE line) simply because the old instruction said to always use an explicit array. Result: needless line breaks with a large empty gap on the right of the shorter line, on nearly every scene. **Fix: default to ONE array entry containing the whole phrase** (e.g. `punchLines={["CƠ HỘI HAY BẪY?"]}`) and let the >15-char auto-breaker decide whether/where to split — don't pre-split into multiple entries by feel. Only write more than one entry for two genuinely separate clauses that must not visually run together (rare — count the combined length first; a lot of headlines that read as "obviously two lines" fit one line fine once you count).
- `SplitCompareScene` column width & positioning — place Left Column at `x="25%"` and Right Column at `x="75%"` with `width <= 360px` to guarantee 90px symmetrical safety margins on both left and right canvas edges.
- Sourcing complex Pexels photos with messy backgrounds — led to fuzzy, glitchy rembg cutouts. Always use Gemini AI `generate_board.py` for crisp studio cutouts. (Superseded: the background color itself moved from white to a chroma-key green/magenta screen — see the entry below and step 3/4 — because plain white still failed on pale subjects.)
- Trusting the requested rows x cols as pixel-crop math for a multi-cell board — checked head-to-head, the model rendered 6 uneven panels instead of the requested 2x2, and blind proportional cropping sliced across a panel boundary. `generate_board.py` now auto-detects real panel boundaries via connected-component analysis instead, and refuses to guess a name mapping on a count mismatch (saves generic `panel_N.png` + warns instead).
- Trusting a board's "detected count matches requested count, no warning" as proof the crop is right — grouping panels into rows by raw bbox-range overlap (instead of center proximity) silently merged two real rows into one whenever padding pushed their edges to within ~1px of touching, and produced a wrong name<->image mapping with zero warning. Fixed by banding on vertical center proximity instead. Always open each individually-named cropped file before use regardless — a matching count doesn't guarantee a correct mapping.
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
- **White background as the default source color was itself the bug, not
  just individual "pale subject" cases of it.** `process_cutout.py`'s
  removal (rembg) is ML salient-object segmentation, not a literal
  color-key — it finds the subject by contrast against the background,
  regardless of color. A plain white background gives near-zero contrast
  against ANY pale/white/cream subject (a document, an envelope, a light
  card, a white t-shirt), so the model erases the subject along with the
  background instead of just failing to find a crisp edge. The
  "don't describe a subject as white" rule that used to be here was
  treating the SYMPTOM (don't mention the color) instead of the CAUSE
  (the background itself has no contrast to key against). Fix: step 3
  now defaults every generated source to a chroma-key screen
  (`--bg green`, or `--bg magenta` when the subject itself contains
  green — cash, plants, herbs), and step 4's `process_cutout.py` runs a
  real color-distance chroma-key removal (with spill suppression) as the
  PRIMARY method for these, auto-detected per image by sampling its
  corners, falling back to rembg only when the corners don't sample as a
  clean flat chroma color (a real Pexels photo, or a generation that
  ignored the background instruction). Validated on synthetic test
  images reproducing the exact failure (a white shape on a noisy green
  background, and a green shape on a noisy magenta background — both
  survived correctly, auto-detection picked the right method for each)
  — NOT yet confirmed against a real Gemini-generated chroma image
  (OpenRouter credits ran out mid-session); treat the first real board
  generated under this scheme as the actual validation and watch its
  `removal:` log line + a pixel preview before trusting it blindly.
- Background grid contrast too subtle (0.07 alpha) to actually read —
  needs real contrast (0.32-ish), verified against a zoomed reference
  crop, not asserted.
- Reusing one entrance animation for every scene, or the same 1-2 SFX
  everywhere, reads as flat — vary both deliberately scene to scene.
- Choosing `PunchPhrase`'s `top` and the hero/supports' `y` independently
  per template default, with no regard for each other — produced scenes
  where the headline sat isolated near the top of the canvas and the
  hero cluster sat isolated in the middle, with a big dead gap between
  them and to the side, instead of reading as one composed frame. When
  wiring up a scene, look at where the hero+supports cluster actually
  lands (their real rendered bbox, not the nominal `y`) and place the
  headline to sit close above or beside that cluster, not at a fixed
  `top` that ignores it.
- All of a scene's visual elements bunched into the first ~2 seconds of
  entrance timing, then nothing new for the remaining 5-10s of the
  scene's audio — reads as the video going quiet/dead mid-sentence even
  though narration is still actively describing something. See step 2's
  per-support phrase-anchor requirement and `beat_sync.py` — this is now
  a mechanical check, not a "remember to vary the pacing" reminder.
- A cutout that's static after its entrance finishes looks frozen/dead —
  layer continuous low-amplitude idle motion (vary the TYPE — sway vs.
  tremble vs. bob — not just the phase).
- rembg does badly on busy/complex-background photos, large architecture,
  and flat-lay documents — route around this at the sourcing stage
  (step 3), not by fighting the mask after the fact.
- **Double-delay bug**: `DocumentStamp`, `FlowArrow`, and `VoxMapPin`
  each take their own `delay` prop and internally compute
  `local = frame - delay`. Wrapping one in `<Sequence from={X}>` AND
  also passing `delay={X}` to the component double-subtracts X — the
  element needs the LOCAL (already-shifted) frame to reach X a SECOND
  time before it animates in at all. Invisible at a small X (the
  original hardcoded 28/40/10 just added a trivial extra wait, easy to
  miss on a quick check) but became a real bug the moment a real
  word-anchored delay (165+) made the doubled wait exceed the scene's
  own length — a `DocumentStamp` and a `FlowArrow` both silently never
  appeared at all, caught only by rendering a still and seeing nothing
  there, not by any error. `Hero`/`Support` don't have this problem —
  they take no `delay` prop at all and rely purely on the wrapping
  `Sequence` for their local frame. Fix: when one of these three is
  inside a `Sequence`, always pass `delay={0}` to the component itself.
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
