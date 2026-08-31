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
import contextlib
import copy
import io
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


def _fake_cutout(path, spill=False, all_green=False, touch_border=False,
                 wide_feather=False):
    """Dựng một ảnh cutout tổng hợp mang đúng MỘT khuyết tật.

    Tổng hợp chứ không dùng tài sản thật, vì một ca kiểm thử phải nêu được
    chính xác thứ nó kiểm. Tài sản thật mang nhiều đặc điểm cùng lúc, và một
    ca xanh vì lý do khác với tên gọi của nó thì tệ hơn một ca đỏ.
    """
    import numpy as np
    from PIL import Image

    n, r = 200, 60
    yy, xx = np.mgrid[0:n, 0:n]
    d = np.sqrt((xx - n / 2) ** 2 + (yy - n / 2) ** 2)
    rgba = np.zeros((n, n, 4), np.uint8)
    body = d <= r
    rgba[body, :3] = 128
    rgba[body, 3] = 255
    if all_green:                      # vật THẬT màu xanh: xanh cả trong lẫn ngoài
        rgba[body, :3] = (0, 255, 0)
    if spill:                          # phông hắt lên: chỉ xanh ở vành ngoài
        rgba[body & (d > r - 5), :3] = (0, 255, 0)
    if wide_feather:                   # quầng khói: alpha xuống dốc rất thoải
        band = (d > 40) & (d <= 90)
        rgba[band, :3] = 128
        rgba[band, 3] = np.clip(255 * (90 - d[band]) / 50, 21, 234).astype(np.uint8)
    if touch_border:                   # khối nền sót lại, chạy ra tận mép dưới
        rgba[-30:, :, :3] = 128
        rgba[-30:, :, 3] = 255
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(path)


def _repaint_frames(mode):
    """Vẽ đè mọi khung hình review trong sandbox để dựng đúng một khuyết tật.

    Đè lên khung hình chứ không sửa file cảnh, vì thứ đang được kiểm là "mã
    nguồn nói có chữ ở đây, khung hình render có đúng thế không". Sửa toạ độ
    trong file cảnh chỉ dịch chuyển cả hai vế cùng lúc.
    """
    def hook(tmp):
        import numpy as np
        from PIL import Image

        for f in (tmp / "input" / "review_frames").glob("*.png"):
            w, h = Image.open(f).size
            if mode == "blank":                 # không còn mực ở bất cứ đâu
                arr = np.full((h, w), 235, np.uint8)
            elif mode == "sparse":              # có nội dung thật, nhưng nhiều khoảng thở
                arr = np.full((h, w), 235, np.uint8)
                arr[int(h * 0.28):int(h * 0.38), int(w * 0.15):int(w * 0.85)] = 35
            else:                               # có mực, nhưng chênh 31/255
                arr = np.full((h, w), 200, np.uint8)
                arr[::4, :] = 231
            Image.fromarray(arr, "L").convert("RGB").save(f)
    return hook


