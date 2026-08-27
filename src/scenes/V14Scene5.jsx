import { AbsoluteFill, Sequence } from "remotion";
import { CameraGroup, SceneBackground } from "./shared";
import { V14Document } from "./V14Document";

export const V14SCENE5_DURATION = 258;

export const V14Scene5 = () => (
  <AbsoluteFill name="V14Scene5">
    <SceneBackground variant="spotlight" />
    <CameraGroup zoom={{ from: 1, to: 1.08 }} durationInFrames={V14SCENE5_DURATION}>
      <Sequence from={23} layout="none">
        <V14Document name="Doc-Page1-Authority" src="anle64_pdf_p1_authority.png"
          width={980} x={50} y={190} visibleFor={157} rot={-0.7} />
      </Sequence>
      <Sequence from={139} layout="none">
        <V14Document name="Doc-Page1-TitleFocus" src="anle64_pdf_p1_title_focus.png"
          width={900} x={90} y={230} visibleFor={119} rot={0.4} />
      </Sequence>
    </CameraGroup>
  </AbsoluteFill>
);