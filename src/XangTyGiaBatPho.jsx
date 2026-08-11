import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V8Scene1, V8SCENE1_DURATION } from "./scenes/V8Scene1";
import { V8Scene2, V8SCENE2_DURATION } from "./scenes/V8Scene2";
import { V8Scene3, V8SCENE3_DURATION } from "./scenes/V8Scene3";
import { V8Scene4, V8SCENE4_DURATION } from "./scenes/V8Scene4";
import { V8Scene5, V8SCENE5_DURATION } from "./scenes/V8Scene5";
import { V8Scene6, V8SCENE6_DURATION } from "./scenes/V8Scene6";
import { V8Scene7, V8SCENE7_DURATION } from "./scenes/V8Scene7";
import { Captions8 } from "./scenes/shared8";

const TRANSITION_DURATION = 15;

export const MASTER8_DURATION =
  V8SCENE1_DURATION +
  (V8SCENE2_DURATION + TRANSITION_DURATION) +
  (V8SCENE3_DURATION + TRANSITION_DURATION) +
  (V8SCENE4_DURATION + TRANSITION_DURATION) +
  (V8SCENE5_DURATION + TRANSITION_DURATION) +
  (V8SCENE6_DURATION + TRANSITION_DURATION) +
  (V8SCENE7_DURATION + TRANSITION_DURATION) -
  6 * TRANSITION_DURATION;

export const XangTyGiaBatPho = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio8.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V8SCENE1_DURATION}>
          <V8Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE2_DURATION + TRANSITION_DURATION}>
          <V8Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE3_DURATION + TRANSITION_DURATION}>
          <V8Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE4_DURATION + TRANSITION_DURATION}>
          <V8Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE5_DURATION + TRANSITION_DURATION}>
          <V8Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE6_DURATION + TRANSITION_DURATION}>
          <V8Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={V8SCENE7_DURATION + TRANSITION_DURATION}>
          <V8Scene7 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions8 />
    </AbsoluteFill>
  );
};
