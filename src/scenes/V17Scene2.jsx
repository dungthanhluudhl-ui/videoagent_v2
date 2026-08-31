import {AbsoluteFill, Sequence} from "remotion";
import {BottomBar, CameraGroup, EditorialHero, EditorialSupport, SceneBackground} from "./shared";
import {CaseLabel} from "./V17Kit";
export const V17SCENE2_DURATION=190;
export const V17Scene2=()=> <AbsoluteFill>
  <CameraGroup durationInFrames={V17SCENE2_DURATION}><SceneBackground variant="spotlight"/><CaseLabel>KHÔNG THỂ BỎ TRỐN</CaseLabel>
    <Sequence from={0} layout="none"><EditorialHero name="Locked-Handcuffs" src="anle64_handcuffs.png" width={760} x="50%" y={310} variant="punch" visibleFor={190}/></Sequence>
    <Sequence from={45} layout="none"><EditorialSupport name="Restraint-Rope" src="anle64_restraint_rope.png" width={670} x={205} y={900} variant="grow" visibleFor={145}/></Sequence>
  </CameraGroup><BottomBar/>
</AbsoluteFill>;