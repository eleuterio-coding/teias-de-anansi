import{readNpcs,writeNpcs,npcMasterAuthorized,uid}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,updateCampaign}from'./campaign-state.js?v=20261022-roster2';
import{readAdventures}from'./adventure-state.js?v=20261016-current-status2';
import{collaborationAccessMode,sharedCampaignRows,sharedAdventures,effectiveCollaborationSession,masterPreviewMode}from'./collaboration-view.js?v=20261021-ficha-permissao3';
import{npcInCampaign,npcInAdventure,adventuresOf,currentAdventure,previousAdventures,adventureCurrentLocation,sessionHistory,statusLabel as lifeLabel}from'./roster-context.js?v=20261022-roster2';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[],fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const categoryNames={ally:'Aliado',enemy:'Inimigo',neutral:'Neutro',mentor:'Mentor',merchant:'Comerciante',antagonist:'Antagonista',contact:'Contato'};
let view='cards';
const initialCampaign=new URLSearchParams(location.search).get('campaign')||'all';let campaignFilterInitialized=false;
function isMaster(){return collaborationAccessMode()==='master'&&npcMasterAuthorized()&&!masterPreviewMode()}
function allCampaigns(){return isMaster()?readCampaigns():sharedCampaignRows().map(row=>row.campaign)}
function masterSources(campaign){
 const list=new Map(readNpcs().filter(n=>n.id).map(n=>[n.id,{id:n.id,name:n.name||'NPC sem nome',sheet:true,source:n}]));
 for(const n of arr(campaign?.npcs))if(n?.id&&!list.has(n.id))list.set(n.id,{id:n.id,name:n.name||'NPC',sheet:false,source:n});
 for(const n of arr(campaign?.npcDirectory))if(n?.id&&!list.has(n.id))list.set(n.id,{id:n.id,name:n.name||'NPC',sheet:false,source:n});
 return[...list.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
}
function masterEntries(campaigns){
 const map=new Map();
 for(const n of readNpcs())if(n.id)map.set(n.id,{id:n.id,name:n.name||'NPC sem nome',sheet:true,source:n,linked:[]});
 for(const campaign of campaigns){
  const existing=arr(campaign.npcDirectory),legacy=arr(campaign.npcs);
  for(const row of [...legacy,...existing]){
   if(!row?.id)continue;
   const value=map.get(row.id)||{id:row.id,name:row.name||'NPC',sheet:false,source:row,linked:[]};
   if(row.name&&!value.sheet)value.name=row.name;
   map.set(row.id,value)
  }
  const linkedAdventures=readAdventures().filter(a=>a.campaignId===campaign.id);
  for(const adv of linkedAdventures)for(const item of arr(adv.legacyNpcs))if(item?.id&&!map.has(item.id))map.set(item.id,{id:item.id,name:item.name||'NPC',sheet:false,source:item,linked:[]});
  const ids=new Set([...legacy,...existing].map(n=>n.id).filter(Boolean));
  for(const adv of linkedAdventures)for(const id of arr(adv.npcIds))if(map.has(id))ids.add(id);
  for(const id of arr(campaign.importantNpcIds)){
   if(!map.has(id)&&campaign.importantNpcPublicNames?.[id])map.set(id,{id,name:campaign.importantNpcPublicNames[id],sheet:false,source:{id,name:campaign.importantNpcPublicNames[id]},linked:[]});
   if(map.has(id))ids.add(id)
  }
  for(const id of ids){
   const value=map.get(id);if(!value)continue;
   const meta=existing.find(n=>n.id===id)||legacy.find(n=>n.id===id)||{};
   const revealed=existing.find(n=>n.id===id)?.visibleToPlayers===true||(existing.every(n=>n.id!==id)&&campaign.importantNpcVisibility?.[id]===true);
   value.linked.push({campaign,meta,revealed});
  }
 }
 return[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
}
function publicEntries(campaigns){
 const result=[];
 for(const campaign of campaigns){
  const map=new Map();
  for(const row of arr(campaign.importantNpcEntries))if(row?.id&&row.name)map.set(row.id,{id:row.id,name:row.name});
  for(const row of arr(campaign.npcPublicEntries))if(row?.id&&row.name)map.set(row.id,{...row});
  for(const npc of map.values())result.push({id:npc.id,name:npc.name,sheet:false,source:npc,category:npc.category||'',linked:[{campaign,meta:npc,revealed:true}],public:true,key:campaign.id+':'+npc.id})
 }
 return result
}
function categories(npc){return isMaster()?npc.linked.find(l=>l.meta?.category)?.meta.category||'neutral':npc.category||''}
function status(npc){if(!isMaster())return'n/a';return npc.linked.some(x=>x.revealed)?'revealed':'hidden'}
function image(npc){
 const value=String(isMaster()?npc.source?.portraitUrl||npc.source?.avatarUrl||'':npc.source?.portraitUrl||'');
 if(/^https?:\/\//i.test(value)||/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value))return'<img loading="lazy" src="'+esc(value)+'" alt="">';
 return esc(npc.name.trim().slice(0,1).toUpperCase()||'?')
}
function noteKey(){return 'hub-rpg:player-npc-notes:'+String(effectiveCollaborationSession()?.uid||'no-user')+':v1'}
function notes(){try{const value=JSON.parse(localStorage.getItem(noteKey())||'{}');return value&&typeof value==='object'?value:{}}catch{return{}}}
function relatedAdventures(npc,master){const cs=npc.linked.map(l=>l.campaign),ids=new Set(cs.map(c=>c.id));return adventuresOf(npc,(master?readAdventures():sharedAdventures()).filter(a=>ids.has(a.campaignId)),cs,true)}
function sessionAppearances(npc){const master=isMaster();return npc.linked.flatMap(l=>arr(l.campaign.sessions).filter(s=>master?(['completed','finished','active','current'].includes(s.status)&&(arr(s.scenes).some(scene=>arr(scene.npcIds).includes(npc.id))||readAdventures().some(a=>a.campaignId===l.campaign.id&&arr(a.scenes).some(scene=>scene.sessionId===s.id&&arr(scene.npcIds).includes(npc.id))))):arr(s.publicNpcIds).includes(npc.id)).map(s=>({campaign:l.campaign,session:s})))}
function card(npc){
 const master=isMaster(),scope=window.__HUB_ROSTER_SCOPE__||{},first=npc.linked.find(l=>l.campaign.id===scope.selectedCampaign?.id)||npc.linked[0],campaignLinks=npc.linked.map(r=>`<a href="mesa.html?id=${encodeURIComponent(r.campaign.id)}">${esc(r.campaign.name)}</a>`).join(' · '),info=first?.meta||{},known=master?info:npc.source,
 label=master?(npc.linked.length?'Vinculado':'Sem campanha'):'Conhecido';
 const secondary=master?(info.role||npc.source?.refSnapshots?.class?.name||'Ficha de NPC'):(known.role||known.category&&categoryNames[known.category]||'NPC conhecido');
 const situation=master?(info.status||''):(known.status||'');
 const location=master?(info.location||''):(known.location||'');
 const playerNotes=notes(),key=npc.key||((first?.campaign?.id||'')+':'+npc.id),adventures=relatedAdventures(npc,master),sessions=sessionAppearances(npc);
 const current=currentAdventure(adventures,npc.linked.map(x=>x.campaign)),past=previousAdventures(adventures,current,npc.linked.map(x=>x.campaign),npc,true,!master);
 const currentLocation=adventureCurrentLocation(current,npc.linked.find(x=>x.campaign.id===current?.campaignId)?.campaign);
 const infoStatus=String(situation||'NPC').toLocaleLowerCase('pt-BR');
 const life=['vivo','alive','active'].includes(infoStatus)?'Vivo':['morto','dead'].includes(infoStatus)?'Morto':['desaparecido','missing'].includes(infoStatus)?'Desaparecido':'NPC';
 const source=master?npc.source||{}:known||{},klass=master?source.refSnapshots?.class?.name||'':known.className,level=master?source.choices?.class?.level:known.level;
 const race=master?source.refSnapshots?.species?.name||'':known.species,background=master?source.refSnapshots?.background?.name||'':known.background;
 const facts=`<dl class="hub-roster-info">
 <div><dt>Responsável pelo NPC</dt><dd>Mestre</dd></div><div><dt>Nome do NPC</dt><dd>${esc(npc.name)}</dd></div>
 <div><dt>Classe</dt><dd>${esc(klass||'Não informada')}</dd></div><div><dt>Nível</dt><dd>${esc(level||'Não informado')}</dd></div>
 <div><dt>Raça / Espécie</dt><dd>${esc(race||'Não informada')}</dd></div><div><dt>Antecedente</dt><dd>${esc(background||'Não informado')}</dd></div>
 <div><dt>Status</dt><dd>${esc(life)}</dd></div><div><dt>Local (Aventura)</dt><dd>${esc(currentLocation||'Não registrado na cena ativa')}</dd></div>
 <div class="hub-roster-full"><dt>Aventura atual</dt><dd>${esc(current?.title||'Nenhuma aventura em andamento vinculada')}</dd></div>
 <div class="hub-roster-full"><dt>Aventuras anteriores</dt><dd>${esc(past.map(a=>a.title).join(' · ')||'Nenhuma concluída registrada')}</dd></div>
 <div class="hub-roster-full"><dt>Sessões em que apareceu</dt><dd>${esc(sessions.map(x=>x.session.title).join(' · ')||(master?'Nenhuma aparição registrada':'Não disponibilizadas na visão do jogador'))}</dd></div>
 </dl>`;
 return`<article class="hub-directory-card" data-npc-id="${esc(npc.id)}">
 <div class="hub-directory-card-top"><div class="hub-directory-avatar">${image(npc)}</div><div><h3>${esc(npc.name||'NPC sem nome')}</h3><p>${esc(secondary)}</p></div></div>
 <div class="hub-directory-meta"><span class="hub-directory-tag">${esc(label)}</span>${master?`<span class="hub-directory-tag status-${status(npc)}">${status(npc)==='revealed'?'Revelado':'Não revelado'}</span>`:''}${situation?`<span class="hub-directory-tag">${esc(situation)}</span>`:''}</div>
 <div class="hub-directory-context">${campaignLinks?`<span>Campanha: ${campaignLinks}</span>`:'<span>Não vinculado a uma campanha</span>'}
 ${master&&info.faction?`<span>Facção: ${esc(info.faction)}</span>`:''}
 ${!master&&known.faction?`<span>Facção conhecida: ${esc(known.faction)}</span>`:''}
 ${location?`<span>${master?'Localização':'Última localização conhecida'}: ${esc(location)}</span>`:''}
 ${master&&info.notes?`<span>Anotações do mestre disponíveis na configuração.</span>`:''}
 ${!master&&known.description?`<span>${esc(known.description)}</span>`:''}
 ${adventures.length?`<span>Aventuras: ${adventures.map(a=>`<a href="aventuras.html?campaign=${encodeURIComponent(a.campaignId)}&id=${encodeURIComponent(a.id)}">${esc(a.title)}</a>`).join(' · ')}</span>`:''}
 ${sessions.length?`<span>Aparições em sessões: ${sessions.map(({campaign,session})=>`<a href="sessoes.html?campaign=${encodeURIComponent(campaign.id)}&id=${encodeURIComponent(session.id)}">${esc(session.title)}</a>`).join(' · ')}</span>`:''}
 </div>
 ${facts}
 ${!master&&!masterPreviewMode()?`<details class="hub-directory-details"><summary>Minhas anotações</summary><div class="hub-directory-note-editor"><label for="note-${esc(key)}">Anotações pessoais (somente neste navegador)<textarea id="note-${esc(key)}" maxlength="3000" data-npc-note="${esc(key)}">${esc(playerNotes[key]||'')}</textarea></label><button type="button" class="secondary" data-save-player-note="${esc(key)}">Salvar anotação</button></div></details>`:''}
 <div class="hub-directory-actions">
 ${master&&npc.sheet?`<a class="btn" href="ficha-personagem.html?npc=1&id=${encodeURIComponent(npc.id)}">Abrir ficha</a><a class="btn secondary" href="criacao-personagem.html?npc=1&id=${encodeURIComponent(npc.id)}">Editar ficha</a>`:''}
 ${master?`<button type="button" class="secondary" data-config-npc="${esc(npc.id)}" data-campaign-id="${esc(first?.campaign?.id||'')}">${npc.linked.length?'Configurar':'Vincular'}</button>`:''}
 ${master&&npc.sheet?`<button type="button" class="secondary" data-duplicate-npc="${esc(npc.id)}">Duplicar</button><button type="button" class="danger" data-delete-npc="${esc(npc.id)}">Excluir</button>`:''}
 </div></article>`
}
function render(){
 const master=isMaster(),cs=allCampaigns(),rows=master?masterEntries(cs):collaborationAccessMode()==='player'?publicEntries(cs):[],search=fold($('npc-search').value),cid=campaignFilterInitialized?$('npc-campaign-filter').value:initialCampaign,category=$('npc-category-filter').value,visibility=$('npc-visibility-filter').value,lifeFilter=$('npc-life-filter')?.value||'all',scope=window.__HUB_ROSTER_SCOPE__||{};
 $('npc-master-actions').hidden=!master;
 $('npc-editor').hidden=!master||$('npc-editor').hidden;
 $('npc-subtitle').textContent=master?'Gerencie o elenco, os vínculos e o que cada campanha revela.':'NPCs conhecidos nas campanhas às quais você tem acesso.';
 const campaignSelect=$('npc-campaign-filter');campaignSelect.innerHTML='<option value="all">Todas as campanhas</option>'+cs.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');campaignSelect.value=cs.some(c=>c.id===cid)?cid:'all';campaignFilterInitialized=true;
 $('npc-visibility-filter').closest('label').hidden=!master;
 const filtered=rows.filter(n=>{
  const str=[n.name,n.source?.role,n.source?.faction,...n.linked.map(l=>[l.meta?.role,l.meta?.faction,l.meta?.publicName,l.campaign.name])].flat().join(' ');
  const raw=String(master?n.linked.find(l=>l.campaign.id===scope.selectedCampaign?.id)?.meta?.status||n.linked[0]?.meta?.status||'':n.source?.status||'').toLowerCase();
  const life=['vivo','active','alive'].includes(raw)?'alive':['morto','dead'].includes(raw)?'dead':['desaparecido','missing'].includes(raw)?'missing':'npc';
  return fold(str).includes(search)&&(!scope.selectedCampaign||n.linked.some(l=>l.campaign.id===scope.selectedCampaign.id))&&(!scope.selectedAdventure||npcInAdventure(n,scope.selectedAdventure))&&(cid==='all'||n.linked.some(l=>l.campaign.id===cid))&&(category==='all'||categories(n)===category)&&(lifeFilter==='all'||lifeFilter===life)&&(!master||visibility==='all'||status(n)===visibility)
 });
 const revealed=master?rows.filter(n=>status(n)==='revealed').length:rows.length;
 const campaignsWith= new Set(rows.flatMap(n=>n.linked.map(l=>l.campaign.id))).size;
 $('npc-metrics').innerHTML=[[filtered.length,master?'NPCs exibidos':'NPCs conhecidos'],[revealed,master?'NPCs revelados':'Registros disponíveis'],[campaignsWith,'Campanhas relacionadas']].map(([n,label])=>`<div class="hub-directory-metric"><strong>${n}</strong><span>${label}</span></div>`).join('');
 $('npc-list').className='hub-directory-grid'+(view==='list'?' is-list':'');
 $('npc-list').innerHTML=filtered.length?filtered.map(card).join(''):`<div class="hub-directory-empty">${collaborationAccessMode()==='guest'?'Faça login para acessar NPCs.':rows.length?'Nenhum NPC encontrado com esses filtros.':master?'Nenhum NPC cadastrado. Use Novo NPC para criar uma ficha ou cadastre um NPC em Campanhas.':'Ainda não há NPCs revelados nas suas campanhas.'}</div>`;
 $('npc-view-cards').setAttribute('aria-pressed',String(view==='cards'));$('npc-view-list').setAttribute('aria-pressed',String(view==='list'));
}
function populateCampaign(id=''){
 const cs=readCampaigns(),el=$('npc-campaign');
 el.innerHTML='<option value="">Selecione uma campanha</option>'+cs.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
 el.value=cs.some(c=>c.id===id)?id:cs[0]?.id||'';
 populateNpcs()
}
function populateNpcs(wanted=''){
 const campaign=readCampaigns().find(c=>c.id===$('npc-campaign').value),sources=masterSources(campaign),el=$('npc-identity');
 el.innerHTML='<option value="">Selecione um NPC</option>'+sources.map(n=>`<option value="${esc(n.id)}">${esc(n.name)}${n.sheet?' · Ficha':''}</option>`).join('');
 el.value=sources.some(n=>n.id===wanted)?wanted:sources[0]?.id||'';
 fillEditor()
}
function fillEditor(){
 const campaign=readCampaigns().find(c=>c.id===$('npc-campaign').value),id=$('npc-identity').value,entry=arr(campaign?.npcDirectory).find(n=>n.id===id)||{},source=masterSources(campaign).find(n=>n.id===id),legacy=arr(campaign?.npcs).find(n=>n.id===id)||{};
 const set=(field,value)=>{$(field).value=value??''};
 const legacyVisible=campaign?.importantNpcVisibility?.[id]===true,publicName=campaign?.importantNpcPublicNames?.[id]||'';
 set('npc-category',entry.category||'neutral');set('npc-role',entry.role||legacy.role||'');set('npc-faction',entry.faction||legacy.faction||'');
 set('npc-relationship',entry.relationship||legacy.relationship||'');set('npc-status',entry.status||legacy.status||'');
 set('npc-location',entry.location||'');set('npc-notes',entry.notes||legacy.notes||'');
 $('npc-reveal').checked=entry.id?entry.visibleToPlayers===true:legacyVisible;
 set('npc-public-name',entry.publicName||publicName);set('npc-public-category',entry.publicCategory||'');
 set('npc-public-class',entry.publicClass);set('npc-public-level',entry.publicLevel||'');set('npc-public-species',entry.publicSpecies);set('npc-public-background',entry.publicBackground);
 set('npc-public-role',entry.publicRole);set('npc-public-faction',entry.publicFaction);set('npc-public-relationship',entry.publicRelationship);
 set('npc-public-status',entry.publicStatus);set('npc-public-location',entry.publicLocation);
 set('npc-public-description',entry.publicDescription);set('npc-public-portrait',entry.publicPortraitUrl);
 $('unlink-npc-entry').hidden=!entry.id;
 $('save-npc-entry').disabled=!source||!campaign;
}
function openEditor(id='',campaignId=''){
 if(!isMaster())return;
 const cs=readCampaigns();
 if(!cs.length){alert('Cadastre uma campanha antes de vincular NPCs.');return}
 $('npc-editor').hidden=false;
 populateCampaign(campaignId);
 populateNpcs(id);
 $('npc-editor').scrollIntoView({block:'start',behavior:'smooth'})
}
function persistEntry(unlink=false){
 if(!isMaster())return;
 const all=readCampaigns(),campaign=all.find(c=>c.id===$('npc-campaign').value),id=$('npc-identity').value,source=masterSources(campaign).find(n=>n.id===id);
 if(!campaign||!source)return;
 const visible=$('npc-reveal').checked,name=$('npc-public-name').value.trim();
 if(!unlink&&visible&&!name){alert('Informe o nome conhecido antes de revelar o NPC.');$('npc-public-name').focus();return}
 const previous=arr(campaign.npcDirectory).find(n=>n.id===id);
 const rows=arr(campaign.npcDirectory).filter(n=>n.id!==id);
 if(!unlink)rows.push({
  id,sheetId:source.sheet?id:null,name:source.name,
  category:$('npc-category').value,role:$('npc-role').value,faction:$('npc-faction').value,relationship:$('npc-relationship').value,
  status:$('npc-status').value,location:$('npc-location').value,notes:$('npc-notes').value,visibleToPlayers:visible,
  publicName:name,publicCategory:$('npc-public-category').value,publicClass:$('npc-public-class').value,publicLevel:$('npc-public-level').value,publicSpecies:$('npc-public-species').value,publicBackground:$('npc-public-background').value,publicRole:$('npc-public-role').value,
  publicFaction:$('npc-public-faction').value,publicRelationship:$('npc-public-relationship').value,
  publicStatus:$('npc-public-status').value,publicLocation:$('npc-public-location').value,
  publicDescription:$('npc-public-description').value,
  publicPortraitUrl:/^https:\/\//i.test($('npc-public-portrait').value.trim())?$('npc-public-portrait').value.trim():'',
  updatedAt:new Date().toISOString()
 });
 // Ocultar também referências legadas, para que desvincular não mantenha dados expostos.
 const oldVisibility={...(campaign.importantNpcVisibility||{})};
 oldVisibility[id]=!unlink&&visible;
 const publicNames={...(campaign.importantNpcPublicNames||{})};if(!unlink&&visible)publicNames[id]=name;
 const result=updateCampaign(all,campaign.id,{npcDirectory:rows,importantNpcVisibility:oldVisibility,importantNpcPublicNames:publicNames});
 if(!result.ok){alert(result.reason||'Não foi possível atualizar NPC.');return}
 writeCampaigns(result.list);$('npc-editor').hidden=true;render()
}
$('link-npc')?.addEventListener('click',()=>openEditor());
$('close-npc-editor')?.addEventListener('click',()=>{$('npc-editor').hidden=true});
$('npc-campaign')?.addEventListener('change',()=>populateNpcs());
$('npc-identity')?.addEventListener('change',fillEditor);
$('npc-directory-form')?.addEventListener('submit',event=>{event.preventDefault();persistEntry()});
$('unlink-npc-entry')?.addEventListener('click',()=>{if(confirm('Desvincular este NPC da campanha e retirar a publicação associada?'))persistEntry(true)});
$('npc-list')?.addEventListener('click',event=>{
 const link=event.target.closest('[data-config-npc]');
 if(link){openEditor(link.dataset.configNpc,link.dataset.campaignId);return}
 const duplicate=event.target.closest('[data-duplicate-npc]');
 if(duplicate&&isMaster()){
  const npc=readNpcs().find(n=>n.id===duplicate.dataset.duplicateNpc);if(!npc)return;
  const copy=structuredClone(npc);copy.id=uid();copy.name=(npc.name||'NPC')+' (cópia)';copy.updatedAt=new Date().toISOString();
  writeNpcs([...readNpcs(),copy]);render();return
 }
 const remove=event.target.closest('[data-delete-npc]');
 if(remove&&isMaster()){
  const npc=readNpcs().find(n=>n.id===remove.dataset.deleteNpc);if(!npc)return;
  const linked=readCampaigns().some(c=>arr(c.npcDirectory).some(n=>n.id===npc.id)||arr(c.npcs).some(n=>n.id===npc.id)||arr(c.importantNpcIds).includes(npc.id));
  if(linked){alert('Desvincule este NPC das campanhas antes de excluir a ficha.');return}
  if(!confirm('Excluir permanentemente a ficha de '+(npc.name||'NPC')+'?'))return;
  writeNpcs(readNpcs().filter(n=>n.id!==npc.id));render()
 }
 const noteButton=event.target.closest('[data-save-player-note]');
 if(noteButton&&!isMaster()&&!masterPreviewMode()){
  const field=[...$('npc-list').querySelectorAll('[data-npc-note]')].find(x=>x.dataset.npcNote===noteButton.dataset.savePlayerNote);
  if(!field)return;
  const next=notes();next[noteButton.dataset.savePlayerNote]=field.value;
  try{localStorage.setItem(noteKey(),JSON.stringify(next));noteButton.textContent='Salvo neste navegador'}catch{alert('Não foi possível salvar a anotação.')}
 }
});
for(const field of['npc-search','npc-campaign-filter','npc-category-filter','npc-visibility-filter','npc-life-filter'])$(field)?.addEventListener(field==='npc-search'?'input':'change',render);
$('npc-view-cards')?.addEventListener('click',()=>{view='cards';render()});
$('npc-view-list')?.addEventListener('click',()=>{view='list';render()});
window.addEventListener('hub-rpg:remote-updated',event=>{event.detail?.claim?.();render()});
window.addEventListener('hub-rpg:collaboration-session-changed',render);
window.addEventListener('storage',event=>{if(['hub-rpg:npcs:v1','hub-rpg:campaigns:v1'].includes(event.key))render()});
render();
