import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE1_DURATION = 180;

export const Scene1 = () => {
  return (
    <AbsoluteFill name="Scene1">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} pan={{ from: { x: 0, y: 0 }, to: { x: -22, y: -10 } }} durationInFrames={SCENE1_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Scales" src="el_s1_hero_scales.png" width={760} x="50%" y={460} variant="rise" visibleFor={SCENE1_DURATION} />
        </Sequence>
        <Sequence from={40} layout="none">
          <Support name="Support-Flag" src="el_s1_sup_flag.png" width={260} x={680} y={1350} phase={0} idle="bob" visibleFor={SCENE1_DURATION - 40} />
        </Sequence>
        <Sequence from={70} layout="none">
          <Support name="Support-Courthouse" src="el_s1_sup_court.png" width={300} x={90} y={1360} phase={20} visibleFor={SCENE1_DURATION - 70} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={130} layout="none">
        <PunchPhrase text="VAI TRÒ RẤT LỚN" top={110} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={6} layout="none"><Sfx name="mouseClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
