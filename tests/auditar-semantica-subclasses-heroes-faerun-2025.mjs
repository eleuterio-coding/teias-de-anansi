import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-heroes-faerun-2025.json');
const matrix=read('dados/auditoria-normativa-subclasses-heroes-faerun-2025.json');
const catalog=read('dados/subclasses-pdfs.json');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));
const feature=(sub,name)=>{
 const row=byName.get(sub);assert.ok(row,`Subclasse ausente: ${sub}`);
 const f=(row.progressao||[]).find(x=>x.nome===name);assert.ok(f,`Característica ausente: ${sub} / ${name}`);
 return String(f.descricao||'');
};
const has=(text,...needles)=>{const normalized=text.toLocaleLowerCase('pt-BR');for(const n of needles)assert.ok(normalized.includes(String(n).toLocaleLowerCase('pt-BR')),`Texto não contém requisito semântico: ${n}\n${text}`)};

assert.equal(data.fonte_id,'fr-heroes-2025');
assert.equal(matrix.autoridade,'oficial_atual');
assert.equal((data.subclasses||[]).length,8,'Heroes of Faerûn 2025 deve expor exatamente 8 subclasses.');
assert.equal(matrix.quantidade,8);

const expected={
 'College of the Moon':[3,6,14],
 'Knowledge Domain':[3,6,17],
 'Banneret':[3,7,10,15,18],
 'Oath of the Noble Genies':[3,7,15,20],
 'Winter Walker':[3,7,11,15],
 'Scion of the Three':[3,9,13,17],
 'Spellfire Sorcery':[3,6,14,18],
 'Bladesinger':[3,6,10,14]
};
assert.deepEqual([...byName.keys()].sort(),Object.keys(expected).sort(),'Identidades Heroes 2025 divergentes.');
for(const[name,levelsExpected]of Object.entries(expected)){
 const row=byName.get(name);
 const levels=[...new Set((row.progressao||[]).map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
 assert.deepEqual(levels,levelsExpected,`${name}: patamares divergentes.`);
 assert.ok(String(row.resumo||'').trim(),`${name}: resumo ausente.`);
 for(const f of row.progressao||[])assert.ok(String(f.nome||'').trim()&&String(f.descricao||'').trim(),`${name}: característica incompleta.`);
}

const catalogRows=(catalog.subclasses||[]).filter(x=>x.fonte_id==='fr-heroes-2025');
assert.equal(catalogRows.length,8,'Catálogo deve conter 8 subclasses Heroes 2025.');
for(const name of Object.keys(expected))assert.ok(catalogRows.some(x=>x.nome===name),`Catálogo Heroes sem ${name}.`);

has(feature('College of the Moon',"Moon's Inspiration"),'Inspired Eclipse','Invisible','teleportar','Lunar Vitality','cura');
has(feature('College of the Moon','Blessing of Moonlight'),'Moonbeam','Descanso Longo','cura');
has(feature('College of the Moon',"Eventide's Splendor"),'Inspired Eclipse','Reação','teleportar','Invisible');

has(feature('Knowledge Domain','Blessings of Knowledge'),"Artisan's Tools",'Expertise','Arcana','History','Nature','Religion');
has(feature('Knowledge Domain','Mind Magic'),'Channel Divinity','Divination','sem gastar spell slot');
has(feature('Knowledge Domain','Unfettered Mind'),'telepatia','Intelligence saving throws');
has(feature('Knowledge Domain','Divine Foreknowledge'),'Vantagem','D20 Tests','1 hora');

has(feature('Banneret','Knightly Envoy'),'Comprehend Languages','Ritual','idioma','perícia');
has(feature('Banneret','Group Recovery'),'Second Wind','30 pés','aliados','recupera');
has(feature('Banneret','Rallying Surge'),'Action Surge','Reação','ataque','mover');
has(feature('Banneret','Shared Resilience'),'Indomitable','salvaguarda','nível de Fighter');

has(feature('Oath of the Noble Genies','Elemental Smite'),'Divine Smite','Channel Divinity','Dao','Djinni','Efreeti','Marid');
has(feature('Oath of the Noble Genies',"Genie's Splendor"),'não usa armadura','Destreza','Carisma');
has(feature('Oath of the Noble Genies','Aura of Elemental Shielding'),'Aura of Protection','resistência','Acid','Cold','Fire','Lightning','Thunder');

has(feature('Winter Walker','Frigid Explorer'),'Cold','ignorar resistência','resistência a Cold');
has(feature('Winter Walker',"Hunter's Rime"),"Hunter's Mark",'PV temporários');
has(feature('Winter Walker','Fortifying Soul'),'recupera','Frightened');
has(feature('Winter Walker','Chilling Retribution'),'Reação','Stunned');
has(feature('Winter Walker','Frozen Haunt'),"Hunter's Mark",'imune a Cold','atravessar');

has(feature('Scion of the Three','Dread Allegiance'),'Bane','Bhaal','Myrkul','resistência');
has(feature('Scion of the Three','Bloodthirst'),'Bloodied','Reação','teleportar','ataque');
has(feature('Scion of the Three','Strike Fear'),'Cunning Strike','Frightened');
has(feature('Scion of the Three','Aura of Malevolence'),'Bloodthirst','dano','ignora resistência');

has(feature('Spellfire Sorcery','Spellfire Burst'),'Sorcery Point','1d4','Fire','Radiant','PV temporários');
has(feature('Spellfire Sorcery','Absorb Spells'),'Counterspell','falha','1d4 Sorcery Points');
has(feature('Spellfire Sorcery','Honed Spellfire'),'1d8','nível de Sorcerer','PV temporários');
assert.ok(!feature('Spellfire Sorcery','Honed Spellfire').includes('3d6'),'Honed Spellfire não pode regredir para 3d6.');
has(feature('Spellfire Sorcery','Crown of Spellfire'),'Innate Sorcery','voo','magia','dano');

has(feature('Bladesinger','Training in War and Song'),'treinamento marcial','Performance','Spellcasting Focus');
has(feature('Bladesinger','Bladesong'),'Ação Bônus','Inteligência','CA','Concentração','Acrobatics');
has(feature('Bladesinger','Extra Attack'),'duas vezes','cantrip');
has(feature('Bladesinger','Song of Defense'),'Reação','spell slot','5 × nível');
has(feature('Bladesinger','Song of Victory'),'magia','Ação','ataque','Ação Bônus');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('unearthed arcana'),'Dados finais Heroes não podem depender semanticamente de UA como fonte normativa.');
assert.ok(!all.includes('supabase'),'Semântica Heroes não pode introduzir Supabase.');
console.log('Semântica Heroes of Faerûn 2025 validada: 8 subclasses, progressões por classe e 32 invariantes de alto risco.');
