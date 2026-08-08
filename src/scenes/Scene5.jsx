import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, FlowArrow, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE5_DURATION = 248;

export const Scene5 = () => {
  return (
    <AbsoluteFill name="Scene5">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} pan={{ from: { x: 0, y: 10 }, to: { x: -12, y: -14 } }} durationInFrames={SCENE5_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Handshake" src="el_s5_hero.png" width={760} x="50%" y={760} variant="dropSpin" visibleFor={SCENE5_DURATION} />
        </Sequence>
        <Sequence from={30} layout="none">
          <Support name="Support-CuffsMoney" src="el_s5_sup_cuffs.png" width={280} x={780} y={950} phase={15} visibleFor={SCENE5_DURATION - 30} />
        </Sequence>
        <Sequence from={55} layout="none">
          <Support name="Support-Gavel" src="el_s2_hero.png" width={240} x={60} y={880} phase={35} visibleFor={SCENE5_DURATION - 55} />
        </Sequence>
        {/* Verdict -> deal -> consequence: draws itself on after both supports have landed. */}
        <Sequence from={0} layout="none">
          <FlowArrow d="M180,1015 Q360,750 540,890" delay={78} drawFrames={18} />
        </Sequence>
        <Sequence from={0} layout="none">
          <FlowArrow d="M540,890 Q750,950 920,1146" delay={102} drawFrames={18} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={138} layout="none">
        <PunchPhrase text="BẪY ĐẠO ĐỨC LỚN NHẤT" top={110} />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whip" volume={0.45} /></Sequence>
      <Sequence from={78} layout="none"><Sfx name="whoosh" volume={0.3} /></Sequence>
      <Sequence from={102} layout="none"><Sfx name="whoosh" volume={0.3} /></Sequence>
      <Sequence from={138} layout="none"><Sfx name="shutterModern" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
