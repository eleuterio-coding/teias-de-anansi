import'../hub-ux.js?v=20260917-master-full-control1';
import{collaborationAccessMode,canOpenCharacter,canEditCharacter,readCollaborationSession}from'../collaboration-view.js?v=20260917-master-full-control1';
import{state}from'./state.js';
import{initWealthPurchaseCreationUi}from'./wealth-purchase-creation-ui.js?v=20260923-wealth-collapse1';
import{initBackgroundAbilityUi}from'./background-ability-ui.js?v=20260824-background-ability-fix1';
import{initHouseFeatPrereqUi}from'./house-feat-prereq-ui.js?v=20260824-house-feat-prereq1';
const STEPS=[
 {id:'classe',title:'Classe e Nível',description:'Defina a classe, o nível atual, a subclasse quando disponível, as perícias da classe e as magias.'},
 {id:'origem',title:'Origem',description:'Escolha o antecedente e complete os detalhes, características físicas, características pessoais e notas do personagem.'},
 {id:'raca',title:'Raça',description:'Escolha a raça e, quando existir, a variante, linhagem ou legado apropriado.'},
 {id:'atributos',title:'Valores de Atributos',description:'Distribua os valores-base. Os bônus de Origem, Raça, talentos e Regras da Casa são aplicados separadamente.'},
 {id:'progressao',title:'Progressão',description:'Escolha os talentos universais, aumentos de atributo da Regra da Casa e outros benefícios de progressão disponíveis.'},
 {id:'equipamento',title:'Equipamento',description:'Defina o equipamento inicial e ativo, faça as compras obrigatórias de criação quando aplicável, organize o inventário e confira as moedas restantes.'},
 {id:'revisao',title:'Revisão',description:'Confira a ficha consolidada, resolva pendências e salve o personagem.'}
];
let current=0,initialized=false,pendingLinkScheduled=false;
const byId=id=>document.getElementById(id);
const panels=()=>[...document.querySelectorAll('[data-wizard-panel]')];
const buttons=()=>[...document.querySelectorAll('[data-wizard-step]')];
const hashFor=id=>`#etapa-${id}`;
function stampPlayerOwnership(){const session=readCollaborationSession();if(!session||session.isMaster||!state.c)return;state.c.ownerUid=session.uid;state.c.ownerUsername=session.username}
function enforceCharacterEditAccess(){const mode=collaborationAccessMode();if(mode==='guest'){location.replace('usuarios.html?next=criacao-personagem.html');return false}const id=new URLSearchParams(location.search).get('id')||'';// Sem id, a conta autenticada está criando uma ficha nova; Jogadores têm a posse gravada no clique em Salvar.
if(!id)return true;if(canEditCharacter(id))return true;if(canOpenCharacter(id)){location.replace(`ficha-personagem.html?v=20260917-global-realtime1&id=${encodeURIComponent(id)}`);return false}location.replace('lista-personagens.html?v=20260917-global-realtime1');return false}
function ensureVisibleStepMenu(){
 if(byId('wizard-nav-no-scroll-style'))return;
 const style=document.createElement('style');style.id='wizard-nav-no-scroll-style';style.textContent=`
.wizard-nav{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;position:sticky!important;top:0!important;z-index:50!important;background:#fff!important}
.wizard-nav button{min-width:0!important;width:100%!important;white-space:normal!important}
@media(max-width:1120px){.wizard-nav{display:flex!important;grid-template-columns:none!important;overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;overscroll-behavior-inline:contain!important;scrollbar-width:thin!important;-webkit-overflow-scrolling:touch!important;padding-bottom:6px!important}.wizard-nav button{flex:0 0 160px!important;width:auto!important;min-height:54px!important}}
@media(max-width:560px){.wizard-nav button{flex-basis:min(72vw,180px)!important}}
.pending-link{color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px;font-weight:600;cursor:pointer}.pending-link:hover{text-decoration-thickness:2px}.pending-jump-target{outline:2px solid #b78416!important;outline-offset:4px;border-radius:8px;transition:outline-color .2s ease}.pending-link::after{content:' ↗';font-size:.78em}
`;document.head.appendChild(style)
}
function stepFromHash(){const raw=location.hash.replace(/^#etapa-/,'');const i=STEPS.findIndex(s=>s.id===raw);return i>=0?i:0}

function pendingRoute(message){
 const text=String(message||'').trim(),lower=text.toLocaleLowerCase('pt-BR');
 const levelMatch=text.match(/nível\s+(\d+)/i),level=levelMatch?Number(levelMatch[1]):null;
 if(/talento de origem/i.test(text))return{step:'origem',selector:'#bg-origin-feat'};
 if(/aumentos? \+2 e \+1|\+2 e \+1/i.test(text))return{step:'origem',selector:'#antecedente-escolhas'};
 if(/antecedente/i.test(text))return{step:'origem',selector:'#antecedente'};
 if(/idioma/i.test(text))return{step:'origem',selector:'#language-choices'};
 if(/para o traço /i.test(text))return{step:'raca',selector:'#especie-escolhas',trait:text.match(/para o traço (.+?)\.?$/i)?.[1]||''};
 if(/linhagem|legado/i.test(text))return{step:'raca',selector:'#sp-line'};
 if(/raça/i.test(text))return{step:'raca',selector:'#especie'};
 if(/para o talento /i.test(text))return{step:'progressao',selector:'#talentos-escolhas',feat:text.match(/para o talento (.+?)\.?$/i)?.[1]||''};
 if(/regra da casa: escolha o atributo que recebe \+1/i.test(text))return{step:'progressao',selector:'#talentos-escolhas',abilityLevel:level};
 if(/regra da casa: escolha o talento do nível/i.test(text))return{step:'progressao',selector:'#talentos-escolhas',featLevel:level};
 if(/talento/i.test(text))return{step:'progressao',selector:'#talentos-escolhas',featLevel:level};
 if(/^nível \d+: (?:escolha|conclua)/i.test(text)||/truque|magia|arcano místico|grimório|conjura/i.test(lower))return{step:'classe',selector:'#magias-escolhas',spellLevel:level};
 if(/subclasse/i.test(text))return{step:'classe',selector:'#subclasse'};
 if(/perícia\(s\) da classe|perícias? da classe/i.test(text))return{step:'classe',selector:'#classe-escolhas'};
 if(/classe/i.test(text))return{step:'classe',selector:'#classe'};
 if(/valor(?:es)? de atributo|distribui.*atributo/i.test(text))return{step:'atributos',selector:'[data-wizard-panel="atributos"] .base-grid'};
 if(/atributo/i.test(text))return{step:'atributos',selector:'[data-wizard-panel="atributos"] .base-grid'};
 if(/compras iniciais|po disponível|riqueza|saldo|armadura|escudo|arma|equipamento/i.test(text))return{step:'equipamento',selector:/compras|po disponível|riqueza|saldo/i.test(lower)?'#wealth-purchase-card':'#equipamento-escolhas'};
 return{step:'revisao',selector:'#pending'};
}
function specialPendingTarget(route){
 if(route.spellLevel){const button=document.querySelector(`#magias-escolhas [data-spell-level="${route.spellLevel}"]`);if(button&&!button.disabled){button.click();return document.querySelector('#magias-escolhas [data-spell-progression-ui]')||button}}
 if(route.abilityLevel){const el=document.querySelector(`.house-ability-select[data-house-ability-level="${route.abilityLevel}"]`);if(el)return el}
 if(route.featLevel){
  const labels=[...document.querySelectorAll('#talentos-escolhas label')],label=labels.find(x=>new RegExp(`Nível\\s+${route.featLevel}(?:\\D|$)`,'i').test(x.textContent||''));if(label)return label.querySelector('select,input,button,textarea')||label
 }
 if(route.feat){
  const cards=[...document.querySelectorAll('#talentos-escolhas [data-feat-instance-card]')],needle=route.feat.toLocaleLowerCase('pt-BR'),card=cards.find(x=>(x.querySelector('strong')?.textContent||'').trim().toLocaleLowerCase('pt-BR')===needle);if(card)return card.querySelector('select,input,button,textarea')||card
 }
 if(route.trait){
  const needle=route.trait.toLocaleLowerCase('pt-BR'),nodes=[...document.querySelectorAll('#especie-escolhas fieldset,#especie-escolhas .feature,#especie-escolhas label')],node=nodes.find(x=>(x.textContent||'').toLocaleLowerCase('pt-BR').includes(needle));if(node)return node.querySelector('select,input,button,textarea')||node
 }
 return null
}
function jumpToPending(message){
 const route=pendingRoute(message),index=STEPS.findIndex(step=>step.id===route.step);if(index<0)return;
 current=index;render({scroll:false});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const target=specialPendingTarget(route)||document.querySelector(route.selector)||document.querySelector(`[data-wizard-panel="${route.step}"]`);if(!target)return;
  target.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
  const focusable=target.matches?.('select,input,button,textarea,a[href]')?target:target.querySelector?.('select,input,button,textarea,a[href]');
  focusable?.focus?.({preventScroll:true});
  const highlight=target.matches?.('label')?target:(target.closest?.('label')||target);highlight.classList?.add('pending-jump-target');setTimeout(()=>highlight.classList?.remove('pending-jump-target'),1800)
 }))
}
function decoratePendingLinks(){
 pendingLinkScheduled=false;const pending=byId('pending');if(!pending)return;
 for(const li of pending.querySelectorAll('li')){
  if(li.querySelector(':scope > .pending-link'))continue;
  const message=li.textContent.trim();if(!message)continue;
  const route=pendingRoute(message),link=document.createElement('a');link.href=hashFor(route.step);link.className='pending-link';link.dataset.pendingMessage=message;link.textContent=message;link.title='Ir diretamente para esta pendência';link.addEventListener('click',event=>{event.preventDefault();jumpToPending(message)});
  li.textContent='';li.appendChild(link)
 }
}
function schedulePendingLinks(){if(pendingLinkScheduled)return;pendingLinkScheduled=true;queueMicrotask(()=>{decoratePendingLinks();updateReviewState()})}
function updateReviewState(){const pending=byId('pending'),button=document.querySelector('[data-wizard-step="revisao"]');if(!button)return;const hasPending=!!pending?.querySelector('li');button.classList.toggle('has-warning',hasPending);button.title=hasPending?'Há escolhas pendentes na revisão.':''}
function render({writeHash=true,scroll=true}={}){
 current=Math.max(0,Math.min(STEPS.length-1,current));const step=STEPS[current];
 for(const panel of panels())panel.hidden=panel.dataset.wizardPanel!==step.id;
 for(const button of buttons()){
  const active=button.dataset.wizardStep===step.id;button.classList.toggle('is-active',active);button.setAttribute('aria-current',active?'step':'false');if(active)button.scrollIntoView({block:'nearest',inline:'center'})
 }
 const kicker=byId('wizard-kicker'),title=byId('wizard-title'),description=byId('wizard-description'),progress=byId('wizard-progress'),prev=byId('wizard-prev'),next=byId('wizard-next');
 if(kicker)kicker.textContent=`Etapa ${current+1} de ${STEPS.length}`;
 if(title)title.textContent=step.title;
 if(description)description.textContent=step.description;
 if(progress)progress.value=current+1;
 if(prev)prev.disabled=current===0;
 if(next){next.hidden=current===STEPS.length-1;next.textContent=current===STEPS.length-2?'Revisar personagem':'Próximo'}
 if(writeHash&&location.hash!==hashFor(step.id))history.replaceState(null,'',`${location.pathname}${location.search}${hashFor(step.id)}`);
 updateReviewState();
 if(scroll)document.querySelector('.wizard-shell')?.scrollIntoView({block:'start',behavior:'smooth'})
}
function go(index){current=index;render()}
function bind(){
 for(const button of buttons())button.addEventListener('click',()=>{const i=STEPS.findIndex(s=>s.id===button.dataset.wizardStep);if(i>=0)go(i)});
 byId('wizard-prev')?.addEventListener('click',()=>go(current-1));
 byId('wizard-next')?.addEventListener('click',()=>go(current+1));
 byId('save')?.addEventListener('click',stampPlayerOwnership,true);
 byId('new-character')?.addEventListener('click',()=>queueMicrotask(()=>{current=0;render()}));
 addEventListener('hashchange',()=>{current=stepFromHash();render({writeHash:false})});
 const pending=byId('pending');if(pending)new MutationObserver(schedulePendingLinks).observe(pending,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});schedulePendingLinks()
}
export function initWizardUi(){if(initialized)return;initialized=true;if(!enforceCharacterEditAccess())return;ensureVisibleStepMenu();current=stepFromHash();bind();render({writeHash:!location.hash,scroll:false});initBackgroundAbilityUi();initHouseFeatPrereqUi();initWealthPurchaseCreationUi()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWizardUi,{once:true});else initWizardUi();