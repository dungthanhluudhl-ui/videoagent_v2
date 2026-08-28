import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground,SpeechBubble} from "./shared";
import {DiagramCanvas,DrawnPath} from "./visualLanguage";
import {PaperQuestion} from "./V16Kit";
export const V16SCENE7_DURATION=128;
export const V16Scene7=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE7_DURATION}>
    <SceneBackground variant="grid"/>
    <PaperQuestion><SpeechBubble text="Ủa Lóng ơi — 150 triệu đó đúng là khoản nợ chưa trả mà?" highlight="150" side="left" x={0} y={0} stagger/></PaperQuestion>
    <DiagramCanvas y={720} height={700}><DrawnPath d="M210 300 H870 V590 H210 Z" delay={49} stroke="#141414" strokeWidth={12}/></DiagramCanvas>
    <Sequence from={49} layout="none"><PunchPhrase lines={["NỢ THẬT?"]} top={830} left={230} right={230} fontSize={108}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;