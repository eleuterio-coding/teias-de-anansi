import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-quickstone-2024.json');
const matrix=read('dados/auditoria-normativa-subclasses-quickstone-2024.json');
const catalog=read('dados/subclasses-pdfs.json');
const precedence=read('dados/precedencia-subclasses.json');
const sources=read('dados/fontes-normativas-criacao.json');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));
const feature=(sub,name)=>{
 const row=byName.get(sub);assert.ok(row,`Subclasse ausente: ${sub}`);
 const f=(row.progressao||[]).find(x=>x.nome===name);assert.ok(f,`Característica ausente: ${sub} / ${name}`);
 return f;
};
const has=(text,...needles)=>{const normalized=String(text||'').toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito: ${n}\n${text}`)};

assert.equal(data.fonte_id,'quickstone-2024');
assert.equal(matrix.autoridade,'terceiro_compativel');
assert.equal((data.subclasses||[]).length,6,'Quickstone deve expor exatamente 6 subclasses.');
assert.equal(matrix.quantidade,6);

const expected={
 'Path of the Demonshard':[3,6,10,14],
 'College of Wands':[3,6,14],
 'Commerce Domain':[3,6,17],
 'Bloodhound':[3,7,11,15],
 'Nemesis Sorcery':[3,6,14,18],
 'Stone Sovereign Patron':[3,6,10,14]
};
assert.deepEqual([...byName.keys()].sort(),Object.keys(expected).sort(),'Identidades Quickstone divergentes.');
for(const[name,levelsExpected]of Object.entries(expected)){
 const row=byName.get(name);
 const levels=[...new Set((row.progressao||[]).map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
 assert.deepEqual(levels,levelsExpected,`${name}: patamares divergentes.`);
 assert.ok(String(row.resumo||'').trim(),`${name}: resumo ausente.`);
}

const catalogRows=(catalog.subclasses||[]).filter(x=>x.fonte_id==='quickstone-2024');
assert.equal(catalogRows.length,6,'Catálogo deve conter exatamente as 6 subclasses Quickstone.');
for(const name of Object.keys(expected))assert.ok(catalogRows.some(x=>x.nome===name),`Catálogo Quickstone sem ${name}.`);

const mapping=(sources.mapeamentos||[]).find(x=>x.padrao==='dados/subclasses-mecanicas-quickstone-2024.json');
assert.equal(mapping?.autoridade,'terceiro_compativel','Quickstone não pode ser promovido a autoridade oficial.');
const priorities=precedence.prioridade_fontes||{};
assert.equal(priorities['quickstone-2024'],200,'Prioridade Quickstone deve permanecer 200.');
for(const official of['phb-2024','eberron-forge-2025','fr-heroes-2025'])assert.ok(Number(priorities['quickstone-2024'])<Number(priorities[official]),`Quickstone deve ter prioridade inferior a ${official}.`);

const officialNames=new Set((catalog.subclasses||[]).filter(x=>['phb-2024','eberron-forge-2025','fr-heroes-2025'].includes(x.fonte_id)).map(x=>String(x.nome).toLocaleLowerCase('en-US')));
for(const name of Object.keys(expected))assert.ok(!officialNames.has(name.toLocaleLowerCase('en-US')),`Terceiro colide com identidade oficial: ${name}`);

const form=feature('Stone Sovereign Patron','Form of Stone');
assert.equal(Number(form.nivel),6,'Form of Stone deve permanecer no nível 6.');
has(feature('Stone Sovereign Patron','Stone Sovereign Spells').descricao,'Earthbind','Earth Tremor');
has(feature('Path of the Demonshard','Fiendish Punishment').descricao,'Rage','Fire','Necrotic','Reação');
has(feature('College of Wands','Bonus Cantrip').descricao,'cantrip','Sorcerer','Wand','Rod','Orb');
has(feature('College of Wands','At Your Fingertips').descricao,'Bardic Inspiration','cantrip','2d6','8d6');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('supabase'),'Quickstone não pode introduzir Supabase.');
console.log('Quickstone 2024 validado: 6 subclasses de terceiro, progressões, invariantes públicos e precedência abaixo das fontes oficiais.');
