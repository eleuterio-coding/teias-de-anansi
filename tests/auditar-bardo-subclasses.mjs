import fs from'node:fs';
import assert from'node:assert/strict';
import{state}from'../scripts/character-builder/state.js';
import{BARD_SUBCLASS_NAMES,bardSubclassOutcome,bardSubclassChoiceDefs,setBardSubclassChoice,applyBardSubclassMechanics}from'../scripts/character-builder/bard-subclass-mechanics.js';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const mechanics=new Map();for(const file of FILES){const pkg=JSON.parse(fs.readFileSync(file,'utf8'));for(const row of pkg.subclasses||[])mechanics.set(fold(row.nome),row)}
const catalog=JSON.parse(fs.readFileSync('dados/subclasses-pdfs.json','utf8')),bardNames=catalog.subclasses.filter(x=>x.classe==='Bard').map(x=>x.nome);
assert.equal(bardNames.length,11,`Esperadas 11 subclasses de Bardo; encontradas ${bardNames.length}.`);assert.deepEqual(new Set(bardNames),new Set(BARD_SUBCLASS_NAMES),'Registro explícito de subclasses de Bardo diverge do catálogo.');
state.catalogs.spells=[
 {id:'druidcraft',name:'Druidcraft',originalName:'Druidcraft',level:0,classes:['Druid']},{id:'fire-bolt',name:'Fire Bolt',originalName:'Fire Bolt',level:0,classes:['Sorcerer']},{id:'moonbeam',name:'Moonbeam',originalName:'Moonbeam',level:2,classes:['Druid']},{id:'charm-person',name:'Charm Person',originalName:'Charm Person',level:1,classes:['Bard']},{id:'mirror-image',name:'Mirror Image',originalName:'Mirror Image',level:2,classes:['Wizard']},{id:'command',name:'Command',originalName:'Command',level:1,classes:['Cleric']},{id:'bless',name:'Bless',originalName:'Bless',level:1,classes:['Cleric']},{id:'entangle',name:'Entangle',originalName:'Entangle',level:1,classes:['Druid']},{id:'misty-step',name:'Misty Step',originalName:'Misty Step',level:2,classes:['Wizard']}
];
const pb=l=>2+Math.floor((l-1)/4),make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{equipment:{shield:false},subclassMechanics:{}}};return{klass:{slug:'bard',name:'Bardo'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Number(x.nivel),name:x.nome,text:x.descricao}))},level,pbonus:pb(level),scores:{Força:10,Destreza:16,Constituição:14,Inteligência:12,Sabedoria:12,Carisma:20},speed:30,skills:[],tools:[],spell:{maxLevel:Math.min(9,Math.ceil(level/2))},spellAttack:pb(level)+5,spellDC:8+pb(level)+5,armor:null,weapon:null,wprof:false,attack:null,selectedSpells:{leveled:[]}}};
for(const name of bardNames){const d=make(name),out=bardSubclassOutcome(d),row=mechanics.get(fold(name));assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: características de nível 20 incompletas.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length+out.companions.length>0,`${name}: nenhuma mecânica estruturada aplicada.`);assert.ok(Array.isArray(bardSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const d=make('College of Dance',3);applyBardSubclassMechanics(d);assert.equal(d.ac,18,'Dance deve usar 10 + DEX + CHA sem armadura/escudo.');assert.ok(d.subclassAttacks.some(x=>x.name==='Ataque Desarmado'&&/1d6/.test(x.damage)),'Dance não aplica dado de Bardic Inspiration ao ataque desarmado.')
}
{
 const d=make('College of Lore',6);let out=bardSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='bonusSkills')&&out.pending.some(x=>x.id==='magicalDiscovery1'),'Lore deve cobrar perícias e Descobertas Mágicas.');setBardSubclassChoice(d,'bonusSkills',['Arcanismo','História','Investigação']);setBardSubclassChoice(d,'magicalDiscovery1','bless');setBardSubclassChoice(d,'magicalDiscovery2','entangle');out=bardSubclassOutcome(d);assert.equal(out.skills.length,3,'Lore não concede 3 perícias.');assert.ok(out.alwaysPreparedSpellNames.includes('Bless')&&out.alwaysPreparedSpellNames.includes('Entangle'),'Magical Discoveries não ficam sempre preparadas.')
}
{
 const d=make('College of Valor',6),out=bardSubclassOutcome(d);assert.ok(out.armorTraining.includes('Média')&&out.weaponTraining.includes('Armas marciais'),'Valor não aplica treinamento marcial/armadura.');assert.ok(out.summary.some(x=>x.name==='Extra Attack'),'Valor não aplica Extra Attack.')
}
{
 const d=make('College of Wands',15);let out=bardSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='bonusCantrip'),'Wands deve exigir o cantrip bônus.');setBardSubclassChoice(d,'bonusCantrip','fire-bolt');out=bardSubclassOutcome(d);assert.equal(out.bonusCantrips[0]?.name,'Fire Bolt','Wands não concede o cantrip escolhido.');assert.ok(out.summary.some(x=>x.name==='At Your Fingertips'&&/8d6/.test(x.value)),'Wands nível 15 deve chegar a 8d6.')
}
{
 const d=make('College of the Moon',6);setBardSubclassChoice(d,'primalSkill','Percepção');setBardSubclassChoice(d,'primalCantrip','druidcraft');const out=bardSubclassOutcome(d);assert.ok(out.languages.includes('Druídico')&&out.skills.includes('Percepção'),'Moon não aplica idioma/perícia de Primal Lore.');assert.equal(out.bonusCantrips[0]?.name,'Druidcraft','Moon não concede cantrip de Druida.');assert.ok(out.alwaysPreparedSpellNames.includes('Moonbeam'),'Moonbeam não fica sempre preparada no nível 6.')
}
{
 const d=make('College of Creation',14),out=bardSubclassOutcome(d);assert.equal(out.companions[0]?.hp,80,'Dancing Item nível 14 deve ter 10 + 5 × nível de Bardo PV.');assert.ok(out.attacks.some(x=>x.name.includes('Dancing Item')),'Dancing Item não chega ao combate.');assert.ok(out.summary.some(x=>x.name==='Creative Crescendo'),'Creation nível 14 não aplica Creative Crescendo.')
}
{
 const d=make('College of Eloquence',14),out=bardSubclassOutcome(d);assert.equal(out.skillFloors.Enganação,10);assert.equal(out.skillFloors.Persuasão,10);assert.ok(out.resources.some(x=>x.name==='Infectious Inspiration'&&x.uses===5),'Eloquence não aplica Infectious Inspiration por Carisma.')
}
{
 const d=make('College of Swords',6);let out=bardSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='fightingStyle'),'Swords deve exigir Estilo de Luta.');setBardSubclassChoice(d,'fightingStyle','Dueling');out=bardSubclassOutcome(d);assert.ok(out.armorTraining.includes('Média')&&out.weaponTraining.includes('Scimitar'),'Swords não aplica proficiências.');assert.ok(out.summary.some(x=>x.name==='Extra Attack'),'Swords não aplica Extra Attack.')
}
{
 const d=make('College of Whispers',15),out=bardSubclassOutcome(d);assert.ok(out.summary.some(x=>x.name==='Psychic Blades'&&/8d6/.test(x.value)),'Whispers nível 15 deve aplicar 8d6 Psychic Blades.')
}
{
 const d=make('College of Mixology',14);setBardSubclassChoice(d,'ingredient1','Dwarven whiskey');setBardSubclassChoice(d,'ingredient2','Feyberry syrup');setBardSubclassChoice(d,'garnish','Celestial feather');const out=bardSubclassOutcome(d);assert.ok(out.tools.includes("Brewer's Supplies"),'Mixology não concede brewer’s supplies.');assert.ok(out.resources.some(x=>x.name==='Pick Your Poison'&&x.uses===5),'Pick Your Poison deve usar modificador de Carisma.');assert.ok(out.summary.some(x=>x.name.includes('Celestial feather')&&/Voo/.test(x.value)),'Garnish não aplica o efeito selecionado.')
}
console.log(`OK: ${bardNames.length}/11 subclasses de Bardo aplicadas mecanicamente ao criador.`);
