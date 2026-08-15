/**
 * S18 - Dày đặc là dày cỡ nào?
 *
 * Dãy mặt tiền cửa hàng được vẽ liên tiếp, mỗi loại một nhãn
 *
 * comprehensionLoad: complex - 136 frames (4.53s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: dãy mặt tiền cao 470px chỉ chiếm dải giữa, trên dưới trống
 * (review10.json S18/composed = fail). Mặt tiền nay cao 700px chạy kín bề
 * ngang, đường đo và dòng liệt kê ba loại hình lấp nốt dải đáy.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DimensionLine, StreetElevation } from "./visualLanguage";

export const V10SCENE18_DURATION = 136;

export const V10Scene18 = () => (
  <AbsoluteFill name="V10Scene18">
      <SceneBackground variant="grid" />
      <DiagramCanvas y={300} height={980}>
        <StreetElevation
          x={40} y={60} width={1000} height={700} delay={0} stagger={7}
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
        <DimensionLine x1={40} y1={830} x2={1040} y2={830} label="MỘT ĐOẠN PHỐ"
                       delay={62} fontSize={38} />
        <text x={540} y={945} textAnchor="middle" fill="#1A1A1A"
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
          QUÁN BAR · THỜI TRANG · NHÀ HÀNG QUỐC TẾ
        </text>
      </DiagramCanvas>
      <Sequence from={55} layout="none">
        <PunchPhrase lines={["DÀY ĐẶC"]} top={180} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
