/**
 * S15 - Điều kiện nào vừa thay đổi?
 *
 * màn hình điện thoại hiện tin dỡ bỏ phòng dịch, chiếc khẩu trang bị gạch đi
 *
 * comprehensionLoad: moderate - 112 frames (3.7s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * DeviceMockup không truyền `src`: khung máy vẽ bằng code, nội dung là chữ -
 * không đi tìm ảnh chụp một chiếc điện thoại chỉ để hiện một dòng tin.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DeviceMockup, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE15_DURATION = 112;

export const V11Scene15 = () => (
  <AbsoluteFill name="V11Scene15">
    <SceneBackground variant="card" />

    <DeviceMockup kind="phone" x="50%" y={286} width={380} delay={0}>
      <div style={{ padding: "34px 26px", color: "#F2EFE7", fontFamily: "Be Vietnam Pro" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#C2410C", letterSpacing: 2 }}>
          THÔNG BÁO
        </div>
        <div style={{ marginTop: 18, fontSize: 38, fontWeight: 900, lineHeight: 1.2 }}>
          DỠ BỎ HOÀN TOÀN BIỆN PHÁP PHÒNG DỊCH
        </div>
        <div style={{ marginTop: 26, height: 4, background: "#C2410C", width: "62%" }} />
        <div style={{ marginTop: 22, fontSize: 26, fontWeight: 700, opacity: 0.85 }}>
          Hàn Quốc · 2022
        </div>
      </div>
    </DeviceMockup>

    {/* quy định khẩu trang bị gạch đi */}
    <DiagramCanvas y={1058} height={200}>
      {/* Khung nới ra 290..790 x 30..106: ở 44px dòng chữ cao 44 và mép dưới
          khung cũ (y=96) cắt ngang chân chữ. */}
      <DrawnPath d="M 290 106 L 790 106 L 790 30 L 290 30 Z" delay={83} drawFrames={12}
                 length={1160} strokeWidth={6} />
      {/* `struck`: vạch cam BÊN DƯỚI là gạch bỏ đúng quy định này - đây là chủ
          ý, không phải nét vẽ đi lạc vào chữ. */}
      <DrawnText delay={83} x={540} y={84} textAnchor="middle" fill="#1A1A1A" struck
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        ĐEO KHẨU TRANG
      </DrawnText>
      <DrawnPath d="M 286 68 L 794 68" delay={92} drawFrames={9} length={510}
                 stroke="#C2410C" strokeWidth={11} />
    </DiagramCanvas>

    <Sequence from={67} layout="none">
      <PunchPhrase lines={["BỎ KHẨU TRANG"]} top={190} fontSize={68} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);
