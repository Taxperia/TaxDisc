/* TaxDisc — ortak kabuk, durum, biçimlendiriciler */
(function () {
  const App = window.App = {};
  if (window.taxdiscDesktop) document.body.classList.add('desktop-app');
  document.body.classList.add('app-loading');
  const pageLoader = document.createElement('div');
  pageLoader.className = 'page-loader';
  pageLoader.innerHTML = I18n.f('<div class="loader-mark">T</div><div class="loader-copy"><b>TaxDisc hazırlanıyor</b><span>Tarama verileri yükleniyor…</span></div><div class="loader-spinner"></div>');
  document.body.appendChild(pageLoader);

  App.showPageLoader = function (message) {
    pageLoader.hidden = false;
    const label = pageLoader.querySelector('.loader-copy span');
    if (label && message) label.textContent = message;
    document.body.classList.add('app-loading');
    document.body.classList.remove('app-ready');
  };
  App.finishPageLoad = function () {
    if (pageLoader.classList.contains('failed')) return;
    pageLoader.hidden = true;
    document.body.classList.remove('app-loading');
    document.body.classList.add('app-ready');
  };
  App.failPageLoad = function (error) {
    pageLoader.hidden = false;
    document.body.classList.add('app-loading');
    document.body.classList.remove('app-ready');
    const title = pageLoader.querySelector('.loader-copy b');
    const label = pageLoader.querySelector('.loader-copy span');
    if (title) title.textContent = I18n.f('Sayfa hazırlanamadı');
    if (label) label.textContent = error && error.message ? error.message : I18n.f('Bilinmeyen hata');
    pageLoader.classList.add('failed');
    if (!pageLoader.querySelector('button')) {
      const retry = document.createElement('button'); retry.className = 'btn'; retry.textContent = I18n.f('Yeniden Dene');
      retry.addEventListener('click', () => location.reload()); pageLoader.appendChild(retry);
    }
  };

  let resolveReady;
  App.ready = new Promise(resolve => { resolveReady = resolve; });
  App.whenReady = function (callback) {
    return App.ready.then(callback).catch(error => {
      console.error(error);
      App.failPageLoad(error);
    });
  };
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  App.$ = $; App.$$ = $$;
  const escapeHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.escapeHtml = escapeHtml;
  const MB = Data.MB, GB = Data.GB;

  /* ---------- Biçimlendiriciler (tr-TR) ---------- */
  function fmtBytes(b) {
    if (b == null || isNaN(b)) return '—';
    const abs = Math.abs(b);
    if (abs >= GB) {
      const v = b / GB;
      const d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
      return v.toLocaleString(I18n.locale, { maximumFractionDigits: d, minimumFractionDigits: 0 }) + ' GB';
    }
    if (abs >= MB) {
      const v = b / MB;
      return v.toLocaleString(I18n.locale, { maximumFractionDigits: v >= 100 ? 0 : 1 }) + ' MB';
    }
    if (abs >= 1024) return Math.round(b / 1024).toLocaleString(I18n.locale) + ' KB';
    return b.toLocaleString(I18n.locale) + ' B';
  }
  function fmtCount(n) { return (n || 0).toLocaleString(I18n.locale); }
  function fmtPct(p) { const value = (p || 0).toLocaleString(I18n.locale, { maximumFractionDigits: 1 }); return I18n.language === 'tr' ? '%' + value : value + '%'; }
  function fmtDate(t) {
    if (!t) return '—';
    return new Intl.DateTimeFormat(I18n.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(t));
  }
  const CATS = {
    aggregate:{ label: I18n.f('Toplu Öğe'),   icon: 'circleDashed', color: '#7f8490' },
    folder:  { label: I18n.f('Klasör'),      icon: 'folderFill', color: '#4da3ff' },
    video:   { label: 'Video',       icon: 'video',      color: '#ff6482' },
    audio:   { label: I18n.f('Ses'),         icon: 'audio',      color: '#ff6ea7' },
    image:   { label: I18n.f('Görüntü'),     icon: 'image',      color: '#b78aff' },
    archive: { label: I18n.f('Arşiv'),       icon: 'archive',    color: '#ffa14f' },
    app:     { label: I18n.f('Uygulama'),    icon: 'disc',       color: '#4fc3d9' },
    doc:     { label: I18n.f('Belge'),       icon: 'doc',        color: '#6fa8ff' },
    code:    { label: I18n.f('Kod'),         icon: 'code',       color: '#ffd60a' },
    other:   { label: I18n.f('Dosya'),       icon: 'doc',        color: '#9a9ca3' }
  };
  function extOf(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i + 1).toLowerCase() : ''; }
  function catOf(node) {
    if (node.kind === 'folder') return CATS.folder;
    if (node.kind === 'aggregate') return CATS.aggregate;
    const e = extOf(node.name);
    if (['mp4', 'mov', 'mkv', 'avi', 'm4v', 'webm'].includes(e)) return CATS.video;
    if (['mp3', 'aiff', 'wav', 'flac', 'm4a', 'aac', 'logicx'].includes(e)) return CATS.audio;
    if (['png', 'jpg', 'jpeg', 'gif', 'heic', 'tiff', 'psd', 'ai', 'raw'].includes(e)) return CATS.image;
    if (['zip', 'tar', 'gz', 'rar', '7z', 'tgz'].includes(e)) return CATS.archive;
    if (['exe', 'msi', 'msix', 'appx', 'dmg', 'iso', 'pkg'].includes(e)) return CATS.app;
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'numbers', 'pages', 'key', 'txt', 'md', 'csv', 'dwg', 'numbers'].includes(e)) return CATS.doc;
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 'java', 'c', 'cpp', 'cs', 'swift', 'go', 'rs', 'sh', 'ps1'].includes(e)) return CATS.code;
    return CATS.other;
  }
  App.fmtBytes = fmtBytes; App.fmtCount = fmtCount; App.fmtPct = fmtPct; App.fmtDate = fmtDate;
  App.catOf = catOf; App.CATS = CATS; App.extOf = extOf;

  /* ---------- Durum ---------- */
  async function loadDataset() {
    if (window.taxdiscDesktop) {
      try {
        const ds = await window.taxdiscDesktop.getInitialDataset();
        if (ds && ds.root) { prepareDataset(ds); return ds; }
      } catch (e) { /* bozuk/eksik kayıt → boş durum */ }
      return Data.emptyDataset();
    }
    try {
      const raw = sessionStorage.getItem('taxdisc.dataset.v1');
      if (raw) { const ds = JSON.parse(raw); Data.assignIds(ds.root); return ds; }
    } catch (e) { /* kota aşımı vb. → demo */ }
    return Data.demoDataset();
  }
  App.loadDataset = loadDataset;
  function prepareDataset(ds) {
    if (ds.source === 'empty') ds.root.name = I18n.t('Henüz tarama yapılmadı');
    const stack = [ds.root];
    while (stack.length) {
      const node = stack.pop();
      if (node.kind === 'aggregate' && node.virtual) node.name = I18n.t('Diğer küçük öğeler');
      for (const child of node.children || []) stack.push(child);
    }
    Data.assignIds(ds.root);
  }
  App.dataset = Data.emptyDataset();
  App.storeDataset = function (ds) {
    App.dataset = ds;
    if (window.taxdiscDesktop) return;
    try { sessionStorage.setItem('taxdisc.dataset.v1', JSON.stringify(ds)); }
    catch (e) { App.toast(I18n.f('Veri çok büyük: diğer sayfalarda demo veri gösterilecek'), 'info'); }
  };

  App.discard = [];
  let planQueue = Promise.resolve();
  function normalizedPath(value) { return String(value).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase(); }
  let planPaths = new Set();
  function indexPlan() { planPaths = new Set(App.discard.map(item => normalizedPath(item.path))); }
  App.isPlanned = target => {
    let current = normalizedPath(target);
    while (true) {
      if (planPaths.has(current)) return true;
      const slash = current.lastIndexOf('/');
      if (slash < 0) return false;
      current = current.slice(0, slash);
    }
  };
  function commitPlan(change) {
    App.planSaving = true;
    const operation = planQueue.then(async () => {
      const items = change(App.discard.slice());
      if (window.taxdiscDesktop) App.discard = await window.taxdiscDesktop.savePlan(items);
      else {
        localStorage.setItem('taxdisc.plan', JSON.stringify({ scannedAt: App.dataset.scannedAt, items }));
        App.discard = items;
      }
      indexPlan();
      updateDiscardUI();
      document.dispatchEvent(new CustomEvent('app:plan'));
      return true;
    }).catch(error => { App.toast(I18n.f('Liste kaydedilemedi: ') + error.message, 'warning'); return false; });
    planQueue = operation;
    operation.finally(() => { if (planQueue === operation) App.planSaving = false; });
    return operation;
  }
  App.addDiscards = function (items) {
    return commitPlan(existing => {
      const byPath = new Map();
      for (const item of existing.concat(items)) {
        const key = normalizedPath(item.path);
        if (!byPath.has(key)) byPath.set(key, { name: item.name, path: item.path, size: item.size });
      }
      return Array.from(byPath.entries()).filter(([key]) => {
        let slash;
        while ((slash = key.lastIndexOf('/')) >= 0) {
          key = key.slice(0, slash);
          if (byPath.has(key)) return false;
        }
        return true;
      }).map(([, item]) => item);
    }).then(saved => { if (saved) App.toast(I18n.f('Ayıklama listesi kaydedildi. Diskteki dosyalar değişmedi.'), 'check'); return saved; });
  };
  App.addDiscard = item => App.addDiscards([item]);
  App.removeDiscard = target => commitPlan(items => items.filter(item => item.path !== target));
  App.clearDiscard = () => commitPlan(() => []);
  App.downloadCsv = function (rows, filename) {
    const blob = new Blob([TaxDiscCSV.serialize(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  App.renderMore = function (element, shown, total, onMore) {
    element.innerHTML = '<span>' + fmtCount(shown) + ' / ' + I18n.count(total, 'result') + '</span>';
    if (shown < total) {
      const button = document.createElement('button'); button.className = 'btn'; button.textContent = I18n.f('Daha Fazla Göster');
      button.addEventListener('click', onMore); element.appendChild(button);
    }
  };

  /* ---------- Bildirim balonu ---------- */
  App.toast = function (msg, iconName) {
    let wrap = $('#toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = ic(iconName || 'spark');
    const label = document.createElement('span');
    label.textContent = msg;
    t.appendChild(label);
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, 2800);
  };

  /* ---------- Pano ---------- */
  App.copyText = function (txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => App.toast(I18n.f('Yol kopyalandı'), 'check'), () => fallbackCopy(txt));
    } else fallbackCopy(txt);
  };
  function fallbackCopy(txt) {
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); App.toast(I18n.f('Yol kopyalandı'), 'check'); } catch (e) { App.toast(I18n.f('Kopyalanamadı'), 'xmark'); }
    ta.remove();
  }

  App.nodePath = function (node) {
    if (!node) return '';
    if (node.path) return node.path;
    const parts = [];
    let cur = node;
    while (cur && !cur.path) {
      if (cur.parent) parts.unshift(cur.name);
      cur = cur.parent;
    }
    if (cur && cur.path) return App.joinPath(cur.path, parts);
    return '/' + parts.join('/');
  };
  App.joinPath = function (base, names) {
    const parts = Array.isArray(names) ? names : [names];
    if (!parts.length) return base;
    const sep = String(base).includes('\\') ? '\\' : '/';
    const cleanBase = String(base).replace(/[\\\/]+$/, '');
    return cleanBase + sep + parts.join(sep);
  };
  App.showInFolder = async function (targetPath) {
    if (!window.taxdiscDesktop || !targetPath) { App.toast(I18n.f('Bu işlem yalnızca masaüstü uygulamasında kullanılabilir'), 'info'); return; }
    try {
      const error = await window.taxdiscDesktop.showInFolder(targetPath);
      if (error) throw new Error(error);
    } catch (e) { App.toast(e.message || I18n.f('Konum gösterilemedi'), 'warning'); }
  };
  App.openPath = async function (targetPath) {
    if (!window.taxdiscDesktop || !targetPath) { App.toast(I18n.f('Bu işlem yalnızca masaüstü uygulamasında kullanılabilir'), 'info'); return; }
    try {
      const error = await window.taxdiscDesktop.openPath(targetPath);
      if (error) throw new Error(error);
    } catch (e) { App.toast(e.message || I18n.f('Öğe açılamadı'), 'warning'); }
  };

  /* ---------- Kabuk: kenar çubuğu ---------- */
  const LOCATIONS = [
    { key: 'scan', icon: 'disk', title: App.dataset.source === 'empty' ? I18n.f('Tarama Bekleniyor') : App.dataset.root.name,
      sub: App.dataset.scanRoot || I18n.f('Bir klasör veya sürücü seçin'), path: [] }
  ];
  const TOOLS = [
    { page: 'map', href: 'index.html', icon: 'mapIcon', title: I18n.f('Disk Haritası'), sub: I18n.f('Etkileşimli alan görünümü') },
    { page: 'large', href: 'buyuk-dosyalar.html', icon: 'bigFile', title: I18n.f('Büyük Dosyalar'), sub: I18n.f('Boyuta göre listeleme') },
    { page: 'dupes', href: 'yinelenenler.html', icon: 'duplicates', title: I18n.f('Olası Yinelenenler'), sub: I18n.f('Ad ve boyut karşılaştırması') },
    { page: 'temp', href: 'gecici-dosyalar.html', icon: 'timer', title: I18n.f('Geçici Dosyalar'), sub: I18n.f('Önbellek ve log analizi') },
    { page: 'reports', href: 'raporlar.html', icon: 'chartLine', title: I18n.f('Raporlar'), sub: I18n.f('Klasör depolama raporları') }
  ];
  App.LOCATIONS = LOCATIONS;

  function buildSidebar() {
    const page = document.body.dataset.page;
    const side = $('#sidebar');
    if (!side) return;
    const locItems = LOCATIONS.map(l =>
      '<a class="loc-item" data-loc="' + l.key + '" href="index.html#loc=' + l.key + '">' +
        ic(l.icon) + '<div class="li-text"><b>' + escapeHtml(l.title) + '</b><span id="loc-sub-' + l.key + '">' + escapeHtml(l.sub) + '</span></div></a>'
    ).join('');
    const toolItems = TOOLS.map(t =>
      '<a class="loc-item tools' + (t.page === page ? ' active' : '') + '" href="' + t.href + '" data-page-item="' + t.page + '">' +
        ic(t.icon) + '<div class="li-text"><b>' + t.title + '</b><span>' + t.sub + '</span></div></a>'
    ).join('');
    side.innerHTML =
      '<div class="sidebar-head">' +
        '<div class="brand-mark">T</div>' +
        I18n.f('<button class="icon-btn" data-action="toggle-sidebar" title="Kenar çubuğunu gizle/göster">') + ic('sidebar') + '</button>' +
      '</div>' +
      '<div class="sidebar-scroll">' +
        '<button class="scan-primary" data-action="scan">' + ic('folderPlus') + I18n.f('<span><b>Klasör Tara</b><small>Gerçek disk analizi başlat</small></span></button>') +
        I18n.f('<div class="side-section">Taranan Konum</div>') +
        '<nav class="loc-list">' + locItems + '</nav>' +
        I18n.f('<div class="side-section">Araçlar</div>') +
        '<nav class="loc-list">' + toolItems + '</nav>' +
      '</div>' +
      '<div class="side-footer">' +
        '<label class="language-control"><span>Language / Dil</span><select id="language-select" aria-label="Language / Dil"><option value="en">English</option><option value="tr">Türkçe</option></select></label>' +
        '<a class="loc-item' + (page === 'discard' ? ' active' : '') + I18n.f('" href="ayiklama.html" data-page-item="discard" title="Ayıklama Yığını">') + ic('sliders') +
          I18n.f('<div class="li-text"><b>Ayıklama Yığını</b><span id="discard-sub">İşaretlenmiş öğe yok</span></div></a>') +
        I18n.f('<button class="btn privacy-clear" data-action="clear-data">Tarama Kaydını Temizle</button>') +
      '</div>';
    const language = $('#language-select'); language.value = I18n.language;
    language.addEventListener('change', () => {
      if (App.scanning || App.planSaving) { language.value = I18n.language; App.toast(I18n.f('Önce devam eden işlemi tamamlayın.'), 'info'); return; }
      I18n.setLanguage(language.value); location.reload();
    });
    $$('.loc-item[data-loc]', side).forEach(el => {
      el.addEventListener('click', (e) => {
        if (page === 'map') {
          e.preventDefault();
          const key = el.dataset.loc;
          setActiveLoc(key);
          document.dispatchEvent(new CustomEvent('app:location', { detail: key }));
        }
      });
    });
    updateDiscardUI();
    updateRootSub();
  }
  function setActiveLoc(key) {
    $$('.loc-item[data-loc]').forEach(el => el.classList.toggle('active', el.dataset.loc === key));
  }
  App.setActiveLoc = setActiveLoc;
  function updateRootSub() {
    const ds = App.dataset;
    if (ds.source === 'scan' || ds.source === 'desktop') {
      const el = $('#loc-sub-scan');
      if (el) el.textContent = ds.scanRoot || ds.root.name;
    }
  }
  function updateDiscardUI() {
    const el = $('#discard-sub');
    if (!el) return;
    if (!App.discard.length) { el.textContent = I18n.f('İşaretlenmiş öğe yok'); return; }
    const sum = App.discard.reduce((s, i) => s + (i.size || 0), 0);
    el.textContent = I18n.count(App.discard.length, 'item') + ' · ' + fmtBytes(sum);
  }
  App.updateDiscardUI = updateDiscardUI;

  /* ---------- Kabuk: inceleyici başlığı ---------- */
  function buildInspectorHead() {
    const insp = $('#inspector');
    if (!insp) return;
    insp.innerHTML =
      '<div class="insp-head">' +
        '<div class="insp-actions">' +
          I18n.f('<button class="icon-btn" data-action="scan" title="Klasör Tara">') + ic('folderPlus') + '</button>' +
          I18n.f('<button class="icon-btn" data-action="rescan" title="Yeniden Tara">') + ic('refresh') + '</button>' +
          I18n.f('<button class="icon-btn" data-action="toggle-inspector" title="İnceleyiciyi Gizle/Göster">') + ic('columns') + '</button>' +
        '</div>' +
        '<div class="seg">' +
          '<button class="seg-btn' + (document.body.dataset.page === 'map' ? ' active' : '') + I18n.f('" data-action="view-map" title="Harita ve Liste">') + ic('pie') + '</button>' +
          I18n.f('<button class="seg-btn" data-action="view-list" title="Yalnızca Liste">') + ic('tableGrid') + '</button>' +
        '</div>' +
        I18n.f('<button class="icon-btn push-right" data-action="toggle-sidebar" title="Kenar Çubuğu">') + ic('sidebar') + '</button>' +
      '</div>' +
      '<div class="insp-body" id="insp-body"></div>';
  }
  App.setInspector = function (html) {
    const body = $('#insp-body');
    if (body) body.innerHTML = html;
  };

  /* ---------- Genel eylemler ---------- */
  function wireGlobal() {
    document.addEventListener('click', (e) => {
      if ((App.scanning || App.planSaving) && e.target.closest('a[href]')) {
        e.preventDefault(); e.stopImmediatePropagation();
        App.toast(App.scanning ? I18n.f('Önce taramayı tamamlayın veya iptal edin.') : I18n.f('Liste kaydediliyor, lütfen bekleyin.'), 'info');
        return;
      }
      const link = e.target.closest('a[data-page-item]');
      if (link && !e.defaultPrevented && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        App.showPageLoader(I18n.f('Yeni sayfa hazırlanıyor…'));
      }
    }, true);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const a = btn.dataset.action;
      if (a === 'toggle-sidebar') {
        const w = $('#window'), s = $('#sidebar');
        s.classList.toggle('hidden');
        w.classList.toggle('no-side', s.classList.contains('hidden'));
      } else if (a === 'toggle-inspector') {
        const w = $('#window'), p = $('#inspector');
        p.classList.toggle('hidden');
        w.classList.toggle('no-insp', p.classList.contains('hidden'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
      } else if (a === 'scan' || a === 'rescan') {
        App.startScan();
      } else if (a === 'cancel-scan') {
        if (window.taxdiscDesktop) window.taxdiscDesktop.cancelScan().then(cancelled => {
          if (!cancelled) App.toast(I18n.f('Sonuçlar kaydediliyor, lütfen bekleyin.'), 'info');
        }).catch(error => App.toast(error.message, 'warning'));
      } else if (a === 'clear-data') {
        App.clearData();
      } else if (a === 'view-map' || a === 'view-list') {
        if (document.body.dataset.page !== 'map') { App.toast(I18n.f('Bu görünüm yalnızca Disk Haritası sayfasında geçerli'), 'info'); return; }
        document.dispatchEvent(new CustomEvent('app:viewmode', { detail: a }));
        $$('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { $$('.menu.show').forEach(m => m.classList.remove('show')); }
    });
  }

  /* ---------- Tarama (File System Access API) ---------- */
  App.startScan = async function () {
    if (App.scanning || App.planSaving) { App.toast(I18n.f('Devam eden işlem tamamlanana kadar bekleyin.'), 'info'); return; }
    App.scanning = true;
    $$('[data-action="scan"], [data-action="rescan"]').forEach(button => { button.disabled = true; });
    if (window.taxdiscDesktop) {
      let stopProgress = null;
      try {
        App.progress(I18n.f('Klasör seçiliyor…'));
        stopProgress = window.taxdiscDesktop.onScanProgress(p => {
          App.progress(I18n.f('Taranıyor: ') + fmtCount(p.files) + I18n.f(' dosya · ') + fmtBytes(p.bytes) + ' · ' + (p.currentPath || ''));
        });
        const ds = await window.taxdiscDesktop.scanFolder();
        if (!ds) { App.hideProgress(); return; }
        if (ds.cancelled) { App.hideProgress(); App.toast(I18n.f('Tarama iptal edildi. Önceki tarama korundu.'), 'info'); return; }
        App.storeDataset(ds);
        App.progress(I18n.f('Tarama tamamlandı: ') + fmtCount(ds.root.files) + I18n.f(' dosya · ') + fmtBytes(ds.root.size));
        location.href = 'index.html';
      } catch (err) {
        App.hideProgress();
        App.toast(I18n.f('Tarama başarısız: ') + (err && err.message ? err.message : I18n.f('bilinmeyen hata')), 'warning');
      } finally {
        if (stopProgress) stopProgress();
        App.scanning = false;
        $$('[data-action="scan"], [data-action="rescan"]').forEach(button => { button.disabled = false; });
      }
      return;
    }
    if (!window.showDirectoryPicker) {
      App.scanning = false;
      $$('[data-action="scan"], [data-action="rescan"]').forEach(button => { button.disabled = false; });
      App.toast(I18n.f('Bu tarayıcı klasör taramayı desteklemiyor. Chrome veya Edge kullanın ya da demo veriyle devam edin.'), 'warning');
      return;
    }
    App.progress(I18n.f('Klasör seçiliyor…'));
    try {
      const ds = await Scanner.scan();
      App.storeDataset(ds);
      App.toast(I18n.f('Tarama tamamlandı: ') + fmtCount(ds.root.files) + I18n.f(' dosya · ') + fmtBytes(ds.root.size), 'check');
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      App.hideProgress();
      if (err && err.name === 'AbortError') return;
      App.toast(I18n.f('Tarama başarısız: ') + (err && err.message ? err.message : I18n.f('bilinmeyen hata')), 'warning');
    } finally {
      App.scanning = false;
      $$('[data-action="scan"], [data-action="rescan"]').forEach(button => { button.disabled = false; });
    }
  };
  App.clearData = async function () {
    if (App.scanning || App.planSaving) { App.toast(I18n.f('Önce devam eden işlemi tamamlayın.'), 'info'); return; }
    if (!confirm(I18n.f('Son tarama kaydı ve ayıklama listesi bu uygulamadan kaldırılacak. Diskteki dosyalarınız değişmez. Devam edilsin mi?'))) return;
    try {
      if (window.taxdiscDesktop) {
        const result = await window.taxdiscDesktop.clearDataset();
        if (result.cleanupWarning) sessionStorage.setItem('taxdisc.notice', I18n.language === 'tr' ? 'Kayıt temizlendi ancak bazı profil dosyaları kaldırılamadı. Profil klasörünün yazma izinlerini kontrol edin.' : 'The scan was cleared, but some profile files could not be removed. Check profile folder permissions.');
      }
      else { sessionStorage.removeItem('taxdisc.dataset.v1'); localStorage.removeItem('taxdisc.plan'); }
      location.href = 'index.html';
    } catch (error) { App.toast(I18n.f('Kayıt temizlenemedi: ') + error.message, 'warning'); }
  };

  App.progress = function (text) {
    let n = $('#global-notice');
    if (!n) {
      n = document.createElement('div');
      n.id = 'global-notice';
      n.className = 'notice';
      n.style.position = 'fixed';
      n.style.left = '50%'; n.style.bottom = '20px'; n.style.transform = 'translateX(-50%)';
      n.style.borderRadius = '10px'; n.style.border = '1px solid var(--hairline)';
      n.style.background = '#2c2d32'; n.style.boxShadow = '0 14px 40px rgba(0,0,0,.5)';
      n.style.zIndex = '1100'; n.style.maxWidth = '620px';
      document.body.appendChild(n);
    }
    n.innerHTML = ic('refresh') + '<div class="n-text"><b></b></div>';
    n.querySelector('b').textContent = text;
    n.setAttribute('role', 'status');
    if (window.taxdiscDesktop && text.startsWith(I18n.f('Taranıyor'))) {
      const cancel = document.createElement('button');
      cancel.className = 'btn'; cancel.dataset.action = 'cancel-scan'; cancel.textContent = I18n.f('İptal Et');
      n.appendChild(cancel);
    }
    n.style.display = 'flex';
  };
  App.hideProgress = function () { const n = $('#global-notice'); if (n) n.style.display = 'none'; };

  /* ---------- Başlat ---------- */
  (async function initialize() {
    try {
      if (window.taxdiscDesktop) await window.taxdiscDesktop.setLanguage(I18n.language);
      App.dataset = await loadDataset();
      if (window.taxdiscDesktop) App.discard = await window.taxdiscDesktop.getPlan();
      else {
        try {
          const saved = JSON.parse(localStorage.getItem('taxdisc.plan') || 'null');
          if (saved && saved.scannedAt === App.dataset.scannedAt && Array.isArray(saved.items)) App.discard = saved.items;
        } catch (_) { /* A corrupt review list must not stop the app. */ }
      }
      indexPlan();
      const rootLocation = LOCATIONS[0];
      rootLocation.title = App.dataset.source === 'empty' ? I18n.f('Tarama Bekleniyor') : App.dataset.root.name;
      rootLocation.sub = App.dataset.scanRoot || I18n.f('Bir klasör veya sürücü seçin');
      buildSidebar();
      buildInspectorHead();
      wireGlobal();
      const notice = sessionStorage.getItem('taxdisc.notice');
      if (notice) { sessionStorage.removeItem('taxdisc.notice'); App.toast(notice, 'warning'); }
      if (App.dataset.source === 'empty' && document.body.dataset.page !== 'map') {
        const banner = document.createElement('div'); banner.className = 'notice in-list';
        banner.innerHTML = I18n.f('<div class="n-text"><b>Henüz kullanılabilir tarama yok.</b><div class="path">Gerçek sonuçları görmek için bir klasör veya sürücü seçin.</div></div><button class="btn primary" data-action="scan">Klasör Tara</button>');
        const body = $('.page-body'); if (body) body.prepend(banner);
        $$('button#btn-export, button#btn-print').forEach(button => { button.disabled = true; });
      }

  // Gerçek tarama sonrası konum etkinliği
      if (App.dataset.source !== 'empty') setActiveLoc('scan');
      resolveReady(App.dataset);
    } catch (error) {
      App.failPageLoad(error);
    }
  })();
})();
