#!/usr/bin/env python3
"""
block_gate.py - the tang chan don dieu cua kho block.

Vi sao no ton tai
-----------------
Du an nay DA CO mot kho template va da bo no. `src/scenes/SceneTemplates.jsx`
co 7 template, duoc V3-V9 dung (4-7 canh moi video), va V10-V13 dung ZERO lan.
SKILL.md ghi thang ly do: "Reversing that order is the documented root cause of
every 'templated, repetitive' output this project has produced - twice."

Doc lai 7 template do thi thay chung khong phai 7 template - chung la MOT canh
voi 7 cach xep anh: ca 7 deu `CameraGroup zoom 1 -> 1.0x`, deu `Hero variant
rise/grow/dropSpin`, deu `Support idle="sway"`, deu `visibleFor={duration}`.
Chung duoc dat ten theo BO CUC ("Split", "Collage") chu khong theo viec tuong
thuat, nen agent buoc phai chon theo bo cuc.

Kho block moi sua ca hai dieu do: tra cuu theo `narrativeFunction x
visualLanguage` (hai truong plan da bat buoc phai khai), va moi block mang bo
chuyen dong rieng. Nhung khong co gi trong ma nguon ngan mot agent dung mot
block cho ca video. File nay la thu ngan dieu do - bang so, khong bang loi
dan, dung nguyen tac cua du an: mot luat khong co script kiem thi se troi.

Nguong lay tu dau
-----------------
KHONG dat bua. Do tren V10 - video nguoi xem thich - sau khi anh xa 14/26 canh
cua no vao 5 block:

    PhotoClaim     6/26 = 23%
    MapPlace       3/26 = 12%
    TimelineSpan   2/26 =  8%
    DocFocus       2/26 =  8%
    ChannelOutro   1/26 =  4%

Tran dat o 25%, ngay tren muc do duoc. Luu y: de xuat ban dau la "<=2
canh/video" va no SAI - no se danh truot chinh V10 o PhotoClaim (6 lan). Do la
ly do nguong phai do truoc khi viet.

V10 cung co dung MOT lan hai canh lien tiep cung cau truc (S21 -> S22) ma
nguoi xem khong phan nan, nen phep kiem lien tiep la WARN chu khong FAIL.

Khai trong scene_plan<N>.json
-----------------------------
    { "id": "S3", "block": "PhotoClaim", "arrangement": "top", ... }

hoac, khi khong block nao hop:

    { "id": "S9", "bespoke": true,
      "bespokeReason": "hai trang thai cua cung mot khung hinh; khong block nao lam duoc" }

Bespoke KHONG bi cam va khong nen bi cam - khoang mot nua V10 la bespoke va do
la dung. Cai bi cam la bespoke KHONG KHAI: mot canh khong noi no dang lam gi
thi khong ai biet no la lua chon hay la quen.

Usage:
    py -3 block_gate.py input/scene_plan14.json
    py -3 block_gate.py input/scene_plan14.json --json

Exit non-zero neu co FAIL. Xem references/gates.md.
"""

import argparse
import collections
import json
import pathlib
import sys

MAX_SHARE = 0.25
MIN_VARIANTS_WHEN_REPEATED = 2
REPEAT_TRIGGER = 3
MIN_PUNCH_HOLD = 48          # 1,6s - cung so voi clampPunch trong PhotoClaim.jsx
MAX_BESPOKE_SHARE = 0.60


def find_registry(plan_path):
    p = pathlib.Path(plan_path).resolve()
    for cand in p.parents:
        r = cand / "src" / "blocks" / "registry.json"
        if r.is_file():
            return r
    return None


def norm_lang(v):
    if isinstance(v, list):
        return v[0] if v else None
    return v


