import{arr,num,fold}from'./character-builder/state.js';

const BREAK_CONCENTRATION=new Set(['incapacitado','atordoado','paralisado','inconsciente','petrificado']);
const SPECIFIC_MATERIAL=/(?:\b\d[\d.,]*\s*(?:gp|po|sp|pp|cp|pc|ep|pe)\b|consum(?:e|ed|ido|ida|ir|ível)|diamante|diamond|pérola|pearl)/i;
const DAILY_PREPARED=new Set(['wizard','cleric','druid','artificer']);
const LONG_ONE=new Set(['paladin','ranger']);
const now=()=>new Date().toISOString();

const CE_PRIMARY=new Set(['CM','CI','CZ']);
const CE_KNOWN=new Set(['CM','CI','CZ','CL']);
function normalizeCECategory(value){const category=String(value||'NC').toUpperCase();return CE_KNOWN.has(category)?category:'NC'}
function cleanConcentration(row){if(!row||typeof row!=='object'||Array.isArray(row))return null;return{
 spellId:row.spellId||null,spellName:String(row.spellName||'Magia'),
 sourceKey:String(row.sourceKey||'class'),category:normalizeCECategory(row.category),
 startedAt:row.startedAt||now()
}}
export function ensureSpellcastingState(character){
 if(!character)return null;
 character.sheet=character.sheet||{};
 let root=character.sheet.spellcasting;
 if(!root||typeof root!=='object'||Array.isArray(root))root={};
 // Migração não destrutiva da ficha anterior (concentration singular).
 const legacy=root.concentration&&typeof root.concentration==='object'&&!Array.isArray(root.concentration)?root.concentration:null;
 root.concentrations=Array.isArray(root.concentrations)
  ?root.concentrations.map(cleanConcentration).filter(Boolean)
  :(legacy?[cleanConcentration(legacy)]:[]);
 root.concentration=root.concentrations[0]||null; // Compatibilidade com leitores antigos.
 root.pendingConcentrationFailure=root.pendingConcentrationFailure&&typeof root.pendingConcentrationFailure==='object'?root.pendingConcentrationFailure:null;
 root.concentrationHistory=arr(root.concentrationHistory).filter(Boolean);
 root.ritualCastLog=arr(root.ritualCastLog).filter(Boolean);
 root.preparationWindow=root.preparationWindow&&typeof root.preparationWindow==='object'&&!Array.isArray(root.preparationWindow)?root.preparationWindow:null;
 character.sheet.spellcasting=root;return root
}
export function spellComponentProfile(spell){const c=spell?.components||{},verbal=!!c.verbal,somatic=!!c.somatic,material=!!c.material,materialText=String(c.materialText||'').trim();return{verbal,somatic,material,materialText,specificMaterial:material&&SPECIFIC_MATERIAL.test(materialText),label:[verbal?'V':null,somatic?'S':null,material?'M':null].filter(Boolean).join(', ')||'—'}}

