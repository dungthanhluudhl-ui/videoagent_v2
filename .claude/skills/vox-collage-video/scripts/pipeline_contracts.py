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
PREVIS_VERSION = "previs-approval-v1"


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


def previs_receipt_path(plan_path, plan):
    root = state.project_root(plan_path)
    return state.runtime_dir(root, plan.get("video", "V")) / "receipts" / "previs-approved.json"


def semantic_scene(scene):
    fields = ("id", "startSec", "endSec", "narrativeFunction", "viewerQuestion",
              "visualTransformation", "contrastWithPrevious", "visualLanguage",
              "backdrop", "density", "comprehensionLoad")
    return {key: scene.get(key) for key in fields if key in scene}


def locked_asset_contract(root, scene):
    rationale = str(scene.get("assetRationale") or scene.get("codeDrawnRationale") or "").strip()
    locked = []
    for asset in scene.get("assets") or []:
        if asset.get("meaningBearing") is not True:
            continue
        if asset.get("locked") is not True or not asset.get("src"):
            raise ValueError(
                f"{scene.get('id')}/{asset.get('name') or '?'}: meaning-bearing asset must be locked with src")
        path = root / "public" / asset["src"]
        proof = state.file_input(path)
        if proof.get("missing"):
            raise ValueError(f"{scene.get('id')}: locked asset is missing: {path}")
        expected = asset.get("lockedSha256")
        if expected and expected != proof.get("sha256"):
            raise ValueError(f"{scene.get('id')}: locked asset hash does not match current bytes: {asset['src']}")
        locked.append({"scene": scene.get("id"), "name": asset.get("name"),
                       "src": asset.get("src"), "role": asset.get("role"),
                       "sha256": proof.get("sha256"),
                       "evidenceRegions": asset.get("evidenceRegions") or [],
                       "sourceConstraint": asset.get("sourceConstraint"),
                       "rationale": asset.get("selectionRationale") or rationale})
    if not locked and not scene.get("codeDrawnRationale"):
        raise ValueError(f"{scene.get('id')}: no locked meaning-bearing asset or code-drawn rationale")
    if not rationale:
        raise ValueError(f"{scene.get('id')}: missing minimal asset-selection rationale")
    return locked, rationale


def _project_path(root, value):
    path = pathlib.Path(str(value or ""))
    return path if path.is_absolute() else root / path


