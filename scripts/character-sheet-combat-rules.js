import{arr,num,fold,mod,signed}from'./character-builder/state.js';
import{canUseWeapon}from'./character-builder/equipment-ownership.js?v=20260901-campaign-inventory1';

const MASTERY_DESCRIPTIONS=Object.freeze({
 cleave:'Ao acertar um ataque corpo a corpo, pode atacar uma segunda criatura a até 5 ft do primeiro alvo e dentro do alcance. O segundo dano não soma o modificador de atributo, salvo se negativo. Uma vez por turno.',
 graze:'Ao errar o ataque, causa dano igual ao modificador de atributo usado no ataque. O dano é do mesmo tipo da arma.',
 nick:'O ataque extra da propriedade Leve pode ser feito como parte da ação Atacar, em vez de usar Ação Bônus. Uma vez por turno.',
 push:'Ao acertar uma criatura Grande ou menor, pode empurrá-la até 10 ft para longe.',
 sap:'Ao acertar, a criatura tem Desvantagem no próximo ataque antes do início do seu próximo turno.',
 slow:'Ao acertar e causar dano, reduz o Deslocamento do alvo em 10 ft até o início do seu próximo turno. A redução não acumula.',
 topple:'Ao acertar, pode forçar uma salvaguarda de Constituição. Em falha, o alvo fica Caído.',
 vex:'Ao acertar e causar dano, você tem Vantagem no próximo ataque contra o alvo antes do fim do seu próximo turno.'
});
const AMMO_SYNONYMS=Object.freeze({
 arrow:['arrow','arrows','flecha','flechas'],bolt:['bolt','bolts','virote','virotes'],needle:['needle','needles','agulha','agulhas'],bullet:['bullet','bullets','bala','balas','projétil','projéteis','projetil','projeteis']
});
const clampLevel=value=>Math.max(1,Math.min(20,Math.floor(num(value)||1));
const cleanId=value=>String(value||'').trim();
const propertyRows=weapon=>arr(weapon?.propriedades).map(value=>String(value||'').trim()).filter(Boolean);
function splitDamage(value){const text=String(value||'').trim(),match=text.match(/^(\S+)(?:\s+(.+))?$/);return{dice:match?.[1]||text||'—',type:match?.[2]||''}}
function parseRange(text){const match=String(text||'').match(/(\d+)\s*\/\s*(\d+)/);return match?{normal:num(match[1]),long:num(match[2])}:null}
function normalizeAmmo(value){const f=fold(value);for(const[key,names]of Object.entries(AMMO_SYNONYMS))if(names.some(name=>f===fold(name)||f.includes(fold(name))))return key;return f.replace(/[^a-z0-9]+/g,'')}
function normalizeTurn(turn={}){turn.actionUsed=!!turn.actionUsed;turn.bonusUsed=!!turn.bonusUsed;turn.reactionUsed=!!turn.reactionUsed;turn.attacks=Math.max(0,Math.floor(num(turn.attacks)));turn.attackActionAttacks=Math.max(0,Math.floor(num(turn.attackActionAttacks)));turn.lightExtraUsed=!!turn.lightExtraUsed;turn.loadingUses=turn.loadingUses&&typeof turn.loadingUses==='object'&&!Array.isArray(turn.loadingUses)?turn.loadingUses:{};return turn}

export function ensureCombatState(character){
 if(!character)return null;character.sheet=character.sheet||{};let combat=character.sheet.combat;
 if(!combat||typeof combat!=='object'||Array.isArray(combat))combat={};
 combat.offhandWeaponId=cleanId(combat.offhandWeaponId)||null;
 combat.grips=combat.grips&&typeof combat.grips==='object'&&!Array.isArray(combat.grips)?combat.grips:{};
 combat.attackModes=combat.attackModes&&typeof combat.attackModes==='object'&&!Array.isArray(combat.attackModes)?combat.attackModes:{};
 combat.masteryWeaponIds=arr(combat.masteryWeaponIds).map(cleanId).filter(Boolean);
 combat.mounted=!!combat.mounted;
 combat.round=Math.max(1,Math.floor(num(combat.round)||1));
 combat.turn=normalizeTurn(combat.turn&&typeof combat.turn==='object'&&!Array.isArray(combat.turn)?combat.turn:{});
 character.sheet.combat=combat;return combat
}

export function weaponPropertyProfile(weapon){
 const raw=propertyRows(weapon),normalized=raw.map(fold),base=splitDamage(weapon?.dano),versatileRaw=raw.find(value=>/^versatile\b/i.test(value)),versatileMatch=versatileRaw?.match(/\(([^)]+)\)/),thrownRaw=raw.find(value=>/^thrown\b/i.test(value)),ammoRaw=raw.find(value=>/^ammunition\b/i.test(value)),ammoMatch=ammoRaw?.match(/;\s*([^)]+)\)/),twoRaw=raw.find(value=>/^two-handed\b/i.test(value));
 return{raw,baseDamage:base.dice,damageType:base.type,finesse:normalized.some(value=>value.startsWith('finesse')),light:normalized.some(value=>value.startsWith('light')),heavy:normalized.some(value=>value.startsWith('heavy')),loading:normalized.some(value=>value.startsWith('loading')),reach:normalized.some(value=>value.startsWith('reach')),twoHanded:!!twoRaw,twoHandedUnlessMounted:/unless mounted/i.test(twoRaw||''),versatile:!!versatileRaw,versatileDamage:versatileMatch?.[1]?.trim()||'',thrown:!!thrownRaw,thrownRange:parseRange(thrownRaw),ammunition:!!ammoRaw,ammunitionRange:parseRange(ammoRaw),ammoType:ammoMatch?.[1]?.trim()||'',ammoKey:normalizeAmmo(ammoMatch?.[1]||'')}
}

