import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DocumentEvidence} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE10_DURATION=178;
export const V16Scene10=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE10_DURATION}>
    <SceneBackground variant="card"/>
    <EvidenceTag text="HỘI ĐỒNG THẨM PHÁN TANDTC" x={40} y={170}/>
    <DocumentEvidence name="Official-Precedent-Title" src="anle64_pdf_p1_title_focus.png" x={40} y={430} width={1000} height={590} sourceAspect={2070/630} regions={[{from:100,x:.02,y:.04,width:.96,height:.9,zoom:1}]}/>
    <Sequence from={45} layout="none"><PunchPhrase lines={["ÁN LỆ 64 / 2023"]} top={250} left={110} right={110} fontSize={86}/></Sequence>
    <Sequence from={101} layout="none"><DocumentEvidence name="Official-Precedent-Authority" src="anle64_pdf_p1_authority.png" x={80} y={860} width={920} height={390} sourceAspect={1380/868} regions={[{from:0,x:0,y:0,width:1,height:1,zoom:1}]}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;