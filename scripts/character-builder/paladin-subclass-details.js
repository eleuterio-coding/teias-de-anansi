import{state,num,fold,mod}from'./state.js';

export function applyPaladinSubclassRuleDetails(d){
 if(d?.klass?.slug!=='paladin'||!d?.subclassMechanics)return d;
 const out=d.subclassMechanics,name=fold(out.name),level=num(d.level);
 if(name==='oath of glory'&&level>=7){d.speed=num(d.speed)+10;d.glorySpeedBonus=10}
 if(name==='oath of the watchers'&&level>=7){d.initiative=num(d.initiative)+num(d.pbonus);d.sentinelInitiativeBonus=num(d.pbonus)}
 if(name==='oath of the noble genies'&&!d.armor){
  const dex=mod(d.scores?.Destreza),cha=mod(d.scores?.Carisma),shield=state.c?.choices?.equipment?.shield?2:0,featBonus=num(d.featMechanics?.acBonus),candidate=10+dex+cha+shield+featBonus;
  if(candidate>num(d.ac))d.ac=candidate;d.genieSplendorAC=candidate
 }
 return d
}
