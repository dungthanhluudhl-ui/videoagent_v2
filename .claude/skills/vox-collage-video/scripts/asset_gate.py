#!/usr/bin/env python3
"""
asset_gate.py - does each sourced image actually FIT the box the plan puts it in?

The hole this closes
--------------------
`Hero`/`Support` in src/scenes/shared.jsx take a `width` and nothing else:

    <div style={{ left, top: y, width, ... }}>
      <Img src={...} style={{ width: "100%", display: "block" }} />

so the rendered HEIGHT is entirely decided by the source PNG's own aspect
ratio, and `crop_to_content()` in process_cutout.py cuts every cutout tight
to its subject - which makes that ratio effectively random per image.
Measured: an identical `width=680` slot renders 383px tall for a 16:9 source
and 907px for a 3:4 one. A 2.4x difference in area, from the same layout
number. check_overlap.py's own docstring states the same thing ("height comes
from the source PNG's own aspect ratio at the given width").

That is why a fixed "layout box" could never, on its own, stop the
tran / de / qua-nho defects: nothing in the pipeline had ever declared what
shape an asset was allowed to be. This gate is the missing declaration, and
process_cutout.py's `--fit` is how an asset is made to satisfy it.

The two defects it catches
--------------------------
1. UPSCALE. An asset rendered wider than its own content is blown up and
   reads soft. Real case, reported by the viewer on V10/S25: a 622px-wide
   crop placed in a `width=760` slot - 122% - and it looked wrong to them
   without any measurement.

   Threshold calibrated against the viewer's own verdicts on 33 real assets
   across V10-V13, not picked:

       ratio   asset                     viewer's verdict
       1.68    V10/S13 Doc-Trace         (not examined closely)
       1.57    V11/S10 Hero-Passports    (V11 = the video they disliked)
       1.23    V10/S9  Sup-CrowdBehind
       1.22    V10/S25 Sup-Gate          REPORTED AS BROKEN
       1.09    V12/S2  Hero-Mother       no complaint
       1.05    V10/S23 Doc-Name          no complaint
       median across all 33: 0.69

   Complaints start at 1.22 and stop at 1.09, so FAIL sits at 1.15 - inside
   that gap - and anything above 1.00 warns. Do not raise this to quieten a
   build: an upscale cannot be fixed by re-cutting, only by re-generating the
   subject on its own single-cell board (SKILL.md step 3).

2. WRONG SHAPE FOR THE SLOT. When an asset declares a slot aspect, the file
   must actually be that shape - which means it must have been produced by
   `process_cutout.py --fit W:H`. The gate reads the `voxFitAspect` /
   `voxContentPx` tEXt chunks that flag stamps into the PNG. Metadata was
   chosen over a sidecar JSON deliberately: a sidecar desyncs the moment a
   file is re-cut and the JSON is not, and a stale sidecar is worse than none.

Declaring a slot (per asset, in scene_plan<N>.json):

    { "role": "support", "name": "Sup-Gate", "src": "el10_gate.png",
      "width": 760,
      "slot": { "aspect": "3:4" } }

`aspect` is optional today - without it only the upscale check runs, so this
gate is safe to run against every existing plan. Once an asset carries one,
both checks are enforced.

Usage:
    py -3 asset_gate.py input/scene_plan13.json
    py -3 asset_gate.py input/scene_plan13.json --json
    py -3 asset_gate.py input/scene_plan13.json --strict-slots   # every cutout must declare one

Exits non-zero if any check fails. See references/gates.md.
"""

import argparse
import json
import pathlib
import sys

import stage_state as state

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: py -3 -m pip install pillow")

# See the calibration table in the module docstring before touching these.
UPSCALE_FAIL = 1.15
UPSCALE_WARN = 1.00
ASPECT_TOL = 0.02

# A full-bleed BackgroundPhoto is object-fit:cover across the whole canvas -
# it has no slot width to overflow and no aspect to honour, so neither check
# applies to it. Everything else is placed by an explicit width.
FULL_BLEED_ROLES = {"background"}


def parse_aspect(raw):
    raw = str(raw).strip()
    if ":" in raw:
        a, b = raw.split(":", 1)
        return float(a) / float(b)
    return float(raw)


def content_px(img):
    """Content size in pixels, preferring the stamp over the file's own size.

    After `--fit` pads a cutout, the PNG's dimensions include the transparent
    padding, so the file alone can no longer answer "how many real pixels of
    subject are there". The stamp records the size measured right after the
    tight crop, which is the number that decides whether the asset can fill
    its slot without being blown up.
    """
    raw = (img.text or {}).get("voxContentPx")
    if raw and "x" in raw:
        try:
            w, h = raw.split("x", 1)
            return int(w), int(h), True
        except ValueError:
            pass
    return img.size[0], img.size[1], False


def find_root(plan_path):
    """Nearest ancestor of the plan that actually holds a `public/` dir.

    Assuming `<plan>/../..` breaks in the one place it matters most:
    selftest.py runs every gate inside a temp sandbox, and a gate that
    silently reports "file khong ton tai" for every asset there would pass
    its own negative cases for entirely the wrong reason.
    """
    p = pathlib.Path(plan_path).resolve()
    for cand in p.parents:
        if (cand / "public").is_dir():
            return cand
    return pathlib.Path.cwd()


