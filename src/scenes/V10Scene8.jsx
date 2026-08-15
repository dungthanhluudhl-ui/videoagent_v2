/**
 * S8 - Đã từng có thảm họa nào lớn như vậy chưa?
 *
 * Trục thời gian nối mốc 2014 sang mốc 2022, khoảng cách 8 năm được đo
 *
 * comprehensionLoad: complex - 127 frames (4.23s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: phà rộng 320px nằm lọt thỏm ở góc dưới trái, dải 1000-1250 trống
 * (review10.json S8/composed = fail). Phà nay 620px đặt giữa dưới trục, thêm
 * đường đo "8 NĂM" bắc ngang hai mốc - khoảng cách chính là nội dung cảnh này.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DimensionLine, Timeline } from "./visualLanguage";

export const V10SCENE8_DURATION = 127;

export const V10Scene8 = () => (
  <AbsoluteFill name="V10Scene8">
      <SceneBackground variant="chart" />
      <Timeline
        y={480} x={60} width={960} inset={140}
        events={[
          { label: "2014", sub: "Chìm phà Sewol", delay: 6 },
          { label: "2022", sub: "Thảm họa Itaewon", delay: 60 },
        ]}
      />
      <DiagramCanvas y={760} height={520}>
        <DimensionLine x1={160} y1={30} x2={920} y2={30} label="8 NĂM"
                       delay={82} fontSize={42} />
      </DiagramCanvas>
      <Sequence from={82} layout="none">
        <Support name="Sup-Ferry" src="el10_ferry.png" width={900} x={90} y={850}
                 visibleFor={45} />
      </Sequence>
      <Sequence from={82} layout="none">
        <PunchPhrase lines={["2014 → 2022"]} top={220} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
