import {AbsoluteFill, Img, staticFile, useVideoConfig} from "remotion";

const source = (src) => (/^(?:https?:|data:|blob:)/i.test(String(src)) ? src : staticFile(src));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export const MIN_CLAIM_FOCUS_WIDTH_RATIO = 0.7;

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

export const containRect = ({canvasWidth, canvasHeight, sourceAspect}) => {
  const width = Number(canvasWidth);
  const height = Number(canvasHeight);
  const aspect = Number(sourceAspect);
  if (![width, height, aspect].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("DocumentEvidence contain geometry requires positive canvas dimensions and sourceAspect");
  }
  const canvasAspect = width / height;
  const displayWidth = aspect >= canvasAspect ? width : height * aspect;
  const displayHeight = aspect >= canvasAspect ? width / aspect : height;
  return {
    left: (width - displayWidth) / 2,
    top: (height - displayHeight) / 2,
    width: displayWidth,
    height: displayHeight,
  };
};

export const mapRegionToContainedRaster = ({region, canvasWidth, canvasHeight, sourceAspect}) => {
  const normalized = safeFocusRegion(region, 0);
  if (!normalized) return null;
  const contained = containRect({canvasWidth, canvasHeight, sourceAspect});
  return {
    left: contained.left + normalized[0] * contained.width,
    top: contained.top + normalized[1] * contained.height,
    width: normalized[2] * contained.width,
    height: normalized[3] * contained.height,
    contained,
  };
};

const percentNumber = (value, fallback) => {
  const parsed = Number.parseFloat(String(value ?? fallback));
  if (!Number.isFinite(parsed)) throw new Error("DocumentEvidence focus panel width must be a percentage");
  return parsed;
};

export const DocumentEvidence = ({
  src,
  materialId,
  documentEvidenceMode,
  alt = "Authentic source document",
  crop,
  focus,
  sourceAspect,
  dim = 0.56,
  style,
}) => {
  const {width: canvasWidth, height: canvasHeight} = useVideoConfig();
  if (!src) throw new Error("DocumentEvidence requires an authentic raster/document src");
  if (!materialId) throw new Error("DocumentEvidence requires approved document materialId");
  if (!["claim", "context"].includes(documentEvidenceMode)) throw new Error("DocumentEvidence requires documentEvidenceMode claim or context");
  if (documentEvidenceMode === "claim" && (!Number.isFinite(Number(sourceAspect)) || Number(sourceAspect) <= 0)) {
    throw new Error("Claim DocumentEvidence requires truthful positive sourceAspect");
  }
  const claim = focus?.region ?? null;
  if (documentEvidenceMode === "claim" && !claim) throw new Error("Claim DocumentEvidence requires focus.region");
  if (documentEvidenceMode === "context" && claim) throw new Error("Context DocumentEvidence cannot present itself as exact claim focus");
  const safe = safeFocusRegion(claim, focus?.safeMargin ?? 0.035);
  const mappedClaim = claim ? mapRegionToContainedRaster({region: claim, canvasWidth, canvasHeight, sourceAspect}) : null;
  const mappedSafe = safe ? mapRegionToContainedRaster({region: safe, canvasWidth, canvasHeight, sourceAspect}) : null;
  const contained = mappedSafe?.contained;
  const panelWidth = percentNumber(focus?.panelWidth, 84);
  if (documentEvidenceMode === "claim" && panelWidth < MIN_CLAIM_FOCUS_WIDTH_RATIO * 100) {
    throw new Error("Claim DocumentEvidence focus panel must occupy at least 70% of composition width");
  }
  return (
    <AbsoluteFill
      data-videoagent-document-evidence="true"
      data-videoagent-document-mode={documentEvidenceMode}
      data-videoagent-material-id={materialId}
      data-videoagent-source-context="preserved"
      style={{overflow: "hidden", ...style}}
    >
      <Img
        src={source(src)}
        alt={alt}
        style={{width: "100%", height: "100%", objectFit: documentEvidenceMode === "claim" ? "contain" : (crop?.fit ?? "contain"), objectPosition: "50% 50%"}}
      />
      {mappedSafe ? (
        <>
          <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dim})`}} />
          <div
            data-videoagent-contained-source="true"
            style={{position: "absolute", left: contained.left, top: contained.top, width: contained.width, height: contained.height, pointerEvents: "none"}}
          />
          <div
            data-videoagent-evidence-context-highlight="true"
            style={{
              position: "absolute",
              left: mappedSafe.left,
              top: mappedSafe.top,
              width: mappedSafe.width,
              height: mappedSafe.height,
              boxSizing: "border-box",
              border: `${focus?.borderWidth ?? 5}px solid ${focus?.color ?? "#FF6A1A"}`,
              boxShadow: `0 0 0 9999px rgba(0,0,0,${Math.max(0, dim - 0.2)})`,
            }}
          />
          <div
            data-videoagent-claim-region="true"
            style={{position: "absolute", left: mappedClaim.left, top: mappedClaim.top, width: mappedClaim.width, height: mappedClaim.height}}
          />
          <div
            data-videoagent-content-block="true"
            data-videoagent-readable-evidence-focus="true"
            data-videoagent-min-width-ratio={MIN_CLAIM_FOCUS_WIDTH_RATIO}
            style={{
              position: "absolute",
              left: `${(100 - panelWidth) / 2}%`,
              top: focus?.panelTop ?? "38%",
              width: `${panelWidth}%`,
              maxHeight: focus?.panelMaxHeight ?? "34%",
              aspectRatio: String((Number(sourceAspect) * safe[2]) / safe[3]),
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