import React, { useState, useMemo } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Trophy, Medal, Shield, TrendingUp, Wallet, Sparkles, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Search, GraduationCap, Flag, Activity, Users, Globe,
  Instagram, Coins, Swords, BarChart2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */
/*  Formatting (USD)                                                    */
/* ─────────────────────────────────────────────────────────────────── */
function usd(n){
  if(n==null||isNaN(n))return"—";
  const neg=n<0; n=Math.abs(n);
  let s;
  if(n>=1e6) s="$"+(n/1e6).toFixed(n>=1e7?1:2)+"M";
  else if(n>=1e3) s="$"+(n/1e3).toFixed(0)+"k";
  else s="$"+Math.round(n).toLocaleString("en-US");
  return(neg?"−":"")+s;
}
function usdS(v){
  const neg=v<0; v=Math.abs(v);
  let s;
  if(v>=1e6) s=(v/1e6).toFixed(1)+"M";
  else if(v>=1e3) s=(v/1e3).toFixed(0)+"k";
  else s=String(Math.round(v));
  return(neg?"−":"")+"$"+s;
}
const numUS=n=>Math.round(n).toLocaleString("en-US");
const pct=x=>(x==null||isNaN(x)?"—":(x*100).toFixed(1)+"%");
const yrs=v=>(v==null?"never":v<=0?"already":v.toFixed(1)+" yrs");

/* ─────────────────────────────────────────────────────────────────── */
/*  COUNTRY FILTER — 7 archetypes from the global roadmap dossier.      */
/* ─────────────────────────────────────────────────────────────────── */
const COUNTRIES={
  "USA / Canada":{costMul:1.6,net:"ncaa",netLabel:"NCAA scholarship path",
    sal:70000,salG:4,edu:25000,netSal:60000,netG:4,
    medal:"USOPC: ≈ $37.5k gold · $22.5k silver · $15k bronze",
    note:"College scholarships absorb development cost; the degree is the safety net. If no D1 offer by 17, academics lead."},
  "W. Europe":{costMul:0.35,net:"club",netLabel:"Club academy + free degree",
    sal:55000,salG:3,edu:3000,netSal:48000,netG:3,
    medal:"Italy ≈ €180k gold · France ≈ €80k · UK £0 cash (stipend model instead)",
    note:"Pro club academies pay stipends and cost near zero; released players fall back on a subsidised university degree."},
  "E. Europe / Nordic":{costMul:0.15,net:"state",netLabel:"State sports system",
    sal:28000,salG:4,edu:2000,netSal:26000,netG:4,
    medal:"state bonuses ≈ $50–200k gold, plus apartments/cars in some systems",
    note:"The state funds the Olympic pipeline end-to-end — but you are a government asset; miss the standard and the state cuts you off."},
  "Asia-Pacific":{costMul:1.1,net:"corporate",netLabel:"Corporate sponsorship + job",
    sal:45000,salG:4,edu:12000,netSal:42000,netG:4,
    medal:"Singapore ≈ $740k gold · Hong Kong ≈ $770k · Japan ≈ $45k",
    note:"Corporate-funded academies and delayed pro contracts; the sponsor's company job is the transition. Secure a sponsor by 16."},
  "South America":{costMul:0.3,net:"export",netLabel:"The export path to Europe",
    sal:18000,salG:5,edu:4000,netSal:15000,netG:4,
    medal:"Brazil (COB) ≈ $50k gold",
    note:"Domestic pay is low; the only real money is a transfer abroad. The safety net is weak — a foreign contract or bust."},
  "Africa":{costMul:0.2,net:"export",netLabel:"Foreign scholarship / export",
    sal:9000,salG:5,edu:2500,netSal:8000,netG:4,
    medal:"typically $5–50k per medal via federation or state, often delayed",
    note:"Raw talent, near-zero cost, but no domestic infrastructure — a foreign scholarship or visa is effectively mandatory to earn."},
  "Middle East / Gulf":{costMul:1.2,net:"state",netLabel:"State-backed academy + post",
    sal:55000,salG:4,edu:8000,netSal:52000,netG:4,
    medal:"reported $500k–1M+ for gold in some Gulf states",
    note:"Oil-wealth academies and high prize money; a state or federation post is the fallback for nationals."},
};

/* ─────────────────────────────────────────────────────────────────── */
/*  SPORT DATA — three income streams, USD. All $k/yr except folStar    */
/*  (millions of followers a top star commands) and fameMax ($k/yr cap).*/
/*  [name, c1,c2,c3, stip, prizeNat,prizeStar, salNat,salStar,          */
/*   fameMax, folStar, L, g3, g4, i2, i4, coach, pension]               */
/* ─────────────────────────────────────────────────────────────────── */
const SPORTS={
  "Bat & Racket":[
    ["Tennis",18,35,40,6, 60,4000, 0,0, 20000,25, 10,10,3,8,12,45,0],
    ["Golf",25,55,50,6, 80,6000, 0,0, 30000,10, 18,8,3,5,8,45,0],
    ["Badminton",6,10,12,5, 30,600, 10,200, 3000,8, 12,15,4,7,10,40,0],
    ["Table Tennis",5,10,10,5, 25,400, 20,300, 1500,3, 14,18,4,6,8,40,0],
    ["Squash",8,15,15,4, 20,300, 5,80, 800,1, 12,15,3,6,8,35,0],
    ["Cricket",5,15,18,8, 10,300, 100,8000, 25000,200, 10,10,5,7,12,25,120],
    ["Chess",5,12,12,4, 40,1500, 10,300, 5000,8, 20,15,4,2,4,35,0],
    ["Snooker / Billiards",5,15,12,4, 30,800, 0,0, 1200,2, 22,15,4,3,5,25,0],
  ],
  "Field & Team":[
    ["Football (Soccer)",5,12,15,10, 5,500, 80,20000, 60000,120, 11,12,4,10,15,40,0],
    ["Basketball",10,25,25,8, 5,300, 100,35000, 40000,60, 11,10,3,8,12,40,0],
    ["American Football",10,30,20,6, 5,200, 200,25000, 20000,20, 8,6,2,15,20,35,0],
    ["Baseball",10,30,20,6, 5,200, 100,25000, 15000,15, 14,8,2,7,10,35,0],
    ["Ice Hockey",15,40,30,6, 5,200, 80,10000, 8000,8, 12,8,3,9,14,30,0],
    ["Rugby",5,15,15,8, 5,150, 60,2500, 4000,5, 9,12,4,10,15,35,0],
    ["Volleyball",5,12,12,6, 5,100, 30,800, 2000,3, 11,14,3,7,11,35,0],
    ["Handball",4,8,10,6, 5,80, 25,600, 1000,1.5, 10,18,4,8,12,40,0],
  ],
  "Combat":[
    ["Boxing",5,15,15,6, 30,8000, 0,0, 30000,40, 8,16,4,12,18,35,0],
    ["MMA (UFC)",10,30,25,6, 40,4000, 0,0, 25000,30, 6,10,4,15,25,5,0],
    ["Wrestling",5,12,12,8, 15,150, 10,120, 2000,3, 10,20,5,12,18,45,0],
    ["Judo / Taekwondo",5,12,12,6, 12,120, 10,100, 1500,2, 10,14,4,10,15,40,0],
  ],
  "Aquatics & Athletics":[
    ["Swimming",12,25,25,8, 20,400, 10,200, 8000,8, 12,12,4,7,10,40,0],
    ["Sprinting / Track",5,15,15,8, 25,800, 5,150, 10000,12, 10,10,3,10,16,45,0],
    ["Marathon / Distance",4,10,10,8, 30,600, 0,0, 5000,4, 15,16,4,7,12,45,0],
    ["Diving",10,25,20,6, 10,150, 8,100, 3000,3, 9,7,3,9,14,35,0],
    ["Rowing",10,20,20,8, 8,80, 8,80, 800,1, 10,10,3,8,12,45,0],
    ["Canoeing / Kayaking",6,15,15,6, 8,80, 8,80, 600,0.8, 10,10,3,8,12,40,0],
    ["Sailing",15,30,30,6, 15,300, 10,150, 2000,1.5, 12,10,3,6,10,20,0],
    ["Triathlon",6,15,15,4, 20,400, 5,100, 3000,2.5, 12,12,3,8,12,20,0],
  ],
  "Precision & Target":[
    ["Shooting (Rifle/Pistol)",10,25,25,8, 20,200, 15,150, 1500,2, 17,20,5,4,6,45,0],
    ["Archery",8,18,18,6, 15,150, 10,120, 1200,1.5, 14,15,4,5,8,40,0],
  ],
  "Strength & Gymnastics":[
    ["Gymnastics",10,25,20,6, 15,300, 10,150, 15000,15, 6,7,3,12,20,35,0],
    ["Weightlifting",5,12,12,8, 12,120, 10,100, 1500,2, 10,16,4,9,14,45,0],
    ["Cycling (Road/Track)",10,25,25,6, 15,300, 60,2500, 5000,4, 12,10,3,9,14,30,0],
  ],
  "Winter Olympic":[
    ["Alpine / X-C Skiing",25,45,40,6, 40,800, 20,300, 8000,5, 12,8,3,10,16,20,0],
    ["Figure / Speed Skating",25,45,35,6, 20,400, 15,200, 6000,5, 10,8,3,9,14,20,0],
    ["Bobsleigh / Luge",30,55,40,6, 10,100, 15,120, 1000,1, 10,8,3,10,15,20,0],
    ["Biathlon",25,40,35,8, 25,400, 15,150, 3000,2, 12,8,3,7,10,25,0],
  ],
  "Emerging & Esports":[
    ["Esports (Valorant/LoL/CS2)",5,15,15,10, 60,3000, 60,2000, 20000,20, 6,25,6,1,2,0,0],
    ["Skateboarding",4,10,12,4, 20,300, 10,150, 8000,8, 10,14,4,8,14,5,0],
    ["Surfing",6,15,15,4, 25,400, 10,150, 8000,6, 12,10,3,6,10,5,0],
    ["Climbing / Bouldering",5,12,12,4, 15,200, 8,100, 3000,3, 12,10,3,7,10,10,0],
    ["Breaking (Breakdance)",4,10,10,4, 15,200, 5,80, 4000,4, 10,14,4,8,12,5,0],
  ],
};

