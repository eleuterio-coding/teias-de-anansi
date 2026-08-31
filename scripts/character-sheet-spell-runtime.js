import{state,$,arr,num,esc,fold,read,write,uid}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js?v=20260831-tasha-metamagic1';
import{casterProfile,normalizedSlotPools,pactPool,eligibleSlotPools,firstAvailableSlotLevel,adjustSlotUse,remainingLabel,activeClassSpellIds,freeLongRestFeat}from'./character-sheet-spell-runtime-rules.js?v=20260825-spell-runtime1';

let initialized=false,rendering=false,queued=false;

function ensureRuntime(){
 state.c.sheet=state.c.sheet||{};
 const rt=state.c.sheet.runtime||(state.c.sheet.runtime={});
 rt.spellSlotsUsed={...(rt.spellSlotsUsed||{})};
 rt.spellCastLog=arr(rt.spellCastLog).filter(x=>x&&x.id&&x.spellId&&x.slotLevel);
 rt.arcanumUsed={...(rt.arcanumUsed||{})};
 rt.freeSpellUses={...(rt.freeSpellUses||{})};
 return rt
}
function persist(message='Acompanhamento de magias atualizado.'){
 const list=read(),i=list.findIndex(x=>x.id===state.c.id);state.c.updatedAt=new Date().toISOString();if(i>=0)list[i]=state.c;else list.push(state.c);write(list);
 const status=$('save-status');if(status)status.textContent=`${message} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}
function ensureStyles(){
 if($('spell-runtime-style'))return;const style=document.createElement('style');style.id='spell-runtime-style';style.textContent=`
 .spell-runtime-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:14px 0 8px}.spell-runtime-head h4{margin:0}.spell-runtime-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.spell-runtime-actions button{padding:7px 10px}.spell-runtime-card{display:grid;gap:8px}.spell-runtime-card .spell-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.spell-runtime-card .spell-title>div{min-width:0}.spell-use{border-top:1px solid #8883;padding-top:8px;margin-top:2px;display:grid;gap:7px}.spell-use-history,.spell-use-new{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.spell-use-history label,.spell-use-new label,.free-use{border:1px solid #8884;border-radius:999px;padding:5px 8px;background:#fff;font-weight:600;font-size:.8rem}.spell-use-history input,.spell-use-new input,.free-use input{width:auto;margin:0 5px 0 0}.spell-use-new select{width:auto;min-width:125px;margin:0;padding:5px 7px;font-size:.8rem}.spell-use .mini{margin:0}.spell-runtime-source{border-top:1px solid #8883;margin-top:14px;padding-top:12px}.spell-runtime-source:first-child{border-top:0}.spell-runtime-source>h4{margin-bottom:7px}.spell-runtime-note{border-left:3px solid #8888;padding-left:9px}.slot small{color:#666}.slot strong,.slot span{display:block}.slot .resource-kind{font-size:.74rem;text-transform:uppercase;letter-spacing:.04em;color:#666}.spell-runtime-empty{color:#666;font-size:.9rem}@media(max-width:760px){.spell-use-new select{width:100%}}
 `;document.head.appendChild(style)
}
const sourceBadge=v=>v?`<span class="source">${esc(v)}</span>`:'';
const spellMeta=s=>`${num(s.level)===0?'Truque':`${num(s.level)}º círculo`}${s.school?` · ${esc(s.school)}`:''}${s.concentration?' · Concentração':''}${s.ritual?' · Ritual':''}`;
const spellById=id=>arr(state.catalogs.spells).find(s=>s.id===id)||null;
function classSpellList(d){
 const prep=state.c.sheet?.spellPreparation,selectedIds=arr(d.selectedSpells?.leveled).map(s=>s.id),ids=activeClassSpellIds({slug:d.klass?.slug||'',selectedIds,preparedIds:arr(prep?.prepared),preparationClassMatches:prep?.classId===d.klass?.id});
 return ids.map(spellById).filter(Boolean)
}
function logsFor(spellId,sourceKey){return ensureRuntime().spellCastLog.filter(x=>x.spellId===spellId&&x.sourceKey===sourceKey)}
function remainingForLevel(d,level){const pool=normalizedSlotPools(d.spell?.slots,ensureRuntime().spellSlotsUsed).find(x=>x.level===num(level));return pool?.remaining||0}
function castControl(d,spell,sourceKey='class'){
 const level=num(spell.level);if(level===0)return'<p class="mini"><strong>À vontade.</strong> Não consome espaço de magia.</p>';
 const rt=ensureRuntime(),logs=logsFor(spell.id,sourceKey),pools=eligibleSlotPools(level,d.spell?.slots,rt.spellSlotsUsed,d.klass?.slug||''),available=pools.filter(x=>x.remaining>0),isPact=d.klass?.slug==='warlock';
 const history=logs.length?`<div class="spell-use-history"><span class="mini">Conjurações registradas:</span>${logs.map(log=>`<label><input type="checkbox" data-remove-cast="${esc(log.id)}" checked>${isPact?'Pact':`${num(log.slotLevel)}º`}</label>`).join('')}</div>`:'';
 if(!pools.length)return`${history}<p class="mini spell-runtime-note">Nenhum recurso de conjuração compatível está disponível para esta magia.</p>`;
 if(!available.length)return`${history}<p class="mini"><strong>Sem ${isPact?'espaços de Pact Magic':'espaços compatíveis'} restantes.</strong></p>`;
 const defaultLevel=firstAvailableSlotLevel(level,d.spell?.slots,rt.spellSlotsUsed,d.klass?.slug||'');
 const selector=isPact?`<span class="mini">Espaço de Pact Magic de ${defaultLevel}º círculo</span>`:`<select data-cast-level aria-label="Círculo do espaço usado">${pools.map(p=>`<option value="${p.level}" ${p.level===defaultLevel?'selected':''} ${p.remaining<1?'disabled':''}>${p.level}º círculo · ${remainingLabel(p.remaining,p.count)}</option>`).join('')}</select>`;
 return`<div class="spell-use">${history}<div class="spell-use-new">${selector}<label><input type="checkbox" data-new-cast data-spell-id="${esc(spell.id)}" data-source-key="${esc(sourceKey)}" data-slot-level="${defaultLevel||''}">Conjurar</label></div><p class="mini">Marcar “Conjurar” consome 1 ${isPact?'espaço de Pact Magic':'espaço'}; desmarcar uma conjuração registrada devolve o recurso.</p></div>`
}
function spellCard(d,spell,sourceKey='class',badge=''){
 return`<article class="spell spell-runtime-card" data-runtime-spell="${esc(spell.id)}"><div class="spell-title"><div><strong>${esc(spell.name)}</strong> ${sourceBadge(badge||spell.source)}</div></div><small>${spellMeta(spell)}</small>${spell.description?`<p>${esc(spell.description)}</p>`:''}${castControl(d,spell,sourceKey)}</article>`
}
function renderCantrips(d){
 const box=$('cantrip-list');if(!box)return;const spells=arr(d.selectedSpells?.cantrips);box.innerHTML=spells.length?spells.map(s=>`<article class="spell spell-runtime-card"><div><strong>${esc(s.name)}</strong> ${sourceBadge(s.source)}</div><small>${spellMeta(s)}</small>${s.description?`<p>${esc(s.description)}</p>`:''}<p class="mini"><strong>À vontade.</strong> Truques não consomem espaços de magia.</p></article>`).join(''):'<p class="muted">Nenhum truque selecionado.</p>'
}
function renderClassSpells(d){
 const box=$('leveled-spells');if(!box)return;box.dataset.runtimeSpellTracker='true';const spells=classSpellList(d),levels=[...new Set(spells.map(s=>num(s.level)).filter(Boolean))].sort((a,b)=>a-b),profile=casterProfile(d.klass?.slug||''),col=box.parentElement,h=col?.querySelector(':scope > h3');if(h)h.textContent=profile.listLabel;
 box.innerHTML=levels.length?levels.map(level=>`<div class="spell-runtime-head"><h4>${level}º círculo</h4><span class="mini">${d.klass?.slug==='warlock'?'Usa Pact Magic':`${remainingForLevel(d,level)}/${normalizedSlotPools(d.spell?.slots,ensureRuntime().spellSlotsUsed).find(x=>x.level===level)?.count||0} espaços desse círculo restantes`}</span></div><div class="spell-list">${spells.filter(s=>num(s.level)===level).map(s=>spellCard(d,s,'class',d.klass?.name)).join('')}</div>`).join(''):'<p class="muted">Nenhuma magia de nível 1+ disponível para conjurar.</p>'
}
function renderResources(d){
 const box=$('spell-slots'),title=$('spell-resource-title'),actions=$('spell-rest-actions');if(!box)return;const rt=ensureRuntime(),profile=casterProfile(d.klass?.slug||'');if(title)title.textContent=profile.resourceLabel;
 if(d.klass?.slug==='warlock'){
  const pool=pactPool(d.spell?.slots,rt.spellSlotsUsed);box.innerHTML=pool?`<div class="slot"><span class="resource-kind">Pact Magic</span><strong>Espaços de ${pool.level}º círculo</strong><span>${remainingLabel(pool.remaining,pool.count)}</span><small>Recuperação: Descanso Curto ou Longo.</small></div>`:'<p class="muted">Sem espaços de Pact Magic neste nível.</p>';
  if(actions)actions.innerHTML=`<button type="button" class="secondary" data-spell-rest="short">Recuperar Pact Magic</button><button type="button" class="secondary" data-spell-rest="long">Descanso Longo · recuperar conjuração</button>`;return
 }
 const pools=normalizedSlotPools(d.spell?.slots,rt.spellSlotsUsed);box.innerHTML=pools.length?pools.map(pool=>`<div class="slot"><strong>${pool.level}º círculo</strong><span>${remainingLabel(pool.remaining,pool.count)}</span><small>Recuperação: Descanso Longo.</small></div>`).join(''):'<p class="muted">Sem espaços de magia.</p>';
 if(actions)actions.innerHTML=pools.length?'<button type="button" class="secondary" data-spell-rest="long">Descanso Longo · recuperar espaços</button>':''
}
function arcanumCard(spell,level){
 const rt=ensureRuntime(),used=!!rt.arcanumUsed[String(level)],remaining=used?0:1;return`<article class="spell spell-runtime-card"><div><strong>${esc(spell.name)}</strong> ${sourceBadge('Arcano Místico')}</div><small>${spellMeta(spell)}</small>${spell.description?`<p>${esc(spell.description)}</p>`:''}<div class="spell-use"><label class="free-use"><input type="checkbox" data-arcanum-use="${level}" ${used?'checked':''}>Conjuração do Arcano</label><p class="mini"><strong>${remaining}/1 restante.</strong> Não consome espaço de Pact Magic; recupera após Descanso Longo.</p></div></article>`
}
function featSourceLabel(d,instanceKey,featName){const inst=arr(d.featMechanics?.instances).find(x=>x.key===instanceKey);return[featName,inst?.source].filter(Boolean).join(' · ')}
function freeUseKey(group,spell){return`feat:${group.instanceKey}:${spell.id}`}
function featSpellCard(d,group,spell){
 const key=freeUseKey(group,spell),rt=ensureRuntime(),limited=num(spell.level)>0&&freeLongRestFeat(group.featName),used=!!rt.freeSpellUses[key],free=limited?`<div class="spell-use"><label class="free-use"><input type="checkbox" data-free-spell-use="${esc(key)}" ${used?'checked':''}>Conjuração gratuita</label><p class="mini"><strong>${used?'0/1':'1/1'} restante${used?'s':''}.</strong> Recupera após Descanso Longo.</p></div>`:num(spell.level)===0?'<p class="mini"><strong>À vontade.</strong> Não consome espaço.</p>':group.featName==='Ritual Caster'?'<p class="mini"><strong>Ritual.</strong> Quando conjurada como ritual, não consome espaço de magia.</p>':'<p class="mini spell-runtime-note">O consumo de recursos segue a descrição deste talento.</p>';
 const viaSlots=limited?castControl(d,spell,`feat:${group.instanceKey}`):'';
 return`<article class="spell spell-runtime-card"><div><strong>${esc(spell.name)}</strong> ${sourceBadge(featSourceLabel(d,group.instanceKey,group.featName))}</div><small>${spellMeta(spell)}</small>${spell.description?`<p>${esc(spell.description)}</p>`:''}${free}${viaSlots}</article>`
}
function speciesFreeMeta(d,spell){
 const defs=arr(d.speciesTraitChoices?.defs),values=d.speciesTraitChoices?.values||{},def=defs.find(x=>x.type==='spell'&&values[x.key]===spell.id),text=fold(def?.note||'');
 return{limited:/\buma vez\b|\bonce\b/.test(text)&&/descanso longo|long rest/.test(text),label:def?.traitName||d.species?.name||'Raça'}
}
function speciesSpellCard(d,spell){
 const meta=speciesFreeMeta(d,spell),key=`species:${d.species?.id||'species'}:${spell.id}`,used=!!ensureRuntime().freeSpellUses[key];let use;
 if(num(spell.level)===0)use='<p class="mini"><strong>À vontade.</strong> Não consome espaço.</p>';
 else if(meta.limited)use=`<div class="spell-use"><label class="free-use"><input type="checkbox" data-free-spell-use="${esc(key)}" ${used?'checked':''}>Uso racial</label><p class="mini"><strong>${used?'0/1':'1/1'} restante${used?'s':''}.</strong> Recupera após Descanso Longo.</p></div>`;
 else use='<p class="mini spell-runtime-note">Uso conforme o traço racial. A ficha não reduz espaços da classe automaticamente quando a fonte não define essa relação de forma estruturada.</p>';
 return`<article class="spell spell-runtime-card"><div><strong>${esc(spell.name)}</strong> ${sourceBadge(meta.label)}</div><small>${spellMeta(spell)}</small>${spell.description?`<p>${esc(spell.description)}</p>`:''}${use}</article>`
}
function renderOtherSources(d){
 const box=$('arcanum-spells');if(!box)return;const sections=[],arcanum=Object.entries(d.selectedSpells?.arcanum||{}).filter(([,s])=>s);
 if(arcanum.length)sections.push(`<section class="spell-runtime-source"><h4>Arcanos Místicos</h4><p class="mini">Cada Arcano Místico possui uso próprio e não consome os espaços de Pact Magic.</p><div class="spell-list">${arcanum.map(([level,spell])=>arcanumCard(spell,level)).join('')}</div></section>`);
 for(const group of arr(d.featSpellcasting)){const spells=arr(group.spells);if(!spells.length)continue;sections.push(`<section class="spell-runtime-source"><h4>${esc(featSourceLabel(d,group.instanceKey,group.featName))}</h4><div class="spell-list">${spells.map(spell=>featSpellCard(d,group,spell)).join('')}</div></section>`)}
 const species=arr(d.speciesSpells);if(species.length)sections.push(`<section class="spell-runtime-source"><h4>Magias da raça</h4><div class="spell-list">${species.map(spell=>speciesSpellCard(d,spell)).join('')}</div></section>`);
 box.innerHTML=sections.join('')
}
function sanitizeRuntime(d){
 const rt=ensureRuntime(),pools=normalizedSlotPools(d.spell?.slots,rt.spellSlotsUsed),levels=new Set(pools.map(x=>String(x.level)));for(const key of Object.keys(rt.spellSlotsUsed))if(!levels.has(String(key)))delete rt.spellSlotsUsed[key];
 const validSpellIds=new Set(arr(state.catalogs.spells).map(s=>s.id));rt.spellCastLog=rt.spellCastLog.filter(log=>validSpellIds.has(log.spellId)&&levels.has(String(log.slotLevel)));
 const validArcana=new Set(Object.keys(d.selectedSpells?.arcanum||{}));for(const key of Object.keys(rt.arcanumUsed))if(!validArcana.has(String(key)))delete rt.arcanumUsed[key]
}
function render(){
 if(rendering||!state.c||!state.catalogs.spells.length)return;const d=derive();if(!d.klass?.spellAbility)return;rendering=true;try{ensureStyles();sanitizeRuntime(d);renderResources(d);renderCantrips(d);renderClassSpells(d);renderOtherSources(d)}finally{rendering=false}
}
function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render()})}
function addCast(input){
 const d=derive(),rt=ensureRuntime(),spell=spellById(input.dataset.spellId);if(!spell)return;const wrap=input.closest('.spell-use-new'),select=wrap?.querySelector('select[data-cast-level]'),slotLevel=num(select?.value||input.dataset.slotLevel);if(!slotLevel)return;
 const pool=normalizedSlotPools(d.spell?.slots,rt.spellSlotsUsed).find(x=>x.level===slotLevel);if(!pool||pool.remaining<1)return;
 rt.spellSlotsUsed=adjustSlotUse(rt.spellSlotsUsed,d.spell?.slots,slotLevel,1);rt.spellCastLog.push({id:uid(),spellId:spell.id,sourceKey:input.dataset.sourceKey||'class',slotLevel});persist(`${spell.name}: recurso de conjuração consumido.`);render()
}
function removeCast(input){
 const d=derive(),rt=ensureRuntime(),i=rt.spellCastLog.findIndex(x=>x.id===input.dataset.removeCast);if(i<0)return;const[log]=rt.spellCastLog.splice(i,1);rt.spellSlotsUsed=adjustSlotUse(rt.spellSlotsUsed,d.spell?.slots,log.slotLevel,-1);persist('Conjuração desmarcada; recurso devolvido.');render()
}
function resetRest(kind){
 const d=derive(),rt=ensureRuntime(),slug=d.klass?.slug||'';
 if(kind==='short'&&slug!=='warlock')return;
 if(kind==='short'){
  rt.spellSlotsUsed={};rt.spellCastLog=rt.spellCastLog.filter(log=>log.resource&&log.resource!=='pact');persist('Pact Magic recuperada após Descanso Curto.');render();return
 }
 rt.spellSlotsUsed={};rt.spellCastLog=[];rt.arcanumUsed={};rt.freeSpellUses={};persist('Recursos de conjuração recuperados após Descanso Longo.');render()
}
function onChange(e){
 const t=e.target;if(t.matches('[data-new-cast]')){if(t.checked)addCast(t);return}if(t.matches('[data-remove-cast]')){if(!t.checked)removeCast(t);return}
 if(t.matches('[data-arcanum-use]')){ensureRuntime().arcanumUsed[String(t.dataset.arcanumUse)]=t.checked;persist('Arcano Místico atualizado.');render();return}
 if(t.matches('[data-free-spell-use]')){ensureRuntime().freeSpellUses[t.dataset.freeSpellUse]=t.checked;persist('Uso gratuito de magia atualizado.');render()}
}
function onClick(e){const b=e.target.closest('[data-spell-rest]');if(b){e.preventDefault();resetRest(b.dataset.spellRest)}}
function bind(){
 const section=$('spell-section');section?.addEventListener('change',onChange,true);section?.addEventListener('click',onClick,true);
 document.addEventListener('hub-rpg:sheet-spells-ready',queue);document.addEventListener('hub-rpg:sheet-preparation-changed',queue)
}
export function initCharacterSheetSpellRuntime(){if(initialized)return;initialized=true;bind();if(state.c&&state.catalogs.spells.length)queue()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCharacterSheetSpellRuntime,{once:true});else initCharacterSheetSpellRuntime();
