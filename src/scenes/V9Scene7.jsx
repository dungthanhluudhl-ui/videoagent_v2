import { AbsoluteFill } from "remotion";
import {
  BottomBar,
  CameraGroup,
  FlowArrow,
  ImpactFlash,
  PunchPhrase,
  SceneBackground,
  Sequence,
  Sfx,
  Support,
} from "./shared";

export const V9SCENE7_DURATION = 338;

// Bespoke, not FlowDiagramScene - visualTransformation is "two DATA
// SOURCES (bank + tax) converge into one detection," a 2-into-1 topology
// the template's fixed left<->right single-arrow layout can't express.
// The rapid-fire top row (3x the same money icon, no individual anchors -
// pure mood/texture standing in for "tần suất cao") builds the frequency
// idea before the two data streams even enter. See SKILL.md step 2b.
export const V9Scene7 = () => {
  return (
    <AbsoluteFill name="V9Scene7">
      <CameraGroup
        zoom={{ from: 1, to: 1.08 }}
        durationInFrames={V9SCENE7_DURATION}
        shake={{ at: 295, len: 14, mag: 8 }}
      >
        <SceneBackground variant="chart" />

        {/* "tần suất cao" - three of the same transfer icon standing in for
            rapid repeated transactions, no individual word anchor (mood). */}
        <Sequence from={0} layout="none">
          <Support name="Support-Burst1" src="el9_money_icon.png" width={150} x={220} y={260} idle="tremble" phase={0} visibleFor={V9SCENE7_DURATION} />
        </Sequence>
        <Sequence from={10} layout="none">
          <Support name="Support-Burst2" src="el9_money_icon.png" width={150} x={470} y={230} idle="tremble" phase={7} visibleFor={V9SCENE7_DURATION - 10} />
        </Sequence>
        <Sequence from={20} layout="none">
          <Support name="Support-Burst3" src="el9_money_icon.png" width={150} x={720} y={270} idle="tremble" phase={14} visibleFor={V9SCENE7_DURATION - 20} />
        </Sequence>

        {/* anchor: "ngân hàng" @ local frame 254 (beat_sync.py verified) */}
        <Sequence from={254} layout="none">
          <Support name="Support-BankData" src="el9_bank_icon.png" width={230} x={170} y={870} idle="sway" visibleFor={V9SCENE7_DURATION - 254} />
        </Sequence>
        {/* anchor: "và thuế" @ local frame 264 (beat_sync.py verified) */}
        <Sequence from={264} layout="none">
          <Support name="Support-TaxData" src="el9_tax_icon.png" width={230} x={680} y={870} idle="sway" visibleFor={V9SCENE7_DURATION - 264} />
        </Sequence>

        <Sequence from={280} layout="none">
          <FlowArrow d="M 280,900 Q 420,1080 500,1180" delay={0} length={500} drawFrames={16} />
        </Sequence>
        <Sequence from={280} layout="none">
          <FlowArrow d="M 800,900 Q 640,1080 580,1180" delay={0} length={500} drawFrames={16} />
        </Sequence>

        {/* anchor: "quét ra ngay" @ local frame 295 (beat_sync.py verified) - the climax */}
        <Sequence from={295} layout="none">
          <Support name="Support-AlertFlag" src="el9_alert_flag.png" width={220} x={420} y={1180} idle="bob" visibleFor={V9SCENE7_DURATION - 295} />
        </Sequence>
        <ImpactFlash x={540} y={1220} delay={295} size={220} />
      </CameraGroup>
      <BottomBar />
      {/* anchor: "quét ra ngay" @ 295 - punch overlaps the flag's landing,
          48f dwell before the cut to S8a at 338. top=420 sits in the empty
          gap between the burst-icon row (ends ~320) and the bank/tax data
          row (starts 870) - top=180 originally collided directly with the
          burst icons, caught only by rendering a still, not by
          check_overlap.py (PunchPhrase is intentionally exempt from that
          check, same as Captions). */}
      <Sequence from={290} layout="none">
        <PunchPhrase lines={["TỰ ĐỘNG QUÉT RA NGAY!"]} top={420} stagger />
      </Sequence>
      <Sequence from={0} layout="none"><Sfx name="whoosh" volume={0.35} /></Sequence>
      <Sequence from={254} layout="none"><Sfx name="switchClick" volume={0.4} /></Sequence>
      <Sequence from={295} layout="none"><Sfx name="whip" volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
