/**
 * S13 - Đây là kênh nào?
 *
 * Dấu vết in xuống mặt giấy rồi thành tên kênh
 *
 * comprehensionLoad: moderate - 104 frames (3.47s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: vòng dấu rộng 720px đặt ở y=480 để lại dải 1050-1250 trống
 * (review10.json S13/composed = fail). Dấu nay 880px bắt đầu từ y=330, kéo
 * xuống ~1094, khung ngắm vẽ quanh dấu và punch nối tiếp ngay bên dưới.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V10SCENE13_DURATION = 104;

export const V10Scene13 = () => (
  <AbsoluteFill name="V10Scene13">
      <SceneBackground variant="spotlight" />
      <Sequence from={0} layout="none">
        <Hero name="Doc-Trace" src="el10_trace_stamp.png" width={880} x="50%" y={330}
              variant="punch" idle="none" visibleFor={103} />
      </Sequence>
      {/* khung ngắm: bốn góc khép lại quanh dấu vết, đúng nghĩa "truy dấu" */}
      <DiagramCanvas y={300} height={840}>
        <DrawnPath d="M 70 130 L 70 30 L 190 30" delay={0} drawFrames={8}
                   length={230} stroke="#E8621A" strokeWidth={9} />
        <DrawnPath d="M 890 30 L 1010 30 L 1010 130" delay={6} drawFrames={8}
                   length={230} stroke="#E8621A" strokeWidth={9} />
        <DrawnPath d="M 1010 690 L 1010 790 L 890 790" delay={12} drawFrames={8}
                   length={230} stroke="#E8621A" strokeWidth={9} />
        <DrawnPath d="M 190 790 L 70 790 L 70 690" delay={18} drawFrames={8}
                   length={230} stroke="#E8621A" strokeWidth={9} />
      </DiagramCanvas>
      <Sequence from={77} layout="none">
        <PunchPhrase lines={["DẤU VẾT", "CUỐI CÙNG"]} top={1160} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
