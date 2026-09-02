import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=read('dados/auditoria-normativa-subclasses-xanathar-2017.json');
const precedence=read('dados/precedencia-subclasses.json');
const xanathar=read('dados/subclasses-mecanicas-xanathar-2017.json');
const phb=read('dados/subclasses-mecanicas-phb-2024.json');
const catalog=read('dados/subclasses-pdfs.json');
const mechanicsRuntime=fs.readFileSync('scripts/character-builder/subclass-mechanics-data.js','utf8');
const catalogsRuntime=fs.readFileSync('scripts/character-builder/catalogs.js','utf8');
const sorted=a=>[...a].sort((a,b)=>String(a).localeCompare(String(b),'en'));

assert.equal(matrix.schema,'hub-rpg/auditoria-normativa-subclasses-xanathar-2017/v1');
assert.equal(matrix.politica,'fail-closed');
assert.equal(matrix.fonte_id,'xanathar-2017');
assert.equal(matrix.autoridade,'oficial_legado');
assert.equal(matrix.ruleset,'5e');
assert.equal(matrix.revisao,2017);
assert.equal(matrix.quantidade_original_escopo,31);
assert.equal(matrix.quantidade_legado_unico_retido,27);
assert.equal(matrix.quantidade_substituida,4);
assert.equal(matrix.quantidade_legado_unico_retido+matrix.quantidade_substituida,matrix.quantidade_original_escopo);

const retained=new Map();
for(const[klass,def]of Object.entries(matrix.legado_unico||{}))for(const name of def.subclasses||[]){assert.ok(!retained.has(name),`Legado Xanathar duplicado: ${name}`);retained.set(name,klass)}
assert.equal(retained.size,27,'Matriz deve enumerar exatamente 27 subclasses legadas únicas de Xanathar.');
assert.equal(xanathar.fonte_id,'xanathar-2017');
assert.equal((xanathar.subclasses||[]).length,27,'Arquivo mecânico de Xanathar deve conter somente os 27 legados únicos.');
assert.deepEqual(sorted((xanathar.subclasses||[]).map(x=>x.nome)),sorted(retained.keys()),'Mecânicas Xanathar divergem da matriz de legado único.');
for(const row of xanathar.subclasses||[]){assert.ok(String(row.resumo||'').trim(),`${row.nome}: resumo ausente.`);assert.ok((row.progressao||[]).length,`${row.nome}: progressão ausente.`);for(const f of row.progressao||[]){assert.ok(Number(f.nivel)>0,`${row.nome}/${f.nome}: nível inválido.`);assert.ok(String(f.nome||'').trim(),`${row.nome}: recurso sem nome.`);assert.ok(String(f.descricao||'').trim(),`${row.nome}/${f.nome}: descrição ausente.`)}}

const xCatalog=(catalog.subclasses||[]).filter(x=>x.fonte_id==='xanathar-2017');
assert.equal(xCatalog.length,27,'Catálogo deve expor exatamente 27 subclasses de Xanathar como legado único.');
assert.deepEqual(sorted(xCatalog.map(x=>x.nome)),sorted(retained.keys()),'Catálogo Xanathar diverge da matriz de legado único.');
for(const row of xCatalog){assert.equal(row.classe,retained.get(row.nome),`${row.nome}: classe divergente.`);assert.equal(row.natureza,'oficial',`${row.nome}: natureza deve ser oficial.`);assert.equal(row.status,'legado_com_conteudo_unico',`${row.nome}: status deve permanecer legado_com_conteudo_unico.`);assert.equal(row.ano,2017,`${row.nome}: ano divergente.`)}

const replacements=matrix.substituidas_por_2024||[];
assert.equal(replacements.length,4,'Xanathar precisa registrar quatro substituições pelo PHB 2024.');
const policy=(precedence.substituicoes||[]).filter(x=>x.fonte_anterior==='xanathar-2017'&&x.fonte_vigente==='phb-2024');
assert.equal(policy.length,4,'Política runtime precisa conter quatro substituições Xanathar → PHB 2024.');
for(const old of replacements){
 assert.ok(policy.some(x=>x.classe===old.classe&&x.nome_anterior===old.nome_anterior&&x.nome_vigente===old.nome_vigente),`Substituição ausente: ${old.nome_anterior} → ${old.nome_vigente}`);
 assert.ok(!(xanathar.subclasses||[]).some(x=>x.nome===old.nome_anterior),`Versão Xanathar substituída reapareceu nas mecânicas: ${old.nome_anterior}`);
 assert.ok(!xCatalog.some(x=>x.nome===old.nome_anterior),`Versão Xanathar substituída reapareceu no catálogo: ${old.nome_anterior}`);
 assert.ok((phb.subclasses||[]).some(x=>x.nome===old.nome_vigente),`Alvo PHB 2024 ausente: ${old.nome_vigente}`);
 const active=(catalog.subclasses||[]).find(x=>x.fonte_id==='phb-2024'&&x.classe===old.classe&&x.nome===old.nome_vigente);
 assert.ok(active,`Alvo vigente ausente no catálogo: ${old.nome_vigente}`);
 assert.equal(active.status,'vigente_mais_recente',`${old.nome_vigente}: alvo vigente perdeu status de precedência.`);
}

assert.deepEqual(matrix.renomeadas,[{classe:'Warlock',nome_anterior:'The Celestial',nome_vigente:'Celestial Patron'}],'Renomeação Xanathar → PHB 2024 precisa ser explícita e única.');
assert.ok(policy.some(x=>x.nome_anterior==='The Celestial'&&x.nome_vigente==='Celestial Patron'),'Runtime precisa conhecer The Celestial → Celestial Patron.');
const p=precedence.prioridade_fontes||{};
assert.ok(Number(p['phb-2024'])>Number(p['xanathar-2017']),'PHB 2024 deve superar Xanathar 2017.');
assert.ok(Number(p['xanathar-2017'])>Number(p['quickstone-2024']),'Oficial legado deve superar terceiro em colisão de identidade.');
assert.ok(mechanicsRuntime.includes("const PRECEDENCE='dados/precedencia-subclasses.json'"),'Runtime mecânico deve consumir a política de precedência.');
assert.ok(catalogsRuntime.includes("json('dados/precedencia-subclasses.json')"),'Catálogo runtime deve consumir a política de precedência.');

const all=[matrix,precedence,xanathar,phb,catalog].map(JSON.stringify).join('\n').toLowerCase()+mechanicsRuntime.toLowerCase()+catalogsRuntime.toLowerCase();
assert.ok(!all.includes('supabase'),'Auditoria Xanathar não pode introduzir Supabase.');
console.log('Precedência Xanathar 2017 → PHB 2024 validada: 31 no escopo, 27 legados únicos, 4 substituições e 1 equivalência renomeada.');
