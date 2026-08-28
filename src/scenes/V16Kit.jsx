import {Easing, interpolate, useCurrentFrame} from "remotion";
import {BG, INK, ORANGE, fontFamily} from "./shared";

export const CourtLabel = ({children, x=60, y=200, width=960, dark=false, delay=0, size=54}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[delay,delay+12],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.cubic)});
  return <div style={{position:"absolute",left:x,top:y,width,padding:"18px 24px",boxSizing:"border-box",background:dark?INK:BG,color:dark?BG:INK,borderLeft:`12px solid ${ORANGE}`,fontFamily,fontWeight:900,fontSize:size,lineHeight:1.18,opacity:p,transform:`translateY(${(1-p)*24}px)`,boxShadow:"0 14px 34px rgba(0,0,0,.2)"}}>{children}</div>;
};

export const EvidenceTag = ({text,x=70,y=250,delay=0}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[delay,delay+10],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:x,top:y,padding:"10px 16px",background:ORANGE,color:INK,fontFamily,fontWeight:900,fontSize:30,letterSpacing:2,opacity:p}}>NGUỒN ÁN LỆ · {text}</div>;
};

export const SteelCuff = ({x=760,y=780,delay=0,scale=1,label}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[delay,delay+16],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.back(1.5))});
  return <div style={{position:"absolute",left:x,top:y,transform:`scale(${scale*p}) rotate(${-18+18*p}deg)`,transformOrigin:"center",opacity:p}}>
    <svg width="290" height="360" viewBox="0 0 290 360">
      <defs><linearGradient id="steel" x1="0" x2="1"><stop stopColor="#4d5458"/><stop offset=".45" stopColor="#e3e6e6"/><stop offset="1" stopColor="#33383c"/></linearGradient></defs>
      <circle cx="92" cy="94" r="67" fill="none" stroke="url(#steel)" strokeWidth="25"/>
      <circle cx="198" cy="245" r="67" fill="none" stroke="url(#steel)" strokeWidth="25"/>
      <path d="M128 143 C150 167 153 181 164 194" fill="none" stroke="#b9bec0" strokeWidth="18" strokeLinecap="round"/>
      <path d="M139 151 C161 171 163 183 175 197" fill="none" stroke="#3d4448" strokeWidth="7" strokeDasharray="12 7"/>
    </svg>
    {label&&<div style={{marginTop:-20,width:290,textAlign:"center",fontFamily,fontWeight:900,fontSize:34,color:INK,background:ORANGE,padding:"8px 4px"}}>{label}</div>}
  </div>;
};

export const PaperQuestion = ({children,delay=0}) => {
  const frame=useCurrentFrame();
  const p=interpolate(frame,[delay,delay+14],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.out(Easing.back(1.2))});
  return <div style={{position:"absolute",left:70,right:70,top:360,minHeight:520,padding:"70px 58px",boxSizing:"border-box",background:"#f5f0e4",border:`4px solid ${INK}`,clipPath:"polygon(1% 3%,98% 0,100% 94%,3% 100%,0 48%)",fontFamily,fontWeight:900,fontSize:67,lineHeight:1.25,color:INK,opacity:p,transform:`rotate(${-2+2*p}deg) scale(${.9+.1*p})`,boxShadow:"16px 22px 0 rgba(20,20,20,.16)"}}>{children}</div>;
};