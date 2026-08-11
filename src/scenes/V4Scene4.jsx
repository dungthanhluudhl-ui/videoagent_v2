import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  DocumentStamp,
  Hero,
  SceneBackground,
  Sequence,
  Sfx,
  Support,
} from "./shared";

export const V4SCENE4_DURATION = 210;

export const V4Scene4 = () => {
  return (
    <AbsoluteFill name="V4Scene4">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={V4SCENE4_DURATION}>
        <SceneBackground />

        <Sequence from={0} layout="none">
          <Hero
            name="Hero-CuffedLawyer"
            src="el_s4_hero_v4.png"
            width={640}
            x="50%"
            y={330}
            variant="dropSpin"
            idle="tremble"
            visibleFor={V4SCENE4_DURATION}
          />
        </Sequence>

        <Sequence from={35} layout="none">
          <Support
            name="Support-Gavel"
            src="el_gavel.png"
            width={280}
            x={650}
            y={1030}
            idle="sway"
            visibleFor={V4SCENE4_DURATION - 35}
          />
        </Sequence>

        <Sequence from={0} layout="none">
          <DocumentStamp text="BỊ CÁO" color="#D9381E" x="72%" y={220} delay={131} rot={-12} size={54} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={131} layout="none"><Sfx name="switchClick" volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
