"""Deterministic specification tests for MEDIA-FIRST / PREVIS-PROMOTE."""

from __future__ import annotations

import argparse
import contextlib
import copy
import io
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

import beat_sync
import build_gate
import cleanup
import pipeline_contracts as contracts
import plan_gate
import render_review_sheet as review
import stage_state as state

HERE = pathlib.Path(__file__).resolve().parent
ROOT = state.project_root(__file__)


def result(rows, name, ok, detail=""):
    rows.append((name, bool(ok), str(detail or "")))


def image(path, color=(232, 232, 232), size=(270, 480)):
    from PIL import Image, ImageDraw
    path = pathlib.Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    value = Image.new("RGB", size, color)
    ImageDraw.Draw(value).rectangle((20, 30, size[0] - 20, size[1] - 40), fill=(255, 106, 26))
    value.save(path)
    return path


def project(tmp, scenes=2):
    (tmp / "input").mkdir(); (tmp / "public").mkdir(); (tmp / "src").mkdir()
    (tmp / "package.json").write_text(json.dumps({"dependencies": {
        "remotion": "4.0.507", "@remotion/cli": "4.0.507",
        "@remotion/media": "4.0.507"}}), encoding="utf-8")
    (tmp / "package-lock.json").write_text(json.dumps({"lockfileVersion": 3, "packages": {
        "node_modules/remotion": {"version": "4.0.507"},
        "node_modules/@remotion/cli": {"version": "4.0.507"},
        "node_modules/@remotion/media": {"version": "4.0.507"}}}), encoding="utf-8")
    (tmp / "remotion.config.ts").write_text("export {};", encoding="utf-8")
    metrics = tmp / ".claude" / "skills" / "vox-collage-video" / "data" / "font_metrics.json"
    metrics.parent.mkdir(parents=True); metrics.write_text('{"font":"fixture-v1"}', encoding="utf-8")
    primitives = tmp / "src" / "primitives"; primitives.mkdir()
    (primitives / "LayoutSafety.jsx").write_text(
        (ROOT / "src" / "primitives" / "LayoutSafety.jsx").read_text(encoding="utf-8"),
        encoding="utf-8")
    (primitives / "Captions.jsx").write_text(
        (ROOT / "src" / "primitives" / "Captions.jsx").read_text(encoding="utf-8"),
        encoding="utf-8")
    video = "V99"; paths = state.video_paths(tmp, video)
    for directory in (paths["input"], paths["assets"], paths["scenes"], paths["previs_frames"],
                      paths["previs_review_pages"], paths["promoted_previs_frames"],
                      paths["receipts"], paths["review_frames"], paths["review_pages"],
                      paths["runtime"] / "candidates" / "S1", paths["output"] / "final"):
        directory.mkdir(parents=True, exist_ok=True)
    words = []
    scene_rows = []
    for index in range(scenes):
        start = index * 2.0; sid = f"S{index + 1}"
        phrase = f"evidence {index + 1}"
        words += [["evidence", start + .2, start + .6, index], [str(index + 1), start + .6, start + 1, index]]
        scene_rows.append({"id": sid, "startSec": start, "endSec": start + 2,
                           "narrativeFunction": "evidence",
                           "viewerQuestion": f"What proves claim {index + 1}?",
                           "visualTransformation": "the authentic record becomes the decisive proof in view",
                           "contrastWithPrevious": "new evidence identity and editorial focus",
                           "comprehensionLoad": "moderate", "status": "planned",
                           "materials": [{"id": "record", "materialIntent": "document",
                               "anchorPhrase": phrase,
                               "mediaBrief": "Show the authentic official record page that proves this exact claim.",
                               "evidenceIdentity": f"official-record-{index + 1}",
                               "src": f"record-{index + 1}.png", "meaningBearing": True,
                               "role": "document", "locked": True,
                               "provenance": "official: fixture authority",
                               "selectionRationale": "This official page is the direct proof."}]})
    state.write_json(paths["words"], {"words": words})
    paths["audio"].parent.mkdir(parents=True, exist_ok=True); paths["audio"].write_bytes(b"audio")
    for index, scene in enumerate(scene_rows, start=1):
        asset = paths["assets"] / f"record-{index}.png"; image(asset)
        scene["materials"][0]["lockedSha256"] = state.hash_file(asset)
        source = state.scene_source(tmp, video, scene["id"], compatibility=False)
        source.write_text(
            f'import {{Img, staticFile}} from "remotion";\n'
            f'export const V99S{index:02d}=()=> <><Img src={{staticFile("V99/assets/record-{index}.png")}} />'
            f'<div style={{{{position:"absolute",top:200,left:80,fontSize:54}}}}>Evidence {index}</div></>;\n',
            encoding="utf-8")
    plan = {"schemaVersion": plan_gate.SCHEMA_VERSION, "video": video, "fps": 30,
            "width": 1080, "height": 1920, "wordsFile": "input/V99/words_aligned.json",
            "audioFile": "V99/audio.mp3", "status": "active", "shotlistApproved": True,
            "styleContract": {"font": "fixture"}, "scenes": scene_rows}
    state.write_json(paths["plan"], plan)
    for scene in scene_rows:
        state.sync_asset_manifest(paths["plan"])
        state.accept_asset(paths["plan"], state.asset_usage_id(scene, scene["materials"][0]))
    paths["entry"].write_text('import {registerRoot} from "remotion";import {PrevisRoot} from "./PrevisRoot";registerRoot(PrevisRoot);', encoding="utf-8")
    paths["previs_root"].write_text("export const PrevisRoot=()=>null;", encoding="utf-8")
    paths["master"].write_text("export const Master=()=>null;", encoding="utf-8")
    paths["captions"].write_text("export const CAPTION_LINES=[];", encoding="utf-8")
    paths["shared"].write_text("export const Captions=()=>null;", encoding="utf-8")
    return paths, plan


