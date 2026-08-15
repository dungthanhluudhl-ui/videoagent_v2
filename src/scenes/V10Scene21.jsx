/**
 * S21 - Không khí ở đây về đêm ra sao?
 *
 * đèn neon và dòng người lấp kín khung hình
 *
 * comprehensionLoad: moderate - 128 frames (4.3s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE21_DURATION = 128;

export const V10Scene21 = () => (
  <AbsoluteFill name="V10Scene21">
      <BackgroundPhoto name="Bg-Neon" src="el10_neon_night.png"
                       durationInFrames={128} tint={0.36} focus="50% 50%" drift={0.11} />
      <Sequence from={82} layout="none">
        <PunchPhrase lines={["CUỘC SỐNG", "VỀ ĐÊM"]} top={250} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
