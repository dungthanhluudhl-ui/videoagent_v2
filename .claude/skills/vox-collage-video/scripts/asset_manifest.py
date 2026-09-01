"""Manage the compact per-video asset manifest and replacement acceptance.

No image processing or vision occurs here. It binds acceptance to file bytes and
the intended plan brief, so a same-name replacement cannot inherit stale QA.
"""

import argparse
import json
import pathlib
import sys

import stage_state as state


def plan_assets(plan_path):
    plan_path = state.project_path(state.project_root(__file__), plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    for scene in plan.get("scenes") or []:
        for asset in scene.get("assets") or []:
            if not asset.get("src"):
                continue
            path = state.asset_path(root, plan.get("video", "V"), asset["src"])
            brief = state.asset_contract(scene, asset)
            yield plan, root, state.asset_usage_id(scene, asset), path, brief


def sync(plan_path):
    rows = list(plan_assets(plan_path))
    if not rows:
        return None, {}
    plan = rows[0][0]
    manifest_path = state.manifest_path_for_plan(plan_path, plan)
    existing = state.read_json(manifest_path, {"assets": {}}).get("assets", {})
    for _plan, _root, asset_id, path, brief in rows:
        file_id = state.file_input(path)
        identity = state.digest({"file": file_id, "brief": brief})
        source_state = existing.get(f"SOURCE:{path.name}", {})
        processing = {k: source_state[k] for k in
                      ("processingReceipt", "processedFile", "generationId", "lineagePath")
                      if k in source_state}
        if not processing.get("generationId"):
            lineage_path, generation_id = state.find_generation(_root, file_id)
            if generation_id:
                processing.update({"generationId": generation_id,
                                   "lineagePath": str(lineage_path)})
        state.update_manifest(manifest_path, plan.get("video"), asset_id,
                              {"sourceFile": file_id, "brief": brief,
                               "briefId": state.digest(brief), **processing}, identity)
    return manifest_path, state.read_json(manifest_path, {})


def accept(plan_path, asset_id, advisory=None, replacement_for=None):
    plan_path = state.project_path(state.project_root(__file__), plan_path)
    manifest_path, manifest = sync(plan_path)
    if not manifest_path or asset_id not in manifest.get("assets", {}):
        raise ValueError(f"unknown asset: {asset_id}")
    item = manifest["assets"][asset_id]
    acceptance = "ACCEPTED_WITH_ADVISORY" if advisory else "ACCEPTED"
    patch = {"acceptance": acceptance, "advisory": advisory or item.get("advisory", "")}
    if replacement_for:
        old = manifest["assets"].get(replacement_for)
        if not old:
            raise ValueError(f"unknown replacement source: {replacement_for}")
        patch["replacementFor"] = replacement_for
        old["acceptedReplacement"] = asset_id
        manifest["assets"][replacement_for] = old
        state.write_json(manifest_path, manifest)
    state.update_manifest(manifest_path, manifest.get("video"), asset_id, patch,
                          item.get("identity"))
    state.update_generation(state.project_root(plan_path), item.get("generationId"), {
        "acceptedUsage": asset_id, "acceptance": acceptance,
        "replacementFor": replacement_for, "advisory": advisory or ""})
    return manifest_path


def summary(manifest):
    rows = [r for key, r in (manifest.get("assets") or {}).items()
            if not key.startswith("SOURCE:")]
    hard = [r for r in rows if r.get("acceptance") == "HARD_UNUSABLE" or
            r.get("mechanicalQA") == "HARD_UNUSABLE" or
            r.get("cheapSemanticQA") == "HARD_UNUSABLE"]
    advisory = [r for r in rows if r.get("acceptance") == "ACCEPTED_WITH_ADVISORY"]
    accepted = [r for r in rows if r.get("acceptance") in
                ("ACCEPTED", "ACCEPTED_WITH_ADVISORY")]
    return len(rows), len(accepted), len(advisory), hard


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="command", required=True)
    p = sub.add_parser("sync")
    p.add_argument("plan")
    p = sub.add_parser("accept")
    p.add_argument("plan")
    p.add_argument("asset")
    p.add_argument("--advisory")
    p.add_argument("--replacement-for")
    p = sub.add_parser("summary")
    p.add_argument("plan")
    args = ap.parse_args()
    try:
        path, manifest = sync(args.plan)
        if args.command == "accept":
            path = accept(args.plan, args.asset, args.advisory, args.replacement_for)
            manifest = state.read_json(path, {})
        total, accepted, advisory, hard = summary(manifest)
    except ValueError as exc:
        print(f"HARD: {exc}", file=sys.stderr)
        return 2
    print(f"STATUS: {'HARD' if hard else 'CLOSED'}")
    print(f"ASSETS: {total}; ACCEPTED: {accepted}; ADVISORY: {advisory}; HARD: {len(hard)}")
    for item in hard:
        print(f"HARD {item.get('brief', {}).get('name') or item.get('sourceFile', {}).get('path')}")
    print(f"MANIFEST: {path}")
    return 1 if hard else 0


if __name__ == "__main__":
    sys.exit(main())