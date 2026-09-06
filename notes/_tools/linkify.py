#!/usr/bin/env python3
"""
Auto cross-linker for study notes.

Reads a Markdown file and:
  1. Collects "glossary" terms from every table whose first header cell is "Term"
     (our Key-terms tables) and from explicit  [[anchor:Label]]  markers.
  2. Injects an anchor at each definition point.
  3. Turns distinctive mentions of those terms elsewhere in the prose into
     clickable links to the anchor.

Only *distinctive* terms are auto-linked (multi-word / hyphenated terms, plus a
small jargon whitelist) so common words like "politics" or "power" don't turn
into a sea of links. Headings, code, existing links and the glossary rows
themselves are never touched.

Usage: linkify.py in.md out.md
"""
import re, sys

JARGON = {
    "polis", "kallipolis", "phronesis", "sophia", "elenchus", "telos",
    "teleology", "endoxa", "politeia", "bourgeoisie", "proletariat",
    "externality", "externalities", "patriarchy", "oikos", "eudaimonia",
}
# never auto-link these even if they are glossary terms (too common)
STOP = {
    "politics", "power", "equality", "security", "solidarity", "democracy",
    "prosperity", "justice", "theory", "constitution", "form", "forms",
    "norm", "norms", "institution", "institutions", "scarcity", "model",
    "models", "utility", "preferences", "beliefs", "structures", "interests",
}

def slugify(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return "gl-" + s

def clean_term(cell):
    c = cell.strip()
    c = re.sub(r"</?a[^>]*>", "", c)          # strip any existing anchors
    c = c.strip("*`").strip()                 # strip bold/italic/code marks
    c = re.sub(r"\*\*|\*|`", "", c)
    return c.strip()

def linkable(term):
    t = term.lower()
    if t in STOP:
        return False
    return (" " in term) or ("-" in term) or (t in JARGON)

def protected_spans(line):
    spans = []
    for pat in (r"\[[^\]]*\]\([^)]*\)", r"`[^`]*`", r"<[^>]+>"):
        for m in re.finditer(pat, line):
            spans.append((m.start(), m.end()))
    return spans

def main():
    src, dst = sys.argv[1], sys.argv[2]
    lines = open(src, encoding="utf-8").read().split("\n")

    term_slug = {}            # lower term -> slug (first definition wins)
    out = []
    in_code = False
    glossary_rows = set()     # indices of lines that are Key-terms rows

    # ---- pass 1: find glossary tables + explicit anchors, inject anchors ----
    i = 0
    in_gloss = False
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```"):
            in_code = not in_code
            out.append(line); i += 1; continue
        if in_code:
            out.append(line); i += 1; continue

        # explicit  [[anchor:Label]]  marker anywhere
        def repl_anchor(m):
            label = m.group(1).strip()
            slug = slugify(label)
            term_slug.setdefault(label.lower(), slug)
            return f'<a id="{slug}"></a>{label}'
        line = re.sub(r"\[\[anchor:([^\]]+)\]\]", repl_anchor, line)

        # detect glossary table header:  | Term | Meaning |
        cells = [c.strip() for c in line.strip().strip("|").split("|")] if line.strip().startswith("|") else None
        if cells and cells[0].lower() == "term":
            in_gloss = True
            glossary_rows.add(i)
            out.append(line); i += 1; continue
        if in_gloss:
            if not line.strip().startswith("|"):
                in_gloss = False
            else:
                glossary_rows.add(i)
                if set(cells[0]) <= set("-: "):   # separator row |---|
                    out.append(line); i += 1; continue
                term = clean_term(cells[0])
                if term:
                    slug = slugify(term)
                    if term.lower() not in term_slug:
                        term_slug[term.lower()] = slug
                    # inject anchor into the first cell
                    first = line.find("|")
                    second = line.find("|", first + 1)
                    cell_text = line[first+1:second]
                    line = line[:first+1] + f' <a id="{slug}"></a>' + cell_text.strip() + " " + line[second:]
                out.append(line); i += 1; continue
        out.append(line); i += 1

    lines = out

    # ---- build link regex from linkable terms, longest first ----
    targets = sorted([t for t in term_slug if linkable(t)], key=len, reverse=True)
    if not targets:
        open(dst, "w", encoding="utf-8").write("\n".join(lines)); return
    alt = "|".join(re.escape(t) for t in targets)
    term_re = re.compile(r"(?<![\w-])(" + alt + r")(?![\w-])", re.IGNORECASE)

    # ---- pass 2: link mentions in body prose ----
    final = []
    in_code = False
    for idx, line in enumerate(lines):
        if line.strip().startswith("```"):
            in_code = not in_code; final.append(line); continue
        if (in_code or idx in glossary_rows or line.lstrip().startswith("#")
                or line.lstrip().startswith("<") or not line.strip()):
            final.append(line); continue

        spans = protected_spans(line)
        def repl(m):
            s = m.start()
            for a, b in spans:
                if a <= s < b:
                    return m.group(0)
            slug = term_slug[m.group(1).lower()]
            return f"[{m.group(1)}](#{slug})"
        final.append(term_re.sub(repl, line))

    open(dst, "w", encoding="utf-8").write("\n".join(final))

if __name__ == "__main__":
    main()
