"""
Turn a raw stock photo into a Vox-style cutout PNG:

  1. Remove the background (rembg, isnet-general-use model — see note below).
  2. Drop stray disconnected mask fragments rembg left behind, keep only
     the main foreground blob(s).
  3. Crop tightly to content bounds with a small margin.
  4. Desaturate to grayscale for hero/person subjects (see --color for the
     opposite case) — plain contrast-boosted grayscale, NOT a halftone dot
     pattern. An earlier version of this script applied a dot-screen
     effect here; that was dropped on explicit direction — don't
     reintroduce it without asking first.
  5. Bake in an offset solid-orange drop-shadow silhouette behind the cutout,
     but ONLY for person subjects (grayscale path) — per the reference,
     object/prop cutouts (--color) do not get this treatment. Pass
     --shadow to force it on anyway if a specific --color case needs it.

Model choice, checked head-to-head on the same photo (not just asserted):
default rembg (u2net) leaves a soft/blurry halo around hair and shoulder
edges; isnet-general-use gives a visibly crisper edge on the same image.
isnet-general-use is a ~179MB one-time download (~40s the very first
call); after that it's cached locally and just as fast as u2net per
image. Use --model u2net to fall back if needed.

Color-or-not: grayscale is the default (hero/person real photos). Pass
--color for small supporting props/graphics that should stay full color
(safety gear, a tank, a flag/chart graphic) — confirmed against the
reference frames that these stay in original color next to a grayscale
hero.

Usage:
    python process_cutout.py raw_a.jpg out_a.png raw_b.jpg out_b.png ...

Flags (apply to every pair in the call — run separately for mixed needs):
    --color         keep full color, skip desaturation (small supporting
                     props/graphics — safety gear, a tank, a flag/chart).
                     Implies no drop shadow unless --shadow is also passed.
    --shadow        force the orange drop shadow on even for --color cutouts
    --no-shadow     skip the drop shadow even for grayscale/person cutouts
    --shadow-color  hex color for the drop shadow, default ff7a1a
    --model NAME    rembg model, default isnet-general-use
"""

import argparse
import sys

import numpy as np
from PIL import Image, ImageOps
from rembg import remove, new_session
from scipy import ndimage

MARGIN_FRAC = 0.04
MIN_BLOB_FRAC = 0.02  # drop connected components smaller than this fraction of the largest blob


def clean_mask(alpha):
    mask = alpha > 20
    # Open first so fragments only thinly bridged to the main blob (a
    # shadow rembg misjudged as foreground, a reflection) get separated
    # before we measure component sizes.
    opened = ndimage.binary_opening(mask, structure=np.ones((5, 5)))
    labeled, n = ndimage.label(opened)
    if n == 0:
        return alpha
    sizes = ndimage.sum(opened, labeled, range(1, n + 1))
    keep_thresh = sizes.max() * MIN_BLOB_FRAC
    keep_labels = set(i + 1 for i, s in enumerate(sizes) if s >= keep_thresh)
    keep_seeds = np.isin(labeled, list(keep_labels))
    # Grow back to the original (un-opened) mask so we don't lose the
    # thin real edges opening ate into — just the fragments it isolated.
    full_labeled, _ = ndimage.label(mask)
    keep_full_labels = set(np.unique(full_labeled[keep_seeds])) - {0}
    cleaned = np.isin(full_labeled, list(keep_full_labels))
    alpha_out = alpha.copy()
    alpha_out[~cleaned] = 0
    return alpha_out


def tighten_edges(rgba, low=50, high=190):
    # rembg's raw alpha leaves a soft low-value fringe (motion blur, faint
    # shadow) attached to the main blob that clean_mask's component filter
    # doesn't catch since it's contiguous with real content, not a separate
    # blob. That fringe is what reads as "smoke"/haze around the cutout.
    # Push it to a steep curve so soft residue collapses to transparent
    # while true edges stay antialiased over a short band.
    r, g, b, a = rgba.split()
    a = np.array(a).astype(np.float64)
    a = np.clip((a - low) / max(1, (high - low)), 0, 1) * 255
    return Image.merge("RGBA", (r, g, b, Image.fromarray(a.astype(np.uint8), "L")))


