'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { scanPath } = require('../electron/scanner-service.cjs');

const workspace = path.resolve(__dirname, '..');
const root = fs.mkdtempSync(path.join(workspace, '.taxdisc-benchmark-'));
assert.equal(path.dirname(root), workspace);
const count = Number(process.env.TAXDISC_BENCHMARK_FILES || 20000);
const payload = 'taxdisc';
assert.ok(Number.isInteger(count) && count >= 100 && count <= 200000);
try {
  const creation = performance.now();
  for (let i = 0; i < 100; i++) fs.mkdirSync(path.join(root, 'folder-' + i));
  for (let i = 0; i < count; i++) fs.writeFileSync(path.join(root, 'folder-' + (i % 100), 'file-' + i + '.txt'), payload);
  const before = process.memoryUsage();
  const start = performance.now();
  const dataset = scanPath(root);
  const scanMs = performance.now() - start;
  assert.equal(dataset.root.files, count);
  assert.equal(dataset.root.size, count * Buffer.byteLength(payload));
  assert.equal(dataset.root.folders, 100);
  assert.equal(dataset.truncated, false);
  assert.equal(dataset.warnings, 0);
  const result = { generatedAt: new Date().toISOString(), files: count, folders: 100, fixtureCreationMs: Math.round(start - creation), scanMs: Math.round(scanMs), filesPerSecond: Math.round(count / (scanMs / 1000)), heapDeltaMB: Number(((process.memoryUsage().heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)), datasetBytes: Buffer.byteLength(JSON.stringify(dataset)), platform: process.platform, node: process.version };
  fs.mkdirSync(path.join(workspace, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'artifacts', 'benchmark.json'), JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} finally {
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
