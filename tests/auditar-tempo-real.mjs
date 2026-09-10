import assert from'node:assert/strict';
import fs from'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

const provider=read('scripts/firebase-collaboration-provider.js');
const realtime=read('scripts/collaboration-realtime.js');
const sync=read('scripts/collaboration-sync.js');
const ux=read('scripts/hub-ux.js');
const users=read('usuarios.html');

for(const token of['subscribeRealtime','onSnapshot','shared','sessions','adventureViews','characters','memberships'])assert.ok(provider.includes(token),`Provider sem contrato realtime: ${token}`);
for(const token of['CAMPAIGN_KEY','ADVENTURE_KEY','CHARACTER_KEY','Storage.prototype.setItem','setTimeout(pushChanges,650)','setTimeout(()=>applyRemote(),180)','__HUB_REALTIME_APPLYING__','writeCollaborationSession','unsubscribeAuth','unsubscribeRemote'])assert.ok(realtime.includes(token),`Realtime sem proteção/fluxo: ${token}`);
assert.equal(realtime.includes("window.addEventListener('storage'"),false,'Outra aba não deve reenviar mudanças já capturadas pela aba de origem.');
assert.ok(sync.includes('listCampaignCharacters(membership.campaignId)'), 'Mestre precisa receber a ficha remota do Jogador.');
assert.ok(ux.includes("import('./collaboration-realtime.js?v=20260910-realtime1')"),'UX global precisa iniciar realtime sob demanda.');
assert.ok(ux.includes('COLLAB_SESSION_KEY'),'Realtime só deve iniciar com sessão conectada.');
assert.ok(users.includes('Tempo real'),'Tela Jogadores deve comunicar o modo automático.');
assert.ok(users.includes('Atualizar agora'),'Sincronização manual deve permanecer apenas como fallback.');

console.log('OK — tempo real bidirecional: listeners Firestore, push automático, acessos atualizados e proteção contra loops.');
