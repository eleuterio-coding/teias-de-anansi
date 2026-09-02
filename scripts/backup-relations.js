const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
export function validatePortableRelations(data){
 const characters=arr(data?.characters),campaigns=arr(data?.campaigns),adventures=arr(data?.adventures),characterIds=new Set(characters.map(x=>x.id)),campaignMap=new Map(campaigns.map(x=>[x.id,x])),claimedCharacters=new Map;
 for(const campaign of campaigns){
  for(const member of arr(campaign.members))if(member.characterId){
   if(!characterIds.has(member.characterId))throw new Error(`Campanha ${campaign.name}: personagem vinculado ausente no backup (${member.characterId}).`);
   const prior=claimedCharacters.get(member.characterId);if(prior&&prior!==campaign.id)throw new Error(`Personagem ${member.characterId} aparece vinculado a mais de uma Campanha.`);claimedCharacters.set(member.characterId,campaign.id)
  }
 }
 for(const adventure of adventures){
  const campaign=campaignMap.get(adventure.campaignId);if(!campaign)throw new Error(`Aventura ${adventure.title}: Campanha vinculada ausente no backup (${adventure.campaignId}).`);
  const sessions=new Map(arr(campaign.sessions).map(session=>[session.id,session]));
  for(const scene of arr(adventure.scenes)){
   const sessionId=text(scene.sessionId||scene.encounterRef?.sessionId),encounterId=text(scene.encounterRef?.encounterId);if(!sessionId&&!encounterId)continue;
   const session=sessions.get(sessionId);if(!session)throw new Error(`Aventura ${adventure.title} · cena ${scene.title}: Sessão vinculada ausente (${sessionId||'sem ID'}).`);
   if(encounterId&&!arr(session.encounters).some(encounter=>encounter.id===encounterId))throw new Error(`Aventura ${adventure.title} · cena ${scene.title}: Encontro vinculado ausente (${encounterId}).`)
  }
 }
 return true
}
