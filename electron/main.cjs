'use strict';

const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { StateStore, isWithin } = require('./state-store.cjs');
const I18n = require('../js/i18n.js');
const { isTrustedDocumentURL, assertTrustedSender } = require('./security-policy.cjs');
const rendererRoot = path.resolve(__dirname, '..');
function handle(channel, action) {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedSender(event, mainWindow?.webContents, rendererRoot);
    return action(event, ...args);
  });
}

let mainWindow = null;
let store;
let activeScan = null;
let scanBusy = false;
let writingPlan = false;
const smokeMode = process.env.TAXDISC_SMOKE_TEST === '1';
if (process.env.TAXDISC_USER_DATA_DIR) app.setPath('userData', process.env.TAXDISC_USER_DATA_DIR);

async function allowedPath(targetPath) {
  const ds = store.load();
  if (!isWithin(ds.scanRoot, targetPath)) throw new Error(I18n.f('Bu yol geçerli taramanın dışında.'));
  try {
    const [root, target] = await Promise.all([
      fs.promises.realpath(ds.scanRoot), fs.promises.realpath(targetPath)
    ]);
    if (!isWithin(root, target)) throw new Error(I18n.f('Bağlantının hedefi geçerli taramanın dışında.'));
    return target;
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(I18n.f('Dosya veya klasör artık mevcut değil. Yeniden tarayın.'));
    if (error.code === 'EACCES' || error.code === 'EPERM') throw new Error(I18n.f('Bu konuma erişim izni yok.'));
    throw error;
  }
}

function runScan(rootPath, sender) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'scanner-worker.cjs'), { workerData: { rootPath } });
    if (!sender.isDestroyed()) sender.send('scan:progress', { files: 0, folders: 0, bytes: 0, currentPath: rootPath });
    let settled = false;
    let receivedResult = false;
    activeScan = { worker, cancel() {
      if (settled || receivedResult) return false;
      settled = true;
      void worker.terminate();
      reject(Object.assign(new Error(I18n.f('Tarama iptal edildi. Önceki tarama korundu.')), { code: 'SCAN_CANCELLED' }));
      return true;
    } };

    worker.on('message', async message => {
      if (settled) return;
      if (message.type === 'progress') {
        if (!sender.isDestroyed()) sender.send('scan:progress', message.progress);
        return;
      }
      if (message.type === 'error') {
        settled = true;
        reject(Object.assign(new Error(message.error.message), { code: message.error.code }));
        return;
      }
      if (message.type === 'result') {
        receivedResult = true;
        try {
          await store.save(message.dataset);
          settled = true;
          resolve(message.dataset);
        } catch (error) {
          settled = true;
          reject(new Error(I18n.f('Tarama kaydedilemedi. Disk alanını ve profil klasörünün yazma iznini kontrol edin. Önceki tamamlanan tarama korundu.')));
        }
      }
    });
    worker.on('error', error => { if (!settled) reject(error); });
    worker.on('exit', code => {
      if (!settled && !receivedResult) reject(new Error(I18n.f('Tarama iş parçacığı sonuç vermeden kapandı (') + code + ').'));
    });
  }).finally(() => { activeScan = null; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1050,
    minHeight: 680,
    backgroundColor: '#17181b',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    title: 'TaxDisc Disk Analiz',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
      backgroundThrottling: !smokeMode,
      devTools: !app.isPackaged
    }
  });
  const smokeErrors = [];
  if (smokeMode) mainWindow.webContents.on('console-message', (event, level, message) => {
    if (event.level === 'error' || level === 3) smokeErrors.push(event.message || message);
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.once('ready-to-show', () => { if (!smokeMode) mainWindow.show(); });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedDocumentURL(url, rendererRoot)) event.preventDefault();
  });
  mainWindow.webContents.on('will-frame-navigate', event => {
    if (!event.isMainFrame || !isTrustedDocumentURL(event.url, rendererRoot)) event.preventDefault();
  });
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.session.setPermissionCheckHandler(() => false);
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  mainWindow.webContents.session.webRequest.onBeforeRequest({ urls: ['http://*/*','https://*/*','ws://*/*','wss://*/*'] }, (_details, callback) => callback({ cancel: true }));
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (!smokeMode && details.reason !== 'clean-exit') {
      dialog.showMessageBox({ type: 'error', title: 'TaxDisc', message: I18n.f('Arayüz kapandı. Uygulamayı yeniden açın.'), detail: I18n.f('Son tamamlanan tarama bilgisayarınızda saklanır.') });
    }
  });
  if (smokeMode) {
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        const result = await require('./smoke-checks.cjs').run({ app, window: mainWindow, store, runScan,
          cancelScan: () => activeScan?.cancel(), root: path.resolve(__dirname, '..'), errors: smokeErrors });
        result.appVersion = app.getVersion();
        result.electronVersion = process.versions.electron;
        if (app.isPackaged) result.asarSha256 = require('node:crypto').createHash('sha256').update(require('original-fs').readFileSync(app.getAppPath())).digest('hex');
        fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-result.json'), JSON.stringify({ ok: true, result }));
        process.stdout.write('TAXDISC_SMOKE_OK ' + JSON.stringify(result) + '\n');
        app.exit(0);
      } catch (error) {
        fs.writeFileSync(path.join(app.getPath('userData'), 'smoke-result.json'), JSON.stringify({ ok: false, error: error.stack }));
        process.stderr.write('TAXDISC_SMOKE_FAIL ' + error.stack + '\n');
        app.exit(1);
      }
    });
  }
}

