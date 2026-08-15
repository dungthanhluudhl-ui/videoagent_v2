import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  Hero,
  SceneBackground,
  Sequence,
  Sfx,
  SpeechBubbleQuote,
  Support,
} from "./shared";

export const V9SCENE10_DURATION = 172;

// Bespoke, not the plain QuoteBubbleScene template - adds a comment-icon
// beat anchored to "bình luận" that the template has no slot for. Closing
// scene: quiet, direct-to-camera, no dense punch phrase competing with the
// quote bubble (SKILL.md's "not every scene needs one" allowance).
export const V9Scene10 = () => {
  return (
    <AbsoluteFill name="V9Scene10">
      <CameraGroup zoom={{ from: 1, to: 1.04 }} durationInFrames={V9SCENE10_DURATION}>
        <SceneBackground variant="spotlight" />

        <Sequence from={0} layout="none">
          <SpeechBubbleQuote text="Bạn từng bị nhầm lẫn giao dịch bao giờ chưa?" highlight="nhầm lẫn" top={150} delay={10} />
        </Sequence>

        <Sequence from={20} layout="none">
          <Hero name="Hero-Questioning" src="el9_char_questioning.png" width={620} x="50%" y={480} variant="rise" visibleFor={V9SCENE10_DURATION - 20} />
        </Sequence>

        {/* anchor: "bình luận" @ local frame 78 (beat_sync.py verified) */}
        <Sequence from={78} layout="none">
          <Support name="Support-CommentIcon" src="el9_comment_icon.png" width={190} x={790} y={280} idle="bob" visibleFor={V9SCENE10_DURATION - 78} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.35} /></Sequence>
      <Sequence from={78} layout="none"><Sfx name="ding" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
