'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function buildI18n(){
 const root=__dirname,read=file=>fs.readFileSync(path.join(root,file),'utf8');
 const kk=require('./locale-kk.js'),ui=require('./locale-ui-kk.js'),lessons=require('./component-lessons.js'),micro=require('./micro-data.js'),tutorial=require('./tutorial.js');
 const sandbox={window:{}};vm.runInNewContext(read('catalog-data.js'),sandbox);const catalog=sandbox.window.ITLAB_CATALOG;
 const strings={...ui.strings,...require('./locale-assembly-kk.js'),...require('./locale-network-kk.js')};
 const add=(ru,kz)=>{if(typeof ru!=='string'||!kz)throw Error('Missing Kazakh translation: '+ru);strings[ru]=kz;};
 for(const [name,entry]of Object.entries(lessons.main)){
   const localized=kk.main[name];if(!localized)throw Error('Missing component: '+name);add(name,localized.name);
   for(const key of ['what','look','how','fault','example'])add(entry[key],localized[key]);
   const row=catalog.find(row=>row[0]===name);add(row[2],localized.what+' '+localized.how);add(row[3],localized.fault);
 }
 for(const part of micro){
   const values=kk.micro[part.id];if(!values||values.length!==8)throw Error('Missing micro component: '+part.id);
   const [name,category,what,look,detail,powered,fault,example]=values,entry=lessons.micro[part.id];
   add(part.name,name);add(part.category,category);add(part.summary,what);add(part.detail,detail);add(part.powered,powered);
   for(const [ru,kz]of [[entry.what,what],[entry.look,look],[entry.fault,fault],[entry.example,example]])add(ru,kz);
 }
 if(tutorial.length!==kk.tutorial.length)throw Error('Tutorial translation count mismatch');
 tutorial.forEach((step,i)=>{add(step.title,kk.tutorial[i][0]);add(step.text,kk.tutorial[i][1]);});
 for(const route of require('./board-routes.js')){
   add(...route.label);
   for(const step of route.steps){add(...step.title);add(...step.body);}
 }
 // The viewer has concise stand-alone descriptions in addition to the detailed cards.
 for(const match of read('model.js').matchAll(/register\('([^']+)','([^']+)'/g)){const entry=kk.main[match[1]];if(entry)add(match[2],entry.what+' '+entry.how);}
 const script='window.ITLAB_I18N_DATA = '+JSON.stringify({strings,patterns:ui.patterns})+';';
 fs.writeFileSync(path.join(root,'i18n-data.js'),script);return script;
};
