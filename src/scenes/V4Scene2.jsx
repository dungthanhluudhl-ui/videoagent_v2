import { QuoteBubbleScene } from "./SceneTemplates";

export const V4SCENE2_DURATION = 126;

export const V4Scene2 = () => {
  return (
    <QuoteBubbleScene
      durationInFrames={V4SCENE2_DURATION}
      quoteText='Bảo vệ cho bị cáo thì bị dư luận chửi là "tiếp tay cho kẻ ác".'
      highlight="kẻ ác"
      hero={{
        name: "Hero-AngryCrowd",
        src: "el_s2_hero_v4.png",
        width: 680,
        x: "50%",
        y: 480,
        variant: "punch",
      }}
    />
  );
};
