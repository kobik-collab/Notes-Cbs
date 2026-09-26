// Study Notes — tiny hash-routed single-page app over manifest.json.
// Routes:  #/                      -> subject grid
//          #/<subject>             -> subject reader (first doc previewed)
//          #/<subject>/<partSlug>  -> subject reader with that part previewed
//          #/<subject>/full        -> subject reader with the full doc previewed

const app = document.getElementById('app');
let DATA = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// Minimal inline markdown for card text: **bold**, *italic*, `code`.
function mdInline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
// Render a GitHub-style markdown table (block of |-delimited lines) to HTML.
function mdTable(block) {
  const rows = block.split('\n').filter((l) => l.trim());
  const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells); // rows[1] is the |---|---| separator
  const th = head.map((c) => `<th>${mdInline(c)}</th>`).join('');
  const tr = body.map((r) => `<tr>${r.map((c) => `<td>${mdInline(c)}</td>`).join('')}</tr>`).join('');
  return `<table class="fc-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}
// Block-level: blank lines -> blocks; a table block -> <table>, else <p> with <br>.
function mdBlock(s) {
  return String(s).split(/\n\n+/).map((p) => {
    const lines = p.split('\n');
    const isTable = lines.length >= 2 && lines[0].includes('|') && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[1]);
    return isTable ? mdTable(p) : `<p>${mdInline(p).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
const fmtSize = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
const fileIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
const dlIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';

async function boot() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-cache' });
    DATA = await res.json();
  } catch (e) {
    app.innerHTML = '<div class="loading">Could not load notes manifest.</div>';
    return;
  }
  window.addEventListener('hashchange', route);
  route();
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  return raw.split('/').filter(Boolean).map(decodeURIComponent);
}

function route() {
  const seg = parseHash();
  const subjectSlug = seg[0];
  if (!subjectSlug) return renderHome();
  const subject = DATA.subjects.find((s) => s.slug === subjectSlug);
  if (!subject) return renderHome();
  if (seg[1] === 'cards') {
    const part = docList(subject).find((d) => d.slug === seg[2]);
    if (part && part.flashcards) { renderFlashcards(subject, part); return; }
    // fall through to reader if no deck for that slug
    renderSubject(subject, seg[2]);
    window.scrollTo(0, 0);
    return;
  }
  renderSubject(subject, seg[1]);
  window.scrollTo(0, 0);
}

function renderHome() {
  const cards = DATA.subjects.map((s) => {
    const parts = s.parts.length;
    const meta = `${parts} ${parts === 1 ? 'lecture' : 'lectures'}${s.full ? ' · full notes' : ''}`;
    return `
      <a class="subject-card" href="#/${encodeURIComponent(s.slug)}">
        <span class="sc-accent"></span>
        <h2>${esc(s.name)}</h2>
        ${s.note ? `<span class="badge">${esc(s.note)}</span>` : ''}
        ${s.hasFlashcards ? '<span class="badge badge-cards">◧ Flashcards</span>' : ''}
        <div class="sc-meta">${esc(meta)}</div>
      </a>`;
  }).join('');

  app.innerHTML = `
    <section class="hero">
      <h1>Study Notes</h1>
      <p>Exam-ready notes compiled from course readings and lectures. Pick a subject to preview
         or download the full document — or just the lecture you need.</p>
    </section>
    <section class="subject-grid">${cards}</section>`;
}

function docList(subject) {
  const docs = [];
  if (subject.full) docs.push({ ...subject.full, slug: 'full', full: true, label: 'Full document' });
  subject.parts.forEach((p) => docs.push({ ...p, full: false, label: 'Lecture' }));
  return docs;
}

