#!/usr/bin/env python3
"""
Extract a figure/diagram from a source PDF as a PNG for embedding in notes.

Usage:
  figure.py <source.pdf> <page> <out.png> [x0 y0 x1 y1] [--dpi N]

  <page>          1-indexed PDF page number.
  [x0 y0 x1 y1]   optional crop box as FRACTIONS of the page (0..1),
                  e.g. 0 0.30 1 0.60 = middle band. Omit for the full page.
  --dpi N         render resolution (default 200).

Tip: to find the right page/crop, render the whole page first (no crop),
look at it, then re-run with a crop box.
"""
import sys, fitz

def main():
    a = sys.argv[1:]
    dpi = 200
    if "--dpi" in a:
        i = a.index("--dpi"); dpi = int(a[i+1]); del a[i:i+2]
    src, page, out = a[0], int(a[1]), a[2]
    doc = fitz.open(src)
    p = doc.load_page(page - 1)
    r = p.rect
    if len(a) >= 7:
        fx0, fy0, fx1, fy1 = map(float, a[3:7])
        clip = fitz.Rect(r.x0 + fx0*r.width, r.y0 + fy0*r.height,
                         r.x0 + fx1*r.width, r.y0 + fy1*r.height)
    else:
        clip = r
    pix = p.get_pixmap(dpi=dpi, clip=clip)
    pix.save(out)
    print(f"saved {out}  ({pix.width}x{pix.height}px, dpi={dpi})")

if __name__ == "__main__":
    main()
