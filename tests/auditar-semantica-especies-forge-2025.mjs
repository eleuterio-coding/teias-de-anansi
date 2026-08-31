import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/especies-pdf-forge-2025.json');
const matrix=read('dados/auditoria-normativa-especies-forge-2025.json');
const catalogs=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const byName=new Map((data.items||[]).map(x=>[x.nome,x]));
const trait=(species,name)=>{
 const row=byName.get(species);assert.ok(row,`Espécie ausente: ${species}`);
 const t=(row.tracos||[]).find(x=>x.nome===name);assert.ok(t,`Traço ausente: ${species} / ${name}`);
 return String(t.texto||'');
};
const has=(text,...needles)=>{const normalized=String(text||'').toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito: ${n}\n${text}`)};

assert.equal(data.fonte?.id,'eberron-forge-2025');
assert.equal(data.fonte?.ruleset,'5.5e');
assert.equal(matrix.autoridade,'oficial_atual');
assert.equal((data.items||[]).length,5,'Forge 2025 deve conter exatamente cinco espécies.');
assert.deepEqual([...byName.keys()].sort(),['Changeling','Kalashtar','Khoravar','Shifter','Warforged'].sort());

assert.equal(byName.get('Changeling')?.tipo,'Fey');
has(trait('Changeling','Changeling Instincts'),'Deception','Insight','Intimidation','Performance','Persuasion');
has(trait('Changeling','Shape-Shifter'),'ação','aparência','voz','Medium','Small','Vantagem','Carisma');

assert.equal(byName.get('Kalashtar')?.tipo,'Aberration');
has(trait('Kalashtar','Dual Mind'),'Sabedoria','Carisma');
has(trait('Kalashtar','Mental Discipline'),'Psíquico');
has(trait('Kalashtar','Mind Link'),'10 vezes o nível','telepatia','1 hora');
has(trait('Kalashtar','Severed from Dreams'),'Dream','Descanso Longo','proficiência');

has(trait('Khoravar','Darkvision'),'60 pés');
has(trait('Khoravar','Fey Ancestry'),'Charmed');
has(trait('Khoravar','Fey Gift'),'Friends','Descanso Longo','Cleric','Druid','Wizard');
has(trait('Khoravar','Lethargy Resilience'),'Unconscious','1d4 Descansos Longos');
has(trait('Khoravar','Skill Versatility'),'perícia','ferramenta','Descanso Longo');

has(trait('Shifter','Bestial Instincts'),'Acrobatics','Athletics','Intimidation','Survival');
has(trait('Shifter','Darkvision'),'60 pés');
has(trait('Shifter','Shifting'),'Ação Bônus','1 minuto','Bônus de Proficiência','Beasthide','Longtooth','Swiftstride','Wildhunt');

assert.equal(byName.get('Warforged')?.tipo,'Construct');
has(trait('Warforged','Construct Resilience'),'Poison','Poisoned');
has(trait('Warforged','Integrated Protection'),'+1','Classe de Armadura');
has(trait('Warforged',"Sentry's Rest"),'6 horas','consciente');
has(trait('Warforged','Specialized Design'),'perícia','ferramenta');
has(trait('Warforged','Tireless'),'Exhaustion','desidratação','desnutrição','sufocamento');

assert.match(catalogs,/abilityBonuses:current\?arr\(r\.aumentos_atributo\):\[\]/,'Pacotes de espécie atuais devem respeitar dados de atributo somente quando explicitamente presentes.');
for(const row of data.items||[])assert.ok(!Array.isArray(row.aumentos_atributo)||row.aumentos_atributo.length===0,`${row.nome}: Forge 2025 não deve introduzir ASI racial.`);
assert.ok(!JSON.stringify(data).toLowerCase().includes('supabase'),'Espécies Forge não podem introduzir Supabase.');
console.log('Espécies Forge 2025 validadas: 5 identidades e invariantes de Changeling, Kalashtar, Khoravar, Shifter e Warforged.');
