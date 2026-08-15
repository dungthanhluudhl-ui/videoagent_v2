/**
 * S3 - Thảm họa lớn tới mức nào?
 *
 * đám đông chật cứng lấp kín khung hình khi cụm chữ đập vào rồi giữ nguyên
 *
 * comprehensionLoad: simple - 90 frames (3.0s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE3_DURATION = 90;

export const V10Scene3 = () => (
  <AbsoluteFill name="V10Scene3">
      <BackgroundPhoto name="Bg-Crowd" src="el10_crowd_night.png"
                       durationInFrames={90} tint={0.46} focus="50% 45%" drift={0.1} />
      <Sequence from={5} layout="none">
        <PunchPhrase lines={["THẢM HỌA", "DẪM ĐẠP"]} top={230} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
