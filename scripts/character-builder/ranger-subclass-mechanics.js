import{state,arr,num,fold,uniq,mod}from'./state.js';

export const RANGER_SUBCLASS_NAMES=['Beast Master','Fey Wanderer','Gloom Stalker','Hunter','Bloodhound','Winter Walker','Swarmkeeper','Horizon Walker','Monster Slayer'];
const KNOWN=new Set(RANGER_SUBCLASS_NAMES.map(fold));
const SOCIAL_SKILLS=['Enganação','Atuação','Persuasão'];
const HUNTER_PREY=['Colossus Slayer','Horde Breaker'];
const HUNTER_DEFENSE=['Escape the Horde','Multiattack Defense'];
const SPELLS={
 'Fey Wanderer':{3:['Charm Person'],5:['Misty Step'],9:['Summon Fey'],13:['Dimension Door'],17:['Mislead']},
 'Gloom Stalker':{3:['Disguise Self'],5:['Rope Trick'],9:['Fear'],13:['Greater Invisibility'],17:['Seeming']},
 Bloodhound:{3:['Alarm'],5:['Hold Person'],9:['Clairvoyance'],13:['Locate Creature'],17:['Scrying']},
 'Winter Walker':{3:['Ice Knife'],5:['Hold Person'],9:['Remove Curse'],13:['Ice Storm'],17:['Cone of Cold']},
 Swarmkeeper:{3:['Faerie Fire'],5:['Web'],9:['Gaseous Form'],13:['Arcane Eye'],17:['Insect Plague']},
 'Horizon Walker':{3:['Protection from Evil and Good'],5:['Misty Step'],9:['Haste'],13:['Banishment'],17:['Teleportation Circle']},
 'Monster Slayer':{3:['Protection from Evil and Good'],5:['Zone of Truth'],9:['Magic Circle'],13:['Banishment'],17:['Hold Monster']}
};
const keyPart=v=>fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=d=>d?.sub?.mechanics?.name||d?.sub?.name||'';
const isRanger=d=>d?.klass?.slug==='ranger'&&d?.sub&&KNOWN.has(fold(canonical(d)));
const choiceDef=(id,level,label,options,frequency,required=false,note='',kind='select')=>({id,level,label,options,frequency,required,note,kind});
function store(d){state.c.choices=state.c.choices||{};state.c.choices.subclassMechanics=state.c.choices.subclassMechanics||{};const k=keyPart(canonical(d));return state.c.choices.subclassMechanics[k]||(state.c.choices.subclassMechanics[k]={})}
const spellByName=name=>state.catalogs?.spells?.find(s=>fold(s.name)===fold(name)||fold(s.originalName)===fold(name))||null;
const optionValue=(options,v)=>arr(options).map(x=>typeof x==='string'?x:x.value).includes(v);
function companionData(){return state.c?.choices?.companions?.['ranger-primal-companion']||{}}

