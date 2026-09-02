"""Validate the semantic MEDIA-FIRST plan without designing scenes as UI.

Fresh plans declare ``schemaVersion: media-first-plan-v1``. Historical plans are
accepted by a deliberately small compatibility branch; they are not examples for
new production. Timing frames, component choice, templates and geometry do not
belong in a fresh plan.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
import unicodedata

import pipeline_contracts as contracts
import stage_state as state

SCHEMA_VERSION = "media-first-plan-v1"
MATERIAL_INTENTS = {
    "authentic", "contextual", "document", "reconstruction", "map", "chart",
    "diagram-exception",
}
REQUIRED_SCENE_FIELDS = (
    "id", "startSec", "endSec", "narrativeFunction", "viewerQuestion",
    "visualTransformation", "contrastWithPrevious", "comprehensionLoad",
)
FORBIDDEN_SCENE_FIELDS = {
    "template", "backdrop", "variant", "durationInFrames", "masterStartFrame",
    "visualEvents", "previsFrames", "previsFrameRoles", "previsOpenFrame",
    "previsKeyFrame", "previsMidFrame", "component", "geometry", "layout",
}
FORBIDDEN_MATERIAL_FIELDS = {
    "delay", "from", "to", "visibleFor", "durationInFrames", "x", "y", "top",
    "left", "right", "bottom", "width", "height", "slot", "style", "transform",
    "opacity", "rotation", "easing", "component",
}
EMPTY = {"", "none", "n/a", "tbd", "todo", "?", "-"}
GENERIC = {
    "relevant image", "appropriate image", "professional visual", "visual related",
    "hình ảnh phù hợp", "hình ảnh liên quan", "minh họa nội dung", "minh hoạ nội dung",
}
MANUAL = re.compile(r"^manual\s*[—-]\s*(.+)$", re.I)


class Report:
    def __init__(self):
        self.failures = []
        self.lines = []

    def fail(self, message):
        self.failures.append(message)
        self.lines.append(f"FAIL {message}")

    def ok(self, message):
        self.lines.append(f"OK   {message}")

    def info(self, message):
        self.lines.append(f"     {message}")


def empty(value):
    return value is None or (isinstance(value, str) and value.strip().lower() in EMPTY)


def normalize(value):
    value = unicodedata.normalize("NFKC", str(value or "")).lower()
    return " ".join(re.sub(r"[^\w]+", " ", value, flags=re.UNICODE).split())


def load_words(path):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))["words"]
    except (OSError, KeyError, json.JSONDecodeError):
        return None


def phrase_in_scene(words, phrase, start, end):
    if not words:
        return True
    target = normalize(phrase)
    spoken = normalize(" ".join(str(item[0]) for item in words if start <= float(item[1]) < end))
    return bool(target) and target in spoken


def valid_region(region):
    if not isinstance(region, list) or len(region) != 4:
        return False
    if not all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in region):
        return False
    x, y, width, height = region
    return x >= 0 and y >= 0 and width > 0 and height > 0 and x + width <= 1 and y + height <= 1


def material_id(material, index):
    return str(material.get("id") or material.get("name") or f"material-{index + 1}")


def gate_material(scene, material, index, words, report):
    sid = scene.get("id", "?")
    prefix = f"{sid}/{material_id(material, index)}"
    intent = material.get("materialIntent")
    if intent not in MATERIAL_INTENTS:
        report.fail(f"{prefix}: materialIntent must be one of {', '.join(sorted(MATERIAL_INTENTS))}")
        return
    brief = str(material.get("mediaBrief") or "").strip()
    if len(brief) < 20 or normalize(brief) in GENERIC:
        report.fail(f"{prefix}: mediaBrief must say what the material shows or proves")
    anchor = str(material.get("anchorPhrase") or "").strip()
    manual = MANUAL.match(anchor)
    if not anchor:
        report.fail(f"{prefix}: anchorPhrase is required for the evidence/visual need")
    elif manual:
        if len(manual.group(1).strip()) < 8:
            report.fail(f"{prefix}: manual anchor needs a compact specific reason")
    elif not phrase_in_scene(words, anchor, float(scene.get("startSec", 0)),
                             float(scene.get("endSec", 0))):
        report.fail(f"{prefix}: anchorPhrase {anchor!r} is not spoken inside the scene")
    for field in FORBIDDEN_MATERIAL_FIELDS.intersection(material):
        report.fail(f"{prefix}: implementation field {field!r} is forbidden in a fresh PLAN")
    if intent == "diagram-exception":
        reason = str(material.get("diagramJustification") or "").strip()
        if len(reason) < 30:
            report.fail(f"{prefix}: diagram-exception requires a specific editorial reason why photo/video/document/map/chart/reconstruction cannot communicate the relationship")
    elif material.get("diagramJustification"):
        report.fail(f"{prefix}: diagramJustification is valid only for diagram-exception")
    if intent == "map" and empty(material.get("mapDataIdentity")):
        report.fail(f"{prefix}: map requires mapDataIdentity for actual geography")
    if intent == "chart":
        data = material.get("numericData")
        if not isinstance(data, list) or not data or not all(
                isinstance(value, (int, float)) and not isinstance(value, bool) for value in data):
            report.fail(f"{prefix}: chart requires real numericData from the case/script/evidence")
        if empty(material.get("dataSource")):
            report.fail(f"{prefix}: chart requires dataSource")
    if intent == "reconstruction" and empty(material.get("reconstructionLabel")):
        report.fail(f"{prefix}: reconstruction requires a truthful reconstructionLabel")
    if intent == "document" and material.get("evidenceIdentity"):
        regions = material.get("evidenceRegions") or []
        if not isinstance(regions, list):
            report.fail(f"{prefix}: evidenceRegions must be a list")
        else:
            for ridx, mapping in enumerate(regions):
                if not isinstance(mapping, dict) or not mapping.get("anchorPhrase") or not valid_region(mapping.get("region")):
                    report.fail(f"{prefix}/evidenceRegions[{ridx}]: requires anchorPhrase and normalized [x,y,w,h]")


def gate_canonical(plan, words, report):
    scenes = plan.get("scenes") or []
    fps = int(plan.get("fps") or 0)
    if fps <= 0:
        report.fail("fps must be a positive integer")
    if not scenes:
        report.fail("plan contains no scenes")
        return
    for index, scene in enumerate(scenes):
        sid = scene.get("id", "?")
        for field in REQUIRED_SCENE_FIELDS:
            if empty(scene.get(field)):
                report.fail(f"{sid}: semantic field {field!r} is required")
        if scene.get("comprehensionLoad") not in {"simple", "moderate", "complex"}:
            report.fail(f"{sid}: comprehensionLoad must be simple, moderate, or complex")
        try:
            start, end = float(scene.get("startSec")), float(scene.get("endSec"))
        except (TypeError, ValueError):
            report.fail(f"{sid}: startSec/endSec must be numeric")
            continue
        if end <= start:
            report.fail(f"{sid}: endSec must be greater than startSec")
        for field in FORBIDDEN_SCENE_FIELDS.intersection(scene):
            report.fail(f"{sid}: implementation field {field!r} is forbidden in {SCHEMA_VERSION}")
        materials = scene.get("materials")
        if materials is None:
            report.fail(f"{sid}: fresh PLAN uses a materials list (which may be empty), not an implementation asset list")
            materials = []
        if not isinstance(materials, list):
            report.fail(f"{sid}: materials must be a list")
            materials = []
        seen = set()
        for material_index, material in enumerate(materials):
            if not isinstance(material, dict):
                report.fail(f"{sid}/materials[{material_index}]: material must be an object")
                continue
            mid = material_id(material, material_index)
            if mid in seen:
                report.fail(f"{sid}: duplicate material id {mid!r}")
            seen.add(mid)
            gate_material(scene, material, material_index, words, report)
        if index:
            previous = scenes[index - 1]
            if abs(start - float(previous.get("endSec", 0))) > 0.01:
                report.fail(f"timeline gap/overlap between {previous.get('id')} and {sid}")
        if fps > 0:
            report.info(f"{sid}: durationInFrames={state.scene_duration(scene, fps)} derived from startSec/endSec/fps")
    if not report.failures:
        report.ok(f"{len(scenes)} semantic scenes are complete; material intent and anchors are honest")


def gate_legacy(plan, words, report):
    """Historical compatibility only; never advertises or validates a visual kit."""
    scenes = plan.get("scenes") or []
    if not scenes:
        report.fail("legacy plan contains no scenes")
        return
    required = REQUIRED_SCENE_FIELDS[:-1]
    for scene in scenes:
        sid = scene.get("id", "?")
        for field in required:
            if empty(scene.get(field)):
                report.fail(f"{sid}: historical semantic field {field!r} is required")
        if float(scene.get("endSec", 0)) <= float(scene.get("startSec", 0)):
            report.fail(f"{sid}: endSec must be greater than startSec")
        for material in state.scene_materials(scene):
            phrase = material.get("anchorPhrase")
            if phrase and not phrase_in_scene(words, phrase, float(scene.get("startSec", 0)),
                                              float(scene.get("endSec", 0))):
                report.fail(f"{sid}: historical anchorPhrase {phrase!r} is outside the scene")
    report.info("historical compatibility branch used; this schema is not a fresh-production example")


def validate(plan_path, words_override=None):
    plan_path = pathlib.Path(plan_path).resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    words_path = state.project_path(root, words_override) if words_override else state.words_path(root, plan)
    words = load_words(words_path)
    report = Report()
    lifecycle = contracts.lifecycle_contract(plan)
    for item in lifecycle["invalidSceneStatuses"]:
        report.fail(f"{item.get('scene')}: invalid lifecycle status {item.get('status')!r}")
    if lifecycle["anyPrevis"] and not contracts.approval_contract(plan)["approved"]:
        report.fail("shotlistApproved must be true before PREVIS")
    if plan.get("schemaVersion") == SCHEMA_VERSION:
        gate_canonical(plan, words, report)
    else:
        gate_legacy(plan, words, report)
    return plan, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan")
    parser.add_argument("--words")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--hook", action="store_true", help="accepted for hook compatibility")
    args, _unknown = parser.parse_known_args()
    path = state.project_path(state.project_root(__file__), args.plan)
    try:
        plan, report = validate(path, args.words)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"FAIL unreadable semantic plan: {exc}", file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps({"passed": not report.failures, "failures": report.failures,
                          "scenes": len(plan.get("scenes") or [])}, ensure_ascii=False, indent=2))
    else:
        print("\n".join(report.lines))
        print(f"\n{'FAILED' if report.failures else 'PASSED'} ({len(report.failures)} failure(s))")
    return 1 if report.failures else 0


if __name__ == "__main__":
    sys.exit(main())