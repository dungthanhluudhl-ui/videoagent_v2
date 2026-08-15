"""
hook_gate.py - the enforcement layer. Run BY THE HARNESS, not by the model.

Everything else in this skill is advice the model can talk itself out of.
The evidence that this is a real failure mode, not a hypothetical one: while
building V10/Itaewon the model ignored three rules that were already written
plainly in SKILL.md (no universal-symbol imagery, place the headline against
the real hero cluster, never quietly drop a planned asset) - and wrote its
reasoning for one of them into a code comment. Nothing stopped it, because
nothing could.

Hooks can. Claude Code runs these itself and feeds a non-zero exit back to
the model as something it must address, so a violation cannot be narrated
away.

Wired from .claude/settings.json:

    PostToolUse (Write|Edit)  py -3 hook_gate.py post-edit
    Stop                      py -3 hook_gate.py stop

Contract with Claude Code:
    exit 0  - fine, stay quiet
    exit 2  - BLOCK; stderr is shown to the model as required feedback
    other   - non-blocking error

Two safety rules make this safe to leave switched on permanently:

1. SCOPED. With one deliberate exception, it does nothing unless an ACTIVE
   scene plan exists (`input/scene_plan*.json` with top-level
   "status": "active"). Unrelated work in this repo - and any other project -
   is untouched. Set the plan's status to "shipped" when a video is done and
   the gates go quiet.

   The exception is `guard_planless_scene`: a scene file for a video newer
   than every planned video is blocked outright. Without it the whole system
   was absent at the one moment it mattered most - the start of a new video,
   before any plan exists - which let the original "shot list only lived in
   chat" defect back in through the front door.
2. FAIL-OPEN. Any unexpected error (bad JSON, missing script, crash) prints
   a warning and exits 0. A gate that bricks the repo when it has a bug is
   worse than no gate; the failure mode has to be "stops enforcing", never
   "stops working".
"""

import json
import pathlib
import re
import subprocess
import sys

SCRIPTS = pathlib.Path(__file__).resolve().parent
SCENE_FILE_HINT = "src/scenes/"
SCENE_FILE_RE = re.compile(r"V(\d+)Scene\w*\.jsx$")


