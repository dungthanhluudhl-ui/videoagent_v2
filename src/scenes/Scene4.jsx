import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE4_DURATION = 141;

export const Scene4 = () => {
  return (
    <AbsoluteFill name="Scene4">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} pan={{ from: { x: 0, y: 0 }, to: { x: 20, y: -10 } }} durationInFrames={SCENE4_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Globe" src="el_globe.png" width={680} x="50%" y={350} variant="dropSpin" visibleFor={SCENE4_DURATION} />
        </Sequence>
        <Sequence from={20} layout="none">
          <Support name="Support-Chart" src="el_chart.png" width={320} x={630} y={980} phase={15} idle="sway" visibleFor={SCENE4_DURATION - 20} />
        </Sequence>
        <Sequence from={40} layout="none">
          <Support name="Support-Gavel" src="el_gavel.png" width={280} x={100} y={1040} phase={35} idle="tremble" visibleFor={SCENE4_DURATION - 40} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={85} layout="none">
        <PunchPhrase lines={["TỶ LỆ KHÁ MỎNG"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={30} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
