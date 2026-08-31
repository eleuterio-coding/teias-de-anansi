import{state,AB,SKILL_AB,arr,num,uniq,fold,pb}from'./state.js';
import{classFeatureFeatInstances,sanitizeClassFeatureFeatSelections}from'./class-feature-feat-mechanics.js';

export const ALL_SKILLS=Object.keys(SKILL_AB);
export const MENTAL_ABILITIES=['Inteligência','Sabedoria','Carisma'];
const KNOWLEDGE_SKILLS=['Arcanismo','História','Investigação','Natureza','Religião'];
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Elétrico','Trovejante'];
const EPIC_RESISTANCE_TYPES=['Ácido','Frio','Fogo','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante'];

const ability=(options,extra={})=>({ability:{options,amount:1},...extra});
const epic=(options=AB,extra={})=>ability(options,{abilityCap:30,...extra});
export const FEAT_RULES={
 'Alert':{initiativePB:true},
 'Crafter':{choices:[{id:'tools',type:'tools',count:3,label:'Ferramentas de artesão'}]},
 'Healer':{},
 'Lucky':{resource:{label:'Pontos de Sorte',formula:'pb'}},
 'Magic Initiate':{choices:[{id:'spellList',type:'option',label:'Lista de magias',options:['Clérigo','Druida','Mago'],uniqueAcrossFeat:true},{id:'spellAbility',type:'spell_ability',label:'Atributo de conjuração',options:MENTAL_ABILITIES},{id:'cantrips',type:'spells',label:'Truques',count:2,level:0,listFrom:'spellList'},{id:'level1',type:'spells',label:'Magia de 1º círculo',count:1,level:1,listFrom:'spellList'}]},
 'Musician':{choices:[{id:'instruments',type:'tools',count:3,label:'Instrumentos musicais'}]},
 'Savage Attacker':{combatFlags:['savageAttacker']},
 'Skilled':{choices:[{id:'proficiencies',type:'skill_or_tool_multi',count:3,label:'Perícias ou ferramentas'}]},
 'Tavern Brawler':{extraProficiencies:['Armas improvisadas'],unarmedDamage:'1d4 + Força',combatFlags:['tavernBrawler']},
 'Tough':{hpPerLevel:2},
 'Ability Score Improvement':{choices:[{id:'asi',type:'asi',label:'Melhoria de Atributo'}]},
 'Actor':ability(['Carisma']),'Athlete':ability(['Força','Destreza']),'Charger':ability(['Força','Destreza']),'Chef':ability(['Constituição','Sabedoria'],{fixedTools:['Utensílios de cozinheiro']}),'Crossbow Expert':ability(['Destreza']),'Crusher':ability(['Força','Constituição']),'Defensive Duelist':ability(['Destreza']),'Dual Wielder':ability(['Força','Destreza']),'Durable':ability(['Constituição']),'Elemental Adept':ability(MENTAL_ABILITIES,{choices:[{id:'damageType',type:'option',label:'Tipo de dano',options:DAMAGE_TYPES,uniqueAcrossFeat:true}]}),'Fey-Touched':ability(MENTAL_ABILITIES,{fixedSpells:['Misty Step'],choices:[{id:'spell',type:'spell',label:'Magia de 1º círculo',level:1,schools:['Divination','Adivinhação','Enchantment','Encantamento']}]}),'Grappler':ability(['Força','Destreza']),'Great Weapon Master':ability(['Força']),'Heavily Armored':ability(['Força','Constituição'],{armorTraining:['Pesada']}),'Heavy Armor Master':ability(['Força','Constituição']),'Inspiring Leader':ability(['Sabedoria','Carisma']),'Keen Mind':ability(['Inteligência'],{choices:[{id:'loreSkill',type:'skill_upgrade',label:'Perícia de conhecimento',options:KNOWLEDGE_SKILLS}]}),'Lightly Armored':ability(['Força','Destreza'],{armorTraining:['Leve'],shieldTraining:true}),'Mage Slayer':ability(['Força','Destreza']),'Martial Weapon Training':ability(['Força','Destreza'],{weaponTraining:['Marcial']}),'Medium Armor Master':ability(['Força','Destreza'],{mediumDexCap:3}),'Moderately Armored':ability(['Força','Destreza'],{armorTraining:['Média']}),'Mounted Combatant':ability(['Força','Destreza','Sabedoria']),'Observant':ability(['Inteligência','Sabedoria'],{choices:[{id:'observerSkill',type:'skill_upgrade',label:'Perícia observadora',options:['Intuição','Investigação','Percepção']}]}),'Piercer':ability(['Força','Destreza']),'Poisoner':ability(['Destreza','Inteligência']),'Polearm Master':ability(['Força','Destreza']),'Resilient':{choices:[{id:'resilientAbility',type:'resilient',label:'Atributo e salvaguarda'}]},'Ritual Caster':ability(MENTAL_ABILITIES,{choices:[{id:'rituals',type:'ritual_spells',label:'Magias rituais de 1º círculo',countFormula:'pb'}]}),'Sentinel':ability(['Força','Destreza']),'Shadow-Touched':ability(MENTAL_ABILITIES,{fixedSpells:['Invisibility'],choices:[{id:'spell',type:'spell',label:'Magia de 1º círculo',level:1,schools:['Illusion','Ilusão','Necromancy','Necromancia']}]}),'Sharpshooter':ability(['Destreza']),'Shield Master':ability(['Força']),'Skill Expert':{choices:[{id:'ability',type:'ability',label:'Atributo',options:AB},{id:'skill',type:'skill',label:'Nova proficiência em perícia',options:ALL_SKILLS},{id:'expertise',type:'expertise',label:'Especialização',options:'proficient'}]},'Skulker':ability(['Destreza']),'Slasher':ability(['Força','Destreza']),'Speedy':ability(['Destreza','Constituição'],{speedBonus:10}),'Spell Sniper':ability(MENTAL_ABILITIES),'Telekinetic':ability(MENTAL_ABILITIES,{fixedSpells:['Mage Hand']}),'Telepathic':ability(MENTAL_ABILITIES,{fixedSpells:['Detect Thoughts']}),'War Caster':ability(MENTAL_ABILITIES),'Weapon Master':ability(['Força','Destreza'],{choices:[{id:'weapon',type:'weapon',label:'Arma com Maestria'}]}),

 'Archery':{rangedAttackBonus:2,combatFlags:['archery']},
 'Blind Fighting':{combatFlags:['blindFighting10']},
 'Defense':{armoredAcBonus:1,combatFlags:['defense']},
 'Dueling':{combatFlags:['duelingDamage2']},
 'Great Weapon Fighting':{combatFlags:['greatWeaponDamageFloor3']},
 'Interception':{combatFlags:['interceptionReaction']},
 'Protection':{combatFlags:['protectionReaction']},
 'Thrown Weapon Fighting':{combatFlags:['thrownWeaponDamage2']},
 'Two-Weapon Fighting':{combatFlags:['twoWeaponAbilityModifier']},
 'Unarmed Fighting':{unarmedDamage:'1d6 + Força',combatFlags:['unarmedFightingTwoHands1d8','unarmedFightingGrapple1d4']},

 'Boon of Combat Prowess':epic(AB,{combatFlags:['peerlessAim']}),
 'Boon of Dimensional Travel':epic(AB,{combatFlags:['blinkSteps30']}),
 'Boon of Energy Resistance':epic(AB,{choices:[{id:'resistances',type:'options_multi',count:2,label:'Resistências de energia',options:EPIC_RESISTANCE_TYPES}],combatFlags:['energyRedirection']}),
 'Boon of Fate':epic(AB,{combatFlags:['improveFate']}),
 'Boon of Fortitude':epic(AB,{hpFlat:40,combatFlags:['fortifiedHealing']}),
 'Boon of Irresistible Offense':epic(['Força','Destreza'],{combatFlags:['ignoreBpsResistance','overwhelmingStrike']}),
 'Boon of Recovery':epic(AB,{combatFlags:['lastStand','recoverVitality']}),
 'Boon of Skill':epic(AB,{allSkills:true,choices:[{id:'expertise',type:'expertise',label:'Especialização',options:'proficient'}]}),
 'Boon of Speed':epic(AB,{speedBonus:30,combatFlags:['escapeArtist']}),
 'Boon of Spell Recall':epic(MENTAL_ABILITIES,{combatFlags:['freeCasting1to4']}),
 'Boon of the Night Spirit':epic(AB,{combatFlags:['mergeWithShadows','shadowyForm']}),
 'Boon of Truesight':epic(AB,{combatFlags:['truesight60']})
};

