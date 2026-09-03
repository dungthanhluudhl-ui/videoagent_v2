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

    PreToolUse  (Read)        py -3 hook_gate.py pre-read
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
   is untouched. Set the plan's status to "shipped" when pipeline/build and
   review artifacts are complete; it makes gates quiet but is not user/product
   quality approval.

   The exception is `guard_planless_scene`: a scene file for a video newer
   than every planned video is blocked outright. Without it the whole system
   was absent at the one moment it mattered most - the start of a new video,
   before any plan exists - which let the original "shot list only lived in
   chat" defect back in through the front door.
2. FAIL-OPEN, but only for the UNEXPECTED. A crash inside this file exits 0
   with a warning: a gate that bricks the repo when it has a bug is worse
   than no gate.

   Three things used to ride on that exemption which had no business being
   there, all measured on a real V10 checkout:

     * a gate script deleted or renamed  -> Stop hook exited 0
     * a plan file with broken JSON      -> Stop hook exited 0
     * `"status": "shipped"` typed early -> Stop hook exited 0

   None of those is an environment failure; each is a mistake this system
   exists to catch, and each silently switched the system off. All three now
   block. See REQUIRED_GATES, `find_active_plan`'s `broken` list, and
   `guard_premature_shipped`.
"""

import hashlib
import json
import pathlib
import re
import subprocess
import sys

import pipeline_contracts as contracts
import build_gate
import stage_state as state
import review_vision

SCRIPTS = pathlib.Path(__file__).resolve().parent
SCENE_FILE_HINT = "src/videos/"
SCENE_FILE_RE = re.compile(r"src/videos/V(\d+)/scenes/S\w+\.jsx$")

# Every gate the Stop hook must run. A MISSING one used to be skipped with a
# quiet `continue` - so deleting or renaming a gate file disabled it and
# nothing said a word. Measured: with review_gate.py removed the Stop hook
# returned 0 on a video with no review at all. Fail-open protects against a
# gate that CRASHES (a bug in the gate should not brick the repo); it must not
# protect against a gate that has VANISHED, which is a broken install.
REQUIRED_GATES = ("plan_gate.py", "build_gate.py", "text_gate.py",
                  "assemble.py", "review_gate.py", "selftest.py")
CONDITIONAL_GATES = ("icon_gate.py", "cutout_gate.py")


IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")
# Bo dem thuoc ve DU AN, khong thuoc ban cai dat skill: hai du an khac nhau
# dung chung mot skill thi khong duoc dung chung mot ngan sach anh. (Ban dau
# no nam canh script va selftest lo ra ngay - sandbox ghi mot cho, guard doc
# mot cho khac, nen chot chan im lang cho qua.)
BUDGET_REL = pathlib.Path(".claude") / "skills" / "vox-collage-video" / "data" / ".image_budget.json"
BUDGET_SLACK = 8          # dư cho các mục bị gắn cờ + vài lần đối chứng
HARD_MULTIPLIER = 2       # dưới mức này chỉ nhắc; trên mức này mới chặn


def guard_image_read(payload, root):
    """Đếm - và cuối cùng là chặn - việc agent tự mở ảnh ra nhìn.

    Vì sao guard này phải tồn tại, dù SKILL.md §9 đã dặn rõ: lượt trước đã đo
    trên log token thật của bốn phiên dựng. 439 bức ảnh vào context; riêng phiên
    V11 chúng chiếm 55% cache_read = 384 USD trong một phiên 979 USD. SKILL.md
    lúc đó CŨNG đã có phần review, và nó không ngăn được gì - vì một dòng dặn dò
    không phải một cái chặn.

    Lớp tư vấn ở Stop hook cũng không đủ: nó chạy ở CUỐI lượt, tức sau khi tiền
    đã tiêu. Chỗ duy nhất can thiệp kịp là ngay trước lệnh Read.

    Ngân sách = số cảnh + 8. Lấy từ chỗ đo được, không đặt bừa: V10 (video người
    xem thích) dùng 6,3 ảnh/cảnh, V11 (người xem nói "mệt") dùng 9,8. Mục tiêu
    ~1 khung/cảnh cho câu hỏi mà model rẻ chưa được kiểm - "cảnh này có đang
    minh hoạ gì cho lời thoại không" - cộng phần dư cho các mục bị gắn cờ.

    Hai nấc có chủ ý: dưới ngân sách chỉ NHẮC (kèm số đếm, để mức trôi luôn nhìn
    thấy được); trên gấp đôi mới CHẶN. Chặn sớm sẽ cản việc chính đáng, còn không
    chặn gì thì đúng là thứ đã cho ra con số 384 USD.
    """
    if (payload.get("tool_name") or "") != "Read":
        return 0
    fp = str((payload.get("tool_input") or {}).get("file_path") or "")
    if not fp.lower().endswith(IMAGE_EXT):
        return 0

    plan, _ = find_active_plan(root)
    if not plan:
        return 0
    path, data = plan
    video = str(data.get("video") or "V?")
    n_scenes = len(data.get("scenes") or []) or 1
    budget = n_scenes + BUDGET_SLACK

    budget_file = root / BUDGET_REL
    try:
        state = json.loads(budget_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        state = {}
    if state.get("video") != video:
        state = {"video": video, "count": 0}
    state["count"] = int(state.get("count", 0)) + 1
    try:
        budget_file.parent.mkdir(parents=True, exist_ok=True)
        budget_file.write_text(json.dumps(state), encoding="utf-8")
    except OSError:
        pass                              # không ghi được thì thôi, đừng chặn oan

    n = state["count"]
    if n > budget * HARD_MULTIPLIER:
        print(
            f"[vox-image] {video}: đây là bức ảnh thứ {n} bạn tự mở trong video này, "
            f"gấp hơn {HARD_MULTIPLIER} lần ngân sách {budget} ({n_scenes} cảnh + "
            f"{BUDGET_SLACK}).\n\n"
            f"Một bức ảnh KHÔNG tốn một lần rồi thôi - nó nằm lại trong context và bị "
            f"đọc lại ở mọi lượt gọi sau đó. Đo trên phiên V11: 236 ảnh = 55% cache_read "
            f"= 384 USD.\n\n"
            f"Hãy để model rẻ nhìn trước, rồi CHỈ mở những mục nó gắn cờ:\n"
            f"    py -3 {SCRIPTS.name}/vision_check.py --plan {path}\n"
            f"    py -3 {SCRIPTS.name}/asset_vision.py {path}\n"
            f"    py -3 {SCRIPTS.name}/sheet_vision.py <review sceneSummarySheet> "
            f"--scenes {n_scenes}\n\n"
            f"Nếu người dùng đã trực tiếp yêu cầu bạn xem ảnh này, hãy NÓI VỚI HỌ rằng "
            f"ngân sách ảnh đã cạn và để họ quyết định - đừng tự nâng ngân sách, và đừng "
            f"tìm đường vòng.",
            file=sys.stderr)
        return 2

    if n > budget:
        print(f"[vox-image] {video}: ảnh thứ {n}/{budget} - đã vượt ngân sách "
              f"({n_scenes} cảnh + {BUDGET_SLACK}). Từ đây chỉ nên mở những mục "
              f"vision_check/asset_vision/sheet_vision đã gắn cờ. Sẽ chặn ở "
              f"{budget * HARD_MULTIPLIER}.", file=sys.stderr)
    elif n > budget * 0.6:
        print(f"[vox-image] {video}: ảnh thứ {n}/{budget}.", file=sys.stderr)
    return 0


def find_active_plan(root):
    """(plan_or_None, broken) - the single active scene plan, plus any plan
    file that could not be parsed.

    `broken` used to be swallowed by a bare `continue`, and that was a hole
    wide enough to drive the whole video through: a plan file with one stray
    comma stopped being "active", so the Stop hook found nothing to enforce
    and returned 0 on a video in any state at all. Measured - it really did
    exit 0 with `scene_plan10.json` reduced to `{ broken json`.

    A plan the model itself wrote and corrupted is not an unexpected
    environment failure; it is precisely the kind of mistake this gate exists
    to catch. Report it and block.
    """
    plans, broken = [], []
    candidates = [*(root / "input").glob("V*/scene_plan.json"),
                  *(root / "input").glob("scene_plan*.json")]
    for path in sorted(candidates):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            broken.append((path, f"line {exc.lineno} col {exc.colno}: {exc.msg}"))
            continue
        except OSError as exc:
            broken.append((path, str(exc)))
            continue
        if data.get("status") == "active":
            plans.append((path, data))
    if len(plans) > 1:
        # HARD FAIL, not a warning. Returning None here used to mean "no active
        # plan", which makes every gate downstream skip and the turn end green -
        # so the one state where enforcement is off is also the state that looks
        # exactly like a clean run. Hit for real: with V11 and V12 both open the
        # Stop hook printed this line and exited 0, and nothing was being
        # checked at all.
        #
        # Two open plans is also never a legitimate state - the plan is the
        # contract for ONE video - so refusing costs nothing and the message
        # says exactly which file to change.
        print(f"[vox-gate] KHÔNG THỂ CƯỠNG CHẾ: có {len(plans)} kế hoạch cùng đang mở "
              f"({', '.join(p.name for p, _ in plans)}).\n"
              f"  Mỗi lần chỉ được MỘT video đang dựng, vì mọi gate đều chấm bản dựng "
              f"theo đúng một bản kế hoạch.\n"
              f"  Đặt \"status\": \"shipped\" cho video đã xong, giữ lại đúng một cái "
              f"\"active\".\n"
              f"  (Trước đây chỗ này chỉ cảnh báo rồi cho qua - tức là gate tắt hẳn "
              f"mà lượt vẫn xanh.)", file=sys.stderr)
        sys.exit(2)
    return (plans[0] if plans else None), broken


def planned_video_numbers(root):
    """{10, 11, ...} - every video that has a plan file, active or not."""
    nums = set()
    candidates = [*(root / "input").glob("V*/scene_plan.json"),
                  *(root / "input").glob("scene_plan*.json")]
    for path in candidates:
        m = re.search(r"(?:[/\\]V|scene_plan)(\d+)(?:[/\\]scene_plan)?\.json$",
                      str(path).replace("\\", "/"))
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
    written until that video has `input/V<N>/scene_plan.json`. Older videos
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
        f"no plan file. `input/V{video}/scene_plan.json` must exist BEFORE any scene of it "
        f"is written.\n"
        f"Scaffold it with:\n"
        f"    py -3 .claude/skills/vox-collage-video/scripts/start_video.py {video} "
        f"--words input/V{video}/words_aligned.json\n"
        f"then complete semantic intent, pass plan_gate.py, and get the plan approved.\n"
        f"Building scenes from a shot list that only exists in chat is the exact defect "
        f"this skill was built to make impossible.",
        file=sys.stderr)
    return 2


def guard_premature_shipped(payload, root):
    """`"status": "shipped"` switches every gate off. It must therefore be
    earned, not typed.

    Before this, flipping the status was the cheapest possible way out of a
    failing gate: one word, and the Stop hook found no active plan and
    returned 0 - on a video that had never passed a single check. Measured on
    V10: setting `shipped` took the Stop hook from a real run to exit 0
    instantly.

    So the TRANSITION is guarded rather than the state: the moment a plan file
    is written with `shipped`, every gate runs, and the edit is blocked if any
    of them fails. Once a video genuinely is done, the status is correct and
    everything stays quiet - which is the whole point of having the status.
    """
    tool_input = payload.get("tool_input") or {}
    edited = str(tool_input.get("file_path") or tool_input.get("path") or "")
    norm = edited.replace("\\", "/")
    if not (norm.endswith("/scene_plan.json") or re.search(r"input/scene_plan\d+\.json$", norm)):
        return 0
    path = pathlib.Path(edited)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0                      # the broken-JSON guard reports this instead
    if data.get("status") != "shipped":
        return 0

    failures = []
    if not contracts.approval_contract(data)["approved"]:
        failures.append("### shot list chưa duyệt\n"
                        "Video sắp ship mà \"shotlistApproved\" chưa phải true - shot list "
                        "chưa từng được user duyệt (hoặc chốt đã bị gỡ khỏi plan).")
    approved, approval_path, _receipt = contracts.previs_is_closed(path)
    if not approved:
        failures.append(f"### PREVIS approval\nCurrent human approval missing/stale: {approval_path}")
    conformed, conformance_path, _receipt = build_gate.conformance_is_current(path)
    if not conformed:
        failures.append(f"### promoted conformance\nCurrent OPEN/KEY conformance missing/stale: {conformance_path}")
    for script, args in (("plan_gate.py", [str(path), "--hook"]),
                         ("build_gate.py", [str(path)]),
                         ("review_gate.py", [str(path), "--hook"]),
                         ("text_gate.py", [str(path), "--hook"]),
                         ("assemble.py", [str(path), "--check"]),
                         ("selftest.py", [])):
        if not (SCRIPTS / script).exists():
            failures.append(f"{script}: MISSING")
            continue
        code, out = run(script, *args)
        if code != 0:
            failures.append(f"### {script}\n{out.strip()}")
    if not failures:
        return 0

    print(f"[vox-gate] {path.name} was set to \"status\": \"shipped\", which turns every "
          f"gate off - but this video does not pass them yet:\n\n"
          + "\n\n".join(failures)
          + "\n\nPut the status back to \"active\", fix the failures, and mark it shipped "
            "when it is actually shipped. Flipping the status is not a way to make a gate "
            "quiet.", file=sys.stderr)
    return 2


def run(script, *args):
    """(exit_code, combined_output) for one gate script."""
    proc = subprocess.run(
        [sys.executable, str(SCRIPTS / script), *args],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


def _plan_files(root, plan_data):
    video = plan_data.get("video", "V")
    return [state.scene_source(root, video, s.get("id"))
            for s in plan_data.get("scenes") or []]


def _asset_files(root, plan_data, roles=None):
    paths = []
    for scene in plan_data.get("scenes") or []:
        for asset in state.scene_materials(scene):
            if asset.get("src") and (roles is None or asset.get("role") in roles):
                paths.append(state.asset_path(root, plan_data.get("video", "V"), asset["src"]))
    return paths


def gate_dependencies(root, plan_path, plan_data, script, args):
    """Normalized logical plan slices plus files actually consumed by a gate family."""
    words = state.words_path(root, plan_data)
    scenes = _plan_files(root, plan_data)
    paths = state.video_paths(root, plan_data.get("video", "V"))
    review = paths["review"]
    common = [SCRIPTS / script, SCRIPTS / "hook_gate.py", SCRIPTS / "stage_state.py",
              SCRIPTS / "pipeline_contracts.py"]
    all_scene_fields = ("id", "startSec", "endSec", "durationInFrames", "masterStartFrame",
                         "narrativeFunction", "viewerQuestion", "visualTransformation",
                         "contrastWithPrevious", "comprehensionLoad", "materials", "assets")
    if script == "plan_gate.py":
        contract = state.plan_slice(plan_data, fields=("video", "fps", "wordsFile"),
                                    scene_fields=all_scene_fields)
        return [{"planContract": contract}, *common, words]
    if script == "build_gate.py":
        selected = next((args[i + 1] for i, x in enumerate(args[:-1]) if x == "--scene"), None)
        if selected:
            scenes = [state.scene_source(root, plan_data.get("video"), selected)]
        fields = ("id", "startSec", "endSec", "visualTransformation", "materials", "assets")
        contract = state.plan_slice(plan_data, fields=("video", "fps"), scene_fields=fields,
                                    scene_ids=[selected] if selected else None)
        return [{"planContract": contract}, *common, *scenes]
    if script in ("text_gate.py", "icon_gate.py"):
        extra = [paths["shared"]]
        if script == "icon_gate.py":
            extra.append(root / "src" / "scenes" / "iconVocabulary.jsx")
        fields = ("id", "materials", "assets", "punch")
        return [{"planContract": state.plan_slice(plan_data, fields=("video",),
                                                   scene_fields=fields)},
                *common, *scenes, *extra]
    if script == "cutout_gate.py":
        assets = [{"id": s.get("id"), "assets": [a for a in state.scene_materials(s)
                   if a.get("role") in {"hero", "support"}]} for s in plan_data.get("scenes") or []]
        return [{"assetContract": assets}, *common,
                *_asset_files(root, plan_data, {"hero", "support"})]
    if script == "assemble.py":
        video = plan_data.get("video", "V")
        contract = state.plan_slice(plan_data, fields=("video", "fps", "audioFile", "wordsFile"),
                                    scene_fields=("id", "startSec", "endSec", "durationInFrames",
                                                   "masterStartFrame", "transitionIn"))
        return [{"assemblyContract": contract}, *common, words,
                paths["master"], paths["previs_root"], paths["entry"], *scenes]
    if script == "review_gate.py":
        review_data = state.read_json(review, {})
        paths = [{"review": review_data}, *common, *scenes]
        try:
            for entry in review_data.get("scenes") or []:
                for raw in entry.get("frames") or [entry.get("frame")]:
                    if raw:
                        paths.append(state.project_path(root, raw))
        except (TypeError, AttributeError):
            return paths
        return paths
    return None


def _gate_summary(output, hard):
    prefixes = ("FAIL ", "HARD ", "THIEU ", "RENDER FAILED") if hard else ("WARN ",)
    lines = [line for line in output.splitlines() if line.startswith(prefixes)]
    if lines:
        return "\n".join(lines)
    nonempty = [line for line in output.splitlines() if line.strip()]
    return nonempty[-1] if nonempty else "gate returned no diagnostics"


def run_incremental(root, plan_path, plan_data, script, args):
    deps = gate_dependencies(root, plan_path, plan_data, script, args)
    if deps is None:
        code, out = run(script, *args)
        return code, out, False, None
    dependency_inputs = []
    for path in deps:
        if isinstance(path, dict):
            dependency_inputs.append(path)
        else:
            dependency_inputs.append(state.file_input(path))
    inputs = {"dependencies": dependency_inputs}
    tool = {"script": script, "version": "incremental-gate-v1"}
    params = {"args": [str(x) for x in args]}
    video = plan_data.get("video", "V")
    key = state.digest({"script": script, "args": params})[:20]
    paths = state.video_paths(root, video)
    receipt_path = paths["gate_receipts"] / f"{script}-{key}.json"
    current, receipt = state.receipt_current(receipt_path, f"gate:{script}", inputs, tool, params)
    if current:
        meta = receipt.get("metadata") or {}
        return (int(meta.get("exitCode", 0)), str(meta.get("summary", "")), True,
                pathlib.Path(meta.get("details")) if meta.get("details") else receipt_path)
    code, out = run(script, *args)
    detail = paths["gate_details"] / f"{script}-{key}.txt"
    detail.parent.mkdir(parents=True, exist_ok=True)
    summary = _gate_summary(out, code != 0)
    detail.write_text(out if (code != 0 or "WARN " in out) else summary + "\n", encoding="utf-8")
    receipt = state.make_receipt(receipt_path, f"gate:{script}", inputs, tool, params,
                                 [detail], metadata={"exitCode": code, "summary": summary,
                                                     "details": str(detail)})
    state.append_telemetry(root, video, {"stage": f"gate:{script}", "owner": "script",
                           "cache": "miss", "subprocessCount": 1, "affectedItems": 1,
                           "output": str(detail), "receiptId": receipt["receiptId"]})
    return code, out, False, detail


def scene_id_for(path, plan_data):
    """Map canonical src/videos/V10/scenes/S13.jsx to its semantic scene id."""
    video = plan_data.get("video", "")
    normalized = str(path).replace("\\", "/")
    if not video or f"/src/videos/{video}/scenes/" not in "/" + normalized.lstrip("/"):
        return None
    stem = pathlib.Path(path).stem
    suffix = stem.lstrip("Ss0") or "0"
    return f"S{int(suffix)}" if suffix.isdigit() else stem


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

    # Chốt duyệt shot list. SKILL.md bước 2 viết "trình shot list cho user
    # duyệt" từ đầu - nhưng đó là CÂU VĂN, và không gì trong hệ thống này từng
    # kiểm nó. Học từ vox-director (aspect_approx_confirmed): sự chấp thuận
    # của con người phải là MỘT FIELD DỮ LIỆU trong hợp đồng, và code dừng khi
    # thiếu. Gate không thể biết user có thật sự duyệt hay không (field vẫn do
    # model gõ - xem nguyên tắc ANCHOR trong plan_gate.py); cái nó mua được là
    # biến "im lặng bỏ qua checkpoint" thành "phải chủ động khai man" - đúng
    # cái sàn khả thi.
    if not contracts.approval_contract(plan_data)["approved"]:
        print(f"[vox-gate] {sid}: shot list của {plan_path.name} CHƯA được user duyệt "
              f"(\"shotlistApproved\" chưa phải true) - chưa được làm PREVIS cảnh nào.\n"
              f"  Thứ tự đúng: plan qua plan_gate -> TRÌNH semantic plan "
              f"cho user -> user đồng ý -> đặt \"shotlistApproved\": true -> mới làm PREVIS.\n"
              f"  Chỉ đặt true sau khi user THẬT SỰ duyệt, hoặc họ đã dặn từ đầu là "
              f"chạy end-to-end không cần hỏi. Tự đặt true để vượt chốt này không phải "
              f"là quên - là khai man có chủ đích.", file=sys.stderr)
        return 2

    code, out = run("build_gate.py", str(plan_path), "--previs", "--scene", sid)
    if code != 0:
        print(f"[vox-gate] {sid} no longer matches the approved plan ({plan_path.name}):\n"
              f"{out.strip()}\n"
              f"Fix the scene, or update the plan deliberately if the change is intended - "
              f"do not leave the build and the plan disagreeing.", file=sys.stderr)
        return 2

    return 0


STAMP = SCRIPTS.parent / "data" / ".selftest_stamp"


def gate_fingerprint():
    """Hash of everything selftest.py actually exercises.

    Measured: the six real gates take 1.0s combined; selftest takes 14s,
    because it re-runs them ~29 times against throwaway copies. Paying that at
    the end of EVERY turn buys nothing when no gate has changed - selftest only
    answers "do the gates still catch what they claim to", and gates do not
    rot on their own between two edits to a scene file.

    So: hash the gate sources plus the measurement data they read, and skip the
    run while that hash is unchanged. This is not an opt-out. Touch any gate,
    even by one character, and the hash moves and selftest runs again - which
    is exactly the moment it has something to say. Delete the stamp and it runs
    too, so the cautious state is the default state.
    """
    h = hashlib.sha256()
    files = sorted(SCRIPTS.glob("*.py"))
    files += sorted((SCRIPTS.parent / "data").glob("*.json"))
    for f in files:
        try:
            h.update(f.name.encode())
            h.update(f.read_bytes())
        except OSError:
            return None                 # unreadable -> no stamp -> always run
    return h.hexdigest()


def selftest_is_current():
    fp = gate_fingerprint()
    if fp is None:
        return False, None
    try:
        return STAMP.read_text(encoding="utf-8").strip() == fp, fp
    except OSError:
        return False, fp


def stop(root, plan):
    plan_path, plan_data = plan
    failures = []
    skip_selftest, fingerprint = selftest_is_current()
    advisories = []
    scenes = plan_data.get("scenes") or []
    lifecycle = contracts.lifecycle_contract(plan_data)
    any_previs = lifecycle["anyPrevis"]
    previs_complete = lifecycle["previsComplete"]
    paths = state.video_paths(root, plan_data.get("video", "V"))
    review_path = paths["review"]
    review_exists = review_path.is_file()
    vision_current = review_vision.is_current(plan_path, plan_data)[0] if review_exists else False
    source_files = _plan_files(root, plan_data)
    authored_previs = any(path.is_file() for path in source_files)
    downstream_exists = any(path.is_file() for path in (
        paths["promoted_previs_manifest"], paths["draft"], paths["final"], review_path,
        paths["receipts"] / "render-draft.json", paths["receipts"] / "render-final.json"))

    if downstream_exists:
        approved, approval_path, _approval = contracts.previs_is_closed(plan_path)
        if not approved:
            failures.append("### PREVIS approval currentness\n"
                            f"Promoted/draft/review state exists but approval is stale/missing: {approval_path}")
        conformed, conformance_path, _conformance = build_gate.conformance_is_current(plan_path)
        if not conformed:
            failures.append("### promoted OPEN/KEY conformance\n"
                            f"Promoted/draft/review state exists but conformance is stale/missing: {conformance_path}")

    checks = [("plan_gate.py", [str(plan_path), "--hook"], "scene plan integrity", True)]
    if authored_previs or any_previs:
        checks.append(("build_gate.py", [str(plan_path), "--previs"],
                       "production-compatible PREVIS source", True))
    if previs_complete:
        checks += [
            ("text_gate.py", [str(plan_path), "--hook"], "rendered text implementation", True),
            ("assemble.py", [str(plan_path), "--check"], "generated assembly", True),
        ]
        source_text = "\n".join(path.read_text(encoding="utf-8") for path in source_files
                                if path.is_file())
        if re.search(r"<Icon[A-Z]\w*\b", source_text):
            checks.append(("icon_gate.py", [str(plan_path)], "icon integrity when applicable", True))
        asset_manifest = state.read_json(paths["asset_manifest"], {})
        if any(state.asset_requires_cutout(asset, asset_manifest)
               for scene in plan_data.get("scenes") or [] for asset in state.scene_materials(scene)):
            checks.append(("cutout_gate.py",
                           [str(paths["assets"]), "--video",
                            str(plan_data.get("video", "V")).lstrip("Vv"),
                            "--plan", str(plan_path), "--hook"],
                           "cutout integrity when applicable", True))
    if review_exists:
        checks.append(("review_gate.py", [str(plan_path), "--hook"], "review evidence", True))
    if not skip_selftest:
        checks.append(("selftest.py", [], "gate self-test", True))

    missing = [name for name in (*REQUIRED_GATES, *CONDITIONAL_GATES)
               if not (SCRIPTS / name).exists()]
    if missing:
        failures.append("### broken gate installation\nMissing: " + ", ".join(missing))

    for script, args, label, blocking in checks:
        if not (SCRIPTS / script).exists():
            continue
        code, out, cache_hit, detail = run_incremental(root, plan_path, plan_data,
                                                       script, args)
        if cache_hit:
            state.append_telemetry(root, plan_data.get("video", "V"), {
                "stage": f"gate:{script}", "owner": "script", "cache": "hit",
                "subprocessCount": 0, "affectedItems": 0})
        if code != 0:
            target = failures if blocking else advisories
            target.append(f"### {label} ({script})\n{_gate_summary(out, True)}"
                          + (f"\nDETAILS: {detail}" if detail else ""))
        elif (not cache_hit and script in ("plan_gate.py", "review_gate.py")
              and "WARN " in out):
            warnings = "\n".join(line for line in out.splitlines() if line.startswith("WARN "))
            label = ("outstanding plan-quality advisories" if script == "plan_gate.py"
                     else "rendered findings / acknowledged quality debt")
            advisories.append(f"### {label} ({script})\n{warnings}")

    if review_exists and not vision_current:
        advisories.append("### explicit review vision remains\nRun review_vision.py explicitly "
                          "for the current review pixels and briefs. Stop never invokes a model.")

    if advisories:
        print("[vox-review] các tín hiệu plan và rendered evidence dưới đây cần được "
              "xem cùng nhau trong correction pass:\n\n" + "\n\n".join(advisories)
              + "\n\nĐây là gợi ý, không phải lỗi hay mục tiêu điểm số. Nếu cần mở ảnh, chỉ mở "
                "những khung cheap vision gắn cờ; đừng mở hết cả thư mục: "
                "mỗi tấm ảnh vào context sẽ bị đọc lại ở mọi lượt gọi sau đó.",
              file=sys.stderr)

    if not failures:
        if fingerprint and not skip_selftest:
            try:
                STAMP.parent.mkdir(parents=True, exist_ok=True)
                STAMP.write_text(fingerprint, encoding="utf-8")
            except OSError:
                pass                    # no stamp -> selftest runs next turn
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

        # These two run BEFORE the active-plan lookup on purpose: they are the
        # checks that have to work when there is no usable active plan, which
        # is exactly when the rest of the system used to fall silent.
        # Chạy TRƯỚC lệnh Read, và là chỗ duy nhất can thiệp kịp: lớp tư vấn ở
        # Stop hook chỉ nói được sau khi ảnh đã nằm trong context rồi.
        if mode == "pre-read":
            return guard_image_read(payload, root)

        if mode == "post-edit":
            for guard in (guard_planless_scene, guard_premature_shipped):
                blocked = guard(payload, root)
                if blocked:
                    return blocked

        plan, broken = find_active_plan(root)

        if broken:
            detail = "\n".join(f"  {p}: {why}" for p, why in broken)
            print(f"[vox-gate] a scene plan cannot be read, so nothing can be enforced "
                  f"against it:\n{detail}\n"
                  f"Fix the JSON. An unreadable plan silently switches this whole gate "
                  f"system off, which is worse than any single failing check.",
                  file=sys.stderr)
            return 2

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
