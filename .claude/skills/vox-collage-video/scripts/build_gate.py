"""Verify bespoke production-compatible PREVIS source and promoted pixels.

Normal/--previs mode checks the semantic plan and locked assets against the real
scene JSX. --previs-baseline checks promoted OPEN/KEY pixels against the human-
approved baseline and proves approved meaning-bearing elements remain mounted at
their approved frame roles. No template, renderer, or layout component is
required.
"""

import argparse
import json
import os
import pathlib
import re
import sys

import pipeline_contracts as contracts
import stage_state as state
import beat_sync

try:
    from PIL import Image, ImageFilter
except ImportError:
    Image = ImageFilter = None

PIXEL_VERSION = "selective-promoted-open-key-v3"
FRESH_SCHEMA = "v18-rebuilt-plan-v1"
MAX_BLOCK_MAE = 0.42
MAX_CENTROID_DISPLACEMENT = 0.13
MAX_BBOX_DISPLACEMENT = 0.24


def scene_source(root, video, scene):
    return state.scene_source(root, video, scene.get("id"))


def meaning_assets(scene):
    return contracts.meaning_assets(scene)


def static_file_references(text):
    """Literal public identities used by direct bespoke JSX."""
    return {pathlib.Path(raw).name for raw in re.findall(
        r"staticFile\s*\(\s*[\"']([^\"']+)[\"']\s*\)", text)}


def source_asset_references(text):
    found = static_file_references(text)
    found.update(pathlib.Path(raw).name for raw in re.findall(
        r"(?:src|docSrc)\s*[:=]\s*(?:\{\s*)?[\"']([^\"']+\.(?:png|jpg|jpeg|webp|gif|svg|pdf|mp4|mov|m4v|webm))[\"']",
        text, re.I))
    return found


def literal_media_references(text):
    """Literal media identities used by fresh JSX; dynamic sources cannot prove a lock."""
    direct = re.findall(r"staticFile\s*\(\s*[\"']([^\"']+)[\"']\s*\)", text)
    direct += re.findall(
        r"(?:src|docSrc)\s*[:=]\s*(?:\{\s*)?[\"']([^\"']+)[\"']", text, re.I)
    direct += re.findall(r"url\s*\(\s*[\"']?([^\"')]+)", text, re.I)
    literals = re.findall(r"[\"']([^\"']+)[\"']", text)
    media_suffix = re.compile(r"\.(?:png|jpe?g|webp|gif|svg|pdf|mp4|mov|m4v|webm)(?:[?#].*)?$", re.I)
    return ({raw for raw in direct if re.match(r"^(?:https?:|data:|blob:)", raw, re.I)
             or media_suffix.search(raw)} |
            {raw for raw in literals if re.match(r"^(?:data:|blob:)", raw, re.I)
             or media_suffix.search(raw)})


def dynamic_media_source_problems(scene, text):
    """Dynamic runtime source expressions cannot prove a selected local byte identity."""
    problems = []
    for opening in re.findall(r"<(?:Img|Video|MediaPlate|DocumentEvidence|MapGraphic)\b[^>]*>", text, re.S):
        source_prop = re.search(r"\bsrc\s*=\s*{([^}]+)}", opening, re.S)
        if source_prop and not re.search(r"staticFile\s*\(\s*[\"'][^\"']+[\"']\s*\)", source_prop.group(1)):
            problems.append(f"{scene.get('id')}: dynamic meaning-bearing media src cannot prove a locked selected byte")
    return problems


def _literal_prop(opening, name):
    match = re.search(rf"\b{re.escape(name)}\s*=\s*(?:{{\s*)?[\"']([^\"']+)[\"']", opening)
    return match.group(1) if match else None


def _literal_numeric_array(opening, name):
    match = re.search(rf"\b{re.escape(name)}\s*=\s*{{\s*\[([^\]]*)\]", opening, re.S)
    if not match:
        return None
    try:
        return [float(item.strip()) for item in match.group(1).split(",") if item.strip()]
    except ValueError:
        return None


