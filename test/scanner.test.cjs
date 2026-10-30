'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { scanPath, DEFAULT_MAX_ENTRIES } = require('../electron/scanner-service.cjs');
const { match, rules } = require('../js/temp-rules.js');

test('gerçek klasör ağacını tarar ve boyutları toplar', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'alt'));
  fs.writeFileSync(path.join(dir, 'a.bin'), Buffer.alloc(11));
  fs.writeFileSync(path.join(dir, 'alt', 'b.bin'), Buffer.alloc(29));

  const ds = scanPath(dir);
  assert.equal(ds.source, 'desktop');
  assert.equal(ds.root.size, 40);
  assert.equal(ds.root.files, 2);
  assert.equal(ds.root.folders, 1);
  assert.equal(ds.root.children.length, 1);
  assert.equal(ds.root.children[0].kind, 'aggregate');
  assert.equal(ds.root.children[0].size, 40);
  assert.equal(ds.root.children[0].files, 2);
  assert.equal(ds.root.children[0].folders, 1);
  assert.equal(ds.root.path, path.resolve(dir));
  assert.equal(ds.root.children.find(node => node.name === 'a.bin'), undefined);
  assert.equal(ds.truncated, false);
  assert.equal(ds.schemaVersion, 5);
});

test('büyük dosya ve kopya indekslerini tam ağaçtan bağımsız üretir', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-index-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const first = path.join(dir, 'bir', 'arsiv.zip');
  const second = path.join(dir, 'iki', 'arsiv.zip');
  fs.mkdirSync(path.dirname(first));
  fs.mkdirSync(path.dirname(second));
  fs.writeFileSync(first, Buffer.alloc(0));
  fs.writeFileSync(second, Buffer.alloc(0));
  fs.truncateSync(first, 11 * 1024 * 1024);
  fs.truncateSync(second, 11 * 1024 * 1024);

  const ds = scanPath(dir);
  assert.equal(ds.largeFiles.length, 2);
  assert.equal(ds.duplicateGroups.length, 1);
  assert.equal(ds.duplicateGroups[0].copies.length, 2);
  assert.equal(ds.categoryBytes.archive, 22 * 1024 * 1024);
});

test('masaüstü taraması varsayılan olarak öğe sayısını sınırlamaz', () => {
  assert.equal(DEFAULT_MAX_ENTRIES, null);
});

test('açıkça istenen öğe sınırı yine uygulanır', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-limit-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (let i = 0; i < 5; i++) fs.writeFileSync(path.join(dir, i + '.txt'), 'x');

  const ds = scanPath(dir, { maxEntries: 3 });
  assert.equal(ds.truncated, true);
  assert.equal(ds.root.files, 2);
  assert.equal(ds.limits.maxEntries, 3);
});

test('sembolik bağlantıları ve Windows junction döngülerini takip etmez', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-link-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'file.txt'), 'taxdisc');
  fs.symlinkSync(dir, path.join(dir, 'loop'), process.platform === 'win32' ? 'junction' : 'dir');
  const ds = scanPath(dir);
  assert.equal(ds.root.files, 1);
  assert.equal(ds.skippedLinks, 1);
});

test('klasör adının Chrome, Edge veya cache içermesi önbellek sayılmaz', () => {
  for (const target of ['C:/Users/A/Chrome Projects', 'C:/Users/A/Edge Documents', 'C:/Users/A/cache-research', 'C:/Users/A/Build Notes']) assert.equal(match(target), -1);
  const browser = match('C:/Users/A/AppData/Local/Google/Chrome/User Data/Default/Cache');
  assert.equal(rules[browser].name, 'Tarayıcı Önbellekleri');
  assert.equal(rules[browser].risk, 'caution');
  assert.equal(rules[match('C:/Users/A/project/node_modules')].name, 'Geliştirici Çıktıları');
  assert.equal(rules[match('C:/Users/A/file.log', true)].name, 'Loglar');
  assert.ok(rules.every(rule => rule.risk !== 'safe'));
});
test('derinlik sınırına ulaşılması diğer dalları atlatmaz', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-depth-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'a', 'deep'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'a', 'deep', 'unread.txt'), 'x');
  fs.writeFileSync(path.join(dir, 'z.txt'), 'hello');
  const ds = scanPath(dir, { maxDepth: 1 });
  assert.equal(ds.truncated, true); assert.equal(ds.root.files, 1); assert.equal(ds.root.size, 5);
});
test('sıfır baytlık dosyalar sayılır ve listede özetlenir', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-zero-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'empty.txt'), '');
  const ds = scanPath(dir);
  assert.equal(ds.root.files, 1); assert.equal(ds.root.children[0].files, 1); assert.equal(ds.root.children[0].size, 0);
});
test('yinelenen adayları ilk 60 grupta sessizce kesilmez', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-groups-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const folder of ['one', 'two']) {
    fs.mkdirSync(path.join(dir, folder));
    for (let i = 0; i < 65; i++) {
      const file = path.join(dir, folder, i + '.bin'); fs.writeFileSync(file, ''); fs.truncateSync(file, 1024 * 1024);
    }
  }
  assert.equal(scanPath(dir).duplicateGroups.length, 65);
});
test('olmayan kök veya dosya seçimi başarılı boş tarama gibi gösterilmez', () => {
  assert.throws(() => scanPath(path.join(os.tmpdir(), 'taxdisc-no-such-' + Date.now())));
  assert.throws(() => scanPath(__filename));
});
test('a directory replaced by a link after enumeration is skipped', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'taxdisc-replacement-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const root=path.join(dir,'inside'),outside=path.join(dir,'outside'),child=path.join(root,'child');fs.mkdirSync(child,{recursive:true});fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'outside.txt'),'outside');
  const readdir=fs.readdirSync.bind(fs);let replaced=false;
  const mock=t.mock.method(fs,'readdirSync',(target,options)=>{
    const entries=readdir(target,options);
    if(target===root&&options?.withFileTypes&&!replaced){replaced=true;fs.rmdirSync(child);fs.symlinkSync(outside,child,process.platform==='win32'?'junction':'dir');}
    return entries;
  });
  const ds=scanPath(root);mock.mock.restore();assert.equal(replaced,true);assert.equal(ds.root.files,0);assert.equal(ds.root.size,0);assert.equal(ds.skippedLinks,1);
});
