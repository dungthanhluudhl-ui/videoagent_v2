/**
 * S14 - Tôi nên làm gì tiếp?
 *
 * nút theo dõi rồi nút like được nhấn thật trên màn hình điện thoại
 *
 * comprehensionLoad: moderate - 130 frames (4.3s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DeviceMockup, DiagramCanvas } from "./visualLanguage";

export const V10SCENE14_DURATION = 130;

export const V10Scene14 = () => (
  <AbsoluteFill name="V10Scene14">
      <SceneBackground variant="card" />
      <DeviceMockup kind="phone" x="50%" y={400} width={600} delay={1} />
      <DiagramCanvas y={520} height={640}>
        <rect x={392} y={150} width={296} height={92} rx={46} fill="#E8621A" opacity={0.95} />
        <text x={540} y={210} textAnchor="middle" fill="#F7F4EC"
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 42, fontWeight: 900 }}>
          THEO DÕI
        </text>
      </DiagramCanvas>
      <Sequence from={24} layout="none">
        <Support name="Sup-Like" src="el10_like_burst.png" width={250} x={720} y={900}
                 visibleFor={105} />
      </Sequence>
      <Sequence from={1} layout="none">
        <PunchPhrase lines={["THEO DÕI"]} top={200} fontSize={58} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
