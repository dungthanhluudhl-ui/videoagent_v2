import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {TextLine, TextStack, useTypographyCollisionGuard} from './VietnameseTextStack';
import {cueProgress, cueStartFrame, NarrationCue} from './NarrationCues';

const FPS = 30;
const cue = (id: string, sceneId: string, startMs: number, endMs: number): NarrationCue => ({id, sceneId, text: id, startMs, endMs});
const CUES: Record<string, NarrationCue> = {
  'S01-CUE-HOOK': cue('S01-CUE-HOOK', 'S01', 220, 1250),
  'S01-CUE-XANG-GIAM': cue('S01-CUE-XANG-GIAM', 'S01', 7710, 8820),
  'S02-CUE-PHO': cue('S02-CUE-PHO', 'S02', 12230, 13730),
  'S02-CUE-TWO-CHAINS': cue('S02-CUE-TWO-CHAINS', 'S02', 15090, 16330),
  'S02-CUE-USD': cue('S02-CUE-USD', 'S02', 16440, 17330),
  'S02-CUE-OIL': cue('S02-CUE-OIL', 'S02', 17810, 18470),
  'S02-CUE-IMPORT': cue('S02-CUE-IMPORT', 'S02', 19270, 20120),
  'S02-CUE-DOLLAR': cue('S02-CUE-DOLLAR', 'S02', 20520, 21780),
  'S03-CUE-RATE': cue('S03-CUE-RATE', 'S03', 22780, 23700),
  'S03-CUE-WORLD-OIL': cue('S03-CUE-WORLD-OIL', 'S03', 24160, 25310),
  'S03-CUE-TRANSPORT': cue('S03-CUE-TRANSPORT', 'S03', 25860, 27210),
  'S03-CUE-SURGE': cue('S03-CUE-SURGE', 'S03', 27210, 28030),
  'S04-CUE-LINK': cue('S04-CUE-LINK', 'S04', 28600, 29400),
  'S04-CUE-NOODLES': cue('S04-CUE-NOODLES', 'S04', 31680, 32160),
  'S04-CUE-BEEF': cue('S04-CUE-BEEF', 'S04', 32360, 32880),
  'S04-CUE-HERBS': cue('S04-CUE-HERBS', 'S04', 33000, 33440),
  'S04-CUE-TRUCK': cue('S04-CUE-TRUCK', 'S04', 34080, 35380),
  'S05-CUE-LINK': cue('S05-CUE-LINK', 'S05', 42300, 43100),
  'S05-CUE-ELECTRIC': cue('S05-CUE-ELECTRIC', 'S05', 44720, 45120),
  'S05-CUE-GAS': cue('S05-CUE-GAS', 'S05', 45310, 46260),
  'S05-CUE-RENT': cue('S05-CUE-RENT', 'S05', 46860, 47770),
  'S05-CUE-LABOR': cue('S05-CUE-LABOR', 'S05', 47990, 48910),
  'S05-CUE-RISE': cue('S05-CUE-RISE', 'S05', 48930, 49970),
  'S06-CUE-QUESTION': cue('S06-CUE-QUESTION', 'S06', 55480, 56480),
  'S06-CUE-STICKY': cue('S06-CUE-STICKY', 'S06', 59720, 60380),
  'S07-CUE-NEW-LEVEL': cue('S07-CUE-NEW-LEVEL', 'S06', 61460, 63140),
  'S07-CUE-COSTS': cue('S07-CUE-COSTS', 'S07', 63630, 65870),
  'S07-CUE-NOT-DROP': cue('S07-CUE-NOT-DROP', 'S07', 65890, 67290),
  'S07-CUE-PRICE-LEVEL': cue('S07-CUE-PRICE-LEVEL', 'S07', 69210, 70010),
  'S07-CUE-BLOCKED': cue('S07-CUE-BLOCKED', 'S07', 70430, 71770),
  'S08-CUE-INFLATION': cue('S08-CUE-INFLATION', 'S08', 72920, 74800),
  'S08-CUE-CTA': cue('S08-CUE-CTA', 'S08', 76510, 77960),
};

