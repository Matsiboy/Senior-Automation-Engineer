// =====================================================================================
// App.jsx — the WHOLE site: one-page RPA lifecycle journey (Identify → Improve),
// the About/Contact subpages, and the /admin content editor. Everything lives in
// this single file on purpose — after initial setup, updating the site is just
// re-uploading this one file (main.jsx, index.html, vite.config.js etc. are one-time
// scaffolding you shouldn't need to touch again).
//
// EVERYTHING you'd normally touch lives in the CONFIG block below:
//   THEME       — the two-color palette + derived tones
//   ASSETS      — one place to swap in real images/drawings per stage
//   STAGE_META  — structural, language-independent stage data (id + icon, in order)
//   CONTENT     — ALL text, in both languages: CONTENT.en / CONTENT.no. This is the
//                 one place to edit copy, and the one place to add a third language.
//
// TO ADD A SECTION to any stage (or to About/Contact), push another {heading, body}
// object into that stage's `blocks` array — in BOTH CONTENT.en and CONTENT.no — or
// into about.sections / contact.sections. Nothing else needs to change. Easier: use
// the /admin panel, which edits and saves this same data (see the ADMIN section below).
//
// TO ADD A LANGUAGE: add a new key to CONTENT (copy the "en" shape), and add it to
// the LANGUAGES array below so its flag shows up in the switcher.
//
// FIREBASE: set FIREBASE_ENABLED to true and fill in firebaseConfig once you've
// created a project — see README.md. Content then syncs live via Firestore
// (collection "siteContent", one doc per language) instead of just this browser's
// localStorage.
//
// STRUCTURE OF THIS FILE, top to bottom:
//   1. Config: THEME, LANGUAGES, ASSETS, STAGE_META, CONTENT
//   2. Content persistence: useSiteContent / saveSiteContent / resetSiteContent
//   3. Shared UI: GlobalStyles, Logo, nav, progress rail, scroll helpers
//   4. HomeSection   — the "/" one-page journey
//   5. AboutSection  — the "/about" route
//   6. ContactSection — the "/contact" route
//   7. AdminSection  — the "/admin" content editor
//   8. Default export `App` — composes the four routes above (mounted by main.jsx)
// =====================================================================================

import React, { useEffect, useMemo, useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import {
  Search, ClipboardList, Compass, Code2, FlaskConical, Rocket, Activity,
  TrendingUp, Menu, X, ArrowUpRight, Mail, Github, Linkedin,
} from "lucide-react";

// ---------------------------------------------------------------------------
// FIREBASE (optional — off by default so the site works with zero setup)
// ---------------------------------------------------------------------------
export const FIREBASE_ENABLED = false; // flip to true once firebaseConfig is filled in

export const firebaseConfig = {
  apiKey: "AIzaSyD9LFCTjC9KNoNBCKXuglTiMBT8Nt4mxFM",
  authDomain: "senior-automation-engineer.firebaseapp.com",
  projectId: "senior-automation-engineer"",
  storageBucket: "senior-automation-engineer.firebasestorage.app",
  messagingSenderId: "1:175332574553:web:38905f1fdc2d3025073848"",
  appId: "YOUR_APP_ID",
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
// LANGUAGES — order controls the order the flags render in
// ---------------------------------------------------------------------------
export const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "no", flag: "🇳🇴", label: "Norsk" },
];
export const LANG_STORAGE_KEY = "site-lang";

