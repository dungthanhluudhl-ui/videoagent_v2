import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V4Scene1, V4SCENE1_DURATION } from "./scenes/V4Scene1";
import { V4Scene2, V4SCENE2_DURATION } from "./scenes/V4Scene2";
import { V4Scene3, V4SCENE3_DURATION } from "./scenes/V4Scene3";
import { V4Scene4, V4SCENE4_DURATION } from "./scenes/V4Scene4";
import { V4Scene5, V4SCENE5_DURATION } from "./scenes/V4Scene5";
import { Captions4 } from "./scenes/shared4";

const TRANSITION_DURATION = 15;

export const MASTER4_DURATION =
  V4SCENE1_DURATION +
  (V4SCENE2_DURATION + TRANSITION_DURATION) +
  (V4SCENE3_DURATION + TRANSITION_DURATION) +
  (V4SCENE4_DURATION + TRANSITION_DURATION) +
  (V4SCENE5_DURATION + TRANSITION_DURATION) -
  4 * TRANSITION_DURATION;

export const LuatSuDaoDuc4 = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio4.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V4SCENE1_DURATION}>
          <V4Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V4SCENE2_DURATION + TRANSITION_DURATION}>
          <V4Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V4SCENE3_DURATION + TRANSITION_DURATION}>
          <V4Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V4SCENE4_DURATION + TRANSITION_DURATION}>
          <V4Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V4SCENE5_DURATION + TRANSITION_DURATION}>
          <V4Scene5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions4 />
    </AbsoluteFill>
  );
};
