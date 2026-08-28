import {AbsoluteFill,Sequence} from "remotion";
import {BottomBar,CameraGroup,EditorialHero} from "./shared";
import {BackgroundPhoto,DiagramCanvas,DrawnPath} from "./visualLanguage";
import {SteelCuff} from "./V16Kit";
export const V16SCENE2_DURATION=110;
export const V16Scene2=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V16SCENE2_DURATION}>
    <BackgroundPhoto name="Warehouse-Continuity" src="anle64_warehouse_vertical.png" durationInFrames={V16SCENE2_DURATION} focus="50% 38%" tint={.58}/>
    <Sequence from={10} layout="none"><EditorialHero name="Restrained-Subject" src="anle64_victim_restrained_seated.png" width={790} x={-70} y={310} variant="grow" visibleFor={100}/></Sequence>
    <DiagramCanvas y={0} height={1460}><DrawnPath d="M710 1180 C820 1110 900 1050 980 930" delay={43} stroke="#ff6a1a" strokeWidth={12}/></DiagramCanvas>
    <SteelCuff x={735} y={700} delay={43} scale={.95}/>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;