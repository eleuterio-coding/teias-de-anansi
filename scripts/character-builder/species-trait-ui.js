import{state,$,SKILL_AB,arr,esc,fold,num}from'./state.js';
import{compatible,selected,speciesTraitChoiceDefs,sanitizeSpeciesTraitChoices}from'./rules.js';

let applying=false,scheduled=false;
const allSkills=()=>Object.keys(SKILL_AB);
const values=()=>state.c.choices.species.traitChoices||(state.c.choices.species.traitChoices={});

function selectedFeatNames(){
 const{bg}=selected(),names=new Set;
 if(bg?.feat?.name)names.add(fold(bg.feat.name));
 for(const id of Object.values(state.c.choices.feats||{})){
  const f=state.catalogs.feats.find(x=>x.id===id);if(f)names.add(fold(f.name))
 }
 return names
}
function originFeatOptions(current){
 const taken=selectedFeatNames();
 return compatible('feats').filter(f=>f.category==='Origem').sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(f=>{
  const blocked=!f.repeatable&&taken.has(fold(f.name))&&f.id!==current;
  return`<option value="${esc(f.id)}" ${f.id===current?'selected':''} ${blocked?'disabled':''}>${esc(f.name)}${blocked?' · já obtido':''}</option>`
 }).join('')
}
function selectOptions(options,current,placeholder='Selecione'){
 return`<option value="">${esc(placeholder)}</option>${options.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('')}`
}
function spellOptions(def,current){
 const wanted=arr(def.spellClasses).map(fold),level=num(def.spellLevel),options=state.catalogs.spells.filter(s=>num(s.level)===level&&(!wanted.length||arr(s.classes).some(c=>wanted.includes(fold(c))))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 return`<option value="">Selecione</option>${options.map(s=>`<option value="${esc(s.id)}" ${s.id===current?'selected':''}>${esc(s.name)}</option>`).join('')}`
}
function choiceBlock(def){
 const store=values(),v=store[def.key],note=def.temporary?' <span class="mini">(pode mudar após Descanso Longo)</span>':'';
 if(def.type==='skill'&&def.choose>1){
  const chosen=arr(v),options=def.options==='all'?allSkills():arr(def.options);
  return`<div class="trait-choice" data-trait-choice="${esc(def.key)}"><strong>${esc(def.traitName)} — ${esc(def.label)}</strong>${note}<p class="mini">Escolha ${def.choose}.</p><div class="check-grid">${options.map(x=>`<label class="check"><input type="checkbox" data-species-multi="${esc(def.key)}" value="${esc(x)}" ${chosen.includes(x)?'checked':''} ${!chosen.includes(x)&&chosen.length>=def.choose?'disabled':''}>${esc(x)}</label>`).join('')}</div></div>`
 }
 if(def.type==='skill'){
  const options=def.options==='all'?allSkills():arr(def.options);
  return`<label class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}${note}<select data-species-choice="${esc(def.key)}" data-choice-type="skill">${selectOptions(options,v)}</select></label>`
 }
 if(def.type==='feat')return`<label class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}<select data-species-choice="${esc(def.key)}" data-choice-type="feat"><option value="">Selecione</option>${originFeatOptions(v)}</select></label>`;
 if(def.type==='spell')return`<label class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}<select data-species-choice="${esc(def.key)}" data-choice-type="spell">${spellOptions(def,v)}</select></label>`;
 if(def.type==='ability'||def.type==='option')return`<label class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}<select data-species-choice="${esc(def.key)}" data-choice-type="${def.type}">${selectOptions(arr(def.options),v)}</select></label>`;
 if(def.type==='tool')return`<label class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}<input data-species-choice="${esc(def.key)}" data-choice-type="tool" value="${esc(v||'')}" placeholder="Nome da ferramenta"></label>`;
 if(def.type==='skill_or_tool'){
  const type=v?.type||'',value=v?.value||'';
  return`<div class="trait-choice"><strong>${esc(def.traitName)}</strong> — ${esc(def.label)}<div class="choice-grid"><label>Tipo<select data-species-mixed-type="${esc(def.key)}"><option value="">Selecione</option><option value="skill" ${type==='skill'?'selected':''}>Perícia</option><option value="tool" ${type==='tool'?'selected':''}>Ferramenta</option></select></label>${type==='skill'?`<label>Perícia<select data-species-mixed-value="${esc(def.key)}" data-mixed-kind="skill">${selectOptions(allSkills(),value)}</select></label>`:type==='tool'?`<label>Ferramenta<input data-species-mixed-value="${esc(def.key)}" data-mixed-kind="tool" value="${esc(value)}" placeholder="Nome da ferramenta"></label>`:''}</div></div>`
 }
 return''
}

function missingChoices(){
 const store=values(),missing=[];
 for(const def of speciesTraitChoiceDefs()){
  const v=store[def.key];let ok=false;
  if(def.type==='skill')ok=def.choose>1?arr(v).length===def.choose:!!v;
  else if(def.type==='skill_or_tool')ok=!!v?.type&&!!String(v?.value||'').trim();
  else ok=!!String(v||'').trim();
  if(!ok)missing.push(`Escolha ${def.label.toLowerCase()} para o traço ${def.traitName}.`)
 }
 return missing
}
function applyPending(){
 const p=$('pending');if(!p)return;const racial=missingChoices();if(!racial.length)return;
 const current=[...p.querySelectorAll('li')].map(li=>li.textContent.trim()).filter(Boolean),all=[...new Set([...current,...racial])];
 const html=`<strong>Escolhas pendentes</strong><ul>${all.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
 if(p.className!=='status warning'||p.innerHTML!==html){p.className='status warning';p.innerHTML=html}
}
function applyLineageLabel(){
 const{species}=selected(),lineage=state.c.choices?.species?.lineage||'',label=species?.lineageLabel||'Linhagem',select=$('sp-line');
 if(select){const host=select.closest('label'),textNode=host?[...host.childNodes].find(n=>n.nodeType===Node.TEXT_NODE):null;if(textNode)textNode.nodeValue=`${label}: `}
 const subtitle=$('sheet-subtitle');
 if(subtitle&&lineage){const token=`${label}: ${lineage}`,known=['Linhagem Élfica:','Linhagem Anã:','Linhagem Gnômica:','Legado Tiefling:','Legado Kobold:','Ancestralidade Dracônica:','Ancestralidade Gigante:','Linhagem:'];const parts=subtitle.textContent.split(' · ').filter(x=>x&&!known.some(prefix=>x.startsWith(prefix)));subtitle.textContent=[...parts,token].join(' · ')}
}

function render(){
 if(applying)return;applying=true;
 try{
  sanitizeSpeciesTraitChoices();const box=$('especie-escolhas');if(!box)return;
  box.querySelector('[data-species-trait-controls]')?.remove();
  const defs=speciesTraitChoiceDefs();
  if(defs.length){const wrap=document.createElement('fieldset');wrap.dataset.speciesTraitControls='';wrap.innerHTML=`<legend>Escolhas dos traços raciais</legend>${defs.map(choiceBlock).join('')}`;box.appendChild(wrap)}
  applyLineageLabel();applyPending()
 }finally{applying=false}
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function rerenderCore(){const level=$('nivel');if(level)level.dispatchEvent(new Event('change',{bubbles:true}));else schedule()}

function bind(){
 const box=$('especie-escolhas');
 box?.addEventListener('change',e=>{
  const store=values(),multi=e.target.closest('[data-species-multi]');
  if(multi){const key=multi.dataset.speciesMulti,def=speciesTraitChoiceDefs().find(x=>x.key===key),cur=arr(store[key]);store[key]=multi.checked?[...new Set([...cur,multi.value])].slice(0,def?.choose||1):cur.filter(x=>x!==multi.value);rerenderCore();return}
  const input=e.target.closest('[data-species-choice]');
  if(input){const key=input.dataset.speciesChoice;store[key]=input.value||null;rerenderCore();return}
  const mt=e.target.closest('[data-species-mixed-type]');
  if(mt){const key=mt.dataset.speciesMixedType;store[key]=mt.value?{type:mt.value,value:''}:null;rerenderCore();return}
  const mv=e.target.closest('[data-species-mixed-value]');
  if(mv){const key=mv.dataset.speciesMixedValue;store[key]={type:mv.dataset.mixedKind,value:mv.value};rerenderCore()}
 });
 const observer=new MutationObserver(()=>{if(box&&!box.querySelector('[data-species-trait-controls]'))schedule()});if(box)observer.observe(box,{childList:true,subtree:true});
 $('especie')?.addEventListener('change',()=>queueMicrotask(schedule));$('new-character')?.addEventListener('click',()=>queueMicrotask(schedule))
}

export function initSpeciesTraitUi(){sanitizeSpeciesTraitChoices();render();bind()}
