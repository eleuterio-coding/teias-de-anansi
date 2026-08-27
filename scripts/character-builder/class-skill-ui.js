import{state,$,arr,SKILL_AB,esc}from'./state.js';
import{selected,derive}from'./rules.js';
import{initExpertiseCompanionUi}from'./expertise-companion-ui.js?v=20260827-expertise-companions1';
import{initSubclassMechanicsData}from'./subclass-mechanics-data.js?v=20260827-subclass-mechanics2';
import{initBarbarianSubclassUi}from'./barbarian-subclass-ui.js?v=20260827-barbarian-subclasses1';
import{initArtificerSubclassUi}from'./artificer-subclass-ui.js?v=20260827-artificer-subclasses1';
import{initBardSubclassUi}from'./bard-subclass-ui.js?v=20260827-bard-subclasses1';
import{initDruidSubclassUi}from'./druid-subclass-ui.js?v=20260827-druid-subclasses1';
import{initFighterSubclassUi}from'./fighter-subclass-ui.js?v=20260827-fighter-subclasses1';

const ALL_SKILLS=Object.keys(SKILL_AB);
function normalizeSkillChoices(klass){
 if(!klass)return;
 const groups=arr(klass.skillChoices).map(group=>({
  ...group,
  options:[...new Set(arr(group.options).filter(option=>ALL_SKILLS.includes(option)))]
 })).filter(group=>group.options.length);
 if(klass.slug==='bard'){
  const options=[...new Set(groups.flatMap(group=>group.options))];
  klass.skillChoices=[{choose:3,options:options.length===ALL_SKILLS.length?options:[...ALL_SKILLS]}];
  return
 }
 klass.skillChoices=groups
}
function config(){
 const{klass}=selected();normalizeSkillChoices(klass);
 const allowed=[...new Set(arr(klass?.skillChoices).flatMap(x=>arr(x.options)))],total=arr(klass?.skillChoices).reduce((n,x)=>n+Number(x.choose||0),0);
 return{klass,allowed,total}
}
function skillProficienciesOutsideClass(){
 const choices=state.c?.choices?.class;if(!choices)return new Set();
 const saved=arr(choices.skills);choices.skills=[];
 try{return new Set(arr(derive().skills).filter(skill=>ALL_SKILLS.includes(skill)))}
 finally{choices.skills=saved}
}
function ensureSkillMarkup(box,allowed,total){
 const inputs=[...box.querySelectorAll('input.class-skill')],currentValues=inputs.map(input=>input.value);
 const correct=inputs.length===allowed.length&&allowed.every(value=>currentValues.includes(value));
 if(correct)return;
 const chosen=arr(state.c.choices.class.skills);
 box.innerHTML=allowed.length?`<fieldset data-class-skill-fieldset><legend>Perícias da classe — escolha ${Math.max(0,total-chosen.length)}</legend><div class="check-grid">${allowed.map(x=>`<label class="check"><input class="class-skill" type="checkbox" value="${esc(x)}" ${chosen.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div></fieldset>`:''
}
function decorate(){
 const box=$('classe-escolhas'),{klass,allowed,total}=config();if(!box||!klass)return;
 const blocked=skillProficienciesOutsideClass();
 state.c.choices.class.skills=arr(state.c.choices.class.skills).filter(x=>allowed.includes(x)&&!blocked.has(x)).slice(0,total);
 ensureSkillMarkup(box,allowed,total);
 const chosen=state.c.choices.class.skills.length,remaining=Math.max(0,total-chosen),legend=box.querySelector('fieldset>legend'),label=`Perícias da classe — escolha ${remaining}`;
 if(legend&&legend.textContent!==label)legend.textContent=label;
 for(const input of box.querySelectorAll('input.class-skill')){
  const alreadyProficient=blocked.has(input.value),checked=state.c.choices.class.skills.includes(input.value),disabled=alreadyProficient||(!checked&&remaining===0),row=input.closest('label');
  input.checked=checked;if(input.disabled!==disabled)input.disabled=disabled;
  input.dataset.proficiencyLocked=alreadyProficient?'1':'0';
  if(row){row.style.opacity=alreadyProficient?'0.45':'';row.style.cursor=alreadyProficient?'not-allowed':'';row.title=alreadyProficient?'Proficiência já concedida por outra fonte. Escolha outra perícia da classe.':'';row.setAttribute('aria-disabled',alreadyProficient?'true':'false')}
 }
}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function onChange(e){
 const input=e.target.closest('input.class-skill'),box=$('classe-escolhas');if(!input||!box?.contains(input))return;
 e.stopImmediatePropagation();const{allowed,total}=config(),blocked=skillProficienciesOutsideClass(),current=arr(state.c.choices.class.skills).filter(x=>allowed.includes(x)&&!blocked.has(x));
 if(blocked.has(input.value)){input.checked=false;decorate();return}
 if(input.checked){if(current.length>=total){input.checked=false;return}state.c.choices.class.skills=[...new Set([...current,input.value])].slice(0,total)}else state.c.choices.class.skills=current.filter(x=>x!==input.value);
 decorate();refreshSheet();document.dispatchEvent(new CustomEvent('hub:class-skills-changed'))
}
export function initClassSkillUi(){
 const box=$('classe-escolhas');if(!box)return;
 decorate();box.addEventListener('change',onChange,true);
 new MutationObserver(()=>queueMicrotask(decorate)).observe(box,{childList:true,subtree:true});
 $('classe')?.addEventListener('change',()=>queueMicrotask(decorate));$('nivel')?.addEventListener('change',()=>queueMicrotask(decorate));$('new-character')?.addEventListener('click',()=>queueMicrotask(decorate));
 document.addEventListener('change',e=>{if(!box.contains(e.target))queueMicrotask(decorate)});
 initSubclassMechanicsData().then(()=>{initBarbarianSubclassUi();initArtificerSubclassUi();initBardSubclassUi();initDruidSubclassUi();initFighterSubclassUi()});
 initExpertiseCompanionUi()
}
