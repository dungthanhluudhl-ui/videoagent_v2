import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Video} from "@remotion/media";

const asSource = (src) =>
  typeof src === "string" && !/^(?:https?:|data:|blob:)/i.test(src) ? staticFile(src) : src;

const isVideo = (src) => /\.(?:mp4|mov|m4v|webm)(?:[?#].*)?$/i.test(String(src || ""));

export const MediaPlate = ({
  src,
  alt = "",
  fit = "cover",
  position = "50% 50%",
  crop,
  mask,
  scrim = 0,
  vignette = 0,
  motion = null,
  label,
  muted = true,
  style,
}) => {
  if (!src) throw new Error("MediaPlate requires a real image/video src");
  const frame = useCurrentFrame();
  const from = Number(motion?.from ?? 0);
  const to = Math.max(from + 1, Number(motion?.to ?? from + 1));
  const progress = motion
    ? interpolate(frame, [from, to], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const scale = motion ? (motion.scaleFrom ?? 1) + ((motion.scaleTo ?? 1.04) - (motion.scaleFrom ?? 1)) * progress : 1;
  const x = motion ? (motion.xFrom ?? 0) + ((motion.xTo ?? 0) - (motion.xFrom ?? 0)) * progress : 0;
  const y = motion ? (motion.yFrom ?? 0) + ((motion.yTo ?? 0) - (motion.yFrom ?? 0)) * progress : 0;
  const common = {
    position: "absolute",
    inset: crop?.inset ?? 0,
    width: crop?.width ?? "100%",
    height: crop?.height ?? "100%",
    objectFit: fit,
    objectPosition: crop?.position ?? position,
    clipPath: mask,
    scale,
    translate: `${x}px ${y}px`,
    ...style,
  };
  return (
    <AbsoluteFill data-videoagent-media="true" style={{overflow: "hidden"}}>
      {isVideo(src) ? <Video src={asSource(src)} muted={muted} style={common} /> : <Img src={asSource(src)} alt={alt} style={common} />}
      {scrim > 0 ? <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${scrim})`}} /> : null}
      {vignette > 0 ? (
        <AbsoluteFill
          style={{background: `radial-gradient(circle at center, transparent 35%, rgba(0,0,0,${vignette}) 100%)`}}
        />
      ) : null}
      {label ? <div style={{position: "absolute", left: 36, bottom: 36, padding: "8px 14px", backgroundColor: "rgba(0,0,0,0.72)", color: "white", fontSize: 30, fontWeight: 800}}>{label}</div> : null}
    </AbsoluteFill>
  );
};

export const Crossfade = ({children, from = 0, duration = 12, enabled = false}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity: enabled
          ? interpolate(frame, [from, from + Math.max(1, duration)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : 1,
      }}
    >
      {children}
    </div>
  );
};