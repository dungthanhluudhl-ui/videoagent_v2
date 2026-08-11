"""
Generate stock-style cutout images with Gemini image models via the
OpenRouter API, as a replacement for Pexels sourcing.

Reads OPENROUTER_API_KEY from a .env file (searched upward from this
script's location) or from the environment. No browser automation needed.

Generate one image from a prompt:

    python generate_image.py gen "a gavel on a solid white background, studio product photo" \
        public/raw_cache/gavel.png

Options:
    --model NAME     default: google/gemini-3.1-flash-lite-image
    --n N            number of images to request in one call, default: 1 (saved as _0, _1, ...)
"""

import argparse
import base64
import json
import os
import pathlib
import sys
import urllib.request
import urllib.error

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-3.1-flash-lite-image"


def load_api_key():
    key = os.environ.get("OPENROUTER_API_KEY")
    if key:
        return key
    here = pathlib.Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        env_path = parent / ".env"
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.split("=", 1)[1].strip()
    sys.exit("OPENROUTER_API_KEY not found in environment or any .env file above this script.")


def generate(prompt, model):
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"],
    }).encode("utf-8")
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {load_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"OpenRouter API error {e.code}: {e.read().decode('utf-8', 'replace')}")

    choice = data["choices"][0]["message"]
    images = choice.get("images") or []
    if not images:
        sys.exit(f"No images returned. Model said: {choice.get('content')!r}")
    return images


def cmd_gen(args):
    images = generate(args.prompt, args.model)
    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    stem, suffix = out_path.stem, out_path.suffix or ".png"

    for i, img in enumerate(images):
        url = img["image_url"]["url"]
        if not url.startswith("data:"):
            sys.exit(f"Unexpected non-data-URI image_url: {url[:80]}")
        _, b64data = url.split(",", 1)
        raw = base64.b64decode(b64data)
        dest = out_path if len(images) == 1 else out_path.with_name(f"{stem}_{i}{suffix}")
        dest.write_bytes(raw)
        print(f"Saved {dest} ({len(raw)} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_gen = sub.add_parser("gen", help="Generate an image from a prompt")
    p_gen.add_argument("prompt")
    p_gen.add_argument("out")
    p_gen.add_argument("--model", default=DEFAULT_MODEL)
    p_gen.set_defaults(func=cmd_gen)

    args = parser.parse_args()
    args.func(args)
