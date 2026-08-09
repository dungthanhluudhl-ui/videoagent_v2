import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V3Scene1, V3SCENE1_DURATION } from "./scenes/V3Scene1";
import { V3Scene2, V3SCENE2_DURATION } from "./scenes/V3Scene2";
import { V3Scene3, V3SCENE3_DURATION } from "./scenes/V3Scene3";
import { V3Scene4, V3SCENE4_DURATION } from "./scenes/V3Scene4";
import { Captions3 } from "./scenes/shared3";

const TRANSITION_DURATION = 15;

export const MASTER3_DURATION =
  V3SCENE1_DURATION +
  (V3SCENE2_DURATION + TRANSITION_DURATION) +
  (V3SCENE3_DURATION + TRANSITION_DURATION) +
  (V3SCENE4_DURATION + TRANSITION_DURATION) -
  3 * TRANSITION_DURATION;

export const LuatSuDaoDuc3 = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio3.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V3SCENE1_DURATION}>
          <V3Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V3SCENE2_DURATION + TRANSITION_DURATION}>
          <V3Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V3SCENE3_DURATION + TRANSITION_DURATION}>
          <V3Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V3SCENE4_DURATION + TRANSITION_DURATION}>
          <V3Scene4 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions3 />
    </AbsoluteFill>
  );
};
