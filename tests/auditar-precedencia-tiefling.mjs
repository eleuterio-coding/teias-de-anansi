import fs from 'node:fs';
import assert from 'node:assert/strict';
import {state} from '../scripts/character-builder/state.js';
import {organizeRaceVariants} from '../scripts/character-builder/race-variants.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=read('dados/auditoria-normativa-tiefling.json');
const legacyData=read('dados/tiefling-variantes.json');
const quickstone=read('dados/especies-pdf-quickstone-2024.json');
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');

assert.equal(matrix.fonte_vigente.autoridade,'oficial_atual');
assert.equal(matrix.legado_oficial_unico.autoridade,'oficial_legado');
assert.equal(matrix.terceiro_quickstone.autoridade,'terceiro_compativel');
assert.equal(matrix.runtime_esperado.legados_totais,21);

const current=legacyData.mecanicas.filter(x=>x.status==='atual');
assert.equal(current.length,3,'Tiefling 2024 deve ter exatamente 3 legados atuais.');
for(const expected of matrix.fonte_vigente.legados){
 const row=current.find(x=>fold(x.nome)===fold(expected.nome));
 assert.ok(row,`Legado 2024 ausente: ${expected.nome}`);
 const text=[row.resistencia,row.nivel1,row.nivel3,row.nivel5].join(' ');
 for(const token of [expected.resistencia,expected.nivel1,expected.nivel3,expected.nivel5])assert.ok(fold(text).includes(fold(token)),`${expected.nome}: sem ${token}`);
 assert.match(String(row.atributo_conjuracao||''),/Inteligência.*Sabedoria.*Carisma/i,`${expected.nome}: atributo de conjuração 2024 divergente.`);
}

const legacy=legacyData.mecanicas.filter(x=>/legado_compativel_conteudo_unico/i.test(x.status||''));
assert.equal(legacy.length,11,'Tiefling deve preservar 11 pacotes oficiais legados únicos.');
assert.deepEqual(legacy.map(x=>x.nome).sort(),[...matrix.legado_oficial_unico.nomes].sort());
for(const row of legacy){
 assert.equal(row.ruleset,'5e',`${row.nome}: ruleset legado divergente.`);
 assert.equal(Number(row.revisao_core),2014,`${row.nome}: revisão legada divergente.`);
 assert.equal(row.substitui,'Fiendish Legacy',`${row.nome}: deve substituir apenas Fiendish Legacy.`);
}

assert.deepEqual(legacyData.excluidas.map(x=>x.nome).sort(),matrix.excluidos.map(x=>x.nome).sort(),'Conjunto de variantes excluídas divergente.');

const q=quickstone.items.find(x=>x.nome==='Tiefling — Eberron');
assert.ok(q,'Quickstone deve conter a variante Tiefling — Eberron.');
assert.equal(q.subtipo,'variante_de_especie');
assert.equal(q.variante_de,'Tiefling');
const qNames=q.tracos.map(x=>x.nome.replace(/\s+Legacy$/i,''));
assert.deepEqual(qNames.sort(),[...matrix.terceiro_quickstone.nomes].sort(),'Legados Quickstone divergentes.');

const trait=(name,text='')=>({name,originalName:name,text});
const base={id:'tiefling',name:'Tiefling',ruleset:'5.5e',revision:2024,status:'atual',source:'PHB 2024',sizes:['Medium','Small'],speed:30,traits:[trait('Fiendish Legacy'),trait('Otherworldly Presence')],abilityBonuses:[],lineages:matrix.fonte_vigente.legados.map(x=>({name:x.nome,traits:[]}))};
const eberron={id:'quickstone-tiefling',name:'Tiefling — Eberron',ruleset:'5e',revision:2014,status:'legado_compativel',compatibleWith:['5.5e'],source:'Frontiers of Eberron: Quickstone',sizes:['Medium','Small'],speed:30,traits:q.tracos.map(x=>trait(x.nome,x.texto)),abilityBonuses:[],lineages:[]};
state.c={refs:{species:null},choices:{species:{size:null,lineage:null}}};
const out=organizeRaceVariants([base,eberron],legacyData);
const tieflings=out.filter(x=>fold(x.name)==='tiefling');
assert.equal(tieflings.length,1,'Runtime deve expor uma única espécie-base Tiefling.');
assert.ok(!out.some(x=>/tiefling.*eberron/i.test(x.name)),'Tiefling Quickstone não pode permanecer como segunda espécie independente.');
const t=tieflings[0];
assert.equal(t.lineages.length,21,'Runtime Tiefling deve expor exatamente 21 legados permitidos.');
assert.equal(new Set(t.lineages.map(x=>fold(x.name))).size,21,'Legados Tiefling não podem duplicar identidade.');
for(const name of [...matrix.fonte_vigente.legados.map(x=>x.nome),...matrix.legado_oficial_unico.nomes,...matrix.terceiro_quickstone.nomes])assert.ok(t.lineages.some(x=>fold(x.name)===fold(name)),`Runtime sem legado Tiefling: ${name}`);
for(const name of matrix.excluidos.map(x=>x.nome))assert.ok(!t.lineages.some(x=>fold(x.name)===fold(name)),`Variante excluída reapareceu: ${name}`);
for(const l of t.lineages)assert.equal((l.abilityBonuses||[]).length,0,`${l.name}: ASI racial legado não pode ser aplicado.`);
const quickRuntime=t.lineages.filter(x=>matrix.terceiro_quickstone.nomes.some(n=>fold(n)===fold(x.name)));
assert.equal(quickRuntime.length,7);
for(const row of quickRuntime){assert.equal(row.ruleset,'5e');assert.ok((row.compatibleWith||[]).includes('5.5e'));assert.match(String(row.source||''),/Quickstone/i)}

const raceSource=fs.readFileSync('scripts/character-builder/race-variants.js','utf8');
assert.match(raceSource,/legado_compativel_conteudo_unico/i,'Runtime deve filtrar explicitamente conteúdo legado único.');
assert.ok(!raceSource.toLowerCase().includes('supabase'),'Runtime Tiefling não pode introduzir Supabase.');
console.log('Precedência Tiefling validada: 3 legados 2024 + 11 oficiais legados + 7 Quickstone = 21 opções, sem ASI racial legado.');