const STAGES=[
  {key:0,label:"Just starting",age:7,sub:"age 6–9 · nothing proven"},
  {key:1,label:"Local / Club",age:12,sub:"age 10–13 · training seriously"},
  {key:2,label:"Regional / State",age:15,sub:"age 14–17 · top ranks reached"},
  {key:3,label:"National",age:19,sub:"age 18–22 · national squad / D1"},
  {key:4,label:"Professional",age:24,sub:"age 23+ · earning from sport"},
];

const CUTOFF_BY_NET={
  ncaa:[
    ["Age 16","No college recruiter contacting you by 16? The private-coaching spend stops paying — protect the GPA."],
    ["Age 17","No D1 scholarship offer by 17? Pivot to D2/D3 with academics first. The degree is the safety net, not the draft."],
    ["Age 22","Not drafted? Roughly 1 in 10,000 college players make it. Use the degree — that was always the plan."],
    ["Any age","A major injury before 20 can withdraw the scholarship offer. Keep the academic backup live."],
  ],
  club:[
    ["Age 14","Not signed to a youth academy by 14? Pivot toward university sport — the pro-club path has effectively closed."],
    ["Age 18","Released at 18? Do not chase lower-tier clubs. Take the subsidised degree the club system offers."],
    ["Age 20","No senior contract by 20? About 1 in 500 academy players get one. Leave and finish the free degree."],
    ["Any age","Cheap to try, ruthless to exit — the moment the academy releases you, switch to the degree track."],
  ],
  state:[
    ["Age 15","Not in a state sports school by 15? The funded pipeline is how this works — outside it, private cost rarely adds up."],
    ["Age 18","Not on the national development squad by 18? Keep a trade or academic skill ready — the state cuts non-performers."],
    ["Age 20","No national championship by 20? Funding gets reallocated. Transition into a state coaching or admin post."],
    ["Any age","Fully funded, performance-gated. Have the exit trade ready before 20."],
  ],
  corporate:[
    ["Age 16","No corporate sponsor by 16? Private money runs out fast here — a sponsor's backing sustains the journey."],
    ["Age 17","Sponsor search failing at 17? Stop spending private funds; this model needs the sponsor to work."],
    ["Age 21","No senior selection by 21? Move into the sponsor company's workforce — the loyalty job is the net."],
    ["Any age","High cost, delayed payoff: the corporate job (not the medal) is usually the real income here."],
  ],
  export:[
    ["Age 17","No foreign scout watching by 17? In this model the only real money is abroad — a scholarship or transfer is the goal."],
    ["Age 20","No foreign contract by 20? Domestic earning is near-impossible; build an academic or vocational backup now."],
    ["Age 22","No overseas move by 22? The math stops working — pivot to a local coaching centre or a degree."],
    ["Any age","The export path is a migration ticket as much as a sport. Without the visa, the domestic ceiling is very low."],
  ],
};

/* ─────────────────────────────────────────────────────────────────── */
/*  TOURNAMENT MONEY — the world ladder. What showing up pays vs what   */
/*  winning pays. Illustrative seeds from public purse structures;      */
/*  they change every season.                                           */
/* ─────────────────────────────────────────────────────────────────── */
const TOURN={
  "Tennis":[
    ["Futures / Challenger","ITF $15–25k · ATP/WTA Challengers","first rounds $200–2k","titles $2–20k"],
    ["Tour level","ATP/WTA 250–1000","main-draw R1 $10–25k","250 titles ≈ $100k · 1000s ≈ $1M"],
    ["Grand Slams","AO · RG · Wimbledon · US Open","first-round loser ≈ $75–110k","champion ≈ $3–3.6M"],
  ],
  "Golf":[
    ["Mini tours","Regional pro tours","missed cut ≈ $0","$5–30k"],
    ["Main tours","DP World · PGA Tour","made cut ≈ $15–40k","events $1–3.6M to the winner"],
    ["Majors","Masters · PGA · US Open · The Open","made cut ≈ $40k+","champion ≈ $3.6–4.3M"],
  ],
  "Football (Soccer)":[
    ["Academy / lower leagues","Youth contracts, tier 2–4","stipends–$50k salaries","promotion bonuses"],
    ["Top-5 leagues","EPL · La Liga · Bundesliga …","salaries $0.5–20M+","title & cup bonuses"],
    ["Continental & World Cup","UCL · FIFA World Cup","UCL group stage ≈ €15M+ (club)","WC winners' pool $42M (federation, 2022)"],
  ],
  "Basketball":[
    ["Overseas pro","EuroLeague, Asia, G-League","$25–500k salaries","playoff bonuses"],
    ["NBA","NBA contracts","rookie minimum ≈ $1.2M","max deals $50M+/yr · playoff pool"],
  ],
  "Cricket":[
    ["Domestic","First-class & T20 leagues","match fees & contracts","league titles"],
    ["Franchise leagues","IPL · BBL · The Hundred","IPL base ≈ $36k; benches earn fully","IPL deals to $2M+ · champions ≈ $2.4M (team)"],
    ["ICC events","T20 & ODI World Cups","participation shares to boards","winners ≈ $2.45M (team, 2024)"],
  ],
  "Boxing":[
    ["Club / 4-rounders","Small-hall cards","$1–4k a fight","building a record"],
    ["Regional titles","National & continental belts","$10–50k purses","$50–200k"],
    ["World title","Championship fights","challenger purses $250k+","$1M–100M+ for marquee names"],
  ],
  "MMA (UFC)":[
    ["Regional circuits","LFA, Cage Warriors etc.","$1–5k / fight","$5–20k + contract shot"],
    ["UFC entry","Standard contracts","≈ $12k show + $12k win","bonuses $50k"],
    ["Title level","Champions & PPV","$500k+ base","$1–10M+ with PPV points"],
  ],
  "Chess":[
    ["Open circuit","Weekend & GM opens","entry $50–200","$2–50k first prizes"],
    ["Elite invitations","Grand Chess Tour, national leagues","appearance conditions","tour events $50–100k"],
    ["World cycle","Candidates · World Ch.","Candidates share of €500k pool","World Ch. pool ≈ €2–2.5M"],
  ],
  "Esports (Valorant/LoL/CS2)":[
    ["Open qualifiers","Regional opens","free entry","qualification + small pools"],
    ["Franchise/partner leagues","VCT · LEC/LCS · CS tier-1","org salaries $60k–500k","splits & event wins"],
    ["World events","Champions · Worlds · Majors · TI","appearance shares","pools $1.25M–$40M era peaks; winners' cut $200k–$1M+ each"],
  ],
  "Sprinting / Track":[
    ["National circuit","National champs & meets","small appearance fees","$1–10k"],
    ["Diamond League","14-leg elite series","appearance $2–20k (stars more)","$10k a win · $30k the final"],
    ["Worlds & Olympics","World Ch. · Olympic Games","funded travel","Worlds gold $70k · Paris '24 paid $50k gold"],
  ],
  "Marathon / Distance":[
    ["City races","National road circuit","small elite fees","$2–20k"],
    ["World Marathon Majors","Boston · London · Berlin …","elite appearance $10–300k","winners $100–160k + series bonus"],
  ],
  "Swimming":[
    ["National circuit","Trials & nationals","funded","modest"],
    ["World Cup & Worlds","FINA/World Aquatics circuit","appearance modest","$10–12k a World Cup win · Worlds gold ≈ $20k"],
  ],
  "Badminton":[
    ["Continental circuit","International Series/Challenge","first rounds $100–1k","$1–8k"],
    ["BWF World Tour","Super 300–1000","R1 $1–5k","Super 1000 champion ≈ $80–100k"],
  ],
};
const TOURN_GEN=[
  ["National circuit","National championships & trials","federation-funded travel","$1–10k + selection"],
  ["Continental","Continental championships & games","funded","$5–30k medals (varies)"],
  ["World level","World championships & cups","funded","$20–70k gold at Worlds (sport-dependent)"],
  ["Olympics","The Games","no IOC prize money","national medal bonuses — see the table below"],
];
const tournFor=(name)=>TOURN[name]||TOURN_GEN;

