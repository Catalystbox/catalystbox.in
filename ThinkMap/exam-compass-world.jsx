import React, { useState, useMemo } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronUp, GraduationCap, Target,
  ShieldCheck, Gauge, Sparkles, TrendingUp, AlertTriangle, Layers, Zap, Trophy,
  Compass, Lightbulb, BookOpen,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   EXAM CALCULATOR · WORLD — data head
   Same engine as the India edition; a global exam roster instead.
   Rate the subjects you're strong in; see which international exams
   your strengths fit — and what each one really takes to clear.
   ═══════════════════════════════════════════════════════════════════ */

export const EDITION="World";
export const EDITION_SUB="Global Edition";
export const HERO_LEDE_A="Around the world the same handful of exams get all the attention. The sharper question is the reverse: ";
export const HERO_LEDE_B="given the subjects you're actually strong in, which global exams are you best positioned to clear?";
export const HERO_LEDE_C=" Rate your strengths, and this ranks the major international admissions, licensure and certification exams by how well they fit you — then tells you what each one truly demands, because two exams needing the same subjects can be completely different fights.";

export const GROUPS=[
  {key:"school",label:"Core subjects"},
  {key:"aptitude",label:"Aptitude & reasoning"},
  {key:"special",label:"Specialised strengths"},
];
export const SKILLS=[
  {key:"math",  g:"school",  label:"Advanced Mathematics", hint:"Calculus, algebra, quantitative depth"},
  {key:"phys",  g:"school",  label:"Physics"},
  {key:"chem",  g:"school",  label:"Chemistry"},
  {key:"bio",   g:"school",  label:"Biology"},
  {key:"eng",   g:"school",  label:"English & Verbal Ability"},
  {key:"soc",   g:"school",  label:"Social Science & Humanities"},
  {key:"reason",g:"aptitude",label:"Logical & Analytical Reasoning"},
  {key:"quant", g:"aptitude",label:"Quantitative Aptitude", hint:"Applied problem-solving, arithmetic"},
  {key:"di",    g:"aptitude",label:"Data Interpretation"},
  {key:"gk",    g:"aptitude",label:"General Awareness"},
  {key:"essay", g:"aptitude",label:"Essay & Analytical Writing"},
  {key:"decide",g:"aptitude",label:"Decision Making & Judgement"},
  {key:"legal", g:"special", label:"Legal & Argument Analysis"},
  {key:"design",g:"special", label:"Drawing, Design & Perceptual Ability"},
  {key:"code",  g:"special", label:"Programming & Computer Science"},
  {key:"econ",  g:"special", label:"Economics & Finance"},
  {key:"acct",  g:"special", label:"Accounting & Auditing"},
  {key:"tech",  g:"special", label:"Engineering / Technical Core"},
  {key:"clin",  g:"special", label:"Clinical / Biomedical Knowledge"},
];

export const NATURE={
  elimination:{label:"Elimination Bottleneck",color:"#e0563f",tint:"rgba(224,86,63,.12)",
    short:"Ranked against a vast field; only the top sliver get in.",
    detail:"Norm-referenced and tuned to the extreme top. You are not proving competence — you are out-ranking a huge field for very few places. Zero-sum, and the reason coaching industries exist. A high subject-fit gets you into the fight, not through it."},
  competency:{label:"Competency Gate",color:"#0B5C45",tint:"rgba(11,92,69,.12)",
    short:"Clear the fixed bar and you're through — no one's rank matters.",
    detail:"Criterion-referenced pass/fail. There is a set standard; everyone who meets it can pass, so it is non-zero-sum and rewards steady mastery. Here a strong subject-fit genuinely predicts clearing it — most global professional licences work this way."},
  aptitude:{label:"Aptitude Gauge",color:"#4a7fb5",tint:"rgba(74,127,181,.12)",
    short:"Measures broad ability; retakeable, score-based, moderate difficulty.",
    detail:"Prognostic and broad-range — it estimates general reasoning across a wide band rather than one deep syllabus. Usually retakeable, with scaled or percentile scores read holistically by admissions. Fit maps fairly well to outcome."},
  talent:{label:"Talent Search",color:"#8a6dc0",tint:"rgba(138,109,192,.12)",
    short:"Hunts the rare few with exceptional, creative aptitude.",
    detail:"Diagnostic and top-fraction — built around unorthodox, very hard problems or a tiny elite intake to find exceptional potential rather than test a fair curriculum. Subject-fit is necessary; originality under pressure is the real filter."},
};

export const FIELDS=[
  {k:"admissions",label:"University Admissions"},
  {k:"medical",label:"Medical"},
  {k:"finance",label:"Finance"},
  {k:"tech-cyber",label:"Tech & Cybersecurity"},
  {k:"engineering",label:"Engineering"},
  {k:"licensure",label:"Professional Licensure"},
  {k:"law",label:"Law"},
  {k:"research",label:"Research & Fellowship"},
  {k:"language",label:"Language Proficiency"},
];
export const LEVELS=[
  {k:"ug",label:"Undergraduate Entry"},
  {k:"pg",label:"Graduate Entry"},
  {k:"licensure",label:"Professional Licensure"},
  {k:"cert",label:"Certification"},
  {k:"fellowship",label:"Fellowship"},
];

export const PRESETS={
  "STEM":{math:8,phys:8,chem:6,bio:3,eng:6,soc:3,reason:8,quant:7,di:6,gk:4,essay:5,decide:5,legal:3,design:3,code:7,econ:3,acct:2,tech:7,clin:2},
  "Pre-Med · Bio":{math:5,phys:6,chem:8,bio:9,eng:6,soc:4,reason:6,quant:5,di:4,gk:4,essay:5,decide:4,legal:2,design:3,code:2,econ:2,acct:2,tech:2,clin:6},
  "Business & Finance":{math:6,phys:2,chem:2,bio:2,eng:6,soc:4,reason:7,quant:8,di:7,gk:5,essay:6,decide:7,legal:4,design:2,code:3,econ:8,acct:8,tech:2,clin:1},
  "Humanities & Law":{math:3,phys:2,chem:2,bio:2,eng:8,soc:8,reason:8,quant:4,di:4,gk:7,essay:8,decide:6,legal:8,design:3,code:2,econ:5,acct:3,tech:1,clin:1},
  "Tech & Cyber":{math:7,phys:5,chem:2,bio:2,eng:6,soc:3,reason:8,quant:7,di:6,gk:4,essay:4,decide:6,legal:3,design:3,code:9,econ:3,acct:3,tech:7,clin:1},
  "Balanced":{math:5,phys:5,chem:5,bio:5,eng:5,soc:5,reason:5,quant:5,di:5,gk:5,essay:5,decide:5,legal:5,design:5,code:5,econ:5,acct:5,tech:5,clin:5},
};

