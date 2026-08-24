import{state,blank,json,arr,fold,esc}from'./character-builder/state.js';
import{loadSpecies}from'./character-builder/catalogs.js?v=20260824-race-variants1';

const $=id=>document.getElementById(id);
let DATA=[];

function lineageTraits(lineage){return arr(lineage?.traits)}
function sourceLabel(lineage,species){return lineage?.source||species?.source||'Fonte não informada'}
function statusLabel(row){return row?.ruleset==='5e'?'Legado 5e compatível':'5.5e / 2024'}
function searchable(species){return fold([
 species.name,species.source,species.lineageLabel,...arr(species.traits).flatMap(t=>[t.name,t.originalName,t.text]),
 ...arr(species.lineages).flatMap(l=>[l.name,...arr(l.aliases),l.source,...lineageTraits(l).flatMap(t=>[t.name,t.originalName,t.text])])
].filter(Boolean).join(' '))}
function renderTrait(t){return`<article class="trait"><h4>${esc(t.name||t.originalName||'Traço')}</h4><p>${esc(t.text||'')}</p></article>`}
function renderLineage(lineage,species){
 const legacy=lineage.ruleset==='5e',kind=species.lineageLabel||'Linhagem';
 return`<article class="linhagem ${legacy?'legacy':''}"><div class="linhagem-head"><h4>${esc(kind)}: ${esc(lineage.name)}</h4><div><span class="pill">${esc(statusLabel(lineage))}</span>${lineage.source?`<span class="pill">${esc(lineage.source)}</span>`:''}</div></div>${lineage.replaceBaseTraits?'<p class="mini">Este pacote substitui os traços da raça-base para esta linhagem.</p>':lineage.replaceTraitNames?.length?`<p class="mini">Substitui: ${esc(arr(lineage.replaceTraitNames).join(', '))}.</p>`:''}${lineageTraits(lineage).map(renderTrait).join('')}</article>`
}
function renderSpecies(species){
 const lineages=arr(species.lineages),legacy=species.ruleset==='5e';
 return`<details class="especie ${legacy?'legacy':''}" data-id="${esc(species.id)}"><summary><strong>${esc(species.name)}</strong><span class="sub">${esc(statusLabel(species))} · ${esc(arr(species.sizes).join(' / ')||'tamanho conforme fonte')} · ${esc(species.speed||30)} ft${lineages.length?` · ${lineages.length} ${esc(species.lineageLabel||'linhagens')}`:''}</span></summary><div class="corpo"><div class="stats"><div class="stat"><strong>Ruleset</strong>${esc(species.ruleset||'—')}</div><div class="stat"><strong>Tamanho</strong>${esc(arr(species.sizes).join(' / ')||'—')}</div><div class="stat"><strong>Deslocamento</strong>${esc(species.speed||30)} ft</div><div class="stat"><strong>Fonte principal</strong>${esc(species.source||'—')}</div></div><section class="bloco"><h3>Traços da raça-base</h3>${arr(species.traits).map(renderTrait).join('')||'<p class="muted">Os traços são definidos integralmente pela linhagem escolhida.</p>'}</section>${lineages.length?`<section class="bloco"><h3>${esc(species.lineageLabel||'Linhagens / escolhas')}</h3>${lineages.map(l=>renderLineage(l,species)).join('')}</section>`:''}</div></details>`
}
function buildSources(){
 const sel=$('fonte'),sources=[...new Set(DATA.flatMap(s=>[s.source,...arr(s.lineages).map(l=>l.source)].filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 sel.innerHTML='<option value="">Todas as fontes</option>'+sources.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')
}
function render(){
 const q=fold($('busca').value),rs=$('ruleset').value,src=$('fonte').value;
 const rows=DATA.filter(s=>{
  if(rs&&s.ruleset!==rs&&!arr(s.lineages).some(l=>l.ruleset===rs))return false;
  if(src&&s.source!==src&&!arr(s.lineages).some(l=>l.source===src))return false;
  return!q||searchable(s).includes(q)
 });
 $('resultado').textContent=`${rows.length} de ${DATA.length} raças-base exibidas`;
 $('lista').innerHTML=rows.map(renderSpecies).join('')||'<div class="vazio">Nenhuma raça corresponde aos filtros.</div>'
}

async function init(){
 state.c=blank();
 const[g,loc]=await Promise.all([
  json('dados/localizacao-ptbr-global.json').catch(()=>({})),
  json('dados/localizacao-ptbr-especies.json').catch(()=>({species:{},lineages:{},traits:{}}))
 ]);
 state.G=g;state.LOCSP=loc;DATA=await loadSpecies();state.catalogs.species=DATA;
 const lineages=DATA.reduce((n,s)=>n+arr(s.lineages).length,0),playable=DATA.length+lineages;
 $('resumo').textContent=`${DATA.length} raças-base · ${lineages} linhagens, legados e ancestralidades · ${playable} opções jogáveis.`;
 buildSources();['busca','ruleset','fonte'].forEach(id=>$(id).addEventListener(id==='busca'?'input':'change',render));render()
}

init().catch(err=>{
 $('resumo').textContent='Falha ao carregar o catálogo de raças.';
 $('lista').innerHTML=`<div class="erro"><strong>Falha de carregamento.</strong><br>${esc(err.message)}</div>`;
 console.error('[race-library]',err)
});
