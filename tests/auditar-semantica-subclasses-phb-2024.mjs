import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=read('dados/auditoria-normativa-subclasses-phb-2024.json');
const mech=read('dados/subclasses-mecanicas-phb-2024.json');
const catalog=read('dados/subclasses-pdfs.json');
const wizard=fs.readFileSync('scripts/character-builder/wizard-subclass-mechanics.js','utf8');
const sorcerer=fs.readFileSync('scripts/character-builder/sorcerer-subclass-mechanics.js','utf8');
const sourceId=x=>x?.fonte_id||x?.sourceId||x?.source?.id||'';
const sorted=a=>[...a].sort((x,y)=>String(x).localeCompare(String(y),'en'));

assert.equal(matrix.schema,'hub-rpg/auditoria-normativa-subclasses-phb-2024/v1');
assert.equal(matrix.fonte_id,'phb-2024');
assert.equal(matrix.ruleset,'5.5e');
assert.equal(matrix.revisao,2024);
assert.equal(matrix.politica,'fail-closed');
assert.equal(matrix.quantidade_esperada,48);
assert.equal(mech.fonte_id,'phb-2024');
assert.equal(mech.subclasses.length,48);

const expected=new Map();
for(const[klass,def]of Object.entries(matrix.classes||{})){
  assert.ok(Array.isArray(def.niveis)&&def.niveis.length>=3,`${klass}: progressão normativa ausente.`);
  assert.equal(def.subclasses?.length,4,`${klass}: PHB 2024 deve ter 4 subclasses.`);
  for(const name of def.subclasses){
    assert.ok(!expected.has(name),`Identidade duplicada na matriz: ${name}`);
    expected.set(name,{klass,levels:def.niveis.map(Number)});
  }
}
assert.equal(expected.size,48,'A matriz precisa enumerar exatamente 48 subclasses PHB 2024.');

// Catálogo é a camada que associa identidade, classe e proveniência.
const catalogRows=(catalog.subclasses||[]).filter(x=>sourceId(x)==='phb-2024');
assert.equal(catalogRows.length,48,'Catálogo precisa conter exatamente 48 subclasses PHB 2024.');
assert.deepEqual(sorted(catalogRows.map(x=>x.nome)),sorted(expected.keys()),'Catálogo e matriz divergem nas identidades PHB 2024.');
for(const row of catalogRows){
  const exp=expected.get(row.nome);
  assert.ok(exp,`Subclasse inesperada no catálogo PHB 2024: ${row.nome}`);
  assert.equal(row.classe,exp.klass,`${row.nome}: classe divergente no catálogo.`);
  assert.equal(row.ano,2024,`${row.nome}: ano divergente.`);
  assert.equal(row.natureza,'oficial',`${row.nome}: natureza precisa permanecer oficial.`);
  assert.equal(row.status,'vigente_mais_recente',`${row.nome}: versão PHB 2024 precisa permanecer vigente.`);
}

