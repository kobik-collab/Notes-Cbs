# Study Notes — Process & Style Guide

This document defines **how we make the study-notes documents** for this degree: the folder
layout, the per-reading template, the writing principles, and the tooling that turns Markdown
into nicely formatted, cross-linked PDFs. Treat it as the "skill" — follow it for every subject
and every new reading so the notes stay consistent.

---

## 1. Goal

Turn large volumes of assigned reading into **compact, precise, exam-ready notes** that:
- follow the source's **own chapter / section / page structure** (so you never get lost),
- give a short **résumé** of each chapter and the **models/concepts** to use,
- weight coverage by **how much the reading emphasizes each part** (see §4),
- are saved as **both `.md` and `.pdf`**, and
- are **internally hyperlinked** so clicking a buzzword jumps to where it's explained.

Detail level: **medium** (main points + brief explanation), in **English**.

---

## 2. Folder structure

```
notes/
├── _tools/                     ← build tooling (don't put notes here)
│   ├── md2pdf.sh               ← Markdown → styled PDF
│   ├── linkify.py              ← auto cross-linker
│   └── style.css               ← PDF stylesheet
├── NOTES-GUIDE.md              ← this file
├── applied-micro/
│   ├── Micro.pdf               ← the textbook(s) at the subject root
│   └── Applied-Micro-Notes.md/.pdf
├── political-science/          ← segmented by MODULE
│   ├── <textbooks>.pdf
│   ├── Module 1/               ← module-specific readings (PDFs)
│   └── Political-Science-Notes.md/.pdf
└── political-economic-thought/ ← segmented by WEEK
    ├── <textbooks>.pdf
    ├── Week 36/                ← week-specific readings (PDFs)
    └── Political-Economic-Thought-Notes.md/.pdf
```

