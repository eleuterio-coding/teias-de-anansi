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

async function start(){
  let core;
  try{
    core=await import('./character-builder/ui.js?v=20260823-character-builder22');
    if(typeof core.init!=='function')throw new Error('O módulo principal não exporta init().');
    await core.init()
  }catch(error){
    warn('Falha ao iniciar o núcleo da Criação de Personagem.',error);
    return
  }

  const extensions=[
    ['./character-builder/spell-selection-ui.js?v=20260823-character-builder22','initSpellSelectionUi'],
    ['./character-builder/spell-quota-ui.js?v=20260823-character-builder22','initSpellQuotaUi'],
    ['./character-builder/profile-ui.js?v=20260823-character-builder22','initCharacterProfileUi'],
    ['./character-builder/species-trait-ui.js?v=20260823-character-builder22','initSpeciesTraitUi'],
    ['./character-builder/class-skill-ui.js?v=20260823-character-builder22','initClassSkillUi'],
    ['./character-builder/feat-ui.js?v=20260823-character-builder22','initFeatUi'],
    ['./character-builder/house-rules-ui.js?v=20260823-character-builder22','initHouseRulesUi'],
    ['./character-builder/language-ui.js?v=20260823-character-builder22','initLanguageUi']
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
