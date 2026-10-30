'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const asar = require('@electron/asar');
const { verifyManifest } = require('./release-manifest.cjs');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const archive = path.join(root, 'release', 'win-unpacked', 'resources', 'app.asar');
const packaged = new Set(asar.listPackage(archive).map(name => name.replace(/^[/\\]+/, '').replace(/\\/g, '/')));
const files = fs.readdirSync(root).filter(name => name.endsWith('.html'));
function collect(directory) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = directory + '/' + entry.name;
    if (entry.isDirectory()) collect(file); else files.push(file);
  }
}
for (const directory of ['electron', 'js', 'css', 'assets']) collect(directory);
files.push('README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md');
for (const file of files) {
  assert.ok(packaged.has(file), 'Missing packaged file: ' + file);
  assert.ok(asar.extractFile(archive, file).equals(fs.readFileSync(path.join(root, file))), 'Stale packaged file: ' + file);
}
const manifest = JSON.parse(asar.extractFile(archive, 'package.json'));
assert.equal(manifest.version, pkg.version);
assert.equal(manifest.main, pkg.main);
const hashes = [];
verifyManifest(path.join(root,'release'),pkg.version);
for (const kind of ['setup', 'portable']) {
  const name = 'TaxDisc-' + pkg.version + '-x64-' + kind + '.exe';
  const target = path.join(root, 'release', name);
  assert.ok(fs.statSync(target).size > 10 * 1024 * 1024, 'Invalid EXE: ' + name);
  hashes.push(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex') + '  ' + name);
}
fs.writeFileSync(path.join(root, 'release', 'SHA256SUMS.txt'), hashes.join('\r\n') + '\r\n');
process.stdout.write(JSON.stringify({ version: pkg.version, sourceFilesVerified: files.length, artifactsHashed: 2, buildManifestMatches: true, signatureVerified: false, hashes: 'release/SHA256SUMS.txt' }) + '\n');
