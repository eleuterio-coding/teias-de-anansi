import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=read('dados/auditoria-normativa-especies-phb-2024.json');
const aasimarPkg=read('dados/especies-pdf-phb-2024.json');
const tiefling=read('dados/tiefling-variantes.json');
const state=fs.readFileSync('scripts/character-builder/state.js','utf8');
const registry=fs.readFileSync('scripts/catalog-registry.js','utf8');
const catalogs=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const has=(text,...needles)=>{const normalized=String(text||'').toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito: ${n}\n${text}`)};

assert.equal(matrix.autoridade,'oficial_atual');
assert.equal(matrix.quantidade_core,10);
assert.deepEqual(matrix.identidades,["Aasimar","Dragonborn","Dwarf","Elf","Gnome","Goliath","Halfling","Human","Orc","Tiefling"]);
assert.equal(matrix.composicao_runtime.srd_5_2_1,9);
assert.equal(matrix.composicao_runtime.arquivo_local_aasimar,1);

assert.ok(registry.includes(`FIVE_E_BITS_PIN='${matrix.srd_pin}'`),'Registro canônico deve manter o SHA SRD auditado.');
assert.match(registry,/FIVE_E_BITS_2024=`https:\/\/raw\.githubusercontent\.com\/5e-bits\/5e-database\/\$\{FIVE_E_BITS_PIN\}\/src\/2024\/en`/,'Fonte 2024 deve permanecer pinada ao commit auditado.');
assert.match(state,/PIN=FIVE_E_BITS_PIN/,'state.js deve derivar o PIN do registro canônico, sem duplicar autoridade.');
assert.match(state,/RAW24=FIVE_E_BITS_2024/,'state.js deve derivar a fonte 2024 do registro canônico.');
assert.match(catalogs,/5e-SRD-Species\.json/,'loadSpecies deve carregar as espécies SRD 5.2.1.');
assert.match(catalogs,/especies-pdf-phb-2024\.json|SPFILES/,'Runtime deve carregar o complemento PHB local via SPFILES.');
assert.match(catalogs,/abilityBonuses:\[\]/,'Espécies atuais não podem aplicar aumentos de atributo raciais.');

assert.equal(aasimarPkg.fonte?.id,'phb-2024');
assert.equal((aasimarPkg.items||[]).length,1,'Complemento PHB local deve conter apenas o Aasimar ausente do SRD pinado.');
const aasimar=aasimarPkg.items[0];
assert.equal(aasimar.nome,'Aasimar');
assert.deepEqual(aasimar.tamanhos,['Medium','Small']);
assert.equal(aasimar.velocidade,30);
const trait=n=>(aasimar.tracos||[]).find(x=>x.nome===n)?.texto||'';
has(trait('Celestial Resistance'),'Necrótico','Radiante');
has(trait('Healing Hands'),'d4','Bônus de Proficiência','Descanso Longo');
has(trait('Celestial Revelation'),'nível 3','Ação Bônus','1 minuto','Bônus de Proficiência','Heavenly Wings','Inner Radiance','Necrotic Shroud');
has(trait('Celestial Revelation'),'fim de cada turno','10 pés','Radiante');

const current=(tiefling.mecanicas||[]).filter(x=>x.ruleset==='5.5e'&&x.revisao_core===2024);
assert.deepEqual(current.map(x=>x.id).sort(),['abyssal-2024','chthonic-2024','infernal-2024']);
for(const row of current){
 assert.ok(String(row.resistencia||'').trim(),`${row.id}: resistência ausente.`);
 has(row.nivel3,'Descanso Longo');
 has(row.nivel5,'Descanso Longo');
 has(row.atributo_conjuracao,'Inteligência','Sabedoria','Carisma');
}
has(current.find(x=>x.id==='chthonic-2024')?.nivel3,'False Life');
has(current.find(x=>x.id==='chthonic-2024')?.nivel5,'Ray of Enfeeblement');

const all=JSON.stringify({aasimarPkg,tiefling}).toLowerCase();
assert.ok(!all.includes('supabase'),'Espécies PHB não podem introduzir Supabase.');
console.log('Espécies PHB 2024 validadas: 10 identidades core (9 SRD pinadas + Aasimar local), atributos desacoplados e invariantes Aasimar/Tiefling.');
