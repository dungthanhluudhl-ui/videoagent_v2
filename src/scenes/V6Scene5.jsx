import { FlowDiagramScene } from "./SceneTemplates";

export const V6SCENE5_DURATION = 489;

export const V6Scene5 = () => {
  return (
    <FlowDiagramScene
      durationInFrames={V6SCENE5_DURATION}
      leftHero={{
        // anchor: "Trả chậm" @ local frame 121 (scene-start 54.04) — was
        // hardcoded 0, appearing before the scene even starts describing it
        name: "Hero-CalendarOverdue",
        src: "el6_calendar_overdue.png",
        width: 340,
        x: "25%",
        delay: 121,
      }}
      rightHero={{
        // anchor: "ra chuồng gà" @ local frame 432 — was hardcoded 25,
        // ~13.5s before the rejection consequence is actually spoken
        name: "Hero-CicRejected",
        src: "el6_cic_rejected.png",
        width: 340,
        x: "75%",
        delay: 420,
      }}
      arrowDelay={405}
      punchLines={["CIC XẤU =", "KHÓ VAY"]}
      punchFrom={455}
    />
  );
};
