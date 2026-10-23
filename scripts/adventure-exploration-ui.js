/* Espaço de exploração para o Mestre: mapas opcionais, áreas persistentes,
   referências ao restante do Hub, facções e crônica de visitas.
   Os formulários não pressupõem nenhuma aventura, cenário ou sistema. */
import{createExplorationEntity,updateExplorationEntity,removeExplorationEntity,changeAreaStatus,setCurrentExplorationArea,explorationProgress}from'./adventure-exploration-state.js?v=20261023-simplified2';
import{uploadImage,deleteImage,persistCampaignMediaState,imagePickerHtml,bindImagePicker}from'./image-media.js?v=20261023-simplified2';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const STATUS={unknown:'Não descoberta',discovered:'Descoberta',visited:'Visitada',resolved:'Resolvida',blocked:'Bloqueada'};
const STANCES={unknown:'Indefinida',friendly:'Amigável',neutral:'Neutra',hostile:'Hostil',allied:'Aliada'};
let selectedAreaId=null,expandedFactionId=null;
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
function areaDetail(area,a,c,exploration){
 const level=exploration.levels.find(x=>x.id===area.levelId);
 const name=areaLabel(area);
 const linkedEnemies=arr(area.monsterIds).map(id=>a.monsters.find(monster=>monster.id===id)?.name).filter(Boolean).join(', ');
 const linkedTreasure=arr(area.treasureIds).map(id=>a.treasures.find(t=>t.id===id)?.name).filter(Boolean).join(', ');
 return '<article class="explore-detail card" id="explore-area-detail" data-ex-area="'+esc(area.id)+'">'+
  '<div class="explore-detail-heading"><div><h3>Área selecionada</h3><p class="mini">'+esc(name)+(level?' · Mapa: '+esc(level.name):' · Sem mapa')+'</p></div><button type="button" class="secondary" data-ex-delete="area" data-ex-id="'+esc(area.id)+'">Excluir área</button></div>'+
  '<div class="explore-fields explore-area-detail-fields">'+
   field('Inimigos','enemies',area.enemies||linkedEnemies,'textarea','rows="2"')+
   field('Armadilhas e Perigos','hazards',area.hazards,'textarea','rows="2"')+
   field('Tesouro','treasure',area.treasure||linkedTreasure,'textarea','rows="2"')+
   field('Testes e mecânicas','checks',area.checks,'textarea','rows="2"')+
   field('Texto para narração','readAloud',area.readAloud,'textarea','rows="3"')+
   field('Descrição para o Mestre','description',area.description,'textarea','rows="3"')+
   field('Tipo','type',area.type)+
   field('XP','xp',area.xp??0,'input','type="number" min="0" step="1"')+
  '</div>'+
  '<div class="explore-detail-actions"><button type="button" data-ex-save-area>Salvar área</button><button type="button" class="secondary" data-ex-focus-area="'+esc(area.id)+'">'+(exploration.activeAreaId===area.id?'Limpar área atual':'Definir como área atual')+'</button></div>'+
 '</article>';
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
    '<label class="explore-check"><input type="checkbox" data-ex-publish'+checked(f.visibleToPlayers)+'>Publicar facção aos jogadores</label>'+
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
 const selected=areas.find(area=>area.id===selectedAreaId)||areas[0]||null;
 const progress=explorationProgress(exploration);
 return '<section class="card adventure-exploration" id="exploracao">'+
 '<div class="explore-title"><h2>Exploração</h2><span class="badge">'+progress.total+' '+(progress.total===1?'área':'áreas')+'</span></div>'+
 '<details class="explore-create" id="ex-create-area" open><summary>Adicionar área / sala</summary>'+
 '<form id="ex-new-area" class="explore-create-form explore-create-area">'+
 '<label>Identificador<input name="code" required placeholder="A01, Sala 1, Torre norte..."></label>'+
 '<label>Status<select name="status">'+selectOptions(STATUS,'unknown')+'</select></label>'+
 '<label>Mapa<select name="levelId">'+choices(levels,null,'— Sem mapa —')+'</select></label>'+
 '<label>Tipo de ambiente<input name="type" placeholder="Sala, corredor, floresta..."></label>'+
 '<button type="submit">Criar área</button></form></details>'+
 '<div class="explore-area-grid">'+(areas.length?areas.map(area=>{
  const level=levels.find(l=>l.id===area.levelId);
  return '<article class="explore-area-card'+(selected?.id===area.id?' is-selected':'')+'">'+
   '<div><small>'+esc(level?.name||'Sem mapa')+'</small><strong>'+esc(areaLabel(area))+'</strong><span class="mini">'+esc(area.type||'Ambiente não definido')+'</span></div>'+
   '<div class="explore-card-actions"><label>Status<select data-ex-quick-status="'+esc(area.id)+'" aria-label="Status de '+esc(areaLabel(area))+'">'+selectOptions(STATUS,area.status)+'</select></label>'+
   '<button type="button" class="secondary" data-ex-open-area="'+esc(area.id)+'">Abrir</button></div>'+
  '</article>';
 }).join(''):'<div class="story-empty">Nenhuma área cadastrada.</div>')+'</div>'+
 (selected?areaDetail(selected,a,c,exploration):'<div class="story-empty">Selecione ou adicione uma área para editar suas informações.</div>')+
 '<details class="explore-create" id="ex-level-manager" open><summary>Adicionar mapa / nível</summary>'+
 '<form id="ex-new-level" class="explore-create-form explore-create-map">'+
 '<label>Nome do mapa<input name="name" required placeholder="Primeiro andar, Floresta..."></label>'+
 '<label>Mapa<input type="file" name="mapFile" accept="image/jpeg,image/png,image/webp"></label>'+
 '<label>URL do mapa<input name="mapUrl" placeholder="https://... ou caminho relativo"></label>'+
 '<label>Tipo<input name="type" placeholder="Masmorra, região, cidade..."></label>'+
 '<label>Descrição<textarea name="description" rows="2"></textarea></label>'+
 '<button type="submit">Adicionar mapa</button></form>'+
 '<div class="explore-level-grid">'+levels.map(l=>
   '<article data-ex-level="'+esc(l.id)+'" class="story-card explore-level-card">'+
   '<div class="explore-fields">'+
   field('Nome do mapa','name',l.name)+
   '<div class="explore-map-upload"><strong>Mapa</strong>'+imagePickerHtml({media:l.mapImage,legacyUrl:l.mapUrl,alt:'Mapa de '+l.name,className:'explore-map-image'})+'</div>'+
   field('URL do mapa','mapUrl',l.mapUrl,'input','placeholder="https://... ou caminho relativo"')+
   field('Tipo','type',l.type)+
   field('Descrição','description',l.description,'textarea','rows="2"')+
   '</div><div class="row-actions"><button type="button" data-ex-save-level>Salvar mapa</button><button type="button" class="secondary" data-ex-delete="level" data-ex-id="'+esc(l.id)+'">Excluir mapa</button></div></article>'
  ).join('')+'</div></details></section>';
}
export function bindAdventureExploration({getAdventure,getCampaign,save,feedback}){
 const root=document.getElementById('exploracao');
 const factions=document.getElementById('faccoes');
 if(!root&&!factions)return;
 const get=()=>getAdventure()?.exploration;
 const apply=(result,message)=>{
  if(!result||result.error||!result.exploration){feedback(result?.error||'Não foi possível atualizar a exploração.',false);return false}
  save(result.exploration,message);return true;
 };
 const edit=(kind,id,node)=>{
  const changes={};
  node.querySelectorAll('[data-ex-field]').forEach(input=>{
   let value=input.value;
   if(['order','mapX','mapY','xp'].includes(input.dataset.exField))value=value===''?0:Number(value);
   changes[input.dataset.exField]=value;
  });
  const toggle=node.querySelector('[data-ex-publish]');
  if(toggle)changes.visibleToPlayers=toggle.checked;
  node.querySelectorAll('[data-ex-ref]').forEach(input=>{
   const key=input.dataset.exRef;
   if(!Object.hasOwn(changes,key))changes[key]=[...node.querySelectorAll('[data-ex-ref="'+key+'"]:checked')].map(x=>x.value);
  });
  apply(updateExplorationEntity(get(),kind,id,changes),kind==='area'?'Área atualizada.':'Registro atualizado.');
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
 root?.querySelectorAll('[data-ex-open-area]').forEach(button=>button.addEventListener('click',()=>{
  selectedAreaId=button.dataset.exOpenArea;save(null,null,true);
  document.getElementById('explore-area-detail')?.scrollIntoView({block:'nearest'});
 }));
 root?.querySelectorAll('[data-ex-quick-status]').forEach(select=>select.addEventListener('change',()=>{
  apply(changeAreaStatus(get(),select.dataset.exQuickStatus,select.value),'Status da área atualizado.');
 }));
 root?.querySelector('#ex-new-level')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,name=form.elements.name.value.trim();if(!name)return;
  const file=form.elements.mapFile.files?.[0]||null;
  const result=createExplorationEntity(get(),'level',{name,mapUrl:form.elements.mapUrl.value,type:form.elements.type.value,description:form.elements.description.value});
  if(!result)return;
  apply(result,'Mapa criado.');
  if(file)try{await syncMap(result.entity.id,{file})}catch(error){feedback(error.message,false)}
 });
 root?.querySelector('#ex-new-area')?.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target,code=form.elements.code.value.trim();if(!code)return;
  const result=createExplorationEntity(get(),'area',{code,name:code,status:form.elements.status.value,levelId:form.elements.levelId.value||null,type:form.elements.type.value});
  if(result){selectedAreaId=result.entity.id;apply(result,'Área criada.')}
 });
 factions?.querySelector('#ex-new-faction')?.addEventListener('submit',event=>{
  event.preventDefault();
  const name=event.target.elements.name.value.trim();if(!name)return;
  const result=createExplorationEntity(get(),'faction',{name});
  if(result){expandedFactionId=result.entity.id;apply(result,'Facção criada.')}
 });
 root?.querySelectorAll('[data-ex-save-level]').forEach(button=>button.addEventListener('click',()=>{
  const node=button.closest('[data-ex-level]');if(node)edit('level',node.dataset.exLevel,node);
 }));
 root?.querySelector('[data-ex-save-area]')?.addEventListener('click',event=>{
  const node=event.target.closest('[data-ex-area]');if(node)edit('area',node.dataset.exArea,node);
 });
 root?.querySelector('[data-ex-focus-area]')?.addEventListener('click',event=>{
  const id=event.target.dataset.exFocusArea;
  apply(setCurrentExplorationArea(get(),get()?.activeAreaId===id?null:id),'Área atualizada.');
 });
 root?.querySelectorAll('[data-ex-level] .explore-map-upload [data-image-picker]').forEach(picker=>{
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
 for(const scope of [root,factions].filter(Boolean)){
  scope.querySelectorAll('[data-ex-delete]').forEach(button=>button.addEventListener('click',()=>{
   if(!confirm('Excluir este registro e desvincular as referências associadas?'))return;
   const kind=button.dataset.exDelete,id=button.dataset.exId;
   const previousMap=kind==='level'?get()?.levels.find(level=>level.id===id)?.mapImage:null;
   const result=removeExplorationEntity(get(),kind,id);
   if(kind==='area'&&selectedAreaId===id)selectedAreaId=null;
   if(kind==='faction'&&expandedFactionId===id)expandedFactionId=null;
   if(apply(result,'Registro excluído.')&&previousMap)deleteImage(previousMap).catch(()=>{});
  }));
 }
}
