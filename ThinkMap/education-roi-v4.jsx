import React, { useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
  Area, AreaChart, ComposedChart,
} from "recharts";
import {
  GraduationCap, TrendingUp, Wallet, Clock, Sparkles,
  Swords, Target, Globe, ChevronDown, ChevronUp,
  BarChart2, Zap, AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */
/*  Formatting                                                          */
/* ─────────────────────────────────────────────────────────────────── */
const CUR = {
  INR:{s:"₹",fx:1}, USD:{s:"$",fx:83}, GBP:{s:"£",fx:105},
  EUR:{s:"€",fx:90}, AUD:{s:"A$",fx:55}, CAD:{s:"C$",fx:61},
};
function inr(n){
  if(n==null||isNaN(n))return"—";
  const neg=n<0; n=Math.abs(n);
  let s;
  if(n>=1e7) s="₹"+(n/1e7).toFixed(n>=1e8?1:2)+" Cr";
  else if(n>=1e5) s="₹"+(n/1e5).toFixed(n>=1e6?1:2)+" L";
  else s="₹"+Math.round(n).toLocaleString("en-IN");
  return(neg?"−":"")+s;
}
function inrS(v){
  const neg=v<0; v=Math.abs(v);
  let s;
  if(v>=1e7) s=(v/1e7).toFixed(1)+"Cr";
  else if(v>=1e5) s=(v/1e5).toFixed(0)+"L";
  else if(v>=1e3) s=(v/1e3).toFixed(0)+"k";
  else s=String(Math.round(v));
  return(neg?"−":"")+"₹"+s;
}
const pct=x=>(x==null||isNaN(x)?"—":(x*100).toFixed(1)+"%");
const yrs=v=>(v==null?"never":v<=0?"at once":v.toFixed(1)+" yrs");

/* ─────────────────────────────────────────────────────────────────── */
/*  Core math                                                           */
/* ─────────────────────────────────────────────────────────────────── */
function irrOf(arr){
  const f=r=>{let v=0;for(let t=0;t<arr.length;t++)v+=arr[t]/Math.pow(1+r,t);return v;};
  let pr=-0.9,pv=f(pr);
  for(let r=-0.85;r<=3.0001;r+=0.005){
    const v=f(r);
    if((pv<=0&&v>=0)||(pv>=0&&v<=0)){
      let lo=pr,hi=r;
      for(let i=0;i<80;i++){
        const m=(lo+hi)/2,vm=f(m);
        if(Math.abs(vm)<1){lo=hi=m;break;}
        if((f(lo)<0)===(vm<0))lo=m;else hi=m;
      }
      return(lo+hi)/2;
    }
    pr=r;pv=v;
  }
  return null;
}
function payOf(arr,start){
  let run=0,c=[];
  for(let t=0;t<arr.length;t++){run+=arr[t];c.push(run);}
  for(let t=0;t<c.length;t++){
    if(c[t]>=0){
      const prev=t===0?0:c[t-1];
      const frac=c[t]===prev?0:-prev/(c[t]-prev);
      return(t-1+frac)-start;
    }
  }
  return null;
}

/* Run ONE scenario through the engine.
   sal = success salary (INR), gPost = growth rate (decimal), prob = probability (0-1) */
function runScenario(s, sal, gPost, prob){
  const fx=s.fx||1,cv=x=>x*fx;
  const D=Math.max(0,Math.round(s.durationYears));
  const P=Math.max(0,Math.round(s.prepYears));
  const W=Math.max(1,Math.round(s.workingYears));
  const start=P+D, T=Math.min(start+W,60);
  const r=s.discountRate/100, gBase=s.baseGrowth/100;
  const costInfl=s.costInflation/100, taxR=s.taxRate/100;

  const study=cv(s.tuition+s.coaching+s.materials+s.living+s.transport+s.other);
  const prepC=cv(s.prepCostPerYear), prepI=cv(s.prepIncome), part=cv(s.studentPartTime);

  let loanable=0;
  for(let t=0;t<P;t++) loanable+=prepC*Math.pow(1+costInfl,t);
  for(let t=P;t<start;t++) loanable+=study*Math.pow(1+costInfl,t);
  const principal=loanable*(s.loanPct/100);
  let drag=0,totalInterest=0;
  if(principal>0&&s.loanRate>0&&s.loanTenure>0){
    const im=s.loanRate/100/12,n=s.loanTenure*12;
    const emi=(principal*im*Math.pow(1+im,n))/(Math.pow(1+im,n)-1);
    totalInterest=emi*n-principal; drag=totalInterest/s.loanTenure;
  }

  const inc=[]; let npv=0,pvCost=0,pvBen=0,cumN=0;
  const series=[];

  for(let t=0;t<T;t++){
    const disc=Math.pow(1+r,t);
    const ec=s.baseSalary*Math.pow(1+gBase,t);
    let dc=0,ee=0,incT;
    if(t<P){ dc=prepC*Math.pow(1+costInfl,t); ee=prepI; }
    else if(t<start){ dc=study*Math.pow(1+costInfl,t); ee=part; }
    else{
      const k=t-start;
      // probability-weighted between this scenario outcome and fallback
      const succInc=sal*Math.pow(1+gPost,k);
      const failInc=s.failSalary*Math.pow(1+gBase,k);
      const expInc=prob*succInc+(1-prob)*failInc;
      ee=taxR>0?expInc-Math.max(expInc-ec,0)*taxR:expInc;
    }
    const loanCost=t>=start&&t<start+s.loanTenure?drag:0;
    incT=t<start?(ee-dc-ec):(ee-ec-loanCost);
    inc.push(incT);
    npv+=incT/disc; cumN+=incT;
    if(t<start){ pvCost+=(dc+ec)/disc; }
    else{ pvBen+=incT/disc; }
    series.push({year:t,cum:Math.round(cumN),cumPV:Math.round(npv)});
  }

  const irr=irrOf(inc);
  const pay=payOf(inc,start);
  return{
    npv, irr,
    bcr:pvCost>0?pvBen/pvCost:null,
    paybackAfterGrad:pay,
    breakEvenYear:pay!=null?start+pay:null,
    series, T, start, D, P,
  };
}

/* Monte Carlo — run N trials sampling gPost from N(mean, sd).
   Returns per-year {p10, p25, p50, p75, p90} percentiles. */
function monteCarlo(s, sal, gPostMean, gPostSd, prob, N=300){
  const allSeries=[];
  for(let i=0;i<N;i++){
    // Box-Muller
    const u1=Math.random(),u2=Math.random();
    const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    const gPost=Math.max(-0.05, gPostMean+z*gPostSd);
    const res=runScenario(s,sal,gPost,prob);
    allSeries.push(res.series.map(r=>r.cumPV));
  }
  const T=allSeries[0].length;
  const out=[];
  for(let t=0;t<T;t++){
    const vals=allSeries.map(s=>s[t]).sort((a,b)=>a-b);
    const q=p=>vals[Math.max(0,Math.floor(p*N)-1)];
    out.push({year:t,p10:q(0.10),p25:q(0.25),p50:q(0.50),p75:q(0.75),p90:q(0.90)});
  }
  return out;
}

/* Full three-scenario + MC model for one path */
function computeFull(s){
  const fx=s.fx||1,cv=x=>x*fx;
  const start=Math.max(0,Math.round(s.prepYears))+Math.max(0,Math.round(s.durationYears));

  // three scenarios
  const pDream=s.dreamProb/100, pBase=s.baseProb/100, pWorst=s.worstProb/100;
  const dream=runScenario(s, cv(s.dreamSalary), s.dreamGrowth/100, pDream);
  const base =runScenario(s, cv(s.postSalary),  s.postGrowth/100,  pBase);
  const worst=runScenario(s, cv(s.worstSalary), s.worstGrowth/100, pWorst);

  // expected across three
  const expNpv=pDream*dream.npv+pBase*base.npv+pWorst*worst.npv;
  const expIrr=pDream*(dream.irr??0)+pBase*(base.irr??0)+pWorst*(worst.irr??0);

  // MC on the base scenario
  const mc=monteCarlo(s, cv(s.postSalary), s.postGrowth/100, s.salaryUncertainty/100, pBase);

  const studentHours=s.studyHrsWk*s.weeksYr*(start);
  const parentHours=s.parentHrsWk*s.weeksYr*(start);

  return{
    dream, base, worst,
    expNpv, expIrr,
    paybackAfterGrad: base.paybackAfterGrad,
    breakEvenYear: base.breakEvenYear,
    mc, start,
    studentHours, parentHours, totalHours:studentHours+parentHours,
    humanCost:((s.studentStress+s.parentStress)/2)*10,
    beyond:((s.wellbeing+s.autonomy+s.network+s.health+s.family)/5)*10,
    T: base.T,
  };
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Presets                                                             */
/* ─────────────────────────────────────────────────────────────────── */
const BASE={
  durationYears:4, workingYears:35, prepYears:0,
  tuition:200000, coaching:50000, materials:25000, living:120000, transport:15000, other:20000,
  prepCostPerYear:0, prepIncome:0, studentPartTime:0,
  costInflation:6, loanPct:40, loanRate:10, loanTenure:7,
  baseSalary:200000, baseGrowth:4,
  // three scenarios
  dreamProb:20,  dreamSalary:900000,  dreamGrowth:12,
  baseProb:60,   postSalary:500000,   postGrowth:7,
  worstProb:20,  worstSalary:280000,  worstGrowth:4,
  failSalary:250000,
  // MC uncertainty on base growth
  salaryUncertainty:2,
  discountRate:8, taxRate:0,
  studyHrsWk:35, parentHrsWk:6, weeksYr:44,
  studentStress:7, parentStress:5,
  wellbeing:6, autonomy:8, network:7, health:6, family:7,
  currency:"INR", fx:1,
};
const PRESETS={
  "Engineering":{...BASE},
  "Medicine (MBBS)":{
    ...BASE,durationYears:6,workingYears:33,prepYears:1,prepCostPerYear:150000,
    tuition:1200000,materials:40000,living:150000,transport:15000,other:30000,coaching:0,
    baseSalary:200000,
    dreamProb:15, dreamSalary:2500000, dreamGrowth:11,
    baseProb:70,  postSalary:800000,   postGrowth:9,
    worstProb:15, worstSalary:350000,  worstGrowth:5,
    failSalary:300000,salaryUncertainty:3,
    loanPct:50,loanRate:11,loanTenure:10,studyHrsWk:55,parentHrsWk:4,
    studentStress:9,parentStress:6,wellbeing:6,autonomy:7,network:7,health:5,family:8,
  },
  "Arts / Commerce":{
    ...BASE,durationYears:3,workingYears:37,
    tuition:40000,coaching:10000,materials:8000,living:30000,transport:8000,other:10000,
    baseSalary:180000,
    dreamProb:15, dreamSalary:600000,  dreamGrowth:10,
    baseProb:65,  postSalary:320000,   postGrowth:5,
    worstProb:20, worstSalary:180000,  worstGrowth:3,
    failSalary:180000,salaryUncertainty:2,
    loanPct:0,loanRate:0,loanTenure:0,studyHrsWk:22,parentHrsWk:3,
    studentStress:4,parentStress:3,wellbeing:7,autonomy:6,network:6,health:7,family:6,
  },
  "MBA (IIM / ISB)":{
    ...BASE,durationYears:2,workingYears:33,
    tuition:1200000,materials:30000,living:300000,transport:20000,other:40000,coaching:0,
    baseSalary:900000,baseGrowth:8,
    dreamProb:20, dreamSalary:5000000, dreamGrowth:14,
    baseProb:60,  postSalary:2500000,  postGrowth:9,
    worstProb:20, worstSalary:1100000, worstGrowth:6,
    failSalary:1200000,salaryUncertainty:4,
    loanPct:60,loanRate:11,loanTenure:8,studyHrsWk:45,parentHrsWk:1,
    studentStress:7,parentStress:2,wellbeing:6,autonomy:9,network:9,health:5,family:6,
  },
  "PhD (research)":{
    ...BASE,durationYears:5,workingYears:33,
    tuition:20000,materials:20000,living:0,transport:10000,other:10000,coaching:0,
    studentPartTime:420000,
    baseSalary:800000,baseGrowth:7,
    dreamProb:15, dreamSalary:2000000, dreamGrowth:8,
    baseProb:60,  postSalary:1000000,  postGrowth:5,
    worstProb:25, worstSalary:700000,  worstGrowth:4,
    failSalary:900000,salaryUncertainty:3,
    loanPct:0,loanRate:0,loanTenure:0,studyHrsWk:50,parentHrsWk:1,
    studentStress:7,parentStress:2,wellbeing:7,autonomy:9,network:7,health:6,family:6,
  },
  "Teacher (B.Ed)":{
    ...BASE,durationYears:2,workingYears:36,
    tuition:50000,coaching:10000,materials:8000,living:20000,transport:8000,other:5000,
    baseSalary:240000,baseGrowth:5,
    dreamProb:20, dreamSalary:700000,  dreamGrowth:9,
    baseProb:60,  postSalary:360000,   postGrowth:6,
    worstProb:20, worstSalary:240000,  worstGrowth:4,
    failSalary:240000,salaryUncertainty:2,
    loanPct:0,loanRate:0,loanTenure:0,studyHrsWk:25,parentHrsWk:2,
    studentStress:4,parentStress:3,wellbeing:8,autonomy:6,network:6,health:7,family:9,
  },
  "Govt Job (UPSC)":{
    ...BASE,durationYears:1,workingYears:33,prepYears:3,prepCostPerYear:150000,
    tuition:0,coaching:0,materials:0,living:0,transport:0,other:0,studentPartTime:500000,
    baseSalary:400000,baseGrowth:6,
    dreamProb:3,  dreamSalary:1200000, dreamGrowth:9,
    baseProb:10,  postSalary:1000000,  postGrowth:8,
    worstProb:87, worstSalary:350000,  worstGrowth:5,
    failSalary:350000,salaryUncertainty:2,
    loanPct:0,loanRate:0,loanTenure:0,studyHrsWk:60,parentHrsWk:2,
    studentStress:9,parentStress:6,wellbeing:7,autonomy:7,network:7,health:5,family:9,
  },
  "Master's Abroad (US)":{
    ...BASE,currency:"USD",fx:83,durationYears:2,workingYears:33,
    tuition:40000,materials:3000,living:20000,transport:2000,other:3000,coaching:0,
    studentPartTime:8000,
    baseSalary:800000,baseGrowth:7,
    dreamProb:25, dreamSalary:130000,  dreamGrowth:6,
    baseProb:35,  postSalary:90000,    postGrowth:4,
    worstProb:40, worstSalary:18000,   worstGrowth:4,  // returns to India
    failSalary:1500000,salaryUncertainty:4,
    loanPct:50,loanRate:11,loanTenure:10,studyHrsWk:40,parentHrsWk:1,
    studentStress:7,parentStress:5,wellbeing:7,autonomy:9,network:9,health:6,family:4,
  },
};
const GROUPS={
  "School track":["Engineering","Medicine (MBBS)","Arts / Commerce"],
  "After graduation":["MBA (IIM / ISB)","PhD (research)","Teacher (B.Ed)","Govt Job (UPSC)"],
  "Study abroad":["Master's Abroad (US)"],
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Small input components                                              */
/* ─────────────────────────────────────────────────────────────────── */
function Num({label,k,s,set,prefix,suffix,step=1000,hint,min=0}){
  return(
    <label className="fld">
      <span className="fld-l">{label}</span>
      <span className="fld-in">
        {prefix&&<span className="aff">{prefix}</span>}
        <input type="number" value={s[k]} min={min} step={step}
          onChange={e=>set(k,e.target.value===""?0:parseFloat(e.target.value))}/>
        {suffix&&<span className="aff aff-r">{suffix}</span>}
      </span>
      {hint&&<span className="fld-h">{hint}</span>}
    </label>
  );
}
function Slider({label,k,s,set,min=0,max=10,step=1,left,right,accent="teal",suffix=""}){
  return(
    <label className="sld">
      <span className="sld-top">
        <span className="fld-l">{label}</span>
        <span className={"sld-v "+accent}>{s[k]}{suffix}</span>
      </span>
      <input className={"range "+accent} type="range" min={min} max={max} step={step} value={s[k]}
        onChange={e=>set(k,parseFloat(e.target.value))}
        style={{"--p":((s[k]-min)/(max-min))*100+"%"}}/>
      {(left||right)&&<span className="sld-ends"><i>{left}</i><i>{right}</i></span>}
    </label>
  );
}
function Sec({icon,title,sub,children,open,onToggle}){
  return(
    <section className={"sec "+(open?"open":"")}>
      <button className="sec-h" onClick={onToggle} aria-expanded={open}>
        <span className="sec-icn">{icon}</span>
        <span className="sec-tt"><b>{title}</b><i>{sub}</i></span>
        <span className="sec-chev">{open?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span>
      </button>
      {open&&<div className="sec-b">{children}</div>}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Scenario probability validator                                      */
/* ─────────────────────────────────────────────────────────────────── */
function probSum(s){ return s.dreamProb+s.baseProb+s.worstProb; }
function ProbBar({s}){
  const sum=probSum(s);
  const ok=Math.abs(sum-100)<0.5;
  return(
    <div className="probbar">
      <div className="pb-track">
        <div className="pb-seg dream" style={{width:s.dreamProb+"%"}}/>
        <div className="pb-seg base"  style={{width:s.baseProb+"%"}}/>
        <div className="pb-seg worst" style={{width:s.worstProb+"%"}}/>
      </div>
      <div className={"pb-sum "+(ok?"ok":"err")}>
        {ok?"✓ 100%":"⚠ "+sum+"% — must total 100"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Scenario panel inside the result — the signature element            */
/* ─────────────────────────────────────────────────────────────────── */
function ScenarioTiles({m,s,showMC,setShowMC}){
  const scenarios=[
    {key:"dream",label:"Dream",sub:`${s.dreamProb}% chance`,npv:m.dream.npv,irr:m.dream.irr,pay:m.dream.paybackAfterGrad,col:"#34c79a",bg:"rgba(52,199,154,.10)"},
    {key:"base", label:"Base", sub:`${s.baseProb}% chance`, npv:m.base.npv, irr:m.base.irr, pay:m.base.paybackAfterGrad, col:"#7eb8f7",bg:"rgba(126,184,247,.10)"},
    {key:"worst",label:"Worst",sub:`${s.worstProb}% chance`,npv:m.worst.npv,irr:m.worst.irr,pay:m.worst.paybackAfterGrad,col:"#f0a04b",bg:"rgba(240,160,75,.10)"},
  ];
  return(
    <div className="scen-tiles">
      {scenarios.map(sc=>(
        <div key={sc.key} className="scen-tile" style={{background:sc.bg,borderColor:sc.col+"44"}}>
          <div className="st-top">
            <span className="st-label" style={{color:sc.col}}>{sc.label}</span>
            <span className="st-sub">{sc.sub}</span>
          </div>
          <div className="st-npv" style={{color:sc.npv>=0?sc.col:"#f0604b"}}>{inr(sc.npv)}</div>
          <div className="st-meta">
            <span>{pct(sc.irr)}<i>IRR</i></span>
            <span>{yrs(sc.pay)}<i>break-even</i></span>
          </div>
        </div>
      ))}
      <div className="exp-tile">
        <span className="exp-l">Probability-weighted expected</span>
        <span className={"exp-v "+(m.expNpv>=0?"pos":"neg")}>{inr(m.expNpv)}</span>
        <span className="exp-s">{pct(m.expIrr)} expected IRR</span>
        <button className={"mc-btn "+(showMC?"on":"")} onClick={()=>setShowMC(x=>!x)}>
          <BarChart2 size={12}/> {showMC?"Hide":"Show"} uncertainty band
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Chart — three curves + optional MC band                            */
/* ─────────────────────────────────────────────────────────────────── */
const SCEN_COL={dream:"#34c79a",base:"#7eb8f7",worst:"#f0a04b"};

function ScenChart({mA,mB,sA,sB,nameA,nameB,showMC,showPV,viewMode}){
  const yKey=showPV?"cumPV":"cum";
  const maxT=Math.max(mA.T,mB.T);

  // build merged chart data
  const data=[];
  for(let t=0;t<maxT;t++){
    const ra=t<mA.base.series.length?mA.base.series[t]:null;
    const rb=t<mB.base.series.length?mB.base.series[t]:null;
    const mca=t<mA.mc.length?mA.mc[t]:null;
    const mcb=t<mB.mc.length?mB.mc[t]:null;
    const row={year:t};
    if(viewMode==="compare"){
      if(ra) row.a_base=ra[yKey];
      if(rb) row.b_base=rb[yKey];
      if(showMC){
        if(mca){row.a_p10=mca.p10;row.a_p90=mca.p90;row.a_band=[mca.p10,mca.p90];}
        if(mcb){row.b_p10=mcb.p10;row.b_p90=mcb.p90;row.b_band=[mcb.p10,mcb.p90];}
      }
    } else {
      const m=viewMode==="A"?mA:mB;
      const mc=viewMode==="A"?mA.mc:mB.mc;
      const tgt=t<m.dream.series.length?m.dream.series[t]:null;
      const tb2=t<m.base.series.length?m.base.series[t]:null;
      const tw=t<m.worst.series.length?m.worst.series[t]:null;
      const mc2=t<mc.length?mc[t]:null;
      if(tgt) row.dream=tgt[yKey];
      if(tb2) row.base=tb2[yKey];
      if(tw)  row.worst=tw[yKey];
      if(showMC&&mc2){row.p10=mc2.p10;row.p90=mc2.p90;row.band=[mc2.p10,mc2.p90];}
    }
    data.push(row);
  }

  const m=viewMode==="A"?mA:mB;

  return(
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{top:8,right:12,bottom:4,left:8}}>
        <defs>
          <linearGradient id="bandA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7eb8f7" stopOpacity={0.25}/>
            <stop offset="100%" stopColor="#7eb8f7" stopOpacity={0.05}/>
          </linearGradient>
          <linearGradient id="bandB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0a04b" stopOpacity={0.20}/>
            <stop offset="100%" stopColor="#f0a04b" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2a313d" strokeDasharray="2 4" vertical={false}/>
        <XAxis dataKey="year" stroke="#6b7682" tick={{fontSize:11,fill:"#8a94a0"}} tickLine={false}
          axisLine={{stroke:"#2a313d"}}
          label={{value:"years from start",position:"insideBottom",offset:-2,fill:"#6b7682",fontSize:10}}/>
        <YAxis stroke="#6b7682" tick={{fontSize:11,fill:"#8a94a0"}} tickLine={false}
          axisLine={false} tickFormatter={inrS} width={48}/>
        <Tooltip
          contentStyle={{background:"#0d1219",border:"1px solid #2a313d",borderRadius:10,fontSize:12,fontFamily:"DM Mono, monospace"}}
          labelStyle={{color:"#8a94a0"}} labelFormatter={l=>"Year "+l}
          formatter={(val,name)=>{
            const labels={dream:"Dream",base:"Base",worst:"Worst",a_base:nameA+" (base)",b_base:nameB+" (base)",p10:"10th pct",p90:"90th pct",a_p10:nameA+" p10",a_p90:nameA+" p90",b_p10:nameB+" p10",b_p90:nameB+" p90"};
            return[inr(val),labels[name]||name];
          }}/>
        <ReferenceLine y={0} stroke="#4a525e" strokeWidth={1}/>

        {/* MC uncertainty bands */}
        {showMC&&viewMode==="compare"&&(
          <Area type="monotone" dataKey="a_band" stroke="none" fill="url(#bandA)" connectNulls/>
        )}
        {showMC&&viewMode==="compare"&&(
          <Area type="monotone" dataKey="b_band" stroke="none" fill="url(#bandB)" connectNulls/>
        )}
        {showMC&&viewMode!=="compare"&&(
          <Area type="monotone" dataKey="band" stroke="none" fill="url(#bandA)" connectNulls/>
        )}

        {/* scenario lines — single path view */}
        {viewMode!=="compare"&&(
          <>
            <Line type="monotone" dataKey="dream" stroke={SCEN_COL.dream} strokeWidth={2} dot={false} connectNulls strokeDasharray="0"/>
            <Line type="monotone" dataKey="base"  stroke={SCEN_COL.base}  strokeWidth={2.4} dot={false} connectNulls/>
            <Line type="monotone" dataKey="worst" stroke={SCEN_COL.worst} strokeWidth={2} dot={false} connectNulls strokeDasharray="4 3"/>
          </>
        )}

        {/* base lines — compare view */}
        {viewMode==="compare"&&(
          <>
            <Line type="monotone" dataKey="a_base" name="a_base" stroke="#34c79a" strokeWidth={2.4} dot={false} connectNulls/>
            <Line type="monotone" dataKey="b_base" name="b_base" stroke="#f0a04b" strokeWidth={2.4} dot={false} connectNulls/>
          </>
        )}

        {/* break-even dots */}
        {viewMode!=="compare"&&m.dream.breakEvenYear!=null&&m.dream.breakEvenYear<=maxT&&(
          <ReferenceDot x={m.dream.breakEvenYear} y={0} r={4} fill={SCEN_COL.dream} stroke="#0a0d14" strokeWidth={2}/>
        )}
        {viewMode!=="compare"&&m.base.breakEvenYear!=null&&m.base.breakEvenYear<=maxT&&(
          <ReferenceDot x={m.base.breakEvenYear} y={0} r={5} fill={SCEN_COL.base} stroke="#0a0d14" strokeWidth={2}/>
        )}
        {viewMode!=="compare"&&m.worst.breakEvenYear!=null&&m.worst.breakEvenYear<=maxT&&(
          <ReferenceDot x={m.worst.breakEvenYear} y={0} r={4} fill={SCEN_COL.worst} stroke="#0a0d14" strokeWidth={2}/>
        )}
        {viewMode==="compare"&&mA.base.breakEvenYear!=null&&(
          <ReferenceDot x={mA.base.breakEvenYear} y={0} r={5} fill="#34c79a" stroke="#0a0d14" strokeWidth={2}/>
        )}
        {viewMode==="compare"&&mB.base.breakEvenYear!=null&&(
          <ReferenceDot x={mB.base.breakEvenYear} y={0} r={5} fill="#f0a04b" stroke="#0a0d14" strokeWidth={2}/>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Verdict                                                             */
/* ─────────────────────────────────────────────────────────────────── */
function verdict(mA,mB,nA,nB,sA,sB){
  const nm=w=>w==="A"?nA:nB;
  const npvWin=mA.expNpv===mB.expNpv?null:mA.expNpv>mB.expNpv?"A":"B";
  const irrWin=(mA.expIrr??-9)===(mB.expIrr??-9)?null:(mA.expIrr??-9)>(mB.expIrr??-9)?"A":"B";
  const payA=mA.paybackAfterGrad??Infinity,payB=mB.paybackAfterGrad??Infinity;
  const payWin=payA===payB?null:payA<payB?"A":"B";

  // flag if UPSC-style long-shot
  const lotteries=[["A",mA,sA],["B",mB,sB]].filter(([,m,s])=>s.worstProb>=70);
  const lotteryNote=lotteries.length
    ? " "+nm(lotteries[0][0])+" is a long-odds bet — the worst-case scenario carries "+lotteries[0][2].worstProb+"% of the probability weight."
    : "";

  if(mA.expNpv<0&&mB.expNpv<0)
    return{tag:"Neither pays back on money alone",line:`Both return less than they cost in expected present-value terms. The case rests on the beyond-money panel and on which strains the family less.${lotteryNote}`};
  if(npvWin&&npvWin===irrWin&&npvWin===payWin)
    return{tag:`${nm(npvWin)} wins outright`,line:`Higher expected lifetime value, better return per rupee, and faster break-even across all three scenarios.${lotteryNote}`};
  if(npvWin&&irrWin&&npvWin!==irrWin)
    return{tag:"More money vs. better money",line:`${nm(npvWin)} returns more in total rupees. ${nm(irrWin)} returns a higher rate on every rupee committed${payWin===irrWin?" and breaks even sooner":""} — for less up front and less downside risk.${lotteryNote}`};
  const w=npvWin||irrWin||"A";
  return{tag:`${nm(w)} edges ahead`,line:`${nm(w)} leads on expected lifetime value, but the gap is narrower than it looks. Stress-test the odds sliders before committing.${lotteryNote}`};
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main                                                                */
/* ─────────────────────────────────────────────────────────────────── */
const COL={A:"#34c79a",B:"#f0a04b"};

export default function App(){
  const[sA,setSA]=useState(PRESETS["Engineering"]);
  const[sB,setSB]=useState(PRESETS["Govt Job (UPSC)"]);
  const[nameA,setNameA]=useState("Engineering");
  const[nameB,setNameB]=useState("Govt Job (UPSC)");
  const[presetA,setPresetA]=useState("Engineering");
  const[presetB,setPresetB]=useState("Govt Job (UPSC)");
  const[active,setActive]=useState("A");
  const[showMC,setShowMC]=useState(false);
  const[showPV,setShowPV]=useState(true);
  const[viewMode,setViewMode]=useState("compare"); // "compare"|"A"|"B"
  const[open,setOpen]=useState({path:true,money:true,scen:true,earn:false,time:false,beyond:false});

  const set=useCallback((k,v)=>{
    if(active==="A"){setSA(p=>({...p,[k]:v}));setPresetA("");}
    else{setSB(p=>({...p,[k]:v}));setPresetB("");}
  },[active]);
  const patch=(P,obj)=>{
    if(P==="A"){setSA(p=>({...p,...obj}));setPresetA("");}
    else{setSB(p=>({...p,...obj}));setPresetB("");}
  };
  const applyPreset=(P,name)=>{
    const obj=PRESETS[name];
    if(P==="A"){setSA(obj);setPresetA(name);setNameA(name);}
    else{setSB(obj);setPresetB(name);setNameB(name);}
  };
  const toggle=k=>setOpen(p=>({...p,[k]:!p[k]}));

  const mA=useMemo(()=>computeFull(sA),[sA]);
  const mB=useMemo(()=>computeFull(sB),[sB]);

  const s=active==="A"?sA:sB;
  const setS=active==="A"?setSA:setSB;
  const cur=CUR[s.currency].s;
  const v=verdict(mA,mB,nameA,nameB,sA,sB);

  const sumOk=p=>Math.abs(probSum(p)-100)<0.5;
  const validA=sumOk(sA), validB=sumOk(sB);

  const rows=[
    {label:"Expected lifetime value",a:mA.expNpv,b:mB.expNpv,fmt:inr,better:"high"},
    {label:"Expected return (IRR)",a:mA.expIrr,b:mB.expIrr,fmt:pct,better:"high"},
    {label:"Base break-even",a:mA.paybackAfterGrad,b:mB.paybackAfterGrad,fmt:yrs,better:"low"},
    {label:"Dream-case value",a:mA.dream.npv,b:mB.dream.npv,fmt:inr,better:"high"},
    {label:"Worst-case value",a:mA.worst.npv,b:mB.worst.npv,fmt:inr,better:"high"},
  ];

  return(
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot"/> CatalystBox</div>
        <div className="title">
          <span className="eyebrow">Three scenarios · salary uncertainty · honest odds</span>
          <h1>Which Education Pays Back?</h1>
          <p>Each path now runs three futures — Dream, Base, and Worst — weighted by the odds you set. A Monte Carlo band shows how salary uncertainty widens or tightens the range. The headline is always the <em>expected</em> outcome, not the brochure.</p>
        </div>
      </header>

      {/* ── path setup cards ── */}
      <div className="setup">
        {["A","B"].map(P=>{
          const nm=P==="A"?nameA:nameB;
          const pr=P==="A"?presetA:presetB;
          const M=P==="A"?mA:mB;
          const st=P==="A"?sA:sB;
          const valid=P==="A"?validA:validB;
          const setName=P==="A"?setNameA:setNameB;
          return(
            <div key={P} className={"pcard p"+P}>
              <div className="pcard-h">
                <span className="ptag" style={{background:COL[P]}}>{P}</span>
                <input className="pname" value={nm} onChange={e=>setName(e.target.value)}/>
                <select className="cursel" value={st.currency}
                  onChange={e=>patch(P,{currency:e.target.value,fx:CUR[e.target.value].fx})}>
                  {Object.keys(CUR).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select className="psel" value={pr||""} onChange={e=>e.target.value&&applyPreset(P,e.target.value)}>
                <option value="">Start from a path…</option>
                {Object.entries(GROUPS).map(([g,list])=>(
                  <optgroup key={g} label={g}>{list.map(n=><option key={n} value={n}>{n}</option>)}</optgroup>
                ))}
              </select>
              {!valid&&<div className="prob-warn"><AlertTriangle size={12}/> Scenario odds must total 100%</div>}
              <div className="pstat">
                <span><i>Expected value</i><b className={M.expNpv>=0?"pos":"neg"}>{inr(M.expNpv)}</b></span>
                <span><i>Expected IRR</i><b>{pct(M.expIrr)}</b></span>
                <span><i>Base break-even</i><b>{yrs(M.paybackAfterGrad)}</b></span>
              </div>
              <div className="scen-mini">
                <span style={{color:SCEN_COL.dream}}>Dream {inr(M.dream.npv)}</span>
                <span style={{color:SCEN_COL.base}}>Base {inr(M.base.npv)}</span>
                <span style={{color:SCEN_COL.worst}}>Worst {inr(M.worst.npv)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="layout">
        {/* ══════════════ RESULT ══════════════ */}
        <div className="result">
          <div className="verdict">
            <span className="v-icn"><Swords size={15}/></span>
            <div><span className="v-tag">{v.tag}</span><p>{v.line}</p></div>
          </div>

          {/* view toggle */}
          <div className="view-tog">
            {[["compare","Compare"],["A",nameA],["B",nameB]].map(([k,lbl])=>(
              <button key={k} className={"vt "+(viewMode===k?"on":"")}
                style={viewMode===k&&k!=="compare"?{background:k==="A"?COL.A:COL.B,borderColor:"transparent",color:"#fff"}:{}}
                onClick={()=>setViewMode(k)}>{lbl}</button>
            ))}
          </div>

          {/* chart */}
          <div className="chart">
            <div className="chart-h">
              <span>{viewMode==="compare"?"Base scenarios head to head":"All three scenarios"}</span>
              <div className="chart-btns">
                <button className={"pv "+(showMC?"on":"")} onClick={()=>setShowMC(x=>!x)}>
                  <BarChart2 size={11}/> {showMC?"Hide band":"Uncertainty"}
                </button>
                <button className="pv" onClick={()=>setShowPV(x=>!x)}>
                  {showPV?"Today's ₹":"Cash"}
                </button>
              </div>
            </div>
            <ScenChart mA={mA} mB={mB} sA={sA} sB={sB} nameA={nameA} nameB={nameB}
              showMC={showMC} showPV={showPV} viewMode={viewMode}/>
            <div className="legend">
              {viewMode==="compare"?(
                <>
                  <span><i className="sw" style={{background:COL.A}}/>{nameA} base</span>
                  <span><i className="sw" style={{background:COL.B}}/>{nameB} base</span>
                </>
              ):(
                <>
                  <span><i className="sw" style={{background:SCEN_COL.dream}}/>Dream</span>
                  <span><i className="sw" style={{background:SCEN_COL.base}}/>Base</span>
                  <span><i className="sw" style={{background:SCEN_COL.worst,opacity:.7}}/>Worst</span>
                </>
              )}
              {showMC&&<span><i className="sw" style={{background:"#7eb8f7",opacity:.4}}/>±1σ salary band</span>}
              <span><i className="dotmark"/>break-even</span>
            </div>
          </div>

          {/* scenario tiles for the focused path */}
          {viewMode!=="compare"&&(
            <ScenarioTiles m={viewMode==="A"?mA:mB} s={viewMode==="A"?sA:sB}
              showMC={showMC} setShowMC={setShowMC}/>
          )}

          {/* h2h bars — compare mode */}
          {viewMode==="compare"&&(
            <div className="h2h">
              <div className="h2h-key">
                <span style={{color:COL.A}}>◀ {nameA}</span>
                <span style={{color:COL.B}}>{nameB} ▶</span>
              </div>
              {rows.map(row=>{
                const mx=Math.max(Math.abs(row.a??0),Math.abs(row.b??0),1e-9);
                const pa=(Math.abs(row.a??0)/mx)*100,pb=(Math.abs(row.b??0)/mx)*100;
                const av=row.a??(row.better==="low"?Infinity:-Infinity);
                const bv=row.b??(row.better==="low"?Infinity:-Infinity);
                const winA=row.better==="low"?av<bv:av>bv;
                return(
                  <div className="h2h-row" key={row.label}>
                    <div className="h2h-top">
                      <span className={"h2h-v a"+(winA?" w":"")}>{row.fmt(row.a)}</span>
                      <b>{row.label}{row.better==="low"&&<i> ↓</i>}</b>
                      <span className={"h2h-v b"+(!winA?" w":"")}>{row.fmt(row.b)}</span>
                    </div>
                    <div className="h2h-track">
                      <div className="h2h-left"><i style={{width:pa+"%",background:COL.A,opacity:winA?1:0.4}}/></div>
                      <div className="h2h-right"><i style={{width:pb+"%",background:COL.B,opacity:!winA?1:0.4}}/></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="assump">
            MC band: base growth ±{s.salaryUncertainty}% · discounted at {s.discountRate}% · 300 trials
          </div>
        </div>

        {/* ══════════════ EDITOR ══════════════ */}
        <div className="controls">
          <div className="seg">
            <span className="seg-l">Editing</span>
            <button className={"seg-b "+(active==="A"?"on":"")}
              style={active==="A"?{background:COL.A}:{}} onClick={()=>setActive("A")}>{nameA}</button>
            <button className={"seg-b "+(active==="B"?"on":"")}
              style={active==="B"?{background:COL.B}:{}} onClick={()=>setActive("B")}>{nameB}</button>
          </div>
          <div className="ctrl-inner" style={{borderColor:COL[active]}}>

            <Sec icon={<GraduationCap size={16}/>} title="The path" sub="Years before earning starts"
              open={open.path} onToggle={()=>toggle("path")}>
              <div className="grid3">
                <Num label="Prep / drop years" k="prepYears" s={s} set={set} step={1} suffix="yrs"/>
                <Num label="Study years" k="durationYears" s={s} set={set} step={1} suffix="yrs"/>
                <Num label="Working years" k="workingYears" s={s} set={set} step={1} suffix="yrs"/>
              </div>
            </Sec>

            <Sec icon={<Wallet size={16}/>} title="What you pay" sub={"Costs per year · "+s.currency}
              open={open.money} onToggle={()=>toggle("money")}>
              <div className="grid2">
                <Num label="Tuition & fees / yr" k="tuition" s={s} set={set} prefix={cur}/>
                <Num label="Coaching / yr" k="coaching" s={s} set={set} prefix={cur}/>
                <Num label="Living / hostel / yr" k="living" s={s} set={set} prefix={cur}/>
                <Num label="Books & devices / yr" k="materials" s={s} set={set} prefix={cur}/>
                <Num label="Transport / yr" k="transport" s={s} set={set} prefix={cur}/>
                <Num label="Other / yr" k="other" s={s} set={set} prefix={cur}/>
              </div>
              <Slider label="Fee inflation / yr" k="costInflation" s={s} set={set}
                min={0} max={15} step={1} left="flat" right="15%" accent="amber" suffix="%"/>
              <div className="sub-h">Borrowing</div>
              <div className="grid3">
                <Num label="Loan %" k="loanPct" s={s} set={set} step={5} suffix="%"/>
                <Num label="Rate" k="loanRate" s={s} set={set} step={0.5} suffix="%"/>
                <Num label="Tenure" k="loanTenure" s={s} set={set} step={1} suffix="yrs"/>
              </div>
            </Sec>

            {/* ── THREE SCENARIOS ── */}
            <Sec icon={<Target size={16}/>} title="Three scenarios" sub="Dream · Base · Worst — must total 100%"
              open={open.scen} onToggle={()=>toggle("scen")}>
              <ProbBar s={s}/>

              {/* DREAM */}
              <div className="scen-block dream-b">
                <div className="sb-h"><span className="sb-dot dream"/>Dream scenario</div>
                <div className="grid2">
                  <Num label="Probability" k="dreamProb" s={s} set={set} step={1} suffix="%"/>
                  <Num label={"Starting pay ("+s.currency+")"} k="dreamSalary" s={s} set={set} prefix={cur}/>
                </div>
                <Slider label="Pay growth rate" k="dreamGrowth" s={s} set={set}
                  min={0} max={20} step={1} left="0%" right="20%" accent="teal" suffix="%"/>
              </div>

              {/* BASE */}
              <div className="scen-block base-b">
                <div className="sb-h"><span className="sb-dot base"/>Base scenario</div>
                <div className="grid2">
                  <Num label="Probability" k="baseProb" s={s} set={set} step={1} suffix="%"/>
                  <Num label={"Starting pay ("+s.currency+")"} k="postSalary" s={s} set={set} prefix={cur}/>
                </div>
                <Slider label="Pay growth rate" k="postGrowth" s={s} set={set}
                  min={0} max={20} step={1} left="0%" right="20%" accent="teal" suffix="%"/>
                <div className="sub-h" style={{marginTop:10}}>Salary uncertainty (Monte Carlo)</div>
                <Slider label="Growth rate spread (±)" k="salaryUncertainty" s={s} set={set}
                  min={0} max={8} step={0.5} left="certain" right="wide" accent="amber" suffix="%"/>
                <div className="mini">The band on the chart shows where 80% of salary trajectories land given this spread. Set higher for volatile fields (startups, abroad); lower for stable ones (govt, academia).</div>
              </div>

              {/* WORST */}
              <div className="scen-block worst-b">
                <div className="sb-h"><span className="sb-dot worst"/>Worst scenario</div>
                <div className="grid2">
                  <Num label="Probability" k="worstProb" s={s} set={set} step={1} suffix="%"/>
                  <Num label={"Starting pay ("+s.currency+")"} k="worstSalary" s={s} set={set} prefix={cur}/>
                </div>
                <Slider label="Pay growth rate" k="worstGrowth" s={s} set={set}
                  min={0} max={20} step={1} left="0%" right="20%" accent="amber" suffix="%"/>
                <Num label="Fallback salary if path fails entirely (₹)" k="failSalary" s={s} set={set} prefix="₹"
                  hint="Plan B — what you'd realistically earn if the path doesn't work out at all."/>
              </div>
            </Sec>

            <Sec icon={<TrendingUp size={16}/>} title="The counterfactual" sub="The road not taken"
              open={open.earn} onToggle={()=>toggle("earn")}>
              <div className="grid2">
                <Num label="Earnings WITHOUT this path / yr (₹)" k="baseSalary" s={s} set={set} prefix="₹"
                  hint="The honest fallback — what they'd earn anyway."/>
                <Num label="Earned while studying / yr" k="studentPartTime" s={s} set={set} prefix={cur}
                  hint="Stipend, TA, part-time work."/>
              </div>
              <div className="grid3">
                <Num label="Prep income / yr" k="prepIncome" s={s} set={set} prefix={cur}/>
                <Num label="Prep cost / yr" k="prepCostPerYear" s={s} set={set} prefix={cur}/>
                <Num label="Counterfactual growth" k="baseGrowth" s={s} set={set} step={1} suffix="%"/>
              </div>
              <div className="grid2">
                <Num label="Discount rate" k="discountRate" s={s} set={set} step={0.5} suffix="%"
                  hint="How you value money now vs. later."/>
                <Num label="Tax on the premium" k="taxRate" s={s} set={set} step={5} suffix="%"/>
              </div>
            </Sec>

            <Sec icon={<Clock size={16}/>} title="Time & effort" sub="Costs with no invoice"
              open={open.time} onToggle={()=>toggle("time")}>
              <div className="grid3">
                <Num label="Student hrs / wk" k="studyHrsWk" s={s} set={set} step={1}/>
                <Num label="Parent hrs / wk" k="parentHrsWk" s={s} set={set} step={1}/>
                <Num label="Weeks / yr" k="weeksYr" s={s} set={set} step={1}/>
              </div>
              <Slider label="Student stress" k="studentStress" s={s} set={set} left="light" right="heavy" accent="amber"/>
              <Slider label="Parent stress" k="parentStress" s={s} set={set} left="light" right="heavy" accent="amber"/>
            </Sec>

            <Sec icon={<Sparkles size={16}/>} title="Beyond money" sub="Rated 0–10 · kept separate"
              open={open.beyond} onToggle={()=>toggle("beyond")}>
              <Slider label="Wellbeing & confidence" k="wellbeing" s={s} set={set} accent="teal"/>
              <Slider label="Career options & freedom" k="autonomy" s={s} set={set} accent="teal"/>
              <Slider label="Network & social capital" k="network" s={s} set={set} accent="teal"/>
              <Slider label="Health & longevity" k="health" s={s} set={set} accent="teal"/>
              <Slider label="Family & next-gen lift" k="family" s={s} set={set} accent="teal"/>
            </Sec>

          </div>
        </div>
      </div>

      {/* method */}
      <footer className="meth">
        <div className="meth-h"><Zap size={13}/> How the engine works now</div>
        <p>Each path runs <b>three parallel futures</b> — Dream, Base, and Worst — each with its own starting salary, growth rate, and probability weight. Those weights must sum to 100%. Career income in each scenario is probability-weighted against the fallback salary, then discounted to today's money. The <b>expected value</b> is the probability-weighted average across all three scenarios. <b>Monte Carlo</b> runs 300 trials sampling the base growth rate from a normal distribution centred on your input, with the spread you set — the chart band shows where the 10th to 90th percentile of outcomes land. Non-financial returns and family strain are reported separately and never priced into the rupees.</p>
        <p className="disc">All figures are illustrative and yours to change. Presets are reasonable Indian starting points, not forecasts.</p>
        <div className="sign"><span className="dot"/> Show all three futures. Let the family decide.</div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
:root{--ink:#0a0d14;--ink-3:#11161f;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;}
*{box-sizing:border-box;margin:0;padding:0}
.wrap{background:var(--parch);color:var(--tx);font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;padding:22px 16px 40px;max-width:1180px;margin:0 auto}
.wrap h1,.wrap h3{font-family:'Syne',sans-serif;letter-spacing:-0.02em}
.top{margin-bottom:18px}
.brand{display:inline-flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;letter-spacing:.04em;color:var(--teal);text-transform:uppercase;margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block;box-shadow:0 0 0 3px rgba(232,146,42,.18)}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--clay);display:block}
.title h1{font-size:clamp(26px,5vw,44px);font-weight:800;line-height:1.02;margin:6px 0 8px;color:var(--ink)}
.title p{max-width:64ch;color:var(--tx-soft);font-size:15px}
.title em{font-style:italic;color:var(--clay);font-weight:600}

.setup{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:16px}
@media(min-width:680px){.setup{grid-template-columns:1fr 1fr}}
.pcard{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:14px 15px;border-top:3px solid}
.pcard.pA{border-top-color:#34c79a}.pcard.pB{border-top-color:#f0a04b}
.pcard-h{display:flex;align-items:center;gap:9px;margin-bottom:10px}
.ptag{width:24px;height:24px;border-radius:7px;color:#fff;font-family:'Syne';font-weight:800;font-size:14px;display:grid;place-items:center;flex:none}
.pname{flex:1;min-width:0;border:0;border-bottom:1.5px dashed var(--line);background:none;font-family:'Syne';font-weight:700;font-size:16px;color:var(--ink);padding:2px 0;outline:0}
.pname:focus{border-bottom-color:var(--teal)}
.cursel{flex:none;font-family:'DM Mono';font-size:11px;border:1px solid var(--line);border-radius:7px;padding:4px;background:#fff;color:var(--tx-soft);cursor:pointer}
.psel{width:100%;font-family:'DM Sans';font-weight:600;font-size:13px;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:#fff;color:var(--ink);cursor:pointer;margin-bottom:10px}
.prob-warn{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--clay);background:var(--amber-tint);border-radius:7px;padding:6px 10px;margin-bottom:8px}
.pstat{display:flex;gap:6px;border-top:1px solid var(--line);padding-top:11px;margin-bottom:8px}
.pstat span{flex:1;display:flex;flex-direction:column;gap:2px}
.pstat i{font-style:normal;font-size:10px;color:var(--tx-mut);text-transform:uppercase;letter-spacing:.04em}
.pstat b{font-family:'DM Mono';font-size:14px;color:var(--ink)}
.pstat b.pos{color:var(--teal)}.pstat b.neg{color:var(--clay)}
.scen-mini{display:flex;gap:10px;font-family:'DM Mono';font-size:11.5px;flex-wrap:wrap}

.layout{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:980px){.layout{grid-template-columns:1fr 1fr;align-items:start}.result{position:sticky;top:14px}}

.result{background:var(--ink);border-radius:18px;padding:20px;color:#e8ebef;position:relative;overflow:hidden;box-shadow:0 24px 50px -28px rgba(10,13,20,.7)}
.result::before{content:'';position:absolute;top:-60px;right:-40px;width:240px;height:240px;background:radial-gradient(circle,rgba(52,199,154,.13),transparent 70%);pointer-events:none}
.verdict{display:flex;gap:11px;position:relative;margin-bottom:14px}
.v-icn{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;background:#1a212b;color:#f0a04b}
.v-tag{font-family:'Syne';font-weight:700;font-size:clamp(16px,2.4vw,20px);line-height:1.14;color:#fff;letter-spacing:-0.02em}
.verdict p{font-size:12px;color:#9aa3ad;margin:6px 0 0;line-height:1.5}

.view-tog{display:flex;gap:6px;margin-bottom:14px;position:relative}
.vt{flex:1;font-family:'Syne';font-weight:700;font-size:11.5px;padding:7px 8px;border-radius:9px;border:1px solid #2a313d;background:#10151d;color:#7e8896;cursor:pointer;transition:.15s;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vt:hover{border-color:#4a525e;color:#bbc3cc}
.vt.on{background:#1e2530;border-color:#4a525e;color:#fff}

.chart{margin-bottom:14px;position:relative}
.chart-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.chart-h span{font-size:11px;font-weight:600;color:#9aa3ad;letter-spacing:.02em}
.chart-btns{display:flex;gap:6px}
.pv{font-family:'DM Mono';font-size:10px;color:var(--teal-line);background:rgba(52,199,154,.08);border:1px solid rgba(52,199,154,.22);border-radius:7px;padding:4px 8px;cursor:pointer;transition:.15s;display:flex;align-items:center;gap:4px}
.pv:hover,.pv.on{background:rgba(52,199,154,.18)}
.legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;justify-content:center}
.legend span{display:flex;align-items:center;gap:5px;font-size:10px;color:#7e8896}
.sw{width:10px;height:10px;border-radius:3px;display:inline-block}
.dotmark{width:8px;height:8px;border-radius:50%;background:#fff;border:2px solid #6b7682;display:inline-block}

.scen-tiles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;position:relative}
@media(max-width:520px){.scen-tiles{grid-template-columns:1fr}}
.scen-tile{border:1px solid;border-radius:12px;padding:12px;position:relative}
.st-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
.st-label{font-family:'Syne';font-weight:700;font-size:13px}
.st-sub{font-size:10px;color:#7e8896;font-family:'DM Mono'}
.st-npv{font-family:'DM Mono';font-size:18px;font-weight:500;margin-bottom:6px}
.st-meta{display:flex;gap:8px}
.st-meta span{font-family:'DM Mono';font-size:11px;color:#9aa3ad;display:flex;flex-direction:column;gap:1px}
.st-meta i{font-style:normal;font-size:9px;color:#6b7682;text-transform:uppercase;letter-spacing:.06em}
.exp-tile{grid-column:1/-1;background:#10151d;border:1px solid #1e2530;border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.exp-l{font-size:11px;color:#7e8896;flex:none}
.exp-v{font-family:'DM Mono';font-size:20px;font-weight:500;flex:1}
.exp-v.pos{color:var(--teal-line)}.exp-v.neg{color:#f0604b}
.exp-s{font-size:11px;color:#7e8896;font-family:'DM Mono';flex:none}
.mc-btn{font-family:'DM Mono';font-size:10px;color:var(--teal-line);background:rgba(52,199,154,.08);border:1px solid rgba(52,199,154,.22);border-radius:7px;padding:5px 9px;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap}
.mc-btn.on{background:rgba(52,199,154,.18)}

.h2h{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:13px 14px 8px;margin-bottom:12px}
.h2h-key{display:flex;justify-content:space-between;font-size:10.5px;font-weight:600;margin-bottom:11px;letter-spacing:.04em}
.h2h-row{margin-bottom:12px}
.h2h-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:4px}
.h2h-top b{font-family:'DM Sans';font-weight:500;font-size:11px;color:#7e8896;text-align:center;flex:none}
.h2h-top b i{font-style:normal;color:#5a6470}
.h2h-v{font-family:'DM Mono';font-size:13px;color:#9aa3ad;flex:1}
.h2h-v.a{text-align:left}.h2h-v.b{text-align:right}
.h2h-v.a.w{color:#34c79a;font-weight:500}.h2h-v.b.w{color:#f0a04b;font-weight:500}
.h2h-track{display:flex;height:6px;gap:2px}
.h2h-left{width:50%;display:flex;justify-content:flex-end}
.h2h-right{width:50%}
.h2h-left i,.h2h-right i{height:100%;display:block;transition:width .35s,opacity .2s}
.h2h-left i{border-radius:99px 0 0 99px}
.h2h-right i{border-radius:0 99px 99px 0}
.assump{position:relative;font-size:10px;color:#6b7682;text-align:center;font-family:'DM Mono';margin-top:10px}

.controls{display:flex;flex-direction:column;gap:0}
.seg{display:flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--line);border-radius:12px 12px 0 0;padding:8px 10px;border-bottom:0}
.seg-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tx-mut);margin-right:4px}
.seg-b{flex:1;font-family:'Syne';font-weight:700;font-size:12px;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seg-b.on{color:#fff;border-color:transparent}
.ctrl-inner{display:flex;flex-direction:column;gap:10px;border:2px solid;border-radius:0 0 14px 14px;border-top:0;padding:12px;transition:border-color .2s;background:rgba(255,255,255,.3)}

.sec{background:var(--paper);border:1px solid var(--line);border-radius:13px;overflow:hidden}
.sec-h{width:100%;display:flex;align-items:center;gap:10px;padding:12px 14px;background:none;border:0;cursor:pointer;text-align:left}
.sec-icn{width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:8px;background:var(--teal-tint);color:var(--teal)}
.sec-tt{flex:1;display:flex;flex-direction:column}
.sec-tt b{font-family:'Syne';font-weight:700;font-size:14px;color:var(--ink)}
.sec-tt i{font-style:normal;font-size:11px;color:var(--tx-mut)}
.sec-chev{color:var(--tx-mut);width:16px;display:grid;place-items:center}
.sec-b{padding:2px 14px 15px;border-top:1px solid var(--line)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:11px}
@media(max-width:430px){.grid2,.grid3{grid-template-columns:1fr}}
.fld{display:flex;flex-direction:column;gap:4px}
.fld-l{font-size:11px;font-weight:600;color:var(--tx-soft)}
.fld-in{display:flex;align-items:center;background:#fff;border:1px solid var(--line);border-radius:9px;overflow:hidden;transition:.15s}
.fld-in:focus-within{border-color:var(--teal);box-shadow:0 0 0 3px rgba(11,92,69,.09)}
.fld-in input{flex:1;min-width:0;border:0;outline:0;background:none;padding:8px 9px;font-family:'DM Mono',monospace;font-size:12.5px;color:var(--ink)}
.aff{padding:0 8px;font-family:'DM Mono';font-size:11.5px;color:var(--tx-mut);background:var(--parch);align-self:stretch;display:flex;align-items:center}
.aff-r{border-left:1px solid var(--line)}.aff:first-child{border-right:1px solid var(--line)}
.fld-h{font-size:10px;color:var(--tx-mut);line-height:1.35}
.sub-h{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--clay);margin-top:14px}
.mini{font-size:11px;color:var(--tx-soft);margin-top:8px;line-height:1.45}
.sld{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.sld-top{display:flex;justify-content:space-between;align-items:baseline}
.sld-v{font-family:'DM Mono';font-size:13.5px}
.sld-v.teal{color:var(--teal)}.sld-v.amber{color:var(--clay)}
.range{-webkit-appearance:none;appearance:none;height:5px;border-radius:99px;outline:0;cursor:pointer;width:100%}
.range.teal{background:linear-gradient(90deg,var(--teal) var(--p),#e4dccb var(--p))}
.range.amber{background:linear-gradient(90deg,var(--amber) var(--p),#e4dccb var(--p))}
.range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer}
.sld-ends{display:flex;justify-content:space-between}
.sld-ends i{font-style:normal;font-size:10px;color:var(--tx-mut)}

.probbar{margin:12px 0 6px}
.pb-track{height:10px;background:#e4dccb;border-radius:99px;display:flex;overflow:hidden;margin-bottom:5px}
.pb-seg{height:100%;transition:width .3s}
.pb-seg.dream{background:#34c79a}
.pb-seg.base{background:#7eb8f7}
.pb-seg.worst{background:#f0a04b}
.pb-sum{font-family:'DM Mono';font-size:11px;text-align:right}
.pb-sum.ok{color:var(--teal)}.pb-sum.err{color:var(--clay)}

.scen-block{border:1px solid var(--line);border-radius:11px;padding:12px;margin-top:11px}
.dream-b{border-top:3px solid #34c79a}.base-b{border-top:3px solid #7eb8f7}.worst-b{border-top:3px solid #f0a04b}
.sb-h{display:flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;color:var(--ink);margin-bottom:8px}
.sb-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.sb-dot.dream{background:#34c79a}.sb-dot.base{background:#7eb8f7}.sb-dot.worst{background:#f0a04b}

.meth{margin-top:18px;background:var(--ink);border-radius:16px;padding:20px;color:#aeb6c0}
.meth-h{display:flex;align-items:center;gap:8px;font-family:'Syne';font-weight:700;font-size:14px;color:#fff;margin-bottom:10px}
.meth p{font-size:12px;line-height:1.6;margin:0 0 10px;max-width:96ch}
.meth p b{color:#dfe4e9}
.disc{color:#7e8896;font-size:11px}
.sign{display:flex;align-items:center;gap:8px;font-size:11px;color:#7e8896;margin-top:6px;border-top:1px solid #1e2530;padding-top:12px}
.sign .dot{box-shadow:0 0 0 3px rgba(232,146,42,.15)}
`;
