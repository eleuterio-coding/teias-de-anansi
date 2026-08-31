import fs from'node:fs';
import assert from'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=read('dados/auditoria-normativa-subclasses-tasha-2020.json');
const precedence=read('dados/precedencia-subclasses.json');
const tasha=read('dados/subclasses-mecanicas-tasha-2020.json');
const phb=read('dados/subclasses-mecanicas-phb-2024.json');
const catalog=read('dados/subclasses-pdfs.json');
const runtime=fs.readFileSync('scripts/character-builder/subclass-mechanics-data.js','utf8');
const catalogsRuntime=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const uniqueLevels=row=>[...new Set((row.progressao||[]).map(x=>Number(x.nivel)))].sort((a,b)=>a-b);
const sorted=a=>[...a].sort((a,b)=>String(a).localeCompare(String(b),'en'));

assert.equal(matrix.schema,'hub-rpg/auditoria-normativa-subclasses-tasha-2020/v1');
assert.equal(matrix.fonte_id,'tasha-2020');
assert.equal(matrix.autoridade,'oficial_legado');
assert.equal(matrix.ruleset,'5e');
assert.equal(matrix.revisao,2020);
assert.equal(matrix.politica,'fail-closed');
assert.equal(matrix.quantidade_original_escopo,26);
assert.equal(matrix.quantidade_legado_unico_retido,18);
assert.equal(matrix.quantidade_substituida,8);
assert.equal(matrix.quantidade_legado_unico_retido+matrix.quantidade_substituida,matrix.quantidade_original_escopo);

const retained=new Map();
for(const[klass,def]of Object.entries(matrix.legado_unico||{}))for(const name of def.subclasses||[]){
 assert.ok(!retained.has(name),`Legado Tasha duplicado na matriz: ${name}`);
 retained.set(name,{klass,levels:[...def.niveis].map(Number).sort((a,b)=>a-b)});
}
assert.equal(retained.size,18,'A matriz precisa manter exatamente 18 subclasses legadas únicas de Tasha.');
assert.equal(tasha.fonte_id,'tasha-2020');
assert.equal(tasha.subclasses.length,18,'O arquivo mecânico de Tasha deve conter somente os 18 legados únicos.');
assert.deepEqual(sorted(tasha.subclasses.map(x=>x.nome)),sorted(retained.keys()),'Mecânicas de Tasha e matriz de legado único divergem.');
for(const row of tasha.subclasses){
 const exp=retained.get(row.nome);assert.ok(exp,`Mecânica Tasha inesperada: ${row.nome}`);
 assert.deepEqual(uniqueLevels(row),exp.levels,`${row.nome}: níveis de progressão legada divergentes.`);
 for(const f of row.progressao||[]){assert.ok(String(f.nome||'').trim(),`${row.nome}: recurso sem nome.`);assert.ok(String(f.descricao||'').trim(),`${row.nome}/${f.nome}: recurso sem descrição.`)}
}

const tashaCatalog=(catalog.subclasses||[]).filter(x=>x.fonte_id==='tasha-2020');
assert.equal(tashaCatalog.length,18,'Catálogo deve expor exatamente 18 subclasses Tasha como legado único.');
assert.deepEqual(sorted(tashaCatalog.map(x=>x.nome)),sorted(retained.keys()),'Catálogo Tasha e matriz de legado único divergem.');
for(const row of tashaCatalog){
 const exp=retained.get(row.nome);assert.equal(row.classe,exp.klass,`${row.nome}: classe divergente no catálogo.`);
 assert.equal(row.natureza,'oficial',`${row.nome}: Tasha precisa permanecer oficial legado.`);
 assert.equal(row.status,'legado_com_conteudo_unico',`${row.nome}: status precisa permanecer legado_com_conteudo_unico.`);
 assert.equal(row.ano,2020,`${row.nome}: ano de Tasha divergente.`);
}

