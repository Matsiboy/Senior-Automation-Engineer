// =====================================================================================
// App.jsx — the WHOLE site, in one file: the homepage (MagicPath design) and the /admin editor.
//
//   Homepage   hero · selected work · how I work · about · contact. Every text and the
//              "Selected work" cards come from the published content (see PAGE TEXT and
//              SELECTED WORK below); built-in defaults are used until something is published.
//   /admin     passphrase gate → editor with a live preview. Edit a draft (kept in your browser),
//              then Publish (writes to Firestore, so every visitor sees it). See the README.
//
// What is NOT editable on purpose: the layout, typography, colours, the eight-stage animation
// and its illustrations, and the "illustrative example" disclosures.
//
// Upload just this file to update the site; main.jsx, index.html, vite.config.js etc. are
// one-time scaffolding.
// =====================================================================================

import React, { useEffect, useId, useRef, useState } from "react";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import { createPortal } from "react-dom";

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


// Which story the visitor last chose (RPA or Agentic AI) is remembered in this browser.
const MODE_STORAGE_KEY = "site-mode";
function useMode() {
  const [mode, setModeState] = useState(() => {
    try { const v = localStorage.getItem(MODE_STORAGE_KEY); return v === "ai" ? "ai" : "rpa"; } catch { return "rpa"; }
  });
  function setMode(code) {
    setModeState(code);
    try { localStorage.setItem(MODE_STORAGE_KEY, code); } catch {}
  }
  return [mode, setMode];
}

// =====================================================================================
// SELECTED WORK — editable project cards
//
// Three layers, kept apart on purpose:
//   1. DATA        — a card is plain JSON: { content, appearance }. `content` is what it says;
//                    `appearance` is which template it uses, two colours, the template's
//                    labels and (for the image template) a crop. No markup, no CSS.
//   2. TEMPLATES   — ArtWorkflow / ArtAnswer / ArtDashboard / ArtImage. They are given labels,
//                    colours and image settings and nothing else. Typography, spacing and
//                    responsive behaviour live in MR_CSS and cannot be changed from the data,
//                    so no setting can break the layout.
//   3. PERSISTENCE — the PUBLISHED copy is the Firestore document siteContent/work (what every
//                    visitor sees). The DRAFT lives in this browser's localStorage (only the
//                    editor sees it) until it is published. Uploaded images are stored as
//                    siteContent/workimg-<cardId> documents (one per image) because Firebase
//                    Storage needs a paid plan.
// =====================================================================================

const WORK_LIMITS = { category: 48, title: 90, description: 240, linkLabel: 32, heading: 40, body: 420, alt: 140, url: 300, maxSections: 5, maxCards: 12 };
const WORK_IMAGE_MAX_CHARS = 450000; // compressed image (as a data: URL) target; Firestore documents are limited to 1 MiB

const WORK_PALETTES = [
  { name: "Blue", accent: "#7994CA", background: "#EDF2FB" },
  { name: "Warm", accent: "#B28E61", background: "#F3EEE7" },
  { name: "Mint", accent: "#5E9C86", background: "#E8F3EE" },
  { name: "Slate", accent: "#64748B", background: "#EEF1F5" },
  { name: "Rose", accent: "#B8707F", background: "#F7ECEE" },
  { name: "Sand", accent: "#A08A5B", background: "#F6F1E4" },
];

// Each template lists the labels it exposes (with their built-in default text and a hard length
// limit) and its default colour pair. A card whose colours equal its template's pair is drawn
// with the original hand-tuned CSS colours; any other pair is derived (see workArtVars).
const WORK_TEMPLATES = {
  workflow: {
    name: "Workflow diagram", hint: "Input → validation → action",
    colors: { accent: "#7994CA", background: "#EDF2FB" },
    labels: [
      { key: "flow", name: "Top label", def: "INPUT → VALIDATION → ACTION", max: 44 },
      { key: "inputTitle", name: "Input title", def: "Invoice received", max: 28 },
      { key: "inputCode", name: "Input reference", def: "INV-1042", max: 16 },
      { key: "okTitle", name: "Result 1 title", def: "Validated", max: 22 },
      { key: "okNote", name: "Result 1 note", def: "Rules matched", max: 30 },
      { key: "exTitle", name: "Result 2 title", def: "Review queue", max: 22 },
      { key: "exNote", name: "Result 2 note", def: "Exceptions to a person", max: 32 },
    ],
  },
  answer: {
    name: "AI answer panel", hint: "Question, traceable answer, source",
    colors: { accent: "#B28E61", background: "#F3EEE7" },
    labels: [
      { key: "flow", name: "Top label", def: "EVIDENCE → ANSWER", max: 44 },
      { key: "question", name: "Question", def: "What is the approval policy?", max: 56 },
      { key: "answerTitle", name: "Answer headline", def: "An answer you can trace.", max: 40 },
      { key: "answerText", name: "Answer text (2 lines)", def: "Grounded in the relevant policy.\nReviewed before action.", max: 120, multiline: true },
      { key: "source", name: "Source", def: "Source 01 · Approval policy", max: 44 },
      { key: "footer", name: "Footer note (empty hides it)", def: "Human approval required", max: 40 },
    ],
  },
  dashboard: {
    name: "Dashboard", hint: "Three metrics and a trend line",
    colors: { accent: "#7994CA", background: "#EDF2FB" },
    labels: [
      { key: "flow", name: "Top label", def: "RUNS → CHECKS → INSIGHT", max: 44 },
      { key: "m1Label", name: "Metric 1 label", def: "Runs", max: 14 },
      { key: "m1Value", name: "Metric 1 value", def: "24", max: 8 },
      { key: "m2Label", name: "Metric 2 label", def: "Passed", max: 14 },
      { key: "m2Value", name: "Metric 2 value", def: "23", max: 8 },
      { key: "m3Label", name: "Metric 3 label", def: "Errors", max: 14 },
      { key: "m3Value", name: "Metric 3 value", def: "1", max: 8 },
      { key: "footnote", name: "Footnote", def: "EXAMPLE DATA", max: 24 },
    ],
  },
  image: {
    name: "Uploaded image", hint: "Your own picture, cropped to the card",
    colors: { accent: "#7994CA", background: "#EDF2FB" },
    labels: [{ key: "flow", name: "Top label (optional)", def: "", max: 44 }],
  },
};
const WORK_TEMPLATE_ORDER = ["workflow", "answer", "dashboard", "image"];

const emptyWorkImage = () => ({ kind: "none", url: "", ref: "", hash: "", alt: "", zoom: 1, x: 50, y: 50 });

// The two cards the site launched with. Used until something is published, and by "Reset".
function defaultWorkCards() {
  return [
    {
      id: "invoice-to-record", visible: true,
      content: {
        category: "RPA · SYSTEM INTEGRATION",
        title: "From invoice to verified record.",
        description: "A workflow that connects legacy systems, validates the details, and hands exceptions to a person.",
        linkLabel: "Explore the approach", illustrative: true,
        sections: [
          { heading: "The problem", body: "How can invoice data move between disconnected systems without adding another manual queue?" },
          { heading: "The approach", body: "Validate required fields, match the purchase order, and update the destination system. Keep mismatches in a review queue with the relevant context." },
          { heading: "What to measure", body: "Compare handling time and error rates with the manual baseline. Report exceptions separately from successful automated runs." },
        ],
        link: { label: "", url: "" },
      },
      appearance: { template: "workflow", accent: "#7994CA", background: "#EDF2FB", labels: {}, image: emptyWorkImage() },
    },
    {
      id: "useful-answers", visible: true,
      content: {
        category: "AGENTIC AI · KNOWLEDGE RETRIEVAL",
        title: "Useful answers. Visible evidence.",
        description: "An assistant that finds relevant information, shows its sources, and knows when to ask for help.",
        linkLabel: "Explore the approach", illustrative: true,
        sections: [
          { heading: "The problem", body: "How can a team find reliable answers across internal documents without losing the source of the information?" },
          { heading: "The approach", body: "Retrieve relevant passages before generating an answer. Show citations and abstain when the evidence is incomplete. Require approval before any consequential action." },
          { heading: "What to measure", body: "Evaluate retrieval relevance, answer faithfulness, escalation quality, latency, and cost on a representative test set." },
        ],
        link: { label: "", url: "" },
      },
      appearance: { template: "answer", accent: "#B28E61", background: "#F3EEE7", labels: {}, image: emptyWorkImage() },
    },
  ];
}

function newWorkCard(template) {
  const t = WORK_TEMPLATES[template];
  return {
    id: "card-" + Math.random().toString(36).slice(2, 8), visible: false,
    content: {
      category: "CATEGORY · TOPIC", title: "New project", description: "", linkLabel: "Explore the approach", illustrative: true,
      sections: [{ heading: "The problem", body: "" }, { heading: "The approach", body: "" }, { heading: "What to measure", body: "" }],
      link: { label: "", url: "" },
    },
    appearance: { template, accent: t.colors.accent, background: t.colors.background, labels: {}, image: emptyWorkImage() },
  };
}

// ---- colour helpers ---------------------------------------------------------------
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] * t + B[0] * (1 - t), A[1] * t + B[1] * (1 - t), A[2] * t + B[2] * (1 - t)); };
const hexLum = (h) => { const c = hexRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrastRatio = (a, b) => { const [hi, lo] = [hexLum(a), hexLum(b)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
const sameHex = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// The colour tokens a template's CSS reads. Returns undefined for a template's own default pair,
// so default cards keep the original hand-tuned colours (the CSS fallbacks) exactly.
function workArtVars(ap) {
  const tpl = WORK_TEMPLATES[ap.template];
  if (sameHex(ap.accent, tpl.colors.accent) && sameHex(ap.background, tpl.colors.background)) return undefined;
  const a = ap.accent, bg = ap.background;
  return {
    "--art-bg": bg, "--art-edge": mixHex(a, bg, 0.14), "--art-surface": mixHex("#FFFFFF", bg, 0.72), "--art-line": mixHex(a, bg, 0.26),
    "--art-soft": mixHex(a, bg, 0.13), "--art-label": mixHex(a, "#172033", 0.78), "--art-ink": mixHex(a, "#172033", 0.5),
    "--art-mute": mixHex(a, bg, 0.7), "--art-accent": a,
  };
}
// Readability of a card's colours (only meaningful for custom pairs; the defaults are the original design).
function workContrastWarnings(ap) {
  const v = workArtVars(ap);
  if (!v) return [];
  const out = [];
  if (contrastRatio(v["--art-ink"], v["--art-surface"]) < 4.5) out.push("Text on the panels will be hard to read — pick a darker accent or a lighter background.");
  if (contrastRatio(v["--art-label"], v["--art-bg"]) < 2.8) out.push("The small top label will be hard to read against this background.");
  if (contrastRatio(v["--art-accent"], v["--art-bg"]) < 1.8) out.push("Icons and lines will be barely visible — the accent is too close to the background.");
  return out;
}

// ---- normalisation: any stored value -> a safe, well-formed card ----------------------
const clipStr = (v, n) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, n);
const clampNum = (v, lo, hi, fb) => { const n = v == null || v === "" ? NaN : Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fb; };
const isHex6 = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const safeHttpUrl = (u) => { const t = String(u || "").trim().slice(0, WORK_LIMITS.url); return /^https?:\/\/[^\s]+$/i.test(t) ? t : ""; };
const safeImageUrl = (u) => {
  const t = String(u || "").trim().slice(0, WORK_LIMITS.url);
  if (/^https?:\/\/[^\s]+$/i.test(t)) return t;
  return /^(\.\/|\/)?[\w\-./%]+\.(png|jpe?g|webp|gif|svg|avif)$/i.test(t) && !t.includes("..") ? t : "";
};
const workAssetUrl = (u) => (/^https?:/i.test(u) ? u : `${import.meta.env.BASE_URL}${u.replace(/^\.?\//, "")}`);

function normalizeWorkImage(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const kind = r.kind === "upload" || r.kind === "url" ? r.kind : "none";
  return {
    kind, url: kind === "url" ? safeImageUrl(r.url) : "", ref: kind === "upload" ? clipStr(r.ref, 80) : "", hash: kind === "upload" ? clipStr(r.hash, 24) : "",
    alt: clipStr(r.alt, WORK_LIMITS.alt), zoom: clampNum(r.zoom, 1, 3, 1), x: clampNum(r.x, 0, 100, 50), y: clampNum(r.y, 0, 100, 50),
  };
}

function normalizeWorkCard(raw, i, opts) {
  const keepEmpty = !!(opts && opts.keepEmpty);
  const r = raw && typeof raw === "object" ? raw : {};
  const c = r.content && typeof r.content === "object" ? r.content : {};
  const a = r.appearance && typeof r.appearance === "object" ? r.appearance : {};
  const template = WORK_TEMPLATES[a.template] ? a.template : "workflow";
  const tpl = WORK_TEMPLATES[template];
  const id = typeof r.id === "string" && /^[a-z0-9][a-z0-9-]{0,40}$/i.test(r.id) ? r.id : "card-" + (i + 1);
  let sections = (Array.isArray(c.sections) ? c.sections : []).slice(0, WORK_LIMITS.maxSections)
    .map((s) => ({ heading: clipStr(s && s.heading, WORK_LIMITS.heading), body: clipStr(s && s.body, WORK_LIMITS.body) }));
  if (!keepEmpty) sections = sections.filter((s) => s.heading.trim() || s.body.trim());
  const labels = {};
  const allLabels = a.labels && typeof a.labels === "object" ? a.labels : {};
  for (const t of WORK_TEMPLATE_ORDER) {
    const ov = allLabels[t] && typeof allLabels[t] === "object" ? allLabels[t] : {};
    const kept = {};
    for (const f of WORK_TEMPLATES[t].labels) if (typeof ov[f.key] === "string" && clipStr(ov[f.key], f.max) !== f.def) kept[f.key] = clipStr(ov[f.key], f.max);
    if (Object.keys(kept).length) labels[t] = kept;
  }
  return {
    id, visible: r.visible !== false,
    content: {
      category: clipStr(c.category, WORK_LIMITS.category), title: clipStr(c.title, WORK_LIMITS.title), description: clipStr(c.description, WORK_LIMITS.description),
      linkLabel: clipStr(c.linkLabel, WORK_LIMITS.linkLabel), illustrative: c.illustrative !== false, sections,
      link: { label: clipStr(c.link && c.link.label, WORK_LIMITS.linkLabel), url: safeHttpUrl(c.link && c.link.url) },
    },
    appearance: {
      template, accent: isHex6(a.accent) ? a.accent.toUpperCase() : tpl.colors.accent, background: isHex6(a.background) ? a.background.toUpperCase() : tpl.colors.background,
      labels, image: template === "image" ? normalizeWorkImage(a.image) : emptyWorkImage(),
    },
  };
}
const normalizeWorkCards = (list, opts) => (Array.isArray(list) ? list.slice(0, WORK_LIMITS.maxCards).map((c, i) => normalizeWorkCard(c, i, opts)) : []);
const workKey = (cards) => JSON.stringify(normalizeWorkCards(cards));

function workLabels(card) {
  const t = card.appearance.template, ov = card.appearance.labels[t] || {}, out = {};
  for (const f of WORK_TEMPLATES[t].labels) out[f.key] = typeof ov[f.key] === "string" ? ov[f.key] : f.def;
  return out;
}

// What stops a card from being published (errors) and what is worth a second look (warnings).
function validateWorkCard(card) {
  const errors = [], warnings = [], c = card.content, ap = card.appearance;
  if (!c.title.trim()) errors.push("Title is required.");
  if (ap.template === "image" && card.visible) {
    if (ap.image.kind === "none") errors.push("Choose an image, or switch to another template.");
    if (ap.image.kind === "url" && !ap.image.url) errors.push("The image address isn't valid — use https://… or a file in the site's public folder.");
  }
  if (c.link.url && !c.link.label.trim()) errors.push("Give the external link a label, or clear its address.");
  if (ap.template === "image" && ap.image.kind !== "none" && !ap.image.alt.trim()) warnings.push("No image description — the title is used as the alt text.");
  if (!c.description.trim()) warnings.push("No description.");
  if (!c.illustrative) warnings.push("Illustrative labels are off: this card will be presented as real work.");
  workContrastWarnings(ap).forEach((w) => warnings.push(w));
  return { errors, warnings };
}

// ---- persistence ---------------------------------------------------------------------
const WORK_DRAFT_KEY = "site-work-draft-v1";
const WORK_CACHE_KEY = "site-work-published-v1";
const readJsonLS = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const writeJsonLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const removeLS = (k) => { try { localStorage.removeItem(k); } catch {} };
const workTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg || "timeout")), ms))]);

async function workFirestore() {
  const { initializeApp, getApps } = await import("firebase/app");
  const fs = await import("firebase/firestore");
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return { db: fs.getFirestore(app), fs, app };
}

// The only code that talks to Firebase for the work cards. Everything else goes through
// getWorkStore(), so the editor and the homepage don't care where the data lives.
const firebaseWorkStore = {
  // Live published document (or null when nothing has been published yet).
  subscribe(onDoc, onError) {
    let off = () => {}, dead = false;
    if (!FIREBASE_ENABLED) { setTimeout(() => !dead && onDoc(null), 0); return () => { dead = true; }; }
    (async () => {
      try {
        const { db, fs } = await workFirestore();
        if (dead) return;
        off = fs.onSnapshot(fs.doc(db, "siteContent", "work"), (snap) => onDoc(snap.exists() ? snap.data() : null), (err) => onError(err));
      } catch (e) { onError(e); }
    })();
    return () => { dead = true; off(); };
  },
  async loadImage(ref) {
    if (!FIREBASE_ENABLED) return null;
    const { db, fs } = await workFirestore();
    const snap = await workTimeout(fs.getDoc(fs.doc(db, "siteContent", ref)), 15000);
    return snap.exists() ? snap.data() : null;
  },
  // Images first, then the card list, so the published list never points at a missing image.
  async publish({ cards, page, images, removeRefs }) {
    if (!FIREBASE_ENABLED) throw Object.assign(new Error("Firebase is turned off in App.jsx (FIREBASE_ENABLED)."), { code: "firebase-disabled" });
    const { db, fs } = await workFirestore();
    const now = Date.now();
    for (const [ref, v] of Object.entries(images)) await workTimeout(fs.setDoc(fs.doc(db, "siteContent", ref), { data: v.data, hash: v.hash, updatedAt: now }), 25000);
    await workTimeout(fs.setDoc(fs.doc(db, "siteContent", "work"), { version: 1, updatedAt: now, cards, page }), 25000);
    for (const ref of removeRefs) { try { await workTimeout(fs.deleteDoc(fs.doc(db, "siteContent", ref)), 8000); } catch {} }
    return { updatedAt: now };
  },
  auth: {
    watch(cb) {
      let off = () => {}, dead = false;
      (async () => {
        try {
          const { app } = await workFirestore();
          const { getAuth, onAuthStateChanged } = await import("firebase/auth");
          if (dead) return;
          off = onAuthStateChanged(getAuth(app), (u) => cb(u ? { email: u.email || "signed in" } : null));
        } catch { cb(null); }
      })();
      return () => { dead = true; off(); };
    },
    async signIn(email, password) {
      const { app } = await workFirestore();
      const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(getAuth(app), email, password);
    },
    async signOut() {
      const { app } = await workFirestore();
      const { getAuth, signOut } = await import("firebase/auth");
      await signOut(getAuth(app));
    },
  },
};
// Test builds (vite --mode test) can swap the store for an in-memory fake. In production builds
// import.meta.env.MODE is "production", so this branch is removed entirely.
function getWorkStore() {
  if (import.meta.env.MODE === "test" && typeof window !== "undefined" && window.__MR_STORE__) return window.__MR_STORE__;
  return firebaseWorkStore;
}

// Test builds only: expose the pure helpers so they can be unit-tested in a browser.
if (import.meta.env.MODE === "test" && typeof window !== "undefined") {
  window.__MR_TEST__ = { normalizePage, pageKey, validatePage, defaultPage, safeContactUrl, normalizeWorkCards, workKey, workArtVars, workContrastWarnings, validateWorkCard, defaultWorkCards, safeHttpUrl, safeImageUrl, contrastRatio, mixHex, workLabels, WORK_TEMPLATES };
}

// Public homepage: the published cards. Never shows the editor's draft.
function usePublishedWork() {
  const [state, setState] = useState(() => {
    const cache = readJsonLS(WORK_CACHE_KEY);
    return cache && Array.isArray(cache.cards) ? { status: "ready", cards: normalizeWorkCards(cache.cards), page: normalizePage(cache.page) } : { status: "loading", cards: [], page: normalizePage(null) };
  });
  useEffect(() => {
    const store = getWorkStore();
    const builtIn = () => ({ status: "ready", cards: normalizeWorkCards(defaultWorkCards()), page: normalizePage(null) });
    const fallback = () => setState((p) => (p.status === "ready" ? p : builtIn()));
    const unsub = store.subscribe(
      (doc) => {
        if (doc && Array.isArray(doc.cards)) {
          const cards = normalizeWorkCards(doc.cards), page = normalizePage(doc.page);
          writeJsonLS(WORK_CACHE_KEY, { updatedAt: doc.updatedAt || 0, cards, page });
          setState({ status: "ready", cards, page });
        } else {
          removeLS(WORK_CACHE_KEY);
          setState(builtIn());
        }
      },
      (err) => { console.warn("Homepage: could not read the published content, using the cached or built-in version.", err); fallback(); }
    );
    const t = setTimeout(fallback, 3000);
    return () => { clearTimeout(t); unsub(); };
  }, []);
  return state;
}

