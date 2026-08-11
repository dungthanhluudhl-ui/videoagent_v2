import { CollageScene } from "./SceneTemplates";

export const V8SCENE4_DURATION = 395;

export const V8Scene4 = () => {
  return (
    <CollageScene
      durationInFrames={V8SCENE4_DURATION}
      hero={{
        name: "Hero-BrothPot",
        src: "el8_brothpot.png",
        width: 620,
        x: "50%",
        y: 420,
        variant: "dropSpin",
      }}
      supports={[
        {
          // anchor: "tiền điện" @ local frame 73 (beat_sync.py, scene-start 42.28)
          name: "Support-GasBill",
          src: "el8_gasbill.png",
          width: 260,
          x: 760,
          y: 1020,
          delay: 77,
          idle: "sway",
        },
        {
          // anchor: "tiền thuê mặt bằng" @ local frame 137
          name: "Support-Storefront",
          src: "el8_storefront.png",
          width: 280,
          x: 40,
          y: 980,
          delay: 141,
          idle: "bob",
        },
      ]}
      punchLines={["MẮT XÍCH 2: CHI PHÍ DUY TRÌ"]}
      punchFrom={35}
      punchTop={140}
    />
  );
};
