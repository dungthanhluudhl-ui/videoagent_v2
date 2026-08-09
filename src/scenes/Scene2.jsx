import { StatCalloutScene } from "./SceneTemplates";
export const SCENE2_DURATION = 150;

export const Scene2 = () => {
  return (
    <StatCalloutScene
      durationInFrames={SCENE2_DURATION}
      fromValue={1000}
      toValue={19000}
      suffix=" LUẬT SƯ"
      label="CẢ NƯỚC CÓ THẺ HÀNH NGHỀ"
      hero={{
        name: "Hero-Lawyer2",
        src: "el_lawyer2.png",
        width: 660,
        x: "50%",
        y: 440,
        variant: "grow",
      }}
      supports={[
        {
          name: "Support-Books",
          src: "el_books.png",
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
