import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT=process.cwd();
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const scope=JSON.parse(read('dados/auditoria-criacao-escopo.json'));

assert.equal(scope.schema,'hub-rpg/auditoria-criacao/v2','Schema da auditoria total inesperado.');
assert.equal(scope.politica,'fail-closed','A auditoria precisa operar em fail-closed.');
const stages=['inventario','integridade_sintatica','integridade_dados','rastreabilidade_runtime','aplicacao_mecanica','interacoes_cruzadas','cenarios_personagem','regressao','politicas_globais','evidencia_e_bloqueio'];
assert.deepEqual(scope.etapas_obrigatorias,stages,'As dez etapas obrigatórias da auditoria foram alteradas ou estão incompletas.');
for(const [key,value] of Object.entries(scope.criterio_fechamento||{}))assert.equal(value,0,`Critério de fechamento ${key} precisa permanecer em zero.`);
for(const test of scope.testes_criticos||[])assert.ok(exists(test),`Teste crítico ausente: ${test}`);

const builderFiles=[...walk(path.join(ROOT,'scripts','character-builder')).filter(p=>p.endsWith('.js')),path.join(ROOT,'scripts','character-builder.js')];
const sheetFiles=walk(path.join(ROOT,'scripts')).filter(p=>/^character-sheet.*\.js$/.test(path.basename(p)));
const runtimeFiles=[...new Set([...builderFiles,...sheetFiles])];
const runtime=runtimeFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');

for(const domain of scope.dominios||[]){
  assert.ok(domain.id&&Array.isArray(domain.fontes)&&domain.fontes.length&&domain.runtime,`Domínio malformado: ${JSON.stringify(domain)}`);
  if(domain.runtime.endsWith('.js'))assert.ok(runtimeFiles.some(p=>path.basename(p)===domain.runtime),`Runtime declarado não existe para ${domain.id}: ${domain.runtime}`);
  else assert.ok(runtime.includes(domain.runtime),`Runtime declarado não é consumido para ${domain.id}: ${domain.runtime}`);
}

function globRegex(glob){
  const escaped=glob.replace(/[.+^${}()|[\]\\]/g,'\\$&').replaceAll('**','§§').replaceAll('*','[^/]*').replaceAll('§§','.*').replaceAll('?','.');
  return new RegExp(`^${escaped}$`);
}
const patterns=(scope.dominios||[]).flatMap(d=>d.fontes.map(glob=>({domain:d.id,glob,re:globRegex(glob)})));
const dataFiles=walk(path.join(ROOT,'dados')).filter(p=>p.endsWith('.json')).map(rel);
const declaredFiles=new Set();
for(const item of patterns)for(const file of dataFiles)if(item.re.test(file))declaredFiles.add(file);

for(const file of declaredFiles){
  try{JSON.parse(read(file))}catch(error){throw new Error(`JSON inválido no escopo auditado: ${file}: ${error.message}`)}
}

const localRefs=new Set();
for(const file of runtimeFiles){
  const src=fs.readFileSync(file,'utf8');
  for(const m of src.matchAll(/['"`](dados\/[A-Za-z0-9_.\/-]+\.json)['"`]/g))localRefs.add(m[1]);
}
for(const ref of localRefs){
  assert.ok(exists(ref),`Dependência local de dados ausente: ${ref}`);
  assert.ok(patterns.some(p=>p.re.test(ref)),`Fonte consumida pelo runtime sem classificação no escopo: ${ref}`);
}

const prohibitedFiles=[...runtimeFiles,path.join(ROOT,'criacao-personagem.html'),path.join(ROOT,'ficha-personagem.html')].filter(fs.existsSync);
for(const file of prohibitedFiles){
  const src=fs.readFileSync(file,'utf8');
  assert.ok(!/supabase/i.test(src),`Uso de Supabase proibido no escopo da criação: ${rel(file)}`);
}

for(const exception of scope.excecoes_runtime||[]){
  assert.ok(exists(exception.arquivo),`Exceção de runtime aponta para arquivo ausente: ${exception.arquivo}`);
  if(exception.tipo==='compatibilidade_cache'){
    const src=read(exception.arquivo);
    assert.ok(/no-op intencional/i.test(src),`Shim de compatibilidade deixou de ser no-op: ${exception.arquivo}`);
    assert.ok(!/\.observe\s*\(/.test(src),`Shim de compatibilidade não pode registrar observer: ${exception.arquivo}`);
  }
}

const report={schema:scope.schema,policy:scope.politica,stages:stages.length,domains:scope.dominios.length,declaredDataFiles:declaredFiles.size,runtimeDataReferences:localRefs.size,runtimeModules:runtimeFiles.length,closure:scope.criterio_fechamento};
fs.mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'artifacts','escopo-criacao.json'),JSON.stringify(report,null,2));
console.log(`Escopo fail-closed validado: ${report.stages} etapas, ${report.domains} domínios, ${report.declaredDataFiles} JSON classificados e ${report.runtimeDataReferences} dependências locais rastreadas.`);
