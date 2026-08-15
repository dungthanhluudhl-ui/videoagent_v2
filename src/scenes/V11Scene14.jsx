/**
 * S14 - Đông tới mức nào, và năm nào?
 *
 * con số 100.000 đếm lên cùng khối chấm người lấp dần, rồi mốc năm lật sang 2022
 *
 * comprehensionLoad: complex - 173 frames (5.8s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * "Rất đông" ở S13 là cảm giác; ở đây nó phải thành thứ đếm được, nên khối
 * chấm lấp đầy song song với con số chạy - hai cách nói cùng một dữ kiện.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DensityGrid, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V11SCENE14_DURATION = 173;

export const V11Scene14 = () => (
  <AbsoluteFill name="V11Scene14">
    <SceneBackground variant="chart" />

    <Sequence from={22} layout="none">
      <PunchPhrase lines={["100.000 NGƯỜI", "NĂM 2019"]} top={176} fontSize={62} />
    </Sequence>

    <DiagramCanvas y={392} height={480}>
      <DensityGrid x={100} y={20} width={880} height={330} cols={25} rows={10}
                   fillCount={250} delay={0} fillFrames={80} />
      <DrawnPath d="M 100 386 L 980 386" delay={70} drawFrames={16} length={880}
                 stroke="#C2410C" strokeWidth={6} />
      <text x={540} y={452} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 800 }}>
        mỗi chấm ≈ 400 người
      </text>
    </DiagramCanvas>

    {/* mốc năm lật sang 2022 - chuyển sang vế sau của câu */}
    <DiagramCanvas y={900} height={350}>
      <text x={250} y={110} textAnchor="middle" fill="#1A1A1A" opacity={0.45}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 78, fontWeight: 900 }}>
        2019
      </text>
      <DrawnPath d="M 380 88 L 620 88 M 586 66 L 620 88 L 586 110" delay={116}
                 drawFrames={12} length={300} stroke="#C2410C" strokeWidth={9} />
      <text x={830} y={110} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 78, fontWeight: 900 }}>
        2022
      </text>
      <DrawnPath d="M 630 170 L 1030 170" delay={130} drawFrames={12} length={400}
                 strokeWidth={5} dashed />
      <text x={830} y={232} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 36, fontWeight: 800 }}>
        Halloween năm ấy
      </text>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
