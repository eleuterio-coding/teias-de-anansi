(()=>{
'use strict';
const VERSION='20260819-refs2';
const INDEX_URL=`dados/referencias-hub-index.json?v=${VERSION}`;
const SKIP='script,style,noscript,textarea,input,select,option,button,a,.hub-ref,.meta,.badge,summary,h1,h2,h3,h4,h5,h6,nav,header,footer,.controles';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isWord=c=>c&&/[\p{L}\p{N}_]/u.test(c);
const escAttr=s=>CSS.escape(String(s));
let index=null,trie=null,scheduled=false,observer=null;

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
function buildTrie(rows,aliasRows){
  const byId=new Map(rows.map(r=>[r.id,r]));
  const aliasToId=new Map();
  const root={n:new Map(),id:null};
  for(const a of aliasRows){
    const row=byId.get(a.id);if(!row)continue;
    const term=norm(a.termo);if(term.length<2)continue;
    aliasToId.set(term,row.id);
    let node=root;
    for(const ch of term){
      if(!node.n.has(ch))node.n.set(ch,{n:new Map(),id:null});
      node=node.n.get(ch);
    }
    node.id=row.id;
  }
  return {root,byId,aliasToId};
}
function hrefFor(row){
  const base=row.url||'referencia.html';
  if(base==='referencia.html')return `referencia.html?id=${encodeURIComponent(row.id)}`;
  return `${base}?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
}
function closestEntityId(node){
  const el=node.parentElement?.closest('[data-ref-id]');
  return el?.dataset.refId||null;
}
function findMatches(text,selfId){
  const map=foldWithMap(text),n=map.folded,out=[];
  let i=0;
  while(i<n.length){
    if(i>0&&isWord(n[i-1])){i++;continue}
    let node=trie.root,j=i,last=null;
    while(j<n.length&&node.n.has(n[j])){
      node=node.n.get(n[j]);j++;
      if(node.id&&(j===n.length||!isWord(n[j])))last={end:j,id:node.id};
    }
    if(last&&last.id!==selfId){
      const start=map.starts[i],end=map.ends[last.end-1];
      if(Number.isInteger(start)&&Number.isInteger(end))out.push({start,end,id:last.id});
      i=last.end;
    }else i++;
  }
  return out;
}
function linkTextNode(node){
  if(!node.nodeValue?.trim()||node.parentElement?.closest(SKIP))return;
  const selfId=closestEntityId(node),matches=findMatches(node.nodeValue,selfId);
  if(!matches.length)return;
  const frag=document.createDocumentFragment();let p=0;
  for(const m of matches){
    if(m.start>p)frag.append(document.createTextNode(node.nodeValue.slice(p,m.start)));
    const row=trie.byId.get(m.id);if(!row)continue;
    const a=document.createElement('a');
    a.className='hub-ref';a.href=hrefFor(row);a.dataset.refId=row.id;
    a.title=`Abrir ${row.nome} — ${row.modulo}`;
    a.textContent=node.nodeValue.slice(m.start,m.end);
    frag.append(a);p=m.end;
  }
  if(p<node.nodeValue.length)frag.append(document.createTextNode(node.nodeValue.slice(p)));
  node.replaceWith(frag);
}
function entityCandidates(){
  return [...document.querySelectorAll('details.item,details.grupo,article.item,.card,.item-card,[data-item],[data-entity]')];
}
function candidateLabel(el){
  return (el.querySelector('summary strong,summary .nome,summary,h2,h3,.nome,.title,[data-name]')?.textContent||'').trim();
}
function decorateEntities(){
  for(const el of entityCandidates()){
    if(el.dataset.refId)continue;
    const label=candidateLabel(el);if(!label)continue;
    const id=trie.aliasToId.get(norm(label));if(!id)continue;
    el.dataset.refId=id;el.id=`ref-${id}`;
  }
}
function process(root=document.body){
  if(!trie||!root)return;
  decorateEntities();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
    acceptNode:n=>n.parentElement?.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT
  });
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes)linkTextNode(n);
  focusRequested();
}
function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');if(!id)return;
  const el=document.querySelector(`[data-ref-id="${escAttr(id)}"]`);if(!el)return;
  if(el.tagName==='DETAILS')el.open=true;
  el.classList.add('hub-ref-target');
  if(!el.dataset.refFocused){
    el.dataset.refFocused='1';
    setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),80);
  }
}
function startObserver(){
  if(observer)observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;observer?.disconnect();process(document.body);startObserver();
  });
}
async function init(){
  try{
    const r=await fetch(INDEX_URL,{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    index=await r.json();
    trie=buildTrie(index.entidades||[],index.aliases_resolvidos||[]);
    const style=document.createElement('style');
    style.textContent='.hub-ref{font-weight:inherit;color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer}.hub-ref:hover{text-decoration-style:solid}.hub-ref-target{outline:2px solid currentColor;outline-offset:4px;border-radius:8px}';
    document.head.append(style);
    process(document.body);
    observer=new MutationObserver(schedule);startObserver();
    document.documentElement.dataset.hubReferencias='ativo';
    document.documentElement.dataset.hubReferenciasEntidades=String(index.total_entidades||0);
  }catch(e){
    document.documentElement.dataset.hubReferencias='erro';
    console.warn('[Hub referências]',e);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();