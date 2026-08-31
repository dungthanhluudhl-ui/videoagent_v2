import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE1_DURATION = 158;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene1 = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 72], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const portalWidth = interpolate(reveal, [0, 1], [170, 1080]);
  const portalLeft = (1080 - portalWidth) / 2;
  return (
    <AbsoluteFill style={{background: "#ebe4d4", color: "#f5eedf", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 104px, rgba(20,20,18,.08) 105px 107px)"}} />
      <div style={{position: "absolute", left: portalLeft, top: 0, width: portalWidth, height: 1920,
        overflow: "hidden", boxShadow: "0 0 80px rgba(0,0,0,.45)"}}>
        <Img name="Scrap-Warehouse-Location" src={staticFile("anle64_warehouse_vertical.png")}
          style={{position: "absolute", left: -portalLeft, top: 0, width: 1080, height: 1920,
            objectFit: "cover", filter: "grayscale(1) contrast(1.18) brightness(.42)"}} />
        <AbsoluteFill style={{background: "linear-gradient(180deg,rgba(5,5,4,.06),rgba(5,5,4,.82))"}} />
      </div>
      <div style={{position: "absolute", left: 58, top: 72, color: reveal > .48 ? "#ff7214" : "#171611",
        fontSize: 22, fontWeight: 900, letterSpacing: 4}}>HỒ SƠ / TIẾP DIỄN</div>
      <div style={{position: "absolute", left: 58, right: 58, top: 150, fontSize: 104,
        lineHeight: .86, fontWeight: 950, letterSpacing: -6,
        color: reveal > .42 ? "#f5eedf" : "#171611"}}>CHƯA DỪNG<br/>Ở ĐÓ</div>
      <div style={{position: "absolute", left: 58, bottom: 150, width: 700,
        borderLeft: "12px solid #ff7214", paddingLeft: 28, fontSize: 48,
        lineHeight: 1.02, fontWeight: 900, opacity: reveal}}>KHO TẬP KẾT<br/>PHẾ LIỆU</div>
      <div style={{position: "absolute", right: 54, bottom: 66, color: reveal > .5 ? "rgba(245,238,223,.7)" : "rgba(23,22,17,.6)",
        fontSize: 19, fontWeight: 850, letterSpacing: 3}}>TÁI DỰNG KHÔNG GIAN</div>
    </AbsoluteFill>
  );
};