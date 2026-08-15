"""
selftest.py - test the gates themselves.

Every other script here guards the video. Nothing guarded THEM. That mattered
more than it sounds, because `hook_gate.py` is deliberately fail-open: a gate
that quietly stops working looks exactly like a gate that has nothing to
report. Three such holes were found by hand on a real checkout and fixed - a
deleted gate file, a plan with broken JSON, and `"status": "shipped"` typed
early - each of which had been silently disabling the whole system.

Found by hand. That is the problem this file solves: every future edit to a
gate would otherwise be an edit made blind.

Each case builds a deliberately-broken input, runs the real gate against it,
and asserts the gate FAILS. Then the real V10 plan is run through everything
and asserted to PASS. A gate that cannot fail is not a gate, and a gate that
cannot pass is a wall.

    py -3 selftest.py            # all cases
    py -3 selftest.py -v         # show each gate's output

Run it after touching ANY gate script. It is also wired into the Stop hook via
hook_gate.py, so a broken gate cannot survive a turn unnoticed.
"""

import argparse
import copy
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

SCRIPTS = pathlib.Path(__file__).resolve().parent
ROOT = SCRIPTS.parents[3] if len(SCRIPTS.parents) > 3 else pathlib.Path.cwd()
REF_PLAN = ROOT / "input" / "scene_plan10.json"
REF_REVIEW = ROOT / "input" / "review10.json"


class Case:
    """One (mutation, gate, expected outcome) triple."""

    def __init__(self, name, gate, mutate=None, expect_fail=True, args=None, review=None,
                 scene_edit=None, sandbox_hook=None, expect_message=()):
        self.name = name
        self.gate = gate
        self.mutate = mutate
        self.expect_fail = expect_fail
        self.args = args or (lambda plan_path: [str(plan_path)])
        self.review = review
        # (filename, old, new) applied to a copied scene file. Needed because
        # text_gate reads the BUILT .jsx, not the plan - a defect that only
        # exists in drawn markup cannot be expressed as a plan mutation.
        self.scene_edit = scene_edit
        # Called with the sandbox root once it is built. For defects that live
        # in neither the plan nor a scene file - a deleted shared module, say.
        self.sandbox_hook = sandbox_hook
        # Substrings the gate's output MUST contain. A non-zero exit only
        # proves the gate objected to something; it does not prove it objected
        # to the thing the case is named after. Both breathing cases were green
        # for two rounds while failing on an unrelated rule and never reaching
        # the rule under test - a passing test that tested nothing, which is
        # worse than a failing one.
        self.expect_message = tuple(expect_message)


def run_gate(gate, argv, cwd):
    proc = subprocess.run([sys.executable, str(SCRIPTS / gate), *argv],
                          capture_output=True, text=True, encoding="utf-8",
                          errors="replace", cwd=str(cwd))
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


# --------------------------------------------------------------------------
# Mutations - each one is a defect this project has ACTUALLY shipped or nearly
# shipped, not an invented edge case.
# --------------------------------------------------------------------------

def drop_all_assets(plan):
    """The original defect: scenes that illustrate nothing."""
    for s in plan["scenes"][:12]:
        s["assets"] = []
    return plan


def one_language_everywhere(plan):
    """"Templated, repetitive" - the complaint that started this skill."""
    for s in plan["scenes"]:
        s["visualLanguage"] = "cutout"
    return plan


def starve_the_hard_scenes(plan):
    """The inverted allocation: hardest scenes get the least time.

    Squeezes every complex scene to 1.5s while leaving its visualEvents in
    place, which is exactly how the first V10 rebuild failed."""
    t = 0.0
    for s in plan["scenes"]:
        span = 1.5 if s.get("comprehensionLoad") == "complex" else (s["endSec"] - s["startSec"])
        s["startSec"], s["endSec"] = round(t, 2), round(t + span, 2)
        t += span
    return plan


