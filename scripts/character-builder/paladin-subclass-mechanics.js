import{state,arr,num,fold,uniq,mod}from'./state.js';

export const PALADIN_SUBCLASS_NAMES=['Oath of Devotion','Oath of Glory','Oath of the Ancients','Oath of Vengeance','Oath of the Noble Genies','Oath of the Watchers','Oath of Conquest','Oath of Redemption'];
const KNOWN=new Set(PALADIN_SUBCLASS_NAMES.map(fold));
const GENIE_SKILLS=['Acrobacia','Intimidação','Atuação','Persuasão'];
const GENIE_MODES=['Dao','Djinni','Efreeti','Marid'];
const ELEMENT_TYPES=['Ácido','Frio','Fogo','Elétrico','Trovejante'];
const OATH_SPELLS={
 'Oath of Devotion':{3:['Protection from Evil and Good','Shield of Faith'],5:['Aid','Zone of Truth'],9:['Beacon of Hope','Dispel Magic'],13:['Freedom of Movement','Guardian of Faith'],17:['Commune','Flame Strike']},
 'Oath of Glory':{3:['Guiding Bolt','Heroism'],5:['Enhance Ability','Magic Weapon'],9:['Haste','Protection from Energy'],13:['Compulsion','Freedom of Movement'],17:['Legend Lore',"Yolande's Regal Presence"]},
 'Oath of the Ancients':{3:['Ensnaring Strike','Speak with Animals'],5:['Misty Step','Moonbeam'],9:['Plant Growth','Protection from Energy'],13:['Ice Storm','Stoneskin'],17:['Commune with Nature','Tree Stride']},
 'Oath of Vengeance':{3:['Bane',"Hunter's Mark"],5:['Hold Person','Misty Step'],9:['Haste','Protection from Energy'],13:['Banishment','Dimension Door'],17:['Hold Monster','Scrying']},
 'Oath of the Noble Genies':{3:['Chromatic Orb','Thunderous Smite'],5:['Mirror Image','Phantasmal Force'],9:['Fly','Gaseous Form'],13:['Conjure Minor Elementals','Summon Elemental'],17:['Banishing Smite','Contact Other Plane']},
 'Oath of the Watchers':{3:['Alarm','Detect Magic'],5:['Moonbeam','See Invisibility'],9:['Counterspell','Nondetection'],13:['Aura of Purity','Banishment'],17:['Hold Monster','Scrying']},
 'Oath of Conquest':{3:['Armor of Agathys','Command'],5:['Hold Person','Spiritual Weapon'],9:['Bestow Curse','Fear'],13:['Dominate Beast','Stoneskin'],17:['Cloudkill','Dominate Person']},
 'Oath of Redemption':{3:['Sanctuary','Sleep'],5:['Calm Emotions','Hold Person'],9:['Counterspell','Hypnotic Pattern'],13:["Otiluke's Resilient Sphere",'Stoneskin'],17:['Hold Monster','Wall of Force']}
};
const keyPart=v=>fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=d=>d?.sub?.mechanics?.name||d?.sub?.name||'';
const isPaladin=d=>d?.klass?.slug==='paladin'&&d?.sub&&KNOWN.has(fold(canonical(d)));
const choiceDef=(id,level,label,options,frequency,required=false,note='')=>({id,level,label,options,frequency,required,note,kind:'select'});
function store(d){state.c.choices=state.c.choices||{};state.c.choices.subclassMechanics=state.c.choices.subclassMechanics||{};const k=keyPart(canonical(d));return state.c.choices.subclassMechanics[k]||(state.c.choices.subclassMechanics[k]={})}
function optionValue(options,value){return arr(options).map(x=>typeof x==='string'?x:x.value).includes(value)}
function spellByName(name){return state.catalogs?.spells?.find(s=>fold(s.name)===fold(name)||fold(s.originalName)===fold(name))||null}
function activeSpellNames(name,level){const table=OATH_SPELLS[name]||{};return Object.entries(table).filter(([l])=>level>=num(l)).flatMap(([,names])=>names)}

