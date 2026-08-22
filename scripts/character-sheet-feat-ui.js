import{state,$,AB,SKILL_AB,arr,esc,mod,signed,fold}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js';

function pill(v){return`<span class="pill">${esc(v)}</span>`}
function uniqText(values){const out=[],seen=new Set;for(const value of values.filter(Boolean)){const key=fold(value);if(!seen.has(key)){seen.add(key);out.push(value)}}return out}
function renderSaves(d){const box=$('saves');if(!box)return;box.innerHTML=AB.map(a=>{const trained=arr(d.saveProficiencies).includes(a),value=mod(d.scores[a])+(trained?d.pbonus:0);return`<div class="row"><span>${trained?'● ':''}${esc(a)}</span><strong>${signed(value)}</strong></div>`}).join('')}
function renderSkills(d){const box=$('skills');if(!box)return;box.innerHTML=Object.entries(SKILL_AB).map(([skill,ability])=>{const trained=d.skills.includes(skill),expert=arr(d.expertiseSkills).includes(skill),value=mod(d.scores[ability])+(trained?d.pbonus:0)+(expert?d.pbonus:0);return`<div class="row"><span>${trained?'● ':''}${expert?'★ ':''}${esc(skill)} <small>${esc(ability)}</small></span><strong>${signed(value)}</strong></div>`}).join('')}
function renderProficiencies(d){
 const extras=[...arr(d.extraProficiencies),...arr(d.featMechanics?.armorTraining).map(x=>`Armadura ${x}`),...(d.featMechanics?.shieldTraining?['Escudos']:[]),...arr(d.featMechanics?.weaponTraining).map(x=>`Armas ${x}s`)];
 const profs=uniqText([...arr(d.klass?.proficiencies),...extras]);
 if($('proficiencies'))$('proficiencies').innerHTML=profs.length?profs.map(pill).join(''):'—';
 if($('tools'))$('tools').innerHTML=d.tools.length?d.tools.map(pill).join(''):'—';
 if($('skill-profs'))$('skill-profs').innerHTML=d.skills.length?d.skills.map(s=>pill(arr(d.expertiseSkills).includes(s)?`${s} · Especialização`:s)).join(''):'—';
 if($('save-profs'))$('save-profs').innerHTML=arr(d.saveProficiencies).length?d.saveProficiencies.map(pill).join(''):'—'
}
function renderFeatCards(d){
 const box=$('feat-data');if(!box)return;const instances=arr(d.featMechanics?.instances),labels=d.featMechanics?.labels||{};
 if(!instances.length){box.innerHTML='<p class="muted">Nenhum talento registrado.</p>';return}
 box.innerHTML=instances.map(inst=>{const choices=arr(labels[inst.key]),extra=choices.length?`<p><strong>Escolhas:</strong> ${esc(choices.join(' · '))}</p>`:'';return`<details class="feature"><summary>${esc(inst.feat.name)} <span class="source">${esc(inst.source)}</span></summary><p>${esc(inst.feat.description||'')}</p>${extra}</details>`}).join('')
}
function spellCard(spell){return`<article class="spell"><div><strong>${esc(spell.name)}</strong></div><small>${spell.level===0?'Truque':`${spell.level}º círculo`}${spell.school?` · ${esc(spell.school)}`:''}${spell.concentration?' · Concentração':''}${spell.ritual?' · Ritual':''}</small>${spell.description?`<p>${esc(spell.description)}</p>`:''}</article>`}
function renderFeatSpells(d){
 const section=$('spell-section');if(!section)return;section.querySelector('[data-feat-spells-sheet]')?.remove();const groups=arr(d.featSpellcasting);if(!groups.length)return;
 const wrap=document.createElement('div');wrap.dataset.featSpellsSheet='';wrap.style.marginTop='18px';wrap.innerHTML=`<h3>Magias de talentos</h3>${groups.map(group=>`<div class="feature"><strong>${esc(group.featName)}</strong>${group.ability?` <span class="source">${esc(group.ability)}</span>`:''}<div class="spell-list" style="margin-top:8px">${group.spells.map(spellCard).join('')}</div></div>`).join('')}`;section.appendChild(wrap)
}
function renderResources(d){
 const combat=$('combat-summary');if(!combat)return;combat.querySelector('[data-feat-resources-sheet]')?.remove();const resources=arr(d.featResources);if(!resources.length&&!d.unarmedDamage)return;
 const wrap=document.createElement('div');wrap.dataset.featResourcesSheet='';wrap.style.marginTop='10px';wrap.innerHTML=`${resources.map(r=>`<div class="row"><span>${esc(r.label)}</span><strong>${esc(r.max)}</strong></div>`).join('')}${d.unarmedDamage?`<div class="row"><span>Ataque Desarmado</span><strong>${esc(d.unarmedDamage)}</strong></div>`:''}`;combat.appendChild(wrap)
}
function apply(){if(!state.c)return;const d=derive();renderSaves(d);renderSkills(d);renderProficiencies(d);renderFeatCards(d);renderFeatSpells(d);renderResources(d)}
function start(attempt=0){const sheet=$('sheet');if(state.c&&sheet&&!sheet.hidden){apply();return}if(attempt<300)requestAnimationFrame(()=>start(attempt+1))}
start();
