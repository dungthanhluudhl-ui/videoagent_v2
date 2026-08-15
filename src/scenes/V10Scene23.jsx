/**
 * S23 - Tên gọi đó nghĩa là gì?
 *
 * Chữ Lê Thái Viện hiện ra cùng nhành lê, nghĩa được giải ra ngay dưới
 *
 * comprehensionLoad: moderate - 145 frames (4.83s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: nhành lê 780px ở y=440 và dòng chú thích cỡ 40 lọt thỏm, dải
 * đáy trống (review10.json S23/composed = fail). Nhành lê nay 960px từ y=300,
 * chữ Hán phóng lên cỡ 104 làm mỏ neo thị giác cho dải dưới, punch dời lên đầu.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas } from "./visualLanguage";

export const V10SCENE23_DURATION = 145;

export const V10Scene23 = () => (
  <AbsoluteFill name="V10Scene23">
      <SceneBackground variant="card" />
      <Sequence from={62} layout="none">
        <Hero name="Doc-Name" src="el10_pear_name.png" width={960} x="50%" y={300}
              variant="rise" visibleFor={83} />
      </Sequence>
      <Sequence from={62} layout="none">
        <DiagramCanvas y={980} height={300}>
          <text x={540} y={110} textAnchor="middle" fill="#1A1A1A"
                style={{ fontFamily: "Be Vietnam Pro", fontSize: 104, fontWeight: 900 }}>
            梨泰院
          </text>
          <text x={540} y={200} textAnchor="middle" fill="#E8621A"
                style={{ fontFamily: "Be Vietnam Pro", fontSize: 46, fontWeight: 800 }}>
            "vườn lê"
          </text>
        </DiagramCanvas>
      </Sequence>
      <Sequence from={104} layout="none">
        <PunchPhrase lines={["LÊ THÁI VIỆN"]} top={190} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
