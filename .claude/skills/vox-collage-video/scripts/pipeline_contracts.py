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

CANONICAL_STAGES = ("PLAN", "PREVIS", "REVIEW", "CORRECTION", "FINAL")
STAGE_ALIASES = {"BUILD": "PREVIS"}
SCENE_STATUS_STAGES = {
    None: "PLAN",
    "planned": "PLAN",
    "previs": "PREVIS",
    "built": "PREVIS",  # historical spelling retained as an input alias
    "reviewed": "REVIEW",
}
CANONICAL_PREVIS_MARKER = "// PREVIS-HERE:"
PREVIS_MARKER_ALIASES = ("// BUILT-HERE:",)


def canonical_stage(stage):
    """Normalize lifecycle names; BUILD is the historical PREVIS alias."""
    value = str(stage or "").strip().upper()
    value = STAGE_ALIASES.get(value, value)
    if value not in CANONICAL_STAGES:
        raise ValueError(f"unknown lifecycle stage {stage!r}")
    return value


def scene_status_stage(status):
    """Canonical stage for a scene status; ``built`` is input compatibility only."""
    if status not in SCENE_STATUS_STAGES:
        raise ValueError(f"unknown scene status {status!r}")
    return SCENE_STATUS_STAGES[status]


def canonical_previs_marker(text):
    """Recognize the canonical source marker and its historical spelling."""
    if CANONICAL_PREVIS_MARKER in text:
        return CANONICAL_PREVIS_MARKER
    if any(marker in text for marker in PREVIS_MARKER_ALIASES):
        return CANONICAL_PREVIS_MARKER
    return None


def resolve_plan_path(plan_path):
    """Resolve relative plan arguments against this project, never caller CWD."""
    return state.project_path(state.project_root(__file__), plan_path)


def approval_contract(plan):
    """One machine-readable approval rule shared by all plan/build consumers."""
    approved = plan.get("shotlistApproved") is True
    return {"approved": approved, "marker": "shotlistApproved",
            "reason": None if approved else "shotlistApproved must be true before PREVIS"}


def require_plan_approval(plan):
    approval = approval_contract(plan)
    if not approval["approved"]:
        raise ValueError(approval["reason"])
    return approval


def lifecycle_contract(plan):
    """Normalize legacy statuses into the PLAN -> PREVIS -> REVIEW lifecycle."""
    scene_stages = []
    invalid = []
    for scene in plan.get("scenes") or []:
        raw = scene.get("status")
        try:
            stage = scene_status_stage(raw)
        except ValueError:
            invalid.append({"scene": scene.get("id"), "status": raw})
            continue
        scene_stages.append(stage)
    ranks = {stage: index for index, stage in enumerate(CANONICAL_STAGES)}
    any_previs = any(ranks[stage] >= ranks["PREVIS"] for stage in scene_stages)
    previs_complete = bool(scene_stages) and all(
        ranks[stage] >= ranks["PREVIS"] for stage in scene_stages)
    review_complete = bool(scene_stages) and all(
        ranks[stage] >= ranks["REVIEW"] for stage in scene_stages)
    return {"workflowStatus": plan.get("status"), "sceneStages": scene_stages,
            "invalidSceneStatuses": invalid, "anyPrevis": any_previs,
            "previsComplete": previs_complete, "reviewComplete": review_complete}


def required_artifacts(plan_path, plan, stage):
    """Required inputs for a stage, using canonical paths only."""
    plan_path = resolve_plan_path(plan_path)
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    stage = canonical_stage(stage)
    required = [plan_path]
    if stage in ("PREVIS", "REVIEW", "CORRECTION", "FINAL") and plan.get("wordsFile"):
        required.append((root / str(plan["wordsFile"])).resolve())
    if stage in ("REVIEW", "CORRECTION", "FINAL"):
        required.extend((paths["master"], paths["review"]))
    if stage in ("CORRECTION", "FINAL"):
        required.append(paths["receipts"] / "render-draft.json")
    if stage == "FINAL":
        required.append(paths["receipts"] / "editorial-correction.json")
    return list(dict.fromkeys(pathlib.Path(path) for path in required))


def validate_artifacts(paths):
    """Return missing required artifacts without hiding them from handoffs."""
    return [pathlib.Path(path) for path in paths if not pathlib.Path(path).is_file()]


