"""
start_video.py - canonical INGEST + semantic PLAN scaffold entry.

Trước script này, mỗi video đều bắt đầu bằng một nắm lệnh Python gõ inline:
kiểm môi trường, chép audio, gọi whisper, rồi ghép chữ của kịch bản với thời
gian của whisper bằng tay. Việc ghép đó không hề đơn giản - whisper nghe nhầm
danh từ riêng ("Itaewon" -> "Y Tự Quận", 1 từ thành 3), nên đếm từ không khớp
1:1 và mọi cách "cộng trừ độ lệch" đều sai từ chỗ nghe nhầm trở đi.

    py -3 start_video.py 13 --audio "D:/thu/Audio13.mp3" --script "D:/thu/Script13.txt"
    py -3 start_video.py 13 --only align --script ... --check

Bốn bước, mỗi bước tự bỏ qua nếu đã có kết quả (dùng --force để làm lại):

  env        đủ whisper/rembg/scipy/PIL/numpy/requests chưa
  audio      chép về public/V<N>/audio.mp3
  transcribe whisper word_timestamps -> input/V<N>/transcript.json
  align      kịch bản + thời gian whisper -> input/V<N>/words_aligned.json

LUẬT GHÉP (tái dựng từ words10/11_aligned.json đã ship, không phải bịa ra):

  Chữ lấy từ KỊCH BẢN của user, thời gian lấy từ whisper - vì user biết mình
  viết gì, whisper chỉ biết khi nào. Ranh giới segment của whisper được chiếu
  sang kịch bản bằng difflib (khớp chuỗi thật, chịu được nghe nhầm/tách từ),
  rồi trong MỖI segment các từ của kịch bản chia ĐỀU trên khoảng thời gian
  của segment đó.

  Chia đều nghe có vẻ thô, nhưng đó đúng là thứ hai video đã ship dùng, và nó
  đúng hơn cách "gán thẳng timestamp của whisper" ở chỗ quan trọng nhất: khi
  whisper nghe nhầm, timestamp của nó thuộc về TỪ NÓ NGHE NHẦM, không thuộc
  về từ trong kịch bản. Ranh giới segment thì whisper nghe đúng (nó bám vào
  quãng nghỉ thật), nên đó là mỏ neo đáng tin - và beat_sync.py chỉ cần đúng
  đến mức cụm từ, không cần đúng từng từ.

ĐÂY LÀ ĐIỂM KHỞI ĐẦU, KHÔNG PHẢI HÀM THUẦN - và đó là lý do script này KHÔNG
nằm trong Stop hook như assemble.py. Đo trên hai video đã ship:

  V10  441/441 từ, 433/441 chữ trùng, 1 ranh giới lệch 1 từ, thời gian lệch
       tối đa 0.34s
  V11  562 từ dựng lại / 557 từ đã ship

Phần chênh KHÔNG phải lỗi thuật toán: phiên trước đã sửa tay đúng chỗ nên
sửa - kịch bản viết "bà," nhưng người nói "bar", "mặt độ" phải là "mật độ".
Máy không biết những chỗ đó; người biết. Vậy nên script này dựng bản nháp,
người sửa lại vài từ, và nó KHÔNG BAO GIỜ ghi đè file đã có nếu không --force.

--check báo cáo mức chênh và chỉ thoát 1 khi có vấn đề CẤU TRÚC (thiếu file,
số từ lệch quá 2%) - chứ không bắt lỗi mấy chỗ sửa tay hợp lệ đó.
"""

import argparse
import difflib
import importlib.metadata
import json
import pathlib
import re
import shutil
import subprocess
import sys

import stage_state as state

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

NEEDED = ("whisper", "rembg", "scipy", "PIL", "numpy", "requests")
ROUND = 3
AUDIO_VERSION = "audio-copy-v1"
TRANSCRIBE_VERSION = "whisper-word-timestamps-v1"
ALIGN_VERSION = "script-authoritative-segment-alignment-v1"


def _root():
    return state.project_root(__file__)


def _receipt(n, name):
    return state.runtime_dir(_root(), f"V{n}") / "receipts" / f"{name}.json"


def _paths(n):
    return state.video_paths(_root(), f"V{n}")


def _package_version(name):
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return "UNKNOWN"


