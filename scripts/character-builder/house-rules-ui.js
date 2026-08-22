import{state,$,AB,arr,num,esc,fold}from'./state.js';
import{applyHouseRules,derive,selected,HOUSE_ABILITY_LEVELS}from'./rules.js?v=20260822-house-progression1';

let rendering=false,raf=0;
const featById=id=>state.catalogs.feats.find(f=>f.id===id)||null;
const allCreationFeats=()=>state.catalogs.feats.filter(f=>['Origem','Geral'].includes(f.category));
const progression=()=>arr(selected().klass?._houseFeatProgression);
const activeProgression=()=>{const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));return progression().filter(e=>e.level<=level)};
const clone=v=>structuredClone(v);

function featIdsInside(value,out=new Set){
 if(typeof value==='string'){if(featById(value))out.add(value);return out}
 if(Array.isArray(value)){for(const v of value)featIdsInside(v,out);return out}
 if(value&&typeof value==='object')for(const v of Object.values(value))featIdsInside(v,out);
 return out
}
function speciesFeatIds(){return featIdsInside(state.c?.choices?.species?.traitChoices||{})}
function usedFeatIds(excludeSlot=null,excludeBackground=false){
 const used=speciesFeatIds();
 if(!excludeBackground){const id=state.c?.choices?.background?.originFeat;if(featById(id))used.add(id)}
 const activeSlots=new Set(activeProgression().map(e=>e.slot));for(const[key,id]of Object.entries(state.c?.choices?.feats||{}))if(key!==excludeSlot&&activeSlots.has(key)&&featById(id))used.add(id);
 return used
}
function deleteFeatMechanics(slot){if(state.c?.choices?.featMechanics)delete state.c.choices.featMechanics[`class:${slot}`]}

function contextAt(level,{excludeSlot=null,excludeAbility=null}={}){
 const saved=clone(state.c.choices);
 try{
  state.c.choices.class.level=level;
  state.c.choices.feats=state.c.choices.feats||{};
  if(excludeSlot)delete state.c.choices.feats[excludeSlot];
  state.c.choices.houseAbilities=state.c.choices.houseAbilities||{};
  if(excludeAbility!=null)delete state.c.choices.houseAbilities[String(excludeAbility)];
  applyHouseRules();return derive()
 }finally{state.c.choices=saved;applyHouseRules()}
}

function hasTraining(d,kind){
 const raw=fold([...arr(d.klass?.proficiencies),...arr(d.klass?.proficienciesRaw)].join(' ')),armor=arr(d.featMechanics?.armorTraining).map(fold),k=fold(kind);
 if(k==='escudo')return/shield|escudo/.test(raw)||!!d.featMechanics?.shieldTraining;
 const aliases={leve:['light armor','armadura leve'],media:['medium armor','armadura media'],pesada:['heavy armor','armadura pesada']},tokens=aliases[k]||[];
 return/all armor|todas as armaduras/.test(raw)||tokens.some(t=>raw.includes(t))||armor.includes(k==='media'?'media':k)
}
function prereqOk(feat,entry,d){
 const p=fold(feat?.prereq||'');if(!p||p==='nenhum')return true;
 const levelReq=p.match(/nivel\s*(\d+)\+/);if(levelReq&&entry.level<num(levelReq[1]))return false;
 if(/13\+/.test(p)){
  const abilities=AB.filter(a=>p.includes(fold(a)));if(abilities.length&&!abilities.some(a=>num(d.scores?.[a])>=13))return false
 }
 if((p.includes('conjuracao')||p.includes('magia de pacto'))&&!d.klass?.spellAbility)return false;
 if(p.includes('treinamento com armadura media')&&!hasTraining(d,'media'))return false;
 if(p.includes('treinamento com armadura pesada')&&!hasTraining(d,'pesada'))return false;
 if(p.includes('treinamento com armadura leve')&&!hasTraining(d,'leve'))return false;
 if(p.includes('treinamento com escudo')&&!hasTraining(d,'escudo'))return false;
 return true
}
function allowedForEntry(feat,entry,d){
 if(!feat||!['Origem','Geral'].includes(feat.category))return false;
 if(entry.kind==='house'&&fold(feat.name)==='ability score improvement')return false;
 return prereqOk(feat,entry,d)
}

