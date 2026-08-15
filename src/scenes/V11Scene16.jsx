/**
 * S16 - Con số năm đó là bao nhiêu?
 *
 * cột 100.000 của 2019 bị cột 130.000 của 2022 vượt qua
 *
 * comprehensionLoad: complex - 170 frames (5.7s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Lần đầu hai con số đứng cạnh nhau: 130.000 chỉ có nghĩa khi thấy nó CAO HƠN
 * mốc 100.000 vừa dựng ở S14, nên cột 2019 phải mọc trước rồi mới bị vượt.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";
import { IconRise } from "./iconVocabulary";

export const V11SCENE16_DURATION = 170;

const Bar = ({ x, h, year, value, delay, accent }) => (
  <g>
    <DrawnPath d={`M ${x} 560 L ${x} ${560 - h} L ${x + 190} ${560 - h} L ${x + 190} 560`}
               delay={delay} drawFrames={20} length={1000} stroke={accent} strokeWidth={8} />
    <DrawnText delay={delay + 8} x={x + 95} y={616} textAnchor="middle" fill="#1A1A1A"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
      {year}
    </DrawnText>
    <DrawnText delay={delay + 16} x={x + 95} y={526 - h} textAnchor="middle" fill={accent}
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 46, fontWeight: 900 }}>
      {value}
    </DrawnText>
  </g>
);

export const V11Scene16 = () => (
  <AbsoluteFill name="V11Scene16">
    <SceneBackground variant="chart" />

    <DiagramCanvas y={310} height={650}>
      <DrawnPath d="M 80 560 L 700 560" delay={0} drawFrames={14} length={620}
                 strokeWidth={6} />
      <Bar x={130} h={300} year="2019" value="100.000" delay={0} accent="#1A1A1A" />
      <Bar x={400} h={430} year="2022" value="130.000" delay={62} accent="#C2410C" />
      {/* đường mức của 2019, để thấy rõ phần vượt lên */}
      <DrawnPath d="M 130 260 L 700 260" delay={96} drawFrames={14} length={570}
                 strokeWidth={4} dashed />
      {/* Đã bỏ nhãn "mức 2019": ở cỡ đọc được nó rộng 250px và cắt ngang thân
          cột 2022. Đường nét đứt vốn xuất phát từ đúng đỉnh cột 2019 - nó tự
          nói ra mức đó là của năm nào, không cần chữ. */}
      {/* Cột phải của khung còn trống, và điều phải đọng lại không phải hai con
          số mà là HƯỚNG giữa chúng. Ký hiệu nói điều đó ngay khi đường mức 2019
          hiện ra, không cần thêm một dòng chữ nào. */}
      <IconRise x={870} y={200} size={160} delay={96} />
    </DiagramCanvas>

    <Sequence from={31} layout="none">
      <Support name="Sup-Surge" src="el10_crowd_night.png" width={220} x={760} y={740}
               visibleFor={139} />
    </Sequence>

    <Sequence from={79} layout="none">
      <PunchPhrase lines={["130.000 NGƯỜI", "KỶ LỤC"]} top={180} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
