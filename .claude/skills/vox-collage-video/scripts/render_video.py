"""Receipt-aware Remotion render wrapper for master motion draft and final MP4.

Draft keeps the actual master timing, transitions, captions, motion and FPS; it
only uses Remotion's 0.5 scale. Final remains full-resolution. Nothing renders
unless this script is explicitly invoked without --check/--command-only.
"""

import argparse
import json
import pathlib
import re
import subprocess
import sys

import stage_state as state

HERE = pathlib.Path(__file__).resolve().parent
VERSION = "master-render-v1"


def local_dependency_files(seeds):
    """Follow local JS/TS imports without pulling unrelated Root registrations."""
    found, todo = set(), [pathlib.Path(p) for p in seeds]
    pattern = re.compile(r'(?:from\s+|import\s*)["\'](\.[^"\']+)["\']')
    extensions = ("", ".js", ".jsx", ".ts", ".tsx", ".json")
    while todo:
        path = todo.pop()
        if path in found or not path.is_file():
            continue
        found.add(path)
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for raw in pattern.findall(text):
            base = (path.parent / raw).resolve()
            candidates = [pathlib.Path(str(base) + ext) for ext in extensions]
            candidates += [base / f"index{ext}" for ext in extensions[1:]]
            child = next((p for p in candidates if p.is_file()), None)
            if child and child not in found:
                todo.append(child)
    return sorted(found, key=str)


def source_inputs(root, plan_path, plan):
    video = plan.get("video", "V")
    master = root / "src" / f"{video}Master.jsx"
    scene_seeds = [root / "src" / "scenes" / f"{video}Scene{s.get('id','S')[1:]}.jsx"
                   for s in plan.get("scenes") or []]
    paths = local_dependency_files([master, *scene_seeds])
    paths += [root / "src" / "Root.jsx", root / "src" / "index.ts",
              root / "remotion.config.ts", root / "package.json", root / "package-lock.json"]
    for scene in plan.get("scenes") or []:
        for asset in scene.get("assets") or []:
            if asset.get("src"):
                paths.append(root / "public" / asset["src"])
    audio = plan.get("audioFile")
    if audio:
        paths.append(root / "public" / audio)
    return [{"renderPlan": state.plan_contract(plan, plan_path)["plan"]},
            *[state.file_input(p) for p in paths]]


def render_contract(plan_path, mode="draft", output=None, scale=None, codec="h264"):
    plan_path = pathlib.Path(plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    scale = float(scale if scale is not None else (0.5 if mode == "draft" else 1.0))
    if mode == "final" and scale != 1.0:
        raise ValueError("final render must remain full-resolution (scale=1)")
    output = pathlib.Path(output) if output else root / "out" / f"{video}_{mode}.mp4"
    params = {"mode": mode, "composition": f"{video}Master", "scale": scale,
              "fps": plan.get("fps", 30), "codec": codec}
    inputs = source_inputs(root, plan_path, plan)
    tool = state.tool_identity(HERE / "render_video.py", versions={"wrapper": VERSION,
                               "remotion": state.read_json(root / "package.json", {}).get("dependencies", {}).get("remotion")})
    receipt_path = state.runtime_dir(root, video) / "receipts" / f"render-{mode}.json"
    current, receipt = state.receipt_current(receipt_path, f"render-{mode}", inputs, tool,
                                             params)
    cmd = ["npx", "remotion", "render", f"{video}Master", str(output),
           f"--codec={codec}", f"--scale={scale}", "--overwrite"]
    return root, video, output, receipt_path, current, receipt, inputs, tool, params, cmd


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("plan")
    ap.add_argument("--mode", choices=("draft", "final"), default="draft")
    ap.add_argument("--output")
    ap.add_argument("--scale", type=float)
    ap.add_argument("--codec", default="h264")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--command-only", action="store_true")
    args = ap.parse_args()
    try:
        data = render_contract(args.plan, args.mode, args.output, args.scale, args.codec)
    except ValueError as exc:
        print(f"HARD: {exc}", file=sys.stderr)
        return 2
    root, video, output, rpath, current, receipt, inputs, tool, params, cmd = data
    if current:
        print(state.compact_result("CLOSED", details=output, receipt=receipt))
        state.append_telemetry(root, video, {"stage": f"render-{args.mode}", "owner": "script",
                               "cache": "hit", "subprocessCount": 0, "renderMode": args.mode,
                               "renderParameters": params, "receiptId": receipt.get("receiptId")})
        return 0
    if args.command_only:
        print(json.dumps(cmd, ensure_ascii=False))
        return 0
    if args.check:
        print(state.compact_result("HARD", hard=1, details=f"stale/missing: {output}"))
        return 1
    output.parent.mkdir(parents=True, exist_ok=True)
    with state.timed_stage(root, video, f"render-{args.mode}", cache="miss",
                           subprocessCount=1, renderMode=args.mode, renderParameters=params) as telem:
        proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", shell=(sys.platform == "win32"))
        if proc.returncode:
            detail = state.runtime_dir(root, video) / "logs" / f"render-{args.mode}-failure.txt"
            detail.parent.mkdir(parents=True, exist_ok=True)
            detail.write_text((proc.stdout or "") + (proc.stderr or ""), encoding="utf-8")
            print(state.compact_result("HARD", hard=1, details=detail), file=sys.stderr)
            return proc.returncode
        receipt = state.make_receipt(rpath, f"render-{args.mode}", inputs, tool, params,
                                     outputs=[output])
        telem.update({"output": str(output), "outputSize": output.stat().st_size,
                      "receiptId": receipt["receiptId"]})
    print(state.compact_result("CLOSED", changed=[output], details=output, receipt=receipt))
    return 0


if __name__ == "__main__":
    sys.exit(main())