import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V6Scene1, V6SCENE1_DURATION } from "./scenes/V6Scene1";
import { V6Scene2, V6SCENE2_DURATION } from "./scenes/V6Scene2";
import { V6Scene3, V6SCENE3_DURATION } from "./scenes/V6Scene3";
import { V6Scene4, V6SCENE4_DURATION } from "./scenes/V6Scene4";
import { V6Scene5, V6SCENE5_DURATION } from "./scenes/V6Scene5";
import { V6Scene6, V6SCENE6_DURATION } from "./scenes/V6Scene6";
import { V6Scene7, V6SCENE7_DURATION } from "./scenes/V6Scene7";
import { Captions6 } from "./scenes/shared6";

const TRANSITION_DURATION = 15;

export const MASTER6_DURATION =
  V6SCENE1_DURATION +
  (V6SCENE2_DURATION + TRANSITION_DURATION) +
  (V6SCENE3_DURATION + TRANSITION_DURATION) +
  (V6SCENE4_DURATION + TRANSITION_DURATION) +
  (V6SCENE5_DURATION + TRANSITION_DURATION) +
  (V6SCENE6_DURATION + TRANSITION_DURATION) +
  (V6SCENE7_DURATION + TRANSITION_DURATION) -
  6 * TRANSITION_DURATION;

export const VayTinChap = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio6.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V6SCENE1_DURATION}>
          <V6Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE2_DURATION + TRANSITION_DURATION}>
          <V6Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE3_DURATION + TRANSITION_DURATION}>
          <V6Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE4_DURATION + TRANSITION_DURATION}>
          <V6Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE5_DURATION + TRANSITION_DURATION}>
          <V6Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE6_DURATION + TRANSITION_DURATION}>
          <V6Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V6SCENE7_DURATION + TRANSITION_DURATION}>
          <V6Scene7 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions6 />
    </AbsoluteFill>
  );
};
