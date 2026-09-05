"""Bounded Pexels PHOTO discovery with an external Gemini semantic worker.

``list`` and ``get`` retain the small legacy-compatible interface. ``scout``
stores previews, compact search state, shortlist originals, and sourcing
evidence only below ``input/.videoagent/V<N>/candidates/<needId>/``. It never
writes a production asset or accepts one.

The API key is read only from ``PEXELS_API_KEY`` in the environment or an
ignored/untracked ``.env`` searched upward from this script. It is never
printed or persisted.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import sys
import time

import requests

import stage_state as state
import vision_check as vision

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"
MAX_CANDIDATES = 8
MAX_SEARCHES = 2
MAX_REFINEMENTS = 1
MAX_SHORTLIST = 3
MAX_PACKET_BYTES = 2048
WORKER_CONTRACT_VERSION = "pexels-photo-gemini-worker-v2"
QUERY_PROMPT_VERSION = "pexels-query-v1"
VISION_PROMPT_VERSION = "pexels-candidate-vision-v1"
MISSING_KEY_STATUS = "PEXELS_RUNTIME = NOT READY — API KEY MISSING"
GEMINI_WORKER_BLOCK = "BLOCKED — GEMINI_CHEAP_WORKER_NOT_AVAILABLE"
VISUAL_TRIAGE_BLOCK = "BLOCKED — PEXELS_VISUAL_TRIAGE_NOT_AVAILABLE"
UNKNOWN = "UNKNOWN"
PACKET_FIELDS = {
    "needId", "sceneId", "anchorPhrase", "mediaBrief", "materialIntent",
    "shortCaseFacts", "styleContract", "orientation",
}
RETURN_FIELDS = {
    "needId", "sceneId", "workerMode", "actualWorkerModel",
    "parentContextInherited", "router", "geminiModel", "geminiCallCount",
    "geminiQueryCalls", "geminiVisionCalls", "geminiInputTokens",
    "geminiOutputTokens", "geminiTotalTokens", "geminiWallSec",
    "pexelsQueryCount", "candidateCount", "thumbnailDownloads",
    "originalDownloads", "shortlistCount", "rejectedCount", "visualTriage",
    "refinementCount", "workerWallSec", "shortlist",
}
SHORTLIST_FIELDS = {
    "pexelsId", "localOriginalPath", "localThumbPath", "pageUrl", "photographer",
    "width", "height", "briefMatchNote", "provenance", "license", "retrievedAt",
}


def tracked_by_git(path):
    path = pathlib.Path(path).resolve()
    for parent in [path.parent, *path.parents]:
        if not (parent / ".git").exists():
            continue
        try:
            relative = path.relative_to(parent)
            check = subprocess.run(
                ["git", "-C", str(parent), "ls-files", "--error-unmatch", "--", str(relative)],
                capture_output=True, text=True, timeout=5)
            return check.returncode == 0
        except (OSError, ValueError, subprocess.SubprocessError):
            return False
    return False


def load_api_key(environ=None, start=None):
    environment = os.environ if environ is None else environ
    key = str(environment.get("PEXELS_API_KEY", "")).strip()
    if key:
        return key
    here = pathlib.Path(start or __file__).resolve()
    directory = here if here.is_dir() else here.parent
    parents = [directory] if start is not None else [directory, *directory.parents]
    for parent in parents:
        env_path = parent / ".env"
        if env_path.is_file() and not tracked_by_git(env_path):
            for line in env_path.read_text(encoding="utf-8").splitlines():
                match = re.match(r"^\s*(?:export\s+)?PEXELS_API_KEY\s*=\s*(.*?)\s*$", line)
                if match:
                    key = match.group(1).strip().strip('"\'')
                    if key:
                        return key
    raise RuntimeError(MISSING_KEY_STATUS)


def bounded_count(value):
    return max(1, min(MAX_CANDIDATES, int(value)))


def retrieved_now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def photo_orientation(width, height):
    if width == height:
        return "square"
    return "landscape" if width > height else "portrait"


def candidate(photo, retrieved_at=None, local_path=None):
    """Normalize one Pexels PHOTO response without retaining its raw payload."""
    width, height = int(photo["width"]), int(photo["height"])
    src = photo.get("src") or {}
    page_url = str(photo["url"])
    result = {
        "provider": "pexels",
        "mediaType": "photo",
        "pexelsId": int(photo["id"]),
        "photographer": str(photo.get("photographer") or ""),
        "pageUrl": page_url,
        "previewUrl": str(src.get("medium") or src.get("small") or ""),
        "downloadUrl": str(src.get("original") or src.get("large2x") or ""),
        "width": width,
        "height": height,
        "orientation": photo_orientation(width, height),
        "retrievedAt": retrieved_at or retrieved_now(),
        "provenance": page_url,
        "license": "Pexels License",
    }
    if local_path is not None:
        result["localPath"] = str(pathlib.Path(local_path))
    return result


def search(query, orientation="portrait", per_page=MAX_CANDIDATES,
           api_key=None, get=requests.get):
    count = bounded_count(per_page)
    headers = {"Authorization": api_key or load_api_key()}
    params = {"query": query, "orientation": orientation, "per_page": count}
    response = get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=20)
    response.raise_for_status()
    stamp = retrieved_now()
    return [candidate(photo, stamp) for photo in response.json().get("photos", [])[:count]]


def compact_json_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def write_compact_json(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(compact_json_bytes(value) + b"\n")
    os.replace(temporary, path)


def validate_need_packet(packet):
    if not isinstance(packet, dict):
        raise ValueError("Source Scout need packet must be one compact JSON object")
    unknown = set(packet) - PACKET_FIELDS
    missing = PACKET_FIELDS - set(packet)
    if unknown or missing:
        raise ValueError(f"Source Scout need packet fields differ: missing={sorted(missing)} unknown={sorted(unknown)}")
    if len(compact_json_bytes(packet)) > MAX_PACKET_BYTES:
        raise ValueError(f"Source Scout need packet exceeds {MAX_PACKET_BYTES} bytes")
    for key in ("needId", "sceneId", "anchorPhrase", "mediaBrief", "materialIntent"):
        if not isinstance(packet.get(key), str) or not packet[key].strip():
            raise ValueError(f"Source Scout need packet requires non-empty {key}")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", packet["needId"]):
        raise ValueError("needId must be a compact path-safe identifier")
    if not isinstance(packet["shortCaseFacts"], (str, list, dict)):
        raise ValueError("shortCaseFacts must be compact text, an array, or an object")
    if not isinstance(packet["styleContract"], (str, list, dict)):
        raise ValueError("styleContract must be compact text, an array, or an object")
    if packet["orientation"] not in {"landscape", "portrait", "square"}:
        raise ValueError("orientation must be landscape, portrait, or square")
    return packet


def prompt_need(packet):
    """The complete and only editorial context sent to the external worker."""
    return {key: packet[key] for key in sorted(PACKET_FIELDS)}


def query_prompt(packet, refined=False):
    need = json.dumps(prompt_need(validate_need_packet(packet)), ensure_ascii=False,
                      sort_keys=True, separators=(",", ":"))
    refinement = (" This is the only refinement: the initial search produced no "
                  "sufficiently relevant candidate." if refined else "")
    return (
        "Formulate one concise Pexels PHOTO search query for the semantic visual need below. "
        "Optimize for visible subject/place/object meaning rather than repeating narration."
        f"{refinement} Return exactly one JSON object with exactly one string field: "
        '{"query":"..."}. No markdown or explanation.\nNEED=' + need)


def parse_query_result(value):
    if (not isinstance(value, dict) or set(value) != {"query"}
            or not isinstance(value.get("query"), str) or not value["query"].strip()):
        raise RuntimeError(GEMINI_WORKER_BLOCK + " — strict query JSON unavailable")
    return value["query"].strip()


def candidate_vision_prompt(packet, pexels_id):
    need = prompt_need(validate_need_packet(packet))
    compact = {
        "pexelsId": int(pexels_id),
        "mediaBrief": need["mediaBrief"],
        "materialIntent": need["materialIntent"],
        "shortCaseFacts": need["shortCaseFacts"],
        "styleContract": need["styleContract"],
        "orientation": need["orientation"],
    }
    return (
        "Judge this one Pexels PHOTO thumbnail against the compact visual need. Consider "
        "semantic and subject/place/object specificity, generic filler risk, composition, "
        "framing, requested-orientation crop usefulness, apparent source quality, style and "
        "treatment usefulness, and obvious unwanted text or watermark contamination. "
        f'Return exactly one JSON object with exactly: {{"pexelsId":{int(pexels_id)},'
        '"useful":true,"fitScore":0,"briefMatchNote":"short note"}. '
        "fitScore must be an integer from 0 through 100; useful must be boolean; keep the note "
        "under 160 characters. No markdown, explanation, or reasoning trace.\nNEED=" +
        json.dumps(compact, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def parse_candidate_judgment(value, pexels_id, thumb_sha256):
    valid = (isinstance(value, dict)
             and set(value) == {"pexelsId", "useful", "fitScore", "briefMatchNote"}
             and value.get("pexelsId") == int(pexels_id)
             and isinstance(value.get("useful"), bool)
             and isinstance(value.get("fitScore"), int)
             and not isinstance(value.get("fitScore"), bool)
             and 0 <= value["fitScore"] <= 100
             and isinstance(value.get("briefMatchNote"), str))
    if not valid:
        return {"pexelsId": int(pexels_id), "thumbSha256": thumb_sha256,
                "useful": False, "fitScore": 0, "briefMatchNote": "invalid Gemini judgment"}
    return {"pexelsId": int(pexels_id), "thumbSha256": thumb_sha256,
            "useful": value["useful"], "fitScore": value["fitScore"],
            "briefMatchNote": value["briefMatchNote"].strip()[:160]}


def candidate_vision_cache_key(path, packet, model, pexels_id=None):
    prompt = candidate_vision_prompt(packet, 0)
    return state.digest({
        "file": state.file_input(path), "pexelsId": pexels_id,
        "semanticNeed": prompt_need(packet),
        "prompt": prompt, "promptVersion": VISION_PROMPT_VERSION, "model": model,
        "implementation": [state.file_input(pathlib.Path(__file__)),
                           state.file_input(pathlib.Path(vision.__file__))],
    })


def record_gemini_call(runtime, metadata, kind):
    attempts = max(1, int((metadata or {}).get("requestCount") or 1))
    runtime["geminiCallCount"] += attempts
    runtime["geminiQueryCalls" if kind == "query" else "geminiVisionCalls"] += attempts
    runtime["geminiWallSec"] = round(
        runtime["geminiWallSec"] + float((metadata or {}).get("wallSec") or 0), 3)
    if (metadata or {}).get("responseModel"):
        runtime["actualWorkerModel"] = str(metadata["responseModel"])
    usage = (metadata or {}).get("usage") or {}
    aliases = {
        "input": ("prompt_tokens", "input_tokens"),
        "output": ("completion_tokens", "output_tokens"),
        "total": ("total_tokens",),
    }
    for name, keys in aliases.items():
        reported = next((usage[key] for key in keys if isinstance(usage.get(key), (int, float))), None)
        if attempts != 1 or reported is None:
            runtime["_tokenComplete"][name] = False
        else:
            runtime["_tokenSums"][name] += int(reported)


def finish_gemini_metrics(runtime):
    fields = {"input": "geminiInputTokens", "output": "geminiOutputTokens",
              "total": "geminiTotalTokens"}
    for name, field in fields.items():
        runtime[field] = (runtime["_tokenSums"][name]
                          if runtime["geminiCallCount"] and runtime["_tokenComplete"][name]
                          else UNKNOWN)


def ask_worker_json(prompt, runtime, kind, image_path=None, ask=vision.ask_json):
    value, metadata = ask(prompt, image_path=image_path,
                          model=runtime["geminiModel"], strict=True)
    record_gemini_call(runtime, metadata, kind)
    if value is None:
        raise RuntimeError(GEMINI_WORKER_BLOCK + f" — strict {kind} JSON unavailable")
    return value


def cached_candidate_judgment(root, video, packet, item, runtime, ask=vision.ask_json):
    thumb = pathlib.Path(item["localThumbPath"])
    if not thumb.is_file():
        raise ValueError(f"candidate thumbnail is missing for Pexels PHOTO {item['pexelsId']}")
    key = candidate_vision_cache_key(
        thumb, packet, runtime["geminiModel"], item["pexelsId"])
    cached = state.cache_get(root, video, "pexels-candidate-vision", key)
    if cached is not None:
        return cached, True, key
    value = ask_worker_json(candidate_vision_prompt(packet, item["pexelsId"]), runtime,
                            "vision", image_path=thumb, ask=ask)
    judgment = parse_candidate_judgment(value, item["pexelsId"], state.hash_file(thumb))
    if value is not None and judgment["briefMatchNote"] != "invalid Gemini judgment":
        state.cache_put(root, video, "pexels-candidate-vision", key, judgment, {
            "pexelsId": item["pexelsId"], "file": state.file_input(thumb),
            "needIdentity": need_inputs(packet)["needIdentity"],
            "model": runtime["geminiModel"], "promptVersion": VISION_PROMPT_VERSION,
        })
    return judgment, False, key


def contract_reference():
    return pathlib.Path(__file__).resolve().parent.parent / "references" / "pexels-source-worker.md"


def tool_contract():
    return state.tool_identity(__file__, pathlib.Path(vision.__file__), contract_reference(),
                               versions={"pexelsSourceWorker": WORKER_CONTRACT_VERSION})


def need_inputs(packet):
    packet = validate_need_packet(packet)
    identity = state.digest({"packet": packet, "contractVersion": WORKER_CONTRACT_VERSION})
    return {"needIdentity": identity, "need": packet}


def need_directory(root, video, need_id):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", str(need_id)):
        raise ValueError("needId must be a compact path-safe identifier")
    return state.video_paths(root, video)["runtime"] / "candidates" / str(need_id)


def worker_paths(root, video, packet):
    directory = need_directory(root, video, packet["needId"])
    return {
        "directory": directory,
        "need": directory / "need.json",
        "candidates": directory / "candidates.json",
        "triage": directory / "triage.json",
        "return": directory / "worker_return.json",
        "receipt": directory / "worker_receipt.json",
    }


def relative_runtime_path(path, root):
    return pathlib.Path(path).resolve().relative_to(pathlib.Path(root).resolve()).as_posix()


def receipt_parameters(packet, execution_mode="gemini-api", model=None, router=None):
    return {"orientation": packet["orientation"], "contractVersion": WORKER_CONTRACT_VERSION,
            "queryPromptVersion": QUERY_PROMPT_VERSION,
            "visionPromptVersion": VISION_PROMPT_VERSION,
            "workerMode": execution_mode,
            "model": (model or vision.MODEL) if execution_mode == "gemini-api" else UNKNOWN,
            "router": (router or vision.BASE) if execution_mode == "gemini-api" else UNKNOWN}


def valid_return_shape(value):
    if not isinstance(value, dict) or set(value) != RETURN_FIELDS:
        return False
    shortlist = value.get("shortlist")
    return (isinstance(shortlist, list) and len(shortlist) <= MAX_SHORTLIST and
            all(isinstance(item, dict) and set(item) == SHORTLIST_FIELDS for item in shortlist))


def current_worker_result(root, video, packet, execution_mode="gemini-api",
                          require_visual_triage=False, model=None, router=None):
    paths = worker_paths(root, video, validate_need_packet(packet))
    current, _receipt = state.receipt_current(
        paths["receipt"], "pexels-source-worker", need_inputs(packet), tool_contract(),
        receipt_parameters(packet, execution_mode, model, router))
    value = state.read_json(paths["return"], {}) if current else {}
    if not current or not valid_return_shape(value):
        return None
    if value["workerMode"] != execution_mode:
        return None
    if require_visual_triage and value["visualTriage"] != "PASS":
        return None
    for item in value["shortlist"]:
        for key in ("localOriginalPath", "localThumbPath"):
            if not (pathlib.Path(root) / item[key]).is_file():
                return None
    return value


def worker_runtime(execution_mode, model=None, router=None):
    if execution_mode not in {"gemini-api", "fallback-main"}:
        raise ValueError("unknown Source Scout execution mode")
    if execution_mode == "fallback-main":
        return {"executionMode": execution_mode, "workerMode": "fallback-main",
                "actualWorkerModel": UNKNOWN, "parentContextInherited": UNKNOWN,
                "workerWallSec": 0.0}
    configured_model = str(model or vision.MODEL).strip()
    configured_router = str(router or vision.BASE).rstrip("/")
    return {
        "executionMode": "gemini-api", "workerMode": "gemini-api",
        "actualWorkerModel": configured_model, "parentContextInherited": "NO",
        "router": configured_router, "geminiModel": configured_model,
        "geminiCallCount": 0, "geminiQueryCalls": 0, "geminiVisionCalls": 0,
        "geminiInputTokens": UNKNOWN, "geminiOutputTokens": UNKNOWN,
        "geminiTotalTokens": UNKNOWN, "geminiWallSec": 0.0,
        "_tokenSums": {"input": 0, "output": 0, "total": 0},
        "_tokenComplete": {"input": True, "output": True, "total": True},
        "workerWallSec": 0.0,
    }


def empty_search_state(packet, runtime):
    return {
        "schema": 1,
        "contractVersion": WORKER_CONTRACT_VERSION,
        "needIdentity": need_inputs(packet)["needIdentity"],
        "initialQuery": None,
        "refinedQuery": None,
        "queryCount": 0,
        "candidateCount": 0,
        "rejectedCount": 0,
        "shortlistCount": 0,
        "thumbnailDownloads": 0,
        "originalDownloads": 0,
        "candidates": [],
        "runtime": runtime,
    }


def download(url, path, get=requests.get, timeout=30):
    if not url:
        raise ValueError("Pexels result is missing a required PHOTO URL")
    response = get(url, timeout=timeout)
    response.raise_for_status()
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(response.content)
    return path


def candidate_record(item, directory, search_number):
    pexels_id = int(item["pexelsId"])
    return {**item, "searchNumber": search_number,
            "localThumbPath": str(directory / f"thumb-{pexels_id}.jpg")}


def ensure_thumbnails(search_state, paths, get=requests.get):
    for item in search_state["candidates"]:
        thumb = pathlib.Path(item["localThumbPath"])
        if not thumb.is_file():
            download(item["previewUrl"], thumb, get=get)
            search_state["thumbnailDownloads"] += 1
            write_compact_json(paths["candidates"], search_state)


def perform_search(search_state, paths, packet, query, search_number,
                   api_key=None, get=requests.get):
    query = str(query or "").strip()
    if not query:
        raise ValueError("Source Scout search query must be non-empty")
    found = search(query, packet["orientation"], MAX_CANDIDATES,
                   api_key=api_key, get=get)
    known = {item["pexelsId"] for item in search_state["candidates"]}
    for item in found:
        if item["pexelsId"] not in known:
            search_state["candidates"].append(candidate_record(item, paths["directory"], search_number))
            known.add(item["pexelsId"])
    search_state["queryCount"] += 1
    search_state["candidateCount"] = len(search_state["candidates"])
    if search_number == 1:
        search_state["initialQuery"] = query
    else:
        search_state["refinedQuery"] = query
    write_compact_json(paths["candidates"], search_state)
    ensure_thumbnails(search_state, paths, get=get)
    return search_state


def triage_decision(search_state, triage):
    triage = triage if isinstance(triage, dict) else {}
    judgments = triage.get("judgments") or []
    by_id = {}
    for judgment in judgments:
        try:
            pexels_id = int(judgment.get("pexelsId"))
        except (AttributeError, TypeError, ValueError):
            continue
        by_id[pexels_id] = judgment
    candidates = {item["pexelsId"]: item for item in search_state["candidates"]}
    inspection = triage.get("visualInspection") or {}
    proven = (inspection.get("performed") is True and
              inspection.get("method") in {"gemini-api", "runtime-local-image"} and
              set(by_id) == set(candidates))
    if proven:
        for pexels_id, item in candidates.items():
            thumb = pathlib.Path(item["localThumbPath"])
            judgment = by_id[pexels_id]
            if (not thumb.is_file() or judgment.get("thumbSha256") != state.hash_file(thumb)
                    or not isinstance(judgment.get("useful"), bool)):
                proven = False
                break
    useful = []
    for position, item in enumerate(search_state["candidates"]):
        judgment = by_id.get(item["pexelsId"], {})
        if judgment.get("useful") is True:
            try:
                rank = int(judgment.get("rank", -int(judgment.get("fitScore", 0))))
            except (TypeError, ValueError):
                rank = position + 1
            useful.append((rank, position, item, str(judgment.get("briefMatchNote") or "").strip()))
    useful.sort(key=lambda row: (row[0], row[1]))
    return {
        "visualTriage": "PASS" if proven else "NOT_PROVEN",
        "shortlist": useful[:MAX_SHORTLIST],
        "usefulCount": len(useful),
        "rejectedCount": len(search_state["candidates"]) - len(useful),
    }


def require_triage_file(path, expected_directory):
    path = pathlib.Path(path).resolve()
    if path.parent != pathlib.Path(expected_directory).resolve() or path.name != "triage.json":
        raise ValueError("triage evidence must be candidates/<needId>/triage.json")
    return state.read_json(path, {})


def emit_telemetry(root, video, search_state, cache, current_run=False):
    runtime = search_state["runtime"]
    state.append_telemetry(root, video, {
        "stage": "pexels-source-scout", "owner": "gemini cheap worker", "cache": cache,
        "sourceScoutMode": runtime["workerMode"],
        "workerModel": runtime["actualWorkerModel"],
        "workerWallSec": runtime["workerWallSec"] if current_run else 0.0,
        "geminiModel": runtime.get("geminiModel", UNKNOWN),
        "geminiCallCount": runtime.get("geminiCallCount", 0) if current_run else 0,
        "geminiQueryCalls": runtime.get("geminiQueryCalls", 0) if current_run else 0,
        "geminiVisionCalls": runtime.get("geminiVisionCalls", 0) if current_run else 0,
        "geminiInputTokens": runtime.get("geminiInputTokens", UNKNOWN) if current_run else UNKNOWN,
        "geminiOutputTokens": runtime.get("geminiOutputTokens", UNKNOWN) if current_run else UNKNOWN,
        "geminiTotalTokens": runtime.get("geminiTotalTokens", UNKNOWN) if current_run else UNKNOWN,
        "geminiWallSec": runtime.get("geminiWallSec", 0.0) if current_run else 0.0,
        "pexelsQueryCount": search_state["queryCount"] if current_run else 0,
        "queryCount": search_state["queryCount"] if current_run else 0,
        "candidateCount": search_state["candidateCount"],
        "thumbnailDownloads": search_state["thumbnailDownloads"] if current_run else 0,
        "originalDownloads": search_state["originalDownloads"] if current_run else 0,
        "shortlistCount": search_state["shortlistCount"],
        "refinementCount": max(0, search_state["queryCount"] - 1) if current_run else 0,
        "parentContextInherited": runtime["parentContextInherited"],
    })


def finalize(search_state, paths, packet, triage, root, video,
             require_visual_triage=False, get=requests.get):
    decision = triage_decision(search_state, triage)
    if require_visual_triage and decision["visualTriage"] != "PASS":
        raise RuntimeError(VISUAL_TRIAGE_BLOCK)
    shortlist = []
    for _rank, _position, item, note in decision["shortlist"]:
        original = paths["directory"] / f"original-{item['pexelsId']}.jpg"
        if not original.is_file():
            download(item["downloadUrl"], original, get=get)
            search_state["originalDownloads"] += 1
        thumb = pathlib.Path(item["localThumbPath"])
        if not thumb.is_file():
            raise ValueError(f"shortlisted thumbnail is missing for Pexels PHOTO {item['pexelsId']}")
        shortlist.append({
            "pexelsId": item["pexelsId"],
            "localOriginalPath": relative_runtime_path(original, root),
            "localThumbPath": relative_runtime_path(thumb, root),
            "pageUrl": item["pageUrl"],
            "photographer": item["photographer"],
            "width": item["width"], "height": item["height"],
            "briefMatchNote": note[:240],
            "provenance": item["provenance"], "license": item["license"],
            "retrievedAt": item["retrievedAt"],
        })
    search_state["rejectedCount"] = decision["rejectedCount"]
    search_state["shortlistCount"] = len(shortlist)
    runtime = search_state["runtime"]
    finish_gemini_metrics(runtime) if runtime["workerMode"] == "gemini-api" else None
    write_compact_json(paths["triage"], triage)
    result = {
        "needId": packet["needId"], "sceneId": packet["sceneId"],
        "workerMode": runtime["workerMode"],
        "actualWorkerModel": runtime["actualWorkerModel"],
        "parentContextInherited": runtime["parentContextInherited"],
        "router": runtime.get("router", UNKNOWN),
        "geminiModel": runtime.get("geminiModel", UNKNOWN),
        "geminiCallCount": runtime.get("geminiCallCount", 0),
        "geminiQueryCalls": runtime.get("geminiQueryCalls", 0),
        "geminiVisionCalls": runtime.get("geminiVisionCalls", 0),
        "geminiInputTokens": runtime.get("geminiInputTokens", UNKNOWN),
        "geminiOutputTokens": runtime.get("geminiOutputTokens", UNKNOWN),
        "geminiTotalTokens": runtime.get("geminiTotalTokens", UNKNOWN),
        "geminiWallSec": runtime.get("geminiWallSec", 0.0),
        "pexelsQueryCount": search_state["queryCount"],
        "candidateCount": search_state["candidateCount"],
        "thumbnailDownloads": search_state["thumbnailDownloads"],
        "originalDownloads": search_state["originalDownloads"],
        "shortlistCount": len(shortlist),
        "rejectedCount": decision["rejectedCount"],
        "visualTriage": decision["visualTriage"],
        "refinementCount": max(0, search_state["queryCount"] - 1),
        "workerWallSec": runtime["workerWallSec"],
        "shortlist": shortlist,
    }
    write_compact_json(paths["candidates"], search_state)
    write_compact_json(paths["return"], result)
    outputs = [paths["need"], paths["candidates"], paths["triage"], paths["return"]]
    outputs.extend(pathlib.Path(item["localThumbPath"])
                   for item in search_state["candidates"])
    for item in shortlist:
        outputs.append(pathlib.Path(root) / item["localOriginalPath"])
    state.make_receipt(paths["receipt"], "pexels-source-worker", need_inputs(packet),
                       tool_contract(), receipt_parameters(
                           packet, runtime["executionMode"], runtime.get("geminiModel"),
                           runtime.get("router")), outputs)
    emit_telemetry(root, video, search_state, "miss", current_run=True)
    return result


def gemini_triage(root, video, packet, search_state, ask=vision.ask_json):
    runtime = search_state["runtime"]
    judgments = []
    for item in search_state["candidates"]:
        judgment, _hit, _key = cached_candidate_judgment(
            root, video, packet, item, runtime, ask=ask)
        judgments.append(judgment)
    return {"visualInspection": {"performed": True, "method": "gemini-api"},
            "judgments": judgments}


def run_gemini_worker(root, video, packet, paths, model=None, api_key=None,
                      get=requests.get, ask=vision.ask_json):
    if ask is vision.ask_json and not vision.KEY:
        raise RuntimeError(GEMINI_WORKER_BLOCK + " — credential missing")
    started = time.perf_counter()
    runtime = worker_runtime("gemini-api", model=model)
    search_state = empty_search_state(packet, runtime)
    initial_value = ask_worker_json(query_prompt(packet), runtime, "query", ask=ask)
    initial_query = parse_query_result(initial_value)
    perform_search(search_state, paths, packet, initial_query, 1, api_key=api_key, get=get)
    triage = gemini_triage(root, video, packet, search_state, ask=ask)
    decision = triage_decision(search_state, triage)
    if not decision["usefulCount"]:
        refined_value = ask_worker_json(query_prompt(packet, refined=True), runtime, "query", ask=ask)
        refined_query = parse_query_result(refined_value)
        perform_search(search_state, paths, packet, refined_query, 2, api_key=api_key, get=get)
        triage = gemini_triage(root, video, packet, search_state, ask=ask)
    write_compact_json(paths["triage"], triage)
    runtime["workerWallSec"] = round(time.perf_counter() - started, 3)
    write_compact_json(paths["candidates"], search_state)
    return finalize(search_state, paths, packet, triage, root, video,
                    require_visual_triage=True, get=get)


def scout_phase(root, video, packet, phase, query=None, triage=None,
                execution_mode="gemini-api", require_visual_triage=False,
                model=None, api_key=None, get=requests.get, ask=vision.ask_json):
    root = pathlib.Path(root).resolve()
    packet = validate_need_packet(packet)
    paths = worker_paths(root, video, packet)
    cached = current_worker_result(root, video, packet, execution_mode, require_visual_triage,
                                   model=model)
    if cached:
        search_state = state.read_json(paths["candidates"], empty_search_state(packet, {
            "workerMode": cached["workerMode"], "actualWorkerModel": cached["actualWorkerModel"],
            "parentContextInherited": cached["parentContextInherited"],
            "workerWallSec": cached["workerWallSec"], "executionMode": execution_mode,
        }))
        emit_telemetry(root, video, search_state, "hit")
        return "REUSE", cached
    if phase == "status":
        return "MISS", None
    started = time.perf_counter()
    paths["directory"].mkdir(parents=True, exist_ok=True)
    write_compact_json(paths["need"], packet)
    if phase == "run":
        if execution_mode != "gemini-api":
            raise ValueError("the complete source-worker run requires execution mode gemini-api")
        return "FINALIZED", run_gemini_worker(
            root, video, packet, paths, model=model, api_key=api_key, get=get, ask=ask)
    if execution_mode != "fallback-main":
        raise ValueError("gemini-api uses --phase run; legacy phases require explicit fallback-main")
    search_state = state.read_json(paths["candidates"], {})
    identity = need_inputs(packet)["needIdentity"]

    if phase == "initial":
        runtime = worker_runtime(execution_mode)
        if search_state.get("needIdentity") != identity:
            search_state = empty_search_state(packet, runtime)
        if search_state["queryCount"] == 0:
            perform_search(search_state, paths, packet, query, 1, api_key=api_key, get=get)
        elif query and query != search_state["initialQuery"]:
            raise ValueError("initial Pexels search already completed; use the single refinement")
        else:
            ensure_thumbnails(search_state, paths, get=get)
        search_state["runtime"]["workerWallSec"] += round(time.perf_counter() - started, 3)
        write_compact_json(paths["candidates"], search_state)
        return "SEARCHED", search_state

    if search_state.get("needIdentity") != identity or search_state.get("queryCount", 0) < 1:
        raise ValueError("current initial Pexels search is required before this phase")

    if phase == "refine":
        if search_state["queryCount"] >= MAX_SEARCHES or search_state.get("refinedQuery"):
            raise ValueError("Pexels Source Scout permits at most one refinement")
        decision = triage_decision(search_state, triage)
        if decision["visualTriage"] != "PASS" or decision["usefulCount"]:
            raise ValueError("refinement requires proven thumbnail triage with no useful candidate")
        perform_search(search_state, paths, packet, query, 2, api_key=api_key, get=get)
        search_state["runtime"]["workerWallSec"] += round(time.perf_counter() - started, 3)
        write_compact_json(paths["candidates"], search_state)
        return "REFINED", search_state

    if phase != "finalize":
        raise ValueError("scout phase must be status, initial, refine, or finalize")
    search_state["runtime"]["workerWallSec"] += round(time.perf_counter() - started, 3)
    result = finalize(search_state, paths, packet, triage, root, video,
                      require_visual_triage=require_visual_triage, get=get)
    return "FINALIZED", result


def candidate_payload(args, candidates):
    return {"provider": "pexels", "mediaType": "photo", "query": args.query,
            "orientation": args.orientation, "candidateCap": MAX_CANDIDATES,
            "count": len(candidates), "candidates": candidates}


def cmd_list(args):
    candidates = search(args.query, args.orientation, args.per_page)
    if args.json:
        print(json.dumps(candidate_payload(args, candidates), ensure_ascii=False, indent=2))
        return 0
    if not candidates:
        print(f"No photo results for {args.query!r} (orientation={args.orientation}).")
        return 0
    for index, item in enumerate(candidates):
        print(f"[{index}] id={item['pexelsId']} {item['width']}x{item['height']} "
              f"by {item['photographer']} page={item['pageUrl']}")
        print(f"     preview: {item['previewUrl']}")
    return 0


def cmd_get(args):
    candidates = search(args.query, args.orientation, args.per_page)
    if not candidates:
        raise RuntimeError(f"No photo results for {args.query!r} (orientation={args.orientation}).")
    if args.index < 0 or args.index >= len(candidates):
        raise RuntimeError(f"Only {len(candidates)} results; index {args.index} is out of range.")
    selected = candidates[args.index]
    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    download(selected["downloadUrl"], out_path)
    downloaded = {**selected, "localPath": str(out_path)}
    if args.json:
        print(json.dumps(downloaded, ensure_ascii=False, indent=2))
    else:
        print(f"Saved {out_path} ({selected['width']}x{selected['height']}, "
              f"photo by {selected['photographer']}, {selected['pageUrl']})")
    return 0


def cmd_scout(args):
    packet_path = pathlib.Path(args.packet)
    packet = json.loads(packet_path.read_text(encoding="utf-8"))
    root = state.project_root(__file__)
    triage = None
    if args.triage:
        expected = worker_paths(root, args.video, validate_need_packet(packet))["directory"]
        triage = require_triage_file(args.triage, expected)
    status, value = scout_phase(
        root, args.video, packet, args.phase, query=args.query, triage=triage,
        execution_mode=args.execution_mode,
        require_visual_triage=args.require_visual_triage, model=args.model)
    if status == "MISS":
        print("MISS — PEXELS_SOURCE_WORKER_RESULT_NOT_CURRENT")
        return 3
    if status == "REUSE":
        print(f"REUSE {worker_paths(root, args.video, packet)['return']}")
    else:
        data = value if status == "FINALIZED" else {
            "queryCount": value["queryCount"], "candidateCount": value["candidateCount"],
            "thumbnailDownloads": value["thumbnailDownloads"]}
        print(f"{status} {json.dumps(data, ensure_ascii=False, separators=(',', ':'))}")
    return 0


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="List candidate photos for a query")
    p_list.add_argument("query")
    p_list.add_argument("--orientation", default="portrait", choices=["landscape", "portrait", "square"])
    p_list.add_argument("--per-page", type=int, default=MAX_CANDIDATES)
    p_list.add_argument("--json", action="store_true")
    p_list.set_defaults(func=cmd_list)

    p_get = sub.add_parser("get", help="Download one candidate photo")
    p_get.add_argument("query")
    p_get.add_argument("out")
    p_get.add_argument("--orientation", default="portrait", choices=["landscape", "portrait", "square"])
    p_get.add_argument("--per-page", type=int, default=MAX_CANDIDATES)
    p_get.add_argument("--index", type=int, default=0)
    p_get.add_argument("--json", action="store_true")
    p_get.set_defaults(func=cmd_get)

    p_scout = sub.add_parser("scout", help="Run one bounded Pexels PHOTO sourcing need")
    p_scout.add_argument("video")
    p_scout.add_argument("packet")
    p_scout.add_argument("--phase", required=True,
                         choices=["status", "run", "initial", "refine", "finalize"])
    p_scout.add_argument("--query")
    p_scout.add_argument("--triage")
    p_scout.add_argument("--execution-mode", default="gemini-api",
                         choices=["gemini-api", "fallback-main"])
    p_scout.add_argument("--model", default=vision.MODEL)
    p_scout.add_argument("--require-visual-triage", action="store_true")
    p_scout.set_defaults(func=cmd_scout)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.func(args) or 0
    except requests.RequestException:
        print("Pexels request failed", file=sys.stderr)
        return 2
    except (OSError, RuntimeError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())