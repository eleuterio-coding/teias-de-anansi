(()=>{
'use strict';
const VERSION='20260819-refs3';
const INDEX_URL=`dados/referencias-hub-index.json?v=${VERSION}`;
const SKIP='script,style,noscript,textarea,input,select,option,button,a,.hub-ref,.meta,.badge,summary,h1,h2,h3,h4,h5,h6,nav,header,footer,.controles,pre,code';
const ENTITY_SELECTOR='details,article.item,article.card,section.art,.card,.item-card,[data-item],[data-entity],[data-id]';
const PAGE_MODULE_OVERRIDES={
  'classes-v2.html':'Classes','classes-v3.html':'Classes','biblioteca.html':null,'biblioteca-legado.html':null,'bibliotecas.html':null
};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isWord=c=>c&&/[\p{L}\p{N}_]/u.test(c);
const escAttr=s=>CSS.escape(String(s));
let index=null,trie=null,scheduled=false,observer=null,pageModule=null;

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
function dedupeRows(rows){
  const seen=new Set(),out=[];
  for(const r of rows||[]){if(!r?.id||seen.has(r.id))continue;seen.add(r.id);out.push(r)}
  return out;
}
function rankRow(r){
  let score=Number(r?.prioridade||0);
  if(r?.status==='publicado')score+=100;
  if(r?.modulo==='Regras'&&String(r?.fonte_arquivo||'').includes('regras-dndbeyond-2024'))score+=80;
  if(r?.status==='pendente')score-=20;
  return score;
}
function chooseBest(rows){
  const list=dedupeRows(rows).sort((a,b)=>rankRow(b)-rankRow(a));
  if(!list.length)return null;
  if(list.length===1)return list[0];
  return rankRow(list[0])>rankRow(list[1])?list[0]:null;
}
function buildTrie(rows,aliasRows){
  const byId=new Map(rows.map(r=>[r.id,r]));
  const candidates=new Map();
  for(const row of rows){
    for(const raw of row.aliases||[row.nome]){
      const term=norm(raw);if(term.length<3)continue;
      if(!candidates.has(term))candidates.set(term,[]);
      candidates.get(term).push(row);
    }
  }
  const resolved=new Map();
  for(const a of aliasRows||[]){if(byId.has(a.id))resolved.set(norm(a.termo),a.id)}
  const root={n:new Map(),term:null};
  for(const term of candidates.keys()){
    let node=root;
    for(const ch of term){if(!node.n.has(ch))node.n.set(ch,{n:new Map(),term:null});node=node.n.get(ch)}
    node.term=term;
  }
  return {root,byId,candidates,resolved};
}
function moduleFromPage(){
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(Object.prototype.hasOwnProperty.call(PAGE_MODULE_OVERRIDES,file))return PAGE_MODULE_OVERRIDES[file];
  for(const [m,url] of Object.entries(index?.modulos||{})){if(String(url).toLowerCase()===file)return m}
  const h1=norm(document.querySelector('h1')?.textContent||'');
  for(const m of Object.keys(index?.modulos||{})){if(norm(m)===h1)return m}
  return null;
}
function hrefFor(row){
  const base=row.url||'referencia.html';
  if(base==='referencia.html')return `referencia.html?id=${encodeURIComponent(row.id)}`;
  return `${base}?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
}
function candidateLabel(el){
  return (el?.querySelector?.('summary strong,summary .nome,summary,h2,h3,.nome,.title,[data-name]')?.textContent||'').trim();
}
function normalizeLabel(v){return norm(String(v||'').replace(/\s+[—–-].*$/,''));}
function resolveEntityForLabel(label,moduleHint){
  const term=norm(label);if(!term)return null;
  const rows=dedupeRows(trie.candidates.get(term)||[]);
  if(moduleHint){
    const same=rows.filter(r=>r.modulo===moduleHint);
    const best=chooseBest(same);if(best)return best;
  }
  const rid=trie.resolved.get(term);
  if(rid&&trie.byId.has(rid))return trie.byId.get(rid);
  return chooseBest(rows);
}
function decorateEntities(){
  for(const el of document.querySelectorAll(ENTITY_SELECTOR)){
    if(el.dataset.hubEntityId)continue;
    const label=candidateLabel(el);if(!label)continue;
    const row=resolveEntityForLabel(label,pageModule);if(!row)continue;
    el.dataset.hubEntityId=row.id;
    if(!el.id)el.id=`ref-${row.id}`;
  }
}
function contextForNode(node){
  const host=node.parentElement?.closest('[data-hub-entity-id]');
  if(host){
    const row=trie.byId.get(host.dataset.hubEntityId)||null;
    return {host,row,selfId:row?.id||null,selfTerms:new Set((row?.aliases||[row?.nome]).map(norm)),label:normalizeLabel(candidateLabel(host))};
  }
  const container=node.parentElement?.closest(ENTITY_SELECTOR);
  if(!container)return {host:null,row:null,selfId:null,selfTerms:new Set(),label:''};
  const label=candidateLabel(container),row=resolveEntityForLabel(label,pageModule);
  if(row){container.dataset.hubEntityId=row.id;if(!container.id)container.id=`ref-${row.id}`}
  return {host:container,row,selfId:row?.id||null,selfTerms:new Set((row?.aliases||[row?.nome]).map(norm)),label:normalizeLabel(label)};
}
function chooseTarget(term,ctx){
  if(!term)return null;
  if(ctx.selfTerms.has(term)||ctx.label===term)return null;
  const resolvedId=trie.resolved.get(term);
  if(resolvedId){
    if(resolvedId===ctx.selfId)return null;
    const r=trie.byId.get(resolvedId);if(r)return r;
  }
  let rows=dedupeRows(trie.candidates.get(term)||[]);
  if(!rows.length)return null;
  if(ctx.selfId&&rows.some(r=>r.id===ctx.selfId))return null;
  rows=rows.filter(r=>r.id!==ctx.selfId);
  const published=rows.filter(r=>r.status==='publicado');if(published.length)rows=published;
  const rules=rows.filter(r=>r.modulo==='Regras');
  const bestRule=chooseBest(rules);if(bestRule)return bestRule;
  if(pageModule){const local=rows.filter(r=>r.modulo===pageModule);const bestLocal=chooseBest(local);if(bestLocal)return bestLocal}
  return chooseBest(rows);
}
function findMatches(text,ctx){
  const map=foldWithMap(text),n=map.folded,out=[];let i=0;
  while(i<n.length){
    if(i>0&&isWord(n[i-1])){i++;continue}
    let node=trie.root,j=i,last=null;
    while(j<n.length&&node.n.has(n[j])){
      node=node.n.get(n[j]);j++;
      if(node.term&&(j===n.length||!isWord(n[j])))last={end:j,term:node.term};
    }
    if(last){
      const row=chooseTarget(last.term,ctx);
      if(row){
        const start=map.starts[i],end=map.ends[last.end-1];
        if(Number.isInteger(start)&&Number.isInteger(end))out.push({start,end,row});
      }
      i=last.end;
    }else i++;
  }
  return out;
}
function linkTextNode(node){
  if(!node.nodeValue?.trim()||node.parentElement?.closest(SKIP))return;
  const ctx=contextForNode(node),matches=findMatches(node.nodeValue,ctx);if(!matches.length)return;
  const frag=document.createDocumentFragment();let p=0;
  for(const m of matches){
    if(m.start>p)frag.append(document.createTextNode(node.nodeValue.slice(p,m.start)));
    const a=document.createElement('a');a.className='hub-ref';a.href=hrefFor(m.row);a.dataset.refId=m.row.id;
    a.title=`Abrir ${m.row.nome} — ${m.row.modulo}`;a.textContent=node.nodeValue.slice(m.start,m.end);frag.append(a);p=m.end;
  }
  if(p<node.nodeValue.length)frag.append(document.createTextNode(node.nodeValue.slice(p)));
  node.replaceWith(frag);
}
function unwrapLink(a){a.replaceWith(document.createTextNode(a.textContent||''))}
function purgeSelfLinks(){
  for(const a of document.querySelectorAll('a.hub-ref[data-ref-id]')){
    const host=a.parentElement?.closest('[data-hub-entity-id]');
    if(host?.dataset.hubEntityId===a.dataset.refId){unwrapLink(a);continue}
    const container=a.parentElement?.closest(ENTITY_SELECTOR),label=normalizeLabel(candidateLabel(container));
    if(label&&label===norm(a.textContent)){unwrapLink(a)}
  }
}
function validateLinks(){
  for(const a of document.querySelectorAll('a.hub-ref[data-ref-id]')){
    if(!trie.byId.has(a.dataset.refId)){a.title='Referência sem destino válido';unwrapLink(a)}
  }
}
function process(root=document.body){
  if(!trie||!root)return;
  decorateEntities();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes)linkTextNode(n);
  purgeSelfLinks();validateLinks();focusRequested();
}
function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');if(!id)return;
  const el=document.querySelector(`[data-hub-entity-id="${escAttr(id)}"]`);if(!el)return;
  if(el.tagName==='DETAILS')el.open=true;el.classList.add('hub-ref-target');
  if(!el.dataset.refFocused){el.dataset.refFocused='1';setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80)}
}
function startObserver(){if(observer)observer.observe(document.body,{childList:true,subtree:true,characterData:true})}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer?.disconnect();process(document.body);startObserver()})}
async function init(){
  try{
    const r=await fetch(INDEX_URL,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);index=await r.json();
    trie=buildTrie(index.entidades||[],index.aliases_resolvidos||[]);pageModule=moduleFromPage();
    const style=document.createElement('style');style.textContent='.hub-ref{font-weight:inherit;color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.hub-ref:hover{text-decoration-style:solid}.hub-ref-target{outline:2px solid currentColor;outline-offset:4px;border-radius:8px}';document.head.append(style);
    process(document.body);observer=new MutationObserver(schedule);startObserver();
    document.documentElement.dataset.hubReferencias='ativo';document.documentElement.dataset.hubReferenciasVersao=VERSION;document.documentElement.dataset.hubReferenciasEntidades=String(index.total_entidades||0);
  }catch(e){document.documentElement.dataset.hubReferencias='erro';console.warn('[Hub referências]',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
