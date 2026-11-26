(function(root,factory){
 const topology=factory();
 if(typeof module==='object'&&module.exports)module.exports=topology;
 else root.ITLAB_TOPOLOGY=topology;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const types={
  router:{name:'Роутер',ports:['G0/0','G0/1','G0/2']},
  switch:{name:'Коммутатор',ports:['Fa0/1','Fa0/2','Fa0/3','Fa0/4','Fa0/5']},
  pc:{name:'ПК',ports:['eth0']},
  server:{name:'Сервер',ports:['eth0']}
 };
 const isHost=node=>node.type==='pc'||node.type==='server';
 const mask=prefix=>prefix===0?0:(0xFFFFFFFF<<(32-prefix))>>>0;
 const network=(ip,prefix)=>(ip&mask(prefix))>>>0;
 function parseIP(text){
  if(typeof text!=='string'||!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(text))return null;
  const octets=text.split('.').map(Number);
  return octets.every(value=>value<=255)?octets.reduce((address,value)=>address*256+value,0):null;
 }
 function formatIP(number){return [24,16,8,0].map(shift=>(number>>>shift)&255).join('.');}
 function parsePrefix(text,min=1,max=30){
  const value=String(text).trim();
  if(/^\d{1,2}$/.test(value)){
   const prefix=Number(value);
   return prefix>=min&&prefix<=max?prefix:null;
  }
  const binary=parseIP(value);
  if(binary===null)return null;
  for(let prefix=min;prefix<=max;prefix++)if(binary===mask(prefix))return prefix;
  return null;
 }
 const sameSubnet=(a,b,prefix)=>network(a,prefix)===network(b,prefix);
 function usable(ip,prefix){
  if(ip===null||ip===0||ip>=0xE0000000)return false;
  const first=network(ip,prefix);
  return ip>first&&ip<first+2**(32-prefix)-1;
 }
 const create=()=>({nodes:[],links:[],sequence:0,linkSequence:0,serial:{},log:[]});
 function add(state,type,x,y){
  if(!Object.hasOwn(types,type)||state.nodes.length>=24)return null;
  const serial=(state.serial[type]||0)+1;
  state.serial[type]=serial;
  const node={
   id:'n'+(++state.sequence),type,serial,x,y,gateway:null,http:false,routes:[],
   ports:Object.fromEntries(types[type].ports.map(id=>[id,{ip:null,prefix:24,dhcp:false,method:'manual'}]))
  };
  state.nodes.push(node);
  return node;
 }
 const getNode=(state,id)=>state.nodes.find(node=>node.id===id);
 const freePorts=(state,id)=>Object.keys(getNode(state,id)?.ports||{}).filter(port=>!state.links.some(link=>[link.a,link.b].some(end=>end.node===id&&end.port===port)));
 function connect(state,a,b,sourcePort,targetPort){
  if(a===b)return {ok:false,text:'Выбери два разных устройства.'};
  const from=freePorts(state,a),to=freePorts(state,b);
  const ap=sourcePort||from[0],bp=targetPort||to[0];
  if(!from.includes(ap)||!to.includes(bp))return {ok:false,text:'У одного из устройств нет свободного порта.'};
  const link={id:'l'+(++state.linkSequence),a:{node:a,port:ap},b:{node:b,port:bp}};
  state.links.push(link);
  return {ok:true,text:'Кабель подключён.',link};
 }
 function remove(state,id){
  state.nodes=state.nodes.filter(node=>node.id!==id);
  state.links=state.links.filter(link=>link.a.node!==id&&link.b.node!==id);
 }
 function configure(device,port,input){
  if(!device?.ports[port]||device.type==='switch')return {ok:false,text:'Выбери доступный интерфейс.'};
  const ipText=input.ip.trim(),gatewayText=(input.gateway||'').trim();
  const prefix=parsePrefix(input.prefix);
  const ip=parseIP(ipText),gateway=parseIP(gatewayText);
  if(prefix===null)return {ok:false,text:'Введи маску IPv4 или длину префикса от 1 до 30.'};
  if(ipText&&!usable(ip,prefix))return {ok:false,text:'Введи допустимый IPv4-адрес узла для этой подсети.'};
  if(isHost(device)&&gatewayText&&(ip===null||!usable(gateway,prefix)||gateway===ip||!sameSubnet(ip,gateway,prefix)))
   return {ok:false,text:'Шлюз должен быть адресом другого узла в той же подсети.'};
  Object.assign(device.ports[port],{ip,prefix,dhcp:device.type==='router'&&ip!==null&&Boolean(input.dhcp),method:'manual'});
  if(isHost(device))device.gateway=gateway;
  if(device.type==='server')device.http=Boolean(input.http);
  return {ok:true,text:'Настройки сохранены.'};
 }
 function addRoute(device,input){
  if(device?.type!=='router')return {ok:false,text:'Выбери роутер.'};
  const prefix=parsePrefix(input.prefix,0,32);
  const destination=parseIP(input.destination.trim()),via=parseIP(input.via.trim());
  if(prefix===null||destination===null||via===null||via===0)return {ok:false,text:'Проверь сеть назначения, префикс и адрес следующего роутера.'};
  const subnet=network(destination,prefix);
  const route={subnet,prefix,via};
  device.routes=device.routes.filter(item=>item.subnet!==subnet||item.prefix!==prefix);
  device.routes.push(route);
  return {ok:true,text:'Маршрут сохранён.'};
 }
 function entries(state){
  return state.nodes.filter(node=>node.type!=='switch').flatMap(node=>Object.keys(node.ports).map(port=>endpoint(node,port)));
 }
 const endpoint=(node,port)=>({node,port,...node.ports[port]});
 function segment(state,start){
  const queue=[{node:start.node.id,port:start.port,path:[]}],seen=new Set(),peers=[];
  for(const here of queue){
   const key=here.node+'@'+here.port;
   if(seen.has(key))continue;
   seen.add(key);
   const link=state.links.find(item=>[item.a,item.b].some(side=>side.node===here.node&&side.port===here.port));
   if(!link)continue;
   const far=link.a.node===here.node?link.b:link.a;
   const node=getNode(state,far.node);
   const path=[...here.path,link.id];
   if(node.type==='switch'){
    seen.add(node.id+'@'+far.port);
    for(const port of Object.keys(node.ports))if(port!==far.port)queue.push({node:node.id,port,path});
   }else if(node.id!==start.node.id)peers.push({...endpoint(node,far.port),path});
  }
  return peers;
 }
 function lease(state,id){
  const node=getNode(state,id);
  if(!node||!isHost(node))return {ok:false,text:'DHCP доступен для ПК и сервера.'};
  const peers=segment(state,endpoint(node,'eth0'));
  const offer=peers.find(peer=>peer.node.type==='router'&&peer.ip!==null&&peer.dhcp);
  if(!offer)return {ok:false,text:'Нет ответа DHCP. Проверь кабель и DHCP на интерфейсе роутера.'};
  const low=network(offer.ip,offer.prefix),last=low+2**(32-offer.prefix)-2;
  const used=new Set(peers.filter(peer=>peer.ip!==null).map(peer=>peer.ip));
  const start=last-low>=100?low+100:low+1;
  let ip=start;
  while(ip<=last&&used.has(ip))ip++;
  if(ip>last){
   ip=low+1;
   while(ip<start&&used.has(ip))ip++;
   if(ip===start)return {ok:false,text:'В этой подсети нет свободных адресов DHCP.'};
  }
  Object.assign(node.ports.eth0,{ip,prefix:offer.prefix,method:'dhcp'});
  node.gateway=offer.ip;
  return {ok:true,text:'Адрес получен по DHCP.',path:offer.path};
 }
 function trace(state,start,destination){
  const seen=new Set(),path=[];
  let current=start;
  while(current){
   const node=current.node;
   if(seen.has(node.id))return {ok:false,text:'Обнаружена петля маршрутизации.',path};
   seen.add(node.id);
   if(Object.values(node.ports).some(item=>item.ip===destination))return {ok:true,path};
   const local=Object.keys(node.ports).map(port=>endpoint(node,port)).filter(item=>item.ip!==null).sort((a,b)=>b.prefix-a.prefix);
   let target=destination;
   let output=local.find(item=>sameSubnet(item.ip,destination,item.prefix));
   if(!output){
    const route=node.type==='router'?node.routes.filter(item=>item.prefix===0||network(destination,item.prefix)===item.subnet).sort((a,b)=>b.prefix-a.prefix)[0]:null;
    target=isHost(node)?node.gateway:route?.via;
    if(target===null||target===undefined)return {ok:false,text:isHost(node)?'Для другой подсети нужен шлюз.':'Роутер не знает маршрут к этой подсети.',path};
    output=local.find(item=>sameSubnet(item.ip,target,item.prefix));
   }
   if(!output)return {ok:false,text:'Следующий шлюз недоступен через настроенные интерфейсы.',path};
   const peer=segment(state,output).find(item=>item.ip===target);
   if(!peer)return {ok:false,text:'Узел следующего перехода не отвечает. Проверь кабель, порт и адрес.',path};
   path.push(...peer.path);
   current=peer;
  }
 }
 function test(state,sourceId,address,service='ping'){
  const destination=parseIP(address.trim());
  if(destination===null)return {ok:false,text:'Введи IPv4-адрес назначения.',path:[]};
  const source=getNode(state,sourceId);
  if(!source||!isHost(source)||source.ports.eth0.ip===null)return {ok:false,text:'Выбери ПК или сервер с настроенным IPv4.',path:[]};
  const candidates=entries(state).filter(item=>item.ip===destination);
  if(candidates.length!==1)return {ok:false,text:candidates.length?'На схеме повторяется адрес назначения.':'Этот IPv4-адрес не назначен ни одному устройству.',path:[]};
  const target=candidates[0];
  const from=endpoint(source,'eth0');
  if(entries(state).filter(item=>item.ip===from.ip).length!==1)return {ok:false,text:'На схеме повторяется адрес отправителя.',path:[]};
  const forward=trace(state,from,destination);
  if(!forward.ok)return forward;
  const reverse=trace(state,target,from.ip);
  if(!reverse.ok)return {ok:false,text:'Пакет дошёл, но ответ не вернулся. Проверь обратный маршрут или шлюз.',path:forward.path};
  if(service==='http'&&(target.node.type!=='server'||!target.node.http))
   return {ok:false,text:'Сеть доступна, но HTTP на этом адресе не включён.',path:forward.path};
  return {ok:true,text:service==='http'?'HTTP 200 OK · Сервер ответил.':'Ping успешен · Ответ получен.',path:forward.path};
 }
 function example(){
  const state=create();
  const router=add(state,'router',49,27),sw=add(state,'switch',29,54);
  const pc=add(state,'pc',20,78),server=add(state,'server',76,59);
  connect(state,router.id,sw.id,'G0/0');
  connect(state,sw.id,pc.id);
  connect(state,router.id,server.id,'G0/1');
  configure(router,'G0/0',{ip:'192.168.10.1',prefix:24,dhcp:true});
  configure(router,'G0/1',{ip:'192.168.20.1',prefix:24});
  configure(server,'eth0',{ip:'192.168.20.10',prefix:24,gateway:'192.168.20.1',http:true});
  lease(state,pc.id);
  return state;
 }
 return {types,create,add,remove,getNode,freePorts,connect,configure,addRoute,lease,test,example,formatIP};
});