def run_plan(path):
    _plan, report = plan_gate.validate(path)
    return report.failures


def plan_checks(tmp, paths, plan, rows):
    clean = copy.deepcopy(plan)
    result(rows, "PLAN accepts canonical schema without template/backdrop/variant/timing",
           not run_plan(paths["plan"]) and all(field not in clean["scenes"][0]
           for field in plan_gate.FORBIDDEN_SCENE_FIELDS))
    result(rows, "duration derives mechanically",
           state.scene_duration(clean["scenes"][0], clean["fps"]) == 60)
    invalid = copy.deepcopy(clean); invalid["scenes"][0]["durationInFrames"] = 59
    state.write_json(paths["plan"], invalid)
    result(rows, "hand-authored duration is rejected",
           any("durationInFrames" in item for item in run_plan(paths["plan"])))
    diagram = copy.deepcopy(clean); diagram["scenes"][0]["materials"] = [{
        "id": "relation", "materialIntent": "diagram-exception",
        "anchorPhrase": "evidence 1",
        "mediaBrief": "Show the legal relationship between two otherwise identical entities."}]
    state.write_json(paths["plan"], diagram)
    result(rows, "diagram exception without justification fails",
           any("diagram-exception requires" in item for item in run_plan(paths["plan"])))
    diagram["scenes"][0]["materials"][0]["diagramJustification"] = (
        "No photograph, document, map, chart, video, or reconstruction can show the abstract legal dependency between the two identities.")
    state.write_json(paths["plan"], diagram)
    result(rows, "diagram exception with specific justification may proceed", not run_plan(paths["plan"]))
    fake = copy.deepcopy(clean); fake["scenes"][0]["materials"][0].pop("src")
    state.write_json(paths["plan"], fake)
    state.write_json(paths["receipts"] / "plan-approved.json", {})
    # PLAN is semantic; material bytes fail at ASSET LOCK / approve-previs boundary.
    result(rows, "photo/document material need may exist in semantic PLAN before lock", not run_plan(paths["plan"]))
    try:
        contracts.locked_asset_contract(tmp, "V99", fake["scenes"][0]); blocked = False
    except ValueError as exc:
        blocked = "requires a real locked file" in str(exc)
    result(rows, "fake real-material claim fails at ASSET LOCK boundary", blocked)
    state.write_json(paths["plan"], clean)


