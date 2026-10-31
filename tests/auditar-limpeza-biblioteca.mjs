import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const absent=(path,fragment)=>assert.ok(!read(path).includes(fragment),path+' ainda contém '+fragment);

const sources=[
 ['scripts/regras-srd-view-v7.js','de ${SRD.length+DDB_ONLY.length+HOUSE.length} itens'],
 ['scripts/race-library.js','raças-base exibidas'],
 ['dados/_module-source/antecedentes.html','de ${ITENS.length} antecedentes/variantes'],
 ['dados/_module-source/talentos.html','de ${TALENTOS.length} talentos'],
 ['dados/_module-source/subclasses.html','subclasses exibidas.'],
 ['maestrias-de-arma.html','de ${ALL.length} maestrias'],
 ['itens-magicos.html','de ${DATA.items.length} itens'],
 ['comercio-e-despesas.html','de ${GRUPOS.length} grupos exibidos'],
 ['bugigangas.html','registros exibidos']
];
for(const [path,fragment] of sources)absent(path,fragment);
for(const [path,fragment] of [
 ['bibliotecas.html','Explore regras, personagens, criaturas, equipamentos e magias nos catálogos do Hub.'],
 ['scripts/library-catalog-status.js','Contagem indisponível'],
 ['scripts/library-catalog-status.js','módulos visíveis'],
 ['dados/_module-source/classes.html','Regra da Casa — progressão universal:'],
 ['classes-v3.html','Regra da Casa — progressão universal:'],
 ['dados/_module-source/especies.html','Organização do Hub:'],
 ['dados/_module-source/talentos.html','<strong>Precedência:</strong>'],
 ['itens-magicos.html','Regra da Casa — Espaços de Itens Mágicos:'],
 ['scripts/module-clean-loader.js','$1<div class="nota"><strong>Regra da Casa:</strong>']
])absent(path,fragment);

const classes=read('classes-v3.html');
assert.match(classes,/<details class="classe" data-id=/,'Cards de Classes precisam ser recolhíveis.');
assert.ok(!classes.includes('<details class="classe" open'),'As Classes não devem abrir cards automaticamente.');
assert.ok(classes.includes('if(ref){const el='),'Links diretos ainda precisam identificar a classe solicitada.');
const data=JSON.parse(read('dados/bugigangas-pdfs.json'));
assert.equal(data.itens.length,100,'Devem permanecer 100 bugigangas do PHB 2024.');
assert.equal(data.controle.registros_publicados,100);
assert.equal(data.controle.phb2024_publicados,100);
assert.ok(data.itens.every(item=>item.fonte==='phb2024'));
assert.ok(!/mournland|erlw2019/i.test(JSON.stringify(data)),'Mournland não pode aparecer nos dados publicados.');
absent('bugigangas.html','value="erlw2019"');
assert.match(read('bibliotecas.html'),/library-catalog-status\.js\?v=20261031-library-clean1/);
assert.match(read('scripts/module-clean-loader.js'),/const VERSION='20261031-library-clean1'/);

console.log('Biblioteca limpa: avisos e contadores removidos, Classes fechadas e Mournland excluído — OK');
