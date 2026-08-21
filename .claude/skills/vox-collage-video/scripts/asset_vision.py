#!/usr/bin/env python3
"""
asset_vision.py - soi NGHIA cua tung asset, bang model re.

Vi sao no ton tai
-----------------
Do tren 439 buc anh cua bon phien dung video, phan loai theo viec chung phuc vu:

    107  24%  KIEM ASSET / CUTOUT  <-- lon nhat, va chua co gi thay the
    105  24%  still khung canh         (vision_check.py da lo)
     78  18%  nguoi dung dan thang     (khong day di dau duoc)
     49  11%  contact sheet
     20   5%  anh nguon tho tu board

`cutout_gate.py` DA do phan hinh hoc cua cutout: chroma tran vien, quang alpha,
manh vun, cham mep, do phu. No van mu o cau NGHIA, va do moi la ly do agent phai
mo 107 buc anh ra nhin:

    - anh nay co dung la cai cong chua Han Quoc khong, hay mot cai cong bat ky
    - chu the co bi cut tay, cut dau khong
    - con watermark khong
    - no co minh hoa cho dung cum loi thoai ma plan giao cho no khong

Cau cuoi la cau quan trong nhat, va plan DA co san du lieu de hoi: truong
`describes` cua moi asset ghi dung cum narration ma no phai minh hoa.

Quan he voi cac gate khac - khong chong lan:

    cutout_gate   hinh hoc cua viec tach nen  (chroma, quang, manh vun, mep)
    asset_gate    do phan giai so voi o slot  (phong to bao nhieu lan)
    asset_vision  NGHIA cua buc anh           (dung vat khong, minh hoa dung khong)

Usage:
    py -3 asset_vision.py input/scene_plan13.json
    py -3 asset_vision.py input/scene_plan10.json --json out.json --all
    py -3 asset_vision.py --files public/el13_ratking_hero.png

Exit 1 neu co asset bi gan co.
"""

import argparse
import concurrent.futures as cf
import glob
import importlib.util
import json
import pathlib
import sys

_HERE = pathlib.Path(__file__).resolve().parent


