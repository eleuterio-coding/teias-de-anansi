import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ler=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(ler(p));
const pages=[
  'armaduras.html','armas.html','bugigangas.html','comercio-e-despesas.html',
  'equipamentos-aventura.html','ferramentas.html','idiomas.html','maestrias-de-arma.html',
  'magias.html','dados/_module-source/antecedentes.html'
];
for(const path of pages){
 const html=ler(path);
 assert.ok(html.includes('scripts/biblioteca-padroes.js'),path+' deve carregar utilitários compartilhados');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1].trim()).filter(Boolean);
 for(const [i,source] of scripts.entries())
  assert.doesNotThrow(()=>new vm.Script(source,{filename:path+'#inline-'+i}),path+' contém script inválido');
}
const regra=ler('scripts/regras-srd-view-v7.js');
assert.doesNotThrow(()=>new vm.Script(regra));
const padroes=ler('scripts/biblioteca-padroes.js');
assert.doesNotThrow(()=>new vm.Script(padroes));
const avent=ler('scripts/adventure-ui.js');
assert.ok(!avent.includes("'Pistas ocultas'")&&!avent.includes("['Pistas ocultas'"));
assert.ok(avent.indexOf('renderNextCampaignSession(c,{canPlan:true')<avent.indexOf('adventure-content-tabs'));
assert.ok(ler('scripts/adventure-overview-ui.js').includes('adventure-panel-card'));
assert.equal(json('dados/regras-termos-complementares.json').itens.length,27);
assert.ok(json('dados/regras-casa-adicionais.json').itens.some(x=>x.original==='Ability Score Improvement (House Rule)'));
const todos=['dados/idiomas-core-standard.json','dados/idiomas-core-rare.json','dados/idiomas-eberron.json','dados/idiomas-outros.json'].flatMap(p=>json(p));
assert.equal(todos.length,40);
assert.equal(new Set(todos.map(x=>x.nome)).size,40);
const dados=Object.fromEntries(todos.map(x=>[x.nome,x]));
for(const nome of ['Giant','Goblin','Primordial','Terran'])assert.equal(dados[nome].alfabeto,'Rúnico anão.');
assert.match(dados.Gith.alfabeto,/Tir/);
assert.match(dados.Gnoll.alfabeto,/não se aplica/i);
assert.equal(dados['Deep Speech'].alfabeto,'Élfico.');
const comercio=ler('comercio-e-despesas.html');
assert.ok(comercio.includes('GRUPOS.splice(2)'));
assert.ok(comercio.includes('id="moedas"'));
for(const x of ['armas.html','equipamentos-aventura.html','ferramentas.html','maestrias-de-arma.html'])
 assert.ok(/new URLSearchParams\(location\.search\)\.get\(["\']item["\']\)/.test(ler(x)),x+' sem navegação direta por item');
console.log('Biblioteca: verificação de sintaxe, termos, cards e navegação direta OK.');