/* engine + UI in part 2 */
/* ─────────────────────────────────────────────────────────────────── */
/*  Engine — stage-gate funnel × three simultaneous income streams,     */
/*  re-wired per country. Seven terminal outcomes; ΣP = 1 exactly.      */
/* ─────────────────────────────────────────────────────────────────── */
const END_AGE=60;

function unpack(row){
  const[name,c1,c2,c3,stip,prizeNat,prizeStar,salNat,salStar,fameMax,folStar,
    L,g3,g4,i2,i4,coach,pension]=row;
  return{name,c1:c1*1e3,c2:c2*1e3,c3:c3*1e3,stip:stip*1e3,
    prizeNat:prizeNat*1e3,prizeStar:prizeStar*1e3,
    salNat:salNat*1e3,salStar:salStar*1e3,
    fameMax:fameMax*1e3,folStar,
    L,g3,g4,i2,i4,coach:coach*1e3,pension:pension*1e3};
}
function cfAt(age,g){
  if(age<18)return 0;
  if(age<22)return -g.eduCost;
  return g.cfSal*Math.pow(1+g.cfG/100,age-22);
}
/* fame → annual endorsement income. Followers (millions) drive it.
   Anchor: ≈ $8–13k/yr per 100k followers at the default rate. */
function fameIncome(followersM,s,P){
  if(followersM<=0)return 0;
  const perM=P.fameRate*1e3;                        // $/yr per (million^0.92)
  const base=perM*Math.pow(followersM,0.92)*1.6;
  return Math.min(base, s.fameMax*P.fameCeilMul);
}
function prizeAt(l,s,P){
  if(l<=0)return 0;
  const nat=s.prizeNat*P.prizeMul, star=s.prizeStar*P.prizeMul;
  if(l>=1)return star;
  if(l>=0.66)return nat+(star-nat)*((l-0.66)/0.34);
  return nat*(l/0.66);
}
function salaryAt(l,s,P){
  if(l<0.5)return 0;
  const nat=s.salNat*P.salMul, star=s.salStar*P.salMul;
  if(l>=1)return star;
  if(l>=0.66)return nat+(star-nat)*((l-0.66)/0.34);
  return nat*((l-0.5)/0.16);
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
/* four tracked buckets: prize, salary (playing contract incl. stipend),
   fame (endorsements), after (post-career / safety-net / fallback). */
function makeStreams(s,P,level,followersM,proEnd,salaryOn){
  return a=>{
    if(a<18)return {cost:a<14?-P.c1:-P.c2,prize:0,salary:0,fame:0,after:0};
    if(a<23)return {cost:-P.c3,prize:prizeAt(level*0.5,s,P)*0.3,salary:s.stip,fame:fameIncome(followersM*0.3,s,P),after:0};
    if(a<proEnd){
      return {cost:0,prize:prizeAt(level,s,P),
        salary:salaryOn?salaryAt(level,s,P):0,
        fame:fameIncome(followersM,s,P),after:0};
    }
    return {cost:0,prize:0,salary:0,after:s.coach*(1+level*1.5)+s.pension,fame:fameIncome(followersM*0.4,s,P)*0.5};
  };
}

function simulate(sport,C,P,g){
  const s=sport, stage=P.stage, startAge=P.curAge;
  const g1=stage>=2?1:P.g1/100;
  const g2r=stage>=3?1:P.g2/100, i2=stage>=3?0:s.i2/100; const g2=g2r*(1-i2);
  const g3r=stage>=4?1:P.g3/100, i3=stage>=4?0:(s.i2/100)*0.7; const g3=g3r*(1-i3);
  const g4=P.g4/100, net18=P.net18/100, net24=P.net24/100;

  const pHobby=1-g1;
  const e18=g1*(1-g2); const pN18=e18*net18, pW18=e18*(1-net18);
  const e24=g1*g2*(1-g3); const pN24=e24*net24, pC24=e24*(1-net24);
  const pPro=g1*g2*g3*(1-g4), pStar=g1*g2*g3*g4;

  const Leff=Math.max(2,s.L*(1-(s.i4/100)/2));
  const proEnd=23+Math.round(Leff);
  const cost=a=>a<14?-P.c1:(a<18?-P.c2:0);

  const folStar=s.folStar*P.fameMul, folPro=folStar*0.15, folState=folStar*0.03, folNat=folStar*0.06;

  const netName={ncaa:"Degree + corporate job",club:"Free degree, other career",
    state:"State coaching / admin post",corporate:"Sponsor-company career",
    export:"Local coaching / vocational"}[C.net];

  const streamStar=makeStreams(s,P,1.0,folStar,proEnd,true);
  const streamPro =makeStreams(s,P,0.7,folPro,proEnd,true);
  const streamN24=(a)=>{
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<23)return{cost:-P.c3,prize:prizeAt(0.4,s,P)*0.3,salary:s.stip,fame:fameIncome(folNat*0.4,s,P),after:0};
    if(a<24)return{cost:0,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:C.netSal*1.15*Math.pow(1+C.netG/100,a-24),fame:fameIncome(folNat*0.3,s,P)*0.5};
  };
  const streamN18=(a)=>{
    if(a<18)return{cost:cost(a),prize:0,salary:0,fame:0,after:0};
    if(a<20)return{cost:-P.c3*0.5,prize:0,salary:0,fame:0,after:0};
    return{cost:0,prize:0,salary:0,after:C.netSal*Math.pow(1+C.netG/100,a-20),fame:fameIncome(folState*0.5,s,P)*0.5};
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
    net24:{label:netName+" (from 24)",icon:"🛡️",color:"#E8922A",stream:streamN24,
      note:"A national-level record converts into the country's safety-net career — the quiet backbone of the model."},
    coach24:{label:"Coaching pivot at 24",icon:"📣",color:"#b08de0",stream:streamCoach,
      note:"No pro living, but national exposure feeds coaching and a modest personal brand."},
    net18:{label:netName+" (from 20)",icon:"🛡️",color:"#f0a04b",stream:streamN18,
      note:C.net==="ncaa"?"The scholarship route: the degree was always the plan; sport paid for it.":
        C.net==="club"?"Released by the academy — the subsidised degree carries you to a normal career.":
        C.net==="export"?"No move abroad — a modest local income; the ceiling here is low.":
        "The system absorbs you into a funded post."},
    wash18:{label:"Washed out at 18 — weak net",icon:"⚠️",color:"#f0604b",stream:streamWash,
      note:C.net==="export"?"No foreign move and academics sacrificed — the hardest landing in this model.":
        "Academics sacrificed for a path that closed early; the fallback job starts late and pays less."},
    hobby:{label:"Back to studies at 14",icon:"📚",color:"#8a94a0",stream:streamHobby,
      note:"Sport stays a hobby; the ordinary path resumes. Early coaching is the only cost."},
  };

  const defs=[["hobby",pHobby],["wash18",pW18],["net18",pN18],
    ["coach24",pC24],["net24",pN24],["pro",pPro],["star",pStar]];
  const branches=defs.map(([k,p])=>{
    const bc=branchCurve(flat(B[k].stream),startAge,g);
    let tp=0,ts=0,tf=0,ta=0;
    for(let a=startAge;a<=END_AGE;a++){const x=B[k].stream(a);tp+=x.prize;ts+=x.salary;tf+=x.fame;ta+=(x.after||0);}
    return{key:k,p,...B[k],...bc,streamTot:{prize:tp,salary:ts,fame:tf,after:ta}};
  });

  const n=branches[0].ages.length;
  const expCum=new Array(n).fill(0);
  branches.forEach(b=>{for(let i=0;i<n;i++)expCum[i]+=b.p*b.cum[i];});
  const expNPV=Math.round(branches.reduce((t,b)=>t+b.p*b.npv,0));

  const expInc=[];
  for(let i=0;i<n;i++){
    let v=0;branches.forEach(b=>{const prev=i===0?0:b.cum[i-1];v+=b.p*(b.cum[i]-prev);});
    expInc.push(v);
  }
  const irr=irrOf(expInc);
  let payback=null,acc=0;
  for(let i=0;i<n;i++){acc+=expInc[i];if(acc>=0){payback=branches[0].ages[i]-startAge;break;}}

  /* income mix — blended across the PLAYING branches (star + pro) */
  const playBr=branches.filter(b=>b.key==="star"||b.key==="pro");
  const pw=playBr.reduce((t,b)=>t+b.p,0)||1;
  const mix={prize:0,salary:0,fame:0,after:0};
  playBr.forEach(b=>{const w=b.p/pw;mix.prize+=w*b.streamTot.prize;mix.salary+=w*b.streamTot.salary;mix.fame+=w*b.streamTot.fame;mix.after+=w*b.streamTot.after;});
  const mixTot=mix.prize+mix.salary+mix.fame+mix.after||1;

  const N=10000;
  const funnel=[
    {label:stage>=2?"Where you stand":"Committed juniors",n:N},
    ...(stage<2?[{label:"Reach regional/state (14)",n:N*g1}]:[]),
    ...(stage<3?[{label:"Reach national/D1 (18)",n:N*g1*g2}]:[]),
    ...(stage<4?[{label:"Earn a playing living (23)",n:N*g1*g2*g3}]:[{label:"Earning a playing living",n:N*g1*g2*g3}]),
    {label:"Reach the top 1%",n:N*g1*g2*g3*g4},
  ];
  const oneIn=g1*g2*g3>0?Math.round(1/(g1*g2*g3)):null;

  const posEV=branches.filter(b=>b.p*b.npv>0).reduce((t,b)=>t+b.p*b.npv,0);
  const netEV=pN18*Math.max(0,branches.find(b=>b.key==="net18").npv)
             +pN24*Math.max(0,branches.find(b=>b.key==="net24").npv);
  const netShare=posEV>0?Math.round(100*netEV/posEV):0;
  const playTot=mix.prize+mix.salary+mix.fame||1;
  const fameShare=Math.round(100*mix.fame/playTot);

  const flags=[];
  const stageCost=stage<3?P.c2:P.c3;
  if(g.famInc>0&&stageCost>0.2*g.famInc)
    flags.push(`Training at this stage runs ${usd(stageCost)}/yr — over 20% of the family's ${usd(g.famInc)} income. Beyond this line you need a scholarship, state backing, or a sponsor.`);
  if(C.net==="export"&&(g1*g2*g3<0.004)&&fameShare<25)
    flags.push(`In this model the only real income is abroad, playing odds sit under 0.4%, and endorsement upside is limited. Without a foreign scholarship or transfer, plan for a domestic ceiling and an academic backup.`);
  if(s.i4>=16)
    flags.push(`High-injury sport: one bad year can end it — and in several models an injury before 20 withdraws the scholarship. Keep the backup live.`);
  if(fameShare>=40)
    flags.push(`Note: ${fameShare}% of the playing-career money here is off-field — endorsements and audience, not prize or salary. That income depends on building a following, a different skill from winning, and worth deliberately cultivating.`);

  return{branches,expCum,expNPV,irr,payback,ages:branches[0].ages,funnel,oneIn,netShare,fameShare,mix,mixTot,flags,
    probs:{pHobby,pW18,pN18,pC24,pN24,pPro,pStar},proEnd,Leff:Math.round(Leff),folStar,netName};
}

