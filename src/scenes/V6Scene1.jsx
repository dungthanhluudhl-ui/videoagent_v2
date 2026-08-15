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
          name: "Support-BankDoc",
          src: "el6_bank_doc.png",
          width: 240,
          x: 790,
          y: 970,
          delay: 66,
          visibleFor: 168, // exits shortly after Support-Warning (f224) lands
          idle: "tremble",
        },
        {
          // anchor: "cà vẹt xe" @ local frame 82 (beat_sync.py verified)
          name: "Support-VehicleCard",
          src: "el6_vehicle_card.png",
          width: 220,
          x: 60,
          y: 990,
          delay: 82,
          visibleFor: 152,
          idle: "sway",
        },
        {
          // anchor: "sập bẫy" @ local frame 224 (was hardcoded 55 — 169-frame/5.6s desync, fixed)
          name: "Support-Warning",
          src: "el6_warning_icon.png",
          width: 280,
          x: "50%",
          y: 1080,
          delay: 224,
          idle: "sway",
        },
      ]}
      punchLines={["CƠ HỘI HAY BẪY?"]}
      punchTop={120}
      shake={[{ at: 224, len: 10, mag: 6 }]}
    />
  );
};
