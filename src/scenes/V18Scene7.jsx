import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE7_DURATION = 235;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene7 = () => {
  const frame = useCurrentFrame();
  const replace = interpolate(frame, [155, 205], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill data-visual-treatment="diagram" style={{background: "#161511", color: "#f2ead9", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 58, top: 72, color: "#ff7214",
        fontSize: 22, fontWeight: 900, letterSpacing: 4}}>CẠNH TRANH PHÁP LÝ</div>
      <div style={{position: "absolute", left: 56, top: 180, fontSize: 74,
        lineHeight: .94, fontWeight: 950, letterSpacing: -3}}>CÁCH GỌI NÀO<br/>CÒN ĐỨNG VỮNG?</div>
      <div style={{position: "absolute", left: 54, top: 520, width: 446, height: 650,
        background: "#efe7d7", color: "#161511", padding: "42px 34px", boxSizing: "border-box",
        opacity: 1 - replace * .82, translate: `${-replace * 300}px 0`}}>
        <div style={{fontSize: 24, fontWeight: 900, letterSpacing: 3}}>CÁCH GỌI 01</div>
        <div style={{marginTop: 118, fontSize: 92, lineHeight: .88, fontWeight: 950}}>ĐÒI<br/>NỢ</div>
        <div style={{position: "absolute", left: 34, bottom: 38, right: 34,
          borderTop: "4px solid #161511", paddingTop: 16, fontSize: 22, fontWeight: 850}}>LẤY LẠI TIỀN</div>
      </div>
      <div style={{position: "absolute", right: 54, top: 520, width: 446, height: 650,
        background: "#b94825", color: "#f4eddd", padding: "42px 34px", boxSizing: "border-box",
        opacity: 1 - replace * .82, translate: `${replace * 300}px 0`}}>
        <div style={{fontSize: 24, fontWeight: 900, letterSpacing: 3}}>CÁCH GỌI 02</div>
        <div style={{marginTop: 118, fontSize: 82, lineHeight: .88, fontWeight: 950}}>GIỮ<br/>NGƯỜI</div>
        <div style={{position: "absolute", left: 34, bottom: 38, right: 34,
          borderTop: "4px solid #f4eddd", paddingTop: 16, fontSize: 22, fontWeight: 850}}>TRÁI PHÁP LUẬT</div>
      </div>
      <div style={{position: "absolute", left: -40 + (1 - replace) * 1120, top: 650,
        width: 1160, height: 650, background: "#ff7214", color: "#15140f",
        padding: "52px 86px", boxSizing: "border-box", zIndex: 5}}>
        <div style={{fontSize: 23, fontWeight: 900, letterSpacing: 4}}>TÁI PHÂN LOẠI</div>
        <div style={{marginTop: 54, fontSize: 128, lineHeight: .8, fontWeight: 950,
          letterSpacing: -8}}>BẮT CÓC</div>
        <div style={{marginTop: 42, fontSize: 62, lineHeight: .94, fontWeight: 950}}>NHẰM CHIẾM ĐOẠT<br/>TÀI SẢN</div>
        <div style={{position: "absolute", left: 86, right: 86, bottom: 54,
          borderTop: "5px solid #15140f", paddingTop: 18, fontSize: 20,
          fontWeight: 900, letterSpacing: 3}}>HAI NHÃN CŨ BỊ THAY THẾ</div>
      </div>
      <div style={{position: "absolute", left: 58, bottom: 66, fontSize: 20,
        fontWeight: 850, letterSpacing: 3, color: "rgba(242,234,217,.65)"}}>RANH GIỚI KHÔNG NẰM Ở TÊN GỌI BAN ĐẦU</div>
    </AbsoluteFill>
  );
};