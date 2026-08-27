import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, Hero, SceneBackground } from "./shared";
import { V14Document } from "./V14Document";

export const V14SCENE4_DURATION = 264;

export const V14Scene4 = () => (
  <AbsoluteFill name="V14Scene4">
    <SceneBackground variant="card" />
    <CameraGroup zoom={{ from: 1, to: 1.045 }} durationInFrames={V14SCENE4_DURATION}>
      <Sequence from={0} layout="none">
        <V14Document name="Doc-Page2-RealDebt" src="anle64_pdf_p2_real_debt.png"
          width={560} x={40} y={300} visibleFor={264} rot={-1.1} />
      </Sequence>
      <Sequence from={109} layout="none">
        <Hero name="Hero-HandcuffsLarge" src="anle64_handcuffs.png" width={520} x={540} y={560}
          visibleFor={155} variant="flip" idle="sway" />
      </Sequence>
      <Sequence from={164} layout="none">
        <Hero name="Hero-VictimRestrained-Paradox" src="anle64_victim_restrained_seated.png"
          width={430} x={610} y={760} visibleFor={100} variant="rise" idle="tremble" />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);