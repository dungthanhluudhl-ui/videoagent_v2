import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, EditorialSupport, PunchPhrase, SceneBackground } from "./shared";
import { DocumentEvidence } from "./visualLanguage";

export const V15SCENE6_DURATION = 155;

export const V15Scene6 = () => (
  <AbsoluteFill name="V15Scene6">
    <CameraGroup zoom={{ from: 1, to: 1.025 }} durationInFrames={V15SCENE6_DURATION}>
      <SceneBackground variant="grid" />
      <DocumentEvidence
        name="Debt-Premise-Panel"
        src="anle64_pdf_p2_real_debt.png"
        x={40}
        y={400}
        width={700}
        height={500}
        visibleFor={155}
        sourceAspect={2118 / 831}
        regions={[{ from: 0, x: 0.08, y: 0.06, width: 0.84, height: 0.88, zoom: 1.08 }]}
        dim={0.18}
      />
      <Sequence from={98} layout="none">
        <EditorialSupport
          name="Handcuffs-Offense"
          src="anle64_handcuffs.png"
          width={420}
          x={610}
          y={610}
          visibleFor={57}
        />
      </Sequence>
      <Sequence from={22} layout="none">
        <PunchPhrase lines={["CHỈ LÀ ĐÒI NỢ?"]} top={210} fontSize={86} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);