import { CollageScene } from "./SceneTemplates";

export const V4SCENE1_DURATION = 106;

export const V4Scene1 = () => {
  return (
    <CollageScene
      durationInFrames={V4SCENE1_DURATION}
      hero={{
        name: "Hero-Lawyer",
        src: "el_s1_hero_v4.png",
        width: 640,
        x: "50%",
        y: 330,
        variant: "dropSpin",
      }}
      supports={[
        {
          name: "Support-Gavel",
          src: "el_gavel.png",
          width: 260,
          x: 90,
          y: 1010,
          delay: 30,
          idle: "sway",
        },
        {
          name: "Support-Flag",
          src: "el_s1_sup_flag.png",
          width: 260,
          x: 760,
          y: 970,
          delay: 55,
          idle: "bob",
        },
      ]}
      punchLines={["CỰC KỲ", "NGUY HIỂM"]}
      punchTop={120}
    />
  );
};