def _literal_focus_region(opening):
    match = re.search(r"\bregion\s*:\s*\[([^\]]*)\]", opening, re.S)
    if not match:
        return None
    try:
        return [float(item.strip()) for item in match.group(1).split(",") if item.strip()]
    except ValueError:
        return None


def fresh_source_integrity_problems(plan_path, plan, scene, text, plan_closed):
    """Enforce declared material <-> meaning-bearing fresh-source identity both ways."""
    sid = scene.get("id")
    problems = []
    materials = state.scene_materials(scene)
    declared_files = {pathlib.Path(str(item.get("src"))).name for item in materials
                      if item.get("src") and item.get("meaningBearing", True) is not False
                      and item.get("decorative") is not True}
    _manifest_path, manifest = state.sync_asset_manifest(plan_path)
    for raw in sorted(literal_media_references(text)):
        if re.match(r"^(?:https?:|data:|blob:)", raw, re.I):
            problems.append(f"{sid}: fresh production media bypasses ASSET LOCK with remote/data/blob src: {raw[:48]}")
            continue
        name = pathlib.Path(raw).name
        if name not in declared_files:
            problems.append(f"{sid}: undeclared meaning-bearing local media in fresh source: {name}")
            continue
        material = next(item for item in materials
                        if item.get("src") and pathlib.Path(str(item["src"])).name == name)
        accepted = (manifest.get("assets") or {}).get(state.asset_usage_id(scene, material), {})
        if accepted.get("acceptance") not in {"ACCEPTED", "ACCEPTED_WITH_ADVISORY"}:
            problems.append(f"{sid}/{name}: selected media lacks current ASSET LOCK acceptance")
    problems += dynamic_media_source_problems(scene, text)

    component_contracts = {
        "DocumentEvidence": "document",
        "RelationDiagram": "diagram-exception",
        "MapGraphic": "map",
        "DataChart": "chart",
    }
    for component, intent in component_contracts.items():
        for opening in re.findall(rf"<{component}\b[^>]*>", text, re.S):
            material_id = _literal_prop(opening, "materialId")
            material = next((item for item in materials
                             if str(item.get("id") or item.get("name")) == material_id), None)
            prefix = f"{sid}/{component}"
            if not material_id or material is None or material.get("materialIntent") != intent:
                problems.append(f"{prefix}: requires literal materialId matching declared materialIntent={intent}")
                continue
            if component == "DocumentEvidence":
                if material.get("evidenceIdentity") and material.get("evidenceRegions"):
                    region = _literal_focus_region(opening)
                    approved_regions = [item.get("region") for item in material.get("evidenceRegions") or []]
                    if not region:
                        problems.append(f"{prefix}/{material_id}: exact evidence region requires truthful focus on the authentic raster")
                    elif not any(len(approved) == len(region) and all(abs(float(a) - float(b)) < 1e-6
                                     for a, b in zip(approved, region)) for approved in approved_regions if approved):
                        problems.append(f"{prefix}/{material_id}: focus region does not match an approved PLAN evidence region")
            elif component == "RelationDiagram":
                if len(str(material.get("diagramJustification") or "").strip()) < 30 or not plan_closed:
                    problems.append(f"{prefix}/{material_id}: requires current human-approved matching diagram-exception")
            elif component == "MapGraphic":
                if not str(material.get("mapDataIdentity") or "").strip():
                    problems.append(f"{prefix}/{material_id}: matching map material requires mapDataIdentity")
            else:
                data = material.get("numericData")
                numeric = isinstance(data, list) and bool(data) and all(
                    isinstance(value, (int, float)) and not isinstance(value, bool) for value in data)
                if not numeric or not str(material.get("dataSource") or "").strip():
                    problems.append(f"{prefix}/{material_id}: matching chart requires real numericData and dataSource")
                used_data = _literal_numeric_array(opening, "data")
                if numeric and (used_data is None or len(used_data) != len(data) or
                                any(abs(float(a) - float(b)) > 1e-9 for a, b in zip(used_data, data))):
                    problems.append(f"{prefix}/{material_id}: JSX numeric data must exactly match approved PLAN numericData")
    for material in materials:
        if (material.get("materialIntent") == "document" and material.get("evidenceIdentity")
                and material.get("evidenceRegions")):
            mid = re.escape(str(material.get("id") or material.get("name") or ""))
            if not re.search(rf"<DocumentEvidence\b[^>]*\bmaterialId\s*=\s*[\"']{mid}[\"']", text, re.S):
                problems.append(f"{sid}/{material.get('id')}: exact evidence cannot be replaced by retyped claim text; use matching DocumentEvidence")
    return problems


