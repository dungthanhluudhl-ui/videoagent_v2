/**
 * S6 - Người ở đó đã chứng kiến điều gì?
 *
 * khung hình lặng xuống, ánh sáng rút dần khi từng người ngừng thở
 *
 * comprehensionLoad: moderate - 90 frames (3.0s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE6_DURATION = 90;

export const V10Scene6 = () => (
  <AbsoluteFill name="V10Scene6">
      <BackgroundPhoto name="Bg-Vigil" src="el10_street_vigil.png"
                       durationInFrames={90} tint={0.55} focus="50% 62%" drift={0.05} />
      <Sequence from={27} layout="none">
        <PunchPhrase lines={["TỪNG NGƯỜI MỘT"]} top={1120} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
