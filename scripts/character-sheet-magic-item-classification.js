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

const matchesAny=(text,patterns)=>patterns.some(pattern=>pattern.test(text));

export function classifyMagicItemResponsibility(item){
 const text=fold(`${item?.bloco||''} ${item?.bloco_original||''} ${item?.descricao||''}`);
 const persistent=matchesAny(text,PERSISTENT_PATTERNS);
 const resolution=matchesAny(text,RESOLUTION_PATTERNS);
 if(persistent&&resolution)return{category:'mixed',block10:true,block11:true,review:false};
 if(persistent)return{category:'persistent',block10:true,block11:false,review:false};
 if(resolution)return{category:'resolution',block10:false,block11:true,review:false};
 return{category:'manual-review',block10:false,block11:false,review:true};
}

export function classifyMagicItemCatalog(items=[]){
 const entries=items.map(item=>({id:item.id||item.refId||item.nome_original||item.nome,...classifyMagicItemResponsibility(item)}));
 const counts=entries.reduce((acc,entry)=>{acc[entry.category]=(acc[entry.category]||0)+1;return acc},{});
 return{total:entries.length,counts,manualReview:entries.filter(entry=>entry.review),entries};
}