def sequence_ranges(text):
    """Return Sequence opening/body ranges with literal `from` frames."""
    token = re.compile(r"<Sequence\b[^>]*>|</Sequence>", re.S)
    stack, ranges = [], []
    for match in token.finditer(text):
        if match.group(0).startswith("</"):
            if stack:
                opening = stack.pop()
                ranges.append((opening[0], match.end(), opening[1]))
            continue
        frm = re.search(r"\bfrom\s*=\s*\{\s*(\d+)\s*\}", match.group(0))
        stack.append((match.start(), int(frm.group(1)) if frm else 0))
    return ranges


def asset_mount_frame(text, src):
    """Earliest literal Sequence frame enclosing this asset; 0 means mounted at OPEN."""
    name = pathlib.Path(str(src)).name
    hits = []
    patterns = (
        r"staticFile\s*\(\s*[\"'][^\"']*" + re.escape(name) + r"[\"']\s*\)",
        r"(?:src|docSrc)\s*[:=]\s*(?:\{\s*)?[\"'][^\"']*" + re.escape(name) + r"[\"']",
    )
    for pattern in patterns:
        hits.extend(match.start() for match in re.finditer(pattern, text, re.I))
    if not hits:
        return None
    ranges = sequence_ranges(text)
    starts = []
    for hit in hits:
        enclosing = [frm for start, end, frm in ranges if start <= hit < end]
        starts.append(sum(enclosing) if enclosing else 0)
    return min(starts)


def role_frame(item):
    value = item.get("localFrame")
    if value is None:
        value = item.get("frame")
    return int(value or 0)


def locked_asset_problems(root, video, scene, text, require_lock=True):
    problems = []
    used = source_asset_references(text)
    for material in state.scene_materials(scene):
        if contracts.material_lock_required(material) and not material.get("src"):
            problems.append(f"{scene.get('id')}/{material.get('id') or material.get('name')}: "
                            f"materialIntent={material.get('materialIntent')} requires a real locked file")
    for asset in meaning_assets(scene):
        src = pathlib.Path(str(asset.get("src"))).name
        path = state.asset_path(root, video, src)
        if not path.is_file():
            problems.append(f"{scene.get('id')}: meaning-bearing asset does not exist: {path}")
            continue
        try:
            with path.open("rb") as handle:
                handle.read(1)
        except OSError as exc:
            problems.append(f"{scene.get('id')}/{src}: asset is unreadable: {exc}")
            continue
        actual = state.hash_file(path)
        try:
            contracts.validate_media_metadata(scene, asset, path)
        except ValueError as exc:
            problems.append(str(exc))
        expected = asset.get("lockedSha256")
        if require_lock and (asset.get("locked") is not True or not expected):
            problems.append(f"{scene.get('id')}/{src}: meaning-bearing asset is not locked")
        elif expected and expected != actual:
            problems.append(f"{scene.get('id')}/{src}: locked asset bytes changed")
        if src not in used:
            problems.append(f"{scene.get('id')}: locked meaning-bearing asset is absent from bespoke source: {src}")
        label = str(asset.get("reconstructionLabel") or "").strip()
        if asset.get("materialIntent") == "reconstruction" and label not in text:
            problems.append(f"{scene.get('id')}/{src}: truthful reconstructionLabel is absent from scene source")
    return problems


