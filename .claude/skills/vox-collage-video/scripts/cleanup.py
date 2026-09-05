"""The single lifecycle-aware cleanup authority (DRY RUN by default).

Cleanup never runs from Stop. It uses ``stage_state.video_paths()`` and preserves
canonical source, selected assets, plan/transcript/alignment/manifest, approval
receipts, PREVIS baseline evidence, and final delivery at every lifecycle.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import sys

import build_gate
import pipeline_contracts as contracts
import stage_state as state

LIFECYCLES = ("ACTIVE", "PREVIS_APPROVED", "PROMOTED_CONFORMANT", "SHIPPED")


def under(path, parent):
    try:
        pathlib.Path(path).resolve().relative_to(pathlib.Path(parent).resolve())
        return True
    except ValueError:
        return False


def selected_files(plan, paths):
    selected = set()
    for scene in plan.get("scenes") or []:
        for material in state.scene_materials(scene):
            if material.get("src"):
                selected.add((paths["assets"] / pathlib.Path(str(material["src"])).name).resolve())
    return selected


def protected_files(plan, paths):
    protected = {paths[key].resolve() for key in (
        "plan", "transcript", "words", "asset_manifest", "audio", "final",
        "previs_manifest")}
    protected.update(selected_files(plan, paths))
    protected.update(path.resolve() for path in paths["previs_frames"].rglob("*") if path.is_file())
    protected.update(path.resolve() for path in paths["source"].rglob("*") if path.is_file())
    protected.update(path.resolve() for path in paths["receipts"].glob("*.json") if path.is_file())
    return protected


def project_lifecycle(plan_path, plan):
    if plan.get("status") == "shipped":
        return "SHIPPED"
    if build_gate.conformance_is_current(plan_path)[0]:
        return "PROMOTED_CONFORMANT"
    if contracts.previs_is_closed(plan_path)[0]:
        return "PREVIS_APPROVED"
    return "ACTIVE"


def files_in(path):
    path = pathlib.Path(path)
    return sorted((item for item in path.rglob("*") if item.is_file()), key=str) if path.is_dir() else []


def cleanup_plan(root, plan_path, lifecycle=None):
    root = pathlib.Path(root).resolve()
    plan_path = pathlib.Path(plan_path).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    paths = state.video_paths(root, plan.get("video", "V"))
    lifecycle = lifecycle or project_lifecycle(plan_path, plan)
    if lifecycle not in LIFECYCLES:
        raise ValueError(f"lifecycle must be one of {', '.join(LIFECYCLES)}")
    protected = protected_files(plan, paths)
    candidates = []

    # Rejected candidates and failed attempts become disposable only after approval.
    candidate_root = paths["runtime"] / "candidates"
    if lifecycle in {"PREVIS_APPROVED", "PROMOTED_CONFORMANT", "SHIPPED"}:
        for path in files_in(candidate_root):
            if path.name in {"need.json", "candidates.json", "triage.json",
                             "worker_return.json", "worker_receipt.json"}:
                continue
            candidates.append((path, "rejected-or-unlocked-candidate"))
        for directory in (paths["runtime"] / "failed-generations",
                          paths["runtime"] / "generation-attempts"):
            candidates.extend((path, "failed-generation-attempt") for path in files_in(directory))
        candidates.extend((path, "obsolete-previs-review-proxy")
                          for path in files_in(paths["previs_review_pages"]))

    if lifecycle in {"PROMOTED_CONFORMANT", "SHIPPED"}:
        candidates.extend((path, "temporary-review-extraction") for path in
                          files_in(paths["runtime"] / "review-extract-temp"))
        candidates.extend((path, "obsolete-promoted-frame") for path in
                          files_in(paths["promoted_previs_frames"]))

    if lifecycle == "SHIPPED":
        candidates.extend((path, "obsolete-review-proxy") for path in files_in(paths["review_pages"]))
        candidates.extend((path, "obsolete-review-frame-proxy") for path in files_in(paths["review_frames"]))

    # Repository-local rebuildable caches, never selected/canonical evidence.
    for directory in (root / ".preview",):
        candidates.extend((path, "rebuildable-preview") for path in files_in(directory))
    candidates.extend((path, "python-cache") for path in root.rglob("*.pyc"))

    unique = []
    seen = set()
    for path, reason in candidates:
        resolved = path.resolve()
        if resolved in seen or resolved in protected:
            continue
        if under(resolved, paths["assets"]) or under(resolved, paths["previs_frames"]):
            continue
        if resolved == paths["final"].resolve():
            continue
        seen.add(resolved); unique.append({"path": resolved, "reason": reason})
    return {"video": plan.get("video"), "lifecycle": lifecycle,
            "protectedCount": len(protected), "targets": unique}


def apply_cleanup(result):
    removed = []
    for item in result["targets"]:
        path = pathlib.Path(item["path"])
        if path.is_file():
            path.unlink(); removed.append(path)
    for parent in sorted({path.parent for path in removed}, key=lambda path: len(path.parts), reverse=True):
        try:
            parent.rmdir()
        except OSError:
            pass
    return removed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan")
    parser.add_argument("--lifecycle", choices=LIFECYCLES)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        plan_path = state.project_path(state.project_root(__file__), args.plan)
        root = state.project_root(plan_path)
        result = cleanup_plan(root, plan_path, args.lifecycle)
        removed = apply_cleanup(result) if args.apply else []
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"cleanup: HARD {exc}", file=sys.stderr); return 1
    payload = {**result, "dryRun": not args.apply, "removedCount": len(removed),
               "targets": [{"path": str(item["path"]), "reason": item["reason"]}
                           for item in result["targets"]]}
    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"{result['video']} {result['lifecycle']}: {len(result['targets'])} disposable file(s)")
        for item in result["targets"]:
            print(f"  {item['reason']}: {item['path']}")
        print("APPLIED" if args.apply else "DRY RUN — no files changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())