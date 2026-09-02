import'./hub-ux.js?v=20260901-ux-final1';

const DEFAULTS={objective:'',scene:'',notes:'',reminders:''};

export function ensureGameplayState(character){
 if(!character)return null;
 character.sheet=character.sheet||{};
 let gameplay=character.sheet.gameplay;
 if(!gameplay||typeof gameplay!=='object'||Array.isArray(gameplay)){
  gameplay={};character.sheet.gameplay=gameplay
 }
 for(const[key,value]of Object.entries(DEFAULTS))if(!(key in gameplay))gameplay[key]=value;
 return gameplay
}

export function setGameplayField(character,key,value){
 const gameplay=ensureGameplayState(character);if(!gameplay||!(key in DEFAULTS))return false;
 gameplay[key]=String(value??'');return true
}

export function gameplaySnapshot(character){
 const gameplay=ensureGameplayState(character);if(!gameplay)return null;
 return Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key,String(gameplay[key]??'')]))
}

export const GAMEPLAY_FIELDS=Object.freeze(Object.keys(DEFAULTS));