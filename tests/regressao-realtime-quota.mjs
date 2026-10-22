import assert from 'node:assert/strict';
import fs from 'node:fs';
import {charactersNeedingUpload} from '../scripts/collaboration-sync.js';

const remote=[{id:'c1',updatedAt:'2026-10-22T10:00:00Z',name:'Ficha'}];
assert.deepEqual(charactersNeedingUpload(remote,remote),[],
 'Uma ficha igual à remota nunca deve ser enviada no ciclo do listener.');
assert.deepEqual(charactersNeedingUpload([{...remote[0]}],remote),[],
 'Uma segunda sincronização idempotente não deve gerar novas escritas.');
assert.deepEqual(charactersNeedingUpload([{...remote[0],updatedAt:'2026-10-22T10:01:00Z'}],remote).map(c=>c.id),['c1'],
 'Uma edição local mais recente deve ser enviada.');
assert.deepEqual(charactersNeedingUpload([{id:'nova',updatedAt:'2026-10-22T10:01:00Z'}],remote).map(c=>c.id),['nova'],
 'Uma ficha local ainda não publicada deve ser enviada.');
assert.deepEqual(charactersNeedingUpload([{...remote[0],updatedAt:'2026-10-22T09:59:00Z'}],remote),[],
 'Uma ficha local antiga não pode substituir a versão remota.');
const provider=fs.readFileSync(new URL('../scripts/firebase-collaboration-provider.js',import.meta.url),'utf8');
assert.match(provider,/if\(Object\.keys\(update\)\.length\)\{update\.updatedAt=f\.serverTimestamp\(\);await f\.setDoc/);
const sync=fs.readFileSync(new URL('../scripts/collaboration-sync.js',import.meta.url),'utf8');
assert.equal((sync.match(/charactersNeedingUpload\(mergedOwn,liveRemote\)/g)||[]).length,2,
 'Ramos Mestre e Jogador precisam evitar uploads redundantes.');
console.log('OK — sincronização de fichas é idempotente e não cria ciclo de gravações.');
