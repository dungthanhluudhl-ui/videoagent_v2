import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE3_DURATION = 159;

export const Scene3 = () => {
  return (
    <AbsoluteFill name="Scene3">
      <CameraGroup zoom={{ from: 1, to: 1.07 }} pan={{ from: { x: 0, y: 0 }, to: { x: -15, y: -15 } }} durationInFrames={SCENE3_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Crowd" src="el_crowd.png" width={760} x="50%" y={350} variant="punch" visibleFor={SCENE3_DURATION} />
        </Sequence>
        <Sequence from={25} layout="none">
          <Support name="Support-Briefcase" src="el_briefcase.png" width={320} x={640} y={1000} phase={5} idle="sway" visibleFor={SCENE3_DURATION - 25} />
        </Sequence>
        <Sequence from={45} layout="none">
          <Support name="Support-Chart" src="el_chart.png" width={300} x={90} y={1040} phase={25} idle="bob" visibleFor={SCENE3_DURATION - 45} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={110} layout="none">
        <PunchPhrase lines={["100 TRIỆU DÂN"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="shutterModern" volume={0.4} /></Sequence>
      <Sequence from={35} layout="none"><Sfx name="pageTurn" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
