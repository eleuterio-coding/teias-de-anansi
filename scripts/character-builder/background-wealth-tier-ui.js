import{state,fold}from'./state.js';
import{WEALTH_TIERS,backgroundWealthProfile}from'./starting-equipment-rules.js?v=20260922-wealth-class3';

const STANDARD_BACKGROUND_NAMES=new Set([
 'acolyte','acolito','artisan','artesao','charlatan','charlatao','criminal','criminoso',
 'entertainer','artista','farmer','fazendeiro','guard','guarda','guide','guia','hermit','eremita',
 'merchant','mercador','noble','nobre','sage','sabio','sailor','marinheiro','scribe','escriba',
 'soldier','soldado','wayfarer','viajante','urchin','orfao','outlander','forasteiro'
]);
const TIER_IDS=new Set(Object.keys(WEALTH_TIERS));
let initialized=false;

function currentBackground(){return state.catalogs.backgrounds.find(x=>x.id===state.c?.refs?.background)||null}
function tierId(value){const key=fold(value).replace(/[^a-z]/g,'');return TIER_IDS.has(key)?key:''}
export function isStandardWealthBackground(bg){return[bg?.name,bg?.nome,bg?.pt,bg?.originalName,bg?.original_name].map(fold).some(name=>STANDARD_BACKGROUND_NAMES.has(name))}
function catalogTier(bg){return tierId(bg?._catalogWealthTier||bg?.wealthTier||bg?.wealth_tier||bg?.faixaEconomica||bg?.faixa_economica)}
function ensureOriginalTier(bg){if(!bg||Object.prototype.hasOwnProperty.call(bg,'_catalogWealthTier'))return;bg._catalogWealthTier=catalogTier(bg)}
function restoreCatalogTier(bg){if(!bg)return;ensureOriginalTier(bg);if(bg._catalogWealthTier)bg.wealthTier=bg._catalogWealthTier;else delete bg.wealthTier}
function choiceState(){if(!state.c)return null;state.c.choices=state.c.choices||{};return state.c.choices.background||(state.c.choices.background={})}

export function applyBackgroundWealthTier(bg=currentBackground()){
 const ch=choiceState();if(!bg||!ch)return null;ensureOriginalTier(bg);
 if(isStandardWealthBackground(bg)){
  restoreCatalogTier(bg);ch.wealthTier=null;ch.wealthTierBackgroundId=null;return backgroundWealthProfile(bg)
 }
 if(ch.wealthTierBackgroundId!==bg.id){ch.wealthTier=catalogTier(bg)||'regular';ch.wealthTierBackgroundId=bg.id}
 const chosen=tierId(ch.wealthTier)||catalogTier(bg)||'regular';ch.wealthTier=chosen;bg.wealthTier=chosen;return backgroundWealthProfile(bg)
}

function sync(){
 const old=document.getElementById('bg-wealth-tier-field');if(old)old.remove();
 applyBackgroundWealthTier()
}
export function initBackgroundWealthTierUi(){
 if(initialized)return;initialized=true;
 document.getElementById('antecedente')?.addEventListener('change',()=>queueMicrotask(sync));
 document.addEventListener('hub:origin-context-changed',()=>queueMicrotask(sync));
 document.addEventListener('hub:new-character',()=>queueMicrotask(sync));
 sync()
}
