/**
 * S2 - Khu tạm cư đó dành cho ai?
 *
 * mẹ mang thai và đứa trẻ tách khỏi tờ chiếu chỉ, thành người thật
 *
 * comprehensionLoad: moderate - 106 frames (3.5s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Cỡ hero lấy theo CHIỀU CAO render thật (449x771 -> width 420 = cao 722),
 * không phải theo con số đoán trong plan: width 780 như kế hoạch ban đầu cho
 * ra 1339px, tràn thẳng xuống dải phụ đề.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE2_DURATION = 106;

export const V11Scene2 = () => (
  <AbsoluteFill name="V11Scene2">
    <SceneBackground variant="grid" />

    {/* nền đất chung để hai cụm người đứng trên cùng một mặt, không lơ lửng */}
    <DiagramCanvas y={1020} height={230}>
      <DrawnPath d="M 60 44 L 1020 44" delay={4} drawFrames={20} length={960} strokeWidth={6} />
      <DrawnPath d="M 60 44 L 60 78 M 1020 44 L 1020 78" delay={20} drawFrames={8}
                 length={80} strokeWidth={5} />
      <DrawnText delay={20} x={540} y={140} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 38, fontWeight: 800, letterSpacing: 2 }}>
        TRIỀU ĐÌNH NUÔI
      </DrawnText>
      <DrawnPath d="M 300 176 L 780 176" delay={26} drawFrames={14} length={480}
                 stroke="#C2410C" strokeWidth={7} />
    </DiagramCanvas>

    <Sequence from={0} layout="none">
      <Hero name="Hero-Mother" src="el11_mother_child.png" width={420} x={90} y={330}
            variant="flip" visibleFor={106} />
    </Sequence>

    {/* Support và punch có nhịp riêng, nên phải có Sequence riêng. Dùng chung
        một Sequence thì dời cái này là dời luôn cái kia. */}
    <Sequence from={0} layout="none">
      <Support name="Sup-Child" src="el11_child_pair.png" width={340} x={600} y={470}
               visibleFor={106} phase={9} />
    </Sequence>

    <Sequence from={41} layout="none">
      <PunchPhrase lines={["NHỮNG ĐỨA TRẺ LAI"]} top={186} fontSize={66} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
