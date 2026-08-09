import { StatCalloutScene } from "./SceneTemplates";

export const V3SCENE3_DURATION = 340;

export const V3Scene3 = () => {
  return (
    <StatCalloutScene
      durationInFrames={V3SCENE3_DURATION}
      fromValue={1}
      toValue={3}
      suffix=" CÂU HỎI LỚN"
      label="GIÀU? RỦI RO? VỊ THẾ?"
      hero={{
        name: "Hero-Scales",
        src: "el_scales.png",
        width: 680,
        x: "50%",
        y: 440,
        variant: "grow",
      }}
      supports={[
        {
          name: "Support-Globe",
          src: "el_globe.png",
          width: 320,
          x: 630,
          y: 980,
          delay: 20,
          idle: "sway",
        },
        {
          name: "Support-Certificate",
          src: "el_certificate.png",
          width: 300,
          x: 90,
          y: 1040,
          delay: 40,
          idle: "tremble",
        },
      ]}
    />
  );
};