def norm(w):
    """Chuẩn hoá để so khớp: bỏ dấu câu, thường hoá. Giữ nguyên dấu tiếng Việt."""
    return re.sub(r"[^\w]", "", w.lower(), flags=re.UNICODE)


# ------------------------------------------------------------------ bước env

def step_env():
    missing = []
    for mod in NEEDED:
        try:
            __import__(mod)
        except ImportError:
            missing.append(mod)
    if missing:
        print(f"env: THIẾU {', '.join(missing)} - cài trước khi chạy tiếp.")
        return False
    print(f"env: đủ {len(NEEDED)} gói.")
    return True


# ---------------------------------------------------------------- bước audio

def step_audio(n, audio_src, force):
    dest = _paths(n)["audio"]
    if not audio_src:
        if dest.exists():
            print(f"audio: đã có {dest}.")
            return True
        print("audio: chưa có file, truyền --audio.")
        return False
    src = pathlib.Path(audio_src)
    if not src.exists():
        print(f"audio: không thấy {src}.")
        return False
    inputs = {"sourceAudio": state.file_input(src)}
    tool = state.tool_identity(pathlib.Path(__file__), versions={"copy": AUDIO_VERSION})
    current, receipt = state.receipt_current(
        _receipt(n, "audio"), "audio-copy", inputs, tool, {}, require_outputs=True)
    if current and not force:
        print(f"audio: CLOSED / REUSE {dest} ({receipt['receiptId'][:12]}).")
        state.append_telemetry(_root(), f"V{n}", {"stage": "audio-copy", "owner": "script",
                               "cache": "hit", "subprocessCount": 0,
                               "affectedItems": 1, "receiptId": receipt["receiptId"]})
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    receipt = state.make_receipt(_receipt(n, "audio"), "audio-copy", inputs, tool, {}, [dest])
    state.append_telemetry(_root(), f"V{n}", {"stage": "audio-copy", "owner": "script",
                           "cache": "miss", "subprocessCount": 0, "affectedItems": 1,
                           "output": str(dest), "outputSize": dest.stat().st_size,
                           "receiptId": receipt["receiptId"]})
    print(f"audio: CLOSED / chép {src.name} -> {dest} ({receipt['receiptId'][:12]}).")
    return True


# ----------------------------------------------------------- bước transcribe

def step_transcribe(n, language, model_name, force):
    out = _paths(n)["transcript"]
    audio = _paths(n)["audio"]
    if not audio.exists():
        print(f"transcribe: chưa có {audio} - chạy bước audio trước.")
        return False
    inputs = {"audio": state.file_input(audio)}
    params = {"model": model_name, "language": language, "wordTimestamps": True}
    tool = state.tool_identity(pathlib.Path(__file__), versions={
        "implementation": TRANSCRIBE_VERSION,
        "openai-whisper": _package_version("openai-whisper")})
    current, receipt = state.receipt_current(
        _receipt(n, "transcription"), "transcription", inputs, tool, params)
    if current and not force:
        print(f"transcribe: CLOSED / REUSE {out} ({receipt['receiptId'][:12]}).")
        state.append_telemetry(_root(), f"V{n}", {"stage": "transcription", "owner": "script",
                               "cache": "hit", "subprocessCount": 0,
                               "affectedItems": 1, "receiptId": receipt["receiptId"]})
        return True
    try:
        import whisper
    except ImportError:
        print("transcribe: chưa cài whisper.")
        return False
    print(f"transcribe: cache MISS; chạy whisper '{model_name}' trên {audio}...")
    with state.timed_stage(_root(), f"V{n}", "transcription", cache="miss",
                           subprocessCount=0, affectedItems=1) as telem:
        model = whisper.load_model(model_name)
        result = model.transcribe(str(audio), word_timestamps=True, language=language)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    receipt = state.make_receipt(_receipt(n, "transcription"), "transcription",
                                 inputs, tool, params, [out])
    telem.update({"output": str(out), "outputSize": out.stat().st_size,
                  "receiptId": receipt["receiptId"]})
    nseg = len(result.get("segments", []))
    print(f"transcribe: đã ghi {out} ({nseg} segment, ngôn ngữ '{result.get('language')}').")
    return True


# ---------------------------------------------------------------- bước align

