(()=>{
  'use strict';

  const MODULES=new Set([
    'regras.html','classes.html','subclasses.html','especies.html','antecedentes.html','talentos.html',
    'maestrias-de-arma.html','monstros.html','armaduras.html','armas.html','equipamentos-aventura.html',
    'ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html',
    'itens-magicos.html','magias.html','idiomas.html'
  ]);

  const current=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!MODULES.has(current))return;

  const HIDE='hub-module-meta-hidden';
  const META_LABELS=[
    /^crit[eé]rio(?:\s+editorial|\s+de\s+publica[cç][aã]o|\s+do\s+cat[aá]logo)?\s*:/i,
    /^escopo(?:\s+atual|\s+tem[aá]tico)?\s*:/i,
    /^organiza[cç][aã]o\s*:/i,
    /^preced[eê]ncia(?:\s+aplicada)?\s*:/i,
    /^corpus\s*:/i,
    /^publicad[oa](?:\s+e\s+(?:verificad[oa]|consolidad[oa]))?\s*:/i,
    /^completude(?:\s+e\s+direitos)?\s*:/i,
    /^auditoria(?:\s+dos?|\s+das?)?\b/i,
    /^material\s+demonstrativo\s*:/i,
    /^extra[cç][aã]o\s+dos?\s+pdfs?\b/i,
    /^taxonomia\s*:/i
  ];

  const cleanText=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const isMetaText=el=>META_LABELS.some(re=>re.test(cleanText(el)));
  const hide=el=>{if(el&&el.nodeType===1&&!el.classList.contains(HIDE))el.classList.add(HIDE)};

  function scan(){
    const body=document.body;
    if(!body)return;

    body.querySelectorAll([
      ':scope > header > p',
      ':scope > header > .badge',
      ':scope > header > .badges',
      ':scope > .top > header > p',
      ':scope > .top > .badges',
      ':scope > .top > div:first-child > p',
      ':scope > .top > div:not(:first-child) > .badge',
      ':scope > .top > div:not(:first-child) > .badges'
    ].join(',')).forEach(hide);

    body.querySelectorAll([
      ':scope > .nota',
      ':scope > .note',
      ':scope > .aviso',
      ':scope > .warning',
      ':scope > .warn',
      ':scope > .status',
      ':scope > .audit',
      ':scope > .auditoria',
      ':scope > #status',
      ':scope > #precedencia',
      ':scope > #diagnostico'
    ].join(',')).forEach(el=>{
      if(el.id==='status'||el.id==='precedencia'||el.id==='diagnostico'||isMetaText(el)||el.matches('.audit,.auditoria'))hide(el);
    });

    for(const el of body.children){
      if(['SCRIPT','STYLE','LINK'].includes(el.tagName))continue;
      if(el.matches('main,.layout,.controles,.controls,.tools,#lista,#resultado'))continue;

      if(isMetaText(el)){
        const containsPrimary=!!el.querySelector('main,.layout,.controles,.controls,.tools,#lista');
        if(!containsPrimary)hide(el);
      }

      if(el.matches('section,details,article,div')){
        const label=el.querySelector(':scope > h2,:scope > h3,:scope > summary,:scope > strong');
        if(label&&isMetaText(label))hide(el);
      }
    }
  }

  scan();
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  setTimeout(scan,0);
  setTimeout(scan,250);
  setTimeout(scan,1000);
})();
