(()=>{
  'use strict';
  const MODULES=new Set(['regras.html','classes.html','subclasses.html','especies.html','antecedentes.html','talentos.html','maestrias-de-arma.html','monstros.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','itens-magicos.html','magias.html','idiomas.html']);
  const TARGETS=new Set(['monstros.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','itens-magicos.html','magias.html','idiomas.html']);
  const current=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!MODULES.has(current))return;
  const hide=el=>{if(!el||el.nodeType!==1)return;el.hidden=true;el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important')};
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const META_RX=/^(?:catálogo consolidado|catálogo ativo|itens utilitários|67 idiomas ativos|109 bugigangas únicas|6 grupos econômicos|critério(?: editorial| do catálogo| do módulo)?|precedência|organização|escopo(?: temático)?|material demonstrativo|taxonomia|publicado(?: e verificado| e consolidado)?|auditoria|corpus|política de publicação|localização pt-br|fontes abertas|this work includes material from the system reference document|as 21 opções de xyleff)/i;
  function scan(){
    const body=document.body;if(!body)return;
    body.querySelectorAll([
      ':scope > header > p',':scope > header > .badge',':scope > header > .badges',
      ':scope > main > header > p',':scope > main > header > .badge',':scope > main > header > .badges',
      ':scope > .top > header > p',':scope > .top > .badges',':scope > .top > .badge',
      ':scope > .top > div:first-child > p',':scope > .top > div:not(:first-child) > .badge',':scope > .top > div:not(:first-child) > .badges'
    ].join(',')).forEach(hide);
    body.querySelectorAll([
      ':scope > .nota',':scope > .note',':scope > .aviso',':scope > .warning',':scope > .warn',':scope > .status',
      ':scope > .audit',':scope > .auditoria',':scope > .licenca',':scope > footer.licenca',
      ':scope > #status',':scope > #precedencia',':scope > #diagnostico',':scope > #licenca',
      ':scope > main > .nota',':scope > main > .note',':scope > main > .aviso',':scope > main > .warning',':scope > main > .warn',':scope > main > .status',
      ':scope > main > .audit',':scope > main > .auditoria',':scope > main > .licenca',':scope > main > #status',':scope > main > #licenca'
    ].join(',')).forEach(hide);
    body.querySelectorAll(':scope > section, :scope > details, :scope > article, :scope > main > section, :scope > main > details, :scope > main > article').forEach(el=>{
      const label=norm(el.querySelector(':scope > h2,:scope > h3,:scope > summary,:scope > strong')?.textContent||'').toLowerCase();
      if(/^(auditoria|crit[eé]rio|escopo|organiza[cç][aã]o|preced[eê]ncia|corpus|publicad|completude|taxonomia|material demonstrativo|localiza[cç][aã]o pt-br|pol[ií]tica de publica[cç][aã]o|fontes abertas)/i.test(label))hide(el)
    });
    if(TARGETS.has(current)){
      const candidates=body.querySelectorAll([
        ':scope > p',
        ':scope > section:not(.layout):not(.panel):not(.painel)',
        ':scope > article',':scope > footer',':scope > details',
        ':scope > main > p',
        ':scope > main > section:not(.layout):not(.panel):not(.painel)',
        ':scope > main > article',':scope > main > footer',':scope > main > details',
        ':scope > .top > p',':scope > .top > div > p'
      ].join(','));
      candidates.forEach(el=>{
        if(el.closest('#detalhe,.detail,.detalhe,[data-detail]'))return;
        const lead=norm(el.querySelector(':scope > strong,:scope > h2,:scope > h3,:scope > summary')?.textContent||el.textContent);
        if(META_RX.test(lead))hide(el)
      });
    }
  }
  const basic=new Set(['armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html']);
  const localizers={
    'subclasses.html':['scripts/localizar-subclasses-ptbr.js?v=20260820-3'],
    'especies.html':['scripts/localizar-especies-ptbr.js?v=20260820-2'],
    'maestrias-de-arma.html':['scripts/localizar-maestrias-ptbr.js?v=20260820-2'],
    'monstros.html':['scripts/localizar-monstros-ptbr-v2.js?v=20260820-2'],
    'magias.html':['scripts/localizar-magias-ptbr-v2.js?v=20260820-2','scripts/localizar-magias-nomes-ptbr.js?v=20260820-1'],
    'idiomas.html':['scripts/localizar-idiomas-ptbr.js?v=20260820-1']
  };
  if(basic.has(current))localizers[current]=['scripts/localizar-catalogos-basicos-ptbr.js?v=20260820-1'];
  for(const src of localizers[current]||[]){const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.hubLocalizer=current;document.head.appendChild(s)}
  scan();const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(scan,0);setTimeout(scan,100);setTimeout(scan,500);setTimeout(scan,1500);
})();