import { SplitCompareScene } from "./SceneTemplates";

export const V3SCENE2_DURATION = 720;

export const V3Scene2 = () => {
  return (
    <SplitCompareScene
      durationInFrames={V3SCENE2_DURATION}
      leftHero={{
        name: "Hero-Lawyer1",
        src: "el_lawyer1.png",
        width: 360,
        x: "25%",
        y: 400,
      }}
      rightHero={{
        name: "Hero-LateNight",
        src: "el_lawyer_late_night.png",
        width: 360,
        x: "75%",
        y: 400,
      }}
      leftLabel="5% HÀO HOA"
      rightLabel="95% THỰC TẾ"
      punchLines={["95% THỰC TẾ", "CƠM ÁO GẠO TIỀN"]}
    />
  );
};
