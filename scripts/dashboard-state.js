const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const at=v=>Date.parse(v||'')||0;
const day=v=>{const s=text(v);const m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:null};
const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const hrefCharacter=id=>`ficha-personagem.html?id=${encodeURIComponent(id)}`;
const hrefCampaign=id=>`mesa.html?id=${encodeURIComponent(id)}`;
const hrefAdventure=(campaignId,id='')=>`aventuras.html?campaign=${encodeURIComponent(campaignId||'')}${id?`&id=${encodeURIComponent(id)}`:''}`;
const hrefSession=(campaignId,id)=>campaignId?`sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(id)}`:`sessoes.html?id=${encodeURIComponent(id)}`;

export function characterSummary(character={}){
 const snaps=character.refSnapshots||{},refs=character.refs||{},level=Math.max(1,Number(character.choices?.class?.level)||1),className=text(snaps.class?.name)||text(refs.class),speciesName=text(snaps.species?.name)||text(refs.species),backgroundName=text(snaps.background?.name)||text(refs.background);
 return{id:text(character.id),name:text(character.name)||'Personagem sem nome',level,className,speciesName,backgroundName,updatedAt:text(character.updatedAt),complete:!!(text(character.name)&&text(refs.class)&&text(refs.species)&&text(refs.background))}
}

export function chooseCharacterInPlay(characters=[],campaigns=[]){
 const chars=new Map(arr(characters).filter(x=>x?.id).map(c=>[String(c.id),c]));
 const active=arr(campaigns).flatMap(c=>arr(c.sessions).filter(s=>s.status==='active'||s.id===c.activeSessionId).map(s=>({campaign:c,session:s}))).sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt));
 for(const row of active){
  const explicit=arr(row.session.participantCharacterIds).map(String),linked=arr(row.campaign.members).filter(m=>m.active!==false&&m.characterId).map(m=>String(m.characterId)),ids=[...new Set([...explicit,...linked])];
  const id=ids.find(value=>chars.has(value));if(id)return{character:chars.get(id),campaign:row.campaign,session:row.session}
 }
 return null
}

export function chooseNextSession(campaigns=[],now=new Date(),standaloneSessions=[]){
 const explicitlyNext=[
  ...arr(campaigns).filter(c=>c.status!=='finished').flatMap(c=>arr(c.sessions).filter(s=>s.status==='next').map(s=>({campaign:c,session:s,date:day(s.date),standalone:false}))),
  ...arr(standaloneSessions).filter(s=>s.status==='next').map(s=>({campaign:null,session:s,date:day(s.date),standalone:true}))
 ].sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt));
 return explicitlyNext[0]||null
}

export function chooseCurrentSession(campaigns=[],standaloneSessions=[]){
 const rows=[
  ...arr(campaigns).flatMap(c=>arr(c.sessions).map(s=>({campaign:c,session:s,standalone:false}))),
  ...arr(standaloneSessions).map(s=>({campaign:null,session:s,standalone:true}))
 ];
 const explicit=rows.filter(x=>x.session.status==='current').sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt))[0];
 if(explicit)return explicit;
 const active=rows.filter(x=>x.session.status==='active'||(!x.standalone&&x.session.id===x.campaign.activeSessionId)).sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt))[0];
 return active||null
}

export function chooseCurrentCampaign(campaigns=[],currentSession=null){
 const rows=[...arr(campaigns)];
 const explicit=rows.filter(c=>c.status==='current').sort((a,b)=>at(b.updatedAt)-at(a.updatedAt))[0];
 if(explicit)return explicit;
 if(currentSession?.campaign)return currentSession.campaign;
 return rows.filter(c=>c.status==='active').sort((a,b)=>at(b.updatedAt)-at(a.updatedAt))[0]||null
}

