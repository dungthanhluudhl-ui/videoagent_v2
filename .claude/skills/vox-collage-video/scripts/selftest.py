"""Deterministic specification tests for the clean V18-rebuilt workflow."""

from __future__ import annotations

import argparse
import contextlib
import copy
import io
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import beat_sync
import build_gate
import cleanup
import fetch_pexels
import hook_gate
import pipeline_contracts as contracts
import plan_gate
import process_cutout
import render_review_sheet as review
import stage_state as state
import start_video
import text_gate

HERE = pathlib.Path(__file__).resolve().parent
ROOT = state.project_root(__file__)
REMOTION_CLI = ROOT / "node_modules" / "@remotion" / "cli" / "remotion-cli.js"


def remotion_still(entry, composition, output):
    return subprocess.run(
        ["node", str(REMOTION_CLI), "still", str(entry), composition, str(output),
         "--frame=0", "--overwrite", "--log=error"],
        cwd=ROOT, capture_output=True, text=True, timeout=180)


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
    (primitives / "DocumentEvidence.jsx").write_text(
        (ROOT / "src" / "primitives" / "DocumentEvidence.jsx").read_text(encoding="utf-8"),
        encoding="utf-8")
    fixture_font = tmp / "public" / "fixture-font.woff2"
    fixture_font.write_bytes(b"fixture-font-v1")
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
                           "narrativeFunction": "source orientation",
                           "viewerQuestion": f"Which official record page is source {index + 1}?",
                           "visualTransformation": "an unidentified archive page becomes a recognizable official source",
                           "contrastWithPrevious": "new source identity and editorial focus",
                           "comprehensionLoad": "moderate",
                           "visualTreatment": "authentic full-page document source context",
                           "documentEvidenceRequirement": "context",
                           "status": "planned",
                           "materials": [{"id": "record", "materialIntent": "document",
                               "documentEvidenceMode": "context",
                               "anchorPhrase": phrase,
                               "mediaBrief": "Show the full official record page so its source and page identity are clear.",
                               "evidenceIdentity": f"official-record-{index + 1}",
                               "src": f"record-{index + 1}.png", "meaningBearing": True,
                               "role": "document", "locked": True,
                               "provenance": "official: fixture authority",
                               "selectionRationale": "This full official page establishes source identity and context."}]})
    state.write_json(paths["words"], {"words": words})
    paths["audio"].parent.mkdir(parents=True, exist_ok=True); paths["audio"].write_bytes(b"audio")
    for index, scene in enumerate(scene_rows, start=1):
        asset = paths["assets"] / f"record-{index}.png"; image(asset)
        scene["materials"][0]["lockedSha256"] = state.hash_file(asset)
        source = state.scene_source(tmp, video, scene["id"], compatibility=False)
        source.write_text(
            f'import {{Img, staticFile}} from "remotion";\n'
            + ('import {DocumentEvidence} from "../../../primitives/DocumentEvidence.jsx";\n'
               if index == 1 else "")
            +
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


def run_plan_report(path):
    return plan_gate.validate(path)[1]


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
    diagram["scenes"][0].pop("documentEvidenceRequirement")
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
    missing_requirement = copy.deepcopy(clean)
    missing_requirement["scenes"][0].pop("documentEvidenceRequirement")
    state.write_json(paths["plan"], missing_requirement)
    result(rows, "fresh document scene requires documentEvidenceRequirement",
           any("documentEvidenceRequirement is required" in item
               for item in run_plan(paths["plan"])))
    invalid_requirement = copy.deepcopy(clean)
    invalid_requirement["scenes"][0]["documentEvidenceRequirement"] = "summary"
    state.write_json(paths["plan"], invalid_requirement)
    result(rows, "documentEvidenceRequirement accepts only claim or context",
           any("documentEvidenceRequirement must be claim or context" in item
               for item in run_plan(paths["plan"])))
    missing_mode = copy.deepcopy(clean)
    missing_mode["scenes"][0]["materials"][0].pop("documentEvidenceMode")
    state.write_json(paths["plan"], missing_mode)
    result(rows, "fresh document material requires documentEvidenceMode",
           any("documentEvidenceMode" in item for item in run_plan(paths["plan"])))
    invalid_mode = copy.deepcopy(clean)
    invalid_mode["scenes"][0]["materials"][0]["documentEvidenceMode"] = "summary"
    state.write_json(paths["plan"], invalid_mode)
    result(rows, "documentEvidenceMode accepts only claim or context",
           any("must be claim or context" in item for item in run_plan(paths["plan"])))
    context = copy.deepcopy(clean)
    context["scenes"][0]["materials"][0].pop("evidenceIdentity")
    context["scenes"][0]["materials"][0].pop("evidenceRegions", None)
    state.write_json(paths["plan"], context)
    result(rows, "context requirement with contextual document material passes",
           not run_plan(paths["plan"]))
    claim_missing_identity = copy.deepcopy(clean)
    claim_missing_identity["scenes"][0]["materials"][0]["documentEvidenceMode"] = "claim"
    claim_missing_identity["scenes"][0]["materials"][0].pop("evidenceIdentity")
    claim_missing_identity["scenes"][0]["materials"][0]["evidenceRegions"] = [
        {"anchorPhrase": "evidence 1", "region": [0.08, 0.18, 0.84, 0.12]}]
    state.write_json(paths["plan"], claim_missing_identity)
    result(rows, "claim document mode requires evidenceIdentity",
           any("requires evidenceIdentity" in item for item in run_plan(paths["plan"])))
    claim_missing_regions = copy.deepcopy(clean)
    claim_missing_regions["scenes"][0]["materials"][0]["documentEvidenceMode"] = "claim"
    claim_missing_regions["scenes"][0]["materials"][0].pop("evidenceRegions", None)
    state.write_json(paths["plan"], claim_missing_regions)
    result(rows, "claim document mode requires non-empty valid evidenceRegions",
           any("requires non-empty evidenceRegions" in item for item in run_plan(paths["plan"])))
    claim_invalid_region = copy.deepcopy(clean)
    claim_invalid_region["scenes"][0]["materials"][0]["documentEvidenceMode"] = "claim"
    claim_invalid_region["scenes"][0]["materials"][0]["evidenceRegions"] = [
        {"anchorPhrase": "evidence 1", "region": [0.8, 0.2, 0.4, 0.2]}]
    state.write_json(paths["plan"], claim_invalid_region)
    result(rows, "claim document region must remain inside authentic raster",
           any("normalized [x,y,w,h]" in item for item in run_plan(paths["plan"])))
    component = copy.deepcopy(clean); component["scenes"][0]["visualTreatment"] = "DocumentEvidence"
    state.write_json(paths["plan"], component)
    result(rows, "editorial visualTreatment is not a JSX component selector",
           any("component selector" in item for item in run_plan(paths["plan"])))

    # Source authority and visual treatment are independent editorial decisions.
    recount = copy.deepcopy(clean)
    scene = recount["scenes"][0]
    scene.update({
        "narrativeFunction": "narrative recount of detention and phone pressure",
        "viewerQuestion": "How did the location turn into confinement and family pressure?",
        "visualTransformation": "arrival at a location becomes confinement, then a call creates family pressure",
        "visualTreatment": "contextual photographic reconstruction of the place and action",
        "materials": [{"id": "place", "materialIntent": "reconstruction",
                       "anchorPhrase": "evidence 1",
                       "mediaBrief": "Show a truthful photographic place plate where arrival can become confinement.",
                       "reconstructionLabel": "EDITORIAL RECONSTRUCTION"}],
    })
    scene.pop("documentEvidenceRequirement")
    state.write_json(paths["plan"], recount)
    result(rows, "narrative recount may choose contextual or reconstruction depiction",
           not run_plan(paths["plan"]))
    recount["sourceAuthority"] = ["official-court-record.pdf"]
    state.write_json(paths["plan"], recount)
    result(rows, "official source existence does not mechanically require document treatment",
           not run_plan(paths["plan"]))
    document_recount = copy.deepcopy(recount)
    document_recount["scenes"][0]["visualTreatment"] = "document-only narrative recount"
    document_recount["scenes"][0]["materials"] = [copy.deepcopy(clean["scenes"][0]["materials"][0])]
    document_recount["scenes"][0]["documentEvidenceRequirement"] = "context"
    state.write_json(paths["plan"], document_recount)
    result(rows, "document-only narrative recount without concrete exception is detected",
           any("document-only treatment" in item for item in run_plan(paths["plan"])))
    document_recount["scenes"][0]["documentOnlyJustification"] = (
        "No truthful visual record of this private call exists, and staging faces would falsely imply authentic case evidence.")
    state.write_json(paths["plan"], document_recount)
    result(rows, "specific document-only narrative exception may pass",
           not run_plan(paths["plan"]))
    holding = copy.deepcopy(clean)
    holding["scenes"][0].update({
        "narrativeFunction": "semantic adjudication",
        "viewerQuestion": "What establishes the first proposition?",
        "visualTransformation": "the authentic record resolves the disputed proposition",
        "visualTreatment": "authentic document proposition with preserved page context",
        "documentEvidenceRequirement": "claim",
    })
    holding_material = holding["scenes"][0]["materials"][0]
    holding_material["documentEvidenceMode"] = "context"
    holding_material.pop("evidenceRegions", None)
    state.write_json(paths["plan"], holding)
    result(rows, "claim requirement cannot pass with context-only document material",
           any("requires at least one valid claim-mode" in item
               for item in run_plan(paths["plan"])))
    holding_material["documentEvidenceMode"] = "claim"
    holding_material["evidenceRegions"] = [
        {"anchorPhrase": "evidence 1", "region": [0.08, 0.18, 0.84, 0.12]}]
    state.write_json(paths["plan"], holding)
    result(rows, "claim requirement passes with valid claim material independent of wording",
           not run_plan(paths["plan"]))
    claim_reworded = copy.deepcopy(holding)
    claim_reworded["scenes"][0].update({
        "narrativeFunction": "turning point",
        "viewerQuestion": "Why does the analysis change here?",
        "visualTransformation": "a previously ambiguous source becomes decisive",
    })
    state.write_json(paths["plan"], claim_reworded)
    result(rows, "substantial wording changes preserve explicit claim behavior",
           not run_plan(paths["plan"]))
    context_reworded = copy.deepcopy(clean)
    context_reworded["scenes"][0].update({
        "narrativeFunction": "quoted legal holding and exact paragraph identity",
        "viewerQuestion": "What exact legal wording classifies the conduct?",
        "visualTransformation": "fact pattern becomes the court's verbatim legal classification",
    })
    state.write_json(paths["plan"], context_reworded)
    result(rows, "claim-like wording cannot override explicit context requirement",
           not run_plan(paths["plan"]))
    context_with_claim = copy.deepcopy(holding)
    context_with_claim["scenes"][0]["documentEvidenceRequirement"] = "context"
    state.write_json(paths["plan"], context_with_claim)
    result(rows, "context requirement rejects claim-mode document material",
           any("requires every document material" in item
               for item in run_plan(paths["plan"])))

    real_transform = copy.deepcopy(clean)
    real_transform["scenes"][0]["visualTransformation"] = "location becomes confinement, then confinement creates family pressure"
    real_transform["scenes"][0]["visualTreatment"] = "contextual photographic reconstruction"
    real_transform["scenes"][0]["materials"] = [{
        "id": "place", "materialIntent": "reconstruction", "anchorPhrase": "evidence 1",
        "mediaBrief": "Show a truthful photographic place plate where arrival becomes confinement.",
        "reconstructionLabel": "EDITORIAL RECONSTRUCTION"}]
    real_transform["scenes"][0].pop("documentEvidenceRequirement")
    state.write_json(paths["plan"], real_transform)
    result(rows, "real semantic visualTransformation passes", not run_plan(paths["plan"]))
    camera_only = copy.deepcopy(clean)
    camera_only["scenes"][0]["visualTransformation"] = "crop tighter then zoom document and center same page"
    state.write_json(paths["plan"], camera_only)
    result(rows, "crop zoom shift center reframe does not count as semantic transformation",
           any("not semantic" in item for item in run_plan(paths["plan"])))

    def pacing_scenes(durations, loads=None, treatments=None):
        output, at = [], 0.0
        loads = loads or ["moderate"] * len(durations)
        treatments = treatments or ["contextual photographic place"] * len(durations)
        for index, duration in enumerate(durations):
            output.append({"id": f"P{index + 1}", "startSec": at, "endSec": at + duration,
                           "comprehensionLoad": loads[index], "visualTreatment": treatments[index]})
            at += duration
        return output

    pacing = plan_gate.Report()
    plan_gate.pacing_advisories(pacing_scenes([4, 4.04, 3.97, 4.05, 4.01]), pacing)
    result(rows, "suspicious long near-equal scene-duration run is advised",
           any("metronomic" in item for item in pacing.advisories))
    high = plan_gate.Report()
    plan_gate.pacing_advisories(pacing_scenes([4.5, 4.8, 4.4], ["high"] * 3,
                                  ["map", "timeline", "document"]), high)
    result(rows, "excessive consecutive high-comprehension cadence is advised",
           any("breathing-space" in item for item in high.advisories))
    short = plan_gate.Report()
    plan_gate.pacing_advisories(pacing_scenes([2.2], ["complex"], ["chart"]), short)
    result(rows, "implausibly short complex scene is advised",
           any("implausibly short" in item for item in short.advisories))
    varied = plan_gate.Report()
    plan_gate.pacing_advisories(pacing_scenes([3.8, 5.1, 2.9, 4.6, 6.0],
                                  ["moderate", "high", "simple", "moderate", "high"],
                                  ["contextual", "map", "timeline", "document", "authentic"]), varied)
    result(rows, "healthy varied pacing passes without pacing advisories", not varied.advisories)
    repetition = plan_gate.Report()
    plan_gate.pacing_advisories(pacing_scenes([3.8, 4.4, 3.7, 4.5],
                                  treatments=["contextual city photograph", "contextual warehouse photography",
                                              "real-world contextual location plate", "photographic contextual action"]),
                                  repetition)
    result(rows, "wording changes do not hide repeated visual treatment family",
           any("visualTreatment repetition" in item for item in repetition.advisories))
    result(rows, "long narration segment is not split at arbitrary equal clock fractions",
           start_video.shape_scenes([(0.0, 12.0)], 4.0) == [(0.0, 12.0)])
    contract_before = state.digest(state.plan_contract(clean, paths["plan"]))
    boundary_changed = copy.deepcopy(clean); boundary_changed["scenes"][0]["endSec"] -= .25
    result(rows, "semantic scene-boundary change invalidates approved PLAN identity",
           contract_before != state.digest(state.plan_contract(boundary_changed, paths["plan"])))
    requirement_changed = copy.deepcopy(clean)
    requirement_changed["scenes"][0]["documentEvidenceRequirement"] = "claim"
    result(rows, "document evidence requirement changes PLAN approval identity",
           contract_before != state.digest(state.plan_contract(requirement_changed, paths["plan"])))
    result(rows, "document evidence requirement changes PREVIS semantic identity",
           state.digest(contracts.semantic_scene(clean["scenes"][0])) !=
           state.digest(contracts.semantic_scene(requirement_changed["scenes"][0])))
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
    mode_changed = copy.deepcopy(plan)
    mode_changed["scenes"][0]["materials"][0]["documentEvidenceMode"] = "claim"
    mode_changed["scenes"][0]["materials"][0]["evidenceRegions"] = [
        {"anchorPhrase": "evidence 1", "region": [0.08, 0.18, 0.84, 0.12]}]
    state.write_json(paths["plan"], mode_changed)
    _mode_path, mode_manifest = state.sync_asset_manifest(paths["plan"])
    result(rows, "claim versus context mode change resets asset acceptance",
           mode_manifest["assets"][asset_id].get("acceptance") == "PENDING")
    state.write_json(paths["plan"], plan); state.sync_asset_manifest(paths["plan"]); state.accept_asset(paths["plan"], asset_id)


def fresh_integrity_checks(paths, plan, rows):
    plan_path = paths["plan"]
    clean = copy.deepcopy(plan)
    scene = clean["scenes"][0]
    source = state.scene_source(paths["root"], clean["video"], scene["id"])
    original_source = source.read_text(encoding="utf-8")
    undeclared = build_gate.fresh_source_integrity_problems(
        plan_path, clean, scene,
        'const secret="V99/assets/secret.jpg"; <Img src={secret} />', True)
    result(rows, "fresh undeclared local meaning-bearing media hard fails",
           any("undeclared meaning-bearing local media" in item for item in undeclared))
    bypasses = [build_gate.fresh_source_integrity_problems(
        plan_path, clean, scene, f'<Img src="{src}" />', True)
        for src in ("http://example.test/a.jpg", "https://example.test/a.jpg",
                    "data:image/png;base64,AA", "blob:fixture-media")]
    result(rows, "fresh remote/data/blob media bypass hard fails",
           all(any("bypasses ASSET LOCK" in item for item in problems) for problems in bypasses))
    dynamic = build_gate.fresh_source_integrity_problems(
        plan_path, clean, scene, '<Img src={runtimeSelectedSource} />', True)
    result(rows, "dynamic meaning-bearing media cannot bypass locked byte identity",
           any("dynamic meaning-bearing media" in item for item in dynamic))

    original_gate = contracts.run_plan_gate
    contracts.run_plan_gate = lambda _path: None
    try:
        state.write_json(plan_path, clean)
        contracts.approve_plan(plan_path)
        helper_rejections = []
        for suffix in ("jsx", "js", "tsx", "ts"):
            source.write_text(
                f'import SomeVisual from "../scene-helpers.{suffix}";\n{original_source}',
                encoding="utf-8")
            problems, checked = build_gate.previs_source_check(plan_path, clean, "S1")
            helper_rejections.append((problems, checked))
        source.write_text(original_source, encoding="utf-8")
        result(rows, "fresh scene-helpers.jsx/js/tsx/ts imports hard fail at production boundary",
               all(checked == 1 and any("arbitrary per-video scene/helper module" in item
                                        for item in problems)
                   for problems, checked in helper_rejections))
        timing_path, _ = beat_sync.write_timing(plan_path)
        source.write_text(
            'import {PROMOTION_TIMING} from "../timing.js";\n'
            'import {LayoutSafety} from "../../../primitives/LayoutSafety.jsx";\n'
            + original_source, encoding="utf-8")
        try:
            timing_problems, timing_checked = build_gate.previs_source_check(
                plan_path, clean, "S1")
        finally:
            source.write_text(original_source, encoding="utf-8")
        result(rows, "generated timing.js and canonical src/primitives imports remain legal",
               timing_path.is_file() and timing_checked == 1 and not timing_problems)
        rogue = paths["root"] / "src" / "primitives" / "VisualKit.jsx"
        rogue.write_text("export const Card=()=>null; export const Person=()=>null;", encoding="utf-8")
        source.write_text('import {Card} from "../../../primitives/VisualKit.jsx";\n' + original_source,
                          encoding="utf-8")
        try:
            rogue_problems, rogue_checked = build_gate.previs_source_check(plan_path, clean, "S1")
        finally:
            source.write_text(original_source, encoding="utf-8")
        result(rows, "arbitrary src/primitives VisualKit import hard fails canonical allowlist",
               rogue_checked == 1 and any("canonical fresh primitive allowlist" in item
                                          for item in rogue_problems))
        fp_with_rogue = hook_gate.gate_fingerprint(paths["root"])
        rogue.unlink()
        fp_without_rogue = hook_gate.gate_fingerprint(paths["root"])
        canonical_primitive = paths["root"] / "src" / "primitives" / "DocumentEvidence.jsx"
        before_primitive = canonical_primitive.read_text(encoding="utf-8")
        canonical_primitive.write_text(before_primitive + "\n// fingerprint fixture\n", encoding="utf-8")
        fp_changed_primitive = hook_gate.gate_fingerprint(paths["root"])
        canonical_primitive.write_text(before_primitive, encoding="utf-8")
        result(rows, "adding rogue primitive changes selftest currentness fingerprint",
               fp_with_rogue != fp_without_rogue)
        result(rows, "changing canonical primitive changes selftest currentness fingerprint",
               fp_changed_primitive != fp_without_rogue)
        helper = paths["source"] / "scene-helpers.jsx"
        helper.write_text(
            'export const SomeVisual=()=> <><img src="V99/assets/undeclared.jpg" />'
            '<RelationDiagram /></>;\n', encoding="utf-8")
        source.write_text(
            f'import {{SomeVisual}} from "../scene-helpers.jsx";\n{original_source}',
            encoding="utf-8")
        try:
            helper_bypass, _checked = build_gate.previs_source_check(plan_path, clean, "S1")
        finally:
            source.write_text(original_source, encoding="utf-8")
            helper.unlink()
        result(rows, "helper-mediated undeclared-media/diagram bypass hard fails at import boundary",
               any("arbitrary per-video scene/helper module" in item for item in helper_bypass) and
               not any("undeclared meaning-bearing local media" in item or "RelationDiagram" in item
                       for item in helper_bypass))
        relation = copy.deepcopy(clean)
        relation_material = {
            "id": "relation", "materialIntent": "diagram-exception",
            "anchorPhrase": "evidence 1",
            "mediaBrief": "Show the abstract legal dependency between the two case identities.",
            "diagramJustification": "No photo, document, map, chart, video, or reconstruction can show this abstract legal dependency clearly.",
        }
        relation["scenes"][0]["materials"].append(relation_material)
        state.write_json(plan_path, relation)
        stale = not contracts.plan_is_closed(plan_path)[0]
        negative_relation = build_gate.fresh_source_integrity_problems(
            plan_path, relation, relation["scenes"][0],
            '<RelationDiagram materialId="relation" />', False)
        contracts.approve_plan(plan_path)
        relation_current = contracts.plan_is_closed(plan_path)[0]
        positive_relation = build_gate.fresh_source_integrity_problems(
            plan_path, relation, relation["scenes"][0],
            '<RelationDiagram materialId="relation" />', relation_current)
        missing_relation = build_gate.fresh_source_integrity_problems(
            plan_path, relation, relation["scenes"][0],
            '<RelationDiagram materialId="undeclared" />', relation_current)
        result(rows, "adding diagram exception after approval stales PLAN receipt", stale)
        result(rows, "RelationDiagram without current approved matching exception hard fails",
               bool(negative_relation) and bool(missing_relation))
        result(rows, "current approved matching diagram-exception may pass", not positive_relation)

        map_plan = copy.deepcopy(clean)
        map_asset = paths["assets"] / "map.png"; image(map_asset)
        map_material = {
            "id": "map", "materialIntent": "map", "anchorPhrase": "evidence 1",
            "mediaBrief": "Show the authoritative geography and route relevant to this evidence.",
            "mapDataIdentity": "fixture-route-v1", "src": "map.png", "meaningBearing": True,
            "locked": True, "lockedSha256": state.hash_file(map_asset),
            "provenance": "official: fixture mapping authority",
            "selectionRationale": "The authoritative map directly establishes the route.",
        }
        map_plan["scenes"][0]["materials"] = [map_material]
        state.write_json(plan_path, map_plan); state.sync_asset_manifest(plan_path)
        state.accept_asset(plan_path, state.asset_usage_id(map_plan["scenes"][0], map_material))
        map_source = '<MapGraphic materialId="map" src={staticFile("V99/assets/map.png")} />'
        positive_map = build_gate.fresh_source_integrity_problems(
            plan_path, map_plan, map_plan["scenes"][0], map_source, True)
        negative_map = build_gate.fresh_source_integrity_problems(
            plan_path, map_plan, map_plan["scenes"][0],
            map_source.replace('materialId="map"', 'materialId="undeclared"'), True)
        result(rows, "undeclared MapGraphic hard fails", bool(negative_map))
        result(rows, "matching valid map material may pass", not positive_map)

        chart_plan = copy.deepcopy(clean)
        chart_material = {
            "id": "chart", "materialIntent": "chart", "anchorPhrase": "evidence 1",
            "mediaBrief": "Show the real numeric comparison established by the cited evidence.",
            "numericData": [12, 31, 47], "dataSource": "fixture official table",
        }
        chart_plan["scenes"][0]["materials"] = [chart_material]
        state.write_json(plan_path, chart_plan)
        chart_source = '<DataChart materialId="chart" data={[12,31,47]} />'
        positive_chart = build_gate.fresh_source_integrity_problems(
            plan_path, chart_plan, chart_plan["scenes"][0], chart_source, True)
        negative_chart = build_gate.fresh_source_integrity_problems(
            plan_path, chart_plan, chart_plan["scenes"][0],
            chart_source.replace('materialId="chart"', 'materialId="undeclared"'), True)
        changed_chart = build_gate.fresh_source_integrity_problems(
            plan_path, chart_plan, chart_plan["scenes"][0],
            chart_source.replace("[12,31,47]", "[12,31,48]"), True)
        result(rows, "undeclared DataChart hard fails", bool(negative_chart))
        result(rows, "matching chart with real numericData and dataSource may pass", not positive_chart)
        result(rows, "DataChart JSX values exactly match approved numericData",
               any("exactly match" in item for item in changed_chart))

        document_plan = copy.deepcopy(clean)
        document_plan["scenes"][0]["documentEvidenceRequirement"] = "claim"
        document_material = document_plan["scenes"][0]["materials"][0]
        document_material["documentEvidenceMode"] = "claim"
        document_material["evidenceRegions"] = [{"anchorPhrase": "evidence 1",
                                                  "region": [0.08, 0.18, 0.84, 0.12]}]
        state.write_json(plan_path, document_plan); state.sync_asset_manifest(plan_path)
        state.accept_asset(plan_path, state.asset_usage_id(document_plan["scenes"][0], document_material))
        exact_missing = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<div>The decisive claim was retyped here.</div>', True)
        exact_no_focus = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={480} />', True)
        no_material_id = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={480} focus={{region:[.08,.18,.84,.12]}} />', True)
        exact_focus = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={480} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        mismatched_focus = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={480} focus={{region:[.09,.18,.84,.12],panelWidth:"84%"}} />', True)
        undersized_focus = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={480} focus={{region:[.08,.18,.84,.12],panelWidth:"60%"}} />', True)
        wrong_width = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={320} sourceHeight={480} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        wrong_height = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} sourceHeight={500} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        missing_width = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceHeight={480} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        missing_height = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceWidth={270} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        arbitrary_aspect = build_gate.fresh_source_integrity_problems(
            plan_path, document_plan, document_plan["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="claim" src={staticFile("V99/assets/record-1.png")} sourceAspect={0.667} focus={{region:[.08,.18,.84,.12],panelWidth:"84%"}} />', True)
        full_context = copy.deepcopy(document_plan)
        full_context["scenes"][0]["documentEvidenceRequirement"] = "context"
        full_context["scenes"][0]["materials"][0]["documentEvidenceMode"] = "context"
        full_context["scenes"][0]["materials"][0].pop("evidenceRegions")
        state.write_json(plan_path, full_context); state.sync_asset_manifest(plan_path)
        state.accept_asset(plan_path, state.asset_usage_id(
            full_context["scenes"][0], full_context["scenes"][0]["materials"][0]))
        full_context_problems = build_gate.fresh_source_integrity_problems(
            plan_path, full_context, full_context["scenes"][0],
            '<DocumentEvidence materialId="record" documentEvidenceMode="context" src={staticFile("V99/assets/record-1.png")} />', True)
        result(rows, "exact evidence cannot be replaced by fabricated or retyped claim text",
               any("cannot be replaced" in item for item in exact_missing))
        result(rows, "exact claim evidence requires truthful source-region focus",
               any("requires truthful focus" in item for item in exact_no_focus) and not exact_focus)
        result(rows, "claim DocumentEvidence requires literal matching materialId",
               any("requires literal materialId" in item for item in no_material_id))
        result(rows, "mismatching exact claim focus region hard fails",
               any("does not match" in item for item in mismatched_focus))
        result(rows, "undersized exact claim focus panel hard fails",
               any("at least 70%" in item for item in undersized_focus))
        result(rows, "known selftest locked document raster is exactly 270 by 480",
               build_gate._locked_raster_dimensions(plan_path, document_plan, document_material) ==
               (270, 480))
        result(rows, "claim DocumentEvidence exact locked raster dimensions pass",
               not exact_focus)
        result(rows, "wrong claim sourceWidth hard fails against locked raster bytes",
               any("sourceWidth=320" in item and "width 270" in item for item in wrong_width))
        result(rows, "wrong claim sourceHeight hard fails against locked raster bytes",
               any("sourceHeight=500" in item and "height 480" in item for item in wrong_height))
        result(rows, "claim DocumentEvidence missing sourceWidth hard fails",
               any("requires literal positive integer sourceWidth" in item
                   for item in missing_width))
        result(rows, "claim DocumentEvidence missing sourceHeight hard fails",
               any("requires literal positive integer sourceHeight" in item
                   for item in missing_height))
        result(rows, "arbitrary caller-authored claim sourceAspect hard fails",
               any("sourceAspect is not permitted" in item for item in arbitrary_aspect))
        result(rows, "full-page document context or source identity remains legal",
               not full_context_problems)
    finally:
        contracts.run_plan_gate = original_gate
        state.write_json(plan_path, clean)
        state.sync_asset_manifest(plan_path)
        for clean_scene in clean["scenes"]:
            for material in state.scene_materials(clean_scene):
                if material.get("src"):
                    state.accept_asset(plan_path, state.asset_usage_id(clean_scene, material))


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
    reveal_text = (paths["root"] / "src" / "primitives" / "Reveal.jsx")
    # The fixture does not need Reveal for rendering; inspect the canonical source.
    reveal_source = (ROOT / "src" / "primitives" / "Reveal.jsx").read_text(encoding="utf-8")
    result(rows, "default PREVIS Reveal path has no hidden automatic motion",
           "enabled = false" in reveal_source and ": 1;" in reveal_source)
    fresh = {"schemaVersion": plan_gate.SCHEMA_VERSION, "video": "V99", "fps": 30,
             "scenes": [{"id": "S1", "startSec": 0, "endSec": 3,
                         "visualTransformation": "two meaning-bearing proofs resolve in sequence",
                         "materials": [
                             {"id": "first", "anchorPhrase": "alpha"},
                             {"id": "second", "anchorPhrase": "beta"}]}]}
    fresh_words = [["alpha", 0.1, 0.2, 0], ["then", 0.5, 0.7, 0],
                   ["beta", 1.2, 1.3, 0]]
    fresh_timing = beat_sync.resolve_plan(fresh, fresh_words)
    manifest = review.sample_manifest(fresh, paths["review_frames"] / "beat-fixture", 2,
                                      promotion_timing=fresh_timing)
    produced = [item["localFrame"] for item in manifest["samples"]]
    expected = [23, 56]
    result(rows, "fresh review needs no visualEvents and samples resolved beat_sync anchors",
           "visualEvents" not in fresh["scenes"][0] and all(frame in produced for frame in expected),
           f"expected beat frames={expected}; produced={produced}")
    beat_source = (HERE / "beat_sync.py").read_text(encoding="utf-8")
    result(rows, "fresh timing path has no asset-index even-fraction default",
           "assetIndex" not in beat_source and "assetCount" not in beat_source and
           "sceneDuration" not in beat_source)
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
    try:
        review.render_previs(paths["plan"], plan, paths, promoted=True); no_op_blocked = False
    except ValueError as exc:
        no_op_blocked = "global no-op" in str(exc)
    result(rows, "historical all-scenes PROMOTE no-op cannot silently claim useful success",
           no_op_blocked)
    static_plan = copy.deepcopy(plan)
    for scene in static_plan["scenes"]:
        scene["intentionalStaticRationale"] = "This approved evidentiary frame is intentionally static for sustained reading."
    try:
        review.render_previs(paths["plan"], static_plan, paths, promoted=True); static_allowed = True
    except ValueError:
        static_allowed = False
    result(rows, "specific intentional-static rationale permits a legitimate global static treatment",
           static_allowed)
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
    selective = paths["root"] / "src" / "primitives" / "DocumentEvidence.jsx"
    selective.write_text(selective.read_text(encoding="utf-8") + "\n// importer-only change\n", encoding="utf-8")
    importer_changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "primitive dependency mutation invalidates only actual importers",
           {item["scene"] for item in importer_changed} == {"S1"})
    selective.write_text(selective.read_text(encoding="utf-8").replace("\n// importer-only change\n", ""), encoding="utf-8")
    source = state.scene_source(paths["root"], "V99", "S1")
    source.write_text(source.read_text(encoding="utf-8") + "\n// temporal polish\n", encoding="utf-8")
    changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "one changed scene renders only its approved states",
           len(changed) == 2 and {item["scene"] for item in changed} == {"S1"})
    dishonest = {"schema": 1, "version": review.PREVIS_VERSION, "video": plan["video"],
                 "frames": [], "scenes": review.conformance_scene_records(plan, paths, set())}
    state.write_json(paths["promoted_previs_manifest"], dishonest)
    dishonest_problems, _dishonest_comparisons = build_gate.previs_baseline_check(
        paths["plan"], plan, paths["previs_manifest"], paths["promoted_previs_manifest"])
    result(rows, "changed dependency cannot be falsely reused",
           any("cannot reuse approved baseline identity" in item for item in dishonest_problems))
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
    result(rows, "unchanged individual scene may remain static while another scene is promoted",
           {item["scene"] for item in changed} == {"S1"})
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
    metrics.write_text('{"font":"fixture-v1"}', encoding="utf-8")
    font_file = paths["root"] / "public" / "fixture-font.woff2"
    font_file.write_bytes(b"fixture-font-v2")
    font_bytes_changed = review.previs_requests(plan, paths, promoted=True)
    result(rows, "font byte mutation invalidates every affected scene",
           len({item["scene"] for item in font_bytes_changed}) == len(plan["scenes"]))


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


