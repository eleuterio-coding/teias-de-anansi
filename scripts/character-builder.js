import{init}from'./character-builder/ui.js?v=20260822-character-builder18';
import{initSpellQuotaUi}from'./character-builder/spell-quota-ui.js?v=20260822-character-builder18';
import{initSpellSelectionUi}from'./character-builder/spell-selection-ui.js?v=20260822-character-builder18';
import{initCharacterProfileUi}from'./character-builder/profile-ui.js?v=20260822-character-builder18';
import{initSpeciesTraitUi}from'./character-builder/species-trait-ui.js?v=20260822-character-builder18';
import{initClassSkillUi}from'./character-builder/class-skill-ui.js?v=20260822-character-builder18';
import{initFeatUi}from'./character-builder/feat-ui.js?v=20260822-character-builder18';
import{initHouseRulesUi}from'./character-builder/house-rules-ui.js?v=20260822-house-progression1';
import{initLanguageUi}from'./character-builder/language-ui.js?v=20260822-character-builder18';

/*
 * A página de criação é altamente dinâmica. O indexador semântico global,
 * injetado no deploy, observa document.body e reprocessa a página inteira a
 * cada mutação. Trocar a classe reconstrói perícias, talentos, magias e a
 * prévia da ficha, gerando centenas de mutações e podendo bloquear a thread
 * principal em celulares. Mantemos MutationObserver normal para os módulos do
 * construtor, mas recusamos especificamente o observador global de body com
 * characterData/subtree usado pelo indexador.
 */
document.body?.classList.add('controles');
const NativeMutationObserver=window.MutationObserver;
window.MutationObserver=class HubBuilderMutationObserver extends NativeMutationObserver{
  observe(target,options={}){
    if(target===document.body&&options?.subtree&&options?.characterData)return;
    return super.observe(target,options)
  }
};

init().then(()=>{initSpellSelectionUi();initSpellQuotaUi();initCharacterProfileUi();initSpeciesTraitUi();initClassSkillUi();initFeatUi();initHouseRulesUi();initLanguageUi()}).catch(e=>{const el=document.getElementById('loading');if(el)el.innerHTML=`<div class="status warning"><strong>Falha ao iniciar.</strong><br>${String(e.message||e)}</div>`;console.error('[character-builder]',e)});
