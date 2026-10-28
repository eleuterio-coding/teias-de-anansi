/* Visão Geral de Aventuras: projeção de leitura, sem controles de edição.
   As entidades continuam nos modelos originais e nos formulários da Oficina. */
import {adventureAssignments,adventureMembers} from './adventure-roster-ui.js?v=20261027-release-reset3';
import {playerAvatarHtml,characterAvatarHtml} from './profile-images.js?v=20261021-user1';
import {imageElementHtml} from './image-media.js?v=20261023-simplified3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=value=>Array.isArray(value)?value:[];
const ordered=value=>rows(value).slice().sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
const line=(label,value)=>String(value??'').trim()?'<div class="adventure-read-field"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>':'';
const fields=(pairs=[])=>{const html=pairs.map(([label,value])=>line(label,value)).join('');return html?'<dl class="adventure-read-fields">'+html+'</dl>':''};
const names=(ids,collection)=>rows(ids).map(id=>collection.find(item=>item.id===id)?.name||collection.find(item=>item.id===id)?.title).filter(Boolean).join(', ');
const card=(title,meta='',content='',extra='',kind='')=>'<article class="adventure-read-card"'+(kind?' data-adventure-summary-kind="'+esc(kind)+'"':'')+'><div class="adventure-read-card-head"><h3>'+esc(title)+'</h3>'+(meta?'<span class="adventure-read-meta">'+esc(meta)+'</span>':'')+'</div>'+(content?'<div class="adventure-read-primary">'+content+'</div>':'')+(extra?'<details class="adventure-read-more"><summary>Ver informações completas</summary><div>'+extra+'</div></details>':'')+'</article>';
const section=(id,title,count,items,description='')=>'<section class="adventure-read-section" id="'+esc(id)+'"><header class="adventure-read-section-head"><div><h2>'+esc(title)+'</h2>'+(description?'<p>'+esc(description)+'</p>':'')+'</div><span class="adventure-read-count">'+count+'</span></header><div class="adventure-read-grid">'+(items||'<p class="adventure-read-empty">Nenhum registro nesta aventura.</p>')+'</div></section>';
const p=value=>String(value??'').trim()?'<p>'+esc(value)+'</p>':'';
export function renderAdventureOverview(a,c,characters=[]){
 const characterById=new Map(characters.map(x=>[x.id,x]));
 const memberByName=new Map(adventureMembers(c).map(m=>[String(m.username||m.name||'').toLowerCase(),m]));
 const linkedNpcs=rows(c?.npcs).filter(n=>a.npcIds.includes(n.id));
 const areas=ordered(a.exploration?.areas),maps=ordered(a.exploration?.levels),monsters=ordered(a.monsters);
 const playerCards=adventureAssignments(a,c).map(row=>{
  const member=memberByName.get(row.username),name=member?.name||member?.username||row.username,character=characterById.get(row.characterId);
  return '<article class="adventure-read-card adventure-read-player">'+
    '<div class="adventure-read-player-avatar">'+playerAvatarHtml(row.username,c?.userProfiles||[])+'</div>'+
    '<div class="adventure-read-player-info"><h3>'+esc(name)+'</h3><span class="adventure-read-meta">Jogador</span>'+
    '<div class="adventure-read-player-character">'+(character?characterAvatarHtml(character):'')+'<span>'+esc(character?.name||'Sem personagem vinculado')+'</span></div></div></article>';
 }).join('');
 const sceneCards=ordered(a.scenes).map(scene=>{
  const location=areas.find(x=>x.id===scene.areaId);
  const meta=[({planned:'Planejada',active:'Em cena',completed:'Concluída',skipped:'Ignorada'})[scene.status]||scene.status,
   location?.name||location?.code||'Sem local'].filter(Boolean).join(' · ');
  const other=fields([['Objetivo reservado',scene.objective],['Narração',scene.readAloud],
   ['Descrição do Mestre',scene.description],['Desfecho',scene.outcome],['Notas',scene.notes],
   ['NPCs presentes',names(scene.npcIds,linkedNpcs)],['Monstros presentes',names(scene.monsterIds,monsters)],
   ['NPCs inimigos',names(scene.enemyNpcIds,linkedNpcs)],['Monstros inimigos',names(scene.enemyMonsterIds,monsters)],
   ['Objetivos vinculados',names(scene.missionIds,rows(a.missions))],['Sessão vinculada',scene.sessionId]]);
  return card(scene.title,meta,p(scene.readAloud||scene.description||scene.objective),other,'scene');
 }).join('');
 const areaStatus={unknown:'Não descoberta',discovered:'Descoberta',visited:'Visitada',resolved:'Resolvida',blocked:'Bloqueada'};
 const areaCards=areas.map(area=>{
  const level=maps.find(m=>m.id===area.levelId);
  const meta=[areaStatus[area.status]||area.status,area.type].filter(Boolean).join(' · ');
  return card(area.name||area.code,meta,
   fields([['Identificador',area.code],['Mapa',level?.name],['XP',area.xp?String(area.xp):'']])+p(area.readAloud||area.description||area.publicDescription),
   fields([['Narração',area.readAloud],['Descrição do Mestre',area.description],['Notas privadas',area.dmNotes],
    ['Perigos e armadilhas',area.hazards],['Tesouro',area.treasure],['Testes',area.checks],
    ['NPCs presentes',names(area.npcIds,linkedNpcs)],['Monstros presentes',names(area.monsterIds,monsters)]]),'area');
 }).join('');
 const mapCards=maps.map(level=>card(level.name,level.type||'Mapa',
  '<div class="adventure-read-map">'+imageElementHtml(level.mapImage,level.mapUrl,{className:'adventure-overview-map-image',alt:'Mapa de '+level.name})+'</div>'+
  fields([['Locais vinculados',String(areas.filter(area=>area.levelId===level.id).length)]])+p(level.description),
  fields([['Notas privadas',level.notes],['URL do mapa',level.mapUrl]]),'map')).join('');
 const npcCards=linkedNpcs.map(npc=>card(npc.name,npc.role||'NPC',
  p(npc.description),fields([['Papel',npc.role],['Descrição',npc.description],['Notas',npc.notes],['Origem',npc.source]]),'npc')).join('');
 const monsterCards=monsters.map(monster=>card(monster.name,monster.source||'Biblioteca',
  fields([['CA',monster.ac],['PV',monster.maxHp],['Iniciativa',monster.initiativeModifier]]),
  fields([['Origem',monster.source],['Identificador na Biblioteca',monster.monsterId]]),'monster')).join('');
 const factions=rows(a.exploration?.factions),factionCards=factions.map(f=>card(f.name,
  ({friendly:'Amigável',neutral:'Neutra',hostile:'Hostil',allied:'Aliada',unknown:'Indefinida'})[f.stance]||f.stance,
  p(f.publicDescription||f.description||f.relationship),
  fields([['Objetivo',f.objective],['Relações',f.relationship],['Descrição do Mestre',f.description],['Notas',f.dmNotes]]),'faction')).join('');
 const missionCards=ordered(a.missions).map(m=>card(m.title,
  ({hidden:'Oculta',active:'Ativa',completed:'Concluída',failed:'Falhou',abandoned:'Abandonada'})[m.status]||m.status,
  p(m.description),fields([['Recompensa',m.reward],['Consequência',m.consequence],['Notas',m.notes]]),'mission')).join('');
 const sessionIds=new Set(rows(a.sessionIds)),linkedScenes=new Set(rows(a.scenes).map(s=>s.sessionId).filter(Boolean));
 const sessions=rows(c?.sessions).filter(s=>s.adventureId===a.id||sessionIds.has(s.id)||linkedScenes.has(s.id));
 const sessionCards=sessions.map(s=>card(s.title||'Sessão '+(s.order||s.number||''),
  'Sessão '+(s.order||s.number||''),p(s.summary||s.description),fields([['Data',s.date],['Status',s.status]]),'session')).join('');
 const notes=rows(a.dmNoteEntries).map(n=>card('Nota do Mestre','Reservada',p(n.text),'','note')).join('');
 const summary=fields([['Campanha',c?.name],['Status',({planned:'Planejada',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'})[a.status]||a.status],
  ['Tipo',({main:'Principal',side:'Secundária',oneshot:'One-shot',secondary:'Arco secundário'})[a.type]||a.type],['Ordem',a.order],
  ['Situação atual',a.currentSituation],['Próximo passo',a.nextStep]]);
 return '<div class="adventure-read-intro"><div><span class="adventure-read-eyebrow">Área de consulta</span><h2>Visão Geral da Aventura</h2><p>Informações reunidas para preparar e conduzir a sessão. Edições e cadastros ficam exclusivamente em Criar conteúdo.</p></div></div>'+
  '<section class="adventure-read-section adventure-read-about"><header class="adventure-read-section-head"><div><h2>Sobre a aventura</h2></div></header><div class="adventure-read-about-content">'+p(a.description||a.summary||'Nenhum resumo cadastrado.')+summary+'</div></section>'+
  section('overview-participantes','Jogadores',playerCards?adventureAssignments(a,c).length:0,playerCards,'Participantes vinculados à aventura')+
  section('overview-cenas','Cenas',rows(a.scenes).length,sceneCards)+
  section('overview-locais','Locais',areas.length,areaCards)+
  section('overview-mapas','Mapas',maps.length,mapCards)+
  section('overview-npcs','NPCs',linkedNpcs.length,npcCards)+
  section('overview-monstros','Monstros',monsters.length,monsterCards)+
  (missionCards?section('overview-objetivos','Objetivos',rows(a.missions).length,missionCards):'')+
  (factionCards?section('overview-faccoes','Facções',factions.length,factionCards):'')+
  (sessionCards?section('overview-sessoes','Sessões vinculadas',sessions.length,sessionCards):'')+
  (notes?section('overview-notas','Notas do Mestre',rows(a.dmNoteEntries).length,notes):'');
}
