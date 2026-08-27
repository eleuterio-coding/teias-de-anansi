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
assert.ok(classUi.includes('initArtificerSubclassUi'),'O construtor não inicializa a interface das subclasses de Artífice.');
const builderData=read('scripts/character-builder/subclass-mechanics-data.js');
for(const file of FILES)assert.ok(builderData.includes(file),`Construtor não carrega ${file}.`);
assert.ok(builderData.includes('name:row.nome'),'O construtor deve preservar o nome canônico para aplicar regras mesmo com localização.');
const rules=read('scripts/character-builder/rules.js');
assert.ok(rules.includes('applyBarbarianSubclassMechanics(d)'),'derive() não aplica as mecânicas das subclasses de Bárbaro.');
assert.ok(rules.includes('applyArtificerSubclassMechanics(d)'),'derive() não aplica as mecânicas das subclasses de Artífice.');
assert.ok(rules.includes("name==='armorer'||name==='armeiro'"),'Treinamento de Armadura Pesada do Armeiro não chega ao validador global.');
const barbarianUi=read('scripts/character-builder/barbarian-subclass-ui.js');
assert.ok(barbarianUi.includes('data-barbarian-subclass-pending'),'Pendências obrigatórias de subclasse não chegam à revisão global.');
assert.ok(barbarianUi.includes('data-barbarian-subclass-combat'),'Ataques concedidos pela subclasse não chegam ao bloco de combate.');
const artificerUi=read('scripts/character-builder/artificer-subclass-ui.js');
assert.ok(artificerUi.includes('data-artificer-subclass-pending'),'Pendências de Artífice não chegam à revisão global.');
assert.ok(artificerUi.includes('data-artificer-subclass-combat'),'Ataques de Artífice não chegam ao combate.');
assert.ok(artificerUi.includes('data-artificer-subclass-spells'),'Magias sempre preparadas de Artífice não chegam à ficha.');
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

