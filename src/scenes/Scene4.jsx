import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, SceneBackground, Sequence, Sfx, Shimmer, SpeechBubble, Support } from "./shared";

export const SCENE4_DURATION = 194;

export const Scene4 = () => {
  return (
    <AbsoluteFill name="Scene4">
      <CameraGroup zoom={{ from: 1, to: 1.04 }} pan={{ from: { x: 14, y: 0 }, to: { x: -14, y: -6 } }} durationInFrames={SCENE4_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-Whisper" src="el_s4_hero.png" width={740} x="50%" y={480} variant="flip" visibleFor={SCENE4_DURATION} />
        </Sequence>
        <Sequence from={28} layout="none">
          <Support name="Support-Envelope" src="el_s4_sup_envelope.png" width={280} x={100} y={1060} phase={5} visibleFor={SCENE4_DURATION - 28} />
        </Sequence>
        <Sequence from={28} layout="none">
          <Shimmer src="el_s4_sup_envelope.png" width={280} x={100} y={1060} delay={20} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={121} layout="none">
        <SpeechBubble text="CÓ QUEN AI KHÔNG?" highlight="QUEN" side="left" x={80} y={160} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={121} layout="none"><Sfx name="ding" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
