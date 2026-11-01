# Mats Østvig — Senior Automation Engineer

A one-page site (React + Vite, deployed to GitHub Pages) built from the MagicPath "Mats Homepage"
design: hero, selected work, "How I work" (an eight-stage method told two ways — RPA or Agentic AI),
"The person behind the process", and a contact call-to-action. There is also a built-in editor at `/admin`.

The whole site lives in **one file, `src/App.jsx`**. To change the site's code, upload just that file.
(`src/main.jsx`, `index.html`, `vite.config.js`, `package.json` are one-time scaffolding.)

## Editing the content (`/admin`)

Open `https://<your-site>/#/admin`, enter the passphrase, and pick a section:

| Section | What you can edit |
|---|---|
| **Hero** | the line above the headline, the label above the RPA / Agentic AI switch, the two-line headline, paragraph and note (each has an **RPA** and an **Agentic AI** version; pick which to edit), the button texts, and the "How it starts" moment |
| **Selected work** | the *Examples* heading and intro, and the example cards (see below) |
| **How I work** | the heading, intro and loop note; for **both** versions: the principle, the four **scroll-story** parts (heading, text, side note, label, caption) and the eight stages of the full method (headline, text, three checkpoints) |
| **About me** | the section heading, paragraphs, quote and captions, plus the **About window**: card cue, heading, **portrait** (upload or web address, with crop and description), name, role, introduction, skill tags, text blocks and quote |
| **Contact & footer** | **where the contact button leads** (an email address or an https:// link), the call-to-action band, the contact dialog's text and questions, the footer line |

The homepage has one RPA / Agentic AI mode: the two switches (above the hero and in How I work), the logo, the hero text,
the eight-stage animation and the method all follow it, and the choice is remembered in the visitor's browser.

A live preview shows the real homepage with your draft (desktop or mobile width), scrolled to the section
you are editing. Each section has **Reset to original**.

**Example cards:** each card has a **Content** tab (title, category, description, case-study sections,
link, show/hide, order) and an **Appearance** tab (one of four templates — workflow diagram, AI answer panel,
dashboard, uploaded image — two colours, the illustration's wording, and an image crop). Fonts, spacing and
responsive behaviour are fixed by the design, so no setting can break the layout.

**Not editable on purpose:** layout, typography, the colour palette, the lifecycle animation and the scroll story's illustrations,
and the "illustrative example" disclosures. Example projects are labelled *illustrative* by default — turn that off
per card only for real, verified work. Nothing on the site is invented: until you add a contact link, the
contact dialog says contact details haven't been added.

### How changes are kept

| | Where | Who sees it |
|---|---|---|
| **Draft** | this browser's localStorage, saved automatically | only you, in this browser |
| **Published** | Firestore document `siteContent/work` (text + cards) and one `siteContent/workimg-<id>` document per uploaded picture | every visitor; pages that are open update live |

Press **Publish** to make the draft live; **Discard changes** goes back to what is published. Visitors never see
your draft. A copy of the last published content is cached in visitors' browsers so repeat visits are instant.
Until something is published, visitors see the built-in content.

Uploaded pictures are shrunk to JPEG (≤ ~450 KB) and stored in Firestore, because Firebase Storage needs a paid
plan. For many or large pictures, put files in `public/` and enter their path (e.g. `images/project.jpg`).

## Design

Page background `#FDF7EB`, brand blue `#3B60C5`, main text `#253550`; headings in Source Serif 4, body in Source Sans 3. The
exact colour table and checks are in the release's `COLOR-SPEC.md`. The admin uses the same palette and fonts.

## Securing publishing (important)

Publishing writes to Firestore from the browser, so **your Firestore rules decide who can publish** — the admin
passphrase only hides the page. With open rules, anyone who finds your Firebase settings could overwrite the
site. Lock it to yourself:

1. Firebase console → Authentication → turn on **Email/Password**, then **Users → Add user** (your email).
2. Firestore Database → **Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'YOUR-EMAIL@example.com';
    }
  }
}
```

3. In the admin, use **Sign in to publish**. Also change `ADMIN_PASSPHRASE` in `App.jsx` (it is `changeme`).

The admin shows these steps too (under "How to lock publishing to your account").

## Setup

- **Firebase:** create a project with Firestore, add a Web app, and paste its config into `firebaseConfig` near the
  top of `src/App.jsx`. Set `FIREBASE_ENABLED = false` to run without Firebase (the site then always shows the
  built-in content and the admin cannot publish).
- **GitHub Pages:** `.github/workflows/deploy.yml` builds and deploys on every push to `main`
  (Settings → Pages → Source: GitHub Actions). `vite.config.js` has `base: "/<repo-name>/"`; the site uses a
  HashRouter, so no server configuration is needed.
- **Local:** `npm install`, then `npm run dev` (or `npm run build`).

## Routes

`/` (the homepage) and `/admin`. Any other address (including the old `/about` and `/contact`) goes to the homepage.
