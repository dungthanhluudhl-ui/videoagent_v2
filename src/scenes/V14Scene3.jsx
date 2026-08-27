import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, Hero, PunchPhrase, SceneBackground } from "./shared";
import { V14Document } from "./V14Document";

export const V14SCENE3_DURATION = 318;

export const V14Scene3 = () => (
  <AbsoluteFill name="V14Scene3">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1, to: 1.035 }} durationInFrames={V14SCENE3_DURATION}>
      <Sequence from={0} layout="none">
        <V14Document name="Doc-Page3-PressureContinues" src="anle64_pdf_p3_pressure_continues.png"
          width={980} x={50} y={210} visibleFor={299} rot={0.5} />
      </Sequence>
      <Sequence from={120} layout="none">
        <Hero name="Hero-VictimRestrained-Reuse" src="anle64_victim_restrained_seated.png"
          width={430} x={610} y={810} visibleFor={198} variant="rise" idle="tremble" />
      </Sequence>
    </CameraGroup>
    <Sequence from={215} layout="none">
      <PunchPhrase lines={["CÂU HỎI PHÁP LÝ"]} top={260} fontSize={76} onDark />
    </Sequence>
  </AbsoluteFill>
);