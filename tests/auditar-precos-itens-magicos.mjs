import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9+]+/g,' ').trim().replace(/\s+/g,' ');

const manifest=json('dados/itens-magicos/manifest.json');
const sane=json('dados/itens-magicos/precos-sane.json');
const items=(manifest.chunks||[]).flatMap(json);

assert(manifest.schema==='hub-rpg/itens-magicos/v2','Manifesto de Itens Mágicos deve usar schema v2.');
assert(items.length===manifest.controle.quantidade,`Quantidade real/manifesto divergente: ${items.length}/${manifest.controle.quantidade}`);
assert(items.length===273,`Catálogo esperado com 273 itens; encontrou ${items.length}.`);
assert(new Set(items.map(x=>x.id)).size===items.length,'IDs duplicados no catálogo de Itens Mágicos.');
for(const item of items){
  for(const key of ['id','nome','nome_original','bloco','descricao','fonte']) assert(String(item[key]??'').trim(),`${item.id||item.nome}: campo obrigatório ausente: ${key}`);
  assert(manifest.fontes[item.fonte],`${item.id}: fonte desconhecida ${item.fonte}`);
}

const priceEntries=Object.entries(sane.precos||{});
assert(priceEntries.length===308,`Sane deve conter 308 linhas precificadas; encontrou ${priceEntries.length}.`);
const priceByNorm=new Map(priceEntries.map(([name,value])=>[norm(name),{name,value}]));
const noPriceByNorm=new Map((sane.nao_precificados||[]).map(name=>[norm(name),name]));
const coveredPriceRows=new Set;

function resolve(item){
  const original=String(item.nome_original||'');
  const aliases=sane.aliases?.[original];
  if(Array.isArray(aliases)&&aliases.length){
    for(const name of aliases){
      assert(Object.hasOwn(sane.precos,name),`${original}: alias Sane aponta para linha inexistente: ${name}`);
      coveredPriceRows.add(name);
    }
    return {kind:'priced',rows:aliases};
  }
  const exact=priceByNorm.get(norm(original));
  if(exact){coveredPriceRows.add(exact.name);return{kind:'priced',rows:[exact.name]}}
  const unpriced=sane.nao_precificados_aliases?.[original]||noPriceByNorm.get(norm(original));
  if(unpriced)return{kind:'unpriced',row:unpriced};
  return{kind:'not-in-guide'};
}

const status={priced:[],unpriced:[],['not-in-guide']:[]};
for(const item of items)status[resolve(item).kind].push(item);
assert(status.priced.length===235,`Itens com preço Sane: esperado 235; encontrou ${status.priced.length}.`);
assert(status.unpriced.length===24,`Itens deliberadamente sem preço: esperado 24; encontrou ${status.unpriced.length}.`);
assert(status['not-in-guide'].length===14,`Itens sem correspondência segura no guia: esperado 14; encontrou ${status['not-in-guide'].length}.`);

const uncovered=priceEntries.map(([name])=>name).filter(name=>!coveredPriceRows.has(name));
assert(!uncovered.length,`Linhas precificadas do Sane sem item/variante correspondente: ${uncovered.join('; ')}`);

const expectedNotInGuide=[
  'Armor of Vulnerability','Bag of Devouring','Bead of Nourishment','Berserker Axe',
  'Crystal Ball of Mind Reading','Crystal Ball of Telepathy','Crystal Ball of True Seeing',
  'Demon Armor','Dragon Orb','Energy Bow','Hat of Many Spells','Quarterstaff of the Acrobat',
  'Shield of the Cavalier','Thunderous Greatclub'
].sort();
const actualNotInGuide=status['not-in-guide'].map(x=>x.nome_original).sort();
assert(JSON.stringify(actualNotInGuide)===JSON.stringify(expectedNotInGuide),`Lista "não consta no guia" divergiu: ${actualNotInGuide.join('; ')}`);

const namedUnpriced=[
  'Candle of Invocation','Deck of Many Things','Efreeti Bottle','Iron Flask','Ring of Three Wishes',
  'Luck Blade','Well of Many Worlds','Wand of Wonder','Ring of Djinni Summoning','Bag of Tricks',
  'Tome of the Stilled Tongue','Belt of Giant Strength','Potion of Giant Strength','Rod of Resurrection',
  'Helm of Brilliance','Bag of Beans','Staff of the Magi','Manual of Golems'
];
assert(namedUnpriced.length===18,'Lista de itens especificamente não precificados deve conter 18 nomes.');
for(const sourceName of namedUnpriced){
  const represented=items.some(item=>{
    if(norm(item.nome_original)===norm(sourceName))return true;
    return sane.nao_precificados_aliases?.[item.nome_original]===sourceName;
  });
  assert(represented,`Item especificamente não precificado do Sane sem representação no Hub: ${sourceName}`);
}
assert(manifest.controle.precificacao_sane.itens_especificamente_nao_precificados===18,'Manifesto deve registrar 18 itens especificamente não precificados.');
assert((manifest.controle.precificacao_sane.categorias_nao_precificadas||[]).length===2,'Manifesto deve registrar as duas categorias não precificadas.');

const saneItems=items.filter(x=>x.fonte==='sane');
assert(saneItems.length===14,`Entradas referenciais Sane esperadas: 14; encontrou ${saneItems.length}.`);
assert(saneItems.filter(x=>resolve(x).kind==='priced').length===13,'Das entradas referenciais Sane, 13 devem ser precificadas.');
assert(saneItems.filter(x=>resolve(x).kind==='unpriced').length===1,'Das entradas referenciais Sane, 1 deve ser deliberadamente não precificada.');
for(const item of saneItems){
  assert(/não (?:foi|foram) inventad/i.test(item.descricao),`${item.nome_original}: entrada Sane deve declarar que mecânicas ausentes não foram inventadas.`);
}

const html=read('itens-magicos.html');
for(const token of ['dados/itens-magicos/precos-sane.json','precoSaneHtml','precoResumo','Sane — referência de preço','não precificado pelo guia','não consta no guia']){
  assert(html.includes(token),`UI de Itens Mágicos sem contrato Sane: ${token}`);
}

console.log(`Sane Magical Prices auditado: ${priceEntries.length} linhas de preço cobertas; ${status.priced.length} itens precificados, ${status.unpriced.length} sem preço por decisão do guia, ${status['not-in-guide'].length} sem correspondência segura e ${saneItems.length} entradas referenciais adicionadas.`);
