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


def runtime_dir(root, video):
    return pathlib.Path(root) / "input" / ".videoagent" / str(video)


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
    """Editorial true inputs; workflow/review state changes do not reopen a plan."""
    ignored_top = {"status", "shotlistApproved", "_howToUse"}
    ignored_scene = {"status"}
    clean = {k: v for k, v in plan.items() if k not in ignored_top and k != "scenes"}
    clean["scenes"] = [
        {k: v for k, v in scene.items() if k not in ignored_scene}
        for scene in plan.get("scenes") or []
    ]
    root = project_root(plan_path)
    words = root / str(plan.get("wordsFile") or "")
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
    video = str(plan.get("video") or pathlib.Path(plan_path).stem.replace("scene_plan", "V"))
    return pathlib.Path(plan_path).parent / f"asset_manifest{video.lstrip('Vv')}.json"


def asset_contract(scene, asset):
    return {"scene": scene.get("id"), "name": asset.get("name"),
            "src": asset.get("src"), "role": asset.get("role"),
            "describes": asset.get("describes") or [],
            "anchorPhrase": asset.get("anchorPhrase"), "slot": asset.get("slot"),
            "visualTransformation": scene.get("visualTransformation"),
            "template": scene.get("template"),
            "generationId": asset.get("generationId")}


def asset_usage_id(scene, asset):
    return f"{scene.get('id', '?')}:{asset.get('name') or asset.get('src', '?')}"


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
        "mainTokens": "UNKNOWN",
    }
    allowed = {"stage", "owner", "elapsedMs", "cache", "subprocessCount",
               "affectedItems", "output", "outputSize", "visionCalls",
               "visionTokens", "renderMode", "renderParameters", "receiptId",
               "mainTokens"}
    safe.update({k: v for k, v in record.items() if k in allowed})
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