def media_checks(paths, plan, rows):
    asset_id = state.asset_usage_id(plan["scenes"][0], plan["scenes"][0]["materials"][0])
    manifest_path, manifest = state.sync_asset_manifest(paths["plan"])
    accepted = manifest["assets"][asset_id].get("acceptance") == "ACCEPTED"
    target = paths["assets"] / "record-1.png"; target.write_bytes(target.read_bytes() + b"replacement")
    _path, replaced = state.sync_asset_manifest(paths["plan"])
    result(rows, "same-name replacement cannot inherit acceptance",
           accepted and replaced["assets"][asset_id].get("acceptance") == "PENDING")
    # Restore bytes and plan hash.
    image(target); plan["scenes"][0]["materials"][0]["lockedSha256"] = state.hash_file(target)
    state.write_json(paths["plan"], plan); state.sync_asset_manifest(paths["plan"]); state.accept_asset(paths["plan"], asset_id)
    external = copy.deepcopy(plan["scenes"][0]["materials"][0]); external["provenance"] = "https://example.test/source"; external.pop("license", None); external["retrievedAt"] = "2026-09-02T00:00:00Z"
    try:
        contracts.validate_media_metadata(plan["scenes"][0], external, target); license_block = False
    except ValueError as exc:
        license_block = "license" in str(exc)
    official = copy.deepcopy(external); official["provenance"] = "official: court archive"; official.pop("retrievedAt", None)
    try:
        contracts.validate_media_metadata(plan["scenes"][0], official, target); official_ok = True
    except ValueError:
        official_ok = False
    result(rows, "external non-PDF media requires compact license metadata", license_block)
    result(rows, "official/local authoritative provenance is honest without fake URL metadata", official_ok)
    result(rows, "asset manifest remains canonical and byte hashed",
           manifest_path == paths["asset_manifest"] and state.hash_file(target) == plan["scenes"][0]["materials"][0]["lockedSha256"])


def timing_checks(paths, plan, rows):
    contract = beat_sync.resolve_plan(plan, beat_sync.load_words(paths["words"]))
    result(rows, "meaning-bearing anchor resolves to scene-local frame",
           contract["beats"]["S1:record"]["frame"] == 6)
    manual = copy.deepcopy(plan); manual["scenes"][0]["materials"][0]["anchorPhrase"] = "manual — visual beat bridges a deliberate silent pause"
    resolved = beat_sync.resolve_plan(manual, beat_sync.load_words(paths["words"]))
    result(rows, "manual reveal timing with compact reason is represented", "S1:record" in resolved["manual"])
    manual["scenes"][0]["materials"][0]["anchorPhrase"] = "manual — vague"
    try:
        beat_sync.resolve_plan(manual, beat_sync.load_words(paths["words"])); blocked = False
    except ValueError:
        blocked = True
    result(rows, "manual reveal timing without specific reason fails", blocked)
    result(rows, "ambient camera motion has no speech-anchor requirement",
           not build_gate.promotion_timing_problems(paths["plan"], plan, plan["scenes"][0],
               '<MediaPlate motion={{from:0,to:60}} />'))
    timing_path, _ = beat_sync.write_timing(paths["plan"])
    source = state.scene_source(paths["root"], "V99", "S1")
    before = source.resolve()
    promoted = source.read_text(encoding="utf-8") + '\n// PROMOTE: same source receives temporal behavior\n'
    source.write_text(promoted, encoding="utf-8")
    result(rows, "PROMOTE preserves same production JSX path", before == source.resolve() and timing_path.is_file())
    source.write_text(promoted.replace("\n// PROMOTE: same source receives temporal behavior\n", ""), encoding="utf-8")


