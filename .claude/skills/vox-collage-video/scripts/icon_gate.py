"""
icon_gate.py - technical integrity for the OPTIONAL drawn-symbol vocabulary.

Videoagent 2 does not require icons. A valid finished video may use zero, and a
label is never required to become an icon merely because the vocabulary has a
matching concept. This gate only catches mechanical failures that would break
an icon which the editor actually chose to use:

  1. Every `VOX_ICONS` entry has a matching exported component, and every
     exported `Icon*` is registered.
  2. Every rendered icon is registered and imported from iconVocabulary.

The vocabulary remains available as a tool; it is not a style quota.

    py -3 icon_gate.py input/scene_plan11.json
    py -3 icon_gate.py input/scene_plan11.json --scene S13
"""

import argparse
import json
import pathlib
import re
import sys

VOCAB_PATH = pathlib.Path("src/scenes/iconVocabulary.jsx")
VOCAB_IMPORT = "./iconVocabulary"

def load_registry(root):
    """(registry, exported_names, problems) parsed from iconVocabulary.jsx.

    Parsed from the source the renderer actually imports rather than from a
    generated manifest: a manifest is one more thing that can be stale, and a
    stale manifest fails open - the gate would simply stop knowing about half
    the vocabulary and report nothing.
    """
    path = root / VOCAB_PATH
    if not path.exists():
        return {}, set(), [
            f"{VOCAB_PATH} is missing. Icons are optional, but their available component "
            f"library must remain intact; restore the tracked file."]
    src = path.read_text(encoding="utf-8")

    m = re.search(r"export const VOX_ICONS = \{(.*?)\n\};", src, re.S)
    if not m:
        return {}, set(), [
            f"{VOCAB_PATH}: `export const VOX_ICONS = {{ ... }};` not found, so no icon "
            f"is known to this gate. Restore the registry block."]
    body = m.group(1)

    registry = {}
    entry_re = re.compile(
        r"(\w+):\s*\{\s*means:\s*\"([^\"]*)\",\s*triggers:\s*\[(.*?)\],\s*\}", re.S)
    for em in entry_re.finditer(body):
        triggers = [t.strip().lower() for t in re.findall(r"\"([^\"]*)\"", em.group(3))]
        registry[em.group(1)] = {"means": em.group(2), "triggers": [t for t in triggers if t]}

    exported = set(re.findall(r"export const (Icon\w+)\b", src))

    problems = []
    declared = set(registry)
    for name in sorted(declared - exported):
        problems.append(
            f"{VOCAB_PATH}: VOX_ICONS lists {name} but nothing exports it. The registry is "
            f"what this gate recommends to future sessions - an entry with no component "
            f"sends them to something that does not exist.")
    for name in sorted(exported - declared):
        problems.append(
            f"{VOCAB_PATH}: {name} is exported but missing from VOX_ICONS. Add the matching "
            f"registry entry so an actual reference can be validated.")
    if not registry and not problems:
        problems.append(
            f"{VOCAB_PATH}: VOX_ICONS parsed to zero entries. Keep the documented shape "
            f"(`means` then `triggers`, plain double-quoted strings).")
    return registry, exported, problems


def icons_in(src):
    """Icon component names actually rendered in one scene file."""
    return set(re.findall(r"<(Icon\w+)[\s/>]", src))


def imported_icons(src):
    """Icon names imported from the vocabulary module."""
    names = set()
    for m in re.finditer(r"import\s*\{([^}]*)\}\s*from\s*[\"'][^\"']*iconVocabulary[\"']",
                         src, re.S):
        names |= {n.strip() for n in m.group(1).split(",") if n.strip()}
    return names


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--scenes-dir", default="src/scenes")
    ap.add_argument("--scene", default=None)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    root = pathlib.Path(".").resolve()
    plan_path = pathlib.Path(args.plan)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    video = plan.get("video", "V")
    scenes = plan.get("scenes", [])
    wanted = [s for s in scenes if not args.scene or s.get("id") == args.scene]

    registry, _exported, problems = load_registry(root)

    built, with_icon, used_icons = 0, 0, set()
    for scene in wanted:
        sid = scene.get("id", "")
        path = pathlib.Path(args.scenes_dir) / f"{video}Scene{sid.lstrip('S')}.jsx"
        if not path.exists():
            continue
        src = path.read_text(encoding="utf-8")
        built += 1
        here = icons_in(src)
        if here:
            with_icon += 1
            used_icons |= here

        for name in sorted(here - set(registry)):
            problems.append(
                f"{sid}: <{name}> is rendered but is not registered in {VOCAB_PATH}. "
                f"Use an existing registered icon or add a matching exported component and "
                f"VOX_ICONS entry before rendering it.")

        for name in sorted(here - imported_icons(src)):
            problems.append(
                f"{sid}: <{name}> is rendered but never imported from \"{VOCAB_IMPORT}\". "
                f"This scene will crash when it is reached.")

    if args.json:
        print(json.dumps({"passed": not problems, "problems": problems},
                         ensure_ascii=False, indent=2))
    else:
        for p in problems:
            print(f"FAIL {p}")
        if not problems:
            print(f"OK   {built} built scene(s); {with_icon} carry a drawn symbol "
                  f"({len(used_icons)} distinct); zero icons is valid and every icon actually "
                  f"used is registered and imported")
        print(f"\n{'FAILED' if problems else 'PASSED'} ({len(problems)} problem(s))")

    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
