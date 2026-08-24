import{init}from'./character-builder/ui.js?v=20260823-character-builder21';
import{initSpellQuotaUi}from'./character-builder/spell-quota-ui.js?v=20260823-character-builder21';
import{initSpellSelectionUi}from'./character-builder/spell-selection-ui.js?v=20260823-character-builder21';
import{initCharacterProfileUi}from'./character-builder/profile-ui.js?v=20260823-character-builder21';
import{initSpeciesTraitUi}from'./character-builder/species-trait-ui.js?v=20260823-character-builder21';
import{initClassSkillUi}from'./character-builder/class-skill-ui.js?v=20260823-character-builder21';
import{initFeatUi}from'./character-builder/feat-ui.js?v=20260823-character-builder21';
import{initHouseRulesUi}from'./character-builder/house-rules-ui.js?v=20260823-character-builder21';
import{initLanguageUi}from'./character-builder/language-ui.js?v=20260823-character-builder21';

document.body?.classList.add('controles');
const loading=document.getElementById('loading');
const builder=document.getElementById('builder');
if(loading){loading.textContent='';loading.hidden=true}
if(builder)builder.hidden=false;

const NativeMutationObserver=window.MutationObserver;
window.MutationObserver=class HubBuilderMutationObserver extends NativeMutationObserver{
  observe(target,options={}){
    if(target===document.body&&options?.subtree&&options?.characterData)return;
    return super.observe(target,options)
  }
};

const startup=init();
if(loading){loading.textContent='';loading.hidden=true}
if(builder)builder.hidden=false;

startup.then(()=>{
  if(loading){loading.textContent='';loading.hidden=true}
  if(builder)builder.hidden=false;
  initSpellSelectionUi();
  initSpellQuotaUi();
  initCharacterProfileUi();
  initSpeciesTraitUi();
  initClassSkillUi();
  initFeatUi();
  initHouseRulesUi();
  initLanguageUi();
}).catch(e=>{
  if(loading){loading.textContent='';loading.hidden=true}
  if(builder)builder.hidden=false;
  const el=document.getElementById('load-warnings');
  if(el){el.hidden=false;el.innerHTML=`<strong>Falha ao iniciar o criador.</strong><br>${String(e.message||e)}`}
  console.error('[character-builder]',e)
});
