import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, INK, ORANGE, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DocumentEvidence, DrawnPath, DrawnText } from "./visualLanguage";

export const V15SCENE10_DURATION = 173;

export const V15Scene10 = () => (
  <AbsoluteFill name="V15Scene10">
    <CameraGroup
      zoom={{ from: 1, to: 1.035 }}
      shake={{ at: 119, len: 12, mag: 6 }}
      durationInFrames={V15SCENE10_DURATION}
    >
      <SceneBackground variant="card" />
      <DocumentEvidence
        name="Legal-Conclusion-Document"
        src="anle64_pdf_p8_p7_conclusion.png"
        x={40}
        y={220}
        width={1000}
        height={560}
        visibleFor={173}
        sourceAspect={2824 / 948}
        regions={[{ from: 0, x: 0.05, y: 0.06, width: 0.9, height: 0.88, zoom: 1.08 }]}
        dim={0.2}
      />
      <Sequence from={59} layout="none">
        <DiagramCanvas y={760} height={320}>
          <rect x={30} y={35} width={290} height={150} rx={20} fill="#F5F0E4" stroke={INK} strokeWidth={5} />
          <rect x={395} y={35} width={290} height={150} rx={20} fill="#F5F0E4" stroke={INK} strokeWidth={5} />
          <rect x={760} y={35} width={290} height={150} rx={20} fill={INK} stroke={INK} strokeWidth={5} />
          <DrawnText delay={0} x={175} y={126} textAnchor="middle" style={{ fontSize: 44, fontWeight: 900, fill: INK }}>
            GIA ĐÌNH
          </DrawnText>
          <DrawnPath d="M 330 110 L 380 110" delay={0} stroke={ORANGE} strokeWidth={10} />
          <DrawnText delay={8} x={540} y={126} textAnchor="middle" style={{ fontSize: 44, fontWeight: 900, fill: INK }}>
            GIAO TIỀN
          </DrawnText>
          <DrawnPath d="M 695 110 L 745 110" delay={8} stroke={ORANGE} strokeWidth={10} />
          <DrawnText delay={16} x={905} y={126} textAnchor="middle" style={{ fontSize: 44, fontWeight: 900, fill: ORANGE }}>
            THẢ NGƯỜI
          </DrawnText>
        </DiagramCanvas>
      </Sequence>
      <Sequence from={119} layout="none">
        <PunchPhrase lines={["KHÔNG CÒN LÀ", "TRANH CHẤP TIỀN BẠC"]} top={1070} fontSize={78} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);