def pexels_checks(tmp, rows):
    tmp.mkdir(parents=True, exist_ok=True)
    fixture_bytes = image(tmp / "local-fixture.jpg", size=(90, 160)).read_bytes()

    def photos(first):
        return [{"id": index, "width": 900, "height": 1600,
                 "photographer": f"Photographer {index}",
                 "url": f"https://www.pexels.com/photo/{index}/",
                 "src": {"medium": f"mock://thumb/{index}",
                         "original": f"mock://original/{index}"}}
                for index in range(first, first + 9)]

    class Response:
        def __init__(self, payload=None, content=b""):
            self.payload, self.content = payload, content

        def raise_for_status(self):
            return None

        def json(self):
            return self.payload

    direct_calls = []

    def direct_get(url, **kwargs):
        direct_calls.append((url, kwargs))
        return Response({"photos": photos(1)})

    candidates = fetch_pexels.search("fixture query", "portrait", 99,
                                     api_key="fixture-secret", get=direct_get)
    required = {"provider", "mediaType", "pexelsId", "photographer", "pageUrl",
                "previewUrl", "width", "height", "orientation", "retrievedAt",
                "provenance", "license"}
    result(rows, "Pexels PHOTO structured candidate schema is usable",
           len(candidates) == 8 and all(required <= set(item) for item in candidates)
           and all(item["provider"] == "pexels" and item["mediaType"] == "photo"
                   and item["license"] == "Pexels License" for item in candidates))
    result(rows, "Pexels search request and returned candidates are capped at eight",
           direct_calls[0][0] == "https://api.pexels.com/v1/search" and
           direct_calls[0][1]["params"]["per_page"] == 8 and len(candidates) == 8)
    source = (HERE / "fetch_pexels.py").read_text(encoding="utf-8")
    result(rows, "Pexels adapter remains PHOTO endpoint only",
           fetch_pexels.PEXELS_SEARCH_URL == "https://api.pexels.com/v1/search" and
           "api.pexels.com/videos" not in source.lower())
    try:
        fetch_pexels.load_api_key(environ={}, start=tmp); missing = ""
    except RuntimeError as exc:
        missing = str(exc)
    result(rows, "missing Pexels key has explicit safe runtime status",
           missing == fetch_pexels.MISSING_KEY_STATUS and "fixture-secret" not in missing)
    result(rows, "Pexels key is sourced only from environment or untracked .env and never printed",
           "tracked_by_git" in source and "print(key" not in source and
           "print(load_api_key" not in source)

    packet = {
        "needId": "S1-place", "sceneId": "S1", "anchorPhrase": "the actual place",
        "mediaBrief": "Show the named brick station facade with useful portrait crop space.",
        "materialIntent": "contextual-photo", "shortCaseFacts": ["station is brick"],
        "styleContract": {"format": "9:16", "treatment": "contextual photographic plate"},
        "orientation": "portrait",
    }
    result(rows, "Source Scout packet is exact and at most two KB",
           set(packet) == fetch_pexels.PACKET_FIELDS and
           len(fetch_pexels.compact_json_bytes(fetch_pexels.validate_need_packet(packet))) <= 2048)
    oversized = copy.deepcopy(packet); oversized["mediaBrief"] = "x" * 2100
    try:
        fetch_pexels.validate_need_packet(oversized); packet_blocked = False
    except ValueError:
        packet_blocked = True
    result(rows, "oversized Source Scout packet is rejected", packet_blocked)

    blocked_calls = []

    def must_not_call(url, **kwargs):
        blocked_calls.append((url, kwargs))
        raise AssertionError("benchmark block made an HTTP call")

    try:
        fetch_pexels.scout_phase(
            tmp / "blocked", "V99", packet, "initial", query="station",
            execution_mode="native-cheap-worker-required", get=must_not_call,
            api_key="fixture-secret")
        benchmark_blocked = False
    except RuntimeError as exc:
        benchmark_blocked = str(exc) == fetch_pexels.CHEAP_WORKER_BLOCK
    result(rows, "benchmark-required native worker refuses fallback before Pexels",
           benchmark_blocked and not blocked_calls)
    fallback = fetch_pexels.worker_runtime("native-first")
    native_unknown = fetch_pexels.worker_runtime(
        "native-cheap-worker-required", native_worker_started=True)
    result(rows, "native-worker mode is distinct from fallback-main",
           fallback["workerMode"] == "fallback-main" and
           native_unknown["workerMode"] == "native")
    result(rows, "unobservable worker model and context remain UNKNOWN",
           fallback["actualWorkerModel"] == "UNKNOWN" and
           fallback["parentContextInherited"] == "UNKNOWN" and
           native_unknown["actualWorkerModel"] == "UNKNOWN" and
           native_unknown["parentContextInherited"] == "UNKNOWN")
    with contextlib.redirect_stderr(io.StringIO()):
        try:
            fetch_pexels.build_parser().parse_args([
                "scout", "V99", "need.json", "--phase", "initial",
                "--execution-mode", "native-cheap-worker-required",
                "--native-worker-started"])
            cli_faked = True
        except SystemExit:
            cli_faked = False
    result(rows, "CLI cannot self-assert a fake native-worker start", not cli_faked)

    calls = []

    def fake_get(url, **kwargs):
        calls.append((url, kwargs))
        if url == fetch_pexels.PEXELS_SEARCH_URL:
            first = 9 if kwargs["params"]["query"] == "refined station" else 1
            return Response({"photos": photos(first)})
        if url.startswith("mock://thumb/") or url.startswith("mock://original/"):
            return Response(content=fixture_bytes)
        raise AssertionError(f"unexpected mocked URL {url}")

    run_root = tmp / "scout-project"
    status, search_state = fetch_pexels.scout_phase(
        run_root, "V99", packet, "initial", query="brick station",
        api_key="fixture-secret", get=fake_get)
    paths = fetch_pexels.worker_paths(run_root, "V99", packet)
    initial_search_calls = [call for call in calls if call[0] == fetch_pexels.PEXELS_SEARCH_URL]
    thumb_calls = [call for call in calls if call[0].startswith("mock://thumb/")]
    result(rows, "initial scout searches exactly once and downloads eight previews",
           status == "SEARCHED" and search_state["queryCount"] == 1 and
           search_state["initialQuery"] == "brick station" and
           len(initial_search_calls) == 1 and len(thumb_calls) == 8)
    result(rows, "all previews stay in the runtime candidate directory",
           len(list(paths["directory"].glob("thumb-*.jpg"))) == 8 and
           all(path.parent == paths["directory"] for path in paths["directory"].glob("thumb-*.jpg")) and
           not state.video_paths(run_root, "V99")["assets"].exists())
    before_repeat = len(calls)
    repeat_status, _repeat = fetch_pexels.scout_phase(
        run_root, "V99", packet, "initial", query="brick station",
        api_key="fixture-secret", get=fake_get)
    result(rows, "completed initial search is not redundantly repeated",
           repeat_status == "SEARCHED" and len(calls) == before_repeat)

    first_triage = {"visualInspection": {"performed": True, "method": "runtime-local-image"},
                    "judgments": []}
    for item in search_state["candidates"]:
        first_triage["judgments"].append({
            "pexelsId": item["pexelsId"], "thumbSha256": state.hash_file(item["localThumbPath"]),
            "useful": False, "briefMatchNote": "poor mediaBrief match"})
    unproven = copy.deepcopy(first_triage)
    unproven["visualInspection"]["performed"] = False
    result(rows, "visualTriage cannot report PASS without image-inspection evidence",
           fetch_pexels.triage_decision(search_state, unproven)["visualTriage"] == "NOT_PROVEN")
    try:
        fetch_pexels.scout_phase(
            run_root, "V99", packet, "finalize", triage=unproven,
            require_visual_triage=True, api_key="fixture-secret", get=fake_get)
        visual_blocked = False
    except RuntimeError as exc:
        visual_blocked = str(exc) == fetch_pexels.VISUAL_TRIAGE_BLOCK
    result(rows, "required visual worker triage stops when inspection is unavailable",
           visual_blocked and not list(paths["directory"].glob("original-*.jpg")))
    status, refined_state = fetch_pexels.scout_phase(
        run_root, "V99", packet, "refine", query="refined station", triage=first_triage,
        api_key="fixture-secret", get=fake_get)
    result(rows, "one refinement is allowed only after proven no-useful-result triage",
           status == "REFINED" and refined_state["queryCount"] == 2 and
           refined_state["refinedQuery"] == "refined station" and
           len([call for call in calls if call[0] == fetch_pexels.PEXELS_SEARCH_URL]) == 2)
    before_third = len(calls)
    try:
        fetch_pexels.scout_phase(
            run_root, "V99", packet, "refine", query="forbidden third", triage=first_triage,
            api_key="fixture-secret", get=fake_get)
        third_blocked = False
    except ValueError:
        third_blocked = True
    result(rows, "third Pexels search is impossible",
           third_blocked and len(calls) == before_third)

    final_triage = {"visualInspection": {"performed": True, "method": "runtime-local-image"},
                    "judgments": []}
    for item in refined_state["candidates"]:
        useful = item["pexelsId"] in {9, 10}
        final_triage["judgments"].append({
            "pexelsId": item["pexelsId"], "thumbSha256": state.hash_file(item["localThumbPath"]),
            "useful": useful, "rank": 1 if item["pexelsId"] == 10 else 2,
            "briefMatchNote": "specific station facade and strong vertical crop" if useful
                              else "poor mediaBrief match"})
    status, worker_return = fetch_pexels.scout_phase(
        run_root, "V99", packet, "finalize", triage=final_triage,
        require_visual_triage=True, api_key="fixture-secret", get=fake_get)
    original_calls = [call for call in calls if call[0].startswith("mock://original/")]
    result(rows, "visual relevance rejects poor matches and ranks useful candidates",
           status == "FINALIZED" and worker_return["visualTriage"] == "PASS" and
           [item["pexelsId"] for item in worker_return["shortlist"]] == [10, 9] and
           worker_return["rejectedCount"] == 14)
    result(rows, "shortlist is at most three and originals download only for shortlist",
           len(worker_return["shortlist"]) == 2 and len(original_calls) == 2 and
           {call[0] for call in original_calls} == {"mock://original/9", "mock://original/10"} and
           len(list(paths["directory"].glob("original-*.jpg"))) == 2)
    result(rows, "worker cannot write or accept a final public asset",
           not state.video_paths(run_root, "V99")["assets"].exists() and
           "accept_asset" not in source and "pipeline_contracts" not in source)

    on_disk = json.loads(paths["return"].read_text(encoding="utf-8"))
    flat_return = paths["return"].read_text(encoding="utf-8")
    result(rows, "worker_return is compact with the exact bounded schema",
           set(on_disk) == fetch_pexels.RETURN_FIELDS and
           all(set(item) == fetch_pexels.SHORTLIST_FIELDS for item in on_disk["shortlist"]) and
           len(paths["return"].read_bytes()) < 4096)
    result(rows, "worker_return omits raw/rejected/secret detail",
           all(key not in on_disk for key in ("raw", "photos", "candidates", "rejectedCandidates")) and
           all(key not in item for item in on_disk["shortlist"]
               for key in ("previewUrl", "downloadUrl", "raw")) and
           "fixture-secret" not in flat_return)
    result(rows, "Pexels shortlist retains truthful traceability metadata",
           all(item["provenance"] == item["pageUrl"] and
               item["license"] == "Pexels License" and item["retrievedAt"].endswith("Z")
               for item in on_disk["shortlist"]))
    result(rows, "main final selection remains separate from worker ranking",
           "main agent owns final inspection" in
           (HERE.parent / "references" / "pexels-source-worker.md").read_text(encoding="utf-8").lower())

    before_reuse = len(calls)
    reuse_status, reused = fetch_pexels.scout_phase(
        run_root, "V99", packet, "initial", query="ignored because current",
        api_key="fixture-secret", get=fake_get)
    result(rows, "unchanged need reuses current worker result without sourcing",
           reuse_status == "REUSE" and reused == worker_return and len(calls) == before_reuse)
    changed = copy.deepcopy(packet); changed["mediaBrief"] += " The clock must also be visible."
    result(rows, "changed mediaBrief invalidates worker result",
           fetch_pexels.current_worker_result(run_root, "V99", changed) is None)
    missing_original = run_root / worker_return["shortlist"][0]["localOriginalPath"]
    missing_original.unlink()
    result(rows, "missing shortlisted candidate file invalidates reuse",
           fetch_pexels.current_worker_result(run_root, "V99", packet) is None)

    artifacts = "\n".join(path.read_text(encoding="utf-8", errors="replace")
                            for path in paths["directory"].glob("*.json"))
    telemetry_rows = [json.loads(line) for line in
                      state.video_paths(run_root, "V99")["economics"].read_text(encoding="utf-8").splitlines()]
    miss_record = next(item for item in telemetry_rows if item["cache"] == "miss")
    result(rows, "Source Scout economics are factual and unknown counters stay UNKNOWN",
           miss_record["sourceScoutMode"] == "fallback-main" and
           miss_record["queryCount"] == 2 and miss_record["candidateCount"] == 16 and
           miss_record["thumbnailDownloads"] == 16 and miss_record["originalDownloads"] == 2 and
           miss_record["shortlistCount"] == 2 and miss_record["refinementCount"] == 1 and
           miss_record["workerTokens"] == "UNKNOWN" and miss_record["mainTokens"] == "UNKNOWN" and
           miss_record["context"] == "UNKNOWN" and
           miss_record["parentContextInherited"] == "UNKNOWN")
    result(rows, "API key never enters Source Scout JSON artifacts",
           "fixture-secret" not in artifacts)
    forbidden_classifier_terms = ("face recognition", "face detection", "legal-risk",
                                  "content-policy scoring", "suspect", "victim")
    result(rows, "Pexels selection code adds no legal/content/identity classifier",
           not any(term in source.lower() for term in forbidden_classifier_terms))


