import{state,arr,fold}from'./state.js';

const isClericSpell=spell=>arr(spell?.classes).some(c=>['cleric','clerigo','clérigo'].includes(fold(c)));
const isSorcererSpell=spell=>arr(spell?.classes).some(c=>['sorcerer','feiticeiro'].includes(fold(c)));
function selectedContext(){const klass=arr(state.catalogs?.classes).find(x=>x.id===state.c?.refs?.class),sub=arr(state.catalogs?.subclasses).find(x=>x.id===state.c?.refs?.subclass),name=fold(sub?.mechanics?.name||sub?.name||'');return{klass,name}}
export function syncSorcererSpellAccess(){const{klass,name}=selectedContext(),active=klass?.slug==='sorcerer'&&name==='divine soul';for(const spell of arr(state.catalogs?.spells)){if(spell._divineSoulSorcererGrant){spell.classes=arr(spell.classes).filter(c=>fold(c)!=='sorcerer');delete spell._divineSoulSorcererGrant}if(active&&isClericSpell(spell)&&!isSorcererSpell(spell)){spell.classes=[...arr(spell.classes),'Sorcerer'];spell._divineSoulSorcererGrant=true}}return active}
