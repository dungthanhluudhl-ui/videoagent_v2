import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  BottomBar,
  CameraGroup,
  DocumentStamp,
  Hero,
  INK,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  fontFamily,
} from "./shared";

export const V9SCENE5_DURATION = 137;

const CrossedLabel = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [8, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: 90, top: 240, width: 900 }}>
      <div style={{ position: "relative", display: "inline-block", fontFamily, fontWeight: 900, fontSize: 40, color: INK, opacity: 0.7 }}>
        DOANH THU KINH DOANH
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: `${strike * 100}%`,
            height: 5,
            background: "#D9381E",
            transform: "translateY(-50%) rotate(-2deg)",
          }}
        />
      </div>
    </div>
  );
};

// Bespoke - the relief/release beat that closes out group1 (see S3's fork,
// S4's list). visualTransformation is a label getting struck through, then
// a stamp landing - rendered literally rather than as a generic hero+support pop.
export const V9Scene5 = () => {
  return (
    <AbsoluteFill name="V9Scene5">
      <CameraGroup zoom={{ from: 1, to: 1.04 }} durationInFrames={V9SCENE5_DURATION}>
        <SceneBackground variant="spotlight" />

        <Sequence from={0} layout="none">
          <CrossedLabel />
        </Sequence>

        <Sequence from={0} layout="none">
          <Hero name="Hero-Relieved" src="el9_char_confident.png" width={560} x="50%" y={480} variant="punch" visibleFor={V9SCENE5_DURATION} />
        </Sequence>

        {/* anchor: "không bị tính thuế" @ local frame 92 (beat_sync.py verified) -
            delay=0: Sequence already localizes the frame (see the DocumentStamp
            double-delay note in SceneTemplates.jsx) */}
        <Sequence from={92} layout="none">
          <DocumentStamp text="KHÔNG THUẾ" color="#2F6F4F" x="60%" y={620} delay={0} rot={-10} size={44} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {/* anchor: "không bị tính thuế" @ 92 - 45f dwell before cut to S6 at 137.
          top=290 clears the CrossedLabel above (ends ~280) and the hero
          below (starts 480) - top=130 would have sat on top of the
          crossed-out label once the 2-line auto-split text is accounted for. */}
      <Sequence from={88} layout="none">
        <PunchPhrase lines={["KHÔNG LO BỊ THUẾ!"]} top={290} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.35} /></Sequence>
      <Sequence from={92} layout="none"><Sfx name="switchClick" volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
