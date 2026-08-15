/**
 * S18 - Đến mấy giờ thì bắt đầu nguy hiểm?
 *
 * đồng hồ chỉ 8 giờ tối, mặt cắt lối đi hẹp lại và các mũi tên bắt đầu chèn nhau
 *
 * comprehensionLoad: complex - 152 frames (5.1s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Lần đầu THỜI GIAN và KHÔNG GIAN đứng chung một khung: mốc giờ ở trên, mặt
 * cắt lối đi ở dưới - đó là điều kiện để phần sau nói về cái phễu.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText, ForceArrow } from "./visualLanguage";

export const V11SCENE18_DURATION = 152;

export const V11Scene18 = () => (
  <AbsoluteFill name="V11Scene18">
    <SceneBackground variant="chart" />

    {/* mặt đồng hồ chỉ 20:00 */}
    <DiagramCanvas y={330} height={430}>
      <DrawnPath d="M 540 40 m -150 0 a 150 150 0 1 0 300 0 a 150 150 0 1 0 -300 0"
                 delay={0} drawFrames={26} length={950} strokeWidth={8} fill="rgba(26,26,26,0.19)" />
      <DrawnPath d="M 540 190 L 540 92" delay={26} drawFrames={8} length={100}
                 stroke="#C2410C" strokeWidth={10} />
      <DrawnPath d="M 540 190 L 470 190" delay={32} drawFrames={8} length={72}
                 stroke="#C2410C" strokeWidth={10} />
      <DrawnText delay={32} x={540} y={330} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 66, fontWeight: 900, letterSpacing: 6 }}>
        20:00
      </DrawnText>
      <DrawnText delay={40} x={540} y={390} textAnchor="middle" fill="#1A1A1A" opacity={0.7}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 700 }}>
        trên các lối đi
      </DrawnText>
    </DiagramCanvas>

    {/* mặt cắt lối đi: hai vách khép lại, hai luồng người ép vào nhau */}
    <DiagramCanvas y={790} height={460}>
      <DrawnPath d="M 70 40 L 1010 40" delay={80} drawFrames={18} length={940} strokeWidth={8} />
      <DrawnPath d="M 70 300 L 1010 300" delay={86} drawFrames={18} length={940} strokeWidth={8} />
      <DrawnPath d="M 260 40 L 380 170 L 260 300 L 70 300 L 70 40 Z" delay={100} drawFrames={14}
                 length={900} strokeWidth={6} fill="rgba(26,26,26,0.19)" />
      <DrawnPath d="M 820 40 L 700 170 L 820 300 L 1010 300 L 1010 40 Z" delay={106} drawFrames={14}
                 length={900} strokeWidth={6} fill="rgba(26,26,26,0.19)" />
      <ForceArrow x={90} y={128} length={280} delay={112} label="" thickness={20}
                  travelFrames={14} />
      <ForceArrow x={990} y={212} length={280} delay={118} label="" thickness={20}
                  travelFrames={14} direction={-1} />
      <DrawnText delay={118} x={540} y={400} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 900 }}>
        CHEN CHÚC · XÔ ĐẨY
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={19} layout="none">
      <PunchPhrase lines={["8 GIỜ TỐI", "BẮT ĐẦU CHEN"]} top={170} fontSize={60} />
    </Sequence>

    <DiagramCanvas y={1040} height={210}>
      <DrawnPath d="M 90 40 L 990 40" delay={130} drawFrames={16} length={900}
                 stroke="#C2410C" strokeWidth={6} />
      <DrawnText delay={134} x={540} y={112} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 36, fontWeight: 800 }}>
        lối đi hẹp lại, người vẫn dồn vào
      </DrawnText>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
