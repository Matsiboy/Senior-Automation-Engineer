# Mats Østvig — Senior Automation Engineer

A one-page eight-stage site (Identify → Improve) that tells its story two ways —
**RPA** or **Agentic AI**, switched with the toggle in the nav — with About/Contact
subpages and an `/admin` panel that edits every section of every page, with all
content optionally synced live through Firebase.

## File structure

```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml        # builds + deploys to GitHub Pages on every push to main
├── public/                   # static assets — put real stage images/drawings here
├── src/
│   ├── main.jsx               # entry point — just mounts <App/> in a HashRouter.
│   │                          #   One-time scaffolding; you shouldn't need to touch this again.
│   └── App.jsx                 # THE WHOLE SITE: config, all 4 routes (Home/About/Contact/Admin),
│                               #   every section, both stories (RPA + Agentic AI). This is the only file you
│                               #   need to edit or re-upload for content/section changes.
├── index.html                 # Vite root HTML — one-time scaffolding
├── package.json               # one-time scaffolding
├── vite.config.js             # one-time scaffolding — sets the base path for GitHub Pages
├── .gitignore
└── README.md
```

Everything — the journey, About, Contact, and the `/admin` editor — lives in
`App.jsx` now, the same way your previous project kept everything in one file.
`main.jsx` just mounts it; you should only ever need to open that once, during
initial setup.

## 1. Local setup

```
npm install
npm run dev
```
Opens the site at `http://localhost:5173`. Routes: `/` (home), `/about`, `/contact`, `/admin`.

## 2. Put it on GitHub Pages

1. Create a repo on GitHub and push these files to it.
2. Open `vite.config.js` and set `base`:
   - Project site (`https://USERNAME.github.io/REPO-NAME/`) → `base: "/REPO-NAME/"`
   - User/org site (repo literally named `USERNAME.github.io`) → `base: "/"`
3. In the repo: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
4. Push to `main` — the included workflow (`.github/workflows/deploy.yml`) builds the
   site with `npm run build` and deploys the `dist/` folder automatically. Check the
   **Actions** tab for progress; the Pages URL appears there once it succeeds.

**Why the URLs look like `/#/about`:** the router is `HashRouter`, which needs no
server configuration — GitHub Pages only serves static files and can't be told to
redirect deep links (`/about`) back to `index.html` the way clean URLs need. This is
also why nav clicks are handled with a manual scroll/`Link` (already wired up) instead
of relying on the browser's default anchor behavior.

<details>
<summary>Clean URLs instead of HashRouter (optional, more setup)</summary>

