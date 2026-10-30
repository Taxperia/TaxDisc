'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {digest,verifyManifest}=require('../scripts/release-manifest.cjs');
test('release verification rejects stale archives and changed same-version executables',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'taxdisc-release-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'win-unpacked/resources'),{recursive:true});
 const archive=path.join(dir,'win-unpacked/resources/app.asar');fs.writeFileSync(archive,'archive');
 const artifacts={};for(const kind of ['setup','portable']){const name='TaxDisc-1.2.0-x64-'+kind+'.exe';fs.writeFileSync(path.join(dir,name),kind);artifacts[name]=digest(path.join(dir,name));}
 fs.writeFileSync(path.join(dir,'build-manifest.json'),JSON.stringify({version:'1.2.0',asarSha256:digest(archive),artifacts}));
 assert.doesNotThrow(()=>verifyManifest(dir,'1.2.0'));
 fs.writeFileSync(archive,'new archive');assert.throws(()=>verifyManifest(dir,'1.2.0'));
 fs.writeFileSync(archive,'archive');fs.writeFileSync(path.join(dir,'TaxDisc-1.2.0-x64-portable.exe'),'changed');assert.throws(()=>verifyManifest(dir,'1.2.0'));
});