const featByName=name=>state.catalogs.feats.find(f=>fold(f.name)===fold(name))||null;
const featById=id=>state.catalogs.feats.find(f=>f.id===id)||null;
const normalizeSpellList=v=>({cleric:'Clérigo',clerigo:'Clérigo',druid:'Druida',druida:'Druida',wizard:'Mago',mago:'Mago'}[fold(v)]||v);
function classObj(){return state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null}
function backgroundObj(){return state.catalogs.backgrounds.find(x=>x.id===state.c?.refs?.background)||null}

export function activeFeatInstances(){
 const out=[],level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),klass=classObj(),bg=backgroundObj();
 if(bg?.feat?.name){const feat=featByName(bg.feat.name);if(feat)out.push({key:'background',feat,source:'Antecedente',presetChoice:bg.feat.choice||''})}
 const prepared=arr(klass?._houseFeatProgression);
 if(prepared.length){for(const entry of prepared.filter(x=>num(x.level)<=level)){const feat=featById(state.c?.choices?.feats?.[entry.slot]);if(feat)out.push({key:`class:${entry.slot}`,feat,source:entry.kind==='house'?`Regra da Casa · nível ${entry.level}`:`Classe · nível ${entry.level} · talento adicional`})}}
 else{for(const[l,i]of arr(klass?.featSlots).filter(x=>x<=level).map((l,i)=>[l,i])){const slot=`slot-${l}-${i}`,feat=featById(state.c?.choices?.feats?.[slot]);if(feat)out.push({key:`class:${slot}`,feat,source:`Classe · nível ${l}`})}}
 out.push(...classFeatureFeatInstances());
 for(const[key,value]of Object.entries(state.c?.choices?.species?.traitChoices||{})){if(typeof value!=='string')continue;const feat=featById(value);if(feat)out.push({key:`species:${key}`,feat,source:'Raça'})}
 return out
}
export function featRule(feat){return FEAT_RULES[feat?.name]||null}
export function featChoiceDefs(){return activeFeatInstances().flatMap(inst=>{const rule=featRule(inst.feat),defs=[];if(!rule)return defs;if(rule.ability&&rule.ability.options.length>1)defs.push({id:'ability',type:'ability',label:'Aumento de atributo',options:rule.ability.options});for(const d of arr(rule.choices))defs.push({...d});return defs.map(d=>({...d,key:`${inst.key}:${d.id}`,instanceKey:inst.key,featId:inst.feat.id,featName:inst.feat.name,source:inst.source,presetChoice:inst.presetChoice||''}))})}
function store(){state.c.choices.featMechanics=state.c.choices.featMechanics||{};return state.c.choices.featMechanics}
function cleanString(v){return typeof v==='string'?v.trim():''}
function spellAllowed(spell,def,instanceData){if(!spell)return false;if(def.level!=null&&num(spell.level)!==num(def.level))return false;if(def.type==='ritual_spells'&&!spell.ritual)return false;if(def.schools?.length&&!def.schools.some(s=>fold(s)===fold(spell.school)))return false;if(def.listFrom){const list=instanceData?.[def.listFrom];if(!list)return false;const aliases={clerigo:['clerigo','cleric'],druida:['druida','druid'],mago:['mago','wizard']},allowed=aliases[fold(list)]||[fold(list)];if(!arr(spell.classes).some(c=>allowed.includes(fold(c))))return false}return true}

