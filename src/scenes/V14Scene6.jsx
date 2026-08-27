import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, Hero, SceneBackground, Support } from "./shared";
import { V14Document } from "./V14Document";

export const V14SCENE6_DURATION = 203;

export const V14Scene6 = () => (
  <AbsoluteFill name="V14Scene6">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1, to: 1.045 }} durationInFrames={V14SCENE6_DURATION}>
      <Sequence from={0} layout="none">
        <V14Document name="Doc-Page8-Paragraph7-Actions" src="anle64_pdf_p8_p7_actions.png"
          width={980} x={50} y={190} visibleFor={203} rot={-0.4} />
      </Sequence>
      <Sequence from={76} layout="none">
        <Hero name="Hero-VictimRestrained-Legal" src="anle64_victim_restrained_seated.png"
          width={500} x={470} y={860} visibleFor={127} variant="rise" idle="tremble" />
      </Sequence>
      <Sequence from={76} layout="none">
        <Support name="Sup-Handcuffs-Legal" src="anle64_handcuffs.png" width={260} x={120} y={980}
          visibleFor={127} idle="sway" />
      </Sequence>
      <Sequence from={158} layout="none">
        <V14Document name="Doc-Page8-Paragraph7-PressureFocus" src="anle64_pdf_p8_p7_pressure.png"
          width={980} x={50} y={190} visibleFor={67} rot={0.3} />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);