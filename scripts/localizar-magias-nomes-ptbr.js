(()=>{
'use strict';
const V='20260820-ptbr1';
let MAP={},last='';
function applyList(root=document){root.querySelectorAll?.('#lista .item strong').forEach(st=>{const original=st.dataset.original||st.textContent.trim();if(!st.dataset.original)st.dataset.original=original;const pt=MAP[original];if(pt&&st.textContent!==pt)st.textContent=pt})}
function applyDetail(){if(!last)return;const h=document.querySelector('#detalhe h2');if(!h)return;const pt=MAP[last];if(pt&&h.textContent!==pt)h.textContent=pt}
document.addEventListener('click',e=>{const item=e.target.closest?.('#lista .item');if(!item)return;const st=item.querySelector('strong');last=st?.dataset.original||st?.textContent.trim()||'';setTimeout(applyDetail,0);setTimeout(applyDetail,300)},true);
fetch(`dados/localizacao-ptbr-magias-adicionais.json?v=${V}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(d=>{MAP=d.nomes||{};applyList();new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)applyList(n.parentElement||n)}).observe(document.getElementById('lista')||document.body,{childList:true,subtree:true});document.documentElement.dataset.magiasNomesPtbr='ativo'}).catch(e=>console.error('[Hub] Falha nos nomes PT-BR adicionais de Magias:',e));
})();