def promotion_timing_problems(plan_path, plan, scene, text):
    """Meaning-bearing Reveal timing is speech-derived; ambient motion is free."""
    if "<Reveal" not in text:
        return []
    try:
        beat_sync.write_timing(plan_path, check=True)
        _plan, _root, timing = beat_sync.resolve_contract(plan_path)
    except (OSError, KeyError, ValueError, json.JSONDecodeError) as exc:
        return [f"{scene.get('id')}: promotion timing cannot resolve: {exc}"]
    problems = []
    for opening in re.findall(r"<Reveal\b[^>]*>", text, re.S):
        if re.search(r"meaningBearing\s*=\s*\{?false\}?", opening):
            continue
        key_match = re.search(r"beatId\s*=\s*[\"']([^\"']+)[\"']", opening)
        if not key_match:
            problems.append(f"{scene.get('id')}: meaning-bearing Reveal requires beatId")
            continue
        key = key_match.group(1)
        if key in timing["beats"]:
            expected = f'PROMOTION_TIMING["{key}"]'
            alternate = f"PROMOTION_TIMING['{key}']"
            if expected not in opening and alternate not in opening:
                problems.append(f"{scene.get('id')}/{key}: meaning-bearing Reveal must use speech-resolved PROMOTION_TIMING")
        elif key in timing["manual"]:
            reason = re.search(r"manualReason\s*=\s*[\"']([^\"']+)[\"']", opening)
            if not reason or len(reason.group(1).strip()) < 8:
                problems.append(f"{scene.get('id')}/{key}: manual reveal timing requires manualReason")
        else:
            problems.append(f"{scene.get('id')}/{key}: Reveal has no PLAN anchorPhrase or manual reason")
    return problems


def fresh_import_problems(root, video, source, text):
    if not text or not source.is_file():
        return []
    problems = []
    primitives = (pathlib.Path(root) / "src" / "primitives").resolve()
    per_video = state.video_paths(root, video)["source"].resolve()
    for raw in re.findall(r'(?:from\s+|import\s*)["\'](\.[^"\']+)["\']', text):
        base = (source.parent / raw).resolve()
        candidates = [pathlib.Path(str(base) + suffix) for suffix in
                      ("", ".js", ".jsx", ".ts", ".tsx", ".mjs")]
        resolved = next((item.resolve() for item in candidates if item.is_file()), base)
        allowed_generated = {per_video / "timing.js"}
        if not (str(resolved).startswith(str(primitives) + os.sep) or resolved in allowed_generated):
            problems.append(
                f"{source.name}: arbitrary per-video scene/helper module is outside the fresh "
                f"production import boundary (allowed: src/primitives, generated timing.js, "
                f"or external packages): {raw}")
    return problems


