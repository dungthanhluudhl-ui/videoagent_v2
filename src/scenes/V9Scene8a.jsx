import { SplitCompareScene } from "./SceneTemplates";

export const V9SCENE8A_DURATION = 220;

export const V9Scene8a = () => {
  return (
    <SplitCompareScene
      durationInFrames={V9SCENE8A_DURATION}
      backdrop="grid"
      leftHero={{ name: "Hero-PersonalAccount", src: "el9_wallet_personal.png", width: 340, x: "25%", y: 420 }}
      rightHero={{ name: "Hero-BusinessAccount", src: "el9_shop_cart.png", width: 340, x: "75%", y: 420 }}
      leftLabel="TÀI KHOẢN CÁ NHÂN"
      rightLabel="TÀI KHOẢN BÁN HÀNG"
      // anchor: "tách riêng tài khoản" @ local frame 122 (beat_sync.py verified)
      punchLines={["MẸO 1: TÁCH TÀI KHOẢN"]}
      punchFrom={118}
      punchTop={190}
    />
  );
};
