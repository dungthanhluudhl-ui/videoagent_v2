import { Composition, Folder } from "remotion";
import { LuatSuDaoDuc, LUATSU_CANVAS, LUATSU_TOTAL_FRAMES } from "./LuatSuDaoDuc";
import { LuatSuDaoDuc3, MASTER3_DURATION } from "./LuatSuDaoDuc3";

import { IconVocabularySheet, ICON_SHEET_DURATION } from "./scenes/IconVocabularySheet";

import { Scene1, SCENE1_DURATION } from "./scenes/Scene1";
import { Scene2, SCENE2_DURATION } from "./scenes/Scene2";
import { Scene3, SCENE3_DURATION } from "./scenes/Scene3";
import { Scene4, SCENE4_DURATION } from "./scenes/Scene4";

import { V3Scene1, V3SCENE1_DURATION } from "./scenes/V3Scene1";
import { V3Scene2, V3SCENE2_DURATION } from "./scenes/V3Scene2";
import { V3Scene3, V3SCENE3_DURATION } from "./scenes/V3Scene3";
import { V3Scene4, V3SCENE4_DURATION } from "./scenes/V3Scene4";

import { LuatSuDaoDuc4, MASTER4_DURATION } from "./LuatSuDaoDuc4";
import { V4Scene1, V4SCENE1_DURATION } from "./scenes/V4Scene1";
import { V4Scene2, V4SCENE2_DURATION } from "./scenes/V4Scene2";
import { V4Scene3, V4SCENE3_DURATION } from "./scenes/V4Scene3";
import { V4Scene4, V4SCENE4_DURATION } from "./scenes/V4Scene4";
import { V4Scene5, V4SCENE5_DURATION } from "./scenes/V4Scene5";

import { LuongGrossNet, MASTER5_DURATION } from "./LuongGrossNet";
import { V5Scene1, V5SCENE1_DURATION } from "./scenes/V5Scene1";
import { V5Scene2, V5SCENE2_DURATION } from "./scenes/V5Scene2";
import { V5Scene3, V5SCENE3_DURATION } from "./scenes/V5Scene3";
import { V5Scene4, V5SCENE4_DURATION } from "./scenes/V5Scene4";
import { V5Scene5, V5SCENE5_DURATION } from "./scenes/V5Scene5";
import { V5Scene6, V5SCENE6_DURATION } from "./scenes/V5Scene6";

import { VayTinChap, MASTER6_DURATION } from "./VayTinChap";
import { V6Scene1, V6SCENE1_DURATION } from "./scenes/V6Scene1";
import { V6Scene2, V6SCENE2_DURATION } from "./scenes/V6Scene2";
import { V6Scene3, V6SCENE3_DURATION } from "./scenes/V6Scene3";
import { V6Scene4, V6SCENE4_DURATION } from "./scenes/V6Scene4";
import { V6Scene5, V6SCENE5_DURATION } from "./scenes/V6Scene5";
import { V6Scene6, V6SCENE6_DURATION } from "./scenes/V6Scene6";
import { V6Scene7, V6SCENE7_DURATION } from "./scenes/V6Scene7";

import { XangTyGiaBatPho, MASTER8_DURATION } from "./XangTyGiaBatPho";
import { V8Scene1, V8SCENE1_DURATION } from "./scenes/V8Scene1";
import { V8Scene2, V8SCENE2_DURATION } from "./scenes/V8Scene2";
import { V8Scene3, V8SCENE3_DURATION } from "./scenes/V8Scene3";
import { V8Scene4, V8SCENE4_DURATION } from "./scenes/V8Scene4";
import { V8Scene5, V8SCENE5_DURATION } from "./scenes/V8Scene5";
import { V8Scene6, V8SCENE6_DURATION } from "./scenes/V8Scene6";
import { V8Scene7, V8SCENE7_DURATION } from "./scenes/V8Scene7";