def optional_dependency_checks(rows):
    imported = []

    def record_core(name):
        imported.append(name)
        return object()

    standalone_env = start_video.step_env(importer=record_core)

    def missing_cutout_only(name):
        if name in {"rembg", "scipy"}:
            raise ImportError(name)
        return object()

    core = start_video.step_env(("audio", "align", "plan"), importer=missing_cutout_only)
    missing = process_cutout.optional_dependency_status(missing_cutout_only)
    result(rows, "standalone core environment check uses exact normal dependency set",
           standalone_env and imported == ["whisper"])
    result(rows, "normal core INGEST passes mocked missing rembg/scipy", core)
    result(rows, "actual cutout capability reports mocked missing rembg/scipy",
           missing == ["scipy", "rembg"])


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
    proc = remotion_still(entry, "LayoutFixture", output)
    return proc, output, directory


def content_collision_fixture(root):
    directory = pathlib.Path(tempfile.mkdtemp(prefix="content-collision-fixture-", dir=root))
    entry = directory / "index.ts"; scene = directory / "Root.jsx"
    entry.write_text('import {registerRoot} from "remotion";import {Root} from "./Root";registerRoot(Root);', encoding="utf-8")
    scene.write_text(
        'import {AbsoluteFill,Composition} from "remotion";\n'
        'import {LayoutSafety} from "../src/primitives/LayoutSafety";\n'
        'const Bespoke=()=> <AbsoluteFill>'
        '<div data-videoagent-content-block="true" style={{position:"absolute",left:100,top:300,width:500,height:500,background:"#eee"}} />'
        '<div data-videoagent-content-block="true" style={{position:"absolute",left:180,top:380,width:500,height:500,background:"#f60"}} />'
        '</AbsoluteFill>;\n'
        'const Wrapped=()=> <LayoutSafety><Bespoke/></LayoutSafety>;\n'
        'export const Root=()=> <Composition id="ContentCollisionFixture" component={Wrapped} durationInFrames={30} fps={30} width={1080} height={1920}/>;',
        encoding="utf-8")
    output = directory / "frame.png"
    proc = remotion_still(entry, "ContentCollisionFixture", output)
    return proc, directory


