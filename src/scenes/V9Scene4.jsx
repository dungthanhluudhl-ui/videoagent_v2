import { CollageScene } from "./SceneTemplates";

export const V9SCENE4_DURATION = 208;

export const V9Scene4 = () => {
  return (
    <CollageScene
      durationInFrames={V9SCENE4_DURATION}
      backdrop="card"
      hero={{ name: "Hero-EverydayLife", src: "el9_char_normal.png", width: 580, x: "50%", y: 380, variant: "rise" }}
      supports={[
        {
          // anchor: "mừng đám cưới" @ local frame 61 (beat_sync.py verified)
          name: "Support-Everyday",
          src: "el9_everyday_icon.png",
          width: 260,
          x: 770,
          y: 990,
          delay: 61,
          idle: "sway",
        },
        {
          // anchor: "bố mẹ gửi tiền" @ local frame 143 (beat_sync.py verified)
          name: "Support-Family",
          src: "el9_family_icon.png",
          width: 280,
          x: 50,
          y: 1060,
          delay: 143,
          idle: "sway",
        },
      ]}
      // anchor: "trả tiền cơm" @ local frame 26 (beat_sync.py verified)
      punchLines={["CHUYỆN THƯỜNG NGÀY!"]}
      punchFrom={30}
      punchTop={150}
    />
  );
};