def open_a_dead_gap(plan):
    """Nothing new on screen for many seconds."""
    for s in plan["scenes"][3:8]:
        s["visualEvents"] = [{"frame": 0, "what": "everything at once"}]
        s["endSec"] = s["startSec"] + 9.0
    t = plan["scenes"][0]["startSec"]
    for s in plan["scenes"]:
        span = s["endSec"] - s["startSec"]
        s["startSec"], s["endSec"] = round(t, 2), round(t + span, 2)
        t += span
    return plan


def unbacked_event(plan):
    """A declared beat with no asset behind it - makes the pacing gate lie.

    The frame is COMPUTED, not typed. The first version of this case hard-coded
    frame 60 on S1 and the case "failed": S1's punch reveals at 62, so a beat
    at 60 is inside the 8-frame backing tolerance and the gate was right to
    stay quiet. The test was wrong, not the gate - which is the exact confusion
    a selftest exists to surface, so the story is kept here rather than tidied
    away."""
    scene = plan["scenes"][0]
    committed = {0, scene["durationInFrames"]}
    for a in scene.get("assets", []):
        d, v = a.get("delay") or 0, a.get("visibleFor") or 0
        committed |= {d, d + v}
    punch = scene.get("punch") or {}
    if punch.get("from") is not None:
        committed.add(punch["from"])
    for f in range(1, scene["durationInFrames"]):
        if all(abs(f - c) > 20 for c in committed):
            scene["visualEvents"].append({"frame": f, "what": "nothing really"})
            return plan
    raise AssertionError("no unbacked frame available in S1 - pick another scene")


def placeholder_fields(plan):
    """A scaffold mistaken for a plan."""
    for s in plan["scenes"][:5]:
        s["visualTransformation"] = ""
        s["viewerQuestion"] = ""
    return plan


def regress_below_baseline(plan):
    """Passes plan_gate's floors, sits well under the reference video.

    This is the case that had no gate at all before baseline_gate existed:
    every scene keeps a language and an asset, nothing repeats back to back,
    and the video is still visibly thinner than the one it follows."""
    plan["video"] = "VTEST"
    for i, s in enumerate(plan["scenes"]):
        if i % 3:
            continue
        keep = dict(s["assets"][0]) if s["assets"] else {}
        keep.update({"role": "hero", "src": keep.get("src") or "x.png"})
        s["assets"] = [keep] if keep else []
    return plan


def flash_element(plan):
    """An element that appears and vanishes before it can be read.

    The real one: V11/S13 planned a crowd photo with visibleFor=15. Hero and
    Support fade IN over ~10 frames and start fading OUT at
    (visibleFor - exitLen), exitLen=10 - so those 15 frames gave FIVE at full
    opacity, and the photo was arriving and leaving at the same time. Every
    gate passed it, because every gate asked whether something appeared and
    none asked whether it stayed."""
    for a in plan["scenes"][0].get("assets", []):
        a["visibleFor"] = 15
    return plan


def crammed_scene(plan):
    """More beats in one scene than a viewer can follow.

    V10 - the cut the user approved - averaged 2.04 beats/scene. V11, the cut
    that read as relentless, averaged 2.62 at almost identical
    seconds-per-beat. The variable that regressed is how many things happen in
    one scene, not how fast each one lands."""
    s = plan["scenes"][0]
    s["comprehensionLoad"] = "moderate"
    s["visualEvents"] = [{"frame": f, "what": "beat"} for f in (0, 20, 40, 60)]
    return plan


def reflow(plan, fps=30):
    """Re-lay every scene end-to-end after a duration change, so the plan stays
    internally consistent and the timeline gate has nothing to say about it."""
    t = plan["scenes"][0]["startSec"]
    for s in plan["scenes"]:
        span = s["durationInFrames"] / fps
        s["startSec"], s["endSec"] = round(t, 2), round(t + span, 2)
        t += span
    return plan


