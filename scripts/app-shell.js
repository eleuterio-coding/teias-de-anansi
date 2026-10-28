
const LIBRARY_PAGES=new Set(["biblioteca-legado.html","regras.html","classes.html","classes-v3.html","subclasses.html","raca.html","especies.html","antecedentes.html","talentos.html","maestrias-de-arma.html","monstros.html","armaduras.html","armas.html","equipamentos-aventura.html","ferramentas.html","montarias-veiculos.html","comercio-e-despesas.html","bugigangas.html","itens-magicos.html","magias.html","idiomas.html","referencia.html"]);
const CHARACTER_PAGES=new Set(["criacao-personagem.html","ficha-personagem.html"]);
const SHELL_PAGES=new Set(["index.html","painel.html","campanhas.html","nova-campanha.html","mesa.html","sessoes.html","aventuras.html","personagens.html","lista-personagens.html","npcs.html","lista-npcs.html","bibliotecas.html","usuario.html","usuarios.html","configuracoes.html",...LIBRARY_PAGES,...CHARACTER_PAGES]);
const RECENT_KEY="hub-rpg:recent-pages:v1";
const NAV_ITEMS=[
 {page:"painel.html",aliases:["index.html"],label:"Início",icon:"home"},
 {page:"campanhas.html",label:"Campanhas",icon:"campaign"},
 {page:"aventuras.html",label:"Aventuras",icon:"map"},
 {page:"sessoes.html",label:"Sessões",icon:"calendar"},
 {page:"personagens.html",aliases:["lista-personagens.html"],label:"Personagens",icon:"users"},
 {page:"npcs.html",aliases:["lista-npcs.html"],label:"NPCs",icon:"player"},
 {page:"bibliotecas.html",label:"Biblioteca",icon:"library"}
];
const PAGE_LABELS={
 "index.html":"Hub","painel.html":"Início","campanhas.html":"Campanhas","nova-campanha.html":"Nova campanha","mesa.html":"Campanha",
 "sessoes.html":"Sessões","aventuras.html":"Aventuras","personagens.html":"Personagens",
 "lista-personagens.html":"Personagens","npcs.html":"NPCs","lista-npcs.html":"NPCs","bibliotecas.html":"Biblioteca","usuario.html":"Usuários","usuarios.html":"Gerenciar acessos","configuracoes.html":"Configurações"
};
const ICONS={
 home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
 campaign:'<path d="M5 4.5h14v15H5z"/><path d="M8 2.5v4M16 2.5v4M8 10h8M8 14h5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 library:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.2 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.7 8.2a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.8a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 9.4 2.1V2h4.2v.1A1.7 1.7 0 0 0 15 3.7a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8c.2.4.5.7.9.9.3.2.7.3 1.1.3h.1v4.2h-.1A1.7 1.7 0 0 0 19.4 15z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 star:'<path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17.03l-5.5 2.89 1.05-6.12L3.1 9.47l6.15-.9z"/>',
 player:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>'
};
function esc(value){return String(value??"").replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||ICONS.chevron)+"</svg>"}
function currentPage(){return location.pathname.split("/").pop()||"index.html"}
function shellEligible(){return SHELL_PAGES.has(currentPage())&&(currentPage()!=="usuarios.html"||Boolean(masterSession()?.isMaster))}
function pageLabel(page){page=page||currentPage();return page==='usuario.html'?userAreaLabel():PAGE_LABELS[page]||document.title.split(" - ")[0]||"Hub"}
function pageMatches(item,page){page=page||currentPage();if(item.page==="npcs.html"&&CHARACTER_PAGES.has(page)&&new URLSearchParams(location.search).get("npc")==="1")return true;if(item.page==="personagens.html"&&CHARACTER_PAGES.has(page)&&new URLSearchParams(location.search).get("npc")==="1")return false;return item.page===page||(item.aliases||[]).includes(page)||((page==="mesa.html"||page==="nova-campanha.html")&&item.page==="campanhas.html")||(LIBRARY_PAGES.has(page)&&item.page==="bibliotecas.html")||(CHARACTER_PAGES.has(page)&&item.page==="personagens.html")}
function readRecents(){try{const rows=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]");return Array.isArray(rows)?rows:[]}catch{return[]}}
function rememberCurrent(label){
 const page=currentPage();if(!shellEligible()||page==="index.html")return;
 const href=page+(location.search||""),clean=String(label||pageLabel(page)).trim()||pageLabel(page);
 const next=[{href:href,label:clean,page:page}].concat(readRecents().filter(function(row){return row&&row.href!==href})).slice(0,4);
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(next))}catch{}
}
function previewActive(){try{return Boolean(JSON.parse(localStorage.getItem("hub-rpg:master-preview:v1")||"null")?.username)}catch{return false}}
function masterSession(){try{return JSON.parse(localStorage.getItem("hub-rpg:collaboration-session:v1")||"null")}catch{return null}}
function masterNpcAccess(){return Boolean(masterSession()?.isMaster&&!previewActive())}
function userAreaLabel(){return masterNpcAccess()?'Usuários':'Usuário'}
function contextualAction(){
 if(previewActive())return null;
 const page=currentPage();
 
 if(page==="sessoes.html")return{label:"Nova sessão",href:"#session-create-card"};
 // A criação é acessada exclusivamente pelos cards dos menus de Personagens e NPCs.

 return null
}
function makeLink(item){
 const a=document.createElement("a");a.className="hub-nav-link";a.href=item.page;
 if(pageMatches(item))a.setAttribute("aria-current","page");
 a.innerHTML=icon(item.icon)+"<span>"+esc(item.label)+"</span>";return a
}
function renderRecents(){
 const box=document.querySelector("[data-hub-recents]");if(!box)return;
 const rows=readRecents().slice(0,3),signature=rows.map(function(r){return r.href+"|"+r.label}).join("||");
 if(box.dataset.signature===signature)return;box.dataset.signature=signature;box.replaceChildren();
 if(!rows.length){
  const empty=document.createElement("div");empty.className="hub-recent-link";empty.setAttribute("aria-disabled","true");
  empty.innerHTML=icon("star")+"<span>Acessos recentes</span>";box.appendChild(empty);return
 }
 rows.forEach(function(row){
  const a=document.createElement("a");a.className="hub-recent-link";a.href=row.href;
  a.innerHTML=icon(row.page==="mesa.html"?"campaign":"star")+"<span>"+esc(row.label)+"</span>";box.appendChild(a)
 })
}
function buildSidebar(){
 const aside=document.createElement("aside");aside.className="hub-sidebar";aside.dataset.hubSidebar="";
 const brand=document.createElement("a");brand.className="hub-brand";brand.href="painel.html";brand.setAttribute("aria-label","Ir para o início do Hub");
 brand.innerHTML='<span class="hub-brand-mark"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2 21 11 30 16 21 21 16 30 11 21 2 16 11 11Z" fill="currentColor" opacity=".28"/><path d="M16 5v22M5 16h22M10 10l12 12M22 10 10 22" stroke="currentColor" stroke-width="1.6"/></svg></span><strong>HUB</strong>';
 aside.appendChild(brand);
 const nav=document.createElement("nav");nav.className="hub-nav";nav.setAttribute("aria-label","Navegação principal");NAV_ITEMS.filter(item=>!item.masterOnly||masterNpcAccess()).forEach(function(item){nav.appendChild(makeLink(item))});aside.appendChild(nav);
 const spacer=document.createElement("div");spacer.className="hub-sidebar-spacer";aside.appendChild(spacer);
 const divider2=document.createElement("div");divider2.className="hub-sidebar-divider";aside.appendChild(divider2);
 const secondary=document.createElement("nav");secondary.className="hub-nav-secondary";secondary.setAttribute("aria-label","Navegação secundária");
 secondary.innerHTML='<a class="hub-nav-link" href="usuario.html">'+icon("player")+'<span>'+userAreaLabel()+'</span></a><a class="hub-nav-link" href="configuracoes.html">'+icon("settings")+'<span>Configurações</span></a>';
 if(currentPage()==="usuario.html"||currentPage()==="usuarios.html")secondary.querySelector('a[href="usuario.html"]')?.setAttribute("aria-current","page");
  if(currentPage()==="configuracoes.html")secondary.querySelector('a[href="configuracoes.html"]')?.setAttribute("aria-current","page");
 aside.appendChild(secondary);
 return aside
}
function breadcrumbTrail(label){
 const page=currentPage();
 const start=[{label:"Início",href:"painel.html"}];
 if(page==="painel.html"||page==="index.html")return[{label:"Início"}];
 const sections={
  "campanhas.html":"Campanhas","aventuras.html":"Aventuras","sessoes.html":"Sessões",
  "personagens.html":"Personagens","lista-personagens.html":"Personagens","npcs.html":"NPCs","lista-npcs.html":"NPCs",
  "bibliotecas.html":"Biblioteca","usuario.html":userAreaLabel(),"usuarios.html":"Gerenciar acessos","configuracoes.html":"Configurações"
 };
 if(page==="aventuras.html"&&new URLSearchParams(location.search).get("id")){
  const name=document.querySelector('#adventure-root .campaign-product-title-row h1')?.textContent?.trim();
  return[...start,{label:"Aventuras",href:"aventuras.html"},{label:name||"Aventura"}]
 }
 if(page==="sessoes.html"&&new URLSearchParams(location.search).get("id")){
  const context=document.querySelector('#sessions-list .campaign-product-kicker')?.textContent||'';
  const name=document.querySelector('#sessions-list .campaign-product-title-row h1')?.textContent?.trim()||"Sessão";
  const adventure=context.includes(' · Aventura: ')?context.split(' · Aventura: ')[1]:'';
  const adventureHref=document.querySelector('#sessions-list .session-product-hero a[href^="aventuras.html"]')?.getAttribute('href')||'aventuras.html';
  return[...start,{label:"Sessões",href:"sessoes.html"},...(adventure?[{label:adventure,href:adventureHref}]:[]),{label:name}]
 }
 if(page==="usuarios.html")return[...start,{label:"Usuários",href:"usuario.html"},{label:"Gerenciar acessos"}];
 if(sections[page])return[...start,{label:sections[page]}];
 if(page==="nova-campanha.html")return[...start,{label:"Campanhas",href:"campanhas.html"},{label:"Nova campanha"}];
 if(page==="mesa.html")return[...start,{label:"Campanhas",href:"campanhas.html"},{label:label&&label!=="Campanhas"?label:"Campanha"}];
 if(LIBRARY_PAGES.has(page))return[...start,{label:"Biblioteca",href:"bibliotecas.html"},{label:label||pageLabel(page)}];
 if(CHARACTER_PAGES.has(page)&&new URLSearchParams(location.search).get("npc")==="1")return[...start,{label:"NPCs",href:"npcs.html"},{label:page==="criacao-personagem.html"?"Criação de NPC":"Ficha de NPC"}];
 if(CHARACTER_PAGES.has(page))return[...start,{label:"Personagens",href:"personagens.html"},{label:label||pageLabel(page)}];
 return[...start,{label:label||pageLabel(page)}]
}
function renderBreadcrumb(label){
 const crumb=document.querySelector(".hub-breadcrumb");if(!crumb)return;
 const trail=breadcrumbTrail(label);
 const signature=trail.map(part=>(part.href||'')+'|'+part.label).join('>');
 if(crumb.dataset.breadcrumbSignature===signature)return;
 crumb.dataset.breadcrumbSignature=signature;
 crumb.innerHTML='<ol class="hub-breadcrumb-list">'+trail.map((part,index)=>{
  const current=index===trail.length-1;
  return '<li class="hub-breadcrumb-item">'+(current
   ?'<span aria-current="page">'+esc(part.label)+'</span>'
   :'<a href="'+esc(part.href)+'">'+esc(part.label)+'</a>')+'</li>'
 }).join('')+'</ol>'
}
function userIdentity(){
 const session=masterSession();if(!session?.username)return null;
 const name=session.username;
 let avatar='';
 try{const cache=JSON.parse(localStorage.getItem('hub-rpg:user-avatar-cache:v1')||'[]');const match=(Array.isArray(cache)?cache:[]).find(row=>String(row.username||'').toLowerCase()===name.toLowerCase());const source=match?.avatarDataUrl||'';if(/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(source))avatar=source}catch{}
 return{username:name,displayName:name.charAt(0).toLocaleUpperCase('pt-BR')+name.slice(1),avatar};
}
function updateTopbarIdentity(detail=null){
 const link=document.querySelector('[data-hub-user-link]'),identity=userIdentity();if(!link||!identity)return;
 const matching=detail&&String(detail.username||'').toLowerCase()===identity.username.toLowerCase();
 const shown=matching&&detail.displayName?String(detail.displayName):identity.displayName;
 const name=link.querySelector('[data-hub-user-name]'),picture=link.querySelector('[data-hub-user-picture]');
 if(name)name.textContent=shown;
 if(picture){
  picture.replaceChildren();
  const src=matching&&/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(detail.avatarDataUrl||'')?detail.avatarDataUrl:identity.avatar;
  if(src){const img=document.createElement('img');img.alt='';img.src=src;picture.append(img)}
  else picture.textContent=shown.charAt(0).toLocaleUpperCase('pt-BR');
 }
 link.setAttribute('aria-label','Abrir meu perfil de usuário: '+shown)
}
function buildTopbar(){
 const header=document.createElement("header");header.className="hub-global-topbar";
 const left=document.createElement("div");left.className="hub-topbar-left";
 const toggle=document.createElement("button");toggle.type="button";toggle.className="hub-icon-button hub-mobile-nav-toggle";toggle.dataset.hubMobileMenu="";toggle.setAttribute("aria-label","Abrir menu");toggle.innerHTML=icon("menu");left.appendChild(toggle);
 const crumb=document.createElement("nav");crumb.className="hub-breadcrumb";crumb.setAttribute("aria-label","Trilha de navegação");
 left.appendChild(crumb);header.appendChild(left);
 const actions=document.createElement("div");actions.className="hub-topbar-actions";
 const session=masterSession();if(session?.isMaster){const tools=document.createElement("div");tools.className="hub-master-tools";tools.dataset.hubMasterTools="";tools.hidden=true;tools.innerHTML='<span class="hub-master-tools-title">Mestre</span><label class="hub-master-control"><span>Usuário</span><select data-hub-preview-user aria-label="Visualizar o Hub como usuário"><option value="">Mestre</option></select></label>';actions.appendChild(tools)}
 const identity=userIdentity();if(identity){
  const profile=document.createElement('a');profile.href='usuario.html';profile.className='hub-topbar-user-link';profile.dataset.hubUserLink='';profile.title='Meu perfil';profile.innerHTML='<span class="hub-topbar-user-picture" data-hub-user-picture></span><span class="hub-topbar-user-copy"><small>Meu perfil</small><strong data-hub-user-name></strong></span>'+icon('chevron');actions.appendChild(profile)
 }
 const search=document.createElement("button");search.type="button";search.className="hub-icon-button";search.dataset.hubCommandOpen="";search.setAttribute("aria-label","Buscar");search.innerHTML=icon("search");actions.appendChild(search);
 const action=contextualAction();if(action){const a=document.createElement("a");a.className="hub-topbar-primary";a.href=action.href;a.innerHTML=icon("plus")+"<span>"+esc(action.label)+"</span>";actions.appendChild(a)}
 header.appendChild(actions);return header
}
function buildCommand(){
 const modal=document.createElement("div");modal.className="hub-command-backdrop";modal.dataset.hubCommand="";modal.hidden=true;
 modal.innerHTML='<div class="hub-command" role="dialog" aria-modal="true" aria-label="Busca rápida"><div class="hub-command-head">'+icon("search")+'<input class="hub-command-input" data-hub-command-input autocomplete="off" placeholder="Ir para uma área do Hub…"><span class="hub-command-close">Esc</span></div><div class="hub-command-results" data-hub-command-results></div></div>';
 document.body.appendChild(modal);return modal
}
function commandItems(){
 const base=NAV_ITEMS.filter(item=>!item.masterOnly||masterNpcAccess()).map(function(item){return{label:item.label,href:item.page,kind:"Área",icon:item.icon}});
 base.push({label:userAreaLabel(),href:"usuario.html",kind:"Área",icon:"player"},{label:"Configurações",href:"configuracoes.html",kind:"Área",icon:"settings"});if(masterNpcAccess())base.push({label:"Jogadores",href:"usuarios.html",kind:"Área",icon:"player"});if(!previewActive())base.push({label:"Criar personagem",href:"criacao-personagem.html",kind:"Ação",icon:"plus"});
 readRecents().slice(0,4).forEach(function(row){base.push({label:row.label,href:row.href,kind:"Recente",icon:row.page==="mesa.html"?"campaign":"star"})});
 document.querySelectorAll('.section-nav a[href^="#"]').forEach(function(link){base.push({label:link.textContent.trim(),href:link.getAttribute("href"),kind:"Nesta página",icon:"chevron"})});
 const seen=new Set();return base.filter(function(item){const key=item.href+"|"+item.label;if(seen.has(key))return false;seen.add(key);return true})
}
function renderCommand(query){
 const box=document.querySelector("[data-hub-command-results]");if(!box)return;
 const q=String(query||"").trim().toLocaleLowerCase("pt-BR");
 const items=commandItems().filter(function(item){return !q||(item.label+" "+item.kind).toLocaleLowerCase("pt-BR").includes(q)}).slice(0,18);
 box.innerHTML=items.length?items.map(function(item){return '<a class="hub-command-item" href="'+esc(item.href)+'"><span class="hub-command-item-main">'+icon(item.icon)+'<span class="hub-command-item-label">'+esc(item.label)+'</span></span><span class="hub-command-item-kind">'+esc(item.kind)+"</span></a>"}).join(""):'<div class="hub-command-empty">Nenhum resultado.</div>'
}
function openCommand(){
 const modal=document.querySelector("[data-hub-command]")||buildCommand(),input=modal.querySelector("[data-hub-command-input]");
 modal.hidden=false;renderCommand(input?input.value:"");requestAnimationFrame(function(){if(input)input.focus()})
}
function closeCommand(){const modal=document.querySelector("[data-hub-command]");if(modal)modal.hidden=true}
function bindShell(){
 document.querySelectorAll("[data-hub-command-open]").forEach(function(button){button.addEventListener("click",openCommand)});
 const modal=document.querySelector("[data-hub-command]")||buildCommand(),input=modal.querySelector("[data-hub-command-input]");
 if(input)input.addEventListener("input",function(){renderCommand(input.value)});
 modal.addEventListener("mousedown",function(event){if(event.target===modal)closeCommand()});
 const toggle=document.querySelector("[data-hub-mobile-menu]");if(toggle)toggle.addEventListener("click",function(){const sidebar=document.querySelector("[data-hub-sidebar]");if(sidebar)sidebar.classList.toggle("is-open")});
 document.addEventListener("click",function(event){const sidebar=document.querySelector("[data-hub-sidebar]");if(innerWidth<=760&&sidebar&&sidebar.classList.contains("is-open")&&!event.target.closest("[data-hub-sidebar]")&&!event.target.closest("[data-hub-mobile-menu]"))sidebar.classList.remove("is-open")});
 updateTopbarIdentity();
 window.addEventListener('hub-rpg:profile-photo-updated',event=>updateTopbarIdentity(event.detail));
 window.addEventListener("keydown",function(event){
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();openCommand()}
  if(event.key==="Escape")closeCommand()
 })
}
export function initAppShell(){
 if(!shellEligible()||document.querySelector(".hub-app-shell"))return;
 const movable=[...document.body.childNodes].filter(function(node){return !(node.nodeType===1&&node.tagName==="SCRIPT")});
 if(currentPage()==="usuarios.html")document.body.classList.remove("hub-login-page");
 const shell=document.createElement("div");shell.className="hub-app-shell";
 const sidebar=buildSidebar(),frame=document.createElement("div"),content=document.createElement("div");
 frame.className="hub-app-frame";content.className="hub-app-content";content.dataset.hubAppContent="";
 frame.appendChild(buildTopbar());frame.appendChild(content);shell.appendChild(sidebar);shell.appendChild(frame);
 document.body.insertBefore(shell,document.body.firstChild);movable.forEach(function(node){content.appendChild(node)});
 document.body.classList.add("hub-shell-enabled");if(currentPage()==="bibliotecas.html"||LIBRARY_PAGES.has(currentPage()))document.body.classList.add("hub-content-library");if(previewActive())document.body.classList.add("hub-master-preview");buildCommand();bindShell();renderRecents();updateAppShellContext();if(masterSession()?.isMaster)import("./master-tools.js?v=20261021-users-admin1").then(module=>module.initMasterTools?.()).catch(error=>console.warn("[Hub Mestre] topo:",error))
}
export function updateAppShellContext(){
 const shell=document.querySelector(".hub-app-shell");if(!shell)return;
 const content=shell.querySelector("[data-hub-app-content]"),heading=content?content.querySelector("h1"):null,fallback=pageLabel(),label=((heading&&heading.textContent)||fallback).trim();
 renderBreadcrumb(label);
 rememberCurrent(label);renderRecents()
}
