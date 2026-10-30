'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const digest=target=>crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
function verifyManifest(directory, version) {
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'build-manifest.json'),'utf8'));
  assert.equal(manifest.version,version,'Build manifest version mismatch; rebuild distributions.');
  assert.equal(digest(path.join(directory,'win-unpacked/resources/app.asar')),manifest.asarSha256,'Unpacked app changed after distribution build.');
  for(const kind of ['setup','portable']){
    const name='TaxDisc-'+version+'-x64-'+kind+'.exe';
    assert.equal(digest(path.join(directory,name)),manifest.artifacts[name],'Distribution differs from its build manifest: '+name);
  }
  return manifest;
}
async function afterBuild(context) {
  const root=path.resolve(__dirname,'..'),pkg=require('../package.json'),directory=path.resolve(context.outDir);
  const names=['setup','portable'].map(kind=>'TaxDisc-'+pkg.version+'-x64-'+kind+'.exe');
  const built=new Set(context.artifactPaths.map(file=>path.basename(file)));
  if(!names.every(name=>built.has(name))) return [];
  const artifacts=Object.fromEntries(names.map(name=>[name,digest(path.join(directory,name))]));
  const manifest={version:pkg.version,electron:pkg.devDependencies.electron,createdAt:new Date().toISOString(),asarSha256:digest(path.join(directory,'win-unpacked/resources/app.asar')),artifacts,authenticode:'Not signed unless an external signing configuration was supplied.'};
  fs.writeFileSync(path.join(directory,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.copyFileSync(path.join(root,'docs/RELEASE-NOTES.md'),path.join(directory,'RELEASE-NOTES.md'));
  fs.copyFileSync(path.join(root,'LICENSE'),path.join(directory,'LICENSE.txt'));
  return [];
}
module.exports={digest,verifyManifest,afterBuild};
