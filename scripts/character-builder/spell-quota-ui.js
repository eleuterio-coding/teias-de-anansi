import{state,$,arr,num}from'./state.js';
import{selected,item,spellProgress,spellSelectionQuota,spellCreditState}from'./rules.js';
import{initSpellCurrentListUi}from'./spell-current-list-ui.js?v=20260825-spell-policy1';

let choiceScheduled=false,sheetScheduled=false;
function selectedByLevel(ids){const counts={};for(const id of arr(ids)){const spell=item('spells',id),level=num(spell?.level);if(level>0)counts[level]=num(counts[level])+1}return counts}
function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function remainingForLevel(credits,spellLevel){return arr(credits?.remaining).filter(maxLevel=>num(maxLevel)>=spellLevel).length}

function decorateChoices(){
 const box=$('magias-escolhas'),{klass}=selected();if(!box||!klass?.spellAbility)return;
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),progress=spellProgress(klass,level),quota=spellSelectionQuota(klass,level),sel=state.c?.choices?.spells||{cantrips:[],leveled:[],arcanum:{}},counts=selectedByLevel(sel.leveled),credits=spellCreditState(klass,level,sel.leveled);
 const fieldset=box.querySelector('fieldset');if(fieldset){const legend=fieldset.querySelector(':scope>legend');if(legend)setText(legend,klass.slug==='wizard'?'Magias da classe — Grimório':klass.slug==='warlock'?'Magias da classe — Pact Magic':'Magias da classe')}
 for(const details of box.querySelectorAll('details.spell-level')){
  const summary=details.querySelector(':scope>summary');if(!summary)continue;const text=summary.textContent||'';
  if(/^Truques/i.test(text)){const chosen=arr(sel.cantrips).length,need=num(progress.cantrips);setHtml(summary,`<strong>Truques</strong> — ${chosen}/${need}`);for(const input of details.querySelectorAll('input[data-kind="cantrip"]'))input.disabled=!input.checked&&chosen>=need;continue}
  const m=text.match(/(\d+)º\s+nível/i);if(!m)continue;const spellLevel=num(m[1]),chosen=num(counts[spellLevel]),remaining=remainingForLevel(credits,spellLevel);setHtml(summary,`<strong>${spellLevel}º nível</strong> — ${chosen} escolhida${chosen===1?'':'s'} · faltam ${remaining}`);const blocked=remaining<=0;for(const input of details.querySelectorAll('input[data-kind="leveled"]'))input.disabled=!input.checked&&blocked
 }
 const totalLine=[...box.querySelectorAll('p.mini')].find(p=>/(Magias preparadas\/conhecidas|Magias no grimório|Magias de Pact Magic)/i.test(p.textContent||''));if(totalLine)setHtml(totalLine,`<strong>${quota.label}:</strong> ${arr(sel.leveled).length}/${quota.total}`);
 for(const select of box.querySelectorAll('.arcanum-select')){const spellLevel=num(select.dataset.level),label=select.closest('label');if(!label)continue;let marker=label.querySelector('.spell-quota-arcanum');if(!marker){marker=document.createElement('small');marker.className='mini spell-quota-arcanum';label.insertBefore(marker,select)}const chosen=sel.arcanum?.[spellLevel]?1:0;setText(marker,` — ${chosen}/1 `)}
}
function decorateSheet(){
 const box=$('spellcasting'),{klass}=selected();if(!box||!klass?.spellAbility||klass.slug!=='wizard')return;
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),progress=spellProgress(klass,level),quota=spellSelectionQuota(klass,level),sel=state.c?.choices?.spells||{leveled:[]};
 const row=[...box.querySelectorAll('.value-row')].find(r=>/(Preparadas\/conhecidas|Magias no grimório)/i.test(r.querySelector('span')?.textContent||''));if(!row)return;setText(row.querySelector('span'),'Magias no grimório');setText(row.querySelector('strong'),`${arr(sel.leveled).length}/${quota.total}`);let prep=box.querySelector('[data-wizard-prepared-limit]');if(!prep){prep=document.createElement('div');prep.className='value-row';prep.dataset.wizardPreparedLimit='true';row.insertAdjacentElement('afterend',prep)}setHtml(prep,`<span>Limite de preparação</span><strong>${progress.prepared}</strong>`)
}
function scheduleChoices(){if(choiceScheduled)return;choiceScheduled=true;queueMicrotask(()=>{choiceScheduled=false;decorateChoices()})}
function scheduleSheet(){if(sheetScheduled)return;sheetScheduled=true;queueMicrotask(()=>{sheetScheduled=false;decorateSheet()})}
export function initSpellQuotaUi(){
 initSpellCurrentListUi();const choices=$('magias-escolhas'),sheet=$('spellcasting');if(!choices&&!sheet)return;decorateChoices();decorateSheet();
 const choiceObserver=new MutationObserver(scheduleChoices),sheetObserver=new MutationObserver(scheduleSheet);if(choices)choiceObserver.observe(choices,{childList:true,subtree:true});if(sheet)sheetObserver.observe(sheet,{childList:true,subtree:true});
 document.addEventListener('hub:spell-selection-changed',()=>{decorateChoices();decorateSheet()});return{choiceObserver,sheetObserver}
}