import { V9Scene1, V9SCENE1_DURATION } from "./scenes/V9Scene1";
import { V9Scene2, V9SCENE2_DURATION } from "./scenes/V9Scene2";
import { V9Scene3, V9SCENE3_DURATION } from "./scenes/V9Scene3";
import { V9Scene4, V9SCENE4_DURATION } from "./scenes/V9Scene4";
import { V9Scene5, V9SCENE5_DURATION } from "./scenes/V9Scene5";
import { V9Scene6, V9SCENE6_DURATION } from "./scenes/V9Scene6";
import { V9Scene7, V9SCENE7_DURATION } from "./scenes/V9Scene7";
import { V9Scene8a, V9SCENE8A_DURATION } from "./scenes/V9Scene8a";
import { V9Scene8b, V9SCENE8B_DURATION } from "./scenes/V9Scene8b";
import { V9Scene9, V9SCENE9_DURATION } from "./scenes/V9Scene9";
import { V9Scene10, V9SCENE10_DURATION } from "./scenes/V9Scene10";
import { ThueGiaoDichSo9, MASTER9_DURATION } from "./ThueGiaoDichSo9";

// V10 = Itaewon crowd-crush video. Unrelated to the V9/ThueGiaoDichSo9
// project above (that one is a separate, still-uncommitted video).
import { V10Scene1, V10SCENE1_DURATION } from "./scenes/V10Scene1";
import { V10Scene2, V10SCENE2_DURATION } from "./scenes/V10Scene2";
import { V10Scene3, V10SCENE3_DURATION } from "./scenes/V10Scene3";
import { V10Scene4, V10SCENE4_DURATION } from "./scenes/V10Scene4";
import { V10Scene5, V10SCENE5_DURATION } from "./scenes/V10Scene5";
import { V10Scene6, V10SCENE6_DURATION } from "./scenes/V10Scene6";
import { V10Scene7, V10SCENE7_DURATION } from "./scenes/V10Scene7";
import { V10Scene8, V10SCENE8_DURATION } from "./scenes/V10Scene8";
import { V10Scene9, V10SCENE9_DURATION } from "./scenes/V10Scene9";
import { V10Scene10, V10SCENE10_DURATION } from "./scenes/V10Scene10";
import { V10Scene11, V10SCENE11_DURATION } from "./scenes/V10Scene11";
import { V10Scene12, V10SCENE12_DURATION } from "./scenes/V10Scene12";
import { V10Scene13, V10SCENE13_DURATION } from "./scenes/V10Scene13";
import { V10Scene14, V10SCENE14_DURATION } from "./scenes/V10Scene14";
import { V10Scene15, V10SCENE15_DURATION } from "./scenes/V10Scene15";
import { V10Scene16, V10SCENE16_DURATION } from "./scenes/V10Scene16";
import { V10Scene17, V10SCENE17_DURATION } from "./scenes/V10Scene17";
import { V10Scene18, V10SCENE18_DURATION } from "./scenes/V10Scene18";
import { V10Scene19, V10SCENE19_DURATION } from "./scenes/V10Scene19";
import { V10Scene20, V10SCENE20_DURATION } from "./scenes/V10Scene20";
import { V10Scene21, V10SCENE21_DURATION } from "./scenes/V10Scene21";
import { V10Scene22, V10SCENE22_DURATION } from "./scenes/V10Scene22";
import { V10Scene23, V10SCENE23_DURATION } from "./scenes/V10Scene23";
import { V10Scene24, V10SCENE24_DURATION } from "./scenes/V10Scene24";
import { V10Scene25, V10SCENE25_DURATION } from "./scenes/V10Scene25";
import { V10Scene26, V10SCENE26_DURATION } from "./scenes/V10Scene26";