export function weaponMasteryLimit(klass,level){
 const slug=fold(klass?.slug||klass?.name||klass?.nome),l=clampLevel(level);
 if(['barbarian','barbaro'].includes(slug))return l>=10?4:l>=4?3:2;
 if(['fighter','guerreiro'].includes(slug))return l>=16?6:l>=10?5:l>=4?4:3;
 if(['paladin','paladino','ranger','patrulheiro','rogue','ladino'].includes(slug))return 2;
 return 0
}
export function weaponEligibleForMastery(klass,weapon){
 if(!klass||!weapon)return false;const slug=fold(klass?.slug||klass?.name||klass?.nome),category=fold(weapon.categoria),props=weaponPropertyProfile(weapon);
 if(['barbarian','barbaro'].includes(slug))return category.includes('corpo a corpo')&&(category.includes('simples')||category.includes('marcial'));
 if(['fighter','guerreiro'].includes(slug))return category.includes('simples')||category.includes('marcial');
 if(['paladin','paladino','ranger','patrulheiro'].includes(slug))return canUseWeapon(klass,weapon);
 if(['rogue','ladino'].includes(slug))return canUseWeapon(klass,weapon)&&(category.includes('simples')||(category.includes('marcial')&&(props.finesse||props.light)));
 return false
}
export function normalizeMasteryChoices(character,klass,weapons=[],level=1){const combat=ensureCombatState(character),limit=weaponMasteryLimit(klass,level),valid=new Set(arr(weapons).filter(weapon=>weaponEligibleForMastery(klass,weapon)).map(weapon=>weapon.id));combat.masteryWeaponIds=[...new Set(combat.masteryWeaponIds)].filter(id=>valid.has(id)).slice(0,limit);return combat.masteryWeaponIds}
export function setMasteryChoices(character,klass,weapons,level,ids=[]){const combat=ensureCombatState(character),limit=weaponMasteryLimit(klass,level),valid=new Set(arr(weapons).filter(weapon=>weaponEligibleForMastery(klass,weapon)).map(weapon=>weapon.id));combat.masteryWeaponIds=[...new Set(arr(ids).map(cleanId).filter(id=>valid.has(id)))].slice(0,limit);return combat.masteryWeaponIds}
export function masteryActive(character,klass,weapon,level){const combat=ensureCombatState(character),limit=weaponMasteryLimit(klass,level);return!!(limit&&weaponEligibleForMastery(klass,weapon)&&combat.masteryWeaponIds.includes(weapon?.id))}

export function setOffhandWeapon(character,weaponId){const combat=ensureCombatState(character);combat.offhandWeaponId=cleanId(weaponId)||null;if(combat.offhandWeaponId&&character?.choices?.equipment)character.choices.equipment.shield=false;return combat.offhandWeaponId}
export function setMounted(character,on){const combat=ensureCombatState(character);combat.mounted=!!on;return combat.mounted}
export function setWeaponGrip(character,weaponId,grip){const combat=ensureCombatState(character),mode=grip==='two'?'two':'one';combat.grips[weaponId]=mode;return mode}
export function setWeaponAttackMode(character,weaponId,mode){const combat=ensureCombatState(character);combat.attackModes[weaponId]=mode==='thrown'?'thrown':mode==='ranged'?'ranged':'melee';return combat.attackModes[weaponId]}
export function clearInvalidCombatLoadout(character,ownedRows=[]){const combat=ensureCombatState(character),eq=character?.choices?.equipment||{},available=arr(ownedRows);const changes=[];if(combat.offhandWeaponId&&!available.some(row=>row.kind==='weapon'&&row.refId===combat.offhandWeaponId)){combat.offhandWeaponId=null;changes.push('offhand')}if(combat.offhandWeaponId===eq.weapon){combat.offhandWeaponId=null;changes.push('offhand-same')}if(eq.shield&&combat.offhandWeaponId){combat.offhandWeaponId=null;changes.push('offhand-shield')}return changes}

