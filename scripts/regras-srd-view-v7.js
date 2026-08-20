(()=>{
'use strict';

const VERSION='20260820-srd521-regras7';
const DDB_GLOSSARY='https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary';
const SRD_SOURCES=[
  'https://raw.githubusercontent.com/downfallx/dnd-5e-srd-markdown/1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4/rules-glossary.md',
  'https://cdn.jsdelivr.net/gh/downfallx/dnd-5e-srd-markdown@1b4b99dcb786cdd1a2fb26f8acec1551191f1ca4/rules-glossary.md',
  'https://raw.githubusercontent.com/downfallx/dnd-5e-srd-markdown/master/rules-glossary.md'
];

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const slug=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\[[^\]]+\]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
const originalFromHeading=h=>String(h||'').replace(/\s+\[(Action|Area of Effect|Attitude|Condition|Hazard)\]\s*$/i,'').trim();
const tagFromHeading=h=>((String(h||'').match(/\[(Action|Area of Effect|Attitude|Condition|Hazard)\]\s*$/i)||[])[1]||'').trim();
const familyPT=t=>({'Action':'Ação','Area of Effect':'Área de Efeito','Attitude':'Atitude','Condition':'Condição','Hazard':'Perigo'})[t]||'Regra Geral';

let PT_RULES=[],HOUSE=[],PATCHES=[],INDEX=null,SRD=[],DDB_ONLY=[],SRD_SOURCE='';

function extractEntries(markdown,knownOriginals){
  const lines=String(markdown||'').replace(/\r/g,'').split('\n'),starts=[];
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(/^####\s+(.+?)\s*$/);
    if(!m)continue;
    const heading=m[1].trim(),base=originalFromHeading(heading);
    if(knownOriginals.has(norm(base)))starts.push({heading,original:base,tag:tagFromHeading(heading)});
  }
  return starts;
}

function ptRule(original){return PT_RULES.find(x=>norm(x.original)===norm(original))||null}
function ddbAnchor(heading){return String(heading||'').replace(/[^A-Za-z0-9]/g,'')}
function buildIndexMaps(){
  const byOriginal=new Map();
  for(const row of INDEX?.entidades||[]){
    if(row?.original)byOriginal.set(`${row.modulo}|${norm(row.original)}`,row);
  }
  return {byOriginal};
}

function translatedBody(rule){
  if(!rule)return '<p class="muted">Sem tradução editorial local correspondente.</p>';
  const sections=(rule.secoes||[]).map(s=>`<section class="secao-regra"><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></section>`).join('');
  return `<p>${esc(rule.descricao)}</p>${sections}`;
}

function renderOfficial(entry,maps){
  const rule=ptRule(entry.original);
  const entity=maps.byOriginal.get(`Regras|${norm(entry.original)}`)||null;
  const patch=PATCHES.find(x=>norm(x.original)===norm(entry.original));
  const family=entry.tag?familyPT(entry.tag):(rule?.familia||'Regra Geral');
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(entry.original)}`;
  const ddb=`${DDB_GLOSSARY}#${ddbAnchor(entry.heading)}`;
  return `<details class="item srd-item" id="${esc(cardId)}" data-hub-original="${esc(entry.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}><summary><span><strong>${esc(rule?.nome||entry.original)}</strong><small class="original">${esc(entry.heading)}</small></span><span class="badge">${esc(family)}</span></summary><div class="corpo"><div class="source-strip"><span>SRD 5.2.1 · CC-BY-4.0</span><span>Tradução editorial PT-BR</span></div>${translatedBody(rule)}${patch?`<aside class="house-override"><strong>Precedência da Regra da Casa</strong><p>${esc(patch.descricao)}</p></aside>`:''}<div class="meta"><span><a href="${esc(ddb)}" target="_blank" rel="noopener noreferrer">D&D Beyond — Rules Glossary</a></span></div></div></details>`;
}

function renderSupplemental(rule,maps){
  const entity=maps.byOriginal.get(`Regras|${norm(rule.original)}`)||null;
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(rule.original)}`;
  const ddb=`${DDB_GLOSSARY}#${ddbAnchor(rule.original)}`;
  return `<details class="item ddb-only" id="${esc(cardId)}" data-hub-original="${esc(rule.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}><summary><span><strong>${esc(rule.nome)}</strong><small class="original">${esc(rule.original)}</small></span><span class="badge">${esc(rule.familia||'Regra Geral')}</span></summary><div class="corpo"><div class="source-strip"><span>D&D Beyond Basic Rules 2024</span><span>Referência oficial complementar</span></div><p class="copyright-note">Consulte a fonte oficial para a redação integral desta regra.</p><div class="meta"><span><a href="${esc(ddb)}" target="_blank" rel="noopener noreferrer">D&D Beyond — Rules Glossary</a></span></div></div></details>`;
}

function renderHouse(rule,maps){
  const entity=maps.byOriginal.get(`Regras|${norm(rule.original)}`)||null;
  const cardId=entity?`ref-${entity.id}`:`regra-${slug(rule.original)}`;
  const sections=(rule.secoes||[]).map(s=>`<section class="secao-regra"><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></section>`).join('');
  const fonte=rule.fonte||{};
  return `<details class="item house-item" id="${esc(cardId)}" data-hub-original="${esc(rule.original)}" ${entity?`data-hub-entity-id="${esc(entity.id)}"`:''}><summary><span><strong>${esc(rule.nome)}</strong><small class="original">${esc(rule.original)}</small></span><span class="badge">Regra da Casa</span></summary><div class="corpo"><p>${esc(rule.descricao)}</p>${sections}<div class="meta"><span><b>Fonte:</b> ${esc(fonte.livro||'Regra da Casa')}</span><span><b>Edição:</b> ${esc(fonte.edicao||'')}</span></div></div></details>`;
}

