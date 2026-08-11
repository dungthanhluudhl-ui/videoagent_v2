import { QuoteBubbleScene } from "./SceneTemplates";

export const V5SCENE6_DURATION = 395;

export const V5Scene6 = () => {
  return (
    <QuoteBubbleScene
      durationInFrames={V5SCENE6_DURATION}
      quoteText="Hỏi rõ Gross hay Net khi chốt deal!"
      highlight="Gross"
      hero={{
        name: "Hero-WorkerAdvice",
        src: "el_worker_advice.png",
        width: 460,
        x: "50%",
        y: 600,
        variant: "flip",
      }}
    />
  );
};
