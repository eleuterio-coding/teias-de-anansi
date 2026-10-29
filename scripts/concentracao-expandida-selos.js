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

  // Exibição compacta da categoria, sem regras de coexistência no card.
  const CE_STYLE_ID = 'hub-ce-coexistencia-style';
  function ensureCompatibilityStyle() {
    if (document.getElementById(CE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CE_STYLE_ID;
    style.textContent = `
      .hub-library-spells .stats .ce-stat { grid-column: 1 / -1; min-width: 0; }
      .hub-library-spells .ce-stat .ce-category {
        display: block; margin: 7px 0 0; font-size: 1rem;
        font-weight: 700; color: var(--hub-text, #f4f7fb);
      }
    `;
    document.head.appendChild(style);
  }

  function compatibilityHTML(record) {
    const category = record.limite_coexistencia;
    if (category === 'SC') return '<span class="ce-category">—</span>';
    return `<span class="ce-category">${LABELS[category] || 'Classificação não informada'}</span>`;
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

  // Novas magias de L’Arsene: categorias explícitas após a confirmação de concentração.
  const LARSENE_CE = Object.freeze({
    CL: setOf(["Chameleon Skin","Daydream","Protection","Blood Frenzy","Coralskin","Sugar Rush","Flesh to Bone"]),
    CM: setOf(["Riptide","Enrage","Living Candle","Humperdink’s Irresistible Revelry"]),
    CZ: setOf(["Acid Rain","Aura of Impurity","Purple Rain","Gravity Smash","Crimson Death","Field of Bones"])
  });

  // Classificações adicionais aprovadas para as 121 magias anteriormente NC (29/10/2026).
  // Fonte única para Biblioteca e Ficha: não inferir classes para novas magias.
  const APPROVED_CE = Object.freeze({
    CM: setOf([
      "Ensnaring Strike", "Entangle", "Sleep", "Suggestion",
      "Phantasmal Force", "Levitate", "Maximilian's Earthen Grasp", "Enemies Abound",
      "Otiluke's Resilient Sphere", "Grasping Vine", "Compulsion", "Banishing Smite",
      "Modify Memory", "Bigby's Hand", "Mental Prison", "Eyebite",
      "Forcecage", "Invulnerability", "Weird", "Mass Polymorph",
      "Shapechange", "True Polymorph"
    ]),
    CI: setOf([
      "Conjure Constructs", "Giant Insect", "Summon Dragon"
    ]),
    CZ: setOf([
      "Healing Spirit", "Gust of Wind", "Warding Wind", "Stinking Cloud",
      "Cacophonic Shield", "Wind Wall", "Doomtide", "Spellfire Storm",
      "Antilife Shell", "Yolande's Regal Presence", "Jallarzi's Storm of Radiance", "Wrath of Nature",
      "Control Winds", "Songal's Elemental Suffusion", "Globe of Invulnerability", "Arcane Gate",
      "Dirge", "Sunbeam", "Move Earth", "Delayed Blast Fireball",
      "Antimagic Field", "Tsunami", "Maddening Darkness", "Illusory Dragon",
      "Control Weather", "Gate", "Storm of Vengeance"
    ]),
    CL: setOf([
      "Blade Ward", "Resistance", "Guidance", "Magecraft",
      "Friends", "Dancing Lights", "Beast Bond", "Detect Evil and Good",
      "Detect Magic", "Detect Poison and Disease", "Tasha's Caustic Brew", "Witch Bolt",
      "Silent Image", "Elminster's Elusion", "Pass without Trace", "Locate Object",
      "Mind Spike", "Calm Emotions", "Enthrall", "Flame Blade",
      "Spiritual Weapon", "Shadow Blade", "Heat Metal", "Shining Smite",
      "Skywrite", "Aura of Vitality", "Beacon of Hope", "Intellect Fortress",
      "Clairvoyance", "Crusader's Mantle", "Melf's Minute Meteors", "Major Image",
      "Spirit Shroud", "Vampiric Touch", "Elemental Weapon", "Flame Arrows",
      "Gaseous Form", "Aura of Life", "Aura of Purity", "Arcane Eye",
      "Locate Creature", "Fount of Moonlight", "Phantasmal Killer", "Shadow of Moil",
      "Elemental Bane", "Guardian of Nature", "Alustriel's Mooncloak", "Circle of Power",
      "Dispel Evil and Good", "Scrying", "Far Step", "Tree Stride",
      "Holy Weapon", "Immolation", "Mislead", "Enervation",
      "Swift Quiver", "Primordial Ward", "Find the Path", "Investiture of Flame",
      "Investiture of Ice", "Investiture of Stone", "Investiture of Wind", "Tasha's Otherworldly Guise",
      "Mordenkainen's Sword", "Project Image", "Holy Aura", "Holy Star of Mystra",
      "Blade of Disaster"
    ])
  });


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
    for (const category of ['CM','CI','CZ','CL']) {
      if (APPROVED_CE[category].has(name) || LARSENE_CE[category]?.has(name)) return category;
    }

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
        meta.insertBefore(badge, meta.children[4] || null);
      }
      const stats = detail?.querySelector('.stats');
      if (stats && !stats.querySelector('.ce-stat')) {
        const stat = document.createElement('div');
        stat.className = 'stat ce-stat';
        ensureCompatibilityStyle();
        stat.innerHTML = `<b>Concentração Expandida</b>${compatibilityHTML(record)}`;
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