export function sanitizeFeatChoices(){
 if(!state.c?.choices)return;sanitizeClassFeatureFeatSelections();
 const old=state.c.choices.featMechanics||{},clean={},instances=activeFeatInstances();
 for(const inst of instances){const rule=featRule(inst.feat);if(!rule)continue;const data=old[inst.key]||{},next={};if(rule.ability?.options.length>1&&rule.ability.options.includes(data.ability))next.ability=data.ability;if(inst.feat.name==='Magic Initiate'&&inst.presetChoice)next.spellList=normalizeSpellList(inst.presetChoice);
  for(const def of arr(rule.choices)){const v=data[def.id];if(def.type==='option'||def.type==='ability'||def.type==='spell_ability'){if(arr(def.options).includes(v))next[def.id]=v}else if(def.type==='options_multi'){const vals=uniq(arr(v).filter(x=>arr(def.options).includes(x))).slice(0,num(def.count)||1);if(vals.length)next[def.id]=vals}else if(def.type==='skill'){if(ALL_SKILLS.includes(v))next[def.id]=v}else if(def.type==='skill_upgrade'){if(arr(def.options).includes(v))next[def.id]=v}else if(def.type==='expertise'){if(ALL_SKILLS.includes(v))next[def.id]=v}else if(def.type==='resilient'){if(AB.includes(v))next[def.id]=v}else if(def.type==='asi'){const mode=v?.mode==='1+1'?'1+1':'2',a1=AB.includes(v?.a1)?v.a1:null,a2=AB.includes(v?.a2)&&v.a2!==a1?v.a2:null;if(a1)next[def.id]={mode,a1,a2:mode==='1+1'?a2:null}}else if(def.type==='tools'){const vals=uniq(arr(v).map(cleanString).filter(Boolean)).slice(0,def.count);if(vals.length)next[def.id]=vals}else if(def.type==='skill_or_tool_multi'){const vals=[],seen=new Set;for(const row of arr(v)){let cleanRow=null;if(row?.type==='skill'&&ALL_SKILLS.includes(row.value))cleanRow={type:'skill',value:row.value};else if(row?.type==='tool'&&cleanString(row.value))cleanRow={type:'tool',value:cleanString(row.value)};if(cleanRow){const token=`${cleanRow.type}:${fold(cleanRow.value)}`;if(!seen.has(token)){seen.add(token);vals.push(cleanRow)}}if(vals.length>=def.count)break}if(vals.length)next[def.id]=vals}else if(def.type==='spells'||def.type==='ritual_spells'){const max=def.countFormula==='pb'?pb(state.c.choices.class.level):def.count,ids=uniq(arr(v)).filter(id=>spellAllowed(state.catalogs.spells.find(s=>s.id===id),def,{...data,...next})).slice(0,max);if(ids.length)next[def.id]=ids}else if(def.type==='spell'){if(spellAllowed(state.catalogs.spells.find(s=>s.id===v),def,{...data,...next}))next[def.id]=v}else if(def.type==='weapon'){if(state.catalogs.weapons.some(w=>w.id===v))next[def.id]=v}}
  if(Object.keys(next).length)clean[inst.key]=next
 }
 state.c.choices.featMechanics=clean
}