def find_active_plan(root):
    """The single active scene plan, or None. More than one active plan is
    itself a mistake worth reporting rather than guessing between."""
    plans = []
    for path in sorted((root / "input").glob("scene_plan*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if data.get("status") == "active":
            plans.append((path, data))
    if len(plans) > 1:
        print(f"[vox-gate] several active plans ({', '.join(str(p) for p, _ in plans)}) - "
              f"set all but one to \"status\": \"shipped\"", file=sys.stderr)
        return None
    return plans[0] if plans else None


def planned_video_numbers(root):
    """{10, 11, ...} - every video that has a plan file, active or not."""
    nums = set()
    for path in (root / "input").glob("scene_plan*.json"):
        m = re.search(r"scene_plan(\d+)\.json$", path.name)
        if m:
            nums.add(int(m.group(1)))
    return nums


def guard_planless_scene(payload, root):
    """Close the biggest hole in this whole system.

    Every other check here is scoped to an ACTIVE plan, and `main` used to
    return 0 the moment none was found. So the enforcement layer was absent
    exactly when it mattered most: at the START of a new video, before any
    plan file exists. Nothing stopped scene files being written straight from
    a chat shot list - which is the original defect this skill was built to
    make impossible, reachable again simply by doing things in the wrong order.

    Rule: a scene file for a video NEWER than every planned video must not be
    written until that video has `input/scene_plan<N>.json`. Older videos
    (V3-V9 here) predate the convention and are deliberately left alone -
    blocking edits to already-shipped work would be a bug, not enforcement.
    """
    tool_input = payload.get("tool_input") or {}
    edited = str(tool_input.get("file_path") or tool_input.get("path") or "")
    edited_norm = edited.replace("\\", "/")
    if SCENE_FILE_HINT not in edited_norm:
        return 0
    m = SCENE_FILE_RE.search(edited_norm)
    if not m:
        return 0
    video = int(m.group(1))
    planned = planned_video_numbers(root)
    if not planned or video in planned or video <= max(planned):
        return 0

    print(
        f"[vox-gate] {pathlib.Path(edited_norm).name} belongs to video V{video}, which has "
        f"no plan file. `input/scene_plan{video}.json` must exist BEFORE any scene of it "
        f"is written.\n"
        f"Scaffold it with:\n"
        f"    py -3 .claude/skills/vox-collage-video/scripts/new_video.py {video} "
        f"--words input/words{video}_aligned.json\n"
        f"then fill in step 2a/2b per SKILL.md, get it past plan_gate.py and past "
        f"baseline_gate.py check, and show the shot list to the user for approval.\n"
        f"Building scenes from a shot list that only exists in chat is the exact defect "
        f"this skill was built to make impossible.",
        file=sys.stderr)
    return 2


def run(script, *args):
    """(exit_code, combined_output) for one gate script."""
    proc = subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def scene_id_for(path, plan_data):
    """Map src/scenes/V10Scene13.jsx -> "S13" using the plan's own video
    prefix, so V9/V10 files never gate against each other's plan."""
    video = plan_data.get("video", "")
    stem = pathlib.Path(path).stem
    if not video or not stem.startswith(f"{video}Scene"):
        return None
    return "S" + stem[len(f"{video}Scene"):]


def post_edit(payload, root, plan):
    plan_path, plan_data = plan
    tool_input = payload.get("tool_input") or {}
    edited = tool_input.get("file_path") or tool_input.get("path") or ""
    edited_norm = str(edited).replace("\\", "/")
    if SCENE_FILE_HINT not in edited_norm or not edited_norm.endswith(".jsx"):
        return 0

    sid = scene_id_for(edited_norm, plan_data)
    if not sid or not any(s.get("id") == sid for s in plan_data.get("scenes", [])):
        return 0            # a scene file from a different video - not ours to police

    code, out = run("build_gate.py", str(plan_path), "--scene", sid)
    if code == 0:
        return 0
    print(f"[vox-gate] {sid} no longer matches the approved plan ({plan_path.name}):\n"
          f"{out.strip()}\n"
          f"Fix the scene, or update the plan deliberately if the change is intended - "
          f"do not leave the build and the plan disagreeing.", file=sys.stderr)
    return 2


def stop(root, plan):
    plan_path, plan_data = plan
    failures = []

    for script, args, label in (
        ("plan_gate.py", [str(plan_path)], "scene plan"),
        ("build_gate.py", [str(plan_path)], "built scenes vs plan"),
        ("review_gate.py", [str(plan_path)], "self-review pass"),
        # Compares this video against the FROZEN profile of one already judged
        # good, not against an absolute floor. Every gate above accepts a video
        # that sits just over the minimum; this is the one that notices the
        # whole build sliding backwards while still technically passing.
        ("baseline_gate.py", ["check", str(plan_path)], "so với mốc chuẩn"),
    ):
        if not (SCRIPTS / script).exists():
            continue        # gate not installed yet - fail open, don't block
        code, out = run(script, *args)
        if code != 0:
            failures.append(f"### {label} ({script})\n{out.strip()}")

    if not failures:
        return 0

    print("[vox-gate] this video does not meet the agreed quality bar yet:\n\n"
          + "\n\n".join(failures)
          + "\n\nAddress the failures above. If a threshold is genuinely wrong for this "
            "video, say so explicitly and change it deliberately - do not work around "
            "the gate by thinning the plan.", file=sys.stderr)
    return 2


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except (json.JSONDecodeError, OSError):
        payload = {}

    try:
        root = pathlib.Path(payload.get("cwd") or ".").resolve()

        # Runs BEFORE the active-plan lookup on purpose: this is the one check
        # that has to work when no plan exists at all.
        if mode == "post-edit":
            blocked = guard_planless_scene(payload, root)
            if blocked:
                return blocked

        plan = find_active_plan(root)
        if not plan:
            return 0        # scoped: no active video, nothing to enforce
        if mode == "post-edit":
            return post_edit(payload, root, plan)
        if mode == "stop":
            return stop(root, plan)
        return 0
    except Exception as exc:                                  # noqa: BLE001
        # Fail-open on purpose - see the module docstring.
        print(f"[vox-gate] disabled for this call ({type(exc).__name__}: {exc})", file=sys.stderr)
        return 0


if __name__ == "__main__":
    sys.exit(main())