// ---------------------------------------------------------------------------
// ASSETS — set any of these to an image URL (or an imported local file) to
// replace the generated placeholder graphic for that stage.
// ---------------------------------------------------------------------------
export const ASSETS = {
  identify: null,
  assess: null,
  design: null,
  develop: null,
  test: null,
  deploy: null,
  monitor: null,
  improve: null,
  heroDiagram: null,
};

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
// CONTENT — every string on the site, per language. This is the file's single
// source of truth for copy.
// ---------------------------------------------------------------------------
export const CONTENT = {
  // ================================================================= ENGLISH
  en: {
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
    stagePlaceholder: (n) => `stage-${n}.svg — replace via ASSETS`,
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
    footer: { backHome: "← Back home" },
  },

  // =============================================================== NORWEGIAN
  no: {
    name: "Mats Østvig",
    role: "Senior automasjonsingeniør",
    tagline: "Jeg kjører hver automatisering gjennom de samme åtte trinnene — fra å oppdage problemet til å bevise timene den sparte.",
    heroLede: "Hvert oppdrag følger den samme åtte-trinns livssyklusen under — scroll deg gjennom den, eller hopp rett til et trinn fra menyen.",
    ctaStart: "Start en samtale",
    ctaProcess: "Se prosessen",
    navNews: "Nyheter",
    navProjects: "Prosjekter",
    navAbout: "Om meg",
    navContact: "Kontakt",
    stagePlaceholder: (n) => `trinn-${n}.svg — bytt ut via ASSETS`,
    socials: { email: "mats.ostvig@example.com", github: "https://github.com/", linkedin: "https://linkedin.com/" },
    stages: {
      identify: {
        title: "Identifiser", kicker: "TRINN 01 / 08",
        summary: "Finn arbeidsflytene som faktisk er verdt å automatisere — høy frekvens, regelbaserte, og plagsomme nok til at folk allerede vil bli kvitt dem.",
        blocks: [
          { heading: "Hvor kandidatene kommer fra", body: "Skyggelegging av arbeidsdagen, teamintervjuer og tidsregistreringsdata avdekker repeterende arbeid før det noen gang blir formelt etterspurt." },
          { heading: "Hva som diskvalifiserer en prosess", body: "Lav frekvens, stadig skiftende regler, eller mye skjønnsutøvelse — disse forblir manuelle, eller blir redesignet først." },
        ],
      },
      assess: {
        title: "Vurder", kicker: "TRINN 02 / 08",
        summary: "Vurder hver kandidat på innsats, risiko og forventet tidsbesparelse, slik at veikartet rangeres etter avkastning — ikke etter hvem som ropte høyest.",
        blocks: [
          { heading: "Vurderingsmodell", body: "Volum × minutter spart per kjøring, veid mot byggekompleksitet og systemstabilitet." },
          { heading: "Godkjenning fra interessenter", body: "Ingenting går inn i byggekøen uten at prosesseieren er enig i målresultatet." },
        ],
      },
      design: {
        title: "Design", kicker: "TRINN 03 / 08",
        summary: "Kartlegg prosessen fra start til slutt — inkludert unntak — før en eneste linje med automatisering blir bygget.",
        blocks: [
          { heading: "Svømmebanekart", body: "Hver aktør, beslutningspunkt og overlevering, tegnet i BPMN 2.0 og validert av folkene som gjør jobben." },
          { heading: "Unntaksveier", body: "Kantsakene blir designet med hensikt, ikke oppdaget i produksjon." },
        ],
      },
      develop: {
        title: "Utvikle", kicker: "TRINN 04 / 08",
        summary: "Bygg med det enkleste pålitelige verktøyet — en API-integrasjon, et planlagt skript, eller en RPA-robot når systemet ikke gir noen annen vei inn.",
        blocks: [
          { heading: "Valg av verktøy", body: "API-er først, skript for dataflytting, RPA kun for lukkede systemer uten programmatisk tilgang." },
          { heading: "Innebygde reserveløsninger", body: "Alt automatiseringen ikke trygt kan løse, rutes til et menneske — aldri stille forkastet." },
        ],
      },
      test: {
        title: "Test", kicker: "TRINN 05 / 08",
        summary: "Kjør det mot ekte historiske data og reelle kantsaker før det noen gang rører produksjon.",
        blocks: [
          { heading: "Parallell kjøring", body: "Automatiseringen kjører side om side med den manuelle prosessen i en syklus, og resultatene sammenlignes linje for linje." },
          { heading: "Feilinjeksjon", body: "Dårlige data, tidsavbrudd og manglende felt testes med hensikt, ikke bare håpet unngått." },
        ],
      },
      deploy: {
        title: "Lanser", kicker: "TRINN 06 / 08",
        summary: "Lanser med en tilbakerullingsplan, tydelig eierskap, og en overlevering teamet faktisk kan vedlikeholde.",
        blocks: [
          { heading: "Trinnvis utrulling", body: "Nye automatiseringer kjører i skyggemodus, deretter på et utvalg saker, før de tar hele belastningen." },
          { heading: "Dokumentasjon og overlevering", body: "Kjørelogger på klarspråk og en gjennomgangsøkt, slik at automatiseringen overlever selv om jeg går videre." },
        ],
      },
      monitor: {
        title: "Overvåk", kicker: "TRINN 07 / 08",
        summary: "Hver automatisering rapporterer hva den gjorde, slik at avvik og feil dukker opp i løpet av dager, ikke måneder.",
        blocks: [
          { heading: "Statusdashboard", body: "Antall kjøringer, feilrate og spart tid, sporet per automatisering og gjennomgått månedlig." },
          { heading: "Varsling", body: "Feil varsler et menneske umiddelbart — automatisering skal aldri feile i stillhet." },
        ],
      },
      improve: {
        title: "Forbedre", kicker: "TRINN 08 / 08",
        summary: "Mål på nytt mot den opprinnelige basislinjen, og før det som læres tilbake inn i neste identifiseringsrunde.",
        blocks: [
          { heading: "Basislinje vs. faktisk", body: "30/90-dagerstallene sammenlignes med det opprinnelige estimatet, åpent, på dashbordet." },
          { heading: "Tilbake til trinn én", body: "Hver forbedringssyklus avdekker neste kandidat — sløyfen er selve poenget." },
        ],
      },
    },
    news: {
      kicker: "SISTE", heading: "Nyheter",
      items: [
        { id: "n1", date: "2026-08", title: "Kuttet fakturaavstemming fra 27 t/uke til under 1", body: "Ny robot håndterer avstemming på tvers av to gamle systemer uten delt API." },
        { id: "n2", date: "2026-05", title: "Foredrag på OpsAutomate Summit", body: "Et foredrag om å måle avkastning på automatisering ærlig, ikke optimistisk." },
      ],
    },
    projects: {
      kicker: "UTVALGT ARBEID", heading: "Prosjekter",
      items: [
        { id: "p1", tag: "RPA", title: "Fakturamatchingsrobot", body: "UiPath-robot som matcher fakturaer mot innkjøpsordrer på tvers av to gamle systemer." },
        { id: "p2", tag: "Skript", title: "Sendingsavstemmingspipeline", body: "Planlagt Python-jobb som erstatter en manuell regnearksprosess på 14 timer i uken." },
        { id: "p3", tag: "Integrasjon", title: "Ruting av utgiftsgodkjenning", body: "Power Automate-flyt som kutter gjennomsnittlig godkjenningstid fra 6 dager til 9 timer." },
      ],
    },
    ctaBand: {
      heading: "Har du en prosess teamet ditt har mistet tålmodigheten med?",
      body: "Send en kort beskrivelse av arbeidsflyten — jeg skal ærlig fortelle deg om den er verdt å automatisere.",
      button: "Ta kontakt",
    },
    about: {
      kicker: "OM MEG",
      heading: "Bakgrunn fra drift, ingeniørvaner.",
      intro: "Ni år med å gå fra å drifte en operasjonsavdeling til å bygge systemene som erstattet de trege delene av den.",
      sections: [
        { heading: "2023 — nå · Senior automasjonsingeniør, Northgate Financial Services", body: "Eier automatiseringsveikartet for finansdrift: behandling av leverandør-/kundefordringer, avstemming og rapportering, med et fast tidsbesparelsesdashbord som gjennomgås månedlig av driftsledelsen." },
        { heading: "2020 — 2023 · Prosessautomatiseringsingeniør, Harrow Logistics Group", body: "Ledet prosesskartlegging på tvers av lager og utsendelse, og omsatte arbeidsflyter fra gulvet til automatiseringer som kuttet manuell avstemming fra 14 timer i uken til under 1." },
        { heading: "2017 — 2020 · Forretningsprosessanalytiker, Corvin & Wade Consulting", body: "Kartla og redesignet back office-prosesser for mellomstore kunder — og lærte at et prosesskart ingen kjenner seg igjen i, er verre enn ikke noe kart i det hele tatt." },
        { heading: "Sertifiseringer", body: "UiPath Advanced RPA Developer · Lean Six Sigma Green Belt · Microsoft Power Platform Fundamentals." },
      ],
      skillsHeading: "VERKTØYKASSE",
      skills: ["UiPath", "Power Automate", "Python", "SQL", "BPMN 2.0", "REST APIer", "Azure Logic Apps", "Power BI"],
      ctaHeading: "Vil du ha den lange versjonen?",
      ctaBody: "Gjerne en gjennomgang av spesifikke prosjekter og hva jeg ville gjort annerledes.",
      ctaButton: "Ta kontakt",
    },
    contact: {
      kicker: "KONTAKT",
      heading: "Fortell meg om prosessen som bremser deg ned.",
      intro: "Noen setninger om oppgaven, hvor ofte den skjer, og hvem som sitter fast med den, er nok til å starte med.",
      formEndpoint: "",
      sections: [
        { heading: "E-post", body: "mats.ostvig@example.com" },
        { heading: "LinkedIn", body: "linkedin.com/in/matsostvig" },
        { heading: "Lokasjon", body: "Remote — åpen for oppdrag på stedet" },
      ],
      form: {
        name: "Navn", email: "E-post", message: "Hvilken prosess snakker vi om?",
        submit: "Send melding", sending: "Sender…",
        sent: "Takk — jeg tar kontakt.", error: "Noe gikk galt — send meg heller en e-post direkte.",
      },
    },
    footer: { backHome: "← Tilbake til forsiden" },
  },
};

