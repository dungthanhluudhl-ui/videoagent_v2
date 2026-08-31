import {AbsoluteFill, Sequence} from "remotion";
import {DocumentEvidence} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE4_DURATION=149;
export const V17Scene4=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE4_DURATION}><SceneBackground variant="card"/><CaseLabel>HỒ SƠ VỤ ÁN / 16.01</CaseLabel>
    <DocumentEvidence name="Official-Noon-Money-Demand" src="anle64_pdf_p3_noon_demand.png" x={40} y={330} width={1000} height={650} sourceAspect={2118/966} allowCrop regions={[{from:0,x:.04,y:.2,width:.92,height:.58,zoom:1.72}]}/>
    <Sequence from={42} layout="none"><PunchPhrase lines={["TRƯA HÔM SAU"]} top={1070} left={80} right={80} fontSize={88}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;