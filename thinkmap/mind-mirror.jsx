import React, { useState, useMemo } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Brain, Eye, Sparkles, Target, TrendingUp, RefreshCw, Info, Layers, Gauge, Compass, ChevronDown, ChevronUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   MIND MIRROR — how you see your own mind
   A structured self-PERCEPTION profile, not an intelligence measurement.
   Self-report can only reveal how a person sees themselves; this tool
   is honest about that, and turns the limitation (self-knowledge, the
   Dunning-Kruger gap) into the centrepiece. 18 facets · 5 clusters.
   Reframed from a user-supplied "intelligence matrix"; content preserved.
   ═══════════════════════════════════════════════════════════════════ */

export const HERO = {
  eyebrow: "ThinkMap · A self-reflection tool",
  title: "Mind Mirror",
  sub: "How you see your own mind",
};

/* five clusters the 18 facets roll up into */
export const CLUSTERS = [
  { key: "analytical", label: "Analytical & Fluid",              color: "#0B5C45", ids: ["logical","spatial","workingMem","processingSpeed"] },
  { key: "knowledge",  label: "Knowledge & Communication",       color: "#4a7fb5", ids: ["verbal","longTerm","digital"] },
  { key: "social",     label: "Social & Emotional",              color: "#E8922A", ids: ["interpersonal","intrapersonal","emoPercep"] },
  { key: "creative",   label: "Creative, Strategic & Reflective",color: "#8a6dc0", ids: ["creative","strategic","existential","metacognitive"] },
  { key: "applied",    label: "Applied & Sensory",               color: "#c2691f", ids: ["practical","kinesthetic","naturalistic","musical"] },
];

/* 18 facets */
export const DOMAINS = [
  { id:"logical",        label:"Logical & Fluid Reasoning", short:"Logical",   cluster:"analytical", desc:"Abstract reasoning, pattern-finding, deconstructing systems" },
  { id:"spatial",        label:"Spatial & Visual",          short:"Spatial",   cluster:"analytical", desc:"Mental rotation, layouts, seeing structure in diagrams" },
  { id:"workingMem",     label:"Working Memory",            short:"Work.Mem",  cluster:"analytical", desc:"Holding several moving parts in mind at once" },
  { id:"processingSpeed",label:"Processing Speed",          short:"Speed",     cluster:"analytical", desc:"Fast scanning, quick reactions, rapid filtering" },
  { id:"verbal",         label:"Verbal & Linguistic",       short:"Verbal",    cluster:"knowledge",  desc:"Vocabulary, comprehension, written articulation" },
  { id:"longTerm",       label:"Long-Term Recall",          short:"Recall",    cluster:"knowledge",  desc:"Retrieving facts, names and knowledge over time" },
  { id:"digital",        label:"Digital & Technological",   short:"Digital",   cluster:"knowledge",  desc:"Tech fluency, computational thinking, troubleshooting" },
  { id:"interpersonal",  label:"Interpersonal",             short:"Social",    cluster:"social",     desc:"Reading people, building trust, managing relationships" },
  { id:"intrapersonal",  label:"Intrapersonal",             short:"Self",      cluster:"social",     desc:"Self-awareness, regulating emotion, seeing blind spots" },
  { id:"emoPercep",      label:"Emotional Perception",      short:"Emotion",   cluster:"social",     desc:"Sensing tone, micro-expressions, unspoken feeling" },
  { id:"creative",       label:"Creative & Divergent",      short:"Creative",  cluster:"creative",   desc:"Ideation, originality, questioning assumptions" },
  { id:"strategic",      label:"Strategic & Systemic",      short:"Strategic", cluster:"creative",   desc:"Foresight, leverage points, thinking several moves ahead" },
  { id:"existential",    label:"Existential & Philosophical",short:"Meaning",  cluster:"creative",   desc:"Grappling with meaning, consciousness, big questions" },
  { id:"metacognitive",  label:"Metacognition & Humility",  short:"Humility",  cluster:"creative",   desc:"Admitting error, updating beliefs, embracing grey areas" },
  { id:"practical",      label:"Practical & Execution",     short:"Practical", cluster:"applied",    desc:"Improvising, navigating ambiguity, getting things done" },
  { id:"kinesthetic",    label:"Kinesthetic & Bodily",      short:"Body",      cluster:"applied",    desc:"Coordination, dexterity, physical mastery" },
  { id:"naturalistic",   label:"Naturalistic",              short:"Nature",    cluster:"applied",    desc:"Sensing the environment, biological pattern-recognition" },
  { id:"musical",        label:"Musical & Auditory",        short:"Musical",   cluster:"applied",    desc:"Rhythm, tone, recognising auditory patterns" },
];

