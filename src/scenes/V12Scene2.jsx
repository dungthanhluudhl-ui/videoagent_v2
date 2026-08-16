/**
 * S2 - Khu ấy dựng lên là để cho ai?
 *
 * hai thân phận bị bỏ lại - người mẹ và đứa trẻ - hiện ra đứng trên cùng một
 * nền đất, biến một dòng chữ trong sử thành hai con người cụ thể
 *
 * comprehensionLoad: moderate - 104 frames (3.5s)
 * Generated from input/scene_plan12.json; check with build_gate.py.
 *
 * Cỡ hai cụm người lấy từ check_overlap chứ không phải đoán: ở 420/340 độ phủ
 * chỉ đạt 22.2%, dưới ngưỡng 25% và đọc ra thưa - đúng lỗi "cảnh loãng" đã bị
 * phàn nàn. 490/410 đưa độ phủ lên 30.1% và trọng tâm về dx=-5, dy=+49.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V12SCENE2_DURATION = 104;

export const V12Scene2 = () => (
  <AbsoluteFill name="V12Scene2">
    <SceneBackground variant="grid" />

    {/* nền đất chung để hai cụm người đứng trên cùng một mặt, không lơ lửng */}
    <DiagramCanvas y={1150} height={190}>
      <DrawnPath d="M 60 40 L 1020 40" delay={6} drawFrames={20} length={960} strokeWidth={6} />
      <DrawnPath
        d="M 60 40 L 60 78 M 1020 40 L 1020 78"
        delay={22}
        drawFrames={8}
        length={80}
        strokeWidth={5}
      />
    </DiagramCanvas>

    <Sequence from={0} layout="none">
      <Hero
        name="Hero-Mother"
        src="el11_mother_child.png"
        width={490}
        x={80}
        y={345}
        variant="flip"
        visibleFor={104}
      />
    </Sequence>

    {/* Support có nhịp riêng nên phải có Sequence riêng - dùng chung một
        Sequence thì dời cái này là dời luôn cái kia. */}
    <Sequence from={0} layout="none">
      <Support
        name="Sup-Child"
        src="el12_child_pair.png"
        width={410}
        x={620}
        y={445}
        visibleFor={104}
        phase={9}
      />
    </Sequence>

    <Sequence from={45} layout="none">
      <PunchPhrase lines={["SINH RA", "NGOÀI Ý MUỐN"]} top={168} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
