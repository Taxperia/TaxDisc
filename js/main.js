/* TaxDisc — Ana sayfa: etkileşimli disk haritası */
App.whenReady(function () {
  const ds = App.dataset;
  App.currentViewRoot = ds.root;

  const $ = App.$;
  const backStack = [], fwdStack = [];
  let selected = null;
  let sortDir = 'desc';
  let listMode = 'children'; // children | flat
  let filterText = '';
  let visible = 100;
  const pagination = document.createElement('div'); pagination.className = 'pagination';
  $('.list-area').appendChild(pagination);

  /* İstenen başlangıç görünümü: #loc=xxx veya Kitaplık */
  function resolveLocation(key) {
    const loc = App.LOCATIONS.find(l => l.key === key);
    if (!loc) return null;
    let node = ds.root;
    for (const part of loc.path) {
      const next = (node.children || []).find(c => c.name === part && c.kind === 'folder');
      if (!next) return null;
      node = next;
    }
    return node;
  }

  function findByName(root, path) {
    let node = root;
    for (const part of path) {
      const next = (node.children || []).find(c => c.name === part);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  const hash = new URLSearchParams(location.hash.slice(1));
  let start = hash.get('loc') ? resolveLocation(hash.get('loc')) : null;
  if (!start) start = ds.source === 'demo' ? (findByName(ds.root, ['Library']) || ds.root) : ds.root;
  if (hash.get('path')) {
    (function findPath(node) {
      if (node.kind === 'folder' && App.nodePath(node) === hash.get('path')) start = node;
      (node.children || []).forEach(findPath);
    })(ds.root);
  }
  App.currentViewRoot = start;

  /* ---------- Üst bilgi ---------- */
  function relPath(node) {
    const parts = [];
    let cur = node;
    while (cur && cur.parent) { parts.unshift(cur.name); cur = cur.parent; }
    // kökün altındaysa "/" ile başlat (kök adını hariç tut)
    return '/' + parts.slice(node.parent ? 0 : 0).join('/');
  }
  function pathString(node) {
    return App.nodePath(node);
  }
  function countFolders(node) {
    let n = 0;
    (function walk(x) {
      if (x.children) for (const c of x.children) { if (c.kind === 'folder') { n++; walk(c); } }
    })(node);
    return n;
  }

  function renderHeader() {
    const node = App.currentViewRoot;
    $('#folder-title').textContent = node.name;
    $('.rel-path').textContent = pathString(node);
    $('#last-scan').textContent = App.fmtDate(ds.scannedAt);
    // breadcrumb
    const crumb = $('#breadcrumbs');
    const chain = [];
    let cur = node;
    while (cur) { chain.unshift(cur); cur = cur.parent; }
    crumb.innerHTML = chain.map((c, i) =>
      i === chain.length - 1
        ? '<span class="cur">' + esc(c.name) + '</span>'
        : '<a data-nav="' + c.id + '">' + esc(c.name) + '</a><span class="sep">›</span>'
    ).join('');
    crumb.querySelectorAll('a[data-nav]').forEach(a =>
      a.addEventListener('click', () => { const n = findById(a.dataset.nav); if (n) navigateTo(n); }));
    // istatistikler
    $('#stat-size').textContent = App.fmtBytes(node.size);
    $('#stat-files').textContent = App.fmtCount(node.files);
    $('#stat-folders').textContent = App.fmtCount(Number.isFinite(node.folders) ? node.folders : countFolders(node));
    $('#stat-warnings').textContent = App.fmtCount(ds.warnings || 0);
    const notice = $('#notice-bar');
    if (notice) {
      if (ds.source === 'empty') {
        notice.style.display = 'flex';
        $('#notice-text').textContent = ds.requiresRescan
          ? I18n.f('Tarama kaydı eski veya okunamıyor. Lütfen yeniden tarayın.')
          : I18n.f('Analize başlamak için “Klasör Tara” düğmesinden bir klasör veya sürücü seçin.');
        const p = notice.querySelector('.path');
        if (p) p.textContent = ds.requiresRescan
          ? I18n.f('Yeni tarayıcı tüm dosyaları analiz eder, arayüze kompakt bir özet aktarır.')
          : I18n.f('Tarama bilgisayarınızda, yerel olarak yapılır.');
      } else if (ds.warnings || ds.truncated || ds.skippedLinks) {
        notice.style.display = 'flex';
        $('#notice-text').textContent = App.fmtCount(ds.warnings || 0) + I18n.f(' öğe erişim veya sınır nedeniyle atlandı.');
        const p = notice.querySelector('.path');
        if (p) p.textContent = ds.truncated ? I18n.f('Tarama eksik: klasör derinliği veya istenen öğe sınırına ulaşıldı. Erişilebilir diğer konumlar analiz edildi.') : ((ds.skippedLinks || 0) + I18n.f(' sembolik bağlantı takip edilmedi.'));
      } else {
        notice.style.display = 'none';
      }
    }
    updateArrows();
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const idMap = new Map();
  (function indexIds(n) { idMap.set(n.id, n); (n.children || []).forEach(indexIds); })(ds.root);
  function findById(id) { return idMap.get(id); }

  /* ---------- Gezinme ---------- */
  function navigateTo(node, push) {
    if (!node || node.kind !== 'folder') return;
    if (push !== false) { backStack.push(App.currentViewRoot); fwdStack.length = 0; }
    App.currentViewRoot = node;
    visible = 100;
    if (!selected || !isDescendant(selected, node)) selected = null;
    renderAll();
  }
  function isDescendant(node, ancestor) {
    let cur = node;
    while (cur) { if (cur === ancestor) return true; cur = cur.parent; }
    return false;
  }
  function goBack() { if (backStack.length) { fwdStack.push(App.currentViewRoot); App.currentViewRoot = backStack.pop(); renderAll(); } }
  function goFwd() { if (fwdStack.length) { backStack.push(App.currentViewRoot); App.currentViewRoot = fwdStack.pop(); renderAll(); } }
  function updateArrows() {
    $('#btn-back').disabled = !backStack.length;
    $('#btn-fwd').disabled = !fwdStack.length;
  }

  /* ---------- Treemap ---------- */
  function renderMap() {
    const area = $('#treemap');
    if (ds.source === 'empty') {
      area.innerHTML = '<div class="empty-state">' + ic('folderPlus') + I18n.f('<h2>Diskinizi analiz etmeye başlayın</h2>') +
        I18n.f('<p>Bir klasör ya da sürücü seçin; TaxDisc gerçek dosya boyutlarını okuyup alan haritasını oluştursun.</p>') +
        I18n.f('<button class="btn primary" data-action="scan">Klasör Tara</button></div>');
      return;
    }
    if (!App.currentViewRoot.size) {
      area.innerHTML = I18n.f('<div class="empty-state"><h2>Bu konumda boyutlandırılacak veri yok</h2><p>Boş dosyalar veya erişilemeyen klasörler varsa aşağıdaki listeyi ve uyarıları inceleyin.</p></div>');
      return;
    }
    Treemap.render(area, App.currentViewRoot, {
      selectedId: selected ? selected.id : null,
      onSelect: (n) => select(n, { fromMap: true }),
      onNavigate: (n) => navigateTo(n)
    });
  }

  /* ---------- Tablo ---------- */
  function tableRows() {
    const node = App.currentViewRoot;
    if (listMode === 'children') {
      return (node.children || [])
        .slice().sort((a, b) => sortDir === 'desc' ? b.size - a.size : a.size - b.size)
        .map(c => ({ node: c, rel: c.name }));
    }
    const flat = [];
    (function walk(x, base) {
      for (const c of (x.children || [])) {
        flat.push({ node: c, rel: base ? base + '/' + c.name : c.name });
        if (c.children) walk(c, base ? base + '/' + c.name : c.name);
      }
    })(node, '');
    flat.sort((a, b) => sortDir === 'desc' ? b.node.size - a.node.size : a.node.size - b.node.size);
    return flat;
  }

  function renderTable() {
    const tbody = $('#contents-body');
    const rows = tableRows().filter(r => !filterText || r.node.name.toLowerCase().includes(filterText) || (r.rel || '').toLowerCase().includes(filterText));
    App.renderMore(pagination, Math.min(visible, rows.length), rows.length, () => { visible += 100; renderTable(); });
    if (!rows.length) {
      tbody.innerHTML = I18n.f('<tr><td colspan="5" style="color:var(--text-3);text-align:center;padding:22px">Eşleşen öğe yok</td></tr>');
      return;
    }
    tbody.innerHTML = rows.slice(0, visible).map(r => {
      const n = r.node, cat = App.catOf(n);
      const nm = listMode === 'flat' ? r.rel : n.name;
      return '<tr data-id="' + n.id + '"' + (selected && selected.id === n.id ? ' class="selected"' : '') + '>' +
        '<td><div class="td-name">' + ic(cat.icon, cat === App.CATS.folder ? 'ico-folder' : '') +
          '<div class="tw"><b>' + esc(nm) + '</b>' + (n.access ? '<span class="sub">' + (n.access === 'Limited' ? I18n.f('Sınırlı erişim') : n.access) + '</span>' : '') + '</div></div></td>' +
        '<td class="num">' + App.fmtBytes(n.size) + '</td>' +
        '<td class="dim">' + cat.label + '</td>' +
        '<td class="num dim">' + (n.kind === 'folder' || n.kind === 'aggregate' ? App.fmtCount(n.files) : '—') + '</td>' +
        '<td class="modified">' + App.fmtDate(n.mod) + '</td>' +
      '</tr>';
    }).join('');
    tbody.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => { const n = findById(tr.dataset.id); if (n) select(n, { fromTable: true }); });
      tr.addEventListener('dblclick', () => { const n = findById(tr.dataset.id); if (n && n.kind === 'folder' && n.children) navigateTo(n); });
    });
  }

  /* ---------- Seçim ---------- */
  function select(node, opts) {
    opts = opts || {};
    selected = node;
    Treemap.markSelected(node.id);
    const tbody = $('#contents-body');
    tbody.querySelectorAll('tr.selected').forEach(tr => tr.classList.remove('selected'));
    const tr = tbody.querySelector('tr[data-id="' + node.id + '"]');
    if (tr) {
      tr.classList.add('selected');
      if (!opts.fromTable) tr.scrollIntoView({ block: 'nearest' });
    }
    if (opts.scrollMap !== false) { /* harita hücresi zaten işaretli */ }
    renderInspector();
  }

  /* ---------- İnceleyici ---------- */
  function renderInspector() {
    if (ds.source === 'empty') {
      App.setInspector('<div class="empty-inspector">' + ic('disk') + I18n.f('<h3>Henüz veri yok</h3><p>Gerçek dosya ve klasör boyutlarını görmek için bir tarama başlatın.</p><button class="btn primary" data-action="scan">Klasör Tara</button></div>'));
      return;
    }
    const node = selected || App.currentViewRoot;
    const cat = App.catOf(node);
    const parent = node.parent;
    const pctParent = parent && parent.size ? node.size / parent.size * 100 : 100;
    const pctScan = App.dataset.root.size ? node.size / App.dataset.root.size * 100 : 100;
    const isFolder = node.kind === 'folder';
    const isAggregate = node.kind === 'aggregate';
    const path = isAggregate && parent ? pathString(parent) : pathString(node);

    let kidsHtml = '';
    if (isFolder && node.children && node.children.length) {
      const top = node.children.slice().sort((a, b) => b.size - a.size).slice(0, 6);
      kidsHtml = I18n.f('<div class="section-label">En Büyük Alt Öğeler</div><div class="children-list">') +
        top.map(c => {
          const cc = App.catOf(c);
          return '<div class="ch-row" data-child="' + c.id + '">' + ic(cc.icon, cc === App.CATS.folder ? 'ico-folder' : '') +
            '<div class="ch-text"><b>' + esc(c.name) + '</b><span>' + cc.label + '</span></div>' +
            '<span class="sz">' + App.fmtBytes(c.size) + '</span></div>';
        }).join('') + '</div>';
    }

    const actionsHtml = isAggregate
      ? I18n.f('<div class="section-label">Bilgi</div><div class="meta-card"><div class="meta-row"><span>Bu satır</span><b>') +
          App.fmtCount(node.files || 0) + I18n.f(' küçük dosyanın toplamıdır</b></div></div>')
      : I18n.f('<div class="section-label">Eylemler</div>') +
        '<div class="actions">' +
          '<button class="btn primary" data-act="quick">' + ic('eye') + (isFolder ? I18n.f('Klasörü Göster') : I18n.f('Dosyayı Aç')) + '</button>' +
          '<button class="btn" data-act="reveal">' + ic('reveal') + I18n.f('Sistemde Göster</button>') +
          '<button class="btn" data-act="zoom" ' + (isFolder && node.children ? '' : 'disabled') + '>' + ic('zoomIn') + I18n.f('Klasöre İnin</button>') +
          '<div class="row2">' +
            '<button class="btn" data-act="open">' + ic('open') + I18n.f('Aç</button>') +
            '<button class="btn" data-act="copy">' + ic('copy') + I18n.f('Yolu Kopyala</button>') +
          '</div>' +
          '<button class="btn" data-act="discard">' + ic('sliders') + I18n.f('Ayıklama Yığınına Ekle</button>') +
        '</div>';

    App.setInspector(
      '<div class="sel-card">' + ic(cat.icon, 'big-ico') +
        '<div><b>' + esc(node.name) + '</b><span>' + esc(path) + '</span></div></div>' +
      I18n.f('<div class="section-label">Temel İstatistikler</div>') +
      '<div class="key-stats">' +
        I18n.f('<div class="kstat"><span>Boyut</span><b>') + App.fmtBytes(node.size) + '</b></div>' +
        I18n.f('<div class="kstat"><span>% Üst</span><b>') + App.fmtPct(pctParent) + '</b></div>' +
        I18n.f('<div class="kstat"><span>% Tarama</span><b>') + App.fmtPct(pctScan) + '</b></div>' +
      '</div>' +
      I18n.f('<div class="section-label">Meta Veriler</div>') +
      '<div class="meta-card">' +
        row(I18n.f('Tür'), isFolder ? I18n.f('Klasör') : cat.label) +
        row(I18n.f('Mantıksal Boyut'), App.fmtBytes(node.size)) +
        row(I18n.f('Üst Klasör'), parent ? esc(parent.name) : '—') +
        row(I18n.f('Değiştirilme'), App.fmtDate(node.mod)) +
        row(I18n.f('Erişim'), node.access === 'Limited' ? I18n.f('Sınırlı') : (node.access || I18n.f('Tam'))) +
      '</div>' +
      actionsHtml + kidsHtml
    );

    $('#insp-body').querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'quick') App.openPath(path);
      else if (a === 'reveal') App.showInFolder(path);
      else if (a === 'zoom') { if (isFolder && node.children) navigateTo(node); }
      else if (a === 'open') App.openPath(path);
      else if (a === 'copy') App.copyText(path);
      else if (a === 'discard') { App.addDiscard({ name: node.name, path, size: node.size }); }
    }));
    $('#insp-body').querySelectorAll('[data-child]').forEach(r => r.addEventListener('click', () => {
      const c = findById(r.dataset.child);
      if (c) select(c);
    }));

    function row(k, v) { return '<div class="meta-row"><span>' + k + '</span><b>' + v + '</b></div>'; }
  }

  /* ---------- İçerik menüsü ---------- */
  function wireToolbar() {
    const btn = $('#contents-toggle');
    const menu = $('#contents-menu');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = btn.getBoundingClientRect();
      menu.style.left = r.left + 'px';
      menu.style.top = (r.bottom + 4) + 'px';
      menu.classList.toggle('show');
    });
    menu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      listMode = b.dataset.mode;
      menu.querySelectorAll('button .check').forEach(c => c.textContent = '');
      b.querySelector('.check').textContent = '✓';
      $('#contents-label').textContent = listMode === 'children' ? I18n.f('Geçerli İçerik') : I18n.f('Tüm Alt Öğeler');
      menu.classList.remove('show');
      renderTable();
    }));
    document.addEventListener('click', () => menu.classList.remove('show'));
    $('#filter-input').addEventListener('input', (e) => { filterText = e.target.value.toLowerCase().trim(); visible = 100; renderTable(); });
    $('#sort-alloc').addEventListener('click', () => { sortDir = sortDir === 'desc' ? 'asc' : 'desc'; $('#sort-arr').textContent = sortDir === 'desc' ? '▼' : '▲'; renderTable(); });
  }

  /* ---------- Görünüm modu ---------- */
  document.addEventListener('app:viewmode', (e) => {
    const mapArea = $('#treemap');
    if (e.detail === 'view-list') mapArea.classList.add('list-only');
    else mapArea.classList.remove('list-only');
    setTimeout(renderMap, 30);
  });
  document.addEventListener('app:location', (e) => {
    const n = resolveLocation(e.detail);
    if (n) navigateTo(n);
  });

  /* ---------- Tümünü çiz ---------- */
  function renderAll() {
    renderHeader();
    renderMap();
    renderTable();
    renderInspector();
    if (selected) select(selected, { scrollMap: false });
  }

  /* ---------- Başlat ---------- */
  $('#btn-back').addEventListener('click', goBack);
  $('#btn-fwd').addEventListener('click', goFwd);
  wireToolbar();

  // Görünür boyut değişince treemap'i yeniden yerleştir
  const ro = new ResizeObserver(() => renderMap());
  ro.observe($('#treemap'));

  renderAll();
  // Resimdeki gibi: varsayılan seçim "Application Support"
  const defSel = (App.currentViewRoot.children || []).find(c => c.name === 'Application Support');
  if (defSel) select(defSel, { scrollMap: false });
});
