export const KEY='hub-rpg:characters:v4',LEGACY_KEYS=['hub-rpg:characters:v3','hub-rpg:characters:v2','hub-rpg:characters:v1'],V='20260831-tasha-metamagic1',PIN='bfd3db4bcc31699cce703b46feb9af3f0ff08999';
export const RAW24=`https://raw.githubusercontent.com/5e-bits/5e-database/${PIN}/src/2024/en`;
export const RAW14=`https://raw.githubusercontent.com/5e-bits/5e-database/${PIN}/src/2014/en`;
export const AB=['Força','Destreza','Constituição','Inteligência','Sabedoria','Carisma'];
export const ABKEY={STR:'Força',DEX:'Destreza',CON:'Constituição',INT:'Inteligência',WIS:'Sabedoria',CHA:'Carisma',Strength:'Força',Dexterity:'Destreza',Constitution:'Constituição',Intelligence:'Inteligência',Wisdom:'Sabedoria',Charisma:'Carisma'};
export const SKILL_AB={'Acrobacia':'Destreza','Adestrar Animais':'Sabedoria','Arcanismo':'Inteligência','Atletismo':'Força','Atuação':'Carisma','Enganação':'Carisma','Furtividade':'Destreza','História':'Inteligência','Intimidação':'Carisma','Intuição':'Sabedoria','Investigação':'Inteligência','Medicina':'Sabedoria','Natureza':'Inteligência','Percepção':'Sabedoria','Persuasão':'Carisma','Prestidigitação':'Destreza','Religião':'Inteligência','Sobrevivência':'Sabedoria'};
export const CLASS_SLUGS=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
export const LOCFILES={barbarian:'barbaro',bard:'bardo',cleric:'clerigo',druid:'druida',fighter:'guerreiro',monk:'monge',paladin:'paladino',ranger:'patrulheiro',rogue:'ladino',sorcerer:'feiticeiro',warlock:'bruxo',wizard:'mago'};
export const BGFILES=['dados/antecedentes-srd-5.2.1.json','dados/antecedentes-abertos-adicionais.json','dados/antecedentes-pdf-phb-2024.json','dados/antecedentes-pdf-forge-2025.json','dados/antecedentes-pdf-heroes-2025.json','dados/antecedentes-pdf-quickstone-2024.json'];
export const SPFILES=['dados/especies-pdf-phb-2024.json','dados/especies-pdf-forge-2025.json','dados/especies-pdf-quickstone-2024.json','dados/especies-pdf-motm-2022.json'];
export const FEATFILES=['dados/talentos-phb-2024.json','dados/talentos-forge-2025.json','dados/talentos-heroes-2025.json','dados/talentos-quickstone-2024.json','dados/talentos-tasha-2020.json','dados/talentos-xanathar-2017.json','dados/talentos-eberron-rising-2019.json'];
export const state={catalogs:{classes:[],species:[],backgrounds:[],subclasses:[],feats:[],armors:[],weapons:[],spells:[],invocations:[],invocationProgression:{},metamagic:[],metamagicProgression:{}},c:null,warnings:[],G:{},LOCSP:{}};
export const $=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[],num=v=>Number.isFinite(Number(v))?Number(v):0,uniq=a=>[...new Set(a.filter(Boolean))];
export const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export const slug=s=>fold(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const mod=s=>Math.floor((num(s)-10)/2),signed=n=>`${n>=0?'+':''}${n}`,pb=l=>2+Math.floor((Math.max(1,num(l))-1)/4);

export async function json(u){
 const url=`${u}${u.includes('?')?'&':'?'}v=${V}`,external=/^https?:\/\//i.test(u),timeoutMs=external?3500:6000,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const r=await fetch(url,{cache:'default',signal:controller.signal});
  if(!r.ok)throw new Error(`${u}: HTTP ${r.status}`);
  return await r.json()
 }catch(e){
  if(e?.name==='AbortError')throw new Error(`${u}: tempo limite de ${timeoutMs/1000}s excedido`);
  throw e
 }finally{clearTimeout(timer)}
}

export function uid(){return globalThis.crypto?.randomUUID?.()||`pc-${Date.now()}-${Math.random().toString(16).slice(2)}`}
export function blank(){return{schema:'hub-rpg/personagem/v4',id:uid(),name:'',ruleset:'5.5e',refs:{class:null,species:null,background:null,subclass:null},refSnapshots:{},baseAbilities:Object.fromEntries(AB.map(a=>[a,10])),choices:{class:{level:1,skills:[],equipment:'A'},species:{size:null,lineage:null},background:{abilityMode:'2+1',plus2:null,plus1:null,plusOnes:[],equipment:'A',toolChoice:''},feats:{},warlockInvocations:{slots:[]},sorcererMetamagic:{options:[]},equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[],arcanum:{},progression:null}},updatedAt:new Date().toISOString()}}
function readKey(key){try{const d=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(d)?d:[]}catch{return[]}}
export function read(){const current=readKey(KEY);if(current.length)return current;for(const key of LEGACY_KEYS){const old=readKey(key);if(old.length)return old}return[]}
export function write(list){localStorage.setItem(KEY,JSON.stringify(list))}
export function loadCharacter(){const id=new URLSearchParams(location.search).get('id'),saved=id?read().find(x=>x.id===id):null,c=saved?structuredClone(saved):blank(),wasLegacyRules=c.ruleset&&c.ruleset!=='5.5e',oldClass=c.choices?.class||{},oldSpells=c.choices?.spells||{},oldBg=c.choices?.background||{},oldInvocations=c.choices?.warlockInvocations||{},oldMetamagic=c.choices?.sorcererMetamagic||{};c.schema='hub-rpg/personagem/v4';c.ruleset='5.5e';c.refs={class:null,species:null,background:null,subclass:null,...(c.refs||{})};if(wasLegacyRules)c.refs={class:null,species:null,background:null,subclass:null};c.refSnapshots=c.refSnapshots||{};c.baseAbilities={...Object.fromEntries(AB.map(a=>[a,10])),...(c.baseAbilities||{})};c.choices=c.choices||{};c.choices.class={level:Math.max(1,Math.min(20,num(oldClass.level)||1)),skills:arr(oldClass.skills),equipment:String(oldClass.equipment||'A').toUpperCase()};c.choices.species={size:null,lineage:null,...(c.choices.species||{})};c.choices.background={abilityMode:'2+1',plus2:null,plus1:null,plusOnes:[],equipment:'A',toolChoice:'',...oldBg,plusOnes:arr(oldBg.plusOnes)};c.choices.feats=c.choices.feats||{};c.choices.warlockInvocations={slots:arr(oldInvocations.slots).map(x=>x&&typeof x==='object'?structuredClone(x):{})};c.choices.sorcererMetamagic={options:arr(oldMetamagic.options)};c.choices.equipment={armor:null,shield:false,weapon:null,...(c.choices.equipment||{})};c.choices.spells={cantrips:arr(oldSpells.cantrips),leveled:arr(oldSpells.leveled),arcanum:{...(oldSpells.arcanum||{})},progression:oldSpells.progression?structuredClone(oldSpells.progression):null};return c}
export function snapshot(x){return x?{id:x.id,name:x.name,ruleset:x.ruleset||'5.5e',revision:x.revision??x.revisao_core??2024,source:x.source||x.fonte||'',status:x.status||'',compatibleWith:arr(x.compatibleWith)}:null}
