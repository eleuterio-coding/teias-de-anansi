/* Relacionamentos do elenco. Não cria vínculos implícitos a partir do nome. */
export const arr=value=>Array.isArray(value)?value:[];
export const text=value=>String(value??'').trim();
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const norm=value=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export const statuses=Object.freeze([
 ['missing','Desaparecido'],['dead','Morto'],['npc','NPC'],['active','Vivo']
]);
export const statusLabel=value=>({missing:'Desaparecido',dead:'Morto',npc:'NPC',active:'Vivo',alive:'Vivo',inactive:'Inativo',retired:'Aposentado'}[norm(value)]||text(value)||'Não informado');
export const nameSort=(a,b)=>text(a.name||a.title).localeCompare(text(b.name||b.title),'pt-BR');
export function characterInCampaign(person,campaign){
 const id=text(person?.id);
 return Boolean(id&&(
  arr(campaign?.members).some(m=>m.characterId===id)||
  arr(campaign?.sessions).some(s=>arr(s.participantCharacterIds).includes(id))
 ));
}
export function characterInAdventure(person,adventure,campaign=null){
 const id=text(person?.id);
 return Boolean(id&&(
  arr(adventure?.characterIds).includes(id)||
  arr(adventure?.participantAssignments).some(row=>row.characterId===id)||
  arr(campaign?.sessions).some(s=>s.adventureId===adventure?.id&&arr(s.participantCharacterIds).includes(id))
 ));
}
export function npcInCampaign(npc,campaign){
 const id=text(npc?.id);
 return Boolean(id&&(
  arr(campaign?.npcDirectory).some(n=>n.id===id)||
  arr(campaign?.npcs).some(n=>n.id===id)||
  arr(campaign?.importantNpcIds).includes(id)||
  arr(campaign?.npcPublicEntries).some(n=>n.id===id)||
  arr(campaign?.importantNpcEntries).some(n=>n.id===id)
 ));
}
export function npcInAdventure(npc,adventure){
 const id=text(npc?.id);
 return Boolean(id&&(
  arr(adventure?.npcIds).includes(id)||
  arr(adventure?.npcs).some(n=>n.id===id)
 ));
}
export function sessionHistory(person,campaign,adventures=[],npc=false,publicView=false){
 const records=[];
 for(const s of arr(campaign?.sessions)){
  const direct=npc?(!publicView&&arr(s.scenes).some(scene=>arr(scene.npcIds).includes(person.id))):arr(s.participantCharacterIds).includes(person.id);
  const adventure=adventures.find(a=>a.id===s.adventureId);
  const observed=Boolean(npc&&!publicView&&arr(adventure?.scenes).some(scene=>scene.sessionId===s.id&&arr(scene.npcIds).includes(person.id)));
  if(direct||observed)records.push(s);
 }
 return records.sort((a,b)=>(a.order||a.number||0)-(b.order||b.number||0)||text(a.date).localeCompare(text(b.date)));
}
export function adventuresOf(person,adventures,campaigns,npc=false){
 return arr(adventures).filter(a=>{
  const c=arr(campaigns).find(row=>row.id===a.campaignId);
  return npc?npcInAdventure(person,a):characterInAdventure(person,a,c);
 }).sort((a,b)=>text(a.updatedAt).localeCompare(text(b.updatedAt))||(a.order||0)-(b.order||0));
}
export function currentAdventure(related,campaigns=[]){
 const scored=arr(related).filter(a=>['active','current'].includes(a.status))
  .sort((a,b)=>Number(Boolean(b.activeSceneId))-Number(Boolean(a.activeSceneId))||
    Number(arr(campaigns).some(c=>c.id===b.campaignId&&arr(c.sessions).some(s=>s.adventureId===b.id&&['current','active','next'].includes(s.status))))-
    Number(arr(campaigns).some(c=>c.id===a.campaignId&&arr(c.sessions).some(s=>s.adventureId===a.id&&['current','active','next'].includes(s.status))))||
    text(b.updatedAt).localeCompare(text(a.updatedAt)));
 return scored[0]||null;
}
export function previousAdventures(related,current,campaigns,person,npc=false,publicView=false){
 return arr(related).filter(a=>{
  if(current?.id===a.id)return false;
  const completed=['completed','finished','archived'].includes(a.status);
  const camp=arr(campaigns).find(c=>c.id===a.campaignId);
  const completedSession=arr(camp?.sessions).some(s=>s.adventureId===a.id&&['completed','finished'].includes(s.status)&&
   (npc?(!publicView&&arr(s.scenes).some(x=>arr(x.npcIds).includes(person.id))):arr(s.participantCharacterIds).includes(person.id)));
  return completed||completedSession;
 });
}
/* A localização só é conclusiva quando a Aventura registra uma cena ativa com Local. */
export function adventureCurrentLocation(adventure,campaign=null){
 if(!adventure)return'';
 if(text(adventure.currentLocation))return text(adventure.currentLocation);
 const active=arr(adventure.scenes).find(s=>s.id===adventure.activeSceneId&&s.status==='active');
 if(!active?.locationId)return'';
 const locations=[...arr(campaign?.locations),...arr(adventure.locations),...arr(adventure.legacyLocations)];
 return text(locations.find(l=>l.id===active.locationId)?.name);
}
export const knownName=value=>text(value)||'Não informado';
export const listNames=(values,key='title')=>arr(values).map(row=>text(row?.[key])).filter(Boolean).join(' · ')||'Nenhuma registrada';
