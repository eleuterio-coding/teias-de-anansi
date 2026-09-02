import fs from'node:fs';
import path from'node:path';
import{CATALOG_MODULES,DATA_STAGES,BACKGROUND_BUILDER_FILES,SPECIES_BUILDER_FILES,FEAT_BUILDER_FILES,SPELL_REMOTE_SOURCES,SPELL_SOURCE_LOOKUP}from'../scripts/catalog-registry.js';

const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const read=file=>fs.readFileSync(file,'utf8');
const json=file=>JSON.parse(read(file));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

assert(CATALOG_MODULES.length===18,`Registro deve conter 18 módulos; encontrou ${CATALOG_MODULES.length}`);
assert(new Set(CATALOG_MODULES.map(x=>x.id)).size===18,'IDs de módulos duplicados.');
assert(new Set(CATALOG_MODULES.map(x=>x.route)).size===18,'Rotas públicas de módulos duplicadas.');
assert(new Set(CATALOG_MODULES.map(x=>x.semanticName)).size===18,'Nomes semânticos de módulos duplicados.');

for(const module of CATALOG_MODULES){
 assert(DATA_STAGES.includes(module.stage),`${module.id}: etapa inválida ${module.stage}`);
 assert(DATA_STAGES.indexOf(module.stage)>=DATA_STAGES.indexOf('relacionado'),`${module.id}: módulo publicado no Hub sem alcançar etapa relacionada.`);
 assert(fs.existsSync(module.route),`${module.id}: rota pública ausente: ${module.route}`);
 assert(Array.isArray(module.sources)&&module.sources.length>0,`${module.id}: catálogo sem fonte declarada.`);
 for(const source of module.sources){
  assert(Boolean(source.path)!==Boolean(source.url),`${module.id}: fonte deve possuir path ou url, exclusivamente.`);
  if(source.local)assert(fs.existsSync(source.path),`${module.id}: fonte local ausente: ${source.path}`);
  else assert(/^https:\/\//.test(source.url),`${module.id}: fonte remota inválida: ${source.url}`);
 }
}

const sourceOwners=new Map;
for(const module of CATALOG_MODULES)for(const source of module.sources.filter(x=>x.local)){const key=path.normalize(source.path);if(!sourceOwners.has(key))sourceOwners.set(key,[]);sourceOwners.get(key).push(module.id)}
const duplicated=[...sourceOwners].filter(([,owners])=>new Set(owners).size>1);
assert(!duplicated.length,`Fontes locais atribuídas a módulos diferentes: ${JSON.stringify(duplicated)}`);

const state=read('scripts/character-builder/state.js');
for(const token of['BACKGROUND_BUILDER_FILES','SPECIES_BUILDER_FILES','FEAT_BUILDER_FILES','FIVE_E_BITS_PIN','FIVE_E_BITS_2024','FIVE_E_BITS_2014'])assert(state.includes(token),`state.js ainda não deriva ${token} do registro canônico.`);
for(const file of[...BACKGROUND_BUILDER_FILES,...SPECIES_BUILDER_FILES,...FEAT_BUILDER_FILES])assert(!state.includes(`'${file}'`)&&!state.includes(`"${file}"`),`Fonte voltou a ser duplicada literalmente em state.js: ${file}`);

assert(BACKGROUND_BUILDER_FILES.length===6,`Antecedentes ativos no construtor divergiram: ${BACKGROUND_BUILDER_FILES.length}`);
assert(SPECIES_BUILDER_FILES.length===4,`Pacotes locais de espécies ativos divergiram: ${SPECIES_BUILDER_FILES.length}`);
assert(FEAT_BUILDER_FILES.length===7,`Fontes de talentos ativas divergiram: ${FEAT_BUILDER_FILES.length}`);
assert(SPELL_REMOTE_SOURCES.length===5,`Fontes remotas de magias divergiram: ${SPELL_REMOTE_SOURCES.length}`);
assert(/gendata-spell-source-lookup\.json$/.test(SPELL_SOURCE_LOOKUP),'Lookup de classes de Magias não está registrado.');
const spells=read('scripts/character-builder/spells.js');
assert(spells.includes('SPELL_REMOTE_SOURCES')&&spells.includes('SPELL_SOURCE_LOOKUP'),'Magias não consomem o registro canônico.');
assert(!spells.includes("const BASE='https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data'"),'Magias voltou a manter base remota paralela.');

const lib=read('bibliotecas.html');
assert(lib.includes('scripts/library-catalog-status.js?v=20260901-catalog-registry1'),'Índice da Biblioteca não carrega sincronização de catálogos.');
assert((lib.match(/<li><a href=/g)||[]).length===18,'Índice visual não contém exatamente 18 módulos.');
assert(!/\b(?:159|119|58|172|146|185|109|259|537)\s+(?:itens|magias|registros|classes)/.test(lib),'Biblioteca voltou a anunciar contagens estáticas suscetíveis a deriva.');
const libraryUi=read('scripts/library-catalog-status.js');
for(const token of['cobertura_modulos','referencias-hub-index.json','CATALOG_BY_ROUTE','catalog-search','catalog-scope'])assert(libraryUi.includes(token),`UI da Biblioteca sem contrato: ${token}`);

const py=read('scripts/gerar_referencias_hub.py');
const routeBlock=py.match(/ROUTES\s*=\s*\{([\s\S]*?)\n\}/)?.[1]||'';
const pyRoutes=new Map([...routeBlock.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)].map(m=>[m[1],m[2]]));
assert(pyRoutes.size===18,`Gerador semântico declara ${pyRoutes.size}/18 módulos.`);
for(const module of CATALOG_MODULES){const expected=module.semanticRoute||module.route;assert(pyRoutes.get(module.semanticName)===expected,`Rota semântica divergente em ${module.semanticName}: registro=${expected}, gerador=${pyRoutes.get(module.semanticName)}`)}

const subclasses=json('dados/subclasses-pdfs.json').subclasses||[];
const classNames=new Set(['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']);
const orphanSubclasses=subclasses.filter(x=>x.classe&&!classNames.has(norm(x.classe))).map(x=>`${x.nome} -> ${x.classe}`);
assert(!orphanSubclasses.length,`Subclasses apontam para classes inexistentes: ${orphanSubclasses.slice(0,8).join('; ')}`);

const backgrounds=BACKGROUND_BUILDER_FILES.flatMap(file=>{const d=json(file);return d.items||d.itens||[]});
assert(backgrounds.length>0,'Nenhum antecedente ativo foi lido pelas fontes registradas.');
const feats=FEAT_BUILDER_FILES.flatMap(file=>{const d=json(file);return d.itens||d.items||[]});
assert(feats.length>0,'Nenhum talento ativo foi lido pelas fontes registradas.');

const forbidden=['supabase'];
for(const file of['scripts/catalog-registry.js','scripts/library-catalog-status.js','bibliotecas.html']){const text=norm(read(file));for(const token of forbidden)assert(!text.includes(token),`${file}: backend proibido detectado.`)}

console.log(`Catálogos validados: ${CATALOG_MODULES.length}/18 módulos, ${BACKGROUND_BUILDER_FILES.length} fontes de Antecedentes, ${SPECIES_BUILDER_FILES.length} de Espécies, ${FEAT_BUILDER_FILES.length} de Talentos e ${SPELL_REMOTE_SOURCES.length} remotas de Magias; rotas semânticas sincronizadas e zero subclasses órfãs.`);
