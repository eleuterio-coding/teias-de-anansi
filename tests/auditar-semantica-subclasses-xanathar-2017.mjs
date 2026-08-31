import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-xanathar-2017.json');
const matrix=read('dados/auditoria-normativa-subclasses-xanathar-2017.json');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));
const feature=(sub,name)=>{const s=byName.get(sub);assert.ok(s,`Subclasse ausente: ${sub}`);const f=(s.progressao||[]).find(x=>x.nome===name);assert.ok(f,`Característica ausente: ${sub}/${name}`);return String(f.descricao||'')};
const has=(text,...needles)=>{for(const n of needles)assert.ok(text.includes(n),`Texto não contém requisito semântico: ${n}\n${text}`)};

assert.equal(data.fonte_id,'xanathar-2017');
assert.equal((data.subclasses||[]).length,27,'Xanathar deve manter 27 subclasses legadas únicas.');
assert.equal(matrix.quantidade_legado_unico_retido,27);
for(const row of data.subclasses||[]){assert.ok(String(row.nome||'').trim(), 'Subclasse sem nome.');assert.ok(String(row.resumo||'').trim(),`${row.nome}: resumo ausente.`);assert.ok((row.progressao||[]).length,`${row.nome}: progressão vazia.`);for(const f of row.progressao||[]){assert.ok(Number(f.nivel)>0,`${row.nome}/${f.nome}: nível inválido.`);assert.ok(String(f.nome||'').trim(),`${row.nome}: característica sem nome.`);assert.ok(String(f.descricao||'').trim(),`${row.nome}/${f.nome}: descrição vazia.`)}}

const curving=feature('Arcane Archer','Curving Shot');
has(curving,'rolagem de ataque com uma flecha mágica','Ação Bônus','rerrolar essa rolagem de ataque','alvo diferente','60 pés');
assert.ok(!/fazer novo ataque/i.test(curving),'Curving Shot deve rerrolar a rolagem, não criar ataque genericamente novo.');

const rapid=feature('Samurai','Rapid Strike');
has(rapid,'ação Attack no seu turno','Vantagem','abrir mão da Vantagem','ataque com arma adicional','contra esse mesmo alvo','mesma ação');

const sharpen=feature('Way of the Kensei','Sharpen the Blade');
has(sharpen,'Ação Bônus','até 3 Ki','Kensei Weapon','igual ao Ki gasto','1 minuto','arma mágica que já possua bônus às rolagens de ataque e dano');
assert.ok(!/não incompatível/i.test(sharpen),'Sharpen the Blade precisa declarar a incompatibilidade normativa, não usar rótulo vago.');

const aura=feature('Oath of Conquest','Aura of Conquest');
has(aura,'não estiver Incapacitated','10 pés','Total Cover','Frightened de você','Speed 0','começar o turno nela','nível 18','30 pés');

const rebuke=feature('Oath of Conquest','Scornful Rebuke');
has(rebuke,'não estiver Incapacitated','acertar você com um ataque','modificador de Carisma','mínimo 1');

const counter=feature('Monster Slayer',"Slayer's Counter");
has(counter,"alvo de Slayer's Prey",'Reação','imediatamente antes de fazer a salvaguarda','ataque com arma','automaticamente bem-sucedida');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('supabase'),'Semântica Xanathar não pode introduzir Supabase.');
console.log('Semântica Xanathar 2017 validada: 27 legados estruturais e 6 características de alto risco confrontadas em detalhe.');
