import{state,AB,ABKEY,SKILL_AB,arr,num,uniq,fold,mod,pb}from'./state.js';
import{activeFeatInstances,featMechanicalOutcome,sanitizeFeatChoices}from'./feat-mechanics.js';

export const item=(k,id)=>state.catalogs[k].find(x=>x.id===id)||null;
export const compatible=k=>state.catalogs[k].filter(x=>!x.ruleset||x.ruleset==='5.5e');
export function selected(){return{klass:item('classes',state.c.refs.class),species:item('species',state.c.refs.species),bg:item('backgrounds',state.c.refs.background),sub:item('subclasses',state.c.refs.subclass)}}

function bgBonus(bg){
 const o=Object.fromEntries(AB.map(a=>[a,0])),ch=state.c.choices.background;
 if(!bg)return o;
 if(ch.abilityMode==='1+1+1')for(const a of bg.abilities.slice(0,3))o[a]+=1;
 else{
  if(bg.abilities.includes(ch.plus2))o[ch.plus2]+=2;
  if(bg.abilities.includes(ch.plus1)&&ch.plus1!==ch.plus2)o[ch.plus1]+=1
 }
 return o
}

function spBonus(sp,line){
 const o=Object.fromEntries(AB.map(a=>[a,0]));
 for(const b of [...arr(sp?.abilityBonuses),...arr(line?.abilityBonuses)]){
  const a=ABKEY[b.ability]||b.ability||b.atributo;
  if(o[a]!=null)o[a]+=num(b.bonus??b.valor??1)
 }
 return o
}

const ALL_SKILLS=Object.keys(SKILL_AB);
const SKILL_ALIAS={
 acrobatics:'Acrobacia',acrobacia:'Acrobacia',
 'animal handling':'Adestrar Animais','adestrar animais':'Adestrar Animais',
 arcana:'Arcanismo',arcanismo:'Arcanismo',athletics:'Atletismo',atletismo:'Atletismo',
 performance:'Atuação',atuacao:'Atuação',deception:'Enganação',enganacao:'Enganação',
 stealth:'Furtividade',furtividade:'Furtividade',history:'História',historia:'História',
 intimidation:'Intimidação',intimidacao:'Intimidação',insight:'Intuição',intuicao:'Intuição',
 investigation:'Investigação',investigacao:'Investigação',medicine:'Medicina',medicina:'Medicina',
 nature:'Natureza',natureza:'Natureza',perception:'Percepção',percepcao:'Percepção',
 persuasion:'Persuasão',persuasao:'Persuasão','sleight of hand':'Prestidigitação',prestidigitacao:'Prestidigitação',
 religion:'Religião',religiao:'Religião',survival:'Sobrevivência',sobrevivencia:'Sobrevivência'
};
const asSkill=v=>SKILL_ALIAS[fold(v)]||ALL_SKILLS.find(s=>fold(s)===fold(v))||null;
const traitKey=t=>fold(t?.originalName||t?.name||'traco').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function activeSpeciesTraits(species,lineage){return[...arr(species?.traits),...arr(lineage?.traits)]}
function explicitSkillOptions(values){return values.map(asSkill).filter(Boolean)}

