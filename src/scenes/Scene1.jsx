import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE1_DURATION = 135;

export const Scene1 = () => {
  return (
    <AbsoluteFill name="Scene1">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} pan={{ from: { x: 0, y: 0 }, to: { x: -20, y: -12 } }} durationInFrames={SCENE1_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Lawyer1" src="el_lawyer1.png" width={680} x="50%" y={340} variant="rise" visibleFor={SCENE1_DURATION} />
        </Sequence>
        <Sequence from={25} layout="none">
          <Support name="Support-Scales" src="el_scales.png" width={340} x={630} y={980} phase={0} idle="sway" visibleFor={SCENE1_DURATION - 25} />
        </Sequence>
        <Sequence from={45} layout="none">
          <Support name="Support-Gavel" src="el_gavel.png" width={280} x={100} y={1060} phase={20} idle="bob" visibleFor={SCENE1_DURATION - 45} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={55} layout="none">
        <PunchPhrase lines={["THỰC TRẠNG", "NGHỀ LUẬT SƯ"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={25} layout="none"><Sfx name="mouseClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
