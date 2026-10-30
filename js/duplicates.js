/* Same name and size identify candidates, never verified identical content. */
App.whenReady(function () {
  const $ = App.$, esc = App.escapeHtml, MB = Data.MB, GB = Data.GB;
  const ds = App.dataset;
  const groups = ds.source === 'demo' ? structuredClone(Data.DEMO_DUPES) : (ds.duplicateGroups || []);
  let visible = 30, selected = null;
  groups.forEach((group, id) => {
    group.id = id; group.selection = new Set(); group.keep = 0;
    group.copies.forEach((copy, i) => {
      if (new Date(copy.mod || 0) > new Date(group.copies[group.keep].mod || 0)) group.keep = i;
    });
  });
  const pagination = document.createElement('div'); pagination.className = 'pagination';
  $('#dup-list').after(pagination);
  const addAll = document.createElement('button'); addAll.className = 'btn primary'; addAll.id = 'dup-add-selected';
  addAll.textContent = I18n.f('Seçilenleri Listeye Ekle'); $('#clear-all').after(addAll);
  const unplannedSelection = group => Array.from(group.selection).filter(i => !App.isPlanned(group.copies[i].path));
  function waste(group) { return (group.copies.length - 1) * group.size; }
  function renderStats() {
    $('#d-groups').textContent = App.fmtCount(groups.length);
    $('#d-files').textContent = App.fmtCount(groups.reduce((sum, group) => sum + group.copies.length - 1, 0));
    $('#d-waste').textContent = App.fmtBytes(groups.reduce((sum, group) => sum + waste(group), 0));
    $('#d-recovered').textContent = App.fmtBytes(groups.reduce((sum, group) => sum + group.copies.filter(copy => App.isPlanned(copy.path)).length * group.size, 0));
    addAll.disabled = !groups.some(group => unplannedSelection(group).length);
  }
  function filtered() {
    const threshold = ({ m10: 10 * MB, m100: 100 * MB, g1: GB })[$('#threshold').value] || 0;
    const query = $('#dup-search').value.trim().toLocaleLowerCase('tr-TR');
    return groups.filter(group => group.size >= threshold && group.name.toLocaleLowerCase('tr-TR').includes(query));
  }
  function renderGroups() {
    const list = filtered();
    $('#dup-list').innerHTML = list.slice(0, visible).map(group =>
      '<div class="dup-group" data-group="' + group.id + '"><div class="dup-head">' + ic('duplicates') + '<div><b>' + esc(group.name) + '</b><div class="d-sub">' + I18n.count(group.copies.length, 'candidate') + ' · ' + I18n.t('her biri') + ' ' + App.fmtBytes(group.size) + '</div></div><div class="d-waste"><b>' + App.fmtBytes(waste(group)) + I18n.f('</b><span>olası fazlalık</span></div></div>') +
      group.copies.map((copy, i) => '<div class="dup-row"><input type="checkbox" aria-label="' + esc(copy.path) + I18n.f(' dosyasını seç" data-copy="') + i + '" ' + (group.selection.has(i) ? 'checked ' : '') + (i === group.keep || App.isPlanned(copy.path) ? 'disabled' : '') + '><div class="d-path"><b>' + esc(copy.path) + '</b><div class="d-sub">' + (App.isPlanned(copy.path) ? I18n.f('Listede') : i === group.keep ? I18n.f('En yeni tarih · referans') : App.fmtDate(copy.mod)) + '</div></div><div class="d-size">' + App.fmtBytes(group.size) + '</div></div>').join('') +
      I18n.f('<div class="dup-foot"><span class="d-msg">İçerik doğrulanmadı. Eklemek dosyaları silmez.</span><button class="btn primary" data-add="') + group.id + '" ' + (!unplannedSelection(group).length ? 'disabled' : '') + I18n.f('>Seçilenleri Listeye Ekle</button></div></div>')
    ).join('') || I18n.f('<div class="card empty-message">Bu filtrelerle olası yinelenen dosya bulunamadı. Analiz aynı ad ve boyuttaki 1 MB+ dosyaları kapsar.</div>');
    $('#dup-list').querySelectorAll('[data-copy]').forEach(input => input.addEventListener('change', () => {
      const group = groups[+input.closest('[data-group]').dataset.group], index = +input.dataset.copy;
      input.checked ? group.selection.add(index) : group.selection.delete(index);
      selected = group; render();
    }));
    $('#dup-list').querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => add([groups[+button.dataset.add]], button)));
    $('#dup-list').querySelectorAll('.dup-head').forEach(head => head.addEventListener('click', () => { selected = groups[+head.parentElement.dataset.group]; renderInspector(); }));
    App.renderMore(pagination, Math.min(visible, list.length), list.length, () => { visible += 30; renderGroups(); });
  }
  async function add(list, button) {
    button.disabled = true;
    const items = list.flatMap(group => unplannedSelection(group).map(i => ({ name: group.name, path: group.copies[i].path, size: group.size })));
    await App.addDiscards(items); render();
  }
  function renderInspector() {
    App.setInspector('<div class="sel-card">' + ic('duplicates', 'big-ico') + '<div><b>' + esc(selected ? selected.name : I18n.f('Olası Yinelenenler')) + I18n.f('</b><span>Ad + boyut karşılaştırması</span></div></div><div class="meta-card"><p>İçerikleri farklı dosyalar aynı ad ve boyuta sahip olabilir. Bu sayfa kesin kopya doğrulaması yapmaz.</p><p>1 MB ve üzerindeki adaylar listelenir. En yeni tarih yalnızca bir referanstır; önemli dosyaları kendiniz karşılaştırın.</p></div>') +
      (selected ? I18n.f('<div class="section-label">Aday Konumlar</div><div class="actions">') + selected.copies.map((copy, i) => '<button class="btn" data-reveal="' + i + '" title="' + esc(copy.path) + '">' + ic('reveal') + esc(copy.path) + '</button>').join('') + '</div>' : ''));
    $('#insp-body').querySelectorAll('[data-reveal]').forEach(button => button.addEventListener('click', () => App.showInFolder(selected.copies[+button.dataset.reveal].path)));
  }
  function render() { renderStats(); renderGroups(); renderInspector(); }
  $('#auto-all').addEventListener('click', () => {
    filtered().forEach(group => { group.selection = new Set(group.copies.map((_, i) => i).filter(i => i !== group.keep && !App.isPlanned(group.copies[i].path))); });
    render();
  });
  $('#clear-all').addEventListener('click', () => { groups.forEach(group => group.selection.clear()); render(); });
  addAll.addEventListener('click', () => add(groups, addAll));
  $('#dup-search').addEventListener('input', () => { visible = 30; render(); });
  $('#threshold').addEventListener('change', () => { visible = 30; render(); });
  document.addEventListener('app:plan', render);
  render();
});
