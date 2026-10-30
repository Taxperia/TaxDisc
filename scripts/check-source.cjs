'use strict';
const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let checked=0;
for(const directory of ['js','electron','scripts','test'])for(const name of fs.readdirSync(path.join(root,directory))){if(!/\.(js|cjs)$/.test(name))continue;acorn.parse(fs.readFileSync(path.join(root,directory,name),'utf8'),{ecmaVersion:'latest'});checked++;}
for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,name),'utf8');
  assert.ok(html.includes("script-src 'self'"));assert.ok(!html.includes("script-src 'self' 'unsafe-inline'"));assert.ok(!/<script\s*>/i.test(html));
  for(const match of html.matchAll(/<script src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])),name+': '+match[1]);
}
console.log('JavaScript syntax and local HTML script references passed ('+checked+' files).');
