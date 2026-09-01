"""cutout_gate.py - chấm điểm ảnh đã tách nền bằng SỐ ĐO, không bằng mắt.

Vì sao tồn tại: cắt một ảnh tốn vài giây và gần như không tốn token. Cái đắt
là CHẤM ĐIỂM nó. Không có thước nào đo "viền có sạch không", nên mỗi ảnh phải
được mở ra nhìn - và nhìn bằng mắt thì không đáng tin, nên phải nhìn lại. SKILL.md
đã ghi lại đúng cái giá đó: hai tài sản V10 lọt lưới với lỗi nhìn thấy được,
sau khi một contact sheet đã "duyệt" chúng.

Năm phép đo, mỗi phép nhắm một lỗi đã thực sự xảy ra:

  chroma ở viền   Ảnh AI vẽ ra phông xanh kèm bóng đổ và viền sáng hắt lên
                  chủ thể. Không đo bằng "có bao nhiêu pixel xanh" - một cái
                  cây thì xanh thật. Đo bằng CHÊNH LỆCH giữa dải viền và phần
                  ruột: xanh dồn ở mép mà ruột không xanh thì đó là spill, còn
                  xanh đều cả trong lẫn ngoài thì đó là vật thật.
  dải viền mờ     Nền bị khử dở để lại một quầng alpha lưng chừng - thứ đọc ra
                  thành "khói" quanh cutout. Một cutout sạch chỉ có 1-2px khử
                  răng cưa: với chu vi P, diện tích A, tỉ lệ ~ P*w/A, cỡ vài
                  phần trăm. Trên 12% là quầng thật chứ không phải răng cưa.
  mảnh vụn        Bóng đổ hoặc phản chiếu bị nhận nhầm là chủ thể, đứng rời ra.
  chạm mép        crop_to_content luôn chừa lề >= 4px, nên một cutout đúng
                  KHÔNG BAO GIỜ chạm mép ảnh. Chạm mép nghĩa là hoặc còn
                  nguyên khối nền hình chữ nhật, hoặc chủ thể bị cắt cụt.
  độ phủ          Gần 100% = không khử được gì. Gần 0% = khử mất luôn chủ thể.

Ngưỡng ở đây suy ra từ hình học và từ hành vi của chính process_cutout.py,
không phải dò bằng cách chạy lại cho tới khi hết báo lỗi.

    py -3 cutout_gate.py public/el11_*.png
    py -3 cutout_gate.py public/ --video 11
    py -3 cutout_gate.py public/el11_x.png --json
"""

import argparse
import glob
import json
import pathlib
import sys

import stage_state as state

import numpy as np
from PIL import Image
from scipy import ndimage

# Visual role and processing need are separate. Only an explicit/recorded cutout
# declaration makes this conditional gate applicable.

OPAQUE = 200                # alpha coi như đặc
PRESENT = 20                # alpha coi như có mực (khớp clean_mask/crop_to_content)
EDGE_BAND = 6               # px, bề dày dải viền đem so với ruột

# Chroma "tinh khiết" theo nghĩa phông nền: rất bão hoà VÀ lệch hẳn về một
# kênh. Ngưỡng lấy từ CHROMA_RGB trong process_cutout.py (0,255,0) / (255,0,255).
CHROMA_MIN = 150            # kênh trội phải sáng tới mức này
CHROMA_GAP = 60             # và phải vượt các kênh còn lại chừng này

MAX_EDGE_CHROMA = 0.08      # >8% dải viền là chroma -> nhìn thấy được
EDGE_VS_CORE = 3.0          # và phải đậm hơn ruột chừng này mới gọi là spill
MAX_FEATHER = 0.12          # xem giải thích "dải viền mờ" ở trên
MAX_BORDER = 0.02           # crop_to_content chừa lề, nên đúng ra phải là 0
MIN_COVERAGE = 0.02
MAX_COVERAGE = 0.97
ISLAND_MIN_FRAC = 0.01      # mảnh >=1% mảnh lớn nhất mới được tính là mảnh
MAX_ISLANDS = 3


def chroma_mask(rgb):
    r, g, b = (rgb[:, :, i].astype(np.int16) for i in range(3))
    green = (g > CHROMA_MIN) & (g - r > CHROMA_GAP) & (g - b > CHROMA_GAP)
    magenta = ((r > CHROMA_MIN) & (b > CHROMA_MIN)
               & (r - g > CHROMA_GAP) & (b - g > CHROMA_GAP))
    return green | magenta


