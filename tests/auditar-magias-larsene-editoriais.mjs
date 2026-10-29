import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const catalog=JSON.parse(read('dados/magias-catalogo.json')).itens;
const overlay=JSON.parse(read('dados/magias-larsene-descricoes-autorais.json'));
const library=read('magias.html');
const sheet=read('scripts/character-sheet-unified-spells.js');
const sheetHtml=read('ficha-personagem.html');
const ceSrc=read('scripts/concentracao-expandida-selos.js');
assert.equal(overlay.schema,'hub-rpg.magias-larsene-editoriais.v1');
assert.equal(overlay.natureza,'parafrases_autorais_bilingues');
assert.equal(Object.keys(overlay.itens).length,27);
assert.equal(catalog.length,537);
const records=catalog.filter(x=>x.fonte==='larsene-ledger-2023');
assert.equal(records.length,27);

const apiWindow={};
vm.runInNewContext(ceSrc,{
 window:apiWindow,document:{getElementById:()=>null},
 setInterval:()=>{throw new Error('CE não deve inicializar sem a biblioteca')}
},{filename:'concentracao-expandida-selos.js'});
const present=apiWindow.HubConcentracaoExpandida.present;
const expectedCounts={CM:51,CI:20,CZ:66,CL:105,SC:295,NC:0,ND:0};
const counts={CM:0,CI:0,CZ:0,CL:0,SC:0,NC:0,ND:0};
for(const x of catalog){
 const edit=x.fonte==='larsene-ledger-2023'?overlay.itens[x.nome_original]:null;
 if(x.fonte==='larsene-ledger-2023'){
  assert.ok(edit,'Falta tradução para '+x.nome_original);
  assert.ok(edit.pt.length>100 && edit.en.length>100,'Descrição incompleta: '+x.nome_original);
  assert.equal(typeof edit.concentracao,'boolean');
  assert.ok(edit.duracao && edit.alcance && edit.componentes,'Metadados mecânicos ausentes: '+x.nome_original);
  assert.ok(edit.ce==='CL'||edit.ce==='CZ'||edit.ce==='CM','CE não mapeada: '+x.nome_original);
  assert.equal(!!edit.higher_pt,!!edit.higher_en,'Escalonamento bilíngue divergente: '+x.nome_original);
 }
 const conc=edit?edit.concentracao:x.concentracao;
 const category=present({nome_original:x.nome_original,concentracao:conc,ruleset:x.ruleset}).category;
 assert.ok(Object.hasOwn(counts,category),'Categoria desconhecida: '+x.nome_original);
 if(edit)assert.equal(category,conc?edit.ce:'SC','Classificação L’Arsene divergente: '+x.nome_original);
 counts[category]++;
}
assert.deepEqual(counts,expectedCounts);
assert.equal(records.filter(x=>overlay.itens[x.nome_original].concentracao).length,17);
assert.equal(records.filter(x=>!overlay.itens[x.nome_original].concentracao).length,10);
const libraryJs=library.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(libraryJs,'Script da Biblioteca indisponível.');
new vm.Script(libraryJs,{filename:'magias.html inline'});
assert.match(libraryJs,/loadLarseneEditorial/);
assert.match(libraryJs,/spell\.concentracao=editorial\.concentracao/);
assert.match(libraryJs,/spell\.niveis_superiores=editorial\.higher_pt/);
assert.match(libraryJs,/Texto em inglês — versão editorial/);
assert.match(libraryJs,/editorial\.en/);
assert.match(sheet,/magias-larsene-descricoes-autorais\.json/);
assert.match(sheet,/spell\.description=editorial\.pt/);
assert.match(sheet,/spell\.concentration=editorial\.concentracao/);
assert.match(sheet,/Texto em inglês — versão editorial/);
assert.match(sheetHtml,/character-sheet-unified-spells\.js\?v=20261029-larsene-bilingue1/);
assert.match(library,/concentracao-expandida-selos\.js\?v=20261029-larsene-ce1/);
console.log('OK: 27/27 magias autorais bilíngues, 17 com concentração, 10 sem concentração; total de 537 auditado.');
