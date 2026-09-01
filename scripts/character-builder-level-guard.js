import{read}from'./character-builder/state.js';

function progressedCharacter(){
 const id=new URLSearchParams(location.search).get('id');if(!id)return null;
 const character=read().find(row=>row.id===id)||null,history=character?.sheet?.progression?.history;
 return Array.isArray(history)&&history.length?character:null
}
function applyGuard(){
 const character=progressedCharacter(),input=document.getElementById('nivel');if(!character||!input)return false;
 input.readOnly=true;input.setAttribute('aria-readonly','true');input.title='Este personagem já iniciou progressão durante a campanha. Novos Levels são adquiridos pela Ficha Digital.';
 const label=input.closest('label');if(label&&!label.querySelector('[data-level-progression-guard]')){const note=document.createElement('span');note.dataset.levelProgressionGuard='';note.className='mini';note.style.display='block';note.style.marginTop='5px';note.textContent='Level atual protegido. Use “Progressão de Level” na Ficha Digital para avançar; o construtor permanece disponível apenas para correções estruturais.';label.appendChild(note)}
 input.addEventListener('keydown',event=>{if(!['Tab','Shift','ArrowLeft','ArrowRight'].includes(event.key))event.preventDefault()});
 input.addEventListener('wheel',event=>event.preventDefault(),{passive:false});
 return true
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyGuard,{once:true});else applyGuard();

export{progressedCharacter,applyGuard};
