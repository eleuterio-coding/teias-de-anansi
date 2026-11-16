/* Painéis de leitura do tema Pergaminho. Sem estado próprio e sem duplicação de registros. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows = value => Array.isArray(value) ? value : [];
const palette = {map:'map',scene:'scene',npc:'npc',monster:'monster',faction:'faction',objective:'objective',development:'development',timeline:'timeline',area:'area',player:'player',encounter:'encounter'};
const symbols = {map:'▤',scene:'▣',npc:'♟',monster:'✦',faction:'⚑',objective:'◎',development:'⌁',timeline:'◷',area:'⌂',player:'♧',encounter:'⚔'};
const noun = (amount,one,many) => amount+' '+(amount===1?one:many);
function emblem(kind){
 return '<span class="parchment-emblem parchment-emblem--'+(palette[kind]||'map')+'" aria-hidden="true">'+(symbols[kind]||'◆')+'</span>';
}
function stats(data){
 return '<div class="parchment-stats" aria-label="Contagem de elementos">'+data.map(x=>
  '<div class="parchment-stat parchment-stat--'+esc(x.kind)+'">'+emblem(x.kind)+
  '<strong>'+esc(x.number)+'</strong><span>'+esc(x.label)+'</span></div>'
 ).join('')+'</div>';
}
function menu(items,kind){
 return '<div class="parchment-structure-list">'+items.map(x=>
  '<button type="button" class="parchment-structure-row" data-parchment-focus="'+esc(x.anchor)+'">'+
  emblem(x.kind)+'<span class="parchment-structure-copy"><strong>'+esc(x.title)+'</strong>'+
  '<small>'+esc(x.hint)+'</small></span><span class="parchment-structure-count">'+esc(noun(x.count,x.singular,x.plural))+'</span>'+
  '<span class="parchment-row-arrow" aria-hidden="true">›</span></button>'
 ).join('')+'</div>';
}
function lastDevelopments(items,scenes){
 const ordered=rows(items).slice().sort((a,b)=>String(b.at||b.createdAt||'').localeCompare(String(a.at||a.createdAt||''))).slice(0,3);
 if(!ordered.length)return '<p class="parchment-empty">Nenhum desenrolar registrado ainda. Os acontecimentos aparecerão aqui após as sessões.</p>';
 return '<div class="parchment-recent-list">'+ordered.map(d=>{
  const label=rows(scenes).find(s=>s.id===d.sceneId)?.title||'Acontecimento sem cena vinculada';
  const dt=d.at||d.createdAt;
  const formatted=dt&&!Number.isNaN(Date.parse(dt))?new Date(dt).toLocaleDateString('pt-BR'):'';
  return '<article class="parchment-recent-entry">'+emblem('development')+'<div><strong>'+esc(d.description||'Desenrolar')+'</strong><small>'+esc(label)+'</small></div>'+
   (formatted?'<time datetime="'+esc(dt)+'">'+esc(formatted)+'</time>':'')+'</article>';
 }).join('')+'</div>';
}
function panelTitle(kind,title,subtitle){
 return '<header class="parchment-panel-head"><div class="parchment-panel-title">'+emblem(kind)+'<div><h2>'+esc(title)+'</h2>'+
  (subtitle?'<p>'+esc(subtitle)+'</p>':'')+'</div></div></header>';
}
function action(kind,label,action,extraClass=''){
 return '<button type="button" class="parchment-action parchment-action--'+esc(kind)+' '+esc(extraClass)+'" '+action+'>'+
 emblem(kind)+'<span>'+esc(label)+'</span></button>';
}
export function renderAdventureParchmentDashboard(a,c){
 const maps=rows(a.exploration?.levels).length,scenes=rows(a.scenes).length,areas=rows(a.exploration?.areas).length;
 const npcs=rows(a.npcIds).length,monsters=rows(a.monsters).length,factions=rows(a.exploration?.factions).length;
 const objectives=rows(a.missions).length,developments=rows(a.developments).length;
 const items=[
  {kind:'map',title:'Mapas',hint:'Principais mapas da aventura.',count:maps,singular:'mapa',plural:'mapas',anchor:'overview-mapas'},
  {kind:'scene',title:'Cenas',hint:'Momentos de interação, exploração e conflito.',count:scenes,singular:'cena',plural:'cenas',anchor:'overview-cenas'},
  {kind:'area',title:'Locais',hint:'Ambientes e áreas exploráveis.',count:areas,singular:'local',plural:'locais',anchor:'overview-locais'},
  {kind:'npc',title:'NPCs',hint:'Personagens não jogáveis relevantes.',count:npcs,singular:'NPC',plural:'NPCs',anchor:'overview-npcs'},
  {kind:'monster',title:'Monstros',hint:'Criaturas e inimigos da aventura.',count:monsters,singular:'monstro',plural:'monstros',anchor:'overview-monstros'},
  {kind:'faction',title:'Facções',hint:'Organizações e grupos de interesse.',count:factions,singular:'facção',plural:'facções',anchor:'overview-faccoes'},
  {kind:'objective',title:'Objetivos',hint:'Metas e propósitos da aventura.',count:objectives,singular:'objetivo',plural:'objetivos',anchor:'overview-objetivos'},
  {kind:'development',title:'Desenrolares',hint:'O que aconteceu nas sessões.',count:developments,singular:'desenrolar',plural:'desenrolares',anchor:'overview-desenrolares'},
  {kind:'timeline',title:'Linha do Tempo',hint:'Cenas e acontecimentos em ordem cronológica.',count:scenes+developments,singular:'evento',plural:'eventos',anchor:'adventure-overview-timeline'}
 ];
 return '<div class="parchment-dashboard parchment-adventure-dashboard">'+
  stats([{kind:'map',number:maps,label:'Mapas'},{kind:'scene',number:scenes,label:'Cenas'},
  {kind:'npc',number:npcs,label:'NPCs'},{kind:'monster',number:monsters,label:'Monstros'},
  {kind:'faction',number:factions,label:'Facções'},{kind:'objective',number:objectives,label:'Objetivos'},
  {kind:'development',number:developments,label:'Desenrolares'}])+
  '<div class="parchment-dashboard-columns"><section class="parchment-panel parchment-structure-panel">'+
  panelTitle('map','Estrutura da Aventura','Visão geral dos principais elementos desta aventura.')+menu(items)+
  '</section><aside class="parchment-dashboard-side"><section class="parchment-panel parchment-actions-panel">'+
  panelTitle('scene','Ações Rápidas','Criar e vincular conteúdo à aventura.')+
  '<div class="parchment-actions-grid">'+action('scene','Criar Cena','data-adventure-quick-kind="scene"','is-primary')+
  action('npc','Adicionar NPC','data-adventure-quick-kind="npc"')+
  action('map','Adicionar Mapa','data-adventure-quick-kind="map"')+
  action('development','Registrar Desenrolar','data-adventure-quick-kind="development"')+
  '</div></section><section class="parchment-panel parchment-recent-panel">'+
  panelTitle('development','Últimos Desenrolares','Os acontecimentos mais recentes da aventura.')+
  lastDevelopments(a.developments,a.scenes)+
  '<button class="parchment-text-link" type="button" data-parchment-focus="overview-desenrolares">Ver todos os desenrolares <span aria-hidden="true">›</span></button>'+
  '</section></aside></div></div>';
}
export function renderSessionParchmentDashboard(s,a,restricted=false){
 const maps=rows(a?.exploration?.levels).filter(x=>rows(s.mapIds).includes(x.id));
 const scenes=rows(s.scenes);
 const objectives=rows(a?.missions).filter(x=>rows(s.objectiveIds).includes(x.id));
 const developments=rows(a?.developments).filter(x=>x.sessionId===s.id&&(!restricted||x.visibleToPlayers===true));
 const players=rows(s.participantUsernames).length;
 const encounters=rows(s.encounters).length;
 const items=restricted?[
  {kind:'scene',title:'Visão Geral',hint:'Resumo compartilhado da sessão.',count:scenes.length,singular:'cena',plural:'cenas',anchor:'visao-geral'},
  {kind:'player',title:'Jogadores',hint:'Participantes com acesso à sessão.',count:players,singular:'jogador',plural:'jogadores',anchor:'participantes'},
  {kind:'timeline',title:'Linha do Tempo',hint:'Acontecimentos revelados durante a sessão.',count:scenes.length,singular:'cena',plural:'cenas',anchor:'linha-tempo'}
 ]:[
  {kind:'map',title:'Mapas',hint:'Mapas selecionados da aventura.',count:maps.length,singular:'mapa',plural:'mapas',anchor:'session-adventure-overview'},
  {kind:'scene',title:'Cenas',hint:'Cenas preparadas para esta sessão.',count:scenes.length,singular:'cena',plural:'cenas',anchor:'session-adventure-overview'},
  {kind:'objective',title:'Objetivos',hint:'Objetivos escolhidos para a sessão.',count:objectives.length,singular:'objetivo',plural:'objetivos',anchor:'session-adventure-overview'},
  {kind:'development',title:'Desenrolares',hint:'Consequências das escolhas dos jogadores.',count:developments.length,singular:'desenrolar',plural:'desenrolares',anchor:'session-adventure-overview'},
  {kind:'player',title:'Jogadores',hint:'Participantes e personagens vinculados.',count:players,singular:'jogador',plural:'jogadores',anchor:'participantes'},
  {kind:'timeline',title:'Linha do Tempo',hint:'Registros e cronologia da sessão.',count:scenes.length+developments.length,singular:'evento',plural:'eventos',anchor:'linha-tempo'}
 ];
 return '<div id="session-parchment-overview" class="parchment-dashboard parchment-session-dashboard">'+
  stats([{kind:'map',number:maps.length,label:'Mapas'},{kind:'scene',number:scenes.length,label:'Cenas'},
  {kind:'objective',number:objectives.length,label:'Objetivos'},
  {kind:'development',number:developments.length,label:'Desenrolares'},
  {kind:'player',number:players,label:'Jogadores'},{kind:'encounter',number:encounters,label:'Encontros'}])+
  '<div class="parchment-dashboard-columns"><section class="parchment-panel parchment-structure-panel">'+
  panelTitle('scene','Estrutura da Sessão','Conteúdos associados à aventura, sem duplicar os registros.')+
  menu(items)+'</section><aside class="parchment-dashboard-side">'+
  (restricted?'':'<section class="parchment-panel parchment-actions-panel">'+
    panelTitle('scene','Ações Rápidas','Prepare e conduza sua próxima sessão.')+
    '<div class="parchment-actions-grid">'+
    action('scene','Editar Sessão','data-session-parchment="edit"','is-primary')+
    action('map','Selecionar Mapas','data-session-parchment="create" data-session-scroll="session-adventure-creation"')+
    action('development','Registrar Desenrolar','data-session-parchment="create" data-session-scroll="session-adventure-creation" data-session-focus-input="development"')+
    action('timeline','Abrir Ao vivo','data-session-parchment="live"')+
    '</div></section>')+
  '<section class="parchment-panel parchment-recent-panel">'+
  panelTitle('development','Últimos Desenrolares','Acontecimentos registrados nesta sessão.')+
  lastDevelopments(developments,a?.scenes)+
  '<button type="button" class="parchment-text-link" data-parchment-focus="session-adventure-overview">Ver conteúdo da sessão <span aria-hidden="true">›</span></button>'+
  '</section></aside></div></div>';
}