def check_plan(plan_path, strict_slots=False, root=None):
    plan = json.loads(pathlib.Path(plan_path).read_text(encoding="utf-8"))
    root = pathlib.Path(root) if root else find_root(plan_path)
    findings = []

    for scene in plan.get("scenes", []):
        sid = scene.get("id", "?")
        for a in scene.get("assets", []):
            src = a.get("src")
            if not src:
                continue  # drawn asset (diagram/timeline/map) - no file to check
            name = a.get("name", "?")
            role = (a.get("role") or "").lower()
            path = root / "public" / src

            if not path.exists():
                findings.append(("FAIL", sid, name,
                                 f"file khong ton tai: public/{src}"))
                continue

            with Image.open(path) as img:
                cw, ch, stamped = content_px(img)
                file_w, file_h = img.size
                fit_meta = (img.text or {}).get("voxFitAspect")

            slot = a.get("slot") or {}
            want_aspect = slot.get("aspect")
            render_w = a.get("width")

            # ---- 1. upscale -------------------------------------------------
            if role not in FULL_BLEED_ROLES and render_w:
                ratio = render_w / cw
                if ratio > UPSCALE_FAIL:
                    findings.append((
                        "FAIL", sid, name,
                        f"phong to {ratio:.2f}x (slot width={render_w}, noi dung chi {cw}px). "
                        f"Tran {UPSCALE_FAIL}x. Cat lai KHONG cuu duoc - phai sinh lai chu de "
                        f"tren board mot o rieng (SKILL.md buoc 3)."))
                elif ratio > UPSCALE_WARN:
                    findings.append((
                        "WARN", sid, name,
                        f"phong to {ratio:.2f}x (slot width={render_w}, noi dung {cw}px) - "
                        f"duoi tran nhung da mat net"))

            # ---- 2. shape for the slot -------------------------------------
            if want_aspect:
                target = parse_aspect(want_aspect)
                actual = file_w / file_h
                if abs(actual - target) / target > ASPECT_TOL:
                    findings.append((
                        "FAIL", sid, name,
                        f"sai ti le slot: file la {file_w}x{file_h} ({actual:.3f}), "
                        f"slot doi {want_aspect} ({target:.3f}). "
                        f"Chay lai: process_cutout.py <raw> public/{src} --fit {want_aspect}"))
                elif not fit_meta or fit_meta == "none":
                    findings.append((
                        "FAIL", sid, name,
                        f"ti le dung nhung file khong mang dau --fit. Anh nay chua di qua "
                        f"process_cutout.py --fit {want_aspect}, nen ti le dung la tinh co "
                        f"va se lech ngay lan cat lai sau."))
                elif abs(parse_aspect(fit_meta) - target) / target > ASPECT_TOL:
                    findings.append((
                        "FAIL", sid, name,
                        f"dau --fit ghi {fit_meta} nhung slot doi {want_aspect}"))
            elif strict_slots and role not in FULL_BLEED_ROLES:
                findings.append(("FAIL", sid, name,
                                 "chua khai slot.aspect (--strict-slots)"))

            if not stamped:
                findings.append(("NOTE", sid, name,
                                 "anh cu, khong co dau voxContentPx - do bang kich thuoc file"))

    return findings


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--root", default=None,
                    help="project root holding public/ (auto-detected from the plan)")
    ap.add_argument("--strict-slots", action="store_true",
                    help="every non-background asset with a file must declare slot.aspect")
    ap.add_argument("--hook", action="store_true",
                    help="production-hook policy: keep quality findings visible but only block "
                         "missing/unreadable assets")
    args = ap.parse_args()

    findings = check_plan(args.plan, strict_slots=args.strict_slots, root=args.root)
    fails = [f for f in findings if f[0] == "FAIL"]
    if args.hook:
        integrity_fails = [f for f in fails if f[3].startswith("file khong ton tai:")]
        findings = [("WARN" if f[0] == "FAIL" and f not in integrity_fails else f[0],
                     f[1], f[2], f[3]) for f in findings]
        fails = integrity_fails

    plan_data = state.read_json(args.plan, {})
    manifest_path = state.manifest_path_for_plan(args.plan, plan_data)
    by_name = {}
    for level, sid, name, message in findings:
        by_name.setdefault((sid, name), []).append((level, message))
    root = pathlib.Path(args.root) if args.root else find_root(args.plan)
    for scene in plan_data.get("scenes") or []:
        for asset in scene.get("assets") or []:
            if not asset.get("src"):
                continue
            name = asset.get("name") or asset["src"]
            path = root / "public" / asset["src"]
            issues = by_name.get((scene.get("id"), name), [])
            hard = any(level == "FAIL" and message.startswith("file khong ton tai:")
                       for level, message in issues)
            qa = "HARD_UNUSABLE" if hard else (
                "ACCEPTED_WITH_ADVISORY" if issues else "ACCEPTED")
            brief = state.asset_contract(scene, asset)
            identity = state.digest({"file": state.file_input(path), "brief": brief})
            state.update_manifest(manifest_path, plan_data.get("video"),
                                  state.asset_usage_id(scene, asset),
                                  {"sourceFile": state.file_input(path), "briefId": state.digest(brief),
                                   "mechanicalQA": qa,
                                   "mechanicalAdvisory": "; ".join(m for _l, m in issues)}, identity)

    if args.json:
        print(json.dumps([{"level": l, "scene": s, "asset": n, "message": m}
                          for l, s, n, m in findings], ensure_ascii=False, indent=2))
    else:
        for level, sid, name, msg in findings:
            print(f"{level:4} {sid:4} {name:20} {msg}")
        print(f"\n{'FAILED' if fails else 'PASSED'} "
              f"({len(fails)} fail, {sum(1 for f in findings if f[0] == 'WARN')} warn)")

    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
