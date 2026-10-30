
  App.whenReady(function () {
  document.querySelector('.main-head .nav-arrows').innerHTML =
    '<button class="icon-btn" disabled>' + ic('chevL') + '</button><button class="icon-btn" disabled>' + ic('chevR') + '</button>';
  document.getElementById('last-scan').textContent = App.fmtDate(App.dataset.scannedAt);
  document.querySelector('.grid-2 .card h3 .ico').innerHTML = ic('pie');
  document.querySelectorAll('.grid-2 .card h3 .ico')[1].innerHTML = ic('info');
  document.querySelector('.notice .ico').innerHTML = ic('warning');
  App.finishPageLoad();
  });
