import{state,$,SKILL_AB,esc,signed}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js?v=20260831-tasha-metamagic1';

function renderSkillChecks(){
 if(!state.c)return;
 const box=$('skills');
 if(!box)return;
 const d=derive(),checks=d.skillChecks||{};
 box.innerHTML=Object.entries(SKILL_AB).map(([skill,ability])=>{
  const check=checks[skill];
  if(!check)return`<div class="row"><span>${esc(skill)} <small>${esc(ability)}</small></span><strong>—</strong></div>`;
  const marker=check.expertise?'● ★ ':check.proficient?'● ':check.jackOfAllTrades?'◐ ':'';
  const title=check.expertise?'Especialização':check.proficient?'Proficiência':check.jackOfAllTrades?'Pau para Toda Obra':'';
  return`<div class="row"><span title="${esc(title)}">${marker}${esc(skill)} <small>${esc(ability)}</small></span><strong>${signed(check.value)}</strong></div>`
 }).join('')
}

document.addEventListener('hub-rpg:sheet-ready',renderSkillChecks);
document.addEventListener('hub-rpg:sheet-spells-ready',renderSkillChecks);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(renderSkillChecks));
else queueMicrotask(renderSkillChecks);
