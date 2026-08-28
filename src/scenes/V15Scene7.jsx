import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, INK, ORANGE, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V15SCENE7_DURATION = 80;

export const V15Scene7 = () => (
  <AbsoluteFill name="V15Scene7">
    <CameraGroup
      zoom={{ from: 1, to: 1.08 }}
      shake={{ at: 23, len: 12, mag: 7 }}
      durationInFrames={V15SCENE7_DURATION}
    >
      <SceneBackground variant="spotlight" />
      <DiagramCanvas y={190} height={1050}>
        <rect x={70} y={160} width={940} height={190} rx={28} fill="#F5F0E4" stroke={INK} strokeWidth={6} />
        <DrawnText delay={0} struck x={540} y={275} textAnchor="middle" style={{ fontSize: 58, fontWeight: 900, fill: INK }}>
          BẮT GIỮ TRÁI PHÁP LUẬT
        </DrawnText>
        <DrawnPath d="M 135 292 L 945 222" delay={8} stroke={ORANGE} strokeWidth={16} />
        <DrawnPath d="M 540 390 L 540 520" delay={15} stroke={ORANGE} strokeWidth={10} />
        <path d="M 510 495 L 540 535 L 570 495" fill="none" stroke={ORANGE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      </DiagramCanvas>
      <Sequence from={23} layout="none">
        <PunchPhrase lines={["BẮT CÓC", "NHẰM CHIẾM ĐOẠT TÀI SẢN?"]} top={720} fontSize={78} />
      </Sequence>
    </CameraGroup>
    <BottomBar />
  </AbsoluteFill>
);