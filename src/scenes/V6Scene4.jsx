import { CollageScene } from "./SceneTemplates";

export const V6SCENE4_DURATION = 476;

export const V6Scene4 = () => {
  return (
    <CollageScene
      durationInFrames={V6SCENE4_DURATION}
      hero={{
        name: "Hero-FlameInterest",
        src: "el6_flame_interest.png",
        width: 480,
        x: "50%",
        y: 540,
        variant: "strike",
      }}
      supports={[
        {
          // anchor: "cao hơn vay [thế chấp]" @ local frame 255 — the mid-scene
          // callback comparing lãi suất tín chấp vs thế chấp, reusing the
          // scene3 credit-door asset instead of leaving this stretch of the
          // scene with nothing new happening on screen
          name: "Support-CreditCallback",
          src: "el6_door_credit.png",
          width: 200,
          x: 90,
          y: 920,
          delay: 255,
          idle: "sway",
        },
        {
          // anchor: "tiền phí phạt" @ local frame 378 (was hardcoded 35 —
          // appeared 343 frames/11.4s before the line it illustrates)
          name: "Support-PenaltyStamp",
          src: "el6_penalty_stamp.png",
          width: 260,
          x: 680,
          y: 950,
          delay: 378,
          idle: "bob",
        },
      ]}
      punchLines={["CĂNG NHƯ", "DÂY ĐÀN!"]}
      punchTop={120}
      // anchor: "căng như dây" @ local frame 427 (was fixed at 60 — 367
      // frames/12.2s before the line it quotes)
      punchFrom={415}
    />
  );
};