def baseline_manifest(paths, plan):
    frames = []
    for scene in plan["scenes"]:
        source = state.scene_source(paths["root"], plan["video"], scene["id"])
        for role, local in (("OPEN", 0), ("KEY", 30)):
            path = image(paths["previs_frames"] / f"{state.scene_stem(scene['id'])}_{role}.png")
            frames.append({"scene": scene["id"], "role": role, "localFrame": local,
                           "path": str(path), "sha256": state.hash_file(path),
                           "sourceSha256": state.hash_file(source)})
    pages = review.build_review_pages([(f["scene"] + " " + f["role"], pathlib.Path(f["path"]))
                                       for f in frames], paths["previs_review_pages"], "previs")
    manifest = {"schema": 1, "version": review.PREVIS_VERSION, "video": plan["video"],
                "layoutSafetyVersion": "rendered-dom-geometry-v1", "frames": frames,
                "reviewPages": pages}
    state.write_json(paths["previs_manifest"], manifest)
    return manifest


def conformance_checks(paths, plan, rows):
    baseline_manifest(paths, plan)
    original_gate = contracts.run_plan_gate; contracts.run_plan_gate = lambda _path: None
    try:
        contracts.approve_plan(paths["plan"])
        _path, _receipt = contracts.approve_previs(paths["plan"], art_direction="Human approves actual media composition and hierarchy.")
    finally:
        contracts.run_plan_gate = original_gate
    requests = review.previs_requests(plan, paths, promoted=True)
    telemetry_start = paths["economics"].stat().st_size if paths["economics"].is_file() else 0
    review.render_previs(paths["plan"], plan, paths, manifest_only=True, promoted=True)
    telemetry = json.loads(paths["economics"].read_text(encoding="utf-8")[telemetry_start:].splitlines()[-1])
    result(rows, "zero changed scenes requests zero Remotion still subprocesses",
           requests == [] and telemetry["subprocessCount"] == 0 and telemetry["renderedSceneCount"] == 0)
    records = review.conformance_scene_records(plan, paths, set())
    result(rows, "unchanged baseline reuse is explicit and fingerprint-identical",
           all(item["status"] == "reused" and item["approvedFingerprint"] == item["currentFingerprint"] for item in records))
    problems, comparisons = build_gate.previs_baseline_check(
        paths["plan"], plan, paths["previs_manifest"], paths["promoted_previs_manifest"])
    result(rows, "unchanged baseline reuse is byte-identical and recorded without render",
           not problems and comparisons and all(item.get("identity") == "approved-baseline-reused" and
           item.get("sha256") == state.hash_file(pathlib.Path(item["approved"])) for item in comparisons))
    primitive = paths["root"] / "src" / "primitives" / "LayoutSafety.jsx"
    primitive.write_text(primitive.read_text(encoding="utf-8") + "\n// dependency change\n", encoding="utf-8")
    changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "changed imported primitive invalidates all importing scenes",
           len({item["scene"] for item in changed}) == len(plan["scenes"]))
    primitive.write_text(primitive.read_text(encoding="utf-8").replace("\n// dependency change\n", ""), encoding="utf-8")
    source = state.scene_source(paths["root"], "V99", "S1")
    source.write_text(source.read_text(encoding="utf-8") + "\n// temporal polish\n", encoding="utf-8")
    changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "one changed scene renders only its approved states",
           len(changed) == 2 and {item["scene"] for item in changed} == {"S1"})
    calls = []
    original_subprocess = review.subprocess.run
    def fake_still(command, **_kwargs):
        calls.append(command); image(pathlib.Path(command[5]))
        return type("Proc", (), {"returncode": 0, "stdout": "", "stderr": ""})()
    review.subprocess.run = fake_still
    try:
        review.render_previs(paths["plan"], plan, paths, promoted=True)
    finally:
        review.subprocess.run = original_subprocess
    result(rows, "one changed scene executes only two approved-state still subprocesses",
           len(calls) == 2 and all(command[4] == "V99S01" for command in calls))
    source.write_text(source.read_text(encoding="utf-8").replace("\n// temporal polish\n", ""), encoding="utf-8")
    config = paths["root"] / "remotion.config.ts"; config.write_text("export {}; // global change", encoding="utf-8")
    changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "global render config invalidates all affected scenes",
           len({item["scene"] for item in changed}) == len(plan["scenes"]))
    config.write_text("export {};", encoding="utf-8")
    metrics = paths["root"] / ".claude" / "skills" / "vox-collage-video" / "data" / "font_metrics.json"
    metrics.write_text('{"font":"fixture-v2"}', encoding="utf-8")
    font_changed = review.previs_requests(plan, paths, promoted=True)
    contract = state.scene_dependency_contract(paths["root"], plan, plan["scenes"][0], build_gate.PIXEL_VERSION)
    result(rows, "changed font identity invalidates all affected scenes",
           len({item["scene"] for item in font_changed}) == len(plan["scenes"]) and
           contract["pixelConformanceToolVersion"] == build_gate.PIXEL_VERSION)


