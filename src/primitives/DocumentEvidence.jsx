import {AbsoluteFill, Img, staticFile} from "remotion";

const source = (src) => (/^(?:https?:|data:|blob:)/i.test(String(src)) ? src : staticFile(src));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

// The region is the exact claim box. The primitive—not PLAN—owns a small safe
// visual margin, clamped to the authentic raster so focus never leaves source.
export const safeFocusRegion = (region, margin = 0.035) => {
  if (!Array.isArray(region) || region.length !== 4) return null;
  const [x, y, width, height] = region.map(Number);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > 1 || y + height > 1) {
    throw new Error("DocumentEvidence focus region must be normalized [x,y,width,height] inside the authentic raster");
  }
  const left = clamp(x - margin, 0, 1);
  const top = clamp(y - margin, 0, 1);
  const right = clamp(x + width + margin, 0, 1);
  const bottom = clamp(y + height + margin, 0, 1);
  return [left, top, right - left, bottom - top];
};

export const DocumentEvidence = ({
  src,
  materialId,
  alt = "Authentic source document",
  crop,
  focus,
  sourceAspect = 1 / 1.414,
  dim = 0.56,
  style,
}) => {
  if (!src) throw new Error("DocumentEvidence requires an authentic raster/document src");
  if (!materialId) throw new Error("DocumentEvidence requires approved document materialId");
  const claim = focus?.region ?? null;
  const safe = safeFocusRegion(claim, focus?.safeMargin ?? 0.035);
  return (
    <AbsoluteFill
      data-videoagent-document-evidence="true"
      data-videoagent-material-id={materialId}
      data-videoagent-source-context="preserved"
      style={{overflow: "hidden", ...style}}
    >
      <Img
        src={source(src)}
        alt={alt}
        style={{width: "100%", height: "100%", objectFit: crop?.fit ?? "contain", objectPosition: crop?.position ?? "50% 50%"}}
      />
      {safe ? (
        <>
          <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dim})`}} />
          <div
            data-videoagent-content-block="true"
            data-videoagent-evidence-focus="true"
            style={{
              position: "absolute",
              left: `${safe[0] * 100}%`,
              top: `${safe[1] * 100}%`,
              width: `${safe[2] * 100}%`,
              height: `${safe[3] * 100}%`,
              border: `${focus?.borderWidth ?? 5}px solid ${focus?.color ?? "#FF6A1A"}`,
              boxShadow: `0 0 0 9999px rgba(0,0,0,${Math.max(0, dim - 0.2)})`,
            }}
          />
          <div
            data-videoagent-claim-region="true"
            style={{position: "absolute", left: `${claim[0] * 100}%`, top: `${claim[1] * 100}%`, width: `${claim[2] * 100}%`, height: `${claim[3] * 100}%`}}
          />
          <div
            data-videoagent-content-block="true"
            data-videoagent-readable-evidence-focus="true"
            style={{
              position: "absolute",
              left: focus?.panelLeft ?? "8%",
              top: focus?.panelTop ?? "38%",
              width: focus?.panelWidth ?? "84%",
              maxHeight: focus?.panelMaxHeight ?? "48%",
              aspectRatio: String((sourceAspect * safe[2]) / safe[3]),
              overflow: "hidden",
              backgroundColor: "white",
              border: `${focus?.borderWidth ?? 5}px solid ${focus?.color ?? "#FF6A1A"}`,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <Img
              src={source(src)}
              alt={`${alt} — focused authentic region`}
              style={{
                position: "absolute",
                width: `${100 / safe[2]}%`,
                height: `${100 / safe[3]}%`,
                left: `${(-safe[0] / safe[2]) * 100}%`,
                top: `${(-safe[1] / safe[3]) * 100}%`,
              }}
            />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};