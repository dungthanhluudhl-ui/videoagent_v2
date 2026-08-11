"""
Generate stock-style cutout source images with Gemini image models via the
OpenRouter API. Replaces generate_image.py: a single cell (N=1) behaves
identically to the old one-image-per-call script (no grid wrapping, no
crop, raw prompt sent as-is) - so this is a strict superset, not a
separate tool to choose between.

For N>1 cells, all cells are requested in ONE API call as a grid ("board")
on a single image, then cropped apart locally. This is the default
whenever a scene needs 2+ small object/prop cutouts, or a recurring
character needs multiple poses/expressions (a "character sheet") - both
save real API round-trips vs one call per element, and a character sheet
also gives far more face/outfit consistency across scenes than
independent single-image calls ever can, since the model sees all poses
together in one generation.

Cropping does NOT trust the requested rows x cols as pixel math - checked
head-to-head on a real 4-cell request, the model rendered 6 uneven panels
(4 across the top row, 2 wider ones on the bottom) instead of a clean
2x2 grid, and blind proportional cropping sliced straight across a panel
boundary as a result. Instead, cropping auto-detects real panel
boundaries via connected-component analysis on non-white pixels (the
white gaps between panels are what separates them), sorts components
into reading order (row-band top-to-bottom, then left-to-right), and
only maps them 1:1 onto the requested cell names when the detected count
matches the requested count. On a mismatch it saves every detected panel
under a generic name and prints a warning - inspect the contact sheet
and re-map/rename by hand rather than trust an automatic guess.

Reads OPENROUTER_API_KEY from a .env file (searched upward from this
script's location) or from the environment. No browser automation needed.

Usage - single image (N=1, no grid overhead):

    python generate_board.py board \
        --cell "gavel=a gavel, studio product photo on a solid plain white background" \
        --out-dir input/raw_cache

Usage - object board (several distinct small props in one call):

    python generate_board.py board \
        --cell "shield=a glossy blue shield icon with a checkmark, studio product photo on a solid plain white background" \
        --cell "calculator=a handheld electronic calculator, studio product photo on a solid plain white background" \
        --cell "cash=a stack of Vietnamese dong banknotes, studio product photo on a solid plain white background" \
        --out-dir input/raw_cache

Usage - character sheet (same person, several poses, guaranteed consistent):

    python generate_board.py board \
        --consistent-subject "a young Vietnamese male office worker in his mid-20s, short black hair, light blue collared shirt" \
        --cell "shocked=wide-eyed shocked expression, looking down at a phone in his hand" \
        --cell "mathcalc=smiling, one hand raised doing a finger-counting mental math gesture" \
        --cell "advice=looking straight at camera, one hand raised pointing forward giving friendly advice" \
        --cell "thinking=thoughtful expression, hand on chin" \
        --out-dir input/raw_cache --cols 2

Options:
    --model NAME              default: google/gemini-3.1-flash-lite-image
    --cols N                  grid columns (default: near-square auto layout)
    --consistent-subject TXT  shared subject description prepended so every
                               cell renders the SAME character/object,
                               varying only what each cell's own text says
    --board-out PATH          also save the raw uncropped board image here
                               (default: <out-dir>/_board_<first-cell-name>.png)
                               - always inspect this before trusting the crop

After running, ALWAYS preview both the raw board (to check the model
actually followed the grid) and each cropped cell (composited over a
solid color, same discipline as any other cutout source) before feeding
cells into process_cutout.py - a model that ignores the grid instruction
needs a more explicit prompt and a re-generation, not a crop-math fix.
"""

import argparse
import base64
import json
import math
import os
import pathlib
import sys
import urllib.request
import urllib.error

import numpy as np
from PIL import Image
from scipy import ndimage

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-3.1-flash-lite-image"


def load_api_key():
    key = os.environ.get("OPENROUTER_API_KEY")
    if key:
        return key
    here = pathlib.Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        env_path = parent / ".env"
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.split("=", 1)[1].strip()
    sys.exit("OPENROUTER_API_KEY not found in environment or any .env file above this script.")


def generate(prompt, model):
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"],
    }).encode("utf-8")
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {load_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"OpenRouter API error {e.code}: {e.read().decode('utf-8', 'replace')}")

    usage = data.get("usage") or {}
    if usage:
        print(f"usage: prompt_tokens={usage.get('prompt_tokens')} "
              f"completion_tokens={usage.get('completion_tokens')} "
              f"total_tokens={usage.get('total_tokens')}")

    choice = data["choices"][0]["message"]
    images = choice.get("images") or []
    if not images:
        sys.exit(f"No images returned. Model said: {choice.get('content')!r}")
    url = images[0]["image_url"]["url"]
    if not url.startswith("data:"):
        sys.exit(f"Unexpected non-data-URI image_url: {url[:80]}")
    _, b64data = url.split(",", 1)
    return base64.b64decode(b64data)


def build_grid_prompt(cells, cols, rows, consistent_subject):
    n = len(cells)
    lines = [
        f"Create ONE single image containing a {rows}x{cols} grid of exactly {n} "
        "separate panels, arranged in reading order (left to right, top to bottom). "
        "Each panel is an equal-size square area on a solid plain white background, "
        "separated from its neighbors by a clear uniform gap of empty white space so "
        "panels never touch or overlap. Each panel is a complete, isolated studio "
        "product photo composition - nothing crosses a panel boundary.",
    ]
    if consistent_subject:
        lines.append(
            f"The SAME subject appears in every panel: {consistent_subject}. "
            "Keep its identity (face, hairstyle, outfit, proportions) perfectly "
            "identical across all panels - only what each panel's own description "
            "below says should change (pose, expression, action, camera angle)."
        )
    for i, (name, prompt) in enumerate(cells, 1):
        lines.append(f"Panel {i}: {prompt}")
    return "\n".join(lines)