function defsForTrait(t){
 const text=fold(t?.text),name=fold(t?.originalName||t?.name),base=traitKey(t),defs=[];
 const add=(suffix,type,label,extra={})=>defs.push({key:`${base}:${suffix}`,traitId:base,traitName:t.name,type,label,note:t.text,...extra});
 for(const raw of arr(t?.choiceDefs)){const{suffix='choice',type='option',label='Escolha',...extra}=raw||{};add(suffix,type,label,extra)}
 if(name==='skillful'||name==='habilidoso'||/proficiencia em uma pericia a sua escolha/.test(text))add('skill','skill','Perícia',{choose:1,options:'all'});
 if((name==='keen senses'||name==='sentidos agucados')&&(/intuicao.*percepcao.*sobrevivencia/.test(text)||/insight.*perception.*survival/.test(text)))add('skill','skill','Perícia',{choose:1,options:explicitSkillOptions(['Intuição','Percepção','Sobrevivência'])});
 if(name==='changeling instincts')add('skills','skill','Perícias',{choose:2,options:explicitSkillOptions(['Deception','Insight','Intimidation','Performance','Persuasion'])});
 if(name==='bestial instincts')add('skill','skill','Perícia',{choose:1,options:explicitSkillOptions(['Acrobatics','Athletics','Intimidation','Survival'])});
 if(name==="hunter's senses"&&/perception.*stealth.*survival/.test(text))add('skill','skill','Perícia',{choose:1,options:explicitSkillOptions(['Perception','Stealth','Survival'])});
 if(name==='specialized design'||/proficiencia em uma pericia e em uma ferramenta a escolha/.test(text)){
  add('skill','skill','Perícia',{choose:1,options:'all'});add('tool','tool','Ferramenta',{choose:1})
 }
 if(name==='skill versatility'||/proficiencia em uma pericia ou ferramenta a escolha/.test(text))add('skill-or-tool','skill_or_tool','Perícia ou ferramenta',{choose:1});
 if(name==='severed from dreams'||/ganha proficiencia em uma pericia a escolha ate terminar o proximo descanso longo/.test(text))add('skill','skill','Perícia atual',{choose:1,options:'all',temporary:true});
 if(/talento de origem.*sua escolha/.test(text))add('origin-feat','feat','Talento de Origem',{category:'Origem'});
 const spellAbility=/inteligencia.*sabedoria.*carisma.*(atributo|habilidade).*conjuracao/.test(text)||/(atributo|habilidade).*conjuracao.*inteligencia.*sabedoria.*carisma/.test(text);
 if(spellAbility)add('spell-ability','ability','Atributo de conjuração',{options:['Inteligência','Sabedoria','Carisma']});
 if(name==='shifting'&&/beasthide.*longtooth.*swiftstride.*wildhunt/.test(text))add('shifting-benefit','option','Benefício de Shifting',{options:['Beasthide','Longtooth','Swiftstride','Wildhunt']});
 return uniqDefs(defs)
}
function uniqDefs(defs){const seen=new Set;return defs.filter(d=>!seen.has(d.key)&&(seen.add(d.key),true))}

export function speciesTraitChoiceDefs(speciesArg=null,lineageArg=null){
 const sel=selected(),species=speciesArg||sel.species,lineage=lineageArg||species?.lineages?.find(x=>x.name===state.c.choices.species.lineage)||null;
 return uniqDefs(activeSpeciesTraits(species,lineage).flatMap(defsForTrait))
}

function choiceOptions(def){return def.options==='all'?ALL_SKILLS:arr(def.options)}
function spellMatchesDef(spell,def){if(!spell||num(spell.level)!==num(def.spellLevel))return false;const wanted=arr(def.spellClasses).map(fold);return!wanted.length||arr(spell.classes).some(c=>wanted.includes(fold(c)))}
export function sanitizeSpeciesTraitChoices(){
 const c=state.c;if(!c?.choices)return;
 c.choices.species=c.choices.species||{size:null,lineage:null};
 const old=c.choices.species.traitChoices||{},clean={};
 for(const def of speciesTraitChoiceDefs()){
  const v=old[def.key];
  if(def.type==='skill'){
   const allowed=choiceOptions(def);
   if(def.choose>1){const values=uniq(arr(v).map(asSkill).filter(x=>allowed.includes(x))).slice(0,def.choose);if(values.length)clean[def.key]=values}
   else{const skill=asSkill(v);if(skill&&allowed.includes(skill))clean[def.key]=skill}
  }else if(def.type==='feat'){
   const f=item('feats',v);if(f&&f.category===def.category)clean[def.key]=v
  }else if(def.type==='ability'||def.type==='option'){
   if(arr(def.options).includes(v))clean[def.key]=v
  }else if(def.type==='spell'){
   const s=item('spells',v);if(spellMatchesDef(s,def))clean[def.key]=v
  }else if(def.type==='tool'){
   if(typeof v==='string'&&v.trim())clean[def.key]=v.trim()
  }else if(def.type==='skill_or_tool'&&v&&typeof v==='object'){
   if(v.type==='skill'){const skill=asSkill(v.value);if(skill)clean[def.key]={type:'skill',value:skill}}
   else if(v.type==='tool'&&String(v.value||'').trim())clean[def.key]={type:'tool',value:String(v.value).trim()}
  }
 }
 c.choices.species.traitChoices=clean
}

