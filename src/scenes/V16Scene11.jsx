import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,EditorialHero,PunchPhrase,SceneBackground} from "./shared";
import {DocumentEvidence} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE11_DURATION=186;
export const V16Scene11=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE11_DURATION} pan={{from:{x:0,y:0},to:{x:-8,y:-12}}}>
    <SceneBackground variant="spotlight"/>
    <EvidenceTag text="NHẬN ĐỊNH CỦA TÒA ÁN" x={40} y={175}/>
    <DocumentEvidence name="Official-Coercive-Actions" src="anle64_pdf_p8_p7_actions.png" x={40} y={270} width={1000} height={850} sourceAspect={2118/1488} regions={[{from:32,x:.03,y:.03,width:.94,height:.36,zoom:1.05},{from:76,x:.03,y:.35,width:.94,height:.42,zoom:1.05}]}/>
    <Sequence from={22} layout="none"><PunchPhrase lines={["NỢ THẬT","KHÔNG HỢP PHÁP HÓA BẠO LỰC"]} top={1210} left={55} right={55} fontSize={61}/></Sequence>
    <Sequence from={95} layout="none"><EditorialHero name="Coercion-Subject" src="anle64_victim_restrained_seated.png" width={430} x={650} y={780} variant="rise" visibleFor={91}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;