def _load_vision_check():
    """Dung chung duong ong SSE/parse voi vision_check.py - khong chep lai."""
    spec = importlib.util.spec_from_file_location("vc", _HERE / "vision_check.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VC = _load_vision_check()

CHECKS = [
    ("wrong_subject",   "buc anh KHONG cho thay dung thu ma ten asset noi"),
    ("not_illustrating", "buc anh khong minh hoa duoc cum loi thoai ma no duoc giao"),
    ("subject_cropped", "chu the bi cat cut o mep anh - mat dau, mat tay, mat mot phan than"),
    ("watermark",       "con watermark, logo, chu ky, hay chu cua kho anh nam tren anh"),
    ("background_left", "con sot mot mang nen hinh chu nhat, hay mot quang sang quanh chu the"),
    ("clutter",         "trong anh co nhieu vat gay nhieu trong khi chi can MOT vat"),
    ("generic",         "day chi la anh minh hoa chung chung cho pham tru, khong phai vat the "
                        "CU THE cua chinh cau chuyen"),
]

# --- Che do BOARD ---------------------------------------------------------
# Mot O TREN BANG SINH ANH la thu KHAC HAN mot asset da xu ly, va viec dung
# nham bo kiem o tren cho no la mot loi da xay ra that: chay `asset_vision` len
# 4 o cat tu `_board_el11_child_pair.png` thi CA BON deu bi bao
# `background_left` - "van con nguyen phong nen mau xanh la". Dung, va vo nghia:
# o board CHUA duoc tach nen, phong xanh chinh la thu process_cutout se an vao
# de cat. Hoi "da tach nen chua" o buoc chua tach nen la hoi sai buoc.
#
# Nhung cung lan chay do no bat duoc mot thu that: "dinh bieu tuong AI o goc
# phai" - watermark cua cong cu sinh anh. Du an co han `scrub_watermark.py`,
# tuc day la lo da tung thung.
#
# Nen board co bo kiem rieng: hoi dung nhung cau cua BUOC DO - o nay cat ra
# dung duoc khong.
BOARD_CHECKS = [
    ("watermark",      "co watermark, logo cong cu sinh anh, chu ky hay chu de tren o nay khong"),
    ("cut_at_edge",    "chu the co bi cham hay bi cat cut o mep o khong - cat ra se mat mot phan"),
    ("bg_not_flat",    "nen phia sau chu the co PHAI mot mang mau phang de tach khong; neu no "
                       "la mot canh nen roi ram, nhieu vat, hay do bong loang lo thi bao true"),
    ("blurry",         "chu the co bi mo nhoe, thieu net den muc dat vao khung 1080 se vo khong"),
    ("multiple_cells", "trong AN H NAY co nhieu hon MOT o hinh khong - tuc no la ca tam bang chu "
                       "khong phai mot o da duoc cat roi ra"),
    ("wrong_subject",  "o nay KHONG cho thay dung thu ma ten cua no noi"),
]

BOARD_PROMPT_HEAD = (
    "Anh nay la MOT O da duoc cat ra tu mot bang sinh anh. No SE duoc tach nen roi dat vao "
    "mot video doc 9:16.\n"
    "QUAN TRONG: o nay CHUA duoc tach nen. Phong mau phang phia sau (thuong la xanh la, co "
    "khi magenta hay xanh duong) la CO CHU DINH - do la thu se bi xoa di. TUYET DOI khong "
    "coi phong mau phang do la loi.\n\n"
)

# Ngoai lai: mot so vai tro khong bi hoi mot so cau.
#   background: anh nen toan khung - `subject_cropped` va `background_left` vo
#               nghia (no VON LA mot khung anh day, khong phai vat cat roi).
#   map:        ban do do MapGraphic ve luc chay, khong co file trong public/.
SKIP_BY_ROLE = {
    "background": {"subject_cropped", "background_left", "clutter"},
}

PROMPT_HEAD = (
    "Ban dang kiem MOT TAI SAN HINH ANH sap duoc dat vao mot video ke chuyen phong cach "
    "tai lieu, khung doc 9:16, mau xam + cam. Anh gui kem co the la anh nen toan khung, "
    "hoac mot vat the da duoc tach nen.\n"
    "VUNG TRONG SUOT CUA ANH DUOC TO MAU HONG CANH SEN (magenta) de ban nhin thay ro "
    "no o dau. Mau hong do KHONG phai mot phan cua buc anh va khong bao gio la loi.\n\n"
)

PROMPT_TAIL = (
    "\nTra ve DUY NHAT mot khoi JSON, khong giai thich them:\n"
    "{" + ", ".join('"%s": true|false' % k for k, _ in CHECKS) + ', "note": "..."}\n\n'
    "Y nghia tung truong:\n"
    + "\n".join("  %s: %s" % (k, d) for k, d in CHECKS)
    + "\n\nQUY TAC:\n"
    "- Chi bao true khi ban THAT SU NHIN THAY. Nghi ngo thi bao false.\n"
    "- Vung hong canh sen = da tach nen THANH CONG, KHONG phai background_left. "
    "background_left chi tinh khi con mot mang nen THAT nam trong phan anh: mot khoi "
    "chu nhat, mot manh nen troi, mot quang sang bao quanh chu the.\n"
    "- Nguoc lai, chu the bi an mat, bi xoa nham nho, hoa tan thanh vet loang o cho le "
    "ra phai co hinh (chan cot, chan nguoi, mep vat) thi bao subject_cropped.\n"
    "- Anh den trang hay xam la CO Y DO cua phong cach nay, khong phai loi.\n"
    "- 'generic' la phan xet nang: chi bao true khi buc anh ro rang la anh kho chung chung "
    "(mot to giay khong ten tuoi, mot dam dong bat ky) trong khi no duoc giao minh hoa mot "
    "su viec CU THE.\n"
    "- 'note' viet tieng Viet, mot cau, chi mo ta loi nang nhat. Khong loi thi de rong.\n"
)


def build_board_prompt(name):
    return (BOARD_PROMPT_HEAD
            + "Ten o nay: %r\n" % name
            + "\nTra ve DUY NHAT mot khoi JSON, khong giai thich them:\n"
            + "{" + ", ".join('"%s": true|false' % k for k, _ in BOARD_CHECKS)
            + ', "note": "..."}\n\n'
            + "Y nghia tung truong:\n"
            + "\n".join("  %s: %s" % (k, d) for k, d in BOARD_CHECKS)
            + "\n\nQUY TAC:\n"
              "- Chi bao true khi that su nhin thay. Nghi ngo thi bao false.\n"
              "- Phong mau phang = DUNG, khong bao gio la loi.\n"
              "- 'note' viet tieng Viet, mot cau. Khong loi thi de rong.\n")


def build_prompt(name, role, describes, transformation=None, template=None):
    """Dung loi nhac cho MOT asset.

    `transformation` va `template` khong phai trang tri - thieu chung thi ket qua
    SAI, va da sai that. Lan chay dau chi dua ten + vai tro, va hai asset bi ket
    oan vi TEN LA TEN O CHU KHONG PHAI MO TA NOI DUNG:

      V10/S20 `Mock-TV`   -> model: "anh la quay bar go, khong phai mockup TV".
                             That ra el10_drama_still.png la KHUNG PHIM PHAT BEN
                             TRONG cai TV; template ghi ro "TV mockup playing a
                             drama frame set in Itaewon". Mot quay bar Itaewon la
                             dung y do.
      V10/S23 `Doc-Name`  -> model: "anh la canh hoa, khong phai tai lieu".
                             visualTransformation ghi "chu Le Thai Vien hien ra
                             cung nhanh le" - Itaewon nghia la "vuon le", nen
                             nhanh le CHINH LA thu phai co.

    Ca hai deu bien mat khi dua them hai truong nay vao.
    """
    ctx = ["Ten O trong ban dung: %r  (day la TEN O, khong phai mo ta noi dung anh)" % name,
           "Vai tro: %s" % (role or "khong khai")]
    if template:
        ctx.append("Canh nay duoc dung theo mo ta: %r" % template)
    if transformation:
        ctx.append("Thu nguoi xem PHAI THAY trong canh: %r" % transformation)
    if describes:
        ctx.append("Rieng tai san nay duoc giao MINH HOA cum loi thoai: %r"
                   % " / ".join(describes))
    else:
        ctx.append("Plan khong ghi cum loi thoai cho no - de not_illustrating = false.")
    ctx.append("LUU Y: tai san nay co the chi la MOT PHAN cua canh - vi du mot khung "
               "hinh se duoc dat vao trong mot cai TV ve sau, hay mot hoa tiet se nam "
               "canh mot dong chu. Dung doi no mot minh phai la ca canh.")
    return PROMPT_HEAD + "\n".join(ctx) + "\n" + PROMPT_TAIL


def ask(path, prompt, model, retries=2):
    VC.require_key()
    body = {
        "model": model,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url",
             "image_url": {"url": "data:image/jpeg;base64," + VC.encode(path)}},
        ]}],
        "max_tokens": VC.MAX_TOKENS,
        "temperature": 0,
    }
    import urllib.error
    import urllib.request
    last = ""
    for _ in range(retries + 1):
        try:
            req = urllib.request.Request(
                VC.BASE + "/chat/completions", data=json.dumps(body).encode(),
                headers={"Authorization": "Bearer " + VC.KEY,
                         "Content-Type": "application/json"})
            raw = urllib.request.urlopen(req, timeout=180).read()
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


