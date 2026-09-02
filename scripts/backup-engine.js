import{PORTABLE_STORAGE,RECOVERY_BACKUP_KEY}from'./storage-registry.js?v=20260902-backup1';
import{sanitizeCampaign}from'./campaign-state.js?v=20260902-encounters1';
import{sanitizeAdventure}from'./adventure-state.js?v=20260902-adventures1';

export const BACKUP_SCHEMA='hub-rpg/backup/v1';
export const BACKUP_VERSION=1;
export const BACKUP_APP='Teias de Anansi · Hub de RPG';
const CHARACTER_SCHEMA='hub-rpg/personagem/v4';
const ABILITIES=['Força','Destreza','Constituição','Inteligência','Sabedoria','Carisma'];
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const now=()=>new Date().toISOString();
const uid=prefix=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

export function canonicalStringify(value){
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return`[${value.map(canonicalStringify).join(',')}]`;
 return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`
}
export function checksum(value){let hash=0x811c9dc5;const source=typeof value==='string'?value:canonicalStringify(value);for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0}return`fnv1a32:${hash.toString(16).padStart(8,'0')}`}

function parseArray(raw){if(raw==null||raw==='')return[];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('O armazenamento esperado não contém uma lista.');return parsed}
function readCharacters(storage){for(const row of PORTABLE_STORAGE.filter(x=>x.id==='characters')){const current=parseArray(storage.getItem(row.key));if(current.length)return current;for(const key of row.legacyKeys){const legacy=parseArray(storage.getItem(key));if(legacy.length)return legacy}}return[]}
export function migrateCharacter(row={}){
 const c=clone(obj(row));c.schema=CHARACTER_SCHEMA;c.id=text(c.id)||uid('pc');c.name=String(c.name??'');c.ruleset='5.5e';c.refs={class:null,species:null,background:null,subclass:null,...obj(c.refs)};c.refSnapshots=obj(c.refSnapshots);c.baseAbilities={...Object.fromEntries(ABILITIES.map(a=>[a,10])),...obj(c.baseAbilities)};c.choices=obj(c.choices);const klass=obj(c.choices.class),species=obj(c.choices.species),background=obj(c.choices.background),equipment=obj(c.choices.equipment),spells=obj(c.choices.spells);c.choices.class={...klass,level:Math.max(1,Math.min(20,Number(klass.level)||1)),skills:arr(klass.skills),equipment:String(klass.equipment||'A').toUpperCase()};c.choices.species={size:null,lineage:null,...species};c.choices.background={abilityMode:'2+1',plus2:null,plus1:null,plusOnes:[],equipment:'A',toolChoice:'',...background,plusOnes:arr(background.plusOnes)};c.choices.feats=obj(c.choices.feats);c.choices.equipment={armor:null,shield:false,weapon:null,...equipment};c.choices.spells={...spells,cantrips:arr(spells.cantrips),leveled:arr(spells.leveled),arcanum:obj(spells.arcanum),progression:spells.progression?clone(spells.progression):null};c.updatedAt=text(c.updatedAt)||now();return c
}
export function normalizePortableData(input={}){const source=obj(input);return{characters:arr(source.characters).map(migrateCharacter),campaigns:arr(source.campaigns).map(sanitizeCampaign),adventures:arr(source.adventures).map(sanitizeAdventure)}}
export function readPortableData(storage=globalThis.localStorage){if(!storage)throw new Error('Armazenamento local indisponível.');const data={characters:readCharacters(storage),campaigns:[],adventures:[]};for(const row of PORTABLE_STORAGE){if(row.id==='characters')continue;const values=parseArray(storage.getItem(row.key));if(row.id==='campaigns')data.campaigns=values;if(row.id==='adventures')data.adventures=values}return normalizePortableData(data)}
function manifestFor(data){return{characters:{schema:CHARACTER_SCHEMA,count:data.characters.length},campaigns:{schema:'hub-rpg/campaign/v1',count:data.campaigns.length},adventures:{schema:'hub-rpg/adventure/v1',count:data.adventures.length}}}
function unsignedPackage({createdAt=now(),data,metadata={}}={}){const normalized=normalizePortableData(data||{});return{schema:BACKUP_SCHEMA,version:BACKUP_VERSION,createdAt,app:BACKUP_APP,metadata:{...obj(metadata)},manifest:manifestFor(normalized),data:normalized}}
export function createBackupPackage(storage=globalThis.localStorage,{metadata={}}={}){const base=unsignedPackage({data:readPortableData(storage),metadata});return{...base,integrity:{algorithm:'fnv1a32',checksum:checksum(base)}}}
export function serializeBackup(pkg){return`${JSON.stringify(pkg,null,2)}\n`}
export function backupFilename(date=new Date()){const stamp=date.toISOString().replace(/[:.]/g,'-');return`teias-de-anansi-backup-${stamp}.json`}

function validateIds(rows,label){const seen=new Set;for(const row of rows){if(!text(row?.id))throw new Error(`${label}: registro sem ID.`);if(seen.has(row.id))throw new Error(`${label}: ID duplicado (${row.id}).`);seen.add(row.id)}}
function validateRelations(data){const characterIds=new Set(data.characters.map(x=>x.id)),campaignIds=new Set(data.campaigns.map(x=>x.id));for(const campaign of data.campaigns)for(const member of arr(campaign.members))if(member.characterId&&!characterIds.has(member.characterId))throw new Error(`Campanha ${campaign.name}: personagem vinculado ausente no backup (${member.characterId}).`);for(const adventure of data.adventures)if(!campaignIds.has(adventure.campaignId))throw new Error(`Aventura ${adventure.title}: Campanha vinculada ausente no backup (${adventure.campaignId}).`)}
export function validateBackupPackage(input,{allowUnsigned=false}={}){const pkg=typeof input==='string'?JSON.parse(input):clone(input);if(!pkg||pkg.schema!==BACKUP_SCHEMA)throw new Error('Arquivo não é um backup compatível do Hub.');if(Number(pkg.version)!==BACKUP_VERSION)throw new Error(`Versão de backup não suportada: ${pkg.version}.`);if(!pkg.data||typeof pkg.data!=='object')throw new Error('Backup sem bloco de dados.');const expected=pkg.integrity?.checksum,base=unsignedPackage({createdAt:pkg.createdAt,data:pkg.data,metadata:pkg.metadata});if(!expected&&!allowUnsigned)throw new Error('Backup sem checksum de integridade.');if(expected&&expected!==checksum(base))throw new Error('Checksum inválido: o arquivo pode estar corrompido ou ter sido alterado.');const data=normalizePortableData(pkg.data);validateIds(data.characters,'Personagens');validateIds(data.campaigns,'Campanhas');validateIds(data.adventures,'Aventuras');validateRelations(data);const manifest=manifestFor(data);for(const key of Object.keys(manifest))if(pkg.manifest?.[key]?.count!=null&&Number(pkg.manifest[key].count)!==manifest[key].count)throw new Error(`Manifesto inconsistente para ${key}.`);return{ok:true,package:{...base,manifest,data,integrity:{algorithm:'fnv1a32',checksum:checksum(base)}},data,manifest}}

function updatedAt(row){const t=Date.parse(row?.updatedAt||row?.createdAt||'');return Number.isFinite(t)?t:0}
export function mergeById(current=[],incoming=[]){const map=new Map(arr(current).map(row=>[row.id,row]));for(const row of arr(incoming)){const old=map.get(row.id);if(!old||updatedAt(row)>=updatedAt(old))map.set(row.id,row)}return[...map.values()]}
export function mergePortableData(current,incoming){return normalizePortableData({characters:mergeById(current.characters,incoming.characters),campaigns:mergeById(current.campaigns,incoming.campaigns),adventures:mergeById(current.adventures,incoming.adventures)})}

function snapshotStorage(storage){const keys=new Set(PORTABLE_STORAGE.flatMap(row=>[row.key,...row.legacyKeys]));return Object.fromEntries([...keys].map(key=>[key,storage.getItem(key)]))}
function restoreSnapshot(storage,snapshot){for(const[key,value]of Object.entries(snapshot)){if(value==null)storage.removeItem(key);else storage.setItem(key,value)}}
function writePortableData(storage,data){const byId=Object.fromEntries(PORTABLE_STORAGE.map(row=>[row.id,row]));storage.setItem(byId.characters.key,JSON.stringify(data.characters));for(const legacy of byId.characters.legacyKeys)storage.removeItem(legacy);storage.setItem(byId.campaigns.key,JSON.stringify(data.campaigns));storage.setItem(byId.adventures.key,JSON.stringify(data.adventures))}
export function saveRecoverySnapshot(storage=globalThis.localStorage){const pkg=createBackupPackage(storage,{metadata:{purpose:'pre-restore-recovery'}});storage.setItem(RECOVERY_BACKUP_KEY,serializeBackup(pkg));return pkg}
export function readRecoverySnapshot(storage=globalThis.localStorage){const raw=storage?.getItem(RECOVERY_BACKUP_KEY);if(!raw)return null;try{return validateBackupPackage(raw).package}catch{return null}}
export function clearRecoverySnapshot(storage=globalThis.localStorage){storage?.removeItem(RECOVERY_BACKUP_KEY)}
export function restoreBackup(input,{storage=globalThis.localStorage,mode='replace',saveRecovery=true}={}){if(!storage)throw new Error('Armazenamento local indisponível.');if(!['replace','merge'].includes(mode))throw new Error('Modo de restauração inválido.');const validated=validateBackupPackage(input),before=snapshotStorage(storage),current=readPortableData(storage),target=mode==='merge'?mergePortableData(current,validated.data):validated.data;validateRelations(target);let recovery=null;try{if(saveRecovery)recovery=saveRecoverySnapshot(storage);writePortableData(storage,target);const verify=readPortableData(storage);if(canonicalStringify(verify)!==canonicalStringify(target))throw new Error('A verificação pós-gravação não corresponde ao estado restaurado.');return{ok:true,mode,data:verify,recovery,counts:{characters:verify.characters.length,campaigns:verify.campaigns.length,adventures:verify.adventures.length}}}catch(error){restoreSnapshot(storage,before);throw new Error(`Restauração revertida: ${error.message}`)}}
export function restoreRecoverySnapshot(storage=globalThis.localStorage){const pkg=readRecoverySnapshot(storage);if(!pkg)throw new Error('Nenhum snapshot de recuperação válido disponível.');return restoreBackup(pkg,{storage,mode:'replace',saveRecovery:false})}
