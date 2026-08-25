import{state,$,arr,num,esc,signed}from'./state.js';
import{selected,derive,spellSelectionQuota}from'./rules.js';
import{spellProgressionCandidates,spellProgressionState,spellProgressionPending,resetSpellProgression}from'./spell-progression-rules.js?v=20260825-spell-progression1';

let rendering=false,scheduled=false,refreshQueued=false,editingLevel=null,search='',lastClassId=null;
const spellById=id=>arr(state.catalogs.spells).find(spell=>spell.id===id)||null;
const spellName=id=>spellById(id)?.name||'Magia indisponível';
const spellCircle=id=>num(spellById(id)?.level);
const stepHasChoices=step=>step.cantripGain||step.leveledGain||step.spellSwap||step.cantripSwap||step.arcanumLevel||step.arcanumSwap;
const changeLabel=change=>change?.decision==='replace'&&change.out&&change.in?`${spellName(change.out)} → ${spellName(change.in)}`:'mantida';
function selectedClass(){return selected().klass||null}
function currentLevel(){return Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1))}
function spellOption(spell,selectedId=''){return`<option value="${esc(spell.id)}" ${spell.id===selectedId?'selected':''}>${esc(spell.name)}${spell.level?` · ${spell.level}º círculo`:''}</option>`}
function spellPills(spells){return spells.length?spells.map(spell=>`<span class="pill">${esc(spell.name)}</span>`).join(''):'—'}
function renderSpellPreview(){
 const box=$('spellcasting'),klass=selectedClass();if(!box)return;if(!klass?.spellAbility){box.innerHTML='<p class="muted">Esta classe não possui progressão de conjuração.</p>';return}
 const d=derive(),quota=spellSelectionQuota(klass,d.level),selectedSpells=d.selectedSpells,levels=[...new Set(selectedSpells.leveled.map(spell=>spell.level))].sort((a,b)=>a-b),wizard=klass.slug==='wizard';
 box.innerHTML=`<div class="value-row"><span>Atributo</span><strong>${esc(klass.spellAbility)}</strong></div><div class="value-row"><span>CD</span><strong>${d.spellDC}</strong></div><div class="value-row"><span>Ataque mágico</span><strong>${signed(d.spellAttack)}</strong></div><div class="value-row"><span>Truques</span><strong>${selectedSpells.cantrips.length}/${d.spell.cantrips}</strong></div><div>${spellPills(selectedSpells.cantrips)}</div><div class="value-row"><span>${esc(quota.label)}</span><strong>${selectedSpells.leveled.length}/${quota.total}</strong></div>${wizard?`<div class="value-row" data-wizard-prepared-limit="true"><span>Limite de preparação</span><strong>${d.spell.prepared}</strong></div>`:''}${levels.map(level=>`<p><strong>${level}º nível:</strong> ${spellPills(selectedSpells.leveled.filter(spell=>spell.level===level))}</p>`).join('')}<p class="mini">Espaços: ${d.spell.slots.map(slot=>`${slot.level}º: ${slot.count}`).join(' · ')||'—'}</p>${Object.keys(selectedSpells.arcanum).length?`<p><strong>Arcanos Místicos:</strong> ${Object.entries(selectedSpells.arcanum).map(([level,spell])=>`${level}º — ${esc(spell.name)}`).join(' · ')}</p>`:''}`
}
function refreshPending(){
 const box=$('pending'),klass=selectedClass();if(!box||!klass?.spellAbility)return;
 const generic=/^Escolha (?:\d+ truque\(s\) da classe|\d+ magia\(s\) preparada\(s\)\/conhecida\(s\)|o Arcano Místico de \d+º nível)\.$/i,ours=/^Nível \d+: (?:escolha|conclua) .+\.$/i;
 const current=[...box.querySelectorAll('li')].map(li=>li.textContent.trim()).filter(text=>text&&!generic.test(text)&&!ours.test(text)),own=spellProgressionPending(klass,currentLevel()),all=[...new Set([...current,...own])];
 box.className=`status ${all.length?'warning':'ok'}`;box.innerHTML=all.length?`<strong>Escolhas pendentes</strong><ul>${all.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`:'<strong>Ficha consistente.</strong> Todas as escolhas obrigatórias desta etapa foram preenchidas.'
}
function refreshSpellUi(){refreshQueued=false;renderSpellPreview();refreshPending();document.dispatchEvent(new CustomEvent('hub:spell-selection-changed'))}
function queueRefresh(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refreshSpellUi)}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function mutate(callback){const klass=selectedClass();if(!klass)return;const level=currentLevel(),stateNow=spellProgressionState(klass,level),step=stateNow.steps.find(row=>row.level===editingLevel)||stateNow.steps.find(row=>!row.complete)||stateNow.steps.filter(stepHasChoices).at(-1);if(!step)return;callback(stateNow.progression.steps[String(step.level)],step);spellProgressionState(klass,level);render();queueRefresh()}