const workImageCache = new Map();
// Resolves a card's image to something an <img> can show. `localImages` holds the editor's
// not-yet-published uploads (cardId -> data URL); visitors never have it.
function useWorkImageSrc(card, localImages) {
  const im = card.appearance.image, enabled = card.appearance.template === "image";
  const local = enabled && im.kind === "upload" && localImages && localImages[card.id];
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    let alive = true;
    setRemote(null);
    if (!enabled || im.kind !== "upload" || local || !im.ref) return;
    const key = im.ref + ":" + im.hash;
    if (workImageCache.has(key)) { setRemote(workImageCache.get(key)); return; }
    getWorkStore().loadImage(im.ref).then((d) => { if (d && d.data) { workImageCache.set(key, d.data); if (alive) setRemote(d.data); } }).catch(() => {});
    return () => { alive = false; };
  }, [enabled, im.kind, im.ref, im.hash, !!local]);
  if (!enabled) return null;
  if (im.kind === "url") return im.url ? workAssetUrl(im.url) : null;
  if (im.kind === "upload") return local || remote;
  return null;
}

// ---- rendering: templates (labels/colours/image in, markup out) -----------------------
const textLines = (t) => String(t).split("\n").map((l, i, a) => <React.Fragment key={i}>{l}{i < a.length - 1 && <br />}</React.Fragment>);

function WorkDocIcon({ size = 27 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="7" height="6" rx="1" /><rect x="15" y="16" width="7" height="6" rx="1" /><path d="M5 8v11h10M9 5h10v11" />
    </svg>
  );
}

function ArtWorkflow({ L }) {
  return (
    <div className="mr-invoiceflow">
      <div className="mr-invoice">
        <span className="mr-doc"><WorkDocIcon size={27} /></span>
        <strong>{L.inputTitle}</strong><span className="mr-invoiceline" /><span className="mr-invoiceline short" /><small>{L.inputCode}</small>
      </div>
      <span className="mr-flowarrow">→</span>
      <div className="mr-resultcards">
        <div><span>✓</span><strong>{L.okTitle}</strong><small>{L.okNote}</small></div>
        <div><span>↗</span><strong>{L.exTitle}</strong><small>{L.exNote}</small></div>
      </div>
    </div>
  );
}

function ArtAnswer({ L }) {
  return (
    <div className="mr-answer">
      <div className="mr-answerquestion"><span>Q</span> {L.question}</div>
      <div className="mr-answerbody">
        <span className="mr-spark">✳</span>
        <div><strong>{L.answerTitle}</strong><p>{textLines(L.answerText)}</p><span className="mr-source">↗ {L.source}</span></div>
      </div>
      {L.footer ? <div className="mr-approval"><i /> {L.footer} <span>✓</span></div> : null}
    </div>
  );
}

function ArtDashboard({ L }) {
  const tiles = [[L.m1Label, L.m1Value], [L.m2Label, L.m2Value], [L.m3Label, L.m3Value]];
  return (
    <div className="mr-dash">
      <svg viewBox="0 0 238 84" role="img" aria-label="A dashboard with three metrics and a trend line">
        <rect className="dsh-panel" x="1" y="1" width="236" height="82" rx="6" />
        {tiles.map(([label, value], i) => (
          <g key={i}>
            <rect className="dsh-tile" x={9 + i * 74} y="8" width="68" height="28" rx="3" />
            <text className="dsh-label" x={15 + i * 74} y="19" fontSize="6">{label}</text>
            <text className="dsh-value" x={15 + i * 74} y="31" fontSize="11" fontWeight="500">{value}</text>
          </g>
        ))}
        <path className="dsh-grid" d="M12 50H226M12 63H226M12 74H226" />
        <path className="dsh-line" d="M12 70 34 66 56 68 78 55 100 60 122 46 144 53 166 43 188 47 226 40" fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {L.footnote ? <text className="dsh-note" x="226" y="79" textAnchor="end" fontSize="5">{L.footnote}</text> : null}
      </svg>
    </div>
  );
}

function ArtImage({ src, image, title }) {
  return (
    <div className="mr-artimg">
      {src ? <img src={src} alt={image.alt || title} style={{ objectPosition: `${image.x}% ${image.y}%`, transform: `scale(${image.zoom})`, transformOrigin: `${image.x}% ${image.y}%` }} /> : <span className="mr-artimg-empty">No image yet</span>}
    </div>
  );
}

function WorkArt({ card, localImages }) {
  const ap = card.appearance, L = workLabels(card), src = useWorkImageSrc(card, localImages);
  const cls = ["mr-projectart", ap.template === "answer" ? "mr-aiart" : "", ap.template === "image" ? "mr-art-image" : "", ap.template === "dashboard" ? "mr-art-dash" : ""].filter(Boolean).join(" ");
  return (
    <div className={cls} style={workArtVars(ap)} data-template={ap.template}>
      {ap.template === "image" && <ArtImage src={src} image={ap.image} title={card.content.title} />}
      <div className="mr-artlabel"><span>{L.flow}</span><span>{card.content.illustrative ? "ILLUSTRATIVE EXAMPLE" : ""}</span></div>
      {ap.template === "workflow" && <ArtWorkflow L={L} />}
      {ap.template === "answer" && <ArtAnswer L={L} />}
      {ap.template === "dashboard" && <ArtDashboard L={L} />}
    </div>
  );
}

// ---- rendering: the card, the section, the dialog ------------------------------------
function WorkCardView({ card, localImages, onOpen, selected }) {
  const c = card.content;
  return (
    <button type="button" className={`mr-project${selected ? " is-selected" : ""}`} onClick={onOpen} data-card-id={card.id}>
      <WorkArt card={card} localImages={localImages} />
      <div className="mr-projectbody">
        <span className="mr-kicker">{c.category}</span>
        <h3>{c.title}<span>↗</span></h3>
        <p>{c.description}</p>
        <span className="mr-caseaction">{c.linkLabel || "Explore the approach"} <span>→</span></span>
      </div>
    </button>
  );
}

function WorkSkeleton() {
  return (
    <div className="mr-project mr-skeleton" aria-hidden="true">
      <div className="mr-projectart" />
      <div className="mr-projectbody"><div className="mr-skelline w60" /><div className="mr-skelline" /><div className="mr-skelline w90" /></div>
    </div>
  );
}

function WorkSection({ cards, loading, localImages, onOpen, selectedId, copy }) {
  const n = cards.length, anyIllustrative = cards.some((c) => c.content.illustrative), head = copy || normalizePage(null).work;
  return (
    <section className="mr-work" id="mr-work">
      <div className="mr-sectionhead">
        <div><div className="mr-kicker">01 / SELECTED WORK</div><h2>{head.headingA} <em>{head.headingAccent}</em></h2></div>
        {head.intro ? <p>{head.intro}</p> : n === 2 ? <p>Two ways to turn a recurring problem<br />into a dependable system.</p> : <p>Turning recurring problems<br />into dependable systems.</p>}
      </div>
      <div className={`mr-workgrid${n === 1 ? " single" : ""}`}>
        {loading ? <><WorkSkeleton /><WorkSkeleton /></> : cards.map((card) => <WorkCardView key={card.id} card={card} localImages={localImages} selected={selectedId === card.id} onOpen={(e) => onOpen(e, card)} />)}
      </div>
      {!loading && anyIllustrative && <p className="mr-example-note">Illustrative examples of how I approach the work. They are not client engagements or measured results.</p>}
    </section>
  );
}

// Overlay + dialog + focus handling, shared by the homepage and the editor's preview.
function ModalShell({ kicker, title, onDismiss, closeRef, children }) {
  const root = useRef(null), dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const doc = root.current ? root.current.ownerDocument : document;
    if (closeRef.current) closeRef.current.focus();
    const f = (e) => { if (e.key === "Escape") dismissRef.current(); };
    doc.addEventListener("keydown", f);
    return () => doc.removeEventListener("keydown", f);
  }, []);
  return (
    <div className="mr-overlay" ref={root} onClick={(e) => { if (e.target === e.currentTarget) dismissRef.current(); }}>
      <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-dialogtitle" onKeyDown={(e) => {
        if (e.key === "Tab") {
          const els = e.currentTarget.querySelectorAll("button,a[href],input,textarea");
          const first = els[0], last = els[els.length - 1], active = e.currentTarget.ownerDocument.activeElement;
          if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        }
      }}>
        <button className="mr-close" ref={closeRef} onClick={() => dismissRef.current()} aria-label="Close dialog">×</button>
        <div className="mr-kicker">{kicker}</div>
        <h2 id="mr-dialogtitle">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function CaseStudyBody({ card }) {
  const c = card.content;
  return (
    <>
      {c.sections.length ? c.sections.map((s, i) => <div key={i}><h3>{s.heading}</h3><p>{s.body}</p></div>) : <p>{c.description}</p>}
      {c.link.url && <a className="mr-primary mr-modalcta mr-modallink" href={c.link.url} target="_blank" rel="noopener noreferrer">{c.link.label} <span>↗</span></a>}
      {c.illustrative && <div className="mr-previewnotice">This example demonstrates the case-study layout. It does not claim a completed client engagement or measured result.</div>}
    </>
  );
}

// =====================================================================================
// PAGE TEXT — everything on the homepage that isn't a "Selected work" card:
// the hero, the values strip, section headings, "How I work", "The person behind the
// process", the contact call-to-action and the footer.
//
// Same idea as the cards: plain data in, the design's components out. Layout, type, the
// eight-stage animation and its illustrations stay fixed by the design. The text is saved
// in the same published document as the cards (siteContent/work → `page`), so one Publish
// covers the whole page.
// =====================================================================================
const LEGACY_HERO_LEDE = "I build RPA workflows and bounded AI agents that reduce repetitive work—from understanding the process to improving what happens next."; // the previous default; treated as "not edited"
const PAGE_LIMITS = {
  eyebrow: 60, focusLabel: 40, headline: 40, lede: 300, label: 32, note: 80, valuesLabel: 24, value: 40, heading: 50, intro: 160, loop: 120,
  stageTitle: 60, stageText: 280, check: 40, principle: 80, behind: 40, paragraph: 360, maxParagraphs: 4, quote: 120, caption: 30,
  sub: 160, dialogKicker: 50, dialogTitle: 60, dialogIntro: 120, question: 90, maxQuestions: 5, tagline: 80, url: 300,
};
const STAGE_NAMES = {
  rpa: ["Identify", "Assess", "Design", "Develop", "Test", "Deploy", "Monitor", "Improve"],
  ai: ["Identify", "Scope", "Design", "Build", "Evaluate", "Deploy", "Observe", "Improve"],
};
const APPROACH_DEFAULTS = {
  rpa: [{"title": "Start with the work. Not the tool.", "text": "Shadow the people doing the work. Look for repetition, stable rules, and a problem worth solving.", "checks": ["Observe the workflow", "Measure frequency and effort", "Keep judgment-heavy decisions human"]}, {"title": "Make the case before the build.", "text": "Compare expected time saved with complexity, risk, and system stability. Agree on the outcome with the process owner.", "checks": ["Establish a baseline", "Rank candidates by return", "Agree on ownership"]}, {"title": "Map the edges as well as the path.", "text": "Map actors, handoffs, and exceptions in BPMN swimlanes. Validate the process with the people who know it.", "checks": ["Map every handoff", "Design exception paths", "Review with the team"]}, {"title": "Choose the simplest reliable tool.", "text": "Use APIs first, scripts for data movement, and RPA where systems have no programmatic access.", "checks": ["Build clear interfaces", "Validate every input", "Route uncertainty to a person"]}, {"title": "Make failure part of the test.", "text": "Compare automated and manual results on historical cases. Deliberately test bad data, missing fields, and timeouts.", "checks": ["Run in parallel", "Compare actual outputs", "Test recovery paths"]}, {"title": "Ship with a way back.", "text": "Start in shadow mode, release to a subset, then expand. Include a rollback plan, documentation, and a named owner.", "checks": ["Roll out in stages", "Prepare rollback", "Hand over the runbook"]}, {"title": "Make every run visible.", "text": "Track runs, exceptions, and time saved. Alert a person when a workflow fails, and review performance regularly.", "checks": ["Track operational health", "Make alerts actionable", "Review outcomes monthly"]}, {"title": "Measure what changed. Then repeat.", "text": "Compare 30- and 90-day results with the baseline. Feed real observations into the next discovery cycle.", "checks": ["Compare baseline to actual", "Refine the workflow", "Identify the next opportunity"]}],
  ai: [{"title": "Find a useful job for an agent.", "text": "Look for language-heavy work or unstructured information. Keep the task bounded and the desired outcome clear.", "checks": ["Understand the decision", "Check available evidence", "Define human ownership"]}, {"title": "Give autonomy a clear boundary.", "text": "Weigh value against the cost of an error. Define what the agent may read, propose, and execute.", "checks": ["Define permissions", "Set approval boundaries", "Agree on success criteria"]}, {"title": "Design the system around the model.", "text": "Specify context, retrieval, tools, and recovery paths. Make every consequential action traceable.", "checks": ["Use least-privilege tools", "Design escalation", "Plan for missing evidence"]}, {"title": "Start small. Add complexity with evidence.", "text": "Begin with a prompt and retrieval. Add tools or loops only when evaluation shows they improve the outcome.", "checks": ["Validate structured outputs", "Bound tool execution", "Record the action trail"]}, {"title": "An evaluation set, not just a demo.", "text": "Test representative tasks, unsafe retrieved instructions, and tool failures. Check groundedness, quality, latency, and cost.", "checks": ["Use real task examples", "Test failure and misuse", "Review with domain experts"]}, {"title": "Earn autonomy through evidence.", "text": "Begin in shadow mode, then require approval, then allow limited actions. Keep a stop mechanism and accountable owner.", "checks": ["Shadow before acting", "Approve consequential actions", "Keep rollback ready"]}, {"title": "Look beyond whether it ran.", "text": "Review outcomes, traces, tool errors, and cost. Escalate low-quality or out-of-policy results to a person.", "checks": ["Inspect task quality", "Watch cost and latency", "Review interventions"]}, {"title": "Turn feedback into better evaluations.", "text": "Add real failures to regression tests. Re-evaluate changes to prompts, retrieval, tools, and permissions.", "checks": ["Capture corrections", "Re-test every change", "Revisit the next useful task"]}],
};

function defaultPage() {
  const stages = (list) => list.map((s) => ({ title: s.title, text: s.text, checks: s.checks.slice() }));
  return {
    hero: {
      eyebrow: "MATS ØSTVIG / SENIOR AUTOMATION ENGINEER",
      line1: "Reliable automation.", line2: "More room for", accent: "meaningful work.",
      focusLabel: "EXPLORE MY APPROACH", line1Ai: "Purposeful AI.",
      lede: "I build reliable RPA workflows that take repetitive work off your team’s plate—from understanding the process to improving what happens next.",
      ledeAi: "I build bounded AI agents that turn unstructured information into useful actions—with clear context, reliable tools, and outcomes you can evaluate.",
      primaryLabel: "View selected work", secondaryLabel: "Start a conversation", note: "A practical mindset. A complete lifecycle.",
      valuesLabel: "PROCESS FIRST", values: ["APIs before complexity", "Human oversight, built in", "Outcomes you can measure"],
    },
    work: { headingA: "Make the work", headingAccent: "work better.", intro: "" },
    approach: {
      headingA: "A clear path.", headingAccent: "No black boxes.", intro: "Eight stages. The right questions at every step.",
      loopNote: "Improve feeds the next Identify pass. The loop is the point.",
      rpa: { behind: "a reliable automation", principle: "The simplest reliable solution wins.", stages: stages(APPROACH_DEFAULTS.rpa) },
      ai: { behind: "a bounded AI agent", principle: "Autonomy is earned through evidence.", stages: stages(APPROACH_DEFAULTS.ai) },
    },
    about: {
      headingA: "Engineering habits.", headingAccent: "A human perspective.",
      paragraphs: [
        "I’m Mats. My approach starts with the people doing the work—the handoffs, the workarounds, and the details that a diagram can miss.",
        "I care about solutions that are understandable, maintainable, and useful after the handoff. Sometimes that’s a bot. Sometimes it’s an API. Sometimes the process needs to change first.",
      ],
      quote: "Good automation makes room for better work.", captionLeft: "MATS ØSTVIG", captionRight: "CURIOUS BY DEFAULT ↗",
    },
    contact: {
      headingA: "What would you take", headingB: "off your team’s plate?", sub: "A few sentences about the workflow are a good place to begin.", button: "Start a conversation",
      dialogKicker: "LET’S FIND THE RIGHT STARTING POINT", dialogTitle: "Tell me about the work.", dialogIntro: "A useful first conversation starts with three questions:",
      questions: ["What task is taking too much time?", "Which people and systems are involved?", "What would a better outcome look like?"],
      linkLabel: "Get in touch", linkUrl: "",
    },
    footer: { tagline: "Thoughtful systems. Meaningful work." },
  };
}

const pageStr = (v, fb, max) => (typeof v === "string" ? v.slice(0, max) : fb);
const pageObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
// A contact link is an email address (turned into mailto:) or an https:// address. Anything else is dropped.
function safeContactUrl(v) {
  const t = String(v || "").trim().slice(0, PAGE_LIMITS.url);
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(t)) return t;
  if (/^[^\s@:/]+@[^\s@]+\.[^\s@]+$/.test(t)) return "mailto:" + t;
  return /^https?:\/\/[^\s]+$/i.test(t) ? t : "";
}

// Any stored value -> a complete, safe page-text object (missing or malformed fields fall back to the defaults).
function normalizePage(raw) {
  const d = defaultPage(), r = pageObj(raw), L = PAGE_LIMITS;
  const h = pageObj(r.hero), w = pageObj(r.work), ap = pageObj(r.approach), ab = pageObj(r.about), c = pageObj(r.contact), f = pageObj(r.footer);
  const byIndex = (src, def, max) => def.map((dv, i) => pageStr(Array.isArray(src) ? src[i] : undefined, dv, max));
  const list = (src, def, max, cap) => (Array.isArray(src) ? src.slice(0, cap).map((x) => pageStr(x, "", max)).filter((t) => t.trim()) : def.slice());
  const modeBlock = (src, def) => {
    const m = pageObj(src), st = Array.isArray(m.stages) ? m.stages : [];
    return {
      behind: pageStr(m.behind, def.behind, L.behind), principle: pageStr(m.principle, def.principle, L.principle),
      stages: def.stages.map((ds, i) => { const s = pageObj(st[i]); return { title: pageStr(s.title, ds.title, L.stageTitle), text: pageStr(s.text, ds.text, L.stageText), checks: byIndex(s.checks, ds.checks, L.check) }; }),
    };
  };
  return {
    hero: {
      eyebrow: pageStr(h.eyebrow, d.hero.eyebrow, L.eyebrow), line1: pageStr(h.line1, d.hero.line1, L.headline), line2: pageStr(h.line2, d.hero.line2, L.headline), accent: pageStr(h.accent, d.hero.accent, L.headline),
      lede: h.lede === LEGACY_HERO_LEDE ? d.hero.lede : pageStr(h.lede, d.hero.lede, L.lede), ledeAi: pageStr(h.ledeAi, d.hero.ledeAi, L.lede), line1Ai: pageStr(h.line1Ai, d.hero.line1Ai, L.headline), focusLabel: pageStr(h.focusLabel, d.hero.focusLabel, L.focusLabel), primaryLabel: pageStr(h.primaryLabel, d.hero.primaryLabel, L.label), secondaryLabel: pageStr(h.secondaryLabel, d.hero.secondaryLabel, L.label),
      note: pageStr(h.note, d.hero.note, L.note), valuesLabel: pageStr(h.valuesLabel, d.hero.valuesLabel, L.valuesLabel), values: byIndex(h.values, d.hero.values, L.value),
    },
    work: { headingA: pageStr(w.headingA, d.work.headingA, L.heading), headingAccent: pageStr(w.headingAccent, d.work.headingAccent, L.heading), intro: pageStr(w.intro, d.work.intro, L.intro) },
    approach: {
      headingA: pageStr(ap.headingA, d.approach.headingA, L.heading), headingAccent: pageStr(ap.headingAccent, d.approach.headingAccent, L.heading),
      intro: pageStr(ap.intro, d.approach.intro, L.intro), loopNote: pageStr(ap.loopNote, d.approach.loopNote, L.loop),
      rpa: modeBlock(ap.rpa, d.approach.rpa), ai: modeBlock(ap.ai, d.approach.ai),
    },
    about: {
      headingA: pageStr(ab.headingA, d.about.headingA, L.heading), headingAccent: pageStr(ab.headingAccent, d.about.headingAccent, L.heading),
      paragraphs: list(ab.paragraphs, d.about.paragraphs, L.paragraph, L.maxParagraphs), quote: pageStr(ab.quote, d.about.quote, L.quote),
      captionLeft: pageStr(ab.captionLeft, d.about.captionLeft, L.caption), captionRight: pageStr(ab.captionRight, d.about.captionRight, L.caption),
    },
    contact: {
      headingA: pageStr(c.headingA, d.contact.headingA, L.heading), headingB: pageStr(c.headingB, d.contact.headingB, L.heading), sub: pageStr(c.sub, d.contact.sub, L.sub),
      button: pageStr(c.button, d.contact.button, L.label), dialogKicker: pageStr(c.dialogKicker, d.contact.dialogKicker, L.dialogKicker), dialogTitle: pageStr(c.dialogTitle, d.contact.dialogTitle, L.dialogTitle),
      dialogIntro: pageStr(c.dialogIntro, d.contact.dialogIntro, L.dialogIntro), questions: list(c.questions, d.contact.questions, L.question, L.maxQuestions),
      linkLabel: pageStr(c.linkLabel, d.contact.linkLabel, L.label), linkUrl: safeContactUrl(c.linkUrl),
    },
    footer: { tagline: pageStr(f.tagline, d.footer.tagline, L.tagline) },
  };
}
function pageKey(p) { return JSON.stringify(normalizePage(p)); }

