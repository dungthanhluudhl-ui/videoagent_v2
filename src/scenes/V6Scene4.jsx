import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  Hero,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  Support,
  TensionString,
} from "./shared";

export const V6SCENE4_DURATION = 476;

// Bespoke scene, not CollageScene - see SKILL.md step 2b: "when none of
// the 7 fits, compose a bespoke arrangement directly from the shared
// primitives." This scene's visualTransformation is "rủi ro → lãi suất →
// trả chậm → phí phạt CỘNG DỒN thành căng thẳng" - CollageScene's grammar
// (each support pops into one of two fixed corner slots, replacing the
// last) illustrates a SEQUENCE, not an ACCUMULATION - it never actually
// showed anything piling up. Here the four consequences hang along a
// TensionString (shared.jsx) spanning the width instead, each landing at
// its own real anchor frame and STAYING visible (no visibleFor exit) so
// they visibly accumulate left-to-right, while the string itself pulls
// tauter with each addition and twangs right as "CĂNG NHƯ DÂY ĐÀN" lands -
// the punchline is rendered literally, not just captioned over icons.
export const V6Scene4 = () => {
  const landedAt = [159, 255, 308, 378];
  return (
    <AbsoluteFill name="V6Scene4">
      <CameraGroup
        zoom={{ from: 1, to: 1.05 }}
        durationInFrames={V6SCENE4_DURATION}
        shake={[
          { at: 308, len: 8, mag: 4 },
          { at: 415, len: 14, mag: 8 }, // the string's twang moment, timed with the punch line
        ]}
      >
        <SceneBackground variant="spotlight" />

        <Sequence from={0} layout="none">
          <Hero name="Hero-FlameInterest" src="el6_flame_interest.png" width={480} x="50%" y={420} variant="strike" visibleFor={V6SCENE4_DURATION} />
        </Sequence>

        <TensionString x1={100} x2={980} y={1250} landedAt={landedAt} vibrateFrom={415} />

        {/* anchor: "rủi ro cao hơn" @ local frame 159 (beat_sync.py verified) */}
        <Sequence from={159} layout="none">
          <Support name="Support-RiskIcon" src="el6_risk_icon.png" width={190} x={120} y={1170} idle="sway" visibleFor={V6SCENE4_DURATION - 159} />
        </Sequence>

        {/* anchor: "cao hơn vay [thế chấp]" @ local frame 255 - callback
            comparing lãi suất tín chấp vs thế chấp */}
        <Sequence from={255} layout="none">
          <Support name="Support-CreditCallback" src="el6_door_credit.png" width={150} x={325} y={1160} idle="sway" visibleFor={V6SCENE4_DURATION - 255} />
        </Sequence>

        {/* anchor: "nỡ trả chậm" @ local frame 308 (beat_sync.py verified) */}
        <Sequence from={308} layout="none">
          <Support name="Support-LateClock" src="el6_late_clock.png" width={180} x={540} y={1170} idle="tremble" visibleFor={V6SCENE4_DURATION - 308} />
        </Sequence>

        {/* anchor: "tiền phí phạt" @ local frame 378 (beat_sync.py verified) */}
        <Sequence from={378} layout="none">
          <Support name="Support-PenaltyStamp" src="el6_penalty_stamp.png" width={200} x={760} y={1150} idle="bob" visibleFor={V6SCENE4_DURATION - 378} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={415} layout="none">
        {/* anchor: "căng như dây" @ local frame 427 - dwell time before it */}
        <PunchPhrase lines={["CĂNG NHƯ DÂY ĐÀN!"]} top={200} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={30} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
