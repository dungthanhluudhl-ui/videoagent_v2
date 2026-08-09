import { CollageScene } from "./SceneTemplates";

export const V3SCENE1_DURATION = 490;

export const V3Scene1 = () => {
  return (
    <CollageScene
      durationInFrames={V3SCENE1_DURATION}
      hero={{
        name: "Hero-HollywoodLawyer",
        src: "el_hollywood_lawyer.png",
        width: 680,
        x: "50%",
        y: 350,
        variant: "dropSpin",
      }}
      supports={[
        {
          name: "Support-Gavel",
          src: "el_gavel.png",
          width: 280,
          x: 100,
          y: 1040,
          delay: 30,
          idle: "sway",
        },
        {
          name: "Support-Dollar",
          src: "el_dollar_stack.png",
          width: 320,
          x: 630,
          y: 980,
          delay: 60,
          idle: "bob",
        },
      ]}
      punchLines={["LUẬT SƯ HOÀNG GIA", "PHIM TVB & MỸ"]}
      punchTop={120}
    />
  );
};