function sanitizeOriginFeat(){
 const ch=state.c.choices.background||(state.c.choices.background={}),feat=featById(ch.originFeat);if(!feat||feat.category!=='Origem'){ch.originFeat=null;applyHouseRules();return}
 const species=speciesFeatIds();if(!feat.repeatable&&species.has(feat.id)){ch.originFeat=null;applyHouseRules()}
}
function sanitizeProgression(){
 const klass=selected().klass;if(!klass)return;
 const validAll=new Set(progression().map(e=>e.slot)),choices=state.c.choices.feats||(state.c.choices.feats={});
 for(const key of Object.keys(choices))if(key.startsWith('slot-')&&!validAll.has(key)){delete choices[key];deleteFeatMechanics(key)}
 const used=speciesFeatIds(),bgFeat=state.c.choices.background?.originFeat;if(featById(bgFeat))used.add(bgFeat);for(const entry of activeProgression()){
  const id=choices[entry.slot],feat=featById(id);if(!feat)continue;
  const context=contextAt(entry.level,{excludeSlot:entry.slot}),duplicate=!feat.repeatable&&used.has(id);
  if(!allowedForEntry(feat,entry,context)||duplicate){delete choices[entry.slot];deleteFeatMechanics(entry.slot);continue}
  used.add(id)
 }
}
function sanitizeAbilityProgression(){
 const level=Math.max(1,Math.min(20,num(state.c.choices.class?.level)||1)),choices=state.c.choices.houseAbilities||(state.c.choices.houseAbilities={});
 for(const milestone of HOUSE_ABILITY_LEVELS){
  const key=String(milestone);if(milestone>level)continue;const ability=choices[key];if(!ability)continue;
  const context=contextAt(milestone,{excludeAbility:milestone});if(!AB.includes(ability)||num(context.scores?.[ability])>=20)delete choices[key]
 }
}

function abilityOptions(current,context){return`<option value="">Escolha o atributo</option>${AB.map(a=>`<option value="${esc(a)}" ${a===current?'selected':''} ${num(context.scores?.[a])>=20&&a!==current?'disabled':''}>${esc(a)} · atual ${num(context.scores?.[a])}</option>`).join('')}`}
function featOptions(entry,current){
 const context=contextAt(entry.level,{excludeSlot:entry.slot}),used=usedFeatIds(entry.slot,false);
 return`<option value="">Escolha o talento</option>${allCreationFeats().map(feat=>{const duplicate=!feat.repeatable&&used.has(feat.id),allowed=allowedForEntry(feat,entry,context),disabled=(!allowed||duplicate)&&feat.id!==current;return`<option value="${esc(feat.id)}" ${feat.id===current?'selected':''} ${disabled?'disabled':''}>${esc(feat.name)} · ${esc(feat.category)}${feat.prereq&&fold(feat.prereq)!=='nenhum'?` · ${esc(feat.prereq)}`:''}</option>`}).join('')}`
}
function progressionFieldset(entries,title,note){
 if(!entries.length)return'';return`<fieldset><legend>${esc(title)}</legend><p class="section-note">${esc(note)}</p>${entries.map(entry=>{const current=state.c.choices.feats?.[entry.slot]||'';return`<label>Nível ${entry.level}<select class="feat-select house-feat-select" data-key="${esc(entry.slot)}" data-house-kind="${esc(entry.kind)}">${featOptions(entry,current)}</select></label>`}).join('')}</fieldset>`
}

