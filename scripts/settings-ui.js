import{readSettings,writeSettings,resetSettings,applyUiPreferences}from'./settings-state.js?v=20261022-settings-unified1';
const $=id=>document.getElementById(id);
let current=readSettings();
function fill(){
 $('workspace').value=current.workspace;
 $('sheet-density').value=current.sheet.density;
 $('show-sources').checked=current.sheet.showSources;
 $('sticky-sections').checked=current.sheet.stickySections;
 $('font-scale').value=current.accessibility.fontScale;
 $('contrast').value=current.accessibility.contrast;
 $('motion').value=current.accessibility.motion;
 applyUiPreferences(current);
}
function collect(){
 return{
  ...current,
  workspace:$('workspace').value,
  sheet:{
   ...current.sheet,
   density:$('sheet-density').value,
   showSources:$('show-sources').checked,
   stickySections:$('sticky-sections').checked
  },
  accessibility:{
   ...current.accessibility,
   fontScale:$('font-scale').value,
   contrast:$('contrast').value,
   motion:$('motion').value
  }
 };
}
function setStatus(message,kind='ok'){const el=$('settings-status');if(!el)return;el.textContent=message;el.dataset.kind=kind}
function save(){current=writeSettings(collect());fill();setStatus('Configurações salvas.')}
function reset(){
 if(!confirm('Restaurar as preferências padrão do Hub? Personagens e Campanhas não serão alterados.'))return;
 current=resetSettings();fill();setStatus('Configurações padrão restauradas.')
}
current=readSettings();fill();
$('save-settings')?.addEventListener('click',save);
$('reset-settings')?.addEventListener('click',reset);
for(const id of['workspace','sheet-density','show-sources','sticky-sections','font-scale','contrast','motion'])$(id)?.addEventListener('change',()=>applyUiPreferences(collect()));