export function combatHandState(character,weapon=null){
 const combat=ensureCombatState(character),eq=character?.choices?.equipment||{},props=weaponPropertyProfile(weapon),shield=!!eq.shield,offhand=!!combat.offhandWeaponId,mounted=!!combat.mounted,exceptionMounted=props.twoHandedUnlessMounted&&mounted;
 const secondHandOccupied=shield||offhand,twoHandRequirement=props.twoHanded&&!exceptionMounted,twoHandsAvailable=!secondHandOccupied;
 let grip=twoHandRequirement?'two':props.versatile?(combat.grips[weapon?.id]==='two'?'two':'one'):'one';
 if(props.versatile&&secondHandOccupied&&grip==='two'){grip='one';combat.grips[weapon.id]='one'}
 return{shield,offhand,mounted,secondHandOccupied,twoHandsAvailable,twoHandRequirement,grip,canUseTwoHands:twoHandsAvailable&&(props.versatile||twoHandRequirement),blockedByHands:twoHandRequirement&&!twoHandsAvailable}
}
function attackModeFor(character,weapon,props){const combat=ensureCombatState(character),category=fold(weapon?.categoria);if(category.includes('distancia')||category.includes('distância'))return'ranged';if(props.thrown&&combat.attackModes[weapon?.id]==='thrown')return'thrown';return'melee'}
function heavyDisadvantage(d,props,mode){if(!props.heavy)return false;return mode==='ranged'?num(d?.scores?.Destreza)<13:num(d?.scores?.Força)<13}
function attackAbility(d,props,mode){const str=mod(d?.scores?.Força),dex=mod(d?.scores?.Destreza);if(props.finesse)return dex>=str?'Destreza':'Força';if(mode==='ranged')return'Destreza';return'Força'}
function weaponDamage(props,hand){return hand.grip==='two'&&props.versatileDamage?props.versatileDamage:props.baseDamage}
function selfAttackStatus(character){const conditions=arr(character?.sheet?.runtime?.conditions).map(fold),blocked=['incapacitado','atordoado','paralisado','petrificado','inconsciente'].some(c=>conditions.includes(c)),disadvantage=['cego','amedrontado','envenenado','impedido','caido'].some(c=>conditions.includes(c)),advantage=conditions.includes('invisivel'),exhaustion=Math.max(0,Math.min(6,Math.floor(num(character?.sheet?.runtime?.exhaustion))));return{blocked,advantage:advantage&&!disadvantage,disadvantage:disadvantage&&!advantage,neutral:advantage===disadvantage,exhaustion,d20Penalty:-2*exhaustion}}

export function ammunitionCount(rows,weapon){const props=weaponPropertyProfile(weapon);if(!props.ammunition)return{required:false,count:null,row:null,key:''};const aliases=AMMO_SYNONYMS[props.ammoKey]||[props.ammoType],wanted=aliases.map(fold);let count=0,first=null;for(const row of arr(rows)){const name=fold(row?.name);if(wanted.some(alias=>name===alias||name.endsWith(` ${alias}`)||name.includes(alias))){count+=Math.max(0,Math.floor(num(row.qty)));if(!first)first=row}}return{required:true,count,row:first,key:props.ammoKey,label:props.ammoType||props.ammoKey||'munição'}}

export function weaponCombatProfile(d,weapon,character,ownedRows=[],slot='main'){
 if(!d||!weapon||!character)return null;const props=weaponPropertyProfile(weapon),hand=combatHandState(character,weapon),mode=attackModeFor(character,weapon,props),ability=attackAbility(d,props,mode),abilityMod=mod(d.scores[ability]),proficient=canUseWeapon(d.klass,weapon),ammo=ammunitionCount(ownedRows,weapon),oneHandAmmoNeedsFree=props.ammunition&&!props.twoHanded,ammoHandBlocked=oneHandAmmoNeedsFree&&hand.secondHandOccupied,mastered=masteryActive(character,d.klass,weapon,d.level),mastery=mastered?weapon.maestria||'':null,masteryKey=fold(mastery),toppleDc=masteryKey==='topple'?8+abilityMod+d.pbonus:null,status=selfAttackStatus(character);
 const unavailable=[];if(status.blocked)unavailable.push('Uma condição atual impede realizar a ação de ataque.');if(hand.blockedByHands)unavailable.push('A arma exige duas mãos para atacar.');if(ammo.required&&ammo.count<=0)unavailable.push(`Sem ${ammo.label||'munição'} registrada no inventário.`);if(ammoHandBlocked)unavailable.push('É necessária uma mão livre para carregar esta arma de munição de uma mão.');
 const range=mode==='thrown'?props.thrownRange:mode==='ranged'?props.ammunitionRange:null,reach=mode==='melee'?(props.reach?10:5):null,damage=weaponDamage(props,hand),damageModifier=abilityMod;
 return{slot,weapon,props,hand,mode,ability,abilityMod,proficient,attack:abilityMod+(proficient?d.pbonus:0)+status.d20Penalty,baseAttack:abilityMod+(proficient?d.pbonus:0),exhaustionPenalty:status.d20Penalty,damage,damageType:props.damageType,damageModifier:signed(damageModifier),heavyDisadvantage:heavyDisadvantage(d,props,mode),statusAdvantage:status.advantage,statusDisadvantage:status.disadvantage,range,reach,ammo,ammoHandBlocked,available:unavailable.length===0,unavailable,mastered,mastery,masteryDescription:mastered?MASTERY_DESCRIPTIONS[masteryKey]||'Maestria desbloqueada para esta arma.':'',toppleDc}
}

