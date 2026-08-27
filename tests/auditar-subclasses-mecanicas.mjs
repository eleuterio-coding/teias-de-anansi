import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=[
 'dados/subclasses-mecanicas-phb-2024.json',
 'dados/subclasses-mecanicas-forge-2025.json',
 'dados/subclasses-mecanicas-quickstone-2024.json',
 'dados/subclasses-mecanicas-heroes-faerun-2025.json',
 'dados/subclasses-mecanicas-tasha-2020.json',
 'dados/subclasses-mecanicas-xanathar-2017.json',
 'dados/subclasses-mecanicas-larsene-ledger-2024.json'
];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const forbidden=[/referência mecânica/i,/identificada e consolidada/i,/referência ativa do catálogo/i,/mantida no catálogo/i,/sem reproduzir integralmente/i];

const catalog=json('dados/subclasses-pdfs.json');
assert.equal(catalog.total,119,'O catálogo deve declarar 119 subclasses.');
assert.equal(catalog.subclasses.length,119,'O catálogo deve conter 119 registros.');
const catalogNames=new Map(catalog.subclasses.map(row=>[fold(row.nome),row.nome]));
assert.equal(catalogNames.size,119,'As 119 subclasses precisam ter identidades únicas.');

const mechanics=new Map();
for(const file of FILES){
 const pkg=json(file);
 assert.equal(pkg.schema,'hub-rpg/subclass-mechanics/v1',`${file}: schema inválido.`);
 assert.ok(pkg.fonte_id,`${file}: fonte_id ausente.`);
 for(const row of pkg.subclasses||[]){
  const key=fold(row.nome);
  assert.ok(!mechanics.has(key),`Mecânica duplicada: ${row.nome}`);
  assert.ok(String(row.resumo||'').trim().length>=20,`${row.nome}: resumo mecânico insuficiente.`);
  assert.ok(Array.isArray(row.progressao)&&row.progressao.length>0,`${row.nome}: progressão ausente.`);
  for(const feature of row.progressao){
   assert.ok(Number(feature.nivel)>0,`${row.nome}: nível inválido em ${feature.nome||'característica'}.`);
   assert.ok(String(feature.nome||'').trim(),`${row.nome}: nome de característica ausente.`);
   assert.ok(String(feature.descricao||'').trim().length>=15,`${row.nome} / ${feature.nome}: descrição mecânica insuficiente.`);
   for(const rx of forbidden)assert.ok(!rx.test(`${row.resumo} ${feature.descricao}`),`${row.nome}: placeholder editorial encontrado.`)
  }
  mechanics.set(key,row.nome)
 }
}
assert.equal(mechanics.size,119,`Cobertura mecânica incompleta: ${mechanics.size}/119.`);
for(const[key,name]of catalogNames)assert.ok(mechanics.has(key),`Sem mecânica: ${name}`);
for(const[key,name]of mechanics)assert.ok(catalogNames.has(key),`Mecânica sem registro no catálogo: ${name}`);

const source=read('dados/_module-source/subclasses.html');
assert.equal((source.match(/<details class="subclasse"/g)||[]).length,119,'O HTML-fonte deve manter 119 cards.');
const runtime=read('scripts/subclass-mechanics-catalog.js');
for(const file of FILES)assert.ok(runtime.includes(file),`Runtime não carrega ${file}.`);
assert.ok(runtime.includes('applied!==119')&&runtime.includes('map.size!==119'),'Runtime precisa exigir cobertura 119/119.');
const cleaner=read('scripts/module-clean-loader.js');
assert.ok(cleaner.includes('scripts/subclass-mechanics-catalog.js'),'Subclasses não carregam o enriquecedor mecânico.');
assert.ok(!cleaner.includes('Compatibilidade 5e/5.5e:'),'O bloco editorial de compatibilidade não deve voltar ao módulo Subclasses.');
const classUi=read('scripts/character-builder/class-skill-ui.js');
assert.ok(classUi.includes('initSubclassMechanicsData'),'O construtor não inicializa os dados mecânicos das subclasses.');
const builderData=read('scripts/character-builder/subclass-mechanics-data.js');
for(const file of FILES)assert.ok(builderData.includes(file),`Construtor não carrega ${file}.`);

console.log(`OK: ${mechanics.size}/119 subclasses com mecânica estruturada e integrada.`);