// What blocks publishing (errors) and what deserves a second look (warnings). Takes the editor's RAW draft,
// because normalizePage silently drops an invalid link.
function validatePage(raw) {
  const r = pageObj(raw), c = pageObj(r.contact), errors = [], warnings = [], n = normalizePage(raw);
  const typed = typeof c.linkUrl === "string" ? c.linkUrl.trim() : "";
  if (typed && !safeContactUrl(typed)) errors.push({ section: "contact", text: "The contact link must be an email address or an https:// address." });
  if (!n.contact.linkUrl && !(typed && !safeContactUrl(typed))) warnings.push({ section: "contact", text: "No contact link yet — the “Start a conversation” dialog has no way for visitors to reach you." });
  if (![n.hero.line1, n.hero.line2, n.hero.accent].some((t) => t.trim())) warnings.push({ section: "hero", text: "The hero headline is empty." });
  if (!n.contact.button.trim()) warnings.push({ section: "contact", text: "The contact button has no text." });
  return { errors, warnings };
}

// =====================================================================================
// MagicPath homepage ("Mats Homepage" — project "Mats — Homepage Redesign", component
// 459253902437670912, revision 459258501928206336), inlined here so the whole site stays
// in this one file. The code is the MagicPath export converted from TSX to JSX, with a few
// small, deliberate changes for this site:
//   - in-page links scroll with JavaScript (a plain #section link would collide with the
//     HashRouter used on GitHub Pages)
//   - props: defaultMode / defaultStage / onModeChange (remember RPA vs Agentic AI), `page` (all the text) and `work` (the cards)
//   - the "connect your email here" placeholder is replaced by the contact link set in /admin
//   - the note under the example projects is worded for visitors
// Release 2026-10-15: two synchronized RPA / Agentic AI switches (above the hero and in How I work), mode-dependent hero copy,
// the dotted-background animation with its layered card, spacing and hover polish.
// The animated logo (BrandLogo) and the cleaned-up eight-stage animation (small pause/play button, signal that follows the
// selected stage, corrected flowchart) come from the "logo and clean animation" update.
// The example projects and the numbers in the animation are ILLUSTRATIONS, not results.
// Each part sits in its own function scope so its helper names (rpa, ai, Icon, ...) can't
// clash with anything else in this file.
// =====================================================================================
const MR_CSS = String.raw`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
.mr-app{--bg:#f8f7f3;--ink:#172033;--secondary:#586477;--blue:#3b60c5;--border:#dce2eb;font-family:Inter,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh}.mr-app *{box-sizing:border-box}.mr-app button,.mr-app input{font:inherit}.mr-app button{cursor:pointer}.mr-app a{color:inherit;text-decoration:none}.mr-app :focus-visible{outline:3px solid #7694e1;outline-offset:5px}.mr-app section[id]{scroll-margin-top:30px}.mr-header{max-width:1272px;margin:auto;padding:27px 36px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e3de;gap:25px}.mr-brand{font-family:'Space Grotesk',sans-serif;font-size:27px;font-weight:700;letter-spacing:-1px;display:flex;align-items:center}.mr-logomark{font-family:monospace;font-size:24px;letter-spacing:-5px;color:var(--blue);margin-right:16px}.mr-period{color:var(--blue)}.mr-header nav{display:flex;gap:38px;font-size:13px;color:var(--secondary)}.mr-header nav a:hover{color:var(--blue)}.mr-headercta{border:1px solid #ccd4e0;padding:10px 17px;border-radius:5px;font-size:12px}.mr-headercta span{margin-left:27px;color:var(--blue)}.mr-app main{max-width:1200px;margin:auto;padding:0 24px}.mr-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:45px;padding:76px 0 59px;align-items:center}.mr-kicker{font-family:Inter,sans-serif;font-size:9px;font-weight:500;letter-spacing:1.6px;color:#697588;display:flex;align-items:center;gap:9px}.mr-kicker>i{width:5px;height:5px;background:#bd8c5f;border-radius:50%}.mr-hero h1{font-family:'Space Grotesk',sans-serif;font-size:55px;line-height:1.13;letter-spacing:-2.4px;font-weight:500;margin:24px 0}.mr-app em{font-style:normal;color:var(--blue)}.mr-herocopy>p{font-size:15px;line-height:1.85;color:var(--secondary);max-width:465px}.mr-actions{display:flex;gap:23px;align-items:center;margin-top:28px}.mr-primary{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 18px;background:var(--blue);color:#fff!important;border-radius:5px;font-size:12px}.mr-primary:hover{background:#2b4ca9}.mr-textlink{font-size:11px;display:flex;gap:13px;color:var(--secondary)!important}.mr-heronote{display:flex;align-items:center;gap:12px;margin-top:30px;font-size:10px;color:#737d87}.mr-heronote>span{font-size:19px;font-weight:400;color:#bf956f}.mr-system{background:#eff2f8;border:1px solid #dbe2ef;border-radius:12px;overflow:hidden;box-shadow:0 17px 33px #2d436b06}.mr-systemtop{display:flex;align-items:center;justify-content:space-between;padding:17px 20px 0;color:#7184a4;font-size:8px;letter-spacing:1.3px}.mr-systemtop button{border:1px solid #cfdaee;border-radius:5px;width:25px;height:25px;background:#f7f9fe;font-size:11px;color:#617dac}.mr-systemtitle{display:flex;justify-content:space-between;align-items:center;padding:12px 20px 0;color:#405a8b;font-size:13px}.mr-systemtitle small{font-family:monospace;font-size:8px;color:#8192af}.mr-diagram{position:relative;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;height:255px;padding:16px 14px 0;background-image:radial-gradient(#c4cfe4 .7px,transparent .7px);background-size:18px 18px}.mr-connections{position:absolute;inset:0;width:100%;height:100%}.mr-node{z-index:1;align-self:center;justify-self:center;display:flex;align-items:center;flex-direction:column;gap:10px}.mr-node>span{width:48px;height:48px;border:1px solid #ced9ed;background:#f8faff;border-radius:12px;color:#6884bd;display:grid;place-items:center;transition:background .3s,color .3s}.mr-node small{font-size:9px;color:#6880a7}.mr-node.active>span{background:var(--blue);color:white;border-color:var(--blue);box-shadow:0 0 0 5px #dce5f9}.mr-node.active small{color:var(--blue);font-weight:600}.mr-systemstatus{padding:13px 20px;border-top:1px solid #dbe3f0;font-size:9px;display:flex;flex-direction:column;gap:8px;min-height:64px;color:#4f6b9e}.mr-systemstatus b{font-weight:400;margin:0 5px;color:#8297bb}.mr-systemstatus i{display:inline-block;background:#80a286;width:4px;height:4px;border-radius:50%;margin-right:5px}.mr-systemstatus small{font-size:6px;letter-spacing:1.1px;color:#7c8ca6}.mr-mode{background:#f8f9fc;display:flex;align-items:center;justify-content:space-between;padding:12px 17px;border-top:1px solid #dbe3f0;font-size:9px;color:#71809b}.mr-mode>div{display:flex;background:#e8edf7;border-radius:5px;padding:3px;gap:2px}.mr-mode button{background:none;border:0;color:#6d7e9c;font-size:10px;padding:7px 12px;border-radius:3px}.mr-mode button.active{background:#fff;color:var(--blue);box-shadow:0 1px 3px #3046670c}.mr-values{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:24px 0;border-top:1px solid #e2e3de;border-bottom:1px solid #e2e3de;font-size:11px;color:#66717c}.mr-values>span:first-child{font-size:8px;letter-spacing:1.3px;color:#89918e}.mr-values b{font-weight:400;font-size:15px;color:#c29e7a}.mr-work{padding:64px 0 55px}.mr-sectionhead{display:flex;align-items:end;justify-content:space-between;gap:30px}.mr-app h2{font-family:'Space Grotesk',sans-serif;font-size:35px;font-weight:500;letter-spacing:-1.4px;line-height:1.2;margin:15px 0 0}.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0}.mr-workgrid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:31px}.mr-project{text-align:left;min-width:0;border:1px solid #dfe3e9;border-radius:10px;background:#fff;padding:0;overflow:hidden;transition:transform .2s,box-shadow .2s}.mr-project:hover{transform:translateY(-3px);box-shadow:0 12px 25px #213e6310}.mr-projectart{position:relative;background:var(--art-bg,#edf2fb);min-height:245px;padding:18px 23px 26px;border-bottom:1px solid var(--art-edge,#dfe7f3)}.mr-artlabel{display:flex;justify-content:space-between;gap:14px;font-size:7px;letter-spacing:.7px;color:var(--art-label,#7288b3)}.mr-artlabel>span:last-child{font-size:6px;color:var(--art-mute,#7f8fac)}.mr-invoiceflow{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:27px}.mr-invoice{width:131px;padding:16px 14px;background:var(--art-surface,#fff);border:1px solid var(--art-line,#cfdbee);border-radius:7px;transform:rotate(-4deg);box-shadow:0 8px 15px #3b60c509}.mr-doc{color:var(--art-accent,#7994ca);display:block}.mr-invoice>strong{display:block;font-size:10px;color:var(--art-ink,#4d6696);margin:10px 0}.mr-invoiceline{display:block;height:4px;border-radius:2px;background:var(--art-soft,#e2e9f5);margin-top:6px}.mr-invoiceline.short{width:65%}.mr-invoice>small{display:block;font-family:monospace;font-size:7px;color:var(--art-mute,#91a1bb);margin-top:11px}.mr-flowarrow{font-size:22px;color:var(--art-accent,#8fa6d0)}.mr-resultcards{display:flex;flex-direction:column;gap:12px}.mr-resultcards>div{position:relative;border:1px solid var(--art-line,#cbd9ee);background:var(--art-surface,#f9fbff);border-radius:6px;padding:12px 15px 12px 34px;min-width:146px}.mr-resultcards>div>span{position:absolute;left:12px;top:15px;font-size:12px;color:#729783}.mr-resultcards strong{display:block;font-size:10px;font-weight:500;color:var(--art-ink,#5b729b)}.mr-resultcards small{display:block;font-size:8px;margin-top:4px;color:var(--art-mute,#7d90b0)}.mr-resultcards>div:last-child{background:#fcf7f0;border-color:#e5d6c0}.mr-resultcards>div:last-child>span{color:#b59263}.mr-aiart{background:var(--art-bg,#f3eee7);border-color:var(--art-edge,#e8dfd1)}.mr-aiart .mr-artlabel{color:var(--art-label,#9d8b76)}.mr-answer{max-width:320px;margin:24px auto 0;border:1px solid var(--art-line,#ded3c3);background:var(--art-surface,#fffdf8);border-radius:7px;box-shadow:0 7px 15px #66451e05;overflow:hidden}.mr-answerquestion{padding:10px 13px;font-size:9px;color:var(--art-mute,#86745f);border-bottom:1px solid var(--art-edge,#ebe3d7);display:flex;gap:8px;align-items:center}.mr-answerquestion>span{font-family:monospace;font-size:9px;color:var(--art-accent,#a18b70)}.mr-answerbody{padding:13px;display:flex;gap:11px}.mr-spark{font-size:21px;color:var(--art-accent,#b28e61)}.mr-answerbody strong{font-size:11px;font-weight:500;color:var(--art-ink,#756650)}.mr-answerbody p{font-size:9px;line-height:1.6;color:var(--art-mute,#9c8a72);margin:5px 0 8px}.mr-source{font-size:7px;color:var(--art-ink,#977953);background:var(--art-soft,#f4ecdf);padding:4px 6px;border-radius:3px}.mr-approval{border-top:1px solid var(--art-edge,#ebe3d7);padding:9px 13px;font-size:8px;color:var(--art-mute,#8e7a60);display:flex;align-items:center;gap:6px}.mr-approval i{width:4px;height:4px;background:var(--art-accent,#bc965f);border-radius:50%}.mr-approval>span{margin-left:auto;color:var(--art-mute,#9e9875)}.mr-projectbody{padding:23px 25px}.mr-projectbody .mr-kicker{font-size:8px;letter-spacing:1px;color:#7c8899}.mr-project h3{font-family:'Space Grotesk',sans-serif;font-size:22px;letter-spacing:-.6px;font-weight:500;color:var(--ink);margin:12px 0;display:flex;justify-content:space-between;gap:12px}.mr-project h3>span{color:var(--blue);font-weight:400;font-size:21px}.mr-projectbody>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0;max-width:400px}.mr-caseaction{display:flex;gap:13px;margin-top:19px;font-size:10px;color:var(--blue)}.mr-example-note{font-size:9px;line-height:1.6;color:#79818a;margin:15px 0 0}.mr-approach{padding:24px 0 50px}.mr-approachintro{text-align:right}.mr-modebadge{display:inline-block;background:#eaf0fc;border:1px solid #d9e3f5;border-radius:4px;padding:5px 8px;font-size:7px;letter-spacing:1px;color:#6280b9;margin-top:10px}.mr-stagebuttons{display:grid;grid-template-columns:repeat(8,1fr);margin-top:29px;border-bottom:1px solid #d4ddeb}.mr-stagebuttons button{background:none;text-align:left;border:0;border-bottom:2px solid transparent;min-width:0;padding:13px 10px 17px;color:#7b8695;font-size:12px}.mr-stagebuttons small{font-size:8px;display:block;font-family:monospace;margin-bottom:8px;color:#909baa}.mr-stagebuttons button.active{color:var(--blue);border-bottom-color:var(--blue);background:linear-gradient(transparent,#edf2fc)}.mr-stagebuttons button.active small{color:var(--blue)}.mr-stagecontent{display:grid;grid-template-columns:95px 1fr 210px;gap:36px;padding:32px 8px}.mr-stagenumber{font-family:'Space Grotesk',sans-serif;font-size:60px;line-height:1;letter-spacing:-3px;color:#c3cddd}.mr-stagenumber>span{display:block;font-size:10px;letter-spacing:1px;color:#8696ac;margin:8px 0 26px}.mr-stagenumber>svg{color:#a4b5d5}.mr-stagetext h3{font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:24px;letter-spacing:-.7px;line-height:1.3;margin:12px 0}.mr-stagetext>p{font-size:13px;line-height:1.8;color:var(--secondary);margin:0}.mr-stagechecks{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:18px;font-size:9px;color:#69798c}.mr-stagechecks b{font-weight:400;color:#84a091;margin-right:6px}.mr-stageaside{border-left:1px solid #dfe4eb;padding-left:24px}.mr-stageaside .mr-kicker{font-size:7px;letter-spacing:1.2px}.mr-stageaside>p{font-family:'Space Grotesk',sans-serif;font-size:19px;line-height:1.4;color:#687d9e;margin:14px 0 20px}.mr-stageaside>div{display:flex;gap:9px}.mr-stageaside button{width:32px;height:32px;background:#fff;border:1px solid #d4deeb;border-radius:50%;font-size:13px;color:#6882aa}.mr-loopnote{display:flex;gap:9px;color:#8096b8;font-size:17px;padding:0 8px}.mr-loopnote>span{font-size:10px;color:#7d8a9b;align-self:center}.mr-about{display:grid;grid-template-columns:.8fr 1.3fr;gap:65px;align-items:center;border-top:1px solid #e1e3df;padding:49px 0}.mr-aboutart{position:relative;display:grid;place-items:center;overflow:hidden;min-height:285px;background:#e8edf7;border:1px solid #dae2ef;border-radius:10px}.mr-aboutmonogram{font-family:'Space Grotesk',sans-serif;font-size:142px;letter-spacing:-15px;color:#758ec4;z-index:1}.mr-aboutmonogram>span{color:#c5a480}.mr-aboutartbottom{position:absolute;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;z-index:1;font-size:7px;letter-spacing:1px;color:#6c83ac}.mr-orbit{position:absolute;width:300px;height:300px;border:1px solid #d3ddec;border-radius:50%;left:-70px;top:-120px}.mr-orbit.two{width:400px;height:400px;top:-165px;left:-120px}.mr-orbit.three{width:500px;height:500px;left:-170px;top:-210px}.mr-aboutcopy h2{margin:18px 0 21px;font-size:32px}.mr-aboutcopy>p{font-size:13px;line-height:1.85;color:var(--secondary);max-width:540px}.mr-personalnote{display:flex;gap:12px;align-items:center;font-size:11px;color:#738096;margin-top:21px}.mr-personalnote>span{font-family:Georgia;font-size:39px;line-height:1;color:#c7a787}.mr-contact{background:#253d75;color:#fff;border-radius:11px;padding:36px 40px;overflow:hidden}.mr-contact .mr-kicker{color:#bccbeb;font-size:8px}.mr-contact>div:nth-child(2){display:flex;justify-content:space-between;align-items:center;gap:25px}.mr-contact h2{font-size:35px;line-height:1.17;color:#fbfaf5;margin:17px 0}.mr-contactbutton{flex-shrink:0;border:1px solid #e6e3d9;border-radius:5px;background:#f8f4e9;padding:13px 17px;font-size:11px;color:#3e527f;display:flex;gap:27px}.mr-contact>p{font-size:10px;color:#b6c6e7;margin:3px 0 0}.mr-footer{max-width:1200px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:28px 24px}.mr-footer .mr-brand{font-size:22px}.mr-footer>span,.mr-footer>a:last-child{font-size:9px;color:#737f8d}.mr-overlay{position:fixed;inset:0;z-index:99;background:#17203377;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px}.mr-modal{position:relative;background:var(--bg);border:1px solid #dbe1e8;border-radius:12px;max-width:610px;width:100%;max-height:90vh;overflow:auto;padding:39px}.mr-close{position:absolute;top:11px;right:14px;border:0;background:none;font-size:26px;color:#78859a}.mr-modal h2{font-size:30px;margin:20px 0 25px}.mr-modal h3{font-size:13px;margin:22px 0 10px}.mr-modal p,.mr-modal li{font-size:13px;line-height:1.9;color:var(--secondary)}.mr-modal ol{padding-left:19px}.mr-previewnotice{padding:14px;border:1px solid #e1dacd;border-radius:5px;background:#f3efe6;color:#89785e;font-size:10px;line-height:1.7;margin-top:23px}@media(prefers-reduced-motion:reduce){.mr-app *{transition:none!important}}@media(max-width:1050px){.mr-hero{gap:26px}.mr-hero h1{font-size:45px}.mr-systemtitle{font-size:11px}.mr-actions{gap:16px}.mr-textlink{font-size:10px}.mr-stagecontent{grid-template-columns:75px 1fr 170px;gap:25px}.mr-invoiceflow{gap:12px}.mr-projectart{padding:17px}.mr-project h3{font-size:20px}.mr-about{gap:35px}}@media(max-width:720px){.mr-header{padding:20px;gap:15px;flex-wrap:wrap}.mr-brand{font-size:25px}.mr-header nav{order:3;width:100%;justify-content:center;gap:40px;font-size:12px;padding-top:13px}.mr-headercta{margin-left:auto;font-size:11px}.mr-app main{padding:0 20px}.mr-hero{grid-template-columns:1fr;padding:36px 0;gap:30px}.mr-hero h1{font-size:43px;letter-spacing:-1.9px}.mr-herocopy>.mr-kicker{font-size:7px;letter-spacing:1px}.mr-herocopy>p{font-size:15px}.mr-actions{flex-wrap:wrap;gap:18px}.mr-primary{font-size:12px}.mr-textlink{font-size:12px}.mr-system{width:100%;max-width:480px;margin:auto}.mr-values{flex-wrap:wrap;justify-content:center;gap:15px 20px;font-size:10px}.mr-values>span:first-child{width:100%;text-align:center}.mr-values b{display:none}.mr-work{padding:36px 0}.mr-sectionhead{display:block}.mr-app h2{font-size:29px}.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;margin-top:17px}.mr-workgrid{grid-template-columns:1fr;gap:22px}.mr-projectbody{padding:22px}.mr-project h3{font-size:23px}.mr-projectbody>p{font-size:13px}.mr-projectart{min-height:235px}.mr-example-note{font-size:10px}.mr-approach{padding:13px 0 35px}.mr-approachintro{text-align:left}.mr-stagebuttons{grid-template-columns:repeat(4,1fr);gap:4px}.mr-stagebuttons button{padding:12px 9px;min-height:65px}.mr-stagecontent{grid-template-columns:50px 1fr;gap:18px;padding:25px 0}.mr-stagenumber{font-size:43px}.mr-stagenumber>svg{width:32px}.mr-stagetext h3{font-size:22px}.mr-stageaside{grid-column:2;border-left:0;border-top:1px solid #dfe4eb;padding:20px 0 0}.mr-stageaside>p{font-size:18px}.mr-stagechecks{font-size:10px;display:grid}.mr-stageaside button{width:40px;height:40px}.mr-loopnote{padding:0;font-size:19px}.mr-about{grid-template-columns:1fr;padding:30px 0;gap:28px}.mr-aboutart{min-height:225px}.mr-aboutcopy h2{font-size:29px}.mr-aboutcopy>p{font-size:14px}.mr-contact{padding:28px 23px}.mr-contact>div:nth-child(2){display:block}.mr-contact h2{font-size:30px;margin:19px 0 23px}.mr-contact>p{margin-top:20px;line-height:1.7}.mr-footer{padding:25px 20px}.mr-footer>span{display:none}.mr-modal{padding:32px 24px}.mr-systemstatus{font-size:8px}.mr-systemstatus small{font-size:6px}}


/* Additions for the Senior-Automation-Engineer integration (not part of the MagicPath export) */
body.mr-body{margin:0;background:#f8f7f3}
.mr-modalcta{border:0;margin-top:23px}

/* Logo motion: CSS replays when the mode-keyed inner span changes. */
.mr-logo-motion{display:inline-flex;align-items:center;gap:12px;white-space:nowrap}
.mr-logo-symbol{display:block;flex:none;color:var(--blue);overflow:visible}
.mr-logo-bracket{stroke-dasharray:1;stroke-dashoffset:0;animation:mr-logo-draw .65s cubic-bezier(.22,.7,.3,1) both}
.mr-logo-arrow{animation:mr-logo-forward .65s cubic-bezier(.22,.7,.3,1) both}
.mr-logo-word{display:inline-block;animation:mr-logo-word .6s cubic-bezier(.22,.7,.3,1) both}
.mr-logo-dot{display:inline-block;transform-origin:50% 85%;animation:mr-logo-dot .75s ease both}
.mr-logo-spark{opacity:0;transform-box:fill-box;transform-origin:center}
.mr-logo-ai .mr-logo-spark{animation:mr-logo-spark .8s ease both}
@keyframes mr-logo-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes mr-logo-forward{0%{opacity:.3;transform:translateX(-5px)}65%{opacity:1;transform:translateX(1px)}100%{opacity:1;transform:translateX(0)}}
@keyframes mr-logo-word{from{opacity:.6;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}
@keyframes mr-logo-dot{0%,25%{transform:scale(.6)}65%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes mr-logo-spark{0%,25%{opacity:0;transform:scale(.5)}55%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.15)}}
@media(prefers-reduced-motion:reduce){.mr-logo-motion *{animation:none!important;transition:none!important}.mr-logo-bracket{stroke-dashoffset:0}.mr-logo-spark{opacity:0}}

/* Shared perspective controls and focused interaction polish. */
.mr-hero-focus{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:28px}.mr-focus-label{font-size:8px;letter-spacing:1.5px;color:#68768c;font-weight:500}.mr-focus-switch{position:relative;display:inline-grid;grid-template-columns:1fr 1.45fr;gap:0;isolation:isolate;padding:4px;border:1px solid #d4dce9;border-radius:12px;background:#eaeef6;min-width:235px;box-shadow:inset 0 1px 2px #203e6810}.mr-focus-slider{position:absolute;z-index:-1;left:4px;top:4px;bottom:4px;width:calc((100% - 8px)/2.45);background:#3b60c5;border-radius:8px;box-shadow:0 3px 7px #3b60c52b;transition:left .3s cubic-bezier(.2,.7,.2,1),width .3s cubic-bezier(.2,.7,.2,1)}.mr-focus-slider.is-ai{left:calc(4px + (100% - 8px)/2.45);width:calc((100% - 8px)*1.45/2.45)}.mr-focus-switch button{display:flex;justify-content:center;align-items:center;gap:8px;min-height:37px;border:0;background:transparent;border-radius:8px;color:#60718d;font-size:11px;font-weight:500;padding:0 16px;transition:color .2s}.mr-focus-switch button[aria-pressed=true]{color:#fff}.mr-focus-switch button[aria-pressed=false]:hover{color:#3b60c5}.mr-focus-switch button>span{font-size:15px}.mr-approachintro .mr-focus-switch{margin-top:13px;text-align:left}.mr-hero h1{font-size:clamp(36px,4.6vw,55px)}.mr-herocopy>p{min-height:84px}.mr-project{transition:transform .25s,box-shadow .25s,border-color .25s}.mr-project:hover{transform:translateY(-4px);border-color:#b7c7e6;box-shadow:0 18px 35px -20px #294b8555}.mr-caseaction>span,.mr-project h3>span{display:inline-block;transition:transform .25s}.mr-project:hover .mr-caseaction>span{transform:translateX(4px)}.mr-project:hover h3>span{transform:translate(2px,-2px)}.mr-stagebuttons button{transition:background .2s,border-color .2s,color .2s}.mr-stagebuttons button:not(.active):hover{background:#edf1f9;border-color:#bccde9}.mr-stagecontent{animation:mr-stage-enter .35s ease both}.mr-contactbutton{transition:transform .2s,box-shadow .2s}.mr-contactbutton:hover{transform:translateY(-2px);box-shadow:0 6px 15px #17203318}.ls-bottom>span:last-child{font-size:7px;letter-spacing:.7px;color:#7185a5}.mr-app a,.mr-app button{-webkit-tap-highlight-color:#3b60c522}@keyframes mr-stage-enter{from{opacity:.65;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:720px){.mr-hero-focus{margin-bottom:23px;gap:9px}.mr-focus-switch{min-width:225px}.mr-focus-switch button{min-height:40px}.mr-herocopy>p{min-height:0}.mr-approachintro .mr-focus-switch{margin-top:10px}.mr-hero h1{font-size:clamp(35px,8.4vw,48px)}}
@media(prefers-reduced-motion:reduce){.mr-focus-slider,.mr-focus-switch button,.mr-project,.mr-caseaction>span,.mr-project h3>span,.mr-contactbutton{transition:none}.mr-stagecontent{animation:none}.mr-project:hover,.mr-contactbutton:hover{transform:none}}

.ls-story{position:relative;isolation:isolate;min-width:0;overflow:hidden;border:1px solid #d2dcef;border-radius:23px;background:radial-gradient(ellipse at 0 0,#fff 0,transparent 60%),radial-gradient(ellipse at 100% 40%,#dde8ff88,transparent 65%),#edf2fb;box-shadow:0 28px 65px -35px #24478566,0 2px 6px #24478508,inset 0 1px #fff;font-family:Inter,sans-serif}.ls-story:before{content:'';position:absolute;top:0;left:14%;right:14%;height:1px;background:linear-gradient(90deg,transparent,#fff,transparent);pointer-events:none}.ls-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:23px 23px 0;font-size:7px;font-weight:600;letter-spacing:1.25px;color:#5a729c}.ls-top>span:first-child{display:flex;align-items:center;gap:7px}.ls-statuslight{width:5px;height:5px;background:#527bdd;border-radius:50%;box-shadow:0 0 0 3px #527bdd12}.ls-demo{white-space:nowrap;font-size:6px;letter-spacing:.8px;border:1px solid #cbd8ed;background:#ffffff70;padding:5px 6px;border-radius:5px}.ls-heading{padding:16px 23px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.ls-heading strong{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:500;letter-spacing:-.55px;color:#263f6b}.ls-heading>span{font-size:18px;color:#3b60c5;font-family:monospace}.ls-heading small{font-size:9px;color:#7184a5}.ls-canvas{position:relative}.ls-canvas>svg{display:block;width:100%;height:auto;overflow:visible}.ls-paper{filter:drop-shadow(0 8px 9px #314f8617)}.ls-node{color:#6a85b4;cursor:pointer;outline:none}.ls-nodeface{stroke:#c7d5ed;stroke-width:1;filter:drop-shadow(0 3px 3px #31538508);transition:stroke .25s,filter .25s,fill .25s}.ls-node>text{font-family:Inter,sans-serif;font-size:10px;fill:#587199}.ls-node>text.ls-nodenumber{font-family:monospace;font-size:7px;fill:#8b9dbc;letter-spacing:1px}.ls-node.ls-active{color:#fff}.ls-active>.ls-nodeface{stroke:#557bce;filter:drop-shadow(0 6px 8px #315ec53d)}.ls-active>text{fill:#315bbb;font-weight:600}.ls-complete{color:#4d71b2}.ls-complete>.ls-nodeface{fill:#edf3ff;stroke:#b6c9eb}.ls-node:hover>.ls-nodeface,.ls-node:focus-visible>.ls-nodeface{stroke:#315bbb;stroke-width:2.5;filter:drop-shadow(0 4px 6px #315ec52b)}.ls-halo{transform-box:fill-box;transform-origin:center;animation:ls-breathe 2.4s ease-in-out infinite}.ls-signal{animation:ls-signal-pulse 2.4s ease-in-out infinite}.ls-signal-soft{opacity:.25}.ls-scene{animation:ls-reveal .65s cubic-bezier(.2,.7,.2,1) both}.ls-caption{padding:18px 23px 12px;border-top:1px solid #fff;background:linear-gradient(120deg,#ffffffa8,#f6f8ff70)}.ls-caption>div{display:flex;align-items:center;gap:10px}.ls-stagepill{display:grid;place-items:center;width:27px;height:24px;border:1px solid #ccd9f1;border-radius:7px;background:#e9effb;color:#4569ba;font:10px monospace}.ls-caption strong{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:500;color:#233e70}.ls-captionnote{margin-left:auto;font-size:6px;letter-spacing:.9px;color:#7285a4}.ls-caption p{font-size:12px;line-height:1.75;color:#566e94;margin:10px 0 0;min-height:42px;animation:ls-copy .4s ease both}.ls-timeline{display:flex;gap:4px;padding:0 23px 15px;background:#f7f9fdb3}.ls-timeline>span{flex:1;height:3px;background:#dce5f4;overflow:hidden;border-radius:4px}.ls-timeline i{display:block;width:100%;height:100%;background:#547bd5;transform:scaleX(0);transform-origin:left}.ls-timeline .done i{transform:scaleX(1)}.ls-timeline .current i{animation:ls-fill 4.8s linear both}.ls-story:not(.ls-running) .ls-timeline .current i{animation:none;transform:scaleX(1)}.ls-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 20px 16px;background:#f7f9fdb3}.ls-controls>div{display:flex;gap:5px}.ls-controls button{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:32px;padding:0 9px;border:1px solid #d0dcf0;border-radius:9px;background:#ffffffb8;color:#526e9e;font-size:13px;transition:background .2s,transform .2s,box-shadow .2s}.ls-controls button.ls-play{background:#3b60c5;border-color:#3b60c5;color:white;padding:0 12px;box-shadow:0 3px 6px #3b60c51c}.ls-controls button span{font-size:10px}.ls-controls button:hover{transform:translateY(-1px);box-shadow:0 4px 9px #315ec518}.ls-controls button:focus-visible,.ls-bottom button:focus-visible{outline:2px solid #3b60c5;outline-offset:3px}.ls-controlhint{font-size:8px;color:#6c81a3;text-align:right}.ls-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 20px;border-top:1px solid #dbe3f1;background:#fdfefe90}.ls-bottom>span{display:flex;align-items:center;gap:6px;color:#7587a1;font-size:8px}.ls-bottom>span i{width:4px;height:4px;background:#8c9fbc;border-radius:50%}.ls-bottom>div{display:flex;gap:2px;border:1px solid #dde5f2;background:#e9eef8;border-radius:8px;padding:3px}.ls-bottom button{cursor:pointer;border:0;background:none;border-radius:5px;padding:7px 12px;color:#60779d;font-size:10px;transition:background .25s,color .25s}.ls-bottom button.active{background:#fff;color:#315bbb;box-shadow:0 2px 4px #294a7d12}.sv-search{animation:sv-search 4s ease-in-out infinite}.sv-grow{transform-box:fill-box;transform-origin:left;animation:sv-grow 1.5s cubic-bezier(.2,.7,.2,1) both}.sv-draw,.sv-chart{stroke-dasharray:400;stroke-dashoffset:400;animation:sv-draw 2.8s ease forwards}.sv-check{animation:sv-check .6s ease-out both;transform-box:fill-box;transform-origin:center}.sv-document{animation:sv-document 3.6s ease-in-out infinite}.sv-server{animation:sv-server .8s ease both}.sv-link{animation:sv-link 1s linear infinite}.ls-story :is(.ls-halo,.ls-signal,.ls-scene,.sv-search,.sv-grow,.sv-draw,.sv-chart,.sv-check,.sv-document,.sv-server,.sv-link){animation-play-state:paused}.ls-running :is(.ls-halo,.ls-signal,.ls-scene,.sv-search,.sv-grow,.sv-draw,.sv-chart,.sv-check,.sv-document,.sv-server,.sv-link){animation-play-state:running}.ls-story:not(.ls-running) :is(.ls-scene,.sv-grow,.sv-check,.sv-server){animation:none}.ls-story:not(.ls-running) :is(.sv-draw,.sv-chart){animation:none;stroke-dashoffset:0}
@keyframes ls-signal-pulse{0%,100%{opacity:.6}50%{opacity:1}}@keyframes ls-breathe{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.7;transform:scale(1.065)}}@keyframes ls-reveal{from{opacity:.75;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes ls-copy{from{opacity:.25;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}@keyframes ls-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes sv-search{0%,100%{transform:translateX(-25px)}50%{transform:translateX(45px)}}@keyframes sv-grow{from{transform:scaleX(.12)}to{transform:scaleX(1)}}@keyframes sv-draw{to{stroke-dashoffset:0}}@keyframes sv-check{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}@keyframes sv-document{0%,100%{fill:#eef3fc}50%{fill:#dde9ff;stroke:#92afe7}}@keyframes sv-server{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes sv-link{to{stroke-dashoffset:-12}}
@media(max-width:720px){.ls-story{border-radius:18px}.ls-top{padding:20px 17px 0;font-size:6px;letter-spacing:.8px}.ls-heading{padding:15px 17px 10px}.ls-heading strong{font-size:17px}.ls-caption{padding:16px 18px 12px}.ls-captionnote{font-size:5.5px;letter-spacing:.5px}.ls-caption p{font-size:12px;min-height:42px}.ls-timeline{padding-left:18px;padding-right:18px}.ls-controls{padding:0 15px 15px;gap:7px}.ls-controls button{height:36px;min-width:34px}.ls-controlhint{font-size:7px;max-width:95px;line-height:1.5}.ls-bottom{padding:11px 15px}.ls-bottom button{padding:8px 11px}}
@media(prefers-reduced-motion:reduce){.ls-story *{animation:none!important;transition:none!important}.ls-story :is(.sv-draw,.sv-chart){stroke-dashoffset:0}.ls-scene,.sv-grow,.sv-check,.sv-server{opacity:1;transform:none}.ls-timeline .current i{transform:scaleX(1)}}

.ls-quietplay{font:inherit;font-size:8px;letter-spacing:.2px;color:#5a729c;cursor:pointer;min-height:28px;padding:5px 9px;background:#ffffff70;border:1px solid #cbd8ed;border-radius:6px}.ls-quietplay:hover{background:#fff;color:#315bbb}.ls-quietplay:focus-visible{outline:2px solid #3b60c5;outline-offset:3px}.ls-caption{padding-bottom:20px}

/* ---- Selected work: editable cards (templates, states, text hardening) ---- */
.mr-artlabel>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr-project h3{overflow-wrap:anywhere}
.mr-projectbody>p{overflow-wrap:anywhere}
.mr-projectbody .mr-kicker{overflow-wrap:anywhere}
.mr-workgrid.single{grid-template-columns:minmax(0,640px)}
.mr-dash{max-width:340px;margin:22px auto 0}
.mr-dash svg{display:block;width:100%;height:auto}
.mr-dash text{font-family:Inter,sans-serif}
.dsh-panel{fill:var(--art-surface,#f9fbff);stroke:var(--art-line,#ccdaef)}
.dsh-tile{fill:var(--art-soft,#eef3fc)}
.dsh-label{fill:var(--art-mute,#8598b6)}
.dsh-value{fill:var(--art-ink,#6687c4)}
.dsh-grid{stroke:var(--art-edge,#e1e8f3)}
.dsh-line{stroke:var(--art-accent,#668dce)}
.dsh-note{fill:var(--art-mute,#8ca0bd)}
.mr-art-image{padding:0;overflow:hidden}
.mr-artimg{position:absolute;inset:0;overflow:hidden}
.mr-artimg img{display:block;width:100%;height:100%;object-fit:cover}
.mr-artimg-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--art-mute,#7f8fac)}
.mr-art-image .mr-artlabel{position:absolute;top:14px;left:16px;right:16px;z-index:2}
.mr-art-image .mr-artlabel>span{background:#ffffffdb;color:#4b5c78;padding:3px 7px;border-radius:4px}
.mr-art-image .mr-artlabel>span:empty{display:none}
.mr-skeleton{pointer-events:none}
.mr-skeleton .mr-projectart{background:#eceff4;border-bottom-color:#e3e7ee}
.mr-skelline{height:10px;border-radius:3px;background:#eceff4;margin:14px 0}
.mr-skelline.w60{width:60%}
.mr-skelline.w90{width:90%}
.mr-modal .mr-modallink{display:inline-flex;margin-top:6px}
.mr-project.is-selected{box-shadow:0 0 0 2px var(--blue)}
`;