export const EXAMS=[
  /* UNIVERSITY ADMISSIONS — US */
  {n:"SAT",full:"Scholastic Assessment Test",field:"admissions",level:"ug",nat:"aptitude",eff:"medium",
   req:{eng:.5,math:.5},core:[],to:"Undergraduate admission across US universities.",
   note:"Digital-adaptive, broad-range and highly retakeable — a classic aptitude gauge, not a syllabus test."},
  {n:"ACT",full:"American College Testing",field:"admissions",level:"ug",nat:"aptitude",eff:"medium",
   req:{eng:.3,math:.3,reason:.2,bio:.2},core:[],to:"Undergraduate admission across US universities.",
   note:"Includes a science-reasoning section — rewards data reading as much as content."},
  {n:"PSAT / NMSQT",full:"Preliminary SAT / National Merit Qualifying Test",field:"admissions",level:"ug",nat:"talent",eff:"medium",
   req:{eng:.5,math:.5},core:[],to:"National Merit Scholarship qualification.",
   note:"Same content as the SAT, but the scholarship cut-off selects the top fraction of a whole cohort."},
  {n:"GRE General",full:"Graduate Record Examinations",field:"admissions",level:"pg",nat:"aptitude",eff:"medium",
   req:{eng:.4,math:.35,essay:.25},core:[],to:"Graduate-school admission worldwide."},
  {n:"GMAT",full:"Graduate Management Admission Test",field:"admissions",level:"pg",nat:"aptitude",eff:"high",
   req:{quant:.35,eng:.3,di:.35},core:[],to:"MBA & business master's admission.",
   note:"The Data Insights section now carries a full third of the score."},
  {n:"AP Exams",full:"Advanced Placement Examinations",field:"admissions",level:"ug",nat:"competency",eff:"medium",mode:"any",
   req:{math:.3,phys:.25,chem:.25,bio:.25,soc:.25,eng:.25},core:[],to:"College credit & advanced standing.",
   note:"Criterion-scored 1–5 in your chosen subject; your single strongest subject drives the fit."},
  {n:"CUET-equivalent / IB",full:"International Baccalaureate Diploma",field:"admissions",level:"ug",nat:"competency",eff:"high",mode:"any",
   req:{eng:.25,math:.2,soc:.2,phys:.15,chem:.1,bio:.1},core:[],to:"A globally recognised school-leaving diploma.",
   note:"Broad and criterion-based; strength across a range helps, but your best subjects anchor it."},

  /* LAW ADMISSIONS */
  {n:"LSAT",full:"Law School Admission Test",field:"law",level:"pg",nat:"aptitude",eff:"high",
   req:{reason:.5,legal:.2,eng:.3},core:[],to:"Law-school admission in the US & Canada.",
   note:"Almost pure logical & analytical reasoning — very little content knowledge."},
  {n:"LNAT",full:"Law National Aptitude Test",field:"law",level:"ug",nat:"talent",eff:"high",
   req:{reason:.4,eng:.35,essay:.25},core:[],to:"Undergraduate law at top UK universities.",
   note:"An aptitude filter for a tiny elite intake — argument and essay under pressure."},

  /* MEDICAL ADMISSIONS & LICENSURE */
  {n:"MCAT",full:"Medical College Admission Test",field:"medical",level:"pg",nat:"elimination",eff:"extreme",
   req:{bio:.3,chem:.25,phys:.15,eng:.15,soc:.15},core:["bio","chem"],to:"Medical-school admission in the US & Canada.",
   note:"Long, broad and brutally competitive — a genuine bottleneck for scarce medical seats."},
  {n:"UCAT",full:"University Clinical Aptitude Test",field:"medical",level:"ug",nat:"aptitude",eff:"high",
   req:{reason:.3,quant:.25,di:.2,decide:.25},core:[],to:"Undergraduate medicine in the UK & Australia.",
   note:"Situational judgement & speed, not science content."},
  {n:"DAT",full:"Dental Admission Test",field:"medical",level:"pg",nat:"elimination",eff:"high",
   req:{bio:.3,chem:.3,design:.2,quant:.2},core:["bio","chem"],to:"Dental-school admission in the US.",
   note:"Uniquely includes a Perceptual Ability (spatial/visual) section."},
  {n:"OAT",full:"Optometry Admission Test",field:"medical",level:"pg",nat:"elimination",eff:"high",
   req:{bio:.25,chem:.25,phys:.25,quant:.25},core:["bio"],to:"Optometry-school admission in the US."},
  {n:"USMLE",full:"United States Medical Licensing Examination",field:"medical",level:"licensure",nat:"competency",eff:"extreme",
   req:{clin:.75,bio:.25},core:["clin"],to:"The licence to practise medicine in the US.",
   note:"A criterion-referenced three-step gate — you clear a standard, you are not ranked for seats."},
  {n:"PLAB",full:"Professional & Linguistic Assessments Board",field:"medical",level:"licensure",nat:"competency",eff:"high",
   req:{clin:.8,eng:.2},core:["clin"],to:"Medical practice in the UK for international graduates."},
  {n:"NCLEX",full:"National Council Licensure Examination",field:"medical",level:"licensure",nat:"competency",eff:"high",
   req:{clin:.9,reason:.1},core:["clin"],to:"The licence to practise as a nurse in the US & Canada.",
   note:"Adaptive pass/fail — it stops once your ability is established against the standard."},

  /* FINANCE CERTIFICATIONS */
  {n:"CFA",full:"Chartered Financial Analyst",field:"finance",level:"cert",nat:"competency",eff:"extreme",
   req:{econ:.3,quant:.3,acct:.2,legal:.2},core:["econ"],to:"Investment analysis & portfolio management.",
   note:"Three sequential exams against a fixed standard — low pass rates, but not rank-based."},
  {n:"CPA (US)",full:"Certified Public Accountant",field:"finance",level:"licensure",nat:"competency",eff:"high",
   req:{acct:.5,legal:.25,econ:.25},core:["acct"],to:"Public accountancy licence in the US."},
  {n:"ACCA",full:"Association of Chartered Certified Accountants",field:"finance",level:"cert",nat:"competency",eff:"high",
   req:{acct:.4,legal:.2,econ:.2,quant:.2},core:["acct"],to:"A globally portable accountancy qualification."},
  {n:"FRM",full:"Financial Risk Manager",field:"finance",level:"cert",nat:"competency",eff:"high",
   req:{quant:.4,econ:.3,acct:.3},core:["quant"],to:"Risk-management roles in banking & funds.",
   note:"Quant- and statistics-heavy — a mathematician's finance credential."},
  {n:"CFP",full:"Certified Financial Planner",field:"finance",level:"cert",nat:"competency",eff:"medium",
   req:{econ:.4,acct:.3,legal:.3},core:[],to:"Personal financial-planning practice."},
  {n:"CMA (US)",full:"Certified Management Accountant",field:"finance",level:"cert",nat:"competency",eff:"high",
   req:{acct:.4,econ:.3,quant:.3},core:["acct"],to:"Management-accounting & corporate finance."},
  {n:"CAIA",full:"Chartered Alternative Investment Analyst",field:"finance",level:"cert",nat:"competency",eff:"high",
   req:{econ:.35,quant:.35,acct:.3},core:["econ"],to:"Alternative investments — hedge funds, private equity, real assets."},

  /* TECH & CYBERSECURITY */
  {n:"CISSP",full:"Certified Information Systems Security Professional",field:"tech-cyber",level:"cert",nat:"competency",eff:"high",
   req:{code:.45,reason:.3,tech:.25},core:[],to:"Senior information-security roles.",
   note:"Broad security-domain mastery against a defined body of knowledge."},
  {n:"CCIE",full:"Cisco Certified Internetwork Expert",field:"tech-cyber",level:"cert",nat:"competency",eff:"extreme",
   req:{tech:.5,code:.3,reason:.2},core:["tech"],to:"Expert-level network engineering.",
   note:"A famously demanding hands-on lab — competency proven by building, not ranking."},
  {n:"CISM",full:"Certified Information Security Manager",field:"tech-cyber",level:"cert",nat:"competency",eff:"medium",
   req:{reason:.35,code:.3,decide:.2,legal:.15},core:[],to:"Information-security management & governance."},
  {n:"CISA",full:"Certified Information Systems Auditor",field:"tech-cyber",level:"cert",nat:"competency",eff:"medium",
   req:{acct:.3,code:.3,legal:.2,reason:.2},core:[],to:"IT audit, control & assurance."},
  {n:"CompTIA Security+",full:"CompTIA Security+",field:"tech-cyber",level:"cert",nat:"competency",eff:"low",
   req:{code:.5,reason:.3,tech:.2},core:[],to:"An entry credential into cybersecurity roles."},
  {n:"PMP",full:"Project Management Professional",field:"licensure",level:"cert",nat:"competency",eff:"medium",
   req:{decide:.4,essay:.2,econ:.2,reason:.2},core:[],to:"Project-management leadership across industries."},

  /* ENGINEERING LICENSURE */
  {n:"FE Exam",full:"Fundamentals of Engineering",field:"engineering",level:"licensure",nat:"competency",eff:"high",
   req:{tech:.5,math:.2,phys:.15,chem:.15},core:["tech"],to:"The first step to becoming a licensed engineer (EIT).",
   note:"Criterion-based — pass the standard and you progress; no curve, no ranking."},
  {n:"PE Exam",full:"Principles & Practice of Engineering",field:"engineering",level:"licensure",nat:"competency",eff:"high",
   req:{tech:.8,math:.2},core:["tech"],to:"The Professional Engineer licence."},
  {n:"ARE 5.0",full:"Architect Registration Examination",field:"engineering",level:"licensure",nat:"competency",eff:"high",
   req:{design:.4,tech:.3,decide:.3},core:["design"],to:"The licence to practise architecture in the US."},

  /* RESEARCH & FELLOWSHIP */
  {n:"GRE Subject",full:"GRE Subject Tests",field:"research",level:"pg",nat:"talent",eff:"high",mode:"any",
   req:{phys:.4,math:.4,chem:.3,bio:.3,code:.3},core:[],to:"Specialised PhD admission in your discipline.",
   note:"Deep single-subject mastery; your strongest science or maths anchors the fit."},
  {n:"All Souls Prize",full:"All Souls College Examination Fellowship",field:"research",level:"fellowship",nat:"talent",eff:"extreme",
   req:{essay:.6,soc:.2,eng:.2},core:[],to:"Oxford's famously hard fellowship by examination.",
   note:"A handful of places worldwide each year — original thought under exam conditions."},
  {n:"Rhodes / Marshall",full:"Rhodes & Marshall Scholarship Selection",field:"research",level:"fellowship",nat:"talent",eff:"high",
   req:{essay:.35,soc:.25,eng:.2,gk:.2},core:[],to:"Fully-funded graduate study at Oxford & UK universities.",
   note:"Holistic elite selection — academic record plus leadership and character."},

  /* PROFESSIONAL / NICHE */
  {n:"Bar Exam (US)",full:"Uniform Bar Examination",field:"law",level:"licensure",nat:"competency",eff:"extreme",
   req:{legal:.7,essay:.2,reason:.1},core:["legal"],to:"The licence to practise law in the US.",
   note:"Clear the state's score line and you are admitted — a competency gate, not a ranking."},
  {n:"SQE",full:"Solicitors Qualifying Examination",field:"law",level:"licensure",nat:"competency",eff:"high",
   req:{legal:.75,reason:.15,essay:.1},core:["legal"],to:"Qualification as a solicitor in England & Wales."},
  {n:"Actuarial (SOA/IFoA)",full:"Society of Actuaries / IFoA Examinations",field:"finance",level:"cert",nat:"competency",eff:"extreme",
   req:{math:.4,quant:.3,econ:.15,di:.15},core:["math"],to:"The actuarial profession — insurance, pensions, risk.",
   note:"A long ladder of exams; probability & statistics are the spine."},
  {n:"Master Sommelier",full:"Court of Master Sommeliers Diploma",field:"licensure",level:"cert",nat:"talent",eff:"extreme",
   req:{gk:.5,decide:.3,soc:.2},core:[],to:"One of the world's rarest professional titles.",
   note:"A famously low pass rate and tiny cohort — blind-tasting mastery plus vast knowledge."},

  /* ENGLISH-LANGUAGE PROFICIENCY (fit-scored via English) */
  {n:"IELTS",full:"International English Language Testing System",field:"language",level:"cert",nat:"aptitude",eff:"low",
   req:{eng:.9,essay:.1},core:["eng"],to:"Study, work & migration to English-speaking countries.",
   note:"Band-scored against a fixed scale; if English is your strength, it is very clearable."},
  {n:"TOEFL iBT",full:"Test of English as a Foreign Language",field:"language",level:"cert",nat:"aptitude",eff:"low",
   req:{eng:.9,essay:.1},core:["eng"],to:"Admission to English-medium universities, chiefly the US."},
  {n:"PTE Academic",full:"Pearson Test of English Academic",field:"language",level:"cert",nat:"aptitude",eff:"low",
   req:{eng:.9,essay:.1},core:["eng"],to:"Study & migration — computer-scored, fast results."},
  {n:"Duolingo English Test",full:"Duolingo English Test",field:"language",level:"cert",nat:"aptitude",eff:"low",
   req:{eng:.95,essay:.05},core:["eng"],to:"An affordable, at-home English test accepted widely."},
  {n:"Cambridge C1/C2",full:"Cambridge English Advanced / Proficiency",field:"language",level:"cert",nat:"competency",eff:"medium",
   req:{eng:.9,essay:.1},core:["eng"],to:"A lifelong certificate of high-level English."},
];

