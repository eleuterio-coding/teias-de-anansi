import{read}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,updateCampaignSession,readStandaloneSessions,writeStandaloneSessions,updateStandaloneSession}from'./campaign-state.js?v=20260924-session-encounters1';
import{createEncounter,updateEncounter,removeEncounter,startEncounter,finishEncounter,cancelEncounter,addCharacterCombatant,addCreatureCombatant,updateCombatant,removeCombatant,setCombatantInitiative,nextEncounterTurn,previousEncounterTurn,applyEncounterDamage,applyEncounterHealing,encounterSummary,creatureTargetForResolution}from'./encounter-state.js?v=20260924-session-encounters1';
import{loadEncounterMonsterIndex,loadEncounterMonsterDetail}from'./monster-catalog.js?v=20260902-encounters1';
import{rollD20}from'./character-sheet-resolution-rules.js?v=20260902-resolution1';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Força','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante','Concussão','Perfurante','Cortante'];
const TARGET_KEY='hub-rpg:encounter-target:v1';
let monsterIndex=null,monsterLoad=null;

function announce(message,ok=true){
 const box=document.getElementById('session-feedback');if(!box)return;
 box.hidden=false;box.className='status '+(ok?'ok':'warning');box.textContent=message;
 clearTimeout(announce.timer);announce.timer=setTimeout(()=>box.hidden=true,3200)
}
function contextForCard(card){
 const id=card.dataset.sessionId,source=card.dataset.sessionSource,campaigns=readCampaigns(),standalone=readStandaloneSessions(),characters=read();
 if(source==='campaign'){
  const campaign=campaigns.find(c=>(c.sessions||[]).some(s=>s.id===id)),session=campaign?.sessions.find(s=>s.id===id)||null;
  return{source,campaign,campaigns,standalone,characters,session}
 }
 return{source,campaign:null,campaigns,standalone,characters,session:standalone.find(s=>s.id===id)||null}
}
function persist(ctx,message='Encontro salvo.'){
 if(!ctx?.session)return false;
 if(ctx.source==='campaign'){
  const result=updateCampaignSession(ctx.campaigns,ctx.campaign.id,ctx.session.id,{encounters:ctx.session.encounters,activeEncounterId:ctx.session.activeEncounterId,summary:ctx.session.summary});
  if(!result.ok){announce(result.reason,false);return false}
  writeCampaigns(result.list)
 }else{
  const result=updateStandaloneSession(ctx.standalone,ctx.session.id,{encounters:ctx.session.encounters,activeEncounterId:ctx.session.activeEncounterId,summary:ctx.session.summary});
  if(!result.ok){announce(result.reason,false);return false}
  writeStandaloneSessions(result.list)
 }
 window.dispatchEvent(new CustomEvent('hub-rpg:sessions-local-updated'));
 announce(message,true);return true
}
function statusLabel(status){return({planned:'Planejado',active:'Em combate',completed:'Concluído',cancelled:'Cancelado'}[status]||status)}
function activeName(encounter){return encounter.combatants.find(c=>c.id===encounter.activeCombatantId)?.name||'—'}
function sceneOptions(session,current=''){
 let html='<option value="">— Sem cena —</option>';
 for(const scene of session.scenes||[])html+='<option value="'+esc(scene.id)+'" '+(scene.id===current?'selected':'')+'>'+esc(scene.title)+'</option>';
 return html
}
function participantOptions(ctx,encounter){
 const existing=new Set((encounter.combatants||[]).filter(c=>c.kind==='character').map(c=>c.characterId));
 let html='<option value="">— Selecione —</option>';
 for(const id of ctx.session.participantCharacterIds||[]){
  if(existing.has(id))continue;
  const character=ctx.characters.find(c=>c.id===id);
  html+='<option value="'+esc(id)+'">'+esc(character?.name||id)+'</option>'
 }
 return html
}
function damageOptions(){
 let html='<option value="">Sem tipo</option>';
 for(const type of DAMAGE_TYPES)html+='<option>'+esc(type)+'</option>';
 return html
}
function combatantHtml(c,encounter,ctx){
 const active=c.id===encounter.activeCombatantId;
 if(c.kind==='character'){
  return '<div class="combatant '+(active?'is-turn':'')+'" data-combatant="'+esc(c.id)+'"><div class="combatant-head"><div><strong>'+esc(c.name)+'</strong> <span class="badge">Personagem</span>'+(active?'<span class="badge active">Turno</span>':'')+'</div><div class="combatant-actions"><a class="btn secondary" href="ficha-personagem.html?id='+encodeURIComponent(c.characterId)+'">Abrir Ficha</a><button type="button" class="danger" data-remove-combatant>Remover</button></div></div><div class="combatant-grid"><label>Iniciativa<input type="number" data-init value="'+(c.initiative??'')+'" placeholder="manual"></label><div><span class="mini">Mod. conhecido</span><strong>'+(c.initiativeModifier>=0?'+':'')+c.initiativeModifier+'</strong></div><div><span class="mini">PV / condições</span><strong>na Ficha</strong></div><div><span class="mini">Autoridade</span><strong>Ficha Digital</strong></div></div></div>'
 }
 return '<div class="combatant '+(active?'is-turn ':'')+(c.defeated?'defeated':'')+'" data-combatant="'+esc(c.id)+'"><div class="combatant-head"><div><strong>'+esc(c.name)+'</strong> <span class="badge">'+(c.kind==='monster'?'Monstro':'NPC')+'</span>'+(active?'<span class="badge active">Turno</span>':'')+(c.defeated?'<span class="badge">0 PV</span>':'')+'<div class="encounter-source">'+esc(c.source||'Criatura personalizada')+(c.cr?' · CR '+esc(c.cr):'')+'</div></div><div class="combatant-actions"><button type="button" class="secondary" data-roll-init>Rolar iniciativa</button><button type="button" class="secondary" data-target-combatant>Usar como alvo</button><button type="button" class="danger" data-remove-combatant>Remover</button></div></div><div class="combatant-grid"><label>Iniciativa<input type="number" data-init value="'+(c.initiative??'')+'"></label><div><span class="mini">CA</span><strong>'+(c.ac||'—')+'</strong></div><div><span class="mini">PV</span><strong>'+c.currentHp+'/'+c.maxHp+(c.tempHp?' + '+c.tempHp+' temp.':'')+'</strong></div><div><span class="mini">Defesas</span><strong>'+esc([c.resistances.length?'R '+c.resistances.join(', '):'',c.immunities.length?'I '+c.immunities.join(', '):'',c.vulnerabilities.length?'V '+c.vulnerabilities.join(', '):''].filter(Boolean).join(' · ')||'—')+'</strong></div></div><div class="combatant-actions"><label style="min-width:120px">Valor<input type="number" min="0" data-hp-amount value="0"></label><label style="min-width:160px">Tipo<select data-hp-type>'+damageOptions()+'</select></label><button type="button" data-damage-combatant>Aplicar dano</button><button type="button" class="secondary" data-heal-combatant>Curar</button></div><label style="margin-top:7px">Condições<input data-conditions value="'+esc(c.conditions.join(', '))+'" placeholder="Caído, Envenenado..."></label></div>'
}
function rewardsHtml(encounter){
 const r=encounter.rewards||{};
 return '<div class="encounter-subcard"><h4>Recompensas e resultado</h4><div class="reward-grid"><label>XP<input type="number" min="0" data-reward="xp" value="'+(r.xp||0)+'"></label><label>Moedas (PC)<input type="number" min="0" data-reward="coinsCp" value="'+(r.coinsCp||0)+'"></label><label class="wide">Itens / tesouro<input data-reward="items" value="'+esc(r.items||'')+'"></label><label class="wide">Notas<textarea data-reward="notes">'+esc(r.notes||'')+'</textarea></label></div><label style="margin-top:8px">Resumo do encontro<textarea data-encounter-summary>'+esc(encounter.summary||'')+'</textarea></label></div>'
}
function addToolsHtml(encounter,ctx){
 const listId='session-encounter-monsters-'+encounter.id;
 return '<div class="encounter-subcard"><h4>Adicionar combatentes</h4><div class="encounter-form"><div class="monster-picker"><label>Personagem da sessão<select data-add-character>'+participantOptions(ctx,encounter)+'</select></label><button type="button" data-add-character-button>Adicionar personagem</button></div><div class="monster-picker" style="margin-top:8px"><label>Monstro da Biblioteca<input type="search" data-monster-search list="'+esc(listId)+'" placeholder="Digite o nome do monstro"><datalist id="'+esc(listId)+'"></datalist></label><button type="button" data-add-monster>Adicionar monstro</button></div><p class="mini" data-monster-status>O catálogo será carregado ao buscar um monstro.</p><div class="npc-grid" style="margin-top:8px"><label>NPC personalizado<input data-npc-name placeholder="Nome"></label><label>CA<input data-npc-ac type="number" min="0" value="10"></label><label>PV<input data-npc-hp type="number" min="1" value="10"></label><label>Mod. iniciativa<input data-npc-init type="number" value="0"></label></div><button type="button" class="secondary" data-add-npc style="margin-top:8px">Adicionar NPC</button></div></div>'
}
function encounterCard(encounter,ctx){
 const canEdit=!['completed','cancelled'].includes(encounter.status),xpPotential=(encounter.combatants||[]).filter(c=>c.kind==='monster').reduce((sum,c)=>sum+(c.xp||0),0);
 let turn='';
 if(encounter.status==='active')turn='<div class="encounter-turn"><div><span>Rodada</span><strong>'+encounter.round+'</strong></div><div><span>Turno atual</span><strong>'+esc(activeName(encounter))+'</strong></div><div><span>Combatentes</span><strong>'+encounter.combatants.length+'</strong></div><div><span>XP dos monstros</span><strong>'+xpPotential+'</strong></div></div><div class="encounter-toolbar"><button type="button" class="secondary" data-prev-turn>← Turno anterior</button><button type="button" data-next-turn>Próximo turno →</button><button type="button" class="secondary" data-roll-monster-init>Rolar iniciativas dos monstros</button></div>';
 return '<article class="encounter-card '+(encounter.status==='active'?'active':'')+'" data-encounter="'+esc(encounter.id)+'"><div class="encounter-head"><div><h3>'+esc(encounter.title)+'</h3><span class="badge '+(encounter.status==='active'?'active':'')+'">'+esc(statusLabel(encounter.status))+'</span></div><div class="encounter-actions">'+(encounter.status==='planned'?'<button type="button" data-start-encounter>Iniciar</button>':'')+(encounter.status==='active'?'<button type="button" data-finish-encounter>Concluir</button>':'')+(canEdit?'<button type="button" class="secondary" data-cancel-encounter>Cancelar</button>':'')+'<button type="button" class="danger" data-remove-encounter>Excluir</button></div></div><div class="form-grid two" style="margin-top:8px"><label>Nome<input data-encounter-title value="'+esc(encounter.title)+'"></label><label>Cena da Sessão<select data-encounter-scene>'+sceneOptions(ctx.session,encounter.sessionSceneId)+'</select></label></div>'+turn+'<div class="combatant-list">'+(encounter.combatants.length?encounter.combatants.map(c=>combatantHtml(c,encounter,ctx)).join(''):'<div class="encounter-empty">Nenhum combatente adicionado.</div>')+'</div>'+(canEdit?addToolsHtml(encounter,ctx):'')+rewardsHtml(encounter)+'<div class="row-actions" style="margin-top:10px"><button type="button" data-save-encounter>Salvar encontro</button></div></article>'
}
function managerHtml(ctx){
 const session=ctx.session,rows=[...(session.encounters||[])].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
 return '<section class="session-subsection encounter-shell session-encounter-manager"><div class="encounter-head"><div><h4>Encontros</h4></div></div><div class="form-grid two" style="margin-top:8px"><label>Nome do encontro<input data-new-encounter-title placeholder="Novo encontro"></label><label>Cena da Sessão<select data-new-encounter-scene>'+sceneOptions(session,'')+'</select></label></div><div class="row-actions" style="margin-top:8px"><button type="button" data-create-encounter>Criar encontro</button></div><div class="encounter-list">'+(rows.length?rows.map(e=>encounterCard(e,ctx)).join(''):'<div class="encounter-empty">Nenhum encontro nesta Sessão.</div>')+'</div></section>'
}
function injectSceneLinks(card,ctx){
 for(const node of card.querySelectorAll('[data-session-scene]')){
  node.querySelector('.scene-encounter-links')?.remove();
  const id=node.dataset.sessionScene,rows=(ctx.session.encounters||[]).filter(e=>e.sessionSceneId===id);
  if(!rows.length)continue;
  const box=document.createElement('div');box.className='story-status scene-encounter-links';
  box.style.marginTop='8px';box.innerHTML='<span class="mini">Encontros:</span> '+rows.map(e=>'<span class="badge">'+esc(e.title)+'</span>').join('');
  const actions=node.querySelector('.row-actions');if(actions)node.insertBefore(box,actions);else node.appendChild(box)
 }
}
function injectCard(card){
 if(!card.querySelector('[data-save-session-main]')||card.querySelector('.session-encounter-manager'))return;
 const ctx=contextForCard(card);if(!ctx.session)return;
 for(const section of card.querySelectorAll('.session-subsection')){
  if(section.querySelector('h4')?.textContent.trim()==='Encontros')section.remove()
 }
 card.insertAdjacentHTML('beforeend',managerHtml(ctx));
 injectSceneLinks(card,ctx);bindManager(card,ctx)
}
function injectAll(){for(const card of document.querySelectorAll('[data-session-id]'))injectCard(card)}
function encounterNodeData(node){
 const rewards={};
 for(const input of node.querySelectorAll('[data-reward]'))rewards[input.dataset.reward]=input.value;
 return{title:node.querySelector('[data-encounter-title]')?.value||'',sessionSceneId:node.querySelector('[data-encounter-scene]')?.value||null,summary:node.querySelector('[data-encounter-summary]')?.value||'',rewards}
}
function saveEncounterNode(ctx,node,message='Encontro salvo.'){
 const id=node.dataset.encounter,result=updateEncounter(ctx.session,id,encounterNodeData(node));
 if(!result.ok)return announce(result.reason,false);persist(ctx,message)
}
function appendRecap(session,encounter){
 const s=encounterSummary(encounter),parts=['Encontro: '+s.title,'Rodadas: '+s.rounds];
 if(s.defeated.length)parts.push('Derrotados: '+s.defeated.map(x=>x.name).join(', '));
 if(s.rewards.xp)parts.push('XP: '+s.rewards.xp);
 if(s.rewards.coinsCp)parts.push('Moedas: '+s.rewards.coinsCp+' PC');
 if(s.rewards.items)parts.push('Itens: '+s.rewards.items);
 if(s.summary)parts.push(s.summary);
 const line=parts.join(' · ');session.summary=[String(session.summary||'').trim(),line].filter(Boolean).join('\n')
}
async function ensureMonsters(node){
 if(!monsterIndex&&!monsterLoad)monsterLoad=loadEncounterMonsterIndex().then(rows=>{monsterIndex=rows;return rows});
 const status=node.querySelector('[data-monster-status]');if(status)status.textContent='Carregando catálogo de monstros...';
 try{
  const rows=monsterIndex||await monsterLoad;
  const list=node.querySelector('datalist');if(list)list.innerHTML=rows.map(r=>'<option value="'+esc(r.name)+'"></option>').join('');
  if(status)status.textContent=rows.length+' monstros disponíveis.';
  return rows
 }catch(error){if(status)status.textContent='Falha ao carregar monstros.';throw error}
}
function parseConditions(value){return String(value||'').split(',').map(x=>x.trim()).filter(Boolean)}
function findEncounter(ctx,id){return ctx.session.encounters.find(e=>e.id===id)||null}
function bindManager(card,ctx){
 const manager=card.querySelector('.session-encounter-manager');if(!manager)return;
 manager.querySelector('[data-create-encounter]')?.addEventListener('click',()=>{
  const title=manager.querySelector('[data-new-encounter-title]')?.value.trim(),sessionSceneId=manager.querySelector('[data-new-encounter-scene]')?.value||null;
  const result=createEncounter(ctx.session,{title:title||undefined,sessionSceneId});
  if(!result.ok)return announce(result.reason,false);persist(ctx,'Encontro criado.')
 });
 for(const node of manager.querySelectorAll('[data-encounter]')){
  const id=node.dataset.encounter,encounter=findEncounter(ctx,id);if(!encounter)continue;
  node.querySelector('[data-save-encounter]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveEncounterNode(ctx,node)});
  node.querySelector('[data-encounter-scene]')?.addEventListener('change',()=>saveEncounterNode(ctx,node,'Cena do Encontro atualizada.'));
  node.querySelector('[data-start-encounter]')?.addEventListener('click',()=>{
   const pre=updateEncounter(ctx.session,id,encounterNodeData(node));if(!pre.ok)return announce(pre.reason,false);
   const result=startEncounter(ctx.session,id);if(!result.ok)return announce(result.reason,false);persist(ctx,'Encontro iniciado.')
  });
  node.querySelector('[data-finish-encounter]')?.addEventListener('click',()=>{
   const pre=updateEncounter(ctx.session,id,encounterNodeData(node));if(!pre.ok)return announce(pre.reason,false);
   const current=findEncounter(ctx,id);appendRecap(ctx.session,current);
   const result=finishEncounter(ctx.session,id,encounterNodeData(node));if(!result.ok)return announce(result.reason,false);persist(ctx,'Encontro concluído e registrado na Sessão.')
  });
  node.querySelector('[data-cancel-encounter]')?.addEventListener('click',()=>{const result=cancelEncounter(ctx.session,id);if(!result.ok)return announce(result.reason,false);persist(ctx,'Encontro cancelado.')});
  node.querySelector('[data-remove-encounter]')?.addEventListener('click',()=>{if(!confirm('Excluir este encontro?'))return;const result=removeEncounter(ctx.session,id);if(!result.ok)return announce(result.reason,false);persist(ctx,'Encontro excluído.')});
  node.querySelector('[data-next-turn]')?.addEventListener('click',()=>{const result=nextEncounterTurn(encounter);if(!result.ok)return announce(result.reason,false);persist(ctx,'Turno: '+result.combatant.name+' · rodada '+result.round+'.')});
  node.querySelector('[data-prev-turn]')?.addEventListener('click',()=>{const result=previousEncounterTurn(encounter);if(!result.ok)return announce(result.reason,false);persist(ctx,'Turno: '+result.combatant.name+' · rodada '+result.round+'.')});
  node.querySelector('[data-roll-monster-init]')?.addEventListener('click',()=>{for(const c of encounter.combatants.filter(c=>c.kind!=='character'))setCombatantInitiative(encounter,c.id,rollD20({modifier:c.initiativeModifier}).total);persist(ctx,'Iniciativas dos monstros/NPCs roladas.')});
  node.querySelector('[data-add-character-button]')?.addEventListener('click',()=>{
   const characterId=node.querySelector('[data-add-character]')?.value,character=ctx.characters.find(c=>c.id===characterId);
   const result=addCharacterCombatant(encounter,{characterId,name:character?.name||characterId});if(!result.ok)return announce(result.reason,false);persist(ctx,'Personagem adicionado ao Encontro.')
  });
  const search=node.querySelector('[data-monster-search]');
  search?.addEventListener('focus',()=>ensureMonsters(node));
  search?.addEventListener('input',()=>ensureMonsters(node));
  node.querySelector('[data-add-monster]')?.addEventListener('click',async()=>{
   try{
    const rows=await ensureMonsters(node),value=search?.value.trim(),row=rows.find(r=>r.id===value||r.name.toLocaleLowerCase('pt-BR')===value?.toLocaleLowerCase('pt-BR'));
    if(!row)return announce('Selecione um monstro existente na Biblioteca.',false);
    const detail=await loadEncounterMonsterDetail(row),result=addCreatureCombatant(encounter,{...detail,kind:'monster',monsterId:detail.id,currentHp:detail.maxHp});
    if(!result.ok)return announce(result.reason,false);persist(ctx,detail.name+' adicionado ao Encontro.')
   }catch(error){announce(error.message||'Não foi possível carregar o monstro.',false)}
  });
  node.querySelector('[data-add-npc]')?.addEventListener('click',()=>{
   const name=node.querySelector('[data-npc-name]')?.value.trim();if(!name)return announce('Informe o nome do NPC.',false);
   const result=addCreatureCombatant(encounter,{kind:'npc',name,ac:node.querySelector('[data-npc-ac]')?.value,maxHp:node.querySelector('[data-npc-hp]')?.value,initiativeModifier:node.querySelector('[data-npc-init]')?.value,source:'NPC personalizado'});
   if(!result.ok)return announce(result.reason,false);persist(ctx,'NPC adicionado ao Encontro.')
  });
  for(const input of node.querySelectorAll('[data-init]'))input.addEventListener('change',()=>{
   const unit=input.closest('[data-combatant]'),result=setCombatantInitiative(encounter,unit?.dataset.combatant,input.value);
   if(!result.ok)return announce(result.reason,false);persist(ctx,'Iniciativa atualizada.')
  });
  for(const input of node.querySelectorAll('[data-conditions]'))input.addEventListener('change',()=>{
   const unit=input.closest('[data-combatant]'),result=updateCombatant(encounter,unit?.dataset.combatant,{conditions:parseConditions(input.value)});
   if(!result.ok)return announce(result.reason,false);persist(ctx,'Condições atualizadas.')
  });
  for(const button of node.querySelectorAll('[data-roll-init]'))button.addEventListener('click',()=>{
   const unit=button.closest('[data-combatant]'),combatant=encounter.combatants.find(c=>c.id===unit?.dataset.combatant);if(!combatant)return;
   setCombatantInitiative(encounter,combatant.id,rollD20({modifier:combatant.initiativeModifier}).total);persist(ctx,'Iniciativa de '+combatant.name+' rolada.')
  });
  for(const button of node.querySelectorAll('[data-damage-combatant]'))button.addEventListener('click',()=>{
   const unit=button.closest('[data-combatant]'),result=applyEncounterDamage(encounter,unit?.dataset.combatant,unit?.querySelector('[data-hp-amount]')?.value,{type:unit?.querySelector('[data-hp-type]')?.value});
   if(!result.ok)return announce(result.reason,false);persist(ctx,result.combatant.name+': dano aplicado.')
  });
  for(const button of node.querySelectorAll('[data-heal-combatant]'))button.addEventListener('click',()=>{
   const unit=button.closest('[data-combatant]'),result=applyEncounterHealing(encounter,unit?.dataset.combatant,unit?.querySelector('[data-hp-amount]')?.value);
   if(!result.ok)return announce(result.reason,false);persist(ctx,result.combatant.name+': cura aplicada.')
  });
  for(const button of node.querySelectorAll('[data-target-combatant]'))button.addEventListener('click',()=>{
   const unit=button.closest('[data-combatant]'),combatant=encounter.combatants.find(c=>c.id===unit?.dataset.combatant),target=creatureTargetForResolution(combatant);
   if(!target)return;localStorage.setItem(TARGET_KEY,JSON.stringify({campaignId:ctx.campaign?.id||null,sessionId:ctx.session.id,encounterId:encounter.id,at:new Date().toISOString(),target}));announce(combatant.name+' definido como alvo de resolução das Fichas neste navegador.')
  });
  for(const button of node.querySelectorAll('[data-remove-combatant]'))button.addEventListener('click',()=>{
   const unit=button.closest('[data-combatant]'),result=removeCombatant(encounter,unit?.dataset.combatant);
   if(!result.ok)return announce(result.reason,false);persist(ctx,'Combatente removido.')
  })
 }
}
function init(){
 injectAll();
 const root=document.getElementById('sessions-list');if(!root)return;
 new MutationObserver(()=>queueMicrotask(injectAll)).observe(root,{childList:true,subtree:true})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
