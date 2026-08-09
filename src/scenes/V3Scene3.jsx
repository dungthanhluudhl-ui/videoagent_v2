import { QuoteBubbleScene } from "./SceneTemplates";

export const V3SCENE3_DURATION = 340;

export const V3Scene3 = () => {
  return (
    <QuoteBubbleScene
      durationInFrames={V3SCENE3_DURATION}
      quoteText="Liệu nghề luật sư ở Việt Nam có giàu như thiên hạ đồn?"
      highlight="giàu"
      hero={{
        name: "Hero-Scales",
        src: "el_scales.png",
        width: 620,
        x: "50%",
        y: 450,
        variant: "grow",
      }}
    />
  );
};
