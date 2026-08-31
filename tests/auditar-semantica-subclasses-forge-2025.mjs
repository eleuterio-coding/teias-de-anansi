import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-forge-2025.json');
const matrix=read('dados/auditoria-normativa-subclasses-forge-2025.json');
const catalog=read('dados/subclasses-pdfs.json');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));
const feature=(sub,name)=>{
 const row=byName.get(sub);assert.ok(row,`Subclasse ausente: ${sub}`);
 const f=(row.progressao||[]).find(x=>x.nome===name);assert.ok(f,`Característica ausente: ${sub} / ${name}`);
 return String(f.descricao||'');
};
const has=(text,...needles)=>{const normalized=text.toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito semântico: ${n}\n${text}`)};

assert.equal(data.fonte_id,'eberron-forge-2025');
assert.equal(matrix.autoridade,'oficial_atual');
assert.equal((data.subclasses||[]).length,5,'Forge 2025 deve expor exatamente 5 subclasses de Artificer.');
assert.equal(matrix.quantidade,5);

const expected=['Alchemist','Armorer','Artillerist','Battle Smith','Cartographer'];
assert.deepEqual([...byName.keys()].sort(),[...expected].sort(),'Identidades Forge 2025 divergentes.');
for(const name of expected){
 const row=byName.get(name);
 const levels=[...new Set((row.progressao||[]).map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
 assert.deepEqual(levels,[3,5,9,15],`${name}: patamares de subclasse devem ser 3/5/9/15.`);
 assert.ok(String(row.resumo||'').trim(),`${name}: resumo ausente.`);
 for(const f of row.progressao||[]){assert.ok(String(f.nome||'').trim()&&String(f.descricao||'').trim(),`${name}: característica incompleta.`)}
}

const catalogForge=(catalog.subclasses||[]).filter(x=>x.fonte_id==='eberron-forge-2025');
assert.equal(catalogForge.length,5,'Catálogo deve conter 5 subclasses Forge 2025.');
for(const name of expected)assert.ok(catalogForge.some(x=>x.nome===name),`Catálogo Forge sem ${name}.`);

has(feature('Alchemist','Tools of the Trade'),"Alchemist's Supplies",'Herbalism Kit','reduzido pela metade');
has(feature('Alchemist','Experimental Elixir'),'Descanso Longo','aleatoriamente','Ação Bônus','spell slot','escolhendo o efeito');

has(feature('Armorer','Tools of the Trade'),'Heavy Armor Training',"Smith's Tools",'reduzido pela metade');
has(feature('Armorer','Arcane Armor'),'ignora requisitos de Força','vestida ou removida rapidamente','foco de conjuração');

has(feature('Artillerist','Tools of the Trade'),'Martial Ranged Weapons',"Woodcarver's Tools",'Wands','reduzido pela metade');
has(feature('Artillerist','Arcane Firearm'),'Rod','Staff','Wand','Martial Ranged Weapon','1d8');

has(feature('Battle Smith','Tools of the Trade'),'Martial Weapons',"Smith's Tools",'reduzido pela metade');
has(feature('Battle Smith','Battle Ready'),'arma mágica','Inteligência','foco de conjuração');
has(feature('Battle Smith','Steel Defender'),'atua no seu turno','Ação Bônus','Deflect Attack','Desvantagem');
has(feature('Battle Smith','Extra Attack'),'ação Attack','ataque adicional','Steel Defender');

has(feature('Cartographer','Tools of the Trade'),"Calligrapher's Supplies","Cartographer's Tools",'Spell Scrolls','reduzido pela metade');
has(feature('Cartographer',"Adventurer's Atlas"),'Descanso Longo','1d4','Iniciativa','posição','linha de visão');
has(feature('Cartographer','Mapping Magic'),'Faerie Fire','Descanso Longo','metade do Speed','teleportar','30 pés');
has(feature('Cartographer','Guided Precision'),'uma vez por turno','Inteligência','dano','Concentração','Faerie Fire');
has(feature('Cartographer','Ingenious Movement'),'Flash of Genius','30 pés','teleportar','Reação');
has(feature('Cartographer','Superior Atlas'),'Safe Haven','Find the Path','Descanso Longo');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('supabase'),'Semântica Forge não pode introduzir Supabase.');
console.log('Semântica Forge 2025 validada: 5 subclasses, níveis 3/5/9/15 e 16 invariantes de alto risco.');
