// Cena = unidade narrativa. Encontro = preparação exclusiva de combate.
// As opções seguem a Aventura vinculada à Sessão, sem cópias independentes.
import{readAdventures,writeAdventures,updateAdventureEntity}from'./adventure-state.js?v=20261027-scene-types1';
import{addSessionScene}from'./campaign-state.js?v=20261022-chronicles-final3';
import{createEncounter,addCharacterCombatant,addCreatureCombatant}from'./encounter-state.js?v=20261022-chronicles-final3';
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
export function resolveCombatScene(ctx,value,{allowLegacy=false}={}){
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
 if(origin&&!isCombatScene(origin)&&!allowLegacy)return{ok:false,reason:'Esta cena não é de combate. Escolha uma cena do tipo Combate (encontro).'};
 return{ok:true,sessionSceneId:row.id,adventureScene:origin};
}
// Só personagens selecionados para a Sessão e adversários da Cena
// participam automaticamente. NPCs aliados/não hostis ficam de fora.
export function populateSceneOpponents(ctx,encounter,adventureScene){
 if(!adventureScene)return;
 const combatants=()=>encounter.combatants||[];
 const area=ctx.adventure?.exploration?.areas?.find(a=>a.id===adventureScene.areaId);
 const enemyNpcIds=new Set([...(adventureScene.enemyNpcIds||[]),...(area?.enemyNpcIds||[])]);
 const enemyMonsterIds=new Set(adventureScene.enemyMonsterIds??adventureScene.monsterIds??[]);
 // Contadores preservam dois monstros diferentes da Aventura que usam
 // a mesma ficha da Biblioteca, sem recriar extras no mesmo Encontro.
 const expectedNpcs=new Map(),expectedMonsters=new Map();
 for(const id of adventureScene.npcIds||[]){
  if(!enemyNpcIds.has(id))continue;
  const npc=ctx.campaign?.npcs?.find(n=>n.id===id);
  if(!npc)continue;
  const key=npc.name;
  const expected=(expectedNpcs.get(key)||0)+1;
  expectedNpcs.set(key,expected);
  if(combatants().filter(c=>c.kind==='npc'&&c.name===key).length>=expected)continue;
  addCreatureCombatant(encounter,{kind:'npc',name:npc.name,source:'NPC inimigo da Cena',ac:10,maxHp:10,currentHp:10});
 }
 for(const id of adventureScene.monsterIds||[]){
  if(!enemyMonsterIds.has(id))continue;
  const monster=ctx.adventure?.monsters?.find(m=>m.id===id);
  if(!monster)continue;
  const key=monster.monsterId||monster.id;
  const expected=(expectedMonsters.get(key)||0)+1;
  expectedMonsters.set(key,expected);
  if(combatants().filter(c=>c.kind==='monster'&&c.monsterId===key).length>=expected)continue;
  addCreatureCombatant(encounter,{kind:'monster',name:monster.name,monsterId:key,source:monster.source,ac:monster.ac,maxHp:monster.maxHp,currentHp:monster.maxHp,initiativeModifier:monster.initiativeModifier});
 }
}
// Personagens continuam referenciando a Ficha Digital; PV e condições
// são buscados pelo controle de combate, não armazenados no Encontro.
export function populateScenePlayers(ctx,encounter){
 for(const id of ctx.session?.participantCharacterIds||[]){
  if((encounter.combatants||[]).some(c=>c.kind==='character'&&c.characterId===id))continue;
  const pc=ctx.characters?.find(c=>c.id===id);
  addCharacterCombatant(encounter,{characterId:id,name:pc?.name||'Personagem'});
 }
}
export function ensureSceneEncounter(ctx,choice,{title=''}={}){
 const resolved=resolveCombatScene(ctx,choice);
 if(!resolved.ok)return resolved;
 const existing=ctx.session.encounters?.find(e=>e.sessionSceneId&&e.sessionSceneId===resolved.sessionSceneId&&e.kind==='combat');
 if(existing){if(resolved.adventureScene){populateSceneOpponents(ctx,existing,resolved.adventureScene);populateScenePlayers(ctx,existing)}return{...resolved,encounter:existing,created:false};}
 const created=createEncounter(ctx.session,{title:title.trim()||resolved.adventureScene?.title||undefined,kind:'combat',sessionSceneId:resolved.sessionSceneId,summary:resolved.adventureScene?.description||''});
 if(!created.ok)return created;
 populateSceneOpponents(ctx,created.encounter,resolved.adventureScene);
 if(resolved.adventureScene)populateScenePlayers(ctx,created.encounter);
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