function renderSubject(subject, partSlug) {
  const docs = docList(subject);
  const selected = docs.find((d) => d.slug === partSlug) || docs[0] || null;

  const fullItems = docs.filter((d) => d.full);
  const partItems = docs.filter((d) => !d.full);

  const itemHtml = (d) => `
    <button class="doc-item ${d.full ? 'full' : ''} ${selected && d.slug === selected.slug ? 'active' : ''}"
            data-slug="${esc(d.slug)}">
      <span class="doc-icon">${fileIcon}</span>
      <span class="doc-text">
        <span class="doc-title">${esc(d.full ? subject.name + ' — Full notes' : d.title)}</span>
        <span class="doc-sub">${fmtSize(d.sizeKB)} · PDF${d.flashcards ? ` · ◧ ${d.flashcards.count} cards` : ''}</span>
      </span>
    </button>`;

  const listHtml = `
    <div class="doc-list">
      ${fullItems.length ? `<div class="doc-group-label">Complete notes</div>${fullItems.map(itemHtml).join('')}` : ''}
      ${partItems.length ? `<div class="doc-group-label">By lecture</div>${partItems.map(itemHtml).join('')}` : ''}
    </div>`;

  const previewHtml = selected ? `
    <div class="preview-bar">
      <span class="pv-title">${esc(selected.full ? subject.name + ' — Full notes' : selected.title)}</span>
      ${selected.flashcards ? `<a class="btn btn-cards" href="#/${encodeURIComponent(subject.slug)}/cards/${encodeURIComponent(selected.slug)}">◧ Study ${selected.flashcards.count} flashcards</a>` : ''}
      <a class="btn" href="${esc(selected.pdf)}" download>${dlIcon} Download</a>
    </div>
    <iframe class="preview-frame" title="PDF preview" src="${esc(selected.pdf)}#view=Fit&zoom=page-fit"></iframe>
  ` : `<div class="preview-empty">No documents available yet for this subject.</div>`;

  app.innerHTML = `
    <div class="reader">
      <div class="reader-left">
        <div class="crumbs"><a href="#/">Subjects</a> &nbsp;›&nbsp; ${esc(subject.name)}</div>
        <div class="subject-head"><h1>${esc(subject.name)}</h1></div>
        ${listHtml}
      </div>
      <div class="preview">${previewHtml}</div>
    </div>`;

  app.querySelectorAll('.doc-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/${encodeURIComponent(subject.slug)}/${encodeURIComponent(btn.dataset.slug)}`;
    });
  });
}

// ---- flashcards -------------------------------------------------------------

let DECK = null;              // { subject, part, meta, all, order, pos, flipped, known, filter }
let deckKeyHandler = null;

