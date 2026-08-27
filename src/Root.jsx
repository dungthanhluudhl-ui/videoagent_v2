import { Composition, Folder } from "remotion";
import { LuatSuDaoDuc, LUATSU_CANVAS, LUATSU_TOTAL_FRAMES } from "./LuatSuDaoDuc";
import { LuatSuDaoDuc3, MASTER3_DURATION } from "./LuatSuDaoDuc3";

import { IconVocabularySheet, ICON_SHEET_DURATION } from "./scenes/IconVocabularySheet";
import { FontMetricsProbe } from "./FontMetricsProbe";

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

// V12 = ban dung thu 3 canh (cold-start test). Cung cua so loi 0-10.32s cua
// V11/S1-S3 nhung lap ke hoach lai tu dau, tu input/scene_plan12.json.
import { V12ColdStart, V12_COLDSTART_DURATION } from "./V12ColdStart";
import { V12Scene1, V12SCENE1_DURATION } from "./scenes/V12Scene1";
import { V12Scene2, V12SCENE2_DURATION } from "./scenes/V12Scene2";
import { V12Scene3, V12SCENE3_DURATION } from "./scenes/V12Scene3";

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
// Nghiệm thu kho block (bước 2). Ngoài plan của mọi video - probe, không phải
// cảnh - nên đăng ký tay ở đây là đúng chỗ theo SKILL.md §9.
import {
  ProbeS1, ProbeS3, ProbeS6, ProbeS21, ProbeS26,
  PROBE_S1_DURATION, PROBE_S3_DURATION, PROBE_S6_DURATION,
  PROBE_S21_DURATION, PROBE_S26_DURATION,
  ProbeS2, ProbeS12, ProbeS16, ProbeS8, ProbeS25, ProbeS22,
  PROBE_S2_DURATION, PROBE_S12_DURATION, PROBE_S16_DURATION,
  PROBE_S8_DURATION, PROBE_S25_DURATION, PROBE_S22_DURATION,
  ProbeS13, ProbeS23, ProbeS14,
  PROBE_S13_DURATION, PROBE_S23_DURATION, PROBE_S14_DURATION,
} from "./blocks/BlockProbe";
// Đo chuyển giao giữa hai video: block trích từ V10 dựng nội dung của V13.
import {
  V13S1Block, V13S4Block, V13S1_BLOCK_DURATION, V13S4_BLOCK_DURATION,
} from "./blocks/V13Rebuild";
// ===== ASSEMBLE:V12 imports - khối máy sinh, đừng sửa tay =====
import { V12Master, MASTER12_DURATION } from "./V12Master";
// ===== /ASSEMBLE:V12 imports =====

// ===== ASSEMBLE:V13 imports - khối máy sinh, đừng sửa tay =====
import { V13Scene1, V13SCENE1_DURATION } from "./scenes/V13Scene1";
import { V13Scene2, V13SCENE2_DURATION } from "./scenes/V13Scene2";
import { V13Scene3, V13SCENE3_DURATION } from "./scenes/V13Scene3";
import { V13Scene4, V13SCENE4_DURATION } from "./scenes/V13Scene4";
import { V13Scene5, V13SCENE5_DURATION } from "./scenes/V13Scene5";
import { V13Scene6, V13SCENE6_DURATION } from "./scenes/V13Scene6";
import { V13Scene7, V13SCENE7_DURATION } from "./scenes/V13Scene7";
import { V13Scene8, V13SCENE8_DURATION } from "./scenes/V13Scene8";
import { V13Master, MASTER13_DURATION } from "./V13Master";
// ===== /ASSEMBLE:V13 imports =====

