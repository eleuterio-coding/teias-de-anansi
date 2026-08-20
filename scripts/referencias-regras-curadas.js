(()=>{
'use strict';
const VERSION='20260820-regras-curadas1';
const INDEX_URL=`dados/referencias-hub-index.json?v=${VERSION}`;
const CURATED_URL=`dados/referencias-regras-curadas.json?v=${VERSION}`;
const ENTITY_SELECTOR='details.item[data-hub-original]';
const SKIP='script,style,noscript,textarea,input,select,option,button,a,.hub-ref,.hub-ref-list,.meta,.badge,summary,h1,h2,h3,h4,h5,h6,nav,header,footer,.controles,pre,code';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isWord=c=>c&&/[\p{L}\p{N}_]/u.test(c);
const escAttr=s=>CSS.escape(String(s));
const EXTRA_ALIASES={
  'Saving Throw':['salvaguarda','salvaguardas','teste de resistência','testes de resistência'],
  'Ability Check':['teste de atributo','testes de atributo'],
  'Attack Roll':['jogada de ataque','jogadas de ataque'],
  'D20 Test':['teste de d20','testes de d20'],
  'Hit Points':['pontos de vida','pv'],
  'Hit Point Dice':['dados de vida'],
  'Armor Class':['classe de armadura','ca'],
  'Difficulty Class':['classe de dificuldade','cd'],
  'Spell':['magia','magias'],
  'Skill':['perícia','perícias','atletismo','acrobacia','furtividade','intuição','medicina','percepção','sobrevivência','arcanismo','história','investigação','natureza','religião'],
  'Ability Score and Modifier':['força','destreza','constituição','inteligência','sabedoria','carisma'],
  'Damage Types':['tipos de dano','tipo de dano'],
  'Action':['ação','ações'],
  'Bonus Action':['ação bônus','ações bônus'],
  'Reaction':['reação','reações'],
  'Condition':['condição','condições'],
  'Speed':['velocidade','velocidades']
};
let index=null,curated=null,byId=new Map(),byOriginal=new Map(),ambiguousTerms=new Set(),scheduled=false,observer=null;

function originalKey(moduleName,original){return `${moduleName}|${norm(original)}`}
function hrefFor(row){
  const base=row.url||'referencia.html';
  if(base==='referencia.html')return `referencia.html?id=${encodeURIComponent(row.id)}`;
  return `${base}?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
}
function parseTarget(spec){
  const s=String(spec||'').trim();
  if(!s)return null;
  if(!s.includes('::'))return {module:'Regras',mode:'original',value:s};
  const i=s.indexOf('::'),module=s.slice(0,i),value=s.slice(i+2);
  return value.startsWith('#')?{module,mode:'id',value:value.slice(1)}:{module,mode:'original',value};
}
function resolveTarget(spec){
  const p=parseTarget(spec);if(!p)return null;
  if(p.mode==='id'){const row=byId.get(p.value);return row?.modulo===p.module?row:null}
  return byOriginal.get(originalKey(p.module,p.value))||null;
}
function termsFor(row){
  const vals=[...(row.aliases||[]),row.nome,row.original,...(EXTRA_ALIASES[row.original]||[])];
  const seen=new Set(),out=[];
  for(const raw of vals){
    const t=norm(raw);if(t.length<2||seen.has(t)||ambiguousTerms.has(t))continue;
    seen.add(t);out.push(t);
  }
  return out.sort((a,b)=>b.length-a.length);
}
function foldWithMap(text){
  let folded='',starts=[],ends=[];
  for(let i=0;i<text.length;){
    const cp=text.codePointAt(i),ch=String.fromCodePoint(cp),next=i+ch.length;
    const f=ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    for(const fc of f){folded+=fc;starts.push(i);ends.push(next)}
    i=next;
  }
  return {folded,starts,ends};
}
function findMatches(text,targets){
  const map=foldWithMap(text),n=map.folded,candidates=[];
  for(const row of targets){
    for(const term of termsFor(row)){
      let from=0;
      while(from<n.length){
        const pos=n.indexOf(term,from);if(pos<0)break;
        const end=pos+term.length;
        if((pos===0||!isWord(n[pos-1]))&&(end===n.length||!isWord(n[end]))){
          const startReal=map.starts[pos],endReal=map.ends[end-1];
          if(Number.isInteger(startReal)&&Number.isInteger(endReal))candidates.push({start:startReal,end:endReal,row,term});
        }
        from=pos+Math.max(1,term.length);
      }
    }
  }
  candidates.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
  const out=[];let cursor=-1;
  for(const c of candidates){if(c.start<cursor)continue;out.push(c);cursor=c.end}
  return out;
}
function linkTextNode(node,targets){
  if(!node.nodeValue?.trim()||node.parentElement?.closest(SKIP))return;
  const matches=findMatches(node.nodeValue,targets);if(!matches.length)return;
  const frag=document.createDocumentFragment();let p=0;
  for(const m of matches){
    if(m.start>p)frag.append(document.createTextNode(node.nodeValue.slice(p,m.start)));
    const a=document.createElement('a');a.className='hub-ref';a.href=hrefFor(m.row);a.dataset.refId=m.row.id;
    a.title=`Abrir ${m.row.nome} — ${m.row.modulo}`;a.textContent=node.nodeValue.slice(m.start,m.end);
    frag.append(a);p=m.end;
  }
  if(p<node.nodeValue.length)frag.append(document.createTextNode(node.nodeValue.slice(p)));
  node.replaceWith(frag);
}
function decorateRule(el){
  const original=el.dataset.hubOriginal;
  const origin=byOriginal.get(originalKey('Regras',original));
  if(!origin)throw new Error(`Origem de Regras não indexada: ${original}`);
  el.dataset.hubEntityId=origin.id;
  el.id=`ref-${origin.id}`;
  const specs=curated.regras?.[original];
  if(!Array.isArray(specs))throw new Error(`Regra sem auditoria curada: ${original}`);
  const targets=[];const seen=new Set();
  for(const spec of specs){
    const row=resolveTarget(spec);
    if(!row)throw new Error(`Destino curado inválido: ${original} -> ${spec}`);
    if(row.id===origin.id)throw new Error(`Autorreferência proibida: ${original}`);
    if(seen.has(row.id))throw new Error(`Referência duplicada: ${original} -> ${spec}`);
    seen.add(row.id);targets.push(row);
  }
  return {origin,targets};
}
function addReferenceList(el,targets){
  if(el.querySelector(':scope .hub-ref-list')||!targets.length)return;
  const corpo=el.querySelector(':scope > .corpo');if(!corpo)return;
  const box=document.createElement('nav');box.className='hub-ref-list';box.setAttribute('aria-label','Referências Cruzadas Semânticas');
  const label=document.createElement('span');label.className='hub-ref-list-label';label.textContent='Referências cruzadas: ';box.append(label);
  targets.forEach((row,i)=>{
    if(i)box.append(document.createTextNode(' · '));
    const a=document.createElement('a');a.className='hub-ref';a.href=hrefFor(row);a.dataset.refId=row.id;
    a.title=`Abrir ${row.nome} — ${row.modulo}`;a.textContent=row.nome;box.append(a);
  });
  const meta=corpo.querySelector(':scope > .meta');if(meta)corpo.insertBefore(box,meta);else corpo.append(box);
}
function processRule(el){
  if(el.dataset.hubCuratedDone==='1')return;
  const {targets}=decorateRule(el);
  const corpo=el.querySelector(':scope > .corpo');
  if(corpo&&targets.length){
    const walker=document.createTreeWalker(corpo,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const n of nodes)linkTextNode(n,targets);
  }
  addReferenceList(el,targets);
  el.dataset.hubCuratedDone='1';
}
function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');if(!id)return;
  const el=document.querySelector(`[data-hub-entity-id="${escAttr(id)}"]`);if(!el)return;
  if(el.tagName==='DETAILS')el.open=true;el.classList.add('hub-ref-target');
  if(!el.dataset.refFocused){el.dataset.refFocused='1';setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80)}
}
function process(){
  const rows=[...document.querySelectorAll(ENTITY_SELECTOR)];
  for(const el of rows)processRule(el);
  focusRequested();
}
function startObserver(){if(observer)observer.observe(document.getElementById('lista')||document.body,{childList:true,subtree:true})}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer?.disconnect();process();startObserver()})}
async function init(){
  try{
    const [ir,cr]=await Promise.all([fetch(INDEX_URL,{cache:'no-store'}),fetch(CURATED_URL,{cache:'no-store'})]);
    if(!ir.ok)throw new Error(`Índice semântico HTTP ${ir.status}`);
    if(!cr.ok)throw new Error(`Matriz curada HTTP ${cr.status}`);
    index=await ir.json();curated=await cr.json();
    ambiguousTerms=new Set((index.ambiguos||[]).map(x=>norm(x?.termo)).filter(Boolean));
    if(curated.schema!=='hub-rpg.referencias-regras-curadas.v1'||curated.total_regras!==159||curated.total_referencias!==390)throw new Error('Metadados da auditoria curada divergentes.');
    byId=new Map((index.entidades||[]).filter(r=>r?.id).map(r=>[r.id,r]));
    byOriginal=new Map();
    for(const row of index.entidades||[]){
      if(!row?.original)continue;
      const key=originalKey(row.modulo,row.original);
      if(byOriginal.has(key)&&byOriginal.get(key).id!==row.id)throw new Error(`Original ambíguo no índice: ${key}`);
      byOriginal.set(key,row);
    }
    const magic=byOriginal.get(originalKey('Regras','Magic')),spell=byOriginal.get(originalKey('Regras','Spell'));
    if(!magic||!spell||magic.id===spell.id)throw new Error('Identidades Magic/Spell não foram separadas.');
    const style=document.createElement('style');
    style.textContent='.hub-ref{font-weight:inherit;color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.hub-ref:hover{text-decoration-style:solid}.hub-ref-list{border-top:1px solid #8883;margin-top:14px;padding-top:10px;font-size:.9rem}.hub-ref-list-label{font-weight:600}.hub-ref-target{outline:2px solid currentColor;outline-offset:4px;border-radius:8px}';
    document.head.append(style);
    process();observer=new MutationObserver(schedule);startObserver();
    document.documentElement.dataset.hubReferencias='curadas';
    document.documentElement.dataset.hubReferenciasVersao=VERSION;
    document.documentElement.dataset.hubReferenciasRegras=String(curated.total_regras);
    document.documentElement.dataset.hubReferenciasTotal=String(curated.total_referencias);
  }catch(e){
    document.documentElement.dataset.hubReferencias='erro';
    console.error('[Hub referências curadas — Regras]',e);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
