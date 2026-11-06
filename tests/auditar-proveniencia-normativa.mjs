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
    const validLocalization=file.startsWith('dados/localizacao-')||file.startsWith('dados/classes-ptbr/')
      ||/^dados\/magias-ptbr-srd-2024-revisado(?:-lote(?:[2-9]|1[0-6]))?\.json$/.test(file)
      ||file==='dados/magias-traducoes-srd-verificadas.json'
      ||file==='dados/regras-termos-complementares.json';
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

// Catálogo de magias: não atribuir autoridade ao conjunto sem proveniência individual.
const spellCatalog=readJson('dados/catalogo-magias-20261104.json');
assert.equal(spellCatalog.schema,'hub-rpg/catalogo-magias-20261104/v1');
assert.ok(scoped.has('dados/catalogo-magias-20261104.json'),'O catálogo de magias deve permanecer no escopo normativo.');
assert.ok(Array.isArray(spellCatalog.itens)&&spellCatalog.itens.length>0,'Catálogo de magias vazio.');
assert.equal(spellCatalog.total,spellCatalog.itens.length,'Total declarado de magias inconsistente.');
const spellIds=new Set();
for(const [i,item] of spellCatalog.itens.entries()){
  assert.ok(typeof item.id==='string'&&item.id.trim(),`Magia ${i}: ID ausente.`);
  assert.ok(typeof item.nome==='string'&&item.nome.trim(),`Magia ${item.id}: nome ausente.`);
  assert.ok(typeof item.livro==='string'&&item.livro.trim(),`Magia ${item.id}: fonte editorial ausente.`);
  assert.ok(!spellIds.has(item.id),`Magia ${item.id}: ID duplicado.`);
  spellIds.add(item.id);
}

// Resumos editoriais não substituem texto canônico: proveniência por resumo obrigatória.
const editorialSummaries=readJson('dados/magias-en-resumos-editoriais-20261029.json');
assert.equal(editorialSummaries.schema,'hub-rpg.magias-en-editoriais.v1');
assert.ok(scoped.has('dados/magias-en-resumos-editoriais-20261029.json'),'Os resumos editoriais devem permanecer no escopo de proveniência.');
assert.match(editorialSummaries.politica,/NÃO são transcrições integrais/);
assert.match(editorialSummaries.politica,/texto SRD permanece no catálogo canônico/);
assert.equal(editorialSummaries.total,Object.keys(editorialSummaries.itens||{}).length,'Total de resumos editoriais divergente.');
assert.ok(editorialSummaries.total>0,'Os resumos editoriais não podem ficar vazios.');
const editorialTypes=new Set(['resumo_editorial_conferido','traducao_resumo_editorial','traducao_resumo_mecanico']);
for(const [name,item] of Object.entries(editorialSummaries.itens)){
  assert.ok(name.trim(),`Resumo editorial sem nome.`);
  assert.ok(typeof item.descricao==='string'&&item.descricao.trim(),`Resumo editorial ${name}: descrição ausente.`);
  assert.ok(editorialTypes.has(item.tipo),`Resumo editorial ${name}: tipo desconhecido.`);
  assert.ok(typeof item.fonte==='string'&&item.fonte.trim(),`Resumo editorial ${name}: fonte ausente.`);
  assert.ok(['5e','5.5e'].includes(item.edicao),`Resumo editorial ${name}: edição inválida.`);
}
const editorialAuthority=mappings.find(m=>m.padrao==='dados/magias-en-resumos-editoriais-20261029.json');
assert.equal(editorialAuthority.autoridade,'demonstrativo_nao_canonico','Resumos editoriais não podem adquirir precedência normativa.');
assert.equal(editorialAuthority.proveniencia,'item','Cada resumo editorial precisa de proveniência individual.');

// Fontes heterogêneas só são classificadas conforme esquema e evidência documental.
const phbIndex=readJson('dados/magias-phb-2024-indice.json');
assert.equal(phbIndex.schema,'hub-rpg.magias.phb-2024.indice.v1');
assert.equal(phbIndex.total,phbIndex.itens?.length,'Índice PHB: contagem declarada divergente.');
assert.ok(phbIndex.itens.length>0,'Índice PHB vazio.');
assert.match(phbIndex.fonte?.nota||'',/OCR com erros/,'O índice deve declarar as limitações de extração.');
assert.ok(phbIndex.itens.every(i=>i.id&&i.fonte==='phb-2024'&&i.pagina_fonte&&i.pdf_origem&&i.texto_integral_publicavel===false&&['indice_verificado','nivel_escola_extraidos_ocr'].includes(i.completude)),'Índice PHB: metadados de origem/verificação ausentes ou texto integral marcado como publicável.');
assert.equal(mappings.find(m=>m.padrao==='dados/magias-phb-2024-indice.json')?.autoridade,'demonstrativo_nao_canonico','Índice OCR parcial não pode virar fonte canônica.');

