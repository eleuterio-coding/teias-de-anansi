import{init}from'./character-builder/ui.js?v=20260822-character-builder15';
import{initSpellQuotaUi}from'./character-builder/spell-quota-ui.js?v=20260822-character-builder15';
import{initSpellSelectionUi}from'./character-builder/spell-selection-ui.js?v=20260822-character-builder15';
import{initCharacterProfileUi}from'./character-builder/profile-ui.js?v=20260822-character-builder15';
import{initSpeciesTraitUi}from'./character-builder/species-trait-ui.js?v=20260822-character-builder15';
init().then(()=>{initSpellSelectionUi();initSpellQuotaUi();initCharacterProfileUi();initSpeciesTraitUi()}).catch(e=>{const el=document.getElementById('loading');if(el)el.innerHTML=`<div class="status warning"><strong>Falha ao iniciar.</strong><br>${String(e.message||e)}</div>`;console.error('[character-builder]',e)});
