import {AbsoluteFill, Sequence} from "remotion";
import {DocumentEvidence} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE8_DURATION=178;
export const V17Scene8=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE8_DURATION}><SceneBackground variant="card"/><CaseLabel dark>NGUỒN GIẢI THÍCH</CaseLabel>
    <DocumentEvidence name="Official-Precedent-Title" src="anle64_pdf_p1_title_focus.png" x={40} y={390} width={1000} height={610} sourceAspect={2070/630} regions={[{from:0,x:.02,y:.04,width:.96,height:.9,zoom:1}]}/>
    <Sequence from={100} layout="none"><PunchPhrase lines={["ÁN LỆ 64 / 2023 / AL"]} top={1100} left={52} right={52} fontSize={76}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;