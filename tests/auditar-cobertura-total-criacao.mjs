import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const BUILDER_DIR=path.join(ROOT,'scripts','character-builder');
const ENTRY=path.join(ROOT,'scripts','character-builder.js');
const HTML=path.join(ROOT,'criacao-personagem.html');
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const fail=msg=>{throw new Error(msg)};
const exists=p=>fs.existsSync(p);
const read=p=>fs.readFileSync(p,'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);

if(!exists(ENTRY)||!exists(HTML)||!exists(BUILDER_DIR))fail('Estrutura base da criação de personagem ausente.');

const allJs=walk(BUILDER_DIR).filter(p=>p.endsWith('.js'));
const mechanical=allJs.filter(p=>/(?:^|\/)(?:.*(?:mechanics|rules)|compatibility|race-variants|equipment-ownership|language-mechanics|spell-progression-rules|sorcerer-spell-access|subclass-mechanics-data)\.js$/i.test(rel(p)));

function localDeps(file){
  const src=read(file),deps=[];
  const re=/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g;
  for(const m of src.matchAll(re)){
    let spec=m[1].split('?')[0].split('#')[0];
    if(!spec.startsWith('.'))continue;
    let target=path.resolve(path.dirname(file),spec);
    if(!path.extname(target))target+='.js';
    if(exists(target))deps.push(target);
  }
  return deps;
}

const html=read(HTML);
const roots=[ENTRY];
for(const m of html.matchAll(/<script[^>]+src=['"]([^'"]+)['"]/g)){
  const spec=m[1].split('?')[0].split('#')[0];
  if(spec.startsWith('http:')||spec.startsWith('https:'))continue;
  const p=path.resolve(ROOT,spec);
  if(exists(p)&&p.endsWith('.js'))roots.push(p);
}
const seen=new Set(),queue=[...new Set(roots)];
while(queue.length){
  const file=queue.shift();if(seen.has(file))continue;seen.add(file);
  for(const dep of localDeps(file))if(!seen.has(dep))queue.push(dep);
}

const orphanMechanics=mechanical.filter(p=>!seen.has(p));
if(orphanMechanics.length)fail('Módulos mecânicos órfãos, não consumidos pela criação: '+orphanMechanics.map(rel).join(', '));

// Todo módulo de mecânica de subclasse precisa estar ligado ao catálogo genérico ou ao runtime da criação.
const subclassMechanics=allJs.filter(p=>/-subclass-mechanics\.js$/i.test(p));
for(const p of subclassMechanics)if(!seen.has(p))fail('Mecânica de subclasse fora do runtime: '+rel(p));

// Fontes mecânicas declaradas no agregador precisam existir e ser JSON válido.
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

// Catálogos que interferem diretamente na criação devem estar representados no carregador/runtime.
const requiredDomains={
  classes:['loadClasses','classes-base-2024.json'],
  species:['loadSpecies','loadSpecies'],
  backgrounds:['loadBackgrounds','loadBackgrounds'],
  feats:['loadFeats','talentos-phb-2024.json'],
  equipment:['loadEquipment','starting-equipment-rules'],
  spells:['loadSpells','magias-catalogo.json']
};
const runtime=[...seen].map(read).join('\n')+'\n'+read(ENTRY);
for(const [domain,tokens] of Object.entries(requiredDomains))for(const token of tokens)if(!runtime.includes(token)&&!html.includes(token))fail(`Domínio ${domain} sem integração verificável: ${token}`);

// Garante que todos os módulos JS do construtor sejam pelo menos sintaticamente auditáveis pelo workflow.
const manifest={generatedBy:'tests/auditar-cobertura-total-criacao.mjs',builderModules:allJs.map(rel).sort(),mechanicalModules:mechanical.map(rel).sort(),reachable:[...seen].filter(p=>p.startsWith(BUILDER_DIR)||p===ENTRY).map(rel).sort()};
fs.mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'artifacts','cobertura-criacao.json'),JSON.stringify(manifest,null,2));
console.log(`Cobertura estrutural validada: ${allJs.length} módulos do construtor, ${mechanical.length} módulos mecânicos, ${manifest.reachable.length} módulos alcançáveis.`);
