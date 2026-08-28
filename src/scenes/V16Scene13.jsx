import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DocumentEvidence} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE13_DURATION=95;
export const V16Scene13=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE13_DURATION}>
    <SceneBackground variant="spotlight"/>
    <EvidenceTag text="RANH GIỚI PHÁP LÝ" x={40} y={180}/>
    <DocumentEvidence name="Official-Legal-Conclusion" src="anle64_pdf_p8_p7_conclusion.png" x={40} y={300} width={1000} height={620} sourceAspect={2824/948} regions={[{from:41,x:.02,y:.05,width:.96,height:.88,zoom:1}]}/>
    <Sequence from={12} layout="none"><PunchPhrase lines={["KHÔNG CÒN LÀ","TRANH CHẤP TIỀN BẠC"]} top={1050} fontSize={76}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;