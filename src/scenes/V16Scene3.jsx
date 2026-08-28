import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,EditorialHero,PunchPhrase,SceneBackground} from "./shared";
import {DiagramCanvas,DrawnPath,DrawnText} from "./visualLanguage";
export const V16SCENE3_DURATION=129;
export const V16Scene3=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE3_DURATION}>
    <SceneBackground variant="card"/>
    <Sequence from={0} layout="none"><EditorialHero name="Compelled-Caller" src="anle64_victim_phone_under_duress.png" width={650} x={-80} y={330} visibleFor={129}/></Sequence>
    <Sequence from={18} layout="none"><PunchPhrase lines={["ÁP LỰC ĐI QUA CUỘC GỌI"]} top={190} left={310} fontSize={70}/></Sequence>
    <DiagramCanvas y={260} height={1180}>
      <DrawnPath d="M520 620 C690 500 760 590 910 470" delay={42} stroke="#ff6a1a" strokeWidth={10}/>
      <DrawnPath d="M600 690 C760 610 830 690 990 570" delay={50} stroke="#ff6a1a" strokeWidth={6}/>
      <DrawnText x={760} y={420} delay={58} fontSize={48} fontWeight={900} fill="#141414" plate>GIA ĐÌNH</DrawnText>
      <path d="M785 520 L875 450 L965 520 V650 H785 Z" fill="none" stroke="#141414" strokeWidth="7"/>
    </DiagramCanvas>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;