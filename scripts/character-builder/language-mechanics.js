import{state,arr,num,fold,uniq}from'./state.js';
import{selected,item}from'./rules.js';

export const STANDARD_LANGUAGES=['Língua de Sinais Comum','Dracônico','Anão','Élfico','Gigante','Gnômico','Goblin','Halfling','Orc'];
export const RARE_LANGUAGES=['Abissal','Celestial','Fala Profunda','Druídico','Infernal','Primordial','Silvestre','Cant dos Ladrões','Subcomum'];
const ALL_LANGUAGES=[...STANDARD_LANGUAGES,...RARE_LANGUAGES];
const NUMBER_WORDS={one:1,two:2,three:3,um:1,uma:1,dois:2,duas:2,tres:3,três:3};
const CANON={common:'Comum',comum:'Comum','common sign language':'Língua de Sinais Comum','lingua de sinais comum':'Língua de Sinais Comum',draconic:'Dracônico',draconico:'Dracônico',dwarvish:'Anão',anao:'Anão',elvish:'Élfico',elfico:'Élfico',giant:'Gigante',gigante:'Gigante',gnomish:'Gnômico',gnomico:'Gnômico',goblin:'Goblin',halfling:'Halfling',orc:'Orc',abyssal:'Abissal',abissal:'Abissal',celestial:'Celestial','deep speech':'Fala Profunda','fala profunda':'Fala Profunda',druidic:'Druídico',druidico:'Druídico',infernal:'Infernal',primordial:'Primordial',sylvan:'Silvestre',silvestre:'Silvestre',"thieves' cant":'Cant dos Ladrões','thieves’ cant':'Cant dos Ladrões','cant dos ladroes':'Cant dos Ladrões',undercommon:'Subcomum',subcomum:'Subcomum'};
const STRUCTURED_CLASS_LANGUAGE_FEATURES={druid:new Set(['druidic','druidico']),rogue:new Set(["thieves' cant",'thieves’ cant','cant dos ladroes']),ranger:new Set(['deft explorer','explorador habil'])};
function canonical(v){const raw=String(v||'').trim();return CANON[fold(raw)]||raw}
function countWord(v){const f=fold(v);return NUMBER_WORDS[f]||num(v)}
function keyPart(v){return fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'fonte'}
function ensureState(){state.c.choices=state.c.choices||{};state.c.choices.languages=state.c.choices.languages||{};state.c.choices.languages.choices=state.c.choices.languages.choices||{};return state.c.choices.languages}
function featObject(id){return item('feats',id)||null}
function featStages(){
 const progression=[];for(const id of Object.values(state.c.choices?.feats||{})){if(typeof id!=='string')continue;const feat=featObject(id);if(feat)progression.push(feat)}
 const speciesIds=new Set;const walk=v=>{if(typeof v==='string'&&featObject(v))speciesIds.add(v);else if(Array.isArray(v)){for(const x of v)walk(x)}else if(v&&typeof v==='object'){for(const x of Object.values(v))walk(x)}};walk(state.c.choices?.species?.traitChoices);
 const species=[...speciesIds].map(featObject).filter(Boolean),origin=[],{bg}=selected();
 if(bg?.feat?.name){const feat=state.catalogs.feats.find(x=>fold(x.name)===fold(bg.feat.name));if(feat)origin.push(feat)}
 return{origin,species,progression}
}
function selectedFeatObjects(){const stages=featStages();return uniq([...stages.origin,...stages.species,...stages.progression])}
function grantsFromText(sourceKey,label,text){const f=fold(text),fixed=[],grants=[];if(/\byou know druidic\b/.test(f)||/\bconhece druidico\b/.test(f))fixed.push('Druídico');if(/thieves['’]? cant/.test(f)||/cant dos ladroes/.test(f))fixed.push('Cant dos Ladrões');if(/serpentine speech/.test(f)||/linguagem de sinais serpentina/.test(f))fixed.push('Linguagem de Sinais Serpentina');if(fixed.length)grants.push({key:`${sourceKey}:fixed`,label,fixed:uniq(fixed),choose:0,pool:[]});const patterns=[/(?:you know |and )(one|two|three|\d+) other languages? of your choice/,/you know (one|two|three|\d+) languages? of your choice/,/(?:conhece |e )(um|uma|dois|duas|tres|três|\d+) outros? idiomas? (?:de|a) sua escolha/,/conhece (um|uma|dois|duas|tres|três|\d+) idiomas? (?:de|a) sua escolha/,/(?:ganha|recebe) (um|uma|dois|duas|tres|três|\d+) idiomas? (?:de|a) sua escolha/];for(const re of patterns){const m=f.match(re);if(m){grants.push({key:`${sourceKey}:choice`,label,fixed:[],choose:countWord(m[1]),pool:ALL_LANGUAGES});break}}return grants}
function classLanguageDefinitions(klass,level){if(!klass)return[];const defs=[];if(klass.slug==='druid'&&level>=1)defs.push({key:'class:druid:druidic',label:`${klass.name} — Druídico`,fixed:['Druídico'],choose:0,pool:[]});if(klass.slug==='rogue'&&level>=1)defs.push({key:'class:rogue:thieves-cant',label:`${klass.name} — Cant dos Ladrões`,fixed:['Cant dos Ladrões'],choose:1,pool:ALL_LANGUAGES});if(klass.slug==='ranger'&&level>=2)defs.push({key:'class:ranger:deft-explorer',label:`${klass.name} — Explorador Hábil`,fixed:[],choose:2,pool:ALL_LANGUAGES});return defs}
function subclassLanguageDefinitions(sub){
 const name=fold(sub?.mechanics?.name||sub?.name||''),defs=[],choices=state.c.choices?.subclassMechanics||{};
 if(name===fold('Path of the Demonshard')){const value=choices['path-of-the-demonshard']?.demontongue;if(['Abissal','Infernal'].includes(value))defs.push({key:'subclass:demonshard:demontongue',label:`${sub.name} — Demontongue`,fixed:[value],choose:0,pool:[]})}
 if(name===fold('College of the Moon')||name===fold('Colégio da Lua'))defs.push({key:'subclass:college-of-the-moon:druidic',label:`${sub.name} — Primal Lore`,fixed:['Druídico'],choose:0,pool:[]});
 if(name===fold('Circle of the Shepherd')||name===fold('Círculo do Pastor'))defs.push({key:'subclass:shepherd:speech-of-the-woods',label:`${sub.name} — Speech of the Woods`,fixed:['Silvestre'],choose:0,pool:[]});
 if(name===fold('Rune Knight'))defs.push({key:'subclass:rune-knight:giant',label:`${sub.name} — Bonus Proficiencies`,fixed:['Gigante'],choose:0,pool:[]});
 if(name===fold('Banneret')){const value=String(choices.banneret?.currentLanguage||'').trim();if(value)defs.push({key:'subclass:banneret:knightly-envoy-language',label:`${sub.name} — Knightly Envoy`,fixed:[value],choose:0,pool:[]})}
 if(name===fold('Cavalier')){const row=choices.cavalier||{},value=String(row.bonusLanguage||'').trim();if(row.bonusMode==='Idioma'&&value)defs.push({key:'subclass:cavalier:bonus-language',label:`${sub.name} — Bonus Proficiency`,fixed:[value],choose:0,pool:[]})}
 if(name===fold('Samurai')){const row=choices.samurai||{},value=String(row.bonusLanguage||'').trim();if(row.bonusMode==='Idioma'&&value)defs.push({key:'subclass:samurai:bonus-language',label:`${sub.name} — Bonus Proficiency`,fixed:[value],choose:0,pool:[]})}
 if(name===fold('Mastermind')){const row=choices.mastermind||{},fixed=[row.language1,row.language2].map(canonical).filter(Boolean);if(fixed.length)defs.push({key:'subclass:mastermind:master-of-intrigue',label:`${sub.name} — Master of Intrigue`,fixed:uniq(fixed),choose:0,pool:[]})}
 if(name===fold('Storm Sorcery'))defs.push({key:'subclass:storm-sorcery:wind-speaker',label:`${sub.name} — Wind Speaker`,fixed:['Primordial'],choose:0,pool:[]});
 return defs
}
function featLanguageDefinitions(feats){const defs=[];for(const feat of feats){const name=fold(feat?.name);if(name===fold('Fey Teleportation'))defs.push({key:`feat:${feat.id}:fey-teleportation-sylvan`,label:`Fey Teleportation — Silvestre`,fixed:['Silvestre'],choose:0,pool:[]});if(name===fold('Prodigy'))defs.push({key:`feat:${feat.id}:prodigy-language`,label:`Prodigy — idioma`,fixed:[],choose:1,pool:ALL_LANGUAGES})}return defs}
function structuredClassFeature(klass,feature){const names=STRUCTURED_CLASS_LANGUAGE_FEATURES[klass?.slug];return !!names&&names.has(fold(feature?.name))}
function backgroundLanguageDefinitions(bg){if(!bg)return[];const fixed=[],defs=[];for(const raw of arr(bg.languages)){const value=canonical(raw);if(!value)continue;const m=fold(value).match(/^(um|uma|dois|duas|tres|três|\d+).*escolh/);if(m)defs.push({key:`background:${bg.id}:languages-choice`,label:`${bg.name} — idiomas`,fixed:[],choose:countWord(m[1]),pool:ALL_LANGUAGES});else fixed.push(value)}if(fixed.length)defs.push({key:`background:${bg.id}:languages-fixed`,label:`${bg.name} — idiomas`,fixed:uniq(fixed),choose:0,pool:[]});return defs}
function appendTextSources(defs,sources){for(const[sourceKey,label,text]of sources)defs.push(...grantsFromText(sourceKey,label,text))}
export function languageGrantDefinitions(){
 ensureState();const{klass,species,bg,sub}=selected(),level=Math.max(1,Math.min(20,num(state.c.choices?.class?.level)||1)),defs=[];
 defs.push(...classLanguageDefinitions(klass,level),...subclassLanguageDefinitions(sub));
 const classSources=[];for(const f of arr(klass?.features).filter(x=>num(x.level)<=level&&!structuredClassFeature(klass,x)))classSources.push([`class:${klass.slug}:${keyPart(f.name)}`,`${klass.name} — ${f.name}`,f.text||f.description||'']);if(sub?.description)classSources.push([`subclass:${sub.id||sub.name}`,sub.name,sub.description]);appendTextSources(defs,classSources);
 defs.push({key:'core:languages',label:'Criação de Personagem',fixed:['Comum'],choose:2,pool:STANDARD_LANGUAGES},...backgroundLanguageDefinitions(bg));
 const originSources=[];if(bg?.feature)originSources.push([`background:${bg.id}:feature`,`${bg.name} — característica`,bg.feature.text||bg.feature.description||'']);const stages=featStages();for(const feat of stages.origin)originSources.push([`feat:origin:${feat.id}`,`Talento de Origem — ${feat.name}`,feat.description||'']);appendTextSources(defs,originSources);
 const lineage=species?.lineages?.find(x=>x.name===state.c.choices?.species?.lineage)||null,speciesTraits=lineage?.replaceBaseTraits?arr(lineage.traits):[...arr(species?.traits),...arr(lineage?.traits)],raceSources=[];for(const t of speciesTraits)raceSources.push([`species:${species?.id||species?.name}:${keyPart(t.name)}`,`${species?.name||'Raça'} — ${t.name}`,t.text||t.description||'']);for(const feat of stages.species)raceSources.push([`feat:species:${feat.id}`,`Talento racial — ${feat.name}`,feat.description||'']);appendTextSources(defs,raceSources);
 const progressionSources=[];for(const feat of stages.progression)progressionSources.push([`feat:progression:${feat.id}`,`Talento de Progressão — ${feat.name}`,feat.description||'']);appendTextSources(defs,progressionSources);
 defs.push(...featLanguageDefinitions(selectedFeatObjects()));
 const seen=new Set;return defs.filter(d=>d.choose||d.fixed.length).filter(d=>!seen.has(d.key)&&(seen.add(d.key),true))
}
export function sanitizeLanguageChoices(){
 const data=ensureState(),defs=languageGrantDefinitions(),clean={},used=new Set;
 for(const def of defs){for(const fixed of arr(def.fixed))used.add(fold(canonical(fixed)));for(let i=0;i<def.choose;i++){const key=`${def.key}:${i}`,v=canonical(data.choices[key]);if(!v||!def.pool.some(x=>fold(x)===fold(v))||used.has(fold(v)))continue;clean[key]=v;used.add(fold(v))}}
 data.choices=clean;return clean
}
function manualLanguages(){const text=state.c.sheet?.profile?.languages||'';return String(text).split(/[;,\n]+/).map(x=>canonical(x.trim())).filter(Boolean)}
export function languageOutcome(){const defs=languageGrantDefinitions(),choices=sanitizeLanguageChoices(),automatic=[],sources=[],pending=[];const used=new Set;const add=v=>{const c=canonical(v),k=fold(c);if(c&&!used.has(k)){used.add(k);automatic.push(c)}};for(const def of defs){def.fixed.forEach(add);const chosen=[];for(let i=0;i<def.choose;i++){const v=choices[`${def.key}:${i}`];if(v){add(v);chosen.push(v)}}if(def.fixed.length||chosen.length)sources.push({label:def.label,languages:[...def.fixed,...chosen].map(canonical)});const missing=Math.max(0,def.choose-chosen.length);if(missing)pending.push({key:def.key,label:def.label,count:missing})}const manual=[];for(const v of manualLanguages()){const k=fold(v);if(!used.has(k)){used.add(k);manual.push(v)}}return{definitions:defs,choices,automatic,manual,all:[...automatic,...manual],sources,pending}}
