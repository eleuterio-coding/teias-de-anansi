import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('dados/magias-catalogo.json'));
const names=JSON.parse(read('dados/localizacao-ptbr-magias-completo.json')).nomes;
const verified=JSON.parse(read('dados/magias-traducoes-srd-verificadas.json'));
const html=read('magias.html'),ce=read('scripts/concentracao-expandida-selos.js');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

assert.equal(catalog.itens.length,537,'Preservar os 537 registros originais.');
assert.equal(Object.keys(names).length,537,'Nomes PT e IDs originais devem existir para todos.');
assert.equal(new Set(catalog.itens.map(x=>x.id)).size,537,'IDs de magias não devem duplicar.');
for(const x of catalog.itens){
 assert.ok(x.nome_original&&names[x.nome_original],'Nome original e tradução ausentes: '+x.id);
}
assert.ok(source,'Código principal do grimório ausente.');
new vm.Script(source,{filename:'magias.html (inline)'});
new vm.Script(ce,{filename:'concentracao-expandida-selos.js'});
assert.ok(source.includes('norm(x.nome).includes(q)||norm(x.nome_original).includes(q)'),'A busca deve aceitar português e inglês.');
assert.ok(source.includes('<button type="button" class="item'),'Título de magia não pode ser link para verbete.');
assert.ok(!source.includes('<a class="item ${CURRENT'),'Lista não pode voltar a usar âncoras de verbetes.');
assert.ok(source.includes('spell-original-name'),'Nome original deve ficar disponível em cada card.');
assert.ok(source.includes('Consultar texto original'),'Texto original deve ficar em seção recolhível.');
assert.ok(source.includes('spellOriginalText(x)'),'Texto original deve usar dados do registro.');
assert.ok(source.includes('class="spell-class-link"'),'Classes devem ter links dedicados.');
assert.ok(source.includes('classes-v3.html?v=20261028-library-hub-layout1'),'Classes-base devem usar o verbete PT-BR.');
assert.ok(source.includes('classes.html#artifice'),'Artífice deve usar sua ficha publicada.');
assert.ok(ce.includes('regras.html#regra-expanded-concentration-house-rule'),'Regra da Casa Concentração Expandida precisa ter link.');
assert.ok(ce.includes('allowedTypesHTML(category)'),'Deve exibir os tipos de coexistência por nível.');
assert.ok(ce.includes('badge.textContent = `CE · ${record.limite_coexistencia_nome}`'),'Selo deve mostrar abreviação e nome.');
assert.ok(ce.includes('NC: \'Pendente de classificação\''),'Pendente não pode ser classificado automaticamente.');
assert.equal(verified.total,6,'Apenas traduções integrais verificadas por confronto textual.');
assert.equal(Object.keys(verified.descricoes).length,verified.total,'Contagem de traduções verificadas divergente.');
const byOriginal=new Map(catalog.itens.map(x=>[x.nome_original,x]));
for(const [name,translation] of Object.entries(verified.descricoes)){
 const x=byOriginal.get(name);
 assert.ok(x?.texto_integral_publicavel,'Não republicar tradução integral de fonte protegida: '+name);
 assert.ok(translation.trim().length>50,'Tradução integral suspeita: '+name);
}
assert.ok(source.includes('Síntese mecânica em português — não integral'),'Não confundir resumo com tradução integral.');
assert.ok(source.includes('Texto integral original não republicado'),'Não expor fonte comercial sem licença.');
console.log('OK: 537 magias, nomes bilíngues, classes, original recolhível, CE, 6 traduções verificadas e política de licença.');
