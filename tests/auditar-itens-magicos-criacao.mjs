import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const MANIFEST=path.join(ROOT,'dados','itens-magicos','manifest.json');
const SHOP=path.join(ROOT,'scripts','character-builder','wealth-purchase-ui.js');
const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const rarityHits=text=>{
  const normalized=fold(text),map={common:'common',comum:'common',uncommon:'uncommon',incomum:'uncommon',rare:'rare',raro:'rare','very rare':'very rare','muito raro':'very rare',legendary:'legendary',lendario:'legendary'},found=[];
  for(const m of normalized.matchAll(/(?:^|[^a-z])(very rare|muito raro|legendary|lendario|uncommon|incomum|rare|raro|common|comum)(?=[^a-z]|$)/g)){
    const key=map[m[1]];if(key&&!found.includes(key))found.push(key);
  }
  return found;
};
const runtimeRarities=item=>{
  const block=`${item?.bloco_original||''} ${item?.bloco||''}`,direct=rarityHits(block);
  if(direct.length)return direct;
  return /rarity varies|raridade variavel/.test(fold(block))?rarityHits(item?.descricao||''):[];
};

assert.ok(fs.existsSync(MANIFEST),'Manifesto de itens mágicos ausente.');
assert.ok(fs.existsSync(SHOP),'Runtime da loja de Riqueza por Nível ausente.');

const manifest=readJson(MANIFEST);
assert.equal(manifest.schema,'hub-rpg/itens-magicos/v1','Schema inesperado para itens mágicos.');
assert.equal(manifest.controle?.validado,true,'Catálogo de itens mágicos não está marcado como validado.');
assert.ok(Number.isInteger(manifest.controle?.quantidade)&&manifest.controle.quantidade>0,'Quantidade de itens inválida no manifesto.');
assert.ok(Array.isArray(manifest.chunks)&&manifest.chunks.length>0,'Manifesto não declara chunks.');

const diskChunks=fs.readdirSync(path.dirname(MANIFEST))
  .filter(name=>/^parte-\d{2}\.json$/.test(name))
  .sort()
  .map(name=>`dados/itens-magicos/${name}`);
assert.deepEqual(manifest.chunks,[...manifest.chunks].sort(),'Chunks do manifesto devem estar completos e em ordem determinística.');
assert.deepEqual(manifest.chunks,diskChunks,'Manifesto e arquivos de chunks no disco divergem.');

const ids=new Set(),rows=[];
for(const chunk of manifest.chunks){
  const file=path.join(ROOT,chunk);
  assert.ok(fs.existsSync(file),`Chunk declarado e ausente: ${chunk}`);
  const data=readJson(file);
  assert.ok(Array.isArray(data)&&data.length>0,`Chunk vazio ou inválido: ${chunk}`);
  for(const [index,item] of data.entries()){
    const where=`${chunk} #${index+1}`;
    assert.ok(item&&typeof item==='object',`${where}: item inválido.`);
    for(const field of ['id','nome','nome_original','bloco_original','descricao','fonte'])assert.ok(String(item[field]??'').trim(),`${where}: campo obrigatório ausente: ${field}`);
    assert.ok(!ids.has(item.id),`${where}: id duplicado: ${item.id}`);ids.add(item.id);
    assert.ok(['srd521','srd51'].includes(item.fonte),`${where}: fonte não autorizada: ${item.fonte}`);
    const rarities=runtimeRarities(item);
    assert.ok(rarities.length>0,`${where}: nenhuma raridade concreta é reconhecível pelo parser vigente da loja.`);
    for(const rarity of rarities)assert.ok(['common','uncommon','rare','very rare','legendary'].includes(rarity),`${where}: raridade normalizada inválida: ${rarity}`);
    rows.push(item);
  }
}

assert.equal(rows.length,manifest.controle.quantidade,'Quantidade real de itens diverge do manifesto.');
assert.equal(rows.filter(x=>x.fonte==='srd521').length,manifest.controle.srd521,'Quantidade SRD 5.2.1 diverge do manifesto.');
assert.equal(rows.filter(x=>x.fonte==='srd51').length,manifest.controle.srd51_legado_ativo,'Quantidade legada SRD 5.1 diverge do manifesto.');

const legacyOriginals=rows.filter(x=>x.fonte==='srd51').map(x=>x.nome_original).sort();
assert.deepEqual(legacyOriginals,[...(manifest.controle.legado_51_preservado||[])].sort(),'Itens legados ativos divergem da política declarada.');
const originals=new Set(rows.map(x=>x.nome_original));
for(const [oldName,currentName] of Object.entries(manifest.controle.equivalencias_legadas_substituidas||{})){
  assert.ok(!originals.has(oldName),`Equivalente legado deveria ter sido substituído: ${oldName}`);
  assert.ok(originals.has(currentName),`Substituto atual não encontrado: ${currentName}`);
}

const shop=fs.readFileSync(SHOP,'utf8');
assert.ok(shop.includes("json('dados/itens-magicos/manifest.json')"),'Loja não consome o manifesto de itens mágicos.');
assert.ok(/manifest\.chunks/.test(shop)&&/map\(path=>json\(path\)\)/.test(shop),'Loja não percorre mecanicamente todos os chunks declarados.');
assert.ok(/normalizeMagic/.test(shop)&&/MAGIC_PRICES/.test(shop),'Itens mágicos não estão integrados à normalização/preço da loja.');
assert.ok(/function rarityHits/.test(shop)&&/rarity varies\|raridade variavel/.test(shop),'Runtime não possui tratamento explícito e auditável para raridade variável.');

console.log(`Itens mágicos auditados: ${rows.length}/${manifest.controle.quantidade}; chunks ${manifest.chunks.length}/${diskChunks.length}; SRD 5.2.1 ${manifest.controle.srd521}; legado ativo ${manifest.controle.srd51_legado_ativo}.`);
