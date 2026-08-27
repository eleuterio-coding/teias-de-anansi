import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),fighterNames=catalog.subclasses.filter(x=>x.classe==='Fighter').map(x=>x.nome);
assert.equal(fighterNames.length,10,`Esperadas 10 subclasses de Guerreiro; encontradas ${fighterNames.length}.`);
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);
for(const name of fighterNames)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);

const source=fs.readFileSync('scripts/character-builder/fighter-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/fighter-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8'),languages=fs.readFileSync('scripts/character-builder/language-mechanics.js','utf8');
for(const name of fighterNames)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['fighterSubclassChoiceDefs','fighterSubclassOutcome','subclassSpellcasting','subclassFightingStyles','criticalRange','Psionic Energy Dice','Dados de Superioridade'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-fighter-subclass-pending')&&ui.includes('data-fighter-subclass-combat')&&ui.includes('data-fighter-subclass-spells'),'Interface não integra pendências, combate e magias do Guerreiro.');
assert.ok(rules.includes('applyFighterSubclassMechanics(d)'),'derive() não aplica subclasses de Guerreiro.');
assert.ok(classUi.includes('initFighterSubclassUi'),'Construtor não inicializa UI de Guerreiro.');
for(const token of['subclass:rune-knight:giant','subclass:banneret:knightly-envoy-language','subclass:cavalier:bonus-language','subclass:samurai:bonus-language'])assert.ok(languages.includes(token),`Idioma de Guerreiro fora do sistema central: ${token}`);

const{state}=await import('../scripts/character-builder/state.js');
const{fighterSubclassOutcome,fighterSubclassChoiceDefs,setFighterSubclassChoice}=await import('../scripts/character-builder/fighter-subclass-mechanics.js');
const spells=[];const add=(id,name,level,classes=['Wizard'])=>spells.push({id,name,originalName:name,level,classes});
add('prestidigitation','Prestidigitation',0);add('druidcraft','Druidcraft',0,['Druid']);add('fire-bolt','Fire Bolt',0);add('mage-hand','Mage Hand',0);add('minor-illusion','Minor Illusion',0);
for(const[l,names]of Object.entries({1:['Shield','Magic Missile','Find Familiar','Burning Hands','Chromatic Orb'],2:['Misty Step','Mirror Image','Scorching Ray','Web'],3:['Counterspell','Fireball','Haste'],4:['Dimension Door','Fire Shield']}))for(const name of names)add(fold(name).replace(/[^a-z0-9]+/g,'-'),name,Number(l));add('telekinesis','Telekinesis',5);
state.catalogs={...(state.catalogs||{}),spells};
const pb=l=>l>=17?6:l>=13?5:l>=9?4:l>=5?3:2;
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{subclassMechanics:{},companions:{},equipment:{shield:false}}};return{klass:{slug:'fighter',name:'Guerreiro'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Number(x.nivel),name:x.nome,text:x.descricao}))},level,pbonus:pb(level),scores:{Força:20,Destreza:18,Constituição:18,Inteligência:18,Sabedoria:14,Carisma:16},speed:30,tools:[],skills:[],expertiseSkills:[],spellAttack:10,spellDC:18,weapon:null,armor:null,attack:11}}
for(const name of fighterNames){const d=make(name),row=mechanics.get(fold(name)),out=fighterSubclassOutcome(d);assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length>0,`${name}: nenhuma regra estruturada aplicada.`);assert.ok(Array.isArray(fighterSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const d=make('Battle Master');setFighterSubclassChoice(d,'studentTool',"Smith's Tools");for(const m of['Ambush','Bait and Switch',"Commander's Strike",'Commanding Presence','Disarming Attack','Distracting Strike','Evasive Footwork','Feinting Attack','Goading Attack']){const cur=state.c.choices.subclassMechanics['battle-master']?.maneuvers||[];setFighterSubclassChoice(d,'maneuvers',[...cur,m])}const out=fighterSubclassOutcome(d);const dice=out.resources.find(x=>x.name==='Dados de Superioridade');assert.equal(dice.uses,'6d12','Battle Master L20 deve ter 6d12 de Superioridade.');assert.match(dice.detail,/CD das manobras 19/,'CD do Battle Master deve usar 8 + PB + melhor entre STR/DEX.');assert.ok(out.summary.some(x=>x.name==='Relentless'&&/d8 gratuito/.test(x.value)),'Relentless 2024 ausente.');assert.equal(out.pending.length,0,'Battle Master preenchido não pode permanecer pendente.')
}
{
 const d=make('Champion');setFighterSubclassChoice(d,'additionalFightingStyle','Defense');const out=fighterSubclassOutcome(d);assert.equal(out.criticalRange,'18–20','Champion L15+ deve critar 18–20.');assert.ok(out.summary.some(x=>x.name==='Heroic Rally'&&/^9 PV/.test(x.value)),'Survivor deve calcular 5 + CON (+4 = 9).');assert.deepEqual(out.fightingStyles,['Defense'],'Estilo de Luta adicional não aplicado.')
}
{
 const d=make('Eldritch Knight');const can=['prestidigitation','fire-bolt','mage-hand'];setFighterSubclassChoice(d,'ekCantrips',can);const lev=spells.filter(s=>s.level>=1&&s.level<=4).slice(0,13).map(s=>s.id);assert.equal(lev.length,13,'Fixture precisa de 13 magias elegíveis.');setFighterSubclassChoice(d,'ekSpells',lev);const out=fighterSubclassOutcome(d);assert.deepEqual(out.spellcasting.slots,{1:4,2:3,3:3,4:1},'Slots de Eldritch Knight L20 incorretos.');assert.equal(out.spellcasting.prepared,13,'Eldritch Knight L20 deve preparar 13 magias.');assert.equal(out.spellcasting.dc,18);assert.equal(out.spellcasting.attack,10);assert.equal(out.alwaysPreparedSpells.length,13);assert.equal(out.bonusCantrips.length,3);assert.equal(out.pending.length,0)
}
{
 const out=fighterSubclassOutcome(make('Psi Warrior'));const dice=out.resources.find(x=>x.name==='Psionic Energy Dice');assert.equal(dice.uses,'12d12','Psi Warrior L20 deve ter 12d12 Psionic Energy Dice.');assert.match(dice.detail,/CD psiônica 18/);assert.ok(out.alwaysPreparedSpells.some(s=>s.name==='Telekinesis'),'Telekinetic Master deve disponibilizar Telekinesis.')
}
{
 const d=make('Banneret');setFighterSubclassChoice(d,'knightlySkill','Persuasão');setFighterSubclassChoice(d,'currentLanguage','Dracônico');const out=fighterSubclassOutcome(d);assert.ok(out.skills.includes('Persuasão')&&out.languages.includes('Dracônico'));assert.ok(out.resources.some(x=>x.name==='Group Recovery'&&/3 aliado/.test(x.detail)),'Group Recovery deve usar CHA +3 para quantidade de aliados.')
}
{
 const d=make('Rune Knight');setFighterSubclassChoice(d,'runes',['Cloud Rune','Fire Rune','Frost Rune','Hill Rune','Storm Rune']);const out=fighterSubclassOutcome(d);assert.ok(out.tools.includes("Smith's Tools")&&out.languages.includes('Gigante'));assert.ok(out.resources.some(x=>x.name==="Giant's Might"&&/1d10/.test(x.detail)&&/Huge/.test(x.detail)),'Runic Juggernaut incompleto.');assert.equal(out.pending.length,0)
}
{
 const d=make('Arcane Archer');setFighterSubclassChoice(d,'loreSkill','Arcanismo');setFighterSubclassChoice(d,'loreCantrip','prestidigitation');setFighterSubclassChoice(d,'arcaneShots',['Banishing Arrow','Beguiling Arrow','Bursting Arrow','Enfeebling Arrow','Grasping Arrow','Shadow Arrow']);const out=fighterSubclassOutcome(d);assert.ok(out.skills.includes('Arcanismo')&&out.bonusCantrips.some(s=>s.name==='Prestidigitation'));assert.ok(out.summary.some(x=>x.name==='Beguiling Arrow'&&/4d6/.test(x.value)),'Arcane Shot não escalou no nível 18.');assert.match(out.resources.find(x=>x.name==='Arcane Shot').detail,/CD 18/);assert.equal(out.pending.length,0)
}
for(const name of['Cavalier','Samurai']){const d=make(name);let out=fighterSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='bonusMode'),`${name}: deve exigir Perícia ou Idioma.`);setFighterSubclassChoice(d,'bonusMode','Idioma');out=fighterSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='bonusLanguage'),`${name}: modo Idioma deve exigir idioma.`);setFighterSubclassChoice(d,'bonusLanguage','Élfico');out=fighterSubclassOutcome(d);assert.ok(out.languages.includes('Élfico')&&out.pending.length===0,`${name}: idioma não aplicado.`)}
{
 const d=make('Tavern Brawler',20);d.skills=['Intuição'];const out=fighterSubclassOutcome(d);assert.ok(out.resources.some(x=>x.name==='Brawler Dice'&&x.uses==='12d10'),'Tavern Brawler L20 deve ter 12d10 Brawler Dice.');assert.equal(out.unarmedDamage,'1d10 + 5');assert.ok(out.expertiseSkills.includes('Intuição'),'Tavern Regular deve promover Intuição existente a Expertise.');assert.ok(out.summary.some(x=>x.name==='Piledriver')&&out.summary.some(x=>x.name==='Throw'),'Grandstand Performer não aplicou técnicas finais.')
}
console.log('Guerreiro validado: 10/10 subclasses com escolhas, recursos, escalas e integrações mecânicas.');
