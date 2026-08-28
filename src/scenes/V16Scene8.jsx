import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DiagramCanvas,DocumentEvidence,DrawnPath,DrawnText} from "./visualLanguage";
import {EvidenceTag,SteelCuff} from "./V16Kit";
export const V16SCENE8_DURATION=155;
export const V16Scene8=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE8_DURATION}>
    <SceneBackground variant="card"/>
    <EvidenceTag text="KHOẢN NỢ CÓ THẬT" x={35} y={260}/>
    <DocumentEvidence name="Authentic-Real-Debt-Premise" src="anle64_pdf_p2_real_debt.png" x={35} y={390} width={650} height={620} sourceAspect={2118/831} regions={[{from:22,x:.02,y:.05,width:.96,height:.9,zoom:1}]}/>
    <DiagramCanvas y={270} height={930}><DrawnPath d="M650 100 V840" delay={0} stroke="#141414" strokeWidth={5}/><DrawnText x={720} y={180} delay={67} fontSize={45} fontWeight={900} fill="#141414">GIỮ NGƯỜI</DrawnText></DiagramCanvas>
    <SteelCuff x={700} y={500} delay={67} scale={1.05} label="TRÁI PHÁP LUẬT"/>
    <Sequence from={67} layout="none"><PunchPhrase lines={["ĐÒI NỢ","+","GIỮ NGƯỜI?"]} top={1170} fontSize={78}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;