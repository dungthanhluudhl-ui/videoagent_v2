import { NewspaperSpotlightScene } from "./SceneTemplates";

export const V9SCENE2_DURATION = 157;

export const V9Scene2 = () => {
  return (
    <NewspaperSpotlightScene
      durationInFrames={V9SCENE2_DURATION}
      docSrc="el9_news_clipping.png"
      highlightBox={{ x: "8%", y: "36%", w: "84%", h: "30%" }}
      stampText=""
      hero={{ name: "Hero-Panicked", src: "el9_char_shocked.png", width: 380, x: "72%", y: 880 }}
      backdrop="card"
      // anchor: "hoang mang tột độ" @ local frame 109 (beat_sync.py verified) -
      // 48f dwell before the cut to S3 at 157
      punchLines={["HOANG MANG TỘT ĐỘ!"]}
      punchFrom={109}
      punchTop={110}
    />
  );
};
