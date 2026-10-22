import{readCampaigns}from'./campaign-state.js?v=20261022-roster2';
import{readAdventures}from'./adventure-state.js?v=20261016-current-status2';
import{collaborationAccessMode,sharedCampaignRows,sharedAdventures}from'./collaboration-view.js?v=20261021-ficha-permissao3';
import{esc,nameSort}from'./roster-context.js?v=20261022-roster2';
const params=new URLSearchParams(location.search);
const kind=location.pathname.split('/').pop()==='lista-npcs.html'?'npcs':'personagens';
const mode=params.get('mode')||((params.has('campaign'))?'campanhas':(params.has('adventure')?'aventuras':'fichas'));
const queryCampaign=params.get('campaign')||'',queryAdventure=params.get('adventure')||'';
const base=kind==='npcs'?'lista-npcs.html':'lista-personagens.html';
const title=kind==='npcs'?'NPCs':'Personagens';
const picker=document.getElementById('roster-picker'),result=document.getElementById('roster-results');
function available(){
 const access=collaborationAccessMode();
 const campaigns=access==='master'?readCampaigns():access==='player'?sharedCampaignRows().map(r=>r.campaign):[];
 const ids=new Set(campaigns.map(c=>c.id));
 const adventures=(access==='master'?readAdventures():access==='player'?sharedAdventures():[]).filter(a=>ids.has(a.campaignId));
 return{campaigns,adventures}
}
function renderPicker(){
 const{campaigns,adventures}=available();
 const selectedCampaign=campaigns.find(c=>c.id===queryCampaign)||null,selectedAdventure=adventures.find(a=>a.id===queryAdventure)||null;
 const scope={kind,mode,selectedCampaign:mode==='campanhas'?selectedCampaign:(selectedAdventure?campaigns.find(c=>c.id===selectedAdventure.campaignId)||null:null),selectedAdventure:mode==='aventuras'?selectedAdventure:null,showResults:mode==='fichas'||(mode==='campanhas'&&Boolean(selectedCampaign))||(mode==='aventuras'&&Boolean(selectedAdventure))};
 window.__HUB_ROSTER_SCOPE__=scope;
 if(result)result.hidden=!scope.showResults;
 if(picker&&mode!=='fichas'){
  picker.hidden=false;
  const rows=mode==='campanhas'?[...campaigns].sort(nameSort):[...adventures].sort((a,b)=>(a.order||0)-(b.order||0)||nameSort(a,b));
  const chosen=scope.selectedCampaign||scope.selectedAdventure;
  const label=mode==='campanhas'?'campanha':'aventura',plural=mode==='campanhas'?'Campanhas':'Aventuras';
  const cards=rows.map(row=>{
   const campaign=mode==='aventuras'?campaigns.find(c=>c.id===row.campaignId):row;
   const url=mode==='campanhas'?base+'?mode=campanhas&campaign='+encodeURIComponent(row.id):base+'?mode=aventuras&adventure='+encodeURIComponent(row.id);
   const name=row.name||row.title||plural;
   const detail=mode==='campanhas'?row.description||'Selecione para consultar o elenco desta campanha.':(campaign?.name||'Campanha não informada')+' · '+(row.description||'Consulte o elenco vinculado.');
   return'<a class="hub-roster-choice'+(chosen?.id===row.id?' is-selected':'')+'" href="'+esc(url)+'"'+(chosen?.id===row.id?' aria-current="page"':'')+'><span class="hub-roster-choice-label">'+esc(name)+'</span><span class="hub-roster-choice-description">'+esc(detail)+'</span><span class="hub-roster-choice-cta">Ver '+title+' →</span></a>';
  }).join('');
  picker.innerHTML='<div class="hub-roster-picker-header"><div><h2>Selecionar '+label+'</h2><p>Escolha uma '+label+' para ver apenas '+(kind==='npcs'?'os NPCs':'os personagens')+' vinculados.</p></div><a class="btn secondary" href="'+esc(base)+'?mode='+mode+'">Alterar seleção</a></div>'+
  (chosen?'<p class="hub-roster-current">Selecionado: <strong>'+esc(chosen.name||chosen.title)+'</strong></p>':'')+
  (rows.length?'<div class="hub-roster-choice-grid">'+cards+'</div>':'<p class="hub-directory-empty">Nenhuma '+label+' disponível para esta conta.</p>')+
  ((!chosen&&(queryCampaign||queryAdventure))?'<p class="hub-roster-alert" role="status">A seleção não está disponível para sua conta.</p>':'');
 }
 window.dispatchEvent(new CustomEvent('hub-rpg:roster-scope',{detail:scope}));
}
renderPicker();
window.addEventListener('hub-rpg:remote-updated',renderPicker);
window.addEventListener('hub-rpg:collaboration-session-changed',renderPicker);
