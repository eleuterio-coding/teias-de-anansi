import fs from'node:fs';
import assert from'node:assert/strict';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const freeze=json('dados/congelamento-fontes-v1.json');
const registry=json(freeze.registro);
assert.equal(freeze.status,'congelado','O escopo normativo da v1 precisa estar explicitamente congelado.');
assert.match(freeze.politica_novos_conteudos||'',/versões futuras/i,'Conteúdo pós-congelamento deve ser direcionado a versões futuras.');
assert.equal(registry.politica,'fail-closed','O registro congelado precisa permanecer fail-closed.');
assert.equal(registry.mapeamentos.length,freeze.quantidade_mapeamentos,'O conjunto de fontes normativas mudou após o congelamento; trate a mudança como expansão futura ou reabra explicitamente o congelamento.');
const allowed=new Set(freeze.autoridades_permitidas);
for(const m of registry.mapeamentos){assert.ok(m.padrao&&m.autoridade&&m.fonte&&m.proveniencia,`Mapeamento incompleto: ${JSON.stringify(m)}`);assert.ok(allowed.has(m.autoridade),`${m.padrao}: autoridade fora do congelamento v1: ${m.autoridade}`)}
for(const key of freeze.criterios_zero)assert.equal(registry.criterio_fechamento?.[key],0,`Critério de fechamento ausente ou diferente de zero: ${key}.`);
console.log(`11G validado: ${registry.mapeamentos.length} mapeamentos de fontes congelados para a v1; novos conteúdos ficam fora do escopo encerrado.`);
