/**
 * S19 - Không khí lúc đó thế nào?
 *
 * các chú thích trang phục hóa trang chỉ vào từng người trong đám đông
 *
 * comprehensionLoad: moderate - 107 frames (3.6s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Nhãn đặt vào NỬA TRÊN của ảnh, nơi đám đông thưa dần về phía cuối phố -
 * chỉ vào mặt người ở tiền cảnh thì nhãn che mất chính thứ nó đang chỉ.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE19_DURATION = 107;

const Tag = ({ ax, ay, lx, ly, text, anchor, delay }) => (
  <g>
    <DrawnPath d={`M ${ax} ${ay} L ${lx} ${ly}`} delay={delay} drawFrames={8}
               length={420} stroke="#C2410C" strokeWidth={5} />
    <circle cx={ax} cy={ay} r={12} fill="none" stroke="#C2410C" strokeWidth={5} />
    <DrawnText delay={delay + 4} x={lx} y={ly - 16} textAnchor={anchor} fill="#F2EFE7"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 900 }}>
      {text}
    </DrawnText>
  </g>
);

export const V11Scene19 = () => (
  <AbsoluteFill name="V11Scene19">
    <BackgroundPhoto name="Bg-Costume" src="el11_costume_crowd.png" durationInFrames={107}
                     tint={0.42} grayscale={0.72} focus="50% 62%" drift={0.07} />

    <Sequence from={20} layout="none">
      <PunchPhrase lines={["HOÁ TRANG"]} top={190} fontSize={72} onDark />
    </Sequence>

    <DiagramCanvas y={300} height={950}>
      <Tag ax={330} ay={430} lx={90} ly={368} text="MẶT NẠ" anchor="start" delay={68} />
      <Tag ax={720} ay={470} lx={1000} ly={408} text="SƠN MẶT" anchor="end" delay={76} />
      <Tag ax={470} ay={620} lx={110} ly={690} text="ĐỒ HOÁ TRANG" anchor="start" delay={84} />
      <Tag ax={790} ay={640} lx={1000} ly={720} text="ĐIỆN THOẠI GIƠ CAO" anchor="end" delay={92} />
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
