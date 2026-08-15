/**
 * S26 - Hậu quả để lại là gì?
 *
 * mái chùa cổ chìm dần trong bóng tối, khung hình lặng lại
 *
 * comprehensionLoad: simple - 102 frames (3.4s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE26_DURATION = 102;

export const V10Scene26 = () => (
  <AbsoluteFill name="V10Scene26">
      <BackgroundPhoto name="Bg-Temple" src="el10_temple_dusk.png"
                       durationInFrames={102} tint={0.52} focus="50% 55%" drift={0.045} />
      <Sequence from={81} layout="none">
        <PunchPhrase lines={["MỘT NGÔI", "CHÙA CỔ"]} top={640} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
