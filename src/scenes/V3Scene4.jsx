import { NewspaperSpotlightScene } from "./SceneTemplates";

export const V3SCENE4_DURATION = 500;

export const V3Scene4 = () => {
  return (
    <NewspaperSpotlightScene
      durationInFrames={V3SCENE4_DURATION}
      docSrc="doc_certificate.jpg"
      highlightBox={{ x: "12%", y: "38%", w: "76%", h: "18%" }}
      punchLines={["BÓC TÁCH", "NGHỀ LUẬT SƯ", "TẠI VIỆT NAM"]}
      hero={{
        name: "Hero-Lawyer2",
        src: "el_lawyer2.png",
        width: 420,
        x: "78%",
        y: 960,
      }}
    />
  );
};
