import {AbsoluteFill, Sequence} from "remotion";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE5_DURATION=150;
export const V17Scene5=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE5_DURATION}><SceneBackground variant="card"/><CaseLabel dark>ĐỔI VAI / PHÁN ĐOÁN</CaseLabel>
    <Sequence from={30} layout="none"><PunchPhrase lines={["VẬY TẠI SAO","LẠI LÀ BẮT CÓC?"]} top={500} left={62} right={62} fontSize={92}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;