import{read,write}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,updateCampaignSession,readStandaloneSessions,writeStandaloneSessions,updateStandaloneSession}from'./campaign-state.js?v=20260924-session-combat1';
import{createCombat,createCombatFromEncounter,updateCombat,removeCombat,startCombat,finishCombat,cancelCombat,addCombatant,addCombatants,updateCombatant,removeCombatant,setCombatantInitiative,setGroupInitiative,nextCombatTurn,previousCombatTurn,addCondition,removeCondition,setConcentration,setReactionAvailable,applyCombatDamage,applyCombatHealing,setTemporaryHp,combatSummary,initiativeOrder}from'./combat-state.js?v=20260924-session-combat1';
import{loadEncounterMonsterIndex,loadEncounterMonsterDetail}from'./monster-catalog.js?v=20260902-encounters1';
import{rollD20}from'./character-sheet-resolution-rules.js?v=20260902-resolution1';
import{creatureTargetForResolution}from'./encounter-state.js?v=20260924-session-planning1';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Força','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante','Concussão','Perfurante','Cortante'];
const CONDITION_NAMES=['Agarrado','Amedrontado','Atordoado','Caído','Cego','Enfeitiçado','Envenenado','Impedido','Incapacitado','Inconsciente','Invisível','Paralisado','Petrificado','Surdo'];
const TARGET_KEY='hub-rpg:encounter-target:v1';
let monsterIndex=null,monsterLoad=null;

