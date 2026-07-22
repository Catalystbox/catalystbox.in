import React from "react";
import { GraduationCap, TrendingUp, Trophy, Compass, ArrowRight, BookOpen, Sparkles, Brain } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   THINKMAP — decision-tools hub for catalystbox.in
   Lives at /thinkmap (the nav button). Cards route to each calculator.
   Same visual system as the calculators for a seamless transition.
   Swap the <a href> links for react-router <Link to> if your app uses it.
   ═══════════════════════════════════════════════════════════════════ */

const TOOLS = [
  {
    key: "education",
    name: "Education ROI",
    color: "#0B5C45", tint: "rgba(11,92,69,.10)", line: "#34c79a",
    Icon: GraduationCap,
    ask: "Is a degree, a coaching year, or a costly course actually worth it?",
    blurb: "Weighs the full cost of an education path — fees, years, and the earnings you give up — against what it realistically returns, across dream, base and worst-case scenarios.",
    editions: [{ label: "Open the calculator", href: "/thinkmap/education-roi" }],
    guide: "/thinkmap/guides/education-roi",
  },
  {
    key: "margin",
    name: "Margin",
    color: "#E8922A", tint: "rgba(232,146,42,.10)", line: "#E8922A",
    Icon: TrendingUp,
    ask: "Should I start this business, or take the steady salary?",
    blurb: "Models a business or self-employment path — capital, costs, growth, and the honest chance it fails — against the job you'd otherwise hold, side by side.",
    editions: [{ label: "Open the calculator", href: "/thinkmap/margin" }],
    guide: "/thinkmap/guides/margin",
  },
  {
    key: "podium",
    name: "Podium",
    color: "#4a7fb5", tint: "rgba(74,127,181,.10)", line: "#4a7fb5",
    Icon: Trophy,
    ask: "Is a serious sporting career worth the fifteen-year bet?",
    blurb: "Maps an athlete's odds gate by gate, prices prize money, salary and fame as three separate streams, and weighs the whole picture against the ordinary path.",
    editions: [
      { label: "India", href: "/thinkmap/podium-india" },
      { label: "Global", href: "/thinkmap/podium-global" },
    ],
    guide: "/thinkmap/guides/podium",
  },
  {
    key: "exam",
    name: "Exam Compass",
    color: "#8a6dc0", tint: "rgba(138,109,192,.10)", line: "#8a6dc0",
    Icon: Compass,
    ask: "Which exams actually fit the subjects I'm strong in?",
    blurb: "Rate your strengths and it ranks the exams you're best positioned to clear — then tells you what each one truly takes, because the same subjects can be a completely different fight.",
    editions: [
      { label: "India", href: "/thinkmap/exam-compass-india" },
      { label: "World", href: "/thinkmap/exam-compass-world" },
    ],
    guide: "/thinkmap/guides/exam-compass",
  },
  {
    key: "mind",
    name: "Mind Mirror",
    color: "#b5578a", tint: "rgba(181,87,138,.10)", line: "#b5578a",
    Icon: Brain,
    ask: "How do I see my own mind - and how well do I know it?",
    blurb: "Reflect across eighteen facets of thinking and see the shape of your self-image. It is not an intelligence test - it is a private mirror, with an honest check on how confidently you know yourself.",
    editions: [{ label: "Open the mirror", href: "/thinkmap/mind-mirror" }],
    guide: "/thinkmap/guides/mind-mirror",
  },
];

function ToolCard({ t }) {
  const { Icon } = t;
  return (
    <div className="tm-card" style={{ "--c": t.color, "--tint": t.tint, "--line": t.line }}>
      <div className="tm-card-top">
        <span className="tm-ic"><Icon size={20} /></span>
        <h3>{t.name}</h3>
      </div>
      <p className="tm-ask">{t.ask}</p>
      <p className="tm-blurb">{t.blurb}</p>
      <div className="tm-actions">
        {t.editions.map((e) => (
          <a key={e.href} className="tm-btn" href={e.href}>
            {t.editions.length > 1 ? e.label : e.label}<ArrowRight size={14} />
          </a>
        ))}
        <a className="tm-guide" href={t.guide}><BookOpen size={13} /> How to use</a>
      </div>
    </div>
  );
}