function renderProgression(){
 const box=$('talentos-escolhas'),klass=selected().klass;if(!box)return;if(!klass){box.innerHTML='';return}
 const entries=activeProgression(),house=entries.filter(e=>e.kind==='house'),extra=entries.filter(e=>e.kind==='class-extra'),level=Math.max(1,Math.min(20,num(state.c.choices.class?.level)||1)),abilities=HOUSE_ABILITY_LEVELS.filter(l=>l<=level),abilityChoices=state.c.choices.houseAbilities||{};
 const attributeHtml=abilities.length?`<fieldset><legend>Aumentos de Atributo · Regra da Casa</legend><p class="section-note">Cada marco concede +1 em um único atributo. Esta progressão é separada dos talentos.</p>${abilities.map(l=>{const current=abilityChoices[String(l)]||'',context=contextAt(l,{excludeAbility:l});return`<label>Nível ${l} · +1<select class="house-ability-select" data-house-ability-level="${l}">${abilityOptions(current,context)}</select></label>`}).join('')}</fieldset>`:'';
 box.innerHTML=progressionFieldset(house,'Talentos · Progressão Universal','Talentos concedidos pela Regra da Casa. Os pré-requisitos normais continuam valendo; Melhoria de Atributo não ocupa estes marcos.')+progressionFieldset(extra,'Talentos adicionais da Classe','Apenas marcos adicionais próprios da classe são preservados; os marcos regulares substituídos não são duplicados.')+attributeHtml;
 box.querySelectorAll('.house-feat-select').forEach(select=>select.addEventListener('change',e=>{const slot=e.target.dataset.key;state.c.choices.feats[slot]=e.target.value||null;if(!e.target.value)deleteFeatMechanics(slot);refresh()}));
 box.querySelectorAll('.house-ability-select').forEach(select=>select.addEventListener('change',e=>{state.c.choices.houseAbilities=state.c.choices.houseAbilities||{};const key=e.target.dataset.houseAbilityLevel;if(e.target.value)state.c.choices.houseAbilities[key]=e.target.value;else delete state.c.choices.houseAbilities[key];refresh()}))
}

function renderBackground(){
 const box=$('antecedente-escolhas'),{bg}=selected();if(!box)return;if(!bg){box.innerHTML='';return}
 const ch=state.c.choices.background,originFeats=state.catalogs.feats.filter(f=>f.category==='Origem').sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),speciesUsed=speciesFeatIds(),abilityOpts=current=>AB.map(a=>`<option value="${esc(a)}" ${a===current?'selected':''}>${esc(a)}</option>`).join(''),originOpts=`<option value="">Escolha o Talento de Origem</option>${originFeats.map(f=>`<option value="${esc(f.id)}" ${f.id===ch.originFeat?'selected':''} ${!f.repeatable&&speciesUsed.has(f.id)&&f.id!==ch.originFeat?'disabled':''}>${esc(f.name)}</option>`).join('')}`;
 box.innerHTML=`<fieldset><legend>Antecedente · Regra da Casa</legend><p class="section-note">O antecedente concede +2 em um atributo, +1 em outro atributo diferente e um Talento de Origem livre.</p><div class="choice-grid"><label>+2<select id="bg-p2-house">${abilityOpts(ch.plus2)}</select></label><label>+1<select id="bg-p1-house">${abilityOpts(ch.plus1)}</select></label><label class="full">Talento de Origem<select id="bg-origin-feat">${originOpts}</select></label>${bg.toolChoice?`<label>${esc(bg.toolChoice)}<input id="bg-tool-house" value="${esc(ch.toolChoice||'')}"></label>`:''}${bg.equipmentOptions.length?`<label>Equipamento<select id="bg-eq-house">${bg.equipmentOptions.map(o=>`<option value="${esc(o.id)}" ${o.id===ch.equipment?'selected':''}>Pacote ${esc(o.id)}</option>`).join('')}</select></label>`:''}</div></fieldset>`;
 $('bg-p2-house')?.addEventListener('change',e=>{ch.plus2=e.target.value;if(ch.plus1===ch.plus2)ch.plus1=AB.find(a=>a!==ch.plus2)||null;refresh()});
 $('bg-p1-house')?.addEventListener('change',e=>{ch.plus1=e.target.value;if(ch.plus1===ch.plus2)ch.plus1=AB.find(a=>a!==ch.plus2)||null;refresh()});
 $('bg-origin-feat')?.addEventListener('change',e=>{ch.originFeat=e.target.value||null;refresh()});
 $('bg-tool-house')?.addEventListener('input',e=>{ch.toolChoice=e.target.value;refreshSheet()});
 $('bg-eq-house')?.addEventListener('change',e=>{ch.equipment=e.target.value;refreshSheet()})
}

