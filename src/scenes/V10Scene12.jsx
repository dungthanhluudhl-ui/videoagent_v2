/**
 * S12 - Chúng ta sẽ quay lại đâu?
 *
 * bản đồ kéo trở lại Itaewon, đánh dấu mốc ngày hôm đó
 *
 * comprehensionLoad: moderate - 97 frames (3.2s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V10SCENE12_DURATION = 97;

export const V10Scene12 = () => (
  <AbsoluteFill name="V10Scene12">
      <MapGraphic center={[126.9945, 37.5345]} zoom={15} style={LOCAL_RASTER_STYLE}
                  label="ITAEWON" sublabel="29.10.2022"
                  delay={0} pinDelay={16} tint={0.16} />
      <Sequence from={44} layout="none">
        <PunchPhrase lines={["QUAY LẠI", "NGÀY HÔM ĐÓ"]} top={240} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
