/**
 * S4 - Chỉ có một cách giải thích tên gọi thôi sao?
 *
 * khung hình tách đôi, hai cách viết tên đứng đối diện nhau
 *
 * comprehensionLoad: moderate - 149 frames (5.0s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Nghịch lý ở đây là NGỮ NGHĨA, nên phải thấy hai cách đọc đứng cạnh nhau mới
 * hiểu - một ảnh minh hoạ không làm được việc đó, vì thế hai nửa là chữ vẽ.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE4_DURATION = 149;

const Half = ({ cx, title, gloss, delay, accent }) => (
  <g>
    <DrawnPath d={`M ${cx - 220} 30 L ${cx + 220} 30 L ${cx + 220} 300 L ${cx - 220} 300 Z`}
               delay={delay} drawFrames={18} length={1420} strokeWidth={6} />
    <DrawnText delay={delay + 6} x={cx} y={128} textAnchor="middle" fill="#1A1A1A"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 52, fontWeight: 900 }}>
      {title}
    </DrawnText>
    <DrawnPath d={`M ${cx - 150} 168 L ${cx + 150} 168`} delay={delay + 14} drawFrames={10}
               length={300} stroke={accent} strokeWidth={6} />
    <DrawnText delay={delay + 18} x={cx} y={236} textAnchor="middle" fill="#1A1A1A"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 700 }}>
      {gloss}
    </DrawnText>
  </g>
);

export const V11Scene4 = () => (
  <AbsoluteFill name="V11Scene4">
    <SceneBackground variant="card" />

    <Sequence from={8} layout="none">
      <PunchPhrase lines={["MỘT TÊN", "HAI GIẢ THUYẾT"]} top={190} fontSize={64} />
    </Sequence>

    <DiagramCanvas y={392} height={340}>
      <Half cx={280} title="DỊ THÁI VIỆN" gloss="khác dòng máu" delay={0} accent="#1A1A1A" />
      <Half cx={800} title="LÊ THÁI VIỆN" gloss="ly tán" delay={30} accent="#C2410C" />
      {/* vạch chia đôi kẻ xuống sau, để người xem thấy MỘT tên bị tách làm hai */}
      <DrawnPath d="M 540 10 L 540 320" delay={54} drawFrames={16} length={320}
                 strokeWidth={5} dashed />
    </DiagramCanvas>

    <Sequence from={70} layout="none">
      <Support name="Sup-Pear" src="el10_pear_name.png" width={600} x={250} y={820}
               visibleFor={79} />
    </Sequence>

    <DiagramCanvas y={740} height={510}>
      <DrawnPath d="M 800 70 L 800 30 L 560 30" delay={80} drawFrames={14} length={280}
                 stroke="#C2410C" strokeWidth={6} />
      <DrawnText delay={80} x={880} y={92} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900 }}>
        CHỮ LÊ
      </DrawnText>
      <DrawnText delay={88} x={880} y={140} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 30, fontWeight: 700 }}>
        (quả lê)
      </DrawnText>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
