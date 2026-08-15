/**
 * V11 - "Itaewon phần 2: cái tên, con dốc và con hẻm" - master timeline.
 *
 * Phần tiếp liền của V10 (ItaewonRemDap): V10 dừng ở hiện trường và cơ chế
 * chèn ép, V11 quay lại từ nguồn gốc cái tên rồi đi tới đúng con hẻm đó bằng
 * hình học - trục Bắc-Nam, các hẻm ngang, chỗ thắt 3,2m.
 *
 * 24 cảnh dựng từ input/scene_plan11.json.
 *
 * MỌI rail đều cộng thêm T, kể cả rail đầu: trong TransitionSeries một
 * transition kéo sequence kế tiếp bắt đầu SỚM hơn T frame, nên chỉ đệm từ
 * rail thứ hai trở đi sẽ đẩy toàn bộ cảnh từ S2 lệch nửa giây so với tiếng.
 */

import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V11Scene1, V11SCENE1_DURATION } from "./scenes/V11Scene1";
import { V11Scene2, V11SCENE2_DURATION } from "./scenes/V11Scene2";
import { V11Scene3, V11SCENE3_DURATION } from "./scenes/V11Scene3";
import { V11Scene4, V11SCENE4_DURATION } from "./scenes/V11Scene4";
import { V11Scene5, V11SCENE5_DURATION } from "./scenes/V11Scene5";
import { V11Scene6, V11SCENE6_DURATION } from "./scenes/V11Scene6";
import { V11Scene7, V11SCENE7_DURATION } from "./scenes/V11Scene7";
import { V11Scene8, V11SCENE8_DURATION } from "./scenes/V11Scene8";
import { V11Scene9, V11SCENE9_DURATION } from "./scenes/V11Scene9";
import { V11Scene10, V11SCENE10_DURATION } from "./scenes/V11Scene10";
import { V11Scene11, V11SCENE11_DURATION } from "./scenes/V11Scene11";
import { V11Scene12, V11SCENE12_DURATION } from "./scenes/V11Scene12";
import { V11Scene13, V11SCENE13_DURATION } from "./scenes/V11Scene13";
import { V11Scene14, V11SCENE14_DURATION } from "./scenes/V11Scene14";
import { V11Scene15, V11SCENE15_DURATION } from "./scenes/V11Scene15";
import { V11Scene16, V11SCENE16_DURATION } from "./scenes/V11Scene16";
import { V11Scene17, V11SCENE17_DURATION } from "./scenes/V11Scene17";
import { V11Scene18, V11SCENE18_DURATION } from "./scenes/V11Scene18";
import { V11Scene19, V11SCENE19_DURATION } from "./scenes/V11Scene19";
import { V11Scene20, V11SCENE20_DURATION } from "./scenes/V11Scene20";
import { V11Scene21, V11SCENE21_DURATION } from "./scenes/V11Scene21";
import { V11Scene22, V11SCENE22_DURATION } from "./scenes/V11Scene22";
import { V11Scene23, V11SCENE23_DURATION } from "./scenes/V11Scene23";
import { V11Scene24, V11SCENE24_DURATION } from "./scenes/V11Scene24";
import { Captions11 } from "./scenes/shared11";

const TRANSITION_DURATION = 15;
const T = TRANSITION_DURATION;

export const MASTER11_DURATION =
  (V11SCENE1_DURATION + T) +
  (V11SCENE2_DURATION + T) +
  (V11SCENE3_DURATION + T) +
  (V11SCENE4_DURATION + T) +
  (V11SCENE5_DURATION + T) +
  (V11SCENE6_DURATION + T) +
  (V11SCENE7_DURATION + T) +
  (V11SCENE8_DURATION + T) +
  (V11SCENE9_DURATION + T) +
  (V11SCENE10_DURATION + T) +
  (V11SCENE11_DURATION + T) +
  (V11SCENE12_DURATION + T) +
  (V11SCENE13_DURATION + T) +
  (V11SCENE14_DURATION + T) +
  (V11SCENE15_DURATION + T) +
  (V11SCENE16_DURATION + T) +
  (V11SCENE17_DURATION + T) +
  (V11SCENE18_DURATION + T) +
  (V11SCENE19_DURATION + T) +
  (V11SCENE20_DURATION + T) +
  (V11SCENE21_DURATION + T) +
  (V11SCENE22_DURATION + T) +
  (V11SCENE23_DURATION + T) +
  (V11SCENE24_DURATION + T) - 23 * T;

export const ItaewonHemNho = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
      <Audio src={staticFile("audio11.mp3")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={V11SCENE1_DURATION + T}>
          <V11Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE2_DURATION + T}>
          <V11Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE3_DURATION + T}>
          <V11Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE4_DURATION + T}>
          <V11Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE5_DURATION + T}>
          <V11Scene5 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE6_DURATION + T}>
          <V11Scene6 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE7_DURATION + T}>
          <V11Scene7 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE8_DURATION + T}>
          <V11Scene8 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE9_DURATION + T}>
          <V11Scene9 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE10_DURATION + T}>
          <V11Scene10 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE11_DURATION + T}>
          <V11Scene11 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE12_DURATION + T}>
          <V11Scene12 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE13_DURATION + T}>
          <V11Scene13 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE14_DURATION + T}>
          <V11Scene14 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE15_DURATION + T}>
          <V11Scene15 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE16_DURATION + T}>
          <V11Scene16 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE17_DURATION + T}>
          <V11Scene17 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE18_DURATION + T}>
          <V11Scene18 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE19_DURATION + T}>
          <V11Scene19 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE20_DURATION + T}>
          <V11Scene20 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE21_DURATION + T}>
          <V11Scene21 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE22_DURATION + T}>
          <V11Scene22 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE23_DURATION + T}>
          <V11Scene23 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={V11SCENE24_DURATION + T}>
          <V11Scene24 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Captions11 />
    </AbsoluteFill>
  );
};
