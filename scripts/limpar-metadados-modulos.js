(()=>{
  'use strict';
  const MODULES=new Set(['regras.html','classes.html','subclasses.html','especies.html','antecedentes.html','talentos.html','maestrias-de-arma.html','monstros.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','itens-magicos.html','magias.html','idiomas.html']);
  const current=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!MODULES.has(current))return;
  const hide=el=>{if(!el||el.nodeType!==1)return;el.hidden=true;el.setAttribute('aria-hidden','true');el.style.setProperty('display','none','important')};
  function scan(){const body=document.body;if(!body)return;body.querySelectorAll([':scope > header > p',':scope > header > .badge',':scope > header > .badges',':scope > .top > header > p',':scope > .top > .badges',':scope > .top > div:first-child > p',':scope > .top > div:not(:first-child) > .badge',':scope > .top > div:not(:first-child) > .badges'].join(',')).forEach(hide);body.querySelectorAll([':scope > .nota',':scope > .note',':scope > .aviso',':scope > .warning',':scope > .warn',':scope > .status',':scope > .audit',':scope > .auditoria',':scope > #status',':scope > #precedencia',':scope > #diagnostico'].join(',')).forEach(hide);body.querySelectorAll(':scope > section, :scope > details, :scope > article').forEach(el=>{const label=String(el.querySelector(':scope > h2,:scope > h3,:scope > summary,:scope > strong')?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(/^(auditoria|crit[eé]rio|escopo|organiza[cç][aã]o|preced[eê]ncia|corpus|publicad|completude|taxonomia|material demonstrativo)/i.test(label))hide(el)})}
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