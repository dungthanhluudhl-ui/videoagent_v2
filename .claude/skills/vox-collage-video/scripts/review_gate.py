"""
review_gate.py - force the "actually look at it" pass that never happened.

Every automated gate in this skill checks something a machine can measure.
None of them can tell whether a scene is any GOOD. The way that gap showed up
in practice: V10 shipped with every existing check green, and the first human
to watch it found four separate defects in the first minute - a headline
invisible against its background, labels running off the canvas, a cutout with
a torn edge, a "map" that was a dot on blank paper. Nothing had looked at a
single rendered frame, including me.

So this gate does not judge quality. It refuses to let the video be called
done until a REVIEW ARTIFACT exists in which every scene has been looked at
and given a verdict against the user's four stated criteria, with the frame
path as evidence. Skipping the look is what it makes impossible.

Workflow:

    1. py -3 render_review_sheet.py input/scene_plan10.json
         -> renders stills, writes input/review10.json with one blank entry
            per scene, and a contact sheet to look at.
    2. Look at the frames. Fill in each scene's verdict + note.
    3. py -3 review_gate.py input/scene_plan10.json
         -> passes only when every scene is reviewed and nothing is left
            failing.

The four criteria are the user's own definition of a professional, finished
video, kept verbatim so they don't drift into something vaguer over time:

    illustrated  narration is shown, not left to the viewer's imagination
    composed     balanced, everything within the frame and legible
    varied       not the same visual formula as its neighbours
    purposeful   every element is there for a reason, not filler
"""

import argparse
import json
import pathlib
import sys

CRITERIA = ["illustrated", "composed", "varied", "purposeful"]
VALID = {"pass", "fail", "n/a"}


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--review", default=None,
                    help="review file; defaults to input/review<N>.json beside the plan")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    plan_path = pathlib.Path(args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    scenes = plan.get("scenes", [])

    review_path = pathlib.Path(args.review) if args.review else pathlib.Path(
        str(plan_path).replace("scene_plan", "review"))

    problems = []
    if not review_path.exists():
        problems.append(
            f"no review file at {review_path} - the video has not been looked at. "
            f"Run render_review_sheet.py, open the contact sheet, then fill in the verdicts.")
    else:
        try:
            review = json.loads(review_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            problems.append(f"{review_path} is not valid JSON: {exc}")
            review = {}

        entries = {e.get("id"): e for e in review.get("scenes", [])}
        for scene in scenes:
            sid = scene.get("id")
            entry = entries.get(sid)
            if not entry:
                problems.append(f"{sid}: no review entry - this scene was never looked at")
                continue
            if not entry.get("frame"):
                problems.append(f"{sid}: no `frame` path recorded - a verdict with no frame "
                                f"behind it is a guess, not a review")
            for crit in CRITERIA:
                verdict = (entry.get(crit) or "").strip().lower()
                if verdict not in VALID:
                    problems.append(f"{sid}/{crit}: verdict is {entry.get(crit)!r}, "
                                    f"expected one of {sorted(VALID)}")
                elif verdict == "fail" and not entry.get("resolved"):
                    problems.append(f"{sid}/{crit}: FAIL - {entry.get('note') or 'no note given'}"
                                    f" (fix it, or set \"resolved\": true with a note saying why "
                                    f"it is acceptable)")

    if args.json:
        print(json.dumps({"passed": not problems, "problems": problems},
                         ensure_ascii=False, indent=2))
    else:
        for p in problems:
            print(f"FAIL {p}")
        if not problems:
            print(f"OK   all {len(scenes)} scene(s) reviewed against "
                  f"{', '.join(CRITERIA)} with frame evidence")
        print(f"\n{'FAILED' if problems else 'PASSED'} ({len(problems)} problem(s))")

    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
