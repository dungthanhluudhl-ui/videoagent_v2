import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase} from "./shared";
import {BackgroundPhoto} from "./visualLanguage";
export const V16SCENE1_DURATION=110;
export const V16Scene1=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE1_DURATION}>
    <BackgroundPhoto name="Scrap-Warehouse-Location" src="anle64_warehouse_vertical.png" durationInFrames={V16SCENE1_DURATION} focus="50% 38%" tint={.38}/>
    <Sequence from={47} layout="none"><PunchPhrase lines={["KHO PHẾ LIỆU"]} top={1180} onDark fontSize={82}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;