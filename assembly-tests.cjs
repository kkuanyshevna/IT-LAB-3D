const test=require('node:test');
const assert=require('node:assert/strict');
const lab=require('./assembly-engine.js');

const apply=(s,action,target)=>{
  const result=lab.act(s,action,target);
  assert.equal(result.ok,true,`${action}: ${result.text}`);
  return result;
};
const put=(s,id)=>apply(s,'install'+id,lab.parts[id].slot);
function mount(s){
  apply(s,'openPanel');put(s,'BOARD');apply(s,'toggleSocket');put(s,'CPU');
  apply(s,'toggleSocket');apply(s,'applyPaste');put(s,'COOLER');
  for(const id of ['RAM','SSD','GPU','PSU','FANS'])put(s,id);
}
function wire(s,omit=[]){
  for(const key of Object.keys(lab.cables))if(!omit.includes(key))apply(s,'attachCable',key);
}
function turnOn(s){apply(s,'connectMains');apply(s,'switchPsu');apply(s,'powerOn');}
function unplug(s){if(s.power)apply(s,'powerOff');apply(s,'switchPsu');apply(s,'disconnectMains');}

test('empty case can reach POST and finish only after rechecking the current build',()=>{
  const s=lab.create('build');
  assert.ok(Object.keys(lab.parts).every(id=>!lab.has(s,id)));
  mount(s);wire(s);apply(s,'closePanel');turnOn(s);
  assert.equal(lab.display(s),'ready');
  assert.equal(lab.act(s,'finish').ok,false);
  assert.equal(apply(s,'checkDisplay').passed,true);
  apply(s,'detachCable','monitor');apply(s,'attachCable','monitor');
  assert.equal(lab.act(s,'finish').ok,false);
  apply(s,'checkDisplay');apply(s,'finish');assert.equal(s.complete,true);
});

test('socket, paste, correct mount, cable and live-power interlocks protect the assembly',()=>{
  const s=lab.create('free');
  assert.equal(lab.act(s,'installBOARD','ATX TRAY').ok,false);
  apply(s,'openPanel');
  assert.equal(lab.act(s,'installCPU','LGA').ok,false);
  put(s,'BOARD');
  assert.equal(lab.act(s,'installCPU','DIMM').ok,false);
  assert.equal(lab.act(s,'installCPU','LGA').ok,false);
  apply(s,'toggleSocket');put(s,'CPU');
  assert.equal(lab.act(s,'installCOOLER','CPU MOUNT').ok,false);
  apply(s,'toggleSocket');apply(s,'applyPaste');put(s,'COOLER');
  apply(s,'attachCable','cpuFan');
  assert.equal(lab.act(s,'removeCOOLER').ok,false);
  put(s,'PSU');apply(s,'connectMains');
  assert.equal(lab.act(s,'installRAM','DIMM').ok,false);
});

test('diagnosis must observe the EPS symptom before confirming the repair',()=>{
  const s=lab.create('diagnose');
  assert.equal(lab.display(s),'noEps');
  assert.equal(apply(s,'checkDisplay').passed,false);
  unplug(s);apply(s,'openPanel');apply(s,'attachCable','eps');apply(s,'closePanel');turnOn(s);
  assert.equal(apply(s,'checkDisplay').passed,true);apply(s,'finish');
  assert.equal(s.complete,true);
});

test('disassembly returns an occupied case to zero parts and cables',()=>{
  const s=lab.create('strip');
  assert.equal(lab.act(s,'openPanel').ok,false);
  unplug(s);apply(s,'openPanel');
  assert.equal(lab.act(s,'removeBOARD').ok,false);
  for(const key of Object.keys(lab.cables))apply(s,'detachCable',key);
  apply(s,'removeCOOLER');apply(s,'cleanPaste');apply(s,'toggleSocket');
  for(const id of ['CPU','RAM','SSD','GPU','FANS','PSU','BOARD'])apply(s,'remove'+id);
  apply(s,'finish');
  assert.equal(s.complete,true);assert.ok(Object.keys(lab.parts).every(id=>!lab.has(s,id)));
});

test('different missing connections produce different observable startup stages',()=>{
  const s=lab.create('free');mount(s);wire(s,['frontPanel','cpuFan']);
  turnOn(s);assert.equal(lab.display(s),'noButton');
  unplug(s);apply(s,'attachCable','frontPanel');turnOn(s);
  assert.equal(s.power,false);assert.equal(lab.display(s),'noCooling');
  unplug(s);apply(s,'attachCable','cpuFan');apply(s,'removeSSD');turnOn(s);
  assert.equal(lab.display(s),'noSsd');
});
