import{state,$,num}from'./state.js';
import{economyMode,currentCoinSnapshot,recordCreationBalanceAndRestoreCurrent}from'./economy-state.js?v=20260901-current-balance1';

const COINS=['cp','sp','ep','gp','pp'];
let initialized=false,protectedCoins=null,restoring=false;

function protectIfNeeded(){
 if(!state.c||economyMode(state.c)!=='current'){protectedCoins=null;return false}
 protectedCoins=currentCoinSnapshot(state.c);return true
}
function lockCoinInputs(){
 for(const coin of COINS){const el=$(`coin-${coin}`);if(!el)continue;el.value=num(state.c?.sheet?.inventory?.[coin]);el.readOnly=true;el.title='Saldo atual preservado da ficha. As compras iniciais continuam como histórico e não recalculam estas moedas.'}
}
export function restoreProtectedCurrentBalance(){
 if(restoring||!protectedCoins||!state.c||economyMode(state.c)!=='current')return false;
 restoring=true;
 try{
  const restored=recordCreationBalanceAndRestoreCurrent(state.c,protectedCoins);if(!restored)return false;
  lockCoinInputs();
  document.dispatchEvent(new CustomEvent('hub:equipment-inventory-changed',{detail:{economyGuard:true,currentBalancePreserved:true}}));
  return true
 }finally{restoring=false}
}
function scheduleRestore(){queueMicrotask(()=>queueMicrotask(restoreProtectedCurrentBalance))}
function bind(){
 document.addEventListener('hub:equipment-inventory-changed',event=>{if(event.detail?.economyGuard)return;scheduleRestore()});
 for(const type of['hub:starting-equipment-changed','hub:origin-context-changed','hub:origin-house-changed','hub:class-context-changed','hub:progression-context-changed'])document.addEventListener(type,scheduleRestore);
 $('builder')?.addEventListener('change',event=>{if(['nivel','antecedente','classe'].includes(event.target?.id))scheduleRestore()});
 document.addEventListener('hub:new-character',()=>{protectedCoins=null;queueMicrotask(protectIfNeeded)})
}
export function initPostCreationEconomyGuard(){
 if(initialized)return restoreProtectedCurrentBalance;initialized=true;protectIfNeeded();bind();return restoreProtectedCurrentBalance
}
