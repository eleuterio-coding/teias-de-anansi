import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const readJson=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const walk=dir=>{
  const out=[];
  for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
};
const globRegex=pattern=>{
  const escaped=pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&')
    .replace(/\*\*/g,'§§DOUBLESTAR§§')
    .replace(/\*/g,'[^/]*')
    .replace(/§§DOUBLESTAR§§/g,'.*');
  return new RegExp(`^${escaped}$`);
};
const expand=(pattern,files)=>files.filter(file=>globRegex(pattern).test(file));

const scope=readJson('dados/auditoria-criacao-escopo.json');
const normative=readJson('dados/fontes-normativas-criacao.json');
const compatibility=readJson('dados/politica-compatibilidade-5e-5.5e.json');

assert.equal(normative.schema,'hub-rpg/fontes-normativas-criacao/v1');
assert.equal(normative.politica,'fail-closed');
assert.equal(scope.politica,'fail-closed');

const hierarchy=new Map(normative.hierarquia.map(x=>[x.id,x]));
for(const id of ['regra_casa','oficial_atual','oficial_legado','terceiro_compativel','demonstrativo_nao_canonico','derivado_localizacao','consolidado_misto']){
  assert.ok(hierarchy.has(id),`Autoridade normativa obrigatória ausente: ${id}`);
}
assert.ok(hierarchy.get('regra_casa').prioridade>hierarchy.get('oficial_atual').prioridade,'Regra da Casa deve prevalecer sobre regra oficial geral quando a substituição for explícita.');
assert.ok(hierarchy.get('oficial_atual').prioridade>hierarchy.get('oficial_legado').prioridade,'Revisão atual deve prevalecer sobre legado equivalente.');
assert.ok(hierarchy.get('oficial_legado').prioridade>hierarchy.get('terceiro_compativel').prioridade,'Conteúdo oficial legado não pode ser substituído por terceiro por identidade.');
assert.equal(hierarchy.get('demonstrativo_nao_canonico').prioridade,0,'Conteúdo demonstrativo deve permanecer sem precedência canônica.');

assert.equal(compatibility.ruleset_ativo,'5.5e');
assert.equal(compatibility.revisao_core_ativa,2024);
const precedence=compatibility.precedencia.join(' ');
assert.match(precedence,/Regras da Casa do Hub prevalecem/);
assert.match(precedence,/versão 5\.5e\/2024/);
assert.match(precedence,/Conteúdo 5e sem substituto 5\.5e permanece disponível/);

const dataFiles=['dados','cache']
  .filter(dir=>fs.existsSync(path.join(ROOT,dir)))
  .flatMap(dir=>walk(dir))
  .filter(file=>file.endsWith('.json'));
const scoped=new Set();
for(const domain of scope.dominios){
  for(const pattern of domain.fontes){
    const matches=expand(pattern,dataFiles);
    assert.ok(matches.length>0,`Fonte do escopo não corresponde a arquivo algum: ${pattern}`);
    for(const file of matches)scoped.add(file);
  }
}

const mappings=normative.mapeamentos;
assert.ok(Array.isArray(mappings)&&mappings.length>0,'Registro normativo sem mapeamentos.');
const usedMappings=new Set();
for(const file of [...scoped].sort()){
  const matches=mappings.filter(m=>globRegex(m.padrao).test(file));
  assert.equal(matches.length,1,`${file}: deve possuir exatamente uma autoridade normativa; encontradas ${matches.length}.`);
  const m=matches[0];usedMappings.add(m.padrao);
  assert.ok(hierarchy.has(m.autoridade),`${file}: autoridade desconhecida ${m.autoridade}.`);
  assert.ok(String(m.fonte||'').trim(),`${file}: fonte normativa não declarada.`);
  assert.ok(['arquivo','item'].includes(m.proveniencia),`${file}: modo de proveniência inválido.`);
  if(m.autoridade==='consolidado_misto')assert.equal(m.proveniencia,'item',`${file}: consolidado misto exige proveniência por item.`);
  if(m.autoridade==='derivado_localizacao'){
    const validLocalization=file.startsWith('dados/localizacao-')||file.startsWith('dados/classes-ptbr/');
    assert.ok(validLocalization,`${file}: derivado de localização usado fora de camada autorizada.`);
  }
}

for(const m of mappings){
  assert.ok(usedMappings.has(m.padrao),`Mapeamento normativo órfão ou fora do escopo de criação: ${m.padrao}`);
}

// Catálogo de armas: toda entrada consolidada conserva a fonte do item.
const weaponCache=readJson('cache/armas-catalogo.json');
assert.equal(weaponCache.schema,'hub-rpg/armas-catalogo-cache/v1');
assert.ok(scoped.has('cache/armas-catalogo.json'),'O catálogo de armas deve permanecer no escopo normativo.');
assert.ok(Array.isArray(weaponCache.itens)&&weaponCache.itens.length>0,'Catálogo de armas sem itens.');
assert.equal(weaponCache.controle?.quantidade,weaponCache.itens.length,'Controle de quantidade do catálogo inconsistente.');
const weaponSources=weaponCache.fontes;
assert.ok(weaponSources&&typeof weaponSources==='object'&&!Array.isArray(weaponSources)&&Object.keys(weaponSources).length>0,'Registro de fontes de armas ausente.');
for(const [i,item] of weaponCache.itens.entries()){
  assert.ok(typeof item.id==='string'&&item.id.trim(),`Arma ${i}: ID ausente.`);
  assert.ok(typeof item.fonte==='string'&&Object.prototype.hasOwnProperty.call(weaponSources,item.fonte),`Arma ${item.id}: fonte ausente ou desconhecida.`);
  const source=weaponSources[item.fonte];
  assert.ok(String(source.titulo||'').trim(),`Arma ${item.id}: fonte sem título.`);
  assert.ok(['5e','5.5e'].includes(source.ruleset),`Arma ${item.id}: ruleset da fonte desconhecido.`);
}

const quickstone=mappings.filter(m=>/quickstone/i.test(m.padrao));
assert.ok(quickstone.length>=3,'Quickstone deve estar explicitamente classificado nos domínios em que participa.');
assert.ok(quickstone.every(m=>m.autoridade==='terceiro_compativel'),'Frontiers of Eberron: Quickstone não pode ser promovido a fonte oficial.');

const closure=normative.criterio_fechamento||{};
for(const [key,value] of Object.entries(closure))assert.equal(value,0,`Critério de fechamento normativo deve exigir zero: ${key}`);

console.log(`Proveniência normativa fail-closed validada: ${scoped.size} fontes mecânicas classificadas em ${mappings.length} mapeamentos, sem fonte sem autoridade.`);