/* 72 facet questions (4 each) + 2 calibration questions.
   conf2 is reverse-scored. Facet items are self-perception statements. */
export const QUESTIONS = [
  // logical
  { id:"q1", d:"logical", t:"I abstract underlying rules from complex patterns effortlessly." },
  { id:"q2", d:"logical", t:"I solve novel logic puzzles faster than most people I know." },
  { id:"q3", d:"logical", t:"I spot flaws in an argument or a data structure almost immediately." },
  { id:"q4", d:"logical", t:"I break complex systems into clear, step-by-step causal chains." },
  // spatial
  { id:"q5", d:"spatial", t:"I can mentally rotate 3D objects and predict how they fit together." },
  { id:"q6", d:"spatial", t:"I design efficient layouts for physical spaces or diagrams." },
  { id:"q7", d:"spatial", t:"I navigate unfamiliar places from a map without needing GPS." },
  { id:"q8", d:"spatial", t:"I picture flowcharts or pipelines as tangible structures in my head." },
  // workingMem
  { id:"q9",  d:"workingMem", t:"I hold several competing variables in mind while deciding." },
  { id:"q10", d:"workingMem", t:"I recall multi-part instructions accurately without writing them down." },
  { id:"q11", d:"workingMem", t:"I juggle several tasks without losing track of where each stands." },
  { id:"q12", d:"workingMem", t:"I keep an accurate mental model of a multi-step process as it unfolds." },
  // processingSpeed
  { id:"q13", d:"processingSpeed", t:"I quickly scan a long list or document and catch the errors." },
  { id:"q14", d:"processingSpeed", t:"My reactions to unexpected events feel faster than most people's." },
  { id:"q15", d:"processingSpeed", t:"I get through repetitive mental tasks noticeably quickly." },
  { id:"q16", d:"processingSpeed", t:"I rapidly filter out noise to focus on the detail that matters." },
  // verbal
  { id:"q17", d:"verbal", t:"I express nuanced ideas with precise, well-chosen words." },
  { id:"q18", d:"verbal", t:"I understand dense technical or literary text in a single pass." },
  { id:"q19", d:"verbal", t:"I can craft a persuasive written argument under time pressure." },
  { id:"q20", d:"verbal", t:"I quickly absorb and summarise information from long documents." },
  // longTerm
  { id:"q21", d:"longTerm", t:"I recall obscure facts from years ago when I need them." },
  { id:"q22", d:"longTerm", t:"I connect new information to a wide web of things I already know." },
  { id:"q23", d:"longTerm", t:"I retain detailed know-how about systems I've worked with." },
  { id:"q24", d:"longTerm", t:"I remember names, dates and events accurately over long stretches." },
  // digital
  { id:"q25", d:"digital", t:"I learn new software and tools faster than most people around me." },
  { id:"q26", d:"digital", t:"I intuitively grasp the logic behind code or algorithms." },
  { id:"q27", d:"digital", t:"I troubleshoot devices by working through them systematically." },
  { id:"q28", d:"digital", t:"I adapt quickly when digital platforms and tools change." },
  // interpersonal
  { id:"q29", d:"interpersonal", t:"I sense how someone will react to news before they say it." },
  { id:"q30", d:"interpersonal", t:"I find common ground between people who disagree." },
  { id:"q31", d:"interpersonal", t:"I build trust quickly with very different kinds of people." },
  { id:"q32", d:"interpersonal", t:"I read the mood of a room and adjust how I act." },
  // intrapersonal
  { id:"q33", d:"intrapersonal", t:"I examine my own reactions to uncover my biases." },
  { id:"q34", d:"intrapersonal", t:"I stay composed when I'm criticised personally." },
  { id:"q35", d:"intrapersonal", t:"I actively ask for feedback to find my blind spots." },
  { id:"q36", d:"intrapersonal", t:"I can clearly describe the conditions I need to focus well." },
  // emoPercep
  { id:"q37", d:"emoPercep", t:"I notice subtle expressions that reveal what someone really feels." },
  { id:"q38", d:"emoPercep", t:"I sense the emotional temperature of a room before anyone speaks." },
  { id:"q39", d:"emoPercep", t:"I read tone of voice accurately to gauge how sincere someone is." },
  { id:"q40", d:"emoPercep", t:"I pick up on unspoken tension or warmth between other people." },
  // creative
  { id:"q41", d:"creative", t:"I generate many different ideas for a single problem." },
  { id:"q42", d:"creative", t:"I combine unrelated concepts into something new." },
  { id:"q43", d:"creative", t:"I question assumptions that other people take for granted." },
  { id:"q44", d:"creative", t:"I deliberately think in unusual directions to escape a rut." },
  // strategic
  { id:"q45", d:"strategic", t:"I picture the long-term ripple effects of a decision." },
  { id:"q46", d:"strategic", t:"I find the leverage points where a small move has outsized impact." },
  { id:"q47", d:"strategic", t:"I anticipate how others will act several steps ahead." },
  { id:"q48", d:"strategic", t:"I build long-range plans with flexible fallback paths." },
  // existential
  { id:"q49", d:"existential", t:"I think about the fundamental nature of consciousness and reality." },
  { id:"q50", d:"existential", t:"I bring scientific and philosophical views together on big questions." },
  { id:"q51", d:"existential", t:"I find meaning and coherence in chaotic or ambiguous events." },
  { id:"q52", d:"existential", t:"I weigh the ethical implications of new technology." },
  // metacognitive
  { id:"q53", d:"metacognitive", t:"I readily admit when I'm wrong and update my view on new evidence." },
  { id:"q54", d:"metacognitive", t:"I seek out opposing viewpoints to test my own assumptions." },
  { id:"q55", d:"metacognitive", t:"I treat most complex issues as grey areas rather than black-and-white." },
  { id:"q56", d:"metacognitive", t:"I keep asking 'why' and 'how' to understand how things really work." },
  // practical
  { id:"q57", d:"practical", t:"I improvise a working solution when the standard one fails." },
  { id:"q58", d:"practical", t:"I find my way around obstacles to get a real outcome." },
  { id:"q59", d:"practical", t:"I estimate time and resources for a project fairly accurately." },
  { id:"q60", d:"practical", t:"I read the unwritten rules of a place to get things done." },
  // kinesthetic
  { id:"q61", d:"kinesthetic", t:"I pick up complex physical movements after watching them once." },
  { id:"q62", d:"kinesthetic", t:"I handle tools or instruments with unusual dexterity." },
  { id:"q63", d:"kinesthetic", t:"I keep precise balance and control in demanding physical settings." },
  { id:"q64", d:"kinesthetic", t:"I learn sports, dance or physical skills faster than average." },
  // naturalistic
  { id:"q65", d:"naturalistic", t:"I quickly tell plants, animals or terrain apart by subtle traits." },
  { id:"q66", d:"naturalistic", t:"I read natural cues to sense weather or environmental change." },
  { id:"q67", d:"naturalistic", t:"I notice patterns in ecological or biological detail." },
  { id:"q68", d:"naturalistic", t:"I'm keenly aware of small changes in my physical surroundings." },
  // musical
  { id:"q69", d:"musical", t:"I easily catch an off-key note or a broken rhythm in music." },
  { id:"q70", d:"musical", t:"I remember melodies and rhythms after hearing them once." },
  { id:"q71", d:"musical", t:"I enjoy picking out rhythmic patterns in everyday sounds." },
  { id:"q72", d:"musical", t:"I can hum or recreate a tune accurately after a single listen." },
  // calibration (excluded from facet scores)
  { id:"conf1", d:"meta", t:"I'm confident I can judge my own thinking abilities accurately." },
  { id:"conf2", d:"meta", t:"I tend to underestimate my abilities compared with how I actually perform.", reverse:true },
];
/* ═══════════════════════════════════════════════════════════════════
   MIND MIRROR — engine + UI (reads the head: HERO, CLUSTERS, DOMAINS, QUESTIONS)
   ═══════════════════════════════════════════════════════════════════ */

