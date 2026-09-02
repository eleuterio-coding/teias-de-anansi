import fs from 'node:fs';
import assert from 'node:assert/strict';
import {backgroundPackageOptions,itemsCurrencyCp,STANDARD_BACKGROUND_PACKAGE_B_GP} from '../scripts/character-builder/starting-equipment-rules.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const sorted=a=>[...(a||[])].map(fold).sort();
const matrix=read('dados/auditoria-normativa-antecedentes-phb-2024.json');
const srd=read('dados/antecedentes-srd-5.2.1.json');
const phb=read('dados/antecedentes-pdf-phb-2024.json');
const open=read('dados/antecedentes-abertos-adicionais.json');

assert.equal(matrix.autoridade,'oficial_atual');
assert.equal(matrix.quantidade,16);
assert.equal((srd.items||[]).length,4,'SRD 5.2.1 deve fornecer exatamente 4 antecedentes core.');
assert.equal(phb.controle?.quantidade,11,'Arquivo PHB local deve declarar 11 antecedentes.');
assert.equal((phb.items||[]).length,11,'Arquivo PHB local deve conter 11 antecedentes.');
const wayfarers=(open.items||[]).filter(x=>fold(x.nome_original||x.nome)==='wayfarer'&&x.compatibilidade?.ruleset==='5.5e');
assert.equal(wayfarers.length,1,'Wayfarer PHB 2024 deve existir exatamente uma vez no arquivo aberto adicional.');

function structured(item,bucket){
 const ds=item.mecanica?.dados_especificos||{};
 const feat=ds.talento_origem||{};
 const choice=ds.ferramenta_escolha?.categoria||((item.mecanica?.escolhas||[]).find(x=>/ferramenta|instrumento|jogo/i.test(x.nome||''))?.nome||'');
 return{bucket,item,name:item.nome_original||item.nome,runtime:item.nome,abilities:ds.atributos_elegiveis||[],feat:feat.nome_original||feat.nome||'',featChoice:feat.escolha_fixa||'',skills:ds.pericias||[],tool:(ds.ferramentas||[])[0]||'',toolChoice:choice,equipmentOptions:ds.equipamento_inicial?.opcoes||[],equipmentText:''};
}
function simple(item){return{bucket:'phb',item,name:item.nome,runtime:item.pt||item.nome,abilities:item.atributos||[],feat:item.talento||'',featChoice:item.talento_escolha||'',skills:item.pericias||[],tool:item.ferramenta||'',toolChoice:item.ferramenta_escolha||'',equipmentOptions:item.equipamento_opcoes||[],equipmentText:item.equipamento||''}}
const rows=[...(srd.items||[]).map(x=>structured(x,'srd')),...(phb.items||[]).map(simple),...wayfarers.map(x=>structured(x,'abertos'))];
assert.equal(rows.length,16);
assert.equal(new Set(rows.map(x=>fold(x.name))).size,16,'As 16 identidades PHB devem ser únicas.');
assert.deepEqual(rows.map(x=>fold(x.name)).sort(),matrix.antecedentes.map(x=>fold(x.nome_original)).sort(),'Conjunto dos 16 antecedentes PHB divergente.');

for(const expected of matrix.antecedentes){
 const row=rows.find(x=>fold(x.name)===fold(expected.nome_original));
 assert.ok(row,`Antecedente ausente: ${expected.nome_original}`);
 assert.equal(row.bucket,expected.arquivo,`${expected.nome_original}: origem runtime divergente.`);
 assert.deepEqual(sorted(row.abilities),sorted(expected.atributos),`${expected.nome_original}: atributos elegíveis divergentes.`);
 assert.equal(row.abilities.length,3,`${expected.nome_original}: deve oferecer exatamente 3 atributos elegíveis.`);
 assert.deepEqual(sorted(row.skills),sorted(expected.pericias),`${expected.nome_original}: perícias divergentes.`);
 assert.equal(row.skills.length,2,`${expected.nome_original}: deve conceder exatamente 2 perícias.`);
 assert.equal(fold(row.feat),fold(expected.talento),`${expected.nome_original}: talento de origem divergente.`);
 if(expected.talento_escolha)assert.equal(fold(row.featChoice),fold(expected.talento_escolha),`${expected.nome_original}: escolha fixa do talento divergente.`);
 if(expected.ferramenta)assert.equal(fold(row.tool),fold(expected.ferramenta),`${expected.nome_original}: ferramenta fixa divergente.`);
 if(expected.ferramenta_escolha)assert.ok(fold(row.toolChoice).includes(fold(expected.ferramenta_escolha)),`${expected.nome_original}: categoria de ferramenta escolhida divergente: ${row.toolChoice}`);
 assert.ok(row.tool||row.toolChoice,`${expected.nome_original}: proficiência de ferramenta ausente.`);
 const options=backgroundPackageOptions({equipmentOptions:row.equipmentOptions,equipmentText:row.equipmentText});
 assert.deepEqual(options.map(x=>x.id),['A','B'],`${expected.nome_original}: deve oferecer pacotes A e B.`);
 const b=options.find(x=>x.id==='B');
 assert.equal(itemsCurrencyCp(b.itens),STANDARD_BACKGROUND_PACKAGE_B_GP*100,`${expected.nome_original}: Pacote B deve valer 50 PO.`);
 assert.ok(options.find(x=>x.id==='A')?.itens?.length,`${expected.nome_original}: Pacote A não pode ficar vazio.`);
}

assert.equal(STANDARD_BACKGROUND_PACKAGE_B_GP,50,'Regra central de antecedentes 2024 deve manter Pacote B em 50 PO.');
const source=fs.readFileSync('scripts/character-builder/starting-equipment-rules.js','utf8');
assert.match(source,/explicitB\?copyPackage\(explicitB\):\{id:'B',itens:\[coin\(STANDARD_BACKGROUND_PACKAGE_B_GP\)\]\}/,'Runtime deve sintetizar B=50 PO quando o registro simplificado não trouxer B explícito.');
for(const p of ['dados/antecedentes-srd-5.2.1.json','dados/antecedentes-pdf-phb-2024.json','dados/antecedentes-abertos-adicionais.json','scripts/character-builder/starting-equipment-rules.js'])assert.ok(!fs.readFileSync(p,'utf8').toLowerCase().includes('supabase'),`${p}: não pode introduzir Supabase.`);
console.log('Semântica dos antecedentes PHB 2024 validada: 16 identidades (4 SRD + 11 PHB + Wayfarer), 3 atributos, 2 perícias, talento, ferramenta e Pacote B=50 PO.');
