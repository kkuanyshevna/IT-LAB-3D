(function() {
  'use strict';
  const {parts,cables,tasks,has,live,display}=window.ITLAB_ASSEMBLY;
  const button=(action,label,target='',style='secondary')=>`<button class="${style}" data-action="${action}"${target?` data-target="${target}"`:''}>${label}</button>`;
  const taskOptions=(selected,includeQuick)=>Object.entries(tasks).map(([id,task])=>`<option value="${id}"${id===selected?' selected':''}>${task.title}</option>`).join('')+(includeQuick?`<option value="quick"${selected==='quick'?' selected':''}>Быстрая сборка RAM, SSD и GPU</option>`:'');
  const taskSelector=selected=>`<label for="assemblyTask">Задание</label><select id="assemblyTask" class="assembly-select">${taskOptions(selected,true)}</select>`;

  function choices(entries,selected,installed,attribute){
    return `<div class="assembly-choices">${Object.entries(entries).map(([id,item])=>`<button type="button" ${attribute}="${id}" aria-pressed="${id===selected}"><span class="assembly-dot${installed(id)?' placed':''}" aria-hidden="true">${installed(id)?'✓':'·'}</span><span>${item.name}</span></button>`).join('')}</div>`;
  }
  function hardware(s,selected){
    const part=parts[selected],installed=has(s,selected),action=installed?'remove':'install';
    const socket=['CPU','COOLER'].includes(selected)?`<div class="assembly-pair">${button('toggleSocket',s.socketOpen?'Закрыть фиксатор':'Открыть фиксатор')}${has(s,'CPU')?(s.paste==='none'?button('applyPaste','Нанести термопасту'):button('cleanPaste','Очистить термопасту')):''}</div>`:'';
    return `${choices(parts,selected,id=>has(s,id),'data-assembly-part')}
      <div class="assembly-detail"><h3>${part.name}</h3><p>${installed?part.remove:part.place}</p>${socket}
      ${s.panelOpen?`<p class="assembly-drag-hint">${installed?'Перетащи деталь на верстак или сними кнопкой.':'Перетащи деталь в подсвеченное место или установи кнопкой.'}</p>`:''}
      ${button(action+selected,installed?'Снять деталь':'Установить деталь',part.slot,installed?'secondary full':'primary full')}</div>`;
  }
  function wiring(s,selected){
    const cable=cables[selected],connected=s.wiring[selected];
    return `${choices(cables,selected,id=>s.wiring[id],'data-assembly-wire')}
      <div class="assembly-detail"><h3>${cable.name}</h3><p>${cable.note}</p>
      ${cable.needs.every(id=>has(s,id))&&(s.panelOpen||selected==='monitor')?'<p class="assembly-drag-hint">Нажми на подсвеченный разъём в 3D или используй кнопки.</p>':''}
      <div class="assembly-pair">${button('inspectCable','Проверить кабель',selected)}
      ${button(connected?'detachCable':'attachCable',connected?'Отсоединить кабель':'Подключить кабель',selected,connected?'secondary':'primary')}</div></div>`;
  }
  function render(s,view){
    const count=Object.keys(parts).filter(id=>has(s,id)).length;
    const connected=Object.values(s.wiring).filter(Boolean).length;
    const post=display(s);
    return `<div class="assembly-workbench">
      <h2>Полная сборка ПК</h2>${taskSelector(s.task)}
      <p class="lesson-copy">${tasks[s.task].goal}</p>
      ${s.complete?'<div class="complete-box"><h3>Практика пройдена ✓</h3></div>':''}
      <div class="assembly-progress"><span>Детали <b>${count} / ${Object.keys(parts).length}</b></span><span>Кабели <b>${connected} / ${Object.keys(cables).length}</b></span><span class="${post==='ready'?'good':''}">${post==='ready'?'POST пройден':live(s)&&s.wiring.atx?'Дежурное питание':'Нет дежурного питания'}</span></div>
      <div class="assembly-pair">${button(s.panelOpen?'closePanel':'openPanel',s.panelOpen?'Вернуть панель':'Снять панель')}${button('checkDisplay','Проверить экран')}</div>
      <details class="assembly-power"${view.powerOpen?' open':''}><summary>Питание и запуск</summary><div class="assembly-pair">
        ${button(s.mains?'disconnectMains':'connectMains',s.mains?'Отсоединить сетевой шнур':'Подключить сетевой шнур')}
        ${button('switchPsu',s.psuSwitch?'Выключить блок питания':'Включить блок питания')}
        ${button(s.power?'powerOff':'powerOn',s.power?'Выключить ПК':'Нажать Power','','primary')}
      </div></details>
      <div class="assembly-tabs" role="group" aria-label="Действия сборки">
        <button type="button" data-assembly-tab="parts" aria-pressed="${view.tab==='parts'}">Детали</button>
        <button type="button" data-assembly-tab="wires" aria-pressed="${view.tab==='wires'}">Кабели</button>
      </div>
      ${view.tab==='parts'?hardware(s,view.part):wiring(s,view.wire)}
      ${s.complete||s.task==='free'?'':button('finish','Завершить задание','','secondary full')}
      <button id="restart" class="quiet full">Начать заново ↻</button>
    </div>`;
  }
  window.ITLAB_ASSEMBLY_VIEW={render,taskSelector};
})();
