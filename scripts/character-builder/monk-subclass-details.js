import{arr,fold,mod}from'./state.js';

export function applyMonkSubclassRuleDetails(d){
 if(d?.klass?.slug!=='monk'||!d?.subclassMechanics)return d;
 const out=d.subclassMechanics,name=fold(out.name);
 if(name==='way of the kensei'){
  const selectedIds=[out.choices?.kenseiMelee,out.choices?.kenseiRanged].filter(Boolean),weaponId=d.weapon?.id;
  if(weaponId&&selectedIds.includes(weaponId)){
   d.wprof=true;
   d.wAbility='Destreza';
   d.attack=mod(d.scores?.Destreza)+Number(d.pbonus||0);
   d.kenseiWeaponActive=true;
   d.kenseiWeaponDamageDie=out.martialArtsDie;
  }
 }
 if(name==='warrior of shadow'){
  const vision=arr(out.senses).find(x=>x.name==='Darkvision');
  if(vision)d.subclassDarkvision={range:vision.range,stack:vision.stack||''};
 }
 return d
}
