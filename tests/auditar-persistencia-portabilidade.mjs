import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import{STORAGE_REGISTRY,PORTABLE_STORAGE,ENCOUNTER_TARGET_KEY,RECOVERY_BACKUP_KEY}from'../scripts/storage-registry.js';
import{BACKUP_SCHEMA,createBackupPackage,serializeBackup,validateBackupPackage,restoreBackup,restoreRecoverySnapshot,readPortableData,mergePortableData,migrateCharacter,checksum,canonicalStringify}from'../scripts/backup-engine.js';

class MemoryStorage{constructor(seed={}){this.map=new Map(Object.entries(seed).map(([k,v])=>[k,String(v)]))}getItem(k){return this.map.has(k)?this.map.get(k):null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}key(i){return[...this.map.keys()][i]??null}get length(){return this.map.size}}
class FailOnceStorage extends MemoryStorage{constructor(seed,failKey){super(seed);this.failKey=failKey;this.failed=false}setItem(k,v){if(k===this.failKey&&!this.failed){this.failed=true;throw new Error('quota simulada')}super.setItem(k,v)}}
const CKEY='hub-rpg:characters:v4',CLEG='hub-rpg:characters:v3',MKEY='hub-rpg:campaigns:v1',AKEY='hub-rpg:adventures:v1';
const character={schema:'hub-rpg/personagem/v4',id:'pc-1',name:'Ayla',ruleset:'5.5e',refs:{},refSnapshots:{},baseAbilities:{Força:10,Destreza:14,Constituição:12,Inteligência:10,Sabedoria:10,Carisma:10},choices:{class:{level:3,skills:[],equipment:'A'},species:{},background:{plusOnes:[]},feats:{},equipment:{},spells:{cantrips:[],leveled:[],arcanum:{}}},sheet:{runtime:{currentHp:18}},updatedAt:'2026-09-01T12:00:00.000Z'};
const campaign={schema:'hub-rpg/campaign/v1',id:'cmp-1',name:'Mesa',members:[{id:'m1',name:'Jogador',role:'player',characterId:'pc-1'}],sessions:[],createdAt:'2026-09-01T12:00:00.000Z',updatedAt:'2026-09-01T12:00:00.000Z'};
const adventure={schema:'hub-rpg/adventure/v1',id:'adv-1',campaignId:'cmp-1',title:'Aventura',chapters:[],scenes:[],locations:[],npcs:[],clues:[],handouts:[],treasures:[],createdAt:'2026-09-01T12:00:00.000Z',updatedAt:'2026-09-01T12:00:00.000Z'};
function seed(){return new MemoryStorage({[CKEY]:JSON.stringify([character]),[MKEY]:JSON.stringify([campaign]),[AKEY]:JSON.stringify([adventure]),[ENCOUNTER_TARGET_KEY]:JSON.stringify({target:{name:'Ogro'}})})}

assert.deepEqual(PORTABLE_STORAGE.map(x=>x.id),['characters','campaigns','adventures']);
assert.equal(STORAGE_REGISTRY.find(x=>x.key===ENCOUNTER_TARGET_KEY).portable,false);
assert.equal(STORAGE_REGISTRY.find(x=>x.key===RECOVERY_BACKUP_KEY).scope,'recovery');

const storage=seed(),pkg=createBackupPackage(storage);
assert.equal(pkg.schema,BACKUP_SCHEMA);assert.equal(pkg.version,1);
assert.equal(pkg.manifest.characters.count,1);assert.equal(pkg.manifest.campaigns.count,1);assert.equal(pkg.manifest.adventures.count,1);
assert.equal(JSON.stringify(pkg).includes('Ogro'),false,'Alvo transitório não pode viajar no backup.');
assert.ok(pkg.integrity.checksum.startsWith('fnv1a32:'));assert.equal(validateBackupPackage(serializeBackup(pkg)).ok,true);

const tampered=JSON.parse(JSON.stringify(pkg));tampered.data.characters[0].name='Alterado fora do Hub';
assert.throws(()=>validateBackupPackage(tampered),/Checksum inválido/);assert.equal(readPortableData(storage).characters[0].name,'Ayla');

