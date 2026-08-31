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

import stage_state as state
import render_video

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required: py -3 -m pip install pillow")

VERSION = "master-draft-extraction-v2"
PREVIS_VERSION = "previs-scene-states-v1"
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


def build_previs_sheet(entries, out_path):
    """Rows are scenes; columns are OPEN / optional MID / KEY actual scene pixels."""
    if not entries:
        return 0
    roles = ("OPEN", "MID", "KEY") if any(x.get("role") == "MID" for x in entries) else ("OPEN", "KEY")
    thumb_w, thumb_h = 270, 480
    label_w, header_h, gap = 72, 50, 10
    scenes = list(dict.fromkeys(x.get("scene") for x in entries))
    sheet = Image.new("RGB", (label_w + len(roles) * (thumb_w + gap) + gap,
                              header_h + len(scenes) * (thumb_h + gap) + gap),
                      (22, 21, 18))
    draw = ImageDraw.Draw(sheet)
    for col, role in enumerate(roles):
        draw.text((label_w + col * (thumb_w + gap) + 8, 16), role, fill=(255, 106, 26))
    lookup = {(x.get("scene"), x.get("role")): pathlib.Path(x["path"]) for x in entries}
    for row, sid in enumerate(scenes):
        top = header_h + row * (thumb_h + gap)
        draw.text((16, top + 18), sid, fill=(245, 240, 228))
        for col, role in enumerate(roles):
            path = lookup.get((sid, role))
            if not path or not path.is_file():
                continue
            image = Image.open(path).convert("RGB")
            image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            left = label_w + col * (thumb_w + gap) + (thumb_w - image.width) // 2
            y = top + (thumb_h - image.height) // 2
            sheet.paste(image, (left, y))
    pathlib.Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    return len(entries)


def previs_frame_requests(plan, out_dir):
    video = plan.get("video", "V")
    requests = []
    for scene in plan.get("scenes") or []:
        sid = scene.get("id", "")
        states = scene.get("previsFrames") or {}
        if not isinstance(states, dict):
            continue
        for role in ("OPEN", "MID", "KEY"):
            if role not in states:
                continue
            frame = int(states[role])
            requests.append({"scene": sid, "role": role, "localFrame": frame,
                             "composition": f"{video}Scene{sid.lstrip('S')}",
                             "path": str(pathlib.Path(out_dir) / f"{sid}_{role}.png")})
    return requests


def _sequence_output(directory, frame):
    candidates = []
    for path in pathlib.Path(directory).glob("*.png"):
        try:
            suffix = int(path.stem.rsplit("-", 1)[-1])
        except ValueError:
            continue
        if suffix == frame:
            candidates.append(path)
    return candidates[0] if len(candidates) == 1 else None


def render_previs(plan_path, plan, out_dir, manifest_only=False, command_only=False, scene_ids=()):
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    out_dir = pathlib.Path(out_dir)
    if scene_ids:
        wanted = set(scene_ids)
        plan = {**plan, "scenes": [s for s in plan.get("scenes") or [] if s.get("id") in wanted]}
    requests = previs_frame_requests(plan, out_dir)
    by_scene = {}
    for item in requests:
        by_scene.setdefault(item["scene"], []).append(item)
    commands = []
    for sid, items in by_scene.items():
        temp = out_dir / "sequence" / sid
        frames = sorted({item["localFrame"] for item in items})
        commands.append(["npx", "remotion", "render", items[0]["composition"], str(temp),
                         "--sequence", "--frames=" + ",".join(map(str, frames)),
                         "--image-format=png", "--overwrite"])
    manifest_path = out_dir / "previs_frame_manifest.json"
    sheet_path = out_dir / "previs_contact_sheet.png"
    if command_only:
        print(json.dumps(commands, ensure_ascii=False))
        return 0
    out_dir.mkdir(parents=True, exist_ok=True)
    if not manifest_only:
        for command, (sid, items) in zip(commands, by_scene.items()):
            proc = subprocess.run(command, cwd=root, capture_output=True, text=True,
                                  encoding="utf-8", errors="replace",
                                  shell=(sys.platform == "win32"))
            if proc.returncode:
                detail = state.runtime_dir(root, video) / "logs" / f"previs-{sid}-failure.txt"
                detail.parent.mkdir(parents=True, exist_ok=True)
                detail.write_text((proc.stdout or "") + (proc.stderr or ""), encoding="utf-8")
                print(state.compact_result("HARD", hard=1, details=detail), file=sys.stderr)
                return proc.returncode
            temp = out_dir / "sequence" / sid
            for item in items:
                source = _sequence_output(temp, item["localFrame"])
                if not source:
                    print(state.compact_result(
                        "HARD", hard=1,
                        details=f"Remotion produced no unique PNG for {sid}/{item['role']} frame {item['localFrame']}"),
                        file=sys.stderr)
                    return 1
                target = pathlib.Path(item["path"])
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
        shutil.rmtree(out_dir / "sequence", ignore_errors=True)
    frames = []
    for item in requests:
        proof = state.file_input(item["path"])
        frames.append({**item, **({"size": proof.get("size"), "sha256": proof.get("sha256")}
                                 if not proof.get("missing") else {"missing": True})})
    if not manifest_only:
        build_previs_sheet(frames, sheet_path)
    manifest = {"schema": 1, "version": PREVIS_VERSION, "video": video,
                "contactSheet": str(sheet_path), "frames": frames}
    state.write_json(manifest_path, manifest)
    state.append_telemetry(root, video, {"stage": "previs-stills", "owner": "script",
                           "subprocessCount": 0 if manifest_only else len(commands),
                           "affectedItems": len(frames), "output": str(sheet_path),
                           "renderMode": "previs"})
    status = "CLOSED" if manifest_only or all(not x.get("missing") for x in frames) else "HARD"
    print(state.compact_result(status, hard=0 if status == "CLOSED" else 1,
                               changed=[manifest_path] if manifest_only else [
                                   *[x["path"] for x in frames], sheet_path, manifest_path],
                               details=sheet_path, receipt=state.digest(manifest)))
    return 0 if status == "CLOSED" else 1


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


