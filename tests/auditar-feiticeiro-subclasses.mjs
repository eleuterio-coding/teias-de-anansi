import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),names=catalog.subclasses.filter(x=>x.classe==='Sorcerer').map(x=>x.nome),expected=['Aberrant Sorcery','Clockwork Sorcery','Draconic Sorcery','Wild Magic Sorcery','Nemesis Sorcery','Spellfire Sorcery','Divine Soul','Shadow Magic','Storm Sorcery'];
assert.equal(names.length,9,`Esperadas 9 subclasses de Feiticeiro; encontradas ${names.length}.`);assert.deepEqual(new Set(names),new Set(expected));
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);for(const name of names)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);
const source=fs.readFileSync('scripts/character-builder/sorcerer-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/sorcerer-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8'),langs=fs.readFileSync('scripts/character-builder/language-mechanics.js','utf8'),access=fs.readFileSync('scripts/character-builder/sorcerer-spell-access.js','utf8'),progress=fs.readFileSync('scripts/character-builder/spell-progression-rules.js','utf8');
for(const name of names)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['sorcererSubclassChoiceDefs','sorcererSubclassOutcome','sorceryPointsMax','subclassSorceryTechniques','subclassRandomTables','subclassSpellDamageBonuses'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-sorcerer-subclass-pending')&&ui.includes('data-sorcerer-subclass-combat')&&ui.includes('data-sorcerer-subclass-spells'),'UI não integra pendências, combate e magias.');
assert.ok(rules.includes('applySorcererSubclassMechanics(d)')&&rules.includes('syncSorcererSpellAccess()'),'derive/selected não integram Feiticeiro e Divine Soul.');assert.ok(classUi.includes('initSorcererSubclassUi'),'Construtor não inicializa Feiticeiro.');assert.ok(langs.includes('subclass:storm-sorcery:wind-speaker'),'Storm Sorcery não integra Primordial.');assert.ok(access.includes('_divineSoulSorcererGrant'),'Acesso de Divine Soul não é reversível.');assert.ok(progress.includes("spell?._divineSoulSorcererGrant&&num(classLevel)<3"),'Divine Soul não está restrita ao nível 3+ na progressão.');

const{state}=await import('../scripts/character-builder/state.js');
const{sorcererSubclassOutcome,sorcererSubclassChoiceDefs,setSorcererSubclassChoice,applySorcererSubclassMechanics}=await import('../scripts/character-builder/sorcerer-subclass-mechanics.js');
const{syncSorcererSpellAccess}=await import('../scripts/character-builder/sorcerer-spell-access.js');
const{spellProgressionCandidates}=await import('../scripts/character-builder/spell-progression-rules.js');
const spellDefs=[
 ['Mind Sliver',0,['Sorcerer']],['Arms of Hadar',1,['Sorcerer']],['Dissonant Whispers',1,['Sorcerer']],['Calm Emotions',2,['Sorcerer']],['Detect Thoughts',2,['Sorcerer']],['Hunger of Hadar',3,['Sorcerer']],['Sending',3,['Sorcerer']],["Evard's Black Tentacles",4,['Sorcerer']],['Summon Aberration',4,['Sorcerer']],["Rary's Telepathic Bond",5,['Sorcerer']],['Telekinesis',5,['Sorcerer']],
 ['Alarm',1,['Wizard']],['Protection from Evil and Good',1,['Cleric']],['Aid',2,['Cleric']],['Lesser Restoration',2,['Cleric']],['Dispel Magic',3,['Sorcerer']],['Protection from Energy',3,['Sorcerer']],['Freedom of Movement',4,['Cleric']],['Summon Construct',4,['Wizard']],['Greater Restoration',5,['Cleric']],['Wall of Force',5,['Wizard']],
 ['Alter Self',2,['Sorcerer']],['Chromatic Orb',1,['Sorcerer']],['Command',1,['Cleric']],["Dragon's Breath",2,['Sorcerer']],['Fear',3,['Sorcerer']],['Fly',3,['Sorcerer']],['Arcane Eye',4,['Wizard']],['Charm Monster',4,['Sorcerer']],['Legend Lore',5,['Bard']],['Summon Dragon',5,['Sorcerer']],
 ['Compelled Duel',1,['Paladin']],['Mirror Image',2,['Sorcerer']],['See Invisibility',2,['Sorcerer']],['Shield',1,['Sorcerer']],['Counterspell',3,['Sorcerer']],['Slow',3,['Sorcerer']],['Fire Shield',4,['Wizard']],["Otiluke's Resilient Sphere",4,['Wizard']],['Circle of Power',5,['Paladin']],['Mislead',5,['Bard']],
 ['Cure Wounds',1,['Cleric']],['Guiding Bolt',1,['Cleric']],['Scorching Ray',2,['Sorcerer']],['Aura of Vitality',3,['Cleric']],['Wall of Fire',4,['Sorcerer']],['Flame Strike',5,['Cleric']],['Inflict Wounds',1,['Cleric']],['Bless',1,['Cleric']],['Bane',1,['Cleric']],['Darkness',2,['Sorcerer']],['Cleric Choice',1,['Cleric']],['Sorcerer Choice',1,['Sorcerer']]
];
const spells=spellDefs.map(([name,level,classes],i)=>({id:`s${i}`,name,originalName:name,level,classes:[...classes]}));state.catalogs={...(state.catalogs||{}),spells};
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={refs:{},choices:{subclassMechanics:{},equipment:{shield:false},class:{level},spells:{cantrips:[],leveled:[],arcanum:{}}}};return{klass:{slug:'sorcerer',name:'Feiticeiro'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Math.max(3,Number(x.nivel)),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:10,Destreza:16,Constituição:14,Inteligência:12,Sabedoria:12,Carisma:20},speed:30,initiative:3,hp:120,ac:13,armor:null,spell:{maxLevel:9},spellDC:19,spellAttack:11,subclassResources:[],subclassDefenses:[]}}
for(const name of names){const d=make(name),out=sorcererSubclassOutcome(d),row=mechanics.get(fold(name));assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.equal(out.sorceryPointsMax,20,`${name}: Sorcery Points máximos de nível 20 devem ser 20.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.sorceryTechniques.length+out.randomTables.length>0,`${name}: nenhuma regra estruturada.`);assert.ok(Array.isArray(sorcererSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const d=make('Aberrant Sorcery'),defs=sorcererSubclassChoiceDefs(d),rev=defs.find(x=>x.id==='revelations');assert.equal(rev.required,false);setSorcererSubclassChoice(d,'revelations',['Flight','Aquatic Adaptation']);const out=sorcererSubclassOutcome(d);assert.equal(out.movementModes.fly.value,30);assert.equal(out.movementModes.swim.value,60);assert.ok(out.defenses.some(x=>x.name==='Psychic Defenses'));assert.ok(out.sorceryTechniques.some(x=>x.name==='Psionic Sorcery'&&/custo especificado/.test(x.effect)));assert.ok(out.bonusCantrips.some(x=>x.name==='Mind Sliver'))
}
{
 const out=sorcererSubclassOutcome(make('Clockwork Sorcery'));assert.ok(out.resources.some(x=>x.name==='Restore Balance'&&x.uses===5));assert.ok(out.conditionalRollFloors.some(x=>x.name==='Trance of Order'&&x.minimum===10));assert.ok(out.resources.some(x=>x.name==='Clockwork Cavalcade'&&/7 SP/.test(x.detail)))
}
{
 const d=make('Draconic Sorcery'),def=sorcererSubclassChoiceDefs(d).find(x=>x.id==='elementalAffinity');assert.ok(def.required);setSorcererSubclassChoice(d,'elementalAffinity','Fire');let out=sorcererSubclassOutcome(d);assert.equal(out.hpBonus,20);assert.equal(out.acFormula.value,18);assert.ok(out.defenses.some(x=>/Fire/.test(x.value)));assert.ok(out.spellDamageBonuses.some(x=>x.type==='Fire'&&x.bonus===5));assert.equal(out.movementModes.fly.value,60);applySorcererSubclassMechanics(d);assert.equal(d.hp,140);assert.equal(d.ac,18)
}
{
 const out=sorcererSubclassOutcome(make('Wild Magic Sorcery'));assert.ok(out.randomTables.some(x=>/1d20; em 20/.test(x.roll)));assert.ok(out.sorceryTechniques.some(x=>x.name==='Bend Luck'&&x.cost==='1 SP'));assert.ok(out.resources.some(x=>x.name==='Tamed Surge'))
}
{
 const out=sorcererSubclassOutcome(make('Nemesis Sorcery'));assert.ok(out.resources.some(x=>x.name==='Always Ready'&&/4 SP/.test(x.detail)));assert.ok(out.summary.some(x=>x.name==='Iniciativa opcional'&&x.value==='31'));assert.ok(out.resources.some(x=>x.name==='Mindset of Perfect Prediction'&&/CD 19/.test(x.detail)))
}
{
 const out=sorcererSubclassOutcome(make('Spellfire Sorcery'));assert.ok(out.alwaysPreparedSpells.some(x=>x.name==='Counterspell'));assert.ok(out.summary.some(x=>x.name==='Honed Spellfire'&&/1d8/.test(x.value)));assert.equal(out.movementModes.fly.value,60);assert.ok(out.defenses.some(x=>x.name==='Spell Avoidance'))
}
{
 const d=make('Divine Soul'),aff=sorcererSubclassChoiceDefs(d).find(x=>x.id==='divineAffinity');assert.ok(aff.required);setSorcererSubclassChoice(d,'divineAffinity','Good');let out=sorcererSubclassOutcome(d);assert.ok(out.alwaysPreparedSpells.some(x=>x.name==='Cure Wounds'));const bonus=sorcererSubclassChoiceDefs(d).find(x=>x.id==='divineBonusSpell'),cleric=bonus.options.find(x=>/Cleric Choice/.test(x.label));setSorcererSubclassChoice(d,'divineBonusSpell',cleric.value);out=sorcererSubclassOutcome(d);assert.ok(out.alwaysPreparedSpells.some(x=>x.name==='Cleric Choice'));assert.ok(out.summary.some(x=>x.name==='Divine Magic'))
 const klass={id:'sorc',slug:'sorcerer',name:'Feiticeiro',levels:[{level:1,spellcasting:{cantrips_known:4,spells_prepared:2,spell_slots_level_1:2}},{level:3,spellcasting:{cantrips_known:4,spells_prepared:6,spell_slots_level_1:4,spell_slots_level_2:2}}]},sub={id:'divine',name:'Divine Soul',mechanics:{name:'Divine Soul'}};state.catalogs.classes=[klass];state.catalogs.subclasses=[sub];state.c.refs={class:'sorc',subclass:'divine'};syncSorcererSpellAccess();const choice=spells.find(x=>x.name==='Cleric Choice');assert.ok(choice.classes.includes('Sorcerer'));assert.ok(!spellProgressionCandidates(klass,1,{kind:'leveled'}).some(x=>x.id===choice.id),'Cleric spell não pode entrar retroativamente no nível 1.');assert.ok(spellProgressionCandidates(klass,3,{kind:'leveled'}).some(x=>x.id===choice.id),'Cleric spell deve entrar no nível 3+.');state.c.refs.subclass=null;syncSorcererSpellAccess();assert.ok(!choice.classes.includes('Sorcerer'),'Grant de Divine Soul deve ser removido ao trocar a subclasse.')
}
{
 const out=sorcererSubclassOutcome(make('Shadow Magic'));assert.ok(out.senses.some(x=>x.name==='Darkvision'&&x.range===120));assert.ok(out.sorceryTechniques.some(x=>x.name==='Hound of Ill Omen'&&x.cost==='3 SP'));assert.ok(out.defenses.some(x=>x.name==='Umbral Form'&&/Force/.test(x.value)&&/Radiant/.test(x.value)))
}
{
 const out=sorcererSubclassOutcome(make('Storm Sorcery'));assert.ok(out.languages.includes('Primordial'));assert.ok(out.defenses.some(x=>x.name==='Wind Soul'&&/Imunidade/.test(x.value)));assert.equal(out.movementModes.fly.value,60);assert.ok(out.resources.some(x=>x.name.includes('compartilhar voo')&&x.uses===1&&/8 criaturas/.test(x.detail)))
}
console.log('Feiticeiro validado: 9/9 subclasses com Sorcery Points, magias, defesas, mobilidade e integrações compartilhadas.');
