"""Freeze plan contracts and emit bounded scene/chunk worker packets.

This is artifact generation, not a worker scheduler. Native subagent execution
is environment-dependent; sequential use of the same packet remains valid.
"""

import argparse
import json
import pathlib
import subprocess
import sys

import stage_state as state

HERE = pathlib.Path(__file__).resolve().parent
PLAN_VERSION = "plan-contract-v1"
PACKET_VERSION = "scene-packet-v1"
ASSET_PACKET_VERSION = "asset-brief-packet-v1"
HANDOFF_VERSION = "stage-handoff-v1"


def plan_receipt_path(plan_path, plan):
    root = state.project_root(plan_path)
    return state.runtime_dir(root, plan.get("video", "V")) / "receipts" / "plan-approved.json"


def approve_plan(plan_path):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    if plan.get("shotlistApproved") is not True:
        raise ValueError("shotlistApproved must be true before closing the editorial plan")
    proc = subprocess.run([sys.executable, str(HERE / "plan_gate.py"), str(plan_path), "--hook"],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode:
        hard = "\n".join(line for line in ((proc.stdout or "") + (proc.stderr or "")).splitlines()
                         if line.startswith("FAIL "))
        raise ValueError("plan integrity failed" + (f": {hard}" if hard else ""))
    inputs = state.plan_contract(plan, plan_path)
    tool = state.tool_identity(HERE / "plan_gate.py", HERE / "pipeline_contracts.py",
                               versions={"contract": PLAN_VERSION})
    path = plan_receipt_path(plan_path, plan)
    receipt = state.make_receipt(path, "editorial-plan", inputs, tool, {}, outputs=(),
                                 accepted={"manual": True, "marker": "shotlistApproved"})
    print(state.compact_result("CLOSED", changed=[path], receipt=receipt))
    return path


def plan_is_closed(plan_path):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    inputs = state.plan_contract(plan, plan_path)
    tool = state.tool_identity(HERE / "plan_gate.py", HERE / "pipeline_contracts.py",
                               versions={"contract": PLAN_VERSION})
    path = plan_receipt_path(plan_path, plan)
    current, receipt = state.receipt_current(path, "editorial-plan", inputs, tool, {},
                                             require_outputs=False)
    return current and plan.get("shotlistApproved") is True, path, receipt


def words_for_scene(words, scene):
    start, end = scene.get("startSec", 0), scene.get("endSec", 0)
    selected = [w for w in words if len(w) >= 3 and start <= float(w[1]) < end]
    return {"text": " ".join(str(w[0]) for w in selected), "words": selected}


def compact_global(plan):
    return {
        "visualContract": plan.get("globalVisualContract") or plan.get("styleContract") or {
            "editorialOrder": "meaning -> treatment -> evidence/asset -> component",
            "sourceHierarchy": "authentic/user/official first; diagram only when clearer",
            "bespoke": True, "camera": "stable unless semantic movement",
            "transition": "hard cut unless meaning requires continuity",
        },
        "authenticity": plan.get("authenticityContract") or plan.get("sourceAuthority"),
    }


def build_worker_packet(plan_path, scene_ids):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    words = state.read_json(root / str(plan.get("wordsFile") or ""), {}).get("words", [])
    scenes = plan.get("scenes") or []
    index = {s.get("id"): i for i, s in enumerate(scenes)}
    wanted = [s for s in scenes if s.get("id") in scene_ids]
    if not wanted:
        raise ValueError("no requested scene ids exist in the plan")
    local = []
    for scene in wanted:
        local.append({
            "scenePlan": scene,
            "narration": words_for_scene(words, scene),
            "requiredAssetsEvidence": scene.get("assets") or [],
            "documentEvidenceRegions": [
                {"asset": a.get("name"), "regions": a.get("evidenceRegions")}
                for a in scene.get("assets") or [] if a.get("evidenceRegions")
            ],
        })
    first, last = min(index[s["id"]] for s in wanted), max(index[s["id"]] for s in wanted)
    neighbors = []
    for i in (first - 1, last + 1):
        if 0 <= i < len(scenes):
            s = scenes[i]
            neighbors.append({"id": s.get("id"), "viewerQuestion": s.get("viewerQuestion"),
                              "visualTransformation": s.get("visualTransformation"),
                              "contrastIntent": s.get("contrastWithPrevious")})
    packet = {
        "schema": 1, "packetVersion": PACKET_VERSION,
        "video": plan.get("video"), "projectRoot": str(root),
        "global": compact_global(plan), "scenes": local, "neighbors": neighbors,
        "primitiveAccess": ["src/scenes/shared.jsx", "src/scenes/visualLanguage.jsx",
                            "src/scenes/SceneTemplates.jsx (optional; bespoke JSX first)"],
        "codingContract": {
            "integrity": "hard", "quality": "advisory", "jsxEscapeHatch": True,
            "return": "built files; PASS/HARD/ADVISORY counts; unresolved questions; continuity note; details path",
        },
        "excluded": ["unrelated scene source", "historical logs", "all assets", "lessons archive"],
    }
    packet["packetId"] = state.digest(packet)
    return packet


def build_asset_brief_packet(plan_path):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    briefs = []
    for scene in plan.get("scenes") or []:
        for asset in scene.get("assets") or []:
            if not asset.get("src") or asset.get("generation") == "none":
                continue
            briefs.append({"scene": scene.get("id"), "asset": asset.get("name"),
                           "role": asset.get("role"), "intent": asset.get("describes") or [],
                           "anchorPhrase": asset.get("anchorPhrase"),
                           "authenticity": asset.get("sourceConstraint") or
                                           plan.get("sourceAuthority")})
    packet = {"schema": 1, "packetVersion": ASSET_PACKET_VERSION,
              "video": plan.get("video"), "global": compact_global(plan),
              "assetBriefs": briefs,
              "workerTask": "write coherent semantic descriptions only; deterministic generate_board.py adds production clauses",
              "return": "semantic descriptions artifact; unresolved authenticity questions only"}
    packet["packetId"] = state.digest(packet)
    return packet


def close_correction(plan_path, note="one broad editorial correction complete"):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    review = pathlib.Path(str(plan_path).replace("scene_plan", "review"))
    inputs = {"plan": state.json_input(plan_path), "review": state.json_input(review),
              "sceneSources": [state.file_input(root / "src" / "scenes" /
                                                f"{video}Scene{s.get('id','S')[1:]}.jsx")
                               for s in plan.get("scenes") or []]}
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": "editorial-correction-v1"})
    path = state.runtime_dir(root, video) / "receipts" / "editorial-correction.json"
    return path, state.make_receipt(path, "editorial-correction", inputs, tool,
                                    {"note": note}, outputs=(), accepted={"manual": True})


def build_handoff(plan_path, closed_stage, next_stage, hard=(), advisories=(), changed_scenes=()):
    plan_path = pathlib.Path(plan_path).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    review_path = pathlib.Path(str(plan_path).replace("scene_plan", "review"))
    review = state.read_json(review_path, {})
    receipt_dir = state.runtime_dir(root, video) / "receipts"
    stage_receipts = {
        "PLAN": [receipt_dir / "plan-approved.json"],
        "BUILD": [receipt_dir / "plan-approved.json"],
        "REVIEW": [receipt_dir / "render-draft.json"],
        "CORRECTION": [receipt_dir / "editorial-correction.json"],
        "FINAL": [receipt_dir / "render-final.json"],
    }
    required = [plan_path]
    if next_stage.upper() in ("REVIEW", "CORRECTION", "FINAL"):
        required.append(review_path)
    if next_stage.upper() in ("BUILD", "REVIEW", "CORRECTION", "FINAL") and plan.get("wordsFile"):
        required.append((root / plan["wordsFile"]).resolve())
    artifact = {
        "schema": 1, "handoffVersion": HANDOFF_VERSION, "video": video,
        "closedStage": closed_stage.upper(), "nextRequestedStage": next_stage.upper(),
        "authoritativePlan": str(plan_path),
        "authoritativeReceipts": [str(path) for path in stage_receipts.get(closed_stage.upper(), [])
                                  if path.is_file()],
        "requiredNextInputs": [str(path) for path in required if path.is_file()],
        "unresolvedHard": list(hard), "editorialAdvisories": list(advisories),
        "changedSceneIds": list(changed_scenes),
        "reviewGeneration": review.get("reviewGeneration") or None,
    }
    artifact["handoffId"] = state.digest(artifact)
    return artifact


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="command", required=True)
    p = sub.add_parser("approve-plan")
    p.add_argument("plan")
    p = sub.add_parser("plan-status")
    p.add_argument("plan")
    p = sub.add_parser("worker-packet")
    p.add_argument("plan")
    p.add_argument("--scenes", required=True, help="comma-separated adjacent scene ids")
    p.add_argument("--out", required=True)
    p = sub.add_parser("asset-brief-packet")
    p.add_argument("plan")
    p.add_argument("--out", required=True)
    p = sub.add_parser("close-correction")
    p.add_argument("plan")
    p.add_argument("--note", default="one broad editorial correction complete")
    p = sub.add_parser("handoff")
    p.add_argument("plan")
    p.add_argument("--closed-stage", required=True, choices=("PLAN", "BUILD", "REVIEW", "CORRECTION", "FINAL"))
    p.add_argument("--next-stage", required=True, choices=("BUILD", "REVIEW", "CORRECTION", "FINAL"))
    p.add_argument("--hard", action="append", default=[])
    p.add_argument("--advisory", action="append", default=[])
    p.add_argument("--changed-scenes", default="")
    p.add_argument("--out", required=True)
    args = ap.parse_args()
    if args.command == "approve-plan":
        try:
            approve_plan(args.plan)
            return 0
        except ValueError as exc:
            print(state.compact_result("HARD", hard=1, questions=[str(exc)]), file=sys.stderr)
            return 1
    if args.command == "plan-status":
        closed, path, receipt = plan_is_closed(args.plan)
        print(state.compact_result("CLOSED" if closed else "HARD", hard=0 if closed else 1,
                                   details=path, receipt=receipt or "missing"))
        return 0 if closed else 1
    if args.command == "close-correction":
        path, receipt = close_correction(args.plan, args.note)
        print(state.compact_result("CLOSED", changed=[path], receipt=receipt))
        return 0
    if args.command == "handoff":
        artifact = build_handoff(args.plan, args.closed_stage, args.next_stage, args.hard,
                                 args.advisory, [x.strip() for x in args.changed_scenes.split(",")
                                                   if x.strip()])
        state.write_json(args.out, artifact)
        print(state.compact_result("CLOSED", changed=[args.out], receipt=artifact["handoffId"]))
        return 0
    if args.command == "asset-brief-packet":
        packet = build_asset_brief_packet(args.plan)
    else:
        packet = build_worker_packet(args.plan, [x.strip() for x in args.scenes.split(",") if x.strip()])
    state.write_json(args.out, packet)
    print(state.compact_result("CLOSED", changed=[args.out], details=args.out,
                               receipt=packet["packetId"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())