function housePendingMessages(){
 const msgs=[],{bg,klass}=selected();if(bg&&!featById(state.c.choices.background?.originFeat))msgs.push('Regra da Casa: escolha o Talento de Origem do antecedente.');
 if(klass)for(const entry of activeProgression())if(!featById(state.c.choices.feats?.[entry.slot]))msgs.push(`Regra da Casa: escolha o talento do nível ${entry.level}${entry.kind==='class-extra'?' concedido adicionalmente pela classe':''}.`);
 const level=Math.max(1,Math.min(20,num(state.c.choices.class?.level)||1));for(const milestone of HOUSE_ABILITY_LEVELS)if(milestone<=level&&!AB.includes(state.c.choices.houseAbilities?.[String(milestone)]))msgs.push(`Regra da Casa: escolha o atributo que recebe +1 no nível ${milestone}.`);
 return msgs
}
function stripHousePending(){const box=$('pending');if(!box)return;for(const li of box.querySelectorAll('li'))if(/^Regra da Casa:/i.test(li.textContent.trim()))li.remove()}
function syncHousePending(){
 const box=$('pending');if(!box)return;stripHousePending();const msgs=housePendingMessages();if(!msgs.length)return;
 box.className='status warning';let ul=box.querySelector('ul');if(!ul){box.innerHTML='<strong>Escolhas pendentes</strong><ul></ul>';ul=box.querySelector('ul')}for(const msg of msgs){const li=document.createElement('li');li.textContent=msg;ul.appendChild(li)}
}
function sourceForCard(key){
 if(key==='background')return'Talento de Origem · Antecedente';if(!key?.startsWith('class:'))return null;const slot=key.slice(6),entry=progression().find(e=>e.slot===slot);if(!entry)return null;return entry.kind==='house'?`Regra da Casa · nível ${entry.level}`:`Classe · nível ${entry.level} · talento adicional`
}
function syncMechanicsSources(){const box=$('talentos-escolhas');if(!box)return;for(const card of box.querySelectorAll('[data-feat-instance-card]')){const source=sourceForCard(card.dataset.featInstanceCard),span=card.querySelector('strong + span.mini');if(source&&span&&span.textContent!==`· ${source}`)span.textContent=`· ${source}`}}
function scheduleDecorations(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{raf=0;syncMechanicsSources();syncHousePending()})}
function refreshSheet(){applyHouseRules();$('nome')?.dispatchEvent(new Event('input'));scheduleDecorations()}

function refresh(){
 if(rendering||!state.c)return;rendering=true;
 try{applyHouseRules();stripHousePending();sanitizeOriginFeat();sanitizeProgression();sanitizeAbilityProgression();applyHouseRules();renderBackground();renderProgression();refreshSheet()}finally{rendering=false}
}
function bind(){
 $('builder')?.addEventListener('change',e=>{if(e.target.matches('#classe,#nivel,#especie,#antecedente,#subclasse,[id^="base-"]'))queueMicrotask(refresh)});
 $('new-character')?.addEventListener('click',()=>queueMicrotask(refresh));
 const featBox=$('talentos-escolhas');if(featBox)new MutationObserver(()=>scheduleDecorations()).observe(featBox,{childList:true,subtree:true});
}
export function initHouseRulesUi(){refresh();bind()}
