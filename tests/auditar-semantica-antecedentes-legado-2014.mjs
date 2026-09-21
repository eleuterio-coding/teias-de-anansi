import fs from 'node:fs';
import assert from 'node:assert/strict';
import {backgroundPackageOptions,itemsCurrencyCp,STANDARD_BACKGROUND_PACKAGE_B_GP} from '../scripts/character-builder/starting-equipment-rules.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const matrix=read('dados/auditoria-normativa-antecedentes-legado-2014.json');
const open=read('dados/antecedentes-abertos-adicionais.json');
const phb2014=read('dados/antecedentes-legado-phb-2014.json');

assert.equal(matrix.autoridade,'oficial_legado');
assert.equal(matrix.quantidade,4);
const rows=[...(open.items||[]),...(phb2014.items||[])].filter(x=>x.compatibilidade?.ruleset==='5e');
assert.equal(rows.length,4,'Catálogo deve preservar quatro antecedentes 5e Legacy ativos: Folk Hero, Spy, Urchin e Outlander.');
assert.deepEqual(rows.map(x=>x.nome_original).sort(),matrix.antecedentes.map(x=>x.nome_original).sort());

for(const expected of matrix.antecedentes){
 const row=rows.find(x=>fold(x.nome_original)===fold(expected.nome_original));assert.ok(row,`Legado ausente: ${expected.nome_original}`);
 assert.equal(row.classificacao?.status,expected.status,`${expected.nome_original}: status divergente.`);
 assert.equal(row.compatibilidade?.revisao_core,2014,`${expected.nome_original}: revisão deve permanecer 2014.`);
 const ds=row.mecanica?.dados_especificos||{};
 assert.deepEqual((ds.pericias||[]).map(fold).sort(),expected.pericias.map(fold).sort(),`${expected.nome_original}: perícias divergentes.`);
 for(const tool of expected.ferramentas_fixas||[])assert.ok((ds.ferramentas||[]).some(x=>fold(x)===fold(tool)),`${expected.nome_original}: ferramenta fixa ausente: ${tool}`);
 if(expected.ferramenta_escolha)assert.ok(fold(ds.ferramenta_escolha?.categoria).includes(fold(expected.ferramenta_escolha)),`${expected.nome_original}: categoria de ferramenta escolhida divergente.`);
 else assert.equal(ds.ferramenta_escolha,undefined,`${expected.nome_original}: não deveria exigir ferramenta à escolha.`);
 if(expected.idiomas_escolha)assert.ok((ds.idiomas||[]).some(x=>/idioma.*escolha/i.test(x)),`${expected.nome_original}: escolha de idioma ausente.`);
 assert.equal(fold(ds.caracteristica?.nome),fold(expected.caracteristica),`${expected.nome_original}: característica divergente.`);
 assert.equal(ds.atributos_elegiveis,undefined,`${expected.nome_original}: não pode inventar atributos fixos de 2024 no bloco-fonte 2014.`);
 assert.equal(ds.talento_origem,undefined,`${expected.nome_original}: não pode inventar Origin feat no bloco-fonte 2014.`);
 const a=ds.equipamento_inicial?.opcoes?.find(x=>x.id==='A');assert.ok(a?.itens?.length,`${expected.nome_original}: pacote-fonte A ausente.`);
 const sourceGp=itemsCurrencyCp(a.itens)/100;assert.equal(sourceGp,expected.po_fonte,`${expected.nome_original}: moedas originais divergentes.`);
 const runtime=backgroundPackageOptions({equipmentOptions:ds.equipamento_inicial?.opcoes||[],equipmentText:''});
 assert.equal(itemsCurrencyCp(runtime.find(x=>x.id==='B').itens),STANDARD_BACKGROUND_PACKAGE_B_GP*100,`${expected.nome_original}: adaptação B=50 PO ausente.`);
}
const spy=rows.find(x=>fold(x.nome_original)==='spy');
assert.ok(spy?.conteudo?.notas?.some(x=>/Criminoso 2024/i.test(x)), 'Spy deve registrar por que continua ativo apesar de Criminal 2024.');
const urchin=rows.find(x=>fold(x.nome_original)==='urchin');
assert.ok(urchin?.conteudo?.notas?.some(x=>/Wayfarer 2024/i.test(x)), 'Urchin deve registrar a afinidade temática com Wayfarer sem tratá-lo como substituto formal.');
const outlander=rows.find(x=>fold(x.nome_original)==='outlander');
assert.ok(outlander?.conteudo?.notas?.some(x=>/Guia 2024/i.test(x)), 'Outlander deve registrar a afinidade temática com Guia sem tratá-lo como substituto formal.');
assert.equal(matrix.adaptacao_5_5e_regra_casa.pacote_b_po,50);
assert.match(matrix.adaptacao_5_5e_regra_casa.nota,/não são apresentados como conteúdo original/i,'Matriz deve separar adaptação do Hub da fonte 2014.');
const house=fs.readFileSync('dados/regras-casa-adicionais.json','utf8');
assert.match(house,/Talento de Origem Livre/i,'Regra da Casa deve registrar Origin feat livre.');
assert.match(house,/Pacote B padrão de Antecedente concede 50 PO/i,'Regra da Casa deve registrar B=50 PO.');
for(const p of ['dados/antecedentes-abertos-adicionais.json','dados/antecedentes-legado-phb-2014.json','dados/regras-casa-adicionais.json'])assert.ok(!fs.readFileSync(p,'utf8').toLowerCase().includes('supabase'),`${p}: não pode introduzir Supabase.`);
console.log('Antecedentes legados validados: Folk Hero, Spy, Urchin e Outlander preservam o bloco 2014; atributos, Origin feat e B=50 são adaptações explícitas do Hub.');
