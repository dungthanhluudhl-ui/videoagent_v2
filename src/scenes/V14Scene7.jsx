import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, SceneBackground } from "./shared";
import { V14Document } from "./V14Document";

export const V14SCENE7_DURATION = 174;

export const V14Scene7 = () => (
  <AbsoluteFill name="V14Scene7">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1, to: 1.065 }} durationInFrames={V14SCENE7_DURATION}>
      <Sequence from={0} layout="none">
        <V14Document name="Doc-Page8-Paragraph7-ReleaseCondition"
          src="anle64_pdf_p8_p7_release_condition.png" width={980} x={50} y={260}
          visibleFor={174} rot={-0.4} />
      </Sequence>
      <Sequence from={94} layout="none">
        <V14Document name="Doc-Page8-Paragraph7-ConclusionFocus"
          src="anle64_pdf_p8_p7_conclusion.png" width={980} x={50} y={260}
          visibleFor={80} rot={0.2} />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);