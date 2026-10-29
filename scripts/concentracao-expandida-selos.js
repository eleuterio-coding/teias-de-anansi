(() => {
  const LABELS = {
    CM: 'CM — Concentração Maior',
    CI: 'CI — Concentração de Invocação',
    CZ: 'CZ — Concentração de Zona',
    CL: 'CL — Concentração Leve',
    SC: 'Sem Concentração',
    NC: 'Pendente de classificação',
    ND: 'Concentração não informada'
  };

  // Matrizes de coexistência da Regra da Casa, com composições completas.
  // Cada magia conserva UMA única categoria. Os níveis são de conjurador,
  // não o círculo da magia. Níveis anteriores continuam disponíveis.
  const COMPATIBILITY = Object.freeze({
    CM: [
      ['5', 'CM + 1 CL'],
      ['10', 'CM + 2 CL'],
      ['20', 'CM + 2 CL; ou CM + CI; ou CM + CZ']
    ],
    CI: [
      ['5', 'CI + 1 CL'],
      ['10', 'CI + 2 CL'],
      ['20', 'CI + 2 CL; ou CM + CI']
    ],
    CZ: [
      ['5', 'CZ + 1 CL'],
      ['10', 'CZ + 2 CL'],
      ['20', 'CZ + 2 CL; ou CM + CZ']
    ],
    CL: [
      ['5', '1 CM, CI ou CZ + 1 CL'],
      ['10', '1 CM, CI ou CZ + 2 CL'],
      ['20', '1 CM, CI ou CZ + 2 CL']
    ]
  });

  const CE_STYLE_ID = 'hub-ce-coexistencia-style';
  function ensureCompatibilityStyle() {
    if (document.getElementById(CE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CE_STYLE_ID;
    style.textContent = `
      .hub-library-spells .stats .ce-stat {
        grid-column: 1 / -1;
        min-width: 0;
      }
      .hub-library-spells .ce-stat .ce-category {
        display: block;
        margin: 8px 0 13px;
        font-size: 1rem;
        font-weight: 700;
        color: var(--hub-text, #f4f7fb);
      }
      .hub-library-spells .ce-stat .ce-guidance {
        margin: 7px 0 11px;
        color: var(--hub-text-2, #c5cfdb);
        font-size: .86rem;
        line-height: 1.55;
      }
      .hub-library-spells .ce-stat .ce-compat-title {
        margin: 12px 0 8px;
        font-size: .81rem;
        font-weight: 700;
        color: var(--hub-text, #f4f7fb);
      }
      .hub-library-spells .ce-stat .ce-compat-list {
        display: grid;
        grid-template-columns: minmax(82px, 120px) minmax(0, 1fr);
        gap: 0;
        margin: 0;
        padding: 0;
        border: 1px solid var(--hub-border, #223245);
        border-radius: 9px;
        overflow: hidden;
      }
      .hub-library-spells .ce-stat .ce-compat-list dt,
      .hub-library-spells .ce-stat .ce-compat-list dd {
        min-width: 0;
        padding: 9px 11px;
        margin: 0;
        font-size: .85rem;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .hub-library-spells .ce-stat .ce-compat-list dt {
        font-weight: 700;
        color: var(--hub-text, #f4f7fb);
        background: rgba(103, 184, 255, .08);
      }
      .hub-library-spells .ce-stat .ce-compat-list dd {
        color: var(--hub-text-2, #c5cfdb);
        border-left: 1px solid var(--hub-border, #223245);
      }
      .hub-library-spells .ce-stat .ce-compat-list :is(dt,dd):nth-of-type(n+2) {
        border-top: 1px solid var(--hub-border, #223245);
      }
      @media(max-width:420px) {
        .hub-library-spells .ce-stat .ce-compat-list { grid-template-columns: 85px minmax(0,1fr); }
        .hub-library-spells .ce-stat .ce-compat-list :is(dt,dd) { padding: 8px 9px; }
      }
    `;
    document.head.appendChild(style);
  }

  const ALLOWED_CE_TYPES = Object.freeze({
    CM: [['5', 'CL (1)'], ['10', 'CL (até 2)'], ['20', 'CL (até 2), CI ou CZ — alternativas exclusivas']],
    CI: [['5', 'CL (1)'], ['10', 'CL (até 2)'], ['20', 'CL (até 2) ou CM']],
    CZ: [['5', 'CL (1)'], ['10', 'CL (até 2)'], ['20', 'CL (até 2) ou CM']],
    CL: [['5', 'CM, CI ou CZ'], ['10', 'CM, CI ou CZ; ou outra CL no conjunto permitido'], ['20', 'CM, CI ou CZ; ou outra CL no conjunto permitido']]
  });

  function allowedTypesHTML(category) {
    const rows = ALLOWED_CE_TYPES[category] || [];
    if (!rows.length) return '';
    return `<div class="ce-compat-title">Tipos de CE com os quais pode coexistir</div>
      <dl class="ce-compat-list">${rows.map(([level,allowed]) =>
        `<dt>Nível ${level}+</dt><dd>${allowed}</dd>`
      ).join('')}</dl>`;
  }

  function compatibilityHTML(record) {
    const category = record.limite_coexistencia;
    const label = LABELS[category] || 'Classificação não informada';
    if (category === 'SC') {
      return '<p class="ce-guidance">Esta magia não exige concentração e não ocupa uma posição nos Limites de Coexistência.</p>';
    }
    if (category === 'ND') {
      return '<p class="ce-guidance">A fonte cadastrada não informa se esta magia exige concentração. Não é possível atribuir uma categoria ou autorizar coexistência sem verificar a versão da magia.</p>';
    }
    if (category === 'NC' || !COMPATIBILITY[category]) {
      return '<p class="ce-guidance">A magia exige concentração, mas sua categoria ainda não foi validada na lista da Regra da Casa. Até a validação, não participa automaticamente das combinações de Concentração Expandida; continua sujeita à regra normal de concentração única.</p>';
    }
    const rows = COMPATIBILITY[category].map(([level, combination]) =>
      `<dt>Nível ${level}+</dt><dd>${combination}</dd>`
    ).join('');
    const conditional = normalizeCE(record.nome_original) === normalizeCE('Bestow Curse')
      ? '<p class="ce-guidance">Esta classificação se aplica apenas às conjurações que efetivamente exigem concentração.</p>'
      : '';
    return `<span class="ce-category">${label}</span>
      ${allowedTypesHTML(category)}
      <div class="ce-compat-title">Combinações completas permitidas por nível</div>
      <dl class="ce-compat-list">${rows}</dl>
      <p class="ce-guidance">Cada combinação representa o conjunto completo de magias simultâneas; esta magia ocupa uma das posições de sua categoria. No nível 1, mantém-se apenas uma magia de concentração por vez. As combinações de níveis anteriores continuam permitidas. Outras combinações não estão autorizadas pela regra.</p>${conditional}`;
  }

  const normalizeCE = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const setOf = list => new Set(list.map(normalizeCE));

  const CM = setOf([
    'Banishment','Compelled Duel','Confusion','Control Water','Crown of Madness',
    'Dominate Beast','Dominate Monster','Dominate Person','Earthbind',
    "Evard's Black Tentacles",'Fear','Flesh to Stone','Hold Monster','Hold Person',
    'Hypnotic Pattern','Maze',"Otto's Irresistible Dance",'Polymorph','Reverse Gravity',
    'Slow','Telekinesis',"Tasha's Hideous Laughter",'Wall of Force','Watery Sphere','Web'
  ]);

  const CI = setOf([
    'Animate Objects','Conjure Animals','Conjure Celestial','Conjure Elemental','Conjure Fey',
    'Conjure Minor Elementals','Conjure Woodland Beings','Danse Macabre','Infernal Calling',
    'Summon Aberration','Summon Beast','Summon Celestial','Summon Construct',
    'Summon Draconic Spirit','Summon Elemental','Summon Fey','Summon Fiend',
    'Summon Greater Demon','Summon Lesser Demons','Summon Shadowspawn','Summon Undead'
  ]);

  const CZ = setOf([
    'Blade Barrier','Call Lightning','Cloud of Daggers','Cloudkill','Create Bonfire','Darkness',
    'Dawn','Dust Devil','Earthquake','Flaming Sphere','Fog Cloud','Hunger of Hadar',
    'Incendiary Cloud','Insect Plague','Maelstrom','Moonbeam','Sickening Radiance','Silence',
    'Sleet Storm','Spike Growth','Spirit Guardians','Storm Sphere','Wall of Fire','Wall of Ice',
    'Wall of Light','Wall of Sand','Wall of Stone','Wall of Thorns','Wall of Water','Whirlwind'
  ]);

  const CL = setOf([
    'Alter Self','Barkskin','Beast Sense','Bless','Blur','Divine Favor',"Dragon's Breath",
    'Enhance Ability','Enlarge/Reduce','Expeditious Retreat','Fly','Greater Invisibility','Haste',
    'Heroism','Invisibility','Magic Weapon','Protection from Energy','Protection from Evil and Good',
    'Shield of Faith','Skill Empowerment','Spider Climb','Stoneskin',"Tenser's Transformation",
    'True Strike','Zephyr Strike','Bane','Bestow Curse','Cause Fear','Detect Thoughts','Faerie Fire',
    'Hex',"Hunter's Mark",'Ray of Enfeeblement','Searing Smite','Thunderous Smite','Wrathful Smite'
  ]);

  const CZ_2024 = setOf(['Conjure Celestial','Conjure Minor Elementals','Conjure Woodland Beings']);

  function classify(raw, record) {
    const name = normalizeCE(record?.nome_original || raw?.name || record?.nome || '');
    if (record?.concentracao == null) return 'ND';
    if (record.concentracao === false) return 'SC';
    if (record.concentracao !== true) return 'ND';

    if (record?.ruleset === '5.5e' && CZ_2024.has(name)) return 'CZ';
    if (CM.has(name)) return 'CM';
    if (CI.has(name)) return 'CI';
    if (CZ.has(name)) return 'CZ';
    if (CL.has(name)) return 'CL';

    // A lista oficial é normativa. Magias novas/revisadas não são classificadas
    // por semelhança de nome, área ou condição: aguardam validação explícita.
    return 'NC';
  }

  function applySeal(record, raw) {
    if (!record) return record;
    if (record.limite_coexistencia && raw == null) return record;
    record.limite_coexistencia = classify(raw, record);
    record.limite_coexistencia_nome = LABELS[record.limite_coexistencia];
    return record;
  }

  // Interface compartilhada com a Ficha Digital, usando a MESMA lista normativa da Biblioteca.
  function present(record) {
    const category = classify(null, record);
    return Object.freeze({
      category,
      label: LABELS[category] || 'Classificação não informada',
      html: compatibilityHTML({ ...record, limite_coexistencia: category })
    });
  }
  if (typeof window !== 'undefined') {
    window.HubConcentracaoExpandida = Object.freeze({ present });
  }

  if (typeof officialRecord === 'function') {
    const baseOfficialRecord = officialRecord;
    officialRecord = function(spell, src, lookup) {
      return applySeal(baseOfficialRecord(spell, src, lookup), spell);
    };
  }

  if (typeof localRecord === 'function') {
    const baseLocalRecord = localRecord;
    localRecord = function(item, fonts) {
      return applySeal(baseLocalRecord(item, fonts), item);
    };
  }

  if (typeof renderList === 'function') {
    const baseRenderList = renderList;
    renderList = function() {
      baseRenderList();
      document.querySelectorAll('#lista .item').forEach(button => {
        const record = (typeof ALL !== 'undefined' ? ALL : []).find(x => x.id === button.dataset.id);
        if (!record) return;
        applySeal(record, null);
        const small = button.querySelector('small');
        if (small && !small.dataset.ceSeal) {
          small.dataset.ceSeal = '1';
          const seal = record.limite_coexistencia === 'SC'
            ? 'Sem Concentração'
            : record.limite_coexistencia === 'NC'
              ? 'Pendente de classificação'
              : record.limite_coexistencia;
          small.append(` · CE: ${seal}`);
        }
      });
    };
  }

  if (typeof renderDetail === 'function') {
    const baseRenderDetail = renderDetail;
    renderDetail = function(id) {
      baseRenderDetail(id);
      const record = (typeof ALL !== 'undefined' ? ALL : []).find(x => x.id === id);
      if (!record) return;
      applySeal(record, null);
      const detail = document.getElementById('detalhe');
      const meta = detail?.querySelector('.meta');
      if (meta && !meta.querySelector('.ce-seal')) {
        const badge = document.createElement('span');
        badge.className = 'badge ce-seal';
        badge.textContent = `CE · ${record.limite_coexistencia_nome}`;
        if (normalizeCE(record.nome_original) === normalizeCE('Bestow Curse') && record.limite_coexistencia === 'CL') {
          badge.title = 'A categoria aplica-se apenas às conjurações que efetivamente exigem concentração.';
        } else if (record.limite_coexistencia === 'NC') {
          badge.title = 'A magia exige concentração, mas ainda precisa de validação explícita na lista oficial da Regra da Casa.';
        }
        meta.insertBefore(badge, meta.children[4] || null);
      }
      const stats = detail?.querySelector('.stats');
      if (stats && !stats.querySelector('.ce-stat')) {
        const stat = document.createElement('div');
        stat.className = 'stat ce-stat';
        ensureCompatibilityStyle();
        stat.innerHTML = `<b><a class="ce-rule-link" href="regras.html#regra-expanded-concentration-house-rule" title="Ler a Regra da Casa — Concentração Expandida">Concentração Expandida</a></b>${compatibilityHTML(record)}`;
        stats.appendChild(stat);
      }
    };
  }

  if (document.getElementById('lista') && document.getElementById('detalhe')) {
  let tries = 0;
  const ready = setInterval(() => {
    tries += 1;
    if (typeof ALL !== 'undefined' && ALL.length) {
      ALL.forEach(x => applySeal(x, null));
      if (typeof renderList === 'function') renderList();
      if (typeof CURRENT !== 'undefined' && CURRENT && typeof renderDetail === 'function') renderDetail(CURRENT);
      clearInterval(ready);
    } else if (tries > 100) {
      clearInterval(ready);
    }
  }, 100);
  }
})();
