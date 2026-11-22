'use strict';

(() => {
  const $ = (sel) => document.querySelector(sel);
  const form = $('#lookup');
  const plateInput = $('#plate');
  const stateSelect = $('#state');
  const submit = $('#submit');
  const errorEl = $('#form-error');
  const resultsEl = $('#results');
  const banner = $('#demo-banner');

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Tiny element builder; uses textContent only, so values are never parsed as HTML.
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v; else node.setAttribute(k, v);
    }
    for (const c of children.flat()) if (c != null && c !== false) node.append(c.nodeType ? c : String(c));
    return node;
  }

  let config = { demo: false };
  fetch('/api/config').then((r) => r.json()).then((cfg) => {
    config = cfg;
    for (const [code, name] of Object.entries(cfg.states)) stateSelect.append(el('option', { value: code }, `${code} · ${name}`));
    try { const last = localStorage.getItem('tollpay:state'); if (last) stateSelect.value = last; } catch {}
  });

  plateInput.addEventListener('input', () => {
    const pos = plateInput.selectionStart;
    plateInput.value = plateInput.value.toUpperCase();
    plateInput.setSelectionRange(pos, pos);
  });

  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = !msg; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plate = plateInput.value.replace(/[\s\-.]/g, '');
    const state = stateSelect.value;
    if (!state) { showError('Choose the state that issued the plate.'); stateSelect.focus(); return; }
    if (!/^[A-Za-z0-9]{1,8}$/.test(plate)) { showError('Enter a valid plate (1–8 letters or numbers).'); plateInput.focus(); return; }
    showError('');
    try { localStorage.setItem('tollpay:state', state); } catch {}

    submit.disabled = true; submit.textContent = 'Searching…';
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      render(data);
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      submit.disabled = false; submit.textContent = 'Search tolls';
    }
  });

  function render(data) {
    banner.hidden = !data.demo;
    resultsEl.replaceChildren();
    const found = data.results.filter((r) => r.status === 'found');
    const manual = data.results.filter((r) => r.status === 'manual' || r.status === 'error');
    const clear = data.results.filter((r) => r.status === 'clear');

    resultsEl.append(el('div', { class: 'summary' },
      el('div', {},
        el('div', { class: 'label' }, 'Total outstanding for ', el('span', { class: 'plate-chip' }, `${data.state} ${data.plate}`)),
        el('div', { class: 'total' }, money.format(data.totalDue)),
      ),
      el('div', { class: 'stats' },
        el('span', {}, el('b', {}, data.tollCount), ' tolls'),
        el('span', {}, el('b', {}, data.summary.found + data.summary.clear), ' agencies checked'),
        el('span', {}, el('b', {}, data.summary.manual + data.summary.error), ' to check yourself'),
      ),
    ));

    if (found.length) {
      resultsEl.append(el('h2', {}, 'Outstanding tolls ', el('span', { class: 'count' }, `(${found.length} ${found.length === 1 ? 'agency' : 'agencies'})`)));
      for (const r of found) resultsEl.append(agencyCard(r));
    } else if (data.summary.found + data.summary.clear > 0) {
      resultsEl.append(el('h2', {}, 'No outstanding tolls found'));
    }

    if (manual.length) {
      resultsEl.append(
        el('h2', {}, 'Check these agencies directly ', el('span', { class: 'count' }, `(${manual.length})`)),
        el('p', { class: 'section-note' }, 'These agencies don\'t offer automated lookups. Each link opens the agency\'s own pay-by-plate page. Agencies in your plate\'s state are listed first.'),
        el('div', { class: 'links' }, manual.map((r) => el('a', { class: 'link-item', href: r.payUrl, target: '_blank', rel: 'noopener noreferrer' },
          el('span', {},
            el('div', { class: 'card-title' }, r.agency, r.homeState && el('span', { class: 'tag tag-home' }, 'Your state')),
            el('div', { class: 'card-sub' }, r.status === 'error' ? 'Lookup failed, check on site' : `${r.network} · ${r.states.join(', ')}`),
          ),
          el('span', { class: 'arrow', 'aria-hidden': 'true' }, '↗'),
        ))),
      );
    }

    if (clear.length) {
      resultsEl.append(
        el('h2', {}, 'No balance found ', el('span', { class: 'count' }, `(${clear.length})`)),
        el('p', { class: 'clear-list' }, clear.map((r) => r.agency).join(' · ')),
      );
    }

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function agencyCard(r) {
    const isDemo = r.tolls.some((t) => t.demo);
    return el('div', { class: 'card' },
      el('div', { class: 'card-head' },
        el('div', {},
          el('div', { class: 'card-title' }, r.agency, isDemo && el('span', { class: 'tag tag-demo' }, 'Sample')),
          el('div', { class: 'card-sub' }, `${r.network} · ${r.states.join(', ')}`),
        ),
        el('div', { class: 'card-actions' },
          el('span', { class: 'amount' }, money.format(r.due)),
          el('a', { class: 'btn btn-ghost', href: r.payUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Pay on agency site ↗'),
        ),
      ),
      el('table', {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Location'), el('th', { class: 'num' }, 'Toll'), el('th', { class: 'num' }, 'Fees'), el('th', {}, 'Due by'))),
        el('tbody', {}, r.tolls.map((t) => el('tr', {},
          el('td', {}, fmtDate(t.date)),
          el('td', {}, t.location),
          el('td', { class: 'num' }, money.format(t.amount)),
          el('td', { class: t.fees ? 'num fee' : 'num' }, t.fees ? money.format(t.fees) : '—'),
          el('td', {}, fmtDate(t.dueDate)),
        ))),
      ),
    );
  }
})();
