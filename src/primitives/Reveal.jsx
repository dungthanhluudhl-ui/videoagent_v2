import {Easing, interpolate, useCurrentFrame} from "remotion";

export const Reveal = ({
  children,
  enabled = false,
  from = 0,
  duration = 12,
  distance = 0,
  axis = "y",
  beatId,
  manualReason,
  meaningBearing = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = enabled
    ? interpolate(frame, [from, from + Math.max(1, duration)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;
  return (
    <div
      data-videoagent-beat-id={beatId}
      data-videoagent-manual-reason={manualReason}
      data-videoagent-meaning-bearing={meaningBearing ? "true" : "false"}
      style={{
        opacity: progress,
        translate: axis === "x" ? `${(1 - progress) * distance}px 0px` : `0px ${(1 - progress) * distance}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};