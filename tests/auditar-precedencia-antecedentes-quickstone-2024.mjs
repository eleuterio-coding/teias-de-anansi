import fs from 'node:fs';
import assert from 'node:assert/strict';
import {backgroundPackageOptions,itemsCurrencyCp,STANDARD_BACKGROUND_PACKAGE_B_GP} from '../scripts/character-builder/starting-equipment-rules.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLocaleLowerCase('pt-BR');
const bg=read('dados/antecedentes-pdf-quickstone-2024.json');
const forge=read('dados/talentos-forge-2025.json');
const quickFeats=read('dados/talentos-quickstone-2024.json');
const migration=bg.migracao_forge_2025;

assert.equal(bg.controle?.quantidade,5);
assert.equal((bg.items||[]).length,5);
assert.equal(migration?.talento_original,'Lesser Dragonmark');
assert.equal(migration?.categoria_vigente,'Dragonmark');
assert.equal((migration?.aplica_a||[]).length,3,'A migração deve atingir os três antecedentes Dragonmarked.');
assert.equal((migration?.opcoes||[]).length,12,'Quickstone possui 12 Dragonmarks verdadeiros elegíveis.');
assert.ok(!(migration.opcoes||[]).some(x=>fold(x.marca)==='aberrant dragonmark'),'Aberrant Dragonmark não integra a migração Quickstone.');

const forgeRows=new Map((forge.itens||[]).map(r=>[fold(r[0]),r]));
for(const option of migration.opcoes){
 const feat=forgeRows.get(fold(option.marca));
 assert.ok(feat,`Dragonmark vigente ausente em Forge: ${option.marca}`);
 assert.equal(feat[1],'Dragonmark',`${option.marca}: categoria vigente deve ser Dragonmark.`);
 assert.ok((option.especies||[]).length,`${option.marca}: pré-requisito de espécie ausente.`);
 assert.ok(String(option.ferramenta||'').trim(),`${option.marca}: ferramenta associada ausente.`);
}
const trueMarks=(forge.itens||[]).filter(r=>r[1]==='Dragonmark'&&fold(r[0])!=='aberrant dragonmark').map(r=>fold(r[0])).sort();
assert.deepEqual(migration.opcoes.map(x=>fold(x.marca)).sort(),trueMarks,'Migração deve cobrir exatamente os 12 Dragonmarks verdadeiros atuais de Forge.');

const dragonBg=(bg.items||[]).filter(x=>migration.aplica_a.includes(x.nome));
assert.equal(dragonBg.length,3);
for(const row of dragonBg){
 assert.equal(row.talento,'Lesser Dragonmark',`${row.nome}: proveniência Quickstone deve preservar o talento original no dado-fonte.`);
 const opts=backgroundPackageOptions({equipmentOptions:[],equipmentText:row.equipamento});
 assert.equal(itemsCurrencyCp(opts.find(x=>x.id==='B').itens),STANDARD_BACKGROUND_PACKAGE_B_GP*100,`${row.nome}: Pacote B deve ser 50 PO.`);
}
const ordinary=(bg.items||[]).filter(x=>!migration.aplica_a.includes(x.nome));
assert.deepEqual(ordinary.map(x=>x.nome).sort(),['Magewright','Wandslinger']);
for(const row of ordinary)assert.equal(row.talento,'Magic Initiate');

const exclusions=quickFeats.exclusoes||[];
assert.ok(exclusions.some(r=>fold(r[0])==='lesser dragonmark'&&/Forge of the Artificer \(2025\)/i.test(r[1])),'Catálogo Quickstone deve registrar Lesser Dragonmark como substituído por Forge 2025.');
assert.ok(!(quickFeats.itens||[]).some(r=>fold(r[0])==='lesser dragonmark'),'Lesser Dragonmark descontinuado não pode voltar ao catálogo selecionável.');

const expectedSpecies={
 'Mark of Detection':['Khoravar','Half-Elf'],'Mark of Finding':['Human','Orc','Half-Orc'],'Mark of Handling':['Human'],'Mark of Healing':['Halfling'],'Mark of Hospitality':['Halfling'],'Mark of Making':['Human'],'Mark of Passage':['Human'],'Mark of Scribing':['Gnome'],'Mark of Sentinel':['Human'],'Mark of Shadow':['Elf'],'Mark of Storm':['Khoravar','Half-Elf'],'Mark of Warding':['Dwarf']
};
for(const [mark,species] of Object.entries(expectedSpecies)){const row=migration.opcoes.find(x=>x.marca===mark);assert.deepEqual(row?.especies,species,`${mark}: espécies elegíveis divergentes.`)}
for(const p of ['dados/antecedentes-pdf-quickstone-2024.json','dados/talentos-quickstone-2024.json','dados/talentos-forge-2025.json'])assert.ok(!fs.readFileSync(p,'utf8').toLowerCase().includes('supabase'),`${p}: não pode introduzir Supabase.`);
console.log('Precedência dos antecedentes Quickstone validada: 3 Lesser Dragonmark históricos migrados para escolha entre 12 Dragonmarks verdadeiros Forge 2025, com pré-requisito de espécie.');
