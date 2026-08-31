import {AbsoluteFill, Sequence} from "remotion";
import {DiagramCanvas} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel, CoercedCallDiagram} from "./V17Kit";
export const V17SCENE3_DURATION=236;
export const V17Scene3=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE3_DURATION}><SceneBackground variant="card"/><CaseLabel>ÁP LỰC → GIA ĐÌNH</CaseLabel>
    <DiagramCanvas y={250} height={950}><CoercedCallDiagram/></DiagramCanvas>
    <Sequence from={65} layout="none"><PunchPhrase lines={["150 TRIỆU","ĐỂ ĐƯỢC THẢ"]} top={1120} left={72} right={72} fontSize={82}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;