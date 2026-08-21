#!/usr/bin/env python3
"""
sheet_vision.py - hoi model re MOT cau ma khong gate nao hoi duoc:
"ca video nay co doc ra thanh mot cong thuc khong?"

Vi sao no phai la mot script rieng
----------------------------------
`vision_check.py` soi TUNG khung mot. `block_gate.py` dem ty le dung block tren
PLAN. Ca hai deu mu truoc cau hoi bat dau tu ban dung THAT: hai muoi tu canh
khai bao khac nhau tren giay van co the trong giong het nhau tren man hinh.

Do la dung tieu chi thu ba cua nguoi xem - `varied` - va no la tieu chi duy
nhat khong the tra loi bang mot khung hinh, vi no la cau hoi VE QUAN HE GIUA
CAC CANH.

Do duoc, tren hai video co phan quyet that cua nguoi xem
--------------------------------------------------------
    V10  nguoi xem THICH       -> repetitive: false
         ba nhom: ban do 3, anh den trang 6, do hoa luoi 6  (nhom lon nhat 23%)
    V11  nguoi xem noi "met"   -> repetitive: TRUE
         mot nhom 14/24 = 58% cung mot kieu "nen kem luoi kem so do chu"

Hai con so do trung khop voi thu duoc rut ra doc lap tu mot huong khac:
`block_gate.MAX_SHARE = 0.25`, lay tu V10 co block day nhat o 23%. Hai duong
do khong biet nhau va gap nhau o cung mot cho.

CANH BAO THANG: N = 2. Hai video khong phai mot phep hieu chuan. Nguong
REPEAT_SHARE duoi day nam giua 23% va 58% chu khong phai duoc do ra tu mot
phan bo. Khi co video thu ba co phan quyet, hay do lai.

Usage:
    py -3 sheet_vision.py input/v11_contact_sheet.png
    py -3 sheet_vision.py sheet.png --json out.json
"""

import argparse
import importlib.util
import json
import pathlib
import sys

_HERE = pathlib.Path(__file__).resolve().parent


