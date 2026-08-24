import{state,arr,num,fold,uniq}from'./state.js';

const findByNames=(rows,names)=>rows.find(x=>names.includes(fold(x?.name)));
const traitName=t=>fold(t?.originalName||t?.name||'');
const cloneTraits=v=>arr(v).map(x=>({...x,choiceDefs:arr(x.choiceDefs).map(d=>({...d}))}));
// Legados planares de Eberron normalizados do pacote Tiefling — Eberron: Dolurrhi, Fernian, Kythrian, Mabaran, Risian, Sakah e Shavaran.

function migrateSpecies(variant,base,lineageName){
 if(!variant||!base||state.c?.refs?.species!==variant.id)return;
 state.c.refs.species=base.id;
 state.c.choices.species=state.c.choices.species||{};
 state.c.choices.species.lineage=lineageName
}
function normalizeLineageNames(base,label,prefixes){
 if(!base)return;
 base.lineageLabel=label;
 for(const lineage of arr(base.lineages)){
  const old=lineage.name;
  let next=old;
  for(const prefix of prefixes){const rx=new RegExp(`^${prefix}\\s*:\\s*`,'i');if(rx.test(next)){next=next.replace(rx,'');break}}
  lineage.aliases=uniq([old,...arr(lineage.aliases)]);
  lineage.name=next;
  if(state.c?.refs?.species===base.id&&state.c?.choices?.species?.lineage===old)state.c.choices.species.lineage=next
 }
}
function fullPackageLineage(variant,name,fixedSkills=[]){return{
 name,aliases:uniq([variant.name,...arr(variant.aliases)]),replaceBaseTraits:true,packageId:variant.id,source:variant.source,ruleset:variant.ruleset,revision:variant.revision,status:variant.status,compatibleWith:arr(variant.compatibleWith),sizes:arr(variant.sizes),speed:num(variant.speed)||30,traits:cloneTraits(variant.traits),abilityBonuses:arr(variant.abilityBonuses).map(x=>({...x})),fixedSkills:[...fixedSkills]
}}
function moveFullPackage(rows,baseNames,variantNames,lineageName,label,fixedSkills=[]){
 const base=findByNames(rows,baseNames),variant=findByNames(rows,variantNames);if(!base||!variant)return rows;
 normalizeLineageNames(base,label,label==='Linhagem Élfica'?['Linhagem Élfica','Elven Lineage']:label==='Linhagem Gnômica'?['Linhagem Gnômica','Gnomish Lineage']:[]);
 base.lineageLabel=label;
 const lineage=fullPackageLineage(variant,lineageName,fixedSkills);
 base.lineages=[...arr(base.lineages).filter(x=>fold(x.name)!==fold(lineageName)&&!arr(x.aliases).some(a=>variantNames.includes(fold(a)))),lineage];
 migrateSpecies(variant,base,lineageName);
 return rows.filter(x=>x!==variant)
}
function legacyTieflingText(row){
 const out=[];
 if(row.resistencia&&row.resistencia!=='—')out.push(`Resistência: ${row.resistencia}.`);
 if(row.nivel1&&row.nivel1!=='—')out.push(`Nível 1: ${row.nivel1}`);
 if(row.nivel3&&row.nivel3!=='—')out.push(`Nível 3: ${row.nivel3}`);
 if(row.nivel5&&row.nivel5!=='—')out.push(`Nível 5: ${row.nivel5}`);
 if(row.atributo_conjuracao&&row.atributo_conjuracao!=='—')out.push(`Atributo de conjuração: ${row.atributo_conjuracao}`);
 return out.join('\n')
}
function tieflingLineageFromLegacy(row){
 const ability=String(row.atributo_conjuracao||'');
 return{name:row.nome,aliases:uniq([row.nome_original].filter(Boolean)),replaceTraitNames:['Fiendish Legacy','Legado Ínfero'],source:row.fonte,ruleset:'5e',revision:2014,status:row.status,compatibleWith:['5.5e'],spellAbilityFixed:/^carisma\b/i.test(ability)?'Carisma':null,spellAbilityOptions:/inteligencia|inteligência/i.test(ability)&&/sabedoria/i.test(ability)&&/carisma/i.test(ability)?['Inteligência','Sabedoria','Carisma']:[],traits:[{name:row.nome_original||row.nome,originalName:row.nome_original||row.nome,text:legacyTieflingText(row)}]}
}
function migrateOldTieflingChoice(tiefling,tieflingData){
 const choices=state.c?.choices?.species;if(!choices?.tieflingVariant||state.c?.refs?.species!==tiefling?.id)return;
 const row=arr(tieflingData?.mecanicas).find(x=>x.id===choices.tieflingVariant);if(row&&arr(tiefling.lineages).some(x=>fold(x.name)===fold(row.nome)))choices.lineage=row.nome;
 delete choices.tieflingVariant
}
function addTieflingVariants(rows,tieflingData){
 const tiefling=findByNames(rows,['tiefling']);if(!tiefling)return rows;
 normalizeLineageNames(tiefling,'Legado Tiefling',['Legado Ínfero','Fiendish Legacy']);
 tiefling.lineageLabel='Legado Tiefling';
 const eberron=findByNames(rows,['tiefling — eberron','tiefling - eberron','tiefling eberron']);
 if(eberron){
  const planar=arr(eberron.traits).filter(t=>/legacy$/i.test(t.originalName||t.name||'')).map(t=>({name:String(t.originalName||t.name).replace(/\s+Legacy$/i,''),replaceTraitNames:['Fiendish Legacy','Legado Ínfero'],source:eberron.source,ruleset:eberron.ruleset,revision:eberron.revision,status:eberron.status,compatibleWith:arr(eberron.compatibleWith),spellAbilityOptions:['Inteligência','Sabedoria','Carisma'],traits:[{...t,choiceDefs:[...arr(t.choiceDefs),{suffix:'spell-ability',type:'ability',label:'Atributo de conjuração',options:['Inteligência','Sabedoria','Carisma']}]}]}));
  tiefling.lineages=[...arr(tiefling.lineages),...planar.filter(p=>!arr(tiefling.lineages).some(x=>fold(x.name)===fold(p.name)))];
  if(state.c?.refs?.species===eberron.id){state.c.refs.species=tiefling.id;state.c.choices.species=state.c.choices.species||{};state.c.choices.species.lineage=null}
  rows=rows.filter(x=>x!==eberron)
 }
 const legacy=arr(tieflingData?.mecanicas).filter(x=>/legado_compativel_conteudo_unico/i.test(x.status||''));
 for(const row of legacy){if(!arr(tiefling.lineages).some(x=>fold(x.name)===fold(row.nome)))tiefling.lineages.push(tieflingLineageFromLegacy(row))}
 migrateOldTieflingChoice(tiefling,tieflingData);
 return rows
}
function addKoboldLegacy(rows){
 const kobold=findByNames(rows,['kobold']);if(!kobold)return;
 kobold.lineageLabel='Legado Kobold';
 const generic=arr(kobold.traits).find(t=>traitName(t)==='kobold legacy');if(!generic)return;
 const replace=['Kobold Legacy'];
 const lineages=[
  {name:'Craftiness',replaceTraitNames:replace,traits:[{name:'Craftiness',originalName:'Craftiness',text:'Escolha Arcanismo, Investigação, Medicina, Prestidigitação ou Sobrevivência; você ganha proficiência na perícia escolhida.',choiceDefs:[{suffix:'skill',type:'skill',label:'Perícia',choose:1,options:['Arcanismo','Investigação','Medicina','Prestidigitação','Sobrevivência']}]}]},
  {name:'Defiance',replaceTraitNames:replace,traits:[{name:'Defiance',originalName:'Defiance',text:'Tem Vantagem em salvaguardas para evitar ou encerrar a condição Amedrontado.'}]},
  {name:'Draconic Sorcery',replaceTraitNames:replace,spellAbilityOptions:['Inteligência','Sabedoria','Carisma'],traits:[{name:'Draconic Sorcery',originalName:'Draconic Sorcery',text:'Conhece um truque da lista de Feiticeiro. Inteligência, Sabedoria ou Carisma é o atributo de conjuração escolhido para esse truque.',choiceDefs:[{suffix:'cantrip',type:'spell',label:'Truque de Feiticeiro',choose:1,spellLevel:0,spellClasses:['Feiticeiro','Sorcerer']},{suffix:'spell-ability',type:'ability',label:'Atributo de conjuração',options:['Inteligência','Sabedoria','Carisma']}]}]}
 ];
 kobold.lineages=[...arr(kobold.lineages).filter(x=>!lineages.some(y=>fold(y.name)===fold(x.name))),...lineages]
}
function setSemanticLabels(rows){
 const dragonborn=findByNames(rows,['dragonborn','draconato']);if(dragonborn){normalizeLineageNames(dragonborn,'Ancestralidade Dracônica',['Ancestral Dracônico','Draconic Ancestor']);dragonborn.lineageLabel='Ancestralidade Dracônica'}
 const goliath=findByNames(rows,['goliath','golias']);if(goliath){normalizeLineageNames(goliath,'Ancestralidade Gigante',['Ancestralidade Gigante','Giant Ancestry']);goliath.lineageLabel='Ancestralidade Gigante'}
}

export function organizeRaceVariants(items,tieflingData={}){
 let rows=[...arr(items)];
 rows=moveFullPackage(rows,['elf','elfo'],['eladrin'],'Eladrin','Linhagem Élfica',['Percepção']);
 rows=moveFullPackage(rows,['elf','elfo'],['sea elf','elfo do mar'],'Elfo do Mar','Linhagem Élfica',['Percepção']);
 rows=moveFullPackage(rows,['elf','elfo'],['shadar-kai','shadar kai'],'Shadar-kai','Linhagem Élfica');
 rows=moveFullPackage(rows,['dwarf','anao','anão'],['duergar'],'Duergar','Linhagem Anã');
 rows=moveFullPackage(rows,['gnome','gnomo'],['deep gnome','gnomo das profundezas','svirfneblin'],'Gnomo das Profundezas','Linhagem Gnômica');
 rows=addTieflingVariants(rows,tieflingData);
 addKoboldLegacy(rows);setSemanticLabels(rows);
 return rows
}
