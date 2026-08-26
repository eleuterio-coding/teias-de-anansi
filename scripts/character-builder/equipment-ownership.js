import{state,arr,num,fold,mod,signed}from'./state.js';
import{packagePhysicalItems}from'./starting-equipment-rules.js?v=20260824-starting-equipment1';
import{featMechanicalOutcome}from'./feat-mechanics.js';

const currentClass=()=>state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null;
const currentSpecies=()=>state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null;
const selectedLineage=species=>species?.lineages?.find(x=>x.name===state.c?.choices?.species?.lineage)||null;
function proficiencyEntries(klass){
 const species=currentSpecies(),lineage=selectedLineage(species),traits=[...arr(species?.traits),...arr(lineage?.traits)].map(t=>t?.text||'');
 return[...arr(klass?.proficienciesRaw),...arr(klass?.proficiencies),...traits].map(fold).filter(Boolean)
}
const proficiencyText=klass=>proficiencyEntries(klass).join(' ');
const weaponProps=weapon=>arr(weapon?.propriedades).map(fold);
function martialEntryAllows(entry,weapon){
 const props=weaponProps(weapon),light=props.some(p=>p==='light'||p.startsWith('light ')),finesse=props.some(p=>p==='finesse'||p.startsWith('finesse '));
 if(/^(martial weapons?|armas marciais)$/.test(entry))return true;
 if(/^martial weapons? with the light property$/.test(entry))return light;
 if(/^martial weapons? with the finesse or light property$/.test(entry))return finesse||light;
 if(/^armas marciais.*propriedade.*leve$/.test(entry)&&!/acuidade|finesse/.test(entry))return light;
 if(/^armas marciais.*(?:acuidade|finesse).*leve/.test(entry)||/^armas marciais.*leve.*(?:acuidade|finesse)/.test(entry))return finesse||light;
 return false
}

export function canUseWeapon(klass=currentClass(),weapon){
 klass=klass||currentClass();if(!klass||!weapon)return false;
 const entries=proficiencyEntries(klass),c=fold(weapon.categoria),fm=featMechanicalOutcome();
 if(c.includes('simples')&&entries.some(e=>/^(simple weapons?|armas simples)$/.test(e)))return true;
 if(c.includes('marcial')&&(arr(fm.weaponTraining).includes('Marcial')||entries.some(e=>martialEntryAllows(e,weapon))))return true;
 const names=[weapon.nome,weapon.nome_original].filter(Boolean).map(fold);return names.some(name=>entries.some(entry=>entry===name||entry===`weapon: ${name}`||entry===`arma: ${name}`))
}
export function canUseArmor(klass=currentClass(),armor){
 klass=klass||currentClass();if(!klass||!armor||fold(armor.categoria)==='escudo')return false;
 const p=proficiencyText(klass),cat=fold(armor.categoria),fm=featMechanicalOutcome();
 if(cat==='leve')return/light armor|armadura leve|armaduras leves|all armor|todas as armaduras/.test(p)||arr(fm.armorTraining).includes('Leve');
 if(cat==='media')return/medium armor|armadura media|armaduras medias|all armor|todas as armaduras/.test(p)||arr(fm.armorTraining).includes('Média');
 if(cat==='pesada')return/heavy armor|armadura pesada|armaduras pesadas|all armor|todas as armaduras/.test(p)||arr(fm.armorTraining).includes('Pesada');
 return true
}
export function canUseShield(klass=currentClass()){
 klass=klass||currentClass();if(!klass)return false;
 const p=proficiencyText(klass),fm=featMechanicalOutcome();
 return/shield|escudo/.test(p)||!!fm.shieldTraining
}
export function purchasePermission(item,klass=currentClass()){
 klass=klass||currentClass();if(!item)return{ok:false,reason:'Item inválido.'};
 if(item.kind==='weapon')return canUseWeapon(klass,item.data||state.catalogs.weapons.find(w=>w.id===item.refId))?{ok:true}:{ok:false,reason:'Sem proficiência com esta arma.'};
 if(item.kind==='armor')return canUseArmor(klass,item.data||state.catalogs.armors.find(a=>a.id===item.refId))?{ok:true}:{ok:false,reason:'Sem proficiência com esta armadura.'};
 if(item.kind==='shield')return canUseShield(klass)?{ok:true}:{ok:false,reason:'Sem proficiência com escudos.'};
 return{ok:true}
}

