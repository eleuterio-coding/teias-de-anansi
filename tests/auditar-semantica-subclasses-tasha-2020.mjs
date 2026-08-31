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

const sanctuary=feature('The Genie','Sanctuary Vessel');
has(sanctuary,'cinco criaturas voluntárias','Ação Bônus','10 minutos','Descanso Curto','adiciona seu PB uma única vez ao total de PV recuperados');
assert.ok(!/PB por dado gasto/i.test(sanctuary),'Sanctuary Vessel não adiciona PB por Hit Die gasto.');

const phantom=feature('Phantom','Ghost Walk');
has(phantom,'Ação Bônus','10 minutos','Fly Speed 10 pés','1d10 Force','Soul Trinket');

const astral=feature('Way of the Astral Self','Awakened Astral Self');
has(astral,'Extra Attack','atacar duas vezes','atacar três vezes','todos os ataques','braços astrais');
assert.ok(!/ao usar Attack, pode atacar três vezes/i.test(astral),'Awakened Astral Self não pode ampliar genericamente qualquer ação Attack.');

const masterScrivener=feature('Order of Scribes','Master Scrivener');
has(masterScrivener,'nível 1 ou 2','tempo de conjuração de 1 Ação','um nível acima','próximo Descanso Longo');

const order=feature('Order Domain',"Order's Wrath");
has(order,'pode amaldiçoá-la','próxima vez que um aliado acertar','com um ataque','+2d8 Psychic','uma vez por turno');

const spores=feature('Circle of Spores','Spreading Spores');
has(spores,'Ação Bônus','30 pés','cubo de 10 pés','no máximo uma vez por turno','dispensá-lo como Ação Bônus','não pode usar Halo of Spores por Reação');

const sentinel=feature('Oath of the Watchers','Aura of the Sentinel');
has(sentinel,'não estiver Incapacitated','10 pés','soma seu PB','nível 18','30 pés');

const bulwark=feature('Oath of the Watchers','Mortal Bulwark');
has(bulwark,'Ação Bônus','Truesight 120 pés','qualquer criatura','Charisma save','24 horas','spell slot de 5º nível');
assert.ok(!/ao acertar esses tipos/i.test(bulwark),'Mortal Bulwark pode tentar banir qualquer criatura atingida; os tipos limitam apenas a Vantagem nos ataques.');

const oneWithWord=feature('Order of Scribes','One with the Word');
has(oneWithWord,'Awakened Spellbook','3d6','cai a 0 PV','1d6 Descansos Longos','uma vez por Descanso Longo');

const vessel=feature('The Genie',"Genie's Vessel");
has(vessel,'objeto mágico Tiny','Ação entra no espaço extradimensional','2 × PB horas','Ação Bônus','se o Vessel for destruído','CA igual à sua CD de magia','nível de Warlock + PB','cerimônia de 1 hora');

const twilight=feature('Twilight Domain','Twilight Sanctuary');
has(twilight,'se move com você','1 minuto','Incapacitated','incluindo você','1d6 + nível de Cleric','Charmed ou Frightened');
assert.ok(!/criatura aliada/i.test(twilight),'Twilight Sanctuary não é limitado apenas a criaturas aliadas.');

const all=JSON.stringify(data).toLowerCase();
assert.ok(!all.includes('supabase'),'Semântica Tasha não pode introduzir Supabase.');
console.log('Semântica Tasha 2020 validada: 18 legados estruturais e 12 características de alto risco confrontadas em detalhe.');
