// Organização compartilhada entre Aventuras e Sessões. O registro permanece sempre na Aventura.

function escPlan(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}

function planRows(value){return Array.isArray(value)?value:[]}

export function renderDevelopmentEditor(a,c){
 const sessions=planRows(c?.sessions).filter(s=>s.adventureId===a.id);
 const sessionOptions=(current='')=>'<option value="">— Sem sessão —</option>'+sessions.map(s=>`<option value="${escPlan(s.id)}" ${s.id===current?'selected':''}>${escPlan(s.title)}</option>`).join('');
 const sceneOptions=(current='')=>'<option value="">— Sem cena —</option>'+planRows(a.scenes).map(s=>`<option value="${escPlan(s.id)}" ${s.id===current?'selected':''}>${escPlan(s.title)}</option>`).join('');
 const records=planRows(a.developments).map(d=>`<article class="story-card" data-development-row="${escPlan(d.id)}">
 <p class="mini">${escPlan(sessions.find(s=>s.id===d.sessionId)?.title||'Registro da aventura')}</p>
 <label>Cena<select data-development-field="sceneId">${sceneOptions(d.sceneId)}</select></label>
 <label>Sessão<select data-development-field="sessionId">${sessionOptions(d.sessionId)}</select></label>
 <label>Descrição<textarea data-development-field="description" rows="3">${escPlan(d.description)}</textarea></label>
 <div class="row-actions"><button type="button" data-development-save>Salvar</button><button type="button" class="danger" data-remove-entity="${escPlan(d.id)}" data-key="developments">Excluir</button></div></article>`).join('');
 return `<section id="desenrolares" class="card campaign-editor-card">
 <h2>Desenrolares</h2><p class="mini">Acontecimentos que efetivamente ocorreram. Registros de Sessões aparecem aqui e como ramificações das Cenas na Linha do Tempo.</p>
 <div class="story-list">${records||'<p class="story-empty">Nenhum desenrolar registrado.</p>'}</div>
 <div class="explore-create-form">
 <label>Sessão de origem<select id="new-development-session">${sessionOptions()}</select></label>
 <label>Cena relacionada<select id="new-development-scene">${sceneOptions()}</select></label>
 <label>Descrição do acontecimento<textarea id="new-development-description" rows="3" placeholder="O que aconteceu na aventura?"></textarea></label>
 <button id="add-development" type="button">Criar desenrolar</button></div></section>`;
}

export function renderDevelopmentOverview(a,c){
 const sessions=planRows(c?.sessions);
 const cards=planRows(a.developments).map(d=>{
   const scene=planRows(a.scenes).find(x=>x.id===d.sceneId);
   const session=sessions.find(x=>x.id===d.sessionId);
   return `<article class="adventure-read-card"><div class="adventure-read-card-head"><h3>${escPlan(scene?.title||'Acontecimento')}</h3><span class="adventure-read-meta">${escPlan(session?.title||'Registro da Aventura')}</span></div><p>${escPlan(d.description)}</p></article>`;
 }).join('');
 return `<section class="adventure-read-section adventure-panel-card" id="overview-desenrolares"><header class="adventure-read-section-head"><h2>Desenrolares</h2><span class="adventure-read-count">${planRows(a.developments).length}</span></header><div class="adventure-read-grid">${cards||'<p class="adventure-read-empty">Nenhum acontecimento registrado.</p>'}</div></section>`;
}

export function renderSessionAdventureOverview(s,a){
 const maps=planRows(a?.exploration?.levels).filter(x=>planRows(s.mapIds).includes(x.id));
 const scenes=planRows(s.scenes).map(x=>({name:planRows(a?.scenes).find(r=>r.id===x.adventureSceneId)?.title||x.title,linked:!!x.adventureSceneId}));
 const objectives=planRows(a?.missions).filter(x=>planRows(s.objectiveIds).includes(x.id));
 const developments=planRows(a?.developments).filter(x=>x.sessionId===s.id);
 const cluster=(name,items,selector)=>`<div class="session-plan-overview-group"><h3>${name} <span class="mini">(${items.length})</span></h3><div class="story-list">${items.length?items.map(selector).join(''):'<p class="mini">Nenhum item selecionado.</p>'}</div></div>`;
 return `<section id="session-adventure-overview" class="card campaign-editor-card"><h2>Elementos da Sessão</h2><p class="mini">Mapas, Cenas e Objetivos são referências à Aventura. Os Desenrolares registram o resultado das decisões dos jogadores.</p>
 <div class="session-plan-overview-grid">
 ${cluster('Mapas',maps,x=>`<article class="campaign-reference-row"><strong>${escPlan(x.name)}</strong><span class="mini">${escPlan(x.type||'Mapa')}</span></article>`)}
 ${cluster('Cenas',scenes,x=>`<article class="campaign-reference-row"><strong>${escPlan(x.name)}</strong></article>`)}
 ${cluster('Objetivos',objectives,x=>`<article class="campaign-reference-row"><strong>${escPlan(x.title)}</strong>${x.description?`<p class="mini">${escPlan(x.description)}</p>`:''}</article>`)}
 ${cluster('Desenrolares',developments,x=>`<article class="campaign-reference-row"><p>${escPlan(x.description)}</p><span class="mini">${escPlan(planRows(a?.scenes).find(scene=>scene.id===x.sceneId)?.title||'Sem cena específica')}</span></article>`)}
 </div></section>`;
}

