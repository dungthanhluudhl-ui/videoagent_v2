/**
 * V12ColdStart - composition tổng của bản dựng thử 3 cảnh.
 *
 * Chỉ tồn tại để xem trước trong Remotion Studio: 3 cảnh nối liền mạch, chạy
 * trên đúng audio thật (audio11.mp3, 0-10.32s) kèm phụ đề bám từ, để kiểm
 * được tiêu chí "audio nói đến đâu có minh họa đến đó" - thứ mà 3 still rời
 * không trả lời được.
 *
 * Không phải video giao đi: scene_plan12.json đã đặt status "shipped" vì đây
 * là bài kiểm nguội, không phải một tập phim.
 *
 * TransitionSeries rút ngắn timeline đúng bằng mỗi khoảng chồng, nên mỗi rail
 * phải cộng thêm T để mọi cảnh vẫn rơi đúng mốc audio của nó (SKILL.md bước 7).
 * Ở đây audio bắt đầu ngay từ khung 0 nên sai một khung là thấy ngay bằng tai.
 */

import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { V12Scene1, V12SCENE1_DURATION } from "./scenes/V12Scene1";
import { V12Scene2, V12SCENE2_DURATION } from "./scenes/V12Scene2";
import { V12Scene3, V12SCENE3_DURATION } from "./scenes/V12Scene3";
import { Captions11 } from "./scenes/shared11";

const T = 15;

export const V12_COLDSTART_DURATION =
  (V12SCENE1_DURATION + T) + (V12SCENE2_DURATION + T) + (V12SCENE3_DURATION + T) - 2 * T;

export const V12ColdStart = () => (
  <AbsoluteFill style={{ backgroundColor: "#E7E3D9" }}>
    <Audio src={staticFile("audio11.mp3")} />

    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={V12SCENE1_DURATION + T}>
        <V12Scene1 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={V12SCENE2_DURATION + T}>
        <V12Scene2 />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
      <TransitionSeries.Sequence durationInFrames={V12SCENE3_DURATION + T}>
        <V12Scene3 />
      </TransitionSeries.Sequence>
    </TransitionSeries>

    {/* Phụ đề mount MỘT LẦN ở master, là anh em ĐỨNG SAU TransitionSeries -
        đặt bên trong thì nó bị cuốn theo từng lần chuyển cảnh. */}
    <Captions11 />
  </AbsoluteFill>
);
