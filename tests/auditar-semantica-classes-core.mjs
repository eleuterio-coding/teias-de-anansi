import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const actual=readJson('dados/classes-base-2024.json');
const normative=readJson('dados/auditoria-normativa-classes-core-2024.json');

assert.equal(normative.schema,'hub-rpg/auditoria-normativa-classes-core/v1');
assert.equal(normative.ruleset,'5.5e');
assert.equal(normative.revisao,2024);
assert.equal(normative.autoridade,'oficial_atual');
assert.equal(normative.status,'verificado');
assert.equal(normative.controle?.quantidade,12);
assert.equal(normative.controle?.verificadas,12);
assert.equal(normative.controle?.pendentes,0);
assert.equal(normative.controle?.divergencias_conhecidas,0);
assert.equal(actual.length,12,'O catálogo base deve conter exatamente as 12 classes core 2024.');

const names=options=>options.map(x=>x?.item?.name).filter(Boolean).map(x=>x.replace(/^Skill:\s*/,''));
const sorted=a=>[...a].sort((x,y)=>String(x).localeCompare(String(y),'en'));
const byIndex=new Map(actual.map(row=>[row.index,row]));
assert.equal(byIndex.size,12,'Classes core possuem index duplicado.');

for(const [id,expected] of Object.entries(normative.classes)){
  const row=byIndex.get(id);
  assert.ok(row,`${id}: classe ausente em classes-base-2024.json.`);
  assert.equal(row.hit_die,expected.hit_die,`${id}: dado de vida diverge da fonte oficial.`);
  assert.deepEqual(row.saving_throws.map(x=>x.name),expected.saving_throws,`${id}: proficiências em salvaguardas divergem da fonte oficial.`);
  assert.equal(row.proficiency_choices?.length,1,`${id}: estrutura de escolhas de perícia inesperada.`);
  const choice=row.proficiency_choices[0];
  assert.equal(choice.choose,expected.skill_choice_count,`${id}: quantidade de perícias escolhidas diverge da fonte oficial.`);
  assert.deepEqual(sorted(names(choice.from?.options||[])),sorted(expected.skill_options),`${id}: lista de perícias disponíveis diverge da fonte oficial.`);
  assert.deepEqual(sorted(row.proficiencies.map(x=>x.name)),sorted(expected.proficiencies),`${id}: proficiências de arma/armadura divergem da fonte oficial.`);
  const ability=row.spellcasting?.spellcasting_ability?.name??null;
  assert.equal(ability,expected.spellcasting_ability,`${id}: atributo de conjuração diverge da fonte oficial.`);
}

for(const row of actual)assert.ok(normative.classes[row.index],`${row.index}: classe presente no runtime sem linha normativa verificada.`);

console.log('Semântica das classes core validada: 12/12 classes, com dado de vida, salvaguardas, perícias, proficiências e atributo de conjuração confrontados com a fonte 2024.');
