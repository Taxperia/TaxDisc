
  App.whenReady(function () {
  document.querySelector('.main-head .nav-arrows').innerHTML =
    '<button class="icon-btn" disabled>' + ic('chevL') + '</button><button class="icon-btn" disabled>' + ic('chevR') + '</button>';
  document.getElementById('crumb-root').textContent = App.dataset.root.name;
  document.getElementById('r-scan').textContent = App.fmtDate(App.dataset.scannedAt);
  document.getElementById('btn-export').querySelector('.ic').innerHTML = ic('export');
  document.getElementById('btn-print').querySelector('.ic').innerHTML = ic('printer');
  document.querySelector('.grid-2 .card h3 .ico').innerHTML = ic('mapIcon');
  document.querySelectorAll('.grid-2 .card h3 .ico')[1].innerHTML = ic('pie');
  document.querySelectorAll('.card h3 .ico')[2].innerHTML = ic('chartLine');
  document.querySelector('.notice .ico').innerHTML = ic('warning');
  App.finishPageLoad();
  });
