(()=>{
'use strict';
const VERSION='20260824-canonical25-1';
const DATA_URL=`dados/modulos-canonicos-extras.json?v=${VERSION}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const arr=v=>Array.isArray(v)?v:[];
const statusLabel=s=>({atual:'Atual',legado:'Legado compatível',revisado:'Revisado',substituido:'Substituído',opcional:'Opcional',variante:'Variante',playtest:'Playtest'})[s]||s||'—';
let DATA=null,MOD=null;

function sourceMeta(item){
  const id=item?.fonte?.publicacao_id||'';
  return {id,...(DATA?.fontes?.[id]||{})};
}
function itemSearch(item){
  const src=sourceMeta(item);
  return norm([
    item.nome,item.conteudo?.resumo,item.classificacao?.status,item.classificacao?.natureza,
    item.classificacao?.setting,src.id,src.titulo,src.ano,src.ruleset,
    ...arr(item.conteudo?.referencias_nomeadas)
  ].join(' '));
}
function renderItem(item){
  const src=sourceMeta(item),pages=item?.fonte?.pagina_inicio&&item?.fonte?.pagina_fim
    ?`${item.fonte.pagina_inicio}–${item.fonte.pagina_fim}`:'—';
  const refs=arr(item.conteudo?.referencias_nomeadas);
  const compatibility=item.compatibilidade||{};
  const setting=item.classificacao?.setting||compatibility.setting||'';
  return `<details class="item" data-status="${esc(item.classificacao?.status||'')}">
    <summary><span><strong>${esc(item.nome)}</strong><small>${esc(src.titulo||src.id||'Fonte não identificada')}</small></span><span class="badge">${esc(statusLabel(item.classificacao?.status))}</span></summary>
    <div class="corpo">
      <p>${esc(item.conteudo?.resumo||'')}</p>
      <div class="meta-grid">
        <span><b>Fonte:</b> ${esc(src.titulo||src.id||'—')}</span>
        <span><b>Ano:</b> ${esc(src.ano??'—')}</span>
        <span><b>Natureza:</b> ${esc(src.natureza||item.classificacao?.natureza||'—')}</span>
        <span><b>Ruleset:</b> ${esc(compatibility.ruleset||src.ruleset||'—')}</span>
        <span><b>Revisão core:</b> ${esc(compatibility.revisao_core||src.revisao_core||'—')}</span>
        <span><b>Páginas da fonte:</b> ${esc(pages)}</span>
        ${setting?`<span><b>Setting:</b> ${esc(setting)}</span>`:''}
      </div>
      <p class="decisao"><b>Decisão editorial:</b> ${esc(item.controle?.decisao_editorial||'manter')}</p>
      ${refs.length?`<h3>Conteúdo indexado</h3><ul class="refs">${refs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
    </div>
  </details>`;
}
function render(){
  const q=norm(document.getElementById('busca')?.value||'');
  const status=document.getElementById('status')?.value||'';
  const rows=arr(MOD?.itens).filter(item=>(!q||itemSearch(item).includes(q))&&(!status||item.classificacao?.status===status));
  const refs=rows.reduce((n,x)=>n+arr(x.conteudo?.referencias_nomeadas).length,0);
  document.getElementById('resultado').textContent=`${rows.length} de ${MOD.itens.length} grupos · ${refs} referências nomeadas no filtro`;
  document.getElementById('lista').innerHTML=rows.map(renderItem).join('')||'<p class="muted">Nenhum grupo corresponde aos filtros.</p>';
}
async function load(){
  const key=document.body.dataset.moduleKey;
  if(!key)throw new Error('Página sem data-module-key.');
  const r=await fetch(DATA_URL,{cache:'no-store'});
  if(!r.ok)throw new Error(`Catálogo HTTP ${r.status}`);
  DATA=await r.json();
  if(DATA?.schema!=='hub-rpg/modulos-canonicos-extras/v1')throw new Error('Schema inesperado do catálogo canônico.');
  if(DATA?.controle?.modulos_materializados!==7||DATA?.controle?.grupos_materializados!==37)throw new Error('Controle de materialização divergente.');
  MOD=arr(DATA.modulos).find(x=>x.chave===key);
  if(!MOD)throw new Error(`Módulo não encontrado: ${key}`);
  document.title=`${MOD.titulo} - Biblioteca - Teias de Anansi`;
  document.getElementById('titulo').textContent=MOD.titulo;
  document.getElementById('criterio').textContent=MOD.criterio;
  const totalRefs=MOD.itens.reduce((n,x)=>n+arr(x.conteudo?.referencias_nomeadas).length,0);
  document.getElementById('resumo').textContent=`${MOD.itens.length} grupos materializados · ${totalRefs} referências nomeadas · precedência 2024/2014 preservada por identidade e compatibilidade.`;
  document.getElementById('politica').textContent=DATA.politica_de_consolidacao.join(' ');
  document.getElementById('busca').addEventListener('input',render);
  document.getElementById('status').addEventListener('change',render);
  render();
  document.documentElement.dataset.moduloCanonico=String(MOD.ordem);
  document.documentElement.dataset.moduloCanonicoEstado='publicado';
}
load().catch(err=>{
  const result=document.getElementById('resultado');if(result)result.textContent='Falha ao carregar o módulo.';
  const list=document.getElementById('lista');if(list)list.innerHTML=`<p class="erro"><strong>Falha:</strong> ${esc(err.message)}</p>`;
  console.error('[Módulo canônico]',err);
});
})();
