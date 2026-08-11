import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
} from "./shared";

export const V4SCENE5_DURATION = 71;

export const V4Scene5 = () => {
  return (
    <AbsoluteFill name="V4Scene5">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={V4SCENE5_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <PunchPhrase lines={["ÁC CHƯA?"]} top={820} fontSize={130} stagger />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={0} layout="none"><Sfx name="ding" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
