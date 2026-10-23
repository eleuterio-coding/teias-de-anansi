/* Espaço de exploração para o Mestre: mapas opcionais, áreas persistentes,
   referências ao restante do Hub, facções e crônica de visitas.
   Os formulários não pressupõem nenhuma aventura, cenário ou sistema. */
import{createExplorationEntity,updateExplorationEntity,removeExplorationEntity,changeAreaStatus,setCurrentExplorationArea,explorationProgress,EXPLORATION_STATUS,FACTION_STANCE}from'./adventure-exploration-state.js?v=20261023-exploration1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const STATUS={unknown:'Não descoberta',discovered:'Descoberta',visited:'Visitada',resolved:'Resolvida',blocked:'Bloqueada'};
const STANCES={unknown:'Indefinida',friendly:'Amigável',neutral:'Neutra',hostile:'Hostil',allied:'Aliada'};
let levelFilter='all',areaFilter='all',areaQuery='',view='list',selectedAreaId=null,expandedFactionId=null;
const choices=(rows,selected,blank='— Nenhum —')=>'<option value="">'+esc(blank)+'</option>'+rows.map(row=>'<option value="'+esc(row.id)+'" '+(selected===row.id?'selected':'')+'>'+esc(row.code?row.code+' — '+row.name:row.name||row.title)+'</option>').join('');
const selectOptions=(labels,selected)=>Object.entries(labels).map(([value,label])=>'<option value="'+esc(value)+'" '+(value===selected?'selected':'')+'>'+esc(label)+'</option>').join('');
const field=(label,key,value,kind='input',extra='')=>'<label>'+esc(label)+(kind==='textarea'?'<textarea data-ex-field="'+key+'" '+extra+'>'+esc(value)+'</textarea>':'<input data-ex-field="'+key+'" value="'+esc(value)+'" '+extra+'>')+'</label>';
const checked=(value)=>value?' checked':'';
function referenceChecks(key,rows,selected=[]){
 const set=new Set(arr(selected));
 return '<fieldset class="explore-reference"><legend>'+esc(({npcIds:'NPCs',monsterIds:'Monstros',factionIds:'Facções',missionIds:'Objetivos',clueIds:'Pistas',handoutIds:'Materiais',treasureIds:'Tesouros',connectionIds:'Conexões'})[key]||key)+'</legend>'+
  (rows.length?rows.map(row=>'<label class="explore-check"><input type="checkbox" data-ex-ref="'+esc(key)+'" value="'+esc(row.id)+'"'+checked(set.has(row.id))+'>'+esc(row.code?row.code+' — '+row.name:row.name||row.title)+'</label>').join(''):'<span class="mini">Sem registros disponíveis.</span>')+
  '</fieldset>'
}
function areaDetail(area,a,c,exploration){
 const level=exploration.levels.find(x=>x.id===area.levelId);
 const parents=exploration.areas.filter(x=>x.id!==area.id&&x.levelId===area.levelId);
 const connections=exploration.areas.filter(x=>x.id!==area.id);
 const sessions=arr(c?.sessions).filter(s=>s.adventureId===a.id||arr(a.scenes).some(sc=>sc.sessionId===s.id));
 const histories=exploration.history.filter(h=>h.areaId===area.id);
 const sceneLinks=a.scenes.filter(sc=>sc.areaId===area.id);
 return '<article class="explore-detail card" id="explore-area-detail" data-ex-area="'+esc(area.id)+'">'+
  '<div class="explore-detail-heading"><div><p class="mini">ÁREA SELECIONADA'+(level?' · '+esc(level.name):'')+'</p><h3>'+esc((area.code?area.code+' — ':'')+area.name)+'</h3></div><button type="button" class="secondary" data-ex-delete="area" data-ex-id="'+esc(area.id)+'">Excluir área</button></div>'+
  '<div class="explore-fields">'+
   field('Identificador / número','code',area.code)+field('Nome','name',area.name)+field('Tipo / categoria','type',area.type)+
   '<label>Nível<select data-ex-field="levelId">'+choices(exploration.levels,area.levelId,'— Sem nível —')+'</select></label>'+
   '<label>Área superior<select data-ex-field="parentId">'+choices(parents,area.parentId,'— Nenhuma —')+'</select></label>'+
   '<label>Capítulo narrativo<select data-ex-field="chapterId">'+choices(a.chapters,area.chapterId)+'</select></label>'+
   '<label>Local vinculado à campanha<select data-ex-field="locationId">'+choices(arr(c?.locations).filter(l=>a.locationIds.includes(l.id)),area.locationId)+'</select></label>'+
   field('Ordem','order',area.order,'input','type="number" min="1" step="1"')+
   field('Marcador horizontal (%)','mapX',area.mapX??'','input','type="number" min="0" max="100" step="0.1" placeholder="Opcional"')+
   field('Marcador vertical (%)','mapY',area.mapY??'','input','type="number" min="0" max="100" step="0.1" placeholder="Opcional"')+
   '<label class="explore-check"><input type="checkbox" data-ex-publish'+checked(area.visibleToPlayers)+'>Exibir área na visão do Jogador</label>'+
   field('Descrição pública','publicDescription',area.publicDescription,'textarea','rows="2"')+
   field('Descrição para o Mestre','description',area.description,'textarea','rows="3"')+
   field('Texto para narração','readAloud',area.readAloud,'textarea','rows="3"')+
   field('Elementos e interações','features',area.features,'textarea','rows="2"')+
   field('Testes e mecânicas','checks',area.checks,'textarea','rows="2"')+
   field('Armadilhas e perigos','hazards',area.hazards,'textarea','rows="2"')+
   field('Consequências e mudanças','outcomes',area.outcomes,'textarea','rows="2"')+
   field('Notas privadas','dmNotes',area.dmNotes,'textarea','rows="2"')+
  '</div>'+
  '<details class="explore-references"><summary>Vínculos com NPCs, criaturas, pistas, tesouros e outras áreas</summary><div class="explore-reference-grid">'+
   referenceChecks('connectionIds',connections,area.connectionIds)+
   referenceChecks('npcIds',arr(c?.npcs).filter(n=>a.npcIds.includes(n.id)),area.npcIds)+
   referenceChecks('monsterIds',a.monsters,area.monsterIds)+
   referenceChecks('factionIds',exploration.factions,area.factionIds)+
   referenceChecks('missionIds',a.missions,area.missionIds)+
   referenceChecks('clueIds',a.clues,area.clueIds)+
   referenceChecks('handoutIds',a.handouts,area.handoutIds)+
   referenceChecks('treasureIds',a.treasures,area.treasureIds)+
  '</div></details>'+
  '<div class="explore-detail-actions"><button type="button" data-ex-save-area>Salvar dados da área</button><button type="button" class="secondary" data-ex-focus-area="'+esc(area.id)+'">'+(exploration.activeAreaId===area.id?'Limpar área atual':'Definir como área atual')+'</button><a class="btn secondary" href="#cenas">Cenas vinculadas: '+sceneLinks.length+'</a></div>'+
  '<div class="explore-visit-panel"><h4>Estado e crônica da área</h4><p class="mini">Atualizar uma área não conclui cenas nem encontros automaticamente.</p>'+
  '<div class="explore-fields"><label>Estado<select id="ex-area-status">'+selectOptions(STATUS,area.status)+'</select></label>'+
  '<label>Sessão relacionada<select id="ex-area-session">'+choices(sessions.map(s=>({...s,name:s.title||'Sessão '+s.number})),null,'— Sem sessão —')+'</select></label>'+
  '<label class="explore-check"><input type="checkbox" id="ex-history-visible">Publicar registro aos jogadores</label>'+
  field('Registro do que aconteceu','visit-notes','','textarea','rows="2"').replace('data-ex-field="visit-notes"','id="ex-visit-notes"')+
  '</div><button type="button" data-ex-record>Registrar acontecimento</button>'+
  (histories.length?'<div class="explore-history">'+histories.map(h=>'<article class="explore-history-item"><small>'+esc(new Date(h.at).toLocaleString('pt-BR'))+' · '+esc(STATUS[h.status]||h.status)+(h.sessionId?' · Sessão vinculada':'')+'</small><p>'+esc(h.text||'Estado atualizado.')+'</p></article>').join('')+'</div>':'<p class="mini">Sem registros nesta área.</p>')+
  '</div></article>'
}
function factionSection(exploration,a,c){
 return '<section class="card explore-faction-section" id="exploracao-faccoes"><h3>Facções e relações</h3><p class="mini">Facções pertencem à Aventura. NPCs e áreas podem ser associados sem duplicar fichas.</p>'+
 '<div class="explore-faction-grid">'+exploration.factions.map(f=>'<article class="story-card" data-ex-faction="'+esc(f.id)+'"><div class="explore-faction-head"><strong>'+esc(f.name)+'</strong><span class="badge">'+esc(STANCES[f.stance])+'</span></div>'+
  (expandedFactionId===f.id?'<div class="explore-fields">'+
    field('Nome','name',f.name)+
    '<label>Relação com o grupo<select data-ex-field="stance">'+selectOptions(STANCES,f.stance)+'</select></label>'+
    field('Objetivo / motivação (privado)','objective',f.objective,'textarea')+
    field('Relação / consequências (privado)','relationship',f.relationship,'textarea')+
    field('Descrição interna','description',f.description,'textarea')+
    field('Descrição pública','publicDescription',f.publicDescription,'textarea')+
    field('Notas privadas','dmNotes',f.dmNotes,'textarea')+
    referenceChecks('npcIds',arr(c?.npcs).filter(n=>a.npcIds.includes(n.id)),f.npcIds)+
    '<label class="explore-check"><input type="checkbox" data-ex-publish'+checked(f.visibleToPlayers)+'>Publicar facção aos jogadores</label>'+
    '</div><div class="row-actions"><button type="button" data-ex-save-faction>Salvar facção</button><button type="button" class="secondary" data-ex-delete="faction" data-ex-id="'+esc(f.id)+'">Excluir</button><button type="button" class="secondary" data-ex-expand-faction="'+esc(f.id)+'">Fechar</button></div>':
    '<p class="mini">'+esc(f.relationship||f.publicDescription||'Sem relação registrada.')+'</p><button type="button" class="secondary" data-ex-expand-faction="'+esc(f.id)+'">Editar facção</button>')+
  '</article>').join('')+'</div>'+
  '<form id="ex-new-faction" class="explore-create-form"><label>Nova facção<input name="name" required placeholder="Nome da facção"></label><button type="submit">Adicionar facção</button></form></section>'
}
export function renderAdventureExploration(a,c){
 const exploration=a.exploration||{levels:[],areas:[],factions:[],history:[]},levels=exploration.levels||[],areas=exploration.areas||[],progress=explorationProgress(exploration);
 if(!levels.some(l=>l.id===levelFilter))levelFilter='all';
 const search=areaQuery.toLocaleLowerCase('pt-BR');
 const filtered=areas.filter(area=>(levelFilter==='all'||area.levelId===levelFilter)&&(areaFilter==='all'||area.status===areaFilter)&&(!search||[area.name,area.code,area.type,area.description].some(s=>String(s||'').toLocaleLowerCase('pt-BR').includes(search))));
 const selected=areas.find(area=>area.id===selectedAreaId)||null;
 const focused=areas.find(area=>area.id===exploration.activeAreaId)||null;
 const mapLevel=levels.find(l=>l.id===levelFilter)||null;
 const displayAreas=(view==='map'&&mapLevel)?filtered.filter(x=>x.levelId===mapLevel.id&&x.mapX!==null&&x.mapY!==null):[];
 return '<section class="card adventure-exploration" id="exploracao"><div class="explore-title"><div><h2>Exploração</h2><p class="mini">Áreas persistentes, exploração não linear e mapas opcionais. Nada é revelado automaticamente.</p></div><span class="badge">'+progress.visited+' / '+progress.total+' áreas visitadas</span></div>'+
 '<div class="explore-summary">'+(focused?'<span><strong>Área atual:</strong> '+esc((focused.code?focused.code+' — ':'')+focused.name)+'</span>':'')+'<span><strong>'+progress.discovered+'</strong> descobertas</span><span><strong>'+progress.visited+'</strong> visitadas</span><span><strong>'+progress.resolved+'</strong> resolvidas</span><span><strong>'+levels.length+'</strong> níveis</span></div>'+
 '<div class="explore-toolbar"><label>Nível<select id="ex-level-filter"><option value="all">Todos os níveis</option>'+levels.map(l=>'<option value="'+esc(l.id)+'"'+(levelFilter===l.id?' selected':'')+'>'+esc(l.name)+'</option>').join('')+'</select></label>'+
 '<label>Estado<select id="ex-status-filter"><option value="all">Todos os estados</option>'+selectOptions(STATUS,areaFilter)+'</select></label>'+
 '<label>Buscar área<input id="ex-area-search" value="'+esc(areaQuery)+'" placeholder="Número, nome, tipo..."></label>'+
 '<div class="explore-view-switch"><button type="button" class="'+(view==='list'?'':'secondary')+'" data-ex-view="list">Lista</button><button type="button" class="'+(view==='map'?'':'secondary')+'" data-ex-view="map">Mapa</button></div></div>'+
 (view==='map'?
  '<div class="explore-map-shell">'+
   (mapLevel?.mapUrl?'<div class="explore-map" role="group" aria-label="Mapa do nível '+esc(mapLevel.name)+'"><img src="'+esc(mapLevel.mapUrl)+'" alt="Mapa do nível '+esc(mapLevel.name)+'" loading="lazy">'+displayAreas.map(area=>'<button type="button" class="explore-map-pin'+(area.id===selectedAreaId?' is-selected':'')+'" style="left:'+area.mapX+'%;top:'+area.mapY+'%" data-ex-open-area="'+esc(area.id)+'" title="'+esc((area.code?area.code+' — ':'')+area.name)+'" aria-label="Abrir '+esc(area.name)+'">'+esc(area.code||'•')+'</button>').join('')+'</div><p class="mini">Os marcadores são definidos por coordenadas percentuais no editor da área. O mapa é exclusivo do Mestre.</p>':
   '<p class="story-empty">Selecione um nível com imagem configurada para visualizar o mapa. As áreas continuam disponíveis na lista.</p>')+
  '</div>':'')+
 '<div class="explore-area-grid">'+(filtered.length?filtered.map(area=>'<article class="explore-area-card'+(selectedAreaId===area.id?' is-selected':'')+'"><div><small>'+esc(levels.find(x=>x.id===area.levelId)?.name||'Sem nível')+'</small><strong>'+esc((area.code?area.code+' — ':'')+area.name)+'</strong><span class="mini">'+esc(area.type||'Área')+'</span></div><div class="explore-card-actions"><span class="badge">'+esc(STATUS[area.status])+'</span><button type="button" class="secondary" data-ex-open-area="'+esc(area.id)+'">Abrir</button></div></article>').join(''):'<div class="story-empty">Nenhuma área corresponde aos filtros.</div>')+'</div>'+
 (selected?areaDetail(selected,a,c,exploration):'<div class="story-empty">Selecione uma área para editar ou registrar acontecimentos.</div>')+
 '<details class="explore-create" id="ex-create-area"><summary>Adicionar área / sala</summary><form id="ex-new-area" class="explore-create-form"><label>Identificador<input name="code" placeholder="A01 (opcional)"></label><label>Nome<input name="name" required placeholder="Nome da área"></label><label>Nível<select name="levelId">'+choices(levels,levelFilter==='all'?null:levelFilter,'— Sem nível —')+'</select></label><label>Tipo<input name="type" placeholder="Sala, região, corredor, local..."></label><button type="submit">Criar área</button></form></details>'+
 '<details class="explore-create" id="ex-level-manager"><summary>Gerenciar níveis e mapas</summary><p class="mini">O mapa é uma imagem opcional, por URL HTTPS ou caminho relativo do site. Não será enviado automaticamente aos jogadores.</p><div class="explore-level-grid">'+levels.map(l=>'<article data-ex-level="'+esc(l.id)+'" class="story-card"><div class="explore-fields">'+
 field('Nome do nível','name',l.name)+
 field('Ordem','order',l.order,'input','type="number" min="1"')+
 field('URL do mapa','mapUrl',l.mapUrl,'input','placeholder="https://... ou caminho relativo"')+
 field('Descrição','description',l.description,'textarea')+
 field('Notas do Mestre','notes',l.notes,'textarea')+
 '<label class="explore-check"><input type="checkbox" data-ex-publish'+checked(l.visibleToPlayers)+'>Publicar nome do nível</label>'+
 '</div><div class="row-actions"><button type="button" data-ex-save-level>Salvar nível</button><button type="button" class="secondary" data-ex-delete="level" data-ex-id="'+esc(l.id)+'">Excluir nível</button></div></article>').join('')+'</div>'+
 '<form id="ex-new-level" class="explore-create-form"><label>Nome do novo nível<input name="name" required placeholder="Região, distrito, andar, setor..."></label><button type="submit">Adicionar nível</button></form></details>'+
 factionSection(exploration,a,c)+'</section>'
}
export function bindAdventureExploration({getAdventure,getCampaign,save,feedback}){
 const root=document.getElementById('exploracao');if(!root)return;
 const get=()=>getAdventure()?.exploration;
 const apply=(res,message)=>{
  if(!res||res.error||!res.exploration)return feedback(res?.error||'Não foi possível atualizar a exploração.',false);
  save(res.exploration,message)
 };
 const edit=(kind,id,node)=>{
  const changes={};
  node.querySelectorAll('[data-ex-field]').forEach(input=>{
   let value=input.value;
   if(['order','mapX','mapY'].includes(input.dataset.exField))value=value===''?(input.dataset.exField==='order'?1:null):Number(value);
   changes[input.dataset.exField]=value;
  });
  const toggle=node.querySelector('[data-ex-publish]');if(toggle)changes.visibleToPlayers=toggle.checked;
  node.querySelectorAll('[data-ex-ref]').forEach(input=>{
   const key=input.dataset.exRef;
   if(!Object.hasOwn(changes,key))changes[key]=[...node.querySelectorAll('[data-ex-ref="'+key+'"]:checked')].map(x=>x.value)
  });
  apply(updateExplorationEntity(get(),kind,id,changes),kind==='area'?'Área atualizada.':'Registro atualizado.')
 };
 root.querySelector('#ex-level-filter')?.addEventListener('change',e=>{levelFilter=e.target.value;selectedAreaId=null;save(null,null,true)});
 root.querySelector('#ex-status-filter')?.addEventListener('change',e=>{areaFilter=e.target.value;save(null,null,true)});
 root.querySelector('#ex-area-search')?.addEventListener('change',e=>{areaQuery=e.target.value;save(null,null,true)});
 root.querySelectorAll('[data-ex-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.exView;save(null,null,true)}));
 root.querySelectorAll('[data-ex-open-area]').forEach(b=>b.addEventListener('click',()=>{selectedAreaId=b.dataset.exOpenArea;save(null,null,true);document.getElementById('explore-area-detail')?.scrollIntoView({block:'nearest'})}));
 root.querySelector('#ex-new-level')?.addEventListener('submit',e=>{e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return;const result=createExplorationEntity(get(),'level',{name});if(result){levelFilter=result.entity.id;apply(result,'Nível criado.')}});
 root.querySelector('#ex-new-area')?.addEventListener('submit',e=>{e.preventDefault();const form=e.target;const name=form.elements.name.value.trim();if(!name)return;const result=createExplorationEntity(get(),'area',{name,code:form.elements.code.value,type:form.elements.type.value,levelId:form.elements.levelId.value||null});if(result){selectedAreaId=result.entity.id;apply(result,'Área criada.')}});
 root.querySelector('#ex-new-faction')?.addEventListener('submit',e=>{e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return;const result=createExplorationEntity(get(),'faction',{name});if(result){expandedFactionId=result.entity.id;apply(result,'Facção criada.')}});
 root.querySelectorAll('[data-ex-save-level]').forEach(b=>b.addEventListener('click',()=>{const node=b.closest('[data-ex-level]');edit('level',node.dataset.exLevel,node)}));
 root.querySelector('[data-ex-save-area]')?.addEventListener('click',e=>{const node=e.target.closest('[data-ex-area]');edit('area',node.dataset.exArea,node)});
 root.querySelector('[data-ex-focus-area]')?.addEventListener('click',e=>{const id=e.target.dataset.exFocusArea;apply(setCurrentExplorationArea(get(),get()?.activeAreaId===id?null:id),'Área atualizada.')} );
 root.querySelectorAll('[data-ex-save-faction]').forEach(b=>b.addEventListener('click',()=>{const node=b.closest('[data-ex-faction]');edit('faction',node.dataset.exFaction,node)}));
 root.querySelectorAll('[data-ex-expand-faction]').forEach(b=>b.addEventListener('click',()=>{expandedFactionId=expandedFactionId===b.dataset.exExpandFaction?null:b.dataset.exExpandFaction;save(null,null,true)}));
 root.querySelectorAll('[data-ex-delete]').forEach(b=>b.addEventListener('click',()=>{
  if(!confirm('Excluir este registro e desvincular as referências associadas?'))return;
  const kind=b.dataset.exDelete,id=b.dataset.exId;
  const result=removeExplorationEntity(get(),kind,id);
  if(kind==='area'&&selectedAreaId===id)selectedAreaId=null;
  if(kind==='faction'&&expandedFactionId===id)expandedFactionId=null;
  apply(result,'Registro excluído.');
 }));
 root.querySelector('[data-ex-record]')?.addEventListener('click',()=>{
  const area=get()?.areas.find(x=>x.id===selectedAreaId);if(!area)return;
  apply(changeAreaStatus(get(),area.id,root.querySelector('#ex-area-status').value,{sessionId:root.querySelector('#ex-area-session').value||null,notes:root.querySelector('#ex-visit-notes').value,visibleToPlayers:root.querySelector('#ex-history-visible').checked}),'Acontecimento registrado.');
 })
}
