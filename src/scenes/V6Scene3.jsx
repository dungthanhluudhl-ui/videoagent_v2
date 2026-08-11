import { SplitCompareScene } from "./SceneTemplates";

export const V6SCENE3_DURATION = 457;

export const V6Scene3 = () => {
  return (
    <SplitCompareScene
      durationInFrames={V6SCENE3_DURATION}
      leftHero={{
        name: "Hero-DoorMortgage",
        src: "el6_door_mortgage.png",
        width: 300,
        x: "25%",
      }}
      rightHero={{
        name: "Hero-DoorCredit",
        src: "el6_door_credit.png",
        width: 300,
        x: "75%",
      }}
      leftLabel="VAY THẾ CHẤP"
      rightLabel="VAY TÍN CHẤP"
      punchLines={["VAY DỄ ≠", "TIÊU DỄ"]}
      // anchor: "vay dễ không" @ local frame 382 (scene-start 22.96) — was
      // fixed at 45 (~1.5s in), ~11s before the line is actually spoken
      punchFrom={367}
    />
  );
};
