import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, Hero, SceneBackground, Support } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V14SCENE1_DURATION = 349;

export const V14Scene1 = () => (
  <AbsoluteFill name="V14Scene1">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1, to: 1.055 }} durationInFrames={V14SCENE1_DURATION}>
      <BackgroundPhoto name="Bg-Warehouse" src="anle64_warehouse_vertical.png" width={1080}
        x="50%" y={0} delay={0} visibleFor={349} durationInFrames={V14SCENE1_DURATION}
        tint={0.34} grayscale={0.55} focus="50% 48%" drift={0.025} />
      <Sequence from={110} layout="none">
        <Hero name="Hero-VictimRestrained" src="anle64_victim_restrained_seated.png"
          width={760} x={160} y={430} visibleFor={239} variant="rise" idle="tremble" />
      </Sequence>
      <Sequence from={146} layout="none">
        <Support name="Sup-Handcuffs" src="anle64_handcuffs.png" width={300} x={690} y={850}
          visibleFor={203} idle="sway" />
      </Sequence>
      <Sequence from={146} layout="none">
        <Support name="Sup-RestraintRope" src="anle64_restraint_rope.png" width={270} x={40} y={900}
          visibleFor={203} idle="sway" />
      </Sequence>
      <Sequence from={256} layout="none">
        <Hero name="Hero-VictimPhone-Preview" src="anle64_victim_phone_under_duress.png"
          width={680} x={180} y={450} visibleFor={93} variant="flip" idle="tremble" />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);