const valuesOf = (data) => data.map((item) => Number(typeof item === "number" ? item : item.value));

export const DataChart = ({data, type = "bar", color = "#FF6A1A", ink = "#141414", revealProgress = 1, style}) => {
  if (!Array.isArray(data) || data.length === 0 || valuesOf(data).some((value) => !Number.isFinite(value))) {
    throw new Error("DataChart requires real finite numeric data");
  }
  const values = valuesOf(data);
  const max = Math.max(...values.map(Math.abs), 1);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${92 - (value / max) * 84}`).join(" ");
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  let cursor = 0;
  const pie = values.map((value, index) => {
    const start = cursor;
    cursor += Math.max(0, value) / total * 360 * Math.max(0, Math.min(1, revealProgress));
    const shade = index % 2 === 0 ? color : ink;
    return `${shade} ${start}deg ${cursor}deg`;
  }).join(", ");
  return (
    <div data-videoagent-chart="true" data-videoagent-content-block="true" style={{width: "100%", height: "100%", ...style}}>
      {type === "pie" ? (
        <div style={{width: "100%", height: "100%", borderRadius: "50%", background: `conic-gradient(${pie}, transparent ${cursor}deg)`}} />
      ) : type === "bar" ? (
        <div style={{height: "100%", display: "flex", alignItems: "end", gap: 18}}>
          {values.map((value, index) => (
            <div key={data[index]?.id ?? index} style={{height: `${Math.max(0, Math.abs(value / max) * revealProgress) * 100}%`, flex: 1, backgroundColor: color}} />
          ))}
        </div>
      ) : (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width: "100%", height: "100%"}}>
          <polyline points={points} fill="none" stroke={ink} strokeWidth="1.2" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - Math.max(0, Math.min(1, revealProgress))} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
};