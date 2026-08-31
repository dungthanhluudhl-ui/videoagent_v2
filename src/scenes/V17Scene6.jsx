import {AbsoluteFill, Sequence} from "remotion";
import {DocumentEvidence} from "./visualLanguage";
import {BottomBar, CameraGroup, ImpactFlash, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE6_DURATION=128;
export const V17Scene6=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE6_DURATION} shake={{at:45,len:14,mag:8}}><SceneBackground variant="card"/><CaseLabel>KHOẢN VAY 150.000.000Đ</CaseLabel>
    <DocumentEvidence name="Official-Real-Debt-Record" src="anle64_pdf_p2_real_debt.png" x={40} y={340} width={1000} height={650} sourceAspect={2118/831} allowCrop regions={[{from:0,x:.03,y:.05,width:.94,height:.5,zoom:1.7}]}/>
    <Sequence from={45} layout="none"><PunchPhrase lines={["NỢ THẬT"]} top={1080} left={120} right={120} fontSize={112}/><ImpactFlash x={540} y={1120}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;