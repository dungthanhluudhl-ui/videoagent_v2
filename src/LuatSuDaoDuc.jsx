import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1, SCENE1_DURATION } from "./scenes/Scene1";
import { Scene2, SCENE2_DURATION } from "./scenes/Scene2";
import { Scene3, SCENE3_DURATION } from "./scenes/Scene3";
import { Scene4, SCENE4_DURATION } from "./scenes/Scene4";
import { Scene5, SCENE5_DURATION } from "./scenes/Scene5";
import { BG, Captions } from "./scenes/shared";

export const LUATSU_CANVAS = { width: 1080, height: 1920, fps: 30 };

// Absolute start frames come straight from the Whisper word-timestamp
// transcript's scene segmentation (round(seconds * 30)) — gaps between a
// scene's own content end and the next scene's start are real pauses in
// the narration, not errors. `TransitionSeries` overlaps adjacent
// sequences (shortens the timeline by the transition length), so each
// rail's durationInFrames = (gap to next scene's start) + (the transition
// duration immediately BEFORE it) — that extra padding is exactly
// absorbed back out by the overlap, so every scene still lands on its
// original Whisper-derived frame despite the transitions. See the
// derivation in the project notes if this math needs to change: each
// rail = gap_i + T_(i-1), last rail = tail_buffer + T_4.
const ORIGINAL_STARTS = [0, 199, 419, 547, 762];
const TAIL_BUFFER = 258; // 1020 (original total) - 762 (Scene5 original start)
const T = [14, 14, 12, 16]; // transition durations between (1,2) (2,3) (3,4) (4,5)

const GAPS = [
  ORIGINAL_STARTS[1] - ORIGINAL_STARTS[0],
  ORIGINAL_STARTS[2] - ORIGINAL_STARTS[1],
  ORIGINAL_STARTS[3] - ORIGINAL_STARTS[2],
  ORIGINAL_STARTS[4] - ORIGINAL_STARTS[3],
  TAIL_BUFFER,
];

const RAILS = GAPS.map((gap, i) => gap + (i === 0 ? 0 : T[i - 1]));

export const LUATSU_TOTAL_FRAMES = RAILS.reduce((a, b) => a + b, 0) - T.reduce((a, b) => a + b, 0); // 1020

export const LuatSuDaoDuc = () => {
  return (
    <AbsoluteFill name="LuatSuDaoDuc" style={{ backgroundColor: BG }}>
      <Audio src={staticFile("audio.wav")} />
      <TransitionSeries>
        <TransitionSeries.Sequence name="Scene1-DanLuat" durationInFrames={RAILS[0]}>
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T[0] })} />
        <TransitionSeries.Sequence name="Scene2-BangChung" durationInFrames={RAILS[1]}>
          <Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T[1] })} />
        <TransitionSeries.Sequence name="Scene3-KhachHang" durationInFrames={RAILS[2]}>
          <Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T[2] })} />
        <TransitionSeries.Sequence name="Scene4-ChayAn" durationInFrames={RAILS[3]}>
          <Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: T[3] })} />
        <TransitionSeries.Sequence name="Scene5-BayDaoDuc" durationInFrames={RAILS[4]}>
          <Scene5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Captions />
    </AbsoluteFill>
  );
};
