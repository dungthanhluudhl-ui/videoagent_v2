/**
 * S13 - Halloween ở đây trước giờ ra sao?
 *
 * ảnh đám đông đêm hội hiện lên rồi dày đặc dần
 *
 * comprehensionLoad: moderate - 130 frames (4.3s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Cảnh nghỉ sau chuỗi sơ đồ của S12: mật độ thông tin thấp, để người xem thở
 * trước khi vào phần số liệu.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE13_DURATION = 130;

export const V11Scene13 = () => (
  <AbsoluteFill name="V11Scene13">
    <BackgroundPhoto name="Bg-Halloween" src="el10_crowd_night.png" durationInFrames={130}
                     tint={0.46} focus="50% 45%" drift={0.08} />

    {/* dải năm: "các năm trước" thành một thứ đếm được, không phải lời nói suông */}
    <DiagramCanvas y={300} height={300}>
      <DrawnPath d="M 90 150 L 990 150" delay={6} drawFrames={22} length={900}
                 stroke="#F2EFE7" strokeWidth={5} opacity={0.75} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <DrawnPath d={`M ${150 + i * 260} 128 L ${150 + i * 260} 172`}
                     delay={10 + i * 8} drawFrames={6} length={44}
                     stroke="#C2410C" strokeWidth={7} />
          <DrawnText delay={10 + i * 8} x={150 + i * 260} y={106} textAnchor="middle" fill="#F2EFE7"
                style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900 }}>
            {2016 + i}
          </DrawnText>
        </g>
      ))}
      <DrawnText delay={40} x={540} y={240} textAnchor="middle" fill="#F2EFE7" opacity={0.85}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 700 }}>
        năm nào cũng đông
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={85} layout="none">
      <PunchPhrase lines={["TÂM ĐIỂM HALLOWEEN"]} top={630} fontSize={64} onDark />
    </Sequence>

    <Sequence from={0} layout="none">
      <Support name="Sup-Crowd" src="el10_crowd_behind.png" width={840} x={120} y={780}
               visibleFor={130} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
