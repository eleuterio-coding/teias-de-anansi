import fs from'node:fs';
import assert from'node:assert/strict';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fontes=json('dados/fontes-normativas-criacao.json');
const hub=json('dados/regras-hub.json');
const adicionais=json('dados/regras-casa-adicionais.json');
const mappings=new Map(fontes.mapeamentos.map(x=>[x.padrao,x]));
for(const file of['dados/regras-hub.json','dados/regras-casa-adicionais.json','dados/politica-compatibilidade-5e-5.5e.json'])assert.equal(mappings.get(file)?.autoridade,'regra_casa',`${file} precisa estar explicitamente registrado como Regra da Casa.`);
assert.match(hub.precedencia||'',/Regras da Casa prevalecem/i,'A precedência de Regras da Casa precisa estar declarada explicitamente.');
assert.ok(Array.isArray(hub.sobreposicoes)&&hub.sobreposicoes.length,'Ao menos uma sobreposição explícita precisa permanecer registrada.');
for(const row of hub.sobreposicoes){assert.ok(row.original&&row.descricao,`Sobreposição sem origem/justificativa: ${JSON.stringify(row)}`)}
const itens=[...(hub.itens||[]),...(adicionais.itens||[])];
for(const item of itens){assert.equal(item.familia,'Regra da Casa',`${item.nome}: família normativa incorreta.`);assert.ok(item.nome&&item.descricao,`Regra da Casa sem nome/descrição.`);assert.ok(item.fonte?.livro,`${item.nome}: fonte da Regra da Casa ausente.`)}
const obrigatorias=['Espaços de Itens Mágicos','Concentração Expandida','Antecedentes: Regras Mecânicas','Progressão Universal de Talentos e Atributos','Distribuição de Atributos Base','Riqueza por Level'];
const nomes=new Set(itens.map(x=>x.nome));
for(const nome of obrigatorias)assert.ok(nomes.has(nome),`Override mecânico sem registro explícito: ${nome}.`);
console.log(`11D validado: ${itens.length} Regras da Casa registradas, ${hub.sobreposicoes.length} sobreposição(ões) explícita(s) e zero override obrigatório sem autoridade.`);
