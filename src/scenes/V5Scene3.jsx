import { StatCalloutScene } from "./SceneTemplates";

export const V5SCENE3_DURATION = 565;

export const V5Scene3 = () => {
  return (
    <StatCalloutScene
      durationInFrames={V5SCENE3_DURATION}
      fromValue={0}
      toValue={2100000}
      suffix="đ"
      label="TRẠM 1: BẢO HIỂM BẮT BUỘC (~10,5%)"
      hero={{
        name: "Hero-ShieldInsurance",
        src: "el_shield_insurance.png",
        width: 500,
        x: "50%",
        y: 560,
        variant: "grow",
      }}
      supports={[
        {
          name: "Support-Calculator",
          src: "el_calculator.png",
          width: 260,
          x: 680,
          y: 900,
          delay: 35,
          idle: "bob",
        },
      ]}
    />
  );
};
