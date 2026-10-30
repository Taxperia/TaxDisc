'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const I18n = require('../js/i18n.js');
const { rules: TEMP_RULES } = require('../js/temp-rules.js');
const MAX_DATASET_BYTES = 128 * 1024 * 1024;
function readJson(target, maximum) {
  const fd = fs.openSync(target, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    if (size > maximum) throw new Error('Saved data exceeds the supported size.');
    const buffer = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const count = fs.readSync(fd, buffer, offset, size - offset, offset);
      if (!count) break;
      offset += count;
    }
    return JSON.parse(buffer.toString('utf8', 0, offset));
  } finally { fs.closeSync(fd); }
}
const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
function validDataset(ds) {
  if (!ds || ds.schemaVersion !== 5 || ds.source !== 'desktop' || !path.isAbsolute(ds.scanRoot || '') || !Number.isFinite(ds.scannedAt) || ds.root?.kind !== 'folder') return false;
  const stack = [{ node: ds.root, depth: 0 }]; let count = 0;
  while (stack.length) {
    const { node, depth } = stack.pop();
    if (!node || ++count > 1000000 || depth > 81 || typeof node.name !== 'string' || node.name.length > 32767 || !['file','folder','aggregate'].includes(node.kind) || !nonnegative(node.size)) return false;
    if (node.path && !isWithin(ds.scanRoot, node.path)) return false;
    if (node.access != null && node.access !== 'Limited') return false;
    if (node.mod != null && !Number.isFinite(node.mod)) return false;
    if (node.files != null && !nonnegative(node.files)) return false;
    if (node.folders != null && !nonnegative(node.folders)) return false;
    if (node.kind === 'folder' && !Array.isArray(node.children)) return false;
    if (node.children != null) {
      if (!Array.isArray(node.children)) return false;
      for (const child of node.children) stack.push({ node: child, depth: depth + 1 });
    }
  }
  const file = item => item && typeof item.name === 'string' && isWithin(ds.scanRoot, item.path) && nonnegative(item.size) && (item.mod == null || Number.isFinite(item.mod));
  if (!Array.isArray(ds.largeFiles) || !ds.largeFiles.every(file)) return false;
  if (!Array.isArray(ds.duplicateGroups) || !ds.duplicateGroups.every(group => typeof group.name === 'string' && nonnegative(group.size) && Array.isArray(group.copies) && group.copies.length >= 2 && group.copies.every(copy => isWithin(ds.scanRoot, copy.path) && (copy.mod == null || Number.isFinite(copy.mod))))) return false;
  if (!Array.isArray(ds.tempCategories) || !ds.tempCategories.every(category => {
    const rule = TEMP_RULES.find(value => value.name === category.name);
    return rule && category.icon === rule.icon && category.color === rule.color && category.risk === rule.risk && Array.isArray(category.items) && category.items.every(file);
  })) return false;
  if (!ds.categoryBytes || typeof ds.categoryBytes !== 'object' || !Object.values(ds.categoryBytes).every(nonnegative)) return false;
  return ds.volume == null || (nonnegative(ds.volume.total) && nonnegative(ds.volume.free) && ds.volume.free <= ds.volume.total);
}

function emptyDataset(requiresRescan = false) {
  return { schemaVersion: 5, source: 'empty', requiresRescan, scannedAt: null,
    scanRoot: null, warnings: 0,
    root: { name: I18n.f('Henüz tarama yapılmadı'), path: null, kind: 'folder', size: 0,
      files: 0, folders: 0, mod: null, children: [] } };
}

