"""Small shared receipts, per-item caches, manifests, and economics telemetry.

Disk artifacts are pipeline memory.  This module deliberately has no daemon,
database, scheduler, or dependency outside the Python standard library.
"""

from __future__ import annotations

import contextlib
import datetime as dt
import hashlib
import json
import os
import pathlib
import time

SCHEMA = 1
SMALL_HASH_LIMIT = 8 * 1024 * 1024
SCENE_DEPENDENCY_VERSION = "scene-render-dependencies-v1"

ASSET_PLAN_IMPLEMENTATION_FIELDS = {
    "src", "locked", "lockedSha256", "lockedAt", "selectionRationale",
    "provenance", "license", "retrievedAt",
    "processing", "processingKind", "processingMetadata", "processingReceipt",
    "processedFile", "processingState", "generatedPath", "generationId",
    "lineagePath", "outputPath", "sourcePath", "requiresCutout",
    "width", "height", "x", "y", "top", "right", "bottom", "left", "slot",
    "crop", "fit", "scale", "rotation", "opacity", "zIndex", "style", "transform",
    "delay", "from", "to", "visibleFor", "entranceTiming", "easing",
}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def hash_file(path, chunk=1024 * 1024):
    path = pathlib.Path(path)
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            data = fh.read(chunk)
            if not data:
                break
            h.update(data)
    return h.hexdigest()


def file_input(path):
    """Content identity for a true input; filenames and mtimes are insufficient."""
    path = pathlib.Path(path)
    if not path.is_file():
        return {"path": str(path), "missing": True}
    stat = path.stat()
    return {"path": str(path), "size": stat.st_size, "sha256": hash_file(path)}


def json_input(path):
    path = pathlib.Path(path)
    if not path.is_file():
        return {"path": str(path), "missing": True}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return file_input(path)
    return {"path": str(path), "normalizedSha256": digest(value)}


def output_proof(path):
    """Creation proof. Large outputs avoid repeated full hashing on every Stop."""
    path = pathlib.Path(path)
    if not path.is_file():
        return {"path": str(path), "missing": True}
    stat = path.stat()
    proof = {"path": str(path), "size": stat.st_size, "mtimeNs": stat.st_mtime_ns}
    if stat.st_size <= SMALL_HASH_LIMIT:
        proof["sha256"] = hash_file(path)
    return proof


def output_current(proof):
    path = pathlib.Path(proof.get("path", ""))
    if not path.is_file() or proof.get("missing"):
        return False
    stat = path.stat()
    if stat.st_size != proof.get("size"):
        return False
    if "sha256" in proof:
        return hash_file(path) == proof["sha256"]
    return stat.st_mtime_ns == proof.get("mtimeNs")


def tool_identity(*paths, versions=None):
    return {
        "files": [file_input(p) for p in paths],
        "versions": versions or {},
    }


def receipt_id(stage, inputs, tool, parameters):
    return digest({"stage": stage, "inputs": inputs, "tool": tool,
                   "parameters": parameters})


def read_json(path, default=None):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {} if default is None else default


def write_json(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, path)


