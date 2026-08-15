import { NewspaperSpotlightScene } from "./SceneTemplates";

export const V6SCENE2_DURATION = 355;

export const V6Scene2 = () => {
  return (
    <NewspaperSpotlightScene
      durationInFrames={V6SCENE2_DURATION}
      backdrop="card"
      docSrc="el6_news_clipping.png"
      highlightBox={{ x: "10%", y: "6%", w: "80%", h: "16%" }}
      stampText="NGUỒN: TIN TỨC"
      stampX="55%"
      stampY={870}
      stampSize={30}
      // anchor: "nhiều nguồn" @ local frame 165 (scene-start 11.14) — was fixed
      // at 28 (~1s), nearly 5s before "nguồn" is actually said
      stampDelay={165}
      hero={{
        name: "Hero-Confident-Intro",
        src: "el6_confident.png",
        width: 260,
        x: "80%",
        y: 1020,
      }}
      supports={[
        {
          // anchor: "bình luận bên dưới" @ local frame 295 (beat_sync.py verified)
          name: "Support-CommentIcon",
          src: "el6_comment_icon.png",
          width: 180,
          x: 100,
          y: 1010,
          delay: 295,
          idle: "bob",
        },
      ]}
    />
  );
};
