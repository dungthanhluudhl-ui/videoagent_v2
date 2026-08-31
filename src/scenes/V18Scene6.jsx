import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE6_DURATION = 128;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene6 = () => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [45, 92], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{background: "#f0e8d8", color: "#16140f", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", left: -38, top: 48, fontSize: 430, lineHeight: .82,
        fontWeight: 950, letterSpacing: -35, color: "#ff7214"}}>150</div>
      <div style={{position: "absolute", right: 54, top: 92, width: 330, textAlign: "right",
        fontSize: 32, lineHeight: 1, fontWeight: 950}}>TRIỆU ĐỒNG<br/><span style={{fontSize: 19, letterSpacing: 3}}>DỮ KIỆN CÓ LỢI</span></div>
      <div style={{position: "absolute", left: 56, top: 650, width: 970, height: 720,
        background: "#f8f5ed", overflow: "hidden", boxShadow: "0 30px 70px rgba(42,34,22,.25)"}}>
        <Img name="Official-Real-Debt-Record" src={staticFile("anle64_pdf_p2_real_debt.png")}
          style={{position: "absolute", left: -300, top: 42, width: 1670, maxWidth: "none"}} />
        <div style={{position: "absolute", left: 28, right: 28, top: 385, height: 152,
          borderTop: "6px solid #ff7214", borderBottom: "6px solid #ff7214",
          background: "rgba(255,114,20,.18)", opacity: stamp}} />
      </div>
      <div style={{position: "absolute", left: 150, top: 1300 - stamp * 185, width: 780,
        padding: "22px 24px 16px", border: "12px solid #b94825", color: "#b94825",
        background: "rgba(240,232,216,.94)", textAlign: "center", fontSize: 104,
        lineHeight: .9, fontWeight: 950, letterSpacing: -4, rotate: "-4deg", opacity: stamp}}>NỢ THẬT</div>
      <div style={{position: "absolute", left: 58, bottom: 72, fontSize: 20,
        fontWeight: 850, letterSpacing: 3}}>HỒ SƠ XÁC NHẬN KHOẢN VAY</div>
    </AbsoluteFill>
  );
};