def make_receipt(path, stage, inputs, tool, parameters, outputs=(), status="CLOSED",
                 accepted=None, metadata=None):
    rid = receipt_id(stage, inputs, tool, parameters)
    value = {
        "schema": SCHEMA, "stage": stage, "receiptId": rid,
        "inputs": inputs, "tool": tool, "parameters": parameters,
        "outputs": [output_proof(p) for p in outputs], "status": status,
        "accepted": accepted,
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    if metadata:
        value["metadata"] = metadata
    write_json(path, value)
    return value


def receipt_current(path, stage, inputs, tool, parameters, require_outputs=True):
    value = read_json(path, {})
    expected = receipt_id(stage, inputs, tool, parameters)
    if value.get("status") != "CLOSED" or value.get("receiptId") != expected:
        return False, value
    proofs = value.get("outputs") or []
    if require_outputs and not proofs:
        return False, value
    return all(output_current(p) for p in proofs), value


def project_root(path):
    path = pathlib.Path(path).resolve()
    for cand in (path, *path.parents):
        if (cand / "package.json").is_file() and (cand / "input").is_dir():
            return cand
    return pathlib.Path.cwd().resolve()


def normalize_video(video):
    """Return the stable ``V<N>`` identity used by every on-disk artifact."""
    value = str(video or "V").strip()
    return f"V{value[1:]}" if value[:1].lower() == "v" else f"V{value}"


def video_paths(root, video):
    """Canonical per-video paths.

    Consumers may still accept an arbitrary authoritative plan path, but derived
    artifacts never depend on string replacement or the caller's working
    directory.  Keep this map small and mechanical: it is the one source of
    truth for pipeline state, generated registration, review, and render paths.
    """
    root = pathlib.Path(root).resolve()
    video = normalize_video(video)
    input_root = root / "input"
    input_dir = input_root / video
    public_dir = root / "public" / video
    source_dir = root / "src" / "videos" / video
    output_dir = root / "out" / video
    previs_dir = input_dir / "previs"
    review_dir = output_dir / "review"
    runtime = input_root / ".videoagent" / video
    receipts = runtime / "receipts"
    return {
        "root": root,
        "input": input_dir,
        "plan": input_dir / "scene_plan.json",
        "transcript": input_dir / "transcript.json",
        "words": input_dir / "words_aligned.json",
        "asset_manifest": input_dir / "asset_manifest.json",
        "review": input_dir / "review.json",
        "previs": previs_dir,
        "previs_frames": previs_dir / "frames",
        "previs_manifest": previs_dir / "frames_manifest.json",
        "previs_review_pages": previs_dir / "review_pages",
        "promoted_previs_frames": previs_dir / "promoted_frames",
        "promoted_previs_manifest": previs_dir / "promoted_frames_manifest.json",
        "contact_sheet": previs_dir / "contact_sheet.png",
        "public": public_dir,
        "audio": public_dir / "audio.mp3",
        "assets": public_dir / "assets",
        "output": output_dir,
        "review_dir": review_dir,
        "review_frames": review_dir / "frames",
        "temporal_sheet": review_dir / "contact_sheet.jpg",
        "scene_summary_sheet": review_dir / "scene_summary_sheet.jpg",
        "review_pages": review_dir / "pages",
        "targeted_review": review_dir / "targeted_full_res",
        "source": source_dir,
        "scenes": source_dir / "scenes",
        "master": source_dir / "Master.jsx",
        "captions": source_dir / "captions.js",
        "shared": source_dir / "shared.jsx",
        "timing": source_dir / "timing.js",
        "runtime": runtime,
        "receipts": receipts,
        "gate_receipts": receipts / "gates",
        "gate_details": runtime / "gate-details",
        "cache": runtime / "cache",
        "logs": runtime / "logs",
        "economics": runtime / "economics.jsonl",
        "previs_root": root / "src" / "PrevisRoot.tsx",
        "entry": root / "src" / "index.ts",
        "draft": output_dir / "draft" / "master.mp4",
        "final": output_dir / "final" / "master.mp4",
    }


def legacy_video_paths(root, video):
    """Read-only compatibility paths for shipped fixtures; never write new work here."""
    root = pathlib.Path(root).resolve()
    video = normalize_video(video)
    suffix = video[1:]
    return {
        "plan": root / "input" / f"scene_plan{suffix}.json",
        "transcript": root / "input" / f"transcript{suffix}.json",
        "words": root / "input" / f"words{suffix}_aligned.json",
        "asset_manifest": root / "input" / f"asset_manifest{suffix}.json",
        "review": root / "input" / f"review{suffix}.json",
        "public": root / "public",
        "assets": root / "public",
        "audio": root / "public" / f"audio{suffix}.mp3",
        "source": root / "src",
        "scenes": root / "src" / "scenes",
        "master": root / "src" / f"{video}Master.jsx",
    }


def existing_or_canonical(root, video, key):
    """Prefer canonical layout, with legacy reads only for historical fixtures."""
    canonical_path = video_paths(root, video)[key]
    if canonical_path.exists():
        return canonical_path
    return legacy_video_paths(root, video).get(key, canonical_path)


def scene_stem(scene_id):
    value = str(scene_id or "S").strip()
    suffix = value[1:] if value[:1].upper() == "S" else value
    return f"S{int(suffix):02d}" if suffix.isdigit() else f"S{suffix}"


def scene_source(root, video, scene_id, compatibility=True):
    paths = video_paths(root, video)
    canonical_path = paths["scenes"] / f"{scene_stem(scene_id)}.jsx"
    if canonical_path.is_file() or not compatibility:
        return canonical_path
    suffix = str(scene_id or "S").lstrip("Ss")
    return legacy_video_paths(root, video)["scenes"] / f"{normalize_video(video)}Scene{suffix}.jsx"


def words_path(root, plan):
    video = plan.get("video", "V")
    canonical_path = video_paths(root, video)["words"]
    raw = plan.get("wordsFile")
    if raw:
        supplied = project_path(root, raw)
        if supplied.is_file():
            return supplied
    return canonical_path if canonical_path.exists() else existing_or_canonical(root, video, "words")


def asset_path(root, video, src):
    """Meaning-bearing assets live in public/V<N>/assets; legacy reads remain possible."""
    raw = pathlib.Path(str(src or "").replace("\\", "/"))
    paths = video_paths(root, video)
    candidates = [paths["assets"] / raw.name, paths["public"] / raw,
                  pathlib.Path(root) / "public" / raw]
    return next((path.resolve() for path in candidates if path.is_file()), candidates[0].resolve())


def asset_requires_cutout(asset, manifest=None):
    """Cutout processing is explicit/recorded; visual role alone is never a signal."""
    if asset.get("requiresCutout") is True:
        return True
    src = pathlib.Path(str(asset.get("src") or "")).name
    if not src:
        return False
    for key, item in ((manifest or {}).get("assets") or {}).items():
        processed = pathlib.Path(str((item.get("processedFile") or {}).get("path") or "")).name
        source_key = str(key).replace("\\", "/").split("/")[-1]
        recorded = item.get("processingKind") == "cutout" or bool(item.get("processingReceipt"))
        if recorded and (processed == src or source_key == f"SOURCE:{src}"):
            return True
    return False


def audio_path(root, plan):
    video = plan.get("video", "V")
    paths = video_paths(root, video)
    raw = plan.get("audioFile")
    if raw:
        candidates = [paths["public"] / pathlib.Path(str(raw)).name,
                      pathlib.Path(root) / "public" / str(raw)]
        found = next((path for path in candidates if path.is_file()), None)
        if found:
            return found.resolve()
    return paths["audio"]


def static_asset_name(video, src):
    return f"{normalize_video(video)}/assets/{pathlib.Path(str(src)).name}"


def scene_duration(scene, fps):
    """Canonical mechanical timing: PLAN never authors duration frames."""
    return max(1, int(round((float(scene.get("endSec", 0)) -
                             float(scene.get("startSec", 0))) * int(fps))))


def scene_materials(scene):
    """Fresh plans use ``materials``; ``assets`` remains read-only compatibility."""
    value = scene.get("materials")
    return value if isinstance(value, list) else (scene.get("assets") or [])


def local_dependency_files(seeds):
    """Follow the local JS/TS graph without introducing a bundler dependency."""
    import re
    found, todo = set(), [pathlib.Path(path).resolve() for path in seeds]
    pattern = re.compile(r'(?:from\s+|import\s*)["\'](\.[^"\']+)["\']')
    extensions = ("", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".json")
    while todo:
        path = todo.pop()
        if path in found or not path.is_file():
            continue
        found.add(path)
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for raw in pattern.findall(text):
            base = (path.parent / raw).resolve()
            candidates = [pathlib.Path(str(base) + ext) for ext in extensions]
            candidates += [base / f"index{ext}" for ext in extensions[1:]]
            child = next((item for item in candidates if item.is_file()), None)
            if child and child not in found:
                todo.append(child)
    return sorted(found, key=str)


def scene_dependency_contract(root, plan, scene, pixel_tool_version):
    """All known dependencies capable of changing one scene's approved pixels."""
    root = pathlib.Path(root).resolve()
    video = plan.get("video", "V")
    source = scene_source(root, video, scene.get("id"))
    sources = local_dependency_files([source])
    materials = []
    for material in scene_materials(scene):
        if material.get("src"):
            path = asset_path(root, video, material["src"])
            materials.append({"id": material.get("id") or material.get("name"),
                              "declaredSha256": material.get("lockedSha256"),
                              "file": file_input(path)})
    font_lines = []
    for path in sources:
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                if "loadFont" in line or "fontFamily" in line:
                    font_lines.append(f"{path.name}:{line.strip()}")
        except (OSError, UnicodeDecodeError):
            pass
    global_sources = [root / "src" / "index.ts", root / "src" / "PrevisRoot.tsx",
                      root / "src" / "primitives" / "LayoutSafety.jsx"]
    font_files = sorted((path for path in (root / "public").rglob("*")
                         if path.is_file() and path.suffix.lower() in
                         {".woff", ".woff2", ".ttf", ".otf"}), key=str)
    return {
        "version": SCENE_DEPENDENCY_VERSION,
        "scene": scene.get("id"),
        "sources": [file_input(path) for path in sources],
        "globalSources": [file_input(path) for path in global_sources],
        "lockedAssets": materials,
        "render": {"fps": int(plan.get("fps", 30)), "width": int(plan.get("width", 1080)),
                   "height": int(plan.get("height", 1920)),
                   "durationInFrames": scene_duration(scene, plan.get("fps", 30)),
                   "config": file_input(root / "remotion.config.ts"),
                   "package": json_input(root / "package.json"),
                   "lock": json_input(root / "package-lock.json")},
        "fontIdentity": {"declarations": sorted(font_lines),
                         "files": [file_input(path) for path in font_files],
                         "metrics": file_input(root / ".claude" / "skills" /
                                               "vox-collage-video" / "data" /
                                               "font_metrics.json")},
        "pixelConformanceToolVersion": pixel_tool_version,
    }


def scene_dependency_fingerprint(root, plan, scene, pixel_tool_version):
    return digest(scene_dependency_contract(root, plan, scene, pixel_tool_version))


def project_path(root, path):
    """Resolve a caller-supplied artifact path against the project, never CWD."""
    candidate = pathlib.Path(str(path).replace("\\", "/"))
    return candidate.resolve() if candidate.is_absolute() else (pathlib.Path(root) / candidate).resolve()


def runtime_dir(root, video):
    """Compatibility wrapper; new consumers should use :func:`video_paths`."""
    return video_paths(root, video)["runtime"]


def item_cache_path(root, video, family, key):
    return runtime_dir(root, video) / "cache" / family / f"{key}.json"


def cache_get(root, video, family, key):
    value = read_json(item_cache_path(root, video, family, key), {})
    return value.get("result") if value.get("key") == key else None


def cache_put(root, video, family, key, result, metadata=None):
    write_json(item_cache_path(root, video, family, key), {
        "schema": SCHEMA, "key": key, "result": result,
        "metadata": metadata or {},
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
    })


def plan_contract(plan, plan_path):
    """Semantic editorial inputs; implementation timing and workflow state are excluded."""
    ignored_top = {"status", "shotlistApproved", "_howToUse", "planReceiptId"}
    ignored_scene = {
        "status", "durationInFrames", "masterStartFrame",
        "transitionIn", "transitionOut", "transitionTiming", "entranceTiming", "easing",
    }
    clean = {k: v for k, v in plan.items() if k not in ignored_top and k != "scenes"}
    clean_scenes = []
    for scene in plan.get("scenes") or []:
        item = {k: v for k, v in scene.items() if k not in ignored_scene}
        if "visualEvents" in item:
            item["visualEvents"] = [
                {k: v for k, v in event.items()
                 if k not in {"frame", "from", "to", "durationInFrames", "easing"}}
                for event in item.get("visualEvents") or []
            ]
        for key in ("assets", "materials"):
            if key in item:
                item[key] = [
                    {k: v for k, v in asset.items()
                     if k not in ASSET_PLAN_IMPLEMENTATION_FIELDS}
                    for asset in item.get(key) or []
                ]
        if isinstance(item.get("punch"), dict):
            item["punch"] = {k: v for k, v in item["punch"].items()
                             if k not in {"from", "to", "visibleFor", "easing"}}
        clean_scenes.append(item)
    clean["scenes"] = clean_scenes
    root = project_root(plan_path)
    words = words_path(root, plan)
    sources = []
    raw_sources = plan.get("sourceAuthority") or plan.get("sourceAuthorities") or []
    if isinstance(raw_sources, str):
        raw_sources = [raw_sources]
    for raw in raw_sources:
        source = pathlib.Path(raw)
        source = source if source.is_absolute() else root / source
        sources.append(file_input(source))
    return {"plan": clean, "alignedWords": json_input(words), "sources": sources}


def plan_slice(plan, fields=(), scene_fields=(), scene_ids=None):
    """Small normalized plan contract for one consumer, never the raw plan file."""
    wanted = set(scene_ids or [])
    scenes = []
    for scene in plan.get("scenes") or []:
        if wanted and scene.get("id") not in wanted:
            continue
        scenes.append({key: scene.get(key) for key in scene_fields if key in scene})
    result = {key: plan.get(key) for key in fields if key in plan}
    if scene_fields:
        result["scenes"] = scenes
    return result


def manifest_path_for_plan(plan_path, plan):
    """Compatibility wrapper over the canonical per-video path map."""
    plan_path = pathlib.Path(plan_path)
    video = plan.get("video") or plan_path.stem.replace("scene_plan", "V")
    return video_paths(project_root(plan_path), video)["asset_manifest"]


def review_path_for_plan(plan_path, plan=None):
    """Canonical review artifact for an authoritative plan."""
    plan_path = pathlib.Path(plan_path)
    plan = plan if plan is not None else read_json(plan_path, {})
    video = plan.get("video") or plan_path.stem.replace("scene_plan", "V")
    return video_paths(project_root(plan_path), video)["review"]


def asset_contract(scene, asset):
    return {"scene": scene.get("id"), "id": asset.get("id"), "name": asset.get("name"),
            "src": asset.get("src"), "role": asset.get("role"),
            "describes": asset.get("describes") or [],
            "anchorPhrase": asset.get("anchorPhrase"), "slot": asset.get("slot"),
            "visualTransformation": scene.get("visualTransformation"),
            "materialIntent": asset.get("materialIntent"),
            "mediaBrief": asset.get("mediaBrief"),
            "provenance": asset.get("provenance"), "license": asset.get("license"),
            "retrievedAt": asset.get("retrievedAt"),
            "evidenceIdentity": asset.get("evidenceIdentity"),
            "evidenceRegions": asset.get("evidenceRegions") or [],
            "mapDataIdentity": asset.get("mapDataIdentity"),
            "numericData": asset.get("numericData"), "dataSource": asset.get("dataSource"),
            "reconstructionLabel": asset.get("reconstructionLabel"),
            "diagramJustification": asset.get("diagramJustification"),
            "generationId": asset.get("generationId")}


def asset_usage_id(scene, asset):
    return f"{scene.get('id', '?')}:{asset.get('id') or asset.get('name') or asset.get('src', '?')}"


def update_manifest(path, video, asset_id, patch, identity=None):
    manifest = read_json(path, {"schema": SCHEMA, "video": video, "assets": {}})
    manifest.setdefault("schema", SCHEMA)
    manifest.setdefault("video", video)
    assets = manifest.setdefault("assets", {})
    old = assets.get(asset_id, {})
    if identity is not None and old.get("identity") != identity:
        kept = {}
        prior_processed = (old.get("processedFile") or {}).get("sha256")
        current_source = (patch.get("sourceFile") or {}).get("sha256")
        if prior_processed and prior_processed == current_source:
            kept = {k: old[k] for k in ("processingReceipt", "processedFile") if k in old}
        old = {"identity": identity, "acceptance": "PENDING", **kept}
    old.update(patch)
    old["updatedAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
    assets[asset_id] = old
    write_json(path, manifest)
    return old


def sync_asset_manifest(plan_path):
    """Bind manifest identity to selected bytes + semantic brief."""
    plan_path = pathlib.Path(plan_path).resolve()
    plan = read_json(plan_path, {})
    root = project_root(plan_path)
    manifest_path = manifest_path_for_plan(plan_path, plan)
    existing = read_json(manifest_path, {"schema": SCHEMA, "video": plan.get("video"),
                                         "assets": {}})
    for scene in plan.get("scenes") or []:
        for material in scene_materials(scene):
            if not material.get("src"):
                continue
            path = asset_path(root, plan.get("video", "V"), material["src"])
            brief = asset_contract(scene, material)
            identity = digest({"file": file_input(path), "brief": brief})
            update_manifest(manifest_path, plan.get("video"), asset_usage_id(scene, material),
                            {"sourceFile": file_input(path), "brief": brief,
                             "briefId": digest(brief)}, identity)
    return manifest_path, read_json(manifest_path, existing)


def accept_asset(plan_path, asset_id, advisory=None):
    manifest_path, manifest = sync_asset_manifest(plan_path)
    item = (manifest.get("assets") or {}).get(asset_id)
    if not item:
        raise ValueError(f"unknown asset usage: {asset_id}")
    acceptance = "ACCEPTED_WITH_ADVISORY" if advisory else "ACCEPTED"
    update_manifest(manifest_path, manifest.get("video"), asset_id,
                    {"acceptance": acceptance, "advisory": advisory or ""},
                    item.get("identity"))
    return manifest_path


def find_generation(root, file_proof):
    wanted = file_proof.get("sha256")
    if not wanted:
        return None, None
    for path in sorted((pathlib.Path(root) / "input").glob("asset_lineage*.json")):
        data = read_json(path, {})
        for gid, entry in (data.get("generations") or {}).items():
            if any(item.get("sha256") == wanted for item in
                   entry.get("actualReturnedFiles") or []):
                return path, gid
    return None, None


def update_generation(root, generation_id, patch):
    if not generation_id:
        return None
    for path in sorted((pathlib.Path(root) / "input").glob("asset_lineage*.json")):
        data = read_json(path, {})
        entry = (data.get("generations") or {}).get(generation_id)
        if entry is not None:
            entry.update(patch)
            data["generations"][generation_id] = entry
            write_json(path, data)
            return path
    return None


def update_generation_usage(root, generation_id, usage_id, patch):
    if not generation_id:
        return None
    for path in sorted((pathlib.Path(root) / "input").glob("asset_lineage*.json")):
        data = read_json(path, {})
        entry = (data.get("generations") or {}).get(generation_id)
        if entry is not None:
            entry.setdefault("qaByUsage", {})[usage_id] = patch
            data["generations"][generation_id] = entry
            write_json(path, data)
            return path
    return None


def compact_result(status, hard=0, advisory=0, changed=(), questions=(), details=None,
                   receipt=None):
    lines = [f"STATUS: {status}", f"HARD: {hard}", f"ADVISORY: {advisory}"]
    lines.append("CHANGED ARTIFACTS: " + (", ".join(map(str, changed)) if changed else "none"))
    lines.append("UNRESOLVED EDITORIAL QUESTIONS: " +
                 ("; ".join(questions) if questions else "none"))
    if details:
        lines.append(f"DETAILS: {details}")
    if receipt:
        rid = receipt.get("receiptId") if isinstance(receipt, dict) else str(receipt)
        lines.append(f"RECEIPT: {rid}")
    return "\n".join(lines)


def append_telemetry(root, video, record):
    path = runtime_dir(root, video) / "economics.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    safe = {
        "schema": SCHEMA, "video": video,
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
        "mainTokens": "UNKNOWN", "context": "UNKNOWN",
    }
    allowed = {"stage", "owner", "elapsedMs", "cache", "subprocessCount",
               "affectedItems", "output", "outputSize", "visionCalls",
               "visionTokens", "renderMode", "renderParameters", "receiptId",
               "mode", "sceneCount", "requestedStateCount",
               "renderWallMs", "contactSheetAssemblyMs", "outputIdentity",
               "wallMs", "imageReadCount", "candidateCount", "sourceScoutInvocations",
               "sourceScoutRetries", "reusedSceneCount", "renderedSceneCount",
               "reviewSampleCount", "reviewBatchCount", "reviewPageCount"}
    safe.update({k: v for k, v in record.items() if k in allowed})
    if "elapsedMs" in safe:
        safe.setdefault("wallMs", safe["elapsedMs"])
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(safe, ensure_ascii=False, separators=(",", ":")) + "\n")
    return path


@contextlib.contextmanager
def timed_stage(root, video, stage, owner="script", **fields):
    start = time.perf_counter()
    record = {"stage": stage, "owner": owner, **fields}
    try:
        yield record
    finally:
        record["elapsedMs"] = round((time.perf_counter() - start) * 1000, 2)
        append_telemetry(root, video, record)