def plan_receipt_path(plan_path, plan):
    root = state.project_root(plan_path)
    return state.video_paths(root, plan.get("video", "V"))["receipts"] / "plan-approved.json"


def approve_plan(plan_path):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    require_plan_approval(plan)
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
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    inputs = state.plan_contract(plan, plan_path)
    tool = state.tool_identity(HERE / "plan_gate.py", HERE / "pipeline_contracts.py",
                               versions={"contract": PLAN_VERSION})
    path = plan_receipt_path(plan_path, plan)
    current, receipt = state.receipt_current(path, "editorial-plan", inputs, tool, {},
                                             require_outputs=False)
    return current and approval_contract(plan)["approved"], path, receipt


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
    plan_path = resolve_plan_path(plan_path)
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
            "return": "PREVIS files; PASS/HARD/ADVISORY counts; unresolved questions; continuity note; details path",
        },
        "excluded": ["unrelated scene source", "historical logs", "all assets", "lessons archive"],
    }
    packet["packetId"] = state.digest(packet)
    return packet


def build_asset_brief_packet(plan_path):
    plan_path = resolve_plan_path(plan_path)
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
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    paths = state.video_paths(root, video)
    review = paths["review"]
    inputs = {"plan": state.json_input(plan_path), "review": state.json_input(review),
              "sceneSources": [state.file_input(root / "src" / "scenes" /
                                                f"{video}Scene{s.get('id','S')[1:]}.jsx")
                               for s in plan.get("scenes") or []]}
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": "editorial-correction-v1"})
    path = paths["receipts"] / "editorial-correction.json"
    return path, state.make_receipt(path, "editorial-correction", inputs, tool,
                                    {"note": note}, outputs=(), accepted={"manual": True})


def build_handoff(plan_path, closed_stage, next_stage, hard=(), advisories=(), changed_scenes=()):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    paths = state.video_paths(root, video)
    review_path = paths["review"]
    review = state.read_json(review_path, {})
    receipt_dir = paths["receipts"]
    stage_receipts = {
        "PLAN": [receipt_dir / "plan-approved.json"],
        "PREVIS": [receipt_dir / "plan-approved.json"],
        "REVIEW": [receipt_dir / "render-draft.json"],
        "CORRECTION": [receipt_dir / "editorial-correction.json"],
        "FINAL": [receipt_dir / "render-final.json"],
    }
    closed_stage = canonical_stage(closed_stage)
    next_stage = canonical_stage(next_stage)
    required = required_artifacts(plan_path, plan, next_stage)
    missing = validate_artifacts(required)
    missing_messages = [f"missing required {next_stage} input: {path}" for path in missing]
    artifact = {
        "schema": 1, "handoffVersion": HANDOFF_VERSION, "video": video,
        "closedStage": closed_stage, "nextRequestedStage": next_stage,
        "authoritativePlan": str(plan_path),
        "authoritativeReceipts": [str(path) for path in stage_receipts.get(closed_stage, [])
                                  if path.is_file()],
        "requiredNextInputs": [str(path) for path in required],
        "missingRequiredNextInputs": [str(path) for path in missing],
        "unresolvedHard": [*hard, *missing_messages],
        "editorialAdvisories": list(advisories),
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
    p.add_argument("--closed-stage", required=True,
                   choices=("PLAN", "PREVIS", "BUILD", "REVIEW", "CORRECTION", "FINAL"))
    p.add_argument("--next-stage", required=True,
                   choices=("PREVIS", "BUILD", "REVIEW", "CORRECTION", "FINAL"))
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
        out = state.project_path(state.project_root(resolve_plan_path(args.plan)), args.out)
        state.write_json(out, artifact)
        print(state.compact_result("CLOSED", changed=[out], receipt=artifact["handoffId"]))
        return 0
    if args.command == "asset-brief-packet":
        packet = build_asset_brief_packet(args.plan)
    else:
        packet = build_worker_packet(args.plan, [x.strip() for x in args.scenes.split(",") if x.strip()])
    out = state.project_path(state.project_root(resolve_plan_path(args.plan)), args.out)
    state.write_json(out, packet)
    print(state.compact_result("CLOSED", changed=[out], details=out,
                               receipt=packet["packetId"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())