import{createFirebaseCollaborationProvider,loadFirebaseConfig}from'./firebase-collaboration-provider.js?v=20261021-users-admin1';
import{readCampaigns}from'./campaign-state.js?v=20260925-media1';
import{readAdventures}from'./adventure-state.js?v=20260925-media1';
import{read as readCharacters}from'./character-builder/state.js';
import{campaignSharedCoreProjection,sessionSharedProjection,revealedAdventureProjection,collaborationMemberBundle}from'./collaboration-model.js?v=20260925-media1';
import{readCollaborationSession,readMasterPreview,writeMasterPreview,clearMasterPreview}from'./collaboration-view.js?v=20261016-master-preview1';
import{readSettings,writeSettings}from'./settings-state.js?v=20261016-layout1';

const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const username=v=>text(v).toLowerCase();
const unique=rows=>[...new Set(arr(rows).map(text).filter(Boolean))];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function localFallbackMemberships(target){
 const name=username(target),campaigns=readCampaigns(),adventures=readAdventures(),rows=[];
 for(const campaign of campaigns){
  const member=arr(campaign.members).find(m=>m?.active!==false&&username(m.username||m.name)===name&&m.role!=='dm');
  if(!member)continue;
  rows.push({
   id:`preview-${campaign.id}-${name}`,
   campaignId:campaign.id,uid:'',username:name,email:'',role:'player',
   characterId:text(member.characterId)||null,
   sessionIds:campaign.sessions.filter(s=>arr(s.participantUsernames).map(username).includes(name)).map(s=>s.id),
   adventureIds:adventures.filter(a=>a.campaignId===campaign.id&&arr(a.participantUsernames).map(username).includes(name)).map(a=>a.id),
   displayName:text(member.name)||name,active:true,updatedAt:text(campaign.updatedAt)
  })
 }
 return rows
}
function knownLocalUsers(){
 const map=new Map(),master=username(readCollaborationSession()?.username);
 for(const campaign of readCampaigns())for(const member of arr(campaign.members)){
  const name=username(member.username||member.name);if(!name||name===master||member.role==='dm')continue;
  map.set(name,{uid:'',username:name,displayName:text(member.name)||name})
 }
 for(const character of readCharacters()){
  const name=username(character.ownerUsername);if(!name||name===master)continue;
  if(!map.has(name))map.set(name,{uid:text(character.ownerUid),username:name,displayName:text(character.ownerDisplayName)||name})
 }
 return[...map.values()]
}
async function providerData(){
 let config=null;
 try{
  config=await loadFirebaseConfig();if(!config.configured)return{config,provider:null,users:[]};
  const provider=await createFirebaseCollaborationProvider({config});let account=await provider.currentUser();
  if(!account)account=await new Promise(resolve=>{let settled=false,off=null;const done=value=>{if(settled)return;settled=true;try{off?.()}catch{}resolve(value)};off=provider.onAuthChanged(value=>done(value));setTimeout(()=>done(null),1800)});
  if(!account)return{config,provider:null,users:[]};
  const users=await provider.listUsers();
  return{config,provider,users}
 }catch(error){console.warn('[Hub Mestre] usuários:',error);return{config,provider:null,users:[]}}
}
async function membershipsForUser(target,provider){
 const name=username(target),campaigns=readCampaigns(),byCampaign=new Map(),targetRows=[];
 if(provider){
  for(const campaign of campaigns){
   try{
    const rows=await provider.listCampaignMemberships(campaign.id);byCampaign.set(campaign.id,rows);
    const row=rows.find(m=>m?.active!==false&&m.role==='player'&&username(m.username||m.displayName)===name);
    if(row)targetRows.push(row)
   }catch(error){console.warn('[Hub Mestre] acessos de campanha:',error)}
  }
 }
 if(!targetRows.length){
  const fallback=localFallbackMemberships(name);
  for(const row of fallback)targetRows.push(row);
  for(const campaign of campaigns)if(!byCampaign.has(campaign.id))byCampaign.set(campaign.id,arr(campaign.members).map(m=>({
   campaignId:campaign.id,username:username(m.username||m.name),displayName:text(m.name)||text(m.username),role:m.role==='dm'?'dm':'player',
   characterId:text(m.characterId)||null,sessionIds:[],adventureIds:[],active:m.active!==false
  })))
 }
 return{targetRows,byCampaign}
}
function previewCache(targetRows,byCampaign){
 const campaigns=readCampaigns(),adventures=readAdventures(),characters=readCharacters(),rows={};
 for(const membership of targetRows){
  const campaign=campaigns.find(c=>c.id===membership.campaignId);if(!campaign)continue;
  const sessionIds=new Set(unique(membership.sessionIds)),adventureIds=new Set(unique(membership.adventureIds));
  const sessions=arr(campaign.sessions).filter(s=>sessionIds.has(text(s.id))).map(sessionSharedProjection);
  const visibleAdventures=adventures.filter(a=>a.campaignId===campaign.id&&adventureIds.has(text(a.id))).map(a=>revealedAdventureProjection(a,campaign));
  const participants=byCampaign.get(campaign.id)||[];
  const payload=collaborationMemberBundle({campaign:campaignSharedCoreProjection(campaign)},sessions,visibleAdventures,participants);
  const linkedIds=new Set([...arr(campaign.members).map(m=>text(m.characterId)),...arr(participants).map(m=>text(m.characterId)),text(membership.characterId)].filter(Boolean));
  const linkedCharacters=characters.filter(c=>linkedIds.has(text(c.id)));
  rows[campaign.id]={membership,payload,characterIds:linkedCharacters.map(c=>text(c.id)),characters:linkedCharacters,updatedAt:new Date().toISOString()}
 }
 return{schema:'hub-rpg/master-preview-cache/v1',campaigns:rows,playerCharacters:{},updatedAt:new Date().toISOString()}
}
async function activatePreview(target,users,provider){
 const name=username(target);if(!name){clearMasterPreview();location.reload();return}
 const user=users.find(row=>username(row.username)===name)||{uid:'',username:name,displayName:name};
 const{targetRows,byCampaign}=await membershipsForUser(name,provider);
 writeMasterPreview({uid:user.uid,username:name,displayName:user.displayName,memberships:targetRows},previewCache(targetRows,byCampaign));
 location.reload()
}
export async function initMasterTools(){
 const session=readCollaborationSession(),root=document.querySelector('[data-hub-master-tools]');if(!session?.isMaster||!root)return;
 const userSelect=root.querySelector('[data-hub-preview-user]'),layoutSelect=root.querySelector('[data-hub-layout-select]');root.hidden=false;
 const remote=await providerData(),master=username(session.username),map=new Map();
 // Apenas contas provisionáveis do Hub: perfis órfãos do Firebase e vínculos
 // históricos locais (inclusive usuários E2E) não são opções de visualização.
 const canonical=new Map();
 for(const row of arr(remote?.config?.playerAccounts)){
  const name=username(row?.username);if(!name)continue;
  canonical.set(name,name);
  if(row?.authUsername)canonical.set(username(row.authUsername),name);
 }
 const allowed=new Set(canonical.values());
 for(const row of[...(remote?.users||[]),...knownLocalUsers()]){
  const name=canonical.get(username(row.username));if(!name||name===master||!allowed.has(name))continue;
  const existing=map.get(name),spec=arr(remote?.config?.playerAccounts).find(spec=>username(spec.username)===name);
  map.set(name,{uid:text(row.uid)||existing?.uid||'',username:name,displayName:existing?.displayName||text(row.displayName)||text(spec?.displayName)||name})
 }
 const users=[...map.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName,'pt-BR')),preview=readMasterPreview();
 // Um modo de visualização salvo para um usuário excluído não pode sobreviver.
 if(preview?.username&&!allowed.has(username(preview.username))){clearMasterPreview();location.reload();return}
 if(userSelect){
  userSelect.innerHTML='<option value="">Mestre</option>'+users.map(row=>`<option value="${esc(row.username)}">${esc(row.displayName)}</option>`).join('');
  userSelect.value=preview?.username||'';
  userSelect.addEventListener('change',()=>activatePreview(userSelect.value,users,remote?.provider))
 }
 if(layoutSelect){
  const settings=readSettings();layoutSelect.value=settings.layout||'default';
  layoutSelect.addEventListener('change',()=>{const current=readSettings();writeSettings({...current,layout:layoutSelect.value})})
 }
}
