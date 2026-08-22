import{state,$,arr,num,esc,signed}from'./state.js';
import{selected,derive,spellProgress,spellSelectionQuota,spellCreditState}from'./rules.js';

let refreshQueued=false;
function spellPills(spells){return spells.length?spells.map(s=>`<span class="pill">${esc(s.name)}</span>`).join(''):'—'}
function notifyQuota(){document.dispatchEvent(new CustomEvent('hub:spell-selection-changed'))}

function renderSpellPreview(){
 const box=$('spellcasting'),{klass}=selected();if(!box)return;
 if(!klass?.spellAbility){box.innerHTML='<p class="muted">Esta classe não possui progressão de conjuração.</p>';return}
 const d=derive(),quota=spellSelectionQuota(klass,d.level),selectedSpells=d.selectedSpells,levels=[...new Set(selectedSpells.leveled.map(s=>s.level))].sort((a,b)=>a-b),wizard=klass.slug==='wizard';
 box.innerHTML=`<div class="value-row"><span>Atributo</span><strong>${esc(klass.spellAbility)}</strong></div><div class="value-row"><span>CD</span><strong>${d.spellDC}</strong></div><div class="value-row"><span>Ataque mágico</span><strong>${signed(d.spellAttack)}</strong></div><div class="value-row"><span>Truques</span><strong>${selectedSpells.cantrips.length}/${d.spell.cantrips}</strong></div><div>${spellPills(selectedSpells.cantrips)}</div><div class="value-row"><span>${esc(quota.label)}</span><strong>${selectedSpells.leveled.length}/${quota.total}</strong></div>${wizard?`<div class="value-row" data-wizard-prepared-limit="true"><span>Limite de preparação</span><strong>${d.spell.prepared}</strong></div>`:''}${levels.map(l=>`<p><strong>${l}º nível:</strong> ${spellPills(selectedSpells.leveled.filter(s=>s.level===l))}</p>`).join('')}<p class="mini">Espaços: ${d.spell.slots.map(x=>`${x.level}º: ${x.count}`).join(' · ')||'—'}</p>${Object.keys(selectedSpells.arcanum).length?`<p><strong>Arcanos Místicos:</strong> ${Object.entries(selectedSpells.arcanum).map(([l,s])=>`${l}º — ${esc(s.name)}`).join(' · ')}</p>`:''}`
}

function spellPending(){
 const{klass}=selected();if(!klass)return[];
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),progress=spellProgress(klass,level),quota=spellSelectionQuota(klass,level),sel=state.c.choices.spells||{cantrips:[],leveled:[],arcanum:{}},out=[];
 if(progress.cantrips&&arr(sel.cantrips).length<progress.cantrips)out.push(`Escolha ${progress.cantrips} truque(s) da classe.`);
 if(quota.total&&arr(sel.leveled).length<quota.total)out.push(`Escolha ${quota.total} magia(s) preparada(s)/conhecida(s).`);
 for(const l of progress.arcanumLevels)if(!sel.arcanum?.[l])out.push(`Escolha o Arcano Místico de ${l}º nível.`);
 return out
}
function refreshSpellPending(){
 const box=$('pending');if(!box)return;
 const spellPattern=/^Escolha (?:\d+ truque\(s\) da classe|\d+ magia\(s\) preparada\(s\)\/conhecida\(s\)|o Arcano Místico de \d+º nível)\.$/i,current=[...box.querySelectorAll('li')].map(li=>li.textContent.trim()).filter(x=>x&&!spellPattern.test(x)),all=[...new Set([...current,...spellPending()])];
 box.className=`status ${all.length?'warning':'ok'}`;
 box.innerHTML=all.length?`<strong>Escolhas pendentes</strong><ul>${all.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<strong>Ficha consistente.</strong> Todas as escolhas obrigatórias desta etapa foram preenchidas.'
}
function refreshSpellUi(){refreshQueued=false;renderSpellPreview();refreshSpellPending();notifyQuota()}
function queueRefresh(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refreshSpellUi)}

function onSpellChange(event){
 const box=$('magias-escolhas');if(!box||!box.contains(event.target))return;
 const input=event.target.closest('input[data-kind]'),arcanum=event.target.closest('select.arcanum-select');
 if(!input&&!arcanum)return;
 event.stopImmediatePropagation();
 const{klass}=selected();if(!klass)return;
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),sel=state.c.choices.spells;
 if(arcanum){sel.arcanum=sel.arcanum||{};sel.arcanum[arcanum.dataset.level]=arcanum.value||null;queueRefresh();return}
 const key=input.dataset.kind==='cantrip'?'cantrips':'leveled',current=arr(sel[key]);
 if(input.checked){
  if(key==='cantrips'){
   if(current.length>=spellProgress(klass,level).cantrips){input.checked=false;return}
  }else if(!spellCreditState(klass,level,[...current,input.value]).valid){input.checked=false;return}
  sel[key]=[...new Set([...current,input.value])]
 }else sel[key]=current.filter(id=>id!==input.value);
 queueRefresh()
}

export function initSpellSelectionUi(){const box=$('magias-escolhas');if(!box)return;box.addEventListener('change',onSpellChange,true)}
