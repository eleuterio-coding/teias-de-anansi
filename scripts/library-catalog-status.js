import{CATALOG_MODULES,CATALOG_BY_ROUTE}from'./catalog-registry.js?v=20260923-race-language-field2';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const routeOf=href=>String(href||'').split('?')[0].split('#')[0].replace(/^\.\//,'');
let semanticIndex=null,semanticIndexPromise=null,catalogCounts=null,countsError=false;

function countLabel(module){
 const count=catalogCounts?.[module.semanticName];
 return Number.isSafeInteger(count)&&count>=0
  ?`${count.toLocaleString('pt-BR')} ${count===1?'item':'itens'}`
  :countsError?'':'Carregando itens…';
}
function decorateCards(){
 for(const li of document.querySelectorAll('.modulos li')){
  const a=li.querySelector('a'),module=CATALOG_BY_ROUTE[routeOf(a?.getAttribute('href'))];
  if(!module)continue;
  li.dataset.catalogId=module.id;
  li.dataset.catalogSearch=fold(`${module.publicName} ${module.name} ${module.semanticName}`);
  li.dataset.catalogRuntime=module.consumers.includes('construtor')||module.consumers.includes('ficha')?'runtime':'library';
  const count=li.querySelector('.contagem');
  if(count)count.textContent=countLabel(module);
 }
}
function countPublished(index){
 const counts=Object.create(null),seen=new Set();
 for(const item of index?.entidades||[]){
  if(item.status!=='publicado'||!item.modulo||!item.id||seen.has(item.id))continue;
  seen.add(item.id);
  counts[item.modulo]=(counts[item.modulo]||0)+1
 }
 return counts
}
async function loadCounts(){
 try{
  const response=await fetch('dados/biblioteca-contagens.json?v=20261028-compact1');
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const data=await response.json();
  if(data?.schema!=='hub-rpg.biblioteca-contagens.v1'||!data.modulos)throw Error('Contagens incompatíveis');
  if(CATALOG_MODULES.some(m=>!Number.isSafeInteger(data.modulos[m.semanticName])||data.modulos[m.semanticName]<0))throw Error('Módulo sem contagem válida');
  catalogCounts=data.modulos;
  countsError=false
 }catch(error){
  console.warn('[Biblioteca] Contagens indisponíveis:',error);
  countsError=true
 }
 decorateCards()
}
function visibleModules(query,scope){let visible=0;for(const li of document.querySelectorAll('.modulos li')){const matchText=!query||li.dataset.catalogSearch?.includes(query),matchScope=scope==='all'||li.dataset.catalogRuntime===scope;li.hidden=!(matchText&&matchScope);if(!li.hidden)visible++}const status=document.getElementById('catalog-filter-status');if(status)status.textContent=''}
function entityMatches(query){if(!semanticIndex||query.length<2)return[];const words=query.split(/\s+/).filter(Boolean);return(semanticIndex.entidades||[]).filter(x=>{const hay=fold([x.nome,x.original,...(x.aliases||[]),x.modulo].filter(Boolean).join(' '));return words.every(w=>hay.includes(w))}).sort((a,b)=>{const an=fold(a.nome),bn=fold(b.nome),ae=an===query?0:an.startsWith(query)?1:2,be=bn===query?0:bn.startsWith(query)?1:2;return ae-be||an.localeCompare(bn,'pt-BR')}).slice(0,20)}
function renderEntityResults(query){const box=document.getElementById('catalog-search-results');if(!box)return;if(!query||query.length<2){box.hidden=true;box.innerHTML='';return}if(!semanticIndex){box.hidden=false;box.innerHTML='<p class="resumo">Carregando índice de referências…</p>';return}const rows=entityMatches(query);box.hidden=false;box.innerHTML=rows.length?`<h2>Referências encontradas</h2><div class="catalog-results">${rows.map(x=>`<a href="referencia.html?v=20261028-library-hub-layout1&id=${encodeURIComponent(x.id)}"><strong>${esc(x.nome)}</strong><span>${esc(x.modulo==='Espécies'?'Raça':x.modulo)}</span></a>`).join('')}</div>`:'<p class="resumo">Nenhuma referência indexada encontrada.</p>'}
function queryAndScope(){return{q:fold(document.getElementById('catalog-search')?.value.trim()),scope:document.getElementById('catalog-scope')?.value||'all'}}
function applyFilters(){const{q,scope}=queryAndScope();visibleModules(q,scope);renderEntityResults(q);if(q.length>=2&&!semanticIndex)ensureSemanticIndex()}
function injectControls(){const list=document.querySelector('.modulos');if(!list||document.getElementById('catalog-controls'))return;const controls=document.createElement('section');controls.id='catalog-controls';controls.className='catalog-controls';controls.innerHTML=`<label>Buscar na Biblioteca<input id="catalog-search" type="search" placeholder="Ex.: Ataque Extra, Fireball, Guerreiro, escudo"></label><label>Integração<select id="catalog-scope"><option value="all">Todos os módulos</option><option value="runtime">Usados na criação ou ficha</option><option value="library">Somente referência</option></select></label><div id="catalog-filter-status" class="resumo"></div>`;list.before(controls);const results=document.createElement('section');results.id='catalog-search-results';results.className='catalog-search-results';results.hidden=true;list.after(results);controls.addEventListener('input',applyFilters);controls.addEventListener('change',applyFilters)}
function injectStyle(){if(document.getElementById('catalog-status-style'))return;const style=document.createElement('style');style.id='catalog-status-style';style.textContent=`.catalog-controls{display:grid;grid-template-columns:minmax(0,2fr) minmax(180px,1fr) auto;gap:10px;align-items:end;margin:16px 0}.catalog-controls label{font-weight:650}.catalog-controls input,.catalog-controls select{width:100%;font:inherit;border:1px solid #8887;border-radius:8px;padding:9px 10px;margin-top:5px;background:var(--hub-surface,#101923);color:var(--hub-text,#f4f7fb)}.catalog-search-results{border:1px solid #8885;border-radius:10px;padding:14px;margin:10px 0 16px}.catalog-search-results h2{font-size:1rem;margin:0 0 9px}.catalog-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:7px}.catalog-results a{display:flex;flex-direction:column;border:1px solid #8884;border-radius:8px;padding:8px 10px;text-decoration:none}.catalog-results span{font-size:.78rem;opacity:.68}@media(max-width:700px){.catalog-controls{grid-template-columns:1fr}.catalog-controls .resumo{align-self:start}}`;document.head.appendChild(style)}
async function ensureSemanticIndex(){if(semanticIndex)return semanticIndex;if(semanticIndexPromise)return semanticIndexPromise;semanticIndexPromise=(async()=>{try{const r=await fetch('dados/referencias-hub-index.json');if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();if(data?.schema!=='hub-rpg.referencias.v3')throw new Error('schema inesperado');semanticIndex=data}catch{semanticIndex=null}finally{semanticIndexPromise=null}if(!catalogCounts&&semanticIndex){catalogCounts=countPublished(semanticIndex);countsError=false;decorateCards()}const{q,scope}=queryAndScope();visibleModules(q,scope);renderEntityResults(q);return semanticIndex})();return semanticIndexPromise}

injectStyle();injectControls();decorateCards();applyFilters();loadCounts();
