import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE10_DURATION = 173;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene10 = () => {
  const frame = useCurrentFrame();
  const verdict = interpolate(frame, [94, 145], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{background: "#11110f", color: "#f4eddd", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 58, top: 66, color: "#ff7214",
        fontSize: 22, fontWeight: 900, letterSpacing: 4}}>ĐIỀU KIỆN QUYẾT ĐỊNH</div>
      <div style={{position: "absolute", left: 54, top: 155, width: 972, height: 480,
        background: "#f6f2e9", overflow: "hidden", opacity: 1 - verdict * .72}}>
        <Img name="Official-Release-Condition" src={staticFile("anle64_pdf_p8_p7_release_condition.png")}
          style={{position: "absolute", left: -430, top: 20, width: 1840, maxWidth: "none"}} />
        <div style={{position: "absolute", inset: 18, border: "8px solid #ff7214"}} />
      </div>
      <div style={{position: "absolute", left: 54, top: 700, width: 972, height: 250,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: "5px solid #ff7214", borderBottom: "5px solid #ff7214",
        opacity: 1 - verdict * .75}}>
        <div style={{fontSize: 61, fontWeight: 950}}>GIAO TIỀN</div>
        <div style={{fontSize: 92, color: "#ff7214", fontWeight: 950}}>→</div>
        <div style={{fontSize: 61, fontWeight: 950}}>THẢ NGƯỜI</div>
      </div>
      <Sequence from={94} layout="none">
        <div style={{position: "absolute", left: 54, top: 310 + (1 - verdict) * 980,
          width: 972, height: 750, background: "#eee7d7", overflow: "hidden",
          boxShadow: "-24px 28px 0 rgba(255,114,20,.35)", zIndex: 5}}>
          <Img name="Official-Legal-Conclusion" src={staticFile("anle64_pdf_p8_p7_conclusion.png")}
            style={{position: "absolute", left: -520, top: 18, width: 2010, maxWidth: "none"}} />
          <div style={{position: "absolute", left: 28, right: 28, top: 400, height: 168,
            border: "8px solid #ff7214"}} />
        </div>
      </Sequence>
      <div style={{position: "absolute", left: 52, right: 52, top: 1110,
        fontSize: 82, lineHeight: .88, fontWeight: 950, letterSpacing: -5,
        opacity: verdict}}>KHÔNG CÒN LÀ<br/><span style={{color: "#ff7214"}}>TRANH CHẤP<br/>TIỀN BẠC</span></div>
      <div style={{position: "absolute", left: 45, top: 1310, width: 850, height: 14,
        background: "#b94825", rotate: "-8deg", opacity: verdict}} />
      <div style={{position: "absolute", left: 58, bottom: 67, fontSize: 20,
        fontWeight: 850, letterSpacing: 3, color: "rgba(244,237,221,.66)"}}>NGUỒN: ÁN LỆ SỐ 64/2023/AL</div>
    </AbsoluteFill>
  );
};