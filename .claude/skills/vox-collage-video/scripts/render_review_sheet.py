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

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: py -3 -m pip install pillow")

VERSION = "master-draft-extraction-v2"
PREVIS_VERSION = "actual-production-scene-stills-v2"
SETTLE = 20


def build_sheet(thumbs, out_path, max_cols=6):
    """Build another view of already-extracted evidence; never renders frames."""
    if not thumbs:
        return 0
    images = [(label, Image.open(path).convert("RGB")) for label, path in thumbs]
    w, h = images[0][1].size
    cols = min(max_cols, len(images))
    rows = (len(images) + cols - 1) // cols
    cw, ch = w + 10, h + 30
    sheet = Image.new("RGB", (cols * cw, rows * ch), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (label, image) in enumerate(images):
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(image, (x + 5, y + 5))
        draw.text((x + 5, y + h + 10), label, fill=(0, 0, 0))
    pathlib.Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=88)
    return len(images)


def _declared_previs_frames(scene):
    """OPEN/KEY defaults plus MID only when the semantic plan explicitly asks."""
    duration = max(1, int(scene.get("durationInFrames") or 1))
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
    default_key = min(duration - 1, max(events or [max(0, duration // 2)]) + SETTLE)
    values.setdefault("KEY", int(scene.get("previsKeyFrame", default_key)))
    if scene.get("previsMidRequired") is True:
        values.setdefault("MID", int(scene.get("previsMidFrame", duration // 2)))
    return [(role, max(0, min(duration - 1, frame)))
            for role, frame in (("OPEN", values["OPEN"]), ("KEY", values["KEY"]),
                                ("MID", values.get("MID"))) if frame is not None]


def previs_requests(plan, paths, promoted=False):
    video = plan.get("video", "V")
    target_dir = paths["promoted_previs_frames"] if promoted else paths["previs_frames"]
    if promoted:
        baseline = state.read_json(paths["previs_manifest"], {})
        requests = [{"scene": item.get("scene"), "role": str(item.get("role") or "").upper(),
                     "localFrame": int(item.get("localFrame", item.get("frame", 0)))}
                    for item in baseline.get("frames") or []]
    else:
        requests = [{"scene": scene.get("id"), "role": role, "localFrame": frame}
                    for scene in plan.get("scenes") or []
                    for role, frame in _declared_previs_frames(scene)]
    for item in requests:
        stem = state.scene_stem(item["scene"])
        source = state.scene_source(paths["root"], video, item["scene"])
        item["composition"] = f"{video}{stem}"
        item["path"] = str(target_dir / f"{stem}_{item['role']}.png")
        item["sourcePath"] = str(source)
        item["sourceSha256"] = state.hash_file(source) if source.is_file() else None
    return requests


def previs_command(item, entry="src/index.ts"):
    return ["npx", "remotion", "still", str(entry), item["composition"], item["path"],
            f"--frame={item['localFrame']}", "--image-format=png", "--overwrite"]


def render_previs(plan_path, plan, paths, command_only=False, manifest_only=False,
                  promoted=False):
    root = state.project_root(plan_path)
    requests = previs_requests(plan, paths, promoted)
    if not requests:
        raise ValueError("semantic plan has no scenes to render as PREVIS")
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
    manifest = {"schema": 1, "version": PREVIS_VERSION, "video": plan.get("video"),
                "source": "actual production-compatible scene JSX", "frames": frames}
    changed = []
    sheet_wall_ms = 0.0
    if not promoted and not manifest_only:
        thumbs = [(f"{item['scene']} {item['role']} @f{item['localFrame']}", pathlib.Path(item["path"]))
                  for item in requests]
        sheet_start = time.perf_counter()
        build_sheet(thumbs, paths["contact_sheet"], max_cols=4)
        sheet_wall_ms = round((time.perf_counter() - sheet_start) * 1000, 2)
        manifest["contactSheet"] = str(paths["contact_sheet"])
        manifest["contactSheetSha256"] = state.hash_file(paths["contact_sheet"])
        changed.append(paths["contact_sheet"])
    state.write_json(manifest_path, manifest)
    changed.append(manifest_path)
    if not command_only:
        output_path = paths["contact_sheet"] if not promoted and not manifest_only else manifest_path
        state.append_telemetry(root, plan.get("video", "V"), {
            "stage": "previs-capture", "owner": "script",
            "mode": "promoted-previs" if promoted else "baseline-previs",
            "sceneCount": len({item["scene"] for item in requests}),
            "requestedStateCount": len(requests), "subprocessCount": subprocess_count,
            "renderWallMs": render_wall_ms, "contactSheetAssemblyMs": sheet_wall_ms,
            "cache": "manifest-only" if manifest_only else "miss",
            "affectedItems": len(requests), "output": str(output_path),
            "outputIdentity": state.file_input(output_path),
        })
    print(state.compact_result("CLOSED" if not manifest_only else "OPEN",
                               changed=changed, details=manifest_path,
                               receipt=state.digest(manifest)))
    return 0


def scene_summary_thumbs(review_entries):
    return [(entry.get("id", ""), pathlib.Path(entry["frame"]))
            for entry in review_entries if entry.get("frame")]


def local_sample_frames(scene, fps=30, per_scene=2, settle=SETTLE):
    total = int(scene.get("durationInFrames") or
                round((scene.get("endSec", 0) - scene.get("startSec", 0)) * fps))
    if total <= 1:
        return []
    beats = sorted({int(e.get("frame") or 0) for e in scene.get("visualEvents") or []})
    picks = {min(total - 2, b + settle) for b in beats if b + settle < total}
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
    for asset in scene.get("assets") or []:
        if asset.get("role") == "document" or asset.get("evidenceRegions"):
            return True
        if asset.get("fullResolutionEvidence") is True or asset.get("pixelSensitive") is True:
            return True
    return False


def sample_manifest(plan, out_dir, per_scene=2, manual_full_res=()):
    fps = int(plan.get("fps", 30))
    video = plan.get("video", "V")
    starts = scene_master_starts(plan)
    samples, targeted = [], []
    manual = set(manual_full_res or [])
    for scene in plan.get("scenes") or []:
        sid = scene.get("id", "")
        scene_samples = []
        for frame in local_sample_frames(scene, fps, per_scene):
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


def extraction_command(draft, samples, temp_pattern):
    frames = [int(s["masterFrame"]) for s in samples]
    if not frames:
        return []
    expr = "+".join(f"eq(n\\,{f})" for f in frames)
    return ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(draft),
            "-vf", f"select='{expr}'", "-fps_mode", "passthrough", "-start_number", "0",
            str(temp_pattern)]


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
        for asset in scene.get("assets") or []:
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
    temp_pattern = temp_dir / "frame_%04d.png"
    cmd = extraction_command(draft, [x[0] for x in stale], temp_pattern)
    if command_only:
        return cmd
    if not cmd:
        return []
    temp_dir.mkdir(parents=True, exist_ok=True)
    for old in temp_dir.glob("frame_*.png"):
        old.unlink()
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", shell=(sys.platform == "win32"))
    if proc.returncode:
        raise RuntimeError(((proc.stderr or proc.stdout) or "ffmpeg extraction failed").strip())
    produced = sorted(temp_dir.glob("frame_*.png"))
    if len(produced) != len(stale):
        raise RuntimeError(f"ffmpeg produced {len(produced)}/{len(stale)} requested frames")
    changed = []
    for source, (sample, _key, receipt_path, inputs, tool, _old) in zip(produced, stale):
        dest = pathlib.Path(sample["path"])
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), dest)
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
    manifest = sample_manifest(plan, out_dir, args.per_scene, args.full_res_scene)
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
    temporal = out_dir / "contact_sheet.jpg"
    summary = out_dir / "scene_summary_sheet.jpg"
    build_sheet(thumbs, temporal)
    build_sheet(scene_summary_thumbs(entries), summary)
    review_path = paths["review"]
    review = complete_review_generation(
        manifest, manifest_path, review_path, temporal, summary, targeted_path,
        render_params, state.file_input(draft), args.keep_review)
    state.append_telemetry(root, video, {"stage": "review-extraction", "owner": "script",
                           "cache": f"{len(current)} hit/{len(stale)} miss",
                           "subprocessCount": 1 if stale else 0,
                           "affectedItems": len(stale), "output": str(temporal)})
    print(state.compact_result("CLOSED", changed=[*changed, temporal, summary, review_path],
                               details=manifest_path, receipt=review["reviewGeneration"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())