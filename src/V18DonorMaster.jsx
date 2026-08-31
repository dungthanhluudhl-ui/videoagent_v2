import {Audio} from "@remotion/media";
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from "remotion";
import {CAPTION_LINES18} from "./captionData18";
import {V18Scene3, V18SCENE3_DURATION} from "./scenes/V18Scene3";
import {V18Scene4, V18SCENE4_DURATION} from "./scenes/V18Scene4";
import {V18Scene8, V18SCENE8_DURATION} from "./scenes/V18Scene8";
import {V18Scene9, V18SCENE9_DURATION} from "./scenes/V18Scene9";
import {ORANGE, fontFamily} from "./scenes/shared";

const SEGMENTS = [
  {sourceStart: 348, duration: V18SCENE3_DURATION, component: V18Scene3},
  {sourceStart: 584, duration: V18SCENE4_DURATION, component: V18Scene4},
  {sourceStart: 1246, duration: V18SCENE8_DURATION, component: V18Scene8},
  {sourceStart: 1424, duration: V18SCENE9_DURATION, component: V18Scene9},
];

export const V18_DONOR_DURATION = SEGMENTS.reduce((sum, segment) => sum + segment.duration, 0);

const sourceFrameAt = (frame) => {
  let timelineStart = 0;
  for (const segment of SEGMENTS) {
    if (frame < timelineStart + segment.duration) {
      return segment.sourceStart + frame - timelineStart;
    }
    timelineStart += segment.duration;
  }
  return -1;
};

const DonorCaptions = () => {
  const sourceFrame = sourceFrameAt(useCurrentFrame());
  const line = CAPTION_LINES18.find((candidate) => candidate.length > 0 &&
    sourceFrame >= candidate[0].startFrame &&
    sourceFrame <= candidate[candidate.length - 1].endFrame + 10);
  if (!line) return null;
  return (
    <div style={{position: "absolute", left: 40, right: 40, bottom: 380,
      display: "flex", justifyContent: "center", zIndex: 100, pointerEvents: "none"}}>
      <div style={{background: "rgba(15,15,14,.88)", padding: "12px 24px",
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 .32em",
        maxWidth: "100%", boxShadow: "0 8px 26px rgba(0,0,0,.3)"}}>
        {line.map((word, index) => {
          const active = sourceFrame >= word.startFrame && sourceFrame <= word.endFrame + 2;
          return <span key={`${word.text}-${index}`} style={{fontFamily, fontSize: 38,
            fontWeight: 700, lineHeight: 1.25, color: active ? ORANGE : "#fff"}}>{word.text}</span>;
        })}
      </div>
    </div>
  );
};

export const V18DonorMaster = () => {
  let timelineStart = 0;
  return (
    <AbsoluteFill style={{backgroundColor: "#11110f"}}>
      {SEGMENTS.map((segment, index) => {
        const Scene = segment.component;
        const from = timelineStart;
        timelineStart += segment.duration;
        return (
          <Sequence key={index} from={from} durationInFrames={segment.duration}>
            <Scene />
            <Audio src={staticFile("audio18.mp3")} trimBefore={segment.sourceStart}
              trimAfter={segment.sourceStart + segment.duration} />
          </Sequence>
        );
      })}
      <DonorCaptions />
    </AbsoluteFill>
  );
};