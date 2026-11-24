const test=require('node:test');
const assert=require('node:assert/strict');
const lab=require('./assembly-engine.js');

const apply=(s,action,target,connector)=>{
  const result=lab.act(s,action,target,connector);
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
  for(const key of Object.keys(lab.cables))if(!omit.includes(key))apply(s,'attachCable',key,lab.cables[key].name);
}
function turnOn(s){apply(s,'connectMains');apply(s,'switchPsu');apply(s,'powerOn');}
function unplug(s){if(s.power)apply(s,'powerOff');apply(s,'switchPsu');apply(s,'disconnectMains');}

test('finish verifies a booted PC in the current revision, including with the panel open',()=>{
  const s=lab.create('build');
  assert.ok(Object.keys(lab.parts).every(id=>!lab.has(s,id)));
  mount(s);wire(s);turnOn(s);
  assert.equal(lab.display(s),'ready');
  assert.equal(apply(s,'checkDisplay').passed,true);
  apply(s,'detachCable','monitor');apply(s,'attachCable','monitor');
  assert.notEqual(s.testedAt,s.revision);
  apply(s,'finish');
  assert.equal(s.complete,true);assert.equal(s.testedAt,s.revision);
  assert.equal(s.evidence.at(-1).passed,true);assert.equal(s.log.at(-2).action,'checkDisplay');
});

test('guide follows actual hardware state through all prerequisites and into completion',()=>{
  const s=lab.create('build'), steps=[];
  for(let attempts=0;!s.complete&&attempts<30;attempts++){
    const step=lab.nextBuildStep(s);
    steps.push(step.action+(step.wire?':'+step.wire:''));
    apply(s,step.action,step.target);
  }
  assert.ok(s.complete);
  assert.deepEqual(steps.slice(0,7),['openPanel','installBOARD','toggleSocket','installCPU','toggleSocket','applyPaste','installCOOLER']);
  assert.deepEqual(steps.filter(action=>action.startsWith('attachCable:')),Object.keys(lab.cables).map(id=>'attachCable:'+id));
  assert.deepEqual(steps.slice(-5),['closePanel','connectMains','switchPsu','powerOn','finish']);
  assert.equal(lab.nextBuildStep(s),null);
});

test('an early finish reports the exact missing part, cable or power step',()=>{
  const s=lab.create('build');
  assert.match(lab.act(s,'finish').text,/Материнская плата/);
  mount(s);wire(s,['eps','cpuFan']);
  assert.match(lab.act(s,'finish').text,/EPS CPU 8-pin, CPU_FAN/);
  apply(s,'attachCable','eps');apply(s,'attachCable','cpuFan');
  assert.match(lab.act(s,'finish').text,/Сетевой шнур не подключён/);
  apply(s,'connectMains');assert.match(lab.act(s,'finish').text,/Блок питания выключен/);
  apply(s,'switchPsu');assert.match(lab.act(s,'finish').text,/Нажми Power/);
  assert.equal(s.complete,false);
});

test('unaided assembly validates manual destinations and suppresses hints and repair instructions',()=>{
  const s=lab.create('solo');
  assert.equal(lab.nextBuildStep(s),null);
  assert.deepEqual(lab.availableMounts(s),['ATX TRAY','PSU BAY','FAN MOUNT']);
  assert.equal(lab.act(s,'requestHint').ok,false);
  assert.equal(s.hintCount,0);
  assert.equal(s.log.length,0);
  assert.equal(lab.act(s,'finish').text,'Сборка ещё не прошла проверку.');
  mount(s);
  assert.equal(lab.act(s,'attachCable','eps','ATX 24-pin').text,'Действие не выполнено.');
  assert.equal(s.wiring.eps,false);
  wire(s);turnOn(s);
  assert.equal(apply(s,'finish').passed,true);
});

test('monitor power, HDMI and the selected input control the visible result without powering off the PC',()=>{
  const s=lab.create('build');
  mount(s);wire(s,['monitor']);turnOn(s);
  assert.equal(lab.monitorDisplay(s).kind,'standby');
  apply(s,'attachCable','monitor');
  apply(s,'monitorPower');
  assert.equal(lab.display(s),'ready');
  assert.equal(lab.monitorDisplay(s).kind,'off');
  assert.equal(apply(s,'checkDisplay').passed,false);
  assert.match(lab.act(s,'finish').text,/Включи монитор/);
  assert.equal(lab.nextBuildStep(s).action,'monitorPower');
  apply(s,'monitorPower');apply(s,'monitorInput');
  assert.equal(lab.monitorDisplay(s).title,'Нет сигнала');
  assert.equal(lab.nextBuildStep(s).action,'monitorInput');
  assert.match(lab.act(s,'finish').text,/DisplayPort/);
  apply(s,'monitorInput');
  assert.equal(lab.monitorDisplay(s).kind,'desktop');
  assert.equal(apply(s,'finish').passed,true);
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
