import { Composition, Folder } from "remotion";
import { LuatSuDaoDuc, LUATSU_CANVAS, LUATSU_TOTAL_FRAMES } from "./LuatSuDaoDuc";
import { LuatSuDaoDuc3, MASTER3_DURATION } from "./LuatSuDaoDuc3";

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
    </>
  );
};
