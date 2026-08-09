import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const V3SCENE4_DURATION = 500;

export const V3Scene4 = () => {
  return (
    <AbsoluteFill name="V3Scene4">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={V3SCENE4_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Lawyer2" src="el_lawyer2.png" width={680} x="50%" y={350} variant="rise" visibleFor={V3SCENE4_DURATION} />
        </Sequence>
        <Sequence from={30} layout="none">
          <Support name="Support-Crowd" src="el_crowd.png" width={340} x={610} y={980} phase={15} idle="sway" visibleFor={V3SCENE4_DURATION - 30} />
        </Sequence>
        <Sequence from={60} layout="none">
          <Support name="Support-Briefcase" src="el_briefcase.png" width={280} x={100} y={1040} phase={35} idle="tremble" visibleFor={V3SCENE4_DURATION - 60} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={60} layout="none">
        <PunchPhrase lines={["BÓC TÁCH NGHỀ LUẬT SƯ", "TẠI VIỆT NAM"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={30} layout="none"><Sfx name="ding" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
