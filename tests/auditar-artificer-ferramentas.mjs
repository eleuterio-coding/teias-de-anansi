import fs from'node:fs';
import assert from'node:assert/strict';
import{state}from'../scripts/character-builder/state.js';
import{artificerBaseArtisanToolOptions,artificerBaseArtisanTool,setArtificerBaseArtisanTool,artificerSubclassChoiceDefs,setArtificerSubclassChoice,artificerSubclassOutcome,applyArtificerSubclassMechanics}from'../scripts/character-builder/artificer-subclass-mechanics.js';

const catalog=JSON.parse(fs.readFileSync('dados/ferramentas-pdfs.json','utf8'));
state.catalogs.tools=catalog.ferramentas||[];state.catalogs.spells=[];
const reset=()=>{state.c={choices:{artificer:{},subclassMechanics:{}}}};
const make=(tools=[])=>({klass:{slug:'artificer',name:'Artífice'},sub:{name:'Alchemist',mechanics:{name:'Alchemist'},features:[]},level:3,pbonus:2,scores:{Inteligência:16,Força:10,Destreza:14,Constituição:14,Sabedoria:12,Carisma:8},speed:30,tools:[...tools],spellAttack:5,spellDC:13,selectedSpells:{leveled:[]}});
const replacementDefs=d=>artificerSubclassChoiceDefs(d).filter(x=>x.id.startsWith('toolReplacement'));

reset();
const artisan=artificerBaseArtisanToolOptions();
assert.ok(artisan.length>=15,'A escolha do Artífice deve ser alimentada pelo catálogo de Ferramentas de Artesão.');
assert.ok(artisan.includes("Alchemist's Supplies")&&artisan.includes("Jeweler's Tools")&&artisan.includes("Smith's Tools"),'Ferramentas de Artesão esperadas não foram carregadas da Biblioteca.');
assert.ok(!artisan.includes('Herbalism Kit')&&!artisan.includes("Thieves' Tools"),'Kits e outras ferramentas não podem entrar na escolha de Artisan Tool.');

reset();setArtificerBaseArtisanTool("Jeweler's Tools");
assert.equal(artificerBaseArtisanTool(),"Jeweler's Tools",'A ferramenta de artesão da classe precisa ser persistida como entidade do catálogo.');
let d=make();
assert.equal(replacementDefs(d).length,0,'Sem proficiência duplicada, o Alchemist não deve mostrar substituição de ferramenta.');

reset();setArtificerBaseArtisanTool("Jeweler's Tools");d=make(["Alchemist's Supplies"]);
let defs=replacementDefs(d);
assert.equal(defs.length,1,'Duplicar apenas Alchemist\'s Supplies deve gerar exatamente uma substituição.');
assert.equal(defs[0].id,'toolReplacement1');assert.equal(defs[0].required,true,'Uma duplicata detectada precisa ser resolvida.');
assert.ok(!defs[0].options.includes("Jeweler's Tools"),'Ferramenta em que o personagem já é proficiente não pode ser escolhida como substituta.');
assert.ok(!defs[0].options.includes("Alchemist's Supplies"),'A própria ferramenta duplicada não pode ser escolhida novamente.');
assert.ok(!defs[0].options.includes('Herbalism Kit'),'Herbalism Kit não é Ferramenta de Artesão e não pode substituir a duplicata.');

reset();d=make(["Alchemist's Supplies",'Herbalism Kit']);defs=replacementDefs(d);
assert.deepEqual(defs.map(x=>x.id),['toolReplacement1','toolReplacement2'],'Duas proficiências duplicadas devem gerar dois seletores condicionais.');
setArtificerSubclassChoice(d,'toolReplacement1',"Smith's Tools");
defs=replacementDefs(d);assert.ok(!defs.find(x=>x.id==='toolReplacement2').options.includes("Smith's Tools"),'Os dois seletores não podem escolher a mesma ferramenta.');
setArtificerSubclassChoice(d,'toolReplacement2',"Woodcarver's Tools");
let out=artificerSubclassOutcome(d);
assert.ok(out.tools.includes('Suprimentos de Alquimista')&&out.tools.includes('Kit de Herbalismo'),'As proficiências fixas da subclasse precisam permanecer ativas.');
assert.ok(out.tools.includes('Ferramentas de Ferreiro')&&out.tools.includes('Ferramentas de Entalhador'),'As duas substituições válidas precisam chegar às proficiências finais.');
assert.equal(out.pending.filter(x=>x.id.startsWith('toolReplacement')).length,0,'Substituições válidas não podem permanecer pendentes.');

reset();d=make(["Alchemist's Supplies"]);setArtificerSubclassChoice(d,'toolReplacement1','Herbalism Kit');out=artificerSubclassOutcome(d);
assert.ok(out.pending.some(x=>x.id==='toolReplacement1'),'Uma opção que não seja Ferramenta de Artesão deve ser rejeitada e continuar pendente.');
assert.equal(out.tools.filter(x=>x==='Kit de Herbalismo').length,1,'A tentativa inválida não pode adicionar uma proficiência extra em Herbalism Kit.');

reset();setArtificerBaseArtisanTool("Alchemist's Supplies");d=make();
assert.equal(replacementDefs(d).length,1,'A Ferramenta de Artesão escolhida pela própria classe precisa participar da detecção de duplicidade da subclasse.');

reset();setArtificerBaseArtisanTool("Jeweler's Tools");
const base={klass:{slug:'artificer',name:'Artífice'},sub:null,level:1,tools:[],scores:{Inteligência:16}};applyArtificerSubclassMechanics(base);
assert.ok(base.tools.includes("Thieves' Tools")&&base.tools.includes("Tinker's Tools")&&base.tools.includes("Jeweler's Tools"),'As três proficiências de ferramenta da classe Artífice precisam chegar à ficha mesmo antes da subclasse.');

const ui=fs.readFileSync('scripts/character-builder/artificer-subclass-ui.js','utf8'),mechanics=fs.readFileSync('scripts/character-builder/artificer-subclass-mechanics.js','utf8');
assert.ok(ui.includes("json('dados/ferramentas-pdfs.json')"),'A interface deve consumir diretamente o mesmo catálogo da Biblioteca de Ferramentas.');
assert.ok(ui.includes('data-artificer-base-tool'),'A Ferramenta de Artesão da classe precisa ser uma escolha estruturada.');
assert.ok(!ui.includes('placeholder="Ex.: Ferramentas de Joalheiro"'),'O campo livre de ferramenta substituta não pode voltar.');
assert.ok(mechanics.includes('priorToolKeys')&&mechanics.includes('artificerBaseArtisanToolOptions'),'A duplicidade deve ser calculada contra proficiências existentes e o catálogo real.');
assert.ok(!`${ui}\n${mechanics}`.toLowerCase().includes('supabase'),'Esta integração não pode introduzir Supabase.');
console.log('Ferramentas do Artífice validadas: catálogo, duplicidades condicionais, filtros e persistência.');
