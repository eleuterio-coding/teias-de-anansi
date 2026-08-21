(()=>{
  'use strict';

  const STORAGE_KEY='hub-rpg:characters:v1';
  const DATA_VERSION='20260821-character-builder1';
  const PIN='bfd3db4bcc31699cce703b46feb9af3f0ff08999';
  const RAW24=`https://raw.githubusercontent.com/5e-bits/5e-database/${PIN}/src/2024/en`;
  const RAW14=`https://raw.githubusercontent.com/5e-bits/5e-database/${PIN}/src/2014/en`;
  const ABILITIES=['Força','Destreza','Constituição','Inteligência','Sabedoria','Carisma'];
  const CORE_SPECIES=['dragonborn','dwarf','elf','gnome','goliath','halfling','human','orc','tiefling'];
  const LEGACY_SPECIES=['half-elf','half-orc'];
  const CLASS_SLUGS=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
  const CLASS_LOCFILES={barbarian:'barbaro',bard:'bardo',cleric:'clerigo',druid:'druida',fighter:'guerreiro',monk:'monge',paladin:'paladino',ranger:'patrulheiro',rogue:'ladino',sorcerer:'feiticeiro',warlock:'bruxo',wizard:'mago'};
  const BACKGROUND_PACKAGES=[
    'dados/antecedentes-srd-5.2.1.json',
    'dados/antecedentes-abertos-adicionais.json',
    'dados/antecedentes-pdf-phb-2024.json',
    'dados/antecedentes-pdf-forge-2025.json',
    'dados/antecedentes-pdf-heroes-2025.json',
    'dados/antecedentes-pdf-quickstone-2024.json'
  ];
  const SPECIES_PACKAGES=[
    'dados/especies-pdf-phb-2024.json',
    'dados/especies-pdf-forge-2025.json',
    'dados/especies-pdf-quickstone-2024.json',
    'dados/especies-pdf-motm-2022.json'
  ];

  const state={catalogs:{species:[],backgrounds:[],classes:[]},character:null,loading:true,loadWarnings:[]};
  const $=id=>document.getElementById(id);
  const arr=v=>Array.isArray(v)?v:[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const slug=s=>fold(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const unique=a=>[...new Set(a.filter(Boolean))];
  const number=v=>Number.isFinite(Number(v))?Number(v):0;
  const abilityMod=score=>Math.floor((number(score)-10)/2);
  const signed=n=>`${n>=0?'+':''}${n}`;
  const profBonus=level=>2+Math.floor((Math.max(1,number(level))-1)/4);

  async function json(url){
    const r=await fetch(`${url}${url.includes('?')?'&':'?'}v=${DATA_VERSION}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  }

  function readCharacters(){
    try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(data)?data:[]}catch{return[]}
  }
  function writeCharacters(list){localStorage.setItem(STORAGE_KEY,JSON.stringify(list))}
  function uid(){return globalThis.crypto?.randomUUID?.()||`pc-${Date.now()}-${Math.random().toString(16).slice(2)}`}
  function blankCharacter(){
    return {
      schema:'hub-rpg/personagem/v1',id:uid(),name:'',ruleset:'5.5e',
      refs:{species:null,background:null,class:null},
      refSnapshots:{},
      choices:{species:{size:null,lineage:null},background:{abilityMode:'2+1',plus2:null,plus1:null,equipment:'A',toolChoice:''},class:{level:1,proficiencies:[]}},
      baseAbilities:Object.fromEntries(ABILITIES.map(a=>[a,10])),
      updatedAt:new Date().toISOString()
    };
  }
  function loadCharacter(){
    const id=new URLSearchParams(location.search).get('id');
    const saved=id?readCharacters().find(c=>c.id===id):null;
    const c=saved?structuredClone(saved):blankCharacter();
    c.refs={species:null,background:null,class:null,...(c.refs||{})};
    c.refSnapshots=c.refSnapshots||{};
    c.choices=c.choices||{};
    c.choices.species={size:null,lineage:null,...(c.choices.species||{})};
    c.choices.background={abilityMode:'2+1',plus2:null,plus1:null,equipment:'A',toolChoice:'',...(c.choices.background||{})};
    c.choices.class={level:1,proficiencies:[],...(c.choices.class||{})};
    c.baseAbilities={...Object.fromEntries(ABILITIES.map(a=>[a,10])),...(c.baseAbilities||{})};
    return c;
  }

  function localizeGlobal(value,G){
    if(value==null)return'';
    let s=String(value);
    const groups=[G?.classes,G?.atributos,G?.pericias,G?.condicoes,G?.danos,G?.tamanhos,G?.tipos_criatura,G?.alinhamentos,G?.acoes,G?.regras,G?.armas,G?.armaduras,G?.raridades];
    for(const dict of groups)for(const [k,v] of Object.entries(dict||{}))s=s.replace(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),v);
    return s;
  }

  async function loadSpecies(){
    const locPromise=json('dados/localizacao-ptbr-especies.json').catch(e=>{state.loadWarnings.push(e.message);return{species:{},lineages:{},traits:{}}});
    const packagePromise=Promise.allSettled(SPECIES_PACKAGES.map(json));
    const remotePromise=Promise.all([
      json(`${RAW24}/5e-SRD-Species.json`),json(`${RAW24}/5e-SRD-Subspecies.json`),json(`${RAW24}/5e-SRD-Traits.json`),
      json(`${RAW14}/5e-SRD-Races.json`),json(`${RAW14}/5e-SRD-Traits.json`)
    ]).catch(e=>{state.loadWarnings.push(`Raças SRD: ${e.message}`);return[[],[],[],[],[]]});
    const [LOC,pkgResults,remote]=await Promise.all([locPromise,packagePromise,remotePromise]);
    const [species24,subs24,traits24,races14,traits14]=remote;
    const trait24=new Map(arr(traits24).map(x=>[x.index,x])), trait14=new Map(arr(traits14).map(x=>[x.index,x])), subMap=new Map(arr(subs24).map(x=>[x.index,x]));
    const locTrait=t=>{const l=LOC?.traits?.[t?.name];return{name:l?.name||t?.name||'Traço',text:l?.text||String(t?.description||arr(t?.desc).join('\n')||'')}};
    const fullTrait=(ref,map)=>{const raw=map.get(ref?.index)||ref||{};const t=locTrait(raw);return{...t,level:ref?.level??null}};
    const sizeText=s=>s?.size||s?.size_options?.desc||arr(s?.size_options?.from?.options).map(o=>o?.item?.name||o?.string||o?.name).filter(Boolean).join(' / ')||'Conforme escolha';
    const current=arr(species24).filter(s=>CORE_SPECIES.includes(s.index)).map(s=>({
      id:`especies:srd521:${s.index}`,name:LOC?.species?.[s.name]||s.name,originalName:s.name,ruleset:'5.5e',revision:2024,source:'SRD 5.2.1 / PHB 2024',sourceId:'srd-5.2.1',
      type:s.type||'Humanoid',sizes:[sizeText(s)],speed:number(s.speed)||30,
      traits:arr(s.traits).map(r=>fullTrait(r,trait24)),
      lineages:arr(s.subspecies).map(ref=>{const sub=subMap.get(ref.index);return{name:LOC?.lineages?.[sub?.name]||sub?.name||ref.name,traits:arr(sub?.traits).map(r=>fullTrait(r,trait24))}}),
      abilityBonuses:[]
    }));
    const race14Map=new Map(arr(races14).map(x=>[x.index,x]));
    const legacy=LEGACY_SPECIES.map(k=>race14Map.get(k)).filter(Boolean).map(r=>({
      id:`especies:srd51:${r.index}`,name:LOC?.species?.[r.name]||r.name,originalName:r.name,ruleset:'5e',revision:2014,source:'SRD 5.1',sourceId:'srd-5.1',type:'Humanoid',sizes:[r.size],speed:number(r.speed)||30,
      traits:arr(r.traits).map(x=>fullTrait(x,trait14)),lineages:[],abilityBonuses:arr(r.ability_bonuses).map(x=>({ability:x?.ability_score?.name,bonus:number(x?.bonus)}))
    }));
    const packages=pkgResults.filter(x=>x.status==='fulfilled').map(x=>x.value);
    pkgResults.filter(x=>x.status==='rejected').forEach(x=>state.loadWarnings.push(`Pacote de raça: ${x.reason?.message||x.reason}`));
    const pdf=packages.flatMap(pkg=>{const f=pkg?.fonte||{};return arr(pkg?.items).map(r=>({
      id:`especies:${f.id||'pdf'}:${slug(r.nome)}`,name:LOC?.species?.[r.nome]||r.nome,originalName:r.nome,ruleset:f.ruleset||'5e',revision:f.revisao_core||null,source:f.titulo||'Fonte PDF',sourceId:f.id||'pdf',
      type:r.tipo||'Humanoid',sizes:arr(r.tamanhos),speed:number(r.velocidade)||30,
      traits:arr(r.tracos).map(t=>({name:LOC?.traits?.[t.nome]?.name||t.nome,text:LOC?.traits?.[t.nome]?.text||t.texto||''})),
      lineages:arr(r.linhagens).map(l=>({name:LOC?.lineages?.[l.nome]||l.nome,traits:arr(l.tracos||l.traits).map(t=>({name:LOC?.traits?.[t.nome||t.name]?.name||t.nome||t.name,text:LOC?.traits?.[t.nome||t.name]?.text||t.texto||t.text||''}))})),
      abilityBonuses:arr(r.aumentos_atributo)
    }))});
    const seen=new Set();
    return [...current,...pdf,...legacy].filter(i=>i?.id&&!seen.has(i.id)&&(seen.add(i.id),true)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }

  function normalizeBackgroundItem(item,pkg){
    if(!item)return null;
    const ds=item?.mecanica?.dados_especificos;
    if(ds){
      const eq=ds.equipamento_inicial||{};
      return {
        id:item.id||`antecedentes:${slug(item.nome)}`,name:item.nome||item.nome_original||'Antecedente',ruleset:item?.compatibilidade?.ruleset||item?.fonte?.ruleset||'5.5e',revision:item?.compatibilidade?.revisao_core||2024,
        source:item?.fonte?.titulo||pkg?.fonte?.titulo||'Catálogo',sourceId:item?.fonte?.publicacao_id||'catalogo',
        abilities:arr(ds.atributos_elegiveis),skills:arr(ds.pericias),tools:arr(ds.ferramentas),toolChoice:arr(item?.mecanica?.escolhas).find(x=>/ferramenta|instrumento|jogo/i.test(x?.nome||''))?.nome||'',
        feat:ds.talento_origem?{name:ds.talento_origem.nome||ds.talento_origem.nome_original,choice:ds.talento_origem.escolha_fixa||''}:null,
        equipmentOptions:arr(eq.opcoes).map(o=>({id:o.id||String(o.nome||'A'),items:arr(o.itens),text:''})),equipmentText:'',description:item?.conteudo?.resumo||item?.conteudo?.descricao||''
      };
    }
    const source=pkg?.fonte||{};
    const year=number(source.ano)||2024;
    return {
      id:`antecedentes:${item.fonte_id||slug(source.titulo||'pdf')}:${slug(item.pt||item.nome)}`,name:item.pt||item.nome||'Antecedente',ruleset:year>=2024?'5.5e':'5e',revision:year>=2024?2024:2014,source:source.titulo||item.fonte_id||'Fonte PDF',sourceId:item.fonte_id||slug(source.titulo||'pdf'),
      abilities:arr(item.atributos),skills:arr(item.pericias),tools:[item.ferramenta].filter(Boolean),toolChoice:item.ferramenta_escolha||'',feat:item.talento?{name:item.talento,choice:item.talento_escolha||''}:null,
      equipmentOptions:[],equipmentText:item.equipamento||'',description:item.descricao||''
    };
  }

  async function loadBackgrounds(){
    const results=await Promise.allSettled(BACKGROUND_PACKAGES.map(json));
    const out=[];
    results.forEach((res,idx)=>{
      if(res.status==='rejected'){state.loadWarnings.push(`Antecedentes: ${res.reason?.message||res.reason}`);return}
      for(const item of arr(res.value?.items)){const n=normalizeBackgroundItem(item,res.value);if(n)out.push(n)}
    });
    const seen=new Set();
    return out.filter(i=>i.id&&!seen.has(i.id)&&(seen.add(i.id),true)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }

  function optionNames(choice,t){
    const opts=arr(choice?.from?.options).flatMap(o=>o?.item?.name?[o.item.name]:o?.items?arr(o.items).map(i=>i.name):o?.choice?arr(o.choice?.from?.options).map(q=>q?.item?.name).filter(Boolean):[]).filter(Boolean);
    return unique(opts.map(t));
  }

  async function loadClasses(){
    const locGlobal=json('dados/localizacao-ptbr-global.json').catch(()=>({}));
    const locFiles=Promise.all(CLASS_SLUGS.map(s=>json(`dados/classes-ptbr/${CLASS_LOCFILES[s]}.json`).catch(()=>({classe:s,nome:s,features:{}}))));
    const remote=Promise.all([json(`${RAW24}/5e-SRD-Classes.json`),json(`${RAW24}/5e-SRD-Levels.json`),json(`${RAW24}/5e-SRD-Features.json`)]).catch(e=>{state.loadWarnings.push(`Classes SRD: ${e.message}`);return[[],[],[]]});
    const [G,locs,[classes,levels,features]]=await Promise.all([locGlobal,locFiles,remote]);
    const locMap=Object.fromEntries(CLASS_SLUGS.map((s,i)=>[s,locs[i]])), featureMap=new Map(arr(features).map(f=>[f.index,f]));
    const t=v=>localizeGlobal(v,G);
    const featureLoc=(slugName,raw)=>{const feats=locMap[slugName]?.features||{};let key=raw?.index||'';let l=feats[key];if(!l){key=String(key).replace(/-\d+$/,'');l=feats[key]}return{name:l?.nome||t(raw?.name||'Característica'),text:l?.descricao||arr(raw?.desc).join('\n')||''}};
    const out=arr(classes).filter(c=>CLASS_SLUGS.includes(c.index)).map(c=>{
      const ls=arr(levels).filter(x=>x?.class?.index===c.index||String(x?.index||'').startsWith(`${c.index}-`)).sort((a,b)=>number(a.level)-number(b.level));
      const featLevels=[];const seen=new Set();
      for(const l of ls)for(const ref of arr(l.features)){if(seen.has(ref.index))continue;seen.add(ref.index);const raw=featureMap.get(ref.index)||ref;featLevels.push({level:number(l.level),...featureLoc(c.index,raw)})}
      const proficiencyChoices=arr(c.proficiency_choices).map(ch=>({choose:number(ch.choose||ch.count)||1,options:optionNames(ch,t)})).filter(ch=>ch.options.length);
      return {id:`classes:srd521:${c.index}`,name:locMap[c.index]?.nome||t(c.name),ruleset:'5.5e',revision:2024,source:'SRD 5.2.1',sourceId:'srd-5.2.1',slug:c.index,hitDie:number(c.hit_die),savingThrows:arr(c.saving_throws).map(x=>t(x?.name)),proficiencies:arr(c.proficiencies).map(x=>t(x?.name)),proficiencyChoices,features:featLevels,equipmentText:arr(c.starting_equipment_options).map(o=>t(o?.desc||'')).filter(Boolean).join(' • ')};
    });
    try{
      const art=await json('dados/artificer-2025.json');const c=art?.classe,db=c?.dados_base||{};
      if(c)out.push({id:c.id||'classes:pdf24merged1:artificer:2025',name:'Artífice',ruleset:c.ruleset||'5.5e',revision:c.revisao_core||2024,source:c?.fonte?.titulo||'Eberron: Forge of the Artificer',sourceId:'forge-artificer-2025',slug:'artificer',hitDie:8,savingThrows:arr(db.salvaguardas).map(t),proficiencies:unique([t(db.armas),t(db.armaduras),t(db.ferramentas)].filter(Boolean)),proficiencyChoices:[{choose:2,options:['Arcanismo','História','Investigação','Medicina','Natureza','Percepção','Prestidigitação']}],features:arr(c.caracteristicas).map(f=>({level:number(f.nivel)||1,name:f.nome,text:f.descricao||''})),equipmentText:Object.entries(db.equipamento_inicial||{}).map(([k,v])=>`${k}: ${t(v)}`).join(' • ')});
    }catch(e){state.loadWarnings.push(`Artífice: ${e.message}`)}
    return out.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }

  function byId(kind,id){return state.catalogs[kind].find(x=>x.id===id)||null}
  function current(){
    const c=state.character;
    return {species:byId('species',c.refs.species),background:byId('backgrounds',c.refs.background),klass:byId('classes',c.refs.class)};
  }

  function backgroundBonuses(bg,c){
    const out=Object.fromEntries(ABILITIES.map(a=>[a,0]));
    if(!bg)return out;
    const ch=c.choices.background;
    if(ch.abilityMode==='1+1+1')for(const a of bg.abilities.slice(0,3))out[a]=(out[a]||0)+1;
    else{
      if(bg.abilities.includes(ch.plus2))out[ch.plus2]+=2;
      if(bg.abilities.includes(ch.plus1)&&ch.plus1!==ch.plus2)out[ch.plus1]+=1;
    }
    return out;
  }

  function speciesBonuses(species){
    const out=Object.fromEntries(ABILITIES.map(a=>[a,0]));
    if(!species)return out;
    const aliases={STR:'Força',DEX:'Destreza',CON:'Constituição',INT:'Inteligência',WIS:'Sabedoria',CHA:'Carisma'};
    for(const b of arr(species.abilityBonuses)){const raw=b.ability||b.nome||b.atributo;const a=aliases[raw]||raw;if(out[a]!==undefined)out[a]+=number(b.bonus??b.valor??1)}
    return out;
  }

  function derived(){
    const c=state.character,{species,background,klass}=current();
    const bb=backgroundBonuses(background,c),sb=speciesBonuses(species),scores={};
    for(const a of ABILITIES)scores[a]=Math.min(20,number(c.baseAbilities[a])+number(bb[a])+number(sb[a]));
    const level=Math.max(1,Math.min(20,number(c.choices.class.level)||1)),pb=profBonus(level);
    const chosenClassSkills=arr(c.choices.class.proficiencies);
    const skills=unique([...(background?.skills||[]),...chosenClassSkills]);
    const tools=unique([...(background?.tools||[]),c.choices.background.toolChoice].filter(Boolean));
    const perceptionProficient=skills.some(x=>fold(x)==='percepcao');
    const sizeOptions=species?.sizes?.length?species.sizes:[];
    const size=c.choices.species.size&&sizeOptions.includes(c.choices.species.size)?c.choices.species.size:(sizeOptions[0]||'—');
    const lineage=species?.lineages?.find(x=>x.name===c.choices.species.lineage)||null;
    const speciesTraits=[...(species?.traits||[]),...(lineage?.traits||[])];
    const classFeatures=(klass?.features||[]).filter(f=>number(f.level)<=level);
    const conMod=abilityMod(scores.Constituição),dexMod=abilityMod(scores.Destreza),wisMod=abilityMod(scores.Sabedoria);
    const levelOneHp=klass?.hitDie?Math.max(1,klass.hitDie+conMod):null;
    const passive=10+wisMod+(perceptionProficient?pb:0);
    return {species,background,klass,bb,sb,scores,level,pb,skills,tools,size,lineage,speciesTraits,classFeatures,levelOneHp,initiative:dexMod,passive};
  }

  function renderSelects(){
    const c=state.character;
    const fill=(el,items,placeholder,selected)=>{el.innerHTML=`<option value="">${esc(placeholder)}</option>`+items.map(i=>`<option value="${esc(i.id)}" ${i.id===selected?'selected':''}>${esc(i.name)} · ${esc(i.ruleset)}${i.revision?`/${esc(i.revision)}`:''}</option>`).join('')};
    fill($('classe'),state.catalogs.classes,'Selecione a classe',c.refs.class);
    fill($('especie'),state.catalogs.species,'Selecione a raça',c.refs.species);
    fill($('antecedente'),state.catalogs.backgrounds,'Selecione o antecedente',c.refs.background);
    $('nivel').value=Math.max(1,Math.min(20,number(c.choices.class.level)||1));
    $('nome').value=c.name||'';
    for(const a of ABILITIES){const input=$(`base-${slug(a)}`);if(input)input.value=c.baseAbilities[a]}
  }

  function renderSpeciesChoices(){
    const {species}=current(),box=$('especie-escolhas'),c=state.character;
    if(!species){box.innerHTML='';return}
    let html='';
    if(species.sizes.length>1)html+=`<label>Tamanho<select id="especie-tamanho">${species.sizes.map(s=>`<option ${s===c.choices.species.size?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`;
    if(species.lineages.length)html+=`<label>Linhagem / escolha<select id="especie-linhagem"><option value="">Selecione</option>${species.lineages.map(l=>`<option ${l.name===c.choices.species.lineage?'selected':''}>${esc(l.name)}</option>`).join('')}</select></label>`;
    box.innerHTML=html?`<div class="choice-grid">${html}</div>`:'';
    $('especie-tamanho')?.addEventListener('change',e=>{c.choices.species.size=e.target.value;renderAll()});
    $('especie-linhagem')?.addEventListener('change',e=>{c.choices.species.lineage=e.target.value;renderAll()});
  }

  function renderBackgroundChoices(){
    const {background}=current(),box=$('antecedente-escolhas'),c=state.character;
    if(!background){box.innerHTML='';return}
    const ch=c.choices.background;
    if(!['2+1','1+1+1'].includes(ch.abilityMode))ch.abilityMode='2+1';
    if(!background.abilities.includes(ch.plus2))ch.plus2=background.abilities[0]||null;
    if(!background.abilities.includes(ch.plus1)||ch.plus1===ch.plus2)ch.plus1=background.abilities.find(a=>a!==ch.plus2)||null;
    const abilityOpts=sel=>background.abilities.map(a=>`<option value="${esc(a)}" ${a===sel?'selected':''}>${esc(a)}</option>`).join('');
    const eqOpts=background.equipmentOptions.length?`<label>Equipamento<select id="bg-equipment">${background.equipmentOptions.map(o=>`<option value="${esc(o.id)}" ${o.id===ch.equipment?'selected':''}>Pacote ${esc(o.id)}</option>`).join('')}</select></label>`:'';
    box.innerHTML=`<div class="choice-grid"><label>Aumento de atributos<select id="bg-mode"><option value="2+1" ${ch.abilityMode==='2+1'?'selected':''}>+2 em um e +1 em outro</option><option value="1+1+1" ${ch.abilityMode==='1+1+1'?'selected':''}>+1 nos três</option></select></label>${ch.abilityMode==='2+1'?`<label>+2<select id="bg-plus2">${abilityOpts(ch.plus2)}</select></label><label>+1<select id="bg-plus1">${abilityOpts(ch.plus1)}</select></label>`:''}${background.toolChoice?`<label>Escolha de ferramenta<input id="bg-tool" value="${esc(ch.toolChoice||'')}" placeholder="${esc(background.toolChoice)}"></label>`:''}${eqOpts}</div>`;
    $('bg-mode')?.addEventListener('change',e=>{ch.abilityMode=e.target.value;renderAll()});
    $('bg-plus2')?.addEventListener('change',e=>{ch.plus2=e.target.value;if(ch.plus1===ch.plus2)ch.plus1=background.abilities.find(a=>a!==ch.plus2)||null;renderAll()});
    $('bg-plus1')?.addEventListener('change',e=>{ch.plus1=e.target.value;renderAll()});
    $('bg-tool')?.addEventListener('input',e=>{ch.toolChoice=e.target.value;renderSheet()});
    $('bg-equipment')?.addEventListener('change',e=>{ch.equipment=e.target.value;renderSheet()});
  }

  function renderClassChoices(){
    const {klass}=current(),box=$('classe-escolhas'),c=state.character;
    if(!klass){box.innerHTML='';return}
    const groups=klass.proficiencyChoices||[];
    if(!groups.length){box.innerHTML='';return}
    const allowed=unique(groups.flatMap(g=>g.options));
    c.choices.class.proficiencies=arr(c.choices.class.proficiencies).filter(x=>allowed.includes(x));
    const choose=groups.reduce((n,g)=>n+g.choose,0);
    const chosen=c.choices.class.proficiencies;
    box.innerHTML=`<fieldset><legend>Perícias da classe — escolha ${choose}</legend><div class="check-grid">${allowed.map(o=>`<label class="check"><input type="checkbox" value="${esc(o)}" ${chosen.includes(o)?'checked':''} ${!chosen.includes(o)&&chosen.length>=choose?'disabled':''}>${esc(o)}</label>`).join('')}</div></fieldset>`;
    box.querySelectorAll('input[type=checkbox]').forEach(input=>input.addEventListener('change',e=>{const v=e.target.value;if(e.target.checked){if(chosen.length<choose)chosen.push(v)}else c.choices.class.proficiencies=chosen.filter(x=>x!==v);renderAll()}));
  }

  function equipmentText(bg,c){
    if(!bg)return'';
    if(bg.equipmentOptions.length){const op=bg.equipmentOptions.find(o=>o.id===c.choices.background.equipment)||bg.equipmentOptions[0];return op?.items?.map(i=>`${i.quantidade??1}× ${i.nome}${i.observacao?` (${i.observacao})`:''}`).join(', ')||''}
    return bg.equipmentText||'';
  }

  function pending(d){
    const p=[];const c=state.character;
    if(!d.klass)p.push('Escolha uma classe.');
    if(!d.species)p.push('Escolha uma raça.');
    if(!d.background)p.push('Escolha um antecedente.');
    if(d.species?.lineages?.length&&!c.choices.species.lineage)p.push('Escolha a linhagem/opção da raça.');
    if(d.background&&c.choices.background.abilityMode==='2+1'&&(!c.choices.background.plus2||!c.choices.background.plus1||c.choices.background.plus2===c.choices.background.plus1))p.push('Defina os aumentos +2/+1 do antecedente.');
    if(d.background?.toolChoice&&!c.choices.background.toolChoice.trim())p.push(`Defina: ${d.background.toolChoice}.`);
    if(d.klass){const need=(d.klass.proficiencyChoices||[]).reduce((n,g)=>n+g.choose,0);if(c.choices.class.proficiencies.length<need)p.push(`Escolha ${need} perícia(s) da classe.`)}
    for(const [kind,label] of [['species','raça'],['background','antecedente'],['class','classe']])if(c.refs[kind]&&!byId(kind==='background'?'backgrounds':kind,c.refs[kind]))p.push(`A referência salva de ${label} não existe mais no catálogo atual; nenhuma regra foi migrada automaticamente.`);
    return p;
  }

  function renderSheet(){
    const d=derived(),c=state.character;
    $('sheet-name').textContent=c.name.trim()||'Personagem sem nome';
    $('sheet-subtitle').textContent=[d.klass?`${d.klass.name} ${d.level}`:null,d.species?.name,d.background?.name].filter(Boolean).join(' · ')||'Escolha classe, raça e antecedente';
    $('sheet-pb').textContent=signed(d.pb);
    $('sheet-speed').textContent=d.species?`${d.species.speed} ft`:'—';
    $('sheet-size').textContent=d.size;
    $('sheet-init').textContent=signed(d.initiative);
    $('sheet-passive').textContent=String(d.passive);
    $('sheet-hp').textContent=d.levelOneHp==null?'—':d.level===1?String(d.levelOneHp):`${d.levelOneHp} no 1º nível`;
    $('sheet-hitdie').textContent=d.klass?.hitDie?`d${d.klass.hitDie}`:'—';
    $('ability-cards').innerHTML=ABILITIES.map(a=>{const total=d.scores[a],bonus=d.bb[a]+d.sb[a];return`<div class="ability"><strong>${esc(a)}</strong><span class="score">${total}</span><span>${signed(abilityMod(total))}</span><small>base ${number(c.baseAbilities[a])}${bonus?` · bônus ${signed(bonus)}`:''}</small></div>`}).join('');
    $('sheet-saves').innerHTML=d.klass?.savingThrows?.length?d.klass.savingThrows.map(x=>`<span class="pill">${esc(x)}</span>`).join(''):'<span class="muted">—</span>';
    $('sheet-skills').innerHTML=d.skills.length?d.skills.map(x=>`<span class="pill">${esc(x)}</span>`).join(''):'<span class="muted">—</span>';
    $('sheet-tools').innerHTML=d.tools.length?d.tools.map(x=>`<span class="pill">${esc(x)}</span>`).join(''):'<span class="muted">—</span>';
    $('sheet-feat').innerHTML=d.background?.feat?`<strong>${esc(d.background.feat.name)}</strong>${d.background.feat.choice?` <span class="muted">(${esc(d.background.feat.choice)})</span>`:''}`:'<span class="muted">—</span>';
    $('sheet-equipment').textContent=equipmentText(d.background,c)||'—';
    $('species-features').innerHTML=d.speciesTraits.length?d.speciesTraits.map(t=>`<details class="feature"><summary>${esc(t.name)}</summary><p>${esc(t.text)}</p></details>`).join(''):'<p class="muted">Nenhum traço aplicado.</p>';
    $('class-features').innerHTML=d.classFeatures.length?d.classFeatures.map(f=>`<details class="feature"><summary>${esc(f.name)} <span class="muted">— nível ${esc(f.level)}</span></summary><p>${esc(f.text)}</p></details>`).join(''):'<p class="muted">Nenhuma característica aplicada.</p>';
    const refs=[d.klass?`Classe: ${d.klass.id} · ${d.klass.source}`:null,d.species?`Raça: ${d.species.id} · ${d.species.source}`:null,d.background?`Antecedente: ${d.background.id} · ${d.background.source}`:null].filter(Boolean);
    $('provenance').innerHTML=refs.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Nenhuma referência selecionada.</li>';
    const pend=pending(d);$('pending').innerHTML=pend.length?`<strong>Escolhas pendentes</strong><ul>${pend.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<strong>Ficha consistente.</strong> Todas as escolhas exigidas por esta etapa foram preenchidas.';
    $('pending').className=`status ${pend.length?'warning':'ok'}`;
  }

  function renderWarnings(){
    const box=$('load-warnings');
    if(!state.loadWarnings.length){box.hidden=true;return}
    box.hidden=false;box.innerHTML=`Algumas fontes não puderam ser carregadas; o construtor continua com o restante do catálogo.<ul>${state.loadWarnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  }

  function renderAll(){renderSpeciesChoices();renderBackgroundChoices();renderClassChoices();renderSheet()}

  function save(){
    const c=state.character,d=derived();
    c.name=$('nome').value.trim();c.updatedAt=new Date().toISOString();
    c.refSnapshots={
      species:d.species?{id:d.species.id,name:d.species.name,ruleset:d.species.ruleset,revision:d.species.revision,source:d.species.source}:c.refSnapshots.species||null,
      background:d.background?{id:d.background.id,name:d.background.name,ruleset:d.background.ruleset,revision:d.background.revision,source:d.background.source}:c.refSnapshots.background||null,
      class:d.klass?{id:d.klass.id,name:d.klass.name,ruleset:d.klass.ruleset,revision:d.klass.revision,source:d.klass.source}:c.refSnapshots.class||null
    };
    const list=readCharacters(),idx=list.findIndex(x=>x.id===c.id);if(idx>=0)list[idx]=c;else list.push(c);writeCharacters(list);
    history.replaceState(null,'',`criacao-personagem.html?id=${encodeURIComponent(c.id)}`);
    $('save-status').textContent=`Salvo às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}. A ficha continuará vinculada aos IDs dos módulos.`;
  }

  function bind(){
    $('nome').addEventListener('input',e=>{state.character.name=e.target.value;renderSheet()});
    $('classe').addEventListener('change',e=>{state.character.refs.class=e.target.value||null;state.character.choices.class.proficiencies=[];renderAll()});
    $('nivel').addEventListener('change',e=>{state.character.choices.class.level=Math.max(1,Math.min(20,number(e.target.value)||1));e.target.value=state.character.choices.class.level;renderSheet()});
    $('especie').addEventListener('change',e=>{state.character.refs.species=e.target.value||null;state.character.choices.species={size:null,lineage:null};renderAll()});
    $('antecedente').addEventListener('change',e=>{state.character.refs.background=e.target.value||null;state.character.choices.background={abilityMode:'2+1',plus2:null,plus1:null,equipment:'A',toolChoice:''};renderAll()});
    for(const a of ABILITIES)$(`base-${slug(a)}`).addEventListener('change',e=>{state.character.baseAbilities[a]=Math.max(1,Math.min(20,number(e.target.value)||10));e.target.value=state.character.baseAbilities[a];renderSheet()});
    $('save').addEventListener('click',save);
    $('new-character').addEventListener('click',()=>{state.character=blankCharacter();history.replaceState(null,'','criacao-personagem.html');renderSelects();renderAll();$('save-status').textContent='Novo personagem iniciado.'});
  }

  async function init(){
    state.character=loadCharacter();
    $('loading').hidden=false;$('builder').hidden=true;
    const results=await Promise.allSettled([loadClasses(),loadSpecies(),loadBackgrounds()]);
    state.catalogs.classes=results[0].status==='fulfilled'?results[0].value:[];
    state.catalogs.species=results[1].status==='fulfilled'?results[1].value:[];
    state.catalogs.backgrounds=results[2].status==='fulfilled'?results[2].value:[];
    results.forEach((r,i)=>{if(r.status==='rejected')state.loadWarnings.push(`${['Classes','Raças','Antecedentes'][i]}: ${r.reason?.message||r.reason}`)});
    renderSelects();bind();renderAll();renderWarnings();
    $('catalog-counts').textContent=`${state.catalogs.classes.length} classes · ${state.catalogs.species.length} raças/variantes · ${state.catalogs.backgrounds.length} antecedentes`;
    $('loading').hidden=true;$('builder').hidden=false;
  }

  init().catch(e=>{$('loading').innerHTML=`<div class="status warning"><strong>Falha ao iniciar o construtor.</strong><br>${esc(e.message)}</div>`;console.error('[character-builder]',e)});
})();