const replacements=matrix.substituidas_por_2024||[];
assert.equal(replacements.length,8,'Precisamos registrar exatamente as 8 subclasses Tasha substituídas pelo PHB 2024.');
const policyReplacements=(precedence.substituicoes||[]).filter(x=>x.fonte_anterior==='tasha-2020'&&x.fonte_vigente==='phb-2024');
assert.equal(policyReplacements.length,8,'Política runtime precisa conter as 8 substituições Tasha → PHB 2024.');
for(const old of replacements){
 const rule=policyReplacements.find(x=>x.classe===old.classe&&x.nome_anterior===old.nome_anterior&&x.nome_vigente===old.nome_vigente);
 assert.ok(rule,`Substituição ausente da política runtime: ${old.nome_anterior} → ${old.nome_vigente}`);
 assert.ok(!tasha.subclasses.some(x=>x.nome===old.nome_anterior),`Versão Tasha substituída reapareceu nas mecânicas: ${old.nome_anterior}`);
 assert.ok(!tashaCatalog.some(x=>x.nome===old.nome_anterior),`Versão Tasha substituída reapareceu no catálogo legado: ${old.nome_anterior}`);
 const target=phb.subclasses.find(x=>x.nome===old.nome_vigente);assert.ok(target,`Alvo PHB 2024 ausente: ${old.nome_vigente}`);
 const targetCatalog=(catalog.subclasses||[]).find(x=>x.fonte_id==='phb-2024'&&x.nome===old.nome_vigente&&x.classe===old.classe);
 assert.ok(targetCatalog,`Alvo vigente não encontrado no catálogo PHB: ${old.nome_vigente}`);
 assert.equal(targetCatalog.status,'vigente_mais_recente',`${old.nome_vigente}: alvo precisa permanecer vigente_mais_recente.`);
}

const expectedRenames=new Map([
 ['Circle of Stars','Circle of the Stars'],
 ['Way of Mercy','Warrior of Mercy'],
 ['Aberrant Mind','Aberrant Sorcery'],
 ['Clockwork Soul','Clockwork Sorcery']
]);
assert.equal((matrix.renomeadas||[]).length,expectedRenames.size,'Todas as equivalências renomeadas precisam estar explícitas.');
for(const[oldName,newName]of expectedRenames){
 assert.ok((matrix.renomeadas||[]).some(x=>x.nome_anterior===oldName&&x.nome_vigente===newName),`Equivalência renomeada ausente: ${oldName} → ${newName}`);
 assert.ok(policyReplacements.some(x=>x.nome_anterior===oldName&&x.nome_vigente===newName),`Runtime não conhece a equivalência renomeada: ${oldName} → ${newName}`);
}

const p=precedence.prioridade_fontes||{};
assert.ok(Number(p['phb-2024'])>Number(p['tasha-2020']),'PHB 2024 deve ter prioridade maior que Tasha 2020.');
assert.ok(Number(p['phb-2024'])>Number(p['quickstone-2024']),'Fonte oficial atual deve superar conteúdo terceiro.');
assert.ok(Number(p['tasha-2020'])>Number(p['quickstone-2024']),'Fonte oficial legada deve superar conteúdo terceiro quando a identidade conflita.');
assert.ok(runtime.includes("const PRECEDENCE='dados/precedencia-subclasses.json'"),'Runtime de mecânicas precisa carregar a política de precedência.');
assert.ok(runtime.includes('superseded.has(precedenceKey(pkg.fonte_id,row.nome))'),'Runtime precisa bloquear versões explicitamente substituídas.');
assert.ok(runtime.includes('rank(value.fonte_id)>rank(current.fonte_id)'),'Runtime precisa impedir que uma fonte de prioridade inferior sobreponha uma superior por colisão de nome.');
assert.ok(catalogsRuntime.includes("json('dados/precedencia-subclasses.json')"),'Catálogo runtime precisa carregar a política de precedência.');
assert.ok(catalogsRuntime.includes("superseded.has(`${s.fonte_id}:${fold(s.nome)}`)"),'Catálogo runtime precisa bloquear versões explicitamente substituídas sem depender apenas do status editorial.');
assert.ok(catalogsRuntime.includes('rank>oldRank'),'Catálogo runtime precisa escolher a fonte de maior prioridade em colisões de identidade textual.');
assert.ok(catalogsRuntime.includes('originalName:s.nome')&&catalogsRuntime.includes("sourceId:s.fonte_id||''"),'Catálogo runtime precisa preservar identidade original e fonte para rastreabilidade normativa.');

const all=[matrix,precedence,tasha,phb,catalog].map(JSON.stringify).join('\n').toLowerCase()+runtime.toLowerCase()+catalogsRuntime.toLowerCase();
assert.ok(!all.includes('supabase'),'Precedência de subclasses não pode introduzir Supabase.');

console.log('Precedência Tasha 2020 → PHB 2024 validada: 26 no escopo, 18 legados únicos, 8 substituições e 4 equivalências renomeadas protegidas no dado, catálogo e runtime mecânico.');
