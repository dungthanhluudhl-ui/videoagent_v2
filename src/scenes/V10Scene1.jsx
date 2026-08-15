/**
 * S1 - Chuyện gì đã xảy ra ở đây?
 *
 * một con hẻm đêm hiện dần ra từ bóng tối rồi ngày tháng đóng dấu lên nó
 *
 * comprehensionLoad: simple - 124 frames (4.1s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V10SCENE1_DURATION = 124;

export const V10Scene1 = () => (
  <AbsoluteFill name="V10Scene1">
      <BackgroundPhoto name="Bg-Alley" src="el10_alley_night.png"
                       durationInFrames={124} tint={0.5} focus="50% 60%" drift={0.09} />
      <DiagramCanvas y={980} height={260}>
        <DrawnPath d="M 300 60 L 780 60" delay={54} drawFrames={14} length={520}
                   stroke="#F7F4EC" strokeWidth={4} opacity={0.75} />
      </DiagramCanvas>
      <Sequence from={62} layout="none">
        <PunchPhrase lines={["29.10.2022"]} top={620} onDark fontSize={92} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