function instanceOutcome(inst,baseSkills,baseSaves){
 const rule=featRule(inst.feat)||{},data=store()[inst.key]||{},abilityBonuses={},abilityCaps={},skills=[],expertise=[],skillUpgrades=[],tools=[...arr(rule.fixedTools)],saveProficiencies=[],spells=[],labels=[],extraProficiencies=[...arr(rule.extraProficiencies)],spellAbility=data.spellAbility||data.ability||null;
 const addAbility=(a,n=1)=>{if(AB.includes(a)){abilityBonuses[a]=num(abilityBonuses[a])+n;if(rule.abilityCap)abilityCaps[a]=Math.max(num(abilityCaps[a]),num(rule.abilityCap))}};
 if(rule.ability){const a=rule.ability.options.length===1?rule.ability.options[0]:data.ability;if(a)addAbility(a,rule.ability.amount||1)}
 if(rule.allSkills)skills.push(...ALL_SKILLS);
 for(const def of arr(rule.choices)){const v=data[def.id];if(def.type==='asi'&&v?.a1){if(v.mode==='1+1'){addAbility(v.a1,1);if(v.a2)addAbility(v.a2,1)}else addAbility(v.a1,2);labels.push(`${def.label}: ${v.mode==='1+1'?`${v.a1} +1${v.a2?`, ${v.a2} +1`:''}`:`${v.a1} +2`}`)}else if(def.type==='ability'&&v){addAbility(v,1);labels.push(`${def.label}: ${v}`)}else if(def.type==='spell_ability'&&v)labels.push(`${def.label}: ${v}`);else if(def.type==='resilient'&&v){addAbility(v,1);saveProficiencies.push(v);labels.push(`${def.label}: ${v}`)}else if(def.type==='skill'&&v){skills.push(v);labels.push(`${def.label}: ${v}`)}else if(def.type==='expertise'&&v){expertise.push(v);labels.push(`${def.label}: ${v}`)}else if(def.type==='skill_upgrade'&&v){skillUpgrades.push(v);labels.push(`${def.label}: ${v}`)}else if(def.type==='tools'&&arr(v).length){tools.push(...v);labels.push(`${def.label}: ${v.join(', ')}`)}else if(def.type==='skill_or_tool_multi'&&arr(v).length){for(const row of v){if(row.type==='skill')skills.push(row.value);else tools.push(row.value)}labels.push(`${def.label}: ${v.map(x=>x.value).join(', ')}`)}else if(def.type==='options_multi'&&arr(v).length)labels.push(`${def.label}: ${v.join(', ')}`);else if(def.type==='option'&&v)labels.push(`${def.label}: ${v}`);else if((def.type==='spells'||def.type==='ritual_spells')&&arr(v).length){const xs=v.map(id=>state.catalogs.spells.find(s=>s.id===id)).filter(Boolean);spells.push(...xs);labels.push(`${def.label}: ${xs.map(s=>s.name).join(', ')}`)}else if(def.type==='spell'&&v){const s=state.catalogs.spells.find(x=>x.id===v);if(s){spells.push(s);labels.push(`${def.label}: ${s.name}`)}}else if(def.type==='weapon'&&v){const w=state.catalogs.weapons.find(x=>x.id===v);if(w)labels.push(`${def.label}: ${w.nome}`)}}
 for(const n of arr(rule.fixedSpells)){const s=state.catalogs.spells.find(x=>fold(x.name)===fold(n)||fold(x.originalName)===fold(n));if(s)spells.push(s)}
 return{abilityBonuses,abilityCaps,skills,expertise,skillUpgrades,tools,saveProficiencies,spells,labels,extraProficiencies,spellAbility}
}

