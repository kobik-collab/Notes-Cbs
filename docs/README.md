# Study Notes website (`docs/`)

A static site that lets you browse, **preview**, and **download** the study notes by subject and
by individual lecture. It's served by GitHub Pages straight out of this `docs/` folder.

```
docs/
├── index.html          ← the app shell
├── assets/
│   ├── style.css        ← clean academic styling (matches the PDF stylesheet)
│   └── app.js           ← hash-routed SPA that reads manifest.json
├── manifest.json       ← GENERATED — list of subjects, full docs, per-lecture PDFs
├── pdfs/<subject>/…    ← GENERATED — the master PDF + one PDF per lecture/week
└── .nojekyll           ← tells GitHub Pages to serve files as-is
```

## Rebuilding after you add / edit notes

The site is generated from `notes/`. After you add a new lecture or week to a master
`*-Notes.md` (see `notes/NOTES-GUIDE.md`), rebuild:

```bash
node notes/_tools/build-site.mjs          # splits masters → per-lecture PDFs, refreshes manifest
node notes/_tools/build-site.mjs --no-pdf # faster: only refresh manifest + copy existing PDFs
```

The builder:
1. finds each subject's master `*-Notes.md`,
2. splits it at every top-level `# Lecture N` / `# Week NN` heading into its own PDF,
3. copies the master PDF + all per-part PDFs into `docs/pdfs/<subject>/`,
4. writes `docs/manifest.json`.

## Preview locally

```bash
python3 -m http.server 8000 --directory docs
# open http://localhost:8000
```

## Deploy (GitHub Pages)

1. Push this repo to GitHub (a repo named `notes` under the `200hq` org serves at `200hq.com/notes`).
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, Folder: `/docs`.
3. The custom domain (`200hq.com`) is configured on the **org/user Pages site**, not here; this
   project repo then serves automatically under `/notes`. All links in the site are relative, so no
   base-path changes are needed.
