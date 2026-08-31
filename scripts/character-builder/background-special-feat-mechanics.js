import{state,arr,fold}from'./state.js';
import{featPrerequisiteResult}from'./feat-prerequisite-mechanics.js?v=20260831-feat-prereq1';

const QUICKSTONE_TOOLS={
 'Mark of Detection':'Conjunto de Jogo','Mark of Finding':'Conjunto de Jogo','Mark of Handling':'Ferramentas de Coureiro',
 'Mark of Healing':'Kit de Herbalismo','Mark of Hospitality':'Suprimentos de Cervejeiro ou Utensílios de Cozinheiro',
 'Mark of Making':'Ferramentas de Artesão','Mark of Passage':'Conjunto de Jogo','Mark of Scribing':'Suprimentos de Calígrafo',
 'Mark of Sentinel':'Conjunto de Jogo','Mark of Shadow':'Ferramentas de Artesão','Mark of Storm':'Ferramentas de Navegador','Mark of Warding':'Ferramentas de Ladrão'
};
function featByName(name){return state.catalogs.feats.find(feat=>fold(feat.name)===fold(name))||null}
function featById(id){return state.catalogs.feats.find(feat=>feat.id===id)||null}
function currentBackground(){return state.catalogs.backgrounds.find(bg=>bg.id===state.c?.refs?.background)||null}
function context(){const klass=state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null,species=state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null,lineage=species?.lineages?.find(x=>x.name===state.c?.choices?.species?.lineage)||null;return{level:state.c?.choices?.class?.level||1,klass,species,lineage,size:state.c?.choices?.species?.size,allFeats:state.catalogs.feats}}
function originalFeat(bg){return bg?._houseOriginalFeat||bg?.feat||null}
function isQuickstoneMigration(bg){return/quickstone/i.test(bg?.source||'')&&fold(originalFeat(bg)?.name)==='lesser dragonmark'}
function markOptions(){return state.catalogs.feats.filter(feat=>feat.category==='Dragonmark'&&feat.name!=='Aberrant Dragonmark'&&/^Mark of /.test(feat.name)).map(feat=>{const prereq=featPrerequisiteResult(feat,context());return{feat,valid:prereq.ok,reasons:prereq.reasons,tool:QUICKSTONE_TOOLS[feat.name]||''}})}
export function backgroundSpecialFeatGrant(bg=currentBackground()){
 if(!bg)return null;const original=originalFeat(bg),resolved=featByName(original?.name);
 if(resolved&&resolved.category!=='Origem'){const prereq=featPrerequisiteResult(resolved,context());return{mode:'fixed',feat:resolved,valid:prereq.ok,reasons:prereq.reasons,source:'Antecedente · talento especial'}}
 if(isQuickstoneMigration(bg)){const options=markOptions(),selected=featById(state.c?.choices?.background?.specialFeat),row=options.find(x=>x.feat.id===selected?.id)||null;return{mode:'choice',label:'Dragonmark oficial de Forge 2025',options,selected:row?.feat||null,valid:!!row?.valid,reasons:row?.reasons||[],source:'Antecedente Quickstone · migração Forge 2025'}}
 return null
}
function clearAutoTool(ch){if(ch.specialFeatTool&&ch.toolChoice===ch.specialFeatTool)ch.toolChoice='';delete ch.specialFeatTool}
export function sanitizeBackgroundSpecialFeatChoice(){
 if(!state.c?.choices)return false;const ch=state.c.choices.background||(state.c.choices.background={}),bg=currentBackground(),grant=backgroundSpecialFeatGrant(bg);let changed=false;
 if(grant?.mode!=='choice'){if(ch.specialFeat){delete ch.specialFeat;changed=true}clearAutoTool(ch);return changed}
 const row=grant.options.find(x=>x.feat.id===ch.specialFeat);if(!row?.valid){if(ch.specialFeat){delete ch.specialFeat;changed=true}clearAutoTool(ch);return changed}
 const autoTool=/indicada|tabela/i.test(bg?.toolChoice||'')?row.tool:'';if(autoTool){if(ch.toolChoice!==autoTool){ch.toolChoice=autoTool;changed=true}ch.specialFeatTool=autoTool}else clearAutoTool(ch);return changed
}
export function backgroundSpecialFeatInstance(){const grant=backgroundSpecialFeatGrant();if(!grant)return null;if(grant.mode==='fixed'&&grant.valid)return{key:'background:special',feat:grant.feat,source:grant.source};if(grant.mode==='choice'&&grant.valid&&grant.selected)return{key:'background:special',feat:grant.selected,source:grant.source};return null}
export function quickstoneDragonmarkTools(){return{...QUICKSTONE_TOOLS}}
