import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground } from "./shared";
import { Timeline } from "./visualLanguage";

export const V15SCENE4_DURATION = 177;

export const V15Scene4 = () => (
  <AbsoluteFill name="V15Scene4">
    <CameraGroup zoom={{ from: 1, to: 1.03 }} durationInFrames={V15SCENE4_DURATION}>
      <SceneBackground variant="chart" />
      <Timeline
        y={620}
        inset={220}
        events={[
          { label: "NHỮNG NGÀY SAU", sub: "kéo dài", delay: 0 },
          { label: "GIỮ NGƯỜI", sub: "không chấm dứt", delay: 52 },
          { label: "ÉP CHUYỂN TIỀN", sub: "vẫn tiếp diễn", delay: 73 },
        ]}
      />
      <Sequence from={113} layout="none">
        <PunchPhrase lines={["NHƯNG VÌ SAO?"]} top={980} fontSize={92} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);