async function renderFlashcards(subject, part) {
  app.innerHTML = '<div class="loading">Loading flashcards…</div>';
  let meta;
  try {
    const res = await fetch(part.flashcards.json, { cache: 'no-cache' });
    meta = await res.json();
  } catch (e) {
    app.innerHTML = `<div class="loading">Could not load flashcards. <a href="#/${esc(subject.slug)}/${esc(part.slug)}">Back</a></div>`;
    return;
  }
  const cards = Array.isArray(meta.cards) ? meta.cards : [];
  DECK = {
    subject, part, meta, all: cards,
    typeLabels: meta.cardTypes || {},
    filter: 'all', shuffled: false,
    order: [], pos: 0, flipped: false, known: new Set(),
  };
  buildQueue();
  drawDeck();

  if (deckKeyHandler) window.removeEventListener('keydown', deckKeyHandler);
  deckKeyHandler = (e) => {
    if (!DECK) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipCard(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
    else if (e.key.toLowerCase() === 'g') { rate(true); }
    else if (e.key.toLowerCase() === 'a') { rate(false); }
    else if (e.key.toLowerCase() === 's') { toggleShuffle(); }
  };
  window.addEventListener('keydown', deckKeyHandler);
}

function filteredCards() {
  if (!DECK) return [];
  return DECK.filter === 'all' ? DECK.all : DECK.all.filter((c) => c.type === DECK.filter);
}

function buildQueue() {
  const cards = filteredCards();
  let idx = cards.map((_, i) => i);
  if (DECK.shuffled) {
    // deterministic-enough shuffle (no crypto needed for study order)
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(((i * 2654435761) % (i + 1)));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
  }
  DECK._cards = cards;
  DECK.order = idx;
  DECK.pos = 0;
  DECK.flipped = false;
  DECK.known = new Set();
}

function currentCard() {
  if (!DECK || DECK.pos >= DECK.order.length) return null;
  return DECK._cards[DECK.order[DECK.pos]];
}

function flipCard() { if (DECK && currentCard()) { DECK.flipped = !DECK.flipped; drawDeck(); } }
function nextCard() { if (DECK && DECK.pos < DECK.order.length) { DECK.pos++; DECK.flipped = false; drawDeck(); } }
function prevCard() { if (DECK && DECK.pos > 0) { DECK.pos--; DECK.flipped = false; drawDeck(); } }
function rate(good) {
  if (!DECK) return;
  const card = currentCard();
  if (!card) return;
  if (good) DECK.known.add(card.id);
  else { DECK.order.push(DECK.order[DECK.pos]); }  // requeue "Again" cards at the end
  DECK.pos++;
  DECK.flipped = false;
  drawDeck();
}
function toggleShuffle() { if (!DECK) return; DECK.shuffled = !DECK.shuffled; buildQueue(); drawDeck(); }
function setFilter(f) { if (!DECK) return; DECK.filter = f; buildQueue(); drawDeck(); }
function restartDeck() { if (!DECK) return; buildQueue(); drawDeck(); }

function drawDeck() {
  const { subject, part, meta } = DECK;
  const total = DECK.order.length;
  const uniqueTotal = filteredCards().length;
  const card = currentCard();

  const types = Array.from(new Set(DECK.all.map((c) => c.type)));
  const chip = (val, label, count) => `
    <button class="chip ${DECK.filter === val ? 'active' : ''}" data-filter="${esc(val)}">
      ${esc(label)}<span class="chip-n">${count}</span>
    </button>`;
  const chips = [chip('all', 'All', DECK.all.length)]
    .concat(types.map((t) => chip(t, DECK.typeLabels[t] || t, DECK.all.filter((c) => c.type === t).length)))
    .join('');

  const header = `
    <div class="fc-head">
      <div class="crumbs">
        <a href="#/">Subjects</a> &nbsp;›&nbsp;
        <a href="#/${esc(subject.slug)}/${esc(part.slug)}">${esc(subject.name)}</a> &nbsp;›&nbsp;
        <span>Flashcards</span>
      </div>
      <h1 class="fc-title">${esc(meta.lectureTitle || part.title)}</h1>
      <div class="fc-sub">${esc(meta.part || '')}${meta.readings ? ' · ' + esc(meta.readings) : ''}</div>
      <div class="fc-chips">${chips}</div>
    </div>`;

  let body;
  if (!card) {
    body = `
      <div class="fc-done">
        <div class="fc-done-mark">✓</div>
        <h2>Deck complete</h2>
        <p>You marked <strong>${DECK.known.size}</strong> of <strong>${uniqueTotal}</strong> cards as known.</p>
        <div class="fc-done-actions">
          <button class="btn" id="fc-restart">↻ Restart deck</button>
          <a class="btn btn-ghost" href="#/${esc(subject.slug)}/${esc(part.slug)}">Back to notes</a>
        </div>
      </div>`;
  } else {
    const done = DECK.pos;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const typeLabel = DECK.typeLabels[card.type] || card.type;
    body = `
      <div class="fc-progress"><div class="fc-progress-bar" style="width:${pct}%"></div></div>
      <div class="fc-count">Card ${DECK.pos + 1} / ${total} &nbsp;·&nbsp; ${DECK.known.size} known &nbsp;·&nbsp;
        <button class="fc-linkbtn" id="fc-shuffle">${DECK.shuffled ? '✓ shuffled' : 'shuffle'}</button> ·
        <button class="fc-linkbtn" id="fc-restart2">restart</button>
      </div>

      <div class="fc-card ${DECK.flipped ? 'flipped' : ''} type-${esc(card.type)}" id="fc-card" tabindex="0">
        <div class="fc-card-inner">
          <div class="fc-face fc-front">
            <span class="fc-type">${esc(typeLabel)}</span>
            <div class="fc-text">${mdBlock(card.front)}</div>
            ${card.hint ? `<div class="fc-hint">💡 ${mdInline(card.hint)}</div>` : ''}
            <div class="fc-tap">tap / space to flip</div>
          </div>
          <div class="fc-face fc-back">
            <span class="fc-type">Answer</span>
            <div class="fc-text">${mdBlock(card.back)}</div>
            ${card.source ? `<div class="fc-source">${esc(card.source)}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="fc-controls">
        <button class="btn btn-ghost" id="fc-prev" ${DECK.pos === 0 ? 'disabled' : ''}>← Prev</button>
        ${DECK.flipped
          ? `<button class="btn btn-again" id="fc-again">Again <span class="kbd">A</span></button>
             <button class="btn btn-good" id="fc-good">Got it <span class="kbd">G</span></button>`
          : `<button class="btn btn-flip" id="fc-flip">Flip <span class="kbd">Space</span></button>`}
        <button class="btn btn-ghost" id="fc-next" ${DECK.pos >= total ? 'disabled' : ''}>Next →</button>
      </div>
      <div class="fc-help">Shortcuts: <span class="kbd">Space</span> flip · <span class="kbd">←</span>/<span class="kbd">→</span> move · <span class="kbd">G</span> got it · <span class="kbd">A</span> again · <span class="kbd">S</span> shuffle</div>`;
  }

  app.innerHTML = `<div class="flashcards">${header}${body}</div>`;

  // wire events
  app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  on('fc-card', flipCard);
  on('fc-flip', flipCard);
  on('fc-prev', prevCard);
  on('fc-next', nextCard);
  on('fc-good', () => rate(true));
  on('fc-again', () => rate(false));
  on('fc-shuffle', toggleShuffle);
  on('fc-restart', restartDeck);
  on('fc-restart2', restartDeck);
  window.scrollTo(0, 0);
}

boot();