// ===== ASSEMBLE:V14 imports - khối máy sinh, đừng sửa tay =====
import { V14Scene1, V14SCENE1_DURATION } from "./scenes/V14Scene1";
import { V14Scene2, V14SCENE2_DURATION } from "./scenes/V14Scene2";
import { V14Scene3, V14SCENE3_DURATION } from "./scenes/V14Scene3";
import { V14Scene4, V14SCENE4_DURATION } from "./scenes/V14Scene4";
import { V14Scene5, V14SCENE5_DURATION } from "./scenes/V14Scene5";
import { V14Scene6, V14SCENE6_DURATION } from "./scenes/V14Scene6";
import { V14Scene7, V14SCENE7_DURATION } from "./scenes/V14Scene7";
import { V14Master, MASTER14_DURATION } from "./V14Master";
// ===== /ASSEMBLE:V14 imports =====

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
        <Composition id="ProbeS1" component={ProbeS1} durationInFrames={PROBE_S1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS3" component={ProbeS3} durationInFrames={PROBE_S3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS6" component={ProbeS6} durationInFrames={PROBE_S6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS21" component={ProbeS21} durationInFrames={PROBE_S21_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS26" component={ProbeS26} durationInFrames={PROBE_S26_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS2" component={ProbeS2} durationInFrames={PROBE_S2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS12" component={ProbeS12} durationInFrames={PROBE_S12_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS16" component={ProbeS16} durationInFrames={PROBE_S16_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS8" component={ProbeS8} durationInFrames={PROBE_S8_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS25" component={ProbeS25} durationInFrames={PROBE_S25_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS22" component={ProbeS22} durationInFrames={PROBE_S22_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS13" component={ProbeS13} durationInFrames={PROBE_S13_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS23" component={ProbeS23} durationInFrames={PROBE_S23_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="ProbeS14" component={ProbeS14} durationInFrames={PROBE_S14_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13S1Block" component={V13S1Block} durationInFrames={V13S1_BLOCK_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13S4Block" component={V13S4Block} durationInFrames={V13S4_BLOCK_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>

      <Folder name="V12-Coldstart-Test-Scenes">
        <Composition id="V12ColdStart" component={V12ColdStart} durationInFrames={V12_COLDSTART_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V12Scene1" component={V12Scene1} durationInFrames={V12SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V12Scene2" component={V12Scene2} durationInFrames={V12SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V12Scene3" component={V12Scene3} durationInFrames={V12SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
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

      {/* Not a picture - a measuring instrument. Rendering it prints the real
          per-character advance widths of the project font so the Python gates
          can stop estimating them. See scripts/measure_font.py. */}
      <Composition
        id="FontMetricsProbe"
        component={FontMetricsProbe}
        durationInFrames={1}
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
      {/* ===== ASSEMBLE:V12 - khối máy sinh, đừng sửa tay ===== */}
      <Composition id="V12Master" component={V12Master} durationInFrames={MASTER12_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      {/* ===== /ASSEMBLE:V12 ===== */}

      {/* ===== ASSEMBLE:V13 - khối máy sinh, đừng sửa tay ===== */}
      <Folder name="V13-Scenes">
        <Composition id="V13Scene1" component={V13Scene1} durationInFrames={V13SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene2" component={V13Scene2} durationInFrames={V13SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene3" component={V13Scene3} durationInFrames={V13SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene4" component={V13Scene4} durationInFrames={V13SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene5" component={V13Scene5} durationInFrames={V13SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene6" component={V13Scene6} durationInFrames={V13SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene7" component={V13Scene7} durationInFrames={V13SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V13Scene8" component={V13Scene8} durationInFrames={V13SCENE8_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>
      <Composition id="V13Master" component={V13Master} durationInFrames={MASTER13_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      {/* ===== /ASSEMBLE:V13 ===== */}

      {/* ===== ASSEMBLE:V14 - khối máy sinh, đừng sửa tay ===== */}
      <Folder name="V14-Scenes">
        <Composition id="V14Scene1" component={V14Scene1} durationInFrames={V14SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene2" component={V14Scene2} durationInFrames={V14SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene3" component={V14Scene3} durationInFrames={V14SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene4" component={V14Scene4} durationInFrames={V14SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene5" component={V14Scene5} durationInFrames={V14SCENE5_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene6" component={V14Scene6} durationInFrames={V14SCENE6_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="V14Scene7" component={V14Scene7} durationInFrames={V14SCENE7_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>
      <Composition id="V14Master" component={V14Master} durationInFrames={MASTER14_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      {/* ===== /ASSEMBLE:V14 ===== */}

    </>
  );
};
