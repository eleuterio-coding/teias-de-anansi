import{state,$,num,esc,read,write,signed}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js';
import{ensureGameplayState,setGameplayField}from'./character-sheet-gameplay-state.js?v=20260901-gameplay1';
import'./character-sheet-level-up-input-guard.js?v=20260901-level-up1';
import'./character-sheet-level-up-ui.js?v=20260901-level-up1';
import'./character-sheet-inventory-ui.js?v=20260901-campaign-inventory1';

let initialized=false,saveTimer=null,dirty=false;
const AUTOSAVE_MS=450;

function persistNow(message='Salvo automaticamente.'){
 if(!state.c)return false;
 const list=read(),i=list.findIndex(x=>x.id===state.c.id);
 state.c.updatedAt=new Date().toISOString();
 if(i>=0)list[i]=state.c;else list.push(state.c);
 write(list);dirty=false;
 renderSaveState(message);
 return true
}
function renderSaveState(message){
 const stamp=state.c?.updatedAt?new Date(state.c.updatedAt):null,time=stamp&&!Number.isNaN(stamp.getTime())?stamp.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'';
 const text=`${message}${time?` ${time}`:''}`;
 const footer=$('save-status'),top=$('game-save-state');if(footer)footer.textContent=text;if(top)top.textContent=text
}
function scheduleSave(){
 if(!state.c)return;dirty=true;renderSaveState('Alterações pendentes…');clearTimeout(saveTimer);saveTimer=setTimeout(()=>persistNow(),AUTOSAVE_MS)
}
function flushSave(message='Salvo automaticamente.'){clearTimeout(saveTimer);saveTimer=null;if(dirty)persistNow(message)}
function metric(label,value,href){return`<a class="game-metric" href="${href}"><span>${esc(label)}</span><strong>${esc(value)}</strong></a>`}
function renderLive(){
 const box=$('game-live-bar');if(!box||!state.c)return;let d;try{d=derive()}catch{return}const r=state.c.sheet?.runtime||{},conditions=Array.isArray(r.conditions)?r.conditions:[];
 box.innerHTML=metric('PV',`${r.currentHp==null?d.hp??'—':num(r.currentHp)}/${d.hp??'—'}`,'#combate')+metric('PV temp.',num(r.tempHp)||'—','#combate')+metric('CA',d.ac??'—','#combate')+metric('Iniciativa',signed(d.initiative||0),'#resumo')+metric('Inspiração',r.inspiration?'Sim':'Não','#combate')+metric('Exaustão',num(r.exhaustion),'#estado')+metric('Condições',conditions.length?conditions.length:'Nenhuma','#estado')
}
function injectStyle(){
 if(document.getElementById('gameplay-sheet-style'))return;const style=document.createElement('style');style.id='gameplay-sheet-style';style.textContent=`.game-live-wrap{border:1px solid var(--b);border-radius:14px;padding:10px 12px;background:#fff}.game-live-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}.game-live-head strong{font-size:.92rem}.game-live-head span{font-size:.78rem;color:var(--muted)}.game-live-bar{display:grid;grid-template-columns:repeat(7,minmax(90px,1fr));gap:7px}.game-metric{border:1px solid var(--b);border-radius:9px;padding:8px;text-decoration:none;background:var(--soft)}.game-metric span{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.03em;color:var(--muted)}.game-metric strong{display:block;margin-top:2px}.session-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.session-grid .wide{grid-column:1/-1}.gameplay-note{margin:0;color:var(--muted);font-size:.84rem}@media(max-width:980px){.game-live-bar{grid-template-columns:repeat(4,1fr)}}@media(max-width:620px){.game-live-bar,.session-grid{grid-template-columns:1fr 1fr}.session-grid .wide{grid-column:1/-1}.game-live-head{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(style)
}
function injectGameChrome(){
 const sheet=$('sheet');if(!sheet)return false;injectStyle();
 const eyebrow=document.querySelector('.hero .eyebrow');if(eyebrow)eyebrow.textContent='Ficha digital · Modo de jogo';
 const edit=$('edit-link');if(edit){edit.textContent='Editar estrutura';edit.title='Use o construtor apenas para corrigir escolhas estruturais da criação. A vida do personagem é administrada nesta ficha.'}
 const hero=document.querySelector('.hero');if(hero&&!$('game-live-wrap')){const wrap=document.createElement('section');wrap.id='game-live-wrap';wrap.className='game-live-wrap';wrap.innerHTML='<div class="game-live-head"><strong>Estado atual</strong><span id="game-save-state">Carregando estado…</span></div><div id="game-live-bar" class="game-live-bar"></div>';hero.after(wrap)}
 const nav=document.querySelector('.section-nav');if(nav&&!nav.querySelector('a[href="#sessao"]')){const a=document.createElement('a');a.href='#sessao';a.textContent='Sessão';const combat=nav.querySelector('a[href="#combate"]');nav.insertBefore(a,combat||null)}
 if(!$('sessao')){const section=document.createElement('section');section.id='sessao';section.className='card';section.innerHTML='<h2>Sessão</h2><p class="gameplay-note">Área operacional da ficha. Estas informações são salvas automaticamente e não alteram as escolhas estruturais da criação.</p><div class="session-grid" style="margin-top:12px"><label>Objetivo atual<input id="game-objective" data-gameplay-field="objective" placeholder="O que o personagem está tentando alcançar agora?"></label><label>Local / cena<input id="game-scene" data-gameplay-field="scene" placeholder="Onde o personagem está?"></label><label class="wide">Notas rápidas<textarea id="game-notes" data-gameplay-field="notes" placeholder="Pistas, NPCs, acontecimentos e informações da sessão."></textarea></label><label class="wide">Lembretes<textarea id="game-reminders" data-gameplay-field="reminders" placeholder="Recursos, promessas, tarefas e coisas para lembrar na próxima sessão."></textarea></label></div>';const resumo=$('resumo');resumo?.after(section)}
 return true
}
function hydrateGameplay(){
 const gameplay=ensureGameplayState(state.c);if(!gameplay)return;for(const input of document.querySelectorAll('[data-gameplay-field]'))input.value=gameplay[input.dataset.gameplayField]??'';renderLive();renderSaveState('Salvo')
}
function isDraftControl(target){return!!target?.closest?.('[data-gameplay-ignore]')}
function bindGameplay(){
 const sheet=$('sheet');if(!sheet)return;
 sheet.addEventListener('input',event=>{const target=event.target;if(isDraftControl(target)||!target?.matches?.('input,textarea,select')||target.matches('input[type="number"],input[type="checkbox"],input[type="radio"]'))return;const field=target.dataset?.gameplayField;if(field)setGameplayField(state.c,field,target.value);scheduleSave();queueMicrotask(renderLive)});
 sheet.addEventListener('change',event=>{const target=event.target;if(isDraftControl(target)||!target?.matches?.('input,textarea,select'))return;const field=target.dataset?.gameplayField;if(field)setGameplayField(state.c,field,target.value);scheduleSave();queueMicrotask(renderLive)});
 sheet.addEventListener('click',event=>{if(event.target?.closest?.('#save-sheet'))queueMicrotask(()=>persistNow('Ficha salva.'));if(event.target?.closest?.('[data-slot],[data-rest-action],button'))queueMicrotask(renderLive)});
 document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&String(event.key).toLowerCase()==='s'){event.preventDefault();persistNow('Ficha salva.')}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave()});
 window.addEventListener('pagehide',()=>flushSave());
 document.addEventListener('hub-rpg:sheet-spells-ready',()=>queueMicrotask(renderLive));
}
function init(){if(initialized||!state.c||$('sheet')?.hidden)return false;initialized=true;ensureGameplayState(state.c);injectGameChrome();hydrateGameplay();bindGameplay();return true}

document.addEventListener('hub-rpg:sheet-ready',()=>queueMicrotask(init));
queueMicrotask(init);

export{persistNow,scheduleSave,renderLive};
