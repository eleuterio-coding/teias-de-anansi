import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20260824-wealth-by-level1';
const STEPS=[
 {id:'classe',title:'Classe e Nível',description:'Defina a classe, o nível atual, a subclasse quando disponível, as perícias da classe e as magias.'},
 {id:'origem',title:'Origem',description:'Escolha o antecedente e complete os detalhes, características físicas, características pessoais e notas do personagem.'},
 {id:'raca',title:'Raça',description:'Escolha a raça e, quando existir, a variante, linhagem ou legado apropriado.'},
 {id:'atributos',title:'Valores de Atributos',description:'Distribua os valores-base. Os bônus de Origem, Raça, talentos e Regras da Casa são aplicados separadamente.'},
 {id:'progressao',title:'Progressão',description:'Escolha os talentos universais, aumentos de atributo da Regra da Casa e outros benefícios de progressão disponíveis.'},
 {id:'equipamento',title:'Equipamento',description:'Defina o equipamento inicial e ativo, faça as compras obrigatórias de criação quando aplicável, organize o inventário e confira as moedas restantes.'},
 {id:'revisao',title:'Revisão',description:'Confira a ficha consolidada, resolva pendências e salve o personagem.'}
];
let current=0,initialized=false;
const byId=id=>document.getElementById(id);
const panels=()=>[...document.querySelectorAll('[data-wizard-panel]')];
const buttons=()=>[...document.querySelectorAll('[data-wizard-step]')];
const hashFor=id=>`#etapa-${id}`;
function stepFromHash(){const raw=location.hash.replace(/^#etapa-/,'');const i=STEPS.findIndex(s=>s.id===raw);return i>=0?i:0}
function updateReviewState(){const pending=byId('pending'),button=document.querySelector('[data-wizard-step="revisao"]');if(!button)return;const hasPending=!!pending?.querySelector('li');button.classList.toggle('has-warning',hasPending);button.title=hasPending?'Há escolhas pendentes na revisão.':''}
function render({writeHash=true,scroll=true}={}){
 current=Math.max(0,Math.min(STEPS.length-1,current));const step=STEPS[current];
 for(const panel of panels())panel.hidden=panel.dataset.wizardPanel!==step.id;
 for(const button of buttons()){
  const active=button.dataset.wizardStep===step.id;button.classList.toggle('is-active',active);button.setAttribute('aria-current',active?'step':'false')
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
 byId('new-character')?.addEventListener('click',()=>queueMicrotask(()=>{current=0;render()}));
 addEventListener('hashchange',()=>{current=stepFromHash();render({writeHash:false})});
 const pending=byId('pending');if(pending)new MutationObserver(updateReviewState).observe(pending,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
}
export function initWizardUi(){if(initialized)return;initialized=true;current=stepFromHash();bind();render({writeHash:!location.hash,scroll:false});initWealthPurchaseUi()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWizardUi,{once:true});else initWizardUi();