def make_three_beat(scene):
    """Give one scene three beats that every OTHER rule accepts.

    Written the naive way first - three events at frames 0/40/80 - and both
    breathing cases went green while never reaching the breathing rule at all:
    they died on `unbacked event`, because a beat with no asset behind it is
    already illegal. The cases passed, the gate was untested, and that is the
    precise failure mode this file exists to prevent. So the beats are backed
    by real assets, spaced inside the dead-air limit, and the last one is left
    clear of the cut by more than min_clear_frames.
    """
    dur = scene["durationInFrames"]
    # 100 frames is the shortest scene that can hold three beats legally: the
    # last one lands 50 frames before the cut, clear of the 45-frame floor.
    if dur < 100 or not scene.get("assets"):
        return False
    frames = [0, (dur - 50) // 2, dur - 50]
    template = copy.deepcopy(scene["assets"][0])
    assets = []
    for i, f in enumerate(frames):
        a = copy.deepcopy(template)
        a["delay"] = f
        a["visibleFor"] = max(90, dur - f)
        a["name"] = f"{a.get('name', 'a')}_{i}"
        assets.append(a)
    scene["assets"] = assets
    scene["visualEvents"] = [{"frame": f, "what": "beat"} for f in frames]
    return True


def dense_run_no_breath(plan):
    """Enough demanding scenes back to back that there is nowhere to rest.

    Marked `complex` on purpose, which raises the per-scene beat cap to 3 - so
    this cannot pass by tripping the cap instead. What it tests is the RUN:
    every scene is individually legal and the sequence still never lets up,
    which is exactly what V11 did across S5-S9 while V10 never put two such
    scenes side by side."""
    # The scenes are STRETCHED to 5.5s first. Not padding to make the test
    # work: under the existing 1.5s-per-beat floor a three-beat scene cannot be
    # shorter than 4.5s, and V10's scenes run about 4s - so V10 physically
    # cannot hold a dense run, while V11 at 5.15s per scene could and did. The
    # mutation has to reproduce that, which means reproducing the length too.
    scenes = plan["scenes"]
    for s in scenes[:4]:
        s["durationInFrames"] = 165
        s["comprehensionLoad"] = "complex"
        s["density"] = "high"
    reflow(plan)
    for s in scenes[:4]:
        if not make_three_beat(s):
            raise AssertionError("could not densify a stretched scene")
    return plan


def calm_in_name_only(plan):
    """`density: "low"` typed onto a scene that behaves densely.

    Without this, the breathing rule is satisfiable by editing a label instead
    of editing the scene - the same way `"status": "shipped"` was once the
    cheapest way out of a failing gate. A measured rule with a self-declared
    escape hatch is a prose rule wearing a number."""
    s = plan["scenes"][0]
    s["durationInFrames"] = 165
    s["comprehensionLoad"] = "complex"
    s["density"] = "low"
    reflow(plan)
    if not make_three_beat(s):
        raise AssertionError("could not densify the stretched scene")
    return plan


def delete_icon_vocabulary(tmp):
    """The vocabulary module removed from the sandbox.

    Deleting the file is the most direct way to make icon_gate's rules
    unenforceable, so it has to be a failure rather than a quiet skip - the
    same lesson REQUIRED_GATES learned when a deleted gate script turned the
    Stop hook green."""
    (tmp / "src" / "scenes" / "iconVocabulary.jsx").unlink()


def mark_every_scene_built(plan):
    """A built video with no review file must still be blocked.

    The phase check added to review_gate lets a PLAN-ONLY video through, so
    this case exists to prove the exemption cannot be widened: flip the scenes
    to "built" and the review requirement has to come straight back."""
    for s in plan["scenes"]:
        s["status"] = "built"
    return plan


def unexplained_pass_on_empty_frame(review):
    """The mis-review that shipped twice in one session."""
    for e in review["scenes"]:
        e["note"] = ""
        e["composed"] = "pass"
        e.pop("resolved", None)
    return review


def wordy_label(_plan):
    """A drawn sentence instead of a label - handled by mutating the SCENE file,
    not the plan, because that is where drawn text lives."""
    return _plan


CASES = [
    Case("plan_gate: cảnh không có minh hoạ nào", "plan_gate.py", drop_all_assets),
    Case("plan_gate: một ngôn ngữ dùng cho cả video", "plan_gate.py", one_language_everywhere),
    Case("plan_gate: cảnh khó bị bóp thời lượng", "plan_gate.py", starve_the_hard_scenes),
    Case("plan_gate: khoảng chết hình > 4s", "plan_gate.py", open_a_dead_gap),
    Case("plan_gate: nhịp khai khống, không có gì đằng sau", "plan_gate.py", unbacked_event),
    Case("plan_gate: trường biên tập còn rỗng", "plan_gate.py", placeholder_fields),
    Case("plan_gate: phần tử nháy lên rồi tắt, chưa kịp đọc", "plan_gate.py", flash_element),
    Case("text_gate: nhãn chữ dài thành câu, đè lên nhau", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx",
                     "KHỐI NGƯỜI BỊ KHOÁ CHẶT",
                     "khối người bị khoá chặt không ai rút ra nổi dù kéo mạnh đến đâu"),
         expect_fail=True),
    Case("plan_gate: nhồi quá nhiều nhịp vào một cảnh", "plan_gate.py", crammed_scene),
    Case("plan_gate: 4 cảnh dày liên tiếp, không có cảnh nghỉ nào",
         "plan_gate.py", dense_run_no_breath,
         expect_message=["scenes in a row carrying more than 2 beats"]),
    Case("plan_gate: khai density 'low' cho cảnh mang 3 nhịp",
         "plan_gate.py", calm_in_name_only,
         expect_message=["declared density \"low\" but carries 3 beats"]),
    # The vocabulary rules. Rule 1 is the one that reaches a session which has
    # never heard of iconVocabulary.jsx, so it is the one that must not rot.
    Case("icon_gate: viết chữ cho khái niệm đã có ký hiệu vẽ sẵn", "icon_gate.py", None,
         scene_edit=("V10Scene5.jsx", "KHỐI NGƯỜI BỊ KHOÁ CHẶT", "MẬT ĐỘ TĂNG"),
         args=lambda p: [str(p), "--skip-floor"],
         expect_message=["<IconDensity>"]),
    Case("icon_gate: video dựng xong mà không dùng ký hiệu nào", "icon_gate.py", None,
         expect_message=["symbol floor"]),
    Case("icon_gate: xoá luôn file vốn từ ký hiệu", "icon_gate.py", None,
         sandbox_hook=delete_icon_vocabulary,
         args=lambda p: [str(p), "--skip-floor"],
         expect_message=["iconVocabulary.jsx is missing"]),
    Case("baseline_gate: tụt so với video mốc", "baseline_gate.py", regress_below_baseline,
         args=lambda p: ["check", str(p)]),
    Case("review_gate: chấm 'pass' cho khung đo được là trống, không nêu lý do",
         "review_gate.py", None, review=unexplained_pass_on_empty_frame),
    Case("review_gate: video đã dựng nhưng thiếu file review", "review_gate.py",
         mark_every_scene_built, review=lambda r: {"video": "x", "scenes": []}),
    # The reference itself must survive all four. A gate that cannot pass is a
    # wall, and a wall gets removed.
    # V10 shipped BEFORE the element-lifetime rule and breaks it 12 times.
    # Skipping that one gate here is not softening it - it is refusing to let a
    # rule written after V10 turn the reference into a wall. The debt is
    # recorded in references/lessons.md, not hidden.
    Case("plan_gate: V10 thật phải PASS (trừ luật mới sau khi V10 ship)", "plan_gate.py",
         None, expect_fail=False, args=lambda p: [str(p), "--skip-lifetime"]),
    Case("build_gate: V10 thật phải PASS", "build_gate.py", None, expect_fail=False),
    # V10 predates the vocabulary and uses none of it, so the FLOOR is skipped
    # here for the same reason --skip-lifetime is above. Rules 1, 3 and 4 still
    # apply: V10's 31 drawn words must not name anything the vocabulary draws.
    Case("icon_gate: V10 thật phải PASS (trừ sàn ký hiệu ra đời sau V10)",
         "icon_gate.py", None, expect_fail=False,
         args=lambda p: [str(p), "--skip-floor"]),
    Case("review_gate: V10 thật phải PASS", "review_gate.py", None, expect_fail=False),
    Case("baseline_gate: V10 thật phải PASS", "baseline_gate.py", None, expect_fail=False,
         args=lambda p: ["check", str(p)]),
]


