#!/usr/bin/env python3
"""
vision_check.py - de mot model re NHIN khung hinh thay cho agent chinh.

Vi sao no ton tai
-----------------
Do tren log token that cua ba phien dung video:

    video   canh  luot goi  anh  chi phi   phan cache_read do ANH gay ra
    V10      26     885     163   $459     ~35%
    V11      24    1975     236   $979      55%  = 39% TONG chi phi phien
    V13       8     370      40   $225      9,9% = 8%

Mot buc anh KHONG chi ton 1.400 token mot lan. No nam lai trong context va bi
doc lai o MOI luot goi sau do. V11 nhin 236 anh (10 anh/canh) va tra $384 cho
rieng viec do. Script nay cat dung khoan do: anh di tu dia sang model re, agent
chinh chi doc lai mot dong JSON ~30 token.

Cai script nay KHONG lam
------------------------
No khong thay agent nhin. No tra loi duoc cau KIEM DUOC ("chu co bi de khong",
"dau cam co cham vat no chi khong") va khong tra loi duoc cau da tao ra chat
luong cua du an ("canh nay co nham khong", "hinh nay co dang giai thich gi
khong"). Dung no de LOC, roi tu nhin nhung khung no gan co.

Nguong va do chinh xac: xem CALIBRATION.md canh file nay - do tren khung that
co phan quyet cua chinh nguoi xem, khong dat bua.

Usage:
    py -3 vision_check.py input/review_frames/V13Scene1_f68.png
    py -3 vision_check.py "input/review_frames/V13*.png"
    py -3 vision_check.py --plan input/scene_plan13.json
    py -3 vision_check.py frames.png --json out.json --model ag/gemini-3.7-flash-low
    py -3 vision_check.py frames.png --all

Exit 1 neu co khung bi gan co.
"""

import argparse
import base64
import concurrent.futures as cf
import glob
import io
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("VOX_VISION_BASE", "http://localhost:20128/v1")
MODEL = os.environ.get("VOX_VISION_MODEL", "ag/gemini-3.7-flash-low")

# Khoa KHONG duoc nam trong ma nguon. Repo nay la public, va mot khoa nhet lam
# gia tri mac dinh se di thang len GitHub trong lan push dau tien - ke ca khoa
# cua router chay o localhost. Thu tu tim: bien moi truong, roi file cuc bo da
# duoc .gitignore.
KEY_FILE = pathlib.Path(__file__).resolve().parent.parent / "data" / ".vision_key"


def _load_key():
    k = os.environ.get("VOX_VISION_KEY")
    if k:
        return k.strip()
    try:
        return KEY_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


KEY = _load_key()


def require_key():
    """Goi truoc khi cham vao mang. Thieu khoa thi noi ro cach dat, dung de
    nguoi dung doc mot loi 401 roi tu doan."""
    if KEY:
        return
    sys.exit(
        "Thieu khoa cho router model re.\n"
        "  Dat bien moi truong:  VOX_VISION_KEY=<khoa>\n"
        "  hoac ghi vao file:    %s\n"
        "     (file nay da nam trong .gitignore - dung commit khoa)\n"
        "Endpoint hien tai: %s" % (KEY_FILE, BASE))

# Anh gui di rong bao nhieu. 768px du de doc chu 44px cua du an (44px tren khung
# 1080 -> 31px tren khung 768) va re bang mot phan tu so voi gui nguyen 1080.
SEND_W = 768

# Mau ghep vao vung trong suot khi gui anh PNG di. Xem ghi chu trong encode().
ALPHA_BG = (255, 0, 255)

# Router LUON tra ve SSE ke ca khi khong xin stream, va reasoning_tokens an vao
# max_tokens - de thap thi model tra ve RONG. Da do: 200 token khong du cho ca
# suy nghi lan JSON.
MAX_TOKENS = 1200

# Truoc moc nay, cac phan tu cua canh VAN DANG BAY VAO - khung con trong la
# dung, khong phai loi. Do tren V10: quet 79 khung seed, hai duong tinh gia duy
# nhat deu la `empty` o dung frame 20 (S2_f20 "khung hinh trong trai", S8_f20
# "qua trong trai") trong khi ca hai canh do nguoi xem GIU va khong phan nan.
# 45 frame = 1,5s, sat duoi san nhip 1,6s cua du an.
SETTLE_FRAME = 45
LATE_ONLY = {"empty", "element_tiny"}

