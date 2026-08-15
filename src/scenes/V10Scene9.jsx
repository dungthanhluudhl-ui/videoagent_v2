/**
 * S9 - Nhóm nạn nhân đó là ai?
 *
 * Nhóm người trẻ 2022 hiện ra phía trước một khối đám đông cùng lứa
 *
 * comprehensionLoad: moderate - 92 frames (3.07s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: một cutout rộng 640px giữa khung, hai bên và cả dải dưới trống
 * (review10.json S9/composed = fail). Xếp chồng hai lớp theo visual-language.md
 * - khối đám đông lấp dải dưới, nhóm nạn nhân lớn hơn ở lớp trước.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground, Support } from "./shared";

export const V10SCENE9_DURATION = 92;

export const V10Scene9 = () => (
  <AbsoluteFill name="V10Scene9">
      <SceneBackground variant="grid" />
      <Sequence from={25} layout="none">
        <Support name="Sup-CrowdBehind" src="el10_crowd_behind.png" width={860}
                 x={110} y={760} visibleFor={67} />
      </Sequence>
      <Sequence from={25} layout="none">
        <Hero name="Hero-Youth" src="el10_youth_2022.png" width={820} x="50%" y={300}
              variant="flip" visibleFor={68} />
      </Sequence>
      <Sequence from={62} layout="none">
        <PunchPhrase lines={["NHÓM NẠN NHÂN", "2022"]} top={190} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