/* foreign-language exams — outside the fit engine (they test a specific language) */
export const LANG_REF=[
  {n:"JLPT",lang:"Japanese",body:"Japan Foundation",use:"Study, work & residence in Japan"},
  {n:"HSK",lang:"Mandarin Chinese",body:"Chinese Testing International",use:"Study & employment in China"},
  {n:"TOPIK",lang:"Korean",body:"NIIED, South Korea",use:"Study, residence & work in Korea"},
  {n:"DELF / DALF",lang:"French",body:"France Éducation international",use:"Study & professional life in Francophone regions"},
  {n:"DELE",lang:"Spanish",body:"Instituto Cervantes",use:"Higher education & professional practice in Spanish"},
  {n:"Goethe-Zertifikat",lang:"German",body:"Goethe-Institut",use:"Work, immigration & study in Germany"},
  {n:"TestDaF",lang:"German",body:"TestDaF-Institut",use:"Entry to German-taught university degrees"},
  {n:"CILS / CELI",lang:"Italian",body:"Universities of Siena / Perugia",use:"Study & residency in Italy"},
];/* ═══════════════════════════════════════════════════════════════════
   EXAM CALCULATOR — shared engine + UI (generic across editions)
   Reads the data head above: SKILLS, GROUPS, NATURE, FIELDS, LEVELS,
   EXAMS, PRESETS, LANG_REF, EDITION, and the hero copy.
   ═══════════════════════════════════════════════════════════════════ */

