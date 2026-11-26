(context,redraw)=>{
 const tiles=[{id:'notes',title:'Заметки',icon:'≡',x:43,y:152},{id:'usb',title:'Устройства USB',icon:'⌁',x:43,y:270}];
 const close={x:672,y:66,w:48,h:39};
 const devices={keyboard:'Клавиатура',mouse:'Мышь'};
 let usb={},active=false,app='',draft='',cursor=null;
 const contains=(x,y,area)=>x>=area.x&&y>=area.y&&x<area.x+area.w&&y<area.y+area.h;
 const tr=text=>window.ITLAB_I18N?.translate(text)||text;
 function update(state,enabled){
  usb=state.usb||{};
  active=enabled;
  if(!active||!usb.mouse)cursor=null;
 }
 function reset(){
  app='';draft='';cursor=null;
 }
 function fill(x,y,w,h,color){
  context.fillStyle=color;context.fillRect(x,y,w,h);
 }
 function text(value,x,y,size=23,color='#d8eaf0',align='left'){
  context.textAlign=align;context.fillStyle=color;context.font='600 '+size+'px Arial';
  context.fillText(value,x,y);
 }
 function paint(){
  const gradient=context.createLinearGradient(0,0,768,432);
  gradient.addColorStop(0,'#142e48');gradient.addColorStop(1,'#16463f');
  fill(0,0,768,432,gradient);
  text('IT LAB  /  DESKTOP',42,55,23,'#9bcee3');
  text(tr('Система готова'),42,111,37);
  for(const tile of tiles){
   fill(tile.x,tile.y,294,84,'#25495d');
   fill(tile.x+15,tile.y+15,53,54,'#2e6174');
   text(tile.icon,tile.x+42,tile.y+51,31,'#a5e5cb','center');
   text(tr(tile.title),tile.x+83,tile.y+51,24);
  }
  fill(0,385,768,47,'#10232f');
  text(tr('Рабочий стол'),42,415,19,'#a8c5d6');
  text('USB '+[usb.keyboard,usb.mouse].filter(Boolean).length+'/2',725,415,19,'#a5e5cb','right');
  if(app){
   fill(39,57,689,315,'#101e2d');
   fill(39,57,689,53,'#24465a');
   text(tr(tiles.find(tile=>tile.id===app).title),65,91,26);
   fill(close.x,close.y,close.w,close.h,'#38596b');
   text('×',696,95,27,'#e8f5f5','center');
   if(app==='usb'){
    Object.entries(devices).forEach(([id,label],index)=>{
     const y=168+88*index;
     text(tr(label),66,y,25);text(usb[id]?'USB '+usb[id]:tr('Не подключено'),66,y+37,22,usb[id]?'#a1e6bf':'#aec0c9');
    });
   }else{
    fill(64,133,640,208,'#172a3b');
    if(!draft)text(tr(usb.keyboard?'Напечатай текст…':'Подключи USB-клавиатуру'),86,179,23,'#92aebe');
    const width=44;
    const lines=draft.split('\n').flatMap(line=>{
     const letters=Array.from(line);
     return Array.from({length:Math.max(1,Math.ceil(letters.length/width))},(_,i)=>letters.slice(i*width,(i+1)*width).join(''));
    }).slice(-6);
    lines.forEach((line,index)=>{
     context.fillStyle='#e1f1f5';context.font='22px Consolas, monospace';context.textAlign='left';
     context.fillText(line,85,164+index*30,595);
    });
   }
  }
  if(cursor){
   context.beginPath();
   context.moveTo(cursor.x,cursor.y);context.lineTo(cursor.x+2,cursor.y+20);context.lineTo(cursor.x+7,cursor.y+15);context.lineTo(cursor.x+15,cursor.y+15);
   context.closePath();context.fillStyle='#effcf7';context.fill();context.strokeStyle='#10222c';context.lineWidth=2;context.stroke();
  }
 }
 function point(uv){return {x:uv.x*768,y:(1-uv.y)*432};}
 function move(uv){
  const next=active&&usb.mouse&&uv?point(uv):null;
  if(!next&&!cursor||next&&cursor&&Math.hypot(next.x-cursor.x,next.y-cursor.y)<1)return;
  cursor=next;redraw();
 }
 function click(uv){
  if(!active||!usb.mouse)return false;
  cursor=point(uv);
  const {x,y}=cursor;
  if(app){
   if(contains(x,y,close))app='';
  }else{
   const tile=tiles.find(tile=>contains(x,y,{...tile,w:294,h:84}));
   if(tile)app=tile.id;
  }
  redraw();
  return true;
 }
 function key(value){
  if(!active||!usb.keyboard)return false;
  if(value==='Escape'&&app){app='';redraw();return true;}
  if(value==='Enter'&&!app){app='notes';redraw();return true;}
  if(app==='usb')return false;
  const letter=Array.from(value).length===1&&value>=' ';
  if(letter&&!app)app='notes';
  if(app!=='notes')return false;
  if(value==='Backspace')draft=Array.from(draft).slice(0,-1).join('');
  else if(value==='Enter')draft=(draft+'\n').slice(0,264);
  else if(letter)draft=(draft+value).slice(0,264);
  else return false;
  redraw();
  return true;
 }
 return {update,reset,paint,move,click,key,getState:()=>({app,draft,active})};
}
