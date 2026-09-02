import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{classifyMagicItemResponsibility}from'../scripts/character-sheet-magic-item-classification.js';
import{magicItemPersistentOutcome,setMagicItemUsage}from'../scripts/character-sheet-magic-item-state.js';

const manifest=JSON.parse(await readFile('dados/itens-magicos/manifest.json','utf8')),items=[];
for(const chunk of manifest.chunks)items.push(...JSON.parse(await readFile(chunk,'utf8')));
const defaults=id=>{
 const slug=String(id).split(':').pop();
 if(['armor-1-2-or-3','ammunition-1-2-or-3','weapon-1-2-or-3','shield-1-2-or-3','wand-of-the-war-mage-1-2-or-3'].includes(slug))return{magicBonus:1};
 if(['armor-of-resistance','ring-of-resistance','potion-of-resistance','dragon-scale-mail'].includes(slug))return{damageType:'Fogo'};
 if(slug==='armor-of-vulnerability')return{damageType:'Cortante'};
 if(['potion-of-giant-strength','belt-of-giant-strength'].includes(slug))return{strengthScore:21};
 if(slug==='carpet-of-flying')return{flyingSpeed:30};
 if(slug==='defender')return{acTransfer:0};
 if(slug==='ioun-stone')return{variant:'Protection'};
 return{}
};
const unhandled=[];let audited=0;
for(const item of items){
 const responsibility=classifyMagicItemResponsibility(item);if(!responsibility.block10)continue;audited++;
 const row={kind:'magic',refId:item.id,name:item.nome,qty:1,source:item.fonte,data:item},character={sheet:{},choices:{}};
 const result=setMagicItemUsage(character,[row],row,{equipped:true,attuned:true,active:true,parameters:defaults(item.id)});
 assert.equal(result.ok,true,`10J · estado de auditoria não pôde ser configurado para ${item.id}: ${result.reason||''}`);
 const outcome=magicItemPersistentOutcome(character,[row]),slug=String(item.id).split(':').pop(),covered=outcome.applied.some(x=>x.id===slug)||outcome.pending.some(x=>x.id===slug);
 if(!covered)unhandled.push(item.id)
}
if(unhandled.length)console.error('10J · itens persistentes/mistos sem contrato estruturado:\n'+unhandled.join('\n'));
assert.equal(unhandled.length,0,`10J · ${unhandled.length} itens persistentes/mistos ainda estão apenas como texto`);
assert.ok(audited>0,'10J · auditoria persistente não pode ter escopo vazio');
console.log(`10J · Cobertura persistente integral: ${audited} itens com contrato estruturado, 0 sem handler.`);
