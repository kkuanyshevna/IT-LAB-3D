const v86Package='https://cdn.jsdelivr.net/npm/v86@0.5.476/build/';
const bios='https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/bios/';
export const linuxAssets={
  'libv86.js':[v86Package+'libv86.js','text/javascript; charset=utf-8','3a5d3cbde1d5bf386b94250c92eaa82c0e730d2b8b166081a67698da97a285f8'],
  'v86.wasm':[v86Package+'v86.wasm','application/wasm','ae9cf3f3ce504790b51d784ead8317ce5039b4fd59d6d5e89106ba25e549294a'],
  'seabios.bin':[bios+'seabios.bin','application/octet-stream','73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98'],
  'vgabios.bin':[bios+'vgabios.bin','application/octet-stream','a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880'],
  'buildroot.bin':['https://i.copy.sh/buildroot-bzimage68.bin','application/octet-stream','507a759c70ab7a490a233be454d0b5b88bc667956a410b531cb4edc091e2eb1c']
};

export function linuxDiskCache(moduleUrl){
  const fs=typeof process!=='undefined'&&process.versions?.node?process.getBuiltinModule?.('node:fs/promises'):null;
  if(!fs)return [];
  const directory=new URL('../linux-assets/',moduleUrl);
  return [
    name=>fs.readFile(new URL(name,directory)).catch(()=>null),
    async(name,bytes)=>{
      try{
        await fs.mkdir(directory,{recursive:true});
        await fs.writeFile(new URL(name,directory),new Uint8Array(bytes));
      }catch{/* A read-only checkout still uses the downloaded asset. */}
    }
  ];
}

export async function fetchLinuxAsset(name,readCached,writeCached){
  if(!Object.hasOwn(linuxAssets,name))return new Response('Not found',{status:404});
  const [url,type,expected]=linuxAssets[name];
  const correct=async bytes=>{
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
    return Array.from(digest,byte=>byte.toString(16).padStart(2,'0')).join('')===expected;
  };
  try{
    let bytes=await readCached?.(name);
    if(!bytes||!await correct(bytes)){
      const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error('Download failed');
      bytes=await response.arrayBuffer();
      if(!await correct(bytes))throw new Error('Unexpected Linux asset checksum');
      await writeCached?.(name,bytes);
    }
    return new Response(bytes,{headers:{
      'Content-Type':type,'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'
    }});
  }catch{
    return new Response('Linux asset is temporarily unavailable',{status:502});
  }
}
