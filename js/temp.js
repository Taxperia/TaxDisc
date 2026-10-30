App.whenReady(function () {
  const $ = App.$, esc = App.escapeHtml, ds = App.dataset;
  const cats = structuredClone(ds.source === 'demo' ? Data.DEMO_TEMP : (ds.tempCategories || []));
  cats.forEach(cat => { if (cat.risk === 'safe') cat.risk = 'caution'; });
  let riskFilter = 'all', selected = null;
  const labels = { caution: I18n.f('İnceleyin'), risk: I18n.f('Dikkatli İnceleyin') };
  const catSize = cat => cat.items.reduce((sum, item) => sum + item.size, 0);
  const pending = cat => cat.items.filter(item => !App.isPlanned(item.path));
  const filtered = () => cats.filter(cat => riskFilter === 'all' || cat.risk === riskFilter);
  function render() {
    const total = cats.reduce((sum, cat) => sum + catSize(cat), 0);
    $('#t-total').textContent = App.fmtBytes(total);
    $('#t-pct').textContent = App.fmtPct(ds.root.size ? total / ds.root.size * 100 : 0);
    $('#t-risky').textContent = App.fmtBytes(cats.filter(cat => cat.risk === 'risk').reduce((sum, cat) => sum + catSize(cat), 0));
    $('#t-cleaned').textContent = App.fmtBytes(cats.reduce((sum, cat) => sum + cat.items.filter(item => App.isPlanned(item.path)).reduce((bytes, item) => bytes + item.size, 0), 0));
    const segments = cats.map(cat => ({ label: I18n.t(cat.name), value: catSize(cat), color: cat.color }));
    Charts.donut($('#temp-donut'), segments.length ? segments : [{ value: 1, color: '#333' }], { title: App.fmtBytes(total), sub: I18n.f('inceleme adayı') }, 26);
    $('#donut-legend').innerHTML = segments.map(seg => '<div class="lg-row"><span class="dot" style="background:' + seg.color + '"></span><span class="lg-name">' + esc(seg.label) + '</span><span class="lg-val">' + App.fmtBytes(seg.value) + '</span></div>').join('');
    $('#temp-cats').innerHTML = filtered().map(cat => {
      const id = cats.indexOf(cat), done = !pending(cat).length;
      return '<div class="temp-cat' + (done ? ' done' : '') + '"><div class="tc-head" data-cat="' + id + '"><span class="ico">' + ic(cat.icon) + '</span><div class="tc-t"><b>' + esc(I18n.t(cat.name)) + '</b><span>' + I18n.count(cat.items.length, 'item') + '</span></div><div class="tc-size"><b>' + App.fmtBytes(catSize(cat)) + '</b></div><span class="badge ' + cat.risk + '">' + labels[cat.risk] + '</span></div><div class="tc-items">' +
        cat.items.slice(0, 5).map(item => '<div class="tc-item"><span class="p">' + esc(item.path) + '</span><span class="s">' + App.fmtBytes(item.size) + '</span></div>').join('') +
        (cat.items.length > 5 ? '<div class="tc-item">+' + App.fmtCount(cat.items.length - 5) + I18n.f(' öğe · tümü CSV listesine aktarılabilir</div>') : '') +
        '</div><div class="tc-foot"><button class="btn" data-add="' + id + '" ' + (done ? 'disabled' : '') + '>' + (done ? I18n.f('Listede') : I18n.f('Kategori Öğelerini Listeye Ekle')) + '</button></div></div>';
    }).join('') || I18n.f('<div class="card empty-message">Bu filtrede inceleme adayı bulunamadı. Sınıflandırma yalnızca tanımlı klasör adlarını ve geçici dosya uzantılarını kapsar.</div>');
    $('#temp-cats').querySelectorAll('[data-cat]').forEach(head => head.addEventListener('click', () => { selected = cats[+head.dataset.cat]; renderInspector(); }));
    $('#temp-cats').querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', async () => { button.disabled = true; await App.addDiscards(pending(cats[+button.dataset.add])); render(); }));
    $('#clean-all').disabled = !filtered().some(cat => pending(cat).length);
    renderInspector();
  }
  function renderInspector() {
    App.setInspector('<div class="sel-card">' + ic(selected ? selected.icon : 'timer', 'big-ico') + '<div><b>' + esc(selected ? I18n.t(selected.name) : I18n.f('İnceleme Adayları')) + I18n.f('</b><span>Dosyalar otomatik silinmez</span></div></div><div class="meta-card"><p>Klasör adı veya dosya uzantısı silme güvenliğini kanıtlamaz. Önbellekler oturum ve çevrimdışı veriler içerebilir; çöp kutusunda geri almak istediğiniz dosyalar bulunabilir.</p><p>Gösterilen boyut tarama anındaki mantıksal boyuttur. Listeye ekleme alan boşaltmaz.</p></div>') +
      (selected ? I18n.f('<div class="section-label">Kategori</div><div class="key-stats"><div class="kstat"><span>Öğe</span><b>') + App.fmtCount(selected.items.length) + I18n.f('</b></div><div class="kstat"><span>Boyut</span><b>') + App.fmtBytes(catSize(selected)) + I18n.f('</b></div></div><div class="actions"><button class="btn" id="temp-export-category">Kategori CSV İndir</button><button class="btn" id="temp-reveal">İlk Konumu Göster</button></div>') : ''));
    if (selected) {
      $('#temp-export-category').addEventListener('click', () => App.downloadCsv([[I18n.f('Ad'), 'Yol', I18n.f('Boyut (Bayt)')], ...selected.items.map(item => [item.name, item.path, item.size])], 'taxdisc-inceleme-adaylari.csv'));
      $('#temp-reveal').addEventListener('click', () => App.showInFolder(selected.items[0]?.path));
    }
  }
  $('#risk-chips').innerHTML = [['all', I18n.f('Tümü')], ['caution', I18n.f('İnceleyin')], ['risk', I18n.f('Dikkatli İnceleyin')]].map(([key, label]) => '<button class="chip' + (key === riskFilter ? ' active' : '') + '" data-risk="' + key + '">' + label + '</button>').join('');
  $('#risk-chips').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    riskFilter = button.dataset.risk;
    $('#risk-chips').querySelectorAll('button').forEach(other => other.classList.toggle('active', other === button)); render();
  }));
  $('#clean-all').addEventListener('click', async () => { $('#clean-all').disabled = true; await App.addDiscards(filtered().flatMap(pending)); render(); });
  document.addEventListener('app:plan', render);
  render();
});