const MatsHomepage = (() => {
  const StageVisual = (() => {
    function StageVisual({
      stage,
      mode
    }) {
      const ink = "#4b73ce", pale = "#eef3fc", line = "#ccdaef", green = "#459a86";
      return <svg x="24" y="34" width="238" height="84" viewBox="0 0 238 84" role="img" aria-label={["Magnifying glass inspecting workflow documents", "Candidate scoring bars", "A branching flowchart", "A code editor connected to an application", "A test checklist with passing checks", "A staged deployment to three systems", "A dashboard with metrics and a trend chart", "Baseline and improved results feeding the next cycle"][stage]}>{stage === 0 && <><g fill={pale} stroke={line}>{[15, 77, 139].map((x) => <rect className="sv-document" style={{
        animationDelay: `${x * 2}ms`
      }} key={x} x={x} y="10" width="46" height="63" rx="5" />)}</g><g stroke={line} strokeWidth="3" strokeLinecap="round">{[25, 87, 149].map((x) => <g key={x}><path d={`M${x} 25h25M${x} 34h25M${x} 43h16`} /></g>)}</g><g className="sv-search" stroke={ink} strokeWidth="3" fill="none"><circle cx="92" cy="39" r="23" fill="#e4edff77" /><path d="m109 56 21 20" strokeWidth="8" strokeLinecap="round" /></g><text x="207" y="42" textAnchor="middle" fill={green} fontSize="20">✓</text></>}{stage === 1 && <>{[["Value", 156], ["Effort", 80], ["Risk", 48]].map(([label, w], i) => <g key={label}><text x="6" y={21 + i * 25} fill="#7d90ae" fontSize="9">{label}</text><rect x="51" y={10 + i * 25} width="172" height="13" rx="4" fill={pale} /><rect className="sv-grow" style={{
        animationDelay: `${i * 0.15}s`
      }} x="51" y={10 + i * 25} width={Number(w)} height="13" rx="4" fill={i === 0 ? ink : i === 1 ? "#a6bce3" : "#d1b38b"} /></g>)}</>}{stage === 2 && <><g fill="none" stroke={ink} strokeWidth="1.5"><path className="sv-draw" d="M45 42H77M121 42H136V22H155M136 42V61H155" /></g><rect x="5" y="28" width="40" height="28" rx="5" fill={pale} stroke={line} /><path d="m99 21 22 21-22 21-22-21Z" fill="#e1eafb" stroke={ink} /><rect x="155" y="9" width="70" height="26" rx="5" fill={pale} stroke={line} /><rect x="155" y="48" width="70" height="26" rx="5" fill="#f6f0e7" stroke="#dfcfb8" /><g fontSize="8" textAnchor="middle" fill="#6480ac"><text x="25" y="45">Input</text><text x="99" y="45">Check</text><text x="190" y="25">{mode ? "Retrieve" : "Update"}</text><text x="190" y="64">Retry</text></g></>}{stage === 3 && <><rect x="8" y="7" width="130" height="70" rx="6" fill="#edf2fa" stroke={line} /><path d="M8 22h130" stroke={line} /><g fill="#a9bbda"><circle cx="19" cy="15" r="2" /><circle cx="27" cy="15" r="2" /><circle cx="35" cy="15" r="2" /></g><g stroke={ink} strokeWidth="3" strokeLinecap="round"><path className="sv-draw" d="M23 35h30m8 0h20M31 46h54m-54 11h73M23 68h21" /></g><path className="sv-link" d="M138 44H171" stroke={ink} strokeWidth="1.5" strokeDasharray="3 3" /><rect x="171" y="20" width="57" height="48" rx="7" fill="#fff" stroke={line} /><text x="199" y="50" textAnchor="middle" fontFamily="monospace" fontSize="15" fill={ink}>{mode ? "AI" : "API"}</text></>}{stage === 4 && <>{[mode ? "Sources grounded" : "Fields validated", mode ? "Tool errors tested" : "Timeouts handled", mode ? "Regression passed" : "Outputs matched"].map((label, i) => <g key={label}><rect x="15" y={4 + i * 27} width="210" height="23" rx="4" fill={pale} stroke={line} /><text x="28" y={19 + i * 27} fontSize="9" fill="#758bae">{label}</text><g className="sv-check" style={{
        animationDelay: `${i * 0.45}s`
      }}><circle cx="207" cy={15 + i * 27} r="7" fill="#e0eee5" /><path d={`m203 ${15 + i * 27} 3 3 5-6`} stroke={green} fill="none" strokeWidth="1.5" /></g></g>)}</>}{stage === 5 && <><path d="M42 37H192" stroke={line} strokeWidth="2" strokeDasharray="4 4" />{["Shadow", "Pilot", "Live"].map((s, i) => <g className="sv-server" style={{
        animationDelay: `${i * 0.25}s`
      }} key={s}><rect x={15 + i * 79} y="15" width="47" height="43" rx="6" fill={pale} stroke={line} /><path d={`M${27 + i * 79} 30h22m-22 9h22m-22 9h14`} stroke={ink} strokeWidth="2" /><circle className="sv-check" style={{
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
    function LifecycleStory({ mode }) {
      const [frame, setFrame] = useState(0), [play, setPlay] = useState(true), [visible, setVisible] = useState(false), [reduced, setReduced] = useState(false);
      const root = useRef(null);
      const uid = useId().replace(/:/g, "");
      const [pageVisible, setPageVisible] = useState(true);
      const rows = mode ? ai : rpa;
      const current = rows[frame], stage = frame;
      const moving = play && visible && pageVisible && !reduced;
      const signalPosition = [0, 130, 260, 390, 638, 768, 898, 1028][frame] / 1276 * 100;
      useEffect(() => {
        const onVisibility = () => setPageVisible(!document.hidden);
        onVisibility();
        document.addEventListener("visibilitychange", onVisibility);
        const q = matchMedia("(prefers-reduced-motion: reduce)");
        const f = () => setReduced(q.matches);
        f();
        q.addEventListener("change", f);
        const o = new IntersectionObserver((es) => setVisible(es[0].isIntersecting), {
          threshold: 0.15
        });
        if (root.current) o.observe(root.current);
        return () => {
          document.removeEventListener("visibilitychange", onVisibility);
          q.removeEventListener("change", f);
          o.disconnect();
        };
      }, []);
      useEffect(() => {
        if (!moving) return;
        const t = setTimeout(() => setFrame((v) => (v + 1) % 8), 4800);
        return () => clearTimeout(t);
      }, [moving, frame]);
      useEffect(() => setFrame(0), [mode]);
      const jump = (n) => {
        setPlay(false);
        setFrame(n);
      };
      const labels = mode ? ["Identify", "Scope", "Design", "Build", "Evaluate", "Deploy", "Observe", "Improve"] : ["Identify", "Assess", "Design", "Develop", "Test", "Deploy", "Monitor", "Improve"];
      return <div className={`ls-story ${moving ? "ls-running" : ""}`} ref={root}><div className="ls-top"><span><i className="ls-statuslight" /> THE AUTOMATION LIFECYCLE</span><button className="ls-demo ls-quietplay" onClick={() => setPlay((v) => !v)} aria-label={play ? "Pause animation" : "Play animation"}>{play ? "\u2161 Pause" : "\u25B6 Play"}</button></div><div className="ls-heading"><strong>{mode ? "Intelligence. In motion." : "From possibility to progress."}</strong><span>{String(frame + 1).padStart(2, "0")}<small> / 08</small></span></div><div className="ls-canvas"><svg viewBox="0 0 520 370" role="group" aria-label="Interactive eight-stage lifecycle with stage-specific illustrations"><defs><pattern id={`${uid}-dots`} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#9bb0d7" opacity=".48" /></pattern><linearGradient id={`${uid}-node`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6489ec" /><stop offset="1" stopColor="#294eb6" /></linearGradient><linearGradient id={`${uid}-paper`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#f4f7ff" /></linearGradient></defs><rect width="520" height="370" fill={`url(#${uid}-dots)`} /><ellipse cx="260" cy="185" rx="165" ry="100" fill="#dce6ff" opacity=".24" /><path d="M64 55H454V303H64Z" fill="none" stroke="#cfdaef" strokeWidth="1.5" /><path className="ls-signal ls-signal-soft" strokeDashoffset={5 - signalPosition} d="M64 55H454V303H64Z" pathLength="100" fill="none" stroke="#9db9fa" strokeWidth="6" strokeDasharray="5 95" strokeLinecap="round" /><path className="ls-signal" strokeDashoffset={5 - signalPosition} d="M64 55H454V303H64Z" pathLength="100" fill="none" stroke="#5078d8" strokeWidth="2" strokeDasharray="5 95" strokeLinecap="round" /><g transform="translate(117 111)"><rect x="9" y="10" width="268" height="153" rx="17" fill="#c7d6f2" opacity=".35" /><rect x="4" y="5" width="278" height="153" rx="16" fill="#e9effc" stroke="#d4dff2" /><rect className="ls-paper" width="286" height="153" rx="15" fill={`url(#${uid}-paper)`} stroke="#fff" strokeWidth="2" /><g className="ls-scene" key={`${mode}-${stage}`}><text x="18" y="23" fill="#254579" fontFamily="Inter,sans-serif" fontWeight="600" fontSize="12">{current[2]}</text><circle cx="267" cy="19" r="3" fill="#5b81d7" /><StageVisual stage={stage} mode={mode} /><text x="143" y="132" textAnchor="middle" fill="#5d7396" fontFamily="Inter,sans-serif" fontSize="8">{current[3]}</text></g>{rows.map((_, i) => <rect key={i} x={18 + i * 32} y="144" width="26" height="3" rx="1.5" fill={i <= stage ? "#577ed8" : "#e0e7f4"} />)}</g>{locations.map(([x, y], i) => <g key={i} className={`ls-node ${stage === i ? "ls-active" : ""} ${stage > i ? "ls-complete" : ""}`} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-pressed={stage === i} aria-label={`Explore ${labels[i]}`} onClick={() => jump(i)} onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump(i);
        }
      }}>{stage === i && <><rect className="ls-halo" x="-32" y="-32" width="64" height="64" rx="21" fill="none" stroke="#7196ec" /><rect x="-29" y="-29" width="58" height="58" rx="18" fill="#e1eaff" stroke="#b7cbf4" /></>}<rect className="ls-nodeface" x="-24" y="-24" width="48" height="48" rx="15" fill={stage === i ? `url(#${uid}-node)` : "#f9fbff"} /><NodeIcon i={i} /><text y="44" textAnchor="middle">{labels[i]}</text><text className="ls-nodenumber" y="-36" textAnchor="middle">{String(i + 1).padStart(2, "0")}</text>{stage > i && <g transform="translate(23 -22)"><circle r="7" fill="#eef4ff" stroke="#afc3e8" /><path d="m-3 0 2 2 4-4" fill="none" stroke="#5278bd" strokeWidth="1.4" /></g>}</g>)}</svg></div><div className="ls-caption" aria-live={play ? "off" : "polite"}><div><span className="ls-stagepill">{String(stage + 1).padStart(2, "0")}</span><strong>{current[0]}</strong><span className="ls-captionnote">{stage === 7 ? "THE LOOP CONTINUES" : "ONE STEP. REAL PURPOSE."}</span></div><p key={`${mode}-${stage}`}>{current[1]}</p></div><div className="ls-bottom"><span><i /> Illustrative workflow</span><span>{mode ? "AGENTIC AI" : "RPA"} · 8 CONNECTED STAGES</span></div></div>;
    }
    return LifecycleStory;
  })();

  const MatsHomepage = (() => {
        function Icon({
      n = 0,
      size = 24
    }) {
      const paths = [<><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>, <><path d="M4 20V12m8 8V5m8 15V9M2 21h20" /></>, <><rect x="2" y="2" width="7" height="6" rx="1" /><rect x="15" y="16" width="7" height="6" rx="1" /><path d="M5 8v11h10M9 5h10v11" /></>, <><path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18" /></>, <><path d="M8 3h8M10 3v7L3 21h18l-7-11V3M7 16h10" /></>, <><path d="M12 16V2m-5 5 5-5 5 5M3 14v7h18v-7" /></>, <><path d="M2 13h5l3-8 4 15 3-7h5" /></>, <><path d="M20 8A8 8 0 0 0 6 5L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" /></>];
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[n % 8]}</svg>;
    }
    function BrandLogo({
      mode
    }) {
      return <span key={mode} className={`mr-logo-motion ${mode ? "mr-logo-ai" : "mr-logo-rpa"}`} aria-hidden="true"><svg className="mr-logo-symbol" viewBox="0 0 32 32" width="28" height="28" fill="none"><path className="mr-logo-bracket" d="M10 5H5V27H10" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" pathLength="1" /><g className="mr-logo-arrow"><path d="M12 16H27M22 11L27 16L22 21" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" /></g><g className="mr-logo-spark" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M26 3V7M24 5H28" /></g></svg><span className="mr-logo-word">mats<span className="mr-period mr-logo-dot">.</span></span></span>;
    }
    function ModeToggle({ mode, onChange, label }) {
      return <div className="mr-focus-switch" role="group" aria-label={label}><span aria-hidden="true" className={`mr-focus-slider ${mode ? "is-ai" : ""}`} /><button type="button" aria-pressed={mode === 0} onClick={() => onChange(0)}><span aria-hidden="true">⌘</span> RPA</button><button type="button" aria-pressed={mode === 1} onClick={() => onChange(1)}><span aria-hidden="true">✳</span> Agentic AI</button></div>;
    }
    const MatsHomepage = ({
      defaultMode = 0,
      defaultStage = 0,
      onModeChange,
      work,
      page
    } = {}) => {
      const [mode, setMode] = useState(defaultMode), [stage, setStage] = useState(defaultStage), [modal, setModal] = useState(null);
      const cards = (work ? work.cards : normalizeWorkCards(defaultWorkCards())).filter((c) => c.visible);
      const workLoading = !!(work && work.status === "loading");
      const hasWork = workLoading || cards.length > 0;
      const P = page || normalizePage(null);
      const close = useRef(null), trigger = useRef(null);
      const M = P.approach[mode ? "ai" : "rpa"], names = STAGE_NAMES[mode ? "ai" : "rpa"];
      const rows = names.map((n, i) => [n, M.stages[i].title, M.stages[i].text, ...M.stages[i].checks]);
      const dismiss = () => {
        setModal(null);
        trigger.current?.focus();
      };
      // One mode for the whole page: both switches, the logo, the hero, the animation and the method all follow it.
      const changeMode = (next) => {
        if (next === mode) return;
        setMode(next);
        setStage(0);
        if (onModeChange) onModeChange(next);
      };
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
      return <div className="mr-app"><header className="mr-header"><a className="mr-brand" href="#mr-home" aria-label="Mats — home" onClick={(e) => jump(e, "mr-home")}><BrandLogo mode={mode} /></a><nav aria-label="Main navigation">{hasWork && <a href="#mr-work" onClick={(e) => jump(e, "mr-work")}>Work</a>}<a href="#mr-approach" onClick={(e) => jump(e, "mr-approach")}>Approach</a><a href="#mr-about" onClick={(e) => jump(e, "mr-about")}>About</a></nav><a href="#mr-contact" className="mr-headercta" onClick={(e) => jump(e, "mr-contact")}>Let’s talk <span>↗</span></a></header><main id="mr-home"><section className="mr-hero"><div className="mr-herocopy"><div className="mr-hero-focus">{P.hero.focusLabel && <span className="mr-focus-label">{P.hero.focusLabel}</span>}<ModeToggle mode={mode} onChange={changeMode} label="Homepage focus" /></div><div className="mr-kicker"><i /> {P.hero.eyebrow}</div><h1>{mode ? P.hero.line1Ai : P.hero.line1}<br />{P.hero.line2}<br /><em>{P.hero.accent}</em></h1><p>{mode ? P.hero.ledeAi : P.hero.lede}</p><div className="mr-actions">{hasWork && <a className="mr-primary" href="#mr-work" onClick={(e) => jump(e, "mr-work")}>{P.hero.primaryLabel} <span>↘</span></a>}<a className="mr-textlink" href="#mr-contact" onClick={(e) => jump(e, "mr-contact")}>{P.hero.secondaryLabel} <span>↗</span></a></div>{P.hero.note && <div className="mr-heronote"><span>+</span> {P.hero.note}</div>}</div><LifecycleStory mode={mode} /></section><div className="mr-values"><span>{P.hero.valuesLabel}</span>{P.hero.values.filter((v) => v.trim()).map((v, i) => <React.Fragment key={i}>{i > 0 && <b>✳</b>}<span>{v}</span></React.Fragment>)}</div>{hasWork && <WorkSection cards={cards} loading={workLoading} copy={P.work} onOpen={(e, card) => show(e, { type: "case", id: card.id })} />}<section id="mr-approach" className="mr-approach"><div className="mr-sectionhead"><div><div className="mr-kicker">02 / HOW I WORK</div><h2>{P.approach.headingA}<br /><em>{P.approach.headingAccent}</em></h2></div><div className="mr-approachintro"><p>{P.approach.intro}<br />Explore the method behind {M.behind}.</p><ModeToggle mode={mode} onChange={changeMode} label="How I work focus" /></div></div><div className="mr-stagebuttons" aria-label="Choose a lifecycle stage">{rows.map((r, i) => <button key={i} aria-pressed={stage === i} onClick={() => setStage(i)} className={stage === i ? "active" : ""}><small>0{i + 1}</small><span>{r[0]}</span></button>)}</div><div className="mr-stagecontent" key={`${mode}-${stage}`}><div className="mr-stagenumber">0{stage + 1}<span>/ 08</span><Icon n={stage} size={44} /></div><div className="mr-stagetext"><span className="mr-kicker">{rows[stage][0].toUpperCase()}</span><h3>{rows[stage][1]}</h3><p>{rows[stage][2]}</p><div className="mr-stagechecks">{rows[stage].slice(3).map((s) => <span key={s}><b>✓</b>{s}</span>)}</div></div><div className="mr-stageaside"><span className="mr-kicker">THE PRINCIPLE</span><p>{M.principle}</p><div><button aria-label="Previous stage" onClick={() => setStage((stage + 7) % 8)}>←</button><button aria-label="Next stage" onClick={() => setStage((stage + 1) % 8)}>→</button></div></div></div>{P.approach.loopNote && <div className="mr-loopnote">↻ <span>{P.approach.loopNote}</span></div>}</section><section className="mr-about" id="mr-about"><div className="mr-aboutart" aria-hidden="true"><span className="mr-aboutmonogram">m<span>.</span></span><div className="mr-aboutartbottom"><span>{P.about.captionLeft}</span><span>{P.about.captionRight}</span></div><i className="mr-orbit one" /><i className="mr-orbit two" /><i className="mr-orbit three" /></div><div className="mr-aboutcopy"><div className="mr-kicker">03 / THE PERSON BEHIND THE PROCESS</div><h2>{P.about.headingA}<br /><em>{P.about.headingAccent}</em></h2>{P.about.paragraphs.map((t, i) => <p key={i}>{t}</p>)}{P.about.quote && <div className="mr-personalnote"><span>“</span>{P.about.quote}</div>}</div></section><section className="mr-contact" id="mr-contact"><div className="mr-kicker">START WITH THE PROBLEM</div><div><h2>{P.contact.headingA}<br />{P.contact.headingB}</h2><button className="mr-contactbutton" onClick={(e) => show(e, { type: "contact" })}>{P.contact.button} <span>↗</span></button></div>{P.contact.sub && <p>{P.contact.sub}</p>}</section></main><footer className="mr-footer"><a href="#mr-home" className="mr-brand" aria-label="Mats — home" onClick={(e) => jump(e, "mr-home")}><BrandLogo mode={mode} /></a><span>{P.footer.tagline}</span><a href="#mr-home" onClick={(e) => jump(e, "mr-home")}>Back to top ↑</a></footer>{modal && modal.type === "contact" && <ModalShell kicker={P.contact.dialogKicker} title={P.contact.dialogTitle} onDismiss={dismiss} closeRef={close}>{P.contact.dialogIntro && <p>{P.contact.dialogIntro}</p>}{P.contact.questions.length > 0 && <ol>{P.contact.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>}{P.contact.linkUrl ? <a className="mr-primary mr-modalcta mr-modallink" href={P.contact.linkUrl} {...(/^https?:/i.test(P.contact.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{P.contact.linkLabel} <span>→</span></a> : <div className="mr-previewnotice">Contact details haven’t been added yet.</div>}</ModalShell>}{modal && modal.type === "case" && (() => {
        const card = cards.find((c) => c.id === modal.id);
        return card ? <ModalShell kicker={card.content.illustrative ? "ILLUSTRATIVE CASE STUDY" : "CASE STUDY"} title={card.content.title} onDismiss={dismiss} closeRef={close}><CaseStudyBody card={card} /></ModalShell> : null;
      })()}</div>;
    };
    return MatsHomepage;
  })();

  return MatsHomepage;
})();

// The "/" route.
function HomeRoute() {
  const [mode, setMode] = useMode();
  const work = usePublishedWork();
  useEffect(() => {
    document.body.classList.add("mr-body");
    return () => document.body.classList.remove("mr-body");
  }, []);
  // Wait for the published content (a moment on a first visit, instant on repeat visits) so visitors never see
  // the built-in text flash before the real text.
  if (work.status === "loading") return <><style>{MR_CSS}</style><div className="mr-app" /></>;
  return (
    <>
      <style>{MR_CSS}</style>
      <MatsHomepage defaultMode={mode === "ai" ? 1 : 0} onModeChange={(n) => setMode(n ? "ai" : "rpa")} work={work} page={work.page} />
    </>
  );
}

// =====================================================================================
// SELECTED WORK EDITOR (/admin → "Selected work")
// A template-based editor: pick a card, edit its Content, dress it on the Appearance tab,
// and watch the real homepage section update in a live preview (desktop or mobile width).
//
// How changes persist
//   draft      → this browser's localStorage, saved automatically; only you see it.
//   publish    → one click writes the cards to Firestore (siteContent/work, plus one
//                siteContent/workimg-<id> document per uploaded image). Everyone who loads
//                the homepage afterwards sees the new cards; open pages update live.
//   Publishing needs write access. If your Firestore rules require sign-in, use "Sign in"
//   (Firebase Auth, email + password) at the top right.
// =====================================================================================

const jsonClone = (v) => JSON.parse(JSON.stringify(v));
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16) + s.length.toString(16); };
const fmtTime = (ms) => new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Shrinks an uploaded picture so it fits a Firestore document: JPEG, longest side ≤ 1400 px,
// quality lowered step by step until the data URL is under WORK_IMAGE_MAX_CHARS.
async function compressWorkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPG, PNG or WebP picture. (iPhone HEIC photos need converting first.)");
  if (file.size > 12 * 1024 * 1024) throw new Error("That file is over 12 MB — pick a smaller one.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That file couldn't be read as a picture.")); i.src = url; });
    for (const [maxW, q] of [[1400, 0.82], [1400, 0.72], [1200, 0.66], [1000, 0.6], [800, 0.55]]) {
      const k = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL("image/jpeg", q);
      if (data.length <= WORK_IMAGE_MAX_CHARS) return { data, width: c.width, height: c.height };
    }
    throw new Error("Couldn't shrink that picture enough — try a simpler or smaller one.");
  } finally { URL.revokeObjectURL(url); }
}