// V11 = Itaewon phan 2. Tiep lien mach V10, dung tu input/scene_plan11.json.
import { V11Scene1, V11SCENE1_DURATION } from "./scenes/V11Scene1";
import { V11Scene2, V11SCENE2_DURATION } from "./scenes/V11Scene2";
import { V11Scene3, V11SCENE3_DURATION } from "./scenes/V11Scene3";
import { V11Scene4, V11SCENE4_DURATION } from "./scenes/V11Scene4";
import { V11Scene5, V11SCENE5_DURATION } from "./scenes/V11Scene5";
import { V11Scene6, V11SCENE6_DURATION } from "./scenes/V11Scene6";
import { V11Scene7, V11SCENE7_DURATION } from "./scenes/V11Scene7";
import { V11Scene8, V11SCENE8_DURATION } from "./scenes/V11Scene8";
import { V11Scene9, V11SCENE9_DURATION } from "./scenes/V11Scene9";
import { V11Scene10, V11SCENE10_DURATION } from "./scenes/V11Scene10";
import { V11Scene11, V11SCENE11_DURATION } from "./scenes/V11Scene11";
import { V11Scene12, V11SCENE12_DURATION } from "./scenes/V11Scene12";
import { V11Scene13, V11SCENE13_DURATION } from "./scenes/V11Scene13";
import { V11Scene14, V11SCENE14_DURATION } from "./scenes/V11Scene14";
import { V11Scene15, V11SCENE15_DURATION } from "./scenes/V11Scene15";
import { V11Scene16, V11SCENE16_DURATION } from "./scenes/V11Scene16";
import { V11Scene17, V11SCENE17_DURATION } from "./scenes/V11Scene17";
import { V11Scene18, V11SCENE18_DURATION } from "./scenes/V11Scene18";
import { V11Scene19, V11SCENE19_DURATION } from "./scenes/V11Scene19";
import { V11Scene20, V11SCENE20_DURATION } from "./scenes/V11Scene20";
import { V11Scene21, V11SCENE21_DURATION } from "./scenes/V11Scene21";
import { V11Scene22, V11SCENE22_DURATION } from "./scenes/V11Scene22";
import { V11Scene23, V11SCENE23_DURATION } from "./scenes/V11Scene23";
import { V11Scene24, V11SCENE24_DURATION } from "./scenes/V11Scene24";
import { ItaewonRemDap, MASTER10_DURATION } from "./ItaewonRemDap";
import { ItaewonHemNho, MASTER11_DURATION } from "./ItaewonHemNho";

