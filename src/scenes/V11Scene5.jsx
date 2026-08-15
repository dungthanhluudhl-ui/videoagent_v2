/**
 * S5 - Vì sao lại có nghĩa ly tán?
 *
 * chuỗi mũi tên đưa người lính từ chiến tranh sang đầu hàng rồi sang ly hương
 *
 * comprehensionLoad: complex - 149 frames (5.0s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Nền là kết cấu chiến tranh nên wash mặc định "ink" (tối) là đúng ở đây, và
 * punch phải bật onDark - ngược hẳn với S1, nơi nền là mặt giấy.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V11SCENE5_DURATION = 149;

const Step = ({ x, label, delay }) => (
  <g>
    <DrawnPath d={`M ${x} 40 L ${x + 250} 40 L ${x + 250} 170 L ${x} 170 Z`}
               delay={delay} drawFrames={12} length={760} stroke="#F2EFE7" strokeWidth={6} />
    <text x={x + 125} y={122} textAnchor="middle" fill="#F2EFE7"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 38, fontWeight: 900 }}>
      {label}
    </text>
  </g>
);

const Link = ({ x, delay }) => (
  <DrawnPath d={`M ${x} 105 L ${x + 60} 105 M ${x + 40} 90 L ${x + 60} 105 L ${x + 40} 120`}
             delay={delay} drawFrames={8} length={110} stroke="#C2410C" strokeWidth={7} />
);

export const V11Scene5 = () => (
  <AbsoluteFill name="V11Scene5">
    <BackgroundPhoto name="Bg-War" src="el10_war_texture.png" durationInFrames={149}
                     tint={0.56} focus="50% 45%" drift={0.07} />

    <DiagramCanvas y={300} height={300}>
      <Step x={40} label="CHIẾN TRANH" delay={33} />
      <Link x={296} delay={45} />
      <Step x={412} label="ĐẦU HÀNG" delay={49} />
      <Link x={668} delay={61} />
      <Step x={784} label="LY HƯƠNG" delay={65} />
    </DiagramCanvas>

    <Sequence from={80} layout="none">
      <PunchPhrase lines={["SỐNG LY HƯƠNG"]} top={182} fontSize={70} onDark />
      <Support name="Sup-Soldier" src="el11_surrendered_soldier.png" width={270} x={730} y={620}
               visibleFor={69} />
    </Sequence>

    {/* khối chú thích bên trái, giữ cho nửa dưới không rỗng một bên */}
    <DiagramCanvas y={640} height={610}>
      <DrawnPath d="M 90 40 L 90 470" delay={84} drawFrames={20} length={430}
                 stroke="#C2410C" strokeWidth={7} />
      <text x={130} y={110} fill="#F2EFE7"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 900 }}>
        BỎ VŨ KHÍ
      </text>
      <text x={130} y={186} fill="#F2EFE7"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 900 }}>
        KHÔNG VỀ NHÀ
      </text>
      <DrawnPath d="M 130 236 L 520 236" delay={104} drawFrames={12} length={390}
                 stroke="#F2EFE7" strokeWidth={4} opacity={0.6} />
      <text x={130} y={310} fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
        Ở LẠI ĐẤT NGƯỜI
      </text>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);
