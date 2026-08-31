(()=>{
  'use strict';

  const VERSION='20260831-era-cenario2';
  const DROP=Symbol('hub-era-drop');

  const norm=value=>String(value??'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[’‘`]/g,"'")
    .replace(/[_/]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  // Política de cenário do Hub: fantasia medieval/fantástica sem tecnologia
  // mundana de pólvora, industrial, moderna ou futurista. Tecnologia explicitamente
  // mágica/fantástica não é bloqueada só por ser avançada (ex.: constructos e airships).
  const FANTASY_EXEMPT_PATTERNS=[
    /\b(eldritch|arcane|magic|magical|mistico|mistica|arcano|arcana)\s+(cannon|canhao)\b/
  ];

  const NAME_PATTERNS=[
    /\b(mosquete|musket)\b/,
    /\b(pistola|pistol)\b/,
    /\b(revolver)\b/,
    /\b(rifle)\b/,
    /\b(shotgun|espingarda)\b/,
    /\b(blunderbuss|trabuco)\b/,
    /\b(arcabuz|arquebus)\b/,
    /\b(carbine|carabina)\b/,
    /\b(cannon|canhao)\b/,
    /\b(machine gun|submachine gun|metralhadora|fuzil automatico|automatic rifle|semiautomatic pistol|pistola semiautomatica|hunting rifle|rifle de caca)\b/,
    /\b(laser pistol|laser rifle|pistola laser|rifle laser|antimatter rifle|rifle de antimateria|plasma gun|arma de plasma)\b/,
    /\b(grenade launcher|lancador de granadas|rocket launcher|lancador de foguetes)\b/,
    /\b(gunner|artilheiro de armas de fogo)\b/,
    /\b(gunpowder|polvora|powder horn|chifre de polvora|gunpowder keg|barril de polvora)\b/,
    /\b(dynamite|dinamite|fragmentation grenade|grenade\s*[,\-–—:]?\s*fragmentation|granada de fragmentacao|smoke grenade|grenade\s*[,\-–—:]?\s*smoke|granada de fumaca|modern grenade|granada moderna)\b/,
    /\b(motorcycle|motorbike|motocicleta)\b/,
    /\b(automobile|automovel)\b/,
    /\b(truck|caminhao)\b/,
    /\b(helicopter|helicoptero)\b/,
    /\b(airplane|aeroplane|aviao)\b/,
    /\b(jet fighter|jato de combate)\b/,
    /\b(spacecraft|spaceship|nave espacial)\b/,
    /\b(hovercraft)\b/,
    /\b(computer|computador|smartphone|telefone celular|mobile phone|cell phone)\b/,
    /\b(walkie talkie|radio transceiver|radio comunicador)\b/
  ];

  const STRONG_CONTEXT_PATTERNS=[
    /\b(arma de fogo|armas de fogo|firearm|firearms)\b/,
    /\b(explosivo|explosivos|explosive|explosives)\b/,
    /\b(armamento moderno|modern weapon|modern weapons)\b/,
    /\b(armamento futurista|futuristic weapon|futuristic weapons)\b/,
    /\b(veiculo motorizado|motor vehicle)\b/,
    /\b(tecnologia moderna|modern technology)\b/,
    /\b(tecnologia futurista|futuristic technology)\b/
  ];

  const IDENTITY_KEYS=new Set([
    'nome','name','nomeoriginal','originalname','id','slug','titulo','title',
    'item','equipamento','equipment','arma','weapon','veiculo','vehicle','talento','feat'
  ]);
  const CONTEXT_KEYS=new Set(['categoria','category','tipo','type','subtipo','subtype','tag','tags','grupo','group']);
  const DESCRIPTION_KEYS=new Set(['descricao','description','texto','text','resumo','summary','observacao','observation']);

  function matchesName(value){
    const text=norm(value);
    if(!text)return false;
    if(FANTASY_EXEMPT_PATTERNS.some(rx=>rx.test(text)))return false;
    return NAME_PATTERNS.some(rx=>rx.test(text));
  }

  function matchesStrongContext(value){
    const text=norm(value);
    return !!text&&STRONG_CONTEXT_PATTERNS.some(rx=>rx.test(text));
  }

  function isProhibitedRecord(record){
    if(!record||typeof record!=='object'||Array.isArray(record))return false;
    const identities=[];
    const contexts=[];
    const descriptions=[];
    for(const [key,value] of Object.entries(record)){
      const k=norm(key).replace(/\s/g,'');
      if(IDENTITY_KEYS.has(k)&&['string','number'].includes(typeof value))identities.push(value);
      if(CONTEXT_KEYS.has(k))contexts.push(Array.isArray(value)?value.join(' '):value);
      if(DESCRIPTION_KEYS.has(k)&&typeof value==='string')descriptions.push(value);
    }
    if(identities.some(matchesName))return true;
    if(contexts.some(value=>matchesName(value)||matchesStrongContext(value)))return true;
    if(descriptions.some(matchesStrongContext))return true;
    return false;
  }

  function sanitize(value,path=''){
    if(value==null)return value;
    if(Array.isArray(value)){
      if(value.length&&typeof value[0]==='string'&&matchesName(value[0]))return DROP;
      const out=[];
      for(const entry of value){
        if(typeof entry==='string'&&entry.length<=140&&matchesName(entry))continue;
        const cleaned=sanitize(entry,path);
        if(cleaned!==DROP)out.push(cleaned);
      }
      return out;
    }
    if(typeof value==='object'){
      if(isProhibitedRecord(value))return DROP;
      const out={};
      for(const [key,entry] of Object.entries(value)){
        if(matchesName(key))continue;
        const cleaned=sanitize(entry,path?`${path}.${key}`:key);
        if(cleaned!==DROP)out[key]=cleaned;
      }
      return out;
    }
    if(typeof value==='string'&&value.length<=140&&matchesName(value))return DROP;
    return value;
  }

  function filterRecords(records){
    const cleaned=sanitize(Array.isArray(records)?records:[],'records');
    return cleaned===DROP?[]:cleaned;
  }

  function sanitizePayload(payload){
    const cleaned=sanitize(payload,'root');
    return cleaned===DROP?null:cleaned;
  }

  function urlLooksStructuredJson(url,response){
    const u=String(url??'');
    const type=String(response?.headers?.get?.('content-type')||'');
    return /\.json(?:[?#]|$)/i.test(u)||/application\/json/i.test(type);
  }

  function installFetchBarrier(root){
    if(!root||typeof root.fetch!=='function'||root.fetch.__hubEraPolicy)return;
    const nativeFetch=root.fetch.bind(root);
    const wrap=response=>new Proxy(response,{
      get(target,prop){
        if(prop==='json')return async()=>sanitizePayload(await target.json());
        if(prop==='clone')return()=>wrap(target.clone());
        const value=Reflect.get(target,prop,target);
        return typeof value==='function'?value.bind(target):value;
      }
    });
    const guardedFetch=async(...args)=>{
      const response=await nativeFetch(...args);
      const requestUrl=typeof args[0]==='string'?args[0]:args[0]?.url;
      return urlLooksStructuredJson(requestUrl,response)?wrap(response):response;
    };
    Object.defineProperty(guardedFetch,'__hubEraPolicy',{value:true});
    root.fetch=guardedFetch;
  }

  const CANDIDATE_SELECTOR=[
    'article.talento','article[data-entity]','details.registro','button.item',
    '[data-entity]','[data-item-id]','[data-record-id]','.registro','.talento',
    '.item[data-id]','tr','option'
  ].join(',');

  function elementIdentity(el){
    if(!el||el.nodeType!==1)return'';
    const dataset=el.dataset||{};
    const attrs=[dataset.name,dataset.id,dataset.itemId,dataset.recordId,el.getAttribute?.('data-name'),el.getAttribute?.('value')];
    const heading=el.querySelector?.('h1,h2,h3,strong,.nome-feat,summary')?.textContent||'';
    return [...attrs,heading,el.textContent||''].filter(Boolean).join(' ');
  }

  function shouldRemoveElement(el){
    const identity=elementIdentity(el);
    return matchesName(identity)||matchesStrongContext(identity);
  }

  function updateVisibleCount(removed){
    if(!removed)return;
    const list=document.getElementById('lista');
    if(!list)return;
    const counter=document.getElementById('count')||document.getElementById('resultado');
    if(!counter)return;
    const visible=[...list.children].filter(el=>{
      if(el.hidden)return false;
      if(el.classList?.contains('vazio')||el.classList?.contains('nota')||el.classList?.contains('erro'))return false;
      return true;
    }).length;
    counter.textContent=`${visible} registros visíveis · política de cenário aplicada`;
  }

  let cleaning=false;
  function cleanDom(){
    if(typeof document==='undefined'||cleaning)return 0;
    cleaning=true;
    let removed=0;
    try{
      const nodes=[...document.querySelectorAll(CANDIDATE_SELECTOR)];
      // Filhos/entradas específicas primeiro; um item moderno não deve apagar o contêiner geral.
      nodes.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length);
      for(const el of nodes){
        if(!el.isConnected)continue;
        if(shouldRemoveElement(el)){
          el.remove();
          removed++;
        }
      }
      updateVisibleCount(removed);
    }finally{cleaning=false;}
    return removed;
  }

  function installDomBarrier(){
    if(typeof document==='undefined')return;
    const start=()=>{
      cleanDom();
      if(document.__hubEraObserver)return;
      const observer=new MutationObserver(()=>queueMicrotask(cleanDom));
      observer.observe(document.documentElement||document,{childList:true,subtree:true});
      document.__hubEraObserver=observer;
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();

    // Alguns módulos reescrevem o documento após carregar uma fonte HTML limpa.
    // Ao fechar o novo documento, reinstalamos a observação para que a política continue ativa.
    if(!document.__hubEraClosePatched&&typeof document.close==='function'){
      const nativeClose=document.close.bind(document);
      document.close=function(...args){
        const result=nativeClose(...args);
        queueMicrotask(()=>{
          if(document.__hubEraObserver){try{document.__hubEraObserver.disconnect();}catch(_){}}
          document.__hubEraObserver=null;
          cleanDom();
          const observer=new MutationObserver(()=>queueMicrotask(cleanDom));
          observer.observe(document.documentElement||document,{childList:true,subtree:true});
          document.__hubEraObserver=observer;
        });
        return result;
      };
      document.__hubEraClosePatched=true;
    }
  }

  const api={
    version:VERSION,
    norm,
    matchesName,
    matchesStrongContext,
    isProhibitedRecord,
    sanitizePayload,
    filterRecords,
    cleanDom,
    installFetchBarrier,
    installDomBarrier
  };

  const root=typeof globalThis!=='undefined'?globalThis:window;
  root.HubEraPolicy=api;
  installFetchBarrier(root);
  installDomBarrier();
})();
