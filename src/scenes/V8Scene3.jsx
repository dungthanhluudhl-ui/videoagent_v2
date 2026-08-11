import { CollageScene } from "./SceneTemplates";

export const V8SCENE3_DURATION = 418;

export const V8Scene3 = () => {
  return (
    <CollageScene
      durationInFrames={V8SCENE3_DURATION}
      hero={{
        name: "Hero-Truck",
        src: "el8_truck.png",
        width: 680,
        x: "50%",
        y: 400,
        variant: "flip",
      }}
      supports={[
        {
          // anchor: "thịt bò" @ local frame 122 (beat_sync.py, scene-start 28.36)
          name: "Support-Ingredients",
          src: "el8_ingredients.png",
          width: 260,
          x: 760,
          y: 980,
          delay: 126,
          idle: "bob",
        },
        {
          // anchor: "tiền cước tăng" @ local frame 279
          name: "Support-CashRegister",
          src: "el8_cashregister.png",
          width: 280,
          x: 40,
          y: 950,
          delay: 283,
          idle: "tremble",
        },
      ]}
      punchLines={["MẮT XÍCH 1: CƯỚC VẬN CHUYỂN"]}
      punchFrom={45}
      punchTop={140}
    />
  );
};
