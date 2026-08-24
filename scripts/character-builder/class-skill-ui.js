import{state,$,arr,SKILL_AB,esc}from'./state.js';
import{selected}from'./rules.js';

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
function ensureSkillMarkup(box,allowed,total){
 const inputs=[...box.querySelectorAll('input.class-skill')],currentValues=inputs.map(input=>input.value);
 const correct=inputs.length===allowed.length&&allowed.every(value=>currentValues.includes(value));
 if(correct)return;
 const chosen=arr(state.c.choices.class.skills);
 box.innerHTML=allowed.length?`<fieldset data-class-skill-fieldset><legend>Perícias da classe — escolha ${Math.max(0,total-chosen.length)}</legend><div class="check-grid">${allowed.map(x=>`<label class="check"><input class="class-skill" type="checkbox" value="${esc(x)}" ${chosen.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div></fieldset>`:''
}
function decorate(){
 const box=$('classe-escolhas'),{klass,allowed,total}=config();if(!box||!klass)return;
 state.c.choices.class.skills=arr(state.c.choices.class.skills).filter(x=>allowed.includes(x)).slice(0,total);
 ensureSkillMarkup(box,allowed,total);
 const chosen=state.c.choices.class.skills.length,remaining=Math.max(0,total-chosen),legend=box.querySelector('fieldset>legend'),label=`Perícias da classe — escolha ${remaining}`;
 if(legend&&legend.textContent!==label)legend.textContent=label;
 for(const input of box.querySelectorAll('input.class-skill')){input.checked=state.c.choices.class.skills.includes(input.value);const disabled=!input.checked&&remaining===0;if(input.disabled!==disabled)input.disabled=disabled}
}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function onChange(e){
 const input=e.target.closest('input.class-skill'),box=$('classe-escolhas');if(!input||!box?.contains(input))return;
 e.stopImmediatePropagation();const{allowed,total}=config(),current=arr(state.c.choices.class.skills).filter(x=>allowed.includes(x));
 if(input.checked){if(current.length>=total){input.checked=false;return}state.c.choices.class.skills=[...new Set([...current,input.value])].slice(0,total)}else state.c.choices.class.skills=current.filter(x=>x!==input.value);
 decorate();refreshSheet();document.dispatchEvent(new CustomEvent('hub:class-skills-changed'))
}
export function initClassSkillUi(){
 const box=$('classe-escolhas');if(!box)return;
 decorate();box.addEventListener('change',onChange,true);
 new MutationObserver(()=>queueMicrotask(decorate)).observe(box,{childList:true,subtree:true});
 $('classe')?.addEventListener('change',()=>queueMicrotask(decorate));$('nivel')?.addEventListener('change',()=>queueMicrotask(decorate));$('new-character')?.addEventListener('click',()=>queueMicrotask(decorate))
}
