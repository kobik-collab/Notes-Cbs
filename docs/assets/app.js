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
  const [subjectSlug, partSlug] = parseHash();
  if (!subjectSlug) return renderHome();
  const subject = DATA.subjects.find((s) => s.slug === subjectSlug);
  if (!subject) return renderHome();
  renderSubject(subject, partSlug);
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
        <span class="doc-sub">${fmtSize(d.sizeKB)} · PDF</span>
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
      <a class="btn" href="${esc(selected.pdf)}" download>${dlIcon} Download</a>
    </div>
    <iframe class="preview-frame" title="PDF preview" src="${esc(selected.pdf)}#view=FitH"></iframe>
  ` : `<div class="preview-empty">No documents available yet for this subject.</div>`;

  app.innerHTML = `
    <div class="crumbs"><a href="#/">Subjects</a> &nbsp;›&nbsp; ${esc(subject.name)}</div>
    <div class="subject-head"><h1>${esc(subject.name)}</h1></div>
    <div class="reader">
      ${listHtml}
      <div class="preview">${previewHtml}</div>
    </div>`;

  app.querySelectorAll('.doc-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/${encodeURIComponent(subject.slug)}/${encodeURIComponent(btn.dataset.slug)}`;
    });
  });
}

boot();
