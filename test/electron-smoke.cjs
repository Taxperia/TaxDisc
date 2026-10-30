'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { scanPath } = require('../electron/scanner-service.cjs');
const { digest } = require('../scripts/release-manifest.cjs');
const pkg = require('../package.json');

const projectRoot = path.resolve(__dirname, '..');
const executable = process.env.TAXDISC_EXECUTABLE || path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
const args = process.env.TAXDISC_EXECUTABLE ? [] : [projectRoot];
const cases = process.env.TAXDISC_SMOKE_CASE ? [process.env.TAXDISC_SMOKE_CASE] : ['empty', 'scanned', 'corrupt'];
for (const name of cases) {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'taxdisc-smoke-profile-'));
  const fixture = fs.mkdtempSync(path.join(projectRoot, '.taxdisc-smoke-'));
  assert.equal(path.dirname(fixture), projectRoot);
  try {
    function file(relative, size, content = 'x') {
      const target = path.join(fixture, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content); fs.truncateSync(target, size);
    }
    file('video.bin', 128 * 1024 * 1024);
    file('Belgeler/kopya.bin', 11 * 1024 * 1024, 'a');
    file('Yedek/kopya.bin', 11 * 1024 * 1024, 'b');
    file('cache/incele.tmp', 1024);
    file('Chrome Projects/önemli.txt', 4096);
    file('Klasör', 11 * 1024 * 1024);
    if (name === 'scanned') fs.writeFileSync(path.join(userData, 'last-scan.json'), JSON.stringify(scanPath(fixture)));
    if (name === 'corrupt') fs.writeFileSync(path.join(userData, 'last-scan.json'), '{broken');
    const env = { ...process.env, TAXDISC_SMOKE_TEST: '1', TAXDISC_USER_DATA_DIR: userData, TAXDISC_SMOKE_ROOT: fixture, TAXDISC_SMOKE_CASE: name };
    if (name !== 'scanned') delete env.TAXDISC_SMOKE_SCREENSHOTS;
    delete env.ELECTRON_RUN_AS_NODE;
    const result = spawnSync(executable, args, { cwd: projectRoot, env, encoding: 'utf8', timeout: 90000, windowsHide: true });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.error) throw result.error;
    assert.equal(result.status, 0, name + ': Electron çıkış kodu');
    const reportPath = path.join(userData, 'smoke-result.json');
    assert.ok(fs.existsSync(reportPath), name + ': test tamamlanma kaydı');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.equal(report.ok, true, report.error || name + ': duman testi sonucu');
    assert.equal(report.result.appVersion,pkg.version,'Unexpected application version.');
    assert.equal(report.result.electronVersion,pkg.devDependencies.electron,'Unexpected Electron runtime.');
    if(process.env.TAXDISC_EXECUTABLE)assert.equal(report.result.asarSha256,digest(path.join(projectRoot,'release/win-unpacked/resources/app.asar')),'The actual EXE contains a stale app archive.');
    if (!(result.stdout || '').includes('TAXDISC_SMOKE_OK')) process.stdout.write('TAXDISC_SMOKE_OK ' + JSON.stringify(report.result) + '\n');
  } finally {
    for (const target of [userData, fixture]) {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 });
    }
  }
}
