import{SOURCE_AUTHORITIES,HOUSE_RULE_PRESETS,readSettings,writeSettings,resetSettings,applyUiPreferences}from'./settings-state.js?v=20260905-settings1';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=readSettings(),houseRuleNames=[];

async function loadHouseRules(){
 try{
  const [hub,extra]=await Promise.all([
   fetch('dados/regras-hub.json',{cache:'no-store'}).then(r=>r.ok?r.json():null),
   fetch('dados/regras-casa-adicionais.json',{cache:'no-store'}).then(r=>r.ok?r.json():null)
  ]);
  const names=[];
  for(const row of extra?.itens||[])if(row?.nome)names.push(String(row.nome));
  for(const row of hub?.itens||[])if(String(row?.familia||'').toLowerCase().includes('regra da casa')&&row?.nome)names.push(String(row.nome));
  houseRuleNames=[...new Set(names)].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 }catch{houseRuleNames=[]}
 renderRuleChecklist()
}

function renderSources(){
 const box=$('source-options');if(!box)return;
 const enabled=new Set(current.sources.enabled);
 box.innerHTML=SOURCE_AUTHORITIES.map(row=>`<label class="choice"><input type="checkbox" name="source" value="${esc(row.id)}" ${enabled.has(row.id)?'checked':''}><span><strong>${esc(row.label)}</strong><small>Incluída no perfil normativo padrão do Hub.</small></span></label>`).join('')
}
function renderPreset(){
 const select=$('house-preset');if(!select)return;
 select.innerHTML=HOUSE_RULE_PRESETS.map(row=>`<option value="${esc(row.id)}">${esc(row.label)}</option>`).join('');
 select.value=current.houseRules.preset;
 const note=$('preset-note'),preset=HOUSE_RULE_PRESETS.find(x=>x.id===current.houseRules.preset);
 if(note)note.textContent=preset?.description||'';
 renderRuleChecklist()
}
function renderRuleChecklist(){
 const box=$('house-rule-options');if(!box)return;
 const custom=current.houseRules.preset==='mesa-personalizada';
 box.hidden=!custom;
 if(!custom)return;
 const enabled=new Set(current.houseRules.enabled);
 box.innerHTML=houseRuleNames.length?houseRuleNames.map(name=>`<label class="choice"><input type="checkbox" name="house-rule" value="${esc(name)}" ${enabled.has(name)?'checked':''}><span>${esc(name)}</span></label>`).join(''):'<p class="mini">Não foi possível carregar o catálogo de Regras da Casa. O preset pode ser salvo, mas a seleção detalhada ficará vazia.</p>'
}
function fill(){
 $('workspace').value=current.workspace;
 $('sheet-density').value=current.sheet.density;
 $('show-sources').checked=current.sheet.showSources;
 $('sticky-sections').checked=current.sheet.stickySections;
 $('font-scale').value=current.accessibility.fontScale;
 $('contrast').value=current.accessibility.contrast;
 $('motion').value=current.accessibility.motion;
 $('default-dm').value=current.campaignDefaults.dmName;
 $('default-setting').value=current.campaignDefaults.setting;
 $('default-system').value=current.campaignDefaults.system;
 renderSources();renderPreset();applyUiPreferences(current)
}
function collect(){
 const sourceEnabled=[...document.querySelectorAll('input[name="source"]:checked')].map(x=>x.value);
 const customRules=[...document.querySelectorAll('input[name="house-rule"]:checked')].map(x=>x.value);
 return{
  ...current,
  workspace:$('workspace').value,
  sources:{enabled:sourceEnabled},
  houseRules:{preset:$('house-preset').value,enabled:$('house-preset').value==='mesa-personalizada'?customRules:[]},
  sheet:{density:$('sheet-density').value,showSources:$('show-sources').checked,stickySections:$('sticky-sections').checked},
  accessibility:{fontScale:$('font-scale').value,contrast:$('contrast').value,motion:$('motion').value},
  campaignDefaults:{dmName:$('default-dm').value,setting:$('default-setting').value,system:$('default-system').value}
 }
}
function setStatus(text,kind='ok'){const el=$('settings-status');if(!el)return;el.textContent=text;el.dataset.kind=kind}
function save(){
 current=writeSettings(collect());fill();setStatus('Configurações salvas. Preferências visuais já foram aplicadas; os defaults serão usados nas próximas Mesas.')
}
function reset(){
 if(!confirm('Restaurar todas as configurações padrão do Hub? Personagens e Mesas não serão alterados.'))return;
 current=resetSettings();fill();setStatus('Configurações padrão restauradas.')
}
function init(){
 current=readSettings();fill();loadHouseRules();
 $('save-settings')?.addEventListener('click',save);
 $('reset-settings')?.addEventListener('click',reset);
 $('house-preset')?.addEventListener('change',()=>{current={...current,houseRules:{...current.houseRules,preset:$('house-preset').value}};renderPreset()});
 for(const id of['font-scale','contrast','motion','sheet-density','show-sources','sticky-sections'])$(id)?.addEventListener('change',()=>applyUiPreferences(collect()));
 const key=$('storage-key');if(key)key.textContent='hub-rpg:settings:v1'
}
init();