def document_fixture(root, safe):
    directory = pathlib.Path(tempfile.mkdtemp(prefix="document-evidence-fixture-", dir=root))
    entry = directory / "index.ts"; scene = directory / "Root.jsx"
    entry.write_text('import {registerRoot} from "remotion";import {Root} from "./Root";registerRoot(Root);', encoding="utf-8")
    panel_width = "84%" if safe else "60%"
    raster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='900'%3E%3Crect width='600' height='900' fill='white'/%3E%3Cpath d='M60 100h480M60 150h480M60 200h480' stroke='black'/%3E%3C/svg%3E"
    scene.write_text(
        'import {Composition} from "remotion";\n'
        'import {LayoutSafety} from "../src/primitives/LayoutSafety";\n'
        'import {DocumentEvidence} from "../src/primitives/DocumentEvidence";\n'
        f'const Evidence=()=> <LayoutSafety><DocumentEvidence materialId="record" documentEvidenceMode="claim" src={json.dumps(raster)} sourceWidth={{600}} sourceHeight={{900}} focus={{{{region:[.08,.02,.84,.08],safeMargin:.01,panelWidth:"{panel_width}"}}}} /></LayoutSafety>;\n'
        'export const Root=()=> <Composition id="DocumentFixture" component={Evidence} durationInFrames={30} fps={30} width={1080} height={1920}/>;',
        encoding="utf-8")
    output = directory / "frame.png"
    proc = remotion_still(entry, "DocumentFixture", output)
    return proc, output, directory


