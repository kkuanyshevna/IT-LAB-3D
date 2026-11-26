function startLinuxGuest(){
 let vm=null,flush=0;
 let output=[];
 const decoder=new TextDecoder(),encoder=new TextEncoder();
 function sendOutput(){
  flush=0;
  if(!output.length)return;
  const text=decoder.decode(Uint8Array.from(output),{stream:true});
  output=[];
  if(text)self.postMessage({type:'output',text});
 }
 self.onmessage=({data})=>{
  if(data.type==='input'){
   vm?.serial_send_bytes(0,encoder.encode(data.text));
   return;
  }
  if(data.type!=='start'||vm)return;
  try{
   const base=data.base;
   importScripts(base+'libv86.js');
   vm=new self.V86({
    wasm_path:base+'v86.wasm',
    bios:{url:base+'seabios.bin'},
    vga_bios:{url:base+'vgabios.bin'},
    bzimage:{url:base+'buildroot.bin',async:false},
    cmdline:'console=ttyS0 tsc=reliable mitigations=off random.trust_cpu=on',
    filesystem:{},
    memory_size:64*1024*1024,
    disable_keyboard:true,
    disable_mouse:true,
    autostart:true
   });
   vm.add_listener('serial0-output-byte',byte=>{
    output.push(byte);
    if(!flush)flush=setTimeout(sendOutput,35);
   });
   vm.add_listener('download-error',()=>self.postMessage({type:'error'}));
  }catch{
   self.postMessage({type:'error'});
  }
 };
}
