import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),names=catalog.subclasses.filter(x=>x.classe==='Ranger').map(x=>x.nome);
assert.equal(names.length,9,`Esperadas 9 subclasses de Patrulheiro; encontradas ${names.length}.`);
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);for(const name of names)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);
const source=fs.readFileSync('scripts/character-builder/ranger-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/ranger-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8');
for(const name of names)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['rangerSubclassChoiceDefs','rangerSubclassOutcome','subclassAlwaysPreparedSpells','subclassCompanions','Hunter\'s Prey','Dreadful Strike','Ley Line Tracker','Frozen Haunt'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-ranger-subclass-pending')&&ui.includes('data-ranger-subclass-combat')&&ui.includes('data-ranger-subclass-spells'),'UI não integra pendências, combate e magias.');
assert.ok(rules.includes('applyRangerSubclassMechanics(d)')&&rules.includes('applyRangerSubclassRuleDetails(d)'),'derive() não aplica Patrulheiro.');assert.ok(classUi.includes('initRangerSubclassUi'),'Construtor não inicializa Patrulheiro.');

const{state}=await import('../scripts/character-builder/state.js');
const{rangerSubclassOutcome,rangerSubclassChoiceDefs,setRangerSubclassChoice}=await import('../scripts/character-builder/ranger-subclass-mechanics.js');
const spellNames=['Charm Person','Misty Step','Summon Fey','Dimension Door','Mislead','Disguise Self','Rope Trick','Fear','Greater Invisibility','Seeming','Alarm','Hold Person','Clairvoyance','Locate Creature','Scrying','Ice Knife','Remove Curse','Ice Storm','Cone of Cold','Mage Hand','Faerie Fire','Web','Gaseous Form','Arcane Eye','Insect Plague','Protection from Evil and Good','Haste','Banishment','Teleportation Circle','Zone of Truth','Magic Circle','Hold Monster'];
state.catalogs={...(state.catalogs||{}),spells:spellNames.map((name,i)=>({id:`s${i}`,name,originalName:name,level:name==='Mage Hand'?0:1,classes:['Ranger']}))};
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{subclassMechanics:{},companions:{},equipment:{shield:false}}};return{klass:{slug:'ranger',name:'Patrulheiro'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Math.max(3,Number(x.nivel)),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:12,Destreza:20,Constituição:14,Inteligência:10,Sabedoria:18,Carisma:10},speed:40,skills:[],saveProficiencies:['Força','Destreza'],spellAttack:(level>=17?6:2)+4,spellDC:8+(level>=17?6:2)+4}}
for(const name of names){const d=make(name),out=rangerSubclassOutcome(d),row=mechanics.get(fold(name));assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length+out.companions.length>0,`${name}: nenhuma regra estruturada.`);assert.ok(Array.isArray(rangerSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const d=make('Beast Master');let out=rangerSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='primalCompanionForm'),'Beast Master deve exigir o bloco do companheiro.');state.c.choices.companions['ranger-primal-companion']={form:'Fera da Terra',animal:'lobo',name:'Brasa'};out=rangerSubclassOutcome(d);assert.equal(out.pending.length,0);const c=out.companions[0];assert.equal(c.ac,17);assert.equal(c.hp,105);assert.equal(c.attackBonus,10);assert.equal(c.attack.damage,'1d8 + 6');assert.ok(out.summary.some(x=>x.name==='Bestial Fury — Hunter\'s Mark'&&/1d10 Force/.test(x.value)),'Bestial Fury deve acompanhar Foe Slayer no nível 20.')
}
{
 const d=make('Fey Wanderer');let out=rangerSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='socialSkill'));setRangerSubclassChoice(d,'socialSkill','Persuasão');out=rangerSubclassOutcome(d);assert.ok(out.skills.includes('Persuasão'));assert.ok(out.summary.some(x=>x.name==='Dreadful Strikes'&&x.value==='1d6 Psychic'));assert.equal(out.alwaysPreparedSpellNames.length,5);assert.ok(out.resources.some(x=>x.name==='Misty Wanderer'&&x.uses===4))
}
{
 const out=rangerSubclassOutcome(make('Gloom Stalker'));assert.ok(out.resources.some(x=>x.name==='Dreadful Strike'&&x.uses===4&&/2d8/.test(x.detail)));assert.ok(out.senses.some(x=>x.name==='Darkvision'&&x.range===60));assert.ok(out.saveProficiencies.includes('Sabedoria'));assert.ok(out.defenses.some(x=>x.name==='Shadowy Dodge'&&/30 ft/.test(x.value)))
}
{
 const d=make('Hunter');let out=rangerSubclassOutcome(d);assert.equal(out.pending.length,2);setRangerSubclassChoice(d,'huntersPrey','Colossus Slayer');setRangerSubclassChoice(d,'defensiveTactic','Multiattack Defense');out=rangerSubclassOutcome(d);assert.equal(out.pending.length,0);assert.ok(out.summary.some(x=>x.name==='Colossus Slayer'&&/1d8/.test(x.value)));assert.ok(out.defenses.some(x=>x.name==='Multiattack Defense'));assert.ok(out.summary.some(x=>x.name==="Superior Hunter's Prey"))
}
{
 const out=rangerSubclassOutcome(make('Bloodhound'));assert.equal(out.alwaysPreparedSpellNames.length,5);assert.ok(out.resources.some(x=>x.name==='Ley Line Tracker'));assert.ok(out.summary.some(x=>x.name==='Eyes on the Prize'));assert.ok(out.resources.some(x=>x.name==='Nowhere to Hide'))
}
{
 const out=rangerSubclassOutcome(make('Winter Walker'));assert.ok(out.defenses.some(x=>x.name==='Frost Resistance'));assert.ok(out.summary.some(x=>x.name==="Hunter's Rime"&&/1d10 \+ 20/.test(x.value)));assert.ok(out.resources.some(x=>x.name==='Chilling Retribution'&&x.uses===4));assert.ok(out.defenses.some(x=>x.name==='Frozen Haunt'))
}
{
 const out=rangerSubclassOutcome(make('Swarmkeeper'));assert.ok(out.bonusCantrips.some(x=>x.name==='Mage Hand'));assert.ok(out.summary.some(x=>x.name==='Gathered Swarm'&&/1d8/.test(x.value)));assert.ok(out.resources.some(x=>x.name==='Writhing Tide'&&x.uses===6));assert.equal(out.movementModes.swarmFly.value,10)
}
{
 const out=rangerSubclassOutcome(make('Horizon Walker'));assert.ok(out.summary.some(x=>x.name==='Planar Warrior'&&/2d8 Force/.test(x.value)));assert.ok(out.summary.some(x=>x.name==='Distant Strike'&&/10 ft/.test(x.value)));assert.ok(out.defenses.some(x=>x.name==='Spectral Defense'))
}
{
 const out=rangerSubclassOutcome(make('Monster Slayer'));assert.ok(out.resources.some(x=>x.name==="Hunter's Sense"&&x.uses===4));assert.ok(out.summary.some(x=>x.name==="Slayer's Prey"&&/1d6/.test(x.value)));assert.ok(out.resources.some(x=>x.name==="Magic-User's Nemesis"));assert.ok(out.summary.some(x=>x.name==="Slayer's Counter"))
}
console.log('Patrulheiro validado: 9/9 subclasses com companheiro, escolhas, magias, ataques, mobilidade e defesas.');