function normalizedName(value){return fold(String(value||'').replace(/^\d+\s*[x×]\s*/i,'').replace(/\s*\([^)]*\)\s*$/,'').trim())}
function matchesName(row,name,fields){const wanted=normalizedName(name);return fields.some(field=>normalizedName(row?.[field])===wanted)}
function weaponByName(name){return state.catalogs.weapons.find(w=>matchesName(w,name,['nome','nome_original']))||null}
function armorByName(name){return state.catalogs.armors.find(a=>matchesName(a,name,['nome']))||null}
function classifyNamedItem(item,source='Equipamento inicial'){
 const name=item?.nome||item?.name||'Item',qty=Math.max(1,Math.floor(num(item?.quantidade??item?.quantity)||1)),weapon=weaponByName(name);
 if(weapon)return{kind:'weapon',refId:weapon.id,name:weapon.nome,qty,source,data:weapon};
 const armor=armorByName(name);if(armor)return{kind:fold(armor.categoria)==='escudo'?'shield':'armor',refId:armor.id,name:armor.nome,qty,source,data:armor};
 return{kind:'belonging',refId:null,name,qty,source,data:null}
}
function purchaseRow(id,qty,snapshot){
 const amount=Math.max(0,Math.floor(num(qty)));if(!amount)return null;
 if(id.startsWith('weapon:')){const refId=id.slice(7),weapon=state.catalogs.weapons.find(w=>w.id===refId);if(weapon)return{kind:'weapon',refId,name:weapon.nome,qty:amount,source:'Compra',data:weapon}}
 if(id.startsWith('armor:')){const refId=id.slice(6),armor=state.catalogs.armors.find(a=>a.id===refId);if(armor)return{kind:fold(armor.categoria)==='escudo'?'shield':'armor',refId,name:armor.nome,qty:amount,source:'Compra',data:armor}}
 if(snapshot?.name)return{kind:snapshot.kind||'belonging',refId:snapshot.refId||null,name:snapshot.name,qty:amount,source:'Compra',data:null,area:snapshot.area||'',category:snapshot.category||''};
 return null
}
function aggregate(rows){
 const map=new Map();
 for(const row of rows.filter(Boolean)){
  const key=`${row.kind}|${row.refId||normalizedName(row.name)}`;
  const old=map.get(key);if(old)old.qty+=row.qty;else map.set(key,{...row})
 }
 return[...map.values()]
}
export function ownedEquipment({includeLegacyActive=true}={}){
 const rows=[],bg=state.catalogs.backgrounds.find(x=>x.id===state.c?.refs?.background)||null,level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),choice=state.c?.choices?.background?.equipment||'A';
 for(const item of packagePhysicalItems(bg,choice).filter(Boolean))rows.push(classifyNamedItem(item,'Pacote inicial'));
 const purchases=state.c?.choices?.purchases||{},snapshots=purchases.items||{};
 for(const[id,qty]of Object.entries(purchases.quantities||{})){const row=purchaseRow(id,qty,snapshots[id]);if(row)rows.push(row)}
 if(level>1){for(let i=rows.length-1;i>=0;i--)if(rows[i].source==='Pacote inicial')rows.splice(i,1)}
 let all=aggregate(rows);
 if(includeLegacyActive){
  const weaponId=state.c?.choices?.equipment?.weapon,armorId=state.c?.choices?.equipment?.armor,has=(kind,refId)=>all.some(row=>row.kind===kind&&row.refId===refId);
  if(weaponId&&!has('weapon',weaponId)){const weapon=state.catalogs.weapons.find(w=>w.id===weaponId);if(weapon)all.push({kind:'weapon',refId:weapon.id,name:weapon.nome,qty:1,source:'Equipamento ativo legado',data:weapon})}
  if(armorId&&!has('armor',armorId)){const armor=state.catalogs.armors.find(a=>a.id===armorId);if(armor&&fold(armor.categoria)!=='escudo')all.push({kind:'armor',refId:armor.id,name:armor.nome,qty:1,source:'Equipamento ativo legado',data:armor})}
  if(state.c?.choices?.equipment?.shield){const shield=state.catalogs.armors.find(a=>fold(a.categoria)==='escudo');if(shield&&!has('shield',shield.id))all.push({kind:'shield',refId:shield.id,name:shield.nome,qty:1,source:'Equipamento ativo legado',data:shield})}
  all=aggregate(all)
 }
 return{all,weapons:all.filter(x=>x.kind==='weapon'),armors:all.filter(x=>x.kind==='armor'),shields:all.filter(x=>x.kind==='shield'),belongings:all.filter(x=>!['weapon','armor','shield'].includes(x.kind))}
}
export function ownedItemCount(rows){return arr(rows).reduce((sum,row)=>sum+Math.max(0,Math.floor(num(row.qty))),0)}
export function formatOwnedRows(rows){return arr(rows).length?arr(rows).map(row=>`${row.qty>1?`${row.qty}× `:''}${row.name}`).join(', '):'—'}
export function weaponAttackProfile(d,weapon){
 if(!d||!weapon)return null;
 const dex=mod(d.scores.Destreza),str=mod(d.scores.Força),ranged=fold(weapon.categoria).includes('distancia'),finesse=arr(weapon.propriedades).some(x=>fold(x).includes('finesse')),ability=ranged?'Destreza':finesse?(dex>=str?'Destreza':'Força'):'Força',abilityMod=mod(d.scores[ability]),proficient=canUseWeapon(d.klass,weapon);
 return{ability,abilityMod,proficient,attack:abilityMod+(proficient?d.pbonus:0),damageModifier:signed(abilityMod)}
}
