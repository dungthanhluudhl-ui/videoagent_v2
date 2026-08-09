import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const V3SCENE1_DURATION = 490;

export const V3Scene1 = () => {
  return (
    <AbsoluteFill name="V3Scene1">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={V3SCENE1_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-HollywoodLawyer" src="el_hollywood_lawyer.png" width={680} x="50%" y={350} variant="dropSpin" visibleFor={V3SCENE1_DURATION} />
        </Sequence>
        <Sequence from={30} layout="none">
          <Support name="Support-Gavel" src="el_gavel.png" width={280} x={100} y={1040} phase={0} idle="sway" visibleFor={V3SCENE1_DURATION - 30} />
        </Sequence>
        <Sequence from={60} layout="none">
          <Support name="Support-Dollar" src="el_dollar_stack.png" width={320} x={630} y={980} phase={25} idle="bob" visibleFor={V3SCENE1_DURATION - 60} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={120} layout="none">
        <PunchPhrase lines={["LUẬT SƯ HOÀNG GIA", "PHIM TVB & MỸ"]} top={120} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={30} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
