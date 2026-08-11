import { StatCalloutScene } from "./SceneTemplates";

export const V8SCENE1_DURATION = 364;

export const V8Scene1 = () => {
  return (
    <StatCalloutScene
      durationInFrames={V8SCENE1_DURATION}
      fromValue={0}
      toValue={10000}
      suffix="đ"
      label="TĂNG THÊM MỖI BÁT PHỞ"
      counterDelay={10}
      hero={{
        name: "Hero-Questioning",
        src: "el8_hero_questioning.png",
        width: 620,
        x: "50%",
        y: 460,
        variant: "punch",
      }}
      supports={[
        {
          // anchor: "giá xăng tăng" @ local frame 72 (beat_sync.py, scene-start 0.0)
          name: "Support-GasPump",
          src: "el8_gaspump.png",
          width: 240,
          x: 90,
          y: 1150,
          delay: 76,
          idle: "tremble",
        },
        {
          // anchor: "bát phở đầu ngõ" @ local frame 133
          name: "Support-PhoBowl",
          src: "el8_phobowl.png",
          width: 300,
          x: 680,
          y: 1180,
          delay: 137,
          idle: "sway",
        },
      ]}
      // anchor: "giá xăng giảm" @ local frame 236 — dwell ~123f before cut
      punchLines={["XĂNG GIẢM, PHỞ KHÔNG GIẢM?"]}
      punchFrom={241}
      punchTop={300}
    />
  );
};