const TRANSITION_TOKENS = ['TRANSITION-S01', 'TRANSITION-S02', 'TRANSITION-S03', 'TRANSITION-S04', 'TRANSITION-S05', 'TRANSITION-S06', 'TRANSITION-S07', 'TRANSITION-S08'];
void TRANSITION_TOKENS;

const cueP = (frame: number, sceneStartMs: number, cueId: string, durationMs = 900, offsetMs = -90) =>
  cueProgress({frame, fps: FPS, cue: CUES[cueId], sceneStartMs, durationMs, offsetMs});

const C = {blue: '#1466e0', yellow: '#f4d638', red: '#e03635', ink: '#101a24', cream: '#f8f4ea'};

const A = {
  bgPho: 'assets/production/bg-pho-economy.jpeg',
  pho: 'assets/production/cut-pho.png',
  oil: 'assets/production/cut-oil-barrel.png',
  usd: 'assets/production/cut-usd.png',
  vnd: 'assets/production/cut-vnd.png',
  news: 'assets/production/cut-news.png',
  highway: 'assets/production/bg-highway.jpeg',
  nozzle: 'assets/production/cut-fuel-nozzle.png',
  truck: 'assets/production/cut-truck.png',
  herbs: 'assets/production/cut-herbs.png',
  noodles: 'assets/production/cut-noodles.png',
  beef: 'assets/production/cut-beef.png',
  kitchen: 'assets/production/bg-kitchen.jpeg',
  gas: 'assets/production/cut-gas.png',
  meter: 'assets/production/cut-meter.png',
  notebook: 'assets/production/cut-notebook.png',
  wallet: 'assets/production/cut-wallet.png',
  locked: 'assets/production/bg-locked-price.jpeg',
  padlock: 'assets/production/cut-padlock.png',
  gear: 'assets/production/cut-gear.png',
  board: 'assets/production/cut-price-board.png',
  stamp: 'assets/production/cut-stamp.png',
  restaurant: 'assets/production/bg-restaurant.jpeg',
  audio: 'audio/narration.wav',
} as const;

const enter = (frame: number, start = 0, duration = 30) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });

const Background: React.FC<{src: string; scale?: number; shade?: number}> = ({src, scale = 1.035, shade = 0.2}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 360], [1, scale], {extrapolateRight: 'clamp'});
  return <>
    <Img src={staticFile(src)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
    <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(4,9,14,.82) 0%, rgba(4,9,14,.22) 34%, rgba(4,9,14,${shade}) 100%)`}} />
  </>;
};

const Heading: React.FC<{scene: string; token: string; kicker: string; lines: string[]; p?: number; y?: number}> = ({scene, token, kicker, lines, p = 1, y = 48}) => {
  const ref = useTypographyCollisionGuard({sceneId: scene, canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 36, right: 36, top: 36, bottom: 108}});
  return <AbsoluteFill ref={ref} data-native-id={token} style={{pointerEvents: 'none'}}>
    <TextStack gap={12} style={{position: 'absolute', left: 42, right: 42, top: y, opacity: p, transform: `translateY(${18 * (1 - p)}px)`}}>
      <TextLine label={`${scene}-kicker`} style={{fontFamily: 'Arial, sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: .4, color: C.yellow}}>{kicker}</TextLine>
      {lines.map((line, i) => <TextLine key={line} label={`${scene}-headline-${i}`} style={{fontFamily: 'Arial, sans-serif', fontSize: 46, fontWeight: 900, letterSpacing: -.7, lineHeight: 1.12, color: C.cream, textShadow: '0 2px 2px rgba(0,0,0,.4)'}}>{line}</TextLine>)}
    </TextStack>
  </AbsoluteFill>;
};

const Badge: React.FC<{label: string; children: React.ReactNode; x: number; y: number; red?: boolean; p?: number}> = ({label, children, x, y, red, p = 1}) => (
  <div data-safe-label={label} data-layout-label={label} data-min-gap="10" style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${.9 + .1 * p})`, opacity: p, background: red ? C.red : C.yellow, color: red ? C.cream : C.ink, borderRadius: 7, padding: '8px 13px', fontFamily: 'Arial, sans-serif', fontSize: 16, fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,.18)'}}>{children}</div>
);