def find_root(plan_path):
    for cand in pathlib.Path(plan_path).resolve().parents:
        if (cand / "public").is_dir():
            return cand
    return pathlib.Path(plan_path).resolve().parents[1]


def jobs_from_plan(plan_path):
    plan = json.loads(pathlib.Path(plan_path).read_text(encoding="utf-8"))
    root = find_root(plan_path)
    out = []
    for sc in plan.get("scenes", []):
        for a in sc.get("assets") or []:
            src = a.get("src")
            if not src:
                continue                      # map/ve tay - khong co file
            p = root / "public" / src
            meta = dict(sid=sc["id"], name=a.get("name"), role=a.get("role"),
                        describes=a.get("describes") or [],
                        transformation=sc.get("visualTransformation"),
                        template=sc.get("template"))
            out.append((str(p), meta, None if p.is_file() else "khong ton tai"))
    seen, uniq = set(), []
    for j in out:
        if j[0] in seen:
            continue
        seen.add(j[0])
        uniq.append(j)
    return uniq


def run_board(args):
    paths = []
    for f in args.files:
        paths.extend(sorted(glob.glob(f)) if any(c in f for c in "*?[") else [f])
    paths = [p for p in dict.fromkeys(paths) if pathlib.Path(p).is_file()]
    if not paths:
        print("khong co o board nao de kiem", file=sys.stderr)
        return 2

    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        res = list(ex.map(
            lambda p: ask(p, build_board_prompt(pathlib.Path(p).stem), args.model),
            paths))

    keys = [k for k, _ in BOARD_CHECKS]
    n_flag, toks = 0, 0
    out = {}
    for p, r in zip(paths, res):
        toks += r.get("_tokens", 0)
        out[p] = r
        if "_error" in r:
            print("LOI  %-28s %s" % (pathlib.Path(p).name, r["_error"][:100]))
            continue
        hits = [k for k in keys if r.get(k) is True]
        if hits:
            n_flag += 1
            print("CO   %-28s %s" % (pathlib.Path(p).name, ",".join(hits)))
            if r.get("note"):
                print("     " + r["note"])
        elif args.all:
            print("sach %-28s %s" % (pathlib.Path(p).name, r.get("note", "")))

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n%d/%d o board bi gan co   (~%s token model re, KHONG vao context agent)"
          % (n_flag, len(paths), format(toks, ",")))
    return 1 if n_flag else 0


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan", nargs="?")
    ap.add_argument("--files", nargs="*", default=[],
                    help="soi thang mot vai file, khong qua plan")
    ap.add_argument("--model", default=VC.MODEL)
    ap.add_argument("--json", dest="out")
    ap.add_argument("--all", action="store_true", help="in ca asset sach")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--board", action="store_true",
                    help="cac file dua vao la O CAT TU BANG SINH ANH, chua tach nen - "
                         "dung bo kiem BOARD_CHECKS thay vi bo kiem asset")
    args = ap.parse_args()

    if args.board:
        if args.plan:
            print("--board chi dung voi --files, khong dung voi plan", file=sys.stderr)
            return 2
        return run_board(args)

    jobs = []
    if args.plan:
        jobs = jobs_from_plan(args.plan)
    for f in args.files:
        for p in (sorted(glob.glob(f)) if any(c in f for c in "*?[") else [f]):
            jobs.append((p, dict(sid="-", name=pathlib.Path(p).stem, role=None,
                                 describes=[], transformation=None, template=None), None))
    if not jobs:
        print("khong co asset nao de kiem", file=sys.stderr)
        return 2

    missing = [j for j in jobs if j[2]]
    jobs = [j for j in jobs if not j[2]]

    def work(j):
        m = j[1]
        return ask(j[0], build_prompt(m["name"], m["role"], m["describes"],
                                      m["transformation"], m["template"]), args.model)

    results = {}
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for j, r in zip(jobs, ex.map(work, jobs)):
            results[j[0]] = r

    keys = [k for k, _ in CHECKS]
    flagged, clean, errs, toks = [], [], [], 0
    for path, m, _ in jobs:
        r = results[path]
        toks += r.get("_tokens", 0)
        if "_error" in r:
            errs.append((m["sid"], m["name"], r["_error"]))
            continue
        skip = set(SKIP_BY_ROLE.get(m["role"] or "", set()))
        if not m["describes"]:
            skip.add("not_illustrating")
        hits = [k for k in keys if r.get(k) is True and k not in skip]
        (flagged if hits else clean).append(
            (m["sid"], m["name"], path, hits, r.get("note", "")))

    for sid, name, path, hits, note in flagged:
        print("CO   %-4s %-22s %s" % (sid, name, ",".join(hits)))
        print("          %s  [%s]" % (note, pathlib.Path(path).name))
    if args.all:
        for sid, name, path, _, note in clean:
            print("sach %-4s %-22s %s" % (sid, name, note))
    for sid, name, e in errs:
        print("LOI  %-4s %-22s %s" % (sid, name, e[:110]))
    for path, m, why in missing:
        print("THIEU %-3s %-22s %s (%s)" % (m["sid"], m["name"],
                                            pathlib.Path(path).name, why))

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n%d/%d asset bi gan co%s%s   (~%s token model re, KHONG vao context agent)"
          % (len(flagged), len(jobs), (", %d loi" % len(errs)) if errs else "",
             (", %d thieu file" % len(missing)) if missing else "",
             format(toks, ",")))
    return 1 if (flagged or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
