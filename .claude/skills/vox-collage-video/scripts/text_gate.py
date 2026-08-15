"""
text_gate.py - what the drawn TEXT does, which no other gate could see.

Three defects shipped in V11 that every existing gate passed:

  1. Labels overlapping other elements. `review_gate` measures how much of the
     usable band carries ink - and text laid on top of an image produces ink
     just as well as text laid beside it. So "fill the empty band" was
     satisfied by writing over the picture, the metric went green, and the
     composition got worse. A density measure cannot tell full from collided.

  2. Sentences, not labels. The caption bar already runs the narration
     word-by-word at the bottom of every frame. Any drawn sentence therefore
     competes with the captions for the same reading attention while the voice
     is saying the same thing a third time. V11 carried 363 drawn words on top
     of the captions; S21 alone had 39.

  3. Restating the narration. Several drawn lines were the narration sentence
     re-typed. That is the worst case of (2): three channels, one message,
     none of them a picture.

So this gate reads the built .jsx, reconstructs each DrawnText's box and the
window it is on screen, and fails when:

  * a label's box overlaps a planned image asset's box while both are visible
  * a label's box overlaps another label's box in the same window
  * a label runs past the canvas edge or into the caption strip
  * a label is longer than MAX_LABEL_WORDS (punch phrases are exempt - they
    are the headline, and they get the whole top of the frame to themselves)
  * a label repeats a run of words from the narration verbatim

Text width is estimated, not measured: Be Vietnam Pro at weight 800 runs about
0.52 em per character for Vietnamese. The estimate is deliberately generous
(0.50) so the gate flags real collisions rather than near-misses.

    py -3 text_gate.py input/scene_plan11.json
    py -3 text_gate.py input/scene_plan11.json --scene S21
"""

import argparse
import json
import pathlib
import re
import sys
import unicodedata

CANVAS_W, CANVAS_H = 1080, 1920
CAPTION_TOP = 1420          # captions mount at bottom:440 -> top edge ~1420
CHAR_EM = 0.50              # width per character, in ems
MAX_LABEL_WORDS = 4         # a label is looked at; a sentence is read
MIN_NARRATION_RUN = 4       # this many consecutive narration words = a restatement
EDGE = 24                   # keep-out from the canvas edge


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn").lower()


def text_box(x, y, size, anchor, text):
    """(left, top, right, bottom) for an SVG <text> in canvas coordinates."""
    w = len(text) * size * CHAR_EM
    if anchor == "middle":
        left = x - w / 2
    elif anchor == "end":
        left = x - w
    else:
        left = x
    # SVG y is the BASELINE; the glyph body sits above it.
    return (left, y - size * 0.78, left + w, y + size * 0.22)


def overlap(a, b):
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def parse_labels(text, scene_duration):
    """Every DrawnText in a scene file, with its absolute box and window."""
    labels = []
    for m in re.finditer(r"<DiagramCanvas([^>]*)>", text):
        attrs = m.group(1)
        cy = float(re.search(r"y=\{(-?\d+)\}", attrs).group(1)) if re.search(r"y=\{(-?\d+)\}", attrs) else 160.0
        # body of this canvas: up to its matching close tag
        end = text.find("</DiagramCanvas>", m.end())
        body = text[m.end():end if end > 0 else len(text)]
        # BOTH tags. Only matching <DrawnText> left every bare <text> invisible
        # to this gate - which is every label in V10 and any future scene that
        # forgets the timed variant. A gate blind to the plain form is a gate
        # you can walk around by deleting five characters.
        tag_re = r"<(DrawnText|text)\s+([^>]*?)>\s*(.*?)\s*</" + r"\1>"
        for dm in re.finditer(tag_re, body, re.S):
            rest, content = dm.group(2), dm.group(3)
            dmm = re.search(r"delay=\{(\d+)\}", rest)
            raw_delay = dmm.group(1) if dmm else "0"
            if "{" in content:          # a prop-driven label inside a helper
                continue
            try:
                delay = int(raw_delay)
            except ValueError:
                continue
            xm = re.search(r"(?<![A-Za-z])x=\{(-?\d+)\}", rest)
            ym = re.search(r"(?<![A-Za-z])y=\{(-?\d+)\}", rest)
            if not (xm and ym):
                continue
            fm = re.search(r"fontSize:\s*(\d+)", rest)
            size = int(fm.group(1)) if fm else 34
            anchor = "start"
            am = re.search(r'textAnchor="(\w+)"', rest)
            if am:
                anchor = am.group(1)
            content = " ".join(content.split())
            # `overlayOn="Name"` says this label is MEANT to sit on that asset -
            # the exit number written across a deliberately blank sign, a figure
            # labelled in place. It is a declaration, not an escape hatch: it
            # names its target, so an overlay on anything else still fails.
            om = re.search(r'overlayOn="([A-Za-z0-9_-]+)"', rest)
            box = text_box(int(xm.group(1)), cy + int(ym.group(1)), size, anchor, content)
            labels.append({"text": content, "box": box, "from": delay,
                           "to": scene_duration, "size": size,
                           "overlay_on": om.group(1) if om else None})
    return labels