Switch `main.jsx` from `HashRouter` to `BrowserRouter`, then add a `public/404.html`
that's a copy of `index.html` — GitHub Pages serves `404.html` for any unknown path,
which lets the app boot and the router take over from there. You'll also want the
[spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect snippet in
that `404.html` so the original URL is preserved.
</details>

## 3. Firebase (makes News/Projects/all content editable live, from any device)

Without Firebase, the `/admin` panel still works — it saves to that browser's
`localStorage`, which is fine for solo editing on one machine but won't show up
for other visitors or sync across devices. Connecting Firebase makes every save
in `/admin` go live for everyone immediately.

### Set up the project
1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Inside the project: **Build → Firestore Database → Create database** (start in
   production mode).
3. **Project settings → General → Your apps → Add app → Web (`</>`)**. Copy the
   `firebaseConfig` object it gives you.
4. In `src/App.jsx`, paste that object into the exported `firebaseConfig` constant,
   and set:
   ```js
   export const FIREBASE_ENABLED = true;
   ```

### How content is stored
Everything editable in `/admin` lives in **one Firestore document per story**:
`siteContent/en` (the RPA story — it keeps its original id so anything you saved
earlier still loads) and `siteContent/ai` (the Agentic AI story). The old
`siteContent/no` (Norwegian) document is no longer used and can be deleted. You
don't need to create these manually —
the first time you click **Save changes** in `/admin` with Firebase connected, it
creates the document for you (`setDoc` creates-or-overwrites). The public site
subscribes to these documents live (`onSnapshot`), so an edit shows up for open
tabs without a page refresh.

There are no separate `news` / `projects` collections — those are just arrays
inside the same per-story document, edited from the News/Projects tabs in
`/admin`, same as every other section.

### Security rules
By default a fresh Firestore/Storage project either blocks everything, or (in
"test mode") allows anyone to read *and* write for 30 days before locking down
automatically. This project's `/admin` panel gates itself with a **passphrase**
only (`ADMIN_PASSPHRASE` in `App.jsx`'s AdminSection) — that's a convenience
speed bump, not real authentication. Firebase has no idea you "logged in"; it
never gets told, so `request.auth` is always `null` from Firebase's point of
view, and rules like `allow write: if request.auth != null` will reject every
save (and produce the confusing "CORS" error on Storage uploads specifically —
Firebase's default 403-on-denied-write response is missing CORS headers, which
browsers report as a blocked cross-origin request instead of a clean
permission error).

**This project runs with open write rules** — anyone with your Firebase config
(which is visible in the deployed JS bundle, unavoidably, for any client app)
could technically write to `siteContent` or upload files to `site-media`. That
tradeoff is reasonable for a low-stakes personal site where you're the only one
who knows the `/admin` URL and passphrase, but isn't appropriate if this ever
holds anything sensitive. If you want it properly locked down instead, add real
Firebase Auth (Firebase console → **Build → Authentication** → enable
Email/Password, add yourself as a user, and swap the passphrase check in
AdminSection for `signInWithEmailAndPassword`), then switch both rules below
back to `if request.auth != null`.

**Firestore** — console → **Firestore Database → Rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

Firebase Storage isn't used any more (the per-stage image uploads were removed),
so there's no Storage setup or Blaze plan needed.

If you'd rather skip Firebase entirely and only ever run `/admin` locally on
your own machine, leave `FIREBASE_ENABLED` off — edits save to that browser's
`localStorage` only, with no rules to manage at all.

### Quick test
1. `FIREBASE_ENABLED = true`, real `firebaseConfig`, rules pasted in.
2. Run locally (`npm run dev`), open `/admin`, change something (e.g. add a News item), **Save changes**.
3. Status bar should say "Saved to Firebase — live for every visitor."
4. Refresh `/` — the change should be there. Open Firestore console → you should see `siteContent/en` (RPA) or `siteContent/ai`.

## Add a section to any lifecycle stage, About, or Contact
Either edit `RPA_CONTENT` / `AI_CONTENT` directly in `App.jsx`, or (easier) use
`/admin` → pick the story in the top-right dropdown → the relevant tab →
**+ Add entry**. Both write to the same place. Note that the two stories start
out sharing the same About / Contact / footer text but are stored separately, so
edit those in each story (or tell me and I'll make them truly shared).

The text inside the stage animations (`identifyDemo`, `assessDemo`, …) lives in
`App.jsx` only and isn't editable from `/admin`.

## Logo
The "mats." logo (bracket, arrow and wordmark) is drawn as vector inside `App.jsx`
(`Logo` component), in your theme colors, so it stays sharp at any size and needs
no image file. `public/logo.svg` is the same logo as a standalone file (handy for
LinkedIn, email signatures, etc.) and `index.html` uses the bracket-and-arrow
symbol as the browser-tab icon.

To use a different image instead, put it in `public/` and set
`export const LOGO = { src: "your-logo.svg" };` in `App.jsx`.

## Colors
`THEME` in `App.jsx` — `primary: "#2563EB"`, `paper: "#FFFFFF"`. Everything else
derives from these.

## RPA / Agentic AI toggle
The segmented toggle in the nav switches the whole page between the two stories,
backed by `CONTENT.rpa` and `CONTENT.ai` (built from `RPA_CONTENT` and
`AI_CONTENT` in `App.jsx`). The choice is remembered per browser. The eight
stages keep the same ids in both, so the nav, scroll tracking and animations work
unchanged — only the text (and a few icons) differ. To add a third story, copy
`AI_CONTENT`'s shape and add an entry to the `MODES` array.
