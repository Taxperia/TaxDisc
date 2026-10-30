'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I18n = require('../js/i18n.js');
test('English and Turkish authored labels, counts, and locale are selectable', () => {
  I18n.setLanguage('en');
  assert.equal(I18n.t('Klasör Tara'), 'Scan Folder');
  assert.equal(I18n.f('<button title="Klasör Tara">Klasör Tara</button>'), '<button title="Scan Folder">Scan Folder</button>');
  assert.equal(I18n.count(1,'file'),'1 file'); assert.equal(I18n.count(2,'file'),'2 files');
  assert.equal(I18n.locale,'en-US');
  I18n.setLanguage('tr');
  assert.equal(I18n.f('Klasör Tara'),'Klasör Tara'); assert.equal(I18n.count(2,'file'),'2 dosya'); assert.equal(I18n.locale,'tr-TR');
  assert.throws(()=>I18n.setLanguage('unsupported')); I18n.setLanguage('en');
});
