import { StatCalloutScene } from "./SceneTemplates";

export const V5SCENE5_DURATION = 386;

export const V5Scene5 = () => {
  return (
    <StatCalloutScene
      durationInFrames={V5SCENE5_DURATION}
      fromValue={20000000}
      toValue={17300000}
      suffix="đ"
      label="THỰC NHẬN VỀ TÀI KHOẢN"
      hero={{
        name: "Hero-WorkerMathCalc",
        src: "el_worker_mathcalc.png",
        width: 620,
        x: "50%",
        y: 420,
        variant: "dropSpin",
      }}
      supports={[
        {
          name: "Support-Calculator2",
          src: "el_calculator.png",
          width: 230,
          x: 770,
          y: 1000,
          delay: 35,
          idle: "sway",
        },
        {
          name: "Support-CashSmall2",
          src: "el_cash_small.png",
          width: 250,
          x: 60,
          y: 1080,
          delay: 50,
          idle: "tremble",
        },
      ]}
    />
  );
};