// =====================================================================================
// Language hook — persists the choice in localStorage so it survives page/route
// changes (this file doesn't assume a shared React context across routes).
// =====================================================================================
export function useLanguage() {
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return "en";
    try { return localStorage.getItem(LANG_STORAGE_KEY) || "en"; } catch { return "en"; }
  });
  function setLang(code) {
    setLangState(code);
    try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch {}
  }
  return [lang, setLang];
}

export function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="rpa-lang" role="group" aria-label="Language / Språk">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={lang === l.code ? "active" : ""}
          onClick={() => setLang(l.code)}
          aria-label={l.label}
          aria-pressed={lang === l.code}
          title={l.label}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}

// =====================================================================================
// Content persistence — one Firestore document per language (collection
// "siteContent", doc id = lang code) holds the whole CONTENT[lang] shape.
// The public site reads it live; the AdminSection below writes it.
// Falls back to localStorage if Firebase isn't enabled, and to the hardcoded
// CONTENT[lang] above if nothing has been saved yet — so the site always
// renders something sensible.
// =====================================================================================
const CONTENT_COLLECTION = "siteContent";
const contentOverrideKey = (lang) => `site-content-override-${lang}`;

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

function readLocalOverride(lang) {
  try {
    const raw = localStorage.getItem(contentOverrideKey(lang));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Reads the current merged content once (default merged with any local
// override) — used to seed the admin panel's editable draft.
export function getEditableContent(lang) {
  const local = readLocalOverride(lang);
  return local ? deepMerge(CONTENT[lang], local) : CONTENT[lang];
}

// Live content for the public-facing pages: defaults → local override → Firebase.
export function useSiteContent(lang) {
  const [content, setContent] = useState(() => deepMerge(CONTENT[lang], readLocalOverride(lang)));
  const [source, setSource] = useState(() => (readLocalOverride(lang) ? "local" : "default"));

  useEffect(() => {
    const local = readLocalOverride(lang);
    setContent(deepMerge(CONTENT[lang], local));
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
          doc(db, CONTENT_COLLECTION, lang),
          (snap) => {
            if (snap.exists()) {
              setContent(deepMerge(CONTENT[lang], snap.data()));
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
  }, [lang]);

  return [content, source];
}

// Called by AdminSection below. Always mirrors to localStorage (so the admin panel
// works with zero Firebase setup); also writes to Firestore when enabled.
export async function saveSiteContent(lang, content) {
  try { localStorage.setItem(contentOverrideKey(lang), JSON.stringify(content)); } catch {}
  if (!FIREBASE_ENABLED) return { ok: true, target: "local" };
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await setDoc(doc(db, CONTENT_COLLECTION, lang), content);
    return { ok: true, target: "firebase" };
  } catch (err) {
    console.error(err);
    return { ok: false, target: "firebase", error: err };
  }
}

export function resetSiteContent(lang) {
  try { localStorage.removeItem(contentOverrideKey(lang)); } catch {}
}

// =====================================================================================
// Media (stage images) — separate from CONTENT because a photo should be the
// same regardless of language. One Firestore doc total (collection "siteMedia",
// doc "default") holds { stages: { identify: {src, scale, x, y}, ... } }.
// src is either a data: URL (zero-setup fallback) or a Firebase Storage
// download URL (used automatically once FIREBASE_ENABLED is true). scale is a
// zoom multiplier (1 = fit, up to 2.5); x/y are CSS object-position percentages
// used to pan/recenter the crop — this is what "reposition" means here.
// =====================================================================================
const MEDIA_COLLECTION = "siteMedia";
const MEDIA_DOC_ID = "default";
const MEDIA_STORAGE_KEY = "site-media-override";

function defaultMedia() {
  const stages = {};
  STAGE_META.forEach((s) => { stages[s.id] = { src: ASSETS[s.id] || null, scale: 1, x: 50, y: 50 }; });
  return { stages };
}

function readLocalMediaOverride() {
  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getEditableMedia() {
  const local = readLocalMediaOverride();
  return local ? deepMerge(defaultMedia(), local) : defaultMedia();
}

export function useSiteMedia() {
  const [media, setMediaState] = useState(() => deepMerge(defaultMedia(), readLocalMediaOverride()));

  useEffect(() => {
    setMediaState(deepMerge(defaultMedia(), readLocalMediaOverride()));
    if (!FIREBASE_ENABLED) return;
    let unsub = () => {};
    (async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getFirestore, doc, onSnapshot } = await import("firebase/firestore");
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getFirestore(app);
        unsub = onSnapshot(
          doc(db, MEDIA_COLLECTION, MEDIA_DOC_ID),
          (snap) => { if (snap.exists()) setMediaState(deepMerge(defaultMedia(), snap.data())); },
          () => {}
        );
      } catch (err) {
        console.warn("Firestore media unavailable, using local/default.", err);
      }
    })();
    return () => unsub();
  }, []);

  return [media];
}

export async function saveSiteMedia(media) {
  try { localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(media)); } catch {}
  if (!FIREBASE_ENABLED) return { ok: true, target: "local" };
  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getFirestore, doc, setDoc } = await import("firebase/firestore");
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    await setDoc(doc(db, MEDIA_COLLECTION, MEDIA_DOC_ID), media);
    return { ok: true, target: "firebase" };
  } catch (err) {
    console.error(err);
    return { ok: false, target: "firebase", error: err };
  }
}

