/**
 * S12 - Địa hình ở đây có gì đặc biệt?
 *
 * khoảng cách giữa hai dãy nhà co lại, rồi cả mặt đất nghiêng đi và nhà mọc trên dốc
 *
 * comprehensionLoad: complex - 230 frames (7.7s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Ba tầng vẽ, mỗi tầng một nhịp: hẹp (0) -> phẳng bị phủ định (118) -> dốc
 * (192). Đây là cảnh nạp thông tin nặng nhất nửa đầu nên nó cũng dài nhất -
 * nhiều minh hoạ hơn nhưng cắt CHẬM hơn.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DimensionLine, DrawnPath, SlopeIndicator, DrawnText } from "./visualLanguage";

export const V11SCENE12_DURATION = 230;

export const V11Scene12 = () => (
  <AbsoluteFill name="V11Scene12">
    <SceneBackground variant="grid" />

    {/* tầng 1 - hai dãy nhà và khoảng hở giữa chúng co lại */}
    <DiagramCanvas y={300} height={340}>
      <DrawnPath d="M 70 40 L 400 40 L 400 300 L 70 300 Z" delay={0} drawFrames={16}
                 length={1180} strokeWidth={6} />
      <DrawnPath d="M 680 40 L 1010 40 L 1010 300 L 680 300 Z" delay={8} drawFrames={16}
                 length={1180} strokeWidth={6} />
      <DrawnPath d="M 120 90 L 180 90 M 120 150 L 180 150 M 120 210 L 180 210"
                 delay={20} drawFrames={12} length={180} strokeWidth={4} opacity={0.5} />
      <DrawnPath d="M 900 90 L 960 90 M 900 150 L 960 150 M 900 210 L 960 210"
                 delay={24} drawFrames={12} length={180} strokeWidth={4} opacity={0.5} />
      <DimensionLine x1={400} y1={170} x2={680} y2={170} label="HẸP DẦN" delay={40}
                     offset={0} fontSize={36} />
      <DrawnPath d="M 470 250 L 400 250 M 424 234 L 400 250 L 424 266" delay={62}
                 drawFrames={9} length={100} stroke="#C2410C" strokeWidth={7} />
      <DrawnPath d="M 610 250 L 680 250 M 656 234 L 680 250 L 656 266" delay={62}
                 drawFrames={9} length={100} stroke="#C2410C" strokeWidth={7} />
    </DiagramCanvas>

    {/* tầng 2 - mặt đất phẳng bị gạch bỏ */}
    <DiagramCanvas y={660} height={260}>
      <DrawnPath d="M 90 130 L 990 130" delay={118} drawFrames={18} length={900}
                 strokeWidth={7} />
      <DrawnText delay={118} x={540} y={90} textAnchor="middle" fill="#1A1A1A" opacity={0.55}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 800 }}>
        KHÔNG HỀ BẰNG PHẲNG
      </DrawnText>
      <DrawnPath d="M 250 74 L 830 74" delay={148} drawFrames={10} length={580}
                 stroke="#C2410C" strokeWidth={9} />
    </DiagramCanvas>

    {/* tầng 3 - mặt đất nghiêng, nhà dựng ngay trên dốc */}
    <DiagramCanvas y={880} height={370}>
      <DrawnPath d="M 90 280 L 990 80" delay={192} drawFrames={20} length={922} strokeWidth={9} />
      <SlopeIndicator x1={90} y1={280} x2={990} y2={80} label="DỐC" delay={196} />
      <DrawnPath d="M 250 236 L 250 156 L 360 132 L 360 212 Z" delay={202} drawFrames={12}
                 length={420} strokeWidth={5} />
      <DrawnPath d="M 500 180 L 500 100 L 610 76 L 610 156 Z" delay={210} drawFrames={12}
                 length={420} strokeWidth={5} />
      <DrawnPath d="M 750 124 L 750 44 L 860 20 L 860 100 Z" delay={218} drawFrames={12}
                 length={420} strokeWidth={5} />
    </DiagramCanvas>

    <Sequence from={192} layout="none">
      <PunchPhrase lines={["HẸP DẦN", "VÀ DỐC"]} top={176} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