export function featMechanicalOutcome(baseSkills=[],baseSaves=[]){
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),pbonus=pb(level),instances=activeFeatInstances(),out={abilityBonuses:{},abilityCaps:{},skills:[],expertise:[],skillUpgrades:[],tools:[],saveProficiencies:[],spells:[],labels:{},initiative:0,hp:0,speedBonus:0,acBonus:0,rangedAttackBonus:0,mediumDexCap:2,armorTraining:[],shieldTraining:false,weaponTraining:[],extraProficiencies:[],resources:[],unarmedDamage:null,instances,spellcasting:[],combatFlags:[]};let evolvingSkills=[...baseSkills],evolvingSaves=[...baseSaves];
 for(const inst of instances){const rule=featRule(inst.feat);if(!rule)continue;const r=instanceOutcome(inst,evolvingSkills,evolvingSaves);for(const[a,n]of Object.entries(r.abilityBonuses))out.abilityBonuses[a]=num(out.abilityBonuses[a])+num(n);for(const[a,cap]of Object.entries(r.abilityCaps))out.abilityCaps[a]=Math.max(num(out.abilityCaps[a]),num(cap));out.skills.push(...r.skills);evolvingSkills=uniq([...evolvingSkills,...r.skills]);out.expertise.push(...r.expertise);out.skillUpgrades.push(...r.skillUpgrades);out.tools.push(...r.tools);out.saveProficiencies.push(...r.saveProficiencies);evolvingSaves=uniq([...evolvingSaves,...r.saveProficiencies]);out.spells.push(...r.spells);out.extraProficiencies.push(...r.extraProficiencies);if(r.spells.length)out.spellcasting.push({instanceKey:inst.key,featName:inst.feat.name,ability:r.spellAbility,spells:r.spells});out.labels[inst.key]=r.labels;if(rule.initiativePB)out.initiative+=pbonus;if(rule.hpPerLevel)out.hp+=num(rule.hpPerLevel)*level;if(rule.hpFlat)out.hp+=num(rule.hpFlat);if(rule.speedBonus)out.speedBonus+=num(rule.speedBonus);if(rule.acBonus)out.acBonus+=num(rule.acBonus);if(rule.armoredAcBonus&&state.c.choices.equipment?.armor)out.acBonus+=num(rule.armoredAcBonus);if(rule.rangedAttackBonus)out.rangedAttackBonus+=num(rule.rangedAttackBonus);if(rule.mediumDexCap)out.mediumDexCap=Math.max(out.mediumDexCap,num(rule.mediumDexCap));out.armorTraining.push(...arr(rule.armorTraining));if(rule.shieldTraining)out.shieldTraining=true;out.weaponTraining.push(...arr(rule.weaponTraining));if(rule.resource)out.resources.push({label:rule.resource.label,max:rule.resource.formula==='pb'?pbonus:num(rule.resource.max)});if(rule.unarmedDamage)out.unarmedDamage=rule.unarmedDamage;out.combatFlags.push(...arr(rule.combatFlags))}
 out.skills=uniq(out.skills);let proficient=uniq([...baseSkills,...out.skills]);for(const s of out.skillUpgrades){if(proficient.includes(s))out.expertise.push(s);else{out.skills.push(s);proficient.push(s)}}out.skills=uniq(out.skills);proficient=uniq([...baseSkills,...out.skills]);out.expertise=uniq(out.expertise.filter(s=>proficient.includes(s)));out.tools=uniq(out.tools);out.saveProficiencies=uniq(out.saveProficiencies);out.spells=uniq(out.spells.map(s=>s.id)).map(id=>state.catalogs.spells.find(s=>s.id===id)).filter(Boolean);out.armorTraining=uniq(out.armorTraining);out.weaponTraining=uniq(out.weaponTraining);out.extraProficiencies=uniq(out.extraProficiencies);out.combatFlags=uniq(out.combatFlags);return out
}
export function featEligibleSpells(def,instanceKey){const data=store()[instanceKey]||{};return state.catalogs.spells.filter(spell=>spellAllowed(spell,def,data))}
export function featMissingChoices(){sanitizeFeatChoices();const data=store(),missing=[];for(const def of featChoiceDefs()){const v=data[def.instanceKey]?.[def.id],need=def.countFormula==='pb'?pb(state.c.choices.class.level):def.count;let ok=false;if(def.type==='asi')ok=!!v?.a1&&(v.mode!=='1+1'||!!v.a2);else if(def.type==='tools'||def.type==='skill_or_tool_multi'||def.type==='spells'||def.type==='ritual_spells'||def.type==='options_multi')ok=arr(v).length===need;else ok=Array.isArray(v)?v.length>0:!!v;if(!ok)missing.push(`Escolha ${def.label.toLowerCase()} para o talento ${def.featName}.`)}return missing}
export function auditedCoreFeatNames(){return Object.keys(FEAT_RULES)}