def _materialize_synthetic_review_frames(tmp, review):
    """Create deterministic mechanical fixtures when golden stills are absent.

    This clone tracks review10.json but not the `input/review_frames` it points
    to. Selftests must still exercise pixel/review mechanics without generating
    or pretending to review a golden video. These checkerboards live only in
    TemporaryDirectory sandboxes and mean exactly one thing: visible,
    high-contrast pixels exist everywhere a source-derived text box may land.
    Defect cases repaint them after this helper runs.
    """
    import numpy as np
    from PIL import Image

    h, w = 480, 270
    yy, xx = np.indices((h, w))
    arr = np.where(((xx // 4) + (yy // 4)) % 2, 235, 35).astype(np.uint8)
    for entry in review.get("scenes", []):
        rel = pathlib.Path(str(entry.get("frame") or "").replace("\\", "/"))
        if not str(rel):
            continue
        path = tmp / rel
        if path.exists():
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(arr, "L").convert("RGB").save(path)


def cutout_case(**kw):
    """(sandbox_hook, args) cho một ca cutout_gate."""
    def hook(tmp):
        _fake_cutout(tmp / "public" / "el10_probe.png", **kw)
    return hook, (lambda plan_path: [str(plan_path.parent.parent / "public")])


class Case:
    """One (mutation, gate, expected outcome) triple."""

    def __init__(self, name, gate, mutate=None, expect_fail=True, args=None, review=None,
                 scene_edit=None, sandbox_hook=None, expect_message=(), stdin=None):
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
        # Callable(plan_path) -> str đổ vào stdin. hook_gate.py nhận payload
        # (cwd, tool_input) qua stdin đúng như harness đưa, nên test nó phải
        # đưa cùng đường.
        self.stdin = stdin


def run_gate(gate, argv, cwd, stdin_text=None):
    proc = subprocess.run([sys.executable, str(SCRIPTS / gate), *argv],
                          capture_output=True, text=True, encoding="utf-8",
                          errors="replace", cwd=str(cwd), input=stdin_text)
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def _load_script(name):
    """Load a script for small pure contract checks without spawning a pipeline."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(f"vox_selftest_{name}", SCRIPTS / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def repair_contract_checks(tmp):
    """Focused V15 generic-repair contracts using synthetic paths/pixels only."""
    checks = []

    state = _load_script("stage_state.py")
    pipeline = _load_script("pipeline_contracts.py")
    build_gate = _load_script("build_gate.py")
    review_tool = _load_script("render_review_sheet.py")
    render_video = _load_script("render_video.py")
    asset_manifest = _load_script("asset_manifest.py")
    asset_vision = _load_script("asset_vision.py")
    frame_vision = _load_script("vision_check.py")
    hook = _load_script("hook_gate.py")
    sheet_vision = _load_script("sheet_vision.py")
    review_vision = _load_script("review_vision.py")
    plan_gate = _load_script("plan_gate.py")

    # V16-like primary treatment run: backdrop and bespoke arrangement prose
    # differ, but the director still receives one advisory over the exact run.
    treatment_run = [
        {"id": "S10", "visualLanguage": "document", "backdrop": "card",
         "template": "bespoke: evidence title and authority stack"},
        {"id": "S11", "visualLanguage": "document", "backdrop": "spotlight",
         "template": "bespoke: quotation crop beside source badge"},
        {"id": "S12", "visualLanguage": "document", "backdrop": "chart",
         "template": "bespoke: document fragments become a comparison chart"},
        {"id": "S13", "visualLanguage": "document", "backdrop": "spotlight",
         "template": "bespoke: final record panel with highlighted holding"},
    ]
    run_report = plan_gate.Report()
    plan_gate.gate_diversity(copy.deepcopy(treatment_run), run_report, {})
    run_text = "\n".join(run_report.lines)
    checks.append(("preflight: varied grammar still surfaces S10-S13 primary document run",
                   "WARN S10-S13: 4 consecutive scenes use DOCUMENT" in run_text and
                   "card / spotlight / chart / spotlight" in run_text))
    checks.append(("preflight: primary treatment run remains advisory, never hard",
                   not run_report.failures))
    interrupted = copy.deepcopy(treatment_run)
    interrupted[2]["visualLanguage"] = "data"
    interrupted_report = plan_gate.Report()
    plan_gate.gate_diversity(interrupted, interrupted_report, {})
    checks.append(("preflight: changing a middle primary treatment breaks the four-scene run",
                   "4 consecutive scenes" not in "\n".join(interrupted_report.lines) and
                   not interrupted_report.failures))

    # Generic receipts: true input, tool and parameter changes each invalidate.
    source = tmp / "audio.mp3"; source.write_bytes(b"audio-a")
    output = tmp / "transcript.json"; output.write_text('{"ok":true}', encoding="utf-8")
    rpath = tmp / "receipt.json"
    audio_inputs = {"audio": state.file_input(source)}
    trans_tool = {"whisper": "same-model", "version": "1"}
    trans_params = {"language": "vi"}
    state.make_receipt(rpath, "transcription", audio_inputs, trans_tool, trans_params, [output])
    checks.append(("receipt: unchanged audio reuses transcription",
                   state.receipt_current(rpath, "transcription", audio_inputs,
                                         trans_tool, trans_params)[0]))
    source.write_bytes(b"audio-b")
    checks.append(("receipt: changed audio invalidates transcription",
                   not state.receipt_current(rpath, "transcription",
                                             {"audio": state.file_input(source)},
                                             trans_tool, trans_params)[0]))

    script = tmp / "script.txt"; script.write_text("first script", encoding="utf-8")
    transcript = tmp / "transcript-source.json"; transcript.write_text('{"segments":[]}', encoding="utf-8")
    aligned = tmp / "aligned.json"; aligned.write_text('{"words":[]}', encoding="utf-8")
    align_inputs = {"script": state.file_input(script), "transcript": state.json_input(transcript)}
    align_tool = {"version": "align-1"}; align_params = {"manual": True}
    state.make_receipt(rpath, "alignment", align_inputs, align_tool, align_params, [aligned],
                       accepted={"manual": True})
    current, manual_receipt = state.receipt_current(rpath, "alignment", align_inputs,
                                                    align_tool, align_params)
    checks.append(("alignment: manual acceptance survives unchanged inputs",
                   current and manual_receipt.get("accepted", {}).get("manual") is True))
    script.write_text("changed script", encoding="utf-8")
    checks.append(("alignment: changed script invalidates while transcript remains reusable",
                   not state.receipt_current(rpath, "alignment",
                       {"script": state.file_input(script), "transcript": state.json_input(transcript)},
                       align_tool, align_params)[0]))
    script.write_text("first script", encoding="utf-8")
    transcript.write_text('{"segments":[{"x":1}]}', encoding="utf-8")
    checks.append(("alignment: changed transcript invalidates",
                   not state.receipt_current(rpath, "alignment",
                       {"script": state.file_input(script), "transcript": state.json_input(transcript)},
                       align_tool, align_params)[0]))
    checks.append(("alignment: implementation version invalidates",
                   not state.receipt_current(rpath, "alignment", align_inputs,
                                             {"version": "align-2"}, align_params)[0]))

    # Synthetic project contracts.
    (tmp / "input").mkdir(exist_ok=True); (tmp / "public").mkdir(exist_ok=True)
    (tmp / "src" / "scenes").mkdir(parents=True, exist_ok=True)
    package = {"dependencies": {"remotion": "^4.0.507", "@remotion/cli": "^4.0.507",
                                "lucide-react": "^1.33.0", "unrelated-package": "^2.0.0"}}
    (tmp / "package.json").write_text(json.dumps(package), encoding="utf-8")
    words_path = tmp / "input" / "words99_aligned.json"
    words_path.write_text(json.dumps({"words": [["local", 0.0, 0.3, 0], ["narration", 0.3, 0.8, 0],
                                                ["neighbor", 2.1, 2.5, 1]]}), encoding="utf-8")
    evidence = tmp / "source.pdf"; evidence.write_bytes(b"official-a")
    asset_a = tmp / "public" / "asset-a.png"; asset_a.write_bytes(b"image-a")
    asset_b = tmp / "public" / "asset-b.png"; asset_b.write_bytes(b"image-b")
    audio = tmp / "public" / "audio99.mp3"; audio.write_bytes(b"audio-a")
    synthetic_plan = {
        "video": "V99", "fps": 30, "wordsFile": "input/words99_aligned.json",
        "audioFile": "audio99.mp3",
        "status": "active", "shotlistApproved": True, "sourceAuthority": str(evidence),
        "globalVisualContract": {"palette": "paper-orange", "bespoke": True},
        "scenes": [
            {"id": "S1", "startSec": 0, "endSec": 2, "durationInFrames": 60,
             "status": "built", "viewerQuestion": "q1", "visualTransformation": "a becomes b",
             "contrastWithPrevious": "opening", "visualEvents": [{"frame": 0, "what": "open"},
                                                                {"frame": 25, "what": "change"}],
             "assets": [{"name": "Doc", "src": "asset-a.png", "role": "document",
                         "describes": ["proof"], "evidenceRegions": [{"anchorPhrase": "local", "region": [0,0,1,1]}]}]},
            {"id": "S2", "startSec": 2, "endSec": 4, "durationInFrames": 60,
             "status": "planned", "viewerQuestion": "q2", "visualTransformation": "c replaces d",
             "contrastWithPrevious": "photo after document", "visualEvents": [{"frame": 10, "what": "arrive"}],
             "assets": [{"name": "Ordinary", "src": "asset-b.png", "role": "hero",
                         "describes": ["neighbor"]}]}
        ]}
    plan_path = tmp / "input" / "scene_plan99.json"
    plan_path.write_text(json.dumps(synthetic_plan), encoding="utf-8")

    contract_a = state.plan_contract(synthetic_plan, plan_path)
    plan_receipt = tmp / "plan-receipt.json"
    state.make_receipt(plan_receipt, "editorial-plan", contract_a, {"version": 1}, {},
                       outputs=(), accepted={"manual": True})
    checks.append(("plan: unchanged true inputs reuse approved receipt",
                   state.receipt_current(plan_receipt, "editorial-plan", contract_a,
                                         {"version": 1}, {}, require_outputs=False)[0]))
    workflow_only = copy.deepcopy(synthetic_plan); workflow_only["status"] = "shipped"
    workflow_only["scenes"][0]["status"] = "reviewed"
    checks.append(("plan: workflow state alone does not reopen editorial contract",
                   state.plan_contract(workflow_only, plan_path) == contract_a))
    changed_timing = copy.deepcopy(synthetic_plan); changed_timing["scenes"][0]["endSec"] = 1.8
    checks.append(("plan: narration/timing mutation invalidates",
                   state.plan_contract(changed_timing, plan_path) != contract_a))
    evidence.write_bytes(b"official-b")
    checks.append(("plan: source contract bytes mutation invalidates",
                   state.plan_contract(synthetic_plan, plan_path) != contract_a))
    evidence.write_bytes(b"official-a")

    # Previs approval freezes actual pixels/assets/intent, not mutable source bytes.
    from PIL import Image, ImageDraw, ImageEnhance
    approval_plan = copy.deepcopy(synthetic_plan)
    approval_plan["scenes"] = [copy.deepcopy(approval_plan["scenes"][0])]
    approval_scene = approval_plan["scenes"][0]
    approval_scene["assetRationale"] = "The authentic document carries the proof named by this scene."
    approval_scene["assets"][0].update({"meaningBearing": True, "locked": True,
                                         "lockedSha256": state.hash_file(asset_a),
                                         "selectionRationale": approval_scene["assetRationale"]})
    plan_path.write_text(json.dumps(approval_plan), encoding="utf-8")
    approval_source = tmp / "src" / "scenes" / "V99Scene1.jsx"
    approval_source.write_text("<AbsoluteFill>approved rough source bytes</AbsoluteFill>", encoding="utf-8")
    baseline_dir = tmp / "input" / "previs_baseline99"; baseline_dir.mkdir()
    open_frame = baseline_dir / "S1_OPEN.png"; key_frame = baseline_dir / "S1_KEY.png"
    base_pixels = Image.new("RGB", (1080, 1920), (18, 18, 16))
    base_draw = ImageDraw.Draw(base_pixels)
    base_draw.rounded_rectangle((80, 330, 650, 1760), 50, fill=(225, 220, 205),
                                outline=(255, 106, 26), width=24)
    base_draw.rectangle((690, 240, 1020, 730), fill=(255, 106, 26))
    base_pixels.save(open_frame); base_pixels.save(key_frame)
    contact = baseline_dir / "previs_contact_sheet.png"; base_pixels.save(contact)
    baseline_manifest = baseline_dir / "previs_frame_manifest.json"
    state.write_json(baseline_manifest, {"schema": 1, "contactSheet": str(contact), "frames": [
        {"scene": "S1", "role": "OPEN", "path": str(open_frame),
         "sha256": state.hash_file(open_frame)},
        {"scene": "S1", "role": "KEY", "path": str(key_frame),
         "sha256": state.hash_file(key_frame)},
    ]})
    original_pipeline_run = pipeline.subprocess.run
    pipeline.subprocess.run = lambda *_args, **_kwargs: type(
        "PrevisPlanCheck", (), {"returncode": 0, "stdout": "", "stderr": ""})()
    try:
        pipeline.approve_previs(plan_path, baseline_manifest, "human approved this actual-pixel composition")
        approved_current = pipeline.previs_is_closed(plan_path)[0]
        approval_source.write_text(
            "<AbsoluteFill>approved rough source bytes plus additive motion</AbsoluteFill>", encoding="utf-8")
        source_edit_current = pipeline.previs_is_closed(plan_path)[0]
        asset_a.write_bytes(b"primary-asset-swap")
        asset_swap_current = pipeline.previs_is_closed(plan_path)[0]
    finally:
        pipeline.subprocess.run = original_pipeline_run
        asset_a.write_bytes(b"image-a")
    checks.append(("previs approval: unchanged baseline is current", approved_current))
    checks.append(("previs approval: additive source edit does not invalidate approved pixels",
                   source_edit_current))
    checks.append(("previs approval: primary asset byte swap invalidates lock",
                   not asset_swap_current))

    polished = baseline_dir / "polished.png"
    moved = baseline_dir / "moved-400px.png"
    ImageEnhance.Contrast(base_pixels).enhance(1.015).save(polished)
    moved_pixels = Image.new("RGB", (1080, 1920), (18, 18, 16))
    moved_pixels.paste(base_pixels.crop((0, 0, 680, 1920)), (400, 0))
    ImageDraw.Draw(moved_pixels).rectangle((690, 240, 1020, 730), fill=(255, 106, 26))
    moved_pixels.save(moved)
    legitimate = build_gate.compare_previs_pixels(open_frame, polished)
    displaced = build_gate.compare_previs_pixels(open_frame, moved)
    checks.append(("previs drift: legitimate polish passes coarse actual-pixel comparison",
                   legitimate["passed"]))
    checks.append(("previs drift: intentional roughly 400px hero displacement fails",
                   not displaced["passed"]))

    direct_scene = tmp / "src" / "scenes" / "V99Scene1.jsx"
    direct_scene.write_text(
        'import {staticFile} from "remotion"; export const X=()=>'
        '<div data-visual-treatment="diagram"><Img name="Doc" '
        'src={staticFile("asset-a.png")}/></div>;', encoding="utf-8")
    direct_built = build_gate.parse_scene_file(direct_scene)
    checks.append(("build gate: direct bespoke staticFile asset identity is readable",
                   any(x["name"] == "Doc" and x["src"] == "asset-a.png"
                       for x in direct_built["assets"])))
    checks.append(("build gate: direct bespoke treatment declaration is explicit",
                   'data-visual-treatment="diagram"' in direct_built["text"]))

    review_path = tmp / "input" / "review99.json"
    review_path.write_text('{"video":"V99"}', encoding="utf-8")
    correction_path, correction = pipeline.close_correction(
        plan_path, "one local correction", changed_scenes=["S1"])
    checks.append(("correction locality: receipt binds only declared changed scene sources",
                   correction_path.is_file() and correction["accepted"]["changedScenes"] == ["S1"]
                   and len(correction["inputs"]["sceneSources"]) == 1
                   and correction["inputs"]["sceneSources"][0]["path"].endswith("V99Scene1.jsx")))
    plan_path.write_text(json.dumps(synthetic_plan), encoding="utf-8")

    board = _load_script("generate_board.py")
    class PromptArgs:
        full_bleed = False; bg = "green"; cols = None; consistent_subject = None
        context = None; model = "model-a"; generation_id = None; lineage = None
    prompt_args = PromptArgs()
    prompt_a = board.assembled_prompt([("asset", "specific brief")], prompt_args)
    prompt_b = board.assembled_prompt([("asset", "changed brief")], prompt_args)
    prompt_args.bg = "magenta"
    prompt_c = board.assembled_prompt([("asset", "specific brief")], prompt_args)
    checks.append(("prompt: semantic brief or style contract invalidates assembled prompt",
                   len({state.digest(prompt_a), state.digest(prompt_b), state.digest(prompt_c)}) == 3))
    before_image = state.file_input(asset_a); asset_a.write_bytes(b"image-a-changed")
    checks.append(("asset: same filename with changed bytes invalidates identity",
                   before_image != state.file_input(asset_a)))
    asset_a.write_bytes(b"image-a")

    cut_inputs = {"source": state.file_input(asset_a)}; cut_tool = {"model": "isnet"}
    cut_params = {"fit": "3:4"}
    state.make_receipt(rpath, "cutout", cut_inputs, cut_tool, cut_params, [output])
    asset_a.write_bytes(b"image-a-2")
    checks.append(("cutout: source mutation invalidates",
                   not state.receipt_current(rpath, "cutout", {"source": state.file_input(asset_a)},
                                             cut_tool, cut_params)[0]))
    asset_a.write_bytes(b"image-a")
    checks.append(("cutout: processing parameter/model mutation invalidates",
                   not state.receipt_current(rpath, "cutout", cut_inputs,
                                             {"model": "u2net"}, {"fit": "1:1"})[0]))

    meta = {"name": "Doc", "role": "document", "describes": ["proof"],
            "transformation": "a becomes b", "template": "bespoke"}
    av1 = asset_vision.semantic_key(asset_a, meta, "model-a")
    av2 = asset_vision.semantic_key(asset_a, {**meta, "describes": ["changed slot brief"]}, "model-a")
    av3 = asset_vision.semantic_key(asset_a, meta, "model-b")
    checks.append(("asset vision: unchanged semantic key hits; brief/model changes miss",
                   av1 == asset_vision.semantic_key(asset_a, meta, "model-a") and len({av1,av2,av3}) == 3))
    fv1 = frame_vision.frame_cache_key(asset_a, {"scene": "S1", "masterFrame": 20}, "model-a", 45)
    fv2 = frame_vision.frame_cache_key(asset_a, {"scene": "S1", "masterFrame": 21}, "model-a", 45)
    fv3 = frame_vision.frame_cache_key(asset_a, {"scene": "S1", "masterFrame": 20}, "model-b", 45)
    checks.append(("frame vision: per-frame brief/model keys invalidate independently",
                   fv1 == frame_vision.frame_cache_key(asset_a, {"scene":"S1","masterFrame":20}, "model-a", 45)
                   and len({fv1,fv2,fv3}) == 3))

    packet = pipeline.build_worker_packet(plan_path, ["S1"])
    packet_text = json.dumps(packet, ensure_ascii=False)
    checks.append(("worker packet contains local timing/narration/plan/global/assets/neighbors/primitives",
                   all(x in packet_text for x in ("local narration", "a becomes b", "asset-a.png",
                                                  "paper-orange", "S2", "shared.jsx"))))
    checks.append(("worker packet excludes unrelated source/log/history/all-asset payloads",
                   "asset-b.png" not in packet_text and "historical logs" in packet["excluded"]
                   and "lessons archive" in packet["excluded"]))
    packet_changed = pipeline.build_worker_packet(plan_path, ["S1"])
    synthetic_changed = copy.deepcopy(synthetic_plan)
    synthetic_changed["scenes"][0]["visualTransformation"] = "different local contract"
    plan_path.write_text(json.dumps(synthetic_changed), encoding="utf-8")
    checks.append(("scene: local packet/plan scene mutation invalidates packet",
                   pipeline.build_worker_packet(plan_path, ["S1"])["packetId"] != packet_changed["packetId"]))
    plan_path.write_text(json.dumps(synthetic_plan), encoding="utf-8")

    manifest = review_tool.sample_manifest(synthetic_plan, tmp / "frames", 2)
    s1 = [x for x in manifest["samples"] if x["scene"] == "S1"]
    s2 = [x for x in manifest["samples"] if x["scene"] == "S2"]
    checks.append(("review mapping: local frames map across scene boundaries to master time",
                   all(x["masterFrame"] == x["localFrame"] for x in s1) and
                   all(x["masterFrame"] == 60 + x["localFrame"] for x in s2) and
                   all(abs(x["masterTimeSec"] - x["masterFrame"]/30) < 1e-6 for x in manifest["samples"])))
    checks.append(("review mapping: visualEvent settled and near-cut samples remain present",
                   20 in [x["localFrame"] for x in s1] and 45 in [x["localFrame"] for x in s1]
                   and 54 in [x["localFrame"] for x in s1]))
    entries = review_tool.review_entries(manifest)
    checks.append(("review mapping: scene-summary selects one recorded representative per scene",
                   len(entries) == 2 and all(e["frame"] in e["frames"] for e in entries)))
    cmd = review_tool.extraction_command("draft.mp4", manifest["samples"], tmp / "f_%04d.png")
    checks.append(("review extraction command is one ffmpeg process over requested master frames",
                   cmd[:1] == ["ffmpeg"] and "select=" in " ".join(cmd) and
                   "remotion" not in " ".join(cmd).lower()))
    targeted = manifest["targetedFullResolution"]
    manual_manifest = review_tool.sample_manifest(synthetic_plan, tmp / "frames", 2, ["S2"])
    checks.append(("full-res selection: documents automatic, ordinary frames not all forced, manual escalation works",
                   {x["scene"] for x in targeted} == {"S1"} and
                   {x["scene"] for x in manual_manifest["targetedFullResolution"]} == {"S1", "S2"}))
    full_cmd = review_tool.targeted_full_res_command(manual_manifest, tmp / "full")
    checks.append(("targeted full-res uses one Remotion render process for selected frames",
                   full_cmd[:3] == ["npx", "remotion", "render"] and
                   "--sequence" in full_cmd and "--image-format=png" in full_cmd and
                   "--frames=" in " ".join(full_cmd) and "--codec=none" not in full_cmd))
    draft_proof = {"path": "draft.mp4", "size": 1, "mtimeNs": 1}
    rkey = review_tool.sample_identity(draft_proof, manifest, manifest["samples"][0])
    changed_draft = review_tool.sample_identity({**draft_proof, "size": 2}, manifest, manifest["samples"][0])
    changed_sample = review_tool.sample_identity(draft_proof, manifest, {**manifest["samples"][0], "masterFrame": 99})
    checks.append(("review: draft or sample manifest mutation invalidates affected evidence",
                   len({rkey, changed_draft, changed_sample}) == 3))
    third_plan = copy.deepcopy(synthetic_plan)
    third_plan["scenes"].append({"id": "S3", "startSec": 4, "endSec": 6,
                                 "durationInFrames": 60, "status": "built",
                                 "viewerQuestion": "q3", "visualTransformation": "e reveals f",
                                 "contrastWithPrevious": "new ending", "visualEvents": [{"frame": 5, "what": "end"}],
                                 "assets": []})
    local_scene_one = tmp / "src" / "scenes" / "V99Scene1.jsx"
    local_scene_two = tmp / "src" / "scenes" / "V99Scene2.jsx"
    local_scene_one.write_text("scene-one-a", encoding="utf-8")
    local_scene_two.write_text("scene-two-a", encoding="utf-8")
    (tmp / "src" / "scenes" / "V99Scene3.jsx").write_text("scene-three", encoding="utf-8")
    third_manifest = review_tool.sample_manifest(third_plan, tmp / "frames3", 2)
    sample_s1 = next(x for x in third_manifest["samples"] if x["scene"] == "S1")
    sample_s3 = next(x for x in third_manifest["samples"] if x["scene"] == "S3")
    params = {"scale": 0.5, "fps": 30}
    s1_before = state.digest(review_tool.sample_source_proof(tmp, plan_path, third_plan, sample_s1, params))
    s3_before = state.digest(review_tool.sample_source_proof(tmp, plan_path, third_plan, sample_s3, params))
    local_scene_one.write_text("scene-one-b", encoding="utf-8")
    s1_after = state.digest(review_tool.sample_source_proof(tmp, plan_path, third_plan, sample_s1, params))
    s3_after = state.digest(review_tool.sample_source_proof(tmp, plan_path, third_plan, sample_s3, params))
    checks.append(("review: local scene change invalidates affected/neighbor evidence, not distant scene",
                   s1_before != s1_after and s3_before == s3_after))

    # Draft/final render closure uses normalized render sources/settings and does
    # not care about workflow-only plan status.
    helper = tmp / "src" / "scenes" / "V99Kit.jsx"
    helper.write_text("export const kit='a'", encoding="utf-8")
    (tmp / "src" / "V99Master.jsx").write_text(
        'import {Circle} from "lucide-react"; export const V99Master=()=>Circle;', encoding="utf-8")
    (tmp / "src" / "Root.jsx").write_text(
        'import {V99Master} from "./V99Master";\n'
        'export const Root=()=> <><Composition id="V98Master" component={Other}/>'
        '<Composition id="V99Master" component={V99Master} durationInFrames={120} fps={30} width={1080} height={1920}/></>;',
        encoding="utf-8")
    (tmp / "src" / "scenes" / "V99Scene1.jsx").write_text(
        'import {kit} from "./V99Kit"; export const scene=kit;', encoding="utf-8")
    (tmp / "src" / "scenes" / "V99Scene2.jsx").write_text("scene-two", encoding="utf-8")
    (tmp / "src" / "scenes" / "shared.jsx").write_text("shared", encoding="utf-8")
    (tmp / "src" / "scenes" / "visualLanguage.jsx").write_text("visual", encoding="utf-8")
    (tmp / "remotion.config.ts").write_text("config", encoding="utf-8")
    lock = {"lockfileVersion": 3, "packages": {
        "node_modules/remotion": {"version": "4.0.507"},
        "node_modules/@remotion/cli": {"version": "4.0.507"},
        "node_modules/lucide-react": {"version": "1.33.0"},
        "node_modules/unrelated-package": {"version": "2.0.0"},
    }}
    lock_path = tmp / "package-lock.json"
    lock_path.write_text(json.dumps(lock), encoding="utf-8")
    runtime_versions = render_video.resolved_render_versions(
        tmp, [tmp / "src" / "V99Master.jsx"])
    checks.append(("draft versions: canonical lowercase Remotion runtime identities resolve exact lock",
                   runtime_versions.get("remotion") ==
                   {"version": "4.0.507", "resolution": "package-lock"} and
                   runtime_versions.get("@remotion/cli") ==
                   {"version": "4.0.507", "resolution": "package-lock"} and
                   "@Remotion/cli" not in runtime_versions))
    draft = tmp / "draft.mp4"; draft.write_bytes(b"synthetic-draft")
    final = tmp / "final.mp4"; final.write_bytes(b"synthetic-final")
    d = render_video.render_contract(plan_path, "draft", draft)
    state.make_receipt(d[3], "render-draft", d[6], d[7], d[8], [draft])
    checks.append(("draft: unchanged relevant source/settings reuse",
                   render_video.render_contract(plan_path, "draft", draft)[4]))
    unrelated_lock = copy.deepcopy(lock)
    unrelated_lock["packages"]["node_modules/unrelated-package"]["version"] = "2.1.0"
    lock_path.write_text(json.dumps(unrelated_lock), encoding="utf-8")
    checks.append(("draft versions: unrelated locked dependency mutation stays HIT",
                   render_video.render_contract(plan_path, "draft", draft)[4]))
    used_lock = copy.deepcopy(lock)
    used_lock["packages"]["node_modules/lucide-react"]["version"] = "1.34.0"
    lock_path.write_text(json.dumps(used_lock), encoding="utf-8")
    checks.append(("draft versions: source-closure locked dependency mutation invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    runtime_lock = copy.deepcopy(lock)
    runtime_lock["packages"]["node_modules/remotion"]["version"] = "4.0.508"
    lock_path.write_text(json.dumps(runtime_lock), encoding="utf-8")
    checks.append(("draft versions: unchanged package range with changed exact lock invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    lock_path.unlink()
    fallback_a = render_video.resolved_render_versions(tmp, [tmp / "src" / "V99Master.jsx"])
    fallback_b = render_video.resolved_render_versions(tmp, [tmp / "src" / "V99Master.jsx"])
    checks.append(("draft versions: missing lock uses deterministic marked fallback",
                   fallback_a == fallback_b and
                   fallback_a["lucide-react"]["resolution"] == "package-json-fallback" and
                   fallback_a["lucide-react"]["unresolved"]))
    lock_path.write_text(json.dumps(lock), encoding="utf-8")
    editorial = copy.deepcopy(synthetic_plan)
    editorial["scenes"][0]["viewerQuestion"] = "editorial wording only"
    editorial["scenes"][0]["density"] = "high"
    editorial["qualityNote"] = "advisory only"
    plan_path.write_text(json.dumps(editorial), encoding="utf-8")
    checks.append(("draft: editorial-only plan metadata mutation stays HIT",
                   render_video.render_contract(plan_path, "draft", draft)[4]))
    plan_path.write_text(json.dumps(synthetic_plan), encoding="utf-8")
    root_file = tmp / "src" / "Root.jsx"
    original_root = root_file.read_text(encoding="utf-8")
    root_file.write_text(original_root.replace("V98Master", "V97Master"), encoding="utf-8")
    unrelated_video = tmp / "src" / "scenes" / "V98Scene1.jsx"
    unrelated_video.write_text("unrelated changed", encoding="utf-8")
    checks.append(("draft: unrelated composition/video mutation stays HIT",
                   render_video.render_contract(plan_path, "draft", draft)[4]))
    root_file.write_text(original_root, encoding="utf-8")
    d_half = render_video.render_contract(plan_path, "draft", draft, scale=0.6)
    checks.append(("draft: render settings mutation invalidates",
                   not d_half[4]))
    scene_one = tmp / "src" / "scenes" / "V99Scene1.jsx"
    scene_one.write_text("scene-one-changed", encoding="utf-8")
    checks.append(("draft: relevant source mutation invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    scene_one.write_text('import {kit} from "./V99Kit"; export const scene=kit;', encoding="utf-8")
    helper.write_text("export const kit='changed'", encoding="utf-8")
    checks.append(("draft: imported rendering helper mutation invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    helper.write_text("export const kit='a'", encoding="utf-8")
    asset_a.write_bytes(b"image-changed")
    checks.append(("draft: referenced asset byte mutation invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    asset_a.write_bytes(b"image-a")
    audio.write_bytes(b"audio-changed")
    checks.append(("draft: audio byte mutation invalidates",
                   not render_video.render_contract(plan_path, "draft", draft)[4]))
    audio.write_bytes(b"audio-a")
    f = render_video.render_contract(plan_path, "final", final)
    state.make_receipt(f[3], "render-final", f[6], f[7], f[8], [final])
    checks.append(("final: unchanged full-resolution settings reuse",
                   render_video.render_contract(plan_path, "final", final)[4]))
    (tmp / "remotion.config.ts").write_text("changed config", encoding="utf-8")
    checks.append(("final: source/render configuration mutation invalidates",
                   not render_video.render_contract(plan_path, "final", final)[4]))
    try:
        render_video.render_contract(plan_path, "final", final, scale=0.5)
        final_scale_blocked = False
    except ValueError:
        final_scale_blocked = True
    checks.append(("final: full-resolution scale cannot be lowered", final_scale_blocked))

    # Incremental gate: cache both success/failure execution result, never hide hard.
    gate_plan = copy.deepcopy(synthetic_plan)
    calls = {"n": 0}; original_run = hook.run
    def fake_run(_script, *_args):
        calls["n"] += 1
        return 1, "FAIL synthetic integrity failure"
    hook.run = fake_run
    try:
        code1, out1, hit1, _ = hook.run_incremental(tmp, plan_path, gate_plan,
                                                    "plan_gate.py", [str(plan_path), "--hook"])
        code2, out2, hit2, _ = hook.run_incremental(tmp, plan_path, gate_plan,
                                                    "plan_gate.py", [str(plan_path), "--hook"])
        unrelated = tmp / "unrelated.txt"; unrelated.write_text("changed", encoding="utf-8")
        code3, out3, hit3, _ = hook.run_incremental(tmp, plan_path, gate_plan,
                                                    "plan_gate.py", [str(plan_path), "--hook"])
        unrelated_plan = {**gate_plan, "qualityNote": "unrelated metadata"}
        plan_path.write_text(json.dumps(unrelated_plan), encoding="utf-8")
        code4, out4, hit4, _ = hook.run_incremental(tmp, plan_path,
                                                    unrelated_plan,
                                                    "plan_gate.py", [str(plan_path), "--hook"])
        true_change = copy.deepcopy(gate_plan)
        true_change["scenes"][0]["visualTransformation"] = "true gate dependency changed"
        plan_path.write_text(json.dumps(true_change), encoding="utf-8")
        code5, out5, hit5, _ = hook.run_incremental(tmp, plan_path, true_change,
                                                    "plan_gate.py", [str(plan_path), "--hook"])
    finally:
        hook.run = original_run
        plan_path.write_text(json.dumps(synthetic_plan), encoding="utf-8")
    checks.append(("incremental gate: unchanged and unrelated changes skip subprocess",
                   not hit1 and hit2 and hit3 and hit4 and calls["n"] == 2))
    checks.append(("incremental gate: true dependency reruns and cached hard remains explicit",
                   not hit5 and all(c == 1 for c in (code1,code2,code3,code4,code5)) and
                   all("FAIL synthetic" in x for x in (out1,out2,out3,out4,out5))))

    manifest_path, _ = asset_manifest.sync(plan_path)
    asset_manifest.accept(plan_path, "S1:Doc")
    _, unchanged_manifest = asset_manifest.sync(plan_path)
    checks.append(("asset manifest: accepted item survives unchanged sync",
                   unchanged_manifest["assets"]["S1:Doc"]["acceptance"] == "ACCEPTED"))
    asset_manifest.accept(plan_path, "S2:Ordinary", advisory="usable crop advisory")
    _, advisory_manifest = asset_manifest.sync(plan_path)
    checks.append(("asset manifest: advisory acceptance survives without regeneration",
                   advisory_manifest["assets"]["S2:Ordinary"]["acceptance"] == "ACCEPTED_WITH_ADVISORY"))
    item = advisory_manifest["assets"]["S1:Doc"]
    state.update_manifest(manifest_path, "V99", "S1:Doc",
                          {"mechanicalQA": "HARD_UNUSABLE"}, item["identity"])
    _, hard_manifest = asset_manifest.sync(plan_path)
    checks.append(("asset manifest: hard-unusable state stays blocking",
                   hard_manifest["assets"]["S1:Doc"]["mechanicalQA"] == "HARD_UNUSABLE"))
    asset_manifest.accept(plan_path, "S2:Ordinary", replacement_for="S1:Doc")
    lineage = state.read_json(manifest_path, {})["assets"]
    checks.append(("asset manifest: replacement lineage points to accepted new file",
                   lineage["S1:Doc"]["acceptedReplacement"] == "S2:Ordinary" and
                   lineage["S2:Ordinary"]["replacementFor"] == "S1:Doc"))
    asset_b.write_bytes(b"image-b-mutated")
    _, mutated_manifest = asset_manifest.sync(plan_path)
    checks.append(("asset manifest: same filename changed bytes invalidates acceptance",
                   mutated_manifest["assets"]["S2:Ordinary"]["acceptance"] == "PENDING"))

    compact = state.compact_result("CLOSED", hard=0, advisory=1, details="details.json",
                                   receipt="abc")
    hard_compact = state.compact_result("HARD", hard=2, questions=["first", "second"],
                                        details="failure.txt")
    checks.append(("compact output: success stays bounded and hard issues remain explicit",
                   len(compact.splitlines()) <= 7 and "HARD: 2" in hard_compact and
                   "first; second" in hard_compact and "failure.txt" in hard_compact))
    ledger = state.append_telemetry(tmp, "V99", {"stage": "noop", "owner": "script",
                                    "elapsedMs": 1.2, "cache": "hit", "subprocessCount": 0,
                                    "reasoning": "must not be stored"})
    record = json.loads(ledger.read_text(encoding="utf-8").splitlines()[-1])
    checks.append(("telemetry: timing/cache/subprocess recorded; main tokens UNKNOWN; no reasoning",
                   record["elapsedMs"] == 1.2 and record["cache"] == "hit" and
                   record["subprocessCount"] == 0 and record["mainTokens"] == "UNKNOWN" and
                   "reasoning" not in record))

    beat = _load_script("beat_sync.py")
    words = [["exact", 1.5, 1.7, 0], ["evidence", 1.7, 2.0, 0]]
    plan = {"fps": 30, "scenes": [{"id": "S1", "startSec": 1.0, "endSec": 3.0,
             "assets": [{"role": "document", "name": "Doc", "evidenceRegions": [
                 {"anchorPhrase": "exact evidence", "region": [0.1, 0.2, 0.7, 0.1]}]}]}]}
    resolved = beat.resolve_evidence_regions(plan, words)
    checks.append(("document evidence phrase timing reuses aligned words",
                   resolved[0]["regions"][0]["from"] == 15))
    legacy = copy.deepcopy(plan)
    legacy["scenes"][0]["assets"][0].pop("evidenceRegions")
    checks.append(("legacy document without evidenceRegions remains valid",
                   beat.resolve_evidence_regions(legacy, words) == []))

    plan_gate = _load_script("plan_gate.py")
    report = plan_gate.Report()
    plan_gate.gate_anchors(plan["scenes"], words, report)
    checks.append(("valid normalized evidenceRegions parse mechanically", not report.failures))
    invalid = copy.deepcopy(plan)
    invalid["scenes"][0]["assets"][0]["evidenceRegions"][0]["region"] = [0.8, 0.2, 0.4, 0.1]
    report = plan_gate.Report()
    plan_gate.gate_anchors(invalid["scenes"], words, report)
    checks.append(("out-of-source evidenceRegions are rejected", bool(report.failures)))

    # Review lifecycle integration: generation A -> editorial verdicts -> one
    # changed scene/sample -> generation B --keep-review -> real review gate.
    lifecycle_plan = copy.deepcopy(third_plan)
    lifecycle_plan["scenes"][1]["status"] = "built"
    lifecycle_path = tmp / "input" / "scene_plan99.json"
    lifecycle_path.write_text(json.dumps(lifecycle_plan), encoding="utf-8")
    review_path = tmp / "input" / "review99.json"
    frames_dir = tmp / "input" / "review_frames_v99"
    manifest_path = frames_dir / "sample_manifest.json"
    temporal = frames_dir / "contact_sheet.jpg"
    summary = frames_dir / "scene_summary_sheet.jpg"
    targeted_path = frames_dir / "targeted_full_res_manifest.json"
    params = {"mode": "draft", "composition": "V99Master", "scale": 0.5,
              "fps": 30, "codec": "h264"}

    def materialize_generation(plan_value, keep=False):
        manifest_value = review_tool.sample_manifest(plan_value, frames_dir, 2)
        review_tool.stale_samples(tmp, "V99", lifecycle_path, plan_value,
                                  manifest_value, params)
        for sample in manifest_value["samples"]:
            pathlib.Path(sample["path"]).parent.mkdir(parents=True, exist_ok=True)
            from PIL import Image
            Image.new("RGB", (270, 480), (40, 70, 90)).save(sample["path"])
        temporal.parent.mkdir(parents=True, exist_ok=True)
        from PIL import Image
        Image.new("RGB", (20, 20), (20, 20, 20)).save(temporal)
        Image.new("RGB", (20, 20), (30, 30, 30)).save(summary)
        state.write_json(targeted_path, {"requests": manifest_value["targetedFullResolution"]})
        review_value = review_tool.complete_review_generation(
            manifest_value, manifest_path, review_path, temporal, summary, targeted_path,
            params, {"sha256": "synthetic-draft"}, keep)
        return manifest_value, review_value

    manifest_a, review_a = materialize_generation(lifecycle_plan)
    for entry in review_a["scenes"]:
        entry.update({"illustrated": "pass", "composed": "pass", "varied": "pass",
                      "purposeful": "pass", "note": "generation A judgement",
                      "resolved": False})
    state.write_json(review_path, review_a)
    obsolete = next(item["id"] for item in manifest_a["samples"] if item["scene"] == "S1")
    changed_plan = copy.deepcopy(lifecycle_plan)
    changed_plan["scenes"][0]["visualEvents"] = [{"frame": 3, "what": "changed sample"}]
    lifecycle_path.write_text(json.dumps(changed_plan), encoding="utf-8")
    scene_one.write_text('import {kit} from "./V99Kit"; export const scene=kit+"changed";',
                         encoding="utf-8")
    manifest_b, review_b = materialize_generation(changed_plan, keep=True)
    by_id = {entry["id"]: entry for entry in review_b["scenes"]}
    current_ids = {item["id"] for item in manifest_b["samples"]}
    checks.append(("review lifecycle: unchanged scene gets current evidence and retains judgement",
                   by_id["S3"]["illustrated"] == "pass" and
                   by_id["S3"]["evidence"] == [x for x in manifest_b["samples"]
                                                if x["scene"] == "S3"]))
    checks.append(("review lifecycle: changed scene judgement clears and obsolete sample disappears",
                   by_id["S1"]["illustrated"] == "" and obsolete not in current_ids and
                   obsolete not in json.dumps(review_b)))
    checks.append(("review lifecycle: manifest/review generation is coherent",
                   manifest_b["reviewGeneration"] == review_b["reviewGeneration"]))
    # Generation B is coherent but every entry whose actual-master source
    # identity changed (the scene and transition-neighbor) requires fresh judgement.
    for entry in review_b["scenes"]:
        if not entry["illustrated"]:
            entry.update({"illustrated": "pass", "composed": "pass", "varied": "pass",
                          "purposeful": "pass", "note": "fresh generation B judgement",
                          "resolved": False})
    state.write_json(review_path, review_b)
    gate_code, gate_out = run_gate("review_gate.py", [str(lifecycle_path), "--no-measure"], tmp)
    checks.append(("review lifecycle: real review_gate accepts coherent generation B",
                   gate_code == 0))
    stale_review = copy.deepcopy(review_b); stale_review["reviewGeneration"] = "stale-generation"
    state.write_json(review_path, stale_review)
    stale_code, stale_out = run_gate("review_gate.py", [str(lifecycle_path), "--no-measure"], tmp)
    checks.append(("review lifecycle: real review_gate rejects stale generation",
                   stale_code != 0 and "reviewGeneration" in stale_out))
    state.write_json(review_path, review_b)

    # Durable sheet aggregate cache with a mocked model call: 3, 0, 3.
    sheet_file = frames_dir / "sheet-cache.jpg"
    from PIL import Image
    Image.new("RGB", (30, 30), (1, 2, 3)).save(sheet_file)
    model_calls = {"n": 0}
    def fake_sheet_check(_path, _model):
        model_calls["n"] += 1
        return {"repetitive": False, "groups": [], "note": "mock", "_tokens": 1}
    first_result, first_hit, _ = sheet_vision.cached_aggregate(
        sheet_file, 3, "mock-model", sheet_vision.RUNS, fake_sheet_check)
    first_calls = model_calls["n"]
    _, second_hit, _ = sheet_vision.cached_aggregate(
        sheet_file, 3, "mock-model", sheet_vision.RUNS, fake_sheet_check)
    second_calls = model_calls["n"] - first_calls
    Image.new("RGB", (30, 30), (4, 5, 6)).save(sheet_file)
    _, third_hit, _ = sheet_vision.cached_aggregate(
        sheet_file, 3, "mock-model", sheet_vision.RUNS, fake_sheet_check)
    third_calls = model_calls["n"] - first_calls - second_calls
    checks.append(("sheet vision cache: mocked model calls are configured-runs, zero, configured-runs",
                   first_calls == sheet_vision.RUNS and second_calls == 0 and
                   third_calls == sheet_vision.RUNS and not first_hit and second_hit and not third_hit))

    # Unreliable aggregates are cacheable too: unchanged pixels make zero model
    # calls and retain the same explicit machine advisory.
    unreliable_sheet = frames_dir / "sheet-unreliable-cache.jpg"
    Image.new("RGB", (30, 30), (8, 9, 10)).save(unreliable_sheet)
    unreliable_calls = {"n": 0}
    def fake_invalid_sheet(_path, _model):
        unreliable_calls["n"] += 1
        return {"_error": "mock invalid aggregate"}
    unreliable_first, unreliable_first_hit, _ = sheet_vision.cached_aggregate(
        unreliable_sheet, 3, "mock-unreliable", sheet_vision.RUNS, fake_invalid_sheet)
    calls_after_unreliable_first = unreliable_calls["n"]
    unreliable_second, unreliable_second_hit, _ = sheet_vision.cached_aggregate(
        unreliable_sheet, 3, "mock-unreliable", sheet_vision.RUNS, fake_invalid_sheet)
    calls_after_unreliable_second = unreliable_calls["n"] - calls_after_unreliable_first
    checks.append(("sheet unreliable cache: unchanged aggregate makes zero model calls and keeps advisory",
                   unreliable_first is None and unreliable_second is None and
                   calls_after_unreliable_first == sheet_vision.RUNS and
                   calls_after_unreliable_second == 0 and not unreliable_first_hit and
                   unreliable_second_hit and
                   sheet_vision.status_result(unreliable_first)["code"] ==
                   sheet_vision.status_result(unreliable_second, True)["code"] ==
                   "sheet-vision-unreliable"))

    # review_vision consumes only structured sheet status. All subprocesses are
    # mocked; the receipt must distinguish clean, repetitive, and unreliable.
    class MockVisionProcess:
        def __init__(self, returncode=0, stdout="", stderr=""):
            self.returncode = returncode
            self.stdout = stdout
            self.stderr = stderr

    def review_receipt_for(sheet_status):
        calls = []
        old_run, old_argv = review_vision.subprocess.run, sys.argv
        rv_path = review_vision.receipt_path(tmp, changed_plan.get("video", "V"))
        rv_path.unlink(missing_ok=True)
        def fake_review_run(command, **_kwargs):
            script = pathlib.Path(command[1]).name
            calls.append(script)
            if script == "sheet_vision.py":
                return MockVisionProcess(stdout=json.dumps(sheet_status))
            return MockVisionProcess()
        review_vision.subprocess.run = fake_review_run
        sys.argv = ["review_vision.py", str(lifecycle_path)]
        try:
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                code = review_vision.main()
        finally:
            review_vision.subprocess.run, sys.argv = old_run, old_argv
        return code, state.read_json(rv_path, {}), calls

    clean_code, clean_receipt, clean_calls = review_receipt_for({"status": "CLOSED",
                                                                 "cacheHit": False})
    repetitive_code, repetitive_receipt, repetitive_calls = review_receipt_for(
        {"status": "ADVISORY", "code": "sheet-vision-repetitive",
         "reason": "cross-scene sheet vision found likely visual repetition", "cacheHit": False})
    unreliable_code, unreliable_receipt, unreliable_review_calls = review_receipt_for(
        {"status": "ADVISORY", "code": "sheet-vision-unreliable",
         "reason": "cross-scene sheet vision unavailable/unreliable", "cacheHit": True})
    clean_advisories = (clean_receipt.get("metadata") or {}).get("advisories") or []
    repetitive_advisories = (repetitive_receipt.get("metadata") or {}).get("advisories") or []
    unreliable_advisories = (unreliable_receipt.get("metadata") or {}).get("advisories") or []
    checks.append(("review vision: valid clean sheet closes without reliability advisory",
                   clean_code == 0 and clean_receipt.get("status") == "CLOSED" and
                   not clean_advisories and clean_calls.count("sheet_vision.py") == 1))
    checks.append(("review vision: repetitive sheet quality advisory is preserved",
                   repetitive_code == 0 and repetitive_receipt.get("status") == "CLOSED" and
                   any(item.get("code") == "sheet-vision-repetitive"
                       for item in repetitive_advisories) and
                   repetitive_calls.count("sheet_vision.py") == 1))
    checks.append(("review vision: unreliable sheet advisory is explicit and non-hard",
                   unreliable_code == 0 and unreliable_receipt.get("status") == "CLOSED" and
                   any(item.get("code") == "sheet-vision-unreliable" and
                       item.get("reason") == "cross-scene sheet vision unavailable/unreliable"
                       for item in unreliable_advisories) and
                   unreliable_review_calls.count("sheet_vision.py") == 1))

    # Stop checks review-vision current/stale state but never launches any of
    # the three model-capable scripts. Deterministic checks remain represented.
    deterministic_calls, model_subprocesses = [], []
    old_inc, old_selftest, old_current = (hook.run_incremental, hook.selftest_is_current,
                                          hook.review_vision.is_current)
    def fake_incremental(_root, _pp, _plan, script_name, _args):
        deterministic_calls.append(script_name)
        if script_name in ("asset_vision.py", "vision_check.py", "sheet_vision.py"):
            model_subprocesses.append(script_name)
        return 0, "OK synthetic", True, None
    hook.run_incremental = fake_incremental
    hook.selftest_is_current = lambda: (True, "current")
    stop_plan = copy.deepcopy(changed_plan)
    for scene in stop_plan["scenes"]:
        scene["status"] = "built"
    try:
        current_err, stale_err = io.StringIO(), io.StringIO()
        hook.review_vision.is_current = lambda *_: (True, {})
        with contextlib.redirect_stderr(current_err):
            stop_current = hook.stop(tmp, (lifecycle_path, stop_plan))
        hook.review_vision.is_current = lambda *_: (False, {})
        with contextlib.redirect_stderr(stale_err):
            stop_stale = hook.stop(tmp, (lifecycle_path, stop_plan))
        def hard_incremental(_root, _pp, _plan, script_name, _args):
            deterministic_calls.append(script_name)
            return ((1, "FAIL cached synthetic HARD", True, "cached-hard.txt")
                    if script_name == "plan_gate.py" else (0, "OK synthetic", True, None))
        hook.run_incremental = hard_incremental
        hard_err = io.StringIO()
        with contextlib.redirect_stderr(hard_err):
            stop_hard = hook.stop(tmp, (lifecycle_path, stop_plan))
    finally:
        hook.run_incremental, hook.selftest_is_current = old_inc, old_selftest
        hook.review_vision.is_current = old_current
    checks.append(("Stop hook: current/stale review vision causes zero model/network subprocesses",
                   stop_current == 0 and stop_stale == 0 and not model_subprocesses and
                   "explicit review vision remains" in stale_err.getvalue()))
    checks.append(("Stop hook: deterministic gate receipt/cache checks still execute",
                   "plan_gate.py" in deterministic_calls and "build_gate.py" in deterministic_calls))
    checks.append(("Stop hook: cached HARD remains explicit and blocking",
                   stop_hard == 2 and "cached synthetic HARD" in hard_err.getvalue()))

    handoff = pipeline.build_handoff(lifecycle_path, "REVIEW", "CORRECTION",
                                     hard=["S1 source mismatch"],
                                     advisories=["S3 composition debt"], changed_scenes=["S1"])
    handoff_text = json.dumps(handoff)
    checks.append(("context handoff: compact required paths/stage/issues/review generation",
                   len(handoff_text) < 5000 and handoff["authoritativePlan"] == str(lifecycle_path.resolve())
                   and handoff["nextRequestedStage"] == "CORRECTION"
                   and handoff["changedSceneIds"] == ["S1"]
                   and handoff["reviewGeneration"] == review_b["reviewGeneration"]))
    checks.append(("context handoff: excludes logs/history/full unrelated scene payloads",
                   all(word not in handoff_text.lower() for word in
                       ("priorconversation", "promptpack", "historical lessons", "asset-b.png"))))

    geometry_script = tmp / "geometry-test.mjs"
    geometry_module = (ROOT / "src" / "scenes" / "documentEvidenceGeometry.mjs").as_uri()
    geometry_script.write_text(
        f'import {{fitDocumentEvidence as fit}} from {json.dumps(geometry_module)};\n'
        'const cases=[{x:.2,y:.2,width:.5,height:.3},{x:0,y:.2,width:.35,height:.3},'
        '{x:.65,y:.2,width:.35,height:.3},{x:.3,y:0,width:.3,height:1},'
        '{x:0,y:.4,width:1,height:.15}];\n'
        'cases.push({x:.04,y:.2,width:.92,height:.58});\n'
        'const ok=cases.every((region,index)=>{const g=fit({viewportWidth:index===5?1000:960,'
        'viewportHeight:index===5?650:1120,sourceAspect:index===5?2118/966:.707,region,'
        'requestedZoom:index===5?1.72:2.4,safetyMargin:18,allowCrop:index===5});return '
        'g.focusLeft>=18-1e-6&&g.focusTop>=18-1e-6&&'
        'g.focusLeft+g.focusWidth<=(index===5?982:942)+1e-6&&'
        'g.focusTop+g.focusHeight<=(index===5?632:1102)+1e-6;});process.exit(ok?0:1);', encoding="utf-8")
    geometry_proc = subprocess.run(["node", str(geometry_script)], capture_output=True, text=True)
    checks.append(("DocumentEvidence geometry: edge/tall/wide and exact V17 S4 allowCrop stay inside margin",
                   geometry_proc.returncode == 0))

    assemble = _load_script("assemble.py")
    base = {"scenes": [{"id": "S1"}, {"id": "S2"}]}
    parts = assemble.scene_parts(base, "99")
    generated = assemble.master_jsx({"audioFile": "a.mp3"}, "99", "99", parts)
    checks.append(("omitted transition defaults to cut", "presentation={fade()}" not in generated))
    base["scenes"][1]["transitionIn"] = "fade"
    parts = assemble.scene_parts(base, "99")
    generated = assemble.master_jsx({"audioFile": "a.mp3"}, "99", "99", parts)
    checks.append(("explicit semantic fade path remains available",
                   generated.count("presentation={fade()}") == 1))

    from PIL import Image
    frame_dir = tmp / "input" / "review_frames_custom"
    frame_dir.mkdir(parents=True)
    entries = []
    for i in range(3):
        frame = frame_dir / f"scene{i}.png"
        Image.new("RGB", (20, 30), (i * 30, 20, 20)).save(frame)
        entries.append({"id": f"S{i + 1}", "frame": str(frame),
                        "frames": [str(frame), str(frame)]})
    review_sheet = _load_script("render_review_sheet.py")
    thumbs = review_sheet.scene_summary_thumbs(entries)
    count = review_sheet.build_sheet(thumbs, tmp / "summary.jpg")
    checks.append(("scene-summary view contains exactly one frame per scene",
                   count == len(entries) == len(thumbs)))

    sheet = _load_script("sheet_vision.py")
    checks.append(("sheet impossible-count validation remains active",
                   sheet.valid_run({"groups": [{"looks_like": "x", "count": 4}]}, 3) is None))

    vision = _load_script("vision_check.py")
    plan_path = tmp / "input" / "scene_plan99.json"
    plan_path.write_text(json.dumps({"video": "V99", "scenes": []}), encoding="utf-8")
    review_path = tmp / "input" / "review99.json"
    review_path.write_text(json.dumps({"scenes": [
        {"id": "S1", "frame": "input/review_frames_custom/scene0.png",
         "frames": ["input/review_frames_custom/scene1.png"]},
        {"id": "S2", "frame": "input/review_frames_custom/scene2.png"},
    ]}), encoding="utf-8")
    discovered = vision.collect([], str(plan_path))
    checks.append(("vision_check follows review frames and frame-only fallback",
                   [pathlib.Path(path).name for path in discovered] == ["scene1.png", "scene2.png"]))
    visual_language = (ROOT / "src" / "scenes" / "visualLanguage.jsx").read_text(encoding="utf-8")
    checks.append(("new BackgroundPhoto camera is stable by default", "drift = 0," in visual_language))
    hook_source = (SCRIPTS / "hook_gate.py").read_text(encoding="utf-8")
    explicit_source = (SCRIPTS / "review_vision.py").read_text(encoding="utf-8")
    checks.append(("sheet_vision is routed explicitly with scene count, never from Stop",
                   'review.get("sceneSummarySheet")' in explicit_source and
                   '"--scenes"' in explicit_source and
                   'run("sheet_vision.py"' not in hook_source))
    return checks


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
    """A plan-time medium repeat is advisory; rendered repetition is sheet_vision's job."""
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
    """Passes structural plan fields but drops actual narration coverage."""
    plan["video"] = "VTEST"
    for i, s in enumerate(plan["scenes"]):
        if i % 3 == 2:
            continue
        for asset in s.get("assets", []):
            asset["describes"] = []
        if isinstance(s.get("punch"), dict):
            s["punch"]["describes"] = []
    return plan


def photo_led_zero_code(plan):
    """A valid plan implemented entirely with sourced/photo assets."""
    plan["video"] = "VPHOTO"
    for s in plan["scenes"]:
        for asset in s.get("assets", []):
            asset["src"] = asset.get("src") or "photo-led-reference.jpg"
            if asset.get("role") in {"diagram", "map", "timeline", "chart"}:
                asset["role"] = "background"
        langs = s.get("visualLanguage")
        if isinstance(langs, list):
            s["visualLanguage"] = ["background-photo" if v in
                                   {"diagram", "map", "timeline", "flow", "data"} else v
                                   for v in langs]
        elif langs in {"diagram", "map", "timeline", "flow", "data"}:
            s["visualLanguage"] = "background-photo"
    return plan


def no_template_declarations(plan):
    """Bespoke is the undeclared default; no template/block field is required."""
    for s in plan["scenes"]:
        s.pop("template", None)
        s.pop("block", None)
        s.pop("bespoke", None)
        s.pop("bespokeReason", None)
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


def insert_unregistered_icon(tmp):
    """Render an Icon* component that is absent from VOX_ICONS."""
    path = tmp / "src" / "scenes" / "V10Scene1.jsx"
    src = path.read_text(encoding="utf-8")
    needle = "<AbsoluteFill"
    if needle not in src:
        raise AssertionError("V10Scene1 has no AbsoluteFill insertion point")
    path.write_text(src.replace(needle, "<IconBrokenReference />\n    " + needle, 1),
                    encoding="utf-8")


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


def copy_src_file(*names):
    """sandbox_hook: chép thêm file src/ mà assemble.py cần so sánh."""
    def hook(tmp):
        (tmp / "src").mkdir(exist_ok=True)
        for name in names:
            shutil.copy2(ROOT / "src" / name, tmp / "src" / name)
    return hook


def unpad_explicit_fade_rail(tmp):
    """Request one real fade, then remove its preceding rail padding."""
    plan_path = tmp / "input" / "scene_plan10.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    plan["scenes"][1]["transitionIn"] = "fade"
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    subprocess.run([sys.executable, str(SCRIPTS / "assemble.py"),
                    str(plan_path), "--only", "master"],
                   cwd=str(tmp), capture_output=True)
    f = tmp / "src" / "V10Master.jsx"
    s = f.read_text(encoding="utf-8")
    s = s.replace("(V10SCENE1_DURATION + T)", "V10SCENE1_DURATION", 1)
    s = s.replace("durationInFrames={V10SCENE1_DURATION + T}",
                  "durationInFrames={V10SCENE1_DURATION}", 1)
    f.write_text(s, encoding="utf-8")


def fake_handwritten_master(tmp):
    (tmp / "src").mkdir(exist_ok=True)
    (tmp / "src" / "V10Master.jsx").write_text("// ban viet tay\n", encoding="utf-8")


def vague_transformation(plan):
    """Ô nào cũng đầy chữ, nhưng không quyết định điều gì."""
    plan["scenes"][3]["visualTransformation"] = (
        "một hình ảnh phù hợp với nội dung, trực quan và sinh động")
    return plan


def stub_transformation(plan):
    plan["scenes"][5]["visualTransformation"] = "ảnh hiện ra"
    return plan


def copy_input_file(*names):
    """sandbox_hook: chép thêm file input/ mà một gate cần đọc."""
    def hook(tmp):
        for name in names:
            src = ROOT / "input" / name
            if src.exists():
                shutil.copy2(src, tmp / "input" / name)
    return hook


def activate_unapproved(plan):
    """Plan đang dựng nhưng shot list chưa được user duyệt."""
    plan["status"] = "active"
    plan["shotlistApproved"] = False
    return plan


def activate_approved(plan):
    plan["status"] = "active"
    plan["shotlistApproved"] = True
    return plan


def post_edit_payload(plan_path):
    """Payload PostToolUse y như harness gửi: vừa ghi một file cảnh của V10.

    Dùng S1 chứ không phải S5: ca "đã duyệt thì không chặn oan" cần một cảnh
    sạch cả build/text/icon per-scene để đi hết đường post_edit; S5 mang nợ
    text_gate từ trước khi luật <=4 từ ra đời (đã ghi trong lessons.md)."""
    tmp = plan_path.parent.parent
    return json.dumps({"cwd": str(tmp), "tool_input": {
        "file_path": str(tmp / "src" / "scenes" / "V10Scene1.jsx")}})


def pre_read_payload(plan_path):
    """Payload PreToolUse y nhu harness gui khi agent sap MO MOT BUC ANH."""
    tmp = plan_path.parent.parent
    return json.dumps({"cwd": str(tmp), "tool_name": "Read", "tool_input": {
        "file_path": str(tmp / "input" / "review_frames" / "V10Scene1_f41.png")}})


def _seed_image_budget(count):
    """sandbox_hook: dat san so anh agent DA mo, de kiem nguong chan.

    Ngan sach = so canh + 8. V10 co 26 canh -> 34, chan o 68. Nen 200 la qua
    han ro rang, va 3 la chac chan duoi han.
    """
    def hook(tmp):
        import json as _json
        d = tmp / ".claude" / "skills" / "vox-collage-video" / "data"
        d.mkdir(parents=True, exist_ok=True)
        (d / ".image_budget.json").write_text(
            _json.dumps({"video": "V10", "count": count}), encoding="utf-8")
    return hook


def wordy_label(_plan):
    """A drawn sentence instead of a label - handled by mutating the SCENE file,
    not the plan, because that is where drawn text lives."""
    return _plan


# --------------------------------------------------------------------------
# asset_gate - does the sourced image fit the box the plan puts it in?
# --------------------------------------------------------------------------
# V10 shipped with three assets already over the upscale ceiling: S9
# Sup-CrowdBehind 1.23x, S13 Doc-Trace 1.68x, S25 Sup-Gate 1.22x - and the
# last of those is the one the viewer reported as broken by eye, before any
# of this was measured. Every asset_gate case therefore repairs those three
# first: otherwise the gate exits non-zero over defects the case did not
# create, and a green case would prove nothing at all.
_ASSET_REPAIRS = {"Sup-CrowdBehind": 640, "Doc-Trace": 480, "Sup-Gate": 560}

# asset_gate reads real PNGs out of public/, which the sandbox does not copy.
_asset_args = lambda p: [str(p), "--root", str(ROOT)]


def _repair_shipped_upscales(plan):
    for s in plan["scenes"]:
        for a in s.get("assets", []):
            if a.get("name") in _ASSET_REPAIRS:
                a["width"] = _ASSET_REPAIRS[a["name"]]
    return plan


def _find_asset(plan, name):
    for s in plan["scenes"]:
        for a in s.get("assets", []):
            if a.get("name") == name:
                return a
    raise AssertionError(f"asset {name} khong co trong plan tham chieu")


def asset_upscaled(plan):
    """Anh bi keo rong hon so diem anh cua chinh no - dung loi V10/S25."""
    _repair_shipped_upscales(plan)
    _find_asset(plan, "Hero-Youth")["width"] = 2000     # noi dung chi 1194px
    return plan


def asset_wrong_slot_shape(plan):
    """Slot doi anh dung, file la anh ngang."""
    _repair_shipped_upscales(plan)
    _find_asset(plan, "Hero-Youth")["slot"] = {"aspect": "3:4"}
    return plan


def asset_slot_without_fit_stamp(plan):
    """Ti le dung nhung tinh co: file chua tung di qua process_cutout --fit.

    Ca nay ton tai vi kiem ti le KHONG DU. Mot file ngau nhien dung ti le se
    lech ngay lan cat lai sau, va khi do khong ai biet vi sao - nen gate phai
    doi ca dau --fit, khong chi doi con so."""
    from PIL import Image      # cuc bo, dung kieu voi _fake_cutout o tren
    _repair_shipped_upscales(plan)
    a = _find_asset(plan, "Hero-Youth")
    with Image.open(ROOT / "public" / a["src"]) as im:
        w, h = im.size
    a["slot"] = {"aspect": f"{w}:{h}"}                  # dung y het ti le file
    return plan


def asset_all_clean(plan):
    return _repair_shipped_upscales(plan)


# --------------------------------------------------------------------------
# block_gate - tang chan don dieu cua kho block
# --------------------------------------------------------------------------
# V10 that khong khai `block` o canh nao (kho block ra doi sau no), nen moi ca
# o day phai TU chu thich V10 truoc: anh xa 14/26 canh vao 5 block dung nhu ban
# do da doi chung bang render, so con lai danh dau bespoke. Ban chu thich do
# PASS voi 0 fail - do la ca "phai PASS" o duoi.
_BLOCK_MAP = {
    "S1": ("PhotoClaim", "middle"), "S3": ("PhotoClaim", "top"),
    "S6": ("PhotoClaim", "bottom"), "S21": ("PhotoClaim", "top"),
    "S26": ("PhotoClaim", "middle"), "S22": ("PhotoClaim", "top"),
    "S2": ("MapPlace", "top"), "S12": ("MapPlace", "top"),
    "S16": ("MapPlace", "bottom"), "S8": ("TimelineSpan", "paper"),
    "S25": ("TimelineSpan", "photo"), "S13": ("DocFocus", "bottom"),
    "S23": ("DocFocus", "top"), "S14": ("ChannelOutro", None),
}

# block_gate doc registry tu src/blocks/, ma sandbox co copy src/ sang - nhung
# chi src/scenes/. Tro thang vao registry that cho chac.
_block_args = lambda p: [str(p), "--registry", str(ROOT / "src" / "blocks" / "registry.json")]


def _annotate_blocks(plan):
    for s in plan["scenes"]:
        m = _BLOCK_MAP.get(s["id"])
        if m:
            s["block"] = m[0]
            if m[1]:
                s["arrangement"] = m[1]
        else:
            s["bespoke"] = True
            s["bespokeReason"] = "chua co block nao phu cau truc nay"
    return plan


def blocks_annotated(plan):
    return _annotate_blocks(plan)


def block_overused(plan):
    """Mot block keo ca video - dung khuyet tat da giet SceneTemplates.jsx."""
    _annotate_blocks(plan)
    for s in plan["scenes"]:
        if s["id"] in ("S4", "S5", "S7", "S9"):
            s.pop("bespoke", None); s.pop("bespokeReason", None)
            s["block"] = "PhotoClaim"; s["arrangement"] = "middle"
    return plan


def block_one_arrangement(plan):
    """Dung 6 lan nhung deu o mot the: van duoi tran ty le, van doc ra la lap."""
    _annotate_blocks(plan)
    for s in plan["scenes"]:
        if s.get("block") == "PhotoClaim":
            s["arrangement"] = "top"
    return plan


def block_unknown(plan):
    _annotate_blocks(plan)
    for s in plan["scenes"]:
        if s["id"] == "S3":
            s["block"] = "SplitCompareScene"   # ten template the he cu
    return plan


def block_undeclared(plan):
    """Canh khong khai gi ca - PHAI duoc cho qua, vi khong khai = bespoke.

    Truoc day day la mot ca "phai FAIL". Da doi chieu vi huong luc dat sai:
    tren video chua tung thay kho block chi phu 25%, nen bat khai bien 3/4 so
    canh thanh thu tuc giay to. Nay `bespoke` la mac dinh im lang.
    """
    _annotate_blocks(plan)
    for s in plan["scenes"]:
        if s["id"] == "S4":
            s.pop("bespoke", None); s.pop("bespokeReason", None)
    return plan


def block_punch_too_short_no_block(plan):
    """Nhip doc phai duoc kiem KE CA khi canh khong dung block nao.

    Ca nay khoa dung cho de vo khi go yeu cau khai block: phep kiem punch von
    nam ben trong nhanh "canh co khai block", nen go yeu cau la vo tinh tat
    luon no. Do tren V10: 6/14 canh dat headline voi duoi 1,6 giay de doc.
    """
    for s in plan["scenes"]:
        s.pop("block", None); s.pop("bespoke", None); s.pop("bespokeReason", None)
    s = plan["scenes"][3]
    dur = s.get("durationInFrames") or 120
    s["durationInFrames"] = dur
    s["punch"] = dict(s.get("punch") or {}, **{"from": dur - 12})   # 0,4s
    return plan


def block_bespoke_no_reason(plan):
    _annotate_blocks(plan)
    for s in plan["scenes"]:
        if s["id"] == "S4":
            s["bespokeReason"] = ""
    return plan


CASES = [
    Case("plan_gate: cảnh không có minh hoạ nào", "plan_gate.py", drop_all_assets),
    Case("plan_gate: một medium khai lặp không tự động thành lỗi viewer",
         "plan_gate.py", one_language_everywhere, expect_fail=False,
         args=lambda p: [str(p), "--skip-lifetime"]),
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
    # The four rules added after a second viewing of V11 found four defects
    # that the gate above had passed. Each one exists because a human saw it
    # first; each case here is that human's report, frozen.
    Case("text_gate: chữ nhỏ đến mức không đọc nổi trên điện thoại", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", "fontSize: 44, fontWeight: 800",
                     "fontSize: 26, fontWeight: 800"),
         expect_message=["Minimum is 44px"]),
    Case("text_gate: nét vẽ chạy xuyên qua chữ", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", 'd="M 840 862 L 840 998"', 'd="M 300 812 L 800 812"'),
         expect_message=["runs through the label"]),
    # `struck` từng cho `break` NGAY khi thấy nhãn có cờ này - tức là bỏ qua
    # HOÀN TOÀN việc kiểm nét gạch, không đếm, không đo. V13/S2 gạch chữ
    # "SIÊU NHIÊN" bằng hai nét chéo bắt chéo thành X (mỗi chữ bị cắt hai lần
    # theo suốt chiều cao) và lọt sạch, vì gate chưa từng hỏi CÓ MẤY nét. Ba
    # cảnh đã ship dùng đúng MỘT nét (V11/S8,S9,S15) nên trần đặt ở 1, không
    # phải đoán.
    Case("text_gate: gạch chữ bằng hai nét chéo thành X thay vì một nét",
         "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", '<DrawnPath d="M 840 862 L 840 998"',
                     '<DrawnText delay={10} x={100} y={500} struck '
                     'style={{fontSize: 44}}>TEST LABEL</DrawnText>'
                     '<DrawnPath d="M 80 495 L 400 495" delay={20} drawFrames={5} '
                     'strokeWidth={6}/>'
                     '<DrawnPath d="M 80 505 L 400 505" delay={20} drawFrames={5} '
                     'strokeWidth={6}/>'
                     '<DrawnPath d="M 840 862 L 840 998"'),
         expect_message=["struck by 2 separate strokes", "cap 1"]),
    # Người xem đầu tiên nhìn V12/S1 là thấy ngay: vòng khoanh nét đứt cắt
    # ngang chip "KHU TẠM CƯ" của chính bản đồ. SÁU gate cho qua, vì chữ đó
    # không phải PunchPhrase cũng không phải DrawnText - nó là DOM do
    # MapGraphic tự vẽ, nằm ngoài mọi danh sách chữ mà các gate biết.
    # DiagramCanvas ở V10Scene5 đặt y=280, nên nét vẽ local y=600 rơi vào
    # tuyệt đối y=880, đúng giữa chồng nhãn (343, 790, 736, 980).
    Case("text_gate: nét vẽ cắt ngang nhãn của chính bản đồ", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", '<DrawnPath d="M 840 862 L 840 998"',
                     '<MapPanel x={60} y={700} width={960} height={560} '
                     'label="KHU TẠM CƯ" />'
                     '<DrawnPath d="M 200 600 L 900 600"'),
         expect_message=["cuts through the map's own label stack"]),
    # Chữ do primitive tự vẽ ra từ prop của nó: cùng loại điểm mù với chip bản
    # đồ ở trên. Sàn 44px trước đây chỉ soi chữ gõ thẳng vào file cảnh, nên một
    # nhãn kích thước 30px do component vẽ thì lọt thẳng.
    Case("text_gate: chữ do component tự vẽ cũng phải qua sàn 44px", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", '<DrawnPath d="M 840 862 L 840 998"',
                     '<DimensionLine x1={200} y1={400} x2={800} y2={400} '
                     'label="HẸP DẦN" fontSize={30} />'
                     '<DrawnPath d="M 840 862 L 840 998"'),
         expect_message=["DimensionLine draws", "under the 44px floor"]),
    Case("text_gate: hai ký hiệu vẽ chồng lên nhau", "text_gate.py", None,
         scene_edit=("V10Scene5.jsx", '<DrawnPath d="M 840 862 L 840 998"',
                     '<IconCrowd x={540} y={300} size={220} delay={0} />'
                     '<IconRise x={560} y={320} size={220} delay={0} />'
                     '<DrawnPath d="M 840 862 L 840 998"'),
         expect_message=["overlap each other"]),
    Case("text_gate: primitive dùng chung tự chôn một cỡ chữ nhỏ", "text_gate.py", None,
         scene_edit=("visualLanguage.jsx",
                     "fontSize: LABEL_SIZE, fontWeight: 800 }}\n          opacity={appear}",
                     "fontSize: 30, fontWeight: 800 }}\n          opacity={appear}"),
         expect_message=["hardcoded fontSize 30"]),
    # Helper components were a hole big enough to hide whole scenes in: on V11
    # every label in four scenes went in as a prop, and the gate reported those
    # scenes clean because it had found nothing in them.
    Case("text_gate: chữ truyền qua prop của component phụ vẫn phải bị soi",
         "text_gate.py", None,
         scene_edit=("V10Scene5.jsx",
                     "export const V10Scene5 = () => (\n"
                     "  <AbsoluteFill name=\"V10Scene5\">\n"
                     "      <SceneBackground variant=\"chart\" />\n"
                     "      <DiagramCanvas y={280} height={1000}>",
                     "const Probe = ({ x, label, delay }) => (\n"
                     "  <DrawnText delay={delay} x={x} y={200} textAnchor=\"middle\" fill=\"#1A1A1A\"\n"
                     "        style={{ fontFamily: \"Be Vietnam Pro\", fontSize: 44, fontWeight: 800 }}>\n"
                     "    {label}\n"
                     "  </DrawnText>\n"
                     ");\n\n"
                     "export const V10Scene5 = () => (\n"
                     "  <AbsoluteFill name=\"V10Scene5\">\n"
                     "      <SceneBackground variant=\"chart\" />\n"
                     "      <DiagramCanvas y={280} height={1000}>\n"
                     "        <Probe x={540} label=\"mot cau dai khong the goi la nhan duoc nua\" delay={0} />"),
         expect_message=["mot cau dai"]),
    # Shipped for seven videos in SplitCompareScene: `fontFamily:
    # "BeVietnamPro"` is not a family any browser resolves, so those labels
    # rendered in a fallback sans while the gate measured them in Be Vietnam
    # Pro. Wrong font = wrong widths = the V11 bug class all over again.
    Case("text_gate: chữ khai một font mà bảng số đo không có", "text_gate.py", None,
         scene_edit=("V10Scene14.jsx", 'fontFamily: "Be Vietnam Pro", fontSize: 42',
                     'fontFamily: "BeVietnamPro", fontSize: 42'),
         expect_message=["is not 'Be Vietnam Pro'"]),
    Case("text_gate: câu punch mực đen nằm trên ảnh nền đã làm tối", "text_gate.py", None,
         scene_edit=("V10Scene19.jsx", '"NHIỀU QUỐC TỊCH"]} top={230} onDark',
                     '"NHIỀU QUỐC TỊCH"]} top={230}'),
         expect_message=["has no onDark"]),
    # "Chưa tới lúc" KHÁC "có lỗi". Bản đầu của hai gate mới thoát 1 khi chưa
    # có ảnh / chưa có khung hình, tức là hook Stop chặn cứng mọi video mới
    # ngay từ lượt đầu tiên - phát hiện bằng cách dựng thử một V12 giả lập.
    # Hai ca này khoá lại, và chúng phải PASS chứ không phải FAIL.
    Case("cutout_gate: video mới chưa có ảnh thì không được coi là lỗi",
         "cutout_gate.py", None, expect_fail=False,
         args=lambda p: [str(p.parent.parent / "public"), "--video", "99",
                         "--plan", str(p)]),
    Case("pixel_gate: video mới chưa có khung hình thì không được coi là lỗi",
         "pixel_gate.py", None, expect_fail=False,
         sandbox_hook=lambda tmp: (tmp / "input" / "review10.json").unlink(True)),
    # pixel_gate. Đây là gate duy nhất nhìn thứ người xem nhìn, nên hai ca này
    # là bằng chứng nó thật sự đọc pixel chứ không chỉ đọc lại mã nguồn.
    Case("pixel_gate: mã nguồn có chữ nhưng khung hình render trống trơn",
         "pixel_gate.py", None, sandbox_hook=_repaint_frames("blank"),
         expect_message=["mực ở đó"]),
    Case("pixel_gate: chữ có hiện nhưng chìm vào nền",
         "pixel_gate.py", None, sandbox_hook=_repaint_frames("lowcontrast"),
         expect_message=["chìm vào nền"]),
    # cutout_gate. Ca thứ hai là ca quan trọng nhất: một gate chỉ đếm pixel
    # xanh sẽ kết tội mọi vật vốn dĩ màu xanh. Luật thật là "xanh dồn ở mép mà
    # ruột không xanh", nên phải chứng minh cả chiều KHÔNG báo lỗi.
    Case("cutout_gate: viền còn ám màu phông xanh", "cutout_gate.py", None,
         sandbox_hook=cutout_case(spill=True)[0],
         args=cutout_case(spill=True)[1],
         expect_message=["viền còn ám màu phông"]),
    Case("cutout_gate: vật vốn dĩ màu xanh KHÔNG được coi là lỗi",
         "cutout_gate.py", None, expect_fail=False,
         sandbox_hook=cutout_case(all_green=True)[0],
         args=cutout_case(all_green=True)[1]),
    Case("cutout_gate: chủ thể bị cắt cụt ở mép ảnh", "cutout_gate.py", None,
         sandbox_hook=cutout_case(touch_border=True)[0],
         args=cutout_case(touch_border=True)[1],
         expect_message=["viền ảnh vẫn đặc"]),
    Case("cutout_gate: quầng khói quanh cutout", "cutout_gate.py", None,
         sandbox_hook=cutout_case(wide_feather=True)[0],
         args=cutout_case(wide_feather=True)[1],
         expect_message=["alpha lưng chừng"]),
    Case("plan_gate: nhồi quá nhiều nhịp vào một cảnh", "plan_gate.py", crammed_scene),
    Case("plan_gate: 4 cảnh dày liên tiếp, không có cảnh nghỉ nào",
         "plan_gate.py", dense_run_no_breath,
         expect_message=["scenes in a row carrying more than 2 beats"]),
    Case("plan_gate: khai density 'low' cho cảnh mang 3 nhịp",
         "plan_gate.py", calm_in_name_only,
         expect_message=["declared density \"low\" but carries 3 beats"]),
    # Icons are optional; integrity still blocks an icon that is actually used
    # but missing from the registry/import surface.
    Case("icon_gate: khái niệm có icon vẫn được dùng chữ nếu biên tập chọn vậy",
         "icon_gate.py", None,
         scene_edit=("V10Scene5.jsx", "KHỐI NGƯỜI BỊ KHOÁ CHẶT", "MẬT ĐỘ TĂNG"),
         expect_fail=False),
    Case("icon_gate: video hợp lệ dùng ZERO icon vẫn PASS", "icon_gate.py", None,
         expect_fail=False, expect_message=["zero icons is valid"]),
    Case("icon_gate: icon thực sự dùng nhưng chưa đăng ký vẫn FAIL", "icon_gate.py", None,
         sandbox_hook=insert_unregistered_icon,
         expect_message=["<IconBrokenReference>", "not registered"]),
    Case("icon_gate: xoá luôn file vốn từ ký hiệu", "icon_gate.py", None,
         sandbox_hook=delete_icon_vocabulary,
         expect_message=["iconVocabulary.jsx is missing"]),
    Case("baseline_gate: tụt so với video mốc", "baseline_gate.py", regress_below_baseline,
         args=lambda p: ["check", str(p)], expect_message=["độ phủ nội dung"]),
    Case("baseline_gate: code-drawn=0 không chặn plan photo-led hợp lệ",
         "baseline_gate.py", photo_led_zero_code, expect_fail=False,
         args=lambda p: ["check", str(p)], expect_message=["tham khảo, không chặn"]),
    Case("plan_gate: không có diagram vẫn PASS",
         "plan_gate.py", photo_led_zero_code, expect_fail=False,
         args=lambda p: [str(p), "--skip-lifetime"]),
    Case("plan_gate: không khai template/block vẫn PASS (bespoke là mặc định)",
         "plan_gate.py", no_template_declarations, expect_fail=False,
         args=lambda p: [str(p), "--skip-lifetime"]),
    Case("review_gate: sparse/minimal pass không bị ép thêm density",
         "review_gate.py", None, expect_fail=False,
         review=unexplained_pass_on_empty_frame,
         sandbox_hook=_repaint_frames("sparse"),
         expect_message=["sparse-band signals are advisory"]),
    Case("review_gate: khung render hoàn toàn trắng vẫn FAIL",
         "review_gate.py", None, review=unexplained_pass_on_empty_frame,
         sandbox_hook=_repaint_frames("blank"), expect_message=["completely blank"]),
    Case("review_gate: video đã dựng nhưng thiếu file review", "review_gate.py",
         mark_every_scene_built, review=lambda r: {"video": "x", "scenes": []}),
    # The reference itself must survive all four. A gate that cannot pass is a
    # wall, and a wall gets removed.
    # V10 shipped BEFORE the element-lifetime rule and breaks it 12 times.
    # Skipping that one gate here is not softening it - it is refusing to let a
    # rule written after V10 turn the reference into a wall. The debt is
    # recorded in references/lessons.md, not hidden.
    # asset_gate KHONG co ca "V10 that phai PASS", cung ly do voi cutout_gate:
    # V10 that su da ship voi ba asset vuot tran phong to. Ca "phai PASS" chay
    # tren ban da ha width, de chung minh gate van biet cho qua.
    Case("asset_gate: ảnh bị phóng to quá trần, đọc ra mờ", "asset_gate.py",
         asset_upscaled, args=_asset_args,
         expect_message=["Hero-Youth", "1.68x"]),
    Case("asset_gate: ảnh sai tỉ lệ so với slot đã khai", "asset_gate.py",
         asset_wrong_slot_shape, args=_asset_args,
         expect_message=["Hero-Youth", "sai ti le slot"]),
    Case("asset_gate: tỉ lệ đúng nhưng file chưa từng đi qua --fit", "asset_gate.py",
         asset_slot_without_fit_stamp, args=_asset_args,
         expect_message=["khong mang dau --fit"]),
    Case("asset_gate: bản đã hạ width của V10 phải PASS", "asset_gate.py",
         asset_all_clean, expect_fail=False, args=_asset_args),
    Case("block_gate: tỉ lệ block không phải quota chặn", "block_gate.py",
         block_overused, expect_fail=False, args=_block_args,
         expect_message=["Khong co quota block"]),
    Case("block_gate: một thế lặp là cảnh báo, không phải quota chặn", "block_gate.py",
         block_one_arrangement, expect_fail=False, args=_block_args,
         expect_message=["canh bao"]),
    Case("block_gate: khai một block không có trong kho", "block_gate.py",
         block_unknown, args=_block_args, expect_message=["khong co trong registry"]),
    Case("block_gate: cảnh không khai gì thì KHÔNG bị chặn (không khai = bespoke)",
         "block_gate.py", block_undeclared, expect_fail=False, args=_block_args),
    Case("block_gate: nhịp đọc vẫn được kiểm khi cảnh không dùng block nào",
         "block_gate.py", block_punch_too_short_no_block, expect_fail=False,
         args=_block_args, expect_message=["duoi san 48f"]),
    Case("block_gate: bespoke không kèm lý do", "block_gate.py",
         block_bespoke_no_reason, args=_block_args, expect_message=["bespokeReason"]),
    Case("block_gate: bản V10 đã chú thích block phải PASS", "block_gate.py",
         blocks_annotated, expect_fail=False, args=_block_args),
    Case("plan_gate: V10 thật phải PASS (trừ luật mới sau khi V10 ship)", "plan_gate.py",
         None, expect_fail=False, args=lambda p: [str(p), "--skip-lifetime"]),
    Case("build_gate: V10 thật phải PASS", "build_gate.py", None, expect_fail=False),
    Case("icon_gate: V10 zero-icon thật phải PASS", "icon_gate.py", None,
         expect_fail=False),
    Case("review_gate: V10 thật phải PASS", "review_gate.py", None, expect_fail=False),
    Case("baseline_gate: V10 thật phải PASS", "baseline_gate.py", None, expect_fail=False,
         args=lambda p: ["check", str(p)]),
    # Bản đầu của pixel_gate báo 4 lỗi ở đây, cả 4 đều giả: nhãn nằm trong
    # <Sequence from={46}> còn khung hình chụp ở frame 33, nên ô trống là ĐÚNG.
    # Ca này khoá lại chỗ đó - một gate soi pixel mà không biết mốc thời gian
    # thì sẽ kết tội gần như mọi nhãn xuất hiện muộn.
    Case("pixel_gate: V10 thật phải PASS (nhãn hiện muộn không phải lỗi)",
         "pixel_gate.py", None, expect_fail=False),
    # cutout_gate KHÔNG có ca "V10 phải PASS": V10 thật sự ship với hai cutout
    # lỗi (el10_youth_2022 cắt cụt đầu người ở mép trên, el10_street_sign cụt
    # cột ở mép dưới) - đúng hai tài sản SKILL.md đã ghi là lọt lưới. Bắt V10
    # phải xanh ở đây là bắt gate nói dối.
    #
    # assemble.py - phần cơ khí sinh từ plan (captions, master, đăng ký).
    # Ca 1 là khoá luật ngắt dòng: generator phải tái tạo ĐÚNG TỪNG KHUNG file
    # caption đã ship - ai đổi thuật toán ngắt dòng/làm tròn frame là vỡ ở đây.
    # Ca 2 khoá rail của đường fade TƯỜNG MINH; omission nay là hard cut nên
    # không còn rail để phá. Ca 3 là hàng rào chống đè công viết tay.
    Case("assemble: captionData sinh lại phải khớp từng khung bản đã ship",
         "assemble.py", None, expect_fail=False,
         sandbox_hook=copy_src_file("captionData10.js"),
         args=lambda p: [str(p), "--only", "captions", "--check"]),
    Case("assemble: explicit fade bỏ đệm rail trước nó phải bị --check bắt",
         "assemble.py", None, sandbox_hook=unpad_explicit_fade_rail,
         args=lambda p: [str(p), "--only", "master", "--check"],
         expect_message=["master:"]),
    Case("assemble: không được đè master viết tay",
         "assemble.py", None, sandbox_hook=fake_handwritten_master,
         args=lambda p: [str(p), "--only", "master"],
         expect_message=["viết tay"]),
    # Chốt duyệt shot list (hook_gate.post_edit). "Trình shot list cho user
    # duyệt" nằm trong SKILL.md từ đầu nhưng là CÂU VĂN - không gì kiểm. Giờ
    # nó là field dữ liệu, và hai ca này khoá cả hai chiều: chưa duyệt thì
    # chặn, duyệt rồi thì KHÔNG được chặn oan (một chốt chặn cả hai chiều là
    # bức tường, không phải cái chốt).
    Case("hook_gate: shot list chưa duyệt thì không được dựng cảnh",
         "hook_gate.py", activate_unapproved,
         args=lambda p: ["post-edit"], stdin=post_edit_payload,
         expect_message=["shotlistApproved"]),
    Case("hook_gate: shot list đã duyệt thì dựng cảnh bình thường",
         "hook_gate.py", activate_approved, expect_fail=False,
         args=lambda p: ["post-edit"], stdin=post_edit_payload),
    # Ngân sách ảnh. Lượt đo trên log token thật cho thấy SKILL.md §9 đã dặn
    # "chỉ nhìn khi cần" và không ngăn được gì: 439 ảnh vào context qua bốn
    # phiên, riêng V11 chiếm 55% cache_read = 384 USD. Một dòng dặn dò không
    # phải một cái chặn, nên chốt này phải có test - và phải khoá CẢ HAI chiều,
    # vì một chốt chỉ chặn mà không bao giờ cho qua sẽ bị gỡ ngay tuần sau.
    Case("hook_gate: mở ảnh quá gấp đôi ngân sách thì bị chặn",
         "hook_gate.py", activate_approved,
         args=lambda p: ["pre-read"], stdin=pre_read_payload,
         sandbox_hook=_seed_image_budget(200),
         expect_message=["ngân sách", "vision_check"]),
    Case("hook_gate: mở ảnh trong ngân sách thì KHÔNG chặn",
         "hook_gate.py", activate_approved, expect_fail=False,
         args=lambda p: ["pre-read"], stdin=pre_read_payload,
         sandbox_hook=_seed_image_budget(3)),
    Case("hook_gate: đọc file KHÔNG phải ảnh thì không bao giờ chặn",
         "hook_gate.py", activate_approved, expect_fail=False,
         args=lambda p: ["pre-read"],
         stdin=lambda pp: json.dumps({
             "cwd": str(pp.parent.parent), "tool_name": "Read",
             "tool_input": {"file_path": str(pp.parent.parent / "src" / "Root.jsx")}}),
         sandbox_hook=_seed_image_budget(200)),
    # init_video.align. KHÔNG phải hàm thuần (phiên sau sửa tay vài từ whisper
    # nghe đúng hơn kịch bản là việc NÊN làm), nên ca này khoá đúng thứ khoá
    # được: dựng lại từ transcript+kịch bản THẬT của V10 phải giống file đã
    # ship >=90%. Đó là mức phân biệt được "sửa tay vài chữ" với "ghép nhầm
    # cặp audio/kịch bản" - đo thật là 99.3%.
    Case("init_video: ghép lại V10 phải khớp file đã ship", "init_video.py", None,
         expect_fail=False,
         sandbox_hook=copy_input_file("transcript10.json", "Scitpt9_Itaewon_P1.txt"),
         args=lambda p: ["10", "--only", "align", "--check",
                         "--script", "input/Scitpt9_Itaewon_P1.txt"]),
    # Chữ điền cho có. `is_empty` chỉ bắt ô trống; hai ca này bắt ô ĐẦY mà rỗng
    # nghĩa - đúng loại chữ đẻ ra cảnh "chữ trên nền trắng". Danh sách cụm sáo
    # rỗng bắn 0 lần trên 53 cảnh đã ship (đo, không đoán), nên nó không phải
    # bức tường.
    Case("plan_gate: visualTransformation đầy chữ nhưng rỗng nghĩa",
         "plan_gate.py", vague_transformation,
         expect_message=["không phải một quyết định"]),
    Case("plan_gate: visualTransformation cụt lủn", "plan_gate.py", stub_transformation,
         expect_message=["quá ngắn để tả một quan hệ"]),
    Case("init_video: ghép nhầm cặp audio/kịch bản phải bị chặn", "init_video.py", None,
         sandbox_hook=copy_input_file("transcript10.json", "Scripttest9_Itaewon_P2.txt"),
         args=lambda p: ["10", "--only", "align", "--check",
                         "--script", "input/Scripttest9_Itaewon_P2.txt"],
         expect_message=["ghép nhầm cặp"]),
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
        _materialize_synthetic_review_frames(tmp, review)

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
    ap.add_argument("--repair-only", action="store_true",
                    help="run only synthetic efficiency/closure mutation contracts")
    args = ap.parse_args()

    if not REF_PLAN.exists():
        print(f"selftest: no reference plan at {REF_PLAN} - nothing to test against.")
        return 0

    results = []
    with tempfile.TemporaryDirectory(prefix="voxrepair-") as td:
        try:
            for name, ok in repair_contract_checks(pathlib.Path(td)):
                results.append((name, ok, "" if ok else "focused repair contract returned false"))
        except Exception as exc:  # noqa: BLE001
            results.append(("V15 generic repair contracts", False, f"selftest crashed: {exc}"))
    for case in ([] if args.repair_only else CASES):
        with tempfile.TemporaryDirectory(prefix="voxgate-") as td:
            tmp = pathlib.Path(td)
            try:
                plan_path = build_sandbox(tmp, case.mutate, case.review, case.scene_edit,
                                          case.sandbox_hook)
                code, out = run_gate(case.gate, case.args(plan_path), tmp,
                                     case.stdin(plan_path) if case.stdin else None)
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