function allCards(){
  const maps=buildIndexMaps();
  return [
    ...SRD.map(x=>({kind:'srd',original:x.original,name:ptRule(x.original)?.nome||x.original,family:x.tag?familyPT(x.tag):(ptRule(x.original)?.familia||'Regra Geral'),html:renderOfficial(x,maps)})),
    ...DDB_ONLY.map(x=>({kind:'ddb',original:x.original,name:x.nome,family:x.familia||'Regra Geral',html:renderSupplemental(x,maps)})),
    ...HOUSE.map(x=>({kind:'house',original:x.original,name:x.nome,family:'Regra da Casa',html:renderHouse(x,maps)}))
  ];
}

function render(){
  const q=norm(document.getElementById('busca').value);
  const source=document.getElementById('fonte').value;
  const cards=allCards().filter(c=>(!q||norm(`${c.name} ${c.original} ${c.family}`).includes(q))&&(!source||c.kind===source));
  document.getElementById('resultado').textContent=`${cards.length} de ${SRD.length+DDB_ONLY.length+HOUSE.length} itens`;
  document.getElementById('lista').innerHTML=cards.map(c=>c.html).join('')||'<p class="muted">Nenhuma regra corresponde aos filtros.</p>';
  focusRequested();
}

function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');
  if(id){
    const el=document.querySelector(`[data-hub-entity-id="${CSS.escape(id)}"]`);
    if(el){
      if(el.tagName==='DETAILS')el.open=true;
      el.classList.add('hub-ref-target');
      setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80);
      return;
    }
  }
  if(location.hash){
    const el=document.querySelector(location.hash);
    if(el){
      if(el.tagName==='DETAILS')el.open=true;
      setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),40);
    }
  }
}

async function fetchRequired(url,type='json'){
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)throw new Error(`Falha de fonte HTTP ${r.status}: ${url}`);
  return type==='text'?r.text():r.json();
}

async function fetchOptionalJson(url){
  try{
    const r=await fetch(url,{cache:'no-store'});
    return r.ok?await r.json():null;
  }catch{return null}
}

async function fetchSrd(){
  const errors=[];
  for(const url of SRD_SOURCES){
    try{
      const r=await fetch(url,{cache:'no-store'});
      if(r.ok){SRD_SOURCE=url;return await r.text()}
      errors.push(`${r.status} ${url}`);
    }catch(e){errors.push(`${e?.message||e} ${url}`)}
  }
  throw new Error(`Não foi possível carregar o SRD 5.2.1. ${errors.join(' | ')}`);
}

async function load(){
  const partUrls=[1,2,3,4].map(n=>`dados/regras-atuais-ptbr.part${n}.txt?v=${VERSION}`);
  const [partTexts,hub,extra,markdown,index]=await Promise.all([
    Promise.all(partUrls.map(u=>fetchRequired(u,'text'))),
    fetchRequired(`dados/regras-hub.json?v=${VERSION}`),
    fetchRequired(`dados/regras-casa-adicionais.json?v=${VERSION}`),
    fetchSrd(),
    fetchOptionalJson(`dados/referencias-hub-index.json?v=${VERSION}`)
  ]);
  const data=JSON.parse(partTexts.join(''));
  INDEX=index||{entidades:[]};
  PT_RULES=[...(data.itens||[])];
  PATCHES=[...(hub.sobreposicoes||[])];
  HOUSE=[...(hub.itens||[]),...(extra.itens||[])];
  const known=new Set(PT_RULES.map(x=>norm(x.original)));
  SRD=extractEntries(markdown,known);
  const srdSet=new Set(SRD.map(x=>norm(x.original)));
  DDB_ONLY=PT_RULES.filter(x=>!srdSet.has(norm(x.original)));
  if(PT_RULES.length!==155)throw new Error(`Regras atuais inesperadas: ${PT_RULES.length}/155`);
  if(HOUSE.length!==4)throw new Error(`Regras da Casa inesperadas: ${HOUSE.length}/4`);
  if(SRD.length<130)throw new Error(`Extração SRD incompleta: ${SRD.length}`);
  render();
  document.documentElement.dataset.regrasFonte='srd-5.2.1';
  document.documentElement.dataset.regrasSrd=String(SRD.length);
  document.documentElement.dataset.regrasDdbComplementares=String(DDB_ONLY.length);
  document.documentElement.dataset.regrasCasa=String(HOUSE.length);
  document.documentElement.dataset.regrasIndice=INDEX?.entidades?.length?'disponivel':'fallback-local';
  document.documentElement.dataset.regrasSrdOrigem=SRD_SOURCE;
}

document.getElementById('busca').addEventListener('input',render);
document.getElementById('fonte').addEventListener('change',render);
load().catch(err=>{
  document.getElementById('resultado').textContent='Falha ao reconstruir o catálogo.';
  document.getElementById('lista').innerHTML=`<p class="erro"><strong>Falha:</strong> ${esc(err.message)}</p>`;
  console.error('[Regras SRD 5.2.1]',err);
});
})();