export function attacksPerAttackAction(klass,level,classFeatures=[]){const slug=fold(klass?.slug||klass?.name||klass?.nome),l=clampLevel(level);if(['fighter','guerreiro'].includes(slug))return l>=20?4:l>=11?3:l>=5?2:1;const hasExtra=arr(classFeatures).some(feature=>/extra attack|ataque extra/i.test(`${feature?.name||''} ${feature?.text||''}`));return hasExtra?2:1}
export function lightWeaponExtraAttack(mainProfile,offProfile){if(!mainProfile||!offProfile||mainProfile.weapon?.id===offProfile.weapon?.id||!mainProfile.props.light||!offProfile.props.light)return{available:false};const nick=offProfile.mastered&&fold(offProfile.mastery)==='nick';return{available:true,actionCost:nick?'action':'bonus',damageModifier:offProfile.abilityMod<0?signed(offProfile.abilityMod):'+0',nick}}

export function startNewTurn(character){const combat=ensureCombatState(character);combat.turn=normalizeTurn({actionUsed:false,bonusUsed:false,reactionUsed:false,attacks:0,attackActionAttacks:0,lightExtraUsed:false,loadingUses:{}});return combat.turn}
export function nextRound(character){const combat=ensureCombatState(character);combat.round=Math.max(1,combat.round+1);startNewTurn(character);return combat.round}
export function setTurnEconomy(character,kind,used){const combat=ensureCombatState(character),key=kind==='bonus'?'bonusUsed':kind==='reaction'?'reactionUsed':'actionUsed';combat.turn[key]=!!used;return combat.turn}
function actionKey(kind){return kind==='bonus'?'bonus':kind==='reaction'?'reaction':'action'}
export function registerWeaponAttack(character,profile,{kind='action',attackLimit=1,lightExtra=false}={}){
 const combat=ensureCombatState(character),turn=combat.turn,key=actionKey(kind),usedKey=key==='bonus'?'bonusUsed':key==='reaction'?'reactionUsed':'actionUsed';if(!profile?.available)return{ok:false,reason:profile?.unavailable?.[0]||'Ataque indisponível.'};
 if(lightExtra&&turn.lightExtraUsed)return{ok:false,reason:'O ataque extra da propriedade Leve já foi usado neste turno.'};
 if(key==='action'&&!lightExtra&&turn.actionUsed&&turn.attackActionAttacks>=Math.max(1,attackLimit))return{ok:false,reason:'Todos os ataques desta ação Atacar já foram usados.'};
 if(key!=='action'&&turn[usedKey])return{ok:false,reason:key==='bonus'?'A Ação Bônus já foi usada neste turno.':'A Reação já foi usada neste turno.'};
 if(profile.props.loading&&turn.loadingUses[key])return{ok:false,reason:`Loading permite apenas um disparo nesta ${key==='action'?'Ação':key==='bonus'?'Ação Bônus':'Reação'}.`};
 if(lightExtra){turn.lightExtraUsed=true;if(key==='bonus')turn.bonusUsed=true}else if(key==='action'){turn.attackActionAttacks+=1;if(turn.attackActionAttacks>=Math.max(1,attackLimit))turn.actionUsed=true}else turn[usedKey]=true;
 if(profile.props.loading)turn.loadingUses[key]=(turn.loadingUses[key]||0)+1;turn.attacks+=1;return{ok:true,turn,consumeAmmo:!!profile.ammo?.required,ammoRow:profile.ammo?.row||null}
}
export function recordAttack(character){const combat=ensureCombatState(character);combat.turn.attacks=Math.max(0,combat.turn.attacks+1);return combat.turn.attacks}
export function masteryDescription(name){return MASTERY_DESCRIPTIONS[fold(name)]||''}
