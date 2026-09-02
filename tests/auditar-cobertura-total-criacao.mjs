import fs from 'node:fs';
import path from 'node:path';
import {CATALOG_MODULES} from '../scripts/catalog-registry.js';

const ROOT=process.cwd();
const BUILDER_DIR=path.join(ROOT,'scripts','character-builder');
const ENTRY=path.join(ROOT,'scripts','character-builder.js');
const HTML=path.join(ROOT,'criacao-personagem.html');
const SCOPE_FILE=path.join(ROOT,'dados','auditoria-criacao-escopo.json');
const CATALOG_REGISTRY=path.join(ROOT,'scripts','catalog-registry.js');
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const fail=msg=>{throw new Error(msg)};
const exists=p=>fs.existsSync(p);
const read=p=>fs.readFileSync(p,'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);

if(!exists(ENTRY)||!exists(HTML)||!exists(BUILDER_DIR)||!exists(SCOPE_FILE))fail('Estrutura base ou manifesto fail-closed da criação de personagem ausente.');

const scope=JSON.parse(read(SCOPE_FILE));
if(scope.schema!=='hub-rpg/auditoria-criacao/v2')fail('Schema de auditoria inesperado.');
if(scope.politica!=='fail-closed')fail('A auditoria da criação deve operar obrigatoriamente em fail-closed.');
if(!Array.isArray(scope.etapas_obrigatorias)||scope.etapas_obrigatorias.length<10)fail('Pipeline de auditoria incompleto.');
const requiredStages=['inventario','integridade_sintatica','integridade_dados','rastreabilidade_runtime','aplicacao_mecanica','interacoes_cruzadas','cenarios_personagem','regressao','politicas_globais','evidencia_e_bloqueio'];
for(const stage of requiredStages)if(!scope.etapas_obrigatorias.includes(stage))fail(`Etapa obrigatória ausente do manifesto: ${stage}`);
for(const [key,value] of Object.entries(scope.criterio_fechamento||{}))if(Number(value)!==0)fail(`Critério de fechamento deve ser zero: ${key}`);

const allJs=walk(BUILDER_DIR).filter(p=>p.endsWith('.js'));
const mechanical=allJs.filter(p=>/(?:^|\/)(?:.*(?:mechanics|rules)|compatibility|race-variants|equipment-ownership|language-mechanics|spell-progression-rules|sorcerer-spell-access|subclass-mechanics-data)\.js$/i.test(rel(p)));

function resolveLocal(file,spec){
  spec=String(spec||'').split('?')[0].split('#')[0];
  if(!spec.startsWith('.'))return null;
  let target=path.resolve(path.dirname(file),spec);
  if(!path.extname(target))target+='.js';
  return exists(target)&&target.endsWith('.js')?target:null;
}
function localDeps(file){
  const src=read(file),deps=new Set();
  const imports=/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g;
  for(const m of src.matchAll(imports)){const target=resolveLocal(file,m[1]);if(target)deps.add(target)}
  const moduleLiterals=/['"](\.\.?\/[^'"]+\.js(?:\?[^'"]*)?)['"]/g;
  for(const m of src.matchAll(moduleLiterals)){const target=resolveLocal(file,m[1]);if(target)deps.add(target)}
  return [...deps];
}

const html=read(HTML);
const roots=[ENTRY];
for(const m of html.matchAll(/<script[^>]+src=['"]([^'"]+)['"]/g)){
  const spec=m[1].split('?')[0].split('#')[0];
  if(/^https?:/i.test(spec))continue;
  const p=path.resolve(ROOT,spec);
  if(exists(p)&&p.endsWith('.js'))roots.push(p);
}
const seen=new Set(),queue=[...new Set(roots)];
while(queue.length){
  const file=queue.shift();if(seen.has(file))continue;seen.add(file);
  for(const dep of localDeps(file))if(!seen.has(dep))queue.push(dep);
}

