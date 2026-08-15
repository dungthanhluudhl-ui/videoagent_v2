import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V9Scene1, V9SCENE1_DURATION } from "./scenes/V9Scene1";
import { V9Scene2, V9SCENE2_DURATION } from "./scenes/V9Scene2";
import { V9Scene3, V9SCENE3_DURATION } from "./scenes/V9Scene3";
import { V9Scene4, V9SCENE4_DURATION } from "./scenes/V9Scene4";
import { V9Scene5, V9SCENE5_DURATION } from "./scenes/V9Scene5";
import { V9Scene6, V9SCENE6_DURATION } from "./scenes/V9Scene6";
import { V9Scene7, V9SCENE7_DURATION } from "./scenes/V9Scene7";
import { V9Scene8a, V9SCENE8A_DURATION } from "./scenes/V9Scene8a";
import { V9Scene8b, V9SCENE8B_DURATION } from "./scenes/V9Scene8b";
import { V9Scene9, V9SCENE9_DURATION } from "./scenes/V9Scene9";
import { V9Scene10, V9SCENE10_DURATION } from "./scenes/V9Scene10";
import { Captions9 } from "./scenes/shared9";

const TRANSITION_DURATION = 15;

// Each rail after the first is padded by +TRANSITION_DURATION, then the
// same amount is subtracted once per transition (10 transitions across 11
// scenes) - the paddings exactly cancel the overlap TransitionSeries
// introduces, so every scene's visual arrival stays locked to its real
// Whisper timestamp instead of drifting earlier scene over scene. See
// SKILL.md step 7.
export const MASTER9_DURATION =
  V9SCENE1_DURATION +
  (V9SCENE2_DURATION + TRANSITION_DURATION) +
  (V9SCENE3_DURATION + TRANSITION_DURATION) +
  (V9SCENE4_DURATION + TRANSITION_DURATION) +
  (V9SCENE5_DURATION + TRANSITION_DURATION) +
  (V9SCENE6_DURATION + TRANSITION_DURATION) +
  (V9SCENE7_DURATION + TRANSITION_DURATION) +
  (V9SCENE8A_DURATION + TRANSITION_DURATION) +
  (V9SCENE8B_DURATION + TRANSITION_DURATION) +
  (V9SCENE9_DURATION + TRANSITION_DURATION) +
  (V9SCENE10_DURATION + TRANSITION_DURATION) -
  10 * TRANSITION_DURATION;

export const ThueGiaoDichSo9 = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio9.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V9SCENE1_DURATION}>
          <V9Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE2_DURATION + TRANSITION_DURATION}>
          <V9Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE3_DURATION + TRANSITION_DURATION}>
          <V9Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE4_DURATION + TRANSITION_DURATION}>
          <V9Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE5_DURATION + TRANSITION_DURATION}>
          <V9Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE6_DURATION + TRANSITION_DURATION}>
          <V9Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE7_DURATION + TRANSITION_DURATION}>
          <V9Scene7 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE8A_DURATION + TRANSITION_DURATION}>
          <V9Scene8a />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE8B_DURATION + TRANSITION_DURATION}>
          <V9Scene8b />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE9_DURATION + TRANSITION_DURATION}>
          <V9Scene9 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_DURATION })} />

        <TransitionSeries.Sequence durationInFrames={V9SCENE10_DURATION + TRANSITION_DURATION}>
          <V9Scene10 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions9 />
    </AbsoluteFill>
  );
};