export function paladinSubclassChoiceDefs(d){
 if(!isPaladin(d))return[];const name=canonical(d),l=num(d.level),defs=[];
 if(name==='Oath of the Noble Genies'){
  if(l>=3){defs.push(choiceDef('genieSkill',3,"Proficiência de Genie's Splendor",GENIE_SKILLS,'ao escolher a subclasse',true));defs.push(choiceDef('elementalSmiteMode',3,'Efeito atual/preferido de Elemental Smite',GENIE_MODES,'a cada uso de Elemental Smite',false,'Pode escolher um efeito diferente a cada Divine Smite.'))}
  if(l>=7)defs.push(choiceDef('auraElement',7,'Resistência atual/preferida da Aura',ELEMENT_TYPES,'no início de cada turno',false,'Pode trocar sem ação no início de cada turno.'))
 }
 return defs
}
export function sanitizePaladinSubclassChoices(d){
 if(!isPaladin(d))return{values:{},pending:[]};const target=store(d),defs=paladinSubclassChoiceDefs(d),allowed=new Map(defs.map(x=>[x.id,x])),clean={};
 for(const[id,value]of Object.entries(target)){const def=allowed.get(id);if(def&&optionValue(def.options,value))clean[id]=value}
 state.c.choices.subclassMechanics[keyPart(canonical(d))]=clean;return{values:clean,pending:defs.filter(def=>def.required&&!clean[def.id])}
}
export function setPaladinSubclassChoice(d,id,value){if(!isPaladin(d))return;const def=paladinSubclassChoiceDefs(d).find(x=>x.id===id),target=store(d);if(!def)return;if(optionValue(def.options,value))target[id]=value;else delete target[id]}

