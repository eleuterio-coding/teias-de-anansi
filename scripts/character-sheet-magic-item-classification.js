const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

const PERSISTENT_PATTERNS=[
 /enquanto (?:voce )?(?:usar|usa|vestir|veste|empunhar|empunha|segurar|segura|calcar|calca|portar|porta)/,
 /enquanto estiver (?:usando|vestindo|empunhando|segurando|sintonizado)/,
 /(?:sua|seu) (?:classe de armadura|ca|constituicao|forca|destreza|sabedoria|inteligencia|carisma|deslocamento) (?:e|se torna|aumenta)/,
 /(?:tem|recebe|ganha|concede) (?:resistencia|imunidade|vulnerabilidade|vantagem|bonus|proficiencia)/,
 /nao pode ser (?:alvo|surpreendido)/,
 /acerto critico.*acerto normal/
];
const RESOLUTION_PATTERNS=[
 /(?:realizar|usar) uma (?:acao|acao bonus|reacao)/,
 /(?:voce pode|pode) conjurar/,
 /(?:jogada|teste) de (?:ataque|resistencia|habilidade)/,
 /(?:causa|sofre|dano) \d*d\d+/,
 /(?:carga|cargas|recupera .*carga)/,
 /(?:uma vez|novamente) (?:ate|antes|depois)/,
 /(?:ao atingir|quando atingir|quando acerta|quando voce acerta)/,
 /(?:beber|ingerir|consumir) (?:esta|essa|a) pocao/
];

// Revisão semântica explícita dos casos que não podem ser classificados com segurança
// apenas por palavras-chave. Nenhum item do escopo congelado v1.0 pode permanecer
// em "manual-review".
const EXPLICIT_RESPONSIBILITY={
 'itens-magicos:srd521:ammunition-1-2-or-3':'mixed',
 'itens-magicos:srd521:bead-of-nourishment':'resolution',
 'itens-magicos:srd521:carpet-of-flying':'persistent',
 'itens-magicos:srd521:chime-of-opening':'resolution',
 'itens-magicos:srd521:crystal-ball':'resolution',
 'itens-magicos:srd521:crystal-ball-of-true-seeing':'mixed',
 'itens-magicos:srd521:defender':'mixed',
 'itens-magicos:srd521:efficient-quiver':'persistent',
 'itens-magicos:srd521:elemental-gem':'resolution',
 'itens-magicos:srd521:elixir-of-health':'resolution',
 'itens-magicos:srd521:eversmoking-bottle':'resolution',
 'itens-magicos:srd521:folding-boat':'resolution',
 'itens-magicos:srd521:horseshoes-of-a-zephyr':'persistent',
 'itens-magicos:srd521:horseshoes-of-speed':'persistent',
 'itens-magicos:srd521:instant-fortress':'resolution',
 'itens-magicos:srd521:marvelous-pigments':'resolution',
 'itens-magicos:srd521:mithral-armor':'persistent',
 'itens-magicos:srd521:oil-of-etherealness':'mixed',
 'itens-magicos:srd521:oil-of-sharpness':'mixed',
 'itens-magicos:srd521:oil-of-slipperiness':'mixed',
 'itens-magicos:srd521:philter-of-love':'mixed',
 'itens-magicos:srd521:potion-of-clairvoyance':'resolution',
 'itens-magicos:srd521:potion-of-diminution':'mixed',
 'itens-magicos:srd521:potion-of-gaseous-form':'mixed',
 'itens-magicos:srd521:potion-of-giant-strength':'mixed',
 'itens-magicos:srd521:potion-of-growth':'mixed',
 'itens-magicos:srd521:potion-of-heroism':'mixed',
 'itens-magicos:srd521:potion-of-longevity':'resolution',
 'itens-magicos:srd521:potion-of-mind-reading':'resolution',
 'itens-magicos:srd521:potion-of-speed':'mixed',
 'itens-magicos:srd521:potion-of-vitality':'mixed',
 'itens-magicos:srd521:potions-of-healing':'resolution',
 'itens-magicos:srd51:restorative-ointment':'resolution',
 'itens-magicos:srd521:scimitar-of-speed':'mixed',
 'itens-magicos:srd521:sovereign-glue':'resolution',
 'itens-magicos:srd521:staff-of-the-python':'mixed',
 'itens-magicos:srd521:stone-of-good-luck-luckstone':'persistent',
 'itens-magicos:srd521:weapon-1-2-or-3':'persistent'
};

const matchesAny=(text,patterns)=>patterns.some(pattern=>pattern.test(text));
const responsibility=category=>({
 category,
 block10:category==='persistent'||category==='mixed',
 block11:category==='resolution'||category==='mixed',
 review:false,
 explicit:true
});

export function classifyMagicItemResponsibility(item){
 const id=item?.id||item?.refId||'';
 if(EXPLICIT_RESPONSIBILITY[id])return responsibility(EXPLICIT_RESPONSIBILITY[id]);
 const text=fold(`${item?.bloco||''} ${item?.bloco_original||''} ${item?.descricao||''}`);
 const persistent=matchesAny(text,PERSISTENT_PATTERNS);
 const resolution=matchesAny(text,RESOLUTION_PATTERNS);
 if(persistent&&resolution)return{category:'mixed',block10:true,block11:true,review:false,explicit:false};
 if(persistent)return{category:'persistent',block10:true,block11:false,review:false,explicit:false};
 if(resolution)return{category:'resolution',block10:false,block11:true,review:false,explicit:false};
 return{category:'manual-review',block10:false,block11:false,review:true,explicit:false};
}

export function classifyMagicItemCatalog(items=[]){
 const entries=items.map(item=>({id:item.id||item.refId||item.nome_original||item.nome,...classifyMagicItemResponsibility(item)}));
 const counts=entries.reduce((acc,entry)=>{acc[entry.category]=(acc[entry.category]||0)+1;return acc},{});
 return{total:entries.length,counts,manualReview:entries.filter(entry=>entry.review),entries};
}

export const MAGIC_ITEM_EXPLICIT_RESPONSIBILITY=Object.freeze({...EXPLICIT_RESPONSIBILITY});
