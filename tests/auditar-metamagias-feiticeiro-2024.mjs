import assert from'node:assert/strict';
import fs from'node:fs';
import{state}from'../scripts/character-builder/state.js';
import{metamagicLimit,sanitizeMetamagicIds,sanitizeSorcererMetamagic,metamagicOutcome}from'../scripts/character-builder/metamagic-mechanics.js';

const data=JSON.parse(fs.readFileSync(new URL('../dados/metamagias-feiticeiro-2024.json',import.meta.url),'utf8'));
assert.equal(data.schema,'hub-rpg/metamagias-feiticeiro/v1');
assert.equal(data.fonte.autoridade,'oficial_atual');
assert.equal(data.fonte.ruleset,'5.5e');
assert.equal(data.itens.length,10);assert.equal(data.controle.quantidade,10);assert.equal(new Set(data.itens.map(x=>x.id)).size,10);
assert.deepEqual(data.itens.map(x=>x.id),['careful-spell','distant-spell','empowered-spell','extended-spell','heightened-spell','quickened-spell','seeking-spell','subtle-spell','transmuted-spell','twinned-spell']);
assert.deepEqual(Object.fromEntries(['1','2','9','10','16','17','20'].map(k=>[k,data.progressao[k]])),{'1':0,'2':2,'9':2,'10':4,'16':4,'17':6,'20':6});
assert.equal(data.itens.find(x=>x.id==='heightened-spell').custo,2);assert.equal(data.itens.find(x=>x.id==='quickened-spell').custo,2);assert.equal(data.itens.find(x=>x.id==='twinned-spell').custo,1);

state.catalogs.classes=[{id:'sorcerer',slug:'sorcerer',name:'Feiticeiro'},{id:'wizard',slug:'wizard',name:'Mago'}];state.catalogs.metamagic=data.itens;state.catalogs.metamagicProgression=data.progressao;
state.c={refs:{class:'sorcerer'},choices:{class:{level:2},sorcererMetamagic:{options:['careful-spell','quickened-spell']}}};
assert.equal(metamagicLimit(1),0);assert.equal(metamagicLimit(2),2);assert.equal(metamagicLimit(10),4);assert.equal(metamagicLimit(17),6);
let clean=sanitizeSorcererMetamagic();assert.equal(clean.options.length,2);assert.equal(clean.pending.length,0);assert.deepEqual(clean.ids,['careful-spell','quickened-spell']);
state.c.choices.sorcererMetamagic.options=['careful-spell','careful-spell'];clean=sanitizeSorcererMetamagic();assert.equal(clean.options.length,1);assert.ok(clean.pending.length===1,'Metamagia duplicada deve abrir uma escolha pendente.');
state.c.choices.class.level=10;state.c.choices.sorcererMetamagic.options=['careful-spell','distant-spell','empowered-spell','subtle-spell'];clean=sanitizeSorcererMetamagic();assert.equal(clean.limit,4);assert.equal(clean.pending.length,0);let out=metamagicOutcome();assert.equal(out.sorceryPoints,10);assert.equal(out.options.length,4);
state.c.refs.class='wizard';clean=sanitizeSorcererMetamagic();assert.equal(clean.limit,0);assert.deepEqual(state.c.choices.sorcererMetamagic.options,[],'Opções da classe devem ser limpas quando a classe deixa de ser Feiticeiro.');
const featUse=sanitizeMetamagicIds(['careful-spell','twinned-spell'],{limit:2,requireSorcerer:false});assert.equal(featUse.options.length,2,'Consumidores externos como Metamagic Adept devem reutilizar o catálogo sem exigir classe Feiticeiro.');

const catalog=fs.readFileSync(new URL('../scripts/character-builder/metamagic-catalog.js',import.meta.url),'utf8');const ui=fs.readFileSync(new URL('../scripts/character-builder/metamagic-ui.js',import.meta.url),'utf8');assert.match(catalog,/items\.length!==10/);assert.match(ui,/sanitizeSorcererMetamagic/);assert.match(ui,/hub:sorcerer-metamagic-changed/);
console.log('Metamagia do Feiticeiro 2024 validada: 10/10 opções, progressão 2/4/6 e consumidor externo compatível.');
