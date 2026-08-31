import {Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily, INK, ORANGE, BUBBLE_CREAM} from "./shared";

export const CaseLabel = ({children, x=56, y=184, dark=false}) => (
  <div style={{position:"absolute", left:x, top:y, padding:"10px 18px", background:dark?ORANGE:INK,
    color:dark?INK:BUBBLE_CREAM, fontFamily, fontWeight:900, fontSize:34, letterSpacing:"0.08em",
    border:`3px solid ${dark?INK:ORANGE}`, boxShadow:"7px 7px 0 rgba(255,106,26,.28)"}}>{children}</div>
);

const appear = (frame, from, travel=36) => ({
  opacity: interpolate(frame,[from,from+10],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"}),
  translate: `0 ${interpolate(frame,[from,from+14],[travel,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.back(1.2))})}px`,
});

export const CoercedCallDiagram = () => {
  const frame=useCurrentFrame();
  const line=interpolate(frame,[0,32],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const family=appear(frame,28,24);
  return <>
    <rect x={95} y={130} width={310} height={610} rx={54} fill={INK}/>
    <rect x={122} y={184} width={256} height={455} rx={24} fill="#f4efe3"/>
    <circle cx={250} cy={685} r={24} fill={ORANGE}/>
    <path d="M250 335 C430 250 610 270 800 365" fill="none" stroke={ORANGE} strokeWidth={14}
      strokeDasharray={720} strokeDashoffset={720*(1-line)} strokeLinecap="round"/>
    <polygon points="790,331 842,374 778,407" fill={ORANGE} opacity={line}/>
    <g style={family}>
      <rect x={705} y={270} width={280} height={390} rx={28} fill="#fff" stroke={INK} strokeWidth={8}/>
      <circle cx={800} cy={405} r={52} fill={INK}/><circle cx={890} cy={405} r={52} fill={INK}/>
      <path d="M730 570 Q800 470 870 570 M820 570 Q890 470 960 570" fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round"/>
    </g>
    <text x={250} y={820} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={48} fill={INK}>CUỘC GỌI BỊ ÉP</text>
    <text x={845} y={735} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={48} fill={INK}>GIA ĐÌNH</text>
  </>;
};

export const ClassificationShift = () => {
  const frame=useCurrentFrame();
  const left=appear(frame,0,60); const right=appear(frame,65,60);
  const takeover=interpolate(frame,[155,170],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.cubic)});
  return <>
    <g style={left}><rect x={70} y={160} width={430} height={480} rx={28} fill="#f6f0e3" stroke={INK} strokeWidth={8}/>
      <text x={285} y={300} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={64} fill={INK}>ĐÒI NỢ</text>
      <text x={285} y={410} textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={42} fill={INK}>LẤY LẠI TIỀN</text></g>
    <g style={right}><rect x={580} y={160} width={430} height={480} rx={28} fill="#f6f0e3" stroke={INK} strokeWidth={8}/>
      <text x={795} y={285} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={55} fill={INK}>GIỮ NGƯỜI</text>
      <text x={795} y={390} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={46} fill="#b52c20">TRÁI PHÁP LUẬT</text></g>
    <rect x={40} y={170+takeover*300} width={1000} height={240} rx={20} fill={INK} opacity={takeover}/>
    <path d="M90 750 H990" stroke={ORANGE} strokeWidth={18} strokeDasharray={900} strokeDashoffset={900*(1-takeover)}/>
  </>;
};

export const CoercionBars = () => {
  const frame=useCurrentFrame();
  const labels=["BẮT GIỮ","TRÓI","NHỐT"];
  return <>{labels.map((label,i)=>{
    const p=interpolate(frame,[75+i*18,88+i*18],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.back(1.15))});
    return <g key={label} opacity={p} transform={`translate(${(1-p)*180} 0)`}>
      <rect x={585} y={220+i*190} width={420} height={132} rx={18} fill={i===2?ORANGE:INK}/>
      <text x={795} y={307+i*190} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={58} fill={i===2?INK:"#f6f0e3"}>{label}</text>
    </g>;
  })}<path d="M540 150 V820" stroke={ORANGE} strokeWidth={12}/></>;
};

export const ReleaseLock = ({until=94}) => {
  const frame=useCurrentFrame();
  if(frame>=until)return null;
  const p=interpolate(frame,[0,18],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:80,right:80,top:960,height:210,opacity:p,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{background:INK,color:"#f6f0e3",padding:"28px 34px",fontFamily,fontWeight:900,fontSize:48}}>GIAO TIỀN</div>
    <div style={{height:16,flex:1,background:ORANGE,margin:"0 18px",position:"relative"}}><div style={{position:"absolute",right:-4,top:-22,borderLeft:`42px solid ${ORANGE}`,borderTop:"30px solid transparent",borderBottom:"30px solid transparent"}}/></div>
    <div style={{background:ORANGE,color:INK,padding:"28px 34px",fontFamily,fontWeight:900,fontSize:48}}>THẢ NGƯỜI</div>
  </div>;
};

export const VerdictStrike = ({from=105}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[from,from+14],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.cubic)});
  return <div style={{position:"absolute",left:80,top:1040,width:920,height:18,background:"#b52c20",transformOrigin:"left center",scale:`${p} 1`,rotate:"-4deg"}}/>;
};