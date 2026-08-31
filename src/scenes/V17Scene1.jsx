import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {BackgroundPhoto} from "./visualLanguage";
import {BottomBar, CameraGroup, PunchPhrase, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE1_DURATION=158;
const FileCover=()=>{const frame=useCurrentFrame();const lift=interpolate(frame,[0,30],[0,-2000],{extrapolateRight:"clamp"});return <div style={{position:"absolute",inset:"130px 40px 160px",background:"#171717",border:"8px solid #ff6a1a",translate:`0 ${lift}px`,zIndex:3,boxShadow:"0 26px 70px rgba(0,0,0,.35)"}}><div style={{position:"absolute",left:58,top:370,color:"#f5f0e4",fontFamily:"Be Vietnam Pro",fontWeight:900,fontSize:104,lineHeight:1.05}}>HỒ SƠ<br/>CHƯA KHÉP</div><div style={{position:"absolute",left:58,right:58,top:650,height:12,background:"#ff6a1a"}}/></div>};
export const V17Scene1=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE1_DURATION}><SceneBackground variant="card"/>
    <Sequence from={30} layout="none"><BackgroundPhoto name="Scrap-Warehouse-Location" src="anle64_warehouse_vertical.png" durationInFrames={128} tint={0.5} grayscale={0.72} focus="50% 42%"/></Sequence>
    <FileCover/>
    <CaseLabel dark>HỒ SƠ / 64</CaseLabel>
    <Sequence from={0} layout="none"><PunchPhrase lines={["CHƯA DỪNG Ở ĐÓ"]} top={300} left={70} right={70} fontSize={88} onDark/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;