/* Monte Carlo — jitter the gate odds */
function monteCarlo(sport,C,P,g,sigma,N=250){
  const trials=[];
  for(let i=0;i<N;i++){
    const jit=(v,lo,hi)=>{
      const u1=Math.random(),u2=Math.random();
      const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      return Math.max(lo,Math.min(hi,v+z*sigma));
    };
    const PP={...P,g1:jit(P.g1,1,80),g2:jit(P.g2,1,80),g3:jit(P.g3,1,90),g4:jit(P.g4,0.2,40)};
    trials.push(simulate(sport,C,PP,g).expCum);
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
  const pc=((val-min)/(max-min))*100;
  return(<label className="sld"><span className="sld-top">
      <span className="fld-l">{label} {badge}</span>
      <span className={"sld-v "+accent}>{val}{suffix}</span></span>
    <input className={"range "+accent} type="range" min={min} max={max} step={step} value={val}
      aria-label={label} aria-valuetext={`${val}${suffix}`}
      onChange={e=>onChange(parseFloat(e.target.value))}
      style={{"--p":pc+"%"}}/>
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
function verdict(A,B,compare,C){
  const bits=[];let tag;
  if(compare){
    const nm=w=>w==="A"?A.sport.name:B.sport.name;
    const wN=A.m.expNPV>=B.m.expNPV?"A":"B",lN=wN==="A"?"B":"A";
    const W=wN==="A"?A:B,L=lN==="A"?A:B;
    if(W.m.expNPV<0){tag="Neither beats the desk";
      bits.push(`Expected across every future, both ${A.sport.name} and ${B.sport.name} trail the ordinary study-and-job path in ${C.name} — the safety net is doing the heavy lifting in each.`);}
    else{tag=`${nm(wN)} leads`;
      bits.push(`Expected across all seven futures, ${nm(wN)} lands ${usd(W.m.expNPV)} ahead of the ordinary path against ${usd(L.m.expNPV)} for ${nm(lN)}.`);}
    if(Math.abs(A.m.fameShare-B.m.fameShare)>=15){
      const hi=A.m.fameShare>B.m.fameShare?A:B;
      bits.push(`${hi.sport.name} leans far more on off-field income (${hi.m.fameShare}% endorsements) — a bet on building an audience as much as on winning.`);}
    return{tag,line:bits.join(" ")};
  }
  const m=A.m,s=A.sport;
  if(m.expNPV>0){tag="The path carries its weight";
    bits.push(`Weighted across all seven futures, ${s.name} in ${C.name} is expected to leave you ${usd(m.expNPV)} ahead of the ordinary study-and-job path, in today's money.`);}
  else{tag="The dream costs more than it pays";
    bits.push(`Weighted across all seven futures, ${s.name} in ${C.name} is expected to leave you ${usd(Math.abs(m.expNPV))} behind the ordinary path, in today's money.`);}
  if(m.oneIn)bits.push(`From here, about 1 in ${numUS(m.oneIn)} make a playing living.`);
  if(m.fameShare>=35)
    bits.push(`Notably, ${m.fameShare}% of the playing-career income is off-field — endorsements and following, not prize or salary. Winning gets you noticed; the audience is what pays.`);
  else if(m.netShare>=50)
    bits.push(`And ${m.netShare}% of the positive expected value comes from the ${C.netLabel.toLowerCase()} — that fallback is the real plan; the medals are the bonus.`);
  return{tag,line:bits.join(" ")};
}

function seedParams(sport,C,stage,curAge){
  const netSeed={ncaa:[35,45],club:[40,50],state:[45,60],corporate:[30,45],export:[10,20]}[C.net];
  const mul=C.costMul;
  return{_sport:sport.name,_country:C.name,stage,curAge,
    g1:8,g2:10,g3:sport.g3,g4:sport.g4,
    net18:netSeed[0],net24:netSeed[1],
    c1:Math.round(sport.c1*mul),c2:Math.round(sport.c2*mul),c3:Math.round(sport.c3*mul),
    haircut:20,
    prizeMul:100,salMul:100,fameMul:100,fameRate:80,fameCeilMul:100};
}
function normP(P){
  return{...P,prizeMul:P.prizeMul/100,salMul:P.salMul/100,fameMul:P.fameMul/100,
    fameCeilMul:P.fameCeilMul/100,fameRate:P.fameRate};
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main                                                                */
/* ─────────────────────────────────────────────────────────────────── */
const SLOT={A:"#34c79a",B:"#f0a04b"};

export default function App(){
  const[country,setCountry]=useState("USA / Canada");
  const[stage,setStage]=useState(1);
  const[curAge,setCurAge]=useState(12);
  const[slots,setSlots]=useState({
    A:{cat:"Field & Team",idx:0,P:null},   /* Football */
    B:{cat:"Bat & Racket",idx:0,P:null},   /* Tennis */
  });
  const[assign,setAssign]=useState("A");
  const[compare,setCompare]=useState(false);
  const[filter,setFilter]=useState("");
  const[showMC,setShowMC]=useState(false);
  const[sigma,setSigma]=useState(4);
  const[g,setG]=useState({cfSal:70000,cfG:4,disc:8,eduCost:25000,famInc:90000});
  const[bm,setBm]=useState({pride:8,discipline:9,fitness:8,network:6,love:9});
  const[strain,setStrain]=useState({body:7,family:7,academics:8});
  const[open,setOpen]=useState({gates:true,income:true,net:false,money:false,beyond:false,effort:false});
  const[showBr,setShowBr]=useState({star:true,pro:true,net24:true,wash18:true});

  const C={name:country,...COUNTRIES[country]};
  const build=(slot)=>{
    const sport=unpack(SPORTS[slot.cat][slot.idx]);
    const P=slot.P&&slot.P._sport===sport.name&&slot.P._country===country?slot.P:seedParams(sport,C,stage,curAge);
    const m=simulate(sport,C,{...normP(P),stage,curAge},g);
    return{sport,P,m};
  };
  const A=useMemo(()=>build(slots.A),[slots.A,country,stage,curAge,g]);
  const B=useMemo(()=>build(slots.B),[slots.B,country,stage,curAge,g]);
  const cur=assign==="A"?A:B;
  const F=compare?A:cur;
  const mc=useMemo(()=>showMC&&!compare?monteCarlo(cur.sport,C,{...normP(cur.P),stage,curAge},g,sigma):null,
    [showMC,compare,cur,country,stage,curAge,g,sigma]);
  const vd=verdict(A,B,compare,C);
  const cutoffs=CUTOFF_BY_NET[C.net];

  const setSlotP=(slot,patch)=>setSlots(p=>{
    const sl=p[slot];const sport=unpack(SPORTS[sl.cat][sl.idx]);
    const base=sl.P&&sl.P._sport===sport.name&&sl.P._country===country?sl.P:seedParams(sport,C,stage,curAge);
    return{...p,[slot]:{...sl,P:{...base,...patch,stage,curAge}}};
  });
  const pick=(cat,idx)=>setSlots(p=>({...p,[assign]:{cat,idx,P:null}}));
  const setStage1=(k)=>{setStage(k);setCurAge(STAGES[k].age);
    setSlots(p=>({A:{...p.A,P:null},B:{...p.B,P:null}}));};
  const pickCountry=(c)=>{
    setCountry(c);
    const CC=COUNTRIES[c];
    setG(gp=>({...gp,cfSal:CC.sal,cfG:CC.salG,eduCost:CC.edu,famInc:Math.round(CC.sal*1.3)}));
    setSlots(p=>({A:{...p.A,P:null},B:{...p.B,P:null}}));
  };

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
  const outcomeOrder=["star","pro","net24","net18","coach24","wash18","hobby"];

  const cmpRows=[
    {label:"Expected value (NPV)",a:A.m.expNPV,b:B.m.expNPV,fmt:usd,better:"high"},
    {label:"Expected return (IRR)",a:A.m.irr,b:B.m.irr,fmt:pct,better:"high"},
    {label:"Make a living: 1 in",a:A.m.oneIn,b:B.m.oneIn,fmt:x=>x?numUS(x):"—",better:"low"},
    {label:"Top-1% odds",a:A.m.probs.pStar,b:B.m.probs.pStar,fmt:x=>(x*100).toFixed(2)+"%",better:"high"},
    {label:"Off-field income share",a:A.m.fameShare/100,b:B.m.fameShare/100,fmt:x=>Math.round(x*100)+"%",better:"high"},
    {label:"Safety-net share",a:A.m.netShare/100,b:B.m.netShare/100,fmt:x=>Math.round(x*100)+"%",better:"low"},
  ];

  return(
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot"/> CatalystBox</div>
        <span className="eyebrow">Sibling to the Education &amp; Margin calculators · Global Edition</span>
        <h1>Podium</h1>
        <p className="sub">The Athlete Career Calculator — Worldwide</p>
        <p className="lede">A sporting life is a <b>ladder of gates</b> — and money arrives in <b style={{color:"#f5c563"}}>three streams at once</b>: <b style={{color:SLOT.A}}>prize money</b> that scales with the level you reach, a <b style={{color:"#7eb8f7"}}>salary or contract</b> where a league exists, and <b style={{color:"#e08de0"}}>endorsements</b> that follow fame — and pay even when you never top the podium. The same climb pays out completely differently by <em>where in the world</em> you attempt it, so the country filter re-wires the safety net, the costs, and the medal bonuses to match.</p>
      </header>

      {/* ── country filter ── */}
      <div className="hero cc">
        <div className="hero-top"><span className="hero-l"><Globe size={12}/> Where in the world?</span></div>
        <div className="ccwrap">
          {Object.keys(COUNTRIES).map(c=>(
            <button key={c} className={"ccbtn "+(country===c?"on":"")} onClick={()=>pickCountry(c)}>{c}</button>))}
        </div>
        <div className="cc-note">{C.note}</div>
      </div>

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
          money already spent is sunk — every number is the decision <b>from today</b>. Passed gates lock at 100%.
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
            {stage<2&&<Slider label="Reach regional/state rank by 14" val={cur.P.g1} onChange={x=>setSlotP(assign,{g1:x})} max={60} accent="teal" left="long shot" right="clear talent"/>}
            {stage<3&&<Slider label="Regional → national / D1 by 18" val={cur.P.g2} onChange={x=>setSlotP(assign,{g2:x})} max={60} accent="teal" left="rare" right="dominant"/>}
            {stage<4&&<Slider label="National → earning a playing living" val={cur.P.g3} onChange={x=>setSlotP(assign,{g3:x})} max={80} accent="teal" left="no pro tier" right="deep pro tier" sub={`Seeded for ${cur.sport.name}.`}/>}
            <Slider label="Pro → top 1% (the podium)" val={cur.P.g4} onChange={x=>setSlotP(assign,{g4:x})} max={25} accent="amber" left="lottery" right="generational"/>
            <div className="oneIn">{cur.m.oneIn?<>From here: <b>1 in {numUS(cur.m.oneIn)}</b> make a playing living · injury priced in</>:"Playing odds locked — already pro"}</div>
          </Sec>

          <Sec icon={<Coins size={16}/>} title="The three income streams" sub="Prize · salary · fame — the engine's core"
            open={open.income} onToggle={()=>setOpen(p=>({...p,income:!p.income}))}>
            <div className="strhead"><Coins size={12}/> Prize money — scales with level reached</div>
            <Slider label="Prize scale" val={cur.P.prizeMul} onChange={x=>setSlotP(assign,{prizeMul:x})} min={0} max={300} suffix="%" accent="teal" left="lean circuit" right="rich circuit"
              sub={`At national level ≈ ${usd(cur.sport.prizeNat*cur.P.prizeMul/100)}/yr, at top-1% ≈ ${usd(cur.sport.prizeStar*cur.P.prizeMul/100)}/yr.`}/>
            <div className="strhead"><Wallet size={12}/> Salary / league contract</div>
            <Slider label="Salary scale" val={cur.P.salMul} onChange={x=>setSlotP(assign,{salMul:x})} min={0} max={300} suffix="%" accent="teal" left="no league" right="rich league"
              sub={`Top contract ≈ ${usd(cur.sport.salStar*cur.P.salMul/100)}/yr. Prize-circuit sports (tennis, golf, boxing) sit at 0 by design.`}/>
            <div className="strhead"><Instagram size={12}/> Fame &amp; endorsements — the off-field engine</div>
            <Slider label="Reach / following scale" val={cur.P.fameMul} onChange={x=>setSlotP(assign,{fameMul:x})} min={0} max={400} suffix="%" accent="amber" left="private" right="household name"
              sub={`A top star in ${cur.sport.name} ≈ ${(F.m.folStar).toFixed(1)}M followers at this setting.`}/>
            <Slider label="$k per million followers / yr" val={cur.P.fameRate} onChange={x=>setSlotP(assign,{fameRate:x})} min={0} max={400} step={5} suffix="k" accent="amber" left="niche" right="premium brand"
              sub="≈ $8–13k/yr per 100k followers at the default. Endorsements pay even in non-pro branches."/>
          </Sec>

          <Sec icon={<Shield size={16}/>} title="The safety net" sub={C.netLabel+" — the "+C.name+" model"}
            open={open.net} onToggle={()=>setOpen(p=>({...p,net:!p.net}))}>
            <div className="netbanner">{C.note}</div>
            <Slider label="Fall into the safety net at regional exit" val={cur.P.net18} onChange={x=>setSlotP(assign,{net18:x})} max={90} accent="amber" left="no net" right="strong net"/>
            <Slider label="Safety net with a national record" val={cur.P.net24} onChange={x=>setSlotP(assign,{net24:x})} max={95} accent="amber"/>
            <div className="netread">
              <span className="nr-l">Safety-net income (set by country)</span>
              <span className="nr-v">{usd(C.netSal)}/yr · grows {C.netG}%/yr</span>
            </div>
            <Num label="Washout haircut if academics were sacrificed" k="haircut" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} step={5} suffix="%" hint="Lost years = a weaker fallback job than the ordinary path."/>
          </Sec>

          <Sec icon={<Wallet size={16}/>} title="Costs & baseline" sub={"USD · costs pre-scaled ×"+C.costMul+" for "+C.name}
            open={open.money} onToggle={()=>setOpen(p=>({...p,money:!p.money}))}>
            <div className="grid3">
              <Num label="Cost/yr (6–14)" k="c1" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="$" step={500}/>
              <Num label="Cost/yr (14–18)" k="c2" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="$" step={500}/>
              <Num label="Cost/yr (18–23)" k="c3" s={cur.P} set={(k,v)=>setSlotP(assign,{[k]:v})} prefix="$" step={500}/>
            </div>
            <div className="grid3">
              <Num label="Family income /yr" k="famInc" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="$" hint="Drives the 20% red flag."/>
              <Num label="Ordinary salary at 22" k="cfSal" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="$"/>
              <Num label="Its growth /yr" k="cfG" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} step={1} suffix="%"/>
            </div>
            <div className="grid2">
              <Num label="College cost /yr (18–22)" k="eduCost" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} prefix="$"/>
              <Num label="Discount rate" k="disc" s={g} set={(k,v)=>setG(p=>({...p,[k]:v}))} step={0.5} suffix="%"/>
            </div>
            <div className="mini">Peak window for {cur.sport.name}: ~{cur.m.Leff} earning years (injury-adjusted from {cur.sport.L}). Ordinary-path salary and college cost are seeded by the country preset — edit freely.</div>
          </Sec>

          <Sec icon={<Clock size={16}/>} title="Strain" sub="What the pursuit costs beyond money"
            open={open.effort} onToggle={()=>setOpen(p=>({...p,effort:!p.effort}))}>
            <Slider label="Body toll & injury fear" val={strain.body} onChange={x=>setStrain(p=>({...p,body:x}))} min={0} max={10} suffix="" accent="amber" left="light" right="brutal"/>
            <Slider label="Family financial strain" val={strain.family} onChange={x=>setStrain(p=>({...p,family:x}))} min={0} max={10} suffix="" accent="amber" left="light" right="heavy"/>
            <Slider label="Academic sacrifice" val={strain.academics} onChange={x=>setStrain(p=>({...p,academics:x}))} min={0} max={10} suffix="" accent="amber" left="none" right="total"/>
          </Sec>

          <Sec icon={<Sparkles size={16}/>} title="Beyond money" sub="Rated 0–10 · kept separate from the money"
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

          <div className="tiles">
            <div className="tile"><span className="t-l"><TrendingUp size={12}/> Expected value</span>
              <span className={"t-v "+(F.m.expNPV>=0?"pos":"neg")}>{usd(F.m.expNPV)}</span><span className="t-s">vs the ordinary path, today's $</span></div>
            <div className="tile"><span className="t-l"><BarChart2 size={12}/> Expected return</span>
              <span className="t-v">{pct(F.m.irr)}</span><span className="t-s">IRR · breaks even {yrs(F.m.payback)}</span></div>
            <div className="tile"><span className="t-l"><Instagram size={12}/> Off-field share</span>
              <span className="t-v amber">{F.m.fameShare}%</span><span className="t-s">endorsements in a playing career</span></div>
            <div className="tile"><span className="t-l"><Shield size={12}/> Safety-net share</span>
              <span className="t-v">{F.m.netShare}%</span><span className="t-s">of positive expected value</span></div>
          </div>

          <div className="funnelbox">
            <div className="chart-h"><span><Users size={12}/> The funnel — {F.sport.name} in {C.name}</span></div>
            {F.m.funnel.map((f,i)=>{
              const w=Math.max(1.6,Math.sqrt(f.n/maxFun)*100);
              const disp=f.n>=10?numUS(f.n):f.n>=1?f.n.toFixed(0):f.n.toFixed(1);
              return(<div key={i} className="fun-row">
                <span className="fun-lab">{f.label}</span>
                <div className="fun-track"><i style={{width:w+"%"}}/></div>
                <span className="fun-n">{disp}</span></div>);})}
            <div className="fun-note">of {numUS(maxFun)} at your start · √ scale so the small numbers stay visible</div>
          </div>

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
                <YAxis tickFormatter={usdS} tick={{fontSize:10,fill:"#8a94a0"}} tickLine={false} axisLine={false} width={52}/>
                <Tooltip contentStyle={{background:"#0d1219",border:"1px solid #2a313d",borderRadius:10,fontSize:12,fontFamily:"DM Mono, monospace"}}
                  labelFormatter={l=>"Age "+l}
                  formatter={(val,nm)=>{
                    const names={exp:"Expected",a:A.sport.name,b:B.sport.name,star:"Top 1%",pro:"Pro living",net24:F.m.netName+" (24)",net18:F.m.netName+" (20)",coach24:"Coaching",wash18:"Washout",hobby:"Studies",band:"10–90th pct"};
                    return[Array.isArray(val)?usd(val[0])+" – "+usd(val[1]):usd(val),names[nm]||nm];}}/>
                <ReferenceLine y={0} stroke="#4a525e" strokeWidth={1}/>
                {!compare&&showMC&&<Area type="monotone" dataKey="band" stroke="none" fill="url(#mcb)"/>}
                {compare?(<>
                  <Line type="monotone" dataKey="a" stroke={SLOT.A} strokeWidth={2.4} dot={false}/>
                  <Line type="monotone" dataKey="b" stroke={SLOT.B} strokeWidth={2.4} dot={false}/>
                </>):(<>
                  {showBr.star&&<Line type="monotone" dataKey="star" stroke="#34c79a" strokeWidth={1.7} dot={false}/>}
                  {showBr.pro&&<Line type="monotone" dataKey="pro" stroke="#7eb8f7" strokeWidth={1.7} dot={false}/>}
                  {showBr.net24&&<Line type="monotone" dataKey="net24" stroke="#E8922A" strokeWidth={1.7} dot={false}/>}
                  {showBr.wash18&&<Line type="monotone" dataKey="wash18" stroke="#f0604b" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>}
                  <Line type="monotone" dataKey="exp" stroke="#fff" strokeWidth={2.3} strokeDasharray="2 3" dot={false}/>
                </>)}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="legend">
              {compare?(<>
                <span><i className="sw" style={{background:SLOT.A}}/>{A.sport.name}</span>
                <span><i className="sw" style={{background:SLOT.B}}/>{B.sport.name}</span>
                <span><i className="sw" style={{background:"#4a525e"}}/>desk = $0 line</span>
              </>):(<>
                {[["star","Top 1%","#34c79a"],["pro","Pro","#7eb8f7"],["net24","Safety net","#E8922A"],["wash18","Washout","#f0604b"]].map(([k,l,c])=>(
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
            <div className="stackbox">
              <div className="chart-h"><span><Coins size={12}/> Income mix in a playing career (pro / top-1%)</span></div>
              <div className="stack">
                <div className="stk prize" style={{width:(F.m.mix.prize/F.m.mixTot*100)+"%"}} title="Prize"/>
                <div className="stk sal" style={{width:(F.m.mix.salary/F.m.mixTot*100)+"%"}} title="Salary"/>
                <div className="stk fame" style={{width:(F.m.mix.fame/F.m.mixTot*100)+"%"}} title="Fame"/>
                <div className="stk aft" style={{width:(F.m.mix.after/F.m.mixTot*100)+"%"}} title="Coaching & after"/>
              </div>
              <div className="stack-key">
                <span><i className="sw" style={{background:"#34c79a"}}/>Prize {Math.round(F.m.mix.prize/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#7eb8f7"}}/>Salary {Math.round(F.m.mix.salary/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#E8922A"}}/>Fame {Math.round(F.m.mix.fame/F.m.mixTot*100)}%</span>
                <span><i className="sw" style={{background:"#6b7682"}}/>Coach+after {Math.round(F.m.mix.after/F.m.mixTot*100)}%</span>
              </div>
              <div className="fun-note">blended across the pro &amp; top-1% futures — the outcomes where sport is the income · lifetime gross</div>
            </div>

            {/* tournament money ladder */}
            <div className="tournbox">
              <div className="chart-h"><span><Trophy size={12}/> Tournament money — {F.sport.name}, the world ladder</span></div>
              {tournFor(F.sport.name).map(([lvl,ev,part,win],i)=>(
                <div key={i} className="trn-row">
                  <div className="trn-l"><b>{lvl}</b><i>{ev}</i></div>
                  <div className="trn-m">
                    <span className="trn-p">Show up: {part}</span>
                    <span className="trn-w">Win: {win}</span>
                  </div>
                </div>))}
              <div className="fun-note">this ladder is what feeds the Prize stream · purses are illustrative seeds from public structures — they change every season, verify before relying</div>
            </div>

            {/* Olympic medal bonuses by region */}
            <div className="tournbox">
              <div className="chart-h"><span><Medal size={12}/> Olympic medal bonuses — what nations pay</span></div>
              {Object.entries(COUNTRIES).map(([cn,cc])=>(
                <div key={cn} className={"cut-row"+(cn===country?" cur":"")}>
                  <b>{cn}</b><span>{cc.medal}</span>
                </div>))}
              <div className="fun-note">the IOC pays no prize money — national committees do · figures are reported/illustrative and change by Games</div>
            </div>

            <div className="outs">
              {outcomeOrder.map(k=>{
                const b=F.m.branches.find(x=>x.key===k);
                return(<div key={k} className="out" style={{borderColor:b.color+"55"}}>
                  <div className="out-top">
                    <span className="out-l" style={{color:b.color}}>{b.icon} {b.label}</span>
                    <span className="out-p">{(b.p*100).toFixed(b.p<0.001?2:1)}%</span>
                  </div>
                  <div className="out-v" style={{color:b.npv>=0?b.color:"#f0604b"}}>{usd(b.npv)}</div>
                  <div className="out-note">{b.note}</div>
                </div>);})}
            </div>

            <div className="cutbox">
              <div className="chart-h"><span><Activity size={12}/> The cut-off rules — {C.name} model</span></div>
              {cutoffs.map(([age,rule],i)=>(<div key={i} className="cut-row"><b>{age}</b><span>{rule}</span></div>))}
            </div>
          </>)}

          <div className="human">
            <span>Beyond money <b>{beyond}/100</b></span><span className="hm-sep"/>
            <span>Strain <b className="warn">{strainV}/100</b></span><span className="hm-sep"/>
            <span>Peak ~{F.m.Leff} yrs · global avg retirement ≈ 29–30</span>
          </div>
          <div className="assump">
            seven futures sum to 100% · three streams: prize (level) + salary (league) + fame (following) · safety net re-wired per country · injury priced in · all vs. ordinary study-and-job · sunk costs excluded
          </div>
        </div>
      </div>

      <footer className="meth">
        <div className="meth-h"><GraduationCap size={13}/> How Podium is built</div>
        <p>An athlete's life is modelled as a <b>ladder of conditional gates</b> — regional rank by 14, national or D1 by 18, a playing living by 23, the top 1% beyond — with injury folded into each gate and into the peak window. Every rung earns from <b>three simultaneous income streams</b>: <b>prize money</b> that scales with the level actually reached, so tournament earnings flow while still climbing; a <b>salary or league contract</b> where one exists (set to zero for prize-circuit sports like tennis, golf and boxing); and <b>endorsements</b> driven by a follower count, which pay out even in the non-playing branches. The <b>country filter</b> then re-wires the safety net to the model that actually operates where you are — the NCAA scholarship in North America, the club academy and subsidised degree in Western Europe, the fully-funded state system in Eastern Europe and the Gulf, the corporate-sponsor job in Asia-Pacific, or the export path in South America and Africa — and scales the youth costs, the ordinary-path salary, and the Olympic medal bonuses to match. Seven terminal futures are enumerated exactly so their probabilities sum to 100%, and the headline is the probability-weighted <b>expected</b> value with a real IRR and break-even age against the same honest baseline as every CatalystBox calculator: the ordinary study-and-job path. Costs already spent are excluded — every answer is the decision from today.</p>
        <p className="disc">Every figure — costs, purses, salaries, endorsement rates, follower counts, gate odds, safety-net probabilities, medal bonuses, pensions and peak windows — is an illustrative, editable seed drawn from the global athlete-roadmap dossier and public tournament structures, not a forecast, a scouting report, or a promise about any athlete. Real odds and earnings vary enormously with talent, geography, immigration status, timing and luck; purse, scholarship and visa rules change constantly. This is a thinking tool for families and athletes, not selection or financial advice. If a number disagrees with your reality, change the number.</p>
        <div className="sign"><span className="dot"/> No agenda in the output. All agency in the decision.</div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
.tm-wrap{--ink:#0a0d14;--ink-3:#11161f;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;}
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
.hero{background:var(--ink);border-radius:18px;padding:18px 20px;margin:12px 0;box-shadow:0 20px 44px -26px rgba(10,13,20,.7)}
.hero.cc{background:linear-gradient(135deg,#0d1710,#0a0d14)}
.hero-top{margin-bottom:12px}
.hero-l{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#7e8896}
.ccwrap{display:flex;flex-wrap:wrap;gap:7px}
.ccbtn{font-family:'Syne';font-weight:700;font-size:12px;padding:7px 13px;border-radius:999px;border:1px solid #2a313d;background:#10151d;color:#8a94a0;cursor:pointer;transition:.15s}
.ccbtn:hover{border-color:#4a525e;color:#bbc3cc}
.ccbtn.on{background:var(--teal-line);border-color:var(--teal-line);color:#0a0d14}
.cc-note{font-size:11.5px;color:#9aa3ad;margin-top:11px;line-height:1.5;font-style:italic}
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
.browser{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:14px 16px;margin:16px 0;max-height:260px;overflow-y:auto}
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
.netbanner{font-size:11.5px;color:var(--tx-soft);background:var(--amber-tint);border-radius:9px;padding:9px 11px;margin-top:11px;line-height:1.5}
.netread{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:9px;padding:9px 11px;margin-top:11px;flex-wrap:wrap}
.nr-l{font-size:11px;font-weight:600;color:var(--tx-soft)}
.nr-v{font-family:'DM Mono';font-size:12px;color:var(--clay)}
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
.fun-note{font-size:9.5px;color:#6b7682;margin-top:6px;text-align:right;font-family:'DM Mono';line-height:1.5}
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
.cut-row{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid #1a212b;font-size:11.5px}
.cut-row:last-child{border-bottom:0}
.cut-row b{font-family:'DM Mono';color:#f0a04b;font-weight:500;font-size:11px}
.cut-row span{color:#9aa3ad;line-height:1.5}
.cut-row.cur{background:rgba(52,199,154,.05);border-radius:8px;padding-left:6px;padding-right:6px}
.cut-row.cur b{color:var(--teal-line)}
.trn-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #1a212b;flex-wrap:wrap}
.trn-row:last-of-type{border-bottom:0}
.trn-l{flex:1;min-width:180px}
.trn-l b{font-family:'Syne';font-weight:700;font-size:12px;color:#f0a04b;display:block}
.trn-l i{font-style:normal;font-size:10.5px;color:#6b7682;line-height:1.4}
.trn-m{display:flex;flex-direction:column;gap:2px;text-align:right;flex:none;max-width:52%}
.trn-p{font-family:'DM Mono';font-size:10.5px;color:#7eb8f7;line-height:1.4}
.trn-w{font-family:'DM Mono';font-size:10.5px;color:var(--teal-line);line-height:1.4}
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

/* ThinkMap unified readability: scoped to resist the site's generic theme overrides. */
.hero,.result{background:#17324d!important;color:#f8fafc!important}
.result{border:1px solid #41627f!important}
.result .tile,.result .h2h,.result .leverage,.result .langbox,.result .card,
.result .lev,.result .sortb,.result .lang,.result .scen-tile,.result .edub,
.result .human,.result .funnelbox,.result .stackbox,.result .out,.result .cutbox,
.result .tournbox,.result .vt,.result .chart,.result .assump,.result .exp-tile{
  background:#27445f!important;border-color:#41627f!important;color:#f2f7fb!important
}
.tm-wrap .result .verdict p,
.tm-wrap .result .t-l,.tm-wrap .result .t-s,
.tm-wrap .result .chart-h span,.tm-wrap .result .legend span,
.tm-wrap .result .h2h-top b,.tm-wrap .result .h2h-top b i,
.tm-wrap .result .st-sub,.tm-wrap .result .st-meta,
.tm-wrap .result .exp-l,.tm-wrap .result .exp-s,
.tm-wrap .result .fun-lab,.tm-wrap .result .fun-note,
.tm-wrap .result .stack-key span,.tm-wrap .result .out-p,.tm-wrap .result .out-note,
.tm-wrap .result .cut-row span,.tm-wrap .result .trn-l i,
.tm-wrap .result .human,.tm-wrap .result .assump,
.tm-wrap .result .fld-l,.tm-wrap .result .fld-h,.tm-wrap .result .mini,
.tm-wrap .result .nr-l,.tm-wrap .result .oneIn{
  color:#dce8f3!important
}
.tm-wrap .result .v-tag,.tm-wrap .result .t-v,.tm-wrap .result .chart-h b{
  color:#fff!important
}
.result .bar,.result .fun-track,.result .stack,.result .h2h-track{background:#36546f!important}
.tm-wrap .result input[type="number"],.tm-wrap .result input[type="text"]{
  background:#f8fbff!important;border:1px solid #bfd4e6!important;color:#17324d!important
}

/* Search controls use the same integrated blue treatment across every calculator. */
.tm-wrap .search{
  background:#27445f!important;border:1px solid #5b7891!important;color:#dce8f3!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05)
}
.tm-wrap .search input,.tm-wrap .search input:focus{
  background:transparent!important;border:0!important;color:#f8fafc!important;box-shadow:none!important
}
.tm-wrap .search input::placeholder{color:#c1d2df!important;opacity:1}
.tm-wrap .search svg{color:#dce8f3!important}

/* All methodology sections follow the Exam Compass vertical reading order. */
.meth{
  margin-top:24px!important;background:#f8fbff!important;border:1px solid #bfd4e6!important;
  border-radius:16px!important;box-shadow:0 14px 34px rgba(23,50,77,.08)!important;
  color:#334e68!important;padding:26px 28px!important;display:flex!important;
  flex-direction:column!important;align-items:stretch!important;gap:0!important
}
.meth-h,.meth>p,.meth>.sign{
  width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;text-align:left!important
}
.meth-h{color:#17324d!important;font-size:16px!important;margin:0 0 14px!important;padding:0!important}
.tm-wrap .meth>p{color:#334e68!important;font-size:13.5px!important;line-height:1.75!important}
.tm-wrap .meth>p b{color:#0b5c45!important}
.tm-wrap .meth>p em{color:#36546f!important}
.meth>p:not(.disc){margin-top:0!important;margin-bottom:14px!important}
.meth>.disc{
  color:#536b80!important;background:#eaf2f8!important;border-left:3px solid #4a7fb5!important;
  border-radius:8px!important;padding:12px 14px!important;margin:0 0 12px!important;font-size:11.5px!important
}
.meth>.sign{
  color:#334e68!important;border-top:1px solid #bfd4e6!important;padding-top:12px!important;
  margin-top:0!important;margin-bottom:0!important
}

/* Podium stage and country controls stay readable against the blue hero. */
.tm-wrap .hero .hero-l,.tm-wrap .hero .hero-note,.tm-wrap .hero .cc-note{color:#e5eef6!important}
.tm-wrap .hero .stg,.tm-wrap .hero .ccbtn{
  background:#f8fbff!important;border:1px solid #bfd4e6!important;color:#17324d!important;
  box-shadow:0 3px 10px rgba(10,40,64,.12)!important
}
.tm-wrap .hero .stg b{color:#17324d!important}
.tm-wrap .hero .stg i{color:#536b80!important}
.tm-wrap .hero .stg:hover,.tm-wrap .hero .ccbtn:hover{border-color:#64a68e!important;color:#0b5c45!important}
.tm-wrap .hero .stg.on,.tm-wrap .hero .ccbtn.on{
  background:#0b5c45!important;border-color:#34c79a!important;color:#fff!important
}
.tm-wrap .hero .stg.on b,.tm-wrap .hero .stg.on i{color:#fff!important}
.tm-wrap .hero .agein{
  background:#f8fbff!important;border:1px solid #bfd4e6!important;color:#17324d!important
}

@media(min-width:1000px){
  .layout{align-items:start;min-height:0}
  .layout>.controls,.layout>.result{
    position:sticky;top:88px;height:calc(100dvh - 112px);min-height:480px;max-height:none;
    overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-y:auto;
    scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:rgba(52,199,154,.55) transparent
  }
  .layout>.controls::-webkit-scrollbar,.layout>.result::-webkit-scrollbar{width:5px}
  .layout>.controls::-webkit-scrollbar-thumb,.layout>.result::-webkit-scrollbar-thumb{
    background:rgba(52,199,154,.45);border-radius:999px
  }
}
`;