function useWorkAuth() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  useEffect(() => getWorkStore().auth.watch(setUser), []);
  return user;
}

// ---- small form pieces -------------------------------------------------------------
function LimitedField({ label, value, onChange, max, multiline, rows = 3, help, error, id }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label className="we-field">
      <span className="we-fl"><span>{label}</span><span className={`we-count${value.length >= max ? " full" : ""}`}>{value.length}/{max}</span></span>
      <Tag id={id} value={value} maxLength={max} rows={multiline ? rows : undefined} onChange={(e) => onChange(e.target.value)} />
      {help && <span className="we-help">{help}</span>}
      {error && <span className="we-error">{error}</span>}
    </label>
  );
}

function HexField({ label, value, onCommit }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="we-hex">
      <span className="we-fl"><span>{label}</span></span>
      <div className="we-hexrow">
        <input type="color" value={value} aria-label={`${label} colour picker`} onChange={(e) => onCommit(e.target.value.toUpperCase())} />
        <input type="text" value={text} aria-label={`${label} hex value`} maxLength={7} spellCheck={false}
          onChange={(e) => { const v = e.target.value.trim(); setText(v); if (isHex6(v)) onCommit(v.toUpperCase()); }}
          onBlur={() => setText(value)} />
      </div>
    </div>
  );
}

function TemplateThumb({ template }) {
  const card = normalizeWorkCard({ id: "thumb", content: { title: "x", illustrative: false }, appearance: { template: template === "image" ? "workflow" : template } }, 0);
  return (
    <div className="mr-app we-thumb" aria-hidden="true">
      {template === "image"
        ? <div className="we-thumb-img"><svg viewBox="0 0 48 32" width="64" height="42"><rect x="1" y="1" width="46" height="30" rx="3" fill="none" stroke="#7994CA" strokeWidth="1.5" /><circle cx="14" cy="11" r="3.5" fill="#7994CA" /><path d="M3 28l12-10 8 6 8-9 14 13" fill="none" stroke="#7994CA" strokeWidth="1.5" strokeLinejoin="round" /></svg></div>
        : <div className="we-thumb-in"><WorkArt card={card} /></div>}
    </div>
  );
}

