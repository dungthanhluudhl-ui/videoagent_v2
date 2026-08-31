import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from "remotion";
import {PunchPhrase, fontFamily} from "./shared";

export const V18SCENE5_DURATION = 150;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene5 = () => {
  const frame = useCurrentFrame();
  const question = interpolate(frame, [30, 98], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{background: "#eee7d7", color: "#15140f", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 52, top: 68, color: "#b94825",
        fontSize: 22, fontWeight: 900, letterSpacing: 4}}>ĐỔI VAI: NGƯỜI XEM PHÁN ĐOÁN</div>
      {["GIỮ NGƯỜI", "ÉP CHUYỂN TIỀN", "VẪN TIẾP DIỄN"].map((label, index) => (
        <div key={label} style={{position: "absolute", left: 58 + index * 28,
          top: 300 + index * 190 - question * (340 + index * 65), width: 840 - index * 56,
          height: 144, background: index === 1 ? "#ff7214" : "#171611",
          color: index === 1 ? "#171611" : "#f4eddd", padding: "27px 34px",
          boxSizing: "border-box", fontSize: 58, fontWeight: 950, letterSpacing: -2,
          opacity: 1 - question}}>{label}</div>
      ))}
      <div style={{position: "absolute", left: 58, top: 360, fontSize: 340,
        lineHeight: .8, fontWeight: 950, color: "#ff7214", opacity: question}}>?</div>
      <Sequence from={30} layout="none">
        <PunchPhrase lines={["VẬY TẠI SAO", "LẠI LÀ BẮT CÓC?"]} top={760}
          left={58} right={58} fontSize={100} />
      </Sequence>
      <div style={{position: "absolute", left: 58, right: 58, bottom: 78,
        borderTop: "3px solid rgba(21,20,15,.28)", paddingTop: 20, fontSize: 20,
        fontWeight: 850, letterSpacing: 3}}>MỘT KHOẢNG THỞ TRƯỚC LẬP LUẬN PHÁP LÝ</div>
    </AbsoluteFill>
  );
};