import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {fontFamily} from "./shared";

export const V18SCENE2_DURATION = 190;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"};

export const V18Scene2 = () => {
  const frame = useCurrentFrame();
  const trap = interpolate(frame, [37, 118], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{background: "#11110f", color: "#f3ecdc", fontFamily, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, width: 26, height: "100%", background: "#ff7214"}} />
      <div style={{position: "absolute", left: 62, top: 74, fontSize: 22, fontWeight: 900,
        letterSpacing: 4, color: "#ff7214"}}>PHƯƠNG TIỆN KHỐNG CHẾ</div>
      <div style={{position: "absolute", left: 62, top: 124, fontSize: 82, lineHeight: .9,
        fontWeight: 950, letterSpacing: -4}}>KHÔNG THỂ<br/>BỎ TRỐN</div>
      <Img name="Restrained-Subject" src={staticFile("anle64_victim_restrained_seated.png")}
        style={{position: "absolute", left: 250 - trap * 72, bottom: -52, width: 760,
          filter: "grayscale(1) contrast(1.15) drop-shadow(28px 28px 24px rgba(0,0,0,.55))"}} />
      <Img name="Locked-Handcuffs" src={staticFile("anle64_handcuffs.png")}
        style={{position: "absolute", left: 18 + trap * 36, top: 570 + trap * 70, width: 410,
          rotate: `${-20 + trap * 10}deg`, filter: "grayscale(1) contrast(1.3) drop-shadow(18px 18px 18px rgba(0,0,0,.5))",
          zIndex: 6}} />
      <Sequence from={37} layout="none">
        <Img name="Restraint-Rope" src={staticFile("anle64_restraint_rope.png")}
          style={{position: "absolute", right: -100 + trap * 30, bottom: 88 + trap * 170,
            width: 560, rotate: `${18 - trap * 28}deg`, filter: "grayscale(1) sepia(.2) contrast(1.25) drop-shadow(18px 18px 18px rgba(0,0,0,.55))",
            opacity: trap, zIndex: 7}} />
      </Sequence>
      <div style={{position: "absolute", left: 58, right: 58, top: 1030, height: 560,
        border: `${3 + trap * 7}px solid #ff7214`, opacity: .2 + trap * .8, zIndex: 5}} />
      <div style={{position: "absolute", left: 58, bottom: 67, fontSize: 20,
        fontWeight: 850, letterSpacing: 3, color: "rgba(243,236,220,.66)"}}>TRÓI · KHÓA CÒNG · GIỮ LẠI</div>
    </AbsoluteFill>
  );
};