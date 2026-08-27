import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),monkNames=catalog.subclasses.filter(x=>x.classe==='Monk').map(x=>x.nome);
assert.equal(monkNames.length,9,`Esperadas 9 subclasses de Monge; encontradas ${monkNames.length}.`);
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);for(const name of monkNames)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);
const source=fs.readFileSync('scripts/character-builder/monk-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/monk-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8');
for(const name of monkNames)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['monkSubclassChoiceDefs','monkSubclassOutcome','subclassFocusTechniques','focusDC','martialArtsDie','Elemental Burst','Quivering Palm','Soulful Craft'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-monk-subclass-pending')&&ui.includes('data-monk-subclass-combat')&&ui.includes('data-monk-subclass-spells'),'Interface de Monge não integra pendências, combate e magia.');
assert.ok(rules.includes('applyMonkSubclassMechanics(d)'),'derive() não aplica subclasses de Monge.');
assert.ok(classUi.includes('initMonkSubclassUi'),'Construtor não inicializa UI de Monge.');

const{state}=await import('../scripts/character-builder/state.js');
const{monkSubclassOutcome,monkSubclassChoiceDefs,setMonkSubclassChoice}=await import('../scripts/character-builder/monk-subclass-mechanics.js');
state.catalogs={...(state.catalogs||{}),spells:[
 {id:'minor-illusion',name:'Minor Illusion',originalName:'Minor Illusion',level:0,classes:['Wizard']},
 {id:'elementalism',name:'Elementalism',originalName:'Elementalism',level:0,classes:['Druid']}
],weapons:[
 {id:'longsword',nome:'Espada Longa',nome_original:'Longsword',categoria:'Marcial corpo a corpo',dano:'1d8 cortante',propriedades:['Versatile (1d10)']},
 {id:'rapier',nome:'Rapieira',nome_original:'Rapier',categoria:'Marcial corpo a corpo',dano:'1d8 perfurante',propriedades:['Finesse']},
 {id:'greatsword',nome:'Espada Grande',nome_original:'Greatsword',categoria:'Marcial corpo a corpo',dano:'2d6 cortante',propriedades:['Heavy','Two-Handed']},
 {id:'longbow',nome:'Arco Longo',nome_original:'Longbow',categoria:'Marcial à distância',dano:'1d8 perfurante',propriedades:['Ammunition','Heavy','Two-Handed']},
 {id:'shortbow',nome:'Arco Curto',nome_original:'Shortbow',categoria:'Simples à distância',dano:'1d6 perfurante',propriedades:['Ammunition','Two-Handed']}
]};
const pb=l=>l>=17?6:l>=13?5:l>=9?4:l>=5?3:2;
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{subclassMechanics:{},equipment:{shield:false}}};return{klass:{slug:'monk',name:'Monge'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Math.max(3,Number(x.nivel)),name:x.nome,text:x.descricao}))},level,pbonus:pb(level),scores:{Força:10,Destreza:20,Constituição:14,Inteligência:10,Sabedoria:18,Carisma:10},speed:60,tools:[],skills:[],expertiseSkills:[]}}
for(const name of monkNames){const d=make(name),row=mechanics.get(fold(name)),out=monkSubclassOutcome(d);assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.equal(out.martialArtsDie,'d12',`${name}: dado de Artes Marciais de nível 20 deve ser d12.`);assert.equal(out.focusDC,18,`${name}: CD de Foco deve ser 8 + PB 6 + SAB 4 = 18.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length+out.focusTechniques.length>0,`${name}: nenhuma regra estruturada aplicada.`);assert.ok(Array.isArray(monkSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const out=monkSubclassOutcome(make('Warrior of Mercy'));assert.ok(out.skills.includes('Intuição')&&out.skills.includes('Medicina')&&out.tools.includes('Kit de Herbalismo'),'Mercy não aplica proficiências.');assert.ok(out.focusTechniques.some(x=>x.name==='Hand of Healing'&&/d12 \+ 4/.test(x.effect)),'Hand of Healing não usa Artes Marciais + SAB.');assert.ok(out.resources.some(x=>x.name==='Flurry of Healing and Harm'&&x.uses===4),'Flurry of Healing and Harm deve ter usos iguais a SAB.');assert.ok(out.resources.some(x=>x.name==='Hand of Ultimate Mercy'&&/5 Focus/.test(x.detail)),'Hand of Ultimate Mercy incompleta.')
}
{
 const out=monkSubclassOutcome(make('Warrior of Shadow'));assert.ok(out.bonusCantrips.some(x=>x.name==='Minor Illusion'),'Shadow Arts não concede Minor Illusion.');assert.ok(out.senses.some(x=>x.name==='Darkvision'&&x.range===60),'Shadow Arts não concede Darkvision 60.');assert.ok(out.focusTechniques.some(x=>x.name==='Shadow Arts — Darkness'&&x.cost===1),'Darkness deve custar 1 Focus.');assert.ok(out.focusTechniques.some(x=>x.name==='Cloak of Shadows'&&x.cost===3&&/Flurry of Blows custa 0/.test(x.effect)),'Cloak of Shadows 2024 incompleto.');assert.equal(out.movementModes.shadowTeleport,60,'Shadow Step deve teleportar 60 ft.')
}
{
 const d=make('Warrior of the Elements');let out=monkSubclassOutcome(d);assert.ok(out.bonusCantrips.some(x=>x.name==='Elementalism'),'Elements não concede Elementalism.');assert.ok(out.focusTechniques.some(x=>x.name==='Elemental Burst'&&x.cost===2&&/3d12/.test(x.effect)&&/120 ft/.test(x.effect)),'Elemental Burst deve custar 2 Focus, causar 3 dados e ter alcance 120 ft.');assert.equal(out.movementModes.fly.value,60);assert.equal(out.movementModes.swim.value,60);assert.ok(!out.pending.length,'Resistência mutável do Elements não pode ser pendência obrigatória.');setMonkSubclassChoice(d,'elementalResistance','Fogo');out=monkSubclassOutcome(d);assert.ok(out.defenses.some(x=>x.name==='Elemental Epitome — Resistência'&&x.value==='Fogo'),'Resistência atual do Elemental Epitome não aplicada.');assert.ok(out.summary.some(x=>x.name==='Elemental Epitome — Golpe'&&/d12/.test(x.value)),'Dano extra do Elemental Epitome não escala com Artes Marciais.')
}
{
 const out=monkSubclassOutcome(make('Warrior of the Open Hand'));assert.ok(out.summary.some(x=>x.name==='Open Hand Technique — Push'&&/15 ft/.test(x.value)),'Push do Open Hand incompleto.');assert.ok(out.resources.some(x=>x.name==='Wholeness of Body'&&x.uses===4&&/d12 \+ 4/.test(x.detail)),'Wholeness of Body deve usar SAB usos e Artes Marciais + SAB.');assert.ok(out.focusTechniques.some(x=>x.name==='Quivering Palm'&&x.cost===4&&/10d12 Force/.test(x.effect)),'Quivering Palm 2024 deve custar 4 Focus e causar 10d12 Force.')
}
{
 const out=monkSubclassOutcome(make('Way of the Astral Self'));assert.ok(out.attacks.some(x=>x.name==='Braços Astrais'&&x.attackBonus===10&&x.damage==='d12 + 4 Force'),'Braços Astrais devem usar PB + SAB e dado de Artes Marciais.');assert.ok(out.defenses.some(x=>x.name==='Awakened Astral Self'&&/\+2 CA/.test(x.value)),'Awakened Astral Self não representa +2 CA.');assert.ok(out.focusTechniques.some(x=>x.name==='Visage of the Astral Self'&&x.cost===1),'Visage deve consumir 1 Focus.')
}
{
 const out=monkSubclassOutcome(make('Way of the Drunken Master'));assert.ok(out.skills.includes('Atuação')&&out.tools.includes("Brewer's Supplies"),'Drunken Master não aplica proficiências.');assert.ok(out.summary.some(x=>x.name==='Drunken Technique'&&/\+10 ft/.test(x.value)),'Drunken Technique não aplica +10 ft.');assert.ok(out.focusTechniques.some(x=>x.name==='Redirect Attack'&&x.cost===1),'Redirect Attack deve gastar 1 Focus.');assert.ok(out.summary.some(x=>x.name==='Intoxicated Frenzy'&&/5 ataques/.test(x.value)),'Intoxicated Frenzy incompleta.')
}
{
 const d=make('Way of the Kensei');let out=monkSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='kenseiMelee')&&out.pending.some(x=>x.id==='kenseiRanged')&&out.pending.some(x=>x.id==='brushTool'),'Kensei deve exigir duas armas e ferramenta.');const defs=monkSubclassChoiceDefs(d);assert.ok(!defs.find(x=>x.id==='kenseiMelee').options.some(x=>x.value==='greatsword'),'Arma Heavy melee não pode ser Kensei.');assert.ok(defs.find(x=>x.id==='kenseiRanged').options.some(x=>x.value==='longbow'),'Longbow legado deve permanecer opção Kensei na compatibilidade 2024.');setMonkSubclassChoice(d,'kenseiMelee','longsword');setMonkSubclassChoice(d,'kenseiRanged','longbow');setMonkSubclassChoice(d,'brushTool',"Calligrapher's Supplies");out=monkSubclassOutcome(d);assert.equal(out.pending.length,0);assert.ok(out.weaponTraining.includes('Espada Longa')&&out.weaponTraining.includes('Arco Longo'));assert.ok(out.focusTechniques.some(x=>x.name==='Deft Strike'&&/d12/.test(x.effect)),'Deft Strike não escala com Artes Marciais.')
}
{
 const out=monkSubclassOutcome(make('Way of the Sun Soul'));assert.ok(out.attacks.some(x=>x.name==='Radiant Sun Bolt'&&x.attackBonus===11&&x.damage==='d12 + 5 Radiant'),'Radiant Sun Bolt deve usar DEX.');assert.ok(out.focusTechniques.some(x=>x.name==='Searing Sunburst'&&/8d6/.test(x.effect)&&/CD 18/.test(x.effect)),'Searing Sunburst incompleto.');assert.ok(out.summary.some(x=>x.name==='Sun Shield — Retaliação'&&x.value==='9 Radiant.'),'Sun Shield deve causar 5 + SAB.')
}
{
 const d=make('Way of the Artisan');let out=monkSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='artisanTools'),'Artisan deve exigir duas ferramentas.');setMonkSubclassChoice(d,'artisanTools',["Smith's Tools","Tinker's Tools"]);out=monkSubclassOutcome(d);assert.equal(out.pending.length,0);assert.ok(out.tools.includes("Smith's Tools")&&out.tools.includes("Tinker's Tools"));assert.ok(out.summary.some(x=>x.name==='Tools of the Trade'&&/d12/.test(x.value)),'Tools of the Trade deve usar um dado acima, limitado a d12.');assert.ok(out.resources.some(x=>x.name==='Soulful Craft'&&x.uses==='4 objeto(s) × 2 Focus'),'Soulful Craft L11+ deve armazenar 2 Focus por objeto e usar SAB para quantidade.');assert.ok(out.resources.some(x=>x.name==='Dying Art'&&/30 ft/.test(x.detail)),'Dying Art deve mover metade do Speed.')
}
console.log('Monge validado: 9/9 subclasses com Focus, ataques, escolhas, escalas e integrações mecânicas.');