function speciesChoiceOutcome(species,lineage){
 const defs=speciesTraitChoiceDefs(species,lineage),values=state.c.choices.species?.traitChoices||{},skills=[],tools=[],featIds=[],spells=[],labels={},abilities=[];
 for(const def of defs){
  const v=values[def.key];if(v==null)continue;
  if(def.type==='skill'){const chosen=def.choose>1?arr(v):[v];skills.push(...chosen);labels[def.key]=chosen.join(', ')}
  else if(def.type==='tool'){tools.push(v);labels[def.key]=v}
  else if(def.type==='skill_or_tool'){if(v.type==='skill')skills.push(v.value);else if(v.type==='tool')tools.push(v.value);labels[def.key]=v.value}
  else if(def.type==='feat'){const f=item('feats',v);if(f){featIds.push(v);labels[def.key]=f.name}}
  else if(def.type==='spell'){const s=item('spells',v);if(s){spells.push(s);labels[def.key]=s.name}}
  else if(def.type==='ability'){abilities.push(v);labels[def.key]=v}
  else if(def.type==='option')labels[def.key]=v
 }
 return{defs,values,skills:uniq(skills),tools:uniq(tools),featIds:uniq(featIds),spells:uniq(spells),labels,spellAbility:abilities[0]||null}
}

function traitPassiveEffects(traits,level){
 let hp=0,acBonus=0,speedOverride=null,naturalArmorBase=null;const fixedSkills=[];
 for(const t of traits){
  const n=fold(t?.originalName||t?.name),text=fold(t?.text);
  if(n==='dwarven toughness'||n==='tenacidade ana'||/maximo de pontos de vida aumenta em 1.*ganha um nivel/.test(text))hp+=level;
  if(n==='integrated protection'||/\+1 de bonus na classe de armadura/.test(text))acBonus+=1;
  if(n==='wood elf: movement speed increase'||/deslocamento aumenta para 10,5 m/.test(text))speedOverride=Math.max(speedOverride||0,35);
  if(n==='natural performer'||/^ganha proficiencia em performance/.test(text))fixedSkills.push('Atuação');
  if(n==='menacing'||/^ganha proficiencia em intimidation/.test(text))fixedSkills.push('Intimidação');
  const armor=text.match(/ca base e (1[0-9]) \+ modificador de destreza/);if(armor)naturalArmorBase=Math.max(naturalArmorBase||0,num(armor[1]))
 }
 return{hp,acBonus,speedOverride,naturalArmorBase,fixedSkills:uniq(fixedSkills)}
}

function classArmorTraining(k,a){if(!a)return true;const p=fold([...arr(k?.proficiencies),...arr(k?.proficienciesRaw)].join(' '));if(a.categoria==='Leve')return/light armor|armadura leve|all armor|todas as armaduras/.test(p);if(a.categoria==='Média')return/medium armor|armadura media|all armor|todas as armaduras/.test(p);if(a.categoria==='Pesada')return/heavy armor|armadura pesada|all armor|todas as armaduras/.test(p);return true}
export function trainedArmor(k,a){if(classArmorTraining(k,a))return true;if(!a)return true;return featMechanicalOutcome().armorTraining.includes(a.categoria)}
function classShieldTraining(k){return/shield|escudo/.test(fold([...arr(k?.proficiencies),...arr(k?.proficienciesRaw)].join(' ')))}
export const shieldTraining=k=>classShieldTraining(k)||featMechanicalOutcome().shieldTraining;
function weaponProf(k,w,featMech=null){
 if(!w||!k)return false;const p=fold([...arr(k.proficiencies),...arr(k.proficienciesRaw)].join(' ')),c=fold(w.categoria),fm=featMech||featMechanicalOutcome();
 if(c.includes('simples')&&/simple weapon|arma simples/.test(p))return true;
 if(c.includes('marcial')&&(/martial weapon|arma marcial/.test(p)||fm.weaponTraining.includes('Marcial')))return true;
 return p.includes(fold(w.nome))||p.includes(fold(w.nome_original))
}
function armorAC(a,dex,naturalBase=null,mediumDexCap=2){if(!a)return naturalBase?naturalBase+dex:10+dex;const s=String(a.ca||''),base=num((s.match(/\d+/)||['10'])[0]);if(/modificador de Destreza|Dexterity/i.test(s))return base+(a.categoria==='Média'?Math.min(mediumDexCap,dex):dex);return base}

