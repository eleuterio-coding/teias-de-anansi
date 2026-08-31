import{state,$,AB,SKILL_AB,arr,num,esc,fold,mod,signed,pb}from'./state.js';
import{derive,speciesTraitChoiceDefs}from'./rules.js?v=20260831-tasha-metamagic1';
import{ALL_SKILLS,activeFeatInstances,featRule,featChoiceDefs,sanitizeFeatChoices,featEligibleSpells,featMissingChoices}from'./feat-mechanics.js?v=20260831-tasha-metamagic1';

let applying=false,scheduled=false;
const store=()=>state.c.choices.featMechanics||(state.c.choices.featMechanics={});
const optionHtml=(value,label,current,disabled=false)=>`<option value="${esc(value)}" ${value===current?'selected':''} ${disabled?'disabled':''}>${esc(label)}</option>`;
const selectHtml=(options,current,placeholder='Selecione',disabledValues=new Set)=>`<option value="">${esc(placeholder)}</option>${options.map(v=>optionHtml(v,v,current,disabledValues.has(v)&&v!==current)).join('')}`;
const spellName=s=>s?.name||s?.originalName||'Magia';
const featData=key=>store()[key]||(store()[key]={});

function usedAcross(def){
 if(!def.uniqueAcrossFeat)return new Set;
 const used=new Set;
 for(const inst of activeFeatInstances()){
  if(inst.key===def.instanceKey||inst.feat.name!==def.featName)continue;
  const v=store()[inst.key]?.[def.id];if(v)used.add(v)
 }
 return used
}

function countLabel(def,value){
 const need=def.countFormula==='pb'?pb(state.c.choices.class.level):num(def.count),chosen=arr(value).filter(v=>v&&(typeof v!=='object'||v.value)).length;
 return need?` <span class="mini">· faltam ${Math.max(0,need-chosen)}</span>`:''
}

function renderAsi(def,data){
 const v=data[def.id]||{mode:'2',a1:'',a2:''},mode=v.mode==='1+1'?'1+1':'2';
 return`<div class="trait-choice"><strong>${esc(def.label)}</strong><div class="choice-grid"><label>Distribuição<select data-feat-asi="mode" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}"><option value="2" ${mode==='2'?'selected':''}>+2 em um atributo</option><option value="1+1" ${mode==='1+1'?'selected':''}>+1 em dois atributos</option></select></label><label>${mode==='2'?'Atributo +2':'Primeiro +1'}<select data-feat-asi="a1" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}">${selectHtml(AB,v.a1)}</select></label>${mode==='1+1'?`<label>Segundo +1<select data-feat-asi="a2" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}">${selectHtml(AB.filter(a=>a!==v.a1),v.a2)}</select></label>`:''}</div></div>`
}

function renderTools(def,data){
 const need=def.countFormula==='pb'?pb(state.c.choices.class.level):num(def.count),vals=arr(data[def.id]);
 return`<div class="trait-choice"><strong>${esc(def.label)}</strong>${countLabel(def,vals)}<div class="choice-grid">${Array.from({length:need},(_,i)=>`<label>Escolha ${i+1}<input data-feat-list="tool" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}" data-index="${i}" value="${esc(vals[i]||'')}" placeholder="Nome da ferramenta"></label>`).join('')}</div></div>`
}

function renderSkillTool(def,data){
 const need=num(def.count),vals=arr(data[def.id]);
 return`<div class="trait-choice"><strong>${esc(def.label)}</strong>${countLabel(def,vals)}${Array.from({length:need},(_,i)=>{const row=vals[i]||{},type=row.type||'',value=row.value||'';return`<div class="choice-grid"><label>Escolha ${i+1}<select data-feat-mixed="type" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}" data-index="${i}"><option value="">Selecione</option><option value="skill" ${type==='skill'?'selected':''}>Perícia</option><option value="tool" ${type==='tool'?'selected':''}>Ferramenta</option></select></label>${type==='skill'?`<label>Perícia<select data-feat-mixed="value" data-mixed-kind="skill" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}" data-index="${i}">${selectHtml(ALL_SKILLS.filter(s=>!vals.some((r,j)=>j!==i&&r?.type==='skill'&&r.value===s)),value)}</select></label>`:type==='tool'?`<label>Ferramenta<input data-feat-mixed="value" data-mixed-kind="tool" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}" data-index="${i}" value="${esc(value)}" placeholder="Nome da ferramenta"></label>`:''}</div>`}).join('')}</div>`
}

