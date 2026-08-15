/**
 * S5 - Vì sao kéo mạnh vẫn không rút được người ra?
 *
 * Lưới mật độ khoá chặt, rồi mũi tên lực kéo đâm vào và bật ngược lại
 *
 * comprehensionLoad: complex - 123 frames (4.1s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: lưới 430px cũ chỉ chiếm 40% bề ngang và cả dải 1100-1250 bỏ
 * trống (review10.json S5/composed = fail). Lưới nay 740px, chú thích, tường
 * chặn và mũi tên xếp xuống hết dải khả dụng.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DensityGrid, DiagramCanvas, DrawnPath, ForceArrow } from "./visualLanguage";

export const V10SCENE5_DURATION = 123;

export const V10Scene5 = () => (
  <AbsoluteFill name="V10Scene5">
      <SceneBackground variant="chart" />
      <DiagramCanvas y={280} height={1000}>
        <DensityGrid x={170} y={20} width={740} height={740} cols={10} rows={10}
                     fillCount={100} delay={0} fillFrames={30} />
        <text x={540} y={830} textAnchor="middle" fill="#1A1A1A"
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 800 }}>
          KHỐI NGƯỜI BỊ KHOÁ CHẶT
        </text>
        {/* the wall the force meets */}
        <DrawnPath d="M 840 862 L 840 998" delay={50} drawFrames={10} length={150}
                   strokeWidth={12} />
        <ForceArrow x={80} y={930} length={720} delay={57} label="LỰC KÉO"
                    thickness={26} travelFrames={16} />
      </DiagramCanvas>
      <Sequence from={57} layout="none">
        <PunchPhrase lines={["KÉO KHÔNG RA"]} top={190} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