def _load_vision_check():
    spec = importlib.util.spec_from_file_location("vc", _HERE / "vision_check.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VC = _load_vision_check()

# Bang tiep xuc co nhieu o nho, gui hep qua thi moi canh chi con vai chuc pixel
# va model khong phan biet duoc bo cuc nua. 1400 la muc da chay duoc tren ca
# hai bang thu (1500x1880 va 1500x2220).
SEND_W = 1400

# Nhom trong giong nhau chiem qua ty le nay thi bao dong.
#
# 0,45 nam giua hai do do duoc, KHONG phai giua hai con so dep:
#     V11 (nguoi xem "met")   54%, 58%   - on dinh
#     V10 (nguoi xem thich)   38%,  0%   - dao dong
# Muc 0,35 ban dau danh truot V10 khoang nua so lan chay. Xem CANH BAO N=2
# trong docstring truoc khi sua con so nay.
REPEAT_SHARE = 0.45

# Mot lan chay khong du: do tren V10, cung mot buc anh cho ra 38% roi 0%.
# Chay le so lan va lay TRUNG VI la cach re nhat de xu ly dao dong da do duoc
# - ba lan het khoang 10k token cua model re, tuc gan nhu khong ton gi.
RUNS = 3

PROMPT = (
    "Anh nay la BANG TIEP XUC cua mot video doc: cac khung hinh cua NHIEU CANH khac nhau "
    "trong cung mot video, xep thanh luoi theo thu tu doc tu trai sang phai, tren xuong duoi.\n\n"
    "Cau hoi DUY NHAT: video nay co bi LAP LAI VE THI GIAC khong - tuc nhieu canh trong "
    "giong nhau den muc nguoi xem doc ra mot cong thuc va thay chan?\n\n"
    "Tra ve DUY NHAT mot khoi JSON, khong giai thich them:\n"
    '{"repetitive": true|false, "groups": [{"looks_like": "<kieu bo cuc, 3-8 chu>", '
    '"count": <so canh>}], "note": "<mot cau tieng Viet>"}\n\n'
    "Chi liet ke nhung nhom co TU 2 CANH tro len trong giong nhau. Dung dem cac canh khac "
    "kieu. Neu moi canh moi kieu thi repetitive=false va groups rong."
)

# DUNG "CAI TIEN" LOI NHAC TREN.
#
# Ban vua roi da thu them hai dong nghe rat hop ly: "dung gop cac canh chi
# giong nhau ve mau sac, vi ca video co y do dung mot bang mau duy nhat" va
# "giong nhau nghia la cung cho dat chu, cung kieu nen". Ket qua: V11 - video
# nguoi xem noi la MET - tu `repetitive: true, mot nhom 14/24` chuyen thanh
# `groups` RONG va "cac canh lien tuc bien doi linh hoat ve bo cuc". Tin hieu
# phan biet bien mat hoan toan, tren ca hai video.
#
# Day la lan THU HAI trong cung mot phien mot ban va "cho chac" pha mat mot ket
# qua dang chay: lan truoc la ghep nen o ca-ro trong `vision_check.encode()`,
# lam mat dung mot duong tinh da duoc nguoi xem xac nhan.
#
# Va no mau thuan voi phep cat bo lam tren `vision_check`, noi ma bo het luat
# di khong doi mot ca nao. Ket luan dung khong phai "luat luon vo dung" hay
# "luat luon co ich", ma la: KHONG DOAN DUOC. Moi chu trong loi nhac nay phai
# di qua mot lan chay tren ca hai bang tiep xuc co phan quyet that.


def check(path, model=VC.MODEL):
    VC.require_key()
    import urllib.error
    import urllib.request
    body = {"model": model, "temperature": 0, "max_tokens": 2200,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": PROMPT},
                {"type": "image_url", "image_url":
                 {"url": "data:image/jpeg;base64," + VC.encode(path, SEND_W)}}]}]}
    last = ""
    for _ in range(3):
        try:
            req = urllib.request.Request(
                VC.BASE + "/chat/completions", data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + VC.KEY,
                         "Content-Type": "application/json"})
            raw = urllib.request.urlopen(req, timeout=240).read()
        except (urllib.error.URLError, OSError) as e:
            last = "%s: %s" % (type(e).__name__, e)
            continue
        text, usage = VC.sse_text(raw)
        d = VC.parse_json(text)
        if d is not None:
            d["_tokens"] = usage.get("total_tokens", 0)
            return d
        last = "khong parse duoc JSON: " + text[:200]
    return {"_error": last}


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("sheet")
    ap.add_argument("--scenes", type=int, default=0,
                    help="tong so canh cua video; co no thi tinh duoc ty le")
    ap.add_argument("--model", default=VC.MODEL)
    ap.add_argument("--runs", type=int, default=RUNS,
                    help="chay may lan roi lay trung vi (do dao dong da do duoc)")
    ap.add_argument("--json", dest="out")
    args = ap.parse_args()

    if not pathlib.Path(args.sheet).is_file():
        print("khong thay %s" % args.sheet, file=sys.stderr)
        return 2

    import concurrent.futures as cf
    with cf.ThreadPoolExecutor(max_workers=args.runs) as ex:
        runs = list(ex.map(lambda _: check(args.sheet, args.model), range(args.runs)))
    ok = [r for r in runs if "_error" not in r]
    if not ok:
        print("LOI: " + runs[0].get("_error", "?")[:200], file=sys.stderr)
        return 2

    toks = sum(r.get("_tokens", 0) for r in ok)
    shares, best = [], None
    for r in ok:
        gs = sorted(r.get("groups") or [], key=lambda g: -(g.get("count") or 0))
        tot = args.scenes or sum(g.get("count") or 0 for g in gs)
        big = (gs[0].get("count") or 0) if gs else 0
        s = big / tot if tot else 0.0
        shares.append((s, big, tot, gs, r))
    shares.sort(key=lambda x: x[0])
    share, biggest, total, groups, r = shares[len(shares) // 2]      # trung vi

    print("nhom bo cuc trong giong nhau (lan chay o giua %d lan):"
          % len(ok))
    for g in groups:
        c = g.get("count") or 0
        pct = (" = %.0f%%" % (c * 100.0 / total)) if total else ""
        print("  %2d canh%-9s %s" % (c, pct, g.get("looks_like", "")))
    if not groups:
        print("  (khong nhom nao)")
    if r.get("note"):
        print("\n" + r["note"])

    hot = share > REPEAT_SHARE

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps([x[4] for x in shares], ensure_ascii=False, indent=2),
            encoding="utf-8")

    print("\n%d lan chay cho ty le nhom lon nhat: %s"
          % (len(ok), ", ".join("%.0f%%" % (s * 100) for s, *_ in shares)))
    print("trung vi %d/%s = %.0f%%   (tran %.0f%%)   -> %s"
          % (biggest, total or "?", share * 100, REPEAT_SHARE * 100,
             "LAP LAI - xem lai truoc khi ship" if hot else "da dang, dat"))
    print("~%s token model re, KHONG vao context agent" % format(toks, ","))
    return 1 if hot else 0


if __name__ == "__main__":
    sys.exit(main())
