import {AbsoluteFill, Img, staticFile} from "remotion";

const point = (value) => `${Number(value) * 100}%`;

export const MapGraphic = ({src, alt = "Geographic map", route = [], annotations = [], style}) => {
  if (!src) throw new Error("MapGraphic requires real map material or a cached map plate");
  return (
    <AbsoluteFill data-videoagent-map="true" style={{overflow: "hidden", ...style}}>
      <Img src={/^(?:https?:|data:|blob:)/i.test(String(src)) ? src : staticFile(src)} alt={alt} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      {route.length > 1 ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
          <polyline points={route.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} fill="none" stroke="#FF6A1A" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      {annotations.map((item) => (
        <div key={item.id ?? item.label} style={{position: "absolute", left: point(item.x), top: point(item.y), translate: "-50% -50%", color: item.color ?? "#fff", fontSize: item.fontSize ?? 40, fontWeight: 800, textShadow: "0 2px 8px #000"}}>
          {item.label}
        </div>
      ))}
    </AbsoluteFill>
  );
};