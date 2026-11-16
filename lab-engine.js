(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));
  else root.ITLabExtended=factory(root.ITLabEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
  'use strict';
  if(!Base)throw Error('ITLabEngine must be loaded before lab-engine.js');
  const CASES=Object.freeze([
    Object.freeze({id:'ram',title:'Нет изображения',symptom:'Вентиляторы вращаются, но экран остаётся чёрным.',goal:'Найди причину и добейся успешного запуска системы.'}),
    Object.freeze({id:'ssd',title:'Система не загружается',symptom:'Экран UEFI появляется, но загрузочное устройство не найдено.',goal:'Восстанови загрузку ОС и проверь результат.'}),
    Object.freeze({id:'network',title:'Шлюз не отвечает',symptom:'Компьютер работает, но связи с роутером нет.',goal:'Восстанови локальную связь и подтверди её проверкой.'})
  ]);
  const EXTENDED=new Set(['repair','fault','experiment','exam']);
  const COMPONENTS={
    RAM:{key:'ramInstalled',slot:'DIMM',name:'RAM'},
    SSD:{key:'ssdInstalled',slot:'M.2',name:'SSD M.2'},
    GPU:{key:'gpuInstalled',slot:'PCIe',name:'видеокарта'}
  };
  const getCase=id=>CASES.find(c=>c.id===id)||CASES[0];
  const boots=s=>Boolean(s.power&&s.ramInstalled&&s.ssdInstalled&&s.gpuInstalled);
  const graphicsReady=s=>Boolean(s.power&&s.ramInstalled&&s.gpuInstalled);
  const liveTest=(s,key)=>s.tests[key]?.revision===s.revision&&s.tests[key]?.passed===true;

  function create(mode='explore',options={}){
    const s=Base.create(mode);
    Object.assign(s,{gpuInstalled:mode!=='repair',revision:0,tests:{},evidence:[],hintCount:0,diagnosed:false});
    if(mode==='repair'){
      s.power=false;s.ramInstalled=false;s.ssdInstalled=false;s.gpuInstalled=false;
      s.symptom='RAM, SSD и видеокарта сняты.';
      s.goal='Установи компоненты, закрой панель и проверь запуск.';
    }
    if(mode==='experiment'){
      s.power=false;s.ramInstalled=true;s.ssdInstalled=true;s.gpuInstalled=true;s.cableConnected=true;s.dhcp=true;
      s.symptom='Исправный стенд. Меняй конфигурацию и наблюдай последствия.';
      s.goal='Проверь собственную гипотезу на учебном стенде.';
    }
    if(mode==='fault'||mode==='exam'){
      const c=getCase(options.caseId);s.caseId=c.id;s.symptom=c.symptom;s.goal=c.goal;
      s.power=true;s.panelOpen=false;s.ramInstalled=true;s.ssdInstalled=true;s.gpuInstalled=true;s.cableConnected=true;s.dhcp=true;
      if(c.id==='ram')s.ramInstalled=false;
      if(c.id==='ssd')s.ssdInstalled=false;
      if(c.id==='network')s.cableConnected=false;
    }
    return s;
  }

  function invalidate(s){s.revision++;s.tests={};s.gatewayTested=false;s.complete=false;}
  function remember(s,action,known){s.evidence.push({action,revision:s.revision,passed:true,text:'Конфигурация изменена.',kind:'configuration',known:{...known}});if(s.evidence.length>200)s.evidence.shift();}
  function addLog(s,action,text,ok=true,extra={}){
    const entry={step:s.log.length+1,action,ok,text,...extra};s.log.push(entry);return entry;
  }
  function observed(s,action,text,passed,known={}){
    s.tests[action]={revision:s.revision,passed:Boolean(passed),text};
    s.evidence.push({action,revision:s.revision,passed:Boolean(passed),text,known:{...known}});
    if(s.evidence.length>200)s.evidence.shift();
    if((s.caseId==='ram'&&action==='checkMemory'&&known.ramInstalled===false)||
       (s.caseId==='ssd'&&action==='checkStorage'&&known.ssdInstalled===false)||
       (s.caseId==='network'&&action==='checkLink'&&known.cableConnected===false))s.diagnosed=true;
    addLog(s,action,text,true,{passed:Boolean(passed),kind:'observation'});
    return{ok:true,passed:Boolean(passed),text};
  }
  function afterPowerOn(s){
    if(s.mode==='fault'||s.mode==='exam'){
      if(!s.ramInstalled||!s.gpuInstalled)return 'Питание включено, вентиляторы вращаются. Изображения нет.';
      if(!s.ssdInstalled)return 'Питание включено. Экран UEFI доступен, загрузочное устройство не найдено.';
      return 'Питание включено. Проверь, появился ли экран системы.';
    }
    if(!s.ramInstalled)return 'Питание включено, вентиляторы вращаются. Инициализация RAM не завершена: изображения нет.';
    if(!s.gpuInstalled)return 'Питание включено, но дискретная видеокарта отсутствует. В этом стенде другого источника изображения нет.';
    if(!s.ssdInstalled)return 'Питание включено. Экран UEFI доступен, но загрузочный SSD не обнаружен.';
    return 'Питание включено. Учебная система загрузилась.';
  }
  function canInspectInside(s){return s.panelOpen&&!s.power;}

  function act(s,action,target=''){
    if(!s||typeof s!=='object'||!Array.isArray(s.log))throw Error('Создай состояние стенда перед выполнением действий.');
    const reject=text=>{s.errors++;addLog(s,action,text,false);return{ok:false,text};};
    const done=text=>{addLog(s,action,text,true);return{ok:true,text};};
    if(action==='requestHint'){
      if(s.mode==='exam')return{ok:false,text:'В самостоятельной проверке подсказки отключены.'};
      s.hintCount=(s.hintCount||0)+1;return done(hint(s));
    }
    if(!EXTENDED.has(s.mode))return Base.act(s,action,target);
    if(s.complete)return reject('Практика уже завершена. Начни новую попытку, чтобы повторить её.');
    if(action==='powerOff'){
      if(s.power){s.power=false;invalidate(s);}
      remember(s,action,{power:false,display:false,booted:false});
      return done('Питание выключено. Рабочие данные RAM потеряны, файлы на SSD сохраняются.');
    }
    if(action==='powerOn'){
      if(!s.power){s.power=true;invalidate(s);}
      remember(s,action,{power:true});
      return done(afterPowerOn(s));
    }
    if(action==='openPanel'){
      if(s.power)return reject('Перед открытием корпуса выключи питание.');
      s.panelOpen=true;return done('Панель снята. Внутренние компоненты доступны.');
    }
    if(action==='closePanel'){
      s.panelOpen=false;return done('Панель возвращена на место.');
    }
    const componentAction=/^(install|remove)(RAM|SSD|GPU)$/.exec(action);
    if(componentAction){
      const operation=componentAction[1],component=COMPONENTS[componentAction[2]];
      if(s.power)return reject('Нельзя менять внутренние компоненты при включённом питании.');
      if(!s.panelOpen)return reject('Сначала открой боковую панель.');
      if(operation==='install'){
        const socket=target==='PCIe x16'?'PCIe':target;
        if(socket!==component.slot)return reject(component.name+' устанавливается в '+component.slot+', а не в выбранный разъём.');
        if(s[component.key])return reject('Этот компонент уже установлен.');
        s[component.key]=true;invalidate(s);remember(s,action,{[component.key]:true});
        return done(componentAction[2]==='SSD'?'SSD M.2 установлен и закреплён.':componentAction[2]==='RAM'?'RAM установлена в DIMM.':'Видеокарта установлена в PCIe x16.');
      }
      if(!s[component.key])return reject('Этот компонент уже снят.');
      s[component.key]=false;invalidate(s);remember(s,action,{[component.key]:false});
      return done((componentAction[2]==='SSD'?'SSD снят.':componentAction[2]==='RAM'?'RAM снята.':'Видеокарта снята.')+' Можно включить виртуальный стенд и проверить последствия.');
    }
    if(action==='connectCable'||action==='disconnectCable'){
      const connected=action==='connectCable';
      if(s.cableConnected===connected)return reject(connected?'Кабель уже подключён.':'Кабель уже отключён.');
      s.cableConnected=connected;invalidate(s);
      remember(s,action,{cableConnected:connected});
      return done(connected?'Кабель подключён к Ethernet-порту ПК и LAN-порту роутера.':'Сетевой кабель отключён. Физического канала нет.');
    }
    if(action==='dhcp'||action==='manualIP'){
      const dhcp=action==='dhcp';if(s.dhcp!==dhcp){s.dhcp=dhcp;invalidate(s);}
      remember(s,action,{dhcp});
      if(!dhcp)return done('Задан адрес 192.168.20.20/24. Роутер находится в другой учебной подсети 192.168.10.0/24.');
      return done(!s.power?'Выбран DHCP. Адрес будет запрошен после запуска системы.':s.cableConnected?'DHCP выдал адрес 192.168.10.20/24 и шлюз 192.168.10.1.':'Выбран DHCP. Без физического канала получить адрес нельзя.');
    }
    if(action==='inspectPower')return observed(s,action,s.power?'Питание подано. Вентиляторы вращаются; это ещё не подтверждает успешную загрузку.':'Питание выключено. Вентиляторы остановлены.',s.power,{power:s.power});
    if(action==='checkDisplay'){
      if(!s.power)return observed(s,action,'Экран погашен: ПК выключен.',false,{power:false});
      if(!s.ramInstalled)return observed(s,action,'Изображения нет. Запуск не прошёл раннюю инициализацию оборудования.',false,{display:false,booted:false});
      if(!s.gpuInstalled)return observed(s,action,'Изображения нет. Проверь подключение и наличие устройства вывода.',false,{display:false,booted:false});
      if(!s.ssdInstalled)return observed(s,action,'Изображение UEFI есть. Загрузочное устройство не найдено.',false,{display:true,booted:false});
      return observed(s,action,'Изображение есть. Учебная ОС загрузилась: запуск подтверждён.',true,{display:true,booted:true});
    }
    if(action==='checkMemory'){
      if(!s.power&&!canInspectInside(s))return reject('Для физического осмотра выключенного ПК открой панель. Для проверки запуска включи ПК.');
      const text=s.power?(s.ramInstalled?'RAM обнаружена и доступна для запуска.':'RAM не обнаружена: модуль не установлен.'):(s.ramInstalled?'При осмотре: RAM установлена в DIMM.':'При осмотре: RAM отсутствует в слотах DIMM.');
      return observed(s,action,text,s.ramInstalled,{ramInstalled:s.ramInstalled});
    }
    if(action==='checkStorage'){
      if(!s.power&&!canInspectInside(s))return reject('Для физического осмотра выключенного ПК открой панель. Для проверки UEFI включи ПК.');
      if(s.power&&!graphicsReady(s))return observed(s,action,'Проверка SSD через UEFI пока недоступна: сначала добейся изображения.',false,{});
      const text=s.power?(s.ssdInstalled?'UEFI обнаружила SSD M.2 с учебной загрузочной системой.':'UEFI не обнаружила загрузочный SSD.'):(s.ssdInstalled?'При осмотре: SSD установлен в M.2.':'При осмотре: SSD отсутствует в M.2.');
      return observed(s,action,text,s.ssdInstalled,{ssdInstalled:s.ssdInstalled});
    }
    if(action==='checkLink'){
      if(!s.power)return observed(s,action,'ПК выключен. Проверку активного канала выполни после включения.',false,{power:false});
      return observed(s,action,s.cableConnected?'Физический канал между ПК и LAN-портом роутера есть.':'Физического канала нет: кабель со стороны ПК отключён.',s.cableConnected,{cableConnected:s.cableConnected});
    }
    if(action==='checkIP'){
      if(!boots(s))return observed(s,action,'Настройки ОС недоступны: система ещё не загрузилась.',false,{});
      const passed=s.dhcp&&s.cableConnected;
      const text=!s.dhcp?'IP: 192.168.20.20/24. Шлюз: 192.168.10.1. Адрес и шлюз находятся в разных учебных подсетях.':!s.cableConnected?'Выбран DHCP, но из-за отсутствия канала адрес не получен.':'IP: 192.168.10.20/24. Шлюз: 192.168.10.1.';
      return observed(s,action,text,passed,{dhcp:s.dhcp,cableConnected:s.cableConnected,ip:passed?'192.168.10.20/24':!s.dhcp?'192.168.20.20/24':null});
    }
    if(action==='ping'){
      if(!boots(s))return observed(s,action,'Проверка из ОС недоступна: система не загрузилась.',false,{});
      if(!s.cableConnected){s.gatewayTested=false;return observed(s,action,'Нет ответа: физический канал отсутствует.',false,{cableConnected:false});}
      if(!s.dhcp){s.gatewayTested=false;return observed(s,action,'Нет ответа: проверь соответствие IP-адреса и подсети шлюза.',false,{dhcp:false});}
      s.gatewayTested=true;return observed(s,action,'Ответ от 192.168.10.1: связь со шлюзом подтверждена. Интернет этой проверкой не проверяется.',true,{gateway:true});
    }
    if(action==='replaceSSD')return reject('Сначала проверь, связан ли симптом с накопителем. Замена исправной детали сама по себе не устраняет причину.');
    if(action==='finish'){
      if(s.mode==='experiment')return done('Наблюдение сохранено. Стенд остаётся доступным для следующего эксперимента.');
      if(s.mode==='repair'){
        if(!s.ramInstalled||!s.ssdInstalled||!s.gpuInstalled||s.panelOpen||!s.power)return reject('Сборка ещё не завершена: нужны RAM, SSD, видеокарта, закрытая панель и включённое питание.');
        if(!liveTest(s,'checkDisplay'))return reject('После сборки проверь экран и успешный запуск системы.');
      } else {
        if(!s.diagnosed)return reject(s.mode==='exam'?'Причина должна быть подтверждена диагностическим наблюдением.':'Сначала подтверди причину проверкой памяти, накопителя или физического канала.');
        if(s.caseId==='network'){
          if(!boots(s)||!s.cableConnected||!s.dhcp||!liveTest(s,'ping'))return reject('Исправление нужно подтвердить успешной повторной проверкой связи.');
        } else if(!boots(s)||s.panelOpen||!liveTest(s,'checkDisplay'))return reject('После исправления закрой корпус и подтверди успешный запуск повторной проверкой экрана.');
      }
      s.complete=true;return done(s.mode==='repair'?'Сборка проверена: система успешно запустилась.':'Причина найдена, исправление выполнено и результат подтверждён.');
    }
    return reject('Это действие не предусмотрено в текущей практике.');
  }

  function hint(s){
    if(s.mode==='exam')return 'В самостоятельной проверке подсказки отключены. Используй наблюдения и собственный план диагностики.';
    if(s.complete)return 'Практика завершена. Посмотри разбор действий и начни новую попытку.';
    if(s.mode==='repair'){
      if(s.power&&(!s.ramInstalled||!s.ssdInstalled||!s.gpuInstalled))return 'Для установки внутренних деталей выключи питание.';
      if(!s.panelOpen&&(!s.ramInstalled||!s.ssdInstalled||!s.gpuInstalled))return 'Сними панель, чтобы получить доступ к слотам.';
      if(!s.ramInstalled)return 'Для RAM нужен совместимый слот DIMM рядом с CPU.';
      if(!s.ssdInstalled)return 'Показанный SSD устанавливается в M.2.';
      if(!s.gpuInstalled)return 'Видеокарту устанавливают в PCIe x16.';
      if(s.panelOpen)return 'Верни панель на место и включи ПК.';
      if(!s.power)return 'Включи стенд и проверь изображение.';
      return 'Проверь экран: успешное включение вентиляторов ещё не доказывает загрузку ОС.';
    }
    if(s.mode==='fault'){
      if(!s.diagnosed)return s.caseId==='network'?'Начни с проверки физического соединения.':s.caseId==='ssd'?'Посмотри, видит ли UEFI накопитель.':'Отдели отсутствие питания от остановки раннего запуска. Проверь память.';
      if(s.caseId==='network')return !s.cableConnected?'Восстанови физическое соединение и повтори проверку шлюза.':!s.dhcp?'Проверь адресацию.':'Подтверди результат повторной проверкой связи.';
      if(s.power&&(!s.ramInstalled||!s.ssdInstalled||!s.gpuInstalled))return 'Перед установкой детали выключи питание.';
      if(!s.panelOpen&&(!s.ramInstalled||!s.ssdInstalled||!s.gpuInstalled))return 'Открой корпус после выключения.';
      if(!s.ramInstalled)return 'Верни RAM в совместимый DIMM.';
      if(!s.ssdInstalled)return 'Верни SSD в M.2.';
      if(!s.gpuInstalled)return 'Верни видеокарту в PCIe x16.';
      return 'Закрой корпус, включи ПК и повторно проверь экран.';
    }
    if(s.mode==='experiment')return 'Измени один фактор, включи стенд и сравни наблюдения. Детали меняются только при выключенном питании и открытой панели.';
    return Base.hint(s);
  }

  function snapshot(s){
    const hidden=s.mode==='fault'||s.mode==='exam',known={};
    if(hidden){
      const stable=new Set(['ramInstalled','ssdInstalled','gpuInstalled','cableConnected','dhcp']);
      for(const item of s.evidence)for(const [key,value]of Object.entries(item.known||{}))if(stable.has(key)||item.revision===s.revision)known[key]=value;
    }
    else for(const key of ['ramInstalled','ssdInstalled','gpuInstalled','cableConnected','dhcp'])known[key]=Boolean(s[key]);
    if(!s.power){known.booted=false;known.display=false;}
    return {
      mode:s.mode,power:Boolean(s.power),panelOpen:Boolean(s.panelOpen),complete:Boolean(s.complete),symptom:s.symptom||'',goal:s.goal||'',
      known,observations:s.evidence.slice(-12).map(({action,text,passed,revision})=>({action,text,passed,current:revision===s.revision})),
      recentActions:s.log.slice(-8).map(({action,text,ok})=>({action,text,ok})),errors:s.errors,hintCount:s.hintCount||0,
      guidanceAllowed:s.mode!=='exam'
    };
  }

  function examFeedback(s){
    const mistakes=s.log.filter(x=>!x.ok).map(({step,text})=>({step,text}));
    const strengths=[],nextSteps=[],items=[];
    if(s.diagnosed)strengths.push('Причина подтверждена отдельным диагностическим наблюдением.');
    if(liveTest(s,'checkDisplay'))strengths.push('Успешный запуск проверен после последнего изменения конфигурации.');
    if(liveTest(s,'ping'))strengths.push('Связь со шлюзом подтверждена после исправления.');
    if(!s.errors&&s.log.length)strengths.push('Ошибочных действий не зафиксировано.');
    if(s.errors)nextSteps.push('Разбери ошибочные попытки и объясни, какую гипотезу стоило проверить перед каждым действием.');
    if(!s.complete)nextSteps.push('Продолжи диагностику и подтверди результат повторной проверкой.');
    else nextSteps.push('Повтори задачу с другой неисправностью и составь план проверки до начала работы.');
    items.push(...strengths);
    if(s.mode==='exam')items.push('Самостоятельная попытка: подсказки отключены.');
    else items.push('Использовано подсказок: '+(s.hintCount||0)+'.');
    items.push('Это учебный разбор, а не итоговая оценка преподавателя.');
    return{title:s.complete?'Практика завершена':'Попытка ещё не завершена',summary:s.complete?'Причина устранена и результат проверен.':'Журнал сохранён. Для завершения нужен подтверждённый результат.',complete:Boolean(s.complete),actions:s.log.length,errors:s.errors,hints:s.hintCount||0,items,mistakes,strengths,nextSteps};
  }
  return {...Base,create,act,hint,snapshot,examFeedback,CASES};
});
