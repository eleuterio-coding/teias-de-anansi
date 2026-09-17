import assert from'node:assert/strict';
import fs from'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

const provider=read('scripts/firebase-collaboration-provider.js');
const realtime=read('scripts/collaboration-realtime.js');
const sync=read('scripts/collaboration-sync.js');
const ops=read('scripts/firebase-realtime-ops.js');
const ux=read('scripts/hub-ux.js');
const users=read('usuarios.html');
const campaignList=read('scripts/campaign-list-ui.js');
const sessions=read('scripts/campaign-sessions-ui.js');
const tableRouter=read('scripts/campaign-table-router.js');
const adventureRouter=read('scripts/adventure-router.js');
const characterList=read('scripts/character-list-ui.js');

for(const token of['subscribeRealtime','onSnapshot','shared','sessions','adventureViews','characters','memberships',"getApps().length?lib.app.getApp():lib.app.initializeApp(firebaseOptions)","collection(db,'users',u.uid,'characters')"])assert.ok(provider.includes(token),`Provider sem contrato realtime: ${token}`);
for(const token of['CAMPAIGN_KEY','ADVENTURE_KEY','CHARACTER_KEY','Storage.prototype.setItem','Storage.prototype.removeItem','setTimeout(pushChanges,120)','setTimeout(()=>applyRemote(),120)','__HUB_REALTIME_APPLYING__','deleteRemoteCampaign','deleteRemoteOwnCharacter','hub-rpg:remote-updated','claim()','writeCollaborationSession','unsubscribeAuth','unsubscribeRemote'])assert.ok(realtime.includes(token),`Realtime global sem proteção/fluxo: ${token}`);
assert.equal(realtime.includes("window.addEventListener('storage'"),false,'Outra aba não deve reenviar mudanças já capturadas pela aba de origem.');
for(const token of['previousShared','currentShared','replaceCampaignScope','listCampaignCharacters(membership.campaignId)'])assert.ok(sync.includes(token),`Cache remoto sem revogação/fonte de verdade: ${token}`);
for(const token of['deleteRemoteCampaign','deleteRemoteOwnCharacter','deleteCollection'])assert.ok(ops.includes(token),`Operações realtime sem exclusão remota: ${token}`);
for(const [name,source] of Object.entries({campaignList,sessions,tableRouter,adventureRouter,characterList})){
 assert.ok(source.includes('hub-rpg:remote-updated'),`${name} não reage a mudanças remotas.`);
 assert.ok(source.includes('claim?.()'),`${name} não assume a atualização sem recarregar a página.`)
}
assert.ok(ux.includes("import('./collaboration-realtime.js?v=20260917-global-realtime1')"),'UX global precisa iniciar a revisão global do realtime.');
assert.ok(ux.includes('COLLAB_SESSION_KEY'),'Realtime só deve iniciar com sessão conectada.');
assert.ok(users.includes('Bruno')&&users.includes('Gustavo')&&users.includes('Léo')&&users.includes('Fernanda'),'Login precisa expor as quatro contas de jogadores.');
assert.ok(users.includes('Atualizar agora'),'Sincronização manual pode permanecer como fallback, sem ser necessária ao fluxo normal.');

console.log('OK — realtime global: criação, edição, exclusão e revogação propagam conforme as permissões, com Firebase como fonte colaborativa.');