def previs_source_check(plan_path, plan, scene_id=None):
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    problems, checked = [], 0
    plan_closed, plan_receipt, _receipt = contracts.plan_is_closed(plan_path)
    if not plan_closed:
        problems.append(f"current approved semantic plan required before PREVIS authoring: {plan_receipt}")
    for scene in plan.get("scenes") or []:
        if scene_id and scene.get("id") != scene_id:
            continue
        source = scene_source(root, video, scene)
        if not source.is_file():
            # PLAN remains legal before PREVIS authoring.
            if contracts.scene_status_stage(scene.get("status")) == "PLAN":
                continue
            problems.append(f"{scene.get('id')}: production-compatible scene source missing: {source}")
            continue
        checked += 1
        try:
            text = source.read_text(encoding="utf-8")
        except OSError as exc:
            problems.append(f"{scene.get('id')}: source is unreadable: {exc}")
            continue
        problems += locked_asset_problems(root, video, scene, text)
        problems += promotion_timing_problems(plan_path, plan, scene, text)
        if plan.get("schemaVersion") == FRESH_SCHEMA:
            problems += fresh_import_problems(root, video, source, text)
            problems += fresh_source_integrity_problems(plan_path, plan, scene, text, plan_closed)
        for key in ("narrativeFunction", "viewerQuestion", "visualTransformation",
                    "contrastWithPrevious"):
            if not scene.get(key):
                problems.append(f"{scene.get('id')}: semantic PREVIS intent missing {key}")
        if not re.search(r"(?:export\s+(?:const|function)|export\s+default)", text):
            problems.append(f"{scene.get('id')}: scene JSX exports no production component")
    if scene_id and checked == 0 and not any(s.get("id") == scene_id for s in plan.get("scenes") or []):
        problems.append(f"no scene {scene_id!r} in plan")
    return problems, checked


def _manifest_frames(path, root):
    path = state.project_path(root, path)
    data = state.read_json(path, {})
    frames = {}
    for item in data.get("frames") or []:
        role = str(item.get("role") or "").upper()
        if role not in {"OPEN", "KEY", "MID"}:
            continue
        frames[(item.get("scene"), role)] = (state.project_path(root, item.get("path")), item)
    return data, frames


def _visual_signature(path):
    """Bounded structural signature proven on the historical PREVIS WIP."""
    import numpy as np

    image = Image.open(path).convert("RGB").resize((54, 96), Image.Resampling.LANCZOS)
    image = image.filter(ImageFilter.GaussianBlur(radius=0.7))
    rgb = np.asarray(image, dtype=np.float32) / 255.0
    lum = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
    norm = (lum - lum.mean()) / max(float(lum.std()), 0.08)
    gx = np.abs(np.diff(lum, axis=1, prepend=lum[:, :1]))
    gy = np.abs(np.diff(lum, axis=0, prepend=lum[:1, :]))
    mass = gx + gy + np.std(rgb, axis=2) * 0.35
    threshold = max(float(np.quantile(mass, 0.72)), 0.025)
    ys, xs = np.nonzero(mass >= threshold)
    if len(xs) == 0:
        centroid, bbox = (0.5, 0.5), (0.0, 0.0, 1.0, 1.0)
    else:
        weights = mass[ys, xs]
        centroid = (float(np.average(xs, weights=weights) / 53),
                    float(np.average(ys, weights=weights) / 95))
        bbox = (float(xs.min() / 53), float(ys.min() / 95),
                float(xs.max() / 53), float(ys.max() / 95))
    return norm, centroid, bbox


def compare_previs_pixels(approved, promoted):
    if Image is None:
        return {"passed": False, "reason": "Pillow is required for PREVIS pixel conformance"}
    try:
        import numpy as np
        before, base_centroid, base_bbox = _visual_signature(approved)
        after, current_centroid, current_bbox = _visual_signature(promoted)
    except (OSError, ValueError) as exc:
        return {"passed": False, "reason": f"unreadable frame: {exc}"}
    block_mae = float(np.mean(np.abs(before - after)))
    centroid = (((base_centroid[0] - current_centroid[0]) ** 2
                 + (base_centroid[1] - current_centroid[1]) ** 2) ** 0.5)
    bbox = max(abs(a - b) for a, b in zip(base_bbox, current_bbox))
    return {
        "passed": block_mae <= MAX_BLOCK_MAE and centroid <= MAX_CENTROID_DISPLACEMENT
                  and bbox <= MAX_BBOX_DISPLACEMENT,
        "blockMae": round(block_mae, 5), "centroidDisplacement": round(centroid, 5),
        "bboxDisplacement": round(bbox, 5),
    }