CHECKS = [
    ("text_overlap",  "co chu nao bi hinh anh, hinh khoi hay net ve DE LEN lam kho doc khong"),
    ("text_clipped",  "co chu nao bi cat cut o mep khung, hoac tran ra ngoai vung an toan khong"),
    ("text_tiny",     "co chu nao nho den muc khong doc duoc tren dien thoai khong"),
    ("mark_missed",   "cac net ve mau cam (khoanh tron, mui ten, ngoac goc, gach chan) co CHAM DUNG "
                      "vat the ma no dang chi khong, hay dang treo lo lung, lech khoi vat, cat ngang chu"),
    ("element_tiny",  "vat the chinh co qua nho so voi khung hinh doc khong (duoi khoang 1/5 chieu rong)"),
    ("cutout_edge",   "anh cat roi (cutout) co con vien nen thua, quang sang, hay mep rang cua khong"),
    ("empty",         "khung hinh co gan nhu TRONG khong - chi co nen va mot dong chu, khong minh hoa gi"),
    ("collision",     "co hai phan tu do hoa nao dam vao nhau mot cach ngoai y muon khong"),
]

PROMPT = (
    "Ban dang kiem tra MOT KHUNG HINH tinh lay tu video doc 9:16 (1080x1920), phong cach "
    "xam + cam, chu tieng Viet. Hay soi ky roi tra loi.\n\n"
    "Tra ve DUY NHAT mot khoi JSON, khong giai thich them, dang:\n"
    "{" + ", ".join('"%s": true|false' % k for k, _ in CHECKS) + ', "note": "..."}\n\n'
    "Y nghia tung truong:\n"
    + "\n".join("  %s: %s" % (k, d) for k, d in CHECKS)
    + "\n\nQUY TAC QUAN TRONG:\n"
    "- Chi bao true khi ban THAT SU NHIN THAY loi do trong anh. Nghi ngo thi bao false.\n"
    "- Chu dat de len NEN ANH mo/toi la CO Y DO cua phong cach nay, KHONG phai text_overlap. "
    "text_overlap chi tinh khi chu bi mot vat the hay net ve DAC de len lam mat net chu.\n"
    "- Net ve tay hoi run, hoi lech la CO Y DO. mark_missed chi tinh khi net ve ro rang khong "
    "cham vao vat the nao, hoac cat ngang mot dong chu.\n"
    "- Nen giay co van, co vet muc loang la CO Y DO, khong phai loi.\n"
    "- 'note' viet tieng Viet, mot cau, chi mo ta loi nang nhat. Khong co loi thi de note rong.\n"
)


def encode(path, width=SEND_W):
    """PNG -> JPEG base64, CO ghep nen cho anh trong suot.

    Doan ghep nen khong phai trang tri. Ban dau ham nay chi goi convert("RGB"),
    va do la mot LOI THAT da lam hong ket qua: `convert("RGB")` vut kenh alpha
    di nhung GIU NGUYEN kenh mau ben duoi. Anh cutout cua du an nay duoc tach
    tu phong xanh, va process_cutout chi xoa nen bang ALPHA chu khong ghi de
    mau - nen duoi vung trong suot van con nguyen RGB (16,237,7).

    Hau qua do duoc: gui el10_street_sign.png di thi 79% khung hinh model nhan
    duoc LA MAU XANH LA. No bao "anh chua tach nen, con phong xanh" - va no
    bao DUNG voi thu no nhin thay. Ba asset bi ket oan nhu vay trong lan chay
    dau tien; ca ba deu co 0,0% xanh trong vung duc va 21-80% diem trong suot,
    tuc da tach nen sach.

    Nen ghep la MAGENTA, va do la ket qua do chu khong phai gu. Da thu bon nen
    tren mot asset HONG da duoc nguoi xem xac nhan (el10_historical_figure.png -
    cot chua bi xoa nen an mat thanh vet loang) cong ba asset sach:

        o ca-ro   BO SOT loi   (vet loang xam lan vao o xam - hoa tan)
        trang     bat duoc     ("dinh bong nguoi, chan cot bi cat")
        MAGENTA   bat duoc     ("xoa nham nho phan chan va dinh them bong nguoi")
        den       bat duoc     nhung nguy hiem: du an nay day anh toi mau, mot
                               nen den de bi doc nham thanh noi dung that

    Ca bon nen deu KHONG bao nham ba asset sach. Chon magenta vi no mo ta chinh
    xac nhat va vi khong vat the nao trong bang mau xam+cam cua du an co mau do -
    model khong the nham no voi noi dung.
    """
    from PIL import Image
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        if im.getchannel("A").getextrema()[0] < 250:
            board = Image.new("RGB", im.size, ALPHA_BG)
            board.paste(im, (0, 0), im)
            im = board
    im = im.convert("RGB")
    im.thumbnail((width, width * 4), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def sse_text(raw):
    """Router luon tra SSE ke ca khi khong xin stream. Gom content cac chunk."""
    out, usage = [], {}
    for line in raw.decode("utf-8", "replace").splitlines():
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        try:
            d = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if d.get("usage"):
            usage = d["usage"]
        for ch in d.get("choices") or []:
            piece = ((ch.get("delta") or {}).get("content")
                     or (ch.get("message") or {}).get("content") or "")
            if piece:
                out.append(piece)
    return "".join(out), usage


def parse_json(text):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def ask(path, model=MODEL, retries=2):
    require_key()
    body = {
        "model": model,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT},
            {"type": "image_url",
             "image_url": {"url": "data:image/jpeg;base64," + encode(path)}},
        ]}],
        "max_tokens": MAX_TOKENS,
        "temperature": 0,
    }
    last = ""
    for _ in range(retries + 1):
        try:
            req = urllib.request.Request(
                BASE + "/chat/completions", data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + KEY,
                         "Content-Type": "application/json"})
            raw = urllib.request.urlopen(req, timeout=180).read()
        except (urllib.error.URLError, OSError) as e:
            last = "%s: %s" % (type(e).__name__, e)
            continue
        text, usage = sse_text(raw)
        d = parse_json(text)
        if d is not None:
            d["_tokens"] = usage.get("total_tokens", 0)
            return d
        last = "khong parse duoc JSON: " + text[:200]
    return {"_error": last}


