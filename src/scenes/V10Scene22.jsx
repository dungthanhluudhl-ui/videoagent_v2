/**
 * S22 - Đằng sau sự phồn hoa là gì?
 *
 * nửa khung hình rực rỡ bị một lớp tư liệu cũ đẩy lấn sang
 *
 * comprehensionLoad: moderate - 94 frames (3.1s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V10SCENE22_DURATION = 94;

export const V10Scene22 = () => (
  <AbsoluteFill name="V10Scene22">
      <BackgroundPhoto name="Bg-Prosper" src="el10_prosper.png"
                       durationInFrames={94} tint={0.42} focus="50% 45%" drift={0.07} />
      <Sequence from={62} layout="none">
        <Support name="Sup-Archive" src="el10_archive_paper.png" width={540} x={520} y={620}
                 visibleFor={62} />
      </Sequence>
      <Sequence from={62} layout="none">
        <PunchPhrase lines={["PHỒN HOA", "& THĂNG TRẦM"]} top={210} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
