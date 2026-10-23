import{readAdventures}from'./adventure-state.js?v=20261022-chronicles1';
import{addSessionScene}from'./campaign-state.js?v=20261022-chronicles1';
import{read}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,updateCampaignSession,readStandaloneSessions,writeStandaloneSessions,updateStandaloneSession}from'./campaign-state.js?v=20261022-chronicles1';
import{createEncounter,updateEncounter,removeEncounter,addCharacterCombatant,addCreatureCombatant,removeCombatant}from'./encounter-state.js?v=20260924-session-planning1';
import{loadEncounterMonsterIndex,loadEncounterMonsterDetail}from'./monster-catalog.js?v=20260902-encounters1';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KIND_LABEL={combat:'Combate',social:'Social',exploration:'Exploração',trap:'Armadilha',puzzle:'Puzzle',other:'Outro'};
let monsterIndex=null,monsterLoad=null;

function announce(message,ok=true){const box=document.getElementById('session-feedback');if(!box)return;box.hidden=false;box.className='status '+(ok?'ok':'warning');box.textContent=message;clearTimeout(announce.timer);announce.timer=setTimeout(()=>box.hidden=true,3200)}
function contextForCard(card){
 const id=card.dataset.sessionId,source=card.dataset.sessionSource,campaigns=readCampaigns(),standalone=readStandaloneSessions(),characters=read();
 if(source==='campaign'){const campaign=campaigns.find(c=>(c.sessions||[]).some(s=>s.id===id)),session=campaign?.sessions.find(s=>s.id===id)||null;return{source,campaign,campaigns,standalone,characters,session,adventure:readAdventures().find(a=>a.id===session?.adventureId)||null}}
 return{source,campaign:null,campaigns,standalone,characters,session:standalone.find(s=>s.id===id)||null,adventure:null}
}
function persist(ctx,message='Encontro salvo.'){
 if(!ctx?.session)return false;
 if(ctx.source==='campaign'){const result=updateCampaignSession(ctx.campaigns,ctx.campaign.id,ctx.session.id,{encounters:ctx.session.encounters,activeEncounterId:ctx.session.activeEncounterId,scenes:ctx.session.scenes});if(!result.ok){announce(result.reason,false);return false}writeCampaigns(result.list)}
 else{const result=updateStandaloneSession(ctx.standalone,ctx.session.id,{encounters:ctx.session.encounters,activeEncounterId:ctx.session.activeEncounterId});if(!result.ok){announce(result.reason,false);return false}writeStandaloneSessions(result.list)}
 window.dispatchEvent(new CustomEvent('hub-rpg:sessions-local-updated'));announce(message,true);return true
}
function sceneOptions(session,current='',adventure=null){
 const rows=session.scenes||[],linked=new Set(rows.map(s=>s.adventureSceneId).filter(Boolean));
 const base=rows.map(scene=>`<option value="${esc(scene.id)}" ${scene.id===current?'selected':''}>${esc(scene.title)}</option>`).join('');
 const extras=(adventure?.scenes||[]).filter(scene=>!linked.has(scene.id)).map(scene=>`<option value="adventure:${esc(scene.id)}">Aventura · ${esc(scene.title)}</option>`).join('');
 return'<option value="">— Sem cena —</option>'+base+extras;
}
function resolveAdventureScene(ctx,value){
 if(!String(value||'').startsWith('adventure:'))return value||null;
 const sceneId=value.slice(10),scene=ctx.adventure?.scenes.find(x=>x.id===sceneId);
 if(!scene)return null;
 const existing=ctx.session.scenes?.find(x=>x.adventureSceneId===sceneId);
 if(existing)return existing.id;
 const result=addSessionScene(ctx.session,{title:scene.title,adventureSceneId:scene.id,locationId:scene.locationId,npcIds:scene.npcIds,missionIds:scene.missionIds,order:(ctx.session.scenes?.length||0)+1});
 return result.ok?result.scene.id:null
}
const adventureNpcOptions=ctx=>'<option value="">— NPC da Aventura —</option>'+(ctx.campaign?.npcs||[]).filter(n=>ctx.adventure?.npcIds?.includes(n.id)).map(n=>`<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('');
const adventureMonsterOptions=ctx=>'<option value="">— Monstro da Aventura —</option>'+(ctx.adventure?.monsters||[]).map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
function kindOptions(current='combat'){return Object.entries(KIND_LABEL).map(([value,label])=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`).join('')}
function participantOptions(ctx,encounter){const existing=new Set((encounter.combatants||[]).filter(c=>c.kind==='character').map(c=>c.characterId));return'<option value="">— Selecione —</option>'+((ctx.session.participantCharacterIds||[]).filter(id=>!existing.has(id)).map(id=>{const c=ctx.characters.find(x=>x.id===id);return`<option value="${esc(id)}">${esc(c?.name||id)}</option>`}).join(''))}
function blueprintRow(c){const meta=c.kind==='character'?'Personagem':c.kind==='monster'?'Monstro':'NPC';const details=c.kind==='character'?'Dados de combate vêm da Ficha Digital':[c.ac?'CA '+c.ac:'',c.maxHp?'PV '+c.maxHp:'',c.cr?'CR '+c.cr:''].filter(Boolean).join(' · ');return`<div class="encounter-blueprint-row" data-encounter-combatant="${esc(c.id)}"><div><strong>${esc(c.name)}</strong> <span class="badge">${meta}</span><div class="encounter-source">${esc(details||c.source||'')}</div></div><button type="button" class="danger" data-remove-encounter-combatant>Remover</button></div>`}
function addToolsHtml(encounter,ctx){
 const listId='encounter-monsters-'+encounter.id;
 return`<div class="encounter-subcard"><h4>Participantes previstos</h4>
 <div class="monster-picker"><label>Personagem da Sessão<select data-add-encounter-character>${participantOptions(ctx,encounter)}</select></label><button type="button" data-add-encounter-character-button>Adicionar</button></div>
 <div class="monster-picker" style="margin-top:8px"><label>Monstro da Biblioteca<input type="search" data-encounter-monster-search list="${esc(listId)}" placeholder="Digite o nome do monstro"><datalist id="${esc(listId)}"></datalist></label><button type="button" data-add-encounter-monster>Adicionar</button></div>
 <div class="form-grid two"><label>NPC da Aventura<select data-encounter-adventure-npc>${adventureNpcOptions(ctx)}</select></label><button type="button" data-add-adventure-npc>Adicionar NPC</button>
 <label>Monstro da Aventura<select data-encounter-adventure-monster>${adventureMonsterOptions(ctx)}</select></label><button type="button" data-add-adventure-monster>Adicionar monstro</button></div><p class="mini" data-encounter-monster-status></p>
 <div class="npc-grid" style="margin-top:8px"><label>NPC personalizado<input data-encounter-npc-name placeholder="Nome"></label><label>CA<input data-encounter-npc-ac type="number" min="0" value="10"></label><label>PV<input data-encounter-npc-hp type="number" min="1" value="10"></label><label>Mod. iniciativa<input data-encounter-npc-init type="number" value="0"></label></div>
 <button type="button" class="secondary" data-add-encounter-npc style="margin-top:8px">Adicionar NPC</button></div>`
}
function encounterCard(encounter,ctx){
 const legacy=encounter.status!=='planned';
 return`<article class="encounter-card" data-encounter="${esc(encounter.id)}"><div class="encounter-head"><div><h3>${esc(encounter.title)}</h3><span class="badge">${esc(KIND_LABEL[encounter.kind]||'Encontro')}</span>${legacy?`<span class="badge">Estado legado: ${esc(encounter.status)}</span>`:''}</div><div class="encounter-actions"><button type="button" data-create-combat-from-encounter>Preparar combate</button><button type="button" class="danger" data-remove-encounter>Excluir</button></div></div>
 <div class="form-grid two" style="margin-top:8px"><label>Nome<input data-encounter-title value="${esc(encounter.title)}"></label><label>Tipo<select data-encounter-kind>${kindOptions(encounter.kind)}</select></label><label class="wide">Cena da Aventura / Sessão<select data-encounter-scene>${sceneOptions(ctx.session,encounter.sessionSceneId,ctx.adventure)}</select></label></div>
 <div class="form-grid two"><label>Status<select data-encounter-resolution-status>
 ${[['pending','Pendente'],['resolved','Resolvido'],['failed','Fracassado'],['escaped','Fugiram'],['not-found','Não encontrado'],['avoided','Evitado']].map(([v,label])=>`<option value="${v}" ${encounter.resolutionStatus===v?'selected':''}>${label}</option>`).join('')}</select></label>
 <label>Como foi resolvido<select data-encounter-resolution-method>${[['combat','Combate'],['social','Social'],['other','Outro']].map(([v,label])=>`<option value="${v}" ${encounter.resolutionMethod===v?'selected':''}>${label}</option>`).join('')}</select></label></div>
 <label style="margin-top:8px">Contexto / preparação<textarea data-encounter-summary>${esc(encounter.summary||'')}</textarea></label>
 <div class="encounter-subcard"><h4>Participantes</h4><div class="encounter-blueprint-list">${encounter.combatants?.length?encounter.combatants.map(blueprintRow).join(''):'<div class="encounter-empty">Nenhum participante previsto.</div>'}</div></div>
 ${addToolsHtml(encounter,ctx)}
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-encounter>Salvar encontro</button></div></article>`
}
function managerHtml(ctx){const rows=[...(ctx.session.encounters||[])].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));return`<section id="encontros" class="session-subsection encounter-shell session-encounter-manager"><div class="encounter-head"><div><h4>Encontros</h4></div></div><div class="form-grid two" style="margin-top:8px"><label>Nome do encontro<input data-new-encounter-title placeholder="Novo encontro"></label><label>Tipo<select data-new-encounter-kind>${kindOptions('combat')}</select></label><label class="wide">Cena da Sessão<select data-new-encounter-scene>${sceneOptions(ctx.session,'',ctx.adventure)}</select></label></div><label class="campaign-disclosure-toggle"><input type="checkbox" data-encounter-auto-combat> Criar combate automaticamente com os jogadores</label><div class="row-actions" style="margin-top:8px"><button type="button" data-create-encounter>Criar encontro</button></div><div class="encounter-list">${rows.length?rows.map(e=>encounterCard(e,ctx)).join(''):'<div class="encounter-empty">Nenhum encontro nesta Sessão.</div>'}</div></section>`}
function injectSceneLinks(card,ctx){for(const node of card.querySelectorAll('[data-session-scene]')){node.querySelector('.scene-encounter-links')?.remove();const id=node.dataset.sessionScene,rows=(ctx.session.encounters||[]).filter(e=>e.sessionSceneId===id);if(!rows.length)continue;const box=document.createElement('div');box.className='story-status scene-encounter-links';box.style.marginTop='8px';box.innerHTML='<span class="mini">Encontros:</span> '+rows.map(e=>`<span class="badge">${esc(e.title)}</span>`).join('');const actions=node.querySelector('.row-actions');if(actions)node.insertBefore(box,actions);else node.appendChild(box)}}
function injectCard(card){if(!card.querySelector('[data-save-session-main]')||card.querySelector('.session-encounter-manager'))return;const ctx=contextForCard(card);if(!ctx.session)return;for(const section of card.querySelectorAll('.session-subsection'))if(section.querySelector('h4')?.textContent.trim()==='Encontros')section.remove();card.insertAdjacentHTML('beforeend',managerHtml(ctx));injectSceneLinks(card,ctx);bindManager(card,ctx)}
function injectAll(){for(const card of document.querySelectorAll('[data-session-id]'))injectCard(card)}
function nodeData(node,ctx){return{title:node.querySelector('[data-encounter-title]')?.value||'',kind:node.querySelector('[data-encounter-kind]')?.value||'combat',resolutionStatus:node.querySelector('[data-encounter-resolution-status]')?.value||'pending',resolutionMethod:node.querySelector('[data-encounter-resolution-method]')?.value||'other',sessionSceneId:resolveAdventureScene(ctx,node.querySelector('[data-encounter-scene]')?.value||''),summary:node.querySelector('[data-encounter-summary]')?.value||''}}
function saveNode(ctx,node,message='Encontro salvo.'){const r=updateEncounter(ctx.session,node.dataset.encounter,nodeData(node,ctx));if(!r.ok)return announce(r.reason,false);persist(ctx,message)}
async function ensureMonsters(node){if(!monsterIndex&&!monsterLoad)monsterLoad=loadEncounterMonsterIndex().then(rows=>(monsterIndex=rows));const status=node.querySelector('[data-encounter-monster-status]');if(status)status.textContent='Carregando catálogo...';try{const rows=monsterIndex||await monsterLoad,list=node.querySelector('datalist');if(list)list.innerHTML=rows.map(r=>`<option value="${esc(r.name)}"></option>`).join('');if(status)status.textContent=rows.length+' monstros disponíveis.';return rows}catch(error){if(status)status.textContent='Falha ao carregar monstros.';throw error}}
function findEncounter(ctx,id){return ctx.session.encounters.find(e=>e.id===id)||null}
function bindManager(card,ctx){
 const manager=card.querySelector('.session-encounter-manager');if(!manager)return;
 manager.querySelector('[data-create-encounter]')?.addEventListener('click',()=>{const r=createEncounter(ctx.session,{title:manager.querySelector('[data-new-encounter-title]')?.value.trim()||undefined,kind:manager.querySelector('[data-new-encounter-kind]')?.value||'combat',sessionSceneId:resolveAdventureScene(ctx,manager.querySelector('[data-new-encounter-scene]')?.value||'')});if(!r.ok)return announce(r.reason,false);const auto=manager.querySelector('[data-encounter-auto-combat]')?.checked===true;persist(ctx,'Encontro criado.');if(auto)window.dispatchEvent(new CustomEvent('hub-rpg:create-combat-from-encounter',{detail:{sessionId:ctx.session.id,encounterId:r.encounter?.id||r.entity?.id||ctx.session.encounters.at(-1)?.id}}))});
 for(const node of manager.querySelectorAll('[data-encounter]')){
  const encounter=findEncounter(ctx,node.dataset.encounter);if(!encounter)continue;
  node.querySelector('[data-save-encounter]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveNode(ctx,node)});
  node.querySelector('[data-create-combat-from-encounter]')?.addEventListener('click',()=>{const r=updateEncounter(ctx.session,encounter.id,nodeData(node));if(!r.ok)return announce(r.reason,false);persist(ctx,'Encontro salvo.');window.dispatchEvent(new CustomEvent('hub-rpg:create-combat-from-encounter',{detail:{sessionId:ctx.session.id,encounterId:encounter.id}}))});
  node.querySelector('[data-remove-encounter]')?.addEventListener('click',()=>{if(!confirm('Excluir este encontro? O histórico de combates já realizados não será apagado.'))return;const r=removeEncounter(ctx.session,encounter.id);if(!r.ok)return announce(r.reason,false);persist(ctx,'Encontro excluído.')});
  node.querySelector('[data-add-encounter-character-button]')?.addEventListener('click',()=>{const characterId=node.querySelector('[data-add-encounter-character]')?.value,character=ctx.characters.find(c=>c.id===characterId),r=addCharacterCombatant(encounter,{characterId,name:character?.name||characterId});if(!r.ok)return announce(r.reason,false);persist(ctx,'Personagem adicionado ao Encontro.')});
  const search=node.querySelector('[data-encounter-monster-search]');search?.addEventListener('focus',()=>ensureMonsters(node));search?.addEventListener('input',()=>ensureMonsters(node));
  node.querySelector('[data-add-encounter-monster]')?.addEventListener('click',async()=>{try{const rows=await ensureMonsters(node),value=search?.value.trim(),row=rows.find(r=>r.name.toLocaleLowerCase('pt-BR')===value?.toLocaleLowerCase('pt-BR'));if(!row)return announce('Selecione um monstro existente na Biblioteca.',false);const detail=await loadEncounterMonsterDetail(row),r=addCreatureCombatant(encounter,{...detail,kind:'monster',monsterId:detail.id,currentHp:detail.maxHp});if(!r.ok)return announce(r.reason,false);persist(ctx,detail.name+' adicionado ao Encontro.')}catch(error){announce(error.message||'Não foi possível carregar o monstro.',false)}});
  node.querySelector('[data-add-encounter-npc]')?.addEventListener('click',()=>{const name=node.querySelector('[data-encounter-npc-name]')?.value.trim();if(!name)return announce('Informe o nome do NPC.',false);const r=addCreatureCombatant(encounter,{kind:'npc',name,ac:node.querySelector('[data-encounter-npc-ac]')?.value,maxHp:node.querySelector('[data-encounter-npc-hp]')?.value,initiativeModifier:node.querySelector('[data-encounter-npc-init]')?.value,source:'NPC personalizado'});if(!r.ok)return announce(r.reason,false);persist(ctx,'NPC adicionado ao Encontro.')});
  node.querySelector('[data-add-adventure-npc]')?.addEventListener('click',()=>{const id=node.querySelector('[data-encounter-adventure-npc]')?.value,npc=ctx.campaign?.npcs?.find(n=>n.id===id);if(!npc)return announce('Selecione um NPC da Aventura.',false);const r=addCreatureCombatant(encounter,{kind:'npc',name:npc.name,source:'NPC da Aventura',maxHp:10,ac:10});if(!r.ok)return announce(r.reason,false);persist(ctx,'NPC adicionado ao Encontro.')});
  node.querySelector('[data-add-adventure-monster]')?.addEventListener('click',()=>{const id=node.querySelector('[data-encounter-adventure-monster]')?.value,monster=ctx.adventure?.monsters.find(m=>m.id===id);if(!monster)return announce('Selecione um monstro da Aventura.',false);const r=addCreatureCombatant(encounter,{...monster,kind:'monster',monsterId:monster.monsterId||monster.id,currentHp:monster.maxHp});if(!r.ok)return announce(r.reason,false);persist(ctx,'Monstro adicionado ao Encontro.')});
  for(const button of node.querySelectorAll('[data-remove-encounter-combatant]'))button.addEventListener('click',()=>{const unit=button.closest('[data-encounter-combatant]'),r=removeCombatant(encounter,unit?.dataset.encounterCombatant);if(!r.ok)return announce(r.reason,false);persist(ctx,'Participante removido do Encontro.')})
 }
}
function init(){injectAll();const root=document.getElementById('sessions-list');if(!root)return;new MutationObserver(()=>queueMicrotask(injectAll)).observe(root,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
