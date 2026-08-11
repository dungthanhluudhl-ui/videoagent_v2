import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  DocumentStamp,
  FlowArrow,
  Hero,
  NewspaperSpotlight,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  SpeechBubbleQuote,
  StatCounter,
  Support,
  VoxMapPin,
} from "./shared";

// ============================================================================
// TEMPLATE 1: Collage Scene (1 Hero + 2 Supports)
// ============================================================================
export const CollageScene = ({
  durationInFrames,
  hero,
  supports = [],
  punchLines,
  punchTop = 120,
  punchFrom = 60,
}) => {
  return (
    <AbsoluteFill name="CollageScene">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={durationInFrames}>
        <SceneBackground />
        
        {/* Main Hero Asset */}
        <Sequence from={0} layout="none">
          <Hero
            name={hero.name || "Hero"}
            src={hero.src}
            width={hero.width || 680}
            x={hero.x || "50%"}
            y={hero.y || 350}
            variant={hero.variant || "dropSpin"}
            visibleFor={durationInFrames}
          />
        </Sequence>

        {/* Supports */}
        {supports.map((sup, idx) => (
          <Sequence key={idx} from={sup.delay || 30 + idx * 25} layout="none">
            <Support
              name={sup.name || `Support-${idx}`}
              src={sup.src}
              width={sup.width || 300}
              x={sup.x}
              y={sup.y || 1000}
              idle={sup.idle || "sway"}
              visibleFor={durationInFrames - (sup.delay || 30)}
            />
          </Sequence>
        ))}
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={punchFrom} layout="none">
          <PunchPhrase lines={punchLines} top={punchTop} stagger />
        </Sequence>
      )}
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={30} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// TEMPLATE 2: Dual-Column Side-by-Side Comparison Layout (50/50 Split)
// ============================================================================
export const SplitCompareScene = ({
  durationInFrames,
  leftHero,
  rightHero,
  leftLabel,
  rightLabel,
  punchLines,
  punchFrom = 45,
}) => {
  return (
    <AbsoluteFill name="SplitCompareScene" style={{ overflow: "hidden" }}>
      <CameraGroup zoom={{ from: 1, to: 1.04 }} durationInFrames={durationInFrames}>
        <SceneBackground />
        
        {/* Vertical Center Dividing Line */}
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="100%" height="100%">
          <line x1="50%" y1="200" x2="50%" y2="1300" stroke="#FF6A1A" strokeWidth="4" strokeDasharray="12 12" opacity={0.6} />
        </svg>

        {/* Left Column (Centered at 25% = 270px) */}
        <Sequence from={0} layout="none">
          <Hero name={leftHero.name} src={leftHero.src} width={leftHero.width || 360} x={leftHero.x || "25%"} y={leftHero.y || 400} variant="rise" visibleFor={durationInFrames} />
          {leftLabel && (
            <div style={{ position: "absolute", left: "5%", top: 960, width: "40%", textAlign: "center", fontFamily: "BeVietnamPro", fontWeight: 900, fontSize: 34, color: "#141414", backgroundColor: "#F5F0E4", padding: "8px 12px", borderRadius: 12, border: "2px solid #FF6A1A", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {leftLabel}
            </div>
          )}
        </Sequence>

        {/* Right Column (Centered at 75% = 810px) */}
        <Sequence from={20} layout="none">
          <Hero name={rightHero.name} src={rightHero.src} width={rightHero.width || 360} x={rightHero.x || "75%"} y={rightHero.y || 400} variant="grow" visibleFor={durationInFrames - 20} />
          {rightLabel && (
            <div style={{ position: "absolute", left: "55%", top: 960, width: "40%", textAlign: "center", fontFamily: "BeVietnamPro", fontWeight: 900, fontSize: 34, color: "#141414", backgroundColor: "#F5F0E4", padding: "8px 12px", borderRadius: 12, border: "2px solid #FF6A1A", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {rightLabel}
            </div>
          )}
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={punchFrom} layout="none">
          <PunchPhrase lines={punchLines} top={120} stagger />
        </Sequence>
      )}
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={20} layout="none"><Sfx name="switchClick" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// TEMPLATE 3: Large Animated Stat Callout Scene
// ============================================================================
export const StatCalloutScene = ({
  durationInFrames,
  fromValue = 0,
  toValue = 18000,
  prefix = "",
  suffix = "",
  label = "",
  hero,
  supports = [],
  counterDelay = 10,
}) => {
  return (
    <AbsoluteFill name="StatCalloutScene">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={durationInFrames}>
        <SceneBackground />

        {/* Animated Stat Counter Header */}
        <StatCounter fromValue={fromValue} toValue={toValue} prefix={prefix} suffix={suffix} label={label} top={120} delay={counterDelay} duration={35} />

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

// ============================================================================
// TEMPLATE 4: Newspaper & Legal Document Spotlight Scene (with Stamp Option)
// ============================================================================
export const NewspaperSpotlightScene = ({
  durationInFrames,
  docSrc,
  highlightBox,
  stampText = "ĐÃ THẨM ĐỊNH",
  stampX,
  stampY,
  stampSize,
  stampDelay = 28,
  punchLines,
  hero,
}) => {
  return (
    <AbsoluteFill name="NewspaperSpotlightScene">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={durationInFrames}>
        <SceneBackground />

        <Sequence from={0} layout="none">
          <NewspaperSpotlight src={docSrc} width={680} x="50%" y={360} delay={10} highlightBox={highlightBox} />
        </Sequence>

        {/* Vintage Ink Stamp Landing */}
        {stampText && (
          <Sequence from={stampDelay} layout="none">
            {/* delay=0, not stampDelay: the Sequence above already shifts
                useCurrentFrame() to be local — passing stampDelay again here
                double-subtracts it, so DocumentStamp's own internal
                `frame - delay` needed the local frame to reach stampDelay a
                SECOND time before animating in. Invisible at the small
                default (28) since the extra wait was trivial; became a real
                bug once a real word-anchored delay (165) made the required
                wait exceed the scene's own length. */}
            <DocumentStamp text={stampText} x={stampX || "68%"} y={stampY || 480} delay={0} rot={-14} size={stampSize || 42} />
          </Sequence>
        )}

        {hero && (
          <Sequence from={25} layout="none">
            <Hero name={hero.name} src={hero.src} width={hero.width || 420} x={hero.x || "78%"} y={hero.y || 960} variant="grow" visibleFor={durationInFrames - 25} />
          </Sequence>
        )}
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={45} layout="none">
          <PunchPhrase lines={punchLines} top={120} stagger />
        </Sequence>
      )}
      <Sequence from={0} layout="none"><Sfx name="pageTurn" volume={0.45} /></Sequence>
      <Sequence from={stampDelay} layout="none"><Sfx name="switchClick" volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// TEMPLATE 5: Dialogue Quote Bubble Scene
// ============================================================================
export const QuoteBubbleScene = ({
  durationInFrames,
  quoteText,
  highlight,
  hero,
}) => {
  return (
    <AbsoluteFill name="QuoteBubbleScene">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={durationInFrames}>
        <SceneBackground />

        {/* Vintage Speech Quote Card */}
        <Sequence from={0} layout="none">
          <SpeechBubbleQuote text={quoteText} highlight={highlight} top={150} delay={10} />
        </Sequence>

        {/* Hero Cutout Below Quote */}
        {hero && (
          <Sequence from={20} layout="none">
            <Hero name={hero.name} src={hero.src} width={hero.width || 640} x={hero.x || "50%"} y={hero.y || 480} variant={hero.variant || "rise"} visibleFor={durationInFrames - 20} />
          </Sequence>
        )}
      </CameraGroup>
      <BottomBar />
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={15} layout="none"><Sfx name="ding" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// TEMPLATE 6: Flow Diagram Workflow Scene (Arrow connected elements)
// ============================================================================
export const FlowDiagramScene = ({
  durationInFrames,
  leftHero,
  rightHero,
  arrowPath = "M 320 600 Q 540 500 760 600",
  arrowDelay,
  punchLines,
  punchFrom = 60,
}) => {
  const leftDelay = leftHero.delay ?? 0;
  const rightDelay = rightHero.delay ?? 25;
  const realArrowDelay = arrowDelay ?? rightDelay + 15;
  return (
    <AbsoluteFill name="FlowDiagramScene">
      <CameraGroup zoom={{ from: 1, to: 1.05 }} durationInFrames={durationInFrames}>
        <SceneBackground />

        {/* Left Hero Element */}
        <Sequence from={leftDelay} layout="none">
          <Hero name={leftHero.name} src={leftHero.src} width={leftHero.width || 360} x={leftHero.x || "25%"} y={leftHero.y || 400} variant="rise" visibleFor={durationInFrames - leftDelay} />
        </Sequence>

        {/* Right Hero Element */}
        <Sequence from={rightDelay} layout="none">
          <Hero name={rightHero.name} src={rightHero.src} width={rightHero.width || 360} x={rightHero.x || "75%"} y={rightHero.y || 400} variant="grow" visibleFor={durationInFrames - rightDelay} />
        </Sequence>

        {/* Flow Arrow Connecting them */}
        <Sequence from={realArrowDelay} layout="none">
          {/* delay=0: the Sequence already localizes the frame — see the
              DocumentStamp fix above for why passing realArrowDelay again
              here would double it and stall the draw-on far past the scene's
              own length. */}
          <FlowArrow d={arrowPath} delay={0} length={700} />
        </Sequence>
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={punchFrom} layout="none">
          <PunchPhrase lines={punchLines} top={120} stagger />
        </Sequence>
      )}
      <Sequence from={leftDelay} layout="none"><Sfx name="whoosh" volume={0.4} /></Sequence>
      <Sequence from={realArrowDelay} layout="none"><Sfx name="whip" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

// ============================================================================
// TEMPLATE 7: Map Geographic Location Callout Scene
// ============================================================================
export const MapLocationScene = ({
  durationInFrames,
  locationName = "VIỆT NAM",
  hero,
  punchLines,
}) => {
  return (
    <AbsoluteFill name="MapLocationScene">
      <CameraGroup zoom={{ from: 1, to: 1.06 }} durationInFrames={durationInFrames}>
        <SceneBackground />

        {/* Geographic Pin Callout */}
        <Sequence from={10} layout="none">
          {/* delay=0 — see DocumentStamp fix note; same double-delay pattern */}
          <VoxMapPin locationName={locationName} x="50%" y={380} delay={0} />
        </Sequence>

        {/* Main Hero Cutout */}
        {hero && (
          <Sequence from={0} layout="none">
            <Hero name={hero.name} src={hero.src} width={hero.width || 680} x={hero.x || "50%"} y={hero.y || 480} variant={hero.variant || "rise"} visibleFor={durationInFrames} />
          </Sequence>
        )}
      </CameraGroup>
      <BottomBar />
      {punchLines && (
        <Sequence from={45} layout="none">
          <PunchPhrase lines={punchLines} top={120} stagger />
        </Sequence>
      )}
      <Sequence from={0} layout="none"><Sfx name="whip" volume={0.4} /></Sequence>
      <Sequence from={10} layout="none"><Sfx name="ding" volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};
