import { CollageScene } from "./SceneTemplates";

export const V8SCENE7_DURATION = 325;

export const V8Scene7 = () => {
  return (
    <CollageScene
      durationInFrames={V8SCENE7_DURATION}
      hero={{
        name: "Hero-Resigned",
        src: "el8_hero_resigned.png",
        width: 620,
        x: "50%",
        y: 460,
        variant: "strike",
      }}
      supports={[
        {
          // anchor: "âm thầm bào mòn túi tiền" @ local frame 34 (scene-start 72.14)
          name: "Support-Wallet",
          src: "el8_wallet.png",
          width: 280,
          x: 700,
          y: 1200,
          delay: 38,
          idle: "tremble",
        },
        {
          // anchor: "bình luận chia sẻ" @ local frame 225
          name: "Support-CommentBubble",
          src: "el8_commentbubble.png",
          width: 240,
          x: 80,
          y: 1150,
          delay: 229,
          idle: "bob",
        },
      ]}
      // lineHeight bumped: default 1.22 let the dot-below on "LẠM" (top
      // row, bold 900 weight) visually clip into the row beneath it
      punchLines={["LẠM PHÁT ÂM THẦM BÀO TÚI TIỀN!"]}
      punchFrom={39}
      punchTop={140}
      punchLineHeight={1.5}
    />
  );
};
