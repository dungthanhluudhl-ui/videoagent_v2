import {AbsoluteFill, Sequence} from "remotion";
import {DiagramCanvas} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel, ClassificationShift} from "./V17Kit";
export const V17SCENE7_DURATION=235;
export const V17Scene7=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE7_DURATION}><SceneBackground variant="chart"/><CaseLabel>PHÂN LOẠI HÀNH VI</CaseLabel>
    <DiagramCanvas y={270} height={920}><ClassificationShift/></DiagramCanvas>
    <Sequence from={165} layout="none"><PunchPhrase lines={["BẮT CÓC","NHẰM CHIẾM ĐOẠT"]} top={1120} left={54} right={54} fontSize={80}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;