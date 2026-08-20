"""
init_video.py - từ (audio + kịch bản) ra input/words<N>_aligned.json. Bước 0+1.

Trước script này, mỗi video đều bắt đầu bằng một nắm lệnh Python gõ inline:
kiểm môi trường, chép audio, gọi whisper, rồi ghép chữ của kịch bản với thời
gian của whisper bằng tay. Việc ghép đó không hề đơn giản - whisper nghe nhầm
danh từ riêng ("Itaewon" -> "Y Tự Quận", 1 từ thành 3), nên đếm từ không khớp
1:1 và mọi cách "cộng trừ độ lệch" đều sai từ chỗ nghe nhầm trở đi.

    py -3 init_video.py 13 --audio "D:/thu/Audio13.mp3" --script "D:/thu/Script13.txt"
    py -3 init_video.py 13 --only align --script ... --check   # chỉ so, không ghi

Bốn bước, mỗi bước tự bỏ qua nếu đã có kết quả (dùng --force để làm lại):

  env        đủ whisper/rembg/scipy/PIL/numpy/requests chưa
  audio      chép về public/audio<N>.mp3
  transcribe whisper word_timestamps -> input/transcript<N>.json
  align      kịch bản + thời gian whisper -> input/words<N>_aligned.json

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
import json
import pathlib
import re
import shutil
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

NEEDED = ("whisper", "rembg", "scipy", "PIL", "numpy", "requests")
ROUND = 3


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
    dest = pathlib.Path(f"public/audio{n}.mp3")
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
    if dest.exists() and not force and dest.stat().st_size == src.stat().st_size:
        print(f"audio: {dest} đã khớp nguồn, bỏ qua.")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    print(f"audio: đã chép {src.name} -> {dest}.")
    return True


# ----------------------------------------------------------- bước transcribe

def step_transcribe(n, language, model_name, force):
    out = pathlib.Path(f"input/transcript{n}.json")
    if out.exists() and not force:
        print(f"transcribe: đã có {out}, bỏ qua (dùng --force để chạy lại).")
        return True
    audio = pathlib.Path(f"public/audio{n}.mp3")
    if not audio.exists():
        print(f"transcribe: chưa có {audio} - chạy bước audio trước.")
        return False
    try:
        import whisper
    except ImportError:
        print("transcribe: chưa cài whisper.")
        return False
    print(f"transcribe: đang chạy whisper '{model_name}' trên {audio} "
          f"(mất vài phút, đừng ngắt)...")
    model = whisper.load_model(model_name)
    result = model.transcribe(str(audio), word_timestamps=True, language=language)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
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


def step_align(n, script_path, check, force):
    tpath = pathlib.Path(f"input/transcript{n}.json")
    out = pathlib.Path(f"input/words{n}_aligned.json")
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
            return True
        if not force:
            print(f"align: {out} đã tồn tại và khác bản dựng lại - GIỮ NGUYÊN, vì file "
                  f"trên đĩa có thể đã được sửa tay đúng chỗ (--force nếu thật sự "
                  f"muốn ghi đè).")
            return True
    if check:
        print(f"align: {out} chưa tồn tại - sẽ được dựng ({len(words)} từ).")
        return True
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"align: đã ghi {out} ({len(words)} từ).")
    return True


# -------------------------------------------------------------------- main

STEPS = ("env", "audio", "transcribe", "align")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("n", help="số hiệu video, ví dụ 13")
    ap.add_argument("--audio", help="file audio gốc của user")
    ap.add_argument("--script", help="file kịch bản gốc của user (.txt)")
    ap.add_argument("--language", default=None, help="mã ngôn ngữ whisper, mặc định tự nhận")
    ap.add_argument("--model", default="base", help="model whisper (mặc định base)")
    ap.add_argument("--only", choices=STEPS)
    ap.add_argument("--check", action="store_true", help="chỉ so, không ghi")
    ap.add_argument("--force", action="store_true")
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
            ok = step_align(args.n, args.script, args.check, args.force) and ok
        if not ok:
            break

    if ok and not args.check and (args.only in (None, "align")):
        print(f"\nTiếp theo - dựng khung kế hoạch rồi điền bước 2a/2b (SKILL.md):\n"
              f"    py -3 .claude/skills/vox-collage-video/scripts/new_video.py {args.n} "
              f"--words input/words{args.n}_aligned.json")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
