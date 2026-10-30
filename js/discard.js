App.whenReady(function () {
  const $ = App.$, esc = App.escapeHtml;
  let visible = 100;
  function render() {
    $('#plan-root').textContent = App.dataset.scanRoot || I18n.f('Henüz tarama yapılmadı');
    $('#plan-count').textContent = App.fmtCount(App.discard.length);
    $('#plan-size').textContent = App.fmtBytes(App.discard.reduce((sum, item) => sum + item.size, 0));
    $('#plan-export').disabled = $('#plan-clear').disabled = !App.discard.length;
    const query = $('#plan-search').value.trim().toLocaleLowerCase('tr-TR');
    const filtered = App.discard.filter(item => (item.name + ' ' + item.path).toLocaleLowerCase('tr-TR').includes(query));
    $('#plan-body').innerHTML = filtered.slice(0, visible).map((item, index) =>
      '<tr><td><div class="td-name"><div class="tw"><b>' + esc(item.name) + '</b><span class="sub plan-path">' + esc(item.path) + '</span></div></div></td><td class="num">' + App.fmtBytes(item.size) + '</td>' +
      '<td><div class="plan-actions"><button class="btn" data-reveal="' + index + I18n.f('">Gezginde Göster</button><button class="btn" data-remove="') + index + I18n.f('">Listeden Çıkar</button></div></td></tr>')
    ).join('') || '<tr><td colspan="3" class="empty-message">' + (App.discard.length ? I18n.f('Aramanızla eşleşen öğe yok.') : I18n.f('Liste boş. Disk Haritası, Büyük Dosyalar veya analiz sayfalarından öğe ekleyebilirsiniz.')) + '</td></tr>';
    $('#plan-body').querySelectorAll('[data-reveal]').forEach(button => button.addEventListener('click', () => App.showInFolder(filtered[+button.dataset.reveal].path)));
    $('#plan-body').querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      if (!await App.removeDiscard(filtered[+button.dataset.remove].path)) button.disabled = false;
    }));
    App.renderMore($('#plan-pagination'), Math.min(visible, filtered.length), filtered.length, () => { visible += 100; render(); });
  }
  $('#plan-search').addEventListener('input', () => { visible = 100; render(); });
  $('#plan-export').addEventListener('click', () => App.downloadCsv([
    [I18n.f('Ad'), 'Yol', I18n.f('Boyut (Bayt)'), I18n.f('Tarama Tarihi')],
    ...App.discard.map(item => [item.name, item.path, item.size, App.fmtDate(App.dataset.scannedAt)])
  ], 'taxdisc-ayiklama-listesi.csv'));
  $('#plan-clear').addEventListener('click', async () => {
    if (confirm(I18n.f('Ayıklama listesindeki tüm işaretlemeler kaldırılsın mı? Diskteki dosyalarınız değişmez.'))) await App.clearDiscard();
  });
  document.addEventListener('app:plan', render);
  App.setInspector('<div class="empty-inspector">' + ic('sliders') + I18n.f('<h3>İnceleme listesi</h3><p>Liste uygulamayı kapatsanız da korunur. Yeni tarama başarıyla tamamlandığında yeni bir liste başlar.</p><p>Üst klasör listelenmişse altındaki dosyalar ayrıca sayılmaz. Gösterilen boyut tarama anına aittir.</p></div>'));
  render();
  App.finishPageLoad();
});
