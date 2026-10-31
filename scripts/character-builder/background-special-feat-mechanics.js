import{state,fold}from'./state.js';
import{featPrerequisiteResult}from'./feat-prerequisite-mechanics.js';

function featByName(name){return state.catalogs.feats.find(feat=>fold(feat.name)===fold(name))||null}
function currentBackground(){return state.catalogs.backgrounds.find(bg=>bg.id===state.c?.refs?.background)||null}
function context(){const klass=state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null,species=state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null,lineage=species?.lineages?.find(x=>x.name===state.c?.choices?.species?.lineage)||null;return{level:state.c?.choices?.class?.level||1,klass,species,lineage,size:state.c?.choices?.species?.size,allFeats:state.catalogs.feats}}
function originalFeat(bg){return bg?._houseOriginalFeat||bg?.feat||null}
export function backgroundSpecialFeatGrant(bg=currentBackground()){
 if(!bg)return null;const original=originalFeat(bg),resolved=featByName(original?.name);
 if(resolved&&resolved.category!=='Origem'){const prereq=featPrerequisiteResult(resolved,context());return{mode:'fixed',feat:resolved,valid:prereq.ok,reasons:prereq.reasons,source:'Antecedente · talento especial'}}
 return null
}
export function sanitizeBackgroundSpecialFeatChoice(){
 const ch=state.c?.choices?.background;if(!ch)return false;
 let changed=false;
 if(ch.specialFeat){delete ch.specialFeat;changed=true}
 if(ch.specialFeatTool){if(ch.toolChoice===ch.specialFeatTool){ch.toolChoice='';changed=true}delete ch.specialFeatTool;changed=true}
 return changed
}
export function backgroundSpecialFeatInstance(){const grant=backgroundSpecialFeatGrant();if(!grant)return null;if(grant.mode==='fixed'&&grant.valid)return{key:'background:special',feat:grant.feat,source:grant.source};return null}
