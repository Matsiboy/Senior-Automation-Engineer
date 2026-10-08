// =====================================================================================
// App.jsx — the WHOLE site: one-page RPA lifecycle journey (Identify → Improve),
// the About/Contact subpages, and the /admin content editor. Everything lives in
// this single file on purpose — after initial setup, updating the site is just
// re-uploading this one file (main.jsx, index.html, vite.config.js etc. are one-time
// scaffolding you shouldn't need to touch again).
//
// EVERYTHING you'd normally touch lives in the CONFIG block below:
//   THEME       — the two-color palette + derived tones
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
//   1. Config: THEME, LANGUAGES, STAGE_META, CONTENT
//   2. Content persistence: useSiteContent / saveSiteContent / resetSiteContent
//   3. Shared UI: GlobalStyles, Logo, nav, progress rail, scroll helpers
//   4. HomeSection   — the "/" one-page journey
//   5. AboutSection  — the "/about" route
//   6. ContactSection — the "/contact" route
//   7. AdminSection  — the "/admin" content editor
//   8. Default export `App` — composes the four routes above (mounted by main.jsx)
// =====================================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import {
  Search, ClipboardList, Compass, Code2, FlaskConical, Rocket, Activity,
  TrendingUp, Menu, X, ArrowUpRight, Mail, Github, Linkedin,
  FileText, MessageSquare, BarChart3, Target, Check, Plug, Terminal, Bot, Bell, RefreshCw,
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
// LANGUAGES — order controls the order the flags render in
// ---------------------------------------------------------------------------
export const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "no", flag: "🇳🇴", label: "Norsk" },
];
export const LANG_STORAGE_KEY = "site-lang";

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
      baseline: { label: "Baseline estimate", value: "20 h/week" },
      measured: { label: "Measured at 90 days", value: "27 h/week" },
      delta: "+35% vs. estimate",
      measuring: "Re-measuring…",
      done: "Fed back into the next cycle",
      next: { tag: "NEW CANDIDATE", title: "Expense approvals", sub: "Back to Identify" },
      chips: ["Re-measure", "Compare to baseline", "Feed back"],
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
    identifyDemo: {
      label: "KARTLEGGING AV ARBEIDSFLYT",
      scanning: "Skanner arbeidsflyt…",
      complete: "Skanning ferdig",
      pending: "Venter på vurdering",
      candidate: "Automatiser",
      skip: "Behold manuelt",
      summaryCandidate: "å automatisere",
      summarySkip: "forblir manuelle",
      cards: [
        { title: "Fakturaregistrering", sub: "Økonomiflyt", freq: "Daglig", attrs: ["Høy frekvens", "Regelbasert", "Strukturerte data"] },
        { title: "Kundeeskalering", sub: "Supportflyt", freq: "Daglig", attrs: ["Varierer", "Skjønnsvurdering", "Mange unntak"] },
        { title: "Rapportsamling", sub: "Driftsflyt", freq: "Daglig", attrs: ["Høy frekvens", "Gjentakbare steg", "Stabile regler"] },
        { title: "Årlig strategigjennomgang", sub: "Ledelsesflyt", freq: "Årlig", attrs: ["Lav frekvens", "Skiftende regler", "Åpen oppgave"] },
      ],
    },
    assessDemo: {
      label: "VURDERING",
      cols: ["Spart tid", "Innsats", "Risiko"],
      scoring: "Vurderer kandidater…",
      ranked: "Rangert etter avkastning",
      top: "Bygg først",
      chips: ["Volum × spart tid", "Byggekompleksitet", "Systemstabilitet"],
      rows: ["Utgiftsgodkjenning", "Fakturamatching", "Rapportsamling"],
    },
    designDemo: {
      label: "PROSESSKART",
      mapping: "Kartlegger prosess…",
      mapped: "Kart ferdig — inkludert unntak",
      lanes: ["AUTOMATISERING", "MENNESKE"],
      nodes: ["Motta", "Valider", "Treff?", "Bokfør", "Manuell vurdering"],
      yes: "ja",
      no: "nei",
      chips: ["5 steg", "1 beslutning", "1 unntaksvei"],
    },
    developDemo: {
      label: "VALG AV VERKTØY",
      situation: "Situasjon",
      scenarios: ["Systemet har et API", "Det handler bare om å flytte data etter en plan", "Lukket system uten API"],
      tools: [
        { name: "API-integrasjon", rank: "1. valg" },
        { name: "Planlagt skript", rank: "2. valg" },
        { name: "RPA-robot", rank: "Siste utvei" },
      ],
      choosing: "Velger det enkleste pålitelige verktøyet…",
      done: "Enkleste pålitelige verktøy vinner",
      summary: "Enkleste pålitelige verktøy først",
      chips: ["API-er først", "Skript for data", "RPA sist"],
    },
    testDemo: {
      label: "PARALLELL KJØRING",
      cols: ["Post", "Manuelt", "Automatisk"],
      running: "Sammenligner resultater…",
      passed: "Alle resultater stemmer",
      chips: ["Dårlige data fanget", "Tidsavbrudd håndtert", "Manglende felt håndtert"],
    },
    deployDemo: {
      label: "UTRULLING",
      stages: ["Skyggemodus", "Utvalg av saker", "Full last"],
      bar: "Saker håndtert av automatisering",
      rolling: "Ruller ut…",
      done: "Live og overlevert",
      rollback: "Tilbakerullingsplan klar",
      handoff: "Dokumentasjon og gjennomgang",
      chips: ["Tilbakerullingsplan", "Tydelig eierskap", "Overlevering"],
    },
    monitorDemo: {
      label: "LIVE DASHBORD",
      kpis: ["Kjøringer", "Unntak", "Timer spart"],
      healthy: "Alle kjøringer friske",
      alert: "Feil oppdaget — menneske varslet",
      resolved: "Løst — tilbake til normalt",
      monitoring: "Overvåker kjøringer…",
      watching: "Overvåkingen fortsetter",
      chips: ["Antall kjøringer", "Feilrate", "Spart tid"],
    },
    improveDemo: {
      label: "MÅL PÅ NYTT",
      baseline: { label: "Opprinnelig estimat", value: "20 t/uke" },
      measured: { label: "Målt etter 90 dager", value: "27 t/uke" },
      delta: "+35 % mot estimat",
      measuring: "Måler på nytt…",
      done: "Matet tilbake inn i neste syklus",
      next: { tag: "NY KANDIDAT", title: "Utgiftsgodkjenning", sub: "Tilbake til Identifiser" },
      chips: ["Mål på nytt", "Sammenlign med basislinje", "Mat tilbake"],
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
      .sv-cbar.fail{ background:#DC2626; opacity:1; }
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
// Text lives in CONTENT[lang].identifyDemo. Timing: one tick = IDV_TICK_MS;
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
// CONTENT[lang].<stage>Demo so it follows the language switch.
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
const DEVELOP_ICONS = [Plug, Terminal, Bot];

function DevelopAnimation({ t }) {
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
          const Icon = DEVELOP_ICONS[i];
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
  const kpis = [String(shown * 24), failVisible ? "1" : "0", `${(shown * 1.7).toFixed(1)}h`];

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
          const failing = i === MONITOR_FAIL && !resolved;
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
// Main app
// =====================================================================================
function HomeSection() {
  const [lang, setLang] = useLanguage();
  const [t] = useSiteContent(lang);
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
                    {/* Add more entries to CONTENT[lang].stages.<id>.blocks to extend this stage */}
                    {stage.blocks.map((b, bi) => (
                      <Block key={bi} heading={b.heading} body={b.body} />
                    ))}
                  </div>
                  {Visual && (
                    <div className="rpa-stage-visual"><Visual t={t} /></div>
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
  // JSON round-trip on purpose, not structuredClone: structuredClone throws if
  // CONTENT ever contains a function, whereas JSON.stringify silently drops
  // function-valued keys (and useSiteContent's deepMerge restores them from
  // CONTENT[lang] when the edited content is read back).
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

  const [lang, setLang] = useState(LANGUAGES[0].code);
  const [draft, setDraft] = useState(() => getEditableContent(lang));
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

  async function handleSave() {
    setStatus({ type: "pending", message: "Saving…" });
    const res = await saveSiteContent(lang, draft);
    setStatus(
      res.ok
        ? { type: "ok", message: res.target === "firebase" ? "Saved to Firebase — live for every visitor." : "Saved in this browser (Firebase not connected — see README.md)." }
        : { type: "error", message: "Firebase save failed (see console). Your changes are still saved locally." }
    );
  }

  function handleReset() {
    if (!window.confirm("Discard saved overrides and revert this language to the code defaults?")) return;
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
