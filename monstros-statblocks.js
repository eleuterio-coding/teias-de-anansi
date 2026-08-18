(() => {
  const SRD_URL = 'https://gist.githubusercontent.com/krisimmig/f4b7d2a30cadd2d94107f5533ba9c85c/raw/dnd_srd_5_2_1__monsters.json';
  const ATTRIBUTION = 'This work includes material from the System Reference Document 5.2.1 (SRD 5.2.1) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License.';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase().replace(/[^a-z0-9]+/g,'');
  const signed = n => Number(n) >= 0 ? `+${Number(n)}` : String(Number(n));
  const list = v => Array.isArray(v) ? v.join(', ') : (v || '');
  const speed = v => v && typeof v === 'object' ? Object.entries(v).map(([k,x]) => `${k === 'walk' ? 'Walk' : k[0].toUpperCase()+k.slice(1)} ${x} ft.`).join(', ') : '';

  function entries(title, value) {
    if (!value || (Array.isArray(value) && !value.length)) return '';
    const arr = Array.isArray(value) ? value : [value];
    const body = arr.map(x => typeof x === 'string'
      ? `<p>${esc(x)}</p>`
      : x ? `<p><strong>${esc(x.name || '')}${x.name ? '.' : ''}</strong> ${esc(x.desc || '')}</p>` : '').join('');
    return body ? `<section class="sb-section"><h4>${esc(title)}</h4>${body}</section>` : '';
  }

  function statBlock(m) {
    const abs = [['STR',m.strength,m.strength_save],['DEX',m.dexterity,m.dexterity_save],['CON',m.constitution,m.constitution_save],['INT',m.intelligence,m.intelligence_save],['WIS',m.wisdom,m.wisdom_save],['CHA',m.charisma,m.charisma_save]];
    const facts = [
      ['Vulnerabilities',list(m.damage_vulnerabilities)],['Resistances',list(m.damage_resistances)],
      ['Immunities',list(m.damage_immunities)],['Condition Immunities',list(m.condition_immunities)],
      ['Senses',m.senses],['Languages',m.languages]
    ].filter(([,v]) => v);
    return `<div class="statblock srd-statblock">
      <div class="sb-head"><div><h3>${esc(m.name)}</h3><p>${esc([m.size,m.type,m.alignment].filter(Boolean).join(' '))}</p></div><span class="sb-source">SRD 5.2.1</span></div>
      <div class="sb-core"><span><strong>AC</strong> ${esc(m.armor_class)}</span><span><strong>HP</strong> ${esc(m.hit_points)}${m.hit_dice ? ` (${esc(m.hit_dice)})` : ''}</span>${m.initiative !== undefined ? `<span><strong>Initiative</strong> ${esc(signed(m.initiative))}</span>` : ''}${m.challenge_rating ? `<span><strong>CR</strong> ${esc(m.challenge_rating)}</span>` : ''}</div>
      <p><strong>Speed</strong> ${esc(speed(m.speed))}</p>
      <div class="sb-abilities">${abs.map(([l,s,sv]) => `<div><strong>${l}</strong><span>${esc(s)}</span><small>Save ${esc(signed(sv ?? 0))}</small></div>`).join('')}</div>
      ${m.skills ? `<p><strong>Skills</strong> ${esc(typeof m.skills === 'object' ? Object.entries(m.skills).map(([k,v]) => `${k} ${signed(v)}`).join(', ') : m.skills)}</p>` : ''}
      ${facts.map(([k,v]) => `<p><strong>${esc(k)}</strong> ${esc(v)}</p>`).join('')}
      ${entries('Traits',m.special_abilities)}${entries('Actions',m.actions)}${entries('Bonus Actions',m.bonus_actions)}${entries('Reactions',m.reactions)}${entries('Legendary Actions',m.legendary_actions)}
      <p class="sb-license">${esc(ATTRIBUTION)}</p>
    </div>`;
  }

  function restricted(name) {
    return `<div class="statblock restricted-statblock"><div class="sb-head"><div><h3>${esc(name)}</h3><p>Monster Manual (2025)</p></div><span class="sb-source">Fora do SRD</span></div><p><strong>Status:</strong> stat block oficial identificado, mas não reproduzido integralmente neste repositório público porque a criatura não possui bloco correspondente no SRD 5.2.1.</p><p><strong>Fonte:</strong> Monster Manual (2025).</p></div>`;
  }

  function styles() {
    if (document.getElementById('statblock-styles')) return;
    const s = document.createElement('style'); s.id='statblock-styles'; s.textContent=`
      .statblock{margin-top:14px;padding:16px;border:1px solid #8885;border-radius:10px;background:#88808}.sb-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:2px solid #8885;padding-bottom:10px;margin-bottom:10px}.sb-head h3{margin:0 0 3px;font-size:1.25rem}.sb-head p{margin:0;opacity:.78;font-style:italic}.sb-source{font-size:.78rem;white-space:nowrap;border:1px solid #8886;border-radius:999px;padding:4px 8px;opacity:.8}.sb-core{display:flex;flex-wrap:wrap;gap:8px 18px;margin:8px 0}.sb-abilities{display:grid;grid-template-columns:repeat(6,minmax(72px,1fr));gap:6px;margin:12px 0}.sb-abilities div{border:1px solid #8884;border-radius:8px;padding:7px;text-align:center;display:grid;gap:2px}.sb-abilities span{font-size:1.08rem}.sb-abilities small{opacity:.72}.sb-section{margin-top:14px}.sb-section h4{margin:0 0 7px;border-bottom:1px solid #8884;padding-bottom:4px}.sb-section p{margin:7px 0}.sb-license{margin-top:16px;padding-top:10px;border-top:1px solid #8884;font-size:.76rem;opacity:.65}.restricted-statblock{border-style:dashed}.statblock-loading{opacity:.7;font-size:.9rem;margin-top:12px}@media(max-width:760px){.sb-abilities{grid-template-columns:repeat(3,1fr)}.sb-head{display:block}.sb-source{display:inline-block;margin-top:8px}}`;
    document.head.appendChild(s);
  }

  let mapPromise;
  function load() {
    if (!mapPromise) mapPromise = fetch(SRD_URL,{cache:'force-cache'}).then(r => {if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();}).then(data => {
      const map = new Map(); Object.values(data).forEach(m => { if (m && typeof m === 'object' && m.name) map.set(norm(m.name),m); }); return map;
    }).catch(e => { console.error('Falha ao carregar stat blocks SRD 5.2.1',e); return new Map(); });
    return mapPromise;
  }

  async function enhance(card) {
    if (!card || card.dataset.statblockEnhanced === '1') return;
    const name = card.querySelector('summary strong')?.textContent?.trim(); const body = card.querySelector('.corpo');
    if (!name || !body) return; card.dataset.statblockEnhanced='1';
    const holder=document.createElement('div'); holder.innerHTML='<p class="statblock-loading">Carregando stat block...</p>'; body.insertBefore(holder,body.firstChild);
    const map=await load(); const hit=map.get(norm(name)); holder.innerHTML=hit ? statBlock(hit) : restricted(name);
  }

  function all(){ if(new URLSearchParams(location.search).get('modulo')!=='Monstros') return; styles(); document.querySelectorAll('#lista-monstros details.regra').forEach(enhance); }
  function start(){ if(new URLSearchParams(location.search).get('modulo')!=='Monstros') return; all(); const t=document.getElementById('lista-monstros')||document.body; new MutationObserver(all).observe(t,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
