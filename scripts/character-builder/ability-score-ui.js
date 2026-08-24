import{state,$,AB,slug}from'./state.js';
import{BASE_ABILITY_POINT_BUDGET,BASE_ABILITY_MIN,BASE_ABILITY_MAX,normalizeBaseAbilities,baseAbilityValidation,applyBaseAbilityChange}from'./ability-score-rules.js?v=20260824-ability-budget1';

let syncingPending=false;

function abilityForInput(input){return AB.find(ability=>input?.id===`base-${slug(ability)}`)||null}
function normalizedState(){state.c.baseAbilities=normalizeBaseAbilities(state.c.baseAbilities,AB);return state.c.baseAbilities}
function budgetState(){return baseAbilityValidation(state.c.baseAbilities,AB)}

function ensureBudgetUi(){
 const grid=document.querySelector('[data-wizard-panel="atributos"] .base-grid');if(!grid)return null;
 let box=$('ability-budget');
 if(!box){
  box=document.createElement('div');box.id='ability-budget';box.className='ability-budget';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
  box.innerHTML=`<div><span>Orçamento</span><strong>${BASE_ABILITY_POINT_BUDGET} pontos</strong></div><div><span>Distribuídos</span><strong id="ability-points-used">60</strong></div><div><span>Restantes</span><strong id="ability-points-remaining">12</strong></div><p id="ability-budget-message" class="mini">Cada atributo base deve ficar entre ${BASE_ABILITY_MIN} e ${BASE_ABILITY_MAX}.</p>`;
  grid.before(box)
 }
 for(const ability of AB){const input=$(`base-${slug(ability)}`);if(!input)continue;input.min=String(BASE_ABILITY_MIN);input.max=String(BASE_ABILITY_MAX);input.step='1'}
 return box
}

function renderBudget(){
 const box=ensureBudgetUi();if(!box||!state.c)return;const v=budgetState(),remaining=v.remaining;
 $('ability-points-used').textContent=String(v.total);$('ability-points-remaining').textContent=String(Math.max(0,remaining));
 const msg=$('ability-budget-message');box.classList.toggle('is-complete',remaining===0&&v.rangeValid);box.classList.toggle('is-warning',remaining<0||!v.rangeValid);
 if(!v.rangeValid)msg.textContent=`Cada atributo base deve ser um número inteiro entre ${BASE_ABILITY_MIN} e ${BASE_ABILITY_MAX}.`;
 else if(remaining<0)msg.textContent=`Limite excedido em ${Math.abs(remaining)} ponto(s). Reduza a distribuição até ${BASE_ABILITY_POINT_BUDGET}.`;
 else if(remaining===0)msg.textContent='Todos os 72 pontos foram distribuídos.';
 else msg.textContent=`Ainda podem ser gastos ${remaining} ponto(s). Cada atributo base deve ficar entre ${BASE_ABILITY_MIN} e ${BASE_ABILITY_MAX}.`
}

function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function abilityPending(){const v=budgetState();if(!v.rangeValid)return[`Atributos: cada valor-base deve ficar entre ${BASE_ABILITY_MIN} e ${BASE_ABILITY_MAX}.`];if(v.remaining>0)return[`Atributos: distribua os ${v.remaining} ponto(s) restantes do total de ${BASE_ABILITY_POINT_BUDGET}.`];if(v.remaining<0)return[`Atributos: reduza ${Math.abs(v.remaining)} ponto(s) para respeitar o total de ${BASE_ABILITY_POINT_BUDGET}.`];return[]}
function syncPending(){
 if(syncingPending)return;const box=$('pending');if(!box)return;syncingPending=true;
 try{
  for(const li of box.querySelectorAll('li'))if(/^Atributos:/i.test(li.textContent.trim()))li.remove();
  const msgs=abilityPending();if(!msgs.length)return;
  box.className='status warning';let ul=box.querySelector('ul');if(!ul){box.innerHTML='<strong>Escolhas pendentes</strong><ul></ul>';ul=box.querySelector('ul')}
  for(const text of msgs){const li=document.createElement('li');li.textContent=text;ul.appendChild(li)}
 }finally{syncingPending=false}
}
function afterRender(){queueMicrotask(()=>{renderBudget();syncPending()})}

function onAbilityChange(e){
 const ability=abilityForInput(e.target);if(!ability)return;
 e.preventDefault();e.stopImmediatePropagation();
 const result=applyBaseAbilityChange(state.c.baseAbilities,AB,ability,e.target.value);state.c.baseAbilities=result.scores;e.target.value=String(result.value);
 renderBudget();refreshSheet();document.dispatchEvent(new CustomEvent('hub:abilities-context-changed',{detail:{ability,value:result.value,remaining:result.remaining}}));afterRender()
}

function resetFromState(){if(!state.c)return;normalizedState();for(const ability of AB){const input=$(`base-${slug(ability)}`);if(input)input.value=String(state.c.baseAbilities[ability])}renderBudget();refreshSheet();afterRender()}

function bind(){
 $('builder')?.addEventListener('change',onAbilityChange,true);
 for(const event of['hub:class-context-changed','hub:origin-context-changed','hub:species-context-changed','hub:species-choices-changed','hub:progression-context-changed','hub:spell-selection-changed'])document.addEventListener(event,afterRender);
 $('nome')?.addEventListener('input',()=>queueMicrotask(syncPending));
 $('new-character')?.addEventListener('click',()=>queueMicrotask(resetFromState))
}

export function initAbilityScoreUi(){resetFromState();bind()}
