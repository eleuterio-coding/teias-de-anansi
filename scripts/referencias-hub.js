(()=>{
'use strict';
const INDEX_URL='dados/referencias-hub-index.json?v=20260819-refs1';
const SKIP='script,style,noscript,textarea,input,select,option,button,a,.hub-ref,.meta,.badge,summary,h1,h2,h3,h4,h5,h6,nav,header,footer';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const isWord=c=>c&&/[\p{L}\p{N}_]/u.test(c);
const escAttr=s=>CSS.escape(String(s));
let index=null,trie=null,scheduled=false;
function buildTrie(rows,aliasRows){
  const byId=new Map(rows.map(r=>[r.id,r]));
  const root={n:new Map(),id:null};
  for(const a of aliasRows){
    const row=byId.get(a.id); if(!row)continue;
    const term=a.termo; if(term.length<2)continue;
    let node=root;
    for(const ch of term){if(!node.n.has(ch))node.n.set(ch,{n:new Map(),id:null});node=node.n.get(ch)}
    node.id=row.id;
  }
  return {root,byId};
}
function hrefFor(row){
  const base=row.url||'referencia.html';
  if(base==='referencia.html')return `referencia.html?id=${encodeURIComponent(row.id)}`;
  return `${base}?ref=${encodeURIComponent(row.id)}#ref-${encodeURIComponent(row.id)}`;
}
function closestEntityId(node){const el=node.parentElement?.closest('[data-ref-id]');return el?.dataset.refId||null}
function findMatches(text,selfId){
  const n=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const out=[]; let i=0;
  while(i<n.length){
    if(i>0&&isWord(n[i-1])){i++;continue}
    let node=trie.root,j=i,last=null;
    while(j<n.length&&node.n.has(n[j])){node=node.n.get(n[j]);j++;if(node.id&&(!isWord(n[j])||j===n.length))last={end:j,id:node.id}}
    if(last&&last.id!==selfId){out.push({start:i,end:last.end,id:last.id});i=last.end}else i++;
  }
  return out;
}
function linkTextNode(node){
  if(!node.nodeValue?.trim()||node.parentElement?.closest(SKIP))return;
  const selfId=closestEntityId(node); const matches=findMatches(node.nodeValue,selfId); if(!matches.length)return;
  const frag=document.createDocumentFragment();let p=0;
  for(const m of matches){
    if(m.start>p)frag.append(document.createTextNode(node.nodeValue.slice(p,m.start)));
    const row=trie.byId.get(m.id);const a=document.createElement('a');a.className='hub-ref';a.href=hrefFor(row);a.dataset.refId=row.id;a.title=`Abrir ${row.nome} — ${row.modulo}`;a.textContent=node.nodeValue.slice(m.start,m.end);frag.append(a);p=m.end;
  }
  if(p<node.nodeValue.length)frag.append(document.createTextNode(node.nodeValue.slice(p)));
  node.replaceWith(frag);
}
function entityCandidates(){return [...document.querySelectorAll('details.item, article.item, .card, .item-card')];}
function decorateEntities(){
  for(const el of entityCandidates()){
    if(el.dataset.refId)continue;
    const label=(el.querySelector('summary strong, summary, h2, h3, .nome, .title')?.textContent||'').trim();if(!label)continue;
    const n=norm(label);const a=index.aliases_resolvidos.find(x=>x.termo===n);if(!a)continue;
    el.dataset.refId=a.id;el.id=`ref-${a.id}`;
  }
}
function process(root=document.body){
  if(!trie||!root)return;decorateEntities();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes)linkTextNode(n);
  focusRequested();
}
function focusRequested(){
  const id=new URLSearchParams(location.search).get('ref');if(!id)return;
  const el=document.querySelector(`[data-ref-id="${escAttr(id)}"]`);if(!el)return;
  if(el.tagName==='DETAILS')el.open=true;el.classList.add('hub-ref-target');
  if(!el.dataset.refFocused){el.dataset.refFocused='1';setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'center'}),60)}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;process(document.body)})}
async function init(){
  try{const r=await fetch(INDEX_URL,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);index=await r.json();trie=buildTrie(index.entidades||[],index.aliases_resolvidos||[]);
    const style=document.createElement('style');style.textContent='.hub-ref{text-decoration:underline;text-decoration-style:dotted;text-underline-offset:2px}.hub-ref:hover{text-decoration-style:solid}.hub-ref-target{outline:2px solid currentColor;outline-offset:4px;border-radius:8px}';document.head.append(style);
    process(document.body);new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
  }catch(e){console.warn('[Hub referências]',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
