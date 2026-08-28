import {AbsoluteFill} from "remotion";
import {BottomBar,CameraGroup,SceneBackground} from "./shared";
import {DocumentEvidence} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE5_DURATION=122;
export const V16Scene5=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE5_DURATION}>
    <SceneBackground variant="spotlight"/>
    <EvidenceTag text="TRƯA 16/01/2019" x={60} y={210}/>
    <DocumentEvidence name="Official-Noon-Demand" src="anle64_pdf_p3_noon_demand.png" x={40} y={330} width={1000} height={900} sourceAspect={2118/966} regions={[{from:28,x:.06,y:.36,width:.88,height:.43,zoom:1.02}]}/>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;