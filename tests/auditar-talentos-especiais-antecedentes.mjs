import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {state} from '../scripts/character-builder/state.js';
import {backgroundSpecialFeatGrant,backgroundSpecialFeatInstance,sanitizeBackgroundSpecialFeatChoice,quickstoneDragonmarkTools} from '../scripts/character-builder/background-special-feat-mechanics.js';
import {activeFeatInstances} from '../scripts/character-builder/feat-mechanics.js';

const forgeFeats=JSON.parse(readFileSync('dados/talentos-forge-2025.json','utf8'));
const forgeBackgrounds=JSON.parse(readFileSync('dados/antecedentes-pdf-forge-2025.json','utf8'));
const quickstone=JSON.parse(readFileSync('dados/antecedentes-pdf-quickstone-2024.json','utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const idFor=name=>`feat:${fold(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
const feats=forgeFeats.itens.map(row=>({id:idFor(row[0]),name:row[0],category:row[1],prereq:row[2],repeatable:/^sim/i.test(String(row[3])),description:row[4]}));
feats.push({id:'feat:alert',name:'Alert',category:'Origem',prereq:'Nenhum',repeatable:false,description:''});
state.catalogs.feats=feats;
state.catalogs.classes=[{id:'class:fighter',name:'Guerreiro',features:[],proficiencies:['Armas marciais']}];
state.catalogs.species=[
 {id:'species:halfling',name:'Halfling',sizes:['Small'],lineages:[]},
 {id:'species:human',name:'Human',sizes:['Medium'],lineages:[]},
 {id:'species:dwarf',name:'Dwarf',sizes:['Medium'],lineages:[]}
];

const dragonmarkBackgrounds=forgeBackgrounds.items.filter(x=>/Dragonmark|Mark of /.test(x.talento||''));
assert.equal(forgeBackgrounds.items.length,17,'Forge 2025 deve manter 17 antecedentes.');
assert.equal(dragonmarkBackgrounds.length,14,'Forge 2025 deve manter 14 antecedentes com Dragonmark especial.');
for(const bg of dragonmarkBackgrounds){
 const feat=feats.find(f=>f.name===bg.talento);
 assert.ok(feat,`${bg.nome}: talento especial precisa existir no catálogo Forge.`);
 assert.equal(feat.category,'Dragonmark',`${bg.nome}: talento concedido deve permanecer categoria Dragonmark.`);
 if(feat.name!=='Aberrant Dragonmark')assert.match(feat.prereq,/(Halfling|Human|Orc|Half-Orc|Khoravar|Half-Elf|Gnome|Dwarf|Elf)/,`${feat.name}: pré-requisito de espécie precisa ser explícito.`);
}

function character({species='species:halfling',background='bg:forge',specialFeat=null}={}){
 state.c={refs:{class:'class:fighter',species,background},choices:{class:{level:1},species:{size:null,lineage:null,traitChoices:{}},background:{originFeat:'feat:alert',specialFeat,toolChoice:''},feats:{},featMechanics:{},equipment:{}}};
}

const forgeBg={id:'bg:forge',name:'Herdeiro Jorasco',source:'Eberron: Forge of the Artificer',feat:{name:'Alert'},_houseOriginalFeat:{name:'Mark of Healing'}};
const quickBg={id:'bg:quick',name:'Combatente da Marca do Dragão',source:'Frontiers of Eberron: Quickstone',feat:{name:'Alert'},_houseOriginalFeat:{name:'Lesser Dragonmark'},toolChoice:'a ferramenta indicada na tabela Antecedentes de Marca do Dragão'};
state.catalogs.backgrounds=[forgeBg,quickBg];

character();
let grant=backgroundSpecialFeatGrant();
assert.equal(grant.mode,'fixed');
assert.equal(grant.feat.name,'Mark of Healing');
assert.equal(grant.valid,true,'Mark of Healing deve ser válida para Halfling.');
assert.equal(backgroundSpecialFeatInstance()?.key,'background:special');
let instances=activeFeatInstances();
assert.ok(instances.some(x=>x.key==='background'&&x.feat.name==='Alert'),'Talento de Origem livre deve permanecer como instância separada.');
assert.ok(instances.some(x=>x.key==='background:special'&&x.feat.name==='Mark of Healing'),'Dragonmark do antecedente deve permanecer como segunda instância.');

character({species:'species:human'});
grant=backgroundSpecialFeatGrant();
assert.equal(grant.mode,'fixed');
assert.equal(grant.valid,false,'Mark of Healing não pode ser concedida mecanicamente a Human.');
assert.equal(backgroundSpecialFeatInstance(),null,'Talento especial inválido não pode entrar no runtime.');

const quickDragonmarked=quickstone.items.filter(x=>['Dragonmarked Bravo','Dragonmarked Foundling','Dragonmarked Scion'].includes(x.nome));
assert.equal(quickDragonmarked.length,3,'Quickstone deve manter três antecedentes Dragonmarked migrados.');
assert.ok(quickDragonmarked.every(x=>x.talento==='Lesser Dragonmark'),'Lesser Dragonmark deve permanecer apenas como proveniência histórica nos três antecedentes.');
const trueMarks=feats.filter(f=>f.category==='Dragonmark'&&f.name!=='Aberrant Dragonmark'&&/^Mark of /.test(f.name));
assert.equal(trueMarks.length,12,'A migração Quickstone deve oferecer exatamente os 12 Dragonmarks verdadeiros.');
assert.equal(Object.keys(quickstone.migracao_forge_2025.opcoes).length,12,'Matriz Quickstone deve declarar 12 opções vigentes.');
assert.equal(quickstone.migracao_forge_2025.opcoes.length,12,'Matriz Quickstone deve declarar 12 opções vigentes.');
assert.ok(!quickstone.migracao_forge_2025.opcoes.some(x=>x.marca==='Aberrant Dragonmark'),'Aberrant Dragonmark não integra a migração Quickstone.');
assert.equal(Object.keys(quickstoneDragonmarkTools()).length,12,'Cada Dragonmark migrado precisa ter ferramenta vinculável.');

character({background:'bg:quick'});
grant=backgroundSpecialFeatGrant();
assert.equal(grant.mode,'choice');
assert.equal(grant.options.length,12);
const healing=grant.options.find(x=>x.feat.name==='Mark of Healing');
assert.equal(healing.valid,true,'Halfling deve poder escolher Mark of Healing.');
assert.equal(grant.options.find(x=>x.feat.name==='Mark of Making').valid,false,'Halfling não pode escolher Mark of Making.');
state.c.choices.background.specialFeat=healing.feat.id;
assert.equal(sanitizeBackgroundSpecialFeatChoice(),true,'Sanitização deve aplicar a ferramenta vinculada da escolha Quickstone.');
assert.equal(state.c.choices.background.specialFeatTool,'Kit de Herbalismo');
assert.equal(state.c.choices.background.toolChoice,'Kit de Herbalismo');
assert.equal(backgroundSpecialFeatInstance()?.feat.name,'Mark of Healing');
instances=activeFeatInstances();
assert.ok(instances.some(x=>x.key==='background:special'&&x.feat.name==='Mark of Healing'));

state.c.refs.species='species:human';
assert.equal(sanitizeBackgroundSpecialFeatChoice(),true,'Troca para espécie incompatível deve invalidar a marca selecionada.');
assert.equal(state.c.choices.background.specialFeat,undefined);
assert.equal(state.c.choices.background.specialFeatTool,undefined);
assert.equal(state.c.choices.background.toolChoice,'','Ferramenta autoaplicada deve ser removida junto da marca invalidada.');

console.log('Talentos especiais de antecedentes validados: 14 Forge + migração Quickstone para 12 Dragonmarks, separados do Talento de Origem livre.');