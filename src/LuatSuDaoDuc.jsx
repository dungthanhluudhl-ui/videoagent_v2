import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Captions } from "./scenes/shared";
import { Scene1, SCENE1_DURATION } from "./scenes/Scene1";
import { Scene2, SCENE2_DURATION } from "./scenes/Scene2";
import { Scene3, SCENE3_DURATION } from "./scenes/Scene3";
import { Scene4, SCENE4_DURATION } from "./scenes/Scene4";

export const LUATSU_CANVAS = {
  width: 1080,
  height: 1920,
  fps: 30,
};

const TRANSITION_DURATION = 15;

// Total timeline duration (585 frames @ 30fps = 19.5 seconds)
export const LUATSU_TOTAL_FRAMES = 585;

export const LuatSuDaoDuc = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      {/* Master Voiceover Audio */}
      <Audio src={staticFile("audio.wav")} />

      {/* Main TransitionSeries Timeline */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE1_DURATION}>
          <Scene1 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE2_DURATION + TRANSITION_DURATION}>
          <Scene2 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE3_DURATION + TRANSITION_DURATION}>
          <Scene3 />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE4_DURATION + TRANSITION_DURATION}>
          <Scene4 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Master Subtitle / Captions Layer */}
      <Captions />
    </AbsoluteFill>
  );
};