def asset_boxes(scene, public_dir):
    """Planned image assets as (name, box, from, to)."""
    out = []
    for a in scene.get("assets", []):
        src, w, x, y = a.get("src"), a.get("width"), a.get("x"), a.get("y")
        if not (src and w and y is not None and x is not None):
            continue
        try:
            from PIL import Image
            im = Image.open(public_dir / pathlib.Path(src).name)
            h = w * im.height / im.width
        except Exception:                                    # noqa: BLE001
            h = w
        left = (CANVAS_W - w) / 2 if str(x).endswith("%") else float(x)
        d = int(a.get("delay") or 0)
        v = a.get("visibleFor")
        out.append((a.get("name") or src, (left, float(y), left + w, float(y) + h),
                    d, d + int(v) if v else 10 ** 6))
    return out


def narration_runs(words_path, start, end):
    """Normalised word-runs the narration itself says inside this scene."""
    try:
        w = json.loads(pathlib.Path(words_path).read_text(encoding="utf-8"))["words"]
    except Exception:                                        # noqa: BLE001
        return set()
    toks = [strip_accents(x[0]) for x in w if start <= x[1] < end]
    return {" ".join(toks[i:i + MIN_NARRATION_RUN])
            for i in range(max(0, len(toks) - MIN_NARRATION_RUN + 1))}


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--scenes-dir", default="src/scenes")
    ap.add_argument("--public-dir", default="public")
    ap.add_argument("--scene", default=None)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    plan = json.loads(pathlib.Path(args.plan).read_text(encoding="utf-8"))
    video = plan.get("video", "V")
    scenes = plan.get("scenes", [])
    if args.scene:
        scenes = [s for s in scenes if s.get("id") == args.scene]
    words_path = pathlib.Path("input") / (plan.get("wordsFile") or "")
    public_dir = pathlib.Path(args.public_dir)

    problems, checked, total_words = [], 0, 0
    for scene in scenes:
        sid = scene.get("id", "")
        path = pathlib.Path(args.scenes_dir) / f"{video}Scene{sid.lstrip('S')}.jsx"
        if not path.exists():
            continue
        src = path.read_text(encoding="utf-8")
        dur = int(scene.get("durationInFrames") or 0)
        labels = parse_labels(src, dur)
        assets = asset_boxes(scene, public_dir)
        runs = narration_runs(words_path, scene.get("startSec", 0), scene.get("endSec", 0))
        checked += 1
        total_words += sum(len(l["text"].split()) for l in labels)

        for i, lab in enumerate(labels):
            # "·" is a separator between two labels, not a word of its own.
            words = [w for w in lab["text"].split() if w not in ("·", "-", "|")]
            if len(words) > MAX_LABEL_WORDS:
                problems.append(
                    f"{sid}: label {lab['text']!r} is {len(words)} words. The caption bar is "
                    f"already running the narration word-by-word underneath - a drawn sentence "
                    f"makes the viewer read two texts while hearing a third. "
                    f"Cut to <= {MAX_LABEL_WORDS} words, or replace it with a symbol.")
            key = " ".join(strip_accents(w) for w in words)
            if len(words) >= MIN_NARRATION_RUN and any(r and r in key for r in runs):
                problems.append(
                    f"{sid}: label {lab['text']!r} restates what the narration says in this "
                    f"same scene. Three channels, one message, none of them a picture.")

            L, T, R, B = lab["box"]
            if L < EDGE or R > CANVAS_W - EDGE:
                problems.append(
                    f"{sid}: label {lab['text']!r} spans x {L:.0f}..{R:.0f} - outside the "
                    f"{EDGE}px keep-out. It will touch or cross the frame edge.")
            if B > CAPTION_TOP:
                problems.append(
                    f"{sid}: label {lab['text']!r} reaches y={B:.0f}, inside the caption strip "
                    f"(top {CAPTION_TOP}). It will sit under the subtitles.")

            for name, abox, af, at in assets:
                if lab.get("overlay_on") == name:
                    continue
                if lab["from"] < at and af < lab["to"] and overlap(lab["box"], abox):
                    problems.append(
                        f"{sid}: label {lab['text']!r} overlaps image {name} while both are on "
                        f"screen (frames {max(lab['from'], af)}-{min(lab['to'], at)}). Filling a "
                        f"gap by writing over the picture is what made review_gate go green on "
                        f"a worse composition.")
            for other in labels[i + 1:]:
                if lab["from"] < other["to"] and other["from"] < lab["to"] \
                        and overlap(lab["box"], other["box"]):
                    problems.append(
                        f"{sid}: labels {lab['text']!r} and {other['text']!r} overlap each other "
                        f"while both are on screen.")

    if args.json:
        print(json.dumps({"passed": not problems, "problems": problems},
                         ensure_ascii=False, indent=2))
    else:
        for p in problems:
            print(f"FAIL {p}")
        if not problems:
            print(f"OK   {checked} scene(s): every drawn label is <= {MAX_LABEL_WORDS} words, "
                  f"inside the frame, clear of the captions, and not on top of anything else")
        print(f"     {total_words} drawn word(s) across {checked} scene(s) - these sit ON TOP "
              f"of the word-by-word caption bar")
        print(f"\n{'FAILED' if problems else 'PASSED'} ({len(problems)} problem(s))")

    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
