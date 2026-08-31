import {AbsoluteFill, Sequence} from "remotion";
import {DocumentEvidence} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel, ReleaseLock, VerdictStrike} from "./V17Kit";
export const V17SCENE10_DURATION=173;
export const V17Scene10=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE10_DURATION} shake={{at:105,len:12,mag:6}}><SceneBackground variant="spotlight"/><CaseLabel dark>RANH GIỚI PHÁP LÝ</CaseLabel>
    <Sequence from={0} durationInFrames={94} layout="none"><DocumentEvidence name="Official-Release-Condition" src="anle64_pdf_p8_p7_release_condition.png" x={40} y={300} width={1000} height={560} sourceAspect={2824/1036} allowCrop regions={[{from:0,x:.03,y:.08,width:.94,height:.68,zoom:1.65}]}/></Sequence>
    <ReleaseLock until={94}/>
    <Sequence from={94} layout="none"><DocumentEvidence name="Official-Legal-Conclusion" src="anle64_pdf_p8_p7_actions.png" x={40} y={300} width={1000} height={650} sourceAspect={2118/1488} allowCrop regions={[{from:0,x:.03,y:.06,width:.94,height:.5,zoom:1.65}]}/></Sequence>
    <Sequence from={105} layout="none"><PunchPhrase lines={["KHÔNG CÒN","LÀ TRANH CHẤP TIỀN BẠC"]} top={1080} left={52} right={52} fontSize={72}/></Sequence>
    <VerdictStrike from={105}/>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;