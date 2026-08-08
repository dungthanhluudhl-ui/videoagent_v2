import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, ImpactFlash, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE2_DURATION = 199;
const STRIKE_LANDING_FRAME = 9;

export const Scene2 = () => {
  return (
    <AbsoluteFill name="Scene2">
      <CameraGroup zoom={{ from: 1.03, to: 1 }} shake={{ at: STRIKE_LANDING_FRAME, len: 10, mag: 6 }} durationInFrames={SCENE2_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Gavel" src="el_s2_hero.png" width={700} x="50%" y={420} variant="strike" visibleFor={SCENE2_DURATION} />
        </Sequence>
        <Sequence from={0} layout="none">
          <ImpactFlash x={540} y={520} delay={STRIKE_LANDING_FRAME} />
        </Sequence>
        <Sequence from={30} layout="none">
          <Support name="Support-Scale" src="el_s2_sup_scale.png" width={300} x={730} y={1030} phase={10} visibleFor={SCENE2_DURATION - 30} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={155} layout="none">
        <PunchPhrase text="NHIỀU YẾU TỐ KHÁC" top={110} />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whip" volume={0.45} /></Sequence>
      <Sequence from={STRIKE_LANDING_FRAME} layout="none"><Sfx name="mouseClick" volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
