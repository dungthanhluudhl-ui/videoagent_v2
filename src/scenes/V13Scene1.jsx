/**
 * S1 - Những hiện tượng khoa học khó giải thích đó trông ra sao?
 *
 * ba hiện tượng có thật cùng nằm trong một khung - đĩa băng xoay, quả cầu
 * sáng trên đồng, mẫu vật trong lọ - rồi ba dấu ngoặc cam lần lượt khoanh
 * từng cái lại.
 *
 * comprehensionLoad: moderate - 127 frames (4.23s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Ảnh nguồn là một montage DỌC có ba chủ thể nằm ở ba tầng khác nhau, nên
 * dấu ngoặc phải bám toạ độ thật của từng chủ thể (đo trên lưới %, không
 * ước lượng): quả cầu ở 72%/15%, đĩa băng ở giữa khung, mẫu vật ở tầng dưới
 * nhưng phải dừng trên 1400 vì dưới đó là dải phụ đề.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";
import { IconQuestion } from "./iconVocabulary";

export const V13SCENE1_DURATION = 127;

const ORANGE = "#FF6A1A";
const ARM = 54;
const corners = (x1, y1, x2, y2) => [
  `M ${x1} ${y1 + ARM} L ${x1} ${y1} L ${x1 + ARM} ${y1}`,
  `M ${x2} ${y2 - ARM} L ${x2} ${y2} L ${x2 - ARM} ${y2}`,
];

const Bracket = ({ box, delay }) => (
  <>
    {corners(...box).map((d, i) => (
      <DrawnPath key={i} d={d} delay={delay + i * 3} drawFrames={10} length={120}
                 stroke={ORANGE} strokeWidth={8} />
    ))}
  </>
);

export const V13Scene1 = () => (
  <AbsoluteFill name="V13Scene1">
    <SceneBackground variant="photo" />

    <CameraGroup zoom={{ from: 1.0, to: 1.06 }} durationInFrames={V13SCENE1_DURATION}>
      <BackgroundPhoto
        name="Bg-Montage"
        src="el13_science_montage.png"
        durationInFrames={V13SCENE1_DURATION}
        wash="ink"
        // 0.34 chứ không phải mặc định 0.42: ảnh nguồn vốn đã là trời bão
        // xám, wash mực nặng hơn nữa thì đĩa băng chìm mất viền.
        tint={0.34}
        grayscale={0.7}
        focus="50% 50%"
        drift={0.04}
      />

      <Sequence from={48} layout="none">
        <DiagramCanvas y={0} height={1920}>
          {/* quả cầu sáng - góc phải trên */}
          <Bracket box={[660, 205, 900, 400]} delay={0} />
          {/* đĩa băng tròn - giữa khung */}
          <Bracket box={[150, 845, 915, 1110]} delay={8} />
          {/* mẫu vật trong lọ - dừng ở 1400, dưới đó là phụ đề */}
          <Bracket box={[200, 1185, 880, 1400]} delay={16} />
          <IconQuestion x={960} y={980} size={110} delay={22} />
        </DiagramCanvas>
      </Sequence>
    </CameraGroup>

    <Sequence from={48} layout="none">
      <PunchPhrase lines={["CÓ THẬT.", "CHƯA AI HIỂU."]} top={470} fontSize={76} onDark />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