def previs_baseline_check(plan_path, plan, baseline_manifest, promoted_manifest):
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    base_data, baseline = _manifest_frames(baseline_manifest, root)
    promoted_data, promoted = _manifest_frames(promoted_manifest, root)
    problems, comparisons = [], []
    approval = state.read_json(state.video_paths(root, video)["receipts"] /
                               "previs-approved.json", {})
    approved_fingerprints = {item.get("scene"): item.get("fingerprint") for item in
                             (approval.get("metadata") or {}).get("sceneDependencies") or []}
    if not base_data.get("frames"):
        problems.append("approved baseline manifest contains no frame proofs")
    if promoted_data.get("scenes") is None and not promoted_data.get("frames"):
        problems.append("promoted manifest contains no selective conformance records")
    for scene in plan.get("scenes") or []:
        sid = scene.get("id")
        source = scene_source(root, video, scene)
        text = source.read_text(encoding="utf-8") if source.is_file() else ""
        problems += locked_asset_problems(root, video, scene, text)
        roles = ["OPEN", "KEY"] + (["MID"] if contracts.mid_required(scene) else [])
        scene_record = next((item for item in promoted_data.get("scenes") or []
                             if item.get("scene") == sid), {})
        current_fingerprint = state.scene_dependency_fingerprint(root, plan, scene, PIXEL_VERSION)
        approved_fingerprint = approved_fingerprints.get(sid)
        if not scene_record:
            problems.append(f"{sid}: selective conformance record missing")
        elif scene_record.get("currentFingerprint") != current_fingerprint or \
                scene_record.get("approvedFingerprint") != approved_fingerprint:
            problems.append(f"{sid}: selective conformance fingerprints are stale or dishonest")
        elif scene_record.get("status") == "reused" and current_fingerprint != approved_fingerprint:
            problems.append(f"{sid}: changed dependency cannot reuse approved baseline identity")
        elif scene_record.get("status") == "rendered" and current_fingerprint == approved_fingerprint:
            problems.append(f"{sid}: unchanged dependency should be explicitly reused, not rendered")
        elif scene_record.get("status") not in {"reused", "rendered"}:
            problems.append(f"{sid}: unknown selective conformance status {scene_record.get('status')!r}")
        for role in roles:
            before = baseline.get((sid, role))
            after = promoted.get((sid, role))
            if not before or not before[0].is_file():
                problems.append(f"{sid}/{role}: approved baseline frame missing")
                continue
            if scene_record.get("status") == "reused":
                comparisons.append({"scene": sid, "role": role, "approved": str(before[0]),
                                    "promoted": str(before[0]), "passed": True,
                                    "identity": "approved-baseline-reused",
                                    "sha256": state.hash_file(before[0])})
                continue
            if not after or not after[0].is_file():
                problems.append(f"{sid}/{role}: promoted comparison frame missing")
                continue
            if after[1].get("sha256") != state.hash_file(after[0]):
                problems.append(f"{sid}/{role}: promoted frame hash disagrees with selective manifest")
                continue
            result = compare_previs_pixels(before[0], after[0])
            comparisons.append({"scene": sid, "role": role, "approved": str(before[0]),
                                "promoted": str(after[0]), **result})
            if not result.get("passed"):
                problems.append(f"{sid}/{role}: approved-pixel drift {result}")
            approved_frame = role_frame(before[1])
            for asset in meaning_assets(scene):
                mount = asset_mount_frame(text, asset.get("src"))
                if mount is None:
                    continue
                if mount > approved_frame:
                    problems.append(
                        f"{sid}/{role}: approved element {pathlib.Path(str(asset.get('src'))).name} "
                        f"is absent at approved frame {approved_frame}; promoted source mounts it "
                        f"inside Sequence from={mount}. Keep it mounted and animate opacity/transform.")
    return problems, comparisons


def baseline_receipt_path(root, video):
    return state.video_paths(root, video)["receipts"] / "previs-conformance.json"


