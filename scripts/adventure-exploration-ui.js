/* Espaço de exploração para o Mestre: mapas opcionais, áreas persistentes,
   referências ao restante do Hub, facções e crônica de visitas.
   Os formulários não pressupõem nenhuma aventura, cenário ou sistema. */
import{createExplorationEntity,updateExplorationEntity,removeExplorationEntity,changeAreaStatus,setCurrentExplorationArea,explorationProgress}from'./adventure-exploration-state.js?v=20261023-simplified3';
import{uploadImage,deleteImage,persistCampaignMediaState,imagePickerHtml,bindImagePicker}from'./image-media.js?v=20261023-simplified3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const STATUS={unknown:'Não descoberta',discovered:'Descoberta',visited:'Visitada',resolved:'Resolvida',blocked:'Bloqueada'};
const STANCES={unknown:'Indefinida',friendly:'Amigável',neutral:'Neutra',hostile:'Hostil',allied:'Aliada'};
let selectedAreaId=null,expandedFactionId=null;
const expandedAreaIds=new Set(),expandedLevelIds=new Set();
const choices=(rows,selected,blank='— Nenhum —')=>'<option value="">'+esc(blank)+'</option>'+rows.map(row=>'<option value="'+esc(row.id)+'" '+(selected===row.id?'selected':'')+'>'+esc(row.code?row.code+' — '+row.name:row.name||row.title)+'</option>').join('');
const selectOptions=(labels,selected)=>Object.entries(labels).map(([value,label])=>'<option value="'+esc(value)+'" '+(value===selected?'selected':'')+'>'+esc(label)+'</option>').join('');
const field=(label,key,value,kind='input',extra='')=>'<label>'+esc(label)+(kind==='textarea'?'<textarea data-ex-field="'+key+'" '+extra+'>'+esc(value)+'</textarea>':'<input data-ex-field="'+key+'" value="'+esc(value)+'" '+extra+'>')+'</label>';
const checked=(value)=>value?' checked':'';
const areaLabel=area=>area.code&&area.name&&area.code!==area.name?area.code+' — '+area.name:area.code||area.name;
function referenceChecks(key,rows,selected=[]){
 const set=new Set(arr(selected));
 return '<fieldset class="explore-reference"><legend>'+esc(({npcIds:'NPCs',monsterIds:'Monstros',factionIds:'Facções',missionIds:'Objetivos',clueIds:'Pistas',handoutIds:'Materiais',treasureIds:'Tesouros',connectionIds:'Conexões'})[key]||key)+'</legend>'+
  (rows.length?rows.map(row=>'<label class="explore-check"><input type="checkbox" data-ex-ref="'+esc(key)+'" value="'+esc(row.id)+'"'+checked(set.has(row.id))+'>'+esc(row.code?row.code+' — '+row.name:row.name||row.title)+'</label>').join(''):'<span class="mini">Sem registros disponíveis.</span>')+
  '</fieldset>'
}
/* Os dois tipos de registro usam o mesmo card recolhível. */
function recordTitle(label,subtitle){
 return '<span class="explore-record-title"><strong>'+esc(label)+'</strong><span class="mini">'+esc(subtitle)+'</span></span>';
}
function areaDetail(area,a,c,exploration){
 const levels=arr(exploration.levels),areas=arr(exploration.areas),name=areaLabel(area);
 const level=levels.find(x=>x.id===area.levelId);
 return '<article class="explore-area-card explore-record-card'+(selectedAreaId===area.id?' is-selected':'')+'" data-ex-area="'+esc(area.id)+'">'+
  '<details class="explore-record-editor" data-ex-area-editor="'+esc(area.id)+'"'+(expandedAreaIds.has(area.id)?' open':'')+'>'+
   '<summary class="explore-record-summary">'+recordTitle(name,(level?.name||'Sem mapa')+' · '+(area.type||'Ambiente não definido'))+
    '<span class="explore-record-status">'+esc(STATUS[area.status]||STATUS.unknown)+'</span>'+
    '<span class="explore-record-toggle-label">Editar <span class="explore-record-chevron" aria-hidden="true"></span></span></summary>'+
   '<div class="explore-record-body">'+
    '<section class="explore-editor-group"><header><h4>Identificação</h4><p>Dados principais e mapa associado.</p></header><div class="explore-fields explore-area-detail-fields">'+
     field('Identificador','code',area.code)+
     field('Nome','name',area.name)+
     '<label>Status<select data-ex-field="status">'+selectOptions(STATUS,area.status)+'</select></label>'+
     '<label>Mapa / nível<select data-ex-field="levelId">'+choices(levels,area.levelId,'— Sem mapa —')+'</select></label>'+
     field('Tipo de ambiente','type',area.type)+
     '</div></section><section class="explore-editor-group"><header><h4>Desafios e recompensas</h4><p>XP, inimigos, perigos, tesouros e testes.</p></header><div class="explore-fields">'+
     field('XP','xp',area.xp??0,'input','type="number" min="0" step="1"')+
     field('Inimigos','enemies',area.enemies,'textarea','rows="2"')+
     field('Armadilhas e perigos','hazards',area.hazards,'textarea','rows="2"')+
     field('Tesouro','treasure',area.treasure,'textarea','rows="2"')+
     field('Testes e mecânicas','checks',area.checks,'textarea','rows="2"')+
     '</div></section><section class="explore-editor-group"><header><h4>Narrativa e notas</h4><p>Texto de narração e informações exclusivas do Mestre.</p></header><div class="explore-fields">'+
     field('Texto para narração','readAloud',area.readAloud,'textarea','rows="3"')+
     field('Descrição para o Mestre','description',area.description,'textarea','rows="3"')+
     field('Notas privadas do Mestre','dmNotes',area.dmNotes,'textarea','rows="3"')+
     '</div></section>'+ 
     '<div class="explore-detail-actions"><button type="button" data-ex-save-area>Salvar área</button>'+
     '<button type="button" class="secondary" data-ex-focus-area="'+esc(area.id)+'">'+(exploration.activeAreaId===area.id?'Limpar área atual':'Definir como área atual')+'</button>'+
     '<button type="button" class="danger" data-ex-delete="area" data-ex-id="'+esc(area.id)+'">Excluir área</button>'+
     '<button type="button" class="secondary" data-ex-close-record="area">Recolher</button></div>'+
   '</div></details>'+
   '<div class="explore-record-visibility-bar"><label class="explore-card-publish"><input type="checkbox" data-ex-publish data-ex-area-visibility="'+esc(area.id)+'"'+checked(area.visibleToPlayers)+'>Visível para jogadores</label></div>'+
   '</article>';
}
function levelDetail(level,areaCount=0){
 return '<article data-ex-level="'+esc(level.id)+'" class="story-card explore-level-card explore-record-card">'+
  '<details class="explore-record-editor" data-ex-level-editor="'+esc(level.id)+'"'+(expandedLevelIds.has(level.id)?' open':'')+'>'+
   '<summary class="explore-record-summary">'+recordTitle(level.name,(level.type||'Tipo não definido')+' · '+areaCount+' '+(areaCount===1?'área':'áreas')+' vinculadas')+
    '<span class="explore-record-toggle-label">Editar <span class="explore-record-chevron" aria-hidden="true"></span></span></summary>'+
   '<div class="explore-record-body">'+
    '<section class="explore-editor-group"><header><h4>Dados do mapa</h4><p>Identificação, tipo e endereço da imagem.</p></header><div class="explore-fields">'+
     field('Nome do mapa','name',level.name)+
     field('Tipo','type',level.type)+
     field('Ordem','order',level.order??1,'input','type="number" min="1" step="1"')+
     field('URL do mapa','mapUrl',level.mapUrl,'input','placeholder="https://... ou caminho relativo"')+
     '</div></section><section class="explore-editor-group"><header><h4>Descrição e acesso</h4><p>Notas para o Mestre e controle de visibilidade.</p></header><div class="explore-fields">'+
     field('Descrição','description',level.description,'textarea','rows="2"')+
     field('Notas privadas','notes',level.notes,'textarea','rows="3"')+
     '<label class="explore-publish"><input type="checkbox" data-ex-publish'+checked(level.visibleToPlayers)+'>Visível para jogadores</label>'+
     '</div></section><section class="explore-editor-group"><header><h4>Imagem do mapa</h4><p>Adicione, visualize ou substitua a imagem deste nível.</p></header><div class="explore-map-upload"><strong>Arquivo e visualização</strong>'+imagePickerHtml({media:level.mapImage,legacyUrl:level.mapUrl,alt:'Mapa de '+level.name,className:'explore-map-image'})+'</div></section>'+
    '<div class="explore-detail-actions"><button type="button" data-ex-save-level>Salvar mapa</button>'+
     '<button type="button" class="danger" data-ex-delete="level" data-ex-id="'+esc(level.id)+'">Excluir mapa</button>'+
     '<button type="button" class="secondary" data-ex-close-record="level">Recolher</button></div>'+
   '</div></details></article>';
}
function factionSection(exploration,a,c){
 return '<section class="card explore-faction-section" id="faccoes"><h2>Facções</h2><p class="mini">Gerencie as facções, suas relações e os NPCs vinculados.</p>'+
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

    '</div><div class="row-actions"><button type="button" data-ex-save-faction>Salvar facção</button><button type="button" class="secondary" data-ex-delete="faction" data-ex-id="'+esc(f.id)+'">Excluir</button><button type="button" class="secondary" data-ex-expand-faction="'+esc(f.id)+'">Fechar</button></div>':
    '<p class="mini">'+esc(f.relationship||f.publicDescription||'Sem relação registrada.')+'</p><button type="button" class="secondary" data-ex-expand-faction="'+esc(f.id)+'">Editar facção</button>')+
  '</article>').join('')+'</div>'+
  '<form id="ex-new-faction" class="explore-create-form"><label>Nova facção<input name="name" required placeholder="Nome da facção"></label><button type="submit">Adicionar facção</button></form></section>'
}
export function renderAdventureFactions(a,c){
 const exploration=a.exploration||{factions:[]};
 return factionSection(exploration,a,c);
}
export function renderAdventureExploration(a,c){
 const exploration=a.exploration||{levels:[],areas:[],factions:[],history:[]};
 const levels=arr(exploration.levels),areas=arr(exploration.areas);
 const progress=explorationProgress(exploration);
 const areaList='<section class="card adventure-exploration adventure-areas" id="exploracao">'+
  '<div class="explore-title"><div class="explore-title-copy"><h2>Locais</h2><p>Selecione um local para editar informações, desafios e notas.</p></div><span class="badge">'+progress.total+' '+(progress.total===1?'área':'áreas')+'</span></div>'+
  '<div class="explore-area-grid">'+(areas.length?areas.map(area=>areaDetail(area,a,c,exploration)).join(''):'<div class="story-empty">Nenhuma área cadastrada.</div>')+'</div></section>';
 const mapList='<section class="card adventure-exploration adventure-maps" id="mapas">'+
  '<div class="explore-title"><div class="explore-title-copy"><h2>Mapas</h2><p>Organize os mapas e gerencie suas imagens em cada registro.</p></div><span class="badge">'+levels.length+' '+(levels.length===1?'mapa':'mapas')+'</span></div>'+
  '<div class="explore-level-grid">'+(levels.length?levels.map(level=>levelDetail(level,areas.filter(area=>area.levelId===level.id).length)).join(''):'<div class="story-empty">Nenhum mapa cadastrado.</div>')+'</div></section>';
 const areaCreate='<section class="card adventure-exploration adventure-create-panel" id="criar-area">'+
  '<h2>Adicionar local</h2>'+
  '<form id="ex-new-area" class="explore-create-form explore-create-area">'+
  '<label>Identificador<input name="code" required placeholder="A01, Sala 1, Torre norte..."></label>'+
  '<label>Status<select name="status">'+selectOptions(STATUS,'unknown')+'</select></label>'+
  '<label>Mapa<select name="levelId">'+choices(levels,null,'— Sem mapa —')+'</select></label>'+
  '<label>Tipo de ambiente<input name="type" placeholder="Sala, corredor, floresta..."></label>'+
  '<button type="submit">Criar área</button></form></section>';
 const mapCreate='<section class="card adventure-exploration adventure-create-panel" id="criar-mapa">'+
  '<h2>Adicionar mapa</h2>'+
  '<form id="ex-new-level" class="explore-create-form explore-create-map">'+
  '<label>Nome do mapa<input name="name" required placeholder="Primeiro andar, Floresta..."></label>'+
  '<label>Mapa<input type="file" name="mapFile" accept="image/jpeg,image/png,image/webp"></label>'+
  '<label>URL do mapa<input name="mapUrl" placeholder="https://... ou caminho relativo"></label>'+
  '<label>Tipo<input name="type" placeholder="Masmorra, região, cidade..."></label>'+
  '<label>Descrição<textarea name="description" rows="2"></textarea></label>'+
  '<button type="submit">Adicionar mapa</button></form></section>';
 return areaList+mapList+areaCreate+mapCreate;
}
export function bindAdventureExploration({getAdventure,getCampaign,save,feedback}){
 const root=document.getElementById('exploracao');
 const mapRoot=document.getElementById('mapas');
 const factions=document.getElementById('faccoes');
 if(!root&&!mapRoot&&!factions)return;
 const get=()=>getAdventure()?.exploration;
 const apply=(result,message)=>{
  if(!result||result.error||!result.exploration){feedback(result?.error||'Não foi possível atualizar a exploração.',false);return false}
  save(result.exploration,message);return true;
 };
 const edit=(kind,id,node)=>{
  const changes={};
  node.querySelectorAll('[data-ex-field]').forEach(input=>{
   let value=input.value;
   const key=input.dataset.exField;
   if(['mapX','mapY'].includes(key))value=value===''?null:Number(value);
   else if(['order','xp'].includes(key))value=value===''?0:Number(value);
   else if(['levelId','parentId','locationId','chapterId'].includes(key))value=value||null;
   changes[key]=value;
  });
  const toggle=node.querySelector('[data-ex-publish]');
  if(toggle)changes.visibleToPlayers=toggle.checked;
  node.querySelectorAll('[data-ex-ref]').forEach(input=>{
   const key=input.dataset.exRef;
   if(!Object.hasOwn(changes,key))changes[key]=[...node.querySelectorAll('[data-ex-ref="'+key+'"]:checked')].map(x=>x.value);
  });
  const previous=get();
  const former=kind==='area'?previous?.areas?.find(row=>row.id===id):null;
  const requestedStatus=changes.status;
  const statusChanged=Boolean(former&&requestedStatus&&former.status!==requestedStatus);
  // Não antecipa a mudança: changeAreaStatus precisa ler o estado anterior
  // para registrar corretamente a crônica da exploração.
  if(statusChanged)delete changes.status;
  const next=updateExplorationEntity(previous,kind,id,changes);
  if(!next?.exploration)return feedback('Não foi possível atualizar o registro.',false);
  if(statusChanged){
   const statusResult=changeAreaStatus(next.exploration,id,requestedStatus);
   if(!statusResult?.exploration)return feedback(statusResult?.error||'Não foi possível atualizar o status.',false);
   return apply(statusResult,'Área e status atualizados.');
  }
  apply(next,kind==='area'?'Local atualizado.':'Mapa atualizado.');
 };
 const syncMap=async(levelId,{file=null,remove=false}={})=>{
  const adventure=getAdventure(),before=get(),previous=before?.levels.find(l=>l.id===levelId);
  if(!adventure?.campaignId||!previous)throw new Error('Mapa não encontrado na Aventura.');
  let media=null;
  if(file)media=await uploadImage({campaignId:adventure.campaignId,entityType:'adventure',entityId:adventure.id,file});
  const result=updateExplorationEntity(before,'level',levelId,{mapImage:remove?null:media,mapUrl:remove?'':previous.mapUrl});
  if(!result?.exploration){if(media)await deleteImage(media).catch(()=>{});throw new Error('Não foi possível salvar o mapa.')}
  if(remove&&!previous.mapImage?.id){apply(result,'URL do mapa removida.');return}
  save(result.exploration,remove?'Imagem removida do mapa.':'Imagem do mapa salva.');
  try{
   await persistCampaignMediaState(adventure.campaignId,{entityType:'adventure',entityId:adventure.id});
  }catch(error){
   save(before,'O mapa anterior foi restaurado.');
   if(media)await deleteImage(media).catch(()=>{});
   throw new Error('Não foi possível sincronizar a imagem. O mapa anterior foi preservado.');
  }
  if(previous.mapImage?.id&&(remove||media?.id!==previous.mapImage.id))await deleteImage(previous.mapImage).catch(()=>{});
 };
 for(const [scope,kind,attr,set] of [[root,'area','data-ex-area-editor',expandedAreaIds],[mapRoot,'level','data-ex-level-editor',expandedLevelIds]]){
  scope?.querySelectorAll('['+attr+']').forEach(details=>{
   const id=details.getAttribute(attr);
   details.addEventListener('toggle',()=>{
    if(details.open){set.add(id);if(kind==='area')selectedAreaId=id}
    else set.delete(id);
   });
  });
  scope?.querySelectorAll('[data-ex-close-record="'+kind+'"]').forEach(button=>button.addEventListener('click',()=>{
   const details=button.closest('details');if(details)details.open=false;
  }));
 }
 document.getElementById('ex-new-level')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,name=form.elements.name.value.trim();if(!name)return;
  const file=form.elements.mapFile.files?.[0]||null;
  const result=createExplorationEntity(get(),'level',{name,mapUrl:form.elements.mapUrl.value,type:form.elements.type.value,description:form.elements.description.value});
  if(!result)return;
  expandedLevelIds.add(result.entity.id);apply(result,'Mapa criado.');
  if(file)try{await syncMap(result.entity.id,{file})}catch(error){feedback(error.message,false)}
 });
 document.getElementById('ex-new-area')?.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target,code=form.elements.code.value.trim();if(!code)return;
  const result=createExplorationEntity(get(),'area',{code,name:code,status:form.elements.status.value,levelId:form.elements.levelId.value||null,type:form.elements.type.value});
  if(result){selectedAreaId=result.entity.id;expandedAreaIds.add(result.entity.id);apply(result,'Local criado.')}
 });
 factions?.querySelector('#ex-new-faction')?.addEventListener('submit',event=>{
  event.preventDefault();
  const name=event.target.elements.name.value.trim();if(!name)return;
  const result=createExplorationEntity(get(),'faction',{name});
  if(result){expandedFactionId=result.entity.id;apply(result,'Facção criada.')}
 });
 mapRoot?.querySelectorAll('[data-ex-save-level]').forEach(button=>button.addEventListener('click',()=>{
  const node=button.closest('[data-ex-level]');if(node)edit('level',node.dataset.exLevel,node);
 }));
 // Alterar a visibilidade independe da abertura do editor e não sobrescreve outros dados.
 root?.querySelectorAll('[data-ex-area-visibility]').forEach(input=>input.addEventListener('change',()=>{
  const id=input.dataset.exAreaVisibility;
  const result=updateExplorationEntity(get(),'area',id,{visibleToPlayers:input.checked});
  if(!apply(result,'Visibilidade da área atualizada.'))input.checked=!input.checked;
 }));
 root?.querySelectorAll('[data-ex-save-area]').forEach(button=>button.addEventListener('click',event=>{
  const node=event.target.closest('[data-ex-area]');if(node)edit('area',node.dataset.exArea,node);
 }));
 root?.querySelectorAll('[data-ex-focus-area]').forEach(button=>button.addEventListener('click',event=>{
  const id=event.target.dataset.exFocusArea;
  apply(setCurrentExplorationArea(get(),get()?.activeAreaId===id?null:id),'Local atualizado.');
 }));
 mapRoot?.querySelectorAll('[data-ex-level] .explore-map-upload [data-image-picker]').forEach(picker=>{
  const id=picker.closest('[data-ex-level]')?.dataset.exLevel;if(!id)return;
  bindImagePicker(picker,{
   onSelect:async file=>syncMap(id,{file}),
   onRemove:async()=>syncMap(id,{remove:true}),
   onError:error=>feedback(error?.message||'Não foi possível atualizar a imagem.',false)
  });
 });
 factions?.querySelectorAll('[data-ex-save-faction]').forEach(button=>button.addEventListener('click',()=>{
  const node=button.closest('[data-ex-faction]');if(node)edit('faction',node.dataset.exFaction,node);
 }));
 factions?.querySelectorAll('[data-ex-expand-faction]').forEach(button=>button.addEventListener('click',()=>{
  expandedFactionId=expandedFactionId===button.dataset.exExpandFaction?null:button.dataset.exExpandFaction;
  save(null,null,true);
 }));
 for(const scope of [root,mapRoot,factions].filter(Boolean)){
  scope.querySelectorAll('[data-ex-delete]').forEach(button=>button.addEventListener('click',()=>{
   if(!confirm('Excluir este registro e desvincular as referências associadas?'))return;
   const kind=button.dataset.exDelete,id=button.dataset.exId;
   const previousMap=kind==='level'?get()?.levels.find(level=>level.id===id)?.mapImage:null;
   const result=removeExplorationEntity(get(),kind,id);
   if(kind==='area'){expandedAreaIds.delete(id);if(selectedAreaId===id)selectedAreaId=null}
   if(kind==='level')expandedLevelIds.delete(id);
   if(kind==='faction'&&expandedFactionId===id)expandedFactionId=null;
   if(apply(result,'Registro excluído.')&&previousMap)deleteImage(previousMap).catch(()=>{});
  }));
 }
}