def crop_to_content(rgba):
    alpha = np.array(rgba)[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        return rgba
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    w, h = rgba.size
    mx = int((x1 - x0) * MARGIN_FRAC) + 4
    my = int((y1 - y0) * MARGIN_FRAC) + 4
    x0, y0 = max(0, x0 - mx), max(0, y0 - my)
    x1, y1 = min(w, x1 + mx), min(h, y1 + my)
    cropped = rgba.crop((x0, y0, x1, y1))
    content_frac = ((x1 - x0) * (y1 - y0)) / (w * h)
    if content_frac < 0.15:
        print(f"  warning: content is only {content_frac:.0%} of the source frame after crop — "
              f"may still look small, consider a tighter-framed source photo", file=sys.stderr)
    return cropped


def to_grayscale(rgba):
    # Autocontrast + a mild S-curve so it reads as punchy black/white
    # rather than flat gray. No dot pattern — plain desaturation.
    gray = ImageOps.autocontrast(rgba.convert("L"), cutoff=1)
    alpha = rgba.split()[3]
    g = np.array(gray).astype(np.float64) / 255.0
    g = np.clip((g - 0.5) * 1.25 + 0.5, 0, 1)
    g8 = (g * 255).astype(np.uint8)
    gray_img = Image.fromarray(g8, "L")
    return Image.merge("RGBA", (gray_img, gray_img, gray_img, alpha))


def add_drop_shadow(rgba, color_hex, offset_frac=0.03):
    w, h = rgba.size
    dx = dy = max(6, int(min(w, h) * offset_frac))
    canvas = Image.new("RGBA", (w + dx, h + dy), (0, 0, 0, 0))
    color = tuple(int(color_hex[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
    # Binarize the silhouette for the shadow so it reads as a crisp offset
    # shape (like the reference frames) instead of a soft blurry halo from
    # rembg's antialiased edge.
    alpha = rgba.split()[3].point(lambda a: 255 if a > 140 else 0)
    shadow = Image.new("RGBA", rgba.size, color)
    shadow.putalpha(alpha)
    canvas.alpha_composite(shadow, (dx, dy))
    canvas.alpha_composite(rgba, (0, 0))
    return canvas


def process_one(raw_path, out_path, do_color, do_shadow, shadow_color, session):
    print(f"processing {raw_path} -> {out_path}")
    src = Image.open(raw_path).convert("RGB")
    removed = remove(src, session=session)  # RGBA
    alpha = np.array(removed)[:, :, 3]
    cleaned_alpha = clean_mask(alpha)
    arr = np.array(removed)
    arr[:, :, 3] = cleaned_alpha
    rgba = Image.fromarray(arr, "RGBA")
    rgba = tighten_edges(rgba)

    cropped = crop_to_content(rgba)

    styled = cropped if do_color else to_grayscale(cropped)

    final = add_drop_shadow(styled, shadow_color) if do_shadow else styled
    final.save(out_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pairs", nargs="+", help="raw1 out1 raw2 out2 ...")
    parser.add_argument("--color", action="store_true", help="keep full color instead of desaturating")
    parser.add_argument("--shadow", action="store_true", help="force drop shadow on for --color cutouts")
    parser.add_argument("--no-shadow", action="store_true", help="skip drop shadow even for grayscale cutouts")
    parser.add_argument("--shadow-color", default="ff7a1a")
    parser.add_argument("--model", default="isnet-general-use")
    args = parser.parse_args()

    if len(args.pairs) % 2 != 0:
        sys.exit("Provide raw/out pairs: raw1 out1 raw2 out2 ...")

    do_shadow = args.shadow or (not args.color and not args.no_shadow)

    session = new_session(args.model)
    for i in range(0, len(args.pairs), 2):
        process_one(
            args.pairs[i], args.pairs[i + 1],
            do_color=args.color,
            do_shadow=do_shadow,
            shadow_color=args.shadow_color,
            session=session,
        )
