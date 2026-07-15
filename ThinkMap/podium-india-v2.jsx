import React, { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import {
  Trophy, Medal, Shield, TrendingUp, Wallet, Sparkles, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Search, GraduationCap, Flag, Activity, Users,
  Instagram, Coins, Swords, BarChart2,
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
const numIN=n=>Math.round(n).toLocaleString("en-IN");
const pct=x=>(x==null||isNaN(x)?"—":(x*100).toFixed(1)+"%");
const yrs=v=>(v==null?"never":v<=0?"already":v.toFixed(1)+" yrs");

/* ─────────────────────────────────────────────────────────────────── */
/*  SPORT DATA — three income streams, seeded from the roadmap dossier. */
/*  All amounts ₹ thousands/yr unless noted. Every number editable.     */
/*                                                                       */
/*  [name, c1, c2, c3, stip,                                            */
/*   prizeNat, prizeStar,     // annual prize $ at national vs top-1%   */
/*   salNat, salStar,         // league/contract salary nat vs top-1%   */
/*   fameMax,                 // ₹L/yr endorsement ceiling at max fame  */
/*   folStar,                 // follower millions a top star commands  */
/*   L, g3, g4, i2, i4, q18, q24, coach, pension]                      */
/* ─────────────────────────────────────────────────────────────────── */
const SPORTS={
  "Bat & Racket":[
    ["Cricket",120,550,350,150, 300,8000, 800,140000, 2500,25, 10,12,5,7,12,30,40,900,500],
    ["Badminton",90,350,300,120, 250,4000, 300,20000, 800,8, 12,15,4,7,10,30,40,500,240],
    ["Tennis",150,550,450,100, 400,25000, 200,5000, 600,5, 10,10,3,8,12,12,18,700,240],
    ["Table Tennis",70,250,200,120, 150,2500, 200,4000, 200,2, 14,18,4,6,8,30,40,400,240],
    ["Squash",90,350,250,100, 120,3000, 120,2000, 120,1.2, 12,15,3,6,8,25,35,400,240],
    ["Golf",250,850,600,150, 600,40000, 200,4000, 500,2.5, 18,8,3,5,8,8,12,700,240],
    ["Snooker / Billiards",40,100,80,100, 200,6000, 150,2000, 150,1.5, 22,15,4,3,5,20,30,350,240],
    ["Chess",60,275,220,100, 300,15000, 200,6000, 900,5, 20,15,4,2,4,20,30,600,240],
  ],
  "Field & Team":[
    ["Football",80,200,250,150, 150,3000, 500,12000, 700,6, 11,12,4,10,15,30,40,450,240],
    ["Hockey",70,275,250,180, 150,2000, 400,8000, 250,2, 13,18,4,9,14,40,55,400,240],
    ["Kabaddi",40,100,120,200, 100,1000, 600,10000, 300,3, 10,25,5,10,16,40,55,350,240],
    ["Kho-Kho",30,70,80,120, 60,600, 200,2500, 60,0.6, 10,28,4,8,12,40,50,250,240],
    ["Basketball",70,175,200,120, 120,2000, 250,4000, 200,2, 11,12,3,8,12,30,40,400,240],
    ["Volleyball",50,140,150,120, 100,1500, 200,3000, 120,1, 11,14,3,7,11,35,45,300,240],
    ["Handball",40,115,120,120, 60,500, 120,1500, 50,0.4, 10,18,4,8,12,35,50,250,240],
    ["Rugby Sevens",50,150,150,120, 80,1000, 150,2500, 100,0.8, 9,14,4,9,14,30,45,300,240],
  ],
  "Combat":[
    ["Boxing",60,175,180,150, 150,3000, 200,5000, 400,4, 8,16,4,12,18,35,50,350,240],
    ["Wrestling",40,100,120,180, 150,2500, 250,4000, 500,4, 10,20,5,12,18,40,55,350,240],
    ["Judo",50,140,140,120, 100,1500, 120,2500, 150,1.5, 10,14,4,10,15,35,50,300,240],
    ["Taekwondo",50,150,130,100, 80,1200, 100,2000, 100,1, 8,12,3,9,13,30,40,280,240],
    ["Karate",45,130,120,100, 60,1000, 80,1500, 80,0.8, 10,12,3,8,12,30,40,280,240],
    ["MMA / BJJ",80,225,250,120, 300,15000, 500,25000, 1200,10, 6,10,4,15,25,2,5,500,0],
  ],
  "Aquatics & Athletics":[
    ["Swimming",120,350,300,150, 150,2500, 150,3000, 400,3, 12,12,4,7,10,35,50,400,240],
    ["Sprinting (100/200m)",60,175,180,150, 150,3000, 150,3000, 500,4, 10,10,3,10,16,40,55,350,240],
    ["Marathon / Distance",40,115,120,150, 200,4000, 100,2000, 250,2, 15,16,4,7,12,40,55,300,240],
    ["Javelin & Throws",70,225,200,150, 150,2500, 150,4000, 600,5, 12,10,3,8,13,40,55,320,240],
    ["Jumps (High/Long)",50,150,150,130, 120,2000, 100,2000, 200,2, 10,9,3,8,13,40,55,300,240],
    ["Race Walking",35,115,100,130, 100,1000, 80,1500, 80,0.8, 14,12,3,6,10,40,50,250,240],
    ["Rowing",90,350,250,150, 100,1500, 100,2000, 100,1, 10,10,3,8,12,40,55,280,240],
    ["Diving",80,300,220,120, 100,1500, 80,1500, 150,1.2, 9,7,3,9,14,30,45,280,240],
  ],
  "Precision & Target":[
    ["Shooting (Rifle/Pistol)",180,450,400,200, 300,5000, 200,4000, 700,5, 17,20,5,4,6,45,60,450,240],
    ["Archery",100,300,250,150, 150,3000, 120,2500, 300,2.5, 14,15,4,5,8,40,55,350,240],
  ],
  "Strength & Gymnastics":[
    ["Weightlifting",50,115,130,180, 150,2500, 150,3000, 500,4, 10,16,4,9,14,40,55,300,240],
    ["Powerlifting",35,80,90,100, 80,1200, 80,1200, 300,3, 12,20,4,7,11,30,45,300,0],
    ["Gymnastics",90,300,250,120, 120,2000, 100,2000, 300,2.5, 6,7,3,12,20,30,40,350,240],
    ["Cycling (Track/Road)",80,225,250,120, 120,2000, 150,3000, 300,2.5, 12,10,3,9,14,30,45,320,240],
  ],
  "Emerging & Niche":[
    ["Esports",60,200,180,250, 500,20000, 400,15000, 2000,15, 6,25,6,1,3,2,5,800,0],
    ["Skateboarding",40,100,120,100, 100,1500, 80,2000, 400,4, 10,14,4,8,14,5,10,300,0],
    ["Motorsport (F4/Rally)",400,1250,900,200, 200,5000, 300,8000, 800,4, 10,3,2,10,18,2,5,500,0],
    ["Equestrian",250,700,500,150, 150,3000, 100,2000, 300,2, 14,7,3,7,12,5,10,400,0],
    ["Fencing",80,225,200,120, 100,2000, 80,1500, 150,1.5, 12,12,3,7,10,30,45,300,240],
    ["Surfing",60,225,200,100, 100,1500, 80,1500, 400,4, 12,10,3,6,10,5,10,300,0],
  ],
};

const STAGES=[
  {key:0,label:"Just starting",age:7,sub:"age 6–9 · nothing proven yet"},
  {key:1,label:"Grassroots / District",age:12,sub:"age 10–13 · playing seriously"},
  {key:2,label:"State level",age:15,sub:"age 14–17 · state top-8 reached"},
  {key:3,label:"National level",age:19,sub:"age 18–22 · national squad / medal"},
  {key:4,label:"Professional",age:24,sub:"age 23+ · earning from the sport"},
];

const CUTOFFS=[
  ["Age 14","Not in your state's top 8 by 14? Keep the sport as a serious hobby and protect academics — the dossier's own rule."],
  ["Age 17–18","No national squad or medal by 17? Stop paying private coaches; shift to state-funded (SAI) coaching or the quota route."],
  ["Age 20–24","No senior squad by 20, no ₹5L year by 24? File for the sports-quota job now. That salary is the floor; prize money and fame are the upside."],
  ["Any age","Training cost above 50% of family income for 2+ years without national selection, or two major injuries before 21 — stop and re-plan."],
];

/* ─────────────────────────────────────────────────────────────────── */
/*  TOURNAMENT MONEY — India. What showing up pays vs what winning      */
/*  pays, rung by rung. Illustrative seeds from public tournament       */
/*  structures; purses change season to season.                         */
/*  Row: [level, events, participate, win]                              */
/* ─────────────────────────────────────────────────────────────────── */
const TOURN={
  "Cricket":[
    ["District / age-group","Inter-district, U-16 & U-19 trophies","free — kit & travel only","selection to state camps"],
    ["State domestic","Ranji Trophy · Syed Mushtaq Ali · Vijay Hazare","match fees ≈ ₹1.5–2.4L per Ranji match","season ₹8–40L + winners' bonus"],
    ["Franchise — IPL","IPL auction & season","base ₹30L — bench still earns the full fee","contracts ₹30L–₹18Cr · champions split ≈ ₹20Cr"],
    ["International","Team India","central contract ₹1–7Cr + match fees ₹3–15L","World Cup winners' pool ran ≈ ₹125Cr (2024 squad)"],
  ],
  "Kabaddi":[
    ["District / state","State championships","free","₹5k–25k + selection"],
    ["National","Senior Nationals · Federation Cup","federation travel","team prizes ₹1–5L"],
    ["Franchise — PKL","Pro Kabaddi League auction","Category D base ≈ ₹9L a season","Category A ₹30L–1Cr+ · champions ≈ ₹3Cr (team)"],
    ["Services route","Railways / Army / Police teams","salary while you play","the quota engine, in league form"],
  ],
  "Football":[
    ["State","State leagues · Santosh Trophy","club stipends ₹5–25k/mo","selection upward"],
    ["I-League & cups","I-League · Durand Cup","salaries ₹3–15L/yr","Durand winners ≈ ₹60L (team)"],
    ["ISL","Indian Super League","contracts ₹10L–2Cr","ISL Cup winners ≈ ₹6Cr (team)"],
    ["National team","Blue Tigers","AIFF match fees & camps","tournament bonuses"],
  ],
  "Badminton":[
    ["District / state ranking","State & BAI ranking events","entry ₹500–2k","₹5k–50k"],
    ["All-India circuit","All-India ranking tournaments","entry ₹1–3k","₹50k–2L"],
    ["National","Senior Nationals","federation travel","pool ≈ ₹5L · winner ₹1–2L"],
    ["→ World ladder","BWF World Tour — see the Global edition","first-round ≈ $500–5k","Super 1000 winner ≈ $80–100k"],
  ],
  "Tennis":[
    ["AITA circuit","AITA CS events","entry ₹1–2k","₹15k–1.5L"],
    ["ITF India legs","ITF $15k–$25k events","first-round ≈ $200–500","winner ≈ $2–3.5k"],
    ["National","Nationals","travel","pools ₹1–3L"],
    ["→ World ladder","ATP/WTA — see the Global edition","Slam first-round ≈ $75–100k","Slam winner ≈ $3.5M"],
  ],
  "Chess":[
    ["State opens","State championships & opens","entry ₹500–2k","pools ₹25k–2L"],
    ["National circuit","National Ch. · Delhi/Chennai GM opens","entry ₹2–5k","open winners ₹5–15L"],
    ["Title route","IM/GM norm events","norm-event entries","GM title = quota weight + academy pull"],
    ["→ World ladder","FIDE circuit — see the Global edition","invitations & conditions","Candidates pool ≈ €500k"],
  ],
  "Esports":[
    ["Online qualifiers","BGIS · Skyesports · VCC qualifiers","free entry","qualification"],
    ["National LANs","BGIS finals · Skyesports Championship","org salaries ₹15k–1L/mo","pools ₹1–2Cr · winning team ₹50L–1Cr"],
    ["Franchise / intl","VCT Pacific path & global events","org contracts","→ Global edition"],
  ],
  "Golf":[
    ["Amateur circuit","IGU amateur events","entry + travel","selection & handicap ranking"],
    ["PGTI","PGTI events, ₹1–2Cr purses","missed cut ≈ ₹0","winner ₹15–30L"],
    ["Indian Open","DP World co-sanctioned","making the cut = paid","winner ≈ $300k+"],
  ],
  "Shooting (Rifle/Pistol)":[
    ["State / pre-nationals","State championships","entry + ammo costs","₹5k–50k + MQS scores"],
    ["National","Nationals · Khelo India · trials","Khelo India scholarship ≈ ₹6.3L/yr if selected","₹50k–2L + national camp"],
    ["ISSF circuit","World Cups & championships","federation-funded","modest ISSF money; medal cash is the real prize"],
    ["Medal awards","Olympic / Asian / CWG medals","—","state + centre cash ₹25L–6Cr per medal"],
  ],
};
/* category fallbacks */
const TOURN_CAT={
  "Aquatics & Athletics":[
    ["District / state","State meets & championships","free","₹5k–50k"],
    ["National","Federation Cup · Nationals · National Games","some meets pay small purses","₹50k–3L + camps"],
    ["Indian GP series","Indian Grand Prix legs","invited — free","₹10k–50k"],
    ["Medal awards","Asian / CWG / Olympic medals","—","state + centre cash ₹25L–6Cr per medal"],
  ],
  "Combat":[
    ["District / state","State championships","entry ₹200–1k","₹5k–50k"],
    ["National","Senior Nationals · Federation Cup","federation travel","₹50k–3L + camps"],
    ["Pro leagues","Boxing/wrestling league seasons (when running)","contracts ₹5–20L a season","finals bonuses"],
    ["Medal awards","Asian / CWG / Olympic medals","—","state + centre cash ₹25L–6Cr per medal"],
  ],
  "Precision & Target":[
    ["State","State championships","entry + equipment","₹5k–50k"],
    ["National","Nationals · Khelo India","Khelo India scholarship ≈ ₹6.3L/yr if selected","₹50k–2L"],
    ["Medal awards","International medals","—","state + centre cash awards"],
  ],
};
const TOURN_GEN=[
  ["District / school","District championships · school games","usually free — kit & travel","₹2k–10k + selection"],
  ["State","State championships · state games","entry ₹0–2k","₹10k–50k + state team"],
  ["National","Nationals · Khelo India · National Games","Khelo India scholarship ≈ ₹6.3L/yr if selected","₹50k–2L + camps + quota weight"],
  ["International","Asian / Commonwealth / World events","federation-funded travel","medal cash awards ₹25L–6Cr (state + centre)"],
];
const tournFor=(name,cat)=>TOURN[name]||TOURN_CAT[cat]||TOURN_GEN;

/* engine + UI in part 2 */
/* ─────────────────────────────────────────────────────────────────── */
/*  Engine — stage-gate funnel × three simultaneous income streams.     */
/*  Seven terminal outcomes; probabilities sum to 1 by construction.    */
/*  Each branch earns from PRIZE (level-scaled) + SALARY (league) +      */
/*  FAME (follower-driven endorsements) — the last pays even off-podium. */
/* ─────────────────────────────────────────────────────────────────── */
const END_AGE=60;

function unpack(row){
  const[name,c1,c2,c3,stip,prizeNat,prizeStar,salNat,salStar,fameMax,folStar,
    L,g3,g4,i2,i4,q18,q24,coach,pension]=row;
  return{name,c1:c1*1e3,c2:c2*1e3,c3:c3*1e3,stip:stip*1e3,
    prizeNat:prizeNat*1e3,prizeStar:prizeStar*1e3,
    salNat:salNat*1e3,salStar:salStar*1e3,
    fameMax:fameMax*1e5,folStar,
    L,g3,g4,i2,i4,q18,q24,coach:coach*1e3,pension:pension*1e3};
}
function cfAt(age,g){
  if(age<18)return 0;
  if(age<22)return -g.eduCost;
  return g.cfSal*Math.pow(1+g.cfG/100,age-22);
}

/* fame → annual endorsement income. Followers (millions) drive it,
   with a sport-fame multiplier. Mildly sublinear so scale still compounds.
   Anchor: the dossier's ~₹1L/month at 100k followers = ₹12L/yr at 0.1M. */
function fameIncome(followersM,s,P){
  if(followersM<=0)return 0;
  const perM=P.fameRate*1e5;                       // ₹/yr per (million^0.92) followers
  const base=perM*Math.pow(followersM,0.92)*1.6;
  return Math.min(base, s.fameMax*P.fameCeilMul);  // capped at sport ceiling
}

/* level → prize income interpolation (0 grassroots →1 star) */
function prizeAt(level,s,P){
  if(level<=0)return 0;
  // national ~ level .66, star ~1.0
  const nat=s.prizeNat*P.prizeMul, star=s.prizeStar*P.prizeMul;
  if(level>=1)return star;
  if(level>=0.66)return nat+(star-nat)*((level-0.66)/0.34);
  return nat*(level/0.66);
}
function salaryAt(level,s,P){
  if(level<0.5)return 0;
  const nat=s.salNat*P.salMul, star=s.salStar*P.salMul;
  if(level>=1)return star;
  if(level>=0.66)return nat+(star-nat)*((level-0.66)/0.34);
  return nat*((level-0.5)/0.16);
}

function branchCurve(cash,startAge,g){
  const cum=[],ages=[];let c=0,cp=0;
  for(let a=startAge;a<=END_AGE;a++){
    const inc=cash(a)-cfAt(a,g);
    c+=inc;cp+=inc/Math.pow(1+g.disc/100,a-startAge);
    ages.push(a);cum.push(Math.round(c));
  }
  return{ages,cum,npv:Math.round(cp),final:Math.round(c)};
}
function irrOf(arr){
  const f=r=>{let v=0;for(let t=0;t<arr.length;t++)v+=arr[t]/Math.pow(1+r,t);return v;};
  let pr=-0.9,pv=f(pr);
  for(let r=-0.85;r<=1.5001;r+=0.005){
    const val=f(r);
    if((pv<=0&&val>=0)||(pv>=0&&val<=0)){
      let lo=pr,hi=r;
      for(let i=0;i<60;i++){const mid=(lo+hi)/2,vm=f(mid);
        if(Math.abs(vm)<1)return mid;
        if((f(lo)<0)===(vm<0))lo=mid;else hi=mid;}
      return(lo+hi)/2;}
    pr=r;pv=val;}
  return null;
}

/* build the per-age stream breakdown for a given "level & fame" profile.
   Four tracked buckets: prize, salary (playing contract), fame (endorsements),
   after (coaching+pension, post-career). The stipend counts as salary. */
function makeStreams(s,P,level,followersM,proEnd,salaryOn){
  return a=>{
    if(a<18)return {cost:a<14?-P.c1:-P.c2,prize:0,salary:0,fame:0,after:0};
    if(a<23)return {cost:-P.c3,prize:prizeAt(level*0.5,s,P)*0.3,salary:s.stip,fame:fameIncome(followersM*0.3,s,P),after:0};
    if(a<proEnd){
      return {cost:0,prize:prizeAt(level,s,P),
        salary:salaryOn?salaryAt(level,s,P):0,
        fame:fameIncome(followersM,s,P),after:0};
    }
    // post-playing: coaching + pension + residual fame
    return {cost:0,prize:0,salary:0,after:s.coach*(1+level*1.5)+s.pension,fame:fameIncome(followersM*0.4,s,P)*0.5};
  };
}

function simulate(sport,P,g){
  const s=sport, stage=P.stage, startAge=P.curAge;
  const g1=stage>=2?1:P.g1/100;
  const g2r=stage>=3?1:P.g2/100, i2=stage>=3?0:s.i2/100; const g2=g2r*(1-i2);
  const g3r=stage>=4?1:P.g3/100, i3=stage>=4?0:(s.i2/100)*0.7; const g3=g3r*(1-i3);
  const g4=P.g4/100, q18=P.q18/100, q24=P.q24/100;

  const pHobby=1-g1;
  const e18=g1*(1-g2); const pQ18=e18*q18, pW18=e18*(1-q18);
  const e24=g1*g2*(1-g3); const pQ24=e24*q24, pC24=e24*(1-q24);
  const pPro=g1*g2*g3*(1-g4), pStar=g1*g2*g3*g4;

  const Leff=Math.max(2,s.L*(1-(s.i4/100)/2));
  const proEnd=23+Math.round(Leff);
  const cost=a=>a<14?-P.c1:(a<18?-P.c2:0);

  /* follower counts per branch (millions) — fame scales with reach, editable via fameMul */
  const folStar=s.folStar*P.fameMul, folPro=folStar*0.15, folState=folStar*0.03, folNat=folStar*0.06;

  /* stream builders */
  const streamStar=makeStreams(s,P,1.0,folStar,proEnd,true);
  const streamPro =makeStreams(s,P,0.7,folPro,proEnd,true);
  const streamQ24 =(a)=>{ // national record → quota salary + national-level prize/fame residual
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<23)return{cost:-P.c3,prize:prizeAt(0.4,s,P)*0.3,salary:s.stip,fame:fameIncome(folNat*0.4,s,P),after:0};
    if(a<24)return{cost:0,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:P.qSal*1.1*Math.pow(1+P.qG/100,a-24),fame:fameIncome(folNat*0.3,s,P)*0.5};
  };
  const streamQ18=(a)=>{
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<20)return{cost:-P.c3*0.5,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:P.qSal*Math.pow(1+P.qG/100,a-20),fame:fameIncome(folState*0.5,s,P)*0.5};
  };
  const streamCoach=(a)=>{
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<23)return{cost:-P.c3,prize:prizeAt(0.3,s,P)*0.2,salary:s.stip,fame:fameIncome(folNat*0.3,s,P),after:0};
    if(a<24)return{cost:0,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:s.coach*Math.pow(1.04,a-24),fame:fameIncome(folNat*0.2,s,P)*0.4};
  };
  const streamWash=(a)=>{
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<22)return{cost:-g.eduCost,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:g.cfSal*(1-P.haircut/100)*Math.pow(1+g.cfG/100,a-22),fame:0};
  };
  const streamHobby=(a)=>({cost:a<14?-P.c1:0,prize:0,salary:0,after:a<18?0:cfAt(a,g),fame:0});

  const flat=fn=>a=>{const x=fn(a);return x.cost+x.prize+x.salary+x.fame+(x.after||0);};

  const B={
    star:{label:"Top 1% — the podium",icon:"🏆",color:"#34c79a",stream:streamStar,
      note:"Peak prize money, a marquee contract, and the biggest endorsement income in the sport."},
    pro:{label:"Professional living",icon:"🏅",color:"#7eb8f7",stream:streamPro,
      note:"A real playing career — solid prize + salary, modest but real endorsements."},
    q24:{label:"Quota job at 24 (national)",icon:"🛡️",color:"#E8922A",stream:streamQ24,
      note:"National record converts to a secure post; a small following still earns on the side."},
    coach24:{label:"Coaching pivot at 24",icon:"📣",color:"#b08de0",stream:streamCoach,
      note:"No pro living, but national exposure feeds coaching and a modest personal brand."},
    q18:{label:"Quota job at 20 (state)",icon:"🛡️",color:"#f0a04b",stream:streamQ18,
      note:"State-level record → government post. The salary is the income; fame is negligible."},
    wash18:{label:"Washed out at 18 — no net",icon:"⚠️",color:"#f0604b",stream:streamWash,
      note:"Academics sacrificed for a path that closed early; the fallback job starts late and pays less."},
    hobby:{label:"Back to studies at 14",icon:"📚",color:"#8a94a0",stream:streamHobby,
      note:"Sport stays a hobby; the ordinary path resumes. Early coaching is the only cost."},
  };

  const defs=[["hobby",pHobby],["wash18",pW18],["q18",pQ18],
    ["coach24",pC24],["q24",pQ24],["pro",pPro],["star",pStar]];
  const branches=defs.map(([k,p])=>{
    const bc=branchCurve(flat(B[k].stream),startAge,g);
    /* lifetime stream totals (undiscounted, for the stack) */
    let tp=0,ts=0,tf=0,ta=0;
    for(let a=startAge;a<=END_AGE;a++){const x=B[k].stream(a);tp+=x.prize;ts+=x.salary;tf+=x.fame;ta+=(x.after||0);}
    return{key:k,p,...B[k],...bc,streamTot:{prize:tp,salary:ts,fame:tf,after:ta}};
  });

  const n=branches[0].ages.length;
  const expCum=new Array(n).fill(0);
  branches.forEach(b=>{for(let i=0;i<n;i++)expCum[i]+=b.p*b.cum[i];});
  const expNPV=Math.round(branches.reduce((t,b)=>t+b.p*b.npv,0));

  /* expected incremental stream → IRR + payback */
  const expInc=[];
  for(let i=0;i<n;i++){
    let v=0;branches.forEach(b=>{const prev=i===0?0:b.cum[i-1];v+=b.p*(b.cum[i]-prev);});
    expInc.push(v);
  }
  const irr=irrOf(expInc);
  let payback=null,acc=0;
  for(let i=0;i<n;i++){acc+=expInc[i];if(acc>=0){payback=branches[0].ages[i]-startAge;break;}}

  /* income mix — blended across the PLAYING branches (star + pro), the
     futures where sport is actually the income. Weighted by their relative
     odds so the picture reflects the realistic playing outcome, not the desk. */
  const playBr=branches.filter(b=>b.key==="star"||b.key==="pro");
  const pw=playBr.reduce((t,b)=>t+b.p,0)||1;
  const mix={prize:0,salary:0,fame:0,after:0};
  playBr.forEach(b=>{const w=b.p/pw;mix.prize+=w*b.streamTot.prize;mix.salary+=w*b.streamTot.salary;mix.fame+=w*b.streamTot.fame;mix.after+=w*b.streamTot.after;});
  const mixTot=mix.prize+mix.salary+mix.fame+mix.after||1;

  const N=10000;
  const funnel=[
    {label:stage>=2?"Where you stand":"Committed juniors",n:N},
    ...(stage<2?[{label:"Reach state top-8 (14)",n:N*g1}]:[]),
    ...(stage<3?[{label:"Reach national level (18)",n:N*g1*g2}]:[]),
    ...(stage<4?[{label:"Earn a playing living (23)",n:N*g1*g2*g3}]:[{label:"Earning a playing living",n:N*g1*g2*g3}]),
    {label:"Reach the top 1%",n:N*g1*g2*g3*g4},
  ];
  const oneIn=g1*g2*g3>0?Math.round(1/(g1*g2*g3)):null;

  const posEV=branches.filter(b=>b.p*b.npv>0).reduce((t,b)=>t+b.p*b.npv,0);
  const netEV=pQ18*Math.max(0,branches.find(b=>b.key==="q18").npv)
             +pQ24*Math.max(0,branches.find(b=>b.key==="q24").npv);
  const netShare=posEV>0?Math.round(100*netEV/posEV):0;
  const playTot=mix.prize+mix.salary+mix.fame||1;   /* playing income only */
  const fameShare=Math.round(100*mix.fame/playTot); /* endorsements vs prize+salary, in a playing career */

  const flags=[];
  const stageCost=stage<3?P.c2:P.c3;
  if(g.famInc>0&&stageCost>0.5*g.famInc)
    flags.push(`Training at this stage costs ${inr(stageCost)}/yr — over 50% of the family's ${inr(g.famInc)} income. The dossier calls this a hard stop without national selection.`);
  if((s.q18<10)&&(g1*g2*g3<0.005)&&fameShare<25)
    flags.push(`${s.name} has almost no quota pathway, under 0.5% playing odds, and limited endorsement upside — income must come from winning alone. Needs private wealth or extraordinary talent.`);
  if(s.i4>=16)
    flags.push(`High-injury sport: one bad year can end the run. Two major injuries before 21 = start the academic backup immediately.`);
  if(fameShare>=40)
    flags.push(`Note: ${fameShare}% of the expected money here is off-field endorsements, not prize or salary. That income depends on building an audience — a different skill from winning, and worth deliberately cultivating.`);

  return{branches,expCum,expNPV,irr,payback,ages:branches[0].ages,funnel,oneIn,netShare,fameShare,mix,mixTot,flags,
    probs:{pHobby,pW18,pQ18,pC24,pQ24,pPro,pStar},proEnd,Leff:Math.round(Leff),
    folStar:folStar};
}