def collect(frames, plan):
    paths = []
    for f in frames:
        paths.extend(sorted(glob.glob(f)) if any(c in f for c in "*?[") else [f])
    if plan:
        p = json.loads(pathlib.Path(plan).read_text(encoding="utf-8"))
        vid = str(p.get("video") or "").lstrip("Vv")
        root = pathlib.Path(plan).resolve().parent / "review_frames"
        for sc in p.get("scenes", []):
            paths.extend(sorted(str(x) for x in
                                root.glob("V%sScene%s_f*.png" % (vid, sc["id"][1:]))))
    return [p for p in dict.fromkeys(paths) if pathlib.Path(p).is_file()]


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("frames", nargs="*")
    ap.add_argument("--plan", help="scene_plan<N>.json - tu tim khung trong input/review_frames")
    ap.add_argument("--model", default=MODEL)
    ap.add_argument("--json", dest="out", help="ghi ket qua day du ra file")
    ap.add_argument("--all", action="store_true", help="in ca khung sach")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--settle", type=int, default=SETTLE_FRAME,
                    help="truoc frame nay khong xet empty/element_tiny (phan tu con dang bay vao)")
    args = ap.parse_args()

    paths = collect(args.frames, args.plan)
    if not paths:
        print("khong co khung nao de kiem", file=sys.stderr)
        return 2

    results = {}
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for p, r in zip(paths, ex.map(lambda q: ask(q, args.model), paths)):
            results[p] = r

    keys = [k for k, _ in CHECKS]
    flagged, clean, errs, toks, muted = [], [], [], 0, 0
    for p in paths:
        r = results[p]
        toks += r.get("_tokens", 0)
        if "_error" in r:
            errs.append((p, r["_error"]))
            continue
        hits = [k for k in keys if r.get(k) is True]
        m = re.search(r"_f(\d+)\.\w+$", pathlib.Path(p).name)
        if m and int(m.group(1)) < args.settle:
            drop = [k for k in hits if k in LATE_ONLY]
            if drop:
                muted += len(drop)
                hits = [k for k in hits if k not in LATE_ONLY]
        (flagged if hits else clean).append((p, hits, r.get("note", "")))

    for p, hits, note in flagged:
        print("CO   %-34s %s" % (pathlib.Path(p).name, ",".join(hits)))
        if note:
            print("     " + note)
    if args.all:
        for p, _, note in clean:
            print("sach %-34s %s" % (pathlib.Path(p).name, note))
    for p, e in errs:
        print("LOI  %-34s %s" % (pathlib.Path(p).name, e[:120]))

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n%d/%d khung bi gan co%s%s   (~%s token cua model re, KHONG vao context agent)"
          % (len(flagged), len(paths), (", %d loi" % len(errs)) if errs else "",
             (", %d co bo qua vi khung som hon f%d" % (muted, args.settle)) if muted else "",
             format(toks, ",")))
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
