import { FlowDiagramScene } from "./SceneTemplates";

export const V8SCENE2_DURATION = 487;

export const V8Scene2 = () => {
  return (
    <FlowDiagramScene
      durationInFrames={V8SCENE2_DURATION}
      leftHero={{
        // anchor: "tỷ giá" @ local frame 125 (scene-start 12.12)
        name: "HeroL-USD",
        src: "el8_usdicon.png",
        width: 360,
        x: "25%",
        delay: 120,
      }}
      rightHero={{
        // anchor: "giá xăng dầu" @ local frame 169
        name: "HeroR-OilBarrel",
        src: "el8_oilbarrel.png",
        width: 360,
        x: "75%",
        delay: 165,
      }}
      arrowDelay={180}
      // anchor: "giá dầu thế giới biến động" @ local frame 359 — dwell ~123f before cut
      punchLines={["TỶ GIÁ + XĂNG DẦU TĂNG CHI PHÍ"]}
      punchFrom={364}
    />
  );
};
