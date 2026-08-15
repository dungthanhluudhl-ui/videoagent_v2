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

export const V9SCENE6_DURATION = 154;

// Bespoke - visualTransformation is a literal reveal (personal-looking
// account flips to expose the shop underneath), paying off S3's dimmed
// right branch. Two sequential Hero elements at the SAME spot (not a
// Hero+Support pair) so the second one's `flip` variant reads as the first
// one turning inside-out, not a new element merely popping in beside it.
export const V9Scene6 = () => {
  return (
    <AbsoluteFill name="V9Scene6">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={V9SCENE6_DURATION} shake={{ at: 107, len: 10, mag: 6 }}>
        <SceneBackground variant="card" />

        <Sequence from={0} layout="none">
          <Hero name="Hero-PersonalMask" src="el9_wallet_personal.png" width={460} x="50%" y={420} variant="rise" visibleFor={110} />
        </Sequence>

        {/* anchor: "bán hàng online" @ local frame 107 (beat_sync.py verified) -
            the reveal itself. Deliberate exception to check_overlap.py's
            pairwise-overlap gate: this element sits at the SAME x/y as
            Hero-PersonalMask on purpose (81.9% spatial overlap during
            their brief 3-frame [107,110) shared window) - that's the
            cross-fade the reveal depends on, not an accidental collision. */}
        <Sequence from={107} layout="none">
          <Hero name="Support-ShopReveal" src="el9_shop_cart.png" width={460} x="50%" y={420} variant="flip" visibleFor={V9SCENE6_DURATION - 107} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {/* anchor: "bán hàng online" @ 107 - 44f dwell before cut to S7 at 154 */}
      <Sequence from={103} layout="none">
        <PunchPhrase lines={["BÁN HÀNG = BỊ SOI"]} top={180} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.35} /></Sequence>
      <Sequence from={107} layout="none"><Sfx name="whip" volume={0.45} /></Sequence>
    </AbsoluteFill>
  );
};
