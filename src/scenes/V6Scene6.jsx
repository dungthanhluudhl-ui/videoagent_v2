import { StatCalloutScene } from "./SceneTemplates";

export const V6SCENE6_DURATION = 407;

export const V6Scene6 = () => {
  return (
    <StatCalloutScene
      durationInFrames={V6SCENE6_DURATION}
      backdrop="chart"
      fromValue={0}
      toValue={50}
      suffix="%"
      label="QUY TẮC VÀNG: 30-50% HẠN MỨC"
      // anchor: "ba mươi" (start of "30 đến 50 phần trăm") @ local frame 195
      // — was fixed at 10, counting up ~6.4s before the rule is even said
      counterDelay={195}
      hero={{
        name: "Hero-Confident",
        src: "el6_confident.png",
        width: 600,
        x: "50%",
        y: 420,
        variant: "dropSpin",
      }}
      supports={[
        {
          // anchor: "có trách nhiệm" @ local frame 106 (beat_sync.py verified)
          name: "Support-Responsibility",
          src: "el6_responsibility_icon.png",
          width: 220,
          x: 100,
          y: 940,
          delay: 106,
          visibleFor: 212, // exits before Support-CreditCard (f308) lands
          idle: "sway",
        },
        {
          // anchor: "khả năng hoàn [trả]" @ local frame 308 (beat_sync.py
          // verified) — was hardcoded 35, now lands on the actual "tính
          // trước khả năng hoàn trả" line
          name: "Support-CreditCard",
          src: "el6_credit_card.png",
          width: 260,
          x: 760,
          y: 940,
          delay: 308,
          idle: "sway",
        },
      ]}
    />
  );
};