**How each course is segmented (use the course's OWN names; name folders to match):**
- **Political Science → by Part → Lecture.** The course groups lectures under **Parts**
  (e.g. *Part I · Political Systems & Institutions*) and names each **Lecture** with its title and
  the lecturer's initials — e.g. **`Lecture 2: The State (AUW)`**. Readings folders = `Lecture 1`,
  `Lecture 2`, …
- **Political & Economic Thought → by Week** (`Week 36`, `Week 37`, …).
- Applied Micro → by textbook chapter (folders only if extra readings appear).

Use the exact lecture/week **title and initials** the syllabus uses. Confirm segmentation (and Part
boundaries) with the syllabus before creating folders.

---

## 3. One master document per subject

Each subject has **one running `.md`** (+ its generated `.pdf`), e.g. `Political-Science-Notes.md`.
New modules/weeks are **appended in order**. Structure:

```
# <Subject> — Master Notes
<p class="byline">by Jakob V. Stangel</p>          ← author byline under every master-doc title
## Overview — where everything is   ← clickable MAP: Part → Lecture/Week → readings + cases + fun facts
<div class="part" id="part-N">Part I · …</div>   ← blue banner before the Part's first lecture (PS)
# Lecture N: Title (INITIALS)  /  # Week NN   ← one H1 per lecture/week (+ anchor <a id="lecture-N">)
   **Required reading** + short "theme" intro
## <Reading 1>                  ← one H2 per reading (see template §5)
## <Reading 2>
## ★ Fun facts & memorable details   ← one per lecture/week (see §6)
---
```

**Every document starts with a clickable `## Overview` map** — nested Part → Lecture/Week →
readings, each entry a link (to the lecture, each reading, key cases, the fun-facts box). This is
the "where is everything" index; keep it updated as lectures/weeks are added.

---

## 4. Writing principles

1. **Proportional emphasis (important).** Mirror the source's weighting. If the reading spends
   many pages on one idea (e.g. the *three dimensions of power* and the theory families in OD
   ch. 1), the notes go **deeper** there — more sub-points, the nuances, how it recurs. Skim what
   the text skims. Do **not** give every subsection equal length just because it exists.
2. **Keep the source's structure.** Use the book's real numbering/headings (1.1, 2.2.1, "The
   structure of the kallipolis"). Never invent an order.
3. **Precision on references.** Always record book title, chapter, and **page range**.
4. **Separate description from evaluation.** Flag empirical vs normative, and note the author's
   own critiques of a theory.
5. **Name the "modes."** Explicitly list the models/theories/tools the student is expected to
   *apply* — these are what exams test.
6. **Medium detail, plain English.** Compact bullets over long prose.
7a. **Decompose concepts into their named sub-parts.** If a term splits into categories/types
   (the *three faces of power*; the *four implications* of "politics"; the *three research methods*),
   **list them** — a key concept stated without its components lacks depth.
7b. **The lecture deck is the CENTRE of the notes — build around it, don't decorate with it.**
   When a deck exists, **read it first** and let *its* outline, emphasis, examples and "take-away"
   slides **define the section structure and the spine/red-thread**. Foreground exactly what the
   deck foregrounds (it's what the lecturer stresses and the exam follows). Then use the **readings
   to fill in the depth *around* each deck point** (definitions, evidence, nuance); reading-only
   material goes in as clearly *secondary*. Mark deck-sourced points (*"(from the lecture — INITIALS)"*).
   - **Deck-first ordering matters:** if the reading is built *before* the deck arrives, treat the
     deck as a **re-centre** job (reorder/foreground around it), not just an append — e.g. Pitkin's
     concept of representation should *lead* the Representation lecture, not be tacked on.
   - **Extracting deck TEXT:** `.pptx` = zip → parse `ppt/slides/*.xml` (`<a:t>` runs). Old **`.ppt`** =
     OLE binary: `python3 -m pip install olefile`, open the **`PowerPoint Document`** stream and scan
     for **TextCharsAtom (recType 0x0FA0, UTF-16LE)** and **TextBytesAtom (0x0FA8, latin1)** records —
     far cleaner than raw string-scanning. (Ask for `.pptx` if the `.ppt` is still messy.)
   - **Extracting & AUTO-USING deck VISUALS (do this every deck):** `.pptx` → images live in
     `ppt/media/*`. Old **`.ppt`** → carve the **`Pictures`** OLE stream: find PNG (`\x89PNG…IEND`) and
     JPEG (`\xff\xd8\xff…\xff\xd9`) blobs and write each out (drop blobs <4 KB = icons). **View every
     candidate** and **embed the analytically *relevant* ones automatically** — typology matrices,
     two-axis maps, charts/tables (e.g. Iversen–Soskice), iconic illustrations (the Gerry-mander).
     **Skip pure decoration** (stock photos, clip-art crowds, flags, personal screenshots). Save to
     `notes/<subject>/figures/l<N>-<slug>.png`, embed via §8 (Figures) with a **"How to read it"**
     caption, and constrain tall images with an inline `style="max-width:…"`.
7c. **Expand the most-emphasised section theory-by-theory.** For the section the reading/lecture
   dwells on most (e.g. OD ch.1's *What explains behaviour?*), don't cram all theories into one
   table — give each **family its own table** with every theory's **core idea + critique** (and,
   where relevant, which face of power it sees), so the theories are visually distinguishable.
7. **Back every "analytical move" with a concrete example.** Whenever the notes claim a move is
   valuable ("it's gold to be able to say *this theory only captures the first dimension*"),
   immediately give a **worked example from the book** that performs it, and end with the reusable
   template ("name the theory → name what it can't see → name the rival that reaches further").
   An abstract tip the student can't apply is nearly useless. **This also covers multi-step
   "chains"/arguments:** if a pointer says "be able to *run the chain* A → B → C → D," there must be
   a place that actually runs it once end-to-end on a concrete example, plus the reusable template.

---

## 5. Per-reading template (sections, in order)

Each reading (an `## H2`) contains:

1. **Header line** — `**Book:** Author, *Title* (ed., year), ch. X, pp. a–b.`
2. **Chapter/Reading résumé** — one paragraph: what it covers + why it matters.
2a. **★ Heart of the chapter + red thread** — *required.* Immediately after the résumé: (i) a
   highlighted `<div class="heart">★ <strong>The heart of the chapter:</strong> …</div>` naming the
   **single most important idea** (the *spine*), then (ii) a short **red-thread** line — 1–2
   questions the *whole* chapter answers, so every section is visibly a variation on them.
   **Source the spine from the lecture deck** when one exists: the **"Take-Aways" / agenda slides
   state the spine directly** (e.g. AUW's four questions) — use them.
3. **Key concepts / "modes" to use** — the named tools/theories to apply.
4. **Section-by-section main points** — following the source's own headings; apply
   **proportional emphasis** here. **Embed the chapter's key diagrams / visual models** at the
   relevant point (demand–supply curves, cost curves, game trees, flow models, typology matrices) —
   see §8 → *Figures*. Never skip a diagram the book builds an argument on.
   **Make it scannable, never a blob.** Use **real `####` sub-headings on their own line** for each
   subsection (they render with space before/after + an accent bar — see `style.css`), *not* bold
   run-in labels that blend into the paragraph. Prefer the **lecture's own questions** as the
   sub-heading text (e.g. *"What is a state?"*, *"Where did states come from?"*) so the headings
   double as the spine. Under each `####`, lead with a `*Core:*` one-line takeaway, then structured
   detail (short bullets / small tables). The reader should get the whole section from the
   sub-headings + *Core* lines alone. Turn any "3 types / 4 demands / 2 pathways" into a small table.
   *(Anchors for exam-pointer links go on their own line immediately **before** the `####`.)*
5. **Cases & examples** — the concrete cases, countries, experiments, or worked examples the
   reading uses to illustrate its concepts. *Include whenever the reading leans on cases*
   (essential for comparative politics; light or skipped for a purely theoretical piece).
   **Give each case semi-depth, not just a name.** Use a bulleted list (not a cramped table):
   for each case write 2–3 sentences on *what actually happened*, then `→ Illustrates:` the
   analytical takeaway. A reader who doesn't already know the case must be able to understand it
   from the note alone — naming "Tunisia vs Syria" without saying what happened is useless.
   **Anchor every case and make references clickable:** give each case an `<a id="case-…"></a>`
   anchor, and whenever the case is mentioned elsewhere (theory table, worked example,
   section-by-section point), link that mention with `[text](#case-…)` so the reader can click
   through to the full summary.
   **Always circle the cases back to the chapter's theme.** A list of cases with no tie to the
   argument is confusing. So: (a) open the section with a *why these cases are here* framing that
   names the concepts they illustrate + a "read each case for X, Y, Z" lens; (b) end each write-up
   with a `→` line stating the concept it demonstrates; and (c) for a big case set (e.g. OD's 11
   countries), add a **summary table mapping each case → the concept** so the connection is
   scannable at a glance.
6. **Key terms** — a `| Term | Meaning |` glossary table. **These rows auto-become clickable
   anchors** (see §7), so put every term worth cross-linking here.
7. **Exam pointers** — what the student must be able to *do*. **Every pointer must be *answerable
   from the notes*:** link each one to the **anchored passage** where its answer is *fully
   developed* (e.g. `[constructivism vs primordialism](#c4-constructivism)`), and make sure that
   passage actually delivers the depth the pointer promises. A pointer that names a topic with no
   developed passage behind it is a bug — the reader goes looking and finds nothing.
8. **Bridge** *(optional)* — one short note linking this reading to others in the module/week.

---

## 6. Per module/week: Fun facts

End every module/week with:

```
<a id="ff-<slug>"></a>
## ★ Fun facts & memorable details
> The sticky examples, surprising stats and quotable lines from this module/week.
```

Group loosely (memorable examples / surprising stats / quotable lines / trivia). This is the
material that makes an exam answer *memorable* and doubles as light revision. Tag each item with
its source, e.g. *(OD)*, *(Ansell)*. Add its anchor to the Contents list.

---

## 7. Cross-linking (clickable buzzwords)

Handled automatically at build time by `linkify.py` — **keep the source `.md` clean**.

- Every **Key terms** row becomes an anchor; distinctive mentions elsewhere (multi-word terms +
  jargon like *kallipolis*, *phronesis*) auto-link to it. Common words (*politics*, *power*) are
  left alone to avoid clutter.
- To make an **example or arbitrary spot** linkable (e.g. *Cod Wars*, *the filibuster*), drop a
  marker at its definition point: `[[anchor:Cod Wars]]`. Every other mention then links to it.
- Cross-reference links render as a subtle **dotted underline**; headings/TOC links are blue.
- Manual links to headings use standard Markdown: `[see The kallipolis](#the-structure-of-the-kallipolis)`.

---

## 8. Build & output

**Markdown is the source of truth.** Never hand-edit the PDF.

Generate (produces `<name>.pdf`, cleans up intermediates, keeps `.md` + `.pdf`):

```bash
bash notes/_tools/md2pdf.sh "notes/<subject>/<Subject>-Notes.md"
```

Pipeline: `linkify.py` (inject anchors + cross-links) → `pandoc` (GFM → styled HTML with
`style.css`) → headless Chrome (`--print-to-pdf`). Every notes doc is saved as **`.md` AND `.pdf`**.

Stylesheet = clean academic look: serif body, sans-serif blue headings, blue-header zebra tables,
A4 print margins, page-break-avoids on headings/tables.

### Formulas / functions (esp. Applied Micro)
In math-heavy subjects, **every important function/formula stands on its own line, clearly marked** —
never buried in prose. Wrap it in a **formula block**:
```
<div class="formula"><span class="flabel">Optimum condition</span>choose the quantity where <strong>MB = MC</strong></div>
```
- `.formula` renders as a centred, accent-bordered box (see `style.css`); the optional
  `<span class="flabel">…</span>` is a small uppercase caption naming the formula.
- Write math in clean Unicode (superscripts, `·` `−` `×` `÷` `≤` `≥` `≈` `Δ` `π`, italic variables via
  `<em>`); the pipeline has no LaTeX/MathJax, so keep equations plain-text-renderable.
- Give the *definition* form and the *worked* form their own blocks when both help.

### Figures (visual models)
The notes must capture the book's **diagrams**, not just its prose. Workflow:
1. Find the figure's page in the source PDF; render it to check the crop:
   `python3 notes/_tools/figure.py <source.pdf> <page> /tmp/probe.png` (full page).
2. Crop just the diagram (fractions of the page `x0 y0 x1 y1`, leave a little margin so axis labels
   aren't clipped) into a per-subject folder:
   `python3 notes/_tools/figure.py <source.pdf> <page> notes/<subject>/figures/<name>.png X0 Y0 X1 Y1 --dpi 220`
3. Embed in the notes with a caption, then **always add a "How to read it" note** — axes, what each
   curve/arrow means, what *shifts vs. moves along*, and how to use it in a problem:
   ```
   ![Figure 2.3 — Demand: movement along the curve](figures/fig2-3-demand-movement.png)

   **How to read it**
   - Axes: price (y) vs quantity (x)…
   - …
   ```
- Images live in `notes/<subject>/figures/`; paths in the `.md` are **relative** (`figures/…`).
  `md2pdf.sh` passes `--resource-path` + `--embed-resources`, so figures are inlined into the PDF
  (self-contained) automatically. A figure without a "How to read it" caption is half-done.

---

## 9. Workflow for a new week/module

1. **Get the reading list** and confirm the module/week number + which PDFs map to it.
2. **Locate the PDFs**; check for a text layer (`pymupdf`/`pdftotext`). If scanned (0 chars),
   read the pages as images instead.
3. **Read the assigned pages fully**; note the source's own section structure and *where it
   dwells* (for proportional emphasis).
4. **Draft** each reading against the template (§5), weighting by emphasis.
5. **Add** the Cases & examples section and, at the end of the module/week, the Fun facts.
6. **Fill the Key terms** table and drop `[[anchor:…]]` markers on key examples.
7. **Build** the PDF; verify internal links resolve and eyeball a couple of rendered pages.
8. **Report** what was added; flag any readings still missing / ambiguous (e.g. "chapter 1" vs
   "Introduction").

---

## 10. Conventions summary

| Thing | Convention |
|---|---|
| Master doc name | `<Subject>-Notes.md` (one per subject) |
| PS folders | `Module 1`, `Module 2`, … |
| PET folders | `Week 36`, `Week 37`, … |
| Output | always `.md` **and** `.pdf` |
| Detail level | medium, English |
| Emphasis | proportional to the source |
| Example anchor | `[[anchor:Label]]` at the definition point |
| Fun facts | one section per module/week |
