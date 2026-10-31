import fs from 'node:fs';
import assert from 'node:assert/strict';

// Regressão: contagem do card, fonte do Espião e nomenclatura da regra.
const read = path => fs.readFileSync(path, 'utf8');
const files = [
  'dados/antecedentes-srd-5.2.1.json',
  'dados/antecedentes-abertos-adicionais.json',
  'dados/antecedentes-pdf-phb-2024.json',
  'dados/antecedentes-pdf-forge-2025.json',
  'dados/antecedentes-pdf-quickstone-2024.json',
  'dados/antecedentes-pdf-heroes-2025.json'
];
const total = files.reduce((sum, path) => sum + JSON.parse(read(path)).items.length, 0);
const cardCount = JSON.parse(read('dados/biblioteca-contagens.json')).modulos.Antecedentes;
assert.equal(total, 43, 'O catálogo deve manter 43 antecedentes sem duplicatas.');
assert.equal(cardCount, total, 'O card deve refletir os registros do catálogo ativo.');
const spy = JSON.parse(read('dados/antecedentes-abertos-adicionais.json')).items.find(x => x.slug === 'espiao');
assert.ok(spy, 'O Espião deve estar cadastrado.');
assert.equal(spy.fonte.titulo, 'Player’s Handbook');
assert.equal(spy.classificacao.subtipo, 'variante', 'A natureza de variante deve ser preservada no catálogo.');
const view = read('dados/_module-source/antecedentes.html');
assert.ok(view.includes('Aumento de Atributos (Regra da Casa)'));
assert.ok(!view.includes('Aumento de Atributos (Regras da Casa)'));
assert.ok(view.includes("x.slug!=='espiao'"), 'A variante Espião deve exibir somente o nome do livro no topo.');
assert.ok(view.includes('const fonte=rotuloFonte(x)'), 'Topo e rodapé devem compartilhar a mesma fonte.');
console.log('Antecedentes: 43 itens, fonte do Espião e Regra da Casa — OK');
