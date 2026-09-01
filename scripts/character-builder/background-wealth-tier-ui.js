import{state,fold}from'./state.js';
import{WEALTH_TIERS,backgroundWealthProfile}from'./starting-equipment-rules.js?v=20260828-wealth-background1';

const STANDARD_BACKGROUND_NAMES=new Set([
 'acolyte','acolito','artisan','artesao','charlatan','charlatao','criminal','criminoso',
 'entertainer','artista','farmer','fazendeiro','guard','guarda','guide','guia','hermit','eremita',
 'merchant','mercador','noble','nobre','sage','sabio','sailor','marinheiro','scribe','escriba',
 'soldier','soldado','wayfarer','viajante'
]);
const TIER_ORDER=['precaria','modesta','regular','estavel','prospera','privilegiada'];
const TIER_IDS=new Set(TIER_ORDER);
let initialized=false,lastBackgroundId=null,observer=null;

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

function fieldMarkup(bg,profile){
 if(isStandardWealthBackground(bg))return`<label id="bg-wealth-tier-field">Faixa econômica<input type="text" value="${profile.label} ×${profile.multiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}" readonly title="Classificação padrão definida pela Regra da Casa"></label>`;
 const options=TIER_ORDER.map(id=>WEALTH_TIERS[id]).map(t=>`<option value="${t.id}" ${t.id===profile.id?'selected':''}>${t.label} ×${t.multiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</option>`).join('');
 return`<label id="bg-wealth-tier-field">Faixa econômica<select id="bg-wealth-tier">${options}</select><small class="muted">Antecedentes sem classificação padrão usam Regular; altere quando a história do personagem justificar outra condição econômica.</small></label>`
}
function render(){
 const box=document.getElementById('antecedente-escolhas'),bg=currentBackground();if(!box||!bg)return;
 const profile=applyBackgroundWealthTier(bg),grid=box.querySelector('fieldset .choice-grid')||box.querySelector('.choice-grid');if(!profile||!grid)return;
 const old=document.getElementById('bg-wealth-tier-field');if(old)old.remove();grid.insertAdjacentHTML('beforeend',fieldMarkup(bg,profile));
 document.getElementById('bg-wealth-tier')?.addEventListener('change',event=>{const ch=choiceState(),selected=tierId(event.target.value)||'regular';if(!ch)return;ch.wealthTier=selected;ch.wealthTierBackgroundId=bg.id;bg.wealthTier=selected;document.dispatchEvent(new CustomEvent('hub:origin-context-changed',{detail:{characterId:state.c?.id||null,wealthTier:selected}}));document.dispatchEvent(new CustomEvent('hub:wealth-context-changed',{detail:{characterId:state.c?.id||null,wealthTier:selected}}))})
}
function scheduleRender(){queueMicrotask(()=>{const id=state.c?.refs?.background||null;if(id!==lastBackgroundId)lastBackgroundId=id;render()})}

export function initBackgroundWealthTierUi(){
 if(initialized)return;initialized=true;
 const select=document.getElementById('antecedente'),box=document.getElementById('antecedente-escolhas');
 select?.addEventListener('change',scheduleRender);document.addEventListener('hub:origin-context-changed',scheduleRender);
 if(box){observer=new MutationObserver(()=>{if(!document.getElementById('bg-wealth-tier-field'))scheduleRender()});observer.observe(box,{childList:true,subtree:true})}
 scheduleRender()
}