// Render-proof compositions for the visual-language primitives (see
// src/scenes/VLDemo.jsx) - a primitive that compiles but renders blank is a
// real failure mode, so each gets a still-checkable composition.
import {
  VLDemoAnnotated, VLDemoBackground, VLDemoDensity, VLDemoDiagram,
  VLDemoMap, VLDemoMockup, VLDemoTimeline, VLDEMO_DURATION,
} from "./scenes/VLDemo";
import {
  VLDemoChain, VLDemoDots, VLDemoForce, VLDemoShops, VLDEMO2_DURATION,
} from "./scenes/VLDemo2";

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="LuatSu-Scenes">
        <Composition id="Scene1" component={Scene1} durationInFrames={SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene2" component={Scene2} durationInFrames={SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene3" component={Scene3} durationInFrames={SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene4" component={Scene4} durationInFrames={SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Folder name="LuatSu3-Scenes">
        <Composition id="V3Scene1" component={V3Scene1} durationInFrames={V3SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V3Scene2" component={V3Scene2} durationInFrames={V3SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V3Scene3" component={V3Scene3} durationInFrames={V3SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V3Scene4" component={V3Scene4} durationInFrames={V3SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Composition
        id="LuatSuDaoDuc"
        component={LuatSuDaoDuc}
        durationInFrames={LUATSU_TOTAL_FRAMES}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Composition
        id="LuatSuDaoDuc3"
        component={LuatSuDaoDuc3}
        durationInFrames={MASTER3_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Folder name="LuatSu4-Scenes">
        <Composition id="V4Scene1" component={V4Scene1} durationInFrames={V4SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V4Scene2" component={V4Scene2} durationInFrames={V4SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V4Scene3" component={V4Scene3} durationInFrames={V4SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V4Scene4" component={V4Scene4} durationInFrames={V4SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V4Scene5" component={V4Scene5} durationInFrames={V4SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Composition
        id="LuatSuDaoDuc4"
        component={LuatSuDaoDuc4}
        durationInFrames={MASTER4_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Folder name="LuongGrossNet-Scenes">
        <Composition id="V5Scene1" component={V5Scene1} durationInFrames={V5SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V5Scene2" component={V5Scene2} durationInFrames={V5SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V5Scene3" component={V5Scene3} durationInFrames={V5SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V5Scene4" component={V5Scene4} durationInFrames={V5SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V5Scene5" component={V5Scene5} durationInFrames={V5SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V5Scene6" component={V5Scene6} durationInFrames={V5SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Composition
        id="LuongGrossNet"
        component={LuongGrossNet}
        durationInFrames={MASTER5_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Folder name="VayTinChap-Scenes">
        <Composition id="V6Scene1" component={V6Scene1} durationInFrames={V6SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene2" component={V6Scene2} durationInFrames={V6SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene3" component={V6Scene3} durationInFrames={V6SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene4" component={V6Scene4} durationInFrames={V6SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene5" component={V6Scene5} durationInFrames={V6SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene6" component={V6Scene6} durationInFrames={V6SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V6Scene7" component={V6Scene7} durationInFrames={V6SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Composition
        id="VayTinChap"
        component={VayTinChap}
        durationInFrames={MASTER6_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Folder name="XangTyGiaBatPho-Scenes">
        <Composition id="V8Scene1" component={V8Scene1} durationInFrames={V8SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene2" component={V8Scene2} durationInFrames={V8SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene3" component={V8Scene3} durationInFrames={V8SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene4" component={V8Scene4} durationInFrames={V8SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene5" component={V8Scene5} durationInFrames={V8SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene6" component={V8Scene6} durationInFrames={V8SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V8Scene7" component={V8Scene7} durationInFrames={V8SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Composition
        id="XangTyGiaBatPho"
        component={XangTyGiaBatPho}
        durationInFrames={MASTER8_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Folder name="ThueGiaoDichSo9-Scenes">
        <Composition id="V9Scene1" component={V9Scene1} durationInFrames={V9SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene2" component={V9Scene2} durationInFrames={V9SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene3" component={V9Scene3} durationInFrames={V9SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene4" component={V9Scene4} durationInFrames={V9SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene5" component={V9Scene5} durationInFrames={V9SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene6" component={V9Scene6} durationInFrames={V9SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene7" component={V9Scene7} durationInFrames={V9SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene8a" component={V9Scene8a} durationInFrames={V9SCENE8A_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene8b" component={V9Scene8b} durationInFrames={V9SCENE8B_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene9" component={V9Scene9} durationInFrames={V9SCENE9_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V9Scene10" component={V9Scene10} durationInFrames={V9SCENE10_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Folder name="VisualLanguage-Demos">
        <Composition id="VLDemoBackground" component={VLDemoBackground} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoDiagram" component={VLDemoDiagram} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoDensity" component={VLDemoDensity} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoTimeline" component={VLDemoTimeline} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoAnnotated" component={VLDemoAnnotated} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoMap" component={VLDemoMap} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoMockup" component={VLDemoMockup} durationInFrames={VLDEMO_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoForce" component={VLDemoForce} durationInFrames={VLDEMO2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoDots" component={VLDemoDots} durationInFrames={VLDEMO2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoChain" component={VLDemoChain} durationInFrames={VLDEMO2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="VLDemoShops" component={VLDemoShops} durationInFrames={VLDEMO2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Folder name="V11-Itaewon-P2-Scenes">
        <Composition id="V11Scene1" component={V11Scene1} durationInFrames={V11SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene2" component={V11Scene2} durationInFrames={V11SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene3" component={V11Scene3} durationInFrames={V11SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene4" component={V11Scene4} durationInFrames={V11SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene5" component={V11Scene5} durationInFrames={V11SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene6" component={V11Scene6} durationInFrames={V11SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene7" component={V11Scene7} durationInFrames={V11SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene8" component={V11Scene8} durationInFrames={V11SCENE8_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene9" component={V11Scene9} durationInFrames={V11SCENE9_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene10" component={V11Scene10} durationInFrames={V11SCENE10_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene11" component={V11Scene11} durationInFrames={V11SCENE11_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene12" component={V11Scene12} durationInFrames={V11SCENE12_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene13" component={V11Scene13} durationInFrames={V11SCENE13_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene14" component={V11Scene14} durationInFrames={V11SCENE14_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene15" component={V11Scene15} durationInFrames={V11SCENE15_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene16" component={V11Scene16} durationInFrames={V11SCENE16_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene17" component={V11Scene17} durationInFrames={V11SCENE17_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene18" component={V11Scene18} durationInFrames={V11SCENE18_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene19" component={V11Scene19} durationInFrames={V11SCENE19_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene20" component={V11Scene20} durationInFrames={V11SCENE20_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene21" component={V11Scene21} durationInFrames={V11SCENE21_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene22" component={V11Scene22} durationInFrames={V11SCENE22_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene23" component={V11Scene23} durationInFrames={V11SCENE23_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V11Scene24" component={V11Scene24} durationInFrames={V11SCENE24_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Folder name="V10-Itaewon-Scenes">
        <Composition id="V10Scene1" component={V10Scene1} durationInFrames={V10SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene2" component={V10Scene2} durationInFrames={V10SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene3" component={V10Scene3} durationInFrames={V10SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene4" component={V10Scene4} durationInFrames={V10SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene5" component={V10Scene5} durationInFrames={V10SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene6" component={V10Scene6} durationInFrames={V10SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene7" component={V10Scene7} durationInFrames={V10SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene8" component={V10Scene8} durationInFrames={V10SCENE8_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene9" component={V10Scene9} durationInFrames={V10SCENE9_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene10" component={V10Scene10} durationInFrames={V10SCENE10_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene11" component={V10Scene11} durationInFrames={V10SCENE11_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene12" component={V10Scene12} durationInFrames={V10SCENE12_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene13" component={V10Scene13} durationInFrames={V10SCENE13_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene14" component={V10Scene14} durationInFrames={V10SCENE14_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene15" component={V10Scene15} durationInFrames={V10SCENE15_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene16" component={V10Scene16} durationInFrames={V10SCENE16_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene17" component={V10Scene17} durationInFrames={V10SCENE17_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene18" component={V10Scene18} durationInFrames={V10SCENE18_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene19" component={V10Scene19} durationInFrames={V10SCENE19_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene20" component={V10Scene20} durationInFrames={V10SCENE20_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene21" component={V10Scene21} durationInFrames={V10SCENE21_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene22" component={V10Scene22} durationInFrames={V10SCENE22_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene23" component={V10Scene23} durationInFrames={V10SCENE23_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene24" component={V10Scene24} durationInFrames={V10SCENE24_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene25" component={V10Scene25} durationInFrames={V10SCENE25_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V10Scene26" component={V10Scene26} durationInFrames={V10SCENE26_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>
      <Composition
        id="ItaewonHemNho"
        component={ItaewonHemNho}
        durationInFrames={MASTER11_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />


      <Composition
        id="ItaewonRemDap"
        component={ItaewonRemDap}
        durationInFrames={MASTER10_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      {/* The symbol vocabulary, rendered. Kept next to the videos rather than
          in a scratch file so it cannot be tidied away and lost. */}
      <Composition
        id="IconVocabularySheet"
        component={IconVocabularySheet}
        durationInFrames={ICON_SHEET_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />

      <Composition
        id="ThueGiaoDichSo9"
        component={ThueGiaoDichSo9}
        durationInFrames={MASTER9_DURATION}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />
    </>
  );
};
