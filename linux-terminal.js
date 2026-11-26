(redraw)=>{
 const guest=__LINUX_GUEST__;
 const lines=[''];
 let worker=null,status='idle',row=0,column=0,offset=0,timeout=0,escape='';
 const keys={Enter:'\r',Backspace:'\x7f',Tab:'\t',ArrowUp:'\x1b[A',ArrowDown:'\x1b[B',ArrowRight:'\x1b[C',ArrowLeft:'\x1b[D',Delete:'\x1b[3~',Home:'\x1b[H',End:'\x1b[F'};
 function stop(){
  worker?.terminate();worker=null;
  clearTimeout(timeout);status='idle';
  lines.splice(0,lines.length,'');row=0;column=0;offset=0;escape='';
 }
 function fail(){
  stop();status='error';redraw();
 }
 function append(text){
  for(const character of text){
   if(escape){
    if(escape==='\x1b'&&character==='['){escape+='[';continue;}
    if(escape==='\x1b'){escape='';continue;}
    if(!/[A-Za-z~]/.test(character)&&escape.length<26){escape+=character;continue;}
    if(character==='K')lines[row]=(lines[row]||'').slice(0,column);
    if(character==='D')column=Math.max(0,column-(Number(escape.slice(2))||1));
    if(character==='C')column=Math.min(79,column+(Number(escape.slice(2))||1));
    if(character==='J'&&escape==='\x1b[2'){
     lines.splice(0,lines.length,'');row=0;column=0;offset=0;
    }
    escape='';continue;
   }
   if(character==='\x1b'){escape=character;continue;}
   if(character==='\r'){column=0;continue;}
   if(character==='\n'){row++;column=0;lines[row]='';continue;}
   if(character==='\b'){column=Math.max(0,column-1);continue;}
   if(character==='\t'){column+=8-column%8;continue;}
   if(character<' '||character==='\x7f')continue;
   if(column>=80){row++;column=0;lines[row]='';}
   const line=(lines[row]||'').padEnd(column,' ');
   lines[row]=line.slice(0,column)+character+line.slice(column+1);
   column++;
  }
  if(lines.length>500){const drop=lines.length-500;lines.splice(0,drop);row-=drop;}
  if(status==='starting'&&/(?:~% |# |\$ )$/.test(lines[row]||'')){
   status='ready';clearTimeout(timeout);
  }
  redraw();
 }
 function open(){
  if(worker)return;
  let base;
  try{base=new URL('/linux/',document.baseURI);}catch{}
  if(!base||!['http:','https:'].includes(base.protocol)){status='offline';redraw();return;}
  status='starting';redraw();
  try{
   const url=URL.createObjectURL(new Blob(['('+guest.toString()+')();'],{type:'text/javascript'}));
   try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
   worker.onmessage=({data})=>{if(data.type==='error')fail();if(data.type==='output')append(data.text);};
   worker.onerror=fail;
   worker.postMessage({type:'start',base:base.href});
   timeout=setTimeout(fail,65000);
  }catch{fail();}
 }
 function key(value,ctrl=false){
  if(value==='PageUp'||value==='PageDown'){
   offset=Math.max(0,Math.min(Math.max(0,lines.length-10),offset+(value==='PageUp'?8:-8)));
   redraw();return true;
  }
  if(status!=='ready')return false;
  let text;
  if(ctrl&&/^[a-z]$/i.test(value))text=String.fromCharCode(value.toLowerCase().charCodeAt(0)-96);
  else if(!ctrl)text=keys[value]||(Array.from(value).length===1&&value>=' '?value:'');
  if(!text)return false;
  offset=0;worker.postMessage({type:'input',text});
  return true;
 }
 function getState(){
  const end=lines.length-offset;
  return {status,lines:Array.from(lines.slice(Math.max(0,end-10),end),line=>line||''),column:offset===0?column:null};
 }
 return {open,stop,key,getState};
}