def layout_checks(rows):
    safe_proc, safe_output, safe_dir = layout_fixture(ROOT, True)
    bad_proc, _bad_output, bad_dir = layout_fixture(ROOT, False)
    block_proc, block_dir = content_collision_fixture(ROOT)
    document_proc, document_output, document_dir = document_fixture(ROOT, True)
    document_bad_proc, _document_bad_output, document_bad_dir = document_fixture(ROOT, False)
    try:
        result(rows, "ordinary direct bespoke JSX layout passes real browser geometry",
               safe_proc.returncode == 0 and safe_output.is_file(), safe_proc.stderr[-500:])
        bad_text = (bad_proc.stdout or "") + (bad_proc.stderr or "")
        result(rows, "direct bespoke caption-region collision is caught",
               bad_proc.returncode != 0 and "VIDEOAGENT_LAYOUT" in bad_text, bad_text[-500:])
        result(rows, "layout fixture is independent of Card/Node component names",
               "Card" not in (safe_dir / "Root.jsx").read_text(encoding="utf-8") and
               "Node" not in (bad_dir / "Root.jsx").read_text(encoding="utf-8"))
        block_text = (block_proc.stdout or "") + (block_proc.stderr or "")
        result(rows, "serious content collision is caught from rendered DOM geometry",
               block_proc.returncode != 0 and "serious rendered content-block collision" in block_text,
               block_text[-500:])
        result(rows, "DocumentEvidence claim region renders with deterministic safe focus margin",
               document_proc.returncode == 0 and document_output.is_file(),
               ((document_proc.stdout or "") + (document_proc.stderr or ""))[-500:])
        document_bad_text = (document_bad_proc.stdout or "") + (document_bad_proc.stderr or "")
        result(rows, "DocumentEvidence focus below minimum width is rejected",
               document_bad_proc.returncode != 0 and "at least 70%" in document_bad_text,
               document_bad_text[-500:])
        geometry_source = (ROOT / "src" / "primitives" / "DocumentEvidence.jsx").read_text(encoding="utf-8")
        result(rows, "DocumentEvidence maps source regions through actual contain geometry",
               "containRect" in geometry_source and "mappedSafe.left" in geometry_source and
               "contained.left + normalized[0] * contained.width" in geometry_source)
        result(rows, "DocumentEvidence derives claim aspect from source dimensions",
               "sourceWidth / sourceHeight" in geometry_source and
               "sourceAspect: derivedSourceAspect" in geometry_source)
        result(rows, "DocumentEvidence claim focus has deterministic 70 percent minimum",
               "MIN_CLAIM_FOCUS_WIDTH_RATIO = 0.7" in geometry_source and
               "data-videoagent-min-width-ratio" in geometry_source)
        shared = (ROOT / "src" / "scenes" / "shared.jsx").read_text(encoding="utf-8")
        result(rows, "Vietnamese diacritic line geometry remains protected",
               "lineHeight = 1.34" in shared and "overflow: \"hidden\"" in shared)
        result(rows, "short punch phrase and nowrap protections remain active",
               "measure(l, fontSize) > withinWidth" in shared and
               'whiteSpace: "nowrap"' in shared and 'flexWrap: "nowrap"' in shared)
        result(rows, "letter spacing and single-line strike protections remain active",
               text_gate.text_width("THIẾT BỊ ĐO", 44, letter_spacing=1) >
               text_gate.text_width("THIẾT BỊ ĐO", 44, letter_spacing=0) and
               text_gate.MAX_STRIKE_LINES == 1)
    finally:
        for directory in (safe_dir, bad_dir, block_dir, document_dir, document_bad_dir):
            shutil.rmtree(directory, ignore_errors=True)


