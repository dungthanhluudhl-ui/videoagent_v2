import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  FlowArrow,
  Hero,
  INK,
  ORANGE,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  Support,
  fontFamily,
} from "./shared";

export const V9SCENE3_DURATION = 238;

const Label = ({ text, x, y, dim }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translateX(-50%)",
      fontFamily,
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: "0.04em",
      color: INK,
      opacity: dim ? 0.35 : 1,
    }}
  >
    {text}
  </div>
);

// Bespoke - the structural pivot of the whole video. visualTransformation
// is "one stream forks into two branches," a 1-into-2 topology no template
// covers. The right (kinh doanh) branch stays dim here and pays off in
// S6's reveal + S9's resolution - this is the throughline the rest of the
// video is built around, not a one-off scene decision. See SKILL.md 2b.
export const V9Scene3 = () => {
  return (
    <AbsoluteFill name="V9Scene3">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={V9SCENE3_DURATION} shake={{ at: 181, len: 8, mag: 4 }}>
        <SceneBackground variant="chart" />

        <Sequence from={0} layout="none">
          <Hero name="Hero-SourceStream" src="el9_money_icon.png" width={190} x="50%" y={230} variant="grow" visibleFor={V9SCENE3_DURATION} />
        </Sequence>

        {/* anchor: "hai nhóm giao dịch" @ local frame 57 (beat_sync.py verified) -
            the fork itself: both arrows draw, dim branch appears */}
        <Sequence from={57} layout="none">
          <FlowArrow d="M 540,370 Q 350,560 270,760" delay={0} length={520} drawFrames={20} />
        </Sequence>
        <Sequence from={57} layout="none">
          <FlowArrow d="M 540,370 Q 730,560 810,760" delay={0} length={520} drawFrames={20} />
        </Sequence>
        <Sequence from={70} layout="none">
          <div style={{ opacity: 0.35 }}>
            <Support name="Support-BusinessBranch" src="el9_shop_cart.png" width={280} x={740} y={790} idle="sway" visibleFor={V9SCENE3_DURATION - 70} />
          </div>
        </Sequence>
        <Sequence from={70} layout="none">
          <Label text="KINH DOANH" x={740} y={1010} dim />
        </Sequence>

        {/* anchor: "giao dịch cá nhân thuần túy" @ local frame 181 (beat_sync.py verified) */}
        <Sequence from={181} layout="none">
          <Support name="Support-PersonalBranch" src="el9_wallet_personal.png" width={280} x={270} y={790} idle="sway" visibleFor={V9SCENE3_DURATION - 181} />
        </Sequence>
        <Sequence from={181} layout="none">
          <Label text="CÁ NHÂN" x={270} y={1010} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {/* anchor: "hai nhóm giao dịch" @ 57 - the fork's own headline.
          top=1080 sits below the branch labels (end ~1010), clear of the
          bottom safe zone (1460) - top=130 would have collided with the
          small source-stream hero at y=230 once the 2-line auto-split
          text (21 chars) is accounted for. */}
      <Sequence from={62} layout="none">
        <PunchPhrase lines={["HAI NHÓM, HAI SỐ PHẬN"]} top={1080} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.35} /></Sequence>
      <Sequence from={57} layout="none"><Sfx name="whip" volume={0.4} /></Sequence>
      <Sequence from={181} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
