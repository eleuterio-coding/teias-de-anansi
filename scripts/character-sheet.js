import{state,$,AB,SKILL_AB,arr,num,esc,mod,signed,read,write,loadCharacter,json}from'./character-builder/state.js';
import{loadClasses,loadSpecies,loadBackgrounds,loadSubclasses,loadFeats,loadEquipment}from'./character-builder/catalogs.js';
import{loadSpells}from'./character-builder/spells.js';
import{derive,sanitizeSelections,spellOptions}from'./character-builder/rules.js';

const CONDITIONS=['Agarrado','Amedrontado','Atordoado','Caído','Cego','Enfeitiçado','Envenenado','Impedido','Incapacitado','Inconsciente','Invisível','Paralisado','Petrificado','Surdo'];

function ensureSheetState(){
 const c=state.c;
 c.sheet=c.sheet||{};
 c.sheet.profile={player:'',age:'',gender:'',height:'',weight:'',alignment:'',faith:'',languages:'',...c.sheet.profile};
 c.sheet.roleplay={personality:'',ideal:'',bond:'',flaw:'',...c.sheet.roleplay};
 c.sheet.runtime={currentHp:null,tempHp:0,inspiration:false,conditions:[],exhaustion:0,deathSuccess:0,deathFail:0,spellSlotsUsed:{},...c.sheet.runtime};
 c.sheet.runtime.conditions=arr(c.sheet.runtime.conditions);
 c.sheet.runtime.spellSlotsUsed={...(c.sheet.runtime.spellSlotsUsed||{})};
 c.sheet.inventory={cp:0,sp:0,ep:0,gp:0,pp:0,notes:'',magicItems:'',otherHoldings:'',...c.sheet.inventory};
 c.sheet.extraSpells=c.sheet.extraSpells||''
}

