import { QuoteBubbleScene } from "./SceneTemplates";

export const V6SCENE7_DURATION = 300;

export const V6Scene7 = () => {
  return (
    <QuoteBubbleScene
      durationInFrames={V6SCENE7_DURATION}
      backdrop="card"
      quoteText="Bật trích nợ tự động để không trễ hạn!"
      highlight="hạn"
      hero={{
        name: "Hero-Advising",
        src: "el6_advising.png",
        width: 480,
        x: "50%",
        y: 560,
        variant: "flip",
      }}
    />
  );
};