const Cutout: React.FC<{src: string; style: React.CSSProperties; p?: number}> = ({src, style, p = 1}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', objectFit: 'contain', opacity: p, filter: 'drop-shadow(0 9px 10px rgba(0,0,0,.24))', ...style}} />
);

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const p = cueP(frame, 0, 'S01-CUE-HOOK');
  const contrast = cueP(frame, 0, 'S01-CUE-XANG-GIAM');
  return <AbsoluteFill style={{background: C.ink}}>
    <Background src={A.bgPho} scale={1.045} shade={0.06} />
    <Heading scene="S01" token="TXT-HOOK-QUESTION" kicker="NGHỊCH LÝ BUỔI SÁNG" lines={['XĂNG GIẢM,', 'SAO PHỞ', 'KHÔNG GIẢM?']} p={p} />
    <div style={{position: 'absolute', left: 42, top: 310, width: 9, height: 170, background: C.red, transformOrigin: 'top', transform: `scaleY(${contrast})`}} />
  </AbsoluteFill>;
};

export const Scene02: React.FC = () => {
  const frame = useCurrentFrame();
  const pho = cueP(frame, 12230, 'S02-CUE-PHO');
  const title = cueP(frame, 12230, 'S02-CUE-TWO-CHAINS');
  const usd = cueP(frame, 12230, 'S02-CUE-USD');
  const oil = cueP(frame, 12230, 'S02-CUE-OIL');
  const news = cueP(frame, 12230, 'S02-CUE-IMPORT');
  const chain = cueP(frame, 12230, 'S02-CUE-DOLLAR');
  const ref = useTypographyCollisionGuard({sceneId: 'S02', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 30, right: 30, top: 32, bottom: 100}});
  return <AbsoluteFill ref={ref} style={{background: C.blue}}>
    <Heading scene="S02" token="TXT-TWO-CHAINS" kicker="BÁT PHỞ CHỊU" lines={['2 CHUỖI', 'GỢN SÓNG']} p={title} />
    <Cutout src={A.pho} p={pho} style={{width: 250, height: 250, left: 145 - 42 * (1 - pho), top: 205}} />
    <Cutout src={A.oil} p={oil} style={{width: 190, height: 280, right: 40 - 42 * (1 - oil), top: 205}} />
    <Cutout src={A.usd} p={usd} style={{width: 255, height: 120, left: 34 - 42 * (1 - usd), top: 500}} />
    <Cutout src={A.vnd} p={usd} style={{width: 210, height: 150, right: 35 - 42 * (1 - usd), top: 505}} />
    <Cutout src={A.news} p={news} style={{width: 430, height: 150, left: 55, top: 700}} />
    <div data-native-id="ANN-CHAIN-LINES" style={{position: 'absolute', inset: 0}}>
      <svg width="540" height="960"><path d="M145 620 C180 665 205 690 260 720 M395 650 C360 680 330 700 280 720" fill="none" stroke={C.red} strokeWidth="8" strokeLinecap="round" strokeDasharray="220" strokeDashoffset={220 * (1 - chain)} /></svg>
    </div>
    <Badge label="S02-usd-label" x={145} y={640} p={usd}>TỶ GIÁ USD</Badge>
    <Badge label="S02-oil-label" x={395} y={675} p={oil}>GIÁ XĂNG DẦU</Badge>
  </AbsoluteFill>;
};

