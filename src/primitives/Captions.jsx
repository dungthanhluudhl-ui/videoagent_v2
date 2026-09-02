import {useCurrentFrame} from "remotion";

export const CAPTION_TOP = 1420;

export const Captions = ({lines = [], bottom = 440, fontFamily = "Arial, sans-serif"}) => {
  const frame = useCurrentFrame();
  const line = lines.find(
    (item) => item.length > 0 && frame >= item[0].startFrame && frame <= item[item.length - 1].endFrame + 10,
  );
  if (!line) return null;
  return (
    <div
      data-videoagent-caption="true"
      style={{position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", zIndex: 100, padding: "0 40px"}}
    >
      <div style={{backgroundColor: "rgba(20,20,20,0.85)", borderRadius: 14, padding: "12px 24px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.32em", maxWidth: "100%"}}>
        {line.map((word, index) => (
          <span key={`${word.startFrame}-${index}`} style={{fontFamily, fontWeight: 700, fontSize: 38, lineHeight: 1.25, color: frame >= word.startFrame && frame <= word.endFrame + 2 ? "#FF6A1A" : "#FFFFFF", opacity: frame > word.endFrame + 2 ? 0.6 : 1}}>
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};