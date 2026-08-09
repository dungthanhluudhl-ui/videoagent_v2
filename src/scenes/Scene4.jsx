import { SplitCompareScene } from "./SceneTemplates";
export const SCENE4_DURATION = 141;

export const Scene4 = () => {
  return (
    <SplitCompareScene
      durationInFrames={SCENE4_DURATION}
      leftHero={{
        name: "Hero-Lawyer1",
        src: "el_lawyer1.png",
        width: 460,
        y: 380,
      }}
      rightHero={{
        name: "Hero-Globe",
        src: "el_globe.png",
        width: 440,
        y: 380,
      }}
      leftLabel="VIỆT NAM"
      rightLabel="THẾ GIỚI"
      punchLines={["TỶ LỆ KHÁ MỎNG"]}
    />
  );
};
