#!/bin/bash
# Convert a Markdown file to a nicely-formatted PDF (and intermediate HTML).
# Usage: md2pdf.sh path/to/notes.md
set -euo pipefail

MD="$1"
[ -f "$MD" ] || { echo "No such file: $MD" >&2; exit 1; }

TOOLS_DIR="$(cd "$(dirname "$0")" && pwd)"
CSS="$TOOLS_DIR/style.css"
BASE="${MD%.md}"
HTML="$BASE.html"
PDF="$BASE.pdf"
TITLE="$(basename "$BASE")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 0) Auto cross-link buzzwords -> glossary anchors (keeps source MD clean)
LINKED="$(mktemp -t md2pdf.XXXXXX).md"
python3 "$TOOLS_DIR/linkify.py" "$MD" "$LINKED"

# 1) Markdown -> standalone HTML with embedded CSS
MD_DIR="$(cd "$(dirname "$MD")" && pwd)"
pandoc "$LINKED" \
  --from gfm \
  --to html5 \
  --standalone \
  --embed-resources \
  --resource-path="$MD_DIR" \
  --metadata title="$TITLE" \
  --css "$CSS" \
  --output "$HTML"

# 2) HTML -> PDF via headless Chrome (needs an ABSOLUTE file:// path)
HTML_ABS="$(cd "$(dirname "$HTML")" && pwd)/$(basename "$HTML")"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF" "file://$HTML_ABS" 2>/dev/null

# 3) Clean up intermediate files (keep only MD + PDF)
rm -f "$HTML" "$LINKED"

echo "PDF : $PDF"
