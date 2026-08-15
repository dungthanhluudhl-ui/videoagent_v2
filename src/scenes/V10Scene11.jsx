/**
 * S11 - Nếu tránh được thì tại sao vẫn xảy ra?
 *
 * Chuỗi mắt xích phòng ngừa tự vẽ ra rồi gãy, để lại một câu hỏi treo
 *
 * comprehensionLoad: complex - 133 frames (4.43s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: chuỗi cao 800px trong canvas 900px chỉ lấp ~60% dải khả dụng
 * (review10.json S11/composed = fail). Nay cao 980px trong canvas 1020px:
 * bán kính mắt xích lên 88 (trước 72) và bốn mắt trải từ y=300 tới 1215.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { ChainBreak, DiagramCanvas } from "./visualLanguage";

export const V10SCENE11_DURATION = 133;

export const V10Scene11 = () => (
  <AbsoluteFill name="V10Scene11">
      <SceneBackground variant="spotlight" />
      <DiagramCanvas y={250} height={1020}>
        <ChainBreak x={210} y={20} height={980} links={4} breakAt={2}
                    labels={["DỰ BÁO ĐÁM ĐÔNG", "GIỚI HẠN LỐI VÀO",
                             "ĐIỀU PHỐI TẠI CHỖ", "CỨU HỘ KỊP THỜI"]}
                    delay={0} drawFrames={10} breakDelay={72} />
      </DiagramCanvas>
      <Sequence from={88} layout="none">
        <PunchPhrase lines={["TẠI SAO?"]} top={175} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);