function announce(message,ok=true){const box=document.getElementById('session-feedback');if(!box)return;box.hidden=false;box.className='status '+(ok?'ok':'warning');box.textContent=message;clearTimeout(announce.timer);announce.timer=setTimeout(()=>box.hidden=true,3600)}
function contextForCard(card){
 const id=card.dataset.sessionId,source=card.dataset.sessionSource,campaigns=readCampaigns(),standalone=readStandaloneSessions(),characters=read();
 if(source==='campaign'){const campaign=campaigns.find(c=>(c.sessions||[]).some(s=>s.id===id)),session=campaign?.sessions.find(s=>s.id===id)||null;return{source,campaign,campaigns,standalone,characters,session}}
 return{source,campaign:null,campaigns,standalone,characters,session:standalone.find(s=>s.id===id)||null}
}
function persist(ctx,message='Combate salvo.'){
 if(!ctx?.session)return false;
 const patch={combats:ctx.session.combats,activeCombatId:ctx.session.activeCombatId,summary:ctx.session.summary};
 if(ctx.source==='campaign'){const r=updateCampaignSession(ctx.campaigns,ctx.campaign.id,ctx.session.id,patch);if(!r.ok){announce(r.reason,false);return false}writeCampaigns(r.list)}
 else{const r=updateStandaloneSession(ctx.standalone,ctx.session.id,patch);if(!r.ok){announce(r.reason,false);return false}writeStandaloneSessions(r.list)}
 window.dispatchEvent(new CustomEvent('hub-rpg:sessions-local-updated'));announce(message,true);return true
}
function runtimeFor(character){return character?.sheet?.runtime&&typeof character.sheet.runtime==='object'?character.sheet.runtime:{}}
function characterSnapshot(character){
 const runtime=runtimeFor(character),death=runtime.deathSaves&&typeof runtime.deathSaves==='object'?runtime.deathSaves:null;
 const current=runtime.currentHp==null?0:Math.max(0,Number(runtime.currentHp)||0);
 const maxCandidates=[runtime.maxHp,character?.sheet?.maxHp,character?.maxHp,character?.hp,current].map(Number).filter(Number.isFinite);
 const max=Math.max(0,...maxCandidates);
 const acCandidates=[runtime.ac,character?.sheet?.ac,character?.ac].map(Number).filter(Number.isFinite);
 const initCandidates=[runtime.initiativeModifier,character?.sheet?.initiativeModifier,character?.initiativeModifier].map(Number).filter(Number.isFinite);
 return{kind:'character',characterId:character?.id||null,name:character?.name||'Personagem',initiativeModifier:initCandidates[0]||0,ac:acCandidates.length?acCandidates[0]:null,maxHp:max,currentHp:current||max,tempHp:Math.max(0,Number(runtime.tempHp)||0),conditions:(runtime.conditions||[]).map(name=>({name,duration:'manual'})),concentration:!!runtime.concentration,reactionAvailable:character?.sheet?.combat?.turn?.reactionUsed!==true,deathState:death?{successes:death.successes,failures:death.failures,stable:death.stable,dead:death.dead}:{successes:runtime.deathSuccess,failures:runtime.deathFail,stable:false,dead:false},source:'Ficha Digital'}
}
function hydrateCombatCharacters(ctx,combat){
 for(const row of combat.combatants||[]){if(row.kind!=='character')continue;const character=ctx.characters.find(c=>c.id===row.characterId);if(!character)continue;const snap=characterSnapshot(character);updateCombatant(combat,row.id,{...snap,initiative:row.initiative,notes:row.notes,conditions:row.conditions?.length?row.conditions:snap.conditions,concentration:row.concentration||snap.concentration,reactionAvailable:row.reactionAvailable})}
 return combat
}
function syncCharactersToSheets(ctx,combat){
 const list=read(),byId=new Map(list.map(c=>[c.id,c])),changed=[];
 for(const unit of combat.combatants||[]){if(unit.kind!=='character'||!unit.characterId)continue;const character=byId.get(unit.characterId);if(!character)continue;character.sheet=character.sheet||{};character.sheet.runtime=character.sheet.runtime&&typeof character.sheet.runtime==='object'?character.sheet.runtime:{};const runtime=character.sheet.runtime;runtime.currentHp=Math.max(0,Number(unit.currentHp)||0);runtime.tempHp=Math.max(0,Number(unit.tempHp)||0);runtime.conditions=(unit.conditions||[]).map(c=>c.name).filter(Boolean);runtime.concentration=!!unit.concentration;character.sheet.combat=character.sheet.combat&&typeof character.sheet.combat==='object'?character.sheet.combat:{};character.sheet.combat.turn=character.sheet.combat.turn&&typeof character.sheet.combat.turn==='object'?character.sheet.combat.turn:{};character.sheet.combat.turn.reactionUsed=!unit.reactionAvailable;if(unit.deathState){runtime.deathSuccess=Math.max(0,Number(unit.deathState.successes)||0);runtime.deathFail=Math.max(0,Number(unit.deathState.failures)||0);runtime.deathSaves={...(runtime.deathSaves||{}),...unit.deathState}}character.updatedAt=new Date().toISOString();changed.push(character.id)}
 if(changed.length)write(list);return changed
}
function sceneName(session,id){return session.scenes?.find(s=>s.id===id)?.title||''}
function encounterName(session,id){return session.encounters?.find(e=>e.id===id)?.title||''}
function activeCombat(session){return(session.combats||[]).find(c=>c.id===session.activeCombatId&&c.status==='active')||(session.combats||[]).find(c=>c.status==='active')||null}
function statusLabel(status){return({draft:'Preparado',active:'Em combate',completed:'Concluído',cancelled:'Cancelado'}[status]||status)}
function damageOptions(){return'<option value="">Sem tipo</option>'+DAMAGE_TYPES.map(type=>'<option>'+esc(type)+'</option>').join('')}
function conditionOptions(){return CONDITION_NAMES.map(name=>'<option>'+esc(name)+'</option>').join('')}
function durationOptions(){return'<option value="manual">Até remover</option><option value="rounds">X rodadas</option><option value="start-turn">Até o início do próximo turno</option><option value="end-turn">Até o fim do próximo turno</option>'}
function rollDiceExpression(expression){
 const source=String(expression||'').trim().replace(/\s+/g,'');if(!source)return null;const match=source.match(/^(\d*)d(\d+)([+-]\d+)?$/i);if(!match){const fixed=Number(source);return Number.isFinite(fixed)?{total:fixed,rolls:[],modifier:0,expression:source}:null}
 const count=Math.max(1,Math.min(50,Number(match[1]||1))),sides=Math.max(2,Math.min(1000,Number(match[2]))),modifier=Number(match[3]||0),rolls=Array.from({length:count},()=>1+Math.floor(Math.random()*sides));return{total:rolls.reduce((a,b)=>a+b,0)+modifier,rolls,modifier,expression:source}
}
function monsterActions(detail){
 const raw=detail?.raw,rows=Array.isArray(raw?.action)?raw.action:[];return rows.map(action=>{const block=JSON.stringify(action?.entries||action?.entry||'').replace(/\\n/g,' '),hit=block.match(/\{@hit\s+([+-]?\d+)\}/i)||block.match(/([+-]\d+)\s+to hit/i),damage=block.match(/\{@damage\s+([^}]+)\}/i),type=block.match(/(?:damage|dano)\s+(?:de\s+)?([A-Za-zÀ-ÿ]+)/i);return{name:action?.name||'Ação',attackBonus:hit?Number(hit[1]):null,damage:damage?damage[1]:'',damageType:type?type[1]:'',notes:''}}).slice(0,12)
}
function combatantConditions(c){
 if(!c.conditions?.length)return'<span class="mini">—</span>';
 return'<div class="combat-condition-list">'+c.conditions.map(cond=>'<span class="combat-condition"><a href="regras.html" target="_blank">'+esc(cond.name)+'</a>'+(cond.duration==='rounds'?' · '+cond.remainingRounds+'r':'')+' <button type="button" data-remove-condition="'+esc(cond.id)+'" aria-label="Remover condição">×</button></span>').join('')+'</div>'
}
function actionButtons(c){
 if(!c.actions?.length)return'';
 return'<div class="combat-actions-list">'+c.actions.map(action=>'<button type="button" class="secondary" data-combat-action="'+esc(action.id)+'">'+esc(action.name)+(action.attackBonus!=null?' '+(action.attackBonus>=0?'+':'')+action.attackBonus:'')+(action.damage?' · '+esc(action.damage):'')+'</button>').join('')+'</div>'
}
function combatantHtml(c,combat){
 const active=c.id===combat.activeCombatantId,hpKnown=c.maxHp>0,kind=c.kind==='character'?'Personagem':c.kind==='monster'?'Monstro':'NPC';
 const death=c.kind==='character'&&c.deathState?'<span class="mini">Morte: '+c.deathState.successes+'✓ / '+c.deathState.failures+'✕'+(c.deathState.stable?' · estável':'')+(c.deathState.dead?' · morto':'')+'</span>':'';
 return'<article class="session-combatant '+(active?'is-turn ':'')+(c.defeated?'defeated':'')+'" data-combatant="'+esc(c.id)+'"><div class="combatant-head"><div><strong>'+esc(c.name)+'</strong> <span class="badge">'+kind+'</span>'+(active?'<span class="badge active">Turno</span>':'')+(c.concentration?'<span class="badge">Concentração</span>':'')+(!c.reactionAvailable?'<span class="badge">Reação usada</span>':'')+'<div class="encounter-source">'+esc(c.source||'')+'</div></div><div class="combatant-actions">'+(c.kind==='character'?'<a class="btn secondary" href="ficha-personagem.html?id='+encodeURIComponent(c.characterId)+'">Abrir Ficha</a>':'<button type="button" class="secondary" data-target-combatant>Usar como alvo</button>')+'<button type="button" class="danger" data-remove-combatant>Remover</button></div></div>'+
 '<div class="combat-control-grid"><label>Iniciativa<input type="number" data-combat-init value="'+(c.initiative??'')+'"></label><div><span>CA</span><strong>'+(c.ac??'—')+'</strong></div><div><span>PV</span><strong>'+c.currentHp+(hpKnown?'/'+c.maxHp:'')+(c.tempHp?' + '+c.tempHp+' temp.':'')+'</strong>'+death+'</div><div><span>Reação</span><strong>'+(c.reactionAvailable?'Disponível':'Usada')+'</strong></div></div>'+
 '<div class="combat-inline-controls"><button type="button" class="secondary" data-hp-delta="-5">−5 PV</button><button type="button" class="secondary" data-hp-delta="-1">−1 PV</button><button type="button" class="secondary" data-hp-delta="1">+1 PV</button><button type="button" class="secondary" data-hp-delta="5">+5 PV</button><label>Valor<input type="number" min="0" value="0" data-hp-amount></label><label>Tipo<select data-hp-type>'+damageOptions()+'</select></label><button type="button" data-damage>Aplicar dano</button><button type="button" class="secondary" data-heal>Curar</button><label>PV temp.<input type="number" min="0" value="'+c.tempHp+'" data-temp-hp></label></div>'+
 '<div class="combat-state-row"><div><span class="mini">Condições</span>'+combatantConditions(c)+'</div><div class="combat-state-buttons"><button type="button" class="'+(c.concentration?'':'secondary')+'" data-toggle-concentration>Concentração</button><button type="button" class="'+(c.reactionAvailable?'secondary':'')+'" data-toggle-reaction>'+(c.reactionAvailable?'Usar reação':'Restaurar reação')+'</button><button type="button" class="secondary" data-roll-d20>d20</button><button type="button" class="secondary" data-roll-init>Rolar iniciativa</button></div></div>'+
 '<div class="combat-condition-add"><label>Condição<select data-condition-name>'+conditionOptions()+'</select></label><label>Duração<select data-condition-duration>'+durationOptions()+'</select></label><label>Rodadas<input type="number" min="1" value="1" data-condition-rounds></label><button type="button" class="secondary" data-add-condition>Adicionar condição</button></div>'+
 actionButtons(c)+'<label class="combatant-notes">Notas rápidas<input data-combatant-notes value="'+esc(c.notes||'')+'"></label></article>'
}
function combatHeader(combat,ctx){
 const current=combat.combatants.find(c=>c.id===combat.activeCombatantId),foes=combat.combatants.filter(c=>c.kind!=='character'&&!c.defeated).length,dead=combat.combatants.filter(c=>c.kind!=='character'&&c.defeated).length;
 return'<div class="combat-live-header"><div><span class="combat-kicker">COMBATE ATIVO</span><h3>'+esc(combat.title)+'</h3><div class="mini">'+esc(sceneName(ctx.session,combat.sessionSceneId)||'Sem cena')+(combat.encounterId?' · '+esc(encounterName(ctx.session,combat.encounterId)):'')+'</div></div><div class="combat-live-metrics"><div><span>Rodada</span><strong>'+combat.round+'</strong></div><div><span>Turno</span><strong>'+esc(current?.name||'—')+'</strong></div><div><span>Inimigos</span><strong>'+foes+'</strong></div><div><span>Derrotados</span><strong>'+dead+'</strong></div></div></div>'+
 '<div class="combat-main-toolbar"><button type="button" class="secondary" data-prev-combat-turn>← Turno anterior</button><button type="button" data-next-combat-turn>Próximo turno →</button><button type="button" class="secondary" data-roll-all-enemies>Rolar iniciativas inimigas</button><button type="button" class="secondary" data-refresh-characters>Atualizar personagens da Ficha</button><button type="button" class="danger" data-open-finish>Finalizar combate</button></div>'
}
function addCombatantsHtml(combat,ctx){
 const used=new Set(combat.combatants.filter(c=>c.kind==='character').map(c=>c.characterId)),characterOptions=(ctx.session.participantCharacterIds||[]).filter(id=>!used.has(id)).map(id=>{const c=ctx.characters.find(x=>x.id===id);return'<option value="'+esc(id)+'">'+esc(c?.name||id)+'</option>'}).join(''),listId='combat-monsters-'+combat.id;
 return'<details class="combat-add-panel"><summary>+ Adicionar combatente</summary><div class="combat-add-grid"><div><label>Personagem da Sessão<select data-add-combat-character><option value="">— Selecione —</option>'+characterOptions+'</select></label><button type="button" data-add-combat-character-button>Adicionar personagem</button></div>'+
 '<div><label>Monstro da Biblioteca<input type="search" data-combat-monster-search list="'+esc(listId)+'" placeholder="Nome do monstro"><datalist id="'+esc(listId)+'"></datalist></label><div class="combat-quantity-row"><label>Quantidade<input type="number" min="1" max="20" value="1" data-monster-quantity></label><label class="check"><input type="checkbox" data-group-initiative> Iniciativa em grupo</label><button type="button" data-add-combat-monster>Adicionar</button></div><p class="mini" data-combat-monster-status></p></div>'+
 '<div><div class="npc-grid"><label>NPC personalizado<input data-combat-npc-name placeholder="Nome"></label><label>CA<input data-combat-npc-ac type="number" min="0" value="10"></label><label>PV<input data-combat-npc-hp type="number" min="1" value="10"></label><label>Mod. iniciativa<input data-combat-npc-init type="number" value="0"></label></div><button type="button" class="secondary" data-add-combat-npc>Adicionar NPC</button></div></div></details>'
}
function finishPanel(combat){
 return'<div class="combat-finish-panel" data-finish-panel hidden><h4>Finalizar combate</h4><label>Resultado / desfecho<textarea data-combat-outcome>'+esc(combat.outcome||'')+'</textarea></label><label class="check"><input type="checkbox" data-finish-history checked> Registrar no resumo da Sessão</label><label class="check"><input type="checkbox" data-finish-sync checked> Sincronizar PV, PV temporários, condições e estado de combate dos personagens com a Ficha Digital</label><div class="row-actions"><button type="button" class="secondary" data-close-finish>Cancelar</button><button type="button" data-confirm-finish>Finalizar combate</button></div></div>'
}
function activeCombatHtml(combat,ctx){
 const ordered=initiativeOrder(combat);
 return'<article class="combat-workspace active" data-combat="'+esc(combat.id)+'">'+combatHeader(combat,ctx)+'<div class="combat-layout"><div><div class="combatant-list">'+ordered.map(c=>combatantHtml(c,combat)).join('')+'</div>'+addCombatantsHtml(combat,ctx)+'</div><aside class="combat-master-panel"><h4>Painel do Mestre</h4><label>Notas do combate<textarea data-combat-notes>'+esc(combat.notes||'')+'</textarea></label><div class="combat-master-stat"><span>Combatentes</span><strong>'+combat.combatants.length+'</strong></div><div class="combat-master-stat"><span>Personagens</span><strong>'+combat.combatants.filter(c=>c.kind==='character').length+'</strong></div><button type="button" data-save-combat-notes>Salvar notas</button></aside></div>'+finishPanel(combat)+'</article>'
}
function draftCombatHtml(combat,ctx){
 return'<article class="combat-history-card draft" data-combat="'+esc(combat.id)+'"><div class="combatant-head"><div><strong>'+esc(combat.title)+'</strong> <span class="badge">Preparado</span><div class="mini">'+esc(encounterName(ctx.session,combat.encounterId)||sceneName(ctx.session,combat.sessionSceneId)||'Combate rápido')+' · '+combat.combatants.length+' combatente(s)</div></div><div class="combatant-actions"><button type="button" data-start-combat>Iniciar combate</button><button type="button" class="secondary" data-open-draft>Editar preparação</button><button type="button" class="danger" data-remove-combat>Excluir</button></div></div><div data-draft-body hidden><div class="combatant-list">'+combat.combatants.map(c=>combatantHtml(c,combat)).join('')+'</div>'+addCombatantsHtml(combat,ctx)+'<label>Notas<textarea data-combat-notes>'+esc(combat.notes||'')+'</textarea></label><div class="row-actions"><button type="button" data-save-combat-notes>Salvar preparação</button></div></div></article>'
}
function historyHtml(combat,ctx){
 const summary=combatSummary(combat),duration=summary.startedAt&&summary.endedAt?Math.max(1,Math.round((new Date(summary.endedAt)-new Date(summary.startedAt))/60000)):null;
 return'<article class="combat-history-card '+esc(combat.status)+'" data-combat="'+esc(combat.id)+'"><div class="combatant-head"><div><strong>'+esc(combat.title)+'</strong> <span class="badge">'+esc(statusLabel(combat.status))+'</span><div class="mini">'+summary.rounds+' rodada(s)'+(duration?' · '+duration+' min':'')+(summary.defeated.length?' · '+summary.defeated.length+' derrotado(s)':'')+'</div></div><button type="button" class="secondary" data-toggle-history>Ver histórico</button></div><div data-history-body hidden><p><strong>Origem:</strong> '+esc(encounterName(ctx.session,combat.encounterId)||'Combate rápido')+'</p>'+(combat.outcome?'<p><strong>Resultado:</strong> '+esc(combat.outcome)+'</p>':'')+(combat.notes?'<p><strong>Notas:</strong> '+esc(combat.notes)+'</p>':'')+'<div class="combat-history-units">'+combat.combatants.map(c=>'<span class="badge">'+esc(c.name)+(c.kind!=='character'&&c.defeated?' · derrotado':'')+'</span>').join('')+'</div></div></article>'
}
function encounterOptions(session){return'<option value="">— Selecione —</option>'+(session.encounters||[]).map(e=>'<option value="'+esc(e.id)+'">'+esc(e.title)+' · '+esc(e.kind||'combat')+'</option>').join('')}
function managerHtml(ctx){
 const active=activeCombat(ctx.session),drafts=(ctx.session.combats||[]).filter(c=>c.status==='draft'),history=(ctx.session.combats||[]).filter(c=>c.status==='completed'||c.status==='cancelled').sort((a,b)=>String(b.endedAt||b.updatedAt).localeCompare(String(a.endedAt||a.updatedAt)));
 return'<section class="session-subsection session-combat-manager"><div class="combat-section-title"><div><span class="combat-kicker">⚔ CONTROLE DE COMBATE</span><h4>Combates da Sessão</h4></div></div>'+
 (active?activeCombatHtml(active,ctx):'<div class="combat-empty-state"><strong>Nenhum combate em andamento</strong><div class="combat-create-grid"><label>Combate rápido<input data-new-combat-title placeholder="Nome do combate"></label><button type="button" data-create-quick-combat>Criar combate rápido</button><label>Usar Encontro existente<select data-combat-encounter>'+encounterOptions(ctx.session)+'</select></label><button type="button" class="secondary" data-create-from-encounter>Criar a partir do Encontro</button></div></div>')+
 (drafts.length?'<div class="combat-history-section"><h4>Preparados</h4>'+drafts.map(c=>draftCombatHtml(c,ctx)).join('')+'</div>':'')+
 '<div class="combat-history-section"><h4>Histórico</h4>'+(history.length?history.map(c=>historyHtml(c,ctx)).join(''):'<div class="encounter-empty">Nenhum combate finalizado nesta Sessão.</div>')+'</div></section>'
}
function injectCard(card){
 if(!card.querySelector('[data-save-session-main]')||card.querySelector('.session-combat-manager'))return;const ctx=contextForCard(card);if(!ctx.session)return;card.insertAdjacentHTML('beforeend',managerHtml(ctx));bindManager(card,ctx)
}
function injectAll(){for(const card of document.querySelectorAll('[data-session-id]'))injectCard(card)}
function combatForNode(ctx,node){return(ctx.session.combats||[]).find(c=>c.id===node?.dataset.combat)||null}
async function ensureMonsters(node){if(!monsterIndex&&!monsterLoad)monsterLoad=loadEncounterMonsterIndex().then(rows=>(monsterIndex=rows));const status=node.querySelector('[data-combat-monster-status]');if(status)status.textContent='Carregando catálogo...';try{const rows=monsterIndex||await monsterLoad,list=node.querySelector('datalist');if(list)list.innerHTML=rows.map(r=>'<option value="'+esc(r.name)+'"></option>').join('');if(status)status.textContent=rows.length+' monstros disponíveis.';return rows}catch(error){if(status)status.textContent='Falha ao carregar monstros.';throw error}}
function appendCombatRecap(session,combat){
 const s=combatSummary(combat),parts=['Combate: '+s.title,'Rodadas: '+s.rounds];if(s.defeated.length)parts.push('Derrotados: '+s.defeated.map(x=>x.name).join(', '));if(s.outcome)parts.push('Resultado: '+s.outcome);const line=parts.join(' · ');session.summary=[String(session.summary||'').trim(),line].filter(Boolean).join('\n')
}
function addSessionCharacters(ctx,combat){
 for(const id of ctx.session.participantCharacterIds||[]){const character=ctx.characters.find(c=>c.id===id);if(character)addCombatant(combat,characterSnapshot(character))}
}
function saveCombatNotes(ctx,node,combat){updateCombat(ctx.session,combat.id,{notes:node.querySelector('[data-combat-notes]')?.value||combat.notes});persist(ctx,'Notas do combate salvas.')}
function bindCombatantNode(ctx,combat,node){
 const id=node.dataset.combatant,unit=combat.combatants.find(c=>c.id===id);if(!unit)return;
 node.querySelector('[data-combat-init]')?.addEventListener('change',e=>{const r=unit.groupInitiativeKey?setGroupInitiative(combat,id,e.target.value):setCombatantInitiative(combat,id,e.target.value);if(!r.ok)return announce(r.reason,false);persist(ctx,'Iniciativa atualizada.')});
 node.querySelector('[data-roll-init]')?.addEventListener('click',()=>{const value=rollD20({modifier:unit.initiativeModifier}).total;unit.groupInitiativeKey?setGroupInitiative(combat,id,value):setCombatantInitiative(combat,id,value);persist(ctx,'Iniciativa de '+unit.name+': '+value+'.')});
 node.querySelector('[data-roll-d20]')?.addEventListener('click',()=>{const r=rollD20({modifier:0});announce(unit.name+' · d20: '+r.natural+'.')});
 for(const button of node.querySelectorAll('[data-hp-delta]'))button.addEventListener('click',()=>{const delta=Number(button.dataset.hpDelta)||0,r=delta<0?applyCombatDamage(combat,id,Math.abs(delta),{automaticDefenses:false}):applyCombatHealing(combat,id,delta);if(!r.ok)return announce(r.reason,false);persist(ctx,unit.name+': PV atualizado.')});
 node.querySelector('[data-damage]')?.addEventListener('click',()=>{const r=applyCombatDamage(combat,id,node.querySelector('[data-hp-amount]')?.value,{type:node.querySelector('[data-hp-type]')?.value,automaticDefenses:unit.kind!=='character'});if(!r.ok)return announce(r.reason,false);persist(ctx,unit.name+': dano aplicado.')});
 node.querySelector('[data-heal]')?.addEventListener('click',()=>{const r=applyCombatHealing(combat,id,node.querySelector('[data-hp-amount]')?.value);if(!r.ok)return announce(r.reason,false);persist(ctx,unit.name+': cura aplicada.')});
 node.querySelector('[data-temp-hp]')?.addEventListener('change',e=>{setTemporaryHp(combat,id,e.target.value);persist(ctx,'PV temporários atualizados.')});
 node.querySelector('[data-toggle-concentration]')?.addEventListener('click',()=>{setConcentration(combat,id,!unit.concentration);persist(ctx,'Concentração atualizada.')});
 node.querySelector('[data-toggle-reaction]')?.addEventListener('click',()=>{setReactionAvailable(combat,id,!unit.reactionAvailable);persist(ctx,'Reação atualizada.')});
 node.querySelector('[data-add-condition]')?.addEventListener('click',()=>{const duration=node.querySelector('[data-condition-duration]')?.value||'manual',r=addCondition(combat,id,{name:node.querySelector('[data-condition-name]')?.value,duration,remainingRounds:duration==='rounds'?node.querySelector('[data-condition-rounds]')?.value:null,ownerTurnId:id});if(!r.ok)return announce(r.reason,false);persist(ctx,'Condição adicionada.')});
 for(const button of node.querySelectorAll('[data-remove-condition]'))button.addEventListener('click',()=>{const r=removeCondition(combat,id,button.dataset.removeCondition);if(!r.ok)return announce(r.reason,false);persist(ctx,'Condição removida.')});
 node.querySelector('[data-combatant-notes]')?.addEventListener('change',e=>{updateCombatant(combat,id,{notes:e.target.value});persist(ctx,'Nota do combatente salva.')});
 node.querySelector('[data-target-combatant]')?.addEventListener('click',()=>{const target=creatureTargetForResolution(unit);if(!target)return;localStorage.setItem(TARGET_KEY,JSON.stringify({campaignId:ctx.campaign?.id||null,sessionId:ctx.session.id,combatId:combat.id,encounterId:combat.encounterId||null,at:new Date().toISOString(),target}));announce(unit.name+' definido como alvo das Fichas neste navegador.')});
 node.querySelector('[data-remove-combatant]')?.addEventListener('click',()=>{if(combat.status==='active'&&!confirm('Remover este combatente do combate em andamento?'))return;const r=removeCombatant(combat,id);if(!r.ok)return announce(r.reason,false);persist(ctx,'Combatente removido.')});
 for(const button of node.querySelectorAll('[data-combat-action]'))button.addEventListener('click',()=>{const action=unit.actions.find(a=>a.id===button.dataset.combatAction);if(!action)return;const pieces=[unit.name+' · '+action.name];if(action.attackBonus!=null){const roll=rollD20({modifier:action.attackBonus});pieces.push('ataque '+roll.total+' (d20 '+roll.natural+')')}if(action.damage){const damage=rollDiceExpression(action.damage);if(damage)pieces.push('dano '+damage.total+' ['+damage.expression+']')}announce(pieces.join(' · '))})
}
function bindAddPanel(ctx,node,combat){
 node.querySelector('[data-add-combat-character-button]')?.addEventListener('click',()=>{const id=node.querySelector('[data-add-combat-character]')?.value,character=ctx.characters.find(c=>c.id===id);if(!character)return announce('Selecione um personagem da Sessão.',false);const r=addCombatant(combat,characterSnapshot(character));if(!r.ok)return announce(r.reason,false);persist(ctx,'Personagem adicionado ao combate.')});
 const search=node.querySelector('[data-combat-monster-search]');search?.addEventListener('focus',()=>ensureMonsters(node));search?.addEventListener('input',()=>ensureMonsters(node));
 node.querySelector('[data-add-combat-monster]')?.addEventListener('click',async()=>{try{const rows=await ensureMonsters(node),value=search?.value.trim(),row=rows.find(r=>r.name.toLocaleLowerCase('pt-BR')===value?.toLocaleLowerCase('pt-BR'));if(!row)return announce('Selecione um monstro existente na Biblioteca.',false);const detail=await loadEncounterMonsterDetail(row),quantity=node.querySelector('[data-monster-quantity]')?.value||1,group=node.querySelector('[data-group-initiative]')?.checked===true,data={...detail,kind:'monster',monsterId:detail.id,currentHp:detail.maxHp,actions:monsterActions(detail)};const r=addCombatants(combat,data,quantity,{groupInitiative:group});if(!r.ok)return announce('Não foi possível adicionar o monstro.',false);persist(ctx,detail.name+' adicionado ao combate.')}catch(error){announce(error.message||'Não foi possível carregar o monstro.',false)}});
 node.querySelector('[data-add-combat-npc]')?.addEventListener('click',()=>{const name=node.querySelector('[data-combat-npc-name]')?.value.trim();if(!name)return announce('Informe o nome do NPC.',false);const r=addCombatant(combat,{kind:'npc',name,ac:node.querySelector('[data-combat-npc-ac]')?.value,maxHp:node.querySelector('[data-combat-npc-hp]')?.value,currentHp:node.querySelector('[data-combat-npc-hp]')?.value,initiativeModifier:node.querySelector('[data-combat-npc-init]')?.value,source:'NPC personalizado'});if(!r.ok)return announce(r.reason,false);persist(ctx,'NPC adicionado ao combate.')})
}
function bindCombatNode(ctx,node,combat){
 for(const unitNode of node.querySelectorAll('[data-combatant]'))bindCombatantNode(ctx,combat,unitNode);bindAddPanel(ctx,node,combat);
 node.querySelector('[data-save-combat-notes]')?.addEventListener('click',()=>saveCombatNotes(ctx,node,combat));
 node.querySelector('[data-start-combat]')?.addEventListener('click',()=>{hydrateCombatCharacters(ctx,combat);const r=startCombat(ctx.session,combat.id);if(!r.ok)return announce(r.reason,false);persist(ctx,'Combate iniciado.')});
 node.querySelector('[data-remove-combat]')?.addEventListener('click',()=>{if(!confirm('Excluir este combate preparado?'))return;const r=removeCombat(ctx.session,combat.id);if(!r.ok)return announce(r.reason,false);persist(ctx,'Combate excluído.')});
 node.querySelector('[data-open-draft]')?.addEventListener('click',()=>{const body=node.querySelector('[data-draft-body]');if(body)body.hidden=!body.hidden});
 node.querySelector('[data-toggle-history]')?.addEventListener('click',()=>{const body=node.querySelector('[data-history-body]');if(body)body.hidden=!body.hidden});
 if(combat.status!=='active')return;
 node.querySelector('[data-next-combat-turn]')?.addEventListener('click',()=>{const r=nextCombatTurn(combat);if(!r.ok)return announce(r.reason,false);persist(ctx,'Turno: '+r.combatant.name+' · rodada '+r.round+'.')});
 node.querySelector('[data-prev-combat-turn]')?.addEventListener('click',()=>{const r=previousCombatTurn(combat);if(!r.ok)return announce(r.reason,false);persist(ctx,'Turno: '+r.combatant.name+' · rodada '+r.round+'.')});
 node.querySelector('[data-roll-all-enemies]')?.addEventListener('click',()=>{const handled=new Set;for(const c of combat.combatants.filter(c=>c.kind!=='character')){if(c.groupInitiativeKey&&handled.has(c.groupInitiativeKey))continue;const value=rollD20({modifier:c.initiativeModifier}).total;c.groupInitiativeKey?(setGroupInitiative(combat,c.id,value),handled.add(c.groupInitiativeKey)):setCombatantInitiative(combat,c.id,value)}persist(ctx,'Iniciativas dos inimigos roladas.')});
 node.querySelector('[data-refresh-characters]')?.addEventListener('click',()=>{ctx.characters=read();hydrateCombatCharacters(ctx,combat);persist(ctx,'Personagens atualizados a partir da Ficha Digital.')});
 node.querySelector('[data-open-finish]')?.addEventListener('click',()=>{const panel=node.querySelector('[data-finish-panel]');if(panel)panel.hidden=false});
 node.querySelector('[data-close-finish]')?.addEventListener('click',()=>{const panel=node.querySelector('[data-finish-panel]');if(panel)panel.hidden=true});
 node.querySelector('[data-confirm-finish]')?.addEventListener('click',()=>{const outcome=node.querySelector('[data-combat-outcome]')?.value||'',history=node.querySelector('[data-finish-history]')?.checked!==false,sync=node.querySelector('[data-finish-sync]')?.checked!==false;updateCombat(ctx.session,combat.id,{notes:node.querySelector('[data-combat-notes]')?.value||combat.notes,outcome});if(history)appendCombatRecap(ctx.session,combat);const synced=sync?syncCharactersToSheets(ctx,combat):[];const r=finishCombat(ctx.session,combat.id,{outcome,notes:combat.notes});if(!r.ok)return announce(r.reason,false);persist(ctx,'Combate finalizado'+(synced.length?' · '+synced.length+' ficha(s) sincronizada(s).':'.'))})
}
function bindManager(card,ctx){
 const manager=card.querySelector('.session-combat-manager');if(!manager)return;
 manager.querySelector('[data-create-quick-combat]')?.addEventListener('click',()=>{const title=manager.querySelector('[data-new-combat-title]')?.value.trim(),r=createCombat(ctx.session,{title:title||'Combate rápido'});if(!r.ok)return announce(r.reason,false);addSessionCharacters(ctx,r.combat);persist(ctx,'Combate rápido preparado.')});
 manager.querySelector('[data-create-from-encounter]')?.addEventListener('click',()=>{const id=manager.querySelector('[data-combat-encounter]')?.value;if(!id)return announce('Selecione um Encontro.',false);const r=createCombatFromEncounter(ctx.session,id);if(!r.ok)return announce(r.reason,false);hydrateCombatCharacters(ctx,r.combat);persist(ctx,'Combate preparado a partir do Encontro.')});
 for(const node of manager.querySelectorAll('[data-combat]')){const combat=combatForNode(ctx,node);if(combat)bindCombatNode(ctx,node,combat)}
}
function createFromEncounterEvent(event){
 const detail=event.detail||{};for(const card of document.querySelectorAll('[data-session-id]')){if(card.dataset.sessionId!==detail.sessionId)continue;const ctx=contextForCard(card),r=createCombatFromEncounter(ctx.session,detail.encounterId);if(!r.ok)return announce(r.reason,false);hydrateCombatCharacters(ctx,r.combat);persist(ctx,'Combate preparado a partir do Encontro.');break}
}
function init(){injectAll();const root=document.getElementById('sessions-list');if(root)new MutationObserver(()=>queueMicrotask(injectAll)).observe(root,{childList:true,subtree:true});window.addEventListener('hub-rpg:create-combat-from-encounter',createFromEncounterEvent)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