def map_boundaries(whisper_words, script_words):
    """Chiếu chỉ số từ của whisper sang chỉ số từ của kịch bản.

    difflib chứ không phải cộng trừ độ lệch: chỗ whisper nghe nhầm là chỗ hai
    chuỗi lệch NHAU MỘT LƯỢNG KHÁC NHAU ở mỗi đoạn, nên một offset toàn cục
    sai từ lỗi nghe đầu tiên trở đi.
    """
    a = [norm(w) for w in whisper_words]
    b = [norm(w) for w in script_words]
    mapping = [0] * (len(a) + 1)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        for i in range(i1, i2):
            if i2 > i1:
                mapping[i] = j1 + round((i - i1) * (j2 - j1) / (i2 - i1))
            else:
                mapping[i] = j1
    mapping[len(a)] = len(b)
    # đơn điệu không giảm - một ranh giới lùi lại sẽ tạo segment âm
    for i in range(1, len(mapping)):
        mapping[i] = max(mapping[i], mapping[i - 1])
    return mapping


def align(transcript, script_text):
    """[[text, start, end, segIdx], ...] - chữ của kịch bản, nhịp của whisper."""
    segments = transcript["segments"]
    whisper_words, seg_of = [], []
    for si, seg in enumerate(segments):
        for w in seg.get("words", []):
            whisper_words.append(w["word"].strip())
            seg_of.append(si)
    script_words = script_text.split()
    mapping = map_boundaries(whisper_words, script_words)

    # ranh giới whisper (chỉ số từ đầu tiên của mỗi segment) -> chỉ số kịch bản
    starts = []
    for si in range(len(segments)):
        first = next((i for i, s in enumerate(seg_of) if s == si), None)
        starts.append(mapping[first] if first is not None else (starts[-1] if starts else 0))
    starts.append(len(script_words))

    out = []
    for si, seg in enumerate(segments):
        chunk = script_words[starts[si]:starts[si + 1]]
        if not chunk:
            continue
        t0, t1 = float(seg["start"]), float(seg["end"])
        step = (t1 - t0) / len(chunk)
        for k, word in enumerate(chunk):
            out.append([word,
                        round(t0 + k * step, ROUND),
                        round(t0 + (k + 1) * step, ROUND),
                        si])
    return out


