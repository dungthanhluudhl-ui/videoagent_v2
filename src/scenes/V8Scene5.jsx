import { NewspaperSpotlightScene } from "./SceneTemplates";

export const V8SCENE5_DURATION = 245;

export const V8Scene5 = () => {
  return (
    <NewspaperSpotlightScene
      durationInFrames={V8SCENE5_DURATION}
      docSrc="el8_econdoc.png"
      highlightBox={{ x: "10%", y: "32%", w: "80%", h: "18%" }}
      stampText="GIÁ CỨNG NHẮC"
      stampX="60%"
      stampY={870}
      stampSize={32}
      // anchor: "tính cứng của giá cả" @ local frame 128 (scene-start 55.44)
      stampDelay={133}
      hero={{
        name: "Hero-Explaining",
        src: "el8_hero_explaining.png",
        width: 260,
        x: "80%",
        y: 1020,
      }}
      punchLines={["TÍNH CỨNG CỦA GIÁ CẢ"]}
      punchFrom={20}
    />
  );
};