export default function ThinkMap() {
  return (
    <div className="tm-wrap">
      <style>{CSS}</style>

      <header className="tm-hero">
        <div className="tm-brand"><span className="tm-dot" /> CatalystBox</div>
        <span className="tm-eyebrow">ThinkMap · Decision Tools</span>
        <h1>Think it through.</h1>
        <p className="tm-lede">
          Some of life's most important choices begin with an uncertain question: which degree, which business,
          which sport, which exam, or how clearly you understand yourself. <b>ThinkMap is a set of free, honest
          tools for thinking those moments through.</b> Each one makes hidden trade-offs or patterns visible,
          without taking the decision out of your hands.
        </p>
        <div className="tm-ethic">
          <Sparkles size={15} />
          <span>No agenda in the output. <b>All agency in the decision.</b></span>
        </div>
      </header>

      <div className="tm-grid">
        {TOOLS.map((t) => <ToolCard key={t.key} t={t} />)}
      </div>

      <footer className="tm-foot">
        <div className="tm-foot-row">
          <span>✓ Free to use</span>
          <span>✓ Nothing saved, nothing tracked</span>
          <span>✓ Works on any phone, no login</span>
        </div>
        <p className="tm-disc">
          Every figure or reflection here is an illustrative starting point, not a forecast, diagnosis, promise,
          or financial, career, admissions, or psychological advice. These tools exist to help you think, not to
          tell you what to do.
        </p>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
.tm-wrap{--ink:#0a0d14;--teal:#0B5C45;--teal-line:#34c79a;--teal-tint:#e7efe9;--amber:#E8922A;--clay:#c2691f;--amber-tint:#f8ead6;--parch:#f5f1e8;--paper:#fbfaf6;--line:#e4dccb;--tx:#0a0d14;--tx-soft:#3a4250;--tx-mut:#6b7280;
  background:var(--parch);color:var(--tx);font-family:'DM Sans',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;max-width:1080px;margin:0 auto;padding:34px 20px 60px}
.tm-wrap *{box-sizing:border-box;margin:0;padding:0}
.tm-wrap h1,.tm-wrap h3{font-family:'Syne',sans-serif;letter-spacing:-0.02em;line-height:1.05}
.tm-wrap a{text-decoration:none}
.tm-wrap b{font-weight:700}

.tm-hero{margin-bottom:26px}
.tm-brand{display:inline-flex;align-items:center;gap:7px;font-family:'Syne';font-weight:700;font-size:13px;letter-spacing:.04em;color:var(--teal);text-transform:uppercase;margin-bottom:14px}
.tm-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);box-shadow:0 0 0 3px rgba(232,146,42,.18)}
.tm-eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--clay)}
.tm-hero h1{font-size:clamp(42px,9vw,76px);font-weight:800;color:var(--ink);margin:6px 0 12px}
.tm-lede{max-width:70ch;font-size:16px;color:var(--tx-soft)}
.tm-lede b{color:var(--ink)}
.tm-ethic{display:inline-flex;align-items:center;gap:9px;margin-top:18px;background:var(--teal-tint);border:1px solid #a9d3c2;border-radius:99px;padding:8px 16px;font-size:13px;color:var(--tx-soft)}
.tm-ethic svg{color:var(--teal);flex:none}
.tm-ethic b{color:var(--teal)}

.tm-grid{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:720px){.tm-grid{grid-template-columns:1fr 1fr}}
.tm-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s,border-color .15s;display:flex;flex-direction:column}
.tm-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--c)}
.tm-card:hover{transform:translateY(-2px);box-shadow:0 18px 40px -26px rgba(10,13,20,.4);border-color:var(--c)}
.tm-card-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.tm-ic{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:12px;background:var(--tint);color:var(--c)}
.tm-card-top h3{font-size:22px;font-weight:800;color:var(--ink)}
.tm-ask{font-family:'Syne';font-weight:600;font-size:15px;color:var(--c);margin-bottom:9px;line-height:1.3}
.tm-blurb{font-size:13.5px;color:var(--tx-soft);line-height:1.55;margin-bottom:18px;flex:1}
.tm-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px}
.tm-btn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;font-family:'Syne';color:#fff;background:var(--ink);border:1px solid var(--ink);border-radius:10px;padding:9px 15px;transition:.14s}
.tm-btn:hover{background:var(--c);border-color:var(--c)}
.tm-btn svg{transition:transform .14s}
.tm-btn:hover svg{transform:translateX(2px)}
.tm-guide{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--tx-mut);padding:9px 6px;margin-left:auto}
.tm-guide:hover{color:var(--c)}

.tm-foot{margin-top:26px;border-top:1px solid var(--line);padding-top:18px}
.tm-foot-row{display:flex;flex-wrap:wrap;gap:18px;font-size:12.5px;font-weight:600;color:var(--teal)}
.tm-disc{font-size:11.5px;color:var(--tx-mut);line-height:1.6;margin-top:12px;max-width:90ch}

/* Unified ThinkMap hub and edition-tab readability. */
body .tm-wrap{background:#f5f1e8!important;color:#17324d!important}
body .tm-wrap .tm-hero h1{color:#0f172a!important}
body .tm-wrap .tm-lede,body .tm-wrap .tm-disc{color:#334155!important}
body .tm-wrap .tm-lede b{color:#0f172a!important}
body .tm-wrap .tm-ethic{
  background:#e7f4ef!important;border-color:#9bcbb9!important;color:#23483d!important
}
body .tm-wrap .tm-ethic b{color:#0b5c45!important}
body .tm-wrap .tm-grid .tm-card{
  background:#f8fbff!important;border:1px solid #bfd4e6!important;color:#17324d!important;
  box-shadow:0 12px 28px -22px rgba(23,50,77,.28)!important
}
body .tm-wrap .tm-grid .tm-card h3{color:#17324d!important}
body .tm-wrap .tm-grid .tm-card .tm-blurb{color:#334e68!important}
body .tm-wrap .tm-grid .tm-card .tm-ask{color:var(--c)!important}
body .tm-wrap .tm-grid .tm-card .tm-btn{
  background:#17324d!important;border-color:#17324d!important;color:#fff!important
}
body .tm-wrap .tm-grid .tm-card .tm-btn:hover{
  background:#0b5c45!important;border-color:#0b5c45!important;color:#fff!important
}
body .tm-wrap .tm-grid .tm-card .tm-guide{color:#3f5e77!important}
body .tm-wrap .tm-grid .tm-card .tm-guide:hover{color:#0b5c45!important}`;
