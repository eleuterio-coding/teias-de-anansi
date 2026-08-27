import fs from'node:fs';
import assert from'node:assert/strict';
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const files=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json'];
const mechanics=new Map;for(const file of files)for(const row of read(file).subclasses||[])mechanics.set(fold(row.nome),row);
const catalog=read('dados/subclasses-pdfs.json').subclasses.filter(x=>x.classe==='Druid'),names=catalog.map(x=>x.nome);
assert.equal(names.length,8,`Esperadas 8 subclasses de Druida; encontradas ${names.length}.`);
const expected=['Circle of the Land','Circle of the Moon','Circle of the Sea','Circle of the Stars','Circle of Spores','Circle of Wildfire','Circle of Dreams','Circle of the Shepherd'];
assert.deepEqual([...names].sort(),[...expected].sort(),'Catálogo atual de Druida divergiu da implementação esperada.');
const{state}=await import('../scripts/character-builder/state.js');
const{DRUID_SUBCLASS_NAMES,druidSubclassOutcome,druidSubclassChoiceDefs,setDruidSubclassChoice}=await import('../scripts/character-builder/druid-subclass-mechanics.js');
assert.deepEqual([...DRUID_SUBCLASS_NAMES].sort(),[...expected].sort(),'Módulo de Druida não declara as 8 subclasses.');
state.catalogs.spells=['Guidance','Chill Touch'].map((name,i)=>({id:`spell-${i}`,name,originalName:name,classes:['Druid'],level:0}));
const pb=l=>2+Math.floor((l-1)/4);
function make(name,level=14){const row=mechanics.get(fold(name));assert.ok(row,`Mecânica-fonte ausente: ${name}`);state.c={choices:{subclassMechanics:{},companions:{'druid-wildfire-spirit':{name:'Brasa',appearance:'raposa de fogo'}}}};return{klass:{slug:'druid',name:'Druida'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Number(x.nivel),name:x.nome,text:x.descricao}))},level,pbonus:pb(level),scores:{Força:10,Destreza:14,Constituição:14,Inteligência:12,Sabedoria:20,Carisma:10},speed:30,spellAttack:pb(level)+5,spellDC:8+pb(level)+5}}
for(const name of expected){const d=make(name),out=druidSubclassOutcome(d);assert.ok(out,`${name}: outcome ausente.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length+out.companions.length>0,`${name}: nenhuma mecânica estruturada.`);assert.ok(Array.isArray(druidSubclassChoiceDefs(d)),`${name}: choiceDefs inválido.`)}
{
 const d=make('Circle of the Land');let out=druidSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='landType'),'Land deve cobrar terreno sintonizado.');setDruidSubclassChoice(d,'landType','Tropical');out=druidSubclassOutcome(d);assert.ok(out.alwaysPreparedSpellNames.includes('Insect Plague'),'Land Tropical nível 14 perdeu Insect Plague.');assert.ok(out.defenses.some(x=>x.name==="Nature's Ward"&&/Poison/.test(x.value)),'Nature’s Ward Tropical não aplica resistência a Poison.');assert.ok(out.summary.some(x=>x.name==="Land's Aid"&&/4d6/.test(x.value)),'Land’s Aid nível 14 deve usar 4d6.');assert.ok(out.summary.some(x=>x.name==="Nature's Sanctuary"),'Nature’s Sanctuary ausente.')
}
{
 const out=druidSubclassOutcome(make('Circle of the Moon'));assert.equal(out.wildShape.crMax,4,'Moon nível 14 deve permitir CR 4.');assert.equal(out.wildShape.acFloor,18,'Moon deve usar CA mínima 13 + Sabedoria.');assert.equal(out.wildShape.tempHp,42,'Moon deve conceder 3 × nível em PV temporários.');assert.ok(out.summary.some(x=>x.name==='Lunar Form'&&/2d10/.test(x.value)),'Lunar Form perdeu +2d10 Radiant.')
}
{
 const out=druidSubclassOutcome(make('Circle of the Sea',10));assert.ok(out.summary.some(x=>x.name==='Wrath of the Sea'&&/^5d6/.test(x.value)),'Wrath of the Sea deve usar quantidade de d6 igual à Sabedoria.');assert.equal(out.movementModes.swim,30,'Aquatic Affinity não aplica Swim Speed.');assert.ok(out.defenses.some(x=>x.name==='Stormborn'&&/Cold.*Lightning.*Thunder/.test(x.value)),'Stormborn não aplica as três resistências.')
}
{
 const d=make('Circle of the Stars');setDruidSubclassChoice(d,'starryForm','Arqueiro');setDruidSubclassChoice(d,'cosmicOmen','Weal');const out=druidSubclassOutcome(d);assert.ok(out.resources.some(x=>x.name==='Star Map — Guiding Bolt'&&x.uses===5),'Star Map deve usar modificador de Sabedoria, não PB.');assert.ok(out.resources.some(x=>x.name==='Cosmic Omen'&&x.uses===5),'Cosmic Omen deve usar modificador de Sabedoria.');assert.ok(out.attacks.some(x=>x.name==='Starry Form — Arqueiro'&&/^2d8 \+ 5/.test(x.damage)),'Archer nível 10+ deve causar 2d8 + Sabedoria.');assert.ok(out.defenses.some(x=>x.name==='Full of Stars'),'Full of Stars ausente.')
}
{
 const d=make('Circle of Spores',3),out=druidSubclassOutcome(d);assert.ok(out.features.every(x=>x.level>=3),'Spores legado não pode aparecer no nível 2 do construtor 2024.');assert.ok(out.summary.some(x=>x.name==='Symbiotic Entity'&&/12 PV/.test(x.value)),'Symbiotic Entity deve conceder 4 × nível em PV temporários.');assert.ok(out.summary.some(x=>x.name==='Halo of Spores'&&/1d4/.test(x.value)),'Halo nível 3 deve usar d4.');const max=druidSubclassOutcome(make('Circle of Spores',14));assert.ok(max.defenses.some(x=>x.name==='Fungal Body'&&/Blinded/.test(x.value)&&/Poisoned/.test(x.value)),'Fungal Body incompleto.')
}
{
 const out=druidSubclassOutcome(make('Circle of Wildfire'));const spirit=out.companions[0];assert.equal(spirit.name,'Brasa','Wildfire deve reutilizar nome do companion existente.');assert.equal(spirit.hp,75,'Wildfire Spirit nível 14 deve ter 75 PV.');assert.ok(out.attacks.some(x=>x.name.includes('Flame Seed')&&/1d6 \+ 5/.test(x.damage)),'Flame Seed deve escalar com PB.');assert.ok(out.alwaysPreparedSpellNames.includes('Mass Cure Wounds'),'Wildfire perdeu progressão de Circle Spells.');assert.ok(out.resources.some(x=>x.name==='Blazing Revival'),'Blazing Revival ausente.')
}
{
 const out=druidSubclassOutcome(make('Circle of Dreams'));assert.ok(out.resources.some(x=>x.name==='Balm of the Summer Court'&&x.uses==='14d6'),'Dreams deve ter pool de d6 igual ao nível.');assert.ok(out.resources.some(x=>x.name==='Hidden Paths'&&x.uses===5),'Hidden Paths deve usar Sabedoria.');assert.ok(out.resources.some(x=>x.name==='Walker in Dreams'),'Walker in Dreams ausente.')
}
{
 const d=make('Circle of the Shepherd');setDruidSubclassChoice(d,'spiritTotem','Urso');const out=druidSubclassOutcome(d);assert.deepEqual(out.languages,['Silvestre'],'Speech of the Woods deve conceder Silvestre.');assert.ok(out.summary.some(x=>x.name==='Spirit Totem — Urso'&&/19 PV/.test(x.value)),'Totem do Urso deve conceder 5 + nível em PV temporários.');assert.ok(out.summonBonuses.some(x=>x.name==='Mighty Summoner')&&out.summonBonuses.some(x=>x.name==='Guardian Spirit'),'Bônus de invocação do Shepherd incompletos.');assert.ok(out.resources.some(x=>x.name==='Faithful Summons'),'Faithful Summons ausente.')
}
console.log('Druida validado: 8/8 subclasses com escolhas, progressão e efeitos mecânicos.');
