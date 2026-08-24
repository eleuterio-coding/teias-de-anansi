document.body?.classList.add('controles');
const loading=document.getElementById('loading');
const builder=document.getElementById('builder');
const warnings=document.getElementById('load-warnings');
if(loading){loading.textContent='';loading.hidden=true}
if(builder)builder.hidden=false;

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
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function fillMenu(id,items,placeholder,value){
  const el=document.getElementById(id);if(!el)return;
  const rows=(items||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  el.innerHTML=`<option value="">${esc(placeholder)}</option>${rows.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x.name)}</option>`).join('')}`
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
    state.G=g;state.LOCSP=loc;
    const results=await Promise.allSettled([
      catalogMod.loadClasses(),catalogMod.loadSpecies(),catalogMod.loadBackgrounds()
    ]);
    if(results[0].status==='fulfilled'&&results[0].value.length)state.catalogs.classes=results[0].value;
    if(results[1].status==='fulfilled'&&results[1].value.length)state.catalogs.species=results[1].value;
    if(results[2].status==='fulfilled'&&results[2].value.length)state.catalogs.backgrounds=results[2].value;
    fillMenu('classe',state.catalogs.classes,'Selecione a classe',state.c.refs.class);
    fillMenu('especie',state.catalogs.species,'Selecione a raça',state.c.refs.species);
    fillMenu('antecedente',state.catalogs.backgrounds,'Selecione o antecedente',state.c.refs.background);
    const count=document.getElementById('catalog-counts');
    if(count&&state.catalogs.classes.length+state.catalogs.species.length+state.catalogs.backgrounds.length)count.textContent=`${state.catalogs.classes.length} classes · ${state.catalogs.species.length} raças/variantes · ${state.catalogs.backgrounds.length} antecedentes`;
    const failures=results.map((r,i)=>[r,['Classes','Raças','Antecedentes'][i]]).filter(([r])=>r.status==='rejected');
    for(const[r,label]of failures)warn(`${label} não puderam ser carregados.`,r.reason)
  }catch(error){warn('Falha no carregador independente dos menus principais.',error)}
}

async function start(){
  const menuPromise=preloadMainMenus();
  let core;
  try{
    core=await import('./character-builder/ui.js?v=20260823-character-builder23');
    if(typeof core.init!=='function')throw new Error('O módulo principal não exporta init().');
    await core.init()
  }catch(error){
    warn('Falha ao iniciar o núcleo da Criação de Personagem.',error);
    await menuPromise;
    return
  }
  await menuPromise;

  const extensions=[
    ['./character-builder/spell-selection-ui.js?v=20260823-character-builder23','initSpellSelectionUi'],
    ['./character-builder/spell-quota-ui.js?v=20260823-character-builder23','initSpellQuotaUi'],
    ['./character-builder/profile-ui.js?v=20260823-character-builder23','initCharacterProfileUi'],
    ['./character-builder/species-trait-ui.js?v=20260823-character-builder23','initSpeciesTraitUi'],
    ['./character-builder/class-skill-ui.js?v=20260823-character-builder23','initClassSkillUi'],
    ['./character-builder/feat-ui.js?v=20260823-character-builder23','initFeatUi'],
    ['./character-builder/house-rules-ui.js?v=20260823-character-builder23','initHouseRulesUi'],
    ['./character-builder/language-ui.js?v=20260823-character-builder23','initLanguageUi']
  ];
  for(const[path,name]of extensions){
    try{
      const mod=await import(path);
      if(typeof mod[name]==='function')mod[name]();
      else warn(`Extensão sem inicializador: ${name}.`)
    }catch(error){
      warn(`Extensão opcional não carregada: ${name}.`,error)
    }
  }
}

start();
