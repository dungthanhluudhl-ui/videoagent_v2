import {AbsoluteFill} from "remotion";
import {DiagramCanvas, DocumentEvidence} from "./visualLanguage";
import {BottomBar, CameraGroup, SceneBackground} from "./shared";
import {CaseLabel, CoercionBars} from "./V17Kit";
export const V17SCENE9_DURATION=203;
export const V17Scene9=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE9_DURATION}><SceneBackground variant="chart"/><CaseLabel>NỢ THẬT ≠ QUYỀN CƯỠNG ÉP</CaseLabel>
    <DocumentEvidence name="Debt-Is-Real-Clause" src="anle64_pdf_p2_real_debt.png" x={35} y={360} width={500} height={690} sourceAspect={2118/831} allowCrop regions={[{from:0,x:.03,y:.05,width:.94,height:.5,zoom:2.15}]}/>
    <DiagramCanvas y={330} height={900}><CoercionBars/></DiagramCanvas>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;