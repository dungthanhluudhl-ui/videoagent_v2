/**
 * S8 - Vì sao lại phải đổi tên?
 *
 * những tên gọi cũ bị gạch bỏ từng cái một trên mặt giấy
 *
 * comprehensionLoad: moderate - 116 frames (3.9s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Chỉ gạch những tên mà chính lời thoại đã nêu - không bịa thêm tên "không
 * nhã nhặn" nào khác cho đủ danh sách.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V11SCENE8_DURATION = 116;

const StruckName = ({ y, text, delay }) => (
  <g>
    <text x={110} y={y} fill="#1A1A1A"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 54, fontWeight: 800 }}>
      {text}
    </text>
    <DrawnPath d={`M 96 ${y - 18} L 900 ${y - 18}`} delay={delay} drawFrames={9}
               length={810} stroke="#C2410C" strokeWidth={9} />
  </g>
);

export const V11Scene8 = () => (
  <AbsoluteFill name="V11Scene8">
    <BackgroundPhoto name="Bg-Erase" src="el10_archive_paper.png" durationInFrames={116}
                     wash="paper" tint={0.52} grayscale={0.6} drift={0.04} />

    <Sequence from={16} layout="none">
      <PunchPhrase lines={["XOÁ KÝ ỨC CŨ"]} top={196} fontSize={70} />
    </Sequence>

    <DiagramCanvas y={380} height={430}>
      <StruckName y={90} text="DỊ THÁI VIỆN" delay={51} />
      <StruckName y={216} text="NƠI LY TÁN" delay={63} />
      <StruckName y={342} text="KÝ ỨC BUỒN" delay={75} />
    </DiagramCanvas>

    {/* mảng bôi đen phủ lên phần giấy còn lại - động tác "xoá bỏ" thành hình */}
    <DiagramCanvas y={840} height={410}>
      <DrawnPath d="M 110 40 L 970 40 L 970 250 L 110 250 Z" delay={84} drawFrames={16}
                 length={2140} strokeWidth={5} dashed />
      <DrawnPath d="M 130 70 L 950 70 M 130 118 L 950 118 M 130 166 L 950 166 M 130 214 L 950 214"
                 delay={90} drawFrames={20} length={3300} stroke="#1A1A1A" strokeWidth={22}
                 opacity={0.82} />
      <text x={540} y={330} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 36, fontWeight: 900 }}>
        CẦN MỘT CÁI TÊN KHÁC
      </text>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
