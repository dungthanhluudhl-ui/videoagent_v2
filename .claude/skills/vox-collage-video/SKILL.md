---
name: vox-collage-video
description: Build a Vox-style grayscale-collage motion-graphics short in this Remotion project from just an audio file + script — no further style questions needed. Use this whenever the user hands over a voiceover/narration audio file (mp3/wav) plus its script and asks for a video, or says things like "make me a video from this audio", "dựng video từ audio này", "same style as before", "another Vox-style clip", or references a prior grayscale/collage video in this project. Covers the full pipeline end to end: Whisper transcription, scene segmentation, sourcing stock photos from the Pexels API (with an AI-image-prompt fallback list for anything Pexels doesn't have), turning them into grayscale cutouts, generating a varied SFX set, building the Remotion scene with a wide, non-repeating palette of entrance animations, registering it in Root.jsx, and previewing it via rendered frame screenshots.
---

# Vox-collage video pipeline (grayscale + orange, 9:16)

This is a Windows project with no browser-automation tool and no Remotion
MCP connection — everything runs through the Bash tool (Node/npm/npx are
available) and Python via the `py -3` launcher (not `python3`). Whisper,
rembg, scipy, and Pillow are already installed for this Python.

The visual target is the grayscale-collage look from
`docs/Vox-Style_Motion_Graphics_Using_Only_Claude_Code___Remotion_frames/`:
real stock photos, background removed, hero/person subjects desaturated
to plain contrast-boosted grayscale (NO halftone dot-screen pattern —
that was tried and explicitly rejected, don't reintroduce it), each with
a baked-in offset SOLID-ORANGE drop shadow, laid out on a pale
graph-paper-grid background (no kraft paper). Small supporting
props/graphics (safety gear, a tank, a flag/chart illustration) stay in
their original color instead of being desaturated. Bold black
punch-phrase text for the one timed highlight per scene (no
highlighter-yellow, no white paper-sticker edge, no persistent tag chip —
those belong to a *different* Vox sub-style this project isn't using).
Canvas is 1080x1920 @ 30fps (9:16) unless the user asks for 16:9.

Work through the steps below in order. Visual style is already decided —
don't re-ask about it. The one thing worth pausing for, per video, is a
checkpoint after step 2: show the user the scene-by-scene shot list
before spending effort sourcing images and building.

## 0. Before you start

Confirm `py -3 -c "import whisper, rembg, scipy, PIL, numpy, requests"`
succeeds; if anything's missing, `py -3 -m pip install rembg onnxruntime
scipy openai-whisper pillow numpy requests`.

Pexels needs no browser: `PEXELS_API_KEY` lives in the project's `.env`
file (already gitignored). `scripts/fetch_pexels.py` reads it automatically.

## 1. Transcribe the audio

Copy the provided audio into `public/` under a short name (e.g.
`audio.wav`). Transcribe with Whisper for word-level timestamps — these
are what scene cuts, punch-phrase timing, and SFX cues all sync to:

```bash
py -3 -c "
import whisper, json
model = whisper.load_model('base')
result = model.transcribe('public/audio.wav', word_timestamps=True, language='vi')
json.dump(result, open('transcript.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
"
```

Use `language='vi'` for Vietnamese scripts (or whatever language the
script is actually in — don't default to English). The `base` model
sometimes mis-hears specific Vietnamese words even with word_timestamps
on; trust the user-provided script text for what a word *says*, and trust
Whisper's timing for *when* it's said — match by position within a
sentence, not by re-reading Whisper's own (possibly garbled) transcript.

## 2. Segment the script into scenes, draft the shot list, checkpoint

Use Whisper's segment boundaries as scene boundaries — they already
follow natural breath/sentence groups. Group adjacent segments that
belong to the same sentence/idea into one scene; split out a quoted or
emotionally-loaded line into its own scene even if short. Don't force a
minimum or maximum scene count — let the sentences decide.

For each scene decide:
- **tag** — one short persistent word/phrase shown all scene as the
  orange chip.
- **punch phrase** — ONE short catchy highlight tied to a specific word,
  computed as `appearAt = round(word.start * 30) - sceneStartFrame`
  (LOCAL frame). Not a running caption — isolated, precisely-timed
  pull-quotes only.
- **hero image** — the single most visually central subject of the
  sentence.
- **2-4 support elements** — smaller cutouts reinforcing the sentence's
  specific content, not generic decoration.
- **variant** — an entrance animation (see step 6); no two consecutive
  scenes repeat one.

**Present this shot list to the user as text before moving on** — tag,
punch phrase + which word it's keyed to, hero + supports (named, not yet
sourced), variant. Only proceed to sourcing/building after they approve
or adjust it. Skip this checkpoint only if the user has explicitly said
to run a video end-to-end without review.

For topics with culturally-specific subject matter Pexels' generic
Western stock library won't have (a specific country's court system, a
local slang term, a specific institution) — plan from the start to use
universal symbolic imagery for the Pexels-sourced elements (scales of
justice, a gavel, a handshake in shadow, an envelope of cash) and route
anything genuinely specific to the step-3 AI-image-prompt fallback.

## 3. Source the photos

`scripts/fetch_pexels.py` calls the Pexels REST API directly — no
browser needed:

```bash
# Preview candidates before downloading anything — id, dimensions,
# photographer, a thumbnail URL:
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py list "gavel" --orientation portrait

# Download one (index from the list above, default 0):
py -3 .claude/skills/vox-collage-video/scripts/fetch_pexels.py get "gavel" public/raw_gavel.jpg --orientation portrait --index 0
```

**Picking which result to use matters more than it looks — check with
the Read tool before committing.** rembg does great on a subject shot
against a plain color backdrop or a clearly-separated scene, and does
*badly* on a busy photo (a blurred background scene, a subject among
similar-toned objects, a subject sitting on white paper/documents) —
it can't tell where the subject ends and the "background" begins. Open
the raw download with Read; if it's a busy/complex scene rather than one
clear isolated subject, try the next index or a more specific query
(e.g. "gavel white background" instead of "judge gavel") before running
it through the cutout script.

If a search genuinely turns up nothing usable (mainly: anything
culturally/topically specific that a generic Western stock library
won't have), add a line to an AI-image prompt list instead of keeping
searching Pexels — see the prompt-writing note at the end of this
section. Only ask the user to supply an image themselves as a last
resort, when neither source works.

For the AI-image fallback: write each prompt on its own line with no
leading bullet/number character (so the user can paste the whole block
into a batch image generator), and save the list to
`assets/ai-image-prompts.txt` at the project root. Tell the user which
scene/element each prompt is for, and the exact filename to save the
downloaded result as in `public/` (e.g. `raw_co_an_handshake.jpg`) so it
drops straight into step 4.

Also grab one subtle paper/graph-paper-texture photo for the background
if you want more tactile depth than the flat pale-grid CSS gradient —
only needs fetching once per video.

## 4. Turn photos into grayscale cutouts

```bash
py -3 .claude/skills/vox-collage-video/scripts/process_cutout.py \
  public/raw_gavel.jpg public/el_gavel.png \
  public/raw_envelope.jpg public/el_envelope.png \
  ...
```

This removes the background (rembg with the `isnet-general-use` model —
checked head-to-head against the default `u2net`: isnet gives a visibly
crisper edge, same speed once the ~179MB model is cached after its first
run), drops stray disconnected mask fragments, crops tightly to content
bounds with a small margin, desaturates to plain contrast-boosted
grayscale, and bakes in the offset solid-orange drop shadow — all in one
pass.

**No halftone dot-screen pattern.** An earlier pass applied a dot-screen
effect (reasoning: a zoomed-in check of the reference frames showed the
reference DOES use a genuine dot-screen on some photos, e.g. a ship) —
that technical read was accurate, but the user explicitly rejected the
dot-screen look for this project regardless and asked for plain
grayscale. Follow that direction; don't re-derive dot-screen from the
reference frames again without asking first — this is a standing
product decision, not an open technical question.

Pass `--color` for small supporting PROPS that should stay in original
color — confirmed against the reference frames that safety gear, a tank,
etc. stay color while sitting next to a grayscale hero portrait.
Full-color vector/3D graphics (a flag map illustration, a chart mockup)
also want `--color`.

The script warns on stderr if content is still small relative to its
own crop, or if a source photo doesn't crop the way you'd expect —
re-check that one with Read before moving on.

**Preview a couple of outputs before wiring up the scene** — composite
over the pale background color and view it:

```bash
py -3 -c "
from PIL import Image
im = Image.open('public/el_gavel.png')
bg = Image.new('RGBA', im.size, (234,230,220,255))
bg.alpha_composite(im)
bg.convert('RGB').save('/tmp/check_gavel.jpg', quality=90)
"
```
Then Read `/tmp/check_gavel.jpg`. Catching a bad cutout here is much
cheaper than discovering it after the whole scene is wired up.

## 5. Generate SFX

```bash
py -3 .claude/skills/vox-collage-video/scripts/generate_sfx.py public/sfx
```

Synthesizes eleven one-shots locally (whoosh, pop, coin, thud, boing,
swipe, click, riser, drop, shatter, paper — see the script's docstring
for pairing notes). Wire them via the `Sfx` helper in the reference
scene at the actual beat each belongs to, not bunched at frame 0. Keep
volumes 0.3-0.55. Spread the full set across a video's scenes the same
way you vary entrance animations — reusing the same 2-3 sounds every
scene reads as flat.

## 6. Build the scene

Copy `references/example-scene.jsx` to `src/<VideoName>.jsx`, rename the
component and the two exported constants (`SOMETHING_CANVAS`,
`SOMETHING_TOTAL_FRAMES`), fill in `SEGMENTS` with the approved shot
list plus the real image filenames from step 4. The file's comments
explain each piece; `references/animation-variants.md` has the full
entrance-animation set (rise/grow/punch/flip plus shatter/peel/unfold/
spiral/wobble-drop/zoom-through) with implementation notes and natural
SFX pairing — read it before defaulting back to the same four on any
video with more than 4 scenes.

Vietnamese (or other non-English) text needs a font that covers the
right subset — the template already loads Be Vietnam Pro with the
`vietnamese` subset via `@remotion/google-fonts/BeVietnamPro`. If a
script uses a different language/script, swap in a font + subset that
covers it.

Place the punch phrase (and any other big text) in whatever grid space
is actually empty for that scene's hero layout — don't hardcode a fixed
y-coordinate and assume it'll be clear. A fixed position that happens to
land on the hero image reads as illegible/messy (this was caught by
rendering a real test frame and looking at it, not assumed away) —
check the hero's box for that scene and pick empty space, the way the
reference frames keep headline text on open grid, never overlapping the
photo.

## 7. Register and preview

Add the import + `<Composition>` block to `src/Root.jsx`, matching the
pattern of scenes already registered there.

There's no browser tool in this environment, so preview by starting
Remotion Studio in the background and pulling still frames instead of
scrubbing live:

```bash
npx remotion studio   # run with run_in_background: true
```

Once it's up (check the backgrounded task's output for the local URL),
render a handful of representative frames straight to images for a fast
look without a full MP4:

```bash
npx remotion still <CompositionId> /tmp/frame_0000.png --frame=0
npx remotion still <CompositionId> /tmp/frame_0090.png --frame=90
```
Read each PNG to check composition, timing, and text legibility scene by
scene. Only fall back to a full `npx remotion render <CompositionId>
out/<name>.mp4 --overwrite` if the user specifically asks for an
exported file, or stills aren't enough to debug something (e.g. audio
sync, which stills can't show).

## Things earlier attempts got wrong (so you don't repeat them)

- A word-by-word caption bar across the bottom reads as generic/basic —
  use the persistent tag + single timed punch-phrase pattern instead.
- Reusing one entrance animation for every scene reads as flat. Vary it
  scene to scene on purpose.
- A cutout that's static after its entrance finishes looks frozen/dead —
  always layer continuous low-amplitude idle motion under whatever the
  scene's specific animation is doing.
- Elements can look small even in a generously-sized layout box if the
  source PNG has a lot of empty transparent padding — process_cutout.py
  crops to content bounds automatically, but double-check anything that
  looks off.
- rembg does badly on busy/complex-background photos — route around this
  at the sourcing stage (step 3) by previewing raw downloads with Read
  before running the cutout script, not by fighting it after the fact.
- A video where every scene uses the same 1-2 SFX sounds as flat as one
  that reuses the same entrance animation everywhere.
- Don't skip the step-2 checkpoint on a first video for a new script/
  topic — sourcing and building is the expensive part of this pipeline;
  catching a wrong creative direction in a text shot-list is cheap,
  catching it after building a scene isn't.
