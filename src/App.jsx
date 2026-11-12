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
// FIREBASE (enabled for this site; disable FIREBASE_ENABLED for built-in content only)
// ---------------------------------------------------------------------------
export const FIREBASE_ENABLED = true; // turn off to use the built-in content without publishing

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
// Release the timer when the operation settles; retain the same timeout/error behavior.
const workTimeout = (p, ms, msg) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(msg || "timeout")), ms);
  Promise.resolve(p).then(
    (value) => { clearTimeout(timer); resolve(value); },
    (error) => { clearTimeout(timer); reject(error); }
  );
});

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
        off = fs.onSnapshot(fs.doc(db, "siteContent", "work"), (snap) => { if (!dead) onDoc(snap.exists() ? snap.data() : null); }, (err) => { if (!dead) onError(err); });
      } catch (e) { if (!dead) onError(e); }
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
        } catch { if (!dead) cb(null); }
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
function useStoredImageSrc(im, localData, enabled) {
  const local = enabled && im.kind === "upload" && localData;
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
function useWorkImageSrc(card, localImages) {
  return useStoredImageSrc(card.appearance.image, localImages && localImages[card.id], card.appearance.template === "image");
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
    <button type="button" className={`mr-project${selected ? " is-selected" : ""}`} onClick={onOpen} data-card-id={card.id} style={{ backgroundColor: card.appearance.background }}>
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
        <div><div className="mr-kicker">Examples</div><h2>{head.headingA}<br /><em>{head.headingAccent}</em></h2></div>
        {head.intro ? <p>{textLines(head.intro)}</p> : n === 2 ? <p>Two example workflows, with a closer look<br />at the decisions behind them.</p> : <p>Example workflows, with a closer look<br />at the decisions behind them.</p>}
      </div>
      <div className={`mr-workgrid${n === 1 ? " single" : ""}`}>
        {loading ? <><WorkSkeleton /><WorkSkeleton /></> : cards.map((card) => <WorkCardView key={card.id} card={card} localImages={localImages} selected={selectedId === card.id} onOpen={(e) => onOpen(e, card)} />)}
      </div>
      {!loading && anyIllustrative && <p className="mr-example-note">Illustrative examples of how I approach the work. They are not client engagements or measured results.</p>}
    </section>
  );
}