def review_checks(tmp, rows):
    tmp.mkdir(parents=True, exist_ok=True)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        result(rows, "review scale fixture has ffmpeg", False, "ffmpeg is required")
        return
    draft = tmp / "synthetic.mp4"
    proc = subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                           "-f", "lavfi", "-i", "color=c=black:s=64x64:r=30:d=7",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", str(draft)],
                          capture_output=True, text=True)
    if proc.returncode:
        result(rows, "review scale synthetic draft generation", False, proc.stderr); return
    samples = [{"id": f"sample-{frame}", "scene": "S1", "localFrame": frame,
                "masterFrame": frame, "path": str(tmp / "frames" / f"frame-{frame}.png")}
               for frame in range(186)]
    batches = review.extraction_batches(samples)
    temp = tmp / "extract"; temp.mkdir()
    exact = True
    for index, batch in enumerate(batches):
        command, _content = review.extraction_command(draft, batch, None, temp)
        proc = subprocess.run(command, capture_output=True, text=True)
        exact = exact and proc.returncode == 0 and review.verify_batch_outputs(temp, batch)["exact"]
    produced = sorted(int(path.stem.split("-")[-1]) for path in temp.glob("master-*.png"))
    result(rows, "review supports at least 186 requested samples", len(samples) == 186)
    result(rows, "review uses deterministic bounded batches", len(batches) == 5 and max(map(len, batches)) <= 40)
    filter_lengths = [len(review.extraction_command(draft, batch, None, temp)[1]) for batch in batches]
    result(rows, "review uses bounded filter graphs, never one giant shell expression",
           max(filter_lengths) < 5000 and len(batches) > 1)
    result(rows, "every batch produced exactly requested master frames", exact and produced == list(range(186)))
    thumbs = [(f"m{frame}", temp / f"master-{frame}.png") for frame in range(186)]
    pages = review.build_review_pages(thumbs, tmp / "pages", "temporal") if exact else []
    result(rows, "review manifest ordering is preserved by pages",
           [label for page in pages for label in page["labels"]] == [label for label, _ in thumbs])
    result(rows, "every review proxy page is at most 4 MP",
           pages and max(item["width"] * item["height"] for item in pages) <= review.MAX_PAGE_PIXELS)
    result(rows, "no mega-sheet is generated", not (tmp / "contact_sheet.png").exists())