export function rangerSubclassChoiceDefs(d){
 if(!isRanger(d))return[];const name=canonical(d),l=num(d.level),defs=[],add=(id,level,label,options,frequency,required=false,note='',kind='select')=>{if(l>=level)defs.push(choiceDef(id,level,label,options,frequency,required,note,kind))};
 if(name==='Fey Wanderer')add('socialSkill',3,'Perícia de Otherworldly Glamour',SOCIAL_SKILLS,'ao escolher a subclasse',true);
 if(name==='Hunter'){add('huntersPrey',3,"Hunter's Prey atual",HUNTER_PREY,'após Descanso Curto ou Longo',true,'Pode ser trocado a cada descanso.');add('defensiveTactic',7,'Defensive Tactics atual',HUNTER_DEFENSE,'após Descanso Curto ou Longo',true,'Pode ser trocado a cada descanso.')}
 if(name==='Bloodhound')add('bountyName',3,'Bounty atual',[],'durante o jogo',false,'Opcional; registra o alvo atual de Ley Line Tracker.','text');
 if(name==='Swarmkeeper')add('swarmAppearance',3,'Aparência do enxame',[],'ao definir o enxame',false,'Opcional; não altera os cálculos.','text');
 return defs
}
export function sanitizeRangerSubclassChoices(d){
 if(!isRanger(d))return{values:{},pending:[]};const defs=rangerSubclassChoiceDefs(d),allowed=new Map(defs.map(x=>[x.id,x])),old=store(d),clean={};
 for(const[id,v]of Object.entries(old)){const def=allowed.get(id);if(!def)continue;if(def.kind==='text'){if(String(v||'').trim())clean[id]=String(v).trim()}else if(optionValue(def.options,v))clean[id]=v}
 state.c.choices.subclassMechanics[keyPart(canonical(d))]=clean;const pending=defs.filter(x=>x.required&&!clean[x.id]);
 if(canonical(d)==='Beast Master'&&!companionData().form)pending.push({id:'primalCompanionForm',label:'Bloco do Companheiro Primal',required:true,frequency:'após Descanso Longo'});
 return{values:clean,pending}
}
export function setRangerSubclassChoice(d,id,value){if(!isRanger(d))return;const def=rangerSubclassChoiceDefs(d).find(x=>x.id===id),s=store(d);if(!def)return;if(def.kind==='text'){if(String(value||'').trim())s[id]=String(value).trim();else delete s[id];return}if(optionValue(def.options,value))s[id]=value;else delete s[id]}
function activeSpells(name,l){const names=[];for(const[level,list]of Object.entries(SPELLS[name]||{}))if(l>=num(level))names.push(...list);return uniq(names)}
function primalCompanion(d,wis){
 const data=companionData(),form=data.form;if(!form)return null;const base={key:'ranger-primal-companion',name:data.name||'Companheiro Primal',appearance:data.animal||'',form,ac:13+wis,attackBonus:d.spellAttack,spellDC:d.spellDC,traits:['Primal Bond: +PB em ability checks e saving throws'],languages:['Entende os idiomas que o Patrulheiro conhece']};
 if(form==='Fera da Terra')return{...base,size:'Medium',hp:5+5*num(d.level),hitDice:`${d.level}d8`,speed:40,climb:40,darkvision:60,attack:{name:"Beast's Strike",damage:`1d8 + ${2+wis}`,type:'Bludgeoning/Piercing/Slashing',extra:'Após mover 20 ft em linha reta: +1d6 do mesmo tipo e Prone em alvo Large ou menor.'}};
 if(form==='Fera do Mar')return{...base,size:'Medium',hp:5+5*num(d.level),hitDice:`${d.level}d8`,speed:5,swim:60,darkvision:90,traits:[...base.traits,'Amphibious'],attack:{name:"Beast's Strike",damage:`1d6 + ${2+wis}`,type:'Bludgeoning/Piercing',extra:`Grappled; escape CD ${d.spellDC}.`}};
 return{...base,size:'Small',hp:4+4*num(d.level),hitDice:`${d.level}d6`,speed:10,fly:60,darkvision:60,traits:[...base.traits,'Flyby'],attack:{name:"Beast's Strike",damage:`1d4 + ${3+wis}`,type:'Slashing',extra:'Flyby: não provoca Opportunity Attacks ao sair voando do alcance.'}}
}

