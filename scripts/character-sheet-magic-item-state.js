import{applyCampaignInventoryRows,inventoryRowKey}from'./character-sheet-inventory-rules.js';

const bool=value=>value===true;
const cleanKey=value=>String(value||'').trim();
const uniq=values=>[...new Set(values.filter(Boolean))];
const abilityMod=value=>Math.floor((Number(value||0)-10)/2);
const magicSlug=row=>String(row?.refId||'').trim().toLowerCase().split(':').pop();
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Força','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante','Concussão','Perfurante','Cortante'];
const PHYSICAL_DAMAGE_TYPES=['Concussão','Perfurante','Cortante'];
const GIANT_STRENGTH_SCORES=[21,23,25,27,29];
const CARPET_FLY_SPEEDS=[30,40,60,80];
const cleanDamageType=value=>DAMAGE_TYPES.find(type=>type.toLocaleLowerCase('pt-BR')===String(value||'').trim().toLocaleLowerCase('pt-BR'))||null;
const magicBonus=(row,parameters={})=>{
 const explicit=Number(parameters.magicBonus??row?.magicBonus??row?.variantBonus);
 if([1,2,3].includes(explicit))return explicit;
 if(['armor-1-2-or-3','ammunition-1-2-or-3','weapon-1-2-or-3'].includes(magicSlug(row)))return 0;
 const text=`${row?.name||''} ${row?.refId||''}`;
 const match=text.match(/(?:\+|plus[- ]?)([123])\b/i);
 return match?Number(match[1]):0
};
const needsActive=id=>new Set([
 'carpet-of-flying','crystal-ball-of-true-seeing','defender','horseshoes-of-a-zephyr','horseshoes-of-speed',
 'oil-of-etherealness','oil-of-sharpness','oil-of-slipperiness','philter-of-love','potion-of-diminution',
 'potion-of-gaseous-form','potion-of-giant-strength','potion-of-growth','potion-of-heroism','potion-of-speed',
 'potion-of-vitality','staff-of-the-python'
]).has(id);

export function ensureMagicItemState(character){
 if(!character)return null;character.sheet=character.sheet||{};
 let state=character.sheet.magicItems;
 if(!state||typeof state!=='object'||Array.isArray(state))state={};
 state.usage=state.usage&&typeof state.usage==='object'&&!Array.isArray(state.usage)?state.usage:{};
 character.sheet.magicItems=state;return state
}

export function magicItemUsage(character,item){
 const state=ensureMagicItemState(character),key=inventoryRowKey(item),saved=state?.usage?.[key];
 return{key,equipped:bool(saved?.equipped),attuned:bool(saved?.attuned),active:bool(saved?.active),parameters:{...(saved?.parameters||{})}}
}

export function activeMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Map(applyCampaignInventoryRows(baseRows,character).map(row=>[row.key,row]));
 const active=[];
 for(const[key,saved]of Object.entries(state.usage)){
  const row=available.get(key);if(!row)continue;
  const equipped=bool(saved?.equipped),attuned=bool(saved?.attuned),effectActive=bool(saved?.active),parameters={...(saved?.parameters||{})};
  if(equipped||attuned||effectActive)active.push({key,row,equipped,attuned,active:effectActive,parameters})
 }
 return active
}

