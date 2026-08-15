/**
 * S2 - Itaewon nằm ở đâu?
 *
 * một điểm trên bản đồ Seoul thật được khoanh lại thành nơi xảy ra thảm họa
 *
 * comprehensionLoad: complex - 134 frames (4.5s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V10SCENE2_DURATION = 134;

export const V10Scene2 = () => (
  <AbsoluteFill name="V10Scene2">
      <MapGraphic center={[126.9945, 37.5345]} zoom={13} style={LOCAL_RASTER_STYLE}
                  label="ITAEWON" sublabel="Seoul, Hàn Quốc"
                  delay={0} pinDelay={20} tint={0.14} />
      <Sequence from={65} layout="none">
        <PunchPhrase lines={["ITAEWON", "SEOUL"]} top={210} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
