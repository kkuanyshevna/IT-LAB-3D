({THREE,orbit,objectRoot,group,box,cyl,rounded,label,materials})=>{
 const {black,dark,steel,silver,gold}=materials;
 const monitor=group();
 const powerPoint=new THREE.Vector3(1.63,1.49,.19);
 const inputPoint=new THREE.Vector3(1.31,1.49,.19);
 const hdmiPoint=new THREE.Vector3(.18,1.86,-.25);
 monitor.position.set(-4.19,0,1.41);
 monitor.rotation.y=.22;
 objectRoot.add(monitor);
 monitor.visible=false;

 rounded(monitor,0,2.60,0,3.82,2.31,.30,black,.085);
 const rearCover=new THREE.MeshStandardMaterial({color:0x364551,metalness:.15,roughness:.65});
 rounded(monitor,0,2.62,-.18,3.39,1.98,.11,rearCover,.09);
 rounded(monitor,0,2.66,.158,3.72,2.13,.025,dark,.04);
 const canvas=document.createElement('canvas');
 canvas.width=768;canvas.height=432;
 const context=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(3.62,2.036),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
 screen.position.set(0,2.66,.181);
 monitor.add(screen);
 rounded(monitor,0,.086,-.27,1.74,.78,.13,black,.13).rotation.x=-Math.PI/2;
 rounded(monitor,0,.90,-.34,.30,1.55,.25,steel,.055);
 box(monitor,0,2.33,-.27,.63,.58,.12,steel);
 for(let i=0;i<14;i++)box(monitor,-1.37+i*.21,3.36,-.24,.13,.025,.018,dark);
 const indicator=new THREE.MeshBasicMaterial({color:0xb48b45,toneMapped:false});
 cyl(monitor,1.48,1.49,.171,.022,.016,indicator,'z');
 const powerButton=cyl(monitor,...powerPoint.toArray(),.071,.047,silver,'z');
 const inputButton=rounded(monitor,...inputPoint.toArray(),.14,.079,.038,steel,.025);
 label(monitor,'IT LAB',-.03,1.49,.169,.6,.10,'#7f949b');
 function rearLabel(text,x,y,width){
  const mark=label(monitor,text,x,y,-.269,width,.09);
  mark.rotation.y=Math.PI;
 }
 rounded(monitor,0,1.87,-.225,1.37,.34,.058,dark,.035);
 const hdmiPort=box(monitor,...hdmiPoint.toArray(),.30,.108,.055,silver);
 const hdmiContacts=[box(monitor,.18,1.86,-.285,.24,.057,.021,dark)];
 for(let i=0;i<7;i++)hdmiContacts.push(box(monitor,.08+i*.031,1.86,-.298,.012,.014,.006,gold));
 rearLabel('HDMI',.18,2.02,.35);
 box(monitor,-.33,1.86,-.25,.25,.1,.043,silver);
 box(monitor,-.33,1.86,-.28,.193,.053,.013,dark);
 rearLabel('DP',-.33,2.02,.26);

 const front=document.getElementById('monitorFront'),back=document.getElementById('monitorBack');
 const canvasHost=document.getElementById('stage');
 const controls=document.createElement('div');
 controls.className='monitor-controls';controls.hidden=true;
 const power=document.createElement('button'),input=document.createElement('button'),cable=document.createElement('button');
 function send(action){if(monitor.visible)window.parent.postMessage({type:'itlab-monitor',action},'*');}
 for(const [button,action] of [[power,'monitorPower'],[input,'monitorInput'],[cable,'monitorCable']]){
  button.type='button';
  button.addEventListener('click',()=>send(action));
 }
 power.textContent='⏻';power.setAttribute('aria-label','Питание монитора');power.title='Питание монитора';
 input.setAttribute('aria-label','Переключить вход монитора');input.title='Переключить вход монитора';
 cable.textContent='HDMI';cable.setAttribute('aria-label','Подключить или отключить HDMI');
 controls.append(power,input);canvasHost.append(controls,cable);
 cable.className='monitor-controls monitor-hdmi';cable.hidden=true;

 function frame(rear){
  if(!monitor.visible)return;
  orbit.target.copy(monitor.localToWorld(new THREE.Vector3(0,2.42,0)));
  const narrow=Math.min(1,orbit.object.aspect);
  orbit.object.position.copy(monitor.localToWorld(new THREE.Vector3(rear?-.4:.12,2.65,(rear?-1:1)*6.5/narrow)));
  orbit.update();
 }
 front.addEventListener('click',()=>frame(false));
 back.addEventListener('click',()=>frame(true));

 let info={kind:'off',title:'Монитор выключен'},cache='';
 function draw(){
  const i18n=window.ITLAB_I18N;
  const t=text=>i18n?.translate(text)||text;
  const key=[info.kind,info.title,info.detail,i18n?.language].join('|');
  if(key===cache)return;
  cache=key;
  const {width,height}=canvas;
  const lit=info.kind==='desktop'||info.kind==='firmware';
  context.fillStyle='#090f14';
  if(info.kind==='desktop'){
   const gradient=context.createLinearGradient(0,0,width,height);
   gradient.addColorStop(0,'#10304a');gradient.addColorStop(1,'#154737');
   context.fillStyle=gradient;
  }
  context.fillRect(0,0,width,height);
  if(info.kind!=='off'){
   context.fillStyle=lit?'#99ddda':'#8cacc2';context.font='600 25px Arial';context.textAlign='left';
   context.fillText(info.kind==='firmware'?'IT LAB · UEFI':'IT LAB',32,54);
   context.textAlign='center';
   if(info.kind==='desktop'){
    context.strokeStyle='#9ee7bf';context.lineWidth=5;context.beginPath();context.arc(384,135,30,0,2*Math.PI);context.stroke();
    context.beginPath();context.moveTo(368,135);context.lineTo(380,147);context.lineTo(400,122);context.stroke();
   }
   context.fillStyle='#e6f3f8';context.font='600 52px Arial';context.fillText(t(info.title),width/2,231,690);
   context.fillStyle='#9dd7d5';context.font='29px Arial';context.fillText(t(info.detail||''),width/2,283,690);
   if(info.kind==='desktop'){context.fillStyle='#153442';context.fillRect(0,height-37,width,37);}
  }
  texture.needsUpdate=true;
  indicator.color.setHex(info.kind==='off'?0x35464a:lit?0x82e0aa:0xd6a858);
 }
 window.addEventListener('itlab-language-change',draw);
 function setState(s,display={kind:'standby',title:'Нет сигнала',detail:'HDMI'},guideAction){
  monitor.visible=s.mode==='assembly';
  front.hidden=back.hidden=!monitor.visible;
  if(!monitor.visible)return;
  info=display;draw();
  power.setAttribute('aria-pressed',String(s.monitorOn!==false));
  power.toggleAttribute('data-guided',guideAction==='monitorPower');
  input.textContent=s.monitorInput||'HDMI';input.disabled=s.monitorOn===false;
  input.toggleAttribute('data-guided',guideAction==='monitorInput');
  cable.setAttribute('aria-pressed',String(Boolean(s.wiring?.monitor)));
 }
 function place(node,p,visible){
  node.hidden=!visible||!p?.visible;
  if(node.hidden)return;
  const left=Math.round(p.canvasX)+'px',top=Math.round(p.canvasY)+'px';
  if(node.style.left!==left)node.style.left=left;
  if(node.style.top!==top)node.style.top=top;
 }
 const frontDock=new THREE.Vector3(0,1.39,.18);
 function update(project,camera){
  if(!monitor.visible){controls.hidden=cable.hidden=true;return;}
  const face=monitor.localToWorld(new THREE.Vector3(0,2.6,0));
  const normal=new THREE.Vector3(0,0,1).transformDirection(monitor.matrixWorld);
  const dot=normal.dot(camera.position.clone().sub(face).normalize());
  place(controls,project(monitor.localToWorld(frontDock.clone())),dot>.38);
  place(cable,project(monitor.localToWorld(hdmiPoint.clone())),dot<-.38);
 }
 const hitAreas=new Map([[powerButton,'monitorPower'],[inputButton,'monitorInput'],...[hdmiPort,...hdmiContacts].map(port=>[port,'monitorCable'])]);
 function click(raycaster){
  if(!monitor.visible)return;
  const hit=raycaster.intersectObjects(monitor.children,false)[0];
  const action=hitAreas.get(hit?.object);
  if(action)send(action);
 }
 function anchor(point){return point.clone().applyEuler(monitor.rotation).add(monitor.position).toArray();}
 return {setState,update,click,cableEnd:anchor(hdmiPoint)};
}