export function validateMagicItemParameters(item,input={}){
 const id=magicSlug(item),parameters={};
 if(['armor-1-2-or-3','ammunition-1-2-or-3','weapon-1-2-or-3'].includes(id)){
  const bonus=Number(input.magicBonus);
  if(![1,2,3].includes(bonus))return{ok:false,reason:'Selecione explicitamente a variante +1, +2 ou +3 do item mágico.'};
  parameters.magicBonus=bonus
 }
 if(id==='armor-of-resistance'){
  const damageType=cleanDamageType(input.damageType);
  if(!damageType||PHYSICAL_DAMAGE_TYPES.includes(damageType))return{ok:false,reason:'Selecione um tipo de dano válido da tabela da Armadura de Resistência.'};
  parameters.damageType=damageType
 }
 if(id==='armor-of-vulnerability'){
  const damageType=cleanDamageType(input.damageType);
  if(!damageType||!PHYSICAL_DAMAGE_TYPES.includes(damageType))return{ok:false,reason:'Selecione Concussão, Perfurante ou Cortante para a Armadura da Vulnerabilidade.'};
  parameters.damageType=damageType
 }
 if(id==='potion-of-giant-strength'){
  const strengthScore=Number(input.strengthScore);
  if(!GIANT_STRENGTH_SCORES.includes(strengthScore))return{ok:false,reason:'Selecione a variante da Poção de Força do Gigante (21, 23, 25, 27 ou 29 de Força).'};
  parameters.strengthScore=strengthScore
 }
 if(id==='carpet-of-flying'){
  const flyingSpeed=Number(input.flyingSpeed);
  if(!CARPET_FLY_SPEEDS.includes(flyingSpeed))return{ok:false,reason:'Selecione o deslocamento de voo da variante do Tapete Voador (30, 40, 60 ou 80 pés).'};
  parameters.flyingSpeed=flyingSpeed
 }
 if(id==='defender'){
  const acTransfer=Math.max(0,Math.min(3,Math.floor(Number(input.acTransfer)||0)));parameters.acTransfer=acTransfer
 }
 if(id==='oil-of-sharpness'&&input.targetRefId)parameters.targetRefId=String(input.targetRefId);
 return{ok:true,parameters}
}

export function setMagicItemUsage(character,baseRows=[],item,input={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const key=inventoryRowKey(item),available=applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key);
 if(!available)return{ok:false,reason:'O item não está disponível no inventário atual.',key};
 const state=ensureMagicItemState(character),equipped=bool(input.equipped),attuned=bool(input.attuned),active=bool(input.active),previous=state.usage[key]||{};
 let parameters={...(previous.parameters||{})};
 if(input.parameters!=null){const validated=validateMagicItemParameters(available,input.parameters);if(!validated.ok)return{ok:false,reason:validated.reason,key};parameters=validated.parameters}
 if(!equipped&&!attuned&&!active){delete state.usage[key];return{ok:true,key,equipped:false,attuned:false,active:false,parameters:{},row:available}}
 state.usage[key]={equipped,attuned,active,parameters,updatedAt:new Date().toISOString()};
 return{ok:true,key,equipped,attuned,active,parameters,row:available}
}

export function setMagicItemParameters(character,baseRows=[],item,parameters={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const key=inventoryRowKey(item),available=applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key);
 if(!available)return{ok:false,reason:'O item não está disponível no inventário atual.',key};
 const validated=validateMagicItemParameters(available,parameters);if(!validated.ok)return{ok:false,reason:validated.reason,key};
 const state=ensureMagicItemState(character),previous=state.usage[key]||{};
 state.usage[key]={equipped:bool(previous.equipped),attuned:bool(previous.attuned),active:bool(previous.active),parameters:validated.parameters,updatedAt:new Date().toISOString()};
 return{ok:true,key,parameters:validated.parameters}
}

export function clearUnavailableMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Set(applyCampaignInventoryRows(baseRows,character).map(row=>cleanKey(row.key)));
 const cleared=[];
 for(const key of Object.keys(state.usage))if(!available.has(cleanKey(key))){delete state.usage[key];cleared.push(key)}
 return cleared
}