def source_scout_checks(rows):
    path = ROOT / ".claude" / "agents" / "source-scout.md"
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    skill = (HERE.parent / "SKILL.md").read_text(encoding="utf-8")
    contract_path = HERE.parent / "references" / "pexels-source-worker.md"
    contract = contract_path.read_text(encoding="utf-8") if contract_path.is_file() else ""
    compact_text = " ".join(text.split())
    compact_skill = " ".join(skill.split())
    result(rows, "Claude-compatible Source Scout file is retained without false Codex-native claim",
           path.is_file() and "Claude-compatible" in text and
           "not authoritative for Codex" in text)
    result(rows, "one compact Pexels worker reference is canonical",
           contract_path.is_file() and "canonical contract" in contract and
           not (HERE.parent / "references" / "pexels-source-worker" / "SKILL.md").exists())
    result(rows, "Source Scout policy is native-first with exactly one native attempt",
           "NATIVE-FIRST + BOUNDED FALLBACK-MAIN" in skill and
           "attempt Source Scout delegation exactly once" in skill)
    result(rows, "one failed/unavailable native spawn falls back to main without retry",
           "sourceScoutMode` to `fallback-main`" in compact_skill and
           "do not retry it" in compact_skill)
    result(rows, "Source Scout compact brief excludes full plan/transcript",
           "at most 2,048 bytes" in text and "whole transcript/PLAN" in text)
    result(rows, "Source Scout candidate cap is eight", "at most eight previews" in text)
    result(rows, "Source Scout retry cap is one", "one optional refinement" in text)
    result(rows, "Source Scout write scope excludes canonical production paths",
           "input/.videoagent/V<N>/candidates/<needId>/" in text and
           "Never write `src/`, `input/V<N>/`, or `public/V<N>/`" in text)
    result(rows, "Source Scout cannot recursively spawn agents",
           "never" in compact_text.lower() and "spawn another agent" in compact_text)
    result(rows, "fallback-main cannot claim proven subagent economics",
           "NOT PROVEN — native Codex" in skill and "never PASS" in skill)
    result(rows, "benchmark-required Source Scout mode is fail-closed",
           "native-cheap-worker-required" in skill and
           "BLOCKED — PEXELS_CHEAP_WORKER_NOT_AVAILABLE" in skill)


