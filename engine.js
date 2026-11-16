(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ITLabEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(mode='explore'){return {mode,power:mode==='network'||mode==='code',panelOpen:false,ramInstalled:mode!=='repair',ssdInstalled:mode!=='repair',cableConnected:mode!=='network',dhcp:mode!=='network',gatewayTested:false,complete:false,errors:0,log:[]};}
 function act(s,action,target=''){
  const reject=text=>{s.errors++;s.log.push({step:s.log.length+1,action,ok:false,text});return{ok:false,text};};
  const done=text=>{s.log.push({step:s.log.length+1,action,ok:true,text});return{ok:true,text};};
  if(s.complete)return reject('Задание уже завершено. Начните новую попытку, чтобы повторить практику.');
  if(action==='powerOff'){s.power=false;return done('Питание выключено. В учебной практике можно работать с внутренними компонентами.');}
  if(action==='openPanel'){if(s.power)return reject('Сначала выключите питание.');s.panelOpen=true;return done('Панель снята. Доступ к компонентам открыт.');}
  if(action==='closePanel'){if(!s.ramInstalled||!s.ssdInstalled)return reject('Сначала завершите установку RAM и SSD.');s.panelOpen=false;return done('Боковая панель возвращена на место.');}
  if(action==='installRAM'||action==='installSSD'){
   if(s.power)return reject('Нельзя менять компоненты при включённом питании.');
   if(!s.panelOpen)return reject('Сначала откройте боковую панель.');
   const expected=action==='installRAM'?'DIMM':'M.2';
   if(target!==expected)return reject(action==='installRAM'?'Модуль RAM устанавливается в совместимый слот DIMM, а не в выбранный разъём.':'В этом задании используется SSD M.2: выберите совместимый разъём M.2.');
   const key=action==='installRAM'?'ramInstalled':'ssdInstalled';if(s[key])return reject('Этот компонент уже установлен.');s[key]=true;
   return done(action==='installRAM'?'RAM установлена в DIMM. Проверьте фиксацию модулей.':'SSD установлен в M.2 и закреплён.');
  }
  if(action==='powerOn'){if(!s.ramInstalled)return reject('Оперативная память не установлена: в этой конфигурации запуск не завершится.');if(s.panelOpen)return reject('Для завершения этой учебной сборки сначала верните боковую панель.');s.power=true;return done(s.ssdInstalled?'Питание включено. Учебная система обнаружила RAM и SSD.':'Питание включено. SSD не обнаружен; в этом сценарии ОС находится на нём.');}
  if(action==='connectCable'){if(s.cableConnected)return reject('Сетевой кабель уже подключён.');s.cableConnected=true;s.gatewayTested=false;return done('Кабель подключён к сетевому порту ПК и LAN-порту роутера. Физический канал поднят.');}
  if(action==='dhcp'){s.dhcp=true;s.gatewayTested=false;return done(s.cableConnected?'DHCP выдал адрес 192.168.10.20/24 и шлюз 192.168.10.1.':'Выбран DHCP. Пока нет физического соединения, получить адрес нельзя.');}
  if(action==='ping'){if(!s.power)return reject('Компьютер выключен.');if(!s.cableConnected)return reject('Нет физического канала: сначала проверьте кабель и порты.');if(!s.dhcp)return reject('Адрес ПК 192.168.20.20/24 не соответствует учебной LAN 192.168.10.0/24. Получите настройки по DHCP.');s.gatewayTested=true;return done('Ответ от 192.168.10.1: связь со шлюзом есть. Это подтверждает локальное соединение, но не проверяет интернет.');}
  if(action==='replaceSSD')return reject('Замена SSD не устраняет отсутствие сетевого канала или неверный IP-адрес.');
  if(action==='finish'){
   if(s.mode==='repair'){if(!s.ramInstalled||!s.ssdInstalled||s.panelOpen||!s.power)return reject('Сборка не завершена: проверьте RAM, SSD, панель и включение.');s.complete=true;return done('Сборка завершена: компоненты установлены, панель закрыта, система обнаружила RAM и SSD.');}
   if(s.mode==='network'){if(!s.cableConnected||!s.dhcp||!s.gatewayTested)return reject('Нужно восстановить канал, получить настройки сети и проверить связь со шлюзом.');s.complete=true;return done('Локальная сеть восстановлена: канал, DHCP и связь со шлюзом проверены.');}
  }
  return reject('Это действие не относится к текущей практике.');
 }
 // A small, explicit educational subset of Python. No eval or execution of arbitrary code.
 function expression(source,vars){
  if(source.length>200)throw Error('Выражение слишком длинное.');
  const tokens=[];let i=0;
  while(i<source.length){if(/\s/.test(source[i])){i++;continue;}const rest=source.slice(i);let m;if((m=/^\d+(?:\.\d+)?/.exec(rest))){tokens.push({type:'number',value:Number(m[0])});i+=m[0].length;}else if((m=/^[A-Za-z_]\w*/.exec(rest))){tokens.push({type:'name',value:m[0]});i+=m[0].length;}else if('+-*/()'.includes(source[i]))tokens.push({type:source[i++]});else throw Error('Разрешены числа, переменные, +, -, *, / и скобки.');}
  let p=0;
  function atom(){const token=tokens[p++];if(!token)throw Error('Не хватает значения в выражении.');if(token.type==='number')return token.value;if(token.type==='name'){if(!Object.hasOwn(vars,token.value))throw Error('Переменная '+token.value+' ещё не определена.');return vars[token.value];}if(token.type==='-')return-atom();if(token.type==='+')return atom();if(token.type==='('){const v=sum();if(tokens[p++]?.type!==')')throw Error('Проверьте скобки.');return v;}throw Error('Ожидалось число или имя переменной.');}
  function product(){let v=atom();while(tokens[p]&&['*','/'].includes(tokens[p].type)){const op=tokens[p++].type,r=atom();if(op==='/'&&r===0)throw Error('Деление на ноль.');v=op==='*'?v*r:v/r;}return v;}
  function sum(){let v=product();while(tokens[p]&&['+','-'].includes(tokens[p].type)){const op=tokens[p++].type,r=product();v=op==='+'?v+r:v-r;}return v;}
  const value=sum();if(p!==tokens.length)throw Error('Между значениями нужен оператор.');if(!Number.isFinite(value)||Math.abs(value)>1e12)throw Error('Результат вне учебного диапазона.');return Math.round(value*1e8)/1e8;
 }
 function compile(text){if(typeof text!=='string'||text.length>2500)throw Error('Программа должна быть короче 2500 символов.');const lines=text.split(/\r?\n/).map((raw,index)=>({text:raw.trim(),line:index+1})).filter(x=>x.text&&!x.text.startsWith('#'));if(!lines.length||lines.length>20)throw Error('Нужно от 1 до 20 команд.');return lines.map(x=>{let m;if((m=/^([A-Za-z_]\w*)\s*=\s*(.+)$/.exec(x.text))){if(['print','__proto__','constructor','prototype'].includes(m[1]))throw Error('Используйте другое имя переменной.');return{...x,type:'assign',name:m[1],expr:m[2]};}if((m=/^print\((.+)\)$/.exec(x.text)))return{...x,type:'print',expr:m[1]};throw Error('Строка '+x.line+': поддерживаются присваивание и print(выражение).');});}
 function program(text){return {instructions:compile(text),pc:0,vars:Object.create(null),output:[],trace:[],done:false};}
 function step(run){if(run.done)return null;const cmd=run.instructions[run.pc];const value=expression(cmd.expr,run.vars);if(cmd.type==='assign')run.vars[cmd.name]=value;else run.output.push(value);run.pc++;run.done=run.pc>=run.instructions.length;const record={line:cmd.line,type:cmd.type,name:cmd.name||null,value,text:cmd.type==='assign'?'CPU вычислил '+value+'. В RAM: '+cmd.name+' = '+value+'.':'Вывод программы: '+value+'.'};run.trace.push(record);return record;}
 function hint(s){if(s.mode==='repair'){if(s.power)return'Перед работой с внутренними деталями выключите питание.';if(!s.panelOpen)return'Начните со снятия боковой панели.';if(!s.ramInstalled)return'Найдите длинные слоты DIMM рядом с процессором и установите RAM.';if(!s.ssdInstalled)return'Для показанного SSD нужен разъём M.2. После установки накопитель закрепляют.';return'Верните панель, включите ПК и проверьте сборку.';}if(s.mode==='network'){if(!s.cableConnected)return'Начните с физического уровня: сравните положение кабеля и сетевого порта.';if(!s.dhcp)return'Канал есть. Теперь сравните адрес ПК с сетью роутера и запросите настройки по DHCP.';if(!s.gatewayTested)return'Проверьте связь со шлюзом 192.168.10.1.';return'Связь со шлюзом проверена. Можно завершить задание.';}return'Выполняйте программу по одной команде. Смотрите, когда появляются переменные в RAM и когда меняется вывод.';}
 return {create,act,expression,compile,program,step,hint};
});
