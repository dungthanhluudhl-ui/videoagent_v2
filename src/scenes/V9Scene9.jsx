import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  Hero,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
} from "./shared";

export const V9SCENE9_DURATION = 229;

// Bespoke, not SplitCompareScene (already used in S8a - avoid a back-to-
// back template repeat, and here both sides land at their OWN real word
// anchors rather than a fixed 0/20-frame stagger). visualTransformation
// pays off both branches from S3's fork: business side gets the
// checkmark, personal side gets the pillow.
export const V9Scene9 = () => {
  return (
    <AbsoluteFill name="V9Scene9">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={V9SCENE9_DURATION}>
        <SceneBackground variant="chart" />

        {/* anchor: "kê khai thuế đầy đủ" @ local frame 43 (beat_sync.py verified) */}
        <Sequence from={43} layout="none">
          <Hero name="Support-BizDeclare" src="el9_checkmark_doc.png" width={340} x="25%" y={420} variant="dropSpin" visibleFor={V9SCENE9_DURATION - 43} />
        </Sequence>

        {/* anchor: "ngủ ngon" @ local frame 196 (beat_sync.py verified) */}
        <Sequence from={196} layout="none">
          <Hero name="Support-PillowRelax" src="el9_pillow_moon.png" width={340} x="75%" y={420} variant="rise" visibleFor={V9SCENE9_DURATION - 196} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {/* punch text summarizes both halves together, so it leads slightly
          ahead of "ngủ ngon" (196) rather than waiting for it - the icon
          itself stays on its real anchor. Settles right as the pillow
          lands, ~35f dwell before cut to S10 at 229. */}
      <Sequence from={170} layout="none">
        <PunchPhrase lines={["ĐÀNG HOÀNG THÌ NGỦ NGON!"]} top={900} stagger />
      </Sequence>
      <Sequence from={43} layout="none"><Sfx name="switchClick" volume={0.4} /></Sequence>
      <Sequence from={196} layout="none"><Sfx name="ding" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