// A regra base tem mínimo 10 e teto 30. Cada concentração extra adiciona +2.
export function concentrationDc(damage,concurrent=1){return Math.min(30,Math.max(10,Math.floor(Math.max(0,num(damage))/2))+2*Math.max(0,Math.floor(num(concurrent)||1)-1))}
export function effectiveConcentrationLevel(derived){
 const explicit=Number(derived?.spell?.effectiveCasterLevel??derived?.effectiveCasterLevel);
 if(Number.isFinite(explicit)&&explicit>=1)return Math.min(20,Math.floor(explicit));
 const level=Math.max(1,Math.min(20,Math.floor(num(derived?.level)||1))),klass=String(derived?.klass?.slug||'').toLowerCase();
 if(['wizard','cleric','druid','bard','sorcerer','warlock'].includes(klass))return level;
 if(['paladin','ranger','artificer'].includes(klass))return Math.max(1,Math.ceil(level/2));
 if(['fighter','rogue'].includes(klass))return arr(derived?.spell?.slots).length?Math.max(1,Math.ceil(level/3)):1;
 // Magias concedidas por talento/raça não criam, por si só, progressão de conjurador.
 return derived?.klass?.spellAbility?level:1
}
export function activeConcentrations(character){return[...arr(ensureSpellcastingState(character)?.concentrations)]}
export function activeConcentration(character){return activeConcentrations(character)[0]||null}
export function concentrationCompositionValid(categories,casterLevel=1){
 const types=arr(categories).map(normalizeCECategory);
 if(types.length<=1)return true;
 if(types.some(x=>!CE_KNOWN.has(x)))return false;
 const level=Math.max(1,Math.min(20,Math.floor(num(casterLevel)||1)));
 const key=types.slice().sort().join('+');
 const legal=new Set();
 if(level>=5)for(const major of CE_PRIMARY)legal.add([major,'CL'].sort().join('+'));
 if(level>=10)for(const major of CE_PRIMARY)legal.add([major,'CL','CL'].sort().join('+'));
 if(level>=20){legal.add('CI+CM');legal.add('CM+CZ')}
 return legal.has(key);
}
export function previewConcentration(character,spell,{category='NC',casterLevel=1}={}){
 const root=ensureSpellcastingState(character);
 if(!root||!spell?.concentration)return{ok:false,reason:'A magia não exige Concentração.'};
 const active=activeConcentrations(character),kind=normalizeCECategory(category),level=Math.max(1,Math.min(20,Math.floor(num(casterLevel)||1)));
 const blocked=concentrationBreakingConditions(character);
 if(blocked.length)return{ok:false,reason:'Concentração impedida por condição incapacitante.',active,category:kind};
 if(root.pendingConcentrationFailure)return{ok:false,reason:'Resolva primeiro qual Concentração será encerrada pela falha na salvaguarda.',active,category:kind};
 if(active.some(row=>row.spellId&&row.spellId===spell.id))return{ok:false,reason:'Esta magia já está em Concentração. Encerre a instância anterior antes de reiniciá-la.',active,category:kind};
 if(!concentrationCompositionValid([...active.map(row=>row.category),kind],level))
  return{ok:false,reason:kind==='NC'?'A magia ainda não possui categoria validada de Concentração Expandida. Encerre as outras concentrações antes de mantê-la.':'A combinação excede os Limites de Coexistência para o nível efetivo de conjuração.',active,category:kind,casterLevel:level};
 return{ok:true,active,category:kind,casterLevel:level};
}
export function startConcentration(character,spell,sourceKey='class',options={}){
 const root=ensureSpellcastingState(character),plan=previewConcentration(character,spell,options);
 if(!root||!spell?.concentration)return plan;
 const strict=options?.strict===true;
 if(!plan.ok&&strict)return plan; // Nunca gastar recurso nem encerrar escolha do jogador em um lançamento inválido.
 if(concentrationBreakingConditions(character).length||root.pendingConcentrationFailure)return plan;
 const previous=activeConcentrations(character);
 if(!plan.ok)endConcentration(character,'substituída por outra Concentração'); // compatibilidade com chamadas legadas.
 const current={spellId:spell.id||null,spellName:spell.name||'Magia',sourceKey:String(sourceKey||'class'),category:normalizeCECategory(options?.category),startedAt:now()};
 root.concentrations.push(current);root.concentration=root.concentrations[0]||null;
 return{ok:true,previous:previous[0]||null,retained:plan.ok?previous:[],current,active:activeConcentrations(character)}
}
// Sem spellId, é encerramento de TODAS as concentrações (incapacitação/Descanso Longo).
export function endConcentration(character,reason='encerrada manualmente',spellId=null,{casterLevel=1,strict=false}={}){
 const root=ensureSpellcastingState(character),current=activeConcentrations(character);
 if(!current.length)return{ok:false,reason:'Nenhuma Concentração ativa.'};
 const ended=spellId==null?current:current.filter(x=>x.spellId===spellId);
 if(!ended.length)return{ok:false,reason:'A Concentração selecionada não está ativa.'};
 if(strict&&spellId!=null&& !concentrationCompositionValid(current.filter(x=>x.spellId!==spellId).map(x=>x.category),casterLevel))return{ok:false,reason:'Encerrar esta magia deixaria uma combinação proibida. Escolha outra Concentração ou encerre todas.'};
 const endedSet=new Set(ended);
 for(const row of ended)root.concentrationHistory.push({...row,endedAt:now(),endReason:String(reason||'encerrada')});
 root.concentrations=root.concentrations.filter(x=>!endedSet.has(x));
 root.concentration=root.concentrations[0]||null;root.pendingConcentrationFailure=null;
 return{ok:true,ended:ended[0],endedAll:ended,active:activeConcentrations(character)}
}
export function concentrationBreakingConditions(character){const runtime=character?.sheet?.runtime||{},conditions=arr(runtime.conditions).map(fold),found=conditions.filter(condition=>BREAK_CONCENTRATION.has(condition));if(runtime.currentHp!=null&&Number(runtime.currentHp)===0)found.push('inconsciente (0 PV)');return[...new Set(found)]}
export function enforceConcentrationState(character){const active=activeConcentrations(character),breaking=concentrationBreakingConditions(character);if(active.length&&breaking.length)return endConcentration(character,`condição incapacitante: ${breaking.join(', ')}`);return{ok:true,active,breaking}}
export function pendingConcentrationFailure(character){return ensureSpellcastingState(character)?.pendingConcentrationFailure||null}
export function failConcentrationSave(character,reason='falha na salvaguarda de Concentração'){
 const root=ensureSpellcastingState(character),active=activeConcentrations(character);
 if(!active.length)return{ok:false,reason:'Nenhuma Concentração ativa.'};
 if(active.length===1)return endConcentration(character,reason,active[0].spellId);
 root.pendingConcentrationFailure={at:now(),reason:String(reason),spellIds:active.map(x=>x.spellId)};
 return{ok:true,selectionRequired:true,active};
}
export function resolveConcentrationFailure(character,spellId,casterLevel=1){
 const pending=pendingConcentrationFailure(character);
 if(!pending)return{ok:false,reason:'Não há falha de Concentração aguardando escolha.'};
 if(!arr(pending.spellIds).includes(spellId))return{ok:false,reason:'Esta magia não estava ativa quando ocorreu a falha.'};
 return endConcentration(character,pending.reason||'falha na salvaguarda',spellId,{casterLevel,strict:true});
}
export function spellCastReadiness(character,spell,{bothHandsOccupied=false,warCaster=false}={}){const components=spellComponentProfile(spell),conditions=concentrationBreakingConditions(character),blocked=[],warnings=[];if(conditions.length)blocked.push('Uma condição incapacitante impede conjurar esta magia.');if(components.somatic&&bothHandsOccupied&&!warCaster&&!components.material)blocked.push('O componente Somático exige uma mão disponível; War Caster pode ignorar esta restrição.');if(components.material&&bothHandsOccupied&&!warCaster)warnings.push('Confirme que uma das mãos ocupadas está usando o foco ou o componente Material permitido.');if(components.specificMaterial)warnings.push(`Componente Material específico deve ser confirmado: ${components.materialText||'consulte a magia'}.`);if(components.verbal)warnings.push('Componente Verbal exige que o personagem consiga falar.');return{available:blocked.length===0,blocked,warnings,components}}
export function ritualEligible(spell,{prepared=false,wizardSpellbook=false}={}){return!!(spell?.ritual&&(prepared||wizardSpellbook))}
export function recordRitualCast(character,spell,sourceKey='class'){const root=ensureSpellcastingState(character);if(!spell?.ritual)return{ok:false,reason:'Esta magia não possui a tag Ritual.'};const row={id:`ritual-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,spellId:spell.id||null,spellName:spell.name||'Magia',sourceKey:String(sourceKey||'class'),at:now()};root.ritualCastLog.push(row);return{ok:true,row}}
export function openPreparationWindow(character,{rest='long',classSlug='',level=1,baseline=[]}={}){const root=ensureSpellcastingState(character),slug=fold(classSlug),l=Math.max(1,Math.min(20,Math.floor(num(level)||1)));let mode=null,label='';if(rest==='long'&&DAILY_PREPARED.has(slug)){mode='full';label='Preparação completa após Descanso Longo'}else if(rest==='long'&&LONG_ONE.has(slug)){mode='one';label='1 substituição após Descanso Longo'}else if(rest==='short'&&slug==='wizard'&&l>=5){mode='one';label='Memorizar Magia · 1 substituição após Descanso Curto'}if(!mode){root.preparationWindow=null;return null}root.preparationWindow={mode,label,rest,openedAt:now(),classSlug:slug,baseline:[...new Set(arr(baseline).filter(Boolean))]};return root.preparationWindow}
export function preparationWindow(character){return ensureSpellcastingState(character)?.preparationWindow||null}
export function closePreparationWindow(character){const root=ensureSpellcastingState(character),old=root?.preparationWindow;root.preparationWindow=null;return old||null}
export function preparationChangeAllowed(character,nextIds=[]){const window=preparationWindow(character);if(!window)return{ok:false,reason:'A lista só pode ser alterada na janela adequada de descanso ou progressão.'};if(window.mode==='full')return{ok:true};const baseline=new Set(arr(window.baseline)),next=new Set(arr(nextIds)),removed=[...baseline].filter(id=>!next.has(id)),added=[...next].filter(id=>!baseline.has(id));if(removed.length>1||added.length>1)return{ok:false,reason:'Esta janela permite substituir apenas 1 magia.'};return{ok:true,removed,added}}
