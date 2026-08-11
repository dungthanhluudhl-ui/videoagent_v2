import { SplitCompareScene } from "./SceneTemplates";

export const V5SCENE2_DURATION = 531;

export const V5Scene2 = () => {
  return (
    <SplitCompareScene
      durationInFrames={V5SCENE2_DURATION}
      leftHero={{
        name: "Hero-CashGross",
        src: "el_cash_stack_gross.png",
        width: 300,
        x: "25%",
        y: 420,
      }}
      rightHero={{
        name: "Hero-WalletNet",
        src: "el_wallet_net.png",
        width: 360,
        x: "75%",
        y: 420,
      }}
      leftLabel="GROSS (Tổng)"
      rightLabel="NET (Về ví)"
      punchLines={["GROSS ≠ NET"]}
    />
  );
};
