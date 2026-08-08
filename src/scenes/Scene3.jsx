import { AbsoluteFill } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, Sequence, Sfx, Support } from "./shared";

export const SCENE3_DURATION = 108;

export const Scene3 = () => {
  return (
    <AbsoluteFill name="Scene3">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={SCENE3_DURATION}>
        <SceneBackground />
        <Sequence from={0} layout="none">
          <Hero name="Hero-WorriedClient" src="el_s3_hero.png" width={680} x="50%" y={520} variant="punch" idle="tremble" visibleFor={SCENE3_DURATION} />
        </Sequence>
        <Sequence from={24} layout="none">
          <Support name="Support-Books" src="el_s3_sup_book.png" width={260} x={610} y={1300} phase={20} visibleFor={SCENE3_DURATION - 24} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      <Sequence from={71} layout="none">
        <PunchPhrase text="KHÔNG HỎI LUẬT" top={110} />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="mouseClick" volume={0.4} /></Sequence>
      <Sequence from={24} layout="none"><Sfx name="pageTurn" volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};
