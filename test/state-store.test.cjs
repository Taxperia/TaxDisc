'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { StateStore, normalizePlan, isWithin } = require('../electron/state-store.cjs');
const { readJson } = require('../electron/state-store.cjs');
const { scanPath } = require('../electron/scanner-service.cjs');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-state-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'sample'); fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'a.txt'), 'hello');
  return { dir, root, store: new StateStore(path.join(dir, 'profile')) };
}
test('tarama ve ayıklama listesi uygulama yeniden açıldığında korunur', async t => {
  const { root, store } = fixture(t);
  await store.save(scanPath(root));
  const items = [{ path: path.join(root, 'a.txt'), size: 5 }];
  await store.savePlan(items);
  const reopened = new StateStore(store.directory);
  assert.equal(reopened.load().root.size, 5);
  assert.equal(reopened.loadPlan()[0].path, items[0].path);
  await reopened.clear();
  assert.equal(new StateStore(store.directory).load().source, 'empty');
  assert.equal(fs.existsSync(store.planPath), false);
  assert.equal(fs.readFileSync(items[0].path, 'utf8'), 'hello');
});
test('yeni tarama önceki listeyi devralmaz', async t => {
  const { root, store } = fixture(t);
  const ds = scanPath(root); await store.save(ds);
  await store.savePlan([{ path: path.join(root, 'a.txt'), size: 5 }]);
  const oldPlan = fs.readFileSync(store.planPath);
  await store.save({ ...ds, scannedAt: ds.scannedAt + 1 });
  fs.writeFileSync(store.planPath, oldPlan);
  assert.deepEqual(store.loadPlan(), []);
});
test('aynı yol ve iç içe konumlar iki kez sayılmaz, dışarıdaki yollar reddedilir', t => {
  const { root } = fixture(t), folder = path.join(root, 'folder'), file = path.join(folder, 'a.txt');
  const ds = { scanRoot: root };
  assert.deepEqual(normalizePlan([{ path: file, size: 1 }, { path: file, size: 1 }, { path: folder, size: 10 }], ds).map(item => item.path), [folder]);
  assert.throws(() => normalizePlan([{ path: path.dirname(root), size: 1 }], ds));
  assert.throws(() => normalizePlan([{ path: file, size: -1 }], ds));
  assert.equal(isWithin(root, root + '-other'), false);
  assert.equal(isWithin(root, 'relative.txt'), false);
  if (process.platform === 'win32') assert.equal(normalizePlan([{ path: file, size: 1 }, { path: file.toUpperCase(), size: 1 }], ds).length, 1);
});
test('yarım kalan kayıt önceki tamamlanmış taramayı bozmaz', async t => {
  const { root, store } = fixture(t);
  const original = scanPath(root); await store.save(original);
  const mock = t.mock.method(fs.promises, 'rename', async () => { throw Object.assign(new Error('Disk dolu'), { code: 'ENOSPC' }); });
  await assert.rejects(store.save({ ...original, scannedAt: original.scannedAt + 100 }));
  mock.mock.restore();
  assert.equal(store.load().scannedAt, original.scannedAt);
  assert.equal(new StateStore(store.directory).load().scannedAt, original.scannedAt);
  assert.equal(fs.existsSync(store.datasetPath + '.tmp'), false);
});
test('bozuk veya eski kayıt uygulamayı açılışta durdurmaz', t => {
  const { store } = fixture(t);
  fs.mkdirSync(store.directory, { recursive: true });
  for (const value of ['{broken', '{"schemaVersion":4}', '{"schemaVersion":5,"root":null}']) {
    fs.writeFileSync(store.datasetPath, value);
    const ds = new StateStore(store.directory).load();
    assert.equal(ds.source, 'empty'); assert.equal(ds.requiresRescan, true);
  }
});
test('partial clear cannot restore an old scan or review list on restart', async t => {
  const {root,store}=fixture(t);await store.save(scanPath(root));await store.savePlan([{path:path.join(root,'a.txt'),size:5}]);
  const unlink=fs.promises.unlink.bind(fs.promises);
  const mock=t.mock.method(fs.promises,'unlink',async target=>{if(target===store.planPath)throw Object.assign(new Error('locked'),{code:'EACCES'});return unlink(target);});
  const result=await store.clear();mock.mock.restore();
  assert.equal(result.cleanupWarning,true);assert.equal(store.load().source,'empty');assert.deepEqual(new StateStore(store.directory).loadPlan(),[]);
  assert.equal(fs.readFileSync(path.join(root,'a.txt'),'utf8'),'hello');
});
test('profile reads enforce byte limits before parsing and reject malformed descendants', async t => {
  const {root,store}=fixture(t);await store.save(scanPath(root));
  const target=path.join(root,'bounded.json');fs.writeFileSync(target,'{"text":"long value"}');assert.throws(()=>readJson(target,10));
  const ds=scanPath(root);ds.root.children=[null];fs.writeFileSync(store.datasetPath,JSON.stringify(ds));
  assert.equal(new StateStore(store.directory).load().requiresRescan,true);
});
test('scan identity prevents stale plans from matching a same-millisecond rescan', async t => {
  const {root,store}=fixture(t);const first=scanPath(root);await store.save(first);await store.savePlan([{path:path.join(root,'a.txt'),size:5}]);const oldPlan=fs.readFileSync(store.planPath);
  const second=scanPath(root);second.scannedAt=first.scannedAt;await store.save(second);fs.writeFileSync(store.planPath,oldPlan);assert.deepEqual(store.loadPlan(),[]);
});
test('oversized writes preserve the previously saved review record', async t => {
  const {root,store}=fixture(t);await store.save(scanPath(root));await store.savePlan([{path:path.join(root,'a.txt'),size:5}]);
  const previous=fs.readFileSync(store.planPath,'utf8');
  await assert.rejects(store.atomicWrite(store.planPath,{data:'a'.repeat(16*1024*1024)}));
  assert.equal(fs.readFileSync(store.planPath,'utf8'),previous);
});
