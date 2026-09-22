import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import{dirname,resolve}from'node:path';
import{classifyMagicItemCatalog,MAGIC_ITEM_EXPLICIT_RESPONSIBILITY}from'../scripts/character-sheet-magic-item-classification.js';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const manifest=JSON.parse(await readFile(resolve(root,'dados/itens-magicos/manifest.json'),'utf8'));
const items=[];
for(const chunk of manifest.chunks){
 const parsed=JSON.parse(await readFile(resolve(root,chunk),'utf8'));
 assert.ok(Array.isArray(parsed),`10H · ${chunk} deve conter uma lista de itens`);
 items.push(...parsed);
}
assert.equal(items.length,manifest.controle.quantidade,'10H · classificação deve cobrir exatamente a quantidade congelada no manifesto');
const ids=items.map(item=>item.id);
assert.equal(new Set(ids).size,ids.length,'10H · catálogo congelado não pode conter IDs duplicados');
const report=classifyMagicItemCatalog(items);
assert.equal(report.total,manifest.controle.quantidade,`10H · todos os ${manifest.controle.quantidade} itens mágicos congelados devem entrar na classificação`);
assert.equal(report.entries.filter(entry=>!entry.category).length,0,'10H · nenhum item pode ficar sem categoria de responsabilidade');
const categorized=Object.values(report.counts).reduce((sum,value)=>sum+value,0);
assert.equal(categorized,manifest.controle.quantidade,'10H · soma das categorias deve corresponder ao catálogo completo');
assert.equal(report.manualReview.length,0,`10H · revisão semântica precisa estar zerada: ${report.manualReview.map(entry=>entry.id).join(', ')}`);

const saneItems=items.filter(item=>item.fonte==='sane');
assert.equal(saneItems.length,manifest.controle.sane_referencia,'10H · todas as entradas referenciais Sane declaradas no manifesto precisam estar no catálogo');
for(const item of saneItems){
 const entry=report.entries.find(x=>x.id===item.id);
 assert.equal(entry.category,'reference-only',`10H · entrada Sane sem mecânica publicada deve permanecer apenas como referência: ${item.id}`);
 assert.equal(entry.block10,false,`10H · entrada Sane de referência não pode inventar efeito persistente: ${item.id}`);
 assert.equal(entry.block11,false,`10H · entrada Sane de referência não pode ser delegada como resolução mecânica: ${item.id}`);
 assert.equal(entry.review,false,`10H · provenance Sane já resolve a classificação sem revisão manual: ${item.id}`);
}
assert.equal(report.counts['reference-only'],manifest.controle.sane_referencia,'10H · quantidade reference-only deve coincidir com sane_referencia do manifesto');

assert.equal(Object.keys(MAGIC_ITEM_EXPLICIT_RESPONSIBILITY).length,38,'10H · os 38 casos antes ambíguos precisam permanecer classificados explicitamente');
for(const[id,category]of Object.entries(MAGIC_ITEM_EXPLICIT_RESPONSIBILITY)){
 assert.ok(ids.includes(id),`10H · responsabilidade explícita aponta para item fora do escopo congelado: ${id}`);
 const entry=report.entries.find(x=>x.id===id);assert.equal(entry.category,category,`10H · categoria explícita divergente para ${id}`);assert.equal(entry.review,false,`10H · ${id} não pode voltar para revisão manual`)
}
console.log(`10H · Classificação integral fechada dos itens mágicos (${report.total}):`,JSON.stringify(report.counts),'revisão manual 0.');
