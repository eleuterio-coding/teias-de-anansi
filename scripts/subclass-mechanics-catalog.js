(()=>{
  'use strict';
  const VERSION='20260827-subclass-mechanics1';
  const FILES=[
    'dados/subclasses-mecanicas-phb-2024.json',
    'dados/subclasses-mecanicas-forge-2025.json',
    'dados/subclasses-mecanicas-quickstone-2024.json',
    'dados/subclasses-mecanicas-heroes-faerun-2025.json',
    'dados/subclasses-mecanicas-tasha-2020.json',
    'dados/subclasses-mecanicas-xanathar-2017.json',
    'dados/subclasses-mecanicas-larsene-ledger-2024.json'
  ];
  const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function originalName(card){
    const nameRow=[...card.querySelectorAll('.ficha > div')].find(el=>/^\s*Nome\s*:/i.test(el.textContent||''));
    if(nameRow)return(nameRow.textContent||'').replace(/^\s*Nome\s*:\s*/i,'').trim();
    const strong=card.querySelector('summary strong');
    if(!strong)return'';
    const clone=strong.cloneNode(true);clone.querySelectorAll('.tag').forEach(el=>el.remove());return clone.textContent.trim();
  }
  function renderMechanics(item){
    const rows=Array.isArray(item.progressao)?item.progressao:[];
    return rows.map(row=>`<article class="mecanica-nivel" data-nivel="${esc(row.nivel)}"><h3>Nível ${esc(row.nivel)} — ${esc(row.nome)}</h3><p>${esc(row.descricao)}</p></article>`).join('');
  }
  async function load(){
    const packages=await Promise.all(FILES.map(async file=>{const r=await fetch(`${file}?v=${VERSION}`,{cache:'no-store'});if(!r.ok)throw new Error(`${file}: HTTP ${r.status}`);return r.json()}));
    const map=new Map();
    for(const pkg of packages)for(const item of(pkg.subclasses||[])){
      const key=fold(item.nome);if(map.has(key))throw new Error(`Mecânica duplicada: ${item.nome}`);map.set(key,{...item,fonte_id:pkg.fonte_id,fonte:pkg.fonte});
    }
    const cards=[...document.querySelectorAll('details.subclasse')],missing=[];let applied=0;
    for(const card of cards){
      const name=originalName(card),item=map.get(fold(name));
      if(!item){missing.push(name||'(sem nome)');continue}
      const body=card.querySelector('.corpo');if(!body)continue;
      let summary=body.querySelector('.descricao');
      if(!summary){summary=document.createElement('p');summary.className='descricao';const ficha=body.querySelector('.ficha');ficha?.insertAdjacentElement('afterend',summary)}
      summary.textContent=item.resumo||'';
      summary.dataset.tipo='resumo-mecanico';
      let section=body.querySelector('.mecanicas');
      if(!section){section=document.createElement('section');section.className='mecanicas';summary.insertAdjacentElement('afterend',section)}
      section.innerHTML=renderMechanics(item);
      section.dataset.fonteMecanica=item.fonte_id||'';
      card.dataset.mecanica='completa';
      applied++;
    }
    const extras=[...map.values()].filter(item=>!cards.some(card=>fold(originalName(card))===fold(item.nome))).map(item=>item.nome);
    document.documentElement.dataset.subclassMechanics=`${applied}/${cards.length}`;
    if(missing.length||extras.length||applied!==119||map.size!==119){
      const problem=[missing.length?`Sem mecânica: ${missing.join(', ')}`:'',extras.length?`Sem card: ${extras.join(', ')}`:'',`cards=${cards.length}`,`mecânicas=${map.size}`,`aplicadas=${applied}`].filter(Boolean).join(' | ');
      console.error('[subclass-mechanics]',problem);
      const out=document.getElementById('resultado');if(out)out.textContent=`Falha de cobertura mecânica: ${applied}/${cards.length}.`;
      return;
    }
    console.info('[subclass-mechanics] 119/119 subclasses enriquecidas.');
  }
  load().catch(error=>{console.error('[subclass-mechanics]',error);const out=document.getElementById('resultado');if(out)out.textContent='Falha ao carregar as mecânicas das subclasses.'});
})();