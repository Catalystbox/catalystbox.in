# ThinkMap — Integration & Deployment Guide

This package turns the four CatalystBox decision calculators into live pages under the
**ThinkMap** nav button on catalystbox.in. Everything here is front-end only — no backend,
no database, no user accounts. Hand this file (and the `.jsx` / `.html` files) to whoever
wires the repo, or to Antigravity / Claude Code.

---

## 1. What's in the package

| File | Becomes | Route |
|------|---------|-------|
| `thinkmap-landing.jsx` | The ThinkMap hub (the nav button opens this) | `/thinkmap` |
| `education-roi-v4.jsx` | Education ROI calculator | `/thinkmap/education-roi` |
| `margin-calculator-v2.jsx` | Margin calculator | `/thinkmap/margin` |
| `podium-india-v2.jsx` | Podium — India edition | `/thinkmap/podium-india` |
| `podium-global-v2.jsx` | Podium — Global edition | `/thinkmap/podium-global` |
| `exam-compass-india.jsx` | Exam Compass — India | `/thinkmap/exam-compass-india` |
| `exam-compass-world.jsx` | Exam Compass — World | `/thinkmap/exam-compass-world` |
| `how-to-use-the-calculator.html` | Education ROI guide | `/thinkmap/guides/education-roi` |
| `how-to-use-margin.html` | Margin guide | `/thinkmap/guides/margin` |
| `how-to-use-podium.html` | Podium guide | `/thinkmap/guides/podium` |
| `how-to-use-exam-compass.html` | Exam Compass guide | `/thinkmap/guides/exam-compass` |

`beyond-money-guide.html` is an optional companion to the Education guide — link it from
inside that guide or skip it.

---

## 2. Dependencies

The calculators use two packages. React is already in your app. Add the other:

```bash
npm install lucide-react
```

That's the only new dependency. No charts library is required for Exam Compass or Margin;
Podium and Education ROI use **recharts** — if not already installed:

```bash
npm install recharts
```

(Check `package.json` first — if `recharts` is already there, skip it.)

---

## 3. File placement

Put the calculator components in a `thinkmap` folder inside your `src`:

```
src/
  pages/
    thinkmap/
      ThinkMap.jsx              ← rename from thinkmap-landing.jsx
      EducationRoi.jsx          ← rename from education-roi-v4.jsx
      Margin.jsx                ← rename from margin-calculator-v2.jsx
      PodiumIndia.jsx           ← rename from podium-india-v2.jsx
      PodiumGlobal.jsx          ← rename from podium-global-v2.jsx
      ExamCompassIndia.jsx      ← rename from exam-compass-india.jsx
      ExamCompassWorld.jsx      ← rename from exam-compass-world.jsx
```

Each file already has `export default function ...` — so the internal component name does
**not** need changing; only the filename matters for the import. Put the four guide HTML
files in `public/thinkmap/guides/` so they're served as static pages (simplest path — see §6).

---

## 4. Routes

Add these to your router. Example with **react-router v6** (the most common Vite setup):

```jsx
import ThinkMap from "./pages/thinkmap/ThinkMap";
import EducationRoi from "./pages/thinkmap/EducationRoi";
import Margin from "./pages/thinkmap/Margin";
import PodiumIndia from "./pages/thinkmap/PodiumIndia";
import PodiumGlobal from "./pages/thinkmap/PodiumGlobal";
import ExamCompassIndia from "./pages/thinkmap/ExamCompassIndia";
import ExamCompassWorld from "./pages/thinkmap/ExamCompassWorld";

// inside <Routes>
<Route path="/thinkmap" element={<ThinkMap />} />
<Route path="/thinkmap/education-roi" element={<EducationRoi />} />
<Route path="/thinkmap/margin" element={<Margin />} />
<Route path="/thinkmap/podium-india" element={<PodiumIndia />} />
<Route path="/thinkmap/podium-global" element={<PodiumGlobal />} />
<Route path="/thinkmap/exam-compass-india" element={<ExamCompassIndia />} />
<Route path="/thinkmap/exam-compass-world" element={<ExamCompassWorld />} />
```

