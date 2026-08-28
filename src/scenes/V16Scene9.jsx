import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DiagramCanvas,DrawnPath,DrawnText} from "./visualLanguage";
export const V16SCENE9_DURATION=80;
export const V16Scene9=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE9_DURATION} shake={{at:21,len:12,mag:5}}>
    <SceneBackground variant="spotlight"/>
    <Sequence from={0} layout="none"><PunchPhrase lines={["ĐÒI NỢ","→","BẮT CÓC NHẰM CHIẾM ĐOẠT TÀI SẢN"]} top={520} fontSize={78}/></Sequence>
    <DiagramCanvas y={430} height={850}><DrawnPath d="M65 170 L480 250" delay={13} drawFrames={12} stroke="#ff6a1a" strokeWidth={18}/><DrawnPath d="M65 250 L480 170" delay={17} drawFrames={12} stroke="#ff6a1a" strokeWidth={18}/></DiagramCanvas>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;