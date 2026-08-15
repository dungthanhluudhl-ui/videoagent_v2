/**
 * S17 - Buổi tối hôm đó bắt đầu thế nào?
 *
 * ảnh phố lúc chiều muộn đã dày người, dòng người vẫn chảy vào không dứt
 *
 * comprehensionLoad: moderate - 116 frames (3.9s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Chỗ hạ nhịp giữa hai khối số liệu (S16) và cơ chế (S18): hiện trường thật,
 * một mũi tên, không thêm gì nữa.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V11SCENE17_DURATION = 116;

export const V11Scene17 = () => (
  <AbsoluteFill name="V11Scene17">
    <BackgroundPhoto name="Bg-Afternoon" src="el10_commerce_day.png" durationInFrames={116}
                     tint={0.44} focus="50% 50%" drift={0.06} />

    <Sequence from={5} layout="none">
      <PunchPhrase lines={["MỚI GIỮA CHIỀU"]} top={190} fontSize={70} onDark />
    </Sequence>

    {/* mốc giờ, để "giữa chiều" là một thời điểm chứ không phải cảm giác */}
    <DiagramCanvas y={330} height={260}>
      <DrawnPath d="M 340 160 L 740 160" delay={12} drawFrames={16} length={400}
                 stroke="#F2EFE7" strokeWidth={5} opacity={0.8} />
      <text x={540} y={126} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 52, fontWeight: 900, letterSpacing: 4 }}>
        16:00
      </text>
      <text x={540} y={218} textAnchor="middle" fill="#F2EFE7"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 700 }}>
        đã vô cùng đông đúc
      </text>
    </DiagramCanvas>

    {/* dòng người vẫn chảy vào */}
    <DiagramCanvas y={940} height={310}>
      <DrawnPath d="M 90 120 L 620 120 M 586 96 L 620 120 L 586 144" delay={74}
                 drawFrames={14} length={600} stroke="#C2410C" strokeWidth={10} />
      <DrawnPath d="M 90 210 L 500 210 M 466 186 L 500 210 L 466 234" delay={84}
                 drawFrames={14} length={480} stroke="#C2410C" strokeWidth={8} opacity={0.8} />
      <text x={840} y={176} textAnchor="middle" fill="#F2EFE7"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 38, fontWeight: 900 }}>
        VẪN ĐỔ VỀ
      </text>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
