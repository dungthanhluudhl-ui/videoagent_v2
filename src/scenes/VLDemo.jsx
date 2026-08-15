/**
 * Render-proof for every visual-language primitive.
 *
 * Not decoration: a primitive that compiles but renders as an empty box is
 * exactly the kind of failure that shipped in V10 (a DocumentStamp and a
 * FlowArrow both silently never appeared because of a double-delay bug, and
 * only a rendered still caught it). Each demo below is registered as its own
 * composition so a still can be pulled and actually looked at.
 *
 * Content here uses the Itaewon material because it is the case that exposed
 * the gap - an alley that narrowed to 3.2m on a slope, and a crowd density of
 * 16 people/m2, are precisely the claims no photograph can show.
 */

import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  PunchPhrase,
  SceneBackground,
  Sequence,
} from "./shared";
import {
  AnnotatedPhoto,
  BackgroundPhoto,
  DensityGrid,
  DeviceMockup,
  DiagramCanvas,
  DimensionLine,
  DrawnPath,
  SlopeIndicator,
  Timeline,
} from "./visualLanguage";
import { MapGraphic, LOCAL_RASTER_STYLE } from "./MapGraphic";

export const VLDEMO_DURATION = 150;

/* ---- 1. BackgroundPhoto: a headline over a real place ------------------ */
export const VLDemoBackground = () => (
  <AbsoluteFill name="VLDemoBackground">
    <BackgroundPhoto src="el10_crowd_behind.png" durationInFrames={VLDEMO_DURATION} />
    <Sequence from={20} layout="none">
      <PunchPhrase lines={["ĐÊM 29.10.2022"]} top={520} onDark />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 2. DiagramCanvas: reconstruct the alley --------------------------- */
export const VLDemoDiagram = () => (
  <AbsoluteFill name="VLDemoDiagram">
    <CameraGroup zoom={{ from: 1, to: 1.03 }} durationInFrames={VLDEMO_DURATION}>
      <SceneBackground variant="grid" />
      <DiagramCanvas y={200} height={1100}>
        {/* Two building walls converging into a bottleneck. */}
        <DrawnPath d="M 150 60 L 150 620 L 330 900 L 330 1040" delay={0} strokeWidth={7} />
        <DrawnPath d="M 930 60 L 930 620 L 750 900 L 750 1040" delay={6} strokeWidth={7} />
        <DimensionLine x1={150} y1={140} x2={930} y2={140} label="5m" delay={26} />
        <DimensionLine x1={330} y1={980} x2={750} y2={980} label="3,2m" delay={44} />
        <SlopeIndicator x1={540} y1={300} x2={540} y2={820} label="DỐC B → N" delay={62} />
      </DiagramCanvas>
    </CameraGroup>
    <Sequence from={80} layout="none">
      <PunchPhrase lines={["NÚT THẮT CỔ CHAI"]} top={1420} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 3. DensityGrid: 16 people per square metre ------------------------ */
export const VLDemoDensity = () => (
  <AbsoluteFill name="VLDemoDensity">
    <CameraGroup zoom={{ from: 1, to: 1.04 }} durationInFrames={VLDEMO_DURATION}>
      <SceneBackground variant="chart" />
      <DiagramCanvas y={320} height={900}>
        <DensityGrid x={140} y={60} width={800} height={620}
                     cols={8} rows={6} fillCount={46} delay={12} fillFrames={50} />
        <DimensionLine x1={140} y1={740} x2={940} y2={740} label="1 m²" delay={70} />
      </DiagramCanvas>
    </CameraGroup>
    <Sequence from={16} layout="none">
      <PunchPhrase lines={["16 NGƯỜI / M²"]} top={200} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 4. Timeline: the name's history ----------------------------------- */
export const VLDemoTimeline = () => (
  <AbsoluteFill name="VLDemoTimeline">
    <CameraGroup zoom={{ from: 1.02, to: 1 }} durationInFrames={VLDEMO_DURATION}>
      <SceneBackground variant="card" />
      <Timeline
        y={860}
        events={[
          { label: "TK 16", sub: "Nhật chiếm đóng", delay: 10 },
          { label: "TK 20", sub: "Căn cứ Yongsan", delay: 45 },
          { label: "NAY", sub: "Lê Thái Viện", delay: 80 },
        ]}
      />
    </CameraGroup>
    <Sequence from={0} layout="none">
      <PunchPhrase lines={["MỘT CÁI TÊN, BA THỜI ĐẠI"]} top={420} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 5. AnnotatedPhoto: point at the detail ---------------------------- */
export const VLDemoAnnotated = () => (
  <AbsoluteFill name="VLDemoAnnotated">
    <CameraGroup zoom={{ from: 1, to: 1.03 }} durationInFrames={VLDEMO_DURATION}>
      <SceneBackground variant="spotlight" />
      <AnnotatedPhoto
        src="el10_crowd_behind.png"
        x={60} y={420} width={960} height={780}
        delay={6}
        annotations={[
          { atX: "34%", atY: "30%", label: "Hai luồng người", side: "left", delay: 30 },
          { atX: "72%", atY: "68%", label: "Điểm nghẽn", side: "right", delay: 60 },
        ]}
      />
    </CameraGroup>
    <Sequence from={0} layout="none">
      <PunchPhrase lines={["HAI DÒNG NGƯỜI ĐỐI ĐẦU"]} top={220} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 6. DeviceMockup: a screen, framed --------------------------------- */
export const VLDemoMockup = () => (
  <AbsoluteFill name="VLDemoMockup">
    <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={VLDEMO_DURATION}>
      <SceneBackground variant="card" />
      <DeviceMockup src="el10_kdrama_screen.png" kind="phone"
                    x="50%" y={430} width={430} delay={10} />
    </CameraGroup>
    <Sequence from={40} layout="none">
      <PunchPhrase lines={["TẦNG LỚP ITAEWON"]} top={1330} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- 7. MapGraphic: a real map, not a floating dot --------------------- */
// Itaewon, Yongsan District, Seoul. Coordinates are [lng, lat] (MapLibre
// order). areaKm2 draws the 1,37 km² footprint the narration actually names.
export const VLDemoMap = () => (
  <AbsoluteFill name="VLDemoMap">
    <MapGraphic
      center={[126.9945, 37.5345]}
      zoom={14}
      style={LOCAL_RASTER_STYLE}
      label="ITAEWON, SEOUL"
      sublabel="Quận Yongsan · 1,37 km²"
      areaKm2={1.37}
      delay={0}
      pinDelay={14}
    />
    <Sequence from={45} layout="none">
      <PunchPhrase lines={["1,37 KM²"]} top={230} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);
