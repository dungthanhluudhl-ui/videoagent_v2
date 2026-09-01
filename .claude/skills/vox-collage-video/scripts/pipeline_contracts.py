"""Human approval receipts for the canonical PLAN -> PREVIS -> REVIEW lifecycle.

Disk artifacts are pipeline memory. This module records approvals and checks
their currentness; it is intentionally not a scheduler, renderer, or state
framework.
"""

import argparse
import json
import pathlib
import subprocess
import sys

import stage_state as state

HERE = pathlib.Path(__file__).resolve().parent
PLAN_VERSION = "semantic-plan-approval-v3"
PREVIS_VERSION = "actual-pixel-previs-approval-v2"
CORRECTION_VERSION = "local-correction-v2"
HANDOFF_VERSION = "stage-handoff-v2"

CANONICAL_STAGES = ("PLAN", "PREVIS", "REVIEW", "CORRECTION", "FINAL")
STAGE_ALIASES = {"BUILD": "PREVIS"}
SCENE_STATUS_STAGES = {
    None: "PLAN", "planned": "PLAN", "previs": "PREVIS", "built": "PREVIS",
    "reviewed": "REVIEW",
}
CANONICAL_PREVIS_MARKER = "// PREVIS-HERE:"
PREVIS_MARKER_ALIASES = ("// BUILT-HERE:",)


def resolve_plan_path(plan_path):
    return state.project_path(state.project_root(__file__), plan_path)


def canonical_stage(stage):
    raw = str(stage or "").strip().upper()
    value = STAGE_ALIASES.get(raw, raw)
    if value not in CANONICAL_STAGES:
        raise ValueError(f"unknown lifecycle stage {stage!r}")
    return value


def scene_status_stage(status):
    if status not in SCENE_STATUS_STAGES:
        raise ValueError(f"unknown scene status {status!r}")
    return SCENE_STATUS_STAGES[status]


def canonical_previs_marker(text):
    if CANONICAL_PREVIS_MARKER in text or any(x in text for x in PREVIS_MARKER_ALIASES):
        return CANONICAL_PREVIS_MARKER
    return None


def approval_contract(plan):
    approved = plan.get("shotlistApproved") is True
    return {"approved": approved, "marker": "shotlistApproved",
            "reason": None if approved else "shotlistApproved must be true before PREVIS"}


def require_plan_approval(plan):
    approval = approval_contract(plan)
    if not approval["approved"]:
        raise ValueError(approval["reason"])
    return approval


def lifecycle_contract(plan):
    scene_stages, invalid = [], []
    for scene in plan.get("scenes") or []:
        try:
            scene_stages.append(scene_status_stage(scene.get("status")))
        except ValueError:
            invalid.append({"scene": scene.get("id"), "status": scene.get("status")})
    rank = {stage: index for index, stage in enumerate(CANONICAL_STAGES)}
    return {
        "workflowStatus": plan.get("status"), "sceneStages": scene_stages,
        "invalidSceneStatuses": invalid,
        "anyPrevis": any(rank[x] >= rank["PREVIS"] for x in scene_stages),
        "previsComplete": bool(scene_stages) and all(rank[x] >= rank["PREVIS"] for x in scene_stages),
        "reviewComplete": bool(scene_stages) and all(rank[x] >= rank["REVIEW"] for x in scene_stages),
    }


def plan_receipt_path(plan_path, plan):
    root = state.project_root(plan_path)
    return state.video_paths(root, plan.get("video", "V"))["receipts"] / "plan-approved.json"


def plan_inputs(plan_path, plan):
    return state.plan_contract(plan, plan_path)


def plan_tool():
    return state.tool_identity(HERE / "plan_gate.py", HERE / "pipeline_contracts.py",
                               versions={"contract": PLAN_VERSION})