def check(plan_path, registry_path=None):
    plan = json.loads(pathlib.Path(plan_path).read_text(encoding="utf-8"))
    reg_path = pathlib.Path(registry_path) if registry_path else find_registry(plan_path)
    out = []
    if not reg_path or not reg_path.exists():
        return [("FAIL", "-", "khong tim thay src/blocks/registry.json - kho block la "
                             "mot phan cua he thong, thieu no la cai dat hong")]
    reg = json.loads(reg_path.read_text(encoding="utf-8"))
    blocks = {b["id"]: b for b in reg["blocks"]}

    scenes = plan.get("scenes", [])
    n = len(scenes)
    if not n:
        return [("FAIL", "-", "plan khong co canh nao")]

    used = collections.Counter()
    arrangements = collections.defaultdict(set)
    prev_block = None

    for sc in scenes:
        sid = sc.get("id", "?")
        bid = sc.get("block")
        bespoke = sc.get("bespoke")

        if not bid and not bespoke:
            out.append(("FAIL", sid,
                        "khong khai `block` cung khong khai `bespoke`. Mot canh khong "
                        "noi no dang dung gi thi khong ai biet do la lua chon hay la quen."))
            prev_block = None
            continue

        if bespoke:
            if not str(sc.get("bespokeReason") or "").strip():
                out.append(("FAIL", sid,
                            "`bespoke: true` nhung khong co `bespokeReason`. Bespoke duoc "
                            "phep - bespoke khong giai thich thi khong."))
            prev_block = None
            continue

        if bid not in blocks:
            out.append(("FAIL", sid,
                        f"block {bid!r} khong co trong registry. Co: {', '.join(sorted(blocks))}"))
            prev_block = None
            continue

        b = blocks[bid]
        used[bid] += 1

        arr = sc.get("arrangement")
        if b.get("arrangements"):
            if arr and arr not in b["arrangements"]:
                out.append(("FAIL", sid,
                            f"arrangement {arr!r} khong co trong {bid}. "
                            f"Co: {', '.join(b['arrangements'])}"))
            arrangements[bid].add(arr)

        # --- canh nay co dung viec cua block khong -------------------------
        nf = sc.get("narrativeFunction")
        vl = norm_lang(sc.get("visualLanguage"))
        fits = [tuple(f) for f in b.get("fits", [])]
        if fits and (nf, vl) not in fits:
            out.append(("WARN", sid,
                        f"{bid} duoc khai cho {nf} x {vl}, khong nam trong `fits` cua no "
                        f"({'; '.join(a + ' x ' + c for a, c in fits)}). Hoac chon block "
                        f"khac, hoac nhan cua canh dang sai - V10/S22 khai la `split` "
                        f"trong khi ban dung cua no khong he chia doi khung."))

        # --- thoi luong -----------------------------------------------------
        dur = sc.get("durationInFrames")
        if dur is None and sc.get("endSec") is not None:
            dur = int(round((sc["endSec"] - sc.get("startSec", 0)) * plan.get("fps", 30)))
        if dur:
            if dur < b.get("minDuration", 0):
                out.append(("FAIL", sid,
                            f"{dur}f ngan hon minDuration {b['minDuration']}f cua {bid}"))
            if b.get("maxDuration") and dur > b["maxDuration"]:
                out.append(("WARN", sid,
                            f"{dur}f dai hon maxDuration {b['maxDuration']}f cua {bid} - "
                            f"kiem xem cuoi canh co khung hinh chet khong"))

            punch = sc.get("punch") or {}
            pf = punch.get("from")
            if pf is not None and dur - pf < MIN_PUNCH_HOLD:
                out.append(("WARN", sid,
                            f"punch vao f{pf} chi giu duoc {dur - pf}f = "
                            f"{(dur - pf) / 30:.2f}s, duoi san {MIN_PUNCH_HOLD}f. Block SE "
                            f"tu keo som lai - sua moc neo hoac diem cat canh thi dung hon "
                            f"la de block kep (dung loi V10/S26: 0,7s cho bon chu)."))

        if prev_block == bid:
            out.append(("WARN", sid,
                        f"canh truoc cung dung {bid}. V10 co dung mot lan (S21 -> S22) va "
                        f"khong ai phan nan, nen day khong phai loi - nhung hai lan lien "
                        f"tiep tro len thi nguoi xem bat dau doc ra cong thuc."))
        prev_block = bid

    # --- tran ty le -------------------------------------------------------
    for bid, k in used.most_common():
        share = k / n
        if share > MAX_SHARE:
            out.append(("FAIL", "-",
                        f"{bid} dung {k}/{n} canh = {share:.0%}, vuot tran {MAX_SHARE:.0%}. "
                        f"Muc cao nhat do duoc tren V10 la 23%. Dung ha tran de di qua - "
                        f"mot ky thuat lap lai ca video doc ra la cong thuc du no tot."))
        if k >= REPEAT_TRIGGER and blocks[bid].get("arrangements"):
            got = {a for a in arrangements[bid] if a}
            if len(got) < MIN_VARIANTS_WHEN_REPEATED:
                out.append(("FAIL", "-",
                            f"{bid} dung {k} lan nhung chi o {len(got)} the "
                            f"({', '.join(sorted(got)) or 'khong khai'}). Can it nhat "
                            f"{MIN_VARIANTS_WHEN_REPEATED}. V10 dung PhotoClaim 6 lan o 3 the "
                            f"khac nhau - do la ly do no khong doc ra la lap."))

    n_bespoke = sum(1 for s in scenes if s.get("bespoke"))
    if n_bespoke / n > MAX_BESPOKE_SHARE:
        out.append(("WARN", "-",
                    f"{n_bespoke}/{n} canh = {n_bespoke / n:.0%} la bespoke, tren "
                    f"{MAX_BESPOKE_SHARE:.0%}. Bespoke khong sai - khoang mot nua V10 la "
                    f"bespoke. Nhung neu gan het video la bespoke thi kho block dang khong "
                    f"duoc dung, va chi phi dung se quay lai nhu cu."))
    return out


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--registry", default=None)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    findings = check(args.plan, args.registry)
    fails = [f for f in findings if f[0] == "FAIL"]

    if args.json:
        print(json.dumps([{"level": l, "scene": s, "message": m} for l, s, m in findings],
                         ensure_ascii=False, indent=2))
    else:
        for level, sid, msg in findings:
            print(f"{level:4} {sid:4} {msg}")
        print(f"\n{'FAILED' if fails else 'PASSED'} ({len(fails)} fail, "
              f"{sum(1 for f in findings if f[0] == 'WARN')} warn)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
