import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const files=['phb-2024','forge-2025','quickstone-2024','heroes-faerun-2025','tasha-2020','xanathar-2017','larsene-ledger-2024'];
const records=files.flatMap(id=>json('dados/subclasses-mecanicas-'+id+'.json').subclasses);
const titles=json('dados/localizacao-ptbr-subclasses.json');
const features=json('dados/localizacao-ptbr-caracteristicas-subclasses.json').nomes;
const glossary=json('dados/localizacao-ptbr-termos-mecanicos.json').termos;
const spells=json('dados/localizacao-ptbr-magias-completo.json').nomes;
const src=read('scripts/subclasses-biblioteca-ui.js');
const fragment=src.slice(src.indexOf('const TERMOS='),src.indexOf('async function configurar()'));
const box={};
vm.runInNewContext(fragment+'this.audit={localizar,TERMOS};',box,{timeout:3000});
const {localizar,TERMOS}=box.audit;
const dictionary={...titles.termos,...TERMOS,...glossary,...features,...spells};
const texts=records.flatMap(s=>[{sub:s.nome,part:'Resumo',text:s.resumo},
  ...(s.progressao||[]).map(p=>({sub:s.nome,part:p.nome,text:p.descricao}))]);
assert.equal(records.length,119,'Amostra deve conter 119 subclasses.');
assert.equal(texts.length,747,'Amostra deve abranger todos os 119 resumos e 628 textos de características.');
assert.equal(Object.keys(features).length,591,'Devem existir 591 nomes distintos de características em PT-BR.');
assert.ok(records.every(s=>titles.nomes[s.nome]&&s.resumo?.trim()&&s.progressao.every(p=>features[p.nome]&&p.descricao?.trim())));
const leftovers=/\b(?:saving throws?|attack rolls?|ability checks?|spell slots?|spellbook|spellcasting|cantrips?|Rage|weapon|weapons|damage|creature|swarms?|companion|proficiency|check|checks|save|saves|Action|Reaction|Force|Fire|Cold|Charisma|Wisdom|Intelligence|Strength|Dexterity|Constitution|PB|DC)\b/i;
const problems=[];
for(const r of texts){
  const result=localizar(r.text,dictionary);
  if(leftovers.test(result))problems.push({sub:r.sub,part:r.part,original:r.text,traduzido:result});
}
assert.deepEqual(problems.map(p=>p.sub+'/'+p.part),[],'Restos de termos técnicos ingleses: '+JSON.stringify(problems.slice(0,12)));
const samples={
  'Força checks':'testes de Força',
  'Constituição saves':'testes de resistência de Constituição',
  'Reckless Attack':'Ataque Imprudente',
  'Magic Action':'Ação de Magia',
  'Fireball':'Bola de Fogo',
  'Action Surge':'Surto de Ação',
  'Sorcery Points':'Pontos de Feitiçaria'
};
for(const [source,target] of Object.entries(samples)){
  assert.equal(localizar(source,dictionary),target,'Tradução contextual incorreta: '+source);
}
console.log('Auditoria linguística: 119 subclasses, 119 resumos, 628 descrições e 591 características; sem resíduo do glossário crítico.');
