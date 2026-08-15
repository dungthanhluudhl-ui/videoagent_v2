/**
 * S7 - Bao nhiêu người đã chết?
 *
 * 158 chấm tưởng niệm lấp dần khung hình cùng nhịp với con số đếm lên
 *
 * comprehensionLoad: complex - 123 frames (4.1s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: perRow=20 gói 158 chấm vào một khối cao 384px giữa khung, xung
 * quanh là giấy trắng (review10.json S7/composed = fail). perRow=14 kéo khối
 * chấm thành 12 hàng cao 840px - con số lấp thật khung hình, đúng ý đồ.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, MemorialDots } from "./visualLanguage";

export const V10SCENE7_DURATION = 123;

export const V10Scene7 = () => (
  <AbsoluteFill name="V10Scene7">
      <SceneBackground variant="card" />
      <DiagramCanvas y={300} height={1000}>
        <MemorialDots x={50} y={20} width={980} count={158} perRow={14}
                      delay={2} fillFrames={72} />
      </DiagramCanvas>
      <Sequence from={28} layout="none">
        <PunchPhrase lines={["158 NGƯỜI", "THIỆT MẠNG"]} top={180} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
