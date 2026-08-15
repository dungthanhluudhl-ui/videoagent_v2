/**
 * S10 - Điểm trùng hợp rùng mình ở đây là gì?
 *
 * Hai nhóm cách nhau 8 năm xếp đối xứng, cùng một độ tuổi
 *
 * comprehensionLoad: complex - 125 frames (4.17s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: hai cutout 440px chỉ chiếm dải 640-1010, trên dưới đều trống
 * (review10.json S10/composed = fail). Hai vế nay rộng 540px kín bề ngang,
 * nhãn nằm ngay dưới mỗi vế và một đường đo bắc ngang cả hai ở đáy dải.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DimensionLine, DrawnPath } from "./visualLanguage";

export const V10SCENE10_DURATION = 125;

export const V10Scene10 = () => (
  <AbsoluteFill name="V10Scene10">
      <SceneBackground variant="card" />
      <DiagramCanvas y={420} height={860}>
        <DrawnPath d="M 540 20 L 540 640" delay={40} drawFrames={16} length={640}
                   strokeWidth={4} opacity={0.35} dashed />
        <text x={272} y={470} textAnchor="middle" fill="#1A1A1A"
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 800 }}>
          ITAEWON 2022
        </text>
        <text x={808} y={470} textAnchor="middle" fill="#1A1A1A"
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 800 }}>
          SEWOL 2014
        </text>
        <DimensionLine x1={70} y1={690} x2={1010} y2={690} label="CÁCH NHAU 8 NĂM"
                       delay={46} fontSize={40} />
      </DiagramCanvas>
      <Sequence from={8} layout="none">
        <Hero name="Hero-Youth2" src="el10_youth_2022.png" width={540} x={0} y={520}
              variant="flip" visibleFor={118} />
      </Sequence>
      <Sequence from={44} layout="none">
        <Hero name="Hero-Students" src="el10_students_2014.png" width={540} x={540} y={520}
              variant="flip" visibleFor={82} />
      </Sequence>
      <Sequence from={44} layout="none">
        <PunchPhrase lines={["CÙNG MỘT", "ĐỘ TUỔI"]} top={200} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
