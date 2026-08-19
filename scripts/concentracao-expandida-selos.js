(() => {
  const LABELS = {
    CM: 'CM — Concentração Maior',
    CI: 'CI — Concentração de Invocação',
    CZ: 'CZ — Concentração de Zona',
    CL: 'CL — Concentração Leve',
    SC: 'Sem Concentração'
  };

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
    if (record?.concentracao !== true) return 'SC';

    if (record?.ruleset === '5.5e' && CZ_2024.has(name)) return 'CZ';
    if (CM.has(name)) return 'CM';
    if (CI.has(name)) return 'CI';
    if (CZ.has(name)) return 'CZ';
    if (CL.has(name)) return 'CL';

    const misc = new Set(raw?.miscTags || []);
    if (misc.has('SMN') || /^(summon|conjure|animate)\b/.test(name) || /\bsummon\b/.test(name)) return 'CI';

    const areaTags = raw?.areaTags || [];
    const rangeType = raw?.range?.type || '';
    const areaShape = areaTags.some(tag => ['C','L','R','S','Q','W','Y'].includes(tag)) ||
      ['cone','cube','line','radius','sphere','hemisphere','cylinder','emanation'].includes(rangeType);
    const zoneName = /\b(wall|cloud|fog|storm|aura|zone|field|barrier|darkness|silence|sleet|spike growth|moonbeam|earthquake|whirlwind|hunger of hadar|insect plague|entangle|maelstrom|dawn|bonfire|sphere)\b/;
    if (areaShape || zoneName.test(name)) return 'CZ';

    const strongConditions = new Set(['paralyzed','restrained','stunned','frightened','charmed','petrified']);
    if ((raw?.conditionInflict || []).some(c => strongConditions.has(c))) return 'CM';

    const majorName = /\b(banish|dominate|hold|confus|fear|maze|polymorph|telekinesis|flesh to stone|irresistible dance|slow|crown of madness|hideous laughter|control water|reverse gravity)\b/;
    if (majorName.test(name)) return 'CM';

    return 'CL';
  }

  function applySeal(record, raw) {
    if (!record) return record;
    record.limite_coexistencia = classify(raw, record);
    record.limite_coexistencia_nome = LABELS[record.limite_coexistencia];
    return record;
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
          small.append(` · CE: ${record.limite_coexistencia === 'SC' ? 'Sem Concentração' : record.limite_coexistencia}`);
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
        }
        meta.insertBefore(badge, meta.children[4] || null);
      }
      const stats = detail?.querySelector('.stats');
      if (stats && !stats.querySelector('.ce-stat')) {
        const stat = document.createElement('div');
        stat.className = 'stat ce-stat';
        stat.innerHTML = `<b>Concentração Expandida</b><span>${typeof esc === 'function' ? esc(record.limite_coexistencia_nome) : record.limite_coexistencia_nome}</span>`;
        stats.appendChild(stat);
      }
    };
  }

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
})();
