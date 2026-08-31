import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/especies-pdf-quickstone-2024.json');
const matrix=read('dados/auditoria-normativa-especies-quickstone-2024.json');
const sources=read('dados/fontes-normativas-criacao.json');
const byName=new Map((data.items||[]).map(x=>[x.nome,x]));
const trait=(species,name)=>{
 const row=byName.get(species);assert.ok(row,`Espécie ausente: ${species}`);
 const t=(row.tracos||[]).find(x=>x.nome===name);assert.ok(t,`Traço ausente: ${species} / ${name}`);
 return String(t.texto||'');
};
const has=(text,...needles)=>{const normalized=String(text||'').toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito: ${n}\n${text}`)};

assert.equal(data.fonte?.id,'quickstone-2024');
assert.equal(data.fonte?.natureza,'Terceiros');
assert.equal(matrix.autoridade,'terceiro_compativel');
assert.equal((data.items||[]).length,6,'Quickstone deve ter 6 itens runtime: 5 espécies novas + variante Tiefling.');
assert.equal(matrix.especies_novas,5);
assert.equal(matrix.variante_tiefling,1);
assert.equal(matrix.tiefling_legados,7);
assert.deepEqual([...byName.keys()].sort(),['Gargoyle','Gnoll','Harpy','Medusa','Tiefling — Eberron','Worg'].sort());

const tiefling=byName.get('Tiefling — Eberron');
assert.equal(tiefling?.subtipo,'variante_de_especie');
assert.equal(tiefling?.variante_de,'Tiefling');
assert.equal((tiefling?.tracos||[]).length,7,'Tiefling de Eberron deve preservar 7 legados.');
assert.deepEqual((tiefling?.tracos||[]).map(x=>x.nome).sort(),['Dolurrhi Legacy','Fernian Legacy','Kythrian Legacy','Mabaran Legacy','Risian Legacy','Sakah Legacy','Shavaran Legacy'].sort());

has(trait('Gargoyle','Darkvision'),'60 pés');
has(trait('Gargoyle','Elemental Nature'),'Poison','Poisoned','comer','beber','respirar','Petrified');
has(trait('Gargoyle',"Sentry's Rest"),'6 horas','consciente');
has(trait('Gargoyle','Stoneskin'),'13','Destreza');

has(trait('Gnoll','Bite'),'1d4','Força','Perfurante');
has(trait('Gnoll',"Hunter's Senses"),'Perception','Stealth','Survival');
has(trait('Gnoll','Rampage'),'Ação Bônus','metade do Deslocamento','ataque');

has(trait('Harpy','Flight'),'voo','armadura média','pesada');
has(trait('Harpy','Natural Performer'),'Performance');
has(trait('Harpy',"Siren's Song"),'Friends','Verbal','Inteligência','Sabedoria','Carisma');

has(trait('Medusa','Gray Gaze'),'Gray Gaze','petrificada');
has(trait('Medusa',"Medusa's Gift"),'Restrained','Constituição','concentração','Bônus de Proficiência');

assert.equal(byName.get('Worg')?.velocidade,40);
has(trait('Worg','Bite'),'1d8','Força','Perfurante');
has(trait('Worg','Pack Tactics'),'Help','Ação Bônus');
has(trait('Worg','Quadruped'),'montaria','barding','manipulação');

const mapping=(sources.mapeamentos||[]).find(x=>x.padrao==='dados/especies-pdf-quickstone-2024.json');
assert.equal(mapping?.autoridade,'terceiro_compativel','Quickstone não pode ser promovido a fonte oficial.');
assert.ok(Array.isArray(matrix.aliases_editoriais_atuais)&&matrix.aliases_editoriais_atuais.length>=7,'Aliases editoriais atuais devem ficar documentados até confronto textual integral.');
for(const row of data.items||[])assert.ok(!Array.isArray(row.aumentos_atributo)||row.aumentos_atributo.length===0,`${row.nome}: Quickstone não deve injetar ASI racial no runtime 5.5e.`);
assert.ok(!JSON.stringify(data).toLowerCase().includes('supabase'),'Espécies Quickstone não podem introduzir Supabase.');
console.log('Espécies Quickstone validadas: 5 espécies novas + variante Tiefling com 7 legados, terceira parte isolada e aliases editoriais registrados.');