const GATE_FLOOR=3;     /* a core subject at/below this blocks the exam  */
const STRONG_FIT=0.60;  /* threshold for a "strong match"               */
const SEL={elimination:0.22,talent:0.15,aptitude:0.82,competency:0.90};
const FIELD_COLOR={
  engineering:"#4a7fb5",medical:"#e0563f","civil-services":"#c2691f",
  "ssc-railways":"#c67f3a","banking-finance":"#0B5C45",law:"#8a6dc0",management:"#2f9e8f",
  design:"#d4568f",  "research-teaching":"#5a7fd0",defense:"#6b7280",
  licensure:"#b08a2e", admission:"#3f9d90", admissions:"#4a7fb5", finance:"#0B5C45",
  "tech-cyber":"#2f9e8f", research:"#5a7fd0", language:"#8a6dc0",
};
const SK=Object.fromEntries(SKILLS.map(s=>[s.key,s]));
const FLAB=Object.fromEntries(FIELDS.map(f=>[f.k,f.label]));
const LLAB=Object.fromEntries(LEVELS.map(l=>[l.k,l.label]));

/* ── fit engine ───────────────────────────────────────────────────── */
function scoreExam(ex,str){
  const keys=Object.keys(ex.req);
  if(ex.mode==="any"){
    const arr=keys.map(sk=>({sk,w:ex.req[sk],s:str[sk]??0})).sort((a,b)=>b.s-a.s);
    const fit=Math.max(0,Math.min(1,(arr.length?(arr[0].s*0.8+(arr[1]?arr[1].s:0)*0.2):0)/10));
    const parts=arr.map(p=>({...p,c:p.s}));
    return{fit,parts,blocked:false,weak:[],match:fit,winnable:fit*SEL[ex.nat],any:true};
  }
  let wsum=0,got=0;const parts=[];
  keys.forEach(sk=>{const w=ex.req[sk],s=str[sk]??0;wsum+=w;got+=w*s;parts.push({sk,w,s,c:w*s});});
  const fit=Math.max(0,Math.min(1,wsum>0?got/(wsum*10):0));
  const weak=(ex.core||[]).filter(sk=>(str[sk]??0)<=GATE_FLOOR);
  const blocked=weak.length>0;
  parts.sort((a,b)=>b.c-a.c);
  return{fit,parts,blocked,weak,match:fit*(blocked?0.45:1),winnable:fit*SEL[ex.nat]*(blocked?0.45:1)};
}
function unlockFor(ex,str){
  const base=scoreExam(ex,str);
  let best=null;
  Object.keys(ex.req).forEach(sk=>{
    const cur=str[sk]??0; if(cur>=7)return;
    const to=Math.min(10,cur+3),trial={...str,[sk]:to};
    const f=scoreExam(ex,trial).fit,gain=f-base.fit;
    const unblocks=(ex.core||[]).includes(sk)&&cur<=GATE_FLOOR;
    const better=!best||(unblocks&&!best.unblocks)||((unblocks===best.unblocks)&&gain>best.gain);
    if(better&&(gain>0.02||unblocks))best={sk,from:cur,to,gain,unblocks};
  });
  return best;
}

/* ── UI atoms ─────────────────────────────────────────────────────── */
function Slider({label,hint,val,onChange}){
  const pc=(val/10)*100;
  const tag=val>=8?"strong":val>=6?"solid":val>=4?"okay":val>=1?"weak":"none";
  return(<label className="sk">
    <span className="sk-top">
      <span className="sk-l">{label}{hint&&<i className="sk-h">{hint}</i>}</span>
      <span className={"sk-v v-"+tag}>{val}</span>
    </span>
    <input className="range" type="range" min={0} max={10} step={1} value={val}
      onChange={e=>onChange(parseInt(e.target.value))} style={{"--p":pc+"%"}}/>
  </label>);
}
function NatureIcon({nat,size=13}){
  if(nat==="elimination")return <Target size={size}/>;
  if(nat==="competency")return <ShieldCheck size={size}/>;
  if(nat==="aptitude")return <Gauge size={size}/>;
  return <Sparkles size={size}/>;
}
function Bar({pct,color}){return <div className="bar"><i style={{width:Math.max(2,pct)+"%",background:color}}/></div>;}

function fitColor(f){return f>=0.7?"#34c79a":f>=0.45?"#4a7fb5":"#8a94a0";}
function fitWord(f,blocked){
  if(blocked)return"blocked";
  return f>=0.75?"excellent fit":f>=0.6?"strong fit":f>=0.45?"partial fit":f>=0.25?"weak fit":"poor fit";
}