export function spellProgress(k,l){
 const r=arr(k?.levels).find(x=>num(x.level)===l),s=r?.spellcasting||r?.class_specific?.spellcasting||{},slots=[];let maxLevel=0;
 for(let i=1;i<=9;i++){const v=num(s[`spell_slots_level_${i}`]);if(v){slots.push({level:i,count:v});maxLevel=Math.max(maxLevel,i)}}
 const arcanumLevels=k?.slug==='warlock'?[6,7,8,9].filter((_,i)=>l>=[11,13,15,17][i]):[];
 return{cantrips:num(s.cantrips_known??s.cantrips),prepared:num(s.spells_prepared??s.prepared_spells??s.magias_preparadas??s.spells_known),slots,maxLevel,arcanumLevels}
}
export function spellSelectionQuota(k,l){
 const level=Math.max(1,Math.min(20,num(l)||1)),byLevel={};if(!k?.spellAbility)return{total:0,byLevel,label:'Magias',mode:'none'};let total=0,previous=0;
 for(let currentLevel=1;currentLevel<=level;currentLevel++){
  const p=spellProgress(k,currentLevel);if(!p.maxLevel){previous=p.prepared;continue}
  let gained;if(k.slug==='wizard')gained=currentLevel===1?6:2;else{gained=Math.max(0,p.prepared-previous);previous=p.prepared}
  if(!gained)continue;byLevel[p.maxLevel]=(byLevel[p.maxLevel]||0)+gained;total+=gained
 }
 return{total,byLevel,label:k.slug==='wizard'?'Magias no grimório':k.slug==='warlock'?'Magias de Pact Magic':'Magias preparadas/conhecidas',mode:k.slug==='wizard'?'spellbook':k.slug==='warlock'?'pact':'prepared'}
}
function creditPool(byLevel){const credits=[];for(const[cap,count]of Object.entries(byLevel||{})){const maxLevel=num(cap);for(let i=0;i<num(count);i++)if(maxLevel>0)credits.push(maxLevel)}return credits.sort((a,b)=>a-b)}
function countCredits(credits){const out={};for(const cap of credits)out[cap]=num(out[cap])+1;return out}
export function allocateSpellCredits(byLevel,spellLevels){const credits=creditPool(byLevel),remaining=[...credits],levels=arr(spellLevels).map(num).filter(level=>level>0).sort((a,b)=>b-a),assignments=[];for(const spellLevel of levels){const index=remaining.findIndex(cap=>cap>=spellLevel);if(index<0)return{valid:false,total:credits.length,used:assignments.length,assignments,remaining,remainingByLevel:countCredits(remaining),maxSelectable:remaining.length?Math.max(...remaining):0,unassignedLevel:spellLevel};const maxLevel=remaining[index];assignments.push({spellLevel,maxLevel});remaining.splice(index,1)}return{valid:true,total:credits.length,used:assignments.length,assignments,remaining,remainingByLevel:countCredits(remaining),maxSelectable:remaining.length?Math.max(...remaining):0,unassignedLevel:null}}
export function spellCreditState(k,l,ids){const quota=spellSelectionQuota(k,l),levels=arr(ids).map(id=>item('spells',id)).filter(Boolean).map(spell=>num(spell.level));return allocateSpellCredits(quota.byLevel,levels)}
function classSpellMatch(k,s){const names=[k?.name,k?.slug==='artificer'?'Artífice':null].filter(Boolean).map(fold);return arr(s.classes).some(c=>names.includes(fold(c)))}
export function spellOptions(k,l){const baseProgress=spellProgress(k,l),quota=spellSelectionQuota(k,l),progress={...baseProgress,actualPrepared:baseProgress.prepared,prepared:quota.total,selectionTotal:quota.total,selectionByLevel:quota.byLevel,selectionCreditsByLevel:quota.byLevel,selectionLabel:quota.label,selectionMode:quota.mode};if(!k?.spellAbility||(!progress.maxLevel&&!progress.arcanumLevels.length))return{progress,cantrips:[],leveled:[],arcanum:{}};const all=state.catalogs.spells.filter(s=>classSpellMatch(k,s)),cantrips=all.filter(s=>s.level===0),leveled=all.filter(s=>s.level>0&&s.level<=progress.maxLevel),arcanum=Object.fromEntries(progress.arcanumLevels.map(level=>[level,all.filter(s=>s.level===level)]));return{progress,cantrips,leveled,arcanum}}
export function canSelectLeveledSpell(k,l,ids,candidateId){const current=arr(ids);if(current.includes(candidateId))return true;const opts=spellOptions(k,l),candidate=opts.leveled.find(spell=>spell.id===candidateId);if(!candidate)return false;return spellCreditState(k,l,[...current,candidateId]).valid}

