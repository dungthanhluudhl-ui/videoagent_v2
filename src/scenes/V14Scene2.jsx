import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, Hero, SceneBackground } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";
import { V14Document } from "./V14Document";

export const V14SCENE2_DURATION = 236;

export const V14Scene2 = () => (
  <AbsoluteFill name="V14Scene2">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1.02, to: 1.07 }} durationInFrames={V14SCENE2_DURATION}>
      <BackgroundPhoto name="Bg-Warehouse-Reuse" src="anle64_warehouse_vertical.png" width={1080}
        x="50%" y={0} delay={0} visibleFor={236} durationInFrames={V14SCENE2_DURATION}
        tint={0.48} grayscale={0.72} focus="48% 48%" drift={0.02} />
      <Sequence from={0} layout="none">
        <Hero name="Hero-VictimPhone" src="anle64_victim_phone_under_duress.png"
          width={760} x={70} y={430} visibleFor={236} variant="rise" idle="tremble" />
      </Sequence>
      <Sequence from={120} layout="none">
        <V14Document name="Doc-Page3-NoonDemand" src="anle64_pdf_p3_noon_demand.png"
          width={560} x={460} y={260} visibleFor={116} rot={-1.2} />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);