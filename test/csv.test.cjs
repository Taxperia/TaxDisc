'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { serialize } = require('../js/csv.js');

function parse(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\ufeff' && i === 0) continue;
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted;
    } else if (c === ';' && !quoted) { row.push(value); value = ''; }
    else if (c === '\r' && text[i + 1] === '\n' && !quoted) { row.push(value); rows.push(row); row = []; value = ''; i++; }
    else value += c;
  }
  assert.equal(quoted, false);
  return rows;
}

test('Türkçe ondalık virgül ve özel dosya adları rapor sütunlarını bozmaz', () => {
  const source = [['Klasör', 'Bayt', 'Pay (%)', 'Adet', 'Tarih'], ['Türkçe;"Özel"\nKlasör', 1024, '12,34', 2, '30 Eki 2026']];
  const csv = serialize(source);
  assert.ok(csv.startsWith('\ufeff'));
  assert.deepEqual(parse(csv), source.map(row => row.map(String)));
});

test('dosya adları hesap tablosu formülü olarak çalıştırılmaz', () => {
  assert.deepEqual(parse(serialize([['=1+1', '+test', '@SUM(A1)', '  -test', 'normal', 10]])), [["'=1+1", "'+test", "'@SUM(A1)", "'  -test", 'normal', '10']]);
});