def previs_approval_contract(plan_path, manifest_path):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    manifest_path = pathlib.Path(manifest_path)
    manifest_path = manifest_path if manifest_path.is_absolute() else root / manifest_path
    manifest = state.read_json(manifest_path, {})
    if plan.get("shotlistApproved") is not True:
        raise ValueError("shotlistApproved must be true before previs approval")
    proc = subprocess.run([sys.executable, str(HERE / "plan_gate.py"), str(plan_path), "--hook"],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode:
        raise ValueError("semantic plan integrity failed before previs approval")
    frames_by_scene = {}
    frame_inputs = []
    for item in manifest.get("frames") or []:
        sid, role = item.get("scene"), str(item.get("role") or "").upper()
        if role not in ("OPEN", "MID", "KEY"):
            continue
        path = _project_path(root, item.get("path"))
        proof = state.file_input(path)
        if proof.get("missing"):
            raise ValueError(f"{sid}/{role}: final previs frame is missing: {path}")
        declared = item.get("sha256")
        if declared and declared != proof.get("sha256"):
            raise ValueError(f"{sid}/{role}: frame hash disagrees with manifest")
        frames_by_scene.setdefault(sid, set()).add(role)
        frame_inputs.append({"scene": sid, "role": role, **proof})
    contact = _project_path(root, manifest.get("contactSheet"))
    contact_proof = state.file_input(contact)
    if contact_proof.get("missing"):
        raise ValueError("whole-video previs contact sheet is missing")
    scene_inputs, locked_assets, provenance = [], [], []
    for scene in plan.get("scenes") or []:
        sid = scene.get("id")
        required = {"OPEN", "KEY"}
        if not required.issubset(frames_by_scene.get(sid, set())):
            raise ValueError(f"{sid}: final OPEN and KEY previs frames are required")
        assets, rationale = locked_asset_contract(root, scene)
        locked_assets.extend(assets)
        source = root / "src" / "scenes" / f"{plan.get('video', 'V')}Scene{sid.lstrip('S')}.jsx"
        if not source.is_file():
            raise ValueError(f"{sid}: scene source is missing: {source}")
        semantic = semantic_scene(scene)
        scene_inputs.append({"scene": sid, "semanticSliceFingerprint": state.digest(semantic),
                             "semantic": semantic, "assetRationale": rationale})
        provenance.append({"scene": sid, "sourcePath": str(source),
                           "previsSourceSha": state.hash_file(source)})
    plan_receipt = state.read_json(plan_receipt_path(plan_path, plan), {})
    inputs = {"planIdentity": {"video": plan.get("video"),
                               "planVersion": plan_receipt.get("receiptId") or state.digest(
                                   state.plan_contract(plan, plan_path))},
              "semanticScenes": scene_inputs, "lockedAssets": locked_assets,
              "approvedFrames": frame_inputs, "contactSheet": contact_proof}
    return plan, root, manifest_path, inputs, provenance


def approve_previs(plan_path, manifest_path, art_direction):
    if not str(art_direction or "").strip():
        raise ValueError("a free-text human artDirection approval note is required")
    plan, root, manifest_path, inputs, provenance = previs_approval_contract(plan_path, manifest_path)
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": PREVIS_VERSION})
    path = previs_receipt_path(plan_path, plan)
    receipt = state.make_receipt(
        path, "previs-approved", inputs, tool, {}, outputs=(),
        accepted={"manual": True, "artDirection": art_direction.strip()},
        metadata={"approvalBaselineManifest": str(manifest_path),
                  "sourceProvenance": provenance,
                  "note": "previsSourceSha is provenance only; additive promotion may change source bytes"})
    return path, receipt


def previs_is_closed(plan_path):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    path = previs_receipt_path(plan_path, plan)
    existing = state.read_json(path, {})
    manifest = (existing.get("metadata") or {}).get("approvalBaselineManifest")
    if not manifest:
        return False, path, existing
    try:
        _plan, _root, _manifest, inputs, _provenance = previs_approval_contract(plan_path, manifest)
    except ValueError:
        return False, path, existing
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": PREVIS_VERSION})
    current, receipt = state.receipt_current(path, "previs-approved", inputs, tool, {},
                                             require_outputs=False)
    return current, path, receipt


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


def close_correction(plan_path, note="one targeted editorial correction complete", changed_scenes=()):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    review = pathlib.Path(str(plan_path).replace("scene_plan", "review"))
    known = {s.get("id") for s in plan.get("scenes") or []}
    changed = list(dict.fromkeys(changed_scenes or known))
    unknown = [sid for sid in changed if sid not in known]
    if unknown:
        raise ValueError(f"unknown changed scene(s): {', '.join(unknown)}")
    inputs = {"plan": state.json_input(plan_path), "review": state.json_input(review),
              "sceneSources": [state.file_input(root / "src" / "scenes" /
                                                f"{video}Scene{sid.lstrip('S')}.jsx")
                               for sid in changed]}
    tool = state.tool_identity(HERE / "pipeline_contracts.py",
                               versions={"contract": "editorial-correction-v1"})
    path = state.runtime_dir(root, video) / "receipts" / "editorial-correction.json"
    return path, state.make_receipt(path, "editorial-correction", inputs, tool,
                                    {"note": note, "changedScenes": changed}, outputs=(),
                                    accepted={"manual": True, "changedScenes": changed})


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
    p = sub.add_parser("approve-previs")
    p.add_argument("plan")
    p.add_argument("--manifest")
    p.add_argument("--art-direction", required=False)
    p.add_argument("--check", action="store_true",
                   help="verify currentness without replacing the approval baseline")
    p = sub.add_parser("worker-packet")
    p.add_argument("plan")
    p.add_argument("--scenes", required=True, help="comma-separated adjacent scene ids")
    p.add_argument("--out", required=True)
    p = sub.add_parser("asset-brief-packet")
    p.add_argument("plan")
    p.add_argument("--out", required=True)
    p = sub.add_parser("close-correction")
    p.add_argument("plan")
    p.add_argument("--note", default="one targeted editorial correction complete")
    p.add_argument("--changed-scenes", default="",
                   help="comma-separated scene ids substantively changed by the one correction")
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
    if args.command == "approve-previs":
        try:
            if args.check:
                closed, path, receipt = previs_is_closed(args.plan)
                print(state.compact_result("CLOSED" if closed else "HARD",
                                           hard=0 if closed else 1, details=path,
                                           receipt=receipt or "missing"))
                return 0 if closed else 1
            if not args.manifest:
                raise ValueError("--manifest is required when creating previs approval")
            path, receipt = approve_previs(args.plan, args.manifest, args.art_direction)
            print(state.compact_result("CLOSED", changed=[path], receipt=receipt))
            return 0
        except ValueError as exc:
            print(state.compact_result("HARD", hard=1, questions=[str(exc)]), file=sys.stderr)
            return 1
    if args.command == "close-correction":
        try:
            path, receipt = close_correction(
                args.plan, args.note,
                [x.strip() for x in args.changed_scenes.split(",") if x.strip()])
            print(state.compact_result("CLOSED", changed=[path], receipt=receipt))
            return 0
        except ValueError as exc:
            print(state.compact_result("HARD", hard=1, questions=[str(exc)]), file=sys.stderr)
            return 1
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