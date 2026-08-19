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

  const hide=el=>{
    if(!el||el.nodeType!==1)return;
    el.hidden=true;
    el.setAttribute('aria-hidden','true');
    el.style.setProperty('display','none','important');
  };

  function scan(){
    const body=document.body;
    if(!body)return;

    /* Cabeçalhos: deixa apenas o título do módulo. */
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

    /*
     * Todo bloco editorial/operacional de nível de módulo é removido da UI,
     * independentemente do texto interno. O conteúdo mecânico dos itens,
     * filtros e metadados próprios de cada item permanecem intactos.
     */
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
    ].join(',')).forEach(hide);

    /* Seções top-level explicitamente editoriais/auditoria. */
    body.querySelectorAll(':scope > section, :scope > details, :scope > article').forEach(el=>{
      const label=String(el.querySelector(':scope > h2,:scope > h3,:scope > summary,:scope > strong')?.textContent||'')
        .replace(/\s+/g,' ').trim().toLowerCase();
      if(/^(auditoria|crit[eé]rio|escopo|organiza[cç][aã]o|preced[eê]ncia|corpus|publicad|completude|taxonomia|material demonstrativo)/i.test(label)) hide(el);
    });
  }

  scan();
  const observer=new MutationObserver(scan);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(scan,0);
  setTimeout(scan,100);
  setTimeout(scan,500);
  setTimeout(scan,1500);
})();