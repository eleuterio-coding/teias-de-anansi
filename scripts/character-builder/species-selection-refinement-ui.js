import{state,$,arr,fold}from'./state.js';

const SIZE_ORDER=['Tiny','Small','Medium','Large','Huge','Gargantuan'];
const SIZE_LABELS={Tiny:'Minúsculo',Small:'Pequeno',Medium:'Médio',Large:'Grande',Huge:'Enorme',Gargantuan:'Colossal'};
const KNOWN_SIZE_CHOICES={tiefling:['Small','Medium']};
const GENERIC_BY_LABEL={
 'legado tiefling':['Fiendish Legacy','Legado Ínfero','Legado Tiefling'],
 'linhagem elfica':['Elven Lineage','Linhagem Élfica'],
 'linhagem gnomica':['Gnomish Lineage','Linhagem Gnômica'],
 'linhagem ana':['Dwarven Lineage','Linhagem Anã'],
 'legado kobold':['Kobold Legacy','Legado Kobold'],
 'ancestralidade gigante':['Giant Ancestry','Ancestralidade Gigante'],
 'ancestralidade draconica':['Draconic Ancestor','Draconic Ancestry','Ancestral Dracônico','Ancestralidade Dracônica']
};
const SIZE_ALIASES={
 tiny:'Tiny','minusculo':'Tiny','minúsculo':'Tiny',
 small:'Small','pequeno':'Small','pequena':'Small',
 medium:'Medium','medio':'Medium','médio':'Medium','media':'Medium','média':'Medium',
 large:'Large','grande':'Large',huge:'Huge','enorme':'Huge',gargantuan:'Gargantuan','colossal':'Gargantuan'
};
let scheduled=false,refining=false,syncingPending=false;

