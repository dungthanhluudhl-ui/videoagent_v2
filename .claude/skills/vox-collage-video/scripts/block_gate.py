#!/usr/bin/env python3
"""
block_gate.py - nhip doc cua moi canh, cong tran dung lai CHO CANH NAO CO DUNG BLOCK.

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

KHONG KHAI GI = BESPOKE. Do la mac dinh.
----------------------------------------
Dung block la NGOAI LE co khai bao, khong phai buoc mac dinh:

    { "id": "S3", "block": "PhotoClaim", "arrangement": "top", ... }

Mot canh khong khai gi thi gate nay IM LANG. Truoc day no FAIL, va do la mot
sai lam ve huong luc da duoc do lai:

    kho block phu V10   54%   <- block trich TU V10, nen day la overfit
    phu V11             25%   <- V11 la PHAN 2 cua chinh V10, cung chu de
    phu V13             25%

Tren mot video chua tung thay, 3/4 so canh khong co block nao hop. Bat khai
nghia la 3/4 so canh phai mang mot dong `bespokeReason` viet tay - thu tuc
thuan tuy, de len cong doan chi chiem 3,3% chi phi token cua ca phien.

Neu VAN khai `bespoke: true` thi phai co `bespokeReason` - khai roi ma khong
giai thich thi te hon la khong khai.

Chong don dieu bay gio la viec cua ai
-------------------------------------
`sheet_vision.py`, va no lam tot hon file nay: no DO do lap tren BAN DUNG THAT
thay vi rang buoc plan truoc bang hang so rut tu mot video duy nhat.

    V10 (nguoi xem thich)   nhom bo cuc lon nhat 23-38%
    V11 (nguoi xem "met")   nhom bo cuc lon nhat 54-67%

Hang so rut tu mot video da HAI LAN khong chuyen duoc sang video khac (`mood`
voi V10/S22, `place` voi V13/S1). Do thi chuyen duoc; rang buoc thi khong.

Phan con lai cua file nay van co gia tri
----------------------------------------
1. NHIP DOC - chay cho MOI canh, khong can khai block gi. Do tren V10: 6 trong
   14 canh dat headline voi duoi 1,6 giay de doc. Te nhat la S26: 0,7 giay cho
   bon chu "MOT NGOI CHUA CO".
2. Khi co canh THUC SU dung block, cac tran duoi day van ap: 25%/block, >=2 the
   khi lap tu 3 lan, va block phai co trong registry.

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

        # --- NHIP DOC: chay cho MOI canh, khong phu thuoc block --------------
        # Truoc day phep kiem nay nam ben trong nhanh "canh co khai block", nen
        # go yeu cau khai block la vo tinh tat luon no. Ma no la phan co bang
        # chung manh nhat trong ca file: do tren V10, 6 trong 14 canh dat
        # headline voi duoi 1,6 giay de doc - mot thoi quen he thong, khong phai
        # hai ca le. Vi du te nhat la S26: 0,7 giay cho bon chu "MOT NGOI CHUA
        # CO". No khong lien quan gi den kho block.
        dur = sc.get("durationInFrames")
        if dur is None and sc.get("endSec") is not None:
            dur = int(round((sc["endSec"] - sc.get("startSec", 0)) * plan.get("fps", 30)))
        punch = sc.get("punch") or {}
        pf = punch.get("from") if isinstance(punch, dict) else None
        if dur and pf is not None and dur - pf < MIN_PUNCH_HOLD:
            out.append(("WARN", sid,
                        f"punch vao f{pf} chi giu duoc {dur - pf}f = "
                        f"{(dur - pf) / 30:.2f}s, duoi san {MIN_PUNCH_HOLD}f = 1,6s. Sua moc "
                        f"neo hoac diem cat canh - dung loi V10/S26 (0,7s cho bon chu)."))

        if not bid and not bespoke:
            # KHONG khai gi = bespoke. Day la mac dinh, va no im lang.
            #
            # Truoc day cho nay FAIL: "mot canh khong noi no dang dung gi thi
            # khong ai biet do la lua chon hay la quen". Nghe hop ly, va sai ve
            # huong luc. Do lai tren du lieu that:
            #
            #   kho block phu V10  54%  <- nhung block TRICH TU V10, nen day la overfit
            #   phu V11            25%  <- V11 la PHAN 2 cua chinh V10
            #   phu V13            25%
            #
            # Tren mot video chua tung thay, 3/4 so canh se khong co block nao
            # hop. Bat khai nghia la 3/4 so canh phai mang mot dong
            # `bespokeReason` viet tay - thu tuc thuan tuy, de len cong doan chi
            # chiem 3,3% chi phi token.
            #
            # Va no dat sai gia tri mac dinh. SKILL.md mo dau bang "Meaning
            # first, component second - reversing that order is the documented
            # root cause of every 'templated, repetitive' output this project
            # has produced, twice". Mot gate bat MOI canh phai tra loi "may
            # dung block nao" chinh la dao nguoc thu tu do.
            #
            # Viec chong don dieu nay do `sheet_vision.py` lam, va lam tot hon:
            # no DO do lap tren ban dung that (V10 23-38%, V11 54-67%, khop dung
            # phan quyet "thich"/"met" cua nguoi xem) thay vi RANG BUOC plan
            # truoc bang hang so rut tu mot video duy nhat - hang so da hai lan
            # khong chuyen duoc sang video khac (`mood` voi S22, `place` voi
            # V13/S1).
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

        # --- thoi luong so voi hop dong cua block ---------------------------
        if dur:
            if dur < b.get("minDuration", 0):
                out.append(("FAIL", sid,
                            f"{dur}f ngan hon minDuration {b['minDuration']}f cua {bid}"))
            if b.get("maxDuration") and dur > b["maxDuration"]:
                out.append(("WARN", sid,
                            f"{dur}f dai hon maxDuration {b['maxDuration']}f cua {bid} - "
                            f"kiem xem cuoi canh co khung hinh chet khong"))


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

    # Nguong "qua nhieu bespoke" DA BO. No dua tren gia dinh rang kho block
    # phai duoc dung nhieu moi dang gia - gia dinh do da bi do lai va bac bo:
    # tren video chua tung thay, kho chi phu 25%. Mot video 100% bespoke la
    # trang thai BINH THUONG, khong phai dau hieu hong.
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
