{
 title:'Компьютерная мастерская',
 explanation:'Среднеразмерный системный блок ATX и домашний роутер. Вращайте модель, приближайте детали и нажимайте на них. Кнопка «Разобрать» раскрывает внутреннее устройство.',
 status:'Реалистичная учебная реконструкция · ATX · без привязки к производителю',
 footnote:'Расположение разъёмов и размеры обобщены. Движущиеся линии показывают учебные связи между компонентами, а не электрическую схему или движение электронов. Внутренности блока питания не вскрываются.',
 build({THREE,scene,objectRoot,addPart}) {
  const M=(color,metalness=.35,roughness=.45)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const black=M(0x20292e,.6,.4), steel=M(0x424e55,.78,.3), silver=M(0xaab6bc,.9,.25), pcb=M(0x16382e,.2,.7), dark=M(0x172026,.3,.7), gold=M(0xc6a35d,.8,.3), copper=M(0xb47742,.85,.3), white=M(0xc5d0d4,.2,.6), plastic=M(0x242c30,.1,.6), blue=M(0x226b99,.25,.4), green=M(0x489f76,.2,.5);
  const group=()=>new THREE.Group();
  function box(g,x,y,z,w,h,d,m=steel){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;}
  function cyl(g,x,y,z,r,h,m=silver,axis='y',segments=20){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;}
  function ring(g,x,y,z,r,t,m,axis='z'){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),m);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;}
  function tube(g,pts,r,m){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,28,r,7,false),m);g.add(o);return o;}
  // Repeated fine details share geometry and one draw call per material.
  function batch(g,geometry,material,items){const mesh=new THREE.InstancedMesh(geometry,material,items.length),dummy=new THREE.Object3D();items.forEach((item,i)=>{dummy.position.set(...item.p);dummy.rotation.set(...(item.r||[0,0,0]));dummy.scale.set(...(item.s||[1,1,1]));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;g.add(mesh);return mesh;}
  function rounded(g,x,y,z,w,h,d,m,r=.05){const shape=new THREE.Shape();const a=-w/2,b=-h/2;shape.moveTo(a+r,b);shape.lineTo(a+w-r,b);shape.quadraticCurveTo(a+w,b,a+w,b+r);shape.lineTo(a+w,b+h-r);shape.quadraticCurveTo(a+w,b+h,a+w-r,b+h);shape.lineTo(a+r,b+h);shape.quadraticCurveTo(a,b+h,a,b+h-r);shape.lineTo(a,b+r);shape.quadraticCurveTo(a,b,a+r,b);const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:Math.min(.015,d/4),bevelThickness:Math.min(.015,d/4),curveSegments:3});geometry.translate(0,0,-d/2);const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);g.add(mesh);return mesh;}
  function label(g,text,x,y,z,w,h,materialColor='#c5d4d6',rotation=0){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#111a1b';ctx.fillRect(0,0,512,128);ctx.fillStyle=materialColor;ctx.font='bold 44px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,495);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.x=rotation;g.add(mesh);return mesh;}
  function screw(g,x,y,z,axis='z'){cyl(g,x,y,z,.043,.032,silver,axis,12);if(axis==='z'){box(g,x,y,z+.02,.045,.008,.003,black);box(g,x,y,z+.021,.008,.045,.003,black);}}
  const spins=[];
  function fan(parent,x,y,z,size=1,axis='z',rim=green){const g=group();parent.add(g);g.position.set(x,y,z);if(axis==='x')g.rotation.y=Math.PI/2;if(axis==='y')g.rotation.x=-Math.PI/2;const r=size/2;
   ring(g,0,0,0,r-.045,.043,plastic);ring(g,0,0,.045,r-.083,.015,rim);ring(g,0,0,-.045,r-.075,.012,steel);
   for(let i=0;i<4;i++){const a=i*Math.PI/2+.45;const strut=box(g,Math.cos(a)*r*.5,Math.sin(a)*r*.5,-.06,r*.76,.035,.035,black);strut.rotation.z=a;}
   const blades=group();g.add(blades);const shape=new THREE.Shape();shape.moveTo(r*.18,-r*.035);shape.bezierCurveTo(r*.42,-r*.04,r*.65,-r*.22,r*.90,-r*.20);shape.bezierCurveTo(r*.98,-r*.07,r*.90,r*.04,r*.77,r*.10);shape.bezierCurveTo(r*.60,r*.16,r*.33,r*.13,r*.18,r*.05);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,curveSegments:6});batch(blades,geometry,plastic,Array.from({length:9},(_,i)=>({p:[0,0,0],r:[.10,0,i*Math.PI*2/9]})));
   cyl(blades,0,0,.032,r*.21,.095,plastic,'z');cyl(blades,0,0,.085,r*.115,.012,steel,'z');ring(blades,0,0,.09,r*.16,.005,silver);spins.push(blades);
   for(let ix of [-1,1])for(let iy of [-1,1]){rounded(g,ix*(r-.04),iy*(r-.04),-.025,.12,.12,.09,black,.025);screw(g,ix*(r-.04),iy*(r-.04),.04);}return g;}
  const registry={};
  const microParts=__MICRO_DATA__;
  function mergeStatic(g){
   // Preserve actual moving blades and the removable PSU inspection cover.
   // Combining the other meshes keeps added detail inexpensive to draw.
   g.updateMatrixWorld(true);const inverse=g.matrixWorld.clone().invert(),byMaterial=new Map();
   g.traverse(node=>{if(!node.isMesh||node.isInstancedMesh||Array.isArray(node.material)||node.userData.inspectionCover)return;
    let ancestor=node;while(ancestor&&ancestor!==g){if(spins.includes(ancestor))return;ancestor=ancestor.parent;}
    if(Math.abs(node.position.y-.75)<.01&&Math.abs(node.position.z-1.31)<.01)return;
    const list=byMaterial.get(node.material)||[];list.push(node);byMaterial.set(node.material,list);
   });
   for(const [material,nodes]of byMaterial){if(nodes.length<4)continue;let count=0;const prepared=[];
    for(const node of nodes){const geometry=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld));if(!geometry.attributes.normal)geometry.computeVertexNormals();count+=geometry.attributes.position.count;prepared.push(geometry);}
    const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);let cursor=0;
    for(const geometry of prepared){const n=geometry.attributes.position.count;positions.set(geometry.attributes.position.array,cursor*3);normals.set(geometry.attributes.normal.array,cursor*3);if(geometry.attributes.uv)uvs.set(geometry.attributes.uv.array,cursor*2);cursor+=n;geometry.dispose();}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.computeBoundingSphere();
    for(const node of nodes)node.visible=false;
    const merged=new THREE.Mesh(geometry,material);merged.name='Объединённые статичные детали';g.add(merged);
   }
  }
  const register=(name,info,g,explode,anchor)=>{if(name!=='Сетевой кабель')mergeStatic(g);registry[name]=g;addPart({name,info,group:g,explode,anchor});return g;};
  // Chassis: open side, continuous steel members, panel seams, vents and feet.
  const chassis=group();
  box(chassis,0,.08,0,3.35,.13,2.86,black);box(chassis,0,5.65,0,3.35,.12,2.86,black);
  box(chassis,0,2.85,-1.39,3.35,5.5,.08,steel);
  for(const x of [-1.62,1.62])for(const z of [-1.36,1.36])box(chassis,x,2.85,z,.09,5.55,.09,steel);
  for(const y of [.18,5.55])for(const z of [-1.37,1.37])box(chassis,0,y,z,3.3,.09,.09,steel);
  box(chassis,0,1.32,-.05,3.19,.075,2.6,black);
  label(chassis,'IT LAB  /  ATX',-.3,1.04,1.344,1.8,.17);
  box(chassis,0,.75,1.31,3.23,1.05,.035,black);
  for(const x of [-1.2,1.2])for(const z of [-.98,.98])box(chassis,x,-.04,z,.32,.17,.4,plastic);
  for(let i=0;i<15;i++)box(chassis,-1.32+i*.19,5.72,-.08,.055,.014,1.75,dark);
  box(chassis,1.67,2.88,-1.2,.06,5.4,.2,steel);box(chassis,1.67,2.88,1.2,.06,5.4,.2,steel);
  for(const y of [1.9,3.15,4.4])fan(chassis,1.63,y,0,1.11,'x',green);
  for(let i=0;i<13;i++)box(chassis,1.77,2.88,-1.08+i*.18,.025,5.35,.017,dark);
  cyl(chassis,1.1,5.73,.9,.095,.025,silver);box(chassis,.7,5.73,.92,.25,.015,.09,blue);box(chassis,.28,5.73,.92,.25,.015,.09,blue);
  for(let i=0;i<7;i++){box(chassis,-1.68,1.62+i*.16,.45,.035,.105,1.4,steel);for(let j=0;j<5;j++)box(chassis,-1.703,1.62+i*.16,-.08+j*.2,.008,.045,.12,black);}
  // Rear exhaust, rolled frame edges and removable fan-filter mesh.
  fan(chassis,-1.63,4.66,.48,1.15,'x',steel);
  for(const r of [.14,.24,.34,.44,.53])ring(chassis,-1.735,4.66,.48,r,.009,steel,'x');
  const rearStruts=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;rearStruts.push({p:[-1.75,4.66+Math.cos(a)*.28,.48+Math.sin(a)*.28],r:[a,0,0]});}batch(chassis,new THREE.BoxGeometry(.016,.58,.014),steel,rearStruts);
  const frontMesh=[];for(let y=0;y<39;y++)for(let z=0;z<15;z++)if((y+z)%2===0)frontMesh.push({p:[1.794,.48+y*.132,-1.03+z*.145]});batch(chassis,new THREE.BoxGeometry(.008,.024,.065),black,frontMesh);
  for(const x of [-1.5,1.5])for(const z of [-1.21,1.21]){box(chassis,x,.16,z,.16,.08,.16,silver);screw(chassis,x,.21,z,'y');}
  rounded(chassis,.93,5.738,.88,.47,.41,.025,black,.04).rotation.x=-Math.PI/2;
  ring(chassis,1.1,5.75,.9,.067,.008,green,'y');
  // Rear sheet seam, slot fasteners and a small intake filter pull tab.
  for(let i=0;i<7;i++)screw(chassis,-1.72,1.62+i*.16,1.08,'x');
  rounded(chassis,1.79,.43,0,.02,.16,.42,steel,.008);
  for(const x of [-1.58,1.58])for(const y of [.25,5.5])screw(chassis,x,y,1.42);
  register('Корпус','Металлический корпус удерживает компоненты, защищает их и задаёт путь воздушного потока. Передние вентиляторы подают воздух внутрь, верхняя и задняя зоны служат для его отвода. Учебная компоновка обобщена.',chassis,[0,0,0],[1.65,5.2,1.4]);
  // Transparent side with metal edge and thumbscrews.
  const panel=group();
  const glass=new THREE.MeshPhysicalMaterial({color:0x8da8b0,metalness:.1,roughness:.12,transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide});
  const windowMesh=box(panel,0,2.87,1.47,3.15,5.22,.035,glass);
  // A transparent window must not intercept clicks intended for visible internal parts.
  // Its physical frame remains selectable as the side-panel assembly.
  windowMesh.raycast=()=>{};
  for(const x of [-1.58,1.58])box(panel,x,2.87,1.48,.045,5.28,.04,black);
  for(const y of [.23,5.51])box(panel,0,y,1.48,3.2,.045,.04,black);
  for(const x of [-1.5,1.5])for(const y of [.35,5.4])screw(panel,x,y,1.51);
  register('Боковая панель','Съёмная боковая панель открывает доступ к внутренним компонентам. Здесь она прозрачная, чтобы изучать устройство без потери обзора. Разборка — только виртуальная.',panel,[2.4,.2,2.5],[1.45,5.5,1.5]);
  const board=group();
  const texCanvas=document.createElement('canvas');texCanvas.width=1024;texCanvas.height=1536;const ctx=texCanvas.getContext('2d');const substrate=ctx.createLinearGradient(0,0,1024,1536);substrate.addColorStop(0,'#214d3e');substrate.addColorStop(.5,'#14372d');substrate.addColorStop(1,'#254e3d');ctx.fillStyle=substrate;ctx.fillRect(0,0,1024,1536);ctx.strokeStyle='#497961';ctx.lineWidth=1.2;for(let i=0;i<215;i++){const x=25+(i*97)%970,y=20+(i*137)%1460;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+25,y);ctx.lineTo(x+42,y+17);ctx.lineTo(x+42,y+60+(i%5)*12);ctx.stroke();}for(let i=0;i<320;i++){const x=15+(i*109)%995,y=25+(i*173)%1490;ctx.fillStyle=i%4===0?'#b9a064':'#739d80';ctx.beginPath();ctx.arc(x,y,i%4===0?3.6:1.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#16362c';ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#aec5ae';ctx.font='22px monospace';ctx.fillText('ITLAB   ATX  /  DDR4',56,80);ctx.fillText('M.2  PCIe',360,910);ctx.fillText('PCIEX16',160,1130);ctx.fillText('DIMM_A2     DIMM_B2',630,220);ctx.font='15px monospace';for(let i=0;i<12;i++)ctx.fillText('C'+(28+i),45+(i%4)*230,1150+Math.floor(i/4)*110);ctx.strokeStyle='#94b29a';ctx.strokeRect(15,15,994,1506);const boardTex=new THREE.CanvasTexture(texCanvas);boardTex.colorSpace=THREE.SRGBColorSpace;const boardMat=M(0xffffff,.15,.8);boardMat.map=boardTex;
  box(board,-.05,3.35,-1.0,2.9,3.95,.07,boardMat);
  // Silkscreen surrounds the actual connector positions on this teaching model.
  const print = (x,y) => [(x+1.5)/2.9*1024,(5.325-y)/3.95*1536];
  ctx.strokeStyle='#bdd1b4';
  ctx.lineWidth=1.5;
  ctx.font='15px monospace';
  const boardMarkings=[
    [-1.18,5.16,.43,.19,'EPS12V'],[-.4,4.03,1.08,1.12,'CPU SOCKET'],
    [.72,4.02,.78,1.8,'DIMM A/B'],[-.23,3.28,1.28,.34,'M2_1'],
    [-.25,2.94,2.12,.2,'PCIEX16_1'],[1.22,3.04,.27,.87,'ATX_PWR'],
    [.53,1.95,.84,.7,'PCH'],[.96,2.5,.2,.25,'U17'],[.18,1.52,.45,.18,'F_PANEL']
  ];
  for(const [x,y,w,h,caption] of boardMarkings){
    const [left,top]=print(x-w/2,y+h/2);
    const [right,bottom]=print(x+w/2,y-h/2);
    ctx.strokeRect(left,top,right-left,bottom-top);
    ctx.fillText(caption,left+2,top-5);
    ctx.fillRect(left-4,top-4,5,5);
  }
  ctx.strokeStyle='#537d5e';
  ctx.lineWidth=1.1;
  for(const [from,to,count,spacing] of [[[.04,4.24],[.37,4.32],12,.023],[[-.45,3.54],[-.72,3.34],8,.019],[[.77,2.08],[1.13,1.94],8,.02]]){
    for(let lane=0;lane<count;lane++){
      const dy=(lane-(count-1)/2)*spacing;
      const points=[[from[0],from[1]+dy],[(from[0]+to[0])/2,from[1]+dy],[to[0],to[1]+dy]];
      ctx.beginPath();ctx.moveTo(...print(...points[0]));
      for(const p of points.slice(1))ctx.lineTo(...print(...p));
      ctx.stroke();
    }
  }
  boardTex.needsUpdate=true;
  for(const x of [-1.38,1.27])for(const y of [1.48,3.35,5.17]){cyl(board,x,y,-.91,.065,.035,gold,'z');screw(board,x,y,-.87);}
  // Socket retention plate and lever remain visible in the exploded model.
  box(board,-.4,4.03,-.88,.99,1.04,.06,silver);box(board,-.4,4.03,-.835,.82,.86,.04,black);
  for(const x of [-.88,.08])box(board,x,4.03,-.79,.055,1.02,.035,silver);
  box(board,-.4,4.53,-.79,1.0,.05,.035,silver);box(board,-.4,3.53,-.79,1.0,.05,.035,silver);
  tube(board,[[.15,4.55,-.75],[.18,4.0,-.75],[.18,3.53,-.75],[.3,3.45,-.69]],.018,silver);
  const socketPins=[];for(let y=0;y<13;y++)for(let x=0;x<13;x++)if(!(x>3&&x<9&&y>3&&y<9))socketPins.push({p:[-.72+x*.053,3.7+y*.053,-.802],r:[Math.PI/2,0,0]});batch(board,new THREE.CylinderGeometry(.008,.008,.019,5),gold,socketPins);
  // Four DIMM slots, individual latch details.
  for(const x of [.4,.61,.82,1.03]){box(board,x,4.02,-.855,.11,1.64,.2,black);box(board,x,4.02,-.74,.022,1.45,.025,dark);for(const y of [3.16,4.88])box(board,x,y,-.72,.15,.14,.13,silver);}
  const dimmContacts=[];for(const x of [.4,.61,.82,1.03])for(let j=0;j<28;j++)if(j!==15)dimmContacts.push({p:[x,3.31+j*.052,-.723]});batch(board,new THREE.BoxGeometry(.028,.017,.01),gold,dimmContacts);
  for(const x of [.4,.61,.82,1.03])box(board,x,4.1,-.726,.065,.035,.035,steel);
  // PCIe x16 and shorter slots, locking tab.
  for(const y of [2.94,2.06]){box(board,-.25,y,-.83,1.94,.12,.2,black);box(board,-.25,y,-.72,1.76,.024,.012,dark);box(board,.78,y,-.73,.15,.19,.12,white);}
  box(board,-.75,2.5,-.82,.8,.1,.15,black);
  // VRM heatsinks with fins.
  for(let i=0;i<10;i++){box(board,-1.12,3.7+i*.12,-.7,.35,.06,.32,silver).userData.inspectionCover=true;box(board,-.85+i*.12,4.99,-.7,.06,.38,.32,silver).userData.inspectionCover=true;}
  for(let i=0;i<8;i++){cyl(board,-1.03+(i%2)*.18,3.68+Math.floor(i/2)*.24,-.7,.06,.15,silver,'z',12);}
  // Inductors and solid capacitors make the power-regulation area identifiable.
  const chokes=[];for(let i=0;i<6;i++)chokes.push({p:[-.97+i*.19,4.73,-.79]});for(let i=0;i<5;i++)chokes.push({p:[-.93,3.59+i*.19,-.78]});batch(board,new THREE.BoxGeometry(.13,.13,.13),dark,chokes);
  const capPositions=[];for(let i=0;i<8;i++)capPositions.push({p:[-.9+i*.15,4.57,-.76],r:[Math.PI/2,0,0]});for(let i=0;i<6;i++)capPositions.push({p:[-.96,2.15+i*.14,-.79],r:[Math.PI/2,0,0]});batch(board,new THREE.CylinderGeometry(.043,.043,.12,32),silver,capPositions);batch(board,new THREE.CylinderGeometry(.037,.037,.008,32),white,capPositions.map(i=>({p:[i.p[0],i.p[1],i.p[2]+.066],r:i.r})));batch(board,new THREE.BoxGeometry(.042,.003,.001),steel,capPositions.map(i=>({p:[i.p[0],i.p[1],i.p[2]+.071]})));
  microParts.find(p=>p.id==='capacitor').instances=capPositions.map(item=>[item.p[0],item.p[1],item.p[2]+.03]);
  microParts.find(p=>p.id==='choke').instances=chokes.map(item=>item.p);
  microParts.find(p=>p.id==='mosfet').instances=Array.from({length:6},(_,i)=>[-.97+i*.19,4.99,-.91]);
  const smd=[];for(let i=0;i<56;i++)smd.push({p:[-.95+(i%8)*.16,1.52+Math.floor(i/8)*.1,-.945]});batch(board,new THREE.BoxGeometry(.058,.025,.023),silver,smd);
  // Chipset, coin cell, SATA block and ATX 24-pin.
  box(board,.53,1.95,-.75,.78,.64,.22,steel).userData.inspectionCover=true;for(let i=0;i<6;i++)box(board,.23+i*.12,1.95,-.61,.035,.57,.05,silver).userData.inspectionCover=true;
  cyl(board,-.6,1.91,-.8,.17,.075,silver,'z');ring(board,-.6,1.91,-.75,.17,.018,black);
  for(let i=0;i<4;i++)box(board,1.18,1.7+i*.17,-.75,.2,.12,.22,black);
  box(board,1.22,3.04,-.76,.21,.81,.23,black);for(let i=0;i<12;i++)box(board,1.26,2.7+i*.058,-.63,.035,.025,.025,gold);
  const atxContacts=[];for(let row=0;row<2;row++)for(let i=0;i<12;i++)atxContacts.push({p:[1.17+row*.086,2.72+i*.058,-.631]});batch(board,new THREE.BoxGeometry(.045,.038,.012),dark,atxContacts);box(board,1.36,3.04,-.72,.07,.19,.1,steel);
  // USB and front-panel headers: keyed bases and individual metal pins.
  for(const [x,y,w]of[[-1.03,1.52,.42],[-.35,1.52,.37],[.18,1.52,.43]]){box(board,x,y,-.86,w,.15,.13,black);const pins=[];for(let row=0;row<2;row++)for(let i=0;i<5;i++)if(!(row===1&&i===4))pins.push({p:[x-w*.37+i*w*.18,y-.035+row*.07,-.74]});batch(board,new THREE.BoxGeometry(.016,.016,.15),gold,pins);}
  label(board,'F_PANEL',.17,1.37,-.943,.48,.065);label(board,'USB 2.0',-.42,1.37,-.943,.42,.065);
  // Rear IO: stacked USB ports, audio sockets, Ethernet frame.
  box(board,-1.5,4.16,-.63,.22,1.65,.68,silver);
  for(const y of [4.71,4.4,4.09]){box(board,-1.625,y,-.4,.035,.21,.37,black);box(board,-1.65,y,-.4,.045,.055,.24,blue);}
  for(let j=0;j<3;j++)cyl(board,-1.655,3.63+j*.17,-.43,.06,.055,[green,blue,copper][j],'x',14);
  box(board,-1.655,3.95,-.83,.038,.28,.32,black);box(board,-1.68,3.97,-.83,.025,.18,.22,dark);
  // Recessed connector mouths, Ethernet contacts and USB internal tongues.
  for(const y of [4.71,4.4,4.09])for(const z of [-.59,-.21])box(board,-1.65,y,z,.05,.23,.03,silver);
  const ethernetPins=[];for(let i=0;i<8;i++)ethernetPins.push({p:[-1.702,3.933,-.92+i*.025],r:[0,0,0]});batch(board,new THREE.BoxGeometry(.018,.065,.009),gold,ethernetPins);
  box(board,-1.705,4.07,-.91,.016,.018,.04,green);box(board,-1.705,4.07,-.75,.016,.018,.04,gold);
  const dp=rounded(board,-1.645,4.995,-.72,.032,.15,.31,black,.012);box(board,-1.665,4.995,-.72,.02,.043,.2,silver);
  for(let i=0;i<15;i++)box(board,-.9+(i%5)*.31,1.58+Math.floor(i/5)*.18,-.91,.16,.07,.045,black);
  // Individually legible electronic components for close-up study.
  function integratedCircuit(x,y,w,h,pins,text){
   box(board,x,y,-.91,w,h,.065,black);const contacts=[];
   for(let i=0;i<pins;i++){const t=(i+.5)/pins-.5;contacts.push({p:[x-w/2-.023,y+t*h,-.933],s:[1,1,1]},{p:[x+w/2+.023,y+t*h,-.933],s:[1,1,1]});}
   batch(board,new THREE.BoxGeometry(.052,Math.min(.025,h/pins*.5),.014),silver,contacts);
   if(text)label(board,text,x,y,-.874,w*.82,Math.min(.07,h*.45));
  }
  integratedCircuit(-1.15,3.39,.17,.16,4,'PWM');
  for(let i=0;i<6;i++)integratedCircuit(-.97+i*.19,4.99,.12,.17,3,i===2?'Q':'');
  integratedCircuit(.96,2.5,.145,.205,4,'UEFI');
  integratedCircuit(.52,2.49,.32,.32,8,'SIO');
  integratedCircuit(-1.18,1.96,.2,.2,5,'AUDIO');
  integratedCircuit(-1.17,3.15,.22,.19,5,'LAN');
  box(board,.53,1.95,-.893,.45,.43,.065,black);label(board,'PCH',.53,1.95,-.856,.29,.1);
  rounded(board,.94,2.22,-.92,.21,.1,.045,silver,.025);label(board,'XTAL',.94,2.22,-.892,.16,.04);
  box(board,.02,2.4,-.92,.064,.028,.025,black);box(board,-.017,2.4,-.92,.018,.032,.029,silver);box(board,.057,2.4,-.92,.018,.032,.029,silver);
  const ceramic=M(0xb8a17d,.05,.85);box(board,.15,2.4,-.92,.055,.035,.026,ceramic);for(const dx of [-.032,.032])box(board,.15+dx,2.4,-.92,.014,.037,.03,silver);
  // Discrete passives have separate ceramic or dark bodies, metal ends, and solder pads.
  const resistorBodies=[],capacitorBodies=[],metalEnds=[],solderPads=[];
  function passive(x,y,vertical,isCapacitor){
    const r=vertical?[0,0,Math.PI/2]:[0,0,0];
    (isCapacitor?capacitorBodies:resistorBodies).push({p:[x,y,-.946],r});
    for(const offset of [-.022,.022]){
      const px=x+(vertical?0:offset),py=y+(vertical?offset:0);
      metalEnds.push({p:[px,py,-.946],r});
      solderPads.push({p:[px,py,-.963],r});
    }
  }
  for(let n=0;n<10;n++){
    const x=-.98+n*.112;
    passive(x,4.835,n%2===0,n%3!==0);
    passive(x,5.095,n%2!==0,n%4!==0);
  }
  for(let n=0;n<10;n++){
    const y=3.6+n*.092;
    passive(.252,y,true,n%3!==0);
    passive(.29,y+.03,true,n%3===0);
  }
  for(let n=0;n<7;n++){
    passive(-.7+n*.15,3.07,false,n%2===0);
    passive(-.7+n*.15,3.47,false,n%2!==0);
  }
  batch(board,new THREE.BoxGeometry(.044,.023,.024),black,resistorBodies);
  batch(board,new THREE.BoxGeometry(.044,.023,.024),ceramic,capacitorBodies);
  batch(board,new THREE.BoxGeometry(.012,.028,.027),silver,metalEnds);
  batch(board,new THREE.BoxGeometry(.023,.03,.006),gold,solderPads);
  // Recessed PCIe sockets show the contacts and the gap for the card key.
  const pcieContacts=[];
  for(const y of [2.94,2.06])for(const edge of [-.024,.024])for(let pin=0;pin<45;pin++){
    if(pin===9||pin===10)continue;
    pcieContacts.push({p:[-1.08+pin*.037,y+edge,-.715]});
  }
  batch(board,new THREE.BoxGeometry(.009,.016,.009),gold,pcieContacts);
  label(board,'R16',.02,2.457,-.944,.09,.032);label(board,'C41',.15,2.457,-.944,.09,.032);
  box(board,-.81,3.28,-.88,.13,.29,.12,black);for(let i=0;i<12;i++)box(board,-.733,3.16+i*.021,-.817,.024,.012,.016,gold);
  cyl(board,.38,3.28,-.89,.048,.12,gold,'z');ring(board,.38,3.28,-.823,.033,.006,black);
  box(board,-1.18,5.16,-.87,.4,.16,.17,black);for(let r=0;r<2;r++)for(let i=0;i<4;i++)box(board,-1.31+i*.085,5.12+r*.075,-.778,.045,.042,.015,gold);
  box(board,.92,5.12,-.87,.3,.12,.12,black);for(let i=0;i<4;i++)box(board,.82+i*.065,5.12,-.76,.016,.016,.14,gold);label(board,'CPU_FAN',.92,5.01,-.944,.35,.05);
  label(board,'CR2032',-.6,1.91,-.754,.24,.06);box(board,-.6,2.055,-.729,.15,.045,.015,steel);
  register('Материнская плата','Основа системы: соединяет процессор, память, накопители и периферию. Видны сокет CPU, четыре слота DIMM с защёлками, PCIe, M.2, задние порты, SATA, питание ATX и батарейка часов. Конкретная разводка зависит от модели платы.',board,[-2.6,.12,-.05],[-1.3,5.25,-.9]);
  const cpu=group();box(cpu,-.4,4.03,-.74,.73,.76,.055,pcb);box(cpu,-.4,4.03,-.68,.63,.65,.07,silver);label(cpu,'CPU',-.4,4.05,-.638,.48,.15);label(cpu,'6 CORE',-.4,3.87,-.638,.43,.09);register('Процессор','CPU выполняет инструкции программы. Он обменивается данными с оперативной памятью через контроллер памяти. Металлическая крышка передаёт тепло кулеру; процессор не является долговременным хранилищем файлов.',cpu,[-1.15,.7,1.5],[-.4,4.44,-.62]);
  const cooling=group();box(cooling,-.4,4.03,-.57,.64,.65,.12,copper);
  for(let i=0;i<20;i++)box(cooling,-.4,3.52+i*.052,-.13,1.1,.018,.75,silver);
  for(const x of [-.7,-.5,-.3,-.1])tube(cooling,[[x,3.49,-.5],[x,3.38,-.08],[x,3.56,.18],[x,4.5,.18]],.035,copper);
  fan(cooling,-.4,4.03,.32,1.08,'z',steel);
  // Spring screws, nickel heat-pipe ends and bent wire fan clips.
  for(const x of [-.87,.07])for(const y of [3.56,4.5]){cyl(cooling,x,y,-.2,.052,.22,steel,'z');screw(cooling,x,y,-.065);}
  for(const x of [-.7,-.5,-.3,-.1])cyl(cooling,x,4.54,.18,.04,.085,copper);
  for(const x of [-.96,.16])tube(cooling,[[x,3.62,.02],[x,3.56,.36],[x,3.72,.42],[x,4.37,.42],[x,4.5,.34],[x,4.42,.02]],.009,silver);
  register('Кулер процессора','Основание кулера получает тепло от CPU. Тепловые трубки и алюминиевые рёбра распределяют его, а вентилятор помогает отвести тепло в воздух. Вращение вентилятора само по себе не доказывает исправность охлаждения.',cooling,[0,1.15,2.25],[-.4,4.6,.35]);
  const ram=group();
  for(const x of [.61,1.03]){
   // Separate board sections leave a physical key notch at the contact edge.
   box(ram,x,3.65,-.55,.065,.76,.46,pcb);box(ram,x,4.43,-.55,.065,.68,.46,pcb);box(ram,x,4.06,-.5,.065,.06,.36,pcb);
   const chips=[];for(const side of [-1,1])for(let j=0;j<8;j++)chips.push({p:[x+side*.046,3.4+j*.18,-.49]});batch(ram,new THREE.BoxGeometry(.03,.135,.245),black,chips);
   const fingers=[];for(let j=0;j<34;j++){const y=3.3+j*.044;if(y>4.015&&y<4.12)continue;fingers.push({p:[x,y,-.783]});}batch(ram,new THREE.BoxGeometry(.071,.028,.064),gold,fingers);
   box(ram,x,4.02,-.29,.09,1.54,.07,steel);for(const y of [3.3,4.73])box(ram,x,y,-.47,.084,.045,.13,black);
   const sticker=label(ram,'DDR4',x+.067,4.46,-.49,.31,.085);sticker.rotation.y=Math.PI/2;
   const spd=[];for(let j=0;j<8;j++)spd.push({p:[x+.065,3.53+j*.11,-.668]});batch(ram,new THREE.BoxGeometry(.015,.035,.034),silver,spd);
  }
  register('Оперативная память','RAM хранит данные и инструкции, с которыми система работает сейчас. При отключении питания её содержимое обычно теряется. Модули установлены в два выбранных слота; рекомендуемые слоты и тип памяти проверяют по руководству конкретной платы.',ram,[1.25,.6,1.5],[1.04,4.85,-.3]);
  const gpu=group();box(gpu,-.2,2.92,-.1,2.36,.05,1.3,pcb);box(gpu,-.2,2.72,-.05,2.4,.34,1.25,black);box(gpu,-.2,2.95,-.1,2.4,.025,1.28,steel);for(let i=0;i<22;i++)box(gpu,-1.28+i*.1,2.74,-.05,.026,.24,1.15,silver);fan(gpu,-.8,2.51,-.05,1.0,'y',steel);fan(gpu,.4,2.51,-.05,1.0,'y',steel);box(gpu,-1.5,2.8,-.05,.07,.61,1.42,silver);for(let i=0;i<3;i++)box(gpu,-1.55,2.8,-.45+i*.35,.04,.12,.23,black);label(gpu,'GRAPHICS  /  PCIe',-.15,2.75,.598,1.65,.12);box(gpu,.99,2.85,.1,.23,.18,.3,black);
  // Vented backplate, angled shroud rails and PCIe fingers.
  const gpuVents=[];for(let i=0;i<10;i++)for(let z=0;z<3;z++)gpuVents.push({p:[-.95+i*.16,2.97,-.4+z*.25]});batch(gpu,new THREE.BoxGeometry(.075,.012,.14),black,gpuVents);
  for(const z of [-.7,.6]){const rail=box(gpu,-.2,2.54,z,2.39,.1,.055,steel);rail.rotation.z=.015;}
  for(const x of [-1.2,-.72,.23,.85])screw(gpu,x,2.985,.37,'y');
  const gpuFingers=[];for(let i=0;i<36;i++)if(i!==12&&i!==13)gpuFingers.push({p:[-1.15+i*.049,2.918,-.765]});batch(gpu,new THREE.BoxGeometry(.031,.061,.073),gold,gpuFingers);
  const gpuPower=[];for(let r=0;r<2;r++)for(let i=0;i<4;i++)gpuPower.push({p:[1.112,2.8+r*.067,-.012+i*.075]});batch(gpu,new THREE.BoxGeometry(.012,.041,.047),dark,gpuPower);
  register('Видеокарта','GPU выполняет графические и другие параллельные вычисления. В этой сборке дискретная карта вставлена в PCIe x16 и выводит изображение через собственные видеопорты. Наличие встроенной графики зависит от CPU и платформы.',gpu,[.1,-.3,2.2],[.5,2.98,.62]);
  const ssd=group();box(ssd,-.22,3.28,-.8,1.07,.28,.035,pcb);for(let i=0;i<2;i++)box(ssd,-.3+i*.31,3.28,-.76,.25,.21,.045,black);box(ssd,-.62,3.28,-.76,.17,.18,.035,steel);for(let i=0;i<10;i++)if(i!==6)box(ssd,-.81,3.17+i*.022,-.79,.09,.012,.04,gold);label(ssd,'NVMe',-.1,3.29,-.725,.51,.12);screw(ssd,.38,3.28,-.74);ring(ssd,.38,3.28,-.775,.048,.008,gold);
  const ssdPassives=[];for(let i=0;i<12;i++)ssdPassives.push({p:[-.7+(i%6)*.048,3.17+Math.floor(i/6)*.23,-.763]});batch(ssd,new THREE.BoxGeometry(.025,.018,.025),silver,ssdPassives);label(ssd,'CTRL',-.62,3.28,-.738,.15,.05);
  register('SSD M.2','SSD хранит операционную систему, программы и файлы без постоянного питания. В модели показан M.2 NVMe-накопитель. M.2 описывает форм-фактор и разъём; поддерживаемый протокол и ключ нужно сверять с платой.',ssd,[.55,-.4,1.85],[.3,3.43,-.71]);
  const psu=group();box(psu,-.45,.71,-.04,1.99,1.0,2.26,black);for(let i=0;i<12;i++)box(psu,-1.455,.35+i*.063,-.05,.016,.025,1.9,steel);box(psu,-1.48,.8,-.75,.045,.35,.27,dark);box(psu,-1.51,.83,-.22,.035,.2,.13,white);label(psu,'PSU  /  650 W',-.48,.71,1.104,1.62,.22);for(const z of [-.8,.8])screw(psu,-1.48,.35,z,'x');
  // Exterior fan grille stays closed: no internal PSU circuitry is modelled.
  cyl(psu,-.45,1.223,-.05,.75,.012,dark);for(const r of [.14,.25,.36,.47,.58,.69])ring(psu,-.45,1.24,-.05,r,.009,silver,'y');for(let i=0;i<4;i++){const a=i*Math.PI/2+.3,o=box(psu,-.45,1.25,-.05,1.43,.013,.018,steel);o.rotation.y=a;}
  for(const x of [-1.13,.23])for(const z of [-.73,.63])screw(psu,x,1.25,z,'y');
  const psuPins=[];for(let row=0;row<2;row++)for(let i=0;i<12;i++)psuPins.push({p:[-1.14+i*.12,.42+row*.09,1.115]});batch(psu,new THREE.BoxGeometry(.068,.055,.014),dark,psuPins);label(psu,'MODULAR DC',-.48,.99,1.115,1.2,.1);
  box(psu,-1.534,.83,-.22,.012,.11,.04,black);box(psu,-1.53,.89,-.22,.013,.012,.055,silver);
  register('Блок питания','Блок питания преобразует сетевое питание в напряжения, необходимые компонентам. Номинальная мощность сама по себе не определяет качество или совместимость. В тренажёре блок показан закрытым: внутреннее устройство не обслуживается.',psu,[-1.15,-.1,.7],[-.5,1.24,1.13]);
  const power=group();for(let i=0;i<8;i++)tube(power,[[.4+i*.033,1.32,-.7],[1.31,1.65,-.68+i*.033],[1.37,2.4,-.65+i*.033],[1.28,2.83+i*.052,-.55]],.016,i%4===0?steel:black);for(let i=0;i<4;i++)tube(power,[[-1.25+i*.04,1.32,-1.13],[-1.36+i*.02,3.2,-1.12],[-1.26+i*.02,4.9,-.95],[-.98+i*.055,5.09,-.8]],.019,black);for(let i=0;i<4;i++)tube(power,[[.85+i*.045,1.3,-.2],[1.24,1.8,.23+i*.04],[1.23,2.35,.39+i*.04],[.99,2.82+i*.026,.2]],.02,i===0?steel:black);
  for(const y of [1.82,2.37]){box(power,1.37,y,-.535,.095,.07,.36,plastic);box(power,1.27,y,.44,.13,.07,.23,plastic);}
  box(power,1.282,3.04,-.57,.18,.8,.15,black);box(power,1.39,3.04,-.57,.04,.21,.14,steel);label(power,'ATX',1.292,3.04,-.486,.12,.35).rotation.z=Math.PI/2;
  rounded(power,-.89,5.09,-.735,.27,.18,.11,black,.02);rounded(power,1.0,2.86,.24,.23,.19,.14,black,.02);
  for(const [x,y,z]of[[1.38,1.53,-.85],[1.38,3.55,-.86],[-1.3,2.4,-1.1]]){box(power,x,y,z,.075,.09,.34,steel);screw(power,x,y,z+.18);}
  register('Кабели питания','Разные кабели питают плату, CPU и видеокарту. Разъёмы ATX, EPS и PCIe имеют разное назначение: внешне похожие кабели нельзя считать взаимозаменяемыми. Виртуальная практика здесь не заменяет руководство конкретного оборудования.',power,[.8,0,-.4],[1.3,3.05,-.45]);
  // Router: tapered appearance via stacked surfaces, vents, port recesses and antennas.
  const router=group();box(router,-4.12,.23,.13,2.15,.31,1.26,white);box(router,-4.12,.42,.13,2.06,.08,1.18,plastic);for(let i=0;i<18;i++)box(router,-5.02+i*.105,.468,.13,.026,.012,.84,steel);for(const x of [-4.93,-3.3]){cyl(router,x,.75,-.36,.048,.8,plastic);const ant=cyl(router,x,1.32,-.39,.057,.65,plastic);ant.rotation.z=x<-4?.12:-.12;}
  for(let i=0;i<5;i++){box(router,-4.81+i*.34,.22,.785,.28,.19,.055,i?gold:blue);box(router,-4.81+i*.34,.23,.82,.2,.11,.024,black);}
  const lanPins=[];for(let port=0;port<5;port++)for(let pin=0;pin<8;pin++)lanPins.push({p:[-4.89+port*.34+pin*.023,.198,.838]});batch(router,new THREE.BoxGeometry(.012,.035,.012),gold,lanPins);
  for(let port=0;port<5;port++)label(router,port?'LAN '+port:'WAN',-4.81+port*.34,.11,.82,.27,.055);
  for(const x of [-4.93,-3.3]){cyl(router,x,.55,-.36,.1,.14,steel);ring(router,x,.63,-.36,.07,.012,black,'y');}
  for(const x of [-4.88,-3.36])for(const z of [-.25,.5])cyl(router,x,.055,z,.09,.06,plastic);
  const ledMat=new THREE.MeshStandardMaterial({color:0x72e7b0,emissive:0x32ab70,emissiveIntensity:.8});
  for(let i=0;i<4;i++)cyl(router,-4.6+i*.3,.37,.78,.025,.018,ledMat,'z',10);
  label(router,'ROUTER',-4.12,.22,.824,.82,.13);
  router.position.x=1.1;
  register('Роутер','Роутер соединяет разные сети; его LAN-порты обычно объединены встроенным коммутатором. В учебной сети он выдаёт адрес по DHCP и служит шлюзом. Успешное подключение к роутеру ещё не гарантирует доступ к интернету.',router,[-.7,.1,.1],[-4.1,1.7,-.4]);
  const network=group();
  const connected=tube(network,[[-1.75,3.96,-.83],[-2.1,3.8,-.55],[-2.0,.2,1.25],[-2.75,.12,1.65],[-3.37,.22,.88]],.035,blue);
  const disconnected=tube(network,[[-2.35,.17,1.1],[-2.4,.12,1.35],[-2.75,.12,1.65],[-3.37,.22,.88]],.035,blue);disconnected.visible=false;
  const plug=box(network,-1.8,3.96,-.83,.26,.15,.18,new THREE.MeshPhysicalMaterial({color:0xaacbd4,transparent:true,opacity:.6,roughness:.2}));
  const plugContacts=[];for(let i=0;i<8;i++)plugContacts.push({p:[.035,.081,-.063+i*.018]});batch(plug,new THREE.BoxGeometry(.11,.008,.01),gold,plugContacts);box(plug,-.04,.116,0,.16,.018,.055,white);box(plug,-.14,0,0,.08,.16,.18,blue);
  register('Сетевой кабель','Витая пара с разъёмами 8P8C соединяет сетевой порт компьютера с LAN-портом роутера. В учебной задаче сначала проверяют физическое соединение, затем адресацию. Кабель и порты не являются гарантией доступа к внешней сети.',network,[0,0,.25],[-2.0,2.3,.9]);
  const originalBases=Object.fromEntries(Object.entries(registry).map(([k,g])=>[k,g.position.clone()]));
  const state={power:false,panelOpen:false,ramInstalled:true,ssdInstalled:true,gpuInstalled:true,cableConnected:true};
  // Detached assemblies can be moved with the pointer. The parent validates a
  // drop before setState commits installation; the model never installs itself.
  const componentNames={RAM:'Оперативная память',SSD:'SSD M.2',GPU:'Видеокарта'};
  const componentKeys={RAM:'ramInstalled',SSD:'ssdInstalled',GPU:'gpuInstalled'};
  const grabAnchors={RAM:new THREE.Vector3(.61,4.05,-.29),SSD:new THREE.Vector3(-.22,3.28,-.725),GPU:new THREE.Vector3(-.2,2.97,-.1)};
  const slotAnchors={DIMM:new THREE.Vector3(.8,4.05,-.7),'M.2':new THREE.Vector3(-.22,3.28,-.8),PCIe:new THREE.Vector3(-.25,2.94,-.83)};
  const componentCenters=Object.fromEntries(Object.entries(componentNames).map(([key,name])=>{const g=registry[name],center=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());return[key,g.worldToLocal(center)];}));
  const detachedBases={RAM:new THREE.Vector3(1.75,-.35,1.9),SSD:new THREE.Vector3(2.7,-2.45,2.35),GPU:new THREE.Vector3(2.8,-1.2,1.6)};
  let dragCamera=null,dragCanvas=document.querySelector('#stage canvas'),dragConfig={enabled:false,parts:['RAM','SSD','GPU'],showTargets:true},drag=null,dragListenersOn=false,trayNeedsLayout=true;
  const dragRaycaster=new THREE.Raycaster(),dragPointer=new THREE.Vector2();
  const dragSlotLayer=group();objectRoot.add(dragSlotLayer);dragSlotLayer.visible=false;
  const slotSizes={DIMM:[.62,1.78,.14],'M.2':[1.17,.36,.12],PCIe:[2.03,.2,.15]};
  const slotMarkers=Object.fromEntries(Object.entries(slotAnchors).map(([key,anchor])=>{
   const marker=new THREE.Mesh(new THREE.BoxGeometry(...slotSizes[key]),new THREE.MeshBasicMaterial({color:0xe8b775,wireframe:true,transparent:true,opacity:.8,depthTest:false}));marker.renderOrder=42;marker.raycast=()=>{};marker.position.copy(anchor);dragSlotLayer.add(marker);return[key,marker];
  }));
  // Tutorial overlays are schematic functional links, not electrical traces.
  let tutorialIndex=-1;
  const tutorialLayer=group();objectRoot.add(tutorialLayer);
  const tutorialTargets=['Блок питания','Корпус','Кабели питания','Процессор','Оперативная память','Видеокарта','SSD M.2','Оперативная память','Роутер','Кулер процессора'];
  const tutorialPaths=[
   [[-.45,.9,.8],[.7,1.45,.65],[1.22,2.45,-.5],[1.22,3.0,-.55]],
   [[1.1,5.74,.9],[.8,5.15,.8],[1.2,2.0,-.45],[.3,1.2,.5],[-.45,.9,.8]],
   [[-.45,.9,.8],[.3,1.35,.6],[1.22,3.0,-.55],[.2,4.8,-.5],[-.4,4.03,-.6]],
   [[.5,1.95,-.62],[-.7,2.5,-.5],[-.4,4.03,-.57]],
   [[-.4,4.03,-.55],[.1,4.55,-.15],[.83,4.04,-.2]],
   [[-.4,4.03,-.55],[-.8,3.48,.25],[-.2,2.94,.5],[.8,2.94,.7]],
   [[-.22,3.28,-.72],[.4,3.54,-.1],[.83,4.04,-.2]],
   [[.83,4.04,-.2],[.1,4.55,-.15],[-.4,4.03,-.55],[.4,3.6,-.1],[.83,4.04,-.2]],
   [[-1.8,3.96,-.83],[-2.1,3,.2],[-2.1,.25,1.3],[-3.37,.22,.88]],
   [[-.4,4.03,-.56],[-.4,4.03,0],[-.4,4.7,.4],[.1,5.15,.6],[1.1,5.6,.4]]
  ];
  const tutorialRoutes=tutorialPaths.map((points,index)=>{
   const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
   const color=index<3?0xffc376:index===9?0xe99c75:0x8cdded;
   const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45,depthTest:false});
   const line=new THREE.Mesh(new THREE.TubeGeometry(curve,60,.018,6,false),material);line.renderOrder=35;
   const markers=Array.from({length:3},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color,depthTest:false}));m.renderOrder=36;return m;});
   const route=group();route.add(line,...markers);route.visible=false;tutorialLayer.add(route);return{curve,route,markers};
  });
  const powerLampMaterial=new THREE.MeshBasicMaterial({color:0x314644});
  const powerLamp=cyl(chassis,1.1,5.773,.9,.045,.008,powerLampMaterial);
  const standbyLampMaterial=new THREE.MeshBasicMaterial({color:0x273e3c});
  cyl(board,1.13,1.48,-.78,.025,.025,standbyLampMaterial,'z',10);
  const psuCover=chassis.children.find(n=>n.isMesh&&Math.abs(n.position.y-.75)<.01&&Math.abs(n.position.z-1.31)<.01);
  const coolingBase=cooling.position.clone();
  let lastMetrics={calls:0,triangles:0};
  scene.onAfterRender=(renderer,renderScene,camera)=>{lastMetrics={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};dragCamera=camera;if(trayNeedsLayout)layoutDetachedTrays();};
  let helper=null,focusGroup=null;
  function focus(name){if(helper){scene.remove(helper);helper.geometry.dispose();helper.material.dispose();helper=null;}const g=registry[name];if(!g)return false;focusGroup=g;helper=new THREE.BoxHelper(g,0xf4bf73);helper.material.depthTest=false;helper.renderOrder=20;scene.add(helper);document.getElementById('partName').textContent=name;document.getElementById('partInfo').textContent=g.userData.model.info;return true;}
  function setGroupBase(g,base){const d=g.userData.model;if(!d)return;const explodedOffset=g.position.clone().sub(d.base);d.base.copy(base);g.position.copy(base).add(explodedOffset);}
  function applyHardwarePoses(){
   for(const [key,name]of Object.entries(componentNames))setGroupBase(registry[name],state[componentKeys[key]]?originalBases[name]:detachedBases[key]);
   const panelBase=originalBases['Боковая панель'].clone();if(state.panelOpen)panelBase.add(new THREE.Vector3(1.9,.2,1.8));setGroupBase(registry['Боковая панель'],panelBase);
  }
  function layoutDetachedTrays(force=false){
   if(!dragCamera||!dragCanvas||drag||(!force&&!trayNeedsLayout))return;
   const rect=dragCanvas.getBoundingClientRect();if(rect.width<20||rect.height<20)return;
   scene.updateMatrixWorld(true);const center=new THREE.Box3().setFromObject(chassis).getCenter(new THREE.Vector3());
   const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(dragCamera.getWorldDirection(new THREE.Vector3()),center);
   for(const [key,xy]of Object.entries({RAM:[.79,.27],GPU:[.80,.58],SSD:[.79,.83]})){
    dragRaycaster.setFromCamera(new THREE.Vector2(xy[0]*2-1,1-xy[1]*2),dragCamera);const p=new THREE.Vector3();
    if(dragRaycaster.ray.intersectPlane(plane,p))detachedBases[key].copy(objectRoot.worldToLocal(p)).sub(componentCenters[key]);
   }
   trayNeedsLayout=false;applyHardwarePoses();
  }
  function setState(next){
   if(drag)cancelDrag();Object.assign(state,next);if(typeof state.gpuInstalled!=='boolean')state.gpuInstalled=true;
   applyHardwarePoses();if(Object.keys(componentNames).some(k=>!state[componentKeys[k]]))layoutDetachedTrays();
   connected.visible=state.cableConnected;disconnected.visible=!state.cableConnected;plug.position.set(...(state.cableConnected?[-1.8,3.96,-.83]:[-2.35,.17,1.1]));return {...state};
  }
  function visibleMesh(node,root){if(!node.isMesh)return false;for(let p=node;p;p=p.parent){if(!p.visible)return false;if(p===root)return true;}return false;}
  function projectPoint(point){
   if(!dragCamera||!dragCanvas)return null;const rect=dragCanvas.getBoundingClientRect(),p=point.clone().project(dragCamera);
   const canvasX=(p.x+1)*rect.width/2,canvasY=(1-p.y)*rect.height/2;
   return{x:rect.left+canvasX,y:rect.top+canvasY,canvasX,canvasY,visible:p.z>=-1&&p.z<=1&&canvasX>=0&&canvasX<=rect.width&&canvasY>=0&&canvasY<=rect.height};
  }
  function slotWorldPoint(key){return board.localToWorld(slotAnchors[key].clone());}
  function updateSlotMarkers(){scene.updateMatrixWorld(true);for(const [key,marker]of Object.entries(slotMarkers))marker.position.copy(objectRoot.worldToLocal(slotWorldPoint(key)));}
  function getDragTargets(){
   if(!dragCamera||!dragCanvas)return{ready:false,space:'iframe-client',sources:{},targets:{}};
   scene.updateMatrixWorld(true);const rect=dragCanvas.getBoundingClientRect(),sources={},targets={};
   for(const [key,name]of Object.entries(componentNames)){const p=projectPoint(registry[name].localToWorld(grabAnchors[key].clone()));sources[key]={...p,installed:state[componentKeys[key]],draggable:dragConfig.enabled&&dragConfig.parts.includes(key)&&!state[componentKeys[key]]};}
   for(const key of Object.keys(slotAnchors))targets[key]=projectPoint(slotWorldPoint(key));
   return{ready:true,space:'iframe-client',canvas:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},sources,targets};
  }
  function nearestSlot(x,y){
   const data=getDragTargets();if(!data.ready)return null;const radius=Math.max(24,Math.min(48,data.canvas.width*.04));
   const candidates=Object.entries(data.targets).map(([key,p])=>({key,p,d:Math.hypot(x-p.x,y-p.y)})).filter(c=>c.p.visible&&c.d<radius).sort((a,b)=>a.d-b.d);
   return candidates[0]?.key||null;
  }
  function pointerRay(event){const r=dragCanvas.getBoundingClientRect();dragPointer.set((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);dragRaycaster.setFromCamera(dragPointer,dragCamera);}
  function stopPointer(event){event.preventDefault();event.stopImmediatePropagation();}
  function resetSlotColors(){for(const marker of Object.values(slotMarkers))marker.material.color.setHex(0xe8b775);}
  function cancelDrag(){
   if(!drag)return;const old=drag;drag=null;setGroupBase(old.group,old.base);if(dragCanvas){dragCanvas.style.cursor=old.cursor;try{if(dragCanvas.hasPointerCapture(old.pointerId))dragCanvas.releasePointerCapture(old.pointerId);}catch{}}
   resetSlotColors();
  }
  function onDragDown(event){
   if(!dragConfig.enabled||!dragCamera||event.button!==0||drag)return;
   scene.updateMatrixWorld(true);pointerRay(event);const meshes=[],owners=new Map();
   for(const key of dragConfig.parts){if(!componentNames[key]||state[componentKeys[key]])continue;const g=registry[componentNames[key]];g.traverse(n=>{if(visibleMesh(n,g)){meshes.push(n);owners.set(n,key);}});}
   const hit=dragRaycaster.intersectObjects(meshes,false)[0];if(!hit)return;const component=owners.get(hit.object),g=registry[componentNames[component]];
   stopPointer(event);const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(dragCamera.getWorldDirection(new THREE.Vector3()),hit.point);
   drag={component,group:g,base:g.userData.model.base.clone(),plane,startLocal:objectRoot.worldToLocal(hit.point.clone()),x:event.clientX,y:event.clientY,pointerId:event.pointerId,moved:false,cursor:dragCanvas.style.cursor};
   dragCanvas.style.cursor='grabbing';try{dragCanvas.setPointerCapture(event.pointerId);}catch{}focus(componentNames[component]);
   window.parent.postMessage({type:'itlab-drag-start',component},'*');
  }
  function onDragMove(event){
   if(!drag||event.pointerId!==drag.pointerId)return;stopPointer(event);if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5)drag.moved=true;
   if(!drag.moved)return;pointerRay(event);const point=new THREE.Vector3();if(dragRaycaster.ray.intersectPlane(drag.plane,point)){const delta=objectRoot.worldToLocal(point).sub(drag.startLocal);setGroupBase(drag.group,drag.base.clone().add(delta));}
   const nearest=nearestSlot(event.clientX,event.clientY);for(const [key,marker]of Object.entries(slotMarkers))marker.material.color.setHex(key===nearest?0x9de6ee:0xe8b775);
  }
  function onDragUp(event){
   if(!drag||event.pointerId!==drag.pointerId)return;stopPointer(event);const old=drag,target=old.moved?nearestSlot(event.clientX,event.clientY):null;cancelDrag();
   if(old.moved)window.parent.postMessage({type:'itlab-drop',component:old.component,target},'*');
  }
  function onDragCancel(event){if(drag&&event.pointerId===drag.pointerId){stopPointer(event);cancelDrag();}}
  function configureDrag(config={}){
   const allowed=Array.isArray(config.parts)?config.parts.filter(k=>Object.hasOwn(componentNames,k)):['RAM','SSD','GPU'];
   dragConfig={enabled:config.enabled===true,parts:allowed,showTargets:config.showTargets!==false};
   if(!dragCanvas)dragCanvas=document.querySelector('#stage canvas');if(!dragCanvas)return{...dragConfig};
   if(!dragConfig.enabled)cancelDrag();
   if(dragConfig.enabled&&!dragListenersOn){for(const [name,fn]of[['pointerdown',onDragDown],['pointermove',onDragMove],['pointerup',onDragUp],['pointercancel',onDragCancel]])dragCanvas.addEventListener(name,fn,{capture:true});dragListenersOn=true;}
   if(!dragConfig.enabled&&dragListenersOn){for(const [name,fn]of[['pointerdown',onDragDown],['pointermove',onDragMove],['pointerup',onDragUp],['pointercancel',onDragCancel]])dragCanvas.removeEventListener(name,fn,{capture:true});dragListenersOn=false;}
   dragSlotLayer.visible=dragConfig.enabled&&dragConfig.showTargets;updateSlotMarkers();if(dragConfig.enabled){trayNeedsLayout=true;layoutDetachedTrays(true);}return{...dragConfig};
  }
  function setTutorial(index){
   tutorialIndex=Number.isInteger(index)&&index>=0&&index<10?index:-1;
   tutorialRoutes.forEach((r,i)=>r.route.visible=i===tutorialIndex);
   if(psuCover)psuCover.visible=!(tutorialIndex>=0&&tutorialIndex<=2);
   if(cooling.userData.model){cooling.userData.model.base.copy(coolingBase);if(tutorialIndex===3)cooling.userData.model.base.add(new THREE.Vector3(-.55,.65,1.65));}
   if(tutorialIndex>=0){state.power=tutorialIndex>=2;focus(tutorialTargets[tutorialIndex]);}
   return{index:tutorialIndex,power:state.power};
  }
  const createBoardRouteOverlay=__BOARD_ROUTE_OVERLAY__;
  const microInspector=(__MICRO_INSPECTOR__)({THREE,board,microParts,objectRoot,createBoardRouteOverlay});
  let microEnabled=true,microDown=null;
  const microHitMaterial=new THREE.MeshBasicMaterial({visible:false});
  const microHitMeshes=microParts.filter(p=>p.id!=='pcb').flatMap(p=>[p.center,...(p.instances||[])].map(center=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...p.size),microHitMaterial);mesh.position.set(...center);mesh.userData.microPick=p.id;board.add(mesh);return mesh;}));
  const microRay=new THREE.Raycaster(),microPointer=new THREE.Vector2();
  dragCanvas.addEventListener('pointerdown',e=>{microDown={x:e.clientX,y:e.clientY};});
  dragCanvas.addEventListener('pointerup',e=>{if(!microDown)return;const d=Math.hypot(e.clientX-microDown.x,e.clientY-microDown.y);microDown=null;if(!microEnabled||d>5||!dragCamera)return;const rect=dragCanvas.getBoundingClientRect();microPointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);microRay.setFromCamera(microPointer,dragCamera);scene.updateMatrixWorld(true);const hit=microRay.intersectObjects(microHitMeshes,false)[0];if(!hit)return;const actual=[];for(const g of Object.values(registry))g.traverse(n=>{if(n.isMesh&&!n.userData.microPick&&visibleMesh(n,g))actual.push(n);});const surface=microRay.intersectObjects(actual,false)[0];if(surface&&Math.abs(surface.distance-hit.distance)<.16)window.parent.postMessage({type:'itlab-micro-selection',id:hit.object.userData.microPick},'*');});
  window.ITLAB_MODEL={focus,setState,setTutorial,configureDrag,getDragTargets,microInspector,setMicroEnabled:value=>microEnabled=value===true,getMicroParts:()=>microParts.map(p=>({...p})),getState:()=>({...state}),names:Object.keys(registry),getTutorialState:()=>({index:tutorialIndex,activeRoutes:tutorialRoutes.filter(r=>r.route.visible).length,power:state.power,fanAngle:spins[0].rotation.z,marker:tutorialIndex>=0?tutorialRoutes[tutorialIndex].markers[0].position.toArray():null}),getMetrics:()=>({...lastMetrics})};
  // Reuse the viewer's OrbitControls for closer framing of this compact assembly.
  // Geometry, controls and free rotation stay in the standard interaction shell.
  document.getElementById('explode').addEventListener('click',()=>setTimeout(()=>{
   const opening=document.getElementById('explode').getAttribute('aria-pressed')==='true';
   const canvas=document.querySelector('#stage canvas');if(!canvas)return;
   for(let i=0;i<13;i++)canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:opening?-100:100,bubbles:true,cancelable:true}));
  },0));
  let last=0;function animate(t){requestAnimationFrame(animate);const dt=Math.min((t-last)/1000,.05);last=t;if(state.power)for(const f of spins)f.rotation.z+=dt*3;if(helper&&focusGroup)helper.update();
   powerLampMaterial.color.setHex(state.power?0x8fffc2:0x314644);standbyLampMaterial.color.setHex(tutorialIndex>=0||state.power?0x8fffc2:0x273e3c);
   if(dragSlotLayer.visible)updateSlotMarkers();
   if(tutorialIndex>=0){const route=tutorialRoutes[tutorialIndex];route.markers.forEach((m,i)=>m.position.copy(route.curve.getPointAt((t*.00024+i/3)%1)));}
  }requestAnimationFrame(animate);
  // Selection text is owned by the standard viewer. Publish only the selected part name.
  for(const id of ['works','reset'])document.getElementById(id).addEventListener('click',()=>focus(null));
  const observer=new MutationObserver(()=>{const name=window.ITLAB_I18N?.canonical(document.getElementById('partName').textContent)||document.getElementById('partName').textContent;if(registry[name]){if(focusGroup&&focusGroup!==registry[name])focus(null);window.parent.postMessage({type:'itlab-selection',name},'*');}});observer.observe(document.getElementById('partName'),{childList:true,subtree:true});
  setTimeout(()=>window.parent.postMessage({type:'itlab-ready',parts:Object.keys(registry)},'*'),0);
 },
 stages:[
  {part:'Блок питания',text:'1. Питание. Закрытый блок питания подаёт энергию компонентам через соответствующие кабели. Движущаяся линия — условная связь, а не схема напряжений.',path:[[-.4,.9,.1],[1.25,1.6,-.4],[1.25,3.02,-.5]]},
  {part:'Процессор',text:'2. Выполнение. CPU выполняет инструкции. Эта учебная линия связывает CPU с RAM и не воспроизводит физическую разводку платы.',path:[[-.4,4.05,-.6],[.2,4.55,-.45],[.84,4.05,-.4]]},
  {part:'Оперативная память',text:'3. Рабочие данные. RAM удерживает текущие данные программы. CPU читает их и записывает результаты. Обмен двусторонний; движущаяся линия условно показывает один этап.',path:[[.84,4.05,-.4],[.3,3.65,-.5],[-.4,4.05,-.6]]},
  {part:'SSD M.2',text:'4. Файлы и загрузка. Программы и файлы сохраняются на SSD. При запуске нужные данные загружаются в оперативную память. Путь показан упрощённо, без моделирования контроллеров и шин.',path:[[-.2,3.28,-.7],[.35,3.5,-.45],[.84,4.05,-.4]]},
  {part:'Видеокарта',text:'5. Изображение. В этой сборке дискретная видеокарта обрабатывает графику и выводит изображение на подключённый к ней дисплей. Линия — упрощённая связь CPU и GPU.',path:[[-.4,4.05,-.6],[-.7,3.4,.25],[-.2,2.94,.4]]},
  {part:'Кулер процессора',text:'6. Тепло. От CPU тепло переходит через основание к трубкам и рёбрам кулера, затем в окружающий воздух. Линия обозначает перенос тепла; это не измерение температуры.',path:[[-.4,4.03,-.6],[-.4,4.03,0],[-.4,4.8,.3]]},
  {part:'Роутер',text:'7. Сеть. Компьютер обменивается кадрами с LAN-портом роутера через Ethernet. Реальный обмен двусторонний, а путь линии здесь только иллюстративный.',path:[[-1.8,3.96,-.83],[-2.1,.4,1.25],[-3.37,.22,.88]]}
 ]
}
