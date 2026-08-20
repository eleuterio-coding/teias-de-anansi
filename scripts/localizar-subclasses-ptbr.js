(()=>{
'use strict';
const V='20260820-ptbr2';
const escRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const extras={
 'Frenzy':'Frenesi','Mindless Rage':'Fúria Insensata','Retaliation':'Retaliação','Intimidating Presence':'Presença Intimidante',
 'Bonus Proficiencies':'Proficiências Adicionais','Cutting Words':'Palavras de Interrupção','Magical Discoveries':'Descobertas Mágicas','Peerless Skill':'Perícia Inigualável',
 'Disciple of Life':'Discípulo da Vida','Preserve Life':'Preservar Vida','Blessed Healer':'Curandeiro Abençoado','Supreme Healing':'Cura Suprema',
 "Land's Aid":'Auxílio da Terra','Natural Recovery':'Recuperação Natural',"Nature's Ward":'Proteção da Natureza',"Nature's Sanctuary":'Santuário da Natureza',
 'Improved Critical':'Crítico Aprimorado','Remarkable Athlete':'Atleta Extraordinário','Additional Fighting Style':'Estilo de Luta Adicional','Heroic Warrior':'Guerreiro Heroico','Survivor':'Sobrevivente',
 'Open Hand Technique':'Técnica da Mão Aberta','Wholeness of Body':'Integridade Corporal','Fleet Step':'Passo Veloz','Quivering Palm':'Palma Vibrante',
 'Oath of Devotion Spells':'Magias do Juramento de Devoção','Sacred Weapon':'Arma Sagrada','Aura of Devotion':'Aura de Devoção','Smite of Protection':'Golpe de Proteção','Holy Nimbus':'Nimbus Sagrado',
 "Hunter's Lore":'Conhecimento do Caçador',"Hunter's Prey":'Presa do Caçador','Defensive Tactics':'Táticas Defensivas',"Superior Hunter's Prey":'Presa Superior do Caçador',"Superior Hunter's Defense":'Defesa Superior do Caçador',
 'Fast Hands':'Mãos Rápidas','Second-Story Work':'Trabalho em Altura','Supreme Sneak':'Furtividade Suprema','Use Magic Device':'Usar Dispositivo Mágico',"Thief's Reflexes":'Reflexos de Ladrão',
 'Draconic Resilience':'Resiliência Dracônica','Draconic Spells':'Magias Dracônicas','Elemental Affinity':'Afinidade Elemental','Dragon Wings':'Asas de Dragão','Dragon Companion':'Companheiro Dragão',
 'Fiend Spells':'Magias Ínferas',"Dark One's Blessing":'Bênção do Senhor das Trevas',"Dark One's Own Luck":'Sorte do Senhor das Trevas','Fiendish Resilience':'Resiliência Ínfera','Hurl Through Hell':'Arremessar através do Inferno',
 'Evocation Savant':'Sábio em Evocação','Potent Cantrip':'Truque Potente','Sculpt Spells':'Esculpir Magias','Empowered Evocation':'Evocação Potencializada','Overchannel':'Sobrecarga Arcana',
 'Melee':'corpo a corpo','melee':'corpo a corpo','weapon':'arma','Weapon':'Arma','attack':'ataque','Attack':'Ataque','creature':'criatura','Creature':'Criatura','turn':'turno','Turn':'Turno','level':'nível','Level':'Nível','damage':'dano','Damage':'Dano','target':'alvo','Target':'Alvo','ally':'aliado','allies':'aliados','enemy':'inimigo','enemies':'inimigos','Magic action':'ação de Magia','Magic Action':'Ação de Magia'
};
function pairs(map){return Object.entries(map).sort((a,b)=>b[0].length-a[0].length)}
function replaceText(text, dict){let out=String(text||'');for(const[k,v] of pairs(dict))out=out.replace(new RegExp(`\\b${escRx(k)}\\b`,'g'),v);return out}
function exactOriginal(strong){if(!strong)return'';for(const n of strong.childNodes){if(n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim())return n.nodeValue.trim()}return strong.textContent.replace(/\s*5\.5e.*$/,'').trim()}
function walk(root,dict){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){const p=n.parentElement;if(!p||p.closest('.fonte,.pdf-rastreio,code,pre,a'))continue;n.nodeValue=replaceText(n.nodeValue,dict)}}
fetch(`dados/localizacao-ptbr-subclasses.json?v=${V}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(loc=>{
 const dict={...loc.nomes,...loc.classes,...loc.termos,...extras};
 document.querySelectorAll('details.subclasse').forEach(card=>{
   const strong=card.querySelector(':scope > summary strong'),original=exactOriginal(strong),pt=loc.nomes?.[original];
   if(!pt)throw new Error(`Subclasse sem localização: ${original}`);
   if(strong){for(const n of strong.childNodes){if(n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim()){n.nodeValue=pt+' ';break}}}
   const classe=card.querySelector(':scope > summary .classe');if(classe)classe.textContent=loc.classes?.[classe.textContent.trim()]||classe.textContent;
   const corpo=card.querySelector('.corpo');if(corpo)walk(corpo,dict);
 });
 document.querySelectorAll('#filtro option').forEach(o=>{if(loc.classes?.[o.textContent.trim()])o.textContent=loc.classes[o.textContent.trim()]});
 document.documentElement.dataset.subclassesPtbr='completo';
}).catch(err=>{console.error('[Hub] Falha de localização de Subclasses:',err);const r=document.getElementById('resultado');if(r)r.textContent='Falha de integridade da localização PT-BR.'});
})();