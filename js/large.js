/* TaxDisc — Büyük Dosyalar sayfası */
App.whenReady(function () {
  const $ = App.$;
  const MB = Data.MB, GB = Data.GB;
  const ds = App.dataset;

  /* Tüm dosyaları topla */
  const allFiles = Array.isArray(ds.largeFiles)
    ? ds.largeFiles.map(file => ({
        node: { name: file.name, kind: 'file', size: file.size, mod: file.mod },
        path: file.path
      }))
    : [];
  if (!Array.isArray(ds.largeFiles)) {
    (function walk(node, base) {
      for (const c of (node.children || [])) {
        const p = c.path || App.joinPath(base, c.name);
        if (c.kind === 'file') allFiles.push({ node: c, path: p });
        else if (c.kind === 'folder') walk(c, p);
      }
    })(ds.root, App.nodePath(ds.root));
  }
  allFiles.sort((a, b) => b.node.size - a.node.size);

  let minSize = 100 * MB;
  let type = 'all';
  let search = '';
  let selected = null;
  let visible = 100;
  const pagination = document.createElement('div'); pagination.className = 'pagination';
  $('#large-body').closest('.card').after(pagination);
  function parentPath(filePath) {
    const i = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return i > 0 ? filePath.slice(0, i) : filePath;
  }

  const MIN_CHIPS = [
    { label: '10 MB+', v: 10 * MB },
    { label: '100 MB+', v: 100 * MB },
    { label: '500 MB+', v: 500 * MB },
    { label: '1 GB+', v: GB }
  ];
  const TYPE_CHIPS = [
    { key: 'all', label: I18n.f('Tümü') },
    { key: 'video', label: 'Video' },
    { key: 'image', label: I18n.f('Görüntü') },
    { key: 'audio', label: I18n.f('Ses') },
    { key: 'archive', label: I18n.f('Arşiv') },
    { key: 'app', label: I18n.f('Uygulama') },
    { key: 'doc', label: I18n.f('Belge') },
    { key: 'code', label: I18n.f('Kod') },
    { key: 'other', label: I18n.f('Diğer') }
  ];

  function filtered() {
    return allFiles
      .filter(f => f.node.size >= minSize)
      .filter(f => type === 'all' || App.catOf(f.node) === App.CATS[type])
      .filter(f => !search || (f.node.name + ' ' + f.path).toLowerCase().includes(search));
  }

  function renderStats() {
    const list = allFiles.filter(f => f.node.size >= 100 * MB);
    const sum = list.reduce((s, f) => s + f.node.size, 0);
    $('#st-total').textContent = App.fmtBytes(ds.root.size);
    $('#st-count').textContent = App.fmtCount(list.length);
    $('#st-sum').textContent = App.fmtBytes(sum);
    const biggest = allFiles[0];
    $('#st-biggest').textContent = biggest ? biggest.node.name : '—';
  }

  function renderChips() {
    $('#min-chips').innerHTML = MIN_CHIPS.map(c =>
      '<button class="chip' + (c.v === minSize ? ' active' : '') + '" data-min="' + c.v + '">' + c.label + '</button>').join('');
    $('#type-chips').innerHTML = TYPE_CHIPS.map(c =>
      '<button class="chip' + (c.key === type ? ' active' : '') + '" data-type="' + c.key + '">' + c.label + '</button>').join('');
    $('#min-chips').querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { minSize = +b.dataset.min; refresh(); }));
    $('#type-chips').querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; refresh(); }));
  }

  function renderTop(list) {
    const top = list.slice(0, 10);
    Charts.barList($('#top-bars'), top.map(f => ({
      label: f.node.name,
      sub: parentPath(f.path),
      value: f.node.size,
      color: App.catOf(f.node).color
    })), { onRowClick: (_item, index) => { const f = top[index]; if (f) select(f); } });
  }

  function renderTable(list) {
    const tbody = $('#large-body');
    App.renderMore(pagination, Math.min(visible, list.length), list.length, () => { visible += 100; renderTable(list); });
    if (!list.length) {
      tbody.innerHTML = I18n.f('<tr><td colspan="5" style="color:var(--text-3);text-align:center;padding:22px">Bu filtrelerle büyük dosya bulunamadı</td></tr>');
      return;
    }
    tbody.innerHTML = list.slice(0, visible).map(f => {
      const n = f.node, cat = App.catOf(n);
      const folder = parentPath(f.path);
      return '<tr data-path="' + esc(f.path) + '"' + (selected && selected.path === f.path ? ' class="selected"' : '') + '>' +
        '<td><div class="td-name">' + ic(cat.icon) + '<div class="tw"><b>' + esc(n.name) + '</b><span class="sub">' + esc(folder) + '</span></div></div></td>' +
        '<td class="dim">' + cat.label + '</td>' +
        '<td class="num">' + App.fmtBytes(n.size) + '</td>' +
        '<td class="modified">' + App.fmtDate(n.mod) + '</td>' +
        '<td class="dim" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">' + esc(folder.split(/[\\/]/).pop() || folder) + '</td>' +
      '</tr>';
    }).join('');
    tbody.querySelectorAll('tr[data-path]').forEach(tr => tr.addEventListener('click', () => {
      const f = list.find(x => x.path === tr.dataset.path);
      if (f) select(f);
    }));
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function select(f, scrollIntoView = true) {
    selected = f;
    document.querySelectorAll('#large-body tr.selected').forEach(tr => tr.classList.remove('selected'));
    const tr = document.querySelector('#large-body tr[data-path="' + CSS.escape(f.path) + '"]');
    if (tr) {
      tr.classList.add('selected');
      if (scrollIntoView) tr.scrollIntoView({ block: 'nearest' });
    }
    renderInspector(f);
  }

  function renderInspector(f) {
    const n = f.node, cat = App.catOf(n);
    const pctDisk = ds.root.size ? n.size / ds.root.size * 100 : 0;
    App.setInspector(
      '<div class="sel-card">' + ic(cat.icon, 'big-ico') +
        '<div><b>' + esc(n.name) + '</b><span>' + esc(f.path) + '</span></div></div>' +
      I18n.f('<div class="section-label">Temel İstatistikler</div>') +
      '<div class="key-stats">' +
        I18n.f('<div class="kstat"><span>Boyut</span><b>') + App.fmtBytes(n.size) + '</b></div>' +
        I18n.f('<div class="kstat"><span>Disk Payı</span><b>') + App.fmtPct(pctDisk) + '</b></div>' +
        I18n.f('<div class="kstat"><span>Kategori</span><b style="font-size:13px">') + cat.label + '</b></div>' +
      '</div>' +
      I18n.f('<div class="section-label">Meta Veriler</div>') +
      '<div class="meta-card">' +
        I18n.f('<div class="meta-row"><span>Tür</span><b>') + cat.label + '</b></div>' +
        I18n.f('<div class="meta-row"><span>Uzantı</span><b>.') + esc(App.extOf(n.name) || I18n.f('yok')) + '</b></div>' +
        I18n.f('<div class="meta-row"><span>Klasör</span><b>') + esc(parentPath(f.path)) + '</b></div>' +
        I18n.f('<div class="meta-row"><span>Değiştirilme</span><b>') + App.fmtDate(n.mod) + '</b></div>' +
      '</div>' +
      I18n.f('<div class="section-label">Eylemler</div>') +
      '<div class="actions">' +
        '<button class="btn primary" data-act="quick">' + ic('eye') + I18n.f('Dosyayı Aç</button>') +
        '<button class="btn" data-act="reveal">' + ic('reveal') + I18n.f('Klasörü Göster</button>') +
        '<div class="row2">' +
          '<button class="btn" data-act="open">' + ic('open') + I18n.f('Aç</button>') +
          '<button class="btn" data-act="copy">' + ic('copy') + I18n.f('Yolu Kopyala</button>') +
        '</div>' +
        '<button class="btn" data-act="discard">' + ic('sliders') + I18n.f('Ayıklama Yığınına Ekle</button>') +
      '</div>'
    );
    $('#insp-body').querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'quick') App.openPath(f.path);
      else if (a === 'reveal') App.showInFolder(f.path);
      else if (a === 'open') App.openPath(f.path);
      else if (a === 'copy') App.copyText(f.path);
      else if (a === 'discard') { App.addDiscard({ name: n.name, path: f.path, size: n.size }); }
    }));
  }

  function refresh() {
    renderChips();
    const list = filtered();
    renderTop(list);
    renderTable(list);
    $('#large-count').textContent = list.length ? App.fmtCount(list.length) + I18n.f(' dosya listeleniyor') : I18n.f('sonuç yok');
  }

  /* Başlat */
  $('#search-input').addEventListener('input', e => { search = e.target.value.toLowerCase().trim(); visible = 100; refresh(); });
  App.setActiveLoc && App.setActiveLoc('scan');
  renderStats();
  refresh();
  const first = filtered()[0];
  if (first) select(first, false);
});
