import fs from'node:fs';
import assert from'node:assert/strict';
const registry=JSON.parse(fs.readFileSync('dados/cenarios-normativos-v1.json','utf8'));
assert.equal(registry.politica,'fail-closed','Cenários normativos precisam permanecer fail-closed.');
assert.ok(Array.isArray(registry.cenarios)&&registry.cenarios.length,'Registro de cenários críticos vazio.');
const ids=new Set,covered=new Set;
for(const c of registry.cenarios){assert.ok(c.id&&!ids.has(c.id),`ID de cenário ausente/duplicado: ${c.id}`);ids.add(c.id);assert.ok(c.descricao,`${c.id}: descrição ausente.`);assert.ok(c.eixos?.length,`${c.id}: eixos normativos ausentes.`);assert.ok(c.testes?.length,`${c.id}: cenário crítico sem teste.`);for(const eixo of c.eixos)covered.add(eixo);for(const test of c.testes){assert.match(test,/^tests\/auditar-.*\.mjs$/,`${c.id}: teste fora do padrão de auditoria: ${test}`);assert.ok(fs.existsSync(test),`${c.id}: teste referenciado não existe: ${test}`)}}
for(const eixo of registry.eixos_obrigatorios)assert.ok(covered.has(eixo),`Eixo crítico sem cenário: ${eixo}.`);
console.log(`11F validado: ${registry.cenarios.length} cenários críticos cobrem ${covered.size}/${registry.eixos_obrigatorios.length} eixos e todos possuem testes executáveis rastreados.`);
