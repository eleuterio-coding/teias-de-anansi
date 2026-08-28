import fs from'node:fs';
import assert from'node:assert/strict';

const FILES=['dados/subclasses-mecanicas-phb-2024.json','dados/subclasses-mecanicas-forge-2025.json','dados/subclasses-mecanicas-quickstone-2024.json','dados/subclasses-mecanicas-heroes-faerun-2025.json','dados/subclasses-mecanicas-tasha-2020.json','dados/subclasses-mecanicas-xanathar-2017.json','dados/subclasses-mecanicas-larsene-ledger-2024.json'];
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=json('dados/subclasses-pdfs.json'),names=catalog.subclasses.filter(x=>x.classe==='Rogue').map(x=>x.nome);
assert.equal(names.length,11,`Esperadas 11 subclasses de Ladino; encontradas ${names.length}.`);
const mechanics=new Map;for(const file of FILES)for(const row of json(file).subclasses||[])mechanics.set(fold(row.nome),row);for(const name of names)assert.ok(mechanics.has(fold(name)),`Sem pacote mecânico para ${name}.`);
const source=fs.readFileSync('scripts/character-builder/rogue-subclass-mechanics.js','utf8'),ui=fs.readFileSync('scripts/character-builder/rogue-subclass-ui.js','utf8'),rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8'),langs=fs.readFileSync('scripts/character-builder/language-mechanics.js','utf8');
for(const name of names)assert.ok(source.includes(`'${name}'`),`Subclasse sem implementação explícita: ${name}`);
for(const token of['rogueSubclassChoiceDefs','rogueSubclassOutcome','sneakAttackDice','cunningStrikeDC','subclassCunningStrikes','subclassSkillFloors','subclassSpellcasting'])assert.ok(source.includes(token),`Contrato mecânico ausente: ${token}`);
assert.ok(ui.includes('data-rogue-subclass-pending')&&ui.includes('data-rogue-subclass-combat')&&ui.includes('data-rogue-subclass-spells'),'UI não integra pendências, combate e magias.');
assert.ok(rules.includes('applyRogueSubclassMechanics(d)'),'derive() não aplica Ladino.');assert.ok(classUi.includes('initRogueSubclassUi'),'Construtor não inicializa Ladino.');assert.ok(langs.includes('subclass:mastermind:master-of-intrigue'),'Mastermind não integra idiomas ao sistema central.');

