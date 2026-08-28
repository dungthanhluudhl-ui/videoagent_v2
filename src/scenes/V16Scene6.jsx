import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,PunchPhrase,SceneBackground} from "./shared";
import {DocumentEvidence,Timeline} from "./visualLanguage";
import {EvidenceTag} from "./V16Kit";
export const V16SCENE6_DURATION=177;
export const V16Scene6=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE6_DURATION}>
    <SceneBackground variant="card"/>
    <EvidenceTag text="CHUỖI HÀNH VI" x={75} y={205}/>
    <DocumentEvidence name="Continued-Pressure-Record" src="anle64_pdf_p3_pressure_continues.png" x={75} y={310} width={930} height={800} sourceAspect={1412/1328} regions={[{from:0,x:.03,y:.48,width:.94,height:.46,zoom:1.05}]}/>
    <Timeline events={[{label:"16/01",sub:"gọi + đánh",delay:34},{label:"17–18/01",sub:"giữ + ép tiền",delay:63},{label:"19/01",sub:"đe dọa",delay:92}]} y={1230}/>
    <Sequence from={119} layout="none"><div style={{position:"absolute",left:35,right:35,top:320,height:830,background:"#f5f0e4",border:"4px solid #141414",boxShadow:"0 18px 50px rgba(0,0,0,.28)"}}/><PunchPhrase lines={["NHƯNG CÓ PHẢI CHỈ LÀ ĐÒI NỢ?"]} top={570} fontSize={76}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;