export const Scene03: React.FC = () => {
  const frame = useCurrentFrame();
  const rate = cueP(frame, 22210, 'S03-CUE-RATE');
  const oil = cueP(frame, 22210, 'S03-CUE-WORLD-OIL');
  const transport = cueP(frame, 22210, 'S03-CUE-TRANSPORT');
  const surge = cueP(frame, 22210, 'S03-CUE-SURGE');
  const ref = useTypographyCollisionGuard({sceneId: 'S03', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 32, right: 32, top: 32, bottom: 110}});
  return <AbsoluteFill ref={ref} style={{background: C.ink}}>
    <Background src={A.highway} scale={1.04} shade={0.18} />
    <Heading scene="S03" token="ANN-UPWARD-CHAIN" kicker="TỪ THẾ GIỚI ĐẾN ĐẦU NGÕ" lines={['USD ↑', 'DẦU ↑', 'VẬN TẢI ↑']} p={rate} />
    <Cutout src={A.truck} p={transport} style={{width: 220, height: 160, right: -20 + 48 * transport, top: 550}} />
    <Cutout src={A.nozzle} p={oil} style={{width: 260, height: 170, left: -40 + 28 * oil, top: 700, transform: 'rotate(-8deg)'}} />
    <svg width="540" height="960" style={{position: 'absolute', inset: 0}}><path d="M70 440 L190 390 L320 430 L462 340" fill="none" stroke={C.red} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="520" strokeDashoffset={520 * (1 - transport)} /><path d="M462 340 L438 346 L454 365 Z" fill={C.red} opacity={surge} /></svg>
  </AbsoluteFill>;
};

export const Scene04: React.FC = () => {
  const frame = useCurrentFrame();
  const p = cueP(frame, 28600, 'S04-CUE-LINK');
  const noodles = cueP(frame, 28600, 'S04-CUE-NOODLES');
  const beef = cueP(frame, 28600, 'S04-CUE-BEEF');
  const herbs = cueP(frame, 28600, 'S04-CUE-HERBS');
  const truck = cueP(frame, 28600, 'S04-CUE-TRUCK');
  const truckStart = cueStartFrame(CUES['S04-CUE-TRUCK'], FPS, 28600, -90);
  const travel = interpolate(frame, [truckStart, truckStart + 240], [0, 390], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const ref = useTypographyCollisionGuard({sceneId: 'S04', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 30, right: 30, top: 32, bottom: 106}});
  return <AbsoluteFill ref={ref} style={{background: `linear-gradient(#0b2b57, ${C.blue})`}}>
    <Heading scene="S04" token="TXT-LINK-01" kicker="MẮT XÍCH 01" lines={['CƯỚC', 'VẬN CHUYỂN']} p={p} />
    <div data-native-id="ANN-SUPPLY-ROUTE" style={{position: 'absolute', left: 266, top: 300, width: 8, height: 520, background: C.yellow, transformOrigin: 'top', transform: `scaleY(${p})`}} />
    <Cutout src={A.truck} p={truck} style={{width: 170, height: 130, left: 185, top: 275 + travel, zIndex: 3}} />
    <Cutout src={A.herbs} p={herbs} style={{width: 185, height: 200, right: 18, top: 335}} />
    <Cutout src={A.noodles} p={noodles} style={{width: 210, height: 170, left: 18, top: 545}} />
    <Cutout src={A.beef} p={beef} style={{width: 195, height: 145, right: 18, top: 670}} />
  </AbsoluteFill>;
};

