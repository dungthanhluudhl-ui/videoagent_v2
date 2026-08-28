import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, EditorialHero, PunchPhrase } from "./shared";
import { BackgroundPhoto } from "./visualLanguage";

export const V15SCENE1_DURATION = 219;

export const V15Scene1 = () => (
  <AbsoluteFill name="V15Scene1">
    <CameraGroup
      zoom={{ from: 1.02, to: 1.075 }}
      pan={{ from: { x: 0, y: 10 }, to: { x: -16, y: -20 } }}
      durationInFrames={V15SCENE1_DURATION}
    >
      <BackgroundPhoto
        name="Warehouse-Background"
        src="anle64_warehouse_vertical.png"
        width={1080}
        x={0}
        y={0}
        durationInFrames={V15SCENE1_DURATION}
        visibleFor={219}
        tint={0.5}
        grayscale={0.76}
        focus="53% 44%"
        drift={0.025}
      />
      <Sequence from={128} layout="none">
        <EditorialHero
          name="Restrained-Person"
          src="anle64_victim_restrained_seated.png"
          width={700}
          x={190}
          y={300}
          variant="rise"
          visibleFor={91}
        />
      </Sequence>
      <Sequence from={79} layout="none">
        <PunchPhrase lines={["KHO PHẾ LIỆU"]} top={190} left={64} right={420} onDark />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);