handle('app:language', (_event, value) => { I18n.setLanguage(value); return value; });
handle('dataset:get', () => store.load());
handle('plan:get', () => store.loadPlan());
handle('plan:save', async (_event, items) => {
  if (scanBusy || writingPlan) throw new Error(I18n.f('Devam eden işlem tamamlandıktan sonra tekrar deneyin.'));
  writingPlan = true;
  try { return await store.savePlan(items); } finally { writingPlan = false; }
});
handle('scan:cancel', () => activeScan?.cancel() || false);

handle('scan:choose', async event => {
  if (scanBusy || writingPlan) throw new Error(I18n.f('Devam eden işlem tamamlandıktan sonra tekrar deneyin.'));
  scanBusy = true;
  try {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: I18n.f('Analiz edilecek klasörü veya sürücüyü seçin'),
      buttonLabel: I18n.f('Taramayı Başlat'),
      properties: ['openDirectory', 'dontAddToRecent']
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return await runScan(result.filePaths[0], event.sender);
  } catch (error) {
    if (error.code === 'SCAN_CANCELLED') return { cancelled: true };
    if (error.code === 'EACCES' || error.code === 'EPERM') throw new Error(I18n.f('Seçilen klasöre erişim izni yok. Başka bir konum seçin.'));
    if (error.code === 'ENOENT') throw new Error(I18n.f('Seçilen klasör bulunamadı veya sürücü bağlantısı kesildi.'));
    throw error;
  } finally { scanBusy = false; }
});

handle('path:show', async (_event, targetPath) => {
  const target = await allowedPath(targetPath);
  const stat = await fs.promises.stat(target);
  if (stat.isDirectory()) return shell.openPath(target);
  shell.showItemInFolder(target);
  return '';
});

handle('path:open', async (_event, targetPath) => {
  return shell.openPath(await allowedPath(targetPath));
});

handle('dataset:clear', async () => {
  if (scanBusy || writingPlan) throw new Error(I18n.f('Önce devam eden işlemi tamamlayın veya iptal edin.'));
  writingPlan = true;
  try { return await store.clear(); } finally { writingPlan = false; }
});

const singleInstance = smokeMode || app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
else app.whenReady().then(() => {
  store = new StateStore(app.getPath('userData'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); }
});
app.on('before-quit', () => { if (activeScan) activeScan.cancel(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
