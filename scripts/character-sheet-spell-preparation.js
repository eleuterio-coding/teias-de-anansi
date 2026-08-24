import{state,$,arr,num,esc,read,write,fold}from'./character-builder/state.js';
import{derive,spellOptions}from'./character-builder/rules.js';

let initialized=false,rendering=false;
const DAILY_ANY=new Set(['cleric','druid','wizard','artificer']);
const LONG_REST_ONE=new Set(['paladin','ranger']);
const LEVEL_ONE=new Set(['bard','sorcerer','warlock']);
const PT={wizard:'Mago',cleric:'Clérigo',druid:'Druida',artificer:'Artífice',paladin:'Paladino',ranger:'Patrulheiro',bard:'Bardo',sorcerer:'Feiticeiro',warlock:'Bruxo'};

function ensureStyles(){
 if($('spell-preparation-style'))return;
 const style=document.createElement('style');style.id='spell-preparation-style';style.textContent=`
 .spell-prep-panel{border:1px solid #8885;border-radius:12px;padding:13px;margin:16px 0;background:#f8f8f8}.spell-prep-panel h3{margin:0 0 5px}.spell-prep-panel p{margin:5px 0}.spell-prep-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.spell-prep-summary>div{border:1px solid #8884;border-radius:9px;padding:8px;background:#fff}.spell-prep-summary span{display:block;font-size:.76rem;color:#666}.spell-prep-summary strong{font-size:1rem}.spell-prep-level{border-top:1px solid #8883;padding-top:10px;margin-top:10px}.spell-prep-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.spell-prep-check{border:1px solid #8884;border-radius:8px;padding:7px 9px;background:#fff;font-weight:500}.spell-prep-check input{width:auto;margin:0 7px 0 0}.spell-prep-check small{display:block;margin-left:23px;color:#666}.spell-prep-current{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.spell-prep-current .pill{background:#fff}.spell-prep-warning{color:#8a5a00;font-weight:650}.spell-prep-fixed{border-left:3px solid #8888;padding-left:10px;margin-top:9px}@media(max-width:760px){.spell-prep-summary,.spell-prep-checks{grid-template-columns:1fr}}
 `;document.head.appendChild(style)
}
function persist(message='Preparação de magias atualizada.'){
 const list=read(),i=list.findIndex(x=>x.id===state.c.id);state.c.updatedAt=new Date().toISOString();if(i>=0)list[i]=state.c;else list.push(state.c);write(list);const status=$('save-status');if(status)status.textContent=`${message} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`
}
function prepState(d){
 state.c.sheet=state.c.sheet||{};const root=state.c.sheet.spellPreparation||(state.c.sheet.spellPreparation={classId:d.klass?.id||null,prepared:[]});
 if(root.classId!==d.klass?.id){root.classId=d.klass?.id||null;root.prepared=[]}
 root.prepared=arr(root.prepared);return root
}
function profile(d){
 const slug=d.klass?.slug||'';
 if(slug==='wizard')return{kind:'daily',title:'Magias preparadas hoje',pool:'spellbook',timing:'Após um Descanso Longo, você pode trocar qualquer quantidade de magias preparadas por outras do seu grimório.',extra:d.level>=5?'Memorizar Magia (nível 5+) também permite trocar 1 magia preparada por outra do grimório após um Descanso Curto.':'',sourceLabel:'Grimório'};
 if(['cleric','druid','artificer'].includes(slug))return{kind:'daily',title:'Magias preparadas hoje',pool:'class',timing:'Após um Descanso Longo, você pode trocar qualquer quantidade de magias preparadas por outras magias elegíveis da classe.',extra:'',sourceLabel:'Lista da classe'};
 if(LONG_REST_ONE.has(slug))return{kind:'fixed',title:'Magias preparadas atualmente',timing:'Após um Descanso Longo, você pode substituir 1 magia desta lista por outra magia elegível da classe.',extra:'',sourceLabel:'Lista preparada'};
 if(LEVEL_ONE.has(slug))return{kind:'fixed',title:'Magias preparadas atualmente',timing:'Ao ganhar um nível nesta classe, você pode substituir 1 magia desta lista por outra magia elegível da classe.',extra:'',sourceLabel:'Lista preparada'};
 return{kind:'fixed',title:'Magias da classe',timing:'Consulte a característica de conjuração da classe para alterar esta lista.',extra:'',sourceLabel:'Lista da classe'}
}
function poolFor(d,p){
 if(p.pool==='spellbook')return arr(d.selectedSpells?.leveled);
 if(p.pool==='class')return arr(spellOptions(d.klass,d.level)?.leveled);
 return arr(d.selectedSpells?.leveled)
}
function limitFor(d){return Math.max(0,num(d.spell?.prepared))}
function sanitizePrepared(d,p){
 const st=prepState(d),pool=poolFor(d,p),ids=new Set(pool.map(s=>s.id)),limit=limitFor(d);let chosen=st.prepared.filter(id=>ids.has(id));
 if(!chosen.length&&p.kind==='daily')chosen=arr(d.selectedSpells?.leveled).map(s=>s.id).filter(id=>ids.has(id)).slice(0,limit);
 chosen=[...new Set(chosen)].slice(0,limit);const changed=chosen.join('|')!==st.prepared.join('|');st.prepared=chosen;if(changed)persist('Lista de magias preparadas ajustada.');return{st,pool,limit}
}
function spellName(id,pool){return pool.find(s=>s.id===id)?.name||id}
function labelExistingList(d,p){
 const grid=document.querySelector('#spell-section .spells-grid');if(!grid)return;const columns=[...grid.children],leveledCol=columns[1];const h=leveledCol?.querySelector(':scope > h3');if(!h)return;
 if(d.klass.slug==='wizard')h.textContent='Grimório';
 else if(p.kind==='daily')h.textContent='Seleção inicial da criação';
 else h.textContent='Magias preparadas da classe'
}
function spellMeta(s){return`${s.level}º círculo${s.school?` · ${s.school}`:''}${s.concentration?' · Concentração':''}${s.ritual?' · Ritual':''}`}
function dailyHtml(d,p,data){
 const{st,pool,limit}=data,chosen=new Set(st.prepared),levels=[...new Set(pool.map(s=>num(s.level)).filter(Boolean))].sort((a,b)=>a-b),count=chosen.size;
 return`<h3>${esc(p.title)}</h3><p class="mini">${esc(p.timing)}</p>${p.extra?`<p class="mini"><strong>${esc(p.extra)}</strong></p>`:''}<div class="spell-prep-summary"><div><span>Classe</span><strong>${esc(PT[d.klass.slug]||d.klass.name)}</strong></div><div><span>Preparadas</span><strong>${count}/${limit}</strong></div><div><span>Origem das escolhas</span><strong>${esc(p.sourceLabel)}</strong></div></div>${count<limit?`<p class="spell-prep-warning">Faltam ${limit-count} magia(s) para completar a preparação do dia.</p>`:''}<div class="spell-prep-current"><strong style="width:100%">Disponíveis para conjurar hoje</strong>${st.prepared.length?st.prepared.map(id=>`<span class="pill">${esc(spellName(id,pool))}</span>`).join(''):'<span class="muted">Nenhuma magia de nível 1+ preparada.</span>'}</div>${levels.map(level=>`<div class="spell-prep-level"><strong>${level}º círculo</strong><div class="spell-prep-checks">${pool.filter(s=>num(s.level)===level).map(s=>`<label class="spell-prep-check"><input type="checkbox" data-prepared-spell="${esc(s.id)}" ${chosen.has(s.id)?'checked':''} ${!chosen.has(s.id)&&count>=limit?'disabled':''}>${esc(s.name)}<small>${esc(spellMeta(s))}</small></label>`).join('')}</div></div>`).join('')}${d.klass.slug==='wizard'?'<p class="mini">Magias com a tag Ritual no grimório continuam identificadas aqui; a preparação diária é controlada separadamente.</p>':''}`
}
function fixedHtml(d,p){
 const spells=arr(d.selectedSpells?.leveled),levels=[...new Set(spells.map(s=>num(s.level)).filter(Boolean))].sort((a,b)=>a-b);
 return`<h3>${esc(p.title)}</h3><p class="mini">${esc(p.timing)}</p><div class="spell-prep-summary"><div><span>Classe</span><strong>${esc(PT[d.klass.slug]||d.klass.name)}</strong></div><div><span>Preparadas</span><strong>${spells.length}</strong></div><div><span>Alteração</span><strong>${LONG_REST_ONE.has(d.klass.slug)?'1 / Descanso Longo':LEVEL_ONE.has(d.klass.slug)?'1 / novo nível':'Conforme a classe'}</strong></div></div>${levels.length?levels.map(level=>`<div class="spell-prep-level"><strong>${level}º círculo</strong><div class="spell-prep-current">${spells.filter(s=>num(s.level)===level).map(s=>`<span class="pill">${esc(s.name)}</span>`).join('')}</div></div>`).join(''):'<p class="muted">Nenhuma magia de nível 1+ registrada.</p>'}<div class="spell-prep-fixed"><p class="mini">Esta lista já representa as magias disponíveis para conjurar; não existe uma segunda seleção diária separada para esta classe.</p></div>`
}
function ensurePanel(){
 const section=$('spell-section');if(!section)return null;let panel=$('spell-preparation-panel');if(panel)return panel;panel=document.createElement('section');panel.id='spell-preparation-panel';panel.className='spell-prep-panel';const overview=$('spell-overview');overview?.insertAdjacentElement('afterend',panel);panel.addEventListener('change',onChange);return panel
}
function onChange(e){
 const input=e.target.closest('input[data-prepared-spell]');if(!input||!state.c)return;const d=derive(),p=profile(d);if(p.kind!=='daily')return;const data=sanitizePrepared(d,p),st=data.st,current=arr(st.prepared),id=input.dataset.preparedSpell;
 if(input.checked){if(current.length>=data.limit){input.checked=false;return}st.prepared=[...new Set([...current,id])]}else st.prepared=current.filter(x=>x!==id);persist();render()
}
function render(){
 if(rendering||!state.c)return;const d=derive();if(!d.klass?.spellAbility)return;rendering=true;try{ensureStyles();const panel=ensurePanel(),p=profile(d);if(!panel)return;labelExistingList(d,p);panel.innerHTML=p.kind==='daily'?dailyHtml(d,p,sanitizePrepared(d,p)):fixedHtml(d,p)}finally{rendering=false}
}
function queue(){queueMicrotask(render)}
function bind(){
 for(const event of['hub-rpg:sheet-ready','hub-rpg:sheet-spells-ready'])document.addEventListener(event,queue);
 const spells=$('spell-section');if(spells)new MutationObserver(mutations=>{if(rendering)return;if(mutations.some(m=>m.target.id==='leveled-spells'||m.target.id==='spell-overview'))queue()}).observe(spells,{childList:true,subtree:true})
}
export function initCharacterSheetSpellPreparation(){if(initialized)return;initialized=true;bind();if(state.c)queue()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCharacterSheetSpellPreparation,{once:true});else initCharacterSheetSpellPreparation();
