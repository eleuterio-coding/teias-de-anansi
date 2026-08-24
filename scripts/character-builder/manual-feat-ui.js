import{state,$}from'./state.js';
import{featRule,activeFeatInstances}from'./feat-mechanics.js';
let raf=0;
function manualInstances(){return activeFeatInstances().filter(inst=>!featRule(inst.feat))}
function decorate(){
 raf=0;const box=$('talentos-escolhas');if(!box)return;
 for(const select of box.querySelectorAll('select.feat-select,#bg-origin-feat'))for(const opt of select.options){if(!opt.value)continue;const feat=state.catalogs.feats.find(f=>f.id===opt.value);if(feat&&!featRule(feat)&&!/aplicação manual/i.test(opt.textContent))opt.textContent+=` · aplicação manual`}
 const manual=manualInstances(),existing=box.querySelector('[data-manual-feats-note]');
 if(!manual.length){existing?.remove();return}
 const signature=manual.map(x=>x.feat.id||x.feat.name).sort().join('|');
 if(existing?.dataset.signature===signature)return;
 const html=`<strong>Talento com aplicação manual</strong><p class="mini">${manual.map(x=>x.feat.name).join(', ')} está disponível no catálogo, mas o Hub possui apenas uma síntese ou bloco insuficiente para automatizar todos os efeitos com segurança. A escolha é salva na ficha; aplique a mecânica integral da fonte sem inferir valores ausentes.</p>`;
 if(existing){existing.dataset.signature=signature;if(existing.innerHTML!==html)existing.innerHTML=html;return}
 const note=document.createElement('div');note.dataset.manualFeatsNote='';note.dataset.signature=signature;note.className='status warning';note.innerHTML=html;box.appendChild(note)
}
function schedule(){if(raf)return;raf=requestAnimationFrame(decorate)}
export function initManualFeatUi(){schedule();$('builder')?.addEventListener('change',schedule);document.addEventListener('hub:class-skills-changed',schedule);$('new-character')?.addEventListener('click',schedule);const box=$('talentos-escolhas');if(box)new MutationObserver(schedule).observe(box,{childList:true,subtree:true})}
