import{state}from'./state.js';
import{selected}from'./rules.js?v=20260831-warlock-invocations2';

let initialized=false;
function chosenOriginFeat(){const id=state.c?.choices?.background?.originFeat;return id?state.catalogs.feats.find(feat=>feat.id===id)||null:null}
export function syncChosenOriginFeat(){
 const{bg}=selected();if(!bg)return null;const feat=chosenOriginFeat();
 bg.feat=feat?{name:feat.name,description:feat.description||'',source:feat.source||bg.source||''}:null;
 return feat
}
function invalidateFeatUi(){const controls=document.querySelector('[data-feat-mechanics-controls]');if(controls)controls.remove()}
function syncAndRefresh(){syncChosenOriginFeat();invalidateFeatUi()}
export function initOriginFeatSync(){if(initialized)return;initialized=true;syncAndRefresh();document.addEventListener('hub:origin-house-changed',syncAndRefresh);document.addEventListener('hub:origin-context-changed',syncAndRefresh);document.addEventListener('hub:new-character',()=>queueMicrotask(syncAndRefresh));document.getElementById('builder')?.addEventListener('change',e=>{if(e.target?.id==='antecedente')queueMicrotask(syncAndRefresh)})}
