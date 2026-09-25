import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=path=>fs.readFileSync(path,'utf8');
const modules=[
 'scripts/image-media.js',
 'scripts/campaign-state.js',
 'scripts/adventure-state.js',
 'scripts/collaboration-model.js',
 'scripts/firebase-collaboration-provider.js',
 'scripts/campaign-list-ui.js',
 'scripts/campaign-table-ui.js',
 'scripts/campaign-table-router.js',
 'scripts/adventure-ui.js',
 'scripts/adventure-router.js',
 'scripts/campaign-sessions-ui.js'
];
for(const file of modules)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});

const media=read('scripts/image-media.js');
assert.match(media,/export async function optimizeImage/);
assert.match(media,/export async function uploadImage/);
assert.match(media,/export async function hydrateMediaImages/);
assert.match(media,/MAX_OUTPUT_BYTES=1800000/);
assert.match(media,/image\/webp/);

const campaigns=read('scripts/campaign-state.js');
assert.match(campaigns,/coverImage:sanitizeMediaRef\(row\.coverImage\)/);
assert.match(campaigns,/coverImageUrl:String\(row\.coverImageUrl/);

const adventures=read('scripts/adventure-state.js');
assert.match(adventures,/coverImage:sanitizeMediaRef\(row\.coverImage\)/);

const collaboration=read('scripts/collaboration-model.js');
assert.match(collaboration,/coverImage:mediaRef\(campaign\.coverImage\)/);
assert.match(collaboration,/coverImage:mediaRef\(session\.coverImage\)/);
assert.match(collaboration,/coverImage:mediaRef\(adventure\.coverImage\)/);

const provider=read('scripts/firebase-collaboration-provider.js');
for(const method of ['saveMedia','readMedia','deleteMedia'])assert.match(provider,new RegExp(`async ${method}\\(`));
assert.match(provider,/480\*1024/);
assert.match(provider,/Bytes\.fromUint8Array/);

const rules=read('firebase/firestore.rules');
assert.match(rules,/match \/media\/\{mediaId\}/);
assert.match(rules,/match \/chunks\/\{chunkId\}/);
assert.match(rules,/assignedAdventure\(data\.campaignId, data\.entityId\)/);
assert.match(rules,/assignedSession\(data\.campaignId, data\.entityId\)/);
assert.match(rules,/request\.resource\.data\.ownerId == request\.auth\.uid/);
const mediaRules=rules.slice(rules.indexOf('match /media/{mediaId}'),rules.indexOf('match /users/{uid}'));
assert.ok(mediaRules.includes('allow create: if signedIn()'));
assert.equal(mediaRules.includes('canManage(request.resource.data.campaignId)'),false,'Upload local não pode depender de Campanha já publicada.');

const campanhas=read('campanhas.html');
assert.match(campanhas,/id="campaign-cover-picker"/);
assert.doesNotMatch(campanhas,/id="campaign-cover" type="url"/);

const sessoes=read('sessoes.html');
assert.match(sessoes,/id="new-session-cover-picker"/);

console.log('Upload de imagens auditado: pipeline, estados, colaboração, regras e telas estão conectados.');