def baseline_inputs(plan_path, plan, baseline, promoted):
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    baseline_path = state.project_path(root, baseline)
    promoted_path = state.project_path(root, promoted)
    baseline_data = state.read_json(baseline_path, {})
    promoted_data = state.read_json(promoted_path, {})
    dependencies = [{"scene": scene.get("id"),
                     "fingerprint": state.scene_dependency_fingerprint(
                         root, plan, scene, PIXEL_VERSION)} for scene in plan.get("scenes") or []]
    return {"creativeApproval": state.json_input(
                state.video_paths(root, plan.get("video", "V"))["receipts"] / "previs-approved.json"),
            "baseline": state.json_input(baseline_path),
            "baselinePixels": [state.file_input(state.project_path(root, item.get("path")))
                               for item in baseline_data.get("frames") or []],
            "promoted": state.json_input(promoted_path),
            "sceneDependencies": dependencies}


def conformance_is_current(plan_path):
    plan_path = contracts.resolve_plan_path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    approval = state.read_json(paths["receipts"] / "previs-approved.json", {})
    baseline = (approval.get("metadata") or {}).get("approvalBaselineManifest")
    promoted = paths["promoted_previs_manifest"]
    receipt_path = baseline_receipt_path(root, plan.get("video", "V"))
    if not baseline:
        return False, receipt_path, {}
    inputs = baseline_inputs(plan_path, plan, baseline, promoted)
    tool = state.tool_identity(pathlib.Path(__file__), versions={"baseline": PIXEL_VERSION})
    current, receipt = state.receipt_current(receipt_path, "previs-conformance", inputs, tool, {},
                                             require_outputs=False)
    return current, receipt_path, receipt


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("plan")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--previs", action="store_true")
    mode.add_argument("--previs-baseline", action="store_true")
    ap.add_argument("--baseline-manifest")
    ap.add_argument("--promoted-manifest")
    ap.add_argument("--scene")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    plan_path = contracts.resolve_plan_path(args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    paths = state.video_paths(root, plan.get("video", "V"))
    comparisons = []
    if args.previs_baseline:
        current, _approval_path, approval = contracts.previs_is_closed(plan_path)
        if not current:
            problems = ["current human PREVIS approval is required before promoted conformance"]
        else:
            baseline = args.baseline_manifest or (approval.get("metadata") or {}).get(
                "approvalBaselineManifest")
            promoted = args.promoted_manifest or paths["promoted_previs_manifest"]
            problems, comparisons = previs_baseline_check(plan_path, plan, baseline, promoted)
            if not problems:
                inputs = baseline_inputs(plan_path, plan, baseline, promoted)
                tool = state.tool_identity(pathlib.Path(__file__), versions={"baseline": PIXEL_VERSION})
                reused = len({item["scene"] for item in comparisons
                              if item.get("identity") == "approved-baseline-reused"})
                rendered = len({item["scene"] for item in comparisons
                                if item.get("identity") != "approved-baseline-reused"})
                state.make_receipt(baseline_receipt_path(root, plan.get("video", "V")),
                                   "previs-conformance", inputs, tool, {}, outputs=(),
                                   metadata={"comparisons": comparisons,
                                             "reusedSceneCount": reused,
                                             "renderedSceneCount": rendered})
        checked = len(comparisons)
    else:
        problems, checked = previs_source_check(plan_path, plan, args.scene)

    if args.json:
        print(json.dumps({"passed": not problems, "checked": checked,
                          "problems": problems, "comparisons": comparisons}, indent=2))
    else:
        for problem in problems:
            print(f"FAIL {problem}")
        if not problems:
            label = "promoted PREVIS baseline" if args.previs_baseline else "bespoke PREVIS source"
            print(f"OK   {label}: {checked} check(s)")
        print(f"\n{'FAILED' if problems else 'PASSED'} ({len(problems)} problem(s))")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())