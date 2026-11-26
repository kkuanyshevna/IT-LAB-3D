(()=>{
 'use strict';
 const N=window.ITLAB_TOPOLOGY,root=document.getElementById('networkLab');
 const find=id=>root.querySelector('#'+id);
 const stage=find('netStage'),nodes=find('netNodes'),wires=find('netWires'),panel=find('netPanel');
 const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const addr=ip=>ip===null||ip===undefined?'':N.formatIP(ip);
 const title=(node)=>N.types[node.type].name+' '+node.serial;
 const creationPoints=[[50,27],[29,55],[20,80],[76,58],[71,29],[51,71],[22,29],[82,81],[52,49]];
 let state=N.create(),selected=null,activePort=null,connecting=null,tab='settings',notice=null,result=null,drag=null,suppressClick=false;
 let options={source:'',destination:'',service:'ping'};
 const current=()=>N.getNode(state,selected);
 const option=(value,text,chosen)=>`<option value="${esc(value)}"${value===chosen?' selected':''}>${esc(text)}</option>`;
 const icon=type=>`<span class="net-device-icon net-device-${type}" aria-hidden="true"><i></i></span>`;
 find('netPalette').innerHTML=Object.entries(N.types).map(([type,{name}])=>`<button type="button" data-net-add="${type}">${icon(type)}<span>${name}</span></button>`).join('');

 function renderWires(){
  const lit=new Set(result?.path||[]);
  wires.innerHTML=state.links.map(link=>{
   const a=N.getNode(state,link.a.node),b=N.getNode(state,link.b.node);
   return `<line class="${lit.has(link.id)?result.ok?'net-path net-path-ok':'net-path net-path-fail':''}" x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%"></line>`;
  }).join('');
 }
 function renderStage(){
  const route=find('netCable');
  route.setAttribute('aria-pressed',String(Boolean(connecting)));
  find('netEmpty').hidden=state.nodes.length>0;
  find('netErase').disabled=!state.nodes.length;
  find('netExample').disabled=Boolean(state.nodes.length);
  find('netDeviceCount').textContent=state.nodes.length;
  find('netCableCount').textContent=state.links.length;
  nodes.innerHTML=state.nodes.map(node=>{
   const ip=Object.values(node.ports).find(port=>port.ip!==null);
   const label=node.type==='router'?'L3':node.type==='switch'?'L2':ip?addr(ip.ip):'IPv4';
   const linked=state.links.some(link=>link.a.node===node.id||link.b.node===node.id);
   return `<button type="button" class="net-node" data-net-node="${node.id}" style="left:${node.x}%;top:${node.y}%" aria-pressed="${node.id===selected}" ${connecting?.from===node.id?'data-cable-source':''}>
     ${icon(node.type)}<span><strong>${title(node)}</strong><small>${label}</small></span><i class="net-link-dot${linked?' is-linked':''}" aria-hidden="true"></i>
    </button>`;
  }).join('');
  renderWires();
 }
 function cableList(node){
  const linked=state.links.flatMap(link=>{
   if(link.a.node!==node.id&&link.b.node!==node.id)return [];
   const [local,far]=link.a.node===node.id?[link.a,link.b]:[link.b,link.a];
   return [{id:link.id,local:local.port,remote:far.port,peer:N.getNode(state,far.node)}];
  });
  if(!linked.length)return '<p class="net-muted">Кабели не подключены.</p>';
  return '<ul class="net-port-list">'+linked.map(link=>`<li><span><b>${link.local}</b><small>${title(link.peer)} · ${link.remote}</small></span><button type="button" class="quiet" data-net-disconnect="${link.id}" title="Отсоединить кабель" aria-label="Отсоединить кабель">×</button></li>`).join('')+'</ul>';
 }
 function field(name,label,value,placeholder='',extra=''){
  return `<label>${label}<input name="${name}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false" ${extra}></label>`;
 }
 function renderConfig(node){
  if(!node)return '<p class="net-muted">Выбери устройство на схеме, чтобы открыть настройки.</p>';
  const isRouter=node.type==='router';
  const port=activePort||Object.keys(node.ports)[0],config=node.ports[port];
  const portPicker=isRouter?`<label>Интерфейс<select id="netInterface">${Object.keys(node.ports).map(id=>option(id,id,port)).join('')}</select></label>`:'';
  const ipv4=node.type==='switch'?'<p class="net-muted">Коммутатор передаёт кадры между портами. IPv4 для этой работы не нужен.</p>':
   `<form id="netConfig" class="net-form">
    ${portPicker}${field('ip','IPv4-адрес',addr(config.ip),'192.168.10.1')}
    ${field('prefix','Маска или префикс',config.prefix,'24','required')}
    ${isRouter?`<label class="net-toggle"><input type="checkbox" name="dhcp"${config.dhcp?' checked':''}> DHCP на интерфейсе</label>`:field('gateway','Шлюз',addr(node.gateway),'192.168.10.1')}
    ${node.type==='server'?`<label class="net-toggle"><input type="checkbox" name="http"${node.http?' checked':''}> HTTP-сервер</label>`:''}
    <div class="net-row"><button type="submit" class="primary">Сохранить</button>${isRouter?'':'<button type="button" id="netDhcp" class="secondary">Получить IP по DHCP</button>'}</div>
   </form>`;
  const routes=isRouter?`<details class="net-details" id="netRoutes"><summary>Статические маршруты <b>${node.routes.length}</b></summary>
   ${node.routes.map((route,index)=>`<div class="net-static-route"><code>${addr(route.subnet)}/${route.prefix} → ${addr(route.via)}</code><button type="button" class="quiet" data-net-route-remove="${index}" aria-label="Удалить маршрут">×</button></div>`).join('')}
   <form id="netRoute" class="net-form">
    ${field('destination','Сеть назначения','','192.168.20.0','required')}
    ${field('prefix','Префикс маршрута','24','','required')}
    ${field('via','Следующий роутер','','10.0.0.2','required')}
    <button type="submit" class="secondary">Добавить маршрут</button>
   </form></details>`:'';
  return `<div class="net-selection">${icon(node.type)}<h3>${title(node)}</h3></div>${ipv4}${routes}
   <section class="net-connected"><h4>Подключения</h4>${cableList(node)}</section>
   <button type="button" id="netRemove" class="quiet net-remove">Удалить устройство</button>`;
 }
 function renderConnection(){
  if(!connecting.from)return '<p class="net-muted">Нажми на первое устройство.</p>';
  const source=N.getNode(state,connecting.from);
  const free=N.freePorts(state,source.id);
  return `<div class="net-selection">${icon(source.type)}<h3>${title(source)}</h3></div>
   <label>Порт кабеля<select id="netSourcePort">${free.map(port=>option(port,port,connecting.port)).join('')}</select></label>
   <p class="net-muted">Выбери второе устройство на схеме. Его свободный порт подберётся автоматически.</p>`;
 }
 function renderCheck(){
  const hosts=state.nodes.filter(node=>node.type==='pc'||node.type==='server');
  const destinations=state.nodes.flatMap(node=>Object.values(node.ports).filter(config=>config.ip!==null).map(config=>({ip:addr(config.ip),name:title(node)})));
  const source=hosts.some(node=>node.id===options.source)?options.source:hosts[0]?.id;
  return `<form id="netTest" class="net-form">
   <label>Отправитель<select name="source">${hosts.length?hosts.map(node=>option(node.id,title(node),source)).join(''):'<option value="">Добавь ПК или сервер</option>'}</select></label>
   <label>IPv4 назначения<input name="destination" list="netTargets" placeholder="192.168.20.10" value="${esc(options.destination)}" autocomplete="off" required></label>
   <datalist id="netTargets">${destinations.map(device=>`<option value="${device.ip}">${esc(device.name)}</option>`).join('')}</datalist>
   <label>Проверка<select name="service">${option('ping','Ping (ICMP)',options.service)}${option('http','HTTP',options.service)}</select></label>
   <button type="submit" class="primary" ${hosts.length?'':'disabled'}>Запустить проверку</button>
  </form>
  ${result?`<div class="net-test-result ${result.ok?'is-ok':'is-fail'}" role="status"><strong>${result.ok?'Ответ получен':'Проверка не прошла'}</strong><p>${esc(result.text)}</p></div>`:''}`;
 }
 function renderPanel(keepRoutes=false){
  find('netSettings').setAttribute('aria-selected',String(tab==='settings'));
  find('netCheck').setAttribute('aria-selected',String(tab==='check'));
  const markup=connecting?renderConnection():tab==='settings'?renderConfig(current()):renderCheck();
  panel.innerHTML=markup+`<p class="net-notice ${notice?.ok?'is-ok':'is-fail'}" role="status">${notice?esc(notice.text):''}</p>`;
  const routes=find('netRoutes');if(keepRoutes&&routes)routes.open=true;
 }
 function render(){renderStage();renderPanel();}
 function select(node){
  if(!node)return;
  selected=node.id;activePort=Object.keys(node.ports)[0];
  tab='settings';notice=null;
 }
 function report(out,keepRoutes=false){
  notice=out;
  state.log.push(out.text);
  renderStage();renderPanel(keepRoutes);
 }
 function edit(){result=null;}
 function chooseNode(id){
  const node=N.getNode(state,id);
  if(!connecting){select(node);render();return;}
  if(!connecting.from){
   const free=N.freePorts(state,id);
   if(!free.length){report({ok:false,text:'У этого устройства нет свободного порта.'});return;}
   connecting.from=id;connecting.port=free[0];notice=null;render();return;
  }
  const outcome=N.connect(state,connecting.from,id,connecting.port);
  if(outcome.ok){
   connecting=null;edit();select(node);
  }
  report(outcome);
 }
 function reset(next){
  state=next;
  selected=null;activePort=null;connecting=null;tab='settings';notice=result=null;
  options={source:'',destination:'',service:'ping'};
  if(state.nodes.length){
   select(state.nodes.find(node=>node.type==='router'));
   options.destination='192.168.20.10';
  }
  render();
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||!root.contains(button))return;
  const {netAdd,netNode,netDisconnect,netRouteRemove}=button.dataset;
  if(netAdd){
   const point=creationPoints.find(([x,y])=>state.nodes.every(node=>Math.hypot(x-node.x,y-node.y)>11));
   const index=state.nodes.length;
   const node=N.add(state,netAdd,...(point||[15+index%4*23,16+Math.floor(index/4)*13]));
   if(!node){report({ok:false,text:'На одной схеме можно разместить до 24 устройств.'});return;}
   connecting=null;edit();select(node);render();return;
  }
  if(netNode){if(!suppressClick||event.detail===0)chooseNode(netNode);suppressClick=false;return;}
  if(netDisconnect){
   state.links=state.links.filter(link=>link.id!==netDisconnect);edit();report({ok:true,text:'Кабель отсоединён.'});return;
  }
  if(netRouteRemove!==undefined){
   current().routes.splice(Number(netRouteRemove),1);edit();report({ok:true,text:'Маршрут удалён.'},true);return;
  }
  switch(button.id){
   case 'netCable':
    connecting=connecting?null:{from:null,port:''};tab='settings';notice=null;render();break;
   case 'netSettings':case 'netCheck':
    tab=button.id==='netCheck'?'check':'settings';connecting=null;notice=null;render();break;
   case 'netExample':reset(N.example());break;
   case 'netErase':
    if(window.confirm(window.ITLAB_I18N.translate('Очистить топологию и настройки?')))reset(N.create());break;
   case 'netRemove':
    N.remove(state,selected);selected=null;activePort=null;edit();report({ok:true,text:'Устройство удалено.'});break;
   case 'netDhcp':{
    const outcome=N.lease(state,selected);
    edit();report(outcome);break;
   }
  }
 });
 root.addEventListener('change',event=>{
  if(event.target.id==='netInterface'){activePort=event.target.value;notice=null;renderPanel();}
  if(event.target.id==='netSourcePort'&&connecting)connecting.port=event.target.value;
 });
 root.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target,values=Object.fromEntries(new FormData(form));
  if(form.id==='netTest'){
   options=values;
   result=N.test(state,values.source,values.destination,values.service);
   state.log.push(result.text);notice=null;render();
  }else if(form.id==='netConfig'||form.id==='netRoute'){
   const route=form.id==='netRoute';
   const outcome=route?N.addRoute(current(),values):N.configure(current(),activePort,values);
   if(outcome.ok){edit();report(outcome,route||find('netRoutes')?.open);}
   else{
    notice=outcome;state.log.push(outcome.text);
    const feedback=panel.querySelector('.net-notice');
    feedback.className='net-notice is-fail';feedback.textContent=outcome.text;
   }
  }
 });
 stage.addEventListener('pointerdown',event=>{
  const element=event.target.closest('[data-net-node]');
  if(!element||connecting||event.button!==0)return;
  suppressClick=false;
  const node=N.getNode(state,element.dataset.netNode);
  drag={element,node,id:event.pointerId,x:event.clientX,y:event.clientY,fromX:node.x,fromY:node.y,moved:false};
 });
 stage.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  if(!drag.moved){
   if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5)return;
   drag.moved=true;drag.element.setPointerCapture(event.pointerId);
  }
  const bounds=stage.getBoundingClientRect();
  const limit=(value,min)=>Math.max(min,Math.min(100-min,value));
  drag.node.x=limit(drag.fromX+(event.clientX-drag.x)/bounds.width*100,(drag.element.offsetWidth/2+5)/bounds.width*100);
  drag.node.y=limit(drag.fromY+(event.clientY-drag.y)/bounds.height*100,(drag.element.offsetHeight/2+5)/bounds.height*100);
  drag.element.style.left=drag.node.x+'%';drag.element.style.top=drag.node.y+'%';renderWires();
 });
 function stopDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  suppressClick=drag.moved;drag=null;
 }
 stage.addEventListener('pointerup',stopDrag);
 stage.addEventListener('pointercancel',stopDrag);
 stage.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)stopDrag(event);});
 window.ITLAB_NETWORK={
  show(){render();},
  report(){
   return ['IT Lab 3D · Топология сети','',...state.nodes.map(node=>title(node)+' · '+Object.entries(node.ports).filter(([,port])=>port.ip!==null).map(([id,port])=>id+' '+addr(port.ip)+'/'+port.prefix).join(', ')),
    '',...state.links.map(link=>title(N.getNode(state,link.a.node))+' '+link.a.port+' ↔ '+title(N.getNode(state,link.b.node))+' '+link.b.port),
    '',...state.log].join('\n');
  }
 };
})();
