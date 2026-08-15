/**
 * Render proof for the primitives added during the V10 rebuild.
 *
 * A component that compiles is not a component that draws. Four defects in
 * the first batch of visual-language primitives (an invisible headline, a
 * label off the canvas, clipped leader lines, a headline overlapping a
 * device) were all found by rendering a still and looking at it, and none of
 * them by any check. So every new primitive gets a composition here.
 *
 * The first version of this file found a fifth, in the container rather than
 * the drawings: passing a `height` to DiagramCanvas letterboxed the whole
 * diagram to 58% and floated it near the top, leaving the lower two thirds of
 * every frame blank. Coordinates below are in screen pixels within the
 * canvas, which is what they now are.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import {
  ChainBreak,
  DiagramCanvas,
  DimensionLine,
  DensityGrid,
  DrawnPath,
  ForceArrow,
  MemorialDots,
  StreetElevation,
} from "./visualLanguage";

export const VLDEMO2_DURATION = 130;

// The usable band is y 160..1460. A diagram placed at y=300 with height 900
// therefore runs to 1200, clear of the caption band.
const BAND_Y = 300;
const BAND_H = 900;

/* ---- ForceArrow: why pulling failed ------------------------------------ */
export const VLDemoForce = () => (
  <AbsoluteFill name="VLDemoForce">
    <SceneBackground variant="grid" />
    <DiagramCanvas y={BAND_Y} height={BAND_H}>
      {/* the locked crowd block the force meets */}
      <DensityGrid x={520} y={210} width={470} height={470} cols={7} rows={7}
                   fillCount={49} delay={0} fillFrames={24} />
      <ForceArrow x={60} y={445} length={420} delay={26} label="LỰC KÉO" thickness={20} />
      <text x={755} y={740} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 38, fontWeight: 800 }}>
        16 người / m²
      </text>
    </DiagramCanvas>
    <Sequence from={54} layout="none">
      <PunchPhrase lines={["KÉO KHÔNG RA"]} top={190} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- MemorialDots: 158 people ------------------------------------------ */
export const VLDemoDots = () => (
  <AbsoluteFill name="VLDemoDots">
    <SceneBackground variant="card" />
    <DiagramCanvas y={BAND_Y} height={BAND_H}>
      {/* perRow 20 across 960px -> 48px step, 8 rows -> 384px tall */}
      <MemorialDots x={60} y={230} width={960} count={158} perRow={20}
                    delay={4} fillFrames={64} />
    </DiagramCanvas>
    <Sequence from={70} layout="none">
      <PunchPhrase lines={["158 NGƯỜI", "THIỆT MẠNG"]} top={190} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- ChainBreak: it was preventable ------------------------------------ */
export const VLDemoChain = () => (
  <AbsoluteFill name="VLDemoChain">
    <SceneBackground variant="spotlight" />
    <DiagramCanvas y={BAND_Y} height={BAND_H}>
      <ChainBreak x={250} y={30} height={860} links={4} breakAt={2}
                  labels={["DỰ BÁO ĐÁM ĐÔNG", "GIỚI HẠN LỐI VÀO", "ĐIỀU PHỐI TẠI CHỖ", "CỨU HỘ KỊP THỜI"]}
                  delay={0} drawFrames={9} breakDelay={54} />
    </DiagramCanvas>
    <Sequence from={78} layout="none">
      <PunchPhrase lines={["TẠI SAO?"]} top={200} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);

/* ---- StreetElevation: density of shopfronts ---------------------------- */
export const VLDemoShops = () => (
  <AbsoluteFill name="VLDemoShops">
    <SceneBackground variant="grid" />
    <DiagramCanvas y={BAND_Y} height={BAND_H}>
      <StreetElevation
        x={50} y={230} width={980} height={480} delay={0} stagger={6}
        shops={[
          { label: "BAR", accent: true },
          { label: "" },
          { label: "THỜI TRANG", accent: true },
          { label: "" },
          { label: "NHÀ HÀNG", accent: true },
          { label: "" },
          { label: "BAR", accent: true },
        ]}
      />
      <DrawnPath d="M 50 742 L 1030 742" delay={44} drawFrames={18} length={1000}
                 strokeWidth={3} opacity={0.35} dashed />
      <DimensionLine x1={50} y1={790} x2={1030} y2={790} label="MỘT ĐOẠN PHỐ" delay={50} />
    </DiagramCanvas>
    <Sequence from={62} layout="none">
      <PunchPhrase lines={["DÀY ĐẶC"]} top={200} />
    </Sequence>
    <BottomBar />
  </AbsoluteFill>
);