export function chooseCurrentAdventure(adventures=[],currentCampaign=null,currentSession=null){
 const rows=[...arr(adventures)];
 const explicit=rows.filter(a=>a.status==='current').sort((a,b)=>at(b.updatedAt)-at(a.updatedAt))[0];
 if(explicit)return explicit;
 const linkedId=text(currentSession?.session?.adventureId);
 if(linkedId){const linked=rows.find(a=>a.id===linkedId);if(linked)return linked}
 const active=rows.filter(a=>a.status==='active');
 if(currentCampaign){
  const inCampaign=active.filter(a=>a.campaignId===currentCampaign.id).sort((a,b)=>Number(Boolean(b.activeSceneId))-Number(Boolean(a.activeSceneId))||at(b.updatedAt)-at(a.updatedAt));
  if(inCampaign.length)return inCampaign[0]
 }
 return active.sort((a,b)=>Number(Boolean(b.activeSceneId))-Number(Boolean(a.activeSceneId))||at(b.updatedAt)-at(a.updatedAt))[0]||null
}

function orderedCampaigns(campaigns=[]){return[...arr(campaigns)].sort((a,b)=>({current:0,active:1,planned:2,paused:3,finished:4}[a.status]??5)-({current:0,active:1,planned:2,paused:3,finished:4}[b.status]??5)||at(b.updatedAt)-at(a.updatedAt))}
function orderedAdventures(adventures=[]){return[...arr(adventures)].sort((a,b)=>({current:0,active:1,planned:2,paused:3,completed:4,archived:5}[a.status]??6)-({current:0,active:1,planned:2,paused:3,completed:4,archived:5}[b.status]??6)||at(b.updatedAt)-at(a.updatedAt))}
function allSessions(campaigns=[],standaloneSessions=[]){
 const campaignSessions=arr(campaigns).flatMap(c=>arr(c.sessions).map(s=>({campaignId:c.id,campaignName:c.name,standalone:false,...s,href:hrefSession(c.id,s.id)})));
 const standalone=arr(standaloneSessions).map(s=>({campaignId:null,campaignName:'Sessão avulsa',standalone:true,...s,href:hrefSession(null,s.id)}));
 return [...campaignSessions,...standalone].sort((a,b)=>({current:0,active:1,next:2,planned:3,completed:4,cancelled:5}[a.status]??5)-({current:0,active:1,planned:2,completed:3,cancelled:4}[b.status]??5)||String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt))||Number(b.number||0)-Number(a.number||0))
}

export function summarizeDashboard({characters=[],campaigns=[],adventures=[],standaloneSessions=[],now=new Date()}={}){
 const camps=orderedCampaigns(campaigns),advs=orderedAdventures(adventures),sessions=allSessions(camps,standaloneSessions).map(s=>({...s,adventureName:advs.find(a=>a.id===s.adventureId)?.title||'Sem Aventura vinculada'})),currentSession=chooseCurrentSession(camps,standaloneSessions),currentCampaign=chooseCurrentCampaign(camps,currentSession),currentAdventure=chooseCurrentAdventure(advs,currentCampaign,currentSession),nextSession=chooseNextSession(camps,now,standaloneSessions);
 return{
  metrics:{campaigns:camps.length,adventures:advs.length,sessions:sessions.length},
  campaigns:camps.map(c=>({...c,href:hrefCampaign(c.id)})),
  adventures:advs.map(a=>({...a,href:hrefAdventure(a.campaignId,a.id),campaignName:camps.find(c=>c.id===a.campaignId)?.name||''})),
  sessions,
  nextSession,
  currentCampaign:currentCampaign?{...currentCampaign,href:hrefCampaign(currentCampaign.id)}:null,
  currentAdventure:currentAdventure?{...currentAdventure,href:hrefAdventure(currentAdventure.campaignId,currentAdventure.id),campaignName:camps.find(c=>c.id===currentAdventure.campaignId)?.name||''}:null,
  currentSession:currentSession?{...currentSession,href:hrefSession(currentSession.campaign?.id,currentSession.session.id)}:null,
  characterInPlay:chooseCharacterInPlay(characters,camps)
 }
}
