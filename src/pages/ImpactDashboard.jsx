import { useState, useEffect, useCallback, useRef } from "react";

/* ── FONTS ────────────────────────────────────────────────────────────────── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ── SUPABASE CONFIG ──────────────────────────────────────────────────────── */
const SB_URL = "https://xuxgzrxbwstnlkuejuhj.supabase.co";

async function sbCount(table, filter = "", key) {
  if (!key) return null;
  try {
    const url = `${SB_URL}/rest/v1/${table}?${filter}${filter ? "&" : ""}head=true`;
    const r = await fetch(url, {
      method: "HEAD",
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }
    });
    const cr = r.headers.get("content-range");
    return cr ? parseInt(cr.split("/")[1]) : 0;
  } catch { return null; }
}

async function sbQuery(table, select, filter = "", key) {
  if (!key) return null;
  try {
    const url = `${SB_URL}/rest/v1/${table}?select=${select}${filter ? "&" + filter : ""}`;
    const r = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/* ── METRICS MASTER DATA ─────────────────────────────────────────────────── */
// type: "auto" = fetched from Supabase | "derived" = calculated from auto values
//       "trix" = comes from Apps Script / Google Sheets | "manual" = field/external input
// liveKey: maps to a live value fetched in useLiveData

const SHARED_FORMULAS = {
  SEI: {
    formula: "SEI = (Σ Q1…Q8 per student) ÷ (n × 8 × 5) × 100",
    sql: `SELECT school_code,\n  ROUND(\n    AVG((q1+q2+q3+q4+q5+q6+q7+q8) / 40.0 * 100), 1\n  ) AS sei\nFROM feedback_responses\nWHERE stakeholder_type = 'student'\n  AND is_complete = true\nGROUP BY school_code;`,
    note: "Q1–Q8 are 1–5 Likert scale. Max per response = 40. Normalize to 0–100."
  },
  TEI: {
    formula: "TEI = (0.6 × Student_Teaching_Avg + 0.4 × Teacher_Self_Avg) × 100",
    sql: `-- Student perception component (questions 6–10, 1–5 scale):\nSELECT school_code,\n  AVG((q6+q7+q8+q9+q10)/25.0*100) AS student_tei\nFROM feedback_responses\nWHERE stakeholder_type='student' AND is_complete=true\nGROUP BY school_code;\n\n-- Teacher self-report component (all teacher form questions):\nSELECT school_code,\n  AVG(total_score/max_score*100) AS teacher_tei\nFROM teacher_responses WHERE is_complete=true\nGROUP BY school_code;\n\n-- Final TEI:\nSELECT s.school_code,\n  ROUND(student_tei*0.6 + teacher_tei*0.4, 1) AS tei\nFROM student_tei s JOIN teacher_tei t USING(school_code);`,
    note: "Cross-validated from two sources. Q6–Q10 from student form measure teaching quality."
  },
  PTI: {
    formula: "PTI = (Σ all parent form responses) ÷ (n × n_questions × 5) × 100",
    sql: `SELECT school_code,\n  ROUND(\n    AVG(total_score / (num_questions * 5.0) * 100), 1\n  ) AS pti\nFROM parent_responses\nWHERE is_complete = true\nGROUP BY school_code;`,
    note: "Derived from all parent form questions on 1–5 scale."
  },
  CBI: {
    formula: "CBI = SEI × 0.45 + TEI × 0.30 + PTI × 0.25",
    sql: `WITH sei AS (SELECT school_code, ROUND(AVG((q1+q2+q3+q4+q5+q6+q7+q8)/40.0*100),1) AS v FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code),\ntei AS (/* see TEI formula */),\npti AS (/* see PTI formula */)\nSELECT s.school_code,\n  ROUND(s.v*0.45 + t.v*0.30 + p.v*0.25, 1) AS cbi\nFROM sei s JOIN tei t USING(school_code) JOIN pti p USING(school_code);`,
    note: "Weights: SEI 45% / TEI 30% / PTI 25%. Minimum 50 submissions per school required."
  },
  CBI_DELTA: {
    formula: "CBI Delta = CBI_current − CBI_baseline",
    sql: `SELECT school_code,\n  cbi_current - cbi_baseline AS delta,\n  CASE WHEN cbi_current > cbi_baseline THEN 'improved'\n       WHEN cbi_current < cbi_baseline THEN 'declined'\n       ELSE 'stable' END AS status\nFROM school_cbi_scores\nORDER BY delta DESC;`,
    note: "Baseline = CBI at first 50+ submissions. Current = latest full-cycle CBI."
  },
  COMPLETION_RATE: {
    formula: "Completion Rate = (Completed Submissions ÷ Total QR Scans) × 100",
    sql: `SELECT\n  ROUND(\n    COUNT(CASE WHEN is_complete THEN 1 END)::decimal /\n    NULLIF((SELECT COUNT(*) FROM qr_scan_events), 0) * 100, 1\n  ) AS completion_rate\nFROM feedback_responses;`,
    note: "A scan = QR code opened. A submission = form completed and submitted."
  },
  SAFETY_FLAGS: {
    formula: "Flag Rate = (AI-flagged submissions ÷ total submissions) × 100",
    sql: `SELECT school_code,\n  COUNT(CASE WHEN ai_flags->>'safety' = 'true' THEN 1 END) AS flags,\n  COUNT(*) AS total,\n  ROUND(COUNT(CASE WHEN ai_flags->>'safety'='true' THEN 1 END)::decimal/COUNT(*)*100,1) AS flag_rate\nFROM feedback_responses\nWHERE stakeholder_type = 'student'\nGROUP BY school_code\nORDER BY flag_rate DESC;`,
    note: "ai_flags JSONB column populated by Gemini NLP via Apps Script pipeline."
  },
  MH_SIGNAL: {
    formula: "MH Signal Rate = (submissions with MH keywords ÷ student submissions) × 100",
    sql: `SELECT school_code,\n  ROUND(\n    COUNT(CASE WHEN ai_flags->>'mental_health'='true' THEN 1 END)::decimal /\n    NULLIF(COUNT(*), 0) * 100, 1\n  ) AS mh_signal_rate\nFROM feedback_responses\nWHERE stakeholder_type = 'student' AND is_complete = true\nGROUP BY school_code;`,
    note: "MH keywords detected by Gemini NLP. Stored in ai_flags JSONB. Source: Trix → Supabase sync."
  },
  ACTIVE_SCHOOL_RATE: {
    formula: "Active Rate = (schools with ≥50 submissions in period ÷ total onboarded) × 100",
    sql: `SELECT\n  ROUND(\n    COUNT(DISTINCT CASE WHEN cnt >= 50 THEN school_code END)::decimal /\n    NULLIF((SELECT COUNT(*) FROM school_directory WHERE is_pilot=true), 0) * 100, 1\n  ) AS active_rate\nFROM (\n  SELECT school_code, COUNT(*) AS cnt\n  FROM feedback_responses\n  WHERE is_complete=true\n    AND created_at >= CURRENT_DATE - INTERVAL '90 days'\n  GROUP BY school_code\n) s;`,
    note: "Active = at least 50 completed submissions in the current quarter."
  },
  TEACHER_RESPONSE_RATE: {
    formula: "Response Rate = (teacher submissions ÷ estimated teacher count) × 100\nEstimated teacher count = enrolled_students ÷ 30",
    sql: `SELECT\n  f.school_code,\n  COUNT(DISTINCT f.id) AS teacher_submissions,\n  ROUND(s.enrollment / 30.0) AS est_teachers,\n  ROUND(COUNT(DISTINCT f.id) / NULLIF(ROUND(s.enrollment/30.0),0) * 100, 1) AS response_rate\nFROM feedback_responses f\nJOIN school_directory s USING(school_code)\nWHERE f.stakeholder_type = 'teacher' AND f.is_complete = true\n  AND f.created_at >= CURRENT_DATE - INTERVAL '180 days'\nGROUP BY f.school_code, s.enrollment;`,
    note: "Estimated teacher count based on standard 1:30 teacher-student ratio from UDISE+ enrolment."
  },
  PARENT_RESPONSE_RATE: {
    formula: "Rate = (parent submissions ÷ (enrolled_students × 0.7)) × 100",
    sql: `SELECT f.school_code,\n  COUNT(*) AS parent_subs,\n  ROUND(s.enrollment * 0.7) AS est_parents,\n  ROUND(COUNT(*)::decimal / NULLIF(ROUND(s.enrollment*0.7),0) * 100, 1) AS rate\nFROM feedback_responses f\nJOIN school_directory s USING(school_code)\nWHERE f.stakeholder_type = 'parent' AND f.is_complete = true\nGROUP BY f.school_code, s.enrollment;`,
    note: "0.7 parents per student is standard UDISE+ assumption for household coverage."
  },
  ISSUE_RESOLUTION: {
    formula: "Resolution Rate = (flags with action logged ÷ total flags raised) × 100",
    sql: `-- Requires school_action_log table (maintained by field team)\nSELECT\n  ROUND(\n    COUNT(CASE WHEN action_taken = true THEN 1 END)::decimal /\n    NULLIF(COUNT(*), 0) * 100, 1\n  ) AS resolution_rate\nFROM school_action_log\nWHERE flag_type IN ('safety', 'bullying', 'infrastructure')\n  AND created_at >= CURRENT_DATE - INTERVAL '90 days';`,
    note: "Field team logs school actions in school_action_log table. Manual entry required."
  },
  NEP_SCORE: {
    formula: "NEP Readiness = (SEI×0.25 + TEI×0.25 + PTI×0.20 + Digital×0.15 + Future×0.15) normalized to 100",
    sql: `-- Map CBI components to NEP dimensions:\n-- NEP 4.6 → SEI (wellbeing)\n-- NEP 7.6 → TEI (teacher quality)\n-- NEP 2.7 → PTI (parent engagement)\n-- NEP 12.3 → Future Readiness sub-index\n-- NEP 5.4 → Learning environment (from Q6–Q8 infrastructure)\nSELECT school_code,\n  CASE\n    WHEN nep_score >= 80 THEN 'Leading'\n    WHEN nep_score >= 60 THEN 'Compliant'\n    WHEN nep_score >= 40 THEN 'Developing'\n    ELSE 'Below'\n  END AS nep_band,\n  nep_score\nFROM school_nep_scores\nORDER BY nep_score DESC;`,
    note: "NEP Readiness is derived from CBI with NEP-specific dimension weighting."
  }
};

const FUNDER_DATA = [
  {
    id: "tcs", name: "TCS Foundation", ask: "₹75L", period: "12 months", schools: 50,
    color: "#0B5C45", accent: "#1aada7",
    note: "6 metric categories. Primary focus: CBI improvement + student wellbeing.",
    categories: [
      { name: "Reach Metrics", freq: "QUARTERLY", metrics: [
        { name: "Schools Onboarded", type: "auto", liveKey: "schools_onboarded", unit: "schools", target: "50 by Q1", formula: "COUNT(*) FROM school_directory WHERE is_pilot = TRUE", sql: "SELECT COUNT(*) FROM school_directory WHERE is_pilot = true;", source: "school_directory.is_pilot", note: "Increments each time is_pilot flag is set to TRUE on school activation." },
        { name: "QR Scans Total", type: "auto", liveKey: "qr_scans", unit: "scans", target: "≥10,000 / quarter", formula: "COUNT(*) FROM qr_scan_events WHERE period", sql: "SELECT COUNT(*) FROM qr_scan_events\nWHERE scan_timestamp >= '2026-04-01';", source: "qr_scan_events", note: "Each QR code open = 1 scan event, regardless of whether form was completed." },
        { name: "Feedback Submissions", type: "auto", liveKey: "submissions_total", unit: "submissions", target: "≥7,000 / quarter", formula: "COUNT(*) FROM feedback_responses WHERE is_complete = TRUE AND period", sql: "SELECT COUNT(*) FROM feedback_responses\nWHERE is_complete = true\n  AND created_at >= '2026-04-01';", source: "feedback_responses.is_complete", note: "Only counts completed form submissions, not partial/abandoned responses." },
        { name: "Completion Rate", type: "derived", liveKey: "completion_rate", unit: "%", target: "≥70%", ...SHARED_FORMULAS.COMPLETION_RATE },
        { name: "Stakeholder Type Split", type: "auto", liveKey: "stakeholder_split", unit: "%", target: "60% students / 25% teachers / 15% parents", formula: "COUNT(type) ÷ Total submissions × 100 per type", sql: "SELECT stakeholder_type,\n  COUNT(*) AS n,\n  ROUND(COUNT(*)::decimal / SUM(COUNT(*)) OVER() * 100, 1) AS pct\nFROM feedback_responses WHERE is_complete=true\nGROUP BY stakeholder_type;", source: "feedback_responses.stakeholder_type", note: "Role is captured at the start of the form via branching logic. No PII linked." },
        { name: "Active School Rate", type: "derived", liveKey: "active_school_rate", unit: "%", target: "≥90% of schools per quarter", ...SHARED_FORMULAS.ACTIVE_SCHOOL_RATE },
      ]},
      { name: "CBI Score Improvement", freq: "BI-ANNUAL", metrics: [
        { name: "CBI Baseline Score", type: "derived", liveKey: "cbi_avg", unit: "/100 (avg)", target: "Baseline for all 50 schools by Q1", ...SHARED_FORMULAS.CBI },
        { name: "CBI Mid-Year Score", type: "derived", liveKey: "cbi_avg", unit: "/100", target: "Generated for ≥45/50 schools", ...SHARED_FORMULAS.CBI, note: "Requires min. 100 cumulative submissions per school. Same formula as baseline — recalculated at Month 6." },
        { name: "CBI Year-End Score & Delta", type: "derived", unit: "delta pts", target: "≥60% schools show +ve delta", ...SHARED_FORMULAS.CBI_DELTA },
        { name: "Issue Resolution Rate", type: "manual", unit: "%", target: "≥60% by Q3", ...SHARED_FORMULAS.ISSUE_RESOLUTION },
      ]},
      { name: "Student Wellbeing (SEI)", freq: "QUARTERLY", metrics: [
        { name: "Student Experience Index (SEI)", type: "derived", liveKey: "sei_avg", unit: "/100 (avg)", target: "≥65 avg across pilot schools", ...SHARED_FORMULAS.SEI },
        { name: "Bullying / Safety Flags", type: "trix", liveKey: "safety_flags", unit: "flags/quarter", target: "20% reduction vs. baseline by Q4", ...SHARED_FORMULAS.SAFETY_FLAGS },
        { name: "Mental Health Signal Rate", type: "trix", unit: "%", target: "Baseline Q1; alerts above 15%", ...SHARED_FORMULAS.MH_SIGNAL },
        { name: "Student Safety Score Trend", type: "derived", unit: "score (moving avg)", target: "Positive trend in ≥70% of schools", formula: "Safety Score = AVG(Q3, Q5, Q7) per school, 3-month rolling average", sql: "SELECT school_code, month,\n  AVG(AVG((q3+q5+q7)/15.0*100)) OVER (\n    PARTITION BY school_code\n    ORDER BY month\n    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n  ) AS safety_score_trend\nFROM monthly_student_scores\nORDER BY school_code, month;", source: "feedback_responses (Q3, Q5, Q7)", note: "Q3=safety at school, Q5=peer relations, Q7=feeling heard. 1–5 scale each." },
      ]},
      { name: "Teacher Effectiveness (TEI)", freq: "BI-ANNUAL", metrics: [
        { name: "Teacher Effectiveness Index (TEI)", type: "derived", liveKey: "tei_avg", unit: "/100 (avg)", target: "≥60 across pilot schools", ...SHARED_FORMULAS.TEI },
        { name: "Teacher Response Rate", type: "derived", unit: "%", target: "≥50% per school", ...SHARED_FORMULAS.TEACHER_RESPONSE_RATE },
        { name: "Professional Support Score", type: "auto", unit: "/100", target: "≥10% improvement in bottom quartile by S2", formula: "Support Score = AVG(teacher_form Q4, Q5, Q6) × 100/15", sql: "SELECT school_code,\n  ROUND(AVG((q4+q5+q6)/15.0*100), 1) AS support_score\nFROM teacher_responses WHERE is_complete=true\nGROUP BY school_code;", source: "teacher_responses (Q4-Q6)", note: "Q4=PD access, Q5=resource quality, Q6=peer support. 1–5 each. Max=15." },
      ]},
      { name: "Policy & Systemic Impact", freq: "ANNUAL", metrics: [
        { name: "Education Board Engagements", type: "manual", unit: "meetings/MOUs", target: "≥2 formal engagements by year-end", formula: "Manual count. Log in programme_engagements table.", sql: "SELECT COUNT(*) FROM programme_engagements\nWHERE engagement_type IN ('meeting','MOU','data_submission')\n  AND counterparty_type = 'education_board'\n  AND created_at >= '2026-04-01';", source: "programme_engagements (manual entry)", note: "Field team logs each engagement. Store: date, counterparty, type, outcome, document_ref." },
        { name: "Intelligence Briefs Submitted", type: "manual", unit: "briefs", target: "1 to CBSE + 1 per state board by Mar 2027", formula: "COUNT(*) FROM policy_briefs WHERE submitted = TRUE", sql: "SELECT COUNT(*) FROM policy_briefs\nWHERE submitted = true AND submission_ack_received = true;", source: "policy_briefs (manual entry)", note: "Log brief title, co-funder, submission date, acknowledgement receipt date." },
        { name: "Third-Party Evaluation Score", type: "manual", unit: "/10 (rubric)", target: "'Satisfactory' or above on all dimensions", formula: "Rubric-based score from independent evaluator. Manual entry.", sql: "SELECT dimension, score, evaluator, evaluation_date\nFROM evaluation_scores\nWHERE evaluation_type = 'third_party'\nORDER BY evaluation_date DESC;", source: "evaluation_scores (manual entry)", note: "Evaluator scores platform methodology. Store raw rubric scores per dimension." },
      ]},
      { name: "Platform & Security", freq: "MONTHLY", metrics: [
        { name: "Platform Uptime %", type: "manual", unit: "%", target: "≥99.5% during school hours", formula: "Uptime % = (total_school_hours − downtime_mins/60) ÷ total_school_hours × 100", sql: "SELECT ROUND(\n  (1 - SUM(downtime_minutes)::decimal /\n   NULLIF(SUM(total_school_hours)*60, 0)) * 100, 2\n) AS uptime_pct\nFROM server_uptime_log\nWHERE month = DATE_TRUNC('month', CURRENT_DATE);", source: "server_uptime_log (from AWS CloudWatch or cron-job.org logs)", note: "School hours = 8am–5pm IST Mon–Sat. Import from monitoring tool. Supabase keep-alive via cron-job.org." },
        { name: "DPDP Act Compliance Status", type: "manual", unit: "pass/fail per checkpoint", target: "Zero PII incidents", formula: "12-point checklist. Pass = 12/12. Any fail = non-compliant.", sql: "SELECT COUNT(*) FILTER (WHERE status='pass') AS passed,\n  COUNT(*) FILTER (WHERE status='fail') AS failed,\n  BOOL_AND(status='pass') AS fully_compliant\nFROM dpdp_compliance_checks\nWHERE check_date >= CURRENT_DATE - INTERVAL '90 days';", source: "dpdp_compliance_checks (quarterly audit log)", note: "12 DPDP 2023 checkpoints reviewed by FEF legal advisor. Log each: checkpoint, status, date, reviewer." },
        { name: "Data Security Audit Status", type: "manual", unit: "audit status", target: "Clean audit by Q4 2026", formula: "Annual pen test + architecture review. Binary: Clean / Critical findings.", sql: "SELECT audit_date, auditor, critical_findings, status\nFROM security_audits\nORDER BY audit_date DESC LIMIT 1;", source: "security_audits (annual entry)", note: "Third-party auditor. Store: test date, auditor name, findings count by severity, remediation status." },
      ]},
    ]
  },

  {
    id: "infosys", name: "Infosys Foundation", ask: "₹50L", period: "12 months", schools: 30,
    color: "#1a3a6e", accent: "#3b82f6",
    note: "5 categories. Primary focus: dropout prevention + girl student retention.",
    categories: [
      { name: "Dropout Risk (Primary)", freq: "QUARTERLY", metrics: [
        { name: "Disengagement Proxy Score", type: "derived", unit: "/100 (school avg)", target: "<15% students in 'high-risk' band by Q4", formula: "DPS = AVG(Q2, Q4, Q9, Q11) per student × 100/20; school avg of all DPS", sql: "SELECT school_code,\n  ROUND(AVG((q2+q4+q9+q11)/20.0*100), 1) AS avg_dps,\n  COUNT(CASE WHEN (q2+q4+q9+q11)/20.0*100 < 40 THEN 1 END) AS high_risk_n,\n  ROUND(COUNT(CASE WHEN (q2+q4+q9+q11)/20.0*100 < 40 THEN 1 END)::decimal/COUNT(*)*100,1) AS high_risk_pct\nFROM feedback_responses\nWHERE stakeholder_type='student' AND is_complete=true\nGROUP BY school_code;", source: "feedback_responses (Q2, Q4, Q9, Q11)", note: "Q2=academic motivation, Q4=attendance intent, Q9=peer belonging, Q11=willingness to return. Below 40 = high-risk." },
        { name: "Disengagement Rate Trend", type: "derived", unit: "trend direction", target: "≥60% schools improving by Q3", formula: "Month-on-month delta of DPS. Trend = current_month_DPS − prev_month_DPS\nSustained improvement = 3 consecutive months of positive delta", sql: "SELECT school_code, month,\n  avg_dps - LAG(avg_dps) OVER (PARTITION BY school_code ORDER BY month) AS monthly_delta,\n  CASE\n    WHEN avg_dps - LAG(avg_dps) OVER (PARTITION BY school_code ORDER BY month) > 0 THEN 'improving'\n    WHEN avg_dps - LAG(avg_dps) OVER (PARTITION BY school_code ORDER BY month) < 0 THEN 'declining'\n    ELSE 'stable'\n  END AS trend\nFROM monthly_dps\nORDER BY school_code, month;", source: "Derived from monthly DPS aggregation", note: "Positive delta = DPS improving (students more engaged). Flag 3+ consecutive months." },
        { name: "High-Risk Student Cohort %", type: "derived", unit: "%", target: "<15% by Q4", formula: "High-Risk % = (students with DPS < 40 ÷ total student submissions) × 100", sql: "SELECT school_code,\n  ROUND(COUNT(CASE WHEN (q2+q4+q9+q11)/20.0*100 < 40 THEN 1 END)::decimal / NULLIF(COUNT(*),0)*100, 1) AS high_risk_pct\nFROM feedback_responses\nWHERE stakeholder_type='student' AND is_complete=true\nGROUP BY school_code;", source: "feedback_responses (Q2, Q4, Q9, Q11)", note: "DPS < 40/100 = high dropout risk. No individual student identified — school-level aggregate only." },
        { name: "Dropout Risk Correlation Study", type: "manual", unit: "Pearson r", target: "r ≥ 0.5", formula: "r = Pearson correlation(avg DPS per school, avg attendance rate per school)\nCalculated at year-end by third-party evaluator.", sql: "-- Requires school attendance data (aggregated from schools):\nSELECT CORR(avg_dps, attendance_rate) AS pearson_r\nFROM (\n  SELECT s.school_code, s.avg_dps, a.attendance_rate\n  FROM school_dps_scores s\n  JOIN school_attendance_summary a USING(school_code)\n) corr_data;", source: "CatalystBox DPS + school_attendance_summary (from school records)", note: "School provides aggregate attendance rate. No individual student data. Third-party evaluator runs correlation." },
      ]},
      { name: "Girl Student Experience", freq: "QUARTERLY", metrics: [
        { name: "Girl Student SEI Score", type: "derived", unit: "/100", target: "Gender gap narrows ≥10 pts by Q4", formula: "Girl SEI = AVG(Q1..Q8 for gender='girl') × 100/40\nGender Gap = Overall SEI − Girl SEI", sql: "SELECT school_code,\n  ROUND(AVG(CASE WHEN form_data->>'gender'='girl' THEN (q1+q2+q3+q4+q5+q6+q7+q8)/40.0*100 END),1) AS girl_sei,\n  ROUND(AVG((q1+q2+q3+q4+q5+q6+q7+q8)/40.0*100),1) AS overall_sei,\n  ROUND(AVG((q1+q2+q3+q4+q5+q6+q7+q8)/40.0*100),1) - ROUND(AVG(CASE WHEN form_data->>'gender'='girl' THEN (q1+q2+q3+q4+q5+q6+q7+q8)/40.0*100 END),1) AS gender_gap\nFROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (gender field + Q1–Q8)", note: "Gender is first form question. Disaggregated in analytics engine. No individual ID." },
        { name: "Safety Score: Girls vs. Overall", type: "derived", unit: "gap pts", target: "Zero schools with girls >20 pts below overall", formula: "Girl Safety Gap = AVG(Q3+Q5 for gender='girl')/10×100 − AVG(Q3+Q5 all)/10×100", sql: "SELECT school_code,\n  ROUND(AVG(CASE WHEN form_data->>'gender'='girl' THEN (q3+q5)/10.0*100 END),1) AS girl_safety,\n  ROUND(AVG((q3+q5)/10.0*100),1) AS overall_safety,\n  ROUND(AVG((q3+q5)/10.0*100),1) - ROUND(AVG(CASE WHEN form_data->>'gender'='girl' THEN (q3+q5)/10.0*100 END),1) AS safety_gap\nFROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (gender + Q3, Q5)", note: "Q3=safety at school, Q5=peer safety. Flag if girl safety >15 pts below overall." },
        { name: "Harassment Signal Rate by Gender", type: "trix", unit: "%", target: "25% reduction in girl harassment signals by Q4", ...SHARED_FORMULAS.SAFETY_FLAGS, formula: "Rate = (harassment-flagged girl submissions ÷ girl submissions) × 100", sql: "SELECT school_code,\n  ROUND(COUNT(CASE WHEN ai_flags->>'harassment'='true' AND form_data->>'gender'='girl' THEN 1 END)::decimal / NULLIF(COUNT(CASE WHEN form_data->>'gender'='girl' THEN 1 END),0)*100, 1) AS girl_harassment_rate\nFROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", note: "NLP flag 'harassment' set by Gemini in Apps Script. Stored in ai_flags JSONB." },
        { name: "Parent Awareness of Girl Safety", type: "derived", unit: "/100", target: "PTI safety sub-score ≥55/100", formula: "Girl Safety Awareness = AVG(parent_form Q_safety_girls) × 100/max_score", sql: "SELECT school_code,\n  ROUND(AVG(form_data->>'q_safety_girls'::int) / 5.0 * 100, 1) AS parent_girl_safety_score\nFROM feedback_responses\nWHERE stakeholder_type='parent' AND is_complete=true\nGROUP BY school_code;", source: "feedback_responses (parent form, girl safety questions)", note: "Parent form has dedicated girl safety questions. Aggregate at school level only." },
      ]},
      { name: "Safety & Environment", freq: "QUARTERLY", metrics: [
        { name: "Student Experience Index (SEI)", type: "derived", liveKey: "sei_avg", unit: "/100", target: "≥60 avg; ≥70% schools above 50", ...SHARED_FORMULAS.SEI },
        { name: "Bullying Flag Rate", type: "trix", unit: "flags/quarter", target: "25% reduction by Q4", ...SHARED_FORMULAS.SAFETY_FLAGS },
        { name: "Mental Health Signal Trend", type: "trix", unit: "% / month", target: "Stable or declining in ≥70% of schools", ...SHARED_FORMULAS.MH_SIGNAL },
        { name: "Infrastructure Complaint Rate", type: "trix", unit: "%", target: "Top 5 issues per school identified in Q1", formula: "Infra Rate = (submissions mentioning infra topics ÷ total submissions) × 100", sql: "SELECT school_code, topic_tag,\n  COUNT(*) AS n,\n  ROUND(COUNT(*)::decimal / SUM(COUNT(*)) OVER (PARTITION BY school_code)*100,1) AS pct\nFROM ai_topic_tags\nWHERE topic IN ('toilet','water','classroom','infrastructure','facility')\nGROUP BY school_code, topic_tag\nORDER BY school_code, n DESC;", source: "ai_topic_tags (NLP topic extraction from open responses)", note: "Gemini extracts infrastructure topic tags from open-text responses. Stored in ai_topic_tags table." },
      ]},
      { name: "Teacher Effectiveness (TEI)", freq: "BI-ANNUAL", metrics: [
        { name: "Teacher Effectiveness Index (TEI)", type: "derived", liveKey: "tei_avg", unit: "/100", target: "≥58 avg across pilot schools", ...SHARED_FORMULAS.TEI },
        { name: "Teacher Support Score", type: "auto", unit: "/100", target: "≥55 by S2", formula: "Support Score = AVG(teacher_form Q4, Q5, Q6) × 100/15", sql: "SELECT school_code, ROUND(AVG((q4+q5+q6)/15.0*100),1) AS support_score FROM teacher_responses WHERE is_complete=true GROUP BY school_code;", source: "teacher_responses (Q4–Q6)", note: "Q4=PD access, Q5=resources, Q6=peer support. Aggregated at school level." },
        { name: "Pedagogy Quality Indicators", type: "derived", unit: "/100", target: "Positive trend in ≥65% of schools", formula: "Pedagogy Score = AVG(Q6, Q8, Q10 from student form) × 100/15", sql: "SELECT school_code,\n  ROUND(AVG((q6+q8+q10)/15.0*100), 1) AS pedagogy_score\nFROM feedback_responses\nWHERE stakeholder_type='student' AND is_complete=true\nGROUP BY school_code;", source: "feedback_responses (student, Q6, Q8, Q10)", note: "Q6=clarity of explanation, Q8=use of examples, Q10=encouragement of questions." },
      ]},
      { name: "Reach & CSR Reporting", freq: "QUARTERLY + ANNUAL", metrics: [
        { name: "Total Submissions", type: "auto", liveKey: "submissions_total", unit: "submissions", target: "≥15,000 across 30 schools", formula: "COUNT(*) FROM feedback_responses WHERE is_complete=TRUE AND period", sql: "SELECT COUNT(*) FROM feedback_responses WHERE is_complete=true AND created_at >= '2026-04-01';", source: "feedback_responses", note: "Cumulative count. Reset per academic year for annual reporting." },
        { name: "Geographic Coverage", type: "auto", unit: "schools per state", target: "10 schools per state (KA/BR/DL)", formula: "COUNT(school_code) GROUP BY state", sql: "SELECT sd.state, COUNT(*) AS active_schools FROM school_directory sd JOIN (SELECT DISTINCT school_code FROM feedback_responses WHERE is_complete=true) f ON sd.cb_code=f.school_code WHERE sd.is_pilot=true GROUP BY sd.state;", source: "school_directory.state + feedback_responses", note: "State derived from CB code (CB-BOARD-STATE-SEQ)." },
        { name: "MCA Schedule VII Data", type: "manual", unit: "compiled dataset", target: "Filed by 31 May annually", formula: "Beneficiary count = SUM(school_enrollment) for all active pilot schools\nSpend utilised = financial records from FEF accounts\nActivity category = 'Education' (Schedule VII item)", sql: "SELECT SUM(enrollment) AS total_beneficiaries,\n  COUNT(DISTINCT cb_code) AS schools\nFROM school_directory\nWHERE is_pilot = true;", source: "school_directory.enrollment + FEF financial records", note: "FEF finance team compiles annually. CA reviews. Submit by 31 May each year." },
      ]},
    ]
  },

  {
    id: "hdfc", name: "HDFC Bank Parivartan", ask: "₹1 Cr", period: "12 months", schools: 100,
    color: "#7c2d12", accent: "#f97316",
    note: "6 categories. MCA + SDG 4 + NEP 2020 reporting. Smart class correlation.",
    categories: [
      { name: "Platform Reach", freq: "QUARTERLY", metrics: [
        { name: "Schools Active", type: "auto", liveKey: "schools_onboarded", unit: "schools", target: "100 by Q1; ≥95 active each quarter", ...{ formula: "COUNT(schools with ≥50 submissions in quarter)", sql: "SELECT COUNT(DISTINCT school_code) FROM (SELECT school_code, COUNT(*) FROM feedback_responses WHERE is_complete=true AND created_at >= CURRENT_DATE - INTERVAL '90 days' GROUP BY school_code HAVING COUNT(*)>=50) s;", source: "feedback_responses", note: "Active = ≥50 completed submissions in reporting quarter." } },
        { name: "Total QR Scans", type: "auto", liveKey: "qr_scans", unit: "scans", target: "≥25,000 / quarter", formula: "COUNT(*) FROM qr_scan_events AND state IN (MH, UP, KA)", sql: "SELECT sd.state, COUNT(q.*) FROM qr_scan_events q JOIN school_directory sd ON q.school_code=sd.cb_code WHERE sd.is_pilot=true GROUP BY sd.state;", source: "qr_scan_events + school_directory.state", note: "" },
        { name: "Total Submissions", type: "auto", liveKey: "submissions_total", unit: "submissions", target: "≥18,000/quarter; completion ≥72%", formula: "COUNT(*) WHERE is_complete=TRUE", sql: "SELECT COUNT(*) FROM feedback_responses WHERE is_complete=true AND created_at>=CURRENT_DATE-INTERVAL '90 days';", source: "feedback_responses", note: "" },
        { name: "State-wise Distribution", type: "auto", unit: "schools per state", target: "~33 schools per state", formula: "COUNT(schools) GROUP BY state", sql: "SELECT sd.state, COUNT(DISTINCT f.school_code), COUNT(f.*) AS submissions FROM feedback_responses f JOIN school_directory sd ON f.school_code=sd.cb_code WHERE sd.is_pilot=true GROUP BY sd.state;", source: "school_directory.state", note: "" },
      ]},
      { name: "CBI Score Improvement", freq: "BI-ANNUAL", metrics: [
        { name: "CBI Baseline", type: "derived", liveKey: "cbi_avg", unit: "/100", target: "All 100 schools by Q1", ...SHARED_FORMULAS.CBI },
        { name: "CBI Mid-Year & Year-End Delta", type: "derived", unit: "delta pts", target: "≥65% schools positive delta; avg delta ≥+5 pts", ...SHARED_FORMULAS.CBI_DELTA },
        { name: "Smart Class Correlation", type: "manual", unit: "correlation coefficient", target: "Higher CBI in smart-class schools vs. non", formula: "Point-biserial correlation: r_pb = (M1−M0)/SD × √(n1×n0/(N²))\nWhere M1=avg CBI smart-class schools, M0=avg CBI non-smart-class", sql: "SELECT\n  AVG(CASE WHEN parivartan_smart_class=true THEN cbi END) AS smart_class_cbi,\n  AVG(CASE WHEN parivartan_smart_class=false THEN cbi END) AS non_smart_cbi,\n  AVG(CASE WHEN parivartan_smart_class=true THEN cbi END) - AVG(CASE WHEN parivartan_smart_class=false THEN cbi END) AS cbi_difference\nFROM school_cbi_scores s\nJOIN school_directory sd USING(school_code);", source: "school_cbi_scores + school_directory.parivartan_smart_class", note: "Requires parivartan_smart_class boolean added to school_directory at onboarding." },
      ]},
      { name: "STEM Engagement", freq: "BI-ANNUAL", metrics: [
        { name: "STEM Engagement Sub-Index", type: "derived", unit: "/100", target: "≥5 pt improvement in smart-class schools by S2", formula: "STEM Index = AVG(Q8, Q9, Q10, Q11, Q12 student form) × 100/25", sql: "SELECT school_code, sd.parivartan_smart_class,\n  ROUND(AVG((q8+q9+q10+q11+q12)/25.0*100),1) AS stem_index\nFROM feedback_responses f\nJOIN school_directory sd ON f.school_code=sd.cb_code\nWHERE stakeholder_type='student' AND is_complete=true\nGROUP BY school_code, sd.parivartan_smart_class;", source: "feedback_responses (Q8–Q12)", note: "Q8=science curiosity, Q9=practical frequency, Q10=maths engagement, Q11=digital tools, Q12=teacher STEM explanation." },
        { name: "Practical Learning Frequency", type: "derived", unit: "/5 (Likert avg)", target: "Positive trend in ≥60% smart-class schools", formula: "Practical Score = AVG(Q9 student form, 1–5 scale)", sql: "SELECT school_code, ROUND(AVG(q9), 2) AS practical_score FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q9)", note: "Q9: 'How often do you do hands-on experiments/activities in science or maths?' 1=Never, 5=Always." },
        { name: "Digital Tool Effectiveness Score", type: "derived", unit: "/100", target: "≥60/100 in ≥70% smart-class schools", formula: "Digital Score = AVG(Q11 student form) × 100/5", sql: "SELECT school_code, ROUND(AVG(q11)/5.0*100, 1) AS digital_score FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q11)", note: "Q11: 'How useful are the digital tools (smart board, tablets) in your learning?' 1=Not useful, 5=Very useful." },
      ]},
      { name: "Student Wellbeing & Safety", freq: "QUARTERLY", metrics: [
        { name: "Student Experience Index (SEI)", type: "derived", liveKey: "sei_avg", unit: "/100", target: "≥62 avg across 100 schools", ...SHARED_FORMULAS.SEI },
        { name: "Safety Flag Count", type: "trix", liveKey: "safety_flags", unit: "flags/quarter", target: "Flag rate <8% by Q4", ...SHARED_FORMULAS.SAFETY_FLAGS },
        { name: "Mental Health Indicator", type: "trix", unit: "% (state avg)", target: "Declining state-level signal by Q4", ...SHARED_FORMULAS.MH_SIGNAL },
      ]},
      { name: "Teacher Quality (TEI)", freq: "BI-ANNUAL", metrics: [
        { name: "Teacher Effectiveness Index (TEI)", type: "derived", liveKey: "tei_avg", unit: "/100", target: "≥60 avg across 100 schools", ...SHARED_FORMULAS.TEI },
        { name: "Teacher Support Satisfaction", type: "auto", unit: "/100", target: "≥58 by S2", formula: "Support Score = AVG(teacher_form Q4, Q5, Q6) × 100/15", sql: "SELECT school_code, ROUND(AVG((q4+q5+q6)/15.0*100),1) AS support FROM teacher_responses WHERE is_complete=true GROUP BY school_code;", source: "teacher_responses", note: "" },
      ]},
      { name: "MCA / NEP 2020 Compliance", freq: "QUARTERLY + ANNUAL", metrics: [
        { name: "NEP Readiness Score", type: "derived", unit: "/100 + band", target: "All 100 schools baseline by Q1", ...SHARED_FORMULAS.NEP_SCORE },
        { name: "SDG 4 Indicators", type: "manual", unit: "table (5 indicators)", target: "SDG 4 table annually for MCA CSR", formula: "SDG 4.1 (Learning quality) = TEI / 100\nSDG 4.5 (Equity) = 1 − (gender_gap / 100)\nSDG 4.7 (Safety/belonging) = SEI / 100\nSDG 4.a (School environment) = infrastructure_score / 100\nSDG 4.c (Teacher quality) = TEI / 100", sql: "SELECT school_code,\n  ROUND(tei/100,2) AS sdg_4_1,\n  ROUND(1-(gender_gap/100),2) AS sdg_4_5,\n  ROUND(sei/100,2) AS sdg_4_7,\n  ROUND(tei/100,2) AS sdg_4_c\nFROM school_index_scores;", source: "school_index_scores (derived from CBI components)", note: "Annual mapping. Values extracted from CBI and TEI. Reviewed by independent evaluator." },
        { name: "MCA Schedule VII Data", type: "manual", unit: "compiled dataset", target: "Filed by 31 May annually", formula: "Same as Infosys MCA formula. See above.", sql: "SELECT SUM(enrollment), COUNT(*) FROM school_directory WHERE is_pilot=true;", source: "school_directory + FEF financial records", note: "" },
      ]},
    ]
  },

  {
    id: "wipro", name: "Wipro Foundation", ask: "₹45L / 3yr", period: "3 years", schools: 75,
    color: "#312e81", accent: "#a78bfa",
    note: "4 categories. Systemic adoption + longitudinal CBI + reform model quality.",
    categories: [
      { name: "Systemic Adoption", freq: "ANNUAL", metrics: [
        { name: "Dashboard Utilisation Rate", type: "manual", unit: "%", target: "Y1:≥50% / Y2:≥70% / Y3:≥85%", formula: "Rate = (principals who actively used dashboard data ÷ total principals) × 100\nVerified via: annual survey + platform export log (schools that downloaded/viewed reports)", sql: "SELECT ROUND(\n  COUNT(CASE WHEN dashboard_used_for_planning = true THEN 1 END)::decimal /\n  NULLIF(COUNT(*),0) * 100, 1\n) AS utilisation_rate\nFROM principal_annual_survey\nWHERE survey_year = EXTRACT(YEAR FROM CURRENT_DATE);", source: "principal_annual_survey (annual field survey)", note: "Field team administers survey. Platform export log corroborates (schools that generated reports)." },
        { name: "School Improvement Plan Integration", type: "manual", unit: "%", target: "Y1:≥40% / Y2:≥60% / Y3:≥80%", formula: "Rate = (improvement plans citing CatalystBox ÷ total plans collected) × 100", sql: "SELECT ROUND(\n  COUNT(CASE WHEN catalystbox_cited = true THEN 1 END)::decimal / NULLIF(COUNT(*),0)*100, 1\n) AS integration_rate\nFROM school_improvement_plans\nWHERE academic_year = '2026-27';", source: "school_improvement_plans (field team annual collection)", note: "Field team collects improvement plan doc from each school. Binary: CatalystBox cited / not cited." },
        { name: "Principal Essentiality Rating", type: "manual", unit: "%", target: "Y1:≥40% / Y2:≥60% / Y3:≥75%", formula: "Rate = (principals rating CatalystBox 4 or 5 on 'essential to management' scale ÷ total) × 100", sql: "SELECT ROUND(\n  COUNT(CASE WHEN essentiality_rating >= 4 THEN 1 END)::decimal / NULLIF(COUNT(*),0)*100, 1\n) AS essentiality_pct\nFROM principal_annual_survey WHERE survey_year = EXTRACT(YEAR FROM CURRENT_DATE);", source: "principal_annual_survey", note: "5-point Likert: 1=Not useful, 5=Essential. Top 2 options (4,5) = 'Essential'." },
        { name: "CSO Partner Adoption Intent", type: "manual", unit: "CSOs", target: "≥5 by Y2; ≥10 by Y3", formula: "COUNT(CSOs registering formal adoption intent at Partners Forum)", sql: "SELECT COUNT(*) FROM cso_adoption_intent\nWHERE intent_type = 'formal'\n  AND created_at >= '2027-01-01';", source: "cso_adoption_intent (Forum registration log)", note: "Collected at Wipro Foundation Partners Forum. Store: CSO name, contact, schools in network, intent type." },
      ]},
      { name: "CBI Longitudinal", freq: "ANNUAL (3-yr series)", metrics: [
        { name: "Year-on-Year CBI Delta", type: "derived", unit: "delta pts", target: "Positive in ≥65% Y1→Y2; ≥75% Y2→Y3", ...SHARED_FORMULAS.CBI_DELTA, formula: "YoY Delta = CBI(year N) − CBI(year N-1) per school\n3-year trend = [Y1, Y2, Y3] series per school" },
        { name: "Sustained Improvement Classifier", type: "derived", unit: "classification", target: "≥50% 'sustained improvers' by Y3", formula: "Sustained improver = positive delta in ≥2 of 3 years\nPlateau = delta < 3 pts in all years\nDeclining = negative delta in ≥2 years", sql: "SELECT school_code,\n  CASE\n    WHEN (delta_y2>0 AND delta_y3>0) THEN 'Sustained Improver'\n    WHEN (ABS(delta_y2)<3 AND ABS(delta_y3)<3) THEN 'Plateau'\n    WHEN (delta_y2<0 AND delta_y3<0) THEN 'Declining'\n    ELSE 'Mixed'\n  END AS classification\nFROM (\n  SELECT school_code,\n    cbi_y2 - cbi_y1 AS delta_y2,\n    cbi_y3 - cbi_y2 AS delta_y3\n  FROM school_cbi_multiyear\n) t;", source: "school_cbi_multiyear (annual CBI snapshots)", note: "Store one CBI snapshot per school per year-end. Table: school_code, cbi_y1, cbi_y2, cbi_y3." },
        { name: "Teacher Development Impact (TEI Trend)", type: "derived", unit: "trend", target: "TEI improvement in ≥60% over 3 yrs", formula: "TEI Trend = linear regression slope of [TEI_Y1, TEI_Y2, TEI_Y3] per school", sql: "SELECT school_code,\n  tei_y1, tei_y2, tei_y3,\n  ROUND((tei_y3 - tei_y1) / 2.0, 1) AS annual_improvement_rate\nFROM school_tei_multiyear;", source: "school_tei_multiyear", note: "" },
        { name: "Community Accountability Index (PTI Trend)", type: "derived", unit: "trend", target: "PTI improvement in ≥55% over 3 yrs", formula: "PTI Trend: same as TEI trend but for parent form", sql: "SELECT school_code, pti_y1, pti_y2, pti_y3, ROUND((pti_y3-pti_y1)/2.0,1) AS annual_change FROM school_pti_multiyear;", source: "school_pti_multiyear", note: "" },
      ]},
      { name: "Reform Model Quality", freq: "ANNUAL", metrics: [
        { name: "Research Output Quality", type: "manual", unit: "publications + citations", target: "≥1 paper submitted by Y2", formula: "Count of: peer-reviewed papers submitted, conference presentations, policy citations.\nCitation Impact = total citations to CatalystBox data/methodology", sql: "SELECT publication_type, COUNT(*), SUM(citation_count) FROM research_publications WHERE created_at >= '2026-04-01' GROUP BY publication_type;", source: "research_publications (manually maintained)", note: "Log: title, journal/conference, submission date, status, citation count (update annually)." },
        { name: "Reform Model Documentation Quality", type: "manual", unit: "/10 (rubric score)", target: "≥7/10 on Wipro quality rubric (Y3)", formula: "Rubric score = Σ(10 criteria scores) / 10\nCriteria: completeness, clarity, replicability, evidence quality, scalability, etc.", sql: "SELECT AVG(score) AS rubric_avg, SUM(score) AS total FROM reform_model_rubric WHERE year = 3;", source: "reform_model_rubric (Wipro Foundation review)", note: "Wipro Foundation programme advisors score the replication guide." },
        { name: "Open Data Release", type: "manual", unit: "milestone status", target: "Released by March 2029", formula: "Binary: Released / Not Released\nPost-release: COUNT(distinct researcher downloads)", sql: "SELECT release_date, download_count, licence_type FROM open_data_releases ORDER BY release_date DESC LIMIT 1;", source: "open_data_releases", note: "Track: release date, licence (CC BY 4.0 recommended), download count by institution type." },
        { name: "National Replication Readiness", type: "manual", unit: "/8 (readiness score)", target: "≥6/8 by Y3", formula: "Readiness Score = Σ(8 criteria) / 8\n8 criteria: data quality, methodology rigour, guide completeness, policy citations, govt engagement, open data, replication attempts, evaluator endorsement", sql: "SELECT SUM(score) AS readiness_score, COUNT(*) AS criteria_scored FROM replication_readiness_assessment WHERE assessment_year = 3;", source: "replication_readiness_assessment (annual joint assessment)", note: "FEF + Wipro Foundation joint assessment. Binary per criterion (pass/fail = 1/0)." },
      ]},
      { name: "Teacher Voice & Culture", freq: "ANNUAL", metrics: [
        { name: "Teacher Response Rate (Annual)", type: "derived", unit: "%", target: "Y1:≥40% / Y2:≥55% / Y3:≥65%", ...SHARED_FORMULAS.TEACHER_RESPONSE_RATE },
        { name: "Feedback Culture Shift Indicator", type: "manual", unit: "attitude level shift", target: "Shift ≥1 level in ≥60% by Y3", formula: "Culture Shift = post_attitude_level − pre_attitude_level per teacher\nAggregate: % of teachers shifting ≥1 level\nScale: 1=Resistant, 2=Skeptical, 3=Neutral, 4=Open, 5=Actively seeks", sql: "SELECT\n  AVG(post_level - pre_level) AS avg_shift,\n  ROUND(COUNT(CASE WHEN post_level-pre_level>=1 THEN 1 END)::decimal/COUNT(*)*100,1) AS pct_shifted\nFROM teacher_attitude_interviews\nWHERE interview_round = 'Y2';", source: "teacher_attitude_interviews (annual structured interviews by field team)", note: "Field team interviews 2 teachers/school. Same cohort each year. Anonymised and coded." },
        { name: "Professional Development Linkage", type: "manual", unit: "%", target: "Y2:≥35% / Y3:≥55%", formula: "% = (schools using TEI in PD planning ÷ total schools) × 100", sql: "SELECT ROUND(COUNT(CASE WHEN tei_used_for_pd=true THEN 1 END)::decimal/COUNT(*)*100,1) AS pd_linkage_pct FROM principal_annual_survey WHERE survey_year=EXTRACT(YEAR FROM CURRENT_DATE);", source: "principal_annual_survey", note: "" },
      ]},
    ]
  },

  {
    id: "google", name: "Google.org", ask: "USD 400K", period: "18 months", schools: 200,
    color: "#064e3b", accent: "#34d399",
    note: "5 categories. Tech performance + AI accuracy + open data. Most tech-forward reporting.",
    categories: [
      { name: "Platform Scale & Reach", freq: "QUARTERLY", metrics: [
        { name: "Schools Active", type: "auto", liveKey: "schools_onboarded", unit: "schools", target: "200 by Month 4", formula: "COUNT schools with ≥50 submissions", sql: "SELECT COUNT(DISTINCT school_code) FROM (SELECT school_code FROM feedback_responses WHERE is_complete=true GROUP BY school_code HAVING COUNT(*)>=50) s;", source: "feedback_responses", note: "" },
        { name: "Total Cumulative Submissions", type: "auto", liveKey: "submissions_total", unit: "submissions", target: "100K by Month 12; 200K by Month 18", formula: "COUNT(*) cumulative from April 2026", sql: "SELECT COUNT(*) FROM feedback_responses WHERE is_complete=true AND created_at>='2026-04-01';", source: "feedback_responses", note: "" },
        { name: "Vernacular Language Adoption", type: "auto", unit: "%", target: "≥40% vernacular by Month 6; ≥55% by Month 12", formula: "Vernacular % = (submissions in Hindi+Kannada+Tamil ÷ all submissions) × 100", sql: "SELECT form_language, COUNT(*) AS n, ROUND(COUNT(*)::decimal/SUM(COUNT(*)) OVER()*100,1) AS pct FROM feedback_responses WHERE is_complete=true GROUP BY form_language ORDER BY n DESC;", source: "feedback_responses.form_language", note: "Language set at form start. Stored in form_language field. Track by state." },
        { name: "Geographic Distribution (Gini)", type: "derived", unit: "Gini coefficient (0=equal)", target: "No state >35% of submissions; all 4 states ≥15%", formula: "Gini coefficient G = 1 − Σ(2×cumulative_share − relative_share)\nSimpler: MAX_state_pct < 35% AND MIN_state_pct > 15%", sql: "SELECT sd.state, ROUND(COUNT(*)::decimal/SUM(COUNT(*)) OVER()*100,1) AS pct FROM feedback_responses f JOIN school_directory sd ON f.school_code=sd.cb_code WHERE f.is_complete=true GROUP BY sd.state ORDER BY pct DESC;", source: "school_directory.state + feedback_responses", note: "" },
      ]},
      { name: "AI & Technology Quality", freq: "QUARTERLY", metrics: [
        { name: "Gemini Sentiment Accuracy (F1)", type: "manual", unit: "F1 score (0–1)", target: "F1 ≥0.80 English; ≥0.72 vernacular", formula: "F1 = 2 × (Precision × Recall) / (Precision + Recall)\nPrecision = true_positive / (true_positive + false_positive)\nRecall = true_positive / (true_positive + false_negative)\nValidated on random 200-sample / quarter", sql: "-- Requires validation_results table (human-labelled samples):\nSELECT language, sentiment_label,\n  SUM(CASE WHEN ai=human THEN 1 ELSE 0 END) AS tp_tn,\n  ROUND(2.0*precision*recall/(precision+recall),3) AS f1\nFROM ai_validation_results\nWHERE validation_date >= CURRENT_DATE - INTERVAL '90 days'\nGROUP BY language, sentiment_label;", source: "ai_validation_results (quarterly human annotation exercise)", note: "200 random submissions per quarter. Human coders annotate. Compare to Gemini output. Store results." },
        { name: "Topic Extraction Precision", type: "manual", unit: "precision (0–1)", target: "Precision ≥0.75 across all topic categories", formula: "Precision = correct_topic_tags / total_topic_tags_assigned\nValidated on stratified 200-sample / quarter", sql: "SELECT topic_category, ROUND(SUM(is_correct)::decimal/COUNT(*),3) AS precision FROM topic_validation_results WHERE validated_at >= CURRENT_DATE - INTERVAL '90 days' GROUP BY topic_category;", source: "topic_validation_results (quarterly annotation)", note: "Run validation for: safety, teaching, infrastructure, mental health, other. Log per-category." },
        { name: "AI Insight Generation Latency", type: "manual", unit: "hours (P50/P95)", target: "P50 ≤4 hrs; P95 ≤24 hrs", formula: "Latency = insight_generated_at − submission_created_at\nP50 = median; P95 = 95th percentile", sql: "SELECT\n  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_hours) AS p50,\n  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_hours) AS p95\nFROM (\n  SELECT EXTRACT(EPOCH FROM (insight_at - created_at))/3600 AS latency_hours\n  FROM feedback_responses WHERE insight_at IS NOT NULL\n) t;", source: "feedback_responses (created_at + insight_at fields)", note: "Apps Script pipeline must log insight_generated_at back to Supabase after Gemini processing." },
        { name: "Vernacular NLP Accuracy", type: "manual", unit: "F1 per language", target: "F1 ≥0.70 by Month 6; ≥0.78 by Month 12", formula: "Same F1 formula as Sentiment Accuracy, applied per language (Hindi / Kannada / Tamil separately)", sql: "SELECT language, ROUND(2.0*precision*recall/(precision+recall),3) AS f1 FROM ai_validation_results WHERE language IN ('hindi','kannada','tamil') AND validation_date >= CURRENT_DATE - INTERVAL '90 days' GROUP BY language;", source: "ai_validation_results (language-specific samples)", note: "100 submissions per language per quarter. Human coders fluent in each language." },
      ]},
      { name: "Open Dataset & Research", freq: "BI-ANNUAL + ANNUAL", metrics: [
        { name: "Open Dataset Release Milestone", type: "manual", unit: "milestone status", target: "Released by Month 15 (Jan 2028)", formula: "Checklist: anonymisation audit ✓ | open licence applied ✓ | documentation complete ✓ | portal live ✓", sql: "SELECT milestone, completed, completion_date FROM open_data_checklist ORDER BY sequence;", source: "open_data_checklist (project management tracker)", note: "Track 4 milestones: anonymisation audit, licence application, documentation, portal build." },
        { name: "Researcher Download Rate", type: "manual", unit: "distinct institutions", target: "≥10 institutions by Month 18", formula: "COUNT(DISTINCT institution) FROM dataset_downloads WHERE institution_type IS NOT NULL", sql: "SELECT institution_type, COUNT(DISTINCT institution) FROM dataset_downloads GROUP BY institution_type;", source: "dataset_downloads (data portal log)", note: "Institution type collected at download: university/NGO/government/AI company." },
        { name: "Policy API Usage", type: "manual", unit: "active integrations", target: "≥3 NGO/govt integrations by Month 18", formula: "COUNT(distinct organisations with active API key + >0 calls in quarter)", sql: "SELECT COUNT(DISTINCT org_id) FROM api_usage_log WHERE calls > 0 AND month = DATE_TRUNC('month',CURRENT_DATE);", source: "api_usage_log", note: "" },
        { name: "Research Citations", type: "manual", unit: "citations", target: "≥3 academic citations within 24 months of release", formula: "Manual tracking via Google Scholar + policy document scan", sql: "SELECT citation_type, COUNT(*) FROM research_citations GROUP BY citation_type;", source: "research_citations (manually maintained)", note: "Log: citing document, type (academic/policy/journalism), date, URL." },
      ]},
      { name: "Privacy & Ethics", freq: "MONTHLY + QUARTERLY", metrics: [
        { name: "PII Incident Count", type: "manual", unit: "incidents", target: "Zero throughout 18 months", formula: "COUNT(PII incidents) = 0. Any incident = immediate breach of target.", sql: "SELECT COUNT(*) FROM security_incidents WHERE incident_type = 'pii' AND created_at >= '2026-04-01';", source: "security_incidents (must be zero)", note: "Automated PII scan on stored data monthly. Any detection = incident. Log: date, data type, scope, remediation." },
        { name: "DPDP Act Compliance", type: "manual", unit: "checkpoints passed / 12", target: "12/12 every quarter", formula: "Compliance Score = (checkpoints passed / 12) × 100%\n12 DPDP 2023 requirements (data minimisation, consent, retention, etc.)", sql: "SELECT COUNT(CASE WHEN status='pass' THEN 1 END) AS passed, COUNT(*) AS total FROM dpdp_compliance_checks WHERE check_date >= CURRENT_DATE - INTERVAL '90 days';", source: "dpdp_compliance_checks (quarterly audit)", note: "" },
        { name: "AI Ethics Audit Score", type: "manual", unit: "/10 (avg across 8 criteria)", target: "Avg ≥7.5/10 across all 8 criteria", formula: "Ethics Score = AVG(criterion_score) where criteria: bias, explainability, data minimisation, consent architecture, minor protection, misuse risk, transparency, accountability", sql: "SELECT criterion, score FROM ai_ethics_audit WHERE audit_year = EXTRACT(YEAR FROM CURRENT_DATE);", source: "ai_ethics_audit (annual third-party audit)", note: "" },
        { name: "Data Minimisation Adherence", type: "manual", unit: "undeclared fields", target: "Zero undeclared fields throughout grant", formula: "Actual fields collected MINUS declared fields in privacy policy = 0", sql: "SELECT COUNT(*) FROM data_schema_violations WHERE period >= '2026-04-01';", source: "data_schema_violations (quarterly schema review)", note: "Compare actual Supabase table columns to privacy policy declaration. Any mismatch = violation." },
      ]},
      { name: "Social Impact (CBI & Wellbeing)", freq: "QUARTERLY + ANNUAL", metrics: [
        { name: "CBI Score Generation Rate", type: "derived", unit: "schools with valid CBI", target: "≥180/200 schools with valid CBI by Month 6", formula: "Valid CBI = school has ≥100 total submissions across all stakeholder types", sql: "SELECT COUNT(DISTINCT school_code) FROM (SELECT school_code FROM feedback_responses WHERE is_complete=true GROUP BY school_code HAVING COUNT(*)>=100) s;", source: "feedback_responses", note: "" },
        { name: "CBI Improvement Rate", type: "derived", unit: "%", target: "≥60% schools with +ve delta by Month 18", ...SHARED_FORMULAS.CBI_DELTA },
        { name: "Student Safety Score", type: "derived", liveKey: "sei_avg", unit: "/100 (safety sub-score)", target: "Stable or improving in ≥70% of schools", formula: "Safety Score = AVG(Q3, Q5, Q7) per school × 100/15", sql: "SELECT school_code, ROUND(AVG((q3+q5+q7)/15.0*100),1) AS safety_sub_score FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q3, Q5, Q7)", note: "" },
      ]},
    ]
  },

  {
    id: "reliance", name: "Reliance Foundation", ask: "₹3 Crores", period: "24 months", schools: 300,
    color: "#1e1b4b", accent: "#818cf8",
    note: "5 categories. NEP 2020 primary focus. Rural access. MoE submission.",
    categories: [
      { name: "NEP 2020 Readiness (Primary)", freq: "ANNUAL", metrics: [
        { name: "NEP Readiness Score", type: "derived", unit: "/100 + band", target: "Y2: ≥55% schools 'Developing' or above", ...SHARED_FORMULAS.NEP_SCORE },
        { name: "NEP Compliance Band Distribution", type: "derived", unit: "% per band", target: "Y2: 0 schools in 'Below'; ≥60% 'Developing'+", formula: "Band assignment:\n< 40 = Below\n40–59 = Developing\n60–79 = Compliant\n≥ 80 = Leading\n\nDistribution = COUNT(schools per band) / total schools × 100", sql: "SELECT\n  CASE WHEN nep_score < 40 THEN 'Below' WHEN nep_score < 60 THEN 'Developing' WHEN nep_score < 80 THEN 'Compliant' ELSE 'Leading' END AS band,\n  COUNT(*) AS n,\n  ROUND(COUNT(*)::decimal/SUM(COUNT(*)) OVER()*100,1) AS pct\nFROM school_nep_scores\nGROUP BY band\nORDER BY MIN(nep_score);", source: "school_nep_scores", note: "" },
        { name: "Student Wellbeing NEP 4.6", type: "derived", unit: "/100", target: "≥60% schools scoring ≥55 on NEP 4.6 dimension", formula: "NEP 4.6 Score = SEI safety+mental health sub-questions, benchmarked to NEP 4.6 language\n= AVG(Q1, Q2, Q3, Q5, Q7) per school × 100/25", sql: "SELECT school_code, ROUND(AVG((q1+q2+q3+q5+q7)/25.0*100),1) AS nep_4_6_score FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q1, Q2, Q3, Q5, Q7)", note: "Q1=safety, Q2=belonging, Q3=peer safety, Q5=peer support, Q7=feeling heard. NEP 4.6 = psychological safety." },
        { name: "Parent Engagement NEP 2.7", type: "derived", liveKey: "pti_avg", unit: "/100", target: "PTI ≥55 in ≥65% schools by Y2", ...SHARED_FORMULAS.PTI, note: "PTI questions aligned to NEP 2.7: parent participation in school governance. Annual PTI used for NEP compliance." },
      ]},
      { name: "Rural Access", freq: "QUARTERLY", metrics: [
        { name: "Rural vs. Urban Split", type: "auto", unit: "%", target: "Y1: ≥60% rural; Y2: ≥65% rural", formula: "Rural % = (rural pilot schools ÷ total pilot schools) × 100\nRural classification = UDISE+ school category (stored in school_directory)", sql: "SELECT school_type, COUNT(*), ROUND(COUNT(*)::decimal/SUM(COUNT(*)) OVER()*100,1) AS pct FROM school_directory WHERE is_pilot=true GROUP BY school_type;", source: "school_directory.school_type", note: "school_type field: 'rural'/'urban'/'semi-urban' from UDISE+ classification. Set at onboarding." },
        { name: "Low-Bandwidth School Coverage", type: "auto", unit: "% completing full cycles", target: "100% of low-bandwidth schools ≥2 cycles/year", formula: "Coverage = (low_bandwidth schools with ≥2 feedback cycles ÷ total low_bandwidth schools) × 100\nFeedback cycle = ≥50 submissions in a quarter", sql: "SELECT ROUND(COUNT(CASE WHEN cycle_count>=2 THEN 1 END)::decimal / NULLIF(COUNT(*),0)*100,1) AS coverage FROM (SELECT school_code, COUNT(DISTINCT quarter) AS cycle_count FROM quarterly_active_schools WHERE is_low_bandwidth=true GROUP BY school_code) t;", source: "school_directory.is_low_bandwidth + quarterly_active_schools", note: "is_low_bandwidth flag set at onboarding based on connectivity assessment. SMS fallback tracked separately." },
        { name: "JioPhone Submission Rate", type: "auto", unit: "%", target: "≥25% rural submissions from feature phones by Y2", formula: "Rate = (submissions from feature phone UA ÷ total rural submissions) × 100\nFeature phone UA = browser user-agent containing 'KAIOS' / 'JioPhone' / screen <360px", sql: "SELECT ROUND(COUNT(CASE WHEN device_type='feature_phone' THEN 1 END)::decimal/NULLIF(COUNT(*),0)*100,1) AS jiophone_rate FROM feedback_responses f JOIN school_directory sd ON f.school_code=sd.cb_code WHERE sd.school_type='rural' AND f.is_complete=true;", source: "feedback_responses.device_type (parsed from user-agent at submission)", note: "device_type field populated from user-agent string at form submission. No device ID stored." },
      ]},
      { name: "Student Wellbeing & Safety", freq: "QUARTERLY", metrics: [
        { name: "Student Experience Index (SEI)", type: "derived", liveKey: "sei_avg", unit: "/100", target: "≥60 avg by Y2", ...SHARED_FORMULAS.SEI },
        { name: "Safety Flag Rate Trend", type: "trix", unit: "monthly delta (%)", target: "Declining trend in ≥65% schools by Y2", formula: "Monthly Delta = Flag_Rate(month N) − Flag_Rate(month N-1)\nTrend = 'improving' if last 3 months show declining flag rate", sql: "SELECT school_code, month,\n  flag_rate - LAG(flag_rate) OVER(PARTITION BY school_code ORDER BY month) AS monthly_delta\nFROM monthly_safety_flag_rates\nORDER BY school_code, month;", source: "monthly_safety_flag_rates (materialized from feedback_responses)", note: "" },
        { name: "Community Safety Awareness", type: "derived", unit: "/100", target: "PTI safety sub-score ≥58 in ≥60% schools by Y2", formula: "Safety Awareness Score = AVG(parent form safety questions) × 100/max\nSafety questions: Q_safety, Q_bullying_awareness, Q_school_response", sql: "SELECT school_code, ROUND(AVG((q_safety+q_bullying+q_response)/15.0*100),1) AS safety_awareness FROM feedback_responses WHERE stakeholder_type='parent' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (parent form safety questions)", note: "" },
      ]},
      { name: "Community Voice", freq: "BI-ANNUAL", metrics: [
        { name: "Parent Response Rate", type: "derived", unit: "%", target: "Y1: ≥20%; Y2: ≥30%", ...SHARED_FORMULAS.PARENT_RESPONSE_RATE },
        { name: "Parent Trust Index (PTI)", type: "derived", liveKey: "pti_avg", unit: "/100", target: "≥55 avg by Y2", ...SHARED_FORMULAS.PTI },
        { name: "Community Issue Resolution Rate", type: "manual", unit: "%", target: "≥50% issue-to-action by Y2", ...SHARED_FORMULAS.ISSUE_RESOLUTION },
      ]},
      { name: "Policy Impact", freq: "ANNUAL", metrics: [
        { name: "State Education Dept. Engagements", type: "manual", unit: "formal engagements", target: "≥3 per year (1 per state)", formula: "COUNT(formal state-level engagements per year)", sql: "SELECT state, COUNT(*) FROM programme_engagements WHERE engagement_type IN ('meeting','data_submission','MOU') AND counterparty_type='state_education_dept' AND EXTRACT(YEAR FROM created_at)=EXTRACT(YEAR FROM CURRENT_DATE) GROUP BY state;", source: "programme_engagements", note: "" },
        { name: "NEP Ground-Truth Report Quality", type: "manual", unit: "/6 (peer review rubric)", target: "≥4.5/6 on all criteria (Y2)", formula: "Report Score = AVG(6 peer review criteria) where criteria scored 0–1:\ndata quality + methodology transparency + policy relevance + actionability + accuracy + readability", sql: "SELECT criterion, score FROM nep_report_peer_review WHERE report_year=EXTRACT(YEAR FROM CURRENT_DATE);", source: "nep_report_peer_review", note: "" },
        { name: "MoE Submission Confirmation", type: "manual", unit: "ack received: Y/N", target: "Acknowledgement within 30 days of submission", formula: "Days to acknowledgement = ack_date − submission_date ≤ 30", sql: "SELECT submission_date, ack_date, ack_date-submission_date AS days_to_ack FROM moe_submissions ORDER BY submission_date DESC LIMIT 1;", source: "moe_submissions", note: "" },
        { name: "Jio School Integration Events", type: "manual", unit: "schools integrated", target: "≥20 by Y1; ≥60 by Y2", formula: "COUNT(schools with Jio infrastructure integration logged)", sql: "SELECT integration_type, COUNT(*) FROM school_jio_integrations WHERE created_at >= '2026-04-01' GROUP BY integration_type;", source: "school_jio_integrations (field team log)", note: "Log: school_code, integration type (JioScreen/JioFi/other), date, status." },
      ]},
    ]
  },

  {
    id: "apf", name: "Azim Premji Foundation", ask: "₹25L", period: "24 months", schools: 15,
    color: "#422006", accent: "#fbbf24",
    note: "4 categories. Research-grade evidence. Peer-reviewed output. Methodological rigour.",
    categories: [
      { name: "Research Output", freq: "ANNUAL", metrics: [
        { name: "Peer-Reviewed Publication", type: "manual", unit: "papers", target: "≥1 submitted by Y2 Month 18", formula: "COUNT(papers submitted to peer-reviewed journals)", sql: "SELECT title, journal, submission_date, status FROM research_publications WHERE review_type='peer_reviewed' ORDER BY submission_date DESC;", source: "research_publications", note: "Log: title, journal, submission date, status (submitted/under review/accepted/published), DOI." },
        { name: "Conference Presentations", type: "manual", unit: "presentations", target: "≥1 at APF forum by Y1; ≥2 total by Y2", formula: "COUNT(conference presentations using CatalystBox-APF data)", sql: "SELECT conference_name, presentation_date, presenter FROM conference_presentations ORDER BY presentation_date DESC;", source: "conference_presentations", note: "" },
        { name: "Policy Document Citations", type: "manual", unit: "citations", target: "≥2 policy citations within 24 months", formula: "Manual scan of MoE, SCERT, NCERT, state dept publications", sql: "SELECT document_name, issuing_body, citation_date FROM policy_citations ORDER BY citation_date DESC;", source: "policy_citations (manually tracked)", note: "" },
        { name: "Practitioner Knowledge Transfer", type: "manual", unit: "organisations", target: "≥3 APF partners adapting practice by Y2", formula: "COUNT(APF partner organisations formally incorporating CatalystBox findings)", sql: "SELECT COUNT(*) FROM apf_partner_adoptions WHERE adapted_practice=true AND survey_year=EXTRACT(YEAR FROM CURRENT_DATE);", source: "apf_partner_adoptions (Partners Forum post-survey)", note: "" },
      ]},
      { name: "Data Quality & Validity", freq: "BI-ANNUAL", metrics: [
        { name: "QQ Correlation Score (Spearman r)", type: "manual", unit: "Spearman r", target: "r ≥ 0.55 by Y2", formula: "Spearman r = 1 − (6 × Σd²) / (n × (n²−1))\nWhere d = rank difference between CBI rank and APF qualitative score rank per school\nRun on 15 research schools with APF rubric scores", sql: "-- Requires APF qualitative assessment scores:\nSELECT CORR(\n  RANK() OVER (ORDER BY cbi_score),\n  RANK() OVER (ORDER BY apf_quality_score)\n) AS spearman_approx\nFROM (\n  SELECT s.school_code, s.cbi_score, a.quality_score AS apf_quality_score\n  FROM school_cbi_scores s JOIN apf_quality_assessments a USING(school_code)\n) t;", source: "school_cbi_scores + apf_quality_assessments", note: "APF field team conducts annual school quality assessment using established rubric. Compare to CBI." },
        { name: "Response Rate (Research Threshold)", type: "derived", unit: "% per stakeholder type", target: "Students ≥35%; Teachers ≥40%; Parents ≥20%", formula: "Same as individual stakeholder response rates (see above)\nSchools below threshold excluded from correlation analysis", sql: "SELECT school_code,\n  ROUND(COUNT(CASE WHEN stakeholder_type='student' THEN 1 END)::decimal / NULLIF(s.enrollment,0)*100,1) AS student_rate,\n  ROUND(COUNT(CASE WHEN stakeholder_type='teacher' THEN 1 END)::decimal / NULLIF(ROUND(s.enrollment/30.0),0)*100,1) AS teacher_rate,\n  ROUND(COUNT(CASE WHEN stakeholder_type='parent' THEN 1 END)::decimal / NULLIF(ROUND(s.enrollment*0.7),0)*100,1) AS parent_rate\nFROM feedback_responses f JOIN school_directory s USING(school_code)\nWHERE f.is_complete=true GROUP BY f.school_code, s.enrollment;", source: "feedback_responses + school_directory.enrollment", note: "" },
        { name: "Longitudinal Consistency (ICC)", type: "manual", unit: "ICC value", target: "ICC ≥ 0.70 for CBI and major sub-indices", formula: "ICC (two-way random, absolute agreement):\nICC = (MS_between − MS_within) / (MS_between + (k−1)×MS_within)\nCalculated on control schools (no improvement intervention)", sql: "-- Requires multi-year CBI from stable control schools:\nSELECT STDDEV(cbi_y2-cbi_y1) AS stability_sd,\n  AVG(cbi_y2-cbi_y1) AS mean_drift\nFROM school_cbi_multiyear\nWHERE is_control_school = true;", source: "school_cbi_multiyear (control schools only)", note: "ICC calculation requires ANOVA. Export data and calculate in Python/R for annual report." },
        { name: "IRB Ethics Compliance", type: "manual", unit: "criteria passed / 10", target: "10/10 throughout 24 months", formula: "10 IRB criteria (binary pass/fail):\n1. Informed consent process documented\n2. Data minimisation verified\n3. Minor protection protocol active\n4. Anonymisation verified\n5. Data retention policy enforced\n6. Right to withdraw honoured\n7. No PII in outputs\n8. Secure storage confirmed\n9. Access controls audited\n10. Ethics committee review current", sql: "SELECT COUNT(CASE WHEN status='pass' THEN 1 END) AS passed, COUNT(*) AS total FROM irb_compliance_checklist WHERE review_date >= CURRENT_DATE - INTERVAL '90 days';", source: "irb_compliance_checklist (joint FEF + APF quarterly review)", note: "" },
      ]},
      { name: "Teacher Professional Culture", freq: "ANNUAL", metrics: [
        { name: "Teacher Attitude to Feedback Scale", type: "manual", unit: "level shift (1–5 scale)", target: "Shift ≥1 level in ≥50% by Y2", formula: "Attitude Score = coded interview response on 5-level scale\nShift = post_score − pre_score\nPositive shift ≥1 = culture change evidence", sql: "SELECT school_code,\n  AVG(post_level - pre_level) AS avg_shift,\n  ROUND(COUNT(CASE WHEN post_level-pre_level>=1 THEN 1 END)::decimal/COUNT(*)*100,1) AS pct_positive_shift\nFROM teacher_attitude_interviews\nGROUP BY school_code;", source: "teacher_attitude_interviews (annual field interviews)", note: "1=Resistant, 2=Skeptical, 3=Neutral, 4=Open, 5=Actively seeks feedback. 2 teachers/school." },
        { name: "TEI Trend (3-semester)", type: "derived", unit: "trend direction", target: "Positive TEI in ≥55% over S1Y1→S2Y1→S1Y2", formula: "3-semester TEI trend = [TEI_S1Y1, TEI_S2Y1, TEI_S1Y2] per school\nPositive trend = S1Y2 > S1Y1 (year-on-year same semester comparison)", sql: "SELECT school_code,\n  tei_s1y1, tei_s2y1, tei_s1y2,\n  CASE WHEN tei_s1y2 > tei_s1y1 THEN 'improving' ELSE 'flat/declining' END AS trend\nFROM school_tei_semester_series;", source: "school_tei_semester_series", note: "" },
        { name: "Professional Development Integration", type: "manual", unit: "%", target: "Y1: ≥30%; Y2: ≥50%", formula: "% = (schools where head-teacher used TEI data in PD planning ÷ total) × 100", sql: "SELECT ROUND(COUNT(CASE WHEN tei_used_for_pd=true THEN 1 END)::decimal/COUNT(*)*100,1) AS pd_integration FROM principal_annual_survey WHERE survey_year=EXTRACT(YEAR FROM CURRENT_DATE);", source: "principal_annual_survey", note: "" },
      ]},
      { name: "School System Change", freq: "ANNUAL", metrics: [
        { name: "CBI Year-on-Year Delta", type: "derived", unit: "delta pts", target: "Positive in ≥60% of 15 schools", ...SHARED_FORMULAS.CBI_DELTA },
        { name: "Head-Teacher Capacity Development", type: "manual", unit: "/6 (rubric score)", target: "Score improves Y1 → Y2", formula: "Capacity Score = Σ(6 rubric items, 0–1 each)\n6 items: data literacy, data-to-action translation, prioritisation, communication to staff, monitoring, reflection", sql: "SELECT school_code, assessment_year, SUM(score) AS capacity_score FROM headteacher_capacity_rubric GROUP BY school_code, assessment_year ORDER BY school_code, assessment_year;", source: "headteacher_capacity_rubric (annual APF field assessment)", note: "" },
        { name: "School Improvement Action Count", type: "manual", unit: "actions / school / year", target: "≥3 per school per year", formula: "COUNT(actions triggered by CatalystBox insights per school per year)", sql: "SELECT school_code, EXTRACT(YEAR FROM created_at) AS year, COUNT(*) AS action_count, COUNT(*) / 4.0 AS per_quarter FROM school_improvement_actions WHERE triggered_by_catalystbox = true GROUP BY school_code, year ORDER BY school_code, year;", source: "school_improvement_actions (principal-maintained, FEF reviewed)", note: "Log: action type, school, date, CatalystBox data cited, outcome. FEF reviews quarterly." },
        { name: "APF Replication Recommendation", type: "manual", unit: "Recommend / Conditional / Not Recommend", target: "'Recommend' or 'Conditional Recommend' by Y2", formula: "APF programme team assessment on 4-page structured rubric at Year 2.\nBinary outcome per dimension.", sql: "SELECT recommendation_level, rationale FROM apf_replication_assessment ORDER BY assessment_date DESC LIMIT 1;", source: "apf_replication_assessment (APF programme team, Y2)", note: "" },
      ]},
    ]
  },

  {
    id: "hcl", name: "HCL Foundation", ask: "₹40L", period: "12 months", schools: 25,
    color: "#1c1917", accent: "#84cc16",
    note: "5 categories. HCL campus proximity. Future Readiness primary. Sakshar Samuday complementarity.",
    categories: [
      { name: "Reach & Community Coverage", freq: "QUARTERLY", metrics: [
        { name: "Schools Active by Geography", type: "auto", liveKey: "schools_onboarded", unit: "schools per city", target: "10 Noida / 8 Gr. Noida / 7 Pune", formula: "COUNT(active schools) GROUP BY geography tag", sql: "SELECT geography_tag, COUNT(*) FROM school_directory WHERE is_pilot=true GROUP BY geography_tag;", source: "school_directory.geography_tag", note: "geography_tag: 'noida' / 'greater_noida' / 'pune'. Set at onboarding from address." },
        { name: "Total Feedback Submissions", type: "auto", liveKey: "submissions_total", unit: "submissions", target: "≥12,000 in AY 2026–27", formula: "COUNT(*) WHERE is_complete=TRUE", sql: "SELECT COUNT(*) FROM feedback_responses WHERE is_complete=true AND created_at>='2026-04-01';", source: "feedback_responses", note: "" },
        { name: "HCL Campus Proximity Index", type: "manual", unit: "km (avg)", target: "Avg ≤5 km; all schools within 15 km", formula: "Proximity = Haversine distance(school GPS, nearest HCL campus GPS)\nAvg Proximity = AVG(proximity) across all pilot schools", sql: "SELECT school_code, school_name,\n  ROUND(proximity_km::decimal, 1) AS proximity_km\nFROM school_hcl_proximity\nORDER BY proximity_km;", source: "school_hcl_proximity (calculated at onboarding using GPS coords)", note: "Calculate using Haversine formula. HCL campuses: Noida Sector 126, Greater Noida Sector 135, Pune Hinjawadi." },
        { name: "Hindi Submission Rate (NCR)", type: "auto", unit: "%", target: "≥65% UP school submissions in Hindi by Q2", formula: "Hindi % = (submissions in Hindi ÷ total NCR submissions) × 100", sql: "SELECT ROUND(COUNT(CASE WHEN form_language='hindi' THEN 1 END)::decimal/COUNT(*)*100,1) AS hindi_pct FROM feedback_responses f JOIN school_directory sd ON f.school_code=sd.cb_code WHERE sd.geography_tag IN ('noida','greater_noida') AND f.is_complete=true;", source: "feedback_responses.form_language + school_directory.geography_tag", note: "" },
      ]},
      { name: "Future Readiness (Primary)", freq: "BI-ANNUAL", metrics: [
        { name: "Future Readiness Sub-Index Score", type: "derived", unit: "/100", target: "≥5 pt improvement in bottom-quartile by S2", formula: "Future Readiness = AVG(Q13, Q14, Q15, Q16, Q17 student form) × 100/25", sql: "SELECT school_code, sd.geography_tag,\n  ROUND(AVG((q13+q14+q15+q16+q17)/25.0*100),1) AS future_readiness_score\nFROM feedback_responses f\nJOIN school_directory sd ON f.school_code=sd.cb_code\nWHERE f.stakeholder_type='student' AND f.is_complete=true\nGROUP BY school_code, sd.geography_tag;", source: "feedback_responses (Q13–Q17)", note: "Q13=digital access, Q14=coding/tech exposure, Q15=career awareness, Q16=future skills, Q17=technology problem-solving." },
        { name: "Digital Access Score", type: "derived", unit: "/100", target: "≥55/100 in ≥70% of pilot schools", formula: "Digital Access = AVG(Q13 student form) × 100/5", sql: "SELECT school_code, ROUND(AVG(q13)/5.0*100,1) AS digital_access FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q13)", note: "Q13: 'Do you have access to computers/smart boards/tablets in school?' 1=No access, 5=Regular access." },
        { name: "Career Awareness Score", type: "derived", unit: "/100", target: "≥50/100 (baseline metric)", formula: "Career Awareness = AVG(Q15, Q16) × 100/10", sql: "SELECT school_code, ROUND(AVG((q15+q16)/10.0*100),1) AS career_awareness FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q15, Q16)", note: "Q15=technology career awareness, Q16=future skills awareness. Both 1–5 scale." },
        { name: "Technology Exposure Score", type: "derived", unit: "/100", target: "Positive trend in ≥60% schools by year-end", formula: "Tech Exposure = AVG(Q14, Q17) × 100/10", sql: "SELECT school_code, ROUND(AVG((q14+q17)/10.0*100),1) AS tech_exposure FROM feedback_responses WHERE stakeholder_type='student' AND is_complete=true GROUP BY school_code;", source: "feedback_responses (Q14, Q17)", note: "Q14=coding/digital project frequency, Q17=technology problem-solving exposure." },
      ]},
      { name: "Student Wellbeing & Safety", freq: "QUARTERLY", metrics: [
        { name: "Student Experience Index (SEI)", type: "derived", liveKey: "sei_avg", unit: "/100", target: "≥60 avg; ≥72% schools above 55 by Q4", ...SHARED_FORMULAS.SEI },
        { name: "Safety Flag Resolution Rate", type: "manual", unit: "%", target: "≥55% by Q3; ≥70% by Q4", ...SHARED_FORMULAS.ISSUE_RESOLUTION, formula: "Resolution Rate = (flags where action_taken=TRUE ÷ total flags) × 100\nMeasured monthly, reviewed by FEF field coordinator" },
        { name: "Mental Health Signal Awareness (Principals)", type: "manual", unit: "%", target: "≥60% principals report MH action", formula: "% = (principals who triggered MH activity ÷ total principals) × 100\nSurvey question: 'Did CatalystBox data prompt a MH awareness activity?'", sql: "SELECT ROUND(COUNT(CASE WHEN mh_action_triggered=true THEN 1 END)::decimal/COUNT(*)*100,1) AS mh_awareness_pct FROM principal_annual_survey WHERE survey_year=EXTRACT(YEAR FROM CURRENT_DATE);", source: "principal_annual_survey (year-end)", note: "" },
      ]},
      { name: "Teacher Effectiveness (TEI)", freq: "BI-ANNUAL", metrics: [
        { name: "Teacher Effectiveness Index (TEI)", type: "derived", liveKey: "tei_avg", unit: "/100", target: "≥58 avg; positive S1→S2 trend", ...SHARED_FORMULAS.TEI },
        { name: "Teacher Response Rate", type: "derived", unit: "%", target: "≥45% by S2", ...SHARED_FORMULAS.TEACHER_RESPONSE_RATE },
      ]},
      { name: "MCA / Employee Engagement", freq: "QUARTERLY + ANNUAL", metrics: [
        { name: "MCA Schedule VII Data", type: "manual", unit: "compiled dataset", target: "Filed by 31 May annually", formula: "Beneficiary count = SUM(school_enrollment) for pilot schools\nBroken down by Noida/Greater Noida/Pune geography", sql: "SELECT geography_tag, SUM(enrollment) AS beneficiaries, COUNT(*) AS schools FROM school_directory WHERE is_pilot=true GROUP BY geography_tag;", source: "school_directory.enrollment + FEF financial records", note: "" },
        { name: "Employee Volunteer Sessions", type: "manual", unit: "sessions", target: "≥5 sessions across 25 schools", formula: "COUNT(volunteer sessions logged with ≥1 HCL employee + ≥1 principal)", sql: "SELECT COUNT(*) FROM volunteer_sessions WHERE volunteers_count>0 AND principals_count>0 AND session_type='data_interpretation';", source: "volunteer_sessions (FEF + HCL Foundation log)", note: "Log: date, school_code, # volunteers, # principals, session plan doc, outcomes summary." },
        { name: "Sakshar Samuday Complementarity", type: "manual", unit: "correlation (r)", target: "r > 0.3 between Sakshar participation and PTI", formula: "Point-biserial correlation: r_pb = (PTI_sakshar − PTI_non) / SD × √(n_s×n_n / N²)\nWhere sakshar = parents in Sakshar Samuday programme", sql: "SELECT\n  AVG(CASE WHEN sakshar_participant THEN pti_score END) AS sakshar_pti,\n  AVG(CASE WHEN NOT sakshar_participant THEN pti_score END) AS non_sakshar_pti,\n  COUNT(CASE WHEN sakshar_participant THEN 1 END) AS n_sakshar\nFROM parent_pti_scores p\nJOIN sakshar_participant_register s USING(school_code);", source: "parent_pti_scores + sakshar_participant_register (from HCL Foundation)", note: "Sakshar Samuday register provided by HCL Foundation. Cross-tab at school level only — no individual identification." },
        { name: "Policy Brief Submission", type: "manual", unit: "briefs acknowledged", target: "Both UP and MH briefs submitted+acked by Mar 2027", formula: "COUNT(policy_briefs WHERE state IN ('UP','MH') AND ack_received = TRUE) = 2", sql: "SELECT state, submission_date, ack_received, ack_date FROM policy_briefs WHERE state IN ('UP','Maharashtra') AND funder_tag='HCL';", source: "policy_briefs", note: "" },
      ]},
    ]
  }
];

/* ── LIVE DATA HOOK ───────────────────────────────────────────────────────── */
function useLiveData(anonKey) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!anonKey) return;
    setLoading(true);
    try {
      const [schools, subs, scans, pilot] = await Promise.all([
        sbCount("school_directory", "is_pilot=eq.true", anonKey),
        sbCount("feedback_responses", "is_complete=eq.true", anonKey),
        sbCount("qr_scan_events", "", anonKey),
        sbCount("school_directory", "", anonKey),
      ]);
      const byType = await sbQuery("feedback_responses", "stakeholder_type", "is_complete=eq.true", anonKey);
      let studentSubs=0, teacherSubs=0, parentSubs=0;
      if (byType) {
        byType.forEach(r => {
          if(r.stakeholder_type === "student") studentSubs++;
          else if(r.stakeholder_type === "teacher") teacherSubs++;
          else if(r.stakeholder_type === "parent") parentSubs++;
        });
      }
      const total = studentSubs + teacherSubs + parentSubs;
      setData({
        schools_onboarded: schools ?? 0,
        submissions_total: subs ?? 0,
        qr_scans: scans ?? 0,
        total_schools: pilot ?? 0,
        completion_rate: scans > 0 ? ((subs / scans) * 100).toFixed(1) : null,
        stakeholder_split: total > 0 ? {
          student: ((studentSubs/total)*100).toFixed(0),
          teacher: ((teacherSubs/total)*100).toFixed(0),
          parent: ((parentSubs/total)*100).toFixed(0),
        } : null,
        cbi_avg: null, sei_avg: null, tei_avg: null, pti_avg: null,
        safety_flags: null, active_school_rate: null,
      });
      setLastFetch(new Date());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [anonKey]);

  useEffect(() => { if (anonKey) fetchAll(); }, [anonKey, fetchAll]);
  return { data, loading, lastFetch, refresh: fetchAll };
}

