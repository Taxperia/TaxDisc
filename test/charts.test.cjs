'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('rapid bar redraws ignore older animation callbacks',()=>{
  const frames=[],timers=[];
  const context={window:{},requestAnimationFrame:callback=>frames.push(callback),setTimeout:callback=>timers.push(callback),App:{fmtBytes:String}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/charts.js'),'utf8'),context);
  const element={fills:[],set innerHTML(value){this.fills=Array.from(value.matchAll(/class="bar-fill"/g),()=>({style:{width:'0%'}}));},querySelectorAll(selector){return selector==='.bar-fill'?this.fills:[];}};
  context.window.Charts.barList(element,[{label:'old',value:1}]);
  context.window.Charts.barList(element,[{label:'new one',value:10},{label:'new two',value:20}]);
  frames.forEach(callback=>callback());
  assert.doesNotThrow(()=>timers[0]());assert.equal(element.fills[0].style.width,'0%');
  timers[1]();assert.deepEqual(element.fills.map(fill=>fill.style.width),['50%','100%']);
});
