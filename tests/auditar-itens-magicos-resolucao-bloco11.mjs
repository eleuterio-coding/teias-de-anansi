import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{classifyMagicItemResponsibility}from'../scripts/character-sheet-magic-item-classification.js';
import{magicItemResolutionContract,initializeMagicItemCharges,spendMagicItemCharges,restoreMagicItemCharges}from'../scripts/character-sheet-magic-item-resolution.js';

const manifest=JSON.parse(await readFile('dados/itens-magicos/manifest.json','utf8')),items=[];
for(const chunk of manifest.chunks)items.push(...JSON.parse(await readFile(chunk,'utf8')));
const block11=items.filter(item=>classifyMagicItemResponsibility(item).block11),missing=[],textOnly=[];
for(const item of block11){const contract=magicItemResolutionContract(item);if(!contract){missing.push(item.id);continue}if(!contract.resolutionKinds.length||!contract.textAvailable)textOnly.push(item.id);assert.equal(contract.id,item.id);assert.ok(['action','bonus','reaction','magic','none'].includes(contract.actionCost))}
assert.equal(block11.length,199,'Bloco 10 congelou 100 itens de resolução + 99 mistos para o Bloco 11.');
assert.equal(missing.length,0,`11D · itens sem contrato de resolução: ${missing.join(', ')}`);
assert.equal(textOnly.length,0,`11D · itens sem contrato operacional mínimo: ${textOnly.join(', ')}`);

const charged=block11.find(item=>/nine-lives-stealer$/.test(item.id));assert.ok(charged,'Fixture Nine Lives Stealer precisa existir.');
const row={kind:'magic',refId:charged.id,name:charged.nome,qty:1,data:charged},character={sheet:{},choices:{}};
const init=initializeMagicItemCharges(character,row,charged,{rng:()=>0});assert.equal(init.ok,true);assert.equal(init.maxCharges,2,'1d8 + 1 com resultado mínimo deve iniciar com 2 cargas.');
const spend=spendMagicItemCharges(character,row,charged,1);assert.equal(spend.ok,true);assert.equal(spend.currentCharges,1);
const restore=restoreMagicItemCharges(character,row,charged);assert.equal(restore.ok,true);assert.equal(restore.currentCharges,2);

const necklace=block11.find(item=>/necklace-of-fireballs$/.test(item.id)),nc=magicItemResolutionContract(necklace);assert.ok(nc.diceExpressions.includes('1d6+3'));assert.ok(nc.dcs.includes(15));assert.ok(nc.resolutionKinds.includes('activation'));

console.log(`Bloco 11 · itens mágicos de resolução: ${block11.length}/${block11.length} contratos, 0 sem cobertura.`);
