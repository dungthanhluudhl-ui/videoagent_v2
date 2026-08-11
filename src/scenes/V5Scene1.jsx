import { CollageScene } from "./SceneTemplates";

export const V5SCENE1_DURATION = 330;

export const V5Scene1 = () => {
  return (
    <CollageScene
      durationInFrames={V5SCENE1_DURATION}
      hero={{
        name: "Hero-WorkerShocked",
        src: "el_worker_shocked.png",
        width: 680,
        x: "50%",
        y: 300,
        variant: "punch",
      }}
      supports={[
        {
          name: "Support-PhoneSalary",
          src: "el_phone_salary.png",
          width: 250,
          x: 790,
          y: 900,
          delay: 30,
          idle: "tremble",
        },
        {
          name: "Support-CashSmall",
          src: "el_cash_small.png",
          width: 270,
          x: 50,
          y: 1060,
          delay: 55,
          idle: "sway",
        },
      ]}
      punchLines={["VỀ TAY CHỈ", "16 \"CỦ\"?"]}
      punchTop={120}
    />
  );
};
