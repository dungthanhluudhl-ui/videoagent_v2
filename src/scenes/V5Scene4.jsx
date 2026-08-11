import { FlowDiagramScene } from "./SceneTemplates";

export const V5SCENE4_DURATION = 478;

export const V5Scene4 = () => {
  return (
    <FlowDiagramScene
      durationInFrames={V5SCENE4_DURATION}
      leftHero={{
        name: "Hero-PayslipDoc",
        src: "el_payslip_doc.png",
        width: 360,
        x: "25%",
      }}
      rightHero={{
        name: "Hero-TaxBuilding",
        src: "el_tax_building.png",
        width: 360,
        x: "75%",
      }}
      punchLines={["MẤT THÊM", "500-600K"]}
    />
  );
};