export function resetSiteMedia() {
  try { localStorage.removeItem(MEDIA_STORAGE_KEY); } catch {}
}

// Downscales an uploaded file client-side before storing it, so a phone photo
// doesn't blow past localStorage/Firestore size limits. Returns a JPEG Blob.
function resizeImageFile(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob); }, "image/jpeg", quality);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Tries Firebase Storage first (small download-URL string, no size worries);
// falls back to an inline data: URL (works with zero setup, but counts against
// localStorage's ~5-10MB quota and Firestore's 1MiB-per-document limit).
async function uploadStageImage(file) {
  const blob = await resizeImageFile(file);
  if (FIREBASE_ENABLED) {
    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const storage = getStorage(app);
      const path = `site-media/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.warn("Firebase Storage upload failed, falling back to an inline image.", err);
    }
  }
  return blobToDataURL(blob);
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
      .rpa-nav-links a{ text-decoration:none; font-size:0.86rem; font-family:'JetBrains Mono',monospace; padding:8px 12px; border-radius:999px; color:var(--rpa-ink-soft); transition:all .15s ease; white-space:nowrap; }
      .rpa-nav-links a:hover{ color:var(--rpa-ink); background:var(--rpa-paper-dim); }
      .rpa-nav-links a.active{ color:var(--rpa-primary); background:none; font-weight:600; }
      .rpa-nav-sub{ display:flex; gap:14px; align-items:center; margin-left:14px; padding-left:14px; border-left:1px solid var(--rpa-line); }
      .rpa-nav-sub a{ font-family:'Inter',sans-serif; font-weight:600; padding:8px 4px; }
      .rpa-nav-toggle{ display:none; background:none; border:none; cursor:pointer; color:var(--rpa-ink); }
      .rpa-lang{ display:flex; gap:6px; align-items:center; }
      .rpa-lang button{ background:none; border:1px solid var(--rpa-line); border-radius:8px; padding:3px 7px; font-size:1rem; line-height:1.4; cursor:pointer; opacity:.5; transition: all .15s ease; }
      .rpa-lang button:hover{ opacity:.85; }
      .rpa-lang button.active{ opacity:1; border-color:var(--rpa-primary); background:var(--rpa-primary-soft); }
      @media (max-width:980px){
        .rpa-nav-links{ display:none; }
        .rpa-nav-toggle{ display:block; }
        .rpa-nav-links.open{ display:flex; position:absolute; top:100%; left:0; right:0; flex-direction:column; align-items:flex-start; background:var(--rpa-paper); padding:16px 28px; border-bottom:1px solid var(--rpa-line); gap:4px; }
        .rpa-nav-sub{ border-left:none; padding-left:0; margin-left:0; flex-direction:column; align-items:flex-start; gap:10px; margin-top:8px; padding-top:8px; border-top:1px solid var(--rpa-line); }
      }

      .rpa-hero{ position:relative; padding:96px 0 72px; overflow:hidden; }
      .rpa-hero::before{ content:""; position:absolute; top:-120px; right:-120px; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle,var(--rpa-primary-soft) 0%,transparent 70%); z-index:0; }
      .rpa-hero .rpa-wrap{ position:relative; z-index:1; }
      .rpa-kicker{ font-family:'JetBrains Mono',monospace; font-size:0.82rem; color:var(--rpa-primary-dark); margin-bottom:16px; }
      .rpa-hero h1{ font-size:clamp(2.1rem,4.4vw,3.5rem); max-width:16ch; }
      .rpa-hero .lede{ font-size:1.1rem; color:var(--rpa-ink-soft); max-width:52ch; }
      .rpa-cta-row{ display:flex; gap:14px; flex-wrap:wrap; margin-top:8px; }
      .rpa-btn{ display:inline-flex; align-items:center; gap:8px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.94rem; padding:13px 24px; border-radius:999px; text-decoration:none; border:1.5px solid var(--rpa-ink); color:var(--rpa-ink); transition:all .15s ease; }
      .rpa-btn.solid{ background:var(--rpa-primary); border-color:var(--rpa-primary); color:#fff; }
      .rpa-btn.solid:hover{ background:var(--rpa-primary-dark); border-color:var(--rpa-primary-dark); }
      .rpa-btn:not(.solid):hover{ background:var(--rpa-paper-dim); }
      .rpa-arrow-link{ display:inline-flex; align-items:center; gap:6px; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:0.94rem; color:var(--rpa-primary); text-decoration:none; padding:13px 4px; }
      .rpa-arrow-link:hover{ text-decoration:underline; }

      .rpa-journey{ position:relative; padding-top:24px; }
      .rpa-rail-overlay{ position:absolute; inset:0; pointer-events:none; z-index:2; }
      .rpa-rail-overlay .rpa-wrap{ position:relative; height:100%; }
      .rpa-rail{ position:sticky; top:90px; width:52px; height:calc(100vh - 140px); display:flex; flex-direction:column; align-items:center; flex:none; }
      .rpa-rail-line{ position:relative; flex:1; width:2px; background:var(--rpa-line); }
      .rpa-rail-fill{ position:absolute; top:0; left:0; width:100%; background:var(--rpa-primary); transition:height .2s ease; }
      .rpa-rail-dot{ position:absolute; left:50%; transform:translate(-50%,-50%); width:10px; height:10px; border-radius:50%; background:var(--rpa-paper); border:2px solid var(--rpa-line); transition:all .2s ease; }
      .rpa-rail-dot.active{ background:var(--rpa-primary); border-color:var(--rpa-primary); width:14px; height:14px; }
      @media (max-width:980px){ .rpa-rail{ display:none; } }

      .rpa-stage-band{ padding:72px 0; }
      .rpa-stage-band.alt{ background:var(--rpa-paper-dim); }
      @media (min-width:981px){ .rpa-stage-band > .rpa-wrap{ padding-left:76px; } }
      .rpa-stage{ scroll-margin-top:90px; display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
      .rpa-stage.flip{ direction:rtl; }
      .rpa-stage.flip > *{ direction:ltr; }
      .rpa-stage-icon{ width:46px; height:46px; border-radius:14px; background:var(--rpa-primary-soft); color:var(--rpa-primary); display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
      .rpa-stage h2{ font-size:clamp(1.6rem,2.6vw,2.2rem); }
      .rpa-stage .rpa-summary{ color:var(--rpa-ink-soft); max-width:46ch; margin-bottom:20px; }
      .rpa-block{ padding:16px 0; border-top:1px solid var(--rpa-line); }
      .rpa-block:first-of-type{ border-top:none; }
      .rpa-block h4{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:1rem; margin:0 0 4px; }
      .rpa-block p{ color:var(--rpa-ink-soft); margin:0; font-size:0.95rem; }
      .rpa-stage-art{ border-radius:20px; border:1px solid var(--rpa-line); background:#fff; padding:20px; box-shadow:0 1px 3px rgba(15,23,42,0.05); }
      .rpa-stage-art img{ width:100%; border-radius:12px; display:block; }
      .rpa-stage-art-frame{ position:relative; width:100%; aspect-ratio:4/3; overflow:hidden; border-radius:12px; background:var(--rpa-paper-dim); }
      .rpa-stage-art-frame img{ width:100%; height:100%; object-fit:cover; border-radius:0; transition:transform .15s ease, object-position .15s ease; }
      @media (max-width:860px){ .rpa-stage{ grid-template-columns:1fr; } .rpa-stage.flip{ direction:ltr; } .rpa-stage.flip > *{ direction:ltr; } }

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
export function Logo({ size = 26 }) {
  // A trigger node branching into two connected process nodes — a small,
  // literal flowchart glyph, monochrome in THEME.primary. Swap this component
  // any time for a different logo; it's only referenced from the brand link
  // in TopNav (here) and the header of AboutSection / ContactSection.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="1" width="6" height="6" rx="1.2" fill={THEME.primary} />
      <rect x="1" y="15" width="6" height="6" rx="1.2" stroke={THEME.primary} strokeWidth="1.6" />
      <rect x="17" y="15" width="6" height="6" rx="1.2" stroke={THEME.primary} strokeWidth="1.6" />
      <path d="M12 7V11M4 11H20M4 11V15M20 11V15" stroke={THEME.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function StagePlaceholderArt({ index, caption }) {
  const seed = (index * 47) % 360;
  return (
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <defs>
        <radialGradient id={`g${index}`} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={THEME.primary} stopOpacity="0.18" />
          <stop offset="100%" stopColor={THEME.primary} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#g${index})`} />
      <g stroke={THEME.primary} strokeWidth="1.4" fill="none" opacity="0.85" transform={`rotate(${seed % 12} 200 150)`}>
        <circle cx="200" cy="150" r="70" strokeDasharray="4 5" />
        <circle cx="200" cy="150" r="110" opacity="0.5" />
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const rad = (a * Math.PI) / 180;
          const x = 200 + 70 * Math.cos(rad);
          const y = 150 + 70 * Math.sin(rad);
          return <circle key={a} cx={x} cy={y} r="4" fill={THEME.primary} stroke="none" />;
        })}
        <line x1="200" y1="80" x2="200" y2="220" opacity="0.4" />
        <line x1="130" y1="150" x2="270" y2="150" opacity="0.4" />
      </g>
      <text x="20" y="284" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={THEME.inkSoft}>{caption}</text>
    </svg>
  );
}