function saveCharacter(message='Ficha salva.'){
 const list=read(),i=list.findIndex(x=>x.id===state.c.id);
 state.c.updatedAt=new Date().toISOString();
 if(i>=0)list[i]=state.c;else list.push(state.c);
 write(list);
 const s=$('save-status');
 if(s)s.textContent=`${message} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}
function pill(v){return`<span class="pill">${esc(v)}</span>`}
function sourceBadge(v){return v?`<span class="source">${esc(v)}</span>`:''}
function featureList(items){return items.length?items.map(f=>`<details class="feature"><summary>${esc(f.name)}${f.level?` <span class="muted">· nível ${f.level}</span>`:''}</summary><p>${esc(f.text||f.description||'')}</p></details>`).join(''):'<p class="muted">Nenhuma característica disponível.</p>'}
function eqText(bg){if(!bg)return'—';if(bg.equipmentOptions?.length){const o=bg.equipmentOptions.find(x=>x.id===state.c.choices.background.equipment)||bg.equipmentOptions[0];return arr(o?.itens).map(i=>`${i.quantidade??1}× ${i.nome}${i.observacao?` (${i.observacao})`:''}`).join(', ')||'—'}return bg.equipmentText||'—'}
function setInput(id,value){const el=$(id);if(el)el.value=value??''}
function getFeatObjects(d){const selected=Object.values(state.c.choices?.feats||{}).filter(Boolean).map(id=>state.catalogs.feats.find(f=>f.id===id)).filter(Boolean);if(d.bg?.feat?.name&&!selected.some(f=>f.name===d.bg.feat.name))selected.unshift({name:d.bg.feat.name,description:'Talento de origem concedido pelo antecedente.',source:d.bg.source});return selected}

function renderHeader(d){
 $('pc-name').textContent=state.c.name||'Personagem sem nome';
 $('pc-subtitle').textContent=[d.klass?`${d.klass.name} ${d.level}`:null,d.sub?.name,d.species?.name,state.c.choices?.species?.lineage,d.bg?.name].filter(Boolean).join(' · ');
 $('edit-link').href=`criacao-personagem.html?id=${encodeURIComponent(state.c.id)}`;
 const p=state.c.sheet.profile;
 setInput('profile-player',p.player);setInput('profile-age',p.age);setInput('profile-gender',p.gender);setInput('profile-height',p.height);setInput('profile-weight',p.weight);setInput('profile-alignment',p.alignment);setInput('profile-faith',p.faith);setInput('profile-languages',p.languages)
}

function renderCore(d){
 const metrics=[['Proficiência',signed(d.pbonus)],['CA',d.ac],['PV máximo',d.hp??'—'],['Iniciativa',signed(d.initiative)],['Deslocamento',d.species?`${d.speed} ft`:'—'],['Percepção passiva',d.passive],['Dado de Vida',d.klass?`d${d.klass.hitDie}`:'—'],['Tamanho',state.c.choices.species.size||d.species?.sizes?.[0]||'—']];
 $('core-metrics').innerHTML=metrics.map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
 $('abilities').innerHTML=AB.map(a=>`<div class="ability"><span>${esc(a)}</span><strong>${d.scores[a]}</strong><b>${signed(mod(d.scores[a]))}</b></div>`).join('');
 $('saves').innerHTML=AB.map(a=>{const trained=d.klass?.savingThrows.includes(a),value=mod(d.scores[a])+(trained?d.pbonus:0);return`<div class="row"><span>${trained?'● ':''}${esc(a)}</span><strong>${signed(value)}</strong></div>`}).join('');
 $('skills').innerHTML=Object.entries(SKILL_AB).map(([s,a])=>{const trained=d.skills.includes(s),value=mod(d.scores[a])+(trained?d.pbonus:0);return`<div class="row"><span>${trained?'● ':''}${esc(s)} <small>${esc(a)}</small></span><strong>${signed(value)}</strong></div>`}).join('')
}

function renderRuntime(d){
 const r=state.c.sheet.runtime;
 if(r.currentHp==null&&d.hp!=null)r.currentHp=d.hp;
 setInput('current-hp',r.currentHp);setInput('temp-hp',r.tempHp);
 $('max-hp').textContent=d.hp??'—';$('hit-dice').textContent=d.klass?`${d.level}d${d.klass.hitDie}`:'—';
 $('inspiration').checked=!!r.inspiration;
 setInput('exhaustion',Math.max(0,Math.min(6,num(r.exhaustion))));
 setInput('death-success',Math.max(0,Math.min(3,num(r.deathSuccess))));
 setInput('death-fail',Math.max(0,Math.min(3,num(r.deathFail))));
 $('conditions').innerHTML=CONDITIONS.map(c=>`<label class="check"><input type="checkbox" data-condition="${esc(c)}" ${r.conditions.includes(c)?'checked':''}>${esc(c)}</label>`).join('')
}

function renderCombat(d){
 const parts=[];
 parts.push(`<div class="row"><span>Classe de Armadura</span><strong>${d.ac}</strong></div>`);
 if(d.armor)parts.push(`<div class="row"><span>Armadura ativa</span><strong>${esc(d.armor.nome)}</strong></div>`);
 if(state.c.choices.equipment.shield)parts.push(`<div class="row"><span>Escudo</span><strong>Equipado</strong></div>`);
 if(d.weapon)parts.push(`<div class="attack"><div><strong>${esc(d.weapon.nome)}</strong>${sourceBadge(d.weapon.fonte||d.weapon.source)}</div><div class="attack-values"><span>Ataque <b>${signed(d.attack)}</b>${d.wprof?' ●':''}</span><span>Dano <b>${esc(d.weapon.dano)} ${signed(mod(d.scores[d.wAbility]))}</b></span><span>Maestria <b>${esc(d.weapon.maestria||'—')}</b></span></div></div>`);
 else parts.push('<p class="muted">Nenhuma arma principal equipada.</p>');
 $('combat-summary').innerHTML=parts.join('');
 $('basic-actions').innerHTML=['Atacar','Conjurar magia','Correr','Desengajar','Esquivar','Ajudar','Esconder-se','Preparar','Procurar','Utilizar objeto'].map(pill).join('')
}

function renderFeatures(d){
 $('species-features').innerHTML=`<div class="section-source">${d.species?`${esc(d.species.name)} ${sourceBadge(d.species.source)}`:'Raça não definida'}</div>${featureList(d.speciesTraits)}`;
 $('class-features').innerHTML=`<div class="section-source">${d.klass?`${esc(d.klass.name)} ${sourceBadge(d.klass.source)}`:'Classe não definida'}</div>${featureList(d.classFeatures)}`;
 $('subclass-features').innerHTML=d.sub?`<div class="section-source">${esc(d.sub.name)} ${sourceBadge(d.sub.source)}</div><p>${esc(d.sub.description||'Sem descrição estruturada.')}</p>`:'<p class="muted">Subclasse ainda não definida.</p>';
 const bg=d.bg;
 $('background-data').innerHTML=bg?`<div class="section-source">${esc(bg.name)} ${sourceBadge(bg.source)}</div><div class="row"><span>Perícias</span><strong>${arr(bg.skills).map(esc).join(', ')||'—'}</strong></div><div class="row"><span>Ferramentas</span><strong>${arr(bg.tools).map(esc).join(', ')||'—'}</strong></div><div class="row"><span>Talento de origem</span><strong>${esc(bg.feat?.name||'—')}</strong></div>`:'<p class="muted">Antecedente ainda não definido.</p>';
 const feats=getFeatObjects(d);
 $('feat-data').innerHTML=feats.length?feats.map(f=>`<details class="feature"><summary>${esc(f.name)} ${sourceBadge(f.source)}</summary><p>${esc(f.description||'')}</p></details>`).join(''):'<p class="muted">Nenhum talento registrado.</p>';
 const rp=state.c.sheet.roleplay;
 setInput('personality',rp.personality);setInput('ideal',rp.ideal);setInput('bond',rp.bond);setInput('flaw',rp.flaw)
}

function renderProficiencies(d){
 $('proficiencies').innerHTML=arr(d.klass?.proficiencies).length?arr(d.klass.proficiencies).map(pill).join(''):'—';
 $('tools').innerHTML=d.tools.length?d.tools.map(pill).join(''):'—';
 $('skill-profs').innerHTML=d.skills.length?d.skills.map(pill).join(''):'—';
 $('save-profs').innerHTML=arr(d.klass?.savingThrows).length?d.klass.savingThrows.map(pill).join(''):'—'
}

function renderInventory(d){
 $('starting-equipment').textContent=eqText(d.bg);
 $('active-equipment').innerHTML=[d.armor?.nome,state.c.choices.equipment.shield?'Escudo':null,d.weapon?.nome].filter(Boolean).map(pill).join('')||'—';
 const inv=state.c.sheet.inventory;
 for(const coin of['cp','sp','ep','gp','pp'])setInput(`coin-${coin}`,num(inv[coin]));
 setInput('inventory-notes',inv.notes);setInput('magic-items',inv.magicItems);setInput('other-holdings',inv.otherHoldings)
}

function renderSpellSlots(d){
 const used=state.c.sheet.runtime.spellSlotsUsed;
 $('spell-slots').innerHTML=d.spell.slots.length?d.spell.slots.map(s=>{const u=Math.max(0,Math.min(s.count,num(used[s.level]))),left=s.count-u;used[s.level]=u;return`<div class="slot"><strong>${s.level}º círculo</strong><span>${left}/${s.count} restantes</span><div><button type="button" data-slot="${s.level}" data-delta="-1" aria-label="Recuperar espaço">−</button><b>${u} usados</b><button type="button" data-slot="${s.level}" data-delta="1" aria-label="Usar espaço">+</button></div></div>`}).join(''):'<p class="muted">Sem espaços de magia.</p>'
}

function renderSpellLoading(d){
 if(!d.klass?.spellAbility){renderSpells(d);return}
 $('spell-overview').innerHTML=[['Atributo',d.klass.spellAbility],['CD',d.spellDC],['Ataque mágico',signed(d.spellAttack)],['Magias','Carregando…']].map(([a,b])=>`<div class="metric"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('');
 renderSpellSlots(d);
 $('cantrip-list').innerHTML='<p class="muted">Carregando magias...</p>';
 $('leveled-spells').innerHTML='<p class="muted">Carregando magias...</p>';
 $('arcanum-spells').innerHTML='';
 setInput('extra-spells',state.c.sheet.extraSpells)
}