/* Monte Carlo — jitter the gate odds (they're the real uncertainty) */
function monteCarlo(sport,P,g,sigma,N=250){
  const trials=[];
  for(let i=0;i<N;i++){
    const jit=(v,lo,hi)=>{
      const u1=Math.random(),u2=Math.random();
      const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      return Math.max(lo,Math.min(hi,v+z*sigma));
    };
    const PP={...P,
      g1:jit(P.g1,1,80),g2:jit(P.g2,1,80),
      g3:jit(P.g3,1,90),g4:jit(P.g4,0.2,40)};
    trials.push(simulate(sport,PP,g).expCum);
  }
  const n=trials[0].length,out=[];
  for(let i=0;i<n;i++){
    const vals=trials.map(t=>t[i]).sort((a,b)=>a-b);
    const q=p=>vals[Math.max(0,Math.floor(p*N)-1)];
    out.push({p10:q(.1),p90:q(.9)});
  }
  return out;
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
function Slider({label,val,onChange,min=0,max=100,step=1,left,right,accent="teal",suffix="%",sub,badge}){
  return(<label className="sld"><span className="sld-top">
      <span className="fld-l">{label} {badge}</span>
      <span className={"sld-v "+accent}>{val}{suffix}</span></span>
    <input className={"range "+accent} type="range" min={min} max={max} step={step} value={val}
      onChange={e=>onChange(parseFloat(e.target.value))}
      style={{"--p":((val-min)/(max-min))*100+"%"}}/>
    {(left||right)&&<span className="sld-ends"><i>{left}</i><i>{right}</i></span>}
    {sub&&<span className="fld-h">{sub}</span>}</label>);
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

/* ─────────────────────────────────────────────────────────────────── */
/*  Verdict                                                             */
/* ─────────────────────────────────────────────────────────────────── */
function verdict(A,B,compare,g){
  const bits=[];let tag;
  if(compare){
    const nm=w=>w==="A"?A.sport.name:B.sport.name;
    const wN=A.m.expNPV>=B.m.expNPV?"A":"B",lN=wN==="A"?"B":"A";
    const W=wN==="A"?A:B,L=lN==="A"?A:B;
    if(W.m.expNPV<0){tag="Neither beats the desk";
      bits.push(`Expected across every future, both ${A.sport.name} and ${B.sport.name} trail the ordinary study-and-job path — the safety-net job is doing the heavy lifting in each.`);}
    else{tag=`${nm(wN)} leads`;
      bits.push(`Expected across all seven futures, ${nm(wN)} lands ${inr(W.m.expNPV)} ahead of the ordinary path against ${inr(L.m.expNPV)} for ${nm(lN)}.`);}
    if(Math.abs(A.m.fameShare-B.m.fameShare)>=15){
      const hi=A.m.fameShare>B.m.fameShare?A:B;
      bits.push(`${hi.sport.name} leans far more on off-field income (${hi.m.fameShare}% endorsements) — a bet on building an audience as much as on winning.`);}
    return{tag,line:bits.join(" ")};
  }
  const m=A.m,s=A.sport;
  if(m.expNPV>0){tag="The path carries its weight";
    bits.push(`Weighted across all seven futures, ${s.name} is expected to leave you ${inr(m.expNPV)} ahead of the ordinary study-and-job path, in today's money.`);}
  else{tag="The dream costs more than it pays";
    bits.push(`Weighted across all seven futures, ${s.name} is expected to leave you ${inr(Math.abs(m.expNPV))} behind the ordinary path, in today's money.`);}
  if(m.oneIn)bits.push(`From here, about 1 in ${numIN(m.oneIn)} make a playing living.`);
  if(m.fameShare>=35)
    bits.push(`Notably, ${m.fameShare}% of the expected income is off-field — endorsements and following, not prize or salary. Winning gets you noticed; the audience is what pays.`);
  else if(m.netShare>=50)
    bits.push(`And ${m.netShare}% of the positive expected value comes from the government-quota safety net — secure that job; the medals are the bonus.`);
  return{tag,line:bits.join(" ")};
}

/* default per-sport tunable params */
function seedParams(sport,stage,curAge){
  return{_sport:sport.name,stage,curAge,
    g1:8,g2:10,g3:sport.g3,g4:sport.g4,
    q18:sport.q18,q24:sport.q24,
    c1:sport.c1,c2:sport.c2,c3:sport.c3,
    qSal:480000,qG:5,haircut:20,
    prizeMul:100,salMul:100,fameMul:100,fameRate:10,fameCeilMul:100,
    _pm:1};
}
/* percent-style multipliers stored as 100=baseline; convert on read */
function normP(P){
  return{...P,
    prizeMul:P.prizeMul/100,salMul:P.salMul/100,fameMul:P.fameMul/100,
    fameCeilMul:P.fameCeilMul/100,fameRate:P.fameRate};
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main                                                                */
/* ─────────────────────────────────────────────────────────────────── */
const SLOT={A:"#34c79a",B:"#f0a04b"};

export default function App(){
  const[stage,setStage]=useState(1);
  const[curAge,setCurAge]=useState(12);
  const[slots,setSlots]=useState({
    A:{cat:"Field & Team",idx:2,P:null},   // Kabaddi
    B:{cat:"Bat & Racket",idx:0,P:null},   // Cricket
  });
  const[assign,setAssign]=useState("A");
  const[compare,setCompare]=useState(false);
  const[filter,setFilter]=useState("");
  const[showMC,setShowMC]=useState(false);
  const[sigma,setSigma]=useState(4);
  const[g,setG]=useState({cfSal:300000,cfG:6,disc:8,eduCost:100000,famInc:800000});
  const[bm,setBm]=useState({pride:8,discipline:9,fitness:8,network:6,love:9});
  const[strain,setStrain]=useState({body:7,family:7,academics:8});
  const[open,setOpen]=useState({gates:true,income:true,net:false,money:false,beyond:false,effort:false});
  const[showBr,setShowBr]=useState({star:true,pro:true,q24:true,wash18:true});

  const build=(slot)=>{
    const sport=unpack(SPORTS[slot.cat][slot.idx]);
    const P=slot.P&&slot.P._sport===sport.name?slot.P:seedParams(sport,stage,curAge);
    const m=simulate(sport,{...normP(P),stage,curAge},g);
    return{sport,P,m};
  };
  const A=useMemo(()=>build(slots.A),[slots.A,stage,curAge,g]);
  const B=useMemo(()=>build(slots.B),[slots.B,stage,curAge,g]);
  const cur=assign==="A"?A:B;
  const F=compare?A:cur;               // focus for single-view panels
  const view=compare?"compare":assign;

  const mc=useMemo(()=>showMC&&!compare?monteCarlo(cur.sport,{...normP(cur.P),stage,curAge},g,sigma):null,
    [showMC,compare,cur,stage,curAge,g,sigma]);
  const vd=verdict(A,B,compare,g);

  const setSlotP=(slot,patch)=>setSlots(p=>{
    const s=p[slot];const sport=unpack(SPORTS[s.cat][s.idx]);
    const base=s.P&&s.P._sport===sport.name?s.P:seedParams(sport,stage,curAge);
    return{...p,[slot]:{...s,P:{...base,...patch,stage,curAge}}};
  });
  const pick=(cat,idx)=>setSlots(p=>({...p,[assign]:{cat,idx,P:null}}));
  const setStage1=(k)=>{setStage(k);setCurAge(STAGES[k].age);
    setSlots(p=>({A:{...p.A,P:null},B:{...p.B,P:null}}));};

  const race=[];
  const n=A.m.ages.length;
  for(let i=0;i<n;i++){
    const row={age:A.m.ages[i]};
    if(compare){row.a=A.m.expCum[i];row.b=B.m.expCum[i];}
    else{F.m.branches.forEach(b=>{row[b.key]=b.cum[i];});row.exp=Math.round(F.m.expCum[i]);
      if(mc)row.band=[mc[i].p10,mc[i].p90];}
    race.push(row);
  }
  const maxFun=F.m.funnel[0].n;
  const beyond=Math.round(((bm.pride+bm.discipline+bm.fitness+bm.network+bm.love)/5)*10);
  const strainV=Math.round(((strain.body+strain.family+strain.academics)/3)*10);
  const outcomeOrder=["star","pro","q24","q18","coach24","wash18","hobby"];

  /* comparison metric rows */
  const cmpRows=[
    {label:"Expected value (NPV)",a:A.m.expNPV,b:B.m.expNPV,fmt:inr,better:"high"},
    {label:"Expected return (IRR)",a:A.m.irr,b:B.m.irr,fmt:pct,better:"high"},
    {label:"Make a living: 1 in",a:A.m.oneIn,b:B.m.oneIn,fmt:x=>x?numIN(x):"—",better:"low"},
    {label:"Top-1% odds",a:A.m.probs.pStar,b:B.m.probs.pStar,fmt:x=>(x*100).toFixed(2)+"%",better:"high"},
    {label:"Off-field income share",a:A.m.fameShare/100,b:B.m.fameShare/100,fmt:x=>Math.round(x*100)+"%",better:"high"},
    {label:"Safety-net share",a:A.m.netShare/100,b:B.m.netShare/100,fmt:x=>Math.round(x*100)+"%",better:"low"},
  ];

  return(
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot"/> CatalystBox</div>
        <span className="eyebrow">Sibling to the Education &amp; Margin calculators · India Edition</span>
        <h1>Podium</h1>
        <p className="sub">The Athlete Career Calculator</p>
        <p className="lede">A sporting life is a <b>ladder of gates</b> — and money arrives in <b style={{color:"#f5c563"}}>three streams at once</b>: <b style={{color:SLOT.A}}>prize money</b> that scales with the level you reach, a <b style={{color:"#7eb8f7"}}>salary or contract</b> if a league exists, and <b style={{color:"#e08de0"}}>endorsements</b> that follow fame — and pay even when you never top the podium. Podium runs all seven futures the ladder can end in, weighted by odds you control, and prices the whole journey against simply studying and taking a job. <em>Winning gets you noticed. The audience is what pays.</em></p>
      </header>

      {/* ── stage ── */}
      <div className="hero">
        <div className="hero-top"><span className="hero-l"><Flag size={12}/> Where does the athlete stand today?</span></div>
        <div className="stages">
          {STAGES.map(st=>(
            <button key={st.key} className={"stg "+(stage===st.key?"on":"")} onClick={()=>setStage1(st.key)}>
              <b>{st.label}</b><i>{st.sub}</i></button>))}
        </div>
        <div className="hero-note">
          Current age <input className="agein" type="number" value={curAge} min={6} max={30}
            onChange={e=>{setCurAge(Math.max(6,Math.min(30,+e.target.value||6)));setSlots(p=>({A:{...p.A,P:null},B:{...p.B,P:null}}));}}/> ·
          money already spent is sunk — every number below is the decision <b>from today</b>. Passed gates lock at 100%.
        </div>
      </div>

      {/* ── sport browser with A/B ── */}
      <div className="browser">
        <div className="browser-h">
          <span className="browser-t">Pick the sport{compare?"s":""}</span>
          <div className="bh-right">
            <label className="cmp"><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/> <Swords size={12}/> Compare two</label>
            {compare&&<span className="assign">Pick into
              <button className={"as-b "+(assign==="A"?"on":"")} style={assign==="A"?{background:SLOT.A}:{}} onClick={()=>setAssign("A")}>A</button>
              <button className={"as-b "+(assign==="B"?"on":"")} style={assign==="B"?{background:SLOT.B}:{}} onClick={()=>setAssign("B")}>B</button>
            </span>}
            <span className="search"><Search size={12}/><input placeholder="Filter…" value={filter} onChange={e=>setFilter(e.target.value)}/></span>
          </div>
        </div>
        {Object.keys(SPORTS).map(cat=>{
          const list=SPORTS[cat].map((r,i)=>({r,i})).filter(({r})=>!filter||r[0].toLowerCase().includes(filter.toLowerCase()));
          if(!list.length)return null;
          return(<div key={cat} className="cat">
            <div className="cat-l">{cat}</div>
            <div className="chips">
              {list.map(({r,i})=>{
                const isA=slots.A.cat===cat&&slots.A.idx===i;
                const isB=compare&&slots.B.cat===cat&&slots.B.idx===i;
                return(<button key={r[0]} className={"vchip"+(isA?" selA":"")+(isB?" selB":"")}
                  onClick={()=>pick(cat,i)}>
                  {isA&&<i className="slotdot" style={{background:SLOT.A}}/>}
                  {isB&&<i className="slotdot" style={{background:SLOT.B}}/>}
                  {r[0]}</button>);})}
            </div>
          </div>);})}
      </div>

      <div className="layout">
        {/* ══ CONTROLS ══ */}
        <div className="controls">
          {compare&&<div className="seg">
            <span className="seg-l">Tuning</span>
            {["A","B"].map(sl=>(
              <button key={sl} className={"seg-b "+(assign===sl?"on":"")} style={assign===sl?{background:SLOT[sl]}:{}}
                onClick={()=>setAssign(sl)}>{sl} · {(sl==="A"?A:B).sport.name}</button>))}
          </div>}

          <Sec icon={<Trophy size={16}/>} title="The gates" sub="Conditional odds — each assumes the last was passed"
            open={open.gates} onToggle={()=>setOpen(p=>({...p,gates:!p.gates}))}>
            {stage<2&&<Slider label="Reach state top-8 by 14" val={cur.P.g1} onChange={x=>setSlotP(assign,{g1:x})} max={60} accent="teal" left="long shot" right="clear talent"/>}
            {stage<3&&<Slider label="State → national squad by 18" val={cur.P.g2} onChange={x=>setSlotP(assign,{g2:x})} max={60} accent="teal" left="rare" right="dominant"/>}
            {stage<4&&<Slider label="National → earning a playing living" val={cur.P.g3} onChange={x=>setSlotP(assign,{g3:x})} max={80} accent="teal" left="no league" right="pro league" sub={`Seeded for ${cur.sport.name}.`}/>}
            <Slider label="Pro → top 1% (the podium)" val={cur.P.g4} onChange={x=>setSlotP(assign,{g4:x})} max={25} accent="amber" left="lottery" right="generational"/>
            <div className="oneIn">{cur.m.oneIn?<>From here: <b>1 in {numIN(cur.m.oneIn)}</b> make a playing living · injury priced in</>:"Playing odds locked — already pro"}</div>
          </Sec>

          <Sec icon={<Coins size={16}/>} title="The three income streams" sub="Prize · salary · fame — the engine's core"
            open={open.income} onToggle={()=>setOpen(p=>({...p,income:!p.income}))}>
            <div className="strhead"><Coins size={12}/> Prize money — scales with level reached</div>
            <Slider label="Prize scale" val={cur.P.prizeMul} onChange={x=>setSlotP(assign,{prizeMul:x})} min={0} max={300} suffix="%" accent="teal" left="lean circuit" right="rich circuit"
              sub={`At national level ≈ ${inr(cur.sport.prizeNat*cur.P.prizeMul/100)}/yr, at top-1% ≈ ${inr(cur.sport.prizeStar*cur.P.prizeMul/100)}/yr.`}/>
            <div className="strhead"><Wallet size={12}/> Salary / league contract</div>
            <Slider label="Salary scale" val={cur.P.salMul} onChange={x=>setSlotP(assign,{salMul:x})} min={0} max={300} suffix="%" accent="teal" left="no league" right="rich league"
              sub={`Top contract ≈ ${inr(cur.sport.salStar*cur.P.salMul/100)}/yr. Set to 0 for sports with no professional league.`}/>
            <div className="strhead"><Instagram size={12}/> Fame &amp; endorsements — the off-field engine</div>
            <Slider label="Reach / following scale" val={cur.P.fameMul} onChange={x=>setSlotP(assign,{fameMul:x})} min={0} max={400} suffix="%" accent="amber" left="private" right="household name"
              sub={`A top star in ${cur.sport.name} ≈ ${(F.m.folStar).toFixed(1)}M followers at this setting.`}/>
            <Slider label="₹ per million followers / yr" val={cur.P.fameRate} onChange={x=>setSlotP(assign,{fameRate:x})} min={0} max={50} suffix="L" accent="amber" left="niche" right="premium brand"
              sub="The dossier's rule of thumb: ~₹1L/month at 100k. Endorsements pay even in non-pro branches."/>
          </Sec>

          <Sec icon={<Shield size={16}/>} title="The safety net" sub="Quota jobs & the fallback — one stream among several"
            open={open.net} onToggle={()=>setOpen(p=>({...p,net:!p.net}))}>
            <Slider label="Quota job odds if you stop at state level" val={cur.P.q18} onChange={x=>setSlotP(assign,{q18:x})} max={80} accent="amber" left="no pathway" right="Railways loves it"/>
            <Slider label="Quota job odds with a national record" val={cur.P.q24} onChange={x=>setSlotP(assign,{q24:x})} max={90} accent="amber"/>
            <div className="grid2">
              <Num label="Quota salary / yr" k="qSal" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="₹" hint="Railways / Army / Police / PSU — secure to 60."/>
              <Num label="Its growth /yr" k="qG" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} step={1} suffix="%"/>
            </div>
            <Num label="Washout haircut if academics sacrificed" k="haircut" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} step={5} suffix="%" hint="Open schooling + lost years = a weaker fallback than the ordinary path."/>
          </Sec>

          <Sec icon={<Wallet size={16}/>} title="Costs & baseline" sub="What it costs, and the job you'd otherwise take"
            open={open.money} onToggle={()=>setOpen(p=>({...p,money:!p.money}))}>
            <div className="grid3">
              <Num label="Cost/yr (6–14)" k="c1" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="₹"/>
              <Num label="Cost/yr (14–18)" k="c2" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="₹"/>
              <Num label="Cost/yr (18–23)" k="c3" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="₹"/>
            </div>
            <div className="grid3">
              <Num label="Family income /yr" k="famInc" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="₹" hint="Drives the 50% red flag."/>
              <Num label="Ordinary salary at 22" k="cfSal" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="₹"/>
              <Num label="Its growth /yr" k="cfG" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} step={1} suffix="%"/>
            </div>
            <div className="grid2">
              <Num label="College cost /yr (18–22)" k="eduCost" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="₹"/>
              <Num label="Discount rate" k="disc" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} step={0.5} suffix="%"/>
            </div>
            <div className="mini">Peak window for {cur.sport.name}: ~{cur.m.Leff} earning years (injury-adjusted from {cur.sport.L}). Pension {inr(cur.sport.pension)}/yr on pro branches with a national record.</div>
          </Sec>

          <Sec icon={<Clock size={16}/>} title="Strain" sub="What the pursuit costs beyond money"
            open={open.effort} onToggle={()=>setOpen(p=>({...p,effort:!p.effort}))}>
            <Slider label="Body toll & injury fear" val={strain.body} onChange={x=>setStrain(p=>({...p,body:x}))} min={0} max={10} suffix="" accent="amber" left="light" right="brutal"/>
            <Slider label="Family financial strain" val={strain.family} onChange={x=>setStrain(p=>({...p,family:x}))} min={0} max={10} suffix="" accent="amber" left="light" right="heavy"/>
            <Slider label="Academic sacrifice" val={strain.academics} onChange={x=>setStrain(p=>({...p,academics:x}))} min={0} max={10} suffix="" accent="amber" left="none" right="total"/>
          </Sec>

          <Sec icon={<Sparkles size={16}/>} title="Beyond money" sub="Rated 0–10 · kept separate from the rupees"
            open={open.beyond} onToggle={()=>setOpen(p=>({...p,beyond:!p.beyond}))}>
            <Slider label="Pride & identity" val={bm.pride} onChange={x=>setBm(p=>({...p,pride:x}))} min={0} max={10} suffix="" accent="teal"/>
            <Slider label="Discipline & character" val={bm.discipline} onChange={x=>setBm(p=>({...p,discipline:x}))} min={0} max={10} suffix="" accent="teal"/>
            <Slider label="Lifelong fitness & health" val={bm.fitness} onChange={x=>setBm(p=>({...p,fitness:x}))} min={0} max={10} suffix="" accent="teal"/>
            <Slider label="Network & doors opened" val={bm.network} onChange={x=>setBm(p=>({...p,network:x}))} min={0} max={10} suffix="" accent="teal"/>
            <Slider label="Love of the game" val={bm.love} onChange={x=>setBm(p=>({...p,love:x}))} min={0} max={10} suffix="" accent="teal"/>
          </Sec>
        </div>

        {/* ══ RESULT ══ */}
        <div className="result">
          <div className="verdict">
            <span className="v-icn"><Medal size={15}/></span>
            <div><span className="v-tag">{vd.tag}</span><p>{vd.line}</p></div>
          </div>

          {!compare&&F.m.flags.length>0&&<div className="flags">
            {F.m.flags.map((f,i)=>(<div key={i} className="flag"><AlertTriangle size={12}/><span>{f}</span></div>))}
          </div>}

          {/* metric tiles */}
          <div className="tiles">
            <div className="tile"><span className="t-l"><TrendingUp size={12}/> Expected value</span>
              <span className={"t-v "+(F.m.expNPV>=0?"pos":"neg")}>{inr(F.m.expNPV)}</span><span className="t-s">vs the ordinary path, today's ₹</span></div>
            <div className="tile"><span className="t-l"><BarChart2 size={12}/> Expected return</span>
              <span className="t-v">{pct(F.m.irr)}</span><span className="t-s">IRR · breaks even {yrs(F.m.payback)}</span></div>
            <div className="tile"><span className="t-l"><Instagram size={12}/> Off-field share</span>
              <span className="t-v amber">{F.m.fameShare}%</span><span className="t-s">endorsements in a playing career</span></div>
            <div className="tile"><span className="t-l"><Shield size={12}/> Safety-net share</span>
              <span className="t-v">{F.m.netShare}%</span><span className="t-s">of positive expected value</span></div>
          </div>

          {/* FUNNEL */}
          <div className="funnelbox">
            <div className="chart-h"><span><Users size={12}/> The funnel — {F.sport.name}{compare?" (A)":""}, with your odds</span></div>
            {F.m.funnel.map((f,i)=>{
              const w=Math.max(1.6,Math.sqrt(f.n/maxFun)*100);
              const disp=f.n>=10?numIN(f.n):f.n>=1?f.n.toFixed(0):f.n.toFixed(1);
              return(<div key={i} className="fun-row">
                <span className="fun-lab">{f.label}</span>
                <div className="fun-track"><i style={{width:w+"%"}}/></div>
                <span className="fun-n">{disp}</span></div>);})}
            <div className="fun-note">of {numIN(maxFun)} at your start · √ scale so the small numbers stay visible</div>
          </div>

          {/* wealth race */}
          <div className="chart">
            <div className="chart-h">
              <span>{compare?"Lifetime wealth — A vs B, both vs the desk":"Lifetime wealth by age — every future vs. the desk"}</span>
              {!compare&&<button className={"pv "+(showMC?"on":"")} onClick={()=>setShowMC(x=>!x)}><BarChart2 size={11}/> {showMC?"Hide band":"Odds band"}</button>}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={race} margin={{top:8,right:12,bottom:2,left:6}}>
                <defs><linearGradient id="mcb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7eb8f7" stopOpacity={.20}/>
                  <stop offset="100%" stopColor="#7eb8f7" stopOpacity={.03}/></linearGradient></defs>
                <CartesianGrid stroke="#2a313d" strokeDasharray="2 4" vertical={false}/>
                <XAxis dataKey="age" tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false} axisLine={{stroke:"#2a313d"}}
                  label={{value:"age",position:"insideBottom",offset:-1,fill:"#6b7682",fontSize:10}}/>
                <YAxis tickFormatter={inrS} tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false} axisLine={false} width={52}/>
                <Tooltip contentStyle={{background:"#0d1219",border:"1px solid #2a313d",borderRadius:10,fontSize:12,fontFamily:"DM Mono, monospace"}}
                  labelFormatter={l=>"Age "+l}
                  formatter={(val,nm)=>{
                    const names={exp:"Expected",a:A.sport.name,b:B.sport.name,star:"Top 1%",pro:"Pro living",q24:"Quota (24)",q18:"Quota (20)",coach24:"Coaching",wash18:"Washout",hobby:"Studies",band:"10–90th pct"};
                    return[Array.isArray(val)?inr(val[0])+" – "+inr(val[1]):inr(val),names[nm]||nm];}}/>
                <ReferenceLine y={0} stroke="#4a525e" strokeWidth={1}/>
                {!compare&&showMC&&<Area type="monotone" dataKey="band" stroke="none" fill="url(#mcb)"/>}
                {compare?(<>
                  <Line type="monotone" dataKey="a" stroke={SLOT.A} strokeWidth={2.4} dot={false}/>
                  <Line type="monotone" dataKey="b" stroke={SLOT.B} strokeWidth={2.4} dot={false}/>
                </>):(<>
                  {showBr.star&&<Line type="monotone" dataKey="star" stroke="#34c79a" strokeWidth={1.7} dot={false}/>}
                  {showBr.pro&&<Line type="monotone" dataKey="pro" stroke="#7eb8f7" strokeWidth={1.7} dot={false}/>}
                  {showBr.q24&&<Line type="monotone" dataKey="q24" stroke="#E8922A" strokeWidth={1.7} dot={false}/>}
                  {showBr.wash18&&<Line type="monotone" dataKey="wash18" stroke="#f0604b" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>}
                  <Line type="monotone" dataKey="exp" stroke="#fff" strokeWidth={2.3} strokeDasharray="2 3" dot={false}/>
                </>)}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="legend">
              {compare?(<>
                <span><i className="sw" style={{background:SLOT.A}}/>{A.sport.name}</span>
                <span><i className="sw" style={{background:SLOT.B}}/>{B.sport.name}</span>
                <span><i className="sw" style={{background:"#4a525e"}}/>desk = ₹0 line</span>
              </>):(<>
                {[["star","Top 1%","#34c79a"],["pro","Pro","#7eb8f7"],["q24","Quota","#E8922A"],["wash18","Washout","#f0604b"]].map(([k,l,c])=>(
                  <button key={k} className={"legtog "+(showBr[k]?"on":"")} onClick={()=>setShowBr(p=>({...p,[k]:!p[k]}))}>
                    <i className="sw" style={{background:c}}/>{l}</button>))}
                <span><i className="sw" style={{background:"#fff",opacity:.8}}/>Expected</span>
              </>)}
            </div>
            {!compare&&showMC&&<Slider label="Odds uncertainty (± points on each gate)" val={sigma} min={0} max={12} step={1} suffix="" accent="amber" left="confident" right="wide open" onChange={setSigma}/>}
          </div>

          {compare?(
            <div className="h2h">
              <div className="h2h-key"><span style={{color:SLOT.A}}>◀ {A.sport.name}</span><span style={{color:SLOT.B}}>{B.sport.name} ▶</span></div>
              {cmpRows.map(row=>{
                const mx=Math.max(Math.abs(row.a??0),Math.abs(row.b??0),1e-9);
                const pa=(Math.abs(row.a??0)/mx)*100,pb=(Math.abs(row.b??0)/mx)*100;
                const av=row.a??(row.better==="low"?Infinity:-Infinity),bv=row.b??(row.better==="low"?Infinity:-Infinity);
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
            {/* stream stack for expected mix */}
            <div className="stackbox">
              <div className="chart-h"><span><Coins size={12}/> Income mix in a playing career (pro / top-1%)</span></div>
              <div className="stack">
                <div className="stk prize" style={{width:(F.m.mix.prize/F.m.mixTot*100)+"%"}} title="Prize"/>
                <div className="stk sal" style={{width:(F.m.mix.salary/F.m.mixTot*100)+"%"}} title="Salary"/>
                <div className="stk fame" style={{width:(F.m.mix.fame/F.m.mixTot*100)+"%"}} title="Fame"/>
                <div className="stk aft" style={{width:(F.m.mix.after/F.m.mixTot*100)+"%"}} title="Coaching & pension"/>
              </div>
              <div className="stack-key">
                <span><i className="sw" style={{background:"#34c79a"}}/>Prize {Math.round(F.m.mix.prize/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#7eb8f7"}}/>Salary {Math.round(F.m.mix.salary/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#E8922A"}}/>Fame {Math.round(F.m.mix.fame/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#6b7682"}}/>Coach+pension {Math.round(F.m.mix.after/F.m.mixTot*100)}%</span>
              </div>
              <div className="fun-note">blended across the pro &amp; top-1% futures — the outcomes where sport is the income · lifetime gross</div>
            </div>

            {/* tournament money ladder */}
            <div className="tournbox">
              <div className="chart-h"><span><Trophy size={12}/> Tournament money — {F.sport.name} in India</span></div>
              {tournFor(F.sport.name,slots[compare?"A":assign].cat).map(([lvl,ev,part,win],i)=>(
                <div key={i} className="trn-row">
                  <div className="trn-l"><b>{lvl}</b><i>{ev}</i></div>
                  <div className="trn-m">
                    <span className="trn-p">Show up: {part}</span>
                    <span className="trn-w">Win: {win}</span>
                  </div>
                </div>))}
              <div className="fun-note">this ladder is what feeds the Prize stream · purses are illustrative seeds from public tournament structures — they change every season, verify before relying</div>
            </div>

            {/* outcome tiles */}
            <div className="outs">
              {outcomeOrder.map(k=>{
                const b=F.m.branches.find(x=>x.key===k);
                return(<div key={k} className="out" style={{borderColor:b.color+"55"}}>
                  <div className="out-top">
                    <span className="out-l" style={{color:b.color}}>{b.icon} {b.label}</span>
                    <span className="out-p">{(b.p*100).toFixed(b.p<0.001?2:1)}%</span>
                  </div>
                  <div className="out-v" style={{color:b.npv>=0?b.color:"#f0604b"}}>{inr(b.npv)}</div>
                  <div className="out-note">{b.note}</div>
                </div>);})}
            </div>

            {/* cut-offs */}
            <div className="cutbox">
              <div className="chart-h"><span><Activity size={12}/> The cut-off rules — non-negotiable</span></div>
              {CUTOFFS.map(([age,rule],i)=>(<div key={i} className="cut-row"><b>{age}</b><span>{rule}</span></div>))}
            </div>
          </>)}

          <div className="human">
            <span>Beyond money <b>{beyond}/100</b></span><span className="hm-sep"/>
            <span>Strain <b className="warn">{strainV}/100</b></span><span className="hm-sep"/>
            <span>Peak ~{F.m.Leff} yrs · avg retirement in Indian sport ≈ 29.5</span>
          </div>
          <div className="assump">
            seven futures sum to 100% · three streams: prize (level) + salary (league) + fame (following) · injury priced in · all vs. ordinary study-and-job · sunk costs excluded
          </div>
        </div>
      </div>

      <footer className="meth">
        <div className="meth-h"><GraduationCap size={13}/> How Podium is built</div>
        <p>An athlete's life is modelled as a <b>ladder of conditional gates</b> — state top-8 by 14, national squad by 18, a playing living by 23, the top 1% beyond — with injury folded into each gate and into the length of the peak window. Every rung earns from <b>three simultaneous income streams</b>: <b>prize money</b> that scales with the level actually reached (so a national-level athlete earns while still climbing, not only at the summit); a <b>salary or league contract</b> where a professional league exists; and <b>endorsements</b> driven by a follower count, which pay out even in the non-playing branches — a state-level athlete with a large audience can out-earn an invisible professional. Each rung can also exit sideways into the government-quota job, a coaching pivot, or the washout with sacrificed academics. The seven terminal futures are enumerated exactly, their probabilities sum to 100% by construction, and the headline is the probability-weighted <b>expected</b> value — with a real IRR and break-even age — against the same honest baseline as every CatalystBox calculator: the ordinary study-and-job path. Costs already spent are excluded, so every answer is the decision from today.</p>
        <p className="disc">Every figure — costs, prize purses, salaries, endorsement rates, follower counts, gate odds, quota probabilities, pensions and peak windows — is an illustrative, editable seed drawn from the athlete-roadmap dossier, not a forecast, a scouting report, or a promise about any child. Real odds and earnings vary enormously with talent, geography, coaching access, timing and luck; league, quota and endorsement economics change constantly. This is a thinking tool for families, not selection advice and not financial advice. If a number disagrees with your reality, change the number.</p>
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
.lede{max-width:74ch;color:var(--tx-soft);font-size:15px}
.lede em{font-style:italic;color:var(--clay);font-weight:600}
.lede b{font-weight:700}

.hero{background:var(--ink);border-radius:18px;padding:18px 20px;margin:16px 0 14px;box-shadow:0 20px 44px -26px rgba(10,13,20,.7)}
.hero-top{margin-bottom:12px}
.hero-l{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7e8896}
.stages{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
.stg{display:flex;flex-direction:column;gap:2px;text-align:left;background:#10151d;border:1px solid #2a313d;border-radius:11px;padding:10px 12px;cursor:pointer;transition:.15s}
.stg b{font-family:'Syne';font-weight:700;font-size:12.5px;color:#bbc3cc}
.stg i{font-style:normal;font-size:10px;color:#6b7682}
.stg:hover{border-color:#4a525e}
.stg.on{background:rgba(52,199,154,.1);border-color:var(--teal-line)}
.stg.on b{color:var(--teal-line)}
.hero-note{font-size:11px;color:#7e8896;margin-top:12px}
.hero-note b{color:var(--teal-line)}
.agein{width:52px;font-family:'DM Mono';font-size:12px;background:#10151d;border:1px solid #2a313d;border-radius:6px;padding:3px 6px;color:#e8ebef;outline:0;margin:0 3px}

.browser{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:14px 16px;margin-bottom:16px;max-height:260px;overflow-y:auto}
.browser-h{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;position:sticky;top:-14px;background:var(--paper);padding:6px 0;z-index:2;flex-wrap:wrap}
.bh-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.browser-t{font-family:'Syne';font-weight:700;font-size:13.5px;color:var(--ink)}
.cmp{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--tx-soft);cursor:pointer}
.cmp input{accent-color:var(--teal)}
.assign{display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--tx-mut);font-weight:600}
.as-b{width:24px;height:24px;border-radius:7px;border:1px solid var(--line);background:#fff;font-family:'Syne';font-weight:800;font-size:12px;color:var(--tx-soft);cursor:pointer}
.as-b.on{color:#fff;border-color:transparent}
.search{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:8px;padding:4px 8px;color:var(--tx-mut)}
.search input{border:0;outline:0;background:none;font-size:12px;width:80px;color:var(--ink)}
.cat{margin-bottom:10px}
.cat-l{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);margin-bottom:6px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.vchip{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.13s}
.vchip:hover{border-color:var(--teal);color:var(--teal)}
.vchip.selA{border-color:#34c79a;box-shadow:0 0 0 1.5px #34c79a inset}
.vchip.selB{border-color:#f0a04b;box-shadow:0 0 0 1.5px #f0a04b inset}
.slotdot{width:7px;height:7px;border-radius:50%;display:inline-block}

.layout{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:1000px){.layout{grid-template-columns:1fr 1.22fr;align-items:start}.result{position:sticky;top:14px}}
.controls{display:flex;flex-direction:column;gap:11px}
.seg{display:flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:8px 10px}
.seg-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tx-mut);flex:none}
.seg-b{flex:1;font-family:'Syne';font-weight:700;font-size:11px;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seg-b.on{color:#fff;border-color:transparent}
.sec{background:var(--paper);border:1px solid var(--line);border-radius:13px;overflow:hidden}
.sec-h{width:100%;display:flex;align-items:center;gap:10px;padding:12px 14px;background:none;border:0;cursor:pointer;text-align:left}
.sec-icn{width:28px;height:28px;flex:none;display:grid;place-items:center;border-radius:8px;background:var(--teal-tint);color:var(--teal)}
.sec-tt{flex:1;display:flex;flex-direction:column}
.sec-tt b{font-family:'Syne';font-weight:700;font-size:14px;color:var(--ink)}
.sec-tt i{font-style:normal;font-size:11px;color:var(--tx-mut)}
.sec-chev{color:var(--tx-mut);width:16px;display:grid;place-items:center}
.sec-b{padding:2px 14px 15px;border-top:1px solid var(--line)}
.strhead{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--clay);margin-top:14px;padding-top:11px;border-top:1px dashed var(--line)}
.strhead:first-child{margin-top:6px;padding-top:0;border-top:0}
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
.range{-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;outline:0;cursor:pointer;width:100%}
.range.teal{background:linear-gradient(90deg,var(--teal) var(--p),#e4dccb var(--p))}
.range.amber{background:linear-gradient(90deg,var(--amber) var(--p),#e4dccb var(--p))}
.range.teal::-webkit-slider-thumb,.range.amber::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.range.teal::-moz-range-thumb,.range.amber::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer}
.sld-ends{display:flex;justify-content:space-between}
.sld-ends i{font-style:normal;font-size:10px;color:var(--tx-mut)}
.oneIn{margin-top:13px;font-family:'DM Mono';font-size:11.5px;color:var(--teal);background:var(--teal-tint);border-radius:9px;padding:8px 11px}
.oneIn b{font-size:13px}
.mini{font-size:11px;color:var(--tx-mut);margin-top:12px;line-height:1.45}

.result{background:var(--ink);border-radius:18px;padding:20px;color:#e8ebef;position:relative;overflow:hidden;box-shadow:0 24px 50px -28px rgba(10,13,20,.7)}
.result::before{content:'';position:absolute;top:-60px;right:-40px;width:240px;height:240px;background:radial-gradient(circle,rgba(52,199,154,.13),transparent 70%);pointer-events:none}
.result .sld .fld-l{color:#9aa3ad}.result .sld-ends i{color:#6b7682}
.result .sld-v.amber{color:#f0a04b}.result .range.amber{background:linear-gradient(90deg,#f0a04b var(--p),#242c38 var(--p))}
.verdict{display:flex;gap:11px;position:relative;margin-bottom:12px}
.v-icn{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;background:#1a212b;color:#f0a04b}
.v-tag{font-family:'Syne';font-weight:700;font-size:clamp(16px,2.4vw,20px);line-height:1.14;color:#fff;letter-spacing:-0.02em}
.verdict p{font-size:12px;color:#9aa3ad;margin:6px 0 0;line-height:1.55}
.flags{display:flex;flex-direction:column;gap:6px;margin-bottom:13px;position:relative}
.flag{display:flex;gap:8px;align-items:flex-start;background:rgba(240,96,75,.09);border:1px solid rgba(240,96,75,.3);border-radius:10px;padding:9px 11px;font-size:11.5px;color:#f0a99e;line-height:1.5}
.flag svg{flex:none;margin-top:2px;color:#f0604b}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:9px;position:relative;margin-bottom:14px}
@media(min-width:560px){.tiles{grid-template-columns:repeat(4,1fr)}}
.tile{background:var(--ink-3);border:1px solid #1e2530;border-radius:12px;padding:11px}
.t-l{display:flex;align-items:center;gap:4px;font-size:9.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#7e8896}
.t-v{display:block;font-family:'DM Mono';font-size:18px;font-weight:500;margin:4px 0 1px;color:#fff}
.t-v.pos{color:var(--teal-line)}.t-v.neg{color:#f0604b}.t-v.amber{color:#f0a04b}
.t-s{font-size:9.5px;color:#6b7682;line-height:1.3;display:block}
.funnelbox,.stackbox{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:13px 14px;margin-bottom:14px}
.chart-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.chart-h span{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#9aa3ad}
.fun-row{display:grid;grid-template-columns:minmax(120px,38%) 1fr 62px;gap:9px;align-items:center;margin-bottom:7px}
.fun-lab{font-size:11px;color:#9aa3ad;text-align:right;line-height:1.25}
.fun-track{height:16px;background:#0d1219;border-radius:99px;overflow:hidden}
.fun-track i{display:block;height:100%;background:linear-gradient(90deg,#0B5C45,#34c79a);border-radius:99px;transition:width .35s}
.fun-n{font-family:'DM Mono';font-size:12px;color:var(--teal-line);text-align:right}
.fun-note{font-size:9.5px;color:#6b7682;margin-top:6px;text-align:right;font-family:'DM Mono'}
.stack{display:flex;height:22px;border-radius:8px;overflow:hidden;background:#0d1219}
.stk{height:100%;transition:width .4s}
.stk.prize{background:#34c79a}.stk.sal{background:#7eb8f7}.stk.fame{background:#E8922A}.stk.aft{background:#4a525e}
.stack-key{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap}
.stack-key span{display:flex;align-items:center;gap:5px;font-size:11px;color:#9aa3ad;font-family:'DM Mono'}
.chart{margin-bottom:14px;position:relative}
.pv{font-family:'DM Mono';font-size:10px;color:var(--teal-line);background:rgba(52,199,154,.08);border:1px solid rgba(52,199,154,.22);border-radius:7px;padding:4px 8px;cursor:pointer;display:flex;align-items:center;gap:4px}
.pv:hover,.pv.on{background:rgba(52,199,154,.18)}
.legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;justify-content:center;align-items:center}
.legend span{display:flex;align-items:center;gap:5px;font-size:10px;color:#7e8896}
.legtog{display:flex;align-items:center;gap:5px;font-size:10px;color:#5a6470;background:none;border:1px solid #2a313d;border-radius:99px;padding:3px 9px;cursor:pointer}
.legtog.on{color:#bbc3cc;border-color:#4a525e}
.sw{width:10px;height:10px;border-radius:3px;display:inline-block}
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
.outs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;position:relative}
@media(max-width:560px){.outs{grid-template-columns:1fr}}
.out{border:1px solid;border-radius:12px;padding:11px 12px;background:var(--ink-3)}
.out-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:2px}
.out-l{font-family:'Syne';font-weight:700;font-size:12px;line-height:1.25}
.out-p{font-family:'DM Mono';font-size:11.5px;color:#9aa3ad;flex:none}
.out-v{font-family:'DM Mono';font-size:16px;font-weight:500;margin-bottom:4px}
.out-note{font-size:10px;color:#6b7682;line-height:1.4}
.cutbox,.tournbox{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:13px 14px;margin-bottom:12px}
.trn-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #1a212b;flex-wrap:wrap}
.trn-row:last-of-type{border-bottom:0}
.trn-l{flex:1;min-width:180px}
.trn-l b{font-family:'Syne';font-weight:700;font-size:12px;color:#f0a04b;display:block}
.trn-l i{font-style:normal;font-size:10.5px;color:#6b7682;line-height:1.4}
.trn-m{display:flex;flex-direction:column;gap:2px;text-align:right;flex:none;max-width:52%}
.trn-p{font-family:'DM Mono';font-size:10.5px;color:#7eb8f7;line-height:1.4}
.trn-w{font-family:'DM Mono';font-size:10.5px;color:var(--teal-line);line-height:1.4}
.cut-row{display:grid;grid-template-columns:74px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid #1a212b;font-size:11.5px}
.cut-row:last-child{border-bottom:0}
.cut-row b{font-family:'DM Mono';color:#f0a04b;font-weight:500;font-size:11px}
.cut-row span{color:#9aa3ad;line-height:1.5}
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
