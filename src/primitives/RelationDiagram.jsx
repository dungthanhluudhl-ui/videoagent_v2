export const RelationDiagram = ({items = [], relations = [], diagramJustification, style}) => {
  if (!String(diagramJustification || "").trim()) {
    throw new Error("RelationDiagram is exception-only and requires diagramJustification");
  }
  return (
    <svg data-videoagent-diagram-exception="true" viewBox="0 0 100 100" style={{width: "100%", height: "100%", ...style}}>
      {relations.map((relation, index) => {
        const from = items.find((item) => item.id === relation.from);
        const to = items.find((item) => item.id === relation.to);
        return from && to ? <line key={relation.id ?? index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={relation.color ?? "#141414"} strokeWidth="0.8" vectorEffect="non-scaling-stroke" /> : null;
      })}
      {items.map((item) => (
        <g key={item.id}>
          <circle cx={item.x} cy={item.y} r={item.radius ?? 1.5} fill={item.color ?? "#FF6A1A"} />
          <text x={item.x} y={item.y + (item.labelOffset ?? 5)} textAnchor="middle" fontSize={item.fontSize ?? 4} fontWeight="700" fill={item.ink ?? "#141414"}>{item.label}</text>
        </g>
      ))}
    </svg>
  );
};