const artificerCatalog=catalog.subclasses.filter(row=>row.classe==='Artificer'),artificerNames=artificerCatalog.map(row=>row.nome);
assert.equal(artificerNames.length,5,`Esperadas 5 subclasses de Artífice no catálogo atual; encontradas ${artificerNames.length}.`);
const artificerSource=read('scripts/character-builder/artificer-subclass-mechanics.js');
for(const name of artificerNames)assert.ok(artificerSource.includes(`'${name}'`),`Subclasse de Artífice sem implementação explícita: ${name}`);
for(const token of['alwaysPreparedSpellNames','subclassAlwaysPreparedSpells','subclassCompanions','subclassArmorTraining','subclassWeaponTraining'])assert.ok(artificerSource.includes(token),`Contrato mecânico de Artífice ausente: ${token}`);
const{artificerSubclassOutcome,artificerSubclassChoiceDefs,setArtificerSubclassChoice}=await import('../scripts/character-builder/artificer-subclass-mechanics.js');
const makeArtificer=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{}};return{klass:{slug:'artificer',name:'Artífice'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Number(x.nivel),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:10,Destreza:14,Constituição:16,Inteligência:20,Sabedoria:12,Carisma:8},speed:30,tools:[],spellAttack:level>=17?11:level>=13?10:level>=9?9:level>=5?8:7,spellDC:level>=17?19:level>=13?18:level>=9?17:level>=5?16:15,selectedSpells:{leveled:[]}}}
for(const name of artificerNames){const d=makeArtificer(name),row=mechanics.get(fold(name)),out=artificerSubclassOutcome(d);assert.ok(out,`${name}: outcome mecânico ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: nem todas as características de nível 20 ficaram ativas.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length+out.companions.length>0,`${name}: nenhuma regra estruturada foi aplicada.`);assert.ok(Array.isArray(artificerSubclassChoiceDefs(d)),`${name}: definições de escolha inválidas.`);assert.ok(out.alwaysPreparedSpellNames.length>=10,`${name}: progressão de magias sempre preparadas incompleta.`)}
{
 const d=makeArtificer('Alchemist',15),out=artificerSubclassOutcome(d);assert.ok(out.resources.some(x=>x.name==='Elixires Experimentais'&&x.uses===5),'Alchemist nível 15 deve preparar 5 elixires após Descanso Longo.');assert.ok(out.alwaysPreparedSpellNames.includes('Vitriolic Sphere'),'Alchemist 2025 deve usar Vitriolic Sphere na progressão atual.');assert.ok(out.defenses.some(x=>x.name==='Chemical Mastery'),'Chemical Mastery não foi aplicada.')
}
{
 const d=makeArtificer('Armorer',15);let out=artificerSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='armorModel'),'Armorer deve exigir o modelo atual da Armadura Arcana.');setArtificerSubclassChoice(d,'armorModel','Infiltrator');out=artificerSubclassOutcome(d);assert.ok(out.armorTraining.includes('Pesada'),'Armorer não concede treinamento com Armadura Pesada.');assert.ok(out.attacks.some(x=>x.name==='Lightning Launcher'&&x.damage.startsWith('2d6')),'Perfected Armor não atualiza Lightning Launcher para 2d6.');assert.ok(out.resources.some(x=>x.name==='Arcane Flight'&&x.uses===5),'Perfected Armor — Infiltrator não aplica os usos de voo por Inteligência.')
}
{
 const d=makeArtificer('Artillerist',9);setArtificerSubclassChoice(d,'cannonType','Balista de Força');const out=artificerSubclassOutcome(d);assert.ok(out.weaponTraining.includes('Armas marciais à distância'),'Artillerist 2025 não concede armas marciais à distância.');assert.ok(out.attacks.some(x=>x.name==='Balista de Força'&&/^3d8/.test(x.damage)),'Explosive Cannon não aumenta a Balista para 3d8.');assert.ok(out.summary.some(x=>x.name==='Explosive Cannon'&&/3d10/.test(x.value)),'Detonação do Canhão Místico não aplica 3d10 Force.')
}
{
 const d=makeArtificer('Battle Smith',15);state.c.choices.companions={'artificer-steel-defender':{name:'Aço',legs:'Quatro pernas',appearance:'lobo mecânico'}};const out=artificerSubclassOutcome(d),def=out.companions[0];assert.ok(out.weaponTraining.includes('Armas marciais'),'Battle Smith não concede proficiência marcial.');assert.equal(def.ac,19,'Defensor de Aço nível 15 com Int 20 deve ter CA 19.');assert.equal(def.hp,80,'Defensor de Aço nível 15 deve ter 80 PV.');assert.equal(def.name,'Aço','Battle Smith não reutiliza o nome salvo no seletor central de companion.');assert.ok(out.resources.some(x=>x.name==='Arcane Jolt'&&/4d6/.test(x.detail)),'Improved Jolt não atualiza Arcane Jolt para 4d6.');assert.ok(out.summary.some(x=>x.name==='Improved Deflection'&&/1d4/.test(x.value)),'Improved Deflection 2025 deve causar 1d4 + Inteligência.')
}
{
 const d=makeArtificer('Cartographer',15),out=artificerSubclassOutcome(d);assert.ok(out.tools.includes('Suprimentos de Calígrafo')&&out.tools.includes('Ferramentas de Cartógrafo'),'Cartographer não concede as duas proficiências de ferramentas.');assert.ok(out.resources.some(x=>x.name==="Adventurer's Atlas"&&x.uses===6),'Adventurer’s Atlas com Int 20 deve criar mapas para até 6 criaturas.');assert.ok(out.summary.some(x=>x.name==='Safe Haven'&&/30 PV/.test(x.value)),'Safe Haven nível 15 deve deixar o portador com 30 PV.')
}

console.log(`OK: ${mechanics.size}/119 subclasses com mecânica estruturada; ${barbarianNames.length}/10 Bárbaro e ${artificerNames.length}/5 Artífice aplicadas ao criador.`);