function hpTotal(k,l,con,featHp=0,extraHp=0){if(!k)return null;const perLevel=Math.max(1,k.hitDie+con);return Math.max(l,perLevel*l+featHp+extraHp)}
export function subclassLevel(k){return k?3:99}

function decoratedTraits(traits,outcome){
 const byTrait={};for(const def of outcome.defs){const label=outcome.labels[def.key];if(label)(byTrait[def.traitId]||(byTrait[def.traitId]=[])).push(`${def.label}: ${label}`)}
 return traits.map(t=>{const extra=byTrait[traitKey(t)];return extra?.length?{...t,text:`${t.text}\nEscolhas: ${extra.join(' · ')}`}:{...t}})
}

export function derive(){
 sanitizeSpeciesTraitChoices();sanitizeFeatChoices();
 const{klass,species,bg,sub}=selected(),level=Math.max(1,Math.min(20,num(state.c.choices.class.level)||1)),pbonus=pb(level),lineage=species?.lineages?.find(x=>x.name===state.c.choices.species.lineage)||null,bb=bgBonus(bg),sb=spBonus(species,lineage),traits=activeSpeciesTraits(species,lineage),speciesChoices=speciesChoiceOutcome(species,lineage),passiveSpecies=traitPassiveEffects(traits,level),baseSkills=uniq([...(bg?.skills||[]),...arr(state.c.choices.class.skills),...passiveSpecies.fixedSkills,...speciesChoices.skills]),baseSaves=uniq(arr(klass?.savingThrows)),featMech=featMechanicalOutcome(baseSkills,baseSaves),scores={};
 for(const a of AB)scores[a]=Math.min(20,num(state.c.baseAbilities[a])+bb[a]+sb[a]+num(featMech.abilityBonuses[a]));
 const skills=uniq([...baseSkills,...featMech.skills]),expertiseSkills=uniq(arr(featMech.expertise).filter(s=>skills.includes(s))),tools=uniq([...(bg?.tools||[]),state.c.choices.background.toolChoice,...speciesChoices.tools,...featMech.tools].filter(Boolean)),saveProficiencies=uniq([...baseSaves,...featMech.saveProficiencies]),feats=uniq(activeFeatInstances().map(x=>x.feat.name)),armor=item('armors',state.c.choices.equipment.armor),weapon=item('weapons',state.c.choices.equipment.weapon),dex=mod(scores.Destreza),str=mod(scores.Força),wis=mod(scores.Sabedoria),con=mod(scores.Constituição),naturalArmorBase=Math.max(num(passiveSpecies.naturalArmorBase),num(featMech.naturalArmorBase))||null;
 let speed=(passiveSpecies.speedOverride||species?.speed||30)+num(featMech.speedBonus);if(armor?.forca_minima&&scores.Força<num(armor.forca_minima))speed-=10;
 const wAbility=weapon?(/distância/.test(weapon.categoria)?'Destreza':arr(weapon.propriedades).some(x=>/finesse/i.test(x))?(dex>=str?'Destreza':'Força'):'Força'):null,wmod=wAbility?mod(scores[wAbility]):0,wprof=weaponProf(klass,weapon,featMech),spell=spellProgress(klass,level),spellMod=klass?.spellAbility?mod(scores[klass.spellAbility]):null,shieldBonus=state.c.choices.equipment.shield&&(classShieldTraining(klass)||featMech.shieldTraining)?2:0,spellSel=state.c.choices.spells||{cantrips:[],leveled:[],arcanum:{}};
 const speciesSpellMod=speciesChoices.spellAbility?mod(scores[speciesChoices.spellAbility]):null;
 return{klass,species,bg,sub,level,pbonus,lineage,bb,sb,scores,skills,expertiseSkills,tools,saveProficiencies,feats,speciesFeatIds:speciesChoices.featIds,speciesTraitChoices:speciesChoices,speciesSpells:speciesChoices.spells,featMechanics:featMech,featSpells:featMech.spells,featSpellcasting:featMech.spellcasting,featResources:featMech.resources,featResistances:featMech.resistances,extraProficiencies:featMech.extraProficiencies,unarmedDamage:featMech.unarmedDamage,armor,weapon,ac:armorAC(armor,dex,naturalArmorBase,featMech.mediumDexCap)+shieldBonus+passiveSpecies.acBonus+featMech.acBonus,speed,wAbility,wprof,attack:weapon?wmod+(wprof?pbonus:0):null,hp:hpTotal(klass,level,con,featMech.hp,passiveSpecies.hp),spell,spellDC:spellMod==null?null:8+pbonus+spellMod,spellAttack:spellMod==null?null:pbonus+spellMod,speciesSpellAbility:speciesChoices.spellAbility,speciesSpellDC:speciesSpellMod==null?null:8+pbonus+speciesSpellMod,speciesSpellAttack:speciesSpellMod==null?null:pbonus+speciesSpellMod,selectedSpells:{cantrips:arr(spellSel.cantrips).map(id=>item('spells',id)).filter(Boolean),leveled:arr(spellSel.leveled).map(id=>item('spells',id)).filter(Boolean),arcanum:Object.fromEntries(Object.entries(spellSel.arcanum||{}).map(([l,id])=>[l,item('spells',id)]).filter(([,x])=>x))},initiative:dex+featMech.initiative,passive:10+wis+(skills.includes('Percepção')?pbonus:0)+(expertiseSkills.includes('Percepção')?pbonus:0),speciesTraits:decoratedTraits(traits,speciesChoices),classFeatures:arr(klass?.features).filter(f=>f.level<=level)}
}

