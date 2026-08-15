/**
 * V10 - "Itaewon: Dấu vết cuối cùng" - master timeline.
 *
 * Rebuilt from scratch against input/scene_plan10.json after the first cut
 * was rejected for being repetitive and under-illustrated. 26 scenes, ten
 * visual languages, screen time allocated by comprehension load rather than
 * by narration segment.
 */

import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V10Scene1, V10SCENE1_DURATION } from "./scenes/V10Scene1";
import { V10Scene2, V10SCENE2_DURATION } from "./scenes/V10Scene2";
import { V10Scene3, V10SCENE3_DURATION } from "./scenes/V10Scene3";
import { V10Scene4, V10SCENE4_DURATION } from "./scenes/V10Scene4";
import { V10Scene5, V10SCENE5_DURATION } from "./scenes/V10Scene5";
import { V10Scene6, V10SCENE6_DURATION } from "./scenes/V10Scene6";
import { V10Scene7, V10SCENE7_DURATION } from "./scenes/V10Scene7";
import { V10Scene8, V10SCENE8_DURATION } from "./scenes/V10Scene8";
import { V10Scene9, V10SCENE9_DURATION } from "./scenes/V10Scene9";
import { V10Scene10, V10SCENE10_DURATION } from "./scenes/V10Scene10";
import { V10Scene11, V10SCENE11_DURATION } from "./scenes/V10Scene11";
import { V10Scene12, V10SCENE12_DURATION } from "./scenes/V10Scene12";
import { V10Scene13, V10SCENE13_DURATION } from "./scenes/V10Scene13";
import { V10Scene14, V10SCENE14_DURATION } from "./scenes/V10Scene14";
import { V10Scene15, V10SCENE15_DURATION } from "./scenes/V10Scene15";
import { V10Scene16, V10SCENE16_DURATION } from "./scenes/V10Scene16";
import { V10Scene17, V10SCENE17_DURATION } from "./scenes/V10Scene17";
import { V10Scene18, V10SCENE18_DURATION } from "./scenes/V10Scene18";
import { V10Scene19, V10SCENE19_DURATION } from "./scenes/V10Scene19";
import { V10Scene20, V10SCENE20_DURATION } from "./scenes/V10Scene20";
import { V10Scene21, V10SCENE21_DURATION } from "./scenes/V10Scene21";
import { V10Scene22, V10SCENE22_DURATION } from "./scenes/V10Scene22";
import { V10Scene23, V10SCENE23_DURATION } from "./scenes/V10Scene23";
import { V10Scene24, V10SCENE24_DURATION } from "./scenes/V10Scene24";
import { V10Scene25, V10SCENE25_DURATION } from "./scenes/V10Scene25";
import { V10Scene26, V10SCENE26_DURATION } from "./scenes/V10Scene26";
import { Captions10 } from "./scenes/shared10";

const TRANSITION_DURATION = 15;
const T = TRANSITION_DURATION;

// Every scene start is locked to a real Whisper timestamp.
//
// EVERY rail is padded by T, including the first. In TransitionSeries a
// transition makes the next sequence start T frames before the previous one
// ends, so sequence k begins at sum(rails before k) - (k-1)*T. Padding only
// rails 2..N - which is what SKILL.md step 7 used to say, and what the
// previous cut of this video shipped - leaves that first rail short and drags
// EVERY scene from S2 on 15 frames (half a second) ahead of its own audio
// cue. Verified by arithmetic against the plan's own start times before
// changing it; with all rails padded the drift is 0 on all 26 scenes.
export const MASTER10_DURATION =
  (V10SCENE1_DURATION + T) +
  (V10SCENE2_DURATION + T) +
  (V10SCENE3_DURATION + T) +
  (V10SCENE4_DURATION + T) +
  (V10SCENE5_DURATION + T) +
  (V10SCENE6_DURATION + T) +
  (V10SCENE7_DURATION + T) +
  (V10SCENE8_DURATION + T) +
  (V10SCENE9_DURATION + T) +
  (V10SCENE10_DURATION + T) +
  (V10SCENE11_DURATION + T) +
  (V10SCENE12_DURATION + T) +
  (V10SCENE13_DURATION + T) +
  (V10SCENE14_DURATION + T) +
  (V10SCENE15_DURATION + T) +
  (V10SCENE16_DURATION + T) +
  (V10SCENE17_DURATION + T) +
  (V10SCENE18_DURATION + T) +
  (V10SCENE19_DURATION + T) +
  (V10SCENE20_DURATION + T) +
  (V10SCENE21_DURATION + T) +
  (V10SCENE22_DURATION + T) +
  (V10SCENE23_DURATION + T) +
  (V10SCENE24_DURATION + T) +
  (V10SCENE25_DURATION + T) +
  (V10SCENE26_DURATION + T) - 25 * T;

export const ItaewonRemDap = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio10.mp3")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V10SCENE1_DURATION + T}>
          <V10Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE2_DURATION + T}>
          <V10Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE3_DURATION + T}>
          <V10Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE4_DURATION + T}>
          <V10Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE5_DURATION + T}>
          <V10Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE6_DURATION + T}>
          <V10Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE7_DURATION + T}>
          <V10Scene7 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE8_DURATION + T}>
          <V10Scene8 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE9_DURATION + T}>
          <V10Scene9 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE10_DURATION + T}>
          <V10Scene10 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE11_DURATION + T}>
          <V10Scene11 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE12_DURATION + T}>
          <V10Scene12 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE13_DURATION + T}>
          <V10Scene13 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE14_DURATION + T}>
          <V10Scene14 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE15_DURATION + T}>
          <V10Scene15 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE16_DURATION + T}>
          <V10Scene16 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE17_DURATION + T}>
          <V10Scene17 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE18_DURATION + T}>
          <V10Scene18 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE19_DURATION + T}>
          <V10Scene19 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE20_DURATION + T}>
          <V10Scene20 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE21_DURATION + T}>
          <V10Scene21 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE22_DURATION + T}>
          <V10Scene22 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE23_DURATION + T}>
          <V10Scene23 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE24_DURATION + T}>
          <V10Scene24 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE25_DURATION + T}>
          <V10Scene25 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V10SCENE26_DURATION + T}>
          <V10Scene26 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions10 />
    </AbsoluteFill>
  );
};