export const Scene05: React.FC = () => {
  const frame = useCurrentFrame();
  const p = cueP(frame, 42300, 'S05-CUE-LINK');
  const electric = cueP(frame, 42300, 'S05-CUE-ELECTRIC');
  const gas = cueP(frame, 42300, 'S05-CUE-GAS');
  const rent = cueP(frame, 42300, 'S05-CUE-RENT');
  const labor = cueP(frame, 42300, 'S05-CUE-LABOR');
  const rise = cueP(frame, 42300, 'S05-CUE-RISE');
  const ref = useTypographyCollisionGuard({sceneId: 'S05', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 30, right: 30, top: 32, bottom: 105}});
  return <AbsoluteFill ref={ref} style={{background: C.ink}}>
    <Background src={A.kitchen} scale={1.025} shade={0.38} />
    <Heading scene="S05" token="TXT-LINK-02" kicker="MẮT XÍCH 02" lines={['CHI PHÍ', 'DUY TRÌ']} p={p} />
    <div data-native-id="ANN-COST-LABELS">
      <Cutout src={A.gas} p={gas} style={{width: 160, height: 320, left: 35, top: 285, transform: `scale(${1.14 - .14 * gas})`}} />
      <Cutout src={A.meter} p={electric} style={{width: 175, height: 245, right: 45, top: 300, transform: `scale(${1.14 - .14 * electric})`}} />
      <Cutout src={A.notebook} p={rent} style={{width: 210, height: 300, left: 35, top: 590, transform: `scale(${1.14 - .14 * rent})`}} />
      <Cutout src={A.wallet} p={labor} style={{width: 215, height: 190, right: 35, top: 650, transform: `scale(${1.14 - .14 * labor})`}} />
      <Badge label="S05-gas" x={115} y={585} p={gas}>GAS</Badge>
      <Badge label="S05-electric" x={410} y={555} p={electric}>ĐIỆN</Badge>
      <Badge label="S05-ledger" x={145} y={825} p={rent}>MẶT BẰNG</Badge>
      <Badge label="S05-money" x={410} y={820} p={labor}>NHÂN CÔNG</Badge>
      <div style={{position: 'absolute', left: 46, right: 46, top: 892, height: 7, background: C.red, transformOrigin: 'left', transform: `scaleX(${rise})`}} />
    </div>
  </AbsoluteFill>;
};

export const Scene06: React.FC = () => {
  const frame = useCurrentFrame();
  const question = cueP(frame, 55480, 'S06-CUE-QUESTION');
  const p = cueP(frame, 55480, 'S06-CUE-STICKY');
  const ref = useTypographyCollisionGuard({sceneId: 'S06', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 32, right: 32, top: 32, bottom: 105}});
  return <AbsoluteFill ref={ref} style={{background: C.ink}}>
    <Background src={A.locked} scale={1.05} shade={0.18} />
    <Heading scene="S06" token="TXT-STICKY-PRICES" kicker="KINH TẾ HỌC GỌI LÀ" lines={['TÍNH CỨNG', 'CỦA GIÁ CẢ']} p={p} />
    <Badge label="S06-sticky" x={402} y={280} red p={p}>STICKY PRICES</Badge>
    <div style={{position: 'absolute', left: 40, right: 40, bottom: 92, height: 8, background: C.yellow, transformOrigin: 'left', transform: `scaleX(${question})`}} />
  </AbsoluteFill>;
};