function isWithin(root, target) {
  if (typeof root !== 'string' || typeof target !== 'string' || !path.isAbsolute(target)) return false;
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

function normalizePlan(items, dataset) {
  if (!Array.isArray(items) || items.length > 50000) throw new Error(I18n.f('Ayıklama listesi geçersiz veya çok büyük.'));
  const byPath = new Map();
  for (const item of items) {
    if (!item || !isWithin(dataset.scanRoot, item.path) || !Number.isSafeInteger(item.size) || item.size < 0) {
      throw new Error(I18n.f('Liste yalnızca geçerli taramadaki öğeleri içerebilir.'));
    }
    const target = path.resolve(item.path);
    const key = process.platform === 'win32' ? target.toLowerCase() : target;
    if (!byPath.has(key)) byPath.set(key, { name: path.basename(target) || target, path: target, size: item.size });
  }
  return Array.from(byPath.entries()).filter(([key]) => {
    let parent = path.dirname(key);
    while (parent !== key) {
      if (byPath.has(parent)) return false;
      key = parent; parent = path.dirname(key);
    }
    return true;
  }).map(([, item]) => item);
}

class StateStore {
  constructor(directory) { this.directory = directory; this.cached = null; }
  get datasetPath() { return path.join(this.directory, 'last-scan.json'); }
  get planPath() { return path.join(this.directory, 'review-plan.json'); }
  load() {
    if (this.cached) return this.cached;
    try {
      const dataset = readJson(this.datasetPath, MAX_DATASET_BYTES);
      if (dataset.schemaVersion === 5 && dataset.source === 'empty') this.cached = emptyDataset();
      else if (!validDataset(dataset)) {
        this.cached = emptyDataset(true);
      } else this.cached = dataset;
    } catch (error) {
      this.cached = emptyDataset(error.code !== 'ENOENT');
    }
    return this.cached;
  }
  async atomicWrite(target, value) {
    const text = JSON.stringify(value);
    const maximum = target === this.datasetPath ? MAX_DATASET_BYTES : 16 * 1024 * 1024;
    if (Buffer.byteLength(text, 'utf8') > maximum) throw new Error(I18n.f('Kayıt çok büyük. Önceki kayıt korundu. Daha küçük bir klasör tarayın.'));
    await fs.promises.mkdir(this.directory, { recursive: true });
    const temporary = target + '.tmp';
    try {
      await fs.promises.writeFile(temporary, text, 'utf8');
      await fs.promises.rename(temporary, target);
    } finally {
      await fs.promises.unlink(temporary).catch(() => {});
    }
  }
  async save(dataset) {
    if (!dataset.scanId) dataset.scanId = randomUUID();
    await this.atomicWrite(this.datasetPath, dataset);
    this.cached = dataset;
    // The timestamp in the plan also protects against a failed/unavailable unlink.
    await fs.promises.unlink(this.planPath).catch(() => {});
  }
  loadPlan() {
    const ds = this.load();
    try {
      if (ds.source !== 'desktop') return [];
      const plan = readJson(this.planPath, 16 * 1024 * 1024);
      if (plan.scannedAt !== ds.scannedAt || plan.scanRoot !== ds.scanRoot || (plan.scanId || null) !== (ds.scanId || null)) return [];
      return normalizePlan(plan.items, ds);
    } catch (_) { return []; }
  }
  async savePlan(items) {
    const ds = this.load();
    if (ds.source !== 'desktop') throw new Error(I18n.f('Önce bir klasör tarayın.'));
    const normalized = normalizePlan(items, ds);
    await this.atomicWrite(this.planPath, { scanRoot: ds.scanRoot, scannedAt: ds.scannedAt, scanId: ds.scanId || null, items: normalized });
    return normalized;
  }
  async clear() {
    // Commit an empty record before cleanup: an unlink failure cannot revive old data.
    const empty = emptyDataset();
    await this.atomicWrite(this.datasetPath, empty);
    this.cached = empty;
    let cleanupWarning = false;
    for (const target of [this.planPath, this.datasetPath]) {
      try { await fs.promises.unlink(target); } catch (error) { if (error.code !== 'ENOENT') cleanupWarning = true; }
    }
    return { ...empty, cleanupWarning };
  }
}

module.exports = { StateStore, emptyDataset, isWithin, normalizePlan, validDataset, readJson };