export function paladinSubclassOutcome(d){
 if(!isPaladin(d))return null;const name=canonical(d),l=num(d.level),pb=num(d.pbonus),cha=mod(d.scores?.Carisma),chaUses=Math.max(1,cha),dc=num(d.spellDC)||8+pb+cha,auraRange=l>=18?30:10,channelUses=l>=11?3:2,{values,pending}=sanitizePaladinSubclassChoices(d),features=arr(d.sub?.features).filter(f=>num(f.level)<=l),summary=[],resources=[],defenses=[],attacks=[],skills=[],alwaysPreparedSpellNames=activeSpellNames(name,l),bonusCantrips=[],channelDivinityOptions=[],auraEffects=[],resistances=[];
 const add=(n,value,scope='')=>summary.push({name:n,value,scope}),resource=(n,uses,recovery,detail='')=>resources.push({name:n,uses,recovery,detail}),defense=(n,value,scope='')=>defenses.push({name:n,value,scope}),attack=(n,attackBonus,damage,extra='')=>attacks.push({name:n,attackBonus,damage,extra}),channel=(n,action,effect)=>channelDivinityOptions.push({name:n,action,effect}),aura=(n,effect)=>auraEffects.push({name:n,range:auraRange,effect});
 resource('Channel Divinity',channelUses,'1 uso no Descanso Curto; todos no Descanso Longo','Todas as opções de Channel Divinity da subclasse usam esta mesma reserva.');
 if(name==='Oath of Devotion'){
  channel('Sacred Weapon','como parte da ação Atacar',`por 10 min, arma corpo a corpo recebe +${Math.max(1,cha)} nas jogadas de ataque; acertos podem causar o tipo normal ou Radiant; Bright Light 20 ft + Dim Light 20 ft.`);if(d.weapon&&/corpo a corpo/i.test(d.weapon.categoria||''))attack('Sacred Weapon',num(d.attack)+Math.max(1,cha),`${d.weapon.dano||'dano da arma'} ou Radiant`,'somente enquanto Sacred Weapon estiver ativa');
  if(l>=7){aura('Aura of Devotion','você e aliados na Aura of Protection ficam imunes a Charmed.');defense('Aura of Devotion','Imunidade a Charmed',`${auraRange} ft`)}
  if(l>=15)defense('Smite of Protection','Half Cover','ao conjurar Divine Smite; você e aliados na aura até o início do próximo turno');
  if(l>=20)resource('Holy Nimbus',1,'Descanso Longo ou spell slot de 5º','Ação Bônus; 10 min; inimigo que inicia turno na aura sofre Radiant = CHA + PB; Vantagem em saves impostos por Fiends/Undead.');
 }else if(name==='Oath of Glory'){
  channel('Peerless Athlete','Ação Bônus','por 1 h: Vantagem em Athletics e Acrobatics; saltos Long/High +10 ft.');channel('Inspiring Smite','imediatamente após Divine Smite',`distribui ${2}d8 + ${l} PV temporários entre criaturas escolhidas a 30 ft.`);add('Inspiring Smite',`pool 2d8 + ${l} PV temporários`,'distribuído entre criaturas escolhidas a 30 ft');
  if(l>=7){add('Aura of Alacrity — próprio Speed','+10 ft permanente enquanto a característica estiver ativa');aura('Aura of Alacrity','aliado que entra na aura pela primeira vez no turno ou começa nela recebe +10 ft Speed até o fim do próximo turno.')}
  if(l>=15)resource('Glorious Defense',chaUses,'Descanso Longo',`Reação: +${Math.max(1,cha)} CA contra ataque que atingiu você ou criatura visível a 10 ft; se errar, pode contra-atacar se estiver no alcance.`);
  if(l>=20)resource('Living Legend',1,'Descanso Longo ou spell slot de 5º','Ação Bônus; 10 min; Vantagem em testes de Carisma, 1/turno transforma ataque com arma errado em acerto e Reação para rerrolar save falho.');
 }else if(name==='Oath of the Ancients'){
  channel("Nature's Wrath",'Ação',`criaturas escolhidas a 15 ft fazem Força CD ${dc}; falha: Restrained por até 1 min, repetindo save ao fim de cada turno.`);
  if(l>=7){aura('Aura of Warding','você e aliados recebem resistência a Necrotic, Psychic e Radiant.');resistances.push('Necrótico','Psíquico','Radiante');defense('Aura of Warding','Resistência a Necrotic, Psychic e Radiant',`${auraRange} ft`)}
  if(l>=15)resource('Undying Sentinel',1,'Descanso Longo',`ao cair a 0 PV sem morrer instantaneamente, fica com 1 PV e recupera ${3*l} PV; também não envelhece magicamente.`);
  if(l>=20)resource('Elder Champion',1,'Descanso Longo ou spell slot de 5º','Ação Bônus; 1 min; recupera 10 PV no início de cada turno, inimigos na aura têm Desvantagem contra suas magias/Channel Divinity e magias de Ação podem usar Ação Bônus.');
 }else if(name==='Oath of Vengeance'){
  channel('Vow of Enmity','como parte da ação Atacar','criatura visível a 30 ft; Vantagem nos ataques contra ela por 1 min. Se cair a 0 PV, transfere o voto a outra criatura a 30 ft sem ação.');
  if(l>=7)add('Relentless Avenger',`após acertar Opportunity Attack: pode zerar Speed do alvo pelo turno e mover até ${Math.floor(num(d.speed)/2)} ft como parte da Reação sem provocar OA.`);
  if(l>=15)add('Soul of Vengeance','quando o alvo do Vow acerta ou erra um ataque, Reação para fazer ataque corpo a corpo contra ele se estiver no alcance.');
  if(l>=20)resource('Avenging Angel',1,'Descanso Longo ou spell slot de 5º',`Ação Bônus; 10 min; Fly 60 ft com Hover; inimigos que iniciam turno na aura fazem Sabedoria CD ${dc} ou ficam Frightened por 1 min/até sofrer dano.`);
 }else if(name==='Oath of the Noble Genies'){
  const elementalism=spellByName('Elementalism');if(elementalism)bonusCantrips.push(elementalism);if(values.genieSkill)skills.push(values.genieSkill);
  channel('Elemental Smite','imediatamente após Divine Smite','escolha Dao, Djinni, Efreeti ou Marid; a escolha pode mudar a cada uso.');
  const mode=values.elementalSmiteMode;if(mode==='Dao')add("Elemental Smite — Dao's Crush",`alvo fica Grappled (escape CD ${dc}) e Restrained enquanto estiver Grappled.`);else if(mode==='Djinni')add("Elemental Smite — Djinni's Escape",'teleporta 30 ft; até fim do próximo turno resistência B/P/S e imunidade a Grappled, Prone e Restrained.');else if(mode==='Efreeti')add("Elemental Smite — Efreeti's Fury",'alvo +2d4 Fire e outra criatura visível a 30 ft +2d4 Fire.');else if(mode==='Marid')add("Elemental Smite — Marid's Surge",`alvo e criaturas escolhidas em emanação 10 ft: Força CD ${dc}; falha empurra 15 ft e Prone.`);else add('Elemental Smite — efeitos','Dao: Grappled/Restrained · Djinni: teleporte/defesa · Efreeti: 2d4 + 2d4 Fire · Marid: push 15 ft + Prone.');
  defense("Genie's Splendor — CA",`10 + DEX + CHA = ${10+mod(d.scores?.Destreza)+cha}`,'somente sem armadura; escudo e outros bônus continuam aplicáveis');
  if(l>=7){const current=values.auraElement||'escolhido no início do turno';aura('Aura of Elemental Shielding',`resistência a ${current}; pode trocar entre Acid, Cold, Fire, Lightning e Thunder no início de cada turno, sem ação.`);defense('Aura of Elemental Shielding',`Resistência: ${current}`,`${auraRange} ft`)}
  if(l>=15)resource('Elemental Rebuke',chaUses,'Descanso Longo',`Reação ao ser atingido: reduz pela metade o dano daquele ataque; atacante faz Destreza CD ${dc}; falha sofre 2d10 + ${cha} do tipo Acid/Cold/Fire/Lightning/Thunder, sucesso metade.`);
  if(l>=20)resource('Noble Scion',1,'Descanso Longo ou spell slot de 5º','Ação Bônus; 10 min; Fly 60 ft com Hover. Minor Wish: Reação transforma D20 Test falho seu ou de aliado na aura em sucesso.');
 }else if(name==='Oath of the Watchers'){
  channel("Watcher's Will",'Ação',`até ${chaUses} criatura(s) a 30 ft têm Vantagem em saves de Inteligência, Sabedoria e Carisma por 1 min.`);channel('Abjure the Extraplanar','Ação',`Aberrations, Celestials, Elementals, Fey e Fiends escolhidos a 30 ft fazem Sabedoria CD ${dc}; falha: Turned por 1 min ou até sofrer dano.`);
  if(l>=7){aura('Aura of the Sentinel',`você e aliados somam PB (+${pb}) à Iniciativa.`);add('Aura of the Sentinel',`+${pb} Iniciativa`,`${auraRange} ft`)}
  if(l>=15)add('Vigilant Rebuke',`Reação após você/criatura a 30 ft ter sucesso em save INT/WIS/CHA: agressor sofre 2d8 + ${cha} Force.`);
  if(l>=20)resource('Mortal Bulwark',1,'Descanso Longo',`Ação Bônus; 1 min; Truesight 120 ft, Vantagem em ataques contra Aberration/Celestial/Elemental/Fey/Fiend e acertos podem forçar Carisma CD ${dc} para banimento.`);
 }else if(name==='Oath of Conquest'){
  channel('Conquering Presence','Ação',`criaturas escolhidas a 30 ft fazem Sabedoria CD ${dc}; falha: Frightened por 1 min, repetindo save ao fim dos turnos.`);channel('Guided Strike','após fazer jogada de ataque','+10 na jogada, podendo decidir após ver o d20.');
  if(l>=7){aura('Aura of Conquest',`criatura Frightened de você tem Speed 0 e sofre ${Math.floor(l/2)} Psychic no início do turno.`);add('Aura of Conquest',`Speed 0 + ${Math.floor(l/2)} Psychic`,`${auraRange} ft; somente criaturas Frightened de você`)}
  if(l>=15)add('Scornful Rebuke',`criatura que acerta você sofre ${cha} Psychic.`);
  if(l>=20)resource('Invincible Conqueror',1,'Descanso Longo','Ação; 1 min; resistência a todo dano, 1 ataque adicional na ação Attack e críticos com armas corpo a corpo em 19–20.');
 }else if(name==='Oath of Redemption'){
  channel('Emissary of Peace','Ação Bônus','+5 em Charisma (Persuasion) por 10 min.');channel('Rebuke the Violent','Reação',`quando atacante a 30 ft causa dano a outra criatura: Sabedoria CD ${dc}; falha sofre Radiant igual ao dano causado, sucesso metade.`);
  if(l>=7){aura('Aura of the Guardian','Reação quando outra criatura sofre dano: você recebe todo o dano no lugar dela; esse dano não pode ser reduzido.');defense('Aura of the Guardian','transferência integral de dano',`${auraRange} ft; usa Reação`)}
  if(l>=15)add('Protective Spirit',`fim do turno, se consciente e abaixo de metade dos PV: recupera 1d6 + ${Math.floor(l/2)} PV.`);
  if(l>=20)defense('Emissary of Redemption','resistência a todo dano de outras criaturas + retaliação Radiant = metade do dano sofrido','benefício é suspenso contra criatura que você atacar, danificar ou alvejar hostilmente até o Descanso Longo');
 }
 const prepared=uniq(alwaysPreparedSpellNames.map(spellByName).filter(Boolean)),missingSpells=uniq(alwaysPreparedSpellNames.filter(n=>!spellByName(n)));
 return{name,features,choices:values,pending,summary,resources,defenses,attacks,skills:uniq(skills),alwaysPreparedSpellNames:uniq(alwaysPreparedSpellNames),alwaysPreparedSpells:prepared,missingSpells,bonusCantrips:uniq(bonusCantrips),channelDivinityOptions,auraEffects,auraRange,channelDivinityUses:channelUses,spellDC:dc,resistances:uniq(resistances)}
}