def detect_panels(im, min_area=500, rel_size_floor=0.15, pad_frac=0.015):
    """Find real panel bounding boxes via connected components on non-white
    pixels, then sort into reading order (row-band top-to-bottom, then
    left-to-right within a band). Robust to the model not producing an
    exact/uniform grid - see module docstring.

    A fine detail WITHIN one product photo (an embossed coin pattern, an
    envelope's folded flap edge) can have anti-aliasing gaps that look
    like a separate component to naive connected-component labeling -
    checked head-to-head, a 3-object board came back as 7 "components"
    this way. Bridging small gaps with dilation was tried and rejected:
    a dilation radius wide enough to merge those internal gaps also
    merged genuinely separate panels whose real gap was similarly narrow
    (~15px) on a different board. What actually works cleanly on both
    real boards tested: real panels all land within roughly the same
    order of magnitude of pixel count (photos of comparable framing),
    while internal-detail fragments are tiny by comparison (<2% of the
    largest real panel vs >45% for the smallest real panel in testing) -
    so a relative-to-the-largest floor separates them with a wide margin
    without needing a fragile absolute gap/size constant.
    """
    arr = np.array(im.convert("RGB"))
    fg = arr.mean(axis=2) < 245  # non-near-white = panel content
    labeled, n = ndimage.label(fg, structure=np.ones((3, 3)))
    objs = ndimage.find_objects(labeled)
    sizes = ndimage.sum(fg, labeled, range(1, n + 1))

    survivors = [(sl, sz) for sl, sz in zip(objs, sizes) if sz >= min_area]
    if not survivors:
        return []
    size_floor = max(min_area, max(sz for _sl, sz in survivors) * rel_size_floor)

    w, h = im.size
    pad_x, pad_y = int(w * pad_frac), int(h * pad_frac)
    boxes = []
    for sl, sz in survivors:
        if sz < size_floor:
            continue
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        boxes.append((max(0, x0 - pad_x), max(0, y0 - pad_y), min(w, x1 + pad_x), min(h, y1 + pad_y)))

    boxes.sort(key=lambda b: b[1])
    bands = []
    for b in boxes:
        for band in bands:
            if not (b[3] < band["y0"] or b[1] > band["y1"]):  # vertical overlap with band
                band["items"].append(b)
                band["y0"] = min(band["y0"], b[1])
                band["y1"] = max(band["y1"], b[3])
                break
        else:
            bands.append({"y0": b[1], "y1": b[3], "items": [b]})
    bands.sort(key=lambda bd: bd["y0"])

    ordered = []
    for band in bands:
        ordered.extend(sorted(band["items"], key=lambda b: b[0]))
    return ordered


def crop_board(board_bytes, cells, out_dir):
    board_path = pathlib.Path(out_dir) / f"_board_{cells[0][0]}.png"
    board_path.write_bytes(board_bytes)
    print(f"Saved raw board {board_path} ({len(board_bytes)} bytes) - inspect this first")

    im = Image.open(board_path).convert("RGBA")
    panels = detect_panels(im)
    print(f"Detected {len(panels)} real panel(s) vs {len(cells)} requested cell(s)")

    if len(panels) != len(cells):
        print(f"WARNING: count mismatch - saving all {len(panels)} detected panels under "
              f"generic names. Inspect {board_path} and rename/re-map by hand.")
        for i, box in enumerate(panels, 1):
            dest = pathlib.Path(out_dir) / f"panel_{i}.png"
            im.crop(box).save(dest)
            print(f"Cropped {dest} bbox={box}")
        return

    for (name, _prompt), box in zip(cells, panels):
        dest = pathlib.Path(out_dir) / f"{name}.png"
        im.crop(box).save(dest)
        print(f"Cropped {dest} bbox={box}")


def cmd_board(args):
    cells = []
    for raw in args.cell:
        if "=" not in raw:
            sys.exit(f"--cell must be in 'name=prompt' form, got: {raw!r}")
        name, prompt = raw.split("=", 1)
        cells.append((name.strip(), prompt.strip()))

    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    n = len(cells)
    if n == 1:
        # Strict superset of the old single-image generate_image.py: no
        # grid wrapping, no crop, the raw prompt goes straight through.
        name, prompt = cells[0]
        image_bytes = generate(prompt, args.model)
        dest = out_dir / f"{name}.png"
        dest.write_bytes(image_bytes)
        print(f"Saved {dest} ({len(image_bytes)} bytes)")
        return

    cols = args.cols or math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)
    prompt = build_grid_prompt(cells, cols, rows, args.consistent_subject)
    board_bytes = generate(prompt, args.model)
    crop_board(board_bytes, cells, out_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_board = sub.add_parser("board", help="Generate one or more cells (1 = plain single image, 2+ = grid board)")
    p_board.add_argument("--cell", action="append", required=True, help="'name=prompt' - repeat for each cell")
    p_board.add_argument("--out-dir", required=True)
    p_board.add_argument("--cols", type=int, default=None)
    p_board.add_argument("--consistent-subject", default=None)
    p_board.add_argument("--model", default=DEFAULT_MODEL)
    p_board.set_defaults(func=cmd_board)

    args = parser.parse_args()
    args.func(args)
