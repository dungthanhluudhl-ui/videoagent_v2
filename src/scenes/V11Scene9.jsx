/**
 * S9 - Đổi tên bằng cách nào mà vẫn giữ được âm đọc?
 *
 * từng chữ Hán cũ được thay bằng chữ đồng âm, chữ đổi nhưng âm đọc giữ nguyên
 *
 * comprehensionLoad: complex - 193 frames (6.4s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Cơ chế đồng âm chỉ hiện ra khi thấy HAI hàng cùng lúc: hàng chữ thay đổi,
 * hàng âm đứng yên. Một ảnh không diễn được "cái này đổi, cái kia không".
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE9_DURATION = 193;

const Swap = ({ cx, oldText, newText, delay }) => (
  <g>
    <DrawnText delay={Math.max(0, delay - 6)} x={cx} y={60} textAnchor="middle" fill="#1A1A1A" opacity={0.45}
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 46, fontWeight: 800 }}>
      {oldText}
    </DrawnText>
    <DrawnPath d={`M ${cx - 70} 42 L ${cx + 70} 42`} delay={delay} drawFrames={7}
               length={140} stroke="#1A1A1A" strokeWidth={5} opacity={0.5} />
    <DrawnPath d={`M ${cx} 84 L ${cx} 132 M ${cx - 16} 116 L ${cx} 132 L ${cx + 16} 116`}
               delay={delay + 6} drawFrames={7} length={80} stroke="#C2410C" strokeWidth={6} />
    <DrawnText delay={delay + 10} x={cx} y={196} textAnchor="middle" fill="#C2410C"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 54, fontWeight: 900 }}>
      {newText}
    </DrawnText>
  </g>
);

export const V11Scene9 = () => (
  <AbsoluteFill name="V11Scene9">
    <SceneBackground variant="chart" />

    <Sequence from={44} layout="none">
      <PunchPhrase lines={["ĐỔI CHỮ", "GIỮ NGUYÊN ÂM"]} top={182} fontSize={62} />
    </Sequence>

    <DiagramCanvas y={392} height={470}>
      <Swap cx={200} oldText="DỊ" newText="LÊ" delay={0} />
      <Swap cx={540} oldText="THÁI" newText="THÁI" delay={16} />
      <Swap cx={880} oldText="VIỆN" newText="VIỆN" delay={32} />

      {/* hàng âm đọc: kẻ liền một mạch để thấy nó KHÔNG hề đổi */}
      <DrawnPath d="M 70 268 L 1010 268" delay={56} drawFrames={22} length={940}
                 strokeWidth={5} dashed />
      <DrawnText delay={56} x={540} y={352} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 58, fontWeight: 900, letterSpacing: 6 }}>
        I · TAE · WON
      </DrawnText>
      <DrawnText delay={66} x={540} y={412} textAnchor="middle" fill="#1A1A1A" opacity={0.7}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 700 }}>
        âm đọc không đổi
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={92} layout="none">
      <Support name="Sup-PearName" src="el10_pear_name.png" width={540} x={270} y={880}
               visibleFor={101} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
