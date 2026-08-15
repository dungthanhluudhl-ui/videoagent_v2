/**
 * S11 - Cụ thể là lộn xộn thế nào?
 *
 * các đường chỉ dẫn chỉ vào từng công trình cơi nới trên ảnh khu nhà
 *
 * comprehensionLoad: moderate - 133 frames (4.4s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Ảnh khu nhà bám dốc là bằng chứng, đường chỉ dẫn là phần diễn giải: không
 * có nhãn thì người xem chỉ thấy "một khu phố cũ", có nhãn mới thấy ĐÚNG cái
 * mà lời thoại đang nói - phần cơi nới thêm lên trên.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE11_DURATION = 133;

const Callout = ({ ax, ay, lx, ly, text, anchor, delay }) => (
  <g>
    <DrawnPath d={`M ${ax} ${ay} L ${lx} ${ly}`} delay={delay} drawFrames={9}
               length={520} stroke="#C2410C" strokeWidth={5} />
    <circle cx={ax} cy={ay} r={13} fill="none" stroke="#C2410C" strokeWidth={5} />
    <DrawnText delay={delay + 4} x={lx} y={ly - 18} textAnchor={anchor} fill="#F2EFE7"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900 }}>
      {text}
    </DrawnText>
  </g>
);

export const V11Scene11 = () => (
  <AbsoluteFill name="V11Scene11">
    <BackgroundPhoto name="Bg-Houses" src="el11_hillside_houses.png" durationInFrames={133}
                     tint={0.44} grayscale={0.8} focus="50% 55%" drift={0.07} />

    <Sequence from={58} layout="none">
      <PunchPhrase lines={["XÂY TRÁI PHÉP"]} top={190} fontSize={70} onDark />
    </Sequence>

    <DiagramCanvas y={300} height={950}>
      <Callout ax={300} ay={330} lx={80} ly={250} text="MÁI TÔN CƠI NỚI" anchor="start" delay={58} />
      <Callout ax={760} ay={470} lx={1000} ly={400} text="BAN CÔNG QUÂY KÍN" anchor="end" delay={70} />
      <Callout ax={430} ay={700} lx={120} ly={790} text="LẤN RA LỐI ĐI" anchor="start" delay={82} />
      <Callout ax={800} ay={820} lx={1000} ly={900} text="DÂY ĐIỆN CHẰNG CHỊT" anchor="end" delay={94} />
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