// Mecânicas são uma camada enxuta por identidade; classe não é duplicada nesse arquivo.
const mechanics=new Map();
for(const row of mech.subclasses||[]){
  assert.ok(String(row?.nome||'').trim(),`Registro mecânico sem identidade: ${JSON.stringify(row)}`);
  assert.ok(!mechanics.has(row.nome),`Mecânica duplicada: ${row.nome}`);
  mechanics.set(row.nome,row);
}
assert.equal(mechanics.size,48,'Mecânicas precisam conter exatamente 48 identidades PHB 2024.');
assert.deepEqual(sorted(mechanics.keys()),sorted(expected.keys()),'Mecânicas e matriz divergem nas identidades PHB 2024.');
for(const[name,exp]of expected){
  const row=mechanics.get(name);
  assert.ok(Array.isArray(row.progressao)&&row.progressao.length,`${name}: progressão mecânica vazia.`);
  const levels=[...new Set(row.progressao.map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
  assert.deepEqual(levels,[...exp.levels].sort((a,b)=>a-b),`${name}: níveis de recursos divergem da matriz 2024.`);
  for(const f of row.progressao){
    assert.ok(Number.isInteger(Number(f.nivel)),`${name}: recurso sem nível válido.`);
    assert.ok(String(f.nome||'').trim(),`${name}: recurso sem nome.`);
    assert.ok(String(f.descricao||'').trim(),`${name}/${f.nome}: recurso sem descrição.`);
  }
}

const feature=(sub,name)=>{
  const row=mechanics.get(sub);
  const hits=row.progressao.filter(x=>x.nome===name);
  assert.equal(hits.length,1,`${sub}: esperado exatamente 1 recurso ${name}.`);
  return hits[0];
};
const atLevel=(sub,level)=>mechanics.get(sub).progressao.filter(x=>Number(x.nivel)===level);

// Evoker — semântica confrontada com a revisão 2024.
assert.deepEqual(atLevel('Evoker',3).map(x=>x.nome),['Evocation Savant','Potent Cantrip']);
assert.equal(feature('Evoker','Potent Cantrip').nivel,3);
assert.equal(feature('Evoker','Sculpt Spells').nivel,6);
assert.ok(!mechanics.get('Evoker').progressao.some(x=>/Potent Cantrip\s*\/\s*Sculpt Spells/i.test(x.nome)),'Evoker não pode voltar a fundir recursos de níveis diferentes.');
assert.match(feature('Evoker','Potent Cantrip').descricao,/metade do dano/i);
assert.match(feature('Evoker','Sculpt Spells').descricao,/1 \+ o nível da magia/i);

// War Domain — semântica final 2024, sem importar regra de playtest.
const warSpells=feature('War Domain','War Domain Spells').descricao;
for(const spell of ['Guiding Bolt','Shield of Faith','Magic Weapon','Spiritual Weapon','Crusader’s Mantle','Spirit Guardians','Freedom of Movement','Fire Shield','Hold Monster','Steel Wind Strike'])
  assert.ok(warSpells.includes(spell),`War Domain Spells: magia ausente: ${spell}`);
assert.ok(!/Divine Favor/.test(warSpells),'War Domain 2024 não pode voltar a usar Divine Favor na lista do domínio.');
const warPriest=feature('War Domain','War Priest').descricao;
assert.match(warPriest,/Ação Bônus/);assert.match(warPriest,/Unarmed Strike/);assert.match(warPriest,/Sabedoria/);assert.match(warPriest,/Descanso Curto ou Longo/);
assert.ok(!/Weapon Mastery|Maestria de arma/i.test(warPriest),'War Priest final não pode herdar Weapon Mastery do playtest.');
const guided=feature('War Domain','Guided Strike').descricao;
assert.match(guided,/30 pés/);assert.match(guided,/Reação/);assert.match(guided,/Channel Divinity/);assert.match(guided,/\+10/);
const blessing=feature('War Domain',"War God's Blessing").descricao;
assert.match(blessing,/Shield of Faith/);assert.match(blessing,/Spiritual Weapon/);assert.match(blessing,/sem gastar slot/);assert.match(blessing,/sem exigir Concentração/);assert.match(blessing,/1 minuto/);
const avatar=feature('War Domain','Avatar of Battle').descricao;
for(const kind of['Bludgeoning','Piercing','Slashing'])assert.ok(avatar.includes(kind),`Avatar of Battle sem ${kind}.`);
assert.match(avatar,/sem a antiga limitação/i);

// Draconic Sorcery — semântica confrontada com a revisão 2024.
const wings=feature('Draconic Sorcery','Dragon Wings');
assert.equal(wings.nivel,14);assert.match(wings.descricao,/Ação Bônus/);assert.match(wings.descricao,/1 hora/);assert.match(wings.descricao,/60 pés/);assert.match(wings.descricao,/3 Sorcery Points/);
const companion=feature('Draconic Sorcery','Dragon Companion');
assert.equal(companion.nivel,18);assert.match(companion.descricao,/Summon Dragon/);assert.match(companion.descricao,/sem componente Material/);assert.match(companion.descricao,/sem gastar slot/);assert.match(companion.descricao,/Concentração/);assert.match(companion.descricao,/1 minuto/);
assert.ok(!mechanics.get('Draconic Sorcery').progressao.some(x=>/Presence/i.test(x.nome)),'Draconic Sorcery não pode restaurar o capstone legado Presence.');

// Runtime conhecido precisa continuar alinhado às correções semânticas.
assert.ok(wizard.includes('potentCantrip:level>=3'),'Runtime do Evoker precisa ativar Potent Cantrip no nível 3.');
assert.ok(wizard.includes('sculptSpells:level>=6'),'Runtime do Evoker precisa ativar Sculpt Spells no nível 6.');
assert.ok(sorcerer.includes("dragonWings:level>=14?{durationHours:1,flySpeed:60}"),'Runtime de Dragon Wings precisa manter 1 hora e Fly Speed 60.');
assert.ok(sorcerer.includes("dragonCompanion:level>=18?{spell:'Summon Dragon',materialComponent:false,freeOncePerLongRest:true,concentration:false,durationMinutes:1}"),'Runtime de Dragon Companion precisa permanecer alinhado à revisão 2024.');

const joined=[JSON.stringify(matrix),JSON.stringify(mech),JSON.stringify(catalog),wizard,sorcerer].join('\n').toLowerCase();
assert.ok(!joined.includes('supabase'),'Escopo normativo de subclasses não pode introduzir Supabase.');

console.log('Subclasses PHB 2024 validadas: 48 identidades/progressões fechadas; semântica detalhada de Evoker, War Domain e Draconic Sorcery alinhada à fonte e ao runtime conhecido.');