export function magicItemPersistentOutcome(character,baseRows=[]){
 const outcome={abilityMinimums:{},abilityCheckBonus:0,savingThrowBonus:0,acBonus:0,speedBonus:0,flySpeed:0,mountSpeedBonus:0,resistances:[],immunities:[],vulnerabilities:[],flags:{},weaponAttackBonuses:[],weaponDamageBonuses:[],conditionalAttackBonuses:[],conditionalDamageBonuses:[],activeItems:[],applied:[],pending:[]};
 for(const usage of activeMagicItemUsages(character,baseRows)){
  const row=usage.row,id=magicSlug(row),parameters=usage.parameters||{};
  outcome.activeItems.push({id,key:usage.key,equipped:usage.equipped,attuned:usage.attuned,active:usage.active,parameters});
  if(id==='amulet-of-health'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.abilityMinimums.Constituição=Math.max(19,Number(outcome.abilityMinimums.Constituição||0));
   outcome.applied.push({id,effect:'constitution-minimum',value:19});continue
  }
  if(id==='adamantine-armor'){
   if(!usage.equipped)continue;
   outcome.flags.criticalHitsBecomeNormal=true;outcome.applied.push({id,effect:'critical-hits-become-normal',value:true});continue
  }
  if(id==='amulet-of-proof-against-detection-and-location'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.flags.divinationTargetingBlocked=true;outcome.flags.scryingSensorsBlocked=true;
   outcome.applied.push({id,effect:'divination-protection',value:true});continue
  }
  if(id==='armor-1-2-or-3'||/^armor-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row,parameters);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da armadura não está registrada no estado do item.'});continue}
   outcome.acBonus+=bonus;outcome.applied.push({id,effect:'ac-bonus',value:bonus});continue
  }
  if(id==='weapon-1-2-or-3'||/^weapon-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row,parameters);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da arma não está registrada no estado do item.'});continue}
   const selector={kind:'magic-item',refId:row?.refId||id,key:usage.key,scope:'this-weapon'};
   outcome.weaponAttackBonuses.push({...selector,value:bonus});outcome.weaponDamageBonuses.push({...selector,value:bonus});
   outcome.applied.push({id,effect:'weapon-attack-and-damage-bonus',value:bonus});continue
  }
  if(id==='ammunition-1-2-or-3'||/^ammunition-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row,parameters);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da munição não está registrada no estado do item.'});continue}
   const selector={kind:'magic-item',refId:row?.refId||id,key:usage.key};
   outcome.conditionalAttackBonuses.push({...selector,value:bonus,scope:'attack-with-this-ammunition'});
   outcome.conditionalDamageBonuses.push({...selector,value:bonus,scope:'damage-with-this-ammunition'});
   outcome.applied.push({id,effect:'attack-and-damage-bonus',value:bonus,scope:'this-ammunition'});continue
  }
  if(id==='stone-of-good-luck-luckstone'){
   if(!usage.attuned)continue;
   outcome.abilityCheckBonus+=1;outcome.savingThrowBonus+=1;outcome.applied.push({id,effect:'ability-check-and-save-bonus',value:1});continue
  }
  if(id==='mithral-armor'){
   if(!usage.equipped)continue;
   outcome.flags.ignoreArmorStrengthRequirement=true;outcome.flags.ignoreArmorStealthDisadvantage=true;
   outcome.applied.push({id,effect:'mithral-armor-penalties-ignored',value:true});continue
  }
  if(id==='scimitar-of-speed'){
   if(!(usage.equipped&&usage.attuned))continue;
   const selector={kind:'magic-item',refId:row?.refId||id,key:usage.key,scope:'scimitar-of-speed'};
   outcome.weaponAttackBonuses.push({...selector,value:2});outcome.weaponDamageBonuses.push({...selector,value:2});outcome.flags.scimitarOfSpeedBonusActionAttack=true;
   outcome.applied.push({id,effect:'weapon-attack-and-damage-bonus',value:2});continue
  }
  if(id==='armor-of-resistance'){
   if(!(usage.equipped&&usage.attuned))continue;
   const damageType=cleanDamageType(parameters.damageType||row?.damageType||row?.magicDamageType);
   if(!damageType||PHYSICAL_DAMAGE_TYPES.includes(damageType)){outcome.pending.push({id,reason:'O tipo de dano escolhido pelo Mestre ainda não está registrado no estado do item.'});continue}
   outcome.resistances.push(damageType);outcome.applied.push({id,effect:'resistance',value:damageType});continue
  }
  if(id==='armor-of-invulnerability'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.resistances.push('Concussão','Perfurante','Cortante');
   outcome.applied.push({id,effect:'resistance',value:['Concussão','Perfurante','Cortante']});continue
  }
  if(id==='armor-of-vulnerability'){
   if(!(usage.equipped&&usage.attuned))continue;
   const damageType=cleanDamageType(parameters.damageType||row?.damageType||row?.magicDamageType);
   if(!damageType||!PHYSICAL_DAMAGE_TYPES.includes(damageType)){outcome.pending.push({id,reason:'O tipo de dano resistente da Armadura da Vulnerabilidade ainda não está registrado no estado do item.'});continue}
   outcome.resistances.push(damageType);outcome.vulnerabilities.push(...PHYSICAL_DAMAGE_TYPES.filter(type=>type!==damageType));
   outcome.applied.push({id,effect:'resistance-and-vulnerability',value:{resistance:damageType,vulnerabilities:PHYSICAL_DAMAGE_TYPES.filter(type=>type!==damageType)}});continue
  }
  if(id==='carpet-of-flying'){
   if(!usage.active)continue;const speed=Number(parameters.flyingSpeed)||0;
   if(!speed){outcome.pending.push({id,reason:'A variante de deslocamento do Tapete Voador não está registrada.'});continue}
   outcome.flySpeed=Math.max(outcome.flySpeed,speed);outcome.flags.ridingFlyingCarpet=true;outcome.applied.push({id,effect:'fly-speed',value:speed});continue
  }
  if(id==='horseshoes-of-speed'){
   if(!(usage.equipped||usage.active))continue;outcome.mountSpeedBonus=Math.max(outcome.mountSpeedBonus,30);outcome.flags.mountHorseshoesOfSpeed=true;outcome.applied.push({id,effect:'mount-speed-bonus',value:30});continue
  }
  if(id==='horseshoes-of-a-zephyr'){
   if(!(usage.equipped||usage.active))continue;outcome.flags.mountHoversAboveGround=true;outcome.flags.mountIgnoresDifficultTerrainFromGround=true;outcome.applied.push({id,effect:'mount-zephyr-movement',value:true});continue
  }
  if(id==='efficient-quiver'){
   if(!(usage.equipped||usage.active))continue;outcome.flags.efficientQuiverStorage=true;outcome.applied.push({id,effect:'structured-storage',value:true});continue
  }
  if(id==='potion-of-giant-strength'){
   if(!usage.active)continue;const score=Number(parameters.strengthScore)||0;
   if(!score){outcome.pending.push({id,reason:'A variante de Força da poção ainda não está registrada.'});continue}
   outcome.abilityMinimums.Força=Math.max(score,Number(outcome.abilityMinimums.Força||0));outcome.applied.push({id,effect:'strength-minimum',value:score});continue
  }
  if(id==='defender'){
   if(!(usage.equipped&&usage.attuned))continue;const transfer=Math.max(0,Math.min(3,Number(parameters.acTransfer)||0)),weaponBonus=3-transfer;
   outcome.acBonus+=transfer;const selector={kind:'magic-item',refId:row?.refId||id,key:usage.key,scope:'defender'};
   if(weaponBonus){outcome.weaponAttackBonuses.push({...selector,value:weaponBonus});outcome.weaponDamageBonuses.push({...selector,value:weaponBonus})}
   outcome.flags.defenderTransfer=transfer;outcome.applied.push({id,effect:'defender-allocation',value:{ac:transfer,attackDamage:weaponBonus}});continue
  }
  if(id==='oil-of-sharpness'){
   if(!usage.active)continue;outcome.flags.oilOfSharpnessActive=true;const selector={kind:'magic-item',refId:parameters.targetRefId||row?.refId||id,key:usage.key,scope:'oil-of-sharpness-target'};
   outcome.conditionalAttackBonuses.push({...selector,value:3});outcome.conditionalDamageBonuses.push({...selector,value:3});outcome.applied.push({id,effect:'temporary-weapon-bonus',value:3});continue
  }
  if(id==='crystal-ball-of-true-seeing'&&usage.active){outcome.flags.crystalBallTrueSeeingActive=true;outcome.applied.push({id,effect:'true-seeing-while-scrying',value:true});continue}
  if(id==='oil-of-etherealness'&&usage.active){outcome.flags.etherealnessActive=true;outcome.applied.push({id,effect:'etherealness-active',value:true});continue}
  if(id==='oil-of-slipperiness'&&usage.active){outcome.flags.freedomOfMovementFromOilActive=true;outcome.applied.push({id,effect:'freedom-of-movement-active',value:true});continue}
  if(id==='philter-of-love'&&usage.active){outcome.flags.philterOfLoveActive=true;outcome.applied.push({id,effect:'philter-of-love-active',value:true});continue}
  if(id==='potion-of-diminution'&&usage.active){outcome.flags.diminutionActive=true;outcome.applied.push({id,effect:'diminution-active',value:true});continue}
  if(id==='potion-of-gaseous-form'&&usage.active){outcome.flags.gaseousFormActive=true;outcome.applied.push({id,effect:'gaseous-form-active',value:true});continue}
  if(id==='potion-of-growth'&&usage.active){outcome.flags.growthActive=true;outcome.applied.push({id,effect:'growth-active',value:true});continue}
  if(id==='potion-of-heroism'&&usage.active){outcome.flags.heroismPotionActive=true;outcome.applied.push({id,effect:'heroism-active',value:true});continue}
  if(id==='potion-of-speed'&&usage.active){outcome.flags.hasteFromPotionActive=true;outcome.applied.push({id,effect:'haste-active',value:true});continue}
  if(id==='potion-of-vitality'&&usage.active){outcome.flags.vitalityPotionActive=true;outcome.applied.push({id,effect:'vitality-active',value:true});continue}
  if(id==='staff-of-the-python'&&usage.active){outcome.flags.staffOfPythonTransformed=true;outcome.applied.push({id,effect:'staff-transformed',value:true});continue}
  if(needsActive(id)&&usage.active){outcome.flags[`magicItem:${id}:active`]=true;outcome.applied.push({id,effect:'active-state',value:true});continue}
 }
 outcome.resistances=uniq(outcome.resistances);outcome.immunities=uniq(outcome.immunities);outcome.vulnerabilities=uniq(outcome.vulnerabilities);
 return outcome
}

