/* TaxDisc — el yapımı grafikler: donut (canvas), çizgi grafik (canvas), sparkline (SVG), çubuk listeleri (DOM) */
(function () {
  const barGenerations = new WeakMap();
  function prepCanvas(canvas, hCss) {
    const dpr = window.devicePixelRatio || 1;
    const wCss = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
    const h = hCss || canvas.clientHeight || 180;
    canvas.width = Math.round(wCss * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: wCss, h };
  }

  /* Donut: segments = [{label, value, color}], center = {title, sub} */
  function donut(canvas, segments, center, thickness) {
    thickness = thickness || 26;
    const size = canvas.dataset.size ? parseInt(canvas.dataset.size, 10) : 170;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = size / 2, cy = size / 2, r = size / 2 - thickness / 2 - 2;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let a0 = -Math.PI / 2;
    ctx.clearRect(0, 0, size, size);
    for (const seg of segments) {
      const frac = seg.value / total;
      const a1 = a0 + frac * Math.PI * 2 - 0.022;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, Math.max(a1, a0 + 0.01));
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt';
      ctx.stroke();
      a0 = a1 + 0.022;
    }
    if (center) {
      ctx.fillStyle = '#f5f5f7';
      ctx.textAlign = 'center';
      ctx.font = '700 19px -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(center.title, cx, cy + 1);
      ctx.fillStyle = '#a8aab0';
      ctx.font = '500 11.5px -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(center.sub, cx, cy + 21);
    }
  }

  /* Çizgi/alan grafiği: values = [sayılar], labels = [etiketler] */
  function lineChart(canvas, values, labels, color) {
    const { ctx, w, h } = prepCanvas(canvas, 200);
    const padL = 44, padR = 14, padT = 14, padB = 26;
    const iw = w - padL - padR, ih = h - padT - padB;
    const max = Math.max(...values) * 1.08 || 1;
    const min = Math.min(...values) * 0.9;
    ctx.clearRect(0, 0, w, h);
    // yatay kılavuz
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle = '#6f7178';
    ctx.font = '500 10.5px -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padT + ih - (ih * i / 4);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      const val = min + (max - min) * i / 4;
      ctx.fillText(App.fmtBytes(val), padL - 7, y + 3.5);
    }
    // alan
    const px = i => padL + (iw * i / (values.length - 1));
    const py = v => padT + ih - ((v - min) / (max - min)) * ih;
    const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '05');
    ctx.beginPath();
    ctx.moveTo(px(0), py(values[0]));
    values.forEach((v, i) => ctx.lineTo(px(i), py(v)));
    ctx.lineTo(px(values.length - 1), padT + ih);
    ctx.lineTo(px(0), padT + ih);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // çizgi
    ctx.beginPath();
    values.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // noktalar
    ctx.fillStyle = color;
    values.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(px(i), py(v), 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1b1c1f'; ctx.lineWidth = 1.4; ctx.stroke();
    });
    // x etiketleri
    ctx.fillStyle = '#6f7178';
    ctx.textAlign = 'center';
    labels.forEach((lb, i) => ctx.fillText(lb, px(i), h - 8));
  }

  /* Sparkline (SVG) */
  function sparkline(values, color, wCss, hCss) {
    wCss = wCss || 96; hCss = hCss || 26;
    const max = Math.max(...values), min = Math.min(...values);
    const rng = (max - min) || 1;
    const pts = values.map((v, i) =>
      (wCss * i / (values.length - 1)).toFixed(1) + ',' + (hCss - 3 - ((v - min) / rng) * (hCss - 6)).toFixed(1)
    ).join(' ');
    return '<svg class="spark" width="' + wCss + '" height="' + hCss + '" viewBox="0 0 ' + wCss + ' ' + hCss + '">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* Yatay çubuk listesi (DOM) */
  function barList(el, items, opts) {
    const generation = (barGenerations.get(el) || 0) + 1;
    barGenerations.set(el, generation);
    opts = opts || {};
    const max = Math.max(...items.map(i => i.value)) || 1;
    el.innerHTML = items.map((it, idx) => {
      const pct = Math.max(it.value / max * 100, 1.2);
      const c = it.color || '#5eb08b';
      return '<div class="bar-row" data-idx="' + idx + '">' +
        '<div class="b-label">' + escapeHtml(it.label) + (it.sub ? '<span>' + escapeHtml(it.sub) + '</span>' : '') + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:0%;background:linear-gradient(90deg,' + c + 'bb,' + c + ')"></div></div>' +
        '<div class="b-val">' + (it.fmt ? it.fmt(it.value) : App.fmtBytes(it.value)) + '</div>' +
      '</div>';
    }).join('');
    // animasyon
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (barGenerations.get(el) !== generation) return;
        el.querySelectorAll('.bar-fill').forEach((f, i) => { f.style.width = Math.max(items[i].value / max * 100, 1.2) + '%'; });
      }, 30);
    });
    if (opts.onRowClick) {
      el.querySelectorAll('.bar-row').forEach(r => r.addEventListener('click', () => opts.onRowClick(items[+r.dataset.idx], +r.dataset.idx)));
    }
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  window.Charts = { donut, lineChart, sparkline, barList };
})();
