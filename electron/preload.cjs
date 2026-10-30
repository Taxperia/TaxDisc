'use strict';

const { contextBridge, ipcRenderer } = require('electron');

async function invoke(channel, ...args) {
  try { return await ipcRenderer.invoke(channel, ...args); }
  catch (error) {
    throw new Error(String(error.message || 'İşlem tamamlanamadı.').replace(/^Error invoking remote method '[^']+': (?:Error: )?/, ''));
  }
}

contextBridge.exposeInMainWorld('taxdiscDesktop', {
  isDesktop: true,
  setLanguage: value => invoke('app:language', value),
  getInitialDataset: () => invoke('dataset:get'),
  scanFolder: () => invoke('scan:choose'),
  cancelScan: () => invoke('scan:cancel'),
  getPlan: () => invoke('plan:get'),
  savePlan: items => invoke('plan:save', items),
  showInFolder: targetPath => invoke('path:show', targetPath),
  openPath: targetPath => invoke('path:open', targetPath),
  clearDataset: () => invoke('dataset:clear'),
  onScanProgress: callback => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('scan:progress', listener);
    return () => ipcRenderer.removeListener('scan:progress', listener);
  }
});