function StageArt({ stageId, index, caption, image }) {
  const img = image || { src: null, scale: 1, x: 50, y: 50 };
  return (
    <div className="rpa-stage-art">
      {img.src ? (
        <div className="rpa-stage-art-frame">
          <img
            src={img.src}
            alt={`${stageId} illustration`}
            style={{ transform: `scale(${img.scale})`, objectPosition: `${img.x}% ${img.y}%` }}
          />
        </div>
      ) : (
        <StagePlaceholderArt index={index} caption={caption} />
      )}
    </div>
  );
}

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
function TopNav({ activeId, t, lang, setLang }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="rpa-nav">
      <div className="rpa-nav-bar">
        <a className="rpa-brand" href="#home" onClick={(e) => scrollToSection(e, "home")}>
          <Logo size={24} />
          {t.name}
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
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
        </nav>
      </div>
    </header>
  );
}

// =====================================================================================
// Progress rail
// =====================================================================================
function ProgressRail({ activeId }) {
  const activeIndex = STAGE_META.findIndex((s) => s.id === activeId);
  const pct = activeIndex >= 0 ? ((activeIndex + 1) / STAGE_META.length) * 100 : 0;
  return (
    <div className="rpa-rail" aria-hidden="true">
      <div className="rpa-rail-line">
        <div className="rpa-rail-fill" style={{ height: `${pct}%` }} />
        {STAGE_META.map((s, i) => (
          <div
            key={s.id}
            className={`rpa-rail-dot${s.id === activeId ? " active" : ""}`}
            style={{ top: `${(i / (STAGE_META.length - 1)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================================================
// Main app
// =====================================================================================
function HomeSection() {
  const [lang, setLang] = useLanguage();
  const [t] = useSiteContent(lang);
  const [media] = useSiteMedia();
  const sectionIds = useMemo(() => ["home", ...STAGE_META.map((s) => s.id), "news", "projects"], []);
  const active = useScrollSpy(sectionIds);
  const news = t.news.items;
  const projects = t.projects.items;

  return (
    <div className="rpa-root" lang={lang}>
      <GlobalStyles />
      <TopNav activeId={active} t={t} lang={lang} setLang={setLang} />

      <section className="rpa-hero" id="home">
        <div className="rpa-wrap">
          <div className="rpa-kicker">{t.role.toUpperCase()}</div>
          <h1 className="rpa-h">{t.tagline}</h1>
          <p className="lede">{t.heroLede}</p>
          <div className="rpa-cta-row">
            <Link className="rpa-btn solid" to="/contact">{t.ctaStart} <ArrowUpRight size={16} /></Link>
            <a className="rpa-arrow-link" href="#identify" onClick={(e) => scrollToSection(e, "identify")}>{t.ctaProcess} →</a>
          </div>
        </div>
      </section>

      <div className="rpa-journey">
        <div className="rpa-rail-overlay">
          <div className="rpa-wrap">
            <ProgressRail activeId={active} />
          </div>
        </div>
        {STAGE_META.map((meta, i) => {
          const Icon = meta.icon;
          const stage = t.stages[meta.id];
          const flipped = i % 2 === 1;
          return (
            <div className={`rpa-stage-band${flipped ? " alt" : ""}`} key={meta.id}>
              <div className="rpa-wrap">
                <section className={`rpa-stage${flipped ? " flip" : ""}`} id={meta.id}>
                  <div>
                    <div className="rpa-stage-icon"><Icon size={22} /></div>
                    <div className="rpa-kicker">{stage.kicker}</div>
                    <h2 className="rpa-h">{stage.title}</h2>
                    <p className="rpa-summary">{stage.summary}</p>
                    {/* Add more entries to CONTENT[lang].stages.<id>.blocks to extend this stage */}
                    {stage.blocks.map((b, bi) => (
                      <Block key={bi} heading={b.heading} body={b.body} />
                    ))}
                  </div>
                  <StageArt stageId={meta.id} index={i} caption={t.stagePlaceholder(String(i + 1).padStart(2, "0"))} image={media.stages[meta.id]} />
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
  const [lang, setLang] = useLanguage();
  const [t] = useSiteContent(lang);
  const { about } = t;

  return (
    <div className="rpa-root" lang={lang}>
      <GlobalStyles />
      <header className="rpa-nav">
        <div className="rpa-nav-bar">
          <Link className="rpa-brand" to="/"><Logo size={22} />{t.name}</Link>
          <nav className="rpa-nav-links" style={{ display: "flex" }}>
            <Link to="/">{lang === "no" ? "Hjem" : "Home"}</Link>
            <Link to="/about" className="active">{t.navAbout}</Link>
            <Link to="/contact">{t.navContact}</Link>
            <div className="rpa-nav-sub" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: "none" }}>
              <LanguageSwitcher lang={lang} setLang={setLang} />
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
            {/* Add more entries to CONTENT[lang].about.sections in App.jsx to extend this list */}
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
  const [lang, setLang] = useLanguage();
  const [t] = useSiteContent(lang);
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
    <div className="rpa-root" lang={lang}>
      <GlobalStyles />
      <header className="rpa-nav">
        <div className="rpa-nav-bar">
          <Link className="rpa-brand" to="/"><Logo size={22} />{t.name}</Link>
          <nav className="rpa-nav-links" style={{ display: "flex" }}>
            <Link to="/">{lang === "no" ? "Hjem" : "Home"}</Link>
            <Link to="/about">{t.navAbout}</Link>
            <Link to="/contact" className="active">{t.navContact}</Link>
            <div className="rpa-nav-sub" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: "none" }}>
              <LanguageSwitcher lang={lang} setLang={setLang} />
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
            {/* Add more entries to CONTENT[lang].contact.sections in App.jsx to extend this list */}
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
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
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

// Upload (or paste a URL), then rescale and reposition the crop. `value` is
// {src, scale, x, y} — see the "Media" section near the top of this file for
// what each field means and how it's persisted.
function ImageEditor({ label, value, onChange }) {
  const v = value || { src: null, scale: 1, x: 50, y: 50 };
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const src = await uploadStageImage(file);
      onChange({ ...v, src });
    } catch (err) {
      console.error(err);
      setError("Couldn't process that image — try a different file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="adm-list">
      <div className="adm-list-label">{label}</div>
      <div className="adm-image-row">
        <div className="adm-image-preview">
          {v.src
            ? <img src={v.src} alt="" style={{ transform: `scale(${v.scale})`, objectPosition: `${v.x}% ${v.y}%` }} />
            : <span className="adm-muted">No image — placeholder art shows instead</span>}
        </div>
        <div className="adm-image-controls">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          {uploading && <span className="adm-muted">Processing…</span>}
          {error && <span className="adm-status error">{error}</span>}
          <TextField
            label="…or paste an image URL instead"
            value={v.src && !v.src.startsWith("data:") ? v.src : ""}
            onChange={(val) => onChange({ ...v, src: val || null })}
          />
          <div className="adm-field">
            <label>Zoom ({Math.round(v.scale * 100)}%)</label>
            <input type="range" min="100" max="250" value={Math.round(v.scale * 100)} onChange={(e) => onChange({ ...v, scale: Number(e.target.value) / 100 })} />
          </div>
          <div className="adm-field">
            <label>Reposition — horizontal ({v.x}%)</label>
            <input type="range" min="0" max="100" value={v.x} onChange={(e) => onChange({ ...v, x: Number(e.target.value) })} />
          </div>
          <div className="adm-field">
            <label>Reposition — vertical ({v.y}%)</label>
            <input type="range" min="0" max="100" value={v.y} onChange={(e) => onChange({ ...v, y: Number(e.target.value) })} />
          </div>
          {v.src && (
            <button type="button" className="adm-remove" onClick={() => onChange({ src: null, scale: 1, x: 50, y: 50 })}>
              Remove image
            </button>
          )}
        </div>
      </div>
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
      .adm-tabs button{ font-family:'JetBrains Mono',monospace; font-size:0.82rem; text-transform:uppercase; letter-spacing:.03em; padding:8px 14px; border-radius:999px; border:1px solid var(--rpa-line); background:#fff; color:var(--rpa-ink-soft); cursor:pointer; }
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
      .adm-image-row{ display:flex; gap:20px; flex-wrap:wrap; }
      .adm-image-preview{ width:180px; height:135px; flex:none; border:1px solid var(--rpa-line); border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--rpa-paper-dim); text-align:center; padding:8px; }
      .adm-image-preview img{ width:100%; height:100%; object-fit:cover; }
      .adm-image-preview span{ font-size:0.78rem; color:var(--rpa-ink-soft); }
      .adm-image-controls{ flex:1; min-width:240px; display:flex; flex-direction:column; gap:12px; }
      .adm-image-controls input[type="range"]{ width:100%; accent-color:var(--rpa-primary); }
      .adm-image-controls input[type="file"]{ font-size:0.85rem; }
      .adm-remove{ align-self:flex-start; font-family:'JetBrains Mono',monospace; font-size:0.76rem; color:#B3261E; background:none; border:1px solid #B3261E; border-radius:999px; padding:4px 11px; cursor:pointer; }
      .adm-add{ font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:var(--rpa-primary-dark); background:var(--rpa-primary-soft); border:1px solid var(--rpa-primary); border-radius:999px; padding:7px 14px; cursor:pointer; margin-top:8px; }
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

  const [lang, setLang] = useState(LANGUAGES[0].code);
  const [draft, setDraft] = useState(() => getEditableContent(lang));
  const [mediaDraft, setMediaDraft] = useState(() => getEditableMedia());
  const [tab, setTab] = useState("general");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setDraft(getEditableContent(lang));
    setStatus(null);
  }, [lang]);

  function set(path, value) {
    setDraft((prev) => {
      const clone = cloneContent(prev);
      let node = clone;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return clone;
    });
  }

  function setMedia(path, value) {
    setMediaDraft((prev) => {
      const clone = cloneContent(prev);
      let node = clone;
      for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
      node[path[path.length - 1]] = value;
      return clone;
    });
  }

  async function handleSave() {
    setStatus({ type: "pending", message: "Saving…" });
    const [contentRes, mediaRes] = await Promise.all([
      saveSiteContent(lang, draft),
      saveSiteMedia(mediaDraft),
    ]);
    const ok = contentRes.ok && mediaRes.ok;
    const wentLive = contentRes.target === "firebase" && mediaRes.target === "firebase";
    setStatus(
      ok
        ? { type: "ok", message: wentLive ? "Saved to Firebase — live for every visitor." : "Saved in this browser (Firebase not connected — see README.md)." }
        : { type: "error", message: "Firebase save failed (see console). Your changes are still saved locally." }
    );
  }

  function handleReset() {
    if (!window.confirm("Discard saved overrides and revert this language to the code defaults? (Images are shared across languages and won't be affected — remove them individually in the Journey tab if needed.)")) return;
    resetSiteContent(lang);
    setDraft(getEditableContent(lang));
    setStatus({ type: "ok", message: "Reverted to code defaults." });
  }

  if (!unlocked) {
    return (
      <div className="rpa-root adm-gate">
        <GlobalStyles />
        <AdminStyles />
        <div className="adm-gate-box">
          <Logo size={30} />
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
          <Link className="rpa-brand" to="/"><Logo size={22} />Admin</Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--rpa-line)" }}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
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
                  <ImageEditor label="Stage image (shared across languages)" value={mediaDraft.stages[s.id]} onChange={(v) => setMedia(["stages", s.id], v)} />
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
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeSection />} />
      <Route path="/about" element={<AboutSection />} />
      <Route path="/contact" element={<ContactSection />} />
      <Route path="/admin" element={<AdminSection />} />
    </Routes>
  );
}
