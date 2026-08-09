import { Composition, Folder } from "remotion";
import { LuatSuDaoDuc, LUATSU_CANVAS, LUATSU_TOTAL_FRAMES } from "./LuatSuDaoDuc";
import { Scene1, SCENE1_DURATION } from "./scenes/Scene1";
import { Scene2, SCENE2_DURATION } from "./scenes/Scene2";
import { Scene3, SCENE3_DURATION } from "./scenes/Scene3";
import { Scene4, SCENE4_DURATION } from "./scenes/Scene4";

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="LuatSu-Scenes">
        <Composition id="Scene1" component={Scene1} durationInFrames={SCENE1_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene2" component={Scene2} durationInFrames={SCENE2_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene3" component={Scene3} durationInFrames={SCENE3_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
        <Composition id="Scene4" component={Scene4} durationInFrames={SCENE4_DURATION} fps={LUATSU_CANVAS.fps} width={LUATSU_CANVAS.width} height={LUATSU_CANVAS.height} />
      </Folder>
      <Composition
        id="LuatSuDaoDuc"
        component={LuatSuDaoDuc}
        durationInFrames={LUATSU_TOTAL_FRAMES}
        fps={LUATSU_CANVAS.fps}
        width={LUATSU_CANVAS.width}
        height={LUATSU_CANVAS.height}
      />
    </>
  );
};
