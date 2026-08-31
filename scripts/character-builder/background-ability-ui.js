import{state,$,AB}from'./state.js';
import{applyHouseRules}from'./rules.js?v=20260831-class-tools1';

let initialized=false;

function backgroundChoices(){
 state.c.choices=state.c.choices||{};
 return state.c.choices.background||(state.c.choices.background={})
}
function otherAbility(value){return AB.find(a=>a!==value)||AB[0]}
function syncControls(){
 const ch=backgroundChoices(),p2=$('bg-p2-house'),p1=$('bg-p1-house');
 if(p2&&AB.includes(ch.plus2))p2.value=ch.plus2;
 if(p1&&AB.includes(ch.plus1))p1.value=ch.plus1
}
function refreshDerivedState(field,value){
 applyHouseRules();
 syncControls();
 $('nome')?.dispatchEvent(new Event('input'));
 document.dispatchEvent(new CustomEvent('hub:origin-house-changed',{detail:{field,value}}));
 document.dispatchEvent(new CustomEvent('hub:abilities-context-changed',{detail:{source:'background-house-rule',field,value}}))
}
function setPlus2(next){
 if(!AB.includes(next))return;
 const ch=backgroundChoices(),previous=ch.plus2;
 ch.plus2=next;
 if(ch.plus1===next)ch.plus1=AB.includes(previous)&&previous!==next?previous:otherAbility(next);
 refreshDerivedState('plus2',next)
}
function setPlus1(next){
 if(!AB.includes(next))return;
 const ch=backgroundChoices(),previous=ch.plus1;
 ch.plus1=next;
 if(ch.plus2===next)ch.plus2=AB.includes(previous)&&previous!==next?previous:otherAbility(next);
 refreshDerivedState('plus1',next)
}
function onChange(e){
 const id=e.target?.id;if(id!=='bg-p2-house'&&id!=='bg-p1-house')return;
 e.stopImmediatePropagation();
 if(id==='bg-p2-house')setPlus2(e.target.value);else setPlus1(e.target.value)
}
function repairState(){
 if(!state.c)return;const ch=backgroundChoices();
 if(!AB.includes(ch.plus2))ch.plus2=AB[0];
 if(!AB.includes(ch.plus1)||ch.plus1===ch.plus2)ch.plus1=otherAbility(ch.plus2);
 syncControls()
}
export function initBackgroundAbilityUi(){
 if(initialized)return;initialized=true;
 repairState();
 document.addEventListener('change',onChange,true);
 document.addEventListener('hub:origin-context-changed',()=>queueMicrotask(repairState));
 $('new-character')?.addEventListener('click',()=>queueMicrotask(repairState))
}