export function applyMagicItemPersistentEffects(derived,character,baseRows=[]){
 if(!derived)return derived;
 const outcome=magicItemPersistentOutcome(character,baseRows),scores=derived.scores||{},oldCon=Number(scores.Constituição||0);
 for(const[ability,minimum]of Object.entries(outcome.abilityMinimums||{}))if(Number(minimum)>Number(scores[ability]||0))scores[ability]=Number(minimum);
 const newCon=Number(scores.Constituição||0);
 if(newCon>oldCon){const delta=abilityMod(newCon)-abilityMod(oldCon);if(Number.isFinite(Number(derived.hp)))derived.hp=Number(derived.hp)+Math.max(0,Number(derived.level||0))*delta;if(derived.barbarianMechanics?.unarmoredDefense&&Number.isFinite(Number(derived.ac)))derived.ac=Number(derived.ac)+delta}
 if(outcome.acBonus&&Number.isFinite(Number(derived.ac)))derived.ac=Number(derived.ac)+outcome.acBonus;
 if(outcome.speedBonus&&Number.isFinite(Number(derived.speed)))derived.speed=Number(derived.speed)+outcome.speedBonus;
 derived.globalAbilityCheckBonus=Number(derived.globalAbilityCheckBonus||0)+outcome.abilityCheckBonus;
 derived.globalSavingThrowBonus=Number(derived.globalSavingThrowBonus||0)+outcome.savingThrowBonus;
 derived.resistances=uniq([...(derived.resistances||[]),...outcome.resistances]);
 derived.immunities=uniq([...(derived.immunities||[]),...outcome.immunities]);
 derived.vulnerabilities=uniq([...(derived.vulnerabilities||[]),...outcome.vulnerabilities]);
 derived.magicItemFlags={...(derived.magicItemFlags||{}),...outcome.flags};
 derived.magicItemMovement={flySpeed:outcome.flySpeed,mountSpeedBonus:outcome.mountSpeedBonus};
 derived.magicItemWeaponBonuses={attack:outcome.weaponAttackBonuses,damage:outcome.weaponDamageBonuses,conditionalAttack:outcome.conditionalAttackBonuses,conditionalDamage:outcome.conditionalDamageBonuses};
 derived.magicItemMechanics=outcome;return derived
}
