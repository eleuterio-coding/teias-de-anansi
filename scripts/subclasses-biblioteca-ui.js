(()=>{
'use strict';
const V='20261031-subclasses-revisao-linguistica3';
const LIVROS={
  'phb-2024':{nome:'Livro do Jogador (2024)',selo:'Livro do Jogador'},
  'eberron-forge-2025':{nome:'Eberron: Forge of the Artificer (2025)',selo:'Forja do Artífice'},
  'quickstone-2024':{nome:'Frontiers of Eberron: Quickstone (2024)',selo:'Fronteiras de Eberron'},
  'fr-heroes-2025':{nome:'Forgotten Realms: Heroes of Faerûn (2025)',selo:'Heróis de Faerûn'},
  'tasha-2020':{nome:'Caldeirão de Todas as Coisas de Tasha (2020)',selo:'Caldeirão de Tasha'},
  'xanathar-2017':{nome:'Guia de Xanathar para Todas as Coisas (2017)',selo:'Guia de Xanathar'},
  'larsene-ledger-2024':{nome:'L’Arsène’s Ledger of Treasure and Trinkets (2024)',selo:'Livro de L’Arsène'}
};
const TERMOS={
  'Reckless Attack':'Ataque Imprudente','Rage Damage':'dano da Fúria','Bardic Inspiration':'Inspiração de Bardo',
  'Ability Score Improvement':'Aumento de Atributo','saving throws':'testes de resistência',
  'saving throw':'teste de resistência','ability checks':'testes de atributo','ability check':'teste de atributo',
  'attack rolls':'jogadas de ataque','attack roll':'jogada de ataque','spell slots':'espaços de magia',
  'spell slot':'espaço de magia','spellbook':'grimório','spellcasting':'conjuração',
  'Spellcasting':'Conjuração','Spell Slots':'Espaços de Magia','Spell List':'Lista de Magias',
  'Cantrips':'Truques','cantrips':'truques','Cantrip':'Truque','cantrip':'truque',
  'Long Rest':'Descanso Longo','Short Rest':'Descanso Curto','Magic Action':'Ação de Magia',
  'Magic action':'ação de Magia','Bonus Action':'Ação Bônus','bonus action':'ação bônus',
  'Reaction':'Reação','reaction':'reação','Hit Points':'Pontos de Vida','Armor Class':'Classe de Armadura',
  'Attunement':'sintonia','attunement':'sintonia','Extra Attack':'Ataque Extra',
  'Sleight of Hand':'Prestidigitação','Intelligence':'Inteligência','Constitution':'Constituição',
  'Strength':'Força','Dexterity':'Destreza','Wisdom':'Sabedoria','Charisma':'Carisma',
  'Charmed':'Enfeitiçado','Frightened':'Amedrontado','Poisoned':'Envenenado',
  'Radiant':'radiante','Necrotic':'necrótico','Cold':'frio','Fire':'fogo','Force':'energia',
  'Bludgeoning':'concussão','Piercing':'perfurante','Slashing':'cortante',
  'Rage':'Fúria','Emanation':'Emanação','Proficiency Bonus':'Bônus de Proficiência',
  'PB':'bônus de proficiência','DC':'CD','AC':'CA','HP':'PV',
  'advantage':'vantagem','disadvantage':'desvantagem','Advantage':'Vantagem','Disadvantage':'Desvantagem',
  'proficiency':'proficiência','Proficiency':'Proficiência','proficiencies':'proficiências',
  'creatures':'criaturas','creature':'criatura','weapon':'arma','weapons':'armas',
  'spells':'magias','spell':'magia','Spells':'Magias','Spell':'Magia',
  'feature':'característica','features':'características','school':'escola',
  'Wizard':'Mago','Sorcerer':'Feiticeiro','Warlock':'Bruxo','Bard':'Bardo',
  'Barbarian':'Bárbaro','Cleric':'Clérigo','Druid':'Druida','Fighter':'Guerreiro',
  'Paladin':'Paladino','Ranger':'Patrulheiro','Rogue':'Ladino','Monk':'Monge',
  'Artificer':'Artífice','Tamer':'Domador',
  'Alchemist':'Alquimista','Armorer':'Armeiro','Artillerist':'Artilheiro','Battle Smith':'Ferreiro de Batalha',
  'fighting style':'estilo de luta','Fighting Style':'Estilo de Luta',
  'swarms':'enxames','swarm':'enxame','companions':'companheiros','companion':'companheiro',
  'Common':'comum','Uncommon':'incomum','Rare':'raro','Concentration':'Concentração',
  'Demonshard':'Fragmento Demoníaco','Fey':'Feérico','Arcane':'Arcano','Magic':'Magia',
  'Frenzy':'Frenesi','Mindless Rage':'Fúria Insensata','Retaliation':'Retaliação',
  'Intimidating Presence':'Presença Intimidadora',
  'Bonus Proficiencies':'Proficiências Adicionais','Cutting Words':'Palavras de Interrupção',
  'Magical Discoveries':'Descobertas Mágicas','Peerless Skill':'Perícia Inigualável',
  'Improved Critical':'Crítico Aprimorado','Improved Warding Flare':'Clarão Protetor Aprimorado',
  'Warding Flare':'Clarão Protetor','Divine Fury':'Fúria Divina',
  'Disciple of Life':'Discípulo da Vida','Preserve Life':'Preservar Vida',
  'Blessed Healer':'Curandeiro Abençoado','Supreme Healing':'Cura Suprema',
  'Natural Recovery':'Recuperação Natural','Nature’s Ward':'Proteção da Natureza',
  'Nature’s Sanctuary':'Santuário da Natureza','Arcane Ward':'Proteção Arcana',
  'Potent Cantrip':'Truque Potente','Sculpt Spells':'Esculpir Magias',
  'Empowered Evocation':'Evocação Potencializada','Overchannel':'Sobrecarga Arcana',
  'Fast Hands':'Mãos Rápidas','Second-Story Work':'Trabalho em Altura',
  'Thief’s Reflexes':'Reflexos de Ladrão','Thief\'s Reflexes':'Reflexos de Ladrão',
  'Magic Item':'Item Mágico','Draconic Spells':'Magias Dracônicas',
  'Draconic Resilience':'Resiliência Dracônica','Elemental Affinity':'Afinidade Elemental',
  'Dragon Wings':'Asas de Dragão','Dragon Companion':'Companheiro Dragão'
};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const rx=s=>s.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\\x24&');
let tradutorCache={dic:null,regexp:null};
function localizar(text,dic){
  // Uma única passagem impede que um termo traduzido volte a ser substituído.
  if(tradutorCache.dic!==dic){
    const originais=Object.keys(dic).sort((a,b)=>b.length-a.length);
    const escaped=originais.map(s=>s.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\\x24&'));
    tradutorCache={dic,regexp:new RegExp('(?<![\\p{L}\\p{N}_])(?:'+escaped.join('|')+')(?![\\p{L}\\p{N}_])','gu')};
  }
  return String(text||'').replace(tradutorCache.regexp,termo=>dic[termo]||termo)
    .replace(/\b(Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)\s+(testes? de resistência|testes?)\b/g,
      (_,atr,teste)=>teste.includes('resistência')
        ?(teste.startsWith('testes')?'testes':'teste')+' de resistência de '+atr
        :(teste==='testes'?'testes':'teste')+' de '+atr)
    .replace(/\b(dano|resistência|imunidade)\s+(fogo|frio|energia|veneno|ácido|trovejante|elétrico|psíquico|necrótico|radiante)\b/gi,'$1 de $2');
}
function traduzirTexto(root,dic){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes)node.nodeValue=localizar(node.nodeValue,dic);
}
function field(parent,label,value){
  const item=document.createElement('div');
  const name=document.createElement('strong');name.textContent=label+': ';
  item.append(name,document.createTextNode(value));parent.append(item);
}
async function configurar(){
  const [catalog,loc,features,glossario,magias]=await Promise.all([
    fetch('dados/subclasses-pdfs.json?v='+V).then(r=>{if(!r.ok)throw Error('Catálogo HTTP '+r.status);return r.json()}),
    fetch('dados/localizacao-ptbr-subclasses.json?v='+V).then(r=>{if(!r.ok)throw Error('Traduções HTTP '+r.status);return r.json()}),
    fetch('dados/localizacao-ptbr-caracteristicas-subclasses.json?v='+V).then(r=>{if(!r.ok)throw Error('Características HTTP '+r.status);return r.json()}),
    fetch('dados/localizacao-ptbr-termos-mecanicos.json?v='+V).then(r=>{if(!r.ok)throw Error('Glossário HTTP '+r.status);return r.json()}),
    fetch('dados/localizacao-ptbr-magias-completo.json?v='+V).then(r=>{if(!r.ok)throw Error('Magias HTTP '+r.status);return r.json()})
  ]);
  const cards=[...document.querySelectorAll('#lista > details.subclasse')];
  const data=new Map((catalog.subclasses||[]).map(x=>[x.nome,x]));
  if(cards.length!==119||data.size!==119)throw Error('Cobertura de subclasses inesperada: '+cards.length+'/'+data.size);
  const dic={...loc.termos,...TERMOS,...glossario.termos,...features.nomes,...magias.nomes}; // Conserva a terminologia editorial PT-BR usada no Hub.
  if(Object.keys(features.nomes||{}).length!==591)throw Error('Catálogo de características PT-BR incompleto.');
  const localizaTitulosMecanicos=root=>{
    for(const h of root?.querySelectorAll('h3')||[]){
      const m=h.textContent.match(/^(Nível\s+\d+\s+—\s+)(.+)$/);
      if(m&&features.nomes[m[2].trim()])h.textContent=m[1]+features.nomes[m[2].trim()];
    }
  };
  for(const card of cards){
    const row=card.querySelector('.ficha > div');
    const original=(row?.textContent||'').replace(/^\s*Nome\s*:\s*/i,'').trim();
    const item=data.get(original);
    if(!item||!loc.nomes[original]||!loc.classes[item.classe]||!LIVROS[item.fonte_id])throw Error('Dados incompletos de '+original);
    card.dataset.originalName=original;
    card.dataset.nomePtbr=loc.nomes[original];
    card.dataset.livro=item.fonte_id;
    const sum=card.querySelector(':scope > summary');
    const strong=sum.querySelector('strong');
    strong.textContent=loc.nomes[original];
    const selo=document.createElement('span');selo.className='tag selo-livro';
    selo.textContent=LIVROS[item.fonte_id].nome.replace(/\s+\(20\d\d\)$/,'');
    selo.title=LIVROS[item.fonte_id].nome;
    strong.append(' ',selo);
    const className=sum.querySelector('.classe');
    if(className)className.textContent=loc.classes[item.classe];
    const ficha=card.querySelector('.ficha');
    ficha.replaceChildren();
    field(ficha,'Nome',loc.nomes[original]);
    field(ficha,'Classe',loc.classes[item.classe]);
    field(ficha,'Livro',LIVROS[item.fonte_id].nome);
    // Dados bibliográficos e IDs permanecem no catálogo JSON; não são apagados.
    card.querySelectorAll('.corpo .fonte,.corpo .pdf-rastreio').forEach(el=>el.remove());
    traduzirTexto(card.querySelector('.descricao'),dic);
    const mecanicas=card.querySelector('.mecanicas');
    localizaTitulosMecanicos(mecanicas);
    traduzirTexto(mecanicas,dic);
  }
  const lista=document.getElementById('lista');
  cards.sort((a,b)=>a.dataset.nomePtbr.localeCompare(b.dataset.nomePtbr,'pt-BR',{sensitivity:'base'})
    ||a.dataset.originalName.localeCompare(b.dataset.originalName,'pt-BR'));
  lista.append(...cards);
  for(const option of document.querySelectorAll('#filtro option')){
    if(!option.value&&!option.textContent.trim().includes('Todas'))continue;
    const original=option.textContent.trim();
    if(loc.classes[original]){option.value=original;option.textContent=loc.classes[original]}
  }
  const options=[...document.querySelectorAll('#filtro option')];
  const all=options.shift();
  options.sort((a,b)=>a.textContent.localeCompare(b.textContent,'pt-BR',{sensitivity:'base'}));
  document.getElementById('filtro').replaceChildren(all,...options);
  if(typeof filtrar==='function')filtrar();
  document.documentElement.dataset.subclassesPtbr='119/119';
  document.documentElement.dataset.subclassesCaracteristicasPtbr='591/591';
  document.documentElement.dataset.subclassesLivros='119/119';
}
function pronto(){
  configurar().catch(e=>{console.error('[Biblioteca · Subclasses]',e);
    const out=document.getElementById('resultado');
    if(out)out.textContent='Não foi possível apresentar todas as subclasses em português.';});
}
if(document.documentElement.dataset.subclassMechanicsReady==='1')pronto();
else document.addEventListener('hub:subclasses-mecanicas-prontas',pronto,{once:true});
})();