const{state}=await import('../scripts/character-builder/state.js');
const{rogueSubclassOutcome,rogueSubclassChoiceDefs,setRogueSubclassChoice,applyRogueSubclassMechanics}=await import('../scripts/character-builder/rogue-subclass-mechanics.js');
const cantripNames=['Mage Hand','Minor Illusion','Blade Ward','Chill Touch','Prestidigitation','Fire Bolt','Light','Message'];
const spells=[...cantripNames.map((name,i)=>({id:`c${i}`,name,originalName:name,level:0,classes:['Wizard']})),...Array.from({length:20},(_,i)=>({id:`w${i}`,name:`Wizard Spell ${i+1}`,originalName:`Wizard Spell ${i+1}`,level:1+(i%4),classes:['Wizard']}))];
state.catalogs={...(state.catalogs||{}),spells};
const make=(name,level=20)=>{const row=mechanics.get(fold(name));state.c={choices:{subclassMechanics:{},companions:{},equipment:{shield:false}}};return{klass:{slug:'rogue',name:'Ladino'},sub:{name,mechanics:{name},features:row.progressao.map(x=>({level:Math.max(3,Number(x.nivel)),name:x.nome,text:x.descricao}))},level,pbonus:level>=17?6:level>=13?5:level>=9?4:level>=5?3:2,scores:{Força:10,Destreza:20,Constituição:14,Inteligência:16,Sabedoria:14,Carisma:16},speed:30,initiative:5,skills:['Furtividade'],expertiseSkills:[],tools:["Thieves' Tools"],subclassResources:[],subclassDefenses:[],subclassAttacks:[]}}
for(const name of names){const d=make(name),out=rogueSubclassOutcome(d),row=mechanics.get(fold(name));assert.ok(out,`${name}: outcome ausente.`);assert.equal(out.features.length,row.progressao.length,`${name}: progressão de nível 20 incompleta.`);assert.equal(out.sneakAttackDice,10,`${name}: Sneak Attack de nível 20 deve ser 10d6.`);assert.equal(out.cunningStrikeDC,19,`${name}: CD deve ser 8 + PB 6 + DES 5 = 19.`);assert.ok(out.summary.length+out.resources.length+out.defenses.length+out.attacks.length>0,`${name}: nenhuma regra estruturada.`);assert.ok(Array.isArray(rogueSubclassChoiceDefs(d)),`${name}: escolhas inválidas.`)}
{
 const d=make('Arcane Trickster'),defs=rogueSubclassChoiceDefs(d),can=defs.find(x=>x.id==='atCantrips'),lev=defs.find(x=>x.id==='atSpells');assert.equal(can.choose,3);assert.equal(lev.choose,13);assert.ok(!can.options.some(x=>fold(x.label)==='mage hand'),'Mage Hand automático não deve consumir escolha de truque.');setRogueSubclassChoice(d,'atCantrips',can.options.slice(0,3).map(x=>x.value));setRogueSubclassChoice(d,'atSpells',lev.options.slice(0,13).map(x=>x.value));const out=rogueSubclassOutcome(d);assert.equal(out.pending.length,0);assert.deepEqual(out.spellcasting.slots,{1:4,2:3,3:3,4:1});assert.equal(out.spellcasting.attack,9);assert.equal(out.spellcasting.dc,17);assert.equal(out.bonusCantrips.length,4);assert.equal(out.alwaysPreparedSpells.length,13);assert.ok(out.summary.some(x=>x.name==='Versatile Trickster'))
}
{
 const out=rogueSubclassOutcome(make('Assassin'));assert.ok(out.tools.includes('Disguise Kit')&&out.tools.includes("Poisoner's Kit"));assert.ok(out.summary.some(x=>x.name==='Surprising Strikes'&&/\+20/.test(x.value)));assert.ok(out.cunningStrikes.some(x=>x.name==='Envenom Weapons'&&x.cost===1&&x.dc===19));assert.ok(out.summary.some(x=>x.name==='Death Strike'&&/dobra/.test(x.value)))
}
{
 const out=rogueSubclassOutcome(make('Soulknife'));assert.ok(out.resources.some(x=>x.name==='Psionic Energy Dice'&&x.uses==='12d12'));assert.ok(out.attacks.some(x=>x.name==='Psychic Blade'&&x.attackBonus===11&&/1d6 \+ 5 Psychic/.test(x.damage)&&/60\/120/.test(x.extra)));assert.ok(out.resources.some(x=>x.name==='Rend Mind'&&/CD 19/.test(x.detail)))
}
{
 const out=rogueSubclassOutcome(make('Thief'));assert.equal(out.movementModes.climb.value,30);assert.ok(out.cunningStrikes.some(x=>x.name==='Stealth Attack'&&x.cost===1));assert.ok(out.summary.some(x=>x.name==='Use Magic Device'&&/4 espaços/.test(x.value)));assert.ok(out.summary.some(x=>x.name==="Thief's Reflexes"))
}
{
 const d=make('Scion of the Three');let out=rogueSubclassOutcome(d);assert.ok(out.pending.some(x=>x.id==='dreadAllegiance'));setRogueSubclassChoice(d,'dreadAllegiance','Bane');out=rogueSubclassOutcome(d);assert.ok(out.defenses.some(x=>x.name.includes('Bane')&&/Psychic/.test(x.value)));assert.ok(out.resources.some(x=>x.name==='Bloodthirst'&&x.uses===3));assert.ok(out.cunningStrikes.some(x=>x.name==='Strike Fear'&&x.dc===19));assert.ok(out.summary.some(x=>x.name==='Sneak Attack mínimo por dado'&&x.value==='3'))
}
{
 const d=make('Phantom'),def=rogueSubclassChoiceDefs(d).find(x=>x.id==='whispersProficiency');assert.ok(!def.options.some(x=>x.value==='skill:Furtividade'),'Whispers não deve oferecer perícia já proficiente.');setRogueSubclassChoice(d,'whispersProficiency','skill:Percepção');const out=rogueSubclassOutcome(d);assert.ok(out.skills.includes('Percepção'));assert.ok(out.resources.some(x=>x.name==='Wails from the Grave'&&/5d6/.test(x.detail)));assert.equal(out.movementModes.ghostFly.value,10)
}
{
 const out=rogueSubclassOutcome(make('Inquisitive'));assert.equal(out.skillFloors.Intuição.minimum,8);assert.ok(out.resources.some(x=>x.name==='Unerring Eye'&&x.uses===2));assert.ok(out.summary.some(x=>x.name==='Eye for Weakness'&&/3d6/.test(x.value)))
}
{
 const d=make('Mastermind');setRogueSubclassChoice(d,'gamingSet','Dice Set');setRogueSubclassChoice(d,'language1','Dracônico');setRogueSubclassChoice(d,'language2','Élfico');const out=rogueSubclassOutcome(d);assert.equal(out.pending.length,0);assert.ok(out.tools.includes('Dice Set')&&out.tools.includes('Disguise Kit'));assert.deepEqual(out.languages,['Dracônico','Élfico']);assert.ok(out.defenses.some(x=>x.name==='Soul of Deceit'))
}
{
 const d=make('Scout'),out=rogueSubclassOutcome(d);assert.ok(out.skills.includes('Natureza')&&out.skills.includes('Sobrevivência'));assert.ok(out.expertiseSkills.includes('Natureza')&&out.expertiseSkills.includes('Sobrevivência'));applyRogueSubclassMechanics(d);assert.equal(d.speed,40);assert.ok(d.expertiseSkills.includes('Natureza'))
}
{
 const d=make('Swashbuckler');applyRogueSubclassMechanics(d);assert.equal(d.initiative,8);assert.ok(d.subclassMechanics.summary.some(x=>x.name==='Rakish Audacity'));assert.ok(d.subclassMechanics.resources.some(x=>x.name==='Master Duelist'))
}
{
 const d=make('Charlatan');setRogueSubclassChoice(d,'premeditationTool3','Forgery Kit');setRogueSubclassChoice(d,'premeditationTool9',"Smith's Tools");setRogueSubclassChoice(d,'premeditationTool13',"Tinker's Tools");setRogueSubclassChoice(d,'premeditationTool17',"Painter's Supplies");let out=rogueSubclassOutcome(d);assert.equal(out.pending.length,0);assert.equal(out.tools.length,5);applyRogueSubclassMechanics(d);assert.equal(d.initiative,8);assert.ok(out.summary.some(x=>x.name==='Surprise!'&&/19–20/.test(x.value)));assert.ok(out.summary.some(x=>x.name==='Harmless'&&/CD 17/.test(x.value)))
}
console.log('Ladino validado: 11/11 subclasses com Sneak Attack, Cunning Strike, magia, psiônicos, perícias, mobilidade e recursos.');
