import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground } from "./shared";
import { DocumentEvidence, Timeline } from "./visualLanguage";

export const V15SCENE3_DURATION = 234;

export const V15Scene3 = () => (
  <AbsoluteFill name="V15Scene3">
    <CameraGroup zoom={{ from: 1, to: 1.018 }} durationInFrames={V15SCENE3_DURATION}>
      <SceneBackground variant="spotlight" />
      <DocumentEvidence
        name="Noon-Demand-Document"
        src="anle64_pdf_p3_noon_demand.png"
        x={80}
        y={290}
        width={920}
        height={450}
        visibleFor={234}
        sourceAspect={2118 / 966}
        regions={[{ from: 0, x: 0.08, y: 0.05, width: 0.84, height: 0.9, zoom: 1.08 }]}
        dim={0.22}
      />
      <Sequence from={70} layout="none">
        <Timeline
          y={930}
          inset={220}
          events={[
            { label: "TRƯA HÔM SAU", sub: "gọi về nhà", delay: 0 },
            { label: "TÀI KHOẢN ANH T", sub: "chuyển đủ", delay: 70 },
          ]}
        />
      </Sequence>
      <Sequence from={140} layout="none">
        <PunchPhrase lines={["CHUYỂN ĐỦ 150 TRIỆU"]} top={190} fontSize={76} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);