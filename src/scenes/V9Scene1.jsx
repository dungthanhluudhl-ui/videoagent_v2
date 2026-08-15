import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  Hero,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  Shimmer,
  Support,
} from "./shared";

export const V9SCENE1_DURATION = 310;

// Bespoke, not CollageScene - visualTransformation is "an ordinary transfer
// gets swept by a tax-office scan," so the Shimmer light-sweep (masked to
// the Hero's own silhouette) IS the scene's actual mechanism, not a generic
// pop-in beat. See SKILL.md step 2b.
export const V9Scene1 = () => {
  return (
    <AbsoluteFill name="V9Scene1">
      <CameraGroup
        zoom={{ from: 1, to: 1.05 }}
        durationInFrames={V9SCENE1_DURATION}
        shake={{ at: 225, len: 10, mag: 5 }}
      >
        <SceneBackground variant="grid" />

        <Sequence from={0} layout="none">
          <Hero name="Hero-PhoneTransfer" src="el9_char_normal.png" width={620} x="50%" y={380} variant="rise" visibleFor={V9SCENE1_DURATION} />
        </Sequence>

        {/* anchor: "chuyển khoản lặt vặt" @ local frame 66 (beat_sync.py verified) */}
        <Sequence from={66} layout="none">
          <Support name="Support-MoneyIcon" src="el9_money_icon.png" width={210} x={810} y={990} idle="sway" visibleFor={V9SCENE1_DURATION - 66} />
        </Sequence>

        {/* anchor: "quét dữ liệu" @ local frame 225 (beat_sync.py verified) */}
        <Sequence from={225} layout="none">
          <Support name="Support-ScanEye" src="el9_scan_eye.png" width={230} x={70} y={1000} idle="tremble" visibleFor={V9SCENE1_DURATION - 225} />
        </Sequence>
        <Sequence from={225} layout="none">
          <Shimmer src="el9_char_normal.png" width={620} x="50%" y={380} delay={0} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={230} layout="none">
        {/* anchor: "quét dữ liệu" @ 225 - punch lands right after, real
            dwell (80f) before the cut to S2 at 310 */}
        <PunchPhrase lines={["BỊ THUẾ SOI?"]} top={130} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={225} layout="none"><Sfx name="switchClick" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
