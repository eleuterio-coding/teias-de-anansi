/* Biomancia nas Classes — Regra da Casa do Hub.
 * Dados de classe/circulo: catálogo consolidado; descrições: paráfrases editoriais autorais.
 * Alquimista é a subclasse do Artífice, não uma classe-base.
 */
(function () {
  'use strict';
  const VERSION = '20261030-biomancia-classes2';
  const SLUGS = Object.freeze({
    wizard: 'Mago',
    sorcerer: 'Feiticeiro',
    druid: 'Druida',
    alchemist: 'Alquimista'
  });
  let pending = null;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const readJSON = async path => {
    const response = await fetch(path + '?v=' + VERSION, { cache: 'default' });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + path);
    return response.json();
  };
  function load() {
    if (pending) return pending;
    pending = Promise.all([
      readJSON('dados/magias-catalogo.json'),
      readJSON('dados/localizacao-ptbr-magias-completo.json'),
      readJSON('dados/magias-larsene-descricoes-autorais.json')
    ]).then(([catalog, translated, editorial]) => {
      if (catalog.schema !== 'hub-rpg/magias/v2' || !Array.isArray(catalog.itens)) {
        throw new Error('Catálogo de magias incompatível');
      }
      if (editorial.schema !== 'hub-rpg.magias-larsene-editoriais.v1' || !editorial.itens) {
        throw new Error('Descrições editoriais indisponíveis');
      }
      const spells = catalog.itens.filter(spell =>
        spell.escola === 'Biomancia' && spell.fonte === 'larsene-ledger-2023'
      );
      if (spells.length !== 9) throw new Error('Catálogo de Biomancia inconsistente');
      return { spells, names: translated.nomes || {}, editorial: editorial.itens };
    });
    return pending;
  }
  function available(spell, slug) {
    const label = SLUGS[slug];
    return slug === 'alchemist'
      ? Array.isArray(spell.subclasses_adicionais) &&
        spell.subclasses_adicionais.includes('Alquimista') &&
        Number(spell.nivel) <= 5
      : Array.isArray(spell.classes_base) && spell.classes_base.includes(label);
  }
  function heading(spell) {
    return spell.nivel === 0 ? 'Truque' : 'Círculo ' + spell.nivel;
  }
  function markup(data, slug) {
    const name = SLUGS[slug];
    const matches = data.spells.filter(s => available(s, slug)).sort((a, b) =>
      a.nivel - b.nivel || String(a.nome_original).localeCompare(String(b.nome_original), 'pt-BR')
    );
    const note = slug === 'alchemist'
      ? 'Estas magias foram atribuídas exclusivamente à subclasse Alquimista do Artífice, e não à classe Artífice inteira. Respeite o acesso da classe aos espaços de magia (até o 5º círculo).'
      : 'Magias suplementares disponíveis para esta classe por Regra da Casa. A seleção não concede magias conhecidas ou preparadas automaticamente.';
    const rows = matches.map(spell => {
      const title = data.names[spell.nome_original] || spell.nome || spell.nome_original;
      const effect = data.editorial[spell.nome_original];
      const summary = effect && effect.pt ? effect.pt : 'Descrição editorial não disponível. Consulte o verbete de Magias.';
      const higher = effect && effect.higher_pt
        ? '<p><strong>Em círculos superiores:</strong> ' + escapeHTML(effect.higher_pt) + '</p>'
        : '';
      const href = 'magias.html?v=' + VERSION + '&magia=' + encodeURIComponent(spell.id);
      return '<li class="bio-spell"><details><summary>' +
        '<span class="bio-spell-title">' + escapeHTML(title) +
        '<small lang="en">' + escapeHTML(spell.nome_original) + '</small></span>' +
        '<span class="bio-spell-level">' + escapeHTML(heading(spell)) + '</span>' +
        '</summary><div class="bio-spell-body"><p>' + escapeHTML(summary) + '</p>' +
        higher + '<p><a href="' + escapeHTML(href) + '">Abrir magia na Biblioteca</a></p></div>' +
        '</details></li>';
    }).join('');
    return '<section class="biomancia-panel" aria-label="Magias de Biomancia de ' + escapeHTML(name) + '">' +
      '<h3>Magias de Biomancia <small>(' + matches.length + ')</small></h3>' +
      '<p class="bio-house-rule"><strong>Regra da Casa:</strong> ' + escapeHTML(note) + '</p>' +
      '<ol class="bio-spells">' + rows + '</ol>' +
      '<p class="bio-origin">Fonte das magias: <i>L’Arsène’s Ledger of Treasure and Trinkets</i> (2023). ' +
      'Distribuição entre classes: adaptação do Hub de RPG, não regra oficial de D&amp;D.</p></section>';
  }
  async function mount(target, options) {
    const slug = options && options.slug;
    if (!target || !Object.hasOwn(SLUGS, slug) || target.dataset.biomanciaState) return;
    target.dataset.biomanciaState = 'loading';
    target.innerHTML = '<p class="bio-loading">Carregando magias de Biomancia…</p>';
    try {
      const data = await load();
      if (!target.isConnected) return;
      target.innerHTML = markup(data, slug);
      target.dataset.biomanciaState = 'loaded';
      if (target.id && location.hash === '#' + target.id) {
        requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
      }
    } catch (error) {
      console.warn('[Biomancia das Classes]', error);
      if (!target.isConnected) return;
      target.dataset.biomanciaState = 'error';
      target.innerHTML = '<p class="bio-loading">Não foi possível consultar Biomancia nesta classe. ' +
        '<a href="magias.html">Ver catálogo de Magias</a>.</p>';
    }
  }
  if (!document.getElementById('hub-biomancia-style')) {
    const style = document.createElement('style');
    style.id = 'hub-biomancia-style';
    style.textContent = [
      '.biomancia-panel{margin:20px 0;padding:16px;border:1px solid var(--hub-border,#8b8b8b);border-radius:12px;background:var(--hub-surface-2,transparent)}',
      '.biomancia-panel h3{margin:0 0 8px;font-size:1.08rem}',
      '.biomancia-panel h3 small{font-size:.82rem;opacity:.65;font-weight:500}',
      '.bio-house-rule{margin:4px 0 14px;line-height:1.6}',
      '.bio-spells{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,295px),1fr));gap:8px}',
      '.bio-spell{margin:0;min-width:0;border:1px solid var(--hub-border,#8885);border-radius:9px;overflow:hidden;background:var(--hub-surface,#ffffff)}',
      '.bio-spell>details>summary{cursor:pointer;padding:10px 12px;display:flex;justify-content:space-between;align-items:baseline;gap:12px}',
      '.bio-spell>details>summary:hover{background:var(--hub-surface-2,#8881)}',
      '.bio-spell-title{font-size:.91rem;font-weight:700;min-width:0}',
      '.bio-spell-title small{display:block;opacity:.65;font-size:.75rem;font-weight:400}',
      '.bio-spell-level{font-size:.73rem;white-space:nowrap;opacity:.75}',
      '.bio-spell-body{padding:0 12px 12px;font-size:.87rem;line-height:1.6}',
      '.bio-spell-body p{white-space:pre-line;margin:8px 0}',
      '.bio-spell-body a{color:var(--hub-accent-2,#2563a5);text-decoration:underline}',
      '.bio-origin{font-size:.78rem;opacity:.75;line-height:1.55;margin:13px 0 0}',
      '.bio-loading{margin:16px 0;opacity:.75}',
      '@media(max-width:600px){.biomancia-panel{padding:12px}.bio-spells{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    document.head.appendChild(style);
  }
  window.HubBiomancia = Object.freeze({ load, mount });
})();