function renderSpellFailure(){
 if($('cantrip-list'))$('cantrip-list').innerHTML='<p class="muted">Catálogo de magias indisponível. As escolhas salvas foram preservadas.</p>';
 if($('leveled-spells'))$('leveled-spells').innerHTML='<p class="muted">Não foi possível carregar o catálogo de magias agora.</p>'
}

function renderSpells(d){
 const box=$('spell-section');
 if(!d.klass?.spellAbility){box.innerHTML='<p class="muted">Esta classe não possui progressão de conjuração.</p>';return}
 const opts=spellOptions(d.klass,d.level),progress=opts.progress,selected=d.selectedSpells;
 $('spell-overview').innerHTML=[['Atributo',d.klass.spellAbility],['CD',d.spellDC],['Ataque mágico',signed(d.spellAttack)],['Truques',`${selected.cantrips.length}/${d.spell.cantrips}`],[progress.selectionLabel,`${selected.leveled.length}/${progress.selectionTotal}`]].map(([a,b])=>`<div class="metric"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join('');
 renderSpellSlots(d);
 const spellCard=s=>`<article class="spell"><div><strong>${esc(s.name)}</strong> ${sourceBadge(s.source)}</div><small>${s.level===0?'Truque':`${s.level}º círculo`}${s.school?` · ${esc(s.school)}`:''}${s.concentration?' · Concentração':''}${s.ritual?' · Ritual':''}</small>${s.description?`<p>${esc(s.description)}</p>`:''}</article>`;
 $('cantrip-list').innerHTML=selected.cantrips.length?selected.cantrips.map(spellCard).join(''):'<p class="muted">Nenhum truque selecionado.</p>';
 const levels=[...new Set(selected.leveled.map(s=>s.level))].sort((a,b)=>a-b);
 $('leveled-spells').innerHTML=levels.length?levels.map(l=>`<h4>${l}º círculo</h4>${selected.leveled.filter(s=>s.level===l).map(spellCard).join('')}`).join(''):'<p class="muted">Nenhuma magia selecionada.</p>';
 const arcanum=Object.entries(selected.arcanum||{});
 $('arcanum-spells').innerHTML=arcanum.length?`<h4>Arcanos Místicos</h4>${arcanum.map(([,s])=>spellCard(s)).join('')}`:'';
 setInput('extra-spells',state.c.sheet.extraSpells)
}

function bindFields(){
 const p=state.c.sheet.profile,rp=state.c.sheet.roleplay,rt=state.c.sheet.runtime,inv=state.c.sheet.inventory;
 const textBindings={
  'profile-player':[p,'player'],'profile-age':[p,'age'],'profile-gender':[p,'gender'],'profile-height':[p,'height'],'profile-weight':[p,'weight'],'profile-alignment':[p,'alignment'],'profile-faith':[p,'faith'],'profile-languages':[p,'languages'],
  'personality':[rp,'personality'],'ideal':[rp,'ideal'],'bond':[rp,'bond'],'flaw':[rp,'flaw'],
  'inventory-notes':[inv,'notes'],'magic-items':[inv,'magicItems'],'other-holdings':[inv,'otherHoldings']
 };
 for(const[id,[obj,key]]of Object.entries(textBindings))$(id)?.addEventListener('input',e=>{obj[key]=e.target.value});
 for(const coin of['cp','sp','ep','gp','pp'])$(`coin-${coin}`)?.addEventListener('change',e=>{inv[coin]=Math.max(0,num(e.target.value));e.target.value=inv[coin]});
 $('current-hp')?.addEventListener('change',e=>{rt.currentHp=num(e.target.value);saveCharacter('PV atualizado.')});
 $('temp-hp')?.addEventListener('change',e=>{rt.tempHp=Math.max(0,num(e.target.value));e.target.value=rt.tempHp;saveCharacter('PV temporários atualizados.')});
 $('inspiration')?.addEventListener('change',e=>{rt.inspiration=e.target.checked;saveCharacter('Inspiração atualizada.')});
 $('exhaustion')?.addEventListener('change',e=>{rt.exhaustion=Math.max(0,Math.min(6,num(e.target.value)));e.target.value=rt.exhaustion;saveCharacter('Exaustão atualizada.')});
 $('death-success')?.addEventListener('change',e=>{rt.deathSuccess=Math.max(0,Math.min(3,num(e.target.value)));e.target.value=rt.deathSuccess;saveCharacter('Salvaguardas contra morte atualizadas.')});
 $('death-fail')?.addEventListener('change',e=>{rt.deathFail=Math.max(0,Math.min(3,num(e.target.value)));e.target.value=rt.deathFail;saveCharacter('Salvaguardas contra morte atualizadas.')});
 $('conditions')?.addEventListener('change',e=>{const input=e.target.closest('input[data-condition]');if(!input)return;const name=input.dataset.condition;rt.conditions=input.checked?[...new Set([...rt.conditions,name])]:rt.conditions.filter(x=>x!==name);saveCharacter('Condições atualizadas.')});
 $('spell-slots')?.addEventListener('click',e=>{const b=e.target.closest('button[data-slot]');if(!b)return;const level=b.dataset.slot,slot=derive().spell.slots.find(s=>String(s.level)===String(level));if(!slot)return;rt.spellSlotsUsed[level]=Math.max(0,Math.min(slot.count,num(rt.spellSlotsUsed[level])+num(b.dataset.delta)));saveCharacter('Espaços de magia atualizados.');renderSpells(derive())});
 $('extra-spells')?.addEventListener('input',e=>{state.c.sheet.extraSpells=e.target.value});
 $('save-sheet')?.addEventListener('click',()=>saveCharacter())
}

function withDeadline(promise,label,ms=5000){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`${label}: tempo limite de ${ms/1000}s excedido`)),ms);
  Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})
 })
}

function showWarnings(){
 const box=$('load-warnings');
 if(!box)return;
 if(!state.warnings.length){box.hidden=true;box.innerHTML='';return}
 box.hidden=false;
 box.innerHTML=`Algumas fontes não puderam ser carregadas.<ul>${state.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
}

async function loadCoreCatalogs(){
 const[g,loc]=await Promise.all([
  withDeadline(json('dados/localizacao-ptbr-global.json'),'localização geral').catch(e=>{state.warnings.push(`localização geral: ${e.message}`);return{}}),
  withDeadline(json('dados/localizacao-ptbr-especies.json'),'localização de espécies').catch(e=>{state.warnings.push(`localização de espécies: ${e.message}`);return{species:{},lineages:{},traits:{}}})
 ]);
 state.G=g;state.LOCSP=loc;
 const results=await Promise.allSettled([
  withDeadline(loadClasses(),'classes'),
  withDeadline(loadSpecies(),'species'),
  withDeadline(loadBackgrounds(),'backgrounds'),
  withDeadline(loadSubclasses(),'subclasses'),
  withDeadline(loadFeats(),'feats'),
  withDeadline(loadEquipment(),'equipment')
 ]);
 const names=['classes','species','backgrounds','subclasses','feats','equipment'];
 results.forEach((r,i)=>{if(r.status==='rejected')state.warnings.push(`${names[i]}: ${r.reason?.message||r.reason}`)});
 state.catalogs.classes=results[0].status==='fulfilled'?results[0].value:[];
 state.catalogs.species=results[1].status==='fulfilled'?results[1].value:[];
 state.catalogs.backgrounds=results[2].status==='fulfilled'?results[2].value:[];
 state.catalogs.subclasses=results[3].status==='fulfilled'?results[3].value:[];
 state.catalogs.feats=results[4].status==='fulfilled'?results[4].value:[];
 if(results[5].status==='fulfilled'){
  state.catalogs.armors=results[5].value.armors;
  state.catalogs.weapons=results[5].value.weapons
 }
}

async function loadSpellCatalog(){
 try{
  const spells=await withDeadline(loadSpells(),'spells',8000);
  if(!spells.length){state.warnings.push('spells: catálogo vazio; escolhas salvas preservadas.');return false}
  state.catalogs.spells=spells;
  return true
 }catch(e){
  state.warnings.push(`spells: ${e?.message||e}`);
  return false
 }
}

function renderSheet(d){
 renderHeader(d);renderCore(d);renderRuntime(d);renderCombat(d);renderFeatures(d);renderProficiencies(d);renderInventory(d)
}

async function init(){
 const id=new URLSearchParams(location.search).get('id'),saved=id?read().find(x=>x.id===id):null;
 if(!saved){$('loading').innerHTML='<div class="status warning"><strong>Personagem não encontrado.</strong><br>Abra a ficha a partir da Lista de Personagens.</div>';return}
 state.c=loadCharacter();
 ensureSheetState();

 await loadCoreCatalogs();
 let d=derive();
 renderSheet(d);

 if(d.klass?.spellAbility)renderSpellLoading(d);
 else{sanitizeSelections();d=derive();renderSpells(d)}

 bindFields();
 showWarnings();
 $('loading').hidden=true;
 $('sheet').hidden=false;
 document.dispatchEvent(new CustomEvent('hub-rpg:sheet-ready'));

 if(!d.klass?.spellAbility)return;

 const spellsLoaded=await loadSpellCatalog();
 if(!spellsLoaded){renderSpellFailure();showWarnings();return}

 sanitizeSelections();
 d=derive();
 renderSpells(d);
 showWarnings();
 document.dispatchEvent(new CustomEvent('hub-rpg:sheet-spells-ready'))
}

init().catch(e=>{$('loading').innerHTML=`<div class="status warning"><strong>Falha ao abrir a ficha.</strong><br>${esc(e.message||e)}</div>`;console.error('[character-sheet]',e)});