def measure(path):
    try:
        im = Image.open(path)
        im.load()
    except (OSError, ValueError) as exc:
        return {"error": f"không đọc được output cutout: {exc}"}
    if im.mode != "RGBA":
        return {"error": f"không phải RGBA ({im.mode}) - ảnh này chưa tách nền"}
    arr = np.asarray(im)
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    h, w = alpha.shape

    present = alpha >= PRESENT
    opaque = alpha >= OPAQUE
    n_present = int(present.sum())
    if n_present == 0:
        return {"error": "toàn bộ ảnh trong suốt - đã khử mất chủ thể"}

    # Dải viền = phần đặc nằm sát ranh giới trong suốt.
    outside = ~present
    near_outside = ndimage.binary_dilation(outside, iterations=EDGE_BAND)
    edge = opaque & near_outside
    core = opaque & ~near_outside

    ch = chroma_mask(rgb)
    edge_chroma = float(ch[edge].mean()) if edge.any() else 0.0
    core_chroma = float(ch[core].mean()) if core.any() else 0.0

    feather = float(((alpha > PRESENT) & (alpha < 235)).sum()) / n_present

    labeled, n = ndimage.label(present)
    islands = 0
    if n:
        sizes = ndimage.sum(present, labeled, range(1, n + 1))
        islands = int((sizes >= sizes.max() * ISLAND_MIN_FRAC).sum())

    border = np.concatenate([opaque[0, :], opaque[-1, :],
                             opaque[:, 0], opaque[:, -1]])
    return {
        "size": f"{w}x{h}",
        "edge_chroma": round(edge_chroma, 4),
        "core_chroma": round(core_chroma, 4),
        "feather": round(feather, 4),
        "islands": islands,
        "border": round(float(border.mean()), 4),
        "coverage": round(n_present / (w * h), 4),
    }


def judge(name, m):
    if "error" in m:
        return [f"{name}: {m['error']}"]
    bad = []
    if (m["edge_chroma"] > MAX_EDGE_CHROMA
            and m["edge_chroma"] > EDGE_VS_CORE * (m["core_chroma"] + 0.01)):
        bad.append(
            f"{name}: viền còn ám màu phông - {m['edge_chroma']:.1%} dải viền là "
            f"chroma trong khi ruột chỉ {m['core_chroma']:.1%}. Đây là quầng/hắt "
            f"sáng của phông, không phải màu thật của vật. Cắt lại với --bg-mode "
            f"khác, hoặc sinh lại ảnh nguồn với phông phẳng không đổ bóng.")
    if m["feather"] > MAX_FEATHER:
        bad.append(
            f"{name}: {m['feather']:.1%} pixel nằm ở alpha lưng chừng (trần "
            f"{MAX_FEATHER:.0%}) - đây là quầng khói quanh cutout, không phải khử "
            f"răng cưa. Thử --model birefnet-general.")
    if m["border"] > MAX_BORDER:
        bad.append(
            f"{name}: {m['border']:.1%} viền ảnh vẫn đặc. crop_to_content luôn "
            f"chừa lề, nên chạm mép nghĩa là còn sót khối nền hình chữ nhật hoặc "
            f"chủ thể bị cắt cụt.")
    if m["coverage"] > MAX_COVERAGE:
        bad.append(
            f"{name}: {m['coverage']:.0%} ảnh vẫn đặc - gần như không khử được gì. "
            f"Kiểm tra dòng `removal:` xem nó chọn nhầm phương pháp không.")
    if m["coverage"] < MIN_COVERAGE:
        bad.append(f"{name}: chỉ còn {m['coverage']:.1%} ảnh - đã khử mất chủ thể.")
    if m["islands"] > MAX_ISLANDS:
        bad.append(
            f"{name}: {m['islands']} mảnh rời (trần {MAX_ISLANDS}) - bóng đổ hoặc "
            f"phản chiếu đang bị giữ lại như thể là chủ thể.")
    return bad


