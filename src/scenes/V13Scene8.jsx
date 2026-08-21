/**
 * S8 - Kẹt như vậy thì đi lại kiểu gì, và một Vua chuột to tới đâu?
 *
 * cụm năm con đứng chôn chân với hai mũi tên bật ngược lại, rồi ngay cạnh
 * nó mọc lên cụm mười tám con to gấp bội.
 *
 * comprehensionLoad: complex - 139 frames (4.63s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Hai cụm nằm CẠNH nhau chứ không thay chỗ nhau. Đổi ảnh thì người xem chỉ
 * thấy một cụm to - còn để cạnh nhau thì "vài con tới vài chục con" là một
 * khoảng cách đo được bằng mắt trong cùng một khung. Kèm theo đó máy lùi ra
 * (1.08 -> 0.92) nên cụm lớn vào khung mà không phải thu nhỏ cụm nhỏ.
 *
 * ForceArrow chứ không phải mũi tên thường: lời thoại nói "không thể di
 * chuyển bình thường" - tức là có LỰC mà không đi được, và ForceArrow là
 * thứ duy nhất trong bộ vẽ được cú bật ngược đó.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, StatCounter } from "./shared";
import { DiagramCanvas, ForceArrow } from "./visualLanguage";

export const V13SCENE8_DURATION = 139;

export const V13Scene8 = () => (
  <AbsoluteFill name="V13Scene8">
    <SceneBackground variant="chart" />

    <CameraGroup zoom={{ from: 1.08, to: 0.92 }} durationInFrames={V13SCENE8_DURATION}>
      <Sequence from={0} layout="none">
        <Hero name="Hero-Few" src="el13_ratking_few.png"
              width={420} x={180} y={520} variant="grow" idle="tremble"
              visibleFor={V13SCENE8_DURATION} />
      </Sequence>

      <DiagramCanvas y={0} height={1920}>
        <ForceArrow x={170} y={643} length={140} thickness={14} delay={10} direction={-1} />
        <ForceArrow x={610} y={643} length={140} thickness={14} delay={14} direction={1} />
      </DiagramCanvas>

      <Sequence from={40} layout="none">
        <Hero name="Hero-Many" src="el13_ratking_many.png"
              width={620} x={420} y={800} variant="grow" idle="sway"
              visibleFor={V13SCENE8_DURATION - 40} />
      </Sequence>
    </CameraGroup>

    <Sequence from={0} layout="none">
      <StatCounter name="Dia-Count" fromValue={5} toValue={20} suffix=" CON"
                   top={1190} delay={40} duration={44} fontSize={76} />
    </Sequence>

    <Sequence from={40} layout="none">
      <PunchPhrase lines={["VÀI CON", "TỚI VÀI CHỤC"]} top={200} fontSize={76} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