// Lotes SRD: verificam metadados e integridade textual, não alegam conferir a tradução com o SRD.
const srdTranslationFiles=[...scoped].filter(file=>/^dados\/magias-ptbr-srd-2024-revisado(?:-lote(?:[2-9]|1[0-6]))?\.json$/.test(file)).sort();
assert.equal(srdTranslationFiles.length,16,'Lotes SRD de tradução incompletos ou não previstos.');
for(const file of srdTranslationFiles){
  const layer=readJson(file);
  assert.match(layer.schema||'',/^hub-rpg\.magias\.srd2024-traducao-editorial\.v(?:[1-9]|1[0-6])$/);
  assert.match(String(layer.base||layer.fonte||''),/SRD 5\.2\.1/,'A localização deve declarar a fonte SRD 5.2.1.');
  assert.equal(layer.total,Object.keys(layer.descricoes||{}).length,`${file}: total de traduções divergente.`);
  assert.ok(layer.total>0,`${file}: lote de traduções vazio.`);
  for(const [name,entry] of Object.entries(layer.descricoes)){
    assert.ok(name.trim(),`${file}: magia sem nome de origem.`);
    const description=typeof entry==='string'?entry:entry?.descricao;
    assert.ok(typeof description==='string'&&description.trim(),`${file}: tradução vazia para ${name}.`);
  }
}
assert.equal(mappings.find(m=>m.padrao==='dados/magias-ptbr-srd-2024-revisado*.json')?.autoridade,'derivado_localizacao','Traduções editoriais não criam regras mecânicas próprias.');

const verifiedTranslations=readJson('dados/magias-traducoes-srd-verificadas.json');
assert.equal(verifiedTranslations.schema,'hub-rpg.magias-traducao-verificada.v1');
assert.match(verifiedTranslations.base||'',/SRD 5\.2\.1/);
assert.match(verifiedTranslations.licenca_traducao||'',/MIT/);
assert.match(verifiedTranslations.commit_origem||'',/^[0-9a-f]{40}$/);
assert.equal(verifiedTranslations.total,Object.keys(verifiedTranslations.descricoes||{}).length);
assert.ok(verifiedTranslations.total>0);
assert.ok(Object.entries(verifiedTranslations.descricoes).every(([name,text])=>name.trim()&&typeof text==='string'&&text.trim()),'Traduções verificadas: entrada sem texto ou nome.');
assert.equal(mappings.find(m=>m.padrao==='dados/magias-traducoes-srd-verificadas.json')?.autoridade,'derivado_localizacao');

// PDFs de usuário: arquivos auxiliares, sem promover extração textual a regra oficial.
const tashaProvided=readJson('dados/magias-tasha-usuario.json');
assert.equal(tashaProvided.schema,'hub-rpg/tasha-2020-transcricao-fornecida-v1');
assert.match(tashaProvided.politica||'',/fornecido pelo usuário/);
assert.equal(tashaProvided.total_magias,tashaProvided.itens?.length);
assert.ok(tashaProvided.itens.length>0);
assert.ok(tashaProvided.itens.every(i=>i.id&&i.name&&typeof i.description==='string'&&i.description.trim()),'Tasha: magia transcrita sem ID, nome ou descrição.');
const xanatharProvided=readJson('dados/magias-xanathar-usuario.json');
assert.equal(xanatharProvided.schema,'teias-de-anansi/xanathar-texto-fornecido-v1');
assert.match(xanatharProvided.origem||'',/PDF fornecido pelo usuário/);
assert.equal(xanatharProvided.total,xanatharProvided.itens?.length);
assert.ok(xanatharProvided.itens.length>0);
assert.ok(xanatharProvided.itens.every(i=>i.nome_original&&typeof i.descricao_original_en==='string'&&i.descricao_original_en.trim()),'Xanathar: nome ou descrição transcritos ausentes.');
for(const file of ['dados/magias-tasha-usuario.json','dados/magias-xanathar-usuario.json']){
  assert.equal(mappings.find(m=>m.padrao===file)?.autoridade,'demonstrativo_nao_canonico',`${file}: transcrição não verificada não deve ter autoridade canônica.`);
}

const glossary=readJson('dados/regras-termos-complementares.json');
assert.equal(glossary.schema,'hub-rpg/termos-regras/v1');
assert.match(glossary.fonte||'',/Livro do Jogador/);
assert.ok(Array.isArray(glossary.itens)&&glossary.itens.length>0);
assert.ok(glossary.itens.every(i=>i.original?.trim()&&i.nome?.trim()&&i.familia?.trim()&&i.descricao?.trim()),'Glossário: termo editorial incompleto.');
assert.equal(mappings.find(m=>m.padrao==='dados/regras-termos-complementares.json')?.autoridade,'derivado_localizacao','Glossário não pode ter autoridade mecânica.');

// Um mapeamento inexistente continua sendo erro; a fonte órfã já foi retirada do registro.
assert.ok(!mappings.some(m=>m.padrao==='dados/equipamentos-aventura-pdfs.json'),'Registro não deve apontar a arquivo de equipamentos inexistente.');

const quickstone=mappings.filter(m=>/quickstone/i.test(m.padrao));
assert.ok(quickstone.length>=3,'Quickstone deve estar explicitamente classificado nos domínios em que participa.');
assert.ok(quickstone.every(m=>m.autoridade==='terceiro_compativel'),'Frontiers of Eberron: Quickstone não pode ser promovido a fonte oficial.');

const closure=normative.criterio_fechamento||{};
for(const [key,value] of Object.entries(closure))assert.equal(value,0,`Critério de fechamento normativo deve exigir zero: ${key}`);

console.log(`Proveniência normativa fail-closed validada: ${scoped.size} fontes mecânicas classificadas em ${mappings.length} mapeamentos, sem fonte sem autoridade.`);
