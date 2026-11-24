'use strict';
const fs=require('node:fs'),path=require('node:path');const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const localization=require('./build-i18n.js')();
const lessons=require('./component-lessons.js');
const micro=require('./micro-data.js').map(part=>({...part,...lessons.micro[part.id]}));
const model=read('model.js').trim()
 .replace('__MICRO_DATA__',()=>JSON.stringify(micro))
 .replace('__MICRO_INSPECTOR__',()=>read('micro-inspector.js').trim())
 .replace('__ASSEMBLY_MONITOR__',()=>read('assembly-monitor.js').trim())
 .replace('__BOARD_ROUTE_OVERLAY__',()=>read('board-route-overlay.js').trim());
if(/<\/script/i.test(model))throw Error('Escape closing script tags in model.js');
const viewer=read('viewer-template.html').replace('__MODEL_DEFINITION__',()=>model).replace('</head>',()=>'<script>'+localization.replace(/<\/script/gi,'<\\/script')+'</script><script>'+read('i18n.js').replace(/<\/script/gi,'<\\/script')+'</script></head>');
fs.writeFileSync(path.join(root,'computer.html'),viewer);
const data='window.ITLAB_VIEWER = '+JSON.stringify(Buffer.from(viewer,'utf8').toString('base64'))+';';
fs.writeFileSync(path.join(root,'viewer-data.js'),data);
let portal=read('portal.html').replace('<link rel="stylesheet" href="portal.css">',()=>'<style>'+read('portal.css')+'</style>');
portal=portal.replace(/<script src="([a-z0-9-]+\.js)"><\/script>/g,(_,name)=>'<script>\n'+read(name).replace(/<\/script/gi,'<\\/script')+'\n</script>');
fs.writeFileSync(path.join(root,'index.html'),portal);
console.log('Built index.html and computer.html. No external runtime dependencies.');