def active_workflow_checks(rows):
    stale = ROOT / "docs" / "Non-tech làm AI _ SKILL VOX-STYLE VIDEO.md"
    active = [HERE.parent / "SKILL.md", *(HERE.parent / "references" / name for name in
              ("gates.md", "primitives.md", "visual-language.md", "worked-examples.md"))]
    text = "\n".join(path.read_text(encoding="utf-8") for path in active if path.is_file()).lower()
    result(rows, "stale Non-tech workflow document is absent", not stale.exists())
    result(rows, "active fresh-production documentation has no generate_sfx reference",
           "generate_sfx.py" not in text)
    obsolete = ("run every downloaded photo through", "every pexels image", "every photo through rembg")
    result(rows, "active fresh-production documentation has no every-photo-cutout instruction",
           not any(phrase in text for phrase in obsolete))
    result(rows, "active fresh-production documentation does not advertise SceneTemplates or generic kits",
           "scenetemplates" not in text and "generic sticker" not in text and
           "generic icon storytelling" not in text)
    forbidden = ("fetch_pixabay.py", "fetch_unsplash.py", "fetch_wikimedia.py",
                 "fetch_pexels_video.py", "media_sources.py")
    result(rows, "Pexels PHOTO remains the only structured external provider",
           all(not (HERE / name).exists() for name in forbidden))
    adapter = ROOT / ".agents" / "skills" / "vox-collage-video" / "SKILL.md"
    adapter_text = adapter.read_text(encoding="utf-8") if adapter.is_file() else ""
    canonical = (HERE.parent / "SKILL.md").read_text(encoding="utf-8")
    compact_adapter = " ".join(adapter_text.split())
    compact_canonical = " ".join(canonical.split())
    result(rows, "Codex project skill adapter exists", adapter.is_file())
    result(rows, "Codex adapter points to canonical Claude skill authority",
           ".claude/skills/vox-collage-video/SKILL.md" in adapter_text)
    result(rows, "Codex adapter is thin and does not duplicate canonical workflow",
           len(adapter_text.encode("utf-8")) < 1800 and len(adapter_text) < len(canonical) / 5 and
           "## 1. INGEST" not in adapter_text)
    result(rows, "Codex adapter distinguishes Claude hooks from Codex enforcement",
           ".claude/settings.json" in compact_adapter and "Claude Code hook wiring" in compact_adapter and
           "Never claim “Codex hooks passed”" in compact_adapter)
    result(rows, "canonical skill documents explicit Codex gate behavior truthfully",
           "thin `.agents/skills/vox-collage-video/SKILL.md` adapter" in compact_canonical and
           "Codex must invoke the canonical integrity scripts explicitly" in compact_canonical and
           "No platform may claim hook or gate enforcement it did not actually execute" in compact_canonical)


