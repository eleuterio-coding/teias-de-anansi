import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/especies-pdf-motm-2022.json');
const matrix=read('dados/auditoria-normativa-especies-motm-2022.json');
const sources=read('dados/fontes-normativas-criacao.json');
const catalogs=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const byName=new Map((data.items||[]).map(x=>[x.nome,x]));
const traitNames=name=>(byName.get(name)?.tracos||[]).map(x=>x.nome);

assert.equal(data.fonte?.id,'motm-2022');
assert.equal(matrix.autoridade,'oficial_legado');
assert.equal(matrix.publicadas_originalmente,33);
assert.equal(matrix.preservadas_no_hub,28);
assert.equal(matrix.substituidas_por_versao_atual,5);
assert.equal((data.items||[]).length,28,'MotM local deve preservar 28 das 33 espécies originais.');

const superseded=['Aasimar','Changeling','Goliath','Orc','Shifter'];
for(const name of superseded)assert.ok(!byName.has(name),`${name}: versão MotM substituída não pode permanecer no pacote legado local.`);
assert.deepEqual((matrix.substituicoes||[]).map(x=>x.nome).sort(),superseded.sort());

const mapping=(sources.mapeamentos||[]).find(x=>x.padrao==='dados/especies-pdf-motm-2022.json');
assert.equal(mapping?.autoridade,'oficial_legado','MotM deve permanecer oficial_legado.');
assert.match(catalogs,/preferCurrent\(\[\.\.\.cur,\.\.\.pdf,\.\.\.legacy\],x=>fold\(x\.name\)\)/,'loadSpecies deve preferir versões atuais por identidade.');
assert.match(catalogs,/legacyAbilityBonuses/,'Runtime deve separar aumentos de atributo legados em vez de aplicá-los como ASI atual.');

for(const{name,tracos}of matrix.amostras_semanticas||[]){
 assert.ok(byName.has(name),`Amostra MotM ausente: ${name}`);
 const actual=traitNames(name);
 for(const t of tracos){
  const folded=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'");
  assert.ok(actual.some(x=>folded(x)===folded(t)),`${name}: traço esperado ausente: ${t}; atuais: ${actual.join(', ')}`);
 }
}

for(const row of data.items||[])assert.ok(!Array.isArray(row.aumentos_atributo)||row.aumentos_atributo.length===0,`${row.nome}: pacote MotM saneado não deve injetar ASI racial em 5.5e.`);
assert.ok(!JSON.stringify(data).toLowerCase().includes('supabase'),'Espécies MotM não podem introduzir Supabase.');
console.log('MotM 2022 validado: 33 originais = 28 legados preservados + 5 identidades substituídas por versões 5.5e atuais.');