const exceptions=Array.isArray(scope.excecoes_runtime)?scope.excecoes_runtime:[];
const exceptionMap=new Map();
for(const row of exceptions){
  if(!row?.arquivo||!row?.tipo||!row?.motivo||!row?.requisito)fail('Exceção de runtime incompleta no manifesto.');
  if(exceptionMap.has(row.arquivo))fail(`Exceção de runtime duplicada: ${row.arquivo}`);
  const p=path.join(ROOT,row.arquivo);if(!exists(p))fail(`Exceção aponta para arquivo inexistente: ${row.arquivo}`);
  exceptionMap.set(row.arquivo,row);
}
const unreachable=allJs.filter(p=>!seen.has(p));
const unexpectedUnreachable=unreachable.filter(p=>!exceptionMap.has(rel(p)));
if(unexpectedUnreachable.length)fail('Módulos do construtor sem classificação/runtime: '+unexpectedUnreachable.map(rel).join(', '));
for(const file of exceptionMap.keys())if(seen.has(path.join(ROOT,file)))fail(`Exceção de runtime ficou obsoleta porque o módulo agora é alcançável: ${file}`);
for(const p of mechanical)if(exceptionMap.has(rel(p)))fail(`Módulo mecânico não pode ser exceção de runtime: ${rel(p)}`);

const compatibilityShim=path.join(BUILDER_DIR,'active-equipment-ui.js');
if(exists(compatibilityShim)){
  const src=read(compatibilityShim),body=src.match(/export function initActiveEquipmentUi\(\)\s*\{([\s\S]*?)\n\}/)?.[1]||'';
  if(!exceptionMap.has(rel(compatibilityShim)))fail('Shim de equipamento legado precisa estar explicitamente classificado.');
  if(/new\s+MutationObserver|\.addEventListener\s*\(|\.innerHTML\s*=/.test(body))fail('Shim active-equipment-ui deixou de ser no-op e voltou a controlar o DOM.');
}

const orphanMechanics=mechanical.filter(p=>!seen.has(p));
if(orphanMechanics.length)fail('Módulos mecânicos órfãos, não consumidos pela criação: '+orphanMechanics.map(rel).join(', '));

const subclassMechanics=allJs.filter(p=>/-subclass-mechanics\.js$/i.test(p));
for(const p of subclassMechanics)if(!seen.has(p))fail('Mecânica de subclasse fora do runtime: '+rel(p));

const aggregator=path.join(BUILDER_DIR,'subclass-mechanics-data.js');
if(exists(aggregator)){
  const src=read(aggregator);
  const refs=[...src.matchAll(/['"](dados\/subclasses-mecanicas-[^'"]+\.json)['"]/g)].map(m=>m[1]);
  if(!refs.length)fail('Agregador de subclasses não declara fontes mecânicas.');
  for(const ref of refs){
    const p=path.join(ROOT,ref);if(!exists(p))fail('Fonte mecânica de subclasses ausente: '+ref);
    const data=JSON.parse(read(p));if(!Array.isArray(data.subclasses))fail('Fonte de subclasses sem array subclasses: '+ref);
    for(const [i,row] of data.subclasses.entries()){
      if(!row?.nome)fail(`${ref}: subclasse #${i+1} sem nome.`);
      if(!Array.isArray(row.progressao)||!row.progressao.length)fail(`${ref}: ${row.nome} sem progressão mecânica.`);
      for(const feat of row.progressao){
        if(!Number.isInteger(Number(feat.nivel))||Number(feat.nivel)<1||Number(feat.nivel)>20)fail(`${ref}: ${row.nome} contém nível inválido.`);
        if(!feat.nome||!feat.descricao)fail(`${ref}: ${row.nome} contém característica mecânica incompleta.`);
      }
    }
  }
}

function globRegex(pattern){
  const escaped=pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'§§DOUBLESTAR§§').replace(/\*/g,'[^/]*').replace(/§§DOUBLESTAR§§/g,'.*');
  return new RegExp(`^${escaped}$`);
}
const dataFiles=walk(path.join(ROOT,'dados')).filter(p=>p.endsWith('.json')).map(rel).sort();
const domains=Array.isArray(scope.dominios)?scope.dominios:[];
if(!domains.length)fail('Manifesto sem domínios de criação.');
const ids=new Set(),classifiedSources=new Set();
for(const domain of domains){
  if(!domain?.id||ids.has(domain.id))fail(`Domínio inválido ou duplicado: ${domain?.id||'(sem id)'}`);ids.add(domain.id);
  if(!Array.isArray(domain.fontes)||!domain.fontes.length||!domain.runtime)fail(`Domínio incompleto: ${domain.id}`);
  for(const pattern of domain.fontes){
    const re=globRegex(pattern),matches=dataFiles.filter(file=>re.test(file));
    if(!matches.length)fail(`Padrão de fonte sem nenhum arquivo: ${domain.id} → ${pattern}`);
    for(const file of matches){JSON.parse(read(path.join(ROOT,file)));classifiedSources.add(file)}
  }
}

