(()=>{
  'use strict';
  const VERSION='20260820-clean-modules1';
  const key=document.documentElement.dataset.cleanModule;
  const cfg={
    classes:{source:'dados/_module-source/classes.html',rules:[
      [/<p class="muted">As 12 classes-base de D&amp;D 5\.5e e o Artífice 2025, apresentados em português brasileiro\.<\/p>/gi,''],
      [/<div class="nota"><strong>Localização PT-BR:<\/strong>[\s\S]*?<\/div>/gi,'']
    ]},
    subclasses:{source:'dados/_module-source/subclasses.html',rules:[
      [/<p class="resumo">119 subclasses identificadas em pdf24_merged\.pdf e pdf24_merged-1\.pdf, deduplicadas por identidade e revisão\. Versões mais recentes equivalentes têm precedência\.<\/p>/gi,''],
      [/<div class="nota"><strong>Critério editorial:<\/strong>[\s\S]*?<\/div>/gi,''],
      [/<div class="nota"><strong>Completude e direitos:<\/strong>[\s\S]*?<\/div>/gi,''],
      [/<footer class="licenca">[\s\S]*?<\/footer>/gi,'']
    ]},
    especies:{source:'dados/_module-source/especies.html',rules:[
      [/<p class="muted" id="resumo">Carregando catálogo consolidado\.\.\.<\/p>/gi,''],
      [/<div><span class="badge">D&amp;D 5e \+ 5\.5e<\/span><span class="badge">PDFs consolidados<\/span><span class="badge">SRD 5\.1 \/ 5\.2\.1<\/span><span class="badge">build 1149<\/span><\/div>/gi,''],
      [/<div class="nota"><strong>Critério de publicação:<\/strong>[\s\S]*?<\/div>/gi,''],
      [/\s*document\.getElementById\('resumo'\)\.textContent=`\$\{DATA\.length\} opções no módulo: 49 espécies\/variantes consolidadas dos PDFs \+ 2 legadas 5e pré-existentes\.`;/g,''],
      [/\s*document\.getElementById\('resumo'\)\.textContent='Falha ao carregar o catálogo consolidado\.';/g,'']
    ]},
    talentos:{source:'dados/_module-source/talentos.html',rules:[
      [/<p class="resumo">Talentos de D&amp;D 5e\/5\.5e localizados editorialmente para português brasileiro\.<\/p>/gi,''],
      [/<div class="nota"><strong>Localização PT-BR:<\/strong>[\s\S]*?<\/div>/gi,'']
    ]},
    antecedentes:{source:'dados/_module-source/antecedentes.html',rules:[
      [/<p class="resumo">58 antecedentes e variantes de D&amp;D 5e\/5\.5e consolidados no catálogo e localizados para português brasileiro\.<\/p>/gi,''],
      [/<div class="nota"><strong>Precedência:<\/strong>[\s\S]*?<\/div>/gi,''],
      [/<div class="nota"><strong>Escopo:<\/strong>[\s\S]*?<\/div>/gi,''],
      [/<div class="nota"><strong>Completude:<\/strong>[\s\S]*?<\/div>/gi,'']
    ]}
  };
  async function load(){
    const c=cfg[key];
    if(!c)throw new Error('Módulo de limpeza inválido.');
    const r=await fetch(`${c.source}?v=${VERSION}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    let html=await r.text();
    for(const [rx,repl] of c.rules)html=html.replace(rx,repl);
    document.open();
    document.write(html);
    document.close();
  }
  load().catch(err=>{
    document.body.innerHTML='<p style="font-family:system-ui;padding:24px">Falha ao carregar o módulo.</p>';
    console.error('[module-clean-loader]',err);
  });
})();
