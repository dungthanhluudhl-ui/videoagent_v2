import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE2_DURATION = 150;

export const Scene2 = () => {
  return (
    <AbsoluteFill name="Scene2">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} pan={{ from: { x: 0, y: 0 }, to: { x: 18, y: -10 } }} durationInFrames={SCENE2_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Lawyer2" src="el_lawyer2.png" width={660} x="50%" y={340} variant="grow" visibleFor={SCENE2_DURATION} />
        </Sequence>
        <Sequence from={20} layout="none">
          <Support name="Support-Books" src="el_books.png" width={320} x={630} y={980} phase={10} idle="sway" visibleFor={SCENE2_DURATION - 20} />
        </Sequence>
        <Sequence from={40} layout="none">
          <Support name="Support-Certificate" src="el_certificate.png" width={300} x={90} y={1040} phase={30} idle="tremble" visibleFor={SCENE2_DURATION - 40} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={45} layout="none">
        <PunchPhrase lines={["18.000 - 19.000", "LUẬT SƯ"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whip" volume={0.4} /></Sequence>
      <Sequence from={45} layout="none"><Sfx name="ding" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
