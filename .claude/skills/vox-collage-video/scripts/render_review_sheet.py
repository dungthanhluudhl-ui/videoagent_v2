"""Build temporal review evidence from the actual medium-resolution master draft.

Normal path: master motion draft -> deterministic sample manifest -> one ffmpeg
extraction process for all stale/missing frames -> temporal + scene-summary
sheets. Captions, transitions, master composition and motion are therefore in
the evidence. Remotion still-per-frame fan-out is not used.

Targeted full-resolution evidence is selected separately for authentic
documents, declared small-text/pixel-sensitive scenes, and manual escalations.
Use --manifest-only to validate mapping without touching media.
"""

import argparse
import json
import pathlib
import shutil
import subprocess
import sys
import time

import stage_state as state
import render_video
import beat_sync

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: py -3 -m pip install pillow")

VERSION = "master-frame-batched-pages-v4"
PREVIS_VERSION = "selective-production-scene-stills-v3"
FRESH_SCHEMA = "v18-rebuilt-plan-v1"
SETTLE = 20
MAX_BATCH = 40
MAX_PAGE_PIXELS = 4_000_000
THUMB_SIZE = (270, 480)
PAGE_COLS = 4
PAGE_ROWS = 2


def build_review_pages(thumbs, out_dir, prefix):
    """Compact review proxies; high-resolution evidence remains untouched."""
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob(f"{prefix}-*.jpg"):
        old.unlink()
    pages = []
    page_size = PAGE_COLS * PAGE_ROWS
    for page_index in range(0, len(thumbs), page_size):
        chunk = thumbs[page_index:page_index + page_size]
        cw, ch = THUMB_SIZE[0] + 12, THUMB_SIZE[1] + 34
        width, height = PAGE_COLS * cw, PAGE_ROWS * ch
        if width * height > MAX_PAGE_PIXELS:
            raise ValueError(f"review proxy page would exceed {MAX_PAGE_PIXELS} pixels")
        page = Image.new("RGB", (width, height), (245, 243, 238))
        draw = ImageDraw.Draw(page)
        labels = []
        for index, (label, path) in enumerate(chunk):
            with Image.open(path) as original:
                image = original.convert("RGB")
                image.thumbnail(THUMB_SIZE, Image.Resampling.LANCZOS)
                cell = Image.new("RGB", THUMB_SIZE, (20, 20, 20))
                cell.paste(image, ((THUMB_SIZE[0] - image.width) // 2,
                                   (THUMB_SIZE[1] - image.height) // 2))
            x, y = (index % PAGE_COLS) * cw, (index // PAGE_COLS) * ch
            page.paste(cell, (x + 6, y + 6))
            draw.text((x + 6, y + THUMB_SIZE[1] + 12), label, fill=(20, 20, 20))
            labels.append(label)
        path = out_dir / f"{prefix}-{page_index // page_size + 1:03d}.jpg"
        page.save(path, format="JPEG", quality=82, optimize=True)
        pages.append({"path": str(path), "width": width, "height": height,
                      "megapixels": round(width * height / 1_000_000, 4),
                      "labels": labels, "sha256": state.hash_file(path)})
    return pages


def _declared_previs_frames(scene, fps=30):
    """OPEN/KEY defaults plus MID only when the semantic plan explicitly asks."""
    duration = state.scene_duration(scene, fps)
    declared = scene.get("previsFrames") or scene.get("previsFrameRoles") or []
    values = {}
    if isinstance(declared, dict):
        source = declared.get("roles") if isinstance(declared.get("roles"), list) else declared
        if isinstance(source, dict):
            for role, frame in source.items():
                if str(role).upper() in {"OPEN", "KEY", "MID"}:
                    values[str(role).upper()] = int(frame)
        else:
            declared = source
    if isinstance(declared, list):
        for item in declared:
            if isinstance(item, dict):
                role = str(item.get("role") or "").upper()
                if role in {"OPEN", "KEY", "MID"}:
                    values[role] = int(item.get("localFrame", item.get("frame", 0)))
            elif str(item).upper() == "MID":
                values["MID"] = duration // 2
    values.setdefault("OPEN", int(scene.get("previsOpenFrame") or 0))
    events = [int(item.get("frame") or 0) for item in scene.get("visualEvents") or []]
    default_key = min(duration - 1, max(events or [max(0, duration // 2)]) + (SETTLE if events else 0))
    values.setdefault("KEY", int(scene.get("previsKeyFrame", default_key)))
    if scene.get("previsMidRequired") is True:
        values.setdefault("MID", int(scene.get("previsMidFrame", duration // 2)))
    return [(role, max(0, min(duration - 1, frame)))
            for role, frame in (("OPEN", values["OPEN"]), ("KEY", values["KEY"]),
                                ("MID", values.get("MID"))) if frame is not None]


def previs_requests(plan, paths, promoted=False):
    video = plan.get("video", "V")
    target_dir = paths["promoted_previs_frames"] if promoted else paths["previs_frames"]
    changed = None
    if promoted:
        baseline = state.read_json(paths["previs_manifest"], {})
        approval = state.read_json(paths["receipts"] / "previs-approved.json", {})
        approved = {item.get("scene"): item.get("fingerprint") for item in
                    (approval.get("metadata") or {}).get("sceneDependencies") or []}
        changed = {scene.get("id") for scene in plan.get("scenes") or []
                   if approved.get(scene.get("id")) != state.scene_dependency_fingerprint(
                       paths["root"], plan, scene, __import__("build_gate").PIXEL_VERSION)}
        requests = [{"scene": item.get("scene"), "role": str(item.get("role") or "").upper(),
                     "localFrame": int(item.get("localFrame", item.get("frame", 0)))}
                    for item in baseline.get("frames") or [] if item.get("scene") in changed]
    else:
        requests = [{"scene": scene.get("id"), "role": role, "localFrame": frame}
                    for scene in plan.get("scenes") or []
                    for role, frame in _declared_previs_frames(scene, plan.get("fps", 30))]
    for item in requests:
        stem = state.scene_stem(item["scene"])
        source = state.scene_source(paths["root"], video, item["scene"])
        item["composition"] = f"{video}{stem}"
        item["path"] = str(target_dir / f"{stem}_{item['role']}.png")
        item["sourcePath"] = str(source)
        item["sourceSha256"] = state.hash_file(source) if source.is_file() else None
    return requests


def conformance_scene_records(plan, paths, rendered_scene_ids):
    approval = state.read_json(paths["receipts"] / "previs-approved.json", {})
    approved = {item.get("scene"): item.get("fingerprint") for item in
                (approval.get("metadata") or {}).get("sceneDependencies") or []}
    return [{"scene": scene.get("id"),
             "status": "rendered" if scene.get("id") in rendered_scene_ids else "reused",
             "approvedFingerprint": approved.get(scene.get("id")),
             "currentFingerprint": state.scene_dependency_fingerprint(
                 paths["root"], plan, scene, __import__("build_gate").PIXEL_VERSION)}
            for scene in plan.get("scenes") or []]


def previs_command(item, entry="src/index.ts"):
    return ["npx", "remotion", "still", str(entry), item["composition"], item["path"],
            f"--frame={item['localFrame']}", "--image-format=png", "--overwrite"]


def render_previs(plan_path, plan, paths, command_only=False, manifest_only=False,
                  promoted=False):
    root = state.project_root(plan_path)
    requests = previs_requests(plan, paths, promoted)
    if not requests and not promoted:
        raise ValueError("semantic plan has no scenes to render as PREVIS")
    if promoted and not requests and not manifest_only:
        static = [scene for scene in plan.get("scenes") or []
                  if len(str(scene.get("intentionalStaticRationale") or "").strip()) >= 20]
        if len(static) != len(plan.get("scenes") or []):
            raise ValueError("PROMOTE cannot close as a global no-op: every scene is unchanged and not every scene has a specific intentionalStaticRationale")
    commands = [previs_command(item) for item in requests]
    if command_only:
        print(json.dumps(commands, ensure_ascii=False))
        return 0
    render_start = time.perf_counter()
    subprocess_count = 0
    if not manifest_only:
        for item, command in zip(requests, commands):
            pathlib.Path(item["path"]).parent.mkdir(parents=True, exist_ok=True)
            proc = subprocess.run(command, cwd=root, capture_output=True, text=True,
                                  encoding="utf-8", errors="replace",
                                  shell=(sys.platform == "win32"))
            subprocess_count += 1
            if proc.returncode:
                raise ValueError(f"PREVIS still failed for {item['scene']}/{item['role']}: "
                                 f"{(proc.stderr or proc.stdout)[-800:]}")
    render_wall_ms = round((time.perf_counter() - render_start) * 1000, 2)
    frames = []
    for item in requests:
        proof = state.file_input(item["path"])
        frame = {"scene": item["scene"], "role": item["role"],
                 "localFrame": item["localFrame"], "composition": item["composition"],
                 "path": item["path"], "sourcePath": item["sourcePath"],
                 "sourceSha256": item["sourceSha256"]}
        if not proof.get("missing"):
            frame["sha256"] = proof["sha256"]
        frames.append(frame)
    manifest_path = paths["promoted_previs_manifest"] if promoted else paths["previs_manifest"]
    rendered_scene_ids = {item["scene"] for item in requests}
    manifest = {"schema": 1, "version": PREVIS_VERSION, "video": plan.get("video"),
                "source": "actual production-compatible scene JSX", "frames": frames,
                "layoutSafetyVersion": "rendered-dom-geometry-v1"}
    if promoted:
        manifest["scenes"] = conformance_scene_records(plan, paths, rendered_scene_ids)
    changed = []
    sheet_wall_ms = 0.0
    if not promoted and not manifest_only:
        thumbs = [(f"{item['scene']} {item['role']} @f{item['localFrame']}", pathlib.Path(item["path"]))
                  for item in requests]
        sheet_start = time.perf_counter()
        pages = build_review_pages(thumbs, paths["previs_review_pages"], "previs")
        sheet_wall_ms = round((time.perf_counter() - sheet_start) * 1000, 2)
        manifest["reviewPages"] = pages
        changed.extend(pathlib.Path(page["path"]) for page in pages)
    state.write_json(manifest_path, manifest)
    changed.append(manifest_path)
    if not command_only:
        output_path = pathlib.Path(manifest["reviewPages"][0]["path"]) if not promoted and not manifest_only else manifest_path
        state.append_telemetry(root, plan.get("video", "V"), {
            "stage": "previs-capture", "owner": "script",
            "mode": "promoted-previs" if promoted else "baseline-previs",
            "sceneCount": len({item["scene"] for item in requests}),
            "requestedStateCount": len(requests), "subprocessCount": subprocess_count,
            "renderWallMs": render_wall_ms, "contactSheetAssemblyMs": sheet_wall_ms,
            "cache": "manifest-only" if manifest_only else "miss",
            "affectedItems": len(requests), "output": str(output_path),
            "outputIdentity": state.file_input(output_path),
            "reusedSceneCount": sum(item.get("status") == "reused" for item in manifest.get("scenes") or []),
            "renderedSceneCount": len(rendered_scene_ids),
            "reviewPageCount": len(manifest.get("reviewPages") or []),
        })
    print(state.compact_result("CLOSED" if not manifest_only else "OPEN",
                               changed=changed, details=manifest_path,
                               receipt=state.digest(manifest)))
    return 0


def scene_summary_thumbs(review_entries):
    return [(entry.get("id", ""), pathlib.Path(entry["frame"]))
            for entry in review_entries if entry.get("frame")]


def local_sample_frames(scene, fps=30, per_scene=2, settle=SETTLE, promoted_beats=()):
    total = state.scene_duration(scene, fps)
    if total <= 1:
        return []
    beats = sorted({int(frame) for frame in promoted_beats})
    if not beats:  # historical-plan compatibility only
        beats = sorted({int(e.get("frame") or 0) for e in scene.get("visualEvents") or []})
    picks = {max(1, min(total - 1, beat + settle)) for beat in beats}
    picks.add(max(1, total - 6))
    if len(picks) < per_scene:
        picks |= {int(total * (i + 1) / (per_scene + 1)) for i in range(per_scene)}
    return sorted(f for f in picks if 0 < f < total)


def scene_master_starts(plan):
    """Map each scene to actual master start; explicit starts support handwritten masters."""
    fps = int(plan.get("fps", 30))
    starts = {}
    for scene in plan.get("scenes") or []:
        expected = int(round(float(scene.get("startSec", 0)) * fps))
        starts[scene.get("id")] = int(scene.get("masterStartFrame", expected))
    return starts


def needs_full_res(scene):
    if any(scene.get(k) is True for k in ("fullResolutionEvidence", "pixelSensitive",
                                          "smallText", "highResolutionEvidence")):
        return True
    for asset in state.scene_materials(scene):
        if asset.get("role") == "document" or asset.get("evidenceRegions"):
            return True
        if asset.get("fullResolutionEvidence") is True or asset.get("pixelSensitive") is True:
            return True
    return False


def sample_manifest(plan, out_dir, per_scene=2, manual_full_res=(), promotion_timing=None):
    fps = int(plan.get("fps", 30))
    video = plan.get("video", "V")
    starts = scene_master_starts(plan)
    samples, targeted = [], []
    manual = set(manual_full_res or [])
    resolved = (promotion_timing or {}).get("beats", {})
    for scene in plan.get("scenes") or []:
        sid = scene.get("id", "")
        scene_samples = []
        promoted_beats = [item["frame"] for key, item in resolved.items()
                          if key.startswith(f"{sid}:")]
        for frame in local_sample_frames(scene, fps, per_scene,
                                         promoted_beats=promoted_beats):
            master = starts[sid] + frame
            item = {"id": f"{sid}-f{frame}", "scene": sid, "localFrame": frame,
                    "masterFrame": master, "masterTimeSec": round(master / fps, 6),
                    "path": str(pathlib.Path(out_dir) / f"{video}Master_{sid}_f{frame}_m{master}.png"),
                    "visualTransformation": scene.get("visualTransformation", "")}
            samples.append(item)
            scene_samples.append(item)
        if scene_samples and (needs_full_res(scene) or sid in manual):
            representative = scene_samples[len(scene_samples) // 2]
            targeted.append({**representative, "reason": (
                "manual/editorial escalation" if sid in manual else
                "declared document/text/pixel-sensitive evidence")})
    return {"schema": 1, "version": VERSION, "video": video, "fps": fps,
            "composition": f"{video}Master", "samples": samples,
            "targetedFullResolution": targeted}


def extraction_batches(samples, batch_size=MAX_BATCH):
    by_frame = {}
    for sample in samples:
        by_frame.setdefault(int(sample["masterFrame"]), []).append(sample)
    unique = [{"masterFrame": frame, "samples": grouped}
              for frame, grouped in sorted(by_frame.items())]
    return [unique[index:index + batch_size] for index in range(0, len(unique), batch_size)]


def extraction_command(draft, batch, _filter_script, temp_dir):
    """One bounded process with explicit master-frame-named outputs."""
    if not batch:
        return [], ""
    labels = "".join(f"[v{index}]" for index in range(len(batch)))
    lines = [f"[0:v]split={len(batch)}{labels};"]
    for index, item in enumerate(batch):
        lines.append(f"[v{index}]select=eq(n\\,{int(item['masterFrame'])})[o{index}];")
    graph = "\n".join(lines)
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(draft),
               "-filter_complex", graph]
    for index, item in enumerate(batch):
        command += ["-map", f"[o{index}]", "-frames:v", "1",
                    str(pathlib.Path(temp_dir) / f"master-{int(item['masterFrame'])}.png")]
    return command, graph


def verify_batch_outputs(temp_dir, batch):
    requested = [int(item["masterFrame"]) for item in batch]
    produced = [frame for frame in requested
                if (pathlib.Path(temp_dir) / f"master-{frame}.png").is_file()]
    return {"requested": requested, "produced": produced,
            "exact": requested == produced}


def targeted_full_res_command(manifest, out_dir, entry="src/index.ts"):
    """One Remotion process for all targeted master frames, never one per frame."""
    frames = sorted({int(x["masterFrame"]) for x in manifest.get("targetedFullResolution", [])})
    if not frames:
        return []
    return ["npx", "remotion", "render", str(entry), manifest["composition"], str(out_dir),
            "--sequence", "--frames=" + ",".join(map(str, frames)),
            "--image-format=png", "--overwrite"]


def sample_identity(source_proof, manifest, sample):
    return state.digest({"source": source_proof, "version": manifest["version"],
                         "fps": manifest["fps"], "sample": {
                             "scene": sample["scene"], "localFrame": sample["localFrame"],
                             "masterFrame": sample["masterFrame"],
                             "visualTransformation": sample["visualTransformation"]}})


def sample_source_proof(root, plan_path, plan, sample, render_params):
    scenes = plan.get("scenes") or []
    index = next(i for i, scene in enumerate(scenes) if scene.get("id") == sample["scene"])
    relevant = scenes[max(0, index - 1):min(len(scenes), index + 2)]
    video = plan.get("video", "V")
    paths = state.video_paths(root, video)
    scene_files = [state.scene_source(root, video, s.get("id")) for s in relevant]
    files = render_video.local_dependency_files(scene_files)
    files += [paths["master"], paths["captions"], paths["shared"],
              root / "remotion.config.ts", root / "package.json"]
    for scene in relevant:
        for asset in state.scene_materials(scene):
            if asset.get("src"):
                files.append(state.asset_path(root, video, asset["src"]))
    local_contract = state.plan_slice(
        {"scenes": relevant}, scene_fields=("id", "startSec", "endSec", "durationInFrames",
                                             "masterStartFrame", "transitionIn", "assets"))["scenes"]
    return {"localScenes": local_contract,
            "files": [state.file_input(path) for path in files],
            "rootRegistration": render_video.selected_registration(root, f"{video}Master"),
            "alignedWords": state.json_input(state.words_path(root, plan)),
            "renderParameters": render_params,
            "mapping": {"masterFrame": sample["masterFrame"], "fps": plan.get("fps", 30)}}


def stale_samples(root, video, plan_path, plan, manifest, render_params):
    stale, current = [], []
    for sample in manifest["samples"]:
        source_proof = sample_source_proof(root, plan_path, plan, sample, render_params)
        sample["sourceFingerprint"] = state.digest(source_proof)
        key = sample_identity(source_proof, manifest, sample)
        receipt_path = (state.video_paths(root, video)["receipts"] /
                        "review-samples" / f"{key}.json")
        inputs = {"source": source_proof, "sample": sample}
        tool = {"versions": {"extraction": VERSION}}
        ok, receipt = state.receipt_current(receipt_path, "review-sample", inputs, tool, {})
        (current if ok else stale).append((sample, key, receipt_path, inputs, tool, receipt))
    return stale, current


def extract_stale(root, video, draft, stale, command_only=False):
    temp_dir = state.video_paths(root, video)["runtime"] / "review-extract-temp"
    batches = extraction_batches([item[0] for item in stale])
    commands = []
    for index, batch in enumerate(batches):
        command, content = extraction_command(draft, batch, None, temp_dir)
        commands.append({"command": command, "boundedFilter": content,
                         "requested": [item["masterFrame"] for item in batch]})
    if command_only:
        return commands
    if not batches:
        return []
    temp_dir.mkdir(parents=True, exist_ok=True)
    for old in temp_dir.glob("master-*.png"):
        old.unlink()
    for spec in commands:
        proc = subprocess.run(spec["command"], cwd=root, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", shell=(sys.platform == "win32"))
        if proc.returncode:
            raise RuntimeError(((proc.stderr or proc.stdout) or "ffmpeg extraction failed").strip())
        verification = verify_batch_outputs(temp_dir,
            [{"masterFrame": frame} for frame in spec["requested"]])
        if not verification["exact"]:
            missing = [frame for frame in verification["requested"]
                       if frame not in verification["produced"]]
            raise RuntimeError(f"ffmpeg batch produced {len(verification['produced'])}/{len(verification['requested'])} requested master frames; missing {missing}")
    changed = []
    for sample, _key, receipt_path, inputs, tool, _old in stale:
        source = temp_dir / f"master-{int(sample['masterFrame'])}.png"
        dest = pathlib.Path(sample["path"])
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest)
        state.make_receipt(receipt_path, "review-sample", inputs, tool, {}, [dest])
        changed.append(dest)
    return changed


def review_entries(manifest):
    grouped = {}
    for item in manifest["samples"]:
        grouped.setdefault(item["scene"], []).append(item)
    entries = []
    for sid, items in grouped.items():
        representative = items[len(items) // 2]
        entries.append({"id": sid, "frame": representative["path"],
                        "frames": [x["path"] for x in items], "evidence": items,
                        "visualTransformation": representative["visualTransformation"],
                        "illustrated": "", "composed": "", "varied": "",
                        "purposeful": "", "note": ""})
    return entries


JUDGEMENT_FIELDS = ("illustrated", "composed", "varied", "purposeful", "note", "resolved")


def evidence_identity(entry):
    return state.digest([{key: item.get(key) for key in (
        "id", "scene", "localFrame", "masterFrame", "masterTimeSec", "path",
        "sourceFingerprint", "visualTransformation")}
        for item in entry.get("evidence") or []])


def merge_editorial_judgement(entries, old_review):
    old = {entry.get("id"): entry for entry in old_review.get("scenes") or []}
    for entry in entries:
        prior = old.get(entry.get("id"))
        if prior and evidence_identity(prior) == evidence_identity(entry):
            for field in JUDGEMENT_FIELDS:
                if field in prior:
                    entry[field] = prior[field]
    return entries


def review_generation(manifest, render_params, draft_identity):
    mapping = [{key: sample.get(key) for key in (
        "id", "scene", "localFrame", "masterFrame", "masterTimeSec", "path",
        "sourceFingerprint", "visualTransformation")}
        for sample in manifest.get("samples") or []]
    return state.digest({"draft": draft_identity, "renderParameters": render_params,
                         "mapping": mapping, "version": manifest.get("version")})


def complete_review_generation(manifest, manifest_path, review_path, temporal, summary,
                               targeted_path, render_params, draft_identity, keep_review=False):
    """Atomically derive both review artifacts from one authoritative evidence generation."""
    generation = review_generation(manifest, render_params, draft_identity)
    manifest["reviewGeneration"] = generation
    state.write_json(manifest_path, manifest)
    entries = review_entries(manifest)
    old_review = state.read_json(review_path, {}) if keep_review else {}
    if keep_review:
        entries = merge_editorial_judgement(entries, old_review)
    review = {"video": manifest.get("video"),
              "evidenceSource": "medium-resolution actual master draft",
              "sampleManifest": str(manifest_path), "temporalSheet": str(temporal),
              "sceneSummarySheet": str(summary), "targetedFullResolution": str(targeted_path),
              "reviewPages": manifest.get("reviewPages") or [],
              "sceneSummaryPages": manifest.get("sceneSummaryPages") or [],
              "renderParameters": render_params, "reviewGeneration": generation,
              "howToFill": "Judge actual-master evidence; quality fail may be acknowledged, missing/stale/blank evidence is hard.",
              "criteria": {"illustrated": "narration is shown",
                           "composed": "balanced and legible",
                           "varied": "not the same visual formula as neighbours",
                           "purposeful": "every element has an editorial reason"},
              "scenes": entries}
    state.write_json(review_path, review)
    return review


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("plan")
    ap.add_argument("--draft", default=None)
    ap.add_argument("--out-dir", default=None)
    ap.add_argument("--per-scene", type=int, default=2)
    ap.add_argument("--manifest-only", action="store_true")
    ap.add_argument("--command-only", action="store_true")
    ap.add_argument("--keep-review", action="store_true")
    ap.add_argument("--full-res-scene", action="append", default=[])
    ap.add_argument("--previs", action="store_true",
                    help="render actual scene JSX OPEN/KEY/MID evidence before a motion draft")
    ap.add_argument("--promoted", action="store_true",
                    help="with --previs, re-render approved roles after promotion for conformance")
    args = ap.parse_args()

    plan_path = state.project_path(state.project_root(__file__), args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    paths = state.video_paths(root, video)
    if args.previs:
        try:
            return render_previs(plan_path, plan, paths, args.command_only,
                                 args.manifest_only, args.promoted)
        except ValueError as exc:
            print(state.compact_result("HARD", hard=1, details=str(exc)), file=sys.stderr)
            return 1
    draft = state.project_path(root, args.draft) if args.draft else paths["draft"]
    out_dir = (state.project_path(root, args.out_dir) if args.out_dir
               else paths["review_frames"])
    promotion_timing = None
    if plan.get("schemaVersion") == FRESH_SCHEMA:
        _resolved_plan, _resolved_root, promotion_timing = beat_sync.resolve_contract(plan_path)
    manifest = sample_manifest(plan, out_dir, args.per_scene, args.full_res_scene,
                               promotion_timing)
    manifest_path = out_dir / "sample_manifest.json"
    targeted_path = out_dir / "targeted_full_res_manifest.json"
    state.write_json(manifest_path, manifest)
    state.write_json(targeted_path, {"schema": 1, "video": video,
                                     "composition": f"{video}Master",
                                     "requests": manifest["targetedFullResolution"],
                                     "singleProcessCommand": targeted_full_res_command(
                                         manifest, out_dir / "targeted_full_res")})
    if args.manifest_only:
        print(state.compact_result("CLOSED", changed=[manifest_path, targeted_path],
                                   details=manifest_path, receipt=state.digest(manifest)))
        return 0
    if not draft.is_file():
        print(state.compact_result("HARD", hard=1, changed=[manifest_path, targeted_path],
                                   details=f"missing current master draft: {draft}"), file=sys.stderr)
        return 1
    try:
        _contract = render_video.render_contract(plan_path, "draft", draft)
        draft_current, render_params = _contract[4], _contract[8]
    except ValueError:
        draft_current = False
    if not draft_current:
        print(state.compact_result("HARD", hard=1, changed=[manifest_path, targeted_path],
                                   details=("draft exists but its source/config receipt is stale or "
                                            f"missing: {draft}")), file=sys.stderr)
        return 1

    stale, current = stale_samples(root, video, plan_path, plan, manifest, render_params)
    changed = extract_stale(root, video, draft, stale, args.command_only)
    if args.command_only:
        print(json.dumps(changed, ensure_ascii=False))
        return 0
    entries = review_entries(manifest)
    thumbs = [(f"{x['scene']}@m{x['masterFrame']}", pathlib.Path(x["path"]))
              for x in manifest["samples"]]
    temporal_pages = build_review_pages(thumbs, paths["review_pages"], "temporal")
    summary_pages = build_review_pages(scene_summary_thumbs(entries), paths["review_pages"], "summary")
    if not temporal_pages or not summary_pages:
        raise RuntimeError("review extraction produced no paginated review surface")
    manifest["reviewPages"] = temporal_pages
    manifest["sceneSummaryPages"] = summary_pages
    state.write_json(manifest_path, manifest)
    temporal = pathlib.Path(temporal_pages[0]["path"])
    summary = pathlib.Path(summary_pages[0]["path"])
    review_path = paths["review"]
    review = complete_review_generation(
        manifest, manifest_path, review_path, temporal, summary, targeted_path,
        render_params, state.file_input(draft), args.keep_review)
    state.append_telemetry(root, video, {"stage": "review-extraction", "owner": "script",
                           "cache": f"{len(current)} hit/{len(stale)} miss",
                           "subprocessCount": len(extraction_batches([item[0] for item in stale])),
                           "affectedItems": len(stale), "output": str(temporal),
                           "reviewSampleCount": len(manifest["samples"]),
                           "reviewBatchCount": len(extraction_batches([item[0] for item in stale])),
                           "reviewPageCount": len(temporal_pages) + len(summary_pages)})
    print(state.compact_result("CLOSED", changed=[*changed,
                                *(pathlib.Path(item["path"]) for item in temporal_pages),
                                *(pathlib.Path(item["path"]) for item in summary_pages), review_path],
                               details=manifest_path, receipt=review["reviewGeneration"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())