export function renderSessionAdventureCreation(s,a){
 const maps=planRows(a?.exploration?.levels),objectives=planRows(a?.missions),sceneIds=new Set(planRows(s.scenes).map(x=>x.adventureSceneId).filter(Boolean));
 const scenes=planRows(a?.scenes).filter(x=>sceneIds.has(x.id));
 const choice=(rows,name)=>`<option value="">— Selecione ${name} —</option>`+rows.map(x=>`<option value="${escPlan(x.id)}">${escPlan(x.title||x.name)}</option>`).join('');
 const mapAttached=maps.filter(x=>planRows(s.mapIds).includes(x.id)),objectiveAttached=objectives.filter(x=>planRows(s.objectiveIds).includes(x.id));
 const attached=(rows,kind)=>`<div class="story-list">${rows.length?rows.map(x=>`<div class="campaign-reference-row"><strong>${escPlan(x.title||x.name)}</strong><button type="button" class="secondary" data-session-remove-ref="${kind}" data-session-remove-id="${escPlan(x.id)}">Remover</button></div>`).join(''):'<p class="mini">Nenhum item adicionado.</p>'}</div>`;
 const developments=planRows(a?.developments).filter(x=>x.sessionId===s.id);
 return `<section id="session-adventure-creation" class="card campaign-editor-card"><h2>Criação da Sessão</h2>
 ${a?`<p class="mini">Adicione os elementos da Aventura que serão usados nesta Sessão.</p>
 <div class="session-plan-creation-grid">
 <div><h3>Mapas</h3><div class="form-grid"><label>Mapa da Aventura<select data-session-ref-picker="mapIds">${choice(maps,'um mapa')}</select></label><button type="button" data-session-add-ref="mapIds">Adicionar mapa</button></div>${attached(mapAttached,'mapIds')}</div>
 <div><h3>Objetivos</h3><div class="form-grid"><label>Objetivo da Aventura<select data-session-ref-picker="objectiveIds">${choice(objectives,'um objetivo')}</select></label><button type="button" data-session-add-ref="objectiveIds">Adicionar objetivo</button></div>${attached(objectiveAttached,'objectiveIds')}</div>
 </div>
 <p class="mini">Para adicionar Cenas da Aventura, use a seção Cenas logo abaixo.</p>
 <div class="session-development-creation"><h3>Criar desenrolar</h3>
 <label>Cena onde aconteceu (opcional)<select data-session-development-scene>${choice(scenes,'uma cena')}<option value="">— Sem cena específica —</option></select></label>
 <label>Descrição do que os jogadores fizeram<textarea data-session-development-description rows="4" placeholder="Descreva os acontecimentos da Sessão."></textarea></label>
 <button type="button" data-session-create-development>Registrar desenrolar</button>
 <div class="story-list">${developments.length?developments.map(d=>`<article class="story-card"><p>${escPlan(d.description)}</p><p class="mini">${escPlan(scenes.find(x=>x.id===d.sceneId)?.title||'Sem cena específica')}</p><button type="button" class="secondary" data-session-delete-development="${escPlan(d.id)}">Excluir desenrolar</button></article>`).join(''):'<p class="mini">Nenhum desenrolar registrado nesta Sessão.</p>'}</div>
 </div>`:'<p class="mini">Vincule esta Sessão a uma Campanha e uma Aventura para adicionar Mapas, Cenas, Objetivos e Desenrolares.</p>'}
 </section>`;
}