**Point the nav button at `/thinkmap`** (it currently opens the "Coming Soon" page — just
change that link's target).

**One small edit in `ThinkMap.jsx`:** the hub's card links use plain `<a href="...">`. If your
app uses react-router, swap them for `<Link to="...">` so navigation stays client-side and
instant. Find the `<a className="tm-btn"` and `<a className="tm-guide"` lines and convert them.
(Plain `<a>` still works — it just does a full page reload instead of an SPA transition.)

---

## 5. Fonts (small one-time tidy-up)

Each component imports Google Fonts (Syne, DM Sans, DM Mono) inside its CSS. That works, but
loading them once at the app level is cleaner and faster. Add this to your `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Optional: once that's in place you can delete the `@import url(...)` line at the top of each
component's CSS block. Not required — duplicate imports are harmless, just slightly wasteful.

**Note:** fonts load from Google's servers, so they don't count against your hosting bandwidth.

---

## 6. The guides

The four `how-to-use-*.html` files are complete standalone pages. Simplest approach:

1. Drop them in `public/thinkmap/guides/` renamed to match the routes, e.g.
   `public/thinkmap/guides/exam-compass.html`.
2. Link to them directly (`/thinkmap/guides/exam-compass.html`). They open as full pages.

If you'd rather they render inside your app shell (with your nav/footer), convert each to a
component that returns the HTML — but the static-file route is faster to ship and keeps them
self-contained. The hub's "How to use" links currently point at `/thinkmap/guides/<name>`;
adjust to `.html` if you go the static-file route.

---

## 7. Hosting — the one real decision

catalystbox.in is a **commercial site**, and it's about to be marketed to spike. That rules a
few things in and out:

- **GitHub Pages (current):** 100 GB/month soft bandwidth; throttles on a viral spike, and its
  terms disallow commercial/SaaS sites. Fine for now, risky for a launch.
- **Vercel Hobby (free):** also 100 GB and also non-commercial-only — and worse, it takes the
  site **offline** when the cap is hit. Not suitable for a commercial launch.
- **Vercel Pro ($20/mo) — recommended:** commercial use allowed, **1 TB** included (~4–5 million
  fresh visits/month for tools this size), overage at $0.15/GB, and a spend cap you can set so a
  freak traffic day can't surprise-bill you. You already run your dashboard on Vercel, so it's
  the same platform and the same git-push deploy flow.

**Recommendation:** move catalystbox.in to Vercel Pro before you market ThinkMap. Add the SPA
rewrite so deep links like `/thinkmap/podium-india` resolve — create `vercel.json` at the repo root:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 8. Why this is safe at scale (the short version)

- Every calculator runs **entirely in the visitor's browser** — no server compute per user, no
  shared state, no backend. Users cannot affect each other; concurrency is unlimited by design.
- The calculators store **nothing** — no `localStorage`, no cookies, no analytics, no API calls.
  This preserves the site's existing "zero tracking, zero PII" privacy promise. Nothing new to
  disclose in the privacy policy.
- Scale is a **bandwidth** question, not a concurrency one, and these files are small (~200 KB
  first load, near-zero on repeat visits). Bandwidth is the only meter, and it's generous.

---

## 9. Editing & upgrading later — seamless by design

Because there's no user data, no accounts, and no database, changing a calculator is just:

1. Edit the component file.
2. `git push`.
3. Vercel rebuilds and redeploys in ~1 minute.

Vite fingerprints every built file with a content hash (e.g. `ExamCompassIndia.a1b2c3.js`), so
visitors automatically get the new version on their next load — **no cache-clearing, no
migration, no downtime.** You can also open a Vercel **preview URL** for any edit and check it
live before it reaches real users. Ship confidently, roll back trivially (revert the commit).

---

## 10. Suggested ship order

1. Move hosting to Vercel Pro + add `vercel.json` rewrite.
2. `npm install lucide-react` (and `recharts` if missing).
3. Drop in the seven `.jsx` files under `src/pages/thinkmap/`.
4. Add the seven routes; point the nav button at `/thinkmap`.
5. Add the fonts `<link>` to `index.html`.
6. Drop the four guide HTMLs into `public/thinkmap/guides/`.
7. Convert the hub's `<a>` links to `<Link>` (if using react-router).
8. Deploy, click through every route on mobile, and you're live.

---

*No agenda in the output. All agency in the decision.*