def build_sandbox(tmp, plan_mut, review_mut, scene_edit=None, sandbox_hook=None):
    """A throwaway copy of input/ so no case can touch the real files.

    src/ and the baseline are symlink-free copies too - build_gate and
    review_gate read scene files and frames, so the sandbox has to look like
    the project from their point of view."""
    (tmp / "input").mkdir(parents=True, exist_ok=True)
    plan = json.loads(REF_PLAN.read_text(encoding="utf-8"))
    if plan_mut:
        plan = plan_mut(copy.deepcopy(plan))
    plan_path = tmp / "input" / "scene_plan10.json"
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    if REF_REVIEW.exists():
        review = json.loads(REF_REVIEW.read_text(encoding="utf-8"))
        if review_mut:
            review = review_mut(copy.deepcopy(review))
        (tmp / "input" / "review10.json").write_text(
            json.dumps(review, ensure_ascii=False, indent=2), encoding="utf-8")

    for name in ("words10_aligned.json",):
        src = ROOT / "input" / name
        if src.exists():
            shutil.copy2(src, tmp / "input" / name)

    # frames + scene sources, referenced by path from the review file
    frames = ROOT / "input" / "review_frames"
    if frames.exists():
        shutil.copytree(frames, tmp / "input" / "review_frames", dirs_exist_ok=True)
    scenes = ROOT / "src" / "scenes"
    if scenes.exists():
        (tmp / "src").mkdir(exist_ok=True)
        shutil.copytree(scenes, tmp / "src" / "scenes", dirs_exist_ok=True)
    if scene_edit:
        fn, old, new = scene_edit
        f = tmp / "src" / "scenes" / fn
        s = f.read_text(encoding="utf-8")
        if old not in s:
            raise AssertionError(f"scene_edit: {old!r} not in {fn}")
        f.write_text(s.replace(old, new, 1), encoding="utf-8")
    if sandbox_hook:
        sandbox_hook(tmp)
    return plan_path


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    if not REF_PLAN.exists():
        print(f"selftest: no reference plan at {REF_PLAN} - nothing to test against.")
        return 0

    results = []
    for case in CASES:
        with tempfile.TemporaryDirectory(prefix="voxgate-") as td:
            tmp = pathlib.Path(td)
            try:
                plan_path = build_sandbox(tmp, case.mutate, case.review, case.scene_edit,
                                          case.sandbox_hook)
                code, out = run_gate(case.gate, case.args(plan_path), tmp)
            except Exception as exc:                          # noqa: BLE001
                results.append((case.name, False, f"selftest crashed: {exc}"))
                continue
        failed = code != 0
        ok = (failed == case.expect_fail)
        want = "phải FAIL" if case.expect_fail else "phải PASS"
        detail = "" if ok else f"{want} nhưng exit={code}\n{out.strip()[:400]}"
        if ok and case.expect_message:
            missing = [m for m in case.expect_message if m not in out]
            if missing:
                ok = False
                detail = ("gate có fail, nhưng KHÔNG vì lý do đang được kiểm: thiếu "
                          + "; ".join(repr(m) for m in missing))
        results.append((case.name, ok, detail))
        if args.verbose:
            print(f"\n===== {case.name}\n{out.strip()[:900]}")

    bad = [r for r in results if not r[1]]
    if args.json:
        print(json.dumps({"passed": not bad,
                          "cases": [{"name": n, "ok": o, "detail": d} for n, o, d in results]},
                         ensure_ascii=False, indent=2))
    else:
        for name, ok, detail in results:
            print(f"{'OK  ' if ok else 'FAIL'} {name}")
            if detail:
                print("     " + detail.replace("\n", "\n     "))
        print(f"\n{'FAILED' if bad else 'PASSED'} ({len(results) - len(bad)}/{len(results)} "
              f"trường hợp đúng như mong đợi)")
        if bad:
            print("\nMột gate không bắt được lỗi nó sinh ra để bắt là gate đã hỏng. "
                  "Sửa gate, đừng sửa test cho khớp.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
