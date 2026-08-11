import { SplitCompareScene } from "./SceneTemplates";

export const V4SCENE3_DURATION = 211;

export const V4Scene3 = () => {
  return (
    <SplitCompareScene
      durationInFrames={V4SCENE3_DURATION}
      leftHero={{
        name: "Hero-Books",
        src: "el_books.png",
        width: 320,
        x: "25%",
        y: 420,
      }}
      rightHero={{
        name: "Hero-ShreddedDocs",
        src: "el_s3_sup_docs_v4.png",
        width: 340,
        x: "75%",
        y: 470,
      }}
      leftLabel="TƯ VẤN PHÁP LUẬT"
      rightLabel="KHAI GIAN / HỦY CHỨNG CỨ"
      punchLines={["RANH GIỚI", "MONG MANH"]}
    />
  );
};
