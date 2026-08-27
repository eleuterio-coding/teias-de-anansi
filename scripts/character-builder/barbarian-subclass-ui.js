import{state,$,esc,arr}from'./state.js';
import{derive}from'./rules.js';
import{barbarianSubclassChoiceDefs,setBarbarianSubclassChoice}from'./barbarian-subclass-mechanics.js?v=20260827-barbarian-subclasses1';

let queued=false;
const CARD_ID='barbarian-subclass-mechanics-card';
function ensureCard(){
 let card=$(CARD_ID);if(card)return card;const host=document.querySelector('[data-wizard-panel="classe"] .step-grid');if(!host)return null;
 card=document.createElement('section');card.id=CARD_ID;card.className='card full';card.hidden=true;host.appendChild(card);return card
}
function optionList(def,current){return`<option value="">${def.required?'Selecione':'Escolha durante o jogo / definir preferência'}</option>${def.options.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('')}`}
function mechanicsHtml(out){
 const rows=[];
 for(const x of arr(out.summary))rows.push(`<div class="value-row"><span>${esc(x.name)}${x.scope?` <small class="muted">· ${esc(x.scope)}</small>`:''}</span><strong>${esc(x.value)}</strong></div>`);
 for(const x of arr(out.resources))rows.push(`<div class="value-row"><span>${esc(x.name)}${x.detail?` <small class="muted">· ${esc(x.detail)}</small>`:''}</span><strong>${esc(x.uses)} · ${esc(x.recovery)}</strong></div>`);
 for(const x of arr(out.defenses))rows.push(`<div class="value-row"><span>${esc(x.name)}${x.scope?` <small class="muted">· ${esc(x.scope)}</small>`:''}</span><strong>${esc(x.value)}</strong></div>`);
 for(const x of arr(out.attacks))rows.push(`<div class="value-row"><span>${esc(x.name)} · ataque ${x.attackBonus>=0?'+':''}${x.attackBonus}${x.extra?` <small class="muted">· ${esc(x.extra)}</small>`:''}</span><strong>${esc(x.damage)}</strong></div>`);
 for(const[name,value]of Object.entries(out.movementModes||{}))rows.push(`<div class="value-row"><span>Deslocamento de ${name==='climb'?'Escalada':name==='swim'?'Natação':name}</span><strong>${esc(value)} ft</strong></div>`);
 for(const x of arr(out.senses))rows.push(`<div class="value-row"><span>${esc(x.name)}</span><strong>${esc(x.value)}</strong></div>`);
 if(out.languages?.length)rows.push(`<div class="value-row"><span>Idioma da subclasse</span><strong>${out.languages.map(esc).join(', ')}</strong></div>`);
 if(out.tools?.length)rows.push(`<div class="value-row"><span>Proficiência em ferramenta</span><strong>${out.tools.map(esc).join(', ')}</strong></div>`);
 return rows.join('')||'<p class="muted">As características ativas desta subclasse não exigem cálculo ou escolha adicional na criação.</p>'
}
function featureHtml(features){return arr(features).map(f=>`<details class="feature"><summary>${esc(f.name)} — nível ${f.level}</summary><p>${esc(f.text)}</p></details>`).join('')}
function renderReview(d,out){
 const box=$('subclass-card');if(!box||!d.sub)return;const html=`<strong>${esc(d.sub.name)}</strong><p>${esc(d.sub.description||'')}</p>${out?`<p class="mini"><strong>Mecânicas aplicadas:</strong> Fúrias ${out.rages} · Dano de Fúria +${out.rageDamage}</p><div class="preview-block">${mechanicsHtml(out)}</div>${featureHtml(out.features)}`:''}`;if(box.innerHTML!==html)box.innerHTML=html
}
function render(){
 queued=false;const card=ensureCard();if(!card)return;const d=derive(),out=d.subclassMechanics;
 if(d.klass?.slug!=='barbarian'||!d.sub||d.level<3||!out){card.hidden=true;renderReview(d,null);return}
 card.hidden=false;const defs=barbarianSubclassChoiceDefs(d),controls=defs.map(def=>`<label>${esc(def.label)}${def.required?' *':''}<select data-barbarian-subclass-choice="${esc(def.id)}">${optionList(def,out.choices?.[def.id]||'')}</select><span class="mini">${esc(def.frequency)}${def.note?` · ${esc(def.note)}`:''}</span></label>`).join('');
 const pending=out.pending?.length?`<div class="status warning"><strong>Escolhas obrigatórias pendentes:</strong> ${out.pending.map(x=>esc(x.label)).join(' · ')}</div>`:'';
 card.innerHTML=`<h3>Mecânicas da subclasse — ${esc(d.sub.name)}</h3><p class="mini">As opções marcadas como “atual/preferida” representam escolhas que a própria regra permite trocar durante o jogo; não são travas permanentes do personagem.</p>${pending}${controls?`<fieldset><legend>Escolhas da subclasse</legend><div class="choice-grid">${controls}</div></fieldset>`:''}<div class="preview-block"><strong>Efeitos mecânicos calculados</strong>${mechanicsHtml(out)}</div><details open><summary><strong>Características ativas até o nível ${d.level}</strong></summary>${featureHtml(out.features)}</details>`;
 card.querySelectorAll('[data-barbarian-subclass-choice]').forEach(select=>select.addEventListener('change',e=>{const fresh=derive();setBarbarianSubclassChoice(fresh,e.target.dataset.barbarianSubclassChoice,e.target.value);const name=$('nome');if(name)name.dispatchEvent(new Event('input',{bubbles:true}));document.dispatchEvent(new CustomEvent('hub:subclass-mechanics-changed'));queueRender()}));
 renderReview(d,out)
}
function queueRender(){if(queued)return;queued=true;queueMicrotask(render)}
export function initBarbarianSubclassUi(){
 ensureCard();render();document.addEventListener('hub:class-context-changed',queueRender);document.addEventListener('hub:subclass-mechanics-ready',queueRender);document.addEventListener('hub:subclass-mechanics-changed',queueRender);
 $('builder')?.addEventListener('input',e=>{if(!e.target.closest(`#${CARD_ID}`))queueRender()});$('builder')?.addEventListener('change',e=>{if(!e.target.closest(`#${CARD_ID}`))queueRender()});$('new-character')?.addEventListener('click',()=>queueMicrotask(queueRender))
}