function renderSpells(def,data){
 const need=def.countFormula==='pb'?pb(state.c.choices.class.level):num(def.count||1),many=def.type==='spells'||def.type==='ritual_spells',vals=many?arr(data[def.id]):[data[def.id]].filter(Boolean),eligible=featEligibleSpells(def,def.instanceKey).slice().sort((a,b)=>spellName(a).localeCompare(spellName(b),'pt-BR'));
 if(many)return`<div class="trait-choice"><strong>${esc(def.label)}</strong>${countLabel(def,vals)}<div class="field-grid one">${Array.from({length:need},(_,i)=>{const cur=vals[i]||'',taken=new Set(vals.filter((_,j)=>j!==i));return`<label>${def.level===0?'Truque':def.type==='ritual_spells'?'Ritual':`Magia ${i+1}`}<select data-feat-list="spell" data-instance="${esc(def.instanceKey)}" data-field="${esc(def.id)}" data-index="${i}"><option value="">Selecione</option>${eligible.map(s=>optionHtml(s.id,spellName(s),cur,taken.has(s.id))).join('')}</select></label>`}).join('')}</div></div>`;
 const cur=vals[0]||'';return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}"><option value="">Selecione</option>${eligible.map(s=>optionHtml(s.id,spellName(s),cur)).join('')}</select></label>`
}

function renderDef(def){
 const data=featData(def.instanceKey),v=data[def.id];
 if(def.type==='asi')return renderAsi(def,data);
 if(def.type==='tools')return renderTools(def,data);
 if(def.type==='skill_or_tool_multi')return renderSkillTool(def,data);
 if(['spells','ritual_spells','spell'].includes(def.type))return renderSpells(def,data);
 if(def.type==='skill'||def.type==='skill_upgrade'){
  const options=arr(def.options).length?arr(def.options):ALL_SKILLS;
  return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}">${selectHtml(options,v)}</select></label>`
 }
 if(def.type==='expertise'){
  const d=derive(),options=d.skills.filter(s=>!arr(d.expertiseSkills).includes(s)||s===v);
  return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}">${selectHtml(options,v,'Selecione uma perícia proficiente')}</select></label>`
 }
 if(def.type==='resilient')return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}">${selectHtml(AB,v)}</select></label>`;
 if(def.type==='weapon'){
  const options=state.catalogs.weapons.slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}"><option value="">Selecione</option>${options.map(w=>optionHtml(w.id,w.nome,v)).join('')}</select></label>`
 }
 if(def.type==='option'||def.type==='ability'||def.type==='spell_ability'){
  const used=usedAcross(def),preset=def.id==='spellList'&&def.presetChoice;
  if(preset)return`<div class="trait-choice"><strong>${esc(def.label)}</strong><p class="mini">${esc(v||def.presetChoice)} · definido pelo antecedente</p></div>`;
  return`<label class="trait-choice"><strong>${esc(def.label)}</strong><select data-feat-simple="${esc(def.id)}" data-instance="${esc(def.instanceKey)}">${selectHtml(arr(def.options),v,'Selecione',used)}</select></label>`
 }
 return''
}

function automaticSummary(inst){
 const rule=featRule(inst.feat)||{},out=[];
 if(rule.ability?.options.length===1)out.push(`+1 ${rule.ability.options[0]}`);
 if(rule.initiativePB)out.push('Bônus de Proficiência na Iniciativa');
 if(rule.hpPerLevel)out.push(`+${rule.hpPerLevel} PV por nível`);
 if(rule.speedBonus)out.push(`+${rule.speedBonus} ft de deslocamento`);
 if(rule.mediumDexCap>2)out.push(`armadura média usa até +${rule.mediumDexCap} de Destreza`);
 for(const a of arr(rule.armorTraining))out.push(`treinamento com armadura ${a.toLowerCase()}`);
 if(rule.shieldTraining)out.push('treinamento com escudos');
 for(const w of arr(rule.weaponTraining))out.push(`proficiência com armas ${w.toLowerCase()}s`);
 for(const t of arr(rule.fixedTools))out.push(`proficiência: ${t}`);
 for(const p of arr(rule.extraProficiencies))out.push(`proficiência: ${p}`);
 if(rule.unarmedDamage)out.push(`Ataque Desarmado: ${rule.unarmedDamage}`);
 for(const s of arr(rule.fixedSpells))out.push(`magia concedida: ${s}`);
 if(rule.resource)out.push(`${rule.resource.label}: ${rule.resource.formula==='pb'?pb(state.c.choices.class.level):rule.resource.max}`);
 return out
}

