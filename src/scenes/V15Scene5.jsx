import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, DocumentStamp, PunchPhrase, SceneBackground } from "./shared";
import { DocumentEvidence } from "./visualLanguage";

export const V15SCENE5_DURATION = 128;

export const V15Scene5 = () => (
  <AbsoluteFill name="V15Scene5">
    <CameraGroup zoom={{ from: 1, to: 1.035 }} durationInFrames={V15SCENE5_DURATION}>
      <SceneBackground variant="card" />
      <DocumentEvidence
        name="Real-Debt-Document"
        src="anle64_pdf_p2_real_debt.png"
        x={40}
        y={400}
        width={1000}
        height={600}
        visibleFor={128}
        sourceAspect={2118 / 831}
        regions={[{ from: 0, x: 0.1, y: 0.08, width: 0.8, height: 0.84, zoom: 1.12 }]}
        dim={0.18}
      />
      <Sequence from={19} layout="none">
        <PunchPhrase lines={["NỢ THẬT"]} top={220} fontSize={104} />
        <DocumentStamp text="CÓ THẬT" x={610} y={1010} rot={-7} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);