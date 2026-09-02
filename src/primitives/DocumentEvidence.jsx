import {AbsoluteFill, Img, staticFile} from "remotion";

const source = (src) => (/^(?:https?:|data:|blob:)/i.test(String(src)) ? src : staticFile(src));

export const DocumentEvidence = ({
  src,
  alt = "Authentic source document",
  crop,
  focus,
  dim = 0.56,
  style,
}) => {
  if (!src) throw new Error("DocumentEvidence requires an authentic raster/document src");
  const region = focus?.region;
  return (
    <AbsoluteFill data-videoagent-document-evidence="true" style={{overflow: "hidden", ...style}}>
      <Img src={source(src)} alt={alt} style={{width: "100%", height: "100%", objectFit: crop?.fit ?? "contain", objectPosition: crop?.position ?? "50% 50%"}} />
      {region ? (
        <>
          <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dim})`}} />
          <div
            data-videoagent-content-block="true"
            style={{position: "absolute", left: `${region[0] * 100}%`, top: `${region[1] * 100}%`, width: `${region[2] * 100}%`, height: `${region[3] * 100}%`, border: `${focus.borderWidth ?? 5}px solid ${focus.color ?? "#FF6A1A"}`, boxShadow: `0 0 0 9999px rgba(0,0,0,${Math.max(0, dim - 0.2)})`}}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};