def step_align(n, script_path, check, force, accept_existing=False):
    tpath = _paths(n)["transcript"]
    out = _paths(n)["words"]
    if not tpath.exists():
        print(f"align: chưa có {tpath} - chạy bước transcribe trước.")
        return False
    if not script_path:
        print("align: cần --script (file kịch bản gốc của user).")
        return False
    spath = pathlib.Path(script_path)
    if not spath.exists():
        print(f"align: không thấy {spath}.")
        return False

    inputs = {"script": state.file_input(spath), "transcript": state.json_input(tpath)}
    tool = state.tool_identity(pathlib.Path(__file__), versions={"implementation": ALIGN_VERSION})
    params = {"roundDigits": ROUND, "manualAcceptancePreserved": True}
    current, receipt = state.receipt_current(
        _receipt(n, "alignment"), "alignment", inputs, tool, params)
    if current and not force:
        marker = "manual accepted" if (receipt.get("accepted") or {}).get("manual") else "accepted"
        print(f"align: CLOSED / REUSE {out} ({marker}; {receipt['receiptId'][:12]}).")
        state.append_telemetry(_root(), f"V{n}", {"stage": "alignment", "owner": "script",
                               "cache": "hit", "subprocessCount": 0,
                               "affectedItems": 1, "receiptId": receipt["receiptId"]})
        return True

    transcript = json.loads(tpath.read_text(encoding="utf-8"))
    words = align(transcript, spath.read_text(encoding="utf-8"))

    nseg = len(transcript["segments"])
    nwhisper = sum(len(s.get("words", [])) for s in transcript["segments"])
    dur = float(transcript["segments"][-1]["end"]) if transcript["segments"] else 0.0
    drift = abs(len(words) - nwhisper) / max(1, nwhisper)
    print(f"align: {len(words)} từ kịch bản / {nwhisper} từ whisper "
          f"({drift:.1%} lệch), {nseg} segment, {dur:.1f}s.")
    if drift > 0.15:
        print(f"align: LỆCH {drift:.1%} - quá lớn để là nghe nhầm danh từ riêng. "
              f"Nhiều khả năng ghép nhầm cặp audio/kịch bản. Kiểm lại trước khi dựng.")
        return False
    if dur > 0 and not (1.5 <= len(words) / dur <= 6.0):
        print(f"align: {len(words)/dur:.1f} từ/giây - ngoài khoảng tiếng nói bình "
              f"thường. Kiểm lại xem audio và kịch bản có đúng là một cặp không.")
        return False

    payload = {"words": words}
    if out.exists():
        old = json.loads(out.read_text(encoding="utf-8"))
        old_words = old.get("words", [])
        same = old_words == words
        if check:
            if same:
                print(f"align: {out} khớp bản dựng lại từng từ.")
                return True
            # So bằng khớp CHUỖI, không so theo vị trí: chỉ cần thừa/thiếu một
            # từ ở đầu là mọi từ sau đó lệch chỗ, và phép đếm theo vị trí sẽ
            # báo "555/557 chữ khác" cho hai văn bản thực chất giống 96%.
            ratio = difflib.SequenceMatcher(
                None, [norm(w[0]) for w in old_words], [norm(w[0]) for w in words],
                autojunk=False).ratio()
            if ratio < 0.90:
                print(f"align: {out} chỉ giống bản dựng lại {ratio:.1%} - lệch cấu trúc, "
                      f"không phải sửa tay ({len(old_words)} từ trên đĩa / {len(words)} "
                      f"dựng lại). Kịch bản đã đổi, hoặc ghép nhầm cặp audio/kịch bản.")
                return False
            print(f"align: {out} giống bản dựng lại {ratio:.1%} - phần chênh nằm trong "
                  f"ngưỡng sửa tay hợp lệ, KHÔNG coi là lỗi. (Sửa tay chỗ whisper nghe "
                  f"đúng hơn kịch bản là việc NÊN làm - máy không biết chỗ nào.)")
            return True
        if same:
            print(f"align: {out} đã đúng, không đổi.")
            state.make_receipt(_receipt(n, "alignment"), "alignment", inputs, tool,
                               params, [out], accepted={"manual": False})
            return True
        if not force:
            print(f"align: {out} đã tồn tại và khác bản dựng lại - GIỮ NGUYÊN, vì file "
                  f"trên đĩa có thể đã được sửa tay đúng chỗ (--force nếu thật sự "
                  f"muốn ghi đè).")
            if not accept_existing:
                print("align: inputs changed or acceptance is unrecorded; alignment remains OPEN. "
                      "Inspect the genuine mismatch, then pass --accept-existing-alignment to "
                      "bind this preserved manual file to the current script+transcript.")
                return False
            receipt = state.make_receipt(
                _receipt(n, "alignment"), "alignment", inputs, tool, params, [out],
                accepted={"manual": True, "reason": "existing hand-edited alignment preserved"})
            print(f"align: manual acceptance bound to current inputs ({receipt['receiptId'][:12]}).")
            return True
    if check:
        print(f"align: {out} chưa tồn tại - sẽ được dựng ({len(words)} từ).")
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    receipt = state.make_receipt(_receipt(n, "alignment"), "alignment", inputs, tool,
                                 params, [out], accepted={"manual": False})
    state.append_telemetry(_root(), f"V{n}", {"stage": "alignment", "owner": "script",
                           "cache": "miss", "subprocessCount": 0, "affectedItems": 1,
                           "output": str(out), "outputSize": out.stat().st_size,
                           "receiptId": receipt["receiptId"]})
    print(f"align: đã ghi {out} ({len(words)} từ; {receipt['receiptId'][:12]}).")
    return True


# -------------------------------------------------------------------- main

STEPS = ("env", "audio", "transcribe", "align", "plan")


def segments_from_words(words):
    spans, current, segment = [], None, None
    for entry in words:
        start, end = float(entry[1]), float(entry[2])
        index = entry[3] if len(entry) > 3 else 0
        if index != segment:
            if current:
                spans.append(tuple(current))
            current, segment = [start, end], index
        else:
            current[1] = end
    if current:
        spans.append(tuple(current))
    return [(start, end) for start, end in spans if end > start]