const legacy=migrateCharacter({schema:'hub-rpg/personagem/v2',id:'old',name:'Legado',choices:{class:{level:99},background:{plusOnes:'x'},spells:{cantrips:null}}});
assert.equal(legacy.schema,'hub-rpg/personagem/v4');assert.equal(legacy.choices.class.level,20);assert.deepEqual(legacy.choices.background.plusOnes,[]);assert.deepEqual(legacy.choices.spells.cantrips,[]);
const legacyStorage=new MemoryStorage({[CLEG]:JSON.stringify([{schema:'hub-rpg/personagem/v3',id:'old-2',name:'Antigo',choices:{class:{level:2}}}]),[MKEY]:'[]',[AKEY]:'[]'});
assert.equal(readPortableData(legacyStorage).characters[0].schema,'hub-rpg/personagem/v4');

const destination=new MemoryStorage({[CKEY]:'[]',[MKEY]:'[]',[AKEY]:'[]'});let restored=restoreBackup(pkg,{storage:destination,mode:'replace'});
assert.equal(restored.ok,true);assert.equal(readPortableData(destination).characters[0].sheet.runtime.currentHp,18);assert.ok(destination.getItem(RECOVERY_BACKUP_KEY));

const newer={...character,name:'Ayla atual',updatedAt:'2026-09-02T12:00:00.000Z'},older={...character,name:'Ayla antiga',updatedAt:'2026-08-01T12:00:00.000Z'};
const merged=mergePortableData({characters:[newer],campaigns:[campaign],adventures:[adventure]},{characters:[older,{...character,id:'pc-2',name:'Novo'}],campaigns:[],adventures:[]});
assert.equal(merged.characters.find(x=>x.id==='pc-1').name,'Ayla atual');assert.ok(merged.characters.some(x=>x.id==='pc-2'));

const broken=JSON.parse(JSON.stringify(pkg));broken.data.adventures[0].campaignId='ausente';
const base={schema:broken.schema,version:broken.version,createdAt:broken.createdAt,app:broken.app,metadata:broken.metadata,manifest:broken.manifest,data:broken.data};broken.integrity.checksum=checksum(base);
assert.throws(()=>validateBackupPackage(broken),/Campanha vinculada ausente/);

const originalSeed={[CKEY]:JSON.stringify([{...character,name:'Antes'}]),[MKEY]:JSON.stringify([campaign]),[AKEY]:JSON.stringify([adventure])},failing=new FailOnceStorage(originalSeed,MKEY);
assert.throws(()=>restoreBackup(pkg,{storage:failing,mode:'replace'}),/Restauração revertida/);assert.equal(failing.getItem(CKEY),originalSeed[CKEY]);assert.equal(failing.getItem(MKEY),originalSeed[MKEY]);assert.equal(failing.getItem(AKEY),originalSeed[AKEY]);

const undoStore=new MemoryStorage(originalSeed),incomingPkg=createBackupPackage(new MemoryStorage({[CKEY]:JSON.stringify([{...character,name:'Depois'}]),[MKEY]:JSON.stringify([campaign]),[AKEY]:JSON.stringify([adventure])}));
restoreBackup(incomingPkg,{storage:undoStore,mode:'replace'});assert.equal(readPortableData(undoStore).characters[0].name,'Depois');restoreRecoverySnapshot(undoStore);assert.equal(readPortableData(undoStore).characters[0].name,'Antes');

assert.equal(canonicalStringify({b:2,a:1}),canonicalStringify({a:1,b:2}));assert.equal(checksum({b:2,a:1}),checksum({a:1,b:2}));

const scriptsRoot=new URL('../scripts/',import.meta.url),classified=new Set(STORAGE_REGISTRY.flatMap(x=>[x.key,...x.legacyKeys])),literals=new Set;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.js')){const source=fs.readFileSync(full,'utf8');for(const match of source.matchAll(/['"`](hub-rpg:[a-z0-9:_-]+)['"`]/gi))literals.add(match[1])}}}
walk(scriptsRoot.pathname);const missing=[...literals].filter(key=>!classified.has(key)).sort();assert.deepEqual(missing,[],`Chaves localStorage sem classificação: ${missing.join(', ')}`);

console.log('OK — Bloco 14: backup versionado, checksum, migração, mesclagem, restauração atômica, rollback e registro fail-closed de armazenamento.');
