import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V5Scene1, V5SCENE1_DURATION } from "./scenes/V5Scene1";
import { V5Scene2, V5SCENE2_DURATION } from "./scenes/V5Scene2";
import { V5Scene3, V5SCENE3_DURATION } from "./scenes/V5Scene3";
import { V5Scene4, V5SCENE4_DURATION } from "./scenes/V5Scene4";
import { V5Scene5, V5SCENE5_DURATION } from "./scenes/V5Scene5";
import { V5Scene6, V5SCENE6_DURATION } from "./scenes/V5Scene6";
import { Captions5 } from "./scenes/shared5";

const TRANSITION_DURATION = 15;

export const MASTER5_DURATION =
  V5SCENE1_DURATION +
  (V5SCENE2_DURATION + TRANSITION_DURATION) +
  (V5SCENE3_DURATION + TRANSITION_DURATION) +
  (V5SCENE4_DURATION + TRANSITION_DURATION) +
  (V5SCENE5_DURATION + TRANSITION_DURATION) +
  (V5SCENE6_DURATION + TRANSITION_DURATION) -
  5 * TRANSITION_DURATION;

export const LuongGrossNet = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio5.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V5SCENE1_DURATION}>
          <V5Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V5SCENE2_DURATION + TRANSITION_DURATION}>
          <V5Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V5SCENE3_DURATION + TRANSITION_DURATION}>
          <V5Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V5SCENE4_DURATION + TRANSITION_DURATION}>
          <V5Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V5SCENE5_DURATION + TRANSITION_DURATION}>
          <V5Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V5SCENE6_DURATION + TRANSITION_DURATION}>
          <V5Scene6 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions5 />
    </AbsoluteFill>
  );
};
