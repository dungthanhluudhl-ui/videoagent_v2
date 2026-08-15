import { fontFamily, ORANGE } from "./shared";
import { CAPTION_LINES10 } from "../captionData10";
import { useCurrentFrame } from "remotion";

// Video-specific caption wiring only (same pattern as shared8.jsx/shared9.jsx)
// - all real primitives (Hero, Support, SceneBackground, etc.) are the
// canonical ones in ./shared, reused directly, not duplicated here.
export const Captions10 = () => {
  const frame = useCurrentFrame();
  const activeLineIndex = CAPTION_LINES10.findIndex((line) => {
    if (!line || line.length === 0) return false;
    const start = line[0].startFrame;
    const end = line[line.length - 1].endFrame + 10;
    return frame >= start && frame <= end;
  });

  if (activeLineIndex === -1) return null;
  const line = CAPTION_LINES10[activeLineIndex];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 440,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 100,
        padding: "0 40px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(20,20,20,0.85)",
          borderRadius: 14,
          padding: "12px 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.32em",
          maxWidth: "100%",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {line.map((w, i) => {
          const isActive = frame >= w.startFrame && frame <= w.endFrame + 2;
          const isPast = frame > w.endFrame + 2;
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: 38,
                lineHeight: 1.25,
                color: isActive ? ORANGE : "#FFFFFF",
                opacity: isPast ? 0.6 : 1,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
