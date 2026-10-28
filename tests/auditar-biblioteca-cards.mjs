import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const html=read('bibliotecas.html');
const js=read('scripts/library-catalog-status.js');
const styles=read('biblioteca-light.css');
const generator=read('scripts/gerar_biblioteca_contagens.py');
const deploy=read('.github/workflows/deploy-pages.yml');

assert.equal((html.match(/<li><a href=/g)||[]).length,18,'A Biblioteca precisa manter 18 módulos.');
assert.equal((html.match(/class="contagem"/g)||[]).length,18,'Cada card precisa ter uma área de contagem.');
assert.ok(html.includes('scripts/library-catalog-status.js?v=20261028-library-compact-cards1'),'O script de contagem precisa ter cache atualizado.');
assert.ok(!/\bPublicado\b|catalog-badge|catalog-badges/.test(html),'HTML dos cards não pode ter status ou selos.');
assert.ok(js.includes("fetch('dados/biblioteca-contagens.json?v=20261028-compact1')"),'Os cards devem usar o arquivo leve de contagens.');
assert.ok(js.includes('count.toLocaleString(\'pt-BR\')'),'Contagens devem ter formatação em pt-BR.');
assert.ok(js.includes('countPublished(semanticIndex)'),'O índice semântico deve ser fallback após busca.');
assert.ok(!/stageLabel|consumerBadges|catalog-badge/.test(js),'JS dos cards não pode gerar selos ou Publicado.');
assert.ok(!js.includes(' · ${esc(x.status)}'),'Resultados de busca não devem exibir status como Publicado.');
assert.ok(styles.includes('min-height: 86px !important;'),'Cards devem permanecer compactos no desktop.');
assert.ok(styles.includes('min-height: 78px !important;'),'Cards devem permanecer compactos no celular.');
assert.ok(styles.includes('.modulos .nome::before'),'Marcador ordinal deve ser suprimido.');
assert.ok(!styles.includes(' .catalog-badges')&&!styles.includes(' .catalog-badge {'),'Cards não devem manter CSS de badges.');
assert.ok(generator.includes('entry.get("status") == "publicado"'),'Contagem não deve incluir referências pendentes.');
assert.ok(generator.includes('counts["Magias"] = len(valid_ids)'),'Magias deve contar o catálogo unificado exato.');
assert.ok(deploy.includes('python scripts/gerar_biblioteca_contagens.py'),'Deploy deve gerar resumo das contagens.');
console.log('Biblioteca: 18 cards compactos, sem selos/status, com contagens de registros publicáveis — OK');
