import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DiagramCanvas,DrawnPath,DrawnText,Timeline} from "./visualLanguage";
export const V16SCENE4_DURATION=236;
export const V16Scene4=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE4_DURATION}>
    <SceneBackground variant="chart"/>
    <DiagramCanvas y={220} height={1180}>
      <DrawnPath d="M110 700 H970" delay={0} stroke="#141414" strokeWidth={10}/>
      <DrawnPath d="M540 520 V1050" delay={8} stroke="#141414" strokeWidth={12}/>
      <DrawnPath d="M275 700 L175 960 H375 Z" delay={22} fill="#ff6a1a" stroke="#141414"/>
      <DrawnPath d="M805 700 L705 960 H905 Z" delay={38} fill="#e7e3d9" stroke="#141414"/>
      <DrawnPath d="M715 735 H920 V1015 H715 Z M775 1015 V860 H860 V1015" delay={92} stroke="#ff6a1a" strokeWidth={9}/>
    </DiagramCanvas>
    <Sequence from={59} layout="none"><PunchPhrase lines={["150 TRIỆU","↕","THẢ NGƯỜI"]} top={390} left={90} right={90} fontSize={78}/></Sequence>
    <Timeline events={[{label:"ĐÊM 15/01",sub:"vẫn bị giữ",delay:168},{label:"TRƯA 16/01",sub:"lại gọi về nhà",delay:188}]} y={1320}/>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;