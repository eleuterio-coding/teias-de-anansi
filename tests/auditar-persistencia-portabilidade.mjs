import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  STORAGE_REGISTRY,
  PORTABLE_STORAGE,
  TRANSIENT_STORAGE,
  RECOVERY_STORAGE,
  CLASSIFIED_STORAGE_KEYS,
  storageRecord
} from '../scripts/storage-registry.js';

// O roadmap v1.0.1 removeu exportacao, importacao e backup, mas nao
// a persistencia de personagens/campanhas/sessoes e a colaboracao.
assert.ok(Array.isArray(STORAGE_REGISTRY)&&STORAGE_REGISTRY.length>=8,'Registro de estados persistidos incompleto.');
assert.deepEqual(PORTABLE_STORAGE,[],'Backup e portabilidade foram retirados do escopo da v1.0.1.');
assert.deepEqual(RECOVERY_STORAGE,[],'Nao reintroduzir restauração transacional removida do produto.');
assert.deepEqual(TRANSIENT_STORAGE,STORAGE_REGISTRY.filter(row=>row.scope==='transient'));

const ids=new Set(),keys=new Set();
let durable=0,transient=0,cache=0;
for(const row of STORAGE_REGISTRY){
  assert.ok(typeof row.id==='string'&&row.id&&typeof row.key==='string'&&row.key,'Chave de armazenamento malformada.');
  assert.match(row.key,/^hub-rpg:[a-z0-9-]+:/,'Estados do Hub devem usar chaves versionadas.');
  assert.ok(['durable','cache','transient'].includes(row.scope),'Escopo de armazenamento desconhecido: '+row.id);
  assert.equal(row.portable,false,'Registro nao pode reativar backup/exportacao: '+row.id);
  assert.ok(!ids.has(row.id),'Identificador de armazenamento duplicado: '+row.id);
  ids.add(row.id);
  assert.strictEqual(storageRecord(row.id),row,'Consulta do registro deve manter a classificacao: '+row.id);
  if(row.scope==='durable'){durable++;assert.ok(row.schema,'Estado duravel sem schema: '+row.id)}
  if(row.scope==='transient')transient++;
  if(row.scope==='cache')cache++;
  assert.ok(Array.isArray(row.legacyKeys),'Chaves legadas devem estar declaradas: '+row.id);
  for(const key of [row.key,...row.legacyKeys]){
    assert.ok(!keys.has(key),'Chave ou alias duplicado: '+key);
    keys.add(key);
    assert.ok(CLASSIFIED_STORAGE_KEYS.has(key),'Chave utilizada fora da classificacao: '+key);
  }
}
assert.ok(durable>=4&&transient>=2&&cache>=1,'Persistencia, estados transitorios e cache devem manter classificacao.');
assert.equal(CLASSIFIED_STORAGE_KEYS.size,keys.size,'Registro de chaves classificadas nao pode omitir nem inventar aliases.');
for(const name of ['characters','campaigns','sessions','adventures','settings'])assert.equal(storageRecord(name)?.scope,'durable');
for(const name of ['collaboration-session','master-preview'])assert.equal(storageRecord(name)?.scope,'transient');
assert.equal(storageRecord('inexistente'),null);

const html=fs.readFileSync(new URL('../configuracoes.html',import.meta.url),'utf8');
for(const id of ['storage-key','export-data','import-data','restore-backup'])assert.ok(!html.includes('id="'+id+'"'),'Configurações nao podem reintroduzir controle de backup: '+id);
assert.ok(!html.includes('>Persistência<'),'A area de Persistência nao integra a pagina atual.');

console.log('OK — Armazenamento versionado e classificado; Backup, importacao e restauracao permanecem fora da v1.0.1.');
