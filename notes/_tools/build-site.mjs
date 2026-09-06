#!/usr/bin/env node
// Build the study-notes website into ../../docs (served by GitHub Pages).
//
// What it does:
//   1. Scans notes/<subject>/ for a master "*-Notes.md" (the full doc).
//   2. Splits each master into per-lecture / per-week .md files at every top-level
//      "# " heading (except the master title) and renders each to its own PDF using
//      the existing md2pdf.sh pipeline (linkify -> pandoc -> headless Chrome).
//   3. Copies the master PDF + all per-part PDFs into docs/pdfs/<subject>/.
//   4. Writes docs/manifest.json describing every subject, its full doc and parts.
//
// The static site (docs/index.html + docs/assets/*) reads manifest.json at runtime.
//
// Usage:
//   node notes/_tools/build-site.mjs            # build everything (regenerates part PDFs)
//   node notes/_tools/build-site.mjs --no-pdf   # only rebuild manifest + copy existing PDFs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = __dirname;                          // notes/_tools
const NOTES = path.resolve(TOOLS, '..');          // notes
const ROOT = path.resolve(NOTES, '..');           // repo root
const DOCS = path.join(ROOT, 'docs');
const PDF_OUT = path.join(DOCS, 'pdfs');

const NO_PDF = process.argv.includes('--no-pdf');

// Nice display names when we can't derive one from the master title.
const NAME_OVERRIDES = {
  'applied-micro': 'Applied Microeconomics',
};

const log = (...a) => console.log(...a);
const kb = (p) => Math.round(fs.statSync(p).size / 1024);

function slugify(s) {
  const m = s.match(/^\s*(Lecture|Week|Chapter|Part)\s+(\d+)/i);
  if (m) return `${m[1].toLowerCase()}-${m[2]}`;
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'part';
}

// Split a master .md into { title, parts:[{title, body}] }. The first "# " heading
// is the document title; every subsequent "# " heading starts a new part.
function splitMaster(md) {
  const lines = md.split('\n');
  let docTitle = null;
  const parts = [];
  let cur = null;
  for (const line of lines) {
    const h1 = line.match(/^# (?!#)(.*)/);
    if (h1) {
      if (docTitle === null) { docTitle = h1[1].trim(); continue; }
      cur = { title: h1[1].trim(), lines: [line] };
      parts.push(cur);
      continue;
    }
    if (cur) cur.lines.push(line);
    // lines before the first part (byline, Overview map) are dropped from part PDFs
  }
  return {
    title: (docTitle || '').replace(/\s*—\s*Master Notes\s*$/i, '').trim(),
    parts: parts.map((p) => ({ title: p.title, body: p.lines.join('\n').trim() })),
  };
}

function renderPdf(mdPath) {
  execFileSync('bash', [path.join(TOOLS, 'md2pdf.sh'), mdPath], { stdio: 'pipe' });
  return mdPath.replace(/\.md$/, '.pdf');
}

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function rel(p) { return path.relative(DOCS, p).split(path.sep).join('/'); }

// ---- discover subjects -------------------------------------------------------
const subjects = fs.readdirSync(NOTES, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
  .map((d) => d.name)
  .sort();

ensureDir(PDF_OUT);
const manifest = { generatedAt: new Date().toISOString(), subjects: [] };

for (const slug of subjects) {
  const dir = path.join(NOTES, slug);
  const files = fs.readdirSync(dir);
  const masterMd = files.find((f) => /-Notes\.md$/.test(f));
  const outDir = path.join(PDF_OUT, slug);
  ensureDir(outDir);

  let name = NAME_OVERRIDES[slug];
  const subj = { slug, name: name || null, full: null, parts: [] };

  if (masterMd) {
    const masterPath = path.join(dir, masterMd);
    const { title, parts } = splitMaster(fs.readFileSync(masterPath, 'utf8'));
    subj.name = subj.name || title || slug;

    // full doc: reuse the already-built master PDF if present, else build it.
    let masterPdf = masterPath.replace(/\.md$/, '.pdf');
    if (!fs.existsSync(masterPdf) && !NO_PDF) masterPdf = renderPdf(masterPath);
    if (fs.existsSync(masterPdf)) {
      const dest = path.join(outDir, path.basename(masterPdf));
      fs.copyFileSync(masterPdf, dest);
      subj.full = { title: `${subj.name} — Full notes`, pdf: rel(dest), sizeKB: kb(dest) };
    }

    // per-part PDFs
    for (const part of parts) {
      const pslug = slugify(part.title);
      const destPdf = path.join(outDir, `${pslug}.pdf`);
      if (!NO_PDF) {
        // write a temp .md in the SUBJECT ROOT so relative figures/ paths resolve
        const tmpMd = path.join(dir, `_part-${pslug}.md`);
        const header = `<p class="byline">${subj.name} — Master Notes · by Jakob V. Stangel</p>\n\n`;
        fs.writeFileSync(tmpMd, part.body.replace(/\n/, `\n${header}`));
        try {
          const builtPdf = renderPdf(tmpMd);
          fs.copyFileSync(builtPdf, destPdf);
          fs.rmSync(builtPdf, { force: true });
        } finally {
          fs.rmSync(tmpMd, { force: true });
        }
      }
      if (fs.existsSync(destPdf)) {
        subj.parts.push({ slug: pslug, title: part.title, pdf: rel(destPdf), sizeKB: kb(destPdf) });
        log(`  ✓ ${slug}/${pslug}`);
      }
    }
  } else {
    // No master doc yet — treat each standalone chapter .md as a part.
    const chapterMds = files.filter((f) => f.endsWith('.md')).sort();
    subj.name = subj.name || slug;
    for (const f of chapterMds) {
      const mdPath = path.join(dir, f);
      const pslug = slugify(fs.readFileSync(mdPath, 'utf8').match(/^# (.*)/m)?.[1] || f);
      let pdf = mdPath.replace(/\.md$/, '.pdf');
      if (!fs.existsSync(pdf) && !NO_PDF) pdf = renderPdf(mdPath);
      if (fs.existsSync(pdf)) {
        const dest = path.join(outDir, `${pslug}.pdf`);
        fs.copyFileSync(pdf, dest);
        const title = fs.readFileSync(mdPath, 'utf8').match(/^# (.*)/m)?.[1] || f;
        subj.parts.push({ slug: pslug, title, pdf: rel(dest), sizeKB: kb(dest) });
        log(`  ✓ ${slug}/${pslug}`);
      }
    }
    subj.note = 'In progress';
  }

  manifest.subjects.push(subj);
  log(`✓ ${subj.name}: ${subj.parts.length} part(s)${subj.full ? ' + full doc' : ''}`);
}

ensureDir(DOCS);
fs.writeFileSync(path.join(DOCS, 'manifest.json'), JSON.stringify(manifest, null, 2));
log(`\nWrote ${path.relative(ROOT, path.join(DOCS, 'manifest.json'))} (${manifest.subjects.length} subjects)`);
