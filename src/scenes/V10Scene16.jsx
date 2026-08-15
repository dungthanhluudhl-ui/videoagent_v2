/**
 * S16 - Vậy Itaewon rộng bao nhiêu và ở đâu?
 *
 * vòng tròn 1,37 km2 được vẽ đúng tỉ lệ lên bản đồ quận Yongsan
 *
 * comprehensionLoad: complex - 138 frames (4.6s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V10SCENE16_DURATION = 138;

export const V10Scene16 = () => (
  <AbsoluteFill name="V10Scene16">
      <MapGraphic center={[126.9945, 37.5345]} zoom={14} style={LOCAL_RASTER_STYLE}
                  label="ITAEWON" sublabel="Quận Yongsan · 1,37 km²" areaKm2={1.37}
                  delay={0} pinDelay={14} tint={0.15} />
      <Sequence from={35} layout="none">
        <PunchPhrase lines={["1,37 KM²"]} top={1240} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
