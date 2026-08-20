(()=>{
'use strict';
const V='20260820-ptbr1';
const UNIT=[['120 ft','36 m'],['60 ft','18 m'],['40 ft','12 m'],['35 ft','10,5 m'],['30 ft','9 m'],['20 ft','6 m'],['15 ft','4,5 m'],['10 ft','3 m'],['5 ft','1,5 m'],['120 pés','36 m'],['60 pés','18 m'],['40 pés','12 m'],['35 pés','10,5 m'],['30 pés','9 m'],['20 pés','6 m'],['15 pés','4,5 m'],['10 pés','3 m'],['5 pés','1,5 m']];
const LEGACY={
 'especies:srd51:half-elf':{name:'Meio-Elfo',traits:{'Darkvision':['Visão no Escuro','Graças à sua herança élfica, você possui Visão no Escuro com alcance de 18 m.'],'Fey Ancestry':['Ancestralidade Feérica','Você tem Vantagem nos testes de resistência contra ser Enfeitiçado, e magia não pode fazê-lo dormir.'],'Skill Versatility':['Versatilidade em Perícias','Você ganha proficiência em duas perícias à sua escolha.']},extras:['Atributos: Carisma +2 e +1 em outros dois atributos à sua escolha.','Idade: meio-elfos atingem a maturidade por volta dos 20 anos e frequentemente vivem mais de 180 anos.','Idiomas: Comum, Élfico e um idioma adicional à sua escolha.']},
 'especies:srd51:half-orc':{name:'Meio-Orc',traits:{'Darkvision':['Visão no Escuro','Graças à sua herança orc, você possui Visão no Escuro com alcance de 18 m.'],'Menacing':['Ameaçador','Você ganha proficiência na perícia Intimidação.'],'Relentless Endurance':['Resistência Implacável','Quando seus Pontos de Vida são reduzidos a 0 sem que você morra imediatamente, você pode ficar com 1 Ponto de Vida. Após usar este traço, precisa terminar um Descanso Longo para usá-lo novamente.'],'Savage Attacks':['Ataques Selvagens','Quando obtém um acerto crítico com um ataque de arma corpo a corpo, você pode rolar um dos dados de dano da arma uma vez adicional e somá-lo ao dano extra do acerto crítico.']},extras:['Atributos: Força +2 e Constituição +1.','Idade: meio-orcs amadurecem por volta dos 14 anos e raramente vivem mais de 75 anos.','Idiomas: Comum e Orc.']}
};
const pairs=o=>Object.entries(o||{}).sort((a,b)=>b[0].length-a[0].length);
function textLoc(s,loc){let out=String(s??'');for(const[a,b]of UNIT)out=out.split(a).join(b);for(const[a,b]of pairs(loc.terms))out=out.split(a).join(b);return out}
function setH4(h4,name){const lvl=h4?.querySelector('.muted')?.textContent;if(!h4)return;h4.textContent=name;if(lvl){const sp=document.createElement('span');sp.className='muted';sp.textContent=` — ${lvl.replace(/^—\s*/, '')}`;h4.appendChild(sp)}}
function localizeCard(card,loc){
 const id=card.dataset.id||'',summary=card.querySelector(':scope > summary'),strong=summary?.querySelector('strong'),sub=summary?.querySelector('.sub'),legacy=LEGACY[id];
 if(strong){const original=strong.dataset.original||strong.textContent.trim();strong.dataset.original=original;const n=legacy?.name||loc.species?.[original];if(n)strong.textContent=n}
 if(sub)sub.textContent=textLoc(sub.textContent,loc);
 const body=card.querySelector('.corpo');if(!body)return;
 body.querySelectorAll('.stat').forEach(x=>{const st=x.querySelector('strong');if(st){for(const n of [...x.childNodes])if(n.nodeType===Node.TEXT_NODE)n.nodeValue=textLoc(n.nodeValue,loc)}});
 body.querySelectorAll('.trait').forEach(t=>{
   const h=t.querySelector('h4'),p=t.querySelector('p');if(!h||!p)return;const original=h.dataset.original||[...h.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.nodeValue).join('').trim();h.dataset.original=original;
   const lv=legacy?.traits?.[original];if(lv){setH4(h,lv[0]);p.textContent=lv[1];return}
   const full=loc.traits?.[original];if(full){setH4(h,full.name);p.textContent=full.text;return}
   const n=loc.trait_names?.[original];if(n)setH4(h,n);p.textContent=textLoc(p.textContent,loc);
 });
 body.querySelectorAll('.linhagem>h4').forEach(h=>{const original=h.dataset.original||h.textContent.trim();h.dataset.original=original;if(loc.lineages?.[original])h.textContent=loc.lineages[original]});
 const legacyBlock=body.querySelector('.bloco h3');
 if(legacy&&legacyBlock&&legacyBlock.textContent.trim()==='Dados de legado'){const sec=legacyBlock.parentElement;sec.querySelectorAll('p').forEach((p,i)=>{if(legacy.extras[i])p.textContent=legacy.extras[i]})}
 const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(n.parentElement?.closest('.meta'))continue;n.nodeValue=textLoc(n.nodeValue,loc)}
 body.querySelectorAll('.meta span').forEach(x=>{const raw=x.textContent;if(raw.startsWith('Ruleset:'))x.innerHTML=x.innerHTML.replace('Ruleset:','Regras:')});
}
fetch(`dados/localizacao-ptbr-especies.json?v=${V}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(loc=>{
 const scan=()=>{document.querySelectorAll('details.especie').forEach(c=>localizeCard(c,loc));document.querySelectorAll('#tamanho option').forEach(o=>{if(o.value==='Small')o.textContent='Pequeno';if(o.value==='Medium')o.textContent='Médio'});document.documentElement.dataset.especiesPtbr='ativo'};
 scan();const ob=new MutationObserver(scan);ob.observe(document.getElementById('lista')||document.body,{childList:true,subtree:true});
}).catch(e=>{console.error('[Hub] Falha de localização de Espécies:',e);const r=document.getElementById('resultado');if(r)r.textContent='Falha de integridade da localização PT-BR.'});
})();