function levelSummary(step){
 const parts=[];
 if(step.cantripGain)parts.push(`+${step.cantripGain} truque${step.cantripGain===1?'':'s'}`);
 if(step.leveledGain)parts.push(`+${step.leveledGain} magia${step.leveledGain===1?'':'s'}`);
 if(step.arcanumLevel)parts.push(`Arcano ${step.arcanumLevel}º`);
 if(step.cantripSwap&&step.beforeCantrips.length)parts.push(`troca de truque opcional: ${changeLabel(step.stored.cantripChange)}`);
 if(step.spellSwap&&step.beforeLeveled.length)parts.push(`troca de magia opcional: ${changeLabel(step.stored.spellChange)}`);
 if(step.arcanumSwap&&Object.keys(step.beforeArcanum).length)parts.push(`troca de Arcano opcional: ${changeLabel(step.stored.arcanumChange)}`);
 return parts.join(' · ')||'Sem nova escolha de magia'
}
function renderLevelNav(progress){
 const relevant=progress.steps.filter(stepHasChoices);return`<div class="choice-grid" data-spell-progression-levels>${relevant.map(step=>{
  const active=step.level===editingLevel,status=step.locked?'Bloqueado':step.complete?'Concluído':'Pendente';
  return`<button type="button" class="secondary" data-spell-level="${step.level}" ${step.locked?'disabled':''} aria-pressed="${active?'true':'false'}"><strong>Nível ${step.level}</strong><br><small>${esc(status)} · ${esc(levelSummary(step))}</small></button>`
 }).join('')}</div>`
}
function checkbox(spell,kind,checked,disabled=false){return`<label class="check spell-check"><input type="checkbox" data-progression-kind="${kind}" value="${esc(spell.id)}" ${checked?'checked':''} ${disabled?'disabled':''}><span><strong>${esc(spell.name)}</strong>${spell.school?` <small class="muted">· ${esc(spell.school)}</small>`:''}</span></label>`}
function matchesSearch(spell){const q=search.trim().toLocaleLowerCase('pt-BR');return!q||`${spell.name} ${spell.originalName||''} ${spell.school||''}`.toLocaleLowerCase('pt-BR').includes(q)}
function renderCantripGain(klass,step){
 if(!step.cantripGain)return'';const selectedIds=arr(step.stored.cantrips),candidates=spellProgressionCandidates(klass,step.level,{kind:'cantrip'}).filter(matchesSearch),full=selectedIds.length>=step.cantripGain;
 return`<section><h4>Novos truques — ${selectedIds.length}/${step.cantripGain}</h4><p class="mini">Escolha apenas entre os truques disponíveis neste nível.</p><div class="check-grid spell-grid">${candidates.map(spell=>checkbox(spell,'gain-cantrip',selectedIds.includes(spell.id),full&&!selectedIds.includes(spell.id))).join('')||'<p class="muted">Nenhum truque corresponde à busca.</p>'}</div></section>`
}
function renderLeveledGain(klass,step){
 if(!step.leveledGain)return'';const selectedIds=arr(step.stored.leveled),before=new Set(step.beforeLeveled),candidates=spellProgressionCandidates(klass,step.level,{kind:'leveled'}).filter(spell=>!before.has(spell.id)&&matchesSearch(spell)),full=selectedIds.length>=step.leveledGain,levels=[...new Set(candidates.map(spell=>spell.level))].sort((a,b)=>a-b);
 return`<section><h4>Novas magias — ${selectedIds.length}/${step.leveledGain}</h4><p class="mini">Neste nível, você pode escolher qualquer magia de círculo permitido; não é obrigatório escolher o círculo mais alto.</p>${levels.map(circle=>`<details ${selectedIds.some(id=>spellCircle(id)===circle)?'open':''}><summary><strong>${circle}º círculo</strong></summary><div class="check-grid spell-grid">${candidates.filter(spell=>spell.level===circle).map(spell=>checkbox(spell,'gain-leveled',selectedIds.includes(spell.id),full&&!selectedIds.includes(spell.id))).join('')}</div></details>`).join('')||'<p class="muted">Nenhuma magia corresponde à busca.</p>'}</section>`
}
function renderSwap(klass,step,{kind,label,before,change}){
 if(!before.length)return'';const isCantrip=kind==='cantrip',enabled=change?.decision==='replace',out=change?.out||'',inId=change?.in||'',current=new Set(isCantrip?step.afterCantrips:step.afterLeveled),candidates=spellProgressionCandidates(klass,step.level,{kind:isCantrip?'cantrip':'leveled'}).filter(spell=>!current.has(spell.id)||spell.id===out||spell.id===inId).filter(matchesSearch);
 return`<section><label class="checkline"><input type="checkbox" data-progression-toggle="${kind}" ${enabled?'checked':''}> <strong>${esc(label)}</strong></label><p class="mini">Opcional. A magia removida precisa ter sido adquirida antes deste nível.</p>${enabled?`<div class="choice-grid"><label>Substituir<select data-progression-out="${kind}"><option value="">Selecione</option>${before.map(id=>`<option value="${esc(id)}" ${id===out?'selected':''}>${esc(spellName(id))}</option>`).join('')}</select></label><label>Por<select data-progression-in="${kind}"><option value="">Selecione</option>${candidates.filter(spell=>spell.id!==out).map(spell=>spellOption(spell,inId)).join('')}</select></label></div>`:''}</section>`
}
function renderArcanumGain(klass,step){
 if(!step.arcanumLevel)return'';const candidates=spellProgressionCandidates(klass,step.level,{kind:'arcanum',exactLevel:step.arcanumLevel}).filter(matchesSearch);
 return`<section><h4>Arcano Místico de ${step.arcanumLevel}º círculo</h4><label>Escolha o Arcano<select data-progression-arcanum="${step.arcanumLevel}"><option value="">Selecione</option>${candidates.map(spell=>spellOption(spell,step.stored.arcanum||'')).join('')}</select></label></section>`
}
function renderArcanumSwap(klass,step){
 const before=Object.values(step.beforeArcanum||{});if(!step.arcanumSwap||!before.length)return'';const change=step.stored.arcanumChange,enabled=change?.decision==='replace',out=change?.out||'',circle=spellCircle(out),inId=change?.in||'',current=new Set(Object.values(step.afterArcanum||{})),candidates=circle?spellProgressionCandidates(klass,step.level,{kind:'arcanum',exactLevel:circle}).filter(spell=>!current.has(spell.id)||spell.id===out||spell.id===inId).filter(matchesSearch):[];
 return`<section><label class="checkline"><input type="checkbox" data-progression-toggle="arcanum" ${enabled?'checked':''}> <strong>Substituir 1 Arcano Místico</strong></label><p class="mini">Opcional. O novo Arcano precisa ser do mesmo círculo do substituído.</p>${enabled?`<div class="choice-grid"><label>Substituir<select data-progression-out="arcanum"><option value="">Selecione</option>${before.map(id=>`<option value="${esc(id)}" ${id===out?'selected':''}>${esc(spellName(id))} · ${spellCircle(id)}º</option>`).join('')}</select></label><label>Por<select data-progression-in="arcanum"><option value="">Selecione</option>${candidates.filter(spell=>spell.id!==out).map(spell=>spellOption(spell,inId)).join('')}</select></label></div>`:''}</section>`
}
function renderActive(klass,step){
 if(!step)return'';const max=step.maxSpellLevel?`até ${step.maxSpellLevel}º círculo`:'sem novas magias de círculo';return`<fieldset data-progression-active="${step.level}"><legend>Nível ${step.level} · ${esc(max)}</legend><label>Buscar nesta etapa<input type="search" data-progression-search value="${esc(search)}" placeholder="Nome ou escola"></label>${renderCantripGain(klass,step)}${renderLeveledGain(klass,step)}${renderSwap(klass,step,{kind:'cantrip',label:'Substituir 1 truque adquirido anteriormente',before:step.cantripSwap?step.beforeCantrips:[],change:step.stored.cantripChange})}${renderSwap(klass,step,{kind:'spell',label:'Substituir 1 magia adquirida anteriormente',before:step.spellSwap?step.beforeLeveled:[],change:step.stored.spellChange})}${renderArcanumGain(klass,step)}${renderArcanumSwap(klass,step)}<p class="mini"><strong>Estado ao fim do nível:</strong> ${step.afterCantrips.length} truque(s) · ${step.afterLeveled.length} magia(s)${Object.keys(step.afterArcanum).length?` · ${Object.keys(step.afterArcanum).length} Arcano(s) Místico(s)`:''}.</p></fieldset>`
}
function render(){
 const box=$('magias-escolhas'),klass=selectedClass();if(!box)return;if(!klass?.spellAbility)return;
 const level=currentLevel(),progress=spellProgressionState(klass,level),first=progress.steps.find(step=>!step.complete),relevant=progress.steps.filter(stepHasChoices);
 if(editingLevel==null||!progress.steps.some(step=>step.level===editingLevel&&!step.locked))editingLevel=(first||relevant.at(-1))?.level||1;
 const active=progress.steps.find(step=>step.level===editingLevel&&!step.locked)||first||relevant.at(-1),pending=spellProgressionPending(klass,level);
 rendering=true;box.innerHTML=`<div data-spell-progression-ui><div class="status ${progress.complete?'ok':'warning'}"><strong>Progressão de magias nível por nível</strong><br>${progress.complete?`Progressão até o nível ${level} concluída.`:`Conclua o nível ${progress.firstIncompleteLevel} para liberar as escolhas seguintes.`}${klass.slug==='wizard'?'<br>Para o Mago, esta progressão registra as magias adicionadas ao grimório.':''}</div>${renderLevelNav(progress)}${renderActive(klass,active)}${pending.length?`<p class="mini"><strong>Próxima pendência:</strong> ${esc(pending[0])}</p>`:''}</div>`;rendering=false;refreshPending()
}
function onClick(event){const button=event.target.closest('[data-spell-level]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();editingLevel=num(button.dataset.spellLevel);search='';render()}
function onInput(event){if(!event.target.matches('[data-progression-search]'))return;event.stopImmediatePropagation();search=event.target.value;render()}
function onChange(event){
 const target=event.target;if(!target.closest('[data-spell-progression-ui]'))return;event.stopImmediatePropagation();event.preventDefault();
 if(target.matches('[data-progression-kind]'))mutate((stored,step)=>{const key=target.dataset.progressionKind==='gain-cantrip'?'cantrips':'leveled',limit=key==='cantrips'?step.cantripGain:step.leveledGain,current=arr(stored[key]);if(target.checked){if(current.length<limit)stored[key]=[...new Set([...current,target.value])]}else stored[key]=current.filter(id=>id!==target.value)});
 else if(target.matches('[data-progression-toggle]'))mutate(stored=>{const type=target.dataset.progressionToggle,key=type==='cantrip'?'cantripChange':type==='spell'?'spellChange':'arcanumChange';stored[key]=target.checked?{decision:'replace',out:null,in:null}:null});
 else if(target.matches('[data-progression-out]'))mutate(stored=>{const type=target.dataset.progressionOut,key=type==='cantrip'?'cantripChange':type==='spell'?'spellChange':'arcanumChange';stored[key]=stored[key]||{decision:'replace',out:null,in:null};stored[key].out=target.value||null;stored[key].in=null});
 else if(target.matches('[data-progression-in]'))mutate(stored=>{const type=target.dataset.progressionIn,key=type==='cantrip'?'cantripChange':type==='spell'?'spellChange':'arcanumChange';stored[key]=stored[key]||{decision:'replace',out:null,in:null};stored[key].in=target.value||null});
 else if(target.matches('[data-progression-arcanum]'))mutate(stored=>{stored.arcanum=target.value||null})
}
function bindContext(){
 $('classe')?.addEventListener('change',()=>queueMicrotask(()=>{const klass=selectedClass();if(klass?.id!==lastClassId){resetSpellProgression();lastClassId=klass?.id||null}editingLevel=null;search='';render();queueRefresh()}));
 $('nivel')?.addEventListener('change',()=>queueMicrotask(()=>{editingLevel=null;search='';render();queueRefresh()}));
 $('new-character')?.addEventListener('click',()=>queueMicrotask(()=>{lastClassId=selectedClass()?.id||null;editingLevel=null;search='';render();queueRefresh()}))
}
export function initSpellSelectionUi(){
 const box=$('magias-escolhas');if(!box)return;lastClassId=selectedClass()?.id||null;box.addEventListener('click',onClick,true);box.addEventListener('input',onInput,true);box.addEventListener('change',onChange,true);
 new MutationObserver(()=>{if(rendering)return;if(!box.querySelector('[data-spell-progression-ui]'))schedule()}).observe(box,{childList:true,subtree:true});bindContext();render();queueRefresh()
}