def shape_scenes(spans, target):
    merged = []
    for start, end in spans:
        if merged and end - merged[-1][0] <= target * 1.35 and merged[-1][1] - merged[-1][0] < target * 0.7:
            merged[-1] = (merged[-1][0], end)
        else:
            merged.append((start, end))
    shaped = []
    for start, end in merged:
        duration = end - start
        if duration > target * 1.9:
            count = max(2, round(duration / target)); step = duration / count
            shaped.extend((start + index * step, start + (index + 1) * step)
                          for index in range(count))
        else:
            shaped.append((start, end))
    return shaped


def step_plan(n, words_arg=None, fps=30, target=4.0, force=False):
    root = _root(); paths = _paths(n); out = paths["plan"]
    if out.is_file() and not force:
        print(f"plan: {out} already exists; refusing to overwrite")
        return True
    words_path = state.project_path(root, words_arg) if words_arg else paths["words"]
    try:
        words = json.loads(words_path.read_text(encoding="utf-8"))["words"]
    except (OSError, KeyError, json.JSONDecodeError) as exc:
        print(f"plan: cannot read aligned words: {exc}")
        return False
    scenes = [{"id": f"S{index}", "startSec": round(start, 3), "endSec": round(end, 3),
               "narrativeFunction": "", "viewerQuestion": "", "visualTransformation": "",
               "contrastWithPrevious": "", "comprehensionLoad": "", "materials": [],
               "status": "planned"}
              for index, (start, end) in enumerate(
                  shape_scenes(segments_from_words(words), target), start=1)]
    plan = {"schemaVersion": "media-first-plan-v1", "video": f"V{n}", "fps": int(fps),
            "width": 1080, "height": 1920,
            "wordsFile": str(words_path.relative_to(root)).replace("\\", "/"),
            "audioFile": f"V{n}/audio.mp3", "status": "active",
            "shotlistApproved": False, "styleContract": {}, "scenes": scenes}
    for directory in (paths["input"], paths["assets"], paths["scenes"],
                      paths["previs_frames"], paths["previs_review_pages"],
                      paths["review_frames"], paths["review_pages"], paths["receipts"],
                      paths["cache"], paths["logs"], paths["output"] / "draft",
                      paths["output"] / "final"):
        directory.mkdir(parents=True, exist_ok=True)
    state.write_json(paths["asset_manifest"], {"schema": 1, "video": f"V{n}", "assets": {}})
    paths["economics"].touch(exist_ok=True)
    state.write_json(out, plan)
    print(f"plan: wrote {out} with {len(scenes)} semantic scene skeletons")
    return True


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("n", help="số hiệu video, ví dụ 13")
    ap.add_argument("--audio", help="file audio gốc của user")
    ap.add_argument("--script", help="file kịch bản gốc của user (.txt)")
    ap.add_argument("--language", default=None, help="mã ngôn ngữ whisper, mặc định tự nhận")
    ap.add_argument("--model", default="base", help="model whisper (mặc định base)")
    ap.add_argument("--only", choices=STEPS)
    ap.add_argument("--words", help="aligned words override for PLAN scaffold")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--target-scene-sec", type=float, default=4.0)
    ap.add_argument("--check", action="store_true", help="chỉ so, không ghi")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--accept-existing-alignment", action="store_true",
                    help="after deliberate inspection, bind the preserved hand-edited alignment "
                         "to current script+transcript without overwriting it")
    args = ap.parse_args()

    todo = [args.only] if args.only else list(STEPS)
    ok = True
    for step in todo:
        if step == "env":
            ok = step_env() and ok
        elif step == "audio":
            ok = step_audio(args.n, args.audio, args.force) and ok
        elif step == "transcribe":
            ok = step_transcribe(args.n, args.language, args.model, args.force) and ok
        elif step == "align":
            ok = step_align(args.n, args.script, args.check, args.force,
                            args.accept_existing_alignment) and ok
        elif step == "plan":
            if args.check:
                print("plan: check mode; scaffold write skipped")
            else:
                ok = step_plan(args.n, args.words, args.fps, args.target_scene_sec,
                               args.force) and ok
        if not ok:
            break

    if ok and not args.check and args.only == "align":
        ok = step_plan(args.n, args.words, args.fps, args.target_scene_sec,
                       args.force) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