def layout_fixture(root, safe):
    directory = pathlib.Path(tempfile.mkdtemp(prefix="layout-fixture-", dir=root))
    entry = directory / "index.ts"
    scene = directory / "Root.jsx"
    entry.write_text('import {registerRoot} from "remotion";import {Root} from "./Root";registerRoot(Root);', encoding="utf-8")
    primitive = "../src/primitives/LayoutSafety"
    top = 300 if safe else 1450
    label = "SAFE JSX" if safe else "CAPTION COLLISION"
    scene.write_text(
        'import {AbsoluteFill,Composition} from "remotion";\n'
        f'import {{LayoutSafety}} from {json.dumps(primitive)};\n'
        f'const Bespoke=()=> <AbsoluteFill><div style={{{{position:"absolute",top:{top},left:80,fontSize:64,fontWeight:800}}}}>{label}</div></AbsoluteFill>;\n'
        'const Wrapped=()=> <LayoutSafety><Bespoke/></LayoutSafety>;\n'
        'export const Root=()=> <Composition id="LayoutFixture" component={Wrapped} durationInFrames={30} fps={30} width={1080} height={1920}/>;', encoding="utf-8")
    output = directory / "frame.png"
    proc = subprocess.run(["npx", "remotion", "still", str(entry), "LayoutFixture", str(output),
                           "--frame=0", "--overwrite"], cwd=root, capture_output=True, text=True,
                          shell=(sys.platform == "win32"), timeout=180)
    return proc, output, directory


def layout_checks(rows):
    safe_proc, safe_output, safe_dir = layout_fixture(ROOT, True)
    bad_proc, _bad_output, bad_dir = layout_fixture(ROOT, False)
    try:
        result(rows, "ordinary direct bespoke JSX layout passes real browser geometry",
               safe_proc.returncode == 0 and safe_output.is_file(), safe_proc.stderr[-500:])
        bad_text = (bad_proc.stdout or "") + (bad_proc.stderr or "")
        result(rows, "direct bespoke caption-region collision is caught",
               bad_proc.returncode != 0 and "VIDEOAGENT_LAYOUT" in bad_text, bad_text[-500:])
        result(rows, "layout fixture is independent of Card/Node component names",
               "Card" not in (safe_dir / "Root.jsx").read_text(encoding="utf-8") and
               "Node" not in (bad_dir / "Root.jsx").read_text(encoding="utf-8"))
    finally:
        shutil.rmtree(safe_dir, ignore_errors=True); shutil.rmtree(bad_dir, ignore_errors=True)


def source_scout_checks(rows):
    path = ROOT / ".claude" / "agents" / "source-scout.md"
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    result(rows, "Source Scout uses native project agent convention", path.is_file())
    result(rows, "Source Scout compact brief excludes full plan/transcript",
           "approximately 2 KB or less" in text and "Reject whole transcripts" in text)
    result(rows, "Source Scout candidate cap is eight", "at most 8 candidates" in text)
    result(rows, "Source Scout retry cap is one", "at most one refined" in text)
    result(rows, "Source Scout write scope excludes canonical production paths",
           "input/.videoagent/V<N>/candidates/<sceneId>/" in text and
           "Never write `src/`, `input/V<N>/`, or `public/V<N>/`" in text)
    result(rows, "Source Scout cannot recursively spawn agents",
           "may not call" in text and "spawn another agent" in text)


def cleanup_checks(tmp, paths, plan, rows):
    rejected = paths["runtime"] / "candidates" / "S1" / "rejected.jpg"; image(rejected)
    proxy = paths["previs_review_pages"] / "obsolete.jpg"; image(proxy)
    temp = paths["runtime"] / "review-extract-temp" / "master-1.png"; image(temp)
    promoted = paths["promoted_previs_frames"] / "S01_OPEN.png"; image(promoted)
    paths["final"].write_bytes(b"final")
    before = {path: state.hash_file(path) for path in (rejected, proxy, temp, promoted,
              paths["final"], paths["assets"] / "record-1.png")}
    dry = cleanup.cleanup_plan(tmp, paths["plan"], "PROMOTED_CONFORMANT")
    after = {path: state.hash_file(path) for path in before}
    targets = {pathlib.Path(item["path"]).resolve() for item in dry["targets"]}
    result(rows, "cleanup dry-run changes nothing", before == after)
    result(rows, "rejected candidates are disposable after PREVIS approval", rejected.resolve() in targets)
    result(rows, "temporary extraction and promoted frames are deterministic disposables",
           temp.resolve() in targets and promoted.resolve() in targets)
    result(rows, "locked selected asset is never proposed", (paths["assets"] / "record-1.png").resolve() not in targets)
    result(rows, "canonical PREVIS baseline evidence is retained",
           all(path.resolve() not in targets for path in paths["previs_frames"].glob("*.png")))
    result(rows, "final deliverable is retained", paths["final"].resolve() not in targets)