const DM = Object.fromEntries(DOMAINS.map(d => [d.id, d]));
const CL = Object.fromEntries(CLUSTERS.map(c => [c.key, c]));
const FACET_Q = QUESTIONS.filter(q => q.d !== "meta");
const TOTAL = QUESTIONS.length;

function compute(answers) {
  const facet = {};
  DOMAINS.forEach(dm => {
    const qs = FACET_Q.filter(q => q.d === dm.id);
    const sum = qs.reduce((t, q) => t + (answers[q.id] || 0), 0);
    facet[dm.id] = Math.round((sum / (qs.length * 5)) * 100);
  });
  const cluster = {};
  CLUSTERS.forEach(c => {
    cluster[c.key] = Math.round(c.ids.reduce((t, id) => t + facet[id], 0) / c.ids.length);
  });
  const c1 = answers.conf1 || 3, c2 = answers.conf2 || 3;
  const calib = Math.round((((c1 + (6 - c2)) / 2 - 1) / 4) * 100);
  const vals = DOMAINS.map(d => facet[d.id]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((t, v) => t + (v - mean) ** 2, 0) / vals.length);
  return { facet, cluster, calib, mean: Math.round(mean), sd: Math.round(sd) };
}

function fitTone(v) { return v >= 70 ? "#0B5C45" : v >= 45 ? "#4a7fb5" : "#8a94a0"; }

