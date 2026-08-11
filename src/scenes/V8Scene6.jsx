import { SplitCompareScene } from "./SceneTemplates";

export const V8SCENE6_DURATION = 256;

export const V8Scene6 = () => {
  return (
    <SplitCompareScene
      durationInFrames={V8SCENE6_DURATION}
      leftHero={{
        name: "Hero-GasDown",
        src: "el8_gaspumpdown.png",
        width: 320,
      }}
      rightHero={{
        name: "Hero-RentWageFlat",
        src: "el8_houseflat.png",
        width: 420,
        y: 480,
      }}
      leftLabel="XĂNG: GIẢM ↓"
      rightLabel="TIỀN NHÀ, CÔNG: ĐỨNG YÊN"
      // anchor: "quay về giá cũ" @ local frame 217 (scene-start 63.62) — moved
      // earlier (~22f) so it settles for real dwell time before the cut
      punchLines={["GIÁ CŨ KHÓ QUAY LẠI"]}
      punchFrom={195}
    />
  );
};
