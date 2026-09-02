import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-larsene-ledger-2024.json');
const matrix=read('dados/auditoria-normativa-subclasses-larsene-ledger-2024.json');
const catalog=read('dados/subclasses-pdfs.json');
const precedence=read('dados/precedencia-subclasses.json');
const sources=read('dados/fontes-normativas-criacao.json');
const state=fs.readFileSync('scripts/character-builder/state.js','utf8');
const catalogs=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));

assert.equal(data.fonte_id,'larsene-ledger-2024');
assert.equal(matrix.autoridade,'terceiro_compativel');
assert.equal((data.subclasses||[]).length,7,'L’Arsène deve expor exatamente 7 subclasses.');
assert.equal(matrix.quantidade,7);

const expected={
 'Path of the Brewmaster':[3,6,10,14],
 'College of Mixology':[3,6,14],
 'Festivity Domain':[1,2,6,8,17],
 'Tavern Brawler':[3,7,10,15,18],
 'Way of the Artisan':[3,6,11,17],
 'Charlatan':[3,9,13,17],
 'Swarmslinger':[3,7,10,14]
};
assert.deepEqual([...byName.keys()].sort(),Object.keys(expected).sort(),'Identidades L’Arsène divergentes.');
for(const[name,levelsExpected]of Object.entries(expected)){
 const row=byName.get(name);
 const levels=[...new Set((row.progressao||[]).map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
 assert.deepEqual(levels,levelsExpected,`${name}: patamares divergentes.`);
 assert.ok(String(row.resumo||'').trim(),`${name}: resumo ausente.`);
 for(const f of row.progressao||[])assert.ok(String(f.nome||'').trim()&&String(f.descricao||'').trim(),`${name}: característica incompleta.`);
}

const catalogRows=(catalog.subclasses||[]).filter(x=>x.fonte_id==='larsene-ledger-2024');
assert.equal(catalogRows.length,7,'Catálogo deve conter 7 subclasses L’Arsène.');
for(const name of Object.keys(expected))assert.ok(catalogRows.some(x=>x.nome===name),`Catálogo L’Arsène sem ${name}.`);
assert.equal(catalogRows.find(x=>x.nome==='Swarmslinger')?.classe,'Tamer','Swarmslinger deve permanecer associado a Tamer.');

const mapping=(sources.mapeamentos||[]).find(x=>x.padrao==='dados/subclasses-mecanicas-larsene-ledger-2024.json');
assert.equal(mapping?.autoridade,'terceiro_compativel','L’Arsène não pode ser promovido a autoridade oficial.');
const priorities=precedence.prioridade_fontes||{};
assert.equal(priorities['larsene-ledger-2024'],200,'Prioridade L’Arsène deve permanecer 200.');
for(const official of['phb-2024','eberron-forge-2025','fr-heroes-2025'])assert.ok(Number(priorities['larsene-ledger-2024'])<Number(priorities[official]),`L’Arsène deve ter prioridade inferior a ${official}.`);

assert.match(state,/CLASS_SLUGS=\[[^\]]*'barbarian'[^\]]*'wizard'[^\]]*\]/,'Conjunto de classes core deve estar explícito.');
assert.ok(!/CLASS_SLUGS=\[[^\]]*'tamer'/.test(state),'Tamer não pode ser promovido silenciosamente ao conjunto de classes core.');
assert.match(catalogs,/function classSlug\(n\)/,'Runtime deve preservar classe desconhecida como slug isolado.');
assert.ok(!JSON.stringify(data).toLowerCase().includes('supabase'),'L’Arsène não pode introduzir Supabase.');

console.log('L’Arsène validado: 7 subclasses de terceiro, seis classes padrão + Swarmslinger/Tamer isolado, sem promoção normativa ou runtime silenciosa.');
