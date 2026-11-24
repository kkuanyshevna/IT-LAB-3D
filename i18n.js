(function(root,factory){
  const api=factory(root.ITLAB_I18N_DATA||{strings:{},patterns:[]});
  if(typeof module==='object'&&module.exports)module.exports={createTranslator:factory};
  else {root.ITLAB_I18N=api;api.mount(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(data){
  'use strict';
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  const strings=Object.create(null),reverse=Object.create(null);
  for(const [ru,kk]of Object.entries(data.strings||{})){
    strings[normalize(ru)]=kk;reverse[normalize(kk)]=ru;
    if(ru===ru.toLocaleLowerCase('ru'))continue;
    strings[normalize(ru.toLocaleUpperCase('ru'))]=kk.toLocaleUpperCase('kk');
  }
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const keys=Object.keys(strings).filter(k=>k.length>1).sort((a,b)=>b.length-a.length);
  const fragments=keys.length?new RegExp('(?<![\\p{L}\\p{N}_])(?:'+keys.map(escape).join('|')+')(?![\\p{L}\\p{N}_])','gu'):null;
  const patterns=(data.patterns||[]).map(([source,target])=>[new RegExp(source,'gu'),target]);
  let language='ru',host=null,observer=null;
  const textSources=new WeakMap(),attributeSources=new WeakMap();
  const skip='script,style,textarea,pre,code,[data-i18n-skip],[translate="no"]';
  function translate(text,lang=language){
    if(typeof text!=='string'||lang!=='kk')return text;
    const normalized=normalize(text);if(!normalized)return text;
    const exact=strings[normalized];
    if(exact!==undefined)return text.slice(0,text.search(/\S/))+exact+(text.match(/\s*$/)||[''])[0];
    let result=text;for(const [pattern,replacement]of patterns)result=result.replace(pattern,replacement);
    return fragments?result.replace(fragments,match=>strings[match]):result;
  }
  function localizedValue(value,map,key){
    const old=map.get(key),source=old&&value===old.display?old.source:value,display=translate(source);
    map.set(key,{source,display});return display;
  }
  function apply(root){
    if(!root||!host)return;
    const doc=root.ownerDocument||root;
    function text(node){if(node.parentElement?.closest(skip))return;const next=localizedValue(node.nodeValue,textSources,node);if(next!==node.nodeValue)node.nodeValue=next;}
    if(root.nodeType===3){text(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1&&root.closest(skip))return;
    const walker=doc.createTreeWalker(root,4);let node;while((node=walker.nextNode()))text(node);
    const elements=root.nodeType===1?[root,...root.querySelectorAll('[title],[placeholder],[aria-label],[alt],meta[name="description"]')]:[...root.querySelectorAll('[title],[placeholder],[aria-label],[alt],meta[name="description"]')];
    for(const element of elements){if(element.closest(skip))continue;let map=attributeSources.get(element);if(!map){map=new Map();attributeSources.set(element,map);}for(const attr of ['title','placeholder','aria-label','alt',...(element.matches('meta[name="description"]')?['content']:[])]){if(!element.hasAttribute(attr))continue;const value=element.getAttribute(attr),next=localizedValue(value,map,attr);if(next!==value)element.setAttribute(attr,next);}}
    doc.documentElement.lang=language;
  }
  function controls(){
    const group=host?.document.getElementById('languageToggle');
    if(!group)return;
    group.setAttribute('aria-label',language==='kk'?'Интерфейс тілі':'Язык интерфейса');
    for(const button of group.querySelectorAll('button[data-language]')){
      button.setAttribute('aria-pressed',String(button.dataset.language===language));
    }
  }
  function setLanguage(next,{persist=true}={}){
    if(next!=='ru'&&next!=='kk')return;language=next;
    if(host){if(persist)try{host.localStorage.setItem('itlab.language',next);}catch{}
      apply(host.document);controls();
      for(const iframe of host.document.querySelectorAll('iframe'))try{iframe.contentWindow.ITLAB_I18N?.setLanguage(next,{persist:false});}catch{}
      host.dispatchEvent(new host.CustomEvent('itlab-language-change',{detail:{language:next}}));
    }
  }
  function mount(window){
    host=window;try{const saved=window.localStorage.getItem('itlab.language');if(saved==='kk'||saved==='ru')language=saved;}catch{}
    try{if(window.parent!==window&&window.parent.ITLAB_I18N)language=window.parent.ITLAB_I18N.language;}catch{}
    const start=()=>{
      apply(window.document);
      controls();
      observer=new window.MutationObserver(records=>{for(const record of records){if(record.type==='characterData')apply(record.target);else if(record.type==='attributes')apply(record.target);else for(const child of record.addedNodes)apply(child);}});
      observer.observe(window.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt','content']});
      const buttons=window.document.querySelectorAll('#languageToggle button[data-language]');
      for(const button of buttons){
        button.addEventListener('click',()=>{
          if(button.dataset.language!==language)setLanguage(button.dataset.language);
        });
      }
    };
    if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
  return {translate,canonical:text=>reverse[normalize(text)]||text,apply,setLanguage,mount,get language(){return language;}};
});
