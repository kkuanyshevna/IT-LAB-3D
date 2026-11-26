({THREE,orbit,objectRoot,group,box,rounded,tube,materials,portPositions,pressKey})=>{
 const {black,steel,plastic,blue,green}=materials;
 const bench=group(),keyboard=group(),mouse=group(),wires=group();
 bench.add(keyboard,mouse,wires);objectRoot.add(bench);bench.visible=false;
 keyboard.position.set(-4.06,.13,3.18);
 keyboard.rotation.y=.15;
 const keyboardBase=rounded(keyboard,0,0,0,2.92,1.11,.13,black,.075);
 keyboardBase.rotation.x=-Math.PI/2;
 const keycaps=new Map();
 const rows=['1234567890','qwertyuiop','asdfghjkl','zxcvbnm'];
 function key(value,legend,x,z,width=.237){
  const cap=box(keyboard,x,.091,z,width,.078,.183,plastic);
  const stamp=document.createElement('canvas');
  stamp.width=stamp.height=64;
  const text=stamp.getContext('2d');
  text.fillStyle='#d4e3e8';text.textAlign='center';text.textBaseline='middle';
  text.font=legend.length>1?'600 20px Arial':'600 43px Arial';
  text.fillText(legend,32,34,60);
  const map=new THREE.CanvasTexture(stamp);map.colorSpace=THREE.SRGBColorSpace;
  const mark=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width-.035,.19),.14),new THREE.MeshBasicMaterial({map,transparent:true,toneMapped:false,depthWrite:false}));
  mark.position.set(x,.132,z);mark.rotation.x=-Math.PI/2;keyboard.add(mark);
  keycaps.set(cap,value);keycaps.set(mark,value);
 }
 rows.forEach((row,index)=>{
  [...row].forEach((value,column)=>key(value,value.toUpperCase(),(column-(row.length-1)/2)*.25,-.406+index*.213));
 });
 key('Backspace','⌫',1.25,.013,.235);
 key('Enter','↵',1.04,.228,.28);
 key(' ','SPACE',0,.444,1.34);
 const keyboardLed=box(keyboard,1.32,.082,-.396,.068,.014,.035,steel);

 mouse.position.set(-2.19,.13,3.13);mouse.rotation.y=-.14;
 const shell=rounded(mouse,0,.01,0,.55,.82,.22,plastic,.19);
 shell.rotation.x=-Math.PI/2;
 const left=rounded(mouse,-.129,.129,-.207,.234,.333,.064,black,.065);
 left.rotation.x=-Math.PI/2;
 const right=rounded(mouse,.129,.129,-.207,.234,.333,.064,black,.065);
 right.rotation.x=-Math.PI/2;
 box(mouse,0,.163,-.133,.078,.043,.163,steel);
 const mouseLed=box(mouse,0,.125,.232,.095,.022,.034,steel);
 let state={},selected=null,cache='';

 const stage=document.getElementById('stage'),usbView=document.getElementById('usbView');
 const keyboardView=document.getElementById('keyboardView');
 const names={keyboard:'Клавиатура',mouse:'Мышь'};
 function post(action,value){window.parent.postMessage({type:'itlab-usb',action,value},'*');}
 usbView.addEventListener('click',()=>post('open'));
 keyboardView.addEventListener('click',()=>{
  orbit.target.copy(keyboard.localToWorld(new THREE.Vector3(0,0,0)));
  const narrow=Math.min(1,orbit.object.aspect);
  orbit.object.position.copy(keyboard.localToWorld(new THREE.Vector3(.08,3.35/narrow,1.6/narrow)));
  orbit.update();
 });
 function tag(text,kind,action,value){
  const button=document.createElement('button');
  button.type='button';button.className='usb-tag usb-'+kind;button.hidden=true;
  button.textContent=text;button.addEventListener('click',()=>post(action,value));stage.append(button);
  return button;
 }
 const deviceTags=Object.fromEntries(Object.entries(names).map(([id,name])=>[id,tag(name,'device','select',id)]));
 const ports=Object.entries(portPositions).map(([id,coords])=>({
  id:Number(id),point:new THREE.Vector3(...coords),button:tag('USB '+id,'port','connect',Number(id))
 }));
 const links={
  keyboard:{model:keyboard,material:blue,endpoint:new THREE.Vector3(0,.035,-.57)},
  mouse:{model:mouse,material:black,endpoint:new THREE.Vector3(0,.08,-.43)}
 };
 function updateWires(){
  const key=Object.keys(links).map(id=>state.usb?.[id]||'').join(',');
  if(cache===key)return;
  cache=key;
  for(const mesh of [...wires.children]){wires.remove(mesh);mesh.geometry.dispose();}
  Object.entries(links).forEach(([id,link])=>{
   const port=state.usb?.[id];
   if(!port)return;
   const [x,y,z]=portPositions[port];
   const start=link.endpoint.clone().applyEuler(link.model.rotation).add(link.model.position).toArray();
   tube(wires,[start,[start[0],.22,start[2]-.43],[-2.55,.11,1.58],[-2.3,.15,.24],[x-.38,1.12,z],[x-.31,y-.16,z],[x-.13,y,z]],.023,link.material);
   box(wires,x-.075,y,z,.23,.132,.255,link.material);
  });
 }
 function setState(next,device){
  state=next;selected=device;
  bench.visible=state.mode==='assembly';usbView.hidden=!bench.visible;
  keyboardView.hidden=!bench.visible||!state.power||!state.usb?.keyboard;
  if(!bench.visible)return;
  updateWires();
  keyboardLed.material=state.power&&state.usb?.keyboard?green:steel;
  mouseLed.material=state.power&&state.usb?.mouse?green:steel;
  for(const [id,button]of Object.entries(deviceTags)){
   button.setAttribute('aria-pressed',String(id===selected));
   button.toggleAttribute('data-connected',Boolean(state.usb?.[id]));
  }
  for(const {id,button}of ports){
   button.disabled=!selected;
   button.toggleAttribute('data-connected',Object.values(state.usb||{}).includes(id));
  }
 }
 function showPorts(){
  if(!bench.visible||!state.boardInstalled)return;
  orbit.target.copy(objectRoot.localToWorld(new THREE.Vector3(-1.68,4.40,-.43)));
  const narrow=Math.min(1,orbit.object.aspect);
  orbit.object.position.copy(objectRoot.localToWorld(new THREE.Vector3(-1.68-4.65/narrow,4.84,-.78)));
  orbit.update();
 }
 function place(button,point,visible,project){
  const projected=visible?project(point):null;
  button.hidden=!projected?.visible;
  if(button.hidden)return;
  const left=Math.round(projected.canvasX)+'px',top=Math.round(projected.canvasY)+'px';
  if(button.style.left!==left)button.style.left=left;
  if(button.style.top!==top)button.style.top=top;
 }
 function update(project,camera){
  const fromRear=state.boardInstalled&&objectRoot.worldToLocal(camera.position.clone()).x<-3;
  for(const [id,button]of Object.entries(deviceTags)){
   const device=links[id].model;
   place(button,device.localToWorld(new THREE.Vector3(0,.16,.47)),bench.visible&&!fromRear,project);
  }
  for(const {point,button}of ports){
   place(button,objectRoot.localToWorld(point.clone()),bench.visible&&fromRear,project);
  }
 }
 function click(raycaster){
  if(!bench.visible)return false;
  const hit=raycaster.intersectObjects([keyboard,mouse],true)[0];
  if(hit){
   const value=keycaps.get(hit.object);
   if(value!==undefined&&pressKey(value))return true;
   post('select',hit.object.parent===keyboard?'keyboard':'mouse');
   return true;
  }
  if(!state.boardInstalled||!selected||objectRoot.worldToLocal(raycaster.ray.origin.clone()).x>=-3)return false;
  const port=ports.find(({point})=>raycaster.ray.distanceSqToPoint(objectRoot.localToWorld(point.clone()))<.016);
  if(!port)return false;
  post('connect',port.id);return true;
 }
 return {setState,showPorts,update,click};
}
