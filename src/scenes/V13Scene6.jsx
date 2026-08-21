/**
 * S6 - Vậy Vua chuột KHÔNG phải là cái gì?
 *
 * chuột đứng hai chân tạo dáng dạy võ rơi vào trong khung TV cùng bốn cái
 * mai rùa, rồi cả khung bị dấu cấm cam trùm lên.
 *
 * comprehensionLoad: moderate - 90 frames (3.0s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Vì sao là khung TV chứ không phải cutout trên giấy: cách hiểu sai này đến
 * từ phim, nên nhốt nó vào một cái màn hình là nói luôn được NGUỒN của nó -
 * và DeviceMockup vẽ ra cái TV bằng code, không phải đi tìm ảnh chụp TV.
 *
 * Mai rùa: KHÔNG còn vẽ tay. Bản trước vẽ 4 hình oval + 3 gạch, không đọc
 * ra là rùa - "rất xấu, người xem không thể chấp nhận được" (phản hồi trực
 * tiếp). Thay bằng IconTurtle (iconVocabulary.jsx): path thật lấy từ
 * lucide-react (ISC, ảnh chung chung, không phải nhân vật có bản quyền -
 * vẫn đúng yêu cầu cấm của shotlist), chạy qua đúng hệ thống vẽ dần sẵn có.
 * Màu #F0EAD8 (sáng) vì icon nằm trên nền TV tối, không phải mực đen mặc
 * định của IconTurtle.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground } from "./shared";
import { DeviceMockup, DiagramCanvas } from "./visualLanguage";
import { IconBan, IconTurtle } from "./iconVocabulary";

export const V13SCENE6_DURATION = 90;

const ORANGE = "#FF6A1A";
const SHELL_COLOR = "#F0EAD8";

export const V13Scene6 = () => (
  <AbsoluteFill name="V13Scene6">
    <SceneBackground variant="card" />

    <CameraGroup
      zoom={{ from: 1.0, to: 1.06 }}
      shake={{ at: 45, len: 14, mag: 11 }}
      durationInFrames={V13SCENE6_DURATION}
    >
      <DeviceMockup name="Mock-TV" kind="tv" x={90} y={430} width={900} delay={0} glow />

      <Sequence from={6} layout="none">
        <Hero name="Hero-KarateRat" src="el13_rat_karate.png"
              width={440} x={150} y={560} variant="dropSpin" idle="tremble"
              visibleFor={V13SCENE6_DURATION - 6} />
      </Sequence>

      <Sequence from={6} layout="none">
        <DiagramCanvas y={0} height={1920}>
          <IconTurtle x={680} y={720} size={118} delay={0} color={SHELL_COLOR} />
          <IconTurtle x={862} y={720} size={118} delay={3} color={SHELL_COLOR} />
          <IconTurtle x={680} y={886} size={118} delay={6} color={SHELL_COLOR} />
          <IconTurtle x={862} y={886} size={118} delay={9} color={SHELL_COLOR} />
        </DiagramCanvas>
      </Sequence>

      <Sequence from={45} layout="none">
        <DiagramCanvas y={0} height={1920}>
          <IconBan x={540} y={700} size={520} delay={0} color={ORANGE} accent={ORANGE} />
        </DiagramCanvas>
      </Sequence>
    </CameraGroup>

    <Sequence from={45} layout="none">
      <PunchPhrase lines={["KHÔNG PHẢI CÁI NÀY"]} top={230} fontSize={76} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
