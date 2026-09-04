"""Validate the semantic V18-rebuilt plan without turning PLAN into JSX.

Fresh plans declare ``schemaVersion: v18-rebuilt-plan-v1``. They retain V18's
editorial reasoning and pacing intelligence while excluding component choice,
geometry and authored frame timing. Integrity contradictions are hard failures;
pacing and aesthetic monotony are advisories for the human editor.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import statistics
import sys
import unicodedata

import pipeline_contracts as contracts
import stage_state as state

SCHEMA_VERSION = "v18-rebuilt-plan-v1"
MATERIAL_INTENTS = {
    "authentic", "contextual", "document", "reconstruction", "map", "chart",
    "diagram-exception",
}
DOCUMENT_EVIDENCE_MODES = {"claim", "context"}
DOCUMENT_EVIDENCE_REQUIREMENTS = {"claim", "context"}
REQUIRED_SCENE_FIELDS = (
    "id", "startSec", "endSec", "narrativeFunction", "viewerQuestion",
    "visualTransformation", "contrastWithPrevious", "comprehensionLoad",
    "visualTreatment",
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

# Treatment is free editorial wording, not a closed component enum. These stems
# only provide stable mechanical grouping for repetition and contradiction checks.
TREATMENT_STEMS = {
    "authentic": ("authentic", "case evidence", "actual footage", "primary-source image"),
    "contextual": ("contextual", "real-world", "photograph", "photographic", "location plate"),
    "document": ("document", "judgment", "judgement", "statute", "official text", "source identity"),
    "reconstruction": ("reconstruction", "re-enactment", "reenactment", "depiction"),
    "map": ("map", "geographic", "geography", "route", "spatial"),
    "timeline": ("timeline", "chronology", "chronological", "sequence of events"),
    "chart": ("chart", "quantitative", "numeric", "data comparison"),
    "relation": ("relation", "relationship", "causal structure", "diagram"),
    "textual": ("quote", "textual", "typographic", "verbatim wording"),
}
COMPONENT_SELECTORS = {
    "documentevidence", "mapgraphic", "datachart", "relationdiagram", "mediaplate",
    "reveal", "card", "node", "person", "money", "phone", "vehicle", "chain",
    "collagescene", "splitscene", "timelinescene",
}
RECOUNT_STEMS = (
    "recount", "narrative", "event", "action", "movement", "location", "place",
    "detention", "confinement", "coercion", "phone", "family", "transfer",
    "chronology", "chronological", "sequence", "journey", "what happened",
)
CAMERA_WORDS = {
    "crop", "cropped", "tighter", "tighten", "tightens", "zoom", "zooms", "zoomed",
    "shift", "shifts", "shifted", "center", "centers", "centered", "centre", "reframe",
    "reframes", "reframed", "focus", "focuses", "focused", "push", "pushes", "pushed",
    "pan", "pans", "panned", "page", "document", "same", "source", "image", "plate",
    "differently", "closer", "in", "out", "on", "to", "the", "a", "and", "then",
}


class Report:
    def __init__(self):
        self.failures = []
        self.advisories = []
        self.lines = []

    def fail(self, message):
        self.failures.append(message)
        self.lines.append(f"FAIL {message}")

    def advise(self, message):
        self.advisories.append(message)
        self.lines.append(f"WARN {message}")

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


def phrase_start(words, phrase, start, end):
    if not words:
        return None
    target = normalize(phrase).split()
    flattened = []
    for item in words:
        if start <= float(item[1]) < end:
            flattened.extend((token, float(item[1])) for token in normalize(item[0]).split())
    for index in range(len(flattened) - len(target) + 1):
        if [item[0] for item in flattened[index:index + len(target)]] == target:
            return flattened[index][1]
    return None


def valid_region(region):
    if not isinstance(region, list) or len(region) != 4:
        return False
    if not all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in region):
        return False
    x, y, width, height = region
    return x >= 0 and y >= 0 and width > 0 and height > 0 and x + width <= 1 and y + height <= 1


def material_id(material, index):
    return str(material.get("id") or material.get("name") or f"material-{index + 1}")


def treatment_family(value):
    text = normalize(value)
    for family, stems in TREATMENT_STEMS.items():
        if any(normalize(stem) in text for stem in stems):
            return family
    # Free wording remains legal and mechanically repeatable without becoming a
    # component taxonomy.
    return text


def document_based_treatment(value):
    text = normalize(value)
    return any(normalize(stem) in text for stem in TREATMENT_STEMS["document"])


def narrative_kind(scene):
    text = normalize(" ".join(str(scene.get(key) or "") for key in
                              ("narrativeFunction", "viewerQuestion", "visualTransformation")))
    if any(normalize(stem) in text for stem in RECOUNT_STEMS):
        return "recount"
    return "other"


def camera_only_transformation(value):
    tokens = set(normalize(value).split())
    return bool(tokens) and tokens.issubset(CAMERA_WORDS)


def concrete_reason(value, minimum=24):
    text = normalize(value)
    vague = {"official source exists", "document is official", "no other option",
             "depiction would mislead", "use the document"}
    return len(str(value or "").strip()) >= minimum and text not in vague


def valid_claim_document(material):
    regions = material.get("evidenceRegions")
    return (material.get("materialIntent") == "document"
            and material.get("documentEvidenceMode") == "claim"
            and not empty(material.get("evidenceIdentity"))
            and isinstance(regions, list) and bool(regions)
            and all(isinstance(item, dict) and bool(str(item.get("anchorPhrase") or "").strip())
                    and valid_region(item.get("region")) for item in regions))


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
        report.fail(f"{prefix}: anchorPhrase is required for the meaning-bearing need")
    elif manual:
        if len(manual.group(1).strip()) < 8:
            report.fail(f"{prefix}: manual anchor needs a compact specific reason")
    elif not phrase_in_scene(words, anchor, float(scene.get("startSec", 0)),
                             float(scene.get("endSec", 0))):
        report.fail(f"{prefix}: anchorPhrase {anchor!r} is not spoken inside the scene")
    else:
        anchored = phrase_start(words, anchor, float(scene.get("startSec", 0)),
                                float(scene.get("endSec", 0)))
        if anchored is not None and float(scene.get("endSec", 0)) - anchored < 1.0:
            report.advise(f"{prefix}: anchor leaves under 1.0s of usable on-screen legibility")
    for field in FORBIDDEN_MATERIAL_FIELDS.intersection(material):
        report.fail(f"{prefix}: implementation field {field!r} is forbidden in a fresh PLAN")
    if intent == "diagram-exception":
        reason = str(material.get("diagramJustification") or "").strip()
        if len(reason) < 30:
            report.fail(f"{prefix}: diagram-exception requires a specific reason why truthful media/map/chart/reconstruction cannot communicate this relation")
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
    if intent == "document":
        mode = material.get("documentEvidenceMode")
        if mode not in DOCUMENT_EVIDENCE_MODES:
            report.fail(f"{prefix}: documentEvidenceMode must be claim or context")
            return
        regions = material.get("evidenceRegions")
        if mode == "claim":
            if empty(material.get("evidenceIdentity")):
                report.fail(f"{prefix}: claim document requires evidenceIdentity")
            if not isinstance(regions, list) or not regions:
                report.fail(f"{prefix}: claim document requires non-empty evidenceRegions")
                regions = []
        elif regions is None:
            regions = []
        elif not isinstance(regions, list):
            report.fail(f"{prefix}: evidenceRegions must be a list")
            regions = []
        for ridx, mapping in enumerate(regions):
            if not isinstance(mapping, dict) or not mapping.get("anchorPhrase") or not valid_region(mapping.get("region")):
                report.fail(f"{prefix}/evidenceRegions[{ridx}]: requires anchorPhrase and normalized [x,y,w,h]")
                continue
            if not phrase_in_scene(words, mapping["anchorPhrase"], float(scene.get("startSec", 0)),
                                   float(scene.get("endSec", 0))):
                report.fail(f"{prefix}/evidenceRegions[{ridx}]: anchorPhrase is not spoken inside the scene")


def pacing_advisories(scenes, report):
    durations = [float(scene.get("endSec", 0)) - float(scene.get("startSec", 0)) for scene in scenes]
    for index in range(max(0, len(durations) - 4)):
        run = durations[index:index + 5]
        if max(run) - min(run) <= 0.18 and statistics.mean(run) > 0:
            ids = f"{scenes[index].get('id')}–{scenes[index + 4].get('id')}"
            report.advise(f"{ids}: suspicious near-equal/metronomic five-scene duration run")
    high_run = []
    for scene in scenes + [{}]:
        if normalize(scene.get("comprehensionLoad")) in {"high", "complex"}:
            high_run.append(scene)
        else:
            if len(high_run) >= 3:
                report.advise(f"{high_run[0].get('id')}–{high_run[-1].get('id')}: {len(high_run)} consecutive high-comprehension scenes need breathing-space review")
            high_run = []
    for scene, duration in zip(scenes, durations):
        if normalize(scene.get("comprehensionLoad")) in {"high", "complex"} and duration < 3.5:
            report.advise(f"{scene.get('id')}: complex scene is implausibly short at {duration:.2f}s")
    families = [treatment_family(scene.get("visualTreatment")) for scene in scenes]
    start = 0
    while start < len(families):
        end = start + 1
        while end < len(families) and families[end] == families[start]:
            end += 1
        if families[start] and end - start >= 4:
            report.advise(f"{scenes[start].get('id')}–{scenes[end - 1].get('id')}: excessive consecutive visualTreatment repetition ({families[start]})")
        start = end


def gate_canonical(plan, words, report):
    scenes = plan.get("scenes") or []
    fps = int(plan.get("fps") or 0)
    if fps <= 0:
        report.fail("fps must be a positive integer")
    if not scenes:
        report.fail("plan contains no scenes")
        return
    camera_run = []
    for index, scene in enumerate(scenes):
        sid = scene.get("id", "?")
        for field in REQUIRED_SCENE_FIELDS:
            if empty(scene.get(field)):
                report.fail(f"{sid}: semantic field {field!r} is required")
        treatment = normalize(scene.get("visualTreatment"))
        if treatment in COMPONENT_SELECTORS or any(token in COMPONENT_SELECTORS for token in treatment.split()):
            report.fail(f"{sid}: visualTreatment is editorial modality, not a JSX component selector")
        if camera_only_transformation(scene.get("visualTransformation")):
            camera_run.append(sid)
        start, end = float(scene.get("startSec", 0)), float(scene.get("endSec", 0))
        if end <= start:
            report.fail(f"{sid}: endSec must be greater than startSec")
        for field in FORBIDDEN_SCENE_FIELDS.intersection(scene):
            report.fail(f"{sid}: implementation field {field!r} is forbidden in {SCHEMA_VERSION}")
        materials = scene.get("materials")
        if materials is None:
            report.fail(f"{sid}: fresh PLAN uses a materials list (which may be empty)")
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
        document_materials = [material for material in materials
                              if isinstance(material, dict)
                              and material.get("materialIntent") == "document"]
        requirement = scene.get("documentEvidenceRequirement")
        if "documentEvidenceRequirement" in scene and requirement not in DOCUMENT_EVIDENCE_REQUIREMENTS:
            report.fail(f"{sid}: documentEvidenceRequirement must be claim or context")
        if document_materials and "documentEvidenceRequirement" not in scene:
            report.fail(f"{sid}: documentEvidenceRequirement is required when the scene contains document material")
        elif document_materials and requirement == "claim" \
                and not any(valid_claim_document(material) for material in document_materials):
            report.fail(f"{sid}: documentEvidenceRequirement=claim requires at least one valid claim-mode document material")
        elif document_materials and requirement == "context" \
                and any(material.get("documentEvidenceMode") != "context"
                        for material in document_materials):
            report.fail(f"{sid}: documentEvidenceRequirement=context requires every document material to use documentEvidenceMode=context")
        if narrative_kind(scene) == "recount" and document_based_treatment(scene.get("visualTreatment")):
            if not concrete_reason(scene.get("documentOnlyJustification"), 30):
                report.fail(f"{sid}: narrative/recount document-only treatment needs a concrete reason truthful depiction would mislead or fabricate")
        if index:
            previous = scenes[index - 1]
            if abs(start - float(previous.get("endSec", 0))) > 0.01:
                report.fail(f"timeline gap/overlap between {previous.get('id')} and {sid}")
        if fps > 0:
            report.info(f"{sid}: durationInFrames={state.scene_duration(scene, fps)} derived from startSec/endSec/fps")
    if camera_run:
        report.fail("visualTransformation is not semantic in " + ", ".join(camera_run) +
                    ": crop/zoom/shift/center/reframe wording alone cannot claim a new transformation")
    pacing_advisories(scenes, report)
    if not report.failures:
        report.ok(f"{len(scenes)} semantic scenes are complete; treatment, material intent and anchors are distinct")


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
                          "advisories": report.advisories,
                          "scenes": len(plan.get("scenes") or [])}, ensure_ascii=False, indent=2))
    else:
        print("\n".join(report.lines))
        print(f"\n{'FAILED' if report.failures else 'PASSED'} ({len(report.failures)} failure(s), {len(report.advisories)} advisory(s))")
    return 1 if report.failures else 0


if __name__ == "__main__":
    sys.exit(main())