/* ── Likert row ─────────────────────────────────────────────────── */
const OPTS = [
  { v: 1, s: "SD", l: "Strongly disagree" },
  { v: 2, s: "D",  l: "Disagree" },
  { v: 3, s: "N",  l: "Neutral" },
  { v: 4, s: "A",  l: "Agree" },
  { v: 5, s: "SA", l: "Strongly agree" },
];
function Likert({ q, val, onPick, missing }) {
  return (
    <div className={"q" + (missing ? " q-miss" : "")}>
      <div className="q-t">{q.t}</div>
      <div className="q-row">
        {OPTS.map(o => (
          <button key={o.v} type="button" title={o.l}
            className={"lk" + (val === o.v ? " on" : "")}
            onClick={() => onPick(q.id, o.v)}>
            <span className="lk-v">{o.v}</span><span className="lk-s">{o.s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── results ────────────────────────────────────────────────────── */
function Results({ res, onRetake }) {
  const ranked = DOMAINS.map(d => ({ ...d, v: res.facet[d.id] })).sort((a, b) => b.v - a.v);
  const top = ranked.slice(0, 3), low = ranked.slice(-3).reverse();
  const radar = DOMAINS.map(d => ({ facet: d.short, v: res.facet[d.id] }));
  const [openC, setOpenC] = useState({});

  const shape = res.sd >= 17
    ? { w: "spiky", t: `You see yourself as specialised — sharp peaks and clear dips (spread of ±${res.sd} points). A pronounced self-image, strong where you feel strong.` }
    : res.sd <= 9
      ? { w: "even", t: `You see yourself as an all-rounder — a fairly even profile (spread of only ±${res.sd} points). Few facets stand far above or below the rest in your own eyes.` }
      : { w: "mixed", t: `You see yourself as a balanced mix — some clear strengths, some quieter areas (spread of ±${res.sd} points), without extreme peaks or troughs.` };

  const hum = res.facet.metacognitive;
  const aware = res.calib >= 70 && hum < 55
    ? "You rate yourself a confident judge of your own mind, but score your humility facet lower — worth noticing. The most self-aware people tend to hold even their confident self-assessments loosely."
    : res.calib >= 70 && hum >= 70
      ? "You're confident in your self-judgement and you also score high on humility — a healthy pairing. You seem to know yourself while holding that knowledge lightly."
      : res.calib <= 40
        ? "You're cautious about trusting your own self-assessment. That can mean genuine humility — or selling yourself short. External feedback is a good cross-check either way."
        : "You hold a measured view of how well you know yourself — neither over-certain nor dismissive of your own read.";

  return (
    <div className="res">
      <div className="res-head">
        <h2>How you see your mind</h2>
        <button className="ghost" onClick={onRetake}><RefreshCw size={13} /> Retake</button>
      </div>

      <div className="mirror-note"><Eye size={13} />
        <span>This is a reflection of your <b>self-perception</b> — how you rated yourself today — not a measurement of ability. Read it as a mirror, not a scoreboard.</span>
      </div>

      <div className="radar-box">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radar} outerRadius="72%">
            <PolarGrid stroke="#2a3340" />
            <PolarAngleAxis dataKey="facet" tick={{ fill: "#9aa3ad", fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#5a6470", fontSize: 9 }} axisLine={false} />
            <Radar dataKey="v" stroke="#34c79a" fill="#0B5C45" fillOpacity={0.35} strokeWidth={2} />
            <Tooltip formatter={(v) => [v + "%", "self-rating"]} contentStyle={{ background: "#11161f", border: "1px solid #2a3340", borderRadius: 8, color: "#e8ebef", fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* clusters */}
      <div className="clus">
        {CLUSTERS.map(c => (
          <div className="clus-row" key={c.key}>
            <button className="clus-h" onClick={() => setOpenC(o => ({ ...o, [c.key]: !o[c.key] }))}>
              <span className="clus-dot" style={{ background: c.color }} />
              <span className="clus-l">{c.label}</span>
              <span className="clus-v" style={{ color: c.color }}>{res.cluster[c.key]}%</span>
              {openC[c.key] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="clus-bar"><i style={{ width: res.cluster[c.key] + "%", background: c.color }} /></div>
            {openC[c.key] && (
              <div className="clus-body">
                {c.ids.map(id => (
                  <div className="facet" key={id}>
                    <span className="facet-l">{DM[id].label}<em>{DM[id].desc}</em></span>
                    <div className="facet-barwrap">
                      <div className="facet-bar"><i style={{ width: res.facet[id] + "%", background: fitTone(res.facet[id]) }} /></div>
                      <span className="facet-v">{res.facet[id]}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* read-out */}
      <div className="reads">
        <div className="read">
          <span className="read-l"><Sparkles size={13} /> Where you see yourself strongest</span>
          <p>{top.map((d, i) => (i === 2 ? "and " : "") + d.label + " (" + d.v + "%)").join(", ")}.</p>
        </div>
        <div className="read">
          <span className="read-l"><TrendingUp size={13} /> Where you're least sure</span>
          <p>{low.map((d, i) => (i === 2 ? "and " : "") + d.label + " (" + d.v + "%)").join(", ")}. These are honest places to grow — or simply areas you value less.</p>
        </div>
        <div className="read">
          <span className="read-l"><Layers size={13} /> The shape of your self-image</span>
          <p>{shape.t}</p>
        </div>
        <div className="read hi">
          <span className="read-l"><Gauge size={13} /> How well you know your own mind</span>
          <p><b>Self-awareness reading: {res.calib}%.</b> {aware}</p>
        </div>
      </div>

      <div className="humility">
        <Info size={13} />
        <span>Self-report is shaped by mood, culture and the Dunning–Kruger gap — people often over- or under-rate themselves. The value here isn't the numbers; it's the act of looking. Use it to start a reflection, compare with how others see you, or retake it in six months and watch what shifts.</span>
      </div>
    </div>
  );
}

/* ── main ───────────────────────────────────────────────────────── */
export default function App() {
  const [answers, setAnswers] = useState({});
  const [view, setView] = useState("form");
  const [res, setRes] = useState(null);
  const [showMiss, setShowMiss] = useState(false);

  const answered = Object.keys(answers).length;
  const pick = (id, v) => { setAnswers(a => ({ ...a, [id]: v })); setShowMiss(false); };

  const calc = () => {
    if (answered < TOTAL) { setShowMiss(true); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setRes(compute(answers)); setView("results"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const retake = () => { setAnswers({}); setRes(null); setView("form"); setShowMiss(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="wrap">
      <style>{CSS}</style>

      <header className="top">
        <div className="brand"><span className="dot" /> CatalystBox</div>
        <span className="eyebrow">{HERO.eyebrow}</span>
        <h1><Brain size={34} strokeWidth={1.6} /> {HERO.title}</h1>
        <p className="subttl">{HERO.sub}</p>
        <p className="lede">
          This isn't an IQ test, and it can't measure your intelligence — <b>nothing you fill in about yourself can.</b>
          What it can do is hold up a mirror: a clear picture of how you see your own mind across eighteen different
          kinds of thinking, and — the interesting part — how well you seem to know yourself.
        </p>
        <div className="honest">
          <Eye size={15} />
          <span>It maps <b>self-perception, not ability.</b> Answer for how you actually are, not how you'd like to be. There are no right answers, and no score here decides your worth. <b>No agenda in the output. All agency in the decision.</b></span>
        </div>
      </header>

      {view === "form" && (
        <div className="form">
          <div className="prog">
            <div className="prog-txt"><span>{answered} / {TOTAL} answered</span>
              {showMiss && <span className="prog-miss">Answer all statements to see your mirror ({TOTAL - answered} left)</span>}</div>
            <div className="prog-bar"><i style={{ width: (answered / TOTAL) * 100 + "%" }} /></div>
            <div className="legend">
              <span className="legend-lbl">What the buttons mean:</span>
              {OPTS.map(o => (<span className="lg" key={o.v}><i>{o.s}</i> {o.l}</span>))}
            </div>
          </div>

          {CLUSTERS.map(c => (
            <div className="grp" key={c.key}>
              <div className="grp-h" style={{ "--c": c.color }}>
                <span className="grp-dot" style={{ background: c.color }} />{c.label}
              </div>
              {c.ids.map(id => (
                <div className="grp-facet" key={id}>
                  <div className="grp-facet-h">{DM[id].label}<em>{DM[id].desc}</em></div>
                  {FACET_Q.filter(q => q.d === id).map(q => (
                    <Likert key={q.id} q={q} val={answers[q.id]} onPick={pick} missing={showMiss && !answers[q.id]} />
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* calibration block */}
          <div className="grp">
            <div className="grp-h cal" style={{ "--c": "#E8922A" }}>
              <span className="grp-dot" style={{ background: "#E8922A" }} />Knowing yourself — a quick calibration
            </div>
            <p className="cal-note">These two don't feed your facet scores. They gauge how confident you are in your own self-read — the heart of the mirror.</p>
            {QUESTIONS.filter(q => q.d === "meta").map(q => (
              <Likert key={q.id} q={q} val={answers[q.id]} onPick={pick} missing={showMiss && !answers[q.id]} />
            ))}
          </div>

          <div className="foot-actions">
            <button className="btn ghost" onClick={retake} disabled={answered === 0}>Clear</button>
            <button className="btn primary" onClick={calc}><Compass size={16} /> Show my mirror</button>
          </div>
        </div>
      )}

      {view === "results" && res && <Results res={res} onRetake={retake} />}

      <footer className="meth">
        <div className="meth-h"><Brain size={13} /> What this is, and isn't</div>
        <p><b>Mind Mirror is a structured self-reflection tool, not a measure of intelligence.</b> It asks you to rate yourself on everyday statements across eighteen facets of thinking, then shows the pattern back to you: which areas you see as strengths, which you're less sure of, the overall shape of your self-image, and how confidently you judge your own mind. The eighteen facets draw loosely on popular ideas about many kinds of intelligence — a framework that's useful for reflection but scientifically contested as real, separate "intelligences," which is exactly why nothing here is presented as measured ability.</p>
        <p className="disc">Every result is a reflection of self-perception on the day you answer — shaped by mood, culture, context and the well-documented gap between how people rate themselves and how they actually perform. It is not a psychological assessment, a diagnosis, an IQ estimate, or a judgement of your capability or worth, and it should never be used to decide anything about a person. If you want an objective picture of a specific ability, seek a validated instrument administered by a qualified professional. Use this only as a starting point for honest self-reflection.</p>
        <div className="sign"><span className="dot" /> No agenda in the output. All agency in the decision.</div>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
.wrap{--ink:#0a0d14;--ink-3:#11161f;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--blue:#4a7fb5;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;
  background:var(--parch);color:var(--tx);font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.55;max-width:860px;margin:0 auto;padding:24px 16px 44px}
.wrap *{box-sizing:border-box;margin:0;padding:0}
.wrap h1,.wrap h2{font-family:'Syne',sans-serif;letter-spacing:-0.02em;line-height:1.05}

.top{margin-bottom:20px}
.brand{display:inline-flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;letter-spacing:.04em;color:var(--teal);text-transform:uppercase;margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block;box-shadow:0 0 0 3px rgba(232,146,42,.18)}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);display:block}
.top h1{font-size:clamp(38px,8vw,62px);font-weight:800;color:var(--ink);margin:6px 0 2px;display:flex;align-items:center;gap:12px}
.top h1 svg{color:var(--teal);flex:none}
.subttl{font-family:'Syne';font-weight:700;font-size:clamp(15px,3vw,20px);color:var(--teal);margin-bottom:12px}
.lede{max-width:72ch;font-size:15px;color:var(--tx-soft);margin-bottom:14px}
.lede b{color:var(--ink);font-weight:700}
.honest{display:flex;gap:10px;align-items:flex-start;background:var(--teal-tint);border:1px solid #a9d3c2;border-radius:13px;padding:13px 15px;font-size:13px;color:var(--tx-soft);line-height:1.5}
.honest svg{flex:none;margin-top:1px;color:var(--teal)}
.honest b{color:var(--teal)}

.prog{position:sticky;top:0;background:var(--parch);padding:10px 0 12px;z-index:20;margin-bottom:8px}
.prog-txt{display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:600;color:var(--tx-mut);margin-bottom:6px;flex-wrap:wrap}
.prog-miss{color:var(--clay)}
.prog-bar{height:6px;background:#e4dccb;border-radius:99px;overflow:hidden}
.prog-bar i{display:block;height:100%;background:var(--teal);border-radius:99px;transition:width .3s}
.legend{display:flex;flex-wrap:wrap;align-items:center;gap:5px 10px;margin-top:9px}
.legend-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--clay)}
.lg{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--tx-mut)}
.lg i{font-style:normal;font-weight:700;font-size:9px;color:#fff;background:var(--teal);border-radius:4px;padding:2px 6px;letter-spacing:.03em;min-width:22px;text-align:center}

.grp{margin-bottom:16px;background:var(--paper);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.grp-h{display:flex;align-items:center;gap:9px;padding:13px 16px;font-family:'Syne';font-weight:700;font-size:14px;color:var(--ink);border-bottom:1px solid var(--line);border-left:4px solid var(--c)}
.grp-dot{width:9px;height:9px;border-radius:50%;flex:none}
.grp-facet{padding:6px 16px 14px;border-bottom:1px solid var(--line)}
.grp-facet:last-child{border-bottom:0}
.grp-facet-h{font-family:'Syne';font-weight:700;font-size:12.5px;color:var(--clay);margin:12px 0 8px;text-transform:uppercase;letter-spacing:.04em}
.grp-facet-h em{display:block;font-style:normal;font-weight:400;font-size:11px;letter-spacing:0;text-transform:none;color:var(--tx-mut);margin-top:2px}
.cal-note{font-size:12px;color:var(--tx-mut);padding:12px 16px 4px;line-height:1.5}

.q{padding:9px 0;border-top:1px dashed #ece5d6}
.grp-facet .q:first-of-type{border-top:0}
.q-t{font-size:13.5px;color:var(--tx-soft);margin-bottom:8px;line-height:1.4}
.q-miss .q-t{color:var(--clay)}
.q-row{display:flex;gap:5px}
.lk{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 2px;background:#f1ece0;border:1.5px solid transparent;border-radius:8px;cursor:pointer;transition:.12s}
.lk:hover{border-color:var(--teal);background:var(--teal-tint)}
.lk.on{background:var(--teal);border-color:var(--teal);color:#fff;box-shadow:0 3px 10px rgba(11,92,69,.25)}
.q-miss .lk{border-color:#e6b89e}
.lk-v{font-family:'DM Mono';font-size:13px;font-weight:500}
.lk-s{font-size:8.5px;font-weight:700;letter-spacing:.03em;opacity:.75}

.foot-actions{display:flex;gap:10px;margin-top:18px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Syne';font-weight:700;font-size:15px;border-radius:12px;padding:14px 22px;cursor:pointer;border:1px solid var(--line);transition:.14s}
.btn.primary{flex:1;background:var(--ink);color:#fff;border-color:var(--ink)}
.btn.primary:hover{background:var(--teal);border-color:var(--teal)}
.btn.ghost{background:#fff;color:var(--tx-soft)}
.btn.ghost:hover{border-color:var(--tx-mut)}
.btn:disabled{opacity:.4;cursor:not-allowed}

.res-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.res-head h2{font-size:clamp(22px,5vw,32px);font-weight:800;color:var(--ink)}
.ghost{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--tx-mut);background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 13px;cursor:pointer}
.ghost:hover{border-color:var(--teal);color:var(--teal)}
.mirror-note{display:flex;gap:9px;align-items:flex-start;background:var(--amber-tint);border:1px solid #f0c890;border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--tx-soft);line-height:1.5;margin-bottom:16px}
.mirror-note svg{flex:none;margin-top:1px;color:var(--clay)}
.mirror-note b{color:var(--clay)}

.radar-box{background:var(--ink);border:1px solid var(--line);border-radius:16px;padding:14px 8px;margin-bottom:18px}

.clus{display:flex;flex-direction:column;gap:9px;margin-bottom:18px}
.clus-row{background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.clus-h{width:100%;display:flex;align-items:center;gap:10px;padding:12px 15px;background:none;border:0;cursor:pointer}
.clus-dot{width:10px;height:10px;border-radius:50%;flex:none}
.clus-l{flex:1;text-align:left;font-family:'Syne';font-weight:700;font-size:14px;color:var(--ink)}
.clus-v{font-family:'DM Mono';font-size:16px;font-weight:500}
.clus-bar{height:6px;background:#eee7d8;margin:0 15px 12px;border-radius:99px;overflow:hidden}
.clus-bar i{display:block;height:100%;border-radius:99px;transition:width .5s}
.clus-body{padding:2px 15px 14px;border-top:1px solid var(--line)}
.facet{display:grid;grid-template-columns:1fr;gap:5px;padding:9px 0}
.facet:not(:last-child){border-bottom:1px dashed #ece5d6}
.facet-l{font-size:12.5px;font-weight:600;color:var(--tx-soft)}
.facet-l em{display:block;font-style:normal;font-weight:400;font-size:11px;color:var(--tx-mut);margin-top:1px}
.facet-barwrap{display:flex;align-items:center;gap:9px}
.facet-bar{flex:1;height:7px;background:#eee7d8;border-radius:99px;overflow:hidden}
.facet-bar i{display:block;height:100%;border-radius:99px;transition:width .5s}
.facet-v{font-family:'DM Mono';font-size:12px;color:var(--tx-mut);flex:none;width:34px;text-align:right}

.reads{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px}
@media(min-width:620px){.reads{grid-template-columns:1fr 1fr}}
.read{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.read.hi{background:var(--ink);border-color:var(--ink);grid-column:1/-1}
.read-l{display:flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--clay);margin-bottom:7px}
.read.hi .read-l{color:var(--teal-line)}
.read p{font-size:13px;color:var(--tx-soft);line-height:1.55}
.read.hi p{color:#c8cfd6}
.read.hi p b{color:#fff}

.humility{display:flex;gap:9px;align-items:flex-start;background:var(--teal-tint);border:1px solid #a9d3c2;border-radius:12px;padding:13px 15px;font-size:12.5px;color:var(--tx-soft);line-height:1.55}
.humility svg{flex:none;margin-top:1px;color:var(--teal)}

.meth{margin-top:22px;background:var(--ink);border-radius:16px;padding:20px;color:#aeb6c0}
.meth-h{display:flex;align-items:center;gap:8px;font-family:'Syne';font-weight:700;font-size:14px;color:#fff;margin-bottom:10px}
.meth p{font-size:12px;line-height:1.65;margin-bottom:10px;max-width:94ch}
.meth p b{color:#dfe4e9}
.disc{color:#7e8896;font-size:11px}
.sign{display:flex;align-items:center;gap:8px;font-size:11px;color:#7e8896;margin-top:6px;border-top:1px solid #1e2530;padding-top:12px}
.sign .dot{box-shadow:0 0 0 3px rgba(232,146,42,.15)}
`;
