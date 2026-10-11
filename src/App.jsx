// =====================================================================================
// App.jsx — the WHOLE site: a one-page eight-stage journey that can be told two ways
// (RPA or Agentic AI, switched with the toggle in the nav), the About/Contact
// subpages, and the /admin content editor. Everything lives in
// this single file on purpose — after initial setup, updating the site is just
// re-uploading this one file (main.jsx, index.html, vite.config.js etc. are one-time
// scaffolding you shouldn't need to touch again).
//
// EVERYTHING you'd normally touch lives in the CONFIG block below:
//   THEME       — the two-color palette + derived tones
//   STAGE_META  — structural stage data shared by both stories (id + icon, in order)
//   CONTENT     — ALL text, for both stories: CONTENT.rpa / CONTENT.ai. This is the
//                 one place to edit copy.
//
// TO ADD A SECTION to any stage (or to About/Contact), push another {heading, body}
// object into that stage's `blocks` array — in RPA_CONTENT and/or AI_CONTENT — or
// into about.sections / contact.sections. Nothing else needs to change. Easier: use
// the /admin panel, which edits and saves this same data (see the ADMIN section below).
//
// TO ADD A THIRD STORY: add a block to CONTENT (copy AI_CONTENT's shape) and add it
// to the MODES array below so it shows up in the toggle.
//
// LOGO: set LOGO.src (next to the Logo component) to a file in /public.
//
// FIREBASE: set FIREBASE_ENABLED to true and fill in firebaseConfig once you've
// created a project — see README.md. Content then syncs live via Firestore
// (collection "siteContent", one doc per story) instead of just this browser's
// localStorage.
//
// STRUCTURE OF THIS FILE, top to bottom:
//   1. Config: THEME, MODES, STAGE_META, CONTENT
//   2. Content persistence: useSiteContent / saveSiteContent / resetSiteContent
//   3. Shared UI: GlobalStyles, Logo, nav, progress rail, scroll helpers
//   4. HomeSection   — the "/" one-page journey
//   5. AboutSection  — the "/about" route
//   6. ContactSection — the "/contact" route
//   7. AdminSection  — the "/admin" content editor
//   8. Default export `App` — composes the four routes above (mounted by main.jsx)
// =====================================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import {
  Search, ClipboardList, Compass, Code2, FlaskConical, Rocket, Activity,
  TrendingUp, Menu, X, ArrowUpRight, Mail, Github, Linkedin,
  FileText, MessageSquare, BarChart3, Target, Check, Plug, Terminal, Bot, Bell, RefreshCw, Wrench, Network,
} from "lucide-react";

// ---------------------------------------------------------------------------
// FIREBASE (optional — off by default so the site works with zero setup)
// ---------------------------------------------------------------------------
export const FIREBASE_ENABLED = true; // flip to true once firebaseConfig is filled in

export const firebaseConfig = {
  apiKey: "AIzaSyD9LFCTjC9KNoNBCKXuglTiMBT8Nt4mxFM",
  authDomain: "senior-automation-engineer.firebaseapp.com",
  projectId: "senior-automation-engineer",
  storageBucket: "senior-automation-engineer.firebasestorage.app",
  messagingSenderId: "175332574553",
  appId: "1:175332574553:web:38905f1fdc2d3025073848",
};

// ---------------------------------------------------------------------------
// THEME
// ---------------------------------------------------------------------------
export const THEME = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "rgba(37, 99, 235, 0.08)",
  paper: "#FFFFFF",
  paperDim: "#F8FAFC",
  ink: "#0F172A",
  inkSoft: "#64748B",
  line: "rgba(15, 23, 42, 0.08)",
};

// ---------------------------------------------------------------------------
// MODES — the two stories the site can tell. The toggle in the nav switches
// between them; each has its own block in CONTENT (same shape).
// ---------------------------------------------------------------------------
export const MODES = [
  { code: "rpa", label: "RPA" },
  { code: "ai", label: "Agentic AI" },
];
export const MODE_STORAGE_KEY = "site-mode";
// RPA keeps using the old "en" storage id (Firestore doc + localStorage key),
// so anything you saved in /admin before this switch still loads.
const storageId = (mode) => (mode === "rpa" ? "en" : mode);

// ---------------------------------------------------------------------------
// STAGE_META — structural only (id + icon + order). Text lives in CONTENT.
// ---------------------------------------------------------------------------
export const STAGE_META = [
  { id: "identify", icon: Search },
  { id: "assess", icon: ClipboardList },
  { id: "design", icon: Compass },
  { id: "develop", icon: Code2 },
  { id: "test", icon: FlaskConical },
  { id: "deploy", icon: Rocket },
  { id: "monitor", icon: Activity },
  { id: "improve", icon: TrendingUp },
];

// ---------------------------------------------------------------------------
// CONTENT — every string on the site, for both stories (RPA and Agentic AI).
// This is the file's single source of truth for copy. RPA_CONTENT is the
// original story; AI_CONTENT (below it) copies it and overrides what differs.
// ---------------------------------------------------------------------------
const RPA_CONTENT = {
  name: "Mats Østvig",
  role: "Senior Automation Engineer",
  tagline: "I run every automation through the same eight stages — from spotting the problem to proving the hours it saved.",
  heroLede: "Every engagement runs through the same eight-stage lifecycle below — scroll to walk through it, or jump straight to a stage from the menu.",
  ctaStart: "Start a conversation",
  ctaProcess: "See the process",
  navNews: "News",
  navProjects: "Projects",
  navAbout: "About",
  navContact: "Contact",
  socials: { email: "mats.ostvig@example.com", github: "https://github.com/", linkedin: "https://linkedin.com/" },
  stages: {
    identify: {
      title: "Identify", kicker: "STAGE 01 / 08",
      summary: "Find the workflows that are actually worth automating — high frequency, rule-based, and painful enough that people already want it gone.",
      blocks: [
        { heading: "Where candidates come from", body: "Shadowing sessions, team interviews, and time-tracking data surface repetitive work before it's ever formally requested." },
        { heading: "What disqualifies a process", body: "Low frequency, constantly-changing rules, or heavy judgment calls — those stay manual, or get redesigned first." },
      ],
    },
    assess: {
      title: "Assess", kicker: "STAGE 02 / 08",
      summary: "Score each candidate on effort, risk, and expected time saved, so the roadmap is ranked by return — not by whoever asked loudest.",
      blocks: [
        { heading: "Scoring model", body: "Volume × minutes saved per run, weighed against build complexity and system stability." },
        { heading: "Stakeholder sign-off", body: "Nothing enters the build queue without the process owner agreeing on the target outcome." },
      ],
    },
    design: {
      title: "Design", kicker: "STAGE 03 / 08",
      summary: "Map the process end to end — including exceptions — before a single line of automation gets built.",
      blocks: [
        { heading: "Swimlane maps", body: "Every actor, decision point, and handoff, drawn in BPMN 2.0 and validated by the people who do the work." },
        { heading: "Exception paths", body: "The edge cases get designed on purpose, not discovered in production." },
      ],
    },
    develop: {
      title: "Develop", kicker: "STAGE 04 / 08",
      summary: "Build with the simplest reliable tool — an API integration, a scheduled script, or an RPA bot when the system leaves no other way in.",
      blocks: [
        { heading: "Tool selection", body: "APIs first, scripts for data movement, RPA only for closed systems with no programmatic access." },
        { heading: "Built-in fallbacks", body: "Anything the automation can't confidently resolve routes to a human — never silently dropped." },
      ],
    },
    test: {
      title: "Test", kicker: "STAGE 05 / 08",
      summary: "Run it against real historical data and real edge cases before it ever touches production.",
      blocks: [
        { heading: "Parallel run", body: "The automation runs alongside the manual process for a cycle, and outputs are diffed line by line." },
        { heading: "Failure injection", body: "Bad data, timeouts, and missing fields are tested on purpose, not hoped against." },
      ],
    },
    deploy: {
      title: "Deploy", kicker: "STAGE 06 / 08",
      summary: "Ship with a rollback plan, clear ownership, and a handoff the team can actually maintain.",
      blocks: [
        { heading: "Staged rollout", body: "New automations run in shadow mode, then on a subset of cases, before taking the full load." },
        { heading: "Documentation & handoff", body: "Plain-language run logs and a walkthrough session, so the automation survives me moving on." },
      ],
    },
    monitor: {
      title: "Monitor", kicker: "STAGE 07 / 08",
      summary: "Every automation reports what it did, so drift and failures surface in days, not months.",
      blocks: [
        { heading: "Health dashboards", body: "Run counts, exception rates, and time saved, tracked per automation and reviewed monthly." },
        { heading: "Alerting", body: "Failures page a human immediately — automation should never fail silently." },
      ],
    },
    improve: {
      title: "Improve", kicker: "STAGE 08 / 08",
      summary: "Re-measure against the original baseline, then feed what's learned back into the next Identify pass.",
      blocks: [
        { heading: "Baseline vs. actual", body: "The 30/90-day numbers get compared against the original estimate, in public, on the dashboard." },
        { heading: "Back to stage one", body: "Every improve cycle surfaces the next candidate — the loop is the point." },
      ],
    },
  },
  news: {
    kicker: "LATEST", heading: "News",
    items: [
      { id: "n1", date: "2026-08", title: "Cut invoice matching from 27 hrs/week to under 1", body: "New bot handles matching across two legacy systems with no shared API." },
      { id: "n2", date: "2026-05", title: "Speaking at OpsAutomate Summit", body: "A talk on measuring automation ROI honestly, not optimistically." },
    ],
  },
  projects: {
    kicker: "SELECTED WORK", heading: "Projects",
    items: [
      { id: "p1", tag: "RPA", title: "Invoice matching bot", body: "UiPath bot matching invoices to purchase orders across two legacy systems." },
      { id: "p2", tag: "Script", title: "Shipment reconciliation pipeline", body: "Scheduled Python job replacing a 14-hour/week manual spreadsheet process." },
      { id: "p3", tag: "Integration", title: "Expense approval routing", body: "Power Automate flow cutting average approval time from 6 days to 9 hours." },
    ],
  },
  ctaBand: {
    heading: "Have a process that's outgrown your team's patience?",
    body: "Send a short description of the workflow — I'll tell you honestly whether it's worth automating.",
    button: "Get in touch",
  },
  about: {
    kicker: "ABOUT",
    heading: "Operations background, engineering habits.",
    intro: "Nine years moving from running an operations desk to building the systems that replaced the slow parts of it.",
    sections: [
      { heading: "2023 — Now · Senior Automation Engineer, Northgate Financial Services", body: "Own the automation roadmap for finance operations: AP/AR processing, reconciliation, and reporting, with a standing time-savings dashboard reviewed monthly by ops leadership." },
      { heading: "2020 — 2023 · Process Automation Engineer, Harrow Logistics Group", body: "Led process discovery across warehousing and dispatch, translating floor-level workflows into automations that cut manual reconciliation from 14 hours/week to under 1." },
      { heading: "2017 — 2020 · Business Process Analyst, Corvin & Wade Consulting", body: "Mapped and redesigned back-office processes for mid-market clients — and learned that a process map nobody recognizes is worse than no map at all." },
      { heading: "Certifications", body: "UiPath Advanced RPA Developer · Lean Six Sigma Green Belt · Microsoft Power Platform Fundamentals." },
    ],
    skillsHeading: "TOOLBELT",
    skills: ["UiPath", "Power Automate", "Python", "SQL", "BPMN 2.0", "REST APIs", "Azure Logic Apps", "Power BI"],
    ctaHeading: "Want the long version?",
    ctaBody: "Happy to walk through specific projects and what I'd have done differently.",
    ctaButton: "Get in touch",
  },
  contact: {
    kicker: "CONTACT",
    heading: "Tell me about the process that's slowing you down.",
    intro: "A few sentences on the task, how often it happens, and who's stuck doing it is plenty to start with.",
    formEndpoint: "",
    sections: [
      { heading: "Email", body: "mats.ostvig@example.com" },
      { heading: "LinkedIn", body: "linkedin.com/in/matsostvig" },
      { heading: "Based in", body: "Remote — open to on-site engagements" },
    ],
    form: {
      name: "Name", email: "Email", message: "What process are we talking about?",
      submit: "Send message", sending: "Sending…",
      sent: "Thanks — I'll be in touch.", error: "Something went wrong — email me directly instead.",
    },
  },
  identifyDemo: {
    label: "WORKFLOW DISCOVERY",
    scanning: "Scanning workflow…",
    complete: "Scan complete",
    pending: "Review pending",
    candidate: "Automate",
    skip: "Keep manual",
    summaryCandidate: "to automate",
    summarySkip: "stay manual",
    cards: [
      { title: "Invoice entry", sub: "Finance workflow", freq: "Daily", attrs: ["High frequency", "Rule-based", "Structured data"] },
      { title: "Customer escalation", sub: "Support workflow", freq: "Daily", attrs: ["Varies", "Judgment calls", "Many exceptions"] },
      { title: "Report consolidation", sub: "Operations workflow", freq: "Daily", attrs: ["High frequency", "Repeatable steps", "Stable rules"] },
      { title: "Annual strategy review", sub: "Leadership workflow", freq: "Yearly", attrs: ["Low frequency", "Changing rules", "Open-ended"] },
    ],
  },
  assessDemo: {
    label: "ASSESSMENT",
    cols: ["Time saved", "Effort", "Risk"],
    scoring: "Scoring candidates…",
    ranked: "Ranked by return",
    top: "Build first",
    chips: ["Volume × time saved", "Build complexity", "System stability"],
    rows: ["Expense approvals", "Invoice matching", "Report consolidation"],
  },
  designDemo: {
    label: "PROCESS MAP",
    mapping: "Mapping process…",
    mapped: "Map complete — exceptions included",
    lanes: ["AUTOMATION", "HUMAN"],
    nodes: ["Receive", "Validate", "Match?", "Post", "Human review"],
    yes: "yes",
    no: "no",
    chips: ["5 steps", "1 decision", "1 exception path"],
  },
  developDemo: {
    label: "TOOL SELECTION",
    situation: "Situation",
    scenarios: ["The system has an API", "It's just moving data on a schedule", "Closed system, no API"],
    tools: [
      { name: "API integration", rank: "1st choice" },
      { name: "Scheduled script", rank: "2nd choice" },
      { name: "RPA bot", rank: "Last resort" },
    ],
    choosing: "Picking the simplest reliable tool…",
    done: "Simplest reliable tool wins",
    summary: "Simplest reliable tool first",
    chips: ["APIs first", "Scripts for data", "RPA last"],
  },
  testDemo: {
    label: "PARALLEL RUN",
    cols: ["Record", "Manual", "Automation"],
    running: "Comparing results…",
    passed: "All results match",
    chips: ["Bad data caught", "Timeout handled", "Missing field handled"],
  },
  deployDemo: {
    label: "ROLLOUT",
    stages: ["Shadow mode", "Subset of cases", "Full load"],
    bar: "Cases handled by automation",
    rolling: "Rolling out…",
    done: "Live and handed over",
    rollback: "Rollback plan ready",
    handoff: "Handoff docs & walkthrough",
    chips: ["Rollback plan", "Clear ownership", "Handoff"],
  },
  monitorDemo: {
    label: "LIVE DASHBOARD",
    kpis: ["Runs", "Exceptions", "Hours saved"],
    healthy: "All runs healthy",
    alert: "Failure detected — human alerted",
    resolved: "Resolved — back to normal",
    monitoring: "Monitoring runs…",
    watching: "Monitoring continues",
    chips: ["Run counts", "Exception rate", "Time saved"],
  },
  improveDemo: {
    label: "RE-MEASURE",
    baseline: { label: "Baseline estimate", value: "160 h/week" },
    measured: { label: "Measured at 90 days", value: "216 h/week" },
    delta: "+35% vs. estimate",
    measuring: "Re-measuring…",
    done: "Fed back into the next cycle",
    next: { tag: "NEW CANDIDATE", title: "Expense approvals", sub: "Back to Identify" },
    chips: ["Re-measure", "Compare to baseline", "Feed back"],
  },
  footer: { backHome: "← Back home" },
};

// ---------------------------------------------------------------------------
// Agentic AI story. Starts as a copy of the RPA content (so About, Contact,
// footer etc. are shared by default) and overrides everything that changes:
// hero text, the eight stages, news, projects, and all the animation text.
// ---------------------------------------------------------------------------
const AI_CONTENT = {
  ...RPA_CONTENT,
  tagline: "I take every AI agent through the same eight stages — from picking the right job to proving it can be trusted with it.",
  heroLede: "Every agent runs through the same eight-stage lifecycle below — scroll to walk through it, or jump straight to a stage from the menu.",
  stages: {
    identify: {
      title: "Identify", kicker: "STAGE 01 / 08",
      summary: "Find the work where judgment, language, or messy input is the bottleneck — the kind rules alone can't handle.",
      blocks: [
        { heading: "Where candidates come from", body: "Inboxes, tickets, documents and \"it depends\" decisions — work where people read, interpret and decide before they act." },
        { heading: "What disqualifies a task", body: "Zero tolerance for error, irreversible actions, or a perfectly good deterministic rule — those stay with RPA or with people." },
      ],
    },
    assess: {
      title: "Scope", kicker: "STAGE 02 / 08",
      summary: "Decide how much autonomy the agent earns: what it may read, decide and do — and what always goes to a human.",
      blocks: [
        { heading: "Value, effort and risk", body: "Value per task weighed against build effort, the cost of a wrong answer, and how ready the data really is." },
        { heading: "Autonomy levels", body: "Suggest, then act with approval, then act within limits — each level has to be earned with evidence." },
      ],
    },
    design: {
      title: "Design", kicker: "STAGE 03 / 08",
      summary: "Design the agent: its goal, the tools it may call, what it remembers, and the guardrails around every action.",
      blocks: [
        { heading: "Tools and permissions", body: "Least-privilege access: each tool gets only the permissions the task needs, and nothing standing." },
        { heading: "Guardrails and escalation", body: "Confidence thresholds, approval steps and hard limits are designed in — not bolted on after the first incident." },
      ],
    },
    develop: {
      title: "Build", kicker: "STAGE 04 / 08",
      summary: "Build with the simplest pattern that works — a single prompt first, a tool-using agent only when it must act, multiple agents almost never.",
      blocks: [
        { heading: "Start small", body: "Prompt and retrieval first. Add tools, memory and loops only when an evaluation shows they're needed." },
        { heading: "Deterministic where possible", body: "Rules, schemas and validation wrap the model, so the creative part is small and everything else is predictable." },
      ],
    },
    test: {
      title: "Evaluate", kicker: "STAGE 05 / 08",
      summary: "Test the agent against real cases and adversarial ones before it touches production — an eval set, not a demo.",
      blocks: [
        { heading: "Eval sets", body: "Real historical cases with known answers, scored automatically and re-run on every change." },
        { heading: "Red-teaming", body: "Prompt injection, hallucinations and broken tools are tested on purpose — and every failure becomes a permanent test case." },
      ],
    },
    deploy: {
      title: "Deploy", kicker: "STAGE 06 / 08",
      summary: "Ship with autonomy on a dial: shadow first, then human approval per action, then limited independence — plus a kill switch.",
      blocks: [
        { heading: "Staged autonomy", body: "Shadow mode, approval on every action, then autonomy within limits — promoted only on evidence." },
        { heading: "Kill switch and ownership", body: "One switch to pause it, a named owner, and a runbook the team can actually follow." },
      ],
    },
    monitor: {
      title: "Observe", kicker: "STAGE 07 / 08",
      summary: "Every run leaves a trace — inputs, tool calls, decisions and cost — so drift and failures show up in days, not months.",
      blocks: [
        { heading: "Traces and quality", body: "Full traces, quality scores and cost per task, reviewed on a regular cadence." },
        { heading: "Escalation by design", body: "Low-confidence or out-of-policy runs go to a person immediately, with the full context attached." },
      ],
    },
    improve: {
      title: "Improve", kicker: "STAGE 08 / 08",
      summary: "Turn production feedback into better evals, prompts and tools — and decide which parts can now run with less oversight.",
      blocks: [
        { heading: "Feedback into evals", body: "Corrections and escalations become new test cases, so the same mistake can't happen twice." },
        { heading: "Earn more autonomy", body: "When the numbers hold, the agent graduates to a higher autonomy level — and the loop starts over." },
      ],
    },
  },
  news: {
    kicker: "LATEST", heading: "News",
    items: [
      { id: "n1", date: "2026-09", title: "Support triage agent resolves 62% of tickets without a human", body: "Shadow-mode evals first, then staged autonomy with a kill switch." },
      { id: "n2", date: "2026-06", title: "Talk: earning autonomy — promoting an AI agent safely", body: "Evals, guardrails and staged rollout, in practice." },
    ],
  },
  projects: {
    kicker: "SELECTED WORK", heading: "Projects",
    items: [
      { id: "p1", tag: "Agent", title: "Support triage agent", body: "Reads tickets, drafts replies, and routes the hard ones to a human." },
      { id: "p2", tag: "RAG", title: "Policy answer assistant", body: "Answers staff questions from internal documents, with citations." },
      { id: "p3", tag: "Agent", title: "Invoice exceptions agent", body: "Investigates mismatches across systems and proposes the fix for approval." },
    ],
  },
  ctaBand: {
    heading: "Wondering where an AI agent would actually help — and where it wouldn't?",
    body: "Send a short description of the work — I'll tell you honestly whether it's a job for an agent, for rules, or for people.",
    button: "Get in touch",
  },
  identifyDemo: {
    label: "USE-CASE DISCOVERY",
    scanning: "Scanning use cases…",
    complete: "Scan complete",
    pending: "Review pending",
    candidate: "Use an agent",
    skip: "Rules or RPA",
    summaryCandidate: "fit for an agent",
    summarySkip: "better as rules or RPA",
    cards: [
      { title: "Support ticket triage", sub: "Customer support", freq: "Daily", attrs: ["Free-text input", "Needs judgment", "Many phrasings"] },
      { title: "Payroll calculation", sub: "Finance", freq: "Monthly", attrs: ["Exact rules", "Zero error margin", "Deterministic"] },
      { title: "Contract clause review", sub: "Legal operations", freq: "Weekly", attrs: ["Dense documents", "Needs reading", "Human signs off"] },
      { title: "Wire transfer approval", sub: "Treasury", freq: "Daily", attrs: ["Irreversible", "High stakes", "Hard limits"] },
    ],
  },
  assessDemo: {
    label: "SCOPING",
    cols: ["Value", "Effort", "Risk"],
    scoring: "Scoring use cases…",
    ranked: "Ranked by value and risk",
    top: "Pilot first",
    chips: ["Value per task", "Cost of an error", "Data readiness"],
    rows: ["Contract clause review", "Support ticket triage", "Invoice exceptions"],
  },
  designDemo: {
    label: "AGENT BLUEPRINT",
    mapping: "Mapping the agent…",
    mapped: "Blueprint complete — guardrails included",
    lanes: ["AGENT", "HUMAN"],
    nodes: ["Receive", "Plan", "Sure?", "Act", "Human approval"],
    yes: "yes",
    no: "no",
    chips: ["5 steps", "1 checkpoint", "1 escalation path"],
  },
  developDemo: {
    label: "AGENT PATTERN",
    situation: "Situation",
    scenarios: ["It only needs to understand or draft text", "It must look things up and take actions", "It truly needs several specialists working together"],
    tools: [
      { name: "Single prompt", rank: "1st choice" },
      { name: "Tool-using agent", rank: "2nd choice" },
      { name: "Multi-agent system", rank: "Last resort" },
    ],
    choosing: "Picking the simplest pattern that works…",
    done: "Simplest pattern wins",
    summary: "Simplest pattern first",
    chips: ["Prompt first", "Tools when needed", "Agents last"],
  },
  testDemo: {
    label: "EVAL RUN",
    cols: ["Case", "Expected", "Agent"],
    running: "Scoring against the eval set…",
    passed: "All eval cases pass",
    chips: ["Prompt injection blocked", "Hallucination caught", "Tool failure handled"],
  },
  deployDemo: {
    label: "AUTONOMY ROLLOUT",
    stages: ["Shadow mode", "Human approves", "Acts within limits"],
    bar: "Tasks handled by the agent",
    rolling: "Raising autonomy…",
    done: "Live, with a kill switch",
    rollback: "Kill switch ready",
    handoff: "Runbook and named owner",
    chips: ["Kill switch", "Clear ownership", "Runbook"],
  },
  monitorDemo: {
    label: "AGENT DASHBOARD",
    kpis: ["Tasks", "Escalations", "Hours saved"],
    healthy: "All tasks within policy",
    alert: "Low-confidence answer — escalated to a human",
    resolved: "Reviewed — added to the eval set",
    monitoring: "Tracing every run…",
    watching: "Tracing continues",
    chips: ["Traces", "Cost per task", "Quality score"],
  },
  improveDemo: {
    label: "RE-EVALUATE",
    baseline: { label: "Baseline estimate", value: "160 h/week" },
    measured: { label: "Measured at 90 days", value: "216 h/week" },
    delta: "+35% vs. estimate",
    measuring: "Re-evaluating…",
    done: "Fed back into evals and the next cycle",
    next: { tag: "NEXT CANDIDATE", title: "Contract clause review", sub: "Back to Identify" },
    chips: ["Re-evaluate", "Compare to baseline", "Feed back"],
  },
};

