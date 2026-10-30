/* TaxDisc — Klasör Bazlı Depolama Raporları */
App.whenReady(function () {
  const $ = App.$;
  const ds = App.dataset;
  let months = 6;
  let selected = null;

  const COLOR_SET = ['#5eb08b', '#69c19a', '#4f9e94', '#7ac7a3', '#3f8a6e', '#5c82a8', '#6a5f52', '#8a7fc9'];
  let cachedDistribution = null;
  let cachedAverageFileSize = null;

  function topFolders() {
    return (ds.root.children || []).filter(node => node.kind === 'folder').sort((a, b) => b.size - a.size);
  }

  function extDistribution() {
    if (cachedDistribution) return cachedDistribution;
    if (ds.categoryBytes) {
      cachedDistribution = Object.entries(ds.categoryBytes)
        .map(([key, value]) => ({ label: (App.CATS[key] || App.CATS.other).label, value }))
        .sort((a, b) => b.value - a.value);
      return cachedDistribution;
    }
    const map = new Map();
    (function walk(node) {
      for (const c of (node.children || [])) {
        if (c.kind === 'file') {
          const cat = App.catOf(c);
          if (cat === App.CATS.other && !App.extOf(c.name)) continue; // uzantısızlar hariç? hayır dahil ama kategori other
          map.set(cat.label, (map.get(cat.label) || 0) + c.size);
        } else walk(c);
      }
    })(ds.root);
    cachedDistribution = Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    return cachedDistribution;
  }

  function monthLabels(n) {
    const MON = [I18n.f('Oca'), I18n.f('Şub'), 'Mar', I18n.f('Nis'), 'May', I18n.f('Haz'), I18n.f('Tem'), I18n.f('Ağu'), I18n.f('Eyl'), I18n.f('Eki'), I18n.f('Kas'), I18n.f('Ara')];
    const now = new Date(ds.scannedAt || Date.now());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(MON[d.getMonth()]);
    }
    return out;
  }

  function renderSummary() {
    const total = ds.root.size;
    const growth = Data.growthFor('root:' + ds.root.name, months);
    const chg = (growth[growth.length - 1] / growth[growth.length - 2] - 1) * 100;
    const tops = topFolders();
    $('#r-total').textContent = App.fmtBytes(total);
    $('#r-chg').textContent = ds.source === 'demo' ? ((chg >= 0 ? '+' : '−') + App.fmtPct(Math.abs(chg)).slice(1)) : '—';
    $('#r-chg').className = ds.source === 'demo' ? (chg >= 0 ? 'chg up' : 'chg down') : '';
    const fastest = tops.slice().sort((a, b) => {
      const ga = Data.growthFor(a.name, months), gb = Data.growthFor(b.name, months);
      return (gb[gb.length - 1] - gb[0]) - (ga[ga.length - 1] - ga[0]);
    })[0];
    $('#r-fastest').textContent = ds.source === 'demo' && fastest ? fastest.name : I18n.f('Geçmiş veri yok');
    const gFast = fastest ? Data.growthFor(fastest.name, months) : [0, 0];
    $('#r-fastest-sub').textContent = ds.source === 'demo' && fastest ? '+' + App.fmtBytes((gFast[gFast.length - 1] - gFast[0]) * fastest.size) + ' / ' + months + ' ay' : I18n.f('Yalnızca son tarama saklanır');
    $('#r-avgfile').textContent = App.fmtBytes(avgFileSize());
    $('#r-folders').textContent = App.fmtCount(tops.length) + I18n.f(' üst klasör');
    const cap = ds.volume && ds.volume.total ? ds.volume.total : 0;
    $('#r-saturation').textContent = cap ? App.fmtPct(Math.min((cap - ds.volume.free) / cap * 100, 100)) : '—';
    const capLabel = $('#r-capacity');
    if (capLabel) capLabel.textContent = cap ? App.fmtBytes(cap) + I18n.f(' sürücü kapasitesi') : I18n.f('Sürücü kapasitesi alınamadı');
  }
  function avgFileSize() {
    if (cachedAverageFileSize != null) return cachedAverageFileSize;
    if (ds.root.files) {
      cachedAverageFileSize = ds.root.size / ds.root.files;
      return cachedAverageFileSize;
    }
    let sum = 0, cnt = 0;
    (function walk(n) {
      for (const c of (n.children || [])) {
        if (c.kind === 'file') { sum += c.size; cnt++; } else walk(c);
      }
    })(ds.root);
    cachedAverageFileSize = cnt ? sum / cnt : 0;
    return cachedAverageFileSize;
  }

  function renderBars() {
    const tops = topFolders().slice(0, 8);
    Charts.barList($('#folder-bars'), tops.map((f, i) => ({
      label: f.name,
      sub: App.fmtPct(ds.root.size ? f.size / ds.root.size * 100 : 0) + ' · ' + I18n.count(f.files, 'file'),
      value: f.size,
      color: COLOR_SET[i % COLOR_SET.length]
    })), { onRowClick: (_item, index) => select(tops[index]) });
  }

  function renderDonut() {
    const dist = extDistribution().slice(0, 7);
    const rest = extDistribution().slice(7).reduce((s, x) => s + x.value, 0);
    const segs = dist.map((d, i) => ({ ...d, color: COLOR_SET[i % COLOR_SET.length] }));
    if (rest > 0) segs.push({ label: I18n.f('Diğer'), value: rest, color: '#55565c' });
    Charts.donut($('#ext-donut'), segs, { title: App.fmtBytes(ds.root.size), sub: I18n.f('dosya türleri') }, 26);
    $('#ext-legend').innerHTML = segs.map(s =>
      '<div class="lg-row"><span class="dot" style="background:' + s.color + '"></span>' +
      '<span class="lg-name">' + esc(s.label) + '</span><span class="lg-val">' + App.fmtBytes(s.value) + '</span></div>').join('');
  }

  function renderGrowth() {
    if (ds.source !== 'demo') {
      $('#growth-canvas').hidden = true;
      $('#period').hidden = true;
      $('#growth-note').textContent = I18n.f('Geçmiş tarama tutulmuyor; aylık büyüme hesaplanamaz.');
      return;
    }
    const labels = monthLabels(months);
    const g = Data.growthFor('root:' + ds.root.name, months);
    const values = ds.source === 'demo' ? g.map(x => x * ds.root.size) : g.map(() => ds.root.size);
    Charts.lineChart($('#growth-canvas'), values, labels, '#5eb08b');
    const note = $('#growth-note');
    if (note) note.textContent = ds.source === 'demo' ? I18n.f('örnek eğilim verisi') : I18n.f('tek tarama · değişim hesaplanamaz');
  }

  function renderTable() {
    const tops = topFolders();
    const tbody = $('#report-body');
    tbody.innerHTML = tops.map((f, i) => {
      const g = Data.growthFor(f.name, months);
      const chg = ds.source === 'demo' ? (g[g.length - 1] / g[g.length - 2] - 1) * 100 : 0;
      const spark = ds.source === 'demo' ? Charts.sparkline(g.map(x => x * f.size), chg >= 0 ? '#45d465' : '#ff736a') : '<span class="dim">—</span>';
      return '<tr data-id="' + f.id + '"' + (selected && selected.id === f.id ? ' class="selected"' : '') + '>' +
        '<td><div class="td-name">' + ic('folderFill', 'ico-folder') + '<div class="tw"><b>' + esc(f.name) + '</b></div></div></td>' +
        '<td class="num">' + App.fmtBytes(f.size) + '</td>' +
        '<td><span class="mini-pct"><i style="width:' + (ds.root.size ? f.size / ds.root.size * 100 : 0).toFixed(1) + '%"></i></span>' + App.fmtPct(ds.root.size ? f.size / ds.root.size * 100 : 0) + '</td>' +
        '<td>' + (ds.source === 'demo' ? '<span class="chg ' + (chg >= 0 ? 'up' : 'down') + '">' + (chg >= 0 ? '+' : '−') + App.fmtPct(Math.abs(chg)).slice(1) + '</span>' : '<span class="dim">—</span>') + '</td>' +
        '<td>' + spark + '</td>' +
        '<td class="modified">' + App.fmtDate(f.mod) + '</td>' +
      '</tr>';
    }).join('') || I18n.f('<tr><td colspan="6" class="empty-message">Raporlanacak üst klasör yok. Küçük klasörler haritada “Diğer küçük öğeler” içinde toplanır.</td></tr>');
    tbody.querySelectorAll('tr[data-id]').forEach(tr => tr.addEventListener('click', () => {
      select((ds.root.children || []).find(c => c.id === tr.dataset.id));
    }));
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function select(f) {
    if (!f) return;
    selected = f;
    document.querySelectorAll('#report-body tr.selected').forEach(tr => tr.classList.remove('selected'));
    const tr = document.querySelector('#report-body tr[data-id="' + f.id + '"]');
    if (tr) tr.classList.add('selected');
    const pct = ds.root.size ? f.size / ds.root.size * 100 : 0;
    const g = Data.growthFor(f.name, months);
    const chg = ds.source === 'demo' ? (g[g.length - 1] / g[g.length - 2] - 1) * 100 : null;
    App.setInspector(
      '<div class="sel-card">' + ic('folderFill', 'big-ico') + '<div><b>' + esc(f.name) + '</b><span>' + esc(App.nodePath(f)) + '</span></div></div>' +
      I18n.f('<div class="section-label">Temel İstatistikler</div>') +
      '<div class="key-stats">' +
        I18n.f('<div class="kstat"><span>Boyut</span><b>') + App.fmtBytes(f.size) + '</b></div>' +
        I18n.f('<div class="kstat"><span>Disk Payı</span><b>') + App.fmtPct(pct) + '</b></div>' +
        I18n.f('<div class="kstat"><span>Değişim</span><b style="color:') + (chg == null ? 'var(--text-2)' : (chg >= 0 ? '#45d465' : '#ff736a')) + '">' + (chg == null ? '—' : ((chg >= 0 ? '+' : '−') + App.fmtPct(Math.abs(chg)).slice(1))) + '</b></div>' +
      '</div>' +
      I18n.f('<div class="section-label">Meta Veriler</div>') +
      '<div class="meta-card">' +
        I18n.f('<div class="meta-row"><span>Dosyalar</span><b>') + App.fmtCount(f.files) + '</b></div>' +
        I18n.f('<div class="meta-row"><span>Değiştirilme</span><b>') + App.fmtDate(f.mod) + '</b></div>' +
        I18n.f('<div class="meta-row"><span>Erişim</span><b>') + (f.access === 'Limited' ? I18n.f('Sınırlı') : I18n.f('Tam')) + '</b></div>' +
      '</div>' +
      I18n.f('<div class="section-label">Eylemler</div>') +
      '<div class="actions">' +
        '<button class="btn primary" data-act="csvf">' + ic('export') + I18n.f('Bu Klasörün Raporunu İndir</button>') +
        '<button class="btn" data-act="zoom">' + ic('zoomIn') + I18n.f('Haritada Göster</button>') +
      '</div>'
    );
    $('#insp-body').querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.act === 'csvf') exportCsv([f]);
      else if (b.dataset.act === 'zoom') location.href = 'index.html#path=' + encodeURIComponent(App.nodePath(f));
    }));
  }

  function exportCsv(rows) {
    const lines = [[I18n.f('Klasör'), I18n.f('Boyut (Bayt)'), I18n.f('Payı (%)'), I18n.f('Dosya Sayısı'), I18n.f('Değiştirilme')]];
    (rows || topFolders()).forEach(f => {
      lines.push([
        f.name, f.size,
        (ds.root.size ? f.size / ds.root.size * 100 : 0).toFixed(2).replace('.', I18n.language === 'tr' ? ',' : '.'),
        f.files || 0,
        App.fmtDate(f.mod)
      ]);
    });
    App.downloadCsv(lines, 'taxdisc-depolama-raporu.csv');
  }

  function refresh() {
    renderSummary();
    renderBars();
    renderDonut();
    renderGrowth();
    renderTable();
    if (selected) select(selected);
  }

  /* Başlat */
  $('#period').addEventListener('change', e => { months = +e.target.value; refresh(); });
  $('#btn-export').addEventListener('click', () => exportCsv(null));
  $('#btn-print').addEventListener('click', () => window.print());

  App.setActiveLoc && App.setActiveLoc('scan');
  refresh();
});