function selectedSpecies(){return state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null}
function selectedLineage(species=selectedSpecies()){return arr(species?.lineages).find(x=>x.name===state.c?.choices?.species?.lineage)||null}
function canonicalSize(value){const key=fold(value).trim();return SIZE_ALIASES[key]||null}
function sizesFromText(value){const text=fold(value),found=[];for(const[key,canonical]of Object.entries(SIZE_ALIASES))if(new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^a-z]|$)`,'i').test(text)&&!found.includes(canonical))found.push(canonical);return found}

export function speciesSizeOptions(species,lineage=null){
 const raw=arr(lineage?.sizes).length?arr(lineage.sizes):arr(species?.sizes),out=[];
 for(const value of raw){const direct=canonicalSize(value);if(direct&&!out.includes(direct))out.push(direct);for(const parsed of sizesFromText(value))if(!out.includes(parsed))out.push(parsed)}
 if(!out.length){for(const value of KNOWN_SIZE_CHOICES[fold(species?.name)]||[])if(!out.includes(value))out.push(value)}
 return out.sort((a,b)=>SIZE_ORDER.indexOf(a)-SIZE_ORDER.indexOf(b))
}

export function genericLineageTraitNames(species,lineage=null){
 const names=new Set(arr(lineage?.replaceTraitNames).map(fold)),label=fold(species?.lineageLabel||'');
 if(label)names.add(label);for(const name of GENERIC_BY_LABEL[label]||[])names.add(fold(name));return names
}

function sizeLabel(size){return SIZE_LABELS[size]||size}
function ensureChoiceState(){if(!state.c)return null;state.c.choices=state.c.choices||{};state.c.choices.species=state.c.choices.species||{size:null,lineage:null};return state.c.choices.species}
function currentSizes(){const species=selectedSpecies(),lineage=selectedLineage(species);return speciesSizeOptions(species,lineage)}

function renderSizeChoice(){
 const box=$('especie-escolhas'),species=selectedSpecies(),choice=ensureChoiceState();if(!box||!choice)return;
 const sizes=species?currentSizes():[],existing=$('sp-size'),injected=box.querySelector('[data-refined-size-choice]');
 if(!species||sizes.length<=1){
  injected?.remove();if(existing){const label=existing.closest('label');if(label)label.hidden=true}
  if(sizes.length===1&&choice.size!==sizes[0]){choice.size=sizes[0];document.dispatchEvent(new CustomEvent('hub:species-choices-changed'))}
  else if(!sizes.length&&choice.size!=null)choice.size=null;
  return
 }
 if(!sizes.includes(choice.size))choice.size=null;
 let select=existing;
 if(!select){
  let grid=box.querySelector('.choice-grid');if(!grid){grid=document.createElement('div');grid.className='choice-grid';box.prepend(grid)}
  const label=document.createElement('label');label.dataset.refinedSizeChoice='';label.append('Tamanho');select=document.createElement('select');select.id='sp-size';label.appendChild(select);grid.prepend(label)
 }else{const label=select.closest('label');if(label)label.hidden=false}
 select.dataset.refinedSizeSelect='1';select.innerHTML='<option value="">Selecione</option>'+sizes.map(size=>`<option value="${size}" ${choice.size===size?'selected':''}>${sizeLabel(size)}</option>`).join('')
}

function sizePending(){const sizes=currentSizes(),choice=state.c?.choices?.species;if(sizes.length<=1||sizes.includes(choice?.size))return'';return`Raça: escolha o tamanho (${sizes.map(sizeLabel).join(' ou ')}).`}
function syncPending(){
 if(syncingPending)return;const box=$('pending');if(!box)return;syncingPending=true;
 try{
  box.querySelectorAll('[data-species-size-pending]').forEach(x=>x.remove());const message=sizePending();if(!message)return;
  box.className='status warning';let ul=box.querySelector('ul');if(!ul){box.innerHTML='<strong>Escolhas pendentes</strong><ul></ul>';ul=box.querySelector('ul')}
  const li=document.createElement('li');li.dataset.speciesSizePending='1';li.textContent=message;ul.appendChild(li)
 }finally{syncingPending=false}
}

function refineSpeciesFeatures(){
 if(refining)return;const host=$('species-features'),species=selectedSpecies(),lineage=selectedLineage(species);if(!host)return;refining=true;
 try{
  const old=host.querySelector('[data-selected-lineage-summary]');
  if(!species||!lineage){old?.remove();return}
  const generic=genericLineageTraitNames(species,lineage);
  for(const feature of host.querySelectorAll('details.feature:not([data-selected-lineage-summary])')){const summary=feature.querySelector('summary');if(summary&&generic.has(fold(summary.textContent)))feature.remove()}
  const label=species.lineageLabel||'Linhagem',key=`${label}|${lineage.name}`;
  let summary=host.querySelector('[data-selected-lineage-summary]');
  if(summary?.dataset.lineageKey!==key){summary?.remove();summary=document.createElement('details');summary.className='feature';summary.open=true;summary.dataset.selectedLineageSummary='1';summary.dataset.lineageKey=key;const head=document.createElement('summary');head.textContent=`${label}: ${lineage.name}`;const text=document.createElement('p');text.textContent='Opção escolhida para esta raça.';summary.append(head,text);host.appendChild(summary)}else if(summary!==host.lastElementChild)host.appendChild(summary)
 }finally{refining=false}
}

function render(){renderSizeChoice();syncPending();refineSpeciesFeatures()}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function bind(){
 const box=$('especie-escolhas');box?.addEventListener('change',e=>{const select=e.target.closest('[data-refined-size-select]');if(!select)return;const choice=ensureChoiceState();choice.size=select.value||null;syncPending();document.dispatchEvent(new CustomEvent('hub:species-choices-changed'))});
 for(const event of['hub:species-context-changed','hub:species-choices-changed','hub:species-state-invalidated'])document.addEventListener(event,schedule);
 $('new-character')?.addEventListener('click',()=>queueMicrotask(schedule));
 if(box)new MutationObserver(schedule).observe(box,{childList:true,subtree:true});
 const features=$('species-features');if(features)new MutationObserver(schedule).observe(features,{childList:true,subtree:true});
 const pending=$('pending');if(pending)new MutationObserver(()=>{if(sizePending()&&!pending.querySelector('[data-species-size-pending]'))schedule()}).observe(pending,{childList:true,subtree:true})
}

export function initSpeciesSelectionRefinementUi(){render();bind()}