export function applyPaladinSubclassMechanics(d){
 const out=paladinSubclassOutcome(d);if(!out)return d;d.subclassMechanics=out;d.skills=uniq([...arr(d.skills),...out.skills]);d.subclassResources=uniq([...arr(d.subclassResources),...out.resources]);d.subclassDefenses=uniq([...arr(d.subclassDefenses),...out.defenses]);d.subclassAttacks=uniq([...arr(d.subclassAttacks),...out.attacks]);d.subclassAlwaysPreparedSpells=uniq([...arr(d.subclassAlwaysPreparedSpells),...out.alwaysPreparedSpells]);d.subclassAlwaysPreparedSpellNames=uniq([...arr(d.subclassAlwaysPreparedSpellNames),...out.alwaysPreparedSpellNames]);d.subclassBonusCantrips=uniq([...arr(d.subclassBonusCantrips),...out.bonusCantrips]);d.subclassChannelDivinityOptions=uniq([...arr(d.subclassChannelDivinityOptions),...out.channelDivinityOptions]);d.subclassAuraEffects=uniq([...arr(d.subclassAuraEffects),...out.auraEffects]);d.subclassResistances=uniq([...arr(d.subclassResistances),...out.resistances]);d.preparedSpellsAll=uniq([...arr(d.selectedSpells?.leveled),...arr(d.subclassAlwaysPreparedSpells)]);d.paladinAuraRange=out.auraRange;d.channelDivinityUses=out.channelDivinityUses;return d
}
