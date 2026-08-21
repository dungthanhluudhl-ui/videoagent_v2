#!/usr/bin/env python3
"""
vision_regress.py - bo hoi quy cho hai script goi model re.

Vi sao no ton tai
-----------------
`vision_check.py` va `asset_vision.py` hoi mot model ben ngoai, va cau tra loi
cua no thay doi khi: doi model, sua prompt, sua cach ma hoa anh, hay khi nha
cung cap cap nhat model ma khong bao ai. Khong co bo hoi quy thi moi thay doi
deu la mot canh bac.

Du an nay da tra gia dung mot lan cho viec do trong CHINH phien xay hai script:
sua ham `encode()` de vá loi alpha lam MAT ca duong tinh dung o V10/S25 (ket qua
do nen ghep - xem docstring cua encode). Neu khong co bo nay thi khong ai biet.

Va no giai duoc mot cau da tung khong tra loi noi: "co nen viet them luat vao
prompt khong?" Truoc day cau tra loi la phong doan. Bay gio no la mot lan chay.

Moi nhan trong vision_labels.json phai ghi NGUON su that - phan quyet cua nguoi
xem, hoac text_gate (doc ma nguon, doc lap voi anh), hoac mot phep do so hoc.
Khong co nhan nao dat bang cam tinh cua agent.

Usage:
    py -3 vision_regress.py
    py -3 vision_regress.py --model ag/gemini-3.6-flash-medium   # thu doi model
    py -3 vision_regress.py --frames-only
    py -3 vision_regress.py --json ket_qua.json

Exit 1 neu co bat ky ca nao sai.
"""

import argparse
import concurrent.futures as cf
import importlib.util
import json
import pathlib
import re
import sys

_HERE = pathlib.Path(__file__).resolve().parent


def _load(name):
    spec = importlib.util.spec_from_file_location(name, _HERE / (name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


VC = _load("vision_check")
AV = _load("asset_vision")


def find_root():
    for cand in [_HERE] + list(_HERE.parents):
        if (cand / "public").is_dir() and (cand / "input").is_dir():
            return cand
    return pathlib.Path.cwd()


ROOT = find_root()


def hits_frame(path, r):
    keys = [k for k, _ in VC.CHECKS]
    got = [k for k in keys if r.get(k) is True]
    m = re.search(r"_f(\d+)\.\w+$", pathlib.Path(path).name)
    if m and int(m.group(1)) < VC.SETTLE_FRAME:
        got = [k for k in got if k not in VC.LATE_ONLY]
    return got


def hits_asset(meta, r):
    keys = [k for k, _ in AV.CHECKS]
    skip = set(AV.SKIP_BY_ROLE.get(meta["role"] or "", set()))
    if not meta["describes"]:
        skip.add("not_illustrating")
    return [k for k in keys if r.get(k) is True and k not in skip]


def run_frames(cases, model):
    def work(c):
        return VC.ask(str(ROOT / c["path"]), model)
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        return list(ex.map(work, cases))


def asset_meta(case):
    plan = json.loads((ROOT / case["plan"]).read_text(encoding="utf-8"))
    for sc in plan.get("scenes", []):
        if sc.get("id") != case["scene"]:
            continue
        for a in sc.get("assets") or []:
            if a.get("name") == case["name"]:
                return dict(sid=sc["id"], name=a.get("name"), role=a.get("role"),
                            describes=a.get("describes") or [],
                            transformation=sc.get("visualTransformation"),
                            template=sc.get("template"),
                            path=str(ROOT / "public" / (a.get("src") or "")))
    return None


def run_assets(cases, model):
    metas = [asset_meta(c) for c in cases]

    def work(m):
        if not m:
            return {"_error": "khong tim thay asset trong plan"}
        return AV.ask(m["path"], AV.build_prompt(
            m["name"], m["role"], m["describes"],
            m["transformation"], m["template"]), model)
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        return metas, list(ex.map(work, metas))


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--labels", default=str(_HERE / "vision_labels.json"))
    ap.add_argument("--model", default=VC.MODEL)
    ap.add_argument("--frames-only", action="store_true")
    ap.add_argument("--assets-only", action="store_true")
    ap.add_argument("--json", dest="out")
    args = ap.parse_args()

    lab = json.loads(pathlib.Path(args.labels).read_text(encoding="utf-8"))
    rows, bad_cases = [], 0

    if not args.assets_only:
        cases = [c for c in lab["frames"] if (ROOT / c["path"]).is_file()]
        skipped = len(lab["frames"]) - len(cases)
        for c, r in zip(cases, run_frames(cases, args.model)):
            got = [] if "_error" in r else hits_frame(c["path"], r)
            ok = bool(got) == c["bad"]
            miss = [k for k in c.get("expect", []) if k not in got] if c["bad"] else []
            rows.append(dict(kind="frame", id=pathlib.Path(c["path"]).name,
                             bad=c["bad"], got=got, ok=ok, expect_missed=miss,
                             source=c["source"], note=r.get("note", ""),
                             error=r.get("_error")))
            if not ok:
                bad_cases += 1
        if skipped:
            print("bo qua %d khung khong ton tai tren dia" % skipped)

    if not args.frames_only:
        cases = lab["assets"]
        metas, res = run_assets(cases, args.model)
        for c, m, r in zip(cases, metas, res):
            got = [] if (m is None or "_error" in r) else hits_asset(m, r)
            ok = bool(got) == c["bad"]
            miss = [k for k in c.get("expect", []) if k not in got] if c["bad"] else []
            rows.append(dict(kind="asset", id="%s/%s" % (c["scene"], c["name"]),
                             bad=c["bad"], got=got, ok=ok, expect_missed=miss,
                             source=c["source"], note=r.get("note", ""),
                             error=r.get("_error")))
            if not ok:
                bad_cases += 1

    tp = sum(1 for r in rows if r["bad"] and r["got"])
    fn = sum(1 for r in rows if r["bad"] and not r["got"])
    fp = sum(1 for r in rows if not r["bad"] and r["got"])
    tn = sum(1 for r in rows if not r["bad"] and not r["got"])

    for r in rows:
        if r["ok"] and not r["expect_missed"]:
            tag = "ok"
        elif r["bad"] and not r["got"]:
            tag = "BO SOT"
        elif not r["bad"] and r["got"]:
            tag = "DUONG TINH GIA"
        else:
            tag = "bat duoc nhung khac muc"
        print("%-22s %-6s %-30s %-28s %s"
              % (tag, r["kind"], r["id"], ",".join(r["got"]) or "-",
                 (r["note"] or r["error"] or "")[:52]))
        if r["expect_missed"] and r["got"]:
            print("%-22s   thieu muc mong doi: %s" % ("", ",".join(r["expect_missed"])))

    print("\nmodel: %s" % args.model)
    print("bat dung %d | bo sot %d | DUONG TINH GIA %d | dung-sach %d   -> %d/%d ca dat"
          % (tp, fn, fp, tn, len(rows) - bad_cases, len(rows)))

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    return 1 if bad_cases else 0


if __name__ == "__main__":
    sys.exit(main())
