/**
 * S20 - Vì sao giới trẻ đổ về đây?
 *
 * màn hình phát cảnh phim, kéo ánh nhìn ra ngoài đời thật
 *
 * comprehensionLoad: moderate - 114 frames (3.8s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DeviceMockup } from "./visualLanguage";

export const V10SCENE20_DURATION = 114;

export const V10Scene20 = () => (
  <AbsoluteFill name="V10Scene20">
      <SceneBackground variant="card" />
      <DeviceMockup name="Mock-TV" src="el10_drama_still.png" kind="tv" x="50%" y={400}
                    width={860} delay={4} />
      <Sequence from={62} layout="none">
        <PunchPhrase lines={["TẦNG LỚP ITAEWON"]} top={1210} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
