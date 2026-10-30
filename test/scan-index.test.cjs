'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { indexTree } = require('../js/scan-index.js');
test('browser scans provide large-file, duplicate, category, and temporary indexes', () => {
  const MB = 1024*1024;
  const root = {name:'Example',kind:'folder',size:22*MB+10,children:[
    {name:'copy.bin',kind:'file',size:11*MB,mod:1},
    {name:'backup',kind:'folder',size:11*MB,children:[{name:'copy.bin',kind:'file',size:11*MB,mod:2}]},
    {name:'cache',kind:'folder',size:10,children:[{name:'entry.tmp',kind:'file',size:10,mod:3}]}
  ]};
  const ds=indexTree(root);
  assert.equal(ds.largeFiles.length,2);assert.equal(ds.duplicateGroups.length,1);assert.equal(ds.categoryBytes.other,22*MB+10);
  assert.equal(ds.tempCategories.length,1);assert.equal(ds.tempCategories[0].items.length,1);assert.equal(ds.tempCategories[0].items[0].size,10);
});