/* ── exam card ────────────────────────────────────────────────────── */
function Card({ex,str,open,onToggle}){
  const s=scoreExam(ex,str);
  const nat=NATURE[ex.nat];
  const fc=fitColor(s.fit);
  const unlock=s.fit<STRONG_FIT||s.blocked?unlockFor(ex,str):null;
  const top=s.parts.slice(0,open?99:3);
  return(<div className={"card"+(s.blocked?" blk":"")}>
    <button className="card-h" onClick={onToggle}>
      <span className="c-dot" style={{background:FIELD_COLOR[ex.field]||"#888"}}/>
      <span className="c-id">
        <b>{ex.n}</b>
        <i>{ex.full}</i>
        <span className="c-chips">
          <span className="c-chip">{FLAB[ex.field]}</span>
          <span className="c-chip alt">{LLAB[ex.level]}</span>
        </span>
      </span>
      <span className="c-fit">
        <span className="c-pct" style={{color:fc}}>{Math.round(s.fit*100)}<i>%</i></span>
        <span className="c-fw">{fitWord(s.fit,s.blocked)}</span>
      </span>
      <span className="c-chev">{open?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span>
    </button>

    <div className="c-natrow" style={{background:nat.tint}}>
      <span className="c-nat" style={{color:nat.color}}><NatureIcon nat={ex.nat}/> {nat.label}</span>
      <span className="c-nat-s">{nat.short}</span>
    </div>

    <div className="c-body">
      {s.blocked&&<div className="c-block"><AlertTriangle size={12}/>
        <span>Gate subject{s.weak.length>1?"s":""} too weak: {s.weak.map(k=>SK[k].label).join(", ")} — you rated {s.weak.map(k=>(str[k]??0)+"/10").join(", ")}. This exam is hard to clear without it.</span></div>}

      <div className="c-subs">
        {top.map(p=>(
          <div className="sub" key={p.sk}>
            <span className="sub-l">{SK[p.sk].label}{ex.core&&ex.core.includes(p.sk)&&<em className="gate">gate</em>}</span>
            <div className="sub-bars">
              <Bar pct={(p.s/10)*100} color={p.s<=GATE_FLOOR&&ex.core&&ex.core.includes(p.sk)?"#e0563f":fc}/>
              {!s.any&&<span className="sub-w" title="weight in this exam">{Math.round(p.w*100)}%</span>}
            </div>
          </div>))}
        {!open&&s.parts.length>3&&<button className="more" onClick={onToggle}>+{s.parts.length-3} more subjects</button>}
      </div>

      <div className="c-to">→ {ex.to}</div>

      {open&&<div className="c-more">
        <div className="c-detail">{nat.detail}</div>
        {ex.note&&<div className="c-note">Note — {ex.note}</div>}
        {s.any&&<div className="c-note">This is a pick-your-subject exam: your single strongest listed subject drives the fit, so specialists aren't penalised for the others.</div>}
        <div className="c-meta">
          <span>Prep intensity: <b>{ex.eff}</b></span>
          <span>Selectivity nature: <b>{ex.nat==="elimination"?"rank-based, few seats":ex.nat==="competency"?"clear the bar":ex.nat==="aptitude"?"broad & retakeable":"top-fraction talent"}</b></span>
        </div>
        {unlock&&<div className="c-unlock"><Lightbulb size={12}/>
          <span>{unlock.unblocks?"Unblock this: ":"Closest gain: "}raise <b>{SK[unlock.sk].label}</b> from {unlock.from} to {unlock.to}
          {unlock.unblocks?" to clear the gate":` — fit rises about ${Math.round(unlock.gain*100)} points`}.</span></div>}
      </div>}
    </div>
  </div>);
}

/* ── main ─────────────────────────────────────────────────────────── */
export default function App(){
  const start=Object.fromEntries(SKILLS.map(s=>[s.key,5]));
  const[str,setStr]=useState(start);
  const[preset,setPreset]=useState(null);
  const[field,setField]=useState("all");
  const[level,setLevel]=useState("all");
  const[nature,setNature]=useState("all");
  const[query,setQuery]=useState("");
  const[sort,setSort]=useState("match");
  const[openGroups,setOpenGroups]=useState({school:true,aptitude:false,special:false});
  const[openCards,setOpenCards]=useState({});
  const[showFilters,setShowFilters]=useState(true);

  const set1=(k,v)=>{setStr(s=>({...s,[k]:v}));setPreset(null);};
  const applyPreset=(name)=>{setStr({...PRESETS[name]});setPreset(name);};

  /* score everything once */
  const scored=useMemo(()=>EXAMS.map(ex=>({ex,s:scoreExam(ex,str)})),[str]);

  /* portfolio analytics */
  const port=useMemo(()=>{
    const strong=scored.filter(x=>x.s.fit>=STRONG_FIT&&!x.s.blocked);
    /* door count per skill across all exams */
    const doors={};SKILLS.forEach(sk=>{doors[sk.key]=EXAMS.filter(e=>(e.req[sk.key]||0)>=0.15).length;});
    /* my leverage: skills I'm strong in (>=6), ranked by doors opened */
    const myStrong=SKILLS.filter(sk=>(str[sk.key]??0)>=6).map(sk=>({...sk,doors:doors[sk.key]}))
      .sort((a,b)=>b.doors-a.doors);
    /* best field among strong matches */
    const fcount={};strong.forEach(x=>{fcount[x.ex.field]=(fcount[x.ex.field]||0)+1;});
    let bestField=null,bmax=0;Object.entries(fcount).forEach(([f,c])=>{if(c>bmax){bmax=c;bestField=f;}});
    /* nature mix among strong */
    const nmix={};strong.forEach(x=>{nmix[x.ex.nat]=(nmix[x.ex.nat]||0)+1;});
    const elimHeavy=(nmix.elimination||0)>=Math.max(1,strong.length*0.5)&&strong.length>=2;
    /* one-subject-away */
    const near=scored.filter(x=>x.s.fit<STRONG_FIT).map(x=>{
      const u=unlockFor(x.ex,str);
      if(!u)return null;
      const nf=scoreExam(x.ex,{...str,[u.sk]:u.to}).fit;
      return nf>=STRONG_FIT?{ex:x.ex,u,nf}:null;
    }).filter(Boolean);
    return{strong,myStrong,bestField,nmix,elimHeavy,near,doors};
  },[scored,str]);

  /* verdict copy */
  const verdict=useMemo(()=>{
    if(port.strong.length===0){
      const n=port.near[0];
      return{tag:"No strong single fit yet — but you're close",
        line:`Your current strengths don't yet clear the bar for a strong match on any exam. ${n?`The nearest is ${n.ex.n}: raise ${SK[n.u.sk].label} from ${n.u.from} to ${n.u.to} and it becomes a strong fit.`:"Try a preset, or nudge up the subjects you're genuinely good at."}`};
    }
    const lev=port.myStrong.slice(0,2).map(s=>s.label);
    const bits=[`Your strengths fit best in ${FLAB[port.bestField]} — ${port.strong.length} strong match${port.strong.length>1?"es":""} across all fields.`];
    if(lev.length)bits.push(`Your biggest door-openers are ${lev.join(" and ")}.`);
    if(port.elimHeavy)bits.push(`Most of your top fits are elimination bottlenecks — brutally rank-based. Look for the competency-gate options that use the same subjects, where clearing a fixed bar is enough.`);
    return{tag:"Here's where your subjects point",line:bits.join(" ")};
  },[port]);

  /* filtered + sorted list */
  const list=useMemo(()=>{
    let l=scored.filter(x=>
      (field==="all"||x.ex.field===field)&&
      (level==="all"||x.ex.level===level)&&
      (nature==="all"||x.ex.nat===nature)&&
      (!query||x.ex.n.toLowerCase().includes(query.toLowerCase())||x.ex.full.toLowerCase().includes(query.toLowerCase()))
    );
    if(sort==="match")l.sort((a,b)=>b.s.match-a.s.match);
    else if(sort==="winnable")l.sort((a,b)=>b.s.winnable-a.s.winnable);
    else l.sort((a,b)=>a.ex.n.localeCompare(b.ex.n));
    return l;
  },[scored,field,level,nature,query,sort]);

  const toggleCard=n=>setOpenCards(o=>({...o,[n]:!o[n]}));

  return(
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot"/> CatalystBox</div>
        <span className="eyebrow">Sibling to the Education, Margin &amp; Podium calculators · {EDITION_SUB}</span>
        <h1>Exam Compass</h1>
        <p className="sub">The Subject-to-Exam Calculator</p>
        <p className="lede">{HERO_LEDE_A}<b>{HERO_LEDE_B}</b>{HERO_LEDE_C}</p>
      </header>

      <div className="layout">
        {/* ══ CONTROLS ══ */}
        <div className="controls">
          <div className="panel">
            <div className="panel-h"><Compass size={15}/> Rate your strengths</div>
            <div className="presets">
              <span className="pre-l">Quick start:</span>
              {Object.keys(PRESETS).map(p=>(
                <button key={p} className={"pre "+(preset===p?"on":"")} onClick={()=>applyPreset(p)}>{p}</button>))}
            </div>
            {GROUPS.map(gr=>{
              const items=SKILLS.filter(s=>s.g===gr.key);
              const opened=openGroups[gr.key];
              const avg=Math.round(items.reduce((t,s)=>t+(str[s.key]??0),0)/items.length);
              return(<div className="grp" key={gr.key}>
                <button className="grp-h" onClick={()=>setOpenGroups(o=>({...o,[gr.key]:!o[gr.key]}))}>
                  <span className="grp-t">{gr.label}</span>
                  <span className="grp-avg">avg {avg}</span>
                  {opened?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                </button>
                {opened&&<div className="grp-b">
                  {items.map(sk=>(
                    <Slider key={sk.key} label={sk.label} hint={sk.hint} val={str[sk.key]??0}
                      onChange={v=>set1(sk.key,v)}/>))}
                </div>}
              </div>);})}
          </div>

          <div className="panel">
            <button className="panel-h btn" onClick={()=>setShowFilters(f=>!f)}>
              <span><SlidersHorizontal size={15}/> Filter the exams</span>
              {showFilters?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
            </button>
            {showFilters&&<div className="filt">
              <div className="filt-l">Field</div>
              <div className="chiprow">
                <button className={"fchip "+(field==="all"?"on":"")} onClick={()=>setField("all")}>All</button>
                {FIELDS.map(f=>(
                  <button key={f.k} className={"fchip "+(field===f.k?"on":"")} onClick={()=>setField(f.k)}>
                    <i className="fdot" style={{background:FIELD_COLOR[f.k]}}/>{f.label}</button>))}
              </div>
              <div className="filt-l">Level</div>
              <div className="chiprow">
                <button className={"fchip "+(level==="all"?"on":"")} onClick={()=>setLevel("all")}>All</button>
                {LEVELS.map(l=>(
                  <button key={l.k} className={"fchip "+(level===l.k?"on":"")} onClick={()=>setLevel(l.k)}>{l.label}</button>))}
              </div>
              <div className="filt-l">Nature</div>
              <div className="chiprow">
                <button className={"fchip "+(nature==="all"?"on":"")} onClick={()=>setNature("all")}>All</button>
                {Object.entries(NATURE).map(([k,v])=>(
                  <button key={k} className={"fchip "+(nature===k?"on":"")} onClick={()=>setNature(k)}
                    style={nature===k?{borderColor:v.color,color:v.color}:{}}>
                    <NatureIcon nat={k} size={11}/>{v.label}</button>))}
              </div>
            </div>}
          </div>
        </div>

        {/* ══ RESULTS ══ */}
        <div className="result">
          <div className="verdict">
            <span className="v-icn"><Target size={15}/></span>
            <div><span className="v-tag">{verdict.tag}</span><p>{verdict.line}</p></div>
          </div>

          <div className="tiles">
            <div className="tile"><span className="t-l"><Trophy size={12}/> Strong matches</span>
              <span className="t-v pos">{port.strong.length}</span><span className="t-s">fit ≥ 60%, not blocked</span></div>
            <div className="tile"><span className="t-l"><Layers size={12}/> Best-fit field</span>
              <span className="t-v sm">{port.bestField?FLAB[port.bestField]:"—"}</span><span className="t-s">where your subjects cluster</span></div>
            <div className="tile"><span className="t-l"><Zap size={12}/> Top door-opener</span>
              <span className="t-v sm">{port.myStrong[0]?port.myStrong[0].label.split(" ")[0]+(port.myStrong[0].label.split(" ")[1]?"…":""):"—"}</span>
              <span className="t-s">{port.myStrong[0]?`opens ${port.myStrong[0].doors} exams`:"rate a subject 6+"}</span></div>
            <div className="tile"><span className="t-l"><Lightbulb size={12}/> One subject away</span>
              <span className="t-v amber">{port.near.length}</span><span className="t-s">unlock with a single boost</span></div>
          </div>

          {port.myStrong.length>0&&<div className="leverage">
            <span className="lev-l">Your leverage subjects — ranked by how many exams they open:</span>
            <div className="lev-row">
              {port.myStrong.slice(0,5).map(s=>(
                <span className="lev" key={s.key}><b>{s.label}</b><i>{s.doors}</i></span>))}
            </div>
          </div>}

          <div className="listhead">
            <span className="lh-count">{list.length} exam{list.length!==1?"s":""}{field!=="all"||level!=="all"||nature!=="all"?" · filtered":""}</span>
            <div className="sortrow">
              <span>Sort:</span>
              <button className={"sortb "+(sort==="match"?"on":"")} onClick={()=>setSort("match")}>Best fit</button>
              <button className={"sortb "+(sort==="winnable"?"on":"")} onClick={()=>setSort("winnable")} title="fit adjusted for how selective the exam really is">Most winnable</button>
              <button className={"sortb "+(sort==="alpha"?"on":"")} onClick={()=>setSort("alpha")}>A–Z</button>
            </div>
          </div>
          <div className="search"><Search size={13}/><input placeholder="Search exams by name…" value={query} onChange={e=>setQuery(e.target.value)}/></div>

          <div className="cards">
            {list.length===0&&<div className="empty">No exams match these filters. Widen the field or level.</div>}
            {list.map(({ex})=>(
              <Card key={ex.n} ex={ex} str={str} open={!!openCards[ex.n]} onToggle={()=>toggleCard(ex.n)}/>))}
          </div>

          {LANG_REF.length>0&&<div className="langbox">
            <div className="lang-h"><BookOpen size={13}/> Language proficiency exams — a different kind of test</div>
            <p className="lang-p">These certify a specific language rather than a transferable subject strength, so they sit outside the fit engine. If the target language is your strength, they're criterion-referenced — reach the required band and you're through.</p>
            <div className="lang-grid">
              {LANG_REF.map(l=>(<div className="lang" key={l.n}>
                <b>{l.n}</b><span className="lang-lg">{l.lang}</span>
                <i>{l.use}</i><span className="lang-bd">{l.body}</span></div>))}
            </div>
          </div>}
        </div>
      </div>

      <footer className="meth">
        <div className="meth-h"><GraduationCap size={13}/> How Exam Compass works</div>
        <p>Every exam is tagged with the <b>subjects it actually tests</b> and how much each one weighs. You rate your strength in each subject from 0 to 10, and the tool computes a <b>fit</b> — how well your strengths cover that exam's syllabus — for all of them at once, then ranks them. Where an exam has a <b>gate subject</b> you can't clear without (Biology for NEET, a core discipline for GATE), a strength below the floor flags the exam as blocked, because coverage elsewhere can't rescue it. Pick-your-subject exams (JAM, the NET papers) are scored on your single strongest relevant subject, so specialists aren't penalised. Alongside fit, each exam carries its <b>psychometric nature</b> — the crucial distinction between an <em>elimination bottleneck</em> that ranks you against millions for a sliver of seats, a <em>competency gate</em> you clear against a fixed bar, a broad <em>aptitude gauge</em>, and a <em>talent search</em> for the exceptional few. Two exams needing identical subjects can be entirely different bets, so "Most winnable" re-sorts fit by how selective each exam truly is. The portfolio read-out shows your highest-leverage subjects, the field your strengths cluster in, and the exams that a single subject's improvement would unlock.</p>
        <p className="disc">The exam roster, subject weightings, gate subjects and psychometric classifications are illustrative, editable seeds drawn from a public exam-structure dossier — not official syllabi, eligibility rulings, or a guarantee of selection. Real exams change their patterns, weightings and eligibility every cycle, and clearing any of them depends on preparation, competition and circumstance far beyond subject aptitude. This is a discovery and thinking tool to help you aim at the exams that suit your strengths — not admissions, career, or eligibility advice. Always confirm the current pattern with the conducting body before you commit.</p>
        <div className="sign"><span className="dot"/> No agenda in the output. All agency in the decision.</div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
:root{--ink:#0a0d14;--ink-3:#11161f;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--blue:#4a7fb5;--blue-tint:#e8eff8;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;}
*{box-sizing:border-box;margin:0;padding:0}
.wrap{background:var(--parch);color:var(--tx);font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5;padding:22px 16px 40px;max-width:1200px;margin:0 auto}
.wrap h1{font-family:'Syne',sans-serif;letter-spacing:-0.02em}
.top{margin-bottom:16px}
.brand{display:inline-flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;letter-spacing:.04em;color:var(--teal);text-transform:uppercase;margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block;box-shadow:0 0 0 3px rgba(232,146,42,.18)}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);display:block}
.top h1{font-size:clamp(40px,8.5vw,70px);font-weight:800;line-height:.95;color:var(--ink);margin:6px 0 2px}
.sub{font-family:'Syne';font-weight:700;font-size:clamp(14px,2.6vw,19px);color:var(--teal);margin-bottom:10px}
.lede{max-width:76ch;color:var(--tx-soft);font-size:15px}
.lede b{font-weight:700;color:var(--ink)}

.layout{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:1000px){.layout{grid-template-columns:.86fr 1.14fr;align-items:start}.controls{position:sticky;top:14px}}
.controls{display:flex;flex-direction:column;gap:12px}
.panel{background:var(--paper);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.panel-h{display:flex;align-items:center;gap:8px;padding:13px 15px;font-family:'Syne';font-weight:700;font-size:14px;color:var(--ink);border-bottom:1px solid var(--line)}
.panel-h.btn{width:100%;background:none;border:0;cursor:pointer;justify-content:space-between;border-bottom:0}
.panel-h.btn span{display:flex;align-items:center;gap:8px}
.presets{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:12px 15px 6px}
.pre-l{font-size:11px;font-weight:600;color:var(--tx-mut);margin-right:2px}
.pre{font-size:11.5px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.13s}
.pre:hover{border-color:var(--teal);color:var(--teal)}
.pre.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.grp{border-top:1px solid var(--line)}
.grp-h{width:100%;display:flex;align-items:center;gap:8px;padding:11px 15px;background:none;border:0;cursor:pointer;color:var(--tx-mut)}
.grp-t{flex:1;text-align:left;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--clay)}
.grp-avg{font-family:'DM Mono';font-size:11px;color:var(--tx-mut)}
.grp-b{padding:2px 15px 12px}
.sk{display:flex;flex-direction:column;gap:5px;margin-top:11px}
.sk-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.sk-l{font-size:12.5px;font-weight:600;color:var(--tx-soft);line-height:1.3}
.sk-h{display:block;font-style:normal;font-weight:400;font-size:10px;color:var(--tx-mut);margin-top:1px}
.sk-v{font-family:'DM Mono';font-size:13px;flex:none;width:22px;text-align:right}
.v-strong{color:var(--teal)}.v-solid{color:var(--teal-line)}.v-okay{color:var(--blue)}.v-weak{color:var(--tx-mut)}.v-none{color:#c3ccb8}
.range{-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;outline:0;cursor:pointer;width:100%;background:linear-gradient(90deg,var(--teal) var(--p),#e4dccb var(--p))}
.range::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.range::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:#fff;border:2px solid var(--ink);cursor:pointer}
.filt{padding:4px 15px 15px}
.filt-l{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--clay);margin:14px 0 8px}
.chiprow{display:flex;flex-wrap:wrap;gap:6px}
.fchip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:5px 10px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--tx-soft);cursor:pointer;transition:.12s}
.fchip:hover{border-color:var(--tx-mut)}
.fchip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.fdot{width:7px;height:7px;border-radius:50%;display:inline-block}

.result{background:var(--ink);border-radius:18px;padding:20px;color:#e8ebef;position:relative;overflow:hidden;box-shadow:0 24px 50px -28px rgba(10,13,20,.7)}
.result::before{content:'';position:absolute;top:-60px;right:-40px;width:240px;height:240px;background:radial-gradient(circle,rgba(52,199,154,.12),transparent 70%);pointer-events:none}
.verdict{display:flex;gap:11px;position:relative;margin-bottom:14px}
.v-icn{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;background:#1a212b;color:var(--teal-line)}
.v-tag{font-family:'Syne';font-weight:700;font-size:clamp(16px,2.3vw,20px);line-height:1.14;color:#fff;letter-spacing:-0.02em}
.verdict p{font-size:12.5px;color:#9aa3ad;margin:6px 0 0;line-height:1.55}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:9px;position:relative;margin-bottom:12px}
@media(min-width:560px){.tiles{grid-template-columns:repeat(4,1fr)}}
.tile{background:var(--ink-3);border:1px solid #1e2530;border-radius:12px;padding:11px}
.t-l{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:#7e8896}
.t-v{display:block;font-family:'DM Mono';font-size:20px;font-weight:500;margin:4px 0 1px;color:#fff}
.t-v.sm{font-size:13.5px;font-family:'DM Sans';font-weight:700;line-height:1.15}
.t-v.pos{color:var(--teal-line)}.t-v.amber{color:#f0a04b}
.t-s{font-size:9px;color:#6b7682;line-height:1.3;display:block}
.leverage{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:12px;padding:11px 14px;margin-bottom:14px}
.lev-l{font-size:10.5px;color:#9aa3ad;display:block;margin-bottom:8px}
.lev-row{display:flex;flex-wrap:wrap;gap:7px}
.lev{display:inline-flex;align-items:center;gap:7px;background:#0d1219;border:1px solid #242c38;border-radius:99px;padding:4px 6px 4px 11px}
.lev b{font-size:11.5px;font-weight:600;color:#cdd4dc}
.lev i{font-style:normal;font-family:'DM Mono';font-size:11px;color:var(--teal-line);background:rgba(52,199,154,.12);border-radius:99px;padding:1px 7px}

.listhead{display:flex;justify-content:space-between;align-items:center;gap:10px;position:relative;margin-bottom:9px;flex-wrap:wrap}
.lh-count{font-family:'DM Mono';font-size:11px;color:#7e8896}
.sortrow{display:flex;align-items:center;gap:5px;font-size:10.5px;color:#7e8896}
.sortb{font-size:10.5px;font-weight:600;color:#8a94a0;background:#0d1219;border:1px solid #242c38;border-radius:7px;padding:4px 9px;cursor:pointer}
.sortb.on{background:var(--teal);color:#fff;border-color:var(--teal)}
.search{position:relative;display:flex;align-items:center;gap:7px;background:var(--ink-3);border:1px solid #1e2530;border-radius:10px;padding:8px 12px;margin-bottom:12px}
.search input{flex:1;border:0;outline:0;background:none;font-size:12.5px;color:#e8ebef}
.search input::placeholder{color:#5a6470}
.search svg{color:#6b7682}

.cards{display:flex;flex-direction:column;gap:9px;position:relative}
.empty{text-align:center;font-size:12px;color:#7e8896;padding:24px}
.card{background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;overflow:hidden;transition:border-color .15s}
.card.blk{border-color:rgba(224,86,63,.35)}
.card-h{width:100%;display:flex;align-items:center;gap:11px;padding:12px 13px;background:none;border:0;cursor:pointer;text-align:left}
.c-dot{width:9px;height:9px;border-radius:50%;flex:none}
.c-id{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.c-id b{font-family:'Syne';font-weight:700;font-size:14px;color:#fff;line-height:1.15}
.c-id i{font-style:normal;font-size:10.5px;color:#7e8896;line-height:1.3}
.c-chips{display:flex;gap:5px;margin-top:3px}
.c-chip{font-size:9px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:#9aa3ad;background:#0d1219;border:1px solid #242c38;border-radius:99px;padding:2px 8px}
.c-chip.alt{color:#7e8896}
.c-fit{display:flex;flex-direction:column;align-items:flex-end;flex:none}
.c-pct{font-family:'DM Mono';font-size:21px;font-weight:500;line-height:1}
.c-pct i{font-size:11px;font-style:normal}
.c-fw{font-size:9px;color:#7e8896;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
.c-chev{color:#6b7682;flex:none}
.c-natrow{display:flex;align-items:center;gap:9px;padding:6px 13px;flex-wrap:wrap}
.c-nat{display:inline-flex;align-items:center;gap:5px;font-family:'Syne';font-weight:700;font-size:11px}
.c-nat-s{font-size:10.5px;color:#8a94a0;line-height:1.3}
.c-body{padding:11px 13px 13px}
.c-block{display:flex;gap:7px;align-items:flex-start;background:rgba(224,86,63,.1);border:1px solid rgba(224,86,63,.3);border-radius:9px;padding:8px 10px;margin-bottom:11px;font-size:11px;color:#f0a99e;line-height:1.5}
.c-block svg{flex:none;margin-top:1px;color:#e0563f}
.c-subs{display:flex;flex-direction:column;gap:7px}
.sub{display:grid;grid-template-columns:minmax(130px,42%) 1fr;gap:10px;align-items:center}
.sub-l{font-size:11px;color:#9aa3ad;display:flex;align-items:center;gap:6px}
.gate{font-style:normal;font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#e0563f;background:rgba(224,86,63,.14);border-radius:99px;padding:1px 6px}
.sub-bars{display:flex;align-items:center;gap:8px}
.bar{flex:1;height:7px;background:#0d1219;border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:99px;transition:width .3s}
.sub-w{font-family:'DM Mono';font-size:9.5px;color:#6b7682;flex:none;width:30px;text-align:right}
.more{font-size:10.5px;color:var(--teal-line);background:none;border:0;cursor:pointer;text-align:left;padding:2px 0;font-family:'DM Mono'}
.c-to{font-size:11.5px;color:#8a94a0;margin-top:11px;line-height:1.45}
.c-more{margin-top:12px;border-top:1px solid #242c38;padding-top:11px;display:flex;flex-direction:column;gap:9px}
.c-detail{font-size:11.5px;color:#9aa3ad;line-height:1.55}
.c-note{font-size:11px;color:#7e8896;line-height:1.5;font-style:italic}
.c-meta{display:flex;gap:16px;flex-wrap:wrap;font-size:10.5px;color:#7e8896}
.c-meta b{color:#bcc4cd;font-weight:600;text-transform:capitalize}
.c-unlock{display:flex;gap:7px;align-items:flex-start;background:rgba(232,146,42,.09);border:1px solid rgba(232,146,42,.28);border-radius:9px;padding:8px 10px;font-size:11px;color:#f0c08a;line-height:1.5}
.c-unlock svg{flex:none;margin-top:1px;color:#E8922A}
.c-unlock b{color:#fff;font-weight:600}

.langbox{position:relative;background:var(--ink-3);border:1px solid #1e2530;border-radius:13px;padding:14px;margin-top:14px}
.lang-h{display:flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;color:#fff;margin-bottom:8px}
.lang-p{font-size:11px;color:#8a94a0;line-height:1.55;margin-bottom:12px}
.lang-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(min-width:620px){.lang-grid{grid-template-columns:repeat(3,1fr)}}
.lang{background:#0d1219;border:1px solid #242c38;border-radius:10px;padding:10px 11px;display:flex;flex-direction:column;gap:2px}
.lang b{font-family:'Syne';font-weight:700;font-size:12px;color:#e8ebef}
.lang-lg{font-size:10px;color:var(--teal-line);font-weight:600}
.lang i{font-style:normal;font-size:10px;color:#8a94a0;line-height:1.4;margin-top:2px}
.lang-bd{font-size:9px;color:#5a6470;margin-top:3px}

.meth{margin-top:18px;background:var(--ink);border-radius:16px;padding:20px;color:#aeb6c0}
.meth-h{display:flex;align-items:center;gap:8px;font-family:'Syne';font-weight:700;font-size:14px;color:#fff;margin-bottom:10px}
.meth p{font-size:12px;line-height:1.65;margin:0 0 10px;max-width:96ch}
.meth p b{color:#dfe4e9}
.meth p em{font-style:italic;color:#c8cdd4}
.disc{color:#7e8896;font-size:11px}
.sign{display:flex;align-items:center;gap:8px;font-size:11px;color:#7e8896;margin-top:6px;border-top:1px solid #1e2530;padding-top:12px}
.sign .dot{box-shadow:0 0 0 3px rgba(232,146,42,.15)}
`;
