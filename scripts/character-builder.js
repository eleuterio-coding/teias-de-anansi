document.body?.classList.add('controles');
const loading=document.getElementById('loading');
const builder=document.getElementById('builder');
const warnings=document.getElementById('load-warnings');
function showBuilder(){if(loading){loading.textContent='';loading.hidden=true}if(builder)builder.hidden=false}
showBuilder();

const NativeMutationObserver=window.MutationObserver;
window.MutationObserver=class HubBuilderMutationObserver extends NativeMutationObserver{
  observe(target,options={}){
    if(target===document.body&&options?.subtree&&options?.characterData)return;
    return super.observe(target,options)
  }
};

function warn(label,error){
  console.error(`[character-builder] ${label}`,error);
  if(!warnings)return;
  warnings.hidden=false;
  const row=document.createElement('div');
  row.innerHTML=`<strong>${label}</strong>${error?`<br>${String(error.message||error)}`:''}`;
  warnings.appendChild(row)
}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fillMenu(id,items,placeholder,value){
  const el=document.getElementById(id);if(!el)return;
  const rows=(items||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  el.innerHTML=`<option value="">${esc(placeholder)}</option>${rows.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x.name)}</option>`).join('')}`
}
function updateCounts(state){
  const count=document.getElementById('catalog-counts');if(!count)return;
  const parts=[];
  if(state.catalogs.classes.length)parts.push(`${state.catalogs.classes.length} classes`);
  if(state.catalogs.species.length)parts.push(`${state.catalogs.species.length} raças/variantes`);
  if(state.catalogs.backgrounds.length)parts.push(`${state.catalogs.backgrounds.length} antecedentes`);
  count.textContent=parts.join(' · ')
}

async function preloadMainMenus(){
  try{
    const[stateMod,catalogMod]=await Promise.all([
      import('./character-builder/state.js'),
      import('./character-builder/catalogs.js')
    ]);
    const{state,loadCharacter,json}=stateMod;
    if(!state.c)state.c=loadCharacter();
    const[g,loc]=await Promise.all([
      json('dados/localizacao-ptbr-global.json').catch(()=>({})),
      json('dados/localizacao-ptbr-especies.json').catch(()=>({species:{},lineages:{},traits:{}}))
    ]);
    state.G=g;state.LOCSP=loc;showBuilder();

    const jobs=[
      {label:'Classes',key:'classes',id:'classe',placeholder:'Selecione a classe',load:()=>catalogMod.loadClasses()},
      {label:'Raças',key:'species',id:'especie',placeholder:'Selecione a raça',load:()=>catalogMod.loadSpecies()},
      {label:'Antecedentes',key:'backgrounds',id:'antecedente',placeholder:'Selecione o antecedente',load:()=>catalogMod.loadBackgrounds()}
    ];
    await Promise.all(jobs.map(async job=>{
      try{
        const items=await job.load();
        if(items?.length)state.catalogs[job.key]=items;
        fillMenu(job.id,state.catalogs[job.key],job.placeholder,job.key==='classes'?state.c.refs.class:job.key==='species'?state.c.refs.species:state.c.refs.background);
        updateCounts(state);showBuilder()
      }catch(error){
        fillMenu(job.id,state.catalogs[job.key],job.placeholder,null);warn(`${job.label} não puderam ser carregados.`,error);showBuilder()
      }
    }));
    return state
  }catch(error){warn('Falha no carregador independente dos menus principais.',error);showBuilder();return null}
}

async function start(){
  const menuPromise=preloadMainMenus();
  let core;
  try{
    core=await import('./character-builder/ui.js?v=20260823-character-builder24');
    if(typeof core.init!=='function')throw new Error('O módulo principal não exporta init().');
    const corePromise=core.init();
    showBuilder();
    await corePromise;
    showBuilder()
  }catch(error){
    warn('Falha ao iniciar o núcleo da Criação de Personagem.',error);
    await menuPromise;showBuilder();return
  }
  await menuPromise;showBuilder();

  const extensions=[
    ['./character-builder/spell-selection-ui.js?v=20260823-character-builder24','initSpellSelectionUi'],
    ['./character-builder/spell-quota-ui.js?v=20260823-character-builder24','initSpellQuotaUi'],
    ['./character-builder/profile-ui.js?v=20260823-character-builder24','initCharacterProfileUi'],
    ['./character-builder/species-trait-ui.js?v=20260823-character-builder24','initSpeciesTraitUi'],
    ['./character-builder/class-skill-ui.js?v=20260823-character-builder24','initClassSkillUi'],
    ['./character-builder/feat-ui.js?v=20260823-character-builder24','initFeatUi'],
    ['./character-builder/house-rules-ui.js?v=20260823-character-builder24','initHouseRulesUi'],
    ['./character-builder/language-ui.js?v=20260823-character-builder24','initLanguageUi']
  ];
  for(const[path,name]of extensions){
    try{
      const mod=await import(path);
      if(typeof mod[name]==='function')mod[name]();
      else warn(`Extensão sem inicializador: ${name}.`)
    }catch(error){warn(`Extensão opcional não carregada: ${name}.`,error)}
  }
  showBuilder()
}

start();
