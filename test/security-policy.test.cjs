'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { isTrustedDocumentURL, assertTrustedSender } = require('../electron/security-policy.cjs');
const root = path.resolve(__dirname, '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
test('only maintained local pages can use the application bridge', () => {
  assert.equal(isTrustedDocumentURL(url + '#path=example', root), true);
  for (const value of ['https://github.com/Taxperia/TaxDisc','data:text/html,test',pathToFileURL(path.join(root, 'other.html')).href,pathToFileURL(path.join(root, 'assets', 'index.html')).href,url + '?external=true']) assert.equal(isTrustedDocumentURL(value, root), false);
});
test('IPC requests are bound to the expected window and top-level frame', () => {
  const frame = { url }, wc = { mainFrame: frame };
  assert.doesNotThrow(() => assertTrustedSender({ sender: wc, senderFrame: frame }, wc, root));
  assert.throws(() => assertTrustedSender({ sender: {}, senderFrame: frame }, wc, root));
  assert.throws(() => assertTrustedSender({ sender: wc, senderFrame: { url } }, wc, root));
  frame.url = 'https://example.invalid/';
  assert.throws(() => assertTrustedSender({ sender: wc, senderFrame: frame }, wc, root));
});
