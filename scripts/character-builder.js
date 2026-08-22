import{init}from'./character-builder/ui.js?v=20260822-character-builder13';
import{initSpellQuotaUi}from'./character-builder/spell-quota-ui.js?v=20260822-character-builder13';
import{initCharacterProfileUi}from'./character-builder/profile-ui.js?v=20260822-character-builder13';
import{initSpeciesTraitUi}from'./character-builder/species-trait-ui.js?v=20260822-character-builder13';
init().then(()=>{initSpellQuotaUi();initCharacterProfileUi();initSpeciesTraitUi()}).catch(e=>{const el=document.getElementById('loading');if(el)el.innerHTML=`<div class="status warning"><strong>Falha ao iniciar.</strong><br>${String(e.message||e)}</div>`;console.error('[character-builder]',e)});
