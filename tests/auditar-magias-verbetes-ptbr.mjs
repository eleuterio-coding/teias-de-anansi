import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('dados/magias-catalogo.json'));
const names=JSON.parse(read('dados/localizacao-ptbr-magias-completo.json')).nomes;
const verified=JSON.parse(read('dados/magias-traducoes-srd-verificadas.json'));
const revised=JSON.parse(read('dados/magias-ptbr-srd-2024-revisado.json'));
const lot2=JSON.parse(read('dados/magias-ptbr-srd-2024-revisado-lote2.json'));
const lot3=JSON.parse(read('dados/magias-ptbr-srd-2024-revisado-lote3.json'));
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
assert.ok(source.includes('const origName=x.nome_original?'),'Nome inglês deve aparecer diretamente sob o nome português.');
assert.ok(!source.includes('Nome original:'),'O dropdown original não deve conter cabeçalho de nome.');
assert.ok(source.includes("return[x.descricao||'',x.niveis_superiores||'']"),'Texto inglês deve conter apenas o texto-fonte aberto.');
assert.ok(source.includes('<summary>Texto original — ${esc(x.nome_original||x.nome)}</summary>'),'O dropdown precisa exibir o nome inglês original.');
assert.ok(!source.includes('<summary>Texto original <small>EN</small>'),'O título do menu não deve ter sufixos.');
const spellList=source.split('\n').find(line=>line.includes("document.getElementById('lista').innerHTML=rows.map"));
assert.ok(spellList?.includes('cleanSpellSchool(x.escola)'),'A lista deve mostrar a escola sem ponto e vírgula extra.');
assert.ok(source.includes("replace(/\\s*;+\\s*$/,'')"),'Pontuação de escola deve ser normalizada.');
assert.ok(!spellList?.includes('sourceTitle(x.fonte)'),'A origem não deve aparecer na lista lateral.');
assert.ok(source.includes('class="spell-source"'),'A origem deve permanecer na ficha completa da magia.');
assert.ok(source.includes('spellOriginalText(x)'),'Texto original deve usar dados do registro.');
assert.ok(source.includes('class="spell-class-link"'),'Classes devem ter links dedicados.');
assert.ok(source.includes('classes-v3.html?v=20261028-library-hub-layout1'),'Classes-base devem usar o verbete PT-BR.');
assert.ok(source.includes('classes.html#artifice'),'Artífice deve usar sua ficha publicada.');
assert.ok(ce.includes('regras.html#regra-expanded-concentration-house-rule'),'Regra da Casa Concentração Expandida precisa ter link.');
assert.ok(!ce.includes('allowedTypesHTML(category)'),'Card CE deve exibir somente a categoria.');
assert.ok(ce.includes('badge.textContent = `CE · ${record.limite_coexistencia_nome}`'),'Selo deve mostrar abreviação e nome.');
assert.ok(ce.includes('NC: \'Pendente de classificação\''),'Pendente não pode ser classificado automaticamente.');
assert.equal(verified.total,6,'Manter as seis traduções já verificadas.');
assert.equal(revised.total,17,'A revisão integral 2024 deve conter 17 traduções editoriais.');
assert.equal(Object.keys(revised.descricoes).length,17,'Total de traduções 2024 divergente.');
assert.equal(lot2.total,45,'Segundo lote deve ter 45 traduções novas.');
assert.equal(lot3.total,44,'Terceiro lote deve ter 44 traduções novas.');
const mergedNames=new Set([...Object.keys(verified.descricoes),...Object.keys(revised.descricoes),...Object.keys(lot2.descricoes),...Object.keys(lot3.descricoes)]);
assert.equal(mergedNames.size,111,'Total de traduções completas em PT-BR divergente.');
assert.ok(source.includes('magias-ptbr-srd-2024-revisado-lote2.json'),'Carregamento do segundo lote ausente.');
assert.ok(source.includes('magias-ptbr-srd-2024-revisado-lote3.json'),'Carregamento do terceiro lote ausente.');
assert.equal(Object.keys(verified.descricoes).length,verified.total,'Contagem de traduções verificadas divergente.');
const byOriginal=new Map(catalog.itens.map(x=>[x.nome_original,x]));
for(const [name,translation] of [...Object.entries(verified.descricoes),...Object.entries(revised.descricoes),...Object.entries(lot2.descricoes),...Object.entries(lot3.descricoes)]){
 const x=byOriginal.get(name);
 assert.ok(x?.texto_integral_publicavel,'Não republicar tradução integral de fonte protegida: '+name);
 assert.ok((typeof translation==='string'?translation:translation.descricao).trim().length>30,'Tradução integral suspeita: '+name);
}
assert.ok(source.includes('Dados mecânicos disponíveis — descrição integral pendente'),'Não confundir dados mecânicos com tradução integral.');
assert.ok(source.includes("if(x.descricao_tipo!=='texto_aberto_srd_5_2_1'||!x.texto_integral_publicavel)return ''"),'Não expor textos comerciais não licenciados.');
assert.ok(source.includes('spellRulesHTML(x.duracao)'),'Campo Duração precisa vincular regras por termo.');
assert.ok(source.includes('regras.html?original='),'Links devem abrir o termo original na Biblioteca de Regras.');

const rulesSection = source.slice(source.indexOf('const SPELL_RULE_LABELS='), source.indexOf('function spellEffectInPortuguese('));
const helpers = source.slice(source.indexOf('const esc='), source.indexOf('let DATA='));
const renderRules = new Function(helpers + '\n' + rulesSection + '\nreturn spellRulesHTML;')();
for (const word of ['Adivinhação','Conjuração','Evocação','Abjuração','Transmutação','Preparação','Classificação','Informação','Manifestação']) {
  assert.ok(!renderRules(word).includes('spell-rule-link'), 'Não criar link parcial dentro de ' + word);
}
assert.match(renderRules('Usar uma Ação.'), /spell-rule-link/, 'Ação isolada continua sendo termo de regra.');
assert.match(renderRules('Requer Concentração.'), /spell-rule-link/, 'Concentração isolada continua sendo termo de regra.');

const glossary=read('scripts/regras-srd-view-v7.js');
assert.ok(glossary.includes("get('original')"),'Regras deve reconhecer deep links com nome canônico.');
assert.ok(glossary.includes('data-hub-original'), 'Regras deve preservar IDs originais.');
console.log('OK: 537 magias, 111 textos PT-BR integrais, 339 originais ingleses SRD, escola sem link e dropdown com título inglês.');