export const Scene07: React.FC = () => {
  const frame = useCurrentFrame();
  const costs = cueP(frame, 63630, 'S07-CUE-COSTS');
  const p = cueP(frame, 63630, 'S07-CUE-NOT-DROP');
  const price = cueP(frame, 63630, 'S07-CUE-PRICE-LEVEL');
  const blocked = cueP(frame, 63630, 'S07-CUE-BLOCKED');
  const ref = useTypographyCollisionGuard({sceneId: 'S07', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 30, right: 30, top: 32, bottom: 105}});
  const rotation = interpolate(p, [0, 1], [-10, 8]);
  return <AbsoluteFill ref={ref} style={{background: 'linear-gradient(#122233,#08131d)'}}>
    <Heading scene="S07" token="ANN-BLOCKED-DOWNWARD-PATH" kicker="CƠ CHẾ KHÓA GIÁ" lines={['CHI PHÍ', 'KHÔNG GIẢM']} p={costs} />
    <Cutout src={A.padlock} p={p} style={{width: 210, height: 250, left: 32, top: 285}} />
    <Cutout src={A.gear} p={p} style={{width: 210, height: 250, right: 28, top: 280, transform: `rotate(${rotation}deg)`}} />
    <Cutout src={A.board} p={price} style={{width: 215, height: 315, left: 35, top: 585}} />
    <Cutout src={A.stamp} p={price} style={{width: 230, height: 260, right: 35, top: 625}} />
    <svg width="540" height="960" style={{position: 'absolute'}}><path d="M72 805 L180 745 L305 790 L450 675" fill="none" stroke={C.red} strokeWidth="10" strokeDasharray="520" strokeDashoffset={520 * (1 - blocked)} /><line x1="310" y1="800" x2="310" y2="655" stroke={C.yellow} strokeWidth="8" opacity={p} /></svg>
    <Badge label="S07-price-level" x={375} y={625} p={price}>MẶT BẰNG GIÁ MỚI</Badge>
  </AbsoluteFill>;
};

export const Scene08: React.FC = () => {
  const frame = useCurrentFrame();
  const p = cueP(frame, 72270, 'S08-CUE-INFLATION');
  const cta = cueP(frame, 72270, 'S08-CUE-CTA');
  const ref = useTypographyCollisionGuard({sceneId: 'S08', canvasWidth: 540, canvasHeight: 960, safeMargins: {left: 34, right: 34, top: 34, bottom: 110}});
  return <AbsoluteFill ref={ref} style={{background: C.ink}}>
    <Background src={A.restaurant} scale={1.035} shade={0.2} />
    <Heading scene="S08" token="TXT-INFLATION-CONCLUSION" kicker="KẾT LUẬN" lines={['LẠM PHÁT', 'ÂM THẦM BÀO', 'TÚI TIỀN']} p={p} />
    <div data-native-id="TXT-COMMENT-CTA" data-safe-label="S08-cta" data-layout-label="S08-cta" style={{position: 'absolute', left: 46, right: 46, top: 700, padding: '22px 20px', borderRadius: 14, background: C.yellow, color: C.ink, opacity: cta, transform: `translateY(${16 * (1 - cta)}px)`, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 29, lineHeight: 1.12}}>CHỖ BẠN,<br />PHỞ BAO NHIÊU?</div>
  </AbsoluteFill>;
};

const scenes = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08];
const starts = [0, 367, 666, 858, 1269, 1664, 1909, 2168];
const durations = [367, 299, 192, 411, 395, 245, 259, 276];

export const FullReview: React.FC = () => <AbsoluteFill style={{background: C.ink}}>
  <Audio src={staticFile(A.audio)} volume={1} />
  {scenes.map((Scene, i) => <Sequence key={i} from={starts[i]} durationInFrames={durations[i]}><Scene /></Sequence>)}
</AbsoluteFill>;

export const FullReviewHD: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
    <div style={{position: 'absolute', width: 540, height: 960, transform: 'scale(2)', transformOrigin: 'top left'}}>
      <FullReview />
    </div>
  </AbsoluteFill>
);

const checkpoint = [
  {Scene: Scene01, duration: 391, sourceStart: 0},
  {Scene: Scene03, duration: 254, sourceStart: 667},
  {Scene: Scene05, duration: 259, sourceStart: 1406},
];

export const MotionCheckpoint: React.FC = () => {
  let cursor = 0;
  return <AbsoluteFill style={{background: C.ink}}>
    {checkpoint.map(({Scene, duration, sourceStart}, i) => {
      const from = cursor;
      cursor += duration;
      return <Sequence key={i} from={from} durationInFrames={duration}>
        <Scene />
        <Audio src={staticFile(A.audio)} startFrom={sourceStart} volume={1} />
      </Sequence>;
    })}
  </AbsoluteFill>;
};
