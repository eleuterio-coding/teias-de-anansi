import{arr,num,fold}from'./character-builder/state.js';
import{resolveWeaponAttack,applyDamageDefenses}from'./character-sheet-resolution-rules.js?v=20260902-resolution1';

const BPS=new Set(['concussao','perfurante','cortante']);
const flags=d=>new Set(arr(d?.featMechanics?.combatFlags));
const sum=rows=>arr(rows).reduce((total,row)=>total+(Number(row?.value)||0),0);
const isRangedWeapon=profile=>fold(profile?.weapon?.categoria||'').includes('distancia');
const isMeleeWeapon=profile=>!isRangedWeapon(profile);
const isThrownAttack=profile=>profile?.mode==='thrown';
const oneHanded=profile=>profile?.grip!=='two'&&!arr(profile?.weapon?.propriedades).some(p=>fold(p).includes('duas maos')||fold(p).includes('two-handed'));
const noOtherWeapon=profile=>!profile?.hand?.offhand;
const usesTwoHands=profile=>profile?.grip==='two'||arr(profile?.weapon?.propriedades).some(p=>fold(p).includes('duas maos')||fold(p).includes('two-handed'));
function conditionalRows(d,kind,profile){const rows=arr(d?.magicItemWeaponBonuses?.[kind]),weaponId=profile?.weapon?.id;return rows.filter(row=>{const scope=String(row?.scope||'');if(scope.includes('ammunition'))return!!profile?.props?.ammunition;if(row?.refId&&row.refId===weaponId)return true;if(row?.targetRefId&&row.targetRefId===weaponId)return true;if(scope==='oil-of-sharpness-target')return row.refId===weaponId||row.targetRefId===weaponId;return false})}
export function weaponResolutionContext(derived,profile,{lightExtra=false,target={}}={}){
 const f=flags(derived),attackBonuses=[],damageBonuses=[];
 const archery=Number(derived?.featMechanics?.rangedAttackBonus)||0;if(archery&&isRangedWeapon(profile))attackBonuses.push({source:'Archery',value:archery});
 if(f.has('duelingDamage2')&&isMeleeWeapon(profile)&&oneHanded(profile)&&noOtherWeapon(profile))damageBonuses.push({source:'Dueling',value:2});
 if(f.has('thrownWeaponDamage2')&&isThrownAttack(profile))damageBonuses.push({source:'Thrown Weapon Fighting',value:2});
 const conditionalAttack=conditionalRows(derived,'conditionalAttack',profile),conditionalDamage=conditionalRows(derived,'conditionalDamage',profile);if(conditionalAttack.length)attackBonuses.push({source:'Item mágico condicional',value:sum(conditionalAttack)});if(conditionalDamage.length)damageBonuses.push({source:'Item mágico condicional',value:sum(conditionalDamage)});
 const ignoreBpsResistance=f.has('ignoreBpsResistance')&&BPS.has(fold(profile?.damageType));const effectiveTarget=ignoreBpsResistance?{...target,resistances:arr(target?.resistances).filter(type=>fold(type)!==fold(profile?.damageType))}:target;
 return{attackBonus:sum(attackBonuses),damageBonus:sum(damageBonuses),attackBonuses,damageBonuses,suppressPositiveAbilityDamage:!!lightExtra&&!f.has('twoWeaponAbilityModifier'),greatWeaponFloor3:f.has('greatWeaponDamageFloor3')&&usesTwoHands(profile),ignoreBpsResistance,effectiveTarget}
}
function applyGreatWeaponFloor(result,target){if(!result?.damage?.dice?.terms)return result;let delta=0;for(const term of result.damage.dice.terms){if(term.kind!=='dice'||!Array.isArray(term.rolls))continue;const next=term.rolls.map(value=>Math.max(3,Number(value)||0));delta+=next.reduce((a,b)=>a+b,0)-term.rolls.reduce((a,b)=>a+b,0);term.rolls=next;term.subtotal=(term.sign||1)*next.reduce((a,b)=>a+b,0)}if(!delta)return result;result.damage.dice.total+=delta;result.damage.raw+=delta;const defense=applyDamageDefenses(result.damage.raw,result.damage.type,target);Object.assign(result.damage,defense);result.damage.greatWeaponFightingAdjustment=delta;return result}
export function resolveWeaponAttackWithContext({derived,profile,target={},lightExtra=false,advantage=false,disadvantage=false,rng=Math.random}={}){const context=weaponResolutionContext(derived,profile,{lightExtra,target}),result=resolveWeaponAttack({derived,profile,target:context.effectiveTarget,advantage,disadvantage,manualAttackBonus:context.attackBonus,manualDamageBonus:context.damageBonus,suppressPositiveAbilityDamage:context.suppressPositiveAbilityDamage,rng});result.context=context;if(result.ok&&result.damage&&context.greatWeaponFloor3&&!result.damage.graze)applyGreatWeaponFloor(result,context.effectiveTarget);return result}
