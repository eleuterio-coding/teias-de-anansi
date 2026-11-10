import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const supplemental=json('dados/magias-catalogo.json');
const localized=json('dados/localizacao-ptbr-magias-completo.json');
const canonical=json('dados/catalogo-magias-20261104.json');
const page=read('magias.html');
const builder=read('scripts/character-builder/spells.js');
const sheet=read('scripts/character-sheet-unified-spells.js');
const registry=read('scripts/catalog-registry.js');
const rules=read('scripts/politica-regras-biblioteca.js');
const generator=read('scripts/gerar_referencias_hub.py');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();

// A origem antiga permanece rastreável e totalmente localizada, embora não seja
// o catálogo ativo de criação, ficha ou Biblioteca.
const legacyRows=supplemental.itens;
assert.equal(supplemental.controle?.validado,true,'Corpus suplementar deve permanecer validado.');
assert.equal(legacyRows.length,138,'Corpus histórico suplementar perdeu entradas.');
assert.equal(new Set(legacyRows.map(x=>x.id)).size,138,'IDs históricos repetidos.');
assert.equal(localized.total,510,'A localização original não pode perder títulos PT-BR.');
assert.equal(Object.keys(localized.nomes||{}).length,510,'Cada título histórico precisa de tradução.');
assert.equal(new Set(Object.values(localized.nomes)).size,510,'Localizações duplicadas geram verbetes ambíguos.');
for(const row of legacyRows)assert.ok(localized.nomes[row.nome_original]?.trim(),`Tradução ausente: ${row.nome_original}`);
for(const original of ['Fireball','Magic Missile','Cure Wounds'])
 assert.notEqual(localized.nomes[original],original,`Nome básico não traduzido: ${original}`);

// Fonte única vigente: 581 magias localizadas, preservadas em criação e ficha.
const rows=canonical.itens;
assert.equal(canonical.total,581,'Total do catálogo ativo mudou.');
assert.equal(rows.length,581,'Catálogo canônico perdeu magias.');
assert.equal(new Set(rows.map(x=>x.id)).size,581,'IDs canônicos repetidos.');
assert.ok(rows.every(x=>x.id?.startsWith('catalogo20261104:')&&x.nome&&x.descricao&&x.livro&&x.classes&&x.componentes),
 'Há magias sem ID, texto, classe ou proveniência no catálogo canônico.');
assert.equal(new Set(rows.map(x=>norm(x.nome))).size,581,'Nomes PT-BR canônicos ambíguos.');
assert.ok(rows.every(x=>['Sim','Não'].includes(x.concentracao)&&['Sim','Não'].includes(x.ritual)),
 'Concentração ou ritual não possuem classificação explícita.');
const countBook=b=>rows.filter(x=>x.livro===b).length;
assert.equal(countBook('Livro do Jogador · 2024'),391,'Magias 2024 ausentes.');
assert.equal(countBook("Xanathar's Guide to Everything"),79,'Legado único de Xanathar perdido.');
assert.equal(countBook("Tasha's Cauldron of Everything"),11,'Legado único de Tasha perdido.');

// Testes de consumo reais, no lugar de marcadores de um layout anterior.
assert.ok(registry.includes("p==='dados/catalogo-magias-20261104.json'"),
 'Registro canônico não aponta para o corpus ativo.');
assert.ok(builder.includes("json(SPELL_CANONICAL_FILE+'?v=20261104')")
       && builder.includes("catalog.itens.length!==581")
       && builder.includes('originalName:x.nome'),
 'Criador deve usar 581 magias e preservar identidade estável.');
assert.ok(sheet.includes("json('dados/catalogo-magias-20261104.json?v=20261104')")
       && sheet.includes("d.itens.length!==581")
       && sheet.includes('originalName:x.nome'),
 'Ficha deve compartilhar o catálogo e as identidades do criador.');
assert.ok(page.includes("fetch('dados/catalogo-magias-20261104.json?v=20261104'")
       && page.includes('data.itens?.length!==581'),
 'Biblioteca deve carregar as mesmas 581 magias, sem fallback silencioso.');
assert.ok(page.includes("params.searchParams.set('magia',m.id)")
       && page.includes("args.get('magia')||args.get('ref')")
       && page.includes('magias.find(x=>x.id===ref)'),
 'Links internos precisam gravar IDs estáveis e aceitar os formatos ?magia e ?ref.');

// Sem vazamento de campos editoriais e sem aviso extrínseco no grimório.
for(const token of ['<b>PDF:</b>','<b>Revisão core:</b>','<b>Completude:</b>','<span class="badge">versão mais recente</span>','<span class="badge">${esc(x.ruleset)}</span>'])
 assert.ok(!page.includes(token),`Campo ou selo editorial indevido: ${token}`);
assert.ok(rules.includes("if(page==='magias.html')return"),
 'Política de biblioteca deve permanecer interna às magias.');
assert.ok(generator.includes('localizacao-ptbr-magias-completo.json')
       && generator.includes('orig = identity'),
 'Índice semântico precisa preservar a tradução e a identidade original.');

console.log('Magias: 581 entradas canônicas + 138 fontes suplementares rastreadas + 510 traduções PT-BR; IDs e links estáveis — OK');
