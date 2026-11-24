const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const{createTranslator}=require('./i18n.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'i18n-data.js'),'utf8'),sandbox);
const make=()=>createTranslator(sandbox.window.ITLAB_I18N_DATA);
test('Kazakh resources cover every main lesson, micro explanation and tutorial step',()=>{
 const I=make(),lessons=require('./component-lessons.js');
 for(const entry of Object.values(lessons.main))for(const key of ['what','look','how','fault','example'])assert.notEqual(I.translate(entry[key],'kk'),entry[key]);
 for(const part of require('./micro-data.js')){
  for(const key of ['summary','detail','powered'])assert.notEqual(I.translate(part[key],'kk'),part[key]);
  for(const key of ['what','look','fault','example'])assert.notEqual(I.translate(lessons.micro[part.id][key],'kk'),lessons.micro[part.id][key]);
 }
 for(const step of require('./tutorial.js'))for(const key of ['title','text'])assert.notEqual(I.translate(step[key],'kk'),step[key]);
});
test('localized labels preserve canonical model identities and Russian is reversible',()=>{
 const I=make();for(const name of Object.keys(require('./component-lessons.js').main))assert.equal(I.canonical(I.translate(name,'kk')),name);
 assert.equal(I.translate('Материнская плата','ru'),'Материнская плата');
 I.setLanguage('kk');assert.equal(I.translate('Материнская плата'),'Аналық тақша');I.setLanguage('ru');assert.equal(I.translate('Материнская плата'),'Материнская плата');
});
test('dynamic report messages and interpreter errors translate without changing data',()=>{
 const I=make();assert.equal(I.translate('Переменная total ещё не определена.','kk'),'total айнымалысы әлі анықталмаған.');
 const text=I.translate('Маршрут: Сборка ПК\nСтатус: завершено\nRAM установлена в DIMM.\nIP: 192.168.10.20/24.','kk');
 assert.match(text,/Бағыт: Компьютерді құрастыру/);assert.match(text,/Күйі: аяқталды/);assert.match(text,/RAM DIMM-ге орнатылды/);assert.match(text,/192\.168\.10\.20\/24/);
 assert.equal(I.translate('a = 7\nb = 5\nprint(a + b)','kk'),'a = 7\nb = 5\nprint(a + b)');
});
test('unknown language cannot activate an unrecognized locale',()=>{
 const I=make();I.setLanguage('kk');I.setLanguage('unknown');assert.equal(I.language,'kk');assert.equal(I.translate('SSD M.2','kk'),'SSD M.2');
});