export const CONTENT = { rpa: RPA_CONTENT, ai: AI_CONTENT };

// =====================================================================================
// Mode hook — remembers RPA / Agentic AI in localStorage so the choice survives
// page and route changes (this file doesn't assume a shared React context).
// =====================================================================================
export function useMode() {
  const [mode, setModeState] = useState(() => {
    if (typeof window === "undefined") return "rpa";
    try {
      const v = localStorage.getItem(MODE_STORAGE_KEY);
      return MODES.some((m) => m.code === v) ? v : "rpa";
    } catch { return "rpa"; }
  });
  function setMode(code) {
    setModeState(code);
    try { localStorage.setItem(MODE_STORAGE_KEY, code); } catch {}
  }
  return [mode, setMode];
}

export function ModeSwitcher({ mode, setMode }) {
  return (
    <div className="rpa-mode" role="group" aria-label="Story: RPA or Agentic AI">
      {MODES.map((m) => (
        <button
          key={m.code}
          type="button"
          className={mode === m.code ? "active" : ""}
          onClick={() => setMode(m.code)}
          aria-pressed={mode === m.code}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// =====================================================================================
// Content persistence — one Firestore document per language (collection
// "siteContent", doc id = mode code) holds the whole CONTENT[mode] shape.
// The public site reads it live; the AdminSection below writes it.
// Falls back to localStorage if Firebase isn't enabled, and to the hardcoded
// CONTENT[mode] above if nothing has been saved yet — so the site always
// renders something sensible.
// =====================================================================================
const CONTENT_COLLECTION = "siteContent";
const contentOverrideKey = (mode) => `site-content-override-${storageId(mode)}`;

// The animation text (every *Demo block) is controlled from code, not from the
// admin panel — so any saved copy of it is ignored. That keeps old saved data
// from ever breaking the animations when their shape changes.
function withoutDemos(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  Object.keys(out).forEach((k) => { if (/Demo$/.test(k)) delete out[k]; });
  return out;
}

function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override;
  if (base && override && typeof base === "object" && typeof override === "object") {
    const out = { ...base };
    for (const key of Object.keys(override)) out[key] = deepMerge(base[key], override[key]);
    return out;
  }
  return override;
}

function readLocalOverride(mode) {
  try {
    const raw = localStorage.getItem(contentOverrideKey(mode));
    return raw ? withoutDemos(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

// Reads the current merged content once (default merged with any local
// override) — used to seed the admin panel's editable draft.
export function getEditableContent(mode) {
  const local = readLocalOverride(mode);
  return local ? deepMerge(CONTENT[mode], local) : CONTENT[mode];
}

// Live content for the public-facing pages: defaults → local override → Firebase.
export function useSiteContent(mode) {
  const [content, setContent] = useState(() => deepMerge(CONTENT[mode], readLocalOverride(mode)));
  const [source, setSource] = useState(() => (readLocalOverride(mode) ? "local" : "default"));

  useEffect(() => {
    const local = readLocalOverride(mode);
    setContent(deepMerge(CONTENT[mode], local));
    setSource(local ? "local" : "default");

    if (!FIREBASE_ENABLED) return;
    let unsub = () => {};
    (async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getFirestore, doc, onSnapshot } = await import("firebase/firestore");
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getFirestore(app);
        unsub = onSnapshot(
          doc(db, CONTENT_COLLECTION, storageId(mode)),
          (snap) => {
            if (snap.exists()) {
              setContent(deepMerge(CONTENT[mode], withoutDemos(snap.data())));
              setSource("firebase");
            }
          },
          () => { /* keep local/default content on read error */ }
        );
      } catch (err) {
        console.warn("Firestore content unavailable, using local/default.", err);
      }
    })();
    return () => unsub();
  }, [mode]);

  return [content, source];
}

// Called by AdminSection below. Always mirrors to localStorage (so the admin panel
// works with zero Firebase setup); also writes to Firestore when enabled.
export async function saveSiteContent(mode, rawContent) {
  const content = withoutDemos(rawContent);
  try { localStorage.setItem(contentOverrideKey(mode), JSON.stringify(content)); } catch {}
  if (!FIREBASE_ENABLED) return { ok: true, target: "local" };
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await setDoc(doc(db, CONTENT_COLLECTION, storageId(mode)), content);
    return { ok: true, target: "firebase" };
  } catch (err) {
    console.error(err);
    return { ok: false, target: "firebase", error: err };
  }
}

export function resetSiteContent(mode) {
  try { localStorage.removeItem(contentOverrideKey(mode)); } catch {}
}


// =====================================================================================
// Global styles
// =====================================================================================
export function GlobalStyles() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <style>{`
      :root{
        --rpa-primary: ${THEME.primary}; --rpa-primary-dark: ${THEME.primaryDark}; --rpa-primary-soft: ${THEME.primarySoft};
        --rpa-paper: ${THEME.paper}; --rpa-paper-dim: ${THEME.paperDim};
        --rpa-ink: ${THEME.ink}; --rpa-ink-soft: ${THEME.inkSoft}; --rpa-line: ${THEME.line};
      }
      .rpa-root{ background: var(--rpa-paper); color: var(--rpa-ink); font-family:'Inter',system-ui,sans-serif; line-height:1.6; min-height:100vh; }
      .rpa-root, .rpa-root *{ box-sizing:border-box; }
      html{ scroll-behavior:smooth; }
      .rpa-h{ font-family:'Space Grotesk',sans-serif; font-weight:600; letter-spacing:-0.01em; line-height:1.15; margin:0 0 .5em; }
      .rpa-wrap{ max-width:1120px; margin:0 auto; padding:0 28px; }
      a{ color:inherit; }

      .rpa-nav{ position:sticky; top:0; z-index:40; background:rgba(255,255,255,0.85); backdrop-filter:blur(10px); border-bottom:1px solid var(--rpa-line); }
      .rpa-nav-bar{ display:flex; align-items:center; justify-content:space-between; padding:16px 28px; max-width:1120px; margin:0 auto; }
      .rpa-brand{ display:flex; align-items:center; gap:10px; text-decoration:none; font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--rpa-ink); }
      .rpa-brand .dot{ width:10px; height:10px; border-radius:50%; background:var(--rpa-primary); }
      .rpa-nav-links{ display:flex; gap:6px; align-items:center; }
      .rpa-nav-links a{ text-decoration:none; font-size:0.86rem; font-family:'JetBrains Mono',monospace; padding:8px 12px; border-radius:8px; color:var(--rpa-ink-soft); transition:all .15s ease; white-space:nowrap; }
      .rpa-nav-links a:hover{ color:var(--rpa-ink); background:var(--rpa-paper-dim); }
      .rpa-nav-links a.active{ color:var(--rpa-primary); background:none; font-weight:600; }
      .rpa-nav-sub{ display:flex; gap:14px; align-items:center; margin-left:14px; padding-left:14px; border-left:1px solid var(--rpa-line); }
      .rpa-nav-sub a{ font-family:'Inter',sans-serif; font-weight:600; padding:8px 4px; }
      .rpa-nav-toggle{ display:none; background:none; border:none; cursor:pointer; color:var(--rpa-ink); }
      .rpa-mode{ display:flex; gap:2px; padding:3px; background:var(--rpa-paper-dim); border:1px solid var(--rpa-line); border-radius:10px; }
      .rpa-mode button{ border:none; background:none; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.8rem; line-height:1.2; padding:6px 12px; border-radius:7px; color:var(--rpa-ink-soft); cursor:pointer; white-space:nowrap; transition:all .15s ease; }
      .rpa-mode button:hover{ color:var(--rpa-ink); }
      .rpa-mode button.active{ background:#fff; color:var(--rpa-primary); box-shadow:0 1px 2px rgba(15,23,42,0.12); }
      @media (max-width:980px){
        .rpa-nav-links{ display:none; }
        .rpa-nav-toggle{ display:block; }
        .rpa-nav-links.open{ display:flex; position:absolute; top:100%; left:0; right:0; flex-direction:column; align-items:flex-start; background:var(--rpa-paper); padding:16px 28px; border-bottom:1px solid var(--rpa-line); gap:4px; }
        .rpa-nav-sub{ border-left:none; padding-left:0; margin-left:0; flex-direction:column; align-items:flex-start; gap:10px; margin-top:8px; padding-top:8px; border-top:1px solid var(--rpa-line); }
      }

      .rpa-hero{ position:relative; padding:96px 0 72px; overflow:hidden; }
      .rpa-hero::before{ content:""; position:absolute; top:-120px; right:-120px; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle,var(--rpa-primary-soft) 0%,transparent 70%); z-index:0; }
      .rpa-hero .rpa-wrap{ position:relative; z-index:1; display:grid; grid-template-columns:1.15fr 0.85fr; gap:40px; align-items:start; }
      @media (max-width:900px){ .rpa-hero .rpa-wrap{ grid-template-columns:1fr; } .hero-anim{ display:none; } }
      .rpa-kicker{ font-family:'JetBrains Mono',monospace; font-size:0.82rem; color:var(--rpa-primary-dark); margin-bottom:16px; }
      .rpa-hero h1{ font-size:clamp(1.9rem,3.2vw,2.75rem); line-height:1.22; letter-spacing:-0.015em; max-width:24ch; }
      .rpa-hero .lede{ font-size:1.1rem; color:var(--rpa-ink-soft); max-width:52ch; }

      /* Hero animation: 8-node snake grid with a pulse that travels the loop.
         Every segment between consecutive nodes is exactly 120 units (4 across,
         1 down, 4 back), so a linear-speed dot and linear-fraction node timing
         (i/7) stay mathematically in sync — this is what fixes the drift. */
      .hero-anim{ width:100%; padding-top:36px; }
      .hero-anim svg{ width:100%; height:auto; overflow:visible; }
      .hero-anim .ha-dash{ stroke:var(--rpa-line); stroke-width:1.6; stroke-dasharray:4 5; fill:none; }
      .hero-anim .ha-circle{ fill:var(--rpa-paper); stroke:var(--rpa-line); stroke-width:1.6; transition:stroke .2s ease; }
      .hero-anim .ha-node.lit .ha-circle{ stroke:var(--rpa-primary); }
      .hero-anim .ha-label{ font-family:'JetBrains Mono',monospace; font-size:9.5px; fill:var(--rpa-ink-soft); }
      .hero-anim .ha-dot{
        offset-path: path("M44,44 L164,44 L284,44 L404,44 L404,164 L284,164 L164,164 L44,164");
        animation: haTravel 11s linear infinite;
      }
      @keyframes haTravel{
        0%{ offset-distance:0%; opacity:0; }
        3%{ offset-distance:0%; opacity:1; }
        88%{ offset-distance:100%; opacity:1; }
        92%,100%{ offset-distance:100%; opacity:0; }
      }
      .rpa-cta-row{ display:flex; gap:14px; flex-wrap:wrap; margin-top:8px; }
      .rpa-btn{ display:inline-flex; align-items:center; gap:8px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.94rem; padding:13px 24px; border-radius:10px; text-decoration:none; border:1.5px solid var(--rpa-ink); color:var(--rpa-ink); transition:all .15s ease; }
      .rpa-btn.solid{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .rpa-btn.solid:hover{ background:var(--rpa-primary-dark); border-color:var(--rpa-primary-dark); }
      .rpa-btn:not(.solid):hover{ background:var(--rpa-paper-dim); }
      .rpa-arrow-link{ display:inline-flex; align-items:center; gap:6px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.94rem; color:var(--rpa-primary); text-decoration:none; padding:13px 4px; }
      .rpa-arrow-link:hover{ text-decoration:underline; }

      .rpa-journey{ position:relative; padding-top:24px; }
      .rpa-stage-band{ padding:72px 0; scroll-margin-top:90px; }
      .rpa-stage-band.alt{ background:var(--rpa-paper-dim); }
      .rpa-stage{ scroll-margin-top:90px; max-width:640px; }
      .rpa-stage.has-visual{ max-width:none; display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
      .rpa-stage-text{ max-width:640px; }
      .rpa-stage-visual{ width:100%; }
      @media (max-width:860px){ .rpa-stage.has-visual{ grid-template-columns:1fr; gap:32px; } }

      /* Identify animation: a magnifier scans four workflow cards, each gets a verdict */
      .idv{ background:var(--rpa-paper-dim); border:1px solid var(--rpa-line); border-radius:18px; padding:16px; }
      .idv-head{ display:flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace; font-size:0.64rem; letter-spacing:0.08em; color:var(--rpa-ink-soft); margin-bottom:12px; }
      .idv-dot{ width:6px; height:6px; border-radius:50%; background:var(--rpa-primary); }
      .idv-grid{ position:relative; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .idv-card{ position:relative; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; transition:border-color .3s ease, box-shadow .3s ease, background .3s ease; }
      .idv-card.scanning{ border-color:var(--rpa-primary); box-shadow:0 0 0 3px var(--rpa-primary-soft); }
      .idv-card.done.candidate{ border-color:rgba(37,99,235,0.45); }
      .idv-card.done.skip{ border-color:rgba(220,38,38,0.4); background:#FFFAFA; }
      .idv-card.done.skip .idv-title, .idv-card.done.skip .idv-sub{ color:var(--rpa-ink-soft); }
      .idv-card.done.skip .idv-ico{ background:#FEE2E2; color:#DC2626; }
      .idv-badge{ position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; opacity:0; transform:scale(0.4); transition:opacity .25s ease, transform .35s cubic-bezier(.34,1.56,.64,1); }
      .idv-card.done .idv-badge{ opacity:1; transform:scale(1); }
      .idv-card.candidate .idv-badge{ background:var(--rpa-primary); color:#fff; }
      .idv-card.skip .idv-badge{ background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; }
      .idv-card-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .idv-ico{ width:28px; height:28px; border-radius:8px; background:var(--rpa-primary-soft); color:var(--rpa-primary); display:flex; align-items:center; justify-content:center; }
      .idv-num{ font-family:'JetBrains Mono',monospace; font-size:0.62rem; color:var(--rpa-ink-soft); }
      .idv-title{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.9rem; line-height:1.25; color:var(--rpa-ink); }
      .idv-sub{ font-size:0.72rem; color:var(--rpa-ink-soft); margin-top:2px; }
      .idv-foot{ display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:12px; padding-top:8px; border-top:1px solid var(--rpa-line); font-family:'JetBrains Mono',monospace; font-size:0.6rem; color:var(--rpa-ink-soft); }
      .idv-status{ display:inline-flex; align-items:center; gap:3px; text-align:right; }
      .idv-card.done.candidate .idv-status{ color:var(--rpa-primary-dark); font-weight:500; }
      .idv-card.done.skip .idv-status{ color:#DC2626; font-weight:500; }
      .idv-lens{ position:absolute; width:72px; height:72px; transform:translate(-39%,-39%); pointer-events:none; filter:drop-shadow(0 6px 10px rgba(37,99,235,0.25)); transition:left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1), opacity .4s ease; }
      .idv-lens svg{ animation:idvBob 2.4s ease-in-out infinite; }
      @keyframes idvBob{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(3px,-3px); } }
      .idv-bar{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; margin-top:12px; }
      .idv-bar-row{ display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; color:var(--rpa-ink); margin-bottom:8px; }
      .idv-count{ font-family:'JetBrains Mono',monospace; font-size:0.64rem; color:var(--rpa-ink-soft); }
      .idv-chips{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
      .idv-chip{ font-family:'JetBrains Mono',monospace; font-size:0.6rem; padding:3px 8px; border-radius:999px; border:1px solid var(--rpa-line); color:var(--rpa-ink-soft); opacity:0.5; transition:all .3s ease; }
      .idv-chip.lit{ opacity:1; }
      .idv-chip.lit.candidate{ background:var(--rpa-primary-soft); border-color:var(--rpa-primary); color:var(--rpa-primary-dark); }
      .idv-chip.lit.skip{ background:#FEE2E2; border-color:#FCA5A5; color:#B91C1C; }
      .idv-track{ height:4px; border-radius:2px; background:var(--rpa-line); overflow:hidden; }
      .idv-fill{ height:100%; background:var(--rpa-primary); transition:width .7s linear; }

      /* Stage animations 02-08 (shared panel styles are the .idv-* ones above) */
      .rpa-stage-band.alt .idv{ background:#F1F5F9; }
      .rpa-stage-band.alt .rpa-stage.has-visual .rpa-stage-visual{ order:-1; }
      @media (max-width:860px){ .rpa-stage-band.alt .rpa-stage.has-visual .rpa-stage-visual{ order:0; } }
      .sv-box{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; }

      .sv-assess{ position:relative; }
      .sv-arow{ position:absolute; left:0; right:0; height:72px; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:10px 12px; transition:top .7s cubic-bezier(.4,0,.2,1), border-color .3s ease, box-shadow .3s ease; }
      .sv-arow.best{ border-color:var(--rpa-primary); box-shadow:0 0 0 3px var(--rpa-primary-soft); }
      .sv-arow-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
      .sv-arow-name{ display:flex; align-items:center; gap:6px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.86rem; color:var(--rpa-ink); }
      .sv-arow-name b{ font-family:'JetBrains Mono',monospace; font-size:0.62rem; font-weight:500; color:var(--rpa-primary-dark); }
      .sv-arow-score{ display:flex; align-items:center; gap:6px; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:0.95rem; color:var(--rpa-ink); }
      .sv-tag{ font-family:'JetBrains Mono',monospace; font-size:0.56rem; font-weight:500; padding:2px 6px; border-radius:999px; background:var(--rpa-primary); color:#fff; }
      .sv-metrics{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
      .sv-metric span{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.56rem; color:var(--rpa-ink-soft); margin-bottom:3px; }
      .sv-mtrack{ height:4px; border-radius:2px; background:var(--rpa-line); overflow:hidden; }
      .sv-mfill{ height:100%; width:0; transition:width .7s ease; }
      .sv-mfill.m0{ background:var(--rpa-primary); }
      .sv-mfill.m1{ background:#94A3B8; }
      .sv-mfill.m2{ background:#FCA5A5; }

      .sv-flow{ padding:8px; }
      .sv-flow svg{ width:100%; height:auto; display:block; }
      .sv-flow text{ font-family:'JetBrains Mono',monospace; font-size:9.5px; fill:var(--rpa-ink); }
      .sv-flow text.sv-lane{ font-size:7.5px; fill:var(--rpa-ink-soft); letter-spacing:0.08em; }

      .sv-situation{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; margin-bottom:12px; min-height:64px; }
      .sv-situation small{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.58rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--rpa-ink-soft); margin-bottom:4px; }
      .sv-situation div{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.95rem; color:var(--rpa-ink); }
      .sv-tools{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
      .sv-tool{ position:relative; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 8px; text-align:center; transition:all .3s ease; }
      .sv-tool-ico{ width:30px; height:30px; border-radius:9px; background:var(--rpa-primary-soft); color:var(--rpa-primary); display:flex; align-items:center; justify-content:center; margin:0 auto 8px; }
      .sv-tool-name{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.78rem; line-height:1.2; color:var(--rpa-ink); }
      .sv-tool-rank{ font-family:'JetBrains Mono',monospace; font-size:0.56rem; color:var(--rpa-ink-soft); margin-top:4px; }
      .sv-tool.on{ border-color:var(--rpa-primary); box-shadow:0 0 0 3px var(--rpa-primary-soft); }
      .sv-tool.on .idv-badge{ opacity:1; transform:scale(1); background:var(--rpa-primary); color:#fff; }
      .sv-tool.off{ opacity:0.45; }

      .sv-table{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; overflow:hidden; }
      .sv-thead, .sv-trow{ display:grid; grid-template-columns:1.1fr 1fr 1fr 22px; gap:8px; align-items:center; padding:8px 12px; }
      .sv-thead{ font-family:'JetBrains Mono',monospace; font-size:0.56rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--rpa-ink-soft); border-bottom:1px solid var(--rpa-line); }
      .sv-trow{ font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--rpa-ink); border-bottom:1px solid var(--rpa-line); transition:background .3s ease; }
      .sv-trow:last-child{ border-bottom:none; }
      .sv-trow.active{ background:var(--rpa-primary-soft); }
      .sv-trow.fail{ background:#FEF2F2; }
      .sv-trow .bad{ color:#DC2626; font-weight:500; }
      .sv-tstat{ width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; flex:none; transition:background .3s ease; }
      .sv-tstat.pass{ background:var(--rpa-primary); }
      .sv-tstat.fail{ background:#DC2626; }
      .sv-tstat.pending{ background:var(--rpa-line); }

      .sv-stages{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:12px; }
      .sv-stage{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:10px 12px; opacity:0.55; transition:all .3s ease; }
      .sv-stage.past{ opacity:1; }
      .sv-stage.current{ opacity:1; border-color:var(--rpa-primary); box-shadow:0 0 0 3px var(--rpa-primary-soft); }
      .sv-stage small{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.56rem; color:var(--rpa-ink-soft); margin-bottom:3px; }
      .sv-stage div{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.8rem; line-height:1.2; color:var(--rpa-ink); }
      .sv-load{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; margin-bottom:12px; }
      .sv-load-row{ display:flex; justify-content:space-between; align-items:baseline; font-size:0.74rem; color:var(--rpa-ink-soft); margin-bottom:8px; }
      .sv-load-pct{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.2rem; color:var(--rpa-ink); }
      .sv-load-track{ height:10px; border-radius:5px; background:var(--rpa-line); overflow:hidden; }
      .sv-load-fill{ height:100%; background:var(--rpa-primary); transition:width .9s cubic-bezier(.4,0,.2,1); }
      .sv-checks{ display:grid; gap:8px; }
      .sv-check{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--rpa-line); border-radius:10px; padding:8px 12px; font-size:0.76rem; color:var(--rpa-ink-soft); transition:all .3s ease; }
      .sv-check .sv-tstat{ width:16px; height:16px; }
      .sv-check.on{ color:var(--rpa-ink); border-color:rgba(37,99,235,0.35); }

      .sv-kpis{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:12px; }
      .sv-kpi{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:10px 12px; }
      .sv-kpi small{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.56rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--rpa-ink-soft); }
      .sv-kpi div{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.15rem; margin-top:2px; color:var(--rpa-ink); }
      .sv-kpi.warn div{ color:#DC2626; }
      .sv-chart{ display:flex; align-items:flex-end; gap:5px; height:96px; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:12px 14px; margin-bottom:12px; }
      .sv-cbar{ flex:1; border-radius:3px 3px 0 0; background:var(--rpa-primary); opacity:0; transform:scaleY(0.2); transform-origin:bottom; transition:all .35s ease; }
      .sv-cbar.on{ opacity:0.85; transform:scaleY(1); }
      .sv-cbar.on.fail{ background:#DC2626; opacity:1; }
      .sv-alert{ display:flex; align-items:center; gap:8px; border-radius:10px; padding:9px 12px; font-size:0.76rem; border:1px solid var(--rpa-line); background:#fff; color:var(--rpa-ink-soft); transition:all .3s ease; }
      .sv-alert.alert{ background:#FEF2F2; border-color:#FCA5A5; color:#B91C1C; }
      .sv-alert.ok{ background:var(--rpa-primary-soft); border-color:var(--rpa-primary); color:var(--rpa-primary-dark); }

      .sv-cmp{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:14px; margin-bottom:12px; display:grid; gap:14px; }
      .sv-cmp-row small{ display:flex; justify-content:space-between; font-size:0.72rem; color:var(--rpa-ink-soft); margin-bottom:6px; }
      .sv-cmp-row small b{ font-family:'Space Grotesk',sans-serif; color:var(--rpa-ink); }
      .sv-cmp-track{ height:10px; border-radius:5px; background:var(--rpa-line); overflow:hidden; }
      .sv-cmp-fill{ height:100%; width:0; border-radius:5px; transition:width .9s cubic-bezier(.4,0,.2,1); }
      .sv-cmp-fill.base{ background:#94A3B8; }
      .sv-cmp-fill.meas{ background:var(--rpa-primary); }
      .sv-delta{ justify-self:start; font-family:'JetBrains Mono',monospace; font-size:0.64rem; padding:3px 9px; border-radius:999px; background:var(--rpa-primary-soft); border:1px solid var(--rpa-primary); color:var(--rpa-primary-dark); opacity:0; transform:translateY(4px); transition:all .4s ease; }
      .sv-delta.on{ opacity:1; transform:none; }
      .sv-next{ display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--rpa-primary); border-radius:12px; padding:10px 12px; opacity:0; transform:translateY(8px); transition:all .45s ease; }
      .sv-next.on{ opacity:1; transform:none; box-shadow:0 0 0 3px var(--rpa-primary-soft); }
      .sv-next-ico{ width:30px; height:30px; border-radius:9px; background:var(--rpa-primary-soft); color:var(--rpa-primary); display:flex; align-items:center; justify-content:center; flex:none; }
      .sv-next.on .sv-spin{ animation:svSpin 2.4s linear infinite; }
      @keyframes svSpin{ to{ transform:rotate(360deg); } }
      .sv-next small{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.56rem; letter-spacing:0.06em; color:var(--rpa-primary-dark); }
      .sv-next strong{ display:block; font-family:'Space Grotesk',sans-serif; font-size:0.86rem; color:var(--rpa-ink); }
      .sv-next-sub{ font-size:0.7rem; color:var(--rpa-ink-soft); }
      .rpa-stage-icon{ width:46px; height:46px; border-radius:14px; background:var(--rpa-primary-soft); color:var(--rpa-primary); display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
      .rpa-stage h2{ font-size:clamp(1.6rem,2.6vw,2.2rem); }
      .rpa-stage .rpa-summary{ color:var(--rpa-ink-soft); max-width:46ch; margin-bottom:20px; }
      .rpa-block{ padding:16px 0; border-top:1px solid var(--rpa-line); }
      .rpa-block:first-of-type{ border-top:none; }
      .rpa-block h4{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:1rem; margin:0 0 4px; }
      .rpa-block p{ color:var(--rpa-ink-soft); margin:0; font-size:0.95rem; }

      .rpa-section{ padding:72px 0; scroll-margin-top:90px; }
      .rpa-section.alt{ background:var(--rpa-paper-dim); }
      .rpa-section-head{ margin-bottom:32px; }
      .rpa-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
      @media (max-width:820px){ .rpa-grid{ grid-template-columns:1fr; } }
      .rpa-card{ border:1px solid var(--rpa-line); border-radius:18px; background:#fff; padding:24px; box-shadow:0 1px 3px rgba(15,23,42,0.05); transition:transform .15s ease, box-shadow .15s ease; }
      .rpa-card:hover{ transform:translateY(-3px); box-shadow:0 12px 28px rgba(20,27,46,0.08); }
      .rpa-card .rpa-tag{ font-family:'JetBrains Mono',monospace; font-size:0.74rem; color:var(--rpa-primary-dark); background:var(--rpa-primary-soft); padding:3px 9px; border-radius:999px; }
      .rpa-card h3{ font-size:1.05rem; margin:12px 0 6px; }
      .rpa-card p{ color:var(--rpa-ink-soft); font-size:0.92rem; margin:0; }
      .rpa-date{ font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--rpa-ink-soft); }

      .rpa-cta-band{ background:var(--rpa-ink); color:var(--rpa-paper); padding:56px 0; }
      .rpa-cta-band .rpa-wrap{ display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:24px; }
      .rpa-cta-band h2{ color:#fff; margin-bottom:8px; }
      .rpa-cta-band p{ color:#C7CBD3; margin:0; }
      .rpa-cta-band .rpa-btn{ border-color:#fff; color:#fff; }
      .rpa-cta-band .rpa-btn.solid{ background:var(--rpa-primary); border-color:var(--rpa-primary); }

      .rpa-footer{ padding:36px 0; }
      .rpa-footer .rpa-wrap{ display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; font-family:'JetBrains Mono',monospace; font-size:0.82rem; color:var(--rpa-ink-soft); }
      .rpa-social-row{ display:flex; gap:14px; align-items:center; }

      .rpa-page-hero{ padding:88px 0 48px; }
      .rpa-chips{ display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
      .rpa-chip{ font-family:'JetBrains Mono',monospace; font-size:0.8rem; border:1px solid var(--rpa-line); border-radius:999px; padding:6px 12px; color:var(--rpa-ink-soft); }
      form.rpa-form .field{ margin-bottom:16px; }
      form.rpa-form label{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--rpa-ink-soft); margin-bottom:6px; }
      form.rpa-form input, form.rpa-form textarea{ width:100%; font-family:'Inter',sans-serif; font-size:1rem; padding:11px 13px; border:1.5px solid var(--rpa-ink); border-radius:10px; background:#fff; color:var(--rpa-ink); }
      form.rpa-form textarea{ min-height:120px; resize:vertical; }
    `}</style>
  );
}

// =====================================================================================
// Small reusable pieces
// =====================================================================================
// Set `src` to a file you've put in /public (for example "logo.svg" or "logo.png")
// to show your own logo everywhere the mark appears. Leave it null to use the
// built-in flowchart mark below.
export const LOGO = { src: null };

// The "mats." logo: a bracket with an arrow, plus the wordmark. It's drawn as
// pure vector (the letters are outlines, so no web font is needed and it stays
// sharp at any size). `size` is the height in px. Use `markOnly` for just the
// bracket-and-arrow symbol (used in the admin).
const LOGO_BRACKET = "M0,3 H6 V5.7 H2.7 V24.3 H6 V27 H0 Z";
const LOGO_ARROW = "M6.4,15 H18.8 M13.6,10 L18.8,15 L13.6,20";
const LOGO_WORDMARK = "M33.9 21.5V8.5H36.97L37.26 10.23Q37.87 9.3 38.89 8.75Q39.91 8.19 41.23 8.19Q42.21 8.19 42.98 8.45Q43.76 8.71 44.36 9.2Q44.97 9.69 45.35 10.43Q46.08 9.38 47.24 8.78Q48.4 8.19 49.77 8.19Q51.47 8.19 52.6 8.87Q53.74 9.56 54.32 10.85Q54.9 12.14 54.9 14.02V21.5H51.44V14.33Q51.44 12.78 50.84 11.96Q50.23 11.13 48.97 11.13Q48.14 11.13 47.5 11.54Q46.85 11.96 46.5 12.73Q46.15 13.5 46.15 14.59V21.5H42.67V14.33Q42.67 12.78 42.05 11.96Q41.43 11.13 40.14 11.13Q39.34 11.13 38.71 11.54Q38.08 11.96 37.73 12.73Q37.38 13.5 37.38 14.59V21.5ZM62.2 21.81Q60.57 21.81 59.52 21.28Q58.46 20.75 57.95 19.86Q57.45 18.97 57.45 17.89Q57.45 16.7 58.06 15.8Q58.66 14.9 59.89 14.38Q61.11 13.87 62.97 13.87H66.2Q66.2 12.91 65.94 12.28Q65.68 11.65 65.14 11.34Q64.6 11.03 63.69 11.03Q62.71 11.03 62.03 11.45Q61.35 11.88 61.19 12.76H57.81Q57.94 11.36 58.73 10.34Q59.52 9.33 60.82 8.76Q62.12 8.19 63.72 8.19Q65.55 8.19 66.89 8.81Q68.23 9.43 68.96 10.59Q69.68 11.75 69.68 13.45V21.5H66.74L66.35 19.51Q66.07 20.03 65.68 20.44Q65.29 20.86 64.78 21.16Q64.26 21.47 63.62 21.64Q62.97 21.81 62.2 21.81ZM63.02 19.13Q63.69 19.13 64.22 18.88Q64.75 18.64 65.14 18.21Q65.53 17.79 65.74 17.23Q65.96 16.68 66.04 16.03V16.01H63.38Q62.58 16.01 62.08 16.2Q61.58 16.39 61.35 16.75Q61.11 17.12 61.11 17.58Q61.11 18.1 61.35 18.43Q61.58 18.77 62.02 18.95Q62.46 19.13 63.02 19.13ZM78.42 21.5Q77.06 21.5 76.04 21.07Q75.02 20.65 74.45 19.66Q73.88 18.66 73.88 16.93V11.41H71.66V8.5H73.88L74.27 4.97H77.36V8.5H80.8V11.41H77.36V16.99Q77.36 17.86 77.75 18.2Q78.14 18.53 79.07 18.53H80.77V21.5ZM88.69 21.81Q86.91 21.81 85.59 21.24Q84.28 20.67 83.53 19.67Q82.78 18.66 82.68 17.4H86.13Q86.26 17.89 86.57 18.29Q86.88 18.69 87.4 18.92Q87.91 19.15 88.64 19.15Q89.33 19.15 89.77 18.96Q90.21 18.77 90.43 18.43Q90.65 18.1 90.65 17.73Q90.65 17.19 90.34 16.9Q90.03 16.6 89.44 16.42Q88.84 16.24 87.99 16.06Q87.06 15.88 86.17 15.61Q85.28 15.34 84.59 14.92Q83.89 14.51 83.48 13.87Q83.07 13.22 83.07 12.27Q83.07 11.11 83.68 10.19Q84.3 9.27 85.49 8.73Q86.68 8.19 88.35 8.19Q90.7 8.19 92.07 9.25Q93.43 10.31 93.69 12.16H90.42Q90.26 11.57 89.73 11.22Q89.2 10.87 88.33 10.87Q87.4 10.87 86.91 11.21Q86.42 11.54 86.42 12.09Q86.42 12.45 86.74 12.73Q87.06 13.01 87.66 13.21Q88.25 13.4 89.1 13.58Q90.6 13.89 91.73 14.29Q92.87 14.69 93.51 15.43Q94.16 16.16 94.16 17.55Q94.16 18.79 93.49 19.76Q92.82 20.73 91.59 21.27Q90.36 21.81 88.69 21.81Z";
const LOGO_WIDTH = 100.2;
const LOGO_MARK_WIDTH = 20.2;

export function Logo({ size = 28, markOnly = false }) {
  if (LOGO.src) {
    return <img src={`${import.meta.env.BASE_URL}${LOGO.src}`} alt="" style={{ display: "block", height: size, width: "auto" }} />;
  }
  const w = markOnly ? LOGO_MARK_WIDTH : LOGO_WIDTH;
  return (
    <svg width={(size * w) / 30} height={size} viewBox={`0 0 ${w} 30`} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="mats." style={{ display: "block" }}>
      <path d={LOGO_BRACKET} fill={THEME.primary} />
      <path d={LOGO_ARROW} stroke={THEME.primary} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      {!markOnly && (
        <>
          <path d={LOGO_WORDMARK} fill={THEME.ink} />
          <circle cx="97.93" cy="19.5" r="2.0" fill={THEME.primary} />
        </>
      )}
    </svg>
  );
}

function Block({ heading, body }) {
  return (
    <div className="rpa-block">
      <h4>{heading}</h4>
      <p>{body}</p>
    </div>
  );
}


// Node centers, in the exact order the dot travels them. Every consecutive
// pair is 120 units apart (see the offset-path in GlobalStyles) so that a
// constant-speed dot and linear-fraction node timing (i/7) land in sync.
const HERO_ANIM_NODES = [
  { x: 44, y: 44 }, { x: 164, y: 44 }, { x: 284, y: 44 }, { x: 404, y: 44 },
  { x: 404, y: 164 }, { x: 284, y: 164 }, { x: 164, y: 164 }, { x: 44, y: 164 },
];

function HeroAnimation({ labels }) {
  const nodeRefs = useRef([]);

  useEffect(() => {
    const LOOP = 11; // seconds — must match the CSS animation duration
    const travelStart = LOOP * 0.03;
    const travelEnd = LOOP * 0.88;
    const span = travelEnd - travelStart;
    let raf;
    const start = performance.now();

    function frame(now) {
      const elapsed = ((now - start) / 1000) % LOOP;
      nodeRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = travelStart + span * (i / (HERO_ANIM_NODES.length - 1));
        const lit = elapsed >= t && elapsed <= Math.min(t + 1.0, travelEnd + 0.3);
        el.classList.toggle("lit", lit);
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hero-anim" aria-hidden="true">
      <svg viewBox="0 0 448 215" xmlns="http://www.w3.org/2000/svg">
        <path className="ha-dash" d="M44,44 L164,44 L284,44 L404,44 L404,164 L284,164 L164,164 L44,164" />
        {HERO_ANIM_NODES.map((n, i) => {
          const Icon = STAGE_META[i].icon;
          return (
            <g key={i} ref={(el) => (nodeRefs.current[i] = el)} className="ha-node" transform={`translate(${n.x},${n.y})`}>
              <circle r="20" className="ha-circle" />
              <g transform="translate(-9,-9)">
                <Icon size={18} color={THEME.primary} strokeWidth={1.8} />
              </g>
              <text y="36" textAnchor="middle" className="ha-label">{labels[i]}</text>
            </g>
          );
        })}
        <circle className="ha-dot" r="4.5" fill="var(--rpa-primary)" />
      </svg>
    </div>
  );
}

// Identify-stage animation. A magnifier visits each workflow card in turn and
// reads out that card's own attributes (good processes show positive traits,
// bad ones show disqualifiers), then marks it "automate" or "keep manual".
// Text lives in CONTENT[mode].identifyDemo. Timing: one tick = IDV_TICK_MS;
// each card takes IDV_TICKS_PER_CARD ticks: arrive, 3 attributes, verdict.
const IDENTIFY_ICONS = [FileText, MessageSquare, BarChart3, Target];
const IDENTIFY_VERDICTS = ["candidate", "skip", "candidate", "skip"];
const IDV_TICK_MS = 600;
const IDV_TICKS_PER_CARD = 5;
const IDV_SCAN_TICKS = IDENTIFY_VERDICTS.length * IDV_TICKS_PER_CARD;
const IDV_LOOP_TICKS = IDV_SCAN_TICKS + 5; // short hold on the finished state

function IdentifyAnimation({ t }) {
  const d = t.identifyDemo;
  const reduced = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [tick, setTick] = useState(reduced ? IDV_SCAN_TICKS : 0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTick((n) => (n + 1) % IDV_LOOP_TICKS), IDV_TICK_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const total = IDENTIFY_VERDICTS.length;
  const goodCount = IDENTIFY_VERDICTS.filter((v) => v === "candidate").length;
  const scanning = tick < IDV_SCAN_TICKS;
  const active = scanning ? Math.floor(tick / IDV_TICKS_PER_CARD) : -1;
  const phase = scanning ? tick % IDV_TICKS_PER_CARD : 0;
  const lensIndex = active < 0 ? total - 1 : active;
  const lens = { left: lensIndex % 2 === 0 ? 25 : 75, top: lensIndex < 2 ? 25 : 75 };
  const progress = scanning ? ((tick + 1) / IDV_SCAN_TICKS) * 100 : 100;
  const counter = String(scanning ? active + 1 : total).padStart(2, "0");

  function cardState(i) {
    if (!scanning || i < active) return "done";
    if (i === active) return phase >= IDV_TICKS_PER_CARD - 1 ? "done" : "scanning";
    return "pending";
  }

  // While scanning: the active card's own attributes, revealed one per tick
  // and toned by its verdict. When finished: a summary of the whole scan.
  const chips = scanning
    ? d.cards[active].attrs.map((text, i) => ({ text, lit: phase >= i + 1, tone: IDENTIFY_VERDICTS[active] }))
    : [
        { text: `${goodCount} ${d.summaryCandidate}`, lit: true, tone: "candidate" },
        { text: `${total - goodCount} ${d.summarySkip}`, lit: true, tone: "skip" },
      ];

  return (
    <div className="idv" aria-hidden="true">
      <div className="idv-head"><span className="idv-dot" />{d.label}</div>
      <div className="idv-grid">
        {d.cards.map((c, i) => {
          const Icon = IDENTIFY_ICONS[i];
          const st = cardState(i);
          const verdict = IDENTIFY_VERDICTS[i];
          return (
            <div key={i} className={`idv-card ${st}${st === "done" ? " " + verdict : ""}`}>
              <span className="idv-badge">{verdict === "candidate" ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}</span>
              <div className="idv-card-top">
                <span className="idv-ico"><Icon size={15} /></span>
                <span className="idv-num">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="idv-title">{c.title}</div>
              <div className="idv-sub">{c.sub}</div>
              <div className="idv-foot">
                <span>{c.freq}</span>
                <span className="idv-status">
                  {st !== "done" ? d.pending : verdict === "candidate" ? <><Check size={10} />{d.candidate}</> : <><X size={10} />{d.skip}</>}
                </span>
              </div>
            </div>
          );
        })}
        <div className="idv-lens" style={{ left: `${lens.left}%`, top: `${lens.top}%`, opacity: scanning ? 1 : 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="28" cy="28" r="22" fill="rgba(37,99,235,0.10)" stroke={THEME.primary} strokeWidth="3.5" />
            <circle cx="28" cy="28" r="17" stroke="rgba(37,99,235,0.35)" strokeWidth="1.2" />
            <line x1="44" y1="44" x2="66" y2="66" stroke={THEME.primary} strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="idv-bar">
        <div className="idv-bar-row">
          <span>{scanning ? d.scanning : d.complete}</span>
          <span className="idv-count">{counter} / {String(total).padStart(2, "0")}</span>
        </div>
        <div className="idv-chips">
          {chips.map((chip, i) => (
            <span key={`${scanning ? active : "done"}-${i}`} className={`idv-chip${chip.lit ? " lit " + chip.tone : ""}`}>{chip.text}</span>
          ))}
        </div>
        <div className="idv-track"><div className="idv-fill" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}

// =====================================================================================
// Stage animations (Assess → Improve). Same idea as IdentifyAnimation above: a
// small looping scene per stage, driven by one shared ticker, with all text in
// CONTENT[mode].<stage>Demo so it follows the language switch.
// =====================================================================================
function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Counts 0 … loopTicks-1, one step every tickMs. With "reduce motion" on it
// stays on finalTick (the completed state) and never animates.
function useTicker(loopTicks, tickMs, finalTick) {
  const reduced = prefersReducedMotion();
  const [tick, setTick] = useState(reduced ? finalTick : 0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTick((n) => (n + 1) % loopTicks), tickMs);
    return () => clearInterval(id);
  }, [reduced, loopTicks, tickMs]);
  return tick;
}

const pad2 = (n) => String(n).padStart(2, "0");
const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Shared panel: header label, scene (children), and the status bar underneath.
function VizShell({ label, status, count, chips, progress, children }) {
  return (
    <div className="idv" aria-hidden="true">
      <div className="idv-head"><span className="idv-dot" />{label}</div>
      {children}
      <div className="idv-bar">
        <div className="idv-bar-row">
          <span>{status}</span>
          {count ? <span className="idv-count">{count}</span> : null}
        </div>
        <div className="idv-chips">
          {chips.map((c, i) => (
            <span key={i} className={`idv-chip${c.lit ? " lit " + (c.tone || "candidate") : ""}`}>{c.text}</span>
          ))}
        </div>
        <div className="idv-track"><div className="idv-fill" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}

// ---- 02 Assess: candidates get scored, then re-rank by return ------------------------
const ASSESS_ROWS = [
  { m: [30, 55, 45], score: 42 },
  { m: [90, 30, 20], score: 91 },
  { m: [62, 40, 35], score: 68 },
];
const ASSESS_ROW_H = 80;

function AssessAnimation({ t }) {
  const d = t.assessDemo;
  const FINAL = 12;
  const tick = useTicker(17, 600, FINAL);
  const revealed = (i) => tick >= 1 + i * 2;
  const sorted = tick >= 8;
  const order = ASSESS_ROWS.map((_, i) => i).sort((a, b) => ASSESS_ROWS[b].score - ASSESS_ROWS[a].score);
  const revealedCount = ASSESS_ROWS.filter((_, i) => revealed(i)).length;
  const chipLit = [tick >= 2, tick >= 4, tick >= 6];

  return (
    <VizShell
      label={d.label}
      status={sorted ? d.ranked : d.scoring}
      count={`${pad2(revealedCount)} / ${pad2(ASSESS_ROWS.length)}`}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={d.chips.map((text, i) => ({ text, lit: chipLit[i] }))}
    >
      <div className="sv-assess" style={{ height: ASSESS_ROW_H * ASSESS_ROWS.length - 8 }}>
        {ASSESS_ROWS.map((r, i) => {
          const rank = order.indexOf(i);
          const on = revealed(i);
          return (
            <div key={i} className={`sv-arow${sorted && rank === 0 ? " best" : ""}`} style={{ top: (sorted ? rank : i) * ASSESS_ROW_H }}>
              <div className="sv-arow-top">
                <span className="sv-arow-name">{sorted && <b>#{rank + 1}</b>}{d.rows[i]}</span>
                <span className="sv-arow-score">
                  {sorted && rank === 0 && <span className="sv-tag">{d.top}</span>}
                  {on ? r.score : "—"}
                </span>
              </div>
              <div className="sv-metrics">
                {d.cols.map((c, k) => (
                  <div key={k} className="sv-metric">
                    <span>{c}</span>
                    <div className="sv-mtrack"><div className={`sv-mfill m${k}`} style={{ width: on ? `${r.m[k]}%` : "0%" }} /></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </VizShell>
  );
}

// ---- 03 Design: a process map draws itself, exception path included -------------------
function SvEdge({ d, show, red, dashed }) {
  return (
    <g style={{ opacity: show ? 1 : 0, transition: "opacity .4s ease" }}>
      <path d={d} fill="none" stroke={red ? "#DC2626" : THEME.primary} strokeWidth="1.6" strokeLinecap="round"
        strokeDasharray={dashed ? "4 3" : undefined} markerEnd={red ? "url(#svArrowR)" : "url(#svArrowB)"} />
    </g>
  );
}

function SvNode({ x, y, w, h, label, show, red }) {
  return (
    <g style={{ opacity: show ? 1 : 0, transition: "opacity .4s ease" }}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={red ? "#FEF2F2" : "#fff"} stroke={red ? "#FCA5A5" : THEME.primary} strokeWidth="1.4" />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle">{label}</text>
    </g>
  );
}

function DesignAnimation({ t }) {
  const d = t.designDemo;
  const FINAL = 7;
  const tick = useTicker(13, 650, FINAL);
  const on = (n) => tick >= n;
  const fade = (show) => ({ opacity: show ? 1 : 0, transition: "opacity .4s ease" });
  const [nReceive, nValidate, nMatch, nPost, nReview] = d.nodes;

  return (
    <VizShell
      label={d.label}
      status={on(FINAL) ? d.mapped : d.mapping}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={[
        { text: d.chips[0], lit: on(6) },
        { text: d.chips[1], lit: on(3) },
        { text: d.chips[2], lit: on(6), tone: "skip" },
      ]}
    >
      <div className="sv-box sv-flow">
        <svg viewBox="0 0 360 176">
          <defs>
            <marker id="svArrowB" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill={THEME.primary} />
            </marker>
            <marker id="svArrowR" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#DC2626" />
            </marker>
          </defs>
          <rect x="2" y="2" width="356" height="82" rx="10" fill={THEME.paperDim} stroke={THEME.line} />
          <rect x="2" y="94" width="356" height="80" rx="10" fill="#FFFAFA" stroke="rgba(220,38,38,0.2)" />
          <text className="sv-lane" x="10" y="13">{d.lanes[0]}</text>
          <text className="sv-lane" x="10" y="105">{d.lanes[1]}</text>

          <SvNode x={10} y={28} w={72} h={34} label={nReceive} show={on(1)} />
          <SvEdge d="M82,45 L109,45" show={on(2)} />
          <SvNode x={110} y={28} w={72} h={34} label={nValidate} show={on(2)} />
          <SvEdge d="M182,45 L206,45" show={on(3)} />
          <g style={fade(on(3))}>
            <polygon points="240,21 272,45 240,69 208,45" fill="#fff" stroke={THEME.primary} strokeWidth="1.4" />
            <text x="240" y="48.5" textAnchor="middle">{nMatch}</text>
          </g>
          <SvEdge d="M272,45 L293,45" show={on(4)} />
          <text x="282" y="39" textAnchor="middle" style={{ ...fade(on(4)), fontSize: "8px" }}>{d.yes}</text>
          <SvNode x={294} y={28} w={60} h={34} label={nPost} show={on(4)} />
          <SvEdge d="M240,69 L240,110" show={on(5)} red dashed />
          <text x="248" y="92" style={{ ...fade(on(5)), fontSize: "8px", fill: "#DC2626" }}>{d.no}</text>
          <SvNode x={186} y={112} w={108} h={34} label={nReview} show={on(6)} red />
        </svg>
      </div>
    </VizShell>
  );
}

// ---- 04 Develop: three situations, each picks the simplest tool that works -------------
const DEVELOP_ICONS = { rpa: [Plug, Terminal, Bot], ai: [MessageSquare, Wrench, Network] };

function DevelopAnimation({ t, mode }) {
  const d = t.developDemo;
  const PER = 4;
  const FINAL = d.tools.length * PER;
  const tick = useTicker(FINAL + 4, 650, FINAL);
  const done = tick >= FINAL;
  const active = done ? -1 : Math.floor(tick / PER);
  const phase = tick % PER;
  const toolState = (i) => (done ? "on" : phase >= 1 ? (active === i ? "on" : "off") : "");
  const chipLit = (i) => done || active > i || (active === i && phase >= 1);

  return (
    <VizShell
      label={d.label}
      status={done ? d.done : d.choosing}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={d.chips.map((text, i) => ({ text, lit: chipLit(i) }))}
    >
      <div className="sv-situation">
        <small>{d.situation}</small>
        <div>{done ? d.summary : d.scenarios[active]}</div>
      </div>
      <div className="sv-tools">
        {d.tools.map((tool, i) => {
          const Icon = (DEVELOP_ICONS[mode] || DEVELOP_ICONS.rpa)[i];
          return (
            <div key={i} className={`sv-tool ${toolState(i)}`}>
              <span className="idv-badge"><Check size={12} strokeWidth={3} /></span>
              <span className="sv-tool-ico"><Icon size={16} /></span>
              <div className="sv-tool-name">{tool.name}</div>
              <div className="sv-tool-rank">{tool.rank}</div>
            </div>
          );
        })}
      </div>
    </VizShell>
  );
}

// ---- 05 Test: parallel run, one mismatch is caught and fixed, failures injected --------
const TEST_ROWS = [
  { id: "INV-1041", manual: "1,240.00", auto: "1,240.00" },
  { id: "INV-1042", manual: "310.50", auto: "310.50" },
  { id: "INV-1043", manual: "89.00", auto: "89.00" },
  { id: "INV-1044", manual: "2,075.00", auto: "2,057.00", fixedAt: 8 },
  { id: "INV-1045", manual: "640.25", auto: "640.25" },
];

function TestAnimation({ t }) {
  const d = t.testDemo;
  const FINAL = 11;
  const tick = useTicker(16, 600, FINAL);
  const status = (r, i) => (tick < 1 + i ? "pending" : r.fixedAt && tick < r.fixedAt ? "fail" : "pass");
  const passCount = TEST_ROWS.filter((r, i) => status(r, i) === "pass").length;
  const allPass = passCount === TEST_ROWS.length;

  return (
    <VizShell
      label={d.label}
      status={allPass ? d.passed : d.running}
      count={`${pad2(passCount)} / ${pad2(TEST_ROWS.length)}`}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={d.chips.map((text, i) => ({ text, lit: tick >= 9 + i }))}
    >
      <div className="sv-table">
        <div className="sv-thead"><span>{d.cols[0]}</span><span>{d.cols[1]}</span><span>{d.cols[2]}</span><span /></div>
        {TEST_ROWS.map((r, i) => {
          const st = status(r, i);
          const checking = tick === 1 + i || (r.fixedAt && tick === r.fixedAt);
          const autoVal = st === "pending" ? "…" : r.fixedAt && tick >= r.fixedAt ? r.manual : r.auto;
          return (
            <div key={r.id} className={`sv-trow${st === "fail" ? " fail" : checking ? " active" : ""}`}>
              <span>{r.id}</span>
              <span>{r.manual}</span>
              <span className={st === "fail" ? "bad" : ""}>{autoVal}</span>
              <span className={`sv-tstat ${st}`}>
                {st === "pass" ? <Check size={11} strokeWidth={3} /> : st === "fail" ? <X size={11} strokeWidth={3} /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </VizShell>
  );
}

// ---- 06 Deploy: shadow → subset → full load, rollback plan ready, then handoff ---------
const DEPLOY_PCT = [0, 20, 100];

function DeployAnimation({ t }) {
  const d = t.deployDemo;
  const FINAL = 10;
  const tick = useTicker(14, 650, FINAL);
  const stage = Math.min(DEPLOY_PCT.length - 1, Math.floor(tick / 3));
  const pct = DEPLOY_PCT[stage];
  const rollbackOn = tick >= 1;
  const handoffOn = tick >= 9;

  return (
    <VizShell
      label={d.label}
      status={handoffOn ? d.done : d.rolling}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={[
        { text: d.chips[0], lit: rollbackOn },
        { text: d.chips[1], lit: tick >= 6 },
        { text: d.chips[2], lit: handoffOn },
      ]}
    >
      <div className="sv-stages">
        {d.stages.map((name, i) => (
          <div key={i} className={`sv-stage${i === stage ? " current" : i < stage ? " past" : ""}`}>
            <small>{pad2(i + 1)} · {DEPLOY_PCT[i]}%</small>
            <div>{name}</div>
          </div>
        ))}
      </div>
      <div className="sv-load">
        <div className="sv-load-row"><span>{d.bar}</span><span className="sv-load-pct">{pct}%</span></div>
        <div className="sv-load-track"><div className="sv-load-fill" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="sv-checks">
        <div className={`sv-check${rollbackOn ? " on" : ""}`}>
          <span className={`sv-tstat ${rollbackOn ? "pass" : "pending"}`}>{rollbackOn && <Check size={10} strokeWidth={3} />}</span>
          {d.rollback}
        </div>
        <div className={`sv-check${handoffOn ? " on" : ""}`}>
          <span className={`sv-tstat ${handoffOn ? "pass" : "pending"}`}>{handoffOn && <Check size={10} strokeWidth={3} />}</span>
          {d.handoff}
        </div>
      </div>
    </VizShell>
  );
}

// ---- 07 Monitor: runs stream in, one failure fires an alert, then it's resolved ---------
const MONITOR_BARS = [46, 52, 49, 58, 55, 61, 57, 64, 92, 63, 68, 66];
const MONITOR_FAIL = 8;

function MonitorAnimation({ t }) {
  const d = t.monitorDemo;
  const FINAL = 13;
  const tick = useTicker(17, 600, FINAL);
  const shown = Math.min(MONITOR_BARS.length, tick);
  const failVisible = tick > MONITOR_FAIL;
  const alertOn = tick >= 10;
  const resolved = tick >= 13;
  const alertState = resolved ? "ok" : alertOn ? "alert" : "";
  const kpis = [fmtNum(shown * 1250), failVisible ? "1" : "0", `${fmtNum(shown * 120)}h`];

  return (
    <VizShell
      label={d.label}
      status={resolved ? d.watching : d.monitoring}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={[
        { text: d.chips[0], lit: tick >= 2 },
        { text: d.chips[1], lit: tick >= 8 },
        { text: d.chips[2], lit: tick >= 11 },
      ]}
    >
      <div className="sv-kpis">
        {d.kpis.map((k, i) => (
          <div key={i} className={`sv-kpi${i === 1 && failVisible && !resolved ? " warn" : ""}`}>
            <small>{k}</small>
            <div>{kpis[i]}</div>
          </div>
        ))}
      </div>
      <div className="sv-chart">
        {MONITOR_BARS.map((h, i) => {
          const failing = i === MONITOR_FAIL && i < shown && !resolved;
          const height = i === MONITOR_FAIL && resolved ? 66 : h;
          return <div key={i} className={`sv-cbar${i < shown ? " on" : ""}${failing ? " fail" : ""}`} style={{ height: `${height}%` }} />;
        })}
      </div>
      <div className={`sv-alert ${alertState}`}>
        {resolved ? <><Check size={14} />{d.resolved}</> : alertOn ? <><Bell size={14} />{d.alert}</> : d.healthy}
      </div>
    </VizShell>
  );
}

// ---- 08 Improve: measured result vs. baseline, then a new candidate loops back ---------
function ImproveAnimation({ t }) {
  const d = t.improveDemo;
  const FINAL = 9;
  const tick = useTicker(14, 650, FINAL);
  const nextOn = tick >= 7;

  return (
    <VizShell
      label={d.label}
      status={nextOn ? d.done : d.measuring}
      progress={Math.min(100, (tick / FINAL) * 100)}
      chips={[
        { text: d.chips[0], lit: tick >= 1 },
        { text: d.chips[1], lit: tick >= 3 },
        { text: d.chips[2], lit: nextOn },
      ]}
    >
      <div className="sv-cmp">
        <div className="sv-cmp-row">
          <small><span>{d.baseline.label}</span><b>{d.baseline.value}</b></small>
          <div className="sv-cmp-track"><div className="sv-cmp-fill base" style={{ width: tick >= 1 ? "60%" : "0%" }} /></div>
        </div>
        <div className="sv-cmp-row">
          <small><span>{d.measured.label}</span><b>{d.measured.value}</b></small>
          <div className="sv-cmp-track"><div className="sv-cmp-fill meas" style={{ width: tick >= 3 ? "81%" : "0%" }} /></div>
        </div>
        <span className={`sv-delta${tick >= 5 ? " on" : ""}`}>{d.delta}</span>
      </div>
      <div className={`sv-next${nextOn ? " on" : ""}`}>
        <span className="sv-next-ico"><RefreshCw size={16} className="sv-spin" /></span>
        <div>
          <small>{d.next.tag}</small>
          <strong>{d.next.title}</strong>
          <div className="sv-next-sub">{d.next.sub}</div>
        </div>
      </div>
    </VizShell>
  );
}

// Optional visual shown beside a stage's text. Map a stage id to a component
// that takes `t` (the current language's content). Stages not listed here
// render as plain text.
const STAGE_VISUALS = {
  identify: IdentifyAnimation,
  assess: AssessAnimation,
  design: DesignAnimation,
  develop: DevelopAnimation,
  test: TestAnimation,
  deploy: DeployAnimation,
  monitor: MonitorAnimation,
  improve: ImproveAnimation,
};

function useScrollSpy(ids, offset = 130) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let ticking = false;
    function computeActive() {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 0) current = id;
        else break;
      }
      return current;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setActive(computeActive()); ticking = false; });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids, offset]);
  return active;
}

function scrollToSection(e, id, headerOffset = 90) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  window.scrollTo({ top, behavior: "smooth" });
}

// =====================================================================================
// Nav
// =====================================================================================
function TopNav({ activeId, t, mode, setMode }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="rpa-nav">
      <div className="rpa-nav-bar">
        <a className="rpa-brand" href="#home" aria-label={t.name} onClick={(e) => scrollToSection(e, "home")}>
          <Logo size={28} />
        </a>
        <button className="rpa-nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`rpa-nav-links${open ? " open" : ""}`}>
          {STAGE_META.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={activeId === s.id ? "active" : ""}
              onClick={(e) => { scrollToSection(e, s.id); setOpen(false); }}
            >
              {t.stages[s.id].title}
            </a>
          ))}
          <a href="#news" className={activeId === "news" ? "active" : ""} onClick={(e) => { scrollToSection(e, "news"); setOpen(false); }}>{t.navNews}</a>
          <a href="#projects" className={activeId === "projects" ? "active" : ""} onClick={(e) => { scrollToSection(e, "projects"); setOpen(false); }}>{t.navProjects}</a>
          <div className="rpa-nav-sub">
            <Link to="/about">{t.navAbout}</Link>
            <Link to="/contact">{t.navContact}</Link>
            <ModeSwitcher mode={mode} setMode={setMode} />
          </div>
        </nav>
      </div>
    </header>
  );
}

// =====================================================================================
// Main app
// =====================================================================================
function HomeSection() {
  const [mode, setMode] = useMode();
  const [t] = useSiteContent(mode);
  const sectionIds = useMemo(() => ["home", ...STAGE_META.map((s) => s.id), "news", "projects"], []);
  const active = useScrollSpy(sectionIds);
  const news = t.news.items;
  const projects = t.projects.items;

  return (
    <div className="rpa-root" lang="en" data-mode={mode}>
      <GlobalStyles />
      <TopNav activeId={active} t={t} mode={mode} setMode={setMode} />

      <section className="rpa-hero" id="home">
        <div className="rpa-wrap">
          <div>
            <div className="rpa-kicker">{t.role.toUpperCase()}</div>
            <h1 className="rpa-h">{t.tagline}</h1>
            <p className="lede">{t.heroLede}</p>
            <div className="rpa-cta-row">
              <Link className="rpa-btn solid" to="/contact">{t.ctaStart} <ArrowUpRight size={16} /></Link>
              <a className="rpa-arrow-link" href="#identify" onClick={(e) => scrollToSection(e, "identify")}>{t.ctaProcess} →</a>
            </div>
          </div>
          <HeroAnimation labels={STAGE_META.map((s) => t.stages[s.id].title.toUpperCase())} />
        </div>
      </section>

      <div className="rpa-journey">
        {STAGE_META.map((meta, i) => {
          const Icon = meta.icon;
          const Visual = STAGE_VISUALS[meta.id];
          const stage = t.stages[meta.id];
          const alt = i % 2 === 1;
          return (
            <div className={`rpa-stage-band${alt ? " alt" : ""}`} key={meta.id} id={meta.id}>
              <div className="rpa-wrap">
                <section className={`rpa-stage${Visual ? " has-visual" : ""}`}>
                  <div className="rpa-stage-text">
                    <div className="rpa-stage-icon"><Icon size={22} /></div>
                    <div className="rpa-kicker">{stage.kicker}</div>
                    <h2 className="rpa-h">{stage.title}</h2>
                    <p className="rpa-summary">{stage.summary}</p>
                    {/* Add more entries to CONTENT[mode].stages.<id>.blocks to extend this stage */}
                    {stage.blocks.map((b, bi) => (
                      <Block key={bi} heading={b.heading} body={b.body} />
                    ))}
                  </div>
                  {Visual && (
                    <div className="rpa-stage-visual"><Visual t={t} mode={mode} /></div>
                  )}
                </section>
              </div>
            </div>
          );
        })}
      </div>

      <section className="rpa-section" id="news">
        <div className="rpa-wrap">
          <div className="rpa-section-head">
            <div className="rpa-kicker">{t.news.kicker}</div>
            <h2 className="rpa-h">{t.news.heading}</h2>
          </div>
          <div className="rpa-grid">
            {news.map((n) => (
              <div className="rpa-card" key={n.id}>
                <span className="rpa-date">{n.date}</span>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rpa-section alt" id="projects">
        <div className="rpa-wrap">
          <div className="rpa-section-head">
            <div className="rpa-kicker">{t.projects.kicker}</div>
            <h2 className="rpa-h">{t.projects.heading}</h2>
          </div>
          <div className="rpa-grid">
            {projects.map((p) => (
              <div className="rpa-card" key={p.id}>
                <span className="rpa-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rpa-cta-band">
        <div className="rpa-wrap">
          <div>
            <h2 className="rpa-h">{t.ctaBand.heading}</h2>
            <p>{t.ctaBand.body}</p>
          </div>
          <Link className="rpa-btn solid" to="/contact">{t.ctaBand.button} <ArrowUpRight size={16} /></Link>
        </div>
      </section>

      <footer className="rpa-footer">
        <div className="rpa-wrap">
          <span>© 2026 {t.name} · {t.role}</span>
          <div className="rpa-social-row">
            <Link to="/about">{t.navAbout}</Link>
            <a href={`mailto:${t.socials.email}`} aria-label="Email"><Mail size={16} /></a>
            <a href={t.socials.github} aria-label="GitHub"><Github size={16} /></a>
            <a href={t.socials.linkedin} aria-label="LinkedIn"><Linkedin size={16} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =====================================================================================
// About / Contact / Admin — merged into this single file so the whole site is one upload.
// =====================================================================================

function AboutSection() {
  const [mode, setMode] = useMode();
  const [t] = useSiteContent(mode);
  const { about } = t;

  return (
    <div className="rpa-root" lang="en" data-mode={mode}>
      <GlobalStyles />
      <header className="rpa-nav">
        <div className="rpa-nav-bar">
          <Link className="rpa-brand" to="/" aria-label={t.name}><Logo size={26} /></Link>
          <nav className="rpa-nav-links" style={{ display: "flex" }}>
            <Link to="/">Home</Link>
            <Link to="/about" className="active">{t.navAbout}</Link>
            <Link to="/contact">{t.navContact}</Link>
            <div className="rpa-nav-sub" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: "none" }}>
              <ModeSwitcher mode={mode} setMode={setMode} />
            </div>
          </nav>
        </div>
      </header>

      <section className="rpa-page-hero">
        <div className="rpa-wrap">
          <div className="rpa-kicker">{about.kicker}</div>
          <h1 className="rpa-h" style={{ maxWidth: "18ch" }}>{about.heading}</h1>
          <p className="lede">{about.intro}</p>
        </div>
      </section>

      <section className="rpa-section" style={{ borderTop: "none" }}>
        <div className="rpa-wrap">
          <div>
            {/* Add more entries to CONTENT[mode].about.sections in App.jsx to extend this list */}
            {about.sections.map((s, i) => (
              <div className="rpa-block" key={i}>
                <h4>{s.heading}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40 }}>
            <div className="rpa-kicker">{about.skillsHeading}</div>
            <div className="rpa-chips">
              {about.skills.map((skill) => (
                <span className="rpa-chip" key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rpa-cta-band">
        <div className="rpa-wrap">
          <div>
            <h2 className="rpa-h">{about.ctaHeading}</h2>
            <p>{about.ctaBody}</p>
          </div>
          <Link className="rpa-btn solid" to="/contact">{about.ctaButton}</Link>
        </div>
      </section>

      <footer className="rpa-footer">
        <div className="rpa-wrap">
          <span>© 2026 {t.name} · {t.role}</span>
          <Link to="/">{t.footer.backHome}</Link>
        </div>
      </footer>
    </div>
  );
}

function ContactSection() {
  const [mode, setMode] = useMode();
  const [t] = useSiteContent(mode);
  const { contact } = t;
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contact.formEndpoint) {
      window.location.href = `mailto:${t.socials.email}`;
      return;
    }
    setStatus("sending");
    try {
      const form = new FormData(e.target);
      const res = await fetch(contact.formEndpoint, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rpa-root" lang="en" data-mode={mode}>
      <GlobalStyles />
      <header className="rpa-nav">
        <div className="rpa-nav-bar">
          <Link className="rpa-brand" to="/" aria-label={t.name}><Logo size={26} /></Link>
          <nav className="rpa-nav-links" style={{ display: "flex" }}>
            <Link to="/">Home</Link>
            <Link to="/about">{t.navAbout}</Link>
            <Link to="/contact" className="active">{t.navContact}</Link>
            <div className="rpa-nav-sub" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: "none" }}>
              <ModeSwitcher mode={mode} setMode={setMode} />
            </div>
          </nav>
        </div>
      </header>

      <section className="rpa-page-hero">
        <div className="rpa-wrap">
          <div className="rpa-kicker">{contact.kicker}</div>
          <h1 className="rpa-h" style={{ maxWidth: "18ch" }}>{contact.heading}</h1>
          <p className="lede">{contact.intro}</p>
        </div>
      </section>

      <section className="rpa-section" style={{ borderTop: "none" }}>
        <div className="rpa-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <form className="rpa-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">{contact.form.name}</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="email">{contact.form.email}</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="message">{contact.form.message}</label>
              <textarea id="message" name="message" required />
            </div>
            <button type="submit" className="rpa-btn solid" disabled={status === "sending"}>
              {status === "sending" ? contact.form.sending : contact.form.submit}
            </button>
            {status === "sent" && <p style={{ marginTop: 12, color: "var(--rpa-primary-dark)" }}>{contact.form.sent}</p>}
            {status === "error" && <p style={{ marginTop: 12, color: "#B3261E" }}>{contact.form.error}</p>}
          </form>

          <div>
            {/* Add more entries to CONTENT[mode].contact.sections in App.jsx to extend this list */}
            {contact.sections.map((s, i) => (
              <div className="rpa-block" key={i}>
                <h4>{s.heading}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="rpa-footer">
        <div className="rpa-wrap">
          <span>© 2026 {t.name} · {t.role}</span>
          <Link to="/">{t.footer.backHome}</Link>
        </div>
      </footer>
    </div>
  );
}

const ADMIN_PASSPHRASE = "changeme"; // change this, and read the security note above

function cloneContent(value) {
  // JSON round-trip on purpose, not structuredClone: structuredClone throws if
  // CONTENT ever contains a function, whereas JSON.stringify silently drops
  // function-valued keys (and useSiteContent's deepMerge restores them from
  // CONTENT[mode] when the edited content is read back).
  return JSON.parse(JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Small field components
// ---------------------------------------------------------------------------
function TextField({ label, value, onChange }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
// {heading, body} list — used for stage blocks, About timeline, Contact details
function HeadingBodyListEditor({ label, items, onChange, headingLabel = "Heading", bodyLabel = "Body" }) {
  function update(i, key, val) {
    const next = items.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() { onChange([...items, { heading: "New heading", body: "" }]); }
  return (
    <div className="adm-list">
      <div className="adm-list-label">{label}</div>
      {items.map((it, i) => (
        <div className="adm-list-item" key={i}>
          <input value={it.heading} placeholder={headingLabel} onChange={(e) => update(i, "heading", e.target.value)} />
          <textarea value={it.body} placeholder={bodyLabel} onChange={(e) => update(i, "body", e.target.value)} />
          <button type="button" className="adm-remove" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" className="adm-add" onClick={add}>+ Add entry</button>
    </div>
  );
}

function NewsListEditor({ items, onChange }) {
  function update(i, key, val) {
    const next = items.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() {
    onChange([...items, { id: `n-${Date.now()}`, date: new Date().toISOString().slice(0, 7), title: "New update", body: "" }]);
  }
  return (
    <div className="adm-list">
      <div className="adm-list-label">News items</div>
      {items.map((it, i) => (
        <div className="adm-list-item" key={it.id ?? i}>
          <input value={it.date} placeholder="Date (e.g. 2026-08)" onChange={(e) => update(i, "date", e.target.value)} />
          <input value={it.title} placeholder="Title" onChange={(e) => update(i, "title", e.target.value)} />
          <textarea value={it.body} placeholder="Body" onChange={(e) => update(i, "body", e.target.value)} />
          <button type="button" className="adm-remove" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" className="adm-add" onClick={add}>+ Add news item</button>
    </div>
  );
}

function ProjectsListEditor({ items, onChange }) {
  function update(i, key, val) {
    const next = items.slice();
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  function add() {
    onChange([...items, { id: `p-${Date.now()}`, tag: "Tag", title: "New project", body: "" }]);
  }
  return (
    <div className="adm-list">
      <div className="adm-list-label">Projects</div>
      {items.map((it, i) => (
        <div className="adm-list-item" key={it.id ?? i}>
          <input value={it.tag} placeholder="Tag (e.g. RPA)" onChange={(e) => update(i, "tag", e.target.value)} />
          <input value={it.title} placeholder="Title" onChange={(e) => update(i, "title", e.target.value)} />
          <textarea value={it.body} placeholder="Body" onChange={(e) => update(i, "body", e.target.value)} />
          <button type="button" className="adm-remove" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" className="adm-add" onClick={add}>+ Add project</button>
    </div>
  );
}

function ChipListEditor({ items, onChange }) {
  const [draft, setDraft] = useState("");
  function add() {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <div className="adm-chips">
        {items.map((s, i) => (
          <span className="adm-chip" key={i}>
            {s} <button type="button" onClick={() => remove(i)} aria-label={`Remove ${s}`}>×</button>
          </span>
        ))}
      </div>
      <div className="adm-chip-add">
        <input
          value={draft}
          placeholder="Add a tool / skill"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" className="adm-add" onClick={add}>+ Add</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin-only styles (kept separate from GlobalStyles, which is site-facing)
// ---------------------------------------------------------------------------
function AdminStyles() {
  return (
    <style>{`
      .adm-gate{ display:flex; align-items:center; justify-content:center; min-height:100vh; }
      .adm-gate-box{ text-align:center; max-width:320px; }
      .adm-gate-box input{ width:100%; padding:11px 13px; border:1.5px solid var(--rpa-ink); border-radius:10px; margin:14px 0; font-size:1rem; }
      .adm-banner{ background: var(--rpa-primary-soft); border:1px solid var(--rpa-primary); border-radius:12px; padding:14px 18px; font-size:0.9rem; color:var(--rpa-ink); margin-bottom:24px; }
      .adm-tabs{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:28px; border-bottom:1px solid var(--rpa-line); padding-bottom:12px; }
      .adm-tabs button{ font-family:'JetBrains Mono',monospace; font-size:0.82rem; text-transform:uppercase; letter-spacing:.03em; padding:8px 14px; border-radius:8px; border:1px solid var(--rpa-line); background:#fff; color:var(--rpa-ink-soft); cursor:pointer; }
      .adm-tabs button.active{ background:var(--rpa-ink); border-color:var(--rpa-ink); color:#fff; }
      .adm-panel{ display:flex; flex-direction:column; gap:20px; max-width:760px; }
      .adm-grid2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .adm-field label{ display:block; font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--rpa-ink-soft); margin-bottom:6px; }
      .adm-field input, .adm-field textarea{ width:100%; font-family:'Inter',sans-serif; font-size:0.96rem; padding:10px 12px; border:1.5px solid var(--rpa-line); border-radius:10px; background:#fff; color:var(--rpa-ink); }
      .adm-field textarea{ min-height:80px; resize:vertical; }
      .adm-stage{ border:1px solid var(--rpa-line); border-radius:14px; background:#fff; padding:14px 18px; }
      .adm-stage summary{ cursor:pointer; font-family:'Space Grotesk',sans-serif; font-weight:600; }
      .adm-muted{ color:var(--rpa-ink-soft); font-weight:400; font-family:'JetBrains Mono',monospace; font-size:0.8rem; }
      .adm-list{ border:1px solid var(--rpa-line); border-radius:14px; padding:16px; background:#fff; }
      .adm-list-label{ font-family:'JetBrains Mono',monospace; font-size:0.78rem; color:var(--rpa-ink-soft); margin-bottom:10px; }
      .adm-list-item{ display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--rpa-line); padding:14px 0; }
      .adm-list-item:first-of-type{ border-top:none; padding-top:0; }
      .adm-list-item input, .adm-list-item textarea{ width:100%; font-family:'Inter',sans-serif; font-size:0.94rem; padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; }
      .adm-list-item textarea{ min-height:60px; resize:vertical; }
      .adm-remove{ align-self:flex-start; font-family:'JetBrains Mono',monospace; font-size:0.76rem; color:#B3261E; background:none; border:1px solid #B3261E; border-radius:8px; padding:4px 11px; cursor:pointer; }
      .adm-add{ font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:var(--rpa-primary-dark); background:var(--rpa-primary-soft); border:1px solid var(--rpa-primary); border-radius:8px; padding:7px 14px; cursor:pointer; margin-top:8px; }
      .adm-chips{ display:flex; flex-wrap:wrap; gap:8px; }
      .adm-chip{ display:inline-flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; font-size:0.82rem; border:1px solid var(--rpa-line); border-radius:999px; padding:5px 6px 5px 12px; }
      .adm-chip button{ background:none; border:none; cursor:pointer; color:var(--rpa-ink-soft); font-size:1rem; line-height:1; padding:0 4px; }
      .adm-chip-add{ display:flex; gap:8px; margin-top:12px; }
      .adm-chip-add input{ flex:1; padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; }
      .adm-savebar{ position:sticky; bottom:0; background:rgba(255,255,255,0.92); backdrop-filter:blur(10px); border-top:1px solid var(--rpa-line); padding:14px 0; }
      .adm-savebar-inner{ display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
      .adm-status{ font-family:'JetBrains Mono',monospace; font-size:0.85rem; }
      .adm-status.ok{ color:var(--rpa-primary-dark); }
      .adm-status.error{ color:#B3261E; }
      .adm-status.pending{ color:var(--rpa-ink-soft); }
    `}</style>
  );
}

const TABS = [
  { id: "general", label: "General" },
  { id: "journey", label: "Journey" },
  { id: "news", label: "News" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

function useAdminGate() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem("admin-unlocked") === "1"; } catch { return false; }
  });
  function tryUnlock(pass) {
    if (pass === ADMIN_PASSPHRASE) {
      setUnlocked(true);
      try { sessionStorage.setItem("admin-unlocked", "1"); } catch {}
      return true;
    }
    return false;
  }
  return [unlocked, tryUnlock];
}

function AdminSection() {
  const [unlocked, tryUnlock] = useAdminGate();
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState(false);

  const [mode, setMode] = useState(MODES[0].code);
  const [draft, setDraft] = useState(() => getEditableContent(mode));
  const [tab, setTab] = useState("general");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setDraft(getEditableContent(mode));
    setStatus(null);
  }, [mode]);

  function set(path, value) {
    setDraft((prev) => {
      const clone = cloneContent(prev);
      let node = clone;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return clone;
    });
  }

  async function handleSave() {
    setStatus({ type: "pending", message: "Saving…" });
    const res = await saveSiteContent(mode, draft);
    setStatus(
      res.ok
        ? { type: "ok", message: res.target === "firebase" ? "Saved to Firebase — live for every visitor." : "Saved in this browser (Firebase not connected — see README.md)." }
        : { type: "error", message: "Firebase save failed (see console). Your changes are still saved locally." }
    );
  }

  function handleReset() {
    if (!window.confirm("Discard saved overrides and revert this language to the code defaults?")) return;
    resetSiteContent(mode);
    setDraft(getEditableContent(mode));
    setStatus({ type: "ok", message: "Reverted to code defaults." });
  }

  if (!unlocked) {
    return (
      <div className="rpa-root adm-gate">
        <GlobalStyles />
        <AdminStyles />
        <div className="adm-gate-box">
          <Logo size={30} markOnly />
          <h1 className="rpa-h" style={{ marginTop: 14 }}>Admin</h1>
          <p>Enter the admin passphrase to continue.</p>
          <input
            type="password"
            value={passInput}
            onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !tryUnlock(passInput)) setPassError(true); }}
            autoFocus
          />
          <div>
            <button className="rpa-btn solid" onClick={() => { if (!tryUnlock(passInput)) setPassError(true); }}>Enter</button>
          </div>
          {passError && <p style={{ color: "#B3261E", marginTop: 10 }}>Wrong passphrase.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rpa-root">
      <GlobalStyles />
      <AdminStyles />
      <header className="rpa-nav">
        <div className="rpa-nav-bar">
          <Link className="rpa-brand" to="/"><Logo size={22} markOnly />Admin</Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--rpa-line)" }}>
              {MODES.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
            </select>
            <Link to="/" className="rpa-btn" style={{ padding: "8px 16px" }}>View site</Link>
          </div>
        </div>
      </header>

      <div className="rpa-wrap" style={{ padding: "28px 28px 40px" }}>
        {!FIREBASE_ENABLED && (
          <div className="adm-banner">
            Firebase isn't connected yet (<code>FIREBASE_ENABLED = false</code> in App.jsx). Edits here save to this browser only, so they won't show up for other visitors or on other devices. See README.md to connect Firestore so saves go live everywhere.
          </div>
        )}

        <div className="adm-tabs">
          {TABS.map((tb) => (
            <button key={tb.id} className={tab === tb.id ? "active" : ""} onClick={() => setTab(tb.id)}>{tb.label}</button>
          ))}
        </div>

        {tab === "general" && (
          <div className="adm-panel">
            <TextField label="Name" value={draft.name} onChange={(v) => set(["name"], v)} />
            <TextField label="Role" value={draft.role} onChange={(v) => set(["role"], v)} />
            <TextAreaField label="Tagline (hero headline)" value={draft.tagline} onChange={(v) => set(["tagline"], v)} />
            <TextAreaField label="Hero subtext" value={draft.heroLede} onChange={(v) => set(["heroLede"], v)} />
            <div className="adm-grid2">
              <TextField label="Primary CTA label" value={draft.ctaStart} onChange={(v) => set(["ctaStart"], v)} />
              <TextField label="Secondary CTA label" value={draft.ctaProcess} onChange={(v) => set(["ctaProcess"], v)} />
            </div>
            <div className="adm-grid2">
              <TextField label="Nav: News" value={draft.navNews} onChange={(v) => set(["navNews"], v)} />
              <TextField label="Nav: Projects" value={draft.navProjects} onChange={(v) => set(["navProjects"], v)} />
              <TextField label="Nav: About" value={draft.navAbout} onChange={(v) => set(["navAbout"], v)} />
              <TextField label="Nav: Contact" value={draft.navContact} onChange={(v) => set(["navContact"], v)} />
            </div>
            <div className="adm-grid2">
              <TextField label="Email" value={draft.socials.email} onChange={(v) => set(["socials", "email"], v)} />
              <TextField label="GitHub URL" value={draft.socials.github} onChange={(v) => set(["socials", "github"], v)} />
              <TextField label="LinkedIn URL" value={draft.socials.linkedin} onChange={(v) => set(["socials", "linkedin"], v)} />
            </div>
            <TextField label="CTA band heading" value={draft.ctaBand.heading} onChange={(v) => set(["ctaBand", "heading"], v)} />
            <TextAreaField label="CTA band body" value={draft.ctaBand.body} onChange={(v) => set(["ctaBand", "body"], v)} />
            <TextField label="CTA band button" value={draft.ctaBand.button} onChange={(v) => set(["ctaBand", "button"], v)} />
          </div>
        )}

        {(tab === "journey" || tab === "news" || tab === "projects") && (
          <div className="adm-banner">
            The homepage now comes from the MagicPath design (the <code>MatsHomepage</code> block in <code>App.jsx</code>), so this tab no longer changes it. It still edits the stored copy used by the legacy homepage code in this file.
          </div>
        )}

        {tab === "journey" && (
          <div className="adm-panel">
            {STAGE_META.map((s) => (
              <details className="adm-stage" key={s.id}>
                <summary>{draft.stages[s.id].title} <span className="adm-muted">({s.id})</span></summary>
                <div style={{ padding: "16px 4px 4px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <TextField label="Kicker (e.g. STAGE 01 / 08)" value={draft.stages[s.id].kicker} onChange={(v) => set(["stages", s.id, "kicker"], v)} />
                  <TextField label="Title" value={draft.stages[s.id].title} onChange={(v) => set(["stages", s.id, "title"], v)} />
                  <TextAreaField label="Summary" value={draft.stages[s.id].summary} onChange={(v) => set(["stages", s.id, "summary"], v)} />
                  <HeadingBodyListEditor label="Blocks (the sub-sections under this stage)" items={draft.stages[s.id].blocks} onChange={(v) => set(["stages", s.id, "blocks"], v)} />
                </div>
              </details>
            ))}
          </div>
        )}

        {tab === "news" && (
          <div className="adm-panel">
            <TextField label="Section kicker" value={draft.news.kicker} onChange={(v) => set(["news", "kicker"], v)} />
            <TextField label="Section heading" value={draft.news.heading} onChange={(v) => set(["news", "heading"], v)} />
            <NewsListEditor items={draft.news.items} onChange={(v) => set(["news", "items"], v)} />
          </div>
        )}

        {tab === "projects" && (
          <div className="adm-panel">
            <TextField label="Section kicker" value={draft.projects.kicker} onChange={(v) => set(["projects", "kicker"], v)} />
            <TextField label="Section heading" value={draft.projects.heading} onChange={(v) => set(["projects", "heading"], v)} />
            <ProjectsListEditor items={draft.projects.items} onChange={(v) => set(["projects", "items"], v)} />
          </div>
        )}

        {tab === "about" && (
          <div className="adm-panel">
            <TextField label="Kicker" value={draft.about.kicker} onChange={(v) => set(["about", "kicker"], v)} />
            <TextField label="Heading" value={draft.about.heading} onChange={(v) => set(["about", "heading"], v)} />
            <TextAreaField label="Intro" value={draft.about.intro} onChange={(v) => set(["about", "intro"], v)} />
            <HeadingBodyListEditor label="Timeline / sections" items={draft.about.sections} onChange={(v) => set(["about", "sections"], v)} headingLabel="e.g. 2023 — Now · Job title, Company" />
            <TextField label="Skills section heading" value={draft.about.skillsHeading} onChange={(v) => set(["about", "skillsHeading"], v)} />
            <div className="adm-field">
              <label>Skills / toolbelt chips</label>
              <ChipListEditor items={draft.about.skills} onChange={(v) => set(["about", "skills"], v)} />
            </div>
            <TextField label="CTA heading" value={draft.about.ctaHeading} onChange={(v) => set(["about", "ctaHeading"], v)} />
            <TextAreaField label="CTA body" value={draft.about.ctaBody} onChange={(v) => set(["about", "ctaBody"], v)} />
            <TextField label="CTA button" value={draft.about.ctaButton} onChange={(v) => set(["about", "ctaButton"], v)} />
          </div>
        )}

        {tab === "contact" && (
          <div className="adm-panel">
            <TextField label="Kicker" value={draft.contact.kicker} onChange={(v) => set(["contact", "kicker"], v)} />
            <TextField label="Heading" value={draft.contact.heading} onChange={(v) => set(["contact", "heading"], v)} />
            <TextAreaField label="Intro" value={draft.contact.intro} onChange={(v) => set(["contact", "intro"], v)} />
            <TextField label="Form endpoint (optional — e.g. a Formspree URL)" value={draft.contact.formEndpoint} onChange={(v) => set(["contact", "formEndpoint"], v)} />
            <HeadingBodyListEditor label="Contact detail rows (Email / LinkedIn / Based in, etc.)" items={draft.contact.sections} onChange={(v) => set(["contact", "sections"], v)} headingLabel="e.g. Email" bodyLabel="e.g. name@example.com" />
            <div className="adm-grid2">
              <TextField label="Form: name label" value={draft.contact.form.name} onChange={(v) => set(["contact", "form", "name"], v)} />
              <TextField label="Form: email label" value={draft.contact.form.email} onChange={(v) => set(["contact", "form", "email"], v)} />
              <TextField label="Form: message label" value={draft.contact.form.message} onChange={(v) => set(["contact", "form", "message"], v)} />
              <TextField label="Form: submit label" value={draft.contact.form.submit} onChange={(v) => set(["contact", "form", "submit"], v)} />
              <TextField label="Form: sending label" value={draft.contact.form.sending} onChange={(v) => set(["contact", "form", "sending"], v)} />
              <TextField label="Form: sent message" value={draft.contact.form.sent} onChange={(v) => set(["contact", "form", "sent"], v)} />
              <TextField label="Form: error message" value={draft.contact.form.error} onChange={(v) => set(["contact", "form", "error"], v)} />
            </div>
          </div>
        )}
      </div>

      <div className="adm-savebar">
        <div className="rpa-wrap adm-savebar-inner">
          <span className={`adm-status ${status?.type ?? ""}`}>{status?.message ?? " "}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="rpa-btn" onClick={handleReset}>Reset to defaults</button>
            <button className="rpa-btn solid" onClick={handleSave}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// Root router — mounted by main.jsx inside a <HashRouter>. This is the only
// thing main.jsx imports from this file.
// =====================================================================================
// =====================================================================================
// MagicPath homepage ("Mats Homepage" — project "Mats — Homepage Redesign", component
// 459253902437670912, revision 459258501928206336), inlined here so the whole site stays
// in this one file. The code is the MagicPath export converted from TSX to JSX, with a few
// small, deliberate changes for this site:
//   - in-page links scroll with JavaScript (a plain #section link would collide with the
//     HashRouter used on GitHub Pages)
//   - props: defaultMode / onModeChange (remember RPA vs Agentic AI) and onContact (open /contact)
//   - the "connect your email here" placeholder is a button to the existing contact page
//   - the note under the example projects is worded for visitors
// The example projects and the numbers in the animation are ILLUSTRATIONS, not results.
// Each part sits in its own function scope so its helper names (rpa, ai, Icon, ...) can't
// clash with anything else in this file.
// =====================================================================================
const MR_CSS = String.raw`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.mr-app{--bg:#f8f7f3;--ink:#172033;--secondary:#586477;--blue:#3b60c5;--border:#dce2eb;font-family:Inter,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh}.mr-app *{box-sizing:border-box}.mr-app button,.mr-app input{font:inherit}.mr-app button{cursor:pointer}.mr-app a{color:inherit;text-decoration:none}.mr-app :focus-visible{outline:3px solid #7694e1;outline-offset:5px}.mr-app section[id]{scroll-margin-top:30px}.mr-header{max-width:1272px;margin:auto;padding:27px 36px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e3de;gap:25px}.mr-brand{font-family:'Space Grotesk',sans-serif;font-size:27px;font-weight:700;letter-spacing:-1px;display:flex;align-items:center}.mr-logomark{font-family:monospace;font-size:24px;letter-spacing:-5px;color:var(--blue);margin-right:16px}.mr-period{color:var(--blue)}.mr-header nav{display:flex;gap:38px;font-size:13px;color:var(--secondary)}.mr-header nav a:hover{color:var(--blue)}.mr-headercta{border:1px solid #ccd4e0;padding:10px 17px;border-radius:5px;font-size:12px}.mr-headercta span{margin-left:27px;color:var(--blue)}.mr-app main{max-width:1200px;margin:auto;padding:0 24px}.mr-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:45px;padding:76px 0 59px;align-items:center}.mr-kicker{font-family:Inter,sans-serif;font-size:9px;font-weight:500;letter-spacing:1.6px;color:#697588;display:flex;align-items:center;gap:9px}.mr-kicker>i{width:5px;height:5px;background:#bd8c5f;border-radius:50%}.mr-hero h1{font-family:'Space Grotesk',sans-serif;font-size:55px;line-height:1.13;letter-spacing:-2.4px;font-weight:500;margin:24px 0}.mr-app em{font-style:normal;color:var(--blue)}.mr-herocopy>p{font-size:15px;line-height:1.85;color:var(--secondary);max-width:465px}.mr-actions{display:flex;gap:23px;align-items:center;margin-top:28px}.mr-primary{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 18px;background:var(--blue);color:#fff!important;border-radius:5px;font-size:12px}.mr-primary:hover{background:#2b4ca9}.mr-textlink{font-size:11px;display:flex;gap:13px;color:var(--secondary)!important}.mr-heronote{display:flex;align-items:center;gap:12px;margin-top:30px;font-size:10px;color:#737d87}.mr-heronote>span{font-size:19px;font-weight:400;color:#bf956f}.mr-system{background:#eff2f8;border:1px solid #dbe2ef;border-radius:12px;overflow:hidden;box-shadow:0 17px 33px #2d436b06}.mr-systemtop{display:flex;align-items:center;justify-content:space-between;padding:17px 20px 0;color:#7184a4;font-size:8px;letter-spacing:1.3px}.mr-systemtop button{border:1px solid #cfdaee;border-radius:5px;width:25px;height:25px;background:#f7f9fe;font-size:11px;color:#617dac}.mr-systemtitle{display:flex;justify-content:space-between;align-items:center;padding:12px 20px 0;color:#405a8b;font-size:13px}.mr-systemtitle small{font-family:monospace;font-size:8px;color:#8192af}.mr-diagram{position:relative;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;height:255px;padding:16px 14px 0;background-image:radial-gradient(#c4cfe4 .7px,transparent .7px);background-size:18px 18px}.mr-connections{position:absolute;inset:0;width:100%;height:100%}.mr-node{z-index:1;align-self:center;justify-self:center;display:flex;align-items:center;flex-direction:column;gap:10px}.mr-node>span{width:48px;height:48px;border:1px solid #ced9ed;background:#f8faff;border-radius:12px;color:#6884bd;display:grid;place-items:center;transition:background .3s,color .3s}.mr-node small{font-size:9px;color:#6880a7}.mr-node.active>span{background:var(--blue);color:white;border-color:var(--blue);box-shadow:0 0 0 5px #dce5f9}.mr-node.active small{color:var(--blue);font-weight:600}.mr-systemstatus{padding:13px 20px;border-top:1px solid #dbe3f0;font-size:9px;display:flex;flex-direction:column;gap:8px;min-height:64px;color:#4f6b9e}.mr-systemstatus b{font-weight:400;margin:0 5px;color:#8297bb}.mr-systemstatus i{display:inline-block;background:#80a286;width:4px;height:4px;border-radius:50%;margin-right:5px}.mr-systemstatus small{font-size:6px;letter-spacing:1.1px;color:#7c8ca6}.mr-mode{background:#f8f9fc;display:flex;align-items:center;justify-content:space-between;padding:12px 17px;border-top:1px solid #dbe3f0;font-size:9px;color:#71809b}.mr-mode>div{display:flex;background:#e8edf7;border-radius:5px;padding:3px;gap:2px}.mr-mode button{background:none;border:0;color:#6d7e9c;font-size:10px;padding:7px 12px;border-radius:3px}.mr-mode button.active{background:#fff;color:var(--blue);box-shadow:0 1px 3px #3046670c}.mr-values{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:24px 0;border-top:1px solid #e2e3de;border-bottom:1px solid #e2e3de;font-size:11px;color:#66717c}.mr-values>span:first-child{font-size:8px;letter-spacing:1.3px;color:#89918e}.mr-values b{font-weight:400;font-size:15px;color:#c29e7a}.mr-work{padding:64px 0 55px}.mr-sectionhead{display:flex;align-items:end;justify-content:space-between;gap:30px}.mr-app h2{font-family:'Space Grotesk',sans-serif;font-size:35px;font-weight:500;letter-spacing:-1.4px;line-height:1.2;margin:15px 0 0}.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0}.mr-workgrid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:31px}.mr-project{text-align:left;min-width:0;border:1px solid #dfe3e9;border-radius:10px;background:#fff;padding:0;overflow:hidden;transition:transform .2s,box-shadow .2s}.mr-project:hover{transform:translateY(-3px);box-shadow:0 12px 25px #213e6310}.mr-projectart{position:relative;background:#edf2fb;min-height:245px;padding:18px 23px 26px;border-bottom:1px solid #dfe7f3}.mr-artlabel{display:flex;justify-content:space-between;gap:14px;font-size:7px;letter-spacing:.7px;color:#7288b3}.mr-artlabel>span:last-child{font-size:6px;color:#7f8fac}.mr-invoiceflow{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:27px}.mr-invoice{width:131px;padding:16px 14px;background:#fff;border:1px solid #cfdbee;border-radius:7px;transform:rotate(-4deg);box-shadow:0 8px 15px #3b60c509}.mr-doc{color:#7994ca;display:block}.mr-invoice>strong{display:block;font-size:10px;color:#4d6696;margin:10px 0}.mr-invoiceline{display:block;height:4px;border-radius:2px;background:#e2e9f5;margin-top:6px}.mr-invoiceline.short{width:65%}.mr-invoice>small{display:block;font-family:monospace;font-size:7px;color:#91a1bb;margin-top:11px}.mr-flowarrow{font-size:22px;color:#8fa6d0}.mr-resultcards{display:flex;flex-direction:column;gap:12px}.mr-resultcards>div{position:relative;border:1px solid #cbd9ee;background:#f9fbff;border-radius:6px;padding:12px 15px 12px 34px;min-width:146px}.mr-resultcards>div>span{position:absolute;left:12px;top:15px;font-size:12px;color:#729783}.mr-resultcards strong{display:block;font-size:10px;font-weight:500;color:#5b729b}.mr-resultcards small{display:block;font-size:8px;margin-top:4px;color:#7d90b0}.mr-resultcards>div:last-child{background:#fcf7f0;border-color:#e5d6c0}.mr-resultcards>div:last-child>span{color:#b59263}.mr-aiart{background:#f3eee7;border-color:#e8dfd1}.mr-aiart .mr-artlabel{color:#9d8b76}.mr-answer{max-width:320px;margin:24px auto 0;border:1px solid #ded3c3;background:#fffdf8;border-radius:7px;box-shadow:0 7px 15px #66451e05;overflow:hidden}.mr-answerquestion{padding:10px 13px;font-size:9px;color:#86745f;border-bottom:1px solid #ebe3d7;display:flex;gap:8px;align-items:center}.mr-answerquestion>span{font-family:monospace;font-size:9px;color:#a18b70}.mr-answerbody{padding:13px;display:flex;gap:11px}.mr-spark{font-size:21px;color:#b28e61}.mr-answerbody strong{font-size:11px;font-weight:500;color:#756650}.mr-answerbody p{font-size:9px;line-height:1.6;color:#9c8a72;margin:5px 0 8px}.mr-source{font-size:7px;color:#977953;background:#f4ecdf;padding:4px 6px;border-radius:3px}.mr-approval{border-top:1px solid #ebe3d7;padding:9px 13px;font-size:8px;color:#8e7a60;display:flex;align-items:center;gap:6px}.mr-approval i{width:4px;height:4px;background:#bc965f;border-radius:50%}.mr-approval>span{margin-left:auto;color:#9e9875}.mr-projectbody{padding:23px 25px}.mr-projectbody .mr-kicker{font-size:8px;letter-spacing:1px;color:#7c8899}.mr-project h3{font-family:'Space Grotesk',sans-serif;font-size:22px;letter-spacing:-.6px;font-weight:500;color:var(--ink);margin:12px 0;display:flex;justify-content:space-between;gap:12px}.mr-project h3>span{color:var(--blue);font-weight:400;font-size:21px}.mr-projectbody>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0;max-width:400px}.mr-caseaction{display:flex;gap:13px;margin-top:19px;font-size:10px;color:var(--blue)}.mr-example-note{font-size:9px;line-height:1.6;color:#79818a;margin:15px 0 0}.mr-approach{padding:24px 0 50px}.mr-approachintro{text-align:right}.mr-modebadge{display:inline-block;background:#eaf0fc;border:1px solid #d9e3f5;border-radius:4px;padding:5px 8px;font-size:7px;letter-spacing:1px;color:#6280b9;margin-top:10px}.mr-stagebuttons{display:grid;grid-template-columns:repeat(8,1fr);margin-top:29px;border-bottom:1px solid #d4ddeb}.mr-stagebuttons button{background:none;text-align:left;border:0;border-bottom:2px solid transparent;min-width:0;padding:13px 10px 17px;color:#7b8695;font-size:12px}.mr-stagebuttons small{font-size:8px;display:block;font-family:monospace;margin-bottom:8px;color:#909baa}.mr-stagebuttons button.active{color:var(--blue);border-bottom-color:var(--blue);background:linear-gradient(transparent,#edf2fc)}.mr-stagebuttons button.active small{color:var(--blue)}.mr-stagecontent{display:grid;grid-template-columns:95px 1fr 210px;gap:36px;padding:32px 8px}.mr-stagenumber{font-family:'Space Grotesk',sans-serif;font-size:60px;line-height:1;letter-spacing:-3px;color:#c3cddd}.mr-stagenumber>span{display:block;font-size:10px;letter-spacing:1px;color:#8696ac;margin:8px 0 26px}.mr-stagenumber>svg{color:#a4b5d5}.mr-stagetext h3{font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:24px;letter-spacing:-.7px;line-height:1.3;margin:12px 0}.mr-stagetext>p{font-size:13px;line-height:1.8;color:var(--secondary);margin:0}.mr-stagechecks{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:18px;font-size:9px;color:#69798c}.mr-stagechecks b{font-weight:400;color:#84a091;margin-right:6px}.mr-stageaside{border-left:1px solid #dfe4eb;padding-left:24px}.mr-stageaside .mr-kicker{font-size:7px;letter-spacing:1.2px}.mr-stageaside>p{font-family:'Space Grotesk',sans-serif;font-size:19px;line-height:1.4;color:#687d9e;margin:14px 0 20px}.mr-stageaside>div{display:flex;gap:9px}.mr-stageaside button{width:32px;height:32px;background:#fff;border:1px solid #d4deeb;border-radius:50%;font-size:13px;color:#6882aa}.mr-loopnote{display:flex;gap:9px;color:#8096b8;font-size:17px;padding:0 8px}.mr-loopnote>span{font-size:10px;color:#7d8a9b;align-self:center}.mr-about{display:grid;grid-template-columns:.8fr 1.3fr;gap:65px;align-items:center;border-top:1px solid #e1e3df;padding:49px 0}.mr-aboutart{position:relative;display:grid;place-items:center;overflow:hidden;min-height:285px;background:#e8edf7;border:1px solid #dae2ef;border-radius:10px}.mr-aboutmonogram{font-family:'Space Grotesk',sans-serif;font-size:142px;letter-spacing:-15px;color:#758ec4;z-index:1}.mr-aboutmonogram>span{color:#c5a480}.mr-aboutartbottom{position:absolute;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;z-index:1;font-size:7px;letter-spacing:1px;color:#6c83ac}.mr-orbit{position:absolute;width:300px;height:300px;border:1px solid #d3ddec;border-radius:50%;left:-70px;top:-120px}.mr-orbit.two{width:400px;height:400px;top:-165px;left:-120px}.mr-orbit.three{width:500px;height:500px;left:-170px;top:-210px}.mr-aboutcopy h2{margin:18px 0 21px;font-size:32px}.mr-aboutcopy>p{font-size:13px;line-height:1.85;color:var(--secondary);max-width:540px}.mr-personalnote{display:flex;gap:12px;align-items:center;font-size:11px;color:#738096;margin-top:21px}.mr-personalnote>span{font-family:Georgia;font-size:39px;line-height:1;color:#c7a787}.mr-contact{background:#253d75;color:#fff;border-radius:11px;padding:36px 40px;overflow:hidden}.mr-contact .mr-kicker{color:#bccbeb;font-size:8px}.mr-contact>div:nth-child(2){display:flex;justify-content:space-between;align-items:center;gap:25px}.mr-contact h2{font-size:35px;line-height:1.17;color:#fbfaf5;margin:17px 0}.mr-contactbutton{flex-shrink:0;border:1px solid #e6e3d9;border-radius:5px;background:#f8f4e9;padding:13px 17px;font-size:11px;color:#3e527f;display:flex;gap:27px}.mr-contact>p{font-size:10px;color:#b6c6e7;margin:3px 0 0}.mr-footer{max-width:1200px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:28px 24px}.mr-footer .mr-brand{font-size:22px}.mr-footer>span,.mr-footer>a:last-child{font-size:9px;color:#737f8d}.mr-overlay{position:fixed;inset:0;z-index:99;background:#17203377;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px}.mr-modal{position:relative;background:var(--bg);border:1px solid #dbe1e8;border-radius:12px;max-width:610px;width:100%;max-height:90vh;overflow:auto;padding:39px}.mr-close{position:absolute;top:11px;right:14px;border:0;background:none;font-size:26px;color:#78859a}.mr-modal h2{font-size:30px;margin:20px 0 25px}.mr-modal h3{font-size:13px;margin:22px 0 10px}.mr-modal p,.mr-modal li{font-size:13px;line-height:1.9;color:var(--secondary)}.mr-modal ol{padding-left:19px}.mr-previewnotice{padding:14px;border:1px solid #e1dacd;border-radius:5px;background:#f3efe6;color:#89785e;font-size:10px;line-height:1.7;margin-top:23px}@media(prefers-reduced-motion:reduce){.mr-app *{transition:none!important}}@media(max-width:1050px){.mr-hero{gap:26px}.mr-hero h1{font-size:45px}.mr-systemtitle{font-size:11px}.mr-actions{gap:16px}.mr-textlink{font-size:10px}.mr-stagecontent{grid-template-columns:75px 1fr 170px;gap:25px}.mr-invoiceflow{gap:12px}.mr-projectart{padding:17px}.mr-project h3{font-size:20px}.mr-about{gap:35px}}@media(max-width:720px){.mr-header{padding:20px;gap:15px;flex-wrap:wrap}.mr-brand{font-size:25px}.mr-header nav{order:3;width:100%;justify-content:center;gap:40px;font-size:12px;padding-top:13px}.mr-headercta{margin-left:auto;font-size:11px}.mr-app main{padding:0 20px}.mr-hero{grid-template-columns:1fr;padding:36px 0;gap:30px}.mr-hero h1{font-size:43px;letter-spacing:-1.9px}.mr-herocopy>.mr-kicker{font-size:7px;letter-spacing:1px}.mr-herocopy>p{font-size:15px}.mr-actions{flex-wrap:wrap;gap:18px}.mr-primary{font-size:12px}.mr-textlink{font-size:12px}.mr-system{width:100%;max-width:480px;margin:auto}.mr-values{flex-wrap:wrap;justify-content:center;gap:15px 20px;font-size:10px}.mr-values>span:first-child{width:100%;text-align:center}.mr-values b{display:none}.mr-work{padding:36px 0}.mr-sectionhead{display:block}.mr-app h2{font-size:29px}.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;margin-top:17px}.mr-workgrid{grid-template-columns:1fr;gap:22px}.mr-projectbody{padding:22px}.mr-project h3{font-size:23px}.mr-projectbody>p{font-size:13px}.mr-projectart{min-height:235px}.mr-example-note{font-size:10px}.mr-approach{padding:13px 0 35px}.mr-approachintro{text-align:left}.mr-stagebuttons{grid-template-columns:repeat(4,1fr);gap:4px}.mr-stagebuttons button{padding:12px 9px;min-height:65px}.mr-stagecontent{grid-template-columns:50px 1fr;gap:18px;padding:25px 0}.mr-stagenumber{font-size:43px}.mr-stagenumber>svg{width:32px}.mr-stagetext h3{font-size:22px}.mr-stageaside{grid-column:2;border-left:0;border-top:1px solid #dfe4eb;padding:20px 0 0}.mr-stageaside>p{font-size:18px}.mr-stagechecks{font-size:10px;display:grid}.mr-stageaside button{width:40px;height:40px}.mr-loopnote{padding:0;font-size:19px}.mr-about{grid-template-columns:1fr;padding:30px 0;gap:28px}.mr-aboutart{min-height:225px}.mr-aboutcopy h2{font-size:29px}.mr-aboutcopy>p{font-size:14px}.mr-contact{padding:28px 23px}.mr-contact>div:nth-child(2){display:block}.mr-contact h2{font-size:30px;margin:19px 0 23px}.mr-contact>p{margin-top:20px;line-height:1.7}.mr-footer{padding:25px 20px}.mr-footer>span{display:none}.mr-modal{padding:32px 24px}.mr-systemstatus{font-size:8px}.mr-systemstatus small{font-size:6px}}


/* Additions for the Senior-Automation-Engineer integration (not part of the MagicPath export) */
body.mr-body{margin:0;background:#f8f7f3}
.mr-modalcta{border:0;margin-top:23px}

.ls-story{background:#eff3fa;border:1px solid #d6e0ef;border-radius:13px;overflow:hidden;box-shadow:0 15px 35px #294a7d08;min-width:0}.ls-top{display:flex;justify-content:space-between;gap:10px;padding:19px 20px 0;font-size:7px;letter-spacing:1.05px;color:#6c82a7;align-items:center}.ls-demo{border:1px solid #ccd8ec;border-radius:3px;padding:3px 5px;font-size:6px;white-space:nowrap}.ls-heading{display:flex;justify-content:space-between;align-items:center;padding:14px 20px 0;gap:12px}.ls-heading strong{font-size:13px;font-weight:500;color:#405d8e}.ls-heading>span{font-size:8px;font-family:monospace;color:#8396b4;white-space:nowrap}.ls-canvas>svg{width:100%;height:auto;display:block}.ls-node{color:#7391c5;cursor:pointer;outline:none}.ls-node>rect{fill:#f9fbff;stroke:#c5d5ed;transition:fill .3s,stroke .3s}.ls-node>text{font-family:Inter,sans-serif;font-size:9px;fill:#6c83a7}.ls-node:hover>rect,.ls-node:focus-visible>rect{stroke:#3b60c5;stroke-width:2.5}.ls-node.ls-active{color:white}.ls-node.ls-active>rect{fill:#3b60c5;stroke:#3b60c5;filter:drop-shadow(0 4px 5px #3b60c522)}.ls-node.ls-active>text{fill:#3b60c5;font-weight:600}.ls-node.ls-complete{color:#719886}.ls-node.ls-complete>rect{fill:#f2f7f4;stroke:#c3d9cd}.ls-token{transition:transform .7s cubic-bezier(.4,0,.2,1)}.ls-flowdash{animation:ls-dash 5s linear infinite;animation-play-state:paused}.ls-running .ls-flowdash{animation-play-state:running}@keyframes ls-dash{to{stroke-dashoffset:-48}}.ls-caption{background:#f9fbff;border-top:1px solid #dce5f2;padding:16px 20px;min-height:105px}.ls-caption>div{display:flex;align-items:center;gap:7px}.ls-caption strong{font-size:11px;color:#46658f;font-weight:600}.ls-caption>div>span:last-child{margin-left:auto;font-family:monospace;letter-spacing:.6px;font-size:7px;color:#7e94b4}.ls-bluedot,.ls-amberdot{width:5px;height:5px;border-radius:50%;background:#7296ce}.ls-amberdot{background:#bf9259}.ls-caption>p{font-size:11px;line-height:1.7;color:#627c9f;margin:9px 0 0;min-height:37px}.ls-approve{display:flex;justify-content:space-between;align-items:center;gap:14px;width:100%;margin-top:10px;border:1px solid #d7bb92;border-radius:5px;background:#f8eddc;color:#926a36;font-size:10px!important;padding:9px 10px}.ls-controls{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;gap:8px;border-top:1px solid #dce5f2;background:#f7f9fd}.ls-controls>div{display:flex;gap:5px}.ls-controls button{min-width:28px;height:28px;border:1px solid #d4dff0;border-radius:4px;background:#fff;color:#6883ad;font-size:12px;padding:0 7px}.ls-controls button>span{font-size:9px;margin-left:5px}.ls-controls label{display:flex;align-items:center;gap:5px;font-size:8px;color:#7186a5;cursor:pointer}.ls-controls input{accent-color:#b38b55;width:11px;height:11px}.ls-bottom{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 16px;border-top:1px solid #dce5f2;background:#f9fbff}.ls-bottom>span{font-size:7px;color:#8094b0;max-width:50%;line-height:1.5}.ls-bottom>div{display:flex;gap:2px;background:#e9eff9;border-radius:5px;padding:3px}.ls-bottom button{border:0;background:none;border-radius:3px;font-size:9px;color:#7790b5;padding:6px 9px}.ls-bottom button.active{background:white;color:#3b60c5;box-shadow:0 1px 3px #294a7d0d}.mr-hero{align-items:center;grid-template-columns:1.08fr 1fr;gap:35px}@media(max-width:720px){.mr-hero{grid-template-columns:1fr}.ls-top{padding:17px 15px 0;font-size:6px}.ls-heading{padding:13px 15px 0}.ls-heading strong{font-size:12px}.ls-caption{padding:14px 16px}.ls-caption>p{font-size:12px}.ls-controls{flex-wrap:wrap;padding:12px;gap:10px}.ls-controls label{font-size:9px}.ls-controls button{min-width:31px;height:33px}.ls-bottom{padding:10px 12px}.ls-bottom>span{font-size:7px}}@media(prefers-reduced-motion:reduce){.ls-story *{animation:none!important;transition:none!important}}

.ls-controlhint{font-size:8px;color:#7186a5}.sv-search{animation:sv-search 3.5s ease-in-out infinite}.sv-grow{transform-box:fill-box;transform-origin:left;animation:sv-grow 1.6s ease-out both}.sv-draw,.sv-chart{stroke-dasharray:400;stroke-dashoffset:400;animation:sv-draw 2.7s ease forwards}.sv-check{animation:sv-check .55s ease-out both;transform-box:fill-box;transform-origin:center}.sv-flowdot{animation:sv-dot 2.8s ease-in-out infinite}.ls-story .sv-search,.ls-story .sv-grow,.ls-story .sv-draw,.ls-story .sv-chart,.ls-story .sv-check,.ls-story .sv-flowdot{animation-play-state:paused}.ls-running .sv-search,.ls-running .sv-grow,.ls-running .sv-draw,.ls-running .sv-chart,.ls-running .sv-check,.ls-running .sv-flowdot{animation-play-state:running}@keyframes sv-search{0%,100%{transform:translateX(-32px)}50%{transform:translateX(48px)}}@keyframes sv-grow{from{transform:scaleX(.25)}to{transform:scaleX(1)}}@keyframes sv-draw{to{stroke-dashoffset:0}}@keyframes sv-check{from{opacity:.25;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sv-dot{0%{transform:translateX(-12px)}50%{transform:translateX(64px)}100%{transform:translateX(-12px)}}.ls-story:not(.ls-running) .sv-draw,.ls-story:not(.ls-running) .sv-chart{stroke-dashoffset:0;animation:none}.ls-story:not(.ls-running) .sv-grow,.ls-story:not(.ls-running) .sv-check{animation:none}@media(prefers-reduced-motion:reduce){.ls-story .sv-draw,.ls-story .sv-chart{stroke-dashoffset:0;animation:none!important}.ls-story .sv-grow,.ls-story .sv-check{opacity:1;transform:none}}
`;

const MatsHomepage = (() => {
  const StageVisual = (() => {
    function StageVisual({
      stage,
      mode
    }) {
      const ink = "#6687c4", pale = "#eef3fc", line = "#ccdaef", green = "#77a48e";
      return <svg x="24" y="34" width="238" height="84" viewBox="0 0 238 84" role="img" aria-label={["Magnifying glass inspecting workflow documents", "Candidate scoring bars", "A branching flowchart", "A code editor connected to an application", "A test checklist with passing checks", "A staged deployment to three systems", "A dashboard with metrics and a trend chart", "Baseline and improved results feeding the next cycle"][stage]}>{stage === 0 && <><g fill={pale} stroke={line}>{[15, 77, 139].map((x) => <rect key={x} x={x} y="10" width="46" height="63" rx="5" />)}</g><g stroke={line} strokeWidth="3" strokeLinecap="round">{[25, 87, 149].map((x) => <g key={x}><path d={`M${x} 25h25M${x} 34h25M${x} 43h16`} /></g>)}</g><g className="sv-search" stroke={ink} strokeWidth="3" fill="none"><circle cx="92" cy="39" r="23" fill="#e4edff77" /><path d="m109 56 21 20" strokeWidth="8" strokeLinecap="round" /></g><text x="207" y="42" textAnchor="middle" fill={green} fontSize="20">✓</text></>}{stage === 1 && <>{[["Value", 156], ["Effort", 80], ["Risk", 48]].map(([label, w], i) => <g key={label}><text x="6" y={21 + i * 25} fill="#7d90ae" fontSize="9">{label}</text><rect x="51" y={10 + i * 25} width="172" height="13" rx="4" fill={pale} /><rect className="sv-grow" style={{
        animationDelay: `${i * 0.15}s`
      }} x="51" y={10 + i * 25} width={Number(w)} height="13" rx="4" fill={i === 0 ? ink : i === 1 ? "#a6bce3" : "#d1b38b"} /></g>)}</>}{stage === 2 && <><g fill="none" stroke={ink} strokeWidth="1.5"><path className="sv-draw" d="M40 42h39m40 0h36m-56 19v15h76V59" /></g><rect x="5" y="27" width="40" height="29" rx="5" fill={pale} stroke={line} /><path d="m99 21 22 21-22 21-22-21Z" fill="#e1eafb" stroke={ink} /><rect x="155" y="9" width="70" height="26" rx="5" fill={pale} stroke={line} /><rect x="155" y="48" width="70" height="26" rx="5" fill="#f6f0e7" stroke="#dfcfb8" /><g fontSize="8" textAnchor="middle" fill="#6480ac"><text x="25" y="45">Input</text><text x="99" y="45">Check</text><text x="190" y="25">{mode ? "Retrieve" : "Update"}</text><text x="190" y="64">Retry</text></g><path d="M119 42h17V22h19" fill="none" stroke={ink} strokeWidth="1.5" /><circle className="sv-flowdot" cx="60" cy="42" r="3" fill="#3b60c5" /></>}{stage === 3 && <><rect x="8" y="7" width="130" height="70" rx="6" fill="#edf2fa" stroke={line} /><path d="M8 22h130" stroke={line} /><g fill="#a9bbda"><circle cx="19" cy="15" r="2" /><circle cx="27" cy="15" r="2" /><circle cx="35" cy="15" r="2" /></g><g stroke={ink} strokeWidth="3" strokeLinecap="round"><path className="sv-draw" d="M23 35h30m8 0h20M31 46h54m-54 11h73M23 68h21" /></g><path d="M139 43h27" stroke={ink} strokeWidth="1.5" strokeDasharray="3 3" /><rect x="171" y="20" width="57" height="48" rx="7" fill="#fff" stroke={line} /><text x="199" y="50" textAnchor="middle" fontFamily="monospace" fontSize="15" fill={ink}>{mode ? "AI" : "API"}</text></>}{stage === 4 && <>{[mode ? "Sources grounded" : "Fields validated", mode ? "Tool errors tested" : "Timeouts handled", mode ? "Regression passed" : "Outputs matched"].map((label, i) => <g key={label}><rect x="15" y={4 + i * 27} width="210" height="23" rx="4" fill={pale} stroke={line} /><text x="28" y={19 + i * 27} fontSize="9" fill="#758bae">{label}</text><g className="sv-check" style={{
        animationDelay: `${i * 0.45}s`
      }}><circle cx="207" cy={15 + i * 27} r="7" fill="#e0eee5" /><path d={`m203 ${15 + i * 27} 3 3 5-6`} stroke={green} fill="none" strokeWidth="1.5" /></g></g>)}</>}{stage === 5 && <><path d="M42 37H192" stroke={line} strokeWidth="2" strokeDasharray="4 4" />{["Shadow", "Pilot", "Live"].map((s, i) => <g key={s}><rect x={15 + i * 79} y="15" width="47" height="43" rx="6" fill={pale} stroke={line} /><path d={`M${27 + i * 79} 30h22m-22 9h22m-22 9h14`} stroke={ink} strokeWidth="2" /><circle className="sv-check" style={{
        animationDelay: `${i * 0.5}s`
      }} cx={55 + i * 79} cy="17" r="4" fill={green} /><text x={39 + i * 79} y="75" fontSize="8" fill="#758bad" textAnchor="middle">{s}</text></g>)}</>}{stage === 6 && <><rect x="7" y="3" width="224" height="78" rx="6" fill="#f9fbff" stroke={line} />{[[mode ? "Tasks" : "Runs", "24"], [mode ? "Quality" : "Passed", mode ? "96%" : "23"], [mode ? "Cost" : "Errors", mode ? "$0.04" : "1"]].map(([s, v], i) => <g key={s}><rect x={15 + i * 72} y="10" width="64" height="27" rx="3" fill={pale} /><text x={21 + i * 72} y="20" fontSize="6" fill="#8598b6">{s}</text><text x={21 + i * 72} y="31" fontSize="10" fill={ink}>{v}</text></g>)}<path d="M18 49H218M18 63H218M18 74H218" stroke="#e1e8f3" /><path className="sv-chart" d="M18 69 40 65 62 67 84 54 106 59 128 45 150 52 172 42 194 46 218 40" fill="none" stroke="#668dce" strokeWidth="2" strokeLinejoin="round" /><text x="221" y="75" textAnchor="end" fontSize="5" fill="#8ca0bd">EXAMPLE DATA</text></>}{stage === 7 && <><text x="9" y="20" fontSize="8" fill="#8193ad">Baseline</text><rect x="9" y="27" width={mode ? 80 : 125} height="12" rx="3" fill="#c1cfe5" /><text x="9" y="55" fontSize="8" fill="#6683ae">{mode ? "Quality improved" : "Handling time reduced"}</text><rect className="sv-grow" x="9" y="62" width={mode ? 125 : 56} height="12" rx="3" fill={ink} /><g transform="translate(191 43)" stroke={ink} strokeWidth="2" fill="none"><path className="sv-draw" d="M21-12A24 24 0 0 0-22-9m0-12v12h12M-21 12A24 24 0 0 0 22 9m0 12V9H10" /></g><text x="191" y="47" textAnchor="middle" fill="#7690b8" fontSize="8">Repeat</text></>}</svg>;
    }
    return StageVisual;
  })();

  const LifecycleStory = (() => {
    const locations = [[64, 55], [194, 55], [324, 55], [454, 55], [454, 303], [324, 303], [194, 303], [64, 303]];
    const rpa = [["Identify", "Spot repetitive work and inspect the best candidates.", "Discover the opportunity", "Search \xB7 observe \xB7 understand"], ["Assess", "Compare value, effort, and risk before starting the build.", "Score the candidates", "Value \xB7 effort \xB7 risk"], ["Design", "Map the workflow, decisions, and recovery paths.", "Draw the process", "Inputs \u2192 decisions \u2192 outcomes"], ["Develop", "Connect reliable tools and implement the workflow.", "Build the connections", "API \u2192 script \u2192 automation"], ["Test", "Validate results and deliberately test failure conditions.", "Check the results", "Data \xB7 recovery \xB7 outputs"], ["Deploy", "Move from shadow mode to a pilot, then a staged release.", "Release in stages", "Shadow \u2192 pilot \u2192 live"], ["Monitor", "Track runs, errors, and trends in a clear dashboard.", "Watch system health", "Illustrative operational metrics"], ["Improve", "Compare outcomes with the baseline and feed learning into the next cycle.", "Measure and refine", "Compare \u2192 learn \u2192 repeat"]];
    const ai = [["Identify", "Find tasks where language and unstructured information matter.", "Discover the use case", "Search \xB7 inspect \xB7 understand"], ["Scope", "Weigh task value against effort, risk, and data readiness.", "Scope the system", "Value \xB7 effort \xB7 risk"], ["Design", "Map context, retrieval, tool calls, and recovery paths.", "Design the agent flow", "Context \u2192 retrieval \u2192 action"], ["Build", "Connect retrieval, prompts, and validated tools.", "Build the agent", "Sources \xB7 model \xB7 tools"], ["Evaluate", "Check groundedness, tool behavior, and regression cases.", "Evaluate the behavior", "Evidence \xB7 tools \xB7 regression"], ["Deploy", "Move from shadow mode to a bounded pilot and staged release.", "Release in stages", "Shadow \u2192 pilot \u2192 live"], ["Observe", "Inspect task quality, costs, and execution trends.", "Observe the agent", "Illustrative quality and cost metrics"], ["Improve", "Compare evaluation results and refine the next version.", "Learn and improve", "Evaluate \u2192 refine \u2192 repeat"]];
    function NodeIcon({
      i
    }) {
      return <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{i === 0 ? <><circle cx="-2" cy="-2" r="6" /><path d="m3 3 6 6" /></> : i === 1 ? <path d="M-8 8V0M0 8V-8M8 8V-4" /> : i === 2 ? <><rect x="-9" y="-8" width="7" height="6" rx="1" /><rect x="2" y="3" width="7" height="6" rx="1" /><path d="M-5-2v8h7M-2-5h7v8" /></> : i === 3 ? <path d="m-5-7-6 7 6 7m10-14 6 7-6 7M2-10-2 10" /> : i === 4 ? <><path d="M-4-9h8M-2-9v8L-9 9H9L2-1v-8M-5 4H5" /></> : i === 5 ? <path d="M0 5V-10m-5 5 5-5 5 5M-9 3v7H9V3" /> : i === 6 ? <path d="M-11 1h5l3-8 5 15 3-7h6" /> : <path d="M8-4A9 9 0 0 0-8-5l-2 2m0-6v6h6M-8 4A9 9 0 0 0 8 5l2-2m0 6V3H4" />}</g>;
    }
    function LifecycleStory({
      mode,
      onMode
    }) {
      const [frame, setFrame] = useState(0), [play, setPlay] = useState(true), [visible, setVisible] = useState(false), [reduced, setReduced] = useState(false);
      const root = useRef(null);
      const rows = mode ? ai : rpa;
      const current = rows[frame], stage = frame;
      const moving = play && visible && !reduced;
      useEffect(() => {
        const q = matchMedia("(prefers-reduced-motion: reduce)");
        const f = () => setReduced(q.matches);
        f();
        q.addEventListener("change", f);
        const o = new IntersectionObserver((es) => setVisible(es[0].isIntersecting), {
          threshold: 0.15
        });
        if (root.current) o.observe(root.current);
        return () => {
          q.removeEventListener("change", f);
          o.disconnect();
        };
      }, []);
      useEffect(() => {
        if (!moving) return;
        const t = setTimeout(() => setFrame((v) => (v + 1) % 8), 3800);
        return () => clearTimeout(t);
      }, [moving, frame]);
      useEffect(() => setFrame(0), [mode]);
      const jump = (n) => {
        setPlay(false);
        setFrame(n);
      };
      const advance = (dir) => {
        setPlay(false);
        setFrame((v) => (v + dir + 8) % 8);
      };
      const labels = mode ? ["Identify", "Scope", "Design", "Build", "Evaluate", "Deploy", "Observe", "Improve"] : ["Identify", "Assess", "Design", "Develop", "Test", "Deploy", "Monitor", "Improve"];
      return <div className={`ls-story ${moving ? "ls-running" : ""}`} ref={root}><div className="ls-top"><span>FROM CANDIDATE TO CONTINUOUS IMPROVEMENT</span><span className="ls-demo">EXAMPLE</span></div><div className="ls-heading"><strong>{mode ? "An agent, with boundaries." : "A workflow, with a way forward."}</strong><span>{String(frame + 1).padStart(2, "0")} / 08</span></div><div className="ls-canvas"><svg viewBox="0 0 520 360" role="group" aria-label="Interactive eight-stage lifecycle with stage-specific illustrations"><defs><pattern id="ls-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#c5d1e7" /></pattern><marker id="ls-arrow" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="m1 1 4 3-4 3" fill="none" stroke="#94aad2" strokeWidth="1.3" /></marker></defs><rect width="520" height="360" fill="url(#ls-dots)" /><path d="M64 55H454V303H64V55" fill="none" stroke="#d1dcee" strokeWidth="2" /><path className="ls-flowdash" d="M90 55H166M220 55H296M350 55H426M454 88V271M426 303H350M296 303H220M166 303H92M64 272V89" fill="none" stroke="#91abdb" strokeWidth="1.4" strokeDasharray="4 8" markerEnd="url(#ls-arrow)" />{locations.map(([x, y], i) => <g key={i} className={`ls-node ${stage === i ? "ls-active" : ""} ${stage > i ? "ls-complete" : ""}`} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`Explore ${labels[i]}`} onClick={() => jump(i)} onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump(i);
        }
      }}><rect x="-25" y="-25" width="50" height="50" rx="13" /><NodeIcon i={i} /><text y={i < 4 ? 43 : 42} textAnchor="middle">{labels[i]}</text>{stage > i && <g transform="translate(23 -22)"><circle r="7" fill="#e6f0e9" stroke="#a6c5af" /><path d="m-3 0 2 2 4-4" fill="none" stroke="#5c9270" strokeWidth="1.2" /></g>}</g>)}<g className="ls-token" style={{
        transform: `translate(${locations[stage][0]}px,${locations[stage][1] - 34}px)`
      }}><rect x="-12" y="-8" width="24" height="14" rx="4" fill="#3b60c5" /><path d="M-6-3H6M-6 0H3" stroke="#fff" strokeWidth="1.1" /></g><g transform="translate(117 108)"><rect width="286" height="153" rx="10" fill="#fff" stroke="#cad7ec" /><text x="18" y="23" fill="#365587" fontFamily="Inter,sans-serif" fontWeight="500" fontSize="12">{current[2]}</text><StageVisual key={mode + "-" + stage} stage={stage} mode={mode} /><text x="143" y="132" textAnchor="middle" fill="#7187a7" fontFamily="Inter,sans-serif" fontSize="8">{current[3]}</text><rect x="18" y="143" width="250" height="3" rx="1.5" fill="#e7edf7" /><rect x="18" y="143" width={(frame + 1) * 31.25} height="3" rx="1.5" fill="#8da9dc" /></g></svg></div><div className="ls-caption" aria-live={play ? "off" : "polite"}><div><span className="ls-bluedot" /><strong>{current[0]}</strong><span>{frame === 7 ? "BACK TO THE START" : `STAGE 0${stage + 1}`}</span></div><p>{current[1]}</p></div><div className="ls-controls"><div><button onClick={() => setPlay(!play)} aria-label={play ? "Pause animation" : "Play animation"}>{play ? "\u2161" : "\u25B6"} <span>{play ? "Pause" : "Play"}</span></button><button aria-label="Restart animation" onClick={() => {
        setFrame(0);
        setPlay(true);
      }}>↻</button><button aria-label="Previous animation step" onClick={() => advance(-1)}>←</button><button aria-label="Next animation step" onClick={() => advance(1)}>→</button></div><span className="ls-controlhint">Click any stage to explore</span></div><div className="ls-bottom"><span>{reduced ? "Reduced motion \xB7 use step controls" : "Illustrative scenario \xB7 no live systems"}</span><div role="group" aria-label="Animation approach"><button className={!mode ? "active" : ""} aria-pressed={!mode} onClick={() => onMode(0)}>RPA</button><button className={mode ? "active" : ""} aria-pressed={!!mode} onClick={() => onMode(1)}>Agentic AI</button></div></div></div>;
    }
    return LifecycleStory;
  })();

  const MatsHomepage = (() => {
    const rpa = [["Identify", "Start with the work. Not the tool.", "Shadow the people doing the work. Look for repetition, stable rules, and a problem worth solving.", "Observe the workflow", "Measure frequency and effort", "Keep judgment-heavy decisions human"], ["Assess", "Make the case before the build.", "Compare expected time saved with complexity, risk, and system stability. Agree on the outcome with the process owner.", "Establish a baseline", "Rank candidates by return", "Agree on ownership"], ["Design", "Map the edges as well as the path.", "Map actors, handoffs, and exceptions in BPMN swimlanes. Validate the process with the people who know it.", "Map every handoff", "Design exception paths", "Review with the team"], ["Develop", "Choose the simplest reliable tool.", "Use APIs first, scripts for data movement, and RPA where systems have no programmatic access.", "Build clear interfaces", "Validate every input", "Route uncertainty to a person"], ["Test", "Make failure part of the test.", "Compare automated and manual results on historical cases. Deliberately test bad data, missing fields, and timeouts.", "Run in parallel", "Compare actual outputs", "Test recovery paths"], ["Deploy", "Ship with a way back.", "Start in shadow mode, release to a subset, then expand. Include a rollback plan, documentation, and a named owner.", "Roll out in stages", "Prepare rollback", "Hand over the runbook"], ["Monitor", "Make every run visible.", "Track runs, exceptions, and time saved. Alert a person when a workflow fails, and review performance regularly.", "Track operational health", "Make alerts actionable", "Review outcomes monthly"], ["Improve", "Measure what changed. Then repeat.", "Compare 30- and 90-day results with the baseline. Feed real observations into the next discovery cycle.", "Compare baseline to actual", "Refine the workflow", "Identify the next opportunity"]];
    const ai = [["Identify", "Find a useful job for an agent.", "Look for language-heavy work or unstructured information. Keep the task bounded and the desired outcome clear.", "Understand the decision", "Check available evidence", "Define human ownership"], ["Scope", "Give autonomy a clear boundary.", "Weigh value against the cost of an error. Define what the agent may read, propose, and execute.", "Define permissions", "Set approval boundaries", "Agree on success criteria"], ["Design", "Design the system around the model.", "Specify context, retrieval, tools, and recovery paths. Make every consequential action traceable.", "Use least-privilege tools", "Design escalation", "Plan for missing evidence"], ["Build", "Start small. Add complexity with evidence.", "Begin with a prompt and retrieval. Add tools or loops only when evaluation shows they improve the outcome.", "Validate structured outputs", "Bound tool execution", "Record the action trail"], ["Evaluate", "An evaluation set, not just a demo.", "Test representative tasks, unsafe retrieved instructions, and tool failures. Check groundedness, quality, latency, and cost.", "Use real task examples", "Test failure and misuse", "Review with domain experts"], ["Deploy", "Earn autonomy through evidence.", "Begin in shadow mode, then require approval, then allow limited actions. Keep a stop mechanism and accountable owner.", "Shadow before acting", "Approve consequential actions", "Keep rollback ready"], ["Observe", "Look beyond whether it ran.", "Review outcomes, traces, tool errors, and cost. Escalate low-quality or out-of-policy results to a person.", "Inspect task quality", "Watch cost and latency", "Review interventions"], ["Improve", "Turn feedback into better evaluations.", "Add real failures to regression tests. Re-evaluate changes to prompts, retrieval, tools, and permissions.", "Capture corrections", "Re-test every change", "Revisit the next useful task"]];
    function Icon({
      n = 0,
      size = 24
    }) {
      const paths = [<><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>, <><path d="M4 20V12m8 8V5m8 15V9M2 21h20" /></>, <><rect x="2" y="2" width="7" height="6" rx="1" /><rect x="15" y="16" width="7" height="6" rx="1" /><path d="M5 8v11h10M9 5h10v11" /></>, <><path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18" /></>, <><path d="M8 3h8M10 3v7L3 21h18l-7-11V3M7 16h10" /></>, <><path d="M12 16V2m-5 5 5-5 5 5M3 14v7h18v-7" /></>, <><path d="M2 13h5l3-8 4 15 3-7h5" /></>, <><path d="M20 8A8 8 0 0 0 6 5L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" /></>];
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[n % 8]}</svg>;
    }
    const examples = [{
      title: "From invoice to verified record.",
      category: "RPA \xB7 SYSTEM INTEGRATION",
      description: "A workflow that connects legacy systems, validates the details, and hands exceptions to a person.",
      question: "How can invoice data move between disconnected systems without adding another manual queue?",
      approach: "Validate required fields, match the purchase order, and update the destination system. Keep mismatches in a review queue with the relevant context.",
      measure: "Compare handling time and error rates with the manual baseline. Report exceptions separately from successful automated runs."
    }, {
      title: "Useful answers. Visible evidence.",
      category: "AGENTIC AI \xB7 KNOWLEDGE RETRIEVAL",
      description: "An assistant that finds relevant information, shows its sources, and knows when to ask for help.",
      question: "How can a team find reliable answers across internal documents without losing the source of the information?",
      approach: "Retrieve relevant passages before generating an answer. Show citations and abstain when the evidence is incomplete. Require approval before any consequential action.",
      measure: "Evaluate retrieval relevance, answer faithfulness, escalation quality, latency, and cost on a representative test set."
    }];
    const MatsHomepage = ({
      defaultMode = 0,
      onModeChange,
      onContact
    } = {}) => {
      const [mode, setMode] = useState(defaultMode), [stage, setStage] = useState(0), [modal, setModal] = useState(null);
      const close = useRef(null), trigger = useRef(null);
      const rows = mode ? ai : rpa;
      const dismiss = () => {
        setModal(null);
        trigger.current?.focus();
      };
      useEffect(() => {
        if (modal === null) return;
        close.current?.focus();
        const f = (e) => {
          if (e.key === "Escape") dismiss();
        };
        document.addEventListener("keydown", f);
        return () => document.removeEventListener("keydown", f);
      }, [modal]);
      const jump = (e, id) => {
        const el = id === "mr-home" ? null : document.getElementById(id);
        if (id !== "mr-home" && !el) return;
        e.preventDefault();
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        if (el) el.scrollIntoView({ behavior, block: "start" });
        else window.scrollTo({ top: 0, behavior });
      };
      const show = (e, n) => {
        trigger.current = e.currentTarget;
        setModal(n);
      };
      return <div className="mr-app"><header className="mr-header"><a className="mr-brand" href="#mr-home" onClick={(e) => jump(e, "mr-home")}><span className="mr-logomark">[→</span>mats<span className="mr-period">.</span></a><nav aria-label="Main navigation"><a href="#mr-work" onClick={(e) => jump(e, "mr-work")}>Work</a><a href="#mr-approach" onClick={(e) => jump(e, "mr-approach")}>Approach</a><a href="#mr-about" onClick={(e) => jump(e, "mr-about")}>About</a></nav><a href="#mr-contact" className="mr-headercta" onClick={(e) => jump(e, "mr-contact")}>Let’s talk <span>↗</span></a></header><main id="mr-home"><section className="mr-hero"><div className="mr-herocopy"><div className="mr-kicker"><i /> MATS ØSTVIG / SENIOR AUTOMATION ENGINEER</div><h1>Reliable automation.<br />More room for<br /><em>meaningful work.</em></h1><p>I build RPA workflows and bounded AI agents that reduce repetitive work—from understanding the process to improving what happens next.</p><div className="mr-actions"><a className="mr-primary" href="#mr-work" onClick={(e) => jump(e, "mr-work")}>View selected work <span>↘</span></a><a className="mr-textlink" href="#mr-contact" onClick={(e) => jump(e, "mr-contact")}>Start a conversation <span>↗</span></a></div><div className="mr-heronote"><span>+</span> A practical mindset. A complete lifecycle.</div></div><LifecycleStory mode={mode} onMode={(n) => {
        setMode(n);
        setStage(0);
        onModeChange?.(n);
      }} /></section><div className="mr-values"><span>PROCESS FIRST</span><span>APIs before complexity</span><b>✳</b><span>Human oversight, built in</span><b>✳</b><span>Outcomes you can measure</span></div><section className="mr-work" id="mr-work"><div className="mr-sectionhead"><div><div className="mr-kicker">01 / SELECTED WORK</div><h2>Make the work <em>work better.</em></h2></div><p>Two ways to turn a recurring problem<br />into a dependable system.</p></div><div className="mr-workgrid">{examples.map((p, i) => <button className="mr-project" onClick={(e) => show(e, i)} key={p.title}><div className={`mr-projectart ${i ? "mr-aiart" : ""}`}><div className="mr-artlabel"><span>{i ? "EVIDENCE \u2192 ANSWER" : "INPUT \u2192 VALIDATION \u2192 ACTION"}</span><span>ILLUSTRATIVE EXAMPLE</span></div>{i ? <div className="mr-answer"><div className="mr-answerquestion"><span>Q</span> What is the approval policy?</div><div className="mr-answerbody"><span className="mr-spark">✳</span><div><strong>An answer you can trace.</strong><p>Grounded in the relevant policy.<br />Reviewed before action.</p><span className="mr-source">↗ Source 01 · Approval policy</span></div></div><div className="mr-approval"><i /> Human approval required <span>✓</span></div></div> : <div className="mr-invoiceflow"><div className="mr-invoice"><span className="mr-doc"><Icon n={2} size={27} /></span><strong>Invoice received</strong><span className="mr-invoiceline" /><span className="mr-invoiceline short" /><small>INV-1042</small></div><span className="mr-flowarrow">→</span><div className="mr-resultcards"><div><span>✓</span><strong>Validated</strong><small>Rules matched</small></div><div><span>↗</span><strong>Review queue</strong><small>Exceptions to a person</small></div></div></div>}</div><div className="mr-projectbody"><span className="mr-kicker">{p.category}</span><h3>{p.title}<span>↗</span></h3><p>{p.description}</p><span className="mr-caseaction">Explore the approach <span>→</span></span></div></button>)}</div><p className="mr-example-note">Illustrative examples of how I approach the work. They are not client engagements or measured results.</p></section><section id="mr-approach" className="mr-approach"><div className="mr-sectionhead"><div><div className="mr-kicker">02 / HOW I WORK</div><h2>A clear path.<br /><em>No black boxes.</em></h2></div><div className="mr-approachintro"><p>Eight stages. The right questions at every step.<br />Explore the method behind {mode ? "a bounded AI agent" : "a reliable automation"}.</p><span className="mr-modebadge">{mode ? "\u2733 AGENTIC AI" : "\u2318 RPA"} PERSPECTIVE</span></div></div><div className="mr-stagebuttons" aria-label="Choose a lifecycle stage">{rows.map((r, i) => <button key={i} aria-pressed={stage === i} onClick={() => setStage(i)} className={stage === i ? "active" : ""}><small>0{i + 1}</small><span>{r[0]}</span></button>)}</div><div className="mr-stagecontent"><div className="mr-stagenumber">0{stage + 1}<span>/ 08</span><Icon n={stage} size={44} /></div><div className="mr-stagetext"><span className="mr-kicker">{rows[stage][0].toUpperCase()}</span><h3>{rows[stage][1]}</h3><p>{rows[stage][2]}</p><div className="mr-stagechecks">{rows[stage].slice(3).map((s) => <span key={s}><b>✓</b>{s}</span>)}</div></div><div className="mr-stageaside"><span className="mr-kicker">THE PRINCIPLE</span><p>{mode ? "Autonomy is earned through evidence." : "The simplest reliable solution wins."}</p><div><button aria-label="Previous stage" onClick={() => setStage((stage + 7) % 8)}>←</button><button aria-label="Next stage" onClick={() => setStage((stage + 1) % 8)}>→</button></div></div></div><div className="mr-loopnote">↻ <span>Improve feeds the next Identify pass. The loop is the point.</span></div></section><section className="mr-about" id="mr-about"><div className="mr-aboutart" aria-hidden="true"><span className="mr-aboutmonogram">m<span>.</span></span><div className="mr-aboutartbottom"><span>MATS ØSTVIG</span><span>CURIOUS BY DEFAULT ↗</span></div><i className="mr-orbit one" /><i className="mr-orbit two" /><i className="mr-orbit three" /></div><div className="mr-aboutcopy"><div className="mr-kicker">03 / THE PERSON BEHIND THE PROCESS</div><h2>Engineering habits.<br /><em>A human perspective.</em></h2><p>I’m Mats. My approach starts with the people doing the work—the handoffs, the workarounds, and the details that a diagram can miss.</p><p>I care about solutions that are understandable, maintainable, and useful after the handoff. Sometimes that’s a bot. Sometimes it’s an API. Sometimes the process needs to change first.</p><div className="mr-personalnote"><span>“</span>Good automation makes room for better work.</div></div></section><section className="mr-contact" id="mr-contact"><div className="mr-kicker">START WITH THE PROBLEM</div><div><h2>What would you take<br />off your team’s plate?</h2><button className="mr-contactbutton" onClick={(e) => show(e, 2)}>Start a conversation <span>↗</span></button></div><p>A few sentences about the workflow are a good place to begin.</p></section></main><footer className="mr-footer"><a href="#mr-home" className="mr-brand" onClick={(e) => jump(e, "mr-home")}><span className="mr-logomark">[→</span>mats.</a><span>Thoughtful systems. Meaningful work.</span><a href="#mr-home" onClick={(e) => jump(e, "mr-home")}>Back to top ↑</a></footer>{modal !== null && <div className="mr-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}><section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-dialogtitle" onKeyDown={(e) => {
        if (e.key === "Tab") {
          const els = e.currentTarget.querySelectorAll("button,a[href],input,textarea");
          const first = els[0], last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}><button className="mr-close" ref={close} onClick={dismiss} aria-label="Close dialog">×</button><div className="mr-kicker">{modal === 2 ? "LET\u2019S FIND THE RIGHT STARTING POINT" : "ILLUSTRATIVE CASE STUDY"}</div><h2 id="mr-dialogtitle">{modal === 2 ? "Tell me about the work." : examples[modal].title}</h2>{modal === 2 ? <><p>A useful first conversation starts with three questions:</p><ol><li>What task is taking too much time?</li><li>Which people and systems are involved?</li><li>What would a better outcome look like?</li></ol>{onContact ? <button className="mr-primary mr-modalcta" onClick={() => {
        dismiss();
        onContact();
      }}>Open the contact form <span>→</span></button> : <div className="mr-previewnotice">Contact form not connected.</div>}</> : <>{[["The problem", examples[modal].question], ["The approach", examples[modal].approach], ["What to measure", examples[modal].measure]].map(([h, p]) => <div key={h}><h3>{h}</h3><p>{p}</p></div>)}<div className="mr-previewnotice">This example demonstrates the case-study layout. It does not claim a completed client engagement or measured result.</div></>}</section></div>}</div>;
    };
    return MatsHomepage;
  })();

  return MatsHomepage;
})();

// The "/" route: the MagicPath homepage (inlined above). It keeps
// the visitor's RPA / Agentic AI choice in the same localStorage key as before
// and sends "contact" to the existing /contact page (its form and details are
// still managed from /admin).
function HomeRoute() {
  const [mode, setMode] = useMode();
  const navigate = useNavigate();
  useEffect(() => {
    document.body.classList.add("mr-body");
    return () => document.body.classList.remove("mr-body");
  }, []);
  return (
    <>
      <style>{MR_CSS}</style>
      <MatsHomepage
        defaultMode={mode === "ai" ? 1 : 0}
        onModeChange={(n) => setMode(n ? "ai" : "rpa")}
        onContact={() => { navigate("/contact"); window.scrollTo(0, 0); }}
      />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/about" element={<AboutSection />} />
      <Route path="/contact" element={<ContactSection />} />
      <Route path="/admin" element={<AdminSection />} />
    </Routes>
  );
}
