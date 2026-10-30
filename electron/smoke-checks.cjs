'use strict';
// Exercised only with TAXDISC_SMOKE_TEST=1 and an isolated test profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { StateStore } = require('./state-store.cjs');

async function run({ window, store, runScan, cancelScan, root, errors }) {
  const wc = window.webContents;
  const js = source => wc.executeJavaScript(source);
  const pages = ['index.html', 'buyuk-dosyalar.html', 'yinelenenler.html', 'gecici-dosyalar.html', 'raporlar.html', 'ayiklama.html'];
  const results = [];
  async function ready() {
    const state = await js(`Promise.race([App.ready.then(() => ({source:App.dataset.source, ready:document.body.classList.contains('app-ready'), loaderHidden:document.querySelector('.page-loader').hidden, failed:document.querySelector('.page-loader').classList.contains('failed'), desktop:!!window.taxdiscDesktop, links:document.querySelectorAll('#sidebar a').length})), new Promise((_, reject) => setTimeout(() => reject(new Error('Page initialization timed out')), 8000))])`);
    assert.equal(state.ready, true); assert.equal(state.failed, false); assert.equal(state.desktop, true); assert.ok(state.links >= 7);
    assert.equal(state.loaderHidden, true);
    return state;
  }
  async function visit(page) {
    await window.loadFile(path.join(root, page));
    return ready();
  }
  async function navigateWithUI(action) {
    const loaded = new Promise((resolve,reject) => {
      const timeout=setTimeout(()=>reject(new Error('UI navigation timed out')),8000);
      wc.once('did-finish-load',()=>{clearTimeout(timeout);resolve();});
    });
    await js(action); await loaded; return ready();
  }
  async function screenshot(page) {
    if (!process.env.TAXDISC_SMOKE_SCREENSHOTS) return;
    const directory = path.resolve(process.env.TAXDISC_SMOKE_SCREENSHOTS);
    await fs.promises.mkdir(directory, { recursive: true });
    await js(`new Promise(resolve => setTimeout(resolve, 250))`);
    const png = await wc.capturePage();
    await fs.promises.writeFile(path.join(directory, page.replace('.html', '') + '.png'), png.toPNG());
  }
  async function download(buttonId) {
    const target = path.join(process.env.TAXDISC_SMOKE_ROOT, buttonId + '.csv');
    const done = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('CSV download timed out')), 8000);
      wc.session.once('will-download', (_event, item) => {
        item.setSavePath(target);
        item.once('done', (_event, state) => { clearTimeout(timeout); state === 'completed' ? resolve() : reject(new Error('Download: ' + state)); });
      });
    });
    await js(`document.getElementById(${JSON.stringify(buttonId)}).click()`);
    await done;
    const csv = fs.readFileSync(target, 'utf8');
    assert.ok(csv.startsWith('\ufeff')); assert.ok(csv.includes(';')); assert.ok(csv.includes('\r\n'));
    return csv;
  }
  const initial = await ready();
  for (const page of pages) {
    const state = await visit(page);
    assert.equal(state.source, initial.source);
    results.push({ page, source: state.source });
  }
  await navigateWithUI(`document.querySelector('a[href="index.html"][data-page-item]').click()`);
  assert.equal(await js(`document.documentElement.lang`),'en');
  if (initial.source === 'desktop') {
    const previous = store.load();
    const pending = runScan(process.env.TAXDISC_SMOKE_ROOT, wc);
    const cancelled = assert.rejects(pending, { code: 'SCAN_CANCELLED' });
    assert.equal(cancelScan(), true); await cancelled;
    assert.equal(store.load().scannedAt, previous.scannedAt);
    const scanned = await runScan(process.env.TAXDISC_SMOKE_ROOT, wc);
    assert.ok(scanned.root.files >= 4);
    await visit('index.html');
    assert.ok(await js(`Array.from(document.querySelectorAll('#contents-body b')).some(node=>node.textContent==='Klasör')`),'User file names must not be translated.');
    assert.ok(await js(`document.querySelectorAll('.tm-group').length > 0`));
    await screenshot('index.html');
    // All candidate content is intentionally different but has the same name/size.
    await visit('yinelenenler.html');
    assert.equal(await js(`document.querySelectorAll('[data-copy]:checked').length`), 0);
    assert.ok(await js(`document.querySelectorAll('.dup-group').length > 0`));
    await js(`document.getElementById('auto-all').click(); document.getElementById('dup-add-selected').click()`);
    await js(`new Promise((resolve, reject) => { const check = () => App.planSaving ? setTimeout(check, 10) : App.discard.length ? resolve(true) : reject(new Error('Selection was not saved')); check(); })`);
    assert.ok(store.loadPlan().length > 0);
    await screenshot('yinelenenler.html');
    await visit('ayiklama.html');
    assert.ok(await js(`document.querySelectorAll('[data-remove]').length > 0`));
    assert.equal(new StateStore(store.directory).loadPlan().length, store.loadPlan().length);
    await download('plan-export');
    await screenshot('ayiklama.html');
    await navigateWithUI(`const select=document.getElementById('language-select');select.value='tr';select.dispatchEvent(new Event('change'))`);
    for (const page of pages) {
      await visit(page);
      assert.equal(await js(`document.documentElement.lang`),'tr');
      assert.ok(await js(`document.querySelector('.scan-primary').textContent.includes('Klasör Tara')`));
      await screenshot('tr-'+page);
    }
    assert.ok(store.loadPlan().length>0,'Language changes must preserve review data.');
    await navigateWithUI(`const select=document.getElementById('language-select');select.value='en';select.dispatchEvent(new Event('change'))`);
    await visit('ayiklama.html');
    await js(`document.querySelector('[data-remove]').click()`);
    await js(`new Promise(resolve => { const check = () => App.planSaving ? setTimeout(check, 10) : resolve(); check(); })`);
    assert.equal(store.loadPlan().length, 0);
    assert.equal(await js(`App.clearDiscard()`), true);
    assert.equal(store.loadPlan().length, 0);
    await visit('buyuk-dosyalar.html');
    await js(`document.querySelector('#top-bars .bar-row').click()`);
    assert.ok(await js(`document.getElementById('insp-body').textContent.includes('video')`));
    await screenshot('buyuk-dosyalar.html');
    await visit('gecici-dosyalar.html');
    await js(`document.querySelector('[data-cat]').click(); document.querySelector('[data-add]').click()`);
    await js(`new Promise(resolve => { const check = () => App.planSaving ? setTimeout(check, 10) : resolve(); check(); })`);
    assert.ok(store.loadPlan().length > 0);
    await screenshot('gecici-dosyalar.html');
    await visit('raporlar.html');
    await download('btn-export');
    await screenshot('raporlar.html');
    window.setSize(1050, 680);
    for (const page of pages) {
      await visit(page);
      assert.equal(await js(`document.querySelector('.privacy-clear').getBoundingClientRect().bottom <= innerHeight`), true, page + ': footer must be reachable');
      if (page === 'index.html') {
        assert.equal(await js(`getComputedStyle(document.querySelector('.page')).overflowY`), 'auto');
        await js(`document.getElementById('contents-body').scrollIntoView({block:'center'})`);
        assert.equal(await js(`document.getElementById('contents-body').getBoundingClientRect().top < innerHeight`), true);
      }
      await screenshot('minimum-' + page);
    }
    // Negative IPC checks do not open external applications.
    assert.equal(await js(`window.taxdiscDesktop.openPath(${JSON.stringify(path.dirname(scanned.scanRoot))}).then(() => false, () => true)`), true);
    const planBefore = store.loadPlan();
    assert.equal(await js(`window.taxdiscDesktop.savePlan([{path:${JSON.stringify(path.dirname(scanned.scanRoot))},size:1}]).then(() => false, () => true)`), true);
    assert.deepEqual(store.loadPlan(), planBefore);
    await js(`window.taxdiscDesktop.clearDataset()`);
    assert.equal(store.load().source, 'empty');
    await visit('index.html');
    assert.equal(await js(`!!document.querySelector('.empty-state')`), true);
    assert.ok(fs.existsSync(process.env.TAXDISC_SMOKE_ROOT));
  }
  assert.deepEqual(errors, [], 'Renderer console errors');
  return { case: process.env.TAXDISC_SMOKE_CASE, pages: results, workerCancellation: initial.source === 'desktop', csvDownloads: initial.source === 'desktop' ? 2 : 0 };
}
module.exports = { run };