function render(){
 if(applying)return;applying=true;
 try{
  sanitizeFeatChoices();const box=$('talentos-escolhas');if(!box)return;
  box.querySelector('[data-feat-mechanics-controls]')?.remove();
  const instances=activeFeatInstances();if(!instances.length){decorateFeatSelectors();refreshPending();decoratePreview();return}
  const defs=featChoiceDefs(),wrap=document.createElement('fieldset');wrap.dataset.featMechanicsControls='';wrap.innerHTML=`<legend>Aplicação mecânica dos talentos</legend>${instances.map(inst=>{const mine=defs.filter(d=>d.instanceKey===inst.key),auto=automaticSummary(inst);return`<div class="feature" data-feat-instance-card="${esc(inst.key)}"><strong>${esc(inst.feat.name)}</strong> <span class="mini">· ${esc(inst.source)}</span><p class="mini">${esc(inst.feat.description||'')}</p>${auto.length?`<p class="mini"><strong>Aplicado automaticamente:</strong> ${auto.map(esc).join(' · ')}</p>`:''}${mine.map(renderDef).join('')}</div>`}).join('')}`;box.appendChild(wrap);
  decorateFeatSelectors();refreshPending();decoratePreview()
 }finally{applying=false}
}

function setSimple(instance,field,value){const d=featData(instance);d[field]=value||null}
function setList(instance,field,index,value){const d=featData(instance),list=arr(d[field]).slice();list[index]=value||null;d[field]=list}
function onChange(e){
 const t=e.target,instance=t.dataset.instance;if(!instance)return;
 if(t.dataset.featSimple)setSimple(instance,t.dataset.featSimple,t.value);
 else if(t.dataset.featAsi){const field=t.dataset.field,d=featData(instance),v={mode:'2',a1:'',a2:'',...(d[field]||{})};v[t.dataset.featAsi]=t.value;d[field]=v}
 else if(t.dataset.featList)setList(instance,t.dataset.field,num(t.dataset.index),t.value);
 else if(t.dataset.featMixed){const field=t.dataset.field,index=num(t.dataset.index),d=featData(instance),list=arr(d[field]).slice(),row={type:'',value:'',...(list[index]||{})};if(t.dataset.featMixed==='type'){row.type=t.value;row.value=''}else{row.type=t.dataset.mixedKind;row.value=t.value}list[index]=row;d[field]=list}
 else return;
 sanitizeFeatChoices();refreshSheet();schedule()
}

function decorateFeatSelectors(){
 const box=$('talentos-escolhas');if(!box)return;const instances=activeFeatInstances();
 for(const select of box.querySelectorAll('select.feat-select')){
  const current=select.value,taken=new Set(instances.filter(i=>i.key!==`class:${select.dataset.key}`).map(i=>fold(i.feat.name)));
  for(const opt of select.options){if(!opt.value)continue;const f=state.catalogs.feats.find(x=>x.id===opt.value);opt.disabled=!!f&&!f.repeatable&&taken.has(fold(f.name))&&opt.value!==current}
 }
}