/* ── FORMULA MODAL ────────────────────────────────────────────────────────── */
function FormulaModal({ metric, onClose }) {
  const typeColor = { auto: "#0B5C45", derived: "#1aada7", trix: "#E8922A", manual: "#6b7280" };
  const typeLabel = { auto: "AUTO (Supabase)", derived: "DERIVED", trix: "APPS SCRIPT (Trix)", manual: "MANUAL ENTRY" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={onClose}>
      <div style={{ background:"#0D1117", border:"1px solid #1E2A35", borderRadius:"16px", maxWidth:"760px", width:"100%", maxHeight:"90vh", overflow:"auto", padding:"32px" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
          <div>
            <span style={{ background:typeColor[metric.type]+"22", color:typeColor[metric.type], padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontFamily:"DM Mono", fontWeight:500, letterSpacing:"0.05em" }}>{typeLabel[metric.type]}</span>
            <h2 style={{ color:"#E2E8F0", fontFamily:"Syne", fontSize:"22px", fontWeight:700, margin:"10px 0 4px" }}>{metric.name}</h2>
            {metric.target && <p style={{ color:"#64748B", fontFamily:"DM Sans", fontSize:"13px", margin:0 }}>Target: <span style={{ color:"#E8922A" }}>{metric.target}</span></p>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2D3748", color:"#64748B", width:"32px", height:"32px", borderRadius:"8px", cursor:"pointer", fontSize:"16px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>

        <div style={{ marginBottom:"20px" }}>
          <label style={{ color:"#0B5C45", fontFamily:"DM Mono", fontSize:"11px", fontWeight:500, letterSpacing:"0.08em", display:"block", marginBottom:"8px" }}>FORMULA</label>
          <pre style={{ background:"#060D14", border:"1px solid #1E2A35", borderRadius:"10px", padding:"16px", color:"#34d399", fontFamily:"DM Mono", fontSize:"13px", lineHeight:"1.7", margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{metric.formula}</pre>
        </div>

        {metric.sql && (
          <div style={{ marginBottom:"20px" }}>
            <label style={{ color:"#1aada7", fontFamily:"DM Mono", fontSize:"11px", fontWeight:500, letterSpacing:"0.08em", display:"block", marginBottom:"8px" }}>SQL / SUPABASE QUERY</label>
            <pre style={{ background:"#060D14", border:"1px solid #1E2A35", borderRadius:"10px", padding:"16px", color:"#93c5fd", fontFamily:"DM Mono", fontSize:"12px", lineHeight:"1.7", margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{metric.sql}</pre>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:metric.note?"16px":"0" }}>
          <div style={{ background:"#060D14", border:"1px solid #1E2A35", borderRadius:"10px", padding:"14px" }}>
            <label style={{ color:"#64748B", fontFamily:"DM Mono", fontSize:"10px", letterSpacing:"0.08em", display:"block", marginBottom:"6px" }}>DATA SOURCE</label>
            <p style={{ color:"#CBD5E0", fontFamily:"DM Mono", fontSize:"12px", margin:0 }}>{metric.source || "—"}</p>
          </div>
          <div style={{ background:"#060D14", border:"1px solid #1E2A35", borderRadius:"10px", padding:"14px" }}>
            <label style={{ color:"#64748B", fontFamily:"DM Mono", fontSize:"10px", letterSpacing:"0.08em", display:"block", marginBottom:"6px" }}>UNIT</label>
            <p style={{ color:"#CBD5E0", fontFamily:"DM Mono", fontSize:"12px", margin:0 }}>{metric.unit || "—"}</p>
          </div>
        </div>

        {metric.note && (
          <div style={{ background:"#E8922A11", border:"1px solid #E8922A33", borderRadius:"10px", padding:"14px", marginTop:"12px" }}>
            <label style={{ color:"#E8922A", fontFamily:"DM Mono", fontSize:"10px", letterSpacing:"0.08em", display:"block", marginBottom:"6px" }}>NOTE</label>
            <p style={{ color:"#D4B896", fontFamily:"DM Sans", fontSize:"13px", margin:0, lineHeight:1.6 }}>{metric.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── METRIC CARD ──────────────────────────────────────────────────────────── */
function MetricCard({ metric, liveData, onClick }) {
  const val = metric.liveKey ? liveData[metric.liveKey] : null;
  const displayVal = val !== null && val !== undefined ? (typeof val === "number" ? val.toLocaleString() : val) : "—";
  const typeColors = { auto: "#0B5C45", derived: "#1aada7", trix: "#E8922A", manual: "#6b7280" };
  const typeLabels = { auto: "AUTO", derived: "CALC", trix: "TRIX", manual: "MANUAL" };
  const tc = typeColors[metric.type];

  return (
    <div onClick={() => onClick(metric)} style={{ background:"#0D1117", border:"1px solid #1A2433", borderRadius:"14px", padding:"20px", cursor:"pointer", transition:"all 0.2s", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{ e.currentTarget.style.border="1px solid "+tc+"66"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.border="1px solid #1A2433"; e.currentTarget.style.transform="translateY(0)"; }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:`linear-gradient(90deg, ${tc}88, transparent)` }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <span style={{ background:tc+"22", color:tc, padding:"2px 8px", borderRadius:"10px", fontSize:"10px", fontFamily:"DM Mono", fontWeight:600, letterSpacing:"0.06em" }}>{typeLabels[metric.type]}</span>
        <span style={{ color:"#2D3748", fontFamily:"DM Mono", fontSize:"11px" }}>⟩ formula</span>
      </div>
      <div style={{ fontFamily:"DM Mono", fontSize:"28px", fontWeight:400, color: val !== null && val !== undefined ? "#E2E8F0" : "#2D3748", marginBottom:"4px", letterSpacing:"-0.02em" }}>
        {displayVal}
      </div>
      <div style={{ fontFamily:"DM Sans", fontSize:"13px", fontWeight:500, color:"#94A3B8", marginBottom:"6px", lineHeight:1.3 }}>{metric.name}</div>
      {metric.target && <div style={{ fontFamily:"DM Mono", fontSize:"10px", color:"#E8922A99", borderTop:"1px solid #1A2433", paddingTop:"8px", marginTop:"8px" }}>TARGET: {metric.target}</div>}
    </div>
  );
}

/* ── MAIN APP ─────────────────────────────────────────────────────────────── */
function CatalystBoxDashboardInner() {
  const [anonKey, setAnonKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [showConfig, setShowConfig] = useState(true);
  const [selectedFunder, setSelectedFunder] = useState("tcs");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeMetric, setActiveMetric] = useState(null);
  const { data: liveData, loading, lastFetch, refresh } = useLiveData(anonKey);

  const funder = FUNDER_DATA.find(f => f.id === selectedFunder) || FUNDER_DATA[0];
  const category = selectedCategory ? funder.categories.find(c => c.name === selectedCategory) : funder.categories[0];

  const totalMetrics = FUNDER_DATA.reduce((s,f) => s + f.categories.reduce((s2,c) => s2+c.metrics.length, 0), 0);
  const autoCount = FUNDER_DATA.reduce((s,f) => s + f.categories.reduce((s2,c) => s2+c.metrics.filter(m=>m.type==="auto"||m.type==="derived").length, 0), 0);

  function exportCSV() {
    const rows = [["Funder","Category","Metric","Type","Target","Data Source","Formula"]];
    FUNDER_DATA.forEach(f => f.categories.forEach(cat => cat.metrics.forEach(m => {
      rows.push([f.name, cat.name, m.name, m.type, m.target||"", m.source||"", (m.formula||"").replace(/\n/g," | ")]);
    })));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download = "CatalystBox_Impact_Metrics.csv"; a.click();
  }

  const styles = {
    app: { fontFamily:"DM Sans", background:"#060D14", minHeight:"100vh", color:"#E2E8F0" },
    header: { background:"linear-gradient(180deg, #0A1520 0%, #060D14 100%)", borderBottom:"1px solid #1A2433", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:"60px", position:"sticky", top:0, zIndex:100 },
    logo: { fontFamily:"Syne", fontWeight:800, fontSize:"18px", color:"#E2E8F0", letterSpacing:"-0.01em" },
    logoAccent: { color:"#0B5C45" },
    badge: { background:"#0B5C4522", color:"#1aada7", border:"1px solid #0B5C4544", padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontFamily:"DM Mono", fontWeight:500 },
    main: { padding:"0 24px 40px" },
  };

  return (
    <div style={styles.app}>
      <FontLoader/>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span style={styles.logo}><span style={styles.logoAccent}>CATALYST</span>BOX</span>
          <span style={{ color:"#2D3748", fontSize:"14px" }}>|</span>
          <span style={{ fontFamily:"DM Mono", fontSize:"12px", color:"#64748B" }}>IMPACT INTELLIGENCE DASHBOARD</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          {lastFetch && <span style={{ fontFamily:"DM Mono", fontSize:"10px", color:"#2D3748" }}>synced {lastFetch.toLocaleTimeString()}</span>}
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: anonKey ? (loading ? "#E8922A" : "#22c55e") : "#374151" }}/>
          <span style={{ fontFamily:"DM Mono", fontSize:"11px", color: anonKey ? "#22c55e" : "#64748B" }}>{anonKey ? (loading ? "FETCHING" : "LIVE") : "NO CONNECTION"}</span>
          <button onClick={exportCSV} style={{ background:"#E8922A22", border:"1px solid #E8922A44", color:"#E8922A", padding:"5px 14px", borderRadius:"8px", fontFamily:"DM Mono", fontSize:"11px", cursor:"pointer", fontWeight:600 }}>EXPORT CSV</button>
          <button onClick={()=>setShowConfig(v=>!v)} style={{ background:"#0B5C4522", border:"1px solid #0B5C4544", color:"#1aada7", padding:"5px 14px", borderRadius:"8px", fontFamily:"DM Mono", fontSize:"11px", cursor:"pointer" }}>CONFIG</button>
        </div>
      </div>

      <div style={styles.main}>

        {/* ── CONFIG PANEL ── */}
        {showConfig && (
          <div style={{ background:"#0A1520", border:"1px solid #1A2433", borderRadius:"14px", padding:"20px 24px", margin:"20px 0", display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
            <div style={{ flex:"1", minWidth:"260px" }}>
              <label style={{ fontFamily:"DM Mono", fontSize:"10px", color:"#64748B", letterSpacing:"0.08em", display:"block", marginBottom:"6px" }}>SUPABASE ANON KEY</label>
              <input type="password" value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style={{ width:"100%", background:"#060D14", border:"1px solid #2D3748", borderRadius:"8px", padding:"10px 14px", color:"#E2E8F0", fontFamily:"DM Mono", fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div style={{ flexShrink:0, marginTop:"16px" }}>
              <label style={{ fontFamily:"DM Mono", fontSize:"10px", color:"#64748B", letterSpacing:"0.08em", display:"block", marginBottom:"6px" }}>PROJECT</label>
              <div style={{ fontFamily:"DM Mono", fontSize:"12px", color:"#1aada7", padding:"10px 0" }}>xuxgzrxbwstnlkuejuhj.supabase.co</div>
            </div>
            <div style={{ flexShrink:0, marginTop:"16px" }}>
              <label style={{ fontFamily:"DM Mono", fontSize:"10px", color:"transparent", display:"block", marginBottom:"6px" }}>-</label>
              <button onClick={()=>{ setAnonKey(keyInput); setShowConfig(false); }} style={{ background:"#0B5C45", border:"none", color:"white", padding:"10px 24px", borderRadius:"8px", fontFamily:"DM Mono", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>CONNECT</button>
            </div>
            {!anonKey && <div style={{ width:"100%", fontFamily:"DM Mono", fontSize:"11px", color:"#E8922A99" }}>No key entered — formulas and targets visible. Connect Supabase to see live numbers.</div>}
          </div>
        )}

        {/* ── TOP KPIs ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"12px", margin:"20px 0" }}>
          {[
            { label:"SCHOOLS ONBOARDED", val: liveData.schools_onboarded, suffix:"", icon:"🏫" },
            { label:"TOTAL QR SCANS", val: liveData.qr_scans, suffix:"", icon:"📱" },
            { label:"TOTAL SUBMISSIONS", val: liveData.submissions_total, suffix:"", icon:"📋" },
            { label:"COMPLETION RATE", val: liveData.completion_rate, suffix:"%", icon:"✅" },
            { label:"METRICS DEFINED", val: totalMetrics, suffix:"", icon:"📊" },
            { label:"AUTO-CALCULABLE", val: autoCount, suffix:"", icon:"⚡" },
          ].map(k => (
            <div key={k.label} style={{ background:"#0D1117", border:"1px solid #1A2433", borderRadius:"12px", padding:"16px 18px" }}>
              <div style={{ fontFamily:"DM Mono", fontSize:"24px", fontWeight:400, color: k.val !== undefined && k.val !== null ? "#E2E8F0" : "#2D3748", marginBottom:"4px" }}>
                {k.val !== undefined && k.val !== null ? (typeof k.val==="number"?k.val.toLocaleString():k.val)+k.suffix : "—"}
              </div>
              <div style={{ fontFamily:"DM Mono", fontSize:"9px", color:"#475569", letterSpacing:"0.08em" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── FUNDER TABS ── */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", margin:"24px 0 16px", borderBottom:"1px solid #1A2433", paddingBottom:"16px" }}>
          {FUNDER_DATA.map(f => (
            <button key={f.id} onClick={()=>{ setSelectedFunder(f.id); setSelectedCategory(null); }} style={{ background: selectedFunder===f.id ? f.color : "transparent", border:`1px solid ${selectedFunder===f.id ? f.color : "#2D3748"}`, color: selectedFunder===f.id ? "white" : "#64748B", padding:"7px 16px", borderRadius:"8px", fontFamily:"DM Sans", fontSize:"13px", fontWeight: selectedFunder===f.id ? 600 : 400, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {f.name}
            </button>
          ))}
        </div>

        {/* ── FUNDER HEADER ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h2 style={{ fontFamily:"Syne", fontSize:"26px", fontWeight:800, color:"#E2E8F0", margin:"0 0 4px" }}>{funder.name}</h2>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              <span style={{ fontFamily:"DM Mono", fontSize:"12px", color:funder.accent }}>ASK: {funder.ask}</span>
              <span style={{ color:"#2D3748" }}>·</span>
              <span style={{ fontFamily:"DM Mono", fontSize:"12px", color:"#64748B" }}>{funder.period}</span>
              <span style={{ color:"#2D3748" }}>·</span>
              <span style={{ fontFamily:"DM Mono", fontSize:"12px", color:"#64748B" }}>{funder.schools} schools</span>
              <span style={{ color:"#2D3748" }}>·</span>
              <span style={{ fontFamily:"DM Mono", fontSize:"12px", color:"#64748B" }}>{funder.categories.reduce((s,c)=>s+c.metrics.length,0)} metrics</span>
            </div>
            <p style={{ fontFamily:"DM Sans", fontSize:"13px", color:"#475569", margin:"6px 0 0" }}>{funder.note}</p>
          </div>
          <button onClick={refresh} disabled={!anonKey||loading} style={{ background: anonKey?"#0B5C4522":"transparent", border:`1px solid ${anonKey?"#0B5C4544":"#1A2433"}`, color: anonKey?"#1aada7":"#2D3748", padding:"8px 16px", borderRadius:"8px", fontFamily:"DM Mono", fontSize:"11px", cursor:anonKey?"pointer":"default", fontWeight:600 }}>
            {loading ? "FETCHING..." : "↻ REFRESH DATA"}
          </button>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"20px" }}>
          {funder.categories.map(cat => (
            <button key={cat.name} onClick={()=>setSelectedCategory(cat.name === selectedCategory ? null : cat.name)} style={{ background: (selectedCategory===cat.name||(selectedCategory===null&&cat===funder.categories[0])) ? funder.accent+"22" : "transparent", border:`1px solid ${(selectedCategory===cat.name||(selectedCategory===null&&cat===funder.categories[0]))?funder.accent+"66":"#2D3748"}`, color: (selectedCategory===cat.name||(selectedCategory===null&&cat===funder.categories[0]))?funder.accent:"#64748B", padding:"5px 14px", borderRadius:"6px", fontFamily:"DM Mono", fontSize:"11px", cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s" }}>
              {cat.name} <span style={{ opacity:0.6 }}>({cat.metrics.length})</span>
              <span style={{ marginLeft:"6px", fontSize:"9px", opacity:0.7 }}>{cat.freq}</span>
            </button>
          ))}
        </div>

        {/* ── METRICS GRID ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"14px" }}>
          {(category||funder.categories[0]).metrics.map(m => (
            <MetricCard key={m.name} metric={m} liveData={liveData} onClick={setActiveMetric}/>
          ))}
        </div>

        {/* ── LEGEND ── */}
        <div style={{ display:"flex", gap:"20px", flexWrap:"wrap", marginTop:"28px", padding:"16px 20px", background:"#0A1520", border:"1px solid #1A2433", borderRadius:"12px" }}>
          <span style={{ fontFamily:"DM Mono", fontSize:"10px", color:"#475569", letterSpacing:"0.06em" }}>METRIC TYPES:</span>
          {[["AUTO","#0B5C45","Fetched directly from Supabase"],["CALC","#1aada7","Derived from Supabase data (formula applied)"],["TRIX","#E8922A","Calculated by Apps Script, stored in Trix → Supabase"],["MANUAL","#6b7280","Field input or external data required"]].map(([l,c,d])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{ background:c+"22", color:c, padding:"1px 8px", borderRadius:"10px", fontSize:"10px", fontFamily:"DM Mono", fontWeight:600 }}>{l}</span>
              <span style={{ fontFamily:"DM Sans", fontSize:"11px", color:"#475569" }}>{d}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── FORMULA MODAL ── */}
      {activeMetric && <FormulaModal metric={activeMetric} onClose={()=>setActiveMetric(null)}/>}

    </div>
  );
}

/* ── PASSWORD GATE ───────────────────────────────────────────────────────── */
const GATE_PASSWORD = "catalystbox2026";
const STORAGE_KEY   = "cb_internal_auth";
const SESSION_HOURS = 8; // auto-logout after 8 hours

function PasswordGate({ onUnlock }) {
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  function attempt() {
    if (input === GATE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }));
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060D14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "DM Sans",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        .gate-card { animation: fadeUp 0.5s ease forwards; }
        .gate-input:focus { outline: none; border-color: #0B5C45 !important; box-shadow: 0 0 0 3px #0B5C4520; }
        .gate-btn:hover { background: #0d7a5a !important; }
        .gate-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="gate-card" style={{
        background: "#0A1520",
        border: "1px solid #1A2433",
        borderRadius: "20px",
        padding: "48px 44px",
        width: "100%",
        maxWidth: "420px",
        textAlign: "center",
        animation: shake ? "shake 0.5s ease" : undefined,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #0B5C45, #1aada7)",
            borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "22px",
          }}>⬡</div>
          <h1 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "24px", color: "#E2E8F0", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            CATALYST<span style={{ color: "#0B5C45" }}>BOX</span>
          </h1>
          <p style={{ fontFamily: "DM Mono", fontSize: "11px", color: "#475569", margin: 0, letterSpacing: "0.08em" }}>
            INTERNAL IMPACT DASHBOARD
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #1A2433, transparent)", marginBottom: "28px" }}/>

        <p style={{ fontFamily: "DM Sans", fontSize: "14px", color: "#64748B", marginBottom: "24px", lineHeight: 1.6 }}>
          This dashboard contains unpublished impact metrics and CSR proposal data.<br/>
          <span style={{ color: "#475569" }}>Enter access password to continue.</span>
        </p>

        {/* Input */}
        <input
          className="gate-input"
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Enter password"
          style={{
            width: "100%",
            background: "#060D14",
            border: `1px solid ${error ? "#ef4444" : "#2D3748"}`,
            borderRadius: "10px",
            padding: "13px 16px",
            color: "#E2E8F0",
            fontFamily: "DM Mono",
            fontSize: "14px",
            marginBottom: "8px",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
            letterSpacing: "0.1em",
          }}
          autoFocus
        />

        {error && (
          <p style={{ fontFamily: "DM Mono", fontSize: "11px", color: "#ef4444", margin: "0 0 12px", textAlign: "left" }}>
            Incorrect password. Try again.
          </p>
        )}

        {!error && <div style={{ height: "20px" }}/>}

        <button
          className="gate-btn"
          onClick={attempt}
          style={{
            width: "100%",
            background: "#0B5C45",
            border: "none",
            color: "white",
            padding: "13px",
            borderRadius: "10px",
            fontFamily: "DM Mono",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.06em",
            transition: "background 0.15s",
          }}
        >
          UNLOCK DASHBOARD →
        </button>

        <p style={{ fontFamily: "DM Mono", fontSize: "10px", color: "#1E2A35", marginTop: "20px" }}>
          Fresh Eye Foundation · Internal Use Only
        </p>
      </div>
    </div>
  );
}

/* ── ROOT EXPORT WITH GATE ───────────────────────────────────────────────── */
export default function CatalystBoxDashboard() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      const { ts } = JSON.parse(stored);
      const hoursElapsed = (Date.now() - ts) / (1000 * 60 * 60);
      return hoursElapsed < SESSION_HOURS;
    } catch { return false; }
  });

  function handleUnlock() { setUnlocked(true); }
  function handleLock() {
    localStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
  }

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />;

  return (
    <div style={{ position: "relative" }}>
      {/* Lock button — always visible when logged in */}
      <button
        onClick={handleLock}
        title="Lock dashboard"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          background: "#0A1520",
          border: "1px solid #2D3748",
          color: "#475569",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "15px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >🔒</button>
      <CatalystBoxDashboardInner />
    </div>
  );
}
