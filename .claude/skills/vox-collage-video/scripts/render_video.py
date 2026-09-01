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
VERSION = "pixel-source-v3"


def local_dependency_files(seeds):
    """Follow local JS/TS imports from the isolated generated entry graph."""
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


def selected_registration(root, composition):
    """Normalize one registration from generated PrevisRoot, never production Root.jsx."""
    path = state.video_paths(root, "V")["previs_root"]
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return {"composition": composition, "missing": True}
    tag = re.search(r"<Composition\b[^>]*\bid=[\"']" + re.escape(composition)
                    + r"[\"'][^>]*/>", text, re.DOTALL)
    if not tag:
        return {"composition": composition, "missing": True}
    normalized = re.sub(r"\s+", " ", tag.group(0)).strip()
    imports, definitions = [], []
    identifiers = set(re.findall(r"\b(?:component|durationInFrames|fps|width|height)=\{([^}]+)\}",
                                 normalized))
    setting_names = {value.split(".", 1)[0].strip() for value in
                     re.findall(r"\b(?:durationInFrames|fps|width|height)=\{([^}]+)\}", normalized)}
    for line in text.splitlines():
        if not line.lstrip().startswith("import "):
            continue
        bases = {name.split(".", 1)[0].strip() for name in identifiers}
        if not bases.intersection(set(re.findall(r"\b[A-Za-z_$][\w$]*\b", line))):
            continue
        imports.append(re.sub(r"\s+", " ", line).strip())
        source_match = re.search(r'from\s+["\'](\.[^"\']+)["\']', line)
        if not source_match:
            continue
        base = (path.parent / source_match.group(1)).resolve()
        candidates = [pathlib.Path(str(base) + ext) for ext in ("", ".js", ".jsx", ".ts", ".tsx")]
        module = next((candidate for candidate in candidates if candidate.is_file()), None)
        if not module:
            continue
        module_text = module.read_text(encoding="utf-8")
        for name in sorted(setting_names):
            match = re.search(r"export\s+const\s+" + re.escape(name)
                              + r"\s*=\s*(.*?);", module_text, re.DOTALL)
            if match:
                definitions.append({"name": name,
                                    "value": re.sub(r"\s+", " ", match.group(1)).strip()})
    return {"composition": composition, "registration": normalized,
            "imports": sorted(imports), "settingDefinitions": definitions}


def render_plan_slice(plan):
    """Only plan values that generated/current rendering code can consume."""
    return {"video": plan.get("video"), "fps": plan.get("fps", 30),
            "audioFile": plan.get("audioFile"),
            "scenes": [{"id": scene.get("id"),
                        "assets": [{"src": asset.get("src")} for asset in scene.get("assets") or []
                                   if asset.get("src")]}
                       for scene in plan.get("scenes") or []]}


def referenced_public_files(root, source_files):
    """Literal staticFile()/asset references in the selected local source closure."""
    found = set()
    pattern = re.compile(r"(?:staticFile|src)\s*\(?\s*[\"']([^\"']+)[\"']")
    for path in source_files:
        try:
            text = pathlib.Path(path).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for raw in pattern.findall(text):
            candidate = pathlib.Path(root) / "public" / raw.lstrip("/\\")
            if candidate.is_file():
                found.add(candidate.resolve())
    return sorted(found, key=str)


def resolved_render_versions(root, source_files):
    """Exact locked versions for packages used by this render source closure."""
    package = state.read_json(pathlib.Path(root) / "package.json", {})
    specifications = {**(package.get("dependencies") or {}),
                      **(package.get("devDependencies") or {})}
    lock = state.read_json(pathlib.Path(root) / "package-lock.json", {})
    lock_packages = lock.get("packages") or {}
    legacy_dependencies = lock.get("dependencies") or {}
    external = set()
    pattern = re.compile(r'(?:from\s+|import\s*)["\']([^\.][^"\']*)["\']')
    for path in source_files:
        try:
            text = pathlib.Path(path).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for name in pattern.findall(text):
            parts = name.split("/")
            external.add("/".join(parts[:2]) if name.startswith("@") else parts[0])
    external.update(("remotion", "@remotion/cli"))
    resolved = {}
    for name in sorted(external):
        entry = lock_packages.get(f"node_modules/{name}") or legacy_dependencies.get(name) or {}
        version = entry.get("version") if isinstance(entry, dict) else None
        if version:
            resolved[name] = {"version": str(version), "resolution": "package-lock"}
        else:
            resolved[name] = {"specification": specifications.get(name),
                              "resolution": "package-json-fallback", "unresolved": True}
    return resolved


def source_inputs(root, plan_path, plan):
    video = plan.get("video", "V")
    video_paths = state.video_paths(root, video)
    # The entry imports generated PrevisRoot, which imports exactly the selected
    # master/scenes. Starting here proves the graph Remotion actually receives
    # and makes production/legacy Root.jsx unreachable by construction.
    paths = local_dependency_files([video_paths["entry"]])
    paths += referenced_public_files(root, paths)
    paths += [root / "remotion.config.ts"]
    for scene in plan.get("scenes") or []:
        for asset in scene.get("assets") or []:
            if asset.get("src"):
                paths.append(root / "public" / asset["src"])
    audio = plan.get("audioFile")
    if audio:
        paths.append(root / "public" / audio)
    return [{"renderPlan": render_plan_slice(plan)},
            {"rootRegistration": selected_registration(root, f"{video}Master")},
            {"resolvedRenderVersions": resolved_render_versions(root, paths)},
            *[state.file_input(p) for p in paths]]


def render_contract(plan_path, mode="draft", output=None, scale=None, codec="h264"):
    plan_path = state.project_path(state.project_root(__file__), plan_path)
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    root = state.project_root(plan_path)
    video = plan.get("video", "V")
    scale = float(scale if scale is not None else (0.5 if mode == "draft" else 1.0))
    if mode == "final" and scale != 1.0:
        raise ValueError("final render must remain full-resolution (scale=1)")
    paths = state.video_paths(root, video)
    output = state.project_path(root, output) if output else paths[mode]
    params = {"mode": mode, "composition": f"{video}Master", "scale": scale,
              "fps": plan.get("fps", 30), "codec": codec}
    inputs = source_inputs(root, plan_path, plan)
    tool = state.tool_identity(HERE / "render_video.py", versions={"wrapper": VERSION})
    receipt_path = paths["receipts"] / f"render-{mode}.json"
    current, receipt = state.receipt_current(receipt_path, f"render-{mode}", inputs, tool,
                                             params)
    cmd = ["npx", "remotion", "render", "src/index.ts", f"{video}Master", str(output),
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
    if args.command_only:
        print(json.dumps(cmd, ensure_ascii=False))
        return 0
    if current:
        print(state.compact_result("CLOSED", details=output, receipt=receipt))
        state.append_telemetry(root, video, {"stage": f"render-{args.mode}", "owner": "script",
                               "cache": "hit", "subprocessCount": 0, "renderMode": args.mode,
                               "renderParameters": params, "receiptId": receipt.get("receiptId")})
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
            detail = state.video_paths(root, video)["logs"] / f"render-{args.mode}-failure.txt"
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