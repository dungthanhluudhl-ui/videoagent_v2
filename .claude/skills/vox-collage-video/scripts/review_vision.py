"""Explicit cheap-vision review stage. Stop only checks the receipt this creates."""

import argparse
import json
import pathlib
import subprocess
import sys

import stage_state as state

HERE = pathlib.Path(__file__).resolve().parent
VERSION = "explicit-review-vision-v2"


def inputs_for(plan_path, plan):
    root = state.project_root(plan_path)
    review_path = state.review_path_for_plan(plan_path, plan)
    review = state.read_json(review_path, {})
    paths = []
    for scene in plan.get("scenes") or []:
        for asset in state.scene_materials(scene):
            if asset.get("src"):
                paths.append(state.asset_path(root, plan.get("video", "V"), asset["src"]))
    for key in ("temporalSheet", "sceneSummarySheet"):
        if review.get(key):
            paths.append(state.project_path(root, review[key]))
    for entry in review.get("scenes") or []:
        for raw in entry.get("frames") or [entry.get("frame")]:
            if raw:
                paths.append(state.project_path(root, raw))
    return {"reviewGeneration": review.get("reviewGeneration"),
            "assetsAndPixels": [state.file_input(path) for path in sorted(set(paths), key=str)],
            "briefs": [{"id": s.get("id"), "visualTransformation": s.get("visualTransformation"),
                        "assets": [{k: a.get(k) for k in ("src", "role", "describes")}
                                   for a in s.get("assets") or []]}
                       for s in plan.get("scenes") or []]}


def receipt_path(root, video):
    return state.video_paths(root, video)["receipts"] / "review-vision.json"


def is_current(plan_path, plan):
    root = state.project_root(plan_path)
    path = receipt_path(root, plan.get("video", "V"))
    return state.receipt_current(path, "review-vision", inputs_for(plan_path, plan),
                                 state.tool_identity(HERE / "review_vision.py",
                                                     HERE / "asset_vision.py",
                                                     HERE / "vision_check.py",
                                                     HERE / "sheet_vision.py",
                                                     versions={"stage": VERSION}), {},
                                 require_outputs=False)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("plan")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    plan_path = state.project_path(state.project_root(__file__), args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    current, receipt = is_current(plan_path, plan)
    if current:
        print(state.compact_result("CLOSED", receipt=receipt))
        return 0
    if args.check:
        print(state.compact_result("ADVISORY", advisory=1,
              questions=["run review_vision.py explicitly for current review pixels/briefs"]))
        return 1
    review = state.read_json(state.review_path_for_plan(plan_path, plan), {})
    commands = [("asset_vision.py", [str(plan_path), "--new-only"]),
                ("vision_check.py", ["--plan", str(plan_path), "--new-only"])]
    sheet = review.get("sceneSummarySheet")
    if sheet:
        sheet_path = state.project_path(state.project_root(plan_path), sheet)
        commands.append(("sheet_vision.py", [str(sheet_path), "--scenes",
                                             str(len(plan.get("scenes") or [])),
                                             "--status-json"]))
    advisories = []
    root = state.project_root(plan_path)
    for script, argv in commands:
        proc = subprocess.run([sys.executable, str(HERE / script), *argv], capture_output=True,
                              text=True, encoding="utf-8", errors="replace", cwd=root)
        if script == "sheet_vision.py" and proc.returncode == 0:
            try:
                sheet_status = json.loads(proc.stdout)
            except (TypeError, json.JSONDecodeError):
                print(state.compact_result("HARD", hard=1,
                      details="sheet_vision.py returned invalid structured status"), file=sys.stderr)
                return 2
            if sheet_status.get("status") == "ADVISORY":
                advisories.append({"script": script, "code": sheet_status.get("code"),
                                   "reason": sheet_status.get("reason")})
            elif sheet_status.get("status") != "CLOSED":
                print(state.compact_result("HARD", hard=1,
                      details="sheet_vision.py returned unknown structured status"), file=sys.stderr)
                return 2
            continue
        if proc.returncode == 1:
            advisories.append({"script": script, "output": (proc.stdout + proc.stderr).strip()})
        elif proc.returncode not in (0, 1):
            print(state.compact_result("HARD", hard=1, details=f"{script} failed"), file=sys.stderr)
            return proc.returncode
    tool = state.tool_identity(HERE / "review_vision.py", HERE / "asset_vision.py",
                               HERE / "vision_check.py", HERE / "sheet_vision.py",
                               versions={"stage": VERSION})
    receipt = state.make_receipt(receipt_path(root, plan.get("video", "V")), "review-vision",
                                 inputs_for(plan_path, plan), tool, {}, outputs=(),
                                 metadata={"advisories": advisories})
    print(state.compact_result("CLOSED", advisory=len(advisories), receipt=receipt))
    return 0


if __name__ == "__main__":
    sys.exit(main())