// O registro canônico é metadado compartilhado por Biblioteca, criação e Ficha. Apenas
// fontes explicitamente marcadas `builder:true` são dependências de dados da criação.
const runtimeFiles=[...seen].filter(file=>file!==CATALOG_REGISTRY);
const runtime=runtimeFiles.map(read).join('\n')+'\n'+read(ENTRY);
for(const domain of domains)if(!runtime.includes(domain.runtime)&&!html.includes(domain.runtime))fail(`Domínio ${domain.id} sem integração verificável no runtime: ${domain.runtime}`);

const dataRefs=new Set(),dynamicDataRefs=new Set();
for(const m of runtime.matchAll(/['"`](dados\/[^'"`?]+\.json)(?:\?[^'"`]*)?['"`]/g)){
  const ref=m[1];
  if(ref.includes('${'))dynamicDataRefs.add(ref);else dataRefs.add(ref)
}
for(const module of CATALOG_MODULES)for(const source of module.sources||[]){
  if(source?.local&&source?.builder&&typeof source.path==='string'&&source.path.endsWith('.json'))dataRefs.add(source.path);
}
for(const ref of dataRefs){
  const p=path.join(ROOT,ref);if(!exists(p))fail(`Dependência local de dados ausente: ${ref}`);
  JSON.parse(read(p));
  if(!classifiedSources.has(ref))fail(`Fonte usada pelo runtime sem classificação no manifesto: ${ref}`);
}
for(const ref of dynamicDataRefs){
  const prefix=ref.split('${',1)[0],suffix=ref.includes('}')?ref.slice(ref.lastIndexOf('}')+1):'';
  const matches=[...classifiedSources].filter(file=>file.startsWith(prefix)&&file.endsWith(suffix));
  if(!matches.length)fail(`Dependência dinâmica de dados sem conjunto classificado correspondente: ${ref}`);
}
for(const file of dataFiles.filter(file=>/^dados\/(?:regras-|politica-compatibilidade-5e-5\.5e)/.test(file)))if(!classifiedSources.has(file))fail(`Módulo normativo sem classificação no manifesto: ${file}`);

const criticalTests=Array.isArray(scope.testes_criticos)?scope.testes_criticos:[];
if(!criticalTests.length)fail('Manifesto sem testes críticos.');
for(const test of criticalTests)if(!exists(path.join(ROOT,test)))fail(`Teste crítico ausente: ${test}`);
const auditTests=walk(path.join(ROOT,'tests')).filter(p=>/^auditar-.*\.mjs$/i.test(path.basename(p))).map(rel).sort();
if(!auditTests.length)fail('Nenhuma auditoria executável encontrada.');

const manifest={
  generatedBy:'tests/auditar-cobertura-total-criacao.mjs',
  policy:scope.politica,
  requiredStages:scope.etapas_obrigatorias,
  domains:domains.map(d=>d.id),
  builderModules:allJs.map(rel).sort(),
  mechanicalModules:mechanical.map(rel).sort(),
  reachable:[...seen].filter(p=>p.startsWith(BUILDER_DIR)||p===ENTRY).map(rel).sort(),
  runtimeExceptions:exceptions,
  orphanMechanics:[],
  classifiedSources:[...classifiedSources].sort(),
  runtimeDataDependencies:[...dataRefs].sort(),
  dynamicRuntimeDataDependencies:[...dynamicDataRefs].sort(),
  auditTests,
  criticalTests,
  coverage:{
    builderAccountedPercent:100,
    mechanicalRuntimePercent:100,
    runtimeDataClassifiedPercent:100,
    criticalTestsPresentPercent:100
  }
};
fs.mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'artifacts','cobertura-criacao.json'),JSON.stringify(manifest,null,2));
console.log(`Cobertura fail-closed validada: ${allJs.length}/${allJs.length} módulos classificados, ${mechanical.length}/${mechanical.length} mecânicos no runtime, ${dataRefs.size} dependências estáticas + ${dynamicDataRefs.size} dinâmicas classificadas e ${auditTests.length} auditorias executáveis inventariadas.`);