// ---- the live preview: the real homepage section inside an iframe of the chosen width -----
function PreviewFrame({ width, children, fixedHeight, onDoc }) {
  const hostRef = useRef(null);
  const [doc, setDoc] = useState(null), [height, setHeight] = useState(380), [scale, setScale] = useState(1);
  useEffect(() => {
    const el = hostRef.current; if (!el) return;
    const fit = () => setScale(Math.min(1, Math.max(0.2, el.clientWidth / width)));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  useEffect(() => {
    if (!doc || fixedHeight) return;
    const measure = () => setHeight(Math.max(260, Math.ceil(doc.documentElement.scrollHeight)));
    measure();
    const ro = new doc.defaultView.ResizeObserver(measure); ro.observe(doc.body);
    return () => ro.disconnect();
  }, [doc, fixedHeight]);
  return (
    <div className="we-framehost" ref={hostRef}><div className="we-frame-wrap" style={{ width: width * scale, height: (fixedHeight || height) * scale }}>
      <iframe title="Live preview of the Selected work section" className="we-frame"
        srcDoc={'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f8f7f3"></body></html>'}
        onLoad={(e) => { setDoc(e.target.contentDocument); if (onDoc) onDoc(e.target.contentDocument); }}
        style={{ width, height: fixedHeight || height, transform: `scale(${scale})` }} />
      {doc && createPortal(<><style>{MR_CSS}</style>{children}</>, doc.body)}
    </div></div>
  );
}

function WorkPreview({ cards, images, selectedId, onSelect, device, dialogOpen, setDialogOpen, copy }) {
  const closeRef = useRef(null);
  const shown = cards.filter((c) => c.visible), sel = cards.find((c) => c.id === selectedId);
  return (
    <PreviewFrame width={device === "mobile" ? 390 : 1100}>
      <div className="mr-app" style={{ minHeight: 0 }}>
        <main>
          {shown.length
            ? <WorkSection cards={shown} localImages={images} selectedId={selectedId} copy={copy} onOpen={(e, card) => { onSelect(card.id); setDialogOpen(true); }} />
            : <div style={{ padding: "70px 24px", textAlign: "center", fontSize: 13, color: "#586477" }}>No visible cards — the whole “Selected work” section (and its menu link) is hidden on the homepage.</div>}
        </main>
        {dialogOpen && sel && sel.visible && (
          <ModalShell kicker={sel.content.illustrative ? "ILLUSTRATIVE CASE STUDY" : "CASE STUDY"} title={sel.content.title} onDismiss={() => setDialogOpen(false)} closeRef={closeRef}>
            <CaseStudyBody card={sel} />
          </ModalShell>
        )}
      </div>
    </PreviewFrame>
  );
}

// ---- content tab -------------------------------------------------------------------
function WorkContentForm({ card, onChange }) {
  const c = card.content;
  const setC = (patch) => onChange((x) => ({ ...x, content: { ...x.content, ...patch } }));
  const setSection = (i, patch) => setC({ sections: c.sections.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const moveSection = (i, d) => { const a = c.sections.slice(), j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setC({ sections: a }); };
  const urlBad = c.link.url && !safeHttpUrl(c.link.url);
  return (
    <div className="we-stack">
      <label className="we-switch"><input type="checkbox" checked={card.visible} onChange={(e) => onChange((x) => ({ ...x, visible: e.target.checked }))} /><span>Show this card on the homepage</span></label>
      <LimitedField label="Category" value={c.category} max={WORK_LIMITS.category} onChange={(v) => setC({ category: v })} help="Small label above the title, e.g. RPA · SYSTEM INTEGRATION." />
      <LimitedField label="Title" value={c.title} max={WORK_LIMITS.title} onChange={(v) => setC({ title: v })} error={!c.title.trim() ? "A title is required." : null} />
      <LimitedField label="Description" value={c.description} max={WORK_LIMITS.description} multiline rows={3} onChange={(v) => setC({ description: v })} />
      <LimitedField label="Card link text" value={c.linkLabel} max={WORK_LIMITS.linkLabel} onChange={(v) => setC({ linkLabel: v })} help="The call to action at the bottom of the card. Clicking a card opens its case study." />
      <label className="we-switch"><input type="checkbox" checked={c.illustrative} onChange={(e) => setC({ illustrative: e.target.checked })} /><span>Illustrative example</span></label>
      <p className="we-help">On: the card and its case study are labelled “illustrative” and the section shows a disclaimer. Turn it off only for real, verified work.</p>

      <div className="we-group">
        <div className="we-grouphead"><strong>Case study</strong><span>Shown when a visitor opens the card · up to {WORK_LIMITS.maxSections} sections</span></div>
        {c.sections.map((s, i) => (
          <div className="we-section" key={i}>
            <LimitedField label={`Section ${i + 1} heading`} value={s.heading} max={WORK_LIMITS.heading} onChange={(v) => setSection(i, { heading: v })} />
            <LimitedField label="Text" value={s.body} max={WORK_LIMITS.body} multiline rows={3} onChange={(v) => setSection(i, { body: v })} />
            <div className="we-row">
              <button type="button" className="we-mini" disabled={i === 0} onClick={() => moveSection(i, -1)}>↑ Up</button>
              <button type="button" className="we-mini" disabled={i === c.sections.length - 1} onClick={() => moveSection(i, 1)}>↓ Down</button>
              <button type="button" className="we-mini danger" onClick={() => setC({ sections: c.sections.filter((_, k) => k !== i) })}>Remove</button>
            </div>
          </div>
        ))}
        {c.sections.length < WORK_LIMITS.maxSections && <button type="button" className="we-btn" onClick={() => setC({ sections: [...c.sections, { heading: "", body: "" }] })}>+ Add section</button>}
      </div>

      <div className="we-group">
        <div className="we-grouphead"><strong>External link</strong><span>Optional — a button inside the case study</span></div>
        <LimitedField label="Link text" value={c.link.label} max={WORK_LIMITS.linkLabel} onChange={(v) => setC({ link: { ...c.link, label: v } })} />
        <LimitedField label="Web address" value={c.link.url} max={WORK_LIMITS.url} onChange={(v) => setC({ link: { ...c.link, url: v } })} help="Must start with https://" error={urlBad ? "That isn't a valid https:// address, so it won't be published." : null} />
      </div>
    </div>
  );
}

// ---- appearance tab ----------------------------------------------------------------
function WorkAppearanceForm({ card, onChange, images, onUpload, onRemoveImage, uploadState }) {
  const ap = card.appearance, tpl = WORK_TEMPLATES[ap.template], im = ap.image, L = workLabels(card);
  const cropSrc = useWorkImageSrc(card, images);
  const setAp = (patch) => onChange((x) => ({ ...x, appearance: { ...x.appearance, ...patch } }));
  const setLabel = (key, v) => setAp({ labels: { ...ap.labels, [ap.template]: { ...(ap.labels[ap.template] || {}), [key]: v } } });
  const setImage = (patch) => setAp({ image: { ...im, ...patch } });
  const pickTemplate = (t) => {
    if (t === ap.template) return;
    const old = WORK_TEMPLATES[ap.template].colors, untouched = sameHex(ap.accent, old.accent) && sameHex(ap.background, old.background);
    setAp({ template: t, ...(untouched ? { accent: WORK_TEMPLATES[t].colors.accent, background: WORK_TEMPLATES[t].colors.background } : {}) });
  };
  const warnings = workContrastWarnings(ap);
  const isDefaultLook = !workArtVars(ap);
  return (
    <div className="we-stack">
      <div className="we-group">
        <div className="we-grouphead"><strong>Template</strong><span>The artwork shown at the top of the card</span></div>
        <div className="we-templates" role="radiogroup" aria-label="Template">
          {WORK_TEMPLATE_ORDER.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={ap.template === t} className={`we-template${ap.template === t ? " on" : ""}`} onClick={() => pickTemplate(t)}>
              <TemplateThumb template={t} /><span className="we-tname">{WORK_TEMPLATES[t].name}</span><span className="we-thint">{WORK_TEMPLATES[t].hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="we-group">
        <div className="we-grouphead"><strong>Colours</strong><span>{isDefaultLook ? "Using this template's original colours" : "Custom colours"}</span></div>
        <div className="we-swatches">
          {WORK_PALETTES.map((p) => (
            <button type="button" key={p.name} className={`we-swatch${sameHex(p.accent, ap.accent) && sameHex(p.background, ap.background) ? " on" : ""}`} title={p.name} aria-label={`${p.name} palette`}
              style={{ background: `linear-gradient(135deg, ${p.background} 50%, ${p.accent} 50%)` }} onClick={() => setAp({ accent: p.accent, background: p.background })} />
          ))}
        </div>
        <div className="we-two">
          <HexField label="Accent" value={ap.accent} onCommit={(v) => setAp({ accent: v })} />
          <HexField label="Background" value={ap.background} onCommit={(v) => setAp({ background: v })} />
        </div>
        <div className="we-row"><button type="button" className="we-mini" onClick={() => setAp({ accent: tpl.colors.accent, background: tpl.colors.background })}>Reset colours</button></div>
        {warnings.map((w, i) => <p className="we-warn" key={i}>⚠ {w}</p>)}
      </div>

      {ap.template !== "image" && (
        <div className="we-group">
          <div className="we-grouphead"><strong>Illustration text</strong><span>Only the words — layout and type size stay fixed</span></div>
          {tpl.labels.map((f) => (
            <LimitedField key={f.key} label={f.name} value={L[f.key]} max={f.max} multiline={f.multiline} rows={2} onChange={(v) => setLabel(f.key, v)} />
          ))}
          <div className="we-row"><button type="button" className="we-mini" onClick={() => setAp({ labels: { ...ap.labels, [ap.template]: {} } })}>Reset text to the template's wording</button></div>
        </div>
      )}

      {ap.template === "image" && (
        <div className="we-group">
          <div className="we-grouphead"><strong>Image</strong><span>Cropped to a wide frame on the card</span></div>
          <LimitedField label="Top label (optional)" value={L.flow} max={44} onChange={(v) => setLabel("flow", v)} />
          <div className="we-two">
            <div>
              <span className="we-fl"><span>Upload a picture</span></span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onUpload(f); e.target.value = ""; }} />
              {uploadState && <span className={uploadState.kind === "error" ? "we-error" : "we-help"}>{uploadState.text}</span>}
            </div>
            <LimitedField label="…or a web address" value={im.kind === "url" ? im.url : ""} max={WORK_LIMITS.url} onChange={(v) => setImage({ kind: v ? "url" : "none", url: v, ref: "", hash: "" })}
              help="https://… or a file in your site's public folder, e.g. images/project.jpg" error={im.kind === "url" && im.url && !safeImageUrl(im.url) ? "Not a valid image address." : null} />
          </div>
          {im.kind === "upload" && <p className="we-help">Uploaded picture · {Math.round(((images[card.id] || "").length * 0.75) / 1024) || "stored"}{images[card.id] ? " KB" : " (published)"} · <button type="button" className="we-link" onClick={onRemoveImage}>Remove picture</button></p>}
          <LimitedField label="Description for screen readers" value={im.alt} max={WORK_LIMITS.alt} onChange={(v) => setImage({ alt: v })} help="Leave empty to use the card title." />
          <div className="we-crop-wrap">
            <span className="we-fl"><span>Crop</span></span>
            <div className="mr-app we-crop"><div className="mr-projectart mr-art-image" style={{ minHeight: 0, height: 128 }}><ArtImage src={cropSrc} image={im} title={card.content.title} /></div></div>
            <label className="we-range"><span>Zoom {Math.round(im.zoom * 100)}%</span><input type="range" min="1" max="3" step="0.05" value={im.zoom} onChange={(e) => setImage({ zoom: Number(e.target.value) })} /></label>
            <label className="we-range"><span>Focus: left ↔ right</span><input type="range" min="0" max="100" value={im.x} onChange={(e) => setImage({ x: Number(e.target.value) })} /></label>
            <label className="we-range"><span>Focus: top ↔ bottom</span><input type="range" min="0" max="100" value={im.y} onChange={(e) => setImage({ y: Number(e.target.value) })} /></label>
            <div className="we-row"><button type="button" className="we-mini" onClick={() => setImage({ zoom: 1, x: 50, y: 50 })}>Reset crop</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- the editor ------------------------------------------------------------------
function SiteEditor({ user, askSignIn }) {
  const store = getWorkStore();
  const [pub, setPub] = useState({ ready: false, cards: [], page: normalizePage(null), updatedAt: null, hasDoc: false, error: null });
  const [draft, setDraft] = useState(null); // { cards, images: {cardId: dataURL}, baseUpdatedAt }
  const [section, setSection] = useState(() => { try { const v = localStorage.getItem("site-admin-section"); return SECTIONS.some((x) => x.id === v) ? v : "hero"; } catch { return "hero"; } });
  useEffect(() => { try { localStorage.setItem("site-admin-section", section); } catch {} }, [section]);
  const [selId, setSelId] = useState(null), [tab, setTab] = useState("content"), [device, setDevice] = useState("desktop");
  const [dialogOpen, setDialogOpen] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null);
  const [savedAt, setSavedAt] = useState(null), [uploadState, setUploadState] = useState(null), [unauth, setUnauth] = useState(false), [addOpen, setAddOpen] = useState(false);

  // published copy (live)
  useEffect(() => {
    const t = setTimeout(() => setPub((p) => (p.ready ? p : { ready: true, cards: normalizeWorkCards(defaultWorkCards()), page: normalizePage(null), updatedAt: null, hasDoc: false, error: "Couldn't reach Firebase — showing the built-in content. You can still edit a draft." })), 4000);
    const off = store.subscribe(
      (doc) => setPub({ ready: true, cards: doc && Array.isArray(doc.cards) ? normalizeWorkCards(doc.cards) : normalizeWorkCards(defaultWorkCards()), page: normalizePage(doc && doc.page), updatedAt: doc ? doc.updatedAt || 0 : null, hasDoc: !!doc, error: null }),
      (err) => setPub((p) => ({ ...p, ready: true, cards: p.ready ? p.cards : normalizeWorkCards(defaultWorkCards()), page: p.ready ? p.page : normalizePage(null), error: "Couldn't read the published content: " + String((err && err.message) || err) }))
    );
    return () => { clearTimeout(t); off(); };
  }, []);

  // first draft: a saved local draft if there is one, otherwise the published cards
  useEffect(() => {
    if (!pub.ready || draft) return;
    const saved = readJsonLS(WORK_DRAFT_KEY);
    const d = saved && Array.isArray(saved.cards) ? { cards: normalizeWorkCards(saved.cards, { keepEmpty: true }), images: saved.images && typeof saved.images === "object" ? saved.images : {}, baseUpdatedAt: saved.baseUpdatedAt ?? null }
      : { cards: jsonClone(pub.cards), images: {}, baseUpdatedAt: pub.updatedAt };
    const sp = saved && saved.page && typeof saved.page === "object" ? saved.page : null, np = normalizePage(sp || pub.page);
    if (sp && sp.contact && typeof sp.contact.linkUrl === "string") np.contact.linkUrl = sp.contact.linkUrl;
    d.page = np;
    setDraft(d);
    setSelId(d.cards[0] ? d.cards[0].id : null);
  }, [pub.ready]);

  const dirty = !!draft && pub.ready && (workKey(draft.cards) !== workKey(pub.cards) || pageKey(draft.page) !== pageKey(pub.page));
  const conflict = dirty && draft.baseUpdatedAt !== pub.updatedAt;

  // autosave the draft in this browser
  useEffect(() => {
    if (!draft || !pub.ready) return;
    const t = setTimeout(() => {
      if (!dirty) { removeLS(WORK_DRAFT_KEY); setSavedAt(null); return; }
      const ok = writeJsonLS(WORK_DRAFT_KEY, { v: 1, savedAt: Date.now(), baseUpdatedAt: draft.baseUpdatedAt, cards: draft.cards, images: draft.images, page: draft.page });
      if (ok) setSavedAt(Date.now()); else setMsg({ kind: "error", text: "This browser's storage is full, so the draft can't be kept across a refresh. Publish now or remove a picture." });
    }, 350);
    return () => clearTimeout(t);
  }, [draft, dirty, pub.ready]);

  // an error message belongs to the state that caused it: editing clears it; signing in clears the "open rules" warning
  useEffect(() => { setMsg((m) => (m && m.kind === "error" ? null : m)); }, [draft && draft.cards]);
  useEffect(() => { if (user) setUnauth(false); }, [user]);

  if (!draft) return <div className="we-loading">Loading cards…</div>;

  const cards = draft.cards, heading = selId === "__heading";
  const card = heading ? null : (cards.find((c) => c.id === selId) || cards[0] || null), idx = card ? cards.findIndex((c) => c.id === card.id) : -1;
  const setPage = (fn) => setDraft((d) => ({ ...d, page: fn(jsonClone(d.page)) }));
  const previewCards = normalizeWorkCards(cards);
  const mutate = (fn) => setDraft((d) => ({ ...d, cards: fn(d.cards) }));
  const updateCard = (id, fn) => mutate((cs) => cs.map((c) => (c.id === id ? fn(jsonClone(c)) : c)));
  const move = (id, dir) => mutate((cs) => { const a = cs.slice(), i = a.findIndex((c) => c.id === id), j = i + dir; if (j < 0 || j >= a.length) return cs; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const addCard = (template) => { const c = newWorkCard(template); mutate((cs) => (cs.length >= WORK_LIMITS.maxCards ? cs : [...cs, c])); setSelId(c.id); setTab("content"); setAddOpen(false); };
  const duplicate = (c) => { const copy = jsonClone(c); copy.id = "card-" + Math.random().toString(36).slice(2, 8); copy.visible = false; copy.content.title = (copy.content.title + " (copy)").slice(0, WORK_LIMITS.title); copy.appearance.image = emptyWorkImage(); mutate((cs) => { const a = cs.slice(); a.splice(cs.findIndex((x) => x.id === c.id) + 1, 0, copy); return a; }); setSelId(copy.id); };
  const remove = (c) => { if (!window.confirm(`Delete “${c.content.title || "this card"}”? It stays on the live site until you publish.`)) return; mutate((cs) => cs.filter((x) => x.id !== c.id)); setDraft((d) => { const im = { ...d.images }; delete im[c.id]; return { ...d, images: im }; }); setSelId(null); };
  const resetCard = (c) => {
    const def = defaultWorkCards().find((d) => d.id === c.id);
    if (def) { if (!window.confirm("Reset this card's content and appearance to the original?")) return; updateCard(c.id, () => def); }
    else { if (!window.confirm("Reset this card's appearance to its template defaults?")) return; updateCard(c.id, (x) => { const t = WORK_TEMPLATES[x.appearance.template]; x.appearance = { template: x.appearance.template, accent: t.colors.accent, background: t.colors.background, labels: {}, image: emptyWorkImage() }; return x; }); }
  };
  const restoreAll = () => { if (!window.confirm("Replace ALL cards in your draft with the two original ones?")) return; setDraft((d) => ({ ...d, cards: defaultWorkCards(), images: {} })); setSelId(defaultWorkCards()[0].id); };
  const discard = () => { if (!window.confirm("Discard your draft and go back to what is published?")) return; setDraft({ cards: jsonClone(pub.cards), images: {}, page: jsonClone(pub.page), baseUpdatedAt: pub.updatedAt }); removeLS(WORK_DRAFT_KEY); setSavedAt(null); setMsg(null); setSelId(pub.cards[0] ? pub.cards[0].id : null); };

  const onUpload = async (file) => {
    if (!card) return;
    setUploadState({ kind: "info", text: "Shrinking picture…" });
    try {
      const { data, width, height } = await compressWorkImage(file);
      const hash = hashStr(data), id = card.id;
      setDraft((d) => ({ ...d, images: { ...d.images, [id]: data } }));
      updateCard(id, (x) => { x.appearance.image = { ...x.appearance.image, kind: "upload", url: "", ref: "workimg-" + id, hash, zoom: 1, x: 50, y: 50 }; return x; });
      setUploadState({ kind: "info", text: `Ready · ${width}×${height}px · ${Math.round(data.length * 0.75 / 1024)} KB` });
    } catch (e) { setUploadState({ kind: "error", text: e.message }); }
  };
  const onRemoveImage = () => { if (!card) return; updateCard(card.id, (x) => { x.appearance.image = { ...emptyWorkImage(), alt: x.appearance.image.alt }; return x; }); setDraft((d) => { const im = { ...d.images }; delete im[card.id]; return { ...d, images: im }; }); setUploadState(null); };

  const publish = async () => {
    if (busy) return;
    const list = normalizeWorkCards(cards);
    const bad = list.map((c) => ({ c, v: validateWorkCard(c) })).filter((x) => x.v.errors.length);
    if (bad.length) { setMsg({ kind: "error", text: "Fix before publishing — " + bad.map((b) => `“${b.c.content.title || b.c.id}”: ${b.v.errors[0]}`).join(" · ") }); setSelId(bad[0].c.id); setSection("work"); return; }
    const pv = validatePage(draft.page);
    if (pv.errors.length) { setMsg({ kind: "error", text: "Fix before publishing — " + pv.errors[0].text }); setSection(pv.errors[0].section); return; }
    const isUp = (c) => c.appearance.template === "image" && c.appearance.image.kind === "upload";
    const images = {};
    for (const c of list.filter(isUp)) {
      const im = c.appearance.image, prev = pub.cards.find((p) => p.id === c.id);
      const same = prev && isUp(prev) && prev.appearance.image.hash === im.hash && prev.appearance.image.ref === im.ref;
      if (same) continue;
      if (!draft.images[c.id]) { setMsg({ kind: "error", text: `The picture for “${c.content.title}” isn't in this browser any more — upload it again.` }); setSelId(c.id); return; }
      images[im.ref] = { data: draft.images[c.id], hash: im.hash };
    }
    const keep = new Set(list.filter(isUp).map((c) => c.appearance.image.ref));
    const removeRefs = pub.cards.filter(isUp).map((p) => p.appearance.image.ref).filter((r) => !keep.has(r));
    setBusy(true); setMsg(null);
    try {
      const { updatedAt } = await store.publish({ cards: list, page: normalizePage(draft.page), images, removeRefs });
      setPub({ ready: true, cards: list, page: normalizePage(draft.page), updatedAt, hasDoc: true, error: null });
      setDraft((d) => ({ ...d, baseUpdatedAt: updatedAt }));
      removeLS(WORK_DRAFT_KEY); writeJsonLS(WORK_CACHE_KEY, { updatedAt, cards: list, page: normalizePage(draft.page) }); setSavedAt(null);
      setUnauth(user === null);
      setMsg({ kind: "ok", text: "Published. Visitors see the changes now; pages that are already open update by themselves." });
    } catch (e) {
      const code = e && e.code, text = String((e && e.message) || e);
      if (code === "permission-denied") { setMsg({ kind: "error", help: true, text: "Firebase refused the write. Sign in (top right) — your Firestore rules require it — then publish again. Your draft is safe." }); askSignIn(); }
      else if (code === "firebase-disabled") setMsg({ kind: "error", text: text + " Your draft is safe." });
      else if (text === "timeout") setMsg({ kind: "error", text: "No answer from Firebase within 25 seconds. Your draft is safe. If your connection returns, the publish may still complete — check the status before retrying." });
      else setMsg({ kind: "error", text: "Publishing failed: " + text + " Your draft is safe." });
    } finally { setBusy(false); }
  };

  const validations = card ? validateWorkCard(normalizeWorkCard(card, idx)) : { errors: [], warnings: [] };
  return (
    <div className="we">
      <div className="we-bar">
        <div className="we-state">
          {!pub.ready ? <span className="we-chip">Loading…</span> : dirty ? <span className="we-chip draft">● Unpublished changes</span> : <span className="we-chip ok">✓ Everything is published</span>}
          <span className="we-meta">
            {dirty ? (savedAt ? `Draft saved in this browser ${fmtTime(savedAt)} — only you can see it` : "Saving draft in this browser…") : pub.updatedAt ? `Last published ${fmtTime(pub.updatedAt)}` : pub.hasDoc ? "" : "Nothing published yet — visitors see the original content"}
          </span>
        </div>
        <div className="we-actions">
          <button type="button" className="we-btn" onClick={() => { if (!writeJsonLS(WORK_DRAFT_KEY, { v: 1, savedAt: Date.now(), baseUpdatedAt: draft.baseUpdatedAt, cards: draft.cards, images: draft.images, page: draft.page })) setMsg({ kind: "error", text: "This browser's storage is full — the draft couldn't be saved." }); else { setSavedAt(Date.now()); setMsg({ kind: "ok", text: "Draft saved in this browser." }); } }} disabled={!dirty}>Save draft</button>
          <button type="button" className="we-btn" onClick={discard} disabled={!dirty}>Discard changes</button>
          <button type="button" className="we-btn primary" onClick={publish} disabled={!dirty || busy || !pub.ready}>{busy ? "Publishing…" : "Publish"}</button>
        </div>
      </div>
      {pub.error && <div className="we-note warn">{pub.error}</div>}
      {conflict && <div className="we-note warn">The published page changed after you started this draft (published {pub.updatedAt ? fmtTime(pub.updatedAt) : "elsewhere"}). Publishing will replace them with your draft. Use “Discard changes” to start from the published version instead.</div>}
      {unauth && <div className="we-note warn">That publish worked without signing in, which means anyone who knows your Firebase settings can publish to your site.<SecuringHelp /></div>}
      {msg && <div className={`we-note ${msg.kind}`} role="status">{msg.text}{msg.help && <SecuringHelp />}</div>}

      <nav className="we-sections" aria-label="Page sections">
        {SECTIONS.map((x) => <button type="button" key={x.id} className={section === x.id ? "on" : ""} aria-current={section === x.id ? "page" : undefined} onClick={() => { setSection(x.id); setDialogOpen(false); }}>{x.label}</button>)}
      </nav>

      {section === "work" ? (
      <div className="we-grid">
        <aside className="we-list" aria-label="Cards">
          <button type="button" className={`we-headitem${heading ? " on" : ""}`} onClick={() => { setSelId("__heading"); setDialogOpen(false); }}>Section heading &amp; intro</button>
          <div className="we-listhead"><strong>Cards</strong><span>{cards.length}/{WORK_LIMITS.maxCards}</span></div>
          {cards.map((c, i) => (
            <button type="button" key={c.id} className={`we-item${card && c.id === card.id ? " on" : ""}${c.visible ? "" : " hidden"}`} onClick={() => { setSelId(c.id); setDialogOpen(false); }}>
              <span className="we-itemtop"><span className="we-order">{i + 1}</span><span className="we-itemtitle">{c.content.title || "Untitled"}</span></span>
              <span className="we-itemmeta">{WORK_TEMPLATES[c.appearance.template].name}{c.visible ? "" : " · hidden"}</span>
            </button>
          ))}
          {!cards.length && <p className="we-help">No cards. The Selected work section is hidden on the homepage.</p>}
          <div className="we-addwrap">
            <button type="button" className="we-btn" aria-expanded={addOpen} onClick={() => setAddOpen((o) => !o)} disabled={cards.length >= WORK_LIMITS.maxCards}>+ Add card</button>
            {addOpen && <div className="we-menu" role="menu">{WORK_TEMPLATE_ORDER.map((t) => <button type="button" role="menuitem" key={t} onClick={() => addCard(t)}>{WORK_TEMPLATES[t].name}</button>)}</div>}
          </div>
          <button type="button" className="we-link" onClick={restoreAll}>Restore the original cards</button>
        </aside>

        <section className="we-form" aria-label="Edit card">
          {heading ? <WorkHeadingForm page={draft.page} setPage={setPage} /> : card ? (
            <>
              <div className="we-formhead">
                <h3>{card.content.title || "Untitled"}</h3>
                <div className="we-row">
                  <button type="button" className="we-mini" disabled={idx <= 0} onClick={() => move(card.id, -1)} aria-label="Move card up">↑ Up</button>
                  <button type="button" className="we-mini" disabled={idx >= cards.length - 1} onClick={() => move(card.id, 1)} aria-label="Move card down">↓ Down</button>
                  <button type="button" className="we-mini" onClick={() => duplicate(card)}>Duplicate</button>
                  <button type="button" className="we-mini" onClick={() => resetCard(card)}>Reset</button>
                  <button type="button" className="we-mini danger" onClick={() => remove(card)}>Delete</button>
                </div>
              </div>
              <div className="we-tabs" role="tablist">
                {["content", "appearance"].map((t) => <button type="button" role="tab" aria-selected={tab === t} key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "content" ? "Content" : "Appearance"}</button>)}
              </div>
              {validations.errors.map((e, i) => <p className="we-error" key={i}>✕ {e}</p>)}
              {tab === "content"
                ? <WorkContentForm card={card} onChange={(fn) => updateCard(card.id, fn)} />
                : <WorkAppearanceForm card={card} images={draft.images} onChange={(fn) => updateCard(card.id, fn)} onUpload={onUpload} onRemoveImage={onRemoveImage} uploadState={uploadState} />}
            </>
          ) : <p className="we-help">Select a card, or add one.</p>}
        </section>

        <section className="we-preview" aria-label="Live preview">
          <div className="we-previewhead">
            <strong>Live preview</strong>
            <div className="we-seg" role="group" aria-label="Preview size">
              {[["desktop", "Desktop"], ["mobile", "Mobile"]].map(([k, l]) => <button type="button" key={k} className={device === k ? "on" : ""} aria-pressed={device === k} onClick={() => setDevice(k)}>{l}</button>)}
            </div>
            <button type="button" className="we-mini" disabled={!card || !card.visible} onClick={() => setDialogOpen((o) => !o)}>{dialogOpen ? "Close case study" : "Show case study"}</button>
          </div>
          <p className="we-help">Shows your draft exactly as visitors would see it after publishing{card && !card.visible ? " — this card is hidden, so it isn't shown." : "."} Click a card to open its case study.</p>
          <WorkPreview copy={normalizePage(draft.page).work} cards={previewCards} images={draft.images} selectedId={card ? card.id : null} onSelect={setSelId} device={device} dialogOpen={dialogOpen && !!card} setDialogOpen={setDialogOpen} />
          {validations.warnings.length > 0 && <ul className="we-warnlist">{validations.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
        </section>
      </div>
      ) : (
        <PageSectionEditor section={section} page={draft.page} setPage={setPage} cards={cards} />
      )}
    </div>
  );
}

function SecuringHelp() {
  return (
    <details className="we-details">
      <summary>How to lock publishing to your account</summary>
      <ol>
        <li>Firebase console → Build → Authentication → Get started → turn on <b>Email/Password</b>, then <b>Users → Add user</b> with your own email and a strong password.</li>
        <li>Firebase console → Firestore Database → <b>Rules</b>: replace the rules with the block below (use your email) and press <b>Publish</b>.</li>
        <li>Back here, choose <b>Sign in to publish</b> (top right) and use that email and password.</li>
      </ol>
      <pre className="we-pre">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'YOUR-EMAIL@example.com';
    }
  }
}`}</pre>
      <p>Visitors can still read the site; only that account can change it. This also protects the About and Contact page editors, which write to the same collection.</p>
    </details>
  );
}

// Publishing account (Firebase Auth, email + password) — shown on every admin tab because
// signing in also covers the About / Contact page editors.
function AdminAccount({ user, open, setOpen }) {
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(null), [busy, setBusy] = useState(false);
  const auth = getWorkStore().auth;
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await auth.signIn(email.trim(), pw); setPw(""); setOpen(false); }
    catch (x) { setErr(/invalid|wrong|credential|user-not-found/i.test(String((x && (x.code || x.message)) || "")) ? "Wrong email or password." : "Couldn't sign in: " + String((x && (x.code || x.message)) || x)); }
    finally { setBusy(false); }
  };
  if (user) return <span className="we-acct">Signed in as <b>{user.email}</b> <button type="button" className="we-link" onClick={() => auth.signOut()}>Sign out</button></span>;
  return (
    <span className="we-acct">
      <button type="button" className="we-link" aria-expanded={open} onClick={() => setOpen(!open)}>Sign in to publish</button>
      {open && (
        <form className="we-pop" onSubmit={go}>
          <strong>Publishing account</strong>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input type="password" required placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          {err && <span className="we-error">{err}</span>}
          <button type="submit" className="we-btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <span className="we-help">A Firebase Authentication user (Email/Password). Only needed once your Firestore rules require sign-in.</span>
        </form>
      )}
    </span>
  );
}

// ---- editors for the page text (everything except the cards) -----------------------------
const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "work", label: "Selected work" },
  { id: "approach", label: "How I work" },
  { id: "about", label: "About me" },
  { id: "contact", label: "Contact & footer" },
];
const SECTION_ANCHOR = { hero: "mr-home", approach: "mr-approach", about: "mr-about", contact: "mr-contact" };

function ResetSection({ onReset, what }) {
  return <button type="button" className="we-mini" onClick={() => { if (window.confirm(`Put ${what} back to the original wording?`)) onReset(); }}>Reset to original</button>;
}

function WorkHeadingForm({ page, setPage }) {
  const w = page.work, L = PAGE_LIMITS;
  const set = (patch) => setPage((p) => ({ ...p, work: { ...p.work, ...patch } }));
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>Section heading</h3><ResetSection what="this heading" onReset={() => set(defaultPage().work)} /></div>
      <p className="we-help">The title and intro above the cards.</p>
      <LimitedField label="Heading" value={w.headingA} max={L.heading} onChange={(v) => set({ headingA: v })} />
      <LimitedField label="Heading (highlighted part)" value={w.headingAccent} max={L.heading} onChange={(v) => set({ headingAccent: v })} />
      <LimitedField label="Intro (leave empty for the automatic text)" value={w.intro} max={L.intro} multiline rows={2} onChange={(v) => set({ intro: v })} help="Empty: “Two ways to turn…” with two cards, otherwise “Turning recurring problems into dependable systems.”" />
    </div>
  );
}

function HeroForm({ page, setPage, mode, setMode }) {
  const h = page.hero, L = PAGE_LIMITS, ai = mode === 1;
  const set = (patch) => setPage((p) => ({ ...p, hero: { ...p.hero, ...patch } }));
  const setValue = (i, v) => set({ values: h.values.map((x, k) => (k === i ? v : x)) });
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>Hero</h3><ResetSection what="the hero" onReset={() => set(defaultPage().hero)} /></div>
      <LimitedField label="Small line above the headline" value={h.eyebrow} max={L.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <LimitedField label="Label above the RPA / Agentic AI switch" value={h.focusLabel} max={L.focusLabel} onChange={(v) => set({ focusLabel: v })} help="Leave empty to hide the label (the switch stays)." />
      <div className="we-group">
        <div className="we-grouphead"><strong>Headline and paragraph</strong><span>Line 1 and the paragraph change with the RPA / Agentic AI switch; lines 2 and 3 are shared. The last line is highlighted in blue.</span></div>
        <div className="we-seg" role="group" aria-label="Version to edit">
          {[["RPA", 0], ["Agentic AI", 1]].map(([l, k]) => <button type="button" key={k} className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        </div>
        <LimitedField label="Line 1" value={ai ? h.line1Ai : h.line1} max={L.headline} onChange={(v) => set(ai ? { line1Ai: v } : { line1: v })} />
        <LimitedField label="Line 2" value={h.line2} max={L.headline} onChange={(v) => set({ line2: v })} />
        <LimitedField label="Line 3 (highlighted)" value={h.accent} max={L.headline} onChange={(v) => set({ accent: v })} />
        <LimitedField label="Paragraph" value={ai ? h.ledeAi : h.lede} max={L.lede} multiline rows={4} onChange={(v) => set(ai ? { ledeAi: v } : { lede: v })} />
      </div>
      <div className="we-two">
        <LimitedField label="Main button text" value={h.primaryLabel} max={L.label} onChange={(v) => set({ primaryLabel: v })} help="Scrolls to Selected work (hidden when there are no cards)." />
        <LimitedField label="Second link text" value={h.secondaryLabel} max={L.label} onChange={(v) => set({ secondaryLabel: v })} help="Scrolls to the contact section." />
      </div>
      <LimitedField label="Small note under the buttons" value={h.note} max={L.note} onChange={(v) => set({ note: v })} help="Leave empty to hide." />
      <div className="we-group">
        <div className="we-grouphead"><strong>Values strip</strong><span>The line of short statements under the hero</span></div>
        <LimitedField label="Label" value={h.valuesLabel} max={L.valuesLabel} onChange={(v) => set({ valuesLabel: v })} />
        {h.values.map((v, i) => <LimitedField key={i} label={`Statement ${i + 1}`} value={v} max={L.value} onChange={(x) => setValue(i, x)} />)}
      </div>
    </div>
  );
}

function ApproachForm({ page, setPage, mode, setMode, stage, setStage }) {
  const a = page.approach, L = PAGE_LIMITS, key = mode ? "ai" : "rpa", m = a[key], st = m.stages[stage];
  const setA = (patch) => setPage((p) => ({ ...p, approach: { ...p.approach, ...patch } }));
  const setM = (patch) => setPage((p) => ({ ...p, approach: { ...p.approach, [key]: { ...p.approach[key], ...patch } } }));
  const setStageField = (patch) => setM({ stages: m.stages.map((s, i) => (i === stage ? { ...s, ...patch } : s)) });
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>How I work</h3><ResetSection what="this whole section (both versions)" onReset={() => setA(defaultPage().approach)} /></div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Section texts</strong><span>Shared by both versions</span></div>
        <LimitedField label="Heading" value={a.headingA} max={L.heading} onChange={(v) => setA({ headingA: v })} />
        <LimitedField label="Heading (highlighted part)" value={a.headingAccent} max={L.heading} onChange={(v) => setA({ headingAccent: v })} />
        <LimitedField label="Intro" value={a.intro} max={L.intro} onChange={(v) => setA({ intro: v })} help="A second line “Explore the method behind …” is added automatically." />
        <LimitedField label="Loop note (bottom)" value={a.loopNote} max={L.loop} onChange={(v) => setA({ loopNote: v })} help="Leave empty to hide." />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Version</strong><span>The RPA and Agentic AI versions are edited separately. The stage names and the animation are fixed.</span></div>
        <div className="we-seg" role="group" aria-label="Version to edit">
          {[["RPA", 0], ["Agentic AI", 1]].map(([l, k]) => <button type="button" key={k} className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        </div>
        <LimitedField label="“Explore the method behind …”" value={m.behind} max={L.behind} onChange={(v) => setM({ behind: v })} />
        <LimitedField label="The principle (right-hand note)" value={m.principle} max={L.principle} onChange={(v) => setM({ principle: v })} />
        <span className="we-fl"><span>Stage</span></span>
        <div className="we-stagepick" role="group" aria-label="Stage to edit">
          {STAGE_NAMES[key].map((n, i) => <button type="button" key={i} className={stage === i ? "on" : ""} aria-pressed={stage === i} onClick={() => setStage(i)}><small>0{i + 1}</small>{n}</button>)}
        </div>
        <div className="we-section">
          <LimitedField label={`Stage ${stage + 1} · ${STAGE_NAMES[key][stage]} — headline`} value={st.title} max={L.stageTitle} onChange={(v) => setStageField({ title: v })} />
          <LimitedField label="Text" value={st.text} max={L.stageText} multiline rows={4} onChange={(v) => setStageField({ text: v })} />
          {st.checks.map((c, i) => <LimitedField key={i} label={`Checkpoint ${i + 1}`} value={c} max={L.check} onChange={(v) => setStageField({ checks: st.checks.map((x, k) => (k === i ? v : x)) })} />)}
          <div className="we-row"><button type="button" className="we-mini" onClick={() => { if (window.confirm("Put this stage back to the original wording?")) setStageField(defaultPage().approach[key].stages[stage]); }}>Reset this stage</button></div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ label, items, max, cap, onChange, rows = 3, addLabel }) {
  const set = (i, v) => onChange(items.map((x, k) => (k === i ? v : x)));
  const move = (i, d) => { const a = items.slice(), j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="we-group">
      {items.map((t, i) => (
        <div className="we-section" key={i}>
          <LimitedField label={`${label} ${i + 1}`} value={t} max={max} multiline={rows > 1} rows={rows} onChange={(v) => set(i, v)} />
          <div className="we-row">
            <button type="button" className="we-mini" disabled={i === 0} onClick={() => move(i, -1)}>↑ Up</button>
            <button type="button" className="we-mini" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓ Down</button>
            <button type="button" className="we-mini danger" onClick={() => onChange(items.filter((_, k) => k !== i))}>Remove</button>
          </div>
        </div>
      ))}
      {items.length < cap && <button type="button" className="we-btn" onClick={() => onChange([...items, ""])}>{addLabel}</button>}
    </div>
  );
}

function AboutForm({ page, setPage }) {
  const a = page.about, L = PAGE_LIMITS;
  const set = (patch) => setPage((p) => ({ ...p, about: { ...p.about, ...patch } }));
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>The person behind the process</h3><ResetSection what="this section" onReset={() => set(defaultPage().about)} /></div>
      <LimitedField label="Heading" value={a.headingA} max={L.heading} onChange={(v) => set({ headingA: v })} />
      <LimitedField label="Heading (highlighted part)" value={a.headingAccent} max={L.heading} onChange={(v) => set({ headingAccent: v })} />
      <div className="we-grouphead"><strong>Paragraphs</strong><span>Up to {L.maxParagraphs}</span></div>
      <ListEditor label="Paragraph" items={a.paragraphs} max={L.paragraph} cap={L.maxParagraphs} rows={4} addLabel="+ Add paragraph" onChange={(items) => set({ paragraphs: items })} />
      <LimitedField label="Personal quote" value={a.quote} max={L.quote} onChange={(v) => set({ quote: v })} help="Leave empty to hide." />
      <div className="we-two">
        <LimitedField label="Picture caption (left)" value={a.captionLeft} max={L.caption} onChange={(v) => set({ captionLeft: v })} />
        <LimitedField label="Picture caption (right)" value={a.captionRight} max={L.caption} onChange={(v) => set({ captionRight: v })} />
      </div>
    </div>
  );
}

function ContactForm({ page, setPage }) {
  const c = page.contact, f = page.footer, L = PAGE_LIMITS;
  const set = (patch) => setPage((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const typed = c.linkUrl.trim(), bad = typed && !safeContactUrl(typed);
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>Contact & footer</h3><ResetSection what="this section" onReset={() => { set(defaultPage().contact); setPage((p) => ({ ...p, footer: defaultPage().footer })); }} /></div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Where the contact button leads</strong><span>Without this, visitors have no way to reach you</span></div>
        <LimitedField label="Email address or web address" value={c.linkUrl} max={L.url} onChange={(v) => set({ linkUrl: v })} help="An email address (you@example.com) opens a new email; an https:// address opens that page (a form, LinkedIn…)." error={bad ? "That isn't an email address or an https:// address, so it won't be published." : null} />
        <LimitedField label="Button text in the dialog" value={c.linkLabel} max={L.label} onChange={(v) => set({ linkLabel: v })} />
        {!typed && <p className="we-warn">⚠ No link yet — the dialog will say contact details haven’t been added.</p>}
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Call-to-action band</strong><span>The dark blue box near the bottom</span></div>
        <LimitedField label="Heading, line 1" value={c.headingA} max={L.heading} onChange={(v) => set({ headingA: v })} />
        <LimitedField label="Heading, line 2" value={c.headingB} max={L.heading} onChange={(v) => set({ headingB: v })} />
        <LimitedField label="Small text" value={c.sub} max={L.sub} onChange={(v) => set({ sub: v })} help="Leave empty to hide." />
        <LimitedField label="Button text" value={c.button} max={L.label} onChange={(v) => set({ button: v })} />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Contact dialog</strong><span>Opens when someone clicks “Start a conversation”</span></div>
        <LimitedField label="Small title" value={c.dialogKicker} max={L.dialogKicker} onChange={(v) => set({ dialogKicker: v })} />
        <LimitedField label="Title" value={c.dialogTitle} max={L.dialogTitle} onChange={(v) => set({ dialogTitle: v })} />
        <LimitedField label="Intro" value={c.dialogIntro} max={L.dialogIntro} onChange={(v) => set({ dialogIntro: v })} />
        <div className="we-grouphead"><strong>Questions</strong><span>Up to {L.maxQuestions}</span></div>
        <ListEditor label="Question" items={c.questions} max={L.question} cap={L.maxQuestions} rows={1} addLabel="+ Add question" onChange={(items) => set({ questions: items })} />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Footer</strong></div>
        <LimitedField label="Footer line" value={f.tagline} max={L.tagline} onChange={(v) => setPage((p) => ({ ...p, footer: { ...p.footer, tagline: v } }))} help="Leave empty to hide." />
      </div>
    </div>
  );
}

// Preview of the WHOLE homepage in an iframe, scrolled to the section being edited. For "How I work" it also shows the
// version and stage being edited (the page is remounted with them as its starting point).
function PagePreview({ page, cards, section, device, mode, stage }) {
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => {
      const id = SECTION_ANCHOR[section], el = id && id !== "mr-home" ? doc.getElementById(id) : null;
      if (el) el.scrollIntoView({ block: "start" }); else doc.defaultView.scrollTo(0, 0);
    }, 200);
    return () => clearTimeout(t);
  }, [doc, section, device, mode, stage]);
  return (
    <PreviewFrame width={device === "mobile" ? 390 : 1100} fixedHeight={device === "mobile" ? 700 : 620} onDoc={setDoc}>
      <MatsHomepage key={`${mode}-${stage}`} page={normalizePage(page)} defaultMode={mode} defaultStage={stage} work={{ status: "ready", cards: normalizeWorkCards(cards) }} />
    </PreviewFrame>
  );
}

function PageSectionEditor({ section, page, setPage, cards }) {
  const [device, setDevice] = useState("desktop"), [mode, setMode] = useState(0), [stage, setStage] = useState(0);
  const { warnings } = validatePage(page), mine = warnings.filter((w) => w.section === section);
  const props = { page, setPage };
  return (
    <div className="we-grid we-grid2">
      <section className="we-form" aria-label="Edit text">
        {section === "hero" && <HeroForm {...props} mode={mode} setMode={setMode} />}
        {section === "approach" && <ApproachForm {...props} mode={mode} setMode={setMode} stage={stage} setStage={setStage} />}
        {section === "about" && <AboutForm {...props} />}
        {section === "contact" && <ContactForm {...props} />}
      </section>
      <section className="we-preview" aria-label="Live preview">
        <div className="we-previewhead">
          <strong>Live preview</strong>
          <div className="we-seg" role="group" aria-label="Preview size">
            {[["desktop", "Desktop"], ["mobile", "Mobile"]].map(([k, l]) => <button type="button" key={k} className={device === k ? "on" : ""} aria-pressed={device === k} onClick={() => setDevice(k)}>{l}</button>)}
          </div>
        </div>
        <p className="we-help">The real homepage with your draft, scrolled to this section. You can scroll inside it.</p>
        <PagePreview page={page} cards={cards} section={section} device={device} mode={mode} stage={stage} />
        {mine.length > 0 && <ul className="we-warnlist">{mine.map((w, i) => <li key={i}>⚠ {w.text}</li>)}</ul>}
      </section>
    </div>
  );
}

function AdminStyles() {
  return (
    <style>{`
      /* ---- Admin theme: the homepage's palette (warm paper, ink, blue) ---- */
      .adm-theme{ --rpa-primary:#3b60c5; --rpa-ink:#172033; --rpa-ink-soft:#586477; --rpa-line:#dce2eb; font-family:Inter,sans-serif; color:#172033; background:#f8f7f3; min-height:100vh; }
      .adm-theme *{ box-sizing:border-box; }
      body.adm-body{ margin:0; background:#f8f7f3; }
      .adm-header{ max-width:1560px; margin:0 auto; padding:22px 28px; display:flex; align-items:center; justify-content:space-between; gap:20px; border-bottom:1px solid #e4e3de; position:relative; z-index:40; flex-wrap:wrap; }
      .adm-brand{ font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:700; letter-spacing:-1px; display:flex; align-items:center; color:#172033; text-decoration:none; }
      .adm-logomark{ font-family:monospace; font-size:23px; letter-spacing:-5px; color:#3b60c5; margin-right:15px; }
      .adm-period{ color:#3b60c5; }
      .adm-tag{ font:500 10px/1 Inter,sans-serif; letter-spacing:1.6px; text-transform:uppercase; color:#697588; margin-left:16px; border:1px solid #ccd4e0; padding:6px 9px; border-radius:4px; }
      .adm-headright{ display:flex; align-items:center; gap:18px; }
      .adm-viewsite{ border:1px solid #ccd4e0; padding:10px 17px; border-radius:5px; font-size:12px; color:#172033; text-decoration:none; }
      .adm-viewsite:hover{ border-color:#3b60c5; color:#3b60c5; }
      .adm-wrap{ max-width:1560px; margin:0 auto; padding:26px 28px 60px; }
      .adm-banner{ background:#eef2fb; border:1px solid #cbd7f0; border-radius:8px; padding:14px 18px; font-size:.88rem; margin-bottom:18px; color:#233047; }
      .adm-banner code{ background:#fff; padding:1px 6px; border-radius:4px; font-size:.85em; }
      .adm-gate{ display:flex; align-items:center; justify-content:center; padding:24px; }
      .adm-gate-box{ background:#fff; border:1px solid #dce2eb; border-radius:12px; padding:38px; width:min(92vw,400px); display:flex; flex-direction:column; gap:12px; }
      .adm-gate-box h1{ font:700 28px 'Space Grotesk',sans-serif; margin:0; letter-spacing:-1px; }
      .adm-gate-box p{ margin:0; font-size:.9rem; color:#586477; }
      .adm-gate-box input{ padding:11px 12px; border:1.5px solid #dce2eb; border-radius:6px; font:1rem Inter,sans-serif; }
      .adm-gate-box input:focus{ outline:2px solid #3b60c5; outline-offset:1px; }
      .adm-gate-box button{ background:#3b60c5; color:#fff; border:0; border-radius:5px; padding:12px 18px; font:500 .9rem Inter,sans-serif; cursor:pointer; }
      .adm-err{ color:#b3261e !important; }

      /* ---- Selected work editor ---- */
      .we{ font-family:Inter,sans-serif; color:var(--rpa-ink); }
      .we-loading{ padding:60px; text-align:center; color:var(--rpa-ink-soft); }
      .we-bar{ display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:14px 18px; margin-bottom:14px; position:sticky; top:72px; z-index:20; }
      .we-state{ display:flex; flex-direction:column; gap:4px; }
      .we-chip{ display:inline-block; align-self:flex-start; font:600 .8rem Inter,sans-serif; padding:4px 10px; border-radius:999px; background:#eef1f6; color:#586477; }
      .we-chip.draft{ background:#FFF4E0; color:#8A5A00; } .we-chip.ok{ background:#E6F4EA; color:#1E6B3A; }
      .we-meta{ font-size:.8rem; color:var(--rpa-ink-soft); }
      .we-actions{ display:flex; gap:10px; flex-wrap:wrap; }
      .we-btn{ font:500 .88rem Inter,sans-serif; padding:9px 16px; border-radius:8px; border:1.5px solid var(--rpa-line); background:#fff; color:var(--rpa-ink); cursor:pointer; }
      .we-btn:hover:not(:disabled){ border-color:var(--rpa-primary); }
      .we-btn.primary{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .we-btn:disabled{ opacity:.45; cursor:not-allowed; }
      .we-mini{ font:500 .78rem Inter,sans-serif; padding:5px 10px; border-radius:7px; border:1px solid var(--rpa-line); background:#fff; cursor:pointer; color:var(--rpa-ink); }
      .we-mini.danger{ color:#B3261E; } .we-mini:disabled{ opacity:.4; cursor:not-allowed; }
      .we-link{ background:none; border:0; padding:0; color:var(--rpa-primary); text-decoration:underline; cursor:pointer; font:inherit; font-size:.85rem; }
      .we-note{ border-radius:10px; padding:12px 16px; font-size:.88rem; margin-bottom:12px; border:1px solid; }
      .we-note.ok{ background:#E6F4EA; border-color:#9ED0AE; color:#1E5A33; } .we-note.error{ background:#FDECEA; border-color:#F0A9A3; color:#8C1D18; } .we-note.warn{ background:#FFF4E0; border-color:#EBC27A; color:#6B4700; }
      .we-grid{ display:grid; grid-template-columns:240px minmax(340px,1fr) minmax(420px,1.25fr); gap:18px; align-items:start; }
      @media(max-width:1300px){ .we-grid{ grid-template-columns:220px 1fr; } .we-preview{ grid-column:1 / -1; } }
      @media(max-width:760px){ .we-grid{ grid-template-columns:1fr; } }
      .we-list,.we-form,.we-preview{ background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:16px; min-width:0; }
      .we-listhead{ display:flex; justify-content:space-between; margin-bottom:10px; font-size:.9rem; } .we-listhead span{ color:var(--rpa-ink-soft); font-size:.8rem; }
      .we-item{ display:block; width:100%; text-align:left; padding:10px 12px; border:1.5px solid transparent; border-radius:9px; background:#f6f7f9; margin-bottom:8px; cursor:pointer; font:inherit; color:inherit; }
      .we-item.on{ border-color:var(--rpa-primary); background:#fff; } .we-item.hidden{ opacity:.65; }
      .we-itemtop{ display:flex; gap:8px; align-items:center; }
      .we-order{ flex:none; width:20px; height:20px; border-radius:50%; background:var(--rpa-primary); color:#fff; font-size:.72rem; display:flex; align-items:center; justify-content:center; }
      .we-itemtitle{ font-size:.88rem; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .we-itemmeta{ display:block; font-size:.74rem; color:var(--rpa-ink-soft); margin:4px 0 0 28px; }
      .we-addwrap{ position:relative; margin:6px 0 14px; }
      .we-menu{ position:absolute; z-index:30; left:0; top:calc(100% + 4px); background:#fff; border:1px solid var(--rpa-line); border-radius:10px; box-shadow:0 10px 24px #0f172a1a; padding:6px; min-width:200px; }
      .we-menu button{ display:block; width:100%; text-align:left; padding:8px 10px; background:none; border:0; border-radius:6px; cursor:pointer; font:inherit; } .we-menu button:hover{ background:#f1f4f9; }
      .we-formhead{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
      .we-formhead h3{ margin:0; font:600 1.05rem 'Space Grotesk',sans-serif; overflow-wrap:anywhere; flex:1; min-width:140px; }
      .we-row{ display:flex; gap:6px; flex-wrap:wrap; }
      .we-tabs{ display:flex; gap:4px; border-bottom:1px solid var(--rpa-line); margin-bottom:16px; }
      .we-tabs button{ padding:9px 16px; border:0; background:none; border-bottom:2px solid transparent; cursor:pointer; font:500 .9rem Inter,sans-serif; color:var(--rpa-ink-soft); margin-bottom:-1px; }
      .we-tabs button.on{ color:var(--rpa-primary); border-bottom-color:var(--rpa-primary); }
      .we-stack{ display:flex; flex-direction:column; gap:14px; }
      .we-field{ display:flex; flex-direction:column; gap:5px; }
      .we-fl{ display:flex; justify-content:space-between; font-size:.8rem; font-weight:600; color:var(--rpa-ink); }
      .we-count{ font-weight:400; color:var(--rpa-ink-soft); font-family:'JetBrains Mono',monospace; font-size:.72rem; } .we-count.full{ color:#B3261E; }
      .we-field input,.we-field textarea{ width:100%; box-sizing:border-box; padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; font:.92rem Inter,sans-serif; color:var(--rpa-ink); background:#fff; resize:vertical; }
      .we-field input:focus,.we-field textarea:focus,.we-hexrow input:focus{ outline:2px solid var(--rpa-primary); outline-offset:1px; border-color:var(--rpa-primary); }
      .we-help{ font-size:.78rem; color:var(--rpa-ink-soft); margin:0; } .we-error{ font-size:.8rem; color:#B3261E; margin:0; } .we-warn{ font-size:.8rem; color:#7A5200; margin:4px 0 0; }
      .we-switch{ display:flex; gap:10px; align-items:center; font-size:.92rem; font-weight:500; cursor:pointer; } .we-switch input{ width:18px; height:18px; }
      .we-group{ border:1px solid var(--rpa-line); border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:12px; background:#fbfbfc; }
      .we-grouphead{ display:flex; flex-direction:column; gap:2px; } .we-grouphead strong{ font-size:.92rem; } .we-grouphead span{ font-size:.76rem; color:var(--rpa-ink-soft); }
      .we-section{ border:1px dashed var(--rpa-line); border-radius:9px; padding:12px; display:flex; flex-direction:column; gap:10px; background:#fff; }
      .we-two{ display:grid; grid-template-columns:1fr 1fr; gap:12px; } @media(max-width:560px){ .we-two{ grid-template-columns:1fr; } }
      .we-templates{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .we-template{ min-width:0; overflow:hidden; display:flex; flex-direction:column; gap:3px; text-align:left; padding:8px; border:1.5px solid var(--rpa-line); border-radius:10px; background:#fff; cursor:pointer; font:inherit; color:inherit; }
      .we-tname{ font-size:.84rem; font-weight:600; } .we-thint{ font-size:.72rem; color:var(--rpa-ink-soft); }
      .we-template.on{ border-color:var(--rpa-primary); box-shadow:0 0 0 3px #dce5f9; }
      .we-thumb{ min-height:0 !important; background:transparent !important; height:76px; overflow:hidden; border-radius:6px; border:1px solid var(--rpa-line); position:relative; margin-bottom:6px; }
      .we-thumb-in{ position:absolute; top:0; left:0; width:560px; transform:scale(.32); transform-origin:top left; pointer-events:none; }
      .we-thumb-img{ display:flex; align-items:center; justify-content:center; height:100%; background:#edf2fb; }
      .we-swatches{ display:flex; gap:8px; flex-wrap:wrap; }
      .we-swatch{ width:34px; height:34px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 1.5px var(--rpa-line); cursor:pointer; } .we-swatch.on{ box-shadow:0 0 0 2.5px var(--rpa-primary); }
      .we-hexrow{ display:flex; gap:8px; align-items:center; }
      .we-hexrow input[type=color]{ width:42px; height:36px; padding:2px; border:1.5px solid var(--rpa-line); border-radius:8px; background:#fff; cursor:pointer; }
      .we-hexrow input[type=text]{ flex:1; min-width:0; padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; font:.9rem 'JetBrains Mono',monospace; }
      .we-range{ display:flex; flex-direction:column; gap:3px; font-size:.78rem; color:var(--rpa-ink-soft); margin-top:8px; }
      .we-crop{ min-height:0 !important; background:transparent !important; margin:6px 0; }
      .we-previewhead{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
      .we-seg{ display:inline-flex; border:1.5px solid var(--rpa-line); border-radius:9px; overflow:hidden; }
      .we-seg button{ padding:6px 14px; border:0; background:#fff; font:500 .82rem Inter,sans-serif; cursor:pointer; } .we-seg button.on{ background:var(--rpa-primary); color:#fff; }
      .we-framehost{ width:100%; margin-top:10px; }
      .we-frame-wrap{ margin:0 auto; border:1px solid var(--rpa-line); border-radius:10px; overflow:hidden; background:#f8f7f3; box-sizing:content-box; }
      .we-frame{ border:0; display:block; transform-origin:top left; }
      .we-warnlist{ list-style:none; padding:0; margin:12px 0 0; font-size:.8rem; color:#7A5200; display:flex; flex-direction:column; gap:4px; }
      .we-acct{ position:relative; font-size:.85rem; color:var(--rpa-ink-soft); }
      .we-pop{ position:absolute; right:0; top:calc(100% + 8px); z-index:60; width:280px; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; box-shadow:0 14px 30px #0f172a22; padding:14px; display:flex; flex-direction:column; gap:9px; text-align:left; }
      .we-details{ margin-top:8px; } .we-details summary{ cursor:pointer; font-weight:600; } .we-details ol{ margin:8px 0 8px 18px; padding:0; } .we-details li{ margin:3px 0; }
      .we-pre{ background:#0f172a; color:#e6edf7; padding:12px; border-radius:8px; overflow:auto; font:12px/1.5 'JetBrains Mono',monospace; white-space:pre; margin:8px 0; }
      .we-pop input{ padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; font:.9rem Inter,sans-serif; }
    
      /* ---- page sections ---- */
      .we-sections{ display:flex; gap:6px; flex-wrap:wrap; margin:0 0 16px; padding-bottom:14px; border-bottom:1px solid var(--rpa-line); }
      .we-sections button{ padding:10px 18px; border:1px solid var(--rpa-line); background:#fff; border-radius:5px; font:500 .86rem Inter,sans-serif; color:var(--rpa-ink-soft); cursor:pointer; }
      .we-sections button:hover{ border-color:var(--rpa-primary); color:var(--rpa-primary); }
      .we-sections button.on{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .we-headitem{ display:block; width:100%; text-align:left; padding:10px 12px; border:1.5px dashed var(--rpa-line); border-radius:9px; background:#fff; margin-bottom:12px; cursor:pointer; font:500 .86rem Inter,sans-serif; color:inherit; }
      .we-headitem.on{ border-color:var(--rpa-primary); border-style:solid; }
      .we-grid2{ grid-template-columns:minmax(340px,1fr) minmax(460px,1.5fr) !important; }
      @media(max-width:1000px){ .we-grid2{ grid-template-columns:1fr !important; } }
      .we-stagepick{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
      .we-stagepick button{ padding:8px 6px; border:1.5px solid var(--rpa-line); background:#fff; border-radius:7px; font:500 .8rem Inter,sans-serif; cursor:pointer; color:var(--rpa-ink); display:flex; flex-direction:column; align-items:center; gap:2px; }
      .we-stagepick button small{ font:400 .66rem 'JetBrains Mono',monospace; color:var(--rpa-ink-soft); }
      .we-stagepick button.on{ border-color:var(--rpa-primary); background:#eef2fb; color:var(--rpa-primary); }
      .we-btn,.we-mini,.we-seg{ border-radius:5px; }
      .we-bar{ top:12px; }
    `}</style>
  );
}

const ADMIN_PASSPHRASE = "changeme"; // change this — it only hides the page; real protection is Firebase sign-in (see the README)

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
  const [passInput, setPassInput] = useState(""), [passError, setPassError] = useState(false);
  const user = useWorkAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  useEffect(() => {
    document.body.classList.add("adm-body");
    return () => document.body.classList.remove("adm-body");
  }, []);

  if (!unlocked) {
    return (
      <div className="adm-theme adm-gate">
        <AdminStyles />
        <div className="adm-gate-box">
          <span className="adm-brand"><span className="adm-logomark">[→</span>mats<span className="adm-period">.</span></span>
          <h1>Admin</h1>
          <p>Enter the admin passphrase to continue.</p>
          <input type="password" aria-label="Admin passphrase" value={passInput} onChange={(e) => { setPassInput(e.target.value); setPassError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !tryUnlock(passInput)) setPassError(true); }} autoFocus />
          <button type="button" onClick={() => { if (!tryUnlock(passInput)) setPassError(true); }}>Enter</button>
          {passError && <p className="adm-err">Wrong passphrase.</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="adm-theme">
      <style>{MR_CSS}</style>
      <AdminStyles />
      <header className="adm-header">
        <Link className="adm-brand" to="/"><span className="adm-logomark">[→</span>mats<span className="adm-period">.</span><span className="adm-tag">Admin</span></Link>
        <div className="adm-headright">
          <AdminAccount user={user} open={signInOpen} setOpen={setSignInOpen} />
          <Link className="adm-viewsite" to="/">View site ↗</Link>
        </div>
      </header>
      <div className="adm-wrap">
        {ADMIN_PASSPHRASE === "changeme" && (
          <div className="adm-banner">
            The admin passphrase is still the default <code>changeme</code>. Change <code>ADMIN_PASSPHRASE</code> in App.jsx. Note that it only hides this page — real protection for publishing is Firebase sign-in.
            <SecuringHelp />
          </div>
        )}
        <SiteEditor user={user} askSignIn={() => setSignInOpen(true)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/admin" element={<AdminSection />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
