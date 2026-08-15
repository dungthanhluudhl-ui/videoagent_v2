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

1. SCOPED. It does nothing at all unless an ACTIVE scene plan exists
   (`input/scene_plan*.json` with top-level "status": "active"). Unrelated
   work in this repo - and any other project - is untouched. Set the plan's
   status to "shipped" when a video is done and the gates go quiet.
2. FAIL-OPEN. Any unexpected error (bad JSON, missing script, crash) prints
   a warning and exits 0. A gate that bricks the repo when it has a bug is
   worse than no gate; the failure mode has to be "stops enforcing", never
   "stops working".
"""

import json
import pathlib
import subprocess
import sys

SCRIPTS = pathlib.Path(__file__).resolve().parent
SCENE_FILE_HINT = "src/scenes/"


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
