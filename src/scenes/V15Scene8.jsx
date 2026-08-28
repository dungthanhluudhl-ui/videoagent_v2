import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground } from "./shared";
import { DocumentEvidence } from "./visualLanguage";

export const V15SCENE8_DURATION = 178;

export const V15Scene8 = () => (
  <AbsoluteFill name="V15Scene8">
    <CameraGroup zoom={{ from: 1, to: 1.025 }} durationInFrames={V15SCENE8_DURATION}>
      <SceneBackground variant="card" />
      <DocumentEvidence
        name="An-Le-64-Title"
        src="anle64_pdf_p1_title_focus.png"
        x={40}
        y={370}
        width={1000}
        height={360}
        visibleFor={178}
        sourceAspect={2070 / 630}
        regions={[{ from: 0, x: 0.06, y: 0.04, width: 0.88, height: 0.92, zoom: 1.08 }]}
        dim={0.15}
      />
      <Sequence from={100} layout="none">
        <DocumentEvidence
          name="An-Le-64-Authority"
          src="anle64_pdf_p1_authority.png"
          x={40}
          y={760}
          width={1000}
          height={640}
          visibleFor={78}
          sourceAspect={1380 / 868}
          regions={[{ from: 0, x: 0.06, y: 0.06, width: 0.88, height: 0.88, zoom: 1.08 }]}
          dim={0.2}
        />
      </Sequence>
      <Sequence from={31} layout="none">
        <PunchPhrase lines={["ĐIỂM PHÁP LÝ CỐT LÕI"]} top={190} fontSize={78} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);