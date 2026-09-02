"""Bounded Pexels PHOTO candidate discovery and opt-in download.

Pexels photos are actual visual plates by default: crop, reframe, layer, pan,
push, or zoom them in Remotion. Cutout processing is optional and is used only
when a specific approved scene treatment genuinely requires a cutout.

The API key is read only from ``PEXELS_API_KEY`` in the environment or an
untracked ``.env`` searched upward from this script. It is never printed.

Examples:
    python fetch_pexels.py list "scales of justice" --orientation portrait --json
    python fetch_pexels.py get "scales of justice" candidate.jpg --index 0 --json
"""

import argparse
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys

import requests

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"
MAX_CANDIDATES = 8
MISSING_KEY_STATUS = "PEXELS_RUNTIME = NOT READY — API KEY MISSING"


def tracked_by_git(path):
    path = pathlib.Path(path).resolve()
    for parent in [path.parent, *path.parents]:
        if not (parent / ".git").exists():
            continue
        try:
            relative = path.relative_to(parent)
            check = subprocess.run(
                ["git", "-C", str(parent), "ls-files", "--error-unmatch", "--", str(relative)],
                capture_output=True, text=True, timeout=5)
            return check.returncode == 0
        except (OSError, ValueError, subprocess.SubprocessError):
            return False
    return False


def load_api_key(environ=None, start=None):
    environment = os.environ if environ is None else environ
    key = str(environment.get("PEXELS_API_KEY", "")).strip()
    if key:
        return key
    here = pathlib.Path(start or __file__).resolve()
    directory = here if here.is_dir() else here.parent
    parents = [directory] if start is not None else [directory, *directory.parents]
    for parent in parents:
        env_path = parent / ".env"
        if env_path.is_file() and not tracked_by_git(env_path):
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("PEXELS_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"\'')
                    if key:
                        return key
    raise RuntimeError(MISSING_KEY_STATUS)


def bounded_count(value):
    return max(1, min(MAX_CANDIDATES, int(value)))


def retrieved_now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def photo_orientation(width, height):
    if width == height:
        return "square"
    return "landscape" if width > height else "portrait"


def candidate(photo, retrieved_at=None, local_path=None):
    """Normalize one Pexels PHOTO response without inventing license metadata."""
    width, height = int(photo["width"]), int(photo["height"])
    src = photo.get("src") or {}
    result = {
        "provider": "pexels",
        "mediaType": "photo",
        "pexelsId": int(photo["id"]),
        "photographer": str(photo.get("photographer") or ""),
        "pageUrl": str(photo["url"]),
        "previewUrl": str(src.get("medium") or src.get("small") or ""),
        "downloadUrl": str(src.get("original") or src.get("large2x") or ""),
        "width": width,
        "height": height,
        "orientation": photo_orientation(width, height),
        "retrievedAt": retrieved_at or retrieved_now(),
        "provenance": str(photo["url"]),
        # Pexels does not expose a per-result license value in this response.
        "license": None,
    }
    if local_path is not None:
        result["localPath"] = str(pathlib.Path(local_path))
    return result


def search(query, orientation="portrait", per_page=MAX_CANDIDATES,
           api_key=None, get=requests.get):
    count = bounded_count(per_page)
    headers = {"Authorization": api_key or load_api_key()}
    params = {"query": query, "orientation": orientation, "per_page": count}
    response = get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=20)
    response.raise_for_status()
    stamp = retrieved_now()
    return [candidate(photo, stamp) for photo in response.json().get("photos", [])[:count]]


def candidate_payload(args, candidates):
    return {"provider": "pexels", "mediaType": "photo", "query": args.query,
            "orientation": args.orientation, "candidateCap": MAX_CANDIDATES,
            "count": len(candidates), "candidates": candidates}


def cmd_list(args):
    candidates = search(args.query, args.orientation, args.per_page)
    if args.json:
        print(json.dumps(candidate_payload(args, candidates), ensure_ascii=False, indent=2))
        return
    if not candidates:
        print(f"No photo results for {args.query!r} (orientation={args.orientation}).")
        return
    for index, item in enumerate(candidates):
        print(f"[{index}] id={item['pexelsId']} {item['width']}x{item['height']} "
              f"by {item['photographer']} page={item['pageUrl']}")
        print(f"     preview: {item['previewUrl']}")


def cmd_get(args):
    candidates = search(args.query, args.orientation, args.per_page)
    if not candidates:
        raise RuntimeError(f"No photo results for {args.query!r} (orientation={args.orientation}).")
    if args.index < 0 or args.index >= len(candidates):
        raise RuntimeError(f"Only {len(candidates)} results; index {args.index} is out of range.")
    selected = candidates[args.index]
    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img = requests.get(selected["downloadUrl"], timeout=30)
    img.raise_for_status()
    out_path.write_bytes(img.content)
    downloaded = {**selected, "localPath": str(out_path)}
    if args.json:
        print(json.dumps(downloaded, ensure_ascii=False, indent=2))
    else:
        print(f"Saved {out_path} ({selected['width']}x{selected['height']}, "
              f"photo by {selected['photographer']}, {selected['pageUrl']})")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="List candidate photos for a query")
    p_list.add_argument("query")
    p_list.add_argument("--orientation", default="portrait", choices=["landscape", "portrait", "square"])
    p_list.add_argument("--per-page", type=int, default=MAX_CANDIDATES)
    p_list.add_argument("--json", action="store_true")
    p_list.set_defaults(func=cmd_list)

    p_get = sub.add_parser("get", help="Download one candidate photo")
    p_get.add_argument("query")
    p_get.add_argument("out")
    p_get.add_argument("--orientation", default="portrait", choices=["landscape", "portrait", "square"])
    p_get.add_argument("--per-page", type=int, default=MAX_CANDIDATES)
    p_get.add_argument("--index", type=int, default=0)
    p_get.add_argument("--json", action="store_true")
    p_get.set_defaults(func=cmd_get)

    args = parser.parse_args()
    try:
        args.func(args)
    except (OSError, RuntimeError, requests.RequestException, ValueError, KeyError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