def architecture_checks(paths, plan, rows):
    lifecycle = contracts.CANONICAL_STAGES
    result(rows, "six-stage product lifecycle is represented coherently",
           lifecycle == ("PLAN", "PREVIS", "PROMOTE", "REVIEW", "CORRECTION", "FINAL"))
    primitives = {path.name for path in (ROOT / "src" / "primitives").glob("*.jsx")}
    expected = {"DocumentEvidence.jsx", "MapGraphic.jsx", "DataChart.jsx", "Captions.jsx",
                "media.jsx", "Reveal.jsx", "RelationDiagram.jsx", "LayoutSafety.jsx"}
    result(rows, "canonical primitive surface is compact and complete", primitives == expected)
    retired = {"Card", "Node", "Arrow", "Person", "Money", "Phone", "Vehicle", "Chain"}
    result(rows, "generic illustrative families are absent from primitive filenames",
           not retired.intersection({pathlib.Path(name).stem for name in primitives}))
    deleted = ("asset_manifest.py", "check_overlap.py", "init_video.py", "new_video.py",
               "scene_plan_check.py", "generate_sfx.py", "baseline_gate.py", "block_gate.py",
               "asset_gate.py", "pixel_gate.py")
    result(rows, "deleted architecture stays absent", all(not (HERE / name).exists() for name in deleted))
    result(rows, "orphan skill transcript data is absent",
           not (HERE.parent / "data" / "transcript.json").exists())
    result(rows, "start_video is sole canonical lifecycle entry", (HERE / "start_video.py").is_file())
    telemetry = state.append_telemetry(paths["root"], plan["video"], {
        "stage": "fixture", "mainTokens": 1234, "context": 5678})
    record = json.loads(telemetry.read_text(encoding="utf-8").splitlines()[-1])
    result(rows, "token/context telemetry remains truthful UNKNOWN",
           record["mainTokens"] == "UNKNOWN" and record["context"] == "UNKNOWN")


def checks(tmp):
    rows = []
    paths, plan = project(tmp)
    plan_checks(tmp, paths, plan, rows)
    media_checks(paths, plan, rows)
    timing_checks(paths, plan, rows)
    conformance_checks(paths, plan, rows)
    review_checks(tmp / "review-scale", rows)
    layout_checks(rows)
    source_scout_checks(rows)
    cleanup_checks(tmp, paths, plan, rows)
    architecture_checks(paths, plan, rows)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="media-first-spec-") as directory:
        try:
            rows = checks(pathlib.Path(directory))
        except Exception as exc:  # noqa: BLE001
            rows = [("selftest completed without crashing", False,
                     f"{type(exc).__name__}: {exc}")]
    failed = [row for row in rows if not row[1]]
    if args.json:
        print(json.dumps({"passed": not failed, "cases": [
            {"name": name, "ok": ok, "detail": detail} for name, ok, detail in rows]}, indent=2))
    else:
        for name, ok, detail in rows:
            print(f"{'OK  ' if ok else 'FAIL'} {name}")
            if detail and (args.verbose or not ok):
                print(f"     {detail}")
        print(f"\n{'PASSED' if not failed else 'FAILED'} ({len(rows) - len(failed)}/{len(rows)} specification checks)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())