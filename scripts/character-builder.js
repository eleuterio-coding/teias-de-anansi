import{init}from'./character-builder/ui.js?v=20260821-character-builder11';
import{initSpellQuotaUi}from'./character-builder/spell-quota-ui.js?v=20260821-character-builder11';
init().then(()=>initSpellQuotaUi()).catch(e=>{const el=document.getElementById('loading');if(el)el.innerHTML=`<div class="status warning"><strong>Falha ao iniciar.</strong><br>${String(e.message||e)}</div>`;console.error('[character-builder]',e)});
