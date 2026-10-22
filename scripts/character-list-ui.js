import{read,write,uid}from'./character-builder/state.js';
import{collaborationAccessMode,editableCharacterIds,visibleCharacterIds,sharedCharacters,canEditCharacter,canOpenCharacter,playerCharacterInfo,masterPreviewMode,sharedCampaignRows,sharedAdventures,effectiveCollaborationSession}from'./collaboration-view.js?v=20261021-ficha-permissao3';
import{readCampaigns,writeCampaigns,updateCampaign}from'./campaign-state.js?v=20261022-directories1';
import{readAdventures}from'./adventure-state.js?v=20261016-current-status2';
import{deleteCharacterAsMaster}from'./character-admin-actions.js?v=20260918-master-delete1';
import{characterIdentity}from'./character-gender.js?v=20261019-gender1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[],norm=v=>String(v??'').toLocaleLowerCase('pt-BR'),statusNames={active:'Ativo',inactive:'Inativo',retired:'Aposentado',dead:'Morto',missing:'Desaparecido'};
let view='cards';
const initialCampaign=new URLSearchParams(location.search).get('campaign')||'all';let campaignFilterInitialized=false;
function context(){
 const mode=collaborationAccessMode(),restricted=mode==='player',session=effectiveCollaborationSession();
 return{mode,restricted,guest:mode==='guest',preview:masterPreviewMode(),session,owned:new Set(editableCharacterIds()),visible:new Set(visibleCharacterIds())}
}
function characters(ctx){
 if(ctx.guest)return[];
 const local=read();
 if(!ctx.restricted)return local;
 const map=new Map(local.filter(c=>ctx.visible.has(c.id)).map(c=>[c.id,c]));
 for(const remote of sharedCharacters())if(ctx.visible.has(remote.id)&&!ctx.owned.has(remote.id))map.set(remote.id,remote);
 return[...map.values()]
}
function campaigns(ctx){return ctx.restricted?sharedCampaignRows().map(row=>row.campaign):readCampaigns()}
function associations(character,campaigns){
 return campaigns.filter(c=>arr(c.members).some(m=>m.characterId===character.id)||arr(c.sessions).some(s=>arr(s.participantCharacterIds).includes(character.id)))
}
function statusFor(character,campaign,ctx){
 if(!campaign)return'';
 if(ctx.restricted)return'';
 return arr(campaign.characterDirectory).find(row=>row.id===character.id)?.status||'active'
}
function klass(c){return c.refSnapshots?.class?.name||c.className||'Classe não informada'}
function species(c){return characterIdentity(c,{includeName:false})||c.refSnapshots?.species?.name||'Espécie não informada'}
function level(c){const n=Number(c.choices?.class?.level||c.level);return Number.isFinite(n)&&n>0?'Nível '+n:'Nível não informado'}
function owner(c,campaigns){
 const member=campaigns.flatMap(row=>arr(row.members)).find(row=>row.characterId===c.id);
 const info=playerCharacterInfo(c.id);
 return info?.ownerDisplayName||member?.name||c.ownerDisplayName||info?.ownerUsername||c.ownerUsername||'Não atribuído';
}
function portrait(c){
 const value=String(c.portraitUrl||c.avatarUrl||'');
 if(/^https?:\/\//i.test(value)||/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value))return'<img src="'+esc(value)+'" loading="lazy" alt="">';
 return esc(String(c.name||'?').trim().slice(0,1).toLocaleUpperCase('pt-BR')||'?')
}
function safeCampaigns(){const ctx=context();return campaigns(ctx)}
function updateDirectory(id,campaignId,patch){
 if(context().mode!=='master')return;
 const all=readCampaigns(),campaign=all.find(c=>c.id===campaignId);
 if(!campaign)return;
 const old=arr(campaign.characterDirectory).find(row=>row.id===id)||{id,status:'active',notes:''};
 const rows=arr(campaign.characterDirectory).filter(row=>row.id!==id).concat({...old,...patch,id});
 const result=updateCampaign(all,campaignId,{characterDirectory:rows});
 if(result.ok){writeCampaigns(result.list);render()}
}
function characterAdventures(c,ctx,linked){const allowed=new Set(linked.map(row=>row.id));return(ctx.restricted?sharedAdventures():readAdventures()).filter(a=>allowed.has(a.campaignId)&&arr(a.characterIds).includes(c.id))}
function card(c,ctx,campaigns){
 const linked=associations(c,campaigns),isOwned=ctx.owned.has(c.id),canEdit=canEditCharacter(c.id),canOpen=canOpenCharacter(c.id),
 linkedIds=linked.map(row=>row.id);
 const visibleSessionCount=linked.reduce((n,row)=>n+arr(row.sessions).filter(s=>arr(s.participantCharacterIds).includes(c.id)).length,0);
 const statuses=linked.map(row=>statusFor(c,row,ctx)).filter(Boolean),adventures=characterAdventures(c,ctx,linked);
 const status=linked.length?(ctx.restricted?'':statuses[0]||'active'):'';
 const statusLabel=linked.length?(ctx.restricted?'Vinculado':statuses.length>1&&statuses.some(x=>x!==statuses[0])?'Status variáveis':statusNames[status]||'Ativo'):'Sem campanha';
 const editableContext=!ctx.restricted&&linked.length;
 const detail=editableContext?`<details class="hub-directory-details"><summary>Gerenciar por campanha</summary>${linked.map(row=>{
  const meta=arr(row.characterDirectory).find(x=>x.id===c.id)||{status:'active',notes:''};
  return`<div><label>${esc(row.name)} — Status<select data-character-status="${esc(c.id)}" data-campaign-id="${esc(row.id)}">${Object.entries(statusNames).map(([value,label])=>`<option value="${value}" ${meta.status===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Anotação privada do mestre<textarea data-note-character="${esc(c.id)}" data-note-campaign="${esc(row.id)}" maxlength="2000">${esc(meta.notes)}</textarea></label><button type="button" class="secondary" data-save-note="${esc(c.id)}" data-campaign-id="${esc(row.id)}">Salvar anotação</button></div>`
 }).join('')}</details>`:''; 
 const actions=`<div class="hub-directory-actions">${canOpen?`<a class="btn" href="ficha-personagem.html?id=${encodeURIComponent(c.id)}">Abrir ficha</a>`:''}${canEdit?`<a class="btn secondary" href="criacao-personagem.html?id=${encodeURIComponent(c.id)}">Editar estrutura</a>`:''}${ctx.mode==='master'?`<button type="button" class="secondary" data-duplicate="${esc(c.id)}">Duplicar</button><button type="button" class="danger" data-delete="${esc(c.id)}">Excluir</button>`:''}</div>`;
 return`<article class="hub-directory-card pc" data-character-id="${esc(c.id)}"><div class="hub-directory-card-top"><div class="hub-directory-avatar">${portrait(c)}</div><div><h3>${esc(c.name||'Personagem sem nome')}</h3><p>${esc(species(c))} · ${esc(klass(c))} · ${esc(level(c))}</p></div></div>
 <div class="hub-directory-meta"><span class="hub-directory-tag ${status?'status-'+esc(status):''}">${esc(statusLabel)}</span>${ctx.restricted?(isOwned?'<span class="hub-directory-tag">Seu personagem</span>':'<span class="hub-directory-tag">Outro jogador · somente leitura</span>'):''}</div>
 <div class="hub-directory-context"><span>Jogador: ${esc(owner(c,linked))}</span>
 ${linked.length?`<span>Campanhas: ${linked.map(row=>`<a href="mesa.html?id=${encodeURIComponent(row.id)}">${esc(row.name)}</a>`).join(' · ')}</span>`:'<span>Nenhuma campanha vinculada</span>'}
 ${adventures.length?`<span>Aventuras: ${adventures.map(a=>`<a href="aventuras.html?campaign=${encodeURIComponent(a.campaignId)}&id=${encodeURIComponent(a.id)}">${esc(a.title)}</a>`).join(' · ')}</span>`:''}
 ${visibleSessionCount?`<span><a href="sessoes.html?campaign=${encodeURIComponent(linked[0].id)}">${visibleSessionCount} ${visibleSessionCount===1?'sessão registrada':'sessões registradas'}</a></span>`:''}
 ${ctx.mode==='master'?'<a href="usuarios.html">Gerenciar atribuição de jogadores ↗</a>':''}</div>
 ${detail}${actions}</article>`;
}
function render(){
 const ctx=context(),list=characters(ctx),scopes=campaigns(ctx),query=norm($('directory-search')?.value),campaign=campaignFilterInitialized?$('directory-campaign')?.value||'all':initialCampaign,status=$('directory-status')?.value||'all',classValue=$('directory-class')?.value||'all';
 $('create-character-action').hidden=ctx.guest||ctx.preview;
 $('directory-status').closest('label').hidden=ctx.restricted;
 $('character-subtitle').textContent=ctx.mode==='master'?'Gerencie personagens e atribuições das suas campanhas.':ctx.guest?'Entre no Hub para acessar seus personagens.':'Seus personagens e os companheiros de grupo disponíveis.';
 const selects=[$('directory-campaign'),$('directory-class')];
 const keepCampaign=campaign,keepClass=classValue;
 selects[0].innerHTML='<option value="all">Todas as campanhas</option>'+scopes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
 selects[0].value=scopes.some(c=>c.id===keepCampaign)?keepCampaign:'all';campaignFilterInitialized=true;
 const classes=[...new Set(list.map(klass))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 selects[1].innerHTML='<option value="all">Todas as classes</option>'+classes.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
 selects[1].value=classes.includes(keepClass)?keepClass:'all';
 const filtered=list.filter(c=>{
  const linked=associations(c,scopes),statusRows=linked.map(row=>statusFor(c,row,ctx));
  return(campaign==='all'||linked.some(row=>row.id===campaign))&&(classValue==='all'||klass(c)===classValue)&&(status==='all'||statusRows.includes(status))&&norm([c.name,klass(c),species(c),owner(c,linked)].join(' ')).includes(query)
 }).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
 const own=list.filter(c=>ctx.owned.has(c.id)).length,linked=new Set(scopes.filter(c=>list.some(ch=>associations(ch,[c]).length)).map(c=>c.id)).size;
 $('directory-metrics').innerHTML=[[list.length,'Personagens disponíveis'],[ctx.mode==='master'?list.filter(c=>associations(c,scopes).length).length:own,ctx.mode==='master'?'Vinculados':'Meus personagens'],[linked,'Campanhas com personagens']].map(([num,label])=>`<div class="hub-directory-metric"><strong>${num}</strong><span>${label}</span></div>`).join('');
 $('lista').className='hub-directory-grid'+(view==='list'?' is-list':'');
 $('lista').innerHTML=filtered.length?filtered.map(c=>card(c,ctx,scopes)).join(''):`<div class="hub-directory-empty">${ctx.guest?'Faça login para acessar a lista.':list.length?'Nenhum personagem corresponde aos filtros.':'Nenhum personagem disponível.'}</div>`;
 $('view-cards').setAttribute('aria-pressed',String(view==='cards'));$('view-list').setAttribute('aria-pressed',String(view==='list'));
}
function duplicate(id){
 if(context().mode!=='master')return;const source=read().find(c=>c.id===id);if(!source)return;
 const copy=structuredClone(source);copy.id=uid();copy.name=(source.name||'Personagem')+' (cópia)';copy.updatedAt=new Date().toISOString();
 delete copy.ownerUid;delete copy.ownerUsername;delete copy.ownerDisplayName;
 write([...read(),copy]);render()
}
$('lista')?.addEventListener('click',async event=>{
 const duplicateButton=event.target.closest('[data-duplicate]');if(duplicateButton){duplicate(duplicateButton.dataset.duplicate);return}
 const deleteButton=event.target.closest('[data-delete]');if(deleteButton&&context().mode==='master'){
  if(!confirm('Excluir este personagem permanentemente? Os vínculos existentes podem precisar ser ajustados.'))return;
  deleteButton.disabled=true;try{await deleteCharacterAsMaster(deleteButton.dataset.delete);render()}catch(error){alert(error?.message||'Não foi possível excluir o personagem.');deleteButton.disabled=false}
 }
 const save=event.target.closest('[data-save-note]');if(save){
  const editor=[...$('lista').querySelectorAll('[data-note-character]')].find(x=>x.dataset.noteCharacter===save.dataset.saveNote&&x.dataset.noteCampaign===save.dataset.campaignId);
  if(editor)updateDirectory(save.dataset.saveNote,save.dataset.campaignId,{notes:editor.value})
 }
});
$('lista')?.addEventListener('change',event=>{
 const select=event.target.closest('[data-character-status]');if(select)updateDirectory(select.dataset.characterStatus,select.dataset.campaignId,{status:select.value})
});
for(const key of['directory-search','directory-campaign','directory-status','directory-class'])$(key)?.addEventListener(key==='directory-search'?'input':'change',render);
$('view-cards')?.addEventListener('click',()=>{view='cards';render()});
$('view-list')?.addEventListener('click',()=>{view='list';render()});
window.addEventListener('hub-rpg:remote-updated',event=>{event.detail?.claim?.();render()});
window.addEventListener('hub-rpg:collaboration-session-changed',render);
window.addEventListener('storage',event=>{if(['hub-rpg:characters:v4','hub-rpg:campaigns:v1'].includes(event.key))render()});
render();
