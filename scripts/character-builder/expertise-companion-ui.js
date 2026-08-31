import{state,$,arr,num,esc,fold,SKILL_AB,mod,signed}from'./state.js';
import{selected,derive}from'./rules.js?v=20260831-tasha-metamagic1';
import{activeFeatInstances}from'./feat-mechanics.js?v=20260831-tasha-metamagic1';

const FAMILIAR_FORMS=['Morcego','Gato','Sapo','Falcão','Lagarto','Polvo','Coruja','Rato','Corvo','Aranha','Doninha','Outra Besta de ND 0'];
const CREATURE_TYPES=['Celestial','Fada','Ínfero'];
const PRIMAL_FORMS=['Fera da Terra','Fera do Mar','Fera do Céu'];
let applying=false,scheduled=false;

const companionStore=()=>state.c.choices.companions||(state.c.choices.companions={});
const featStore=()=>state.c.choices.featMechanics||(state.c.choices.featMechanics={});
const option=(value,label,current)=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(label)}</option>`;
const selectOptions=(values,current,placeholder='Escolha...')=>`<option value="">${esc(placeholder)}</option>${values.map(v=>option(v,v,current)).join('')}`;
const textField=(grant,field,label,value,placeholder='')=>`<label>${esc(label)}<input data-companion-key="${esc(grant.key)}" data-companion-field="${esc(field)}" value="${esc(value||'')}" placeholder="${esc(placeholder)}"></label>`;
const selectField=(grant,field,label,values,current,placeholder='Escolha...')=>`<label>${esc(label)}<select data-companion-key="${esc(grant.key)}" data-companion-field="${esc(field)}">${selectOptions(values,current,placeholder)}</select></label>`;

function spellIds(){
 const c=state.c?.choices||{},ids=new Set([...arr(c.spells?.cantrips),...arr(c.spells?.leveled),...Object.values(c.spells?.arcanum||{}).filter(Boolean)]);
 const visit=value=>{if(typeof value==='string'){if(state.catalogs.spells.some(s=>s.id===value))ids.add(value);return}if(Array.isArray(value)){for(const x of value)visit(x);return}if(value&&typeof value==='object')for(const x of Object.values(value))visit(x)};
 visit(c.featMechanics||{});return ids
}
function hasSpell(name){const wanted=fold(name);for(const id of spellIds()){const s=state.catalogs.spells.find(x=>x.id===id);if(s&&(fold(s.name)===wanted||fold(s.originalName)===wanted))return true}return false}
function subclassIs(sub,...names){return !!sub&&names.some(name=>fold(sub.name)===fold(name))}
function activeCompanionGrants(){
 const{klass,sub}=selected(),level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),grants=[];
 const add=g=>{if(!grants.some(x=>x.key===g.key))grants.push(g)};
 if(klass?.slug==='druid'&&level>=2)add({key:'druid-wild-companion',kind:'familiar',label:'Companheiro Selvagem',source:'Druida · nível 2',fixedType:'Fada',note:'Forma atual/preferida. O familiar do Companheiro Selvagem é uma Fada e desaparece ao concluir um Descanso Longo.'});
 if(klass?.slug==='ranger'&&level>=3&&subclassIs(sub,'Beast Master','Mestre das Feras'))add({key:'ranger-primal-companion',kind:'primal',label:'Companheiro Primal',source:'Patrulheiro · Mestre das Feras',note:'Escolha o bloco atual do companheiro e descreva o animal apropriado à forma.'});
 if(klass?.slug==='paladin'&&level>=5)add({key:'paladin-faithful-steed',kind:'steed',label:'Corcel Fiel',source:'Paladino · nível 5',note:'Encontrar Corcel usa o bloco Corcel Extraplanar; aparência e tipo são escolhidos ao conjurar.'});
 if(klass?.slug==='artificer'&&level>=3&&subclassIs(sub,'Battle Smith','Ferreiro de Batalha'))add({key:'artificer-steel-defender',kind:'steel',label:'Defensor de Aço',source:'Artífice · Battle Smith',note:'Aparência e número de pernas não alteram as estatísticas do Defensor de Aço.'});
 if(klass?.slug==='druid'&&level>=3&&subclassIs(sub,'Circle of Wildfire','Círculo do Fogo Selvagem'))add({key:'druid-wildfire-spirit',kind:'wildfire',label:'Espírito de Fogo Selvagem',source:'Druida · Círculo do Fogo Selvagem',note:'O espírito usa o bloco próprio da subclasse; registre sua aparência atual/preferida.'});
 if(hasSpell('Find Familiar')&&!grants.some(g=>g.kind==='familiar'))add({key:'spell-find-familiar',kind:'familiar',label:'Familiar',source:'Magia · Encontrar Familiar',note:'A forma pode ser alterada quando Encontrar Familiar é conjurada novamente.'});
 if(hasSpell('Find Steed')&&!grants.some(g=>g.kind==='steed'))add({key:'spell-find-steed',kind:'steed',label:'Corcel',source:'Magia · Encontrar Corcel',note:'O corcel usa o bloco Corcel Extraplanar; aparência e tipo são escolhidos ao conjurar.'});
 return grants
}
function grantFields(grant,data){
 if(grant.kind==='familiar')return`<div class="choice-grid">${selectField(grant,'form','Forma',FAMILIAR_FORMS,data.form,'Escolha a forma')}${grant.fixedType?`<label>Tipo da criatura<input value="${esc(grant.fixedType)}" disabled></label>`:selectField(grant,'type','Tipo da criatura',CREATURE_TYPES,data.type,'Escolha o tipo')}${data.form==='Outra Besta de ND 0'?textField(grant,'customForm','Outra Besta de ND 0',data.customForm,'Nome da Besta'):''}${textField(grant,'name','Nome',data.name,'Nome do familiar')}</div>`;
 if(grant.kind==='primal')return`<div class="choice-grid">${selectField(grant,'form','Bloco do companheiro',PRIMAL_FORMS,data.form,'Escolha Terra, Mar ou Céu')}${textField(grant,'animal','Animal / aparência',data.animal,'Ex.: lobo, pantera, águia')}${textField(grant,'name','Nome',data.name,'Nome do companheiro')}</div>`;
 if(grant.kind==='steed')return`<div class="choice-grid">${selectField(grant,'type','Tipo da criatura',CREATURE_TYPES,data.type,'Escolha o tipo')}${textField(grant,'appearance','Aparência do corcel',data.appearance,'Ex.: cavalo, camelo, lobo atroz, alce')}${textField(grant,'name','Nome',data.name,'Nome do corcel')}</div>`;
 if(grant.kind==='steel')return`<div class="choice-grid">${selectField(grant,'legs','Configuração',['Duas pernas','Quatro pernas'],data.legs,'Escolha')}${textField(grant,'appearance','Aparência',data.appearance,'Descreva o Defensor de Aço')}${textField(grant,'name','Nome',data.name,'Nome do defensor')}</div>`;
 return`<div class="choice-grid">${textField(grant,'appearance','Aparência',data.appearance,'Descreva o espírito')}${textField(grant,'name','Nome',data.name,'Nome do espírito')}</div>`
}
function renderCompanions(){
 const grid=document.querySelector('[data-wizard-panel="classe"] .step-grid');if(!grid)return;const grants=activeCompanionGrants(),store=companionStore(),existing=grid.querySelector('[data-companion-card]');
 if(!grants.length){existing?.remove();return}
 const body=grants.map(g=>{const d=store[g.key]||{};return`<div class="feature"><strong>${esc(g.label)}</strong> <span class="mini">· ${esc(g.source)}</span><p class="mini">${esc(g.note)}</p>${grantFields(g,d)}</div>`}).join('');
 const signature=JSON.stringify(grants.map(g=>[g.key,g.kind,g.fixedType||'',g.kind==='familiar'?(store[g.key]?.form||''):'']));
 if(existing?.dataset.signature===signature)return;
 const card=existing||document.createElement('section');card.className='card full';card.dataset.companionCard='';card.dataset.signature=signature;card.innerHTML=`<h3>Companheiros e familiares</h3><p class="section-note">Registre a forma atual ou preferida permitida pelo recurso. Escolhas que podem mudar ao conjurar novamente não ficam permanentemente travadas.</p>${body}`;if(!existing)grid.appendChild(card)
}
function setCompanion(key,field,value){const store=companionStore(),row=store[key]||(store[key]={});row[field]=value||''}
function onCompanionChange(e){const t=e.target.closest?.('[data-companion-key][data-companion-field]');if(!t)return;setCompanion(t.dataset.companionKey,t.dataset.companionField,t.value);if(t.dataset.companionField==='form')schedule()}

function expertiseInstances(){return activeFeatInstances().filter(inst=>['skill expert','especialista em pericia','expertise'].includes(fold(inst.feat?.name)))}
function repairExpertiseSelectors(){
 const box=$('talentos-escolhas');if(!box)return;const d=derive(),mechanics=featStore();
 for(const inst of expertiseInstances()){
  const card=box.querySelector(`[data-feat-instance-card="${CSS.escape(inst.key)}"]`);if(!card)continue;const data=mechanics[inst.key]||{},current=data.expertise||'',newSkill=data.skill||'',already=new Set(arr(d.expertiseSkills).filter(s=>s!==current)),eligible=[...new Set([...arr(d.skills),newSkill].filter(Boolean))].filter(s=>!already.has(s)||s===current);
  let select=card.querySelector('select[data-feat-simple="expertise"]');
  if(!select){const label=document.createElement('label');label.className='trait-choice';label.innerHTML=`<strong>Especialização</strong><select data-feat-simple="expertise" data-instance="${esc(inst.key)}"></select>`;card.appendChild(label);select=label.querySelector('select')}
  const html=selectOptions(eligible,current,'Selecione uma perícia proficiente');if(select.innerHTML!==html)select.innerHTML=html;if(current&&eligible.includes(current))select.value=current
 }
}
function decorateExpertiseSkillValues(){
 const box=$('skill-values');if(!box)return;const d=derive();
 for(const row of box.querySelectorAll('.value-row')){const label=row.querySelector('span'),value=row.querySelector('strong');if(!label||!value)continue;const skill=Object.keys(SKILL_AB).find(name=>label.textContent.startsWith(name));if(!skill)continue;const proficient=d.skills.includes(skill),expert=d.expertiseSkills.includes(skill),ability=SKILL_AB[skill],total=mod(d.scores[ability])+(proficient?d.pbonus:0)+(expert?d.pbonus:0)+num(d.subclassSkillBonuses?.[skill]);const labelText=`${skill}${proficient?' ●':''}${expert?' ◆':''}`,valueText=signed(total);if(label.textContent!==labelText)label.textContent=labelText;if(value.textContent!==valueText)value.textContent=valueText}
}
function run(){if(applying)return;applying=true;try{repairExpertiseSelectors();renderCompanions();decorateExpertiseSkillValues()}finally{applying=false}}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;run()})}

export function initExpertiseCompanionUi(){
 run();document.addEventListener('change',onCompanionChange,true);document.addEventListener('input',onCompanionChange,true);
 for(const id of['classe','nivel','subclasse'])$(id)?.addEventListener('change',schedule);
 for(const id of['talentos-escolhas','classe-escolhas','magias-escolhas','skill-values']){const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:true})}
 document.addEventListener('hub:class-skills-changed',schedule);document.addEventListener('hub:spell-selection-changed',schedule);document.addEventListener('change',schedule);$('new-character')?.addEventListener('click',schedule)
}
