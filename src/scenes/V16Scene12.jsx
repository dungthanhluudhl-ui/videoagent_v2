import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DiagramCanvas,DocumentEvidence,DrawnPath,DrawnText} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE12_DURATION=95;
export const V16Scene12=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE12_DURATION}>
    <SceneBackground variant="chart"/>
    <EvidenceTag text="ĐIỀU KIỆN THẢ NGƯỜI" x={40} y={170}/>
    <DocumentEvidence name="Official-Release-Condition" src="anle64_pdf_p8_p7_release_condition.png" x={40} y={280} width={1000} height={600} sourceAspect={2824/1036} regions={[{from:17,x:.02,y:.05,width:.96,height:.88,zoom:1}]}/>
    <DiagramCanvas y={870} height={310}><DrawnText x={110} y={180} delay={27} fontSize={54} fontWeight={900} fill="#141414">GIAO TIỀN</DrawnText><DrawnPath d="M400 160 H700" delay={27} stroke="#ff6a1a" strokeWidth={12}/><DrawnText x={720} y={180} delay={42} fontSize={54} fontWeight={900} fill="#141414">THẢ NGƯỜI</DrawnText></DiagramCanvas>
    <Sequence from={27} layout="none"><PunchPhrase lines={["GIAO TIỀN → MỚI THẢ NGƯỜI"]} top={1190} fontSize={62}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;