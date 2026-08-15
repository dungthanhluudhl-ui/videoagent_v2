/**
 * S17 - Khu này trông như thế nào?
 *
 * phố thương mại ban ngày lấp kín khung hình
 *
 * comprehensionLoad: moderate - 110 frames (3.7s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE17_DURATION = 110;

export const V10Scene17 = () => (
  <AbsoluteFill name="V10Scene17">
      <BackgroundPhoto name="Bg-Commerce" src="el10_commerce_day.png"
                       durationInFrames={110} tint={0.4} focus="50% 45%" drift={0.08} />
      <Sequence from={4} layout="none">
        <PunchPhrase lines={["KHU THƯƠNG MẠI"]} top={1160} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
