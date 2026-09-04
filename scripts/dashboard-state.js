const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const at=v=>Date.parse(v||'')||0;
const day=v=>{const s=text(v);const m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:null};
const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const hrefCharacter=id=>`ficha-personagem.html?id=${encodeURIComponent(id)}`;
const hrefCampaign=id=>`mesa.html?id=${encodeURIComponent(id)}`;
const hrefAdventure=campaignId=>`aventuras.html?campaign=${encodeURIComponent(campaignId||'')}`;

export function characterSummary(character={}){
 const snaps=character.refSnapshots||{},refs=character.refs||{},level=Math.max(1,Number(character.choices?.class?.level)||1),className=text(snaps.class?.name)||text(refs.class),speciesName=text(snaps.species?.name)||text(refs.species),backgroundName=text(snaps.background?.name)||text(refs.background);
 return{id:text(character.id),name:text(character.name)||'Personagem sem nome',level,className,speciesName,backgroundName,updatedAt:text(character.updatedAt),complete:!!(text(character.name)&&text(refs.class)&&text(refs.species)&&text(refs.background))}
}

export function chooseCharacterInPlay(characters=[],campaigns=[]){
 const chars=new Map(arr(characters).filter(x=>x?.id).map(c=>[String(c.id),c]));
 const active=arr(campaigns).flatMap(c=>arr(c.sessions).filter(s=>s.status==='active'||s.id===c.activeSessionId).map(s=>({campaign:c,session:s}))).sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt));
 for(const row of active){
  const explicit=arr(row.session.participantCharacterIds).map(String),linked=arr(row.campaign.members).filter(m=>m.active!==false&&m.characterId).map(m=>String(m.characterId)),ids=[...new Set([...explicit,...linked])];
  const id=ids.find(value=>chars.has(value));
  if(id)return{character:chars.get(id),campaign:row.campaign,session:row.session}
 }
 return null
}

export function chooseNextSession(campaigns=[],now=new Date()){
 const today=localDay(now),planned=arr(campaigns).filter(c=>c.status!=='finished').flatMap(c=>arr(c.sessions).filter(s=>s.status==='planned').map(s=>({campaign:c,session:s,date:day(s.date)})));
 const dated=planned.filter(x=>x.date&&x.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||Number(a.session.number||0)-Number(b.session.number||0));
 if(dated.length)return dated[0];
 const undated=planned.filter(x=>!x.date).sort((a,b)=>at(b.session.updatedAt)-at(a.session.updatedAt)||Number(a.session.number||0)-Number(b.session.number||0));
 return undated[0]||null
}

function buildPending(characters,campaigns,adventures,now){
 const today=localDay(now),pending=[];
 for(const c of arr(characters)){
  const summary=characterSummary(c);if(summary.complete)continue;
  const missing=[];if(!text(c.name))missing.push('nome');if(!text(c.refs?.class))missing.push('classe');if(!text(c.refs?.species))missing.push('espécie');if(!text(c.refs?.background))missing.push('antecedente');
  pending.push({kind:'character',title:summary.name,detail:`Criação incompleta: ${missing.join(', ')}.`,href:`criacao-personagem.html?id=${encodeURIComponent(c.id)}`})
 }
 for(const campaign of arr(campaigns).filter(c=>c.status==='active')){
  const sessions=arr(campaign.sessions),hasActive=sessions.some(s=>s.status==='active');
  for(const s of sessions.filter(s=>s.status==='planned')){
   const d=day(s.date);if(!d)pending.push({kind:'session',title:s.title||`Sessão ${s.number||''}`,detail:`${campaign.name}: sessão planejada sem data.`,href:hrefCampaign(campaign.id)});
   else if(d<today)pending.push({kind:'session',title:s.title||`Sessão ${s.number||''}`,detail:`${campaign.name}: data planejada já passou.`,href:hrefCampaign(campaign.id)})
  }
  if(!hasActive&&!sessions.some(s=>s.status==='planned'))pending.push({kind:'campaign',title:campaign.name,detail:'Mesa ativa sem próxima sessão planejada.',href:hrefCampaign(campaign.id)})
 }
 for(const adventure of arr(adventures).filter(a=>a.status==='active'))if(!adventure.activeSceneId&&arr(adventure.scenes).some(s=>s.status==='planned'))pending.push({kind:'adventure',title:adventure.title,detail:'Aventura ativa sem uma cena em andamento.',href:hrefAdventure(adventure.campaignId)});
 return pending
}

function buildActivity(characters,campaigns,adventures){
 const rows=[];
 for(const c of arr(characters)){const s=characterSummary(c);rows.push({type:'character',title:s.name,detail:`Personagem · nível ${s.level}${s.className?` · ${s.className}`:''}`,at:s.updatedAt,href:hrefCharacter(s.id)})}
 for(const c of arr(campaigns)){
  rows.push({type:'campaign',title:c.name||'Mesa',detail:'Mesa atualizada',at:c.updatedAt,href:hrefCampaign(c.id)});
  for(const s of arr(c.sessions))rows.push({type:'session',title:s.title||`Sessão ${s.number||''}`,detail:`Sessão · ${c.name||'Mesa'}`,at:s.updatedAt,href:hrefCampaign(c.id)})
 }
 for(const a of arr(adventures))rows.push({type:'adventure',title:a.title||'Aventura',detail:'Aventura atualizada',at:a.updatedAt,href:hrefAdventure(a.campaignId)});
 return rows.filter(x=>at(x.at)>0).sort((a,b)=>at(b.at)-at(a.at)).slice(0,8)
}

export function summarizeDashboard({characters=[],campaigns=[],adventures=[],now=new Date()}={}){
 const chars=arr(characters),camps=arr(campaigns),advs=arr(adventures),pending=buildPending(chars,camps,advs,now),characterInPlay=chooseCharacterInPlay(chars,camps),nextSession=chooseNextSession(camps,now),orderedCampaigns=[...camps].sort((a,b)=>({active:0,paused:1,finished:2}[a.status]??3)-({active:0,paused:1,finished:2}[b.status]??3)||at(b.updatedAt)-at(a.updatedAt));
 return{metrics:{characters:chars.length,activeCampaigns:camps.filter(c=>c.status==='active').length,upcomingSessions:camps.flatMap(c=>arr(c.sessions)).filter(s=>s.status==='planned').length,pending:pending.length},characterInPlay,nextSession,campaigns:orderedCampaigns.slice(0,6),pending:pending.slice(0,8),activity:buildActivity(chars,camps,advs)}
}
