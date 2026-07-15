import React, { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot, ReferenceArea,
} from "recharts";
import {
  Store, Laptop, TrendingUp, Clock, Sparkles, Wallet, Zap, Lock, Landmark,
  ChevronDown, ChevronUp, Search, RotateCcw, GraduationCap, Swords, MapPin,
  BarChart2, AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */
/*  Formatting (Indian numbering)                                       */
/* ─────────────────────────────────────────────────────────────────── */
function inr(n){
  if(n==null||isNaN(n))return"—";
  const neg=n<0; n=Math.abs(n);
  let s;
  if(n>=1e7) s="₹"+(n/1e7).toFixed(n>=1e8?1:2)+" Cr";
  else if(n>=1e5) s="₹"+(n/1e5).toFixed(n>=1e6?1:2)+" L";
  else if(n>=1e3) s="₹"+(n/1e3).toFixed(0)+"k";
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
const pc1=x=>(x==null||isNaN(x)?"—":x.toFixed(1)+"%");
const yrs=v=>(v==null?"never":v<=0?"at once":v.toFixed(1)+" yrs");

/* ─────────────────────────────────────────────────────────────────── */
/*  VENTURE DATA — seeded from the opportunity dossier, expanded.       */
/*  BIZ: [name, invMin(k), invMax(k), mLo, mHi, turnover, rampMo, surv3yr, hrs] */
/*  SELF:[name, invMin(k), invMax(k), mLo, mHi, incLo(k/mo), incHi(k/mo), rampMo, odds, hrs] */
/* ─────────────────────────────────────────────────────────────────── */
const BIZ = {
  "Micro & Home-Based":[
    ["Tiffin & cloud kitchen",15,80,35,50,18,4,55,60],
    ["Tailoring & boutique",15,45,40,60,12,5,60,50],
    ["Agarbatti / dhoop making",20,60,20,35,10,6,50,48],
    ["Home salon (mobile)",20,50,55,75,14,4,60,45],
    ["Pickles, papad & spices",10,35,35,50,14,5,55,45],
    ["Waterless car & bike wash",12,30,50,65,16,3,55,50],
    ["Doorstep mobile repair",25,90,35,55,12,4,60,55],
    ["Pet grooming & boarding",30,100,45,60,8,6,60,50],
    ["Event decoration",50,200,40,55,9,8,50,55],
    ["Rooftop solar installation",100,500,20,35,8,8,55,55],
    ["Laundry pickup & drop",30,80,40,55,10,6,55,55],
    ["Home bakery & confectionery",40,150,45,60,9,6,60,45],
    ["Vermicompost (small)",30,100,40,55,6,8,60,35],
    ["Poultry — broiler / layer",50,200,25,40,7,7,50,55],
  ],
  "Manufacturing":[
    ["Cold-pressed ghani oil mill",500,1200,25,40,2.4,12,50,55],
    ["Paper bags & corrugated boxes",1200,2800,16,25,2.6,14,45,55],
    ["Herbal soap & cosmetics",150,500,35,50,3,10,45,50],
    ["Plastic recycling / upcycling",500,1500,20,30,2.8,14,45,55],
    ["Bamboo crafts & furniture",150,400,30,45,2.5,10,50,50],
    ["Millet & snack processing",200,600,20,30,3.5,10,50,50],
    ["Jute bags & mats",150,400,30,45,2.6,10,50,50],
    ["Wooden furniture & carving",300,800,25,40,2.2,12,50,55],
    ["RO packaged-water plant",400,1200,25,40,2.2,10,50,50],
    ["Fly-ash bricks & pavers",800,2000,18,28,2.4,12,45,55],
    ["Garment stitching unit",500,1500,18,30,3,12,45,55],
    ["LED bulb assembly",200,600,20,32,3.2,9,45,50],
    ["Detergent & home cleaners",200,600,25,38,3,9,50,48],
    ["Namkeen & bakery unit",300,1000,22,35,3.2,10,50,55],
  ],
  "Agri & Allied":[
    ["Polyhouse — exotic veg (acre)",1500,3500,40,55,0.9,14,55,55],
    ["Mushroom cultivation",40,250,45,65,4,3,55,45],
    ["Apiculture & honey",60,200,40,60,3,8,55,40],
    ["Fish farming",150,600,30,48,1.6,9,50,45],
    ["Goat & sheep rearing",120,400,35,50,1.4,12,55,45],
    ["Hydroponic rooftop farm",300,800,35,45,1.4,7,45,45],
    ["Vertical indoor farm",1000,2500,35,50,1.2,10,40,50],
    ["Dairy — cow / buffalo",200,1000,20,35,1.8,10,55,60],
    ["Plant nursery & landscaping",100,500,35,50,2.2,9,55,45],
    ["Floriculture",200,800,30,45,1.4,10,50,50],
    ["Agri-input shop (seed/fert.)",300,1000,12,20,5,6,60,55],
    ["Custom hiring centre (tractor)",800,2500,25,40,1.2,8,55,50],
  ],
  "Wholesale & Distribution":[
    ["FMCG distributorship",600,2000,4,10,15,6,60,60],
    ["Apparel & ethnic wholesale",500,1500,15,30,4.5,8,50,55],
    ["Mobile accessories wholesale",150,500,12,20,7,5,55,55],
    ["Hardware & building materials",1000,3000,10,15,5,8,55,60],
    ["Stationery & office supplies",300,800,15,25,5,6,55,50],
    ["Pharma distributorship",500,2000,8,15,9,8,60,55],
    ["Auto spares distribution",400,1500,12,20,6,7,55,55],
  ],
  "Retail & F&B":[
    ["Kirana 2.0 (modern grocery)",400,1000,8,18,8,7,55,70],
    ["Pharmacy (medical store)",500,1500,12,22,7,8,65,65],
    ["Organic & health food store",200,600,20,35,5,8,45,55],
    ["Mobile shop & repair counter",150,400,30,45,6,5,55,60],
    ["Juice bar / shake café",300,800,35,50,4.5,6,50,60],
    ["Bookstore + co-working",300,700,20,30,3,9,40,55],
    ["Cosmetics & ladies' corner",200,500,25,45,5,6,50,55],
    ["Café / QSR franchise",800,3000,15,28,3.2,9,60,65],
    ["Food truck",600,1500,25,40,4,6,50,60],
    ["Gym / fitness studio",800,2500,25,40,2,10,50,55],
    ["Unisex salon (commercial)",400,1200,30,45,3.2,8,55,55],
    ["Preschool franchise",800,2000,25,40,1.8,12,60,45],
    ["Coaching institute (offline)",300,1200,30,50,3,9,55,50],
  ],
  "Services & Logistics":[
    ["Security & housekeeping agency",200,800,10,18,10,8,55,55],
    ["HR staffing agency",200,800,15,28,8,9,50,55],
    ["Packers & movers",400,1200,20,35,4.5,7,50,60],
    ["Courier franchise",200,800,12,22,7,6,60,55],
    ["Diagnostics collection franchise",300,1000,18,30,4,8,60,50],
    ["Catering service",300,1000,25,40,5,7,50,60],
    ["Car detailing studio",400,1000,35,50,3.2,6,50,50],
    ["Travel agency & tour operator",200,800,12,25,6,9,45,55],
  ],
  "Startups & Digital":[
    ["Micro-SaaS (billing/CRM)",20,150,70,90,8,15,25,55],
    ["D2C clean-label brand",50,300,30,50,6,12,25,60],
    ["Subscription box",100,300,25,40,5,10,30,50],
    ["Local services aggregator",100,500,20,30,4,14,20,60],
    ["EdTech — regional courses",200,1000,40,60,3.5,12,25,55],
    ["Online skill academy",100,500,40,60,4,10,30,50],
  ],
  "Frontier & Emerging":[
    ["EV charging franchise",1000,2500,20,30,1.4,12,55,40],
    ["Drone services (agri/survey)",300,800,30,45,2.4,8,50,45],
    ["Small biogas / waste-to-energy",500,2000,20,35,1.4,14,45,45],
    ["Teleradiology & diagnostics AI",200,800,40,60,3,12,35,50],
    ["Industrial solar-panel cleaning",200,500,30,45,3.5,6,55,45],
    ["3D printing bureau",300,800,30,45,2.6,8,45,45],
  ],
  "Import & Export":[
    ["Commodity export (spices/rice)",500,2000,8,18,6,12,40,55],
    ["Handicraft & textile export",300,1500,20,35,4,12,45,55],
    ["Pharma / ayurvedic export",1000,3000,15,25,4,14,40,55],
    ["Machinery & components import",1500,5000,10,20,4,10,45,55],
    ["Electronics & accessories import",500,2000,12,22,6,8,45,55],
    ["Organic food export",500,1800,15,25,4.5,12,40,50],
  ],
  "Real Estate":[
    ["Brokerage / channel partner",100,500,60,80,3,9,40,50],
    ["Property flipping",1000,5000,15,30,1.1,12,50,35],
    ["Rental property management",200,1000,40,60,1.8,8,55,40],
    ["Construction contracting",2000,8000,10,20,2.2,12,50,60],
    ["Interior design & fit-outs",300,1000,25,40,3.5,8,55,55],
    ["Co-working space franchise",1500,4000,15,25,1.3,12,50,50],
  ],
};

const SELF = {
  "Teaching & Coaching":[
    ["School tuition (online)",5,15,75,95,12,60,4,65,25],
    ["Competitive-exam coaching",10,25,80,95,25,150,6,55,30],
    ["Coding classes for kids",5,15,75,90,15,80,5,55,25],
    ["Language teaching",3,10,80,95,10,50,4,60,20],
    ["Music / instrument classes",10,20,70,85,10,50,5,60,20],
    ["Chess / abacus / art classes",5,15,75,90,8,40,5,60,18],
  ],
  "Creative & Content Services":[
    ["Content & SEO writing",2,10,80,95,15,80,5,45,30],
    ["Ad & social copywriting",2,10,80,95,20,100,6,40,30],
    ["Graphic design",5,15,85,95,15,90,5,45,32],
    ["Video editing (reels / YT)",10,30,80,90,20,120,5,50,35],
    ["Translation & transcription",1,5,85,95,10,50,3,55,25],
    ["Podcast & audio editing",10,20,75,90,12,60,5,40,25],
    ["UI/UX design freelance",10,30,80,92,30,180,8,40,35],
    ["Voice-over artist",8,25,80,92,10,80,7,35,20],
  ],
  "Virtual & Admin":[
    ["Virtual assistant",1,8,80,90,15,60,4,55,35],
    ["Remote bookkeeping (Tally)",1,8,80,90,15,70,5,55,30],
    ["CRM & lead management",2,10,80,90,18,75,5,50,32],
    ["Data entry & web scraping",1,8,75,85,10,40,3,60,30],
    ["Social media management",5,15,80,90,15,90,5,50,30],
  ],
  "Marketing & Commerce":[
    ["Dropshipping (Indian suppliers)",20,60,15,28,15,120,8,20,35],
    ["Affiliate marketing",1,10,50,80,5,100,12,25,25],
    ["Local-business SMM retainers",10,30,80,95,25,120,6,45,32],
    ["SEO consulting",10,25,85,95,25,150,8,40,30],
    ["Google / Meta ads management",10,30,80,95,25,150,7,40,30],
    ["Marketplace seller consulting",10,30,75,90,20,120,7,40,30],
  ],
  "Content & Audience":[
    ["YouTube channel (niche)",8,25,70,90,2,200,24,15,30],
    ["Instagram / short-form",5,15,70,90,2,150,18,15,25],
    ["Blogging (niche)",5,15,70,90,3,80,18,20,20],
    ["Podcasting",10,30,70,85,2,60,20,15,18],
    ["Digital products & courses",10,50,65,85,5,150,12,25,25],
    ["Paid newsletter / community",5,20,75,90,3,80,15,20,18],
  ],
  "Wellness & Coaching":[
    ["Yoga & fitness coaching",5,15,80,95,12,70,6,50,22],
    ["Nutrition consulting",5,15,80,95,15,80,7,45,22],
    ["Online therapy (licensed)",5,15,80,95,25,120,8,55,28],
    ["Career & life coaching",10,20,80,95,15,90,8,40,22],
  ],
  "Tech Services":[
    ["Web development (WP/Shopify)",10,30,70,85,25,150,6,50,35],
    ["Mobile app development",20,50,60,80,35,200,8,45,38],
    ["AI automation & prompt consulting",2,15,85,95,25,180,6,40,30],
    ["Data analytics & dashboards",10,30,75,90,25,150,7,45,32],
    ["Cybersecurity / pen-testing",10,30,70,85,35,200,9,40,32],
    ["No-code automation consulting",5,15,80,92,20,120,6,40,28],
  ],
  "Vocational Training":[
    ["Digital-marketing course creator",10,30,70,90,10,100,9,30,25],
    ["Tally & GST training",5,15,75,90,10,60,6,45,22],
    ["Spoken English coaching",5,15,80,95,10,60,5,55,25],
    ["Coding bootcamp (live cohorts)",20,50,60,80,20,150,9,35,32],
  ],
  "Gig & Field":[
    ["Food-delivery rider",5,15,30,50,15,28,1,85,55],
    ["Cab / auto driving",30,50,30,50,18,40,1,80,60],
    ["Event photography & video",20,50,50,70,15,90,7,45,25],
    ["Handyman services (platforms)",5,20,50,70,18,50,3,70,45],
    ["Platform tutoring",1,5,60,80,12,45,3,65,25],
    ["Insurance advisor (POSP)",2,10,70,90,5,80,10,40,25],
    ["Mutual-fund distributor",5,20,70,90,3,100,15,35,22],
  ],
};

/* Category meta: post-ramp revenue growth [survive, thrive] %, fail salvage %, exit multiple on yr-15 profit */
const META_BIZ={
  "Micro & Home-Based":{g:[5,10],sal:.30,exit:1.5},
  "Manufacturing":{g:[7,12],sal:.40,exit:2.5},
  "Agri & Allied":{g:[5,9],sal:.35,exit:2},
  "Wholesale & Distribution":{g:[6,10],sal:.45,exit:1.5},
  "Retail & F&B":{g:[6,11],sal:.35,exit:2},
  "Services & Logistics":{g:[9,14],sal:.20,exit:1.8},
  "Startups & Digital":{g:[18,35],sal:.10,exit:4},
  "Frontier & Emerging":{g:[12,22],sal:.25,exit:3},
  "Import & Export":{g:[7,12],sal:.35,exit:1.5},
  "Real Estate":{g:[6,10],sal:.40,exit:2},
};
const META_SELF={
  "Teaching & Coaching":{g:[6,10],sal:.15,exit:.5},
  "Creative & Content Services":{g:[8,14],sal:.15,exit:.5},
  "Virtual & Admin":{g:[6,10],sal:.15,exit:.3},
  "Marketing & Commerce":{g:[9,16],sal:.15,exit:1},
  "Content & Audience":{g:[15,30],sal:.10,exit:2.5},
  "Wellness & Coaching":{g:[7,12],sal:.15,exit:.5},
  "Tech Services":{g:[10,16],sal:.15,exit:1},
  "Vocational Training":{g:[8,14],sal:.15,exit:1.5},
  "Gig & Field":{g:[2,4],sal:.25,exit:0},
};
const EDU_PRESETS={
  "B.Tech (private)":{c:1600000,d:4,p:300000},
  "MBA (IIM/ISB)":{c:3000000,d:2,p:1200000},
  "MBBS (private)":{c:9000000,d:6,p:800000},
  "Master's abroad":{c:6000000,d:2,p:1500000},
};

/* Location tiers — three dials: entry cost, market size, margin.
   Tier 2 is the dossier baseline. Illustrative, like everything else. */
const LOC={
  "Metro":{cost:1.25,rev:1.25,m:-3,note:"bigger market, costlier entry, rent squeezes margin"},
  "Tier 2":{cost:1,rev:1,m:0,note:"the dossier baseline"},
  "Tier 3":{cost:0.8,rev:0.72,m:2,note:"cheap to run, smaller market"},
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Engine                                                              */
/* ─────────────────────────────────────────────────────────────────── */
const I_MIN=5000,I_MAX=20000000,T=16;
const posToInv=p=>Math.round(Math.exp(Math.log(I_MIN)+p*(Math.log(I_MAX)-Math.log(I_MIN))));
const invToPos=i=>(Math.log(Math.max(I_MIN,Math.min(I_MAX,i)))-Math.log(I_MIN))/(Math.log(I_MAX)-Math.log(I_MIN));

function unpack(mode,row){
  if(mode==="biz"){const[name,mn,mx,mLo,mHi,turn,ramp,surv,hrs]=row;
    return{name,invMin:mn*1000,invMax:mx*1000,mLo,mHi,turn,ramp,surv,hrs};}
  const[name,mn,mx,mLo,mHi,iLo,iHi,ramp,surv,hrs]=row;
  return{name,invMin:mn*1000,invMax:mx*1000,mLo,mHi,incLo:iLo,incHi:iHi,ramp,surv,hrs};
}
function econAt(mode,v,I,L){
  const min=v.invMin*L.cost, mx=v.invMax*L.cost;
  const cap=mode==="biz"?mx*2.2:mx*3;
  const x=Math.max(0,Math.min(1,(I-min)/(cap-min)));
  const s=1-Math.pow(1-x,1.8);
  let m=v.mLo+(v.mHi-v.mLo)*s+L.m;
  if(mode==="biz"&&I>cap)m=Math.max(v.mLo,m-Math.min(5,((I-cap)/cap)*6));
  m=Math.max(2,Math.min(95,m));
  const rev=(mode==="biz"?Math.min(I,cap)*v.turn:(v.incLo+(v.incHi-v.incLo)*s)*1000*12)*L.rev;
  const ramp=mode==="biz"?v.ramp*(0.85+0.35*x):v.ramp;
  return{margin:m,rev,cap,ramp,x,min,mx};
}
function irrOf(arr){
  const f=r=>{let v=0;for(let t=0;t<arr.length;t++)v+=arr[t]/Math.pow(1+r,t);return v;};
  let pr=-0.9,pv=f(pr);
  for(let r=-0.85;r<=3.0001;r+=0.005){
    const val=f(r);
    if((pv<=0&&val>=0)||(pv>=0&&val<=0)){
      let lo=pr,hi=r;
      for(let i=0;i<70;i++){const mid=(lo+hi)/2,vm=f(mid);
        if(Math.abs(vm)<1)return mid;
        if((f(lo)<0)===(vm<0))lo=mid;else hi=mid;}
      return(lo+hi)/2;}
    pr=r;pv=val;}
  return null;
}
const smooth=f=>f*f*(3-2*f);
/* high growth fades toward a 4% terminal rate — nothing compounds at 35% for 15 years */
const growAt=(g0,k)=>{let f=1;for(let i=0;i<k;i++)f*=1+(4+(g0-4)*Math.pow(0.85,i))/100;return f;};

/* one scenario's incremental stream vs the job */
function scenarioStream(kind,base,fin,g){
  const out=[];
  const cfAt=t=>g.cf*Math.pow(1+g.cfG/100,t);
  const tax=g.tax/100;
  for(let t=0;t<T;t++){
    let v=0;
    if(kind==="fail"){
      if(t===0)v=-fin.equity+base.surviveSteady*0.3*smooth(Math.min(1,0.5/Math.max(0.25,base.rampY)))-cfAt(0)-fin.intYr;
      else if(t===1)v=base.surviveSteady*0.3*smooth(Math.min(1,1.5/Math.max(0.25,base.rampY)))-cfAt(1)-fin.intYr
        +fin.total*fin.sal-fin.debt;   /* salvage the assets; the full debt still comes due */
      else v=0;
    }else{
      const f=smooth(Math.min(1,(t+0.5)/Math.max(0.25,base.rampY)));
      const grow=growAt(base.growth,Math.max(0,t-Math.ceil(base.rampY)));
      let profit=base.steady*f*grow*(1-tax);
      const interest=t<fin.tenure?fin.intYr:0;
      v=profit-interest-cfAt(t);
      if(t===0)v-=fin.equity;
      if(t===T-1&&base.exitMult>0)
        v+=base.steady*grow*base.exitMult;
    }
    out.push(v);
  }
  return out;
}

function computeVenture(mode,cat,idx,I,ov,fin0,g,loc){
  const v=unpack(mode,(mode==="biz"?BIZ:SELF)[cat][idx]);
  const meta=(mode==="biz"?META_BIZ:META_SELF)[cat];
  const L=LOC[loc];
  const Ieff=Math.max(I,v.invMin*L.cost);
  const e=econAt(mode,v,Ieff,L);

  const loanPct=fin0.pct/100, debt=Ieff*loanPct, equity=Ieff-debt;
  let intYr=0,emi=0;
  if(debt>0&&fin0.rate>0&&fin0.tenure>0){
    const im=fin0.rate/100/12,n=fin0.tenure*12;
    emi=(debt*im*Math.pow(1+im,n))/(Math.pow(1+im,n)-1);
    intYr=(emi*n-debt)/fin0.tenure;
  }
  const fin={equity,debt,total:Ieff,intYr,tenure:fin0.tenure,sal:meta.sal,emi};

  const mSurvive=ov.margin??e.margin;
  const surviveSteady=e.rev*mSurvive/100;
  const thriveSteady=e.rev*1.3*Math.min(95,v.mHi+2)/100;
  const gS=ov.growth??meta.g[0], gT=meta.g[1];
  const exitM=ov.exitMult??meta.exit;
  const rampY=e.ramp/12;

  const sT=scenarioStream("thrive",{steady:thriveSteady,rampY:rampY*0.75,growth:gT,exitMult:exitM,surviveSteady},fin,g);
  const sS=scenarioStream("survive",{steady:surviveSteady,rampY,growth:gS,exitMult:exitM,surviveSteady},fin,g);
  const sF=scenarioStream("fail",{steady:0,rampY,growth:0,exitMult:0,surviveSteady},fin,g);

  const pT=(ov.pT??Math.round(v.surv*0.3))/100;
  const pS=(ov.pS??(v.surv-Math.round(v.surv*0.3)))/100;
  const pF=(ov.pF??(100-v.surv))/100;
  const exp=sT.map((_,t)=>pT*sT[t]+pS*sS[t]+pF*sF[t]);

  const cum=a=>{let c=0;return a.map(x=>Math.round(c+=x));};
  const cumT2=cum(sT),cumS=cum(sS),cumF=cum(sF),cumE=cum(exp);
  let cp=0;const cumEPV=exp.map((x,t)=>Math.round(cp+=x/Math.pow(1+g.disc/100,t)));

  const npv=cumEPV[T-1];
  const irr=irrOf(exp);
  let pvB=0,pvC=0;exp.forEach((x,t)=>{const d=Math.pow(1+g.disc/100,t);if(x>=0)pvB+=x/d;else pvC-=x/d;});
  const bcr=pvC>0?pvB/pvC:null;

  let payback=null,acc=0;
  for(let t=0;t<30;t++){
    const f=smooth(Math.min(1,(t+0.5)/Math.max(0.25,rampY)));
    const p=surviveSteady*f*growAt(gS,Math.max(0,t-Math.ceil(rampY)));
    if(acc+p>=Ieff){payback=t+(Ieff-acc)/p;break;}acc+=p;
  }
  let cross=null;
  for(let t=0;t<T;t++)if(cumE[t]>=0){const prev=t===0?0:cumE[t-1];
    cross=t===0?0:(t-1)+(cumE[t]===prev?0:(-prev)/(cumE[t]-prev));break;}

  const hrs=ov.hrs??v.hrs;
  return{v,meta,Ieff,belowMin:I<v.invMin*L.cost,locMin:e.min,locMax:e.mx,e,fin,
    margin:mSurvive,autoMargin:e.margin,surviveSteady,thriveSteady,
    pT:pT*100,pS:pS*100,pF:pF*100,gS,gT,exitM,rampM:Math.round(e.ramp),
    npv,irr,bcr,payback,cross,hourly:surviveSteady/(hrs*g.weeks),jobHourly:g.cf/2000,hrs,
    failLoss:cumF[T-1],cumT:cumT2,cumS,cumF,cumE,cumEPV,
    cum15E:cumE[T-1],cum15T:cumT2[T-1]};
}

/* Monte Carlo on the Survive scenario — growth & margin sampled */
function monteCarlo(mode,cat,idx,I,ov,fin0,g,loc,sigma,N=250){
  const trials=[];
  const meta=(mode==="biz"?META_BIZ:META_SELF)[cat];
  const baseM=ov.margin==null?computeVenture(mode,cat,idx,I,ov,fin0,g,loc).autoMargin:null;
  for(let i=0;i<N;i++){
    const u1=Math.random(),u2=Math.random();
    const z1=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    const z2=Math.sqrt(-2*Math.log(u1))*Math.sin(2*Math.PI*u2);
    const gJ=(ov.growth??meta.g[0])+z1*sigma;
    let ov2={...ov,growth:gJ};
    if(baseM!=null)ov2.margin=Math.max(2,baseM+z2*sigma*0.8);
    trials.push(computeVenture(mode,cat,idx,I,ov2,fin0,g,loc).cumE);
  }
  const out=[];
  for(let t=0;t<T;t++){
    const vals=trials.map(s=>s[t]).sort((a,b)=>a-b);
    const q=p=>vals[Math.max(0,Math.floor(p*N)-1)];
    out.push({p10:q(.1),p90:q(.9)});
  }
  return out;
}

function eduSeries(edu,g){
  const cum=[],cumPV=[];let c=0,cp=0;
  for(let t=0;t<T;t++){
    let v;
    if(t<edu.d)v=-(edu.c/edu.d)-g.cf*Math.pow(1+g.cfG/100,t);
    else v=edu.p*Math.pow(1.07,t-edu.d);
    c+=v;cp+=v/Math.pow(1+g.disc/100,t);
    cum.push(Math.round(c));cumPV.push(Math.round(cp));
  }
  return{cum,cumPV};
}
function marginCurve(mode,v,L){
  const pts=[];
  const min=v.invMin*L.cost;
  for(let i=0;i<=44;i++){const I=posToInv(i/44);
    if(I<min*0.6)continue;
    pts.push({I,m:+econAt(mode,v,Math.max(I,min),L).margin.toFixed(1)});}
  return pts;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  UI atoms                                                            */
/* ─────────────────────────────────────────────────────────────────── */
function Num({label,k,s,set,prefix,suffix,step=1000,hint}){
  return(<label className="fld"><span className="fld-l">{label}</span>
    <span className="fld-in">{prefix&&<span className="aff">{prefix}</span>}
      <input type="number" value={s[k]} min={0} step={step}
        onChange={e=>set(k,e.target.value===""?0:parseFloat(e.target.value))}/>
      {suffix&&<span className="aff aff-r">{suffix}</span>}</span>
    {hint&&<span className="fld-h">{hint}</span>}</label>);
}
function Slider({label,val,onChange,min=0,max=10,step=1,left,right,accent="teal",suffix="",badge}){
  return(<label className="sld"><span className="sld-top">
      <span className="fld-l">{label} {badge}</span>
      <span className={"sld-v "+accent}>{val}{suffix}</span></span>
    <input className={"range "+accent} type="range" min={min} max={max} step={step} value={val}
      onChange={e=>onChange(parseFloat(e.target.value))}
      style={{"--p":((val-min)/(max-min))*100+"%"}}/>
    {(left||right)&&<span className="sld-ends"><i>{left}</i><i>{right}</i></span>}</label>);
}
function Sec({icon,title,sub,children,open,onToggle}){
  return(<section className="sec">
    <button className="sec-h" onClick={onToggle} aria-expanded={open}>
      <span className="sec-icn">{icon}</span>
      <span className="sec-tt"><b>{title}</b><i>{sub}</i></span>
      <span className="sec-chev">{open?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span>
    </button>
    {open&&<div className="sec-b">{children}</div>}</section>);
}
function ProbBar({pT,pS,pF}){
  const sum=Math.round(pT+pS+pF),ok=Math.abs(sum-100)<0.6;
  return(<div className="probbar">
    <div className="pb-track">
      <div className="pb-seg t" style={{width:pT+"%"}}/>
      <div className="pb-seg s" style={{width:pS+"%"}}/>
      <div className="pb-seg f" style={{width:pF+"%"}}/>
    </div>
    <div className={"pb-sum "+(ok?"ok":"err")}>{ok?"✓ 100%":"⚠ "+sum+"% — must total 100"}</div>
  </div>);
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Verdict                                                             */
/* ─────────────────────────────────────────────────────────────────── */
function verdict(A,B,eduName,eduCum15,fin){
  const nm=w=>w==="A"?A.v.name:B.v.name;
  const bits=[];
  const npvWin=A.npv===B.npv?null:A.npv>B.npv?"A":"B";
  const irrWin=(A.irr??-9)===(B.irr??-9)?null:(A.irr??-9)>(B.irr??-9)?"A":"B";
  let tag;
  if(A.cum15E<0&&B.cum15E<0){tag="Neither beats the job";
    bits.push("On expected value, neither venture out-earns simply taking the job over 15 years at this capital.");}
  else if(npvWin&&irrWin&&npvWin!==irrWin){tag="More money vs. better money";
    bits.push(`${nm(npvWin)} builds more expected wealth; ${nm(irrWin)} earns a sharper return on every rupee committed.`);}
  else{const w=npvWin||"A";tag=`${nm(w)} leads`;
    bits.push(`${nm(w)} carries the stronger expected case — ${inr((w==="A"?A:B).npv)} in today's money against ${inr((w==="A"?B:A).npv)}.`);}
  const best=Math.max(A.cum15E,B.cum15E);
  if(best>eduCum15)bits.push(`Both are racing the ${eduName} path, which lands at ${inr(eduCum15)} — the better venture beats it.`);
  else bits.push(`The ${eduName} path still lands higher at ${inr(eduCum15)} — the degree wins the expected case here.`);
  const lev=[["A",A],["B",B]].find(([,m])=>fin.pct>=50&&m.pF>=40);
  if(lev)bits.push(`Caution: at ${fin.pct}% debt, ${nm(lev[0])}'s failure case loses ${inr(Math.abs(lev[1].failLoss))} — leverage cuts both ways.`);
  const cheap=[["A",A],["B",B]].find(([,m])=>m.hourly<m.jobHourly&&m.surviveSteady>0);
  if(cheap)bits.push(`${nm(cheap[0])} prices your hour at ₹${Math.round(cheap[1].hourly)} against ₹${Math.round(cheap[1].jobHourly)} in the job.`);
  return{tag,line:bits.join(" ")};
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main                                                                */
/* ─────────────────────────────────────────────────────────────────── */
const SC={t:"#34c79a",s:"#7eb8f7",f:"#f0a04b"};
const SLOT={A:"#34c79a",B:"#f0a04b"};

export default function App(){
  const[inv,setInv]=useState(1600000);
  const[loc,setLoc]=useState("Tier 2");
  const[fin,setFin]=useState({pct:0,rate:11,tenure:5});
  const[slots,setSlots]=useState({
    A:{mode:"biz",cat:"Retail & F&B",idx:7,ov:{}},        /* Café / QSR franchise */
    B:{mode:"biz",cat:"Startups & Digital",idx:1,ov:{}},  /* D2C brand */
  });
  const[assign,setAssign]=useState("A");
  const[browseMode,setBrowseMode]=useState("biz");
  const[filter,setFilter]=useState("");
  const[view,setView]=useState("compare");
  const[showMC,setShowMC]=useState(false);
  const[showPV,setShowPV]=useState(false);
  const[sigma,setSigma]=useState(3);
  const[eduKey,setEduKey]=useState("B.Tech (private)");
  const[edu,setEdu]=useState({...EDU_PRESETS["B.Tech (private)"]});
  const[g,setG]=useState({cf:250000,cfG:5,disc:8,weeks:50,tax:0});
  const[bm,setBm]=useState({auto:8,ceiling:7,learn:8,status:6,flex:4});
  const[strain,setStrain]=useState({owner:7,family:6});
  const[open,setOpen]=useState({base:false,effort:false,beyond:false});

  const A=useMemo(()=>computeVenture(slots.A.mode,slots.A.cat,slots.A.idx,inv,slots.A.ov,fin,g,loc),[slots.A,inv,fin,g,loc]);
  const B=useMemo(()=>computeVenture(slots.B.mode,slots.B.cat,slots.B.idx,inv,slots.B.ov,fin,g,loc),[slots.B,inv,fin,g,loc]);
  const focus=view==="B"?"B":"A";
  const F=focus==="A"?A:B;
  const fSlot=slots[focus];
  const mc=useMemo(()=>showMC&&view!=="compare"
    ?monteCarlo(fSlot.mode,fSlot.cat,fSlot.idx,inv,fSlot.ov,fin,g,loc,sigma):null,
    [showMC,view,fSlot,inv,fin,g,loc,sigma]);
  const eduCum=useMemo(()=>eduSeries(edu,g),[edu,g]);
  const curve=useMemo(()=>marginCurve(fSlot.mode,F.v,LOC[loc]),[fSlot.mode,F.v,loc]);
  const vd=verdict(A,B,eduKey,eduCum.cum[T-1],fin);

  const DATA=browseMode==="biz"?BIZ:SELF;
  const cats=Object.keys(DATA);
  const unlocked=cats.reduce((n,c)=>n+DATA[c].filter(r=>r[1]*1000*LOC[loc].cost<=inv).length,0);
  const total=cats.reduce((n,c)=>n+DATA[c].length,0);

  const setSlotOv=(slot,patch)=>setSlots(p=>({...p,[slot]:{...p[slot],ov:{...p[slot].ov,...patch}}}));
  const pick=(cat,idx,row)=>{
    if(row[1]*1000*LOC[loc].cost>inv)return;
    setSlots(p=>({...p,[assign]:{mode:browseMode,cat,idx,ov:{}}}));
  };
  const setG1=(k,val)=>setG(p=>({...p,[k]:val}));
  const setP=(slot,key,val)=>{
    const cur=slot==="A"?A:B;
    setSlotOv(slot,{pT:Math.round(cur.pT),pS:Math.round(cur.pS),pF:Math.round(cur.pF),[key]:val});
  };
  const pickEdu=k=>{setEduKey(k);setEdu({...EDU_PRESETS[k]});};
  const setEdu1=(k,val)=>{setEdu(p=>({...p,[k]:val}));setEduKey("Custom");};

  const race=[];
  for(let t=0;t<T;t++){
    const row={year:t,edu:(view==="compare"&&showPV)?eduCum.cumPV[t]:eduCum.cum[t]};
    if(view==="compare"){
      row.a=showPV?A.cumEPV[t]:A.cumE[t];
      row.b=showPV?B.cumEPV[t]:B.cumE[t];
    }else{
      row.thr=F.cumT[t];row.sur=F.cumS[t];row.fail=F.cumF[t];row.exp=F.cumE[t];
      if(mc)row.band=[mc[t].p10,mc[t].p90];
    }
    race.push(row);
  }

  const rows=[
    {label:"Expected value (NPV)",a:A.npv,b:B.npv,fmt:inr,better:"high"},
    {label:"Expected return (IRR)",a:A.irr,b:B.irr,fmt:pct,better:"high"},
    {label:"Return per ₹1 (BCR)",a:A.bcr,b:B.bcr,fmt:x=>x==null?"—":"₹"+x.toFixed(2),better:"high"},
    {label:"Beats the job by",a:A.cross,b:B.cross,fmt:yrs,better:"low"},
    {label:"Capital back (survive)",a:A.payback,b:B.payback,fmt:yrs,better:"low"},
    {label:"Your ₹/hour (survive)",a:A.hourly,b:B.hourly,fmt:x=>"₹"+Math.round(x),better:"high"},
    {label:"Failure-case damage",a:A.failLoss,b:B.failLoss,fmt:inr,better:"high"},
  ];

  const beyond=Math.round(((bm.auto+bm.ceiling+bm.learn+bm.status+bm.flex)/5)*10);
  const strainV=Math.round(((strain.owner+strain.family)/2)*10);

  return(
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot"/> CatalystBox</div>
        <span className="eyebrow">Sibling to the Education Return Calculator</span>
        <h1>Margin</h1>
        <p className="sub">The Business &amp; Self-Employment Return Calculator</p>
        <p className="lede">One pool of money. Two ventures. One degree. Each venture runs three futures — <b style={{color:SC.t}}>Thrive</b>, <b style={{color:"#4a7fb5"}}>Survive</b>, <b style={{color:SC.f}}>Fail</b> — weighted by odds you control, financed the way India actually finances things, and raced against the classroom on one chart. <em>The headline is always the expected case, never the brochure.</em></p>
      </header>

      {/* ── HERO: capital + financing ── */}
      <div className="hero">
        <div className="hero-top">
          <span className="hero-l">Total project size</span>
          <span className="hero-v">{inr(inv)}</span>
        </div>
        <input className="range big" type="range" min={0} max={1000} value={Math.round(invToPos(inv)*1000)}
          onChange={e=>setInv(posToInv(parseInt(e.target.value)/1000))}
          style={{"--p":invToPos(inv)*100+"%"}} aria-label="Total project size"/>
        <div className="hero-ticks">
          {[10000,100000,500000,1600000,5000000,20000000].map(t=>(
            <button key={t} className={"tick "+(Math.abs(inv-t)/t<0.06?"on":"")} onClick={()=>setInv(t)}
              style={{left:invToPos(t)*100+"%"}}>{inrS(t)}</button>))}
        </div>
        <div className="finrow">
          <span className="fin-l"><Landmark size={12}/> Financed</span>
          <input className="range fin" type="range" min={0} max={85} step={5} value={fin.pct}
            onChange={e=>setFin(p=>({...p,pct:+e.target.value}))}
            style={{"--p":(fin.pct/85)*100+"%"}} aria-label="Loan percentage"/>
          <span className="fin-v">{fin.pct}%</span>
          <label className="fin-mini">at <input type="number" value={fin.rate} step={0.5}
            onChange={e=>setFin(p=>({...p,rate:+e.target.value||0}))}/>%</label>
          <label className="fin-mini">for <input type="number" value={fin.tenure} step={1}
            onChange={e=>setFin(p=>({...p,tenure:Math.max(1,+e.target.value||1)}))}/> yrs</label>
        </div>
        <div className="locrow">
          <span className="fin-l"><MapPin size={12}/> Location</span>
          {Object.keys(LOC).map(k=>(
            <button key={k} className={"lchip "+(loc===k?"on":"")} onClick={()=>setLoc(k)}>{k}</button>))}
          <span className="loc-note">{LOC[loc].note}</span>
        </div>
        <div className="hero-note">
          <b>{unlocked}</b>/{total} ventures within reach · your money {inr(A.fin.equity)} + borrowed {inr(A.fin.debt)}
          {A.fin.debt>0&&<> · EMI ≈ {inr(A.fin.emi)}/mo</>}
        </div>
      </div>

      {/* ── venture browser ── */}
      <div className="browser">
        <div className="browser-h">
          <div className="bh-left">
            <span className="browser-t">Ventures at {inr(inv)}</span>
            <div className="bmodes">
              <button className={"bmode "+(browseMode==="biz"?"on":"")} onClick={()=>setBrowseMode("biz")}><Store size={11}/> Business</button>
              <button className={"bmode "+(browseMode==="self"?"on":"")} onClick={()=>setBrowseMode("self")}><Laptop size={11}/> Self-employed</button>
            </div>
          </div>
          <div className="bh-right">
            <span className="assign">Pick into
              <button className={"as-b "+(assign==="A"?"on":"")} style={assign==="A"?{background:SLOT.A}:{}} onClick={()=>setAssign("A")}>A</button>
              <button className={"as-b "+(assign==="B"?"on":"")} style={assign==="B"?{background:SLOT.B}:{}} onClick={()=>setAssign("B")}>B</button>
            </span>
            <span className="search"><Search size={12}/><input placeholder="Filter…" value={filter} onChange={e=>setFilter(e.target.value)}/></span>
          </div>
        </div>
        {cats.map(cat=>{
          const list=DATA[cat].map((r,i)=>({r,i})).filter(({r})=>!filter||r[0].toLowerCase().includes(filter.toLowerCase()));
          if(!list.length)return null;
          return(<div key={cat} className="cat">
            <div className="cat-l">{cat}</div>
            <div className="chips">
              {list.map(({r,i})=>{
                const locPrice=r[1]*1000*LOC[loc].cost;
                const locked=locPrice>inv;
                const isA=slots.A.mode===browseMode&&slots.A.cat===cat&&slots.A.idx===i;
                const isB=slots.B.mode===browseMode&&slots.B.cat===cat&&slots.B.idx===i;
                return(<button key={r[0]} className={"vchip"+(locked?" lock":"")+(isA?" selA":"")+(isB?" selB":"")}
                  onClick={()=>pick(cat,i,r)} title={locked?`Unlocks at ${inr(locPrice)} in a ${loc.toLowerCase()} location`:r[0]}>
                  {isA&&<i className="slotdot" style={{background:SLOT.A}}/>}
                  {isB&&<i className="slotdot" style={{background:SLOT.B}}/>}
                  {locked&&<Lock size={9}/>}{r[0]}
                  {locked&&<i className="from"> from {inrS(locPrice)}</i>}
                </button>);})}
            </div>
          </div>);})}
      </div>

      <div className="layout">
        {/* ══ CONTROLS ══ */}
        <div className="controls">
          <div className="seg">
            <span className="seg-l">Fine-tune</span>
            {["A","B"].map(s=>(
              <button key={s} className={"seg-b "+(assign===s?"on":"")}
                style={assign===s?{background:SLOT[s]}:{}} onClick={()=>setAssign(s)}>
                {s} · {(s==="A"?A:B).v.name}</button>))}
          </div>
          <div className="ctrl-inner" style={{borderColor:SLOT[assign]}}>
            {(()=>{const M=assign==="A"?A:B,sl=slots[assign];return(<>
              {M.belowMin&&<div className="warn"><AlertTriangle size={11}/> Below this venture's {loc} minimum — priced at {inr(M.locMin)}.</div>}

              <div className="scenhead">Three futures — odds must total 100%</div>
              <ProbBar pT={M.pT} pS={M.pS} pF={M.pF}/>
              <div className="grid3">
                <label className="fld"><span className="fld-l" style={{color:SC.t}}>Thrive %</span>
                  <span className="fld-in"><input type="number" value={Math.round(M.pT)} min={0} max={100}
                    onChange={e=>setP(assign,"pT",+e.target.value||0)}/></span></label>
                <label className="fld"><span className="fld-l" style={{color:"#4a7fb5"}}>Survive %</span>
                  <span className="fld-in"><input type="number" value={Math.round(M.pS)} min={0} max={100}
                    onChange={e=>setP(assign,"pS",+e.target.value||0)}/></span></label>
                <label className="fld"><span className="fld-l" style={{color:SC.f}}>Fail %</span>
                  <span className="fld-in"><input type="number" value={Math.round(M.pF)} min={0} max={100}
                    onChange={e=>setP(assign,"pF",+e.target.value||0)}/></span></label>
              </div>

              <Slider label="Survive margin" badge={<em className={"auto-b "+(sl.ov.margin==null?"a":"c")}>{sl.ov.margin==null?"AUTO":"CUSTOM"}</em>}
                val={+M.margin.toFixed(1)} min={Math.max(1,M.v.mLo-8)} max={Math.min(95,M.v.mHi+8)} step={0.5} suffix="%"
                accent="teal" left="lean" right="rich" onChange={x=>setSlotOv(assign,{margin:x})}/>
              {sl.ov.margin!=null&&<button className="reset" onClick={()=>setSlotOv(assign,{margin:undefined})}>
                <RotateCcw size={10}/> back to auto ({M.autoMargin.toFixed(1)}%)</button>}

              <div className="grid3">
                <Num label="Growth %/yr (survive)" k="growth" s={{growth:M.gS}} set={(k,v2)=>setSlotOv(assign,{growth:v2})} step={1} suffix="%"/>
                <Num label="Exit multiple (yr 15)" k="exitMult" s={{exitMult:M.exitM}} set={(k,v2)=>setSlotOv(assign,{exitMult:v2})} step={0.5} suffix="×"/>
                <Num label="Your hrs / wk" k="hrs" s={{hrs:M.hrs}} set={(k,v2)=>setSlotOv(assign,{hrs:v2})} step={1}/>
              </div>
              <div className="mini">Thrive runs at the top of the margin band, 1.3× revenue, {M.gT}%/yr growth, faster ramp. Fail = 2 lean years, {Math.round(M.meta.sal*100)}% asset salvage, and the full debt still comes due. Growth fades toward 4% — nothing compounds forever. All seeds from the dossier — set your honest numbers.</div>
            </>);})()}
          </div>

          <Sec icon={<Wallet size={16}/>} title="Your baseline" sub="The job you'd otherwise take"
            open={open.base} onToggle={()=>setOpen(p=>({...p,base:!p.base}))}>
            <div className="grid2">
              <Num label="Job salary you'd give up / yr" k="cf" s={g} set={setG1} prefix="₹"/>
              <Num label="Its yearly growth" k="cfG" s={g} set={setG1} step={1} suffix="%"/>
            </div>
            <div className="grid3">
              <Num label="Discount rate" k="disc" s={g} set={setG1} step={0.5} suffix="%"/>
              <Num label="Tax on profits" k="tax" s={g} set={setG1} step={5} suffix="%"/>
              <Num label="Weeks / yr" k="weeks" s={g} set={setG1} step={1}/>
            </div>
          </Sec>

          <Sec icon={<Clock size={16}/>} title="Strain" sub="What the hustle costs the household"
            open={open.effort} onToggle={()=>setOpen(p=>({...p,effort:!p.effort}))}>
            <Slider label="Owner stress & risk load" val={strain.owner} onChange={x=>setStrain(p=>({...p,owner:x}))} accent="amber" left="light" right="heavy"/>
            <Slider label="Family strain" val={strain.family} onChange={x=>setStrain(p=>({...p,family:x}))} accent="amber" left="light" right="heavy"/>
          </Sec>

          <Sec icon={<Sparkles size={16}/>} title="Beyond money" sub="Rated 0–10 · kept separate from the rupees"
            open={open.beyond} onToggle={()=>setOpen(p=>({...p,beyond:!p.beyond}))}>
            <Slider label="Autonomy & control" val={bm.auto} onChange={x=>setBm(p=>({...p,auto:x}))} accent="teal"/>
            <Slider label="Wealth ceiling (upside)" val={bm.ceiling} onChange={x=>setBm(p=>({...p,ceiling:x}))} accent="teal"/>
            <Slider label="Learning & skill compounding" val={bm.learn} onChange={x=>setBm(p=>({...p,learn:x}))} accent="teal"/>
            <Slider label="Status & identity" val={bm.status} onChange={x=>setBm(p=>({...p,status:x}))} accent="teal"/>
            <Slider label="Flexibility & family time" val={bm.flex} onChange={x=>setBm(p=>({...p,flex:x}))} accent="teal"/>
          </Sec>
        </div>

        {/* ══ RESULT ══ */}
        <div className="result">
          <div className="verdict">
            <span className="v-icn"><Swords size={15}/></span>
            <div><span className="v-tag">{vd.tag}</span><p>{vd.line}</p></div>
          </div>

          <div className="view-tog">
            {[["compare","Compare"],["A",A.v.name],["B",B.v.name]].map(([k,lbl])=>(
              <button key={k} className={"vt "+(view===k?"on":"")}
                style={view===k&&k!=="compare"?{background:SLOT[k],borderColor:"transparent",color:"#0a0d14"}:{}}
                onClick={()=>setView(k)}>{lbl}</button>))}
          </div>

          {/* wealth race */}
          <div className="chart">
            <div className="chart-h">
              <span>{view==="compare"?"15-year wealth race — everything vs. the job":"Three futures — "+F.v.name}</span>
              <div className="chart-btns">
                {view!=="compare"&&<button className={"pv "+(showMC?"on":"")} onClick={()=>setShowMC(x=>!x)}><BarChart2 size={11}/> {showMC?"Hide band":"Uncertainty"}</button>}
                {view==="compare"&&<button className="pv" onClick={()=>setShowPV(x=>!x)}>{showPV?"Today's ₹":"Cash"}</button>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={236}>
              <ComposedChart data={race} margin={{top:8,right:12,bottom:2,left:6}}>
                <defs><linearGradient id="mcband" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7eb8f7" stopOpacity={.22}/>
                  <stop offset="100%" stopColor="#7eb8f7" stopOpacity={.04}/></linearGradient></defs>
                <CartesianGrid stroke="#2a313d" strokeDasharray="2 4" vertical={false}/>
                <XAxis dataKey="year" tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false} axisLine={{stroke:"#2a313d"}}
                  label={{value:"years",position:"insideBottom",offset:-1,fill:"#6b7682",fontSize:10}}/>
                <YAxis tickFormatter={inrS} tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false} axisLine={false} width={50}/>
                <Tooltip contentStyle={{background:"#0d1219",border:"1px solid #2a313d",borderRadius:10,fontSize:12,fontFamily:"DM Mono, monospace"}}
                  labelFormatter={l=>"Year "+l}
                  formatter={(val,n)=>{
                    const names={a:A.v.name,b:B.v.name,edu:eduKey,thr:"Thrive",sur:"Survive",fail:"Fail",exp:"Expected",band:"10–90th pct"};
                    return[Array.isArray(val)?inr(val[0])+" – "+inr(val[1]):inr(val),names[n]||n];}}/>
                <ReferenceLine y={0} stroke="#4a525e" strokeWidth={1}/>
                {view!=="compare"&&showMC&&<Area type="monotone" dataKey="band" stroke="none" fill="url(#mcband)"/>}
                {view==="compare"?(<>
                  <Line type="monotone" dataKey="a" stroke={SLOT.A} strokeWidth={2.4} dot={false}/>
                  <Line type="monotone" dataKey="b" stroke={SLOT.B} strokeWidth={2.4} dot={false}/>
                </>):(<>
                  <Line type="monotone" dataKey="thr" stroke={SC.t} strokeWidth={1.8} dot={false}/>
                  <Line type="monotone" dataKey="sur" stroke={SC.s} strokeWidth={2.4} dot={false}/>
                  <Line type="monotone" dataKey="fail" stroke={SC.f} strokeWidth={1.6} strokeDasharray="4 3" dot={false}/>
                  <Line type="monotone" dataKey="exp" stroke="#fff" strokeWidth={2} strokeDasharray="2 3" dot={false}/>
                </>)}
                <Line type="monotone" dataKey="edu" stroke="#c99df0" strokeWidth={2.2} dot={false}/>
                {view==="compare"&&A.cross!=null&&<ReferenceDot x={A.cross} y={0} r={5} fill={SLOT.A} stroke="#0a0d14" strokeWidth={2}/>}
                {view==="compare"&&B.cross!=null&&<ReferenceDot x={B.cross} y={0} r={5} fill={SLOT.B} stroke="#0a0d14" strokeWidth={2}/>}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="legend">
              {view==="compare"?(<>
                <span><i className="sw" style={{background:SLOT.A}}/>{A.v.name} (expected)</span>
                <span><i className="sw" style={{background:SLOT.B}}/>{B.v.name} (expected)</span>
              </>):(<>
                <span><i className="sw" style={{background:SC.t}}/>Thrive</span>
                <span><i className="sw" style={{background:SC.s}}/>Survive</span>
                <span><i className="sw" style={{background:SC.f}}/>Fail</span>
                <span><i className="sw" style={{background:"#fff",opacity:.7}}/>Expected</span>
                {showMC&&<span><i className="sw" style={{background:"#7eb8f7",opacity:.4}}/>±{sigma}% band</span>}
              </>)}
              <span><i className="sw" style={{background:"#c99df0"}}/>{eduKey}</span>
              <span><i className="dotmark"/>beats the job</span>
            </div>
            {view!=="compare"&&showMC&&
              <Slider label="Outcome spread (Monte Carlo σ)" val={sigma} min={0} max={8} step={0.5} suffix="%"
                accent="amber" left="stable trade" right="volatile bet" onChange={setSigma}/>}
          </div>

          {view==="compare"?(
            <div className="h2h">
              <div className="h2h-key"><span style={{color:SLOT.A}}>◀ {A.v.name}</span><span style={{color:SLOT.B}}>{B.v.name} ▶</span></div>
              {rows.map(row=>{
                const mx=Math.max(Math.abs(row.a??0),Math.abs(row.b??0),1e-9);
                const pa=(Math.abs(row.a??0)/mx)*100,pb=(Math.abs(row.b??0)/mx)*100;
                const av=row.a??(row.better==="low"?Infinity:-Infinity);
                const bv=row.b??(row.better==="low"?Infinity:-Infinity);
                const winA=row.better==="low"?av<bv:av>bv;
                return(<div className="h2h-row" key={row.label}>
                  <div className="h2h-top">
                    <span className={"h2h-v a"+(winA?" w":"")}>{row.fmt(row.a)}</span>
                    <b>{row.label}{row.better==="low"&&<i> ↓</i>}</b>
                    <span className={"h2h-v b"+(!winA?" w":"")}>{row.fmt(row.b)}</span>
                  </div>
                  <div className="h2h-track">
                    <div className="h2h-left"><i style={{width:pa+"%",background:SLOT.A,opacity:winA?1:.4}}/></div>
                    <div className="h2h-right"><i style={{width:pb+"%",background:SLOT.B,opacity:!winA?1:.4}}/></div>
                  </div>
                </div>);})}
            </div>
          ):(<>
            <div className="scen-tiles">
              {[["Thrive",F.pT,F.cumT[T-1],SC.t],["Survive",F.pS,F.cumS[T-1],SC.s],["Fail",F.pF,F.cumF[T-1],SC.f]].map(([l,p,val,c])=>(
                <div key={l} className="scen-tile" style={{borderColor:c+"44"}}>
                  <div className="st-top"><span className="st-label" style={{color:c}}>{l}</span><span className="st-sub">{Math.round(p)}%</span></div>
                  <div className="st-npv" style={{color:val>=0?c:"#f0604b"}}>{inr(val)}</div>
                  <div className="st-meta">15-yr wealth vs job</div>
                </div>))}
              <div className="exp-tile">
                <span className="exp-l">Expected (NPV)</span>
                <span className={"exp-v "+(F.npv>=0?"pos":"neg")}>{inr(F.npv)}</span>
                <span className="exp-s">{pct(F.irr)} IRR · BCR {F.bcr==null?"—":"₹"+F.bcr.toFixed(2)}</span>
              </div>
            </div>
            <div className="chart">
              <div className="chart-h"><span>Margin vs. money in — economies of scale</span></div>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={curve} margin={{top:8,right:12,bottom:2,left:2}}>
                  <CartesianGrid stroke="#2a313d" strokeDasharray="2 4" vertical={false}/>
                  <XAxis dataKey="I" type="number" scale="log" domain={["dataMin","dataMax"]}
                    tickFormatter={inrS} tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false}
                    axisLine={{stroke:"#2a313d"}} ticks={[10000,100000,1000000,10000000].filter(t=>t>=curve[0]?.I)}/>
                  <YAxis tickFormatter={x=>x+"%"} tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false}
                    axisLine={false} width={40} domain={[0,Math.min(100,F.v.mHi+12)]}/>
                  <Tooltip contentStyle={{background:"#0d1219",border:"1px solid #2a313d",borderRadius:10,fontSize:12,fontFamily:"DM Mono, monospace"}}
                    labelFormatter={l=>"At "+inr(l)} formatter={val=>[val+"%","net margin"]}/>
                  <ReferenceArea x1={F.locMin} x2={F.locMax} fill="#34c79a" fillOpacity={.07}/>
                  <Line type="monotone" dataKey="m" stroke="#34c79a" strokeWidth={2.4} dot={false}/>
                  <ReferenceDot x={F.Ieff} y={+F.autoMargin.toFixed(1)} r={5} fill="#E8922A" stroke="#0a0d14" strokeWidth={2}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>)}

          <div className="tiles">
            <div className="tile"><span className="t-l"><TrendingUp size={12}/> Survive margin</span>
              <span className="t-v">{pc1(F.margin)}</span><span className="t-s">auto-scales with project size</span></div>
            <div className="tile"><span className="t-l"><Wallet size={12}/> Profit / yr (survive)</span>
              <span className="t-v pos">{inr(F.surviveSteady)}</span><span className="t-s">{inr(F.thriveSteady)} if it thrives</span></div>
            <div className="tile"><span className="t-l"><Clock size={12}/> Time bucket</span>
              <span className="t-v">{F.rampM} mo</span><span className="t-s">to steady margin · capital back {yrs(F.payback)}</span></div>
            <div className="tile"><span className="t-l"><Zap size={12}/> Your hour, priced</span>
              <span className={"t-v "+(F.hourly>=F.jobHourly?"pos":"warn")}>₹{Math.round(F.hourly).toLocaleString("en-IN")}</span>
              <span className="t-s">vs ₹{Math.round(F.jobHourly).toLocaleString("en-IN")}/hr in the job</span></div>
          </div>

          <div className="edub">
            <div className="edub-h"><GraduationCap size={13}/> The same money in a classroom</div>
            <div className="edub-chips">
              {Object.keys(EDU_PRESETS).map(k=>(
                <button key={k} className={"echip "+(eduKey===k?"on":"")} onClick={()=>pickEdu(k)}>{k}</button>))}
              {eduKey==="Custom"&&<span className="echip on">Custom</span>}
            </div>
            <div className="edub-fields">
              <label>Cost <input type="number" value={edu.c} step={100000} onChange={e=>setEdu1("c",+e.target.value||0)}/></label>
              <label>Years <input type="number" value={edu.d} step={1} onChange={e=>setEdu1("d",Math.max(1,+e.target.value||1))}/></label>
              <label>Premium/yr <input type="number" value={edu.p} step={50000} onChange={e=>setEdu1("p",+e.target.value||0)}/></label>
            </div>
          </div>

          <div className="human">
            <span>Beyond money <b>{beyond}/100</b></span><span className="hm-sep"/>
            <span>Strain <b className="warn">{strainV}/100</b></span><span className="hm-sep"/>
            <span>{F.hrs} hrs/wk · {(F.hrs*g.weeks).toLocaleString("en-IN")} hrs/yr of your life</span>
          </div>
          <div className="assump">
            expected = probability-weighted across three futures · fail = 2 lean yrs, {Math.round(F.meta.sal*100)}% salvage, debt settled · exit ×{F.exitM} on yr-15 profit · {loc} economics · all vs. the job baseline
          </div>
        </div>
      </div>

      <footer className="meth">
        <div className="meth-h"><Zap size={13}/> How Margin is built</div>
        <p>Every venture is priced against the same honest baseline — <b>just taking the job</b> — and runs <b>three futures</b>: Thrive (top of the margin band, 1.3× revenue, faster ramp, category-high growth), Survive (the economies-of-scale margin at your project size, category-median growth), and Fail (two lean years, a category-specific asset salvage, and the <b>full debt still coming due</b> — leverage cuts both ways). The headline <b>NPV, IRR, and BCR</b> are computed on the probability-weighted expected stream. Surviving businesses <b>grow</b>: post-ramp profits compound at an editable rate that fades toward a 4% terminal — nothing grows at 35% forever — and a thriving venture is a <b>sellable asset</b> — an exit multiple on year-15 profit that self-employment mostly can't match, because you cannot sell your own hours. <b>Financing</b> works the way India finances things: choose how much of the project is borrowed, and interest drags the early years while failure with debt hurts more than failure without it. <b>Monte Carlo</b> jitters the Survive scenario's growth and margin across 250 trials to draw the 10th–90th percentile band. <b>Location</b> moves three dials at once: a Tier-1 metro raises entry costs and market size but lets rent and labour squeeze the margin; a Tier-3 town does the reverse — so switching location changes which ventures even unlock at your money. Fully-online self-employment travels; keep Tier 2 for remote income. The education benchmark runs the same money through a simplified degree path on the same chart. One question, answered three ways: what does this money build?</p>
        <p className="disc">Every figure — bands, margins, turnover, growth, salvage, exit multiples, survival odds, education premiums — is an illustrative, editable seed from the opportunity dossier, not a forecast. The dossier's assumption sets apply: stable macro (GDP 6–7%, inflation 4–6%), stable GST/Udyam/FSSAI regimes, materials within ±15%, credit at 8–12% via Mudra/PMEGP-type schemes, reliable UPI and connectivity, a full-time founder with runway, no prolonged shocks. If an assumption fails in your reality, re-evaluate before you commit. Not financial advice.</p>
        <div className="sign"><span className="dot"/> No agenda in the output. All agency in the decision.</div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
:root{--ink:#0a0d14;--ink-3:#11161f;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;}
*{box-sizing:border-box;margin:0;padding:0}
.wrap{background:var(--parch);color:var(--tx);font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;padding:22px 16px 40px;max-width:1200px;margin:0 auto}
.wrap h1{font-family:'Syne',sans-serif;letter-spacing:-0.02em}
.top{margin-bottom:16px}
.brand{display:inline-flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;letter-spacing:.04em;color:var(--teal);text-transform:uppercase;margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block;box-shadow:0 0 0 3px rgba(232,146,42,.18)}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--clay);display:block}
.top h1{font-size:clamp(42px,9vw,74px);font-weight:800;line-height:.95;color:var(--ink);margin:6px 0 2px}
.sub{font-family:'Syne';font-weight:700;font-size:clamp(14px,2.6vw,19px);color:var(--teal);margin-bottom:10px}
.lede{max-width:70ch;color:var(--tx-soft);font-size:15px}
.lede em{font-style:italic;color:var(--clay);font-weight:600}

.hero{background:var(--ink);border-radius:18px;padding:20px 22px 16px;margin:16px 0 14px;position:relative;box-shadow:0 20px 44px -26px rgba(10,13,20,.7)}
.hero-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;flex-wrap:wrap;gap:6px}
.hero-l{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7e8896}
.hero-v{font-family:'DM Mono';font-size:clamp(26px,5vw,38px);font-weight:500;color:#fff}
.range{-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;outline:0;cursor:pointer;width:100%}
.range.big{height:9px;background:linear-gradient(90deg,var(--teal-line) var(--p),#242c38 var(--p))}
.range.big::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid var(--amber);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.range.big::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--amber);cursor:pointer}
.hero-ticks{position:relative;height:20px;margin-top:10px}
.tick{position:absolute;transform:translateX(-50%);font-family:'DM Mono';font-size:10px;color:#6b7682;background:none;border:0;cursor:pointer;padding:2px 4px;white-space:nowrap}
.tick:hover{color:#aeb6c0}.tick.on{color:var(--amber);font-weight:500}
.finrow{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap;border-top:1px solid #1e2530;padding-top:12px}
.fin-l{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#7e8896;flex:none}
.range.fin{flex:1;min-width:120px;height:6px;background:linear-gradient(90deg,#f0a04b var(--p),#242c38 var(--p))}
.range.fin::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid #f0a04b;cursor:pointer}
.range.fin::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #f0a04b;cursor:pointer}
.fin-v{font-family:'DM Mono';font-size:14px;color:#f0a04b;min-width:36px}
.fin-mini{display:flex;align-items:center;gap:4px;font-size:10.5px;color:#7e8896}
.fin-mini input{width:44px;font-family:'DM Mono';font-size:11px;background:#10151d;border:1px solid #2a313d;border-radius:6px;padding:3px 5px;color:#e8ebef;outline:0}
.locrow{display:flex;align-items:center;gap:8px;margin-top:11px;flex-wrap:wrap}
.lchip{font-family:'Syne';font-weight:700;font-size:11px;padding:5px 12px;border-radius:999px;border:1px solid #2a313d;background:#10151d;color:#7e8896;cursor:pointer;transition:.15s}
.lchip:hover{border-color:#4a525e;color:#bbc3cc}
.lchip.on{background:var(--teal-line);border-color:var(--teal-line);color:#0a0d14}
.loc-note{font-size:10px;color:#6b7682;font-style:italic}
.hero-note{font-size:11px;color:#7e8896;margin-top:10px}
.hero-note b{color:var(--teal-line);font-family:'DM Mono'}

.browser{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:14px 16px;margin-bottom:16px;max-height:290px;overflow-y:auto}
.browser-h{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;position:sticky;top:-14px;background:var(--paper);padding:6px 0;z-index:2;flex-wrap:wrap}
.bh-left,.bh-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.browser-t{font-family:'Syne';font-weight:700;font-size:13.5px;color:var(--ink)}
.bmodes{display:flex;gap:4px}
.bmode{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer}
.bmode.on{background:var(--teal);border-color:var(--teal);color:#fff}
.assign{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--tx-mut);font-weight:600}
.as-b{width:24px;height:24px;border-radius:7px;border:1px solid var(--line);background:#fff;font-family:'Syne';font-weight:800;font-size:12px;color:var(--tx-soft);cursor:pointer}
.as-b.on{color:#fff;border-color:transparent}
.search{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:8px;padding:4px 8px;color:var(--tx-mut)}
.search input{border:0;outline:0;background:none;font-size:12px;width:80px;color:var(--ink)}
.cat{margin-bottom:10px}
.cat-l{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);margin-bottom:6px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.vchip{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.13s}
.vchip:hover{border-color:var(--teal);color:var(--teal)}
.vchip.selA{border-color:#34c79a;box-shadow:0 0 0 1.5px #34c79a inset}
.vchip.selB{border-color:#f0a04b;box-shadow:0 0 0 1.5px #f0a04b inset}
.vchip.lock{opacity:.42;cursor:default;background:var(--parch)}
.vchip.lock:hover{border-color:var(--line);color:var(--tx-soft)}
.vchip .from{font-style:normal;font-family:'DM Mono';font-size:9.5px;color:var(--tx-mut)}
.slotdot{width:8px;height:8px;border-radius:50%;display:inline-block}

.layout{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:1000px){.layout{grid-template-columns:1fr 1.2fr;align-items:start}.result{position:sticky;top:14px}}

.controls{display:flex;flex-direction:column;gap:11px}
.seg{display:flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--line);border-radius:12px 12px 0 0;padding:8px 10px;border-bottom:0;margin-bottom:0}
.seg-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tx-mut);margin-right:2px;flex:none}
.seg-b{flex:1;font-family:'Syne';font-weight:700;font-size:11px;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seg-b.on{color:#fff;border-color:transparent}
.ctrl-inner{display:flex;flex-direction:column;border:2px solid;border-radius:0 0 14px 14px;border-top:0;padding:13px;transition:border-color .2s;background:var(--paper)}
.scenhead{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--clay);margin-bottom:4px}
.warn{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--clay);background:var(--amber-tint);border-radius:8px;padding:7px 10px;margin-bottom:8px}
.auto-b{font-style:normal;font-family:'DM Mono';font-size:9px;letter-spacing:.06em;padding:2px 6px;border-radius:99px;margin-left:5px}
.auto-b.a{background:var(--teal-tint);color:var(--teal)}
.auto-b.c{background:var(--amber-tint);color:var(--clay)}
.reset{display:inline-flex;align-items:center;gap:4px;font-family:'DM Mono';font-size:10px;color:var(--teal);background:none;border:0;cursor:pointer;margin-top:4px;padding:0}
.mini{font-size:11px;color:var(--tx-mut);margin-top:12px;line-height:1.45}
.probbar{margin:8px 0 4px}
.pb-track{height:10px;background:#e4dccb;border-radius:99px;display:flex;overflow:hidden;margin-bottom:5px}
.pb-seg{height:100%;transition:width .3s}
.pb-seg.t{background:#34c79a}.pb-seg.s{background:#7eb8f7}.pb-seg.f{background:#f0a04b}
.pb-sum{font-family:'DM Mono';font-size:11px;text-align:right}
.pb-sum.ok{color:var(--teal)}.pb-sum.err{color:var(--clay)}

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
.sld{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.sld-top{display:flex;justify-content:space-between;align-items:baseline}
.sld-v{font-family:'DM Mono';font-size:13.5px}
.sld-v.teal{color:var(--teal)}.sld-v.amber{color:var(--clay)}
.range.teal{background:linear-gradient(90deg,var(--teal) var(--p),#e4dccb var(--p))}
.range.amber{background:linear-gradient(90deg,var(--amber) var(--p),#e4dccb var(--p))}
.range.teal::-webkit-slider-thumb,.range.amber::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.range.teal::-moz-range-thumb,.range.amber::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer}
.sld-ends{display:flex;justify-content:space-between}
.sld-ends i{font-style:normal;font-size:10px;color:var(--tx-mut)}

.result{background:var(--ink);border-radius:18px;padding:20px;color:#e8ebef;position:relative;overflow:hidden;box-shadow:0 24px 50px -28px rgba(10,13,20,.7)}
.result::before{content:'';position:absolute;top:-60px;right:-40px;width:240px;height:240px;background:radial-gradient(circle,rgba(52,199,154,.13),transparent 70%);pointer-events:none}
.result .sld .fld-l{color:#9aa3ad}
.result .sld-ends i{color:#6b7682}
.result .sld-v.amber{color:#f0a04b}
.result .range.amber{background:linear-gradient(90deg,#f0a04b var(--p),#242c38 var(--p))}
.verdict{display:flex;gap:11px;position:relative;margin-bottom:12px}
.v-icn{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;background:#1a212b;color:#f0a04b}
.v-tag{font-family:'Syne';font-weight:700;font-size:clamp(16px,2.4vw,20px);line-height:1.14;color:#fff;letter-spacing:-0.02em}
.verdict p{font-size:12px;color:#9aa3ad;margin:6px 0 0;line-height:1.55}
.view-tog{display:flex;gap:6px;margin-bottom:14px;position:relative}
.vt{flex:1;font-family:'Syne';font-weight:700;font-size:11px;padding:7px 8px;border-radius:9px;border:1px solid #2a313d;background:#10151d;color:#7e8896;cursor:pointer;transition:.15s;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vt:hover{border-color:#4a525e;color:#bbc3cc}
.vt.on{background:#1e2530;border-color:#4a525e;color:#fff}

.chart{margin-bottom:14px;position:relative}
.chart-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.chart-h span{font-size:11px;font-weight:600;color:#9aa3ad}
.chart-btns{display:flex;gap:6px}
.pv{font-family:'DM Mono';font-size:10px;color:var(--teal-line);background:rgba(52,199,154,.08);border:1px solid rgba(52,199,154,.22);border-radius:7px;padding:4px 8px;cursor:pointer;display:flex;align-items:center;gap:4px}
.pv:hover,.pv.on{background:rgba(52,199,154,.18)}
.legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;justify-content:center}
.legend span{display:flex;align-items:center;gap:5px;font-size:10px;color:#7e8896}
.sw{width:10px;height:10px;border-radius:3px;display:inline-block}
.dotmark{width:8px;height:8px;border-radius:50%;background:#fff;border:2px solid #6b7682;display:inline-block}

.h2h{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:13px 14px 8px;margin-bottom:14px}
.h2h-key{display:flex;justify-content:space-between;font-size:10.5px;font-weight:600;margin-bottom:11px}
.h2h-row{margin-bottom:12px}
.h2h-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:4px}
.h2h-top b{font-weight:500;font-size:11px;color:#7e8896;text-align:center;flex:none}
.h2h-top b i{font-style:normal;color:#5a6470}
.h2h-v{font-family:'DM Mono';font-size:13px;color:#9aa3ad;flex:1}
.h2h-v.a{text-align:left}.h2h-v.b{text-align:right}
.h2h-v.a.w{color:#34c79a;font-weight:500}.h2h-v.b.w{color:#f0a04b;font-weight:500}
.h2h-track{display:flex;height:6px;gap:2px}
.h2h-left{width:50%;display:flex;justify-content:flex-end}.h2h-right{width:50%}
.h2h-left i,.h2h-right i{height:100%;display:block;transition:width .35s,opacity .2s}
.h2h-left i{border-radius:99px 0 0 99px}.h2h-right i{border-radius:0 99px 99px 0}

.scen-tiles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;position:relative}
@media(max-width:520px){.scen-tiles{grid-template-columns:1fr}}
.scen-tile{border:1px solid;border-radius:12px;padding:11px;background:var(--ink-3)}
.st-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}
.st-label{font-family:'Syne';font-weight:700;font-size:12.5px}
.st-sub{font-size:10px;color:#7e8896;font-family:'DM Mono'}
.st-npv{font-family:'DM Mono';font-size:16.5px;font-weight:500;margin-bottom:3px}
.st-meta{font-size:9.5px;color:#6b7682}
.exp-tile{grid-column:1/-1;background:#10151d;border:1px solid #1e2530;border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.exp-l{font-size:11px;color:#7e8896;flex:none}
.exp-v{font-family:'DM Mono';font-size:19px;font-weight:500;flex:1}
.exp-v.pos{color:var(--teal-line)}.exp-v.neg{color:#f0604b}
.exp-s{font-size:11px;color:#7e8896;font-family:'DM Mono';flex:none}

.tiles{display:grid;grid-template-columns:1fr 1fr;gap:9px;position:relative;margin-bottom:14px}
.tile{background:var(--ink-3);border:1px solid #1e2530;border-radius:12px;padding:12px}
.t-l{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#7e8896}
.t-v{display:block;font-family:'DM Mono';font-size:20px;font-weight:500;margin:4px 0 1px;color:#fff}
.t-v.pos{color:var(--teal-line)}.t-v.warn{color:#f0a04b}
.t-s{font-size:10px;color:#6b7682;line-height:1.35;display:block}

.edub{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:12px 14px;margin-bottom:12px}
.edub-h{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#7e8896;margin-bottom:9px}
.edub-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.echip{font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;border:1px solid #2a313d;background:#10151d;color:#7e8896;cursor:pointer}
.echip.on{background:#c99df0;border-color:#c99df0;color:#0a0d14}
.edub-fields{display:flex;gap:8px;flex-wrap:wrap}
.edub-fields label{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#7e8896}
.edub-fields input{width:88px;font-family:'DM Mono';font-size:11.5px;background:#10151d;border:1px solid #2a313d;border-radius:7px;padding:5px 7px;color:#e8ebef;outline:0}
.edub-fields input:focus{border-color:#c99df0}

.human{position:relative;display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:var(--ink-3);border:1px solid #1e2530;border-radius:12px;padding:10px 14px;font-size:11px;color:#9aa3ad;margin-bottom:10px}
.human b{font-family:'DM Mono';color:var(--teal-line)}
.human b.warn{color:#f0a04b}
.hm-sep{width:1px;height:14px;background:#2a313d}
.assump{position:relative;font-size:10px;color:#6b7682;text-align:center;font-family:'DM Mono';line-height:1.6}

.meth{margin-top:18px;background:var(--ink);border-radius:16px;padding:20px;color:#aeb6c0}
.meth-h{display:flex;align-items:center;gap:8px;font-family:'Syne';font-weight:700;font-size:14px;color:#fff;margin-bottom:10px}
.meth p{font-size:12px;line-height:1.65;margin:0 0 10px;max-width:96ch}
.meth p b{color:#dfe4e9}
.disc{color:#7e8896;font-size:11px}
.sign{display:flex;align-items:center;gap:8px;font-size:11px;color:#7e8896;margin-top:6px;border-top:1px solid #1e2530;padding-top:12px}
.sign .dot{box-shadow:0 0 0 3px rgba(232,146,42,.15)}
`;
