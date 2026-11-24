(function(root, factory) {
  const assembly = factory();
  if (typeof module === 'object' && module.exports) module.exports = assembly;
  else root.ITLAB_ASSEMBLY = assembly;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';
  const parts = {
    BOARD: {name:'Материнская плата', key:'boardInstalled', slot:'ATX TRAY', place:'Закрепи плату на стойках корпуса. Они отделяют её обратную сторону от металла.', remove:'Открути плату и сними её со стоек корпуса.'},
    CPU: {name:'Процессор', key:'cpuInstalled', slot:'LGA', place:'Открой сокет и совмести ключи CPU и сокета. Затем закрой фиксатор.', remove:'После снятия кулера очисти термопасту, открой фиксатор и вынь CPU.'},
    COOLER: {name:'Кулер процессора', key:'coolerInstalled', slot:'CPU MOUNT', place:'Закрой фиксатор, нанеси термопасту и закрепи кулер. Подключение CPU_FAN делается отдельно.', remove:'Отсоедини CPU_FAN и сними кулер с крепления.'},
    RAM: {name:'Оперативная память', key:'ramInstalled', slot:'DIMM', place:'Совмести ключ RAM со слотом DIMM и зафиксируй модуль защёлками.', remove:'Отпусти защёлки DIMM и вынь память.'},
    SSD: {name:'SSD M.2', key:'ssdInstalled', slot:'M.2', place:'Вставь накопитель NVMe в M.2 и закрепи его винтом.', remove:'Освободи крепёж M.2 и вынь накопитель.'},
    GPU: {name:'Видеокарта', key:'gpuInstalled', slot:'PCIe', place:'Установи карту в PCIe x16 и закрепи на корпусе. Отдельное питание подключается позже.', remove:'Отсоедини питание и монитор, освободи фиксатор PCIe и вынь карту.'},
    PSU: {name:'Блок питания', key:'psuInstalled', slot:'PSU BAY', place:'Закрепи закрытый блок питания в нижнем отсеке корпуса.', remove:'Отключи сетевой шнур и все кабели блока питания перед снятием.'},
    FANS: {name:'Вентиляторы корпуса', key:'fansInstalled', slot:'FAN MOUNT', place:'Установи комплект корпусных вентиляторов. Передние подают воздух, задний выводит его.', remove:'Отключи SYS_FAN и сними вентиляторы корпуса.'}
  };
  const cables = {
    atx: {name:'ATX 24-pin', needs:['BOARD','PSU'], note:'Основное питание материнской платы.'},
    eps: {name:'EPS CPU 8-pin', needs:['BOARD','PSU'], note:'Отдельное питание цепей процессора.'},
    gpu: {name:'PCIe GPU 8-pin', needs:['GPU','PSU'], note:'Дополнительное питание видеокарты.'},
    cpuFan: {name:'CPU_FAN', needs:['BOARD','COOLER'], note:'Подключение вентилятора кулера к плате.'},
    sysFan: {name:'SYS_FAN', needs:['BOARD','FANS'], note:'Подключение корпусных вентиляторов.'},
    frontPanel: {name:'F_PANEL', needs:['BOARD'], note:'Кнопка Power на корпусе передаёт сигнал через PWR_SW.'},
    monitor: {name:'HDMI', needs:['GPU'], note:'Видеовыход видеокарты соединяется с монитором.'}
  };
  const tasks = {
    build: {title:'Собрать ПК с нуля', goal:'Установи все детали, подключи кабели и проверь запуск учебной системы.'},
    strip: {title:'Разобрать ПК', goal:'Обесточь компьютер, отсоедини кабели и освободи корпус от всех деталей.'},
    diagnose: {title:'Диагностика: нет изображения', goal:'У этого ПК вентиляторы вращаются, но изображения нет. Зафиксируй симптом, найди причину и подтверди запуск.'},
    free: {title:'Свободная сборка', goal:'Собирай и разбирай ПК в своём порядке. Меняй по одному условию и проверяй результат.'}
  };
  const post = {
    off: {status:'ПК выключен', screen:'Нет сигнала', result:'ПК выключен. Нажми Power перед проверкой экрана.'},
    noAc: {status:'Нет дежурного питания', screen:'Нет сигнала', result:'Дежурного питания нет. Проверь шнур питания, выключатель блока питания и ATX 24-pin.'},
    noButton: {status:'Power не сработала', screen:'Нет сигнала', result:'Нажатие Power не дошло до платы. Проверь подключение PWR_SW к F_PANEL.'},
    noEps: {status:'Вентиляторы вращаются, POST не пройден', screen:'Нет изображения', result:'Вентиляторы вращаются, но POST не пройден. На экране нет изображения.'},
    noCpu: {status:'CPU не готов к запуску', screen:'Нет изображения', result:'CPU не установлен или фиксатор сокета открыт. Стенд остановил запуск.'},
    noCooling: {status:'Запуск остановлен', screen:'Нет изображения', result:'Стенд остановил запуск. Проверь крепление кулера и подключение CPU_FAN.'},
    noRam: {status:'POST остановлен на RAM', screen:'Нет изображения', result:'Память не обнаружена. Проверь установку RAM в DIMM.'},
    noGpu: {status:'POST остановлен на графике', screen:'Нет изображения', result:'Графика недоступна. Проверь видеокарту и её питание PCIe.'},
    noMonitor: {status:'Монитор не подключён', screen:'Нет сигнала', result:'Графика инициализирована. Проверь HDMI от видеокарты до монитора.'},
    noSsd: {status:'Открылась прошивка UEFI', screen:'Загрузчик не найден', result:'UEFI показывает изображение, но загрузчик не найден. Проверь SSD M.2.'},
    ready: {status:'Учебная система загрузилась', screen:'Система готова', result:'POST пройден, появился экран системы. Запуск подтверждён.'}
  };

  function create(task='build') {
    if (!Object.hasOwn(tasks,task)) task='build';
    const assembled=task==='strip'||task==='diagnose';
    return {
      mode:'assembly', task, power:task==='diagnose', panelOpen:false, socketOpen:false,
      paste:assembled?'used':'none', mains:assembled, psuSwitch:assembled,
      ...Object.fromEntries(Object.values(parts).map(part=>[part.key,assembled])),
      wiring:Object.fromEntries(Object.keys(cables).map(key=>[key,assembled&&!(task==='diagnose'&&key==='eps')])),
      cableConnected:false, complete:false, errors:0, log:[], evidence:[], hintCount:0,
      revision:0, testedAt:-1, observedSymptom:false, startAttempt:false
    };
  }

  function has(s,id) {return Boolean(parts[id]&&s[parts[id].key]);}
  function live(s) {return s.mains&&s.psuSwitch&&has(s,'PSU');}
  function accessIssue(s){
    if(s.power||s.mains)return 'Выключи ПК и отсоедини сетевой шнур перед работой внутри корпуса.';
    if(!s.panelOpen)return 'Сначала сними боковую панель.';
    return '';
  }
  function installationIssue(s,id,target){
    const blocked=accessIssue(s);
    if(blocked)return blocked;
    if(has(s,id))return 'Этот компонент уже установлен.';
    if(target!==parts[id].slot)return 'Неверное место установки. Выбери подходящее крепление.';
    if(!['BOARD','PSU','FANS'].includes(id)&&!has(s,'BOARD'))return 'Сначала установи материнскую плату.';
    if(id==='CPU'&&!s.socketOpen)return 'Открой фиксатор сокета перед установкой CPU.';
    if(id==='COOLER'&&(!has(s,'CPU')||s.socketOpen||s.paste!=='fresh'))return 'Установи CPU, закрой фиксатор и нанеси свежую термопасту.';
    return '';
  }
  function display(s) {
    if(!s.power){
      if(typeof s.startAttempt==='string')return s.startAttempt;
      if(s.startAttempt&&(!live(s)||!s.wiring.atx||!has(s,'BOARD')))return 'noAc';
      if(s.startAttempt&&!s.wiring.frontPanel)return 'noButton';
      return 'off';
    }
    if(!s.wiring.eps)return 'noEps';
    if(!has(s,'CPU')||s.socketOpen)return 'noCpu';
    if(!has(s,'COOLER')||s.paste!=='used'||!s.wiring.cpuFan)return 'noCooling';
    if(!has(s,'RAM'))return 'noRam';
    if(!has(s,'GPU')||!s.wiring.gpu)return 'noGpu';
    if(!s.wiring.monitor)return 'noMonitor';
    return has(s,'SSD')?'ready':'noSsd';
  }

  const controlSteps={
    openPanel:{action:'openPanel',label:'Сними боковую панель',body:'Так откроется доступ к креплениям.',anchor:'PANEL EDGE',marker:'Снять панель'},
    openSocket:{action:'toggleSocket',part:'CPU',label:'Открой фиксатор сокета',body:'Подними рамку, чтобы поставить процессор в сокет LGA.',anchor:'LGA',marker:'Открыть фиксатор'},
    closeSocket:{action:'toggleSocket',part:'CPU',label:'Закрой фиксатор сокета',body:'Зафиксируй установленный процессор перед установкой кулера.',anchor:'LGA',marker:'Закрыть фиксатор'},
    paste:{action:'applyPaste',part:'COOLER',label:'Нанеси термопасту',body:'Нанеси её на крышку процессора перед креплением кулера.',anchor:'CPU MOUNT',marker:'Нанести термопасту'},
    cleanPaste:{action:'cleanPaste',part:'COOLER',label:'Очисти старую термопасту',body:'Удали остатки пасты перед повторной установкой кулера.',anchor:'CPU MOUNT',marker:'Очистить термопасту'},
    closePanel:{action:'closePanel',label:'Верни боковую панель',body:'Подключи сетевой шнур после закрытия корпуса.',anchor:'PANEL EDGE',marker:'Вернуть панель'},
    connectMains:{action:'connectMains',label:'Подключи сетевой шнур',body:'Вставь его в разъём питания на задней стенке блока питания.',anchor:'AC IN',marker:'Подключить сетевой шнур',power:true},
    switchOn:{action:'switchPsu',label:'Включи блок питания',body:'Переведи выключатель блока питания в положение I.',anchor:'PSU SWITCH',marker:'Включить блок питания',power:true},
    switchOff:{action:'switchPsu',label:'Выключи блок питания',body:'Переведи выключатель в положение O.',anchor:'PSU SWITCH',marker:'Выключить блок питания',power:true},
    disconnectMains:{action:'disconnectMains',label:'Отсоедини сетевой шнур',body:'Обесточь компьютер перед изменением сборки.',anchor:'AC IN',marker:'Отсоединить сетевой шнур',power:true},
    powerOn:{action:'powerOn',label:'Нажми Power на корпусе',body:'Дождись результата проверки запуска на учебном экране.',anchor:'CASE POWER',marker:'Нажать Power',power:true},
    powerOff:{action:'powerOff',label:'Выключи компьютер',body:'Перед исправлением сборки отключи питание.',anchor:'CASE POWER',marker:'Выключить ПК',power:true},
    finish:{action:'finish',label:'Проверь и заверши сборку',body:'Система загрузилась. Кнопка проверит экран и засчитает задание.'}
  };
  const installLabels={
    BOARD:'Установи материнскую плату',CPU:'Установи процессор',COOLER:'Установи кулер',
    RAM:'Установи оперативную память',SSD:'Установи SSD',GPU:'Установи видеокарту',
    PSU:'Установи блок питания',FANS:'Установи вентиляторы корпуса'
  };
  const cableLocations={
    atx:'Длинный разъём на правом краю материнской платы.',
    eps:'Небольшой разъём у верхнего края платы, слева от процессора.',
    gpu:'Разъём питания у внешнего края видеокарты.',
    cpuFan:'Четыре контакта CPU_FAN у верхнего края платы, справа от процессора.',
    sysFan:'Разъём SYS_FAN у нижнего края платы.',
    frontPanel:'Разъём F_PANEL внизу платы. Соедини с ним PWR_SW от корпуса.',
    monitor:'Видеовыход на задней планке видеокарты.'
  };
  function nextBuildStep(s){
    if(s.complete||s.task!=='build'&&s.task!=='free')return null;
    const missingPart=Object.keys(parts).find(id=>!has(s,id));
    const missingCable=Object.keys(cables).find(id=>!s.wiring[id]);
    const repair=missingPart||missingCable&&missingCable!=='monitor';
    if(repair){
      if(s.power)return controlSteps.powerOff;
      if(s.psuSwitch)return controlSteps.switchOff;
      if(s.mains)return controlSteps.disconnectMains;
      if(!s.panelOpen)return controlSteps.openPanel;
    }
    if(missingPart==='CPU'&&!s.socketOpen)return controlSteps.openSocket;
    if(missingPart==='COOLER'){
      if(s.socketOpen)return controlSteps.closeSocket;
      if(s.paste==='used')return controlSteps.cleanPaste;
      if(s.paste==='none')return controlSteps.paste;
    }
    if(missingPart)return {action:'install'+missingPart,target:parts[missingPart].slot,part:missingPart,label:installLabels[missingPart],body:parts[missingPart].place};
    if(missingCable)return {action:'attachCable',target:missingCable,wire:missingCable,label:'Подключи '+cables[missingCable].name,body:cableLocations[missingCable]};
    if(s.panelOpen&&!s.mains&&!s.power)return controlSteps.closePanel;
    if(!s.mains&&s.psuSwitch)return controlSteps.switchOff;
    if(!s.mains)return controlSteps.connectMains;
    if(!s.psuSwitch)return controlSteps.switchOn;
    if(!s.power)return controlSteps.powerOn;
    if(s.task==='build')return controlSteps.finish;
    return {action:'checkDisplay',label:'Проверь экран',body:'На учебном экране видно, как запустилась система.'};
  }

  function launchProblem(s){
    if(!s.mains)return 'Сетевой шнур не подключён. Подключи его в разделе «Питание и запуск».';
    if(!s.psuSwitch)return 'Блок питания выключен. Включи его в разделе «Питание и запуск».';
    const phase=display(s);
    return phase==='off'?'ПК выключен. Нажми Power в разделе «Питание и запуск».':post[phase].result;
  }

  function recommended(s) {
    if(s.task==='build'||s.task==='free'){
      const step=nextBuildStep(s);
      if(step)return `${step.label}. ${step.body}`;
      if(s.complete)return 'Практика пройдена ✓';
    }
    if(s.task==='diagnose'&&!s.observedSymptom)return 'Нажми «Проверить экран» и запиши исходный симптом.';
    if(s.task==='diagnose'&&!s.wiring.eps)return 'Проверь цепь питания CPU. Выбери EPS во вкладке «Кабели».';
    if(s.task==='strip'){
      if(s.power)return 'Выключи компьютер.';
      if(s.psuSwitch||s.mains)return 'Выключи блок питания и отсоедини сетевой шнур.';
      return 'Сними панель, отсоедини кабели, затем снимай детали. Для CPU сначала сними кулер.';
    }
    if(display(s)==='ready')return 'Проверь экран, чтобы записать успешный запуск.';
    if(s.startAttempt||s.power)return post[display(s)].result;
    if(!s.panelOpen&&!has(s,'BOARD'))return 'Сними панель и начни с крепления материнской платы.';
    if(!has(s,'CPU'))return 'Выбери процессор, открой фиксатор сокета и установи CPU.';
    if(!has(s,'COOLER'))return 'Закрой фиксатор, нанеси термопасту и закрепи кулер.';
    if(!Object.keys(parts).every(id=>has(s,id)))return 'Установи остальные детали из списка.';
    if(!Object.values(s.wiring).every(Boolean))return 'Открой вкладку «Кабели» и подключи питание, вентиляторы, кнопку Power и монитор.';
    if(s.panelOpen&&!s.mains)return 'Верни панель, затем подключи к блоку питания сетевой шнур.';
    return 'В разделе «Питание и запуск» подключи сетевой шнур, включи блок питания и нажми Power.';
  }

  function act(s,action,target='') {
    function result(text,ok=true,passed,recordedAction=action) {
      if(!ok)s.errors++;
      const entry={step:s.log.length+1,action:recordedAction,text,ok};
      s.log.push(entry);
      return {text,ok,passed};
    }
    function change(text) {
      s.revision++;
      s.complete=false;
      s.startAttempt=false;
      return result(text);
    }
    function inside() {
      const reason=accessIssue(s);
      if(reason)return result(reason,false);
    }
    function checkDisplay(){
      const code=display(s);
      if(code==='ready')s.testedAt=s.revision;
      if(s.task==='diagnose'&&code==='noEps')s.observedSymptom=true;
      const text=code==='off'||code==='noAc'?launchProblem(s):post[code].result;
      const observation=result(text,true,code==='ready','checkDisplay');
      s.evidence.push({action:'checkDisplay',text:observation.text,revision:s.revision,passed:observation.passed});
      return observation;
    }
    if(action==='requestHint'){s.hintCount++;return result(recommended(s));}
    if(action==='inspectCable'){
      const cable=cables[target];
      if(!cable)return result('Выбери кабель из списка.',false);
      return result(cable.name+' · '+(s.wiring[target]?'Соединение есть.':'Соединение отсутствует.'),true,s.wiring[target]);
    }
    if(action==='checkDisplay')return checkDisplay();
    if(action==='finish'){
      if(s.task==='free')return result('В свободной сборке можно продолжать эксперимент.');
      if(s.task==='strip'){
        if(s.mains||s.psuSwitch||s.power||!s.panelOpen||Object.keys(parts).some(id=>has(s,id))||Object.values(s.wiring).some(Boolean))return result('Разборка ещё не завершена. Отключи питание и кабели, освободив корпус от деталей.',false);
      }else{
        if(s.task==='diagnose'&&!s.observedSymptom)return result('Сначала нужно было зафиксировать исходный симптом через проверку экрана. Начни диагностику заново.',false);
        const missingParts=Object.keys(parts).filter(id=>!has(s,id)).map(id=>parts[id].name);
        if(missingParts.length)return result('Ещё нужно установить: '+missingParts.join(', ')+'.',false);
        const missingCables=Object.keys(cables).filter(id=>!s.wiring[id]).map(id=>cables[id].name);
        if(missingCables.length)return result('Ещё нужно подключить: '+missingCables.join(', ')+'.',false);
        if(display(s)!=='ready')return result(launchProblem(s),false);
        if(s.testedAt!==s.revision)checkDisplay();
      }
      s.complete=true;
      return result('Практика пройдена ✓',true,true);
    }
    if(action==='powerOff'){
      s.power=false;
      return change('Компьютер выключен. Кабель питания можно отсоединить после выключения блока питания.');
    }
    if(action==='powerOn'){
      s.complete=false;
      s.startAttempt=true;
      s.power=Boolean(live(s)&&has(s,'BOARD')&&s.wiring.atx&&s.wiring.frontPanel);
      const code=display(s);
      if(code==='noCpu'||code==='noCooling'){
        s.power=false;
        s.startAttempt=code;
        return result(post[code].result,true,false);
      }
      return result(post[code].result,true,code==='ready');
    }
    if(action==='connectMains'||action==='disconnectMains'){
      if(s.power||s.psuSwitch)return result('Сначала выключи ПК и выключатель блока питания.',false);
      if(!has(s,'PSU'))return result('Сначала установи блок питания.',false);
      s.mains=action==='connectMains';
      return change(s.mains?'Сетевой шнур подключён к блоку питания.':'Сетевой шнур отсоединён.');
    }
    if(action==='switchPsu'){
      if(!has(s,'PSU'))return result('Сначала установи блок питания.',false);
      if(s.power)return result('Сначала выключи компьютер кнопкой Power.',false);
      s.psuSwitch=!s.psuSwitch;
      return change(s.psuSwitch?'Выключатель блока питания в положении I.':'Выключатель блока питания в положении O.');
    }
    if(action==='openPanel'||action==='closePanel'){
      if(s.power||s.mains)return result('Перед снятием или установкой панели выключи ПК и отсоедини сетевой шнур.',false);
      s.panelOpen=action==='openPanel';
      return change(s.panelOpen?'Панель снята. Внутренние компоненты доступны.':'Панель возвращена на место.');
    }
    if(action==='attachCable'||action==='detachCable'){
      const cable=cables[target];
      if(!cable)return result('Выбери кабель из списка.',false);
      if(target!=='monitor'){const blocked=inside();if(blocked)return blocked;}
      const installing=action==='attachCable';
      if(installing&&!cable.needs.every(id=>has(s,id)))return result('Сначала установи оба узла для подключения кабеля.',false);
      if(s.wiring[target]===installing)return result('Положение кабеля уже совпадает с выбранным действием.',false);
      s.wiring[target]=installing;
      return change(installing?'Кабель подключён. '+cable.name:'Кабель отсоединён. '+cable.name);
    }
    const match=/^(install|remove)(BOARD|CPU|COOLER|RAM|SSD|GPU|PSU|FANS)$/.exec(action);
    if(match){
      const [,verb,id]=match,part=parts[id],installing=verb==='install';
      if(installing){
        const reason=installationIssue(s,id,target);
        if(reason)return result(reason,false);
        if(id==='COOLER')s.paste='used';
      }else{
        const blocked=inside();if(blocked)return blocked;
        if(!has(s,id))return result('Этот компонент уже снят.',false);
        if(Object.entries(cables).some(([key,cable])=>s.wiring[key]&&cable.needs.includes(id)))return result('Сначала отсоедини кабели, подключённые к этому узлу.',false);
        if(id==='BOARD'&&['CPU','COOLER','RAM','SSD','GPU'].some(item=>has(s,item)))return result('Сначала сними компоненты, установленные на плате.',false);
        if(id==='CPU'&&(has(s,'COOLER')||!s.socketOpen||s.paste!=='none'))return result('Сними кулер, очисти термопасту и открой фиксатор сокета.',false);
        if(id==='BOARD')s.socketOpen=false;
      }
      s[part.key]=installing;
      return change((installing?'Компонент установлен. ':'Компонент снят. ')+part.name);
    }
    if(['toggleSocket','applyPaste','cleanPaste'].includes(action)){
      const blocked=inside();if(blocked)return blocked;
      if(!has(s,'BOARD'))return result('Сначала установи материнскую плату.',false);
      if(has(s,'COOLER'))return result('Сначала сними кулер.',false);
      if(action==='toggleSocket'){
        s.socketOpen=!s.socketOpen;
        return change(s.socketOpen?'Фиксатор сокета открыт.':'Фиксатор сокета закрыт.');
      }
      if(!has(s,'CPU'))return result('Сначала установи процессор.',false);
      if(action==='cleanPaste'){
        s.paste='none';
        return change('Термопаста удалена.');
      }
      if(s.socketOpen||s.paste!=='none')return result('Закрой фиксатор и очисти старую термопасту перед нанесением.',false);
      s.paste='fresh';
      return change('Свежая термопаста нанесена.');
    }
    return result('Это действие не предусмотрено в полной сборке.',false);
  }

  return {parts,cables,tasks,post,create,has,live,display,act,recommended,installationIssue,nextBuildStep};
});
