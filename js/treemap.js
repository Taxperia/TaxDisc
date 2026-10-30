/* TaxDisc — Squarified treemap (2 seviyeli, etkileşimli) */
(function () {
  const PALETTE = [
    ['#5eb08b', '#63b592', '#549f7e'],  // yeşil
    ['#69c19a', '#72c7a2', '#5eb08b'],  // açık yeşil
    ['#4f9e94', '#56a89d', '#478f86'],  // teal
    ['#7ac7a3', '#83ccaa', '#6db592'],  // adaçayı
    ['#3f8a6e', '#469277', '#387c63'],  // koyu yeşil
    ['#5c82a8', '#648bb0', '#527699'],  // mavi
    ['#6a5f52', '#736759', '#5f554a']   // gri-kahve
  ];
  // yeşil ağırlıklı seçim: son iki renk daha nadir
  const WEIGHTS = [3, 3, 2.2, 2.2, 2, 1.1, 0.7];
  const WSUM = WEIGHTS.reduce((a, b) => a + b, 0);

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }
  function pickColor(name) {
    let r = hashStr(name) % 1000;
    let acc = 0, idx = 0;
    for (let i = 0; i < WEIGHTS.length; i++) { acc += (WEIGHTS[i] / WSUM) * 1000; if (r < acc) { idx = i; break; } }
    const set = PALETTE[idx];
    return set[hashStr(name + '|v') % set.length];
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
    const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /* Squarified yerleşim — Bruls, Huizing, van Wijk */
  function squarify(items, rect) {
    const out = [];
    const total = items.reduce((s, i) => s + i.v, 0);
    if (total <= 0 || rect.w <= 0 || rect.h <= 0) return out;
    const scale = (rect.w * rect.h) / total;
    const list = items.map(i => ({ v: Math.max(i.v * scale, 0.0001), d: i.d }));
    let x = rect.x, y = rect.y, w = rect.w, h = rect.h, i = 0;
    const worst = (row, len) => {
      const a = row.reduce((s, r) => s + r.v, 0), t = a / len;
      let worstR = 0;
      for (const r of row) { const o = r.v / t; worstR = Math.max(worstR, Math.max(t / o, o / t)); }
      return worstR;
    };
    while (i < list.length) {
      const side = Math.min(w, h);
      let row = [list[i]], j = i + 1;
      while (j < list.length) {
        const cand = row.concat([list[j]]);
        if (worst(cand, side) <= worst(row, side)) { row = cand; j++; } else break;
      }
      const rowArea = row.reduce((s, r) => s + r.v, 0);
      if (w >= h) {
        const cw = Math.min(rowArea / h, w);
        let cy = y;
        const chTot = row.reduce((s, r) => s + r.v, 0) / cw;
        for (let k = 0; k < row.length; k++) {
          const ch = (k === row.length - 1) ? (y + h - cy) : row[k].v / cw;
          out.push({ x, y: cy, w: cw, h: ch, d: row[k].d });
          cy += ch;
        }
        x += cw; w -= cw;
      } else {
        const rh = Math.min(rowArea / w, h);
        let cx = x;
        for (let k = 0; k < row.length; k++) {
          const cw2 = (k === row.length - 1) ? (x + w - cx) : row[k].v / rh;
          out.push({ x: cx, y, w: cw2, h: rh, d: row[k].d });
          cx += cw2;
        }
        y += rh; h -= rh;
      }
      i = j;
    }
    return out;
  }

  const state = { container: null, node: null, cells: new Map(), selected: null, onSelect: null, onNavigate: null, tt: null };

  function ensureTooltip() {
    if (state.tt) return state.tt;
    let t = document.getElementById('tt');
    if (!t) {
      t = document.createElement('div');
      t.className = 'tt';
      t.id = 'tt';
      document.body.appendChild(t);
    }
    state.tt = t;
    return t;
  }

  function fmt(b) { return App.fmtBytes(b); }

  function showTip(node, ev) {
    const tt = ensureTooltip();
    const cat = App.catOf(node);
    const parent = node.parent;
    const pctParent = parent && parent.size ? (node.size / parent.size * 100) : 100;
    const scanRoot = App.currentViewRoot || App.dataset.root;
    const pctScan = scanRoot && scanRoot.size ? (node.size / scanRoot.size * 100) : 100;
    tt.innerHTML =
      '<div class="tt-title">' + ic(cat.icon) + '<span>' + escapeHtml(node.name) + '</span></div>' +
      '<div class="tt-line"><b>' + fmt(node.size) + '</b> · ' + App.fmtPct(pctParent) + I18n.f(' (üst klasör)</div>') +
      '<div class="tt-src"><span>' + (parent ? escapeHtml(parent.name) : '—') + '</span><span>' +
        (node.kind === 'folder' ? App.fmtCount(node.files) + I18n.f(' dosya') : cat.label) + '</span></div>';
    tt.classList.add('show');
    moveTip(ev);
  }
  function moveTip(ev) {
    if (!state.tt) return;
    const pad = 16, tw = state.tt.offsetWidth, th = state.tt.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + tw > window.innerWidth - 8) x = ev.clientX - tw - pad;
    if (y + th > window.innerHeight - 8) y = ev.clientY - th - pad;
    state.tt.style.left = x + 'px';
    state.tt.style.top = y + 'px';
  }
  function hideTip() { if (state.tt) state.tt.classList.remove('show'); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function el(tag, cls, css) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) for (const k in css) e.style[k] = css[k];
    return e;
  }

  function leafCell(node, r, gap) {
    const base = pickColor(node.name);
    const jitter = ((hashStr(node.name + '|j') % 9) - 4) * 0.016;
    const color = shade(base, jitter);
    const cell = el('div', 'tm-cell', {
      left: (r.x + gap) + 'px', top: (r.y + gap) + 'px',
      width: Math.max(r.w - gap * 2, 0) + 'px', height: Math.max(r.h - gap * 2, 0) + 'px',
      background: color
    });
    cell.dataset.id = node.id;
    if (r.w > 58 && r.h > 24) {
      cell.appendChild(el('div', 'tm-label', null)).textContent = node.name;
      if (r.h > 42) cell.appendChild(el('div', 'tm-size', null)).textContent = fmt(node.size);
    }
    bindEvents(cell, node);
    return cell;
  }

  function groupEl(node, r) {
    const color = pickColor(node.name);
    const g = el('div', 'tm-group', {
      left: r.x + 'px', top: r.y + 'px',
      width: Math.max(r.w - 1.5, 0) + 'px', height: Math.max(r.h - 1.5, 0) + 'px',
      background: color
    });
    g.dataset.id = node.id;
    const HEADER = 23, GAP = 1.5;
    const showHeader = r.w > 74 && r.h > 44;
    if (showHeader) {
      const head = el('div', 'tm-head');
      head.textContent = node.name;
      g.appendChild(head);
    }
    const body = { x: 0, y: showHeader ? HEADER : 0, w: r.w - 3, h: (r.h - 3) - (showHeader ? HEADER : 0) };
    const kids = (node.children || []).filter(c => c.size > 0);
    if (kids.length && body.w > 8 && body.h > 8) {
      const laid = squarify(kids.map(c => ({ v: c.size, d: c })), body);
      for (const rr of laid) g.appendChild(leafCell(rr.d, rr, GAP));
    }
    if (!showHeader && r.w > 50 && r.h > 22) {
      g.appendChild(el('div', 'tm-label', null)).textContent = node.name;
    }
    bindEvents(g, node);
    return g;
  }

  function bindEvents(elm, node) {
    elm.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.onSelect) state.onSelect(node);
    });
    elm.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (node.kind === 'folder' && node.children && state.onNavigate) state.onNavigate(node);
    });
    elm.addEventListener('mouseenter', (e) => showTip(node, e));
    elm.addEventListener('mousemove', moveTip);
    elm.addEventListener('mouseleave', hideTip);
  }

  function render(container, node, opts) {
    state.container = container;
    state.node = node;
    state.onSelect = opts.onSelect;
    state.onNavigate = opts.onNavigate;
    state.selected = opts.selectedId || null;
    state.cells.clear();
    container.innerHTML = '';
    const W = container.clientWidth, H = container.clientHeight;
    if (W < 40 || H < 40) return;

    const PAD = 6;
    const kids = (node.children || []).filter(c => c.size > 0).sort((a, b) => b.size - a.size);
    const laid = squarify(kids.map(c => ({ v: c.size, d: c })), { x: PAD, y: PAD, w: W - PAD * 2, h: H - PAD * 2 });
    const frag = document.createDocumentFragment();
    for (const r of laid) {
      const ge = groupEl(r.d, r);
      if (r.d.id === state.selected) ge.classList.add('tm-selected');
      state.cells.set(r.d.id, ge);
      // seçili alt hücreleri de işaretle
      if (r.d.id === state.selected || state.selected === null) { /* nop */ }
      frag.appendChild(ge);
    }
    container.appendChild(frag);
    markSelected(state.selected);
  }

  function markSelected(id) {
    state.selected = id;
    if (!state.container) return;
    state.container.querySelectorAll('.tm-selected').forEach(e => e.classList.remove('tm-selected'));
    // grup ve altındaki eşleşen hücreleri seçili göster
    if (id) {
      state.cells.forEach((elm, cellId) => {
        if (cellId === id) elm.classList.add('tm-selected');
      });
      // alt hücreler: grup içinde dataset.id eşleşenleri de seç
      const grp = state.cells.get(id);
      if (grp) {
        grp.classList.add('tm-selected');
        grp.querySelectorAll('.tm-cell').forEach(c => { if (c.dataset.id === id) c.classList.add('tm-selected'); });
      } else {
        state.container.querySelectorAll('.tm-cell[data-id="' + id + '"]').forEach(c => c.classList.add('tm-selected'));
      }
    }
  }

  window.Treemap = { render, markSelected };
})();