def unusable(name, m):
    """Integrity failures only: processing/readability failed or no subject remains.

    Chroma, feather, border, coverage-at-the-high-end and fragments are useful
    aesthetic evidence, but a production hook must not confuse them with a file
    that cannot be used at all.
    """
    if "error" in m:
        return [f"{name}: {m['error']}"]
    if m["coverage"] < MIN_COVERAGE:
        return [f"{name}: chỉ còn {m['coverage']:.1%} ảnh - đã khử mất chủ thể."]
    return []


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+", help="file .png hoặc thư mục")
    ap.add_argument("--video", default=None,
                    help="lọc theo số video khi truyền vào một thư mục, vd 11")
    ap.add_argument("--plan", default=None,
                    help="scene_plan<N>.json - để biết ảnh nào PHẢI là cutout")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--hook", action="store_true",
                    help="production-hook policy: ordinary cutout imperfections warn; only "
                         "unreadable/empty output blocks")
    args = ap.parse_args()

    declared = set()
    if args.plan:
        args.plan = state.project_path(state.project_root(__file__), args.plan)
        data = json.loads(pathlib.Path(args.plan).read_text(encoding="utf-8"))
        root = state.project_root(args.plan)
        manifest = state.read_json(state.video_paths(root, data.get("video", "V"))["asset_manifest"], {})
        for scene in data.get("scenes", []):
            for asset in scene.get("assets", []):
                src = (asset.get("src") or "").replace("\\", "/").split("/")[-1]
                if src and state.asset_requires_cutout(asset, manifest):
                    declared.add(src)

    files = []
    for p in args.paths:
        path = pathlib.Path(p)
        if path.is_dir():
            if args.plan:
                files += sorted(path / name for name in declared if (path / name).exists())
            else:
                pat = f"el{args.video}_*.png" if args.video else "el*_*.png"
                files += sorted(path.glob(pat))
        else:
            files += [pathlib.Path(f) for f in glob.glob(p)] or [path]
    files = [f for f in files if f.exists()]
    if not files:
        # "Chưa tới lúc" khác hẳn "có lỗi". Một video mới đi qua bước 2 (lập
        # kế hoạch) trước bước 3 (đi tìm ảnh), nên ở lượt đầu tiên thư mục
        # public/ chưa có gì cả. Bản đầu của gate này thoát 1 ở đây, tức là
        # hook Stop chặn cứng mọi video mới ngay từ lượt đầu - đo thật trên
        # một V12 giả lập mới phát hiện ra.
        #
        # Không phải lỗ hổng: khi cảnh đã dựng mà thiếu tài sản đã lên kế
        # hoạch thì build_gate.py mới là chỗ báo. Chỉ nới cho chế độ hook
        # (--plan có mặt); gọi tay mà không thấy file thì vẫn là lỗi gõ nhầm.
        msg = "Chưa có cutout nào cho video này - chưa tới bước 3 (đi tìm ảnh)."
        if args.plan:
            print(f"OK   {msg}")
            sys.exit(0)
        print("Không tìm thấy file nào.", file=sys.stderr)
        sys.exit(1)

    rows, problems, blockers, skipped = {}, [], [], []
    for f in files:
        if args.plan and f.name not in declared:
            skipped.append(f"{f.name} (cutout not declared/recorded)")
            continue
        m = measure(f)
        # Không có plan thì không thể biết ảnh RGB là nền toàn khung (đúng) hay
        # là hero quên cắt (sai). Báo ra chứ không kết tội.
        if not args.plan and "error" in m and "RGBA" in m["error"]:
            skipped.append(f"{f.name} (không có trong plan, không phải RGBA)")
            continue
        rows[f.name] = m
        problems += judge(f.name, m)
        blockers += unusable(f.name, m)

    if args.json:
        print(json.dumps({"passed": not problems, "measurements": rows,
                          "problems": problems}, ensure_ascii=False, indent=2))
    else:
        print(f"{'file':<34}{'viền':>7}{'ruột':>7}{'mờ':>7}{'mép':>7}{'phủ':>7}{'mảnh':>6}")
        for name, m in rows.items():
            if "error" in m:
                print(f"{name[:33]:<34}  {m['error']}")
                continue
            print(f"{name[:33]:<34}{m['edge_chroma']:>7.1%}{m['core_chroma']:>7.1%}"
                  f"{m['feather']:>7.1%}{m['border']:>7.1%}{m['coverage']:>7.0%}"
                  f"{m['islands']:>6}")
        print()
        if skipped:
            print(f"     bỏ qua {len(skipped)} ảnh không dùng làm cutout: "
                  + ", ".join(skipped[:5])
                  + (f" ... +{len(skipped) - 5}" if len(skipped) > 5 else ""))
            print()
        for p in problems:
            print(f"{'FAIL' if (not args.hook or p in blockers) else 'WARN'} {p}")
        if not problems:
            print(f"OK   {len(files)} cutout: viền không ám màu phông, không quầng "
                  f"khói, không chạm mép, không mảnh vụn")
        effective = blockers if args.hook else problems
        print(f"\n{'FAILED' if effective else 'PASSED'} ({len(effective)} blocking, "
              f"{len(problems) - len(effective)} advisory problem(s))")

    sys.exit(1 if (blockers if args.hook else problems) else 0)


if __name__ == "__main__":
    main()
