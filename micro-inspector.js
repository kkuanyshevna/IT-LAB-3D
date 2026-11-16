(function createMicroInspector({THREE,board,microParts,objectRoot}){
 let view=null,sequence=0;
 const byId=id=>microParts.find(p=>p.id===id);
 const offscreen=(camera,p)=>{const v=p.clone().project(camera);return Math.abs(v.x)>1||Math.abs(v.y)>1||v.z<0||v.z>1;};
 async function open(container,{onSelect=()=>{}}={}){
  close();const ticket=sequence;const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');if(ticket!==sequence)return false;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x101c28);
  scene.add(new THREE.HemisphereLight(0xdceaf5,0x536b5f,2.5));const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(2,4,6);scene.add(key);const fill=new THREE.DirectionalLight(0xaed8ed,1.4);fill.position.set(-4,1,3);scene.add(fill);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const canvas=renderer.domElement;canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab';container.replaceChildren(canvas);
  const doc=container.ownerDocument,tooltip=doc.createElement('div'),callout=doc.createElement('div');tooltip.className='micro-tooltip';tooltip.hidden=true;callout.className='micro-callout';callout.setAttribute('aria-live','polite');container.append(tooltip,callout);
  const camera=new THREE.PerspectiveCamera(37,1,.01,100);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=.16;controls.maxDistance=14;
  const root=new THREE.Group();root.position.set(.05,-3.35,.8);scene.add(root);
  const clone=board.clone(true);clone.position.set(0,0,0);clone.rotation.set(0,0,0);clone.scale.set(1,1,1);const materials=[];
  clone.traverse(n=>{if(n.isMesh){if(Array.isArray(n.material))n.material=n.material.map(m=>{const c=m.clone();materials.push(c);return c;});else{n.material=n.material.clone();materials.push(n.material);}}});root.add(clone);
  const covers=[];clone.traverse(n=>{if(n.userData.inspectionCover)covers.push(n);});
  const hotspotMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const hotspots=microParts.flatMap(p=>[p.center,...(p.instances||[])].map(center=>{const o=new THREE.Mesh(new THREE.BoxGeometry(...p.size),hotspotMaterial);o.position.set(...center);o.userData.microId=p.id;root.add(o);return o;}));
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let helper=null,selection='pcb',coversOff=false,tween=null,down=null,closed=false;
  const paused=objectRoot.visible;objectRoot.visible=false;
  const v={container,renderer,camera,controls,root,hotspots,canvas,onSelect,materials,selection,coversOff,paused,scene,get tween(){return tween;},select:null,overview:null,toggleCovers:null,getTargets:null,close:null};view=v;
  function coversVisible(show){coversOff=!show;v.coversOff=coversOff;for(const c of covers)c.visible=show;}
  function overview(){tween={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:new THREE.Vector3(.35,.35,7.6),target:new THREE.Vector3(0,0,0)};}
  function select(id,{zoom=true,hotspot=null}={}){const data=byId(id);if(!data)return false;selection=id;v.selection=id;if(data.cover)coversVisible(false);if(helper){scene.remove(helper);helper.geometry.dispose();helper.material.dispose();}const box=hotspot||hotspots.find(h=>h.userData.microId===id);helper=new THREE.BoxHelper(box,0xf3be77);helper.material.depthTest=false;helper.renderOrder=10;scene.add(helper);
   if(zoom){const target=box.position.clone().add(root.position);const size=Math.max(data.size[0],data.size[1]);const distance=Math.max(.55,Math.min(7.5,size*2.7));let direction=camera.position.clone().sub(controls.target).normalize();if(direction.z<.25)direction.set(.1,.08,1).normalize();tween={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:target.clone().addScaledVector(direction,distance),target};}
   callout.replaceChildren();const title=doc.createElement('strong'),description=doc.createElement('span');title.textContent=data.name;description.textContent=data.summary;callout.append(title,description);
   onSelect({...data,coversOff});return true;
  }
  function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();camera.position.set(.35,.35,7.6);controls.target.set(0,0,0);controls.update();
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};tween=null;});
  function hitAt(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const eligible=hotspots.filter(h=>coversOff?h.userData.microId!=='vrm-heatsink':!byId(h.userData.microId).cover);return ray.intersectObjects(eligible,false)[0];}
  let lastHover=0;canvas.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<40){tooltip.hidden=true;return;}lastHover=performance.now();const hit=hitAt(e);tooltip.hidden=!hit;if(hit){tooltip.textContent=byId(hit.object.userData.microId).name;const r=canvas.getBoundingClientRect();tooltip.style.left=Math.min(r.width-250,Math.max(10,e.clientX-r.left+14))+'px';tooltip.style.top=Math.max(10,e.clientY-r.top-36)+'px';canvas.style.cursor='pointer';}else canvas.style.cursor='grab';});canvas.addEventListener('pointerleave',()=>tooltip.hidden=true);
  canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){down=null;return;}down=null;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const eligible=hotspots.filter(h=>coversOff?h.userData.microId!=='vrm-heatsink':!byId(h.userData.microId).cover);const hit=ray.intersectObjects(eligible,false)[0];if(hit)select(hit.object.userData.microId,{hotspot:hit.object});});
  v.select=select;v.overview=overview;v.toggleCovers=()=>{coversVisible(coversOff);onSelect({...byId(selection),coversOff});return coversOff;};
  v.getTargets=()=>{scene.updateMatrixWorld(true);const rect=canvas.getBoundingClientRect(),targets={};for(const part of microParts){const point=root.localToWorld(new THREE.Vector3(...part.center)),projected=point.clone().project(camera);targets[part.id]={x:rect.left+(projected.x+1)*rect.width/2,y:rect.top+(1-projected.y)*rect.height/2,visible:!offscreen(camera,point)};}return targets;};
  v.close=()=>{closed=true;observer.disconnect();controls.dispose();if(helper){helper.geometry.dispose();helper.material.dispose();}for(const h of hotspots)h.geometry.dispose();hotspotMaterial.dispose();for(const m of materials)m.dispose();renderer.dispose();canvas.remove();tooltip.remove();callout.remove();objectRoot.visible=paused;};
  function frame(time){if(closed)return;requestAnimationFrame(frame);if(tween){const t=Math.min(1,(time-tween.start)/650),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.fromTarget,tween.target,ease);if(t===1)tween=null;}controls.update();if(helper)helper.update();renderer.render(scene,camera);}requestAnimationFrame(frame);
  select('pcb',{zoom:false});return true;
 }
 function close(){sequence++;if(view){view.close();view=null;}}
 return{open,close,focus:id=>view?.select(id),overview:()=>view?.overview(),toggleCovers:()=>view?.toggleCovers(),getState:()=>view?{open:true,selection:view.selection,coversOff:view.coversOff,moving:!!view.tween}:{open:false},getTargets:()=>view?.getTargets()||{}};
})