def run_plan_gate(plan_path):
    proc = subprocess.run([sys.executable, str(HERE / "plan_gate.py"), str(plan_path), "--hook"],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode:
        hard = "\n".join(line for line in ((proc.stdout or "") + (proc.stderr or "")).splitlines()
                         if line.startswith("FAIL "))
        raise ValueError("semantic plan integrity failed" + (f": {hard}" if hard else ""))


def approve_plan(plan_path):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    require_plan_approval(plan)
    run_plan_gate(plan_path)
    path = plan_receipt_path(plan_path, plan)
    receipt = state.make_receipt(path, "editorial-plan", plan_inputs(plan_path, plan),
                                 plan_tool(), {}, outputs=(),
                                 accepted={"manual": True, "marker": "shotlistApproved"})
    return path, receipt


def plan_is_closed(plan_path):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    path = plan_receipt_path(plan_path, plan)
    current, receipt = state.receipt_current(path, "editorial-plan",
                                             plan_inputs(plan_path, plan), plan_tool(), {},
                                             require_outputs=False)
    return current and approval_contract(plan)["approved"], path, receipt


def semantic_scene(scene):
    """Creative intent only: implementation timing and workflow fields never enter."""
    fields = (
        "id", "narrativeFunction", "viewerQuestion", "visualTransformation",
        "contrastWithPrevious", "visualLanguage", "treatment", "backdrop", "density",
        "comprehensionLoad", "evidenceIdentity", "evidenceRegions",
    )
    result = {key: scene.get(key) for key in fields if key in scene}
    result["assets"] = [
        {key: asset.get(key) for key in (
            "name", "src", "role", "meaningBearing", "describes", "sourceConstraint",
            "evidenceIdentity", "evidenceRegions", "selectionRationale",
        ) if key in asset}
        for asset in scene.get("assets") or []
    ]
    return result


def meaning_assets(scene):
    return [asset for asset in scene.get("assets") or []
            if asset.get("src") and asset.get("meaningBearing", True) is not False
            and asset.get("decorative") is not True]


def locked_asset_contract(root, video, scene):
    rows = []
    rationale = str(scene.get("assetRationale") or "").strip()
    for asset in meaning_assets(scene):
        src = pathlib.Path(str(asset.get("src"))).name
        path = state.asset_path(root, video, src)
        if not path.is_file():
            raise ValueError(f"{scene.get('id')}: meaning-bearing asset is missing: {path}")
        try:
            with path.open("rb") as handle:
                handle.read(1)
        except OSError as exc:
            raise ValueError(f"{scene.get('id')}: meaning-bearing asset is unreadable: {path}: {exc}") from exc
        expected = asset.get("lockedSha256")
        actual = state.hash_file(path)
        if asset.get("locked") is not True or not expected:
            raise ValueError(f"{scene.get('id')}/{src}: meaning-bearing asset must be locked with lockedSha256")
        if expected != actual:
            raise ValueError(f"{scene.get('id')}/{src}: locked asset bytes changed")
        asset_rationale = str(asset.get("selectionRationale") or rationale).strip()
        if not asset_rationale:
            raise ValueError(f"{scene.get('id')}/{src}: locked asset needs selection rationale")
        rows.append({
            "scene": scene.get("id"), "name": asset.get("name"), "src": src,
            "role": asset.get("role"), "sha256": actual,
            "evidenceIdentity": asset.get("evidenceIdentity"),
            "evidenceRegions": asset.get("evidenceRegions") or [],
        })
    return rows


def mid_required(scene):
    declared = scene.get("previsFrames") or scene.get("previsFrameRoles") or []
    if isinstance(declared, dict):
        declared = declared.get("roles") or []
    return scene.get("previsMidRequired") is True or "MID" in {str(x).upper() for x in declared}


def validate_previs_manifest(plan_path, plan, manifest_path, require_source_current=False):
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    manifest_path = state.project_path(root, manifest_path or paths["previs_manifest"])
    manifest = state.read_json(manifest_path, {})
    if not manifest_path.is_file() or not isinstance(manifest.get("frames"), list):
        raise ValueError(f"previs/frames_manifest.json is missing or invalid: {manifest_path}")
    if manifest.get("video") not in (None, plan.get("video")):
        raise ValueError("previs frame manifest belongs to a different video")

    by_scene, frame_inputs = {}, []
    for item in manifest.get("frames") or []:
        sid = item.get("scene")
        role = str(item.get("role") or "").upper()
        if role not in {"OPEN", "KEY", "MID"}:
            raise ValueError(f"{sid}: unknown PREVIS frame role {role!r}")
        path = state.project_path(root, item.get("path"))
        proof = state.file_input(path)
        if proof.get("missing"):
            raise ValueError(f"{sid}/{role}: actual PREVIS frame is missing: {path}")
        if item.get("sha256") != proof.get("sha256"):
            raise ValueError(f"{sid}/{role}: frame hash disagrees with frames_manifest.json")
        if require_source_current:
            source = state.scene_source(root, plan.get("video", "V"), sid)
            if not item.get("sourceSha256") or not source.is_file() or \
                    item.get("sourceSha256") != state.hash_file(source):
                raise ValueError(f"{sid}/{role}: PREVIS pixels are stale against current scene source")
        key = (sid, role)
        if key in by_scene:
            raise ValueError(f"{sid}/{role}: duplicate PREVIS frame role")
        by_scene[key] = path
        frame_inputs.append({"scene": sid, "role": role, **proof})

    scene_ids = {scene.get("id") for scene in plan.get("scenes") or []}
    extras = {sid for sid, _role in by_scene} - scene_ids
    if extras:
        raise ValueError(f"PREVIS manifest has scenes not in semantic plan: {sorted(extras)}")
    for scene in plan.get("scenes") or []:
        sid = scene.get("id")
        required = {"OPEN", "KEY"} | ({"MID"} if mid_required(scene) else set())
        missing = [role for role in required if (sid, role) not in by_scene]
        if missing:
            raise ValueError(f"{sid}: required actual PREVIS frames missing: {', '.join(sorted(missing))}")
        if not mid_required(scene) and (sid, "MID") in by_scene:
            raise ValueError(f"{sid}: MID is allowed only when explicitly declared")

    contact = state.project_path(root, manifest.get("contactSheet") or paths["contact_sheet"])
    contact_proof = state.file_input(contact)
    if contact_proof.get("missing") or not contact_proof.get("size"):
        raise ValueError(f"one whole-video PREVIS contact sheet is required: {contact}")
    declared_contact = manifest.get("contactSheetSha256")
    if declared_contact and declared_contact != contact_proof.get("sha256"):
        raise ValueError("PREVIS contact sheet hash disagrees with frames_manifest.json")
    return manifest_path, manifest, frame_inputs, contact_proof


def previs_receipt_path(plan_path, plan):
    root = state.project_root(plan_path)
    return state.video_paths(root, plan.get("video", "V"))["receipts"] / "previs-approved.json"


def previs_tool():
    return state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": PREVIS_VERSION})


def previs_approval_contract(plan_path, manifest_path=None, approval_note=None,
                             require_source_current=False):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    closed, _path, _receipt = plan_is_closed(plan_path)
    if not closed:
        raise ValueError("a current approved semantic plan is required before approve-previs")
    # plan_is_closed binds the semantic plan to a plan_gate-validated approval.
    # Re-running timing-sensitive planning heuristics here would incorrectly make
    # start/end/transition-only implementation changes creative changes.
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    paths = state.video_paths(root, video)
    manifest_path, _manifest, frame_inputs, contact = validate_previs_manifest(
        plan_path, plan, manifest_path or paths["previs_manifest"], require_source_current)
    locked, semantics, provenance = [], [], []
    for scene in plan.get("scenes") or []:
        locked.extend(locked_asset_contract(root, video, scene))
        semantic = semantic_scene(scene)
        semantics.append({"scene": scene.get("id"), "creative": semantic,
                          "fingerprint": state.digest(semantic)})
        source = state.scene_source(root, video, scene.get("id"))
        if not source.is_file():
            raise ValueError(f"{scene.get('id')}: production-compatible PREVIS source is missing: {source}")
        provenance.append({"scene": scene.get("id"), "sourcePath": str(source),
                           "previsSourceSha": state.hash_file(source)})
    inputs = {
        "video": video,
        "treatmentIntent": plan.get("globalVisualContract") or plan.get("styleContract") or {},
        "semanticScenes": semantics, "lockedAssets": locked,
        "approvedFrames": sorted(frame_inputs, key=lambda x: (str(x["scene"]), x["role"])),
        "contactSheet": contact, "humanApprovalNote": str(approval_note or "").strip(),
    }
    return plan, root, manifest_path, inputs, provenance


def approve_previs(plan_path, manifest_path=None, art_direction=None):
    note = str(art_direction or "").strip()
    if not note:
        raise ValueError("a non-empty human art-direction approval note is required")
    plan, _root, manifest_path, inputs, provenance = previs_approval_contract(
        plan_path, manifest_path, note, require_source_current=True)
    path = previs_receipt_path(resolve_plan_path(plan_path), plan)
    receipt = state.make_receipt(
        path, "previs-approved", inputs, previs_tool(), {}, outputs=(),
        accepted={"manual": True, "artDirection": note},
        metadata={"approvalBaselineManifest": str(manifest_path),
                  "sourceProvenance": provenance,
                  "note": "source SHA is provenance only; same-source promotion may add motion"})
    return path, receipt


def previs_is_closed(plan_path):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    path = previs_receipt_path(plan_path, plan)
    existing = state.read_json(path, {})
    metadata = existing.get("metadata") or {}
    manifest = metadata.get("approvalBaselineManifest")
    note = (existing.get("accepted") or {}).get("artDirection")
    if not manifest or not str(note or "").strip():
        return False, path, existing
    try:
        _plan, _root, _manifest, inputs, _provenance = previs_approval_contract(
            plan_path, manifest, note)
    except (OSError, ValueError, json.JSONDecodeError):
        return False, path, existing
    current, receipt = state.receipt_current(path, "previs-approved", inputs,
                                             previs_tool(), {}, require_outputs=False)
    return current, path, receipt


def close_correction(plan_path, note="correction decision complete", changed_scenes=()):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    changed = list(changed_scenes or [])
    if len(changed) > 1:
        raise ValueError("at most one local scene correction is allowed")
    inputs = {"plan": state.json_input(plan_path), "review": state.json_input(paths["review"]),
              "changedSceneSources": [state.file_input(state.scene_source(
                  root, plan.get("video", "V"), sid)) for sid in changed]}
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": CORRECTION_VERSION})
    path = paths["receipts"] / "editorial-correction.json"
    receipt = state.make_receipt(path, "editorial-correction", inputs, tool,
                                 {"note": note, "changedScenes": changed}, outputs=(),
                                 accepted={"manual": True})
    return path, receipt


def correction_is_closed(plan_path):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    path = paths["receipts"] / "editorial-correction.json"
    existing = state.read_json(path, {})
    params = existing.get("parameters") or {}
    changed = params.get("changedScenes") or []
    if len(changed) > 1:
        return False, path, existing
    inputs = {"plan": state.json_input(plan_path), "review": state.json_input(paths["review"]),
              "changedSceneSources": [state.file_input(state.scene_source(
                  root, plan.get("video", "V"), sid)) for sid in changed]}
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": CORRECTION_VERSION})
    current, receipt = state.receipt_current(path, "editorial-correction", inputs, tool,
                                             params, require_outputs=False)
    return current, path, receipt


def build_handoff(plan_path, closed_stage, next_stage, hard=(), advisories=(), changed_scenes=()):
    plan_path = resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    artifact = {
        "schema": 1, "handoffVersion": HANDOFF_VERSION, "video": plan.get("video"),
        "closedStage": canonical_stage(closed_stage),
        "nextRequestedStage": canonical_stage(next_stage),
        "authoritativePlan": str(plan_path), "unresolvedHard": list(hard),
        "editorialAdvisories": list(advisories), "changedSceneIds": list(changed_scenes),
    }
    artifact["handoffId"] = state.digest(artifact)
    return artifact


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="command", required=True)
    for command in ("approve-plan", "plan-status"):
        parser = sub.add_parser(command); parser.add_argument("plan")
    parser = sub.add_parser("approve-previs")
    parser.add_argument("plan"); parser.add_argument("--manifest")
    parser.add_argument("--art-direction"); parser.add_argument("--check", action="store_true")
    parser = sub.add_parser("close-correction")
    parser.add_argument("plan"); parser.add_argument("--note", default="correction decision complete")
    parser.add_argument("--changed-scenes", default="")
    parser = sub.add_parser("handoff")
    parser.add_argument("plan"); parser.add_argument("--closed-stage", required=True)
    parser.add_argument("--next-stage", required=True); parser.add_argument("--hard", action="append", default=[])
    parser.add_argument("--advisory", action="append", default=[]); parser.add_argument("--changed-scenes", default="")
    parser.add_argument("--out", required=True)
    args = ap.parse_args()
    try:
        if args.command == "approve-plan":
            path, receipt = approve_plan(args.plan)
            print(state.compact_result("CLOSED", changed=[path], receipt=receipt)); return 0
        if args.command == "plan-status":
            closed, path, receipt = plan_is_closed(args.plan)
            print(state.compact_result("CLOSED" if closed else "HARD", hard=0 if closed else 1,
                                       details=path, receipt=receipt or "missing")); return 0 if closed else 1
        if args.command == "approve-previs":
            if args.check:
                closed, path, receipt = previs_is_closed(args.plan)
                print(state.compact_result("CLOSED" if closed else "HARD", hard=0 if closed else 1,
                                           details=path, receipt=receipt or "missing")); return 0 if closed else 1
            path, receipt = approve_previs(args.plan, args.manifest, args.art_direction)
            print(state.compact_result("CLOSED", changed=[path], receipt=receipt)); return 0
        if args.command == "close-correction":
            changed = [x.strip() for x in args.changed_scenes.split(",") if x.strip()]
            path, receipt = close_correction(args.plan, args.note, changed)
            print(state.compact_result("CLOSED", changed=[path], receipt=receipt)); return 0
        changed = [x.strip() for x in args.changed_scenes.split(",") if x.strip()]
        artifact = build_handoff(args.plan, args.closed_stage, args.next_stage,
                                 args.hard, args.advisory, changed)
        root = state.project_root(resolve_plan_path(args.plan))
        out = state.project_path(root, args.out); state.write_json(out, artifact)
        print(state.compact_result("CLOSED", changed=[out], receipt=artifact["handoffId"])); return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(state.compact_result("HARD", hard=1, questions=[str(exc)]), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())