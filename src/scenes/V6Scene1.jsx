import { CollageScene } from "./SceneTemplates";

export const V6SCENE1_DURATION = 334;

export const V6Scene1 = () => {
  return (
    <CollageScene
      durationInFrames={V6SCENE1_DURATION}
      hero={{
        name: "Hero-Worried",
        src: "el6_worried.png",
        width: 680,
        x: "50%",
        y: 320,
        variant: "punch",
      }}
      supports={[
        {
          // anchor: "sổ đỏ" @ local frame 66 (beat_sync.py, scene-start 0.0)
          // x/y nudged right+down from the original (780,900) — at that
          // position most of the document sat behind the hero's shoulder,
          // only a sliver of it actually visible (caught on a real render,
          // not by the coordinates alone looking wrong)
          name: "Support-BankDoc",
          src: "el6_bank_doc.png",
          width: 240,
          x: 810,
          y: 970,
          delay: 66,
          idle: "tremble",
        },
        {
          // anchor: "sập bẫy" @ local frame 224 (was hardcoded 55 — 169-frame/5.6s desync, fixed)
          name: "Support-Warning",
          src: "el6_warning_icon.png",
          width: 260,
          x: 60,
          y: 950,
          delay: 224,
          idle: "sway",
        },
      ]}
      punchLines={["CƠ HỘI HAY BẪY?"]}
      punchTop={120}
    />
  );
};
