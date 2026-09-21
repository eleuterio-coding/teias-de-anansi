
import{state,arr,esc,num,fold}from'./state.js';
import{initSubclassMechanicsData}from'./subclass-mechanics-data.js?v=20260921-context-help2';

let initialized=false,scheduled=false,activeSelect=null,browserKind='',browserRows=[],browserCurrent=null,browserCompare=new Set();
const BROWSABLE=new Set(['class','subclass','background','species','feat','armor','weapon']);
const byId=id=>document.getElementById(id);
const text=v=>String(v??'').trim();
const level=()=>Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));
const values=v=>arr(v).map(x=>text(typeof x==='object'?(x.name??x.nome??x.label??x.id??''):x)).filter(Boolean);
const join=v=>values(v).join(', ')||'—';
const paragraph=v=>{const s=text(v);if(!s)return'';const p=s.split(/\n\s*\n|\n/).find(Boolean)||s;return p.length>360?p.slice(0,357)+'…':p};
const kv=(label,value)=>value&&value!=='—'?'<div class="context-kv"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>':'';
const kvs=rows=>rows.map(row=>kv(row[0],row[1])).join('');
const pills=rows=>rows.length?'<div class="context-pills">'+rows.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'';
function featuresHtml(features,all=false){
 const l=level(),rows=arr(features).filter(f=>all||num(f.level)<=l);
 if(!rows.length)return'<p class="muted">Nenhuma característica detalhada disponível nesta fonte.</p>';
 return rows.map(f=>'<details class="context-feature" '+(!all&&num(f.level)===l?'open':'')+'><summary>'+(f.level?'Nível '+num(f.level)+' · ':'')+esc(f.name||f.nome||'Característica')+'</summary>'+((f.text||f.descricao)?'<p>'+esc(f.text||f.descricao)+'</p>':'')+'</details>').join('');
}
function selectedSpecies(){return state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null}
function currentOriginFeat(bg){
 const id=state.c?.choices?.background?.originFeat,chosen=state.catalogs.feats.find(f=>f.id===id);
 return chosen?.name||bg?._houseOriginalFeat?.name||bg?.feat?.name||'';
}
function equipmentSummary(bg){
 const opts=arr(bg?.equipmentOptions);
 if(opts.length)return opts.map((o,i)=>text(o?.nome||o?.name||o?.descricao||o?.description)||('Opção '+(i+1))).join(' · ');
 return text(bg?.equipmentText);
}
function describe(item,kind){
 if(!item)return null;
 const source=text(item.source||item.fonte||item.fonte_id),l=level();
 if(kind==='class'){
  const now=arr(item.features).filter(f=>num(f.level)===l),skills=arr(item.skillChoices).flatMap(x=>arr(x.options));
  return{title:item.name,meta:[source,'Nível '+l].filter(Boolean).join(' · '),
   summary:kvs([['Dado de Vida',item.hitDie?'d'+item.hitDie:''],['Salvaguardas',join(item.savingThrows)],['Perícias disponíveis',join(skills)],['Proficiências',join(item.proficiencies)],['Atributo de conjuração',text(item.spellAbility)]])+'<h5>Você recebe neste nível</h5>'+featuresHtml(now.length?now:arr(item.features).filter(f=>num(f.level)<=l)),
   rules:'<h5>Progressão da Classe</h5>'+featuresHtml(item.features,true)};
 }
 if(kind==='subclass'){
  const desc=text(item.description||item.mechanics?.summary),features=arr(item.features||item.mechanics?.progression).map(f=>({level:f.level??f.nivel,name:f.name??f.nome,text:f.text??f.descricao}));
  return{title:item.name,meta:[source,'Nível atual '+l].filter(Boolean).join(' · '),
   summary:(desc?'<p>'+esc(paragraph(desc))+'</p>':'')+'<h5>Benefícios disponíveis até o nível '+l+'</h5>'+featuresHtml(features),
   rules:(desc?'<p>'+esc(desc)+'</p>':'')+'<h5>Progressão da Subclasse</h5>'+featuresHtml(features,true)};
 }
 if(kind==='background'){
  const feat=currentOriginFeat(item),feature=item.feature;
  return{title:item.name,meta:source,
   summary:kvs([['Perícias',join(item.skills)],['Ferramentas',join(item.tools)],['Idiomas',join(item.languages)],['Talento de Origem',feat],['Equipamento',equipmentSummary(item)]])+'<p class="context-note"><strong>Atributos:</strong> escolhidos pelas Regras da Casa durante a criação.</p>'+(feature?.name?'<p><strong>'+esc(feature.name)+'</strong>'+(feature.text?' — '+esc(paragraph(feature.text)):'')+'</p>':''),
   rules:(feature?.name?'<h5>'+esc(feature.name)+'</h5><p>'+esc(feature.text||'')+'</p>':'')+(equipmentSummary(item)?'<h5>Equipamento inicial</h5><p>'+esc(equipmentSummary(item))+'</p>':'')};
 }
 if(kind==='species'){
  const traits=arr(item.traits),lineages=arr(item.lineages);
  return{title:item.name,meta:source,
   summary:kvs([['Tamanho',join(item.sizes)],['Deslocamento',item.speed?item.speed+' pés':''],['Linhagens/legados',join(lineages)]])+'<h5>Traços</h5>'+pills(traits.map(t=>t.name||t.originalName)),
   rules:traits.map(t=>'<details class="context-feature"><summary>'+esc(t.name||t.originalName||'Traço')+'</summary><p>'+esc(t.text||'')+'</p></details>').join('')+(lineages.length?'<h5>Linhagens/legados</h5>'+lineages.map(x=>'<details class="context-feature"><summary>'+esc(x.name)+'</summary>'+arr(x.traits).map(t=>'<p><strong>'+esc(t.name||'Traço')+':</strong> '+esc(t.text||'')+'</p>').join('')+'</details>').join(''):'')};
 }
 if(kind==='lineage'){
  const traits=arr(item.traits);
  return{title:item.name,meta:'Linhagem / legado',
   summary:kvs([['Tamanho',join(item.sizes)],['Deslocamento',item.speed?item.speed+' pés':'']])+pills(traits.map(t=>t.name||'Traço')),
   rules:traits.map(t=>'<details class="context-feature"><summary>'+esc(t.name||'Traço')+'</summary><p>'+esc(t.text||'')+'</p></details>').join('')};
 }
 if(kind==='feat'){
  return{title:item.name,meta:[item.category,source].filter(Boolean).join(' · '),
   summary:kvs([['Categoria',text(item.category)],['Pré-requisito',text(item.prereq)],['Repetível',item.repeatable?'Sim':'Não']])+(item.description?'<p>'+esc(paragraph(item.description))+'</p>':''),
   rules:item.description?'<p>'+esc(item.description)+'</p>':'<p class="muted">Descrição detalhada indisponível.</p>'};
 }
 if(kind==='spell'){
  const comp=item.components||{},components=[comp.verbal?'V':'',comp.somatic?'S':'',comp.material?'M':''].filter(Boolean).join(', ');
  return{title:item.name,meta:[item.level?item.level+'º círculo':'Truque',item.school,source].filter(Boolean).join(' · '),
   summary:kvs([['Tempo',text(item.castingTime)],['Alcance',text(item.range)],['Componentes',components],['Duração',text(item.duration)],['Classes',join(item.classes)]])+(item.description?'<p>'+esc(paragraph(item.description))+'</p>':''),
   rules:(item.description?'<p>'+esc(item.description)+'</p>':'<p class="muted">Descrição detalhada indisponível.</p>')+(comp.materialText?'<p><strong>Material:</strong> '+esc(comp.materialText)+'</p>':'')};
 }
 if(kind==='armor'){
  return{title:item.nome||item.name||'Armadura',meta:text(item.fonte||item.source),
   summary:kvs([['Categoria',text(item.categoria||item.category)],['CA',text(item.ca||item.ac)],['Força mínima',text(item.forca||item.strength)],['Furtividade',text(item.furtividade||item.stealth)],['Peso',text(item.peso||item.weight)],['Custo',text(item.custo||item.cost)]]),
   rules:'<p>'+esc(text(item.descricao||item.description||'Sem descrição adicional.'))+'</p>'};
 }
 if(kind==='weapon'){
  return{title:item.nome||item.name||'Arma',meta:text(item.fonte||item.source),
   summary:kvs([['Dano',text(item.dano||item.damage)],['Tipo',text(item.tipo||item.damageType)],['Propriedades',join(item.propriedades||item.properties)],['Maestria',text(item.maestria||item.mastery)],['Alcance',text(item.alcance||item.range)],['Peso',text(item.peso||item.weight)],['Custo',text(item.custo||item.cost)]]),
   rules:'<p>'+esc(text(item.descricao||item.description||'Sem descrição adicional.'))+'</p>'};
 }
 return{title:item.name||item.nome||'Opção',meta:source,summary:'<p>'+esc(paragraph(item.description||item.descricao||''))+'</p>',rules:'<p>'+esc(text(item.description||item.descricao||''))+'</p>'};
}
function resolve(kind,value){
 if(!value)return null;
 if(kind==='class')return state.catalogs.classes.find(x=>x.id===value)||null;
 if(kind==='subclass')return state.catalogs.subclasses.find(x=>x.id===value)||null;
 if(kind==='background')return state.catalogs.backgrounds.find(x=>x.id===value)||null;
 if(kind==='species')return state.catalogs.species.find(x=>x.id===value)||null;
 if(kind==='feat')return state.catalogs.feats.find(x=>x.id===value)||null;
 if(kind==='spell')return state.catalogs.spells.find(x=>x.id===value)||null;
 if(kind==='armor')return state.catalogs.armors.find(x=>x.id===value)||null;
 if(kind==='weapon')return state.catalogs.weapons.find(x=>x.id===value)||null;
 if(kind==='lineage')return arr(selectedSpecies()?.lineages).find(x=>x.name===value)||null;
 return null;
}
function kindForSelect(select){
 if(!select)return'';
 if(select.id==='classe')return'class';
 if(select.id==='subclasse')return'subclass';
 if(select.id==='antecedente')return'background';
 if(select.id==='especie')return'species';
 if(select.id==='sp-line')return'lineage';
 if(select.classList.contains('feat-select'))return'feat';
 if(select.id==='armor')return'armor';
 if(select.id==='weapon')return'weapon';
 if((select.dataset.featList==='spell'||select.dataset.featSimple)&&state.catalogs.spells.some(s=>s.id===select.value))return'spell';
 return'';
}
function panelHtml(data){
 if(!data)return'';
 return'<div class="context-head"><div><strong>'+esc(data.title)+'</strong>'+(data.meta?'<small>'+esc(data.meta)+'</small>':'')+'</div></div>'+
  '<div class="context-tabs"><button type="button" class="secondary is-active" data-context-tab="summary">Resumo</button><button type="button" class="secondary" data-context-tab="rules">Regras</button></div>'+
  '<div data-context-pane="summary">'+(data.summary||'<p class="muted">Sem resumo disponível.</p>')+'</div>'+
  '<div data-context-pane="rules" hidden>'+(data.rules||'<p class="muted">Sem regras detalhadas disponíveis.</p>')+'</div>';
}
function ensurePanel(select,kind){
 const label=select.closest('label')||select.parentElement;if(!label)return null;
 let panel=label.nextElementSibling;
 if(!panel?.matches?.('.context-help-panel')){panel=document.createElement('section');panel.className='context-help-panel';label.insertAdjacentElement('afterend',panel)}
 const contextExtra=kind==='background'?(state.c?.choices?.background?.originFeat||''):kind==='lineage'?(state.c?.choices?.species?.lineage||''):'';
 const key=[kind,select.value,level(),state.subclassMechanics?.applied||0,contextExtra].join('|');
 panel.dataset.contextKind=kind;panel.hidden=!select.value;
 if(panel.dataset.contextKey!==key){panel.dataset.contextKey=key;panel.innerHTML=panelHtml(describe(resolve(kind,select.value),kind))}
 return panel;
}
function ensureBrowseButton(select,kind){
 if(!BROWSABLE.has(kind))return;
 const label=select.closest('label')||select.parentElement;if(!label)return;
 let actions=label.querySelector(':scope > .context-select-actions');
 if(!actions){actions=document.createElement('div');actions.className='context-select-actions';label.appendChild(actions)}
 if(!actions.querySelector('[data-context-browse]')){const b=document.createElement('button');b.type='button';b.className='secondary context-browse-button';b.dataset.contextBrowse='';b.textContent='Consultar opções';actions.appendChild(b)}
}
function decorateSelect(select){const kind=kindForSelect(select);if(!kind)return;ensureBrowseButton(select,kind);ensurePanel(select,kind)}
function decorateSpells(){
 document.querySelectorAll('label.spell-check input[value],[data-progression-kind][value]').forEach(input=>{
  const label=input.closest('label');if(!label||label.querySelector('[data-context-spell]'))return;
  const spell=resolve('spell',input.value);if(!spell)return;
  const b=document.createElement('button');b.type='button';b.className='secondary context-info-button';b.dataset.contextSpell=input.value;b.textContent='Consultar';label.appendChild(b);
 });
}
function decorate(){scheduled=false;document.querySelectorAll('#classe,#subclasse,#antecedente,#especie,#sp-line,.feat-select,#armor,#weapon,select[data-feat-list="spell"],select[data-feat-simple]').forEach(decorateSelect);decorateSpells()}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(decorate)}
function injectStyle(){
 if(byId('context-help-style'))return;
 const s=document.createElement('style');s.id='context-help-style';s.textContent=
 '.context-select-actions{display:flex;justify-content:flex-end;margin-top:5px}.context-browse-button,.context-info-button{padding:5px 8px;font-size:.78rem}.context-help-panel{border:1px solid #8885;border-radius:10px;padding:12px;margin:8px 0 12px;background:#fafafa;font-weight:400}.context-head{display:flex;justify-content:space-between;gap:10px}.context-head small{display:block;color:#666;font-weight:400}.context-tabs{display:flex;gap:6px;margin:9px 0}.context-tabs button{padding:5px 9px;font-size:.8rem}.context-tabs button.is-active{background:#111;color:#fff}.context-kv{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #8882;padding:4px 0}.context-kv span{color:#666}.context-kv strong{text-align:right}.context-help-panel h5,.context-browser-detail h5{margin:10px 0 5px;font-size:.9rem}.context-feature{border-top:1px solid #8883;padding:5px 0}.context-feature summary{cursor:pointer;font-weight:650}.context-feature p{white-space:pre-line}.context-pills{display:flex;gap:5px;flex-wrap:wrap}.context-pills span{border:1px solid #8885;border-radius:999px;padding:3px 7px;font-size:.78rem}.context-note{border-left:3px solid #8886;padding-left:8px}.context-info-button{margin-left:auto}.context-browser{width:min(1000px,94vw);max-height:88vh;border:1px solid #777;border-radius:14px;padding:0}.context-browser::backdrop{background:#0007}.context-browser-shell{padding:16px}.context-browser-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.context-browser-grid{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.6fr);gap:14px;margin-top:12px}.context-browser-list{max-height:64vh;overflow:auto;border-right:1px solid #8884;padding-right:10px}.context-option{display:grid;grid-template-columns:auto 1fr;gap:6px;align-items:center;border-bottom:1px solid #8883;padding:6px 0}.context-option button{background:#fff;color:#111;border-color:#8885;text-align:left}.context-option button.is-active{background:#111;color:#fff}.context-option input{width:auto;margin:0}.context-browser-detail{max-height:64vh;overflow:auto}.context-browser-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.context-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px}.context-compare>section{border:1px solid #8884;border-radius:10px;padding:10px}.context-browser-search{margin-top:8px}@media(max-width:760px){.context-browser-grid{grid-template-columns:1fr}.context-browser-list{max-height:28vh;border-right:0;border-bottom:1px solid #8884;padding-right:0;padding-bottom:8px}.context-browser-detail{max-height:44vh}.context-compare{grid-template-columns:1fr}.context-kv{display:block}.context-kv strong{display:block;text-align:left}}';
 document.head.appendChild(s);
}
function ensureDialog(){
 let d=byId('context-browser');if(d)return d;
 d=document.createElement('dialog');d.id='context-browser';d.className='context-browser';
 d.innerHTML='<div class="context-browser-shell"><div class="context-browser-top"><div><strong id="context-browser-title">Consultar opções</strong><div class="mini">Visualize sem alterar sua escolha.</div></div><button type="button" class="secondary" data-context-close>Fechar</button></div><input id="context-browser-search" class="context-browser-search" type="search" placeholder="Buscar opção"><div class="context-browser-grid"><div id="context-browser-list" class="context-browser-list"></div><div id="context-browser-detail" class="context-browser-detail"></div></div></div>';
 document.body.appendChild(d);return d;
}
function rowsForSelect(select,kind){return[...select.options].filter(o=>o.value).map(o=>({value:o.value,label:o.textContent.trim(),item:resolve(kind,o.value)})).filter(r=>r.item)}
function renderBrowserList(){
 const box=byId('context-browser-list'),q=fold(byId('context-browser-search')?.value||'');if(!box)return;
 const rows=browserRows.filter(r=>!q||fold(r.label).includes(q));
 box.innerHTML=rows.length?rows.map(r=>'<div class="context-option"><input type="checkbox" data-context-compare="'+esc(r.value)+'" '+(browserCompare.has(r.value)?'checked':'')+' aria-label="Comparar '+esc(r.label)+'"><button type="button" data-context-view="'+esc(r.value)+'" class="'+(r.value===browserCurrent?'is-active':'')+'">'+esc(r.label)+'</button></div>').join(''):'<p class="muted">Nenhuma opção encontrada.</p>';
}
function renderBrowserDetail(){
 const box=byId('context-browser-detail');if(!box)return;
 if(browserCompare.size===2){
  const ids=[...browserCompare],descs=ids.map(id=>{const r=browserRows.find(x=>x.value===id);return{r,d:describe(r?.item,browserKind)}});
  box.innerHTML='<div class="context-compare">'+descs.map(x=>'<section><h3>'+esc(x.r?.label||x.d?.title||'Opção')+'</h3>'+panelHtml(x.d)+'</section>').join('')+'</div>';return;
 }
 const row=browserRows.find(r=>r.value===browserCurrent)||browserRows[0];if(!row){box.innerHTML='<p class="muted">Nenhuma opção disponível.</p>';return}
 browserCurrent=row.value;const d=describe(row.item,browserKind);
 box.innerHTML=panelHtml(d)+'<div class="context-browser-actions">'+(activeSelect?'<button type="button" data-context-use="'+esc(row.value)+'">Usar esta opção</button>':'')+(browserCompare.size?'<button type="button" class="secondary" data-context-clear-compare>Limpar comparação</button>':'')+'</div>';
}
function openBrowser(select,kind){
 const d=ensureDialog();activeSelect=select;browserKind=kind;browserRows=rowsForSelect(select,kind);browserCurrent=select.value||browserRows[0]?.value||null;browserCompare=new Set;
 byId('context-browser-title').textContent='Consultar opções';byId('context-browser-search').value='';renderBrowserList();renderBrowserDetail();d.showModal();
}
function openSpell(id){
 const d=ensureDialog(),spell=resolve('spell',id);activeSelect=null;browserKind='spell';browserRows=spell?[{value:id,label:spell.name,item:spell}]:[];browserCurrent=id;browserCompare=new Set;
 byId('context-browser-title').textContent='Consultar magia';byId('context-browser-search').value='';renderBrowserList();renderBrowserDetail();d.showModal();
}
function switchTab(tab){
 const root=tab.closest('.context-help-panel,.context-browser-detail,.context-compare>section');if(!root)return;
 root.querySelectorAll('[data-context-tab]').forEach(b=>b.classList.toggle('is-active',b===tab));
 root.querySelectorAll('[data-context-pane]').forEach(p=>p.hidden=p.dataset.contextPane!==tab.dataset.contextTab);
}
function handleClick(e){
 const tab=e.target.closest('[data-context-tab]');if(tab){switchTab(tab);return}
 const browse=e.target.closest('[data-context-browse]');if(browse){e.preventDefault();const select=browse.closest('label')?.querySelector('select');const kind=kindForSelect(select);if(select&&kind)openBrowser(select,kind);return}
 const spell=e.target.closest('[data-context-spell]');if(spell){e.preventDefault();e.stopPropagation();openSpell(spell.dataset.contextSpell);return}
 if(e.target.closest('[data-context-close]')){byId('context-browser')?.close();return}
 const view=e.target.closest('[data-context-view]');if(view){browserCurrent=view.dataset.contextView;renderBrowserList();renderBrowserDetail();return}
 const use=e.target.closest('[data-context-use]');if(use&&activeSelect){activeSelect.value=use.dataset.contextUse;activeSelect.dispatchEvent(new Event('change',{bubbles:true}));byId('context-browser')?.close();schedule();return}
 if(e.target.closest('[data-context-clear-compare]')){browserCompare.clear();renderBrowserList();renderBrowserDetail()}
}
function handleChange(e){
 const compare=e.target.closest?.('[data-context-compare]');if(compare){if(compare.checked){if(browserCompare.size>=2){compare.checked=false;return}browserCompare.add(compare.dataset.contextCompare)}else browserCompare.delete(compare.dataset.contextCompare);renderBrowserList();renderBrowserDetail();return}
 const select=e.target.closest?.('select');if(select&&kindForSelect(select))queueMicrotask(()=>decorateSelect(select));if(e.target?.id==='nivel')schedule();
}
export function initContextualHelpUi(){
 if(initialized)return;initialized=true;injectStyle();ensureDialog();
 const builder=byId('builder');builder?.addEventListener('click',handleClick);builder?.addEventListener('change',handleChange);
 byId('context-browser')?.addEventListener('click',handleClick);byId('context-browser')?.addEventListener('change',handleChange);byId('context-browser-search')?.addEventListener('input',renderBrowserList);
 if(builder)new MutationObserver(schedule).observe(builder,{childList:true,subtree:true});
 for(const event of['hub:class-context-changed','hub:origin-context-changed','hub:species-context-changed','hub:progression-context-changed','hub:spell-selection-changed','hub:active-equipment-changed','hub:new-character'])document.addEventListener(event,schedule);
 document.addEventListener('hub:subclass-mechanics-ready',schedule);initSubclassMechanicsData().then(schedule);schedule();
}
