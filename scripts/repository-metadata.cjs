'use strict';
const {spawnSync}=require('node:child_process');
const settings=require('../.github/repository-metadata.json');
const repo=process.env.GITHUB_REPOSITORY || 'Taxperia/TaxDisc';
if(repo!=='Taxperia/TaxDisc')throw new Error('This metadata configuration targets Taxperia/TaxDisc only.');
let failed=false;
for(const [method,endpoint,body] of [['PATCH','repos/'+repo,{description:settings.description}],['PUT','repos/'+repo+'/topics',{names:settings.topics}]]){
 const result=spawnSync('gh',['api','--method',method,endpoint,'--input','-'],{input:JSON.stringify(body),encoding:'utf8',windowsHide:true,timeout:30000});
 if(result.error || result.status!==0){failed=true;process.stderr.write('Repository '+(method==='PATCH'?'description':'topics')+' could not be updated. An authenticated owner/admin credential may be required.\n');}
 else process.stdout.write('Repository '+(method==='PATCH'?'description':'topics')+' updated.\n');
}
process.exitCode=failed?1:0;
