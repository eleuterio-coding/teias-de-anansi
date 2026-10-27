// Cena = unidade narrativa. Encontro = preparação exclusiva de combate.
// As opções seguem a Aventura vinculada à Sessão, sem cópias independentes.
import{readAdventures,writeAdventures,updateAdventureEntity}from'./adventure-state.js?v=20261027-scene-types1';
import{addSessionScene}from'./campaign-state.js?v=20261022-chronicles-final3';
import{createEncounter,addCreatureCombatant}from'./encounter-state.js?v=20261022-chronicles-final3';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isCombatScene=scene=>scene?.sceneType==='combat';
const currentSessionScene=(session,adventureSceneId)=>(session?.scenes||[]).find(s=>s.adventureSceneId===adventureSceneId);
function availableForSession(scene,session){
 return !scene.sessionId||scene.sessionId===session.id;
}
export function combatSceneOptions(session,adventure,current=''){
 const linked=new Set((session?.scenes||[]).map(s=>s.adventureSceneId).filter(Boolean));
 const attached=(session?.scenes||[]).filter(s=>{
  const origin=adventure?.scenes?.find(a=>a.id===s.adventureSceneId);
  return !origin||isCombatScene(origin)||s.id===current;
 }).map(s=>'<option value="'+esc(s.id)+'"'+(s.id===current?' selected':'')+'>'+esc(s.title)+(s.adventureSceneId?' · Cena da Aventura':' · Cena da Sessão')+'</option>').join('');
 const fromAdventure=(adventure?.scenes||[]).filter(s=>isCombatScene(s)&&!linked.has(s.id)&&availableForSession(s,session))
  .sort((a,b)=>(a.order||0)-(b.order||0))
  .map(s=>'<option value="adventure:'+esc(s.id)+'">'+esc(s.title)+' · Combate da Aventura</option>').join('');
 return '<option value="">— Sem cena (combate avulso) —</option>'
  +(fromAdventure?'<optgroup label="Cenas de combate da Aventura">'+fromAdventure+'</optgroup>':'')
  +(attached?'<optgroup label="Cenas da Sessão">'+attached+'</optgroup>':'');
}
export function resolveCombatScene(ctx,value){
 const id=String(value||'');
 if(!id)return{ok:true,sessionSceneId:null,adventureScene:null};
 if(id.startsWith('adventure:')){
  const scene=ctx.adventure?.scenes?.find(s=>s.id===id.slice(10));
  if(!scene||!isCombatScene(scene))return{ok:false,reason:'Selecione uma cena classificada como Combate (encontro).'};
  if(ctx.session?.adventureId!==ctx.adventure?.id)return{ok:false,reason:'A Sessão não está vinculada a esta Aventura.'};
  if(!availableForSession(scene,ctx.session))return{ok:false,reason:'Esta cena já pertence a outra Sessão.'};
  const linked=currentSessionScene(ctx.session,scene.id);
  if(linked)return{ok:true,sessionSceneId:linked.id,adventureScene:scene};
  if(scene.sessionSceneId&&scene.sessionId===ctx.session.id)return{ok:false,reason:'A cena já tem vínculo com outra cena nesta Sessão.'};
  const result=addSessionScene(ctx.session,{title:scene.title,adventureSceneId:scene.id,locationId:scene.locationId,npcIds:scene.npcIds,missionIds:scene.missionIds,clueIds:scene.clueIds,handoutIds:scene.handoutIds,treasureIds:scene.treasureIds,description:scene.description});
  return result.ok?{ok:true,sessionSceneId:result.scene.id,adventureScene:scene}:{ok:false,reason:result.reason};
 }
 const row=ctx.session?.scenes?.find(s=>s.id===id);
 if(!row)return{ok:false,reason:'Cena da Sessão não encontrada.'};
 const origin=ctx.adventure?.scenes?.find(s=>s.id===row.adventureSceneId)||null;
 if(origin&&!isCombatScene(origin))return{ok:false,reason:'Esta cena não é de combate. Escolha uma cena do tipo Combate (encontro).'};
 return{ok:true,sessionSceneId:row.id,adventureScene:origin};
}
export function populateSceneOpponents(ctx,encounter,adventureScene){
 if(!adventureScene)return;
 const combatants=()=>encounter.combatants||[];
 for(const id of adventureScene.npcIds||[]){
  const npc=ctx.campaign?.npcs?.find(n=>n.id===id);
  if(npc&&!combatants().some(c=>c.kind==='npc'&&c.name===npc.name))
   addCreatureCombatant(encounter,{kind:'npc',name:npc.name,source:'NPC da Cena',ac:10,maxHp:10,currentHp:10});
 }
 for(const id of adventureScene.monsterIds||[]){
  const monster=ctx.adventure?.monsters?.find(m=>m.id===id);
  if(monster&&!combatants().some(c=>c.kind==='monster'&&c.monsterId===(monster.monsterId||monster.id)))
   addCreatureCombatant(encounter,{kind:'monster',name:monster.name,monsterId:monster.monsterId||monster.id,source:monster.source,ac:monster.ac,maxHp:monster.maxHp,currentHp:monster.maxHp,initiativeModifier:monster.initiativeModifier});
 }
}
export function ensureSceneEncounter(ctx,choice,{title=''}={}){
 const resolved=resolveCombatScene(ctx,choice);
 if(!resolved.ok)return resolved;
 const existing=ctx.session.encounters?.find(e=>e.sessionSceneId&&e.sessionSceneId===resolved.sessionSceneId&&e.kind==='combat');
 if(existing)return{...resolved,encounter:existing,created:false};
 const created=createEncounter(ctx.session,{title:title.trim()||resolved.adventureScene?.title||undefined,kind:'combat',sessionSceneId:resolved.sessionSceneId,summary:resolved.adventureScene?.description||''});
 if(!created.ok)return created;
 populateSceneOpponents(ctx,created.encounter,resolved.adventureScene);
 return{...resolved,encounter:created.encounter,created:true};
}
export function syncAdventureCombatLink(ctx,result){
 if(!result?.adventureScene||!ctx.adventure)return true;
 const rows=readAdventures();
 const updated=updateAdventureEntity(rows,ctx.adventure.id,'scenes',result.adventureScene.id,{
  sessionId:ctx.session.id,sessionSceneId:result.sessionSceneId,
  encounterRef:{sessionId:ctx.session.id,encounterId:result.encounter?.id||null}
 });
 if(!updated.ok)return false;
 writeAdventures(updated.list);
 return true;
}
