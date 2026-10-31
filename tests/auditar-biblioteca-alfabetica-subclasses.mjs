import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const sortPt=(a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'});
const verifyJs=(source,path)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:path}),path+' deve compilar');

const biblioteca=read('bibliotecas.html');
const cards=[...biblioteca.matchAll(/<li><a href="([^"]+)"><span class="nome" data-numero="(\d+)">([^<]+)<\/span>/g)];
assert.equal(cards.length,18,'Biblioteca mantém 18 módulos.');
assert.deepEqual(cards.map(m=>m[3]),cards.map(m=>m[3]).sort(sortPt),'Biblioteca em ordem alfabética PT-BR.');
assert.deepEqual(cards.map(m=>Number(m[2])),Array.from({length:18},(_,i)=>i+1),'Índices acompanham a nova ordem.');

const regras=read('scripts/regras-srd-view-v7.js');
assert.match(regras,/allCards\(\)\.filter[\s\S]*?\.sort\(\(a,b\)=>a\.name\.localeCompare\(b\.name,'pt-BR'/,
 'As Regras devem ser ordenadas por nome localizado após o filtro.');
verifyJs(regras,'scripts/regras-srd-view-v7.js');

const classes=read('dados/_module-source/classes.html');
const entries=[...classes.matchAll(/\['([^']+)','([^']+)'\]/g)].map(m=>({nome:m[1],slug:m[2]}));
assert.equal(entries.length,13,'A lista de Classes deve conter 12 classes-base e Artífice.');
assert.deepEqual(entries.map(x=>x.nome),entries.map(x=>x.nome).sort(sortPt),'Cards de Classes em ordem alfabética.');
assert.equal(entries.filter(x=>x.slug==='artificer').length,1,'Artífice aparece exatamente uma vez.');
assert.ok(!/id="artifice"|<section class="art"/.test(classes),'Não deixar Artífice aberto fora da listagem de cards.');
assert.ok(classes.includes('classes-v3.html?v='),'As 13 classes usam o mesmo leitor.');
verifyJs(classes.match(/<script>([\s\S]*?)<\/script>/)[1],'dados/_module-source/classes.html');

const classeDetalhe=read('classes-v3.html');
assert.ok(classeDetalhe.includes('normalizeArtificer(res[16])'),'O detalhe do Artífice deve usar o registro local.');
assert.ok(classeDetalhe.includes("if(i.slug==='artificer')return renderArtificer(i)"),'Artífice deve usar detalhe comum.');
assert.ok(!classeDetalhe.includes('<details class="classe" open'),'Nenhuma classe abre por padrão sem link direto.');
verifyJs(classeDetalhe.match(/<script>([\s\S]*?)<\/script>/)[1],'classes-v3.html');

const catalogo=json('dados/subclasses-pdfs.json').subclasses;
const localizacao=json('dados/localizacao-ptbr-subclasses.json');
const fonteIds=new Set(catalogo.map(x=>x.fonte_id));
assert.equal(catalogo.length,112);
assert.equal(new Set(catalogo.map(x=>x.nome)).size,112,'Identidades únicas das 112 subclasses.');
assert.ok(catalogo.every(x=>localizacao.nomes[x.nome]&&localizacao.classes[x.classe]),
 'Todas as subclasses devem possuir nome e classe traduzidos.');

const features=json('dados/localizacao-ptbr-caracteristicas-subclasses.json');
const featureFiles=[
  'phb-2024','forge-2025','quickstone-2024','heroes-faerun-2025',
  'tasha-2020','xanathar-2017'
];
const featuresReais=new Set(featureFiles.flatMap(id=>json('dados/subclasses-mecanicas-'+id+'.json').subclasses.flatMap(item=>item.progressao.map(row=>row.nome))));
assert.equal(featuresReais.size,553,'O catálogo possui 553 nomes de características distintos.');
assert.deepEqual([...featuresReais].filter(n=>!features.nomes[n]),[],'Todas as características precisam de nome localizado.');
assert.deepEqual(Object.keys(features.nomes).filter(n=>!featuresReais.has(n)),[],'Não manter traduções órfãs.');

const ui=read('scripts/subclasses-biblioteca-ui.js');
for(const id of fonteIds)assert.ok(ui.includes("'"+id+"'"),'Selo/livro ausente: '+id);
for(const term of ['dataset.nomePtbr','dataset.livro','ficha.replaceChildren()',"field(ficha,'Livro'","field(ficha,'Classe'",'.pdf-rastreio','.corpo .fonte','lista.append(...cards)'])
 assert.ok(ui.includes(term),'Contrato de UI das subclasses ausente: '+term);
assert.ok(ui.includes("features.nomes"),'Interface deve carregar nomes traduzidos de características.');
assert.ok(ui.includes("cards.length!==112"),'A interface deve bloquear cobertura incompleta.');
verifyJs(ui,'scripts/subclasses-biblioteca-ui.js');

const loader=read('scripts/module-clean-loader.js');
const mechanics=read('scripts/subclass-mechanics-catalog.js');
assert.ok(loader.includes('scripts/subclasses-biblioteca-ui.js'),'Tradução deve estar no módulo publicado.');
assert.ok(mechanics.includes("hub:subclasses-mecanicas-prontas"),'A tradução deve aguardar mecânicas carregadas.');
verifyJs(loader,'scripts/module-clean-loader.js');
verifyJs(mechanics,'scripts/subclass-mechanics-catalog.js');

console.log('Biblioteca A–Z: 18 módulos, Regras A–Z, 13 classes e 112 subclasses e 553 características localizadas, com livros — OK');
