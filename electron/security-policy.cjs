'use strict';
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const PAGES = new Set(['index.html','buyuk-dosyalar.html','yinelenenler.html','gecici-dosyalar.html','raporlar.html','ayiklama.html']);
function isTrustedDocumentURL(value, rendererRoot) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'file:' || url.host || url.search) return false;
    const target = path.resolve(fileURLToPath(url));
    const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
    return normalize(path.dirname(target)) === normalize(path.resolve(rendererRoot)) && PAGES.has(path.basename(target));
  } catch (_) { return false; }
}
function assertTrustedSender(event, webContents, rendererRoot) {
  if (!event || !webContents || event.sender !== webContents || event.senderFrame !== webContents.mainFrame || !isTrustedDocumentURL(event.senderFrame?.url, rendererRoot)) {
    throw new Error('Untrusted application request.');
  }
}
module.exports = { isTrustedDocumentURL, assertTrustedSender };
