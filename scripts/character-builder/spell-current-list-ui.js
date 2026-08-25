import{state,$,arr,num,esc,uniq}from'./state.js';
import{selected}from'./rules.js';
import{usesCurrentLeveledList,usesCurrentCantripList,preparedChangeText,cantripChangeText}from'./spell-class-policy.js?v=20260825-spell-policy1';
import{classSpellData,spellProgressionCandidates,spellProgressionState}from'./spell-progression-rules.js?v=20260825-spell-progression2';

let initialized=false,search='',queued=false;
function klass(){return selected().klass||null}
function level(){return Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1))}
function store(){state.c.choices.spells=state.c.choices.spells||{cantrips:[],leveled:[],arcanum:{}};return state.c.choices.spells}
function matches(spell){const q=search.trim().toLocaleLowerCase('pt-BR');return!q||`${spell.name} ${spell.originalName||''} ${spell.school||''}`.toLocaleLowerCase('pt-BR').includes(q)}
function sanitize(k,l){
 const s=store(),p=classSpellData(k,l);
 if(usesCurrentCantripList(k)){const allowed=new Set(spellProgressionCandidates(k,l,{kind:'cantrip'}).map(x=>x.id));s.cantrips=uniq(arr(s.cantrips)).filter(id=>allowed.has(id)).slice(0,p.cantrips)}
 if(usesCurrentLeveledList(k)){const allowed=new Set(spellProgressionCandidates(k,l,{kind:'leveled'}).map(x=>x.id));s.leveled=uniq(arr(s.leveled)).filter(id=>allowed.has(id)).slice(0,p.prepared)}
 return p
}
function check(spell,type,selectedIds,limit){const checked=selectedIds.includes(spell.id),disabled=!checked&&selectedIds.length>=limit;return`<label class="check spell-check"><input type="checkbox" data-current-spell="${type}" value="${esc(spell.id)}" ${checked?'checked':''} ${disabled?'disabled':''}><span><strong>${esc(spell.name)}</strong>${spell.school?` <small class="muted">· ${esc(spell.school)}</small>`:''}</span></label>`}
function cantripHtml(k,l,p,s){
 if(!usesCurrentCantripList(k)||!p.cantrips)return'';const candidates=spellProgressionCandidates(k,l,{kind:'cantrip'}).filter(matches),selected=arr(s.cantrips);
 return`<section class="spell-current-block"><h4>Truques atuais — ${selected.length}/${p.cantrips}</h4><p class="mini">${esc(cantripChangeText(k))}</p><div class="check-grid spell-grid">${candidates.map(spell=>check(spell,'cantrip',selected,p.cantrips)).join('')||'<p class="muted">Nenhum truque corresponde à busca.</p>'}</div></section>`
}
function leveledHtml(k,l,p,s){
 if(!usesCurrentLeveledList(k)||!p.prepared)return'';const candidates=spellProgressionCandidates(k,l,{kind:'leveled'}).filter(matches),selected=arr(s.leveled),levels=[...new Set(candidates.map(spell=>num(spell.level)))].sort((a,b)=>a-b);
 return`<section class="spell-current-block"><h4>Magias preparadas atuais — ${selected.length}/${p.prepared}</h4><p class="mini">A distribuição entre círculos não é fixa: escolha qualquer combinação de magias para as quais a classe possua acesso, respeitando apenas o total preparado.</p><p class="mini"><strong>Alteração da lista:</strong> ${esc(preparedChangeText(k))}</p>${levels.map(circle=>{const rows=candidates.filter(spell=>num(spell.level)===circle),open=rows.some(spell=>selected.includes(spell.id));return`<details ${open?'open':''}><summary><strong>${circle}º círculo</strong> — ${selected.filter(id=>num(state.catalogs.spells.find(x=>x.id===id)?.level)===circle).length} selecionada(s)</summary><div class="check-grid spell-grid">${rows.map(spell=>check(spell,'leveled',selected,p.prepared)).join('')}</div></details>`}).join('')||'<p class="muted">Nenhuma magia corresponde à busca.</p>'}</section>`
}
function ensurePanel(){const box=$('magias-escolhas');if(!box)return null;let panel=$('spell-current-list-panel');if(!panel){panel=document.createElement('section');panel.id='spell-current-list-panel';panel.dataset.currentSpellList='';box.appendChild(panel)}return panel}
function syncProgressStatus(k,l,root){
 if(!root||root.hidden)return;const progress=spellProgressionState(k,l),status=root.querySelector(':scope > .status');if(!status||!progress.historyComplete||progress.current.complete)return;
 status.className='status warning';status.innerHTML='<strong>Progressão de magias</strong><br>As escolhas nível por nível estão concluídas. Complete a lista atual de truques e/ou magias preparadas para finalizar esta etapa.'
}
function render(){
 const k=klass(),box=$('magias-escolhas');if(!box||!k?.spellAbility)return;const l=level(),usesCurrent=usesCurrentLeveledList(k)||usesCurrentCantripList(k),root=box.querySelector('[data-spell-progression-ui]');
 if(root){const hasHistory=!!root.querySelector('[data-spell-level]');root.hidden=!hasHistory&&usesCurrent}
 let panel=$('spell-current-list-panel');if(!usesCurrent){panel?.remove();return}
 const p=sanitize(k,l),s=store();panel=ensurePanel();if(!panel)return;
 panel.innerHTML=`<fieldset><legend>Lista atual de conjuração</legend><label>Buscar magia<input type="search" data-current-spell-search value="${esc(search)}" placeholder="Nome ou escola"></label>${cantripHtml(k,l,p,s)}${leveledHtml(k,l,p,s)}</fieldset>`;syncProgressStatus(k,l,root)
}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'));document.dispatchEvent(new CustomEvent('hub:spell-selection-changed'))}
function onChange(event){
 const input=event.target.closest('input[data-current-spell]'),panel=$('spell-current-list-panel');if(!input||!panel?.contains(input))return;event.stopImmediatePropagation();const k=klass(),l=level(),p=classSpellData(k,l),s=store(),key=input.dataset.currentSpell==='cantrip'?'cantrips':'leveled',limit=key==='cantrips'?p.cantrips:p.prepared,current=arr(s[key]);
 if(input.checked){if(current.length>=limit){input.checked=false;return}s[key]=uniq([...current,input.value]).slice(0,limit)}else s[key]=current.filter(id=>id!==input.value);
 render();refreshSheet()
}
function onInput(event){if(!event.target.matches('[data-current-spell-search]'))return;search=event.target.value;render()}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render()})}
export function initSpellCurrentListUi(){if(initialized)return;initialized=true;const box=$('magias-escolhas');if(!box)return;box.addEventListener('change',onChange,true);box.addEventListener('input',onInput,true);document.addEventListener('hub:spell-selection-changed',schedule);$('classe')?.addEventListener('change',()=>{search='';schedule()});$('nivel')?.addEventListener('change',schedule);$('new-character')?.addEventListener('click',()=>{search='';schedule()});schedule()}
