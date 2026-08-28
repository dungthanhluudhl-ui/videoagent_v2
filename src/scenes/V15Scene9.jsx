import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, EditorialHero, PunchPhrase, SceneBackground } from "./shared";
import { DocumentEvidence } from "./visualLanguage";

export const V15SCENE9_DURATION = 203;

export const V15Scene9 = () => (
  <AbsoluteFill name="V15Scene9">
    <CameraGroup zoom={{ from: 1, to: 1.04 }} durationInFrames={V15SCENE9_DURATION}>
      <SceneBackground variant="spotlight" />
      <DocumentEvidence
        name="Coercive-Actions-Document"
        src="anle64_pdf_p8_p7_actions.png"
        x={40}
        y={280}
        width={1000}
        height={700}
        visibleFor={203}
        sourceAspect={2118 / 1488}
        regions={[
          { from: 0, x: 0.05, y: 0.05, width: 0.9, height: 0.9, zoom: 1.05 },
          { from: 76, x: 0.06, y: 0.22, width: 0.82, height: 0.68, zoom: 1.12 },
        ]}
        dim={0.34}
      />
      <Sequence from={76} layout="none">
        <EditorialHero
          name="Restrained-Rule-Subject"
          src="anle64_victim_restrained_seated.png"
          width={420}
          x={630}
          y={560}
          variant="strike"
          visibleFor={127}
        />
      </Sequence>
      <Sequence from={108} layout="none">
        <PunchPhrase lines={["NỢ THẬT ≠ QUYỀN GIỮ NGƯỜI"]} top={1030} left={56} right={430} fontSize={68} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);