import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('dados/subclasses-mecanicas-tasha-2020.json');
const matrix=read('dados/auditoria-normativa-subclasses-tasha-2020.json');
const byName=new Map((data.subclasses||[]).map(x=>[x.nome,x]));
const feature=(sub,name)=>{
 const row=byName.get(sub);assert.ok(row,`Subclasse ausente: ${sub}`);
 const f=(row.progressao||[]).find(x=>x.nome===name);assert.ok(f,`Característica ausente: ${sub} / ${name}`);
 return String(f.descricao||'');
};
const has=(text,...needles)=>{for(const n of needles)assert.ok(text.includes(n),`Texto não contém requisito semântico: ${n}\n${text}`)};

assert.equal(data.fonte_id,'tasha-2020');
assert.equal((data.subclasses||[]).length,18,'Tasha deve manter somente os 18 legados únicos após precedência 2024.');
assert.equal(matrix.quantidade_legado_unico_retido,18);

for(const row of data.subclasses||[]){
 assert.ok(String(row.nome||'').trim(), 'Subclasse Tasha sem nome.');
 assert.ok(String(row.resumo||'').trim(), `${row.nome}: resumo ausente.`);
 assert.ok((row.progressao||[]).length>0,`${row.nome}: progressão vazia.`);
 for(const f of row.progressao){
  assert.ok(Number(f.nivel)>0,`${row.nome}/${f.nome}: nível inválido.`);
  assert.ok(String(f.nome||'').trim(),`${row.nome}: característica sem nome.`);
  assert.ok(String(f.descricao||'').trim(),`${row.nome}/${f.nome}: descrição vazia.`);
 }
}

const wildfire=feature('Circle of Wildfire','Cauterizing Flames');
has(wildfire,'você ou do Wildfire Spirit','Reação','2d10 + modificador de Sabedoria','PB por Descanso Longo');
assert.ok(!/modificador de Sabedoria \(mín\. 1\) por Descanso Longo/.test(wildfire),'Cauterizing Flames não usa modificador de Sabedoria como quantidade de usos.');

const genie=feature('The Genie','Sanctuary Vessel');
has(genie,'cinco criaturas voluntárias','Ação Bônus','10 minutos','Descanso Curto','adiciona seu PB uma única vez ao total de PV recuperados');
assert.ok(!/PB por dado gasto/i.test(genie),'Sanctuary Vessel não adiciona PB por Hit Die gasto.');

const phantom=feature('Phantom','Ghost Walk');
has(phantom,'Ação Bônus','10 minutos','Fly Speed 10 pés','1d10 Force','Soul Trinket');

const astral=feature('Way of the Astral Self','Awakened Astral Self');
has(astral,'Extra Attack','atacar duas vezes','atacar três vezes','todos os ataques','braços astrais');
assert.ok(!/ao usar Attack, pode atacar três vezes/i.test(astral),'Awakened Astral Self não pode ampliar genericamente qualquer ação Attack.');

const scribes=feature('Order of Scribes','Master Scrivener');
has(scribes,'nível 1 ou 2','tempo de conjuração de 1 Ação','um nível acima','próximo Descanso Longo');

const order=feature('Order Domain',"Order's Wrath");
has(order,'pode amaldiçoá-la','próxima vez que um aliado acertar','com um ataque','+2d8 Psychic','uma vez por turno');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('supabase'),'Semântica Tasha não pode introduzir Supabase.');
console.log('Semântica Tasha 2020 validada: 18 legados estruturais e 6 características de alto risco confrontadas em detalhe.');
