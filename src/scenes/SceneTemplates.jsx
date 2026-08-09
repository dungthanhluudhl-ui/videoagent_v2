import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  Hero,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  StatCounter,
  Support,
} from "./shared";

// Template A: Dual-Column Side-by-Side Comparison Layout (e.g., Vietnam vs World)
export const SplitCompareScene = ({
  durationInFrames,
  leftHero,
  rightHero,
  leftLabel,
  rightLabel,
  punchLines,
}) => {
  return (
    <AbsoluteFill name="SplitCompareScene">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={durationInFrames}>
        <SceneBackground />
        
        {/* Vertical Center Dividing Line */}
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="100%" height="100%">
          <line x1="50%" y1="200" x2="50%" y2="1300" stroke="#FF6A1A" strokeWidth="4" strokeDasharray="12 12" opacity={0.6} />
        </svg>

        {/* Left Column */}
        <Sequence from={0} layout="none">
          <Hero name={leftHero.name} src={leftHero.src} width={leftHero.width || 440} x="25%" y={leftHero.y || 380} variant="rise" visibleFor={durationInFrames} />
          {leftLabel && (
            <div style={{ position: "absolute", left: "10%", top: 960, width: "30%", textAlign: "center", fontFamily: "BeVietnamPro", fontWeight: 900, fontSize: 36, color: "#141414", backgroundColor: "#F5F0E4", padding: "8px 16px", borderRadius: 12, border: "2px solid #FF6A1A" }}>
              {leftLabel}
            </div>
          )}
        </Sequence>

        {/* Right Column */}
        <Sequence from={20} layout="none">
          <Hero name={rightHero.name} src={rightHero.src} width={rightHero.width || 440} x="75%" y={rightHero.y || 380} variant="grow" visibleFor={durationInFrames - 20} />
          {rightLabel && (
            <div style={{ position: "absolute", left: "60%", top: 960, width: "30%", textAlign: "center", fontFamily: "BeVietnamPro", fontWeight: 900, fontSize: 36, color: "#141414", backgroundColor: "#F5F0E4", padding: "8px 16px", borderRadius: 12, border: "2px solid #FF6A1A" }}>
              {rightLabel}
            </div>
          )}
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={45} layout="none">
          <PunchPhrase lines={punchLines} top={120} stagger />
        </Sequence>
      )}
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={20} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

// Template B: Large Animated Stat Callout Scene Layout
export const StatCalloutScene = ({
  durationInFrames,
  fromValue = 0,
  toValue = 18000,
  prefix = "",
  suffix = "",
  label = "",
  hero,
  supports = [],
}) => {
  return (
    <AbsoluteFill name="StatCalloutScene">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={durationInFrames}>
        <SceneBackground />
        
        {/* Animated Stat Counter Header */}
        <StatCounter fromValue={fromValue} toValue={toValue} prefix={prefix} suffix={suffix} label={label} top={120} delay={10} duration={35} />

        {/* Main Hero Asset */}
        {hero && (
          <Sequence from={0} layout="none">
            <Hero name={hero.name} src={hero.src} width={hero.width || 680} x={hero.x || "50%"} y={hero.y || 420} variant={hero.variant || "rise"} visibleFor={durationInFrames} />
          </Sequence>
        )}

        {/* Support Cutouts */}
        {supports.map((sup, idx) => (
          <Sequence key={idx} from={sup.delay || 30 + idx * 15} layout="none">
            <Support name={sup.name} src={sup.src} width={sup.width || 320} x={sup.x} y={sup.y} idle={sup.idle || "sway"} visibleFor={durationInFrames - (sup.delay || 30)} />
          </Sequence>
        ))}
      </CameraGroup>
      <BottomBar />
      <Sequence from={0} layout="none"><Sfx name="whip" volume={0.4} /></Sequence>
      <Sequence from={15} layout="none"><Sfx name="ding" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
