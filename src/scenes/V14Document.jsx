import { Img, Interactive, interpolate, staticFile, useCurrentFrame } from "remotion";

export const V14Document = ({ name, src, width, x, y, visibleFor, rot = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, visibleFor - 10, visibleFor], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 22], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    output: "perceptual-scale",
  });

  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        opacity,
        scale,
        rotate: `${rot}deg`,
        background: "#F7F3E9",
        border: "2px solid rgba(20,20,20,0.18)",
        borderRadius: 8,
        boxShadow: "0 18px 46px rgba(0,0,0,0.28)",
        overflow: "hidden",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </Interactive.Div>
  );
};