export function rangerSubclassOutcome(d){
 if(!isRanger(d))return null;const name=canonical(d),l=num(d.level),pb=num(d.pbonus),wis=mod(d.scores?.Sabedoria),wisUses=Math.max(1,wis),{values,pending}=sanitizeRangerSubclassChoices(d),features=arr(d.sub?.features).filter(f=>Math.max(3,num(f.level))<=l),summary=[],resources=[],defenses=[],attacks=[],skills=[],alwaysPreparedSpellNames=activeSpells(name,l),bonusCantrips=[],companions=[],movementModes={},senses=[],saveProficiencies=[];
 const add=(n,value,scope='')=>summary.push({name:n,value,scope}),resource=(n,uses,recovery,detail='')=>resources.push({name:n,uses,recovery,detail}),defense=(n,value,scope='')=>defenses.push({name:n,value,scope}),attack=(n,attackBonus,damage,extra='')=>attacks.push({name:n,attackBonus,damage,extra});
 if(name==='Beast Master'){
  const c=primalCompanion(d,wis);if(c){companions.push(c);add('Primal Companion',`${c.form} · CA ${c.ac} · PV ${c.hp}`);attack(`${c.name} — ${c.attack.name}`,c.attackBonus,`${c.attack.damage} ${c.attack.type}`,c.attack.extra)}add('Comandar Companheiro','Ação Bônus para uma ação; ou substitua um ataque seu para ordenar Beast’s Strike.');if(l>=7)add('Exceptional Training','Ao comandar com Ação Bônus, a fera também pode usar Dash, Disengage, Dodge ou Help como Ação Bônus; dano pode virar Force.');if(l>=11){add('Bestial Fury','Beast’s Strike duas vezes por comando.');add("Bestial Fury — Hunter's Mark",`1/turno: +${l>=20?'1d10':'1d6'} Force quando a fera acerta seu alvo marcado.`)}if(l>=15)add('Share Spells','Magia que mira você também pode afetar o companheiro a até 30 ft.')
 }else if(name==='Fey Wanderer'){
  if(values.socialSkill)skills.push(values.socialSkill);add('Dreadful Strikes',l>=11?'1d6 Psychic':'1d4 Psychic','1/turno por criatura atingida');add('Otherworldly Glamour',`+${wis} em todos os checks de Carisma`);if(l>=7){defense('Beguiling Twist — proteção','Vantagem','saves contra Charmed e Frightened');add('Beguiling Twist',`Reação; alvo a 120 ft faz Sabedoria CD ${d.spellDC}; Charmed ou Frightened por até 1 minuto.`)}if(l>=11)resource('Fey Reinforcements',1,'Descanso Longo','Summon Fey sem componente material; no uso gratuito não exige Concentração e dura 1 minuto.');if(l>=15)resource('Misty Wanderer',wisUses,'Descanso Longo','Misty Step sem slot; pode levar criatura voluntária a 5 ft para junto do destino.')
 }else if(name==='Gloom Stalker'){
  resource('Dreadful Strike',wisUses,'Descanso Longo',`1/turno ao acertar com arma: +${l>=11?'2d8':'2d6'} Psychic.`);add("Ambusher's Leap",'+10 ft Speed','primeiro turno de cada combate');add('Initiative Bonus',`+${wis} na Iniciativa`);senses.push({name:'Darkvision',range:60,stack:'se já possuir, +60 ft'});defense('Umbral Sight','Invisible para criaturas que dependem de Darkvision','enquanto você estiver inteiramente em Darkness');if(l>=7)saveProficiencies.push('Sabedoria');if(l>=11){add("Stalker's Flurry — Sudden Strike",'Ao usar Dreadful Strike, faça outro ataque com a mesma arma contra criatura diferente a 5 ft do alvo.');add("Stalker's Flurry — Mass Fear",`Alvo e criaturas a 10 ft: Sabedoria CD ${d.spellDC} ou Frightened até início do seu próximo turno.`)}if(l>=15)defense('Shadowy Dodge','Reação: impõe Desvantagem ao ataque; depois do resultado teleporta até 30 ft.')
 }else if(name==='Hunter'){
  add("Hunter's Lore",'Hunter’s Mark revela Immunities, Resistances e Vulnerabilities do alvo marcado.');if(values.huntersPrey==='Colossus Slayer')add('Colossus Slayer','+1d8 dano de arma 1/turno contra criatura com PV abaixo do máximo.');if(values.huntersPrey==='Horde Breaker')add('Horde Breaker','1/turno: ataque adicional com a mesma arma contra criatura diferente a 5 ft do alvo original.');if(l>=7&&values.defensiveTactic==='Escape the Horde')defense('Escape the Horde','Opportunity Attacks têm Desvantagem contra você.');if(l>=7&&values.defensiveTactic==='Multiattack Defense')defense('Multiattack Defense','Após criatura acertar você, ela tem Desvantagem nos outros ataques contra você neste turno.');if(l>=11)add("Superior Hunter's Prey",`1/turno ao causar dano ao alvo de Hunter's Mark, cause o dano extra da marca também a outra criatura a 30 ft.`);if(l>=15)defense("Superior Hunter's Defense",'Reação ao sofrer dano: resistência àquele tipo até o fim do turno atual.')
 }else if(name==='Bloodhound'){
  resource('Ley Line Tracker',1,'Descanso Curto ou Longo',`Bounty atual: ${values.bountyName||'não registrada'}; 1/turno pode transferir para criatura visível. Divination de Ranger ignora distância/visão no mesmo plano.`);add('Unwavering Attention','+1d6 dano 1/turno','contra bounty ou alvo de Hunter’s Mark; Opportunity Attack acertando esse alvo recupera sua Reação no início do próximo turno de criatura');if(l>=7)add('Relentless Pursuit',`Reação: move até ${d.speed} ft em direção à bounty/alvo marcado sem provocar OA.`);if(l>=11)add('Eyes on the Prize','Se todos os ataques da ação Attack miram uma criatura, faz um ataque adicional; acerto pode aplicar Grappled/Prone conforme melee/ranged.');if(l>=15)resource('Nowhere to Hide',1,'Descanso Curto ou Longo','True Seeing em si sem slot; Ley Line Tracker ignora proteção mágica contra Divination.')
 }else if(name==='Winter Walker'){
  defense('Frost Resistance','Resistência a Cold');add('Biting Cold','Seu dano Cold de ataques, magias e características de Ranger ignora resistência a Cold.');add('Polar Strikes','+1d4 Cold em acerto com arma','cada criatura pode sofrer uma vez por turno');add("Hunter's Rime",`Ao conjurar Hunter's Mark: 1d10 + ${l} PV temporários; alvo marcado não pode Disengage contra você.`);if(l>=7)resource('Fortifying Soul',1,'Descanso Longo',`até ${wisUses} criatura(s): cura 1d10 + ${l} e Vantagem por 1 h contra Frightened.`);if(l>=11)resource('Chilling Retribution',wisUses,'Descanso Longo',`Reação quando é acertado; Sabedoria CD ${d.spellDC}; falha Stunned até fim do seu próximo turno e Speed 0.`);if(l>=15){defense('Frozen Haunt','Imune a Cold, Grappled, Prone e Restrained','enquanto Hunter’s Mark durar');add('Frozen Haunt — aura','2d4 Cold no início do seu turno a criaturas escolhidas próximas; pode atravessar criaturas/objetos como Difficult Terrain.')}
 }else if(name==='Swarmkeeper'){
  bonusCantrips.push(spellByName('Mage Hand')).filter(Boolean);add('Gathered Swarm',l>=11?'1d8 Piercing / mover alvo 15 ft + Prone / mover você 5 ft + Half Cover':'1d6 Piercing / mover alvo 15 ft / mover você 5 ft','1/turno após acertar ataque; mover alvo exige Força contra sua CD de magia');if(values.swarmAppearance)add('Enxame',values.swarmAppearance);if(l>=7){resource('Writhing Tide',pb,'Descanso Longo','Ação Bônus: Fly 10 ft com Hover por 1 minuto.');movementModes.swarmFly={value:10,scope:'Writhing Tide'}}if(l>=15)resource('Swarming Dispersal',pb,'Descanso Longo','Reação ao sofrer dano: resistência àquela instância e teleporte até 30 ft.')
 }else if(name==='Horizon Walker'){
  resource('Detect Portal',1,'Descanso Curto ou Longo','Ação: direção/distância do portal planar mais próximo em 1 milha.');add('Planar Warrior',l>=11?'+2d8 Force':'+1d8 Force','Ação Bônus; próximo acerto com arma no turno converte todo o dano para Force');if(l>=7)resource('Ethereal Step',1,'Descanso Curto ou Longo','Ação Bônus: Etherealness até o fim do turno.');if(l>=11)add('Distant Strike','Teleporte 10 ft antes de cada ataque da ação Attack; se atacar duas criaturas diferentes, faz ataque adicional contra terceira.');if(l>=15)defense('Spectral Defense','Reação: resistência a todo o dano de um ataque que o atinge.')
 }else if(name==='Monster Slayer'){
  resource("Hunter's Sense",wisUses,'Descanso Longo','Ação em criatura a 60 ft: descobre imunidades, resistências e vulnerabilidades, salvo proteção contra Divination.');add("Slayer's Prey",'+1d6 dano de arma 1/turno','Ação Bônus para escolher criatura a 60 ft; dura até descanso ou trocar alvo');if(l>=7)add('Supernatural Defense','+1d6 em saves e escapes de grapple causados pelo alvo de Slayer’s Prey.');if(l>=11)resource("Magic-User's Nemesis",1,'Descanso Curto ou Longo',`Reação quando alvo a 60 ft conjura magia ou teleporta; Sabedoria CD ${d.spellDC}; falha cancela o efeito.`);if(l>=15)add("Slayer's Counter",'Reação quando Slayer’s Prey força save: ataque com arma; se acertar, sucesso automático no save.')
 }
 const alwaysPreparedSpells=uniq(alwaysPreparedSpellNames.map(spellByName).filter(Boolean));
 return{name,features,choices:values,pending,summary,resources,defenses,attacks,skills:uniq(skills),alwaysPreparedSpellNames:uniq(alwaysPreparedSpellNames),alwaysPreparedSpells,bonusCantrips:uniq(bonusCantrips.filter(Boolean)),companions,movementModes,senses,saveProficiencies:uniq(saveProficiencies)}
}
export function applyRangerSubclassMechanics(d){
 const out=rangerSubclassOutcome(d);if(!out)return d;d.subclassMechanics=out;d.skills=uniq([...arr(d.skills),...out.skills]);d.saveProficiencies=uniq([...arr(d.saveProficiencies),...out.saveProficiencies]);d.subclassResources=uniq([...arr(d.subclassResources),...out.resources]);d.subclassDefenses=uniq([...arr(d.subclassDefenses),...out.defenses]);d.subclassAttacks=uniq([...arr(d.subclassAttacks),...out.attacks]);d.subclassAlwaysPreparedSpells=uniq([...arr(d.subclassAlwaysPreparedSpells),...out.alwaysPreparedSpells]);d.subclassBonusCantrips=uniq([...arr(d.subclassBonusCantrips),...out.bonusCantrips]);d.subclassCompanions=uniq([...arr(d.subclassCompanions),...out.companions]);d.subclassMovementModes={...(d.subclassMovementModes||{}),...out.movementModes};d.subclassSenses=uniq([...arr(d.subclassSenses),...out.senses]);return d
}
