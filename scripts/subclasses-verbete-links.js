(()=>{
'use strict';
// Índice consolidado dos verbetes efetivamente cadastrados no Hub.
const INDEX_FILES=[1,2,3,4].map(i=>'dados/indice-verbetes-subclasses-parte-0'+i+'.json?v=20261104');
const PT_IDIOMAS={Common:'Comum',Draconic:'Dracônico',Dwarvish:'Anão',Elvish:'Élfico',Giant:'Gigante',Gnomish:'Gnômico',Goblin:'Goblin',Halfling:'Pequenino',Orc:'Orc',Aquan:'Aquano',Celestial:'Celestial',Infernal:'Infernal',Primordial:'Primordial',Sylvan:'Silvestre',Gith:'Gith',Gnoll:'Gnoll',Harpy:'Harpia',Quori:'Quori',Serpentine:'Serpentino'};
const EXCLUIR=new Set(['source','fonte','livro','regras','comum','mestre','personagem','talento','ferramenta','magia','jogador','classes','classe','raça','raças','arma','armas','monstro','monstros','lista','descrição','perícias','ataque','dano','nível','idade','dado','grupo','reação','ação','ações','armadura','teste','testes','forma','escola','natureza','arcano','poder','força','energia','fogo','água']);
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const rxEscape=s=>s.replace(/[.*+?^$()|[\]{}]/g,'\\$&');
function makeIndex(rows){
 const byWord=new Map();
 for(const entry of rows){
  const aliases=[entry.nome,...(entry.aliases||[])];
  if(entry.modulo==='Ferramentas'&&window.HubBiblioteca)aliases.push(HubBiblioteca.ferramenta(entry.nome));
  if(entry.modulo==='Equipamentos de Aventura'&&window.HubBiblioteca)aliases.push(HubBiblioteca.equipamento(entry.nome));
  if(entry.modulo==='Idiomas')aliases.push(PT_IDIOMAS[entry.nome]);
  for(const word of aliases){
   const w=String(word||'').trim().replace(/\s+/g,' ');
   if(w.length<5||EXCLUIR.has(norm(w))||/^\d/.test(w))continue;
   const key=norm(w);
   if(!byWord.has(key))byWord.set(key,{label:w,url:entry.url,modulo:entry.modulo});
  }
 }
 const terms=[...byWord.values()].sort((a,b)=>b.label.length-a.label.length);
 const regex=new RegExp('(?<![\\p{L}\\p{N}])('+terms.map(x=>rxEscape(x.label)).join('|')+')(?![\\p{L}\\p{N}])','giu');
 return{byWord,regex};
}
function linkText(root,index,current){
 if(!root)return 0;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 const textNodes=[];
 while(walker.nextNode())textNodes.push(walker.currentNode);
 let count=0;
 for(const node of textNodes){
  if(!node.parentElement||node.parentElement.closest('a,button,script,style,code'))continue;
  const original=node.nodeValue;
  if(!original||original.trim().length<5)continue;
  index.regex.lastIndex=0;
  let last=0,changed=false;const frag=document.createDocumentFragment();
  for(const match of original.matchAll(index.regex)){
   const label=match[0],item=index.byWord.get(norm(label));
   if(!item||(item.modulo==='Subclasses'&&norm(label)===norm(current)))continue;
   const pos=match.index;
   if(pos<last)continue;
   if(pos>last)frag.append(document.createTextNode(original.slice(last,pos)));
   const link=document.createElement('a');link.className='hub-verbete';link.href=item.url;link.textContent=label;
   link.title=item.modulo+': '+label;
   frag.append(link);last=pos+label.length;changed=true;count++;
  }
  if(changed){if(last<original.length)frag.append(document.createTextNode(original.slice(last)));node.replaceWith(frag);}
 }
 return count;
}
async function apply(){
 const results=await Promise.all(INDEX_FILES.map(async url=>{
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)throw new Error('Índice indisponível: '+url);
  return r.json();
 }));
 const index=makeIndex(results.flat());
 let count=0;
 for(const card of document.querySelectorAll('#lista > details.subclasse')){
  for(const area of card.querySelectorAll('.descricao,.mecanicas'))
   count+=linkText(area,index,card.dataset.nomePtbr||'');
 }
 document.documentElement.dataset.subclassesVerbetes=String(count);
}
function ready(){
 apply().catch(error=>console.error('[Subclasses · referências cruzadas]',error));
}
if(document.documentElement.dataset.subclassesPtbr==='112/112')ready();
else document.addEventListener('hub:subclasses-ptbr-ready',ready,{once:true});
})();