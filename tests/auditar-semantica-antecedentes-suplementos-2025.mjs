import fs from 'node:fs';
import assert from 'node:assert/strict';
import {backgroundPackageOptions,itemsCurrencyCp,STANDARD_BACKGROUND_PACKAGE_B_GP} from '../scripts/character-builder/starting-equipment-rules.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLocaleLowerCase('pt-BR');
const matrix=read('dados/auditoria-normativa-antecedentes-suplementos-2025.json');
const forge=read('dados/antecedentes-pdf-forge-2025.json');
const heroes=read('dados/antecedentes-pdf-heroes-2025.json');
const forgeFeats=read('dados/talentos-forge-2025.json');
const heroesFeats=read('dados/talentos-heroes-2025.json');
const phbFeats=read('dados/talentos-phb-2024.json');

const featMap=pkg=>new Map((pkg.itens||[]).map(r=>[fold(Array.isArray(r)?r[0]:r.nome_original||r.nome||r.name),{name:Array.isArray(r)?r[0]:r.nome_original||r.nome||r.name,category:Array.isArray(r)?r[1]:r.categoria||''}]));
const forgeFeatMap=featMap(forgeFeats),heroesFeatMap=featMap(heroesFeats),phbFeatMap=featMap(phbFeats);

function validateSource(source,id){
 const expected=matrix.fontes.find(x=>x.id===id);assert.ok(expected,`Matriz sem ${id}`);
 assert.equal(source.controle?.quantidade,expected.quantidade,`${id}: quantidade declarada divergente.`);
 assert.equal((source.items||[]).length,expected.quantidade,`${id}: quantidade real divergente.`);
 assert.deepEqual((source.items||[]).map(x=>x.nome).sort(),[...expected.nomes].sort(),`${id}: identidades divergentes.`);
 for(const row of source.items||[]){
  assert.equal((row.atributos||[]).length,3,`${id}/${row.nome}: deve ter 3 atributos.`);
  assert.equal(new Set((row.atributos||[]).map(fold)).size,3,`${id}/${row.nome}: atributos duplicados.`);
  assert.equal((row.pericias||[]).length,2,`${id}/${row.nome}: deve ter 2 perícias.`);
  assert.equal(new Set((row.pericias||[]).map(fold)).size,2,`${id}/${row.nome}: perícias duplicadas.`);
  assert.ok(String(row.talento||'').trim(),`${id}/${row.nome}: talento ausente.`);
  assert.ok(String(row.ferramenta||row.ferramenta_escolha||'').trim(),`${id}/${row.nome}: ferramenta ou escolha ausente.`);
  assert.ok(String(row.equipamento||'').trim(),`${id}/${row.nome}: Pacote A ausente.`);
  const opts=backgroundPackageOptions({equipmentOptions:[],equipmentText:row.equipamento});
  assert.deepEqual(opts.map(x=>x.id),['A','B'],`${id}/${row.nome}: deve expor A e B.`);
  assert.ok(opts[0].itens.length,`${id}/${row.nome}: Pacote A vazio.`);
  assert.equal(itemsCurrencyCp(opts[1].itens),STANDARD_BACKGROUND_PACKAGE_B_GP*100,`${id}/${row.nome}: Pacote B deve ser 50 PO.`);
 }
 return expected
}

const forgeExpected=validateSource(forge,'forge-2025');
const heroesExpected=validateSource(heroes,'heroes-2025');
assert.equal(forgeExpected.autoridade,'oficial_atual');
assert.equal(heroesExpected.autoridade,'oficial_atual');

const forgeRows=forge.items||[];
const dragonmarked=forgeRows.filter(row=>forgeFeatMap.get(fold(row.talento))?.category==='Dragonmark');
assert.equal(dragonmarked.length,forgeExpected.antecedentes_com_dragonmark,'Forge deve ter exatamente 14 antecedentes que concedem Dragonmark feat.');
for(const row of dragonmarked){
 const feat=forgeFeatMap.get(fold(row.talento));
 assert.equal(feat.category,'Dragonmark',`${row.nome}: feat específico não pode ser reclassificado como Origem.`);
}
const normalForge=forgeRows.filter(row=>!dragonmarked.includes(row));
assert.equal(normalForge.length,3,'Forge deve ter 3 antecedentes sem Dragonmark específico.');
for(const row of normalForge){const feat=phbFeatMap.get(fold(row.talento));assert.equal(feat?.category,'Origem',`${row.nome}: ${row.talento} deve resolver como Talento de Origem PHB.`)}

for(const row of heroes.items||[]){
 const local=heroesFeatMap.get(fold(row.talento)),core=phbFeatMap.get(fold(row.talento)),feat=local||core;
 assert.ok(feat,`Heroes/${row.nome}: talento não resolve no catálogo: ${row.talento}`);
 assert.equal(feat.category,'Origem',`Heroes/${row.nome}: talento concedido deve ser categoria Origem: ${row.talento}`);
}

const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8');
const originSync=fs.readFileSync('scripts/character-builder/origin-feat-sync.js','utf8');
// Gap conhecido e deliberadamente fail-closed para 11D/11E: Dragonmark de antecedente não pode ser confundido com o Origin feat livre.
assert.ok(rules.includes('_houseOriginalFeat'),'Runtime deve preservar a referência original do talento do antecedente para a etapa de override normativo.');
assert.ok(originSync.includes('originFeat'),'Sincronizador deve manter a escolha livre de Origin feat separadamente no estado.');
for(const p of ['dados/antecedentes-pdf-forge-2025.json','dados/antecedentes-pdf-heroes-2025.json','dados/talentos-forge-2025.json','dados/talentos-heroes-2025.json'])assert.ok(!fs.readFileSync(p,'utf8').toLowerCase().includes('supabase'),`${p}: não pode introduzir Supabase.`);
console.log('Antecedentes oficiais 2025 validados: Forge 17 (14 Dragonmark + 3 Origin) e Heroes 18 (todos com Origin feat), estrutura 2024 e B=50 PO.');
