
  App.whenReady(function () {
  // Başlık ikonları (statik doldurma)
  document.getElementById('btn-back').innerHTML = ic('chevL');
  document.getElementById('btn-fwd').innerHTML = ic('chevR');
  document.getElementById('contents-ico').innerHTML = ic('circleDashed');
  document.getElementById('contents-chev').innerHTML = ic('chevD');
  document.getElementById('notice-ico').innerHTML = ic('warning');
  document.getElementById('notice-dismiss').innerHTML = ic('xmark');
  document.getElementById('notice-dismiss').addEventListener('click', () => {
    document.getElementById('notice-bar').style.display = 'none';
  });
  App.finishPageLoad();
  });
