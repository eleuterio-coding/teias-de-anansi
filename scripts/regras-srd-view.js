(()=>{
'use strict';

const VERSION='20260820-srd521-regras2';
const SRD_RAW_URL='https://raw.githubusercontent.com/downfallx/dnd-5e-srd-markdown/1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4/rules-glossary.md';
const DDB_GLOSSARY='https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary';
const SRD_PAGE='https://www.dndbeyond.com/srd';
const SRD_PDF='https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf';
const LICENSE='https://creativecommons.org/licenses/by/4.0/legalcode';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const slug=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\[[^\]]+\]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
const originalFromHeading=h=>String(h||'').replace(/\s+\[(Action|Area of Effect|Attitude|Condition|Hazard)\]\s*$/i,'').trim();
const tagFromHeading=h=>((String(h||'').match(/\[(Action|Area of Effect|Attitude|Condition|Hazard)\]\s*$/i)||[])[1]||'').trim();
const familyPT=t=>({'Action':'Ação','Area of Effect':'Área de Efeito','Attitude':'Atitude','Condition':'Condição','Hazard':'Perigo'})[t]||'Regra Geral';

let LEGACY=[],HOUSE=[],PATCHES=[],INDEX=null,CURATED=null,SRD=[],SUPPLEMENTAL=[];

function rawText(md){
  const holder=document.createElement('div');
  holder.innerHTML=String(md||'').replace(/<br\s*\/?>/gi,'\n');
  return holder.textContent.replace(/[_*`>#]/g,'').replace(/\n{3,}/g,'\n\n').trim();
}

function extractEntries(markdown,knownOriginals){
  const lines=String(markdown||'').replace(/\r/g,'').split('\n');
  const starts=[];
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^####\s+(.+?)\s*$/);
    if(!m)continue;
    const heading=m[1].trim();
    const base=originalFromHeading(heading);
    if(knownOriginals.has(norm(base))) starts.push({i,heading,base,tag:tagFromHeading(heading)});
  }
  const entries=[];
  for(let k=0;k<starts.length;k++){
    const s=starts[k],end=k+1<starts.length?starts[k+1].i:lines.length;
    const body=lines.slice(s.i+1,end).join('\n').replace(/\n\* \* \*\s*$/,'').trim();
    entries.push({heading:s.heading,original:s.base,tag:s.tag,markdown:body});
  }
  return entries;
}

function seeAlso(entry,allOriginals){
  const plain=rawText(entry.markdown);
  const chunks=[];
  const rx=/See also\b([\s\S]*?)(?=\n\n|$)/gi;
  let m; while((m=rx.exec(plain))) chunks.push(m[0]);
  const joined=chunks.join(' ');
  const refs=[];
  for(const original of allOriginals){
    if(norm(original)===norm(entry.original))continue;
    const q=String(original).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(new RegExp(`(^|[^A-Za-z])${q}([^A-Za-z]|$)`,'i').test(joined)) refs.push(original);
  }
  return {texto:chunks.join(' '),refs};
}

function htmlSourceText(md){
  const text=rawText(md);
  return `<pre class="srd-raw">${esc(text)}</pre>`;
}

function ddbAnchor(heading){
  return String(heading||'').replace(/[^A-Za-z0-9]/g,'');
}

function indexMaps(){
  const byOriginal=new Map(),byId=new Map();
  for(const row of INDEX?.entidades||[]){
    if(row?.id)byId.set(row.id,row);
    if(row?.original)byOriginal.set(`${row.modulo}|${norm(row.original)}`,row);
  }
  return {byOriginal,byId};
}
function hrefFor(row){
  if(!row)return '#';
  if(row.modulo==='Regras')return `?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
  const base=row.url||'referencia.html';
  if(base==='referencia.html')return `referencia.html?id=${encodeURIComponent(row.id)}`;
  return `${base}?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
}
function parseCurated(spec,maps){
  const s=String(spec||'').trim(); if(!s)return null;
  if(!s.includes('::'))return maps.byOriginal.get(`Regras|${norm(s)}`)||null;
  const i=s.indexOf('::'),module=s.slice(0,i),value=s.slice(i+2);
  if(value.startsWith('#')){
    const row=maps.byId.get(value.slice(1)); return row?.modulo===module?row:null;
  }
  return maps.byOriginal.get(`${module}|${norm(value)}`)||null;
}

function ptRule(original){
  return LEGACY.find(x=>norm(x.original)===norm(original))||null;
}
function entityFor(original,maps){
  return maps.byOriginal.get(`Regras|${norm(original)}`)||null;
}

function officialRefs(entry,allOriginals){
  return seeAlso(entry,allOriginals);
}

function semanticRefs(original,officialRefsList,maps){
  const specs=CURATED?.regras?.[original]||[];
  const officialSet=new Set(officialRefsList.map(norm));
  const out=[],seen=new Set();
  for(const spec of specs){
    const row=parseCurated(spec,maps);
    if(!row||seen.has(row.id))continue;
    if(row.modulo==='Regras'&&officialSet.has(norm(row.original)))continue;
    seen.add(row.id);out.push(row);
  }
  return out;
}

function renderRefs(entry,maps,allOriginals){
  const off=officialRefs(entry,allOriginals);
  const ptByOriginal=new Map(LEGACY.map(x=>[norm(x.original),x.nome]));
  const officialLinks=off.refs.map(original=>{
    const row=entityFor(original,maps);
    const label=ptByOriginal.get(norm(original))||original;
    return row?`<a href="${esc(hrefFor(row))}">${esc(label)}</a>`:`<span>${esc(label)}</span>`;
  }).join(' · ');
  const semantic=semanticRefs(entry.original,off.refs,maps);
  const semanticLinks=semantic.map(row=>`<a href="${esc(hrefFor(row))}">${esc(row.nome)} <small>(${esc(row.modulo)})</small></a>`).join(' · ');
  return `
    <div class="refs">
      <p><strong>Veja também — SRD 5.2.1:</strong> ${officialLinks||'<span class="muted">nenhuma referência de glossário explícita</span>'}</p>
      ${off.texto?`<p class="see-text">${esc(off.texto)}</p>`:''}
      <p><strong>Referências adicionais do Hub:</strong> ${semanticLinks||'<span class="muted">nenhuma adicional</span>'}</p>
    </div>`;
}

function translatedBody(rule){
  if(!rule)return '<p class="muted">Sem tradução editorial local correspondente.</p>';
  const sections=(rule.secoes||[]).map(s=>`<section class="secao-regra"><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></section>`).join('');
  return `<p>${esc(rule.descricao)}</p>${sections}`;
}

function renderOfficial(entry,maps,allOriginals){
  const rule=ptRule(entry.original);
  const entity=entityFor(entry.original,maps);
  const patch=PATCHES.find(x=>norm(x.original)===norm(entry.original));
  const family=entry.tag?familyPT(entry.tag):(rule?.familia||'Regra Geral');
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(entry.original)}`;
  const ddb=`${DDB_GLOSSARY}#${ddbAnchor(entry.heading)}`;
  return `<details class="item srd-item" id="${esc(cardId)}" data-hub-original="${esc(entry.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}>
    <summary><span><strong>${esc(rule?.nome||entry.original)}</strong><small class="original">${esc(entry.heading)}</small></span><span class="badge">${esc(family)}</span></summary>
    <div class="corpo">
      <div class="source-strip"><span>SRD 5.2.1 · CC-BY-4.0</span><span>Tradução editorial PT-BR</span></div>
      ${translatedBody(rule)}
      ${patch?`<aside class="house-override"><strong>Precedência da Regra da Casa</strong><p>${esc(patch.descricao)}</p></aside>`:''}
      ${renderRefs(entry,maps,allOriginals)}
      <details class="srd-original"><summary>Texto original licenciado — SRD 5.2.1</summary>${htmlSourceText(entry.markdown)}</details>
      <div class="meta">
        <span><a href="${esc(ddb)}" target="_blank" rel="noopener noreferrer">D&D Beyond — Rules Glossary</a></span>
        <span><a href="${SRD_PDF}" target="_blank" rel="noopener noreferrer">SRD 5.2.1 oficial</a></span>
      </div>
    </div>
  </details>`;
}

function renderSupplemental(rule,maps){
  const entity=entityFor(rule.original,maps);
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(rule.original)}`;
  const ddb=`${DDB_GLOSSARY}#${ddbAnchor(rule.original)}`;
  const semantic=semanticRefs(rule.original,[],maps);
  const semanticLinks=semantic.map(row=>`<a href="${esc(hrefFor(row))}">${esc(row.nome)} <small>(${esc(row.modulo)})</small></a>`).join(' · ');
  return `<details class="item ddb-only" id="${esc(cardId)}" data-hub-original="${esc(rule.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}>
    <summary><span><strong>${esc(rule.nome)}</strong><small class="original">${esc(rule.original)}</small></span><span class="badge">${esc(rule.familia||'Regra Geral')}</span></summary>
    <div class="corpo">
      <div class="source-strip"><span>D&D Beyond Basic Rules 2024</span><span>Fora do Rules Glossary do SRD 5.2.1</span></div>
      <p class="copyright-note">O texto anterior desta regra permanece armazenado na Biblioteca, mas não é exibido aqui. Consulte a fonte oficial para a redação integral.</p>
      <div class="refs"><p><strong>Referências adicionais do Hub:</strong> ${semanticLinks||'<span class="muted">nenhuma adicional</span>'}</p></div>
      <div class="meta"><span><a href="${esc(ddb)}" target="_blank" rel="noopener noreferrer">Abrir no D&D Beyond</a></span></div>
    </div>
  </details>`;
}

function renderHouse(rule,maps){
  const entity=entityFor(rule.original,maps);
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(rule.original)}`;
  const sections=(rule.secoes||[]).map(s=>`<section class="secao-regra"><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></section>`).join('');
  const fonte=rule.fonte||{};
  return `<details class="item house-item" id="${esc(cardId)}" data-hub-original="${esc(rule.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}>
    <summary><span><strong>${esc(rule.nome)}</strong><small class="original">${esc(rule.original)}</small></span><span class="badge">Regra da Casa</span></summary>
    <div class="corpo"><p>${esc(rule.descricao)}</p>${sections}<div class="meta"><span><b>Fonte:</b> ${esc(fonte.livro||'Regra da Casa')}</span><span><b>Edição:</b> ${esc(fonte.edicao||'')}</span></div></div>
  </details>`;
}

function allCards(){
  const maps=indexMaps();
  const originals=SRD.map(x=>x.original);
  return [
    ...SRD.map(x=>({kind:'srd',original:x.original,name:ptRule(x.original)?.nome||x.original,family:x.tag?familyPT(x.tag):(ptRule(x.original)?.familia||'Regra Geral'),html:renderOfficial(x,maps,originals)})),
    ...SUPPLEMENTAL.map(x=>({kind:'ddb',original:x.original,name:x.nome,family:x.familia||'Regra Geral',html:renderSupplemental(x,maps)})),
    ...HOUSE.map(x=>({kind:'house',original:x.original,name:x.nome,family:'Regra da Casa',html:renderHouse(x,maps)}))
  ];
}

function render(){
  const q=norm(document.getElementById('busca').value);
  const source=document.getElementById('fonte').value;
  const family=document.getElementById('familia').value;
  const cards=allCards().filter(c=>(!q||norm(`${c.name} ${c.original} ${c.family}`).includes(q))&&(!source||c.kind===source)&&(!family||c.family===family));
  document.getElementById('resultado').textContent=`${cards.length} de ${SRD.length+SUPPLEMENTAL.length+HOUSE.length} itens`;
  document.getElementById('lista').innerHTML=cards.map(c=>c.html).join('')||'<p class="nota">Nenhuma regra corresponde aos filtros.</p>';
  focusRequested();
}

function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');
  if(!id)return;
  const el=document.querySelector(`[data-hub-entity-id="${CSS.escape(id)}"]`);
  if(!el)return;
  if(el.tagName==='DETAILS')el.open=true;
  el.classList.add('hub-ref-target');
  setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80);
}

async function load(){
  const partUrls=[1,2,3,4].map(n=>`dados/regras-dndbeyond-2024.part${n}.txt?v=${VERSION}`);
  const urls=[
    ...partUrls,
    `dados/regras-hub.json?v=${VERSION}`,
    `dados/regras-casa-adicionais.json?v=${VERSION}`,
    `dados/referencias-hub-index.json?v=${VERSION}`,
    `dados/referencias-regras-curadas.json?v=${VERSION}`,
    SRD_RAW_URL
  ];
  const rs=await Promise.all(urls.map(u=>fetch(u,{cache:'no-store'})));
  const bad=rs.find(r=>!r.ok); if(bad)throw new Error(`Falha de fonte HTTP ${bad.status}`);
  const partTexts=await Promise.all(rs.slice(0,4).map(r=>r.text()));
  const data=JSON.parse(partTexts.join(''));
  const hub=await rs[4].json(),extra=await rs[5].json();
  INDEX=await rs[6].json(); CURATED=await rs[7].json();
  const markdown=await rs[8].text();
  LEGACY=[...(data.itens||[])];
  PATCHES=[...(hub.sobreposicoes||[])];
  HOUSE=[...(hub.itens||[]),...(extra.itens||[])];
  const known=new Set(LEGACY.map(x=>norm(x.original)));
  SRD=extractEntries(markdown,known);
  const srdSet=new Set(SRD.map(x=>norm(x.original)));
  SUPPLEMENTAL=LEGACY.filter(x=>!srdSet.has(norm(x.original)));
  if(LEGACY.length!==155)throw new Error(`Regras oficiais legadas inesperadas: ${LEGACY.length}/155`);
  if(HOUSE.length!==4)throw new Error(`Regras da Casa inesperadas: ${HOUSE.length}/4`);
  if(SRD.length<130)throw new Error(`Extração SRD incompleta: ${SRD.length}`);
  document.getElementById('cont-srd').textContent=SRD.length;
  document.getElementById('cont-ddb').textContent=SUPPLEMENTAL.length;
  document.getElementById('cont-house').textContent=HOUSE.length;
  const families=[...new Set([...SRD.map(x=>x.tag?familyPT(x.tag):(ptRule(x.original)?.familia||'Regra Geral')),...SUPPLEMENTAL.map(x=>x.familia||'Regra Geral'),'Regra da Casa'])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  document.getElementById('familia').innerHTML='<option value="">Todas as famílias</option>'+families.map(f=>`<option>${esc(f)}</option>`).join('');
  render();
  document.documentElement.dataset.regrasFonte='srd-5.2.1';
  document.documentElement.dataset.regrasSrd=String(SRD.length);
  document.documentElement.dataset.regrasDdbComplementares=String(SUPPLEMENTAL.length);
  document.documentElement.dataset.regrasCasa=String(HOUSE.length);
}

document.getElementById('busca').addEventListener('input',render);
document.getElementById('fonte').addEventListener('change',render);
document.getElementById('familia').addEventListener('change',render);
load().catch(err=>{
  document.getElementById('resultado').textContent='Falha ao reconstruir o catálogo.';
  document.getElementById('lista').innerHTML=`<p class="erro"><strong>Falha:</strong> ${esc(err.message)}</p>`;
  console.error('[Regras SRD 5.2.1]',err);
});
})();