// Overlay + dialog + focus handling, shared by the homepage and the editor's preview.
function ModalShell({ kicker, title, onDismiss, closeRef, children, className }) {
  const root = useRef(null), dismissRef = useRef(onDismiss);
  const titleId = useId();
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
      <section className={`mr-modal${className ? " " + className : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={(e) => {
        if (e.key === "Tab") {
          const els = e.currentTarget.querySelectorAll("button,a[href],input,textarea");
          const first = els[0], last = els[els.length - 1], active = e.currentTarget.ownerDocument.activeElement;
          if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        }
      }}>
        <button className="mr-close" ref={closeRef} onClick={() => dismissRef.current()} aria-label="Close dialog">×</button>
        <div className="mr-kicker">{kicker}</div>
        <h2 id={titleId}>{title}</h2>
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

// ---- About me: portrait + the window opened by the section (same ModalShell as the example dialogs) ----
// The portrait is the photo set in /admin (key "__portrait" while it is a draft) or, until there is one, the design's
// "m." monogram placeholder. No stock picture is ever used.
function AboutPortrait({ portrait, name, localImages, variant }) {
  const src = useStoredImageSrc(portrait, localImages && localImages["__portrait"], true);
  const crop = { objectPosition: `${portrait.x}% ${portrait.y}%`, transform: `scale(${portrait.zoom})`, transformOrigin: `${portrait.x}% ${portrait.y}%` };
  if (variant === "card") return src ? <img className="mr-aboutphoto" src={src} alt="" style={crop} /> : <span className="mr-aboutmonogram">m<span>.</span></span>;
  return src
    ? <div className="mr-profile-portrait mr-has-photo"><img src={src} alt={portrait.alt || `Portrait of ${name}`} style={crop} /></div>
    : <div className="mr-profile-portrait" role="img" aria-label={`${name} monogram; portrait to be added`}><span>m<span>.</span></span><small>PORTRAIT TO COME</small></div>;
}

function AboutBody({ modal, localImages }) {
  return (
    <>
      <div className="mr-profile-card">
        <AboutPortrait variant="modal" portrait={modal.portrait} name={modal.name} localImages={localImages} />
        <div>
          <span className="mr-kicker">{modal.name.toUpperCase()}</span>
          <h3>{modal.role}</h3>
          {modal.intro && <p>{modal.intro}</p>}
          {modal.tags.length > 0 && <div className="mr-profile-tags">{modal.tags.map((t, i) => <span key={i}>{t}</span>)}</div>}
        </div>
      </div>
      {modal.blocks.length > 0 && <div className="mr-profile-detail">{modal.blocks.map((b, i) => <React.Fragment key={i}>{b.heading && <h3>{b.heading}</h3>}{b.body && <p>{b.body}</p>}</React.Fragment>)}</div>}
      {modal.quote && <blockquote className="mr-profile-quote">“{modal.quote}”</blockquote>}
    </>
  );
}

// =====================================================================================
// PAGE TEXT — everything on the homepage that isn't an "Examples" card: the hero, section headings, the scroll story,
// "How I work", "About me" (with its window), the contact call-to-action and the footer.
//
// Same idea as the cards: plain data in, the design's components out. Layout, type, colours, the lifecycle animation and
// its illustrations stay fixed by the design. The text is saved in the same published document as the cards
// (siteContent/work → `page`), so one Publish covers the whole page.
// =====================================================================================
const PAGE_LIMITS = {
  cue: 24, aboutHeading: 40, personName: 40, role: 50, bioIntro: 220, tag: 24, maxTags: 6, blockHeading: 50, blockText: 420, maxBlocks: 4,
  chapterTitle: 60, chapterText: 320, chapterAside: 90, chapterLabel: 40, chapterNote: 90, storyLabel: 40, storyQuote: 120,
  eyebrow: 60, focusLabel: 40, headline: 40, lede: 300, label: 32, note: 80, heading: 50, intro: 160, loop: 120,
  stageTitle: 60, stageText: 280, check: 40, principle: 80, paragraph: 360, maxParagraphs: 4, quote: 120, caption: 30,
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
// Which lifecycle stage each scroll-story chapter shows, and its small tag. Fixed by the design.
const STORY_FIXED = {"rpa": [{"tag": "IDENTIFY + ASSESS", "stage": 0}, {"tag": "DESIGN + DEVELOP", "stage": 2}, {"tag": "TEST + DEPLOY", "stage": 5}, {"tag": "MONITOR + IMPROVE", "stage": 7}], "ai": [{"tag": "IDENTIFY + SCOPE", "stage": 0}, {"tag": "DESIGN + BUILD", "stage": 2}, {"tag": "EVALUATE + DEPLOY", "stage": 5}, {"tag": "OBSERVE + IMPROVE", "stage": 7}]};
// The default page text of the previous release. A saved value that still equals it was never edited, so it is
// replaced by the current default; anything you wrote yourself is kept.
const LEGACY_PAGE_DEFAULTS = {"hero":{"eyebrow":"MATS ØSTVIG / SENIOR AUTOMATION ENGINEER","line1":"Reliable automation.","line2":"More room for","accent":"meaningful work.","focusLabel":"EXPLORE MY APPROACH","line1Ai":"Purposeful AI.","lede":"I build reliable RPA workflows that take repetitive work off your team’s plate—from understanding the process to improving what happens next.","ledeAi":"I build bounded AI agents that turn unstructured information into useful actions—with clear context, reliable tools, and outcomes you can evaluate.","primaryLabel":"View selected work","secondaryLabel":"Start a conversation","note":"A practical mindset. A complete lifecycle.","valuesLabel":"PROCESS FIRST","values":["APIs before complexity","Human oversight, built in","Outcomes you can measure"]},"work":{"headingA":"Make the work","headingAccent":"work better.","intro":""},"approach":{"headingA":"A clear path.","headingAccent":"No black boxes.","intro":"Eight stages. The right questions at every step.","loopNote":"Improve feeds the next Identify pass. The loop is the point.","rpa":{"behind":"a reliable automation","principle":"The simplest reliable solution wins.","stages":[{"title":"Start with the work. Not the tool.","text":"Shadow the people doing the work. Look for repetition, stable rules, and a problem worth solving.","checks":["Observe the workflow","Measure frequency and effort","Keep judgment-heavy decisions human"]},{"title":"Make the case before the build.","text":"Compare expected time saved with complexity, risk, and system stability. Agree on the outcome with the process owner.","checks":["Establish a baseline","Rank candidates by return","Agree on ownership"]},{"title":"Map the edges as well as the path.","text":"Map actors, handoffs, and exceptions in BPMN swimlanes. Validate the process with the people who know it.","checks":["Map every handoff","Design exception paths","Review with the team"]},{"title":"Choose the simplest reliable tool.","text":"Use APIs first, scripts for data movement, and RPA where systems have no programmatic access.","checks":["Build clear interfaces","Validate every input","Route uncertainty to a person"]},{"title":"Make failure part of the test.","text":"Compare automated and manual results on historical cases. Deliberately test bad data, missing fields, and timeouts.","checks":["Run in parallel","Compare actual outputs","Test recovery paths"]},{"title":"Ship with a way back.","text":"Start in shadow mode, release to a subset, then expand. Include a rollback plan, documentation, and a named owner.","checks":["Roll out in stages","Prepare rollback","Hand over the runbook"]},{"title":"Make every run visible.","text":"Track runs, exceptions, and time saved. Alert a person when a workflow fails, and review performance regularly.","checks":["Track operational health","Make alerts actionable","Review outcomes monthly"]},{"title":"Measure what changed. Then repeat.","text":"Compare 30- and 90-day results with the baseline. Feed real observations into the next discovery cycle.","checks":["Compare baseline to actual","Refine the workflow","Identify the next opportunity"]}]},"ai":{"behind":"a bounded AI agent","principle":"Autonomy is earned through evidence.","stages":[{"title":"Find a useful job for an agent.","text":"Look for language-heavy work or unstructured information. Keep the task bounded and the desired outcome clear.","checks":["Understand the decision","Check available evidence","Define human ownership"]},{"title":"Give autonomy a clear boundary.","text":"Weigh value against the cost of an error. Define what the agent may read, propose, and execute.","checks":["Define permissions","Set approval boundaries","Agree on success criteria"]},{"title":"Design the system around the model.","text":"Specify context, retrieval, tools, and recovery paths. Make every consequential action traceable.","checks":["Use least-privilege tools","Design escalation","Plan for missing evidence"]},{"title":"Start small. Add complexity with evidence.","text":"Begin with a prompt and retrieval. Add tools or loops only when evaluation shows they improve the outcome.","checks":["Validate structured outputs","Bound tool execution","Record the action trail"]},{"title":"An evaluation set, not just a demo.","text":"Test representative tasks, unsafe retrieved instructions, and tool failures. Check groundedness, quality, latency, and cost.","checks":["Use real task examples","Test failure and misuse","Review with domain experts"]},{"title":"Earn autonomy through evidence.","text":"Begin in shadow mode, then require approval, then allow limited actions. Keep a stop mechanism and accountable owner.","checks":["Shadow before acting","Approve consequential actions","Keep rollback ready"]},{"title":"Look beyond whether it ran.","text":"Review outcomes, traces, tool errors, and cost. Escalate low-quality or out-of-policy results to a person.","checks":["Inspect task quality","Watch cost and latency","Review interventions"]},{"title":"Turn feedback into better evaluations.","text":"Add real failures to regression tests. Re-evaluate changes to prompts, retrieval, tools, and permissions.","checks":["Capture corrections","Re-test every change","Revisit the next useful task"]}]}},"about":{"headingA":"Engineering habits.","headingAccent":"A human perspective.","paragraphs":["I’m Mats. My approach starts with the people doing the work—the handoffs, the workarounds, and the details that a diagram can miss.","I care about solutions that are understandable, maintainable, and useful after the handoff. Sometimes that’s a bot. Sometimes it’s an API. Sometimes the process needs to change first."],"quote":"Good automation makes room for better work.","captionLeft":"MATS ØSTVIG","captionRight":"CURIOUS BY DEFAULT ↗"},"contact":{"headingA":"What would you take","headingB":"off your team’s plate?","sub":"A few sentences about the workflow are a good place to begin.","button":"Start a conversation","dialogKicker":"LET’S FIND THE RIGHT STARTING POINT","dialogTitle":"Tell me about the work.","dialogIntro":"A useful first conversation starts with three questions:","questions":["What task is taking too much time?","Which people and systems are involved?","What would a better outcome look like?"],"linkLabel":"Get in touch","linkUrl":""},"footer":{"tagline":"Thoughtful systems. Meaningful work."}};

function defaultPage() {
  const stages = (list) => list.map((s) => ({ title: s.title, text: s.text, checks: s.checks.slice() }));
  const chapters = (list) => list.map((c) => ({ ...c }));
  return {
    hero: {
      eyebrow: "Mats Østvig · Senior automation engineer", focusLabel: "Choose a focus",
      line1: "Some work is", accent: "worth handing over.",
      line1Ai: "AI with a", accentAi: "proper job to do.",
      lede: "I’m Mats. I build automations for the jobs that keep coming back: moving data, checking records and getting different systems to cooperate.",
      ledeAi: "I build AI agents that find information, use tools and handle specific tasks. I start with the work you need done, then work out where AI can help.",
      note: "Copying the same cells every Monday gets old.", noteAi: "An agent should be able to explain what it just did.",
      primaryLabel: "See how I work", secondaryLabel: "Start a conversation",
      storyLabel: "How it starts", storyQuote: "There has to be a better way to do this.",
    },
    work: { headingA: "A couple of ways", headingAccent: "this can work.", intro: "" },
    approach: {
      headingA: "From a recurring task", headingAccent: "to a working solution.", intro: "Here’s how I approach a project.\nScroll through the four parts below.",
      loopNote: "Improve feeds the next Identify pass. The loop is the point.",
      rpa: { principle: "The simplest reliable solution wins.", stages: stages(APPROACH_DEFAULTS.rpa), chapters: chapters([{"title": "Find out what keeps repeating.", "text": "I watch how the task gets done and ask what makes it tedious. Then I check how often it happens and whether the rules are stable enough to automate.", "aside": "Some tasks are easier to remove than automate.", "label": "Look at the work", "note": "Frequency, time spent and clear rules."}, {"title": "Put the process on paper.", "text": "I turn the handoffs, rules and awkward exceptions into a clear workflow. Then I choose the simplest reliable tool: an API, a script, or an RPA bot.", "aside": "The unusual cases tend to be the interesting ones.", "label": "Map the steps", "note": "Include decisions, exceptions and recovery."}, {"title": "Try it on the awkward cases.", "text": "Real data. Broken inputs. Timeouts. The automation runs alongside the existing process before a gradual rollout. Small steps, fewer surprises.", "aside": "Break it here. Not on someone’s Friday.", "label": "Start with a small rollout", "note": "Shadow → pilot → live. No dramatic button press."}, {"title": "Check what actually improved.", "text": "Track the runs, check the exceptions, and compare the results with the original baseline. Every improvement points to the next useful thing to automate.", "aside": "There’s usually something worth adjusting after the first month.", "label": "Compare the results", "note": "Compare the outcome with the original baseline."}]) },
      ai: { principle: "Autonomy is earned through evidence.", stages: stages(APPROACH_DEFAULTS.ai), chapters: chapters([{"title": "Find where people get stuck.", "text": "A question. Twelve tabs. Three almost-right documents. I look for a useful, bounded task where language and unstructured information are the real challenge.", "aside": "I keep the first version small enough to test properly.", "label": "Choose a specific task", "note": "Start with a problem. The model can wait."}, {"title": "Work out what the agent needs.", "text": "Map the context, trusted sources, tools and recovery paths. Build a small agent that can find the right evidence and take clearly defined actions.", "aside": "I want to see which source an answer came from.", "label": "Context → evidence → action", "note": "A useful agent knows where its boundaries are."}, {"title": "Test it before relying on it.", "text": "Check groundedness, tool behaviour and tricky cases. Compare results against an evaluation set, then start with a bounded pilot before widening the scope.", "aside": "A plausible answer can still be wrong.", "label": "Check the behaviour", "note": "Shadow → pilot → live. With checks at every step."}, {"title": "Use the mistakes to improve it.", "text": "Review quality, cost and execution traces. Turn real failures into new evaluation cases, then refine the prompts, retrieval and tools.", "aside": "A failure is useful when it becomes a test for next time.", "label": "Review and adjust", "note": "Keep evaluations up to date as the work changes."}]) },
    },
    about: {
      headingA: "I’m Mats.", headingAccent: "I like figuring things out.",
      paragraphs: [
        "I’m Mats. My approach starts with the people doing the work—the handoffs, the workarounds, and the details that a diagram can miss.",
        "I care about solutions that are understandable, maintainable, and useful after the handoff. Sometimes that’s a bot. Sometimes it’s an API. Sometimes the process needs to change first.",
      ],
      quote: "I want the team to be comfortable running it after I’ve handed it over.", captionLeft: "MATS ØSTVIG", captionRight: "RPA & AI",
      cue: "More about me",
      modal: {
        heading: "Hi, I’m Mats.", name: "Mats Østvig", role: "Senior automation engineer",
        intro: "I build RPA workflows and bounded AI agents that make room for more meaningful work.",
        tags: ["RPA", "Agentic AI", "Process design"],
        blocks: [
          { heading: "People first. Process next.", body: "My approach starts with the people doing the work—the handoffs, the workarounds, and the details a diagram can miss." },
          { heading: "Simple, reliable, maintainable.", body: "Sometimes the right solution is an API. Sometimes it’s a bot or a bounded AI agent. Sometimes the process needs to change first. I care about solutions that stay useful after the handoff." },
        ],
        quote: "I want the team to be comfortable running it after I’ve handed it over.",
        portrait: emptyWorkImage(),
      },
    },
    contact: {
      headingA: "What keeps landing", headingB: "on your to-do list?", sub: "Tell me the repetitive bit. We’ll start there.", button: "Tell me about it",
      dialogKicker: "Start a conversation", dialogTitle: "Tell me about the work.", dialogIntro: "A useful first conversation starts with three questions:",
      questions: ["What task is taking too much time?", "Which people and systems are involved?", "What would a better outcome look like?"],
      linkLabel: "Get in touch", linkUrl: "",
    },
    footer: { tagline: "RPA, AI and the work in between." },
  };
}

const pageStr = (v, fb, max) => (typeof v === "string" ? v.slice(0, max) : fb);
const pageObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
// Remove every saved value that still equals the previous default (see LEGACY_PAGE_DEFAULTS).
function dropLegacy(r, o) {
  const out = {};
  for (const k of Object.keys(r)) {
    const v = r[k], ov = o ? o[k] : undefined;
    if (typeof v === "string") { if (v !== ov) out[k] = v; }
    else if (Array.isArray(v)) {
      if (v.every((x) => typeof x === "string")) { if (JSON.stringify(v) !== JSON.stringify(ov)) out[k] = v; }
      else out[k] = v.map((x, i) => (x && typeof x === "object" && !Array.isArray(x) ? dropLegacy(x, Array.isArray(ov) ? ov[i] : undefined) : x));
    } else if (v && typeof v === "object") out[k] = dropLegacy(v, ov && typeof ov === "object" ? ov : undefined);
    else out[k] = v;
  }
  return out;
}
// A contact link is an email address (turned into mailto:) or an https:// address. Anything else is dropped.
function safeContactUrl(v) {
  const t = String(v || "").trim().slice(0, PAGE_LIMITS.url);
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(t)) return t;
  if (/^[^\s@:/]+@[^\s@]+\.[^\s@]+$/.test(t)) return "mailto:" + t;
  return /^https?:\/\/[^\s]+$/i.test(t) ? t : "";
}

function normalizeAboutModal(raw, d) {
  const m = pageObj(raw), L = PAGE_LIMITS;
  return {
    heading: pageStr(m.heading, d.heading, L.aboutHeading), name: pageStr(m.name, d.name, L.personName), role: pageStr(m.role, d.role, L.role), intro: pageStr(m.intro, d.intro, L.bioIntro),
    tags: Array.isArray(m.tags) ? m.tags.slice(0, L.maxTags).map((t) => pageStr(t, "", L.tag)).filter((t) => t.trim()) : d.tags.slice(),
    blocks: Array.isArray(m.blocks) ? m.blocks.slice(0, L.maxBlocks).map((b) => ({ heading: pageStr(pageObj(b).heading, "", L.blockHeading), body: pageStr(pageObj(b).body, "", L.blockText) })).filter((b) => b.heading.trim() || b.body.trim()) : d.blocks.map((b) => ({ ...b })),
    quote: pageStr(m.quote, d.quote, L.quote), portrait: normalizeWorkImage(m.portrait),
  };
}

// Any stored value -> a complete, safe page-text object (missing or malformed fields fall back to the defaults).
function normalizePage(rawIn) {
  const d = defaultPage(), L = PAGE_LIMITS;
  const r = pageObj(dropLegacy(pageObj(rawIn), LEGACY_PAGE_DEFAULTS));
  const h = pageObj(r.hero), w = pageObj(r.work), ap = pageObj(r.approach), ab = pageObj(r.about), c = pageObj(r.contact), f = pageObj(r.footer);
  const byIndex = (src, def, max) => def.map((dv, i) => pageStr(Array.isArray(src) ? src[i] : undefined, dv, max));
  const list = (src, def, max, cap) => (Array.isArray(src) ? src.slice(0, cap).map((x) => pageStr(x, "", max)).filter((t) => t.trim()) : def.slice());
  const modeBlock = (src, def) => {
    const m = pageObj(src), st = Array.isArray(m.stages) ? m.stages : [], ch = Array.isArray(m.chapters) ? m.chapters : [];
    return {
      principle: pageStr(m.principle, def.principle, L.principle),
      stages: def.stages.map((ds, i) => { const s = pageObj(st[i]); return { title: pageStr(s.title, ds.title, L.stageTitle), text: pageStr(s.text, ds.text, L.stageText), checks: byIndex(s.checks, ds.checks, L.check) }; }),
      chapters: def.chapters.map((dc, i) => { const x = pageObj(ch[i]); return { title: pageStr(x.title, dc.title, L.chapterTitle), text: pageStr(x.text, dc.text, L.chapterText), aside: pageStr(x.aside, dc.aside, L.chapterAside), label: pageStr(x.label, dc.label, L.chapterLabel), note: pageStr(x.note, dc.note, L.chapterNote) }; }),
    };
  };
  return {
    hero: {
      eyebrow: pageStr(h.eyebrow, d.hero.eyebrow, L.eyebrow), focusLabel: pageStr(h.focusLabel, d.hero.focusLabel, L.focusLabel),
      line1: pageStr(h.line1, d.hero.line1, L.headline), accent: pageStr(h.accent, d.hero.accent, L.headline), line1Ai: pageStr(h.line1Ai, d.hero.line1Ai, L.headline), accentAi: pageStr(h.accentAi, d.hero.accentAi, L.headline),
      lede: pageStr(h.lede, d.hero.lede, L.lede), ledeAi: pageStr(h.ledeAi, d.hero.ledeAi, L.lede), note: pageStr(h.note, d.hero.note, L.note), noteAi: pageStr(h.noteAi, d.hero.noteAi, L.note),
      primaryLabel: pageStr(h.primaryLabel, d.hero.primaryLabel, L.label), secondaryLabel: pageStr(h.secondaryLabel, d.hero.secondaryLabel, L.label),
      storyLabel: pageStr(h.storyLabel, d.hero.storyLabel, L.storyLabel), storyQuote: pageStr(h.storyQuote, d.hero.storyQuote, L.storyQuote),
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
      cue: pageStr(ab.cue, d.about.cue, L.cue), modal: normalizeAboutModal(ab.modal, d.about.modal),
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
  const pr = pageObj(pageObj(pageObj(r.about).modal).portrait);
  if (pr.kind === "url" && typeof pr.url === "string" && pr.url.trim() && !safeImageUrl(pr.url)) errors.push({ section: "about", text: "The portrait's web address isn't valid — use https://… or a file in the site's public folder." });
  if (![n.hero.line1, n.hero.accent].some((t) => t.trim())) warnings.push({ section: "hero", text: "The hero headline is empty." });
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
const MR_CSS = String.raw`@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600&display=swap');
.mr-app{--bg:#f8f7f3;--ink:#172033;--secondary:#586477;--blue:#3b60c5;--border:#dce2eb;font-family:'Source Sans 3',Arial,sans-serif;color:var(--ink);background:var(--bg);min-height:100vh}
.mr-app *{box-sizing:border-box}
.mr-app button,.mr-app input{font:inherit}
.mr-app button{cursor:pointer}
.mr-app a{color:inherit;text-decoration:none}
.mr-app :focus-visible{outline:3px solid #7694e1;outline-offset:5px}
.mr-app section[id]{scroll-margin-top:30px}
.mr-header{max-width:1272px;margin:auto;padding:27px 36px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4e3de;gap:25px}
.mr-brand{font-family:'Source Serif 4',Georgia,serif;font-size:27px;font-weight:700;letter-spacing:-1px;display:flex;align-items:center}
.mr-logomark{font-family:monospace;font-size:24px;letter-spacing:-5px;color:var(--blue);margin-right:16px}
.mr-period{color:var(--blue)}
.mr-header nav{display:flex;gap:38px;font-size:13px;color:var(--secondary)}
.mr-header nav a:hover{color:var(--blue)}
.mr-headercta{border:1px solid #ccd4e0;padding:10px 17px;border-radius:5px;font-size:12px}
.mr-headercta span{margin-left:27px;color:var(--blue)}
.mr-app main{max-width:1200px;margin:auto;padding:0 24px}
.mr-hero{display:grid;grid-template-columns:1.2fr 1fr;gap:45px;padding:76px 0 59px;align-items:center}
.mr-kicker{font-family:'Source Sans 3',Arial,sans-serif;font-size:9px;font-weight:500;letter-spacing:1.6px;color:#697588;display:flex;align-items:center;gap:9px}
.mr-kicker>i{width:5px;height:5px;background:#bd8c5f;border-radius:50%}
.mr-hero h1{font-family:'Source Serif 4',Georgia,serif;font-size:55px;line-height:1.13;letter-spacing:-2.4px;font-weight:500;margin:24px 0}
.mr-app em{font-style:normal;color:var(--blue)}
.mr-herocopy>p{font-size:15px;line-height:1.85;color:var(--secondary);max-width:465px}
.mr-actions{display:flex;gap:23px;align-items:center;margin-top:28px}
.mr-primary{display:inline-flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 18px;background:var(--blue);color:#fff!important;border-radius:5px;font-size:12px}
.mr-primary:hover{background:#2b4ca9}
.mr-textlink{font-size:11px;display:flex;gap:13px;color:var(--secondary)!important}
.mr-heronote{display:flex;align-items:center;gap:12px;margin-top:30px;font-size:10px;color:#737d87}
.mr-heronote>span{font-size:19px;font-weight:400;color:#bf956f}
.mr-system{background:#eff2f8;border:1px solid #dbe2ef;border-radius:12px;overflow:hidden;box-shadow:0 17px 33px #2d436b06}
.mr-systemtop{display:flex;align-items:center;justify-content:space-between;padding:17px 20px 0;color:#7184a4;font-size:8px;letter-spacing:1.3px}
.mr-systemtop button{border:1px solid #cfdaee;border-radius:5px;width:25px;height:25px;background:#f7f9fe;font-size:11px;color:#617dac}
.mr-systemtitle{display:flex;justify-content:space-between;align-items:center;padding:12px 20px 0;color:#405a8b;font-size:13px}
.mr-systemtitle small{font-family:monospace;font-size:8px;color:#8192af}
.mr-diagram{position:relative;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;height:255px;padding:16px 14px 0;background-image:radial-gradient(#c4cfe4 .7px,transparent .7px);background-size:18px 18px}
.mr-connections{position:absolute;inset:0;width:100%;height:100%}
.mr-node{z-index:1;align-self:center;justify-self:center;display:flex;align-items:center;flex-direction:column;gap:10px}
.mr-node>span{width:48px;height:48px;border:1px solid #ced9ed;background:#f8faff;border-radius:12px;color:#6884bd;display:grid;place-items:center;transition:background .3s,color .3s}
.mr-node small{font-size:9px;color:#6880a7}
.mr-node.active>span{background:var(--blue);color:white;border-color:var(--blue);box-shadow:0 0 0 5px #dce5f9}
.mr-node.active small{color:var(--blue);font-weight:600}
.mr-systemstatus{padding:13px 20px;border-top:1px solid #dbe3f0;font-size:9px;display:flex;flex-direction:column;gap:8px;min-height:64px;color:#4f6b9e}
.mr-systemstatus b{font-weight:400;margin:0 5px;color:#8297bb}
.mr-systemstatus i{display:inline-block;background:#80a286;width:4px;height:4px;border-radius:50%;margin-right:5px}
.mr-systemstatus small{font-size:6px;letter-spacing:1.1px;color:#7c8ca6}
.mr-mode{background:#f8f9fc;display:flex;align-items:center;justify-content:space-between;padding:12px 17px;border-top:1px solid #dbe3f0;font-size:9px;color:#71809b}
.mr-mode>div{display:flex;background:#e8edf7;border-radius:5px;padding:3px;gap:2px}
.mr-mode button{background:none;border:0;color:#6d7e9c;font-size:10px;padding:7px 12px;border-radius:3px}
.mr-mode button.active{background:#fff;color:var(--blue);box-shadow:0 1px 3px #3046670c}
.mr-values{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:24px 0;border-top:1px solid #e2e3de;border-bottom:1px solid #e2e3de;font-size:11px;color:#66717c}
.mr-values>span:first-child{font-size:8px;letter-spacing:1.3px;color:#89918e}
.mr-values b{font-weight:400;font-size:15px;color:#c29e7a}
.mr-work{padding:64px 0 55px}
.mr-sectionhead{display:flex;align-items:end;justify-content:space-between;gap:30px}
.mr-app h2{font-family:'Source Serif 4',Georgia,serif;font-size:35px;font-weight:500;letter-spacing:-1.4px;line-height:1.2;margin:15px 0 0}
.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0}
.mr-workgrid{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-top:31px}
.mr-project{display:flex;flex-direction:column;text-align:left;min-width:0;border:1px solid #dfe3e9;border-radius:10px;background:#fff;padding:0;overflow:hidden;transition:transform .2s,box-shadow .2s}
.mr-project:hover{transform:translateY(-3px);box-shadow:0 12px 25px #213e6310}
.mr-projectart{position:relative;background:var(--art-bg,#edf2fb);min-height:245px;padding:18px 23px 26px;border-bottom:1px solid var(--art-edge,#dfe7f3)}
.mr-artlabel{display:flex;justify-content:space-between;gap:14px;font-size:7px;letter-spacing:.7px;color:var(--art-label,#7288b3)}
.mr-artlabel>span:last-child{font-size:6px;color:var(--art-mute,#7f8fac)}
.mr-invoiceflow{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:27px}
.mr-invoice{width:131px;padding:16px 14px;background:var(--art-surface,#fff);border:1px solid var(--art-line,#cfdbee);border-radius:7px;transform:rotate(-4deg);box-shadow:0 8px 15px #3b60c509}
.mr-doc{color:var(--art-accent,#7994ca);display:block}
.mr-invoice>strong{display:block;font-size:10px;color:var(--art-ink,#4d6696);margin:10px 0}
.mr-invoiceline{display:block;height:4px;border-radius:2px;background:var(--art-soft,#e2e9f5);margin-top:6px}
.mr-invoiceline.short{width:65%}
.mr-invoice>small{display:block;font-family:monospace;font-size:7px;color:var(--art-mute,#91a1bb);margin-top:11px}
.mr-flowarrow{font-size:22px;color:var(--art-accent,#8fa6d0)}
.mr-resultcards{display:flex;flex-direction:column;gap:12px}
.mr-resultcards>div{position:relative;border:1px solid var(--art-line,#cbd9ee);background:var(--art-surface,#f9fbff);border-radius:6px;padding:12px 15px 12px 34px;min-width:146px}
.mr-resultcards>div>span{position:absolute;left:12px;top:15px;font-size:12px;color:#729783}
.mr-resultcards strong{display:block;font-size:10px;font-weight:500;color:var(--art-ink,#5b729b)}
.mr-resultcards small{display:block;font-size:8px;margin-top:4px;color:var(--art-mute,#7d90b0)}
.mr-resultcards>div:last-child{background:#fcf7f0;border-color:#e5d6c0}
.mr-resultcards>div:last-child>span{color:#b59263}
.mr-aiart{background:var(--art-bg,#f3eee7);border-color:var(--art-edge,#e8dfd1)}
.mr-aiart .mr-artlabel{color:var(--art-label,#9d8b76)}
.mr-answer{max-width:320px;margin:24px auto 0;border:1px solid var(--art-line,#ded3c3);background:var(--art-surface,#fffdf8);border-radius:7px;box-shadow:0 7px 15px #66451e05;overflow:hidden}
.mr-answerquestion{padding:10px 13px;font-size:9px;color:var(--art-mute,#86745f);border-bottom:1px solid var(--art-edge,#ebe3d7);display:flex;gap:8px;align-items:center}
.mr-answerquestion>span{font-family:monospace;font-size:9px;color:var(--art-accent,#a18b70)}
.mr-answerbody{padding:13px;display:flex;gap:11px}
.mr-spark{font-size:21px;color:var(--art-accent,#b28e61)}
.mr-answerbody strong{font-size:11px;font-weight:500;color:var(--art-ink,#756650)}
.mr-answerbody p{font-size:9px;line-height:1.6;color:var(--art-mute,#9c8a72);margin:5px 0 8px}
.mr-source{font-size:7px;color:var(--art-ink,#977953);background:var(--art-soft,#f4ecdf);padding:4px 6px;border-radius:3px}
.mr-approval{border-top:1px solid var(--art-edge,#ebe3d7);padding:9px 13px;font-size:8px;color:var(--art-mute,#8e7a60);display:flex;align-items:center;gap:6px}
.mr-approval i{width:4px;height:4px;background:var(--art-accent,#bc965f);border-radius:50%}
.mr-approval>span{margin-left:auto;color:var(--art-mute,#9e9875)}
.mr-projectbody{flex:1;padding:23px 25px;background:#fff}
.mr-projectbody .mr-kicker{font-size:8px;letter-spacing:1px;color:#7c8899}
.mr-project h3{font-family:'Source Serif 4',Georgia,serif;font-size:22px;letter-spacing:-.6px;font-weight:500;color:var(--ink);margin:12px 0;display:flex;justify-content:space-between;gap:12px}
.mr-project h3>span{color:var(--blue);font-weight:400;font-size:21px}
.mr-projectbody>p{font-size:12px;line-height:1.8;color:var(--secondary);margin:0;max-width:400px}
.mr-caseaction{display:flex;gap:13px;margin-top:19px;font-size:10px;color:var(--blue)}
.mr-example-note{font-size:9px;line-height:1.6;color:#79818a;margin:15px 0 0}
.mr-approach{padding:24px 0 50px}
.mr-approachintro{text-align:right}
.mr-modebadge{display:inline-block;background:#eaf0fc;border:1px solid #d9e3f5;border-radius:4px;padding:5px 8px;font-size:7px;letter-spacing:1px;color:#6280b9;margin-top:10px}
.mr-stagebuttons{display:grid;grid-template-columns:repeat(8,1fr);margin-top:29px;border-bottom:1px solid #d4ddeb}
.mr-stagebuttons button{background:none;text-align:left;border:0;border-bottom:2px solid transparent;min-width:0;padding:13px 10px 17px;color:#7b8695;font-size:12px}
.mr-stagebuttons small{font-size:8px;display:block;font-family:monospace;margin-bottom:8px;color:#909baa}
.mr-stagebuttons button.active{color:var(--blue);border-bottom-color:var(--blue);background:linear-gradient(transparent,#edf2fc)}
.mr-stagebuttons button.active small{color:var(--blue)}
.mr-stagecontent{display:grid;grid-template-columns:95px 1fr 210px;gap:36px;padding:32px 8px}
.mr-stagenumber{font-family:'Source Serif 4',Georgia,serif;font-size:60px;line-height:1;letter-spacing:-3px;color:#c3cddd}
.mr-stagenumber>span{display:block;font-size:10px;letter-spacing:1px;color:#8696ac;margin:8px 0 26px}
.mr-stagenumber>svg{color:#a4b5d5}
.mr-stagetext h3{font-family:'Source Serif 4',Georgia,serif;font-weight:500;font-size:24px;letter-spacing:-.7px;line-height:1.3;margin:12px 0}
.mr-stagetext>p{font-size:13px;line-height:1.8;color:var(--secondary);margin:0}
.mr-stagechecks{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:18px;font-size:9px;color:#69798c}
.mr-stagechecks b{font-weight:400;color:#84a091;margin-right:6px}
.mr-stageaside{border-left:1px solid #dfe4eb;padding-left:24px}
.mr-stageaside .mr-kicker{font-size:7px;letter-spacing:1.2px}
.mr-stageaside>p{font-family:'Source Serif 4',Georgia,serif;font-size:19px;line-height:1.4;color:#687d9e;margin:14px 0 20px}
.mr-stageaside>div{display:flex;gap:9px}
.mr-stageaside button{width:32px;height:32px;background:#fff;border:1px solid #d4deeb;border-radius:50%;font-size:13px;color:#6882aa}
.mr-loopnote{display:flex;gap:9px;color:#8096b8;font-size:17px;padding:0 8px}
.mr-loopnote>span{font-size:10px;color:#7d8a9b;align-self:center}
.mr-about{display:grid;grid-template-columns:.8fr 1.3fr;gap:65px;align-items:center;border-top:1px solid #e1e3df;padding:49px 0}
.mr-aboutart{position:relative;display:grid;place-items:center;overflow:hidden;min-height:285px;background:#e8edf7;border:1px solid #dae2ef;border-radius:10px}
.mr-aboutmonogram{font-family:'Source Serif 4',Georgia,serif;font-size:142px;letter-spacing:-15px;color:#758ec4;z-index:1}
.mr-aboutmonogram>span{color:#c5a480}
.mr-aboutartbottom{position:absolute;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;z-index:1;font-size:7px;letter-spacing:1px;color:#6c83ac}
.mr-orbit{position:absolute;width:300px;height:300px;border:1px solid #d3ddec;border-radius:50%;left:-70px;top:-120px}
.mr-orbit.two{width:400px;height:400px;top:-165px;left:-120px}
.mr-orbit.three{width:500px;height:500px;left:-170px;top:-210px}
.mr-aboutcopy h2{margin:18px 0 21px;font-size:32px}
.mr-aboutcopy>p{font-size:13px;line-height:1.85;color:var(--secondary);max-width:540px}
.mr-personalnote{display:flex;gap:12px;align-items:center;font-size:11px;color:#738096;margin-top:21px}
.mr-personalnote>span{font-family:Georgia;font-size:39px;line-height:1;color:#c7a787}
.mr-contact{background:#253d75;color:#fff;border-radius:11px;padding:36px 40px;overflow:hidden}
.mr-contact .mr-kicker{color:#bccbeb;font-size:8px}
.mr-contact>div:nth-child(2){display:flex;justify-content:space-between;align-items:center;gap:25px}
.mr-contact h2{font-size:35px;line-height:1.17;color:#fbfaf5;margin:17px 0}
.mr-contactbutton{flex-shrink:0;border:1px solid #e6e3d9;border-radius:5px;background:#f8f4e9;padding:13px 17px;font-size:11px;color:#3e527f;display:flex;gap:27px}
.mr-contact>p{font-size:10px;color:#b6c6e7;margin:3px 0 0}
.mr-footer{max-width:1200px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:28px 24px}
.mr-footer .mr-brand{font-size:22px}
.mr-footer>span,.mr-footer>a:last-child{font-size:9px;color:#737f8d}
.mr-overlay{position:fixed;inset:0;z-index:99;background:#17203377;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px}
.mr-modal{position:relative;background:var(--bg);border:1px solid #dbe1e8;border-radius:12px;max-width:610px;width:100%;max-height:90vh;overflow:auto;padding:39px}
.mr-close{position:absolute;top:11px;right:14px;border:0;background:none;font-size:26px;color:#78859a}
.mr-modal h2{font-size:30px;margin:20px 0 25px}
.mr-modal h3{font-size:13px;margin:22px 0 10px}
.mr-modal p,.mr-modal li{font-size:13px;line-height:1.9;color:var(--secondary)}
.mr-modal ol{padding-left:19px}
.mr-previewnotice{padding:14px;border:1px solid #e1dacd;border-radius:5px;background:#f3efe6;color:#89785e;font-size:10px;line-height:1.7;margin-top:23px}
@media(prefers-reduced-motion:reduce){.mr-app *{transition:none!important}
}
@media(max-width:1050px){.mr-hero{gap:26px}
.mr-hero h1{font-size:45px}
.mr-systemtitle{font-size:11px}
.mr-actions{gap:16px}
.mr-textlink{font-size:10px}
.mr-stagecontent{grid-template-columns:75px 1fr 170px;gap:25px}
.mr-invoiceflow{gap:12px}
.mr-projectart{padding:17px}
.mr-project h3{font-size:20px}
.mr-about{gap:35px}
}
@media(max-width:720px){.mr-header{padding:20px;gap:15px;flex-wrap:wrap}
.mr-brand{font-size:25px}
.mr-header nav{order:3;width:100%;justify-content:center;gap:40px;font-size:12px;padding-top:13px}
.mr-headercta{margin-left:auto;font-size:11px}
.mr-app main{padding:0 20px}
.mr-hero{grid-template-columns:1fr;padding:36px 0;gap:30px}
.mr-hero h1{font-size:43px;letter-spacing:-1.9px}
.mr-herocopy>.mr-kicker{font-size:7px;letter-spacing:1px}
.mr-herocopy>p{font-size:15px}
.mr-actions{flex-wrap:wrap;gap:18px}
.mr-primary{font-size:12px}
.mr-textlink{font-size:12px}
.mr-system{width:100%;max-width:480px;margin:auto}
.mr-values{flex-wrap:wrap;justify-content:center;gap:15px 20px;font-size:10px}
.mr-values>span:first-child{width:100%;text-align:center}
.mr-values b{display:none}
.mr-work{padding:36px 0}
.mr-sectionhead{display:block}
.mr-app h2{font-size:29px}
.mr-sectionhead>p,.mr-approachintro>p{font-size:12px;margin-top:17px}
.mr-workgrid{grid-template-columns:1fr;gap:22px}
.mr-projectbody{padding:22px}
.mr-project h3{font-size:23px}
.mr-projectbody>p{font-size:13px}
.mr-projectart{min-height:235px}
.mr-example-note{font-size:10px}
.mr-approach{padding:13px 0 35px}
.mr-approachintro{text-align:left}
.mr-stagebuttons{grid-template-columns:repeat(4,1fr);gap:4px}
.mr-stagebuttons button{padding:12px 9px;min-height:65px}
.mr-stagecontent{grid-template-columns:50px 1fr;gap:18px;padding:25px 0}
.mr-stagenumber{font-size:43px}
.mr-stagenumber>svg{width:32px}
.mr-stagetext h3{font-size:22px}
.mr-stageaside{grid-column:2;border-left:0;border-top:1px solid #dfe4eb;padding:20px 0 0}
.mr-stageaside>p{font-size:18px}
.mr-stagechecks{font-size:10px;display:grid}
.mr-stageaside button{width:40px;height:40px}
.mr-loopnote{padding:0;font-size:19px}
.mr-about{grid-template-columns:1fr;padding:30px 0;gap:28px}
.mr-aboutart{min-height:225px}
.mr-aboutcopy h2{font-size:29px}
.mr-aboutcopy>p{font-size:14px}
.mr-contact{padding:28px 23px}
.mr-contact>div:nth-child(2){display:block}
.mr-contact h2{font-size:30px;margin:19px 0 23px}
.mr-contact>p{margin-top:20px;line-height:1.7}
.mr-footer{padding:25px 20px}
.mr-footer>span{display:none}
.mr-modal{padding:32px 24px}
.mr-systemstatus{font-size:8px}
.mr-systemstatus small{font-size:6px}
}
/* Additions for the Senior-Automation-Engineer integration (not part of the MagicPath export) */
body.mr-body{margin:0;background:#fdf7eb}
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
@keyframes mr-logo-draw{from{stroke-dashoffset:1}
to{stroke-dashoffset:0}
}
@keyframes mr-logo-forward{0%{opacity:.3;transform:translateX(-5px)}
65%{opacity:1;transform:translateX(1px)}
100%{opacity:1;transform:translateX(0)}
}
@keyframes mr-logo-word{from{opacity:.6;transform:translateY(2px)}
to{opacity:1;transform:translateY(0)}
}
@keyframes mr-logo-dot{0%,25%{transform:scale(.6)}
65%{transform:scale(1.2)}
100%{transform:scale(1)}
}
@keyframes mr-logo-spark{0%,25%{opacity:0;transform:scale(.5)}
55%{opacity:.85;transform:scale(1)}
100%{opacity:0;transform:scale(1.15)}
}
@media(prefers-reduced-motion:reduce){.mr-logo-motion *{animation:none!important;transition:none!important}
.mr-logo-bracket{stroke-dashoffset:0}
.mr-logo-spark{opacity:0}
}
/* Shared perspective controls and focused interaction polish. */
.mr-hero-focus{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:28px}
.mr-focus-label{font-size:8px;letter-spacing:1.5px;color:#68768c;font-weight:500}
.mr-focus-switch{position:relative;display:inline-grid;grid-template-columns:1fr 1.45fr;gap:0;isolation:isolate;padding:4px;border:1px solid #d4dce9;border-radius:12px;background:#eaeef6;min-width:235px;box-shadow:inset 0 1px 2px #203e6810}
.mr-focus-slider{position:absolute;z-index:-1;left:4px;top:4px;bottom:4px;width:calc((100% - 8px)/2.45);background:#3b60c5;border-radius:8px;box-shadow:0 3px 7px #3b60c52b;transition:left .3s cubic-bezier(.2,.7,.2,1),width .3s cubic-bezier(.2,.7,.2,1)}
.mr-focus-slider.is-ai{left:calc(4px + (100% - 8px)/2.45);width:calc((100% - 8px)*1.45/2.45)}
.mr-focus-switch button{display:flex;justify-content:center;align-items:center;gap:8px;min-height:37px;border:0;background:transparent;border-radius:8px;color:#60718d;font-size:11px;font-weight:500;padding:0 16px;transition:color .2s}
.mr-focus-switch button[aria-pressed=true]{color:#fff}
.mr-focus-switch button[aria-pressed=false]:hover{color:#3b60c5}
.mr-focus-switch button>span{font-size:15px}
.mr-approachintro .mr-focus-switch{margin-top:13px;text-align:left}
.mr-hero h1{font-size:clamp(36px,4.6vw,55px)}
.mr-herocopy>p{min-height:84px}
.mr-project{transition:transform .25s,box-shadow .25s,border-color .25s}
.mr-project:hover{transform:translateY(-4px);border-color:#b7c7e6;box-shadow:0 18px 35px -20px #294b8555}
.mr-caseaction>span,.mr-project h3>span{display:inline-block;transition:transform .25s}
.mr-project:hover .mr-caseaction>span{transform:translateX(4px)}
.mr-project:hover h3>span{transform:translate(2px,-2px)}
.mr-stagebuttons button{transition:background .2s,border-color .2s,color .2s}
.mr-stagebuttons button:not(.active):hover{background:#edf1f9;border-color:#bccde9}
.mr-stagecontent{animation:mr-stage-enter .35s ease both}
.mr-contactbutton{transition:transform .2s,box-shadow .2s}
.mr-contactbutton:hover{transform:translateY(-2px);box-shadow:0 6px 15px #17203318}
.ls-bottom>span:last-child{font-size:7px;letter-spacing:.7px;color:#7185a5}
.mr-app a,.mr-app button{-webkit-tap-highlight-color:#3b60c522}
@keyframes mr-stage-enter{from{opacity:.65;transform:translateY(5px)}
to{opacity:1;transform:translateY(0)}
}
@media(max-width:720px){.mr-hero-focus{margin-bottom:23px;gap:9px}
.mr-focus-switch{min-width:225px}
.mr-focus-switch button{min-height:40px}
.mr-herocopy>p{min-height:0}
.mr-approachintro .mr-focus-switch{margin-top:10px}
.mr-hero h1{font-size:clamp(35px,8.4vw,48px)}
}
@media(prefers-reduced-motion:reduce){.mr-focus-slider,.mr-focus-switch button,.mr-project,.mr-caseaction>span,.mr-project h3>span,.mr-contactbutton{transition:none}
.mr-stagecontent{animation:none}
.mr-project:hover,.mr-contactbutton:hover{transform:none}
}

.mr-about-link{border-radius:14px;cursor:pointer}.mr-about-cta{display:inline-flex;align-items:center;gap:24px;font-size:12px;font-weight:600;color:#3b60c5;margin-top:14px}.mr-about-cta>span{transition:transform .2s}.mr-about-link:hover .mr-about-cta>span{transform:translate(2px,-2px)}.mr-about-modal{width:min(680px,calc(100vw - 32px));max-width:680px}.mr-profile-card{display:grid;grid-template-columns:145px 1fr;gap:25px;align-items:center;margin:25px 0 28px;padding-bottom:27px;border-bottom:1px solid #dce2eb}.mr-profile-portrait{aspect-ratio:4/5;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(140deg,#f4f6fc,#e4ebf8);border:1px solid #d6e0f0;border-radius:10px}.mr-profile-portrait>span{font-family:'Source Serif 4',Georgia,serif;font-size:75px;letter-spacing:-5px;color:#3b60c5}.mr-profile-portrait>span>span{color:#9ab0db}.mr-profile-portrait small{font-size:6px;letter-spacing:1px;color:#7b8ba5;margin-top:12px}.mr-profile-card h3{margin:10px 0!important;font-size:17px!important}.mr-profile-card p{font-size:13px!important}.mr-profile-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:13px}.mr-profile-tags>span{font-size:9px;padding:5px 8px;border:1px solid #d5dfed;border-radius:4px;color:#58719b;background:#f3f6fb}.mr-profile-detail h3{font-size:15px!important}.mr-profile-detail p{font-size:13px!important;line-height:1.8!important}.mr-profile-quote{margin:25px 0 0;padding:18px 20px;background:#eef2fa;border-left:2px solid #3b60c5;border-radius:0 7px 7px 0;color:#3b60c5;font-size:16px;line-height:1.6;font-family:'Source Serif 4',Georgia,serif}@media(max-width:480px){.mr-profile-card{grid-template-columns:100px 1fr;gap:16px}.mr-profile-portrait>span{font-size:60px}.mr-profile-portrait small{font-size:5px}.mr-profile-card h3{font-size:15px!important}.mr-profile-tags>span{font-size:8px}.mr-profile-quote{font-size:14px;padding:15px}}@media(prefers-reduced-motion:reduce){.mr-about-cta>span{transition:none}}

.ls-story{position:relative;isolation:isolate;min-width:0;overflow:hidden;border:1px solid #d2dcef;border-radius:23px;background:radial-gradient(ellipse at 0 0,#fff 0,transparent 60%),radial-gradient(ellipse at 100% 40%,#dde8ff88,transparent 65%),#edf2fb;box-shadow:0 28px 65px -35px #24478566,0 2px 6px #24478508,inset 0 1px #fff;font-family:'Source Sans 3',Arial,sans-serif}.ls-story:before{content:'';position:absolute;top:0;left:14%;right:14%;height:1px;background:linear-gradient(90deg,transparent,#fff,transparent);pointer-events:none}.ls-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:23px 23px 0;font-size:7px;font-weight:600;letter-spacing:1.25px;color:#5a729c}.ls-top>span:first-child{display:flex;align-items:center;gap:7px}.ls-statuslight{width:5px;height:5px;background:#527bdd;border-radius:50%;box-shadow:0 0 0 3px #527bdd12}.ls-demo{white-space:nowrap;font-size:6px;letter-spacing:.8px;border:1px solid #cbd8ed;background:#ffffff70;padding:5px 6px;border-radius:5px}.ls-heading{padding:16px 23px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.ls-heading strong{font-family:'Source Serif 4',Georgia,serif;font-size:18px;font-weight:500;letter-spacing:-.55px;color:#263f6b}.ls-heading>span{font-size:18px;color:#3b60c5;font-family:monospace}.ls-heading small{font-size:9px;color:#7184a5}.ls-canvas{position:relative}.ls-canvas>svg{display:block;width:100%;height:auto;overflow:visible}.ls-paper{filter:drop-shadow(0 8px 9px #314f8617)}.ls-node{color:#6a85b4;cursor:pointer;outline:none}.ls-nodeface{stroke:#c7d5ed;stroke-width:1;filter:drop-shadow(0 3px 3px #31538508);transition:stroke .25s,filter .25s,fill .25s}.ls-node>text{font-family:'Source Sans 3',Arial,sans-serif;font-size:10px;fill:#587199}.ls-node>text.ls-nodenumber{font-family:monospace;font-size:7px;fill:#8b9dbc;letter-spacing:1px}.ls-node.ls-active{color:#fff}.ls-active>.ls-nodeface{stroke:#557bce;filter:drop-shadow(0 6px 8px #315ec53d)}.ls-active>text{fill:#315bbb;font-weight:600}.ls-complete{color:#4d71b2}.ls-complete>.ls-nodeface{fill:#edf3ff;stroke:#b6c9eb}.ls-node:hover>.ls-nodeface,.ls-node:focus-visible>.ls-nodeface{stroke:#315bbb;stroke-width:2.5;filter:drop-shadow(0 4px 6px #315ec52b)}.ls-halo{transform-box:fill-box;transform-origin:center;animation:ls-breathe 2.4s ease-in-out infinite}.ls-signal{animation:ls-signal-pulse 2.4s ease-in-out infinite}.ls-signal-soft{opacity:.25}.ls-scene{animation:ls-reveal .65s cubic-bezier(.2,.7,.2,1) both}.ls-caption{padding:18px 23px 12px;border-top:1px solid #fff;background:linear-gradient(120deg,#ffffffa8,#f6f8ff70)}.ls-caption>div{display:flex;align-items:center;gap:10px}.ls-stagepill{display:grid;place-items:center;width:27px;height:24px;border:1px solid #ccd9f1;border-radius:7px;background:#e9effb;color:#4569ba;font:10px monospace}.ls-caption strong{font-family:'Source Serif 4',Georgia,serif;font-size:17px;font-weight:500;color:#233e70}.ls-captionnote{margin-left:auto;font-size:6px;letter-spacing:.9px;color:#7285a4}.ls-caption p{font-size:12px;line-height:1.75;color:#566e94;margin:10px 0 0;min-height:42px;animation:ls-copy .4s ease both}.ls-timeline{display:flex;gap:4px;padding:0 23px 15px;background:#f7f9fdb3}.ls-timeline>span{flex:1;height:3px;background:#dce5f4;overflow:hidden;border-radius:4px}.ls-timeline i{display:block;width:100%;height:100%;background:#547bd5;transform:scaleX(0);transform-origin:left}.ls-timeline .done i{transform:scaleX(1)}.ls-timeline .current i{animation:ls-fill 4.8s linear both}.ls-story:not(.ls-running) .ls-timeline .current i{animation:none;transform:scaleX(1)}.ls-controls{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 20px 16px;background:#f7f9fdb3}.ls-controls>div{display:flex;gap:5px}.ls-controls button{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:32px;padding:0 9px;border:1px solid #d0dcf0;border-radius:9px;background:#ffffffb8;color:#526e9e;font-size:13px;transition:background .2s,transform .2s,box-shadow .2s}.ls-controls button.ls-play{background:#3b60c5;border-color:#3b60c5;color:white;padding:0 12px;box-shadow:0 3px 6px #3b60c51c}.ls-controls button span{font-size:10px}.ls-controls button:hover{transform:translateY(-1px);box-shadow:0 4px 9px #315ec518}.ls-controls button:focus-visible,.ls-bottom button:focus-visible{outline:2px solid #3b60c5;outline-offset:3px}.ls-controlhint{font-size:8px;color:#6c81a3;text-align:right}.ls-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 20px;border-top:1px solid #dbe3f1;background:#fdfefe90}.ls-bottom>span{display:flex;align-items:center;gap:6px;color:#7587a1;font-size:8px}.ls-bottom>span i{width:4px;height:4px;background:#8c9fbc;border-radius:50%}.ls-bottom>div{display:flex;gap:2px;border:1px solid #dde5f2;background:#e9eef8;border-radius:8px;padding:3px}.ls-bottom button{cursor:pointer;border:0;background:none;border-radius:5px;padding:7px 12px;color:#60779d;font-size:10px;transition:background .25s,color .25s}.ls-bottom button.active{background:#fff;color:#315bbb;box-shadow:0 2px 4px #294a7d12}.sv-search{animation:sv-search 4s ease-in-out infinite}.sv-grow{transform-box:fill-box;transform-origin:left;animation:sv-grow 1.5s cubic-bezier(.2,.7,.2,1) both}.sv-draw,.sv-chart{stroke-dasharray:400;stroke-dashoffset:400;animation:sv-draw 2.8s ease forwards}.sv-check{animation:sv-check .6s ease-out both;transform-box:fill-box;transform-origin:center}.sv-document{animation:sv-document 3.6s ease-in-out infinite}.sv-server{animation:sv-server .8s ease both}.sv-link{animation:sv-link 1s linear infinite}.ls-story :is(.ls-halo,.ls-signal,.ls-scene,.sv-search,.sv-grow,.sv-draw,.sv-chart,.sv-check,.sv-document,.sv-server,.sv-link){animation-play-state:paused}.ls-running :is(.ls-halo,.ls-signal,.ls-scene,.sv-search,.sv-grow,.sv-draw,.sv-chart,.sv-check,.sv-document,.sv-server,.sv-link){animation-play-state:running}.ls-story:not(.ls-running) :is(.ls-scene,.sv-grow,.sv-check,.sv-server){animation:none}.ls-story:not(.ls-running) :is(.sv-draw,.sv-chart){animation:none;stroke-dashoffset:0}
@keyframes ls-signal-pulse{0%,100%{opacity:.6}50%{opacity:1}}@keyframes ls-breathe{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.7;transform:scale(1.065)}}@keyframes ls-reveal{from{opacity:.75;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes ls-copy{from{opacity:.25;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}@keyframes ls-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes sv-search{0%,100%{transform:translateX(-25px)}50%{transform:translateX(45px)}}@keyframes sv-grow{from{transform:scaleX(.12)}to{transform:scaleX(1)}}@keyframes sv-draw{to{stroke-dashoffset:0}}@keyframes sv-check{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}@keyframes sv-document{0%,100%{fill:#eef3fc}50%{fill:#dde9ff;stroke:#92afe7}}@keyframes sv-server{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes sv-link{to{stroke-dashoffset:-12}}
@media(max-width:720px){.ls-story{border-radius:18px}.ls-top{padding:20px 17px 0;font-size:6px;letter-spacing:.8px}.ls-heading{padding:15px 17px 10px}.ls-heading strong{font-size:17px}.ls-caption{padding:16px 18px 12px}.ls-captionnote{font-size:5.5px;letter-spacing:.5px}.ls-caption p{font-size:12px;min-height:42px}.ls-timeline{padding-left:18px;padding-right:18px}.ls-controls{padding:0 15px 15px;gap:7px}.ls-controls button{height:36px;min-width:34px}.ls-controlhint{font-size:7px;max-width:95px;line-height:1.5}.ls-bottom{padding:11px 15px}.ls-bottom button{padding:8px 11px}}
@media(prefers-reduced-motion:reduce){.ls-story *{animation:none!important;transition:none!important}.ls-story :is(.sv-draw,.sv-chart){stroke-dashoffset:0}.ls-scene,.sv-grow,.sv-check,.sv-server{opacity:1;transform:none}.ls-timeline .current i{transform:scaleX(1)}}

.ls-quietplay{font:inherit;font-size:8px;letter-spacing:.2px;color:#5a729c;cursor:pointer;min-height:28px;padding:5px 9px;background:#ffffff70;border:1px solid #cbd8ed;border-radius:6px}.ls-quietplay:hover{background:#fff;color:#315bbb}.ls-quietplay:focus-visible{outline:2px solid #3b60c5;outline-offset:3px}.ls-caption{padding-bottom:20px}

.ss-story{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:85px;align-items:start;margin:45px 0 65px}.ss-sticky{position:sticky;top:70px;margin:35px 0 0;padding:0 8px;align-self:start}.ss-console{background:#fffdf8;border:1.5px solid #3b60c5;border-radius:18px;box-shadow:7px 7px 0 #dbe3f5;overflow:hidden;transform:rotate(-1.2deg)}.ss-console-top{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #d8dfed;padding:19px 22px;font:9px monospace;letter-spacing:1px;color:#536d9e;background:#edf1fa}.ss-paperclip{position:absolute;right:32px;top:-15px;width:15px;height:42px;border:2px solid #3b60c5;border-radius:9px;z-index:1;transform:rotate(14deg);background:transparent;pointer-events:none}.ss-visual-heading{display:flex;gap:12px;align-items:center;padding:25px 25px 0}.ss-visual-heading h3{font-family:'Source Serif 4',Georgia,serif;font-size:23px;line-height:1.2;letter-spacing:-.7px;font-weight:500;margin:0;color:#263f6b}.ss-asterisk{color:#3b60c5;font-size:30px}.ss-illustration{padding:0 12px;animation:ss-reveal .28s ease both}.ss-illustration>svg{display:block;width:100%;height:auto}.ss-visual-note{font-size:12px!important;line-height:1.7!important;color:#667996!important;text-align:center;margin:0!important;padding:0 25px 25px;min-height:65px}.ss-chapter-nav{display:flex;padding:16px 22px;border-top:1px solid #dce2ed;gap:14px}.ss-chapter-nav button{flex:1;border:0;background:transparent;padding:3px 0 8px;color:#8b9bb8;font:10px monospace;text-align:left;cursor:pointer}.ss-chapter-nav i{display:block;height:3px;margin-top:8px;background:#dbe3f3;border-radius:3px;transition:background .25s}.ss-chapter-nav button[aria-current=step]{color:#3b60c5}.ss-chapter-nav button[aria-current=step] i{background:#3b60c5}.ss-margin-note{font-family:'Source Serif 4',Georgia,serif;font-size:13px;color:#61759c;margin:24px 0 0 20px;transform:rotate(-3deg)}.ss-chapters{border-left:1px dashed #b9c9e6;padding-left:34px}.ss-chapter{min-height:65vh;display:flex;flex-direction:column;justify-content:center;padding:55px 0;position:relative;scroll-margin-top:50px}.ss-chapter-marker{display:flex;align-items:center;gap:13px}.ss-chapter-marker>span{font:11px monospace;color:#3b60c5;position:relative}.ss-chapter-marker>span:before{content:'';position:absolute;left:-40px;top:2px;width:10px;height:10px;border:1px solid #a7bce3;border-radius:50%;background:#fdf2de;transition:background .3s}.ss-chapter.is-active .ss-chapter-marker>span:before{background:#3b60c5;border-color:#3b60c5;box-shadow:0 0 0 5px #3b60c511}.ss-chapter-marker small{font-size:8px;letter-spacing:1.1px;color:#76849a}.ss-chapter h3{font-family:'Source Serif 4',Georgia,serif;font-weight:500;font-size:43px;line-height:1.14;letter-spacing:-1.7px;color:#273955;margin:22px 0}.ss-chapter.is-active h3{color:#3b60c5}.ss-chapter>p{font-size:15px;line-height:1.9;color:#586477;margin:0}.ss-aside{display:flex;gap:10px;align-items:flex-start;margin-top:24px;font-size:12px;line-height:1.7;color:#59719a}.ss-aside>span{font-size:21px;line-height:1}.ss-next-link{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-top:30px;border-bottom:1px solid #b8c8e4;padding-bottom:12px;color:#3b60c5!important;font-size:13px;font-weight:500}.ss-next-link>span{font-size:22px}@keyframes ss-reveal{from{opacity:.6;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.ss-story{gap:40px}.ss-chapter h3{font-size:35px}.ss-sticky{top:35px}.ss-visual-heading h3{font-size:19px}.ss-console-top{font-size:8px;padding:17px}.ss-visual-heading{padding:22px 18px 0}}
@media(max-width:640px){.ss-story{grid-template-columns:1fr;gap:5px;margin:25px 0 40px}.ss-sticky{top:8px;margin:0;z-index:3;padding:0 4px}.ss-console{transform:none;box-shadow:4px 4px 0 #dbe3f5;border-radius:13px;display:grid;grid-template-columns:1fr 1fr}.ss-console-top{grid-column:1/-1;padding:10px 15px;font-size:7px}.ss-visual-heading{padding:13px 0 13px 15px;align-self:center;gap:6px}.ss-visual-heading h3{font-size:17px}.ss-asterisk{font-size:23px}.ss-illustration{padding:0;align-self:center}.ss-illustration>svg{max-height:110px}.ss-visual-note{display:none}.ss-chapter-nav{grid-column:1/-1;padding:7px 15px;gap:12px}.ss-chapter-nav button{font-size:8px;padding:3px 0}.ss-chapter-nav i{margin-top:5px;height:2px}.ss-margin-note{display:none}.ss-paperclip{height:26px;top:-7px;right:20px;width:10px}.ss-chapters{margin:20px 10px 0;padding-left:27px}.ss-chapter{min-height:65vh;padding:45px 0;scroll-margin-top:220px}.ss-chapter-marker>span:before{left:-33px}.ss-chapter h3{font-size:35px}.ss-chapter>p{font-size:14px}.ss-chapter-marker small{font-size:7px}}
@media(prefers-reduced-motion:reduce){.ss-story *{animation:none!important;transition:none!important}.ss-illustration .sv-draw,.ss-illustration .sv-chart{stroke-dashoffset:0}.ss-illustration .sv-check,.ss-illustration .sv-grow{opacity:1;transform:none}}

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

/* ---- editable portrait (a photo replaces the monogram placeholder) ---- */
.mr-profile-portrait{position:relative;overflow:hidden}
.mr-profile-portrait.mr-has-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mr-aboutphoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit}

.mr-playful{--bg:#fdf7eb;--ink:#253550;--blue:#3b60c5;background:var(--bg)}.mr-playful .mr-header{padding-top:24px;padding-bottom:24px;border-color:#dddccb}.mr-playful main{max-width:1180px}.mr-playful .mr-headercta{border:1px solid #3b60c5;border-radius:30px;color:#3b60c5;background:#fffaf0}.mr-playful .mr-hero{grid-template-columns:1.08fr 1fr;padding:85px 0 75px;gap:55px}.mr-playful .mr-hero-focus{margin-bottom:30px}.mr-playful .mr-hero h1{position:relative;font-size:clamp(42px,5.3vw,65px);line-height:1.05;letter-spacing:-3.5px;margin-top:24px;margin-bottom:26px;max-width:540px}.mr-playful .mr-hero h1 em{display:inline;position:relative;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:9px;text-decoration-color:#bdcbee}.pf-title-star{display:inline-block;font-size:42px;color:#3b60c5;margin-left:13px;vertical-align:top;transform:rotate(15deg)}.mr-playful .mr-herocopy>p{font-size:16px;line-height:1.85;min-height:0;max-width:440px}.mr-playful .mr-primary{border-radius:30px;padding:16px 23px;font-size:12px;box-shadow:3px 3px 0 #c4d0ec;transition:transform .2s,box-shadow .2s}.mr-playful .mr-primary:hover{transform:translateY(-2px);box-shadow:4px 5px 0 #c4d0ec}.mr-playful .mr-heronote{font-size:12px;color:#69768c;transform:rotate(-2deg);margin-top:27px}.mr-playful .mr-heronote>span{color:#3b60c5;font-size:25px}.mr-playful .mr-focus-switch{border-color:#cbd4e7;border-radius:12px}.pf-hero-art{position:relative;margin:14px 0 10px}.pf-hero-art .ls-story{transform:rotate(1deg);border:1px solid #a6b9df;box-shadow:8px 9px 0 #e1e7f2;border-radius:19px}.pf-sticker{position:absolute;right:-14px;top:-33px;z-index:2;display:block;background:#fdf2de;border:1px solid #3b60c5;color:#3b60c5;font-size:9px;font-weight:600;line-height:1.5;letter-spacing:.5px;padding:13px 17px;transform:rotate(8deg);border-radius:7px;box-shadow:2px 3px 0 #3b60c51a}.pf-art-note{display:block;text-align:right;font-size:12px;color:#6880ad;font-style:italic;margin:23px 12px 0;transform:rotate(-2deg)}.pf-story-break{display:flex;align-items:center;gap:25px;padding:28px 0 35px;border-top:1px dashed #bdc8dd;border-bottom:1px dashed #bdc8dd;margin-bottom:80px}.pf-story-break>span{font:9px monospace;letter-spacing:1px;color:#72809a;white-space:nowrap}.pf-story-break>p{font-family:'Source Serif 4',Georgia,serif;font-size:24px;letter-spacing:-.5px;color:#3e557c;margin:0;flex:1}.pf-story-break>p>span{color:#3b60c5}.pf-story-break>a{width:42px;height:42px;display:grid;place-items:center;border:1px solid #b5c4df;border-radius:50%;font-size:24px;color:#3b60c5!important}.mr-playful .mr-sectionhead h2{font-size:44px;line-height:1.12;letter-spacing:-1.8px}.pf-journey{padding-bottom:70px!important}.mr-playful .mr-approachintro{max-width:350px}.pf-method{border:1px solid #c7d3e8;background:#f7f9fd;border-radius:14px;overflow:hidden}.pf-method>summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:15px;padding:22px 25px;font-size:13px;color:#405d8f}.pf-method>summary::-webkit-details-marker{display:none}.pf-method-icon{margin-right:12px;font-size:20px}.pf-method-plus{font-size:23px;transition:transform .2s}.pf-method[open] .pf-method-plus{transform:rotate(45deg)}.pf-method-body{padding:8px 25px 20px}.pf-method-body .mr-stagecontent{grid-template-columns:55px 1fr;gap:25px}.pf-method-body .mr-stageaside{grid-column:2;border:0;border-top:1px solid #d8e0ef;padding:20px 0 0;display:flex;align-items:center;justify-content:space-between;gap:20px}.pf-method-body .mr-stageaside>.mr-kicker{display:none}.pf-method-body .mr-stageaside>p{margin:0;font-size:17px}.mr-playful .mr-work{padding-top:35px}.mr-playful .mr-project{border:1px solid #bac9e3;border-radius:18px;box-shadow:5px 5px 0 #e3e8f1;background:#fffdfa}.mr-playful .mr-project:nth-child(1){transform:rotate(-.7deg)}.mr-playful .mr-project:nth-child(2){transform:rotate(.7deg)}.mr-playful .mr-project:hover{transform:translateY(-5px) rotate(0);box-shadow:7px 10px 0 #dce4f4}.mr-playful .mr-projectbody{padding:26px;background:#fffdfa}.mr-playful .mr-projectart{border-bottom:1px solid #d4dfee}.mr-playful .mr-example-note{margin-top:23px}.mr-playful .mr-about{margin-top:40px;padding-top:50px;border-top:1px dashed #bdc8dd}.mr-playful .mr-aboutart{border-radius:42% 42% 16px 16px;border:1px solid #b4c7e8;transform:rotate(-2deg);box-shadow:7px 7px 0 #e4e9f2}.mr-playful .mr-aboutcopy h2{font-size:42px;line-height:1.15;letter-spacing:-1.5px}.mr-playful .mr-contact{position:relative;border-radius:22px;background:#3b60c5;color:#fff;padding:45px;margin-top:35px;box-shadow:8px 8px 0 #d5def1}.mr-playful .mr-contact .mr-kicker{color:#d4def8}.mr-playful .mr-contact h2{color:#fff;font-size:46px;letter-spacing:-2px}.mr-playful .mr-contact>p{color:#dce5fc;font-size:13px}.mr-playful .mr-contactbutton{border:1px solid #fdf2de;background:#fdf2de;color:#3b60c5;border-radius:30px;padding:17px 23px;box-shadow:3px 3px 0 #2649a5}.mr-playful .mr-contactbutton>span{color:#3b60c5}.mr-playful .mr-footer{margin-top:25px}.mr-playful .mr-personalnote{color:#62769c}
@media(max-width:900px){.mr-playful .mr-hero{gap:28px}.mr-playful .mr-hero h1{font-size:49px;letter-spacing:-2.6px}.pf-title-star{font-size:30px;margin-left:8px}.pf-sticker{right:-2px;font-size:8px}.mr-playful .mr-sectionhead h2{font-size:38px}.mr-playful .mr-contact h2{font-size:39px}}
@media(max-width:720px){.mr-playful .mr-hero{grid-template-columns:1fr;padding:40px 0 45px;gap:40px}.mr-playful .mr-hero h1{font-size:clamp(42px,9.8vw,63px);max-width:550px}.mr-playful .mr-herocopy>p{font-size:15px}.pf-hero-art{max-width:520px;width:calc(100% - 8px);margin:15px 0 0}.pf-sticker{right:-7px;top:-25px}.pf-story-break{margin-bottom:45px;gap:15px;padding:22px 0}.pf-story-break>span{display:none}.pf-story-break>p{font-size:20px}.pf-story-break>a{flex-shrink:0}.mr-playful .mr-sectionhead h2{font-size:36px}.pf-method>summary{font-size:12px;padding:17px}.pf-method-icon{margin-right:7px}.pf-method-body{padding:5px 15px 17px}.pf-method-body .mr-stagecontent{gap:15px;grid-template-columns:40px 1fr}.pf-method-body .mr-stageaside{display:block}.pf-method-body .mr-stageaside>div{margin-top:15px}.mr-playful .mr-work{padding-top:0}.mr-playful .mr-project:nth-child(n){transform:none}.mr-playful .mr-about{margin-top:20px;gap:35px}.mr-playful .mr-aboutcopy h2{font-size:34px}.mr-playful .mr-contact{padding:30px 25px;margin-top:20px}.mr-playful .mr-contact h2{font-size:35px;letter-spacing:-1.5px}.mr-playful .mr-header{padding:20px}.mr-playful .mr-headercta{padding:9px 13px}.pf-journey{padding-bottom:45px!important}}
@media(prefers-reduced-motion:reduce){.mr-playful *, .mr-playful *:before,.mr-playful *:after{scroll-behavior:auto!important}.mr-playful .mr-project,.mr-playful .mr-primary,.pf-method-plus{transition:none}.mr-playful .mr-project:hover,.mr-playful .mr-primary:hover{transform:none}}

/* Crisp surfaces and a quieter editorial scale. */
.mr-playful .pf-hero-art .ls-story{transform:none;box-shadow:none;border:1px solid #d0dbea;border-radius:16px;background:#f1f5fb}.mr-playful .ls-story:before{display:none}.mr-playful .ls-paper,.mr-playful .ls-nodeface,.mr-playful .ls-active>.ls-nodeface,.mr-playful .ls-node:hover>.ls-nodeface,.mr-playful .ls-node:focus-visible>.ls-nodeface{filter:none}.mr-playful .ls-halo{animation:none;opacity:.45}.mr-playful .ls-caption{background:#fafcff}.mr-playful .ls-scene{animation:pf-crisp-in .3s ease both}.mr-playful .ls-caption p{animation:none}.mr-playful .ss-console{transform:none;box-shadow:none;border:1px solid #c7d5ea;border-radius:14px}.mr-playful .ss-margin-note{transform:none;font-size:11px;color:#71819a;margin-top:17px}.mr-playful .ss-illustration{animation:pf-crisp-in .3s ease both}.mr-playful .ss-chapter h3{font-size:32px;line-height:1.2;letter-spacing:-1px;margin:18px 0}.mr-playful .ss-chapter>p{font-size:14px;line-height:1.85;max-width:440px}.mr-playful .ss-chapter{min-height:58vh;padding:42px 0}.mr-playful .ss-aside{font-size:11px;margin-top:19px}.mr-playful .ss-visual-heading h3{font-size:21px;letter-spacing:-.5px}.mr-playful .ss-asterisk{font-size:25px}.mr-playful .ss-story{gap:65px}.mr-playful .mr-sectionhead h2{font-size:37px;letter-spacing:-1.3px}.mr-playful .pf-story-break>p{font-size:21px}.mr-playful .mr-project,.mr-playful .mr-project:nth-child(n),.mr-playful .mr-project:hover{transform:none;box-shadow:none}.mr-playful .mr-project:hover{border-color:#3b60c5}.mr-playful .mr-aboutart{transform:none;box-shadow:none;border-radius:16px}.mr-playful .mr-contact,.mr-playful .mr-contactbutton,.mr-playful .mr-contactbutton:hover,.mr-playful .mr-primary,.mr-playful .mr-primary:hover,.mr-playful .mr-focus-switch,.mr-playful .mr-focus-slider{box-shadow:none}.mr-playful .mr-heronote{transform:none}.mr-playful .pf-hero-art{margin-top:0;margin-bottom:0}.mr-playful .mr-aboutcopy h2{font-size:36px}.mr-playful .ss-illustration svg{overflow:visible}@keyframes pf-crisp-in{from{opacity:.8}to{opacity:1}}
@media(max-width:900px){.mr-playful .ss-story{gap:35px}.mr-playful .ss-chapter h3{font-size:29px}.mr-playful .ss-visual-heading h3{font-size:19px}}
@media(max-width:640px){.mr-playful .ss-story{gap:5px}.mr-playful .ss-console{box-shadow:none}.mr-playful .ss-chapter h3{font-size:28px;letter-spacing:-.8px}.mr-playful .ss-chapter>p{font-size:13px}.mr-playful .ss-visual-heading h3{font-size:16px}.mr-playful .ss-chapter{min-height:60vh;padding:36px 0}.mr-playful .mr-sectionhead h2,.mr-playful .mr-aboutcopy h2{font-size:31px}.mr-playful .pf-story-break>p{font-size:18px}.mr-playful .pf-hero-art{width:100%}}
@media(prefers-reduced-motion:reduce){.mr-playful .ls-scene,.mr-playful .ss-illustration{animation:none}}

/* A quieter type system, with less template-like decoration. */
.mr-playful{font-family:'Source Sans 3',Arial,sans-serif}.mr-playful .mr-hero h1{font-family:'Source Serif 4',Georgia,serif;font-size:clamp(40px,4.5vw,56px);line-height:1.12;letter-spacing:-1.6px;font-weight:400}.mr-playful .mr-hero h1 em{text-decoration:none;font-style:italic}.mr-playful .mr-sectionhead h2,.mr-playful .mr-aboutcopy h2{font-family:'Source Serif 4',Georgia,serif;font-size:35px;line-height:1.2;letter-spacing:-.8px;font-weight:400}.mr-playful .ss-chapter h3{font-family:'Source Serif 4',Georgia,serif;font-size:30px;line-height:1.23;font-weight:400;letter-spacing:-.5px}.mr-playful .mr-contact h2{font-family:'Source Serif 4',Georgia,serif;font-size:40px;font-weight:400;letter-spacing:-.8px}.mr-playful .mr-brand{font-family:'Source Serif 4',Georgia,serif;font-weight:600;letter-spacing:-1px}.mr-playful .mr-kicker,.mr-playful .mr-focus-label{font-family:'Source Sans 3',Arial,sans-serif;text-transform:none;letter-spacing:.1px;font-size:12px;font-weight:500}.mr-playful .mr-kicker>i{display:none}.mr-playful .mr-focus-label{color:#6b7688;font-size:11px}.mr-playful .pf-story-break>span{font-family:'Source Sans 3',Arial,sans-serif;letter-spacing:0;font-size:11px}.mr-playful .pf-story-break>p{font-family:'Source Serif 4',Georgia,serif;font-size:23px;font-style:italic;letter-spacing:-.3px}.mr-playful .ss-console-top{font-family:'Source Sans 3',Arial,sans-serif;letter-spacing:0;font-size:11px}.mr-playful .ss-visual-heading h3,.mr-playful .ls-heading strong{font-family:'Source Sans 3',Arial,sans-serif;font-weight:600;letter-spacing:0;font-size:19px}.mr-playful .ls-top{font-family:'Source Sans 3',Arial,sans-serif;font-size:10px;letter-spacing:0}.mr-playful .ls-statuslight{display:none}.mr-playful .ls-node>text{font-family:'Source Sans 3',Arial,sans-serif}.mr-playful .ls-caption strong{font-family:'Source Sans 3',Arial,sans-serif;font-size:18px}.mr-playful .ss-chapter-marker small{font-family:'Source Sans 3',Arial,sans-serif;font-size:10px;letter-spacing:.2px;text-transform:lowercase}.mr-playful .mr-herocopy>p,.mr-playful .ss-chapter>p{font-family:'Source Sans 3',Arial,sans-serif;font-size:16px;line-height:1.75}.mr-playful .mr-primary,.mr-playful .mr-headercta,.mr-playful .mr-contactbutton{border-radius:7px}.mr-playful .mr-focus-switch button{font-size:12px}.mr-playful .mr-artlabel{letter-spacing:.3px}.mr-playful .mr-logo-spark{display:none}
@media(max-width:720px){.mr-playful .mr-hero h1{font-size:clamp(38px,8.8vw,50px);letter-spacing:-1.1px}.mr-playful .mr-sectionhead h2,.mr-playful .mr-aboutcopy h2{font-size:30px}.mr-playful .mr-contact h2{font-size:33px}.mr-playful .ss-chapter h3{font-size:27px}.mr-playful .ss-visual-heading h3{font-size:16px}.mr-playful .mr-herocopy>p,.mr-playful .ss-chapter>p{font-size:15px}.mr-playful .pf-story-break>p{font-size:20px}.mr-playful .ss-console-top{font-size:10px}}
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
    function LifecycleStory({
      mode
    }) {
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
      return <div className={`ls-story ${moving ? "ls-running" : ""}`} ref={root}><div className="ls-top"><span><i className="ls-statuslight" /> How the work moves</span><button className="ls-demo ls-quietplay" onClick={() => setPlay((v) => !v)} aria-label={play ? "Pause animation" : "Play animation"}>{play ? "\u2161 Pause" : "\u25B6 Play"}</button></div><div className="ls-heading"><strong>{mode ? "An AI project, step by step." : "An automation, step by step."}</strong><span>{String(frame + 1).padStart(2, "0")}<small> / 08</small></span></div><div className="ls-canvas"><svg viewBox="0 0 520 370" role="group" aria-label="Interactive eight-stage lifecycle with stage-specific illustrations"><defs><pattern id={`${uid}-dots`} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#9bb0d7" opacity=".2" /></pattern><linearGradient id={`${uid}-node`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6489ec" /><stop offset="1" stopColor="#294eb6" /></linearGradient><linearGradient id={`${uid}-paper`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#f4f7ff" /></linearGradient></defs><rect width="520" height="370" fill={`url(#${uid}-dots)`} /><ellipse cx="260" cy="185" rx="165" ry="100" fill="#dce6ff" opacity=".24" /><path d="M64 55H454V303H64Z" fill="none" stroke="#cfdaef" strokeWidth="1.5" /><path className="ls-signal ls-signal-soft" strokeDashoffset={5 - signalPosition} d="M64 55H454V303H64Z" pathLength="100" fill="none" stroke="#9db9fa" strokeWidth="6" strokeDasharray="5 95" strokeLinecap="round" /><path className="ls-signal" strokeDashoffset={5 - signalPosition} d="M64 55H454V303H64Z" pathLength="100" fill="none" stroke="#5078d8" strokeWidth="2" strokeDasharray="5 95" strokeLinecap="round" /><g transform="translate(117 111)"><rect className="ls-paper" width="286" height="153" rx="15" fill={`url(#${uid}-paper)`} stroke="#fff" strokeWidth="2" /><g className="ls-scene" key={`${mode}-${stage}`}><text x="18" y="23" fill="#254579" fontFamily="Source Sans 3, Arial, sans-serif" fontWeight="600" fontSize="12">{current[2]}</text><circle cx="267" cy="19" r="3" fill="#5b81d7" /><StageVisual stage={stage} mode={mode} /><text x="143" y="132" textAnchor="middle" fill="#5d7396" fontFamily="Source Sans 3, Arial, sans-serif" fontSize="8">{current[3]}</text></g>{rows.map((_, i) => <rect key={i} x={18 + i * 32} y="144" width="26" height="3" rx="1.5" fill={i <= stage ? "#577ed8" : "#e0e7f4"} />)}</g>{locations.map(([x, y], i) => <g key={i} className={`ls-node ${stage === i ? "ls-active" : ""} ${stage > i ? "ls-complete" : ""}`} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-pressed={stage === i} aria-label={`Explore ${labels[i]}`} onClick={() => jump(i)} onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump(i);
        }
      }}>{stage === i && <><rect className="ls-halo" x="-32" y="-32" width="64" height="64" rx="21" fill="none" stroke="#7196ec" /><rect x="-29" y="-29" width="58" height="58" rx="18" fill="#e1eaff" stroke="#b7cbf4" /></>}<rect className="ls-nodeface" x="-24" y="-24" width="48" height="48" rx="15" fill={stage === i ? `url(#${uid}-node)` : "#f9fbff"} /><NodeIcon i={i} /><text y="44" textAnchor="middle">{labels[i]}</text><text className="ls-nodenumber" y="-36" textAnchor="middle">{String(i + 1).padStart(2, "0")}</text>{stage > i && <g transform="translate(23 -22)"><circle r="7" fill="#eef4ff" stroke="#afc3e8" /><path d="m-3 0 2 2 4-4" fill="none" stroke="#5278bd" strokeWidth="1.4" /></g>}</g>)}</svg></div><div className="ls-caption" aria-live={play ? "off" : "polite"}><div><span className="ls-stagepill">{String(stage + 1).padStart(2, "0")}</span><strong>{current[0]}</strong><span className="ls-captionnote">{stage === 7 ? "Back to the start" : ""}</span></div><p key={`${mode}-${stage}`}>{current[1]}</p></div><div className="ls-bottom"><span><i /> Illustrative workflow</span><span>{mode ? "AGENTIC AI" : "RPA"} · 8 CONNECTED STAGES</span></div></div>;
    }
    return LifecycleStory;
  })();

  const ScrollStory = (() => {
    function ScrollStory({ mode, story }) {
      const [active, setActive] = useState(0);
      const [visible, setVisible] = useState(false);
      const [reduced, setReduced] = useState(false);
      const root = useRef(null);
      const chapters = useRef([]);
      const rows = story;
      // TIGHT HANDOVER: the illustration changes only when the dot of the next chapter is level ("flush") with the
      // illustration. Each chapter has a dot on the dashed rail; the "flush line" is the vertical centre of the sticky
      // illustration (on a phone, where the card is a compact strip on top, the strip's lower edge). A chapter becomes
      // active the moment its dot reaches that line and stays active until the dot drops back below it, so scrolling down
      // and up behaves identically and nothing changes early.
      const win = () => (root.current && root.current.ownerDocument.defaultView) || window;
      const dotCenter = (el) => {
        const span = el && el.querySelector(".ss-chapter-marker > span");
        if (!span) return Infinity;
        const pb = win().getComputedStyle(span, "::before");
        return span.getBoundingClientRect().top + (parseFloat(pb.top) || 0) + (parseFloat(pb.height) || 10) / 2;
      };
      const flushLine = () => {
        const r = root.current;
        if (!r) return 0;
        const consoleEl = r.querySelector(".ss-console"), head = r.querySelector(".ss-visual-heading"), note = r.querySelector(".ss-visual-note");
        const single = win().getComputedStyle(r).gridTemplateColumns.trim().split(/\s+/).length < 2;
        if (single || !head || !note || note.getBoundingClientRect().height === 0) return consoleEl ? consoleEl.getBoundingClientRect().bottom : 0;
        // the illustration sits between its heading and its note (both stay still; the illustration itself animates in)
        return (head.getBoundingClientRect().bottom + note.getBoundingClientRect().top) / 2;
      };
      const jumpTo = (i) => {
        const el = chapters.current[i];
        if (!el) return;
        const w = win();
        w.scrollTo({ top: w.scrollY + (dotCenter(el) - flushLine()) + 1, behavior: reduced ? "auto" : "smooth" });
      };
      useEffect(() => {
        const w = win();
        const q = w.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => setReduced(q.matches);
        updateMotion();
        q.addEventListener("change", updateMotion);
        let raf = 0;
        const measure = () => {
          raf = 0;
          const line = flushLine();
          let best = 0;
          chapters.current.forEach((el, i) => {
            if (el && dotCenter(el) <= line + 0.5) best = i;
          });
          setActive(best);
          const r = root.current?.getBoundingClientRect();
          setVisible(!!r && r.top < w.innerHeight && r.bottom > 0);
        };
        const onScroll = () => {
          if (!raf) raf = w.requestAnimationFrame(measure);
        };
        measure();
        w.addEventListener("scroll", onScroll, { passive: true });
        w.addEventListener("resize", onScroll);
        return () => {
          w.cancelAnimationFrame(raf);
          w.removeEventListener("scroll", onScroll);
          w.removeEventListener("resize", onScroll);
          q.removeEventListener("change", updateMotion);
        };
      }, []);
      return <div className="ss-story" ref={root}><aside className="ss-sticky" aria-label="Illustration for the current story chapter"><div className="ss-console"><div className="ss-console-top"><span>{mode ? "Working with AI" : "Working with RPA"}</span><span>0{active + 1} / 04</span></div><div className="ss-visual-heading"><h3>{rows[active].label}</h3></div><div className={`ss-illustration ${visible && !reduced ? "ls-running" : ""}`} key={`${mode}-${active}`}><svg viewBox="0 0 286 153" aria-label={rows[active].label} role="img"><StageVisual stage={rows[active].stage} mode={mode} /></svg></div><p className="ss-visual-note">{rows[active].note}</p><div className="ss-chapter-nav" aria-label="Jump to story chapter">{rows.map((r, i) => <button key={i} aria-label={`Chapter ${i + 1}: ${r.title}`} aria-current={i === active ? "step" : void 0} onClick={() => jumpTo(i)}><span>0{i + 1}</span><i /></button>)}</div></div></aside><div className="ss-chapters">{rows.map((r, i) => <article className={`ss-chapter ${i === active ? "is-active" : ""}`} key={i} ref={(el) => {
        chapters.current[i] = el;
      }}><div className="ss-chapter-marker"><span>0{i + 1}</span><small>{r.tag}</small></div><h3>{r.title}</h3><p>{r.text}</p><div className="ss-aside"><span aria-hidden="true">↳</span>{r.aside}</div>{i === 3 && <a href="#mr-work" className="ss-next-link">So what can this look like? <span>↓</span></a>}</article>)}</div></div>;
    }
    return ScrollStory;
  })();

  const MatsHomepage = (() => {
    function Icon({
      n = 0,
      size = 24
    }) {
      const paths = [<><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>, <><path d="M4 20V12m8 8V5m8 15V9M2 21h20" /></>, <><rect x="2" y="2" width="7" height="6" rx="1" /><rect x="15" y="16" width="7" height="6" rx="1" /><path d="M5 8v11h10M9 5h10v11" /></>, <><path d="m7 6-5 6 5 6m10-12 5 6-5 6M14 3l-4 18" /></>, <><path d="M8 3h8M10 3v7L3 21h18l-7-11V3M7 16h10" /></>, <><path d="M12 16V2m-5 5 5-5 5 5M3 14v7h18v-7" /></>, <><path d="M2 13h5l3-8 4 15 3-7h5" /></>, <><path d="M20 8A8 8 0 0 0 6 5L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5" /></>];
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[n % 8]}</svg>;
    }
    function ModeToggle({
      mode,
      onChange,
      label
    }) {
      return <div className="mr-focus-switch" role="group" aria-label={label}><span aria-hidden="true" className={`mr-focus-slider ${mode ? "is-ai" : ""}`} /><button type="button" aria-pressed={mode === 0} onClick={() => onChange(0)}>RPA</button><button type="button" aria-pressed={mode === 1} onClick={() => onChange(1)}>Agentic AI</button></div>;
    }
    function BrandLogo({
      mode
    }) {
      return <span key={mode} className={`mr-logo-motion ${mode ? "mr-logo-ai" : "mr-logo-rpa"}`} aria-hidden="true"><svg className="mr-logo-symbol" viewBox="0 0 32 32" width="28" height="28" fill="none"><path className="mr-logo-bracket" d="M10 5H5V27H10" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" pathLength="1" /><g className="mr-logo-arrow"><path d="M12 16H27M22 11L27 16L22 21" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" /></g><g className="mr-logo-spark" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M26 3V7M24 5H28" /></g></svg><span className="mr-logo-word">mats<span className="mr-period mr-logo-dot">.</span></span></span>;
    }
    const MatsHomepage = ({
      defaultMode = 0,
      defaultStage = 0,
      onModeChange,
      work,
      page,
      localImages,
      startModal
    } = {}) => {
      const [mode, setMode] = useState(defaultMode), [stage, setStage] = useState(defaultStage), [modal, setModal] = useState(startModal === "about" ? { type: "about" } : null);
      const close = useRef(null), trigger = useRef(null);
      const cards = (work ? work.cards : normalizeWorkCards(defaultWorkCards())).filter((c) => c.visible);
      const workLoading = !!(work && work.status === "loading");
      const hasWork = workLoading || cards.length > 0;
      const P = page || normalizePage(null);
      const key = mode ? "ai" : "rpa", M = P.approach[key], names = STAGE_NAMES[key];
      const rows = names.map((n, i) => [n, M.stages[i].title, M.stages[i].text, ...M.stages[i].checks]);
      const chapters = M.chapters.map((c, i) => ({ ...c, ...STORY_FIXED[key][i] }));
      // One mode for the whole page: both switches, the logo, the hero, the lifecycle animation, the scroll story and the method follow it.
      const changeMode = (next) => {
        if (next === mode) return;
        setMode(next);
        setStage(0);
        if (onModeChange) onModeChange(next);
      };
      const dismiss = () => {
        setModal(null);
        if (trigger.current) trigger.current.focus();
      };
      const show = (e, m) => {
        trigger.current = e.currentTarget;
        setModal(m);
      };
      const jump = (e, id) => {
        const el = id === "mr-home" ? null : document.getElementById(id);
        if (id !== "mr-home" && !el) return;
        e.preventDefault();
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        if (el) el.scrollIntoView({ behavior, block: "start" }); else window.scrollTo({ top: 0, behavior });
      };
      return <div className="mr-app mr-playful"><header className="mr-header"><a className="mr-brand" href="#mr-home" aria-label="Mats — home" onClick={(e) => jump(e, "mr-home")}><BrandLogo mode={mode} /></a><nav aria-label="Main navigation">{hasWork && <a href="#mr-work" onClick={(e) => jump(e, "mr-work")}>Work</a>}<a href="#mr-approach" onClick={(e) => jump(e, "mr-approach")}>How I work</a><a href="#mr-about" onClick={(e) => jump(e, "mr-about")}>About</a></nav><a href="#mr-contact" className="mr-headercta" onClick={(e) => jump(e, "mr-contact")}>Let’s talk <span>↗</span></a></header><main id="mr-home"><section className="mr-hero"><div className="mr-herocopy"><div className="mr-hero-focus">{P.hero.focusLabel && <span className="mr-focus-label">{P.hero.focusLabel}</span>}<ModeToggle mode={mode} onChange={changeMode} label="Homepage focus" /></div><div className="mr-kicker"><i /> {P.hero.eyebrow}</div><h1>{mode ? P.hero.line1Ai : P.hero.line1}<br /><em>{mode ? P.hero.accentAi : P.hero.accent}</em></h1><p>{mode ? P.hero.ledeAi : P.hero.lede}</p><div className="mr-actions"><a className="mr-primary" href="#mr-approach" onClick={(e) => jump(e, "mr-approach")}>{P.hero.primaryLabel} <span>↓</span></a><a className="mr-textlink" href="#mr-contact" onClick={(e) => jump(e, "mr-contact")}>{P.hero.secondaryLabel} <span>↗</span></a></div>{(mode ? P.hero.noteAi : P.hero.note) && <div className="mr-heronote"><span aria-hidden="true">↳</span> {mode ? P.hero.noteAi : P.hero.note}</div>}</div><div className="pf-hero-art"><LifecycleStory mode={mode} /></div></section><div className="pf-story-break"><span>{P.hero.storyLabel}</span><p>“{P.hero.storyQuote}”</p><a href="#mr-approach" aria-label="Read the story" onClick={(e) => jump(e, "mr-approach")}>↓</a></div><section id="mr-approach" className="mr-approach pf-journey"><div className="mr-sectionhead"><div><div className="mr-kicker">How I work</div><h2>{P.approach.headingA}<br /><em>{P.approach.headingAccent}</em></h2></div><div className="mr-approachintro"><p>{textLines(P.approach.intro)}</p><ModeToggle mode={mode} onChange={changeMode} label="How I work focus" /></div></div><ScrollStory mode={mode} story={chapters} /><details className="pf-method"><summary><span><span className="pf-method-icon" aria-hidden="true">⌘</span> See all eight stages</span><span className="pf-method-plus" aria-hidden="true">+</span></summary><div className="pf-method-body"><div className="mr-stagebuttons" aria-label="Choose a lifecycle stage">{rows.map((r, i) => <button key={i} aria-pressed={stage === i} onClick={() => setStage(i)} className={stage === i ? "active" : ""}><small>0{i + 1}</small><span>{r[0]}</span></button>)}</div><div className="mr-stagecontent" key={`${mode}-${stage}`}><div className="mr-stagenumber">0{stage + 1}<span>/ 08</span><Icon n={stage} size={44} /></div><div className="mr-stagetext"><span className="mr-kicker">{rows[stage][0].toUpperCase()}</span><h3>{rows[stage][1]}</h3><p>{rows[stage][2]}</p><div className="mr-stagechecks">{rows[stage].slice(3).map((s) => <span key={s}><b>✓</b>{s}</span>)}</div></div><div className="mr-stageaside"><span className="mr-kicker">THE PRINCIPLE</span><p>{M.principle}</p><div><button aria-label="Previous stage" onClick={() => setStage((stage + 7) % 8)}>←</button><button aria-label="Next stage" onClick={() => setStage((stage + 1) % 8)}>→</button></div></div></div><div className="mr-loopnote">↻ <span>{P.approach.loopNote}</span></div></div></details></section> {hasWork && <WorkSection cards={cards} loading={workLoading} copy={P.work} localImages={localImages} onOpen={(e, card) => show(e, { type: "case", id: card.id })} />}<a className="mr-about mr-about-link" id="mr-about" href="#mr-about" aria-haspopup="dialog" onClick={(e) => {
        e.preventDefault();
        show(e, { type: "about" });
      }} aria-label={`Read about ${P.about.modal.name}`}><div className="mr-aboutart" aria-hidden="true"><AboutPortrait variant="card" portrait={P.about.modal.portrait} name={P.about.modal.name} localImages={localImages} /><div className="mr-aboutartbottom"><span>{P.about.captionLeft}</span><span>{P.about.captionRight}</span></div><i className="mr-orbit one" /><i className="mr-orbit two" /><i className="mr-orbit three" /></div><div className="mr-aboutcopy"><div className="mr-kicker">About me</div><h2>{P.about.headingA}<br /><em>{P.about.headingAccent}</em></h2>{P.about.paragraphs.map((t, i) => <p key={i}>{t}</p>)}{P.about.cue && <span className="mr-about-cta">{P.about.cue} <span aria-hidden="true">↗</span></span>}{P.about.quote && <div className="mr-personalnote"><span>“</span>{P.about.quote}</div>}</div></a><section className="mr-contact" id="mr-contact"><div className="mr-kicker">Get in touch</div><div><h2>{P.contact.headingA}<br />{P.contact.headingB}</h2><button className="mr-contactbutton" onClick={(e) => show(e, { type: "contact" })}>{P.contact.button} <span>↗</span></button></div>{P.contact.sub && <p>{P.contact.sub}</p>}</section></main><footer className="mr-footer"><a href="#mr-home" className="mr-brand" aria-label="Mats — home" onClick={(e) => jump(e, "mr-home")}><BrandLogo mode={mode} /></a><span>{P.footer.tagline}</span><a href="#mr-home" onClick={(e) => jump(e, "mr-home")}>Back to top ↑</a></footer>{modal && modal.type === "about" && <ModalShell kicker="About me" title={P.about.modal.heading} className="mr-about-modal" onDismiss={dismiss} closeRef={close}><AboutBody modal={P.about.modal} localImages={localImages} /></ModalShell>}{modal && modal.type === "contact" && <ModalShell kicker={P.contact.dialogKicker} title={P.contact.dialogTitle} onDismiss={dismiss} closeRef={close}>{P.contact.dialogIntro && <p>{P.contact.dialogIntro}</p>}{P.contact.questions.length > 0 && <ol>{P.contact.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>}{P.contact.linkUrl ? <a className="mr-primary mr-modalcta mr-modallink" href={P.contact.linkUrl} {...(/^https?:/i.test(P.contact.linkUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{P.contact.linkLabel} <span>→</span></a> : <div className="mr-previewnotice">Contact details haven’t been added yet.</div>}</ModalShell>}{modal && modal.type === "case" && (() => {
            const card = cards.find((c) => c.id === modal.id);
            return card ? <ModalShell kicker={card.content.illustrative ? "Example workflow" : "Case study"} title={card.content.title} onDismiss={dismiss} closeRef={close}><CaseStudyBody card={card} /></ModalShell> : null;
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
  if (work.status === "loading") return <><style>{MR_CSS}</style><div className="mr-app mr-playful" /></>;
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
      const k = Math.min(1, maxW / Math.max(img.naturalWidth, img.naturalHeight));
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
    <div className="mr-app mr-playful we-thumb" aria-hidden="true">
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
      <div className="mr-app mr-playful" style={{ minHeight: 0 }}>
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
            <div className="mr-app mr-playful we-crop"><div className="mr-projectart mr-art-image" style={{ minHeight: 0, height: 128 }}><ArtImage src={cropSrc} image={im} title={card.content.title} /></div></div>
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
  const setLocalImage = (key, data) => setDraft((d) => { const im = { ...d.images }; if (data) im[key] = data; else delete im[key]; return { ...d, images: im }; });
  const previewCards = normalizeWorkCards(cards);
  const mutate = (fn) => setDraft((d) => ({ ...d, cards: fn(d.cards) }));
  const updateCard = (id, fn) => mutate((cs) => cs.map((c) => (c.id === id ? fn(jsonClone(c)) : c)));
  const move = (id, dir) => mutate((cs) => { const a = cs.slice(), i = a.findIndex((c) => c.id === id), j = i + dir; if (j < 0 || j >= a.length) return cs; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const addCard = (template) => { if (cards.length >= WORK_LIMITS.maxCards) return; const c = newWorkCard(template); mutate((cs) => [...cs, c]); setSelId(c.id); setTab("content"); setAddOpen(false); };
  const duplicate = (c) => { if (cards.length >= WORK_LIMITS.maxCards) return; const copy = jsonClone(c); copy.id = "card-" + Math.random().toString(36).slice(2, 8); copy.visible = false; copy.content.title = (copy.content.title + " (copy)").slice(0, WORK_LIMITS.title); copy.appearance.image = emptyWorkImage(); mutate((cs) => { const a = cs.slice(); a.splice(cs.findIndex((x) => x.id === c.id) + 1, 0, copy); return a; }); setSelId(copy.id); };
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
    const pr = normalizePage(draft.page).about.modal.portrait, prevPr = pub.page.about.modal.portrait;
    if (pr.kind === "upload" && !(prevPr.kind === "upload" && prevPr.hash === pr.hash && prevPr.ref === pr.ref)) {
      if (!draft.images.__portrait) { setMsg({ kind: "error", text: "The portrait picture isn't in this browser any more — upload it again." }); setSection("about"); return; }
      images[pr.ref] = { data: draft.images.__portrait, hash: pr.hash };
    }
    const keep = new Set(list.filter(isUp).map((c) => c.appearance.image.ref).concat(pr.kind === "upload" ? [pr.ref] : []));
    const removeRefs = pub.cards.filter(isUp).map((p) => p.appearance.image.ref).concat(prevPr.kind === "upload" ? [prevPr.ref] : []).filter((r) => !keep.has(r));
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
                  <button type="button" className="we-mini" onClick={() => duplicate(card)} disabled={cards.length >= WORK_LIMITS.maxCards}>Duplicate</button>
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
        <PageSectionEditor section={section} page={draft.page} setPage={setPage} cards={cards} images={draft.images} setLocalImage={setLocalImage} />
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
      <LimitedField label="Intro (leave empty for the automatic text)" value={w.intro} max={L.intro} multiline rows={2} onChange={(v) => set({ intro: v })} help="Empty: “Two example workflows, with a closer look at the decisions behind them.” (or “Example workflows…” for other card counts)." />
    </div>
  );
}

function HeroForm({ page, setPage, mode, setMode }) {
  const h = page.hero, L = PAGE_LIMITS, ai = mode === 1;
  const set = (patch) => setPage((p) => ({ ...p, hero: { ...p.hero, ...patch } }));
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>Hero</h3><ResetSection what="the hero" onReset={() => set(defaultPage().hero)} /></div>
      <LimitedField label="Small line above the headline" value={h.eyebrow} max={L.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <LimitedField label="Label above the RPA / Agentic AI switch" value={h.focusLabel} max={L.focusLabel} onChange={(v) => set({ focusLabel: v })} help="Leave empty to hide the label (the switch stays)." />
      <div className="we-group">
        <div className="we-grouphead"><strong>Headline, paragraph and note</strong><span>Each follows the RPA / Agentic AI switch. The second headline line is the blue italic one.</span></div>
        <div className="we-seg" role="group" aria-label="Version to edit">
          {[["RPA", 0], ["Agentic AI", 1]].map(([l, k]) => <button type="button" key={k} className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        </div>
        <LimitedField label="Line 1" value={ai ? h.line1Ai : h.line1} max={L.headline} onChange={(v) => set(ai ? { line1Ai: v } : { line1: v })} />
        <LimitedField label="Line 2 (highlighted)" value={ai ? h.accentAi : h.accent} max={L.headline} onChange={(v) => set(ai ? { accentAi: v } : { accent: v })} />
        <LimitedField label="Paragraph" value={ai ? h.ledeAi : h.lede} max={L.lede} multiline rows={4} onChange={(v) => set(ai ? { ledeAi: v } : { lede: v })} />
        <LimitedField label="Small note under the buttons" value={ai ? h.noteAi : h.note} max={L.note} onChange={(v) => set(ai ? { noteAi: v } : { note: v })} help="Leave empty to hide." />
      </div>
      <div className="we-two">
        <LimitedField label="Main button text" value={h.primaryLabel} max={L.label} onChange={(v) => set({ primaryLabel: v })} help="Scrolls to How I work." />
        <LimitedField label="Second link text" value={h.secondaryLabel} max={L.label} onChange={(v) => set({ secondaryLabel: v })} help="Scrolls to the contact section." />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>“How it starts” moment</strong><span>The quiet quote between the hero and How I work</span></div>
        <LimitedField label="Label" value={h.storyLabel} max={L.storyLabel} onChange={(v) => set({ storyLabel: v })} />
        <LimitedField label="Quote" value={h.storyQuote} max={L.storyQuote} onChange={(v) => set({ storyQuote: v })} />
      </div>
    </div>
  );
}

function ApproachForm({ page, setPage, mode, setMode, stage, setStage }) {
  const a = page.approach, L = PAGE_LIMITS, key = mode ? "ai" : "rpa", m = a[key], st = m.stages[stage];
  const [chapter, setChapter] = useState(0), ch = m.chapters[chapter];
  const setA = (patch) => setPage((p) => ({ ...p, approach: { ...p.approach, ...patch } }));
  const setM = (patch) => setPage((p) => ({ ...p, approach: { ...p.approach, [key]: { ...p.approach[key], ...patch } } }));
  const setStageField = (patch) => setM({ stages: m.stages.map((s, i) => (i === stage ? { ...s, ...patch } : s)) });
  const setChapterField = (patch) => setM({ chapters: m.chapters.map((c, i) => (i === chapter ? { ...c, ...patch } : c)) });
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>How I work</h3><ResetSection what="this whole section (both versions)" onReset={() => setA(defaultPage().approach)} /></div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Section texts</strong><span>Shared by both versions</span></div>
        <LimitedField label="Heading" value={a.headingA} max={L.heading} onChange={(v) => setA({ headingA: v })} />
        <LimitedField label="Heading (highlighted part)" value={a.headingAccent} max={L.heading} onChange={(v) => setA({ headingAccent: v })} />
        <LimitedField label="Intro" value={a.intro} max={L.intro} multiline rows={2} onChange={(v) => setA({ intro: v })} help="A new line starts a new line on the page." />
        <LimitedField label="Loop note (bottom of the full method)" value={a.loopNote} max={L.loop} onChange={(v) => setA({ loopNote: v })} help="Leave empty to hide." />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Version</strong><span>The RPA and Agentic AI versions are edited separately. The stage names and the animation are fixed.</span></div>
        <div className="we-seg" role="group" aria-label="Version to edit">
          {[["RPA", 0], ["Agentic AI", 1]].map(([l, k]) => <button type="button" key={k} className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
        </div>
        <LimitedField label="The principle (note beside the full method)" value={m.principle} max={L.principle} onChange={(v) => setM({ principle: v })} />
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Scroll story</strong><span>The four parts a visitor scrolls through. Which stage each one shows is fixed.</span></div>
        <div className="we-stagepick" role="group" aria-label="Scroll-story part to edit">
          {m.chapters.map((c, i) => <button type="button" key={i} className={chapter === i ? "on" : ""} aria-pressed={chapter === i} onClick={() => setChapter(i)}><small>0{i + 1}</small>{STORY_FIXED[key][i].tag}</button>)}
        </div>
        <div className="we-section">
          <LimitedField label={`Part ${chapter + 1} · ${STORY_FIXED[key][chapter].tag} — heading`} value={ch.title} max={L.chapterTitle} onChange={(v) => setChapterField({ title: v })} />
          <LimitedField label="Part text" value={ch.text} max={L.chapterText} multiline rows={4} onChange={(v) => setChapterField({ text: v })} />
          <LimitedField label="Part side note" value={ch.aside} max={L.chapterAside} onChange={(v) => setChapterField({ aside: v })} />
          <LimitedField label="Part label (above the illustration)" value={ch.label} max={L.chapterLabel} onChange={(v) => setChapterField({ label: v })} />
          <LimitedField label="Part caption (under the illustration)" value={ch.note} max={L.chapterNote} onChange={(v) => setChapterField({ note: v })} />
          <div className="we-row"><button type="button" className="we-mini" onClick={() => { if (window.confirm("Put this part back to the original wording?")) setChapterField(defaultPage().approach[key].chapters[chapter]); }}>Reset this part</button></div>
        </div>
      </div>
      <div className="we-group">
        <div className="we-grouphead"><strong>Full method (“See all eight stages”)</strong><span>The expandable list under the scroll story</span></div>
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

function PortraitEditor({ portrait, name, images, setLocalImage, onChange }) {
  const [state, setState] = useState(null);
  const set = (patch) => onChange({ ...portrait, ...patch });
  const upload = async (file) => {
    setState({ kind: "info", text: "Shrinking picture…" });
    try {
      const { data, width, height } = await compressWorkImage(file);
      setLocalImage("__portrait", data);
      onChange({ ...portrait, kind: "upload", url: "", ref: "workimg-portrait", hash: hashStr(data), zoom: 1, x: 50, y: 50 });
      setState({ kind: "info", text: `Ready · ${width}×${height}px · ${Math.round(data.length * 0.75 / 1024)} KB` });
    } catch (e) { setState({ kind: "error", text: e.message }); }
  };
  const remove = () => { setLocalImage("__portrait", null); onChange({ ...emptyWorkImage(), alt: portrait.alt }); setState(null); };
  return (
    <div className="we-group">
      <div className="we-grouphead"><strong>Portrait</strong><span>Your photo. Until you add one, the “m.” monogram placeholder is shown. Never a stock picture.</span></div>
      <div className="we-two">
        <div>
          <span className="we-fl"><span>Upload a picture</span></span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) upload(f); e.target.value = ""; }} />
          {state && <span className={state.kind === "error" ? "we-error" : "we-help"}>{state.text}</span>}
        </div>
        <LimitedField label="…or a web address" value={portrait.kind === "url" ? portrait.url : ""} max={PAGE_LIMITS.url} onChange={(v) => set({ kind: v ? "url" : "none", url: v, ref: "", hash: "" })} help="https://… or a file in your site's public folder, e.g. images/mats.jpg" error={portrait.kind === "url" && portrait.url && !safeImageUrl(portrait.url) ? "Not a valid image address." : null} />
      </div>
      {portrait.kind === "upload" && <p className="we-help">Uploaded picture{images && images.__portrait ? "" : " (published)"} · <button type="button" className="we-link" onClick={remove}>Remove picture</button></p>}
      <div className="mr-app mr-playful we-crop"><AboutPortrait variant="modal" portrait={portrait} name={name} localImages={images} /></div>
      <LimitedField label="Description for screen readers" value={portrait.alt} max={WORK_LIMITS.alt} onChange={(v) => set({ alt: v })} help="Leave empty for “Portrait of <your name>”." />
      {portrait.kind !== "none" && (
        <>
          <label className="we-range"><span>Zoom {Math.round(portrait.zoom * 100)}%</span><input type="range" min="1" max="3" step="0.05" value={portrait.zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} /></label>
          <label className="we-range"><span>Focus: left ↔ right</span><input type="range" min="0" max="100" value={portrait.x} onChange={(e) => set({ x: Number(e.target.value) })} /></label>
          <label className="we-range"><span>Focus: top ↔ bottom</span><input type="range" min="0" max="100" value={portrait.y} onChange={(e) => set({ y: Number(e.target.value) })} /></label>
          <div className="we-row"><button type="button" className="we-mini" onClick={() => set({ zoom: 1, x: 50, y: 50 })}>Reset crop</button></div>
        </>
      )}
    </div>
  );
}

function AboutForm({ page, setPage, images, setLocalImage, aboutOpen, setAboutOpen }) {
  const a = page.about, m = a.modal, L = PAGE_LIMITS;
  const set = (patch) => setPage((p) => ({ ...p, about: { ...p.about, ...patch } }));
  const setM = (patch) => setPage((p) => ({ ...p, about: { ...p.about, modal: { ...p.about.modal, ...patch } } }));
  const setBlock = (i, patch) => setM({ blocks: m.blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)) });
  const moveBlock = (i, d) => { const arr = m.blocks.slice(), j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setM({ blocks: arr }); };
  return (
    <div className="we-stack">
      <div className="we-formhead"><h3>About me</h3><ResetSection what="this section and its window" onReset={() => set(defaultPage().about)} /></div>
      <LimitedField label="Heading" value={a.headingA} max={L.heading} onChange={(v) => set({ headingA: v })} />
      <LimitedField label="Heading (highlighted part)" value={a.headingAccent} max={L.heading} onChange={(v) => set({ headingAccent: v })} />
      <div className="we-grouphead"><strong>Paragraphs</strong><span>Up to {L.maxParagraphs}</span></div>
      <ListEditor label="Paragraph" items={a.paragraphs} max={L.paragraph} cap={L.maxParagraphs} rows={4} addLabel="+ Add paragraph" onChange={(items) => set({ paragraphs: items })} />
      <LimitedField label="Personal quote" value={a.quote} max={L.quote} onChange={(v) => set({ quote: v })} help="Leave empty to hide." />
      <div className="we-two">
        <LimitedField label="Picture caption (left)" value={a.captionLeft} max={L.caption} onChange={(v) => set({ captionLeft: v })} />
        <LimitedField label="Picture caption (right)" value={a.captionRight} max={L.caption} onChange={(v) => set({ captionRight: v })} />
      </div>

      <div className="we-group">
        <div className="we-grouphead"><strong>About window</strong><span>Opens when someone clicks this section</span></div>
        <div className="we-row"><button type="button" className="we-btn" aria-pressed={!!aboutOpen} onClick={() => setAboutOpen(!aboutOpen)}>{aboutOpen ? "Hide the window in the preview" : "Show the window in the preview"}</button></div>
        <LimitedField label="Card cue text" value={a.cue} max={L.cue} onChange={(v) => set({ cue: v })} help="The label on the About card, e.g. “More about me”. The ↗ is added automatically. Leave empty to hide it." />
        <LimitedField label="Window heading" value={m.heading} max={L.aboutHeading} onChange={(v) => setM({ heading: v })} />
        <PortraitEditor portrait={m.portrait} name={m.name} images={images} setLocalImage={setLocalImage} onChange={(portrait) => setM({ portrait })} />
        <div className="we-two">
          <LimitedField label="Name" value={m.name} max={L.personName} onChange={(v) => setM({ name: v })} />
          <LimitedField label="Role" value={m.role} max={L.role} onChange={(v) => setM({ role: v })} />
        </div>
        <LimitedField label="Introduction" value={m.intro} max={L.bioIntro} multiline rows={3} onChange={(v) => setM({ intro: v })} />
        <div className="we-grouphead"><strong>Skill tags</strong><span>Up to {L.maxTags}</span></div>
        <ListEditor label="Tag" items={m.tags} max={L.tag} cap={L.maxTags} rows={1} addLabel="+ Add tag" onChange={(items) => setM({ tags: items })} />
        <div className="we-grouphead"><strong>Text blocks</strong><span>Heading and text, up to {L.maxBlocks}</span></div>
        {m.blocks.map((b, i) => (
          <div className="we-section" key={i}>
            <LimitedField label={`Block ${i + 1} heading`} value={b.heading} max={L.blockHeading} onChange={(v) => setBlock(i, { heading: v })} />
            <LimitedField label={`Block ${i + 1} text`} value={b.body} max={L.blockText} multiline rows={4} onChange={(v) => setBlock(i, { body: v })} />
            <div className="we-row">
              <button type="button" className="we-mini" disabled={i === 0} onClick={() => moveBlock(i, -1)}>↑ Up</button>
              <button type="button" className="we-mini" disabled={i === m.blocks.length - 1} onClick={() => moveBlock(i, 1)}>↓ Down</button>
              <button type="button" className="we-mini danger" onClick={() => setM({ blocks: m.blocks.filter((_, k) => k !== i) })}>Remove</button>
            </div>
          </div>
        ))}
        {m.blocks.length < L.maxBlocks && <button type="button" className="we-btn" onClick={() => setM({ blocks: [...m.blocks, { heading: "", body: "" }] })}>+ Add block</button>}
        <LimitedField label="Quote in the window" value={m.quote} max={L.quote} onChange={(v) => setM({ quote: v })} help="Leave empty to hide the quote panel." />
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
function PagePreview({ page, cards, section, device, mode, stage, images, aboutOpen }) {
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
      <MatsHomepage key={`${mode}-${stage}-${aboutOpen}`} page={normalizePage(page)} defaultMode={mode} defaultStage={stage} startModal={aboutOpen ? "about" : null} localImages={images} work={{ status: "ready", cards: normalizeWorkCards(cards) }} />
    </PreviewFrame>
  );
}

function PageSectionEditor({ section, page, setPage, cards, images, setLocalImage }) {
  const [aboutOpen, setAboutOpen] = useState(false), [device, setDevice] = useState("desktop"), [mode, setMode] = useState(0), [stage, setStage] = useState(0);
  const { warnings } = validatePage(page), mine = warnings.filter((w) => w.section === section);
  const props = { page, setPage };
  return (
    <div className="we-grid we-grid2">
      <section className="we-form" aria-label="Edit text">
        {section === "hero" && <HeroForm {...props} mode={mode} setMode={setMode} />}
        {section === "approach" && <ApproachForm {...props} mode={mode} setMode={setMode} stage={stage} setStage={setStage} />}
        {section === "about" && <AboutForm {...props} images={images} setLocalImage={setLocalImage} aboutOpen={aboutOpen} setAboutOpen={setAboutOpen} />}
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
        <PagePreview page={page} cards={cards} section={section} device={device} mode={mode} stage={stage} images={images} aboutOpen={section === "about" && aboutOpen} />
        {mine.length > 0 && <ul className="we-warnlist">{mine.map((w, i) => <li key={i}>⚠ {w.text}</li>)}</ul>}
      </section>
    </div>
  );
}

function AdminStyles() {
  return (
    <style>{`
      /* ---- Admin theme: the homepage's palette (warm paper, ink, blue) ---- */
      .adm-theme{ --rpa-primary:#3b60c5; --rpa-ink:#253550; --rpa-ink-soft:#586477; --rpa-line:#dce2eb; font-family:'Source Sans 3',Arial,sans-serif; color:#253550; background:#fdf7eb; min-height:100vh; }
      .adm-theme *{ box-sizing:border-box; }
      body.adm-body{ margin:0; background:#fdf7eb; }
      .adm-header{ max-width:1560px; margin:0 auto; padding:22px 28px; display:flex; align-items:center; justify-content:space-between; gap:20px; border-bottom:1px solid #e4e3de; position:relative; z-index:40; flex-wrap:wrap; }
      .adm-brand{ font-family:'Source Serif 4',Georgia,serif; font-size:26px; font-weight:700; letter-spacing:-1px; display:flex; align-items:center; color:#253550; text-decoration:none; }
      .adm-logomark{ font-family:monospace; font-size:23px; letter-spacing:-5px; color:#3b60c5; margin-right:15px; }
      .adm-period{ color:#3b60c5; }
      .adm-tag{ font:500 10px/1 'Source Sans 3',Arial,sans-serif; letter-spacing:1.6px; text-transform:uppercase; color:#697588; margin-left:16px; border:1px solid #ccd4e0; padding:6px 9px; border-radius:4px; }
      .adm-headright{ display:flex; align-items:center; gap:18px; }
      .adm-viewsite{ border:1px solid #ccd4e0; padding:10px 17px; border-radius:5px; font-size:12px; color:#253550; text-decoration:none; }
      .adm-viewsite:hover{ border-color:#3b60c5; color:#3b60c5; }
      .adm-wrap{ max-width:1560px; margin:0 auto; padding:26px 28px 60px; }
      .adm-banner{ background:#eef2fb; border:1px solid #cbd7f0; border-radius:8px; padding:14px 18px; font-size:.88rem; margin-bottom:18px; color:#233047; }
      .adm-banner code{ background:#fff; padding:1px 6px; border-radius:4px; font-size:.85em; }
      .adm-gate{ display:flex; align-items:center; justify-content:center; padding:24px; }
      .adm-gate-box{ background:#fff; border:1px solid #dce2eb; border-radius:12px; padding:38px; width:min(92vw,400px); display:flex; flex-direction:column; gap:12px; }
      .adm-gate-box h1{ font:700 28px 'Source Serif 4',Georgia,serif; margin:0; letter-spacing:-1px; }
      .adm-gate-box p{ margin:0; font-size:.9rem; color:#586477; }
      .adm-gate-box input{ padding:11px 12px; border:1.5px solid #dce2eb; border-radius:6px; font:1rem 'Source Sans 3',Arial,sans-serif; }
      .adm-gate-box input:focus{ outline:2px solid #3b60c5; outline-offset:1px; }
      .adm-gate-box button{ background:#3b60c5; color:#fff; border:0; border-radius:5px; padding:12px 18px; font:500 .9rem 'Source Sans 3',Arial,sans-serif; cursor:pointer; }
      .adm-err{ color:#b3261e !important; }

      /* ---- Selected work editor ---- */
      .we{ font-family:'Source Sans 3',Arial,sans-serif; color:var(--rpa-ink); }
      .we-loading{ padding:60px; text-align:center; color:var(--rpa-ink-soft); }
      .we-bar{ display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; padding:14px 18px; margin-bottom:14px; position:sticky; top:72px; z-index:20; }
      .we-state{ display:flex; flex-direction:column; gap:4px; }
      .we-chip{ display:inline-block; align-self:flex-start; font:600 .8rem 'Source Sans 3',Arial,sans-serif; padding:4px 10px; border-radius:999px; background:#eef1f6; color:#586477; }
      .we-chip.draft{ background:#FFF4E0; color:#8A5A00; } .we-chip.ok{ background:#E6F4EA; color:#1E6B3A; }
      .we-meta{ font-size:.8rem; color:var(--rpa-ink-soft); }
      .we-actions{ display:flex; gap:10px; flex-wrap:wrap; }
      .we-btn{ font:500 .88rem 'Source Sans 3',Arial,sans-serif; padding:9px 16px; border-radius:8px; border:1.5px solid var(--rpa-line); background:#fff; color:var(--rpa-ink); cursor:pointer; }
      .we-btn:hover:not(:disabled){ border-color:var(--rpa-primary); }
      .we-btn.primary{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .we-btn:disabled{ opacity:.45; cursor:not-allowed; }
      .we-mini{ font:500 .78rem 'Source Sans 3',Arial,sans-serif; padding:5px 10px; border-radius:7px; border:1px solid var(--rpa-line); background:#fff; cursor:pointer; color:var(--rpa-ink); }
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
      .we-formhead h3{ margin:0; font:600 1.05rem 'Source Serif 4',Georgia,serif; overflow-wrap:anywhere; flex:1; min-width:140px; }
      .we-row{ display:flex; gap:6px; flex-wrap:wrap; }
      .we-tabs{ display:flex; gap:4px; border-bottom:1px solid var(--rpa-line); margin-bottom:16px; }
      .we-tabs button{ padding:9px 16px; border:0; background:none; border-bottom:2px solid transparent; cursor:pointer; font:500 .9rem 'Source Sans 3',Arial,sans-serif; color:var(--rpa-ink-soft); margin-bottom:-1px; }
      .we-tabs button.on{ color:var(--rpa-primary); border-bottom-color:var(--rpa-primary); }
      .we-stack{ display:flex; flex-direction:column; gap:14px; }
      .we-field{ display:flex; flex-direction:column; gap:5px; }
      .we-fl{ display:flex; justify-content:space-between; font-size:.8rem; font-weight:600; color:var(--rpa-ink); }
      .we-count{ font-weight:400; color:var(--rpa-ink-soft); font-family:'JetBrains Mono',monospace; font-size:.72rem; } .we-count.full{ color:#B3261E; }
      .we-field input,.we-field textarea{ width:100%; box-sizing:border-box; padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; font:.92rem 'Source Sans 3',Arial,sans-serif; color:var(--rpa-ink); background:#fff; resize:vertical; }
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
      .we-seg button{ padding:6px 14px; border:0; background:#fff; font:500 .82rem 'Source Sans 3',Arial,sans-serif; cursor:pointer; } .we-seg button.on{ background:var(--rpa-primary); color:#fff; }
      .we-framehost{ width:100%; margin-top:10px; }
      .we-frame-wrap{ margin:0 auto; border:1px solid var(--rpa-line); border-radius:10px; overflow:hidden; background:#fdf7eb; box-sizing:content-box; }
      .we-frame{ border:0; display:block; transform-origin:top left; }
      .we-warnlist{ list-style:none; padding:0; margin:12px 0 0; font-size:.8rem; color:#7A5200; display:flex; flex-direction:column; gap:4px; }
      .we-acct{ position:relative; font-size:.85rem; color:var(--rpa-ink-soft); }
      .we-pop{ position:absolute; right:0; top:calc(100% + 8px); z-index:60; width:280px; background:#fff; border:1px solid var(--rpa-line); border-radius:12px; box-shadow:0 14px 30px #0f172a22; padding:14px; display:flex; flex-direction:column; gap:9px; text-align:left; }
      .we-details{ margin-top:8px; } .we-details summary{ cursor:pointer; font-weight:600; } .we-details ol{ margin:8px 0 8px 18px; padding:0; } .we-details li{ margin:3px 0; }
      .we-pre{ background:#0f172a; color:#e6edf7; padding:12px; border-radius:8px; overflow:auto; font:12px/1.5 'JetBrains Mono',monospace; white-space:pre; margin:8px 0; }
      .we-pop input{ padding:9px 11px; border:1.5px solid var(--rpa-line); border-radius:8px; font:.9rem 'Source Sans 3',Arial,sans-serif; }
    
      /* ---- page sections ---- */
      .we-sections{ display:flex; gap:6px; flex-wrap:wrap; margin:0 0 16px; padding-bottom:14px; border-bottom:1px solid var(--rpa-line); }
      .we-sections button{ padding:10px 18px; border:1px solid var(--rpa-line); background:#fff; border-radius:5px; font:500 .86rem 'Source Sans 3',Arial,sans-serif; color:var(--rpa-ink-soft); cursor:pointer; }
      .we-sections button:hover{ border-color:var(--rpa-primary); color:var(--rpa-primary); }
      .we-sections button.on{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .we-headitem{ display:block; width:100%; text-align:left; padding:10px 12px; border:1.5px dashed var(--rpa-line); border-radius:9px; background:#fff; margin-bottom:12px; cursor:pointer; font:500 .86rem 'Source Sans 3',Arial,sans-serif; color:inherit; }
      .we-headitem.on{ border-color:var(--rpa-primary); border-style:solid; }
      .we-grid2{ grid-template-columns:minmax(340px,1fr) minmax(460px,1.5fr) !important; }
      @media(max-width:1000px){ .we-grid2{ grid-template-columns:1fr !important; } }
      .we-stagepick{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; }
      .we-stagepick button{ padding:8px 6px; border:1.5px solid var(--rpa-line); background:#fff; border-radius:7px; font:500 .8rem 'Source Sans 3',Arial,sans-serif; cursor:pointer; color:var(--rpa-ink); display:flex; flex-direction:column; align-items:center; gap:2px; }
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
