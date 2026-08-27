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
  mechanics.set(key,row)
 }
}
assert.equal(mechanics.size,119,`Cobertura mecânica incompleta: ${mechanics.size}/119.`);
for(const[key,name]of catalogNames)assert.ok(mechanics.has(key),`Sem mecânica: ${name}`);
for(const[key,row]of mechanics)assert.ok(catalogNames.has(key),`Mecânica sem registro no catálogo: ${row.nome}`);

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
assert.ok(classUi.includes('initBarbarianSubclassUi'),'O construtor não inicializa a interface das subclasses de Bárbaro.');
const builderData=read('scripts/character-builder/subclass-mechanics-data.js');
for(const file of FILES)assert.ok(builderData.includes(file),`Construtor não carrega ${file}.`);
assert.ok(builderData.includes('name:row.nome'),'O construtor deve preservar o nome canônico para aplicar regras mesmo com localização.');
const rules=read('scripts/character-builder/rules.js');
assert.ok(rules.includes('applyBarbarianSubclassMechanics(d)'),'derive() não aplica as mecânicas das subclasses de Bárbaro.');
const barbarianUi=read('scripts/character-builder/barbarian-subclass-ui.js');
assert.ok(barbarianUi.includes('data-barbarian-subclass-pending'),'Pendências obrigatórias de subclasse não chegam à revisão global.');
assert.ok(barbarianUi.includes('data-barbarian-subclass-combat'),'Ataques concedidos pela subclasse não chegam ao bloco de combate.');
const languages=read('scripts/character-builder/language-mechanics.js');
assert.ok(languages.includes('Path of the Demonshard')&&languages.includes('subclass:demonshard:demontongue'),'Demontongue não está integrado ao sistema central de idiomas.');

const barbarianCatalog=catalog.subclasses.filter(row=>row.classe==='Barbarian'),barbarianNames=barbarianCatalog.map(row=>row.nome);
assert.equal(barbarianNames.length,10,`Esperadas 10 subclasses de Bárbaro no catálogo atual; encontradas ${barbarianNames.length}.`);
const barbarianSource=read('scripts/character-builder/barbarian-subclass-mechanics.js');
for(const name of barbarianNames)assert.ok(barbarianSource.includes(`'${name}'`),`Subclasse de Bárbaro sem implementação explícita: ${name}`);
for(const token of['rageDamage','rageUses','subclassAttacks','subclassResources','subclassDefenses','subclassMovementModes','subclassLanguages','subclassWeaponTraining'])assert.ok(barbarianSource.includes(token),`Contrato mecânico ausente: ${token}`);

const{state}=await import('../scripts/character-builder/state.js');
const{barbarianSubclassOutcome,barbarianSubclassChoiceDefs,setBarbarianSubclassChoice}=await import('../scripts/character-builder/barbarian-subclass-mechanics.js');
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{}};return{klass:{slug:'barbarian',name:'Bárbaro'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Number(x.nivel),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:20,Destreza:14,Constituição:18,Inteligência:10,Sabedoria:12,Carisma:10},speed:40,tools:[]}}
for(const name of barbarianNames){
 const d=make(name),row=mechanics.get(fold(name)),out=barbarianSubclassOutcome(d);assert.ok(out,`${name}: outcome mecânico ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: nem todas as características de nível 20 ficaram ativas.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length>0,`${name}: nenhuma regra estruturada foi aplicada.`);assert.ok(Array.isArray(barbarianSubclassChoiceDefs(d)),`${name}: definições de escolha inválidas.`)
}
for(const[name,required]of [['Path of the Wild Heart','wildAspect'],['Path of the Beast','bestialSoul'],['Path of the Storm Herald','stormAura'],['Path of the Demonshard','demontongue'],['Path of the Brewmaster','brewersGut']]){
 const d=make(name),out=barbarianSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id===required),`${name}: a escolha obrigatória ${required} não é cobrada.`)
}
{
 const d=make('Path of the Beast',6);setBarbarianSubclassChoice(d,'bestialSoul','Escalada');const out=barbarianSubclassOutcome(d);assert.equal(out.movementModes.climb,40,'Bestial Soul — Escalada não aplica Climb Speed.');assert.ok(out.summary.some(x=>/tetos/.test(x.value)),'Bestial Soul — Escalada perdeu a escalada sem teste em superfícies difíceis/tetos.')
}
{
 const d=make('Path of the Storm Herald',14);setBarbarianSubclassChoice(d,'stormAura','Deserto');const out=barbarianSubclassOutcome(d);assert.ok(out.summary.some(x=>x.name==='Raging Storm — Deserto'&&/^7 /.test(String(x.value))),'Raging Storm — Deserto deve causar metade do nível de Bárbaro no nível 14.')
}
{
 const d=make('Path of the Demonshard',14);setBarbarianSubclassChoice(d,'demontongue','Abissal');const out=barbarianSubclassOutcome(d);assert.deepEqual(out.languages,['Abissal'],'Demontongue não produz o idioma escolhido.');assert.ok(out.summary.some(x=>x.name==='Aspect of Tyranny'&&/1d10/.test(x.value)&&/Amedrontado/.test(x.value)),'Aspect of Tyranny não aplica dano/medo completos.')
}
{
 const d=make('Path of the Brewmaster',14);setBarbarianSubclassChoice(d,'brewersGut','Liquid Courage');setBarbarianSubclassChoice(d,'ancestralDrink','Sake');const out=barbarianSubclassOutcome(d);assert.ok(out.tools.includes('Suprimentos de Cervejeiro')&&out.weaponTraining.includes('Armas improvisadas'),'Brewer não aplica todas as proficiências.');assert.ok(out.defenses.some(x=>x.name==='Fermented Binge — Sake'&&/Psychic/.test(x.value)&&/Enfeitiçado/.test(x.value)),'Fermented Binge — Sake incompleto.');assert.ok(out.summary.some(x=>/aliado Amedrontado/.test(x.value)),'Liquid Courage não aplica o suporte ao aliado.')
}

console.log(`OK: ${mechanics.size}/119 subclasses com mecânica estruturada; ${barbarianNames.length}/10 subclasses de Bárbaro aplicadas ao criador.`);
