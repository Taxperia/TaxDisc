
  App.whenReady(function () {
  document.querySelector('.main-head .nav-arrows').innerHTML =
    '<button class="icon-btn" disabled>' + ic('chevL') + '</button><button class="icon-btn" disabled>' + ic('chevR') + '</button>';
  document.getElementById('last-scan').textContent = App.fmtDate(App.dataset.scannedAt);
  document.querySelector('#auto-all .ic').innerHTML = ic('spark');
  document.querySelector('#clear-all .ic').innerHTML = ic('xmark');
  document.querySelector('.notice .ico').innerHTML = ic('warning');
  App.finishPageLoad();
  });