export function sanitizeSelections(){
 const c=state.c,{klass}=selected(),level=Math.max(1,Math.min(20,num(c.choices.class.level)||1)),opts=spellOptions(klass,level),canIds=new Set(opts.cantrips.map(x=>x.id)),levIds=new Set(opts.leveled.map(x=>x.id));
 c.choices.spells=c.choices.spells||{cantrips:[],leveled:[],arcanum:{}};
 c.choices.spells.cantrips=arr(c.choices.spells.cantrips).filter(id=>canIds.has(id)).slice(0,opts.progress.cantrips);
 const eligible=[...new Set(arr(c.choices.spells.leveled).filter(id=>levIds.has(id)))],ranked=eligible.map((id,index)=>({id,index,level:num(item('spells',id)?.level)})).filter(x=>x.level>0).sort((a,b)=>b.level-a.level||a.index-b.index),accepted=[];
 for(const row of ranked){if(accepted.length>=opts.progress.selectionTotal)break;if(spellCreditState(klass,level,[...accepted,row.id]).valid)accepted.push(row.id)}
 const acceptedIds=new Set(accepted);c.choices.spells.leveled=eligible.filter(id=>acceptedIds.has(id)).slice(0,opts.progress.selectionTotal);
 const arc={};for(const l of opts.progress.arcanumLevels){const id=c.choices.spells.arcanum?.[l];if(id&&opts.arcanum[l]?.some(x=>x.id===id))arc[l]=id}c.choices.spells.arcanum=arc;
 for(const[ref,k]of[['class','classes'],['species','species'],['background','backgrounds'],['subclass','subclasses']]){const x=item(k,c.refs[ref]);if(x&&x.ruleset&&x.ruleset!=='5.5e')c.refs[ref]=null}
 sanitizeSpeciesTraitChoices();sanitizeFeatChoices()
}