function speciesMissing(){
 const vals=state.c.choices.species?.traitChoices||{},missing=[];
 for(const def of speciesTraitChoiceDefs()){
  const v=vals[def.key];let ok=false;
  if(def.type==='skill')ok=def.choose>1?arr(v).length===def.choose:!!v;
  else if(def.type==='skill_or_tool')ok=!!v?.type&&!!String(v?.value||'').trim();
  else ok=!!String(v||'').trim();
  if(!ok)missing.push(`Escolha ${def.label.toLowerCase()} para o traço ${def.traitName}.`)
 }
 return missing
}
function refreshPending(){
 const box=$('pending');if(!box)return;
 const current=[...box.querySelectorAll('li')].map(li=>li.textContent.trim()).filter(Boolean).filter(x=>!/ para o talento | para o traço /i.test(x)),all=[...new Set([...current,...speciesMissing(),...featMissingChoices()])];
 box.className=`status ${all.length?'warning':'ok'}`;box.innerHTML=all.length?`<strong>Escolhas pendentes</strong><ul>${all.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<strong>Ficha consistente.</strong> Todas as escolhas obrigatórias desta etapa foram preenchidas.'
}
function row(label,value){return`<div class="value-row"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong></div>`}
function uniqText(xs){const out=[],seen=new Set;for(const x of xs.filter(Boolean)){const k=fold(x);if(!seen.has(k)){seen.add(k);out.push(x)}}return out}
function decoratePreview(){
 const d=derive();
 for(const a of AB){const bonus=num(d.scores[a])-num(state.c.baseAbilities[a]),id=fold(a).replace(/[^a-z0-9]+/g,'-'),el=$(`base-bonus-${id}`);if(el)el.textContent=bonus?signed(bonus):''}
 const cards=$('ability-cards')?.querySelectorAll('.ability')||[];AB.forEach((a,i)=>{const small=cards[i]?.querySelector('small'),bonus=num(d.scores[a])-num(state.c.baseAbilities[a]);if(small)small.textContent=`base ${state.c.baseAbilities[a]}${bonus?` · ${signed(bonus)}`:''}`});
 const saves=$('save-values');if(saves)saves.innerHTML=AB.map(a=>{const trained=arr(d.saveProficiencies).includes(a),value=mod(d.scores[a])+(trained?d.pbonus:0);return`<div class="value-row"><span>${esc(a)}${trained?' ●':''}</span><strong>${signed(value)}</strong></div>`}).join('');
 const skills=$('skill-values');if(skills)skills.innerHTML=Object.entries(SKILL_AB).map(([s,a])=>{const trained=d.skills.includes(s),expert=arr(d.expertiseSkills).includes(s),value=mod(d.scores[a])+(trained?d.pbonus:0)+(expert?d.pbonus:0);return`<div class="value-row"><span>${esc(s)}${trained?' ●':''}${expert?' ★':''}</span><strong>${signed(value)}</strong></div>`}).join('');
 const prof=$('creation-proficiencies');if(prof){const p=state.c.sheet?.profile||{},extras=[...arr(d.extraProficiencies),...arr(d.featMechanics?.armorTraining).map(x=>`Armadura ${x}`),...(d.featMechanics?.shieldTraining?['Escudos']:[]),...arr(d.featMechanics?.weaponTraining).map(x=>`Armas ${x}s`)];prof.innerHTML=row('Armas, armaduras e outras',uniqText([...arr(d.klass?.proficiencies),...extras]).join(', '))+row('Salvaguardas',arr(d.saveProficiencies).join(', '))+row('Perícias treinadas',d.skills.map(s=>arr(d.expertiseSkills).includes(s)?`${s} (Especialização)`:s).join(', '))+row('Ferramentas',d.tools.join(', '))+row('Idiomas',p.languages)}
 renderFeatSpells(d)
}
function renderFeatSpells(d){
 const box=$('spellcasting');if(!box)return;box.querySelector('[data-feat-spells-preview]')?.remove();const groups=arr(d.featSpellcasting);if(!groups.length)return;
 const el=document.createElement('div');el.dataset.featSpellsPreview='';el.className='preview-block';el.innerHTML=`<strong>Magias de talentos</strong>${groups.map(g=>`<p><strong>${esc(g.featName)}</strong>${g.ability?` · ${esc(g.ability)}`:''}: ${g.spells.map(s=>`<span class="pill">${esc(s.name)}</span>`).join(' ')}</p>`).join('')}`;box.appendChild(el)
}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}

function bind(){
 const box=$('talentos-escolhas');box?.addEventListener('change',onChange);
 if(box)new MutationObserver(()=>{if(!applying&&!box.querySelector('[data-feat-mechanics-controls]'))schedule()}).observe(box,{childList:true,subtree:true});
 $('builder')?.addEventListener('change',e=>{if(e.target.closest('.feat-select,#classe,#nivel,#especie,#antecedente,#subclasse,#sp-size,#sp-line,[data-species-choice],[data-species-multi],[data-species-mixed-type],[data-species-mixed-value],[id^="base-"]'))queueMicrotask(schedule)});
 document.addEventListener('hub:class-skills-changed',schedule);document.addEventListener('hub:spell-selection-changed',()=>queueMicrotask(decoratePreview));
 $('new-character')?.addEventListener('click',()=>queueMicrotask(schedule))
}

export function initFeatUi(){sanitizeFeatChoices();render();bind()}