def targeted_full_res_command(manifest, out_dir):
    """One Remotion process for all targeted master frames, never one per frame."""
    frames = sorted({int(x["masterFrame"]) for x in manifest.get("targetedFullResolution", [])})
    if not frames:
        return []
    return ["npx", "remotion", "render", manifest["composition"], str(out_dir),
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
    scene_files = [root / "src" / "scenes" / f"{video}Scene{s.get('id','S')[1:]}.jsx"
                   for s in relevant]
    files = render_video.local_dependency_files(scene_files)
    files += [root / "src" / f"{video}Master.jsx", root / "remotion.config.ts",
              root / "package.json"]
    words_name = pathlib.Path(str(plan.get("wordsFile") or "")).name
    suffix = words_name.replace("words", "").replace("_aligned.json", "")
    files += [root / "src" / f"captionData{suffix}.js",
              root / "src" / "scenes" / f"shared{suffix}.jsx"]
    for scene in relevant:
        for asset in scene.get("assets") or []:
            if asset.get("src"):
                files.append(root / "public" / asset["src"])
    local_contract = state.plan_slice(
        {"scenes": relevant}, scene_fields=("id", "startSec", "endSec", "durationInFrames",
                                             "masterStartFrame", "transitionIn", "assets"))["scenes"]
    return {"localScenes": local_contract,
            "files": [state.file_input(path) for path in files],
            "rootRegistration": render_video.selected_registration(root, f"{video}Master"),
            "alignedWords": state.json_input(root / str(plan.get("wordsFile") or "")),
            "renderParameters": render_params,
            "mapping": {"masterFrame": sample["masterFrame"], "fps": plan.get("fps", 30)}}


def stale_samples(root, video, plan_path, plan, manifest, render_params):
    stale, current = [], []
    for sample in manifest["samples"]:
        source_proof = sample_source_proof(root, plan_path, plan, sample, render_params)
        sample["sourceFingerprint"] = state.digest(source_proof)
        key = sample_identity(source_proof, manifest, sample)
        receipt_path = state.runtime_dir(root, video) / "receipts" / "review-samples" / f"{key}.json"
        inputs = {"source": source_proof, "sample": sample}
        tool = {"versions": {"extraction": VERSION}}
        ok, receipt = state.receipt_current(receipt_path, "review-sample", inputs, tool, {})
        (current if ok else stale).append((sample, key, receipt_path, inputs, tool, receipt))
    return stale, current


def extract_stale(root, video, draft, stale, command_only=False):
    temp_dir = state.runtime_dir(root, video) / "review-extract-temp"
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
              "howToFill": "Compare the one actual-master draft with approved previs. Judge only motion fidelity, evidence readability, narration sync, pacing and transition rhythm; missing/stale/blank evidence is hard.",
              "temporalReviewScope": ["motion preserves approved composition",
                                      "evidence stays readable while moving",
                                      "camera movement is purposeful",
                                      "pacing and transition rhythm are coherent",
                                      "motion creates no new visual defect"],
              "criteria": {"illustrated": "motion remains synchronized with narration",
                           "composed": "motion preserves approved composition and readability",
                           "varied": "pacing and transition rhythm let the sequence breathe",
                           "purposeful": "camera and internal motion have an editorial reason"},
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
                    help="render actual scene OPEN/MID/KEY states and one whole-video contact sheet")
    ap.add_argument("--scene", action="append", default=[],
                    help="with --previs, render only this scene id; repeat for multiple scenes")
    args = ap.parse_args()

    plan_path = pathlib.Path(args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    if args.previs:
        out_dir = pathlib.Path(args.out_dir) if args.out_dir else plan_path.parent / f"previs_frames_{video.lower()}"
        return render_previs(plan_path, plan, out_dir, args.manifest_only, args.command_only,
                             args.scene)
    draft = pathlib.Path(args.draft) if args.draft else root / "out" / f"{video}_draft.mp4"
    out_dir = pathlib.Path(args.out_dir) if args.out_dir else plan_path.parent / f"review_frames_{video.lower()}"
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
    review_path = pathlib.Path(str(plan_path).replace("scene_plan", "review"))
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