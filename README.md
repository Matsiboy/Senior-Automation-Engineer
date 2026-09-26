# Mats Østvig — Senior Automation Engineer

A one-page RPA-lifecycle site (Identify → Improve) with About/Contact subpages,
an English/Norwegian switcher, and an `/admin` panel that edits every section
of every page — with all content optionally synced live through Firebase.

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
│                               #   every section, both languages. This is the only file you
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
Everything editable in `/admin` lives in **one Firestore document per language**:
`siteContent/en` and `siteContent/no`. You don't need to create these manually —
the first time you click **Save changes** in `/admin` with Firebase connected, it
creates the document for you (`setDoc` creates-or-overwrites). The public site
subscribes to these documents live (`onSnapshot`), so an edit shows up for open
tabs without a page refresh.

There are no separate `news` / `projects` collections — those are just arrays
inside the same per-language document, edited from the News/Projects tabs in
`/admin`, same as every other section.

### Lock down the security rules
By default a fresh Firestore project either blocks everything or (in "test mode")
allows anyone to read *and write*. You want public **read**, but **write** only
from your admin panel. In Firebase console → **Firestore Database → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /siteContent/{lang} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This requires a signed-in Firebase Auth user to write. The `/admin` panel in this
project currently gates itself with a **passphrase** (`ADMIN_PASSPHRASE` in
`App.jsx`'s AdminSection), which is a convenience speed bump, **not real security** — it
lives in the shipped JS bundle, so anyone technical can read it. With the rule
above, that stops mattering for your data (writes need real Firebase Auth either
way), but if you want `/admin` itself properly gated too:

1. Firebase console → **Build → Authentication → Sign-in method** → enable
   **Email/Password** (simplest) and add yourself as a user.
2. Add `firebase/auth` sign-in to AdminSection's gate in `App.jsx` (replace the passphrase
   check with `signInWithEmailAndPassword`), so the same login also satisfies
   `request.auth != null` in the rule above.

If you'd rather skip Firebase Auth entirely and only ever run `/admin` locally on
your own machine (never deploy that route), you can leave `FIREBASE_ENABLED` off,
edit via `localStorage` locally, and periodically copy the resulting JSON
(`localStorage["site-content-override-en"]` in devtools) into `CONTENT.en` in
`App.jsx` directly as your "real" save — no Firestore rules to manage at all.

### Quick test
1. `FIREBASE_ENABLED = true`, real `firebaseConfig`, rules pasted in.
2. Run locally (`npm run dev`), open `/admin`, change something (e.g. add a News item), **Save changes**.
3. Status bar should say "Saved to Firebase — live for every visitor."
4. Refresh `/` — the change should be there. Open Firestore console → you should see `siteContent/en`.

## Add a section to any lifecycle stage, About, or Contact
Either edit `CONTENT.en` / `CONTENT.no` directly in `App.jsx`, or (easier) use
`/admin` → the relevant tab → **+ Add entry**. Both write to the same place.

## Swap images/drawings
`ASSETS` in `App.jsx` — set e.g. `identify: "/my-image.png"` (drop the file in
`public/`) to replace that stage's generated placeholder graphic.

## Colors
`THEME` in `App.jsx` — `primary: "#3B60C5"`, `paper: "#FDF2DE"`. Everything else
derives from these two.

## Language (English / Norwegian)
Flag buttons in the nav, backed by `CONTENT.en` / `CONTENT.no` in `App.jsx`. To
add a third language: copy the `en` shape under a new key, translate it, and add
it to the `LANGUAGES` array.
