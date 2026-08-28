import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),names=catalog.subclasses.filter(x=>x.classe==='Warlock').map(x=>x.nome);
assert.equal(names.length,8,`Esperadas 8 subclasses de Bruxo; encontradas ${names.length}.`);
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);for(const name of names)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);
const source=fs.readFileSync('scripts/character-builder/warlock-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/warlock-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8');
for(const name of names)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['WARLOCK_SUBCLASS_NAMES','warlockSubclassChoiceDefs','warlockSubclassOutcome','subclassAlwaysPreparedSpells','subclassExpandedSpellOptions','subclassShieldTraining','subclassCompanions'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-warlock-subclass-pending')&&ui.includes('data-warlock-subclass-combat')&&ui.includes('data-warlock-subclass-spells'),'UI não integra pendências, combate e magias.');
assert.ok(rules.includes('applyWarlockSubclassMechanics(d)'),'derive() não aplica Bruxo.');assert.ok(classUi.includes('initWarlockSubclassUi'),'Construtor não inicializa Bruxo.');assert.ok(rules.includes("k?.slug==='warlock'&&category==='media'"),'Hexblade não libera armadura média no validador central.');assert.ok(rules.includes("k?.slug==='warlock')return name==='the hexblade'"),'Hexblade não libera escudo no validador central.');

const{state}=await import('../scripts/character-builder/state.js');
const{WARLOCK_SUBCLASS_NAMES,warlockSubclassOutcome,warlockSubclassChoiceDefs,setWarlockSubclassChoice,applyWarlockSubclassMechanics}=await import('../scripts/character-builder/warlock-subclass-mechanics.js');
assert.deepEqual(new Set(WARLOCK_SUBCLASS_NAMES),new Set(names),'Lista canônica de Bruxo diverge do catálogo.');
const spellNames=[
 'Calm Emotions','Faerie Fire','Misty Step','Phantasmal Force','Sleep','Blink','Plant Growth','Dominate Beast','Greater Invisibility','Dominate Person','Seeming',
 'Aid','Cure Wounds','Guiding Bolt','Lesser Restoration','Light','Sacred Flame','Daylight','Revivify','Guardian of Faith','Wall of Fire','Greater Restoration','Summon Celestial',
 'Burning Hands','Command','Scorching Ray','Suggestion','Fireball','Stinking Cloud','Fire Shield','Geas','Insect Plague',
 'Detect Thoughts','Dissonant Whispers',"Tasha's Hideous Laughter",'Clairvoyance','Hunger of Hadar','Confusion','Summon Aberration','Modify Memory','Telekinesis','Hex',
 'Absorb Elements','Earthbind','Earth Tremor','Spike Growth','Magic Circle','Slow','Stone Shape','Stoneskin',"Bigby's Hand",'Wall of Stone','Meld into Stone',
 'Create or Destroy Water','Thunderwave','Gust of Wind','Silence','Lightning Bolt','Sleet Storm','Control Water','Summon Elemental',"Evard's Black Tentacles",'Cone of Cold',
 'Shield','Wrathful Smite','Blur','Branding Smite','Elemental Weapon','Phantasmal Killer','Staggering Smite','Banishing Smite',
 'Detect Evil and Good','Create Food and Water','Creation','Sanctuary','Wind Wall','Flame Strike','Fog Cloud','Wish'
];
state.catalogs={...(state.catalogs||{}),spells:[...new Set(spellNames)].map((name,i)=>({id:`s${i}`,name,originalName:name,level:1,classes:['Warlock']}))};
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{subclassMechanics:{},equipment:{shield:false}}};return{klass:{slug:'warlock',name:'Bruxo'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Math.max(3,Number(x.nivel)),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:10,Destreza:16,Constituição:14,Inteligência:12,Sabedoria:12,Carisma:20},speed:30,ac:13,spellDC:19,spellAttack:11,skills:[],expertiseSkills:[],tools:[],subclassResources:[],subclassDefenses:[],subclassAttacks:[],subclassAlwaysPreparedSpells:[],subclassExpandedSpellOptions:[],subclassArmorTraining:[],subclassWeaponTraining:[],subclassMovementModes:{},subclassCompanions:[]}}
for(const name of names){const d=make(name),out=warlockSubclassOutcome(d),row=mechanics.get(fold(name));assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length>0,`${name}: nenhuma regra estruturada.`);assert.ok(Array.isArray(warlockSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const out=warlockSubclassOutcome(make('Archfey Patron'));assert.ok(out.resources.some(x=>x.name==='Steps of the Fey'&&x.uses===5&&/CD 19/.test(x.detail)));assert.ok(out.summary.some(x=>x.name==='Dreadful Step'&&/2d10 Psychic/.test(x.value)));assert.ok(out.defenses.some(x=>x.name==='Beguiling Defenses'&&/Imunidade a Charmed/.test(x.value)));assert.equal(out.alwaysPreparedSpells.length,11)
}
{
 const out=warlockSubclassOutcome(make('Celestial Patron'));assert.ok(out.resources.some(x=>x.name==='Healing Light'&&x.uses==='21d6'&&/5d6/.test(x.detail)));assert.ok(out.summary.some(x=>x.name==='Celestial Resilience — você'&&x.value==='25 PV temporários'));assert.ok(out.summary.some(x=>x.name==='Celestial Resilience — aliados'&&x.value==='15 PV temporários'));assert.ok(out.resources.some(x=>x.name==='Searing Vengeance'&&/2d8 \+ 5 Radiant/.test(x.detail)));assert.equal(out.alwaysPreparedSpells.length,12)
}
{
 const d=make('Fiend Patron');setWarlockSubclassChoice(d,'fiendResistance','Fire');const out=warlockSubclassOutcome(d);assert.ok(out.summary.some(x=>x.name==="Dark One's Blessing"&&x.value==='25 PV temporários'));assert.ok(out.resources.some(x=>x.name==="Dark One's Own Luck"&&x.uses===5));assert.ok(out.defenses.some(x=>x.name==='Fiendish Resilience'&&/Fire/.test(x.value)));assert.ok(out.resources.some(x=>x.name==='Hurl Through Hell'&&/8d10 Psychic/.test(x.detail)));assert.equal(out.alwaysPreparedSpells.length,10)
}
{
 const out=warlockSubclassOutcome(make('Great Old One Patron'));assert.ok(out.summary.some(x=>x.name==='Awakened Mind'&&/20 min/.test(x.value)&&/5 milha/.test(x.scope)));assert.ok(out.resources.some(x=>x.name==='Clairvoyant Combatant'&&/CD 19/.test(x.detail)));assert.ok(out.alwaysPreparedSpells.some(x=>x.name==='Hex'));assert.ok(out.defenses.some(x=>x.name==='Thought Shield'&&/Psychic/.test(x.value)));const c=out.companions.find(x=>x.name==='Aberração de Create Thrall');assert.ok(c&&c.temporaryHp===25&&c.attackBonus===11)
}
{
 const out=warlockSubclassOutcome(make('Stone Sovereign Patron'));assert.ok(out.resources.some(x=>x.name==='Eternity in Stone'&&/1d10 \+ 20/.test(x.detail)));assert.ok(out.resources.some(x=>x.name==='Form of Stone'&&/Bludgeoning\/Piercing\/Slashing/.test(x.detail)));assert.ok(out.alwaysPreparedSpells.some(x=>x.name==='Meld into Stone'));const c=out.companions.find(x=>x.name==='Stone Servant');assert.ok(c&&c.concentration===false&&/6º/.test(c.spell))
}
{
 const out=warlockSubclassOutcome(make('The Fathomless'));assert.equal(out.expandedSpellOptions.length,10);assert.ok(!out.alwaysPreparedSpells.some(x=>x.name==='Thunderwave'),'Lista expandida de Fathomless não deve ser concedida automaticamente.');assert.ok(out.resources.some(x=>x.name==='Tentacle of the Deeps'&&x.uses===6));assert.ok(out.attacks.some(x=>x.name==='Tentacle of the Deeps'&&x.attackBonus===11&&x.damage==='2d8 Cold'));assert.equal(out.movementModes.swim.value,40);assert.ok(out.summary.some(x=>x.name==='Guardian Coil'&&/2d8/.test(x.value)));assert.ok(out.alwaysPreparedSpells.some(x=>x.name==="Evard's Black Tentacles"))
}
{
 const d=make('The Genie');let out=warlockSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='genieKind'));setWarlockSubclassChoice(d,'genieKind','Efreeti');out=warlockSubclassOutcome(d);assert.equal(out.pending.length,0);assert.ok(out.summary.some(x=>x.name==="Genie's Wrath"&&x.value==='+6 Fire'));assert.ok(out.defenses.some(x=>x.name==='Elemental Gift'&&/Fire/.test(x.value)));assert.ok(out.resources.some(x=>x.name==='Elemental Gift — voo'&&x.uses===6));assert.equal(out.movementModes.genieFly.value,30);assert.ok(out.expandedSpellOptions.some(x=>x.name==='Fireball')&&out.expandedSpellOptions.some(x=>x.name==='Wish'));assert.ok(!out.alwaysPreparedSpells.some(x=>x.name==='Fireball'),'Lista expandida de Genie não deve ser automática.')
}
{
 const d=make('The Hexblade');d.weapon={nome:'Longsword',nome_original:'Longsword',categoria:'Marcial corpo a corpo'};d.wAbility='Força';d.wprof=false;d.attack=0;state.c.choices.equipment.shield=true;setWarlockSubclassChoice(d,'hexWeapon','Longsword');applyWarlockSubclassMechanics(d);const out=d.subclassMechanics;assert.ok(out.armorTraining.includes('Média')&&out.weaponTraining.includes('Armas marciais')&&out.shieldTraining);assert.ok(out.resources.some(x=>x.name==="Hexblade's Curse"&&/\+6 dano/.test(x.detail)&&/19–20/.test(x.detail)));assert.equal(d.ac,15,'Escudo do Hexblade deve somar +2 à CA derivada.');assert.equal(d.wprof,true);assert.equal(d.wAbility,'Carisma');assert.equal(d.attack,11,'Hex Warrior deve usar CAR 5 + PB 6.');assert.equal(out.expandedSpellOptions.length,10);assert.equal(out.alwaysPreparedSpells.length,0,'Expanded Spell List do Hexblade não deve ser sempre preparada.')
}
console.log('Bruxo validado: 8/8 subclasses com magias de patrono, listas expandidas legadas, recursos, defesas, companheiros e Hexblade mecânico.');