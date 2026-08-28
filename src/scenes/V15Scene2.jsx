import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, EditorialHero, INK, ORANGE, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V15SCENE2_DURATION = 253;

export const V15Scene2 = () => (
  <AbsoluteFill name="V15Scene2">
    <CameraGroup zoom={{ from: 1, to: 1.025 }} durationInFrames={V15SCENE2_DURATION}>
      <SceneBackground variant="card" />
      <EditorialHero
        name="Compelled-Call"
        src="anle64_victim_phone_under_duress.png"
        width={500}
        x={290}
        y={170}
        variant="punch"
        visibleFor={253}
      />
      <Sequence from={79} layout="none">
        <DiagramCanvas y={1130} height={270}>
          <rect x={45} y={28} width={310} height={150} rx={22} fill="#F5F0E4" stroke={INK} strokeWidth={5} />
          <rect x={685} y={28} width={350} height={150} rx={22} fill={INK} stroke={INK} strokeWidth={5} />
          <DrawnText delay={0} x={215} y={120} textAnchor="middle" style={{ fontSize: 50, fontWeight: 900, fill: INK }}>
            150 TRIỆU
          </DrawnText>
          <DrawnPath d="M 375 103 C 490 25, 585 25, 665 103" delay={0} stroke={ORANGE} strokeWidth={10} />
          <DrawnText delay={14} x={860} y={98} textAnchor="middle" style={{ fontSize: 46, fontWeight: 900, fill: ORANGE }}>
            THẢ NGƯỜI
          </DrawnText>
          <DrawnText delay={14} x={860} y={148} textAnchor="middle" style={{ fontSize: 44, fontWeight: 900, fill: "#F5F0E4" }}>
            CÓ ĐIỀU KIỆN
          </DrawnText>
        </DiagramCanvas>
      </Sequence>
      <Sequence from={175} layout="none">
        <PunchPhrase lines={["150 TRIỆU", "ĐỔI LẤY THẢ NGƯỜI"]} top={830} fontSize={72} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);