def cleanup_checks(tmp, paths, plan, rows):
    rejected = paths["runtime"] / "candidates" / "S1" / "rejected.jpg"; image(rejected)
    evidence = []
    for name in ("need.json", "candidates.json", "triage.json",
                 "worker_return.json", "worker_receipt.json"):
        path = rejected.parent / name; path.write_text("{}\n", encoding="utf-8"); evidence.append(path)
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
    result(rows, "compact Pexels sourcing evidence survives cleanup",
           all(path.resolve() not in targets for path in evidence))
    result(rows, "temporary extraction and promoted frames are deterministic disposables",
           temp.resolve() in targets and promoted.resolve() in targets)
    result(rows, "locked selected asset is never proposed", (paths["assets"] / "record-1.png").resolve() not in targets)
    result(rows, "canonical PREVIS baseline evidence is retained",
           all(path.resolve() not in targets for path in paths["previs_frames"].glob("*.png")))
    result(rows, "final deliverable is retained", paths["final"].resolve() not in targets)


def architecture_checks(paths, plan, rows):
    lifecycle = contracts.CANONICAL_STAGES
    result(rows, "six-stage product lifecycle is represented coherently",
           lifecycle == ("INGEST", "PLAN", "ASSET LOCK", "PREVIS", "PROMOTE", "REVIEW + FINAL")
           and contracts.HUMAN_PREVIS_APPROVAL == "HUMAN PREVIS APPROVAL")
    primitives = {path.name for path in (ROOT / "src" / "primitives").glob("*.jsx")}
    expected = {"DocumentEvidence.jsx", "MapGraphic.jsx", "DataChart.jsx", "Captions.jsx",
                "media.jsx", "Reveal.jsx", "RelationDiagram.jsx", "LayoutSafety.jsx"}
    result(rows, "canonical primitive surface is compact and complete", primitives == expected)
    result(rows, "build gate primitive allowlist exactly matches compact surface",
           build_gate.CANONICAL_PRIMITIVE_FILES == expected)
    retired = {"Card", "Node", "Arrow", "Person", "Money", "Phone", "Vehicle", "Chain"}
    result(rows, "generic illustrative families are absent from primitive filenames",
           not retired.intersection({pathlib.Path(name).stem for name in primitives}))
    primitive_text = "\n".join(path.read_text(encoding="utf-8")
                               for path in (ROOT / "src" / "primitives").glob("*.jsx"))
    exported = set(re.findall(r"export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)", primitive_text))
    result(rows, "fresh default primitive exports contain no generic semantic kit",
           not retired.intersection(exported), f"exports={sorted(exported)}")
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
           record["workerTokens"] == "UNKNOWN" and record["mainTokens"] == "UNKNOWN" and
           record["context"] == "UNKNOWN")


def checks(tmp):
    rows = []
    paths, plan = project(tmp)
    plan_checks(tmp, paths, plan, rows)
    media_checks(paths, plan, rows)
    fresh_integrity_checks(paths, plan, rows)
    timing_checks(paths, plan, rows)
    conformance_checks(paths, plan, rows)
    review_checks(tmp / "review-scale", rows)
    pexels_checks(tmp / "pexels-key-fixture", rows)
    optional_dependency_checks(rows)
    layout_checks(rows)
    source_scout_checks(rows)
    active_workflow_checks(rows)
    cleanup_checks(tmp, paths, plan, rows)
    architecture_checks(paths, plan, rows)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="v18-rebuilt-spec-") as directory:
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